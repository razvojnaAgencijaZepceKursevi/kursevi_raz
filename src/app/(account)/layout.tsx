import { redirect } from 'next/navigation';
import Box from '@mui/material/Box';
import { getAuthContext } from '@/lib/auth/guards';
import AppHeader from '@/components/layout/AppHeader';

/**
 * Chrome for the pages every signed-in person shares, whatever their role.
 *
 * A fifth route group, added for the same reason §3 lists the other four:
 * **groups are decided by chrome.** Notifications and notification settings
 * belong to admins, teachers and students alike, so they fit in neither the
 * `(admin)` shell (a sidebar of things a student may not see) nor `(student)`
 * (a header that assumes you are here to take a course). Duplicating each page
 * into both was the alternative, and two copies of a settings screen drift.
 *
 * Guarded here as well as in `proxy.ts`, following the same optimistic/
 * authoritative split as the other protected groups: the proxy redirects early,
 * this reads the session server-side and is the real check.
 *
 * Route groups contribute nothing to the URL, so these live at `/notifications`
 * and `/settings/notifications`.
 */
export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');

  return (
    <Box sx={{ minHeight: '100dvh', bgcolor: 'background.default' }}>
      <AppHeader profile={auth.profile} />
      <Box sx={{ py: 4 }}>{children}</Box>
    </Box>
  );
}
