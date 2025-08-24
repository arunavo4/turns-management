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
- Reports & Analytics Module (4 report types with charts)
- Password change functionality
- Turn stage transition management

⚠️ **Partially Implemented:**
- Approval workflow system (backend complete, UI pending)
- Email notifications (basic setup, templates pending)

---

## 🔴 Critical Features (Phase 1) - From Odoo

### 1. Utility Management Module ❌
**Priority: CRITICAL**
**Status: NOT STARTED**

Complete utility bill management system from `property_utility_bill` module:

- [ ] **Utility Bills CRUD**
  - [ ] Create/Read/Update/Delete utility bills
  - [ ] Support for: Power, Gas, Water, Sewer, Trash
  - [ ] Bill attachment management (PDF uploads)
  - [ ] Due date tracking and alerts
  
- [ ] **Utility Providers Management**
  - [ ] Provider database with contact info
  - [ ] Account number tracking per property
  - [ ] Service type configuration
  
- [ ] **Payment Processing**
  - [ ] Manual card payment recording
  - [ ] Bank payment integration
  - [ ] Payment confirmation tracking
  - [ ] Card last 4 digits storage
  - [ ] Confirmation number management
  
- [ ] **Financial Tracking**
  - [ ] Current charges
  - [ ] Late fees
  - [ ] Establish/Reconnect fees
  - [ ] Deposits and credits
  - [ ] Past due amounts
  - [ ] Total billing calculation
  
- [ ] **Reporting & Documents**
  - [ ] PDF receipt generation
  - [ ] Bank payment reports
  - [ ] Manual payment reports
  - [ ] Email receipts
  
- [ ] **Automated Features**
  - [ ] PDF import for utility bills
  - [ ] OneDrive sync for documents
  - [ ] Cron jobs for due date reminders

**Odoo Implementation Reference:**
- Module: `property_utility_bill`
- Module: `utility_management`
- Module: `utility_pdf_import`
- Module: `utility_onedrive_sync`

### 2. Lock Box Management System ❌
**Priority: CRITICAL**
**Status: NOT STARTED**

Complete lock box tracking from `turns_management` module:

- [ ] **Lock Box Codes**
  - [ ] Primary lock box code field
  - [ ] Code change history tracking
  - [ ] Previous codes display
  
- [ ] **Physical Tracking**
  - [ ] Lock box location (Front/Back/Left/Right/Other)
  - [ ] Installation date
  - [ ] Lock box images attachment
  
- [ ] **History & Audit**
  - [ ] Lock box history table (`lockbox_history`)
  - [ ] Code change timestamps
  - [ ] User who changed code
  
- [ ] **Security Features**
  - [ ] Edit permissions control
  - [ ] Access log tracking
  - [ ] Secure property wizard

**Odoo Implementation Reference:**
- File: `turns_management/models/turns_management.py` (Lines 166-189)
- Table: `lock_box_history` (already in schema)

### 3. Move Out Property Schedule ❌
**Priority: HIGH**
**Status: NOT STARTED**

Move out scheduling from `move_out_prt_schedule` module:

- [ ] **Scheduling System**
  - [ ] Move out date scheduling
  - [ ] Property schedule views
  - [ ] Calendar integration
  
- [ ] **Move Out Workflow**
  - [ ] Link to turns management
  - [ ] Automatic turn creation
  - [ ] Status tracking
  
- [ ] **Logging & History**
  - [ ] Move out logs
  - [ ] Activity tracking
  - [ ] Report generation

**Odoo Implementation Reference:**
- Module: `move_out_prt_schedule`
- Module: `utility_management` (includes move out features)

### 4. Document Management & OneDrive Integration ❌
**Priority: CRITICAL**
**Status: NOT STARTED**

Advanced document management from multiple modules:

- [ ] **OneDrive Integration**
  - [ ] OAuth authentication
  - [ ] Automatic sync
  - [ ] Folder structure management
  - [ ] Sync status tracking
  
- [ ] **Document Categories**
  - [ ] Scope Photos
  - [ ] Change Order Photos
  - [ ] 360 Scan Documents
  - [ ] Approved Scopes
  - [ ] Lock Box Images
  - [ ] Utility Bills
  
- [ ] **Document Features**
  - [ ] Multiple file upload
  - [ ] PDF watermarking
  - [ ] Version control
  - [ ] Access control
  - [ ] Document preview
  - [ ] Search within documents

