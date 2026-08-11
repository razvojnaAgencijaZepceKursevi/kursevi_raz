-- 0017_teacher_rls_policies.sql
--
-- Opens authoring to teachers, scoped to the courses they own.
--
-- Every policy here follows the same shape: replace `is_admin()` with the
-- matching `can_author_*()` predicate from 0016, which is "admin, OR the
-- teacher who owns the course this row hangs off". Admin behaviour is
-- therefore unchanged everywhere — the policies only ever widen.
--
-- What teachers deliberately do NOT get:
--   * categories and profiles management (admin only)
--   * approving or denying purchases (tied to payment; admin only)
--   * publishing a course, or reassigning its owner (trigger in 0016)
--
-- Note `drop policy if exists` before each create: policies cannot be replaced
-- in place, and this migration has to be re-runnable against a database that
-- already has the 0014 versions.

-- ---------------------------------------------------------------------------
-- Ownership predicate for the submission thread
-- ---------------------------------------------------------------------------
--
-- Submissions hang off a task, which hangs off a module, which hangs off the
-- course. Resolving that chain in one place keeps the four thread policies
-- below readable.

create or replace function public.can_review_submission(p_submission_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.task_submissions s
    join public.tasks t on t.id = s.task_id
    where s.id = p_submission_id
      and public.can_author_module(t.module_id)
  );
$$;

