-- Drop all tables to reset the database
-- Since we're in development, we can safely drop everything

DROP TABLE IF EXISTS audit_logs CASCADE;
DROP TABLE IF EXISTS documents CASCADE;
DROP TABLE IF EXISTS lock_box_history CASCADE;
DROP TABLE IF EXISTS property_utilities CASCADE;
DROP TABLE IF EXISTS turns CASCADE;
DROP TABLE IF EXISTS turn_history CASCADE;
DROP TABLE IF EXISTS properties CASCADE;
DROP TABLE IF EXISTS vendors CASCADE;
DROP TABLE IF EXISTS app_users CASCADE;
DROP TABLE IF EXISTS property_types CASCADE;
DROP TABLE IF EXISTS turn_stages CASCADE;
DROP TABLE IF EXISTS utility_providers CASCADE;

-- Drop the auth tables as well (they'll be recreated)
DROP TABLE IF EXISTS verification CASCADE;
DROP TABLE IF EXISTS account CASCADE;
DROP TABLE IF EXISTS session CASCADE;
DROP TABLE IF EXISTS "user" CASCADE;

-- Drop any custom types
DROP TYPE IF EXISTS user_role CASCADE;
DROP TYPE IF EXISTS property_type CASCADE;
DROP TYPE IF EXISTS property_status CASCADE;
DROP TYPE IF EXISTS turn_status CASCADE;
DROP TYPE IF EXISTS turn_priority CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;
DROP TYPE IF EXISTS document_type CASCADE;
DROP TYPE IF EXISTS approval_status CASCADE;

-- Now the schema is clean and ready for fresh migration