'use client';

import { useQuery } from '@tanstack/react-query';
import { apiGet, type Envelope } from '@/lib/api/client';
import type { CourseProgress } from '@/lib/schemas/module-progress.schema';

/**
 * Course progress. Read-only by design — `module_progress` is written only by
 * the quiz-attempt and submission-approval routes, so there is deliberately no
 * mutation hook here. Those two hooks invalidate `progressKeys` instead.
 */

export const progressKeys = {
  all: ['progress'] as const,
  course: (courseId: string) => [...progressKeys.all, 'course', courseId] as const,
};

/** GET /api/courses/:courseId/progress */
export function useCourseProgress(courseId: string | undefined) {
  return useQuery({
    queryKey: progressKeys.course(courseId ?? ''),
    queryFn: () => apiGet<Envelope<CourseProgress>>(`/api/courses/${courseId}/progress`),
    enabled: Boolean(courseId),
    select: (response) => response.data,
  });
}
