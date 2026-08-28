import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Divider from '@mui/material/Divider';
import Link from '@mui/material/Link';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

import { SITE_NAME } from '@/lib/siteConfig';
import Logo from '@/components/layout/Logo';

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
    // TODO: when we define all categories they need to be added here with appropriate paths
    title: 'Kursevi',
    links: [
      { label: 'IT / programiranje', href: '/courses?category=it-programiranje' },
      { label: 'Poslovanje i menadžment', href: '/courses?category=poslovanje-i-menadzment' },
      { label: 'Marketing', href: '/courses?category=marketing' },
      { label: 'Finansije i računovodstvo', href: '/courses?category=finansije-i-racunovodstvo' },
      { label: 'Zanati i praktične vještine', href: '/courses?category=zanati-i-prakticne-vjestine' },
    ],
  },
  {
    // TODO: o-nama page doesn't exist yet
    title: 'Platforma',
    links: [
      { label: 'O nama', href: '/o-nama' },
      { label: 'Blog', href: '/blog' },
      { label: 'Kontakt', href: '/kontakt' },
      { label: 'Uvjeti korištenja', href: '/uvjeti-koristenja' },
      { label: 'Politika privatnosti', href: '/politika-privatnosti' },
    ],
  },
  {
    // TODO: replace with real contact details / social URLs
    title: 'Kontakt',
    links: [
      { label: 'info@katedra.ba', href: 'mailto:info@katedra.ba' },
      { label: '+387 33 000 000', href: 'tel:+38733000000' },
      { label: 'Instagram', href: 'https://instagram.com' },
      { label: 'LinkedIn', href: 'https://linkedin.com' },
      { label: 'Facebook', href: 'https://facebook.com' },
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
              <Logo />
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Platforma za online kurseve s pregledom zadataka i certifikatom po završetku.
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
                  {...(link.href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })} // This makes social links open in new tab
                >
                  {link.label}
                </Link>
              ))}
            </Stack>
          ))}
        </Stack>

        <Divider sx={{ my: 3 }} />

        <Typography variant="caption" color="text.secondary">
          © {new Date().getFullYear()} {SITE_NAME}. Sva prava zadržana. Placeholder podaci o firmi i registraciji.
        </Typography>
      </Container>
    </Box>
  );
}
