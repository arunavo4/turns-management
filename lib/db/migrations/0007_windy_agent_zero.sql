CREATE TYPE "public"."utility_bill_status" AS ENUM('paid', 'unpaid', 'overdue', 'disputed', 'partial');--> statement-breakpoint
CREATE TYPE "public"."utility_type" AS ENUM('power', 'gas', 'water', 'sewer', 'trash', 'internet', 'cable');--> statement-breakpoint
CREATE TABLE "property_utility_bills" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" bigint NOT NULL,
	"updated_at" bigint NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"property_id" uuid NOT NULL,
	"provider_id" uuid,
	"utility_type" "utility_type" NOT NULL,
	"billing_start_date" bigint NOT NULL,
	"billing_end_date" bigint NOT NULL,
	"due_date" bigint NOT NULL,
	"current_charges" numeric(10, 2) NOT NULL,
	"previous_balance" numeric(10, 2) DEFAULT '0',
	"late_fee" numeric(10, 2) DEFAULT '0',
	"other_charges" numeric(10, 2) DEFAULT '0',
	"total_amount" numeric(10, 2) NOT NULL,
	"amount_paid" numeric(10, 2) DEFAULT '0',
	"status" "utility_bill_status" DEFAULT 'unpaid' NOT NULL,
	"paid_date" bigint,
	"account_number" varchar(100),
	"meter_reading" varchar(50),
	"usage_amount" numeric(10, 3),
	"usage_unit" varchar(20),
	"bill_document" text,
	"payment_confirmation" text,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb
);
--> statement-breakpoint
CREATE TABLE "turn_stage_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"turn_id" uuid NOT NULL,
	"from_stage_id" uuid,
	"to_stage_id" uuid NOT NULL,
	"transitioned_by" varchar(255) NOT NULL,
	"transition_reason" text,
	"duration_in_stage" bigint,
	"created_at" bigint NOT NULL
);
--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "primary_lock_box_code" varchar(50);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "lock_box_location" varchar(50);--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "lock_box_install_date" bigint;--> statement-breakpoint
ALTER TABLE "properties" ADD COLUMN "lock_box_notes" text;--> statement-breakpoint
ALTER TABLE "turn_stages" ADD COLUMN "slug" varchar(255) NOT NULL;--> statement-breakpoint
ALTER TABLE "turn_stages" ADD COLUMN "color" varchar(7) DEFAULT '#6B7280';--> statement-breakpoint
ALTER TABLE "turn_stages" ADD COLUMN "icon" varchar(50);--> statement-breakpoint
ALTER TABLE "turn_stages" ADD COLUMN "required_fields" text[];--> statement-breakpoint
ALTER TABLE "turn_stages" ADD COLUMN "allowed_transitions" uuid[];--> statement-breakpoint
ALTER TABLE "turn_stages" ADD COLUMN "auto_status" varchar(50);--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "stage_entered_at" bigint;--> statement-breakpoint
ALTER TABLE "turns" ADD COLUMN "stage_duration" bigint;--> statement-breakpoint
ALTER TABLE "property_utility_bills" ADD CONSTRAINT "property_utility_bills_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utility_bills" ADD CONSTRAINT "property_utility_bills_provider_id_utility_providers_id_fk" FOREIGN KEY ("provider_id") REFERENCES "public"."utility_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_stage_history" ADD CONSTRAINT "turn_stage_history_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_stage_history" ADD CONSTRAINT "turn_stage_history_from_stage_id_turn_stages_id_fk" FOREIGN KEY ("from_stage_id") REFERENCES "public"."turn_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_stage_history" ADD CONSTRAINT "turn_stage_history_to_stage_id_turn_stages_id_fk" FOREIGN KEY ("to_stage_id") REFERENCES "public"."turn_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_stages" ADD CONSTRAINT "turn_stages_slug_unique" UNIQUE("slug");