-- 0026_support_issues.sql
--
-- A way for any signed-in user to reach the admins: "I can't open module 3",
-- "my certificate has the wrong name", "how do I get a refund". Deliberately
-- modelled on `task_submissions` / `task_messages`, because it is the same
-- shape — a record with a status, and a thread of messages under it — and
-- copying a shape the codebase already knows is cheaper than inventing one.
--
-- What is *not* copied: the authorization. A task submission is scoped to a
-- course and its reviewing teacher; an issue is between one user and the
-- admins. Teachers get no special access here, because an issue may be *about*
-- a teacher.

create type public.issue_status as enum ('open', 'answered', 'closed');

create table public.issues (
  id uuid primary key default gen_random_uuid(),
  -- The person who raised it. Any role may: an admin can file one too.
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null,
  status public.issue_status not null default 'open',
  -- Set when an admin closes it, so "who dealt with this" survives.
  closed_at timestamptz,
  closed_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger issues_set_updated_at
  before update on public.issues
  for each row execute function public.set_updated_at();

create index issues_reporter_id_created_at_idx
  on public.issues (reporter_id, created_at desc);

-- The admin queue: everything not yet closed, newest first.
create index issues_open_idx
  on public.issues (created_at desc)
  where status <> 'closed';

create table public.issue_messages (
  id uuid primary key default gen_random_uuid(),
  issue_id uuid not null references public.issues (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index issue_messages_issue_id_created_at_idx
  on public.issue_messages (issue_id, created_at);

-- ---------------------------------------------------------------------------
-- Who may see an issue
-- ---------------------------------------------------------------------------
--
-- Its reporter, and admins. That is the whole rule, and it is deliberately
-- narrower than the submission equivalent: `can_review_submission()` admits the
-- owning teacher, but an issue has no course and may well be a complaint about
-- a teacher. Widening this later is a policy change; leaking it now would not
-- be undoable.

create or replace function public.owns_issue(p_issue_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.issues i
    where i.id = p_issue_id and i.reporter_id = (select auth.uid())
  );
$$;

revoke all on function public.owns_issue(uuid) from public;
grant execute on function public.owns_issue(uuid) to authenticated, service_role;

alter table public.issues enable row level security;
alter table public.issue_messages enable row level security;

create policy "issues_select_own_or_admin"
  on public.issues for select
  to authenticated
  using (reporter_id = (select auth.uid()) or (select public.is_admin()));

-- Anyone signed in may open one, but only as themselves.
create policy "issues_insert_own"
  on public.issues for insert
  to authenticated
  with check (reporter_id = (select auth.uid()));

-- Only admins change an issue's row — that means `status`, `closed_at` and
-- `closed_by`. The reporter re-opens a conversation by replying, not by
-- editing the record, which keeps "who decided this was done" honest.
create policy "issues_admin_update"
  on public.issues for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "issues_admin_delete"
  on public.issues for delete
  to authenticated
  using ((select public.is_admin()));

create policy "issue_messages_select_participant_or_admin"
  on public.issue_messages for select
  to authenticated
  using ((select public.is_admin()) or public.owns_issue(issue_id));

create policy "issue_messages_insert_participant_or_admin"
  on public.issue_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and ((select public.is_admin()) or public.owns_issue(issue_id))
  );

-- No UPDATE or DELETE policy on messages, for the reason this project keeps
-- rediscovering: RLS grants a whole row, never a column. A record of what was
-- said must not be editable by either side afterwards.
