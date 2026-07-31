import { z } from '@/lib/openapi/zod';
import { auditFields, uuidSchema } from './common.schema';

export const taskFileSchema = z
  .object({
    id: uuidSchema,
    task_id: uuidSchema,
    file_path: z.string().openapi({
      description: 'Object path in the task-files bucket: {course_id}/{module_id}/{filename}',
    }),
    file_name: z.string().nullable(),
    ...auditFields,
  })
  .openapi('TaskFile');

export const taskSchema = z
  .object({
    id: uuidSchema,
    module_id: uuidSchema,
    text: z.string(),
    ...auditFields,
  })
  .openapi('Task');

export const taskWithFilesSchema = taskSchema
  .extend({
    task_files: z.array(taskFileSchema).default([]),
  })
  .openapi('TaskWithFiles');

export const taskResponseSchema = z.object({ data: taskWithFilesSchema }).openapi('TaskResponse');

export const createTaskSchema = z
  .object({
    module_id: uuidSchema,
    text: z.string().trim().min(1).max(10000),
  })
  .openapi('CreateTaskRequest');

export const updateTaskSchema = createTaskSchema
  .omit({ module_id: true })
  .partial()
  .openapi('UpdateTaskRequest');

export const createTaskFileSchema = z
  .object({
    file_path: z.string().trim().min(1),
    file_name: z.string().trim().min(1).optional(),
  })
  .openapi('CreateTaskFileRequest');

export const taskFileResponseSchema = z
  .object({ data: taskFileSchema })
  .openapi('TaskFileResponse');

export type Task = z.infer<typeof taskSchema>;
export type TaskFile = z.infer<typeof taskFileSchema>;
export type CreateTaskRequest = z.infer<typeof createTaskSchema>;
export type UpdateTaskRequest = z.infer<typeof updateTaskSchema>;
export type CreateTaskFileRequest = z.infer<typeof createTaskFileSchema>;
