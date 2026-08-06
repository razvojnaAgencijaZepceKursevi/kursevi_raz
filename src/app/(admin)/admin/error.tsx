'use client';

import * as React from 'react';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import PageContainer from '@/components/layout/PageContainer';
import ContentCard from '@/components/layout/ContentCard';
import EmptyState from '@/components/feedback/EmptyState';

/**
 * Last-resort boundary for uncaught errors anywhere under `/admin`.
 *
 * This is not where expected failures belong — a failed query renders
 * `<ErrorState>` inside its own page, keeping the rest of the screen usable.
 * Reaching this component means something threw during render.
 *
 * Error boundaries must be Client Components; that's what the directive is for.
 */
export default function AdminError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string };
  /** Re-runs the failed segment. Next 16's replacement for `reset()`, which
      only cleared the boundary without re-fetching anything. */
  unstable_retry: () => void;
}) {
  React.useEffect(() => {
    // In production a server-side error arrives with only a `digest` — that's
    // the id to match against the server logs.
    console.error('[admin] unhandled error', error);
  }, [error]);

  return (
    <PageContainer>
      <ContentCard>
        <EmptyState
          title="Nešto je pošlo naopako"
          description="Stranicu nije bilo moguće prikazati. Pokušajte ponovo — ako se greška ponavlja, javite se timu koji održava aplikaciju."
          action={
            <Button variant="contained" startIcon={<RefreshIcon />} onClick={unstable_retry}>
              Pokušaj ponovo
            </Button>
          }
        />
      </ContentCard>
    </PageContainer>
  );
}
