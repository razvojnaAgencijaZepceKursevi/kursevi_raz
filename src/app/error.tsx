'use client';

import RouteError from '@/components/feedback/RouteError';

/**
 * Boundary for everything that does not have a nearer one — the marketing
 * pages, the auth pages, the student area and the account pages.
 *
 * `/admin` has its own so the sidebar survives the error; Next uses the nearest
 * boundary, so that one wins there and this never fires for it.
 *
 * Note this cannot catch a throw in the root layout itself. That is what
 * `global-error.tsx` beside it is for.
 */
export default function AppError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  /** Re-runs the failed segment. Next 16's replacement for `reset()`, which
      only cleared the boundary without re-fetching anything. */
  unstable_retry: () => void;
}) {
  return <RouteError error={error} retry={unstable_retry} scope="app" />;
}
