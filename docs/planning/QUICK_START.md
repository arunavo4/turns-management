# Quick Start Implementation Guide

## 🚀 Day 1: Project Setup

### 1. Initialize Next.js Project

```bash
# Create new Next.js project with TypeScript
pnpm dlx shadcn@latest init

cd turns-management

# Install additional dependencies
pnpm add drizzle-orm postgres
pnpm add -D drizzle-kit @types/pg
pnpm add better-auth @better-auth/client
pnpm add @tanstack/react-query @tanstack/react-table
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next
pnpm add react-hook-form @hookform/resolvers zod
pnpm add zustand
pnpm add date-fns
pnpm add recharts
pnpm add lucide-react
```

### 2. Install shadcn/ui

```bash
# Install essential components
pnpm dlx shadcn@latest add button card dialog dropdown-menu form input label select table tabs sonner sheet badge avatar command navigation-menu
```

### 3. Setup Prisma

```bash
# Initialize Prisma
npx prisma init

# Create initial schema
```

Create `prisma/schema.prisma`:
```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PROPERTY_MANAGER
  SR_PROPERTY_MANAGER
  VENDOR
  INSPECTOR
  DFO_APPROVER
  HO_APPROVER
  USER
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  phone         String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  emailVerified Boolean   @default(false)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  lastLogin     DateTime?

  // Relations
  sessions            Session[]
  managedProperties   Property[]    @relation("PropertyManager")
  srManagedProperties Property[]    @relation("SrPropertyManager")
  turns               Turn[]
  notifications       Notification[]
}

model Session {
  id        String   @id @default(uuid())
  userId    String
  token     String   @unique
  expiresAt DateTime
  createdAt DateTime @default(now())

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
}

model Property {
  id         String  @id @default(uuid())
  propertyId String  @unique
  name       String
  
  // Address
  streetAddress String
  city          String?
  state         String?
  zipCode       String?
  country       String  @default("United States")
  county        String?
  
  // Details
  yearBuilt  Int?
  market     String?
  areaSqft   Int?
  bedrooms   Decimal? @db.Decimal(3, 1)
  bathrooms  Decimal? @db.Decimal(3, 1)
  
  // Status
  isActive      Boolean @default(true)
  isSection8    Boolean @default(false)
  inDisposition Boolean @default(false)
  hasInsurance  Boolean @default(false)
  hasSquatters  Boolean @default(false)
  isCore        Boolean @default(true)
  ownership     Boolean @default(false)
  
  // Dates
  moveInDate  DateTime?
  moveOutDate DateTime?
  
  // Relations
  propertyManagerId   String?
  propertyManager     User?   @relation("PropertyManager", fields: [propertyManagerId], references: [id])
  srPropertyManagerId String?
  srPropertyManager   User?   @relation("SrPropertyManager", fields: [srPropertyManagerId], references: [id])
  
  turns Turn[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  
  @@index([propertyId])
  @@index([isActive])
  @@index([isCore])
}

model TurnStage {
  id           String  @id @default(uuid())
  name         String
  displayOrder Int     @unique
  color        String  @default("#000000")
  
  // Email settings
  sendEmailToUsers  Boolean @default(false)
  sendEmailToVendor Boolean @default(false)
  
  // Requirements
  isAmountRequired  Boolean @default(false)
  isVendorRequired  Boolean @default(false)
  requiresApproval  Boolean @default(false)
  
  // Status
  isCompleteStage Boolean @default(false)
  isActive        Boolean @default(true)
  
  turns Turn[]
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}

model Turn {
  id       String @id @default(uuid())
  turnId   String @unique
  
  // Relations
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id])
  stageId    String
  stage      TurnStage @relation(fields: [stageId], references: [id])
  
  // Work order
  woNumber        String?
  moveOutDate     DateTime?
  trashOutNeeded  Boolean   @default(false)
  
  // Financial
  turnAmount        Decimal? @db.Decimal(10, 2)
  approvedTurnAmount Decimal? @db.Decimal(10, 2)
  changeOrderAmount  Decimal? @db.Decimal(10, 2)
  
  // Important dates
  expectedCompletionDate DateTime?
  occupancyCheckDate     DateTime?
  scopeApprovedDate      DateTime?
  turnAssignmentDate     DateTime?
  finalWalkDate          DateTime?
  sentToLeasingDate      DateTime?
  scan360Date            DateTime?
  turnCompletionDate     DateTime?
  
  // Status
  status    String?
  subStatus String?
  isActive  Boolean @default(true)
  
  // Lock box
  lockBoxInstallDate DateTime?
  lockBoxLocation    String?
  primaryLockBoxCode String?
  
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  createdBy String?
  creator   User?    @relation(fields: [createdBy], references: [id])
  
  @@index([turnId])
  @@index([propertyId])
  @@index([stageId])
  @@index([isActive])
}

model Notification {
  id      String  @id @default(uuid())
  userId  String
  user    User    @relation(fields: [userId], references: [id])
  
  title   String
  message String
  type    String  @default("INFO")
  
  entityType String?
  entityId   String?
  actionUrl  String?
  
  isRead Boolean   @default(false)
  readAt DateTime?
  
  createdAt DateTime @default(now())
  
  @@index([userId])
  @@index([isRead])
}
```

