import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { users, properties, vendors, turnStages, turns } from './schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false
  }
});
const db = drizzle(pool, { schema });

async function seed() {
  console.log('🌱 Starting database seed...');

  try {
    // Create test users
    await db.insert(users).values({
      email: 'admin@example.com',
      name: 'Admin User',
      role: 'ADMIN',
      emailVerified: true,
    }).returning();

    const [pmUser] = await db.insert(users).values({
      email: 'pm@example.com',
      name: 'Property Manager',
      role: 'PROPERTY_MANAGER',
      emailVerified: true,
    }).returning();

    console.log('✅ Users created');

    // Create turn stages
    const stages = await db.insert(turnStages).values([
      { name: 'Draft', sequence: 1, description: 'Initial draft stage' },
      { name: 'Secure Property', sequence: 2, description: 'Property secured' },
      { name: 'Inspection', sequence: 3, description: 'Property inspection' },
      { name: 'Scope Review', sequence: 4, description: 'Review scope of work' },
      { name: 'Vendor Assigned', sequence: 5, description: 'Vendor assigned to turn' },
      { name: 'In Progress', sequence: 6, description: 'Turn work in progress' },
      { name: 'Complete', sequence: 7, description: 'Turn completed' },
    ]).returning();

    console.log('✅ Turn stages created');

    // Create properties
    const propertiesData = await db.insert(properties).values([
      {
        name: 'Oakwood Apartments #101',
        address: '123 Oak Street',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        type: 'apartment',
        status: 'active',
        bedrooms: 2,
        bathrooms: '2',
        squareFeet: 1200,
        monthlyRent: '1500',
        propertyManagerId: pmUser.id,
        isCore: true,
      },
      {
        name: 'Pine Grove House',
        address: '456 Pine Avenue',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        type: 'single_family',
        status: 'pending_turn',
        bedrooms: 3,
        bathrooms: '2.5',
        squareFeet: 1800,
        monthlyRent: '2200',
        propertyManagerId: pmUser.id,
        isCore: true,
      },
      {
        name: 'Riverside Condo #205',
        address: '789 River Road',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        type: 'condo',
        status: 'occupied',
        bedrooms: 1,
        bathrooms: '1',
        squareFeet: 750,
        monthlyRent: '1100',
        propertyManagerId: pmUser.id,
        isCore: false,
      },
    ]).returning();

    console.log('✅ Properties created');

    // Create vendors
    const vendorsData = await db.insert(vendors).values([
      {
        companyName: 'Quick Fix Maintenance',
        contactName: 'John Smith',
        email: 'john@quickfix.com',
        phone: '214-555-0100',
        address: '100 Service Lane',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75202',
        specialties: ['plumbing', 'electrical', 'general'],
        isApproved: true,
        isActive: true,
        rating: '4.5',
      },
      {
        companyName: 'Premium Flooring Co',
        contactName: 'Sarah Johnson',
        email: 'sarah@premiumfloor.com',
        phone: '512-555-0200',
        address: '200 Floor Street',
        city: 'Austin',
        state: 'TX',
        zipCode: '78702',
        specialties: ['flooring', 'carpeting'],
        isApproved: true,
        isActive: true,
        rating: '4.8',
      },
      {
        companyName: 'Elite Painting Services',
        contactName: 'Mike Wilson',
        email: 'mike@elitepainting.com',
        phone: '713-555-0300',
        address: '300 Color Way',
        city: 'Houston',
        state: 'TX',
        zipCode: '77002',
        specialties: ['painting', 'drywall'],
        isApproved: true,
        isActive: true,
        rating: '4.2',
      },
    ]).returning();

    console.log('✅ Vendors created');

    // Create turns
    await db.insert(turns).values([
      {
        turnNumber: 'TURN-2024-001',
        propertyId: propertiesData[1].id, // Pine Grove House
        status: 'in_progress',
        priority: 'high',
        stageId: stages[5].id, // In Progress
        moveOutDate: new Date('2024-01-15'),
        turnAssignmentDate: new Date('2024-01-16'),
        turnDueDate: new Date('2024-01-30'),
        vendorId: vendorsData[0].id,
        estimatedCost: '3500',
        scopeOfWork: 'Full paint, carpet replacement, appliance check',
        completionRate: 65,
        powerStatus: true,
        waterStatus: true,
        gasStatus: true,
      },
      {
        turnNumber: 'TURN-2024-002',
        propertyId: propertiesData[0].id, // Oakwood Apartments
        status: 'vendor_assigned',
        priority: 'medium',
        stageId: stages[4].id, // Vendor Assigned
        moveOutDate: new Date('2024-01-20'),
        turnAssignmentDate: new Date('2024-01-21'),
        turnDueDate: new Date('2024-02-05'),
        vendorId: vendorsData[1].id,
        estimatedCost: '2800',
        scopeOfWork: 'Deep clean, minor repairs, touch-up paint',
        completionRate: 30,
        powerStatus: true,
        waterStatus: true,
        gasStatus: false,
      },
    ]);

    console.log('✅ Turns created');
    console.log('🎉 Database seeded successfully!');

  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  } finally {
    // Close the connection pool
    await pool.end();
  }
}

// Run the seed function
seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});