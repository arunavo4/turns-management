import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import * as schema from './schema';

// Create the connection pool only if DATABASE_URL exists
// During build time, this might not be available
const getDatabaseConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    // Return a dummy connection during build time
    // This will be replaced with real connection at runtime
    console.warn('DATABASE_URL not found, using placeholder connection');
    return null;
  }
  
  return new Pool({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });
};

const pool = getDatabaseConnection();

// Create the drizzle instance
export const db = pool ? drizzle(pool, { schema }) : null as any;

// Export schema for type inference
export * from './schema';