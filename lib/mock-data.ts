// Mock data for the Turns Management ERP system

export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  propertyType: 'apartment' | 'house' | 'condo' | 'commercial';
  bedrooms?: number;
  bathrooms?: number;
  squareFeet: number;
  propertyManagerId: string;
  propertyManager: string;
  seniorPropertyManagerId?: string;
  seniorPropertyManager?: string;
  status: 'active' | 'maintenance' | 'vacant' | 'sold';
  monthlyRent?: number;
  lastTurnDate?: string;
  nextTurnDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Turn {
  id: string;
  propertyId: string;
  property: Property;
  turnNumber: string;
  status: 'requested' | 'dfo_review' | 'approved' | 'in_progress' | 'completed' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  requestedBy: string;
  assignedVendorId?: string;
  assignedVendor?: Vendor;
  estimatedCost: number;
  actualCost?: number;
  description: string;
  scope: string[];
  scheduledStartDate?: string;
  actualStartDate?: string;
  scheduledEndDate?: string;
  actualEndDate?: string;
  approvalLevel: 'DFO' | 'HO' | 'none';
  approvedBy?: string;
  approvedAt?: string;
  createdAt: string;
  updatedAt: string;
  daysOverdue?: number;
  completionRate?: number;
}

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
  rating: number;
  totalJobs: number;
  completedJobs: number;
  onTimeRate: number;
  averageCost: number;
  isActive: boolean;
  isApproved: boolean;
  certifications: string[];
  insuranceExpiry: string;
  lastJobDate?: string;
  joinedDate: string;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'super_admin' | 'admin' | 'property_manager' | 'sr_property_manager' | 'vendor';
  isActive: boolean;
  createdAt: string;
}

export interface DashboardMetrics {
  activeProperties: number;
  pendingTurns: number;
  activeTurns: number;
  completedTurnsThisMonth: number;
  totalRevenue: number;
  monthlyRevenue: number;
  averageTurnTime: number;
  overdueTurns: number;
  approvalsPending: number;
  activeVendors: number;
  completionRate: number;
  avgCostPerTurn: number;
}

// Mock Properties
export const mockProperties: Property[] = [
  {
    id: '1',
    name: 'Sunset Apartments Unit 204',
    address: '123 Sunset Blvd',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    propertyType: 'apartment',
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1200,
    propertyManagerId: 'pm1',
    propertyManager: 'Sarah Johnson',
    seniorPropertyManagerId: 'spm1',
    seniorPropertyManager: 'Mike Chen',
    status: 'active',
    monthlyRent: 2100,
    lastTurnDate: '2024-01-15',
    createdAt: '2023-06-01T00:00:00Z',
    updatedAt: '2024-01-15T00:00:00Z',
  },
  {
    id: '2',
    name: 'Downtown Loft 5A',
    address: '456 Commerce St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    propertyType: 'condo',
    bedrooms: 1,
    bathrooms: 1,
    squareFeet: 850,
    propertyManagerId: 'pm2',
    propertyManager: 'David Rodriguez',
    status: 'maintenance',
    monthlyRent: 1800,
    lastTurnDate: '2024-01-10',
    nextTurnDate: '2024-02-01',
    createdAt: '2023-05-15T00:00:00Z',
    updatedAt: '2024-01-10T00:00:00Z',
  },
  {
    id: '3',
    name: 'Oak Hill House',
    address: '789 Oak Hill Dr',
    city: 'Austin',
    state: 'TX',
    zipCode: '78735',
    propertyType: 'house',
    bedrooms: 4,
    bathrooms: 3,
    squareFeet: 2400,
    propertyManagerId: 'pm1',
    propertyManager: 'Sarah Johnson',
    seniorPropertyManagerId: 'spm1',
    seniorPropertyManager: 'Mike Chen',
    status: 'vacant',
    monthlyRent: 3200,
    lastTurnDate: '2024-01-12',
    nextTurnDate: '2024-02-15',
    createdAt: '2023-04-01T00:00:00Z',
    updatedAt: '2024-01-12T00:00:00Z',
  },
  {
    id: '4',
    name: 'Central Park Condos 12B',
    address: '321 Park Ave',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    propertyType: 'condo',
    bedrooms: 2,
    bathrooms: 2,
    squareFeet: 1100,
    propertyManagerId: 'pm3',
    propertyManager: 'Lisa Wang',
    status: 'active',
    monthlyRent: 2300,
    createdAt: '2023-07-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '5',
    name: 'South Austin Duplex A',
    address: '654 South First St',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    propertyType: 'house',
    bedrooms: 3,
    bathrooms: 2,
    squareFeet: 1600,
    propertyManagerId: 'pm2',
    propertyManager: 'David Rodriguez',
    status: 'active',
    monthlyRent: 2500,
    createdAt: '2023-08-15T00:00:00Z',
    updatedAt: '2023-12-20T00:00:00Z',
  }
];

