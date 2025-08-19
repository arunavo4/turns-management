import { ShapeStream, Shape } from '@electric-sql/client';

// Electric SQL configuration
export const ELECTRIC_CONFIG = {
  url: process.env.ELECTRIC_URL || 'https://api.electric-sql.cloud/v1/shape',
  sourceId: process.env.ELECTRIC_SOURCE_ID,
  headers: {
    'Authorization': `Bearer ${process.env.ELECTRIC_SOURCE_SECRET}`
  }
};

// Helper function to create a shape stream
export function createShapeStream(params: {
  table: string;
  where?: string;
  columns?: string[];
}) {
  if (!ELECTRIC_CONFIG.sourceId) {
    console.warn('Electric SQL source ID not configured');
    return null;
  }

  const url = new URL(ELECTRIC_CONFIG.url);
  url.searchParams.set('source_id', ELECTRIC_CONFIG.sourceId);
  url.searchParams.set('table', params.table);
  
  if (params.where) {
    url.searchParams.set('where', params.where);
  }
  
  if (params.columns) {
    url.searchParams.set('columns', params.columns.join(','));
  }

  return new ShapeStream({
    url: url.toString(),
    headers: ELECTRIC_CONFIG.headers
  });
}

// Helper function to create a shape
export async function createShape(params: {
  table: string;
  where?: string;
  columns?: string[];
}) {
  if (!ELECTRIC_CONFIG.sourceId) {
    console.warn('Electric SQL source ID not configured');
    return null;
  }

  const shapeStream = createShapeStream(params);
  if (!shapeStream) return null;

  return new Shape(shapeStream);
}