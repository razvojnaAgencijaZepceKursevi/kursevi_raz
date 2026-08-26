import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { assertModuleAccess } from '@/lib/auth/courseAccess';
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
 *
 * Access goes through `assertModuleAccess` so the teacher who owns the course
 * can read their own quiz — the previous `role !== 'admin' -> require purchase`
 * shape 403'd them out of it.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireUser();
  const moduleId = uuidSchema.parse((await ctx.params).moduleId);

  const supabase = await createClient();

  await assertModuleAccess(supabase, moduleId, auth);

  const quiz = unwrapOne(
    await supabase
      .from('quizzes')
      .select('id, module_id, passing_score, questions(id, text, answers(id, text))')
      .eq('module_id', moduleId)
      .maybeSingle(),
  );

  return NextResponse.json({ data: quiz });
});
