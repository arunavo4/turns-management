"use client";

import { useState, useEffect } from "react";
import {
  KanbanBoard,
  KanbanCard,
  KanbanCards,
  KanbanHeader,
  KanbanProvider,
} from '@/components/ui/kanban';
import {
  IconPlus,
  IconSettings,
  IconLayoutKanban,
  IconLayoutList,
  IconTable,
  IconChevronDown,
  IconFilter,
  IconSortAscending,
  IconDownload,
  IconDotsVertical,
  IconEdit,
  IconTrash,
  IconEye,
  IconEyeOff,
} from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { getPriorityColor } from "@/lib/mock-data";
import { cn } from "@/lib/utils";

// Types
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

interface KanbanBoardProps {
  turns: Turn[];
  stages: TurnStage[];
  onStageUpdate: (stageId: string, updates: Partial<TurnStage>) => void;
  onStageCreate: (stage: Omit<TurnStage, 'id'>) => void;
  onStageDelete: (stageId: string) => void;
  onTurnUpdate: (turnId: string, updates: any) => void;
  onTurnCreate: (turn: any) => void;
  viewType: 'kanban' | 'list' | 'table';
  onViewChange: (view: 'kanban' | 'list' | 'table') => void;
}

// Helper function defined before usage
const getDaysFromNow = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export default function EnhancedKanbanBoard({
  turns,
  stages,
  onStageUpdate,
  onStageCreate,
  onStageDelete,
  onTurnUpdate,
  onTurnCreate,
  viewType,
  onViewChange,
}: KanbanBoardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterPriority, setFilterPriority] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [showSettings, setShowSettings] = useState(false);
  const [editingStage, setEditingStage] = useState<TurnStage | null>(null);
  const [creatingStage, setCreatingStage] = useState(false);
  const [newStage, setNewStage] = useState<Partial<TurnStage>>({
    name: '',
    key: '',
    color: 'gray',
    sequence: stages.length + 1,
    isActive: true,
  });

  // Filter turns
  const filteredTurns = turns.filter((turnData) => {
    const matchesSearch = 
      turnData.turn.turnNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (turnData.property?.name.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
      (turnData.turn.scopeOfWork?.toLowerCase().includes(searchQuery.toLowerCase()) || false);
    
    const matchesPriority = filterPriority === "all" || turnData.turn.priority === filterPriority;
    
    return matchesSearch && matchesPriority;
  });

  // Sort turns
  const sortedTurns = [...filteredTurns].sort((a, b) => {
    switch (sortBy) {
      case 'date':
        return new Date(b.turn.createdAt).getTime() - new Date(a.turn.createdAt).getTime();
      case 'priority':
        const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.turn.priority as keyof typeof priorityOrder] || 4) - 
               (priorityOrder[b.turn.priority as keyof typeof priorityOrder] || 4);
      case 'name':
        return a.turn.turnNumber.localeCompare(b.turn.turnNumber);
      default:
        return 0;
    }
  });

  // Convert to kanban format
  const kanbanData = sortedTurns.map(turnData => {
    const dueInDays = turnData.turn.turnDueDate ? getDaysFromNow(turnData.turn.turnDueDate) : null;
    const isOverdue = dueInDays !== null && dueInDays < 0;
    
    return {
      id: turnData.turn.id,
      name: turnData.turn.turnNumber,
      column: turnData.turn.status,
      turn: turnData.turn,
      property: turnData.property,
      vendor: turnData.vendor,
      dueInDays,
      isOverdue,
    };
  });


  // Active stages for kanban columns
  const activeStages = stages
    .filter(s => s.isActive)
    .sort((a, b) => a.sequence - b.sequence);

  const columns = activeStages.map(stage => ({
    id: stage.key,
    name: stage.name,
    color: stage.color,
    stage: stage,
  }));

  const handleDataChange = async (newData: typeof kanbanData) => {
    const changedItem = newData.find((newItem, index) => {
      const oldItem = kanbanData[index];
      return oldItem && newItem.column !== oldItem.column;
    });

    if (changedItem) {
      onTurnUpdate(changedItem.id, { status: changedItem.column });
    }
  };

  const handleStageCreate = () => {
    if (newStage.name && newStage.key) {
      onStageCreate({
        ...newStage as Omit<TurnStage, 'id'>,
      });
      setCreatingStage(false);
      setNewStage({
        name: '',
        key: '',
        color: 'gray',
        sequence: stages.length + 1,
        isActive: true,
      });
    }
  };

  const getStageIcon = (iconName?: string) => {
    const icons: Record<string, any> = {
      IconFile: IconEye,
      IconLock: IconEye,
      IconEye: IconEye,
      IconClipboardList: IconEye,
      IconUsers: IconEye,
      IconRefresh: IconEye,
      IconExclamationTriangle: IconEye,
      IconCircleCheck: IconEye,
      IconCamera: IconEye,
    };
    return icons[iconName || ''] || IconEye;
  };

  return (
    <div className="space-y-4">
      {/* Header Toolbar */}
      <div className="flex items-center justify-between gap-4 bg-white rounded-lg border p-4">
        <div className="flex items-center gap-2">
          {/* View Switcher */}
          <div className="flex items-center rounded-lg border bg-gray-50">
            <Button
              variant={viewType === 'kanban' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('kanban')}
              className="rounded-r-none"
            >
              <IconLayoutKanban className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'list' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('list')}
              className="rounded-none border-x"
            >
              <IconLayoutList className="h-4 w-4" />
            </Button>
            <Button
              variant={viewType === 'table' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => onViewChange('table')}
              className="rounded-l-none"
            >
              <IconTable className="h-4 w-4" />
            </Button>
          </div>

          {/* Search */}
          <Input
            type="search"
            placeholder="Search turns..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-64"
          />

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconFilter className="h-4 w-4 mr-1" />
                Filter
                {filterPriority !== 'all' && (
                  <Badge variant="secondary" className="ml-2">
                    1
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              <DropdownMenuLabel>Priority</DropdownMenuLabel>
              <DropdownMenuItem onClick={() => setFilterPriority('all')}>
                All Priorities
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('urgent')}>
                Urgent
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('high')}>
                High
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('medium')}>
                Medium
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterPriority('low')}>
                Low
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Sort */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <IconSortAscending className="h-4 w-4 mr-1" />
                Sort
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              <DropdownMenuItem onClick={() => setSortBy('date')}>
                Date Created
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('priority')}>
                Priority
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setSortBy('name')}>
                Name
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-2">
          {/* Stage Settings */}
          <Dialog open={showSettings} onOpenChange={setShowSettings}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <IconSettings className="h-4 w-4 mr-1" />
                Configure Stages
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Configure Workflow Stages</DialogTitle>
                <DialogDescription>
                  Manage your turn workflow stages. Drag to reorder, toggle visibility, or create new stages.
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                {/* Stage List */}
                <div className="space-y-2">
                  {stages.sort((a, b) => a.sequence - b.sequence).map((stage) => (
                    <div
                      key={stage.id}
                      className="flex items-center justify-between p-3 rounded-lg border bg-white"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn(
                          "w-3 h-3 rounded-full",
                          `bg-${stage.color}-500`
                        )} />
                        <div>
                          <div className="font-medium">{stage.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {stage.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={stage.isActive}
                          onCheckedChange={(checked) => 
                            onStageUpdate(stage.id, { isActive: checked })
                          }
                        />
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <IconDotsVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setEditingStage(stage)}>
                              <IconEdit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            {!stage.isDefault && !stage.isFinal && (
                              <DropdownMenuItem 
                                onClick={() => onStageDelete(stage.id)}
                                className="text-red-600"
                              >
                                <IconTrash className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add New Stage */}
                {!creatingStage ? (
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => setCreatingStage(true)}
                  >
                    <IconPlus className="h-4 w-4 mr-2" />
                    Add New Stage
                  </Button>
                ) : (
                  <div className="space-y-4 p-4 border rounded-lg">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stage-name">Stage Name</Label>
                        <Input
                          id="stage-name"
                          value={newStage.name}
                          onChange={(e) => setNewStage({ ...newStage, name: e.target.value })}
                          placeholder="e.g., Quality Check"
                        />
                      </div>
                      <div>
                        <Label htmlFor="stage-key">Stage Key</Label>
                        <Input
                          id="stage-key"
                          value={newStage.key}
                          onChange={(e) => setNewStage({ ...newStage, key: e.target.value })}
                          placeholder="e.g., quality_check"
                        />
                      </div>
                    </div>
                    <div>
                      <Label htmlFor="stage-description">Description</Label>
                      <Textarea
                        id="stage-description"
                        value={newStage.description}
                        onChange={(e) => setNewStage({ ...newStage, description: e.target.value })}
                        placeholder="Describe this stage..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="stage-color">Color</Label>
                        <Select
                          value={newStage.color}
                          onValueChange={(value) => setNewStage({ ...newStage, color: value })}
                        >
                          <SelectTrigger id="stage-color">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="gray">Gray</SelectItem>
                            <SelectItem value="red">Red</SelectItem>
                            <SelectItem value="yellow">Yellow</SelectItem>
                            <SelectItem value="green">Green</SelectItem>
                            <SelectItem value="blue">Blue</SelectItem>
                            <SelectItem value="indigo">Indigo</SelectItem>
                            <SelectItem value="purple">Purple</SelectItem>
                            <SelectItem value="pink">Pink</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCreatingStage(false);
                          setNewStage({
                            name: '',
                            key: '',
                            color: 'gray',
                            sequence: stages.length + 1,
                            isActive: true,
                          });
                        }}
                      >
                        Cancel
                      </Button>
                      <Button onClick={handleStageCreate}>
                        Create Stage
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </DialogContent>
          </Dialog>

          {/* Add Turn */}
          <Button>
            <IconPlus className="h-4 w-4 mr-1" />
            New Turn
          </Button>

          {/* More Actions */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon">
                <IconDotsVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <IconDownload className="h-4 w-4 mr-2" />
                Export
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Kanban Board */}
      {viewType === 'kanban' && (
        <KanbanProvider
          columns={columns}
          data={kanbanData}
          onDataChange={handleDataChange}
        >
          {(column) => {
            const stage = column.stage as TurnStage;
            const stageCount = kanbanData.filter(item => item.column === column.id).length;
            
            return (
              <KanbanBoard id={column.id} key={column.id}>
                <KanbanHeader>
                  <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        `bg-${column.color}-500`
                      )} />
                      <span className="font-semibold text-sm">{column.name}</span>
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                        {stageCount}
                      </span>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <IconDotsVertical className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>
                          <IconPlus className="h-4 w-4 mr-2" />
                          Add turn here
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <IconEyeOff className="h-4 w-4 mr-2" />
                          Hide column
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </KanbanHeader>
                <KanbanCards id={column.id}>
                  {kanbanData
                    .filter(item => item.column === column.id)
                    .map((item) => (
                    <KanbanCard
                      key={item.id}
                      id={item.id}
                      name={item.name}
                      column={item.column}
                    >
                      <div className="space-y-2">
                        <div className="flex items-start justify-between">
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold text-sm text-gray-900 mb-1">
                              {item.turn.turnNumber}
                            </h4>
                            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                              {item.turn.scopeOfWork || "No scope defined"}
                            </p>
                          </div>
                        </div>

                        {/* Property Info */}
                        {item.property && (
                          <div className="text-xs">
                            <div className="font-medium text-gray-900 mb-1">
                              {item.property.name}
                            </div>
                            <div className="text-gray-500">
                              {item.property.city}, {item.property.state}
                            </div>
                          </div>
                        )}

                        {/* Priority & Cost */}
                        <div className="flex items-center justify-between">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-2 py-0.5 ${getPriorityColor(item.turn.priority)}`}
                          >
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
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">
                                Power
                              </Badge>
                            )}
                            {item.turn.waterStatus && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">
                                Water
                              </Badge>
                            )}
                            {item.turn.gasStatus && (
                              <Badge variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">
                                Gas
                              </Badge>
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
                  ))}
                </KanbanCards>
              </KanbanBoard>
            );
          }}
        </KanbanProvider>
      )}

      {/* List View */}
      {viewType === 'list' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4">
            <p className="text-muted-foreground">List view coming soon...</p>
          </div>
        </div>
      )}

      {/* Table View */}
      {viewType === 'table' && (
        <div className="bg-white rounded-lg border">
          <div className="p-4">
            <p className="text-muted-foreground">Table view coming soon...</p>
          </div>
        </div>
      )}
    </div>
  );
}