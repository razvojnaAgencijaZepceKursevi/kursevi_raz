import 'server-only';
import { cache } from 'react';
import { createPublicClient } from '@/lib/supabase/public';

/**
 * Server-side reads of *published* courses, for the parts of a page a crawler
 * reads before any JavaScript runs: `<title>`, the meta description, share
 * previews, structured data and the sitemap.
 *
 * The course pages themselves are Client Components fetching through React
 * Query, because what they show depends on who is signed in. Their metadata
 * cannot wait for that — it has to be in the server HTML — so it is read here,
 * the way `getLegalDocument` reads the legal pages.
 *
 * Every query filters `published = true` explicitly. The anonymous client would
 * only see published rows anyway, but the filter states the intent where it is
 * read rather than leaving it to a policy two files away.
 */

/** The columns metadata needs. Deliberately small: nothing here is private. */
export type PublicCourseSummary = {
  slug: string;
  name: string;
  description: string | null;
  price: number;
  thumbnail_path: string | null;
  updated_at: string;
};

const SUMMARY_COLUMNS = 'slug, name, description, price, thumbnail_path, updated_at';

/**
 * One published course by slug, or `null`.
 *
 * Wrapped in `cache()` because `generateMetadata` and the page both call it
 * during one render; the second call reuses the first result.
 */
export const getPublishedCourse = cache(
  async (slug: string): Promise<PublicCourseSummary | null> => {
    const { data, error } = await createPublicClient()
      .from('courses')
      .select(SUMMARY_COLUMNS)
      .eq('slug', slug)
      .eq('published', true)
      .maybeSingle();

    // Metadata is not worth failing a page over: on an error the page still
    // renders (it fetches for itself) and only loses its description.
    if (error) {
      console.error('[seo] Failed to read course for metadata', error.message);
      return null;
    }
    return data;
  },
);

/** Every published course, for the sitemap. */
export async function listPublishedCourses(): Promise<
  Pick<PublicCourseSummary, 'slug' | 'updated_at'>[]
> {
  const { data, error } = await createPublicClient()
    .from('courses')
    .select('slug, updated_at')
    .eq('published', true)
    .order('updated_at', { ascending: false });

  if (error) {
    console.error('[seo] Failed to list courses for the sitemap', error.message);
    return [];
  }
  return data;
}
