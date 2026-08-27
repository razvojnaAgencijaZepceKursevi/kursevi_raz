/**
 * Blog posts, as data.
 *
 * ## Why an array and not a table
 *
 * The blog exists for indexable public content, not for a publishing workflow.
 * A handful of articles in a typed array beats a `posts` table plus an admin
 * editor plus RLS policies plus an upload path for images — and it makes
 * publishing a code review instead of a database write, which for marketing
 * copy is the right amount of friction.
 *
 * If this ever outgrows a couple of dozen posts, the next step is MDX files on
 * disk, **not** a database: both keep the "publishing is a deploy" property,
 * and MDX adds real formatting without adding a CMS.
 *
 * ## Adding a post
 *
 * Append an entry. `slug` is the URL and must be unique — `/blog/[slug]` looks
 * the post up by it and 404s when there is no match, so a typo fails visibly
 * rather than rendering an empty page.
 *
 * `body` is an array of paragraphs rather than one string, so the page can lay
 * them out without parsing anything. No HTML: these are rendered as text, and
 * keeping them plain means a post can never break the page.
 */
export type BlogPost = {
  slug: string;
  title: string;
  category: string;
  /** One or two sentences for the index card and the meta description. */
  excerpt: string;
  /** ISO date. Shown on the post and used for ordering. */
  publishedAt: string;
  body: string[];
};

/**
 * Empty until the copy is written — the machinery around it is finished.
 *
 * Left empty on purpose rather than seeded with lorem ipsum: a placeholder post
 * would be indexable, and search engines would find it before anyone
 * remembered to delete it.
 */
export const BLOG_POSTS: BlogPost[] = [];

/** One post by slug, or undefined so the page can render its 404. */
export function findBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((post) => post.slug === slug);
}
