import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import * as schema from './schema';

// Create the connection only if DATABASE_URL exists
// During build time, this might not be available
const getDatabaseConnection = () => {
  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    // Return a dummy connection during build time
    // This will be replaced with real connection at runtime
    console.warn('DATABASE_URL not found, using placeholder connection');
    return null;
  }
  
  return neon(databaseUrl);
};

const sql = getDatabaseConnection();

// Create the drizzle instance
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const db = sql ? drizzle(sql, { schema }) : null as any;

// Export schema for type inference
export * from './schema';