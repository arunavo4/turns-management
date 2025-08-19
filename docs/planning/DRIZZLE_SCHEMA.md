# Turns Management - Drizzle ORM Database Schema

## Overview
PostgreSQL database schema for the Turns Management application using Drizzle ORM with comprehensive audit logging for enterprise requirements.

## Setup

### Installation
```bash
npm install drizzle-orm postgres
npm install -D drizzle-kit @types/pg
```

### Configuration
Create `drizzle.config.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/schema/*',
  out: './drizzle',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.DATABASE_URL!
  },
  verbose: true,
  strict: true
})
```

## Core Schema Files

### 1. Users & Authentication Schema
`src/db/schema/users.ts`

```typescript
import { pgTable, uuid, varchar, boolean, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN',
  'ADMIN', 
  'PROPERTY_MANAGER',
  'SR_PROPERTY_MANAGER',
  'VENDOR',
  'INSPECTOR',
  'DFO_APPROVER',
  'HO_APPROVER',
  'USER'
])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').notNull().default('USER'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: boolean('email_verified').notNull().default(false),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  lastLogin: timestamp('last_login'),
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  isActiveIdx: index('users_is_active_idx').on(table.isActive),
}))

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
}))

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  sessions: many(sessions),
  managedProperties: many(properties),
  auditLogs: many(auditLogs),
  notifications: many(notifications),
}))
```

### 2. Properties Schema
`src/db/schema/properties.ts`

```typescript
import { pgTable, uuid, varchar, integer, decimal, boolean, timestamp, date, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const propertyTypes = pgTable('property_types', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  description: varchar('description', { length: 500 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
})

export const properties = pgTable('properties', {
  id: uuid('id').defaultRandom().primaryKey(),
  propertyId: varchar('property_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  propertyTypeId: uuid('property_type_id').references(() => propertyTypes.id),
  
  // Address fields
  streetAddress: varchar('street_address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('United States'),
  county: varchar('county', { length: 100 }),
  
  // Property details
  yearBuilt: integer('year_built'),
  market: varchar('market', { length: 100 }),
  areaSqft: integer('area_sqft'),
  bedrooms: decimal('bedrooms', { precision: 3, scale: 1 }),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  
  // Status fields
  isActive: boolean('is_active').notNull().default(true),
  isSection8: boolean('is_section_8').notNull().default(false),
  inDisposition: boolean('in_disposition').notNull().default(false),
  hasInsurance: boolean('has_insurance').notNull().default(false),
  hasSquatters: boolean('has_squatters').notNull().default(false),
  isCore: boolean('is_core').notNull().default(true),
  ownershipStatus: boolean('ownership_status').notNull().default(false),
  
  // Assignments
  propertyManagerId: uuid('property_manager_id').references(() => users.id),
  srPropertyManagerId: uuid('sr_property_manager_id').references(() => users.id),
  
  // Dates
  moveInDate: date('move_in_date'),
  moveOutDate: date('move_out_date'),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  propertyIdIdx: uniqueIndex('properties_property_id_idx').on(table.propertyId),
  isActiveIdx: index('properties_is_active_idx').on(table.isActive),
  isCoreIdx: index('properties_is_core_idx').on(table.isCore),
  propertyManagerIdx: index('properties_manager_idx').on(table.propertyManagerId),
}))

// Relations
export const propertiesRelations = relations(properties, ({ one, many }) => ({
  propertyType: one(propertyTypes, {
    fields: [properties.propertyTypeId],
    references: [propertyTypes.id],
  }),
  propertyManager: one(users, {
    fields: [properties.propertyManagerId],
    references: [users.id],
  }),
  turns: many(turns),
  documents: many(documents),
  auditLogs: many(auditLogs),
}))
```

### 3. Audit Logging Schema (Enterprise Feature)
`src/db/schema/audit.ts`

