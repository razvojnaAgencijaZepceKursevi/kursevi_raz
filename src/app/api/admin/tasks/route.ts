import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createTaskSchema } from '@/lib/schemas/tasks.schema';

export const dynamic = 'force-dynamic';

/** POST /api/admin/tasks — create a task (admin). */
export const POST = withRoute(async (req) => {
  await requireStaff();
  const body = await parseBody(req, createTaskSchema);

  const supabase = await createClient();
  const created = unwrapOne(await supabase.from('tasks').insert(body).select().single());

  return NextResponse.json({ data: created }, { status: 201 });
});
