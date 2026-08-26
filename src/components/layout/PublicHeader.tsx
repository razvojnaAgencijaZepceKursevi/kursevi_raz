'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import { landingPathForRole } from '@/lib/auth/routes';
import { useAuthStore } from '@/store/useAuthStore';

/**
 * Top bar for the public-facing pages.
 *
 * A client component because the right-hand action depends on who's looking.
 * While the session is still resolving it renders a skeleton rather than the
 * signed-out state — otherwise a signed-in visitor watches the header flip from
 * "Prijavi se" to their own name on every page load.
 */
export default function PublicHeader() {
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);

  return (
    <AppBar position="sticky" color="inherit" sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ gap: 2, minHeight: { xs: 64, sm: 64 } }}>
        {/* The catalogue exists now, so the wordmark links to it. `<Link>` goes
            through Next's router via the theme — no `component` prop needed. */}
        <Link href="/courses" variant="h5" underline="none" color="text.primary">
          Kursevi
        </Link>

        <Box sx={{ flex: 1 }} />

        {loading ? (
          <Skeleton variant="rounded" width={120} height={36} />
        ) : profile ? (
          <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ display: { xs: 'none', sm: 'block' } }}
            >
              {profile.full_name}
            </Typography>
            <Button href={landingPathForRole(profile.role)} variant="outlined" size="small">
              {profile.role === 'admin' ? 'Admin panel' : 'Moji kursevi'}
            </Button>
          </Stack>
        ) : (
          <Stack direction="row" spacing={1}>
            <Button href="/login" size="small">
              Prijavi se
            </Button>
            <Button href="/register" variant="contained" size="small">
              Registruj se
            </Button>
          </Stack>
        )}
      </Toolbar>
    </AppBar>
  );
}
