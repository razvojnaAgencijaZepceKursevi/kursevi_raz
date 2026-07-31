-- 0011_module_progress.sql
--
-- Written exclusively by service-role API routes (quiz attempt, submission
-- approval). Students get SELECT and nothing else — see 0014.

create table public.module_progress (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  student_id uuid not null references public.profiles (id) on delete cascade,
  quiz_done boolean not null default false,
  task_done boolean not null default false,
  -- Server-computed on every write; never trusted from the client.
  completed boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger module_progress_set_updated_at
  before update on public.module_progress
  for each row execute function public.set_updated_at();

create unique index module_progress_module_id_student_id_key
  on public.module_progress (module_id, student_id);

create index module_progress_student_id_idx on public.module_progress (student_id);

-- `completed` is derived, so it is computed in the database rather than trusted
-- from whichever route happened to perform the write:
--   completed = (no quiz for module OR quiz_done) AND (no task for module OR task_done)
create or replace function public.recompute_module_progress_completed()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  has_quiz boolean;
  has_task boolean;
begin
  select exists (select 1 from public.quizzes where module_id = new.module_id) into has_quiz;
  select exists (select 1 from public.tasks where module_id = new.module_id) into has_task;

  new.completed := (not has_quiz or new.quiz_done)
               and (not has_task or new.task_done);

  return new;
end;
$$;

create trigger module_progress_recompute_completed
  before insert or update on public.module_progress
  for each row execute function public.recompute_module_progress_completed();
