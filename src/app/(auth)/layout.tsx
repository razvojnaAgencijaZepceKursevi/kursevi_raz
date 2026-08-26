import Box from '@mui/material/Box';

/**
 * Chrome for the auth pages: one centred card on an empty background, and
 * deliberately no nav bar.
 *
 * Signing in is a single-purpose screen — offering links away from it is how
 * you lose someone mid-task — which is exactly why these pages could not share
 * a layout with the marketing side. See the note in `(marketing)/layout.tsx`.
 *
 * The centring lives here rather than in `<AuthCard>` so that a page in this
 * group gets the shell for free, the same way a marketing page gets the header.
 * `AuthCard` is now just the card.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <Box
      sx={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        p: 2,
        bgcolor: 'background.default',
      }}
    >
      {children}
    </Box>
  );
}
