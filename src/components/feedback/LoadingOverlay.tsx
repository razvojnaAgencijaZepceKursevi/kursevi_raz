'use client';

import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Covers its nearest positioned ancestor while a write is in flight.
 *
 * Unlike `<LoadingState />` this keeps the underlying content on screen, which
 * is what you want for a form being submitted — the user can still see what
 * they typed, they just can't touch it. `<Form />` renders this automatically;
 * use it directly only for non-form async regions.
 *
 * The parent must be `position: relative` for the overlay to sit inside it.
 */
export default function LoadingOverlay({ open, label }: { open: boolean; label?: string }) {
  if (!open) return null;

  return (
    <Box
      // Not `aria-hidden`: screen readers should announce that work is running.
      aria-live="polite"
      aria-busy
      sx={{
        position: 'absolute',
        inset: 0,
        zIndex: (theme) => theme.zIndex.modal - 1,
        display: 'grid',
        placeItems: 'center',
        borderRadius: 'inherit',
        // Semi-transparent rather than opaque so the form stays visible behind it.
        bgcolor: 'rgba(var(--mui-palette-background-defaultChannel) / 0.72)',
        backdropFilter: 'blur(1px)',
      }}
    >
      <Stack spacing={1.5} sx={{ alignItems: 'center' }}>
        <CircularProgress size={28} thickness={4} />
        {label ? (
          <Typography variant="body2" color="text.secondary">
            {label}
          </Typography>
        ) : null}
      </Stack>
    </Box>
  );
}
