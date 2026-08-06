'use client';

import type { SvgIconComponent } from '@mui/icons-material';
import NextLink from 'next/link';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * A single headline number, as used across the dashboard.
 *
 * It handles its own loading and error states because the alternative — a
 * `<QueryState>` per tile — would collapse the row's layout while any one
 * number is still arriving. Here the grid stays put and each tile fills in.
 *
 *   <StatCard
 *     label="Kursevi"
 *     value={courses.data?.meta.total}
 *     icon={LibraryBooksOutlinedIcon}
 *     href="/admin/courses"
 *     loading={courses.isPending}
 *     error={courses.isError}
 *   />
 */
export default function StatCard({
  label,
  value,
  icon: Icon,
  href,
  loading = false,
  error = false,
  /** Draws attention to a number that means "someone is waiting on you". */
  highlight = false,
}: {
  label: string;
  value: number | undefined;
  icon: SvgIconComponent;
  href?: string;
  loading?: boolean;
  error?: boolean;
  highlight?: boolean;
}) {
  const content = (
    <Stack spacing={2} sx={{ p: 3, height: '100%' }}>
      <Stack direction="row" sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
        <Box
          sx={{
            display: 'grid',
            placeItems: 'center',
            width: 36,
            height: 36,
            borderRadius: 1.5,
            bgcolor: highlight && value ? 'warning.main' : 'action.hover',
            color: highlight && value ? 'warning.contrastText' : 'text.secondary',
          }}
        >
          <Icon fontSize="small" />
        </Box>
        {href ? <ArrowForwardIcon fontSize="small" sx={{ color: 'text.disabled' }} /> : null}
      </Stack>

      <Stack spacing={0.25}>
        {loading ? (
          <Skeleton variant="text" width={64} sx={{ fontSize: '2rem' }} />
        ) : (
          <Typography variant="h2" component="p">
            {/* An errored tile shows a dash, not a misleading 0. */}
            {error ? '—' : (value ?? 0)}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Stack>
  );

  return (
    <Card sx={{ height: '100%' }}>
      {href ? (
        <CardActionArea component={NextLink} href={href} sx={{ height: '100%' }}>
          {content}
        </CardActionArea>
      ) : (
        content
      )}
    </Card>
  );
}
