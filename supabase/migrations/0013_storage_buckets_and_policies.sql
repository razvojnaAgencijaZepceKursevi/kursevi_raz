-- 0013_storage_buckets_and_policies.sql
--
-- Content-access helpers + the four storage buckets. The helpers live here
-- rather than in 0002 because they reference tables that only exist by now;
-- 0014 reuses them for the table policies, so the storage rules and the table
-- rules are guaranteed to agree by construction.

-- ---------------------------------------------------------------------------
-- Access helpers
-- ---------------------------------------------------------------------------

-- SECURITY DEFINER throughout: these are called *from inside* RLS policies, so
-- they must not themselves be subject to RLS or evaluation would recurse.
create or replace function public.has_approved_purchase(p_course_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.purchases
    where course_id = p_course_id
      and student_id = auth.uid()
      and status = 'approved'
  );
$$;

comment on function public.has_approved_purchase(uuid) is
  'True when the current user has an approved purchase for the given course.';

create or replace function public.can_access_module(p_module_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.modules m
    join public.purchases p on p.course_id = m.course_id
    where m.id = p_module_id
      and p.student_id = auth.uid()
      and p.status = 'approved'
  );
$$;

create or replace function public.can_access_quiz(p_quiz_id uuid)
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
      and public.can_access_module(q.module_id)
  );
$$;

create or replace function public.can_access_question(p_question_id uuid)
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
      and public.can_access_quiz(qn.quiz_id)
  );
$$;

create or replace function public.can_access_task(p_task_id uuid)
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
      and public.can_access_module(t.module_id)
  );
$$;

create or replace function public.owns_submission(p_submission_id uuid)
returns boolean
language sql
security definer
stable
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.task_submissions s
    where s.id = p_submission_id
      and s.student_id = auth.uid()
  );
$$;

revoke all on function public.has_approved_purchase(uuid) from public;
revoke all on function public.can_access_module(uuid) from public;
revoke all on function public.can_access_quiz(uuid) from public;
revoke all on function public.can_access_question(uuid) from public;
revoke all on function public.can_access_task(uuid) from public;
revoke all on function public.owns_submission(uuid) from public;

grant execute on function public.has_approved_purchase(uuid) to authenticated, service_role;
grant execute on function public.can_access_module(uuid) to authenticated, service_role;
grant execute on function public.can_access_quiz(uuid) to authenticated, service_role;
grant execute on function public.can_access_question(uuid) to authenticated, service_role;
grant execute on function public.can_access_task(uuid) to authenticated, service_role;
grant execute on function public.owns_submission(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Buckets
-- ---------------------------------------------------------------------------
--
-- Path conventions (chosen here, mirrored by the upload routes):
--   course-thumbnails         {course_id}/{filename}
--   module-files              {course_id}/{module_id}/{filename}
--   task-files                {course_id}/{module_id}/{filename}
--   task-message-attachments  {submission_id}/{filename}
--
-- The leading segment is always the id the access check keys on, which is what
-- lets these policies avoid a join against the object path.

insert into storage.buckets (id, name, public)
values
  ('course-thumbnails', 'course-thumbnails', true),
  ('module-files', 'module-files', false),
  ('task-files', 'task-files', false),
  ('task-message-attachments', 'task-message-attachments', false)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Policies
-- ---------------------------------------------------------------------------

-- course-thumbnails: public read, admin write.
create policy "course_thumbnails_public_read"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'course-thumbnails');

create policy "course_thumbnails_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'course-thumbnails' and (select public.is_admin()));

create policy "course_thumbnails_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'course-thumbnails' and (select public.is_admin()))
  with check (bucket_id = 'course-thumbnails' and (select public.is_admin()));

create policy "course_thumbnails_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'course-thumbnails' and (select public.is_admin()));

-- module-files: student read gated on an approved purchase of the parent course.
create policy "module_files_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'module-files'
    and (
      (select public.is_admin())
      or public.has_approved_purchase(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

create policy "module_files_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'module-files' and (select public.is_admin()));

create policy "module_files_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'module-files' and (select public.is_admin()))
  with check (bucket_id = 'module-files' and (select public.is_admin()));

create policy "module_files_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'module-files' and (select public.is_admin()));

-- task-files: same gating as module-files.
create policy "task_files_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-files'
    and (
      (select public.is_admin())
      or public.has_approved_purchase(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

create policy "task_files_admin_write"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'task-files' and (select public.is_admin()));

create policy "task_files_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'task-files' and (select public.is_admin()))
  with check (bucket_id = 'task-files' and (select public.is_admin()));

create policy "task_files_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-files' and (select public.is_admin()));

-- task-message-attachments: readable/writable by the submission's student and admin.
create policy "task_message_attachments_read"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'task-message-attachments'
    and (
      (select public.is_admin())
      or public.owns_submission(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

create policy "task_message_attachments_write"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'task-message-attachments'
    and (
      (select public.is_admin())
      or public.owns_submission(public.safe_uuid((storage.foldername(name))[1]))
    )
  );

create policy "task_message_attachments_admin_update"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'task-message-attachments' and (select public.is_admin()))
  with check (bucket_id = 'task-message-attachments' and (select public.is_admin()));

create policy "task_message_attachments_admin_delete"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'task-message-attachments' and (select public.is_admin()));
