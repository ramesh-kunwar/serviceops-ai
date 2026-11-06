import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { SERVER_CONFIG } from '../config/server-config.js';
import * as schema from './schema.js';

export const pool = new Pool({
  connectionString: SERVER_CONFIG.databaseUrl,
  connectionTimeoutMillis: 5000,
});

export const db = drizzle(pool, { schema });
