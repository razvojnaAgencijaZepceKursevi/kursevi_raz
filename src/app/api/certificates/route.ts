import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listCertificatesQuerySchema } from '@/lib/schemas/certificates.schema';

export const dynamic = 'force-dynamic';

/** GET /api/certificates — the caller's own certificates (student). */
export const GET = withRoute(async (req) => {
  const { userId } = await requireUser();
  const query = parseQuery(req, listCertificatesQuerySchema);

  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase
    .from('certificates')
    .select('*, courses(id, name, slug, thumbnail_path)', { count: 'exact' })
    .eq('student_id', userId);

  if (query.courseId) q = q.eq('course_id', query.courseId);
  if (query.requestedDelivery !== undefined) {
    q = q.eq('requested_delivery', query.requestedDelivery);
  }

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
