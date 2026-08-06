'use client';

import Alert from '@mui/material/Alert';
import Snackbar from '@mui/material/Snackbar';
import Stack from '@mui/material/Stack';
import { useToastStore } from '@/store/useToastStore';

/**
 * Renders whatever is in `useToastStore`. Mounted once in the root layout —
 * never place a second one, or every toast shows twice.
 *
 * A single Snackbar holds a Stack of alerts rather than one Snackbar per toast:
 * MUI positions each Snackbar independently, so multiple would overlap in the
 * same corner instead of stacking.
 */
export default function ToastHost() {
  const toasts = useToastStore((s) => s.toasts);
  const dismiss = useToastStore((s) => s.dismiss);

  return (
    <Snackbar
      open={toasts.length > 0}
      anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      // Dismissal is per-toast and timed by the store, so the Snackbar itself
      // must not auto-hide the whole stack.
      autoHideDuration={null}
      sx={{ maxWidth: 'min(420px, calc(100vw - 32px))' }}
    >
      <Stack spacing={1} sx={{ width: '100%' }}>
        {toasts.map((toast) => (
          <Alert
            key={toast.id}
            severity={toast.severity}
            variant="filled"
            onClose={() => dismiss(toast.id)}
            sx={{ width: '100%', alignItems: 'center' }}
          >
            {toast.message}
          </Alert>
        ))}
      </Stack>
    </Snackbar>
  );
}
