import { Star } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

interface SidebarFavoritesProps {
  favoriteCount: number;
  totalCount: number;
  isActive?: boolean;
}

export function SidebarFavorites({ 
  favoriteCount, 
  totalCount, 
  isActive = false 
}: SidebarFavoritesProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleToggle = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    if (isActive) {
      params.delete("favorite");
    } else {
      params.set("favorite", "true");
    }
    
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  return (
    <button
      onClick={handleToggle}
      className={`
        w-full flex items-center justify-between px-4 py-3 rounded-xl
        transition-all duration-200 group
        ${isActive 
          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30" 
          : "text-gray-400 hover:text-white hover:bg-white/5 border border-transparent"
        }
      `}
    >
      <div className="flex items-center gap-3">
        <div className={`
          p-2 rounded-lg transition-all duration-200
          ${isActive 
            ? "bg-blue-500/20 text-blue-400" 
            : "bg-white/5 text-gray-400 group-hover:bg-white/10 group-hover:text-white"
          }
        `}>
          <Star className={`w-4 h-4 ${isActive ? "fill-current" : ""}`} />
        </div>
        <div className="text-left">
          <div className="text-sm font-medium">Favorites</div>
          <div className="text-xs text-gray-500">
            {favoriteCount} of {totalCount} projects
          </div>
        </div>
      </div>
      
      {favoriteCount > 0 && (
        <div className={`
          px-2 py-1 rounded-full text-xs font-medium
          ${isActive 
            ? "bg-blue-500/30 text-blue-300" 
            : "bg-white/10 text-gray-400 group-hover:bg-white/20 group-hover:text-white"
          }
        `}>
          {favoriteCount}
        </div>
      )}
    </button>
  );
}
