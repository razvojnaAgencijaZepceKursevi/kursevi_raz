'use client';

import * as React from 'react';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import SendIcon from '@mui/icons-material/Send';
import Alert from '@mui/material/Alert';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import ConfirmDialog from '@/components/feedback/ConfirmDialog';
import DataTable from '@/components/data/DataTable';
import { useNewsletterRecipients, useSendNewsletter } from '@/hooks/useNewsletter';
import { errorMessage } from '@/lib/api/errorMessage';
import { pluralBs } from '@/lib/format';
import { toast } from '@/store/useToastStore';

/**
 * The newsletter: who is subscribed, exporting them, and sending.
 *
 * ## Both halves, deliberately
 *
 * Sending from the app works — the message is composed as a heading plus
 * paragraphs and goes through the same template as every other mail, so it is
 * properly formatted rather than raw HTML pasted into a box. But the export is
 * kept alongside it, because it is the half that works *today*: with
 * `EMAIL_FROM` unset every send is skipped and logged, and an admin who needs
 * to reach subscribers through some other tool should not be blocked on that.
 *
 * ## Composed, not pasted
 *
 * There is no HTML field. The template escapes everything it interpolates, so
 * an admin cannot break the layout in Outlook (which renders with Word) or
 * paste markup a spam filter reads as phishing.
 */
export default function AdminNewsletterPage() {
  const recipients = useNewsletterRecipients();
  const send = useSendNewsletter();

  const [subject, setSubject] = React.useState('');
  const [heading, setHeading] = React.useState('');
  const [body, setBody] = React.useState('');
  const [confirming, setConfirming] = React.useState(false);

  const emails = (recipients.data?.data ?? []).map((r) => r.email);
  const emailConfigured = recipients.data?.meta.email_configured ?? false;

  // Blank lines separate paragraphs — the same convention as writing anywhere
  // else, and it maps exactly onto the template's `lines`.
  const lines = body
    .split(/\n\s*\n/)
    .map((line) => line.trim().replace(/\s*\n\s*/g, ' '))
    .filter(Boolean);

  const canSend =
    subject.trim() !== '' && heading.trim() !== '' && lines.length > 0 && emails.length > 0;

  async function copyEmails() {
    try {
      await navigator.clipboard.writeText(emails.join(', '));
      toast.success('Email adrese su kopirane.');
    } catch {
      toast.info('Kopiranje nije dozvoljeno — označite i kopirajte ručno.');
    }
  }

  function downloadCsv() {
    const rows = [
      ['Ime i prezime', 'Email'],
      ...(recipients.data?.data ?? []).map((r) => [r.full_name, r.email]),
    ];
    /*
     * Quotes doubled and every field wrapped: a name containing a comma would
     * otherwise split into two columns, which is how mailing lists end up with
     * "Anić" as somebody's email address.
     */
    const csv = rows
      .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(','))
      .join('\n');

    // A BOM, so Excel opens it as UTF-8 and does not mangle č/ć/š/ž/đ.
    const blob = new Blob([`﻿${csv}`], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'newsletter-primaoci.csv';
    link.click();
    URL.revokeObjectURL(url);
  }

  async function doSend() {
    try {
      const result = await send.mutateAsync({
        subject: subject.trim(),
        heading: heading.trim(),
        lines,
      });
      setConfirming(false);

      if (result.data.sent > 0) {
        toast.success(`Poslato: ${result.data.sent}.`);
      } else if (result.data.skipped > 0) {
        toast.info(
          `Slanje je preskočeno za ${result.data.skipped} primalaca — email nije konfigurisan.`,
        );
      } else {
        toast.error('Nijedan email nije poslat.');
      }
    } catch (error) {
      toast.error(errorMessage(error));
    }
  }

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[{ label: 'Kontrolna tabla', href: '/admin' }, { label: 'Newsletter' }]}
        title="Newsletter"
        description="Korisnici koji su pristali na primanje novosti."
      />

      {!emailConfigured ? (
        <Alert severity="warning">
          Slanje emaila trenutno nije konfigurisano (<code>EMAIL_FROM</code> nije postavljen), pa
          slanje iz aplikacije neće ništa poslati. Do tada koristite izvoz adresa ispod.
        </Alert>
      ) : null}

      <ContentCard
        title="Primaoci"
        description={
          recipients.data
            ? `${recipients.data.meta.total} ${pluralBs(recipients.data.meta.total, 'korisnik', 'korisnika', 'korisnika')} prima newsletter.`
            : undefined
        }
        actions={
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              startIcon={<ContentCopyIcon />}
              onClick={() => void copyEmails()}
              disabled={emails.length === 0}
            >
              Kopiraj adrese
            </Button>
            <Button size="small" onClick={downloadCsv} disabled={emails.length === 0}>
              Preuzmi CSV
            </Button>
          </Stack>
        }
        disablePadding
      >
        <QueryState
          query={recipients}
          errorTitle="Primaoce nije moguće učitati"
          isEmpty={(page) => page.data.length === 0}
          empty={
            <EmptyState
              title="Još niko nije pristao"
              description="Korisnici se prijavljuju sami, u svojim podešavanjima."
            />
          }
        >
          {(page) => (
            <DataTable
              rows={page.data}
              getRowId={(row) => row.id}
              columns={[
                { id: 'name', header: 'Ime i prezime', cell: (row) => row.full_name },
                { id: 'email', header: 'Email', cell: (row) => row.email },
              ]}
            />
          )}
        </QueryState>
      </ContentCard>

      <ContentCard
        title="Nova poruka"
        description="Prazan red razdvaja pasuse. Formatiranje je isto kao u ostalim emailovima aplikacije."
      >
        <Stack spacing={2}>
          <TextField
            label="Naslov emaila (subject)"
            value={subject}
            onChange={(event) => setSubject(event.target.value)}
            disabled={send.isPending}
          />
          <TextField
            label="Naslov u poruci"
            value={heading}
            onChange={(event) => setHeading(event.target.value)}
            disabled={send.isPending}
          />
          <TextField
            label="Tekst"
            value={body}
            onChange={(event) => setBody(event.target.value)}
            multiline
            minRows={8}
            disabled={send.isPending}
            helperText={`${lines.length} ${pluralBs(lines.length, 'pasus', 'pasusa', 'pasusa')}`}
          />

          <Stack direction="row" sx={{ justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              startIcon={<SendIcon />}
              onClick={() => setConfirming(true)}
              disabled={!canSend || send.isPending}
            >
              {send.isPending ? 'Slanje…' : `Pošalji (${emails.length})`}
            </Button>
          </Stack>
        </Stack>
      </ContentCard>

      <ConfirmDialog
        open={confirming}
        title="Poslati newsletter?"
        description={`Poruka će biti poslata na ${emails.length} ${pluralBs(emails.length, 'adresu', 'adrese', 'adresa')}. Email se ne može povući nakon slanja.`}
        confirmLabel="Pošalji"
        severity="primary"
        pending={send.isPending}
        onCancel={() => setConfirming(false)}
        onConfirm={() => void doSend()}
      />
    </PageContainer>
  );
}
