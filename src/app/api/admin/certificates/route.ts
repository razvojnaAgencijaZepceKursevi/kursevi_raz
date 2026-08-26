import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listCertificatesQuerySchema } from '@/lib/schemas/certificates.schema';

export const dynamic = 'force-dynamic';

/** GET /api/admin/certificates — all certificates + delivery requests (admin). */
export const GET = withRoute(async (req) => {
  await requireStaff();

  const query = parseQuery(req, listCertificatesQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase
    .from('certificates')
    .select(
      '*, courses(id, name, slug, thumbnail_path), profiles!certificates_student_id_fkey(id, full_name, email), deliverer:profiles!certificates_delivered_by_fkey(id, full_name)',
      {
        count: 'exact',
      },
    );

  if (query.search) q = q.ilike('readable_id', `%${query.search}%`);
  if (query.courseId) q = q.eq('course_id', query.courseId);
  if (query.studentId) q = q.eq('student_id', query.studentId);
  if (query.requestedDelivery !== undefined) {
    q = q.eq('requested_delivery', query.requestedDelivery);
  }
  // `delivered` is a nullness test on a timestamp, not an equality test on a
  // boolean — the column records *when* it was posted, and "not posted" is the
  // absence of a date.
  if (query.delivered !== undefined) {
    q = query.delivered ? q.not('delivered_at', 'is', null) : q.is('delivered_at', null);
  }

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
