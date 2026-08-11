'use client';

import MenuItem from '@mui/material/MenuItem';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import PaginationBar from '@/components/data/PaginationBar';
import DataTable from '@/components/data/DataTable';
import StatusChip from '@/components/data/StatusChip';
import PurchaseActions from '@/components/purchases/PurchaseActions';
import { useAdminPurchases } from '@/hooks/usePurchases';
import { useListParams } from '@/hooks/useListParams';
import { formatDateTime, formatPrice } from '@/lib/format';
import { PURCHASE_STATUS } from '@/lib/status';
import type { AdminPurchase } from '@/lib/schemas/purchases.schema';

/**
 * Purchase requests, with approve/deny inline.
 *
 * Defaults to the `requested` filter: this page exists to clear a queue, and
 * opening it on "everything" would bury the rows that actually need a decision.
 * The filter is still visible and changeable, so nothing is hidden.
 *
 * No search box — the endpoint's `search` param has nothing sensible to match
 * on a purchase row. Filtering is by status instead.
 */
export default function AdminPurchasesPage() {
  const list = useListParams({ status: 'requested' }, { pageSize: 20 });
  const purchases = useAdminPurchases(list.queryParams);

  return (
    <PageContainer>
      <PageHeader
        title="Zahtevi za kupovinu"
        description="Odobravanje pristupa kursevima. Odobrite tek nakon što je uplata potvrđena."
      />

      <ContentCard disablePadding>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <TextField
            select
            label="Status"
            value={list.filters.status}
            onChange={(event) => list.setFilter('status', event.target.value)}
            sx={{ maxWidth: { md: 220 } }}
          >
            <MenuItem value="">Svi statusi</MenuItem>
            <MenuItem value="requested">Na čekanju</MenuItem>
            <MenuItem value="approved">Odobreni</MenuItem>
            <MenuItem value="denied">Odbijeni</MenuItem>
          </TextField>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: { md: 'auto' }, flexShrink: 0 }}
          >
            {purchases.data ? `Ukupno: ${purchases.data.meta.total}` : null}
          </Typography>
        </Stack>

        <QueryState
          query={purchases}
          errorTitle="Zahteve nije moguće učitati"
          isEmpty={(page) => page.data.length === 0}
          empty={
            list.filters.status === 'requested' ? (
              <EmptyState
                title="Nema zahteva na čekanju"
                description="Svi zahtevi su obrađeni. Promenite filter da vidite ranije odluke."
              />
            ) : (
              <EmptyState
                title="Nema zahteva"
                description="Nijedan zahtev ne odgovara izabranom filteru."
              />
            )
          }
        >
          {(page) => (
            <>
              <DataTable<AdminPurchase>
                rows={page.data}
                getRowId={(row) => row.id}
                onRowClick={(row) => `/admin/purchases/${row.id}`}
                columns={[
                  {
                    id: 'student',
                    header: 'Student',
                    cell: (row) => (
                      <Stack spacing={0.25}>
                        <Typography variant="body2" sx={{ fontWeight: 600 }}>
                          {row.profiles?.full_name ?? 'Nepoznat korisnik'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.profiles?.email ?? '—'}
                        </Typography>
                      </Stack>
                    ),
                  },
                  {
                    id: 'course',
                    header: 'Kurs',
                    cell: (row) => (
                      <Typography variant="body2">{row.courses?.name ?? '—'}</Typography>
                    ),
                  },
                  {
                    id: 'price',
                    header: 'Cena',
                    align: 'right',
                    cell: (row) => (
                      <Typography variant="body2">{formatPrice(row.price)}</Typography>
                    ),
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => <StatusChip {...PURCHASE_STATUS[row.status]} />,
                  },
                  {
                    id: 'created',
                    header: 'Poslat',
                    cell: (row) => (
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(row.created_at)}
                      </Typography>
                    ),
                  },
                  {
                    id: 'actions',
                    header: '',
                    align: 'right',
                    width: 220,
                    cell: (row) => (
                      // Stops a click on Odobri/Odbij from also navigating to
                      // the detail page via the row's own click handler.
                      <Stack
                        direction="row"
                        sx={{ justifyContent: 'flex-end' }}
                        onClick={(event) => event.stopPropagation()}
                      >
                        <PurchaseActions purchase={row} />
                      </Stack>
                    ),
                  },
                ]}
              />

              <PaginationBar meta={page.meta} onChange={list.setPage} />
            </>
          )}
        </QueryState>
      </ContentCard>
    </PageContainer>
  );
}
