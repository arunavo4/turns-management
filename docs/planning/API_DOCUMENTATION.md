# Turns Management - Local-First API Documentation

## Overview

Minimal API surface for the Turns Management application, focusing on write operations and sync proxies. Most data operations happen locally via Electric SQL sync, dramatically reducing API calls and improving performance.

## Architecture Principles

### Local-First API Design
- **Reads**: Via Electric SQL shapes (no API calls)
- **Writes**: Multiple patterns available (see [Write Patterns](#electric-sql-write-patterns))
- **Sync**: Electric handles real-time propagation
- **API**: Only for authentication, complex business logic, and external integrations

## Electric SQL Write Patterns

Electric SQL provides read-path sync (data flows from Postgres to clients), but write-path sync is implemented using various patterns depending on your application needs. Here are the four main patterns, ordered from simplest to most sophisticated:

### Pattern 1: Online Writes 🌐
**Use Case**: Read-heavy apps, occasional writes, network required
**Complexity**: ⭐ Simple

Direct API calls for writes. No offline capability but very simple to implement.

```typescript
// Simple online writes pattern
async function updateProperty(id: string, data: PropertyUpdate) {
  // Direct API call - requires network
  const response = await fetch(`/api/write/properties/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  
  if (!response.ok) {
    throw new Error('Failed to update property')
  }
  
  // Electric will sync the update to all clients automatically
  return await response.json()
}

// Usage in component
function PropertyEditor() {
  const [loading, setLoading] = useState(false)
  
  const handleSave = async (data) => {
    setLoading(true)
    try {
      await updateProperty(property.id, data)
      // Success! Electric sync will update UI automatically
    } catch (error) {
      // Handle error - show user feedback
    } finally {
      setLoading(false)
    }
  }
}
```

**Benefits:**
- Very simple to implement with existing REST APIs
- Good for dashboards, analytics, data visualization
- Works well when writes require online integration anyway

**Drawbacks:**
- Network latency on writes (loading spinners)
- No offline write capability
- UI doesn't update until server responds

### Pattern 2: Optimistic State ⚡
**Use Case**: Interactive apps, better UX, component-scoped optimism
**Complexity**: ⭐⭐ Moderate

Uses React's `useOptimistic` hook for immediate UI updates while writes process in background.

```typescript
// Optimistic state pattern with useOptimistic
import { useOptimistic } from 'react'

function PropertyList() {
  const { data: properties } = useShape({
    url: '/api/electric/v1/shape',
    params: { table: 'properties' }
  })
  
  // Optimistic state for immediate UI updates
  const [optimisticProperties, addOptimisticProperty] = useOptimistic(
    properties || [],
    (state, newProperty) => [...state, newProperty]
  )
  
  async function createProperty(formData) {
    // 1. Add optimistically to local state (instant UI update)
    addOptimisticProperty({
      ...formData,
      id: `temp-${Date.now()}`,
      _optimistic: true
    })
    
    // 2. Send to server (background)
    try {
      await fetch('/api/write/properties', {
        method: 'POST',
        body: JSON.stringify(formData)
      })
      // Success! Electric sync will replace optimistic data with real data
    } catch (error) {
      // Handle error - optimistic state will be automatically discarded
      toast.error('Failed to create property')
    }
  }
  
  return (
    <div>
      {optimisticProperties.map((property) => (
        <PropertyCard 
          key={property.id} 
          property={property}
          isPending={property._optimistic}
        />
      ))}
    </div>
  )
}
```

**Benefits:**
- Instant UI updates (no loading states)
- Works offline temporarily
- Simple to implement with React's built-in hook

**Drawbacks:**
- Optimistic state is component-scoped only
- Not persisted (lost on page reload)
- Other components may show inconsistent data

### Pattern 3: Shared Persistent Optimistic State 💾
**Use Case**: Complex apps, shared state, persistence across sessions
**Complexity**: ⭐⭐⭐ Advanced

Stores optimistic state in a shared, persistent store (like Valtio + localStorage) that all components can access.

```typescript
// Shared persistent optimistic state with Valtio
import { proxy, useSnapshot } from 'valtio'

// Shared store for optimistic writes
const writeStore = proxy({
  pendingWrites: [] as PendingWrite[],
  rejectedWrites: [] as RejectedWrite[]
})

// Persist to localStorage
const savedWrites = localStorage.getItem('pending-writes')
if (savedWrites) {
  writeStore.pendingWrites = JSON.parse(savedWrites)
}

// Sync to localStorage on changes
subscribe(writeStore, () => {
  localStorage.setItem('pending-writes', JSON.stringify(writeStore.pendingWrites))
})

interface PendingWrite {
  id: string
  table: string
  operation: 'create' | 'update' | 'delete'
  data: any
  timestamp: number
}

// Write utilities
export const writeAPI = {
  async optimisticUpdate(table: string, data: any) {
    const writeId = `${table}-${Date.now()}-${Math.random()}`
    
    // 1. Add to pending writes (persisted, shared)
    writeStore.pendingWrites.push({
      id: writeId,
      table,
      operation: 'update',
      data,
      timestamp: Date.now()
    })
    
    // 2. Send to server in background
    try {
      const response = await fetch(`/api/write/${table}`, {
        method: 'POST',
        body: JSON.stringify({ ...data, writeId })
      })
      
      if (response.ok) {
        // Remove from pending writes (success)
        writeStore.pendingWrites = writeStore.pendingWrites.filter(w => w.id !== writeId)
      } else {
        throw new Error('Server rejected write')
      }
    } catch (error) {
      // Move to rejected writes for user review
      const pendingWrite = writeStore.pendingWrites.find(w => w.id === writeId)
      if (pendingWrite) {
        writeStore.rejectedWrites.push({
          ...pendingWrite,
          error: error.message
        })
        writeStore.pendingWrites = writeStore.pendingWrites.filter(w => w.id !== writeId)
      }
    }
  },
  
  // Merge synced data with optimistic state
  mergeWithPending(syncedData: any[], table: string) {
    const snapshot = useSnapshot(writeStore)
    const pendingForTable = snapshot.pendingWrites.filter(w => w.table === table)
    
    // Apply pending writes over synced data
    return pendingForTable.reduce((data, write) => {
      return applyWrite(data, write)
    }, syncedData)
  }
}

// Usage in components
function PropertyList() {
  const { data: syncedProperties } = useShape({
    url: '/api/electric/v1/shape',
    params: { table: 'properties' }
  })
  
  // Merge synced data with optimistic writes
  const properties = writeAPI.mergeWithPending(syncedProperties || [], 'properties')
  const writeSnapshot = useSnapshot(writeStore)
  
  return (
    <div>
      {properties.map((property) => (
        <PropertyCard key={property.id} property={property} />
      ))}
      
      {/* Show pending writes status */}
      {writeSnapshot.pendingWrites.length > 0 && (
        <SyncStatus pending={writeSnapshot.pendingWrites.length} />
      )}
      
      {/* Show rejected writes */}
      {writeSnapshot.rejectedWrites.length > 0 && (
        <ConflictResolver rejectedWrites={writeSnapshot.rejectedWrites} />
      )}
    </div>
  )
}
```

**Benefits:**
- Persistent across page reloads and sessions
- Shared state across all components
- Sophisticated rollback and conflict resolution
- Separates immutable synced state from mutable optimistic state

**Drawbacks:**
- More complexity in merge logic
- Still uses API for writes (not pure local-first)
- Requires state management library

### Pattern 4: Through-the-Database Sync 🗄️
**Use Case**: Pure local-first apps, offline-first, automatic sync
**Complexity**: ⭐⭐⭐⭐ Expert

Uses embedded database (PGlite) with shadow tables and triggers for automatic optimistic state management and background sync.

```typescript
// Through-the-database sync with PGlite
import { PGlite } from '@electric-sql/pglite'

// Local schema with shadow tables and triggers
const localSchema = `
-- Synced data (immutable from Electric)
CREATE TABLE properties_synced (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  address TEXT,
  -- ... other columns
  _synced_at TIMESTAMP DEFAULT NOW()
);

-- Local optimistic writes
CREATE TABLE properties_local (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  address TEXT,
  -- ... other columns
  _operation VARCHAR(10) DEFAULT 'update', -- 'insert', 'update', 'delete'
  _created_at TIMESTAMP DEFAULT NOW()
);

-- Change log for sync
CREATE TABLE changes (
  id SERIAL PRIMARY KEY,
  table_name VARCHAR(255),
  record_id UUID,
  operation VARCHAR(10),
  data JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  synced BOOLEAN DEFAULT FALSE
);

-- Combined view for application queries
CREATE VIEW properties AS
SELECT 
  COALESCE(l.id, s.id) as id,
  COALESCE(l.name, s.name) as name,
  COALESCE(l.address, s.address) as address,
  -- ... other columns
  CASE WHEN l.id IS NOT NULL THEN TRUE ELSE FALSE END as _is_local
FROM properties_synced s
FULL OUTER JOIN properties_local l ON s.id = l.id
WHERE l._operation != 'delete' OR l.id IS NULL;

-- INSTEAD OF trigger for writes
CREATE OR REPLACE FUNCTION handle_property_write()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into local table
  INSERT INTO properties_local (id, name, address, _operation)
  VALUES (NEW.id, NEW.name, NEW.address, 'update')
  ON CONFLICT (id) DO UPDATE SET
    name = NEW.name,
    address = NEW.address,
    _operation = 'update';
  
  -- Log the change
  INSERT INTO changes (table_name, record_id, operation, data)
  VALUES ('properties', NEW.id, 'update', to_jsonb(NEW));
  
  -- Notify sync process
  PERFORM pg_notify('sync_changes', json_build_object(
    'table', 'properties',
    'id', NEW.id,
    'operation', 'update'
  )::text);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER properties_write_trigger
  INSTEAD OF INSERT OR UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION handle_property_write();
`;

// Background sync process
class ChangeLogSynchronizer {
  constructor(private db: PGlite) {}
  
  async syncPendingChanges() {
    const changes = await this.db.sql`
      SELECT * FROM changes WHERE synced = false ORDER BY created_at
    `
    
    for (const change of changes.rows) {
      try {
        // Send to server
        await fetch(`/api/write/${change.table_name}`, {
          method: 'POST',
          body: JSON.stringify({
            id: change.record_id,
            operation: change.operation,
            data: change.data
          })
        })
        
        // Mark as synced
        await this.db.sql`
          UPDATE changes SET synced = true WHERE id = ${change.id}
        `
      } catch (error) {
        // Handle rollback - could be sophisticated or simple
        console.error('Sync failed for change:', change.id, error)
        
        // Simple strategy: clear all local state
        // await this.rollbackAllChanges()
      }
    }
  }
  
  // Clean up synced local writes when real data arrives
  async cleanupSyncedWrites(table: string, recordId: string) {
    await this.db.sql`
      DELETE FROM ${table}_local WHERE id = ${recordId}
    `
  }
}

// Application code stays simple
function PropertyList() {
  const { data: properties } = useLiveQuery('SELECT * FROM properties')
  
  // Direct database operations
  const createProperty = async (data: PropertyData) => {
    // Just insert - triggers handle everything else
    await db.sql`
      INSERT INTO properties (id, name, address) 
      VALUES (${data.id}, ${data.name}, ${data.address})
    `
    // Sync happens automatically in background
  }
  
  return (
    <div>
      {properties?.map((property) => (
        <PropertyCard 
          key={property.id} 
          property={property}
          isPending={property._is_local}
        />
      ))}
    </div>
  )
}
```

**Benefits:**
- Pure local-first experience
- Automatic optimistic state management
- Full offline capability with persistent queue
- Application code stays simple

**Drawbacks:**
- Heavy dependency (embedded database)
- Complex schema with shadow tables and triggers
- Rollback handling loses write context
- More difficult to debug sync issues

## Write Pattern Decision Matrix

Choose your write pattern based on your application requirements:

| Pattern | Offline Writes | Instant UI | Persistence | Complexity | Best For |
|---------|----------------|------------|-------------|------------|----------|
| **Online** | ❌ | ❌ | N/A | ⭐ | Dashboards, Analytics |
| **Optimistic** | ⏱️ Temporary | ✅ | ❌ | ⭐⭐ | Interactive Apps |
| **Shared Persistent** | ✅ | ✅ | ✅ | ⭐⭐⭐ | SaaS, Collaboration |
| **Through-DB** | ✅ | ✅ | ✅ | ⭐⭐⭐⭐ | Local-First Apps |

## Advanced Considerations

### Merge Logic
When Electric syncs data from the server, your app needs to handle overlapping optimistic state:

```typescript
// Rebasing local changes over server updates
function rebaseLocalChanges(serverData: Property[], localWrites: PendingWrite[]) {
  return localWrites.reduce((data, write) => {
    const existing = data.find(item => item.id === write.data.id)
    
    if (existing && existing.version > write.timestamp) {
      // Server version is newer - preserve server data, discard local
      return data
    }
    
    // Apply local write over server data
    return data.map(item => 
      item.id === write.data.id 
        ? { ...item, ...write.data, _hasLocalChanges: true }
        : item
    )
  }, serverData)
}
```

### Conflict Resolution Strategies

1. **Last Write Wins** (Simple)
   ```typescript
   if (serverVersion > localVersion) {
     return serverData  // Discard local changes
   }
   ```

2. **Field-Level Merge** (Sophisticated)
   ```typescript
   const merged = { ...serverData }
   localChanges.fields.forEach(field => {
     if (localChanges.timestamps[field] > serverData.updatedAt) {
       merged[field] = localChanges.data[field]
     }
   })
   ```

3. **User Resolution** (Interactive)
   ```typescript
   if (hasConflict(local, server)) {
     return await showConflictDialog(local, server)
   }
   ```

### YAGNI Principle

Adam Wiggins (Muse creator) found that **conflicts are extremely rare** in practice and can be mitigated with presence indicators and smart UX. Simple strategies often work better than complex conflict resolution systems.

## Recommended Tools

### Libraries
- **React**: `useOptimistic` hook for pattern 2
- **Valtio**: Reactive state management for pattern 3  
- **TanStack Query**: Mutation management and optimistic updates
- **PGlite**: Embedded database for pattern 4

### Frameworks  
- **LiveStore**: Full local-first framework
- **TinyBase**: Reactive data store with sync
- **tRPC**: Type-safe API with optimistic updates

Choose the pattern that matches your app's complexity needs and user experience requirements.

## Database Connection Strategy

### Neon Read Replicas Usage

#### Services Using Read Replicas ✅
These services can safely use Neon read replicas for better performance:

```typescript
// Read replica connection string
const READ_REPLICA_URL = process.env.NEON_READ_REPLICA_URL

// Services that can use read replicas:
const readOnlyServices = {
  // Electric SQL Service (primary user of read replica)
  electric: {
    url: READ_REPLICA_URL,
    usage: 'Streaming changes via logical replication',
    load: 'HIGH',
    benefit: 'Offloads all shape subscriptions from primary'
  },
  
  // Reporting & Analytics
  reporting: {
    url: READ_REPLICA_URL,
    usage: 'Complex aggregation queries',
    load: 'MEDIUM',
    benefit: 'Heavy queries dont impact write performance'
  },
  
  // Export Operations
  exports: {
    url: READ_REPLICA_URL,
    usage: 'Bulk data exports to CSV/Excel',
    load: 'LOW',
    benefit: 'Large data reads isolated from primary'
  },
  
  // Audit Log Queries
  auditViewer: {
    url: READ_REPLICA_URL,
    usage: 'Historical audit trail queries',
    load: 'LOW',
    benefit: 'Read-heavy audit searches offloaded'
  },
  
  // Public Dashboard (if any)
  publicMetrics: {
    url: READ_REPLICA_URL,
    usage: 'Aggregated statistics',
    load: 'LOW',
    benefit: 'Public reads dont impact operations'
  }
}
```

#### Services Requiring Primary Database ❌
These must use the primary database connection:

```typescript
// Primary connection (pooled)
const PRIMARY_URL = process.env.NEON_DATABASE_POOLED_URL

// Services that MUST use primary:
const primaryOnlyServices = {
  // Authentication
  auth: {
    url: PRIMARY_URL,
    reason: 'Session writes and user updates'
  },
  
  // Write Operations
  writes: {
    url: PRIMARY_URL,
    reason: 'All INSERT/UPDATE/DELETE operations'
  },
  
  // Transactions
  transactions: {
    url: PRIMARY_URL,
    reason: 'Multi-table atomic operations'
  },
  
  // Migrations
  migrations: {
    url: process.env.NEON_DATABASE_URL, // Direct connection
    reason: 'Schema changes require primary'
  }
}
```

## Authentication API

### Better-Auth Configuration
```typescript
// src/lib/auth/index.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@/db/server' // Uses PRIMARY connection

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg'
  }),
  emailAndPassword: {
    enabled: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
  }
})
```

### Authentication Endpoints

#### 🌐 POST `/api/auth/login`
```typescript
// Uses PRIMARY database for session creation
{
  email: string
  password: string
} → {
  user: User
  token: string
  shapes: string[] // Shapes to subscribe to based on role
}
```

#### 🌐 POST `/api/auth/logout`
```typescript
// Uses PRIMARY database for session deletion
{} → { success: boolean }
```

## Sync Proxy Endpoints

### Electric Shape Proxy
Proxies requests to Electric SQL service which uses READ REPLICA:

#### GET `/api/sync/[table]`
```typescript
// Next.js API Route that proxies to Electric
// Electric uses READ REPLICA for all shape queries
export async function GET(
  request: Request,
  { params }: { params: { table: string } }
) {
  const electricUrl = new URL(
    `${process.env.ELECTRIC_URL}/v1/shape/${params.table}`
  )
  
  // Forward query params
  const searchParams = new URL(request.url).searchParams
  searchParams.forEach((value, key) => {
    electricUrl.searchParams.set(key, value)
  })
  
  // Add auth context for filtering
  const session = await getServerSession()
  if (session?.user) {
    electricUrl.searchParams.set('user_id', session.user.id)
  }
  
  // Proxy to Electric (which uses read replica)
  return fetch(electricUrl.toString())
}
```

### Available Shapes
```typescript
// These all use READ REPLICA via Electric
const shapes = {
  // User-scoped shapes
  '/api/sync/properties': 'Properties for current user',
  '/api/sync/turns': 'Active turns',
  '/api/sync/vendors': 'Approved vendors',
  '/api/sync/notifications': 'User notifications',
  
  // Reference data (cacheable)
  '/api/sync/turn-stages': 'Turn stage configuration',
  '/api/sync/property-types': 'Property type list',
}
```

## Write API (Minimal)

All write operations use PRIMARY database:

### Property Writes

#### POST `/api/write/properties`
```typescript
// Uses PRIMARY database
interface Request {
  operation: 'create' | 'update' | 'delete'
  data: Partial<Property>
  version?: number // For optimistic locking
}

