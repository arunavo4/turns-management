# Turns Management - Database Schema Design

## Overview
PostgreSQL database schema for the Turns Management application using Prisma ORM.

## Core Tables

### 1. Users & Authentication

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    phone VARCHAR(20),
    role user_role NOT NULL DEFAULT 'USER',
    is_active BOOLEAN DEFAULT true,
    email_verified BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMP,
    CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- User roles enum
CREATE TYPE user_role AS ENUM (
    'SUPER_ADMIN',
    'ADMIN',
    'PROPERTY_MANAGER',
    'SR_PROPERTY_MANAGER',
    'VENDOR',
    'INSPECTOR',
    'DFO_APPROVER',
    'HO_APPROVER',
    'USER'
);

-- Sessions table for auth
CREATE TABLE sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 2. Properties

```sql
-- Property types
CREATE TABLE property_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties table
CREATE TABLE properties (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    property_type_id UUID REFERENCES property_types(id),
    
    -- Address fields
    street_address VARCHAR(255) NOT NULL,
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    country VARCHAR(100) DEFAULT 'United States',
    county VARCHAR(100),
    
    -- Property details
    year_built INTEGER,
    market VARCHAR(100),
    area_sqft INTEGER,
    bedrooms DECIMAL(3,1),
    bathrooms DECIMAL(3,1),
    
    -- Status fields
    is_active BOOLEAN DEFAULT true,
    is_section_8 BOOLEAN DEFAULT false,
    in_disposition BOOLEAN DEFAULT false,
    has_insurance BOOLEAN DEFAULT false,
    has_squatters BOOLEAN DEFAULT false,
    is_core BOOLEAN DEFAULT true,
    ownership_status BOOLEAN DEFAULT false,
    
    -- Assignments
    property_manager_id UUID REFERENCES users(id),
    sr_property_manager_id UUID REFERENCES users(id),
    
    -- Dates
    move_in_date DATE,
    move_out_date DATE,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    INDEX idx_property_id (property_id),
    INDEX idx_is_active (is_active),
    INDEX idx_is_core (is_core)
);
```

### 3. Turns Management

```sql
-- Turn stages configuration
CREATE TABLE turn_stages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    display_order INTEGER NOT NULL,
    color VARCHAR(7) DEFAULT '#000000',
    
    -- Email settings
    send_email_to_users BOOLEAN DEFAULT false,
    send_email_to_vendor BOOLEAN DEFAULT false,
    
    -- Requirements
    is_amount_required BOOLEAN DEFAULT false,
    is_vendor_required BOOLEAN DEFAULT false,
    requires_approval BOOLEAN DEFAULT false,
    
    -- Status
    is_complete_stage BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(display_order)
);

-- Main turns table
CREATE TABLE turns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turn_id VARCHAR(50) UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    stage_id UUID NOT NULL REFERENCES turn_stages(id),
    
    -- Work order details
    wo_number VARCHAR(50),
    move_out_date DATE,
    trash_out_needed BOOLEAN DEFAULT false,
    
    -- Financial
    turn_amount DECIMAL(10,2),
    approved_turn_amount DECIMAL(10,2),
    change_order_amount DECIMAL(10,2),
    total_turn_amount DECIMAL(10,2) GENERATED ALWAYS AS 
        (COALESCE(turn_amount, 0) + COALESCE(change_order_amount, 0)) STORED,
    
    -- Vendors and assignments
    vendor_id UUID REFERENCES vendors(id),
    turns_superintendent_id UUID REFERENCES users(id),
    flooring_vendor_id UUID REFERENCES vendors(id),
    
    -- Important dates
    expected_completion_date DATE,
    occupancy_check_date DATE,
    scope_approved_date DATE,
    turn_assignment_date DATE,
    final_walk_date DATE,
    sent_to_leasing_date DATE,
    scan_360_date DATE,
    turn_completion_date DATE,
    
    -- Utilities status
    power_status utility_status,
    water_status utility_status,
    gas_status utility_status,
    
    -- Approval workflow
    scope_approval_status approval_status,
    dfo_approval_user_id UUID REFERENCES users(id),
    dfo_approval_datetime TIMESTAMP,
    ho_approval_user_id UUID REFERENCES users(id),
    ho_approval_datetime TIMESTAMP,
    reject_user_id UUID REFERENCES users(id),
    reject_datetime TIMESTAMP,
    reject_reason TEXT,
    
    -- Features
    order_inside_maps BOOLEAN DEFAULT false,
    generate_wo_email BOOLEAN DEFAULT false,
    appliances_needed BOOLEAN DEFAULT false,
    appliances_ordered BOOLEAN DEFAULT false,
    
    -- Links
    scope_photos_link VARCHAR(500),
    
    -- Status
    status VARCHAR(100),
    sub_status VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    
    -- Metadata
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    INDEX idx_turn_id (turn_id),
    INDEX idx_property_id (property_id),
    INDEX idx_stage_id (stage_id),
    INDEX idx_vendor_id (vendor_id),
    INDEX idx_is_active (is_active)
);

-- Approval status enum
CREATE TYPE approval_status AS ENUM (
    'DFO_APPROVAL_NEEDED',
    'DFO_APPROVED',
    'HO_APPROVAL_NEEDED',
    'HO_APPROVED',
    'REJECTED'
);

-- Utility status enum
CREATE TYPE utility_status AS ENUM ('YES', 'NO');
```

