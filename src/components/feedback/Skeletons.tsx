'use client';

import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import Grid from '@mui/material/Grid';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import TableCell from '@mui/material/TableCell';
import TableRow from '@mui/material/TableRow';

/**
 * Loading placeholders shaped like the content they stand in for.
 *
 * ## Why these exist rather than one spinner
 *
 * A centred spinner says "something is happening" and nothing else. It also
 * collapses the page to its own height, so when the data lands the layout jumps
 * — the thing the reader was about to look at moves. A placeholder with the
 * page's real shape reserves the space, tells the reader what is coming, and
 * makes the arrival feel like content appearing rather than a page rebuilding.
 *
 * The rule for using these: **match the real thing's dimensions.** A skeleton
 * that is the wrong height is worse than a spinner, because it promises a
 * layout and then breaks it. Where a count is unknown, guess low — a short
 * skeleton growing is less jarring than a tall one collapsing.
 *
 * `<LoadingState>` (the spinner) is still right for small inline regions where
 * there is no shape to imitate, and `<LoadingOverlay>` for a write in flight
 * over content that must stay on screen.
 */

/** Title + subtitle block, matching `<PageHeader>`. */
export function PageHeaderSkeleton({ withActions = false }: { withActions?: boolean }) {
  return (
    <Stack
      direction="row"
      spacing={2}
      sx={{ alignItems: 'flex-start', justifyContent: 'space-between' }}
    >
      <Stack spacing={1} sx={{ flex: 1, minWidth: 0 }}>
        <Skeleton variant="text" width="38%" sx={{ fontSize: '2rem' }} />
        <Skeleton variant="text" width="60%" />
      </Stack>
      {withActions ? <Skeleton variant="rounded" width={140} height={40} /> : null}
    </Stack>
  );
}

/**
 * A row of dashboard tiles.
 *
 * Mirrors `<StatCard>`'s internals — icon tile, big number, label — so the
 * cards do not resize when the numbers arrive.
 */
export function StatCardsSkeleton({ count = 4, span = 3 }: { count?: number; span?: number }) {
  return (
    <Grid container spacing={2}>
      {Array.from({ length: count }, (_, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, lg: span }}>
          <Card sx={{ height: '100%' }}>
            <Stack spacing={2} sx={{ p: 3 }}>
              <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                <Skeleton variant="rounded" width={36} height={36} />
                <Skeleton variant="circular" width={18} height={18} />
              </Stack>
              <Stack spacing={0.5}>
                <Skeleton variant="text" width={72} sx={{ fontSize: '2rem' }} />
                <Skeleton variant="text" width="70%" />
              </Stack>
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/**
 * Table rows, for use *inside* an existing `<Table>` — hence `<TableRow>`
 * rather than a wrapper. The header row is real, so the columns stay aligned
 * and only the body is standing in.
 */
export function TableRowsSkeleton({ columns, rows = 5 }: { columns: number; rows?: number }) {
  return (
    <>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <TableRow key={rowIndex}>
          {Array.from({ length: columns }, (_, cellIndex) => (
            <TableCell key={cellIndex}>
              {/* Varying widths, because a column of identical bars reads as a
                  loading *pattern* rather than as text that is on its way. */}
              <Skeleton variant="text" width={cellIndex === 0 ? '70%' : '45%'} />
            </TableCell>
          ))}
        </TableRow>
      ))}
    </>
  );
}

/** Deterministic, so the skeleton does not reshuffle on every re-render. */
const CELL_WIDTHS = ['82%', '55%', '70%', '45%', '90%', '62%'];

/**
 * A standalone table placeholder, for when the whole table — header included —
 * has yet to render.
 */
