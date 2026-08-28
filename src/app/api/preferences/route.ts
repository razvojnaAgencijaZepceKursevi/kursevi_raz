import { NextResponse } from 'next/server';
import { parseBody, unwrapMaybe, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import {
  DEFAULT_PREFERENCES,
  updateUserPreferencesSchema,
  type UserPreferences,
} from '@/lib/schemas/preferences.schema';

export const dynamic = 'force-dynamic';

/**
 * The caller's own preferences (migration 0029).
 *
 * Ordinary RLS, not the service role: unlike `notifications`, every column
 * here *is* the user's to set, so `user_id = auth.uid()` is the only rule
 * needed and there is nothing a policy would have to protect column-wise.
 */

/**
 * GET /api/preferences — always a complete object.
 *
 * The table is sparse, so a missing row is not an error and not an empty
 * response: it means the defaults. Merging here means no client encodes that
 * rule — a screen forced to treat a missing row as "light" would be one
 * refactor away from ignoring someone's OS setting.
 */
export const GET = withRoute(async () => {
  const { userId } = await requireUser();

  const supabase = await createClient();
  const row = unwrapMaybe(
    await supabase
      .from('user_preferences')
      .select('theme, newsletter_opt_in')
      .eq('user_id', userId)
      .maybeSingle(),
  );

  const data: UserPreferences = {
    theme: row?.theme === 'light' || row?.theme === 'dark' ? row.theme : DEFAULT_PREFERENCES.theme,
    newsletter_opt_in: row?.newsletter_opt_in ?? DEFAULT_PREFERENCES.newsletter_opt_in,
  };

  return NextResponse.json({ data });
});

/**
 * PATCH /api/preferences — send only what changed.
 *
 * Reads before writing, because an upsert writes a whole row: a request
 * carrying only `theme` would otherwise reset `newsletter_opt_in` to its column
 * default and silently unsubscribe someone. Same trap as `applyModuleProgress`.
 */
export const PATCH = withRoute(async (req) => {
  const { userId } = await requireUser();
  const body = await parseBody(req, updateUserPreferencesSchema);

  const supabase = await createClient();

  const existing = unwrapMaybe(
    await supabase
      .from('user_preferences')
      .select('theme, newsletter_opt_in')
      .eq('user_id', userId)
      .maybeSingle(),
  );

  const merged = {
    user_id: userId,
    theme: body.theme ?? existing?.theme ?? DEFAULT_PREFERENCES.theme,
    newsletter_opt_in:
      body.newsletter_opt_in ??
      existing?.newsletter_opt_in ??
      DEFAULT_PREFERENCES.newsletter_opt_in,
  };

  const saved = unwrapOne(
    await supabase
      .from('user_preferences')
      .upsert(merged, { onConflict: 'user_id' })
      .select('theme, newsletter_opt_in')
      .single(),
  );

  return NextResponse.json({ data: saved });
});
