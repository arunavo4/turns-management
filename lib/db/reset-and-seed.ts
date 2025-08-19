import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema';
import { sql } from 'drizzle-orm';
import { users, properties, vendors, turnStages, turns, propertyTypes } from './schema';
import { user } from './auth-schema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL!,
  ssl: {
    rejectUnauthorized: false
  }
});
const db = drizzle(pool, { schema });

async function resetAndSeed() {
  console.log('🌱 Resetting and seeding database...');

  try {
    // Truncate all tables in the correct order (respecting foreign key constraints)
    console.log('📦 Truncating tables...');
    await db.execute(sql`TRUNCATE TABLE turns CASCADE`);
    await db.execute(sql`TRUNCATE TABLE turn_stages CASCADE`);
    await db.execute(sql`TRUNCATE TABLE vendors CASCADE`);
    await db.execute(sql`TRUNCATE TABLE properties CASCADE`);
    await db.execute(sql`TRUNCATE TABLE property_types CASCADE`);
    await db.execute(sql`TRUNCATE TABLE app_users CASCADE`);
    await db.execute(sql`TRUNCATE TABLE account CASCADE`);
    await db.execute(sql`TRUNCATE TABLE session CASCADE`);
    await db.execute(sql`TRUNCATE TABLE verification CASCADE`);
    await db.execute(sql`TRUNCATE TABLE "user" CASCADE`);
    console.log('✅ Tables truncated');

    // Create auth users first
    const [authAdminUser] = await db.insert(user).values({
      id: 'admin-user-id',
      email: 'admin@example.com',
      name: 'Admin User',
      emailVerified: true,
    }).returning();

    const [authPMUser] = await db.insert(user).values({
      id: 'pm-user-id',
      email: 'pm@example.com',
      name: 'Property Manager',
      emailVerified: true,
    }).returning();

    // Create app users linked to auth users
    await db.insert(users).values({
      authUserId: authAdminUser.id,
      role: 'ADMIN',
      active: true,
    }).returning();

    const [pmUser] = await db.insert(users).values({
      authUserId: authPMUser.id,
      role: 'PROPERTY_MANAGER',
      active: true,
    }).returning();

    console.log('✅ Users created');

    // Create property types
    const propertyTypesData = await db.insert(propertyTypes).values([
      { name: 'Single Family', description: 'Single family home' },
      { name: 'Multi Family', description: 'Multi-family dwelling' },
      { name: 'Apartment', description: 'Apartment unit' },
      { name: 'Condo', description: 'Condominium' },
      { name: 'Townhouse', description: 'Townhouse unit' },
      { name: 'Commercial', description: 'Commercial property' },
    ]).returning();

    console.log('✅ Property types created');

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
        propertyId: 'PROP-001',
        name: 'Oakwood Apartments #101',
        address: '123 Oak Street',
        city: 'Dallas',
        state: 'TX',
        zipCode: '75201',
        county: 'Dallas County',
        type: 'apartment',
        propertyTypeId: propertyTypesData[2].id, // Apartment
        status: 'active',
        bedrooms: 2,
        bathrooms: '2',
        squareFeet: 1200,
        yearBuilt: 2015,
        monthlyRent: '1500',
        market: 'Dallas Metro',
        owner: 'Oakwood Holdings LLC',
        propertyManagerId: pmUser.id,
        isCore: true,
        section8: false,
        insurance: true,
        squatters: false,
        ownership: true,
        inDisposition: false,
        color: 7, // Green for core
      },
      {
        propertyId: 'PROP-002',
        name: 'Pine Grove House',
        address: '456 Pine Avenue',
        city: 'Austin',
        state: 'TX',
        zipCode: '78701',
        county: 'Travis County',
        type: 'single_family',
        propertyTypeId: propertyTypesData[0].id, // Single Family
        status: 'pending_turn',
        bedrooms: 3,
        bathrooms: '2.5',
        squareFeet: 1800,
        yearBuilt: 2010,
        monthlyRent: '2200',
        market: 'Austin Metro',
        owner: 'Pine Grove Investments',
        propertyManagerId: pmUser.id,
        isCore: true,
        section8: true,
        insurance: true,
        squatters: false,
        ownership: true,
        inDisposition: false,
        color: 7, // Green for core
      },
      {
        propertyId: 'PROP-003',
        name: 'Riverside Condo #205',
        address: '789 River Road',
        city: 'Houston',
        state: 'TX',
        zipCode: '77001',
        county: 'Harris County',
        type: 'condo',
        propertyTypeId: propertyTypesData[3].id, // Condo
        status: 'occupied',
        bedrooms: 1,
        bathrooms: '1',
        squareFeet: 750,
        yearBuilt: 2018,
        monthlyRent: '1100',
        market: 'Houston Metro',
        owner: 'Riverside Properties',
        propertyManagerId: pmUser.id,
        isCore: false,
        section8: false,
        insurance: true,
        squatters: false,
        ownership: true,
        inDisposition: false,
        color: 11, // Orange for non-core
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
        companyName: 'Pro Painting Services',
        contactName: 'Maria Garcia',
        email: 'maria@propaint.com',
        phone: '512-555-0200',
        address: '200 Color Way',
        city: 'Austin',
        state: 'TX',
        zipCode: '78702',
        specialties: ['painting', 'drywall'],
        isApproved: true,
        isActive: true,
        rating: '4.8',
      },
    ]).returning();

    console.log('✅ Vendors created');

    // Create sample turns
    const turnsData = await db.insert(turns).values([
      {
        turnNumber: 'TURN-2024-001',
        propertyId: propertiesData[0].id,
        stageId: stages[2].id, // Inspection
        priority: 'medium',
        estimatedCost: '5000',
        actualCost: null,
        vendorId: vendorsData[0].id,
        inspectorId: pmUser.id,
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-01-30'),
        actualEndDate: null,
        isActive: true,
      },
      {
        turnNumber: 'TURN-2024-002',
        propertyId: propertiesData[1].id,
        stageId: stages[0].id, // Draft
        priority: 'high',
        estimatedCost: '8000',
        actualCost: null,
        vendorId: null,
        inspectorId: null,
        startDate: new Date('2024-01-20'),
        estimatedEndDate: new Date('2024-02-10'),
        actualEndDate: null,
        isActive: true,
      },
    ]).returning();

    console.log('✅ Turns created');
    
    console.log('✨ Database reset and seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting and seeding database:', error);
    process.exit(1);
  }
}

resetAndSeed();