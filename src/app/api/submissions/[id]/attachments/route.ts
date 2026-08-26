import { NextResponse } from 'next/server';
import {
  ApiError,
  badRequest,
  conflict,
  forbidden,
  unwrapMaybe,
  withRoute,
} from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import {
  ACCEPTED_MESSAGE_ATTACHMENT_TYPES,
  BUCKETS,
  MAX_UPLOAD_BYTES,
  formatBytes,
  storagePath,
} from '@/lib/storage';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/submissions/:id/attachments — upload a file for this thread.
 *
 * ## Why this exists instead of reusing `/api/admin/uploads`
 *
 * That route is `requireStaff()`, so a student could not call it — which made
 * message attachments impossible for the one person who most needs to send
 * them. The storage policy always allowed it (`owns_submission()` on the folder);
 * there was simply no API door.
 *
 * ## Why the submission id comes from the URL
 *
 * The generic upload route takes a client-supplied `folder`. Here the folder
 * *is* the submission, and it is read from the path and checked — so a caller
 * cannot aim an upload at somebody else's thread by editing a form field. The
 * path is then built by `storagePath()`, never by the client.
 *
 * Access rides on RLS: `task_submissions` is selectable by the owning student,
 * admins, and the reviewing teacher, so a submission that is not yours is simply
 * not found. Both sides of the conversation can attach, which is the point —
 * the reviewer sends corrections back.
 */
export const POST = withRoute(async (req, ctx: Ctx) => {
  await requireUser();
  const submissionId = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();

  const submission = unwrapMaybe(
    await supabase
      .from('task_submissions')
      .select('id, status')
      .eq('id', submissionId)
      .maybeSingle(),
  );
  if (!submission) throw forbidden('You are not a participant in this submission');

  // Approval closes the thread, so there is no message left to attach this to.
  // Refusing here as well as at the message endpoint keeps the bucket free of
  // objects nothing will ever reference.
  if (submission.status === 'approved') {
    throw conflict('This submission has been approved; the thread is closed');
  }

  let formData: FormData;
  try {
    formData = await req.formData();
  } catch {
    throw badRequest('Request must be multipart/form-data');
  }

  const file = formData.get('file');
  if (!(file instanceof File)) throw badRequest('Missing "file" part');
  if (file.size === 0) throw badRequest('Uploaded file is empty');

  if (file.size > MAX_UPLOAD_BYTES) {
    throw new ApiError(413, `File exceeds the ${formatBytes(MAX_UPLOAD_BYTES)} limit`);
  }

  if (!ACCEPTED_MESSAGE_ATTACHMENT_TYPES.includes(file.type as never)) {
    throw badRequest(`Content type "${file.type}" is not allowed for an attachment`);
  }

  // The request-scoped client, so the bucket's own policy is still the final
  // word on whether this write is permitted.
  const path = storagePath([submissionId], file.name);
  const { error } = await supabase.storage
    .from(BUCKETS.taskMessageAttachments)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (error) throw new ApiError(502, `Upload failed: ${error.message}`);

  return NextResponse.json(
    { data: { bucket: BUCKETS.taskMessageAttachments, path } },
    { status: 201 },
  );
});
