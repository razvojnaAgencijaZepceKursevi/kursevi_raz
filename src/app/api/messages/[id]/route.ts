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
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { updateMessageSchema } from '@/lib/schemas/task-submissions.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/messages/:id — attach a file to a message that already exists.
 *
 * ## Why this exists at all
 *
 * A message attachment lives at `task-message-attachments/{submission_id}/…`,
 * and the storage policy checks `owns_submission()` against that first segment.
 * So the submission has to exist *before* anything can be uploaded for it.
 *
 * For a **reply** that is fine — the thread is already there, so the client
 * uploads first and posts the message with `attachment_path` in one go.
 *
 * For the **first** message it is impossible: creating the submission is what
 * produces the id the upload path needs. Hence this route. The client creates
 * the submission, uploads into the folder it now owns, then attaches it here.
 * Same two-step shape as the course thumbnail, and for the same reason — the
 * record has to exist before the file has anywhere to go.
 *
 * ## Only the sender, and only once
 *
 * A thread is a record of a conversation. Letting anyone attach to someone
 * else's message, or swap an attachment after the fact, would make it a record
 * of nothing. RLS already scopes the row to participants; this narrows it to the
 * author, and refuses when an attachment is already set.
 */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  const { userId } = await requireUser();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updateMessageSchema);

  const supabase = await createClient();

  // RLS restricts this to the thread's participants; `sender_id` narrows it to
  // the person who wrote it.
  const message = unwrapMaybe(
    await supabase
      .from('task_messages')
      .select('id, sender_id, attachment_path, task_submissions(status)')
      .eq('id', id)
      .maybeSingle(),
  );

  if (!message || message.sender_id !== userId) {
    throw forbidden('You can only attach a file to your own message');
  }

  if (message.attachment_path) {
    throw conflict('This message already has an attachment');
  }

  // An approved thread is closed to every write, this one included — otherwise
  // the transcript could still grow after the decision that was based on it.
  if (message.task_submissions?.status === 'approved') {
    throw conflict('This submission has been approved; the thread is closed');
  }

  // Service role for the write, deliberately.
  //
  // `task_messages` grants UPDATE to admins only, and that should stay true: RLS
  // cannot restrict *columns*, so a policy letting a sender update their own row
  // would also let them rewrite `body` straight through PostgREST. A thread is a
  // record of what was said; only this one write — filling an attachment that was
  // never set — is legitimate, and the two checks above are what authorise it.
  const svc = createServiceRoleClient();

  const updated = unwrapOne(
    await svc
      .from('task_messages')
      .update({ attachment_path: body.attachment_path })
      .eq('id', id)
      .select()
      .single(),
  );

  return NextResponse.json({ data: updated });
});