**Odoo Implementation Reference:**
- Module: `onedrive_integration_odoo`
- Module: `turns_onedrive_sync`
- Module: `utility_onedrive_sync`
- Multiple attachment fields in turns_management.py

### 5. Email Management System 🔄
**Priority: CRITICAL**
**Status: PARTIALLY IMPLEMENTED**

- [x] Basic email sending capability
- [ ] **Email Templates**
  - [ ] Turn created notification
  - [ ] Turn assigned to vendor
  - [ ] Approval request (DFO/HO)
  - [ ] Approval granted/rejected
  - [ ] Turn status change
  - [ ] Turn completed
  - [ ] Vendor assignment
  - [ ] Property update
  - [ ] Utility bill due
  - [ ] Move out scheduled
  
- [ ] **Email Logging**
  - [ ] Email log table (`turn_email_log`)
  - [ ] Sent email tracking
  - [ ] Email status monitoring
  - [ ] Failed email retry
  
- [ ] **Work Order Generation**
  - [ ] WO template creation
  - [ ] PDF generation
  - [ ] Email work orders to vendors
  - [ ] WO acknowledgment tracking

**Odoo Implementation Reference:**
- File: `data/mail_template_data.xml`
- Model: `turn_email_log.py`
- Field: `generate_wo_email` (Line 91)

---

## 🟡 Important Features (Phase 2) - From Odoo

### 6. Advanced Reporting & Excel Export 🔄
**Priority: HIGH**
**Status: PARTIALLY IMPLEMENTED**

- [x] Basic reports (Turn, Property, Vendor, Financial)
- [x] Charts and visualizations
- [x] Date range filtering
- [ ] **Excel Export Features**
  - [ ] XLSX report generation
  - [ ] Custom report templates
  - [ ] Scheduled report generation
  - [ ] Email report delivery
  
- [ ] **Vendor Reports**
  - [ ] Performance scoring
  - [ ] Detailed analytics
  - [ ] Comparison reports
  
- [ ] **Spreadsheet Dashboards**
  - [ ] Interactive pivot tables
  - [ ] Custom dashboard creation
  - [ ] Widget configuration

**Odoo Implementation Reference:**
- Module: `report_xlsx`
- Module: `turns_report`
- Module: `spreadsheet_dashboard_turns`

### 7. Inspector Role & Inspection Management ❌
**Priority: HIGH**
**Status: NOT STARTED**

- [ ] **Inspector User Role**
  - [ ] Role creation and permissions
  - [ ] Inspector assignment to turns
  
- [ ] **Inspection Workflow**
  - [ ] Inspection scheduling
  - [ ] Inspection datetime tracking
  - [ ] Inspector assignment
  - [ ] Inspection checklist
  
- [ ] **Inspection Documentation**
  - [ ] Photo attachments
  - [ ] Inspection reports
  - [ ] Scope creation from inspection
  - [ ] Issue tracking

**Odoo Implementation Reference:**
- Fields: `inspection_datetime`, `inspection_user` (Lines 58-59)
- Stage: 'inspection' in workflow

### 8. Vendor Management Extensions ❌
**Priority: HIGH**
**Status: NOT STARTED**

- [ ] **Flooring Vendor Tracking**
  - [ ] Separate flooring vendor field
  - [ ] Flooring-specific workflows
  
- [ ] **Turns Superintendent**
  - [ ] Superintendent assignment
  - [ ] Superintendent dashboard
  - [ ] Work supervision tracking
  
- [ ] **Vendor Performance**
  - [ ] Performance scoring algorithm
  - [ ] Rating system
  - [ ] Performance reports
  - [ ] Vendor comparison

**Odoo Implementation Reference:**
- Field: `assigned_flooring_vendor` (Line 89)
- Field: `assigned_turns_superintendent` (Line 88)

### 9. Financial Management Extensions ❌
**Priority: HIGH**
**Status: NOT STARTED**

- [ ] **Daily Cost Tracking**
  - [ ] Daily holding cost configuration
  - [ ] Automatic accumulation
  - [ ] Cost alerts
  
- [ ] **Advanced Amount Tracking**
  - [ ] Turn amount
  - [ ] Approved turn amount
  - [ ] Change order amount
  - [ ] Total turn amount calculation
  
- [ ] **Budget Management**
  - [ ] Budget vs actual tracking
  - [ ] Cost overrun alerts
  - [ ] Financial approval workflows

**Odoo Implementation Reference:**
- Fields: Lines 81-86 (various amount fields)
- Field: `daily_cost` (Line 81)

---

