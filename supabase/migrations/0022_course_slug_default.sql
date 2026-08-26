-- 0022_course_slug_default.sql
--
-- Makes `courses.slug` optional to *callers* without making it nullable.
--
-- 0021 added the column as `not null` with no default, which is accurate — every
-- stored row has a slug — but it makes `supabase gen types` emit
--
--     Insert: { …, slug: string }
--
-- i.e. required. Nothing should ever pass one: `courses_set_slug` derives it
-- from the name. Without a default, every insert in the app, the seed script and
-- the API routes would have to supply a value purely to satisfy the type.
--
-- The empty string is a placeholder that never survives the statement — the
-- trigger treats `''` exactly like NULL and replaces it with the real slug
-- before the row is written. It exists only so the column reads as "has a
-- default", which is what makes the generated Insert type optional.

alter table public.courses
  alter column slug set default '';

comment on column public.courses.slug is
  'URL-safe identifier used by the public course page. Generated from the name by courses_set_slug on insert and intentionally NOT updated on rename — set it to NULL or '''' to regenerate. The '''' default is a placeholder the trigger always replaces; it exists so generated Insert types treat the column as optional.';
