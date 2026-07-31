import 'server-only';

import { cookies } from 'next/headers';
import { createServerClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { publicEnv } from '@/lib/env';

/**
 * Cookie-backed Supabase client for Server Components and Route Handlers.
 * Runs as the signed-in user, so RLS applies — this is the default client for
 * anything the policies already protect correctly.
 *
 * Note: `cookies()` is async as of Next.js 16, so this function must be awaited.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Called from a Server Component, where cookies are read-only.
          // Session refresh is handled in proxy.ts, so this is safe to ignore.
        }
      },
    },
  });
}
