import 'server-only';
import { createPublicClient } from '@/lib/supabase/public';

/**
 * Categories that currently have at least one published course, for the
 * public footer.
 *
 * Read from the database rather than listed in `siteConfig.ts`: a footer link
 * filters the catalogue by category **id**, and ids differ between the staging
 * and production databases, so no hand-written list could be right in both.
 * Adding a category in `/admin/categories` (and publishing a course in it) is
 * all it takes to appear here.
 *
 * `courses!inner` + the `published` filter keep out categories that would
 * open an empty list. Anonymous client, so drafts never count — see
 * `createPublicClient` for why.
 */
export async function listFooterCategories(limit = 6): Promise<{ id: string; name: string }[]> {
  const { data, error } = await createPublicClient()
    .from('categories')
    .select('id, name, courses!inner(id)')
    .eq('courses.published', true)
    .order('name')
    .limit(limit);

  // The footer is on every public page; a failed read must cost the column,
  // not the page.
  if (error) {
    console.error('[footer] Failed to list categories', error.message);
    return [];
  }
  return data.map(({ id, name }) => ({ id, name }));
}
