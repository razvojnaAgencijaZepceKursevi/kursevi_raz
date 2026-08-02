'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiDelete, apiGet, apiPatch, apiPost, type Envelope } from '@/lib/api/client';
import type {
  CreateTaskFileRequest,
  CreateTaskRequest,
  Task,
  TaskFile,
  TaskWithFiles,
  UpdateTaskRequest,
} from '@/lib/schemas/tasks.schema';

/**
 * Tasks. A module has at most one task, so the only read endpoint is keyed by
 * module rather than by task id. Task files arrive attached to that payload,
 * so file mutations invalidate the task cache instead of holding one.
 */

export const taskKeys = {
  all: ['tasks'] as const,
  byModule: (moduleId: string) => [...taskKeys.all, 'module', moduleId] as const,
};

/** GET /api/modules/:moduleId/task — purchase-gated. */
export function useModuleTask(moduleId: string | undefined) {
  return useQuery({
    queryKey: taskKeys.byModule(moduleId ?? ''),
    queryFn: () => apiGet<Envelope<TaskWithFiles>>(`/api/modules/${moduleId}/task`),
    enabled: Boolean(moduleId),
    select: (response) => response.data,
  });
}

function useInvalidateTasks() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: taskKeys.all });
}

/** POST /api/admin/tasks */
export function useCreateTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (body: CreateTaskRequest) => apiPost<Envelope<Task>>('/api/admin/tasks', body),
    onSuccess: invalidate,
  });
}

/** PATCH /api/admin/tasks/:id */
export function useUpdateTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateTaskRequest }) =>
      apiPatch<Envelope<Task>>(`/api/admin/tasks/${id}`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/tasks/:id */
export function useDeleteTask() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/tasks/${id}`),
    onSuccess: invalidate,
  });
}

/** POST /api/admin/tasks/:id/files — registers an already-uploaded object. */
export function useCreateTaskFile() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: ({ taskId, body }: { taskId: string; body: CreateTaskFileRequest }) =>
      apiPost<Envelope<TaskFile>>(`/api/admin/tasks/${taskId}/files`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/task-files/:id */
export function useDeleteTaskFile() {
  const invalidate = useInvalidateTasks();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/task-files/${id}`),
    onSuccess: invalidate,
  });
}
