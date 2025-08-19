# Missing Features - Turns Management System

## Overview
This document tracks all missing features that need to be implemented to achieve feature parity with the existing Odoo system and complete the local-first architecture.

## Priority Levels
- 🔴 **Critical**: Core functionality required for MVP
- 🟡 **Important**: Key features for full system operation  
- 🟢 **Nice-to-have**: Enhancements and optimizations

---

## 🔴 Critical Features (Week 1-2)

### 1. Database & Sync Infrastructure
- [ ] **Neon Postgres Setup**
  - Create primary database
  - Configure read replica
  - Set up logical replication
  - Create development branches

- [ ] **Electric SQL Deployment**
  - Deploy Electric service (Fly.io or Docker)
  - Configure shapes and permissions
  - Set up monitoring
  - Test replication pipeline

- [ ] **PGlite Integration**
  - Install and configure PGlite
  - Set up IndexedDB storage
  - Create dual Drizzle schemas (client/server)
  - Implement sync metadata columns

- [ ] **Authentication System**
  - Integrate Better-Auth
  - User login/logout flows
  - Session management
  - Role-based permissions (SUPER_ADMIN, ADMIN, PROPERTY_MANAGER, SR_PROPERTY_MANAGER, VENDOR, DFO_APPROVER, HO_APPROVER)

### 2. Core CRUD Operations

#### Turns Management
- [ ] **Create Turn Form**
  - Property selection
  - Move-out date
  - Initial scope definition
  - Cost estimation
  - Priority setting
  
- [ ] **Edit Turn Form**
  - Update turn details
  - Change status/stage
  - Modify cost estimates
  - Update vendor assignment
  
- [ ] **Turn Workflow Actions**
  - Submit for DFO approval
  - Submit for HO approval
  - Approve/Reject with reasons
  - Complete turn
  - Cancel turn

#### Properties Management
- [ ] **Create Property Form**
  - Property details (address, type, size)
  - Manager assignments (PM and Sr PM)
  - Core/Non-core flag
  - Year built
  - Market designation
  
- [ ] **Edit Property Form**
  - Update property details
  - Change manager assignments
  - Update status

#### Vendors Management
- [ ] **Create Vendor Form**
  - Company information
  - Contact details
  - Specialties
  - Insurance/certification info
  
- [ ] **Edit Vendor Form**
  - Update vendor details
  - Manage certifications
  - Update insurance expiry

---

## 🟡 Important Features (Week 3-4)

### 3. Turn-Specific Features

- [ ] **Work Order (WO) Number Tracking**
  - Auto-generate WO numbers
  - Link to turns
  - Display in turn details

- [ ] **Approval Workflow**
  - DFO approval for amounts < $3000
  - HO approval for amounts >= $3000
  - Rejection reason dialog
  - Approval history tracking

- [ ] **Turn Stages (Full Implementation)**
  Currently have 5 stages, need to consider if we implement all 9 from Odoo:
  - Draft
  - Secure Property
  - Inspection
  - Scope Review
  - Vendor Assigned
  - Turns In Progress
  - Change Order
  - Turns Complete
  - 360 Scan

- [ ] **Vendor Assignment**
  - Assign vendor to turn
  - Track vendor performance
  - View vendor workload
  - Vendor availability status

- [ ] **Document Attachments**
  - Upload documents to turns
  - Support for images, PDFs
  - Document categorization
  - Preview functionality

### 4. Property-Specific Features

- [ ] **Move-Out Scheduling**
  - Schedule move-out dates
  - Link to turn creation
  - Calendar view
  - Notification system

- [ ] **Utility Status Tracking**
  - Power status (Yes/No)
  - Water status (Yes/No)
  - Gas status (Yes/No)
  - Last update timestamps

- [ ] **Property Metrics**
  - Average turn time
  - Turn history
  - Cost analysis
  - Occupancy tracking

### 5. Data Sync & Offline

- [ ] **Shape Definitions**
  ```typescript
  shapes: {
    properties: { where: 'manager_id = $userId' },
    activeTurns: { where: 'is_active = true' },
    vendors: { where: 'is_approved = true' },
    turnStages: { /* reference data */ }
  }
  ```