```typescript
import { pgTable, uuid, varchar, jsonb, timestamp, pgEnum, index, inet, text } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { users } from './users'

export const auditActionEnum = pgEnum('audit_action', ['CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT'])

export const auditLogs = pgTable('audit_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  
  // What was changed
  tableName: varchar('table_name', { length: 100 }).notNull(),
  recordId: uuid('record_id').notNull(),
  action: auditActionEnum('action').notNull(),
  
  // Who made the change
  userId: uuid('user_id').notNull().references(() => users.id),
  userEmail: varchar('user_email', { length: 255 }).notNull(),
  userName: varchar('user_name', { length: 255 }).notNull(),
  userRole: varchar('user_role', { length: 50 }).notNull(),
  
  // Where and how
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  sessionId: uuid('session_id'),
  
  // Change details
  oldValues: jsonb('old_values'),
  newValues: jsonb('new_values'),
  changedFields: text('changed_fields').array(),
  
  // Context metadata
  propertyId: uuid('property_id'),
  turnId: uuid('turn_id'),
  vendorId: uuid('vendor_id'),
  context: varchar('context', { length: 255 }),
  
  // Additional metadata
  metadata: jsonb('metadata'),
  
  // Timestamp
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  tableRecordIdx: index('audit_table_record_idx').on(table.tableName, table.recordId),
  userIdIdx: index('audit_user_id_idx').on(table.userId),
  createdAtIdx: index('audit_created_at_idx').on(table.createdAt),
  propertyIdIdx: index('audit_property_id_idx').on(table.propertyId),
  turnIdIdx: index('audit_turn_id_idx').on(table.turnId),
  actionIdx: index('audit_action_idx').on(table.action),
}))

// Activity Log for high-level user actions
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull().references(() => users.id),
  action: varchar('action', { length: 100 }).notNull(),
  description: text('description'),
  entityType: varchar('entity_type', { length: 50 }),
  entityId: uuid('entity_id'),
  ipAddress: inet('ip_address'),
  userAgent: text('user_agent'),
  metadata: jsonb('metadata'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  userIdIdx: index('activity_user_id_idx').on(table.userId),
  createdAtIdx: index('activity_created_at_idx').on(table.createdAt),
  entityIdx: index('activity_entity_idx').on(table.entityType, table.entityId),
}))

// Relations
export const auditLogsRelations = relations(auditLogs, ({ one }) => ({
  user: one(users, {
    fields: [auditLogs.userId],
    references: [users.id],
  }),
}))
```

### 4. Turns Management Schema
`src/db/schema/turns.ts`

```typescript
import { pgTable, uuid, varchar, decimal, boolean, timestamp, date, integer, pgEnum, index } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { properties } from './properties'
import { users } from './users'

export const turnStages = pgTable('turn_stages', {
  id: uuid('id').defaultRandom().primaryKey(),
  name: varchar('name', { length: 100 }).notNull(),
  displayOrder: integer('display_order').notNull().unique(),
  color: varchar('color', { length: 7 }).default('#000000'),
  
  // Email settings
  sendEmailToUsers: boolean('send_email_to_users').notNull().default(false),
  sendEmailToVendor: boolean('send_email_to_vendor').notNull().default(false),
  
  // Requirements
  isAmountRequired: boolean('is_amount_required').notNull().default(false),
  isVendorRequired: boolean('is_vendor_required').notNull().default(false),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  
  // Status
  isCompleteStage: boolean('is_complete_stage').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  displayOrderIdx: uniqueIndex('stages_display_order_idx').on(table.displayOrder),
}))

export const approvalStatusEnum = pgEnum('approval_status', [
  'DFO_APPROVAL_NEEDED',
  'DFO_APPROVED',
  'HO_APPROVAL_NEEDED',
  'HO_APPROVED',
  'REJECTED'
])

export const utilityStatusEnum = pgEnum('utility_status', ['YES', 'NO'])

export const turns = pgTable('turns', {
  id: uuid('id').defaultRandom().primaryKey(),
  turnId: varchar('turn_id', { length: 50 }).notNull().unique(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  stageId: uuid('stage_id').notNull().references(() => turnStages.id),
  
  // Work order details
  woNumber: varchar('wo_number', { length: 50 }),
  moveOutDate: date('move_out_date'),
  trashOutNeeded: boolean('trash_out_needed').notNull().default(false),
  
  // Financial
  turnAmount: decimal('turn_amount', { precision: 10, scale: 2 }),
  approvedTurnAmount: decimal('approved_turn_amount', { precision: 10, scale: 2 }),
  changeOrderAmount: decimal('change_order_amount', { precision: 10, scale: 2 }),
  
  // Vendors and assignments
  vendorId: uuid('vendor_id').references(() => vendors.id),
  turnsSuperintendentId: uuid('turns_superintendent_id').references(() => users.id),
  flooringVendorId: uuid('flooring_vendor_id').references(() => vendors.id),
  
  // Important dates
  expectedCompletionDate: date('expected_completion_date'),
  occupancyCheckDate: date('occupancy_check_date'),
  scopeApprovedDate: date('scope_approved_date'),
  turnAssignmentDate: date('turn_assignment_date'),
  finalWalkDate: date('final_walk_date'),
  sentToLeasingDate: date('sent_to_leasing_date'),
  scan360Date: date('scan_360_date'),
  turnCompletionDate: date('turn_completion_date'),
  
  // Utilities status
  powerStatus: utilityStatusEnum('power_status'),
  waterStatus: utilityStatusEnum('water_status'),
  gasStatus: utilityStatusEnum('gas_status'),
  
  // Approval workflow
  scopeApprovalStatus: approvalStatusEnum('scope_approval_status'),
  dfoApprovalUserId: uuid('dfo_approval_user_id').references(() => users.id),
  dfoApprovalDatetime: timestamp('dfo_approval_datetime'),
  hoApprovalUserId: uuid('ho_approval_user_id').references(() => users.id),
  hoApprovalDatetime: timestamp('ho_approval_datetime'),
  rejectUserId: uuid('reject_user_id').references(() => users.id),
  rejectDatetime: timestamp('reject_datetime'),
  rejectReason: varchar('reject_reason', { length: 500 }),
  
  // Features
  orderInsideMaps: boolean('order_inside_maps').notNull().default(false),
  generateWoEmail: boolean('generate_wo_email').notNull().default(false),
  appliancesNeeded: boolean('appliances_needed').notNull().default(false),
  appliancesOrdered: boolean('appliances_ordered').notNull().default(false),
  
  // Links
  scopePhotosLink: varchar('scope_photos_link', { length: 500 }),
  
  // Status
  status: varchar('status', { length: 100 }),
  subStatus: varchar('sub_status', { length: 100 }),
  isActive: boolean('is_active').notNull().default(true),
  
  // Metadata
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  createdBy: uuid('created_by').references(() => users.id),
}, (table) => ({
  turnIdIdx: uniqueIndex('turns_turn_id_idx').on(table.turnId),
  propertyIdIdx: index('turns_property_id_idx').on(table.propertyId),
  stageIdIdx: index('turns_stage_id_idx').on(table.stageId),
  vendorIdIdx: index('turns_vendor_id_idx').on(table.vendorId),
  isActiveIdx: index('turns_is_active_idx').on(table.isActive),
  approvalStatusIdx: index('turns_approval_status_idx').on(table.scopeApprovalStatus),
}))

// Turn Stage History for tracking time in each stage
export const turnStageHistory = pgTable('turn_stage_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  turnId: uuid('turn_id').notNull().references(() => turns.id),
  fromStageId: uuid('from_stage_id').references(() => turnStages.id),
  toStageId: uuid('to_stage_id').notNull().references(() => turnStages.id),
  durationMinutes: integer('duration_minutes'),
  changedBy: uuid('changed_by').references(() => users.id),
  changedAt: timestamp('changed_at').defaultNow().notNull(),
  notes: varchar('notes', { length: 500 }),
}, (table) => ({
  turnIdIdx: index('stage_history_turn_id_idx').on(table.turnId),
  changedAtIdx: index('stage_history_changed_at_idx').on(table.changedAt),
}))
```

