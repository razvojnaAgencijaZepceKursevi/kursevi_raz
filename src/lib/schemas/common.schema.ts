import { z } from '@/lib/openapi/zod';

export const uuidSchema = z.uuid().openapi({ example: '3f6c1b1e-6d5a-4c1e-9f0a-2b7d8e5c4a10' });

export const timestampSchema = z.string().openapi({ format: 'date-time' });

/**
 * A boolean arriving as a query-string value.
 *
 * **Never use `z.coerce.boolean()` for this.** That is literally `Boolean(value)`,
 * and every non-empty string is truthy — so `?published=false` parses as `true`
 * and a "show me the drafts" filter silently returns the opposite. `z.stringbool()`
 * reads the text: 'true'/'false', '1'/'0', 'yes'/'no'.
 *
 * (`z.coerce.number()` has no such problem — `Number('20')` is 20 — so the
 * pagination params are fine as they are.)
 */
export const booleanQueryParam = () => z.stringbool();

/** Shared list query params. Every list endpoint accepts these. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1).openapi({ description: '1-based page number' }),
  pageSize: z.coerce
    .number()
    .int()
    .min(1)
    .max(100)
    .default(20)
    .openapi({ description: 'Items per page (max 100)' }),
  search: z.string().trim().min(1).optional().openapi({ description: 'Free-text search' }),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export const paginationMetaSchema = z.object({
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int(),
  totalPages: z.number().int(),
});

/** Wraps an item schema in the standard `{ data, meta }` list envelope. */
export function paginatedResponse<T extends z.ZodType>(item: T) {
  return z.object({
    data: z.array(item),
    meta: paginationMetaSchema,
  });
}

export const errorResponseSchema = z
  .object({
    error: z.string(),
    details: z.unknown().optional(),
  })
  .openapi('ErrorResponse');

export const idParamSchema = z.object({ id: uuidSchema });

/**
 * Shapes for the rows PostgREST embeds via `select('*, courses(...)')`.
 *
 * These are declarations of what the admin list/detail routes *already* return.
 * Without them the row type stops at the foreign key, and a page can only
 * render `student_id` where it wants a name.
 *
 * Nullable throughout: an embedded relation comes back `null` if the parent row
 * was deleted, and PostgREST omits the key entirely on a select that didn't ask
 * for it — so a page must never assume it's there.
 */
export const embeddedCourseSchema = z
  .object({ id: uuidSchema, name: z.string() })
  .nullable()
  .optional();

export const embeddedProfileSchema = z
  .object({ id: uuidSchema, full_name: z.string(), email: z.string() })
  .nullable()
  .optional();

/** Audit columns present on every table. */
export const auditFields = {
  created_at: timestampSchema,
  updated_at: timestampSchema,
  created_by: z.uuid().nullable(),
  updated_by: z.uuid().nullable(),
};

/** Translates page/pageSize into a Postgrest `.range()` pair. */
export function rangeFor({ page, pageSize }: PaginationQuery): [number, number] {
  const from = (page - 1) * pageSize;
  return [from, from + pageSize - 1];
}

export function metaFor(query: PaginationQuery, total: number) {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / query.pageSize)),
  };
}
