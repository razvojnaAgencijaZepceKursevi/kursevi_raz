import { pageMetadata } from '@/lib/seo';
import { SITE } from '@/lib/siteConfig';

/*
 * Metadata only. The page is a Client Component (a form), and a client module
 * cannot export `metadata`, so this segment layout carries it instead.
 */
export const metadata = pageMetadata({
  title: 'Prijava',
  description: `Prijavi se na platformu ${SITE.name} i nastavi s učenjem: lekcije, zadaci, napredak i certifikati na jednom mjestu.`,
  path: '/login',
});

export default function LoginLayout({ children }: { children: React.ReactNode }) {
  return children;
}
