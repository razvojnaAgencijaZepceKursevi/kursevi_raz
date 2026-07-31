import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutButton from '@/components/LogoutButton';
import { getAuthContext } from '@/lib/auth/guards';

/**
 * Second guard beneath the proxy: the proxy is an optimistic check that runs
 * before rendering, this is the authoritative server-side session read. Keeping
 * both means a proxy misconfiguration cannot expose a protected page.
 *
 * The header here exists only to host the logout action for the sample page —
 * the real app-wide nav is built manually later.
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
        <Typography variant="h3" component="span">
          Kursevi
        </Typography>
        <LogoutButton />
      </Stack>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}
