import AssignmentTurnedInOutlinedIcon from '@mui/icons-material/AssignmentTurnedInOutlined';
import PlayCircleOutlinedIcon from '@mui/icons-material/PlayCircleOutlined';
import WorkspacePremiumOutlinedIcon from '@mui/icons-material/WorkspacePremiumOutlined';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Container from '@mui/material/Container';
import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import ContentCard from '@/components/layout/ContentCard';

export const metadata = {
  title: 'Kursevi — online kursevi sa certifikatom',
  description:
    'Online kursevi sa video lekcijama, materijalima, zadacima i certifikatom po završetku.',
};

/**
 * The landing page — `/`.
 *
 * ## It used to redirect to /login, and that was the biggest hole in the app
 *
 * A visitor who typed the domain got a login form: no way to find out what the
 * platform was, and no route to the catalogue that had been public all along.
 * This replaces it with a real entry point.
 *
 * ## Structure now, copy later
 *
 * The sections below are the skeleton — a hero, what a course involves, and a
 * closing call to action. The wording is placeholder marketing text and is
 * expected to be rewritten; the *shape* is what was missing. Unlike the legal
 * pages it is not left empty, because a blank home page is worse than a
 * provisional one, and nothing here can mislead anybody the way invented terms
 * of service could.
 *
 * A Server Component: it is static, so the first page a stranger sees costs no
 * JavaScript and is fully crawlable.
 *
 * Open question left for the owner: what a **signed-in** visitor should see
 * here — this page, or a redirect to `landingPathForRole`. Right now they get
 * this page, and the header already offers the way into their own area.
 */
const FEATURES = [
  {
    icon: PlayCircleOutlinedIcon,
    title: 'Video lekcije i materijali',
    body: 'Svaki modul nosi video lekciju i prateće materijale koje čitate direktno u aplikaciji.',
  },
  {
    icon: AssignmentTurnedInOutlinedIcon,
    title: 'Kvizovi i zadaci',
    body: 'Znanje provjeravate kvizom, a praktične zadatke predajete predavaču koji ih pregleda i odgovara vam.',
  },
  {
    icon: WorkspacePremiumOutlinedIcon,
    title: 'Certifikat po završetku',
    body: 'Kada završite sve module, dobijate certifikat u PDF-u — a možete zatražiti i štampani primjerak.',
  },
];

export default function LandingPage() {
  return (
    <>
      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
        <Stack spacing={3} sx={{ maxWidth: 720 }}>
          <Typography variant="h1" sx={{ fontSize: { xs: 36, md: 52 }, lineHeight: 1.15 }}>
            Naučite nešto novo, korak po korak
          </Typography>
          <Typography variant="h6" component="p" color="text.secondary" sx={{ fontWeight: 400 }}>
            Kursevi sa jasnim redoslijedom modula, praktičnim zadacima i predavačem koji prati vaš
            napredak. Bez žurbe i bez preskakanja.
          </Typography>

          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} sx={{ pt: 1 }}>
            <Button href="/courses" variant="contained" size="large">
              Pogledaj kurseve
            </Button>
            <Button href="/register" size="large" color="inherit">
              Napravi nalog
            </Button>
          </Stack>
        </Stack>
      </Container>

      <Box sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider' }}>
        <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
          <Grid container spacing={3}>
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <Grid key={feature.title} size={{ xs: 12, md: 4 }}>
                  <ContentCard>
                    <Stack spacing={1.5}>
                      <Icon color="primary" sx={{ fontSize: 32 }} />
                      <Typography variant="h6" component="h2">
                        {feature.title}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {feature.body}
                      </Typography>
                    </Stack>
                  </ContentCard>
                </Grid>
              );
            })}
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
        <ContentCard>
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={3}
            sx={{ alignItems: { md: 'center' } }}
          >
            <Stack spacing={1} sx={{ flex: 1 }}>
              <Typography variant="h5" component="h2">
                Spremni da počnete?
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pogledajte katalog i zatražite pristup kursu koji vam odgovara.
              </Typography>
            </Stack>
            <Button href="/courses" variant="contained" size="large" sx={{ flexShrink: 0 }}>
              Katalog kurseva
            </Button>
          </Stack>
        </ContentCard>
      </Container>
    </>
  );
}
