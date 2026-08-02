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
  Category,
  CreateCategoryRequest,
  UpdateCategoryRequest,
} from '@/lib/schemas/categories.schema';
import type { PaginationQuery } from '@/lib/schemas/common.schema';
import { courseKeys, adminCourseKeys } from './useCourses';

/**
 * Categories. Reads are public (`/api/categories`); writes are admin-only.
 * Unlike courses there is no separate admin listing — one endpoint serves both,
 * so a single key namespace is correct here.
 */

export type CategoryListParams = Partial<PaginationQuery>;

export const categoryKeys = {
  all: ['categories'] as const,
  lists: () => [...categoryKeys.all, 'list'] as const,
  list: (params: CategoryListParams) => [...categoryKeys.lists(), params] as const,
};

/** GET /api/categories */
export function useCategories(params: CategoryListParams = {}) {
  return useQuery({
    queryKey: categoryKeys.list(params),
    queryFn: () => apiGet<Paginated<Category>>(`/api/categories${toSearchParams(params)}`),
  });
}

/**
 * Courses carry `category_id`, and a rename or delete changes how they render,
 * so category writes drop the course caches too.
 */
function useInvalidateCategories() {
  const queryClient = useQueryClient();

  return () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: categoryKeys.all }),
      queryClient.invalidateQueries({ queryKey: courseKeys.all }),
      queryClient.invalidateQueries({ queryKey: adminCourseKeys.all }),
    ]);
}

/** POST /api/admin/categories */
export function useCreateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: (body: CreateCategoryRequest) =>
      apiPost<Envelope<Category>>('/api/admin/categories', body),
    onSuccess: invalidate,
  });
}

/** PATCH /api/admin/categories/:id */
export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: UpdateCategoryRequest }) =>
      apiPatch<Envelope<Category>>(`/api/admin/categories/${id}`, body),
    onSuccess: invalidate,
  });
}

/** DELETE /api/admin/categories/:id */
export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/api/admin/categories/${id}`),
    onSuccess: invalidate,
  });
}
