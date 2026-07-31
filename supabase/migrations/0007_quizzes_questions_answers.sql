-- 0007_quizzes_questions_answers.sql
--
-- DEVIATION FROM SPEC (deliberate, agreed with the project owner):
--
-- The spec models `answers.is_correct` as a column on `answers` and relies on
-- the API layer stripping it before serving a quiz. That does not actually hold:
-- students hold the anon key in the browser and can read the table directly via
-- supabase-js, bypassing the route handler entirely.
--
-- The answer key therefore lives in a separate `answer_keys` table that has NO
-- student-facing RLS policy at all. Students can read `answers` (they need the
-- option text) but the correctness flag is unreachable to them by any query
-- path. Scoring happens server-side against `answer_keys` via the service-role
-- client. This satisfies the spec's own §0 principle — "answers.is_correct must
-- never be exposed to students through a normal read".

create table public.quizzes (
  id uuid primary key default gen_random_uuid(),
  -- unique: 0 or 1 quiz per module
  module_id uuid not null unique references public.modules (id) on delete cascade,
  passing_score integer not null check (passing_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

comment on column public.quizzes.passing_score is 'Percentage threshold, 0-100.';

create trigger quizzes_set_updated_at
  before update on public.quizzes
  for each row execute function public.set_updated_at();

create table public.questions (
  id uuid primary key default gen_random_uuid(),
  quiz_id uuid not null references public.quizzes (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

create trigger questions_set_updated_at
  before update on public.questions
  for each row execute function public.set_updated_at();

create index questions_quiz_id_idx on public.questions (quiz_id);

create table public.answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid not null references public.questions (id) on delete cascade,
  text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null
);

-- Supports the composite FK from answer_keys, which is what keeps
-- answer_keys.question_id from drifting out of sync with answers.question_id.
alter table public.answers
  add constraint answers_id_question_id_key unique (id, question_id);

create trigger answers_set_updated_at
  before update on public.answers
  for each row execute function public.set_updated_at();

create index answers_question_id_idx on public.answers (question_id);

-- The answer key. Admin- and service-role-only; see 0014 for the (absent)
-- student policies.
create table public.answer_keys (
  id uuid primary key default gen_random_uuid(),
  answer_id uuid not null unique,
  question_id uuid not null,
  is_correct boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  created_by uuid default auth.uid() references auth.users (id) on delete set null,
  updated_by uuid references auth.users (id) on delete set null,
  constraint answer_keys_answer_fk
    foreign key (answer_id, question_id)
    references public.answers (id, question_id)
    on delete cascade
);

comment on table public.answer_keys is
  'Correctness flag for each answer. No student RLS policy — never readable by students.';

create trigger answer_keys_set_updated_at
  before update on public.answer_keys
  for each row execute function public.set_updated_at();

-- Exactly one correct answer per question (the spec's single-correct-answer rule).
create unique index one_correct_answer_per_question
  on public.answer_keys (question_id)
  where is_correct = true;

create index answer_keys_question_id_idx on public.answer_keys (question_id);

-- Guarantees every answer has a key row, so the admin nested-create payload
-- only ever has to flip is_correct rather than manage a second table.
create or replace function public.ensure_answer_key()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.answer_keys (answer_id, question_id, is_correct)
  values (new.id, new.question_id, false)
  on conflict (answer_id) do nothing;
  return new;
end;
$$;

create trigger answers_ensure_answer_key
  after insert on public.answers
  for each row execute function public.ensure_answer_key();
