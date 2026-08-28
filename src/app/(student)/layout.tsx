import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import AppHeader from '@/components/layout/AppHeader';
import { getAuthContext } from '@/lib/auth/guards';

/**
 * Second guard beneath the proxy: the proxy is an optimistic check that runs
 * before rendering, this is the authoritative server-side session read. Keeping
 * both means a proxy misconfiguration cannot expose a protected page.
 *
 * The header is `<AppHeader />`, the same bar every signed-in page uses. It was
 * previously a bespoke row of links defined here, which is exactly how the four
 * different top bars came about.
 */
export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppHeader profile={auth.profile} />
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  );
}
