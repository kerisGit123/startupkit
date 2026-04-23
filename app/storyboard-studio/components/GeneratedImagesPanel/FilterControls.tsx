"use client";

import React from "react";

interface FilterState {
  statuses: string[];
  sortBy: string;
  generatingCount?: number;
  completedCount?: number;
  errorCount?: number;
}

interface FilterControlsProps {
  filters: FilterState;
  onFilterChange: (filters: Partial<FilterState>) => void;
}

export function FilterControls({ filters, onFilterChange }: FilterControlsProps) {
  const toggleFilter = (type: 'statuses', value: string) => {
    const currentFilters = filters.statuses;
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(item => item !== value)
      : [...currentFilters, value];
    
    onFilterChange({ statuses: newFilters });
  };

  return (
    <div className="px-4 py-3 border-b border-(--border-primary)">
      <div className="flex gap-1.5 flex-wrap">
        {['completed', 'processing', 'error'].map(status => (
          <button
            key={status}
            onClick={() => toggleFilter('statuses', status)}
            className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition ${
              filters.statuses.includes(status)
                ? status === 'completed' ? 'bg-green-500/15 text-green-400' :
                  status === 'processing' ? 'bg-blue-500/15 text-blue-400' :
                  status === 'error' ? 'bg-red-500/15 text-red-400' :
                  'bg-white/10 text-[#E5E7EB]'
                : 'bg-(--bg-secondary) text-(--text-secondary) hover:bg-(--bg-tertiary) border border-[#32363E]'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'processing' && ` (${filters.generatingCount || 0})`}
            {status === 'completed' && ` (${filters.completedCount || 0})`}
            {status === 'error' && `(${filters.errorCount || 0})`}
          </button>
        ))}
      </div>
    </div>
  );
}
