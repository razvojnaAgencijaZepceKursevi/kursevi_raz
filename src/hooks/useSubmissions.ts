'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, toSearchParams, type Paginated } from '@/lib/api/client';
import type { PaginationQuery } from '@/lib/schemas/common.schema';
import type {
  CreateMessageRequest,
  CreateMessageResponse,
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  ListSubmissionsQuery,
  TaskMessage,
  TaskSubmission,
} from '@/lib/schemas/task-submissions.schema';
import { certificateKeys } from './useCertificates';
import { progressKeys } from './useProgress';

/**
 * Task submissions — a message thread between a student and an admin.
 *
 * Both sides post to the same endpoint; only an admin's `status` is honoured,
 * and only `approved` marks the module's task done. Since any message may be
 * the one that flips that status, every send invalidates progress and
 * certificates as well as the thread.
 */

export type SubmissionListParams = Partial<ListSubmissionsQuery>;
export type MessageListParams = Partial<PaginationQuery>;

export const submissionKeys = {
  all: ['submissions'] as const,
  messages: (submissionId: string, params: MessageListParams) =>
    [...submissionKeys.all, 'messages', submissionId, params] as const,
  messagesFor: (submissionId: string) => [...submissionKeys.all, 'messages', submissionId] as const,
};

export const adminSubmissionKeys = {
  all: ['admin', 'submissions'] as const,
  lists: () => [...adminSubmissionKeys.all, 'list'] as const,
  list: (params: SubmissionListParams) => [...adminSubmissionKeys.lists(), params] as const,
};

/** GET /api/admin/submissions — list/filter every submission. */
export function useAdminSubmissions(params: SubmissionListParams = {}) {
  return useQuery({
    queryKey: adminSubmissionKeys.list(params),
    queryFn: () =>
      apiGet<Paginated<TaskSubmission>>(`/api/admin/submissions${toSearchParams(params)}`),
  });
}

/** GET /api/submissions/:id/messages — participants only, oldest first. */
export function useSubmissionMessages(
  submissionId: string | undefined,
  params: MessageListParams = {},
) {
  return useQuery({
    queryKey: submissionKeys.messages(submissionId ?? '', params),
    queryFn: () =>
      apiGet<Paginated<TaskMessage>>(
        `/api/submissions/${submissionId}/messages${toSearchParams(params)}`,
      ),
    enabled: Boolean(submissionId),
  });
}

/**
 * POST /api/tasks/:taskId/submissions — opens a thread with a first message.
 *
 * 409s when the student already has an open submission for the task; surface
 * that as "you already have one in review" rather than a generic failure.
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: CreateSubmissionRequest }) =>
      apiPost<CreateSubmissionResponse>(`/api/tasks/${taskId}/submissions`, body),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
        queryClient.invalidateQueries({ queryKey: adminSubmissionKeys.all }),
      ]),
  });
}

/**
 * POST /api/submissions/:id/messages
 *
 * The response carries `submission_status`, `module_completed` and
 * `certificate_issued` alongside the message — read those to drive post-approval
 * UI rather than refetching to find out what happened.
 */
export function useCreateMessage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ submissionId, body }: { submissionId: string; body: CreateMessageRequest }) =>
      apiPost<CreateMessageResponse>(`/api/submissions/${submissionId}/messages`, body),
    onSuccess: (_result, variables) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: submissionKeys.messagesFor(variables.submissionId),
        }),
        queryClient.invalidateQueries({ queryKey: adminSubmissionKeys.all }),
        queryClient.invalidateQueries({ queryKey: progressKeys.all }),
        queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
      ]),
  });
}
