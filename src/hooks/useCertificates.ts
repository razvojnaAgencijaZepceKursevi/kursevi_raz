'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiGet,
  apiPatch,
  apiPost,
  toSearchParams,
  type Envelope,
  type Paginated,
} from '@/lib/api/client';
import type {
  AdminCertificate,
  Certificate,
  CertificateVerification,
  ListCertificatesQuery,
  VerifyCertificateRequest,
} from '@/lib/schemas/certificates.schema';

export type CertificateListParams = Partial<ListCertificatesQuery>;

export const certificateKeys = {
  all: ['certificates'] as const,
  lists: () => [...certificateKeys.all, 'list'] as const,
  list: (params: CertificateListParams) => [...certificateKeys.lists(), params] as const,
  detail: (identifier: string) => [...certificateKeys.all, 'detail', identifier] as const,
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
 * GET /api/certificates/:idOrReadableId — one certificate.
 *
 * Signed in only. RLS admits the student it belongs to, an admin, or the
 * teacher who owns the course; anyone else gets a 404. Accepts either the
 * readable id or the uuid.
 *
 * This replaced a public verification lookup and its separate "is it mine?"
 * list query. Now that the response is scoped, it can carry the whole row —
 * so the page reads `student_id` directly instead of hunting for the id in the
 * caller's own certificate list.
 */
export function useCertificate(identifier: string | undefined) {
  return useQuery({
    queryKey: certificateKeys.detail(identifier ?? ''),
    queryFn: () => apiGet<Envelope<AdminCertificate>>(`/api/certificates/${identifier}`),
    enabled: Boolean(identifier),
    select: (response) => response.data,
  });
}

/**
 * GET /api/admin/certificates — all certificates and delivery requests.
 *
 * Rows are `AdminCertificate`, which embeds the course and the student.
 */
export function useAdminCertificates(
  params: CertificateListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    enabled,
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

/**
 * POST /api/certificates/verify — the public check, number + surname.
 *
 * A mutation rather than a query: it is an explicit "check this" action, and
 * a miss is a 404 the screen shows as an answer, not something to retry or
 * cache. Usable signed out.
 */
export function useVerifyCertificate() {
  return useMutation({
    mutationFn: (body: VerifyCertificateRequest) =>
      apiPost<Envelope<CertificateVerification>>('/api/certificates/verify', body).then(
        (res) => res.data,
      ),
  });
}
