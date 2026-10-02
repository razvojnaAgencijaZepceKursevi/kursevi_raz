import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';
import { INVALID_YOUTUBE_MESSAGE, isValidYouTubeUrl } from '@/lib/youtube';

/**
 * A module's video link — YouTube only, checked by the same parser the player
 * uses, so nothing can be stored that the module page would refuse to embed.
 */
const youtubeUrlSchema = z
  .string()
  .trim()
  .refine(isValidYouTubeUrl, { error: INVALID_YOUTUBE_MESSAGE })
  .openapi({
    description:
      'A YouTube link: youtube.com, www./m.youtube.com, youtu.be or youtube-nocookie.com, with an 11-character video id.',
    example: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  });

export const moduleFileSchema = z
  .object({
    id: uuidSchema,
    module_id: uuidSchema,
    file_path: z.string().openapi({
      description: 'Object path in the module-files bucket: {course_id}/{module_id}/{filename}',
    }),
    file_name: z.string().nullable(),
    ...auditFields,
  })
  .openapi('ModuleFile');

export const moduleSchema = z
  .object({
    id: uuidSchema,
    course_id: uuidSchema,
    title: z.string(),
    description: z.string().nullable(),
    video_url: z.string().nullable(),
    // `order` is a reserved SQL word; quoted in the migrations, plain here.
    order: z.number().int().openapi({ description: 'Sequence position within the course' }),
    ...auditFields,
  })
  .openapi('Module');

export const moduleWithFilesSchema = moduleSchema
  .extend({
    module_files: z.array(moduleFileSchema).default([]),
  })
  .openapi('ModuleWithFiles');

/**
 * The public teaser projection of a module.
 *
 * Deliberately three fields. `modules` is readable only by admins and students
 * with an approved purchase, so a visitor deciding whether to buy would
 * otherwise see nothing at all. This shape is the exact, reviewable answer to
 * "what may an unauthenticated visitor learn about a course's contents" —
 * enough to judge the syllabus, nothing that substitutes for buying it.
 *
 * Never add `description`, `video_url` or `module_files` here. Those are the
 * course content; this is the table of contents.
 */
export const moduleOutlineSchema = z
  .object({
    id: uuidSchema,
    title: z.string(),
    order: z.number().int(),
  })
  .openapi('ModuleOutline');

export const courseOutlineResponseSchema = z
  .object({ data: z.array(moduleOutlineSchema) })
  .openapi('CourseOutlineResponse');

export const listModulesQuerySchema = paginationQuerySchema.openapi('ListModulesQuery');

export const moduleListResponseSchema =
  paginatedResponse(moduleWithFilesSchema).openapi('ModuleListResponse');

export const moduleResponseSchema = z.object({ data: moduleSchema }).openapi('ModuleResponse');

export const createModuleSchema = z
  .object({
    course_id: uuidSchema,
    title: z.string().trim().min(1).max(200),
    description: z.string().trim().max(5000).optional(),
    video_url: youtubeUrlSchema.optional(),
    order: z.number().int().min(0),
  })
  .openapi('CreateModuleRequest');

/**
 * `video_url: null` removes the video. Omitting it leaves it as it is — so
 * without `null` there was no way to clear one, which matters now that links
 * from before the YouTube rule are stored and can only be replaced or removed.
 */
export const updateModuleSchema = createModuleSchema
  .omit({ course_id: true })
  .partial()
  .extend({ video_url: youtubeUrlSchema.nullable().optional() })
  .openapi('UpdateModuleRequest');

export const createModuleFileSchema = z
  .object({
    file_path: z.string().trim().min(1),
    file_name: z.string().trim().min(1).optional(),
  })
  .openapi('CreateModuleFileRequest');

export const moduleFileResponseSchema = z
  .object({ data: moduleFileSchema })
  .openapi('ModuleFileResponse');

export type Module = z.infer<typeof moduleSchema>;
export type ModuleWithFiles = z.infer<typeof moduleWithFilesSchema>;
export type ModuleOutline = z.infer<typeof moduleOutlineSchema>;
export type ModuleFile = z.infer<typeof moduleFileSchema>;
export type CreateModuleRequest = z.infer<typeof createModuleSchema>;
export type UpdateModuleRequest = z.infer<typeof updateModuleSchema>;
export type CreateModuleFileRequest = z.infer<typeof createModuleFileSchema>;
