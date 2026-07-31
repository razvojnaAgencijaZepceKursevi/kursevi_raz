import { NextResponse } from 'next/server';
import { parseQuery, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { metaFor, rangeFor } from '@/lib/schemas/common.schema';
import { listUsersQuerySchema } from '@/lib/schemas/users.schema';

export const dynamic = 'force-dynamic';

/** GET /api/admin/users — list/search users (admin). */
export const GET = withRoute(async (req) => {
  await requireAdmin();

  const query = parseQuery(req, listUsersQuerySchema);
  const supabase = await createClient();
  const [from, to] = rangeFor(query);

  let q = supabase.from('profiles').select('*', { count: 'exact' });

  if (query.search) {
    q = q.or(`full_name.ilike.%${query.search}%,email.ilike.%${query.search}%`);
  }
  if (query.role) {
    q = q.eq('role', query.role);
  }

  const result = await q.order('created_at', { ascending: false }).range(from, to);
  const rows = unwrapMany(result);

  return NextResponse.json({ data: rows, meta: metaFor(query, result.count ?? 0) });
});