revoke all on function public.can_review_submission(uuid) from public;
grant execute on function public.can_review_submission(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- profiles — a teacher may see the students on their own courses
-- ---------------------------------------------------------------------------
--
-- Needed because the admin list endpoints embed `profiles(...)`; without this a
-- teacher's purchase and submission screens render blank names. Scoped through
-- teaches_student() so a teacher learns nothing about unrelated users.

drop policy if exists "profiles_select_own_or_admin" on public.profiles;
create policy "profiles_select_own_admin_or_taught"
  on public.profiles for select
  to authenticated
  using (
    id = (select auth.uid())
    or (select public.is_admin())
    or ((select public.is_teacher()) and public.teaches_student(id))
  );

-- ---------------------------------------------------------------------------
-- courses
-- ---------------------------------------------------------------------------
--
-- A teacher must see their own drafts, which the published-or-admin rule alone
-- would hide from them.

drop policy if exists "courses_read_published_or_admin" on public.courses;
create policy "courses_read_published_admin_or_owner"
  on public.courses for select
  to anon, authenticated
  using (
    published = true
    or (select public.is_admin())
    or owner_id = (select auth.uid())
  );

drop policy if exists "courses_admin_insert" on public.courses;
create policy "courses_staff_insert"
  on public.courses for insert
  to authenticated
  -- Ownership and the published flag are policed by the 0016 trigger; this only
  -- decides who may insert a course row at all.
  with check ((select public.is_staff()));

drop policy if exists "courses_admin_update" on public.courses;
create policy "courses_author_update"
  on public.courses for update
  to authenticated
  using (public.can_author_course(id))
  with check (public.can_author_course(id));

drop policy if exists "courses_admin_delete" on public.courses;
create policy "courses_author_delete"
  on public.courses for delete
  to authenticated
  using (public.can_author_course(id));

-- ---------------------------------------------------------------------------
-- modules + module_files
-- ---------------------------------------------------------------------------

drop policy if exists "modules_read_purchased_or_admin" on public.modules;
create policy "modules_read_purchased_or_author"
  on public.modules for select
  to authenticated
  using (public.can_author_course(course_id) or public.has_approved_purchase(course_id));

drop policy if exists "modules_admin_insert" on public.modules;
create policy "modules_author_insert"
  on public.modules for insert
  to authenticated
  with check (public.can_author_course(course_id));

drop policy if exists "modules_admin_update" on public.modules;
create policy "modules_author_update"
  on public.modules for update
  to authenticated
  using (public.can_author_course(course_id))
  -- Also checks the NEW row, which is what stops a teacher moving one of their
  -- modules onto somebody else's course.
  with check (public.can_author_course(course_id));

drop policy if exists "modules_admin_delete" on public.modules;
create policy "modules_author_delete"
  on public.modules for delete
  to authenticated
  using (public.can_author_course(course_id));

drop policy if exists "module_files_read_purchased_or_admin" on public.module_files;
create policy "module_files_read_purchased_or_author"
  on public.module_files for select
  to authenticated
  using (public.can_author_module(module_id) or public.can_access_module(module_id));

drop policy if exists "module_files_admin_insert" on public.module_files;
create policy "module_files_author_insert"
  on public.module_files for insert
  to authenticated
  with check (public.can_author_module(module_id));

drop policy if exists "module_files_admin_update" on public.module_files;
create policy "module_files_author_update"
  on public.module_files for update
  to authenticated
  using (public.can_author_module(module_id))
  with check (public.can_author_module(module_id));

drop policy if exists "module_files_admin_delete" on public.module_files;
create policy "module_files_author_delete"
  on public.module_files for delete
  to authenticated
  using (public.can_author_module(module_id));

-- ---------------------------------------------------------------------------
-- quizzes / questions / answers / answer_keys
-- ---------------------------------------------------------------------------

drop policy if exists "quizzes_read_purchased_or_admin" on public.quizzes;
create policy "quizzes_read_purchased_or_author"
  on public.quizzes for select
  to authenticated
  using (public.can_author_module(module_id) or public.can_access_module(module_id));

drop policy if exists "quizzes_admin_insert" on public.quizzes;
create policy "quizzes_author_insert"
  on public.quizzes for insert
  to authenticated
  with check (public.can_author_module(module_id));

drop policy if exists "quizzes_admin_update" on public.quizzes;
create policy "quizzes_author_update"
  on public.quizzes for update
  to authenticated
  using (public.can_author_module(module_id))
  with check (public.can_author_module(module_id));

drop policy if exists "quizzes_admin_delete" on public.quizzes;
create policy "quizzes_author_delete"
  on public.quizzes for delete
  to authenticated
  using (public.can_author_module(module_id));

drop policy if exists "questions_read_purchased_or_admin" on public.questions;
create policy "questions_read_purchased_or_author"
  on public.questions for select
  to authenticated
  using (public.can_author_quiz(quiz_id) or public.can_access_quiz(quiz_id));

drop policy if exists "questions_admin_insert" on public.questions;
create policy "questions_author_insert"
  on public.questions for insert
  to authenticated
  with check (public.can_author_quiz(quiz_id));

drop policy if exists "questions_admin_update" on public.questions;
create policy "questions_author_update"
  on public.questions for update
  to authenticated
  using (public.can_author_quiz(quiz_id))
  with check (public.can_author_quiz(quiz_id));

drop policy if exists "questions_admin_delete" on public.questions;
create policy "questions_author_delete"
  on public.questions for delete
  to authenticated
  using (public.can_author_quiz(quiz_id));

drop policy if exists "answers_read_purchased_or_admin" on public.answers;
create policy "answers_read_purchased_or_author"
  on public.answers for select
  to authenticated
  using (public.can_author_question(question_id) or public.can_access_question(question_id));

drop policy if exists "answers_admin_insert" on public.answers;
create policy "answers_author_insert"
  on public.answers for insert
  to authenticated
  with check (public.can_author_question(question_id));

drop policy if exists "answers_admin_update" on public.answers;
create policy "answers_author_update"
  on public.answers for update
  to authenticated
  using (public.can_author_question(question_id))
  with check (public.can_author_question(question_id));

drop policy if exists "answers_admin_delete" on public.answers;
create policy "answers_author_delete"
  on public.answers for delete
  to authenticated
  using (public.can_author_question(question_id));

-- answer_keys holds which answer is correct. Students must never read it — that
-- rule is unchanged; only the authoring side widens to the owning teacher.

drop policy if exists "answer_keys_admin_select" on public.answer_keys;
create policy "answer_keys_author_select"
  on public.answer_keys for select
  to authenticated
  using (public.can_author_question(question_id));

drop policy if exists "answer_keys_admin_insert" on public.answer_keys;
create policy "answer_keys_author_insert"
  on public.answer_keys for insert
  to authenticated
  with check (public.can_author_question(question_id));

drop policy if exists "answer_keys_admin_update" on public.answer_keys;
create policy "answer_keys_author_update"
  on public.answer_keys for update
  to authenticated
  using (public.can_author_question(question_id))
  with check (public.can_author_question(question_id));

drop policy if exists "answer_keys_admin_delete" on public.answer_keys;
create policy "answer_keys_author_delete"
  on public.answer_keys for delete
  to authenticated
  using (public.can_author_question(question_id));

-- ---------------------------------------------------------------------------
-- tasks + task_files
-- ---------------------------------------------------------------------------

drop policy if exists "tasks_read_purchased_or_admin" on public.tasks;
create policy "tasks_read_purchased_or_author"
  on public.tasks for select
  to authenticated
  using (public.can_author_module(module_id) or public.can_access_module(module_id));

drop policy if exists "tasks_admin_insert" on public.tasks;
create policy "tasks_author_insert"
  on public.tasks for insert
  to authenticated
  with check (public.can_author_module(module_id));

drop policy if exists "tasks_admin_update" on public.tasks;
create policy "tasks_author_update"
  on public.tasks for update
  to authenticated
  using (public.can_author_module(module_id))
  with check (public.can_author_module(module_id));

drop policy if exists "tasks_admin_delete" on public.tasks;
create policy "tasks_author_delete"
  on public.tasks for delete
  to authenticated
  using (public.can_author_module(module_id));

drop policy if exists "task_files_read_purchased_or_admin" on public.task_files;
create policy "task_files_read_purchased_or_author"
  on public.task_files for select
  to authenticated
  using (public.can_author_task(task_id) or public.can_access_task(task_id));

drop policy if exists "task_files_admin_insert" on public.task_files;
create policy "task_files_author_insert"
  on public.task_files for insert
  to authenticated
  with check (public.can_author_task(task_id));

drop policy if exists "task_files_admin_update" on public.task_files;
create policy "task_files_author_update"
  on public.task_files for update
  to authenticated
  using (public.can_author_task(task_id))
  with check (public.can_author_task(task_id));

drop policy if exists "task_files_admin_delete" on public.task_files;
create policy "task_files_author_delete"
  on public.task_files for delete
  to authenticated
  using (public.can_author_task(task_id));

-- ---------------------------------------------------------------------------
-- purchases — teachers read their own courses' requests, and only read
-- ---------------------------------------------------------------------------
--
-- Approving a purchase is the payment-confirmation step, so it stays with
-- admins: the update/delete policies below are untouched from 0014.

drop policy if exists "purchases_select_own_or_admin" on public.purchases;
create policy "purchases_select_own_admin_or_course_owner"
  on public.purchases for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or public.owns_course(course_id)
  );

