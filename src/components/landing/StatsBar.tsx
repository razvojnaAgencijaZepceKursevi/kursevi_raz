import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Row of headline stats  shown right under the Hero on the landing page.
 *
 * Numbers are hardcoded placeholders for now (see STATS below) -
 * swap them for real figures (or a hook pulling actual data ) once it exists.
 *
 * Used once, directly after <Hero /> in (marketing)/page.tsx.
 */
const STATS = [
  { value: '42', label: 'OBJAVLJENA KURSA U PET OBLASTI' },
  { value: '6.800', label: 'REGISTROVANIH STUDENATA' },
  { value: '48h', label: 'ROK ZA PREGLED PREDANOG ZADATKA' },
  { value: '91%', label: 'STUDENATA ZAVRŠI UPISANI KURS' },
];

export default function StatsBar() {
  return (
    <Box sx={{ bgcolor: 'grey.50' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 6 } }}>
        <Grid container spacing={{ xs: 4, sm: 3 }}>
          {STATS.map((stat) => (
            <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
              <Stack spacing={0.5}>
                <Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
                  {stat.value}
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ letterSpacing: 0.5 }}>
                  {stat.label}
                </Typography>
              </Stack>
            </Grid>
          ))}
        </Grid>

      </Container>
    </Box>
  );
}
