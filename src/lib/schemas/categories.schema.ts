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

/**
 * A category plus how many courses use it.
 *
 * Only the *list* endpoint returns this — it's computed from a `courses(count)`
 * embed, and the create/update routes select the plain row, so keeping it a
 * separate schema stops those responses from claiming a field they don't send.
 *
 * The number is RLS-scoped, not absolute: an admin sees every course, while an
 * anonymous visitor only counts published ones. That's the right answer for
 * both callers, but it does mean two viewers can legitimately disagree.
 */
export const categoryWithCountSchema = categorySchema
  .extend({
    course_count: z.number().int().openapi({ description: 'Courses visible to the caller' }),
  })
  .openapi('CategoryWithCount');

export const categoryListResponseSchema =
  paginatedResponse(categoryWithCountSchema).openapi('CategoryListResponse');

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
export type CategoryWithCount = z.infer<typeof categoryWithCountSchema>;
export type CreateCategoryRequest = z.infer<typeof createCategorySchema>;
export type UpdateCategoryRequest = z.infer<typeof updateCategorySchema>;
