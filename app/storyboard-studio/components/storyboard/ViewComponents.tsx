"use client";

import { useState } from "react";
import { StoryboardItem } from "../../types/storyboard";

interface ScriptViewProps {
  items: StoryboardItem[];
  characters: string[];
  locations: string[];
}

export function ScriptView({ items, characters, locations }: ScriptViewProps) {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {items.map(item => (
          <div key={item.id} className="bg-[#1a1a24] border border-white/10 rounded-lg p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white mb-2">Scene {item.id}</h3>
                <p className="text-gray-300 mb-3">{item.script.description}</p>
                <p className="text-purple-300 font-medium mb-2">{item.script.action}</p>
                <p className="text-blue-300 italic">{item.script.dialogue}</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {item.metadata.characters.map(char => (
                <span key={char} className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">
                  {char}
                </span>
              ))}
              {item.metadata.locations.map(loc => (
                <span key={loc} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                  {loc}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface StoryboardViewProps {
  items: StoryboardItem[];
  characters: string[];
  locations: string[];
}

export function StoryboardView({ items, characters, locations }: StoryboardViewProps) {
  return (
    <div className="p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-[#1a1a24] border border-white/10 rounded-lg overflow-hidden">
            <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              {item.visual.imageUrl ? (
                <img src={item.visual.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="w-8 h-8 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                    🎨
                  </div>
                  <p className="text-xs text-gray-400">No visual yet</p>
                </div>
              )}
            </div>
            <div className="p-4">
              <h4 className="font-medium text-white mb-2">Shot {item.id}</h4>
              <p className="text-xs text-gray-400 mb-2">{item.visual.composition} • {item.visual.cameraAngle}</p>
              <p className="text-sm text-gray-300 line-clamp-2">{item.script.action}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

interface SingleModeViewProps {
  items: StoryboardItem[];
  characters: string[];
  locations: string[];
}

export function SingleModeView({ items, characters, locations }: SingleModeViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentItem = items[currentIndex];

  if (!currentItem) return null;

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="max-w-4xl w-full">
          <div className="bg-[#1a1a24] border border-white/10 rounded-xl overflow-hidden">
            {/* Visual Area */}
            <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
              {currentItem.visual.imageUrl ? (
                <img src={currentItem.visual.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <div className="w-16 h-16 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-4">
                    🎨
                  </div>
                  <p className="text-gray-400">Visual content will appear here</p>
                </div>
              )}
            </div>
            
            {/* Script Content */}
            <div className="p-6 border-t border-white/10">
              <h3 className="text-lg font-semibold text-white mb-3">Shot {currentItem.id}</h3>
              <p className="text-gray-300 mb-3">{currentItem.script.description}</p>
              <p className="text-purple-300 font-medium mb-2">{currentItem.script.action}</p>
              <p className="text-blue-300 italic mb-4">{currentItem.script.dialogue}</p>
              
              {/* Metadata */}
              <div className="flex flex-wrap gap-2">
                {currentItem.metadata.characters.map(char => (
                  <span key={char} className="px-2 py-1 bg-orange-500/10 text-orange-400 rounded text-xs">
                    {char}
                  </span>
                ))}
                {currentItem.metadata.locations.map(loc => (
                  <span key={loc} className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs">
                    {loc}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <div className="bg-[#13131a] border-t border-white/10 p-4">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex(prev => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          
          <div className="text-center">
            <span className="text-sm text-gray-400">
              {currentIndex + 1} / {items.length}
            </span>
          </div>
          
          <button
            onClick={() => setCurrentIndex(prev => Math.min(items.length - 1, prev + 1))}
            disabled={currentIndex === items.length - 1}
            className="px-4 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
