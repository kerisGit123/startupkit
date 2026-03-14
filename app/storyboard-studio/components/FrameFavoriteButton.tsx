import { useState } from "react";
import { Star } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";

interface FrameFavoriteButtonProps {
  frameId: string;
  isFavorite: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

export function FrameFavoriteButton({ 
  frameId, 
  isFavorite: initialFavorite,
  size = "md",
  showLabel = false,
  className = ""
}: FrameFavoriteButtonProps) {
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [isLoading, setIsLoading] = useState(false);
  
  const updateFavorite = useMutation(api.storyboard.storyboardItems.updateFavorite);

  const handleToggle = async (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent frame selection
    e.preventDefault();
    
    if (isLoading) return;
    
    setIsLoading(true);
    
    try {
      const newFavoriteState = !isFavorite;
      await updateFavorite({ 
        id: frameId as any, 
        isFavorite: newFavoriteState 
      });
      setIsFavorite(newFavoriteState);
    } catch (error) {
      console.error("Failed to update favorite:", error);
      // Revert on error
      setIsFavorite(isFavorite);
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
      disabled={isLoading}
      className={`
        ${containerClasses[size]}
        rounded-lg backdrop-blur-md transition-all duration-200
        ${isFavorite 
          ? "bg-yellow-400/20 text-yellow-400 border border-yellow-400/30" 
          : "bg-black/40 text-white/60 border border-white/10 hover:text-white hover:bg-white/10"
        }
        ${isLoading ? "opacity-50 cursor-not-allowed" : "hover:scale-105"}
        ${className}
      `}
      title={isFavorite ? "Remove from favorites" : "Add to favorites"}
    >
      <div className="flex items-center gap-2">
        <Star 
          className={`${sizeClasses[size]} ${isFavorite ? "fill-current" : ""}`} 
        />
        {showLabel && (
          <span className="text-xs">
            {isFavorite ? "Favorited" : "Favorite"}
          </span>
        )}
      </div>
    </button>
  );
}
