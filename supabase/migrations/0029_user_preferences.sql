-- 0029_user_preferences.sql
--
-- Per-user settings that are neither identity nor notification routing: the
-- colour scheme, and whether the person wants the newsletter.
--
-- ## Why a table rather than columns on `profiles`
--
-- `profiles` is the authorization record — `role` lives there, guarded by a
-- trigger, and `profiles_update_own_or_admin` lets a user write their own row.
-- **RLS grants a whole row, never a column** (the rule this project keeps
-- rediscovering), so every new self-writable column on `profiles` widens what
-- a user can reach through PostgREST and has to be reasoned about against that
-- trigger. A preference is not an authorization fact and should not share a
-- table with one.
--
-- ## Why not `notification_preferences`
--
-- That table is keyed `(user_id, type)` — one row per notification type. Both
-- settings here are one-per-user, so they would have to invent fake types to
-- fit. Different shape, different table.
--
-- ## One row per user, created on demand
--
-- Same sparse approach as `notification_preferences`: a row appears the first
-- time someone changes something, and its absence means "the defaults". That
-- avoids backfilling every existing user and avoids a trigger to seed rows for
-- new ones. The read side merges with defaults — see `DEFAULT_PREFERENCES` in
-- `src/lib/schemas/preferences.schema.ts`.

create table public.user_preferences (
  -- The user *is* the key: one row each, so no surrogate id.
  user_id uuid primary key references public.profiles (id) on delete cascade,

  -- 'system' follows the operating system, which is the honest default: it is
  -- what the browser already reports and what the user has already chosen once,
  -- at the OS level.
  theme text not null default 'system'
    constraint user_preferences_theme_check check (theme in ('light', 'dark', 'system')),

  -- Marketing email, entirely separate from the transactional notifications in
  -- `notification_preferences`. Default false: an opt-in has to be opted into,
  -- and defaulting to true would sign up every existing user retroactively.
  newsletter_opt_in boolean not null default false,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger user_preferences_set_updated_at
  before update on public.user_preferences
  for each row execute function public.set_updated_at();

-- Admins export newsletter recipients by filtering on this, and the whole
-- table is small enough that the partial index is the only one worth having.
create index user_preferences_newsletter_idx
  on public.user_preferences (user_id)
  where newsletter_opt_in;

alter table public.user_preferences enable row level security;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------
--
-- The whole row *is* the user's to set, so unlike `notifications` these are
-- ordinary policies rather than a service-role write behind a route. There is
-- no column here that a user should be prevented from changing.
--
-- Admins may read — that is what makes the newsletter export possible — but
-- deliberately may **not** write: nobody should be able to opt someone else
-- into marketing email, and an admin flipping a user's theme is not a feature.

create policy "user_preferences_select_own_or_admin"
  on public.user_preferences for select
  using (user_id = (select auth.uid()) or (select public.is_admin()));

create policy "user_preferences_insert_own"
  on public.user_preferences for insert
  with check (user_id = (select auth.uid()));

create policy "user_preferences_update_own"
  on public.user_preferences for update
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "user_preferences_delete_own"
  on public.user_preferences for delete
  using (user_id = (select auth.uid()));
