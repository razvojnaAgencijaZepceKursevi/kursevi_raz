import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Zahtevi za kupovinu — Admin' };

export default function AdminPurchasesPage() {
  return (
    <PlaceholderPage
      title="Zahtevi za kupovinu"
      description="Pregled i odobravanje zahteva studenata za pristup kursevima."
      plannedWork={[
        'Lista zahteva sa filterom po statusu (useAdminPurchases).',
        'Akcije odobri/odbij po redu (useApprovePurchase / useDenyPurchase).',
        'Odobrenje otvara pristup kursu — potvrda pre akcije je obavezna.',
      ]}
    />
  );
}
