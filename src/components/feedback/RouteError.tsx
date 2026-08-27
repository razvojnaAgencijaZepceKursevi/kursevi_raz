'use client';

import * as React from 'react';
import HomeOutlinedIcon from '@mui/icons-material/HomeOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import PageContainer from '@/components/layout/PageContainer';
import ContentCard from '@/components/layout/ContentCard';
import EmptyState from '@/components/feedback/EmptyState';

/**
 * The body of every `error.tsx` in the app.
 *
 * Error boundaries have to be Client Components and have to live at specific
 * file paths, so there is one thin `error.tsx` per area — but they would
 * otherwise be the same forty lines four times over. This is that body; each
 * boundary supplies only the label it logs under and where "home" is.
 *
 * ## This is not where expected failures go
 *
 * A failed query renders `<ErrorState>` inside its own page, leaving the rest
 * of the screen usable. Reaching *this* means something threw during render —
 * so it offers a retry and a way out, and nothing else.
 */
export default function RouteError({
  error,
  retry,
  scope,
  homeHref = '/',
  homeLabel = 'Početna',
}: {
  error: Error & { digest?: string };
  retry: () => void;
  /** Prefixes the console entry so a report can be traced to an area. */
  scope: string;
  homeHref?: string;
  homeLabel?: string;
}) {
  React.useEffect(() => {
    // In production a server-side error arrives with only a `digest` — that is
    // the id to match against the server logs, so it must be logged.
    console.error(`[${scope}] unhandled error`, error);
  }, [error, scope]);

  return (
    <PageContainer>
      <ContentCard>
        <EmptyState
          title="Nešto je pošlo naopako"
          description="Stranicu nije bilo moguće prikazati. Pokušajte ponovo — ako se greška ponavlja, javite se timu koji održava aplikaciju."
          action={
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
              <Button variant="contained" startIcon={<RefreshIcon />} onClick={retry}>
                Pokušaj ponovo
              </Button>
              <Button href={homeHref} startIcon={<HomeOutlinedIcon />} color="inherit">
                {homeLabel}
              </Button>
            </Stack>
          }
        />
        {/* Shown only when there is one. It is the only handle a user can quote
            that means anything to whoever reads the logs. */}
        {error.digest ? (
          <Stack sx={{ mt: 2, alignItems: 'center' }}>
            <code style={{ fontSize: 12, opacity: 0.6 }}>Kod greške: {error.digest}</code>
          </Stack>
        ) : null}
      </ContentCard>
    </PageContainer>
  );
}
