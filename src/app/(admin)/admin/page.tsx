'use client';

import NextLink from 'next/link';
import AddIcon from '@mui/icons-material/Add';
import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import LibraryBooksOutlinedIcon from '@mui/icons-material/LibraryBooksOutlined';
import PeopleOutlinedIcon from '@mui/icons-material/PeopleOutlined';
import ReceiptLongOutlinedIcon from '@mui/icons-material/ReceiptLongOutlined';
import Button from '@mui/material/Button';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import StatCard from '@/components/data/StatCard';
import StatusChip from '@/components/data/StatusChip';
import { useAdminCourses } from '@/hooks/useCourses';
import { useAdminPurchases } from '@/hooks/usePurchases';
import { useAdminSubmissions } from '@/hooks/useSubmissions';
import { useAdminUsers } from '@/hooks/useUsers';
import { formatDate, formatPrice } from '@/lib/format';
import { publishStatus } from '@/lib/status';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Admin landing page.
 *
 * A client component because every number on it comes from a React Query hook.
 * The role check already happened in the group layout, so there is none here.
 *
 * ### Counting without fetching
 *
 * Each stat asks for `pageSize: 1` and reads `meta.total`. Every list endpoint
 * returns an exact count alongside the page, so one row comes back over the
 * wire instead of hundreds. Reach for this whenever you need a count rather
 * than the records themselves.
 */
export default function AdminDashboardPage() {
  const profile = useAuthStore((s) => s.profile);

  const courses = useAdminCourses({ pageSize: 1 });
  const publishedCourses = useAdminCourses({ pageSize: 1, published: true });
  const pendingPurchases = useAdminPurchases({ pageSize: 1, status: 'requested' });
  const pendingSubmissions = useAdminSubmissions({ pageSize: 1, status: 'pending' });
  const users = useAdminUsers({ pageSize: 1 });

  // The one list that fetches real rows — the five most recent courses.
  const recentCourses = useAdminCourses({ pageSize: 5 });

  return (
    <PageContainer>
      <PageHeader
        title="Pregled"
        description={
          profile ? `Dobrodošli nazad, ${profile.full_name}.` : 'Stanje platforme na jednom mestu.'
        }
        actions={
          <Button href="/admin/courses/new" variant="contained" startIcon={<AddIcon />}>
            Novi kurs
          </Button>
        }
      />

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Ukupno kurseva"
            value={courses.data?.meta.total}
            icon={LibraryBooksOutlinedIcon}
            href="/admin/courses"
            loading={courses.isPending}
            error={courses.isError}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Zahtevi na čekanju"
            value={pendingPurchases.data?.meta.total}
            icon={ReceiptLongOutlinedIcon}
            href="/admin/purchases"
            loading={pendingPurchases.isPending}
            error={pendingPurchases.isError}
            highlight
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Zadaci za pregled"
            value={pendingSubmissions.data?.meta.total}
            icon={AssignmentTurnedInOutlinedIcon}
            href="/admin/submissions"
            loading={pendingSubmissions.isPending}
            error={pendingSubmissions.isError}
            highlight
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
          <StatCard
            label="Registrovani korisnici"
            value={users.data?.meta.total}
            icon={PeopleOutlinedIcon}
            href="/admin/users"
            loading={users.isPending}
            error={users.isError}
          />
        </Grid>
      </Grid>

      <ContentCard
        title="Nedavno dodati kursevi"
        description={
          publishedCourses.data && courses.data
            ? `${publishedCourses.data.meta.total} od ${courses.data.meta.total} kurseva je objavljeno.`
            : undefined
        }
        actions={
          <Button href="/admin/courses" size="small">
            Svi kursevi
          </Button>
        }
        disablePadding
      >
        <QueryState
          query={recentCourses}
          isEmpty={(page) => page.data.length === 0}
          empty={
            <EmptyState
              title="Još nema kurseva"
              description="Kreirajte prvi kurs da biste počeli."
              action={
                <Button href="/admin/courses/new" variant="contained" startIcon={<AddIcon />}>
                  Novi kurs
                </Button>
              }
            />
          }
        >
          {(page) => (
            <Stack divider={<Divider />}>
              {page.data.map((course) => (
                <Stack
                  key={course.id}
                  component={NextLink}
                  href={`/admin/courses/${course.id}/edit`}
                  direction="row"
                  spacing={2}
                  sx={{
                    px: 3,
                    py: 2,
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    textDecoration: 'none',
                    color: 'inherit',
                    '&:hover': { bgcolor: 'action.hover' },
                  }}
                >
                  <Stack spacing={0.25} sx={{ minWidth: 0 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                      {course.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Kreiran {formatDate(course.created_at)}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={2} sx={{ alignItems: 'center', flexShrink: 0 }}>
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(course.price)}
                    </Typography>
                    <StatusChip {...publishStatus(course.published)} />
                  </Stack>
                </Stack>
              ))}
            </Stack>
          )}
        </QueryState>
      </ContentCard>
    </PageContainer>
  );
}
