-- Create turn stages table for workflow configuration
CREATE TABLE IF NOT EXISTS turn_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  sequence INTEGER NOT NULL,
  color VARCHAR(7) DEFAULT '#6B7280',
  icon VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  required_fields TEXT[], -- Array of required field names for this stage
  allowed_transitions UUID[], -- Array of stage IDs this stage can transition to
  auto_status VARCHAR(50), -- Automatically set turn status when entering this stage
  requires_approval BOOLEAN DEFAULT false,
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000,
  updated_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Add stage_id to turns table if not exists
ALTER TABLE turns 
ADD COLUMN IF NOT EXISTS stage_id UUID REFERENCES turn_stages(id),
ADD COLUMN IF NOT EXISTS stage_entered_at BIGINT,
ADD COLUMN IF NOT EXISTS stage_duration BIGINT; -- Time spent in current stage (ms)

-- Create stage transition history table
CREATE TABLE IF NOT EXISTS turn_stage_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
  from_stage_id UUID REFERENCES turn_stages(id),
  to_stage_id UUID NOT NULL REFERENCES turn_stages(id),
  transitioned_by VARCHAR(255) NOT NULL,
  transition_reason TEXT,
  duration_in_stage BIGINT, -- Time spent in previous stage (ms)
  created_at BIGINT DEFAULT EXTRACT(EPOCH FROM NOW()) * 1000
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_turn_stages_sequence ON turn_stages(sequence);
CREATE INDEX IF NOT EXISTS idx_turn_stages_slug ON turn_stages(slug);
CREATE INDEX IF NOT EXISTS idx_turn_stages_active ON turn_stages(is_active);
CREATE INDEX IF NOT EXISTS idx_turns_stage_id ON turns(stage_id);
CREATE INDEX IF NOT EXISTS idx_turn_stage_history_turn_id ON turn_stage_history(turn_id);
CREATE INDEX IF NOT EXISTS idx_turn_stage_history_created_at ON turn_stage_history(created_at DESC);

-- Insert default stages based on Odoo implementation
INSERT INTO turn_stages (name, slug, sequence, color, icon, description, auto_status, requires_approval) VALUES
  ('Draft', 'draft', 1, '#6B7280', 'file-text', 'Initial turn creation', 'DRAFT', false),
  ('Secure Property', 'secure-property', 2, '#F59E0B', 'lock', 'Property needs to be secured', 'PENDING', false),
  ('Inspection', 'inspection', 3, '#3B82F6', 'search', 'Property inspection in progress', 'IN_PROGRESS', false),
  ('Scope Review', 'scope-review', 4, '#8B5CF6', 'clipboard-check', 'Reviewing scope of work', 'IN_PROGRESS', true),
  ('Vendor Assigned', 'vendor-assigned', 5, '#10B981', 'user-check', 'Vendor has been assigned', 'IN_PROGRESS', false),
  ('Turns In Progress', 'turns-in-progress', 6, '#0EA5E9', 'hammer', 'Work is in progress', 'IN_PROGRESS', false),
  ('Change Order', 'change-order', 7, '#F97316', 'alert-circle', 'Change order required', 'ON_HOLD', true),
  ('Turns Complete', 'turns-complete', 8, '#059669', 'check-circle', 'Work has been completed', 'COMPLETED', false),
  ('360 Scan', '360-scan', 9, '#7C3AED', 'camera', '360 scan completed', 'COMPLETED', false)
ON CONFLICT (slug) DO NOTHING;

-- Update allowed transitions for each stage
UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (2, 3, 7)
) WHERE slug = 'draft';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (3, 4)
) WHERE slug = 'secure-property';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (4, 5)
) WHERE slug = 'inspection';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (5, 7)
) WHERE slug = 'scope-review';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (6, 7)
) WHERE slug = 'vendor-assigned';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (7, 8)
) WHERE slug = 'turns-in-progress';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (6, 8)
) WHERE slug = 'change-order';

UPDATE turn_stages SET allowed_transitions = ARRAY(
  SELECT id FROM turn_stages WHERE sequence IN (9)
) WHERE slug = 'turns-complete';

-- Set required fields for specific stages
UPDATE turn_stages SET required_fields = ARRAY['propertyId', 'priority', 'estimatedCost'] 
WHERE slug = 'draft';

UPDATE turn_stages SET required_fields = ARRAY['lockBoxCode', 'lockBoxLocation'] 
WHERE slug = 'secure-property';

UPDATE turn_stages SET required_fields = ARRAY['inspectorId', 'inspectionDate'] 
WHERE slug = 'inspection';

UPDATE turn_stages SET required_fields = ARRAY['scopeOfWork', 'estimatedCost'] 
WHERE slug = 'scope-review';

UPDATE turn_stages SET required_fields = ARRAY['vendorId', 'turnAssignmentDate'] 
WHERE slug = 'vendor-assigned';

-- Migrate existing turns to appropriate stages based on status
UPDATE turns t
SET stage_id = (
  SELECT id FROM turn_stages 
  WHERE slug = CASE 
    WHEN t.status = 'DRAFT' THEN 'draft'
    WHEN t.status = 'PENDING' THEN 'secure-property'
    WHEN t.status = 'IN_PROGRESS' AND t.vendor_id IS NOT NULL THEN 'turns-in-progress'
    WHEN t.status = 'IN_PROGRESS' THEN 'inspection'
    WHEN t.status = 'COMPLETED' THEN 'turns-complete'
    WHEN t.status = 'ON_HOLD' THEN 'change-order'
    ELSE 'draft'
  END
),
stage_entered_at = EXTRACT(EPOCH FROM NOW()) * 1000
WHERE stage_id IS NULL;