interface Response {
  success: boolean
  property?: Property
  error?: {
    type: 'CONFLICT' | 'VALIDATION' | 'PERMISSION'
    message: string
    conflicts?: any
  }
}

// Implementation
export async function POST(req: Request) {
  const db = getPrimaryDb() // Uses PRIMARY connection
  
  // Validate business rules
  await validatePropertyRules(req.data)
  
  // Check version for conflicts
  if (req.operation === 'update') {
    const current = await db.select()
      .from(properties)
      .where(eq(properties.id, req.data.id))
    
    if (current.version !== req.version) {
      return { error: { type: 'CONFLICT' } }
    }
  }
  
  // Execute write
  const result = await db.transaction(async (tx) => {
    // Write operation
    // Audit log
    // Version increment
  })
  
  // Electric will propagate via read replica
  return { success: true, property: result }
}
```

### Turn Writes

#### POST `/api/write/turns`
```typescript
// Uses PRIMARY database
interface TurnWriteRequest {
  operation: 'create' | 'update' | 'stage-change' | 'approve'
  turnId?: string
  data: Partial<Turn>
  metadata?: {
    approvalLevel?: 'DFO' | 'HO'
    rejectReason?: string
  }
}

// Complex business logic handled server-side
async function handleTurnWrite(req: TurnWriteRequest) {
  const db = getPrimaryDb() // PRIMARY connection
  
  switch (req.operation) {
    case 'stage-change':
      // Validate stage transition rules
      // Send notifications
      // Update in transaction
      break
      
    case 'approve':
      // Check approval authority
      // Update approval status
      // Trigger workflows
      break
  }
}
```

### Batch Writes

#### POST `/api/write/batch`
```typescript
// Uses PRIMARY database for atomic operations
interface BatchWriteRequest {
  operations: Array<{
    table: string
    operation: 'create' | 'update' | 'delete'
    data: any
  }>
}

