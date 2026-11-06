/// <reference types="node" />

import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'drizzle-kit';

config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
});

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required');
}

if (new URL(testDatabaseUrl).pathname !== '/serviceops_test') {
  throw new Error('Test migrations must use serviceops_test');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/db/schema.ts',
  out: './drizzle',
  dbCredentials: {
    url: testDatabaseUrl,
  },
});
