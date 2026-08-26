import 'server-only';

import { forbidden, unwrapMaybe } from '@/lib/api/errors';
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import type { AuthContext } from '@/lib/auth/guards';

/**
 * Either Supabase client works here: the request-scoped one (RLS applies) or the
 * service-role one (it does not). These helpers make an explicit ownership
 * check, so they are correct with both — which is the point, since the routes
 * that most need them are the ones that bypassed RLS.
 */
type AnySupabaseClient = SupabaseClient<Database>;
type ServerClient = AnySupabaseClient;

/**
 * "May this signed-in person read the contents of this course?"
 *
 * Three different people are allowed, and the third is the one that keeps
 * getting forgotten:
 *
 *   - an **admin**;
 *   - the **teacher who owns the course** — they authored it and never buy it;
 *   - a **student with an approved purchase**.
 *
 * Written as `role !== 'admin' → require a purchase`, which is the obvious
 * shape, this check 403s teachers out of their own material. That bug shipped
 * once in `/api/courses/:courseId/modules` and was still present in the task and
 * quiz endpoints. It lives here now so a fourth caller inherits the fix instead
 * of re-deriving it — the same reasoning that put the staff test inside
 * `owns_course()` in migration 0019 rather than at its three call sites.
 *
 * RLS already permits (or denies) these reads on its own. This exists to turn
 * "your query returned no rows" into an explicit 403, which is a far more
 * useful answer for the client.
 *
 * Not to be confused with `src/lib/courseAccess.ts`, which is the *client-side*
 * module-unlock rule.
 */
export async function assertCourseAccess(
  supabase: ServerClient,
  courseId: string,
  { userId, profile }: AuthContext,
): Promise<void> {
  if (profile.role === 'admin') return;

  if (profile.role === 'teacher') {
    const owned = unwrapMaybe(
      await supabase
        .from('courses')
        .select('id')
        .eq('id', courseId)
        .eq('owner_id', userId)
        .maybeSingle(),
    );
    if (owned) return;
  }

  const purchase = unwrapMaybe(
    await supabase
      .from('purchases')
      .select('id')
      .eq('course_id', courseId)
      .eq('student_id', userId)
      .eq('status', 'approved')
      .maybeSingle(),
  );

  if (!purchase) throw forbidden('An approved purchase is required for this course');
}

/**
 * Same rule, but starting from a module id — the shape the per-module endpoints
 * (`/api/modules/:moduleId/task`, `.../quiz`) need.
 *
 * Returns the module's `course_id` so the caller does not have to look it up a
 * second time. A module id that does not exist raises a 403 rather than a 404:
 * telling an unauthorised caller "that module is not here" is still telling
 * them something about it.
 */
export async function assertModuleAccess(
  supabase: ServerClient,
  moduleId: string,
  auth: AuthContext,
): Promise<string> {
  const currentModule = unwrapMaybe(
    await supabase.from('modules').select('course_id').eq('id', moduleId).maybeSingle(),
  );

  if (!currentModule) throw forbidden('An approved purchase is required for this course');

  await assertCourseAccess(supabase, currentModule.course_id, auth);
  return currentModule.course_id;
}

/* -------------------------------------------------------------------------- */
/* Authoring — a stricter question than access                                */
/* -------------------------------------------------------------------------- */

/**
 * "May this person *edit* this course's content?"
 *
 * Distinct from `assertCourseAccess`, and the difference matters: a student
 * with an approved purchase may read a module, but must never be able to write
 * one. Only an admin or the owning teacher passes here.
 *
 * ## Why this exists at all when RLS already says the same thing
 *
 * It does not — not on every route. The `can_author_*` policies enforce this
 * for anything using the request-scoped client, but a route that switches to
 * the **service-role client bypasses RLS entirely**, and several must (writing
 * `answer_keys` is impossible any other way). On those routes `requireStaff()`
 * only establishes "is staff", which is not the same as "owns this" — and
 * without this check a teacher could read and rewrite another teacher's quiz,
 * answer key included. That was live until it was found by probing the running
 * app.
 *
 * Rule of thumb: if a route creates a service-role client, it owes the reader
 * an explicit ownership check on the line above.
 */
export async function assertCanAuthorCourse(
  client: AnySupabaseClient,
  courseId: string,
  auth: AuthContext,
): Promise<void> {
  if (await canAuthorCourse(client, courseId, auth)) return;
  throw forbidden('This course is not yours to edit');
}

/**
 * The same question, answered rather than enforced.
 *
 * Most callers want the throwing form — a route that cannot proceed should say
 * 403 and stop. This exists for the one case that genuinely needs the boolean:
 * `POST /api/submissions/:id/messages` serves *both* sides of a thread, so
 * "are you the reviewer" decides whether a `status` field is honoured, not
 * whether the request is allowed at all. A student posting one is ignored, and
 * ignoring is not something a thrower can express.
 */
export async function canAuthorCourse(
  client: AnySupabaseClient,
  courseId: string,
  { userId, profile }: AuthContext,
): Promise<boolean> {
  if (profile.role === 'admin') return true;
  if (profile.role !== 'teacher') return false;

  const course = unwrapMaybe(
    await client.from('courses').select('owner_id').eq('id', courseId).maybeSingle(),
  );

  return course?.owner_id === userId;
}

/**
 * "May this person review submissions for this task?"
 *
 * The application-side twin of the `can_review_submission()` predicate added in
 * migration 0017: an admin, or the teacher who owns the course the task's
 * module belongs to.
 *
 * It exists because the route that needs it writes with the **service-role
 * client** — approving a submission also writes `module_progress` and may issue
 * a certificate, neither of which a teacher may touch directly — and a
 * service-role route is owed an explicit ownership check on the next line.
 */
export async function canReviewTask(
  client: AnySupabaseClient,
  taskId: string,
  auth: AuthContext,
): Promise<boolean> {
  if (auth.profile.role === 'admin') return true;
  if (auth.profile.role !== 'teacher') return false;

  const task = unwrapMaybe(
    await client.from('tasks').select('module_id').eq('id', taskId).maybeSingle(),
  );
  if (!task) return false;

  const currentModule = unwrapMaybe(
    await client.from('modules').select('course_id').eq('id', task.module_id).maybeSingle(),
  );
  if (!currentModule) return false;

  return canAuthorCourse(client, currentModule.course_id, auth);
}

/** Same rule, from a module id. Returns the module's `course_id`. */
export async function assertCanAuthorModule(
  client: AnySupabaseClient,
  moduleId: string,
  auth: AuthContext,
): Promise<string> {
  const currentModule = unwrapMaybe(
    await client.from('modules').select('course_id').eq('id', moduleId).maybeSingle(),
  );

  // A module that does not exist and one that is not yours get the same answer:
  // saying which would confirm the id belongs to somebody.
  if (!currentModule) throw forbidden('This course is not yours to edit');

  await assertCanAuthorCourse(client, currentModule.course_id, auth);
  return currentModule.course_id;
}

/** Same rule, from a quiz id — quiz → module → course. */
export async function assertCanAuthorQuiz(
  client: AnySupabaseClient,
  quizId: string,
  auth: AuthContext,
): Promise<void> {
  const quiz = unwrapMaybe(
    await client.from('quizzes').select('module_id').eq('id', quizId).maybeSingle(),
  );

  if (!quiz) throw forbidden('This course is not yours to edit');

  await assertCanAuthorModule(client, quiz.module_id, auth);
}
