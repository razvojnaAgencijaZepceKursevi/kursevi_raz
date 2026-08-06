import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Kategorije — Admin' };

export default function AdminCategoriesPage() {
  return (
    <PlaceholderPage
      title="Kategorije"
      description="Kategorije po kojima se kursevi grupišu i filtriraju."
      plannedWork={[
        'Lista kategorija sa brojem kurseva po kategoriji (useCategories).',
        'Kreiranje i izmena kategorije — kratka forma, verovatno u modalu.',
        'Brisanje uz potvrdu (ConfirmDialog); voditi računa o kursevima koji je koriste.',
      ]}
    />
  );
}
