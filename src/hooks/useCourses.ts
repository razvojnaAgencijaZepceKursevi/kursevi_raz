'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  toSearchParams,
  type Envelope,
  type Paginated,
} from '@/lib/api/client';
import type {
  Course,
  CourseStats,
  CreateCourseRequest,
  ListCoursesQuery,
  UpdateCourseRequest,
} from '@/lib/schemas/courses.schema';
import type { ModuleOutline } from '@/lib/schemas/modules.schema';

/**
 * Courses. The reference example for the hooks layer — other resources should
 * follow this shape.
 *
 * Types are imported from the endpoint's zod schema rather than redeclared, so
 * the schema stays the one source of truth for validation, the OpenAPI doc and
 * these hooks alike.
 *
 * Public and admin endpoints are kept in separate key namespaces because they
 * are genuinely different resources: `/api/courses` is published-only, while
 * `/api/admin/courses` includes drafts. Caching them together would let a
 * draft leak into a public listing already in the cache.
 */

/** Every param is optional here; the server applies the schema's defaults. */
export type CourseListParams = Partial<ListCoursesQuery>;

export const courseKeys = {
  all: ['courses'] as const,
  lists: () => [...courseKeys.all, 'list'] as const,
  list: (params: CourseListParams) => [...courseKeys.lists(), params] as const,
  details: () => [...courseKeys.all, 'detail'] as const,
  detail: (courseId: string) => [...courseKeys.details(), courseId] as const,
  outline: (courseId: string) => [...courseKeys.all, 'outline', courseId] as const,
};

export const adminCourseKeys = {
  all: ['admin', 'courses'] as const,
  lists: () => [...adminCourseKeys.all, 'list'] as const,
  list: (params: CourseListParams) => [...adminCourseKeys.lists(), params] as const,
  details: () => [...adminCourseKeys.all, 'detail'] as const,
  detail: (id: string) => [...adminCourseKeys.details(), id] as const,
};

/* -------------------------------------------------------------------------- */
/* Public                                                                      */
/* -------------------------------------------------------------------------- */

/** GET /api/courses — published catalogue. */
export function useCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: courseKeys.list(params),
    queryFn: () => apiGet<Paginated<Course>>(`/api/courses${toSearchParams(params)}`),
  });
}

/** GET /api/courses/:courseId — published detail. Idle until an id is known. */
export function useCourse(courseId: string | undefined) {
  return useQuery({
    queryKey: courseKeys.detail(courseId ?? ''),
    queryFn: () => apiGet<Envelope<Course>>(`/api/courses/${courseId}`),
    enabled: Boolean(courseId),
    select: (response) => response.data,
  });
}

/**
 * GET /api/courses/:courseId/outline — module titles, no purchase required.
 *
 * The teaser syllabus for the course page: `id`, `title` and `order` only.
 * Anyone can call it, including signed-out visitors.
 *
 * Don't reach for this when the caller has access — `useCourseProgress` returns
 * the same titles *plus* completion state, and `useCourseModules` returns the
 * actual content. This one exists for the case where those two would 403.
 */
export function useCourseOutline(
  courseId: string | undefined,
  { enabled = true }: { enabled?: boolean } = {},
) {
  return useQuery({
    queryKey: courseKeys.outline(courseId ?? ''),
    queryFn: () => apiGet<Envelope<ModuleOutline[]>>(`/api/courses/${courseId}/outline`),
    enabled: Boolean(courseId) && enabled,
    select: (response) => response.data,
  });
}

/* -------------------------------------------------------------------------- */
/* Admin                                                                       */
/* -------------------------------------------------------------------------- */

/** GET /api/admin/courses — all courses, drafts included. */
export function useAdminCourses(params: CourseListParams = {}) {
  return useQuery({
    queryKey: adminCourseKeys.list(params),
    queryFn: () => apiGet<Paginated<Course>>(`/api/admin/courses${toSearchParams(params)}`),
  });
}

/** GET /api/admin/courses/:id — any publish state. */
export function useAdminCourse(id: string | undefined) {
  return useQuery({
    queryKey: adminCourseKeys.detail(id ?? ''),
    queryFn: () => apiGet<Envelope<Course>>(`/api/admin/courses/${id}`),
    enabled: Boolean(id),
    select: (response) => response.data,
  });
}

/**
 * Admin writes can change what the public catalogue returns (publishing a
 * draft, renaming, deleting), so each mutation invalidates both namespaces.
 */
function useInvalidateCourses() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: courseKeys.all }),
      queryClient.invalidateQueries({ queryKey: adminCourseKeys.all }),
    ]);
}

/** POST /api/admin/courses */
export function useCreateCourse() {
  const invalidate = useInvalidateCourses();

  return useMutation({
    mutationFn: (body: CreateCourseRequest) =>
      apiPost<Envelope<Course>>('/api/admin/courses', body),
    onSuccess: invalidate,
  });
}

/** PATCH /api/admin/courses/:id */
export function useUpdateCourse() {
  const invalidate = useInvalidateCourses();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCourseRequest }) =>
      apiPatch<Envelope<Course>>(`/api/admin/courses/${id}`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/courses/:id — cascades to modules and their content. */
export function useDeleteCourse() {
  const invalidate = useInvalidateCourses();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/courses/${id}`),
    onSuccess: invalidate,
  });
}

/**
 * One course's progress picture: who is enrolled, how far each has got, and
 * what is waiting on a decision.
 *
 * Staff only. `module_progress` grants staff nothing, so this cannot be
 * assembled from the client — the endpoint does it with the service role behind
 * an ownership check.
 */
export function useCourseStats(courseId: string | undefined) {
  return useQuery({
    queryKey: [...adminCourseKeys.detail(courseId ?? ''), 'stats'] as const,
    queryFn: () => apiGet<Envelope<CourseStats>>(`/api/admin/courses/${courseId}/stats`),
    enabled: Boolean(courseId),
    select: (response) => response.data,
  });
}
