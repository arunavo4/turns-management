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
  IconFilter,
  IconChevronDown,
  IconX,
  IconBuilding,
  IconCalendar,
  IconCurrencyDollar,
  IconUser,
} from "@tabler/icons-react";
import DashboardLayout from "@/components/layout/dashboard-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { format, formatDistanceToNow, differenceInDays } from "date-fns";

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
    moveOutDate: number | null;
    turnAssignmentDate: number | null;
    turnDueDate: number | null;
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
    createdAt: number;
    updatedAt: number;
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

interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
}

interface Vendor {
  id: string;
  companyName: string;
  contactName: string;
  phone: string;
}

export default function TurnsPage() {
  const [turns, setTurns] = useState<Turn[]>([]);
  const [stages, setStages] = useState<TurnStage[]>([]);
  const [properties, setProperties] = useState<Property[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [filterStage, setFilterStage] = useState("all");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTurn, setNewTurn] = useState({
    propertyId: "",
    vendorId: "",
    priority: "medium",
    estimatedCost: "",
    scopeOfWork: "",
    turnDueDate: "",
    notes: "",
    powerStatus: false,
    waterStatus: false,
    gasStatus: false,
    trashOutNeeded: false,
    appliancesNeeded: false,
  });

  // Fetch all data on mount
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch all data in parallel
      const [turnsRes, stagesRes, propertiesRes, vendorsRes] = await Promise.all([
        fetch('/api/turns'),
        fetch('/api/turn-stages'),
        fetch('/api/properties'),
        fetch('/api/vendors'),
      ]);

      if (!turnsRes.ok || !stagesRes.ok || !propertiesRes.ok || !vendorsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const [turnsData, stagesData, propertiesData, vendorsData] = await Promise.all([
        turnsRes.json(),
        stagesRes.json(),
        propertiesRes.json(),
        vendorsRes.json(),
      ]);

      setTurns(turnsData);
      setStages(stagesData.sort((a: TurnStage, b: TurnStage) => a.sequence - b.sequence));
      setProperties(propertiesData);
      setVendors(vendorsData);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTurn = async () => {
    try {
      const response = await fetch('/api/turns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTurn,
          vendorId: newTurn.vendorId || null,
          turnDueDate: newTurn.turnDueDate ? new Date(newTurn.turnDueDate).toISOString() : null,
          estimatedCost: newTurn.estimatedCost || null,
          stageId: stages.find(s => s.isDefault)?.id || stages[0]?.id,
          status: 'draft',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create turn');
      }

      await fetchData();
      setShowCreateDialog(false);
      setNewTurn({
        propertyId: "",
        vendorId: "",
        priority: "medium",
        estimatedCost: "",
        scopeOfWork: "",
        turnDueDate: "",
        notes: "",
        powerStatus: false,
        waterStatus: false,
        gasStatus: false,
        trashOutNeeded: false,
        appliancesNeeded: false,
      });
    } catch (error) {
      console.error('Failed to create turn:', error);
    }
  };

  const handleStageChange = async (turnId: string, newStageId: string) => {
    try {
      const response = await fetch(`/api/turns/${turnId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          stageId: newStageId,
          status: stages.find(s => s.id === newStageId)?.key || 'draft'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update turn');
      }

      await fetchData();
    } catch (error) {
      console.error('Failed to update turn:', error);
    }
  };

  // Filter and sort turns
  const filteredTurns = turns.filter((turnData) => {
    const matchesSearch = 
      turnData.turn.turnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (turnData.property?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (turnData.property?.address.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (turnData.turn.scopeOfWork?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesPriority = filterPriority === "all" || turnData.turn.priority === filterPriority;
    const matchesStage = filterStage === "all" || turnData.turn.stageId === filterStage;
    
    return matchesSearch && matchesPriority && matchesStage;
  });

  // Group turns by stage
  const turnsByStage = stages.reduce((acc, stage) => {
    acc[stage.id] = filteredTurns.filter(t => 
      t.turn.stageId === stage.id || 
      (!t.turn.stageId && stage.isDefault)
    );
    return acc;
  }, {} as Record<string, Turn[]>);

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-700 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-700 border-green-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const formatDate = (timestamp: number | null) => {
    if (!timestamp) return null;
    return format(new Date(timestamp), 'MMM d, yyyy');
  };

  const getDaysUntilDue = (dueDate: number | null) => {
    if (!dueDate) return null;
    const days = differenceInDays(new Date(dueDate), new Date());
    return days;
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <IconRefresh className="h-8 w-8 animate-spin text-primary" />
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
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Turns Management</h1>
            <p className="text-muted-foreground">
              {turns.length} turns across {stages.filter(s => s.isActive).length} stages
            </p>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <IconPlus className="h-4 w-4" />
                New Turn
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Turn</DialogTitle>
                <DialogDescription>
                  Add a new turn to the workflow. Turns will start in the draft stage.
                </DialogDescription>
              </DialogHeader>
              
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="property">Property *</Label>
                    <Select
                      value={newTurn.propertyId}
                      onValueChange={(value) => setNewTurn({ ...newTurn, propertyId: value })}
                    >
                      <SelectTrigger id="property">
                        <SelectValue placeholder="Select property" />
                      </SelectTrigger>
                      <SelectContent>
                        {properties.map((property) => (
                          <SelectItem key={property.id} value={property.id}>
                            {property.name} - {property.address}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="vendor">Vendor</Label>
                    <Select
                      value={newTurn.vendorId || "none"}
                      onValueChange={(value) => setNewTurn({ ...newTurn, vendorId: value === "none" ? "" : value })}
                    >
                      <SelectTrigger id="vendor">
                        <SelectValue placeholder="Select vendor (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No vendor</SelectItem>
                        {vendors.map((vendor) => (
                          <SelectItem key={vendor.id} value={vendor.id}>
                            {vendor.companyName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="priority">Priority</Label>
                    <Select
                      value={newTurn.priority}
                      onValueChange={(value) => setNewTurn({ ...newTurn, priority: value })}
                    >
                      <SelectTrigger id="priority">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={newTurn.turnDueDate}
                      onChange={(e) => setNewTurn({ ...newTurn, turnDueDate: e.target.value })}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="estimatedCost">Estimated Cost</Label>
                  <Input
                    id="estimatedCost"
                    type="number"
                    placeholder="0.00"
                    value={newTurn.estimatedCost}
                    onChange={(e) => setNewTurn({ ...newTurn, estimatedCost: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="scope">Scope of Work</Label>
                  <Textarea
                    id="scope"
                    placeholder="Describe the work to be done..."
                    value={newTurn.scopeOfWork}
                    onChange={(e) => setNewTurn({ ...newTurn, scopeOfWork: e.target.value })}
                    rows={3}
                  />
                </div>

                <div className="space-y-4">
                  <Label>Utilities & Requirements</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="power"
                        checked={newTurn.powerStatus}
                        onCheckedChange={(checked) => setNewTurn({ ...newTurn, powerStatus: checked })}
                      />
                      <Label htmlFor="power">Power On</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="water"
                        checked={newTurn.waterStatus}
                        onCheckedChange={(checked) => setNewTurn({ ...newTurn, waterStatus: checked })}
                      />
                      <Label htmlFor="water">Water On</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="gas"
                        checked={newTurn.gasStatus}
                        onCheckedChange={(checked) => setNewTurn({ ...newTurn, gasStatus: checked })}
                      />
                      <Label htmlFor="gas">Gas On</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="trash"
                        checked={newTurn.trashOutNeeded}
                        onCheckedChange={(checked) => setNewTurn({ ...newTurn, trashOutNeeded: checked })}
                      />
                      <Label htmlFor="trash">Trash Out Needed</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="appliances"
                        checked={newTurn.appliancesNeeded}
                        onCheckedChange={(checked) => setNewTurn({ ...newTurn, appliancesNeeded: checked })}
                      />
                      <Label htmlFor="appliances">Appliances Needed</Label>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Additional notes..."
                    value={newTurn.notes}
                    onChange={(e) => setNewTurn({ ...newTurn, notes: e.target.value })}
                    rows={2}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateTurn} disabled={!newTurn.propertyId}>
                  Create Turn
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters Bar */}
        <div className="flex items-center gap-4 p-4 bg-white rounded-lg border">
          <div className="flex-1 max-w-sm">
            <div className="relative">
              <IconSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search turns..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Priorities</SelectItem>
              <SelectItem value="urgent">Urgent</SelectItem>
              <SelectItem value="high">High</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="low">Low</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterStage} onValueChange={setFilterStage}>
            <SelectTrigger className="w-[160px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Stages</SelectItem>
              {stages.filter(s => s.isActive).map((stage) => (
                <SelectItem key={stage.id} value={stage.id}>
                  {stage.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {(searchQuery || filterPriority !== 'all' || filterStage !== 'all') && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchQuery("");
                setFilterPriority("all");
                setFilterStage("all");
              }}
              className="gap-2"
            >
              <IconX className="h-4 w-4" />
              Clear filters
            </Button>
          )}
        </div>

        {/* Kanban Board */}
        <div className="flex gap-4 overflow-x-auto pb-4">
          {stages.filter(s => s.isActive).map((stage) => {
            const stageTurns = turnsByStage[stage.id] || [];
            
            return (
              <div
                key={stage.id}
                className="flex-shrink-0 w-[380px] bg-gray-50 rounded-lg"
              >
                {/* Stage Header */}
                <div className="p-4 border-b bg-white rounded-t-lg">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: stage.color }}
                      />
                      <h3 className="font-semibold text-sm">{stage.name}</h3>
                      <Badge variant="secondary" className="text-xs">
                        {stageTurns.length}
                      </Badge>
                    </div>
                  </div>
                  {stage.description && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {stage.description}
                    </p>
                  )}
                </div>

                {/* Stage Cards */}
                <div className="p-4 space-y-3 min-h-[200px]">
                  {stageTurns.map((turnData) => {
                    const daysUntilDue = getDaysUntilDue(turnData.turn.turnDueDate);
                    const isOverdue = daysUntilDue !== null && daysUntilDue < 0;
                    const isDueSoon = daysUntilDue !== null && daysUntilDue <= 3 && daysUntilDue >= 0;
                    
                    return (
                      <Card 
                        key={turnData.turn.id}
                        className="cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => {
                          // Handle card click - could open detail view
                        }}
                      >
                        <CardContent className="p-4 space-y-3">
                          {/* Header */}
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h4 className="font-semibold text-sm">
                                {turnData.turn.turnNumber}
                              </h4>
                              <Badge 
                                variant="outline" 
                                className={cn("text-xs", getPriorityColor(turnData.turn.priority))}
                              >
                                {turnData.turn.priority.toUpperCase()}
                              </Badge>
                            </div>
                            <Select
                              value={stage.id}
                              onValueChange={(value) => handleStageChange(turnData.turn.id, value)}
                            >
                              <SelectTrigger className="w-[120px] h-8 text-xs">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {stages.filter(s => s.isActive).map((s) => (
                                  <SelectItem key={s.id} value={s.id}>
                                    {s.name}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          {/* Property Info */}
                          {turnData.property && (
                            <div className="flex items-start gap-2 text-sm">
                              <IconBuilding className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                              <div className="min-w-0">
                                <p className="font-medium truncate">
                                  {turnData.property.name}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {turnData.property.city}, {turnData.property.state}
                                </p>
                              </div>
                            </div>
                          )}

                          {/* Scope of Work */}
                          {turnData.turn.scopeOfWork && (
                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {turnData.turn.scopeOfWork}
                            </p>
                          )}

                          {/* Vendor */}
                          {turnData.vendor && (
                            <div className="flex items-center gap-2 text-sm">
                              <IconUser className="h-4 w-4 text-muted-foreground" />
                              <span className="truncate">{turnData.vendor.companyName}</span>
                            </div>
                          )}

                          {/* Cost */}
                          {(turnData.turn.estimatedCost || turnData.turn.actualCost) && (
                            <div className="flex items-center gap-2 text-sm">
                              <IconCurrencyDollar className="h-4 w-4 text-muted-foreground" />
                              <span className="font-medium">
                                ${parseFloat(turnData.turn.actualCost || turnData.turn.estimatedCost || "0").toLocaleString()}
                              </span>
                              {turnData.turn.actualCost && (
                                <Badge variant="outline" className="text-xs">Actual</Badge>
                              )}
                            </div>
                          )}

                          {/* Due Date */}
                          {turnData.turn.turnDueDate && (
                            <div className="flex items-center gap-2 text-sm">
                              <IconCalendar className="h-4 w-4 text-muted-foreground" />
                              <span className={cn(
                                isOverdue && "text-red-600 font-medium",
                                isDueSoon && "text-orange-600 font-medium"
                              )}>
                                {isOverdue 
                                  ? `${Math.abs(daysUntilDue)} days overdue`
                                  : daysUntilDue === 0 
                                  ? "Due today"
                                  : daysUntilDue === 1
                                  ? "Due tomorrow"
                                  : `Due in ${daysUntilDue} days`
                                }
                              </span>
                            </div>
                          )}

                          {/* Utilities */}
                          <div className="flex gap-2 flex-wrap">
                            {turnData.turn.powerStatus && (
                              <Badge variant="secondary" className="text-xs">Power</Badge>
                            )}
                            {turnData.turn.waterStatus && (
                              <Badge variant="secondary" className="text-xs">Water</Badge>
                            )}
                            {turnData.turn.gasStatus && (
                              <Badge variant="secondary" className="text-xs">Gas</Badge>
                            )}
                            {turnData.turn.trashOutNeeded && (
                              <Badge variant="secondary" className="text-xs">Trash Out</Badge>
                            )}
                            {turnData.turn.appliancesNeeded && (
                              <Badge variant="secondary" className="text-xs">Appliances</Badge>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                  
                  {stageTurns.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      No turns in this stage
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}