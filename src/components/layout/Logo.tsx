import Link from 'next/link';
import { SITE_NAME } from '@/lib/siteConfig';

/**
 * Single source for the brand mark
 * 
 * Currently renders text (SITE_NAME is a placeholder). Once the client
 * provides a real logo image, swap this file's contents for an actual image.
 * nothing that imports <Logo /> needs to change.
 */
export default function Logo() {
    return (
        <Link href="/" style={{ textDecoration: 'none', color: 'inherit' }}>
            {SITE_NAME}
        </Link>
    );
}