import 'server-only';
import { createClient } from '@/lib/supabase/server';
import type { LegalDocument, LegalSlug } from '@/lib/schemas/legal.schema';

/**
 * Reads one legal document during a server render.
 *
 * ## Why not the React Query hook
 *
 * The public terms and privacy pages were Client Components fetching through
 * `useLegalDocument`, which meant the document arrived *after* hydration — so
 * the server sent a page with no text in it. For a legal document that is
 * wrong twice over: a crawler sees an empty page, and anyone with JavaScript
 * blocked or still loading is shown a shell where the agreement should be.
 *
 * Read on the server instead, so the text is in the initial HTML. Same reason
 * the blog is a Server Component.
 *
 * The hook is still the right tool for the admin editor, which is interactive
 * and needs the cache — this exists alongside it, not instead of it.
 *
 * ## The direct query
 *
 * `legal_documents` grants SELECT to everyone (`legal_documents_select_all`, in
 * migration 0030), so the caller's own client is enough and RLS remains the
 * access control. It lives in `lib/` rather than inline in the page because a
 * component never talks to Supabase directly — the page calls this.
 *
 * `server-only` makes importing it from a Client Component a build error rather
 * than a confusing runtime failure.
 */
export async function getLegalDocument(slug: LegalSlug): Promise<LegalDocument | null> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('legal_documents')
    .select('slug, title, content, updated_at')
    .eq('slug', slug)
    .maybeSingle();

  // A missing row is not an error worth a 500 — both are seeded by 0030, so
  // this only happens if one is deleted, and the page can say so.
  if (error || !data) return null;

  return data as LegalDocument;
}
