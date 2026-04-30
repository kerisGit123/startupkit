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

  const getActiveColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-(--text-primary) border-white';
      case 'processing': return 'text-blue-400 border-blue-400';
      case 'error': return 'text-red-400 border-red-400';
      default: return 'text-(--text-primary) border-white';
    }
  };

  return (
    <div className="px-4 border-b border-(--border-primary)">
      <div className="flex items-center gap-0">
        {['completed', 'processing', 'error'].map(status => (
          <button
            key={status}
            onClick={() => toggleFilter('statuses', status)}
            className={`px-3 py-2.5 text-[12px] font-medium border-b-2 -mb-px transition-colors ${
              filters.statuses.includes(status)
                ? getActiveColor(status)
                : 'text-(--text-tertiary) hover:text-(--text-secondary) border-transparent'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status === 'processing' && ` (${filters.generatingCount || 0})`}
            {status === 'completed' && ` (${filters.completedCount || 0})`}
            {status === 'error' && ` (${filters.errorCount || 0})`}
          </button>
        ))}
      </div>
    </div>
  );
}
