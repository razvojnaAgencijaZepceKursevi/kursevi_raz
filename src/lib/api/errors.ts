import { NextResponse } from 'next/server';
import { ZodError, type ZodType, type z } from 'zod';
import type {
  PostgrestError,
  PostgrestResponse,
  PostgrestSingleResponse,
} from '@supabase/supabase-js';

/** Error with an intended HTTP status. Anything else becomes a 500. */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly details?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export const badRequest = (m = 'Bad request', d?: unknown) => new ApiError(400, m, d);
export const unauthorized = (m = 'Not authenticated') => new ApiError(401, m);
export const forbidden = (m = 'Not authorized') => new ApiError(403, m);
export const notFound = (m = 'Not found') => new ApiError(404, m);
export const conflict = (m = 'Conflict') => new ApiError(409, m);

/**
 * Maps a PostgREST error onto a sensible status. RLS denials surface as 42501
 * and must not leak as 500s — a student hitting a policy boundary is a 403,
 * not a server fault.
 */
export function fromPostgrestError(error: PostgrestError): ApiError {
  switch (error.code) {
    case 'PGRST116':
      return notFound();
    case '42501':
      return forbidden(error.message);
    case '23505':
      return conflict(error.message);
    case '23503':
      return badRequest(error.message);
    case '23514':
      return badRequest(error.message);
    default:
      return new ApiError(500, error.message);
  }
}

/*
 * These take Supabase's own response types rather than a hand-rolled
 * `{ data, error }` shape.
 *
 * Note both single-row helpers are typed against `PostgrestSingleResponse<T>`,
 * never `PostgrestMaybeSingleResponse<T>` — the latter is only an alias for
 * `PostgrestSingleResponse<T | null>`, so inferring T through it is ambiguous
 * and silently collapses every row type to `never`.
 */

/** For `.single()` / `.maybeSingle()` where a missing row is a 404. */
export function unwrapOne<T>(result: PostgrestSingleResponse<T>): NonNullable<T> {
  if (result.error) throw fromPostgrestError(result.error);
  if (result.data === null || result.data === undefined) throw notFound();
  return result.data as NonNullable<T>;
}

/**
 * For `.maybeSingle()` where absence is a legitimate outcome rather than an
 * error (e.g. "does this student already have progress on this module?").
 */
export function unwrapMaybe<T>(result: PostgrestSingleResponse<T>): T {
  if (result.error) throw fromPostgrestError(result.error);
  return result.data;
}

/** For list queries. An empty result set is `[]`, never null. */
export function unwrapMany<T>(result: PostgrestResponse<T>): T[] {
  if (result.error) throw fromPostgrestError(result.error);
  return result.data ?? [];
}

export function toErrorResponse(error: unknown): NextResponse {
  if (error instanceof ZodError) {
    return NextResponse.json(
      { error: 'Validation failed', details: error.issues },
      { status: 400 },
    );
  }

  if (error instanceof ApiError) {
    return NextResponse.json(
      { error: error.message, ...(error.details ? { details: error.details } : {}) },
      { status: error.status },
    );
  }

  // Genuinely unexpected — log server-side, stay vague to the caller.
  console.error('[api] unhandled error', error);
  return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
}

/**
 * Wraps a route handler so thrown ApiError/ZodError become proper responses
 * instead of unhandled 500s.
 */
export function withRoute<Ctx>(
  handler: (req: Request, ctx: Ctx) => Promise<NextResponse | Response>,
) {
  return async (req: Request, ctx: Ctx): Promise<NextResponse | Response> => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      return toErrorResponse(error);
    }
  };
}

/** Parses a JSON body against a schema, raising a 400 on malformed input. */
export async function parseBody<S extends ZodType>(req: Request, schema: S): Promise<z.infer<S>> {
  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    throw badRequest('Request body must be valid JSON');
  }
  return schema.parse(raw) as z.infer<S>;
}

/** Parses query params against a schema (coercion lives in the schemas). */
export function parseQuery<S extends ZodType>(req: Request, schema: S): z.infer<S> {
  const params = Object.fromEntries(new URL(req.url).searchParams.entries());
  return schema.parse(params) as z.infer<S>;
}
