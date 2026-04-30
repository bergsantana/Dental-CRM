ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "context_relevance" real;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "groundedness" real;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "answer_relevance" real;--> statement-breakpoint
ALTER TABLE "chat_messages" ADD COLUMN IF NOT EXISTS "metrics_per_chunk" jsonb;
