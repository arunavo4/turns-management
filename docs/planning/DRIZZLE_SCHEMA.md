# Turns Management - Local-First Drizzle ORM Database Schema

## Overview
Dual-schema architecture for the Turns Management application using Drizzle ORM with Neon Postgres (server) and PGlite (client). Designed for Electric SQL synchronization with comprehensive audit logging and offline capabilities.

## Architecture

### Server Schema (Neon Postgres)
- Source of truth for all data
- Logical replication enabled for Electric SQL
- Standard Drizzle ORM schemas
- Audit logging for compliance

### Client Schema (PGlite)
- Extends server schema with sync metadata
- Tracks local changes and sync state
- Optimistic updates support
- Conflict resolution tracking

## Setup

### Server Dependencies (Neon)
```bash
pnpm add drizzle-orm postgres @neondatabase/serverless
pnpm add -D drizzle-kit @types/pg
```

### Client Dependencies (PGlite)
```bash
pnpm add @electric-sql/pglite @electric-sql/pglite-sync
pnpm add @electric-sql/client @electric-sql/react
pnpm add drizzle-orm
```

### Electric SQL Service
```bash
# Docker setup
docker run -p 3000:3000 \
  -e DATABASE_URL=$NEON_DATABASE_URL \
  -e ELECTRIC_SECRET=$SECRET \
  electricsql/electric:latest
```

## Configuration

### Server Configuration (Neon)
`drizzle.config.server.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/server/schema/*',
  out: './drizzle/server',
  driver: 'pg',
  dbCredentials: {
    connectionString: process.env.NEON_DATABASE_URL!
  },
  verbose: true,
  strict: true
})
```

### Client Configuration (PGlite)
`drizzle.config.client.ts`:
```typescript
import { defineConfig } from 'drizzle-kit'

export default defineConfig({
  schema: './src/db/client/schema/*',
  out: './drizzle/client',
  driver: 'pglite',
  dbCredentials: {
    url: 'idb://turns-management' // IndexedDB storage
  }
})
```

## Server Schema (Neon Postgres)

### Base Table Interface
All server tables implement this interface for consistency:

```typescript
// src/db/server/base.ts
import { timestamp, integer, uuid } from 'drizzle-orm/pg-core'

export const baseColumns = {
  id: uuid('id').defaultRandom().primaryKey(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  version: integer('version').notNull().default(1), // For optimistic locking
}

export const auditColumns = {
  createdBy: uuid('created_by'),
  updatedBy: uuid('updated_by'),
}
```

### 1. Users & Authentication
`src/db/server/schema/users.ts`:

```typescript
import { pgTable, uuid, varchar, boolean, timestamp, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { baseColumns, auditColumns } from '../base'

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
  ...baseColumns,
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  phone: varchar('phone', { length: 20 }),
  role: userRoleEnum('role').notNull().default('USER'),
  isActive: boolean('is_active').notNull().default(true),
  emailVerified: boolean('email_verified').notNull().default(false),
  lastLogin: timestamp('last_login'),
  ...auditColumns,
}, (table) => ({
  emailIdx: uniqueIndex('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
  isActiveIdx: index('users_is_active_idx').on(table.isActive),
}))

export const sessions = pgTable('sessions', {
  ...baseColumns,
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  token: varchar('token', { length: 255 }).notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
}, (table) => ({
  userIdIdx: index('sessions_user_id_idx').on(table.userId),
  tokenIdx: uniqueIndex('sessions_token_idx').on(table.token),
}))
```

### 2. Properties
`src/db/server/schema/properties.ts`:

