import { NextResponse } from 'next/server';
import { notFound, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { z } from '@/lib/openapi/zod';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/certificates/:idOrReadableId — one certificate.
 *
 * ## Signed in only, and RLS decides who
 *
 * This used to be public: an unauthenticated verification lookup returning a
 * fixed four-field projection, so an employer could check a number. That was
 * reversed deliberately — a certificate is now private to the people it
 * concerns. Three of them, exactly as `certificates_select_own_admin_or_course_owner`
 * (migration 0017) already spelled out:
 *
 *   - the **student** it was issued to;
 *   - any **admin**;
 *   - the **teacher who owns the course** it was earned on.
 *
 * Which is why this runs on the caller's own client rather than the service
 * role. The policy is the access control; a row that is not yours simply is not
 * found, and 404 is the honest answer — telling a stranger "forbidden" would
 * confirm the number is real.
 *
 * The projection can be the whole row now. It could not be while this was
 * public, and that constraint is what the old minimal payload existed to
 * satisfy.
 *
 * **Consequence worth knowing:** nobody outside those three can verify a
 * certificate any more. `readable_id` remains the human-quotable identifier,
 * but checking one now means signing in. Re-opening verification means a
 * separate, deliberately minimal public endpoint — not loosening this one.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  await requireUser();
  const { certificateId } = await ctx.params;

  const supabase = await createClient();
  const isUuid = z.uuid().safeParse(certificateId).success;

  const certificate = unwrapMaybe(
    await supabase
      .from('certificates')
      .select(
        '*, courses(id, name, slug, thumbnail_path), profiles!certificates_student_id_fkey(id, full_name, email)',
      )
      .eq(isUuid ? 'id' : 'readable_id', certificateId)
      .maybeSingle(),
  );

  if (!certificate) throw notFound('No certificate found for that identifier');

  return NextResponse.json({ data: certificate });
});
