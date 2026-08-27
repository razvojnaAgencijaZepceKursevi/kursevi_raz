import { z } from '@/lib/openapi/zod';
import {
  embeddedProfileSchema,
  paginatedResponse,
  paginationQuerySchema,
  timestampSchema,
  uuidSchema,
} from './common.schema';

/**
 * Support issues — the channel between any signed-in user and the admins.
 *
 * Shaped like `task_submissions` / `task_messages` on purpose: a record with a
 * status and a thread beneath it. The difference is who may see it — the
 * reporter and admins, never a teacher, because an issue may be about a
 * teacher.
 */
export const issueStatusSchema = z.enum(['open', 'answered', 'closed']).openapi('IssueStatus');

export const issueMessageSchema = z
  .object({
    id: uuidSchema,
    issue_id: uuidSchema,
    sender_id: uuidSchema,
    body: z.string(),
    created_at: timestampSchema,
    /** Embedded so the thread can show a name without a lookup per message. */
    profiles: embeddedProfileSchema,
  })
  .openapi('IssueMessage');

export const issueSchema = z
  .object({
    id: uuidSchema,
    reporter_id: uuidSchema,
    subject: z.string(),
    status: issueStatusSchema,
    closed_at: timestampSchema.nullable(),
    closed_by: uuidSchema.nullable(),
    created_at: timestampSchema,
    updated_at: timestampSchema,
    /** Who raised it. Present on the admin list; the reporter is always self. */
    profiles: embeddedProfileSchema,
    /** Flattened from a `issue_messages(count)` embed — see the route. */
    message_count: z.number().int().optional(),
  })
  .openapi('Issue');

export const listIssuesQuerySchema = paginationQuerySchema
  .extend({
    status: issueStatusSchema.optional(),
    /** Admin-only; the non-admin list is always scoped to the caller. */
    reporterId: uuidSchema.optional(),
  })
  .openapi('ListIssuesQuery');

export const issueListResponseSchema = paginatedResponse(issueSchema).openapi('IssueListResponse');
export const issueResponseSchema = z.object({ data: issueSchema }).openapi('IssueResponse');
export const issueMessageListResponseSchema = paginatedResponse(issueMessageSchema).openapi(
  'IssueMessageListResponse',
);

/**
 * Opening an issue always carries its first message — an empty issue with a
 * subject and nothing else would be a support ticket that says nothing.
 */
export const createIssueSchema = z
  .object({
    subject: z.string().trim().min(1).max(200),
    body: z.string().trim().min(1).max(10000),
  })
  .openapi('CreateIssueRequest');

export const createIssueResponseSchema = z
  .object({ data: issueSchema.extend({ message: issueMessageSchema }) })
  .openapi('CreateIssueResponse');

/**
 * `status` is honoured only for an admin; a reporter including it is ignored,
 * exactly as on the submission thread. That is what lets one endpoint serve
 * both sides.
 */
export const createIssueMessageSchema = z
  .object({
    body: z.string().trim().min(1).max(10000),
    status: issueStatusSchema.optional().openapi({
      description: 'Admin only — sets the issue status alongside the message',
    }),
  })
  .openapi('CreateIssueMessageRequest');

export const createIssueMessageResponseSchema = z
  .object({ data: issueMessageSchema, issue_status: issueStatusSchema })
  .openapi('CreateIssueMessageResponse');

export type Issue = z.infer<typeof issueSchema>;
export type IssueStatus = z.infer<typeof issueStatusSchema>;
export type IssueMessage = z.infer<typeof issueMessageSchema>;
export type ListIssuesQuery = z.infer<typeof listIssuesQuerySchema>;
export type CreateIssueRequest = z.infer<typeof createIssueSchema>;
export type CreateIssueResponse = z.infer<typeof createIssueResponseSchema>;
export type CreateIssueMessageRequest = z.infer<typeof createIssueMessageSchema>;
export type CreateIssueMessageResponse = z.infer<typeof createIssueMessageResponseSchema>;
