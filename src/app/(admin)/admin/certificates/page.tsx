import PlaceholderPage from '@/components/layout/PlaceholderPage';

export const metadata = { title: 'Sertifikati — Admin' };

export default function AdminCertificatesPage() {
  return (
    <PlaceholderPage
      title="Sertifikati"
      description="Izdati sertifikati i zahtevi za slanje štampane verzije."
      plannedWork={[
        'Lista sertifikata sa filterom po zahtevu za dostavu (useAdminCertificates).',
        'Prikaz readable_id, kursa i studenta.',
        'Napomena: polje za „isporučeno” ne postoji u šemi — dodavanje je izmena baze, ne rešava se na klijentu.',
      ]}
    />
  );
}
