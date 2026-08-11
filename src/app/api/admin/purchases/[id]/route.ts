import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { updatePurchaseSchema } from '@/lib/schemas/purchases.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/purchases/:id — one purchase with its course and student (admin).
 *
 * Uses the RLS-scoped client, unlike the PATCH below: reading is something an
 * admin's own session is already entitled to do, so there's no reason to reach
 * for the service role. Only the status transition needs it.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const purchase = unwrapOne(
    await supabase
      .from('purchases')
      .select('*, courses(id, name), profiles!purchases_student_id_fkey(id, full_name, email)')
      .eq('id', id)
      .maybeSingle(),
  );

  return NextResponse.json({ data: purchase });
});

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
