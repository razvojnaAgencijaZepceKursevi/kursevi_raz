import { NextResponse } from 'next/server';
import { notFound, unwrapMaybe, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * PATCH /api/notifications/:id/read — mark one notification as read.
 *
 * ## Why the service role for a user marking their own row
 *
 * `notifications` has no UPDATE policy, and should not get one: **RLS grants a
 * whole row, never a column.** A policy letting you update your own
 * notification would equally let you rewrite its `title` and `body` through
 * PostgREST — turning a record of what you were told into whatever you would
 * rather it had said. Only `read_at` is a legitimate write, and only the route
 * can say so.
 *
 * Same shape as `PATCH /api/messages/:id`: confirm ownership with the caller's
 * own RLS-scoped client first — which can only see their own notifications —
 * then write with the service role.
 *
 * Idempotent. Marking an already-read notification read again keeps the
 * original timestamp, because when you *first* saw it is the interesting fact.
 */
export const PATCH = withRoute(async (_req, ctx: Ctx) => {
  const { userId } = await requireUser();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const existing = unwrapMaybe(
    await supabase.from('notifications').select('id, read_at').eq('id', id).maybeSingle(),
  );

  if (!existing) throw notFound('Notification not found');
  if (existing.read_at) return NextResponse.json({ data: existing });

  const svc = createServiceRoleClient();
  const updated = unwrapOne(
    await svc
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', id)
      // Belt and braces: the ownership check above is the real one, but the
      // service role has no RLS behind it, so the write says who it is for.
      .eq('user_id', userId)
      .select()
      .single(),
  );

  return NextResponse.json({ data: updated });
});
