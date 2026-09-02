import LegalDocumentPage from '@/components/layout/LegalDocumentPage';

export const metadata = {
  title: 'Uvjeti korištenja — Kursevi',
  description: 'Uvjeti korištenja platforme Kursevi.',
};

/**
 * Terms of service.
 *
 * The text lives in `legal_documents` (migration 0030) and is edited at
 * `/admin/settings/legal`, not in this file. It used to be a `<DraftPage>` with
 * a hardcoded outline — which meant correcting a legal document required a
 * deploy, the wrong trade for a text that changes in response to a lawyer or a
 * regulator.
 */
export default async function TermsPage() {
  return <LegalDocumentPage slug="terms" fallbackTitle="Uvjeti korištenja" />;
}
