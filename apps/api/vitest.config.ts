/// <reference types="node" />

import { fileURLToPath } from 'node:url';
import { config } from 'dotenv';
import { defineConfig } from 'vitest/config';

config({
  path: fileURLToPath(new URL('../../.env', import.meta.url)),
});

const testDatabaseUrl = process.env.TEST_DATABASE_URL;

if (!testDatabaseUrl) {
  throw new Error('TEST_DATABASE_URL is required');
}

const databaseName = new URL(testDatabaseUrl).pathname;

if (databaseName !== '/serviceops_test') {
  throw new Error('Tests must use the serviceops_test database');
}

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
    environment: 'node',
    fileParallelism: false,
    env: {
      DATABASE_URL: testDatabaseUrl,
    },
  },
});
