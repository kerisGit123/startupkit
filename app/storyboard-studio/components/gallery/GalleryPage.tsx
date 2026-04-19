"use client";

import React, { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useUser } from "@clerk/nextjs";
import {
  Globe, Search, ChevronLeft, ChevronRight, Loader2, Clock,
} from "lucide-react";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { GalleryCard } from "./GalleryCard";
import { GalleryDetailModal } from "./GalleryDetailModal";
import { GalleryFilters, filterFiles } from "./GalleryFilters";

interface GalleryPageProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
}

export function GalleryPage({ sidebarOpen, onToggleSidebar }: GalleryPageProps) {
  const { user } = useUser();
  const [filterMode, setFilterMode] = useState<"tags" | "model">("tags");
  const [activeTagCategory, setActiveTagCategory] = useState("");
  const [activeModel, setActiveModel] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const creatorsScrollRef = useRef<HTMLDivElement>(null);
  const [displayLimit, setDisplayLimit] = useState(30);

  const files = useQuery(api.storyboard.gallery.listSharedFiles, { limit: 200, sortBy: "recent" });
  const topCreators = useQuery(api.storyboard.gallery.getTopCreators, { limit: 10 });
  const sharedModels = useQuery(api.storyboard.gallery.getSharedModels);

  const allFilteredFiles = files ? filterFiles(files, { filterMode, activeTagCategory, activeModel, searchQuery }) : undefined;
  const filteredFiles = allFilteredFiles?.slice(0, displayLimit);
  const hasMore = (allFilteredFiles?.length ?? 0) > displayLimit;

  return (
    <div className="flex-1 flex flex-col h-full bg-[#0d0d0d] overflow-y-auto">

      {/* Hero */}
      <div className="relative px-6 pt-10 pb-8 text-center bg-gradient-to-b from-[#1a1a2e] via-[#111118] to-[#0d0d0d]">
        <div className="absolute top-4 right-6 flex items-center gap-3">
          <OrgSwitcher />
          <UserButton />
        </div>

        <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">Community Gallery</h1>
        <p className="text-sm text-[#8a8a9a] mb-6 max-w-lg mx-auto">
          Explore AI creations from the community. Get inspired and start creating.
        </p>

        <GalleryFilters
          filterMode={filterMode}
          onFilterModeChange={setFilterMode}
          activeTagCategory={activeTagCategory}
          onTagCategoryChange={setActiveTagCategory}
          activeModel={activeModel}
          onModelChange={setActiveModel}
          sharedModels={sharedModels}
        />
      </div>

      {/* Top Creators */}
      {topCreators && topCreators.length > 0 && (
        <div className="px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Top Creators</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => creatorsScrollRef.current?.scrollBy({ left: -300, behavior: "smooth" })} className="p-1 text-[#6E6E6E] hover:text-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => creatorsScrollRef.current?.scrollBy({ left: 300, behavior: "smooth" })} className="p-1 text-[#6E6E6E] hover:text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={creatorsScrollRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {topCreators.map((creator, idx) => (
              <div key={creator.userId} className="shrink-0 flex items-center gap-3 bg-[#1A1A1A] border border-[#2C2C2C] rounded-xl px-4 py-3 min-w-[220px]">
                {creator.userAvatar ? (
                  <img src={creator.userAvatar} alt={creator.userName} className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-[#4A90E2]/15 flex items-center justify-center text-white font-bold text-sm">
                    {creator.userName.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm text-white font-medium truncate">{creator.userName}{idx === 0 && " 👑"}</p>
                  <p className="text-xs text-[#6E6E6E]">{creator.creationCount} Creations</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Search bar */}
      <div className="sticky top-0 z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-white" />
            <span className="text-xs font-medium text-white">New</span>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E6E6E]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, tags..."
              className="w-48 pl-9 pr-3 py-2 bg-white/5 border border-[#2C2C2C] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50"
            />
          </div>
        </div>
      </div>

      {/* Gallery Grid */}
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
                  <GalleryCard file={file} onClick={() => setSelectedFileId(file._id)} />
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
            <p className="text-sm text-[#6E6E6E] max-w-md">
              Be the first to share your AI creations with the community.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedFileId && (
        <GalleryDetailModal fileId={selectedFileId} onClose={() => setSelectedFileId(null)} />
      )}
    </div>
  );
}