### 4. Lock Box Management

```sql
-- Lock box information
CREATE TABLE lock_boxes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turn_id UUID NOT NULL REFERENCES turns(id) ON DELETE CASCADE,
    
    install_date DATE NOT NULL,
    location lock_box_location NOT NULL,
    primary_code VARCHAR(20) NOT NULL,
    previous_codes TEXT[],
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID REFERENCES users(id),
    
    INDEX idx_turn_id (turn_id)
);

-- Lock box location enum
CREATE TYPE lock_box_location AS ENUM (
    'FRONT_SIDE',
    'BACK_SIDE',
    'LEFT_SIDE',
    'RIGHT_SIDE',
    'OTHER'
);

-- Lock box history
CREATE TABLE lock_box_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lock_box_id UUID NOT NULL REFERENCES lock_boxes(id),
    old_code VARCHAR(20),
    new_code VARCHAR(20),
    change_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    changed_by UUID NOT NULL REFERENCES users(id)
);
```

### 5. Documents & Attachments

```sql
-- Document types
CREATE TYPE document_type AS ENUM (
    'APPROVED_SCOPE',
    'SCOPE_PHOTOS',
    'CHANGE_ORDER',
    'CHANGE_ORDER_PHOTOS',
    '360_SCAN',
    'LOCK_BOX_IMAGE',
    'PROPERTY_IMAGE',
    'UTILITY_BILL',
    'OTHER'
);

-- Documents table
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Polymorphic association
    entity_type VARCHAR(50) NOT NULL, -- 'property', 'turn', 'utility_bill'
    entity_id UUID NOT NULL,
    
    document_type document_type NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    file_size INTEGER,
    mime_type VARCHAR(100),
    
    uploaded_by UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_entity (entity_type, entity_id),
    INDEX idx_document_type (document_type)
);
```

### 6. Vendors

```sql
-- Vendors table
CREATE TABLE vendors (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_name VARCHAR(255) NOT NULL,
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(20),
    
    -- Address
    street_address VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(50),
    zip_code VARCHAR(20),
    
    -- Business details
    tax_id VARCHAR(50),
    license_number VARCHAR(100),
    insurance_expiry DATE,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    is_approved BOOLEAN DEFAULT false,
    
    -- Ratings
    average_rating DECIMAL(3,2),
    total_jobs INTEGER DEFAULT 0,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_is_active (is_active),
    INDEX idx_company_name (company_name)
);
```

### 7. Utilities Management

