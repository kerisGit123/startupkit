"use client";

import { useState } from "react";
import { Image as ImageIcon, Plus, Tag, X, Search, Grid3x3, List } from "lucide-react";

interface ReferenceImage {
  id: string;
  url: string;
  name: string;
  tags: string[];
  category: string;
}

interface ReferenceImageManagerProps {
  onSelectImage: (imageUrl: string) => void;
}

export function ReferenceImageManager({ onSelectImage }: ReferenceImageManagerProps) {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showAddImage, setShowAddImage] = useState(false);

  // Sample reference images
  const [images] = useState<ReferenceImage[]>([
    { id: "1", url: "", name: "Character Pose 1", tags: ["action", "dynamic"], category: "poses" },
    { id: "2", url: "", name: "Background Reference", tags: ["urban", "street"], category: "backgrounds" },
    { id: "3", url: "", name: "Facial Expression", tags: ["emotion", "close-up"], category: "expressions" },
    { id: "4", url: "", name: "Action Scene", tags: ["fight", "movement"], category: "poses" },
  ]);

  const categories = [
    { id: "all", name: "All", count: images.length },
    { id: "poses", name: "Poses", count: images.filter(i => i.category === "poses").length },
    { id: "expressions", name: "Expressions", count: images.filter(i => i.category === "expressions").length },
    { id: "backgrounds", name: "Backgrounds", count: images.filter(i => i.category === "backgrounds").length },
  ];

  const filteredImages = images.filter(img => {
    const matchesSearch = img.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         img.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesCategory = selectedCategory === "all" || img.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ImageIcon className="w-5 h-5 text-purple-400" />
          <h3 className="text-sm font-semibold text-white">Reference Library</h3>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-lg transition ${
              viewMode === "grid" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <Grid3x3 className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-lg transition ${
              viewMode === "list" ? "bg-purple-500/20 text-purple-400" : "bg-white/5 text-gray-400 hover:text-white"
            }`}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => setShowAddImage(true)}
            className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Add
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search references..."
          className="w-full pl-10 pr-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-purple-500 transition"
        />
      </div>

      {/* Categories */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
              selectedCategory === cat.id
                ? "bg-purple-500/20 text-purple-400 border border-purple-500/30"
                : "bg-white/5 text-gray-400 hover:text-white border border-white/10"
            }`}
          >
            {cat.name} ({cat.count})
          </button>
        ))}
      </div>

      {/* Images Grid/List */}
      <div className={viewMode === "grid" ? "grid grid-cols-2 gap-3" : "space-y-2"}>
        {filteredImages.map((img) => (
          <button
            key={img.id}
            onClick={() => onSelectImage(img.url)}
            className={`group relative overflow-hidden rounded-lg border-2 border-white/10 hover:border-purple-500/50 transition ${
              viewMode === "grid" ? "aspect-square" : "flex items-center gap-3 p-3"
            }`}
          >
            {/* Image placeholder */}
            <div className={`bg-gradient-to-br from-purple-900/20 to-pink-900/20 flex items-center justify-center ${
              viewMode === "grid" ? "w-full h-full" : "w-16 h-16 rounded shrink-0"
            }`}>
              <ImageIcon className="w-8 h-8 text-purple-400/50" />
            </div>

            {/* Info overlay (grid mode) */}
            {viewMode === "grid" && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition flex flex-col justify-end p-3">
                <div className="text-xs font-semibold text-white mb-1">{img.name}</div>
                <div className="flex flex-wrap gap-1">
                  {img.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-purple-500/30 text-purple-300 rounded text-[10px]">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Info (list mode) */}
            {viewMode === "list" && (
              <div className="flex-1 text-left">
                <div className="text-sm font-semibold text-white mb-1">{img.name}</div>
                <div className="flex flex-wrap gap-1">
                  {img.tags.map((tag) => (
                    <span key={tag} className="px-2 py-0.5 bg-purple-500/20 text-purple-400 rounded text-xs">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {/* Empty state */}
      {filteredImages.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <ImageIcon className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p className="text-sm">No references found</p>
        </div>
      )}

      {/* Add Image Modal */}
      {showAddImage && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1a1a24] rounded-xl p-6 max-w-md w-full mx-4 border border-white/10">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Add Reference Image</h3>
              <button
                onClick={() => setShowAddImage(false)}
                className="w-8 h-8 rounded-lg hover:bg-white/10 flex items-center justify-center text-gray-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Image Name</label>
                <input
                  type="text"
                  placeholder="e.g., Action Pose Reference"
                  className="w-full px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Tags</label>
                <input
                  type="text"
                  placeholder="action, dynamic, pose"
                  className="w-full px-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-300 block mb-2">Upload Image</label>
                <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-purple-500/50 transition cursor-pointer">
                  <ImageIcon className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">Click to upload</p>
                </div>
              </div>
              <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition">
                Add Reference
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
