"use client";

import { useState } from "react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import {
  IconSearch,
  IconPlus,
  IconFilter,
  IconMapPin,
  IconCalendar,
  IconCurrencyDollar,
  IconUser,
  IconClock,
  IconAlertTriangle,
  IconCheckCircle,
  IconRefresh,
  IconEye,
  IconEdit,
  IconDots,
  IconFlag,
} from "@tabler/icons-react";
import {
  Card,
  CardContent,
  CardDescription,
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
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  mockTurns, 
  mockDashboardMetrics,
  getStatusColor, 
  getPriorityColor, 
  formatCurrency, 
  formatDate,
  Turn 
} from "@/lib/mock-data";

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
    icon: IconCheckCircle,
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
    icon: IconCheckCircle,
    iconColor: 'text-gray-600'
  }
];

export default function TurnsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");

  const filteredTurns = mockTurns.filter((turn) => {
    const matchesSearch = 
      turn.turnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      turn.property.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      turn.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesPriority = filterPriority === "all" || turn.priority === filterPriority;
    
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

  const TurnCard = ({ turn }: { turn: Turn }) => {
    const dueInDays = turn.scheduledEndDate ? getDaysFromNow(turn.scheduledEndDate) : null;
    const isOverdue = dueInDays !== null && dueInDays < 0;
    
    return (
      <Card className="mb-3 hover:shadow-md transition-shadow duration-200 cursor-pointer">
        <CardContent className="p-4">
          <div className="space-y-3">
            {/* Header */}
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h4 className="font-medium text-sm">{turn.turnNumber}</h4>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {turn.description}
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
            <div className="space-y-2">
              <div className="text-sm font-medium">{turn.property.name}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <IconMapPin className="mr-1 h-3 w-3" />
                {turn.property.city}, {turn.property.state}
              </div>
            </div>

            {/* Priority & Cost */}
            <div className="flex items-center justify-between">
              {getPriorityBadge(turn.priority)}
              <div className="text-sm font-medium">
                {formatCurrency(turn.actualCost || turn.estimatedCost)}
              </div>
            </div>

            {/* Progress */}
            {turn.completionRate !== undefined && (
              <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span>Progress</span>
                  <span>{turn.completionRate}%</span>
                </div>
                <Progress value={turn.completionRate} className="h-1.5" />
              </div>
            )}

            {/* Due Date */}
            {turn.scheduledEndDate && (
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
            {turn.assignedVendor && (
              <div className="flex items-center text-xs">
                <Avatar className="h-5 w-5 mr-2">
                  <AvatarFallback className="text-xs">
                    {turn.assignedVendor.companyName.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-muted-foreground truncate">
                  {turn.assignedVendor.companyName}
                </span>
              </div>
            )}

            {/* Scope Tags */}
            {turn.scope && turn.scope.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {turn.scope.slice(0, 2).map((item, index) => (
                  <Badge key={index} variant="outline" className="text-xs px-1.5 py-0.5">
                    {item}
                  </Badge>
                ))}
                {turn.scope.length > 2 && (
                  <Badge variant="outline" className="text-xs px-1.5 py-0.5">
                    +{turn.scope.length - 2}
                  </Badge>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const KanbanColumn = ({ column, turns }: { column: typeof statusColumns[0], turns: Turn[] }) => {
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
              {turns.length}
            </Badge>
          </div>
        </div>
        <div className="flex-1 p-3 border-l border-r border-b rounded-b-lg bg-muted/20 min-h-80">
          {turns.map((turn) => (
            <TurnCard key={turn.id} turn={turn} />
          ))}
          {turns.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              No turns in this stage
            </div>
          )}
        </div>
      </div>
    );
  };

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
              <div className="text-2xl font-bold">{mockDashboardMetrics.activeTurns}</div>
              <p className="text-xs text-muted-foreground">
                {mockDashboardMetrics.overdueTurns} overdue
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <IconAlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardMetrics.approvalsPending}</div>
              <p className="text-xs text-muted-foreground">
                Awaiting DFO/HO review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Turn Time</CardTitle>
              <IconClock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardMetrics.averageTurnTime} days</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-600">↓ 0.5</span> days improvement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <IconCheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockDashboardMetrics.completionRate}%</div>
              <p className="text-xs text-muted-foreground">
                On-time completion rate
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
              const columnTurns = filteredTurns.filter(turn => turn.status === column.id);
              return (
                <KanbanColumn 
                  key={column.id} 
                  column={column} 
                  turns={columnTurns} 
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