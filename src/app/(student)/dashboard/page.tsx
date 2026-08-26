'use client';

import ExploreOutlinedIcon from '@mui/icons-material/ExploreOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import StatusChip from '@/components/data/StatusChip';
import StudentCourseCard from '@/components/student/StudentCourseCard';
import { usePurchases } from '@/hooks/usePurchases';
import { useCertificates } from '@/hooks/useCertificates';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDate } from '@/lib/format';
import { PURCHASE_STATUS, deliveryStatus } from '@/lib/status';

/**
 * The student's home screen: what they are enrolled in, how far along they are,
 * what they have earned, and a way to find more.
 *
 * ## Where "my courses" comes from
 *
 * There is no enrolment table — an approved `purchase` *is* the enrolment. So
 * this reads the student's own purchases (RLS scopes them automatically) and
 * splits them by status:
 *
 *   - `approved` → courses they can actually open;
 *   - `requested` → waiting on an admin, shown so the wait is visible rather
 *     than looking like the request vanished;
 *   - `denied` → deliberately not shown. The unique index excludes denied rows,
 *     so the student can simply ask again from the course page, and a rejected
 *     row on their dashboard would be a standing reminder with no action
 *     attached.
 *
 * Progress is fetched per card — see `<StudentCourseCard>` for why.
 */
export default function StudentDashboardPage() {
  const profile = useAuthStore((s) => s.profile);

  // 50 is comfortably above any realistic enrolment count and keeps this to one
  // request; a student with more than that needs a paginated "my courses" page,
  // not a taller dashboard.
  const purchases = usePurchases({ pageSize: 50 });
  const certificates = useCertificates({ pageSize: 50 });

  return (
    <PageContainer>
      <PageHeader
        title={profile ? `Zdravo, ${profile.full_name}` : 'Moji kursevi'}
        description="Nastavite tamo gde ste stali."
        actions={
          <Button href="/courses" variant="outlined" startIcon={<ExploreOutlinedIcon />}>
            Pregledaj kurseve
          </Button>
        }
      />

      <QueryState query={purchases} errorTitle="Vaše kurseve nije moguće učitati">
        {(page) => {
          const approved = page.data.filter((p) => p.status === 'approved');
          const pending = page.data.filter((p) => p.status === 'requested');

          return (
            <Stack spacing={3}>
              {pending.length > 0 ? (
                <ContentCard
                  title="Zahtevi na čekanju"
                  description="Administrator pregleda vaš zahtev. Javićemo vam kada bude odobren."
                  disablePadding
                >
                  <Stack divider={<Divider />}>
                    {pending.map((purchase) => (
                      <Stack
                        key={purchase.id}
                        direction="row"
                        spacing={2}
                        sx={{ px: 3, py: 2, alignItems: 'center' }}
                      >
                        <Typography variant="body2" sx={{ flex: 1, minWidth: 0 }}>
                          {purchase.courses?.name ?? 'Kurs više ne postoji'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {formatDate(purchase.created_at)}
                        </Typography>
                        <StatusChip {...PURCHASE_STATUS[purchase.status]} />
                      </Stack>
                    ))}
                  </Stack>
                </ContentCard>
              ) : null}

              <ContentCard title="Moji kursevi" disablePadding={approved.length === 0}>
                {approved.length === 0 ? (
                  <EmptyState
                    title="Još niste upisani ni na jedan kurs"
                    description="Pronađite kurs u katalogu i pošaljite zahtev za pristup."
                    action={
                      <Button
                        href="/courses"
                        variant="contained"
                        startIcon={<ExploreOutlinedIcon />}
                      >
                        Pregledaj kurseve
                      </Button>
                    }
                  />
                ) : (
                  <Grid container spacing={2}>
                    {approved.map((purchase) =>
                      // The embed is nullable: the course may have been deleted
                      // after the purchase was approved.
                      purchase.courses ? (
                        <Grid key={purchase.id} size={{ xs: 12, sm: 6, lg: 4 }}>
                          <StudentCourseCard course={purchase.courses} />
                        </Grid>
                      ) : null,
                    )}
                  </Grid>
                )}
              </ContentCard>

              <ContentCard
                title="Sertifikati"
                description="Izdaju se automatski kada završite sve module kursa."
                disablePadding
              >
                <QueryState
                  query={certificates}
                  errorTitle="Sertifikate nije moguće učitati"
                  isEmpty={(certs) => certs.data.length === 0}
                  empty={
                    <EmptyState
                      title="Još nemate sertifikate"
                      description="Završite sve module jednog kursa i sertifikat stiže sam."
                      icon={<WorkspacePremiumOutlinedIcon />}
                    />
                  }
                >
                  {(certs) => (
                    <Stack divider={<Divider />}>
                      {certs.data.map((certificate) => (
                        <Stack
                          key={certificate.id}
                          direction={{ xs: 'column', sm: 'row' }}
                          spacing={{ xs: 0.5, sm: 2 }}
                          sx={{ px: 3, py: 2, alignItems: { sm: 'center' } }}
                        >
                          <Stack sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {certificate.courses?.name ?? 'Kurs više ne postoji'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Broj: {certificate.readable_id} · {formatDate(certificate.created_at)}
                            </Typography>
                          </Stack>

                          <Stack
                            direction="row"
                            spacing={1.5}
                            sx={{ alignItems: 'center', flexShrink: 0 }}
                          >
                            <StatusChip
                              {...deliveryStatus(
                                certificate.requested_delivery,
                                certificate.delivered_at,
                              )}
                              size="small"
                            />
                            {/* Addressed by `readable_id`: the same URL works
                                whether it is opened from here, from a
                                notification, or pasted to somebody else. */}
                            <Button
                              href={`/certificates/${certificate.readable_id}`}
                              size="small"
                              variant="outlined"
                            >
                              Otvori
                            </Button>
                          </Stack>
                        </Stack>
                      ))}
                    </Stack>
                  )}
                </QueryState>
              </ContentCard>
            </Stack>
          );
        }}
      </QueryState>
    </PageContainer>
  );
}
