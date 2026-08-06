'use client';

import RefreshIcon from '@mui/icons-material/Refresh';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import { errorMessage } from '@/lib/api/errorMessage';

/**
 * The "this failed" state for a region of a page.
 *
 * Takes the raw error rather than a string so the wording stays centralised in
 * `errorMessage()` — pass `useQuery`'s `error` straight through.
 */
export default function ErrorState({
  error,
  title = 'Greška pri učitavanju',
  onRetry,
}: {
  error: unknown;
  title?: string;
  /** Usually `refetch` from the query that failed. Omit to hide the button. */
  onRetry?: () => void;
}) {
  return (
    <Alert
      severity="error"
      action={
        onRetry ? (
          <Button color="inherit" size="small" startIcon={<RefreshIcon />} onClick={onRetry}>
            Pokušaj ponovo
          </Button>
        ) : undefined
      }
    >
      <AlertTitle>{title}</AlertTitle>
      {errorMessage(error)}
    </Alert>
  );
}
