// API functions for vendors

export interface Vendor {
  id: string;
  companyName: string;
  contactName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  specialties: string[];
  insuranceExpiry: string;
  rating: string | null;
  isActive: boolean;
  isApproved: boolean;
  averageCost: string | null;
  completedJobs: number;
  onTimeRate: string | null;
  lastJobDate: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// Fetch all vendors
export async function fetchVendors(): Promise<Vendor[]> {
  const response = await fetch("/api/vendors");
  if (!response.ok) {
    throw new Error("Failed to fetch vendors");
  }
  return response.json();
}

// Fetch single vendor
export async function fetchVendor(id: string): Promise<Vendor> {
  const response = await fetch(`/api/vendors/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch vendor");
  }
  return response.json();
}

// Create vendor
export async function createVendor(data: Partial<Vendor>): Promise<Vendor> {
  const response = await fetch("/api/vendors", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to create vendor");
  }
  
  return response.json();
}

// Update vendor
export async function updateVendor({ id, ...data }: Partial<Vendor> & { id: string }): Promise<Vendor> {
  const response = await fetch(`/api/vendors/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to update vendor");
  }
  
  return response.json();
}

// Delete vendor
export async function deleteVendor(id: string): Promise<void> {
  const response = await fetch(`/api/vendors/${id}`, {
    method: "DELETE",
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to delete vendor");
  }
}

// Query keys for React Query
export const vendorKeys = {
  all: ["vendors"] as const,
  lists: () => [...vendorKeys.all, "list"] as const,
  list: (filters?: Record<string, unknown>) => [...vendorKeys.lists(), { filters }] as const,
  details: () => [...vendorKeys.all, "detail"] as const,
  detail: (id: string) => [...vendorKeys.details(), id] as const,
};