-- 0006_modules_and_files.sql
--
-- Note on the `order` column: `order` is a reserved word in SQL, so it must be
-- double-quoted in every statement that references it. The spec names the
-- column `order`, so that name is kept rather than silently renamed.

create table public.modules (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses (id) on delete cascade,
  title text not null,
  description text,
  video_url text,
  "order" integer not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger modules_set_updated_at
  before update on public.modules
  for each row execute function public.set_updated_at();

-- Drives sequencing/unlock logic. Intentionally NOT unique: reordering modules
-- would otherwise require a deferred constraint dance for every swap.
create index modules_course_id_order_idx on public.modules (course_id, "order");

create table public.module_files (
  id uuid primary key default gen_random_uuid(),
  module_id uuid not null references public.modules (id) on delete cascade,
  -- Object path inside the `module-files` bucket: {course_id}/{module_id}/{filename}
  file_path text not null,
  file_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger module_files_set_updated_at
  before update on public.module_files
  for each row execute function public.set_updated_at();

create index module_files_module_id_idx on public.module_files (module_id);
