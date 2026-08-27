'use client';

import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SupportOutlinedIcon from '@mui/icons-material/SupportOutlined';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import LogoutButton from '@/components/LogoutButton';
import NotificationBell from '@/components/notifications/NotificationBell';
import { landingPathForRole, type UserRole } from '@/lib/auth/routes';

/**
 * Header for the account pages.
 *
 * The "back" target is role-dependent, which is the whole reason this is a
 * component rather than markup in the layout: an admin arriving here from the
 * bell should be sent back to `/admin`, a student to `/dashboard`.
 * `landingPathForRole` is the same function the proxy and the login page use,
 * so there is one answer to "where does this person belong".
 */
export default function AccountHeader({ role, fullName }: { role: UserRole; fullName: string }) {
  const home = landingPathForRole(role);

  return (
    <AppBar position="sticky" color="inherit" sx={{ bgcolor: 'background.paper' }}>
      <Toolbar sx={{ gap: 2 }}>
        <Link href={home} variant="h5" underline="none" color="text.primary">
          Kursevi
        </Link>

        <Button href={home} startIcon={<ArrowBackIcon />} size="small" color="inherit">
          {role === 'student' ? 'Moji kursevi' : 'Admin panel'}
        </Button>

        <Button href="/issues" size="small" color="inherit" startIcon={<SupportOutlinedIcon />}>
          Prijave
        </Button>

        <Box sx={{ flex: 1 }} />

        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ display: { xs: 'none', sm: 'block' } }}
          >
            {fullName}
          </Typography>
          <NotificationBell />
          <LogoutButton />
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
