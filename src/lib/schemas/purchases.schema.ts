import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';

export const purchaseStatusSchema = z
  .enum(['requested', 'denied', 'approved'])
  .openapi('PurchaseStatus');

export const purchaseSchema = z
  .object({
    id: uuidSchema,
    student_id: uuidSchema,
    course_id: uuidSchema,
    price: z.coerce.number().openapi({ description: 'Price snapshot at request time' }),
    status: purchaseStatusSchema,
    ...auditFields,
  })
  .openapi('Purchase');

export const listPurchasesQuerySchema = paginationQuerySchema
  .extend({
    status: purchaseStatusSchema.optional(),
    courseId: uuidSchema.optional(),
    studentId: uuidSchema.optional().openapi({ description: 'Admin-only filter' }),
  })
  .openapi('ListPurchasesQuery');

export const purchaseListResponseSchema =
  paginatedResponse(purchaseSchema).openapi('PurchaseListResponse');

export const purchaseResponseSchema = z
  .object({ data: purchaseSchema })
  .openapi('PurchaseResponse');

/**
 * A student supplies only the course — price is snapshotted server-side from
 * the course record, and status is always 'requested'. Accepting either from
 * the client would let a student buy at a price they chose.
 */
export const createPurchaseSchema = z
  .object({
    course_id: uuidSchema,
  })
  .openapi('CreatePurchaseRequest');

export const updatePurchaseSchema = z
  .object({
    status: z.enum(['approved', 'denied']),
  })
  .openapi('UpdatePurchaseRequest');

export type Purchase = z.infer<typeof purchaseSchema>;
export type ListPurchasesQuery = z.infer<typeof listPurchasesQuerySchema>;
export type CreatePurchaseRequest = z.infer<typeof createPurchaseSchema>;
export type UpdatePurchaseRequest = z.infer<typeof updatePurchaseSchema>;
