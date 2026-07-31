import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listPurchasesQuerySchema } from '@/lib/schemas/purchases.schema';

export const dynamic = 'force-dynamic';

/** GET /api/admin/purchases — list/search/filter all purchases (admin). */
export const GET = withRoute(async (req) => {
  await requireAdmin();

  const query = parseQuery(req, listPurchasesQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase
    .from('purchases')
    .select('*, courses(id, name), profiles!purchases_student_id_fkey(id, full_name, email)', {
      count: 'exact',
    });

  if (query.status) q = q.eq('status', query.status);
  if (query.courseId) q = q.eq('course_id', query.courseId);
  if (query.studentId) q = q.eq('student_id', query.studentId);

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
