import { NextResponse } from 'next/server';
import { forbidden, parseBody, unwrapMaybe, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';
import { requestDeliverySchema } from '@/lib/schemas/certificates.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ certificateId: string }> };

/**
 * PATCH /api/certificates/:id/request-delivery — student requests a physical copy.
 *
 * `certificates` grants students SELECT only — there is no student UPDATE
 * policy — so this write must go through the service role. Ownership is
 * confirmed first using the caller's own RLS-scoped client, which can only see
 * their own rows: if that lookup misses, the certificate is not theirs.
 */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  const { userId } = await requireUser();
  const certificateId = uuidSchema.parse((await ctx.params).certificateId);
  const body = await parseBody(req, requestDeliverySchema);

  const supabase = await createClient();
  const owned = unwrapMaybe(
    await supabase
      .from('certificates')
      .select('id')
      .eq('id', certificateId)
      .eq('student_id', userId)
      .maybeSingle(),
  );
  if (!owned) throw forbidden('This certificate does not belong to you');

  const svc = createServiceRoleClient();
  const updated = unwrapOne(
    await svc
      .from('certificates')
      .update({ requested_delivery: body.requested_delivery })
      .eq('id', certificateId)
      .select()
      .single(),
  );

  return NextResponse.json({ data: updated });
});
