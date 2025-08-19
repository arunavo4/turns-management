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

Electric SQL supports multiple write patterns. Our Drizzle + PGlite setup is perfectly suited for patterns 2-4, with pattern 3 (Shared Persistent Optimistic State) being the sweet spot for most use cases.

### Pattern 1: Online Writes (Simple)
Direct Drizzle operations against the server API:

```typescript
// src/sync/online-writes.ts
import { db as serverDb } from '@/db/server'
import { properties as serverProperties } from '@/db/server/schema'

export async function updatePropertyOnline(id: string, updates: any) {
  // Direct server operation - requires network
  try {
    const result = await serverDb.update(serverProperties)
      .set({
        ...updates,
        updatedAt: new Date(),
        version: sql`version + 1`
      })
      .where(eq(serverProperties.id, id))
      .returning()

    // Electric will sync this change to all clients automatically
    return result[0]
  } catch (error) {
    throw new Error(`Failed to update property: ${error.message}`)
  }
}
```

### Pattern 2: Simple Optimistic Updates (React useOptimistic)
Uses React's built-in optimistic state with Drizzle queries:

```typescript
// src/hooks/use-optimistic-properties.ts
import { useOptimistic } from 'react'
import { useShape } from '@electric-sql/react'

export function useOptimisticProperties() {
  // Get synced data from Electric
  const { data: syncedProperties } = useShape({
    url: '/api/electric/v1/shape',
    params: { table: 'properties' }
  })

  // Add optimistic state layer
  const [optimisticProperties, addOptimisticUpdate] = useOptimistic(
    syncedProperties || [],
    (state, update: PropertyUpdate) => {
      return state.map(property => 
        property.id === update.id 
          ? { ...property, ...update.data, _optimistic: true }
          : property
      )
    }
  )

  const updateProperty = async (id: string, data: any) => {
    // 1. Optimistic update (instant UI)
    addOptimisticUpdate({ id, data })

    // 2. Send to server (background)
    try {
      await fetch(`/api/write/properties/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      // Success! Electric sync will replace optimistic data
    } catch (error) {
      // Optimistic state automatically reverts on error
      toast.error('Failed to update property')
    }
  }

  return { properties: optimisticProperties, updateProperty }
}
```

### Pattern 3: Shared Persistent Optimistic State (Recommended)
Uses Zustand (already in our stack) with PGlite for persistent, shared optimistic state:

```typescript
// src/stores/write-store.ts  
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/db/client'
import { properties } from '@/db/client/schema'

interface PendingWrite {
  id: string
  table: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
  retries: number
}

interface WriteStore {
  pendingWrites: PendingWrite[]
  rejectedWrites: PendingWrite[]
  isOnline: boolean
  
  // Actions
  addPendingWrite: (write: Omit<PendingWrite, 'timestamp' | 'retries'>) => void
  removePendingWrite: (id: string) => void
  markAsRejected: (id: string, error: string) => void
  syncPendingWrites: () => Promise<void>
}

