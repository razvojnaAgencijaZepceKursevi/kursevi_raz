'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, type Envelope } from '@/lib/api/client';
import type {
  UpdateUserPreferencesRequest,
  UserPreferences,
} from '@/lib/schemas/preferences.schema';

/** Colour scheme + newsletter opt-in for the signed-in user (migration 0029). */
export const preferenceKeys = {
  all: ['preferences'] as const,
  mine: () => [...preferenceKeys.all, 'mine'] as const,
};

/**
 * `enabled` exists because this is read by `<ThemeSync>`, which mounts on every
 * page including the signed-out ones. Asking there would 401 on each public
 * page load and, worse, would make a visitor's browser look like it had a
 * failed session.
 */
export function useMyPreferences({ enabled = true }: { enabled?: boolean } = {}) {
  return useQuery({
    queryKey: preferenceKeys.mine(),
    queryFn: () => apiGet<Envelope<UserPreferences>>('/api/preferences'),
    enabled,
    select: (response) => response.data,
    // A colour scheme does not change behind the user's back; refetching it on
    // every window focus would repaint the app for no reason.
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdatePreferences() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (body: UpdateUserPreferencesRequest) =>
      apiPatch<Envelope<UserPreferences>>('/api/preferences', body),
    /*
     * The response is the complete merged object, so the cache can be replaced
     * rather than invalidated. That matters for the theme specifically: an
     * invalidate would leave the UI on the old scheme until the refetch landed,
     * which reads as the toggle not working.
     */
    onSuccess: (response) => {
      queryClient.setQueryData(preferenceKeys.mine(), response);
    },
  });
}
