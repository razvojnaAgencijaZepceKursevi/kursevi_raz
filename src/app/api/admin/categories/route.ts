import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createCategorySchema } from '@/lib/schemas/categories.schema';

export const dynamic = 'force-dynamic';

/** POST /api/admin/categories — create a category (admin). */
export const POST = withRoute(async (req) => {
  await requireAdmin();
  const body = await parseBody(req, createCategorySchema);

  const supabase = await createClient();
  const created = unwrapOne(await supabase.from('categories').insert(body).select().single());

  return NextResponse.json({ data: created }, { status: 201 });
});
