# Turns Management - Technical Architecture Document

## Project Overview
A modern, **local-first** web application for property turns management, leveraging Electric SQL for real-time sync and offline capabilities. This architecture provides native-app performance with web deployment simplicity, similar to Linear or Figma.

## Architecture Philosophy

### Local-First Principles
- **Offline by Default**: Full functionality without internet connection
- **Instant UI**: No loading states for synced data
- **Real-time Collaboration**: Automatic sync across all clients
- **Optimistic Updates**: Immediate UI feedback with background sync
- **Conflict-Free**: Automated conflict resolution with audit trail

## Technology Stack

### Frontend (Client-Side)
- **Framework**: Next.js 14+ (App Router)
- **Local Database**: PGlite (SQLite-compatible in-browser database)
- **Sync Engine**: Electric SQL Client
- **ORM**: Drizzle ORM (client schema)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Local database + React hooks
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts / Tremor
- **Tables**: TanStack Table
- **PWA**: Service Workers for offline support

### Backend (Minimal Server-Side)
- **Database**: Neon Postgres (serverless, with branching)
- **Sync Service**: Electric SQL (Docker container)
- **ORM**: Drizzle ORM (server schema)
- **Authentication**: Better-Auth
- **API**: Next.js API Routes (write operations only)
- **File Storage**: AWS S3 / Cloudinary
- **Email**: Resend (for notifications)

### Infrastructure
- **Hosting**: Vercel (Next.js) + Fly.io (Electric)
- **Database**: Neon (serverless Postgres)
- **CDN**: Vercel Edge Network
- **Monitoring**: Sentry, PostHog
- **Container Registry**: Docker Hub

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Applications                      │
├─────────────────────────────────────────────────────────────┤
│   Browser (PWA)   │   Mobile Web   │   Desktop (Tauri)      │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                    PGlite Database                   │   │
│  │  • Local SQLite-compatible database                  │   │
│  │  • Drizzle ORM client schema                        │   │
│  │  • Offline data persistence                         │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │ ▲
                            │ │ Bidirectional Sync
                            ▼ │
┌─────────────────────────────────────────────────────────────┐
│                    Electric SQL Sync Layer                   │
├─────────────────────────────────────────────────────────────┤
│  • Shape subscriptions (partial replication)                 │
│  • Real-time streaming of database changes                   │
│  • Automatic conflict resolution                             │
│  • Connection management and retry logic                     │
└─────────────────────────────────────────────────────────────┘
                            │ ▲
                            │ │ Logical Replication
                            ▼ │
┌─────────────────────────────────────────────────────────────┐
│                      Neon Postgres                           │
├─────────────────────────────────────────────────────────────┤
│  • Serverless PostgreSQL with autoscaling                   │
│  • Branch databases for dev/test                            │
│  • Point-in-time recovery                                   │
│  • Drizzle ORM server schema                                │
└─────────────────────────────────────────────────────────────┘
                            │ ▲
                            │ │ Write Operations
                            ▼ │
┌─────────────────────────────────────────────────────────────┐
│                    Write API (Minimal)                       │
├─────────────────────────────────────────────────────────────┤
│  • Authentication (Better-Auth)                              │
│  • Business logic validation                                 │
│  • Complex transactions                                      │
│  • External integrations                                     │
└─────────────────────────────────────────────────────────────┘
```

## Data Flow Patterns

### Read Path (Primary) - Always Local
```
User Action → PGlite Query → Instant UI Update (0-50ms)
                    ↑
            Electric Sync (Background)
                    ↑
              Neon Postgres
```

### Write Paths - Four Patterns Available

Electric SQL supports multiple write patterns. Choose based on your application's complexity and offline requirements:

#### Pattern 1: Online Writes 🌐
```
User Action → Loading State → API Call → Neon Write → Electric Sync → All Clients
                             ↓
                        Network Required
```
**Best for:** Dashboards, analytics, infrequent writes

#### Pattern 2: Simple Optimistic State ⚡
```
User Action → Optimistic Update (useOptimistic) → Instant UI
                         ↓                            ↑
                    API Call (background)             |
                         ↓                            |
                    Neon Write → Electric Sync ------+
                         ↓
                   Replace optimistic data
