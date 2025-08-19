# Turns Management - Neon Postgres Database Schema

## Overview
Serverless PostgreSQL database schema for the Turns Management application using Neon, designed for Electric SQL synchronization with logical replication and optimized for local-first architecture.

## Neon Configuration

### Database Setup
```sql
-- Neon automatically handles these, but verify they're enabled:
-- Logical replication (required for Electric)
SHOW wal_level; -- Should be 'logical'

-- Connection pooling (built into Neon)
-- Autoscaling (automatic in Neon)
-- Branching (via Neon CLI/Console)
```

### Connection Strings
```bash
# Direct connection (for migrations)
DATABASE_URL="postgresql://user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/turns_db?sslmode=require"

# Pooled connection (for application)
DATABASE_POOLED_URL="postgresql://user:pass@ep-cool-name-123456-pooler.us-east-2.aws.neon.tech/turns_db?sslmode=require"

# Electric replication URL (with replication role)
ELECTRIC_DATABASE_URL="postgresql://electric_user:pass@ep-cool-name-123456.us-east-2.aws.neon.tech/turns_db?sslmode=require"
```

### Neon Branching Strategy
```bash
# Create development branch
neon branches create --name dev --parent main

# Create feature branch
neon branches create --name feature/turn-workflow --parent dev

# Create test data branch
neon branches create --name test-data --parent main --with-data
```

## Electric SQL Requirements

### 1. Replication User Setup
```sql
-- Create user for Electric replication
CREATE USER electric_replication WITH REPLICATION PASSWORD 'secure_password';

-- Grant necessary permissions
GRANT SELECT ON ALL TABLES IN SCHEMA public TO electric_replication;
GRANT USAGE ON SCHEMA public TO electric_replication;

-- Grant permissions on future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public 
GRANT SELECT ON TABLES TO electric_replication;
```

### 2. Publication for Electric
```sql
-- Create publication for Electric to subscribe to
CREATE PUBLICATION electric_publication FOR ALL TABLES;

-- Or selective publication for specific tables
CREATE PUBLICATION electric_publication FOR TABLE 
  users, properties, turns, turn_stages, vendors, 
  utility_providers, notifications;
```

## Core Schema Design

### Base Table Pattern
All tables follow this pattern for Electric compatibility:

```sql
-- Every table includes these columns
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
version INTEGER NOT NULL DEFAULT 1, -- For optimistic locking
created_by UUID REFERENCES users(id),
updated_by UUID REFERENCES users(id)
```

### 1. Users & Authentication

```sql
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

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  role user_role NOT NULL DEFAULT 'USER',
  is_active BOOLEAN NOT NULL DEFAULT true,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  last_login TIMESTAMPTZ,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id),
  CONSTRAINT valid_email CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}$')
);

-- Indexes for performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);

-- Sessions for auth
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  version INTEGER NOT NULL DEFAULT 1
);

CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_token ON sessions(token);
CREATE INDEX idx_sessions_expires ON sessions(expires_at);
```

### 2. Properties

```sql
-- Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  property_id VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  
  -- Address
  street_address VARCHAR(255) NOT NULL,
  city VARCHAR(100),
  state VARCHAR(50),
  zip_code VARCHAR(20),
  country VARCHAR(100) DEFAULT 'United States',
  county VARCHAR(100),
  
  -- Details
  year_built INTEGER,
  market VARCHAR(100),
  area_sqft INTEGER,
  bedrooms DECIMAL(3,1),
  bathrooms DECIMAL(3,1),
  
  -- Status flags (optimized for filtering)
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_section_8 BOOLEAN NOT NULL DEFAULT false,
  in_disposition BOOLEAN NOT NULL DEFAULT false,
  has_insurance BOOLEAN NOT NULL DEFAULT false,
  has_squatters BOOLEAN NOT NULL DEFAULT false,
  is_core BOOLEAN NOT NULL DEFAULT true,
  ownership_status BOOLEAN NOT NULL DEFAULT false,
  
  -- Assignments
  property_manager_id UUID REFERENCES users(id),
  sr_property_manager_id UUID REFERENCES users(id),
  
  -- Important dates
  move_in_date DATE,
  move_out_date DATE,
  
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for Electric shapes and queries
CREATE INDEX idx_properties_property_id ON properties(property_id);
CREATE INDEX idx_properties_is_active ON properties(is_active);
CREATE INDEX idx_properties_is_core ON properties(is_core);
CREATE INDEX idx_properties_manager ON properties(property_manager_id, is_active);
CREATE INDEX idx_properties_sr_manager ON properties(sr_property_manager_id, is_active);
-- Composite index for shape filtering
CREATE INDEX idx_properties_shape_filter ON properties(property_manager_id, sr_property_manager_id, is_active);
```

