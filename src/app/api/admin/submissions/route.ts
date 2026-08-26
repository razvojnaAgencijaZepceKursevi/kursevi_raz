import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listSubmissionsQuerySchema } from '@/lib/schemas/task-submissions.schema';
import { ADMIN_SUBMISSION_SELECT, flattenAdminSubmission } from '@/lib/api/adminSubmission';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/submissions — the review queue.
 *
 * Request-scoped client, so RLS does the scoping: an admin sees everything, a
 * teacher sees only submissions on courses they own (`can_review_submission`).
 * That is why there is no `owner_id` filter here — unlike `/api/admin/courses`,
 * whose SELECT policy also admits every *published* course and therefore needs
 * one.
 */
export const GET = withRoute(async (req) => {
  await requireStaff();

  const query = parseQuery(req, listSubmissionsQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('task_submissions').select(ADMIN_SUBMISSION_SELECT, { count: 'exact' });

  if (query.status) q = q.eq('status', query.status);
  if (query.studentId) q = q.eq('student_id', query.studentId);
  // Filtering by course walks the embedded task -> module relationship, which
  // only works because both embeds are `!inner`.
  if (query.courseId) q = q.eq('tasks.modules.course_id', query.courseId);

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result).map(flattenAdminSubmission),
    meta: metaFor(query, result.count ?? 0),
  });
});
