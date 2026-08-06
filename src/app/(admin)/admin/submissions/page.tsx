import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Predati zadaci — Admin' };

export default function AdminSubmissionsPage() {
  return (
    <PlaceholderPage
      title="Predati zadaci"
      description="Pregled predatih zadataka i komunikacija sa studentima."
      plannedWork={[
        'Lista predatih zadataka sa filterom po statusu, kursu i studentu.',
        'Prikaz konverzacije po predaji, sa prilozima (useSubmissionMessages).',
        'Odgovor uz promenu statusa: pending / needs_revision / approved.',
        'Otvoreno pitanje: zasebna stranica ili modal — odlučiti pri izradi.',
      ]}
    />
  );
}
