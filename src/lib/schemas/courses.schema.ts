import { z } from '@/lib/openapi/zod';
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from '@/lib/slug';
import {
  auditFields,
  booleanQueryParam,
  paginatedResponse,
  paginationQuerySchema,
  uuidSchema,
} from './common.schema';

export const courseSchema = z
  .object({
    id: uuidSchema,
    category_id: uuidSchema.nullable(),
    name: z.string(),
    /**
     * The public URL segment: `/courses/{slug}`. Generated from the name by a
     * trigger and deliberately stable across renames — see migration 0021.
     */
    slug: z.string().openapi({ example: 'uvod-u-web-programiranje' }),
    description: z.string().nullable(),
    // numeric(10,2) comes back from PostgREST as a string; normalise to number.
    price: z.coerce.number(),
    thumbnail_path: z.string().nullable().openapi({
      description: 'Object path in the course-thumbnails bucket: {course_id}/{filename}',
    }),
    published: z.boolean(),
    ...auditFields,
  })
  .openapi('Course');

export const listCoursesQuerySchema = paginationQuerySchema
  .extend({
    categoryId: uuidSchema.optional().openapi({ description: 'Filter by category' }),
    published: booleanQueryParam()
      .optional()
      .openapi({ description: 'Admin-only filter; public listings are always published=true' }),
  })
  .openapi('ListCoursesQuery');

export const courseListResponseSchema =
  paginatedResponse(courseSchema).openapi('CourseListResponse');

export const courseResponseSchema = z.object({ data: courseSchema }).openapi('CourseResponse');

export const createCourseSchema = z
  .object({
    name: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    category_id: uuidSchema.nullish(),
    price: z.number().nonnegative().default(0),
    thumbnail_path: z.string().trim().optional(),
    published: z.boolean().default(false),
  })
  .openapi('CreateCourseRequest');

/**
 * `slug` is updatable but not creatable: on create the trigger derives it from
 * the name, and letting a caller set one at that point would just be a second
 * way to get it wrong.
 *
 * An empty string is accepted and *means something* — the trigger regenerates
 * the slug from the current name when it sees NULL or `''`. That is the
 * supported way to re-derive one after a rename, so the edit form can offer
 * "clear it to regenerate" simply by sending `''`.
 */
export const updateCourseSchema = createCourseSchema
  .partial()
  .extend({
    slug: z
      .string()
      .trim()
      .max(SLUG_MAX_LENGTH)
      .refine((value) => value === '' || SLUG_PATTERN.test(value), {
        error: 'Slug must be lowercase alphanumeric words separated by hyphens, or empty.',
      })
      .optional()
      .openapi({ example: 'uvod-u-web-programiranje' }),
  })
  .openapi('UpdateCourseRequest');

export type Course = z.infer<typeof courseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateCourseRequest = z.infer<typeof createCourseSchema>;
export type UpdateCourseRequest = z.infer<typeof updateCourseSchema>;
