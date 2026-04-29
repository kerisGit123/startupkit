import { useState, useEffect } from "react";
import { Filter, Star } from "lucide-react";

interface TopNavFiltersProps {
  onFiltersChange: (filters: {
    favorite: boolean;
    status?: ("Draft" | "In Progress" | "Completed" | "On Hold")[];
    frameStatus?: ('draft' | 'in-progress' | 'completed')[];
  }) => void;
  projectCount?: number;
  isStoryboard?: boolean;
}

const PROJECT_STATUS_OPTIONS = [
  { value: "Draft", label: "Draft", color: "bg-(--text-tertiary)" },
  { value: "In Progress", label: "In Progress", color: "bg-(--accent-blue)" },
  { value: "Completed", label: "Completed", color: "bg-(--accent-teal)" },
  { value: "On Hold", label: "On Hold", color: "bg-(--color-warning)" },
];

const FRAME_STATUS_OPTIONS = [
  { value: "draft", label: "Draft", color: "bg-(--text-tertiary)" },
  { value: "in-progress", label: "In Progress", color: "bg-(--accent-blue)" },
  { value: "completed", label: "Completed", color: "bg-(--accent-teal)" },
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

  useEffect(() => {
    onFiltersChange({
      favorite: favoriteOnly,
      status: isStoryboard ? undefined : selectedProjectStatuses,
      frameStatus: isStoryboard ? selectedFrameStatuses : undefined,
    });
  }, [favoriteOnly, selectedProjectStatuses, selectedFrameStatuses, onFiltersChange, isStoryboard]);

  const handleProjectStatusToggle = (status: "Draft" | "In Progress" | "Completed" | "On Hold") => {
    setSelectedProjectStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const handleFrameStatusToggle = (status: 'draft' | 'in-progress' | 'completed') => {
    setSelectedFrameStatuses(prev =>
      prev.includes(status) ? prev.filter(s => s !== status) : [...prev, status]
    );
  };

  const clearAllFilters = () => {
    setSelectedProjectStatuses([]);
    setSelectedFrameStatuses([]);
    setFavoriteOnly(false);
  };

  const hasActiveFilters = favoriteOnly || (!isStoryboard && selectedProjectStatuses.length > 0) || (isStoryboard && selectedFrameStatuses.length > 0);
  const activeCount = (favoriteOnly ? 1 : 0) +
    (isStoryboard ? selectedFrameStatuses.length : selectedProjectStatuses.length);

  return (
    <div className="relative">
      {/* Filter trigger — matches toolbar control style */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
          hasActiveFilters
            ? "text-(--text-primary) bg-white/10"
            : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
        }`}
      >
        <Filter className="w-3.5 h-3.5" strokeWidth={1.75} />
        Filters
        {activeCount > 0 && (
          <span className="min-w-[16px] h-4 flex items-center justify-center rounded-full bg-(--accent-blue) text-white text-[9px] font-semibold px-1">
            {activeCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)} />
          <div className="absolute top-full right-0 mt-1 w-[240px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 py-1.5">
            {/* Header */}
            <div className="flex items-center justify-between px-3 pt-2 pb-1.5">
              <span className="text-[10px] font-semibold tracking-wider uppercase text-(--text-tertiary)">Filters</span>
              {hasActiveFilters && (
                <button onClick={clearAllFilters} className="text-[10px] text-(--accent-blue) hover:text-(--text-primary) font-medium transition-colors">
                  Clear all
                </button>
              )}
            </div>

            <div className="h-px bg-(--border-primary) mx-2 my-1" />

            {/* Status filters */}
            <div className="px-2 py-1">
              <span className="px-1 text-[10px] font-semibold tracking-wider uppercase text-(--text-tertiary)">
                {isStoryboard ? "Frame Status" : "Project Status"}
              </span>
              <div className="mt-1.5 space-y-0.5">
                {(isStoryboard ? FRAME_STATUS_OPTIONS : PROJECT_STATUS_OPTIONS).map(option => {
                  const isSelected = isStoryboard
                    ? selectedFrameStatuses.includes(option.value as any)
                    : selectedProjectStatuses.includes(option.value as any);
                  return (
                    <button
                      key={option.value}
                      onClick={() => isStoryboard
                        ? handleFrameStatusToggle(option.value as any)
                        : handleProjectStatusToggle(option.value as any)
                      }
                      className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] transition-colors ${
                        isSelected
                          ? "bg-white/8 text-(--text-primary)"
                          : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full ${option.color}`} />
                      <span className="font-medium">{option.label}</span>
                      {isSelected && (
                        <svg className="w-3.5 h-3.5 ml-auto text-(--accent-blue)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="h-px bg-(--border-primary) mx-2 my-1" />

            {/* Favorite filter */}
            <div className="px-2 py-1">
              <button
                onClick={() => setFavoriteOnly(!favoriteOnly)}
                className={`w-full flex items-center gap-2.5 px-2 py-2 rounded-md text-[13px] transition-colors ${
                  favoriteOnly
                    ? "bg-white/8 text-(--text-primary)"
                    : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${favoriteOnly ? "text-amber-400 fill-amber-400" : "text-(--text-tertiary)"}`} strokeWidth={1.75} />
                <span className="font-medium">Favorites only</span>
                {favoriteOnly && (
                  <svg className="w-3.5 h-3.5 ml-auto text-(--accent-blue)" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
            </div>

            {/* Footer */}
            <div className="h-px bg-(--border-primary) mx-2 my-1" />
            <div className="px-3 py-1.5">
              <span className="text-[11px] text-(--text-tertiary) tabular-nums">
                {projectCount} {isStoryboard ? "frames" : "projects"}
              </span>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
