CREATE TABLE IF NOT EXISTS "booking_tokens" (
    "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
    "clinic_id" uuid NOT NULL,
    "patient_id" uuid NOT NULL,
    "token_hash" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "used_at" timestamp with time zone,
    "created_by" uuid NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "booking_tokens" ADD CONSTRAINT "booking_tokens_clinic_id_clinics_id_fk" FOREIGN KEY ("clinic_id") REFERENCES "public"."clinics"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "booking_tokens" ADD CONSTRAINT "booking_tokens_patient_id_patients_id_fk" FOREIGN KEY ("patient_id") REFERENCES "public"."patients"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

DO $$ BEGIN
    ALTER TABLE "booking_tokens" ADD CONSTRAINT "booking_tokens_created_by_users_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint

CREATE UNIQUE INDEX IF NOT EXISTS "booking_tokens_hash_uq" ON "booking_tokens" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_tokens_patient_idx" ON "booking_tokens" USING btree ("patient_id");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "booking_tokens_clinic_idx" ON "booking_tokens" USING btree ("clinic_id");--> statement-breakpoint
