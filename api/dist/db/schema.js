"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chatMessages = exports.chatSessions = exports.patientDocuments = exports.anamneses = exports.appointments = exports.patients = exports.clinicMembers = exports.clinics = exports.users = exports.chatRoleEnum = exports.ingestStatusEnum = exports.appointmentStatusEnum = exports.clinicRoleEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
const drizzle_orm_1 = require("drizzle-orm");
exports.clinicRoleEnum = (0, pg_core_1.pgEnum)('clinic_role', [
    'owner',
    'dentist',
    'assistant',
    'receptionist',
]);
exports.appointmentStatusEnum = (0, pg_core_1.pgEnum)('appointment_status', [
    'scheduled',
    'confirmed',
    'completed',
    'cancelled',
    'no_show',
]);
exports.ingestStatusEnum = (0, pg_core_1.pgEnum)('ingest_status', [
    'pending',
    'processing',
    'ready',
    'failed',
]);
exports.chatRoleEnum = (0, pg_core_1.pgEnum)('chat_role', ['user', 'assistant', 'system']);
exports.users = (0, pg_core_1.pgTable)('users', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    email: (0, pg_core_1.text)('email').notNull(),
    passwordHash: (0, pg_core_1.text)('password_hash').notNull(),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    phone: (0, pg_core_1.text)('phone'),
    cro: (0, pg_core_1.text)('cro'),
    avatarUrl: (0, pg_core_1.text)('avatar_url'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
}, (t) => ({
    emailUq: (0, pg_core_1.uniqueIndex)('users_email_uq').on(t.email).where((0, drizzle_orm_1.sql) `${t.deletedAt} IS NULL`),
}));
exports.clinics = (0, pg_core_1.pgTable)('clinics', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    name: (0, pg_core_1.text)('name').notNull(),
    cnpj: (0, pg_core_1.text)('cnpj'),
    address: (0, pg_core_1.text)('address'),
    phone: (0, pg_core_1.text)('phone'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
});
exports.clinicMembers = (0, pg_core_1.pgTable)('clinic_members', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clinicId: (0, pg_core_1.uuid)('clinic_id')
        .notNull()
        .references(() => exports.clinics.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id, { onDelete: 'cascade' }),
    role: (0, exports.clinicRoleEnum)('role').notNull(),
    isActive: (0, pg_core_1.boolean)('is_active').notNull().default(true),
    invitedAt: (0, pg_core_1.timestamp)('invited_at', { withTimezone: true }),
    acceptedAt: (0, pg_core_1.timestamp)('accepted_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    uq: (0, pg_core_1.uniqueIndex)('clinic_members_clinic_user_uq').on(t.clinicId, t.userId),
    byUser: (0, pg_core_1.index)('clinic_members_user_idx').on(t.userId),
    byClinicRole: (0, pg_core_1.index)('clinic_members_clinic_role_idx').on(t.clinicId, t.role),
}));
exports.patients = (0, pg_core_1.pgTable)('patients', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clinicId: (0, pg_core_1.uuid)('clinic_id')
        .notNull()
        .references(() => exports.clinics.id),
    fullName: (0, pg_core_1.text)('full_name').notNull(),
    birthDate: (0, pg_core_1.date)('birth_date'),
    gender: (0, pg_core_1.text)('gender'),
    cpf: (0, pg_core_1.text)('cpf'),
    email: (0, pg_core_1.text)('email'),
    phone: (0, pg_core_1.text)('phone'),
    address: (0, pg_core_1.text)('address'),
    notes: (0, pg_core_1.text)('notes'),
    specialties: (0, pg_core_1.text)('specialties').array().notNull().default((0, drizzle_orm_1.sql) `ARRAY[]::text[]`),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
    deletedAt: (0, pg_core_1.timestamp)('deleted_at', { withTimezone: true }),
}, (t) => ({
    cpfUq: (0, pg_core_1.uniqueIndex)('patients_clinic_cpf_uq')
        .on(t.clinicId, t.cpf)
        .where((0, drizzle_orm_1.sql) `${t.cpf} IS NOT NULL AND ${t.deletedAt} IS NULL`),
    byName: (0, pg_core_1.index)('patients_clinic_name_idx').on(t.clinicId, t.fullName),
}));
exports.appointments = (0, pg_core_1.pgTable)('appointments', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clinicId: (0, pg_core_1.uuid)('clinic_id')
        .notNull()
        .references(() => exports.clinics.id),
    patientId: (0, pg_core_1.uuid)('patient_id')
        .notNull()
        .references(() => exports.patients.id),
    dentistId: (0, pg_core_1.uuid)('dentist_id')
        .notNull()
        .references(() => exports.users.id),
    createdBy: (0, pg_core_1.uuid)('created_by')
        .notNull()
        .references(() => exports.users.id),
    startsAt: (0, pg_core_1.timestamp)('starts_at', { withTimezone: true }).notNull(),
    endsAt: (0, pg_core_1.timestamp)('ends_at', { withTimezone: true }).notNull(),
    status: (0, exports.appointmentStatusEnum)('status').notNull().default('scheduled'),
    reason: (0, pg_core_1.text)('reason'),
    notes: (0, pg_core_1.text)('notes'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    rangeChk: (0, pg_core_1.check)('appointments_range_chk', (0, drizzle_orm_1.sql) `${t.endsAt} > ${t.startsAt}`),
    byClinicStart: (0, pg_core_1.index)('appointments_clinic_start_idx').on(t.clinicId, t.startsAt),
    byDentistStart: (0, pg_core_1.index)('appointments_dentist_start_idx').on(t.dentistId, t.startsAt),
    byPatientStart: (0, pg_core_1.index)('appointments_patient_start_idx').on(t.patientId, t.startsAt),
}));
exports.anamneses = (0, pg_core_1.pgTable)('anamneses', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clinicId: (0, pg_core_1.uuid)('clinic_id')
        .notNull()
        .references(() => exports.clinics.id),
    patientId: (0, pg_core_1.uuid)('patient_id')
        .notNull()
        .references(() => exports.patients.id, { onDelete: 'cascade' }),
    recordedBy: (0, pg_core_1.uuid)('recorded_by')
        .notNull()
        .references(() => exports.users.id),
    recordedAt: (0, pg_core_1.timestamp)('recorded_at', { withTimezone: true }).defaultNow().notNull(),
    specialties: (0, pg_core_1.text)('specialties').array().notNull().default((0, drizzle_orm_1.sql) `ARRAY[]::text[]`),
    chiefComplaint: (0, pg_core_1.text)('chief_complaint'),
    presentIllnessHistory: (0, pg_core_1.text)('present_illness_history'),
    allergiesSummary: (0, pg_core_1.text)('allergies_summary'),
    medicationsSummary: (0, pg_core_1.text)('medications_summary'),
    underMedicalTreatment: (0, pg_core_1.boolean)('under_medical_treatment').notNull().default(false),
    pregnant: (0, pg_core_1.boolean)('pregnant'),
    gestationalWeeks: (0, pg_core_1.integer)('gestational_weeks'),
    lactating: (0, pg_core_1.boolean)('lactating'),
    smoker: (0, pg_core_1.boolean)('smoker').notNull().default(false),
    alcoholUse: (0, pg_core_1.text)('alcohol_use'),
    bruxism: (0, pg_core_1.boolean)('bruxism').notNull().default(false),
    lastDentalVisit: (0, pg_core_1.date)('last_dental_visit'),
    answers: (0, pg_core_1.jsonb)('answers').notNull().default((0, drizzle_orm_1.sql) `'{}'::jsonb`),
    consentSigned: (0, pg_core_1.boolean)('consent_signed').notNull().default(false),
    consentSignedAt: (0, pg_core_1.timestamp)('consent_signed_at', { withTimezone: true }),
    signatureUrl: (0, pg_core_1.text)('signature_url'),
    schemaVersion: (0, pg_core_1.integer)('schema_version').notNull().default(1),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    byPatient: (0, pg_core_1.index)('anamneses_patient_recorded_idx').on(t.patientId, t.recordedAt),
}));
exports.patientDocuments = (0, pg_core_1.pgTable)('patient_documents', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clinicId: (0, pg_core_1.uuid)('clinic_id')
        .notNull()
        .references(() => exports.clinics.id),
    patientId: (0, pg_core_1.uuid)('patient_id')
        .notNull()
        .references(() => exports.patients.id, { onDelete: 'cascade' }),
    uploadedBy: (0, pg_core_1.uuid)('uploaded_by')
        .notNull()
        .references(() => exports.users.id),
    filename: (0, pg_core_1.text)('filename').notNull(),
    mimeType: (0, pg_core_1.text)('mime_type').notNull(),
    sizeBytes: (0, pg_core_1.bigint)('size_bytes', { mode: 'number' }).notNull(),
    storageUrl: (0, pg_core_1.text)('storage_url').notNull(),
    ingestStatus: (0, exports.ingestStatusEnum)('ingest_status').notNull().default('pending'),
    ingestError: (0, pg_core_1.text)('ingest_error'),
    chunkCount: (0, pg_core_1.integer)('chunk_count'),
    ingestedAt: (0, pg_core_1.timestamp)('ingested_at', { withTimezone: true }),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    byPatientStatus: (0, pg_core_1.index)('patient_documents_patient_status_idx').on(t.patientId, t.ingestStatus),
}));
exports.chatSessions = (0, pg_core_1.pgTable)('chat_sessions', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    clinicId: (0, pg_core_1.uuid)('clinic_id')
        .notNull()
        .references(() => exports.clinics.id),
    patientId: (0, pg_core_1.uuid)('patient_id')
        .notNull()
        .references(() => exports.patients.id, { onDelete: 'cascade' }),
    userId: (0, pg_core_1.uuid)('user_id')
        .notNull()
        .references(() => exports.users.id),
    title: (0, pg_core_1.text)('title'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: (0, pg_core_1.timestamp)('updated_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    byPatient: (0, pg_core_1.index)('chat_sessions_patient_idx').on(t.patientId, t.updatedAt),
    byUser: (0, pg_core_1.index)('chat_sessions_user_idx').on(t.userId, t.updatedAt),
}));
exports.chatMessages = (0, pg_core_1.pgTable)('chat_messages', {
    id: (0, pg_core_1.uuid)('id').primaryKey().defaultRandom(),
    sessionId: (0, pg_core_1.uuid)('session_id')
        .notNull()
        .references(() => exports.chatSessions.id, { onDelete: 'cascade' }),
    role: (0, exports.chatRoleEnum)('role').notNull(),
    content: (0, pg_core_1.text)('content').notNull(),
    sources: (0, pg_core_1.jsonb)('sources'),
    tokensIn: (0, pg_core_1.integer)('tokens_in'),
    tokensOut: (0, pg_core_1.integer)('tokens_out'),
    contextRelevance: (0, pg_core_1.real)('context_relevance'),
    groundedness: (0, pg_core_1.real)('groundedness'),
    answerRelevance: (0, pg_core_1.real)('answer_relevance'),
    metricsPerChunk: (0, pg_core_1.jsonb)('metrics_per_chunk'),
    createdAt: (0, pg_core_1.timestamp)('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
    bySession: (0, pg_core_1.index)('chat_messages_session_idx').on(t.sessionId, t.createdAt),
}));
//# sourceMappingURL=schema.js.map