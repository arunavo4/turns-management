"use client";

import { useState, useEffect } from "react";
import {
  IconSearch,
  IconPlus,
  IconAlertTriangle,
  IconCircleCheck,
  IconRefresh,
  IconEye,
  IconLayoutKanban,
  IconLayoutList,
  IconTable,
} from "@tabler/icons-react";
import EnhancedKanbanBoard from './kanban-board';

interface TurnStage {
  id: string;
  key: string;
  name: string;
  sequence: number;
  color: string;
  icon?: string;
  description?: string;
  isActive: boolean;
  isDefault?: boolean;
  isFinal?: boolean;
  requiresApproval?: boolean;
  requiresVendor?: boolean;
  requiresAmount?: boolean;
  requiresLockBox?: boolean;
}

interface Turn {
  turn: {
    id: string;
    turnNumber: string;
    propertyId: string;
    status: string;
    priority: string;
    stageId: string | null;
    moveOutDate: string | null;
    turnAssignmentDate: string | null;
    turnDueDate: string | null;
    vendorId: string | null;
    assignedFlooringVendor: string | null;
    estimatedCost: string | null;
    actualCost: string | null;
    scopeOfWork: string | null;
    notes: string | null;
    powerStatus: boolean;
    waterStatus: boolean;
    gasStatus: boolean;
    trashOutNeeded: boolean;
    appliancesNeeded: boolean;
    createdAt: string;
    updatedAt: string;
  };
  property: {
    id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
  vendor: {
    id: string;
    companyName: string;
  } | null;
  stage: {
    id: string;
    name: string;
  } | null;
}


export default function TurnsPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewType, setViewType] = useState<'kanban' | 'list' | 'table'>('kanban');
  const [stages, setStages] = useState<TurnStage[]>([]);

  // Fetch turns and stages from API
  useEffect(() => {
    fetchTurns();
    fetchStages();
  }, []);

  const fetchStages = async () => {
    // For now, use default stages
    const defaultStages: TurnStage[] = [
      {
        id: '1',
        key: 'draft',
        name: 'Draft',
        sequence: 1,
        color: 'gray',
        icon: 'IconFile',
        description: 'Initial turn creation',
        isActive: true,
        isDefault: true,
      },
      {
        id: '2',
        key: 'secure_property',
        name: 'Secure Property',
        sequence: 2,
        color: 'yellow',
        icon: 'IconLock',
        description: 'Property needs to be secured',
        isActive: true,
        requiresLockBox: true,
      },
      {
        id: '3',
        key: 'inspection',
        name: 'Inspection',
        sequence: 3,
        color: 'blue',
        icon: 'IconEye',
        description: 'Property inspection phase',
        isActive: true,
      },
      {
        id: '4',
        key: 'scope_review',
        name: 'Scope Review',
        sequence: 4,
        color: 'purple',
        icon: 'IconClipboardList',
        description: 'Review scope of work',
        isActive: true,
        requiresApproval: true,
        requiresAmount: true,
      },
      {
        id: '5',
        key: 'vendor_assigned',
        name: 'Vendor Assigned',
        sequence: 5,
        color: 'indigo',
        icon: 'IconUsers',
        description: 'Vendor has been assigned',
        isActive: true,
        requiresVendor: true,
      },
      {
        id: '6',
        key: 'in_progress',
        name: 'In Progress',
        sequence: 6,
        color: 'orange',
        icon: 'IconRefresh',
        description: 'Turn work in progress',
        isActive: true,
      },
      {
        id: '7',
        key: 'change_order',
        name: 'Change Order',
        sequence: 7,
        color: 'amber',
        icon: 'IconExclamationTriangle',
        description: 'Change order required',
        isActive: true,
        requiresApproval: true,
      },
      {
        id: '8',
        key: 'turns_complete',
        name: 'Turns Complete',
        sequence: 8,
        color: 'green',
        icon: 'IconCircleCheck',
        description: 'Turn work completed',
        isActive: true,
        isFinal: true,
      },
      {
        id: '9',
        key: 'scan_360',
        name: '360 Scan',
        sequence: 9,
        color: 'teal',
        icon: 'IconCamera',
        description: '360 degree scan completed',
        isActive: true,
      },
    ];
    setStages(defaultStages);
  };

  const fetchTurns = async () => {
    try {
      setLoading(true);
      // Mock data for demonstration
      const mockData = [
        {
          turn: {
            id: "550e8400-e29b-41d4-a716-446655440001",
            turnNumber: "TURN-2024-001",
            propertyId: "1",
            status: "in_progress",
            priority: "high",
            stageId: null,
            moveOutDate: null,
            turnAssignmentDate: null,
            turnDueDate: "2024-12-31",
            vendorId: "1",
            assignedFlooringVendor: null,
            estimatedCost: "3500.00",
            actualCost: null,
            scopeOfWork: "Full paint, carpet replacement, appliance check",
            notes: null,
            powerStatus: true,
            waterStatus: true,
            gasStatus: true,
            trashOutNeeded: false,
            appliancesNeeded: false,
            createdAt: "2024-08-19",
            updatedAt: "2024-08-19",
          },
          property: {
            id: "1",
            name: "Pine Grove House",
            address: "123 Pine St",
            city: "Austin",
            state: "TX",
            zipCode: "78701",
          },
          vendor: {
            id: "1",
            companyName: "Quick Fix Maintenance",
          },
          stage: null,
        },
        {
          turn: {
            id: "550e8400-e29b-41d4-a716-446655440002",
            turnNumber: "TURN-2024-002",
            propertyId: "2",
            status: "requested",
            priority: "medium",
            stageId: null,
            moveOutDate: null,
            turnAssignmentDate: null,
            turnDueDate: "2024-12-25",
            vendorId: null,
            assignedFlooringVendor: null,
            estimatedCost: "2200.00",
            actualCost: null,
            scopeOfWork: "Kitchen renovation, bathroom tile repair",
            notes: null,
            powerStatus: false,
            waterStatus: true,
            gasStatus: false,
            trashOutNeeded: true,
            appliancesNeeded: true,
            createdAt: "2024-08-18",
            updatedAt: "2024-08-18",
          },
          property: {
            id: "2",
            name: "Oak Manor Apartment",
            address: "456 Oak Ave",
            city: "Dallas",
            state: "TX",
            zipCode: "75201",
          },
          vendor: null,
          stage: null,
        },
      ];
      
      setTurns(mockData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleStageUpdate = (stageId: string, updates: Partial<TurnStage>) => {
    setStages(prev => prev.map(s => s.id === stageId ? { ...s, ...updates } : s));
    // TODO: Save to API
  };

  const handleStageCreate = (stage: Omit<TurnStage, 'id'>) => {
    const newStage = { ...stage, id: Date.now().toString() };
    setStages(prev => [...prev, newStage]);
    // TODO: Save to API
  };

  const handleStageDelete = (stageId: string) => {
    setStages(prev => prev.filter(s => s.id !== stageId));
    // TODO: Delete from API
  };

  const handleTurnUpdate = async (turnId: string, updates: any) => {
    try {
      const response = await fetch(`/api/turns/${turnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        throw new Error('Failed to update turn');
      }

      fetchTurns();
    } catch (error) {
      console.error('Failed to update turn:', error);
      fetchTurns();
    }
  };

  const handleTurnCreate = async (turn: any) => {
    // TODO: Implement turn creation
    console.log('Creating turn:', turn);
  };


  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <IconRefresh className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        Error: {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Full width container like GitHub Projects */}
      <div className="px-4 lg:px-6 py-4 space-y-4">
        {/* Compact Header like GitHub Projects */}
        <div className="flex items-center justify-between bg-white rounded-lg border p-3">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-semibold">Turns Management</h1>
            <span className="text-sm text-muted-foreground">
              {turns.length} turns across {stages.filter(s => s.isActive).length} stages
            </span>
          </div>
        </div>

        {/* Enhanced Kanban Board */}
        <EnhancedKanbanBoard
          turns={turns}
          stages={stages}
          onStageUpdate={handleStageUpdate}
          onStageCreate={handleStageCreate}
          onStageDelete={handleStageDelete}
          onTurnUpdate={handleTurnUpdate}
          onTurnCreate={handleTurnCreate}
          viewType={viewType}
          onViewChange={setViewType}
        />
      </div>
    </div>
  );
}