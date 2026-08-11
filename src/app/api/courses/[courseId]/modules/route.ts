import { NextResponse } from 'next/server';
import { forbidden, parseQuery, unwrapMany, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
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
  const { userId, profile } = await requireUser();
  const courseId = uuidSchema.parse((await ctx.params).courseId);
  const query = parseQuery(req, listModulesQuerySchema);

  const supabase = await createClient();

  // Three ways to be allowed here, and they are genuinely different people:
  //   * an admin,
  //   * the teacher who owns the course (they authored it; they never buy it),
  //   * a student with an approved purchase.
  //
  // The owner branch is easy to forget — the original version checked only
  // `role !== 'admin'` and then demanded a purchase, which 403'd teachers out
  // of their own material. RLS already permits the read (`can_author_course`),
  // so this check exists purely to turn "no rows" into a clear 403.
  if (profile.role !== 'admin') {
    const ownsCourse =
      profile.role === 'teacher' &&
      Boolean(
        unwrapMaybe(
          await supabase
            .from('courses')
            .select('id')
            .eq('id', courseId)
            .eq('owner_id', userId)
            .maybeSingle(),
        ),
      );

    if (!ownsCourse) {
      const purchase = unwrapMaybe(
        await supabase
          .from('purchases')
          .select('id')
          .eq('course_id', courseId)
          .eq('student_id', userId)
          .eq('status', 'approved')
          .maybeSingle(),
      );
      if (!purchase) throw forbidden('An approved purchase is required for this course');
    }
  }

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
