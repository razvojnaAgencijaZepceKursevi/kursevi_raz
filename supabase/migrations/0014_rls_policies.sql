-- 0014_rls_policies.sql
--
-- Every table gets RLS enabled with explicit policies. Nothing is left open by
-- default, and any table without a matching policy for a role is closed to that
-- role — that absence is load-bearing for module_progress, certificates and
-- answer_keys.
--
-- Convention: helper calls are wrapped as `(select fn())` so Postgres evaluates
-- them once per statement as an InitPlan rather than once per row.

alter table public.profiles          enable row level security;
alter table public.categories        enable row level security;
alter table public.courses           enable row level security;
alter table public.modules           enable row level security;
alter table public.module_files      enable row level security;
alter table public.quizzes           enable row level security;
alter table public.questions         enable row level security;
alter table public.answers           enable row level security;
alter table public.answer_keys       enable row level security;
alter table public.tasks             enable row level security;
alter table public.task_files        enable row level security;
alter table public.purchases         enable row level security;
alter table public.task_submissions  enable row level security;
alter table public.task_messages     enable row level security;
alter table public.module_progress   enable row level security;
alter table public.certificates      enable row level security;

-- ---------------------------------------------------------------------------
-- profiles
-- ---------------------------------------------------------------------------
-- Students read/update their own row only. The role column is protected by the
-- prevent_unauthorized_role_change trigger in 0003 — policies cannot restrict
-- which columns an UPDATE touches, so the trigger is the real guard.

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_update_own_or_admin"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

create policy "profiles_admin_insert"
  on public.profiles for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "profiles_admin_delete"
  on public.profiles for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- categories — public read, admin write
-- ---------------------------------------------------------------------------

create policy "categories_public_read"
  on public.categories for select
  to anon, authenticated
  using (true);

create policy "categories_admin_insert"
  on public.categories for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "categories_admin_update"
  on public.categories for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "categories_admin_delete"
  on public.categories for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- courses — published are public; admins see everything
-- ---------------------------------------------------------------------------

create policy "courses_read_published_or_admin"
  on public.courses for select
  to anon, authenticated
  using (published = true or (select public.is_admin()));

create policy "courses_admin_insert"
  on public.courses for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "courses_admin_update"
  on public.courses for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "courses_admin_delete"
  on public.courses for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- Course content — readable only with an approved purchase of the parent course
-- ---------------------------------------------------------------------------

create policy "modules_read_purchased_or_admin"
  on public.modules for select
  to authenticated
  using ((select public.is_admin()) or public.has_approved_purchase(course_id));

create policy "modules_admin_insert"
  on public.modules for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "modules_admin_update"
  on public.modules for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "modules_admin_delete"
  on public.modules for delete
  to authenticated
  using ((select public.is_admin()));

create policy "module_files_read_purchased_or_admin"
  on public.module_files for select
  to authenticated
  using ((select public.is_admin()) or public.can_access_module(module_id));

create policy "module_files_admin_insert"
  on public.module_files for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "module_files_admin_update"
  on public.module_files for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "module_files_admin_delete"
  on public.module_files for delete
  to authenticated
  using ((select public.is_admin()));

create policy "quizzes_read_purchased_or_admin"
  on public.quizzes for select
  to authenticated
  using ((select public.is_admin()) or public.can_access_module(module_id));

create policy "quizzes_admin_insert"
  on public.quizzes for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "quizzes_admin_update"
  on public.quizzes for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "quizzes_admin_delete"
  on public.quizzes for delete
  to authenticated
  using ((select public.is_admin()));

create policy "questions_read_purchased_or_admin"
  on public.questions for select
  to authenticated
  using ((select public.is_admin()) or public.can_access_quiz(quiz_id));

create policy "questions_admin_insert"
  on public.questions for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "questions_admin_update"
  on public.questions for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "questions_admin_delete"
  on public.questions for delete
  to authenticated
  using ((select public.is_admin()));

-- Students may read answer *text* (they need the options to pick from). The
-- correctness flag is not in this table at all — see answer_keys below.
create policy "answers_read_purchased_or_admin"
  on public.answers for select
  to authenticated
  using ((select public.is_admin()) or public.can_access_question(question_id));

create policy "answers_admin_insert"
  on public.answers for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "answers_admin_update"
  on public.answers for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "answers_admin_delete"
  on public.answers for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- answer_keys — ADMIN ONLY. No student policy of any kind, by design.
