'use client';

import * as React from 'react';
import LocalShippingOutlinedIcon from '@mui/icons-material/LocalShippingOutlined';
import UndoOutlinedIcon from '@mui/icons-material/UndoOutlined';
import Button from '@mui/material/Button';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import { useMarkCertificateDelivered } from '@/hooks/useCertificates';
import { errorMessage } from '@/lib/api/errorMessage';
import { toast } from '@/store/useToastStore';
import type { AdminCertificate } from '@/lib/schemas/certificates.schema';

/**
 * "I have posted this" / "no I have not", for one certificate.
 *
 * Owns its own mutation and confirmation so the list row and the detail page
 * can both drop it in — the same shape as `PurchaseActions`.
 *
 * ## Only marking asks for confirmation
 *
 * Marking sent emails the student to say their certificate is on its way, and
 * an email cannot be recalled — so that direction is confirmed. Un-marking is
 * an admin correcting their own records and notifies nobody, so it just
 * happens. Confirming both would train people to click through the one that
 * matters.
 */
export default function CertificateDeliveryActions({
  certificate,
  size = 'small',
}: {
  certificate: AdminCertificate;
  size?: 'small' | 'medium';
}) {
  const [confirming, setConfirming] = React.useState(false);
  const mark = useMarkCertificateDelivered();

  const delivered = Boolean(certificate.delivered_at);

  async function setDelivered(next: boolean) {
    try {
      await mark.mutateAsync({ id: certificate.id, delivered: next });
      toast.success(next ? 'Označeno kao poslato.' : 'Oznaka slanja je uklonjena.');
      setConfirming(false);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  if (delivered) {
    return (
      <Button
        size={size}
        color="inherit"
        startIcon={<UndoOutlinedIcon />}
        onClick={() => void setDelivered(false)}
        disabled={mark.isPending}
      >
        Poništi oznaku
      </Button>
    );
  }

  return (
    <>
      <Button
        size={size}
        variant="contained"
        startIcon={<LocalShippingOutlinedIcon />}
        onClick={() => setConfirming(true)}
        disabled={mark.isPending}
      >
        Označi kao poslato
      </Button>

      <ConfirmDialog
        open={confirming}
        title="Označiti sertifikat kao poslat?"
        description="Zabeležićemo datum slanja i vas kao osobu koja je poslala. Student dobija obaveštenje da je sertifikat na putu, pa ovo uradite tek kada je pošiljka stvarno predata."
        confirmLabel="Označi kao poslato"
        severity="primary"
        pending={mark.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void setDelivered(true)}
      />
    </>
  );
}
