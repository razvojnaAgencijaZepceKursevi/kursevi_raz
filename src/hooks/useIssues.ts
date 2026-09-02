'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, toSearchParams, type Envelope, type Paginated } from '@/lib/api/client';
import type { PaginationQuery } from '@/lib/schemas/common.schema';
import type {
  CreateIssueMessageRequest,
  CreateIssueMessageResponse,
  CreateIssueRequest,
  CreateIssueResponse,
  Issue,
  IssueMessage,
  ListIssuesQuery,
} from '@/lib/schemas/issues.schema';
import { notificationKeys } from './useNotifications';

/**
 * Support issues.
 *
 * One set of hooks for both sides: `GET /api/issues` returns your own issues if
 * you are a user and every issue if you are an admin, decided by RLS rather
 * than by the caller. So the admin queue and "my issues" are the same query
 * with different filters, and there is no `useAdminIssues` twin.
 */
export type IssueListParams = Partial<ListIssuesQuery>;

export const issueKeys = {
  all: ['issues'] as const,
  lists: () => [...issueKeys.all, 'list'] as const,
  list: (params: IssueListParams) => [...issueKeys.lists(), params] as const,
  detail: (id: string) => [...issueKeys.all, 'detail', id] as const,
  messages: (id: string, params: Partial<PaginationQuery>) =>
    [...issueKeys.all, 'messages', id, params] as const,
  messagesFor: (id: string) => [...issueKeys.all, 'messages', id] as const,
};

/**
 * `enabled` matches `useAdminUsers`: pass `{ enabled: false }` rather than
 * calling the hook conditionally. The admin dashboard needs it because the
 * endpoint is RLS-scoped — a teacher asking would get their own tickets back,
 * which would render as a support queue that is not one.
 */
export function useIssues(
  params: IssueListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: issueKeys.list(params),
    queryFn: () => apiGet<Paginated<Issue>>(`/api/issues${toSearchParams(params)}`),
    enabled,
  });
}

export function useIssue(id: string | undefined) {
  return useQuery({
    queryKey: issueKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<Issue>>(`/api/issues/${id}`),
    enabled: Boolean(id),
    select: (response) => response.data,
  });
}

export function useIssueMessages(id: string | undefined, params: Partial<PaginationQuery> = {}) {
  return useQuery({
    queryKey: issueKeys.messages(id ?? '', params),
    queryFn: () =>
      apiGet<Paginated<IssueMessage>>(`/api/issues/${id}/messages${toSearchParams(params)}`),
    enabled: Boolean(id),
  });
}

/** POST /api/issues — opens one, with its first message. */
export function useCreateIssue() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: CreateIssueRequest) => apiPost<CreateIssueResponse>('/api/issues', body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: issueKeys.all }),
  });
}

/**
 * POST /api/issues/:id/messages
 *
 * Any reply can change the status — an admin's explicitly, a reporter's by
 * re-opening a closed issue — so this invalidates the issue and its list as
 * well as the thread. Notifications too: every reply sends one.
 */
export function useCreateIssueMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ issueId, body }: { issueId: string; body: CreateIssueMessageRequest }) =>
      apiPost<CreateIssueMessageResponse>(`/api/issues/${issueId}/messages`, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: issueKeys.all }),
        queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
      ]),
  });
}
