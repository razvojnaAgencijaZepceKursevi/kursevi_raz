export type UserRole = 'admin' | 'student';

/**
 * Where a user belongs after signing in.
 *
 * Lives in its own dependency-free module because four very different callers
 * need it: the proxy, the login page, the OAuth callback route and the auth
 * store. Keeping it out of `useAuthStore` means the proxy doesn't pull zustand
 * into its runtime just to answer a routing question.
 */
export function landingPathForRole(role: UserRole | undefined | null): string {
  return role === 'admin' ? '/admin' : '/dashboard';
}
