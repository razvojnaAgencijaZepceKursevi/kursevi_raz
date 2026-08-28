'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, type Envelope } from '@/lib/api/client';
import type { PaymentSettings, UpdatePaymentSettingsRequest } from '@/lib/schemas/payment.schema';
import type {
  LegalDocument,
  LegalSlug,
  UpdateLegalDocumentRequest,
} from '@/lib/schemas/legal.schema';

/**
 * Admin-controlled site content: the seller's payment details and the two legal
 * documents (migration 0030).
 *
 * One file because they are the same kind of thing — a small, singleton record
 * an admin edits and everyone else reads — and splitting them would mean two
 * near-identical modules.
 */
export const siteContentKeys = {
  all: ['site-content'] as const,
  payment: () => [...siteContentKeys.all, 'payment'] as const,
  legal: (slug: LegalSlug) => [...siteContentKeys.all, 'legal', slug] as const,
};

/**
 * The payment details. Readable by anyone, including signed-out visitors —
 * this is the seller's public business identity.
 *
 * Long `staleTime`: it changes when an admin edits it, which is close to never,
 * and it is read on the course page where a refetch on every focus would be
 * pure noise.
 */
export function usePaymentSettings() {
  return useQuery({
    queryKey: siteContentKeys.payment(),
    queryFn: () => apiGet<Envelope<PaymentSettings>>('/api/payment-settings'),
    select: (response) => response.data,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdatePaymentSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdatePaymentSettingsRequest) =>
      apiPatch<Envelope<PaymentSettings>>('/api/payment-settings', body),
    onSuccess: (response) => {
      queryClient.setQueryData(siteContentKeys.payment(), response);
    },
  });
}

export function useLegalDocument(slug: LegalSlug) {
  return useQuery({
    queryKey: siteContentKeys.legal(slug),
    queryFn: () => apiGet<Envelope<LegalDocument>>(`/api/legal/${slug}`),
    select: (response) => response.data,
    staleTime: 10 * 60 * 1000,
  });
}

export function useUpdateLegalDocument(slug: LegalSlug) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateLegalDocumentRequest) =>
      apiPatch<Envelope<LegalDocument>>(`/api/legal/${slug}`, body),
    onSuccess: (response) => {
      queryClient.setQueryData(siteContentKeys.legal(slug), response);
    },
  });
}
