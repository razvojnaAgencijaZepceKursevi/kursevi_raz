import { NextResponse } from 'next/server';
import { unwrapMany, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createServiceRoleClient } from '@/lib/supabase/service-role';

export const dynamic = 'force-dynamic';

/**
 * POST /api/notifications/read-all — clear your own unread badge.
 *
 * Service role for the same reason as the single-row route: `notifications` has
 * no UPDATE policy, deliberately, because one would also permit rewriting the
 * text. Here the scoping is inherent rather than checked — the update is keyed
 * on `user_id = caller`, so it cannot touch anybody else's rows whatever the
 * request says.
 */
export const POST = withRoute(async () => {
  const { userId } = await requireUser();

  const svc = createServiceRoleClient();
  const updated = unwrapMany(
    await svc
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null)
      .select('id'),
  );

  return NextResponse.json({ data: { marked: updated.length } });
});
