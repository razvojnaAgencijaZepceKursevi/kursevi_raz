import { NextResponse } from 'next/server';
import { unwrapOne, withRoute } from '@/lib/api/errors';
import { createClient } from '@/lib/supabase/server';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ courseId: string }> };

/** GET /api/courses/:courseId — public course detail (published only). */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const courseId = uuidSchema.parse((await ctx.params).courseId);
  const supabase = await createClient();

  const course = unwrapOne(
    await supabase
      .from('courses')
      .select('*')
      .eq('id', courseId)
      .eq('published', true)
      .maybeSingle(),
  );

  return NextResponse.json({ data: course });
});
