'use client';

import { useMutation, useQuery } from '@tanstack/react-query';
import { apiGet, apiPost } from '@/lib/api/client';
import type {
  NewsletterRecipientsResponse,
  SendNewsletterRequest,
  SendNewsletterResponse,
} from '@/lib/schemas/newsletter.schema';

export const newsletterKeys = {
  all: ['newsletter'] as const,
  recipients: () => [...newsletterKeys.all, 'recipients'] as const,
};

/** Everyone opted in. Unpaginated on purpose — the screen exports the whole set. */
export function useNewsletterRecipients() {
  return useQuery({
    queryKey: newsletterKeys.recipients(),
    queryFn: () => apiGet<NewsletterRecipientsResponse>('/api/admin/newsletter'),
  });
}

/**
 * No `onSuccess` cache work: sending does not change who is subscribed, and the
 * caller wants the per-send counts rather than a refreshed list.
 */
export function useSendNewsletter() {
  return useMutation({
    mutationFn: (body: SendNewsletterRequest) =>
      apiPost<SendNewsletterResponse>('/api/admin/newsletter', body),
  });
}
