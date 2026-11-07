import { sql } from 'drizzle-orm';
import { db, pool } from './index.js';

try {
  await db.execute(sql`SELECT 1 AS connected`);
  console.log('Database connection successful');
} catch {
  console.error(
    'Database connection failed. Check PostgreSQL and DATABASE_URL.',
  );
  process.exitCode = 1;
} finally {
  await pool.end();
}
