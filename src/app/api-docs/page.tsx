'use client';

import dynamic from 'next/dynamic';
import 'swagger-ui-react/swagger-ui.css';

/**
 * Loaded client-side only: swagger-ui-react reaches for browser globals during
 * module evaluation and cannot be server-rendered.
 *
 * Currently PUBLIC — no role check in `proxy.ts`. The endpoints it documents
 * still enforce their own auth, so this exposes the shape of the API rather
 * than any data. To close it again, restore `/api-docs` and
 * `/api/openapi.json` to `ADMIN_PREFIXES` in `proxy.ts`.
 */
const SwaggerUI = dynamic(() => import('swagger-ui-react'), {
  ssr: false,
  loading: () => <p style={{ padding: 24 }}>Loading API reference…</p>,
});

export default function ApiDocsPage() {
  return <SwaggerUI url="/api/openapi.json" />;
}
