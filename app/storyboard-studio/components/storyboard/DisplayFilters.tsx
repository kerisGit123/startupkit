import React from 'react';

interface DisplayFiltersProps {
  displayOptions: {
    showTags: boolean;
    showSubtitles: boolean;
    showScript: boolean;
    showNotes: boolean;
  };
  onChange: (options: typeof displayOptions) => void;
}

export function DisplayFilters({ displayOptions, onChange }: DisplayFiltersProps) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 bg-white/6 rounded-lg">
      <span className="text-xs text-gray-400 mr-2">Display:</span>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showTags}
          onChange={(e) => onChange({ ...displayOptions, showTags: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Tags</span>
      </label>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showSubtitles}
          onChange={(e) => onChange({ ...displayOptions, showSubtitles: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Subtitles</span>
      </label>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showScript}
          onChange={(e) => onChange({ ...displayOptions, showScript: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Script</span>
      </label>
      
      <label className="flex items-center gap-1 cursor-pointer">
        <input
          type="checkbox"
          checked={displayOptions.showNotes}
          onChange={(e) => onChange({ ...displayOptions, showNotes: e.target.checked })}
          className="w-3 h-3 rounded border-white/20 bg-[#2a2a3e] text-purple-500"
        />
        <span className="text-xs text-gray-300">Notes</span>
      </label>
      
      <button
        onClick={() => onChange({
          showTags: true,
          showSubtitles: true,
          showScript: true,
          showNotes: true
        })}
        className="text-xs text-purple-400 hover:text-purple-300 ml-2"
      >
        Reset
      </button>
    </div>
  );
}
