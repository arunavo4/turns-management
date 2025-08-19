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
      <Card className="mb-2 hover:shadow-sm transition-all duration-150 cursor-pointer group border-0 shadow-sm hover:bg-gray-50/50">
        <CardContent className="p-3">
          <div className="space-y-2.5">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <h4 className="font-semibold text-sm text-gray-900 mb-1">{turnData.turn.turnNumber}</h4>
                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                  {turnData.turn.scopeOfWork || "No scope defined"}
                </p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
              <div>
                <div className="text-sm font-medium text-gray-900 mb-1">{turnData.property.name}</div>
                <div className="flex items-center text-xs text-gray-500">
                  <IconMapPin className="mr-1 h-3 w-3" />
                  {turnData.property.city}, {turnData.property.state}
                </div>
              </div>
            )}

            {/* Priority & Cost */}
            <div className="flex items-center justify-between">
              {getPriorityBadge(turnData.turn.priority)}
              {(turnData.turn.actualCost || turnData.turn.estimatedCost) && (
                <div className="text-sm font-semibold text-gray-900">
                  {formatCurrency(parseFloat(turnData.turn.actualCost || turnData.turn.estimatedCost || "0"))}
                </div>
              )}
            </div>

            {/* Due Date */}
            {turnData.turn.turnDueDate && (
              <div className="flex items-center text-xs">
                <IconCalendar className="mr-1 h-3 w-3 text-gray-400" />
                <span className={isOverdue ? "text-red-600 font-medium" : "text-gray-500"}>
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
                <Avatar className="h-4 w-4 mr-1.5">
                  <AvatarFallback className="text-xs bg-gray-100 text-gray-600">
                    {turnData.vendor.companyName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-gray-500 truncate text-xs">
                  {turnData.vendor.companyName}
                </span>
              </div>
            )}

            {/* Utilities Status */}
            {(turnData.turn.powerStatus || turnData.turn.waterStatus || turnData.turn.gasStatus) && (
              <div className="flex gap-1 flex-wrap">
                {turnData.turn.powerStatus && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-gray-600 border-gray-200">Power On</Badge>
                )}
                {turnData.turn.waterStatus && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-gray-600 border-gray-200">Water On</Badge>
                )}
                {turnData.turn.gasStatus && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0 h-5 text-gray-600 border-gray-200">Gas On</Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn = ({ column, columnTurns }: { column: typeof statusColumns[0], columnTurns: Turn[] }) => {
    const Icon = column.icon;
    
    return (
      <div className="flex flex-col min-h-96 flex-1 border-r border-gray-200 last:border-r-0">
        <div className={`${column.bgColor} border-b border-gray-200 px-3 py-2.5`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${column.iconColor}`} />
              <h3 className="font-semibold text-sm text-gray-900">{column.title}</h3>
            </div>
            <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-white/60 text-xs font-medium text-gray-600">
              {columnTurns.length}
            </span>
          </div>
        </div>
        <div className="flex-1 p-2 bg-gray-50/30 min-h-80">
          {columnTurns.map((turnData) => (
            <TurnCard key={turnData.turn.id} turnData={turnData} />
          ))}
          {columnTurns.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">
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
            <h2 className="text-lg font-semibold text-gray-900">Turn Workflow</h2>
            <div className="text-sm text-gray-500">
              {filteredTurns.length} total turns
            </div>
          </div>

          <div className="flex flex-col lg:flex-row bg-white rounded-lg border border-gray-200 overflow-hidden">
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