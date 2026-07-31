-- 0002_helper_functions_and_triggers.sql
-- Shared helpers attached to every table below.

-- Auto-maintains the audit columns on UPDATE. `updated_by` is only overwritten
-- when a caller identity is available — service-role writes (quiz scoring,
-- certificate issue) have no auth.uid(), and must not blank out the last human
-- editor.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  if auth.uid() is not null then
    new.updated_by = auth.uid();
  end if;
  return new;
end;
$$;

comment on function public.set_updated_at() is
  'BEFORE UPDATE trigger: refreshes updated_at and, when a JWT is present, updated_by.';

-- Role check used by nearly every RLS policy.
--
-- SECURITY DEFINER is what makes this safe to call from a policy on `profiles`
-- itself: it runs as the owner and therefore bypasses RLS, so there is no
-- recursive policy evaluation.
--
-- Written in plpgsql rather than sql deliberately — public.profiles does not
-- exist until 0003, and a `language sql` body would fail validation at creation
-- time. plpgsql defers body validation to first execution.
--
-- Always call this as `(select public.is_admin())` inside a policy so Postgres
-- evaluates it once as an InitPlan instead of once per row.
create or replace function public.is_admin()
returns boolean
language plpgsql
security definer
stable
set search_path = public, pg_temp
as $$
declare
  result boolean;
begin
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  ) into result;
  return coalesce(result, false);
end;
$$;

comment on function public.is_admin() is
  'True when the current JWT belongs to a profile with role = admin.';

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated, service_role;

-- Tolerant text -> uuid cast, used by the storage policies where a path segment
-- is attacker-controlled and may not be a uuid at all.
create or replace function public.safe_uuid(p_value text)
returns uuid
language plpgsql
immutable
as $$
begin
  return p_value::uuid;
exception
  when others then
    return null;
end;
$$;

comment on function public.safe_uuid(text) is
  'Casts text to uuid, returning null instead of raising on malformed input.';
