"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import {
  Globe, Search, Filter, ChevronDown, ChevronLeft, ChevronRight,
  Loader2, Image, Video, Sparkles, Flame, Clock, Award, Share2, Film,
} from "lucide-react";
import Link from "next/link";
import { GalleryCard } from "@/app/storyboard-studio/components/gallery/GalleryCard";
import { GalleryDetailModal } from "@/app/storyboard-studio/components/gallery/GalleryDetailModal";

const CATEGORY_TAGS = [
  { id: "", label: "All" },
  { id: "video", label: "Video-Gen", fileType: "video" as const },
  { id: "image", label: "Image-Gen", fileType: "image" as const },
  { id: "nano-banana-2", label: "Nano Banana", model: true },
  { id: "nano-banana-pro", label: "Nano Pro", model: true },
  { id: "bytedance/seedance-2", label: "Seedance 2.0", model: true },
  { id: "google/veo-3.1", label: "Veo 3.1", model: true },
  { id: "z-image", label: "Z-Image", model: true },
];

const SORT_TABS = [
  { id: "popular" as const, label: "Popular", icon: Flame },
  { id: "recent" as const, label: "New", icon: Clock },
  { id: "most_donated" as const, label: "Top Donated", icon: Award },
];

export default function CommunityPage() {
  const { isSignedIn } = useUser();
  const [sortBy, setSortBy] = useState<"recent" | "popular" | "most_donated">("popular");
  const [filterModel, setFilterModel] = useState("");
  const [filterFileType, setFilterFileType] = useState<"image" | "video" | "">("");
  const [activeCategory, setActiveCategory] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [displayLimit, setDisplayLimit] = useState(20);
  const creatorsRef = React.useRef<HTMLDivElement>(null);

  const files = useQuery(api.storyboard.gallery.listSharedFiles, {
    limit: 200,
    sortBy,
    filterModel: filterModel || undefined,
    filterFileType: (filterFileType || undefined) as "image" | "video" | undefined,
  });

  const topCreators = useQuery(api.storyboard.gallery.getTopCreators, { limit: 10 });

  const handleCategoryClick = (cat: typeof CATEGORY_TAGS[0]) => {
    setActiveCategory(cat.id);
    if (cat.id === "") { setFilterModel(""); setFilterFileType(""); }
    else if ('fileType' in cat && cat.fileType) { setFilterFileType(cat.fileType); setFilterModel(""); }
    else if ('model' in cat && cat.model) { setFilterModel(cat.id); setFilterFileType(""); }
  };

  const allFilteredFiles = files?.filter(f => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return f.prompt?.toLowerCase().includes(q) || f.model?.toLowerCase().includes(q) || f.userName?.toLowerCase().includes(q);
  });
  const filteredFiles = allFilteredFiles?.slice(0, displayLimit);
  const hasMore = (allFilteredFiles?.length ?? 0) > displayLimit;

  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white">

      {/* ── Nav bar ───────────────────────────────────── */}
      <nav className="sticky top-0 z-50 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="px-6 py-3 flex items-center justify-between">
          <Link href="/storytica" className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-400 to-teal-500 flex items-center justify-center"><Film className="w-3.5 h-3.5 text-[#111]" /></div>
            <span className="text-[15px] font-extrabold text-teal-400 tracking-tight">STORYTICA</span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/pricing" className="text-sm text-[#A0A0A0] hover:text-white transition">Pricing</Link>
            {isSignedIn ? (
              <Link href="/storyboard-studio" className="text-sm font-medium bg-[#4A90E2] hover:bg-[#357ABD] text-white px-4 py-2 rounded-lg transition">
                Open Studio
              </Link>
            ) : (
              <>
                <Link href="/sign-in" className="text-sm text-[#A0A0A0] hover:text-white transition">Log In</Link>
                <Link href="/sign-up" className="text-sm font-medium bg-[#4A90E2] hover:bg-[#357ABD] text-white px-4 py-2 rounded-lg transition">
                  Start Free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ──────────────────────────────────────── */}
      <div className="text-center pt-12 pb-8 px-6">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">Community Gallery</h1>
        <p className="text-[#A0A0A0] text-sm max-w-lg mx-auto mb-6">
          Explore AI creations from the community. Rate, donate credits, and get inspired.
        </p>

        <div className="flex items-center justify-center gap-2 flex-wrap mb-5">
          {CATEGORY_TAGS.map(cat => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium transition-all ${
                activeCategory === cat.id ? "bg-white text-black" : "bg-white/8 text-[#A0A0A0] hover:bg-white/15 hover:text-white"
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {!isSignedIn && (
          <Link href="/sign-up" className="inline-flex items-center gap-2 px-5 py-2 rounded-full border border-[#4A90E2]/40 text-[#4A90E2] text-sm font-medium hover:bg-[#4A90E2]/10 transition-all">
            <Share2 className="w-4 h-4" />
            Sign up to share your creations
          </Link>
        )}
      </div>

      {/* ── Top Creators ──────────────────────────────── */}
      {topCreators && topCreators.length > 0 && (
        <div className="px-6 py-4 border-b border-[#1a1a1a]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-white">Top Creators of the Month</h2>
            <div className="flex items-center gap-1">
              <button onClick={() => creatorsRef.current?.scrollBy({ left: -300, behavior: "smooth" })} className="p-1 text-[#6E6E6E] hover:text-white transition">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => creatorsRef.current?.scrollBy({ left: 300, behavior: "smooth" })} className="p-1 text-[#6E6E6E] hover:text-white transition">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div ref={creatorsRef} className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
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

      {/* ── Sort + Search ─────────────────────────────── */}
      <div className="sticky top-[52px] z-30 bg-[#0d0d0d]/95 backdrop-blur-md border-b border-[#1a1a1a]">
        <div className="px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-1">
            {SORT_TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setSortBy(tab.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                  sortBy === tab.id ? "bg-white/10 text-white" : "text-[#6E6E6E] hover:text-[#A0A0A0] hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#6E6E6E]" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search prompts, models..."
              className="w-48 pl-9 pr-3 py-2 bg-white/5 border border-[#2C2C2C] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50"
            />
          </div>
        </div>
      </div>

      {/* ── Gallery Grid ──────────────────────────────── */}
      <div className="px-6 py-5">
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
            <p className="text-sm text-[#6E6E6E] max-w-md">
              Be the first to share your AI creations with the community.
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal — only opens if user is signed in */}
      {selectedFileId && isSignedIn && (
        <GalleryDetailModal
          fileId={selectedFileId}
          onClose={() => setSelectedFileId(null)}
        />
      )}

      {/* Not signed in — show login prompt instead of modal */}
      {selectedFileId && !isSignedIn && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setSelectedFileId(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative bg-[#1A1A1A] rounded-2xl w-[400px] p-6 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[#3D3D3D] text-center" onClick={(e) => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-full bg-[#4A90E2]/15 flex items-center justify-center mx-auto mb-4">
              <Globe className="w-6 h-6 text-[#4A90E2]" />
            </div>
            <h3 className="text-white font-bold text-lg mb-2">Sign in to view details</h3>
            <p className="text-[#A0A0A0] text-sm mb-5">Log in to download files, copy prompts, rate creations, and donate credits.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setSelectedFileId(null)} className="px-5 py-2.5 text-sm text-[#A0A0A0] bg-[#2C2C2C] hover:bg-[#3D3D3D] border border-[#3D3D3D] rounded-lg transition font-medium">
                Close
              </button>
              <Link href="/sign-up" className="px-5 py-2.5 text-sm text-white bg-[#4A90E2] hover:bg-[#357ABD] rounded-lg transition font-semibold">
                Sign Up Free
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