// Atomic batch processing
async function processBatch(req: BatchWriteRequest) {
  const db = getPrimaryDb()
  
  return await db.transaction(async (tx) => {
    const results = []
    for (const op of req.operations) {
      // Process each operation
      results.push(await processOperation(tx, op))
    }
    return results
  })
}
```

## Reporting API (Read Replica)

All reporting endpoints use READ REPLICA:

### GET `/api/reports/dashboard`
```typescript
// Uses READ REPLICA
async function getDashboardMetrics() {
  const db = getReadReplicaDb()
  
  // Heavy aggregation queries on read replica
  const metrics = await db.select({
    totalProperties: count(properties.id),
    activeTurns: count(turns.id),
    avgTurnDuration: avg(turnDuration),
  }).from(properties)
  
  return metrics
}
```

### GET `/api/reports/export`
```typescript
// Uses READ REPLICA for bulk exports
interface ExportRequest {
  type: 'properties' | 'turns' | 'vendors'
  format: 'csv' | 'excel' | 'pdf'
  filters?: any
}

async function generateExport(req: ExportRequest) {
  const db = getReadReplicaDb()
  
  // Large data reads from replica
  const data = await db.select()
    .from(getTable(req.type))
    .where(buildFilters(req.filters))
  
  return formatExport(data, req.format)
}
```

## File Upload API

### POST `/api/upload`
```typescript
// Uses PRIMARY for metadata, S3 for storage
interface UploadRequest {
  file: File
  entityType: 'property' | 'turn' | 'vendor'
  entityId: string
}

