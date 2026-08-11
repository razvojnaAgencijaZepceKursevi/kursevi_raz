'use client';

import * as React from 'react';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import DetailList from '@/components/data/DetailList';
import StatusChip from '@/components/data/StatusChip';
import { useAdminCertificate } from '@/hooks/useCertificates';
import { formatDateTime } from '@/lib/format';
import { deliveryStatus } from '@/lib/status';
import { isStatus } from '@/lib/api/errorMessage';

/**
 * One certificate.
 *
 * Read-only — see the note on the list page for why marking a delivery as
 * fulfilled isn't possible without a schema change. The page states that
 * limitation plainly rather than offering a button that would lie.
 */
export default function AdminCertificateDetailPage(props: PageProps<'/admin/certificates/[id]'>) {
  const { id } = React.use(props.params);
  const certificate = useAdminCertificate(id);

  if (certificate.isError && isStatus(certificate.error, 404)) {
    return (
      <PageContainer>
        <ContentCard>
          <EmptyState title="Sertifikat nije pronađen" description="Ovaj sertifikat ne postoji." />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QueryState query={certificate} errorTitle="Sertifikat nije moguće učitati">
        {(row) => (
          <>
            <PageHeader
              breadcrumbs={[
                { label: 'Sertifikati', href: '/admin/certificates' },
                { label: row.readable_id },
              ]}
              title={row.readable_id}
              description={row.courses?.name ?? undefined}
              actions={<StatusChip {...deliveryStatus(row.requested_delivery)} size="medium" />}
            />

            {row.requested_delivery ? (
              <Alert severity="warning" icon={<LocalShippingOutlinedIcon fontSize="inherit" />}>
                Student je zatražio štampanu verziju sertifikata. Evidencija o tome da li je
                pošiljka poslata ne postoji u bazi — vodite je van sistema dok se ne doda
                odgovarajuće polje.
              </Alert>
            ) : null}

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, md: 6 }}>
                <ContentCard title="Student">
                  <DetailList
                    items={[
                      {
                        label: 'Ime i prezime',
                        value: row.profiles ? (
                          <Link href={`/admin/users/${row.profiles.id}`} underline="hover">
                            {row.profiles.full_name}
                          </Link>
                        ) : (
                          '—'
                        ),
                      },
                      { label: 'Email', value: row.profiles?.email ?? '—' },
                    ]}
                  />
                </ContentCard>
              </Grid>

              <Grid size={{ xs: 12, md: 6 }}>
                <ContentCard title="Kurs">
                  <DetailList
                    items={[
                      {
                        label: 'Naziv',
                        value: row.courses ? (
                          <Link href={`/courses/${row.courses.id}`} underline="hover">
                            {row.courses.name}
                          </Link>
                        ) : (
                          '—'
                        ),
                      },
                    ]}
                  />
                </ContentCard>
              </Grid>
            </Grid>

            <ContentCard title="Detalji sertifikata">
              <DetailList
                items={[
                  { label: 'Broj sertifikata', value: row.readable_id },
                  {
                    label: 'Zahtev za dostavu',
                    value: <StatusChip {...deliveryStatus(row.requested_delivery)} />,
                  },
                  { label: 'Izdat', value: formatDateTime(row.created_at) },
                  { label: 'Poslednja izmena', value: formatDateTime(row.updated_at) },
                  {
                    label: 'ID',
                    value: <Typography variant="caption">{row.id}</Typography>,
                  },
                ]}
              />
            </ContentCard>
          </>
        )}
      </QueryState>
    </PageContainer>
  );
}
