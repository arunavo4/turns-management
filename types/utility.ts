import { Property } from '@/lib/api/properties';

export type UtilityType = 'power' | 'gas' | 'water' | 'sewer' | 'trash' | 'internet' | 'cable';

export type UtilityBillStatus = 'paid' | 'unpaid' | 'overdue' | 'disputed' | 'partial';

export interface UtilityProvider {
  id: string;
  name: string;
  type: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
  website?: string | null;
  isActive: boolean;
  createdAt: number;
}

export interface UtilityBill {
  id: string;
  propertyId: string;
  providerId?: string | null;
  utilityType: UtilityType;
  
  // Billing period
  billingStartDate: number;
  billingEndDate: number;
  dueDate: number;
  
  // Amounts
  currentCharges: number;
  previousBalance: number;
  lateFee: number;
  otherCharges: number;
  totalAmount: number;
  amountPaid: number;
  
  // Status and dates
  status: UtilityBillStatus;
  paidDate?: number | null;
  
  // Additional info
  accountNumber?: string | null;
  meterReading?: string | null;
  usageAmount?: number | null;
  usageUnit?: string | null; // kWh, therms, gallons, etc.
  
  // File attachments
  billDocument?: string | null; // URL or file path
  paymentConfirmation?: string | null; // URL or file path
  
  // Metadata
  notes?: string | null;
  metadata?: Record<string, unknown>;
  
  // Audit fields
  createdAt: number;
  updatedAt: number;
  version: number;
  createdBy?: string | null;
  updatedBy?: string | null;
  
  // Relations (populated when included)
  property?: Property;
  provider?: UtilityProvider;
}

export interface CreateUtilityBillData {
  propertyId: string;
  providerId?: string;
  utilityType: UtilityType;
  billingStartDate: string | number;
  billingEndDate: string | number;
  dueDate: string | number;
  currentCharges: number;
  previousBalance?: number;
  lateFee?: number;
  otherCharges?: number;
  totalAmount: number;
  accountNumber?: string;
  meterReading?: string;
  usageAmount?: number;
  usageUnit?: string;
  notes?: string;
}

export interface UpdateUtilityBillData extends Partial<CreateUtilityBillData> {
  status?: UtilityBillStatus;
  amountPaid?: number;
  paidDate?: string | number;
  billDocument?: string;
  paymentConfirmation?: string;
}

export interface CreateUtilityProviderData {
  name: string;
  type: string;
  contactPhone?: string;
  contactEmail?: string;
  website?: string;
  isActive?: boolean;
}

export interface UpdateUtilityProviderData extends Partial<CreateUtilityProviderData> {}

// Filter and search interfaces
export interface UtilityBillFilters {
  propertyId?: string;
  providerId?: string;
  utilityType?: UtilityType;
  status?: UtilityBillStatus;
  startDate?: string;
  endDate?: string;
  overdue?: boolean;
}

export interface UtilityProviderFilters {
  type?: string;
  isActive?: boolean;
  search?: string;
}

// Statistics interfaces
export interface UtilityStats {
  totalBills: number;
  unpaidBills: number;
  overdueBills: number;
  totalUnpaidAmount: number;
  totalOverdueAmount: number;
  avgMonthlyUtilityCost: number;
}

export type UtilityBillsByType = {
  [key in UtilityType]: {
    count: number;
    totalAmount: number;
    unpaidAmount: number;
  };
};

// API Response types
export interface UtilityBillsResponse {
  bills: UtilityBill[];
  total: number;
  stats?: UtilityStats;
}

export interface UtilityProvidersResponse {
  providers: UtilityProvider[];
  total: number;
}