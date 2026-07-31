import { QueryClient, type DefaultOptions } from '@tanstack/react-query';

/**
 * Shared React Query defaults.
 *
 * Course/module content is effectively static between admin edits, so a
 * non-trivial `staleTime` avoids refetching a course tree on every focus.
 * Auth-ish failures (401/403) are never worth retrying — the user needs to log
 * in or buy the course, not wait.
 */
export const queryDefaults: DefaultOptions = {
  queries: {
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    retry: (failureCount, error) => {
      const status = (error as { status?: number } | null)?.status;
      if (status && status >= 400 && status < 500) return false;
      return failureCount < 2;
    },
  },
  mutations: {
    retry: false,
  },
};

export function makeQueryClient() {
  return new QueryClient({ defaultOptions: queryDefaults });
}

/**
 * Browser-side singleton. On the server every request gets a fresh client so
 * one user's cache can never be served to another.
 */
let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  if (typeof window === 'undefined') return makeQueryClient();
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
