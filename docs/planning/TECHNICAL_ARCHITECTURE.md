# Turns Management - Technical Architecture Document

## Project Overview
A modern, scalable web application for property turns management, migrating from Odoo ERP to a standalone Next.js application.

## Technology Stack

### Frontend
- **Framework**: Next.js 14+ (App Router)
- **Styling**: Tailwind CSS v4
- **UI Components**: shadcn/ui
- **State Management**: Zustand / TanStack Query
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts / Tremor
- **Tables**: TanStack Table

### Backend
- **API**: Next.js API Routes (tRPC for type safety)
- **Database**: PostgreSQL with Drizzle ORM
- **Authentication**: Better-Auth (formerly NextAuth.js)
- **File Storage**: AWS S3 / Cloudinary
- **Email**: Resend / SendGrid
- **Background Jobs**: BullMQ with Redis
- **Realtime**: Pusher / Socket.io

### Infrastructure
- **Hosting**: Vercel / AWS
- **Database**: Supabase / Neon / AWS RDS
- **Cache**: Redis (Upstash)
- **Monitoring**: Sentry, LogRocket
- **Analytics**: PostHog / Plausible

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                         Client Layer                         │
├─────────────────────────────────────────────────────────────┤
│  Next.js App (SSR/SSG)  │  Mobile PWA  │  Desktop App       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                       │
├─────────────────────────────────────────────────────────────┤
│  Next.js API Routes  │  tRPC  │  REST API  │  GraphQL       │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                     Business Logic Layer                     │
├─────────────────────────────────────────────────────────────┤
│  Services  │  Validators  │  Permissions  │  Workflows      │
└─────────────────────────────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────┐
│                        Data Layer                            │
├─────────────────────────────────────────────────────────────┤
│  Drizzle ORM  │  PostgreSQL  │  Redis Cache  │  S3 Storage  │
└─────────────────────────────────────────────────────────────┘
```

## Core Modules

### 1. Authentication & Authorization
- Multi-tenant support
- Role-based access control (RBAC)
- SSO integration capabilities
- Session management

### 2. Property Management
- CRUD operations for properties
- Bulk import/export
- Property status tracking
- Document management

### 3. Turns Management
- Workflow engine with customizable stages
- Vendor assignment and tracking
- Approval workflows (DFO, HO)
- Document and photo management
- Lock box management

### 4. Utility Management
- Utility provider tracking
- Bill management
- Payment processing
- Schedule management

### 5. Reporting & Analytics
- Real-time dashboards
- Custom report builder
- Export capabilities (PDF, Excel)
- Performance metrics

### 6. Notifications
- Email notifications
- In-app notifications
- SMS (optional)
- Push notifications (PWA)

### 7. Audit Logging (Enterprise Feature)
- Comprehensive change tracking for all entities
- User activity logging
- System event logging
- Compliance reporting
- Change history views
- Rollback capabilities
- Data retention policies

## Data Models (Key Entities)

### Property
```typescript
interface Property {
  id: string
  propertyId: string
  name: string
  address: Address
  type: PropertyType
  status: PropertyStatus
  core: boolean
  yearBuilt: number
  area: number
  bedrooms: number
  bathrooms: number
  market: string
  owner: string
  propertyManager: User
  utilities: Utility[]
  turns: Turn[]
  documents: Document[]
  createdAt: Date
  updatedAt: Date
}
```

### Turn
```typescript
interface Turn {
  id: string
  turnId: string
  property: Property
  stage: TurnStage
  status: TurnStatus
  vendor: Vendor
  amounts: TurnAmounts
  dates: TurnDates
  approvals: Approval[]
  documents: Document[]
  lockBoxInfo: LockBoxInfo
  utilities: UtilityStatus
  history: TurnHistory[]
  createdAt: Date
  updatedAt: Date
}
```

### TurnStage
```typescript
interface TurnStage {
  id: string
  name: string
  order: number
  emailNotifications: boolean
  requiredFields: string[]
  autoActions: Action[]
  color: string
}
```

### AuditLog (Enterprise Feature)
```typescript
interface AuditLog {
  id: string
  tableName: string
  recordId: string
  action: 'CREATE' | 'UPDATE' | 'DELETE'
  userId: string
  userEmail: string
  userName: string
  ipAddress: string
  userAgent: string
  oldValues: Record<string, any>
  newValues: Record<string, any>
  changedFields: string[]
  metadata: {
    propertyId?: string
    turnId?: string
    context?: string
  }
  timestamp: Date
}
```

## API Design

### RESTful Endpoints
```
# Properties
GET    /api/properties
POST   /api/properties
GET    /api/properties/:id
PUT    /api/properties/:id
DELETE /api/properties/:id

