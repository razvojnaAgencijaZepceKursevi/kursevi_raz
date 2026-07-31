-- 0008_tasks_and_files.sql

create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  -- unique: 0 or 1 task per module
  module_id uuid not null unique references public.modules (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_files (
  id uuid primary key default gen_random_uuid(),
  task_id uuid not null references public.tasks (id) on delete cascade,
  -- Object path inside the `task-files` bucket: {course_id}/{module_id}/{filename}
  file_path text not null,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger task_files_set_updated_at
  before update on public.task_files
  for each row execute function public.set_updated_at();

create index task_files_task_id_idx on public.task_files (task_id);
