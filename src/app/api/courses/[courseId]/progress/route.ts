import { NextResponse } from 'next/server';
import { unwrapMany, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ courseId: string }> };

/**
 * GET /api/courses/:courseId/progress — the caller's progress across a course.
 *
 * There is no write counterpart: module_progress is only ever written by the
 * quiz-attempt and submission-approval routes.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const { userId } = await requireUser();
  const courseId = uuidSchema.parse((await ctx.params).courseId);

  const supabase = await createClient();

  // RLS returns nothing here without an approved purchase, so an unpurchased
  // course reports zero modules rather than leaking its structure.
  const modules = unwrapMany(
    await supabase
      .from('modules')
      .select('id, title, order')
      .eq('course_id', courseId)
      .order('order', { ascending: true }),
  );

  const progressRows = unwrapMany(
    await supabase
      .from('module_progress')
      .select('module_id, quiz_done, task_done, completed')
      .eq('student_id', userId)
      .in(
        'module_id',
        modules.map((m) => m.id),
      ),
  );

  const byModule = new Map(progressRows.map((p) => [p.module_id, p]));

  const moduleProgress = modules.map((m) => {
    const p = byModule.get(m.id);
    return {
      module_id: m.id,
      title: m.title,
      order: m.order,
      quiz_done: p?.quiz_done ?? false,
      task_done: p?.task_done ?? false,
      completed: p?.completed ?? false,
    };
  });

  const completedCount = moduleProgress.filter((m) => m.completed).length;

  return NextResponse.json({
    data: {
      course_id: courseId,
      module_count: modules.length,
      completed_count: completedCount,
      course_completed: modules.length > 0 && completedCount === modules.length,
      modules: moduleProgress,
    },
  });
});
