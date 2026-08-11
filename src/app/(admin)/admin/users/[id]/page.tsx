'use client';

import * as React from 'react';
import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import DetailList from '@/components/data/DetailList';
import DataTable from '@/components/data/DataTable';
import StatusChip from '@/components/data/StatusChip';
import { useAdminUser } from '@/hooks/useUsers';
import { useAdminPurchases } from '@/hooks/usePurchases';
import { useAdminCertificates } from '@/hooks/useCertificates';
import { formatDateTime, formatPrice } from '@/lib/format';
import { PURCHASE_STATUS, USER_ROLE, deliveryStatus } from '@/lib/status';
import { isStatus } from '@/lib/api/errorMessage';
import type { AdminPurchase } from '@/lib/schemas/purchases.schema';
import type { AdminCertificate } from '@/lib/schemas/certificates.schema';

/**
 * One user, with everything the platform knows about them in one place.
 *
 * There is no dedicated "user activity" endpoint, and there doesn't need to be:
 * both the purchases and the certificates list endpoints accept a `studentId`
 * filter, so the related sections are just those same hooks scoped to this id.
 * Reach for an existing filter before asking for a new endpoint.
 */
export default function AdminUserDetailPage(props: PageProps<'/admin/users/[id]'>) {
  const { id } = React.use(props.params);

  const user = useAdminUser(id);
  const purchases = useAdminPurchases({ studentId: id, pageSize: 50 });
  const certificates = useAdminCertificates({ studentId: id, pageSize: 50 });

  if (user.isError && isStatus(user.error, 404)) {
    return (
      <PageContainer>
        <ContentCard>
          <EmptyState title="Korisnik nije pronađen" description="Ovaj nalog ne postoji." />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QueryState query={user} errorTitle="Korisnika nije moguće učitati">
        {(profile) => (
          <>
            <PageHeader
              breadcrumbs={[
                { label: 'Korisnici', href: '/admin/users' },
                { label: profile.full_name },
              ]}
              title={profile.full_name}
              description={profile.email}
              actions={<StatusChip {...USER_ROLE[profile.role]} size="medium" />}
            />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, lg: 7 }}>
                <ContentCard title="Podaci o nalogu">
                  <DetailList
                    items={[
                      { label: 'Ime i prezime', value: profile.full_name },
                      { label: 'Email', value: profile.email },
                      { label: 'Uloga', value: <StatusChip {...USER_ROLE[profile.role]} /> },
                      { label: 'Registrovan', value: formatDateTime(profile.created_at) },
                      { label: 'Poslednja izmena', value: formatDateTime(profile.updated_at) },
                      {
                        label: 'ID',
                        value: <Typography variant="caption">{profile.id}</Typography>,
                      },
                    ]}
                  />
                </ContentCard>
              </Grid>

              <Grid size={{ xs: 12, lg: 5 }}>
                <ContentCard title="Uloga korisnika">
                  <Alert severity="info">
                    Uloge se menjaju ručno kroz Supabase dashboard, ne kroz ovu stranicu. Ovaj ekran
                    je namerno samo za pregled.
                  </Alert>
                </ContentCard>
              </Grid>
            </Grid>

            <ContentCard title="Zahtevi za kupovinu" disablePadding>
              <QueryState
                query={purchases}
                errorTitle="Zahteve nije moguće učitati"
                isEmpty={(page) => page.data.length === 0}
                empty={
                  <EmptyState
                    title="Nema zahteva"
                    description="Ovaj korisnik još nije zatražio nijedan kurs."
                  />
                }
              >
                {(page) => (
                  <DataTable<AdminPurchase>
                    rows={page.data}
                    getRowId={(row) => row.id}
                    onRowClick={(row) => `/admin/purchases/${row.id}`}
                    columns={[
                      {
                        id: 'course',
                        header: 'Kurs',
                        cell: (row) => row.courses?.name ?? '—',
                      },
                      {
                        id: 'price',
                        header: 'Cena',
                        align: 'right',
                        cell: (row) => formatPrice(row.price),
                      },
                      {
                        id: 'status',
                        header: 'Status',
                        cell: (row) => <StatusChip {...PURCHASE_STATUS[row.status]} />,
                      },
                      {
                        id: 'created',
                        header: 'Poslat',
                        cell: (row) => formatDateTime(row.created_at),
                      },
                    ]}
                  />
                )}
              </QueryState>
            </ContentCard>

            <ContentCard title="Sertifikati" disablePadding>
              <QueryState
                query={certificates}
                errorTitle="Sertifikate nije moguće učitati"
                isEmpty={(page) => page.data.length === 0}
                empty={
                  <EmptyState
                    title="Nema sertifikata"
                    description="Korisnik još nije završio nijedan kurs."
                  />
                }
              >
                {(page) => (
                  <DataTable<AdminCertificate>
                    rows={page.data}
                    getRowId={(row) => row.id}
                    onRowClick={(row) => `/admin/certificates/${row.id}`}
                    columns={[
                      { id: 'readable', header: 'Broj', cell: (row) => row.readable_id },
                      { id: 'course', header: 'Kurs', cell: (row) => row.courses?.name ?? '—' },
                      {
                        id: 'delivery',
                        header: 'Dostava',
                        cell: (row) => <StatusChip {...deliveryStatus(row.requested_delivery)} />,
                      },
                      {
                        id: 'created',
                        header: 'Izdat',
                        cell: (row) => formatDateTime(row.created_at),
                      },
                    ]}
                  />
                )}
              </QueryState>
            </ContentCard>
          </>
        )}
      </QueryState>
    </PageContainer>
  );
}
