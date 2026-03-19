"use client";

import { useQuery } from "convex/react";
import { getBuildStatus } from "@/convex/storyboard/build";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Clock } from "lucide-react";

interface StoryboardCardProps {
  projectId: string; // Changed from storyboardId to projectId
  title: string;
  description?: string;
  className?: string;
}

// Task status configuration
const taskStatusConfig = {
  idle: {
    color: "bg-gray-100 text-gray-800",
    icon: Clock,
    label: "Ready to Build"
  },
  processing: {
    color: "bg-blue-100 text-blue-800",
    icon: Loader2,
    label: "Processing",
    animate: true
  },
  ready: {
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    label: "Build Completed"
  },
  error: {
    color: "bg-red-100 text-red-800",
    icon: AlertCircle,
    label: "Build Failed"
  }
};

export function StoryboardCard({ 
  projectId, // Changed from storyboardId to projectId
  title, 
  description, 
  className = "" 
}: StoryboardCardProps) {
  const { data: buildStatus, isLoading } = useQuery(getBuildStatus, { projectId }); // Changed from storyboardId to projectId

  const status = buildStatus?.taskStatus || "idle";
  const message = buildStatus?.taskMessage || "";
  const taskType = buildStatus?.taskType || "";

  const statusConfig = taskStatusConfig[status as keyof typeof taskStatusConfig];
  const StatusIcon = statusConfig.icon;

  return (
    <div className={`rounded-xl border border-gray-200 p-6 space-y-4 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {description && (
            <p className="text-sm text-gray-500">{description}</p>
          )}
        </div>
        
        {/* Status Badge */}
        <Badge className={`${statusConfig.color} flex items-center gap-2`}>
          <StatusIcon 
            className={`w-4 h-4 ${statusConfig.animate ? "animate-spin" : ""}`} 
          />
          {statusConfig.label}
        </Badge>
      </div>

      {/* Status Message */}
      {message && (
        <div className="flex items-center gap-2 text-sm">
          <StatusIcon 
            className={`w-4 h-4 ${statusConfig.animate ? "animate-spin" : ""} text-gray-400`} 
          />
          <span className="text-gray-600">{message}</span>
        </div>
      )}

      {/* Task Type Badge */}
      {taskType && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">Task Type:</span>
          <Badge variant="outline" className="text-xs">
            {taskType}
          </Badge>
        </div>
      )}

      {/* Progress Indicator for Processing */}
      {status === "processing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Build Progress</span>
            <span>Processing...</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        <button
          className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
          onClick={() => {
            // TODO: Open build dialog
            console.log("Open build dialog for:", projectId);
          }}
        >
          Build Storyboard
        </button>
        <button
          className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium"
          onClick={() => {
            // TODO: View storyboard details
            console.log("View details for:", projectId);
          }}
        >
          View
        </button>
      </div>
    </div>
  );
}
