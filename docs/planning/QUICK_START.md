# Quick Start Implementation Guide - Local-First Architecture

## 🚀 Day 1: Project Setup with Electric SQL Cloud

### 1. Initialize Next.js Project

```bash
# Create new Next.js project with TypeScript
pnpm create next-app@latest turns-management --typescript --tailwind --app --src-dir --import-alias "@/*"

cd turns-management

# Install local-first dependencies
pnpm add @electric-sql/client @electric-sql/pglite @electric-sql/pglite-sync
pnpm add drizzle-orm @neondatabase/serverless
pnpm add -D drizzle-kit

# Install UI and utilities
pnpm add @radix-ui/themes class-variance-authority clsx tailwind-merge
pnpm add better-auth @better-auth/client
pnpm add @tanstack/react-query 
pnpm add react-hook-form @hookform/resolvers zod
pnpm add date-fns
pnpm add recharts
pnpm add lucide-react
```

### 2. Install shadcn/ui with Tailwind v4

```bash
# Initialize shadcn/ui
pnpm dlx shadcn@latest init

# Install essential components
pnpm dlx shadcn@latest add button card dialog dropdown-menu form input label select table tabs toast sheet badge avatar command navigation-menu
```

### 3. Setup Electric SQL Cloud

#### Register Your Database with Electric Cloud

