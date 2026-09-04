// components/landing/Hero.tsx
import Image from 'next/image';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Hero section for the landing page — the first thing a visitor sees.
 *
 * The illustration fills the entire hero section edge-to-edge (both
 * where the text sits and beyond it), rather than living in its own
 * grid column. The text sits in its own solid-background Box, layered
 * on top via zIndex, so it stays readable against the photo underneath.
 *
 * Used once, at the top of `(marketing)/page.tsx`.
 */
export default function Hero() {
  return (
    <Box
      sx={{
        position: 'relative',
        borderTop: 3,
        borderColor: 'primary.main',
        minHeight: { xs: 480, md: 560 },
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {/* Full-width background image, spanning the entire hero. */}
      <Box sx={{ position: 'absolute', inset: 0 }}>
        <Image
          src="/hero-illustration.jpg"
          alt="Učenici u učionici podižu ruke"
          fill
          style={{ objectFit: 'cover' }}
          priority
        />
      </Box>

      <Container maxWidth="lg" sx={{ position: 'relative', zIndex: 1, py: { xs: 6, md: 8 } }}>
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            p: { xs: 3, md: 5 },
            maxWidth: 640,
            boxShadow: 4,
          }}
        >
          <Stack spacing={3}>
            <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
              Online kursevi · Certifikat · Povratna informacija predavača
            </Typography>

            <Typography variant="h1" sx={{ fontSize: { xs: 32, md: 48 }, lineHeight: 1.15 }}>
              Uči svojim tempom. Napreduj uz stvarnu povratnu informaciju.
            </Typography>

            <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 400 }}>
              Registruj se, odaberi kurs iz naše ponude i prolazi materijale kada tebi odgovara.
              Zadatke pregleda predavač, a po završetku dobijaš certifikat.
            </Typography>

            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
              <Button href="/register" variant="contained" size="large">
                Registruj se
              </Button>
              <Button
                href="/courses"
                variant="outlined"
                size="large"
                sx={{ borderColor: 'divider', color: 'text.primary' }}
              >
                Pregledaj kurseve
              </Button>
            </Stack>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
