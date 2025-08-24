// API functions for properties

export interface Property {
  id: string;
  propertyId?: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  county?: string;
  type: string;
  status: string;
  bedrooms: number;
  bathrooms: number | string;
  squareFeet: number;
  yearBuilt?: number;
  monthlyRent: string;
  market?: string;
  owner?: string;
  propertyManagerId?: string;
  seniorPropertyManagerId?: string;
  renovationTechnicianId?: string;
  propertyUpdatorId?: string;
  statusYardi?: string;
  isCore: boolean;
  inDisposition?: boolean;
  section8?: boolean;
  insurance?: boolean;
  squatters?: boolean;
  ownership?: boolean;
  moveInDate?: string;
  moveOutDate?: string;
  utilities?: {
    power: boolean;
    water: boolean;
    gas: boolean;
  };
  notes?: string;
  color?: number;
  createdAt: string;
  updatedAt: string;
}

// Fetch all properties
export async function fetchProperties(): Promise<Property[]> {
  const response = await fetch("/api/properties");
  if (!response.ok) {
    throw new Error("Failed to fetch properties");
  }
  return response.json();
}

// Fetch single property
export async function fetchProperty(id: string): Promise<Property> {
  const response = await fetch(`/api/properties/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch property");
  }
  return response.json();
}

// Create property
export async function createProperty(data: Partial<Property>): Promise<Property> {
  const response = await fetch("/api/properties", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create property");
  }
  
  return response.json();
}

// Update property
export async function updateProperty({ id, ...data }: Partial<Property> & { id: string }): Promise<Property> {
  const response = await fetch(`/api/properties/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update property");
  }
  
  return response.json();
}

// Delete property
export async function deleteProperty(id: string): Promise<void> {
  const response = await fetch(`/api/properties/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete property");
  }
}

// Query keys for React Query
export const propertyKeys = {
  all: ["properties"] as const,
  lists: () => [...propertyKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...propertyKeys.lists(), { filters }] as const,
  details: () => [...propertyKeys.all, "detail"] as const,
  detail: (id: string) => [...propertyKeys.details(), id] as const,
};