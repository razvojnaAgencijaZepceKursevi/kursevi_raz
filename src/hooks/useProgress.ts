'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPost, type Envelope } from '@/lib/api/client';
import type { CompleteModuleResponse, CourseProgress } from '@/lib/schemas/module-progress.schema';
import { certificateKeys } from './useCertificates';

/**
 * Course progress.
 *
 * `module_progress` has three writers now: the quiz-attempt route, the
 * submission-approval route, and `useCompleteModule` below — which exists
 * because a module with neither a quiz nor a task had no writer at all and
 * could never be finished.
 */

export const progressKeys = {
  all: ['progress'] as const,
  course: (courseId: string) => [...progressKeys.all, 'course', courseId] as const,
};

/**
 * GET /api/courses/:courseId/progress
 *
 * Requires a session, and returns an empty module list without an approved
 * purchase (RLS hides them). Pass `enabled: false` on pages that render for
 * signed-out or non-purchasing visitors so it doesn't fire a doomed request.
 */
export function useCourseProgress(
  courseId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: progressKeys.course(courseId ?? ''),
    queryFn: () => apiGet<Envelope<CourseProgress>>(`/api/courses/${courseId}/progress`),
    enabled: Boolean(courseId) && enabled,
    select: (response) => response.data,
  });
}

/**
 * POST /api/modules/:moduleId/complete
 *
 * Only for a module with no quiz and no task; the endpoint 409s otherwise, so
 * this can never be used to skip work that has to be done. Invalidates
 * certificates as well as progress, because finishing the last module of a
 * course issues one.
 */
export function useCompleteModule() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (moduleId: string) =>
      apiPost<CompleteModuleResponse>(`/api/modules/${moduleId}/complete`, {}),
    onSuccess: () =>
      Promise.all([
        queryClient.invalidateQueries({ queryKey: progressKeys.all }),
        queryClient.invalidateQueries({ queryKey: certificateKeys.all }),
      ]),
  });
}
