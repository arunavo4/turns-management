ALTER TABLE "audit_logs" DROP CONSTRAINT "audit_logs_user_id_app_users_id_fk";
--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "user_id" SET DATA TYPE text;