```typescript
import { pgTable, uuid, varchar, integer, decimal, boolean, date, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { relations } from 'drizzle-orm'
import { baseColumns, auditColumns } from '../base'
import { users } from './users'

export const properties = pgTable('properties', {
  ...baseColumns,
  propertyId: varchar('property_id', { length: 50 }).notNull().unique(),
  name: varchar('name', { length: 255 }).notNull(),
  
  // Address
  streetAddress: varchar('street_address', { length: 255 }).notNull(),
  city: varchar('city', { length: 100 }),
  state: varchar('state', { length: 50 }),
  zipCode: varchar('zip_code', { length: 20 }),
  country: varchar('country', { length: 100 }).default('United States'),
  
  // Details
  yearBuilt: integer('year_built'),
  areaSqft: integer('area_sqft'),
  bedrooms: decimal('bedrooms', { precision: 3, scale: 1 }),
  bathrooms: decimal('bathrooms', { precision: 3, scale: 1 }),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  isCore: boolean('is_core').notNull().default(true),
  
  // Assignments
  propertyManagerId: uuid('property_manager_id').references(() => users.id),
  srPropertyManagerId: uuid('sr_property_manager_id').references(() => users.id),
  
  ...auditColumns,
}, (table) => ({
  propertyIdIdx: uniqueIndex('properties_property_id_idx').on(table.propertyId),
  isActiveIdx: index('properties_is_active_idx').on(table.isActive),
  managerIdx: index('properties_manager_idx').on(table.propertyManagerId),
}))
```

### 3. Turns
`src/db/server/schema/turns.ts`:

```typescript
import { pgTable, uuid, varchar, decimal, boolean, date, pgEnum, index, uniqueIndex } from 'drizzle-orm/pg-core'
import { baseColumns, auditColumns } from '../base'
import { properties } from './properties'
import { vendors } from './vendors'
import { users } from './users'

export const turnStages = pgTable('turn_stages', {
  ...baseColumns,
  name: varchar('name', { length: 100 }).notNull(),
  displayOrder: integer('display_order').notNull().unique(),
  color: varchar('color', { length: 7 }).default('#000000'),
  
  // Requirements
  isAmountRequired: boolean('is_amount_required').notNull().default(false),
  isVendorRequired: boolean('is_vendor_required').notNull().default(false),
  requiresApproval: boolean('requires_approval').notNull().default(false),
  
  isCompleteStage: boolean('is_complete_stage').notNull().default(false),
  isActive: boolean('is_active').notNull().default(true),
})

export const approvalStatusEnum = pgEnum('approval_status', [
  'PENDING',
  'DFO_APPROVAL_NEEDED',
  'DFO_APPROVED',
  'HO_APPROVAL_NEEDED',
  'HO_APPROVED',
  'REJECTED'
])

export const turns = pgTable('turns', {
  ...baseColumns,
  turnId: varchar('turn_id', { length: 50 }).notNull().unique(),
  propertyId: uuid('property_id').notNull().references(() => properties.id),
  stageId: uuid('stage_id').notNull().references(() => turnStages.id),
  
  // Work order
  woNumber: varchar('wo_number', { length: 50 }),
  moveOutDate: date('move_out_date'),
  
  // Financial
  turnAmount: decimal('turn_amount', { precision: 10, scale: 2 }),
  approvedTurnAmount: decimal('approved_turn_amount', { precision: 10, scale: 2 }),
  
  // Vendors
  vendorId: uuid('vendor_id').references(() => vendors.id),
  
  // Dates
  expectedCompletionDate: date('expected_completion_date'),
  turnCompletionDate: date('turn_completion_date'),
  
  // Approval
  approvalStatus: approvalStatusEnum('approval_status').default('PENDING'),
  
  // Status
  isActive: boolean('is_active').notNull().default(true),
  
  ...auditColumns,
}, (table) => ({
  turnIdIdx: uniqueIndex('turns_turn_id_idx').on(table.turnId),
  propertyIdIdx: index('turns_property_id_idx').on(table.propertyId),
  stageIdIdx: index('turns_stage_id_idx').on(table.stageId),
  isActiveIdx: index('turns_is_active_idx').on(table.isActive),
}))
```

## Client Schema (PGlite)

### Sync Metadata Columns
All client tables extend server tables with sync metadata:

```typescript
// src/db/client/sync.ts
import { boolean, timestamp, text, jsonb } from 'drizzle-orm/pg-core'

export const syncColumns = {
  // Sync state
  _synced: boolean('_synced').notNull().default(true),
  _sentToServer: boolean('_sent_to_server').notNull().default(false),
  _deleted: boolean('_deleted').notNull().default(false),
  _new: boolean('_new').notNull().default(false),
  
  // Change tracking
  _modifiedColumns: text('_modified_columns').array(),
  _localModifiedAt: timestamp('_local_modified_at').defaultNow().notNull(),
  
  // Conflict resolution
  _conflictResolution: text('_conflict_resolution'), // 'local' | 'remote' | 'merged'
  _conflictData: jsonb('_conflict_data'),
  
  // Error tracking
  _syncError: text('_sync_error'),
  _syncRetries: integer('_sync_retries').notNull().default(0),
  _lastSyncAttempt: timestamp('_last_sync_attempt'),
}
```

### Client Table Example
`src/db/client/schema/properties.ts`:

```typescript
import { pgTable } from 'drizzle-orm/pg-core'
import { properties as serverProperties } from '../../server/schema/properties'
import { syncColumns } from '../sync'

// Client properties table extends server schema with sync metadata
export const properties = pgTable('properties', {
  // All server columns
  ...serverProperties,
  
  // Sync metadata
  ...syncColumns,
})

// Trigger for tracking modifications
export const propertyTriggers = sql`
  CREATE OR REPLACE FUNCTION track_property_changes() 
  RETURNS TRIGGER AS $$
  BEGIN
    IF TG_OP = 'UPDATE' THEN
      NEW._synced := false;
      NEW._modified_columns := array_agg(
        DISTINCT col
        FROM jsonb_each_text(to_jsonb(NEW)) AS n(col, val)
        JOIN jsonb_each_text(to_jsonb(OLD)) AS o(col, val) 
          ON n.col = o.col
        WHERE n.val IS DISTINCT FROM o.val
          AND n.col NOT LIKE '\\_%'
      );
      NEW._local_modified_at := NOW();
    ELSIF TG_OP = 'INSERT' THEN
      NEW._new := true;
      NEW._synced := false;
    END IF;
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER property_changes
    BEFORE INSERT OR UPDATE ON properties
    FOR EACH ROW
    WHEN (pg_trigger_depth() = 0)
    EXECUTE FUNCTION track_property_changes();
`
```

## Shape Definitions

### Core Shapes for Sync
`src/sync/shapes.ts`:

```typescript
import { ShapeStream, Shape } from '@electric-sql/client'

export const shapes = {
  // Properties shape - filtered by user access
  properties: (userId: string) => ({
    url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
    params: {
      table: 'properties',
      where: `property_manager_id = $1 OR sr_property_manager_id = $1`,
      params: [userId],
      columns: [
        'id', 'property_id', 'name', 'street_address', 
        'city', 'state', 'is_active', 'is_core',
        'property_manager_id', 'version'
      ]
    }
  }),

  // Active turns shape
  activeTurns: () => ({
    url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
    params: {
      table: 'turns',
      where: 'is_active = true',
      columns: [
        'id', 'turn_id', 'property_id', 'stage_id',
        'vendor_id', 'turn_amount', 'approval_status',
        'version'
      ]
    }
  }),

  // Vendors shape
  vendors: () => ({
    url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
    params: {
      table: 'vendors',
      where: 'is_active = true AND is_approved = true'
    }
  }),

  // Turn stages (reference data)
  turnStages: () => ({
    url: `${process.env.NEXT_PUBLIC_ELECTRIC_URL}/v1/shape`,
    params: {
      table: 'turn_stages',
      where: 'is_active = true'
    }
  })
}
```

## Sync Management

### PGlite Initialization
`src/db/client/init.ts`:

```typescript
import { PGlite } from '@electric-sql/pglite'
import { electricSync } from '@electric-sql/pglite-sync'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from './schema'

export async function initializeDatabase() {
  // Create PGlite instance with Electric sync
  const pg = await PGlite.create({
    dataDir: 'idb://turns-management',
    extensions: {
      electric: electricSync()
    }
  })

  // Run client migrations
  await runMigrations(pg)

  // Create Drizzle client
  const db = drizzle(pg, { schema })

  return { pg, db }
}
```

