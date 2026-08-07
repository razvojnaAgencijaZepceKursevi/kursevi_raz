'use client';

import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
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
        {/* Plain wordmark, not a link: the public catalogue at `/courses` isn't
            built yet, and a brand that 404s is worse than one that does
            nothing. Once that page lands, make this a MUI `<Link href="/courses">`
            — the theme already routes it through Next's Link. */}
        <Typography variant="h5" component="span">
          Kursevi
        </Typography>

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