### 3. Turn Management

```sql
-- Turn stages configuration
CREATE TABLE turn_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  display_order INTEGER UNIQUE NOT NULL,
  color VARCHAR(7) DEFAULT '#000000',
  
  -- Email settings
  send_email_to_users BOOLEAN NOT NULL DEFAULT false,
  send_email_to_vendor BOOLEAN NOT NULL DEFAULT false,
  
  -- Requirements
  is_amount_required BOOLEAN NOT NULL DEFAULT false,
  is_vendor_required BOOLEAN NOT NULL DEFAULT false,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  
  -- Status
  is_complete_stage BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

CREATE INDEX idx_turn_stages_order ON turn_stages(display_order);
CREATE INDEX idx_turn_stages_active ON turn_stages(is_active);

-- Approval status enum
CREATE TYPE approval_status AS ENUM (
  'PENDING',
  'DFO_APPROVAL_NEEDED',
  'DFO_APPROVED', 
  'HO_APPROVAL_NEEDED',
  'HO_APPROVED',
  'REJECTED'
);

-- Utility status enum
CREATE TYPE utility_status AS ENUM ('YES', 'NO', 'PENDING');

-- Turns table
CREATE TABLE turns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  turn_id VARCHAR(50) UNIQUE NOT NULL,
  property_id UUID NOT NULL REFERENCES properties(id),
  stage_id UUID NOT NULL REFERENCES turn_stages(id),
  
  -- Work order
  wo_number VARCHAR(50),
  move_out_date DATE,
  trash_out_needed BOOLEAN NOT NULL DEFAULT false,
  
  -- Financial
  turn_amount DECIMAL(10,2),
  approved_turn_amount DECIMAL(10,2),
  change_order_amount DECIMAL(10,2),
  
  -- Vendor assignment
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
  
  -- Utilities
  power_status utility_status DEFAULT 'PENDING',
  water_status utility_status DEFAULT 'PENDING',
  gas_status utility_status DEFAULT 'PENDING',
  
  -- Approval workflow
  scope_approval_status approval_status DEFAULT 'PENDING',
  dfo_approval_user_id UUID REFERENCES users(id),
  dfo_approval_datetime TIMESTAMPTZ,
  ho_approval_user_id UUID REFERENCES users(id),
  ho_approval_datetime TIMESTAMPTZ,
  reject_user_id UUID REFERENCES users(id),
  reject_datetime TIMESTAMPTZ,
  reject_reason VARCHAR(500),
  
  -- Features
  order_inside_maps BOOLEAN NOT NULL DEFAULT false,
  generate_wo_email BOOLEAN NOT NULL DEFAULT false,
  appliances_needed BOOLEAN NOT NULL DEFAULT false,
  appliances_ordered BOOLEAN NOT NULL DEFAULT false,
  
  -- Links
  scope_photos_link VARCHAR(500),
  
  -- Status
  status VARCHAR(100),
  sub_status VARCHAR(100),
  is_active BOOLEAN NOT NULL DEFAULT true,
  
  -- Lock box
  lock_box_install_date DATE,
  lock_box_location VARCHAR(255),
  primary_lock_box_code VARCHAR(50),
  
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for Electric shapes and performance
CREATE INDEX idx_turns_turn_id ON turns(turn_id);
CREATE INDEX idx_turns_property_id ON turns(property_id);
CREATE INDEX idx_turns_stage_id ON turns(stage_id);
CREATE INDEX idx_turns_vendor_id ON turns(vendor_id);
CREATE INDEX idx_turns_is_active ON turns(is_active);
CREATE INDEX idx_turns_approval_status ON turns(scope_approval_status);
-- Composite index for active turns shape
CREATE INDEX idx_turns_active_shape ON turns(is_active, stage_id) WHERE is_active = true;
```

