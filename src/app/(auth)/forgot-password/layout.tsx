import { NO_INDEX } from '@/lib/seo';

/*
 * Metadata only. The page is a Client Component (a form), and a client module
 * cannot export `metadata`, so this segment layout carries it instead.
 */
export const metadata = { title: 'Zaboravljena lozinka', robots: NO_INDEX };

export default function ForgotPasswordLayout({ children }: { children: React.ReactNode }) {
  return children;
}
