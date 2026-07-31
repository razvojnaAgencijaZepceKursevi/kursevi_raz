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
