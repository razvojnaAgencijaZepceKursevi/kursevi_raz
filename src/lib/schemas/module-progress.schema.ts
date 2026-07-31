import { z } from '@/lib/openapi/zod';
import { auditFields, uuidSchema } from './common.schema';

export const moduleProgressSchema = z
  .object({
    id: uuidSchema,
    module_id: uuidSchema,
    student_id: uuidSchema,
    quiz_done: z.boolean(),
    task_done: z.boolean(),
    completed: z.boolean().openapi({
      description: 'Server-computed by a database trigger; never accepted from the client',
    }),
    ...auditFields,
  })
  .openapi('ModuleProgress');

export const courseProgressSchema = z
  .object({
    course_id: uuidSchema,
    module_count: z.number().int(),
    completed_count: z.number().int(),
    course_completed: z.boolean().openapi({
      description: 'True when every module in the course is completed',
    }),
    modules: z.array(
      z.object({
        module_id: uuidSchema,
        title: z.string(),
        order: z.number().int(),
        quiz_done: z.boolean(),
        task_done: z.boolean(),
        completed: z.boolean(),
      }),
    ),
  })
  .openapi('CourseProgress');

export const courseProgressResponseSchema = z
  .object({ data: courseProgressSchema })
  .openapi('CourseProgressResponse');

export type ModuleProgress = z.infer<typeof moduleProgressSchema>;
export type CourseProgress = z.infer<typeof courseProgressSchema>;
