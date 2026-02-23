"use client";

import { useState } from "react";
import { Search, Filter, Plus, X } from "lucide-react";
import { ViewMode, FilterType } from "../../types/storyboard";

interface ViewToggleProps {
  viewMode: ViewMode;
  onViewChange: (mode: ViewMode) => void;
}

export function ViewToggle({ viewMode, onViewChange }: ViewToggleProps) {
  const views = [
    { id: 'script' as ViewMode, label: 'Script', icon: '📝' },
    { id: 'storyboard' as ViewMode, label: 'Storyboard', icon: '🎨' },
    { id: 'single' as ViewMode, label: 'Single', icon: '👁️' },
    { id: 'timeline' as ViewMode, label: 'Timeline', icon: '📊' },
  ];

  return (
    <div className="flex bg-[#1a1a24] rounded-lg p-1">
      {views.map(view => (
        <button
          key={view.id}
          onClick={() => onViewChange(view.id)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition flex items-center gap-1.5 ${
            viewMode === view.id ? 'bg-white/10 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <span>{view.icon}</span>
          {view.label}
        </button>
      ))}
    </div>
  );
}

interface TagFilterProps {
  availableTags: string[];
  selectedTags: string[];
  onTagToggle: (tag: string) => void;
  onClearAll: () => void;
  maxVisible?: number;
}

export function TagFilter({ 
  availableTags, 
  selectedTags, 
  onTagToggle, 
  onClearAll,
  maxVisible = 8 
}: TagFilterProps) {
  const visibleTags = availableTags.slice(0, maxVisible);
  const hasHiddenTags = availableTags.length > maxVisible;

  return (
    <div className="flex items-center gap-2">
      <Filter className="w-4 h-4 text-gray-500" />
      <div className="flex gap-1 flex-wrap">
        {visibleTags.map(tag => (
          <button
            key={tag}
            onClick={() => onTagToggle(tag)}
            className={`px-2 py-1 rounded text-xs font-medium transition ${
              selectedTags.includes(tag)
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
            }`}
          >
            {tag}
          </button>
        ))}
        {hasHiddenTags && (
          <button className="px-2 py-1 bg-white/5 text-gray-500 rounded text-xs">
            +{availableTags.length - maxVisible} more
          </button>
        )}
      </div>
      {selectedTags.length > 0 && (
        <button
          onClick={onClearAll}
          className="px-2 py-1 bg-red-500/10 text-red-400 rounded text-xs hover:bg-red-500/20 transition"
        >
          Clear
        </button>
      )}
    </div>
  );
}

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search..." }: SearchBarProps) {
  return (
    <div className="relative flex-1 max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-10 pr-4 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
      />
    </div>
  );
}

interface ItemCardProps {
  item: any;
  viewMode: ViewMode;
  isSelected?: boolean;
  onSelect?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export function ItemCard({ item, viewMode, isSelected, onSelect, onEdit, onDelete }: ItemCardProps) {
  if (viewMode === 'script') {
    return (
      <div className={`bg-[#1a1a24] border rounded-lg p-6 cursor-pointer transition-all ${
        isSelected ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/30'
      }`}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-2">Scene {item.id}</h3>
            <p className="text-gray-300 mb-3">{item.script.description}</p>
            <p className="text-purple-300 font-medium mb-2">{item.script.action}</p>
            <p className="text-blue-300 italic">{item.script.dialogue}</p>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        {/* Metadata Tags */}
        <div className="flex flex-wrap gap-2">
          {item.metadata.characters.map(char => (
            <span key={char} className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">
              👤 {char}
            </span>
          ))}
          {item.metadata.locations.map(loc => (
            <span key={loc} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
              📍 {loc}
            </span>
          ))}
          {item.metadata.tags.map(tag => (
            <span key={tag} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
              🏷️ {tag}
            </span>
          ))}
        </div>
      </div>
    );
  }

  if (viewMode === 'storyboard') {
    return (
      <div className={`bg-[#1a1a24] border rounded-lg overflow-hidden cursor-pointer transition-all ${
        isSelected ? 'border-purple-500/50 bg-purple-500/5' : 'border-white/10 hover:border-purple-500/30'
      }`}>
        {/* Visual Preview */}
        <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center relative">
          {item.visual.imageUrl ? (
            <img src={item.visual.imageUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center">
              <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                🎨
              </div>
              <p className="text-xs text-gray-400">No visual yet</p>
            </div>
          )}
          
          {/* Action Overlay */}
          <div className="absolute inset-0 bg-black/50 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {onEdit && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onEdit();
                }}
                className="p-2 bg-white/20 rounded-lg text-white hover:bg-white/30 transition"
              >
                ✏️
              </button>
            )}
            {onDelete && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
                className="p-2 bg-red-500/20 rounded-lg text-white hover:bg-red-500/30 transition"
              >
                🗑️
              </button>
            )}
          </div>
        </div>
        
        {/* Content */}
        <div className="p-4">
          <h4 className="font-medium text-white mb-2">Shot {item.id}</h4>
          <p className="text-xs text-gray-400 mb-2">{item.visual.composition} • {item.visual.cameraAngle}</p>
          <p className="text-sm text-gray-300 line-clamp-2 mb-3">{item.script.action}</p>
          
          {/* Quick Tags */}
          <div className="flex flex-wrap gap-1">
            {item.metadata.characters.slice(0, 2).map(char => (
              <span key={char} className="px-1.5 py-0.5 bg-orange-500/10 text-orange-400 rounded text-xs">
                {char}
              </span>
            ))}
            {item.metadata.locations.slice(0, 1).map(loc => (
              <span key={loc} className="px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded text-xs">
                {loc}
              </span>
            ))}
            {item.metadata.tags.slice(0, 2).map(tag => (
              <span key={tag} className="px-1.5 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return null;
}

interface StatsBarProps {
  itemCount: number;
  characterCount: number;
  locationCount: number;
  selectedCount: number;
}

export function StatsBar({ itemCount, characterCount, locationCount, selectedCount }: StatsBarProps) {
  return (
    <div className="flex items-center gap-6 text-sm">
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Items:</span>
        <span className="text-white font-medium">{itemCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Characters:</span>
        <span className="text-white font-medium">{characterCount}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">Locations:</span>
        <span className="text-white font-medium">{locationCount}</span>
      </div>
      {selectedCount > 0 && (
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Selected:</span>
          <span className="text-purple-400 font-medium">{selectedCount}</span>
        </div>
      )}
    </div>
  );
}
