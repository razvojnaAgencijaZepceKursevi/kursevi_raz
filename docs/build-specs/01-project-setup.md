# Project & Frontend Setup

This document covers scaffolding the Next.js codebase, installing and configuring all base dependencies, and wiring authentication. It does **not** cover individual page UIs — those are built manually afterward on top of this foundation. When this is done, a developer should be able to start building pages immediately with working data-fetching, theming, state, and auth already in place.

---

## 1. Stack

- Next.js (App Router), TypeScript
- Material UI (MUI) for components + theme
- TanStack React Query — all API calls go through it
- Zustand — client state (auth/session state, any shared UI state)
- Supabase JS client (browser + server variants)
- ESLint + Prettier
- npm

---

## 2. Scaffold the project

```bash
npx create-next-app@latest . --typescript --eslint --app --src-dir --import-alias "@/*" --no-tailwind
```

## 3. Install dependencies

```bash
npm install @mui/material @mui/icons-material @emotion/react @emotion/styled
npm install @tanstack/react-query @tanstack/react-query-devtools
npm install zustand
npm install @supabase/supabase-js @supabase/ssr
npm install -D prettier eslint-config-prettier
```

## 4. Prettier + ESLint

- `.prettierrc` with sensible defaults (semi, singleQuote, trailingComma: 'all', printWidth: 100).
- Extend `eslint-config-next` with `eslint-config-prettier` last, so Prettier owns formatting and ESLint owns code quality.
- Add `"lint"`, `"format"`, and `"format:check"` scripts to `package.json`.

## 5. Folder structure

```
src/
  app/
    api/                 -- route handlers (see database-and-migrations.md, section 6)
    (public)/             -- route group for public pages (landing, course list, etc. — built manually later)
    (student)/             -- route group for authenticated student pages
    (admin)/             -- route group for admin pages
    layout.tsx           -- root layout: theme provider + query provider wrapped here
  components/             -- shared/reusable components (built manually later)
  lib/
    supabase/
      client.ts          -- browser client
      server.ts           -- server client (RSC/route handlers, cookie-based session)
      service-role.ts     -- service-role client, server-only, never imported client-side
    query/
      queryClient.ts       -- React Query client config
  hooks/                   -- React Query hooks per resource (useCourses, useModules, etc.) — built alongside endpoints
  store/                   -- Zustand stores
    useAuthStore.ts
  theme/
    theme.ts               -- MUI theme definition
  types/
    database.types.ts      -- generated via `supabase gen types typescript`
    api/                    -- request/response types per endpoint group
  middleware.ts             -- route protection (admin vs student vs public)
```

## 6. MUI theme setup

- Define a theme object in `src/theme/theme.ts` (palette, typography, shape, component overrides as needed) using `createTheme`.
- Wrap the app in `ThemeProvider` + `CssBaseline` inside `src/app/layout.tsx`.
- Use the Next.js App Router MUI integration pattern (an emotion cache registry client component) so styles work correctly with server components/SSR.

## 7. React Query setup

- Create a `QueryClient` in `src/lib/query/queryClient.ts` with sensible defaults (e.g. `staleTime`, `retry` policy appropriate for this app).
- Add a client component `QueryProvider` wrapping `QueryClientProvider`, mounted in `src/app/layout.tsx` alongside the theme provider.
- Include `ReactQueryDevtools` in development only.
- Convention: one hooks file per resource in `src/hooks/` (e.g. `useCourses.ts`, `usePurchases.ts`), each exporting typed `useQuery`/`useMutation` wrappers that call the corresponding `/api/*` route and use the types from `src/types/api/`.

## 8. Zustand setup

- `src/store/useAuthStore.ts` — holds the current session/profile (id, role, full_name, email) and loading state, populated on auth state change; used for role-based UI branching (admin vs student) without re-fetching `/api/me` everywhere.
- Keep stores minimal — most server data stays in React Query's cache, not Zustand; Zustand is for client-only/session state.

## 9. Supabase client setup

- `src/lib/supabase/client.ts` — browser client via `@supabase/ssr`'s `createBrowserClient`, typed with `Database` from `database.types.ts`.
- `src/lib/supabase/server.ts` — server client via `createServerClient`, reading/writing cookies for use in Server Components and Route Handlers.
- `src/lib/supabase/service-role.ts` — client built with the service-role key, **only ever imported in server-only route handlers** (never in client components, never in anything under `src/app/**/page.tsx` client boundaries). Used exclusively for the writes RLS blocks for students (`module_progress`, `certificates`, status-transition actions).

## 10. Auth wiring

- Sign up / sign in / sign out implemented via the Supabase browser client directly (email/password, or whichever provider you choose) from client components — no custom API route needed for these, Supabase Auth handles it.
- On auth state change, populate `useAuthStore` with the session and the matching `profiles` row (role, full_name) — fetched once via `/api/me`.
- `middleware.ts`: checks session on every request; redirects unauthenticated users away from protected route groups; checks `role` for `(admin)` route group and redirects non-admins away.
- Provide a small `AuthProvider` client component (mounted in root layout) that initializes the Supabase auth listener (`onAuthStateChange`) and keeps `useAuthStore` in sync across tabs/refreshes.
- Route groups `(public)`, `(student)`, `(admin)` as scaffolded above map directly to this protection logic — actual pages inside them are built manually later.

## 11. Type generation

Add an npm script:
```json
"db:types": "supabase gen types typescript --linked > src/types/database.types.ts"
```
Run this after every migration so `Database` types (and therefore every Supabase query and every API type built on top) stay accurate.

## 12. Environment variables

See `.env.example` — copy to `.env.local` and populate before running the app. `SUPABASE_SERVICE_ROLE_KEY` must never be prefixed `NEXT_PUBLIC_` and must only be read in server-only files.
