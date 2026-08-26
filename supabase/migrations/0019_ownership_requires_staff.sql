-- 0019_ownership_requires_staff.sql
--
-- Fixes a privilege-retention hole: demoting a teacher did not revoke their
-- authoring rights.
--
-- `owns_course()` tested `owner_id = auth.uid()` and nothing else, so a profile
-- demoted from `teacher` to `student` kept every grant that walks through it —
-- editing the modules, quizzes, questions, answers, tasks and files of any
-- course it still owned, plus reading that course's purchases and certificates
-- (0017's two direct uses of the predicate).
--
-- The app alone did not expose this: `/admin` is role-gated and the authoring
-- routes call `requireStaff()`. But the anon key and project URL are public by
-- design, so a demoted user holding a valid JWT could reach PostgREST directly
-- and still write. RLS is meant to be the authority for *every* client, so the
-- fix belongs here rather than in another `requireStaff()` call.
--
-- Applied inside `owns_course()` rather than at the three call sites, because
-- that predicate is the single choke point every ownership rule already funnels
-- through — 0016 introduced it precisely so the rule could not be restated
-- inconsistently in thirty policies. A fourth caller added later inherits this
-- automatically.

create or replace function public.owns_course(p_course_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select (select public.is_staff())
     and exists (
       select 1
       from public.courses
       where id = p_course_id
         and owner_id = auth.uid()
     );
$$;

comment on function public.owns_course(uuid) is
  'True when the caller is staff AND owns this course. The staff test is not redundant: courses.owner_id survives a role change, so without it a demoted teacher keeps authoring rights on courses they still own.';
