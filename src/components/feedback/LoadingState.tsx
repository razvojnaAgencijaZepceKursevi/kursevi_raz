'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * The "still fetching" state for a region of a page.
 *
 * Use this for content that replaces itself on load. For content that stays on
 * screen while a write is in flight (a form being submitted), use
 * `<LoadingOverlay />` instead so the user keeps their context.
 */
export default function LoadingState({
  label = 'Učitavanje…',
  minHeight = 240,
}: {
  label?: string;
  minHeight?: number | string;
}) {
  return (
    <Box sx={{ display: 'grid', placeItems: 'center', minHeight, width: '100%' }}>
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <CircularProgress size={28} thickness={4} />
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
      </Stack>
    </Box>
  );
}
