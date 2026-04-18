"use client";

import React, { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Globe, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Image, Video, Sparkles, Flame, Clock, Award, Share2,
} from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { GalleryCard } from "./GalleryCard";
import { GalleryDetailModal } from "./GalleryDetailModal";

interface GalleryPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

// Category quick-filter pills
const CATEGORY_TAGS = [
  { id: "", label: "All" },
  { id: "video", label: "Video-Gen", fileType: "video" as const },
  { id: "image", label: "Image-Gen", fileType: "image" as const },
  { id: "nano-banana-2", label: "Nano Banana", model: true },
  { id: "nano-banana-pro", label: "Nano Pro", model: true },
  { id: "bytedance/seedance-2", label: "Seedance 2.0", model: true },
  { id: "bytedance/seedance-2-fast", label: "Seedance Fast", model: true },
  { id: "google/veo-3.1", label: "Veo 3.1", model: true },
  { id: "z-image", label: "Z-Image", model: true },
  { id: "grok-imagine/image-to-video", label: "Grok Imagine", model: true },
];

const SORT_TABS = [
  { id: "popular" as const, label: "Popular", icon: Flame },
  { id: "recent" as const, label: "New", icon: Clock },
  { id: "most_donated" as const, label: "Top Donated", icon: Award },
];

