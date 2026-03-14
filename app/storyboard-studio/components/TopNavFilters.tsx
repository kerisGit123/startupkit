import { useState, useEffect } from "react";
import { Filter, Star } from "lucide-react";

interface TopNavFiltersProps {
  onFiltersChange: (filters: {
    favorite: boolean;
    status?: ("Draft" | "In Progress" | "Completed" | "On Hold")[];
    frameStatus?: ('draft' | 'in-progress' | 'completed')[];
  }) => void;
  projectCount?: number;
  isStoryboard?: boolean; // NEW: Differentiate between projects and storyboard
}

const PROJECT_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft", color: "bg-gray-500" },
  { value: "In Progress", label: "In Progress", color: "bg-blue-500" },
  { value: "Completed", label: "Completed", color: "bg-green-500" },
  { value: "On Hold", label: "On Hold", color: "bg-zinc-500" },
];

// NEW: Frame status options
const FRAME_STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-gray-500" },
  { value: "in-progress", label: "In Progress", color: "bg-blue-500" },
  { value: "completed", label: "Completed", color: "bg-green-500" },
];

export function TopNavFilters({ 
  onFiltersChange, 
  projectCount = 0,
  isStoryboard = false 
}: TopNavFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [selectedProjectStatuses, setSelectedProjectStatuses] = useState<("Draft" | "In Progress" | "Completed" | "On Hold")[]>([]);
  const [selectedFrameStatuses, setSelectedFrameStatuses] = useState<('draft' | 'in-progress' | 'completed')[]>([]);

  // Update filters when they change
  useEffect(() => {
    onFiltersChange({
      favorite: favoriteOnly,
      status: isStoryboard ? undefined : selectedProjectStatuses,
      frameStatus: isStoryboard ? selectedFrameStatuses : undefined,
    });
  }, [favoriteOnly, selectedProjectStatuses, selectedFrameStatuses, onFiltersChange, isStoryboard]);

  const handleProjectStatusToggle = (status: "Draft" | "In Progress" | "Completed" | "On Hold") => {
    setSelectedProjectStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  // NEW: Frame status handler
  const handleFrameStatusToggle = (status: 'draft' | 'in-progress' | 'completed') => {
    setSelectedFrameStatuses(prev => 
      prev.includes(status) 
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const handleFavoriteToggle = () => {
    setFavoriteOnly(!favoriteOnly);
  };

  const clearAllFilters = () => {
    setSelectedProjectStatuses([]);
    setSelectedFrameStatuses([]);
    setFavoriteOnly(false);
  };

  const hasActiveFilters = favoriteOnly || (!isStoryboard && selectedProjectStatuses.length > 0) || (isStoryboard && selectedFrameStatuses.length > 0);

  return (
    <div className="relative">
      {/* Filter Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          relative flex items-center gap-2.5 px-4 py-2.5 rounded-xl border
          transition-all duration-200 bg-[#1a1a24] border-white/10
          hover:border-white/20 hover:bg-[#222238]
          ${hasActiveFilters ? "border-white/30 bg-[#222238]" : ""}
        `}
      >
        <Filter className="w-4 h-4 text-gray-400" />
        <span className="text-sm text-white">Filters</span>
        
        {/* Active filters indicator */}
        {hasActiveFilters && (
          <div className="w-2 h-2 bg-blue-400 rounded-full" />
        )}
      </button>

      {/* Filters Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown */}
          <div className="absolute top-full left-0 mt-2 w-80 bg-[#1c1c26] border border-white/10 
                        rounded-xl shadow-2xl z-50 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-sm font-medium text-white">Filters</h3>
              {hasActiveFilters && (
                <button
                  onClick={clearAllFilters}
                  className="text-xs text-gray-400 hover:text-white transition-colors"
                >
                  Clear all
                </button>
              )}
            </div>

            {!isStoryboard && (
              <div className="p-4 border-b border-white/10">
                <h4 className="text-xs font-medium text-gray-400 mb-3">Project Status</h4>
                <div className="space-y-2">
                  {PROJECT_STATUS_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedProjectStatuses.includes(option.value as "Draft" | "In Progress" | "Completed" | "On Hold")}
                        onChange={() => handleProjectStatusToggle(option.value as "Draft" | "In Progress" | "Completed" | "On Hold")}
                        className="w-4 h-4 rounded border-white/20 bg-[#2a2a3e] 
                                   text-blue-400 focus:ring-0 focus:ring-offset-0"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        <span className="text-sm text-white group-hover:text-gray-300">
                          {option.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Frame Status Filter (only for storyboard) */}
            {isStoryboard && (
              <div className="p-4 border-b border-white/10">
                <h4 className="text-xs font-medium text-gray-400 mb-3">Frame Status</h4>
                <div className="space-y-2">
                  {FRAME_STATUS_OPTIONS.map(option => (
                    <label
                      key={option.value}
                      className="flex items-center gap-3 cursor-pointer group"
                    >
                      <input
                        type="checkbox"
                        checked={selectedFrameStatuses.includes(option.value as 'draft' | 'in-progress' | 'completed')}
                        onChange={() => handleFrameStatusToggle(option.value as 'draft' | 'in-progress' | 'completed')}
                        className="w-4 h-4 rounded border-white/20 bg-[#2a2a3e] 
                                   text-blue-400 focus:ring-0 focus:ring-offset-0"
                      />
                      <div className="flex items-center gap-2 flex-1">
                        <div className={`w-2 h-2 rounded-full ${option.color}`} />
                        <span className="text-sm text-white group-hover:text-gray-300">
                          {option.label}
                        </span>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Favorite Filter */}
            <div className="p-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={favoriteOnly}
                  onChange={handleFavoriteToggle}
                  className="w-4 h-4 rounded border-white/20 bg-[#2a2a3e] 
                             text-blue-400 focus:ring-0 focus:ring-offset-0"
                />
                <div className="flex items-center gap-2 flex-1">
                  <Star className="w-4 h-4 text-yellow-400" />
                  <span className="text-sm text-white group-hover:text-gray-300">
                    Favorites only
                  </span>
                </div>
              </label>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 bg-[#161622] border-t border-white/10">
              <div className="text-xs text-gray-400">
                {projectCount} {isStoryboard ? 'frames' : 'projects'} found
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
