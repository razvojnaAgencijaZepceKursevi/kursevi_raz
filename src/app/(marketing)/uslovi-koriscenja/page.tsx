import DraftPage from '@/components/layout/DraftPage';

export const metadata = {
  title: 'Uslovi korišćenja — Kursevi',
  description: 'Uslovi korišćenja platforme Kursevi.',
};

/**
 * Terms of service.
 *
 * Deliberately empty rather than filled with plausible-sounding boilerplate:
 * this is the document that governs what the platform may do with someone's
 * money and their work, and invented text here would be worse than none.
 */
export default function TermsPage() {
  return (
    <DraftPage
      title="Uslovi korišćenja"
      description="Pravila korišćenja platforme, prava i obaveze korisnika."
      sections={[
        'Ko smo mi i na šta se ovi uslovi odnose',
        'Otvaranje naloga i uslovi korišćenja',
        'Kupovina kursa, odobravanje pristupa i cene',
        'Pravila povraćaja sredstava i otkazivanja',
        'Autorska prava nad materijalima kursa',
        'Pravila ponašanja i uklanjanje naloga',
        'Izdavanje sertifikata i njihova važnost',
        'Odgovornost i ograničenja',
        'Izmene uslova i kontakt',
      ]}
    />
  );
}