## 🟢 Enhancement Features (Phase 3) - From Odoo

### 10. Advanced Turn Features ❌
**Priority: MEDIUM**
**Status: NOT STARTED**

- [ ] **Additional Date Tracking**
  - [ ] Punch list date
  - [ ] Scope approved date
  - [ ] Final walk date
  - [ ] Leasing date
  - [ ] Turn assignment date
  
- [ ] **Utility Status Tracking**
  - [ ] Power status (Yes/No + Notes)
  - [ ] Water status (Yes/No + Notes)
  - [ ] Gas status (Yes/No + Notes)
  
- [ ] **Appliance Management**
  - [ ] Appliances needed flag
  - [ ] Appliances ordered tracking
  - [ ] Appliance vendor management
  
- [ ] **360 Scan Integration**
  - [ ] Order InsideMaps/360 scan
  - [ ] Scan date tracking
  - [ ] Scan document storage
  - [ ] Scan viewer integration

**Odoo Implementation Reference:**
- Fields: Lines 74-80, 90-96, 120-127

### 11. Rejection Workflow ❌
**Priority: MEDIUM**
**Status: NOT STARTED**

- [ ] **Rejection Wizard**
  - [ ] Rejection reason capture
  - [ ] Rejection user tracking
  - [ ] Rejection datetime
  - [ ] Rejection text storage
  
- [ ] **Rejection Notifications**
  - [ ] Email templates for rejection
  - [ ] Rejection history tracking
  - [ ] Re-submission workflow

**Odoo Implementation Reference:**
- Wizard: `reject_reason_wizard.py`
- Fields: Lines 69-70, 155

### 12. Activity & Task Management ❌
**Priority: MEDIUM**
**Status: NOT STARTED**

- [ ] **Activity System**
  - [ ] Activity types configuration
  - [ ] Activity scheduling
  - [ ] Due date management
  - [ ] Activity assignment
  
- [ ] **Follow-up Management**
  - [ ] Follow-up scheduling
  - [ ] Reminder system
  - [ ] Activity templates
  - [ ] Recurring activities

**Odoo Implementation Reference:**
- Mixin: `mail.activity.mixin`
- File: `data/mail_activity_type_data.xml`

### 13. Property Extensions ❌
**Priority: MEDIUM**
**Status: NOT STARTED**

- [ ] **Property Grouping**
  - [ ] Core/Non-Core classification
  - [ ] Market assignment
  - [ ] Property type categorization
  
- [ ] **Additional Fields**
  - [ ] Year built selection
  - [ ] Occupancy check date
  - [ ] County tracking
  - [ ] Color coding for visual organization

**Odoo Implementation Reference:**
- Module: `property`
- Various related fields in turns_management.py

---

## 🔵 Minor Features (Phase 4) - From Odoo

### 14. Turn Numbering & Sequences ❌
**Priority: LOW**
**Status: NOT STARTED**

- [ ] Automatic sequence generation
- [ ] Format: TURN-YYYY-XXXXX
- [ ] Configurable sequences
- [ ] Year-based reset

**Odoo Implementation Reference:**
- File: `data/ir_sequence_data.xml`
- Default name: 'New_' (Line 44)

### 15. Color Coding & Visual Indicators ❌
**Priority: LOW**
**Status: NOT STARTED**

- [ ] Color field for turns
- [ ] Property color coding
- [ ] Status-based colors
- [ ] Visual priority indicators

**Odoo Implementation Reference:**
- Fields: `color`, `color1` (Lines 110-111)

### 16. Cron Jobs & Automation ❌
**Priority: LOW**
**Status: NOT STARTED**

- [ ] Scheduled tasks configuration
- [ ] Automated reminders
- [ ] Data sync jobs
- [ ] Cleanup tasks
- [ ] Report generation schedules

**Odoo Implementation Reference:**
- File: `data/ir_cron.xml`

### 17. Multi-Company Support ❌
**Priority: LOW**
**Status: NOT STARTED**

- [ ] Company configuration
- [ ] Company-specific settings
- [ ] Multi-company data isolation
- [ ] Company selection in UI

**Odoo Implementation Reference:**
- Model: `res_company.py`
- Model: `res_config_settings.py`

---

## 📊 Implementation Progress

