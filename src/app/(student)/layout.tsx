import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Link from '@mui/material/Link';
import LogoutButton from '@/components/LogoutButton';
import NotificationBell from '@/components/notifications/NotificationBell';
import { getAuthContext } from '@/lib/auth/guards';

/**
 * Second guard beneath the proxy: the proxy is an optimistic check that runs
 * before rendering, this is the authoritative server-side session read. Keeping
 * both means a proxy misconfiguration cannot expose a protected page.
 *
 * The header carries the student's two destinations — their dashboard and the
 * public catalogue — plus logout. It is deliberately separate from
 * `<PublicHeader />`: that one advertises signing in, which is noise once you
 * already are.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <Stack
        direction="row"
        sx={{
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction="row" spacing={3} sx={{ alignItems: 'center' }}>
          <Link href="/dashboard" variant="h3" underline="none" color="text.primary">
            Kursevi
          </Link>
          <Link href="/courses" variant="body2" underline="hover" color="text.secondary">
            Katalog
          </Link>
        </Stack>
        <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
          <NotificationBell />
          <LogoutButton />
        </Stack>
      </Stack>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}
