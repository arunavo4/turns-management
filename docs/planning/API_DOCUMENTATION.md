# Turns Management API Documentation

## Overview

This document outlines the API structure for the Turns Management application, using a combination of REST endpoints and tRPC procedures for type-safe communication.

## Authentication

All API endpoints require authentication except for public endpoints marked with 🌐.

### Authentication Headers
```http
Authorization: Bearer <jwt_token>
X-API-Key: <api_key> (optional for service-to-service)
```

### Authentication Endpoints

#### 🌐 POST `/api/auth/login`
```typescript
// Request
{
  email: string
  password: string
}

// Response
{
  user: {
    id: string
    email: string
    role: UserRole
    firstName: string
    lastName: string
  }
  token: string
  refreshToken: string
  expiresIn: number
}
```

#### 🌐 POST `/api/auth/register`
```typescript
// Request
{
  email: string
  password: string
  firstName: string
  lastName: string
  role?: UserRole // Default: USER
}

// Response
{
  message: string
  userId: string
}
```

#### POST `/api/auth/refresh`
```typescript
// Request
{
  refreshToken: string
}

// Response
{
  token: string
  refreshToken: string
  expiresIn: number
}
```

#### POST `/api/auth/logout`
```typescript
// Response
{
  message: string
}
```

## tRPC Router Structure

### Root Router Configuration
```typescript
export const appRouter = router({
  auth: authRouter,
  property: propertyRouter,
  turn: turnRouter,
  vendor: vendorRouter,
  utility: utilityRouter,
  report: reportRouter,
  user: userRouter,
  notification: notificationRouter,
  document: documentRouter
})

export type AppRouter = typeof appRouter
```

## Property Management API

### tRPC Procedures

#### `property.getAll`
```typescript
// Input
{
  page?: number
  limit?: number
  search?: string
  filters?: {
    isActive?: boolean
    isCore?: boolean
    propertyManagerId?: string
    state?: string
    city?: string
  }
  sort?: {
    field: 'name' | 'propertyId' | 'createdAt'
    order: 'asc' | 'desc'
  }
}

// Output
{
  properties: Property[]
  pagination: {
    total: number
    page: number
    limit: number
    totalPages: number
  }
}
```

#### `property.getById`
```typescript
// Input
{
  id: string
}

// Output
Property
```

#### `property.create`
```typescript
// Input
{
  propertyId: string
  name: string
  streetAddress: string
  city?: string
  state?: string
  zipCode?: string
  propertyTypeId: string
  yearBuilt?: number
  areaSqft?: number
  bedrooms?: number
  bathrooms?: number
  market?: string
  isCore?: boolean
  propertyManagerId?: string
}

// Output
Property
```

#### `property.update`
```typescript
// Input
{
  id: string
  data: Partial<PropertyUpdateInput>
}

// Output
Property
```

#### `property.delete`
```typescript
// Input
{
  id: string
}

// Output
{
  success: boolean
  message: string
}
```

#### `property.bulkImport`
```typescript
// Input
{
  file: File // CSV or Excel
  mapping: {
    [csvColumn: string]: string // Database field
  }
}

// Output
{
  imported: number
  failed: number
  errors: ImportError[]
}
```

### REST Endpoints

#### GET `/api/properties/export`
Export properties to CSV/Excel
```http
GET /api/properties/export?format=csv&filters[isActive]=true
```

#### GET `/api/properties/:id/summary`
Get property summary with statistics
```typescript
// Response
{
  property: Property
  statistics: {
    totalTurns: number
    activeTurns: number
    averageTurnDuration: number
    totalSpent: number
    upcomingMoveOuts: number
  }
  recentActivity: Activity[]
}
```

## Turn Management API

### tRPC Procedures

#### `turn.getAll`
```typescript
// Input
{
  page?: number
  limit?: number
  filters?: {
    propertyId?: string
    stageId?: string
    vendorId?: string
    dateRange?: {
      start: Date
      end: Date
    }
    approvalStatus?: ApprovalStatus
    isActive?: boolean
  }
}

// Output
{
  turns: Turn[]
  pagination: PaginationInfo
}
```

#### `turn.getKanban`
```typescript
// Input
{
  propertyId?: string
  vendorId?: string
}

// Output
{
  stages: {
    id: string
    name: string
    turns: Turn[]
    count: number
  }[]
}
```

#### `turn.create`
```typescript
// Input
{
  propertyId: string
  moveOutDate?: Date
  notes?: string
  woNumber?: string
}

// Output
Turn
```

#### `turn.updateStage`
```typescript
// Input
{
  turnId: string
  stageId: string
  notes?: string
}

// Output
{
  turn: Turn
  notifications: Notification[]
}
```

