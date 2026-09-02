/**
 * Feature flags, for showing the product in stages.
 *
 * The app is finished; these exist so it can be *presented* a segment at a
 * time — turn one on every few weeks, and with everything on it behaves exactly
 * as it does with no flags at all.
 *
 * ## Default on, not default off
 *
 * A flag that is absent means **enabled**. Only the literal string `"false"`
 * turns something off.
 *
 * The alternative — default off — would mean a fresh clone, a CI run or a
 * forgotten variable in a new environment silently ships a crippled app, and
 * every deploy target would have to list every flag to get the normal product.
 * Defaulting on means the flags are a deliberate subtraction from a working
 * whole, which is what they are. It also makes the promise easy to keep: delete
 * the variables and everything is back.
 *
 * ## They must be `NEXT_PUBLIC_`
 *
 * Next inlines these at build time, and only variables with that prefix reach
 * the browser. A flag read in a Client Component (most of this app) would be
 * `undefined` without it, so the feature would look enabled on the server and
 * disabled on the client — or the reverse. The whole file is therefore written
 * with **literal** `process.env.NEXT_PUBLIC_…` reads: Next substitutes them
 * textually, so `process.env[someVariable]` does not work and would silently
 * evaluate to undefined.
 *
 * ## What a flag does and does not do
 *
 * A flag hides a feature: its nav entries, its pages, and the UI that leads to
 * it. **It is not access control.** The API routes and RLS policies are
 * unchanged, so a flag being off does not make an endpoint unreachable to
 * someone who types the URL — it makes the product not offer it. That is the
 * right level for a staged demo, and the wrong level for security; nothing here
 * is protecting anything.
 */

/** Only an explicit "false" disables. Anything else — including unset — is on. */
function enabled(value: string | undefined): boolean {
  return value !== 'false';
}

export const FEATURES = {
  /**
   * The public catalogue: `/courses`, a course's public page, and the purchase
   * panel on it. With this off the app is the signed-in product only.
   */
  catalog: enabled(process.env.NEXT_PUBLIC_FEATURE_CATALOG),

  /**
   * Buying access: the request button, the admin purchase queue, the student's
   * purchases page, and the payment details shown alongside a reference.
   */
  purchases: enabled(process.env.NEXT_PUBLIC_FEATURE_PURCHASES),

  /**
   * Quizzes on a module — authoring them and taking them. Independent of
   * `tasks`: a course can be built with one, the other, or neither.
   */
  quizzes: enabled(process.env.NEXT_PUBLIC_FEATURE_QUIZZES),

  /**
   * Task submissions and the review thread: the student's task screen, the
   * admin submission queue, and messaging on both sides.
   */
  tasks: enabled(process.env.NEXT_PUBLIC_FEATURE_TASKS),

  /**
   * Certificates: issuing, the certificate page, the PDF, and the printed-copy
   * request. Progress still records completion with this off — it simply
   * produces nothing at the end.
   */
  certificates: enabled(process.env.NEXT_PUBLIC_FEATURE_CERTIFICATES),

  /**
   * In-app notifications: the bell, the list, and the per-event settings tab.
   * Email delivery rides on this too — a notification nobody can see or
   * configure should not arrive by mail either.
   */
  notifications: enabled(process.env.NEXT_PUBLIC_FEATURE_NOTIFICATIONS),

  /** The support channel: `/issues` for users and the admin queue. */
  support: enabled(process.env.NEXT_PUBLIC_FEATURE_SUPPORT),

  /** The blog: its index, its posts, and the footer link to them. */
  blog: enabled(process.env.NEXT_PUBLIC_FEATURE_BLOG),

  /**
   * The newsletter: the opt-in in settings, and the admin composer and export.
   */
  newsletter: enabled(process.env.NEXT_PUBLIC_FEATURE_NEWSLETTER),

  /**
   * Teachers as scoped authors — the role in the admin user editor, and the
   * course-owner assignment. The database rules stay in force regardless; this
   * only stops the product offering the role.
   */
  teachers: enabled(process.env.NEXT_PUBLIC_FEATURE_TEACHERS),

  /** The light/dark toggle and its settings tab. */
  themeSwitch: enabled(process.env.NEXT_PUBLIC_FEATURE_THEME_SWITCH),

  /**
   * Google sign-in. Distinct from the others: this one has always needed the
   * provider configured in the Supabase dashboard, so it is the one flag that
   * is **off unless explicitly enabled** — showing a provider button that 400s
   * is worse than not showing it, and nobody can fix that from the app.
   */
  googleAuth: process.env.NEXT_PUBLIC_GOOGLE_AUTH_ENABLED === 'true',
} as const;

export type FeatureName = keyof typeof FEATURES;

/** Readable in a condition: `isEnabled('blog')`. */
export function isEnabled(feature: FeatureName): boolean {
  return FEATURES[feature];
}

/**
 * The prefixes a disabled feature owns, for `proxy.ts`.
 *
 * Hiding a link is presentation; this is what makes the URL itself stop
 * resolving, so a bookmark or a typed address during a demo does not walk into
 * a section that is supposed to be weeks away.
 *
 * `googleAuth` and `themeSwitch` are absent on purpose — neither owns a route,
 * they are controls inside pages that stay reachable.
 */
export const FEATURE_ROUTES: Partial<Record<FeatureName, readonly string[]>> = {
  catalog: ['/courses'],
  purchases: ['/dashboard/purchases', '/admin/purchases', '/admin/settings/payment'],
  tasks: ['/admin/submissions'],
  certificates: ['/certificates', '/dashboard/certificates', '/admin/certificates'],
  notifications: ['/notifications', '/settings/notifications'],
  support: ['/issues', '/admin/issues'],
  blog: ['/blog'],
  newsletter: ['/settings/newsletter', '/admin/settings/newsletter'],
};

/** Every prefix that is currently switched off. */
export function disabledRoutePrefixes(): string[] {
  return (Object.keys(FEATURE_ROUTES) as FeatureName[])
    .filter((feature) => !FEATURES[feature])
    .flatMap((feature) => FEATURE_ROUTES[feature] ?? []);
}
