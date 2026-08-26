import { NextResponse } from 'next/server';
import { unwrapMany, unwrapOne, parseBody, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { assertCanAuthorQuiz } from '@/lib/auth/courseAccess';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { updateQuizSchema } from '@/lib/schemas/quizzes.schema';
import { ADMIN_QUIZ_SELECT, flattenAdminQuiz } from '@/lib/api/adminQuiz';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/quizzes/:id — full quiz including the answer key (admin). */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const svc = createServiceRoleClient();
  // Service role bypasses RLS — check ownership explicitly.
  await assertCanAuthorQuiz(svc, id, auth);
  const quiz = unwrapOne(
    await svc.from('quizzes').select(ADMIN_QUIZ_SELECT).eq('id', id).maybeSingle(),
  );

  return NextResponse.json({ data: flattenAdminQuiz(quiz) });
});

/**
 * PATCH /api/admin/quizzes/:id (admin).
 *
 * When `questions` is supplied it replaces the existing set outright — the
 * authoring UI has no stable client-side ids to diff against, so a partial
 * merge would silently mis-associate answers.
 */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  const auth = await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updateQuizSchema);

  const svc = createServiceRoleClient();
  // Service role bypasses RLS — check ownership explicitly.
  await assertCanAuthorQuiz(svc, id, auth);

  if (body.passing_score !== undefined) {
    unwrapOne(
      await svc
        .from('quizzes')
        .update({ passing_score: body.passing_score })
        .eq('id', id)
        .select('id')
        .single(),
    );
  }

  if (body.questions) {
    // Cascades to answers and answer_keys.
    unwrapMany(await svc.from('questions').delete().eq('quiz_id', id).select('id'));

    for (const question of body.questions) {
      const createdQuestion = unwrapOne(
        await svc.from('questions').insert({ quiz_id: id, text: question.text }).select().single(),
      );

      const createdAnswers = unwrapMany(
        await svc
          .from('answers')
          .insert(question.answers.map((a) => ({ question_id: createdQuestion.id, text: a.text })))
          .select(),
      );

      const correctIndex = question.answers.findIndex((a) => a.is_correct);
      const correctAnswer = createdAnswers[correctIndex];
      if (correctAnswer) {
        unwrapOne(
          await svc
            .from('answer_keys')
            .update({ is_correct: true })
            .eq('answer_id', correctAnswer.id)
            .select('id')
            .single(),
        );
      }
    }
  }

  return NextResponse.json({ data: { id } });
});

/** DELETE /api/admin/quizzes/:id (admin). */
export const DELETE = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const svc = createServiceRoleClient();
  // Service role bypasses RLS — check ownership explicitly.
  await assertCanAuthorQuiz(svc, id, auth);
  unwrapOne(await svc.from('quizzes').delete().eq('id', id).select('id').single());

  return new NextResponse(null, { status: 204 });
});