#### `turn.approve`
```typescript
// Input
{
  turnId: string
  level: 'DFO' | 'HO'
  amount?: number
  notes?: string
}

// Output
{
  turn: Turn
  nextStage: TurnStage
  notifications: Notification[]
}
```

#### `turn.reject`
```typescript
// Input
{
  turnId: string
  reason: string
  level: 'DFO' | 'HO'
}

// Output
{
  turn: Turn
  notifications: Notification[]
}
```

#### `turn.assignVendor`
```typescript
// Input
{
  turnId: string
  vendorId: string
  amount?: number
  expectedCompletionDate?: Date
}

// Output
Turn
```

#### `turn.uploadDocument`
```typescript
// Input
{
  turnId: string
  documentType: DocumentType
  file: File
  description?: string
}

// Output
{
  document: Document
  turn: Turn
}
```

### Lock Box Management

#### `turn.updateLockBox`
```typescript
// Input
{
  turnId: string
  lockBoxInfo: {
    installDate: Date
    location: LockBoxLocation
    primaryCode: string
    images?: File[]
  }
}

// Output
{
  turn: Turn
  lockBox: LockBox
}
```

## Vendor Management API

### tRPC Procedures

#### `vendor.getAll`
```typescript
// Input
{
  page?: number
  limit?: number
  search?: string
  filters?: {
    isActive?: boolean
    isApproved?: boolean
    minRating?: number
  }
}

// Output
{
  vendors: Vendor[]
  pagination: PaginationInfo
}
```

#### `vendor.getPerformance`
```typescript
// Input
{
  vendorId: string
  dateRange?: {
    start: Date
    end: Date
  }
}

// Output
{
  vendor: Vendor
  metrics: {
    totalJobs: number
    completedJobs: number
    averageCompletionTime: number
    averageRating: number
    totalRevenue: number
    onTimePercentage: number
  }
  recentJobs: Turn[]
}
```

## Utility Management API

### tRPC Procedures

#### `utility.getProviders`
```typescript
// Input
{
  type?: UtilityType
  isActive?: boolean
}

// Output
UtilityProvider[]
```

#### `utility.createBill`
```typescript
// Input
{
  propertyUtilityId: string
  billDate: Date
  dueDate: Date
  amount: number
  usage?: {
    amount: number
    unit: string
  }
}

// Output
UtilityBill
```

#### `utility.recordPayment`
```typescript
// Input
{
  billId: string
  amount: number
  paymentDate: Date
  paymentMethod: string
  reference?: string
}

// Output
{
  bill: UtilityBill
  receipt: PaymentReceipt
}
```

## Reporting API

### tRPC Procedures

#### `report.getTurnSummary`
```typescript
// Input
{
  dateRange: {
    start: Date
    end: Date
  }
  groupBy?: 'property' | 'vendor' | 'stage'
  propertyIds?: string[]
  vendorIds?: string[]
}

// Output
{
  summary: {
    totalTurns: number
    completedTurns: number
    averageDuration: number
    totalCost: number
    averageCost: number
  }
  breakdown: {
    label: string
    value: number
    count: number
  }[]
  trends: {
    date: Date
    value: number
  }[]
}
```

#### `report.getVendorReport`
```typescript
// Input
{
  vendorId?: string
  dateRange: DateRange
  metrics: VendorMetric[]
}

// Output
{
  vendors: VendorPerformance[]
  comparison: {
    average: number
    best: number
    worst: number
  }
}
```

#### `report.generateCustom`
```typescript
// Input
{
  name: string
  type: 'table' | 'chart' | 'pivot'
  dataSource: string
  columns: string[]
  filters: Filter[]
  groupBy?: string[]
  aggregations?: Aggregation[]
}

// Output
{
  reportId: string
  data: any[]
  metadata: ReportMetadata
}
```

### Export Endpoints

#### POST `/api/reports/export`
```typescript
// Request
{
  reportId?: string
  format: 'pdf' | 'excel' | 'csv'
  data?: any[]
  config?: ExportConfig
}

// Response
{
  url: string // Download URL
  expiresAt: Date
}
```

## Notification API

### tRPC Procedures

#### `notification.getUnread`
```typescript
// Input
{
  limit?: number
}

// Output
Notification[]
```

#### `notification.markAsRead`
```typescript
// Input
{
  notificationIds: string[]
}

// Output
{
  updated: number
}
```

### WebSocket Events

#### Connection
```typescript
// Client -> Server
{
  type: 'auth',
  token: string
}

// Server -> Client
{
  type: 'connected',
  userId: string
}
```

#### Real-time Notifications
```typescript
// Server -> Client
{
  type: 'notification',
  data: {
    id: string
    title: string
    message: string
    type: NotificationType
    entityType?: string
    entityId?: string
    actionUrl?: string
  }
}
```

