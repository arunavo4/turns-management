"use client";

import React, { createContext, useContext, useState } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
  KeyboardSensor,
  TouchSensor,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

// Types
export interface KanbanCard {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority?: "low" | "medium" | "high" | "urgent";
  assignee?: {
    name: string;
    avatar?: string;
  };
  tags?: string[];
  dueDate?: string;
  // Additional properties for custom use cases
  property?: {
    name: string;
    city: string;
    state: string;
  };
  cost?: string;
  vendor?: {
    companyName: string;
  };
  isOverdue?: boolean;
  dueInDays?: number | null;
  [key: string]: unknown;
}

export interface KanbanColumn {
  id: string;
  title: string;
  cards: KanbanCard[];
  color?: string;
  icon?: React.ReactNode;
}

export interface KanbanData {
  columns: KanbanColumn[];
}

interface KanbanContextType {
  data: KanbanData;
  setData: React.Dispatch<React.SetStateAction<KanbanData>>;
  onCardMove?: (cardId: string, sourceColumnId: string, destinationColumnId: string) => void;
}

// Context
const KanbanContext = createContext<KanbanContextType | undefined>(undefined);

export const useKanban = () => {
  const context = useContext(KanbanContext);
  if (!context) {
    throw new Error("useKanban must be used within a KanbanProvider");
  }
  return context;
};

// Provider
interface KanbanProviderProps {
  children: React.ReactNode | ((column: KanbanColumn) => React.ReactNode);
  data?: KanbanData;
  columns?: KanbanColumn[];
  onCardMove?: (cardId: string, sourceColumnId: string, destinationColumnId: string) => void;
  onDataChange?: (data: KanbanColumn[]) => void;
}

export const KanbanProvider = ({ children, data: initialData, columns, onCardMove, onDataChange }: KanbanProviderProps) => {
  const [data, setData] = useState<KanbanData>(initialData || { columns: [] });

  // If children is a function (render prop), render columns
  if (typeof children === 'function' && columns) {
    return (
      <KanbanContext.Provider value={{ data, setData, onCardMove }}>
        <div className="flex flex-col lg:flex-row bg-white rounded-lg border border-gray-200 overflow-x-auto">
          {columns.map((column) => (
            <div key={column.id} className="flex flex-col min-h-96 flex-1 min-w-[280px] border-r border-gray-200 last:border-r-0">
              {children(column)}
            </div>
          ))}
        </div>
      </KanbanContext.Provider>
    );
  }

  return (
    <KanbanContext.Provider value={{ data, setData, onCardMove }}>
      {children as React.ReactNode}
    </KanbanContext.Provider>
  );
};

// Sortable Card Component
interface SortableCardProps {
  card: KanbanCard;
  columnId: string;
}

