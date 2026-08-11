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
  AdminPurchase,
  CreatePurchaseRequest,
  ListPurchasesQuery,
  Purchase,
  UpdatePurchaseRequest,
} from '@/lib/schemas/purchases.schema';
import { moduleKeys } from './useModules';

export type PurchaseListParams = Partial<ListPurchasesQuery>;

export const purchaseKeys = {
  all: ['purchases'] as const,
  lists: () => [...purchaseKeys.all, 'list'] as const,
  list: (params: PurchaseListParams) => [...purchaseKeys.lists(), params] as const,
};

export const adminPurchaseKeys = {
  all: ['admin', 'purchases'] as const,
  lists: () => [...adminPurchaseKeys.all, 'list'] as const,
  list: (params: PurchaseListParams) => [...adminPurchaseKeys.lists(), params] as const,
  details: () => [...adminPurchaseKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminPurchaseKeys.details(), id] as const,
};

/**
 * GET /api/purchases — the signed-in student's own purchases.
 *
 * `enabled` is exposed because this endpoint 401s for signed-out callers, and
 * the public course page renders for them too. Pass `enabled: false` rather
 * than calling it conditionally — hooks can't be skipped.
 */
export function usePurchases(
  params: PurchaseListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: purchaseKeys.list(params),
    queryFn: () => apiGet<Paginated<Purchase>>(`/api/purchases${toSearchParams(params)}`),
    enabled,
  });
}

/**
 * POST /api/purchases — request a purchase.
 *
 * Only `course_id` is sent: price is snapshotted server-side and status is
 * always `requested`, so there is nothing else for the client to supply.
 */
export function useCreatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreatePurchaseRequest) =>
      apiPost<Envelope<Purchase>>('/api/purchases', body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminPurchaseKeys.all }),
      ]),
  });
}

/**
 * GET /api/admin/purchases — list/filter every purchase.
 *
 * Rows are `AdminPurchase`, not `Purchase`: this endpoint embeds the course and
 * the student, which is what lets the admin UI show names rather than uuids.
 * Both may be null if the related row was deleted.
 */
export function useAdminPurchases(params: PurchaseListParams = {}) {
  return useQuery({
    queryKey: adminPurchaseKeys.list(params),
    queryFn: () =>
      apiGet<Paginated<AdminPurchase>>(`/api/admin/purchases${toSearchParams(params)}`),
  });
}

/** GET /api/admin/purchases/:id — one purchase, course and student embedded. */
export function useAdminPurchase(id: string | undefined) {
  return useQuery({
    queryKey: adminPurchaseKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<AdminPurchase>>(`/api/admin/purchases/${id}`),
    enabled: Boolean(id),
    select: (response) => response.data,
  });
}

/**
 * PATCH /api/admin/purchases/:id — approve or deny.
 *
 * Approving is what grants access to course content, so the module caches are
 * dropped too: a previously 403'd module list becomes readable.
 */
export function useUpdatePurchase() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdatePurchaseRequest }) =>
      apiPatch<Envelope<Purchase>>(`/api/admin/purchases/${id}`, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: purchaseKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminPurchaseKeys.all }),
        queryClient.invalidateQueries({ queryKey: moduleKeys.all }),
      ]),
  });
}