### 4. Setup Environment Variables

Create `.env.local`:
```env
# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/turns_management"

# Authentication
BETTER_AUTH_SECRET="your-secret-key-min-32-chars-generate-with-openssl"
NEXTAUTH_URL="http://localhost:3000"

# Optional services (add as needed)
# RESEND_API_KEY=""
# AWS_ACCESS_KEY_ID=""
# AWS_SECRET_ACCESS_KEY=""
# AWS_BUCKET_NAME=""
```

### 5. Create Database and Run Migrations

```bash
# Create database
createdb turns_management

# Generate Prisma client
npx prisma generate

# Create and run migration
npx prisma migrate dev --name init

# Optional: Seed database
npx prisma db seed
```

## 📂 Day 2: Project Structure Setup

### 1. Create Folder Structure

```bash
# Create directories
mkdir -p src/lib/{auth,db,utils}
mkdir -p src/hooks
mkdir -p src/services
mkdir -p src/types
mkdir -p src/components/{features,layouts}
mkdir -p src/app/api/trpc
mkdir -p src/server/{routers,trpc}
```

### 2. Setup tRPC

Create `src/server/trpc/trpc.ts`:
```typescript
import { initTRPC, TRPCError } from '@trpc/server'
import { type CreateNextContextOptions } from '@trpc/server/adapters/next'
import { prisma } from '@/lib/db'
import { getServerSession } from '@/lib/auth'
import superjson from 'superjson'

export const createTRPCContext = async (opts: CreateNextContextOptions) => {
  const { req, res } = opts
  const session = await getServerSession(req, res)
  
  return {
    prisma,
    session,
    req,
    res,
  }
}

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
})

export const router = t.router
export const publicProcedure = t.procedure

const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user }
    }
  })
})

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed)
```

### 3. Create Database Client

Create `src/lib/db.ts`:
```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

### 4. Setup Authentication

Create `src/lib/auth/index.ts`:
```typescript
import { betterAuth } from 'better-auth'
import { prismaAdapter } from '@better-auth/prisma-adapter'
import { prisma } from '@/lib/db'

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql'
  }),
  emailAndPassword: {
    enabled: true
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  }
})
```

## 🎨 Day 3: Basic UI Components

### 1. Create Layout

Create `src/app/(dashboard)/layout.tsx`:
```typescript
import { Sidebar } from '@/components/layouts/sidebar'
import { Header } from '@/components/layouts/header'

export default function DashboardLayout({
  children
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
```

### 2. Create Dashboard Page

Create `src/app/(dashboard)/page.tsx`:
```typescript
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Properties</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">150</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Active Turns</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">23</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">5</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>This Month Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">$45,230</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
```

## 🔥 Day 4-5: Core Features

### Properties Module

Create `src/app/(dashboard)/properties/page.tsx`:
```typescript
'use client'

import { useState } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Plus, Search } from 'lucide-react'

export default function PropertiesPage() {
  const [search, setSearch] = useState('')
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Properties</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Property
        </Button>
      </div>
      
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search properties..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Property cards will go here */}
      </div>
    </div>
  )
}
```

## 📝 Next Steps

1. **Complete Authentication Flow**
   - Login/Register pages
   - Protected routes
   - User profile

2. **Implement Data Fetching**
   - tRPC routers for each module
   - React Query hooks
   - Loading states

3. **Build Turn Management**
   - Kanban board
   - Drag and drop
   - Stage transitions

4. **Add Forms**
   - Property creation
   - Turn creation
   - Validation

5. **Implement File Upload**
   - Document management
   - Image preview
   - Cloud storage

## 🎯 Week 1 Deliverables

- [ ] Complete authentication system
- [ ] Property CRUD operations
- [ ] Basic turn management
- [ ] Dashboard with real data
- [ ] Responsive design
- [ ] Basic search functionality

## 📚 Resources

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com)
- [Prisma](https://www.prisma.io/docs)
- [tRPC](https://trpc.io/docs)
- [Better Auth](https://www.better-auth.com/docs)