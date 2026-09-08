import Grid from '@mui/material/Grid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import AnimatedNumber from '@/components/landing/AnimatedNumber';
import Section from '@/components/landing/Section';

/**
 * Row of headline stats, shown directly under the hero.
 *
 * Numbers are hardcoded placeholders (see STATS below) — swap them for real
 * figures, or a hook pulling actual data, once that exists.
 *
 * ## It used to be invisible
 *
 * The strip was painted `grey.50` (#fafafa) on a `background.default` page
 * (#f7f8fa). Those are the same colour to any eye, so what was meant to read as
 * a band read as four numbers loose on the page — and with only `pt` set, the
 * band ended flush against the bottom of the labels. It is now a `tint`
 * `<Section>`: a faint wash of the brand colour, which is the one place on the
 * page that gets it, and hairline rules between the figures so the four read as
 * a set rather than as a row of unrelated facts.
 *
 * Used once, directly after `<Hero />` in `(marketing)/page.tsx`.
 */
const STATS = [
  { target: 42, suffix: '', thousands: false, label: 'OBJAVLJENA KURSA U PET OBLASTI' },
  { target: 6800, suffix: '', thousands: true, label: 'REGISTROVANIH STUDENATA' },
  { target: 48, suffix: 'h', thousands: false, label: 'ROK ZA PREGLED PREDANOG ZADATKA' },
  { target: 91, suffix: '%', thousands: false, label: 'STUDENATA ZAVRŠI UPISANI KURS' },
];

export default function StatsBar() {
  return (
    <Section tone="tint" py={{ xs: 5, md: 6 }}>
      <Grid container spacing={{ xs: 4, sm: 3 }}>
        {STATS.map((stat, index) => (
          <Grid key={stat.label} size={{ xs: 6, md: 3 }}>
            <Stack
              spacing={0.75}
              sx={{
                /*
                 * A rule to the left of every figure but the first. On mobile
                 * the grid is two columns, so the rule would land in the middle
                 * of the row for items 1 and 3 — hence the breakpoint. Drawn as
                 * a border rather than a <Divider> so it stretches with the
                 * cell instead of needing a fixed height.
                 */
                pl: { xs: 0, md: index === 0 ? 0 : 3 },
                borderLeft: { xs: 0, md: index === 0 ? 0 : 1 },
                borderColor: { md: 'divider' },
              }}
            >
              <Typography
                variant="h1"
                color="primary"
                sx={{ fontWeight: 700, fontSize: { xs: 34, md: 44 }, lineHeight: 1 }}
              >
                <AnimatedNumber
                  target={stat.target}
                  suffix={stat.suffix}
                  thousands={stat.thousands}
                />
              </Typography>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ letterSpacing: 0.5, fontWeight: 600 }}
              >
                {stat.label}
              </Typography>
            </Stack>
          </Grid>
        ))}
      </Grid>
    </Section>
  );
}