### 4. Vendors

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
  is_active BOOLEAN NOT NULL DEFAULT true,
  is_approved BOOLEAN NOT NULL DEFAULT false,
  
  -- Ratings
  average_rating DECIMAL(3,2),
  total_jobs INTEGER NOT NULL DEFAULT 0,
  
  -- Metadata
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  created_by UUID REFERENCES users(id),
  updated_by UUID REFERENCES users(id)
);

-- Indexes for vendor shapes
CREATE INDEX idx_vendors_is_active ON vendors(is_active);
CREATE INDEX idx_vendors_is_approved ON vendors(is_approved);
CREATE INDEX idx_vendors_active_approved ON vendors(is_active, is_approved) 
  WHERE is_active = true AND is_approved = true;
CREATE INDEX idx_vendors_company_name ON vendors(company_name);
```

### 5. Audit Logging

```sql
-- Audit action enum
CREATE TYPE audit_action AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'VIEW', 'EXPORT');

-- Audit logs table
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- What was changed
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action audit_action NOT NULL,
  
  -- Who made the change
  user_id UUID NOT NULL REFERENCES users(id),
  user_email VARCHAR(255) NOT NULL,
  user_name VARCHAR(255) NOT NULL,
  user_role VARCHAR(50) NOT NULL,
  
  -- Where and how
  ip_address INET,
  user_agent TEXT,
  session_id UUID,
  
  -- Change details
  old_values JSONB,
  new_values JSONB,
  changed_fields TEXT[],
  
  -- Context
  property_id UUID,
  turn_id UUID,
  vendor_id UUID,
  context VARCHAR(255),
  
  -- Metadata
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for audit queries
CREATE INDEX idx_audit_table_record ON audit_logs(table_name, record_id);
CREATE INDEX idx_audit_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_created_at ON audit_logs(created_at DESC);
CREATE INDEX idx_audit_property_id ON audit_logs(property_id);
CREATE INDEX idx_audit_turn_id ON audit_logs(turn_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
```

## Automatic Timestamps

```sql
-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  NEW.version = OLD.version + 1; -- Increment version for optimistic locking
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turns_updated_at BEFORE UPDATE ON turns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_vendors_updated_at BEFORE UPDATE ON vendors
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_turn_stages_updated_at BEFORE UPDATE ON turn_stages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

## Row-Level Security (RLS)

```sql
-- Enable RLS on sensitive tables
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE turns ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Property access policy
CREATE POLICY property_access ON properties
  FOR ALL
  USING (
    property_manager_id = current_setting('app.current_user_id')::UUID
    OR sr_property_manager_id = current_setting('app.current_user_id')::UUID
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::UUID 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );

-- Turn access policy
CREATE POLICY turn_access ON turns
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM properties p
      WHERE p.id = turns.property_id
      AND (
        p.property_manager_id = current_setting('app.current_user_id')::UUID
        OR p.sr_property_manager_id = current_setting('app.current_user_id')::UUID
      )
    )
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::UUID 
      AND role IN ('SUPER_ADMIN', 'ADMIN', 'DFO_APPROVER', 'HO_APPROVER')
    )
  );

-- Audit logs read-only policy
CREATE POLICY audit_logs_read ON audit_logs
  FOR SELECT
  USING (
    user_id = current_setting('app.current_user_id')::UUID
    OR EXISTS (
      SELECT 1 FROM users 
      WHERE id = current_setting('app.current_user_id')::UUID 
      AND role IN ('SUPER_ADMIN', 'ADMIN')
    )
  );
```

## Performance Optimizations

### 1. Partial Indexes for Common Queries
```sql
-- Active properties by manager
CREATE INDEX idx_properties_active_manager ON properties(property_manager_id) 
  WHERE is_active = true;

-- Active turns needing approval
CREATE INDEX idx_turns_pending_approval ON turns(scope_approval_status, stage_id) 
  WHERE is_active = true AND scope_approval_status IN ('DFO_APPROVAL_NEEDED', 'HO_APPROVAL_NEEDED');

-- Recent audit logs
CREATE INDEX idx_audit_recent ON audit_logs(created_at DESC) 
  WHERE created_at > NOW() - INTERVAL '30 days';
```

### 2. Materialized Views for Reports
```sql
-- Property summary view
CREATE MATERIALIZED VIEW property_summary AS
SELECT 
  p.id,
  p.property_id,
  p.name,
  COUNT(DISTINCT t.id) as total_turns,
  COUNT(DISTINCT t.id) FILTER (WHERE t.is_active = true) as active_turns,
  AVG(t.turn_amount) as avg_turn_cost,
  MAX(t.created_at) as last_turn_date
FROM properties p
LEFT JOIN turns t ON p.id = t.property_id
GROUP BY p.id, p.property_id, p.name;

CREATE UNIQUE INDEX ON property_summary(id);
CREATE INDEX ON property_summary(property_id);

-- Refresh strategy
REFRESH MATERIALIZED VIEW CONCURRENTLY property_summary;
```

## Neon-Specific Features

### 1. Branching for Development
```sql
-- Each branch gets its own schema version
-- Neon handles this automatically via branch creation

-- Test migrations on branch before merging
-- Branch: feature/new-vendor-fields
ALTER TABLE vendors ADD COLUMN service_area JSONB;
ALTER TABLE vendors ADD COLUMN specialties TEXT[];
```

### 2. Point-in-Time Recovery
```sql
-- Neon provides automatic PITR
-- Can restore to any point within retention period
-- No manual backup configuration needed
```

### 3. Connection Pooling
```sql
-- Use pooled connection string for application
-- Direct connection only for migrations
-- Neon handles PgBouncer automatically
```

## Electric Shape Optimization

### 1. Shape-Specific Indexes
```sql
-- Optimize for common Electric shape filters
CREATE INDEX idx_shape_properties ON properties(property_manager_id, sr_property_manager_id, is_active, created_at DESC);
CREATE INDEX idx_shape_turns ON turns(is_active, stage_id, created_at DESC);
CREATE INDEX idx_shape_vendors ON vendors(is_active, is_approved) WHERE is_active = true;
```

### 2. Column Selection Optimization
```sql
-- Create covering indexes for frequently accessed columns
CREATE INDEX idx_properties_covering ON properties(id, property_id, name, is_active) 
  INCLUDE (street_address, city, state);
```

## Monitoring & Maintenance

### 1. Query Performance
```sql
-- Monitor slow queries
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- View slow queries
SELECT 
  query,
  calls,
  mean_exec_time,
  total_exec_time
FROM pg_stat_statements
WHERE mean_exec_time > 100 -- queries taking > 100ms
ORDER BY mean_exec_time DESC;
```

### 2. Table Sizes
```sql
-- Monitor table growth
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

### 3. Index Usage
```sql
-- Find unused indexes
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan
FROM pg_stat_user_indexes
WHERE idx_scan = 0
AND indexname NOT LIKE '%_pkey';
```

## Migration Strategy

### 1. Initial Setup
```bash
# Create production database
neon databases create --name turns_production

# Run migrations
npm run db:migrate:deploy

# Verify Electric replication
psql $DATABASE_URL -c "SELECT * FROM pg_replication_slots;"
```

### 2. Development Workflow
```bash
# Create feature branch
neon branches create --name feature/xyz

# Test migrations
npm run db:migrate:dev

# Merge when ready
neon branches merge feature/xyz --into main
```

### 3. Data Seeding
```sql
-- Seed reference data that rarely changes
INSERT INTO turn_stages (name, display_order, is_active) VALUES
  ('Draft', 1, true),
  ('Scope Approval', 2, true),
  ('In Progress', 3, true),
  ('Final Walk', 4, true),
  ('Complete', 5, true);

-- Seed test data on branch only
-- Use Neon branching to maintain clean production data
```

## Neon Read Replica Configuration

### Overview
Neon read replicas provide horizontal scaling for read-heavy workloads. Electric SQL and reporting services use read replicas to minimize load on the primary database.

### Setting Up Read Replicas

#### 1. Create Read Replica
```bash
# Via Neon CLI
neon compute-endpoints create \
  --project-id <project-id> \
  --type read_replica \
  --region us-east-2

# Or via Neon Console
# Project Settings → Read Replicas → Create
```

#### 2. Connection URLs
```bash
# Primary endpoint (writes)
PRIMARY_URL="postgresql://user:pass@ep-main-123456.us-east-2.aws.neon.tech/turns_db"
PRIMARY_POOLED="postgresql://user:pass@ep-main-123456-pooler.us-east-2.aws.neon.tech/turns_db"

# Read replica endpoint (reads)
REPLICA_URL="postgresql://user:pass@ep-replica-123456.us-east-2.aws.neon.tech/turns_db"
REPLICA_POOLED="postgresql://user:pass@ep-replica-123456-pooler.us-east-2.aws.neon.tech/turns_db"
```

### Service Allocation

#### Services Using Read Replica ✅

| Service | Purpose | Load | Connection Type |
|---------|---------|------|-----------------|
| **Electric SQL** | Shape subscriptions, logical replication | HIGH | Direct (non-pooled) |
| **Reporting** | Analytics, dashboards, aggregations | MEDIUM | Pooled |
| **Exports** | CSV/Excel/PDF generation | LOW | Pooled |
| **Audit Viewer** | Historical log queries | LOW | Pooled |
| **Search** | Full-text search, filtering | MEDIUM | Pooled |

#### Services Using Primary ❌

| Service | Purpose | Reason | Connection Type |
|---------|---------|--------|-----------------|
| **Authentication** | Login, sessions | Writes required | Pooled |
| **Write API** | All mutations | INSERT/UPDATE/DELETE | Pooled |
| **Migrations** | Schema changes | DDL operations | Direct |
| **Transactions** | Multi-table ops | Consistency required | Pooled |
| **Sequences** | ID generation | Write operations | Pooled |

### Electric SQL Configuration

```yaml
# docker-compose.yml
services:
  electric:
    image: electricsql/electric:latest
    environment:
      # Use read replica for Electric
      DATABASE_URL: ${NEON_READ_REPLICA_URL}
      ELECTRIC_WRITE_TO_PG_MODE: "disabled"
      LOGICAL_PUBLISHER_HOST: ${NEON_REPLICA_HOST}
      ELECTRIC_ENABLE_REPLICA_MONITORING: "true"
```

### Application Configuration

```typescript
// src/db/config.ts
export const dbConfig = {
  // Primary for writes
  primary: {
    url: process.env.NEON_DATABASE_POOLED_URL,
    max_connections: 20,
    usage: ['auth', 'writes', 'transactions']
  },
  
  // Read replica for reads
  replica: {
    url: process.env.NEON_READ_REPLICA_URL,
    max_connections: 50, // Can handle more connections
    usage: ['electric', 'reports', 'exports', 'search']
  },
  
  // Direct connection for migrations
  migration: {
    url: process.env.NEON_DATABASE_URL,
    max_connections: 1,
    usage: ['migrations']
  }
}

// Connection router
export function getConnection(operation: string) {
  if (operation.startsWith('write')) return dbConfig.primary
  if (operation.startsWith('read')) return dbConfig.replica
  if (operation === 'migrate') return dbConfig.migration
  return dbConfig.primary // Default to primary for safety
}
```

### Monitoring Read Replica Performance

```sql
-- Check replica lag
SELECT 
  slot_name,
  active,
  pg_size_pretty(pg_current_wal_lsn() - confirmed_flush_lsn) as lag_size,
  EXTRACT(EPOCH FROM (now() - pg_last_xact_replay_timestamp())) as lag_seconds
FROM pg_replication_slots 
WHERE slot_type = 'logical';

-- Monitor connection distribution
SELECT 
  datname,
  usename,
  application_name,
  client_addr,
  state,
  COUNT(*) as connection_count
FROM pg_stat_activity
GROUP BY datname, usename, application_name, client_addr, state
ORDER BY connection_count DESC;

-- Query performance by endpoint
SELECT 
  CASE 
    WHEN client_addr = 'replica_ip' THEN 'Read Replica'
    ELSE 'Primary'
  END as endpoint,
  COUNT(*) as query_count,
  AVG(mean_exec_time) as avg_time_ms
FROM pg_stat_statements
GROUP BY endpoint;
```

### Load Balancing Strategy

```typescript
// src/db/load-balancer.ts
class DatabaseLoadBalancer {
  private replicaHealth = true
  private primaryLoad = 0
  private replicaLoad = 0
  
  async getReadConnection() {
    // Check replica health
    if (!this.replicaHealth) {
      console.warn('Read replica unhealthy, falling back to primary')
      return getPrimaryDb()
    }
    
    // Use replica for reads
    return getReplicaDb()
  }
  
  async monitorHealth() {
    try {
      // Check replica lag
      const lag = await checkReplicaLag()
      this.replicaHealth = lag < 1000 // Less than 1 second
      
      // Check connection counts
      this.primaryLoad = await getConnectionCount('primary')
      this.replicaLoad = await getConnectionCount('replica')
      
      // Alert if imbalanced
      if (this.primaryLoad > this.replicaLoad * 2) {
        console.warn('Primary overloaded, consider scaling')
      }
    } catch (error) {
      this.replicaHealth = false
    }
  }
}
```

### Cost Optimization

```typescript
// Replica usage reduces primary compute costs
const costAnalysis = {
  withoutReplica: {
    primaryCompute: 'Large (4 CPU)', // Handles all load
    monthlyCost: 400,
    maxConnections: 100
  },
  
  withReplica: {
    primaryCompute: 'Small (1 CPU)', // Only writes
    replicaCompute: 'Medium (2 CPU)', // All reads
    monthlyCost: 150 + 200, // Total: 350
    maxConnections: 50 + 100, // Total: 150
    savings: '12.5% cost reduction, 50% more connections'
  }
}
```

### Failover Strategy

```typescript
// Automatic failover if replica fails
export async function executeQuery(query: string) {
  try {
    // Try replica first for reads
    if (isReadQuery(query)) {
      return await replicaDb.execute(query)
    }
  } catch (error) {
    console.error('Replica failed, falling back to primary', error)
    // Fallback to primary
    return await primaryDb.execute(query)
  }
  
  // Writes always go to primary
  return await primaryDb.execute(query)
}
```

### Best Practices

1. **Connection Pooling**: Use pooled connections for application queries
2. **Direct Connections**: Reserve for Electric SQL and migrations only
3. **Monitoring**: Track replica lag and connection distribution
4. **Failover**: Implement automatic fallback to primary
5. **Load Testing**: Verify replica can handle expected read load
6. **Cost Analysis**: Monitor usage to optimize compute sizing