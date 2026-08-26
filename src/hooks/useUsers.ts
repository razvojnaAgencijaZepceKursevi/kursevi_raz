'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, toSearchParams, type Envelope, type Paginated } from '@/lib/api/client';
import type {
  ListUsersQuery,
  MeResponse,
  Profile,
  UpdateUserRequest,
} from '@/lib/schemas/users.schema';

export type UserListParams = Partial<ListUsersQuery>;

export const meKeys = {
  all: ['me'] as const,
};

export const adminUserKeys = {
  all: ['admin', 'users'] as const,
  lists: () => [...adminUserKeys.all, 'list'] as const,
  list: (params: UserListParams) => [...adminUserKeys.lists(), params] as const,
  details: () => [...adminUserKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminUserKeys.details(), id] as const,
};

/**
 * GET /api/me — the signed-in profile and role.
 *
 * `useAuthStore` is the synchronous source for role-gated UI; this is the
 * server's answer, useful when a page needs to be sure rather than fast.
 */
export function useMe() {
  return useQuery({
    queryKey: meKeys.all,
    // Note the envelope: /api/me returns `{ profile }`, not the `{ data }`
    // every other endpoint uses.
    queryFn: () => apiGet<MeResponse>('/api/me'),
    select: (response) => response.profile,
  });
}

/**
 * GET /api/admin/users
 *
 * Admin-only endpoint. Pass `enabled: false` on screens a teacher can also
 * reach, so their browser never fires a request that is bound to 403.
 */
export function useAdminUsers(
  params: UserListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => apiGet<Paginated<Profile>>(`/api/admin/users${toSearchParams(params)}`),
    enabled,
  });
}

/** GET /api/admin/users/:id — one profile. Idle until an id is known. */
export function useAdminUser(id: string | undefined) {
  return useQuery({
    queryKey: adminUserKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<Profile>>(`/api/admin/users/${id}`),
    enabled: Boolean(id),
    select: (response) => response.data,
  });
}

/**
 * PATCH /api/admin/users/:id — rename, change role, deactivate/reactivate.
 *
 * Send only the fields being changed. The endpoint treats every field as
 * optional, so a rename that also restated `role` could silently revert a role
 * change made from another tab.
 *
 * Also invalidates `useMe`: an admin can rename themselves, and the cached
 * profile drives role-gated UI, so a stale copy would keep rendering the old
 * name or the wrong navigation.
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateUserRequest }) =>
      apiPatch<Envelope<Profile>>(`/api/admin/users/${id}`, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: adminUserKeys.all }),
        queryClient.invalidateQueries({ queryKey: meKeys.all }),
      ]),
  });
}
