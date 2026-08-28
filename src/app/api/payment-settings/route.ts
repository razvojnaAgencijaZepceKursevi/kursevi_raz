import { NextResponse } from 'next/server';
import { parseBody, unwrapOne, withRoute } from '@/lib/api/errors';
import { requireAdmin } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';
import { updatePaymentSettingsSchema } from '@/lib/schemas/payment.schema';

export const dynamic = 'force-dynamic';

const COLUMNS =
  'seller_name, address, postal_code, city, country, bank_name, account_number, swift, tax_id, payment_purpose_template, note, updated_at';

/**
 * The seller's payment details (migration 0030).
 *
 * ## GET is public, and that is deliberate
 *
 * This is the seller's public business identity — the same information printed
 * on any invoice or transfer slip. The course catalogue is public, so someone
 * deciding whether to buy may reasonably want to see who they would be paying
 * before creating an account. RLS says the same thing
 * (`payment_settings_select_all`), so this runs on the caller's own client and
 * the policy is the access control rather than this route.
 *
 * ## One row, guaranteed by the database
 *
 * `id` is a boolean primary key constrained to `true`, and 0030 seeds the row.
 * So there is no "not configured" case to handle at this layer — the row always
 * exists and its columns may be null. `isPayable()` is what decides whether
 * there is enough to show a student.
 */
export const GET = withRoute(async () => {
  const supabase = await createClient();

  const data = unwrapOne(
    await supabase.from('payment_settings').select(COLUMNS).eq('id', true).single(),
  );

  return NextResponse.json({ data });
});

/**
 * PATCH — admin only.
 *
 * `requireAdmin`, not `requireStaff`: there is one seller and it is the
 * platform's, not a course author's. A teacher editing where the money goes
 * would be a rather serious hole.
 *
 * The route re-checks the role even though the RLS policy also does, because
 * that gives the admin a sentence instead of a bare 42501 — same arrangement as
 * `owner_id` on the course edit page. The policy remains the guarantee.
 */
export const PATCH = withRoute(async (req) => {
  const { userId } = await requireAdmin();
  const body = await parseBody(req, updatePaymentSettingsSchema);

  const supabase = await createClient();

  const data = unwrapOne(
    await supabase
      .from('payment_settings')
      .update({ ...body, updated_by: userId })
      .eq('id', true)
      .select(COLUMNS)
      .single(),
  );

  return NextResponse.json({ data });
});
