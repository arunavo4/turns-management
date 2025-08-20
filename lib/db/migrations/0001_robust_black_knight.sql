ALTER TABLE "vendors" ADD COLUMN "average_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "completed_jobs" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "on_time_rate" numeric(5, 2);--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "last_job_date" timestamp;--> statement-breakpoint
ALTER TABLE "vendors" ADD COLUMN "notes" text;