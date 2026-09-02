-- 0032_fix_updated_at_triggers.sql
--
-- Applies `set_updated_at_only()` (0031) to the two older tables that had the
-- same latent fault, one of which was a live bug.
--
-- ## What was wrong
--
-- `set_updated_at()` assigns `new.updated_by`, so it can only be attached to a
-- table that has that column. `issues` (0026) and `notification_preferences`
-- (0025) have `updated_at` but not `updated_by`, and both were wired to it.
--
-- The reason nobody noticed is worth writing down, because it is what made this
-- invisible for six migrations:
--
--   1. it fires on UPDATE only, never INSERT — so the *first* write to a row
--      always succeeded, and
--   2. the assignment is guarded by `if auth.uid() is not null`, so any write
--      through the **service-role** client skipped it silently.
--
-- Every code path that touches `issues` goes through the service role, so that
-- one never bit. `notification_preferences` does not: `PATCH
-- /api/notification-preferences` uses the caller's own client, because the row
-- genuinely is the user's to set. So changing a notification switch worked the
-- first time (insert) and returned a 500 the second time (update).
--
-- Confirmed against the running database with a signed-in JWT before fixing:
-- `INSERT: ok / UPDATE: ERROR record "new" has no field "updated_by"` for both
-- tables.
--
-- ## Why swap the trigger rather than add the column
--
-- Neither table can answer "who changed this" with anything new.
-- `notification_preferences` is keyed by `user_id` and only its owner may
-- write it, so `updated_by` could only ever repeat the key. `issues` is
-- narrower still — the reporter and admins — and the interesting actor there is
-- already recorded as `closed_by`, or as the author of a message in the thread.
--
-- Adding a column to satisfy a trigger would be the tail wagging the dog.

drop trigger if exists issues_set_updated_at on public.issues;

create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at_only();

drop trigger if exists notification_preferences_set_updated_at on public.notification_preferences;

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at_only();
