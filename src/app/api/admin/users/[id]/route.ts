import { NextResponse } from 'next/server';
import { badRequest, parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { updateUserSchema } from '@/lib/schemas/users.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/admin/users/:id — update a user's role (admin).
 *
 * Uses the RLS client, not the service role: admins already have full access to
 * profiles under RLS, and the prevent_unauthorized_role_change trigger provides
 * a second check that the caller really is an admin.
 */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  const admin = await requireAdmin();
  const { id } = await ctx.params;
  const userId = uuidSchema.parse(id);

  const body = await parseBody(req, updateUserSchema);

  // Guard against an admin removing their own last foothold.
  if (userId === admin.userId && body.role !== 'admin') {
    throw badRequest('You cannot remove your own admin role');
  }

  const supabase = await createClient();
  const updated = unwrapOne(
    await supabase.from('profiles').update({ role: body.role }).eq('id', userId).select().single(),
  );

  return NextResponse.json({ data: updated });
});
