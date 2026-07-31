import { extendZodWithOpenApi } from '@asteasolutions/zod-to-openapi';
import { z } from 'zod';

/**
 * `.openapi()` is added to Zod by this call, and it must run before any schema
 * that uses it is constructed. Every schema file imports `z` from here rather
 * than from 'zod' directly, which makes that ordering impossible to get wrong.
 */
extendZodWithOpenApi(z);

export { z };