// Mock Vendors
export const mockVendors: Vendor[] = [
  {
    id: '1',
    companyName: 'ProPaint Masters',
    contactName: 'John Smith',
    email: 'john@propaintmasters.com',
    phone: '(512) 555-0123',
    address: '100 Industrial Blvd',
    city: 'Austin',
    state: 'TX',
    zipCode: '78701',
    specialties: ['Interior Painting', 'Exterior Painting', 'Drywall Repair'],
    rating: 4.8,
    totalJobs: 245,
    completedJobs: 238,
    onTimeRate: 97,
    averageCost: 1250,
    isActive: true,
    isApproved: true,
    certifications: ['EPA Lead-Safe Certified', 'OSHA 10'],
    insuranceExpiry: '2024-12-31',
    lastJobDate: '2024-01-14',
    joinedDate: '2022-03-15',
  },
  {
    id: '2',
    companyName: 'Austin Flooring Pros',
    contactName: 'Maria Garcia',
    email: 'maria@austinflooringpros.com',
    phone: '(512) 555-0456',
    address: '250 Commerce Way',
    city: 'Austin',
    state: 'TX',
    zipCode: '78702',
    specialties: ['Hardwood Installation', 'Laminate Flooring', 'Carpet Installation', 'Tile Work'],
    rating: 4.6,
    totalJobs: 156,
    completedJobs: 152,
    onTimeRate: 95,
    averageCost: 2100,
    isActive: true,
    isApproved: true,
    certifications: ['NWFA Certified', 'CFI Certified'],
    insuranceExpiry: '2024-06-30',
    lastJobDate: '2024-01-12',
    joinedDate: '2022-01-10',
  },
  {
    id: '3',
    companyName: 'Fix-It Plumbing Solutions',
    contactName: 'Robert Johnson',
    email: 'robert@fixitplumbing.com',
    phone: '(512) 555-0789',
    address: '75 Service Road',
    city: 'Austin',
    state: 'TX',
    zipCode: '78703',
    specialties: ['Emergency Repairs', 'Fixture Installation', 'Pipe Replacement', 'Water Heater Service'],
    rating: 4.9,
    totalJobs: 324,
    completedJobs: 320,
    onTimeRate: 98,
    averageCost: 850,
    isActive: true,
    isApproved: true,
    certifications: ['Licensed Plumber', 'Backflow Prevention Certified'],
    insuranceExpiry: '2024-09-15',
    lastJobDate: '2024-01-16',
    joinedDate: '2021-08-20',
  },
  {
    id: '4',
    companyName: 'Clean Slate Maintenance',
    contactName: 'Jennifer Lee',
    email: 'jennifer@cleanslatemt.com',
    phone: '(512) 555-0321',
    address: '180 Maintenance Ln',
    city: 'Austin',
    state: 'TX',
    zipCode: '78704',
    specialties: ['Deep Cleaning', 'Carpet Cleaning', 'HVAC Cleaning', 'Move-out Cleaning'],
    rating: 4.7,
    totalJobs: 189,
    completedJobs: 185,
    onTimeRate: 96,
    averageCost: 450,
    isActive: true,
    isApproved: true,
    certifications: ['Green Cleaning Certified', 'IICRC Certified'],
    insuranceExpiry: '2024-11-30',
    lastJobDate: '2024-01-13',
    joinedDate: '2022-06-05',
  }
];

