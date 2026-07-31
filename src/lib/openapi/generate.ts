import { OpenApiGeneratorV3 } from '@asteasolutions/zod-to-openapi';
import { registry } from './registry';
import { publicEnv } from '@/lib/env';

/**
 * Builds the OpenAPI document from the same Zod schemas the route handlers use
 * to validate requests. Called per request, so the document can never drift
 * from the implementation — there is no build step and no cached artefact.
 */
export function generateOpenApiDocument() {
  const generator = new OpenApiGeneratorV3(registry.definitions);

  return generator.generateDocument({
    openapi: '3.0.0',
    info: {
      title: 'Kursevi API',
      version: '1.0.0',
      description:
        'Backend API for the online courses platform. Every schema below is the exact object ' +
        'used to validate the corresponding request at runtime.',
    },
    servers: [{ url: publicEnv.siteUrl }],
  });
}
