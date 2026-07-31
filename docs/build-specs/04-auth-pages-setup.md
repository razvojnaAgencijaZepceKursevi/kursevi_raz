# Auth Pages Setup

This document specifies the actual auth-related pages to build — login, register, email confirmation callback, password reset, logout, and route protection applied to the route groups. This is the one exception to "pages are built manually later": auth pages are foundational scaffolding everything else sits behind, so the agent should build them concretely here. Builds directly on the Supabase clients, `middleware.ts`, and `useAuthStore` specified in `project-setup.md` — does not modify that file.

---

## 1. Pages to build

All under the `(public)` route group defined in `project-setup.md`, using the browser Supabase client + MUI form components + React Query mutations where relevant.

### `src/app/(public)/login/page.tsx`
- Email/password form.
- On submit: `supabase.auth.signInWithPassword`.
- On success: read the user's role from `profiles` (via `/api/me`) and redirect — admin → `/admin`, student → `/dashboard` (or whatever the sample landing route is named, see section 3).
- On error: inline form error (invalid credentials, unconfirmed email, etc.).
- Link to `/register` and `/forgot-password`.

### `src/app/(public)/register/page.tsx`
- Form: full name, email, password (+ confirm password).
- On submit: `supabase.auth.signUp`, passing `full_name` in the user metadata (consumed by the `handle_new_user()` trigger from `database-and-migrations.md` to populate `profiles`).
- On success: show a "check your email to confirm" message rather than redirecting — account isn't usable until confirmed.
- On error: inline validation + server error display.

### `src/app/auth/callback/route.ts`
- Standard Supabase confirmation/magic-link callback: reads the `code` query param, calls `supabase.auth.exchangeCodeForSession(code)` using the server client, then redirects to a role-appropriate landing page (or `/login` on failure).
- This route is not under `(public)` — it's a plain route handler, matching Supabase's required callback pattern.

### `src/app/(public)/forgot-password/page.tsx`
- Email input form.
- On submit: `supabase.auth.resetPasswordForEmail`, pointing `redirectTo` at `/reset-password`.
- Shows a confirmation message regardless of whether the email exists (avoid leaking account existence).

### `src/app/(public)/reset-password/page.tsx`
- New password + confirm fields (reached via the emailed link, which establishes a temporary recovery session).
- On submit: `supabase.auth.updateUser({ password })`.
- On success: redirect to `/login`.

### Logout action
- A small reusable function/hook (e.g. `useLogout` or a `logout()` action in `useAuthStore`) calling `supabase.auth.signOut()`, clearing the Zustand auth state, and redirecting to `/login`. Wired into a logout button placed in the sample protected layout (section 3) — the actual app-wide nav/header is built manually later.

---

## 2. Route protection

- `middleware.ts` (already specified in `project-setup.md`) is extended here with the concrete rules:
  - Unauthenticated request to anything under `(student)` or `(admin)` → redirect to `/login`.
  - Authenticated non-admin request to anything under `(admin)` → redirect to `/dashboard` (or a `/unauthorized` page, admin's choice).
  - Authenticated request to `/login` or `/register` → redirect straight to their role's landing page (no reason to show the login form to someone already signed in).
- A shared layout per protected group (`src/app/(student)/layout.tsx`, `src/app/(admin)/layout.tsx`) reads the session server-side (via the server Supabase client) as a second guard beneath the middleware, and renders the logout action.

---

## 3. Sample protected page (proof the gating works end to end)

`src/app/(student)/dashboard/page.tsx`:
- Server component, fetches the session via the server client, displays the logged-in user's `full_name` and `role` from `profiles`, and includes the logout button.
- This is the **only** page built inside `(student)`/`(admin)` beyond the auth flow itself — it exists purely to prove login → session → protected route → logout works correctly. Every other page in those groups is built manually afterward, following this same pattern (server-side session read, or `useAuthStore` client-side for role-based UI branching).

---

## 4. What NOT to build here

- No actual admin dashboard, course pages, module pages, etc. — those are manual, later work per the original scope.
- No social/OAuth providers unless you decide you want them — this spec assumes email/password only; adding a provider is an additive change to `login`/`register` later, not a blocker now.
