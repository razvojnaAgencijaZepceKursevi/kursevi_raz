import 'server-only';

/**
 * The one place that knows how a submission is read for the review screens.
 *
 * Two routes serve it — the list (`/api/admin/submissions`) and the detail
 * (`/api/admin/submissions/:id`) — and the review UI reads the same fields from
 * both, so the projection and the flattening live here rather than being
 * written twice. Same reasoning as `adminQuiz.ts`.
 */

/**
 * A submission row is three uuids and a status; on its own it tells a reviewer
 * nothing they can act on. This walks the whole chain up to the course, plus
 * the student, so a list row can say *who* submitted *what* on *which* course.
 *
 * `!inner` on `tasks` and `modules` is load-bearing, not decoration: the
 * `courseId` filter is expressed as `tasks.modules.course_id`, and PostgREST can
 * only filter on an embedded table when the embed is an inner join. Without it
 * the filter is silently ignored and every submission comes back.
 *
 * `task_messages(count)` rides along so the list can show thread size without a
 * second query per row.
 */
export const ADMIN_SUBMISSION_SELECT = `
  *,
  profiles!task_submissions_student_id_fkey(id, full_name, email),
  tasks!inner(
    id,
    text,
    module_id,
    modules!inner(
      id,
      title,
      course_id,
      courses(id, name, slug)
    )
  ),
  task_messages(count)
`;

type RawSubmission = { task_messages?: { count: number }[] | null } & Record<string, unknown>;

/**
 * PostgREST delivers a `count` embed as `task_messages: [{ count: n }]`, and
 * `[{ count: 0 }]` when the thread is empty. `adminSubmissionSchema` declares a
 * flat `message_count`, so without this the typed hook is simply wrong about
 * its own shape.
 *
 * Same treatment `/api/categories` gives `courses(count)` — flatten at the
 * boundary rather than leaking the join shape into the client.
 */
export function flattenAdminSubmission<T extends RawSubmission>(submission: T) {
  const { task_messages, ...rest } = submission;
  return { ...rest, message_count: task_messages?.[0]?.count ?? 0 };
}