### Shape Subscription Manager
`src/sync/manager.ts`:

```typescript
import { Shape, ShapeStream } from '@electric-sql/client'
import { shapes } from './shapes'

export class SyncManager {
  private shapes: Map<string, Shape> = new Map()
  private pg: PGlite

  constructor(pg: PGlite) {
    this.pg = pg
  }

  async subscribeToShape(name: string, config: any) {
    // Create shape stream
    const stream = new ShapeStream(config)
    
    // Sync to local table
    const shape = await this.pg.electric.syncShapeToTable({
      shape: { url: config.url, params: config.params },
      table: config.params.table,
      primaryKey: ['id'],
      shapeKey: name,
      commitGranularity: 'up-to-date',
      useCopy: true // Use COPY for initial sync
    })

    this.shapes.set(name, shape)
    return shape
  }

  async initializeUserShapes(userId: string) {
    // Subscribe to all user-relevant shapes
    await Promise.all([
      this.subscribeToShape('properties', shapes.properties(userId)),
      this.subscribeToShape('activeTurns', shapes.activeTurns()),
      this.subscribeToShape('vendors', shapes.vendors()),
      this.subscribeToShape('turnStages', shapes.turnStages()),
    ])
  }

  async updateShapeFilter(name: string, newConfig: any) {
    // Unsubscribe from old shape
    const oldShape = this.shapes.get(name)
    if (oldShape) {
      await oldShape.unsubscribe()
    }

    // Subscribe with new filter
    return this.subscribeToShape(name, newConfig)
  }
}
```

## Write Path Implementation

### Optimistic Updates
`src/sync/writes.ts`:

```typescript
import { db } from '@/db/client'
import { properties } from '@/db/client/schema'

export async function updateProperty(id: string, updates: any) {
  // 1. Optimistic local update
  await db.update(properties)
    .set({
      ...updates,
      _synced: false,
      _sentToServer: false,
      _localModifiedAt: new Date(),
      version: sql`version + 1`
    })
    .where(eq(properties.id, id))

  // 2. Queue for server sync
  await queueWrite({
    table: 'properties',
    operation: 'update',
    id,
    data: updates
  })
}

// Background sync process
export async function syncWrites() {
  // Get all unsynced changes
  const unsynced = await db.select()
    .from(properties)
    .where(eq(properties._synced, false))

  for (const record of unsynced) {
    try {
      // Send to server
      const response = await fetch('/api/write/properties', {
        method: 'POST',
        body: JSON.stringify(record)
      })

      if (response.ok) {
        // Mark as synced
        await db.update(properties)
          .set({
            _synced: true,
            _sentToServer: true,
            _syncError: null
          })
          .where(eq(properties.id, record.id))
      }
    } catch (error) {
      // Track sync error
      await db.update(properties)
        .set({
          _syncError: error.message,
          _syncRetries: sql`_sync_retries + 1`,
          _lastSyncAttempt: new Date()
        })
        .where(eq(properties.id, record.id))
    }
  }
}
```

## Conflict Resolution

### Strategy Implementation
`src/sync/conflicts.ts`:

```typescript
export async function resolveConflict(
  local: any,
  remote: any,
  strategy: 'local' | 'remote' | 'merge' | 'user'
) {
  switch (strategy) {
    case 'local':
      // Keep local changes
      return local

    case 'remote':
      // Accept remote changes
      return remote

    case 'merge':
      // Merge based on field-level timestamps
      const merged = { ...remote }
      for (const field of local._modifiedColumns || []) {
        if (local[field + '_modified_at'] > remote.updatedAt) {
          merged[field] = local[field]
        }
      }
      return merged

    case 'user':
      // Show conflict UI for user resolution
      return await showConflictDialog(local, remote)
  }
}
```

