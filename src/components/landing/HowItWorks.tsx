import Box from '@mui/material/Box';
import * as React from 'react';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

const STEPS = [
  {
    number: '01',
    title: 'Registracija',
    description:
      'Otvoriš račun u minuti i dobijaš pristup pregledu svih objavljenih kurseva, programa i uvodnih lekcija.',
  },
  {
    number: '02',
    title: 'Odabir kursa',
    description:
      'Upisuješ pojedinačne kurseve, bez obaveze i bez roka. Materijali ostaju dostupni i nakon što zavrsiš.',
  },
  {
    number: '03',
    title: 'Učenje i zadaci',
    description:
      'Prolaziš lekcije svojim tempom i predaješ zadatke kada ti odgovara. Predavač ih pregleda i piše konkretnu povratnu informaciju.',
  },
  {
    number: '04',
    title: 'Certifikat',
    description:
      'Kada su svi zadaci ocijenjeni i završni ispit položen, certifikat je odmah dostupan za preuzimanje i dijeljenje.',
  },
];

export default function HowItWorks() {
  return (
    <Box id="kako-funkcionise" sx={{ bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Stack spacing={1} sx={{ mb: 5 }}>
          <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
            Kako funkcionise
          </Typography>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>
            Četiri koraka od registracije do certifikata
          </Typography>
        </Stack>

        {/*
  Dividers are inserted manually (index > 0 && <Divider />) instead of
  using Stack's `divider` prop. `divider` works by cloning itself between
  each child via React.Children — but fed a mapped array of <Grid> items
  here, it caused React to throw "element type is invalid... undefined"
  at render time instead of a divider line. Wrapping each step in its own
  <React.Fragment key={...}> and placing the divider inside that fragment
  sidesteps the issue entirely and renders correctly.
*/}

        <Stack spacing={0}>
          {STEPS.map((step, index) => (
            <React.Fragment key={step.number}>
              {index > 0 && <Divider />}
              <Grid container spacing={2} sx={{ py: 3, alignItems: 'baseline' }}>
                <Grid size={{ xs: 3, md: 2 }}>
                  <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                    {step.number}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 9, md: 4 }}>
                  <Typography variant="h6" component="h3">
                    {step.title}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                  <Typography variant="body1" color="text.secondary">
                    {step.description}
                  </Typography>
                </Grid>
              </Grid>
            </React.Fragment>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
