import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Moduli kursa — Admin' };

export default async function AdminCourseModulesPage(
  props: PageProps<'/admin/courses/[id]/modules'>,
) {
  const { id } = await props.params;

  return (
    <PlaceholderPage
      title="Moduli kursa"
      breadcrumbs={[{ label: 'Kursevi', href: '/admin/courses' }, { label: 'Moduli' }]}
      description={`Kurs: ${id}`}
      plannedWork={[
        'Lista modula u redosledu, sa promenom redosleda (useAdminModules).',
        'Forma za modul: naslov, opis, video URL, prilozi (FormImageUpload → useUploadFile).',
        'Kviz po modulu: pitanja i odgovori, tačan odgovor kao radio dugme (samo jedan tačan).',
        'Zadatak po modulu: tekst zadatka i prilozi.',
        'Redosled je bitan — studenti otključavaju module redom, po polju order.',
      ]}
    />
  );
}