1. **Sign up at [Electric Cloud](https://electric-sql.cloud)**
2. **Add your Neon Database:**
   - Click "New Source"
   - Select region (match your Neon region)
   - Enter your Neon connection string
   - Click "Connect Source"
3. **Save your credentials:**
   - Source ID (public identifier)
   - Source Secret (keep secure, server-side only!)

#### Configure Environment Variables

Create `.env.local`:
```env
# Neon Database (Primary - for writes)
NEON_DATABASE_URL="postgresql://user:pass@ep-main.us-east-2.aws.neon.tech/turns_db?sslmode=require"
NEON_DATABASE_POOLED_URL="postgresql://user:pass@ep-main-pooler.us-east-2.aws.neon.tech/turns_db?sslmode=require"

# Neon Read Replica (for Electric SQL)
NEON_READ_REPLICA_URL="postgresql://user:pass@ep-replica.us-east-2.aws.neon.tech/turns_db?sslmode=require"

# Electric Cloud Credentials (SERVER-SIDE ONLY!)
ELECTRIC_SOURCE_ID="8ea4e5fb-9217-4ca6-80b7-0a97581c4c10"
ELECTRIC_SOURCE_SECRET="your-secret-keep-secure"

# Public Electric API (proxied through your API)
NEXT_PUBLIC_ELECTRIC_API="/api/electric"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-min-32-chars-generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"
```

### 4. Setup Drizzle ORM Schemas

#### Server Schema Configuration
Create `drizzle.config.server.ts`:
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

#### Client Schema Configuration
Create `drizzle.config.client.ts`:
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

### 5. Create Electric Proxy (Security Critical!)

Create `src/app/api/electric/[...path]/route.ts`:
```typescript
import { NextRequest } from 'next/server'

/**
 * SECURITY: This proxy adds Electric Cloud credentials server-side
 * Never expose ELECTRIC_SOURCE_SECRET to the client!
 */
export async function GET(
  req: NextRequest,
  { params }: { params: { path: string[] } }
) {
  // Validate user authentication
  const session = await getServerSession()
  if (!session?.user) {
    return new Response('Unauthorized', { status: 401 })
  }

  // Construct Electric Cloud URL
  const electricPath = params.path.join('/')
  const originUrl = new URL(
    `/${electricPath}`,
    'https://api.electric-sql.cloud'
  )

  // Forward query params from client
  req.nextUrl.searchParams.forEach((value, key) => {
    originUrl.searchParams.set(key, value)
  })

  // Add Electric Cloud credentials (server-side only!)
  originUrl.searchParams.set('source_id', process.env.ELECTRIC_SOURCE_ID!)
  originUrl.searchParams.set('secret', process.env.ELECTRIC_SOURCE_SECRET!)

  // Add user context for row-level security
  originUrl.searchParams.set('user_id', session.user.id)

  // Proxy request to Electric Cloud
  const response = await fetch(originUrl.toString())

  // Handle response headers properly
  const headers = new Headers(response.headers)
  headers.delete('content-encoding')
  headers.delete('content-length')

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  })
}
```

## 📂 Day 2: Database Setup

### 1. Create Neon Database with Read Replica

```bash
# Install Neon CLI
pnpm add -g neonctl

# Create production database
neon databases create --name turns_production

# Create read replica for Electric
neon compute-endpoints create \
  --project-id <project-id> \
  --type read_replica \
  --region us-east-2
```

### 2. Create Server Schema

Create `src/db/server/schema/users.ts`:
```typescript
import { pgTable, uuid, varchar, boolean, timestamp, pgEnum, index } from 'drizzle-orm/pg-core'

export const userRoleEnum = pgEnum('user_role', [
  'SUPER_ADMIN', 'ADMIN', 'PROPERTY_MANAGER',
  'SR_PROPERTY_MANAGER', 'VENDOR', 'USER'
])

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  passwordHash: varchar('password_hash', { length: 255 }),
  firstName: varchar('first_name', { length: 100 }),
  lastName: varchar('last_name', { length: 100 }),
  role: userRoleEnum('role').notNull().default('USER'),
  isActive: boolean('is_active').notNull().default(true),
  version: integer('version').notNull().default(1),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  emailIdx: index('users_email_idx').on(table.email),
  roleIdx: index('users_role_idx').on(table.role),
}))
```

### 3. Create Client Schema with Sync Metadata

Create `src/db/client/schema/users.ts`:
```typescript
import { pgTable, boolean, timestamp, text, integer } from 'drizzle-orm/pg-core'
import { users as serverUsers } from '../../server/schema/users'

// Client extends server schema with sync metadata
export const users = pgTable('users', {
  ...serverUsers,
  
  // Sync tracking
  _synced: boolean('_synced').notNull().default(true),
  _sentToServer: boolean('_sent_to_server').notNull().default(false),
  _deleted: boolean('_deleted').notNull().default(false),
  _modifiedColumns: text('_modified_columns').array(),
  _localModifiedAt: timestamp('_local_modified_at').defaultNow().notNull(),
  _syncError: text('_sync_error'),
  _syncRetries: integer('_sync_retries').notNull().default(0),
})
```

### 4. Run Migrations

```bash
# Generate server migrations
pnpm drizzle-kit generate:pg --config drizzle.config.server.ts

# Apply to Neon
pnpm drizzle-kit migrate --config drizzle.config.server.ts

# Generate client migrations
pnpm drizzle-kit generate:sqlite --config drizzle.config.client.ts
```

## 🔌 Day 3: Electric SQL Integration

### 1. Initialize PGlite with Electric Sync

Create `src/db/client/init.ts`:
```typescript
import { PGlite } from '@electric-sql/pglite'
import { electricSync } from '@electric-sql/pglite-sync'
import { drizzle } from 'drizzle-orm/pglite'
import * as schema from './schema'

let db: ReturnType<typeof drizzle> | null = null
let pg: PGlite | null = null

export async function initializeDatabase() {
  if (db) return { db, pg }

  // Create PGlite instance with Electric sync
  pg = await PGlite.create({
    dataDir: 'idb://turns-management',
    extensions: {
      electric: electricSync()
    }
  })

  // Run client migrations
  const migrations = await import('./migrations')
  for (const migration of migrations.default) {
    await pg.exec(migration)
  }

  // Create Drizzle client
  db = drizzle(pg, { schema })

  return { db, pg }
}
```

### 2. Create Shape Manager

Create `src/sync/shapes.ts`:
```typescript
import { ShapeStream } from '@electric-sql/client'

export class ShapeManager {
  private shapes: Map<string, ShapeStream> = new Map()

  async subscribeToShape(name: string, config: any) {
    // Use proxied Electric API (with auth)
    const stream = new ShapeStream({
      url: `${process.env.NEXT_PUBLIC_ELECTRIC_API}/v1/shape`,
      params: config.params
    })

    // Sync to local PGlite
    const shape = await pg.electric.syncShapeToTable({
      shape: stream,
      table: config.params.table,
      primaryKey: ['id'],
      shapeKey: name,
    })

    this.shapes.set(name, shape)
    return shape
  }

  async initializeUserShapes(userId: string) {
    // Subscribe to user-scoped data
    await Promise.all([
      this.subscribeToShape('properties', {
        params: {
          table: 'properties',
          where: `property_manager_id = '${userId}' OR sr_property_manager_id = '${userId}'`
        }
      }),
      this.subscribeToShape('activeTurns', {
        params: {
          table: 'turns',
          where: 'is_active = true'
        }
      }),
      this.subscribeToShape('vendors', {
        params: {
          table: 'vendors',
          where: 'is_active = true AND is_approved = true'
        }
      })
    ])
  }
}
```

### 3. Create React Provider

Create `src/providers/electric-provider.tsx`:
```typescript
'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { initializeDatabase } from '@/db/client/init'
import { ShapeManager } from '@/sync/shapes'

const ElectricContext = createContext<{
  db: any
  pg: any
  shapes: ShapeManager
} | null>(null)

export function ElectricProvider({ 
  children,
  userId 
}: { 
  children: React.ReactNode
  userId: string
}) {
  const [context, setContext] = useState<any>(null)
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    async function setup() {
      // Initialize local database
      const { db, pg } = await initializeDatabase()
      
      // Setup shape subscriptions
      const shapes = new ShapeManager(pg)
      await shapes.initializeUserShapes(userId)

      setContext({ db, pg, shapes })
      setIsReady(true)
    }

    setup()
  }, [userId])

  if (!isReady) {
    return <div>Initializing local database...</div>
  }

  return (
    <ElectricContext.Provider value={context}>
      {children}
    </ElectricContext.Provider>
  )
}

export const useElectric = () => {
  const context = useContext(ElectricContext)
  if (!context) {
    throw new Error('useElectric must be used within ElectricProvider')
  }
  return context
}
```

## 🎨 Day 4: Local-First UI Components

### 1. Create Layout with Sync Status

Create `src/app/(dashboard)/layout.tsx`:
```typescript
import { ElectricProvider } from '@/providers/electric-provider'
import { SyncStatus } from '@/components/sync-status'

export default async function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  const session = await getServerSession()
  
  return (
    <ElectricProvider userId={session.user.id}>
      <div className="flex h-screen">
        <Sidebar />
        <div className="flex-1 flex flex-col">
          <Header>
            <SyncStatus />
          </Header>
          <main className="flex-1 overflow-y-auto p-6">
            {children}
          </main>
        </div>
      </div>
    </ElectricProvider>
  )
}
```

### 2. Create Properties Page (Local-First)

Create `src/app/(dashboard)/properties/page.tsx`:
```typescript
'use client'

import { useElectric } from '@/providers/electric-provider'
import { properties } from '@/db/client/schema'
import { useLiveQuery } from '@electric-sql/react'

export default function PropertiesPage() {
  const { db } = useElectric()
  
  // Live query - automatically updates when data syncs
  const { data: propertyList } = useLiveQuery(
    db.select()
      .from(properties)
      .where(eq(properties.isActive, true))
      .orderBy(desc(properties.createdAt))
  )

  // Optimistic create
  const createProperty = async (data: any) => {
    // Insert locally first (instant UI update)
    await db.insert(properties).values({
      ...data,
      _synced: false,
      _sentToServer: false
    })

    // Queue for server sync (background)
    await fetch('/api/write/properties', {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">
        Properties ({propertyList?.length || 0})
      </h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {propertyList?.map((property) => (
          <PropertyCard 
            key={property.id} 
            property={property}
            isSynced={property._synced}
          />
        ))}
      </div>
    </div>
  )
}
```

## 🔥 Day 5: Offline Support & PWA

### 1. Create Service Worker

Create `public/sw.js`:
```javascript
// Cache app shell
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open('v1').then((cache) => {
      return cache.addAll([
        '/',
        '/offline.html',
        '/_next/static/css/*.css',
        '/_next/static/js/*.js'
      ])
    })
  )
})

// Background sync for writes
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-writes') {
    event.waitUntil(syncPendingWrites())
  }
})

async function syncPendingWrites() {
  // Get pending writes from IndexedDB
  const pending = await getPendingWrites()
  
  for (const write of pending) {
    try {
      await fetch('/api/write/' + write.table, {
        method: 'POST',
        body: JSON.stringify(write.data)
      })
      
      await markSynced(write.id)
    } catch (error) {
      // Retry later
      await scheduleRetry(write)
    }
  }
}
```

### 2. Register Service Worker

Create `src/app/layout.tsx`:
```typescript
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#000000" />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/sw.js')
              }
            `,
          }}
        />
      </body>
    </html>
  )
}
```

## 🔄 Day 6: Choose Your Write Pattern

Electric SQL supports multiple write patterns. For Turns Management, we recommend **Pattern 3: Shared Persistent Optimistic State** using Zustand + PGlite.

### Pattern Comparison Quick Reference

| Pattern | Complexity | Offline | Setup Time | Best For |
|---------|------------|---------|------------|----------|
| **Pattern 1: Online** | ⭐ | ❌ | 30min | Dashboards |
| **Pattern 2: useOptimistic** | ⭐⭐ | ⏱️ | 2hrs | Simple forms |
| **Pattern 3: Zustand + PGlite** | ⭐⭐⭐ | ✅ | 1 day | **Turns Management** |
| **Pattern 4: Shadow Tables** | ⭐⭐⭐⭐ | ✅ | 3 days | Advanced apps |

### Recommended: Pattern 3 Implementation

#### Step 1: Setup Zustand Write Store

Create `src/stores/write-store.ts`:
```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { db } from '@/db/client'
import { properties } from '@/db/client/schema'
import { eq } from 'drizzle-orm'

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

        // Auto-sync in background
        get().syncPendingWrites()
      },

      removePendingWrite: (id) => {
        set(state => ({
          pendingWrites: state.pendingWrites.filter(w => w.id !== id)
        }))
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
              get().removePendingWrite(write.id)
            } else {
              throw new Error(`Server error: ${response.status}`)
            }
          } catch (error) {
            console.warn('Sync failed:', error)
            // Retry logic handled by background sync
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
```

#### Step 2: Create Optimistic Write Utilities

Create `src/lib/optimistic-writes.ts`:
```typescript
import { db } from '@/db/client'
import { properties } from '@/db/client/schema'
import { useWriteStore } from '@/stores/write-store'
import { eq } from 'drizzle-orm'

export const optimisticWrites = {
  async updateProperty(id: string, updates: any) {
    const writeId = `property-${id}-${Date.now()}`
    
    // 1. Update PGlite immediately (instant UI)
    await db.update(properties)
      .set({
        ...updates,
        _synced: false,
        _sentToServer: false,
        _localModifiedAt: new Date()
      })
      .where(eq(properties.id, id))

    // 2. Queue for server sync
    useWriteStore.getState().addPendingWrite({
      id: writeId,
      table: 'properties',
      operation: 'update', 
      data: { id, ...updates }
    })

    return id
  },

  async createProperty(data: any) {
    const id = crypto.randomUUID()
    const writeId = `property-${id}-${Date.now()}`

    // 1. Insert locally first
    await db.insert(properties).values({
      ...data,
      id,
      _synced: false,
      _new: true
    })

    // 2. Queue for sync  
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
        _synced: false
      })
      .where(eq(properties.id, id))

    // 2. Queue deletion
    useWriteStore.getState().addPendingWrite({
      id: writeId,
      table: 'properties',
      operation: 'delete',
      data: { id }
    })
  }
}
```

#### Step 3: Use in React Components

Update `src/app/(dashboard)/properties/page.tsx`:
```typescript
'use client'

