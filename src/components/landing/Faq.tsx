import * as React from 'react';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import { BorderAllRounded } from '@mui/icons-material';
import Box from '@mui/material/Box';

/**
 * "Pitanja koja dobijamo najcesce" - FAQ section on the landing page.
 *
 * Static list, all answers shown open (matches the design mock).
 * Dividers between items are rendered manually, same pattern as
 * HowItWorks: each item wrapped in its own React.Fragment with a
 * conditional <Divider /> before all but the first, rather than relying
 * on Stacks's divider prop.
 */
const FAQS = [
  {
    question: 'Koliko traje pristup materijalima?',
    answer:
      'Pristup je trajan. Nakon što upišeš kurs, lekcije i materijali ostaju u tvom računu i poslije završetka.',
  },
  {
    question: 'Da li postoje fiksni rokovi i predavanja u realnom vremenu?',
    answer: 'Ne. Kursevi su asinhroni — učiš kada možeš. Jedini rokovi su oni koje sam postaviš.',
  },
  {
    question: 'Ko pregleda moje zadatke?',
    answer:
      'Predavač kursa ili njegov asistent. Povratnu informaciju u pravilu dobijaš u roku od 48 sati od predaje.',
  },
  {
    question: 'Šta je potrebno da dobijem certifikat?',
    answer:
      'Pregledani i prihvaćeni svi praktični zadaci i položen završni ispit. Certifikat se generiše automatski.',
  },
  {
    question: 'Kako se plaća?',
    answer:
      'Kartično plaćanje ili uplatnica, po kursu. Za firme i grupne upise izdajemo fakturu — placeholder, uslovi se dopunjuju.',
  },
];

export default function Faq() {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Divider sx={{ mb: { xs: 5, md: 6 } }} />

      <Grid container spacing={{ xs: 4, md: 6 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Box
          sx={{
            bgcolor: 'primary.main',
            color: 'primary.contrastText',
            borderRadius: 2,
            p: { xs: 3, md: 4 },
            height: '50%',
          }}
          >
            <Stack spacing={1}>
              <Typography variant="overline" sx={{ letterSpacing: 1.2, color: 'inherit', opacity: 0.85 }}>
                Česta pitanja
              </Typography>
              <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>
                 Pitanja koja dobijamo najčešće
              </Typography>
            </Stack>
          </Box>
        </Grid>

        <Grid size={{ xs: 12, md: 8 }}>
          <Stack spacing={0}>
            {FAQS.map((faq, index) => (
              <React.Fragment key={faq.question}>
                {index > 0 && <Divider />}
                <Stack spacing={1} sx={{ py: 3 }}>
                  <Typography variant="h6" component="h3">
                    {faq.question}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {faq.answer}
                  </Typography>
                </Stack>
              </React.Fragment>
            ))}
          </Stack>
        </Grid>
      </Grid>
    </Container>
  );
}