export function GalleryPage({ sidebarOpen, onToggleSidebar }: GalleryPageProps) {
  const { user } = useUser();
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "most_donated">("popular");
  const [filterModel, setFilterModel] = useState<string>("");
  const [filterFileType, setFilterFileType] = useState<"image" | "video" | "">("");
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const creatorsScrollRef = useRef<HTMLDivElement>(null);

  const [displayLimit, setDisplayLimit] = useState(30);
  const files = useQuery(api.storyboard.gallery.listSharedFiles, {
    limit: 200,
    sortBy,
    filterModel: filterModel || undefined,
    filterFileType: (filterFileType || undefined) as "image" | "video" | undefined,
  });

  const topCreators = useQuery(api.storyboard.gallery.getTopCreators, { limit: 10 });
  const sharedModels = useQuery(api.storyboard.gallery.getSharedModels);

  // Handle category tag clicks
  const handleCategoryClick = (cat: typeof CATEGORY_TAGS[0]) => {
    setActiveCategory(cat.id);
    if (cat.id === "") {
      setFilterModel("");
      setFilterFileType("");
    } else if ('fileType' in cat && cat.fileType) {
      setFilterFileType(cat.fileType);
      setFilterModel("");
    } else if ('model' in cat && cat.model) {
      setFilterModel(cat.id);
      setFilterFileType("");
    }
  };

  // Client-side search filter
  const allFilteredFiles = files?.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.prompt?.toLowerCase().includes(q) ||
      f.model?.toLowerCase().includes(q) ||
      f.userName?.toLowerCase().includes(q)
    );
  });
  const filteredFiles = allFilteredFiles?.slice(0, displayLimit);
  const hasMore = (allFilteredFiles?.length ?? 0) > displayLimit;

  const scrollCreators = (dir: "left" | "right") => {
    if (creatorsScrollRef.current) {
      creatorsScrollRef.current.scrollBy({ left: dir === "left" ? -300 : 300, behavior: "smooth" });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0d] overflow-y-auto">

      {/* ── Hero Banner ─────────────────────────────────────── */}
      <div className="relative px-6 pt-10 pb-8 text-center bg-gradient-to-b from-[#1a1a2e] via-[#111118] to-[#0d0d0d]">
        {/* Top bar with user controls */}
        <div className="absolute top-4 right-6 flex items-center gap-3">
          <OrgSwitcher />
          <UserButton />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
          Community Gallery
        </h1>
        <p className="text-sm text-[#8a8a9a] mb-6 max-w-lg mx-auto">
          Explore AI creations from the most talented creators. Rate, donate, and get inspired.
        </p>

        {/* Category Tags */}
        <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
          {CATEGORY_TAGS.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id
                  ? "bg-white text-black"
                  : "bg-white/8 text-[#a0a0b0] hover:bg-white/15 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Share CTA */}
        <button className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#4A90E2]/40 text-[#4A90E2] text-sm font-medium hover:bg-[#4A90E2]/10 transition-all">
          <Share2 className="w-4 h-4" />
          Share your creations
        </button>
      </div>

      {/* ── Top Creators ────────────────────────────────────── */}
      {topCreators && topCreators.length > 0 && (
        <div className="px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Top Creators of the Month</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => scrollCreators("left")} className="p-1 text-[#6E6E6E] hover:text-white transition rounded">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => scrollCreators("right")} className="p-1 text-[#6E6E6E] hover:text-white transition rounded">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={creatorsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {topCreators.map((creator, idx) => (
              <div
                key={creator.userId}
                className="flex-shrink-0 flex items-center gap-3 bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl px-4 py-3 min-w-[220px] hover:border-[#3D3D3D] transition"
              >
                {creator.userAvatar ? (
                  <img src={creator.userAvatar} alt={creator.userName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#4A90E2] to-[#4A9E8E] flex items-center justify-center text-white font-bold text-sm">
                    {creator.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {creator.userName}
                    {idx === 0 && <span className="ml-1">👑</span>}
                  </p>
                  <p className="text-xs text-[#6E6E6E]">{creator.creationCount} Creations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Sort Tabs + Search Bar ───────────────────────────── */}
      <div className="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="flex items-center justify-between px-6 py-3">
          {/* Sort Tabs */}
          <div className="flex items-center gap-1">
            {SORT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  sortBy === tab.id
                    ? "bg-white/10 text-white"
                    : "text-[#6E6E6E] hover:text-[#A0A0A0] hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search + Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition ${
                showFilters ? "bg-[#4A90E2]/15 text-[#4A90E2]" : "text-[#6E6E6E] hover:text-white bg-white/5"
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              Filters
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E6E6E]" />
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search assets"
                className="w-48 pl-9 pr-3 py-2 bg-white/5 border border-[#2C2C2C] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50"
              />
            </div>
          </div>
        </div>

        {/* Expanded Filters */}
        {showFilters && (
          <div className="flex items-center gap-3 px-6 pb-3">
            {/* Model filter */}
            <select
              value={filterModel}
              onChange={(e) => { setFilterModel(e.target.value); setActiveCategory(""); }}
              className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg px-3 py-1.5 text-xs text-[#A0A0A0] focus:outline-none focus:border-[#4A90E2]/50"
            >
              <option value="">All Models</option>
              {sharedModels?.map(model => (
                <option key={model} value={model}>{model}</option>
              ))}
            </select>
            {/* File type */}
            <select
              value={filterFileType}
              onChange={(e) => { setFilterFileType(e.target.value as any); setActiveCategory(""); }}
              className="bg-[#1A1A1A] border border-[#2C2C2C] rounded-lg px-3 py-1.5 text-xs text-[#A0A0A0] focus:outline-none focus:border-[#4A90E2]/50"
            >
              <option value="">All Types</option>
              <option value="image">Images</option>
              <option value="video">Videos</option>
            </select>
            {(filterModel || filterFileType) && (
              <button
                onClick={() => { setFilterModel(""); setFilterFileType(""); setActiveCategory(""); }}
                className="text-xs text-[#4A90E2] hover:underline"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── Gallery Masonry Grid ─────────────────────────────── */}
      <div className="flex-1 px-6 py-5">
        {!files ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 text-[#4A90E2] animate-spin" />
          </div>
        ) : filteredFiles && filteredFiles.length > 0 ? (
          <>
            <div className="columns-2 sm:columns-3 lg:columns-4 xl:columns-5 gap-3">
              {filteredFiles.map((file) => (
                <div key={file._id} className="break-inside-avoid mb-3">
                  <GalleryCard
                    file={file}
                    onClick={() => setSelectedFileId(file._id)}
                  />
                </div>
              ))}
            </div>
            {hasMore && (
              <div className="flex justify-center py-8">
                <button
                  onClick={() => setDisplayLimit(prev => prev + 30)}
                  className="px-8 py-3 bg-[#2C2C2C] hover:bg-[#3D3D3D] text-[#A0A0A0] hover:text-white text-sm font-medium rounded-xl border border-[#3D3D3D] transition-all"
                >
                  Load More
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <Globe className="w-16 h-16 text-[#2C2C2C] mb-5" />
            <h3 className="text-xl font-semibold text-[#A0A0A0] mb-2">No creations yet</h3>
            <p className="text-sm text-[#6E6E6E] max-w-md mb-6">
              Be the first to share your AI creations with the community. Click the share button on any generated file in your workspace.
            </p>
            <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#4A90E2] text-white text-sm font-medium hover:bg-[#357ABD] transition">
              <Share2 className="w-4 h-4" />
              Start creating
            </button>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFileId && (
        <GalleryDetailModal
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}
    </div>
  );
}
