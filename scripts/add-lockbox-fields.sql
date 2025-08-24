-- Add lock box fields to properties table
ALTER TABLE properties ADD COLUMN IF NOT EXISTS primary_lock_box_code varchar(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lock_box_location varchar(50);
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lock_box_install_date bigint;
ALTER TABLE properties ADD COLUMN IF NOT EXISTS lock_box_notes text;