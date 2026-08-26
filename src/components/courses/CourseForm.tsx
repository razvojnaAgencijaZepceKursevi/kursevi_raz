'use client';

import Alert from '@mui/material/Alert';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import ContentCard from '@/components/layout/ContentCard';
import Form from '@/components/form/Form';
import FormActions from '@/components/form/FormActions';
import FormImageUpload from '@/components/form/FormImageUpload';
import FormNumberField from '@/components/form/FormNumberField';
import FormSelect from '@/components/form/FormSelect';
import FormSwitch from '@/components/form/FormSwitch';
import FormTextField from '@/components/form/FormTextField';
import { useCategoryOptions } from '@/hooks/useCategories';
import { useZodForm } from '@/lib/forms/useZodForm';
import {
  courseFormSchema,
  type CourseFormInput,
  type CourseFormValues,
} from '@/lib/schemas/course-form.schema';

/**
 * The course form — used by both the create and the edit page.
 *
 * It owns the fields, their layout and their validation. It does **not** own
 * what happens on save: the caller passes `onSubmit`, because creating and
 * editing are genuinely different flows (one has to create the record before it
 * can attach a thumbnail; the other doesn't). Splitting the responsibility here
 * is what lets one component serve both without a `mode="create" | "edit"` prop
 * threading conditionals through the markup.
 *
 * `defaultValues` is read once, when the form mounts. An edit page must
 * therefore render this only after its course has loaded — inside the
 * `<QueryState>`, not beside it — or the fields mount empty and stay empty.
 */
export default function CourseForm({
  defaultValues,
  onSubmit,
  submitLabel,
  cancelHref = '/admin/courses',
  /** Existing thumbnail to preview on the edit page. */
  currentThumbnailUrl,
  pendingLabel,
  /**
   * Whether this user may publish. False for teachers — the database trigger
   * from migration 0016 rejects the write, so offering the toggle would only
   * produce a permission error at save time.
   */
  canPublish = true,
  /**
   * Whether to expose the public URL slug. Edit only — on create the database
   * derives it from the name, so an empty box there would just be a chance to
   * get it wrong before the course even exists.
   */
  showSlugField = false,
}: {
  defaultValues: Partial<CourseFormInput>;
  onSubmit: (values: CourseFormValues) => Promise<void>;
  submitLabel: string;
  cancelHref?: string;
  currentThumbnailUrl?: string | null;
  pendingLabel?: string;
  canPublish?: boolean;
  showSlugField?: boolean;
}) {
  const form = useZodForm(courseFormSchema, { defaultValues });
  const categories = useCategoryOptions();

  return (
    <Form form={form} onSubmit={onSubmit} pendingLabel={pendingLabel}>
      <ContentCard title="Osnovni podaci" description="Naziv i opis koje studenti vide na kursu.">
        <Stack spacing={2}>
          <FormTextField
            name="name"
            label="Naziv kursa"
            placeholder="npr. Uvod u web programiranje"
            required
          />
          <FormTextField
            name="description"
            label="Opis"
            placeholder="Šta student uči na ovom kursu i kome je namenjen."
            helperText="Prikazuje se na stranici kursa. Nije obavezan, ali pomaže pri odluci o kupovini."
            multiline
            rows={5}
          />
        </Stack>
      </ContentCard>

      <ContentCard title="Kategorija i cena">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormSelect
              name="category_id"
              label="Kategorija"
              options={categories.options}
              emptyOptionLabel="Bez kategorije"
              loading={categories.isPending}
              helperText={
                categories.isError
                  ? 'Kategorije nije bilo moguće učitati.'
                  : 'Koristi se za filtriranje kurseva.'
              }
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <FormNumberField
              name="price"
              label="Cena"
              suffix="KM"
              min={0}
              // Marks, not dinars — courses land in the tens-to-hundreds, so the
              // spinner steps by 10 rather than 100.
              step={10}
              helperText="Unesite 0 za besplatan kurs."
              required
            />
          </Grid>
        </Grid>
      </ContentCard>

      {showSlugField ? (
        <ContentCard
          title="Adresa stranice"
          description="Deo URL-a po kojem je kurs dostupan javno."
        >
          <Stack spacing={2}>
            <FormTextField
              name="slug"
              label="Adresa (slug)"
              placeholder="uvod-u-web-programiranje"
              helperText="Ostavite prazno da se adresa ponovo generiše iz naziva kursa."
            />
            <Alert severity="warning">
              Promena adrese menja javni link ka kursu. Stari link prestaje da radi, pa ga nemojte
              menjati ako je već negde podeljen. Preimenovanje kursa samo po sebi ne menja adresu.
            </Alert>
          </Stack>
        </ContentCard>
      ) : null}

      <ContentCard title="Naslovna slika" description="Prikazuje se na kartici kursa u katalogu.">
        <FormImageUpload
          name="thumbnail"
          label="Slika kursa"
          currentImageUrl={currentThumbnailUrl}
        />
      </ContentCard>

      <ContentCard title="Vidljivost">
        {canPublish ? (
          <FormSwitch
            name="published"
            label="Objavi kurs"
            description="Objavljeni kursevi su vidljivi svim posetiocima i mogu se kupiti. Nacrti su vidljivi samo vama i administratorima."
          />
        ) : (
          <Alert severity="info">
            Kurs se čuva kao nacrt. Objavljivanje kursa radi administrator — javite se kada sadržaj
            bude spreman.
          </Alert>
        )}
      </ContentCard>

      <FormActions submitLabel={submitLabel} cancelHref={cancelHref} />
    </Form>
  );
}
