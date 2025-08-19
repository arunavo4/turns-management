import { pgTable, uuid, varchar, text, timestamp, boolean, integer, decimal, jsonb, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'ADMIN', 
  'PROPERTY_MANAGER',
  'SR_PROPERTY_MANAGER',
  'VENDOR',
  'INSPECTOR',
  'DFO_APPROVER',
  'HO_APPROVER'
]);

export const turnStatusEnum = pgEnum('turn_status', [
  'draft',
  'secure_property',
  'inspection',
  'scope_review',
  'vendor_assigned',
  'in_progress',
  'change_order',
  'complete',
  'scan_360'
]);

export const turnPriorityEnum = pgEnum('turn_priority', [
  'low',
  'medium',
  'high',
  'urgent'
]);

export const propertyStatusEnum = pgEnum('property_status', [
  'active',
  'inactive',
  'occupied',
  'vacant',
  'maintenance',
  'pending_turn'
]);

export const propertyTypeEnum = pgEnum('property_type', [
  'single_family',
  'multi_family',
  'apartment',
  'condo',
  'townhouse',
  'commercial'
]);

// Base columns for all tables
const baseColumns = {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').default(1).notNull(),
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by')
};

// Users table (for Better Auth)
export const users = pgTable('users', {
  ...baseColumns,
  email: varchar('email', { length: 255 }).unique().notNull(),
  emailVerified: boolean('email_verified').default(false),
  name: varchar('name', { length: 255 }),
  image: text('image'),
  role: userRoleEnum('role').default('PROPERTY_MANAGER'),
  phone: varchar('phone', { length: 20 }),
  active: boolean('active').default(true)
});

// Sessions table (for Better Auth)
export const sessions = pgTable('sessions', {
  id: varchar('id', { length: 255 }).primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent')
});

// Accounts table (for Better Auth OAuth)
export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  accountId: varchar('account_id', { length: 255 }).notNull(),
  providerId: varchar('provider_id', { length: 255 }).notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  expiresAt: timestamp('expires_at'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Properties table
export const properties = pgTable('properties', {
  ...baseColumns,
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  type: propertyTypeEnum('type').default('single_family'),
  status: propertyStatusEnum('status').default('active'),
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  squareFeet: integer('square_feet'),
  yearBuilt: integer('year_built'),
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }),
  propertyManagerId: uuid('property_manager_id').references(() => users.id),
  seniorPropertyManagerId: uuid('senior_property_manager_id').references(() => users.id),
  isCore: boolean('is_core').default(true),
  lastTurnDate: timestamp('last_turn_date'),
  utilities: jsonb('utilities').default({
    power: false,
    water: false,
    gas: false
  }),
  notes: text('notes')
});

// Vendors table
export const vendors = pgTable('vendors', {
  ...baseColumns,
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }).unique(),
  phone: varchar('phone', { length: 20 }),
  address: varchar('address', { length: 500 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  specialties: jsonb('specialties').default([]),
  insuranceExpiry: timestamp('insurance_expiry'),
  licenseNumber: varchar('license_number', { length: 100 }),
  rating: decimal('rating', { precision: 3, scale: 2 }),
  isApproved: boolean('is_approved').default(false),
  isActive: boolean('is_active').default(true),
  performanceMetrics: jsonb('performance_metrics').default({
    completedTurns: 0,
    avgCompletionTime: 0,
    avgRating: 0,
    onTimeRate: 0
  })
});

// Turn Stages table
export const turnStages = pgTable('turn_stages', {
  ...baseColumns,
  name: varchar('name', { length: 100 }).notNull().unique(),
  sequence: integer('sequence').notNull(),
  description: text('description'),
  isActive: boolean('is_active').default(true),
  requiresApproval: boolean('requires_approval').default(false),
  approvalThreshold: decimal('approval_threshold', { precision: 10, scale: 2 })
});

