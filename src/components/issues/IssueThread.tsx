'use client';

import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import LoadingState from '@/components/feedback/LoadingState';
import { useIssueMessages } from '@/hooks/useIssues';
import { useAuthStore } from '@/store/useAuthStore';
import { formatDateTime } from '@/lib/format';

/**
 * The conversation on one issue, rendered the same way for both sides.
 *
 * Same reasoning as `<MessageThread>` on submissions: a thread has two
 * participants and the same three things to show per message, so it is one
 * component. What differs is what each side may *do*, and that lives in the
 * composer beside it.
 *
 * Sides are decided by comparing the sender to the issue's reporter, not by
 * role — an admin may be both the reporter and the responder on their own
 * issue, and "Vi" wins over either label.
 */
export default function IssueThread({
  issueId,
  reporterId,
}: {
  issueId: string;
  reporterId: string;
}) {
  const myId = useAuthStore((s) => s.profile?.id);
  const messages = useIssueMessages(issueId, { pageSize: 100 });

  return (
    <QueryState
      query={messages}
      errorTitle="Poruke nije moguće učitati"
      loading={<LoadingState minHeight={120} />}
      isEmpty={(page) => page.data.length === 0}
      empty={<EmptyState title="Nema poruka" />}
    >
      {(page) => (
        <Stack spacing={2} sx={{ p: 3 }}>
          {page.data.map((message) => {
            const mine = message.sender_id === myId;
            const author = mine
              ? 'Vi'
              : message.sender_id === reporterId
                ? (message.profiles?.full_name ?? 'Korisnik')
                : 'Podrška';

            return (
              <Stack
                key={message.id}
                sx={{
                  alignSelf: mine ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  px: 2,
                  py: 1.25,
                  borderRadius: 2,
                  bgcolor: mine ? 'primary.main' : 'action.hover',
                  color: mine ? 'primary.contrastText' : 'text.primary',
                }}
              >
                <Typography variant="caption" sx={{ opacity: 0.75, fontWeight: 600, mb: 0.25 }}>
                  {author}
                </Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                  {message.body}
                </Typography>
                <Typography variant="caption" sx={{ opacity: 0.7, alignSelf: 'flex-end', mt: 0.5 }}>
                  {formatDateTime(message.created_at)}
                </Typography>
              </Stack>
            );
          })}
        </Stack>
      )}
    </QueryState>
  );
}
