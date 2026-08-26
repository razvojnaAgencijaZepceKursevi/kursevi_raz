import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { assertCourseAccess } from '@/lib/auth/courseAccess';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor, uuidSchema } from '@/lib/schemas/common.schema';
import { listModulesQuerySchema } from '@/lib/schemas/modules.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ courseId: string }> };

/**
 * GET /api/courses/:courseId/modules — modules for a purchased course.
 *
 * RLS already restricts this to courses the caller has an approved purchase
 * for. The explicit check below is the "double-check in route" the spec calls
 * for, and it turns what RLS would render as a confusing empty list into a
 * clear 403.
 */
export const GET = withRoute(async (req, ctx: Ctx) => {
  const auth = await requireUser();
  const courseId = uuidSchema.parse((await ctx.params).courseId);
  const query = parseQuery(req, listModulesQuerySchema);

  const supabase = await createClient();

  // Admin, the owning teacher, or an approved purchase — see the helper.
  await assertCourseAccess(supabase, courseId, auth);

  const [from, to] = rangeFor(query);

  let q = supabase
    .from('modules')
    .select('*, module_files(*)', { count: 'exact' })
    .eq('course_id', courseId);

  if (query.search) q = q.ilike('title', `%${query.search}%`);

  // `order` is the sequencing column, quoted in SQL; PostgREST takes it plainly.
  const result = await q.order('order', { ascending: true }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
