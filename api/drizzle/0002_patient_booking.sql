-- Add `requested` to appointment_status enum (patient-initiated, awaits staff approval).
ALTER TYPE "appointment_status" ADD VALUE IF NOT EXISTS 'requested' BEFORE 'scheduled';--> statement-breakpoint

-- Booking tokens: short-lived, single-use links given to patients so they can
-- request an appointment without an account. The raw token is shown once to the
-- staff member who creates it; only its sha256 hash is stored.
CREATE TABLE IF NOT EXISTS "booking_tokens" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "clinic_id" uuid NOT NULL REFERENCES "clinics"("id") ON DELETE CASCADE,
  "patient_id" uuid NOT NULL REFERENCES "patients"("id") ON DELETE CASCADE,
  "token_hash" text NOT NULL,
  "expires_at" timestamp with time zone NOT NULL,
  "used_at" timestamp with time zone,
  "created_by" uuid NOT NULL REFERENCES "users"("id"),
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "booking_tokens_hash_uq" ON "booking_tokens" ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_tokens_patient_idx" ON "booking_tokens" ("patient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_tokens_clinic_idx" ON "booking_tokens" ("clinic_id");
