CREATE TYPE "public"."property_status" AS ENUM('active', 'inactive', 'occupied', 'vacant', 'maintenance', 'pending_turn');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."turn_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."turn_status" AS ENUM('draft', 'secure_property', 'inspection', 'scope_review', 'vendor_assigned', 'in_progress', 'change_order', 'complete', 'scan_360');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'SR_PROPERTY_MANAGER', 'VENDOR', 'INSPECTOR', 'DFO_APPROVER', 'HO_APPROVER');--> statement-breakpoint
CREATE TABLE "accounts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"account_id" varchar(255) NOT NULL,
	"provider_id" varchar(255) NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"expires_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"turn_id" uuid,
	"property_id" uuid,
	"vendor_id" uuid,
	"file_name" varchar(255) NOT NULL,
	"file_size" integer,
	"mime_type" varchar(100),
	"url" text NOT NULL,
	"category" varchar(50),
	"description" text,
	"uploaded_by" uuid
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(10),
	"type" "property_type" DEFAULT 'single_family',
	"status" "property_status" DEFAULT 'active',
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"square_feet" integer,
	"year_built" integer,
	"monthly_rent" numeric(10, 2),
	"property_manager_id" uuid,
	"senior_property_manager_id" uuid,
	"is_core" boolean DEFAULT true,
	"last_turn_date" timestamp,
	"utilities" jsonb DEFAULT '{"power":false,"water":false,"gas":false}'::jsonb,
	"notes" text
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" varchar(255) PRIMARY KEY NOT NULL,
	"user_id" uuid NOT NULL,
	"expires_at" timestamp NOT NULL,
	"ip_address" varchar(45),
	"user_agent" text
);
--> statement-breakpoint
CREATE TABLE "turn_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"turn_id" uuid NOT NULL,
	"action" varchar(100) NOT NULL,
	"previous_status" "turn_status",
	"new_status" "turn_status",
	"previous_stage_id" uuid,
	"new_stage_id" uuid,
	"changed_by" uuid,
	"comment" text,
	"changed_data" jsonb
);
--> statement-breakpoint
CREATE TABLE "turn_stages" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" varchar(100) NOT NULL,
	"sequence" integer NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	"requires_approval" boolean DEFAULT false,
	"approval_threshold" numeric(10, 2),
	CONSTRAINT "turn_stages_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "turns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"turn_number" varchar(50) NOT NULL,
	"property_id" uuid NOT NULL,
	"status" "turn_status" DEFAULT 'draft',
	"priority" "turn_priority" DEFAULT 'medium',
	"stage_id" uuid,
	"move_out_date" timestamp,
	"turn_assignment_date" timestamp,
	"turn_due_date" timestamp,
	"turn_completion_date" timestamp,
	"punch_list_date" timestamp,
	"scan_360_date" timestamp,
	"leasing_date" timestamp,
	"vendor_id" uuid,
	"assigned_flooring_vendor" uuid,
	"estimated_cost" numeric(10, 2),
	"actual_cost" numeric(10, 2),
	"total_turn_amount" numeric(10, 2),
	"needs_dfo_approval" boolean DEFAULT false,
	"needs_ho_approval" boolean DEFAULT false,
	"dfo_approved_by" uuid,
	"ho_approved_by" uuid,
	"dfo_approved_at" timestamp,
	"ho_approved_at" timestamp,
	"rejection_reason" text,
	"work_order_number" varchar(100),
	"scope_of_work" text,
	"completion_rate" integer DEFAULT 0,
	"power_status" boolean,
	"water_status" boolean,
	"gas_status" boolean,
	"trash_out_needed" boolean DEFAULT false,
	"appliances_needed" boolean DEFAULT false,
	"appliances_ordered" boolean DEFAULT false,
	"change_order_submitted" boolean DEFAULT false,
	"attachments" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"metadata" jsonb DEFAULT '{}'::jsonb,
	CONSTRAINT "turns_turn_number_unique" UNIQUE("turn_number")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"email" varchar(255) NOT NULL,
	"email_verified" boolean DEFAULT false,
	"name" varchar(255),
	"image" text,
	"role" "user_role" DEFAULT 'PROPERTY_MANAGER',
	"phone" varchar(20),
	"active" boolean DEFAULT true,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vendors" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"company_name" varchar(255) NOT NULL,
	"contact_name" varchar(255),
	"email" varchar(255),
	"phone" varchar(20),
	"address" varchar(500),
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(10),
	"specialties" jsonb DEFAULT '[]'::jsonb,
	"insurance_expiry" timestamp,
	"license_number" varchar(100),
	"rating" numeric(3, 2),
	"is_approved" boolean DEFAULT false,
	"is_active" boolean DEFAULT true,
	"performance_metrics" jsonb DEFAULT '{"completedTurns":0,"avgCompletionTime":0,"avgRating":0,"onTimeRate":0}'::jsonb,
	CONSTRAINT "vendors_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_manager_id_users_id_fk" FOREIGN KEY ("property_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_senior_property_manager_id_users_id_fk" FOREIGN KEY ("senior_property_manager_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_history" ADD CONSTRAINT "turn_history_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_history" ADD CONSTRAINT "turn_history_changed_by_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_stage_id_turn_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."turn_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_assigned_flooring_vendor_vendors_id_fk" FOREIGN KEY ("assigned_flooring_vendor") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_dfo_approved_by_users_id_fk" FOREIGN KEY ("dfo_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_ho_approved_by_users_id_fk" FOREIGN KEY ("ho_approved_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;