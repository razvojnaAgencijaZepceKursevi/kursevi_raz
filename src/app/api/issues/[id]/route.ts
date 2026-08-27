import { NextResponse } from 'next/server';
import { notFound, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/issues/:id — one issue.
 *
 * RLS is the access control: the reporter or an admin. Anyone else gets a 404
 * rather than a 403, since confirming an id exists tells them something.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireUser();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const issue = unwrapMaybe(
    await supabase
      .from('issues')
      .select('*, profiles!issues_reporter_id_fkey(id, full_name, email)')
      .eq('id', id)
      .maybeSingle(),
  );

  if (!issue) throw notFound('Issue not found');

  return NextResponse.json({ data: issue });
});
