import { FEATURES } from '@/lib/features';

/**
 * Which pages honour the user's colour scheme, and which are always light.
 *
 * ## The rule
 *
 * A signed-in user gets their saved scheme on every page, public ones included.
 * A signed-out visitor gets light on public pages, always. The preference
 * belongs to an account, so it follows the account: a student reading a course
 * page between two modules should not be flipped to light and back. A stranger
 * deciding whether to buy sees one presentation of the product — never dark just
 * because their OS prefers it, which MUI's `system` mode would otherwise do.
 *
 * (It used to be decided by URL alone, which lit `/courses/{slug}` light for
 * signed-in dark-mode users too. That was the documented trade-off; the project
 * owner found it grating, and theming by viewer removes it.)
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
 * Whether the page follows the user's scheme for this viewer: always when signed
 * in, otherwise only on the gated sections. `themeSwitch` off still wins.
 */
export function followsUserScheme(pathname: string, signedIn: boolean): boolean {
  if (!FEATURES.themeSwitch) return false;
  return signedIn || isThemedPath(pathname);
}

/**
 * Supabase's session cookie, `sb-<project-ref>-auth-token` (or `.0`, `.1`… when
 * chunked). The first-paint script runs before React and the auth store exist,
 * so the cookie is the only signal it has. `@supabase/ssr` leaves it readable by
 * JavaScript. It may be stale (an expired session) — that costs one paint in
 * the wrong scheme, corrected as soon as the auth store resolves.
 */
export const SESSION_COOKIE_PATTERN = String.raw`(?:^|;\s*)sb-[^=]+-auth-token(?:\.\d+)?=`;

export function hasSessionCookie(): boolean {
  // Called during render, which also happens on the server.
  if (typeof document === 'undefined') return false;
  return new RegExp(SESSION_COOKIE_PATTERN).test(document.cookie);
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
 * Forces the light class on `<html>` before the first paint of a public page
 * seen by a signed-out visitor.
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
)}&&(new RegExp(${JSON.stringify(SESSION_COOKIE_PATTERN)}).test(document.cookie)||${JSON.stringify(
  THEMED_PREFIXES,
)}.some(function(x){return p===x||p.indexOf(x+'/')===0})||new RegExp(${JSON.stringify(
  THEMED_PATTERN,
)}).test(p));if(!themed){var e=document.documentElement;e.classList.remove('${DARK_CLASS}');e.classList.add('${LIGHT_CLASS}');}}catch(e){}})();`;