export const SortableCard = ({ card, columnId }: SortableCardProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: card.id,
    data: {
      type: "card",
      card,
      columnId,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  if (isDragging) {
    return (
      <Card
        ref={setNodeRef}
        style={style}
        className="opacity-50 border-2 border-dashed border-gray-300"
      >
        <CardContent className="p-3">
          <div className="h-20" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="mb-2 cursor-grab hover:shadow-sm transition-shadow group"
    >
      <CardContent className="p-3">
        <div className="space-y-2">
          <h4 className="font-semibold text-sm text-gray-900">{card.title}</h4>
          {card.description && (
            <p className="text-xs text-gray-600 line-clamp-2">{card.description}</p>
          )}

          {/* Property Info */}
          {card.property && (
            <div className="text-xs text-gray-600">
              <div className="font-medium">{card.property.name}</div>
              <div className="text-gray-500">{card.property.city}, {card.property.state}</div>
            </div>
          )}
          
          <div className="flex items-center justify-between">
            {card.priority && (
              <Badge variant="secondary" className={cn(
                "text-xs px-2 py-0.5",
                card.priority === "urgent" && "bg-red-100 text-red-700",
                card.priority === "high" && "bg-orange-100 text-orange-700",
                card.priority === "medium" && "bg-yellow-100 text-yellow-700",
                card.priority === "low" && "bg-green-100 text-green-700"
              )}>
                {card.priority.toUpperCase()}
              </Badge>
            )}
            {/* Cost */}
            {card.cost && (
              <div className="text-xs font-semibold text-gray-900">
                ${parseFloat(card.cost).toLocaleString()}
              </div>
            )}
          </div>

          {/* Due Date */}
          {card.dueDate && card.dueInDays !== null && card.dueInDays !== undefined && (
            <div className="text-xs">
              <span className={card.isOverdue ? "text-red-600 font-medium" : "text-gray-500"}>
                {card.isOverdue ? `${Math.abs(card.dueInDays)} days overdue` : 
                 card.dueInDays === 0 ? "Due today" :
                 card.dueInDays === 1 ? "Due tomorrow" :
                 `Due in ${card.dueInDays} days`}
              </span>
            </div>
          )}

          {card.tags && card.tags.length > 0 && (
            <div className="flex gap-1 flex-wrap">
              {card.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="text-xs px-1.5 py-0 h-4 text-gray-600 border-gray-200">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {card.assignee && (
            <div className="flex items-center text-xs text-gray-500">
              <div className="w-4 h-4 bg-gray-200 rounded-full mr-1.5 flex items-center justify-center text-xs">
                {card.assignee.name.substring(0, 2).toUpperCase()}
              </div>
              <span className="truncate">{card.assignee.name}</span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

// Column Component
interface KanbanColumnProps {
  column: KanbanColumn;
}

export const KanbanColumn = ({ column }: KanbanColumnProps) => {
  return (
    <div className="flex flex-col min-h-96 flex-1 min-w-[280px] border-r border-gray-200 last:border-r-0">
      <div className="bg-gray-50 border-b border-gray-200 px-3 py-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {column.icon}
            <h3 className="font-semibold text-sm text-gray-900">{column.title}</h3>
          </div>
          <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-white/60 text-xs font-medium text-gray-600">
            {column.cards.length}
          </span>
        </div>
      </div>
      
      <SortableContext items={column.cards} strategy={verticalListSortingStrategy}>
        <div className="flex-1 p-2 bg-gray-50/30 min-h-80">
          {column.cards.map((card) => (
            <SortableCard key={card.id} card={card} columnId={column.id} />
          ))}
          {column.cards.length === 0 && (
            <div className="text-center text-gray-500 text-sm py-8">
              No items in this column
            </div>
          )}
        </div>
      </SortableContext>
    </div>
  );
};

// Export additional components for external use
export const KanbanBoard = ({ children, id }: { children: React.ReactNode; id?: string }) => {
  return <>{children}</>;
};

export const KanbanCards = ({ children, id }: { children: React.ReactNode | ((item: KanbanCard) => React.ReactNode); id?: string }) => {
  // For now, we'll assume this component doesn't need to iterate over data
  // It should be handled by the parent component
  return <>{children}</>;
};

export const KanbanHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="kanban-header">{children}</div>;
};

export const KanbanCard = Card;

// Main Kanban Component
export const Kanban = () => {
  const { data, setData, onCardMove } = useKanban();
  const [activeCard, setActiveCard] = useState<KanbanCard | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 200,
        tolerance: 6,
      },
    }),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const { card } = active.data.current as { card: KanbanCard };
    setActiveCard(card);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeCardId = active.id as string;
    const overId = over.id as string;

    // Find the active card and its column
    const activeColumn = data.columns.find(col => 
      col.cards.some(card => card.id === activeCardId)
    );
    const activeCard = activeColumn?.cards.find(card => card.id === activeCardId);

    if (!activeCard || !activeColumn) return;

    // Find the over column
    let overColumn = data.columns.find(col => col.id === overId);
    if (!overColumn) {
      // If over a card, find its column
      overColumn = data.columns.find(col => 
        col.cards.some(card => card.id === overId)
      );
    }

    if (!overColumn || activeColumn.id === overColumn.id) return;

    setData(prevData => {
      const newColumns = prevData.columns.map(col => {
        if (col.id === activeColumn.id) {
          return {
            ...col,
            cards: col.cards.filter(card => card.id !== activeCardId)
          };
        }
        if (col.id === overColumn.id) {
          return {
            ...col,
            cards: [...col.cards, { ...activeCard, status: overColumn.id }]
          };
        }
        return col;
      });

      return { columns: newColumns };
    });

    // Call the external callback
    if (onCardMove) {
      onCardMove(activeCardId, activeColumn.id, overColumn.id);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const activeCardId = active.id as string;
    const overCardId = over.id as string;

    if (activeCardId === overCardId) return;

    // Handle reordering within the same column
    const activeColumn = data.columns.find(col => 
      col.cards.some(card => card.id === activeCardId)
    );
    const overColumn = data.columns.find(col => 
      col.cards.some(card => card.id === overCardId)
    );

    if (activeColumn && overColumn && activeColumn.id === overColumn.id) {
      setData(prevData => {
        const columnIndex = prevData.columns.findIndex(col => col.id === activeColumn.id);
        const activeIndex = activeColumn.cards.findIndex(card => card.id === activeCardId);
        const overIndex = activeColumn.cards.findIndex(card => card.id === overCardId);

        const newCards = arrayMove(activeColumn.cards, activeIndex, overIndex);
        
        const newColumns = [...prevData.columns];
        newColumns[columnIndex] = { ...activeColumn, cards: newCards };

        return { columns: newColumns };
      });
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex flex-col lg:flex-row bg-white rounded-lg border border-gray-200 overflow-x-auto">
        {data.columns.map((column) => (
          <KanbanColumn key={column.id} column={column} />
        ))}
      </div>

      <DragOverlay>
        {activeCard ? (
          <Card className="cursor-grabbing rotate-3 shadow-lg">
            <CardContent className="p-3">
              <div className="space-y-2">
                <h4 className="font-semibold text-sm text-gray-900">{activeCard.title}</h4>
                {activeCard.description && (
                  <p className="text-xs text-gray-600 line-clamp-2">{activeCard.description}</p>
                )}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
};