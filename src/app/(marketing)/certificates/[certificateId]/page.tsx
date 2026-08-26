'use client';

import * as React from 'react';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DownloadOutlinedIcon from '@mui/icons-material/DownloadOutlined';
import SchoolOutlinedIcon from '@mui/icons-material/SchoolOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import CertificateDelivery from '@/components/certificates/CertificateDelivery';
import PdfViewer from '@/components/student/PdfViewer';
import { useOwnedCertificate, useVerifyCertificate } from '@/hooks/useCertificates';
import { formatDate } from '@/lib/format';
import { isStatus } from '@/lib/api/errorMessage';

/**
 * One certificate — the page a student is sent to when they finish a course,
 * and the page anyone else lands on when they check whether it is genuine.
 *
 * ## Public, deliberately
 *
 * A certificate exists to be shown to someone. `GET /api/certificates/:id` was
 * already built unauthenticated for exactly that, returning a fixed minimal
 * projection — name, course, date, `valid: true` — and never the row. This page
 * is the surface for it, so the link in the completion notification, the link
 * on the dashboard, and a link pasted into an email are all the same URL.
 *
 * Addressed by `readable_id` (CERT-YYYY-NNNN) for the same reason courses are
 * addressed by slug: it is the form a person reads out and types in. The
 * endpoint accepts the uuid too, so older links keep working.
 *
 * ## The owner sees more than a stranger
 *
 * The verification payload is the same for everybody, which means it cannot
 * carry the delivery state — that is the owner's business, not a verifier's. So
 * `useOwnedCertificate` separately asks "is this one of mine?" and the printed
 * copy panel appears only if it is. Both halves are independently enforced
 * server-side; hiding the panel is presentation, not the control.
 */
export default function CertificatePage(props: PageProps<'/certificates/[certificateId]'>) {
  const { certificateId } = React.use(props.params);

  const verification = useVerifyCertificate(certificateId);
  const owned = useOwnedCertificate(certificateId);

  // A bad or unknown identifier is a 404 by design — "not a valid certificate"
  // rather than a failure worth retrying or apologising for.
  if (verification.isError && isStatus(verification.error, 404)) {
    return (
      <PageContainer maxWidth="form">
        <ContentCard>
          <EmptyState
            title="Sertifikat nije pronađen"
            description={`Ne postoji sertifikat sa oznakom „${certificateId}”. Proverite da li je broj tačno prepisan.`}
            icon={<WorkspacePremiumOutlinedIcon />}
            action={
              <Button href="/courses" variant="contained">
                Pogledaj kurseve
              </Button>
            }
          />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer maxWidth="form">
      <QueryState query={verification} errorTitle="Sertifikat nije moguće učitati">
        {(certificate) => (
          <Stack spacing={3}>
            <ContentCard>
              <Stack spacing={3} sx={{ alignItems: 'center', textAlign: 'center', py: 2 }}>
                <Box
                  sx={{
                    display: 'grid',
                    placeItems: 'center',
                    width: 72,
                    height: 72,
                    borderRadius: '50%',
                    bgcolor: 'success.main',
                    color: 'success.contrastText',
                  }}
                >
                  <WorkspacePremiumOutlinedIcon sx={{ fontSize: 40 }} />
                </Box>

                <Stack spacing={0.5}>
                  <Typography variant="overline" color="text.secondary">
                    Sertifikat o završenom kursu
                  </Typography>
                  <Typography variant="h4" component="h1">
                    {certificate.course_name ?? 'Kurs više ne postoji'}
                  </Typography>
                </Stack>

                <Divider flexItem />

                <Stack spacing={2} sx={{ width: '100%' }}>
                  <Stack spacing={0.25}>
                    <Typography variant="caption" color="text.secondary">
                      Izdat na ime
                    </Typography>
                    <Typography variant="h6" component="p">
                      {certificate.student_name ?? '—'}
                    </Typography>
                  </Stack>

                  <Stack
                    direction={{ xs: 'column', sm: 'row' }}
                    spacing={{ xs: 2, sm: 4 }}
                    sx={{ justifyContent: 'center' }}
                  >
                    <Stack spacing={0.25}>
                      <Typography variant="caption" color="text.secondary">
                        Broj sertifikata
                      </Typography>
                      {/* Monospace because this is the string somebody reads
                          out or types into the verification box. */}
                      <Typography variant="body1" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                        {certificate.readable_id}
                      </Typography>
                    </Stack>

                    <Stack spacing={0.25}>
                      <Typography variant="caption" color="text.secondary">
                        Datum izdavanja
                      </Typography>
                      <Typography variant="body1">{formatDate(certificate.issued_at)}</Typography>
                    </Stack>
                  </Stack>
                </Stack>

                <Chip
                  icon={<CheckCircleIcon />}
                  label="Verifikovan sertifikat"
                  color="success"
                  variant="outlined"
                />
              </Stack>
            </ContentCard>

            {/*
              The document itself, rendered from the same route the download
              button points at — one source, so what you see is exactly what you
              get.

              `<PdfViewer>` is reused here even though it was written for module
              materials, whose whole policy is "never handed over". That is not
              a contradiction: the viewer is neutral machinery for drawing a PDF
              onto a canvas, and the policy lives in the route's
              `Content-Disposition` and in whether a download button is offered
              beside it. Here both say the opposite — this one is meant to be
              taken away.
            */}
            <ContentCard
              title="Dokument"
              description="A4 format, spreman za štampu."
              disablePadding
              actions={
                <Button
                  href={`/api/certificates/${certificate.readable_id}/pdf?download`}
                  startIcon={<DownloadOutlinedIcon />}
                  variant="contained"
                  size="small"
                >
                  Preuzmi PDF
                </Button>
              }
            >
              <PdfViewer
                src={`/api/certificates/${certificate.readable_id}/pdf`}
                title={`Sertifikat ${certificate.readable_id}`}
              />
            </ContentCard>

            {/* Owner-only. Waits for `isResolved` so a signed-in owner never
                sees the page settle without their panel, and a stranger never
                sees it appear and vanish. */}
            {owned.isResolved && owned.certificate ? (
              <ContentCard title="Štampani primerak">
                <CertificateDelivery certificate={owned.certificate} />
              </ContentCard>
            ) : null}

            <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'center' }}>
              {owned.certificate ? (
                <Button href="/dashboard" startIcon={<SchoolOutlinedIcon />} color="inherit">
                  Moji kursevi
                </Button>
              ) : (
                <Button href="/courses" startIcon={<SchoolOutlinedIcon />} color="inherit">
                  Pogledaj kurseve
                </Button>
              )}
            </Stack>
          </Stack>
        )}
      </QueryState>
    </PageContainer>
  );
}
