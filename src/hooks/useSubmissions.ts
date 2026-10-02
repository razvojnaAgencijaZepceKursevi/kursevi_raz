'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ApiRequestError,
  apiGet,
  apiPatch,
  apiPost,
  toSearchParams,
  type Envelope,
  type Paginated,
} from '@/lib/api/client';
import type { PaginationQuery } from '@/lib/schemas/common.schema';
import type {
  AdminSubmission,
  CreateMessageRequest,
  CreateMessageResponse,
  CreateSubmissionRequest,
  CreateSubmissionResponse,
  UpdateMessageRequest,
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
  forTask: (taskId: string) => [...submissionKeys.all, 'task', taskId] as const,
  messages: (submissionId: string, params: MessageListParams) =>
    [...submissionKeys.all, 'messages', submissionId, params] as const,
  messagesFor: (submissionId: string) => [...submissionKeys.all, 'messages', submissionId] as const,
};

export const adminSubmissionKeys = {
  all: ['admin', 'submissions'] as const,
  lists: () => [...adminSubmissionKeys.all, 'list'] as const,
  list: (params: SubmissionListParams) => [...adminSubmissionKeys.lists(), params] as const,
  detail: (id: string) => [...adminSubmissionKeys.all, 'detail', id] as const,
};

/**
 * GET /api/admin/submissions — the review queue.
 *
 * Rows arrive with the student and the task -> module -> course chain embedded,
 * so a list row can be rendered without a lookup per submission. RLS scopes it:
 * an admin sees every submission, a teacher only those on courses they own.
 */
export function useAdminSubmissions(
  params: SubmissionListParams = {},
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    enabled,
    queryKey: adminSubmissionKeys.list(params),
    queryFn: () =>
      apiGet<Paginated<AdminSubmission>>(`/api/admin/submissions${toSearchParams(params)}`),
  });
}

/** GET /api/admin/submissions/:id — one submission, for the review screen. */
export function useAdminSubmission(id: string | undefined) {
  return useQuery({
    queryKey: adminSubmissionKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<AdminSubmission>>(`/api/admin/submissions/${id}`),
    select: (response) => response.data,
    enabled: Boolean(id),
  });
}

/**
 * GET /api/tasks/:taskId/submissions — the student's own submissions for a task.
 *
 * Newest first, so `data[0]` is the current one. A task can be resubmitted after
 * `needs_revision`, which is why this is a list rather than a single row.
 */
export function useTaskSubmissions(taskId: string | undefined) {
  return useQuery({
    queryKey: submissionKeys.forTask(taskId ?? ''),
    queryFn: () => apiGet<Paginated<TaskSubmission>>(`/api/tasks/${taskId}/submissions`),
    enabled: Boolean(taskId),
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

/**
 * PATCH /api/messages/:id — attach a file to a message after the fact.
 *
 * Only needed for the **first** message of a submission: its attachment cannot
 * be uploaded until the submission exists, because the storage path is keyed on
 * the submission id. Replies upload first and post the path with the message.
 */
export function useSetMessageAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ messageId, body }: { messageId: string; body: UpdateMessageRequest }) =>
      apiPatch<Envelope<TaskMessage>>(`/api/messages/${messageId}`, body),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: submissionKeys.all }),
  });
}

/**
 * POST /api/submissions/:id/attachments — upload a file for one thread.
 *
 * Not `useUploadFile`: that posts to `/api/admin/uploads`, which is staff-only,
 * so a student could never attach anything. This route is scoped to a single
 * submission and open to both of its participants.
 *
 * Multipart, so it does not go through `apiPost` — the browser must set
 * `Content-Type` itself to include the boundary.
 */
export function useUploadSubmissionAttachment() {
  return useMutation({
    mutationFn: async ({ submissionId, file }: { submissionId: string; file: File }) => {
      const form = new FormData();
      form.set('file', file);

      const response = await fetch(`/api/submissions/${submissionId}/attachments`, {
        method: 'POST',
        body: form,
      });
      const payload: unknown = await response.json().catch(() => null);

      if (!response.ok) {
        const error = payload as { error?: string } | null;
        throw new ApiRequestError(
          response.status,
          error?.error ?? `Upload failed with status ${response.status}`,
        );
      }

      return (payload as Envelope<{ bucket: string; path: string }>).data;
    },
  });
}
