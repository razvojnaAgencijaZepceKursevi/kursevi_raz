import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { assertModuleAccess } from '@/lib/auth/courseAccess';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ moduleId: string }> };

/**
 * GET /api/modules/:moduleId/task — the module's task, for anyone allowed to
 * read that course's content.
 *
 * Access goes through `assertModuleAccess`, which covers admins, the teacher who
 * owns the course, and students with an approved purchase. This route
 * previously demanded a purchase from everyone who was not an admin, which
 * locked teachers out of the task on their own module.
 *
 * ## A module with no task is a 404
 *
 * `unwrapOne` on a `maybeSingle()` turns "no row" into a 404, and that is the
 * intended contract: the sub-resource genuinely does not exist. The admin task
 * screen relies on it — 404 means "offer to create one", while 403 means "not
 * your course". Do not soften this to `{ data: null }` without updating that
 * page, which distinguishes the two by status.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const auth = await requireUser();
  const moduleId = uuidSchema.parse((await ctx.params).moduleId);

  const supabase = await createClient();
  await assertModuleAccess(supabase, moduleId, auth);

  const task = unwrapOne(
    await supabase.from('tasks').select('*, task_files(*)').eq('module_id', moduleId).maybeSingle(),
  );

  return NextResponse.json({ data: task });
});
