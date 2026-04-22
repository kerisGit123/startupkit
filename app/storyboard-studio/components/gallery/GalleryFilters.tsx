"use client";

import { useState } from "react";
import { Tag, Cpu } from "lucide-react";
import { TAG_CATEGORIES } from "../shared/FileContextMenu";

// Tag category filter pills
const TAG_FILTER_PILLS = [
  { id: "", label: "All", color: "#A0A0A0" },
  ...TAG_CATEGORIES.map(cat => ({
    id: cat.label.toLowerCase(),
    label: cat.label,
    color: cat.color,
  })),
  { id: "others", label: "Others", color: "#6E6E6E" },
];

interface GalleryFiltersProps {
  filterMode: "tags" | "model";
  onFilterModeChange: (mode: "tags" | "model") => void;
  activeTagCategory: string;
  onTagCategoryChange: (id: string) => void;
  activeModel: string;
  onModelChange: (model: string) => void;
  sharedModels?: string[];
}

export function GalleryFilters({
  filterMode,
  onFilterModeChange,
  activeTagCategory,
  onTagCategoryChange,
  activeModel,
  onModelChange,
  sharedModels,
}: GalleryFiltersProps) {
  return (
    <>
      {/* Mode Toggle */}
      <div className="flex items-center justify-center gap-2 mb-4">
        <button
          onClick={() => { onFilterModeChange("tags"); onModelChange(""); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterMode === "tags" ? "bg-white/15 text-white" : "text-[#6E6E6E] hover:text-[#A0A0A0]"
          }`}
        >
          <Tag className="w-3 h-3" />
          Tags
        </button>
        <button
          onClick={() => { onFilterModeChange("model"); onTagCategoryChange(""); }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
            filterMode === "model" ? "bg-white/15 text-white" : "text-[#6E6E6E] hover:text-[#A0A0A0]"
          }`}
        >
          <Cpu className="w-3 h-3" />
          Model
        </button>
      </div>

      {/* Pills */}
      <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
        {filterMode === "tags" ? (
          TAG_FILTER_PILLS.map(pill => (
            <button
              key={pill.id}
              onClick={() => onTagCategoryChange(pill.id)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all flex items-center gap-1.5 ${
                activeTagCategory === pill.id
                  ? "text-white shadow-sm"
                  : "bg-white/8 text-[#a0a0b0] hover:bg-white/15 hover:text-white"
              }`}
              style={activeTagCategory === pill.id ? { backgroundColor: pill.color } : {}}
            >
              {pill.id !== "" && pill.id !== "others" && (
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: activeTagCategory === pill.id ? "#fff" : pill.color }} />
              )}
              {pill.label}
            </button>
          ))
        ) : (
          <>
            {[
              { id: "", label: "All" },
              { id: "image", label: "Image" },
              { id: "video", label: "Video" },
              { id: "audio", label: "Audio" },
            ].map(item => (
              <button
                key={item.id}
                onClick={() => onModelChange(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModel === item.id ? "bg-white text-black" : "bg-white/8 text-[#a0a0b0] hover:bg-white/15 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
            {sharedModels?.map(model => (
              <button
                key={model}
                onClick={() => onModelChange(model)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                  activeModel === model ? "bg-white text-black" : "bg-white/8 text-[#a0a0b0] hover:bg-white/15 hover:text-white"
                }`}
              >
                {model.split("/").pop()}
              </button>
            ))}
          </>
        )}
      </div>
    </>
  );
}

// Shared filter logic — use in both gallery and community pages
export function filterFiles(
  files: any[],
  opts: {
    filterMode: "tags" | "model";
    activeTagCategory: string;
    activeModel: string;
    searchQuery: string;
  }
) {
  return files.filter(f => {
    if (opts.filterMode === "tags" && opts.activeTagCategory) {
      const structuredTags = (f.tags || []).filter((t: string) => t.includes(":"));
      if (opts.activeTagCategory === "others") {
        if (structuredTags.length > 0) return false;
      } else {
        const hasMatchingTag = structuredTags.some((t: string) => t.startsWith(opts.activeTagCategory + ":"));
        if (!hasMatchingTag) return false;
      }
    }

    if (opts.filterMode === "model" && opts.activeModel) {
      if (opts.activeModel === "image") {
        if (f.fileType !== "image") return false;
      } else if (opts.activeModel === "video") {
        if (f.fileType !== "video") return false;
      } else if (opts.activeModel === "audio") {
        if (f.fileType !== "audio") return false;
      } else {
        if (f.model !== opts.activeModel) return false;
      }
    }

    if (opts.searchQuery) {
      const q = opts.searchQuery.toLowerCase();
      return (
        f.prompt?.toLowerCase().includes(q) ||
        f.model?.toLowerCase().includes(q) ||
        f.userName?.toLowerCase().includes(q) ||
        (f.tags || []).some((t: string) => t.toLowerCase().includes(q))
      );
    }

    return true;
  });
}
