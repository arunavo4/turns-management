# Turns Management - Local-First API Documentation

## Overview

Minimal API surface for the Turns Management application, focusing on write operations and sync proxies. Most data operations happen locally via Electric SQL sync, dramatically reducing API calls and improving performance.

## Architecture Principles

### Local-First API Design
- **Reads**: Via Electric SQL shapes (no API calls)
- **Writes**: Optimistic local updates with background sync
- **Sync**: Electric handles real-time propagation
- **API**: Only for authentication, complex business logic, and external integrations

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