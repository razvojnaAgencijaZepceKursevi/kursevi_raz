# API Documentation (Swagger / OpenAPI)

This document specifies a dynamically generated, always-in-sync API reference page, built from the same Zod schemas used for runtime request validation in the endpoints defined in `database-and-migrations.md`. It adds to that file and `project-setup.md` without modifying either — apply this after the base project and API routes are scaffolded.

---

## 1. Approach

- Every endpoint's request/response shape is defined as a **Zod schema**, colocated with (or imported into) its route handler and used for actual runtime validation — not just documentation.
- `@asteasolutions/zod-to-openapi` registers each schema against its route (method, path, params, request body, response body) and generates a full OpenAPI 3.0 document **at request time**, straight from those schemas.
- `swagger-ui-react` renders that generated document as an interactive browsable page.
- Result: the docs can never drift from the implementation, because they're generated from the exact object that validates incoming requests — there is no separately maintained description to fall out of sync.

---

## 2. Install

```bash
npm install zod @asteasolutions/zod-to-openapi swagger-ui-react
npm install -D @types/swagger-ui-react
```

---

## 3. Zod schemas per resource

Create one file per resource under `src/lib/schemas/`, e.g.:
```
src/lib/schemas/
  courses.schema.ts
  modules.schema.ts
  quizzes.schema.ts
  tasks.schema.ts
  purchases.schema.ts
  task-submissions.schema.ts
  module-progress.schema.ts
  certificates.schema.ts
  users.schema.ts
```

Each file defines and exports:
- The request body schema(s) for that resource's mutating endpoints (e.g. `createCourseSchema`, `updateCourseSchema`)
- The response schema(s) (e.g. `courseResponseSchema`, `courseListResponseSchema`)
- Query param schemas for list endpoints (`page`, `pageSize`, `search`, filters)

These schemas are the single source of truth: import them in the route handler to `.parse()`/`.safeParse()` incoming requests, and reuse them for the frontend's TypeScript types via `z.infer<typeof schema>` — replacing the separate `src/types/api/*.ts` files described in `project-setup.md` (Zod-inferred types supersede hand-written ones; delete duplicates where they'd otherwise diverge).

---

## 4. OpenAPI registry

`src/lib/openapi/registry.ts`:
- Create a single `OpenAPIRegistry` instance (from `@asteasolutions/zod-to-openapi`).
- For every route in `database-and-migrations.md` section 6, call `registry.registerPath({...})` with: `method`, `path` (converted to OpenAPI's `{param}` syntax), `tags` (group by resource — Courses, Modules, Quizzes, Tasks, Purchases, Submissions, Progress, Certificates, Users), `request` (params/query/body schemas imported from `src/lib/schemas/`), and `responses` (status codes mapped to their response schemas).
- Mark auth-protected routes with a `security` requirement referencing a registered bearer/cookie auth scheme, so Swagger UI's "Try it out" can send credentials.

`src/lib/openapi/generate.ts`:
- Build the document with `OpenApiGeneratorV3` from the registry, setting `info` (title, version) and `servers`.
- Export a `generateOpenApiDocument()` function returning the JSON-serializable spec object.

---

## 5. Serve the spec

`src/app/api/openapi.json/route.ts`:
```ts
import { generateOpenApiDocument } from '@/lib/openapi/generate';

export async function GET() {
  return Response.json(generateOpenApiDocument());
}
```
This regenerates the document on every request directly from the current schemas/registry — no build step, no stale cached file.

---

## 6. Docs page

`src/app/api-docs/page.tsx` (client component):
```tsx
'use client';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';

export default function ApiDocsPage() {
  return <SwaggerUI url="/api/openapi.json" />;
}
```

This renders a full interactive browser at `/api-docs`: every endpoint grouped by tag, expandable to show method, path, parameters, and request/response body schemas (field names, types, required/optional, enums) — all derived from the Zod schemas. "Try it out" is available by default; gate or disable it outside development if you don't want live requests fireable from a production docs page.

---

## 7. Guardrails

- Keep `/api-docs` and `/api/openapi.json` **admin-only or dev-only** — protect via the same middleware role check used for the `(admin)` route group, or exclude entirely from production builds if it's meant purely as an internal dev tool.
- As new endpoints are added, the only required step is registering the new Zod schema + route in `registry.ts` — the docs page and generated types update automatically, nothing else to touch.