// Turns table
export const turns = pgTable('turns', {
  ...baseColumns,
  turnNumber: varchar('turn_number', { length: 50 }).unique().notNull(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  status: turnStatusEnum('status').default('draft'),
  priority: turnPriorityEnum('priority').default('medium'),
  stageId: uuid('stage_id').references(() => turnStages.id),
  
  // Dates
  moveOutDate: timestamp('move_out_date'),
  turnAssignmentDate: timestamp('turn_assignment_date'),
  turnDueDate: timestamp('turn_due_date'),
  turnCompletionDate: timestamp('turn_completion_date'),
  punchListDate: timestamp('punch_list_date'),
  scan360Date: timestamp('scan_360_date'),
  leasingDate: timestamp('leasing_date'),
  
  // Vendors
  vendorId: uuid('vendor_id').references(() => vendors.id),
  assignedFlooringVendor: uuid('assigned_flooring_vendor').references(() => vendors.id),
  
  // Costs
  estimatedCost: decimal('estimated_cost', { precision: 10, scale: 2 }),
  actualCost: decimal('actual_cost', { precision: 10, scale: 2 }),
  totalTurnAmount: decimal('total_turn_amount', { precision: 10, scale: 2 }),
  
  // Approval
  needsDfoApproval: boolean('needs_dfo_approval').default(false),
  needsHoApproval: boolean('needs_ho_approval').default(false),
  dfoApprovedBy: uuid('dfo_approved_by').references(() => users.id),
  hoApprovedBy: uuid('ho_approved_by').references(() => users.id),
  dfoApprovedAt: timestamp('dfo_approved_at'),
  hoApprovedAt: timestamp('ho_approved_at'),
  rejectionReason: text('rejection_reason'),
  
  // Work details
  workOrderNumber: varchar('work_order_number', { length: 100 }),
  scopeOfWork: text('scope_of_work'),
  completionRate: integer('completion_rate').default(0),
  
  // Utilities
  powerStatus: boolean('power_status'),
  waterStatus: boolean('water_status'),
  gasStatus: boolean('gas_status'),
  
  // Flags
  trashOutNeeded: boolean('trash_out_needed').default(false),
  appliancesNeeded: boolean('appliances_needed').default(false),
  appliancesOrdered: boolean('appliances_ordered').default(false),
  changeOrderSubmitted: boolean('change_order_submitted').default(false),
  
  // Additional data
  attachments: jsonb('attachments').default([]),
  notes: text('notes'),
  metadata: jsonb('metadata').default({})
});

// Turn History table
export const turnHistory = pgTable('turn_history', {
  ...baseColumns,
  turnId: uuid('turn_id').notNull().references(() => turns.id, { onDelete: 'cascade' }),
  action: varchar('action', { length: 100 }).notNull(),
  previousStatus: turnStatusEnum('previous_status'),
  newStatus: turnStatusEnum('new_status'),
  previousStageId: uuid('previous_stage_id'),
  newStageId: uuid('new_stage_id'),
  changedBy: uuid('changed_by').references(() => users.id),
  comment: text('comment'),
  changedData: jsonb('changed_data')
});

// Documents table
export const documents = pgTable('documents', {
  ...baseColumns,
  turnId: uuid('turn_id').references(() => turns.id, { onDelete: 'cascade' }),
  propertyId: uuid('property_id').references(() => properties.id, { onDelete: 'cascade' }),
  vendorId: uuid('vendor_id').references(() => vendors.id, { onDelete: 'cascade' }),
  fileName: varchar('file_name', { length: 255 }).notNull(),
  fileSize: integer('file_size'),
  mimeType: varchar('mime_type', { length: 100 }),
  url: text('url').notNull(),
  category: varchar('category', { length: 50 }),
  description: text('description'),
  uploadedBy: uuid('uploaded_by').references(() => users.id)
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  managedProperties: many(properties),
  approvedTurns: many(turns),
  turnHistory: many(turnHistory),
  documents: many(documents)
}));

export const propertiesRelations = relations(properties, ({ one, many }) => ({
  propertyManager: one(users, {
    fields: [properties.propertyManagerId],
    references: [users.id]
  }),
  seniorPropertyManager: one(users, {
    fields: [properties.seniorPropertyManagerId],
    references: [users.id]
  }),
  turns: many(turns),
  documents: many(documents)
}));

export const vendorsRelations = relations(vendors, ({ many }) => ({
  assignedTurns: many(turns),
  documents: many(documents)
}));

export const turnsRelations = relations(turns, ({ one, many }) => ({
  property: one(properties, {
    fields: [turns.propertyId],
    references: [properties.id]
  }),
  vendor: one(vendors, {
    fields: [turns.vendorId],
    references: [vendors.id]
  }),
  flooringVendor: one(vendors, {
    fields: [turns.assignedFlooringVendor],
    references: [vendors.id]
  }),
  stage: one(turnStages, {
    fields: [turns.stageId],
    references: [turnStages.id]
  }),
  dfoApprover: one(users, {
    fields: [turns.dfoApprovedBy],
    references: [users.id]
  }),
  hoApprover: one(users, {
    fields: [turns.hoApprovedBy],
    references: [users.id]
  }),
  history: many(turnHistory),
  documents: many(documents)
}));

export const turnHistoryRelations = relations(turnHistory, ({ one }) => ({
  turn: one(turns, {
    fields: [turnHistory.turnId],
    references: [turns.id]
  }),
  changedByUser: one(users, {
    fields: [turnHistory.changedBy],
    references: [users.id]
  })
}));

export const documentsRelations = relations(documents, ({ one }) => ({
  turn: one(turns, {
    fields: [documents.turnId],
    references: [turns.id]
  }),
  property: one(properties, {
    fields: [documents.propertyId],
    references: [properties.id]
  }),
  vendor: one(vendors, {
    fields: [documents.vendorId],
    references: [vendors.id]
  }),
  uploadedByUser: one(users, {
    fields: [documents.uploadedBy],
    references: [users.id]
  })
}));