- [ ] **Optimistic Updates (Pattern 3)**
  - Zustand store for write queue
  - PGlite local writes
  - Background sync to server
  - Conflict resolution

- [ ] **Offline Indicators**
  - Connection status badge
  - Sync progress indicators
  - Pending writes counter
  - Error notifications

---

## 🟢 Nice-to-Have Features (Week 5-6)

### 6. Advanced Turn Features

- [ ] **Change Orders**
  - Create change order
  - Track additional costs
  - Approval workflow
  - Link to original turn

- [ ] **360 Scan Integration**
  - Order InsideMaps/360 scan
  - Track scan status
  - View scan results
  - Link to turn

- [ ] **Appliances Tracking**
  - Appliances needed flag
  - Appliances ordered flag
  - Delivery tracking
  - Installation status

- [ ] **Trash Out Management**
  - Trash out needed flag
  - Schedule trash out
  - Track completion
  - Cost tracking

- [ ] **Email Notifications**
  - Turn approval requests
  - Status updates
  - Vendor assignments
  - Completion notifications

### 7. Reporting & Analytics

- [ ] **Dashboard Enhancements**
  - Turn completion trends
  - Cost analysis charts
  - Vendor performance metrics
  - Property portfolio overview

- [ ] **Custom Reports**
  - Date range selection
  - Filter by property/vendor/status
  - Export to Excel/PDF
  - Scheduled reports

- [ ] **Audit Trail**
  - Turn history tracking
  - Status change log
  - User activity log
  - Document version history

### 8. Utility Management

- [ ] **Utility Bill Tracking**
  - Bill upload
  - Payment tracking
  - Due date reminders
  - Cost allocation

- [ ] **PDF Import**
  - Parse utility bills
  - Auto-extract amounts
  - OCR capabilities
  - Data validation

### 9. Integrations

- [ ] **OneDrive Integration**
  - Document sync
  - Automatic backup
  - Folder structure
  - Permission management

- [ ] **Email Integration**
  - Send from system
  - Track communications
  - Template management
  - Auto-responses

---

## Implementation Roadmap

### Phase 1: Foundation (Current)
✅ UI Framework (Next.js, Tailwind, shadcn/ui)
✅ Basic pages and navigation
✅ Mock data structure
⏳ Fix remaining UI issues

### Phase 2: Database Integration (Next)
- Set up Neon Postgres
- Create Drizzle schemas
- Implement Better-Auth
- Connect to real data

### Phase 3: Local-First Architecture
- Deploy Electric SQL
- Integrate PGlite
- Implement sync patterns
- Add offline capabilities

### Phase 4: Feature Completion
- Complete CRUD operations
- Implement approval workflows
- Add document management
- Build reporting features

### Phase 5: Polish & Optimization
- Performance tuning
- Advanced features
- Integrations
- Testing & QA

---

## Technical Debt

### Current Issues to Fix
- [x] Icon import errors (IconCheckCircle → IconCircleCheck)
- [ ] Form validation with Zod
- [ ] Loading states for async operations
- [ ] Error handling and user feedback
- [ ] Accessibility improvements (ARIA labels, keyboard navigation)
- [ ] Mobile responsiveness optimization

### Architecture Improvements
- [ ] Implement proper TypeScript types for all entities
- [ ] Create reusable form components
- [ ] Set up proper API routes structure
- [ ] Implement proper logging system
- [ ] Add performance monitoring

---

## Notes

### Vendor Module Justification
After reviewing the documentation, vendors ARE part of the planned system:
- Mentioned in PROJECT_PLAN.md (Week 9)
- Included in database schemas
- Required for turn assignments
- Part of the approval workflow
- Essential for work order management

### Simplified vs Full Workflow
Current implementation has 5 stages vs Odoo's 9. Consider:
- Is the simplified workflow sufficient?
- Do we need all intermediate stages?
- Can some stages be combined?
- User feedback needed for decision

### Local-First Priority
The architecture emphasizes local-first with Electric SQL. This should be prioritized over adding features to ensure:
- Instant performance (< 50ms response)
- Full offline capability
- Real-time sync across clients
- Reduced server costs