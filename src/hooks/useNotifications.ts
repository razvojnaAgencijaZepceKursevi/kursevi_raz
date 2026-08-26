'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost, toSearchParams, type Paginated } from '@/lib/api/client';
import { useAuthStore } from '@/store/useAuthStore';
import type {
  ListNotificationsQuery,
  Notification,
  NotificationPreferencesResponse,
  UpdateNotificationPreferencesRequest,
} from '@/lib/schemas/notifications.schema';

/**
 * In-app notifications.
 *
 * ## Polling, not realtime
 *
 * The badge refetches on a timer. Supabase can push these over a websocket, and
 * that would be the better answer for a chat app — but a notification here is
 * minutes-fresh at best (an admin gets round to approving a purchase), and a
 * websocket per signed-in tab is a connection to keep alive, re-authenticate
 * and reason about for a gain nobody would notice. A minute of latency on a
 * badge is not a defect.
 *
 * `refetchOnWindowFocus` is what actually makes it feel quick: coming back to
 * the tab checks immediately, so the timer only matters while you sit and look
 * at it.
 */

export type NotificationListParams = Partial<ListNotificationsQuery>;

export const notificationKeys = {
  all: ['notifications'] as const,
  lists: () => [...notificationKeys.all, 'list'] as const,
  list: (params: NotificationListParams) => [...notificationKeys.lists(), params] as const,
  unreadCount: () => [...notificationKeys.all, 'unread-count'] as const,
  preferences: () => [...notificationKeys.all, 'preferences'] as const,
};

/** How often the badge asks. Long enough to be invisible in the network tab. */
const POLL_INTERVAL_MS = 60_000;

/**
 * GET /api/notifications
 *
 * Takes `enabled` so the bell's dropdown can hold off until it is opened —
 * passing the option rather than calling the hook conditionally, which is the
 * only way that works.
 */
export function useNotifications(
  params: NotificationListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: notificationKeys.list(params),
    queryFn: () => apiGet<Paginated<Notification>>(`/api/notifications${toSearchParams(params)}`),
    enabled,
  });
}

/**
 * The unread badge.
 *
 * No dedicated count endpoint: this asks for `pageSize: 1` and reads
 * `meta.total`, which is the project's standing answer to "I need a count, not
 * rows". The one row that comes back is thrown away and costs nothing.
 *
 * Disabled while signed out, so the public pages don't poll a 401 forever.
 */
export function useUnreadNotificationCount() {
  const signedIn = useAuthStore((s) => Boolean(s.profile));

  return useQuery({
    queryKey: notificationKeys.unreadCount(),
    queryFn: () =>
      apiGet<Paginated<Notification>>(
        `/api/notifications${toSearchParams({ unread: true, pageSize: 1 })}`,
      ),
    select: (page) => page.meta.total,
    enabled: signedIn,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    // A stale badge for a few seconds is fine; a badge that refetches on every
    // component mount is not.
    staleTime: 30_000,
  });
}

/** PATCH /api/notifications/:id/read */
export function useMarkNotificationRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPatch<{ data: Notification }>(`/api/notifications/${id}/read`, {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

/** POST /api/notifications/read-all */
export function useMarkAllNotificationsRead() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<{ data: { marked: number } }>('/api/notifications/read-all', {}),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
  });
}

/**
 * GET /api/notification-preferences — the merged matrix, defaults filled in.
 *
 * `meta.email_configured` rides along so the settings screen can say plainly
 * that mail is not switched on yet, rather than offering a toggle that quietly
 * does nothing.
 */
export function useNotificationPreferences() {
  return useQuery({
    queryKey: notificationKeys.preferences(),
    queryFn: () => apiGet<NotificationPreferencesResponse>('/api/notification-preferences'),
  });
}

/**
 * PATCH /api/notification-preferences
 *
 * The response is the whole refreshed matrix, so it is written straight into
 * the cache rather than triggering a refetch — one round trip per toggle
 * instead of two.
 */
export function useUpdateNotificationPreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateNotificationPreferencesRequest) =>
      apiPatch<NotificationPreferencesResponse>('/api/notification-preferences', body),
    onSuccess: (response) => queryClient.setQueryData(notificationKeys.preferences(), response),
  });
}
