import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import { SITE_NAME } from '@/lib/siteConfig';
/**
 *"zasto mi" - the credibility/differentiation section on the landing
* page. Left side: heading, intro paragraph, image placeholder. Right side:
* a 2x2 grid of short feature blurbs.
*
 *FEATURES below is a static content matching the design mock - no data
 *source needed, unlike FeaturedCourses.
*
 *The image on the left is a placeholder Box, same pattern as Hero's
 *illustration - swap for a real photo once available.
 */
const FEATURES = [
    {
        title: 'Certifikat po završetku',
        description:
        'Svaki certifikat nosi jedinstveni broj i javnu stranicu za provjeru, tako da ga poslodavac može potvrditi.',
    },
    {
        title: 'Povratna informacija predavača',
        description:
        'Zadatke pregleda čovjek iz struke i piše šta je dobro, šta nije i šta konkretno uraditi drugačije.',
    },
    {
        title: 'Akreditacije i partneri',
        description: 
        'Programi su rađeni s partnerskim firmama i institucijama iz svake oblasti.',
    },
    {
        title: 'Kako se provjerava znanje',
        description:
        'Kratki kvizovi nakon lekcija, praktični zadaci po modulima i završni ispit koji se ocjenjuje ručno.',
    },
];

export default function WhyUs() {
    return (
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
            <Divider sx={{ mb: { xs: 5, md: 6 } }} />

            <Grid container spacing={{ xs: 5, md: 6 }}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Stack spacing={3}>
                        <Stack spacing={1}>
                            <Typography variant="overline" color="primary" sx={{ letterSpacing: 1.2 }}>
                                Zašto {SITE_NAME}
                            </Typography>
                            <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 36 } }}>
                                Znanje koje se provjerava, ne samo gleda
                  
                            </Typography>
                        </Stack>

                        <Typography variant="body1" color="text.secondary">
                           Snimljene lekcije su početak. Ono što odvaja završen kurs od odgledanog kursa
                             je zadatak koji je neko pročitao i ocijenio. 
                        </Typography>

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
                              Fotografija: predavač / pregled zadatka (placeholder)  
                            </Typography>
                        </Box>
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Box sx={{ position: 'relative' }}>
                        <Grid container spacing={4}>
                            {FEATURES.map((feature) => (
                                <Grid key={feature.title} size={{ xs: 12, sm: 6 }}>
                                    <Stack spacing={1}>
                                        <Typography variant="h6" component="h3">
                                            {feature.title}
                                        </Typography>
                                        <Typography variant="body2" color="text.secondary">
                                            {feature.description}
                                        </Typography>
                                    </Stack>
                                    </Grid>
                            ))}
                        </Grid>
                        
                        {/* Vertical line between the two columns - desktop only,
                        mobile stacks to a single column and has nothing to divide. */}
                        <Divider
                        orientation="vertical"
                        sx={{
                            display: { xs: 'none', sm: 'block' },
                            position: 'absolute',
                            top: 0,
                            bottom: 0,
                            left: '50%',
                        }}
                        />

                        {/* Horizontal line between the two rows. */}
                        <Divider
                        sx={{
                            position: 'absolute',
                            left: 0,
                            right: 0,
                            top: '50%',
                        }}
                        />
                    </Box>
                </Grid>
            </Grid>
        </Container>
    )
}