async function handleUpload(req: UploadRequest) {
  // Upload to S3/Cloudinary
  const fileUrl = await uploadToStorage(req.file)
  
  // Save metadata to PRIMARY database
  const db = getPrimaryDb()
  await db.insert(documents).values({
    url: fileUrl,
    entityType: req.entityType,
    entityId: req.entityId
  })
  
  return { url: fileUrl }
}
```

## WebSocket Events (via Electric)

Electric handles real-time updates using READ REPLICA:

```typescript
// Client subscribes to shapes
const stream = new ShapeStream({
  url: '/api/sync/turns', // Proxies to Electric → Read Replica
  params: {
    where: 'is_active = true'
  }
})

// Real-time updates flow:
// 1. Write to PRIMARY via API
// 2. Electric detects via logical replication on READ REPLICA
// 3. Electric streams to all subscribed clients
// 4. PGlite updates locally
// 5. UI updates instantly
```

## Service Worker API

### Background Sync
```javascript
// sw.js - Handles offline writes
self.addEventListener('sync', async (event) => {
  if (event.tag === 'sync-writes') {
    event.waitUntil(syncPendingWrites())
  }
})

async function syncPendingWrites() {
  // Get pending writes from IndexedDB
  const pending = await getPendingWrites()
  
  for (const write of pending) {
    try {
      // Attempt write to PRIMARY database
      await fetch('/api/write/' + write.table, {
        method: 'POST',
        body: JSON.stringify(write)
      })
      
      // Mark as synced
      await markSynced(write.id)
    } catch (error) {
      // Retry later
      await scheduleRetry(write)
    }
  }
}
```

## Error Handling

### Conflict Resolution
```typescript
interface ConflictError {
  type: 'CONFLICT'
  localVersion: number
  serverVersion: number
  localData: any
  serverData: any
  resolution?: 'local' | 'remote' | 'merge'
}

