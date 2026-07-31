import { z } from '@/lib/openapi/zod';

export const uuidSchema = z.uuid().openapi({ example: '3f6c1b1e-6d5a-4c1e-9f0a-2b7d8e5c4a10' });

export const timestampSchema = z.string().openapi({ format: 'date-time' });

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
