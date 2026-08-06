import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Korisnici — Admin' };

export default function AdminUsersPage() {
  return (
    <PlaceholderPage
      title="Korisnici"
      description="Pregled registrovanih korisnika."
      plannedWork={[
        'Lista sa pretragom: ime, email, uloga (useAdminUsers).',
        'Stranica je za sada samo za pregled.',
        'Uloge se menjaju ručno kroz Supabase dashboard, ne kroz ovaj ekran.',
      ]}
    />
  );
}
