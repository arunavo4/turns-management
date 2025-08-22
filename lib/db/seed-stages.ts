import { config } from 'dotenv';
config({ path: '.env.local' });

// Re-initialize the database connection after loading env
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { turnStages } from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const db = drizzle(pool, { schema });

async function seedStages() {
  try {
    if (!db) {
      console.error('Database connection not available');
      process.exit(1);
    }

    // Default stages for turn management workflow
    const defaultStages = [
      {
        key: 'draft',
        name: 'Draft',
        sequence: 1,
        color: '#6B7280', // gray
        icon: 'IconFile',
        description: 'Initial turn creation',
        isActive: true,
        isDefault: true,
        isFinal: false,
        requiresApproval: false,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: false,
      },
      {
        key: 'secure_property',
        name: 'Secure Property',
        sequence: 2,
        color: '#EAB308', // yellow
        icon: 'IconLock',
        description: 'Property needs to be secured',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: false,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: true,
      },
      {
        key: 'inspection',
        name: 'Inspection',
        sequence: 3,
        color: '#3B82F6', // blue
        icon: 'IconEye',
        description: 'Property inspection phase',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: false,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: false,
      },
      {
        key: 'scope_review',
        name: 'Scope Review',
        sequence: 4,
        color: '#8B5CF6', // purple
        icon: 'IconClipboardList',
        description: 'Review scope of work',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: true,
        requiresVendor: false,
        requiresAmount: true,
        requiresLockBox: false,
      },
      {
        key: 'vendor_assigned',
        name: 'Vendor Assigned',
        sequence: 5,
        color: '#6366F1', // indigo
        icon: 'IconUsers',
        description: 'Vendor has been assigned',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: false,
        requiresVendor: true,
        requiresAmount: false,
        requiresLockBox: false,
      },
      {
        key: 'in_progress',
        name: 'In Progress',
        sequence: 6,
        color: '#F97316', // orange
        icon: 'IconRefresh',
        description: 'Turn work in progress',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: false,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: false,
      },
      {
        key: 'change_order',
        name: 'Change Order',
        sequence: 7,
        color: '#F59E0B', // amber
        icon: 'IconExclamationTriangle',
        description: 'Change order required',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: true,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: false,
      },
      {
        key: 'turns_complete',
        name: 'Turns Complete',
        sequence: 8,
        color: '#10B981', // green
        icon: 'IconCircleCheck',
        description: 'Turn work completed',
        isActive: true,
        isDefault: false,
        isFinal: true,
        requiresApproval: false,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: false,
      },
      {
        key: 'scan_360',
        name: '360 Scan',
        sequence: 9,
        color: '#14B8A6', // teal
        icon: 'IconCamera',
        description: '360 degree scan completed',
        isActive: true,
        isDefault: false,
        isFinal: false,
        requiresApproval: false,
        requiresVendor: false,
        requiresAmount: false,
        requiresLockBox: false,
      },
    ];

    // Check if stages already exist
    const existingStages = await db.select().from(turnStages);
    
    if (existingStages.length === 0) {
      console.log('🌱 Seeding turn stages...');
      
      for (const stage of defaultStages) {
        await db.insert(turnStages).values(stage);
        console.log(`✅ Created stage: ${stage.name}`);
      }
      
      console.log('✨ Turn stages seeded successfully!');
    } else {
      console.log('📋 Turn stages already exist, skipping seed.');
    }
  } catch (error) {
    console.error('❌ Error seeding turn stages:', error);
    process.exit(1);
  }
}

// Run seed if this file is executed directly
if (require.main === module) {
  seedStages().then(() => {
    pool.end();
    process.exit(0);
  }).catch((error) => {
    console.error(error);
    pool.end();
    process.exit(1);
  });
}

export { seedStages };