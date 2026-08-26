import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { updatePurchaseSchema } from '@/lib/schemas/purchases.schema';
import { notifyAfterResponse } from '@/lib/services/notifications';
import { uuidSchema } from '@/lib/schemas/common.schema';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/purchases/:id — one purchase with its course and student (admin).
 *
 * Uses the RLS-scoped client, unlike the PATCH below: reading is something an
 * admin's own session is already entitled to do, so there's no reason to reach
 * for the service role. Only the status transition needs it.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);

  const supabase = await createClient();
  const purchase = unwrapOne(
    await supabase
      .from('purchases')
      .select(
        '*, courses(id, name, slug, thumbnail_path), profiles!purchases_student_id_fkey(id, full_name, email)',
      )
      .eq('id', id)
      .maybeSingle(),
  );

  return NextResponse.json({ data: purchase });
});

/**
 * PATCH /api/admin/purchases/:id — approve or deny (admin).
 *
 * This is the status transition that grants course access, so it runs with the
 * service role. `requireAdmin()` is the authorisation — the service-role client
 * performs none of its own.
 */
export const PATCH = withRoute(async (req, ctx: Ctx) => {
  await requireAdmin();
  const id = uuidSchema.parse((await ctx.params).id);
  const body = await parseBody(req, updatePurchaseSchema);

  const svc = createServiceRoleClient();
  const updated = unwrapOne(
    await svc
      .from('purchases')
      .update({ status: body.status })
      .eq('id', id)
      .select('*, courses(id, name, slug)')
      .single(),
  );

  const courseName = updated.courses?.name ?? 'kurs';
  const approved = body.status === 'approved';
  const courseHref = updated.courses?.slug ? `/courses/${updated.courses.slug}` : '/courses';

  notifyAfterResponse({
    userIds: [updated.student_id],
    type: approved ? 'purchase_approved' : 'purchase_denied',
    title: approved ? 'Pristup kursu je odobren' : 'Zahtev za pristup je odbijen',
    body: approved
      ? `Sada možete da pratite kurs „${courseName}”.`
      : `Vaš zahtev za pristup kursu „${courseName}” je odbijen.`,
    link: approved ? courseHref : '/courses',
    email: approved
      ? {
          subject: `Pristup odobren — ${courseName}`,
          heading: 'Pristup kursu je odobren',
          lines: [
            `Odobren vam je pristup kursu „${courseName}”.`,
            'Moduli se otključavaju redom — završite jedan da biste otvorili sledeći.',
          ],
          action: { label: 'Otvori kurs', href: courseHref },
        }
      : {
          subject: `Zahtev odbijen — ${courseName}`,
          heading: 'Zahtev za pristup je odbijen',
          lines: [
            `Vaš zahtev za pristup kursu „${courseName}” je odbijen.`,
            // True, and worth saying: the unique index excludes `denied`, so a
            // denial is not a permanent block.
            'Možete poslati novi zahtev za isti kurs.',
          ],
          action: { label: 'Pogledaj kurs', href: courseHref },
        },
  });

  return NextResponse.json({ data: updated });
});
