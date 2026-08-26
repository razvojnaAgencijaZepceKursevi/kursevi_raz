-- 0021_course_slugs.sql
--
-- Human- and search-engine-readable course URLs.
--
-- Course pages were addressed by uuid:
--   /courses/3f6c1b1e-6d5a-4c1e-9f0a-2b7d8e5c4a10
-- which is unreadable when shared, carries no keywords, and is the URL every
-- blog post would link to. `slug` replaces it:
--   /courses/uvod-u-web-programiranje
--
-- ## The slug does not follow the name
--
-- It is generated once, when the course is created, and a later rename leaves
-- it alone. That is deliberate: a slug is a permanent address, and silently
-- changing it breaks every inbound link and discards the ranking that URL had
-- earned. To change one on purpose, set it to NULL and the trigger regenerates
-- it from the current name.

-- ---------------------------------------------------------------------------
-- slugify
-- ---------------------------------------------------------------------------
--
-- Serbian Latin diacritics have to be transliterated, not stripped: dropping
-- them turns "Osnove grafičkog dizajna" into "osnove-grafi-kog-dizajna".
--
-- `đ` is handled separately because it expands to *two* characters, and
-- `translate()` maps strictly one-to-one — passing it a longer replacement
-- string silently truncates. Everything else is a clean 1:1 swap.
create or replace function public.slugify(p_text text)
returns text
language sql
immutable
set search_path = pg_temp
as $$
  select nullif(
    trim(both '-' from
      left(
        regexp_replace(
          translate(
            replace(lower(coalesce(p_text, '')), 'đ', 'dj'),
            'čćšž',
            'ccsz'
          ),
          -- Any run of non-slug characters collapses to a single hyphen, so
          -- this also handles spaces, punctuation and Cyrillic in one pass.
          '[^a-z0-9]+', '-', 'g'
        ),
        80
      )
    ),
    ''
  );
$$;

comment on function public.slugify(text) is
  'Lowercases and transliterates text into a URL slug. Returns NULL when nothing usable remains (e.g. a name written entirely in Cyrillic).';

-- ---------------------------------------------------------------------------
-- The column, backfilled before it is constrained
-- ---------------------------------------------------------------------------

alter table public.courses
  add column slug text;

-- Existing rows first: `not null` and the unique index cannot be added until
-- every row has a value. `row_number()` disambiguates two courses that slugify
-- to the same string, matching what the trigger does for new rows.
with numbered as (
  select
    id,
    coalesce(public.slugify(name), 'kurs') as base,
    row_number() over (
      partition by coalesce(public.slugify(name), 'kurs')
      order by created_at, id
    ) as rn
  from public.courses
)
update public.courses c
set slug = case when n.rn = 1 then n.base else n.base || '-' || n.rn end
from numbered n
where c.id = n.id;

create unique index courses_slug_key on public.courses (slug);

alter table public.courses
  alter column slug set not null;

comment on column public.courses.slug is
  'URL-safe identifier used by the public course page. Generated from the name on insert and intentionally NOT updated on rename — set it to NULL to regenerate.';

-- ---------------------------------------------------------------------------
-- Auto-generation
-- ---------------------------------------------------------------------------
--
-- In the database rather than the API route so that every client — the app, the
-- seed script, the API docs "try it" console, psql — produces slugs the same
-- way, and so a course can never exist without one.

create or replace function public.courses_set_slug()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  base text;
  candidate text;
  suffix int := 1;
begin
  -- An explicitly supplied slug is respected as-is; the unique index is what
  -- rejects a duplicate, surfacing as a 409 rather than being silently altered.
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;

  -- Fall back to a constant when the name yields nothing sluggable; the
  -- uniqueness loop below then turns it into kurs, kurs-2, kurs-3, …
  base := coalesce(public.slugify(new.name), 'kurs');
  candidate := base;

  while exists (
    select 1 from public.courses where slug = candidate and id is distinct from new.id
  ) loop
    suffix := suffix + 1;
    candidate := base || '-' || suffix;
  end loop;

  new.slug := candidate;
  return new;
end;
$$;

-- Fires on UPDATE too, but only does anything when the slug was cleared — that
-- is the supported way to re-derive one after a rename.
create trigger courses_set_slug
  before insert or update on public.courses
  for each row execute function public.courses_set_slug();
