import React from 'react';

interface DisplayFiltersProps {
  displayOptions: {
    showTags: boolean;
    showSubtitles: boolean;
    showScript: boolean;
    showNotes: boolean;
  };
  onChange: (options: {
    showTags: boolean;
    showSubtitles: boolean;
    showScript: boolean;
    showNotes: boolean;
  }) => void;
}

export function DisplayFilters({ displayOptions, onChange }: DisplayFiltersProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-(--bg-secondary) border border-(--border-primary) rounded-xl">
      <span className="text-xs text-(--text-tertiary) mr-2 font-medium">Display:</span>
      
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={displayOptions.showTags}
          onChange={(e) => onChange({ ...displayOptions, showTags: e.target.checked })}
          className="w-4 h-4 rounded border-(--border-primary) bg-(--bg-primary) text-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue) focus:ring-offset-1 focus:ring-offset-(--bg-secondary) transition-all duration-200"
        />
        <span className="text-xs text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">Tags</span>
      </label>
      
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={displayOptions.showSubtitles}
          onChange={(e) => onChange({ ...displayOptions, showSubtitles: e.target.checked })}
          className="w-4 h-4 rounded border-(--border-primary) bg-(--bg-primary) text-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue) focus:ring-offset-1 focus:ring-offset-(--bg-secondary) transition-all duration-200"
        />
        <span className="text-xs text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">Subtitles</span>
      </label>
      
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={displayOptions.showScript}
          onChange={(e) => onChange({ ...displayOptions, showScript: e.target.checked })}
          className="w-4 h-4 rounded border-(--border-primary) bg-(--bg-primary) text-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue) focus:ring-offset-1 focus:ring-offset-(--bg-secondary) transition-all duration-200"
        />
        <span className="text-xs text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">Script</span>
      </label>
      
      <label className="flex items-center gap-2 cursor-pointer group">
        <input
          type="checkbox"
          checked={displayOptions.showNotes}
          onChange={(e) => onChange({ ...displayOptions, showNotes: e.target.checked })}
          className="w-4 h-4 rounded border-(--border-primary) bg-(--bg-primary) text-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue) focus:ring-offset-1 focus:ring-offset-(--bg-secondary) transition-all duration-200"
        />
        <span className="text-xs text-(--text-secondary) group-hover:text-(--text-primary) transition-colors">Notes</span>
      </label>
      
      <div className="h-4 w-px bg-(--border-primary) mx-1" />
      
      <button
        onClick={() => onChange({
          showTags: true,
          showSubtitles: true,
          showScript: true,
          showNotes: true
        })}
        className="text-xs text-(--accent-blue) hover:text-(--accent-blue-hover) font-medium transition-colors duration-200"
      >
        Reset
      </button>
    </div>
  );
}