## Migrations

### Server Migrations (Neon)
`drizzle/server/migrations/0001_init.sql`:

```sql
-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create enums
CREATE TYPE user_role AS ENUM (
  'SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER',
  'SR_PROPERTY_MANAGER', 'VENDOR', 'INSPECTOR',
  'DFO_APPROVER', 'HO_APPROVER', 'USER'
);

-- Create tables with version column for optimistic locking
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  -- ... other columns ...
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMP DEFAULT NOW() NOT NULL
);

-- Add update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();
```

### Client Migrations (PGlite)
`drizzle/client/migrations/0001_init.sql`:

```sql
-- Include all server tables plus sync metadata
CREATE TABLE properties (
  -- Server columns
  id UUID PRIMARY KEY,
  property_id VARCHAR(50) UNIQUE NOT NULL,
  -- ... other server columns ...
  
  -- Sync metadata
  _synced BOOLEAN NOT NULL DEFAULT true,
  _sent_to_server BOOLEAN NOT NULL DEFAULT false,
  _deleted BOOLEAN NOT NULL DEFAULT false,
  _new BOOLEAN NOT NULL DEFAULT false,
  _modified_columns TEXT[],
  _local_modified_at TIMESTAMP DEFAULT NOW() NOT NULL,
  _conflict_resolution TEXT,
  _conflict_data JSONB,
  _sync_error TEXT,
  _sync_retries INTEGER NOT NULL DEFAULT 0,
  _last_sync_attempt TIMESTAMP
);

-- Create indexes for sync queries
CREATE INDEX idx_properties_synced ON properties(_synced);
CREATE INDEX idx_properties_sent ON properties(_sent_to_server);
```

## Performance Optimizations

### Indexes for Common Queries
```sql
-- Server indexes (Neon)
CREATE INDEX idx_turns_active ON turns(is_active, stage_id);
CREATE INDEX idx_properties_manager ON properties(property_manager_id, is_active);

-- Client indexes (PGlite)
CREATE INDEX idx_local_unsynced ON properties(_synced) WHERE _synced = false;
CREATE INDEX idx_local_errors ON properties(_sync_error) WHERE _sync_error IS NOT NULL;
```

### Shape Size Management
```typescript
// Limit shape size with pagination
const largeShape = {
  table: 'audit_logs',
  where: 'created_at > $1',
  params: [thirtyDaysAgo],
  limit: 1000,
  orderBy: 'created_at DESC'
}
```

## Testing

### Sync Testing
```typescript
describe('Sync Manager', () => {
  it('should handle offline writes', async () => {
    // Disconnect from network
    await syncManager.goOffline()
    
    // Make local changes
    await updateProperty('123', { name: 'Updated' })
    
    // Verify local state
    const local = await db.select().from(properties).where(eq(properties.id, '123'))
    expect(local[0]._synced).toBe(false)
    
    // Reconnect and sync
    await syncManager.goOnline()
    await syncManager.syncPendingWrites()
    
    // Verify synced
    const synced = await db.select().from(properties).where(eq(properties.id, '123'))
    expect(synced[0]._synced).toBe(true)
  })
})
```

## Best Practices

### 1. Shape Design
- Keep shapes focused and minimal
- Use WHERE clauses to filter data
- Include only necessary columns
- Consider shape size for performance

### 2. Sync Patterns
- Always write locally first
- Queue server writes for retry
- Handle conflicts gracefully
- Show sync status to users

### 3. Error Handling
- Retry failed syncs with backoff
- Log sync errors for debugging
- Provide offline fallbacks
- Alert users to sync issues

### 4. Performance
- Use indexes on sync columns
- Batch write operations
- Debounce rapid changes
- Monitor shape sizes

## Monitoring

### Sync Metrics
```typescript
// Track sync performance
interface SyncMetrics {
  shapeName: string
  recordCount: number
  syncDuration: number
  conflictCount: number
  errorCount: number
  retryCount: number
}

// Log to analytics
await analytics.track('sync_complete', metrics)
```