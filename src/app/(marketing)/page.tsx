import { redirect } from 'next/navigation';

/**
 * The landing page's slot — `/`.
 *
 * It lives in `(marketing)` so that the real landing page, when it replaces
 * this redirect, picks up the public header (and eventually the footer) from
 * the group layout with nothing else to wire up.
 *
 * Until then `/` forwards to the auth entry point so the app is testable end to
 * end. `redirect()` throws before rendering, so the layout above never paints.
 *
 * When building the real page, decide what a *signed-in* visitor should see:
 * the marketing page, or a redirect to `landingPathForRole(profile.role)`.
 */
export default function RootPage() {
  redirect('/login');
}
