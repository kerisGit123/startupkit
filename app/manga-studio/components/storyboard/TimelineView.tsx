"use client";

import { useState } from "react";
import { StoryboardItem } from "../../types/storyboard";
import { Clock, Users, MapPin, Tag, Edit3, Trash2, Copy, Eye } from "lucide-react";

interface TimelineViewProps {
  items: StoryboardItem[];
  characters: string[];
  locations: string[];
  onItemSelect?: (item: StoryboardItem) => void;
  onItemEdit?: (item: StoryboardItem) => void;
  onItemDelete?: (item: StoryboardItem) => void;
}

export function TimelineView({ 
  items, 
  characters, 
  locations, 
  onItemSelect, 
  onItemEdit, 
  onItemDelete 
}: TimelineViewProps) {
  const [selectedItem, setSelectedItem] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'compact' | 'detailed'>('compact');

  const sortedItems = [...items].sort((a, b) => a.priority - b.priority);

  const getItemColor = (mood: string) => {
    const moodColors: Record<string, string> = {
      'excited': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      'tense': 'bg-red-500/20 text-red-400 border-red-500/30',
      'emotional': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      'hopeful': 'bg-green-500/20 text-green-400 border-green-500/30',
      'dramatic': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
    };
    return moodColors[mood] || 'bg-gray-500/20 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">Timeline View</h2>
          <p className="text-sm text-gray-400">Visual story flow and pacing</p>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex bg-[#1a1a24] rounded-lg p-1">
            <button
              onClick={() => setViewMode('compact')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                viewMode === 'compact' ? 'bg-white/10 text-white' : 'text-gray-500'
              }`}
            >
              Compact
            </button>
            <button
              onClick={() => setViewMode('detailed')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                viewMode === 'detailed' ? 'bg-white/10 text-white' : 'text-gray-500'
              }`}
            >
              Detailed
            </button>
          </div>
        </div>
      </div>

      {/* Timeline */}
      <div className="flex-1 overflow-y-auto">
        <div className="relative">
          {/* Timeline Line */}
          <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-purple-500 via-pink-500 to-blue-500" />
          
          {/* Timeline Items */}
          <div className="space-y-6">
            {sortedItems.map((item, index) => (
              <div key={item.id} className="relative flex items-start gap-6">
                {/* Timeline Node */}
                <div className="relative z-10">
                  <div
                    className={`w-16 h-16 rounded-full border-2 flex items-center justify-center cursor-pointer transition-all hover:scale-110 ${
                      getItemColor(item.metadata.mood)
                    }`}
                    onClick={() => setSelectedItem(selectedItem === item.id ? null : item.id)}
                  >
                    <span className="text-sm font-bold">{index + 1}</span>
                  </div>
                  
                  {/* Connection Lines */}
                  {index < sortedItems.length - 1 && (
                    <div className="absolute top-16 left-8 w-0.5 h-6 bg-gradient-to-b from-purple-500/50 to-transparent" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div
                    className={`bg-[#1a1a24] border rounded-lg p-4 cursor-pointer transition-all ${
                      selectedItem === item.id 
                        ? 'border-purple-500/50 bg-purple-500/5' 
                        : 'border-white/10 hover:border-purple-500/30'
                    }`}
                    onClick={() => onItemSelect?.(item)}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-white mb-1">Shot {item.id}</h3>
                        <p className="text-sm text-gray-300 line-clamp-2">{item.script.description}</p>
                      </div>
                      
                      <div className="flex items-center gap-1 ml-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemEdit?.(item);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onItemDelete?.(item);
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            // Quick view action
                          }}
                          className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Script Content */}
                    <div className="mb-3 space-y-2">
                      {item.script.action && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-purple-400 font-medium">Action:</span>
                          <p className="text-sm text-gray-300">{item.script.action}</p>
                        </div>
                      )}
                      {item.script.dialogue && (
                        <div className="flex items-start gap-2">
                          <span className="text-xs text-blue-400 font-medium">Dialogue:</span>
                          <p className="text-sm text-gray-300 italic">{item.script.dialogue}</p>
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex flex-wrap gap-2 mb-3">
                      {item.metadata.characters.map(char => (
                        <span key={char} className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {char}
                        </span>
                      ))}
                      {item.metadata.locations.map(loc => (
                        <span key={loc} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {loc}
                        </span>
                      ))}
                      {item.metadata.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {tag}
                        </span>
                      ))}
                    </div>

                    {/* Visual Info */}
                    {viewMode === 'detailed' && (
                      <div className="pt-3 border-t border-white/5">
                        <div className="flex items-center gap-4 text-xs text-gray-400">
                          <span>Composition: {item.visual.composition}</span>
                          <span>Camera: {item.visual.cameraAngle}</span>
                          <span>Style: {item.visual.style}</span>
                          <span>Mood: {item.metadata.mood}</span>
                        </div>
                      </div>
                    )}

                    {/* Status */}
                    <div className="flex items-center justify-between pt-3 border-t border-white/5">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${
                          item.status === 'completed' ? 'bg-emerald-400' :
                          item.status === 'in-progress' ? 'bg-blue-400' :
                          'bg-gray-400'
                        }`} />
                        <span className="text-xs text-gray-400 capitalize">{item.status}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {item.modifiedAt.toLocaleDateString()}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {selectedItem === item.id && viewMode === 'detailed' && (
                    <div className="mt-4 bg-[#0f1117] border border-white/10 rounded-lg p-4">
                      <h4 className="font-medium text-white mb-3">Detailed Information</h4>
                      
                      {/* Visual Preview */}
                      <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-lg mb-4 flex items-center justify-center">
                        {item.visual.imageUrl ? (
                          <img src={item.visual.imageUrl} alt="" className="w-full h-full object-cover rounded-lg" />
                        ) : (
                          <div className="text-center">
                            <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                              🎨
                            </div>
                            <p className="text-xs text-gray-400">Visual preview not available</p>
                          </div>
                        )}
                      </div>

                      {/* Full Script */}
                      <div className="space-y-3">
                        <div>
                          <h5 className="text-sm font-medium text-white mb-1">Full Description</h5>
                          <p className="text-sm text-gray-300">{item.script.description}</p>
                        </div>
                        
                        <div>
                          <h5 className="text-sm font-medium text-white mb-1">Visual Composition</h5>
                          <p className="text-sm text-gray-300">{item.visual.composition} with {item.visual.cameraAngle} camera angle</p>
                        </div>

                        <div>
                          <h5 className="text-sm font-medium text-white mb-1">All Tags</h5>
                          <div className="flex flex-wrap gap-1">
                            {item.metadata.tags.map(tag => (
                              <span key={tag} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
                                {tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Stats */}
      <div className="mt-6 pt-4 border-t border-white/10">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-6">
            <span className="text-gray-500">Total Items: <span className="text-white font-medium">{items.length}</span></span>
            <span className="text-gray-500">Characters: <span className="text-white font-medium">{characters.length}</span></span>
            <span className="text-gray-500">Locations: <span className="text-white font-medium">{locations.length}</span></span>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="px-3 py-1.5 bg-purple-500/10 text-purple-400 rounded text-xs hover:bg-purple-500/20 transition">
              Export Timeline
            </button>
            <button className="px-3 py-1.5 bg-white/5 text-gray-300 rounded text-xs hover:bg-white/10 transition">
              Print View
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
