import SupportOutlinedIcon from '@mui/icons-material/SupportOutlined';
import Button from '@mui/material/Button';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';
import DraftPage from '@/components/layout/DraftPage';

export const metadata = {
  title: 'Kontakt — Kursevi',
  description: 'Kako da stupite u kontakt sa timom platforme Kursevi.',
};

/**
 * Contact.
 *
 * The address and phone number are still to be supplied, but the *working*
 * channel already exists — signed-in users have the issue tracker, which is a
 * real conversation with the admins rather than an inbox nobody watches. So
 * this page points at it instead of leaving a visitor with nothing.
 */
export default function ContactPage() {
  return (
    <DraftPage
      title="Kontakt"
      description="Pitanja, problemi ili saradnja — javite nam se."
      sections={[
        'Email adresa i vrijeme odgovora',
        'Adresa i podaci o firmi',
        'Telefon, ako postoji',
        'Kontakt forma za posjetioce koji nisu prijavljeni',
      ]}
    >
      <ContentCard
        title="Već imate nalog?"
        description="Prijavljeni korisnici imaju direktan kanal ka administratorima."
      >
        <Stack spacing={2}>
          <Typography variant="body2" color="text.secondary">
            Pošaljite zahtjev i odgovaramo vam u istoj prepisci — vidite i status i sve odgovore na
            jednom mjestu.
          </Typography>
          <Stack direction="row">
            <Button href="/issues/new" variant="contained" startIcon={<SupportOutlinedIcon />}>
              Pošalji zahtjev
            </Button>
          </Stack>
        </Stack>
      </ContentCard>
    </DraftPage>
  );
}
