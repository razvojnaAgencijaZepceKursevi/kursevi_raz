import { NextResponse } from 'next/server';
import {
  conflict,
  forbidden,
  parseBody,
  unwrapMaybe,
  unwrapOne,
  withRoute,
} from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';
import { createSubmissionSchema } from '@/lib/schemas/task-submissions.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ taskId: string }> };

/**
 * POST /api/tasks/:taskId/submissions — open a submission thread (student).
 *
 * Uses the RLS client: students have an INSERT policy on both tables scoped to
 * their own rows, so no service-role escalation is warranted here.
 */
export const POST = withRoute(async (req, ctx: Ctx) => {
  const { userId } = await requireUser();
  const taskId = uuidSchema.parse((await ctx.params).taskId);
  const body = await parseBody(req, createSubmissionSchema);

  const supabase = await createClient();

  // Readable via RLS only with an approved purchase, so this doubles as the
  // access check.
  const task = unwrapMaybe(
    await supabase.from('tasks').select('id').eq('id', taskId).maybeSingle(),
  );
  if (!task) throw forbidden('An approved purchase is required for this task');

  const open = unwrapMaybe(
    await supabase
      .from('task_submissions')
      .select('id')
      .eq('task_id', taskId)
      .eq('student_id', userId)
      .in('status', ['pending', 'needs_revision'])
      .maybeSingle(),
  );
  if (open) throw conflict('You already have an open submission for this task');

  const submission = unwrapOne(
    await supabase
      .from('task_submissions')
      .insert({ task_id: taskId, student_id: userId, status: 'pending' })
      .select()
      .single(),
  );

  const message = unwrapOne(
    await supabase
      .from('task_messages')
      .insert({
        submission_id: submission.id,
        sender_id: userId,
        body: body.body,
        attachment_path: body.attachment_path ?? null,
      })
      .select()
      .single(),
  );

  return NextResponse.json({ data: { ...submission, message } }, { status: 201 });
});
