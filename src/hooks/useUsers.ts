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

/** GET /api/admin/users */
export function useAdminUsers(params: UserListParams = {}) {
  return useQuery({
    queryKey: adminUserKeys.list(params),
    queryFn: () => apiGet<Paginated<Profile>>(`/api/admin/users${toSearchParams(params)}`),
  });
}

/**
 * PATCH /api/admin/users/:id — role is the only field this endpoint accepts.
 *
 * Also invalidates `useMe`, since an admin can demote their own account and the
 * cached profile would otherwise keep showing admin UI.
 */
export function useUpdateUserRole() {
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