-- ---------------------------------------------------------------------------
-- task submissions + messages — teachers review their own courses' work
-- ---------------------------------------------------------------------------

drop policy if exists "task_submissions_select_own_or_admin" on public.task_submissions;
create policy "task_submissions_select_own_admin_or_reviewer"
  on public.task_submissions for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or public.can_review_submission(id)
  );

drop policy if exists "task_submissions_admin_update" on public.task_submissions;
create policy "task_submissions_reviewer_update"
  on public.task_submissions for update
  to authenticated
  using (public.can_review_submission(id))
  with check (public.can_review_submission(id));

drop policy if exists "task_messages_select_participant_or_admin" on public.task_messages;
create policy "task_messages_select_participant_admin_or_reviewer"
  on public.task_messages for select
  to authenticated
  using (
    (select public.is_admin())
    or public.owns_submission(submission_id)
    or public.can_review_submission(submission_id)
  );

drop policy if exists "task_messages_insert_participant_or_admin" on public.task_messages;
create policy "task_messages_insert_participant_admin_or_reviewer"
  on public.task_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and (
      (select public.is_admin())
      or public.owns_submission(submission_id)
      or public.can_review_submission(submission_id)
    )
  );

-- ---------------------------------------------------------------------------
-- certificates — teachers see what was earned on their courses
-- ---------------------------------------------------------------------------
--
-- Read only. Certificates are issued by service-role routes on course
-- completion, and nothing about them is editable by a teacher.

drop policy if exists "certificates_select_own_or_admin" on public.certificates;
create policy "certificates_select_own_admin_or_course_owner"
  on public.certificates for select
  to authenticated
  using (
    student_id = (select auth.uid())
    or (select public.is_admin())
    or public.owns_course(course_id)
  );

-- ---------------------------------------------------------------------------
-- Storage — authoring buckets follow the same ownership rule
-- ---------------------------------------------------------------------------
--
-- The RLS policies here read the object path's leading folder, which is the
-- owning id by convention (see 0013). `safe_uuid` is used because that segment
-- is caller-supplied and may not be a uuid at all.
--
--   course-thumbnails  {course_id}/…            -> can_author_course
--   module-files       {course_id}/{module_id}/ -> can_author_course on segment 1
--   task-files         {course_id}/{module_id}/ -> can_author_course on segment 1

drop policy if exists "course_thumbnails_admin_write" on storage.objects;
create policy "course_thumbnails_author_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'course-thumbnails'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "course_thumbnails_admin_update" on storage.objects;
create policy "course_thumbnails_author_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'course-thumbnails'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'course-thumbnails'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "course_thumbnails_admin_delete" on storage.objects;
create policy "course_thumbnails_author_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'course-thumbnails'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "module_files_admin_write" on storage.objects;
create policy "module_files_author_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'module-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "module_files_admin_update" on storage.objects;
create policy "module_files_author_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'module-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'module-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "module_files_admin_delete" on storage.objects;
create policy "module_files_author_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'module-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

-- module-files reads: the owning teacher must be able to see what they uploaded.
drop policy if exists "module_files_read" on storage.objects;
create policy "module_files_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'module-files'
    and (
      public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
      or public.has_approved_purchase(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

drop policy if exists "task_files_admin_write" on storage.objects;
create policy "task_files_author_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'task-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "task_files_admin_update" on storage.objects;
create policy "task_files_author_update"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'task-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  )
  with check (
    bucket_id = 'task-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "task_files_admin_delete" on storage.objects;
create policy "task_files_author_delete"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'task-files'
    and public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
  );

drop policy if exists "task_files_read" on storage.objects;
create policy "task_files_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-files'
    and (
      public.can_author_course(public.safe_uuid((storage.foldername(name))[1]))
      or public.has_approved_purchase(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

-- Attachments on a submission thread: a reviewing teacher needs to read them.
drop policy if exists "task_message_attachments_read" on storage.objects;
create policy "task_message_attachments_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-message-attachments'
    and (
      (select public.is_admin())
      or public.owns_submission(public.safe_uuid((storage.foldername(name))[1]))
      or public.can_review_submission(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

drop policy if exists "task_message_attachments_write" on storage.objects;
create policy "task_message_attachments_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'task-message-attachments'
    and (
      (select public.is_admin())
      or public.owns_submission(public.safe_uuid((storage.foldername(name))[1]))
      or public.can_review_submission(public.safe_uuid((storage.foldername(name))[1]))
    )
  );
