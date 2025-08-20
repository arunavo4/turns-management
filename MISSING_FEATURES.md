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
- Audit logs backend (API + Service) - **BUT NO UI**
- React Query integration for optimistic updates

⚠️ **Partially Implemented:**
- Audit logging system (backend only, no UI page)

---

## 🔴 Critical Features (Phase 1) - From Odoo

### 1. Approval Workflow System ❌
**Priority: CRITICAL**
- [ ] DFO approval workflow (threshold-based: >$3000)
- [ ] HO approval workflow (higher amounts: >$10000)
- [ ] Approval thresholds configuration
- [ ] Approval timestamps tracking
- [ ] Approval user tracking
- [ ] Rejection reasons wizard
- [ ] Approval status indicators in UI
- [ ] Scope approval states:
  - `dfo_approval_needed`
  - `dfo_approved`
  - `ho_approval_needed`
  - `ho_approved`

**Odoo Implementation Reference:**
- File: `turns_management/models/turns_management.py`
- Lines: 35-36 (Scope_Approval enum)
- Lines: 62-71 (approval fields)

### 2. Email Notification System (Resend) ❌
**Priority: CRITICAL**
- [ ] **Setup Resend integration** (email service provider)
- [ ] Email template management with Resend
- [ ] Automated status change notifications
- [ ] Assignment notifications to vendors
- [ ] Approval request emails (DFO/HO)
- [ ] Turn completion notifications
- [ ] Email logs table
- [ ] Email activity tracking
- [ ] Configurable notification preferences
- [ ] Batch email functionality
- [ ] Email templates with React Email

**Tech Stack:**
- **Email Service**: Resend (https://resend.com)
- **Templates**: React Email for component-based templates
- **Tracking**: Store email logs in database

**Odoo Implementation Reference:**
- File: `data/mail_template_data.xml`
- File: `views/email_log_view.xml`
- Mail activity mixin in models

### 3. Turn Stage Transition Management ❌
**Priority: CRITICAL**
- [ ] Stage-based workflow engine
- [ ] Stage transition validation rules
- [ ] Automatic status updates
- [ ] Stage duration tracking (`_track_duration_field`)
- [ ] Stage sequence enforcement
- [ ] Required fields per stage
- [ ] Stage transition history
- [ ] Visual stage progression indicator
- [ ] Clickable stage transitions

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

### 4. Audit Logs UI & Integration 🔄
**Priority: CRITICAL**
- [x] Backend audit service (`/lib/audit-service.ts`)
- [x] Audit logs API endpoint (`/api/audit-logs`)
- [x] Audit log viewer component (`/components/properties/audit-log-viewer.tsx`)
- [ ] **Integrate audit viewer in property detail pages** (who changed what)
- [ ] **Integrate audit viewer in vendor detail pages**
- [ ] **Integrate audit viewer in turn detail pages**
- [ ] **Central audit logs page** (`/app/audit-logs/page.tsx`)
- [ ] Navigation menu item for audit logs
- [ ] User activity tracking page
- [ ] Admin view for all users' activities
- [ ] Filtering by user, date, action type
- [ ] Export audit logs to CSV/Excel
- [ ] Search functionality
- [ ] Pagination for large datasets
- [ ] Real-time updates with React Query
- [ ] Add audit logging to Vendors API
- [ ] Add audit logging to Turns API

**Current Status:**
- Backend is fully implemented and logging property CRUD operations
- AuditLogViewer component exists but is NOT integrated in property pages
- No dedicated page for viewing audit logs
- No navigation to access audit logs
- Vendors and Turns APIs don't have audit logging yet

**Required Integration:**
1. Each property detail page should show its audit history
2. Admin should see all changes across all properties
3. Users should see changes on properties they manage

---

## 🟡 Important Features (Phase 2) - From Odoo

### 4. Reports & Analytics Module ❌
**Priority: HIGH**
- [ ] Turn completion reports
- [ ] Property performance analytics
- [ ] Vendor performance reports
- [ ] Financial summary reports
- [ ] Turn duration analytics
- [ ] Excel export (XLSX)
- [ ] PDF export
- [ ] Custom date range filters
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
| Phase 1 (Critical) | 4 | 0 | 1 | 3 | 12.5% |
| Phase 2 (Important) | 4 | 0 | 0 | 4 | 0% |
| Phase 3 (Enhancement) | 4 | 0 | 0 | 4 | 0% |
| Phase 4 (Minor) | 5 | 0 | 0 | 5 | 0% |
| **Total** | **17** | **0** | **1** | **16** | **3%** |

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
- **Audit logging only implemented for Properties, missing for Vendors and Turns**

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

1. **Start with Approval Workflow** - Most critical missing feature
2. **Add scope_approval field to turns table** via migration
3. **Create approval UI components** in turn details
4. **Implement email service** for notifications
5. **Add stage transition logic** to kanban board

---

*Last Updated: December 2024*
*Odoo reference path: `/Users/arunavoray/Documents/Development/Decyphr/TurnsManagement/decyphr_turns`*