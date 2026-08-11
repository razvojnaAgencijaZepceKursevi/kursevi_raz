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
import SearchField from '@/components/data/SearchField';
import PaginationBar from '@/components/data/PaginationBar';
import DataTable from '@/components/data/DataTable';
import StatusChip from '@/components/data/StatusChip';
import { useAdminCertificates } from '@/hooks/useCertificates';
import { useListParams } from '@/hooks/useListParams';
import { formatDateTime } from '@/lib/format';
import { deliveryStatus } from '@/lib/status';
import type { AdminCertificate } from '@/lib/schemas/certificates.schema';

/**
 * Issued certificates and physical-delivery requests.
 *
 * Read-only, and that is a schema constraint rather than a shortcut: there is
 * no column recording that a delivery was fulfilled, and the only endpoint that
 * writes `requested_delivery` checks that the caller *owns* the certificate, so
 * an admin cannot clear the flag either. Adding a "mark as sent" action means
 * adding a column first — don't emulate it in the client.
 *
 * Search matches `readable_id` (CERT-YYYY-NNNN) only; that's what the endpoint
 * filters on.
 */
export default function AdminCertificatesPage() {
  const list = useListParams({ requestedDelivery: '' }, { pageSize: 20 });
  const certificates = useAdminCertificates(list.queryParams);

  return (
    <PageContainer>
      <PageHeader
        title="Sertifikati"
        description="Sertifikati izdati po završetku kursa i zahtevi za štampanu verziju."
      />

      <ContentCard disablePadding>
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          sx={{ p: 2.5, alignItems: { md: 'center' } }}
        >
          <Stack sx={{ flex: 1, minWidth: 0, maxWidth: { md: 320 } }}>
            <SearchField
              value={list.search}
              onChange={list.setSearch}
              placeholder="Pretraži po broju (CERT-…)"
            />
          </Stack>

          <TextField
            select
            label="Dostava"
            value={list.filters.requestedDelivery}
            onChange={(event) => list.setFilter('requestedDelivery', event.target.value)}
            sx={{ maxWidth: { md: 240 } }}
          >
            <MenuItem value="">Svi sertifikati</MenuItem>
            <MenuItem value="true">Sa zahtevom za dostavu</MenuItem>
            <MenuItem value="false">Bez zahteva</MenuItem>
          </TextField>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: { md: 'auto' }, flexShrink: 0 }}
          >
            {certificates.data ? `Ukupno: ${certificates.data.meta.total}` : null}
          </Typography>
        </Stack>

        <QueryState
          query={certificates}
          errorTitle="Sertifikate nije moguće učitati"
          isEmpty={(page) => page.data.length === 0}
          empty={
            list.hasActiveFilters ? (
              <EmptyState
                title="Nema rezultata"
                description="Nijedan sertifikat ne odgovara zadatoj pretrazi i filteru."
              />
            ) : (
              <EmptyState
                title="Još nema izdatih sertifikata"
                description="Sertifikat se izdaje automatski kada student završi sve module kursa."
              />
            )
          }
        >
          {(page) => (
            <>
              <DataTable<AdminCertificate>
                rows={page.data}
                getRowId={(row) => row.id}
                onRowClick={(row) => `/admin/certificates/${row.id}`}
                columns={[
                  {
                    id: 'readable',
                    header: 'Broj sertifikata',
                    cell: (row) => (
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {row.readable_id}
                      </Typography>
                    ),
                  },
                  {
                    id: 'student',
                    header: 'Student',
                    cell: (row) => (
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
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
                    id: 'delivery',
                    header: 'Dostava',
                    cell: (row) => <StatusChip {...deliveryStatus(row.requested_delivery)} />,
                  },
                  {
                    id: 'created',
                    header: 'Izdat',
                    cell: (row) => (
                      <Typography variant="body2" color="text.secondary">
                        {formatDateTime(row.created_at)}
                      </Typography>
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
