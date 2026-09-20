import * as express from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Swagger UI HTML template served at /api/docs
const swaggerUIHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>LingoLive API Documentation</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.css">
    <style>
      html {
        box-sizing: border-box;
        overflow: -moz-scrollbars-vertical;
        overflow-y: scroll;
      }
      *,
      *:before,
      *:after {
        box-sizing: inherit;
      }
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui.min.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/swagger-ui/4.15.5/swagger-ui-bundle.min.js"></script>
    <script>
      window.onload = function() {
        SwaggerUIBundle({
          url: "/api/openapi.json",
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [
            SwaggerUIBundle.presets.apis,
            SwaggerUIBundle.SwaggerUIStandalonePreset
          ],
          plugins: [
            SwaggerUIBundle.plugins.DownloadUrl
          ],
          layout: "StandaloneLayout"
        })
      }
    </script>
  </body>
</html>
`;

// Redoc HTML template (alternative documentation view)
const redocHtml = `
<!DOCTYPE html>
<html>
  <head>
    <title>LingoLive API Documentation - ReDoc</title>
    <meta charset="utf-8"/>
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <link href="https://fonts.googleapis.com/css?family=Montserrat:300,400,700|Roboto:300,400,700" rel="stylesheet">
    <style>
      body {
        margin: 0;
        padding: 0;
      }
    </style>
  </head>
  <body>
    <redoc spec-url='/api/openapi.json'></redoc>
    <script src="https://cdn.jsdelivr.net/npm/redoc/bundles/redoc.standalone.js"></script>
  </body>
</html>
`;

/**
 * Middleware to serve Swagger UI and OpenAPI specification
 */
export function setupSwaggerUI(app: express.Application, openAPISpecPath: string): void {
  // Load OpenAPI spec
  if (!fs.existsSync(openAPISpecPath)) {
    console.warn(`⚠️  OpenAPI spec not found at ${openAPISpecPath}`);
    console.warn('Generate with: npm run generate:openapi');
    return;
  }

  const openAPISpec = JSON.parse(fs.readFileSync(openAPISpecPath, 'utf-8'));

  // Serve OpenAPI spec as JSON
  app.get('/api/openapi.json', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(openAPISpec);
  });

  // Serve Swagger UI
  app.get('/api/docs', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(swaggerUIHtml);
  });

  // Serve ReDoc alternative
  app.get('/api/docs/redoc', (req, res) => {
    res.setHeader('Content-Type', 'text/html');
    res.send(redocHtml);
  });

  console.log('✅ Swagger UI available at: GET /api/docs');
  console.log('✅ ReDoc available at: GET /api/docs/redoc');
  console.log('✅ OpenAPI spec available at: GET /api/openapi.json');
}

/**
 * Generate Postman collection from OpenAPI spec
 */
export function generatePostmanCollection(openAPISpec: any): any {
  const postmanCollection = {
    info: {
      name: openAPISpec.info.title,
      description: openAPISpec.info.description,
      version: openAPISpec.info.version,
      schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
    },
    item: [] as any[],
    variable: [],
  };

  // Create folder per tag
  const folders: Record<string, any> = {};
  for (const tag of openAPISpec.tags || []) {
    folders[tag.name] = {
      name: tag.name,
      description: tag.description,
      item: [],
    };
  }

  // Process each path
  for (const [path, methods] of Object.entries(openAPISpec.paths)) {
    for (const [method, operation] of Object.entries(methods)) {
      if (!['get', 'post', 'put', 'delete', 'patch'].includes(method.toLowerCase())) {
        continue;
      }

      const op = operation as any;
      const tag = op.tags?.[0] || 'Other';
      const folder = folders[tag] || folders['Other'];

      const request: any = {
        method: method.toUpperCase(),
        header: [
          {
            key: 'Accept',
            value: 'application/json',
          },
          {
            key: 'Content-Type',
            value: 'application/json',
          },
        ],
        url: {
          raw: `{{baseUrl}}${path}`,
          host: ['{{baseUrl}}'],
          path: path.split('/').filter(Boolean),
        },
        description: op.summary,
      };

      // Add authorization header
      if (op.security) {
        request.header.push({
          key: 'Authorization',
          value: 'Bearer {{idToken}}',
        });
      }

      // Add body for POST/PUT
      if (['post', 'put'].includes(method.toLowerCase())) {
        request.body = {
          mode: 'raw',
          raw: '{}',
          options: {
            raw: {
              language: 'json',
            },
          },
        };
      }

      folder.item.push({
        name: op.summary || path,
        request,
        response: [],
      });
    }
  }

  postmanCollection.item = Object.values(folders);
  return postmanCollection;
}
