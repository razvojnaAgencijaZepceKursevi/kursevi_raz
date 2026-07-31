import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { updatePurchaseSchema } from '@/lib/schemas/purchases.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/purchases/:id — approve or deny (admin).
 *
 * This is the status transition that grants course access, so it runs with the
 * service role. `requireAdmin()` is the authorisation — the service-role client
 * performs none of its own.
 */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updatePurchaseSchema);

  const svc = createServiceRoleClient();
  const updated = unwrapOne(
    await svc.from('purchases').update({ status: body.status }).eq('id', id).select().single(),
  );

  return NextResponse.json({ data: updated });
});
