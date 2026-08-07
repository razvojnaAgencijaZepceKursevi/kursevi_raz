'use client';

import * as React from 'react';
import { usePathname, useRouter } from 'next/navigation';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import { useCreatePurchase } from '@/hooks/usePurchases';
import { canRequestPurchase, type PurchaseState } from '@/lib/courseAccess';
import { errorMessage } from '@/lib/api/errorMessage';
import { formatPrice } from '@/lib/format';
import { toast } from '@/store/useToastStore';

/**
 * Price and the call to action, for a viewer who doesn't own the course yet.
 *
 * The course page doesn't render this at all once access is granted — the price
 * is redundant to someone who already paid, so there's nothing left to show.
 * That means this component only has to handle the not-yet-purchased states:
 *
 *   signed out        → the button sends them to login and back again
 *   no row / denied   → request access
 *   requested         → waiting on an admin, nothing to do
 *
 * `denied` is actionable on purpose: the unique index in migration 0009
 * excludes denied rows specifically so a student can ask again.
 */
export default function CoursePurchasePanel({
  courseId,
  price,
  purchaseState,
  isAuthenticated,
}: {
  courseId: string;
  price: number;
  purchaseState: PurchaseState;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const createPurchase = useCreatePurchase();

  const [justRequested, setJustRequested] = React.useState(false);
  // Treat a fresh request as pending immediately; the refetched list will agree
  // a moment later, and this avoids the button flicking back to "request".
  const state: PurchaseState = justRequested ? 'requested' : purchaseState;

  async function handleRequest() {
    // Send them to login with a way back — losing the page they were reading is
    // the fastest way to lose the sale.
    if (!isAuthenticated) {
      router.push(`/login?redirectTo=${encodeURIComponent(pathname)}`);
      return;
    }

    try {
      await createPurchase.mutateAsync({ course_id: courseId });
      setJustRequested(true);
      toast.success('Zahtev je poslat. Obavestićemo vas kada bude odobren.');
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <ContentCard>
      <Stack spacing={2.5}>
        <Stack spacing={0.5}>
          <Typography variant="body2" color="text.secondary">
            Cena kursa
          </Typography>
          <Typography variant="h2" component="p">
            {formatPrice(price)}
          </Typography>
        </Stack>

        {state === 'requested' ? (
          <Alert severity="info" icon={<HourglassEmptyIcon fontSize="inherit" />}>
            Vaš zahtev čeka odobrenje. Čim ga administrator odobri, kurs će vam biti dostupan.
          </Alert>
        ) : (
          <Stack spacing={1.5}>
            {state === 'denied' ? (
              <Alert severity="warning">
                Prethodni zahtev za ovaj kurs je odbijen. Možete poslati novi.
              </Alert>
            ) : null}

            <Button
              variant="contained"
              size="large"
              fullWidth
              onClick={() => void handleRequest()}
              disabled={createPurchase.isPending || !canRequestPurchase(state)}
            >
              {createPurchase.isPending ? 'Slanje zahteva…' : 'Zatraži pristup'}
            </Button>

            <Typography variant="body2" color="text.secondary">
              {isAuthenticated
                ? 'Pristup kursu odobrava administrator nakon potvrde uplate.'
                : 'Za slanje zahteva potrebno je da budete prijavljeni.'}
            </Typography>
          </Stack>
        )}
      </Stack>
    </ContentCard>
  );
}
