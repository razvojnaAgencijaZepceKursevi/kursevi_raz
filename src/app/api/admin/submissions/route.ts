import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listSubmissionsQuerySchema } from '@/lib/schemas/task-submissions.schema';

export const dynamic = 'force-dynamic';

/** GET /api/admin/submissions — list/filter every submission (admin). */
export const GET = withRoute(async (req) => {
  await requireAdmin();

  const query = parseQuery(req, listSubmissionsQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase
    .from('task_submissions')
    .select('*, tasks!inner(id, module_id, modules!inner(id, course_id))', { count: 'exact' });

  if (query.status) q = q.eq('status', query.status);
  if (query.studentId) q = q.eq('student_id', query.studentId);
  // Filtering by course walks the embedded task -> module relationship.
  if (query.courseId) q = q.eq('tasks.modules.course_id', query.courseId);

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
