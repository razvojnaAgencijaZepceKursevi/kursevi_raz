import { NextResponse } from 'next/server';
import { badRequest, parseBody, unwrapMaybe, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireStaff } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { notifyAfterResponse } from '@/lib/services/notifications';
import { updateCourseSchema } from '@/lib/schemas/courses.schema';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/admin/courses/:id — any publish state (admin). */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const course = unwrapOne(await supabase.from('courses').select('*').eq('id', id).maybeSingle());

  return NextResponse.json({ data: course });
});

/** PATCH /api/admin/courses/:id (admin). */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updateCourseSchema);

  if (Object.keys(body).length === 0) throw badRequest('No fields to update');

  const supabase = await createClient();

  // Read before write, so the publish transition can be detected. `published`
  // is trigger-guarded (`guard_course_privileged_columns`), so a teacher can
  // never reach the branch below by publishing their own course — which is
  // exactly why the owner needs telling when an admin does it for them.
  const previous = unwrapMaybe(
    await supabase.from('courses').select('published, owner_id').eq('id', id).maybeSingle(),
  );

  const updated = unwrapOne(
    await supabase.from('courses').update(body).eq('id', id).select().single(),
  );

  const justPublished = updated.published && previous && !previous.published;

  if (justPublished && updated.owner_id) {
    notifyAfterResponse({
      userIds: [updated.owner_id],
      type: 'course_published',
      title: 'Vaš kurs je objavljen',
      body: `Kurs „${updated.name}” je objavljen i vidljiv je u katalogu.`,
      link: `/courses/${updated.slug}`,
      email: {
        subject: `Kurs je objavljen — ${updated.name}`,
        heading: 'Vaš kurs je objavljen',
        lines: [
          `Administrator je objavio kurs „${updated.name}”. Sada je vidljiv u javnom katalogu i studenti mogu da traže pristup.`,
        ],
        action: { label: 'Pogledaj kurs', href: `/courses/${updated.slug}` },
      },
    });
  }

  return NextResponse.json({ data: updated });
});

/** DELETE /api/admin/courses/:id (admin). Cascades to modules and their content. */
export const DELETE = withRoute(async (_req, ctx: Ctx) => {
  await requireStaff();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  unwrapOne(await supabase.from('courses').delete().eq('id', id).select('id').single());

  return new NextResponse(null, { status: 204 });
});
