ALTER TABLE "accounts" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "accounts" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "uploaded_by" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "property_manager_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "senior_property_manager_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "sessions" ALTER COLUMN "user_id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "turn_history" ALTER COLUMN "changed_by" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "dfo_approved_by" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "ho_approved_by" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "id" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "created_by" SET DATA TYPE varchar(255);--> statement-breakpoint
ALTER TABLE "users" ALTER COLUMN "updated_by" SET DATA TYPE varchar(255);