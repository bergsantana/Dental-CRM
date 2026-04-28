import {
  pgTable,
  uuid,
  text,
  timestamp,
  boolean,
  integer,
  date,
  jsonb,
  bigint,
  index,
  uniqueIndex,
  pgEnum,
  check,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ───── enums ─────
export const clinicRoleEnum = pgEnum('clinic_role', [
  'owner',
  'dentist',
  'assistant',
  'receptionist',
]);

export const appointmentStatusEnum = pgEnum('appointment_status', [
  'scheduled',
  'confirmed',
  'completed',
  'cancelled',
  'no_show',
]);

export const ingestStatusEnum = pgEnum('ingest_status', [
  'pending',
  'processing',
  'ready',
  'failed',
]);

export const chatRoleEnum = pgEnum('chat_role', ['user', 'assistant', 'system']);

// ───── users ─────
export const users = pgTable(
  'users',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    fullName: text('full_name').notNull(),
    phone: text('phone'),
    cro: text('cro'),
    avatarUrl: text('avatar_url'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    emailUq: uniqueIndex('users_email_uq').on(t.email).where(sql`${t.deletedAt} IS NULL`),
  }),
);

// ───── clinics ─────
export const clinics = pgTable('clinics', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  cnpj: text('cnpj'),
  address: text('address'),
  phone: text('phone'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  deletedAt: timestamp('deleted_at', { withTimezone: true }),
});

// ───── clinic memberships (M:N user×clinic with role) ─────
export const clinicMembers = pgTable(
  'clinic_members',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: clinicRoleEnum('role').notNull(),
    isActive: boolean('is_active').notNull().default(true),
    invitedAt: timestamp('invited_at', { withTimezone: true }),
    acceptedAt: timestamp('accepted_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    uq: uniqueIndex('clinic_members_clinic_user_uq').on(t.clinicId, t.userId),
    byUser: index('clinic_members_user_idx').on(t.userId),
    byClinicRole: index('clinic_members_clinic_role_idx').on(t.clinicId, t.role),
  }),
);

// ───── patients ─────
export const patients = pgTable(
  'patients',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    fullName: text('full_name').notNull(),
    birthDate: date('birth_date'),
    gender: text('gender'),
    cpf: text('cpf'),
    email: text('email'),
    phone: text('phone'),
    address: text('address'),
    notes: text('notes'),
    specialties: text('specialties').array().notNull().default(sql`ARRAY[]::text[]`),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true }),
  },
  (t) => ({
    cpfUq: uniqueIndex('patients_clinic_cpf_uq')
      .on(t.clinicId, t.cpf)
      .where(sql`${t.cpf} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    byName: index('patients_clinic_name_idx').on(t.clinicId, t.fullName),
  }),
);

// ───── appointments ─────
export const appointments = pgTable(
  'appointments',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id),
    dentistId: uuid('dentist_id')
      .notNull()
      .references(() => users.id),
    createdBy: uuid('created_by')
      .notNull()
      .references(() => users.id),
    startsAt: timestamp('starts_at', { withTimezone: true }).notNull(),
    endsAt: timestamp('ends_at', { withTimezone: true }).notNull(),
    status: appointmentStatusEnum('status').notNull().default('scheduled'),
    reason: text('reason'),
    notes: text('notes'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    rangeChk: check('appointments_range_chk', sql`${t.endsAt} > ${t.startsAt}`),
    byClinicStart: index('appointments_clinic_start_idx').on(t.clinicId, t.startsAt),
    byDentistStart: index('appointments_dentist_start_idx').on(t.dentistId, t.startsAt),
    byPatientStart: index('appointments_patient_start_idx').on(t.patientId, t.startsAt),
  }),
);

// ───── anamneses (append-only snapshots, BR/CFO-aware) ─────
export const anamneses = pgTable(
  'anamneses',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    recordedBy: uuid('recorded_by')
      .notNull()
      .references(() => users.id),
    recordedAt: timestamp('recorded_at', { withTimezone: true }).defaultNow().notNull(),
    specialties: text('specialties').array().notNull().default(sql`ARRAY[]::text[]`),
    chiefComplaint: text('chief_complaint'),
    presentIllnessHistory: text('present_illness_history'),
    allergiesSummary: text('allergies_summary'),
    medicationsSummary: text('medications_summary'),
    underMedicalTreatment: boolean('under_medical_treatment').notNull().default(false),
    pregnant: boolean('pregnant'),
    gestationalWeeks: integer('gestational_weeks'),
    lactating: boolean('lactating'),
    smoker: boolean('smoker').notNull().default(false),
    alcoholUse: text('alcohol_use'),
    bruxism: boolean('bruxism').notNull().default(false),
    lastDentalVisit: date('last_dental_visit'),
    answers: jsonb('answers').notNull().default(sql`'{}'::jsonb`),
    consentSigned: boolean('consent_signed').notNull().default(false),
    consentSignedAt: timestamp('consent_signed_at', { withTimezone: true }),
    signatureUrl: text('signature_url'),
    schemaVersion: integer('schema_version').notNull().default(1),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byPatient: index('anamneses_patient_recorded_idx').on(t.patientId, t.recordedAt),
  }),
);

// ───── patient documents (RAG sources) ─────
export const patientDocuments = pgTable(
  'patient_documents',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    uploadedBy: uuid('uploaded_by')
      .notNull()
      .references(() => users.id),
    filename: text('filename').notNull(),
    mimeType: text('mime_type').notNull(),
    sizeBytes: bigint('size_bytes', { mode: 'number' }).notNull(),
    storageUrl: text('storage_url').notNull(),
    ingestStatus: ingestStatusEnum('ingest_status').notNull().default('pending'),
    ingestError: text('ingest_error'),
    chunkCount: integer('chunk_count'),
    ingestedAt: timestamp('ingested_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byPatientStatus: index('patient_documents_patient_status_idx').on(t.patientId, t.ingestStatus),
  }),
);

// ───── chat sessions + messages ─────
export const chatSessions = pgTable(
  'chat_sessions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    clinicId: uuid('clinic_id')
      .notNull()
      .references(() => clinics.id),
    patientId: uuid('patient_id')
      .notNull()
      .references(() => patients.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id),
    title: text('title'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    byPatient: index('chat_sessions_patient_idx').on(t.patientId, t.updatedAt),
    byUser: index('chat_sessions_user_idx').on(t.userId, t.updatedAt),
  }),
);

export const chatMessages = pgTable(
  'chat_messages',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    sessionId: uuid('session_id')
      .notNull()
      .references(() => chatSessions.id, { onDelete: 'cascade' }),
    role: chatRoleEnum('role').notNull(),
    content: text('content').notNull(),
    sources: jsonb('sources'),
    tokensIn: integer('tokens_in'),
    tokensOut: integer('tokens_out'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => ({
    bySession: index('chat_messages_session_idx').on(t.sessionId, t.createdAt),
  }),
);

// ───── inferred types (handy in services) ─────
export type User = typeof users.$inferSelect;
export type Clinic = typeof clinics.$inferSelect;
export type ClinicMember = typeof clinicMembers.$inferSelect;
export type Patient = typeof patients.$inferSelect;
export type Appointment = typeof appointments.$inferSelect;
export type Anamnesis = typeof anamneses.$inferSelect;
export type PatientDocument = typeof patientDocuments.$inferSelect;
export type ChatSession = typeof chatSessions.$inferSelect;
export type ChatMessage = typeof chatMessages.$inferSelect;
