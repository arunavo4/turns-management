CREATE TABLE "user_preferences" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" text NOT NULL,
	"email_notifications" boolean DEFAULT true,
	"turn_approvals" boolean DEFAULT true,
	"overdue_turns" boolean DEFAULT true,
	"vendor_updates" boolean DEFAULT false,
	"weekly_reports" boolean DEFAULT true,
	"theme" varchar(20) DEFAULT 'light',
	"language" varchar(10) DEFAULT 'en',
	"timezone" varchar(50) DEFAULT 'America/Los_Angeles',
	"date_format" varchar(20) DEFAULT 'MM/DD/YYYY',
	"session_timeout" varchar(10) DEFAULT '4h',
	"two_factor_enabled" boolean DEFAULT false,
	"additional_settings" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "user_preferences_user_id_unique" UNIQUE("user_id")
);
