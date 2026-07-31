import { NextResponse } from 'next/server';
import {
  forbidden,
  parseBody,
  parseQuery,
  unwrapMany,
  unwrapMaybe,
  unwrapOne,
  withRoute,
} from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { metaFor, paginationQuerySchema, rangeFor, uuidSchema } from '@/lib/schemas/common.schema';
import { createMessageSchema } from '@/lib/schemas/task-submissions.schema';
import { applyModuleProgress, maybeIssueCertificate } from '@/lib/services/progress';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/submissions/:id/messages — thread, scoped to participants. */
export const GET = withRoute(async (req, ctx: Ctx) => {
  await requireUser();
  const submissionId = uuidSchema.parse((await ctx.params).id);
  const query = parseQuery(req, paginationQuerySchema);

  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  // RLS restricts this to the owning student and admins.
  const result = await supabase
    .from('task_messages')
    .select('*', { count: 'exact' })
    .eq('submission_id', submissionId)
    .order('created_at', { ascending: true })
    .range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});

/**
 * POST /api/submissions/:id/messages — add a message to the thread.
 *
 * Both sides post here. Only an admin's `status` is honoured, and only an admin
 * can drive the submission to `approved`, which is what marks the module's task
 * done and may in turn issue a certificate.
 */
export const POST = withRoute(async (req, ctx: Ctx) => {
  const { userId, profile } = await requireUser();
  const submissionId = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, createMessageSchema);

  const supabase = await createClient();
  const isAdmin = profile.role === 'admin';

  const submission = unwrapMaybe(
    await supabase
      .from('task_submissions')
      .select('id, task_id, student_id, status')
      .eq('id', submissionId)
      .maybeSingle(),
  );
  if (!submission) throw forbidden('You are not a participant in this submission');

  const message = unwrapOne(
    await supabase
      .from('task_messages')
      .insert({
        submission_id: submissionId,
        sender_id: userId,
        body: body.body,
        attachment_path: body.attachment_path ?? null,
      })
      .select()
      .single(),
  );

  let status = submission.status;
  let moduleCompleted = false;
  let certificateIssued = false;

  // A student may include `status`; it is ignored rather than rejected so the
  // same endpoint serves both sides of the conversation.
  if (isAdmin && body.status && body.status !== submission.status) {
    const svc = createServiceRoleClient();

    const updated = unwrapOne(
      await svc
        .from('task_submissions')
        .update({ status: body.status })
        .eq('id', submissionId)
        .select('status, task_id, student_id')
        .single(),
    );
    status = updated.status;

    if (updated.status === 'approved') {
      const task = unwrapOne(
        await svc.from('tasks').select('module_id').eq('id', updated.task_id).single(),
      );
      const mod = unwrapOne(
        await svc.from('modules').select('course_id').eq('id', task.module_id).single(),
      );

      const progress = await applyModuleProgress(svc, {
        moduleId: task.module_id,
        studentId: updated.student_id,
        taskDone: true,
      });
      moduleCompleted = progress.completed;

      if (progress.completed) {
        const result = await maybeIssueCertificate(svc, {
          courseId: mod.course_id,
          studentId: updated.student_id,
        });
        certificateIssued = result.issued;
      }
    }
  }

  return NextResponse.json(
    {
      data: message,
      submission_status: status,
      module_completed: moduleCompleted,
      certificate_issued: certificateIssued,
    },
    { status: 201 },
  );
});
