import { pgTable, text, uuid, varchar } from 'drizzle-orm/pg-core';

export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  cnpj: varchar('cnpj', { length: 18 }).unique(),
  ownerId: uuid('owner_id').notNull(), // Relacionado a um futuro UserModule
});
