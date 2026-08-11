import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createTaskFileSchema } from '@/lib/schemas/tasks.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/admin/tasks/:id/files — register an uploaded task file (admin). */
export const POST = withRoute(async (req, ctx: Ctx) => {
  await requireStaff();
  const taskId = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, createTaskFileSchema);

  const supabase = await createClient();
  const created = unwrapOne(
    await supabase
      .from('task_files')
      .insert({
        task_id: taskId,
        file_path: body.file_path,
        file_name: body.file_name ?? null,
      })
      .select()
      .single(),
  );

  return NextResponse.json({ data: created }, { status: 201 });
});
