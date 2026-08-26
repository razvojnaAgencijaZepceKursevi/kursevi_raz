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

/**
 * What `POST /api/modules/:id/complete` gives back.
 *
 * `certificate_issued` rides along so the screen can say "you finished the
 * course" in the same breath rather than refetching to discover it — the same
 * shape the quiz-attempt and message endpoints already use.
 */
export const completeModuleResponseSchema = z
  .object({
    data: z.object({
      module_id: uuidSchema,
      completed: z.boolean(),
      certificate_issued: z.boolean(),
    }),
  })
  .openapi('CompleteModuleResponse');

export type CompleteModuleResponse = z.infer<typeof completeModuleResponseSchema>;
export type ModuleProgress = z.infer<typeof moduleProgressSchema>;
export type CourseProgress = z.infer<typeof courseProgressSchema>;
