import { NextResponse } from 'next/server';
import { conflict, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { assertModuleAccess } from '@/lib/auth/courseAccess';
import { uuidSchema } from '@/lib/schemas/common.schema';
import { applyModuleProgress, maybeIssueCertificate } from '@/lib/services/progress';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ moduleId: string }> };

/**
 * POST /api/modules/:moduleId/complete — "I have been through this module."
 *
 * ## The hole this fills
 *
 * `module_progress` had exactly two writers: the quiz-attempt route and the
 * submission-approval route. A module with **neither a quiz nor a task** —
 * a video, some materials, and nothing to hand in — therefore had nobody to
 * write its row, so no row was ever created and the progress endpoint reported
 * `completed: false` by absence, permanently.
 *
 * The derivation was never wrong. `recompute_module_progress_completed` (0011)
 * computes `(no quiz OR quiz_done) AND (no task OR task_done)`, which is `true`
 * for a requirements-free module the instant a row exists. Nothing ever
 * inserted one. Under sequential unlock that strands the student on that module
 * and locks every module after it — and on the last module of a course it also
 * means the certificate can never be issued.
 *
 * ## Why this refuses a module that has a quiz or a task
 *
 * Without that check this endpoint is a "skip the quiz" button: a student could
 * POST here and have the module marked done without answering anything. So it
 * 409s, and completion for those modules stays where it was earned. This is the
 * one rule in the route that is load-bearing for correctness rather than
 * convenience.
 *
 * ## Why a deliberate action and not "you opened the page"
 *
 * The app cannot tell whether a video was watched or a PDF read, so *something*
 * has to stand in for it. Auto-completing on view would mean a mis-click
 * finishes a module — and on the final module of a course, that a certificate
 * is issued because a page loaded. Asking the student to say so keeps
 * `completed` meaning "the student got through this", which is what every other
 * writer of this column also means.
 *
 * Idempotent: `applyModuleProgress` reads-modifies-writes, so a second call is
 * a no-op and `maybeIssueCertificate` is already idempotent by its unique index.
 */
export const POST = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireUser();
  const moduleId = uuidSchema.parse((await ctx.params).moduleId);

  const supabase = await createClient();

  // Approved purchase, owning teacher, or admin. Also resolves the course id,
  // which the certificate check needs.
  const courseId = await assertModuleAccess(supabase, moduleId, auth);

  // The service role from here: `module_progress` grants students SELECT and
  // nothing else (0014), and issuing a certificate is service-role only. The
  // access check above is what stands in for RLS, per the standing rule.
  const svc = createServiceRoleClient();

  // Genuinely parallel: `unwrapMaybe` must run on the settled results, not
  // inside the array, or the two awaits just queue up one after the other.
  const [quizResult, taskResult] = await Promise.all([
    svc.from('quizzes').select('id').eq('module_id', moduleId).maybeSingle(),
    svc.from('tasks').select('id').eq('module_id', moduleId).maybeSingle(),
  ]);
  const quiz = unwrapMaybe(quizResult);
  const task = unwrapMaybe(taskResult);

  if (quiz || task) {
    throw conflict(
      'This module has a quiz or a task; it is completed by doing them, not by marking it done',
    );
  }

  const progress = await applyModuleProgress(svc, { moduleId, studentId: auth.userId });

  // Belt and braces. The trigger derives `completed` and, with no quiz and no
  // task, it can only be true — but reading it back rather than assuming means
  // a future change to the formula cannot make this route lie.
  let certificateIssued = false;
  if (progress.completed) {
    const result = await maybeIssueCertificate(svc, { courseId, studentId: auth.userId });
    certificateIssued = result.issued;
  }

  return NextResponse.json({
    data: {
      module_id: moduleId,
      completed: progress.completed,
      certificate_issued: certificateIssued,
    },
  });
});
