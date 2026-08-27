-- 0027_issue_notification_types.sql
--
-- Alone in its own file, and that is the rule: Postgres will not let a value
-- added by `ALTER TYPE … ADD VALUE` be *used* in the same transaction. Several
-- additions together are fine — what must not happen is a migration that adds
-- a value and then inserts or compares against it. Nothing here does; the app
-- uses them on later requests.

alter type public.notification_type add value if not exists 'issue_opened';
alter type public.notification_type add value if not exists 'issue_reply';
alter type public.notification_type add value if not exists 'issue_closed';