// Mock Turns
export const mockTurns: Turn[] = [
  {
    id: '1',
    propertyId: '1',
    property: mockProperties[0],
    turnNumber: 'T-2024-001',
    status: 'in_progress',
    priority: 'high',
    requestedBy: 'Sarah Johnson',
    assignedVendorId: '1',
    assignedVendor: mockVendors[0],
    estimatedCost: 2500,
    actualCost: 2350,
    description: 'Complete apartment turnover - painting, flooring, and deep clean',
    scope: ['Interior Painting', 'Carpet Replacement', 'Deep Cleaning', 'Minor Repairs'],
    scheduledStartDate: '2024-01-15',
    actualStartDate: '2024-01-15',
    scheduledEndDate: '2024-01-18',
    approvalLevel: 'DFO',
    approvedBy: 'Mike Chen',
    approvedAt: '2024-01-14T10:00:00Z',
    createdAt: '2024-01-12T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
    completionRate: 75,
  },
  {
    id: '2',
    propertyId: '2',
    property: mockProperties[1],
    turnNumber: 'T-2024-002',
    status: 'dfo_review',
    priority: 'medium',
    requestedBy: 'David Rodriguez',
    estimatedCost: 1800,
    description: 'Kitchen and bathroom refresh for new tenant',
    scope: ['Bathroom Painting', 'Kitchen Deep Clean', 'Fixture Updates'],
    scheduledStartDate: '2024-01-20',
    scheduledEndDate: '2024-01-22',
    approvalLevel: 'DFO',
    createdAt: '2024-01-14T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
  {
    id: '3',
    propertyId: '3',
    property: mockProperties[2],
    turnNumber: 'T-2024-003',
    status: 'approved',
    priority: 'urgent',
    requestedBy: 'Sarah Johnson',
    assignedVendorId: '2',
    assignedVendor: mockVendors[1],
    estimatedCost: 4200,
    description: 'Full house turnover with flooring replacement',
    scope: ['Hardwood Refinishing', 'Interior Painting', 'Deep Cleaning', 'Landscaping'],
    scheduledStartDate: '2024-01-18',
    scheduledEndDate: '2024-01-25',
    approvalLevel: 'HO',
    approvedBy: 'Mike Chen',
    approvedAt: '2024-01-16T14:00:00Z',
    createdAt: '2024-01-13T00:00:00Z',
    updatedAt: '2024-01-16T14:00:00Z',
  },
  {
    id: '4',
    propertyId: '4',
    property: mockProperties[3],
    turnNumber: 'T-2024-004',
    status: 'requested',
    priority: 'low',
    requestedBy: 'Lisa Wang',
    estimatedCost: 950,
    description: 'Basic turnover with touch-up painting',
    scope: ['Touch-up Painting', 'Deep Cleaning', 'Carpet Steam Clean'],
    scheduledStartDate: '2024-01-22',
    scheduledEndDate: '2024-01-24',
    approvalLevel: 'DFO',
    createdAt: '2024-01-16T00:00:00Z',
    updatedAt: '2024-01-16T00:00:00Z',
  },
  {
    id: '5',
    propertyId: '5',
    property: mockProperties[4],
    turnNumber: 'T-2024-005',
    status: 'completed',
    priority: 'medium',
    requestedBy: 'David Rodriguez',
    assignedVendorId: '3',
    assignedVendor: mockVendors[2],
    estimatedCost: 1600,
    actualCost: 1525,
    description: 'Plumbing repairs and bathroom refresh',
    scope: ['Plumbing Repairs', 'Bathroom Painting', 'Fixture Replacement'],
    scheduledStartDate: '2024-01-08',
    actualStartDate: '2024-01-08',
    scheduledEndDate: '2024-01-12',
    actualEndDate: '2024-01-11',
    approvalLevel: 'DFO',
    approvedBy: 'Sarah Johnson',
    approvedAt: '2024-01-07T11:00:00Z',
    createdAt: '2024-01-06T00:00:00Z',
    updatedAt: '2024-01-11T00:00:00Z',
    completionRate: 100,
  }
];

// Mock Dashboard Metrics
export const mockDashboardMetrics: DashboardMetrics = {
  activeProperties: 47,
  pendingTurns: 8,
  activeTurns: 12,
  completedTurnsThisMonth: 24,
  totalRevenue: 142500,
  monthlyRevenue: 28400,
  averageTurnTime: 4.2,
  overdueTurns: 2,
  approvalsPending: 5,
  activeVendors: 18,
  completionRate: 94.5,
  avgCostPerTurn: 1850,
};

// Mock Users
export const mockUsers: User[] = [
  {
    id: 'pm1',
    firstName: 'Sarah',
    lastName: 'Johnson',
    email: 'sarah.johnson@company.com',
    role: 'property_manager',
    isActive: true,
    createdAt: '2023-01-15T00:00:00Z',
  },
  {
    id: 'pm2',
    firstName: 'David',
    lastName: 'Rodriguez',
    email: 'david.rodriguez@company.com',
    role: 'property_manager',
    isActive: true,
    createdAt: '2023-02-01T00:00:00Z',
  },
  {
    id: 'pm3',
    firstName: 'Lisa',
    lastName: 'Wang',
    email: 'lisa.wang@company.com',
    role: 'property_manager',
    isActive: true,
    createdAt: '2023-03-10T00:00:00Z',
  },
  {
    id: 'spm1',
    firstName: 'Mike',
    lastName: 'Chen',
    email: 'mike.chen@company.com',
    role: 'sr_property_manager',
    isActive: true,
    createdAt: '2022-06-01T00:00:00Z',
  },
  {
    id: 'admin1',
    firstName: 'Jennifer',
    lastName: 'Adams',
    email: 'jennifer.adams@company.com',
    role: 'admin',
    isActive: true,
    createdAt: '2022-01-01T00:00:00Z',
  },
];

// Helper functions
export const getStatusColor = (status: string) => {
  switch (status) {
    case 'active':
    case 'approved':
    case 'completed':
      return 'text-green-600 bg-green-100';
    case 'in_progress':
    case 'dfo_review':
      return 'text-blue-600 bg-blue-100';
    case 'maintenance':
    case 'requested':
      return 'text-yellow-600 bg-yellow-100';
    case 'vacant':
    case 'cancelled':
      return 'text-red-600 bg-red-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'urgent':
      return 'text-red-600 bg-red-100';
    case 'high':
      return 'text-orange-600 bg-orange-100';
    case 'medium':
      return 'text-yellow-600 bg-yellow-100';
    case 'low':
      return 'text-green-600 bg-green-100';
    default:
      return 'text-gray-600 bg-gray-100';
  }
};

export const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
};

export const formatDate = (dateString: string) => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(dateString));
};