import { NextResponse } from 'next/server';
import {
  badRequest,
  forbidden,
  parseBody,
  unwrapMany,
  unwrapMaybe,
  unwrapOne,
  withRoute,
} from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';
import { quizAttemptSchema } from '@/lib/schemas/quizzes.schema';
import { applyModuleProgress, maybeIssueCertificate } from '@/lib/services/progress';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ moduleId: string }> };

/**
 * POST /api/modules/:moduleId/quiz/attempt — score an attempt server-side.
 *
 * Uses the service-role client for two things RLS deliberately forbids the
 * student: reading `answer_keys`, and writing `module_progress`. Because that
 * client bypasses RLS entirely, the purchase check below is the only thing
 * enforcing access — it is not redundant with RLS here, it replaces it.
 */
export const POST = withRoute(async (req, ctx: Ctx) => {
  const { userId } = await requireUser();
  const moduleId = uuidSchema.parse((await ctx.params).moduleId);
  const body = await parseBody(req, quizAttemptSchema);

  const supabase = await createClient();

  const mod = unwrapOne(
    await supabase.from('modules').select('id, course_id').eq('id', moduleId).maybeSingle(),
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

  const svc = createServiceRoleClient();

  const quiz = unwrapOne(
    await svc.from('quizzes').select('id, passing_score').eq('module_id', moduleId).maybeSingle(),
  );

  const questions = unwrapMany(await svc.from('questions').select('id').eq('quiz_id', quiz.id));
  if (questions.length === 0) throw badRequest('Quiz has no questions');

  const questionIds = new Set(questions.map((q) => q.id));

  // The correct answer per question, read with the service role.
  const keys = unwrapMany(
    await svc
      .from('answer_keys')
      .select('answer_id, question_id')
      .eq('is_correct', true)
      .in('question_id', [...questionIds]),
  );
  const correctByQuestion = new Map(keys.map((k) => [k.question_id, k.answer_id]));

  // Ignore submitted answers for questions outside this quiz, and count only
  // one response per question, so a padded payload cannot inflate the score.
  const seen = new Set<string>();
  let correctCount = 0;
  for (const submitted of body.answers) {
    if (!questionIds.has(submitted.question_id)) continue;
    if (seen.has(submitted.question_id)) continue;
    seen.add(submitted.question_id);
    if (correctByQuestion.get(submitted.question_id) === submitted.answer_id) correctCount += 1;
  }

  const score = Math.round((correctCount / questions.length) * 100);
  const passed = score >= quiz.passing_score;

  let moduleCompleted = false;
  let certificateIssued = false;

  if (passed) {
    const progress = await applyModuleProgress(svc, {
      moduleId,
      studentId: userId,
      quizDone: true,
    });
    moduleCompleted = progress.completed;

    if (progress.completed) {
      const result = await maybeIssueCertificate(svc, {
        courseId: mod.course_id,
        studentId: userId,
      });
      certificateIssued = result.issued;
    }
  }

  return NextResponse.json({
    data: {
      score,
      passing_score: quiz.passing_score,
      passed,
      correct_count: correctCount,
      question_count: questions.length,
      module_completed: moduleCompleted,
      certificate_issued: certificateIssued,
    },
  });
});
