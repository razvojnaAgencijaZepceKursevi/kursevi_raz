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
import type { PaginationQuery } from '@/lib/schemas/common.schema';
import type {
  CreateModuleFileRequest,
  CreateModuleRequest,
  Module,
  ModuleFile,
  ModuleWithFiles,
  UpdateModuleRequest,
} from '@/lib/schemas/modules.schema';

/**
 * Modules.
 *
 * There is only one read endpoint — `/api/courses/:courseId/modules` — and it
 * is purchase-gated, so an unpurchased course yields a 403 rather than an empty
 * list. Distinguish the two in the UI via `ApiRequestError.status`.
 *
 * Modules are always fetched with their files attached (`module_files(*)`), so
 * file mutations invalidate the module list rather than owning a cache of
 * their own.
 */

export type ModuleListParams = Partial<PaginationQuery>;

export const moduleKeys = {
  all: ['modules'] as const,
  lists: () => [...moduleKeys.all, 'list'] as const,
  list: (courseId: string, params: ModuleListParams) =>
    [...moduleKeys.lists(), courseId, params] as const,
};

/** GET /api/courses/:courseId/modules — requires an approved purchase. */
export function useCourseModules(courseId: string | undefined, params: ModuleListParams = {}) {
  return useQuery({
    queryKey: moduleKeys.list(courseId ?? '', params),
    queryFn: () =>
      apiGet<Paginated<ModuleWithFiles>>(
        `/api/courses/${courseId}/modules${toSearchParams(params)}`,
      ),
    enabled: Boolean(courseId),
  });
}

function useInvalidateModules() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: moduleKeys.all });
}

/** POST /api/admin/modules */
export function useCreateModule() {
  const invalidate = useInvalidateModules();

  return useMutation({
    mutationFn: (body: CreateModuleRequest) =>
      apiPost<Envelope<Module>>('/api/admin/modules', body),
    onSuccess: invalidate,
  });
}

/** PATCH /api/admin/modules/:id */
export function useUpdateModule() {
  const invalidate = useInvalidateModules();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateModuleRequest }) =>
      apiPatch<Envelope<Module>>(`/api/admin/modules/${id}`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/modules/:id — cascades to the module's content. */
export function useDeleteModule() {
  const invalidate = useInvalidateModules();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/modules/${id}`),
    onSuccess: invalidate,
  });
}

/**
 * POST /api/admin/modules/:id/files — records an already-uploaded object.
 *
 * The binary goes straight to the module-files bucket via the Supabase storage
 * client; this only registers the resulting path.
 */
export function useCreateModuleFile() {
  const invalidate = useInvalidateModules();

  return useMutation({
    mutationFn: ({ moduleId, body }: { moduleId: string; body: CreateModuleFileRequest }) =>
      apiPost<Envelope<ModuleFile>>(`/api/admin/modules/${moduleId}/files`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/module-files/:id */
export function useDeleteModuleFile() {
  const invalidate = useInvalidateModules();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/module-files/${id}`),
    onSuccess: invalidate,
  });
}
