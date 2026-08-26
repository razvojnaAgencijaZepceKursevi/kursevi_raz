import 'server-only';

import { redirect } from 'next/navigation';
import { getAuthContext } from '@/lib/auth/guards';
import { createClient } from '@/lib/supabase/server';

/**
 * The guard every page under `/courses/[slug]/modules/…` has to run.
 *
 * ## Why these pages guard themselves at all
 *
 * They sit in `(marketing)` because their parent — the course page — is
 * genuinely public, but `src/proxy.ts` gates on whole URL prefixes and cannot
 * express "everything under `/courses/:slug/modules` but not `/courses/:slug`".
 *
 * It started as one page repeating the check. At three (module, quiz, task) that
 * is three chances to forget it, so it lives here — the original note in the
 * module page said to extract it once the subtree grew, and it has.
 *
 * A layout would be the other option, but a layout cannot hand the resolved
 * course down to the page, and every one of these pages needs it. A function
 * returns both the decision and the data.
 *
 * ## What it checks, and what it doesn't
 *
 * Signed in, and either an admin or an approved purchase. **Not** the sequential
 * unlock — that needs the whole course's progress, which the client components
 * already fetch, so it is applied there rather than paying for the query twice.
 *
 * Either way the backend enforces it independently: `modules` RLS and the module
 * endpoints require the purchase regardless. This decides what is *shown*, not
 * what is *reachable*.
 */
export type ModulePageAccess =
  | { ok: true; course: { id: string; name: string; slug: string } }
  | { ok: false; reason: 'course-not-found' | 'no-access' };

export async function checkModulePageAccess(
  slug: string,
  /** Where to send an unauthenticated visitor back to after signing in. */
  redirectTo: string,
): Promise<ModulePageAccess> {
  const auth = await getAuthContext();
  if (!auth) redirect(`/login?redirectTo=${encodeURIComponent(redirectTo)}`);

  const supabase = await createClient();

  const { data: course } = await supabase
    .from('courses')
    .select('id, name, slug')
    .eq('slug', slug)
    .maybeSingle();

  if (!course) return { ok: false, reason: 'course-not-found' };

  // Admins preview anything. A teacher reaches their own material through the
  // admin screens, so this stays the two-case check the student flow needs.
  if (auth.profile.role === 'admin') return { ok: true, course };

  const { data: purchase } = await supabase
    .from('purchases')
    .select('id')
    .eq('course_id', course.id)
    .eq('student_id', auth.userId)
    .eq('status', 'approved')
    .maybeSingle();

  if (!purchase) return { ok: false, reason: 'no-access' };

  return { ok: true, course };
}
