-- 0020_profile_deactivation.sql
--
-- Lets an admin deactivate an account.
--
-- ## Why the real enforcement is not in this file
--
-- Deactivation is enforced by Supabase Auth, not by RLS: the API route bans the
-- user (`auth.admin.updateUserById(id, { ban_duration })`), which blocks sign-in
-- at the point sign-in actually happens.
--
-- The alternative — a flag consulted by RLS — would have to be re-checked in
-- every policy on every table, because a deactivated user still holds a valid
-- JWT and still satisfies `auth.uid()`. Miss one policy and the account is only
-- partly disabled. Banning needs no policy changes at all.
--
-- `deactivated_at` therefore exists for the *app*: `auth.users` is not exposed
-- through PostgREST, so without this column the admin screens could not show or
-- filter who is deactivated without a separate Admin API call per user. The
-- route writes both, ban first — see the note there on ordering.
--
-- Treat auth as the source of truth. If the two ever disagree, the ban wins.

alter table public.profiles
  add column deactivated_at timestamptz;

comment on column public.profiles.deactivated_at is
  'When the account was deactivated, mirroring the auth-level ban for display and filtering. NOT the enforcement mechanism — auth.users.banned_until is.';

create index profiles_deactivated_at_idx
  on public.profiles (deactivated_at)
  where deactivated_at is not null;

-- ---------------------------------------------------------------------------
-- Staff powers stop at deactivation
-- ---------------------------------------------------------------------------
--
-- Defence in depth. A ban blocks new sign-ins, but an access token already
-- issued stays valid until it expires (~1h), so a just-deactivated admin or
-- teacher would otherwise keep full authoring rights for the rest of that
-- window. Folding the check into the three role predicates closes it in one
-- place, and every policy in 0014/0017 inherits it.
--
-- Note this composes with 0019: `owns_course()` now requires `is_staff()`, so a
-- deactivated teacher loses course authoring through the same edit.
--
-- Students are deliberately not covered here — their policies key off
-- `auth.uid()` directly, and re-checking a flag across all of them is the
-- sprawl this design avoids. The ban stops the next sign-in; the residual
-- window is one token lifetime.

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
      and deactivated_at is null
  ) into result;
  return coalesce(result, false);
end;
$$;

comment on function public.is_admin() is
  'True when the current JWT belongs to an active profile with role = admin.';

create or replace function public.is_teacher()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select role = 'teacher' and deactivated_at is null
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

comment on function public.is_teacher() is
  'True when the current JWT belongs to an active profile with role = teacher.';

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (
      select role in ('admin', 'teacher') and deactivated_at is null
      from public.profiles
      where id = auth.uid()
    ),
    false
  );
$$;

comment on function public.is_staff() is
  'True for active admins and teachers — anyone who may reach the authoring UI at all.';
