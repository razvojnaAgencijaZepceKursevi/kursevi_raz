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
import { useAdminSubmissions } from '@/hooks/useSubmissions';
import { useListParams } from '@/hooks/useListParams';
import { formatDateTime, pluralSr } from '@/lib/format';
import { SUBMISSION_STATUS } from '@/lib/status';
import type { AdminSubmission } from '@/lib/schemas/task-submissions.schema';

/**
 * The review queue: every task solution students have sent in.
 *
 * Defaults to `pending` for the same reason the purchases page defaults to
 * `requested` — this is a queue to clear, and opening it on "everything" buries
 * the rows that need a decision under every thread already settled.
 *
 * Scoped by RLS, not here: an admin sees every submission, a teacher only those
 * on courses they own. Both share this screen unchanged.
 *
 * No search box — the endpoint's `search` has nothing sensible to match on a
 * submission row, which is three uuids and a status. Filtering is by status.
 */
export default function AdminSubmissionsPage() {
  const list = useListParams({ status: 'pending' }, { pageSize: 20 });
  const submissions = useAdminSubmissions(list.queryParams);

  return (
    <PageContainer>
      <PageHeader
        title="Predati zadaci"
        description="Pregled rešenja koja su studenti predali i prepiska o njima."
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
            <MenuItem value="pending">Čeka pregled</MenuItem>
            <MenuItem value="needs_revision">Potrebna izmena</MenuItem>
            <MenuItem value="approved">Prihvaćeno</MenuItem>
          </TextField>

          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ ml: { md: 'auto' }, flexShrink: 0 }}
          >
            {submissions.data ? `Ukupno: ${submissions.data.meta.total}` : null}
          </Typography>
        </Stack>

        <QueryState
          query={submissions}
          errorTitle="Predate zadatke nije moguće učitati"
          isEmpty={(page) => page.data.length === 0}
          empty={
            list.filters.status === 'pending' ? (
              <EmptyState
                title="Nema zadataka na čekanju"
                description="Sve predaje su pregledane. Promenite filter da vidite ranije odluke."
              />
            ) : (
              <EmptyState
                title="Nema predatih zadataka"
                description="Nijedna predaja ne odgovara izabranom filteru."
              />
            )
          }
        >
          {(page) => (
            <>
              <DataTable<AdminSubmission>
                rows={page.data}
                getRowId={(row) => row.id}
                onRowClick={(row) => `/admin/submissions/${row.id}`}
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
                    header: 'Kurs i modul',
                    cell: (row) => (
                      <Stack spacing={0.25}>
                        <Typography variant="body2">
                          {row.tasks?.modules?.courses?.name ?? '—'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {row.tasks?.modules?.title ?? '—'}
                        </Typography>
                      </Stack>
                    ),
                  },
                  {
                    id: 'status',
                    header: 'Status',
                    cell: (row) => <StatusChip {...SUBMISSION_STATUS[row.status]} />,
                  },
                  {
                    id: 'messages',
                    header: 'Prepiska',
                    align: 'right',
                    cell: (row) => (
                      <Typography variant="body2" color="text.secondary">
                        {row.message_count}{' '}
                        {pluralSr(row.message_count, 'poruka', 'poruke', 'poruka')}
                      </Typography>
                    ),
                  },
                  {
                    id: 'created',
                    header: 'Predato',
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
