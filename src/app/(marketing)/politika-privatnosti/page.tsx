import LegalDocumentPage from '@/components/layout/LegalDocumentPage';

export const metadata = {
  title: 'Politika privatnosti — Kursevi',
  description: 'Kako platforma Kursevi prikuplja i koristi podatke korisnika.',
};

/** Privacy policy — stored in `legal_documents`, edited at `/admin/settings/legal`. */
export default async function PrivacyPage() {
  return <LegalDocumentPage slug="privacy" fallbackTitle="Politika privatnosti" />;
}
