"use client";

import { useShape as useElectricShape } from '@electric-sql/react';

// Configuration for Electric SQL
const getElectricConfig = () => ({
  url: process.env.NEXT_PUBLIC_ELECTRIC_URL || 'https://api.electric-sql.cloud/v1/shape',
  headers: {
    'Authorization': `Bearer ${process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_SECRET}`
  }
});

// Hook to sync properties data
export function useProperties(userId?: string) {
  const config = getElectricConfig();
  
  return useElectricShape({
    url: config.url,
    params: {
      source_id: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,
      table: 'properties',
      ...(userId && { where: `property_manager_id = '${userId}' OR senior_property_manager_id = '${userId}'` })
    },
    headers: config.headers
  });
}

// Hook to sync turns data
export function useTurns(propertyId?: string) {
  const config = getElectricConfig();
  
  return useElectricShape({
    url: config.url,
    params: {
      source_id: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,
      table: 'turns',
      ...(propertyId && { where: `property_id = '${propertyId}'` })
    },
    headers: config.headers
  });
}

// Hook to sync vendors data
export function useVendors(isApproved: boolean = true) {
  const config = getElectricConfig();
  
  return useElectricShape({
    url: config.url,
    params: {
      source_id: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,
      table: 'vendors',
      where: `is_approved = ${isApproved}`
    },
    headers: config.headers
  });
}

// Hook to sync turn stages
export function useTurnStages() {
  const config = getElectricConfig();
  
  return useElectricShape({
    url: config.url,
    params: {
      source_id: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,
      table: 'turn_stages',
      where: 'is_active = true'
    },
    headers: config.headers
  });
}

// Hook to sync a specific shape with custom parameters
export function useCustomShape(params: {
  table: string;
  where?: string;
  columns?: string[];
}) {
  const config = getElectricConfig();
  
  return useElectricShape({
    url: config.url,
    params: {
      source_id: process.env.NEXT_PUBLIC_ELECTRIC_SOURCE_ID,
      ...params,
      ...(params.columns && { columns: params.columns.join(',') })
    },
    headers: config.headers
  });
}