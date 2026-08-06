import { create } from 'zustand';
import type { UserRole } from '@/lib/auth/routes';

export type { UserRole };

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
 * Re-exported for convenience: most callers of the store also need to know
 * where a role belongs. The implementation lives in `@/lib/auth/routes` so the
 * proxy can use it without importing zustand.
 */
export { landingPathForRole } from '@/lib/auth/routes';
