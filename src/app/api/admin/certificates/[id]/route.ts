import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/certificates/:id — one certificate with course + student (admin).
 *
 * Read-only, and the only admin certificate endpoint there is. There is
 * deliberately no PATCH: `requested_delivery` is the student's flag, set via
 * `/api/certificates/:id/request-delivery`, which checks ownership and so
 * cannot be used by an admin. Marking a delivery *fulfilled* would need a new
 * column on `certificates` — a migration, not a client-side workaround.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const certificate = unwrapOne(
    await supabase
      .from('certificates')
      .select('*, courses(id, name), profiles!certificates_student_id_fkey(id, full_name, email)')
      .eq('id', id)
      .maybeSingle(),
  );

  return NextResponse.json({ data: certificate });
});
