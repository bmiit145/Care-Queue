/**
 * Structural type for the OpenAPI document we serve.
 *
 * Deliberately loose: the document is produced by swagger-jsdoc and only ever
 * serialised back out as JSON, so a full OpenAPI type buys nothing and makes
 * the generated literal expensive for `tsc` to infer.
 */
export interface OpenApiDocument extends Record<string, unknown> {
  openapi: string;
  info: Record<string, unknown>;
  paths?: Record<string, unknown>;
}
