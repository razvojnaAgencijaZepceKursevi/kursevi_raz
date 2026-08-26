'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost, type Envelope } from '@/lib/api/client';
import type {
  AdminQuiz,
  CreateQuizRequest,
  QuizAttemptRequest,
  QuizAttemptResult,
  QuizForTaking,
  UpdateQuizRequest,
} from '@/lib/schemas/quizzes.schema';
import { certificateKeys } from './useCertificates';
import { progressKeys } from './useProgress';

/**
 * Quizzes.
 *
 * Student and admin shapes are different resources, not two views of one: the
 * student payload has no correctness field at all (the answer key lives in a
 * separate admin-only table), so they never share a cache entry.
 */

export const quizKeys = {
  all: ['quizzes'] as const,
  byModule: (moduleId: string) => [...quizKeys.all, 'module', moduleId] as const,
};

export const adminQuizKeys = {
  all: ['admin', 'quizzes'] as const,
  detail: (id: string) => [...adminQuizKeys.all, 'detail', id] as const,
  byModule: (moduleId: string) => [...adminQuizKeys.all, 'module', moduleId] as const,
};

/** GET /api/modules/:moduleId/quiz — no answer key in this payload. */
export function useModuleQuiz(moduleId: string | undefined) {
  return useQuery({
    queryKey: quizKeys.byModule(moduleId ?? ''),
    queryFn: () => apiGet<Envelope<QuizForTaking>>(`/api/modules/${moduleId}/quiz`),
    enabled: Boolean(moduleId),
    select: (response) => response.data,
  });
}

/**
 * POST /api/modules/:moduleId/quiz/attempt — scored server-side.
 *
 * A pass can complete the module and, on the final module, issue a certificate,
 * so both caches are dropped. `courseId` is optional and only used to target
 * the progress invalidation; without it every course's progress is refetched.
 */
export function useSubmitQuizAttempt() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      moduleId,
      body,
    }: {
      moduleId: string;
      body: QuizAttemptRequest;
      courseId?: string;
    }) => apiPost<Envelope<QuizAttemptResult>>(`/api/modules/${moduleId}/quiz/attempt`, body),
    onSuccess: (_result, variables) =>
      Promise.all([
        queryClient.invalidateQueries({
          queryKey: variables.courseId ? progressKeys.course(variables.courseId) : progressKeys.all,
        }),
        queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
      ]),
  });
}

/**
 * GET /api/admin/modules/:moduleId/quiz — the authoring shape, keyed by module.
 *
 * What the quiz editor uses: it is reached from a module, so a module id is all
 * it has, and it needs the answer key that the student endpoint deliberately
 * omits. **404 means "this module has no quiz yet"**, which the page treats as
 * the create case — 4xx is not retried, so that costs one request.
 */
export function useAdminModuleQuiz(moduleId: string | undefined) {
  return useQuery({
    queryKey: adminQuizKeys.byModule(moduleId ?? ''),
    queryFn: () => apiGet<Envelope<AdminQuiz>>(`/api/admin/modules/${moduleId}/quiz`),
    enabled: Boolean(moduleId),
    select: (response) => response.data,
  });
}

/** GET /api/admin/quizzes/:id — includes the answer key. */
export function useAdminQuiz(id: string | undefined) {
  return useQuery({
    queryKey: adminQuizKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<AdminQuiz>>(`/api/admin/quizzes/${id}`),
    enabled: Boolean(id),
    select: (response) => response.data,
  });
}

function useInvalidateQuizzes() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: quizKeys.all }),
      queryClient.invalidateQueries({ queryKey: adminQuizKeys.all }),
    ]);
}

/**
 * POST /api/admin/quizzes
 *
 * Returns only `{ data: { id } }` — not the full quiz the OpenAPI doc
 * advertises. Refetch via `useAdminQuiz(id)` if you need the saved shape back.
 */
export function useCreateQuiz() {
  const invalidate = useInvalidateQuizzes();

  return useMutation({
    mutationFn: (body: CreateQuizRequest) =>
      apiPost<Envelope<{ id: string }>>('/api/admin/quizzes', body),
    onSuccess: invalidate,
  });
}

/**
 * PATCH /api/admin/quizzes/:id — supplying `questions` replaces the set
 * wholesale. Also returns only `{ data: { id } }`.
 */
export function useUpdateQuiz() {
  const invalidate = useInvalidateQuizzes();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateQuizRequest }) =>
      apiPatch<Envelope<{ id: string }>>(`/api/admin/quizzes/${id}`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/quizzes/:id */
export function useDeleteQuiz() {
  const invalidate = useInvalidateQuizzes();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/quizzes/${id}`),
    onSuccess: invalidate,
  });
}
