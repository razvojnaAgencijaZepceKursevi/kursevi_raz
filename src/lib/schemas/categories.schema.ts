import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';

export const categorySchema = z
  .object({
    id: uuidSchema,
    name: z.string(),
    ...auditFields,
  })
  .openapi('Category');

export const listCategoriesQuerySchema = paginationQuerySchema.openapi('ListCategoriesQuery');

export const categoryListResponseSchema =
  paginatedResponse(categorySchema).openapi('CategoryListResponse');

export const categoryResponseSchema = z
  .object({ data: categorySchema })
  .openapi('CategoryResponse');

export const createCategorySchema = z
  .object({
    name: z.string().trim().min(1).max(120),
  })
  .openapi('CreateCategoryRequest');

export const updateCategorySchema = createCategorySchema.partial().openapi('UpdateCategoryRequest');

export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
