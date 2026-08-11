'use client';

import * as React from 'react';
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
import PurchaseActions from '@/components/purchases/PurchaseActions';
import { useAdminPurchase } from '@/hooks/usePurchases';
import { formatDateTime, formatPrice } from '@/lib/format';
import { PURCHASE_STATUS } from '@/lib/status';
import { isStatus } from '@/lib/api/errorMessage';

/**
 * One purchase request.
 *
 * Reachable from the list, from the user detail page, and as a shareable link —
 * which is the point of it existing alongside the inline row actions: an admin
 * can send a colleague a URL for a specific decision.
 */
export default function AdminPurchaseDetailPage(props: PageProps<'/admin/purchases/[id]'>) {
  const { id } = React.use(props.params);
  const purchase = useAdminPurchase(id);

  if (purchase.isError && isStatus(purchase.error, 404)) {
    return (
      <PageContainer>
        <ContentCard>
          <EmptyState title="Zahtev nije pronađen" description="Ovaj zahtev ne postoji." />
        </ContentCard>
      </PageContainer>
    );
  }

  return (
    <PageContainer>
      <QueryState query={purchase} errorTitle="Zahtev nije moguće učitati">
        {(row) => {
          const studentName = row.profiles?.full_name ?? 'Nepoznat korisnik';

          return (
            <>
              <PageHeader
                breadcrumbs={[
                  { label: 'Zahtevi za kupovinu', href: '/admin/purchases' },
                  { label: studentName },
                ]}
                title={row.courses?.name ?? 'Zahtev za kupovinu'}
                description={`Zahtev korisnika ${studentName}`}
                actions={<StatusChip {...PURCHASE_STATUS[row.status]} size="medium" />}
              />

              {row.status === 'requested' ? (
                <ContentCard
                  title="Odluka"
                  description="Odobravanje odmah otvara pristup svim modulima kursa."
                >
                  <PurchaseActions purchase={row} size="medium" />
                </ContentCard>
              ) : (
                <Alert severity={row.status === 'approved' ? 'success' : 'info'}>
                  {row.status === 'approved'
                    ? 'Pristup je odobren. Student može da otvara module ovog kursa.'
                    : 'Zahtev je odbijen. Student može poslati novi zahtev za isti kurs.'}
                </Alert>
              )}

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
                        {
                          label: 'Cena u trenutku zahteva',
                          value: formatPrice(row.price),
                        },
                      ]}
                    />
                  </ContentCard>
                </Grid>
              </Grid>

              <ContentCard title="Detalji zahteva">
                <DetailList
                  items={[
                    { label: 'Status', value: <StatusChip {...PURCHASE_STATUS[row.status]} /> },
                    { label: 'Zahtev poslat', value: formatDateTime(row.created_at) },
                    { label: 'Poslednja izmena', value: formatDateTime(row.updated_at) },
                    {
                      label: 'ID zahteva',
                      value: <Typography variant="caption">{row.id}</Typography>,
                    },
                  ]}
                />
              </ContentCard>
            </>
          );
        }}
      </QueryState>
    </PageContainer>
  );
}
