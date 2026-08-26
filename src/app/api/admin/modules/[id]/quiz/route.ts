import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { assertCanAuthorModule } from '@/lib/auth/courseAccess';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { ADMIN_QUIZ_SELECT, flattenAdminQuiz } from '@/lib/api/adminQuiz';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/modules/:id/quiz — the module's quiz **including the answer
 * key**, for authoring.
 *
 * ## Why this exists next to `/api/admin/quizzes/:id`
 *
 * The authoring screen is reached from a module, so a module id is all it has.
 * Without this it would need two round trips — ask the student endpoint for the
 * quiz id, then ask the admin endpoint for the real shape — and the first of
 * those returns a payload deliberately stripped of the answer key.
 *
 * ## A module with no quiz is a 404
 *
 * Same contract as `/api/modules/:id/task`: `unwrapOne` on a `maybeSingle()`
 * turns "no row" into 404, which the authoring page treats as *the create case*
 * and which stays distinguishable from the 403 meaning "not your course".
 *
 * The service-role client is used because `answer_keys` has no policy for
 * anyone but admins — which means RLS is off, so `assertCanAuthorModule` is
 * what stops a teacher reading another teacher's answers.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireStaff();
  const moduleId = uuidSchema.parse((await ctx.params).id);

  const svc = createServiceRoleClient();
  await assertCanAuthorModule(svc, moduleId, auth);

  const quiz = unwrapOne(
    await svc.from('quizzes').select(ADMIN_QUIZ_SELECT).eq('module_id', moduleId).maybeSingle(),
  );

  return NextResponse.json({ data: flattenAdminQuiz(quiz) });
});
