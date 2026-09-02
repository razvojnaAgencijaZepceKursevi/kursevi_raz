import { BorderColor } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Closing full-width call-to-action banner on the landing page.
 *
 * Uses 'bgcolor: 'primary.main'' / 'color: 'primary.contrastText'' rather
 * than a hardcoded red, so it automatically follows the theme's primary
 * color once that's changed from the current blue placeholder.
 */
export default function CtaBanner() {
  return (
    <Box sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <Stack spacing={3}>
          <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 40 }, fontWeight: 700 }}>
            Prvi korak je račun. Ostalo ide tvojim tempom.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
            <Button
              href="/register"
              variant="outlined"
              size="large"
              sx={{
                color: 'inherit',
                borderColor: 'currentColor',
                '&:hover': { borderColor: 'currentColor', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Registruj se
            </Button>
            <Button
              href="/kontakt"
              variant="outlined"
              size="large"
              sx={{
                color: 'inherit',
                borderColor: 'currentColor',
                '&:hover': { BorderColor: 'currentColor', bgcolor: 'rgba(255,255,255,0.1)' },
              }}
            >
              Kontaktiraj nas
            </Button>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}
