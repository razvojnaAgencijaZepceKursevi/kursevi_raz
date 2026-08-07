import { NextResponse } from 'next/server';
import { notFound, unwrapMany, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ courseId: string }> };

/**
 * GET /api/courses/:courseId/outline — the module titles of a published course.
 *
 * Public and unauthenticated, and the only endpoint that shows any part of a
 * course's module structure without an approved purchase. A visitor deciding
 * whether to buy needs to see the syllabus; `/modules` cannot serve that,
 * because both it and the `modules` RLS policy require a purchase.
 *
 * ## Why the service-role client is used here, and why that is safe
 *
 * `modules` grants `anon` nothing at all — an RLS policy applies to whole rows
 * and cannot expose only two columns, so there is no policy that would let this
 * work without also leaking `video_url` and `description`. The service-role
 * client bypasses RLS, which makes this route itself the entire access control.
 * Three things keep that narrow, and all three must stay:
 *
 *   1. The course is verified `published` first — an unpublished draft 404s.
 *   2. The select lists `id, title, order` explicitly. Never `*`.
 *   3. It is read-only. No parameter here reaches a write.
 *
 * If you extend this route, re-read those three lines first. Adding a column to
 * the select is a decision about what the whole internet may see.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const courseId = uuidSchema.parse((await ctx.params).courseId);

  const supabase = createServiceRoleClient();

  // Gate on publication before reading anything else. An unpublished course
  // must be indistinguishable from one that doesn't exist.
  const course = unwrapMaybe(
    await supabase
      .from('courses')
      .select('id')
      .eq('id', courseId)
      .eq('published', true)
      .maybeSingle(),
  );
  if (!course) throw notFound();

  const modules = unwrapMany(
    await supabase
      .from('modules')
      .select('id, title, order')
      .eq('course_id', courseId)
      .order('order', { ascending: true }),
  );

  return NextResponse.json({ data: modules });
});
