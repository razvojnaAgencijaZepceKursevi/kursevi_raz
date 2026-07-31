import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import LogoutButton from '@/components/LogoutButton';
import { getAuthContext } from '@/lib/auth/guards';

/**
 * Admin group guard. No pages live in this group yet — they are built manually
 * later — but the layout is in place so adding one is automatically protected
 * by both the proxy and this server-side role check.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');
  if (auth.profile.role !== 'admin') redirect('/dashboard');

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
          Kursevi — Admin
        </Typography>
        <LogoutButton />
      </Stack>
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}
