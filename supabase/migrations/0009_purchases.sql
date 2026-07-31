-- 0009_purchases.sql

create table public.purchases (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.profiles (id) on delete cascade,
  course_id uuid not null references public.courses (id) on delete cascade,
  -- Snapshot of courses.price at request time, so later price edits do not
  -- rewrite history on an already-approved purchase.
  price numeric(10, 2) not null check (price >= 0),
  status public.purchase_status not null default 'requested',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger purchases_set_updated_at
  before update on public.purchases
  for each row execute function public.set_updated_at();

create index purchases_student_id_course_id_idx on public.purchases (student_id, course_id);

-- Access gating reads this constantly ("does this student own that course?"),
-- so the approved subset gets its own partial index.
create index purchases_approved_idx
  on public.purchases (student_id, course_id)
  where status = 'approved';

-- A student should not be able to stack duplicate open requests for one course.
-- Denied requests are excluded so a student can re-request after a rejection.
create unique index purchases_one_open_request_per_course
  on public.purchases (student_id, course_id)
  where status in ('requested', 'approved');
