import swaggerJSDoc from 'swagger-jsdoc';
import { env } from './env';
import type { OpenApiDocument } from './openapi.types';
import { openapiDocument } from './openapi.generated';
import { swaggerOptions } from './swagger.options';

/**
 * In development the spec is built from source on boot, so editing a `@swagger`
 * block and letting `tsx watch` restart is enough to see the change.
 *
 * In production we serve the document baked in at build time: the compiled
 * bundle has no `src` directory, so globbing would yield an empty spec.
 */
const buildSpec = (): OpenApiDocument => {
  if (env.nodeEnv === 'production') {
    return openapiDocument;
  }

  const runtimeSpec = swaggerJSDoc(swaggerOptions) as OpenApiDocument;

  // Guard against running from an unexpected cwd, where the globs miss.
  if (Object.keys(runtimeSpec.paths ?? {}).length === 0) {
    return openapiDocument;
  }

  return runtimeSpec;
};

export const swaggerSpec: OpenApiDocument = buildSpec();
