import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createModuleSchema } from '@/lib/schemas/modules.schema';

export const dynamic = 'force-dynamic';

/** POST /api/admin/modules — create a module (admin). */
export const POST = withRoute(async (req) => {
  await requireStaff();
  const body = await parseBody(req, createModuleSchema);

  const supabase = await createClient();
  const created = unwrapOne(
    await supabase
      .from('modules')
      .insert({
        course_id: body.course_id,
        title: body.title,
        description: body.description ?? null,
        video_url: body.video_url ?? null,
        order: body.order,
      })
      .select()
      .single(),
  );

  return NextResponse.json({ data: created }, { status: 201 });
});
