-- Add missing columns to turn_stages table
ALTER TABLE turn_stages 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS color VARCHAR(7) DEFAULT '#6B7280',
ADD COLUMN IF NOT EXISTS icon VARCHAR(50),
ADD COLUMN IF NOT EXISTS required_fields TEXT[],
ADD COLUMN IF NOT EXISTS allowed_transitions UUID[],
ADD COLUMN IF NOT EXISTS auto_status VARCHAR(50);

-- Add missing columns to turns table
ALTER TABLE turns
ADD COLUMN IF NOT EXISTS stage_entered_at BIGINT,
ADD COLUMN IF NOT EXISTS stage_duration BIGINT;

-- Update existing turn_stages with slugs
UPDATE turn_stages SET slug = LOWER(REPLACE(name, ' ', '-')) WHERE slug IS NULL;

-- Make slug NOT NULL after populating it
ALTER TABLE turn_stages ALTER COLUMN slug SET NOT NULL;

-- Delete any existing default stages (if they exist without slugs)
DELETE FROM turn_stages WHERE slug IS NULL;

-- Insert or update default stages
INSERT INTO turn_stages (name, slug, sequence, color, icon, description, auto_status, requires_approval, created_at, updated_at) VALUES
  ('Draft', 'draft', 1, '#6B7280', 'file-text', 'Initial turn creation', 'DRAFT', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Secure Property', 'secure-property', 2, '#F59E0B', 'lock', 'Property needs to be secured', 'PENDING', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Inspection', 'inspection', 3, '#3B82F6', 'search', 'Property inspection in progress', 'IN_PROGRESS', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Scope Review', 'scope-review', 4, '#8B5CF6', 'clipboard-check', 'Reviewing scope of work', 'IN_PROGRESS', true, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Vendor Assigned', 'vendor-assigned', 5, '#10B981', 'user-check', 'Vendor has been assigned', 'IN_PROGRESS', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Turns In Progress', 'turns-in-progress', 6, '#0EA5E9', 'hammer', 'Work is in progress', 'IN_PROGRESS', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Change Order', 'change-order', 7, '#F97316', 'alert-circle', 'Change order required', 'ON_HOLD', true, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('Turns Complete', 'turns-complete', 8, '#059669', 'check-circle', 'Work has been completed', 'COMPLETED', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000),
  ('360 Scan', '360-scan', 9, '#7C3AED', 'camera', '360 scan completed', 'COMPLETED', false, EXTRACT(EPOCH FROM NOW()) * 1000, EXTRACT(EPOCH FROM NOW()) * 1000)
ON CONFLICT (slug) DO UPDATE SET
  name = EXCLUDED.name,
  sequence = EXCLUDED.sequence,
  color = EXCLUDED.color,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  auto_status = EXCLUDED.auto_status,
  requires_approval = EXCLUDED.requires_approval;