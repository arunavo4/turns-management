import { config } from 'dotenv';
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { approvalThresholds } from './schema';
import path from 'path';

// Load environment variables from .env.local
config({ path: path.resolve(process.cwd(), '.env.local') });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: process.env.DATABASE_URL?.includes('azure') ? { rejectUnauthorized: false } : false
});
const db = drizzle(pool);

async function seedApprovalThresholds() {
  try {
    console.log('🌱 Seeding approval thresholds...');
    
    // Clear existing thresholds
    await db.delete(approvalThresholds);
    
    // Insert default approval thresholds
    await db.insert(approvalThresholds).values([
      {
        name: 'Standard DFO Approval',
        minAmount: '3000',
        maxAmount: '9999.99',
        approvalType: 'dfo',
        requiresSequential: false,
        isActive: true,
      },
      {
        name: 'Standard HO Approval',
        minAmount: '10000',
        maxAmount: null,
        approvalType: 'ho',
        requiresSequential: true, // Requires DFO approval first
        isActive: true,
      },
    ]);
    
    console.log('✅ Approval thresholds seeded successfully');
  } catch (error) {
    console.error('❌ Error seeding approval thresholds:', error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedApprovalThresholds()
    .then(async () => {
      await pool.end();
      process.exit(0);
    })
    .catch(async (err) => {
      console.error(err);
      await pool.end();
      process.exit(1);
    });
}

export { seedApprovalThresholds };