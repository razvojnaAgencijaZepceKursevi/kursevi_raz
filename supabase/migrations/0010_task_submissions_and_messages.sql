-- 0010_task_submissions_and_messages.sql

create table public.task_submissions (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  status public.task_submission_status not null default 'pending',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger task_submissions_set_updated_at
  before update on public.task_submissions
  for each row execute function public.set_updated_at();

-- Non-unique: the spec describes "one *active* submission thread per student per
-- task", which does not preclude a second thread after one is resolved. The
-- "only one open thread" rule is enforced by the partial index below instead.
create index task_submissions_task_id_student_id_idx
  on public.task_submissions (task_id, student_id);

create unique index task_submissions_one_open_per_student_task
  on public.task_submissions (task_id, student_id)
  where status in ('pending', 'needs_revision');

create table public.task_messages (
  id uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.task_submissions (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  -- Object path inside `task-message-attachments`: {submission_id}/{filename}
  attachment_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger task_messages_set_updated_at
  before update on public.task_messages
  for each row execute function public.set_updated_at();

create index task_messages_submission_id_created_at_idx
  on public.task_messages (submission_id, created_at);
