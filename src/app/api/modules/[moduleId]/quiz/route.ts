import { NextResponse } from 'next/server';
import { forbidden, unwrapMaybe, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ moduleId: string }> };

/**
 * GET /api/modules/:moduleId/quiz — the quiz as a student takes it.
 *
 * The correct-answer flag lives in `answer_keys`, a table with no student RLS
 * policy at all, and is simply not selected here. There is no "strip the field"
 * step that could be forgotten: the data is unreachable on this code path and
 * equally unreachable if a student queries Supabase directly.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const { userId, profile } = await requireUser();
  const moduleId = uuidSchema.parse((await ctx.params).moduleId);

  const supabase = await createClient();

  if (profile.role !== 'admin') {
    const mod = unwrapOne(
      await supabase.from('modules').select('course_id').eq('id', moduleId).maybeSingle(),
    );
    const purchase = unwrapMaybe(
      await supabase
        .from('purchases')
        .select('id')
        .eq('course_id', mod.course_id)
        .eq('student_id', userId)
        .eq('status', 'approved')
        .maybeSingle(),
    );
    if (!purchase) throw forbidden('An approved purchase is required for this course');
  }

  const quiz = unwrapOne(
    await supabase
      .from('quizzes')
      .select('id, module_id, passing_score, questions(id, text, answers(id, text))')
      .eq('module_id', moduleId)
      .maybeSingle(),
  );

  return NextResponse.json({ data: quiz });
});
