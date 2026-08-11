import 'server-only';

import { createClient } from '@/lib/supabase/server';
import { forbidden, unauthorized } from '@/lib/api/errors';
import type { Database } from '@/types/database.types';

export type Profile = Database['public']['Tables']['profiles']['Row'];

export type AuthContext = {
  userId: string;
  profile: Profile;
};

/**
 * Resolves the caller from the session cookie, or null when signed out.
 *
 * Uses `getUser()` rather than `getSession()` deliberately: `getUser()`
 * revalidates the JWT against the auth server, while `getSession()` trusts
 * whatever is in the cookie. Anything making an authorization decision must use
 * the verified identity.
 */
export async function getAuthContext(): Promise<AuthContext | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle();

  if (!profile) return null;

  return { userId: user.id, profile };
}

/** Throws 401 when signed out. */
export async function requireUser(): Promise<AuthContext> {
  const ctx = await getAuthContext();
  if (!ctx) throw unauthorized();
  return ctx;
}

/**
 * Throws 401/403 unless the caller is an admin.
 *
 * Every service-role route must call this (or `requireUser`) first — the
 * service-role client bypasses RLS entirely, so the route itself is the only
 * thing standing between a student and an admin-only write.
 */
export async function requireAdmin(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.profile.role !== 'admin') throw forbidden('Admin role required');
  return ctx;
}

/**
 * Throws 401/403 unless the caller is an admin **or** a teacher.
 *
 * This is the guard for the authoring endpoints — courses, modules, quizzes,
 * tasks, uploads and the read-only screens teachers share with admins. It
 * answers only "may you reach this endpoint at all"; *which rows* you may touch
 * is decided by RLS, using `courses.owner_id` (see migration 0017).
 *
 * That division matters: these routes use the request-scoped Supabase client,
 * so a teacher asking for someone else's course simply gets no rows back rather
 * than relying on a check here to remember to filter. Any route that switches
 * to the service-role client loses that protection and must re-check ownership
 * itself.
 *
 * Keep `requireAdmin` on anything genuinely global: users, categories, and the
 * purchase approve/deny transition.
 */
export async function requireStaff(): Promise<AuthContext> {
  const ctx = await requireUser();
  if (ctx.profile.role !== 'admin' && ctx.profile.role !== 'teacher') {
    throw forbidden('Admin or teacher role required');
  }
  return ctx;
}
