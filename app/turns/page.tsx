"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconPlus,
  IconAlertTriangle,
  IconCircleCheck,
  IconRefresh,
  IconEye,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { IconLoader2 } from "@tabler/icons-react";
import { 
  getPriorityColor
} from "@/lib/mock-data";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/shadcn-io/kanban';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

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

const statusColumns = [
  {
    id: 'requested',
    title: 'Requested',
    icon: IconAlertTriangle,
    iconColor: 'text-amber-500',
    bgColor: 'bg-amber-50'
  },
  {
    id: 'dfo_review',
    title: 'DFO Review',
    icon: IconEye,
    iconColor: 'text-blue-500',
    bgColor: 'bg-blue-50'
  },
  {
    id: 'approved',
    title: 'Approved',
    icon: IconCircleCheck,
    iconColor: 'text-emerald-500',
    bgColor: 'bg-emerald-50'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    icon: IconRefresh,
    iconColor: 'text-orange-500',
    bgColor: 'bg-orange-50'
  },
  {
    id: 'completed',
    title: 'Completed',
    icon: IconCircleCheck,
    iconColor: 'text-slate-500',
    bgColor: 'bg-slate-50'
  }
];

export default function TurnsPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");

  // Fetch turns from API
  useEffect(() => {
    fetchTurns();
  }, []);

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

  const filteredTurns = turns.filter((turnData) => {
    const matchesSearch = 
      turnData.turn.turnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (turnData.property?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (turnData.turn.scopeOfWork?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesPriority = filterPriority === "all" || turnData.turn.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });


  const getDaysFromNow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // Convert turns data to shadcn kanban format
  const columns = statusColumns.map(statusCol => ({
    id: statusCol.id,
    name: statusCol.title,
    color: statusCol.iconColor,
    icon: statusCol.icon,
  }));

  const kanbanData = filteredTurns.map(turnData => {
    const dueInDays = turnData.turn.turnDueDate ? getDaysFromNow(turnData.turn.turnDueDate) : null;
    const isOverdue = dueInDays !== null && dueInDays < 0;
    
    return {
      id: turnData.turn.id,
      name: turnData.turn.turnNumber,
      column: turnData.turn.status,
      // Store all the turn data for display
      turn: turnData.turn,
      property: turnData.property,
      vendor: turnData.vendor,
      dueInDays,
      isOverdue,
    };
  });

  // Handle data change (drag and drop)
  const handleDataChange = async (newData: typeof kanbanData) => {
    // Find what changed
    const changedItem = newData.find((newItem, index) => {
      const oldItem = kanbanData[index];
      return oldItem && newItem.column !== oldItem.column;
    });

    if (changedItem) {
      try {
        // Update the turn status in the database
        const response = await fetch(`/api/turns/${changedItem.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: changedItem.column,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update turn status');
        }

        // Refresh the data to get the updated state
        fetchTurns();
      } catch (error) {
        console.error('Failed to update turn status:', error);
        // Refresh to revert the optimistic update
        fetchTurns();
      }
    }
  };

  // Calculate metrics from real data
  const metrics = {
    activeTurns: turns.filter(t => t.turn.status !== 'completed').length,
    pendingApprovals: turns.filter(t => t.turn.status === 'dfo_review').length,
    completedTurns: turns.filter(t => t.turn.status === 'completed').length,
    totalTurns: turns.length
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <IconLoader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="text-center text-red-600 p-8">
          Error: {error}
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">Turns Management</h1>
            <p className="text-muted-foreground">
              Track and manage property turns through the approval workflow
            </p>
          </div>
          <Button className="flex items-center gap-2">
            <IconPlus className="h-4 w-4" />
            Create Turn
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Turns</CardTitle>
              <IconRefresh className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.activeTurns}</div>
              <p className="text-xs text-muted-foreground">
                Currently in progress
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.pendingApprovals}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting DFO/HO review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Turns</CardTitle>
              <IconCircleCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.completedTurns}</div>
              <p className="text-xs text-muted-foreground">
                This period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Turns</CardTitle>
              <IconRefresh className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{metrics.totalTurns}</div>
              <p className="text-xs text-muted-foreground">
                All time
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-1 gap-2 max-w-md">
            <div className="relative flex-1">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search turns..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select value={filterPriority} onValueChange={setFilterPriority}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Turn Workflow</h2>
            <div className="text-sm text-gray-500">
              {filteredTurns.length} total turns
            </div>
          </div>

          <KanbanProvider
            columns={columns}
            data={kanbanData}
            onDataChange={handleDataChange}
          >
            {(column) => (
              <KanbanBoard id={column.id} key={column.id}>
                <KanbanHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <column.icon className={`h-4 w-4 ${column.color}`} />
                      <span className="font-semibold text-sm">{column.name}</span>
                    </div>
                    <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                      {kanbanData.filter(item => item.column === column.id).length}
                    </span>
                  </div>
                </KanbanHeader>
                <KanbanCards id={column.id}>
                  {(item: typeof kanbanData[number]) => (
                    <KanbanCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      column={item.column}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">{item.turn.turnNumber}</h4>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {item.turn.scopeOfWork || "No scope defined"}
                            </p>
                          </div>
                        </div>

                        {/* Property Info */}
                        {item.property && (
                          <div className="text-xs">
                            <div className="font-medium text-gray-900 mb-1">{item.property.name}</div>
                            <div className="text-gray-500">{item.property.city}, {item.property.state}</div>
                          </div>
                        )}

                        {/* Priority & Cost */}
                        <div className="flex items-center justify-between">
                          <Badge variant="secondary" className={`text-xs px-2 py-0.5 ${getPriorityColor(item.turn.priority)}`}>
                            {item.turn.priority.toUpperCase()}
                          </Badge>
                          {(item.turn.actualCost || item.turn.estimatedCost) && (
                            <div className="text-xs font-semibold text-gray-900">
                              ${parseFloat(item.turn.actualCost || item.turn.estimatedCost || "0").toLocaleString()}
                            </div>
                          )}
                        </div>

                        {/* Due Date */}
                        {item.turn.turnDueDate && (
                          <div className="text-xs">
                            <span className={item.isOverdue ? "text-red-600 font-medium" : "text-gray-500"}>
                              {item.isOverdue ? `${Math.abs(item.dueInDays!)} days overdue` : 
                               item.dueInDays === 0 ? "Due today" :
                               item.dueInDays === 1 ? "Due tomorrow" :
                               `Due in ${item.dueInDays} days`}
                            </span>
                          </div>
                        )}

                        {/* Utilities Status */}
                        {(item.turn.powerStatus || item.turn.waterStatus || item.turn.gasStatus) && (
                          <div className="flex gap-1 flex-wrap">
                            {item.turn.powerStatus && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">Power On</Badge>
                            )}
                            {item.turn.waterStatus && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">Water On</Badge>
                            )}
                            {item.turn.gasStatus && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">Gas On</Badge>
                            )}
                          </div>
                        )}

                        {/* Assigned Vendor */}
                        {item.vendor && (
                          <div className="flex items-center text-xs text-gray-500">
                            <Avatar className="h-4 w-4 mr-1.5">
                              <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                                {item.vendor.companyName.substring(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span className="truncate text-xs">{item.vendor.companyName}</span>
                          </div>
                        )}
                      </div>
                    </KanbanCard>
                  )}
                </KanbanCards>
              </KanbanBoard>
            )}
          </KanbanProvider>
        </div>

        {/* Empty State */}
        {filteredTurns.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <IconRefresh className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No turns found</h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search criteria or create a new turn.
              </p>
              <Button>
                <IconPlus className="h-4 w-4 mr-2" />
                Create New Turn
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}