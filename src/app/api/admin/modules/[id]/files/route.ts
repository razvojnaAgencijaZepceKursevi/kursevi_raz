import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createModuleFileSchema } from '@/lib/schemas/modules.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/admin/modules/:id/files — register an uploaded module file (admin).
 *
 * The binary upload goes straight to Storage from the client (admin-write
 * policy on the `module-files` bucket); this records the resulting object path
 * so students can list files without needing bucket-listing rights.
 */
export const POST = withRoute(async (req, ctx: Ctx) => {
  await requireAdmin();
  const moduleId = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, createModuleFileSchema);

  const supabase = await createClient();
  const created = unwrapOne(
    await supabase
      .from('module_files')
      .insert({
        module_id: moduleId,
        file_path: body.file_path,
        file_name: body.file_name ?? null,
      })
      .select()
      .single(),
  );

  return NextResponse.json({ data: created }, { status: 201 });
});