export const useWriteStore = create<WriteStore>()(
  persist(
    (set, get) => ({
      pendingWrites: [],
      rejectedWrites: [],
      isOnline: navigator.onLine,

      addPendingWrite: (write) => {
        const pendingWrite: PendingWrite = {
          ...write,
          timestamp: Date.now(),
          retries: 0
        }
        
        set(state => ({
          pendingWrites: [...state.pendingWrites, pendingWrite]
        }))

        // Trigger background sync
        get().syncPendingWrites()
      },

      removePendingWrite: (id) => {
        set(state => ({
          pendingWrites: state.pendingWrites.filter(w => w.id !== id)
        }))
      },

      markAsRejected: (id, error) => {
        set(state => {
          const write = state.pendingWrites.find(w => w.id === id)
          if (!write) return state

          return {
            pendingWrites: state.pendingWrites.filter(w => w.id !== id),
            rejectedWrites: [...state.rejectedWrites, { ...write, error }]
          }
        })
      },

      syncPendingWrites: async () => {
        const { pendingWrites, isOnline } = get()
        if (!isOnline || pendingWrites.length === 0) return

        for (const write of pendingWrites) {
          try {
            const response = await fetch(`/api/write/${write.table}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                operation: write.operation,
                data: write.data
              })
            })

            if (response.ok) {
              // Success - remove from pending
              get().removePendingWrite(write.id)
            } else {
              throw new Error(`Server responded with ${response.status}`)
            }
          } catch (error) {
            // Mark as rejected after 3 retries
            if (write.retries >= 3) {
              get().markAsRejected(write.id, error.message)
            } else {
              // Increment retry count
              set(state => ({
                pendingWrites: state.pendingWrites.map(w => 
                  w.id === write.id ? { ...w, retries: w.retries + 1 } : w
                )
              }))
            }
          }
        }
      }
    }),
    {
      name: 'write-store',
      partialize: (state) => ({ 
        pendingWrites: state.pendingWrites,
        rejectedWrites: state.rejectedWrites 
      })
    }
  )
)

// Optimistic write operations with Drizzle
export const optimisticWrites = {
  async updateProperty(id: string, updates: any) {
    const writeId = `property-${id}-${Date.now()}`
    
    // 1. Update PGlite immediately (optimistic)
    await db.update(properties)
      .set({
        ...updates,
        _synced: false,
        _sentToServer: false,
        _localModifiedAt: new Date()
      })
      .where(eq(properties.id, id))

    // 2. Add to pending writes queue
    useWriteStore.getState().addPendingWrite({
      id: writeId,
      table: 'properties',
      operation: 'update',
      data: { id, ...updates }
    })
  },

  async createProperty(data: any) {
    const id = crypto.randomUUID()
    const writeId = `property-${id}-${Date.now()}`

    // 1. Insert into PGlite immediately
    await db.insert(properties)
      .values({
        ...data,
        id,
        _synced: false,
        _sentToServer: false,
        _new: true
      })

    // 2. Queue for server sync
    useWriteStore.getState().addPendingWrite({
      id: writeId,
      table: 'properties',
      operation: 'create',
      data: { ...data, id }
    })

    return id
  },

  async deleteProperty(id: string) {
    const writeId = `property-${id}-${Date.now()}`

    // 1. Mark as deleted locally
    await db.update(properties)
      .set({
        _deleted: true,
        _synced: false,
        _sentToServer: false
      })
      .where(eq(properties.id, id))

    // 2. Queue for server sync
    useWriteStore.getState().addPendingWrite({
      id: writeId,
      table: 'properties',
      operation: 'delete',
      data: { id }
    })
  }
}
```

### Pattern 4: Through-the-Database Sync (Advanced)
Uses PGlite shadow tables with Drizzle schema for automatic optimistic state:

```typescript
// src/db/client/shadow-schema.ts
import { pgTable, uuid, varchar, text, boolean, timestamp, json } from 'drizzle-orm/pg-core'

// Synced data tables (immutable from Electric)
export const propertiesSynced = pgTable('properties_synced', {
  id: uuid('id').primaryKey(),
  propertyId: varchar('property_id', { length: 50 }).unique().notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  streetAddress: varchar('street_address', { length: 255 }).notNull(),
  // ... other server columns
  syncedAt: timestamp('_synced_at').defaultNow().notNull()
})

// Local optimistic writes
export const propertiesLocal = pgTable('properties_local', {
  id: uuid('id').primaryKey(),
  propertyId: varchar('property_id', { length: 50 }),
  name: varchar('name', { length: 255 }),
  streetAddress: varchar('street_address', { length: 255 }),
  // ... other columns
  operation: varchar('_operation', { length: 10 }).default('update'), // 'insert', 'update', 'delete'
  createdAt: timestamp('_created_at').defaultNow().notNull()
})

// Change log for background sync
export const changes = pgTable('changes', {
  id: integer('id').primaryKey(),
  tableName: varchar('table_name', { length: 255 }).notNull(),
  recordId: uuid('record_id').notNull(),
  operation: varchar('operation', { length: 10 }).notNull(),
  data: json('data').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  synced: boolean('synced').default(false).notNull()
})

// Combined view (what the application uses)
export const properties = pgView('properties', {
  id: uuid('id'),
  propertyId: varchar('property_id', { length: 50 }),
  name: varchar('name', { length: 255 }),
  streetAddress: varchar('street_address', { length: 255 }),
  // ... other columns
  isLocal: boolean('_is_local').notNull()
}).as(sql`
  SELECT 
    COALESCE(l.id, s.id) as id,
    COALESCE(l.property_id, s.property_id) as property_id,
    COALESCE(l.name, s.name) as name,
    COALESCE(l.street_address, s.street_address) as street_address,
    CASE WHEN l.id IS NOT NULL THEN TRUE ELSE FALSE END as _is_local
  FROM properties_synced s
  FULL OUTER JOIN properties_local l ON s.id = l.id
  WHERE l._operation != 'delete' OR l.id IS NULL
`)

// INSTEAD OF triggers (using raw SQL in migration)
export const shadowTableTriggers = sql`
  CREATE OR REPLACE FUNCTION handle_property_write()
  RETURNS TRIGGER AS $$
  BEGIN
    -- Insert/update local table
    INSERT INTO properties_local (id, property_id, name, street_address, _operation)
    VALUES (NEW.id, NEW.property_id, NEW.name, NEW.street_address, 
            CASE WHEN OLD.id IS NULL THEN 'insert' ELSE 'update' END)
    ON CONFLICT (id) DO UPDATE SET
      property_id = NEW.property_id,
      name = NEW.name,
      street_address = NEW.street_address,
      _operation = 'update';
    
    -- Log the change
    INSERT INTO changes (table_name, record_id, operation, data)
    VALUES ('properties', NEW.id, 
            CASE WHEN OLD.id IS NULL THEN 'insert' ELSE 'update' END,
            json_build_object(
              'id', NEW.id,
              'property_id', NEW.property_id,
              'name', NEW.name,
              'street_address', NEW.street_address
            ));
    
    RETURN NEW;
  END;
  $$ LANGUAGE plpgsql;

  CREATE TRIGGER properties_write_trigger
    INSTEAD OF INSERT OR UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION handle_property_write();
`

// Background sync utility
export class DrizzleChangeSync {
  constructor(private db: PGliteDatabase) {}

  async syncPendingChanges() {
    const pendingChanges = await this.db
      .select()
      .from(changes)
      .where(eq(changes.synced, false))
      .orderBy(changes.createdAt)

    for (const change of pendingChanges) {
      try {
        await this.sendToServer(change)
        
        // Mark as synced
        await this.db
          .update(changes)
          .set({ synced: true })
          .where(eq(changes.id, change.id))
      } catch (error) {
        console.error('Sync failed for change:', change.id, error)
        // Could implement sophisticated rollback here
      }
    }
  }

  private async sendToServer(change: any) {
    return await fetch(`/api/write/${change.tableName}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        operation: change.operation,
        data: change.data
      })
    })
  }

  // Clean up local writes when Electric syncs real data
  async cleanupSyncedWrite(table: string, recordId: string) {
    const localTable = `${table}_local`
    await this.db.execute(
      sql`DELETE FROM ${sql.identifier(localTable)} WHERE id = ${recordId}`
    )
  }
}
```

### Integration with React Components

```typescript
// src/components/property-list.tsx
import { useLiveQuery } from 'drizzle-orm/pglite'
import { properties } from '@/db/client/schema'
import { optimisticWrites } from '@/stores/write-store'

export function PropertyList() {
  // Use Drizzle's live query with PGlite
  const { data: propertyList, error } = useLiveQuery(
    db.select().from(properties).where(eq(properties.isActive, true))
  )

  const handleUpdateProperty = async (id: string, updates: any) => {
    // Uses our optimistic write pattern
    await optimisticWrites.updateProperty(id, updates)
    // UI updates instantly, sync happens in background
  }

  if (error) {
    return <div>Error loading properties: {error.message}</div>
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {propertyList?.map((property) => (
        <PropertyCard 
          key={property.id}
          property={property}
          onUpdate={handleUpdateProperty}
          isPending={!property._synced} // Show pending state
        />
      ))}
    </div>
  )
}
```

## Write Pattern Recommendations for Our Stack

### Recommended: Pattern 3 (Shared Persistent)
**Best fit for Turns Management application:**
- ✅ Works great with existing Zustand + Drizzle + PGlite
- ✅ Persistent across sessions (critical for mobile users)
- ✅ Shared state across all components
- ✅ Moderate complexity, high benefit
- ✅ Sophisticated conflict resolution
- ✅ Works with Better Auth for user context

### Alternative: Pattern 4 (Through-DB) for Advanced Users
**Consider for power users or complex workflows:**
- ✅ Pure local-first experience
- ✅ Automatic state management via triggers
- ⚠️ More complex schema and debugging
- ⚠️ Rollback handling complexity

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