-- 0018_fix_ownership_guard_on_cascade.sql
--
-- Fixes a real bug in 0016: deleting a teacher's account failed.
--
-- ## What went wrong
--
-- `courses.owner_id` is `references profiles(id) on delete set null`. Removing
-- a user therefore cascades into an UPDATE on `courses` that nulls owner_id —
-- and `guard_course_privileged_columns()` saw a change to owner_id by someone
-- who was neither `service_role` nor an admin, and raised 42501. The delete
-- rolled back, so teacher accounts could not be removed at all (not through
-- the seed, not through the Supabase dashboard).
--
-- The cascade runs as `supabase_auth_admin` with **no JWT**, so `auth.uid()` is
-- null and `is_admin()` is false. That is the tell: every user-initiated write
-- reaches Postgres through PostgREST with a JWT attached, so an absent
-- `auth.uid()` means this is an internal operation — a cascade, a migration, a
-- server-side job — and not somebody trying to seize a course.
--
-- ## Why this doesn't weaken the guard
--
-- The rule it enforces (a teacher may not publish or reassign a course) is
-- about authenticated users, and they always have `auth.uid()`. RLS
-- independently restricts UPDATE on `courses` to `authenticated`, so an
-- anonymous session cannot reach this trigger through the API at all.
--
-- Verified by `npm run db:verify-rls`, which still asserts that a signed-in
-- teacher can neither publish nor transfer ownership.

create or replace function public.guard_course_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Server-side code running as service_role has already authorised itself.
  --
  -- `auth.uid() is null` covers internal writes with no session at all: FK
  -- cascades (notably ON DELETE SET NULL against this very column), migrations
  -- and maintenance. Those are not user actions and must not be blocked.
  if current_user = 'service_role'
     or auth.uid() is null
     or public.is_admin()
  then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A teacher may only create a draft, and only one they own themselves.
    if new.published then
      raise exception 'Only an admin may publish a course'
        using errcode = '42501';
    end if;
    if new.owner_id is distinct from auth.uid() then
      raise exception 'A course may only be created under your own ownership'
        using errcode = '42501';
    end if;
  else
    if new.published is distinct from old.published then
      raise exception 'Only an admin may change whether a course is published'
        using errcode = '42501';
    end if;
    if new.owner_id is distinct from old.owner_id then
      raise exception 'Only an admin may transfer course ownership'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;