#### Turn Updates
```typescript
// Server -> Client
{
  type: 'turn.updated',
  data: {
    turnId: string
    changes: {
      field: string
      oldValue: any
      newValue: any
    }[]
    updatedBy: string
    timestamp: Date
  }
}
```

## File Upload API

### POST `/api/upload`
```typescript
// Request (multipart/form-data)
{
  file: File
  entityType: 'property' | 'turn' | 'utility'
  entityId: string
  documentType: DocumentType
  description?: string
}

// Response
{
  document: {
    id: string
    fileName: string
    fileUrl: string
    fileSize: number
    mimeType: string
    uploadedAt: Date
  }
}
```

### GET `/api/files/:id`
Get file metadata and download URL
```typescript
// Response
{
  document: Document
  downloadUrl: string
  expiresAt: Date
}
```

## Batch Operations API

### POST `/api/batch/properties`
```typescript
// Request
{
  operation: 'update' | 'delete'
  ids: string[]
  data?: Partial<Property> // For update
}

// Response
{
  success: number
  failed: number
  errors: BatchError[]
}
```

### POST `/api/batch/turns/stage`
```typescript
// Request
{
  turnIds: string[]
  stageId: string
  skipValidation?: boolean
}

// Response
{
  updated: Turn[]
  failed: {
    turnId: string
    reason: string
  }[]
}
```

## Search API

### GET `/api/search`
Global search across entities
```typescript
// Request
GET /api/search?q=searchterm&types=property,turn,vendor&limit=10

// Response
{
  results: {
    type: string
    id: string
    title: string
    description: string
    url: string
    score: number
  }[]
  total: number
  took: number // milliseconds
}
```

## Webhooks

### Webhook Registration
```typescript
POST /api/webhooks
{
  url: string
  events: WebhookEvent[]
  secret?: string
  isActive?: boolean
}
```

### Webhook Events
```typescript
type WebhookEvent =
  | 'turn.created'
  | 'turn.stage_changed'
  | 'turn.approved'
  | 'turn.rejected'
  | 'turn.completed'
  | 'property.created'
  | 'property.updated'
  | 'vendor.assigned'
  | 'document.uploaded'
```

### Webhook Payload
```typescript
{
  id: string
  event: WebhookEvent
  timestamp: Date
  data: {
    entity: any
    changes?: any
    user?: {
      id: string
      email: string
    }
  }
  signature: string // HMAC-SHA256
}
```

## Rate Limiting

All API endpoints are rate limited:

- **Authentication**: 5 requests per minute
- **Read Operations**: 100 requests per minute
- **Write Operations**: 50 requests per minute
- **Batch Operations**: 10 requests per minute
- **File Uploads**: 20 requests per minute

Rate limit headers:
```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1640995200
```

## Error Responses

### Standard Error Format
```typescript
{
  error: {
    code: string
    message: string
    details?: any
    timestamp: Date
    path: string
    requestId: string
  }
}
```

### Error Codes
- `AUTH_REQUIRED`: Authentication required
- `AUTH_INVALID`: Invalid credentials
- `AUTH_EXPIRED`: Token expired
- `PERMISSION_DENIED`: Insufficient permissions
- `NOT_FOUND`: Resource not found
- `VALIDATION_ERROR`: Input validation failed
- `CONFLICT`: Resource conflict
- `RATE_LIMIT`: Rate limit exceeded
- `SERVER_ERROR`: Internal server error

## API Versioning

The API uses URL versioning:
- Current version: `/api/v1`
- Legacy support: Minimum 6 months
- Deprecation notices: Via headers

```http
X-API-Version: 1.0
X-API-Deprecated: true
X-API-Sunset: 2024-12-31
```

## SDK Examples

### TypeScript/JavaScript
```typescript
import { createTRPCClient } from '@trpc/client'
import type { AppRouter } from './server/routers'

const client = createTRPCClient<AppRouter>({
  url: 'https://api.turnsmanagement.com/trpc',
  headers: {
    authorization: `Bearer ${token}`
  }
})

// Usage
const properties = await client.property.getAll.query({
  page: 1,
  limit: 20,
  filters: { isActive: true }
})
```

### Python
```python
import requests

class TurnsManagementAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
    
    def get_properties(self, **filters):
        response = requests.get(
            f'{self.base_url}/api/properties',
            headers=self.headers,
            params=filters
        )
        return response.json()

# Usage
api = TurnsManagementAPI('https://api.turnsmanagement.com', token)
properties = api.get_properties(isActive=True, isCore=True)
```

## Testing Endpoints

### Health Check
```http
GET /api/health

Response:
{
  status: 'healthy',
  timestamp: Date,
  version: string,
  services: {
    database: 'connected',
    redis: 'connected',
    storage: 'connected'
  }
}
```

### API Documentation
```http
GET /api/docs
```
Interactive API documentation using Swagger/OpenAPI