'use client';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import ContentCard from '@/components/layout/ContentCard';
import Form from '@/components/form/Form';
import FormActions from '@/components/form/FormActions';
import FormNumberField from '@/components/form/FormNumberField';
import FormTextField from '@/components/form/FormTextField';
import { useZodForm } from '@/lib/forms/useZodForm';
import {
  moduleFormSchema,
  type ModuleFormInput,
  type ModuleFormValues,
} from '@/lib/schemas/module-form.schema';

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MODULE FORM — partially built. Read this whole comment before editing.
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * The fields below are finished and follow `CourseForm` exactly. What is left
 * is the **file attachments** section, which is marked TODO further down.
 *
 * ## The shape to copy
 *
 * This is the same contract `CourseForm` uses, and the reason it works:
 *   - the *component* owns the fields, their layout and their validation;
 *   - the *page* owns `onSubmit`, because creating and editing are different
 *     flows.
 * That split is what lets one component serve both pages without a
 * `mode="create" | "edit"` prop threading conditionals through the markup.
 *
 * ## The one rule that will bite you
 *
 * `defaultValues` is read **once, at mount**. The edit page must therefore
 * render this component *inside* its `<QueryState>`, never beside it — if it
 * mounts before the module has loaded, the fields start empty and stay empty
 * no matter what arrives later.
 *
 * ## Why there is no `course_id` field
 *
 * A module always belongs to the course in the URL. The page passes the id to
 * `toCreateModulePayload(values, courseId)` instead of hiding it in a form
 * field, so the relationship stays visible in the code.
 */
export default function ModuleForm({
  defaultValues,
  onSubmit,
  submitLabel,
  cancelHref,
  pendingLabel,
}: {
  defaultValues: Partial<ModuleFormInput>;
  onSubmit: (values: ModuleFormValues) => Promise<void>;
  submitLabel: string;
  cancelHref: string;
  pendingLabel?: string;
}) {
  const form = useZodForm(moduleFormSchema, { defaultValues });

  return (
    <Form form={form} onSubmit={onSubmit} pendingLabel={pendingLabel}>
      <ContentCard
        title="Osnovni podaci"
        description="Naslov i opis modula koje student vidi u listi kursa."
      >
        <Stack spacing={2}>
          <FormTextField
            name="title"
            label="Naslov modula"
            placeholder="npr. HTML i CSS osnove"
            required
          />
          <FormTextField
            name="description"
            label="Opis"
            placeholder="Šta student uči u ovom modulu."
            multiline
            rows={4}
          />
        </Stack>
      </ContentCard>

      <ContentCard title="Sadržaj">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 8 }}>
            <FormTextField
              name="video_url"
              label="Video URL"
              type="url"
              placeholder="https://…"
              helperText="Opciono. Ostavite prazno ako modul nema video."
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <FormNumberField
              name="order"
              label="Redni broj"
              min={0}
              step={1}
              helperText="Određuje redosled otključavanja."
              required
            />
          </Grid>
        </Grid>
      </ContentCard>

      {/*
       * ─────────────────────────────────────────────────────────────────────
       *  TODO(intern) #1 — Materijali (module_files)
       * ─────────────────────────────────────────────────────────────────────
       *
       * Replace the Alert below with a file list + upload control.
       *
       * This is a TWO-STEP save, exactly like the course thumbnail. Read
       * `src/app/(admin)/admin/courses/new/page.tsx` first — the reasoning is
       * written out there in full.
       *
       *   1. `useUploadFile()` → POST /api/admin/uploads
       *        bucket:  BUCKETS.moduleFiles
       *        folders: [courseId, moduleId]      ← BOTH ids, in this order
       *        returns: { path }
       *   2. `useCreateModuleFile()` → POST /api/admin/modules/:id/files
       *        body: { file_path: path, file_name: file.name }
       *
       * Step 1 puts the bytes in storage; step 2 records the row. Doing only
       * step 1 leaves an orphaned object that no screen will ever show.
       *
       * WHY THE FOLDER ORDER MATTERS: the storage RLS policy reads the *first*
       * path segment and checks `can_author_course()` against it. A path built
       * as `{module_id}/{course_id}/…` uploads without error and is then
       * unreadable by everyone, forever. Always build it with
       * `storagePath([courseId, moduleId], file.name)` from `@/lib/storage`.
       *
       * CONSEQUENCE FOR THIS COMPONENT: a module must already exist before it
       * can own files (the path needs its id). So on the **create** page this
       * section should be hidden or disabled, and files added from the edit
       * page afterwards. Take a `moduleId?: string` prop and render the
       * section only when it is present.
       *
       * Existing files come from `useCourseModules(courseId)` — each row is a
       * `ModuleWithFiles` and already carries `module_files[]`. There is no
       * separate "get one module" endpoint; see the note on the edit page.
       *
       * Deleting: `useDeleteModuleFile()` → DELETE /api/admin/module-files/:id.
       * Wrap it in `<ConfirmDialog>`; look at `CourseActions` for the pattern
       * of a component that owns its own mutation and confirmation.
       */}
      <ContentCard title="Materijali">
        <Alert severity="info">
          Dodavanje materijala još nije implementirano. Uputstvo se nalazi u komentaru u
          <code> src/components/modules/ModuleForm.tsx</code>.
        </Alert>
      </ContentCard>

      <FormActions submitLabel={submitLabel} cancelHref={cancelHref} />
    </Form>
  );
}