import { useLiveQuery } from '@electric-sql/react'
import { optimisticWrites } from '@/lib/optimistic-writes'
import { useWriteStore } from '@/stores/write-store'
import { db } from '@/db/client'
import { properties } from '@/db/client/schema'
import { eq } from 'drizzle-orm'

export default function PropertiesPage() {
  // Live query from PGlite (includes optimistic updates)
  const { data: propertyList } = useLiveQuery(
    db.select().from(properties).where(eq(properties._deleted, false))
  )
  
  // Get sync status
  const { pendingWrites, rejectedWrites } = useWriteStore()

  const handleCreateProperty = async (formData: any) => {
    try {
      // Instant UI update + background sync
      await optimisticWrites.createProperty(formData)
      toast.success('Property created!')
    } catch (error) {
      toast.error('Failed to create property')
    }
  }

  const handleUpdateProperty = async (id: string, updates: any) => {
    await optimisticWrites.updateProperty(id, updates)
    // UI updates instantly, no loading state needed
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Properties</h1>
          {pendingWrites.length > 0 && (
            <p className="text-sm text-orange-600">
              {pendingWrites.length} changes syncing...
            </p>
          )}
        </div>
        
        <CreatePropertyButton onCreate={handleCreateProperty} />
      </div>

      {/* Show rejected writes */}
      {rejectedWrites.length > 0 && (
        <div className="bg-red-50 p-4 rounded-lg">
          <p className="text-red-800">
            {rejectedWrites.length} changes failed to sync
          </p>
          <button className="text-red-600 underline">
            Review and retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {propertyList?.map((property) => (
          <PropertyCard
            key={property.id}
            property={property}
            onUpdate={handleUpdateProperty}
            isPending={!property._synced}
            isOptimistic={property._new}
          />
        ))}
      </div>
    </div>
  )
}
```

#### Step 4: Background Sync Service

Create `src/lib/sync-service.ts`:
```typescript
import { useWriteStore } from '@/stores/write-store'

class BackgroundSyncService {
  private syncInterval: NodeJS.Timeout | null = null

  start() {
    // Sync every 30 seconds when online
    this.syncInterval = setInterval(() => {
      if (navigator.onLine) {
        useWriteStore.getState().syncPendingWrites()
      }
    }, 30000)

    // Sync immediately when coming back online
    window.addEventListener('online', () => {
      useWriteStore.getState().syncPendingWrites()
    })

    // Update online status
    window.addEventListener('online', () => {
      useWriteStore.setState({ isOnline: true })
    })
    
    window.addEventListener('offline', () => {
      useWriteStore.setState({ isOnline: false })
    })
  }

  stop() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval)
    }
  }
}