```
**Best for:** Interactive apps, better UX

#### Pattern 3: Shared Persistent Optimistic State 💾 (Recommended)
```
User Action → PGlite Write (optimistic) → Instant UI Update
                         ↓                      ↑
                 Zustand Store (persist)       |
                         ↓                      |
                Background Sync Queue          |
                         ↓                      |
                    API Call → Neon Write → Electric Sync
                         ↓                      |
                Clear from pending writes -----+
```
**Best for:** Turn Management app, offline support, shared state

#### Pattern 4: Through-the-Database Sync 🗄️
```
User Action → Write to PGlite View → INSTEAD OF Trigger
                         ↓                     ↓
                   Instant UI          Shadow Table Update
                                              ↓
                                        Change Log Entry
                                              ↓
                                   Background Sync Process
                                              ↓
                                         API Call
                                              ↓
                                       Neon Write → Electric Sync
```
**Best for:** Pure local-first apps, automatic sync management

## Write Pattern Decision Matrix

| Requirement | Pattern 1 | Pattern 2 | Pattern 3 | Pattern 4 |
|-------------|-----------|-----------|-----------|-----------|
| **Instant UI** | ❌ | ✅ | ✅ | ✅ |
| **Offline Writes** | ❌ | ⏱️ Temporary | ✅ Persistent | ✅ Persistent |
| **Shared State** | N/A | ❌ | ✅ | ✅ |
| **Complexity** | ⭐ | ⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |
| **Setup Time** | 1 day | 2 days | 1 week | 2 weeks |
| **Maintenance** | Low | Low | Medium | High |

### Recommended for Turns Management: Pattern 3

**Why Pattern 3 is ideal:**
- ✅ **Zustand**: Already in our stack for state management
- ✅ **PGlite**: Leverages our local database setup
- ✅ **Drizzle ORM**: Works seamlessly with our schemas
- ✅ **Persistence**: Critical for mobile property managers
- ✅ **Shared State**: Turn updates visible across all components
- ✅ **Better Auth**: Integrates with user context and permissions
- ✅ **Balanced**: Complex enough for enterprise features, simple enough to maintain

## Advanced Write Patterns

### Conflict Resolution Strategies

#### 1. Last Write Wins (Simple)
```typescript
function resolveConflict(local: any, server: any) {
  if (server.version > local.version) {
    return server  // Server wins
  }
  return local
}
```

#### 2. Field-Level Merge (Sophisticated)
```typescript
function mergeChanges(local: any, server: any) {
  const merged = { ...server }
  
  // Apply local changes that are newer
  local._modifiedColumns?.forEach(field => {
    if (local[`${field}_modifiedAt`] > server.updatedAt) {
      merged[field] = local[field]
    }
  })
  
  return merged
}
```

#### 3. User Resolution (Interactive)
```typescript
async function resolveConflict(local: any, server: any) {
  // Show conflict resolution dialog
  return await showConflictDialog({
    local,
    server,
    onResolve: (resolution) => {
      // Apply user's choice
      switch (resolution.strategy) {
        case 'keep-local': return local
        case 'accept-server': return server
        case 'merge': return resolution.merged
      }
    }
  })
}
```

### YAGNI Principle for Conflicts

Research from Muse (Adam Wiggins) shows that **conflicts are extremely rare** in practice:
- Most users don't edit the same record simultaneously
- Good UX design (presence indicators, auto-save) prevents conflicts
- Simple strategies (last-write-wins) work fine for 99% of use cases

**Recommendation:** Start with simple conflict resolution, add complexity only when needed.

## Shape Definitions (Partial Replication)

### Core Shapes
```typescript
// Property Shape - Syncs property data for user's assigned properties
const propertyShape = {
  table: 'properties',
  where: 'property_manager_id = $1 OR sr_property_manager_id = $1',
  include: ['turns', 'documents', 'utilities']
}

// Active Turns Shape - Only active turns with related data
const activeTurnsShape = {
  table: 'turns',
  where: 'is_active = true AND stage_id != $completed_stage_id',
  include: ['property', 'vendor', 'documents', 'approvals']
}

// Vendor Shape - Available vendors
const vendorShape = {
  table: 'vendors',
  where: 'is_active = true AND is_approved = true'
}

