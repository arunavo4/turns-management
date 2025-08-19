"use client";

import { useState, useEffect } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconPlus,
  IconMapPin,
  IconCalendar,
  IconClock,
  IconAlertTriangle,
  IconCircleCheck,
  IconRefresh,
  IconEye,
  IconEdit,
  IconDots,
  IconFlag,
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
import { Progress } from "@/components/ui/progress";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  getPriorityColor, 
  formatCurrency
} from "@/lib/mock-data";
import { IconLoader2 } from "@tabler/icons-react";

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
    color: 'bg-yellow-100 border-yellow-300',
    icon: IconAlertTriangle,
    iconColor: 'text-yellow-600'
  },
  {
    id: 'dfo_review',
    title: 'DFO Review',
    color: 'bg-blue-100 border-blue-300',
    icon: IconEye,
    iconColor: 'text-blue-600'
  },
  {
    id: 'approved',
    title: 'Approved',
    color: 'bg-green-100 border-green-300',
    icon: IconCircleCheck,
    iconColor: 'text-green-600'
  },
  {
    id: 'in_progress',
    title: 'In Progress',
    color: 'bg-orange-100 border-orange-300',
    icon: IconRefresh,
    iconColor: 'text-orange-600'
  },
  {
    id: 'completed',
    title: 'Completed',
    color: 'bg-gray-100 border-gray-300',
    icon: IconCircleCheck,
    iconColor: 'text-gray-600'
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
      const response = await fetch("/api/turns");
      if (!response.ok) {
        throw new Error("Failed to fetch turns");
      }
      const data = await response.json();
      setTurns(data);
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

  const getPriorityBadge = (priority: string) => {
    const colorClass = getPriorityColor(priority);
    return (
      <Badge variant="secondary" className={colorClass}>
        <IconFlag className="mr-1 h-3 w-3" />
        {priority.toUpperCase()}
      </Badge>
    );
  };

  const getDaysFromNow = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const TurnCard = ({ turnData }: { turnData: Turn }) => {
    const dueInDays = turnData.turn.turnDueDate ? getDaysFromNow(turnData.turn.turnDueDate) : null;
    const isOverdue = dueInDays !== null && dueInDays < 0;
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{turnData.turn.turnNumber}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {turnData.turn.scopeOfWork || "No scope defined"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0">
                    <IconDots className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>
                    <IconEye className="mr-2 h-4 w-4" />
                    View Details
                  </DropdownMenuItem>
                  <DropdownMenuItem>
                    <IconEdit className="mr-2 h-4 w-4" />
                    Edit Turn
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Property Info */}
            {turnData.property && (
              <div className="space-y-2">
                <div className="text-sm font-medium">{turnData.property.name}</div>
                <div className="flex items-center text-xs text-muted-foreground">
                  <IconMapPin className="mr-1 h-3 w-3" />
                  {turnData.property.city}, {turnData.property.state}
                </div>
              </div>
            )}

            {/* Priority & Cost */}
            <div className="flex items-center justify-between">
              {getPriorityBadge(turnData.turn.priority)}
              {(turnData.turn.actualCost || turnData.turn.estimatedCost) && (
                <div className="text-sm font-medium">
                  {formatCurrency(parseFloat(turnData.turn.actualCost || turnData.turn.estimatedCost || "0"))}
                </div>
              )}
            </div>

            {/* Progress - removed for now as we don't have this field yet */}

            {/* Due Date */}
            {turnData.turn.turnDueDate && (
              <div className="flex items-center text-xs">
                <IconCalendar className="mr-1 h-3 w-3" />
                <span className={isOverdue ? "text-red-600 font-medium" : "text-muted-foreground"}>
                  {isOverdue ? `${Math.abs(dueInDays!)} days overdue` : 
                   dueInDays === 0 ? "Due today" :
                   dueInDays === 1 ? "Due tomorrow" :
                   `Due in ${dueInDays} days`}
                </span>
              </div>
            )}

            {/* Assigned Vendor */}
            {turnData.vendor && (
              <div className="flex items-center text-xs">
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarFallback className="text-xs">
                    {turnData.vendor.companyName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate">
                  {turnData.vendor.companyName}
                </span>
              </div>
            )}

            {/* Utilities Status */}
            <div className="flex gap-2">
              {turnData.turn.powerStatus && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">Power On</Badge>
              )}
              {turnData.turn.waterStatus && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">Water On</Badge>
              )}
              {turnData.turn.gasStatus && (
                <Badge variant="outline" className="text-xs px-1.5 py-0.5">Gas On</Badge>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn = ({ column, columnTurns }: { column: typeof statusColumns[0], columnTurns: Turn[] }) => {
    const Icon = column.icon;
    
    return (
      <div className="flex flex-col min-h-96">
        <div className={`rounded-t-lg p-4 border ${column.color}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${column.iconColor}`} />
              <h3 className="font-medium">{column.title}</h3>
            </div>
            <Badge variant="secondary" className="h-5 text-xs">
              {columnTurns.length}
            </Badge>
          </div>
        </div>
        <div className="flex-1 p-3 border-l border-r border-b rounded-b-lg bg-muted/20 min-h-80">
          {columnTurns.map((turnData) => (
            <TurnCard key={turnData.turn.id} turnData={turnData} />
          ))}
          {columnTurns.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No turns in this stage
            </div>
          )}
        </div>
      </div>
    );
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
            <h2 className="text-lg font-semibold">Turn Workflow</h2>
            <div className="text-sm text-muted-foreground">
              {filteredTurns.length} total turns
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {statusColumns.map((column) => {
              const columnTurns = filteredTurns.filter(turnData => turnData.turn.status === column.id);
              return (
                <KanbanColumn 
                  key={column.id} 
                  column={column} 
                  columnTurns={columnTurns} 
                />
              );
            })}
          </div>
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