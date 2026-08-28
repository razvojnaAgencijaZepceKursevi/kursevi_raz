import Box from '@mui/material/Box';
import Button from'@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Hero section for the landing page - the first thing a visitor sees.
 * 
 * Headline, subtitle and two CTAs ("Registruj se" / "Pregledaj kurseve") on the left,
 * an illustration on the right. Stacks to a single column on mobile via the Grid's xs/md breakpoints.
 * 
 * The illustration is a placeholder 'Box' for now - it needs to be swapped for a real image once it is available.
 * No other changes are needed for this component.
 */
export default function Hero() {
    return (
        <Box sx={{ borderTop: 3, borderColor: 'primary.main' }}>
            <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
                <Grid container spacing={4} sx={{ alignItems: 'center' }}>
                    <Grid size={{ xs: 12, md: 6 }}>
                        <Stack spacing={3}>
                            <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
                                Online kursevi · Certifikat · Povratna informacija predavača
                            </Typography>

                            <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 52 }, lineHeight: 1.15 }}>
                                Uči svojim tempom. Napreduj uz stvarnu povratnu informaciju.
                            </Typography>

                            <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 400 }}>
                                Registruj se, odaberi kurs iz naše ponude i prolazi materijale kada tebi
                                odgovara. Zadatke pregleda predavač, a po završetku dobijaš certifikat. 
                            </Typography>

                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ pt: 1 }}>
                                <Button href="/register" variant="contained" size="large">
                                Registruj se 
                                </Button>
                                <Button href="/courses" size="large" color="inherit">
                                Pregledaj kurseve 
                                </Button>
                            </Stack>
                        </Stack>
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                        <Box 
                        sx={{
                            aspectRatio: '4 / 3',
                            bgcolor: 'grey.100',
                            borderRadius: 2,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                        }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                Ilustracija (placeholder)
                            </Typography>
                        </Box>
                    </Grid>
                </Grid>
            </Container>
        </Box>
    );
}