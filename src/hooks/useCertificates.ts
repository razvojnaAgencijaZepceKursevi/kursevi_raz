'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, toSearchParams, type Envelope, type Paginated } from '@/lib/api/client';
import type {
  AdminCertificate,
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
  details: () => [...adminCertificateKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCertificateKeys.details(), id] as const,
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

/**
 * GET /api/admin/certificates — all certificates and delivery requests.
 *
 * Rows are `AdminCertificate`, which embeds the course and the student.
 */
export function useAdminCertificates(params: CertificateListParams = {}) {
  return useQuery({
    queryKey: adminCertificateKeys.list(params),
    queryFn: () =>
      apiGet<Paginated<AdminCertificate>>(`/api/admin/certificates${toSearchParams(params)}`),
  });
}

/**
 * GET /api/admin/certificates/:id — one certificate, course and student embedded.
 *
 * There is no admin write counterpart. `requested_delivery` belongs to the
 * student, and fulfilment isn't tracked in the schema at all.
 */
export function useAdminCertificate(id: string | undefined) {
  return useQuery({
    queryKey: adminCertificateKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<AdminCertificate>>(`/api/admin/certificates/${id}`),
    enabled: Boolean(id),
    select: (response) => response.data,
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
