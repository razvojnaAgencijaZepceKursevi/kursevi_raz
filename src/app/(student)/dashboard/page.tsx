import { redirect } from 'next/navigation';
import Chip from '@mui/material/Chip';
import Paper from '@mui/material/Paper';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { getAuthContext } from '@/lib/auth/guards';

/**
 * Sample protected page — the only page built inside (student)/(admin).
 *
 * It exists purely to prove login → session → protected route → logout works
 * end to end. Every other page follows this same shape: read the session
 * server-side here, or use useAuthStore client-side for role-based branching.
 */
export default async function DashboardPage() {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');

  const { profile } = auth;

  return (
    <Stack spacing={3}>
      <Stack spacing={0.5}>
        <Typography variant="h1">Welcome, {profile.full_name}</Typography>
        <Typography variant="body2" color="text.secondary">
          You are signed in. This page is server-rendered from the session cookie.
        </Typography>
      </Stack>

      <Paper elevation={0} sx={{ p: 3, border: 1, borderColor: 'divider', maxWidth: 520 }}>
        <Stack spacing={2}>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Name
            </Typography>
            <Typography variant="body2">{profile.full_name}</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Email
            </Typography>
            <Typography variant="body2">{profile.email}</Typography>
          </Stack>
          <Stack direction="row" sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Role
            </Typography>
            <Chip
              label={profile.role}
              size="small"
              color={profile.role === 'admin' ? 'secondary' : 'default'}
            />
          </Stack>
        </Stack>
      </Paper>
    </Stack>
  );
}
