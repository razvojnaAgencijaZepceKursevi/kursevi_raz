import DraftPage from '@/components/layout/DraftPage';

export const metadata = {
  title: 'Uvjeti korištenja — Kursevi',
  description: 'Uvjeti korištenja platforme Kursevi.',
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
      title="Uvjeti korištenja"
      description="Pravila korištenja platforme, prava i obaveze korisnika."
      sections={[
        'Ko smo mi i na šta se ovi uvjeti odnose',
        'Otvaranje naloga i uvjeti korištenja',
        'Kupovina kursa, odobravanje pristupa i cijene',
        'Pravila povraćaja sredstava i otkazivanja',
        'Autorska prava nad materijalima kursa',
        'Pravila ponašanja i uklanjanje naloga',
        'Izdavanje certifikata i njihova važnost',
        'Odgovornost i ograničenja',
        'Izmjene uvjeta i kontakt',
      ]}
    />
  );
}
