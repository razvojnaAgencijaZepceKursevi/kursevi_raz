import { z } from '@/lib/openapi/zod';
import { SLUG_MAX_LENGTH, SLUG_PATTERN } from '@/lib/slug';
import {
  auditFields,
  booleanQueryParam,
  paginatedResponse,
  paginationQuerySchema,
  timestampSchema,
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
    /**
     * The teacher who authors this course, and the single authorization key for
     * everything beneath it (see `can_author_course()`).
     *
     * Nullable because the column is `ON DELETE SET NULL` — deleting a teacher
     * leaves their courses ownerless rather than deleting the material.
     *
     * It was always in the payload (`select('*')`); it simply was not declared
     * here, so every typed caller was blind to it. Declaring it changes nothing
     * about what the API sends.
     */
    owner_id: uuidSchema.nullable(),
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
    /**
     * Reassigns the course to another teacher. **Admin only**, and not merely
     * by convention: `guard_course_privileged_columns()` (migration 0016)
     * raises 42501 for anyone else, exactly as it does for `published`.
     *
     * Not part of `createCourseSchema` — on create the trigger requires the
     * owner to be the creator, so there is nothing to choose. Nullable because
     * `owner_id` is `ON DELETE SET NULL`: a course whose teacher was deleted is
     * ownerless, and the UI has to be able to say so and to fix it.
     */
    owner_id: uuidSchema.nullish(),
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

/**
 * What `GET /api/admin/courses/:id/stats` returns.
 *
 * Not derived from a table — it is an aggregate assembled in the route, so the
 * schema is written out rather than composed from the row schemas.
 */
export const courseStatsSchema = z
  .object({
    course_id: uuidSchema,
    module_count: z.number().int(),
    modules: z.array(z.object({ id: uuidSchema, title: z.string(), order: z.number().int() })),
    enrolled_count: z.number().int(),
    requested_count: z.number().int(),
    denied_count: z.number().int(),
    completed_count: z.number().int(),
    certificate_count: z.number().int(),
    pending_submissions: z.number().int(),
    students: z.array(
      z.object({
        student_id: uuidSchema,
        full_name: z.string().nullable(),
        email: z.string().nullable(),
        enrolled_at: timestampSchema,
        completed_modules: z.number().int(),
        module_count: z.number().int(),
        course_completed: z.boolean(),
        certificate: z
          .object({ id: uuidSchema, readable_id: z.string(), created_at: timestampSchema })
          .nullable(),
      }),
    ),
  })
  .openapi('CourseStats');

export const courseStatsResponseSchema = z
  .object({ data: courseStatsSchema })
  .openapi('CourseStatsResponse');

export type CourseStats = z.infer<typeof courseStatsSchema>;
export type Course = z.infer<typeof courseSchema>;
export type ListCoursesQuery = z.infer<typeof listCoursesQuerySchema>;
export type CreateCourseRequest = z.infer<typeof createCourseSchema>;
export type UpdateCourseRequest = z.infer<typeof updateCourseSchema>;
