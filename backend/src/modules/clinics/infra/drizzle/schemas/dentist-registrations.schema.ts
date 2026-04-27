import { pgTable, uuid } from 'drizzle-orm/pg-core';
import { clinics } from './clinics.schema';

// Tabela de vínculo: Dentista -> Clínica
export const dentistRegistrations = pgTable('dentist_registrations', {
  id: uuid('id').primaryKey().defaultRandom(),
  dentistId: uuid('dentist_id').notNull(),
  clinicId: uuid('clinic_id')
    .references(() => clinics.id)
    .notNull(),
});
