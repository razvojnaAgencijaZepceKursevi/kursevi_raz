import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listCoursesQuerySchema } from '@/lib/schemas/courses.schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/courses — public course catalogue.
 *
 * Filters `published = true` explicitly rather than leaning on RLS alone: an
 * admin calling this endpoint would otherwise see drafts in what is documented
 * as the public listing.
 */
export const GET = withRoute(async (req) => {
  const query = parseQuery(req, listCoursesQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('courses').select('*', { count: 'exact' }).eq('published', true);

  if (query.search) {
    q = q.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }
  if (query.categoryId) {
    q = q.eq('category_id', query.categoryId);
  }

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
