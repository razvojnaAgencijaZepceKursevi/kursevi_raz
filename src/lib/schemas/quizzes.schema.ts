import { z } from '@/lib/openapi/zod';
import { auditFields, uuidSchema } from './common.schema';

/* -------------------------------------------------------------------------- */
/* Student-facing shapes — deliberately have no correctness field             */
/* -------------------------------------------------------------------------- */

export const quizAnswerForTakingSchema = z
  .object({
    id: uuidSchema,
    text: z.string(),
  })
  .openapi('QuizAnswerForTaking', {
    description: 'Answer option as served to a student. Correctness is never included.',
  });

export const quizQuestionForTakingSchema = z
  .object({
    id: uuidSchema,
    text: z.string(),
    answers: z.array(quizAnswerForTakingSchema),
  })
  .openapi('QuizQuestionForTaking');

export const quizForTakingSchema = z
  .object({
    id: uuidSchema,
    module_id: uuidSchema,
    passing_score: z.number().int(),
    questions: z.array(quizQuestionForTakingSchema),
  })
  .openapi('QuizForTaking');

export const quizForTakingResponseSchema = z
  .object({ data: quizForTakingSchema })
  .openapi('QuizForTakingResponse');

/* -------------------------------------------------------------------------- */
/* Attempt                                                                     */
/* -------------------------------------------------------------------------- */

export const quizAttemptSchema = z
  .object({
    answers: z
      .array(
        z.object({
          question_id: uuidSchema,
          answer_id: uuidSchema,
        }),
      )
      .min(1),
  })
  .openapi('QuizAttemptRequest');

export const quizAttemptResultSchema = z
  .object({
    score: z.number().int().openapi({ description: 'Percentage score, 0-100' }),
    passing_score: z.number().int(),
    passed: z.boolean(),
    correct_count: z.number().int(),
    question_count: z.number().int(),
    module_completed: z
      .boolean()
      .openapi({ description: 'Whether this attempt completed the module overall' }),
    certificate_issued: z
      .boolean()
      .openapi({ description: 'True when this attempt completed the final module of the course' }),
  })
  .openapi('QuizAttemptResult');

export const quizAttemptResponseSchema = z
  .object({ data: quizAttemptResultSchema })
  .openapi('QuizAttemptResponse');

/* -------------------------------------------------------------------------- */
/* Admin authoring shapes — these DO carry the answer key                      */
/* -------------------------------------------------------------------------- */

export const adminAnswerInputSchema = z.object({
  text: z.string().trim().min(1),
  is_correct: z.boolean().default(false),
});

export const adminQuestionInputSchema = z.object({
  text: z.string().trim().min(1),
  answers: z
    .array(adminAnswerInputSchema)
    .min(2)
    .refine((answers) => answers.filter((a) => a.is_correct).length === 1, {
      message: 'Each question must have exactly one correct answer',
    }),
});

export const createQuizSchema = z
  .object({
    module_id: uuidSchema,
    passing_score: z.number().int().min(0).max(100),
    questions: z.array(adminQuestionInputSchema).min(1),
  })
  .openapi('CreateQuizRequest');

export const updateQuizSchema = z
  .object({
    passing_score: z.number().int().min(0).max(100).optional(),
    // When present, questions replace the existing set wholesale — partial
    // question patching would need stable client-side ids the authoring UI
    // does not have.
    questions: z.array(adminQuestionInputSchema).min(1).optional(),
  })
  .openapi('UpdateQuizRequest');

export const adminAnswerSchema = z.object({
  id: uuidSchema,
  text: z.string(),
  is_correct: z.boolean(),
});

export const adminQuestionSchema = z.object({
  id: uuidSchema,
  text: z.string(),
  answers: z.array(adminAnswerSchema),
});

export const adminQuizSchema = z
  .object({
    id: uuidSchema,
    module_id: uuidSchema,
    passing_score: z.number().int(),
    questions: z.array(adminQuestionSchema),
    ...auditFields,
  })
  .openapi('AdminQuiz');

export const adminQuizResponseSchema = z
  .object({ data: adminQuizSchema })
  .openapi('AdminQuizResponse');

export type QuizForTaking = z.infer<typeof quizForTakingSchema>;
export type QuizAttemptRequest = z.infer<typeof quizAttemptSchema>;
export type QuizAttemptResult = z.infer<typeof quizAttemptResultSchema>;
export type CreateQuizRequest = z.infer<typeof createQuizSchema>;
export type UpdateQuizRequest = z.infer<typeof updateQuizSchema>;
export type AdminQuiz = z.infer<typeof adminQuizSchema>;
