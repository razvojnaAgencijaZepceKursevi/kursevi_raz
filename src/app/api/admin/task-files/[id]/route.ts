import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/admin/task-files/:id (admin). Also removes the storage object. */
export const DELETE = withRoute(async (_req, ctx: Ctx) => {
  await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const removed = unwrapOne(
    await supabase.from('task_files').delete().eq('id', id).select('file_path').single(),
  );

  if (removed.file_path) {
    const svc = createServiceRoleClient();
    const { error } = await svc.storage.from('task-files').remove([removed.file_path]);
    if (error) console.error('[task-files] storage cleanup failed', error.message);
  }

  return new NextResponse(null, { status: 204 });
});