# Turns
GET    /api/turns
POST   /api/turns
GET    /api/turns/:id
PUT    /api/turns/:id
PATCH  /api/turns/:id/stage
POST   /api/turns/:id/approve
POST   /api/turns/:id/reject

# Reports
GET    /api/reports/turns
GET    /api/reports/properties
GET    /api/reports/vendors
POST   /api/reports/export
```

### tRPC Procedures
```typescript
// Property procedures
propertyRouter.query.getAll
propertyRouter.query.getById
propertyRouter.mutation.create
propertyRouter.mutation.update
propertyRouter.mutation.delete

// Turn procedures
turnRouter.query.getAll
turnRouter.query.getById
turnRouter.mutation.create
turnRouter.mutation.updateStage
turnRouter.mutation.approve
turnRouter.mutation.reject
```

## Security Considerations

### Authentication
- JWT tokens with refresh mechanism
- Session-based authentication
- Multi-factor authentication (MFA)
- Password policies

### Authorization
- Role-based permissions
- Resource-level permissions
- API rate limiting
- Input validation and sanitization

### Data Protection
- Encryption at rest (database)
- Encryption in transit (HTTPS)
- PII data masking
- Audit logging

## Performance Optimization

### Frontend
- Code splitting and lazy loading
- Image optimization (Next.js Image)
- Static generation where possible
- Client-side caching

### Backend
- Database indexing
- Query optimization
- Redis caching layer
- Connection pooling

### Infrastructure
- CDN for static assets
- Auto-scaling
- Load balancing
- Database replication

## Deployment Strategy

### Environments
1. **Development**: Local development
2. **Staging**: Testing and QA
3. **Production**: Live environment

### CI/CD Pipeline
```yaml
pipeline:
  - lint
  - test
  - build
  - deploy
```

### Deployment Process
1. Code push to GitHub
2. GitHub Actions trigger
3. Run tests and linting
4. Build Docker image
5. Deploy to Vercel/AWS
6. Run database migrations
7. Health checks
8. Monitoring alerts

## Monitoring & Logging

### Application Monitoring
- Sentry for error tracking
- LogRocket for session replay
- Custom metrics dashboard

### Infrastructure Monitoring
- Uptime monitoring
- Performance metrics
- Database metrics
- API response times

### Logging Strategy
- Structured logging (JSON)
- Log levels (ERROR, WARN, INFO, DEBUG)
- Centralized log management
- Log retention policies

## Scalability Considerations

### Horizontal Scaling
- Stateless application design
- Load balancer configuration
- Database read replicas
- Caching strategies

### Vertical Scaling
- Resource optimization
- Database performance tuning
- Query optimization
- Index management

## Migration Strategy

### Phase 1: Data Migration
1. Export data from Odoo
2. Transform data to new schema
3. Import to PostgreSQL
4. Validate data integrity

### Phase 2: Feature Parity
1. Implement core features
2. User acceptance testing
3. Performance testing
4. Security audit

### Phase 3: Rollout
1. Pilot with small user group
2. Gradual rollout
3. Full migration
4. Odoo decommission

## Development Guidelines

### Code Standards
- TypeScript strict mode
- ESLint + Prettier
- Conventional commits
- Code review process

### Testing Strategy
- Unit tests (Jest)
- Integration tests
- E2E tests (Playwright)
- Performance tests

### Documentation
- API documentation (OpenAPI)
- Code documentation (JSDoc)
- User documentation
- Deployment guides