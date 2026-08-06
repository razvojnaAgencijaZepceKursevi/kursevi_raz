import { redirect } from 'next/navigation';
import AdminShell from '@/components/admin/AdminShell';
import { getAuthContext } from '@/lib/auth/guards';

/**
 * The admin group's guard and chrome.
 *
 * Access is checked in two independent places, on purpose:
 *   1. `src/proxy.ts` redirects non-admins away from `/admin/*` before the page
 *      renders — fast, but it runs on an optimistic session read.
 *   2. This layout re-reads the session server-side and verifies the role
 *      against the `profiles` table. It is the authoritative check.
 *
 * The duplication is the point: a mistake in the proxy's path matching cannot
 * expose an admin page, because nothing in this group renders until the role
 * has been confirmed here.
 *
 * Pages in this group therefore never need their own auth check. They must
 * still handle a 403 from an individual request, which is a different question
 * — "may this admin do this?" rather than "is this an admin?".
 *
 * Note the folder layout: `(admin)` is a route group and contributes nothing to
 * the URL, so pages live under `(admin)/admin/…` to be served at `/admin/…`,
 * which is the prefix the proxy gates on.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const auth = await getAuthContext();
  if (!auth) redirect('/login');
  if (auth.profile.role !== 'admin') redirect('/dashboard');

  const { profile } = auth;

  return (
    <AdminShell profile={{ full_name: profile.full_name, email: profile.email }}>
      {children}
    </AdminShell>
  );
}
