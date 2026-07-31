import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';

export const courseSchema = z
  .object({
    id: uuidSchema,
    category_id: uuidSchema.nullable(),
    name: z.string(),
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
    published: z.coerce
      .boolean()
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

export const updateCourseSchema = createCourseSchema.partial().openapi('UpdateCourseRequest');

export type Course = z.infer<typeof courseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateCourseRequest = z.infer<typeof createCourseSchema>;
export type UpdateCourseRequest = z.infer<typeof updateCourseSchema>;
