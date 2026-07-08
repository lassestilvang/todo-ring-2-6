#!/usr/bin/env node

/**
 * Generate OpenAPI/Swagger documentation for TaskPlanner API
 * Updated to include v2 endpoints and AI features
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';

const OUTPUT_DIR = './docs/api';

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
  // v2 Endpoints
  {
    path: '/api/v2/tasks',
    method: 'GET',
    description: 'Retrieve all tasks with filtering options (AI-powered prioritization)',
    parameters: [
      { name: 'sortBy', in: 'query', required: false, schema: { type: 'string' } },
      { name: 'limit', in: 'query', required: false, schema: { type: 'integer' } }
    ],
    responses: { '200': { description: 'Array of prioritized task objects' } }
  },
  {
    path: '/api/v2/tasks/batch',
    method: 'POST',
    description: 'Create or update multiple tasks in bulk',
    responses: { '201': { description: 'Created/updated tasks' } }
  },
  {
    path: '/api/v2/tasks/{id}/prioritize',
    method: 'POST',
    description: 'Get AI-powered task prioritization recommendation',
    responses: { '200': { description: 'Priority analysis with recommendations' } }
  },
  {
    path: '/api/v2/team/workload',
    method: 'GET',
    description: 'Get team workload analytics and capacity planning',
    responses: { '200': { description: 'Workload distribution metrics' } }
  },
  {
    path: '/api/v2/templates/marketplace',
    method: 'GET',
    description: 'Browse available task templates in marketplace',
    responses: { '200': { description: 'Template catalog' } }
  },
  {
    path: '/api/v2/goals/{id}/breakdown',
    method: 'POST',
    description: 'AI-powered goal-to-task breakdown',
    responses: { '200': { description: 'Generated task breakdown' } }
  }
];

function generateOpenApiSpec() {
  return {
    openapi: '3.1.0',
    info: {
      title: 'TaskPlanner API',
      version: '2.0.0',
      description: 'API for TaskPlanner - A full-featured task management application with AI capabilities'
    },
    servers: [
      { url: 'https://api.taskplanner.app/api/v2', description: 'Production server (v2)' },
      { url: 'https://api.taskplanner.app/api/v1', description: 'Production server (v1)' },
      { url: 'http://localhost:3000/api/v2', description: 'Local development server' }
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
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const spec = generateOpenApiSpec();
  const specPath = path.join(OUTPUT_DIR, 'openapi.json');
  fs.writeFileSync(specPath, JSON.stringify(spec, null, 2));
  console.log(`✅ OpenAPI spec written to ${specPath}`);

  const html = `<!DOCTYPE html>
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

  fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), html);
  console.log(`✅ HTML docs written to ${OUTPUT_DIR}/index.html`);

  if (process.env.GITHUB_ACTIONS) {
    execSync('gh-pages -d docs/api', { stdio: 'inherit' });
    console.log('✅ Docs deployed to GitHub Pages');
  }
}

main();