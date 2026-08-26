import { NextResponse } from 'next/server';
import { notFound, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';
import { ADMIN_SUBMISSION_SELECT, flattenAdminSubmission } from '@/lib/api/adminSubmission';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/submissions/:id — one submission, for the review screen.
 *
 * Added for the same reason the users/purchases/certificates detail routes
 * were: a detail page needs a GET-by-id, and reading a single row out of the
 * list endpoint would mean paging through the queue to find it.
 *
 * Request-scoped client, so RLS is the access control. A submission on somebody
 * else's course is invisible to a teacher rather than forbidden — 404, not 403,
 * which is correct here: the id is not theirs to learn anything about.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();

  const submission = unwrapMaybe(
    await supabase
      .from('task_submissions')
      .select(ADMIN_SUBMISSION_SELECT)
      .eq('id', id)
      .maybeSingle(),
  );

  if (!submission) throw notFound('Submission not found');

  return NextResponse.json({ data: flattenAdminSubmission(submission) });
});
