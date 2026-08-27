import { NextResponse } from 'next/server';
import { unwrapMany, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { assertCanAuthorCourse } from '@/lib/auth/courseAccess';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/courses/:id/stats — how one course is actually going.
 *
 * Answers the question a teacher opens a course to ask: who is on it, how far
 * has each of them got, and is anything waiting on me. Until this existed the
 * only way to know was to cross-reference three separate list screens.
 *
 * ## Service role, so the ownership check above it is the access control
 *
 * `module_progress` has no policy for staff at all — students may read their
 * own rows and nothing else — so a teacher's own client cannot see progress on
 * their own course. That is the whole reason this endpoint is needed rather
 * than assembled client-side, and it is why it runs elevated.
 *
 * `assertCanAuthorCourse` is therefore doing real work: admin, or the teacher
 * who owns this course. Standing rule — a route that reaches for the service
 * role owes the reader an ownership check on the line above.
 *
 * ## Counted here rather than in the database
 *
 * A course has a handful of modules and, realistically, tens to hundreds of
 * students. Four indexed reads and a group-by in JavaScript is honest at that
 * size and keeps the shape obvious. If a course ever has thousands of students
 * this wants to become a view or an RPC — the signature would not change.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireStaff();
  const courseId = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  await assertCanAuthorCourse(supabase, courseId, auth);

  const svc = createServiceRoleClient();

  const modules = unwrapMany(
    await svc
      .from('modules')
      .select('id, title, order')
      .eq('course_id', courseId)
      .order('order', { ascending: true }),
  );
  const moduleIds = modules.map((m) => m.id);

  const [purchases, progress, certificates, submissions] = await Promise.all([
    svc
      .from('purchases')
      .select(
        'id, status, created_at, student_id, profiles!purchases_student_id_fkey(id, full_name, email)',
      )
      .eq('course_id', courseId)
      .order('created_at', { ascending: false }),
    // An empty `in` list is valid and matches nothing, so a course with no
    // modules needs no special case here.
    svc
      .from('module_progress')
      .select('student_id, module_id, completed')
      .in('module_id', moduleIds),
    svc
      .from('certificates')
      .select('id, student_id, readable_id, created_at')
      .eq('course_id', courseId),
    // Only what needs a decision. `!inner` is load-bearing: PostgREST filters on
    // an embedded table only when the embed is an inner join.
    svc
      .from('task_submissions')
      .select('id, status, tasks!inner(modules!inner(course_id))', { count: 'exact', head: true })
      .eq('tasks.modules.course_id', courseId)
      .eq('status', 'pending'),
  ]);

  const purchaseRows = unwrapMany(purchases);
  const progressRows = unwrapMany(progress);
  const certificateRows = unwrapMany(certificates);

  const completedByStudent = new Map<string, number>();
  for (const row of progressRows) {
    if (!row.completed) continue;
    completedByStudent.set(row.student_id, (completedByStudent.get(row.student_id) ?? 0) + 1);
  }

  const certificateByStudent = new Map(certificateRows.map((c) => [c.student_id, c]));

  // Approved purchases are the enrolment; requested and denied are shown as
  // counts but are not "students on the course".
  const enrolled = purchaseRows
    .filter((p) => p.status === 'approved')
    .map((p) => {
      const completed = completedByStudent.get(p.student_id) ?? 0;
      return {
        student_id: p.student_id,
        full_name: p.profiles?.full_name ?? null,
        email: p.profiles?.email ?? null,
        enrolled_at: p.created_at,
        completed_modules: completed,
        module_count: modules.length,
        // A course with no modules is unfinished content, not something every
        // student has completed — the same rule `maybeIssueCertificate` uses.
        course_completed: modules.length > 0 && completed >= modules.length,
        certificate: certificateByStudent.get(p.student_id) ?? null,
      };
    });

  return NextResponse.json({
    data: {
      course_id: courseId,
      module_count: modules.length,
      modules,
      enrolled_count: enrolled.length,
      requested_count: purchaseRows.filter((p) => p.status === 'requested').length,
      denied_count: purchaseRows.filter((p) => p.status === 'denied').length,
      completed_count: enrolled.filter((s) => s.course_completed).length,
      certificate_count: certificateRows.length,
      pending_submissions: submissions.count ?? 0,
      students: enrolled,
    },
  });
});
