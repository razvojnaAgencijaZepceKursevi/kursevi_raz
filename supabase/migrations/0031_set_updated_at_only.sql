-- 0031_set_updated_at_only.sql
--
-- A second timestamp trigger, for tables that have `updated_at` but no
-- `updated_by`.
--
-- ## The trap
--
-- `set_updated_at()` (0002) does two things:
--
--     new.updated_at = now();
--     if auth.uid() is not null then new.updated_by = auth.uid(); end if;
--
-- so attaching it to a table without an `updated_by` column compiles fine and
-- then fails at runtime with `record "new" has no field "updated_by"` — but
-- only on UPDATE, never on INSERT. `user_preferences` (0029) hit exactly that:
-- the first save of a preference worked (an upsert that inserts), and the
-- second silently 500'd. Caught by a probe that wrote twice; a probe that wrote
-- once would have passed.
--
-- ## Why not just add `updated_by` to that table
--
-- Because it would be a column that is definitionally equal to another one.
-- `user_preferences` is keyed by `user_id` and only its owner may write it
-- (0029's policies), so `updated_by` could never hold anything but `user_id`.
-- Storing that twice invites the two to disagree and tells a future reader
-- there is a distinction where there is none.
--
-- So: a helper for the case where "who changed it" is not a question the table
-- can meaningfully answer. Use `set_updated_at()` when a row has several
-- possible editors, and this one when it has exactly one.

create or replace function public.set_updated_at_only()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_updated_at_only() is
  'BEFORE UPDATE trigger: refreshes updated_at. For tables with no updated_by column — see set_updated_at() for the usual case.';

drop trigger if exists user_preferences_set_updated_at on public.user_preferences;

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at_only();
