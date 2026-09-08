import type { SvgIconComponent } from '@mui/icons-material';
import FactCheckOutlinedIcon from '@mui/icons-material/FactCheckOutlined';
import HandshakeOutlinedIcon from '@mui/icons-material/HandshakeOutlined';
import RateReviewOutlinedIcon from '@mui/icons-material/RateReviewOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Reveal from '@/components/landing/Reveal';
import Section from '@/components/landing/Section';
import { SITE_NAME } from '@/lib/siteConfig';

/**
 * "Zašto Katedra" — the credibility section. A brand-coloured statement panel
 * on the left, four short differentiators on the right.
 *
 * Static content: unlike `<FeaturedCourses>` there is no data source, and no
 * reason for one.
 *
 * ## Tiles, not the cross-divider hack
 *
 * The four blurbs used to be a bare 2×2 grid with two absolutely-positioned
 * dividers laid across it at 50%. That only lines up while both rows happen to
 * be the same height — the moment one description wraps to an extra line the
 * horizontal rule cuts through text. They are now tiles with their own border,
 * which cannot come apart, and which also gives each one somewhere to put an
 * icon. The icons are the actual gain: this is the one section a visitor scans
 * rather than reads, and four identical paragraphs of grey text do not scan.
 *
 * It keeps the `paper` band so its tiles read as raised off the page, the same
 * way the course cards do.
 */
const FEATURES: { title: string; description: string; icon: SvgIconComponent }[] = [
  {
    icon: WorkspacePremiumOutlinedIcon,
    title: 'Certifikat po završetku',
    description:
      'Svaki certifikat nosi jedinstveni broj i stranicu za provjeru, tako da ga poslodavac može potvrditi.',
  },
  {
    icon: RateReviewOutlinedIcon,
    title: 'Povratna informacija predavača',
    description:
      'Zadatke pregleda čovjek iz struke i piše šta je dobro, šta nije i šta konkretno uraditi drugačije.',
  },
  {
    icon: HandshakeOutlinedIcon,
    title: 'Akreditacije i partneri',
    description: 'Programi su rađeni s partnerskim firmama i institucijama iz svake oblasti.',
  },
  {
    icon: FactCheckOutlinedIcon,
    title: 'Kako se provjerava znanje',
    description:
      'Kratki kvizovi nakon lekcija, praktični zadaci po modulima i završni ispit koji se ocjenjuje ručno.',
  },
];

export default function WhyUs() {
  return (
    <Section tone="paper">
      <Grid container spacing={{ xs: 4, md: 6 }} sx={{ alignItems: 'stretch' }}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Reveal sx={{ height: '100%' }}>
            <Box
              sx={{
                height: '100%',
                borderRadius: 3,
                p: { xs: 3, md: 4 },
                color: 'primary.contrastText',
                // Same restraint as the closing banner: brand blue with the
                // secondary only creeping in at the bottom corner.
                backgroundImage:
                  'linear-gradient(155deg, var(--mui-palette-primary-main), var(--mui-palette-primary-dark) 65%, var(--mui-palette-secondary-dark) 135%)',
              }}
            >
              <Stack spacing={3} sx={{ height: '100%', justifyContent: 'center' }}>
                <Stack spacing={1.5}>
                  <Typography
                    variant="overline"
                    sx={{ letterSpacing: 1.2, color: 'inherit', opacity: 0.85 }}
                  >
                    Zašto {SITE_NAME}
                  </Typography>
                  <Typography variant="h3" sx={{ fontSize: { xs: 28, md: 38 } }}>
                    Znanje koje se provjerava, ne samo gleda
                  </Typography>
                </Stack>

                <Typography variant="body1" sx={{ opacity: 0.9 }}>
                  Snimljene lekcije su početak. Ono što odvaja završen kurs od odgledanog kursa je
                  zadatak koji je neko pročitao i ocijenio.
                </Typography>
              </Stack>
            </Box>
          </Reveal>
        </Grid>

        <Grid size={{ xs: 12, md: 7 }}>
          <Grid container spacing={2.5}>
            {FEATURES.map((feature, index) => (
              <Grid key={feature.title} size={{ xs: 12, sm: 6 }}>
                <Reveal delay={index * 70} sx={{ height: '100%' }}>
                  <Stack
                    spacing={1.5}
                    sx={{
                      height: '100%',
                      p: 2.5,
                      borderRadius: 2,
                      border: 1,
                      borderColor: 'divider',
                      transition: 'border-color 160ms ease, background-color 160ms ease',
                      '&:hover': { borderColor: 'primary.main', bgcolor: 'action.hover' },
                      '@media (prefers-reduced-motion: reduce)': { transition: 'none' },
                    }}
                  >
                    <Box
                      sx={{
                        display: 'grid',
                        placeItems: 'center',
                        width: 38,
                        height: 38,
                        borderRadius: 1.5,
                        bgcolor: 'action.hover',
                        color: 'primary.main',
                      }}
                    >
                      <feature.icon fontSize="small" />
                    </Box>

                    <Typography variant="h6" component="h3">
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.description}
                    </Typography>
                  </Stack>
                </Reveal>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Section>
  );
}
