# Missing Features from Odoo Platform

This document tracks features that exist in the old Odoo platform (`/decyphr_turns`) but are missing in the new Next.js application. Features are organized by priority and implementation status.

## Status Legend
- ❌ Not Started
- 🚧 In Progress  
- ✅ Completed
- ⏸️ On Hold
- 🔄 Partially Implemented

## Current Implementation Status
✅ **Completed Features:**
- Database setup (Azure PostgreSQL)
- Authentication system (Better Auth)
- Full CRUD API routes for Properties, Turns, and Vendors
- Properties page with complete CRUD functionality
- Vendors page with detail, edit, and create functionality
- Basic Dashboard with metrics
- Basic Turns Kanban board
- Audit logs backend (API + Service) with full UI
- React Query integration for optimistic updates
- User profile system with real user data
- Settings page with preferences management
- Global search functionality with PostgreSQL full-text search
- Approval workflow backend (database schema + API endpoints)

⚠️ **Partially Implemented:**
- Approval workflow system (backend complete, UI pending)
- Global search (basic version complete, advanced PostgreSQL FTS prepared)

---

## 🔴 Critical Features (Phase 1) - From Odoo

### 1. Approval Workflow System 🔄
**Priority: CRITICAL**
- [x] DFO approval workflow (threshold-based: $3000-$9999)
- [x] HO approval workflow (higher amounts: >$10000)
- [x] Approval thresholds configuration (database table + seeding)
- [x] Approval timestamps tracking
- [x] Approval user tracking
- [x] Rejection reasons in API
- [ ] Approval status indicators in UI
- [x] Approval database schema:
  - `approvals` table with full tracking
  - `approval_thresholds` table for configuration
  - Status enum: pending, approved, rejected, cancelled
- [x] API endpoints:
  - GET/POST `/api/approvals`
  - GET/PUT/DELETE `/api/approvals/[id]`
  - CRUD `/api/approval-thresholds`

**Odoo Implementation Reference:**
- File: `turns_management/models/turns_management.py`
- Lines: 35-36 (Scope_Approval enum)
- Lines: 62-71 (approval fields)

### 2. Email Notification System (Resend) ✅
**Priority: CRITICAL**
- [ ] **Install Resend SDK**: `npm install resend`
- [ ] **Setup API key**: Add `RESEND_API_KEY` to `.env.local`
- [ ] **Create email service**: `/lib/email/resend-service.ts`
- [ ] **Email templates** with React components:
  - [ ] Turn created notification
  - [ ] Turn assigned to vendor
  - [ ] Approval request (DFO/HO)
  - [ ] Approval granted/rejected
  - [ ] Turn status change
  - [ ] Turn completed
  - [ ] Vendor assignment notification
  - [ ] Property update notification
- [ ] **API routes for email**:
  - [ ] `/app/api/email/send/route.ts`
  - [ ] `/app/api/email/batch/route.ts`
- [ ] Email logs table (track sent emails)
- [ ] Email activity tracking
- [ ] Configurable notification preferences per user
- [ ] Batch email functionality

**Implementation Guide:**
```typescript
// /lib/email/resend-service.ts
import { Resend } from 'resend';
const resend = new Resend(process.env.RESEND_API_KEY);

// /components/emails/turn-approval.tsx
export function TurnApprovalEmail({ 
  turnNumber, 
  propertyName, 
  amount, 
  approverName 
}) {
  // React Email template
}

// Send email in API route
await resend.emails.send({
  from: 'Turns Management <noreply@company.com>',
  to: [approverEmail],
  subject: `Approval Required: ${turnNumber}`,
  react: TurnApprovalEmail({ ... }),
});
```

