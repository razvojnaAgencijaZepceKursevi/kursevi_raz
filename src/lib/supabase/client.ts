import { createBrowserClient } from '@supabase/ssr';
import type { Database } from '@/types/database.types';
import { publicEnv } from '@/lib/env';

/**
 * Browser Supabase client. Safe to import in client components — it only ever
 * carries the anon key and every read it performs is subject to RLS.
 */
export function createClient() {
  return createBrowserClient<Database>(publicEnv.supabaseUrl, publicEnv.supabaseAnonKey);
}
