import type { z } from 'zod';
import type { paginationMetaSchema } from '@/lib/schemas/common.schema';

/**
 * Browser-side fetch wrapper for our own `/api/*` routes.
 *
 * Counterpart to `@/lib/api/errors`, which owns the server half of the same
 * contract. That module can't be reused here — it imports `next/server` — so
 * the wire format (`{ error, details }` on failure, `{ data }` or
 * `{ data, meta }` on success) is re-expressed for the client instead.
 *
 * Types come from the zod schemas in `@/lib/schemas` via type-only imports, so
 * nothing from zod ends up in the client bundle. There is no runtime response
 * validation here on purpose: the schemas describe what the server promises,
 * and re-parsing every payload in the browser would ship zod plus the
 * zod-to-openapi extension to every page for little benefit.
 */

export type PaginationMeta = z.infer<typeof paginationMetaSchema>;

/** Single-resource envelope, as returned by every detail/create/update route. */
export type Envelope<T> = { data: T };

/** List envelope, as produced by `paginatedResponse()` on the server. */
export type Paginated<T> = { data: T[]; meta: PaginationMeta };

/**
 * A non-2xx response from our API. `status` is what `queryDefaults.retry` in
 * `@/lib/query/queryClient` reads to decide that 4xx failures are final — keep
 * the property name in sync with it.
 */
export class ApiRequestError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const isApiRequestError = (error: unknown): error is ApiRequestError =>
  error instanceof ApiRequestError;

type QueryValue = string | number | boolean | null | undefined;

/**
 * Serialises hook params into a query string, dropping empties so a blank
 * search box doesn't send `search=` and trip the schema's `.min(1)`.
 */
export function toSearchParams(query: Record<string, QueryValue> = {}): string {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null || value === '') continue;
    params.set(key, String(value));
  }

  const serialised = params.toString();
  return serialised ? `?${serialised}` : '';
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  // 204 on DELETE — no body to read.
  if (response.status === 204) return undefined as T;

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const body = payload as { error?: string; details?: unknown } | null;
    throw new ApiRequestError(
      response.status,
      body?.error ?? `Request failed with status ${response.status}`,
      body?.details,
    );
  }

  return payload as T;
}

export const apiGet = <T>(path: string, init?: RequestInit) =>
  apiFetch<T>(path, { ...init, method: 'GET' });

export const apiPost = <T>(path: string, body?: unknown, init?: RequestInit) =>
  apiFetch<T>(path, { ...init, method: 'POST', body: JSON.stringify(body ?? {}) });

export const apiPatch = <T>(path: string, body?: unknown, init?: RequestInit) =>
  apiFetch<T>(path, { ...init, method: 'PATCH', body: JSON.stringify(body ?? {}) });

export const apiDelete = (path: string, init?: RequestInit) =>
  apiFetch<void>(path, { ...init, method: 'DELETE' });
