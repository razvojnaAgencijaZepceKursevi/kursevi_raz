/**
 * The shape of a URL slug, in one place.
 *
 * Both sides validate it and they must agree: the form schema (browser) and
 * `updateCourseSchema` (API). It lives in its own module rather than in
 * `courses.schema.ts` because a form schema may not import that at runtime —
 * it drags `zod-to-openapi` into the client bundle.
 *
 * Note the database does **not** sanitise a slug it is handed. The
 * `courses_set_slug` trigger only generates one when the value is NULL or
 * empty; anything else is stored verbatim. This pattern is therefore the real
 * guard against a slug like `Hello World!` producing a broken URL.
 */
export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Max length, matching what `slugify()` truncates to in migration 0021. */
export const SLUG_MAX_LENGTH = 80;

export const SLUG_MESSAGE =
  'Adresa može sadržati samo mala slova, brojeve i crtice (npr. uvod-u-web-programiranje).';
