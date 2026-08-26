import { z } from '@/lib/openapi/zod';
import {
  auditFields,
  booleanQueryParam,
  paginatedResponse,
  paginationQuerySchema,
  timestampSchema,
  uuidSchema,
} from './common.schema';

export const userRoleSchema = z.enum(['admin', 'teacher', 'student']).openapi('UserRole');

export const profileSchema = z
  .object({
    id: uuidSchema,
    full_name: z.string(),
    email: z.email(),
    role: userRoleSchema,
    /**
     * Set while the account is deactivated. This mirrors the auth-level ban for
     * display and filtering — the ban is what actually blocks sign-in. See
     * migration 0020.
     */
    deactivated_at: timestampSchema.nullable(),
    ...auditFields,
  })
  .openapi('Profile');

export const meResponseSchema = z.object({ profile: profileSchema }).openapi('MeResponse');

export const listUsersQuerySchema = paginationQuerySchema
  .extend({
    role: userRoleSchema.optional().openapi({ description: 'Filter by role' }),
    /**
     * `booleanQueryParam()`, never `z.coerce.boolean()` — the latter is
     * `Boolean(value)`, so the string `"false"` parses as `true` and inverts the
     * filter. See the note in `common.schema.ts`.
     */
    deactivated: booleanQueryParam()
      .optional()
      .openapi({ description: 'Filter by deactivated state' }),
  })
  .openapi('ListUsersQuery');

export const userListResponseSchema = paginatedResponse(profileSchema).openapi('UserListResponse');

/**
 * What an admin may change about another account.
 *
 * Every field is optional and the route rejects an empty body, so a caller
 * sends only what it is actually changing — a rename must not silently restate
 * (and potentially revert) a role.
 *
 * `deactivated` is a boolean rather than a timestamp on purpose: the caller
 * expresses intent, and the route decides both what to write to
 * `deactivated_at` and how to ban the account in Supabase Auth, which is where
 * deactivation is really enforced.
 */
export const updateUserSchema = z
  .object({
    full_name: z.string().trim().min(1).max(200).optional(),
    role: userRoleSchema.optional(),
    deactivated: z.boolean().optional(),
  })
  .openapi('UpdateUserRequest');

export type Profile = z.infer<typeof profileSchema>;
export type UserRole = z.infer<typeof userRoleSchema>;
export type MeResponse = z.infer<typeof meResponseSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
export type UpdateUserRequest = z.infer<typeof updateUserSchema>;
