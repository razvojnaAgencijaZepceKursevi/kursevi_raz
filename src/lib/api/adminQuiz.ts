import 'server-only';

/**
 * The one place that knows how an authoring-shaped quiz is read.
 *
 * Two routes serve it — by quiz id (`/api/admin/quizzes/:id`) and by module
 * (`/api/admin/modules/:id/quiz`, which is what the authoring screen has) — and
 * both must return the identical shape. Keeping the projection and the
 * flattening here means they cannot drift into disagreeing about it.
 */

/**
 * Includes `answer_keys`, which the student-facing quiz projection must never
 * select. Only ever use this from a route that has already established the
 * caller may author the course.
 */
export const ADMIN_QUIZ_SELECT =
  '*, questions(id, text, answers(id, text, answer_keys(is_correct)))';

type RawAnswer = { id: string; text: string; answer_keys?: { is_correct: boolean }[] | null };
type RawQuestion = { id: string; text: string; answers: RawAnswer[] };
type RawQuiz = { questions: RawQuestion[] } & Record<string, unknown>;

/**
 * PostgREST returns the embed nested as `answer_keys: [{ is_correct }]`, while
 * `adminQuizSchema` — and therefore `useAdminQuiz` — declares a flat
 * `is_correct` on the answer. Without this the typed hook simply lies, and the
 * authoring UI reads `undefined` for every correct flag.
 *
 * Same treatment `/api/categories` gives `courses(count)`: flatten at the
 * boundary rather than leaking the join shape into the client.
 */
export function flattenAdminQuiz<T extends RawQuiz>(quiz: T) {
  return {
    ...quiz,
    questions: quiz.questions.map((question) => ({
      ...question,
      answers: question.answers.map(({ answer_keys, ...answer }) => ({
        ...answer,
        // `answers_ensure_answer_key` guarantees a row exists, so the array is
        // never actually empty — but false is the safe reading regardless.
        is_correct: answer_keys?.[0]?.is_correct ?? false,
      })),
    })),
  };
}