```sql
-- Utility providers
CREATE TABLE utility_providers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    type utility_type NOT NULL,
    code VARCHAR(20) UNIQUE,
    
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    website VARCHAR(255),
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Utility types enum
CREATE TYPE utility_type AS ENUM (
    'WATER',
    'POWER',
    'GAS',
    'SEWER',
    'TRASH',
    'INTERNET'
);

-- Property utilities
CREATE TABLE property_utilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_id UUID NOT NULL REFERENCES properties(id),
    utility_type utility_type NOT NULL,
    provider_id UUID REFERENCES utility_providers(id),
    
    account_number VARCHAR(100),
    is_with_resident BOOLEAN DEFAULT false,
    deposit_amount DECIMAL(10,2),
    
    -- System flags
    has_well_water BOOLEAN DEFAULT false,
    has_septic_tank BOOLEAN DEFAULT false,
    
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(property_id, utility_type),
    INDEX idx_property_id (property_id)
);

-- Utility bills
CREATE TABLE utility_bills (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    property_utility_id UUID NOT NULL REFERENCES property_utilities(id),
    
    bill_date DATE NOT NULL,
    due_date DATE,
    amount DECIMAL(10,2) NOT NULL,
    
    -- Usage details
    usage_amount DECIMAL(10,2),
    usage_unit VARCHAR(20),
    
    -- Payment
    is_paid BOOLEAN DEFAULT false,
    paid_date DATE,
    paid_amount DECIMAL(10,2),
    payment_method VARCHAR(50),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_property_utility_id (property_utility_id),
    INDEX idx_bill_date (bill_date),
    INDEX idx_is_paid (is_paid)
);
```

### 8. Move Out Schedules

```sql
-- Move out schedules
CREATE TABLE move_out_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    schedule_id VARCHAR(50) UNIQUE NOT NULL,
    property_id UUID NOT NULL REFERENCES properties(id),
    
    resident_name VARCHAR(255),
    move_out_date DATE NOT NULL,
    
    -- Inspection details
    inspection_date DATE,
    inspection_time TIME,
    inspector_id UUID REFERENCES users(id),
    
    -- Status
    status move_out_status DEFAULT 'SCHEDULED',
    
    notes TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by UUID REFERENCES users(id),
    
    INDEX idx_property_id (property_id),
    INDEX idx_move_out_date (move_out_date),
    INDEX idx_status (status)
);

-- Move out status enum
CREATE TYPE move_out_status AS ENUM (
    'SCHEDULED',
    'IN_PROGRESS',
    'COMPLETED',
    'CANCELLED'
);
```

### 9. Audit & History

```sql
-- Audit log for tracking changes
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- What was changed
    table_name VARCHAR(100) NOT NULL,
    record_id UUID NOT NULL,
    action audit_action NOT NULL,
    
    -- Change details
    old_values JSONB,
    new_values JSONB,
    changed_fields TEXT[],
    
    -- Who and when
    user_id UUID REFERENCES users(id),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_table_record (table_name, record_id),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Audit action enum
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- Turn stage history
CREATE TABLE turn_stage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    turn_id UUID NOT NULL REFERENCES turns(id),
    
    from_stage_id UUID REFERENCES turn_stages(id),
    to_stage_id UUID NOT NULL REFERENCES turn_stages(id),
    
    duration_minutes INTEGER,
    changed_by UUID REFERENCES users(id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_turn_id (turn_id),
    INDEX idx_changed_at (changed_at)
);
```

### 10. Notifications & Communications

```sql
-- Email templates
CREATE TABLE email_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL UNIQUE,
    subject VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    variables TEXT[], -- List of available variables
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email logs
CREATE TABLE email_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Recipients
    to_email VARCHAR(255) NOT NULL,
    cc_emails TEXT[],
    bcc_emails TEXT[],
    
    -- Content
    subject VARCHAR(255) NOT NULL,
    body TEXT,
    template_id UUID REFERENCES email_templates(id),
    
    -- Context
    entity_type VARCHAR(50),
    entity_id UUID,
    
    -- Status
    status email_status DEFAULT 'PENDING',
    sent_at TIMESTAMP,
    error_message TEXT,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_to_email (to_email),
    INDEX idx_status (status),
    INDEX idx_entity (entity_type, entity_id)
);

-- Email status enum
CREATE TYPE email_status AS ENUM (
    'PENDING',
    'SENT',
    'FAILED',
    'BOUNCED'
);

-- In-app notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    type notification_type DEFAULT 'INFO',
    
    -- Link to related entity
    entity_type VARCHAR(50),
    entity_id UUID,
    action_url VARCHAR(500),
    
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_is_read (is_read),
    INDEX idx_created_at (created_at)
);

-- Notification type enum
CREATE TYPE notification_type AS ENUM (
    'INFO',
    'SUCCESS',
    'WARNING',
    'ERROR',
    'APPROVAL_REQUIRED'
);
```

