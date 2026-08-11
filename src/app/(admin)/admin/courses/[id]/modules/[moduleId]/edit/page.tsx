'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import ModuleForm from '@/components/modules/ModuleForm';
import { useAdminCourse } from '@/hooks/useCourses';
import { useCourseModules, useUpdateModule } from '@/hooks/useModules';
import { moduleToFormValues, toUpdateModulePayload } from '@/lib/schemas/module-form.schema';
import type { ModuleFormValues } from '@/lib/schemas/module-form.schema';
import { toast } from '@/store/useToastStore';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  EDIT MODULE — SCAFFOLD, working but incomplete.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Saving the four basic fields works. What is missing: materials (see
 * `ModuleForm`), delete, and the quiz/task entry points.
 *
 * ## Read this first: there is no "get one module" endpoint
 *
 * The API exposes `GET /api/courses/:courseId/modules` (a list) and
 * `PATCH /api/admin/modules/:id` — but no `GET /api/admin/modules/:id`. So this
 * page fetches the course's modules and picks the one it wants out of the list.
 *
 * That is a deliberate trade, not an oversight: a course has a handful of
 * modules, the list is already cached by the modules page you navigated from,
 * and adding an endpoint costs a route, a schema entry and a hook. If module
 * counts ever grow, add `GET /api/admin/modules/:id` and swap the lookup
 * below — see how `useAdminPurchase` was added for exactly that reason.
 *
 * The consequence to keep in mind: "not found" here means *not in this
 * course's list*, which also covers "the id belongs to another course". Both
 * should render the same not-found state, and the code below does.
 *
 * ## The rule that will bite you
 *
 * `defaultValues` is read once at mount, so `<ModuleForm>` MUST stay inside the
 * `<QueryState>`. Move it out and the fields mount empty and never fill in.
 */
export default function EditModulePage(
  props: PageProps<'/admin/courses/[id]/modules/[moduleId]/edit'>,
) {
  const { id: courseId, moduleId } = React.use(props.params);

  const router = useRouter();
  const course = useAdminCourse(courseId);
  const modules = useCourseModules(courseId);
  const updateModule = useUpdateModule();

  async function handleSubmit(values: ModuleFormValues) {
    // No try/catch — <Form> surfaces whatever this throws.
    await updateModule.mutateAsync({ id: moduleId, body: toUpdateModulePayload(values) });

    toast.success('Modul je sačuvan.');
    router.push(`/admin/courses/${courseId}/modules`);
  }

  return (
    <PageContainer maxWidth="form">
      <QueryState query={modules} errorTitle="Modul nije moguće učitati">
        {(page) => {
          // Not named `module` — that shadows a Node global and ESLint rejects it
          // (@next/next/no-assign-module-variable).
          const currentModule = page.data.find((m) => m.id === moduleId);

          // Covers both "no such module" and "belongs to a different course".
          if (!currentModule) {
            return (
              <ContentCard>
                <EmptyState
                  title="Modul nije pronađen"
                  description="Modul ne postoji ili ne pripada ovom kursu."
                />
              </ContentCard>
            );
          }

          return (
            <>
              <PageHeader
                breadcrumbs={[
                  { label: 'Kursevi', href: '/admin/courses' },
                  {
                    label: course.data?.name ?? 'Kurs',
                    href: `/admin/courses/${courseId}/edit`,
                  },
                  { label: 'Moduli', href: `/admin/courses/${courseId}/modules` },
                  { label: currentModule.title },
                ]}
                title={currentModule.title}
                description="Izmena modula."
              />

              <ModuleForm
                defaultValues={moduleToFormValues(currentModule)}
                onSubmit={handleSubmit}
                submitLabel="Sačuvaj izmene"
                pendingLabel="Čuvanje modula…"
                cancelHref={`/admin/courses/${courseId}/modules`}
              />

              {/*
               * ───────────────────────────────────────────────────────────
               *  TODO(intern) — what still belongs on this page
               * ───────────────────────────────────────────────────────────
               *
               * 1. MATERIALS. This is the page where file upload belongs,
               *    because the module id exists here (it does not on the
               *    create page). Pass `moduleId` into <ModuleForm> and build
               *    the section described in its comment.
               *
               * 2. DELETE. `useDeleteModule()` behind a <ConfirmDialog>, in
               *    its own component so the list page can reuse it — copy
               *    `CourseActions`. Warn that the quiz, task and files are
               *    deleted with it; the FK cascade makes that irreversible.
               *    After deleting, navigate back to the module list.
               *
               * 3. QUIZ AND TASK. A module may have one of each. Neither page
               *    exists yet. Both are nested payloads — a quiz arrives with
               *    its questions, its answers and the answer key in one
               *    request — so read the schema in
               *    `src/lib/schemas/quizzes.schema.ts` before designing the
               *    form. Enforce single-correct-answer with radios, matching
               *    the database constraint.
               *
               *    `answer_keys` is a separate table on purpose: it holds
               *    which answer is correct, and students are denied SELECT on
               *    it by RLS. Never merge it into `answers` "for convenience"
               *    — that is what stops the quiz page leaking its own answers.
               */}
              <Alert severity="info">
                <AlertTitle>Delovi ove stranice još nisu napravljeni</AlertTitle>
                Materijali, brisanje modula i upravljanje kvizom/zadatkom. Uputstvo se nalazi u
                komentarima u ovom fajlu.
              </Alert>
            </>
          );
        }}
      </QueryState>
    </PageContainer>
  );
}
