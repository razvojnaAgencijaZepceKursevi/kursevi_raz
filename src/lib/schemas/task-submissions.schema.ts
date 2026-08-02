import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';

export const taskSubmissionStatusSchema = z
  .enum(['pending', 'needs_revision', 'approved'])
  .openapi('TaskSubmissionStatus');

export const taskMessageSchema = z
  .object({
    id: uuidSchema,
    submission_id: uuidSchema,
    sender_id: uuidSchema,
    body: z.string(),
    attachment_path: z.string().nullable().openapi({
      description: 'Object path in task-message-attachments: {submission_id}/{filename}',
    }),
    ...auditFields,
  })
  .openapi('TaskMessage');

export const taskSubmissionSchema = z
  .object({
    id: uuidSchema,
    task_id: uuidSchema,
    student_id: uuidSchema,
    status: taskSubmissionStatusSchema,
    ...auditFields,
  })
  .openapi('TaskSubmission');

export const listSubmissionsQuerySchema = paginationQuerySchema
  .extend({
    status: taskSubmissionStatusSchema.optional(),
    courseId: uuidSchema.optional(),
    studentId: uuidSchema.optional(),
  })
  .openapi('ListSubmissionsQuery');

export const submissionListResponseSchema =
  paginatedResponse(taskSubmissionSchema).openapi('SubmissionListResponse');

export const submissionResponseSchema = z
  .object({ data: taskSubmissionSchema })
  .openapi('SubmissionResponse');

export const messageListResponseSchema =
  paginatedResponse(taskMessageSchema).openapi('MessageListResponse');

export const createSubmissionSchema = z
  .object({
    body: z.string().trim().min(1).max(10000).openapi({ description: 'First message body' }),
    attachment_path: z.string().trim().optional(),
  })
  .openapi('CreateSubmissionRequest');

/**
 * `status` is honoured only when the sender is an admin — a student including
 * it is ignored rather than rejected, so the same endpoint serves both sides
 * of the thread.
 */
export const createMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(10000),
    attachment_path: z.string().trim().optional(),
    status: taskSubmissionStatusSchema.optional().openapi({
      description: 'Admin only — sets the submission status alongside the message',
    }),
  })
  .openapi('CreateMessageRequest');

export const createSubmissionResponseSchema = z
  .object({
    data: taskSubmissionSchema.extend({ message: taskMessageSchema }),
  })
  .openapi('CreateSubmissionResponse');

export const createMessageResponseSchema = z
  .object({
    data: taskMessageSchema,
    submission_status: taskSubmissionStatusSchema,
    module_completed: z.boolean(),
    certificate_issued: z.boolean(),
  })
  .openapi('CreateMessageResponse');

export type TaskSubmission = z.infer<typeof taskSubmissionSchema>;
export type TaskSubmissionStatus = z.infer<typeof taskSubmissionStatusSchema>;
export type TaskMessage = z.infer<typeof taskMessageSchema>;
export type CreateSubmissionResponse = z.infer<typeof createSubmissionResponseSchema>;
export type CreateMessageResponse = z.infer<typeof createMessageResponseSchema>;
export type CreateSubmissionRequest = z.infer<typeof createSubmissionSchema>;
export type CreateMessageRequest = z.infer<typeof createMessageSchema>;
export type ListSubmissionsQuery = z.infer<typeof listSubmissionsQuerySchema>;
