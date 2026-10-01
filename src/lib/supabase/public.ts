import 'server-only';

import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { publicEnv } from '@/lib/env';

/**
 * Anonymous Supabase client for server code that must see the site the way a
 * stranger does: the sitemap, and page metadata.
 *
 * ## Why not the cookie-backed client
 *
 * Two reasons, both about getting the *public* answer:
 *
 * - The cookie client runs as whoever is signed in. For an admin, RLS returns
 *   draft courses too, so a course's metadata — or worse, the sitemap — could
 *   be built from something the public can't see.
 * - Reading cookies makes a route dynamic. The sitemap has no reason to be.
 *
 * It uses the anon key, so RLS still applies exactly as it does to a signed-out
 * visitor. It is not the service-role client and bypasses nothing.
 */
export function createPublicClient() {
  return createClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