### 5. Vendors Schema
`src/db/schema/vendors.ts`

```typescript
import { pgTable, uuid, varchar, date, boolean, decimal, integer, timestamp, index } from 'drizzle-orm/pg-core'

export const vendors = pgTable('vendors', {
  id: uuid('id').defaultRandom().primaryKey(),
  companyName: varchar('company_name', { length: 255 }).notNull(),
  contactName: varchar('contact_name', { length: 255 }),
  email: varchar('email', { length: 255 }),
  phone: varchar('phone', { length: 20 }),
  
  // Address
  streetAddress: varchar('street_address', { length: 255 }),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  
  // Business details
  taxId: varchar('tax_id', { length: 50 }),
  licenseNumber: varchar('license_number', { length: 100 }),
  insuranceExpiry: date('insurance_expiry'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  isApproved: boolean('is_approved').notNull().default(false),
  
  // Ratings
  averageRating: decimal('average_rating', { precision: 3, scale: 2 }),
  totalJobs: integer('total_jobs').notNull().default(0),
  
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  isActiveIdx: index('vendors_is_active_idx').on(table.isActive),
  companyNameIdx: index('vendors_company_name_idx').on(table.companyName),
}))
```

## Database Helpers

### Audit Logging Helper
`src/db/helpers/audit.ts`

