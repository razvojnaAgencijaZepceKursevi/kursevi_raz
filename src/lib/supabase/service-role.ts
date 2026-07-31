import 'server-only';

import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/database.types';
import { publicEnv, serverEnv } from '@/lib/env';

/**
 * Service-role client — **bypasses RLS entirely**.
 *
 * Only ever import this from route handlers under `src/app/api/**`, and only
 * for the writes RLS deliberately denies students:
 *   - `module_progress` (quiz/task completion)
 *   - `certificates` (auto-issue, delivery requests)
 *   - status transitions (purchase approve/deny, submission status)
 *
 * Every caller MUST independently verify the caller's identity and role first
 * (see `requireUser` / `requireAdmin` in `src/lib/auth/guards.ts`) — this client
 * performs no authorization of its own.
 *
 * The `server-only` import above turns an accidental client-side import into a
 * build error rather than a leaked key.
 */
export function createServiceRoleClient() {
  return createSupabaseClient<Database>(publicEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
