'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, toSearchParams, type Envelope, type Paginated } from '@/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';
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

/**
 * GET /api/certificates — the signed-in student's own certificates.
 *
 * Takes `enabled` because the certificate page is public: a signed-out visitor
 * would only get a 401 from it, and the page still has to render.
 */
export function useCertificates(
  params: CertificateListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: certificateKeys.list(params),
    queryFn: () => apiGet<Paginated<Certificate>>(`/api/certificates${toSearchParams(params)}`),
    enabled,
  });
}

/**
 * The caller's own certificate row for one identifier, if it is theirs.
 *
 * The certificate page is public and reads its facts from the *verification*
 * endpoint, which deliberately returns a fixed minimal projection and no row.
 * That is the right answer for a stranger following a link, but it means the
 * owner sees no more than the stranger does — and the owner is the one who may
 * ask for a printed copy.
 *
 * So ownership is established the only way it can be without a new endpoint:
 * look for the identifier in the caller's own certificate list. A student has a
 * handful of these, so one page covers it. Signed-out visitors never ask.
 *
 * Accepts either form of identifier, matching what the verification route does.
 */
export function useOwnedCertificate(identifier: string | undefined) {
  const signedIn = useAuthStore((s) => Boolean(s.profile));
  const authLoading = useAuthStore((s) => s.loading);

  const list = useCertificates({ pageSize: 100 }, { enabled: signedIn && Boolean(identifier) });

  const certificate = identifier
    ? list.data?.data.find((c) => c.id === identifier || c.readable_id === identifier)
    : undefined;

  return {
    certificate,
    /** False until we can actually tell — avoids flashing the wrong panel. */
    isResolved: !authLoading && (!signedIn || !list.isPending),
  };
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

/**
 * PATCH /api/admin/certificates/:id — mark the printed copy posted, or unmark it.
 *
 * Invalidates both the admin lists and the *student's* certificate queries: the
 * same row is on their dashboard, and an admin marking it sent changes what
 * they see. Cheap, and it means the two views cannot disagree in a tab left
 * open.
 */
export function useMarkCertificateDelivered() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, delivered }: { id: string; delivered: boolean }) =>
      apiPatch<Envelope<AdminCertificate>>(`/api/admin/certificates/${id}`, { delivered }),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminCertificateKeys.all }),
        queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
      ]),
  });
}
