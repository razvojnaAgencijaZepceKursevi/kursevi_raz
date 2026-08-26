import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listCategoriesQuerySchema } from '@/lib/schemas/categories.schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/categories — list categories (public).
 *
 * ## Why the `courses(count)` embed
 *
 * The admin categories screen needs to know how many courses use a category
 * before it offers to delete one — `courses.category_id` is `ON DELETE SET
 * NULL`, so a delete quietly uncategorises them instead of failing, and the
 * admin deserves to be told that first.
 *
 * PostgREST counts the related rows in the same query, which beats fetching
 * every course just to tally them client-side. It comes back nested as
 * `courses: [{ count: n }]`, so it's flattened to a plain `course_count` here
 * rather than leaking that shape into the UI.
 *
 * The count obeys RLS like any other read: an admin's session counts drafts
 * too, an anonymous one counts only published courses. Both are correct for
 * who's asking.
 */
export const GET = withRoute(async (req) => {
  const query = parseQuery(req, listCategoriesQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('categories').select('*, courses(count)', { count: 'exact' });
  if (query.search) q = q.ilike('name', `%${query.search}%`);

  const result = await q.order('name', { ascending: true }).range(from, to);

  // A category with no courses can come back as `[]` rather than `[{count: 0}]`,
  // so don't assume the element is there.
  const data = unwrapMany(result).map(({ courses, ...category }) => ({
    ...category,
    course_count: courses?.[0]?.count ?? 0,
  }));

  return NextResponse.json({
    data,
    meta: metaFor(query, result.count ?? 0),
  });
});
