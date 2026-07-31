# Database, Migrations, RLS & Backend Endpoints

This document is the complete backend build spec for the online courses platform. It must be implemented entirely through **Supabase CLI migrations checked into the codebase** — no schema or RLS changes via the Supabase dashboard. After every migration, regenerate TypeScript types.

---

## 0. Principles

- All schema changes live in `supabase/migrations/*.sql`, applied via `supabase db push` (or CI).
- Every table has RLS **enabled** with **explicit** policies. No table is left open by default.
- Every table has: `id uuid primary key default gen_random_uuid()`, `created_at timestamptz default now()`, `updated_at timestamptz default now()`, `created_by uuid references auth.users(id)`, `updated_by uuid references auth.users(id)`.
- A shared trigger function `set_updated_at()` auto-updates `updated_at` (and should be extended to set `updated_by` where the caller's uid is available) on every `UPDATE`, attached to every table.
- Two roles only: `admin`, `student`. Enforced via a Postgres enum `user_role`.
- All mutations to `module_progress` and `certificates` happen **only** through server-side Next.js API routes using the service-role key — these two tables get **no INSERT/UPDATE RLS policy for students at all**.
- `answers.is_correct` must never be exposed to students through a normal read — strip it server-side when serving a quiz for taking.

Suggested migration order (one concern per file):
```
0001_extensions_and_enums.sql
0002_helper_functions_and_triggers.sql   -- set_updated_at(), is_admin() helper
0003_profiles.sql
0004_categories.sql
0005_courses.sql
0006_modules_and_files.sql
0007_quizzes_questions_answers.sql
0008_tasks_and_files.sql
0009_purchases.sql
0010_task_submissions_and_messages.sql
0011_module_progress.sql
0012_certificates.sql
0013_storage_buckets_and_policies.sql
0014_rls_policies.sql                     -- or split RLS into each table's own file, either is fine
```

After every migration:
```bash
supabase gen types typescript --linked > src/types/database.types.ts
# or --local if generating against local db before linking
```

---

## 1. Enums

```sql
create type user_role as enum ('admin', 'student');
create type purchase_status as enum ('requested', 'denied', 'approved');
create type task_submission_status as enum ('pending', 'needs_revision', 'approved');
```

---

## 2. Helper functions

```sql
-- Returns true if the currently authenticated user is an admin
create or replace function is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- Generic updated_at trigger
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;
```
Attach `set_updated_at` as a `before update` trigger on every table below.

---

## 3. Tables

### 3.1 `profiles` (extends `auth.users`)
| column | type | notes |
|---|---|---|
| id | uuid PK | references `auth.users(id)` on delete cascade |
| full_name | text | not null |
| email | text | not null, unique — kept in sync with `auth.users.email` |
| role | user_role | not null, default `'student'` |

- Row created automatically via a trigger on `auth.users` insert (`handle_new_user()` function + trigger on `auth.users`), populating `email` and `full_name` from signup metadata, defaulting `role` to `student`.
- The one admin account: role flipped manually in the dashboard after signup (not via app).

### 3.2 `categories`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| name | text | not null, unique |

### 3.3 `courses`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| category_id | uuid | FK → categories, nullable |
| name | text | not null |
| description | text | |
| price | numeric(10,2) | not null, default 0 |
| thumbnail_path | text | storage object path in `course-thumbnails` bucket |
| published | boolean | not null, default false |

### 3.4 `modules`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| course_id | uuid | FK → courses, not null, on delete cascade |
| title | text | not null |
| description | text | |
| video_url | text | nullable |
| order | integer | not null — drives sequencing/unlock logic |

Index: `(course_id, order)`.

### 3.5 `module_files`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| module_id | uuid | FK → modules, not null, on delete cascade |
| file_path | text | storage object path in `module-files` bucket |
| file_name | text | |

### 3.6 `quizzes`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| module_id | uuid | FK → modules, not null, unique, on delete cascade (0 or 1 quiz per module) |
| passing_score | integer | not null — percentage threshold |

### 3.7 `questions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| quiz_id | uuid | FK → quizzes, not null, on delete cascade |
| text | text | not null |

### 3.8 `answers`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| question_id | uuid | FK → questions, not null, on delete cascade |
| text | text | not null |
| is_correct | boolean | not null, default false |

Enforce single-correct-answer per question with a partial unique index:
```sql
create unique index one_correct_answer_per_question
  on answers (question_id)
  where is_correct = true;
```

### 3.9 `tasks`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| module_id | uuid | FK → modules, not null, unique, on delete cascade (0 or 1 task per module) |
| text | text | not null |

### 3.10 `task_files`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| task_id | uuid | FK → tasks, not null, on delete cascade |
| file_path | text | storage object path in `task-files` bucket |
| file_name | text | |

### 3.11 `purchases`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| student_id | uuid | FK → profiles, not null |
| course_id | uuid | FK → courses, not null |
| price | numeric(10,2) | not null — price snapshot at request time |
| status | purchase_status | not null, default `'requested'` |

Index: `(student_id, course_id)`.

### 3.12 `task_submissions`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| task_id | uuid | FK → tasks, not null |
| student_id | uuid | FK → profiles, not null |
| status | task_submission_status | not null, default `'pending'` |

Index: `(task_id, student_id)` — one active submission thread per student per task.

### 3.13 `task_messages`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| submission_id | uuid | FK → task_submissions, not null, on delete cascade |
| sender_id | uuid | FK → profiles, not null |
| body | text | not null |
| attachment_path | text | storage object path in `task-message-attachments` bucket, nullable |

### 3.14 `module_progress`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| module_id | uuid | FK → modules, not null |
| student_id | uuid | FK → profiles, not null |
| quiz_done | boolean | not null, default false |
| task_done | boolean | not null, default false |
| completed | boolean | not null, default false — server-computed, never trusted from client |

Unique index: `(module_id, student_id)`.

`completed` logic (computed server-side in the API route on every write):
```
completed = (no quiz for module OR quiz_done) AND (no task for module OR task_done)
```

### 3.15 `certificates`
| column | type | notes |
|---|---|---|
| id | uuid PK | |
| course_id | uuid | FK → courses, not null |
| student_id | uuid | FK → profiles, not null |
| readable_id | text | not null, unique — e.g. `CERT-2026-0001` |
| requested_delivery | boolean | not null, default false |

Unique index: `(course_id, student_id)` — existence of this row **is** the "course completed" signal; no separate `course_progress` table.

---

## 4. Storage buckets

| bucket | access |
|---|---|
| `course-thumbnails` | public read; admin write |
| `module-files` | gated — student read only if approved purchase for the parent course; admin full |
| `task-files` | same gating as `module-files` |
| `task-message-attachments` | gated — readable only by the submission's student and admin |

Storage policies must mirror the table RLS logic below (join through the object path convention you choose, e.g. `course_id/module_id/filename`).

---

## 5. RLS Policies

General pattern: `is_admin()` → full access. Everyone else scoped as below.

- **profiles**: student `SELECT`/`UPDATE` own row only, **cannot update `role`** (enforce via column-level check or a trigger rejecting role changes from non-admins). Admin: full access.
- **categories**: `SELECT` public (anon + authenticated). Admin: full access, everyone else read-only.
- **courses**: `SELECT` where `published = true` for anon/student. Admin: full access including unpublished.
- **modules / module_files / quizzes / questions / answers / tasks / task_files**: `SELECT` for student only where they have a `purchases` row with `status = 'approved'` for the parent `course_id` (join up through `module_id`). Admin: full access. `answers.is_correct` must be excluded from the payload returned to students at the API layer (or served via a view without that column for student callers) even though RLS technically allows reading the row.
- **purchases**: student `SELECT`/`INSERT` own rows only; **no `UPDATE`** policy for students (status changes admin-only). Admin: full access.
- **task_submissions**: student `SELECT`/`INSERT` own rows only; **no `UPDATE`** policy for students. Admin: full access.
- **task_messages**: student `SELECT`/`INSERT` only for messages on their own submissions. Admin: full access.
- **module_progress**: student `SELECT` own rows only. **No `INSERT`/`UPDATE` policy for students at all** — writes only via service-role API routes. Admin: full access.
- **certificates**: student `SELECT` own rows only. **No `INSERT`/`UPDATE` policy for students at all** — issued only via service-role API routes. Admin: full access.

---

## 6. Backend Endpoints (Next.js Route Handlers)

Implement under `src/app/api/**/route.ts`. Use the RLS-respecting Supabase client (with the user's session) for anything RLS already protects correctly. Use the **service-role client** only where the RLS section above explicitly says students have no write policy (`module_progress`, `certificates`, and any status-transition action like approving a purchase or submission) — and independently verify the caller's role/identity in the route before doing anything.

All list endpoints support `?page=`, `?pageSize=`, `?search=`, and relevant `?filter=` query params. Every endpoint's request/response types should be defined in `src/types/api/*.ts` and reused by the React Query hooks on the frontend.

### Auth / Users
- `GET /api/me` — current profile + role
- `GET /api/admin/users` — list/search (admin)
- `PATCH /api/admin/users/:id` — update role (admin)

### Categories
- `GET /api/categories` — list (public)
- `POST /api/admin/categories`, `PATCH /api/admin/categories/:id`, `DELETE /api/admin/categories/:id` (admin)

### Courses
- `GET /api/courses` — list/search/filter, published only (public)
- `GET /api/courses/:id` — get one, published only (public)
- `POST /api/admin/courses`, `PATCH /api/admin/courses/:id`, `DELETE /api/admin/courses/:id` (admin, any publish state)
- `GET /api/admin/courses` — list all incl. unpublished (admin)

### Modules
- `GET /api/courses/:courseId/modules` — list for a course (student, requires approved purchase — enforced by RLS + double-checked in route)
- `POST /api/admin/modules`, `PATCH /api/admin/modules/:id`, `DELETE /api/admin/modules/:id` (admin)
- `POST /api/admin/modules/:id/files`, `DELETE /api/admin/module-files/:id` (admin — upload/delete)

### Quizzes / Questions / Answers
- `POST /api/admin/quizzes`, `PATCH /api/admin/quizzes/:id`, `DELETE /api/admin/quizzes/:id` — nested create/update with questions+answers in one payload (admin)
- `GET /api/modules/:moduleId/quiz` — get quiz for taking, **`is_correct` stripped** (student, purchase-gated)
- `POST /api/modules/:moduleId/quiz/attempt` — submit answers; scores server-side; on pass writes `quiz_done = true` on `module_progress` and recomputes `completed` (service-role, verifies caller)

### Tasks
- `POST /api/admin/tasks`, `PATCH /api/admin/tasks/:id`, `DELETE /api/admin/tasks/:id` (admin)
- `GET /api/modules/:moduleId/task` — get task for module (student, purchase-gated)
- `POST /api/admin/tasks/:id/files`, `DELETE /api/admin/task-files/:id` (admin)

### Task Submissions / Messages
- `POST /api/tasks/:taskId/submissions` — create submission + first message (student)
- `POST /api/submissions/:id/messages` — add message; if sender is admin, also updates `task_submissions.status` per admin's chosen status (student or admin)
- `GET /api/submissions/:id/messages` — list thread (participant-scoped)
- `GET /api/admin/submissions` — list/search/filter by status/course/student (admin)
- On a submission reaching `status = 'approved'`: writes `task_done = true` on `module_progress` and recomputes `completed` (service-role)

### Purchases
- `POST /api/purchases` — request purchase (student)
- `GET /api/purchases` — list own (student)
- `GET /api/admin/purchases` — list/search/filter all (admin)
- `PATCH /api/admin/purchases/:id` — approve/deny (admin, service-role — grants access on approve)

### Module Progress
- `GET /api/courses/:courseId/progress` — get own progress across all modules in a course (student)
- Internal only — no public write endpoint; written by quiz-attempt and submission-approval routes above

### Certificates
- `GET /api/certificates` — list own (student)
- `GET /api/certificates/:readableId` — public verification lookup
- `GET /api/admin/certificates` — list/search all + delivery requests (admin)
- `PATCH /api/certificates/:id/request-delivery` — student requests physical delivery
- Internal only — auto-issued (service-role) whenever a module-progress write results in all of a course's modules being `completed` for that student; generates `readable_id` and inserts the row