export function TableSkeleton({ columns = 4, rows = 6 }: { columns?: number; rows?: number }) {
  return (
    <Stack sx={{ p: 2.5 }} spacing={2}>
      <Stack direction="row" spacing={2}>
        {Array.from({ length: columns }, (_, index) => (
          <Skeleton key={index} variant="text" width={`${100 / columns}%`} height={18} />
        ))}
      </Stack>
      {Array.from({ length: rows }, (_, rowIndex) => (
        <Stack key={rowIndex} direction="row" spacing={2}>
          {Array.from({ length: columns }, (_, cellIndex) => (
            <Box key={cellIndex} sx={{ width: `${100 / columns}%` }}>
              {/*
                Each cell fills a varying share of its column. Bars of identical
                length in a perfect grid read as a loading *pattern* — a
                decoration — rather than as text on its way; the raggedness is
                what makes it look like content.
              */}
              <Skeleton
                variant="text"
                width={CELL_WIDTHS[(rowIndex + cellIndex) % CELL_WIDTHS.length]}
                sx={{ fontSize: '1rem' }}
              />
            </Box>
          ))}
        </Stack>
      ))}
    </Stack>
  );
}

/** A grid of cards — the course catalogue, the blog index. */
export function CardGridSkeleton({
  count = 6,
  withMedia = true,
}: {
  count?: number;
  withMedia?: boolean;
}) {
  return (
    <Grid container spacing={3}>
      {Array.from({ length: count }, (_, index) => (
        <Grid key={index} size={{ xs: 12, sm: 6, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            {/*
              An explicit height, not `aspectRatio`. MUI's `rectangular`
              skeleton has no intrinsic height, so an aspect ratio alone
              collapses it to nothing — the media block silently vanished and
              the card came out shorter than the real one, which is the exact
              layout jump these are meant to prevent.
            */}
            {withMedia ? <Skeleton variant="rectangular" width="100%" height={160} /> : null}
            <Stack spacing={1} sx={{ p: 3 }}>
              <Skeleton variant="text" width="35%" height={14} />
              <Skeleton variant="text" width="85%" sx={{ fontSize: '1.1rem' }} />
              <Skeleton variant="text" width="100%" />
              <Skeleton variant="text" width="60%" />
            </Stack>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}

/** Label/value pairs, matching `<DetailList>`. */
export function DetailListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <Stack spacing={2}>
      {Array.from({ length: rows }, (_, index) => (
        <Stack key={index} direction="row" spacing={2} sx={{ justifyContent: 'space-between' }}>
          <Skeleton variant="text" width={140} />
          <Skeleton variant="text" width="40%" />
        </Stack>
      ))}
    </Stack>
  );
}

/** Stacked inputs, for an edit form whose record is still loading. */
export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <Stack spacing={2.5}>
      {Array.from({ length: fields }, (_, index) => (
        <Stack key={index} spacing={0.75}>
          <Skeleton variant="text" width={120} height={14} />
          <Skeleton variant="rounded" height={40} />
        </Stack>
      ))}
      <Stack direction="row" spacing={1.5} sx={{ justifyContent: 'flex-end' }}>
        <Skeleton variant="rounded" width={100} height={40} />
        <Skeleton variant="rounded" width={120} height={40} />
      </Stack>
    </Stack>
  );
}

/** A vertical list of rows inside a card — modules, notifications, messages. */
export function ListRowsSkeleton({ rows = 5, dense = false }: { rows?: number; dense?: boolean }) {
  return (
    <Stack divider={<Box sx={{ borderTop: 1, borderColor: 'divider' }} />}>
      {Array.from({ length: rows }, (_, index) => (
        <Stack
          key={index}
          direction="row"
          spacing={2}
          sx={{ px: 3, py: dense ? 1.5 : 2, alignItems: 'center' }}
        >
          <Stack spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
            <Skeleton variant="text" width="45%" />
            <Skeleton variant="text" width="25%" height={14} />
          </Stack>
          <Skeleton variant="rounded" width={88} height={28} />
        </Stack>
      ))}
    </Stack>
  );
}

/** A block of prose — a blog post, a legal document, a course description. */
export function TextBlockSkeleton({ lines = 6 }: { lines?: number }) {
  return (
    <Stack spacing={1}>
      {Array.from({ length: lines }, (_, index) => (
        <Skeleton
          key={index}
          variant="text"
          // The last line of a paragraph is short; making every line full width
          // reads as a placeholder, not as text.
          width={index === lines - 1 ? '55%' : '100%'}
        />
      ))}
    </Stack>
  );
}
