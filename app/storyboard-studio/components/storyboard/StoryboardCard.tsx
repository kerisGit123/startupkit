"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { getBuildStatus } from "@/convex/storyboard/build";
import { api } from "@/convex/_generated/api";
import { Badge } from "@/components/ui/badge";
import { Loader2, CheckCircle, AlertCircle, Clock, Star, MoreHorizontal, X, Trash2 } from "lucide-react";

interface StoryboardCardProps {
  projectId: string; // Changed from storyboardId to projectId
  title: string;
  description?: string;
  imageUrl?: string; // Image URL for the project's main image
  className?: string;
  onImageRemoved?: () => void; // Callback when image is removed
}

// Task status configuration - LTX Theme
const taskStatusConfig = {
  idle: {
    color: "bg-(--bg-tertiary) text-(--text-secondary) border border-(--border-primary)",
    icon: Clock,
    label: "Ready to Build"
  },
  processing: {
    color: "bg-(--accent-blue)/20 text-(--accent-blue) border border-(--accent-blue)/30",
    icon: Loader2,
    label: "Processing",
    animate: true
  },
  ready: {
    color: "bg-(--accent-teal)/20 text-(--accent-teal) border border-(--accent-teal)/30",
    icon: CheckCircle,
    label: "Build Completed"
  },
  error: {
    color: "bg-(--color-error)/20 text-(--color-error) border border-(--color-error)/30",
    icon: AlertCircle,
    label: "Build Failed"
  }
};

export function StoryboardCard({ 
  projectId, // Changed from storyboardId to projectId
  title, 
  description, 
  imageUrl,
  className = "",
  onImageRemoved
}: StoryboardCardProps) {
  const { data: buildStatus, isLoading } = useQuery(getBuildStatus, { projectId }); // Changed from storyboardId to projectId
  const updateProject = useMutation(api.storyboard.projects.update);
  
  // Context menu state
  const [showContextMenu, setShowContextMenu] = useState(false);
  const [contextMenuPosition, setContextMenuPosition] = useState({ top: 0, left: 0 });

  const status = buildStatus?.taskStatus || "idle";
  const message = buildStatus?.taskMessage || "";
  const taskType = buildStatus?.taskType || "";

  const statusConfig = taskStatusConfig[status as keyof typeof taskStatusConfig];
  const StatusIcon = statusConfig.icon;

  // Handle context menu
  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    setContextMenuPosition({
      top: rect.bottom + window.scrollY + 4,
      left: rect.right + window.scrollX - 180 // Adjusted for better positioning
    });
    setShowContextMenu(true);
  };

  const handleRemoveImage = async () => {
    try {
      await updateProject({
        id: projectId as any,
        imageUrl: undefined
      });
      onImageRemoved?.();
      setShowContextMenu(false);
      console.log("ImageUrl unset successfully from storyboard project");
    } catch (error) {
      console.error("Failed to unset ImageUrl:", error);
    }
  };

  const closeContextMenu = () => {
    setShowContextMenu(false);
  };

  return (
    <div className={`rounded-2xl border border-(--border-primary) bg-(--bg-secondary) p-6 space-y-4 transition-all duration-200 hover:border-(--accent-blue) hover:shadow-xl hover:shadow-(--accent-blue)/20 ${className}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h3 className="text-lg font-bold text-(--text-primary)">{title}</h3>
          {description && (
            <p className="text-sm text-(--text-tertiary)">{description}</p>
          )}
        </div>
        
        {/* Status Badge */}
        <div className="flex items-center gap-2">
          <Badge className={`${statusConfig.color} flex items-center gap-2 rounded-xl px-3 py-1.5 font-medium`}>
            <StatusIcon 
              className={`w-4 h-4 ${statusConfig.animate ? "animate-spin" : ""}`} 
            />
            {statusConfig.label}
          </Badge>
          
          {/* Context Menu Trigger */}
          <button
            onClick={handleContextMenu}
            className="p-1.5 rounded-lg hover:bg-(--bg-tertiary) transition-colors"
            title="More options"
          >
            <MoreHorizontal className="w-4 h-4 text-(--text-secondary)" />
          </button>
        </div>
      </div>

      {/* Image URL Display */}
      {imageUrl && (
        <div className="relative rounded-xl overflow-hidden bg-(--bg-primary)">
          <img 
            src={imageUrl} 
            alt={title} 
            className="w-full h-48 object-cover"
          />
          {/* Image URL Indicator */}
          <div className="absolute top-2 right-2">
            <div className="bg-yellow-500/90 backdrop-blur-sm rounded-full p-1.5 border border-white/20 shadow-lg">
              <Star className="w-3 h-3 text-white fill-current" />
            </div>
          </div>
        </div>
      )}

      {/* Status Message */}
      {message && (
        <div className="flex items-center gap-2 text-sm">
          <StatusIcon 
            className={`w-4 h-4 ${statusConfig.animate ? "animate-spin" : ""} text-(--text-tertiary)`} 
          />
          <span className="text-(--text-secondary)">{message}</span>
        </div>
      )}

      {/* Task Type Badge */}
      {taskType && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-(--text-tertiary)">Task Type:</span>
          <Badge variant="outline" className="text-xs border-(--border-primary) text-(--text-secondary) bg-(--bg-primary) rounded-xl">
            {taskType}
          </Badge>
        </div>
      )}

      {/* Progress Indicator for Processing */}
      {status === "processing" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-(--text-tertiary)">
            <span>Build Progress</span>
            <span>Processing...</span>
          </div>
          <div className="w-full bg-(--bg-primary) rounded-full h-2 border border-(--border-primary)">
            <div 
              className="bg-linear-to-r from-(--accent-blue) to-(--accent-teal) h-2 rounded-full animate-pulse"
              style={{ width: "60%" }}
            ></div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-3 pt-2">
        <button
          className="flex-1 px-4 py-3 bg-linear-to-r from-(--accent-blue) to-(--accent-teal) text-white rounded-xl font-medium hover:from-(--accent-blue-hover) hover:to-(--accent-teal-hover) transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
          onClick={() => {
            // TODO: Open build dialog
            console.log("Open build dialog for:", projectId);
          }}
        >
          Build Storyboard
        </button>
        <button
          className="px-4 py-3 border border-(--border-primary) bg-(--bg-primary) text-(--text-secondary) rounded-xl font-medium hover:bg-(--bg-tertiary) hover:border-(--accent-blue) hover:text-(--text-primary) transition-all duration-200 text-sm"
          onClick={() => {
            // TODO: View storyboard details
            console.log("View details for:", projectId);
          }}
        >
          View
        </button>
      </div>

      {/* Context Menu */}
      {showContextMenu && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={closeContextMenu}
          />
          
          {/* Context Menu */}
          <div 
            className="fixed bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[100] w-48 py-1.5"
            style={{ 
              top: `${contextMenuPosition.top}px`, 
              left: `${contextMenuPosition.left}px` 
            }}
          >
            {/* Remove ImageUrl Option */}
            {imageUrl && (
              <button
                onClick={handleRemoveImage}
                className="w-full flex items-center gap-2.5 px-4 py-2 hover:bg-(--bg-tertiary) text-(--color-error) text-xs transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                remove ImageUrl
              </button>
            )}
            
            {/* Add more menu items here as needed */}
          </div>
        </>
      )}
    </div>
  );
}
