import { pgTable, uuid, varchar, integer, boolean, timestamp, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { turns } from './turns';

export const turnStages = pgTable('turn_stages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  key: varchar('key', { length: 50 }).notNull().unique(), // e.g., 'draft', 'secure_property'
  sequence: integer('sequence').notNull().default(0),
  color: varchar('color', { length: 20 }).default('gray'), // Color for the column
  icon: varchar('icon', { length: 50 }), // Icon name for the stage
  description: varchar('description', { length: 500 }),
  
  // Stage configuration
  isActive: boolean('is_active').default(true),
  isDefault: boolean('is_default').default(false), // Default stage for new turns
  isFinal: boolean('is_final').default(false), // Final/completed stage
  
  // Business rules
  requiresApproval: boolean('requires_approval').default(false),
  requiresVendor: boolean('requires_vendor').default(false),
  requiresAmount: boolean('requires_amount').default(false),
  requiresLockBox: boolean('requires_lock_box').default(false),
  
  // Email notifications config
  emailConfig: jsonb('email_config').$type<{
    sendToUsers?: boolean;
    sendToVendor?: boolean;
    userTemplateId?: string;
    vendorTemplateId?: string;
    notifyUserIds?: string[];
    ccUserIds?: string[];
  }>(),
  
  // Workflow automation
  autoTransitions: jsonb('auto_transitions').$type<{
    nextStageKey?: string;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  }>(),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
});

export const turnStagesRelations = relations(turnStages, ({ many }) => ({
  turns: many(turns),
}));

// Default stages matching the Odoo app
export const DEFAULT_TURN_STAGES = [
  {
    key: 'draft',
    name: 'Draft',
    sequence: 1,
    color: 'gray',
    icon: 'IconFile',
    description: 'Initial turn creation',
    isDefault: true,
  },
  {
    key: 'secure_property',
    name: 'Secure Property',
    sequence: 2,
    color: 'yellow',
    icon: 'IconLock',
    description: 'Property needs to be secured',
    requiresLockBox: true,
  },
  {
    key: 'inspection',
    name: 'Inspection',
    sequence: 3,
    color: 'blue',
    icon: 'IconEye',
    description: 'Property inspection phase',
  },
  {
    key: 'scope_review',
    name: 'Scope Review',
    sequence: 4,
    color: 'purple',
    icon: 'IconClipboardList',
    description: 'Review scope of work',
    requiresApproval: true,
    requiresAmount: true,
  },
  {
    key: 'vendor_assigned',
    name: 'Vendor Assigned',
    sequence: 5,
    color: 'indigo',
    icon: 'IconUsers',
    description: 'Vendor has been assigned',
    requiresVendor: true,
  },
  {
    key: 'in_progress',
    name: 'In Progress',
    sequence: 6,
    color: 'orange',
    icon: 'IconRefresh',
    description: 'Turn work in progress',
  },
  {
    key: 'change_order',
    name: 'Change Order',
    sequence: 7,
    color: 'amber',
    icon: 'IconExclamationTriangle',
    description: 'Change order required',
    requiresApproval: true,
  },
  {
    key: 'turns_complete',
    name: 'Turns Complete',
    sequence: 8,
    color: 'green',
    icon: 'IconCircleCheck',
    description: 'Turn work completed',
    isFinal: true,
  },
  {
    key: 'scan_360',
    name: '360 Scan',
    sequence: 9,
    color: 'teal',
    icon: 'IconCamera',
    description: '360 degree scan completed',
  },
];