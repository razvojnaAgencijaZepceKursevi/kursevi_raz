/**
 * Env access with a fail-fast check, so a missing variable surfaces as a clear
 * error at the call site instead of `undefined` reaching the Supabase SDK.
 *
 * `NEXT_PUBLIC_*` values are inlined at build time, so they must be referenced
 * as full literal property accesses — never `process.env[someVar]`.
 */
function required(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(
      `Missing environment variable ${name}. Copy .env.example to .env.local and populate it.`,
    );
  }
  return value;
}

export const publicEnv = {
  get supabaseUrl() {
    return required(process.env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL');
  },
  get supabaseAnonKey() {
    return required(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY, 'NEXT_PUBLIC_SUPABASE_ANON_KEY');
  },
  get siteUrl() {
    return process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';
  },
};

/**
 * Server-only. Reading this from a client bundle throws at module scope, which
 * is the point — it makes an accidental client import a build/runtime failure
 * rather than a silent key leak.
 */
export const serverEnv = {
  get supabaseServiceRoleKey() {
    return required(process.env.SUPABASE_SERVICE_ROLE_KEY, 'SUPABASE_SERVICE_ROLE_KEY');
  },
};