| Category | Total Features | Completed | In Progress | Not Started | Progress |
|----------|---------------|-----------|-------------|-------------|----------|
| Critical (Phase 1) | 5 | 0 | 1 | 4 | 10% |
| Important (Phase 2) | 4 | 0 | 1 | 3 | 12.5% |
| Enhancement (Phase 3) | 4 | 0 | 0 | 4 | 0% |
| Minor (Phase 4) | 4 | 0 | 0 | 4 | 0% |
| **Total** | **17** | **0** | **2** | **15** | **6%** |

---

## 📝 Technical Implementation Notes

### Database Tables Already Created
These tables exist in our schema but need UI implementation:
- ✅ `utility_providers` - Ready for utility module
- ✅ `property_utilities` - Ready for utility tracking
- ✅ `lock_box_history` - Ready for lock box management
- ✅ `turn_history` - Ready for turn tracking
- ✅ `documents` - Ready for document management
- ✅ `audit_logs` - Fully implemented
- ✅ `approvals` - Backend complete, UI pending
- ✅ `approval_thresholds` - Backend complete

### Missing Database Tables
These need to be created:
- ❌ `move_out_schedule` - For move out management
- ❌ `turn_email_log` - For email tracking
- ❌ `property_utility_bill` - For utility bills
- ❌ `utility_bank_payments` - For payment tracking
- ❌ `mail_activity` - For activity management
- ❌ `work_orders` - For WO generation

### Odoo Modules Analyzed
- ✅ `turns_management` - Main turns module
- ✅ `property_utility_bill` - Utility billing
- ✅ `move_out_prt_schedule` - Move out scheduling
- ✅ `utility_management` - Utility management
- ✅ `turns_report` - Reporting module
- ✅ `onedrive_integration_odoo` - OneDrive sync
- ✅ `report_xlsx` - Excel reports
- ✅ `property` - Property management base

### API Endpoints Needed
- `/api/utilities` - Utility bill CRUD
- `/api/utilities/providers` - Provider management
- `/api/utilities/payments` - Payment processing
- `/api/lockbox` - Lock box management
- `/api/moveout` - Move out scheduling
- `/api/documents/onedrive` - OneDrive sync
- `/api/inspections` - Inspection management
- `/api/activities` - Activity tracking
- `/api/workorders` - Work order generation

---

## 🚀 Recommended Implementation Order

### Sprint 1 (Week 1-2): Utility Management
1. Create utility bill tables and schema
2. Build utility provider management
3. Implement bill CRUD operations
4. Add payment processing
5. Create utility reports

### Sprint 2 (Week 3-4): Document Management
1. Implement OneDrive OAuth
2. Create document upload system
3. Add document categorization
4. Build sync functionality
5. Add document search

### Sprint 3 (Week 5-6): Lock Box & Security
1. Build lock box management UI
2. Add code history tracking
3. Create secure property wizard
4. Implement access logs
5. Add lock box reports

### Sprint 4 (Week 7-8): Enhanced Workflows
1. Add move out scheduling
2. Implement inspection management
3. Create rejection wizard
4. Add activity management
5. Build work order generation

---

## 🆕 Recently Completed Features

### Reports & Analytics Module ✅
**Completed: January 2025**
- [x] Turn completion reports with charts
- [x] Property performance analytics
- [x] Vendor performance reports
- [x] Financial summary reports
- [x] React Query integration
- [x] Date range filtering
- [x] Export to Excel/PDF buttons (UI ready)

### Password Change Functionality ✅
**Completed: January 2025**
- [x] Password update API endpoint
- [x] Better Auth integration
- [x] Current password validation
- [x] Password strength requirements

### Build Issues Fixed ✅
**Completed: January 2025**
- [x] TypeScript errors resolved
- [x] Dynamic import warnings fixed
- [x] Enum value mismatches corrected
- [x] PostgreSQL query errors fixed
- [x] Timestamp casting issues resolved

---

## 🔧 Next Immediate Steps

1. **Implement Utility Management Module**
   - Most requested feature from Odoo
   - Critical for property operations
   - Database tables already exist

2. **Add OneDrive Integration**
   - Document sync is essential
   - Multiple modules depend on this

3. **Build Lock Box Management**
   - Security is critical
   - History tracking needed

4. **Complete Email Templates**
   - Approval notifications
   - Status change alerts
   - Work order emails

5. **Add Excel Export to Reports**
   - Already have the UI buttons
   - Just need to implement the export logic

---

*Last Updated: January 2025*
*Odoo reference path: `/Users/arunavoray/Documents/Development/Decyphr/TurnsManagement/decyphr_turns`*
*Next.js app path: `/Users/arunavoray/Documents/Development/Decyphr/TurnsManagement/turns-management`*