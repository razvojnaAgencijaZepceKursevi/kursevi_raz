import { z } from '@/lib/openapi/zod';
import { auditFields, paginatedResponse, paginationQuerySchema, uuidSchema } from './common.schema';

export const userRoleSchema = z.enum(['admin', 'student']).openapi('UserRole');

export const profileSchema = z
  .object({
    id: uuidSchema,
    full_name: z.string(),
    email: z.email(),
    role: userRoleSchema,
    ...auditFields,
  })
  .openapi('Profile');

export const meResponseSchema = z.object({ profile: profileSchema }).openapi('MeResponse');

export const listUsersQuerySchema = paginationQuerySchema
  .extend({
    role: userRoleSchema.optional().openapi({ description: 'Filter by role' }),
  })
  .openapi('ListUsersQuery');

export const userListResponseSchema = paginatedResponse(profileSchema).openapi('UserListResponse');

/**
 * Role is the only mutable field admins change here. Everything else about a
 * user is owned by the user themselves.
 */
export const updateUserSchema = z
  .object({
    role: userRoleSchema,
  })
  .openapi('UpdateUserRequest');

export type Profile = z.infer<typeof profileSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
