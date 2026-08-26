import { notFound, unwrapMaybe, withRoute } from '@/lib/api/errors';
import { createServiceRoleClient } from '@/lib/supabase/service-role';
import { renderCertificatePdf } from '@/lib/pdf/certificate';
import { formatDate } from '@/lib/format';
import { z } from '@/lib/openapi/zod';

export const dynamic = 'force-dynamic';

type Ctx = { params: Promise<{ certificateId: string }> };

/**
 * GET /api/certificates/:id/pdf — the certificate as an A4 PDF.
 *
 * ## Public, matching the page it belongs to
 *
 * Same access model as `GET /api/certificates/:id`: unauthenticated, service
 * role, and a fixed projection. It carries exactly what the verification page
 * already shows — name, course, date, number — so it discloses nothing new. A
 * certificate is a thing you hand to someone; a copy nobody but its owner could
 * fetch would defeat the point of having one.
 *
 * Note what this means and does not mean: anyone with the number can download a
 * PDF of *that* certificate. They cannot make it say anything else, and the
 * number on it points back at the verification page. The identifier is
 * sequential and therefore guessable — see the note in PROJECT-CONTEXT.
 *
 * ## Inline by default, attachment on request
 *
 * `?download=1` flips `Content-Disposition`. The page previews the same URL
 * inline in a canvas viewer and links to the download variant, so one route
 * serves both and they cannot drift apart.
 */
export const GET = withRoute(async (req, ctx: Ctx) => {
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

  if (!certificate) throw notFound('No certificate found for that identifier');

  const base = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

  const pdf = await renderCertificatePdf({
    readableId: certificate.readable_id,
    studentName: certificate.profiles?.full_name ?? '—',
    courseName: certificate.courses?.name ?? '—',
    issuedAt: formatDate(certificate.created_at),
    verifyUrl: `${base}/certificates/${certificate.readable_id}`,
  });

  const download = new URL(req.url).searchParams.get('download') !== null;

  return new Response(pdf as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `${download ? 'attachment' : 'inline'}; filename="${certificate.readable_id}.pdf"`,
      // Public and immutable in content, but short-cached: the student's name
      // can change, and a stale certificate with an old name is worse than a
      // cache miss.
      'Cache-Control': 'public, max-age=60',
    },
  });
});
