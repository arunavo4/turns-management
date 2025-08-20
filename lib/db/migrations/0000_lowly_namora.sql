CREATE TYPE "public"."audit_action" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT', 'APPROVE', 'REJECT', 'ASSIGN', 'COMPLETE');--> statement-breakpoint
CREATE TYPE "public"."property_status" AS ENUM('active', 'inactive', 'occupied', 'vacant', 'maintenance', 'pending_turn');--> statement-breakpoint
CREATE TYPE "public"."property_type" AS ENUM('single_family', 'multi_family', 'apartment', 'condo', 'townhouse', 'commercial');--> statement-breakpoint
CREATE TYPE "public"."turn_priority" AS ENUM('low', 'medium', 'high', 'urgent');--> statement-breakpoint
CREATE TYPE "public"."turn_status" AS ENUM('draft', 'secure_property', 'inspection', 'scope_review', 'vendor_assigned', 'in_progress', 'change_order', 'complete', 'scan_360');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER', 'SR_PROPERTY_MANAGER', 'VENDOR', 'INSPECTOR', 'DFO_APPROVER', 'HO_APPROVER');--> statement-breakpoint
CREATE TABLE "account" (
	"id" text PRIMARY KEY NOT NULL,
	"account_id" text NOT NULL,
	"provider_id" text NOT NULL,
	"user_id" text NOT NULL,
	"access_token" text,
	"refresh_token" text,
	"id_token" text,
	"access_token_expires_at" timestamp,
	"refresh_token_expires_at" timestamp,
	"scope" text,
	"password" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"table_name" varchar(100) NOT NULL,
	"record_id" uuid NOT NULL,
	"action" "audit_action" NOT NULL,
	"user_id" uuid NOT NULL,
	"user_email" varchar(255) NOT NULL,
	"user_role" "user_role",
	"old_values" jsonb,
	"new_values" jsonb,
	"changed_fields" jsonb,
	"property_id" uuid,
	"turn_id" uuid,
	"vendor_id" uuid,
	"context" varchar(255),
	"ip_address" varchar(45),
	"user_agent" text,
	"metadata" jsonb,
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
CREATE TABLE "lock_box_history" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"turn_id" uuid,
	"lock_box_install_date" timestamp,
	"lock_box_location" varchar(255),
	"old_lock_box_code" varchar(50),
	"new_lock_box_code" varchar(50),
	"change_date" timestamp DEFAULT now(),
	"changed_by" uuid,
	"reason" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "properties" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"property_id" varchar(100) NOT NULL,
	"name" varchar(255) NOT NULL,
	"address" varchar(500) NOT NULL,
	"city" varchar(100),
	"state" varchar(50),
	"zip_code" varchar(10),
	"county" varchar(100),
	"type" "property_type" DEFAULT 'single_family',
	"property_type_id" uuid,
	"status" "property_status" DEFAULT 'active',
	"bedrooms" integer,
	"bathrooms" numeric(3, 1),
	"square_feet" integer,
	"year_built" integer,
	"monthly_rent" numeric(10, 2),
	"market" varchar(100),
	"owner" varchar(255),
	"property_manager_id" uuid,
	"senior_property_manager_id" uuid,
	"renovation_technician_id" uuid,
	"property_updator_id" uuid,
	"status_yardi" varchar(100),
	"is_core" boolean DEFAULT true,
	"in_disposition" boolean DEFAULT false,
	"section_8" boolean DEFAULT false,
	"insurance" boolean DEFAULT false,
	"squatters" boolean DEFAULT false,
	"ownership" boolean DEFAULT true,
	"move_in_date" timestamp,
	"move_out_date" timestamp,
	"last_turn_date" timestamp,
	"utilities" jsonb DEFAULT '{"power":false,"water":false,"gas":false}'::jsonb,
	"images" jsonb DEFAULT '[]'::jsonb,
	"notes" text,
	"color" integer DEFAULT 7,
	CONSTRAINT "properties_property_id_unique" UNIQUE("property_id")
);
--> statement-breakpoint
CREATE TABLE "property_types" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"name" varchar(100) NOT NULL,
	"description" text,
	"is_active" boolean DEFAULT true,
	CONSTRAINT "property_types_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "property_utilities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"property_id" uuid NOT NULL,
	"well_water_available" boolean DEFAULT false,
	"septic_tank_available" boolean DEFAULT false,
	"gas_not_available" boolean DEFAULT false,
	"power_not_available" boolean DEFAULT false,
	"trash_not_available" boolean DEFAULT false,
	"water_provider_id" uuid,
	"water_account_number" varchar(100),
	"water_with_resident" boolean DEFAULT false,
	"water_deposit" numeric(10, 2),
	"gas_provider_id" uuid,
	"gas_account_number" varchar(100),
	"gas_with_resident" boolean DEFAULT false,
	"gas_deposit" numeric(10, 2),
	"sewer_info_same_as_water" boolean DEFAULT false,
	"sewer_provider_id" uuid,
	"sewer_account_number" varchar(100),
	"sewer_with_resident" boolean DEFAULT false,
	"sewer_deposit" numeric(10, 2),
	"power_provider_id" uuid,
	"power_account_number" varchar(100),
	"power_with_resident" boolean DEFAULT false,
	"power_deposit" numeric(10, 2),
	"trash_provider_id" uuid,
	"trash_account_number" varchar(100),
	"trash_with_resident" boolean DEFAULT false,
	"trash_deposit" numeric(10, 2),
	"occupancy_status" varchar(50),
	"owned_by" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"expires_at" timestamp NOT NULL,
	"token" text NOT NULL,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	"ip_address" text,
	"user_agent" text,
	"user_id" text NOT NULL,
	CONSTRAINT "session_token_unique" UNIQUE("token")
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
CREATE TABLE "user" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"email_verified" boolean NOT NULL,
	"image" text,
	"created_at" timestamp NOT NULL,
	"updated_at" timestamp NOT NULL,
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "app_users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	"version" integer DEFAULT 1 NOT NULL,
	"created_by" uuid,
	"updated_by" uuid,
	"auth_user_id" text NOT NULL,
	"role" "user_role" DEFAULT 'PROPERTY_MANAGER',
	"phone" varchar(20),
	"active" boolean DEFAULT true,
	CONSTRAINT "app_users_auth_user_id_unique" UNIQUE("auth_user_id")
);
--> statement-breakpoint
CREATE TABLE "utility_providers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255) NOT NULL,
	"type" varchar(50) NOT NULL,
	"contact_phone" varchar(20),
	"contact_email" varchar(255),
	"website" varchar(500),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
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
CREATE TABLE "verification" (
	"id" text PRIMARY KEY NOT NULL,
	"identifier" text NOT NULL,
	"value" text NOT NULL,
	"expires_at" timestamp NOT NULL,
	"created_at" timestamp,
	"updated_at" timestamp
);
--> statement-breakpoint
ALTER TABLE "account" ADD CONSTRAINT "account_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_app_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_uploaded_by_app_users_id_fk" FOREIGN KEY ("uploaded_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lock_box_history" ADD CONSTRAINT "lock_box_history_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "lock_box_history" ADD CONSTRAINT "lock_box_history_changed_by_app_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_type_id_property_types_id_fk" FOREIGN KEY ("property_type_id") REFERENCES "public"."property_types"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_manager_id_app_users_id_fk" FOREIGN KEY ("property_manager_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_senior_property_manager_id_app_users_id_fk" FOREIGN KEY ("senior_property_manager_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_renovation_technician_id_app_users_id_fk" FOREIGN KEY ("renovation_technician_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "properties" ADD CONSTRAINT "properties_property_updator_id_app_users_id_fk" FOREIGN KEY ("property_updator_id") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utilities" ADD CONSTRAINT "property_utilities_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utilities" ADD CONSTRAINT "property_utilities_water_provider_id_utility_providers_id_fk" FOREIGN KEY ("water_provider_id") REFERENCES "public"."utility_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utilities" ADD CONSTRAINT "property_utilities_gas_provider_id_utility_providers_id_fk" FOREIGN KEY ("gas_provider_id") REFERENCES "public"."utility_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utilities" ADD CONSTRAINT "property_utilities_sewer_provider_id_utility_providers_id_fk" FOREIGN KEY ("sewer_provider_id") REFERENCES "public"."utility_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utilities" ADD CONSTRAINT "property_utilities_power_provider_id_utility_providers_id_fk" FOREIGN KEY ("power_provider_id") REFERENCES "public"."utility_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "property_utilities" ADD CONSTRAINT "property_utilities_trash_provider_id_utility_providers_id_fk" FOREIGN KEY ("trash_provider_id") REFERENCES "public"."utility_providers"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_history" ADD CONSTRAINT "turn_history_turn_id_turns_id_fk" FOREIGN KEY ("turn_id") REFERENCES "public"."turns"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turn_history" ADD CONSTRAINT "turn_history_changed_by_app_users_id_fk" FOREIGN KEY ("changed_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_property_id_properties_id_fk" FOREIGN KEY ("property_id") REFERENCES "public"."properties"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_stage_id_turn_stages_id_fk" FOREIGN KEY ("stage_id") REFERENCES "public"."turn_stages"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_vendor_id_vendors_id_fk" FOREIGN KEY ("vendor_id") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_assigned_flooring_vendor_vendors_id_fk" FOREIGN KEY ("assigned_flooring_vendor") REFERENCES "public"."vendors"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_dfo_approved_by_app_users_id_fk" FOREIGN KEY ("dfo_approved_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "turns" ADD CONSTRAINT "turns_ho_approved_by_app_users_id_fk" FOREIGN KEY ("ho_approved_by") REFERENCES "public"."app_users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "app_users" ADD CONSTRAINT "app_users_auth_user_id_user_id_fk" FOREIGN KEY ("auth_user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;