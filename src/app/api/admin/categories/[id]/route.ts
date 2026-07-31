import { NextResponse } from 'next/server';
import { badRequest, parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { updateCategorySchema } from '@/lib/schemas/categories.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/admin/categories/:id (admin). */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updateCategorySchema);

  if (Object.keys(body).length === 0) throw badRequest('No fields to update');

  const supabase = await createClient();
  const updated = unwrapOne(
    await supabase.from('categories').update(body).eq('id', id).select().single(),
  );

  return NextResponse.json({ data: updated });
});

/** DELETE /api/admin/categories/:id (admin). Courses fall back to uncategorised. */
export const DELETE = withRoute(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  unwrapOne(await supabase.from('categories').delete().eq('id', id).select('id').single());

  return new NextResponse(null, { status: 204 });
});
