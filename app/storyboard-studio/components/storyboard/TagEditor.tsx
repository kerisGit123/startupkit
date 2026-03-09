"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";
import { SIMPLE_TAGS, TAG_COLORS } from "../../constants";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TagEditorProps {
  selectedTags: Tag[];
  onTagsChange: (tags: Tag[]) => void;
  onClose: () => void;
}

export function TagEditor({ selectedTags, onTagsChange, onClose }: TagEditorProps) {
  const [customTagName, setCustomTagName] = useState("");

  // Filter out already selected tags
  const availableTags = SIMPLE_TAGS.filter(tag =>
    !selectedTags.some(selected => selected.id === tag.id)
  );

  const addTag = (tag: Tag) => {
    onTagsChange([...selectedTags, tag]);
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const addCustomTag = () => {
    if (customTagName.trim()) {
      const newTag: Tag = {
        id: `custom-${Date.now()}`,
        name: customTagName.trim(),
        color: TAG_COLORS[selectedTags.length % TAG_COLORS.length]
      };
      addTag(newTag);
      setCustomTagName("");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-[#1a1a1f] border border-white/10 rounded-xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <h3 className="text-white text-lg font-semibold">Edit Tags</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Custom Tag Input */}
        <div className="p-4 border-b border-white/10">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Add custom tag..."
              value={customTagName}
              onChange={(e) => setCustomTagName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
              className="flex-1 bg-[#25252f] border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-violet-500/50"
            />
            <button
              onClick={addCustomTag}
              disabled={!customTagName.trim()}
              className="px-3 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-gray-500 rounded-lg text-white text-sm font-medium transition"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Selected Tags */}
        {selectedTags.length > 0 && (
          <div className="p-4 border-b border-white/10">
            <h4 className="text-gray-400 text-xs font-medium mb-2">Selected</h4>
            <div className="flex flex-wrap gap-2">
              {selectedTags.map((tag) => (
                <span
                  key={tag.id}
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105"
                  style={{ 
                    backgroundColor: tag.color + '25', 
                    color: tag.color,
                    border: `1px solid ${tag.color}30`
                  }}
                >
                  {tag.name}
                  <button
                    onClick={() => removeTag(tag.id)}
                    className="ml-1 hover:opacity-70 transition"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Available Tags */}
        <div className="p-4">
          <h4 className="text-gray-400 text-xs font-medium mb-2">Available Tags</h4>
          <div className="flex flex-wrap gap-2">
            {availableTags.length > 0 ? (
              availableTags.map((tag) => (
                <button
                  key={tag.id}
                  onClick={() => addTag(tag)}
                  className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/40"
                  style={{ 
                    backgroundColor: tag.color + '25', 
                    color: tag.color
                  }}
                >
                  {tag.name}
                </button>
              ))
            ) : (
              <p className="text-gray-500 text-sm">All tags selected</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
