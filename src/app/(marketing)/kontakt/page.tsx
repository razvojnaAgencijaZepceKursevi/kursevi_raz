import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContactForm from '@/components/contact/ContactForm';

export const metadata = {
  title: 'Kontakt - Kursevi',
  description: 'Kako da stupite u kontakt sa timom platforme Kursevi.',
};

/**
 * Contact page - form on the left, direct contact details and a few
 * "read this first" links on the right.
 *
 * Phone number and support email below are placeholders (same
 * placeholder as used in PublicFooter) - swap both once real
 * details are confirmed.
 *
 * The form itself lives in <ContactForm> (a Client Component, for its
 * local state); this page stays a Server Component around it.
 */
export default function ContactPage() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Stack spacing={1} sx={{ mb: 5, maxWidth: 640 }}>
        <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
          Kontakt
        </Typography>
        <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>
          Pitaj nas prije nego se upišeš
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Odgovaramo radnim danima, u pravilu u toku istog dana. Za pitanja o pojedinom kursu navedi
          njegov naziv da odgovor stigne od predavača.
        </Typography>
      </Stack>

      <Divider sx={{ mb: { xs: 5, md: 6 } }} />

      <Grid container spacing={{ xs: 5, md: 6 }}>
        <Grid size={{ xs: 12, md: 7 }}>
          <ContactForm />
        </Grid>

        <Grid size={{ xs: 12, md: 5 }}>
          <Stack spacing={4}>
            <Stack spacing={2.5}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
                Direktan kontakt
              </Typography>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Opšti upiti
                </Typography>
                <Link href="mailto:info@katedra.ba" variant="h6" underline="hover">
                  info@katedra.ba
                </Link>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Podrška studentima
                </Typography>
                <Link href="mailto:podrska@katedra.ba" variant="h6" underline="hover">
                  podrska@katedra.ba
                </Link>
              </Stack>

              <Stack spacing={0.5}>
                <Typography variant="body2" color="text.secondary">
                  Telefon
                </Typography>
                <Link href="tel:+38733000000" variant="h6" underline="hover">
                  +387 33 000 000
                </Link>
                <Typography variant="body2" color="text.secondary">
                  Ponedjeljak – petak, 09:00 – 17:00
                </Typography>
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={1.5}>
              <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
                Prije nego pišeš
              </Typography>

              <Stack spacing={1}>
                <Link href="/#kako-funkcionise" underline="hover" color="text.primary">
                  Kako funkcioniše upis i učenje
                </Link>
                <Link href="/courses" underline="hover" color="text.primary">
                  Pregled objavljenih kurseva
                </Link>
                <Link href="/#cesta-pitanja" underline="hover" color="text.primary">
                  Česta pitanja o certifikatu
                </Link>
                <Link href="/uvjeti-koristenja" underline="hover" color="text.primary">
                  Uslovi korištenja i plaćanje
                </Link>
                <Link href="/politika-privatnosti" underline="hover" color="text.primary">
                  Politika privatnosti
                </Link>
              </Stack>
            </Stack>
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
