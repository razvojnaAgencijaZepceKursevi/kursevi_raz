-- 0005_courses.sql

create table public.courses (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references public.categories (id) on delete set null,
  name text not null,
  description text,
  price numeric(10, 2) not null default 0 check (price >= 0),
  -- Object path inside the public `course-thumbnails` bucket: {course_id}/{filename}
  thumbnail_path text,
  published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger courses_set_updated_at
  before update on public.courses
  for each row execute function public.set_updated_at();

create index courses_category_id_idx on public.courses (category_id);
-- Public listings always filter on published; partial index keeps that path cheap.
create index courses_published_idx on public.courses (published) where published = true;
