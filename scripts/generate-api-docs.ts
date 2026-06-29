#!/usr/bin/env node

/**
 * Generate OpenAPI/Swagger documentation from JSDoc comments
 *
 * Usage: npx tsx scripts/generate-api-docs.ts
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_DIR = './docs/api';
const DOCS_URL = 'https://taskplanner.github.io/docs';

interface ApiEndpoint {
  path: string;
  method: string;
  description: string;
  parameters?: Array<{
    name: string;
    in: string;
    required: boolean;
    schema: { type: string };
  }>;
  responses?: Record<string, { description: string }>;
}

const endpoints: ApiEndpoint[] = [
  {
    path: '/api/tasks',
    method: 'GET',
    description: 'Retrieve all tasks for the authenticated user',
    responses: {
      '200': { description: 'Array of task objects' }
    }
  },
  {
    path: '/api/tasks',
    method: 'POST',
    description: 'Create a new task',
    parameters: [
      {
        name: 'body',
        in: 'body',
        required: true,
        schema: { type: 'object' }
      }
    ],
    responses: {
      '201': { description: 'Created task object' }
    }
  }
];

function generateOpenApiSpec() {
  return {
    openapi: '3.0.0',
    info: {
      title: 'TaskPlanner API',
      version: '1.0.0',
      description: 'API for TaskPlanner - A full-featured task management application'
    },
    servers: [
      { url: 'https://api.taskplanner.app', description: 'Production server' },
      { url: 'http://localhost:3000', description: 'Local development server' }
    ],
    paths: endpoints.reduce((acc, endpoint) => {
      if (!acc[endpoint.path]) {
        acc[endpoint.path] = {};
      }
      acc[endpoint.path][endpoint.method.toLowerCase()] = {
        summary: endpoint.description,
        parameters: endpoint.parameters || [],
        responses: endpoint.responses || {}
      };
      return acc;
    }, {} as Record<string, any>)
  };
}

function main() {
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Generate OpenAPI spec
  const spec = generateOpenApiSpec();
  const specPath = path.join(OUTPUT_DIR, 'openapi.json');
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI spec written to ${specPath}`);

  // Generate HTML docs using Swagger UI
  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <title>TaskPlanner API Docs</title>
  <link rel="stylesheet" type="text/css" href="https://unpkg.com/swagger-ui-dist@5.1.0/swagger-ui.css">
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5.1.0/swagger-ui-standalone-preset.js"></script>
  <script src="https://unpkg.com/swagger-ui-dist@5.1.0/swagger-ui-bundle.js"></script>
  <script>
    SwaggerUIBundle({
      url: "./openapi.json",
      dom_id: '#swagger-ui',
      presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
      layout: "StandaloneLayout",
    });
  </script>
</body>
</html>`;

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), htmlContent);
  console.log(`✅ HTML docs written to ${OUTPUT_DIR}/index.html`);

  // Deploy to GitHub Pages (if in CI environment)
  if (process.env.GITHUB_ACTIONS) {
    execSync('gh-pages -d docs/api', { stdio: 'inherit' });
    console.log('✅ Docs deployed to GitHub Pages');
  }
}

main();