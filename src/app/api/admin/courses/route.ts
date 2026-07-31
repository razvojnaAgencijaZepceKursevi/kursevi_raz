import { NextResponse } from 'next/server';
import { parseBody, parseQuery, unwrapMany, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { createCourseSchema, listCoursesQuerySchema } from '@/lib/schemas/courses.schema';

export const dynamic = 'force-dynamic';

/** GET /api/admin/courses — list all courses including unpublished (admin). */
export const GET = withRoute(async (req) => {
  await requireAdmin();

  const query = parseQuery(req, listCoursesQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('courses').select('*', { count: 'exact' });

  if (query.search) {
    q = q.or(`name.ilike.%${query.search}%,description.ilike.%${query.search}%`);
  }
  if (query.categoryId) q = q.eq('category_id', query.categoryId);
  if (query.published !== undefined) q = q.eq('published', query.published);

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});

/** POST /api/admin/courses — create a course (admin). */
export const POST = withRoute(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, createCourseSchema);

  const supabase = await createClient();
  const created = unwrapOne(
    await supabase
      .from('courses')
      .insert({
        name: body.name,
        description: body.description ?? null,
        category_id: body.category_id ?? null,
        price: body.price,
        thumbnail_path: body.thumbnail_path ?? null,
        published: body.published,
      })
      .select()
      .single(),
  );

  return NextResponse.json({ data: created }, { status: 201 });
});
