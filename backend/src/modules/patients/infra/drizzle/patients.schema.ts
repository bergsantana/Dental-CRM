import { date, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const patients = pgTable('patients', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  birthDate: date('birthDate').notNull(),
  primaryDentist: text('primary_dentist').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});
