import { generateOpenApiDocument } from '@/lib/openapi/generate';

/**
 * Regenerated on every request straight from the current schemas/registry.
 *
 * Currently PUBLIC, so the `/api-docs` page can fetch it from the browser.
 * It describes the whole API surface but grants no access — every documented
 * route still authenticates and authorises on its own. Re-gate it in
 * `proxy.ts` alongside `/api-docs` when the docs go internal.
 */
export const dynamic = 'force-dynamic';

export async function GET() {
  return Response.json(generateOpenApiDocument());
}
