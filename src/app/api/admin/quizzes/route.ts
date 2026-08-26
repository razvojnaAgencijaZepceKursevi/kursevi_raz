import { NextResponse } from 'next/server';
import { parseBody, unwrapMany, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { assertCanAuthorModule } from '@/lib/auth/courseAccess';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { createQuizSchema } from '@/lib/schemas/quizzes.schema';

export const dynamic = 'force-dynamic';

/**
 * POST /api/admin/quizzes — nested create of quiz + questions + answers.
 *
 * Runs with the service role because it writes `answer_keys`, which has no
 * policy for anyone but admins and would otherwise need a second round trip.
 * That bypasses RLS, so `assertCanAuthorModule` does the ownership check the
 * policies would otherwise have done.
 */
export const POST = withRoute(async (req) => {
  const auth = await requireStaff();
  const body = await parseBody(req, createQuizSchema);

  const svc = createServiceRoleClient();

  // requireStaff() only proves "is staff". The service-role client below
  // bypasses RLS, so ownership has to be checked here or any teacher could
  // attach a quiz to any teacher's module.
  await assertCanAuthorModule(svc, body.module_id, auth);

  const quiz = unwrapOne(
    await svc
      .from('quizzes')
      .insert({ module_id: body.module_id, passing_score: body.passing_score })
      .select()
      .single(),
  );

  for (const question of body.questions) {
    const createdQuestion = unwrapOne(
      await svc
        .from('questions')
        .insert({ quiz_id: quiz.id, text: question.text })
        .select()
        .single(),
    );

    const createdAnswers = unwrapMany(
      await svc
        .from('answers')
        .insert(question.answers.map((a) => ({ question_id: createdQuestion.id, text: a.text })))
        .select(),
    );

    // A trigger creates one answer_keys row per answer (is_correct = false), so
    // marking the right one is an update rather than an insert.
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

  return NextResponse.json({ data: { id: quiz.id } }, { status: 201 });
});
