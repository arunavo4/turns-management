ALTER TABLE "audit_logs" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "audit_logs" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "documents" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "lock_box_install_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "change_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "change_date" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "lock_box_history" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "move_in_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "move_out_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "properties" ALTER COLUMN "last_turn_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "property_types" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "property_types" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "property_types" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "property_types" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "property_utilities" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "property_utilities" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "property_utilities" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "property_utilities" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turn_history" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turn_history" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turn_history" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turn_history" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turn_stages" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turn_stages" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turn_stages" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turn_stages" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "move_out_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "turn_assignment_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "turn_due_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "turn_completion_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "punch_list_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "scan_360_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "leasing_date" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "dfo_approved_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "turns" ALTER COLUMN "ho_approved_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "app_users" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "app_users" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "app_users" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "app_users" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "utility_providers" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "utility_providers" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "created_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "created_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "updated_at" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "updated_at" DROP DEFAULT;--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "insurance_expiry" SET DATA TYPE bigint;--> statement-breakpoint
ALTER TABLE "vendors" ALTER COLUMN "last_job_date" SET DATA TYPE bigint;