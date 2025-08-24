"use client";

import { cn } from "@/lib/utils";
import { Check } from "lucide-react";

interface Stage {
  id: string;
  name: string;
  slug: string;
  sequence: number;
  color: string;
  icon?: string;
}

interface StageProgressProps {
  stages: Stage[];
  currentStageId: string | null;
  className?: string;
  showLabels?: boolean;
}

export function StageProgress({ 
  stages, 
  currentStageId, 
  className,
  showLabels = true 
}: StageProgressProps) {
  const sortedStages = [...stages].sort((a, b) => a.sequence - b.sequence);
  const currentStageIndex = sortedStages.findIndex(s => s.id === currentStageId);
  
  return (
    <div className={cn("w-full", className)}>
      <div className="relative">
        {/* Progress Line */}
        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-200">
          <div 
            className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
            style={{ 
              width: currentStageIndex >= 0 
                ? `${(currentStageIndex / (sortedStages.length - 1)) * 100}%` 
                : '0%' 
            }}
          />
        </div>
        
        {/* Stage Points */}
        <div className="relative flex justify-between">
          {sortedStages.map((stage, index) => {
            const isPast = currentStageIndex > index;
            const isCurrent = currentStageIndex === index;
            const isFuture = currentStageIndex < index;
            
            return (
              <div 
                key={stage.id} 
                className="flex flex-col items-center"
              >
                {/* Circle */}
                <div
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 z-10 relative",
                    isPast && "bg-green-500 text-white",
                    isCurrent && "bg-blue-500 text-white ring-4 ring-blue-100 scale-110",
                    isFuture && "bg-gray-200 text-gray-400"
                  )}
                  style={{
                    backgroundColor: isCurrent ? stage.color : undefined
                  }}
                >
                  {isPast ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <span className="text-xs font-semibold">{index + 1}</span>
                  )}
                </div>
                
                {/* Label */}
                {showLabels && (
                  <div className="mt-2 text-center">
                    <p className={cn(
                      "text-xs font-medium transition-colors",
                      isCurrent && "text-blue-600",
                      isPast && "text-green-600",
                      isFuture && "text-gray-400"
                    )}>
                      {stage.name}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function StageProgressCompact({ 
  stages, 
  currentStageId, 
  className 
}: StageProgressProps) {
  const sortedStages = [...stages].sort((a, b) => a.sequence - b.sequence);
  const currentStageIndex = sortedStages.findIndex(s => s.id === currentStageId);
  
  if (currentStageIndex === -1) return null;
  
  const currentStage = sortedStages[currentStageIndex];
  const progress = ((currentStageIndex + 1) / sortedStages.length) * 100;
  
  return (
    <div className={cn("space-y-2", className)}>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Stage {currentStageIndex + 1} of {sortedStages.length}: {currentStage.name}
        </span>
        <span className="text-sm text-muted-foreground">
          {Math.round(progress)}% Complete
        </span>
      </div>
      <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-green-500 to-blue-500 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}