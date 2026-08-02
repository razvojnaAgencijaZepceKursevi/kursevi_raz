# Frontend Developer Guide

Welcome. This is your orientation to the codebase — how it's organized, how the pieces fit together, and how to build a page here. It's not a full tutorial for any individual technology; where you need to go deeper, links are provided. Read this once before touching anything, then keep it open as a reference.

---

## 1. The stack, briefly

- **Next.js (App Router)** — the framework. Pages live as files under `src/app/`; the folder structure _is_ the routing.
- **TypeScript** — everything is typed, including the database itself (see section 6).
- **Material UI (MUI)** — the component library. Buttons, forms, layout, everything visual starts from MUI components, styled via the shared theme.
- **TanStack React Query** — handles all data fetching/caching. You never call `fetch` or the Supabase client directly from a page — you call a hook.
- **Zustand** — small, global client-side state (right now: the logged-in user's session/role). Not for server data — that's React Query's job.
- **Supabase** — the database and auth provider. You mostly won't touch it directly; it's already wired up behind the hooks and the auth pages.

---

## 2. Project structure

```
src/
  app/            <- routes. Each folder = a URL segment. page.tsx = the page itself.
    (public)/      <- pages anyone can see (landing, course listing...)
    (student)/      <- pages only logged-in students can see
    (admin)/        <- pages only the admin can see
    api/            <- backend route handlers — you won't build these, they already exist
  components/      <- reusable UI pieces shared across pages
  hooks/            <- React Query hooks — one file per resource (useCourses.ts, useModules.ts...)
  lib/
    supabase/        <- Supabase client setup — don't modify
    query/            <- React Query client config — don't modify
    api/client.ts     <- the fetch wrapper the hooks use — don't modify
    schemas/          <- zod schemas: the single source of truth for API types
  store/            <- Zustand stores (useAuthStore.ts)
  theme/            <- theme.ts — MUI theme definition
  types/            <- generated database types (database.types.ts)
  middleware.ts      <- route protection — don't modify without asking
```

The three route groups — `(public)`, `(student)`, `(admin)` — are already gated by the middleware. If you create a page inside `(student)/`, it's automatically protected; you don't need to add any auth check yourself.

---

## 3. Where logic lives vs. where UI lives

This is the most important convention to internalize:

- **Data fetching and mutations** → always through a hook in `src/hooks/`. Never call Supabase or `fetch` directly inside a component.
- **Global session/role state** → `useAuthStore` (Zustand), for things like "is this user an admin."
- **Everything else (page state, form input, a toggle)** → normal React `useState` inside the component. Not every piece of state needs to be global.
- **Components** → stay presentational. A component should describe what things look like, not how to fetch or save them — that's the hook's job.

### Example: using an existing hook

```tsx
// inside a page or component
import { useCourses } from '@/hooks/useCourses';

function CourseList() {
  const { data, isLoading, error } = useCourses({ page: 1 });

  if (isLoading) return <CircularProgress />;
  if (error) return <Alert severity="error">Couldn't load courses.</Alert>;

  // List hooks return the API envelope: `data.data` is the rows,
  // `data.meta` is { page, pageSize, total, totalPages } for pagination.
  return data.data.map((course) => <CourseCard key={course.id} course={course} />);
}
```

Two conventions worth knowing before you use these:

- **List hooks return `{ data, meta }`; detail hooks return the record directly.** Lists need `meta` to render pagination, so the envelope is preserved. A detail hook like `useCourse(id)` unwraps it for you.
- **Mutations are `useMutation`** — call `.mutate(...)` or `await .mutateAsync(...)`, and the hook invalidates the caches the change affects. You don't refetch by hand.

Errors are `ApiRequestError` with a numeric `status`. That distinction matters: on a course page a 403 from `useCourseModules` means "hasn't bought this course" (show a purchase prompt), not "something broke".

```tsx
import { isApiRequestError } from '@/lib/api/client';

if (isApiRequestError(error) && error.status === 403) return <PurchasePrompt />;
```

If the hook you need doesn't exist yet, check with whoever's maintaining the backend layer before writing your own data-fetching logic — the endpoint likely already exists and just needs a hook wrapped around it.

---

## 4. How to build a new page

1. Find (or create) the right folder under the correct route group — `(public)`, `(student)`, or `(admin)` — matching who should see it.
2. Create `page.tsx` inside it. That's the page.
3. Use the existing sample protected page (`src/app/(student)/dashboard/page.tsx`) as a template for structure — how it reads the session, how it's laid out.
4. Pull data via an existing hook (section 3). Build the UI with MUI components (section 5).
5. Handle the real states: loading, empty, error, and — where relevant — "not allowed" (e.g. a student viewing a course they haven't purchased).
6. If the page needs a new hook or the backend doesn't return something you need, flag it rather than reaching around the data layer yourself.

---

## 5. Using Material UI here

- The shared theme lives in `src/theme/theme.ts` — colors, typography, spacing all come from there. Don't hardcode a color or font size in a component if the theme already defines one.
- Prefer MUI components over raw HTML elements (`<Button>` not `<button>`, `<Typography>` not `<p>`) — this keeps styling consistent automatically.
- For one-off styling, use the `sx` prop rather than a separate CSS file:
  ```tsx
  <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>...</Box>
  ```
- Numbers in `sx` spacing (`gap: 2`, `mt: 3`) are theme spacing units, not pixels — that's intentional, it keeps spacing consistent across the app.
- If you find yourself repeating the same styled combination of MUI components in multiple places, that's a sign it should become a shared component in `src/components/`, not copy-pasted.
- MUI docs: https://mui.com/material-ui/getting-started/

---

## 6. Types and the database

- `src/types/database.types.ts` is auto-generated from the actual Supabase schema — never edit it by hand. If the schema changes, someone regenerates this file.
- The types a hook gives you come from `src/lib/schemas/*.schema.ts` — the zod schemas that also validate requests on the server and generate `/api-docs`. One definition, three uses. If you need to name an API type in your own code (a component prop, say), import it from there: `import type { Course } from '@/lib/schemas/courses.schema'`.
- Use `import type` for these, not a plain `import`. Type-only imports vanish at build time; a plain one would pull zod into the browser bundle.
- Never redeclare an API shape as a local `interface`. If a type you need isn't exported from the schema file yet, add the `z.infer` export there rather than writing the shape out by hand.
- This means table shapes are already typed for you — when you use a hook, the data it returns is typed automatically. Let TypeScript guide you: if something doesn't have the field you expect, check the actual schema/types file rather than assuming.

---

## 7. Auth, in plain terms

- Login, register, email confirmation, password reset, and logout are already built (`(public)/login`, `(public)/register`, `/auth/callback`, `(public)/forgot-password`, `(public)/reset-password`).
- `useAuthStore` tells you who's logged in and their role (`admin` or `student`) — use it for role-based UI (e.g. showing an admin-only button).
- You will never need to touch the Supabase clients, RLS policies, or migrations. If a page seems to need different data access than what's available, that's a backend question, not something to solve by loosening security client-side.

---

## 8. Naming conventions

- **Files/folders**: `kebab-case` for route folders (`course-detail/`), `PascalCase` for component files (`CourseCard.tsx`), `camelCase` for hooks (`useCourses.ts`) and utility files.
- **Components**: `PascalCase`, named for what they render (`ModuleProgressBar`, not `Progress2`).
- **Hooks**: prefixed `use`, named for the resource + action where relevant (`useCourses`, `useCreateCourse`, `useApprovePurchase`).
- Keep names descriptive over short — `ModuleVideoPlayer` beats `MVP` or `Player`.

---

## 9. Git basics

- **Clone** the repo, then always **pull** the latest before starting new work: `git pull origin main`.
- **Branch per task**, off `main`:
  ```bash
  git checkout -b feature/course-detail-page
  # or: fix/quiz-score-bug
  ```
- **Commit often, in small chunks**, with a clear message describing _what_ changed:
  ```bash
  git add .
  git commit -m "Add course detail page layout"
  ```
- **Push your branch** and open a **pull request** rather than pushing straight to `main`:
  ```bash
  git push origin feature/course-detail-page
  ```
- Never commit `.env.local` (it's already git-ignored — don't remove that).
- If you're unsure whether a change is "done enough" to commit, smaller and more frequent is safer than one giant commit at the end of the day.
- Git basics reference: https://git-scm.com/book/en/v2/Getting-Started-Git-Basics

---

## 10. Further resources

- Next.js App Router: https://nextjs.org/docs/app
- Material UI: https://mui.com/material-ui/getting-started/
- TanStack React Query: https://tanstack.com/query/latest/docs/framework/react/overview
- Zustand: https://zustand.docs.pmnd.rs/
- Supabase JS client: https://supabase.com/docs/reference/javascript/introduction
- The live API reference for every backend endpoint: `/api-docs` in the running app

When in doubt: find the closest existing example in the codebase and follow its pattern before inventing a new one.
