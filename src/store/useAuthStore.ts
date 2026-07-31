import { create } from 'zustand';

export type UserRole = 'admin' | 'student';

export type AuthProfile = {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
};

type AuthState = {
  /** Populated from `/api/me`; null when signed out. */
  profile: AuthProfile | null;
  /** True until the first auth state resolution completes. */
  loading: boolean;
  setProfile: (profile: AuthProfile | null) => void;
  setLoading: (loading: boolean) => void;
  clear: () => void;
};

/**
 * Session/role state only. Server data lives in React Query's cache — this
 * store exists so role-based UI branching doesn't refetch `/api/me` everywhere.
 */
export const useAuthStore = create<AuthState>((set) => ({
  profile: null,
  loading: true,
  setProfile: (profile) => set({ profile, loading: false }),
  setLoading: (loading) => set({ loading }),
  clear: () => set({ profile: null, loading: false }),
}));

export const useIsAdmin = () => useAuthStore((s) => s.profile?.role === 'admin');
export const useIsAuthenticated = () => useAuthStore((s) => s.profile !== null);

/**
 * Landing route for a role — shared by the proxy, login page and callback.
 *
 * Admins land on /dashboard rather than /admin for now: the auth spec names
 * /admin as the admin landing page, but also states the sample /dashboard is
 * the ONLY page to build inside the protected groups, so /admin does not exist
 * yet and would 404 on login. Change the admin branch to '/admin' once that
 * page is built — nothing else needs to change.
 */
export function landingPathForRole(role: UserRole | undefined | null): string {
  return role === 'admin' ? '/dashboard' : '/dashboard';
}
