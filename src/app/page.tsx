import { redirect } from 'next/navigation';

/**
 * The public landing page is out of scope here and is built manually later.
 * Until it exists, `/` forwards to the auth entry point so the app is testable
 * end to end — replace this file with the real landing page.
 */
export default function RootPage() {
  redirect('/login');
}