## Indexes Strategy

```sql
-- Performance indexes
CREATE INDEX idx_properties_search ON properties 
    USING gin(to_tsvector('english', name || ' ' || street_address || ' ' || city));

CREATE INDEX idx_turns_date_range ON turns(move_out_date, expected_completion_date)
    WHERE is_active = true;

CREATE INDEX idx_turns_pending_approval ON turns(scope_approval_status)
    WHERE scope_approval_status IN ('DFO_APPROVAL_NEEDED', 'HO_APPROVAL_NEEDED');

-- Composite indexes for common queries
CREATE INDEX idx_turns_property_stage ON turns(property_id, stage_id)
    WHERE is_active = true;

CREATE INDEX idx_documents_recent ON documents(created_at DESC);
```

## Database Functions & Triggers

```sql
-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turns_updated_at BEFORE UPDATE ON turns
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to calculate turn duration
CREATE OR REPLACE FUNCTION calculate_turn_duration(turn_id UUID)
RETURNS INTEGER AS $$
DECLARE
    duration INTEGER;
BEGIN
    SELECT EXTRACT(DAY FROM (turn_completion_date - move_out_date))
    INTO duration
    FROM turns
    WHERE id = turn_id;
    
    RETURN duration;
END;
$$ LANGUAGE plpgsql;

-- Function to get next turn ID
CREATE OR REPLACE FUNCTION generate_turn_id()
RETURNS VARCHAR AS $$
DECLARE
    next_id VARCHAR;
BEGIN
    SELECT 'TURN' || LPAD(COALESCE(MAX(CAST(SUBSTRING(turn_id FROM 5) AS INTEGER)), 0) + 1::text, 5, '0')
    INTO next_id
    FROM turns;
    
    RETURN next_id;
END;
$$ LANGUAGE plpgsql;
```

## Prisma Schema Example

```prisma
// prisma/schema.prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(uuid())
  email         String    @unique
  passwordHash  String?
  firstName     String?
  lastName      String?
  role          UserRole  @default(USER)
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  // Relations
  sessions      Session[]
  properties    Property[] @relation("PropertyManager")
  turns         Turn[]
  auditLogs     AuditLog[]
}

model Property {
  id            String    @id @default(uuid())
  propertyId    String    @unique
  name          String
  streetAddress String
  city          String?
  state         String?
  zipCode       String?
  
  // Details
  yearBuilt     Int?
  areaSqft      Int?
  bedrooms      Float?
  bathrooms     Float?
  
  // Status
  isActive      Boolean   @default(true)
  isCore        Boolean   @default(true)
  
  // Relations
  propertyManager   User?     @relation("PropertyManager", fields: [propertyManagerId], references: [id])
  propertyManagerId String?
  turns             Turn[]
  documents         Document[]
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([propertyId])
  @@index([isActive])
}

model Turn {
  id            String    @id @default(uuid())
  turnId        String    @unique
  
  property      Property  @relation(fields: [propertyId], references: [id])
  propertyId    String
  
  stage         TurnStage @relation(fields: [stageId], references: [id])
  stageId       String
  
  // Amounts
  turnAmount    Decimal?  @db.Decimal(10, 2)
  changeOrderAmount Decimal? @db.Decimal(10, 2)
  
  // Dates
  moveOutDate   DateTime?
  expectedCompletionDate DateTime?
  completionDate DateTime?
  
  // Status
  isActive      Boolean   @default(true)
  
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  @@index([turnId])
  @@index([propertyId])
  @@index([stageId])
}

enum UserRole {
  SUPER_ADMIN
  ADMIN
  PROPERTY_MANAGER
  SR_PROPERTY_MANAGER
  VENDOR
  USER
}
```

## Migration Strategy

1. **Data Export from Odoo**
   - Export all tables to CSV/JSON
   - Document data transformations needed
   - Map Odoo fields to new schema

2. **Data Transformation**
   - Clean and normalize data
   - Generate UUIDs for all records
   - Convert date formats
   - Validate foreign key relationships

3. **Data Import**
   - Use Prisma migrations for schema
   - Bulk insert with transactions
   - Verify data integrity
   - Create indexes after import

4. **Validation**
   - Row count verification
   - Relationship integrity checks
   - Business logic validation
   - Performance testing