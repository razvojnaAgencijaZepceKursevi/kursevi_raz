import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Izmena kursa — Admin' };

/**
 * `params` is a Promise in this version of Next — it must be awaited, and
 * `PageProps<'/route'>` types it from the folder structure with no manual
 * annotation. See `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/page.md`.
 */
export default async function AdminCourseEditPage(props: PageProps<'/admin/courses/[id]/edit'>) {
  const { id } = await props.params;

  return (
    <PlaceholderPage
      title="Izmena kursa"
      breadcrumbs={[{ label: 'Kursevi', href: '/admin/courses' }, { label: 'Izmena kursa' }]}
      description={`Kurs: ${id}`}
      plannedWork={[
        'Ista forma kao kreiranje kursa — CourseForm se ponovo koristi, bez kopiranja.',
        'Učitati kurs sa useAdminCourse(id) i popuniti formu preko courseToFormValues().',
        'Čuvanje ide na useUpdateCourse; naslovna slika se šalje na useUploadFile pa upisuje u thumbnail_path.',
        'Brisanje kursa uz ConfirmDialog (useDeleteCourse) — briše i module, kvizove i zadatke.',
      ]}
    />
  );
}