// Client handles conflicts
async function resolveConflict(error: ConflictError) {
  if (error.resolution === 'merge') {
    // Merge logic
    const merged = mergeChanges(error.localData, error.serverData)
    return await retryWrite(merged)
  }
  
  // User resolution UI
  return await showConflictDialog(error)
}
```

## Rate Limiting

Different limits for different connection types:

```typescript
const rateLimits = {
  // Write operations (PRIMARY)
  writes: {
    limit: 100,
    window: '1m',
    connection: 'PRIMARY'
  },
  
  // Auth operations (PRIMARY)
  auth: {
    limit: 5,
    window: '1m',
    connection: 'PRIMARY'
  },
  
  // Shape subscriptions (READ REPLICA via Electric)
  shapes: {
    limit: 50,
    window: '1m',
    connection: 'READ_REPLICA'
  },
  
  // Reports (READ REPLICA)
  reports: {
    limit: 10,
    window: '5m',
    connection: 'READ_REPLICA'
  },
  
  // Exports (READ REPLICA)
  exports: {
    limit: 5,
    window: '10m',
    connection: 'READ_REPLICA'
  }
}
```

## Connection Configuration

### Environment Variables
```bash
# Primary database (for writes)
NEON_DATABASE_URL="postgresql://user:pass@ep-main.us-east-2.aws.neon.tech/turns_db"
NEON_DATABASE_POOLED_URL="postgresql://user:pass@ep-main-pooler.us-east-2.aws.neon.tech/turns_db"

