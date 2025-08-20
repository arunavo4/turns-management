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

export const auditActionEnum = pgEnum('audit_action', [
  'CREATE',
  'UPDATE',
  'DELETE',
  'VIEW',
  'EXPORT',
  'APPROVE',
  'REJECT',
  'ASSIGN',
  'COMPLETE'
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

// Import Better Auth generated schema for auth tables
import { user, session, account, verification as authVerification } from './auth-schema';

// Re-export auth tables
export { user, session, account };
export const verification = authVerification;

// Extended user table for our app (separate from Better Auth user table)
export const users = pgTable('app_users', {
  ...baseColumns,
  authUserId: text('auth_user_id').notNull().references(() => user.id, { onDelete: 'cascade' }).unique(),
  role: userRoleEnum('role').default('PROPERTY_MANAGER'),
  phone: varchar('phone', { length: 20 }),
  active: boolean('active').default(true)
});

// Aliases for backward compatibility
export const sessions = session;
export const accounts = account;

// Property Types table
export const propertyTypes = pgTable('property_types', {
  ...baseColumns,
  name: varchar('name', { length: 100 }).notNull().unique(),
  description: text('description'),
  isActive: boolean('is_active').default(true)
});

// Properties table
export const properties = pgTable('properties', {
  ...baseColumns,
  propertyId: varchar('property_id', { length: 100 }).notNull().unique(), // Unique property identifier
  name: varchar('name', { length: 255 }).notNull(),
  address: varchar('address', { length: 500 }).notNull(),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 10 }),
  county: varchar('county', { length: 100 }), // County information
  type: propertyTypeEnum('type').default('single_family'),
  propertyTypeId: uuid('property_type_id').references(() => propertyTypes.id), // Reference to property types
  status: propertyStatusEnum('status').default('active'),
  bedrooms: integer('bedrooms'),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  squareFeet: integer('square_feet'),
  yearBuilt: integer('year_built'),
  monthlyRent: decimal('monthly_rent', { precision: 10, scale: 2 }),
  market: varchar('market', { length: 100 }), // Market area
  owner: varchar('owner', { length: 255 }), // Property owner
  propertyManagerId: uuid('property_manager_id').references(() => users.id),
  seniorPropertyManagerId: uuid('senior_property_manager_id').references(() => users.id),
  renovationTechnicianId: uuid('renovation_technician_id').references(() => users.id),
  propertyUpdatorId: uuid('property_updator_id').references(() => users.id),
  statusYardi: varchar('status_yardi', { length: 100 }), // Yardi system status
  isCore: boolean('is_core').default(true),
  inDisposition: boolean('in_disposition').default(false), // Property disposal status
  section8: boolean('section_8').default(false), // Section 8 eligibility
  insurance: boolean('insurance').default(false), // Insurance status
  squatters: boolean('squatters').default(false), // Squatter status
  ownership: boolean('ownership').default(true), // Ownership status
  moveInDate: timestamp('move_in_date'), // Move-in date
  moveOutDate: timestamp('move_out_date'), // Move-out date
  lastTurnDate: timestamp('last_turn_date'),
  utilities: jsonb('utilities').default({
    power: false,
    water: false,
    gas: false
  }),
  images: jsonb('images').default([]), // Array of image URLs
  notes: text('notes'),
  color: integer('color').default(7) // Color coding for UI (7=green for core, 11=orange for non-core)
});

