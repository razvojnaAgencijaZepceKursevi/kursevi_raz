import { FEATURES } from '@/lib/features';

/**
 * Which pages honour the user's colour scheme, and which are always light.
 *
 * ## The rule
 *
 * Public pages are light, always, for everybody. The saved theme preference
 * applies only to pages behind auth. A visitor deciding whether to buy a course
 * sees one presentation of the product, not one that depends on a setting they
 * have never seen — and the preference belongs to an account, which a stranger
 * does not have.
 *
 * ## Why the list is of *themed* prefixes rather than public ones
 *
 * The default has to be light, or every new marketing page would have to
 * remember to opt in and would quietly inherit someone's dark mode until
 * somebody noticed. Listing the gated sections instead means a new public page
 * is correct by doing nothing, which is the direction that fails safely.
 *
 * The prefixes mirror `PROTECTED_PREFIXES` in `src/proxy.ts` but are
 * deliberately a *separate* list, because the two questions differ in exactly
 * one place: the module viewer, quiz and task pages live under the public
 * `/courses/{slug}` URL and are gated by `checkModulePageAccess` rather than by
 * the proxy — see §7 of `docs/PROJECT-CONTEXT.md`. The proxy cannot express
 * "under `/modules` but not the course page"; a regex here can.
 */

/** Sections that sit behind auth in their entirety. */
export const THEMED_PREFIXES = [
  '/dashboard',
  '/admin',
  '/notifications',
  '/settings',
  '/certificates',
  '/issues',
] as const;

/**
 * `/courses/{slug}/modules/…` — the module viewer and its quiz and task pages.
 * Kept as a string so the same expression can be embedded in the first-paint
 * script below; there is only one rule to keep correct.
 */
export const THEMED_PATTERN = '^/courses/[^/]+/modules(?:/|$)';

/**
 * True when the page at `pathname` follows the user's saved colour scheme.
 *
 * With `themeSwitch` off, no page does: the app is light everywhere, as if dark
 * mode had never been built. That also covers a user who chose dark before the
 * flag went off, and anyone whose OS prefers dark — MUI would otherwise follow
 * the system setting with no toggle anywhere to explain why.
 */
export function isThemedPath(pathname: string): boolean {
  if (!FEATURES.themeSwitch) return false;
  const underPrefix = THEMED_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
  return underPrefix || new RegExp(THEMED_PATTERN).test(pathname);
}

/**
 * The classes MUI puts on `<html>`.
 *
 * The theme sets `cssVariables.colorSchemeSelector: 'class'`, which makes MUI
 * emit the default scheme as `:root, .light { --mui-palette-…: … }` and the
 * other as `.dark { … }`, and `<InitColorSchemeScript attribute="class">` stamps
 * the matching class on the document element. So these names are not ours to
 * choose — they are the colour schemes' own keys.
 */
export const LIGHT_CLASS = 'light';
export const DARK_CLASS = 'dark';

/**
 * Forces the light class on `<html>` before the first paint of a public page.
 *
 * ## Why `<html>` and not a wrapper
 *
 * The first attempt at this scoped the light palette to `<body>`, on the
 * reasoning that CSS variables inherit and portals are children of body. It is
 * not enough, and measuring the generated stylesheet is what showed it:
 *
 *   - `.dark` declares **28 variables that the light scheme does not** — the 25
 *     Paper elevation overlays plus `text-icon` and the two AppBar tokens. They
 *     would have gone on inheriting their dark values, and `var(--mui-overlays-1)`
 *     is referenced by every elevated card on the catalogue page.
 *   - MUI's own components (AppBar, Avatar, FilledInput, OutlinedInput, Slider,
 *     StepButton) emit `applyStyles('dark')` branches, which compile to the
 *     selector `.dark &` — matched by the class on `<html>`, and impossible to
 *     unmatch from further down the tree.
 *
 * Setting the class MUI itself uses avoids the whole class of problem: the
 * document ends up in exactly the state a genuine light session produces, with
 * nothing to enumerate and nothing left to leak.
 */
export const colorSchemeScopeScript = `(function(){try{var p=location.pathname;var themed=${JSON.stringify(
  FEATURES.themeSwitch,
)}&&(${JSON.stringify(
  THEMED_PREFIXES,
)}.some(function(x){return p===x||p.indexOf(x+'/')===0})||new RegExp(${JSON.stringify(
  THEMED_PATTERN,
)}).test(p));if(!themed){var e=document.documentElement;e.classList.remove('${DARK_CLASS}');e.classList.add('${LIGHT_CLASS}');}}catch(e){}})();`;
