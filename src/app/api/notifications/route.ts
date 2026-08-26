import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listNotificationsQuerySchema } from '@/lib/schemas/notifications.schema';

export const dynamic = 'force-dynamic';

/**
 * GET /api/notifications — your own notifications, newest first.
 *
 * Scoped by `user_id` explicitly *and* by RLS. The policy alone would do it —
 * `notifications_select_own` admits nothing else, not even an admin — but the
 * filter states the intent at the point a reader is looking, and costs nothing.
 *
 * ## This is also the unread counter
 *
 * The bell polls `?unread=true&pageSize=1` and reads `meta.total`, following
 * the project's standing rule for "I need a count, not rows". A dedicated
 * count endpoint would be a second thing to keep correct for no new capability,
 * and the partial index `notifications_unread_idx` is what makes it cheap.
 */
export const GET = withRoute(async (req) => {
  const { userId } = await requireUser();
  const query = parseQuery(req, listNotificationsQuerySchema);

  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('notifications').select('*', { count: 'exact' }).eq('user_id', userId);

  if (query.unread) q = q.is('read_at', null);

  const result = await q.order('created_at', { ascending: false }).range(from, to);

  return NextResponse.json({
    data: unwrapMany(result),
    meta: metaFor(query, result.count ?? 0),
  });
});
