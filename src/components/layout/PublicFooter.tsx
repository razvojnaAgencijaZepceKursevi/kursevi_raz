import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

/**
 * Footer for the public pages.
 *
 * It exists mainly so the legal and contact pages are reachable at all — they
 * are the kind of page nobody navigates *to*, only ever finds at the bottom of
 * something else. A Server Component: it is a list of links and nothing more,
 * so it costs no JavaScript.
 *
 * `(marketing)/layout.tsx` renders it once for every public page. It is
 * deliberately absent from the signed-in shells, which have their own
 * navigation and no use for a marketing footer.
 */
const SECTIONS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Kursevi',
    links: [
      { label: 'Svi kursevi', href: '/courses' },
      { label: 'Blog', href: '/blog' },
    ],
  },
  {
    title: 'Informacije',
    links: [
      { label: 'Kontakt', href: '/kontakt' },
      { label: 'Uvjeti korištenja', href: '/uvjeti-koristenja' },
      { label: 'Politika privatnosti', href: '/politika-privatnosti' },
    ],
  },
  {
    title: 'Nalog',
    links: [
      { label: 'Prijava', href: '/login' },
      { label: 'Registracija', href: '/register' },
    ],
  },
];

export default function PublicFooter() {
  return (
    <Box component="footer" sx={{ mt: 8, borderTop: 1, borderColor: 'divider' }}>
      <Container maxWidth="lg" sx={{ py: 5 }}>
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={{ xs: 4, sm: 6 }}
          sx={{ justifyContent: 'space-between' }}
        >
          <Stack spacing={1} sx={{ maxWidth: 280 }}>
            <Typography variant="h6" component="p">
              Kursevi
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Online kursevi sa praćenjem napretka, zadacima i certifikatom po završetku.
            </Typography>
          </Stack>

          {SECTIONS.map((section) => (
            <Stack key={section.title} spacing={1}>
              <Typography variant="subtitle2">{section.title}</Typography>
              {section.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  variant="body2"
                  underline="hover"
                  color="text.secondary"
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} Kursevi. Sva prava zadržana.
        </Typography>
      </Container>
    </Box>
  );
}
