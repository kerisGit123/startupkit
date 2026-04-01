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
    <div className="p-4 border-b border-[#3D3D3D]">
      {/* Status Filters Only */}
      <div className="flex gap-2 flex-wrap">
        {['completed', 'processing', 'error'].map(status => (
          <button
            key={status}
            onClick={() => toggleFilter('statuses', status)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
              filters.statuses.includes(status)
                ? status === 'completed' ? 'bg-green-500/20 text-green-400' :
                  status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
                  status === 'error' ? 'bg-red-500/20 text-red-400' :
                  'bg-gray-500/20 text-gray-400'
                : 'bg-[#1A1A1A] text-[#A0A0A0] hover:bg-[#2C2C2C]'
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
