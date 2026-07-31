import { NextResponse } from 'next/server';
import { notFound, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { z } from '@/lib/openapi/zod';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/certificates/:readableId — public verification lookup.
 *
 * Deliberately unauthenticated, and deliberately service-role: `certificates`
 * has no anon SELECT policy (students may only read their own), so a public
 * verifier cannot query the table directly. This route is the only way in, and
 * it returns a fixed minimal projection — never the row — so it cannot be used
 * to enumerate student data.
 *
 * The segment is named `certificateId` rather than `readableId` because
 * `request-delivery` sits beneath the same path position, and Next.js allows
 * only one dynamic parameter name per segment. Both forms are accepted.
 */
export const GET = withRoute(async (_req, ctx: Ctx) => {
  const { certificateId } = await ctx.params;

  const svc = createServiceRoleClient();
  const isUuid = z.uuid().safeParse(certificateId).success;

  const certificate = unwrapMaybe(
    await svc
      .from('certificates')
      .select(
        'readable_id, created_at, courses(name), profiles!certificates_student_id_fkey(full_name)',
      )
      .eq(isUuid ? 'id' : 'readable_id', certificateId)
      .maybeSingle(),
  );

  // A bad id is simply "not a valid certificate" — no distinction between
  // malformed and non-existent, so the endpoint reveals nothing by timing or
  // status code.
  if (!certificate) throw notFound('No certificate found for that identifier');

  return NextResponse.json({
    data: {
      readable_id: certificate.readable_id,
      student_name: certificate.profiles?.full_name ?? null,
      course_name: certificate.courses?.name ?? null,
      issued_at: certificate.created_at,
      valid: true,
    },
  });
});
