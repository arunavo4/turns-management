export interface LockBoxInfo {
  primaryCode: string;
  location: 'front' | 'back' | 'left' | 'right' | 'other' | '';
  installDate?: number; // Unix timestamp
  notes?: string;
}

export interface LockBoxHistory {
  id: string;
  propertyId: string;
  turnId?: string;
  lockBoxInstallDate?: number;
  lockBoxLocation?: string;
  oldLockBoxCode?: string;
  newLockBoxCode?: string;
  changeDate: number;
  changedBy?: string;
  changedByUser?: {
    id: string;
    authUserId: string;
    role: string;
  };
  reason?: string;
  createdAt: number;
  updatedAt: number;
}

export interface LockBoxUpdateRequest {
  newCode?: string;
  location?: 'front' | 'back' | 'left' | 'right' | 'other';
  installDate?: number;
  notes?: string;
  reason?: string;
}

export interface LockBoxListItem {
  propertyId: string;
  propertyName: string;
  address: string;
  currentCode?: string;
  location?: string;
  installDate?: number;
  lastChanged?: number;
  changedBy?: string;
  lastChangedBy?: string;
  lastChangeReason?: string;
}

export type LockBoxLocation = 'front' | 'back' | 'left' | 'right' | 'other';

export const LOCK_BOX_LOCATIONS: { value: LockBoxLocation; label: string }[] = [
  { value: 'front', label: 'Front Door' },
  { value: 'back', label: 'Back Door' },
  { value: 'left', label: 'Left Side' },
  { value: 'right', label: 'Right Side' },
  { value: 'other', label: 'Other' },
];