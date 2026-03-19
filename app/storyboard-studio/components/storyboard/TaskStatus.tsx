"use client";

import { CheckCircle, AlertCircle, Loader2, Clock, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

// Task status configuration for different types and states
const TASK_STATUS_CONFIG = {
  // Processing states
  processing: { 
    icon: Loader2, 
    color: "bg-blue-100 text-blue-800 border-blue-200",
    textColor: "text-blue-600",
    spin: true
  },
  
  // Ready states
  ready: { 
    icon: CheckCircle, 
    color: "bg-green-100 text-green-800 border-green-200",
    textColor: "text-green-600",
    spin: false
  },
  
  // Error states
  error: { 
    icon: AlertCircle, 
    color: "bg-red-100 text-red-800 border-red-200",
    textColor: "text-red-600",
    spin: false
  },
  
  // Idle states
  idle: { 
    icon: Clock, 
    color: "bg-gray-100 text-gray-800 border-gray-200",
    textColor: "text-gray-600",
    spin: false
  }
};

// Task type icons for different build types
const TASK_TYPE_ICONS = {
  normal: Clock,
  ai_enhanced: Sparkles,
  image: CheckCircle,
  video: CheckCircle,
  script: CheckCircle
};

interface TaskStatusProps {
  taskStatus?: string;
  taskMessage?: string;
  taskType?: string;
  progress?: number;
  className?: string;
  size?: "sm" | "md" | "lg";
  showProgress?: boolean;
}

export function TaskStatus({ 
  taskStatus = "idle", 
  taskMessage, 
  taskType = "normal", 
  progress,
  className,
  size = "md",
  showProgress = false 
}: TaskStatusProps) {
  const statusConfig = TASK_STATUS_CONFIG[taskStatus as keyof typeof TASK_STATUS_CONFIG] || TASK_STATUS_CONFIG.idle;
  const StatusIcon = statusConfig.icon;
  const TypeIcon = TASK_TYPE_ICONS[taskType as keyof typeof TASK_TYPE_ICONS] || TASK_TYPE_ICONS.normal;
  
  const sizeClasses = {
    sm: "text-xs px-2 py-1",
    md: "text-sm px-3 py-1.5",
    lg: "text-sm px-4 py-2"
  };
  
  const iconSizes = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5"
  };

  return (
    <div className={cn(
      "inline-flex items-center gap-2 rounded-full border transition-all",
      statusConfig.color,
      sizeClasses[size],
      className
    )}>
      {/* Status icon with spinning animation */}
      <div className={cn(
        "flex items-center justify-center",
        iconSizes[size],
        statusConfig.spin && "animate-spin"
      )}>
        <StatusIcon className={statusConfig.textColor} />
      </div>
      
      {/* Task type icon */}
      {taskType !== "normal" && (
        <div className={cn(
          "flex items-center justify-center",
          iconSizes[size],
          statusConfig.textColor
        )}>
          <TypeIcon />
        </div>
      )}
      
      {/* Status message */}
      {taskMessage && (
        <span className={cn(
          "font-medium",
          statusConfig.textColor
        )}>
          {taskMessage}
        </span>
      )}
      
      {/* Progress bar */}
      {showProgress && progress !== undefined && taskStatus === "processing" && (
        <div className="w-16 bg-gray-200 rounded-full h-1.5">
          <div 
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}

// Compact version for cards
export function TaskStatusBadge({ 
  taskStatus = "idle", 
  taskMessage, 
  taskType = "normal",
  className 
}: Omit<TaskStatusProps, 'size' | 'showProgress'>) {
  return (
    <TaskStatus
      taskStatus={taskStatus}
      taskMessage={taskMessage}
      taskType={taskType}
      className={cn("shrink-0", className)}
      size="sm"
    />
  );
}

// Full version for detailed views
export function TaskStatusCard({ 
  taskStatus = "idle", 
  taskMessage, 
  taskType = "normal",
  progress,
  className 
}: TaskStatusProps) {
  return (
    <TaskStatus
      taskStatus={taskStatus}
      taskMessage={taskMessage}
      taskType={taskType}
      progress={progress}
      showProgress={true}
      className={cn("w-full justify-center", className)}
      size="lg"
    />
  );
}
