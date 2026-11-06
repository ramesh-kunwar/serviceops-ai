import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  check,
} from 'drizzle-orm/pg-core';

import { sql } from 'drizzle-orm';

export const serviceRequests = pgTable(
  'service_requests',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    customerName: varchar('customer_name', { length: 100 }).notNull(),
    title: varchar('title', { length: 120 }).notNull(),
    description: text('description').notNull(),
    status: varchar('status', { length: 20 }).default('NEW').notNull(),
    createdAt: timestamp('created_at', { withTimezone: true })
      .defaultNow()
      .notNull(),
  },
  (table) => [
    check('service_requests_status_check', sql`${table.status} IN ('NEW')`),
  ],
);
