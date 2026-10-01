import LegalDocumentPage from '@/components/layout/LegalDocumentPage';
import { SITE } from '@/lib/siteConfig';
import { pageMetadata } from '@/lib/seo';

export const metadata = pageMetadata({
  title: 'Politika privatnosti',
  description: `Koje podatke platforma ${SITE.name} prikuplja, zašto ih koristi, koliko dugo ih čuva i kako se može zatražiti uvid ili brisanje.`,
  path: '/politika-privatnosti',
});

/** Privacy policy — stored in `legal_documents`, edited at `/admin/settings/legal`. */
export default async function PrivacyPage() {
  return <LegalDocumentPage slug="privacy" fallbackTitle="Politika privatnosti" />;
}