```typescript
import { db } from '@/db'
import { auditLogs } from '@/db/schema/audit'
import { eq } from 'drizzle-orm'

interface AuditLogEntry {
  tableName: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'VIEW' | 'EXPORT'
  userId: string
  userEmail: string
  userName: string
  userRole: string
  oldValues?: any
  newValues?: any
  changedFields?: string[]
  metadata?: any
  propertyId?: string
  turnId?: string
  context?: string
}

export async function createAuditLog(entry: AuditLogEntry, req?: Request) {
  const ipAddress = req?.headers.get('x-forwarded-for') || req?.headers.get('x-real-ip')
  const userAgent = req?.headers.get('user-agent')
  
  await db.insert(auditLogs).values({
    ...entry,
    ipAddress: ipAddress || undefined,
    userAgent: userAgent || undefined,
    createdAt: new Date(),
  })
}

// Middleware to automatically log changes
export function withAuditLogging<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  tableName: string,
  action: 'CREATE' | 'UPDATE' | 'DELETE'
): T {
  return (async (...args: Parameters<T>) => {
    const [data, user] = args
    const oldValues = action === 'UPDATE' ? await getOldValues(tableName, data.id) : undefined
    
    const result = await fn(...args)
    
    await createAuditLog({
      tableName,
      recordId: result.id || data.id,
      action,
      userId: user.id,
      userEmail: user.email,
      userName: `${user.firstName} ${user.lastName}`,
      userRole: user.role,
      oldValues,
      newValues: action !== 'DELETE' ? result : undefined,
      changedFields: action === 'UPDATE' ? getChangedFields(oldValues, result) : undefined,
      propertyId: result.propertyId || data.propertyId,
      turnId: result.turnId || data.turnId,
    })
    
    return result
  }) as T
}

// Get audit logs for a specific record
export async function getAuditHistory(tableName: string, recordId: string) {
  return await db
    .select()
    .from(auditLogs)
    .where(
      and(
        eq(auditLogs.tableName, tableName),
        eq(auditLogs.recordId, recordId)
      )
    )
    .orderBy(desc(auditLogs.createdAt))
}

// Get audit logs for a property (including all related entities)
export async function getPropertyAuditHistory(propertyId: string) {
  return await db
    .select()
    .from(auditLogs)
    .where(eq(auditLogs.propertyId, propertyId))
    .orderBy(desc(auditLogs.createdAt))
}
```

## Migrations with Drizzle Kit

### Generate Migrations
```bash
# Generate migration files based on schema changes
npx drizzle-kit generate:pg

# Push schema changes directly to database (development)
npx drizzle-kit push:pg

# Drop all tables (dangerous!)
npx drizzle-kit drop

# Check migration status
npx drizzle-kit check:pg

# Create snapshot of current schema
npx drizzle-kit snapshot:pg
```

### Run Migrations
`src/db/migrate.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import { migrate } from 'drizzle-orm/postgres-js/migrator'
import postgres from 'postgres'

const connectionString = process.env.DATABASE_URL!
const sql = postgres(connectionString, { max: 1 })
const db = drizzle(sql)

async function main() {
  console.log('Running migrations...')
  
  await migrate(db, { migrationsFolder: './drizzle' })
  
  console.log('Migrations complete!')
  process.exit(0)
}

main().catch((err) => {
  console.error('Migration failed!')
  console.error(err)
  process.exit(1)
})
```

### Package.json Scripts
```json
{
  "scripts": {
    "db:generate": "drizzle-kit generate:pg",
    "db:push": "drizzle-kit push:pg",
    "db:migrate": "tsx src/db/migrate.ts",
    "db:studio": "drizzle-kit studio",
    "db:check": "drizzle-kit check:pg",
    "db:snapshot": "drizzle-kit snapshot:pg"
  }
}
```

## Database Connection
`src/db/index.ts`

```typescript
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import * as schema from './schema'

const connectionString = process.env.DATABASE_URL!
const client = postgres(connectionString)

export const db = drizzle(client, { schema })
```

## Query Examples

### With Audit Logging
```typescript
import { db } from '@/db'
import { properties } from '@/db/schema/properties'
import { withAuditLogging } from '@/db/helpers/audit'

// Wrap any database operation with audit logging
const createProperty = withAuditLogging(
  async (data: NewProperty, user: User) => {
    const [property] = await db
      .insert(properties)
      .values(data)
      .returning()
    return property
  },
  'properties',
  'CREATE'
)

// Usage
const newProperty = await createProperty(propertyData, currentUser)

// Get audit history for a property
const history = await getPropertyAuditHistory(propertyId)
```

### Complex Queries with Relations
```typescript
// Get property with all related data and recent audit logs
const propertyWithDetails = await db.query.properties.findFirst({
  where: eq(properties.id, propertyId),
  with: {
    propertyManager: true,
    turns: {
      with: {
        stage: true,
        vendor: true,
      },
      orderBy: [desc(turns.createdAt)],
      limit: 5,
    },
    auditLogs: {
      orderBy: [desc(auditLogs.createdAt)],
      limit: 10,
    },
  },
})
```

## Best Practices

1. **Always use transactions for multi-table operations**
```typescript
await db.transaction(async (tx) => {
  const property = await tx.insert(properties).values(data).returning()
  await createAuditLog({ ... }, req)
  return property
})
```

2. **Use prepared statements for repeated queries**
```typescript
const getPropertyById = db
  .select()
  .from(properties)
  .where(eq(properties.id, sql.placeholder('id')))
  .prepare('getPropertyById')

// Usage
const property = await getPropertyById.execute({ id: propertyId })
```

3. **Implement soft deletes for important data**
```typescript
// Instead of DELETE, set isActive = false
await db
  .update(properties)
  .set({ isActive: false })
  .where(eq(properties.id, propertyId))
```

4. **Use database triggers for updated_at timestamps**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_properties_updated_at 
BEFORE UPDATE ON properties
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```