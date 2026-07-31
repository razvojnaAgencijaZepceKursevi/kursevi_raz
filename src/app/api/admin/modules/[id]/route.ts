import { NextResponse } from 'next/server';
import { badRequest, parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { updateModuleSchema } from '@/lib/schemas/modules.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/modules/:id (admin). */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updateModuleSchema);

  if (Object.keys(body).length === 0) throw badRequest('No fields to update');

  const supabase = await createClient();
  const updated = unwrapOne(
    await supabase.from('modules').update(body).eq('id', id).select().single(),
  );

  return NextResponse.json({ data: updated });
});

/** DELETE /api/admin/modules/:id (admin). Cascades to files, quiz and task. */
export const DELETE = withRoute(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  unwrapOne(await supabase.from('modules').delete().eq('id', id).select('id').single());

  return new NextResponse(null, { status: 204 });
});
