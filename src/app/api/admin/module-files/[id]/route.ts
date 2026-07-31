import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * DELETE /api/admin/module-files/:id (admin).
 *
 * Removes the storage object alongside the row so deleting a file does not
 * leave an orphaned object silently occupying the bucket.
 */
export const DELETE = withRoute(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const removed = unwrapOne(
    await supabase.from('module_files').delete().eq('id', id).select('file_path').single(),
  );

  if (removed.file_path) {
    const svc = createServiceRoleClient();
    const { error } = await svc.storage.from('module-files').remove([removed.file_path]);
    // The row is already gone; a failed object cleanup should not 500 the call.
    if (error) console.error('[module-files] storage cleanup failed', error.message);
  }

  return new NextResponse(null, { status: 204 });
});
