'use client';

import * as React from 'react';
import AddIcon from '@mui/icons-material/Add';
import Alert from '@mui/material/Alert';
import AlertTitle from '@mui/material/AlertTitle';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import PageContainer from '@/components/layout/PageContainer';
import PageHeader from '@/components/layout/PageHeader';
import ContentCard from '@/components/layout/ContentCard';
import QueryState from '@/components/feedback/QueryState';
import EmptyState from '@/components/feedback/EmptyState';
import { useAdminCourse } from '@/hooks/useCourses';
import { useCourseModules } from '@/hooks/useModules';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MODULE LIST — SCAFFOLD. Not finished. Instructions below.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The data wiring is done and correct; the rendering is not. Everything you
 * need is already fetched by the two hooks below — start by replacing the
 * "not implemented" block in the middle with a real list.
 *
 * ## Why this list lives under a course
 *
 * There is no `/admin/modules` and there should not be. A module has no meaning
 * outside its course, and every read endpoint is course-scoped
 * (`/api/courses/:courseId/modules`). The course id comes from the URL.
 *
 * ## What to build, in order
 *
 * ### 1. The list itself
 * Render `modules.data.data` (a `ModuleWithFiles[]`, already sorted by `order`).
 * Do **not** reach for `<DataTable>` here — reordering needs the rows to be
 * drag targets or to carry up/down buttons, which a column config can't express.
 * Copy the row markup from `src/components/courses/ModuleList.tsx` instead; it
 * already renders a numbered, ordered module row and looks right.
 *
 * Each row wants: position, title, whether it has a video, how many files, and
 * actions (edit / delete / move).
 *
 * ### 2. Reordering — the interesting problem
 * `modules.order` drives the student's sequential unlock, so it is not
 * cosmetic. Two options, and the simpler one is genuinely fine:
 *
 *   (a) Up/down buttons. Swap the `order` of two adjacent modules with two
 *       `useUpdateModule()` calls. No new dependency, keyboard-accessible for
 *       free, and obvious to read. **Start here.**
 *   (b) Drag and drop (`@dnd-kit`). Nicer with 20 modules, but it is a new
 *       dependency plus a keyboard-accessibility burden you must not skip.
 *
 * WATCH OUT: there is no bulk-reorder endpoint. Moving one module means
 * PATCHing the two rows whose `order` changed. If you later renumber a whole
 * list, you will fire N requests — acceptable for a handful of modules, and a
 * reason to add a proper endpoint if courses ever get large.
 *
 * There is no unique constraint on `(course_id, order)`, so duplicate values
 * are *possible*. The student-side unlock rule tolerates them (see
 * `unlockedModuleIds` in `src/lib/courseAccess.ts`), but the admin list should
 * not create them.
 *
 * ### 3. Delete
 * `useDeleteModule()` behind a `<ConfirmDialog>`. Say plainly in the dialog
 * that the module's quiz, task and files go with it — the FK cascade means
 * this is not recoverable from the UI. Copy `CourseActions` for the shape of a
 * component that owns its own mutation and confirmation.
 *
 * ### 4. Quiz and task
 * Each module may have one quiz and one task. Neither has a page yet. When
 * they do, link to them from the row. Note the schema has no "has_quiz" flag —
 * existence is the signal, so you need the module's quiz/task endpoints to
 * know. Until then, leave the row without those links rather than faking them.
 */
export default function AdminCourseModulesPage(props: PageProps<'/admin/courses/[id]/modules'>) {
  // `params` is a Promise in Next 16; a Client Component unwraps it with `use`.
  const { id: courseId } = React.use(props.params);

  const course = useAdminCourse(courseId);

  // The modules endpoint is purchase-gated for students, but an admin — or the
  // teacher who owns this course — reads it freely. If you get a 403 here as a
  // teacher, the course is not yours.
  const modules = useCourseModules(courseId);

  return (
    <PageContainer>
      <PageHeader
        breadcrumbs={[
          { label: 'Kursevi', href: '/admin/courses' },
          { label: course.data?.name ?? 'Kurs', href: `/admin/courses/${courseId}/edit` },
          { label: 'Moduli' },
        ]}
        title="Moduli"
        description={
          course.data ? `Redosled modula određuje kojim redom ih studenti otključavaju.` : undefined
        }
        actions={
          <Button
            href={`/admin/courses/${courseId}/modules/new`}
            variant="contained"
            startIcon={<AddIcon />}
          >
            Novi modul
          </Button>
        }
      />

      <ContentCard disablePadding>
        <QueryState
          query={modules}
          errorTitle="Module nije moguće učitati"
          isEmpty={(page) => page.data.length === 0}
          empty={
            <EmptyState
              title="Kurs još nema module"
              description="Dodajte prvi modul — redosled možete menjati kasnije."
              action={
                <Button
                  href={`/admin/courses/${courseId}/modules/new`}
                  variant="contained"
                  startIcon={<AddIcon />}
                >
                  Novi modul
                </Button>
              }
            />
          }
        >
          {(page) => (
            <Stack sx={{ p: 3 }} spacing={2}>
              {/* TODO(intern): replace this block with the real module list.
                  See instructions at the top of this file. */}
              <Alert severity="warning">
                <AlertTitle>Lista modula još nije napravljena</AlertTitle>
                Podaci se već učitavaju — ispod je privremeni prikaz. Uputstvo za izradu nalazi se u
                komentaru na vrhu <code>page.tsx</code>.
              </Alert>

              <Stack spacing={1}>
                {page.data.map((module, index) => (
                  <Typography key={module.id} variant="body2">
                    {index + 1}. {module.title}
                    {module.video_url ? ' · video' : ''}
                    {module.module_files.length > 0
                      ? ` · ${module.module_files.length} materijala`
                      : ''}
                  </Typography>
                ))}
              </Stack>
            </Stack>
          )}
        </QueryState>
      </ContentCard>
    </PageContainer>
  );
}
