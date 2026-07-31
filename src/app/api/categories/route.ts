import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listCategoriesQuerySchema } from '@/lib/schemas/categories.schema';

export const dynamic = 'force-dynamic';

/** GET /api/categories — list categories (public). */
export const GET = withRoute(async (req) => {
  const query = parseQuery(req, listCategoriesQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('categories').select('*', { count: 'exact' });
  if (query.search) q = q.ilike('name', `%${query.search}%`);

  const result = await q.order('name', { ascending: true }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
