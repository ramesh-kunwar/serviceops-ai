import { pgTable, text, timestamp, uuid, varchar } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: text('name').notNull(),
});

export const serviceRequests = pgTable('service_requests', {
  id: uuid('id').primaryKey(),
  customerName: varchar('customer_name', { length: 100 }).notNull(),
  title: varchar('title', { length: 120 }).notNull(),
  description: text('description').notNull(),
  status: varchar('status', { length: 20 }).default('NEW'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow(),
});
