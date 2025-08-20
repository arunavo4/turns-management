# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Current Implementation Status
✅ **Working Features:**
- Database connected (Azure PostgreSQL)
- Authentication system (Better Auth)
- Full CRUD API routes for Properties, Turns, Vendors
- Properties page with complete CRUD functionality
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

This is a property turns management application built with:

- **Frontend**: Next.js 15 (App Router) with TypeScript
- **Database**: Azure PostgreSQL (managed PostgreSQL service)
- **ORM**: Drizzle ORM
- **UI**: Tailwind CSS v4 + shadcn/ui components
- **Authentication**: Better Auth

### Key Architectural Principles

1. **Server-First**: Traditional REST APIs with PostgreSQL
2. **Optimistic Updates**: UI updates immediately, rollback on error
3. **Simple & Maintainable**: Focus on reliability over complexity

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
│   ├── schema.ts         # Database schemas (Drizzle)
│   └── migrations/       # Database migrations
└── lib/                   # Utilities and mock data
```

## Core Business Entities

### Properties
- Managed by property managers (PM) and senior property managers (Sr PM)
- Contains address, details, active status
- Full CRUD operations via REST API

### Turns
- Property renovation workflow
- Kanban board with stages (customizable)
- Approval flow: DFO → HO for amounts over threshold
- Vendor assignment and tracking

### Vendors
- Service providers for turn work
- Performance metrics and ratings
- Assignment to specific turns

## API Architecture

### REST Endpoints
- `/api/properties` - CRUD operations for properties
- `/api/turns` - Turn management
- `/api/vendors` - Vendor management
- `/api/auth` - Authentication endpoints

## Environment Variables

Required in `.env.local`:
```env
# Database (Azure PostgreSQL)
DATABASE_URL=postgresql://...
DATABASE_URL_POOLED=postgresql://...

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

### API Calls
```typescript
// Fetch data from API
const response = await fetch('/api/properties')
const properties = await response.json()
```

### Optimistic Updates
```typescript
// 1. Update UI immediately
setProperties(prev => [...prev, newProperty])
// 2. Call API
try {
  await fetch('/api/properties', { method: 'POST', body: data })
} catch (error) {
  // 3. Rollback on error
  setProperties(prev => prev.filter(p => p.id !== newProperty.id))
}
```

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

1. **Feature Development**: Build API endpoints first
2. **Database**: Create migrations with Drizzle Kit
3. **Frontend**: Implement UI with API integration
4. **Testing**: Test API endpoints and UI flows
- Alwasys use drizzle kit for migrations, never force or do migrations manually