export const syncService = new BackgroundSyncService()

// Auto-start in browser
if (typeof window !== 'undefined') {
  syncService.start()
}
```

#### Step 5: Sync Status Component

Create `src/components/sync-status.tsx`:
```typescript
'use client'

import { useWriteStore } from '@/stores/write-store'
import { WifiOff, CheckCircle, AlertCircle, Loader2 } from 'lucide-react'

export function SyncStatus() {
  const { pendingWrites, rejectedWrites, isOnline } = useWriteStore()
  
  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-orange-600">
        <WifiOff className="h-4 w-4" />
        <span className="text-sm">Offline</span>
      </div>
    )
  }

  if (pendingWrites.length > 0) {
    return (
      <div className="flex items-center gap-2 text-blue-600">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">{pendingWrites.length} syncing</span>
      </div>
    )
  }

  if (rejectedWrites.length > 0) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <AlertCircle className="h-4 w-4" />
        <span className="text-sm">{rejectedWrites.length} failed</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-green-600">
      <CheckCircle className="h-4 w-4" />
      <span className="text-sm">Synced</span>
    </div>
  )
}
```

### Alternative: Pattern 2 (Simple Optimistic)

If you prefer React's built-in optimistic state for simpler use cases:

```typescript
'use client'

import { useOptimistic } from 'react'
import { useShape } from '@electric-sql/react'