// User Notifications Shape
const notificationShape = {
  table: 'notifications',
  where: 'user_id = $1 AND created_at > $2',
  params: [userId, thirtyDaysAgo]
}
```

## Core Modules (Local-First Design)

### 1. Authentication & Authorization
- **Local**: User session cached in PGlite
- **Sync**: Permissions synced from server
- **Offline**: Full access to cached data
- **Online**: Token refresh and validation

### 2. Property Management
- **Local Operations**: Browse, search, filter properties
- **Sync**: Real-time property updates
- **Write API**: Create/update properties
- **Conflict Resolution**: Server timestamp wins

### 3. Turns Management
- **Kanban Board**: Fully local drag-and-drop
- **Optimistic Updates**: Instant stage transitions
- **Approval Flow**: Queue approvals when offline
- **Documents**: Local preview, background upload

### 4. Vendor Management
- **Vendor Database**: Fully synced locally
- **Assignment**: Optimistic with validation
- **Performance Metrics**: Calculated locally
- **Ratings**: Synced across all users

### 5. Reporting & Analytics
- **Local Calculations**: Instant report generation
- **Data Aggregation**: PGlite SQL queries
- **Export**: Client-side PDF/Excel generation
- **Historical Data**: Synced based on date range

### 6. Audit Logging
- **Local Trail**: Every action logged locally
- **Sync Metadata**: Track sync status per record
- **Conflict History**: Maintain resolution log
- **Compliance**: Full offline audit capability

## Database Schema Design

### Server Schema (Neon Postgres)
```typescript
// Standard tables with Electric-compatible design
interface ServerTable {
  id: uuid
  created_at: timestamp
  updated_at: timestamp
  created_by: uuid
  updated_by: uuid
  version: integer // For optimistic locking
}
```

### Client Schema (PGlite)
```typescript
// Extended with sync metadata
interface ClientTable extends ServerTable {
  _synced: boolean
  _sent_to_server: boolean
  _modified_columns: string[]
  _local_modified_at: timestamp
  _sync_error: string?
}
```

## Sync Configuration

### Electric Service Setup
```yaml
electric:
  database_url: ${NEON_DATABASE_URL}
  auth:
    mode: secure
    secret: ${ELECTRIC_SECRET}
  shapes:
    ttl: 3600 # 1 hour cache
    max_size: 10MB
  http:
    port: 3000
    compression: true
```

### Shape Subscription Management
```typescript
class ShapeManager {
  // Subscribe to shapes based on user context
  async initializeShapes(userId: string) {
    await this.subscribeToShape('properties', { 
      where: `manager_id = ${userId}` 
    })
    await this.subscribeToShape('active_turns')
    await this.subscribeToShape('notifications', { 
      where: `user_id = ${userId}` 
    })
  }
  
  // Dynamic shape updates
  async updateShapeFilter(shape: string, newFilter: object) {
    await this.unsubscribe(shape)
    await this.subscribeToShape(shape, newFilter)
  }
}
```

## Offline Capabilities

### Service Worker Strategy
```javascript
// Cache-first for app shell
// Network-first for API calls
// Background sync for writes

self.addEventListener('sync', event => {
  if (event.tag === 'sync-writes') {
    event.waitUntil(syncPendingWrites())
  }
})
```

### Conflict Resolution
1. **Last Write Wins**: Default strategy with version tracking
2. **Merge Strategy**: For collaborative text fields
3. **User Resolution**: For critical conflicts
4. **Audit Trail**: All conflicts logged

## Performance Optimizations

### Client-Side
- **Instant UI**: All reads from local database
- **Virtual Scrolling**: For large lists
- **Lazy Shape Loading**: Subscribe on-demand
- **Indexed Queries**: PGlite indexes for common queries
- **Debounced Sync**: Batch write operations

### Server-Side
- **Neon Autoscaling**: Automatic compute scaling
- **Connection Pooling**: PgBouncer integration
- **Logical Replication**: Minimal overhead
- **Shape Caching**: CDN for shape responses

### Network
- **Compression**: Gzip for shape data
- **Delta Sync**: Only changed fields
- **Resumable Sync**: Handle connection drops
- **Progressive Enhancement**: Work without sync

## Security Considerations

### Data Security
- **Encryption**: TLS for sync, encrypted at rest
- **Row-Level Security**: Postgres RLS policies
- **Shape Authorization**: Server-side filtering
- **Token Management**: Secure refresh flow

### Sync Security
- **Authenticated Shapes**: User-scoped data only
- **Write Validation**: Server-side business rules
- **Audit Everything**: Complete activity log
- **Rate Limiting**: Per-user shape limits

## Deployment Architecture

### Development
```yaml
# docker-compose.dev.yml
services:
  postgres:
    image: postgres:16
    environment:
      POSTGRES_DB: turns_dev
  
  electric:
    image: electricsql/electric:latest
    environment:
      DATABASE_URL: postgresql://...
      ELECTRIC_INSECURE: true
  
  app:
    build: .
    environment:
      NEXT_PUBLIC_ELECTRIC_URL: http://localhost:3000
