-- 0016_course_ownership.sql
--
-- Gives a course an owner, and adds the predicates the teacher policies in 0017
-- are built from.
--
-- The model in one sentence: **a course has an owner; everything beneath a
-- course inherits that owner by walking up to it.** Modules, quizzes,
-- questions, answers and tasks carry no owner column of their own, so there is
-- exactly one place a course can change hands and no possibility of a module
-- disagreeing with its course about who owns it.

-- ---------------------------------------------------------------------------
-- Ownership column
-- ---------------------------------------------------------------------------
--
-- Deliberately separate from `created_by`. That column is audit metadata — who
-- first inserted the row — and answering "who is responsible for this course
-- now" with it would mean a reassignment had to falsify the audit trail.
-- ON DELETE SET NULL matches created_by: if the owning account is removed the
-- course becomes ownerless, which fails closed (no teacher matches NULL).

alter table public.courses
  add column if not exists owner_id uuid references public.profiles (id) on delete set null;

-- Existing rows predate the column; their creator is the best available owner.
update public.courses set owner_id = created_by where owner_id is null;

alter table public.courses alter column owner_id set default auth.uid();

comment on column public.courses.owner_id is
  'The teacher (or admin) responsible for this course. Authorization key for every teacher policy; distinct from created_by, which is audit only.';

-- Every ownership check filters on this, on every content table's parent.
create index if not exists courses_owner_id_idx on public.courses (owner_id);

-- ---------------------------------------------------------------------------
-- Role predicates
-- ---------------------------------------------------------------------------
--
-- SECURITY DEFINER throughout, matching is_admin(): these run inside RLS
-- policies and must not themselves be subject to RLS or evaluation recurses.
-- Always call them as `(select public.fn())` in a policy so Postgres evaluates
-- them once as an InitPlan rather than once per row.

create or replace function public.is_teacher()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role = 'teacher' from public.profiles where id = auth.uid()),
    false
  );
$$;

comment on function public.is_teacher() is
  'True when the current JWT belongs to a profile with role = teacher.';

create or replace function public.is_staff()
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select coalesce(
    (select role in ('admin', 'teacher') from public.profiles where id = auth.uid()),
    false
  );
$$;

comment on function public.is_staff() is
  'True for admins and teachers — anyone who may reach the authoring UI at all.';

-- ---------------------------------------------------------------------------
-- Ownership predicates
-- ---------------------------------------------------------------------------

create or replace function public.owns_course(p_course_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.courses
    where id = p_course_id
      and owner_id = auth.uid()
  );
$$;

/*
 * The predicate every authoring policy actually uses.
 *
 * Admins bypass ownership entirely; a teacher must own the course. Writing it
 * once here rather than repeating `is_admin() or owns_course(...)` in thirty
 * policies means the rule can only be changed in one place.
 */
create or replace function public.can_author_course(p_course_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select (select public.is_admin()) or public.owns_course(p_course_id);
$$;

comment on function public.can_author_course(uuid) is
  'True when the caller may create or modify content belonging to this course.';

-- The walk-up chain. Each level resolves to its course and defers to the rule
-- above, so none of them can drift apart.

create or replace function public.can_author_module(p_module_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.modules m
    where m.id = p_module_id
      and public.can_author_course(m.course_id)
  );
$$;

create or replace function public.can_author_quiz(p_quiz_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.quizzes q
    where q.id = p_quiz_id
      and public.can_author_module(q.module_id)
  );
$$;

create or replace function public.can_author_question(p_question_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.questions qn
    where qn.id = p_question_id
      and public.can_author_quiz(qn.quiz_id)
  );
$$;

create or replace function public.can_author_task(p_task_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.tasks t
    where t.id = p_task_id
      and public.can_author_module(t.module_id)
  );
$$;

/*
 * True when the given student has any purchase on a course the caller owns.
 *
 * This exists solely so a teacher can see the *names* of the students on their
 * own courses — the admin list endpoints embed `profiles(...)`, and without a
 * matching read policy those come back null and the UI shows blanks. It is
 * deliberately narrow: a teacher learns nothing about users who never touched
 * one of their courses.
 */
create or replace function public.teaches_student(p_student_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.purchases p
    join public.courses c on c.id = p.course_id
    where p.student_id = p_student_id
      and c.owner_id = auth.uid()
  );
$$;

revoke all on function public.is_teacher() from public;
revoke all on function public.is_staff() from public;
revoke all on function public.owns_course(uuid) from public;
revoke all on function public.can_author_course(uuid) from public;
revoke all on function public.can_author_module(uuid) from public;
revoke all on function public.can_author_quiz(uuid) from public;
revoke all on function public.can_author_question(uuid) from public;
revoke all on function public.can_author_task(uuid) from public;
revoke all on function public.teaches_student(uuid) from public;

grant execute on function public.is_teacher() to authenticated, service_role;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.owns_course(uuid) to authenticated, service_role;
grant execute on function public.can_author_course(uuid) to anon, authenticated, service_role;
grant execute on function public.can_author_module(uuid) to authenticated, service_role;
grant execute on function public.can_author_quiz(uuid) to authenticated, service_role;
grant execute on function public.can_author_question(uuid) to authenticated, service_role;
grant execute on function public.can_author_task(uuid) to authenticated, service_role;
grant execute on function public.teaches_student(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Column-level guards
-- ---------------------------------------------------------------------------
--
-- RLS grants or denies whole rows and cannot say "this role may update every
-- column except these two". `published` and `owner_id` both need exactly that,
-- so they are enforced by a trigger — the same pattern 0003 uses to protect
-- profiles.role.
--
-- SECURITY INVOKER is required so `current_user` reflects the real caller and
-- the service_role escape hatch works (seeding and server-side routes bypass).

create or replace function public.guard_course_privileged_columns()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $$
begin
  -- Server-side code running as service_role has already authorised itself.
  if current_user = 'service_role' or public.is_admin() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    -- A teacher may only create a draft, and only one they own themselves.
    if new.published then
      raise exception 'Only an admin may publish a course'
        using errcode = '42501';
    end if;
    if new.owner_id is distinct from auth.uid() then
      raise exception 'A course may only be created under your own ownership'
        using errcode = '42501';
    end if;
  else
    if new.published is distinct from old.published then
      raise exception 'Only an admin may change whether a course is published'
        using errcode = '42501';
    end if;
    if new.owner_id is distinct from old.owner_id then
      raise exception 'Only an admin may transfer course ownership'
        using errcode = '42501';
    end if;
  end if;

  return new;
end;
$$;

comment on function public.guard_course_privileged_columns() is
  'Blocks non-admins from setting courses.published or reassigning courses.owner_id. RLS cannot express column-level rules, so this trigger is the real guard.';

drop trigger if exists courses_guard_privileged_columns on public.courses;
create trigger courses_guard_privileged_columns
  before insert or update on public.courses
  for each row execute function public.guard_course_privileged_columns();
