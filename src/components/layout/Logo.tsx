import Link from 'next/link';
import { SITE } from '@/lib/siteConfig';

/**
 * Single source for the brand mark
 *
 * Currently renders text (SITE.name in siteConfig.ts). Once the client
 * provides a real logo image, swap this file's contents for an actual image.
 * nothing that imports <Logo /> needs to change.
 */
export default function Logo() {
  return (
    <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
      {SITE.name}
    </Link>
  );
}