-- ---------------------------------------------------------------------------
-- A student querying this table with the anon key gets zero rows regardless of
-- what they ask for. Quiz scoring reads it through the service-role client.

create policy "answer_keys_admin_select"
  on public.answer_keys for select
  to authenticated
  using ((select public.is_admin()));

create policy "answer_keys_admin_insert"
  on public.answer_keys for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "answer_keys_admin_update"
  on public.answer_keys for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "answer_keys_admin_delete"
  on public.answer_keys for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- tasks / task_files
-- ---------------------------------------------------------------------------

create policy "tasks_read_purchased_or_admin"
  on public.tasks for select
  to authenticated
  using ((select public.is_admin()) or public.can_access_module(module_id));

create policy "tasks_admin_insert"
  on public.tasks for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "tasks_admin_update"
  on public.tasks for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "tasks_admin_delete"
  on public.tasks for delete
  to authenticated
  using ((select public.is_admin()));

create policy "task_files_read_purchased_or_admin"
  on public.task_files for select
  to authenticated
  using ((select public.is_admin()) or public.can_access_task(task_id));

create policy "task_files_admin_insert"
  on public.task_files for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "task_files_admin_update"
  on public.task_files for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "task_files_admin_delete"
  on public.task_files for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- purchases — student may request; only admins may change status
-- ---------------------------------------------------------------------------
-- Deliberately NO update/delete policy for students.

create policy "purchases_select_own_or_admin"
  on public.purchases for select
  to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "purchases_insert_own"
  on public.purchases for insert
  to authenticated
  with check (
    (select public.is_admin())
    or (
      student_id = (select auth.uid())
      -- A student may only ever create a request; approving is admin-only.
      and status = 'requested'
    )
  );

create policy "purchases_admin_update"
  on public.purchases for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "purchases_admin_delete"
  on public.purchases for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- task_submissions — student may open a thread; only admins may change status
-- ---------------------------------------------------------------------------

create policy "task_submissions_select_own_or_admin"
  on public.task_submissions for select
  to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "task_submissions_insert_own"
  on public.task_submissions for insert
  to authenticated
  with check (
    (select public.is_admin())
    or (
      student_id = (select auth.uid())
      and status = 'pending'
      and public.can_access_task(task_id)
    )
  );

create policy "task_submissions_admin_update"
  on public.task_submissions for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "task_submissions_admin_delete"
  on public.task_submissions for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- task_messages — participants only
-- ---------------------------------------------------------------------------

create policy "task_messages_select_participant_or_admin"
  on public.task_messages for select
  to authenticated
  using ((select public.is_admin()) or public.owns_submission(submission_id));

create policy "task_messages_insert_participant_or_admin"
  on public.task_messages for insert
  to authenticated
  with check (
    sender_id = (select auth.uid())
    and ((select public.is_admin()) or public.owns_submission(submission_id))
  );

create policy "task_messages_admin_update"
  on public.task_messages for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "task_messages_admin_delete"
  on public.task_messages for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- module_progress — SELECT own only. No student INSERT/UPDATE policy at all.
-- ---------------------------------------------------------------------------
-- Writes happen exclusively through service-role API routes, which bypass RLS
-- and verify the caller themselves.

create policy "module_progress_select_own_or_admin"
  on public.module_progress for select
  to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "module_progress_admin_insert"
  on public.module_progress for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "module_progress_admin_update"
  on public.module_progress for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "module_progress_admin_delete"
  on public.module_progress for delete
  to authenticated
  using ((select public.is_admin()));

-- ---------------------------------------------------------------------------
-- certificates — SELECT own only. No student INSERT/UPDATE policy at all.
-- ---------------------------------------------------------------------------
-- Auto-issued by service-role routes. Note that the public verification lookup
-- (GET /api/certificates/:readableId) deliberately has no anon policy here —
-- that route uses the service-role client and returns a minimal payload, so
-- anonymous callers can verify a certificate without the table being readable.

create policy "certificates_select_own_or_admin"
  on public.certificates for select
  to authenticated
  using (student_id = (select auth.uid()) or (select public.is_admin()));

create policy "certificates_admin_insert"
  on public.certificates for insert
  to authenticated
  with check ((select public.is_admin()));

create policy "certificates_admin_update"
  on public.certificates for update
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

create policy "certificates_admin_delete"
  on public.certificates for delete
  to authenticated
  using ((select public.is_admin()));