# Read replica (for Electric and reports)
NEON_READ_REPLICA_URL="postgresql://user:pass@ep-replica.us-east-2.aws.neon.tech/turns_db"

# Electric service (uses read replica)
ELECTRIC_URL="http://electric-service:3000"
ELECTRIC_DATABASE_URL="${NEON_READ_REPLICA_URL}"
```

### Database Client Setup
```typescript
// src/db/connections.ts
import { neon } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-http'

// Primary connection for writes
export function getPrimaryDb() {
  const sql = neon(process.env.NEON_DATABASE_POOLED_URL!)
  return drizzle(sql, { schema })
}

// Read replica for queries
export function getReadReplicaDb() {
  const sql = neon(process.env.NEON_READ_REPLICA_URL!)
  return drizzle(sql, { schema })
}

// Direct connection for migrations (PRIMARY only)
export function getMigrationDb() {
  const sql = neon(process.env.NEON_DATABASE_URL!)
  return drizzle(sql, { schema })
}
```

## Monitoring & Analytics

### Metrics to Track
```typescript
interface ApiMetrics {
  // Write operations (PRIMARY)
  writesPerMinute: number
  writeLatency: number
  conflictRate: number
  
  // Shape subscriptions (READ REPLICA)
  activeShapes: number
  shapeDataVolume: number
  
  // Sync performance
  syncLatency: number
  pendingWrites: number
  
  // Connection distribution
  primaryLoad: number
  replicaLoad: number
}
```

## Benefits of This Architecture

### Performance
- 📊 **90% Fewer API Calls**: Most reads from local database
- ⚡ **Instant UI**: No loading states for synced data
- 🔄 **Real-time Updates**: Automatic propagation via Electric
- 📈 **Better Scaling**: Read replica handles all shape subscriptions

### Cost Optimization
- 💰 **Reduced Primary Load**: Writes only on primary
- 📉 **Lower Compute**: Read replica handles heavy queries
- 🔋 **Efficient Sync**: Delta updates only
- 🌐 **CDN-like Performance**: Local reads eliminate latency

### Developer Experience
- 🎯 **Simpler Code**: No loading states or manual cache
- 🔧 **Type Safety**: End-to-end TypeScript
- 🐛 **Easier Debugging**: Inspect local database
- 📦 **Smaller Bundle**: Less state management code