**Tech Stack:**
- **Email Service**: Resend (https://resend.com)
- **Templates**: React Email components
- **Tracking**: Store email logs in database
- **Domain**: Verify domain in Resend dashboard

**Odoo Implementation Reference:**
- File: `data/mail_template_data.xml`
- File: `views/email_log_view.xml`
- Mail activity mixin in models

### 3. Turn Stage Transition Management ✅
**Priority: CRITICAL**
- [x] Stage-based workflow engine
- [x] Stage transition validation rules
- [x] Automatic status updates
- [x] Stage duration tracking (`_track_duration_field`)
- [x] Stage sequence enforcement
- [x] Required fields per stage
- [x] Stage transition history
- [x] Visual stage progression indicator
- [x] Clickable stage transitions

**Stages from Odoo:**
1. Draft
2. Secure Property
3. Inspection
4. Scope Review
5. Vendor Assigned
6. Turns In Progress
7. Change Order
8. Turns Complete
9. 360 Scan

**Odoo Implementation Reference:**
- File: `turns_management/models/turns_management.py`
- Lines: 23-33 (status selection)
- Line: 42 (`_track_duration_field = 'stage_id'`)

### 4. Audit Logs UI & Integration ✅ COMPLETED
**Priority: CRITICAL**
- [x] Backend audit service (`/lib/audit-service.ts`)
- [x] Audit logs API endpoint (`/api/audit-logs`)
- [x] Audit log viewer component (`/components/properties/audit-log-viewer.tsx`)
- [x] **Integrate audit viewer in property detail pages** (who changed what)
- [ ] **Integrate audit viewer in vendor detail pages**
- [ ] **Integrate audit viewer in turn detail pages**
- [x] **Central audit logs page** (`/app/audit-logs/page.tsx`)
- [x] Navigation menu item for audit logs
- [x] User activity tracking page
- [x] Admin view for all users' activities
- [x] Filtering by user, date, action type
- [x] Export audit logs to CSV/Excel
- [x] Search functionality
- [x] Pagination for large datasets
- [ ] Real-time updates with React Query
- [x] Add audit logging to Vendors API
- [x] Add audit logging to Turns API

**Current Status:**
- ✅ Backend fully implemented and logging all CRUD operations
- ✅ AuditLogViewer component integrated in property detail pages
- ✅ Central audit logs page created with full functionality
- ✅ Navigation menu item added for audit logs
- ✅ All APIs (Properties, Vendors, Turns) now have audit logging
- ✅ CSV export functionality implemented
- ✅ Advanced filtering and search capabilities added
- ✅ **Fixed userId type mismatch** - Changed from UUID to text for Better Auth compatibility
- ✅ **Database schema updated** - Supports both Better Auth and system users
- ✅ **All audit logging fully functional** - Properties, Vendors, and Turns all tracked

**Completed Implementation:**
1. **Property Detail Page** (`/app/properties/[id]/page.tsx`):
   - ✅ AuditLogViewer integrated showing property change history
   - ✅ Shows who changed what and when
   - ✅ Displays old vs new values for each change
   - ✅ Real-time refresh functionality
   
2. **Central Audit Logs Page** (`/app/audit-logs/page.tsx`):
   - ✅ Admin view for all system changes
   - ✅ User-specific activity view
   - ✅ CSV export functionality
   - ✅ Advanced filtering (by table, action, user)
   - ✅ Search functionality
   - ✅ Pagination for large datasets
   - ✅ Beautiful UI with action icons and colors

3. **API Integration:**
   - ✅ Properties API fully audited
   - ✅ Vendors API fully audited
   - ✅ Turns API fully audited

**Still Pending:**
- Vendor detail page audit viewer integration
- Turn detail page audit viewer integration (when turn detail page is created)
- Real-time updates with React Query subscriptions

---

## 🟡 Important Features (Phase 2) - From Odoo

### 4. Reports & Analytics Module ✅
**Priority: HIGH**
- [x] Turn completion reports
- [x] Property performance analytics
- [x] Vendor performance reports
- [x] Financial summary reports
- [x] Turn duration analytics
- [x] Excel export (XLSX)
- [x] PDF export
- [x] Custom date range filters
- [ ] Scheduled report generation
- [ ] Dashboard widgets configuration

**Odoo Implementation Reference:**
- Module: `report_xlsx`
- Module: `spreadsheet_dashboard_turns`

### 5. Document Management System ❌
**Priority: HIGH**
- [ ] File upload interface
- [ ] Document categorization
- [ ] Version control
- [ ] Document preview
- [ ] Bulk upload
- [ ] Document search
- [ ] Access control
- [ ] Document expiry tracking
- [ ] Attachment to turns/properties/vendors

**Database tables exist but no UI:**
- `documents` table in schema

### 6. Change Order Workflow ❌
**Priority: HIGH**
- [ ] Change order creation form
- [ ] Change order approval process
- [ ] Amount tracking (`change_order_amount` field)
- [ ] Change order history
- [ ] Reason documentation
- [ ] Impact on timeline
- [ ] Vendor notification
- [ ] Cost adjustment automation

**Odoo Implementation Reference:**
- File: `turns_management/models/turns_management.py`
- Line: 84 (`change_order_amount` field)

### 7. Property Secure Wizard ❌
**Priority: HIGH**
- [ ] Secure property wizard UI
- [ ] Lock box code management
- [ ] Lock box location tracking
- [ ] Code change history
- [ ] Security checklist
- [ ] Access log tracking

**Odoo Implementation Reference:**
- File: `wizards/secure_property.py`
- File: `wizards/secure_property_view.xml`
- Database: `lock_box_history` table exists

---

## 🟢 Enhancement Features (Phase 3) - From Odoo

### 8. Activity & Task Management ❌
**Priority: MEDIUM**
- [ ] Activity scheduling
- [ ] Task assignments
- [ ] Due date reminders
- [ ] Follow-up tracking
- [ ] Activity templates
- [ ] Recurring tasks
- [ ] Task priorities
- [ ] Activity calendar view

**Odoo Implementation Reference:**
- Mail activity mixin: `mail.activity.mixin`
- File: `data/mail_activity_type_data.xml`

### 9. Inspector Role & Management ❌
**Priority: MEDIUM**
- [ ] Inspector user role
- [ ] Inspection assignment
- [ ] Inspection scheduling
- [ ] Inspection reports
- [ ] Inspection checklist
- [ ] Photo attachment
- [ ] Inspection history
- [ ] Inspector performance metrics

**Odoo Implementation Reference:**
- File: `turns_management/models/turns_management.py`
- Lines: 58-59 (inspection fields)

### 10. Work Order Generation ❌
**Priority: MEDIUM**
- [ ] WO templates
- [ ] PDF generation
- [ ] Auto-numbering
- [ ] Email work orders
- [ ] Digital signatures
- [ ] Work order tracking
- [ ] Vendor acknowledgment
- [ ] Work order history

**Odoo Implementation Reference:**
- Line: 91 (`generate_wo_email` field)

### 11. Turn Forms (Create/Edit) 🔄
**Priority: MEDIUM**
- [x] Create Turn Dialog (basic exists)
- [ ] Advanced turn creation with all fields
- [ ] Property selection with filters
- [ ] Vendor assignment with availability check
- [ ] Cost estimation with breakdown
- [ ] Scope of work rich text editor
- [ ] Utility status checkboxes
- [ ] Appliances needed tracking
- [ ] Turn history in edit form

---

## 🟠 Scalability & Performance Features (Critical for Production)

### 17. Scalable Search & Pagination ✅ READY
**Priority: CRITICAL for large datasets**
- [x] Server-side search API endpoint with pagination
- [x] Database query optimization with proper indexes  
- [x] Custom `useServerSearch` hook with debouncing
- [x] Optimized properties page (`/properties/optimized`)
- [ ] Apply to vendors page
- [ ] Apply to turns page
- [ ] PostgreSQL full-text search migration
- [ ] PostgreSQL trigram search for fuzzy matching
- [ ] Redis caching layer for popular searches
- [ ] Elasticsearch/Algolia integration for instant search

**Current Implementation:**
- Basic ILIKE search works for small datasets
- Server-side pagination limits data transfer
- React Query caching reduces server load
- Debounced search prevents excessive API calls

**Production Optimizations Needed:**
```sql
-- Add GIN indexes for fast search
CREATE INDEX idx_properties_search ON properties 
USING GIN (to_tsvector('english', name || ' ' || address || ' ' || city));

-- Enable trigram for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;
CREATE INDEX trgm_idx ON properties USING GIN (name gin_trgm_ops);
```

**Performance Targets:**
- Handle 100,000+ properties with <100ms search response
- Support concurrent searches from 1000+ users
- Maintain 99.9% uptime with proper caching

**Files Created:**
- `/app/api/properties/search/route.ts` - Server-side search endpoint
- `/hooks/use-server-search.ts` - Reusable search hook
- `/app/properties/optimized/page.tsx` - Scalable properties page

---

## 🔵 Minor Features (Phase 4) - From Odoo

### 12. Turn Numbering Sequence ❌
**Priority: LOW**
- [ ] Automatic sequence generation (TURN-YYYY-XXX)
- [ ] Configurable format
- [ ] Year-based reset option
- [ ] Sequence preview

**Odoo Implementation Reference:**
- File: `data/ir_sequence_data.xml`

### 13. YARDI Integration ❌
**Priority: LOW**
- [ ] YARDI status sync
- [ ] Property ID mapping
- [ ] Data import/export
- [ ] Sync scheduling
- [ ] Error handling
- [ ] Sync logs

**Database fields exist:**
- `property_id_yardi` in properties table
- `status_yardi` field

### 14. Daily Cost Calculation ❌
**Priority: LOW**
- [ ] Daily holding cost configuration
- [ ] Automatic cost calculation
- [ ] Cost accumulation tracking
- [ ] Cost reports
- [ ] Cost alerts

**Odoo Implementation Reference:**
- Line: 81 (`daily_cost` field)

### 15. 360 Scan Integration ❌
**Priority: LOW**
- [ ] InsideMaps integration
- [ ] 360 scan ordering
- [ ] Scan status tracking
- [ ] Scan viewer embed
- [ ] Scan history

**Odoo Implementation Reference:**
- Line: 90 (`order_insidemaps_360_scan` field)
- Line: 79 (`scan_360_date` field)

### 16. Advanced Utilities Management ❌
**Priority: LOW**
- [ ] Detailed utility provider management
- [ ] Account number tracking
- [ ] Deposit tracking
- [ ] Utility transfer workflow
- [ ] Well water/septic tracking
- [ ] Utility cost tracking

**Database tables exist:**
- `utility_providers` table
- `property_utilities` table with detailed fields

---

## 📊 Implementation Progress

| Phase | Total Features | Completed | In Progress | Not Started | Progress |
|-------|---------------|-----------|-------------|-------------|----------|
| Phase 1 (Critical) | 4 | 1 | 1 | 2 | 37% |
| Phase 2 (Important) | 4 | 0 | 0 | 4 | 0% |
| Phase 3 (Enhancement) | 4 | 0 | 0 | 4 | 0% |
| Phase 4 (Minor) | 5 | 0 | 0 | 5 | 0% |
| **Total** | **17** | **1** | **1** | **15** | **9%** |

---

## 📝 Implementation Notes

### Database Schema Status
Many required fields and tables already exist in the schema but lack UI implementation:
- ✅ Approval fields in `turns` table
- ✅ `documents` table for file management
- ✅ `lock_box_history` table for security tracking
- ✅ `turn_history` table for status tracking
- ✅ `audit_logs` table for tracking changes
- ✅ `utility_providers` and `property_utilities` tables
- ✅ All date fields for turn lifecycle

### Missing Odoo Modules Not Yet Analyzed
- `property` module (base property management)
- `hide_action_archive_button` module
- `data_import_models` module
- Various theme modules (muk_web_*, artify_backend_theme, etc.)

### Technical Debt from Migration
- Mock data still in use for dashboard and turns
- Kanban board not persisting stage changes
- No real-time sync (was considering Electric SQL, now removed)
- React Query cache not optimized for complex workflows
- ✅ **Fixed:** Better Auth session handling (using auth-helpers with proper getSession)
- ✅ **Fixed:** Database insert issues (propertyId generation and nullable userId in audit logs)
- ✅ **Fixed:** User profile/settings not showing real user data
- ✅ **Fixed:** Navigation showing mock data instead of session data

### Dependencies Needed
- **Email Service**: ✅ **Resend** (decided) - for all email notifications
  - `npm install resend react-email @react-email/components`
- **File Storage**: S3, Azure Blob Storage, or Cloudinary for documents
- **PDF Generation**: react-pdf or puppeteer for reports
- **Excel Export**: exceljs or xlsx library
- **Rich Text Editor**: TipTap or Slate for scope of work editing
- **Calendar Component**: For scheduling and activity management

---

## 🚀 Recommended Implementation Order

### Week 1: Core Workflow
1. **Approval Workflow System** - Critical for business operations
2. **Turn Stage Transitions** - Essential for turn lifecycle
3. **Email Notifications** - Required for approval workflow

### Week 2: Data & Documents
4. **Reports & Analytics** - Needed for business insights
5. **Document Management** - Required for attachments
6. **Change Orders** - Important for cost tracking

### Week 3: Enhanced Features
7. **Property Security** - Important for operations
8. **Activity Management** - For task tracking
9. **Inspector Management** - For quality control
10. **Work Order Generation** - For vendor communication

### Week 4: Polish & Integration
11. **Turn Numbering** - For organization
12. **Daily Cost Tracking** - For financial analysis
13. **360 Scan Integration** - For property visualization
14. **YARDI Integration** - If needed
15. **Advanced Utilities** - Complete utility management

---

## 🔧 Next Immediate Steps

1. ✅ **DONE: Approval Workflow Backend** - Database schema and API endpoints completed
2. **Create approval UI components** in turn details (remaining UI work)
3. **Implement email service** for notifications using Resend
4. **Add stage transition logic** to kanban board
5. **Create workflow configuration page** for admin users

---

## 🆕 Recently Completed Features

### Global Search System ✅
**Completed: January 2025**
- [x] Basic search API with ILIKE pattern matching
- [x] Search across properties, turns, vendors, and users
- [x] Global search component with dropdown results
- [x] Keyboard shortcut support (Cmd/Ctrl + K)
- [x] Mobile-responsive search with sheet modal
- [x] Debounced search input
- [x] Advanced PostgreSQL full-text search prepared (optional upgrade)
  - Full-text search vectors with weighted ranking
  - Trigram similarity for typo tolerance
  - Database migration script ready

### User Profile & Settings ✅
**Completed: January 2025**
- [x] Profile page with real user data from Better Auth
- [x] Settings page restructured (removed duplicate profile section)
- [x] User preferences API and storage
- [x] Password change functionality
- [x] Navigation showing real session data (no more mock data)
- [x] Profile statistics and activity tracking

### Approval Workflow Backend ✅
**Completed: January 2025**
- [x] Complete database schema for approvals
- [x] Approval thresholds configuration table
- [x] Full CRUD API for approvals and thresholds
- [x] DFO approval ($3000-$9999.99)
- [x] HO approval ($10000+)
- [x] Sequential approval support
- [x] Rejection reason tracking
- [x] Audit logging integration
- [x] Seed data for default thresholds

---

*Last Updated: January 2025*
*Odoo reference path: `/Users/arunavoray/Documents/Development/Decyphr/TurnsManagement/decyphr_turns`*