// Downloads the API documentation (OpenAPI JSON) into api/openapi.json.
// API tests validate responses against the schemas in this file.
// Run after the API docs change: npm run api:update-spec
import dotenv from 'dotenv';
import fs from 'node:fs';

dotenv.config({ quiet: true });

const baseUrl = process.env.BASE_URL;
if (!baseUrl) {
  console.error('Missing BASE_URL – set it in .env');
  process.exit(1);
}

const response = await fetch(`${baseUrl}/api/docs-json`);
if (!response.ok) {
  console.error(`Could not download the spec: ${response.status}`);
  process.exit(1);
}

const spec = await response.json();
fs.writeFileSync('api/openapi.json', `${JSON.stringify(spec, null, 2)}\n`);
console.log(
  `Saved api/openapi.json (${Object.keys(spec.paths).length} paths, ` +
    `${Object.keys(spec.components.schemas).length} schemas).`,
);