// Audit Logs table for enterprise tracking
export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // What was changed
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: auditActionEnum('action').notNull(),
  
  // Who made the change
  userId: uuid('user_id').notNull().references(() => users.id),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  userRole: userRoleEnum('user_role'),
  
  // What changed
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: jsonb('changed_fields'),
  
  // Related records
  propertyId: uuid('property_id').references(() => properties.id),
  turnId: uuid('turn_id'),
  vendorId: uuid('vendor_id').references(() => vendors.id),
  
  // Context
  context: varchar('context', { length: 255 }),
  ipAddress: varchar('ip_address', { length: 45 }),
  userAgent: text('user_agent'),
  
  // Metadata
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Lock Box History table for property security tracking
export const lockBoxHistory = pgTable('lock_box_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  turnId: uuid('turn_id'),
  
  lockBoxInstallDate: timestamp('lock_box_install_date'),
  lockBoxLocation: varchar('lock_box_location', { length: 255 }),
  oldLockBoxCode: varchar('old_lock_box_code', { length: 50 }),
  newLockBoxCode: varchar('new_lock_box_code', { length: 50 }),
  changeDate: timestamp('change_date').defaultNow(),
  changedBy: uuid('changed_by').references(() => users.id),
  reason: text('reason'),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
});

// Utility Providers table
export const utilityProviders = pgTable('utility_providers', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  type: varchar('type', { length: 50 }).notNull(), // 'power', 'water', 'gas', 'sewer', 'trash'
  contactPhone: varchar('contact_phone', { length: 20 }),
  contactEmail: varchar('contact_email', { length: 255 }),
  website: varchar('website', { length: 500 }),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow().notNull()
});

// Property Utilities table for detailed utility tracking
export const propertyUtilities = pgTable('property_utilities', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  
  // Utility flags
  wellWaterAvailable: boolean('well_water_available').default(false),
  septicTankAvailable: boolean('septic_tank_available').default(false),
  gasNotAvailable: boolean('gas_not_available').default(false),
  powerNotAvailable: boolean('power_not_available').default(false),
  trashNotAvailable: boolean('trash_not_available').default(false),
  
  // Water
  waterProviderId: uuid('water_provider_id').references(() => utilityProviders.id),
  waterAccountNumber: varchar('water_account_number', { length: 100 }),
  waterWithResident: boolean('water_with_resident').default(false),
  waterDeposit: decimal('water_deposit', { precision: 10, scale: 2 }),
  
  // Gas
  gasProviderId: uuid('gas_provider_id').references(() => utilityProviders.id),
  gasAccountNumber: varchar('gas_account_number', { length: 100 }),
  gasWithResident: boolean('gas_with_resident').default(false),
  gasDeposit: decimal('gas_deposit', { precision: 10, scale: 2 }),
  
  // Sewer
  sewerInfoSameAsWater: boolean('sewer_info_same_as_water').default(false),
  sewerProviderId: uuid('sewer_provider_id').references(() => utilityProviders.id),
  sewerAccountNumber: varchar('sewer_account_number', { length: 100 }),
  sewerWithResident: boolean('sewer_with_resident').default(false),
  sewerDeposit: decimal('sewer_deposit', { precision: 10, scale: 2 }),
  
  // Power
  powerProviderId: uuid('power_provider_id').references(() => utilityProviders.id),
  powerAccountNumber: varchar('power_account_number', { length: 100 }),
  powerWithResident: boolean('power_with_resident').default(false),
  powerDeposit: decimal('power_deposit', { precision: 10, scale: 2 }),
  
  // Trash
  trashProviderId: uuid('trash_provider_id').references(() => utilityProviders.id),
  trashAccountNumber: varchar('trash_account_number', { length: 100 }),
  trashWithResident: boolean('trash_with_resident').default(false),
  trashDeposit: decimal('trash_deposit', { precision: 10, scale: 2 }),
  
  // Metadata
  occupancyStatus: varchar('occupancy_status', { length: 50 }),
  ownedBy: varchar('owned_by', { length: 255 }),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull()
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
  // Additional fields for compatibility with UI
  averageCost: decimal('average_cost', { precision: 10, scale: 2 }),
  completedJobs: integer('completed_jobs').default(0),
  onTimeRate: decimal('on_time_rate', { precision: 5, scale: 2 }),
  lastJobDate: timestamp('last_job_date'),
  notes: text('notes'),
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