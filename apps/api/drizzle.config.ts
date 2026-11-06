/// <reference types="node" />

import { defineConfig } from 'drizzle-kit';
import { SERVER_CONFIG } from './src/config/server-config.js';

export default defineConfig({
  out: './drizzle',
  schema: './src/db/schema.ts',
  dialect: 'postgresql',
  dbCredentials: {
    url: SERVER_CONFIG.databaseUrl,
  },
});
