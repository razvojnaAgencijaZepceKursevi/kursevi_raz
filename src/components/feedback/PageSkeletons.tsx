'use client';

import Card from '@mui/material/Card';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import PageContainer from '@/components/layout/PageContainer';
import {
  CardGridSkeleton,
  DetailListSkeleton,
  FormSkeleton,
  ListRowsSkeleton,
  PageHeaderSkeleton,
  StatCardsSkeleton,
  TableSkeleton,
  TextBlockSkeleton,
} from './Skeletons';

/**
 * Whole-page placeholders, for `loading.tsx` files.
 *
 * ## Why a `loading.tsx` per section rather than one at the top
 *
 * Next resolves the *nearest* `loading.tsx` above the segment being loaded, so
 * a single one at `/admin` would render the same fallback for the dashboard,
 * the course table and the settings forms. It was a centred spinner precisely
 * because it had to be generic — and a generic fallback is the one thing a
 * loading state should not be, since its whole job is to tell you what is
 * arriving.
 *
 * These four shapes cover every page in the app. A section picks the one that
 * matches and its `loading.tsx` stays three lines long.
 *
 * The layout above the fallback (sidebar, top bar) stays mounted and
 * interactive during the swap — only the content area is replaced.
 */

/** A filter bar: a search box and one or two dropdowns. */
function FilterBarSkeleton({ filters = 2 }: { filters?: number }) {
  return (
    <Stack
      direction={{ xs: 'column', md: 'row' }}
      spacing={2}
      sx={{ p: 2.5, alignItems: { md: 'center' } }}
    >
      <Skeleton variant="rounded" height={40} sx={{ flex: 1, maxWidth: { md: 360 } }} />
      {Array.from({ length: filters }, (_, index) => (
        <Skeleton key={index} variant="rounded" width={200} height={40} />
      ))}
    </Stack>
  );
}

/**
 * A list page: header, filter bar, table.
 *
 * The default column count is deliberately conservative — a skeleton with more
 * columns than the real table is a visible correction when the data lands,
 * while one with fewer simply grows.
 */
export function ListPageSkeleton({
  columns = 4,
  rows = 6,
  filters = 2,
  withActions = true,
}: {
  columns?: number;
  rows?: number;
  filters?: number;
  withActions?: boolean;
}) {
  return (
    <PageContainer>
      <PageHeaderSkeleton withActions={withActions} />
      <Card>
        <FilterBarSkeleton filters={filters} />
        <TableSkeleton columns={columns} rows={rows} />
      </Card>
    </PageContainer>
  );
}

/** A dashboard: header, a row of stat tiles, one panel of rows. */
export function DashboardSkeleton({
  tiles = 4,
  tileSpan = 3,
  withPanel = true,
}: {
  tiles?: number;
  tileSpan?: number;
  withPanel?: boolean;
}) {
  return (
    <PageContainer>
      <PageHeaderSkeleton withActions />
      <StatCardsSkeleton count={tiles} span={tileSpan} />
      {withPanel ? (
        <Card>
          <Stack sx={{ p: 2.5 }}>
            <Skeleton variant="text" width={220} sx={{ fontSize: '1.1rem' }} />
          </Stack>
          <ListRowsSkeleton rows={5} />
        </Card>
      ) : null}
    </PageContainer>
  );
}

/** An edit or settings page: header, then a card of inputs. */
export function FormPageSkeleton({ fields = 5, cards = 1 }: { fields?: number; cards?: number }) {
  return (
    <PageContainer maxWidth="form">
      <PageHeaderSkeleton />
      {Array.from({ length: cards }, (_, index) => (
        <Card key={index}>
          <Stack spacing={2.5} sx={{ p: 3 }}>
            <Skeleton variant="text" width={180} sx={{ fontSize: '1.1rem' }} />
            <FormSkeleton fields={fields} />
          </Stack>
        </Card>
      ))}
    </PageContainer>
  );
}

/** A record being read: header, a block of label/value pairs, a panel. */
export function DetailPageSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <PageContainer maxWidth="form">
      <PageHeaderSkeleton withActions />
      <Card>
        <Stack spacing={2.5} sx={{ p: 3 }}>
          <Skeleton variant="text" width={160} sx={{ fontSize: '1.1rem' }} />
          <DetailListSkeleton rows={rows} />
        </Stack>
      </Card>
    </PageContainer>
  );
}

/** A catalogue or index of cards. */
export function GridPageSkeleton({
  count = 6,
  withMedia = true,
  filters = 2,
}: {
  count?: number;
  withMedia?: boolean;
  filters?: number;
}) {
  return (
    <PageContainer>
      <PageHeaderSkeleton />
      <Card>
        <FilterBarSkeleton filters={filters} />
      </Card>
      <CardGridSkeleton count={count} withMedia={withMedia} />
    </PageContainer>
  );
}

/** An article: title, then prose. */
export function ArticlePageSkeleton() {
  return (
    <PageContainer maxWidth="form">
      <PageHeaderSkeleton />
      <Card>
        <Stack sx={{ p: 3 }}>
          <TextBlockSkeleton lines={10} />
        </Stack>
      </Card>
    </PageContainer>
  );
}