export function SimplePropertyList() {
  const { data: syncedProperties } = useShape({
    url: '/api/electric/v1/shape',
    params: { table: 'properties' }
  })

  const [optimisticProperties, addOptimistic] = useOptimistic(
    syncedProperties || [],
    (state, newProperty) => [...state, newProperty]
  )

  const createProperty = async (data: any) => {
    const tempProperty = { 
      ...data, 
      id: `temp-${Date.now()}`,
      _optimistic: true 
    }
    
    // 1. Show optimistically
    addOptimistic(tempProperty)

    // 2. Send to server
    try {
      await fetch('/api/write/properties', {
        method: 'POST',
        body: JSON.stringify(data)
      })
    } catch (error) {
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

## 📝 Testing Your Setup

### 1. Verify Electric Cloud Connection

```bash
# Test shape subscription (use curl)
curl -i "https://api.electric-sql.cloud/v1/shape?table=users&offset=-1&source_id=$ELECTRIC_SOURCE_ID&secret=$ELECTRIC_SOURCE_SECRET"
```

### 2. Test Local Database

```typescript
// In browser console
const { db } = await initializeDatabase()
const users = await db.select().from('users')
console.log('Local users:', users)
```

### 3. Test Offline Mode

1. Load the app and let data sync
2. Open DevTools → Network → Set to "Offline"
3. Navigate around - everything should work
4. Create/edit data - changes queued locally
5. Go back online - changes sync automatically

## 🎯 Week 1 Deliverables

- [x] Electric Cloud setup with secure proxy
- [x] Neon database with read replica
- [x] PGlite local database
- [x] Drizzle ORM dual schemas
- [x] Shape subscriptions
- [x] Offline support
- [ ] Authentication with Better Auth
- [ ] Property CRUD with optimistic updates
- [ ] Turn kanban board (local drag-drop)
- [ ] Sync status indicators
- [ ] PWA manifest

## 🚨 Security Checklist

- ✅ Electric Cloud credentials only on server
- ✅ Proxy validates authentication
- ✅ Row-level security via shapes
- ✅ User-scoped data filtering
- ✅ Secure session management
- ✅ HTTPS only in production

## 📚 Resources

- [Electric SQL Cloud Docs](https://electric-sql.com/docs/cloud)
- [Neon Postgres](https://neon.tech/docs)
- [PGlite Documentation](https://pglite.dev)
- [Drizzle ORM](https://orm.drizzle.team)
- [Next.js App Router](https://nextjs.org/docs)
- [Better Auth](https://www.better-auth.com/docs)

## 🆘 Common Issues & Solutions

### Issue: "Electric shape not syncing"
**Solution:** Check Electric Cloud dashboard for connection status. Verify read replica is configured correctly.

### Issue: "PGlite quota exceeded"
**Solution:** Implement data pruning for old records. Use shape TTL to limit data.

### Issue: "Sync conflicts"
**Solution:** Check version numbers and implement proper conflict resolution strategy.

### Issue: "Offline writes lost"
**Solution:** Ensure service worker is registered and background sync is enabled.