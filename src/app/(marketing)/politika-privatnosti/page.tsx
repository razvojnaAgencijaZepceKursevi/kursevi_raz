import DraftPage from '@/components/layout/DraftPage';

export const metadata = {
  title: 'Politika privatnosti — Kursevi',
  description: 'Kako platforma Kursevi prikuplja i koristi podatke korisnika.',
};

/**
 * Privacy policy.
 *
 * Empty for the same reason as the terms — and with one extra consideration:
 * this document has to describe what the system *actually* does with data, so
 * whoever writes it needs to read the schema, not a template. The outline below
 * lists what this application genuinely collects.
 */
export default function PrivacyPage() {
  return (
    <DraftPage
      title="Politika privatnosti"
      description="Koje podatke prikupljamo, zašto ih prikupljamo i kako ih koristimo."
      sections={[
        'Koje podatke prikupljamo (ime, email, napredak kroz kurseve, predata rješenja)',
        'Zašto ih prikupljamo i pravni osnov',
        'Obavještenja putem email-a i kako ih isključiti',
        'Ko ima pristup podacima (administratori, predavači na svom kursu)',
        'Koliko dugo čuvamo podatke',
        'Kolačići i tehnologije praćenja',
        'Obrađivači podataka koje koristimo (Supabase, Resend)',
        'Prava korisnika: pristup, ispravka i brisanje podataka',
        'Kontakt za pitanja o privatnosti',
      ]}
    />
  );
}
