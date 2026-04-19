import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FramePrimaryImageButtonProps {
  frameId: string;
  isPrimary: boolean;
  imageUrl?: string;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  onSetPrimary?: (frameId: string, imageUrl: string) => void;
}

export function FramePrimaryImageButton({ 
  frameId, 
  isPrimary: initialPrimary,
  imageUrl,
  size = "md",
  showLabel = false,
  className = "",
  onSetPrimary
}: FramePrimaryImageButtonProps) {
  const [isPrimary, setIsPrimary] = useState(initialPrimary);
  const [isLoading, setIsLoading] = useState(false);
  
  const setPrimaryImage = useMutation(api.storyboard.storyboardItems.setPrimaryImage);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent frame selection
    e.preventDefault();
    
    if (isLoading || !imageUrl) return;
    
    setIsLoading(true);
    
    try {
      if (!isPrimary) {
        // Set as primary image
        await setPrimaryImage({
          itemId: frameId as any,
          primaryImageUrl: imageUrl,
        });
        setIsPrimary(true);
        onSetPrimary?.(frameId, imageUrl);
      } else {
        // Note: We don't unset primary image here, only set it on another item
        // The primary image gets cleared when another item is set as primary
        console.log("Primary image can only be changed by setting another item as primary");
      }
    } catch (error) {
      console.error("Failed to set primary image:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5", 
    lg: "w-6 h-6"
  };

  const containerClasses = {
    sm: "p-1.5",
    md: "p-2",
    lg: "p-2.5"
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isLoading || !imageUrl}
      className={`
        ${containerClasses[size]}
        rounded-lg backdrop-blur-md transition-all duration-200
        ${isPrimary 
          ? "bg-blue-400/20 text-blue-400 border border-blue-400/30" 
          : "bg-black/40 text-white/60 border border-white/10 hover:text-white hover:bg-white/10"
        }
        ${isLoading || !imageUrl ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
        ${className}
      `}
      title={isPrimary ? "Primary image" : imageUrl ? "Set as primary image" : "No image available"}
    >
      <div className="flex items-center gap-2">
        <ImageIcon 
          className={`${sizeClasses[size]} ${isPrimary ? "fill-current" : ""}`} 
        />
        {showLabel && (
          <span className="text-xs">
            {isPrimary ? "Primary" : "Set Primary"}
          </span>
        )}
      </div>
    </button>
  );
}
