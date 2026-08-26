-- 0025_notifications.sql
--
-- Two tables and an enum behind one idea: something happened, and somebody
-- should be told. Delivery has two channels — a row in this table (the in-app
-- bell) and an email — and `notification_preferences` says which of them a
-- given user wants for a given kind of event.
--
-- `create type` followed by a table that uses it is fine in one transaction;
-- the restriction documented elsewhere in this project is on `ALTER TYPE …
-- ADD VALUE`, which cannot be *used* in the transaction that adds it. Adding a
-- twelfth notification type later will therefore need its own migration file.

create type public.notification_type as enum (
  -- Money
  'purchase_requested',          -- to admins: somebody wants access
  'purchase_approved',           -- to the student
  'purchase_denied',             -- to the student
  -- Task submissions
  'submission_received',         -- to the reviewers: work to look at
  'submission_message',          -- to the other side of an open thread
  'submission_needs_revision',   -- to the student
  'submission_approved',         -- to the student
  -- Certificates
  'certificate_issued',          -- to the student: course finished
  'certificate_delivery_requested', -- to admins: post a printed copy
  'certificate_delivered',       -- to the student: it is in the mail
  -- Authoring / account
  'course_published',            -- to the owning teacher, who cannot publish
  'account_role_changed'         -- to the user whose role an admin changed
);

-- ---------------------------------------------------------------------------
-- notifications — one row per person told, not one per event
-- ---------------------------------------------------------------------------
--
-- An event with three recipients writes three rows. That is deliberate: read
-- state, and therefore the unread badge, is per person, and a shared row would
-- need a join table to express the same thing.
--
-- The text is **denormalised on purpose**. A notification is a record of what
-- someone was told at the time, so it must not silently rewrite itself when a
-- course is renamed or a submission is deleted. `link` may therefore point at
-- something that no longer exists — the UI has to tolerate a 404 there.
--
-- No `updated_at` / `created_by`: the only mutation is marking it read, which
-- `read_at` already timestamps, and the actor is part of the story in `body`
-- rather than an authorization fact.
create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  title text not null,
  body text not null,
  -- In-app destination. Nullable: not everything worth saying has a screen.
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- The list query: one person's notifications, newest first.
create index notifications_user_id_created_at_idx
  on public.notifications (user_id, created_at desc);

-- The badge query, which runs on a timer for every signed-in user, so it gets
-- its own partial index rather than filtering the one above.
create index notifications_unread_idx
  on public.notifications (user_id)
  where read_at is null;

-- ---------------------------------------------------------------------------
-- notification_preferences — sparse, and absence means "on"
-- ---------------------------------------------------------------------------
--
-- A row exists only once a user has changed something. That avoids backfilling
-- every existing user times every type, and avoids a trigger to seed rows for
-- new ones — and it means adding a new notification type is a one-line enum
-- change instead of a data migration.
--
-- The cost is that the read side must merge: `GET /api/notification-preferences`
-- returns the full matrix with defaults filled in, so no client ever has to
-- know that a missing row means yes.
create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type public.notification_type not null,
  email_enabled boolean not null default true,
  in_app_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, type)
);

create trigger notification_preferences_set_updated_at
  before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- RLS
-- ---------------------------------------------------------------------------

alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;

-- Read your own, and nobody else's. There is deliberately no admin-read policy:
-- an admin has no business reading the notifications of a specific user, and
-- every fact in here is visible to them through the record it describes.
create policy "notifications_select_own"
  on public.notifications for select
  to authenticated
  using (user_id = (select auth.uid()));

-- No INSERT, UPDATE or DELETE policy at all.
--
-- INSERT is service-role only because a notification is always something the
-- system decided to say; a user-writable notification is just a lie waiting to
-- be told.
--
-- UPDATE is service-role only for the reason RLS keeps forcing on this project:
-- **a policy grants a whole row, never a column**. "Mark as read" is a write to
-- `read_at`, but a policy permitting it would equally permit rewriting `title`
-- and `body` straight through PostgREST — turning the record of what someone
-- was told into whatever they would prefer it had said. `PATCH
-- /api/notifications/:id/read` therefore checks ownership and writes with the
-- service role, exactly like `PATCH /api/messages/:id`.

-- Preferences are different: the whole row *is* the user's to set, so ordinary
-- policies are correct here and no service-role route is needed. The `with
-- check` on user_id is what stops one user writing another's preferences.
create policy "notification_preferences_select_own"
  on public.notification_preferences for select
  to authenticated
  using (user_id = (select auth.uid()));

create policy "notification_preferences_insert_own"
  on public.notification_preferences for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "notification_preferences_update_own"
  on public.notification_preferences for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "notification_preferences_delete_own"
  on public.notification_preferences for delete
  to authenticated
  using (user_id = (select auth.uid()));
