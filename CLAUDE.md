# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Implementation Status
✅ **Working Features:**
- Database connected (Azure PostgreSQL)
- Authentication system (Better Auth)
- Electric SQL configured
- Full CRUD API routes for Properties, Turns, Vendors
- Properties page with real data
- Homepage redirects to login

## Development Commands

### Core Commands
```bash
# Development server with Turbopack
pnpm dev

# Production build
pnpm build

# Start production server
pnpm start

# Run linting
pnpm lint

# Database operations
pnpm drizzle-kit generate  # Generate migrations
pnpm drizzle-kit migrate   # Apply migrations
pnpm tsx lib/db/seed.ts    # Seed database
```

## Architecture Overview

This is a **local-first** property turns management application built with:

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Local Database**: PGlite (in-browser SQLite-compatible database)
- **Sync Engine**: Electric SQL for real-time bidirectional sync
- **Server Database**: Azure PostgreSQL (managed PostgreSQL service)
- **ORM**: Drizzle ORM (dual schemas for client and server)
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **State Management**: Local database + Zustand for write queue

### Key Architectural Principles

1. **Local-First**: All reads from PGlite (instant, no loading states)
2. **Optimistic Updates**: Write locally first, sync in background
3. **Offline-Capable**: Full functionality without internet
4. **Real-Time Sync**: Electric SQL streams changes between clients

### Write Pattern (Pattern 3: Shared Persistent Optimistic State)

The app uses Zustand + PGlite for optimistic writes:
1. Write to local PGlite immediately (instant UI update)
2. Queue write in Zustand store (persisted)
3. Background sync to server when online
4. Electric SQL propagates to other clients

## Project Structure

```
src/
├── app/                    # Next.js app router pages
│   ├── dashboard/         # Dashboard page
│   ├── properties/        # Property management
│   ├── turns/            # Turn workflow (Kanban board)
│   ├── vendors/          # Vendor management
│   └── reports/          # Analytics and reporting
├── components/
│   ├── ui/               # shadcn/ui components
│   └── layout/           # Layout components
├── db/
│   ├── server/           # Neon Postgres schemas (Drizzle)
│   ├── client/           # PGlite schemas with sync metadata
│   └── migrations/       # Database migrations
├── sync/                  # Electric SQL sync management
│   ├── shapes/           # Shape definitions for partial replication
│   ├── manager.ts        # Shape subscription manager
│   └── conflicts.ts      # Conflict resolution logic
└── lib/                   # Utilities and mock data
```

## Core Business Entities

### Properties
- Managed by property managers (PM) and senior property managers (Sr PM)
- Contains address, details, active status
- Synced based on manager assignment

### Turns
- Property renovation workflow
- Kanban board with stages (customizable)
- Approval flow: DFO → HO for amounts over threshold
- Vendor assignment and tracking

### Vendors
- Service providers for turn work
- Performance metrics and ratings
- Assignment to specific turns

## Data Sync Architecture

### Shape Definitions
Shapes define what data syncs to each client:
- `properties`: User's assigned properties
- `activeTurns`: Only active turns
- `vendors`: Approved vendors only
- `turnStages`: Reference data for Kanban

### Sync Metadata
Client tables include:
- `_synced`: Whether record is synced with server
- `_sentToServer`: Pending server write
- `_modifiedColumns`: Fields changed locally
- `_conflictData`: Conflict resolution tracking

## Environment Variables

Required in `.env.local`:
```env
# Database (Neon Postgres)
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...

# Electric SQL
ELECTRIC_URL=https://api.electric-sql.cloud/v1/shape
ELECTRIC_SOURCE_ID=your-source-id
ELECTRIC_SOURCE_SECRET=your-jwt-token
NEXT_PUBLIC_ELECTRIC_URL=https://api.electric-sql.cloud/v1/shape
NEXT_PUBLIC_ELECTRIC_SOURCE_ID=your-source-id
NEXT_PUBLIC_ELECTRIC_SOURCE_SECRET=your-jwt-token

# Better Auth
BETTER_AUTH_SECRET=your-secret
BETTER_AUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Test Credentials

Seeded users for testing:
- admin@example.com (role: ADMIN)
- pm@example.com (role: PROPERTY_MANAGER)

## Important Patterns

### Always Read Local
```typescript
// ✅ Good - read from PGlite
const properties = await db.select().from(properties)

// ❌ Bad - API call for read
const properties = await fetch('/api/properties')
```

### Optimistic Updates
```typescript
// 1. Update local immediately
await db.update(properties).set(data)
// 2. Queue for server sync
writeStore.addPendingWrite({ table: 'properties', data })
```

### Handle Offline
- Check `navigator.onLine` for network status
- Queue writes when offline
- Auto-sync when connection returns
- Show sync status indicators

## Database Schema Highlights

### Base Columns (all tables)
- `id`: UUID primary key
- `createdAt/updatedAt`: Timestamps
- `version`: Optimistic locking
- `createdBy/updatedBy`: Audit trail

### User Roles
- SUPER_ADMIN, ADMIN
- PROPERTY_MANAGER, SR_PROPERTY_MANAGER
- VENDOR, INSPECTOR
- DFO_APPROVER, HO_APPROVER

## Development Workflow

1. **Feature Development**: Create in local PGlite first
2. **Sync Logic**: Add shape definitions for new data
3. **Write Operations**: Implement optimistic + queued sync
4. **Conflict Resolution**: Default to last-write-wins
5. **Testing**: Test offline scenarios and sync recovery
- Alwasys use drizzle kit for migrations, never force or do migrations manually