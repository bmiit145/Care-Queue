/**
 * Self-hosted Swagger UI shell.
 *
 * `swagger-ui-express` serves its assets with `express.static` pointed at
 * `swagger-ui-dist` inside `node_modules`. On Vercel those files are not part
 * of the traced serverless bundle, so every `/api-docs/*.css|.js` request falls
 * through to the catch-all handler and comes back as `text/html` — which the
 * browser then refuses under strict MIME checking. Loading the assets from a
 * pinned CDN build sidesteps the packaging problem completely.
 */

/** Pinned so a CDN-side major bump can never break the docs page. */
export const SWAGGER_UI_CDN = 'https://cdn.jsdelivr.net/npm/swagger-ui-dist@5.17.14';

/** CDN origin, for the Content-Security-Policy allow-list. */
export const SWAGGER_UI_CDN_ORIGIN = 'https://cdn.jsdelivr.net';

export const SWAGGER_UI_INIT_PATH = '/api-docs/init.js';
export const SWAGGER_SPEC_PATH = '/api-docs.json';

export const swaggerUiHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Care-Queue API Docs</title>
  <link rel="icon" href="data:," />
  <link rel="stylesheet" href="${SWAGGER_UI_CDN}/swagger-ui.css" />
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="${SWAGGER_UI_CDN}/swagger-ui-bundle.js" crossorigin="anonymous"></script>
  <script src="${SWAGGER_UI_INIT_PATH}"></script>
</body>
</html>
`;

/**
 * Served from our own origin rather than inlined, so the docs page stays under
 * a `script-src` that does not need `'unsafe-inline'`.
 */
export const swaggerUiInitJs = `window.addEventListener('load', function () {
  window.ui = SwaggerUIBundle({
    url: '${SWAGGER_SPEC_PATH}',
    dom_id: '#swagger-ui',
    deepLinking: true,
    layout: 'BaseLayout',
    presets: [SwaggerUIBundle.presets.apis],
    plugins: [SwaggerUIBundle.plugins.DownloadUrl],
    persistAuthorization: true,
    tryItOutEnabled: true
  });
});
`;
