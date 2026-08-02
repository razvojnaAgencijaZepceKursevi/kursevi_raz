'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, toSearchParams, type Envelope, type Paginated } from '@/lib/api/client';
import type {
  Certificate,
  CertificateVerification,
  ListCertificatesQuery,
} from '@/lib/schemas/certificates.schema';

export type CertificateListParams = Partial<ListCertificatesQuery>;

export const certificateKeys = {
  all: ['certificates'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (params: CertificateListParams) => [...certificateKeys.lists(), params] as const,
  verification: (certificateId: string) =>
    [...certificateKeys.all, 'verification', certificateId] as const,
};

export const adminCertificateKeys = {
  all: ['admin', 'certificates'] as const,
  lists: () => [...adminCertificateKeys.all, 'list'] as const,
  list: (params: CertificateListParams) => [...adminCertificateKeys.lists(), params] as const,
};

/** GET /api/certificates — the signed-in student's own certificates. */
export function useCertificates(params: CertificateListParams = {}) {
  return useQuery({
    queryKey: certificateKeys.list(params),
    queryFn: () => apiGet<Paginated<Certificate>>(`/api/certificates${toSearchParams(params)}`),
  });
}

/**
 * GET /api/certificates/:certificateId — public verification.
 *
 * Unauthenticated, and accepts either the readable id (CERT-YYYY-NNNN) or the
 * uuid. A bad identifier is a 404 by design, so an error here means "not a
 * valid certificate" rather than a failure worth retrying.
 */
export function useVerifyCertificate(certificateId: string | undefined) {
  return useQuery({
    queryKey: certificateKeys.verification(certificateId ?? ''),
    queryFn: () => apiGet<Envelope<CertificateVerification>>(`/api/certificates/${certificateId}`),
    enabled: Boolean(certificateId),
    select: (response) => response.data,
  });
}

/** GET /api/admin/certificates — all certificates and delivery requests. */
export function useAdminCertificates(params: CertificateListParams = {}) {
  return useQuery({
    queryKey: adminCertificateKeys.list(params),
    queryFn: () =>
      apiGet<Paginated<Certificate>>(`/api/admin/certificates${toSearchParams(params)}`),
  });
}

/** PATCH /api/certificates/:certificateId/request-delivery */
export function useRequestCertificateDelivery() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      certificateId,
      requestedDelivery = true,
    }: {
      certificateId: string;
      requestedDelivery?: boolean;
    }) =>
      apiPatch<Envelope<Certificate>>(`/api/certificates/${certificateId}/request-delivery`, {
        requested_delivery: requestedDelivery,
      }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminCertificateKeys.all }),
      ]),
  });
}
