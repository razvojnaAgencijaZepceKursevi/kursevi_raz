import { ImageResponse } from 'next/og';
import { SITE } from '@/lib/siteConfig';

/**
 * GET /og — the default share image (1200×630), used by every public page that
 * has no image of its own. See `DEFAULT_OG_IMAGE` in `src/lib/seo.ts`.
 *
 * ## Why a route and not an `opengraph-image.tsx` file
 *
 * File-based metadata outranks the `metadata` object. An `opengraph-image` in
 * the root segment would therefore override the cover image of every blog post
 * and the thumbnail of every course with this generic card. As a plain route it
 * is only ever a default that pages opt out of by passing their own image.
 *
 * Static: generated once at build time, since it depends only on `SITE`.
 * Replace it with a designed image once the brand has one — keep 1200×630.
 */
export const dynamic = 'force-static';

export function GET() {
  return new ImageResponse(
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        padding: '72px 80px',
        // The landing page's brand gradient (theme.ts primary → secondary).
        background: 'linear-gradient(135deg, #2f5bea 0%, #2f5bea 55%, #7b3fe4 120%)',
        color: '#ffffff',
      }}
    >
      <div style={{ display: 'flex', fontSize: 40, fontWeight: 600, opacity: 0.85 }}>
        {SITE.name}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ display: 'flex', fontSize: 84, fontWeight: 700, lineHeight: 1.05 }}>
          {SITE.tagline.charAt(0).toUpperCase() + SITE.tagline.slice(1)}
        </div>
        <div style={{ display: 'flex', fontSize: 34, lineHeight: 1.35, opacity: 0.85 }}>
          {SITE.description}
        </div>
      </div>
    </div>,
    { width: 1200, height: 630 },
  );
}