```

### Production
```yaml
# Neon (Database)
- Automatic backups
- Branch per PR
- Connection pooling

# Fly.io (Electric)
- Multi-region deployment
- Automatic SSL
- Health checks

# Vercel (Next.js)
- Edge functions
- Static optimization
- Incremental Static Regeneration
```

## Migration Strategy

### Phase 1: Infrastructure Setup (Week 1-2)
1. Setup Neon database with schema
2. Deploy Electric SQL service
3. Configure PGlite in Next.js
4. Implement basic shape subscriptions

### Phase 2: Core Features (Week 3-6)
1. Migrate property management to local-first
2. Implement turns workflow with sync
3. Add vendor management shapes
4. Setup offline capabilities

### Phase 3: Advanced Features (Week 7-10)
1. Complex approval workflows
2. Document sync and storage
3. Reporting and analytics
4. Audit logging system

### Phase 4: Optimization (Week 11-12)
1. Performance tuning
2. Conflict resolution refinement
3. Security hardening
4. Production deployment

## Development Guidelines

### Local-First Principles
1. **Always Read Local**: Never fetch data that's already synced
2. **Optimistic Updates**: Update UI immediately
3. **Queue Writes**: Batch and retry failed writes
4. **Handle Offline**: Graceful degradation
5. **Sync Status**: Show sync indicators

### Code Organization
```
src/
├── db/
│   ├── schema/          # Drizzle schemas
│   ├── migrations/       # SQL migrations
│   └── client.ts        # PGlite client
├── sync/
│   ├── shapes/          # Shape definitions
│   ├── manager.ts       # Shape subscription manager
│   └── conflicts.ts     # Conflict resolution
├── features/
│   ├── properties/      # Property management
│   ├── turns/          # Turn workflows
│   └── vendors/        # Vendor management
└── api/
    ├── write/          # Write endpoints
    └── sync/           # Sync proxy endpoints
```

### Testing Strategy
- **Unit Tests**: Logic and utilities
- **Integration Tests**: Sync flows
- **Offline Tests**: Service worker scenarios
- **E2E Tests**: Full user workflows
- **Sync Tests**: Conflict scenarios

## Monitoring & Analytics

### Key Metrics
- **Sync Latency**: Time to propagate changes
- **Offline Usage**: Time spent offline
- **Conflict Rate**: Frequency of conflicts
- **Shape Size**: Data volume per user
- **Write Queue**: Pending operations

### Observability
```typescript
// Track sync performance
Electric.on('sync:complete', (stats) => {
  analytics.track('sync_complete', {
    duration: stats.duration,
    records: stats.recordCount,
    conflicts: stats.conflictCount
  })
})
```

## Benefits of This Architecture

### User Experience
- ⚡ **Instant Response**: No loading spinners
- 📱 **Works Offline**: Full functionality
- 🔄 **Real-time Updates**: See changes immediately
- 🚀 **Fast Navigation**: No page loads

### Development
- 🎯 **Simplified State**: Database is the state
- 🔧 **Better DX**: Fewer loading states
- 🐛 **Easier Debugging**: Local data inspection
- 📦 **Smaller Bundle**: Less state management code

### Operations
- 💰 **Lower Costs**: Reduced API calls
- 📈 **Better Scalability**: Client-side computation
- 🔒 **Improved Security**: Less surface area
- 🌍 **Global Performance**: Local-first is CDN-like