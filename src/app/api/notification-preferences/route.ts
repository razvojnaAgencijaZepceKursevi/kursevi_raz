import { NextResponse } from 'next/server';
import { parseBody, unwrapMany, withRoute } from '@/lib/api/errors';
import { requireUser } from '@/lib/auth/guards';
import type { UserRole } from '@/lib/auth/routes';
import { createClient } from '@/lib/supabase/server';
import { isEmailConfigured } from '@/lib/email/client';
import { notificationTypesForRole, type NotificationType } from '@/lib/notifications/catalog';
import { updateNotificationPreferencesSchema } from '@/lib/schemas/notifications.schema';

export const dynamic = 'force-dynamic';

type StoredPreference = { type: string; email_enabled: boolean; in_app_enabled: boolean };

/**
 * Fills the gaps in a sparse preference set, for one role.
 *
 * The single place that knows "no row means both channels on". GET and PATCH
 * both return the merged matrix — PATCH so the client can replace its state
 * wholesale instead of patching it and hoping the two agree — and doing that in
 * one function is what stops the two answers drifting.
 */
function mergeWithDefaults(stored: StoredPreference[], role: UserRole) {
  const byType = new Map(stored.map((row) => [row.type, row]));

  return notificationTypesForRole(role).map((type) => {
    const row = byType.get(type);
    return {
      type,
      email_enabled: row?.email_enabled ?? true,
      in_app_enabled: row?.in_app_enabled ?? true,
    };
  });
}

/**
 * GET /api/notification-preferences — the full matrix for the caller.
 *
 * ## The table is sparse; this response is not
 *
 * `notification_preferences` holds a row only once a user has changed
 * something, so "no row" means "both channels on" (migration 0025 explains why
 * it is built that way). Merging happens here, once, so no client ever has to
 * encode that rule — a screen that had to treat a missing row as `true` would
 * be one refactor away from defaulting people to silence.
 *
 * Rows are filtered to what the caller's role can actually receive, in
 * catalogue order. That is presentation, not access control: a student is never
 * *sent* `purchase_requested`, so offering them a switch for it would be
 * offering a setting that does nothing.
 */
export const GET = withRoute(async () => {
  const { userId, profile } = await requireUser();

  const supabase = await createClient();
  const stored = unwrapMany(
    await supabase
      .from('notification_preferences')
      .select('type, email_enabled, in_app_enabled')
      .eq('user_id', userId),
  );

  return NextResponse.json({
    data: mergeWithDefaults(stored, profile.role),
    meta: { email_configured: isEmailConfigured },
  });
});

/**
 * PATCH /api/notification-preferences — change one or more switches.
 *
 * No service role here, and that is the point of the difference between this
 * table and `notifications`: a preference row *is* the user's to set, all of
 * it, so ordinary RLS policies express the rule exactly. The `with check` on
 * `user_id` is what stops one user writing another's settings.
 *
 * `upsert` on the `(user_id, type)` unique index does the create-or-update in
 * one statement — which matters, because the row usually does not exist yet:
 * the first time anyone touches a switch is the first time they get a row.
 *
 * Unmentioned channels keep their current value, so flipping one toggle sends
 * one field. Merging is done here rather than in the database because an upsert
 * writes whole rows, and sending only `email_enabled` would otherwise reset
 * `in_app_enabled` to its column default — the same trap `applyModuleProgress`
 * documents.
 */
export const PATCH = withRoute(async (req) => {
  const { userId, profile } = await requireUser();
  const body = await parseBody(req, updateNotificationPreferencesSchema);

  const allowed = new Set(notificationTypesForRole(profile.role));
  const supabase = await createClient();

  const existing = unwrapMany(
    await supabase
      .from('notification_preferences')
      .select('type, email_enabled, in_app_enabled')
      .eq('user_id', userId),
  );
  const byType = new Map(existing.map((row) => [row.type, row]));

  // Silently dropping a type the role cannot receive rather than 400-ing: the
  // request is harmless, the row would simply never be consulted, and a role
  // change mid-session should not surface as a failed save.
  const rows = body.preferences
    .filter((pref) => allowed.has(pref.type as NotificationType))
    .map((pref) => {
      const current = byType.get(pref.type as NotificationType);
      return {
        user_id: userId,
        type: pref.type as NotificationType,
        email_enabled: pref.email_enabled ?? current?.email_enabled ?? true,
        in_app_enabled: pref.in_app_enabled ?? current?.in_app_enabled ?? true,
      };
    });

  if (rows.length > 0) {
    unwrapMany(
      await supabase
        .from('notification_preferences')
        .upsert(rows, { onConflict: 'user_id,type' })
        .select('type'),
    );
  }

  const refreshed = unwrapMany(
    await supabase
      .from('notification_preferences')
      .select('type, email_enabled, in_app_enabled')
      .eq('user_id', userId),
  );

  return NextResponse.json({
    data: mergeWithDefaults(refreshed, profile.role),
    meta: { email_configured: isEmailConfigured },
  });
});
