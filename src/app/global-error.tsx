'use client';

/**
 * The boundary of last resort: a throw in the **root layout** itself.
 *
 * `app/error.tsx` renders *inside* that layout, so it cannot catch a failure in
 * it — which means this file replaces the entire document and must therefore
 * render its own `<html>` and `<body>`.
 *
 * It is also the one place in the app that cannot lean on MUI, the theme or the
 * query client: if the root layout is what threw, its providers never mounted.
 * So this is deliberately plain inline-styled markup, and it should stay that
 * way however tempting it looks to prettify.
 */
export default function GlobalError({ error }: { error: Error & { digest?: string } }) {
  return (
    <html lang="sr">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
          background: '#f3f4f6',
          color: '#111827',
        }}
      >
        <main style={{ maxWidth: 460, padding: 24, textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 8 }}>Aplikacija trenutno nije dostupna</h1>
          <p style={{ fontSize: 15, lineHeight: 1.6, color: '#4b5563', margin: '0 0 20px' }}>
            Došlo je do neočekivane greške. Osvežite stranicu — ako se ponavlja, javite se timu koji
            održava aplikaciju.
          </p>
          {/*
            A plain anchor, and the lint rule is wrong here specifically. This
            component renders when the *root layout* threw, so the router and
            everything mounted inside it may be unusable — a `<Link>` would try
            a client-side navigation through the very tree that just failed. A
            full document load is the only reliable way out.
          */}
          {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
          <a
            href="/"
            style={{
              display: 'inline-block',
              padding: '10px 18px',
              borderRadius: 8,
              background: '#1f2937',
              color: '#fff',
              textDecoration: 'none',
              fontSize: 15,
            }}
          >
            Nazad na početnu
          </a>
          {error.digest ? (
            <p style={{ marginTop: 20, fontSize: 12, color: '#6b7280' }}>
              Kod greške: {error.digest}
            </p>
          ) : null}
        </main>
      </body>
    </html>
  );
}
