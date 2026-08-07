import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';

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
    video_url: z.url().optional(),
    order: z.number().int().min(0),
  })
  .openapi('CreateModuleRequest');

export const updateModuleSchema = createModuleSchema
  .omit({ course_id: true })
  .partial()
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
