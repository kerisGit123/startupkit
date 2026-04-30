import React, { useState, useMemo, useEffect, useRef, useCallback } from "react";
import { X, Search, Eye, Star, GitCompare, Trash2, AlertCircle, Loader2, Clock, Cpu, Image } from "lucide-react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";
import { GeneratedImageCard } from "./GeneratedImageCard";
import { FilterControls } from "./FilterControls";
import { ComparisonView } from "./ComparisonView";
import { EmptyState } from "./EmptyState";

// Types
interface GeneratedImageMetadata {
  timestamp: Date;
  model: string;
  prompt?: string;
  parameters?: Record<string, any>;
  generationTime: number;
  // Processing-specific metadata
  progress?: number; // 0-100 for processing
  stage?: string; // Current generation stage
  estimatedTime?: number; // Estimated remaining time in seconds
  error?: string; // Error message for failed generations
}

interface GeneratedImageCard {
  id: string;
  url: string;
  thumbnail: string;
  metadata: GeneratedImageMetadata;
  status: 'processing' | 'completed' | 'error';
  isFavorite: boolean;
  r2Key?: string;
}

interface GeneratedImagesPanelProps {
  isOpen: boolean;
  onClose: () => void;
  originalImage?: string;
  backgroundImage?: string;
  activeShot?: {
    id?: string;
    imageUrl?: string;
    title?: string;
  };
  generatedImages: string[];
  projectGeneratedImages: string[];
  projectFiles?: any[]; // Add project files data for status detection
  onImageSelect: (url: string, index: number) => void;
  onImageDelete: (image: GeneratedImageCard) => void;
  onImageRetry: (image: GeneratedImageCard) => void;
  onImageFavorite: (image: GeneratedImageCard) => void;
  onImageCompare: (image: GeneratedImageCard) => void;
  openSceneImageContextMenu: (event: React.MouseEvent, url: string, title: string, type: string) => void;
  currentPlan?: string;
  companyId?: string;
  /** Capture video frame → save as current shot's imageUrl */
  onVideoSnapshotToSelf?: (videoUrl: string, currentTime: number) => Promise<void>;
  /** Capture video frame → save as next shot's imageUrl */
  onVideoSnapshotToNext?: (videoUrl: string, currentTime: number) => Promise<void>;
}

interface FilterState {
  statuses: string[];
  sortBy: string;
  generatingCount?: number;
  completedCount?: number;
  errorCount?: number;
}

export function GeneratedImagesPanel({
  isOpen,
  onClose,
  originalImage,
  backgroundImage,
  activeShot,
  generatedImages,
  projectGeneratedImages,
  projectFiles,
  onImageSelect,
  onImageDelete,
  onImageRetry,
  onImageFavorite,
  onImageCompare,
  openSceneImageContextMenu,
  currentPlan,
  companyId,
  onVideoSnapshotToSelf,
  onVideoSnapshotToNext,
}: GeneratedImagesPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    sortBy: 'date'
  });
  const [shareCandidate, setShareCandidate] = useState<any>(null);
  const shareFileMutation = useMutation(api.storyboard.gallery.shareFile);
  const unshareFileMutation = useMutation(api.storyboard.gallery.unshareFile);
  const updateTagsMutation = useMutation(api.storyboard.storyboardFiles.updateFileTags);

  // ── Auto-poll processing files ──────────────────────────────────────
  const pollingRef = useRef<Set<string>>(new Set());

  const pollResult = useCallback(async (taskId: string, fileId: string) => {
    if (pollingRef.current.has(fileId)) return;
    pollingRef.current.add(fileId);
    try {
      const res = await fetch('/api/storyboard/pull-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, fileId, companyId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Music ready!');
      } else if (result.status && !['PENDING', 'PROCESSING', 'QUEUED', 'unknown'].includes(result.status)) {
        // Failed — toast is optional since the card will show failed state
      }
      // else still processing — will retry on next interval
    } catch {
      // Ignore — will retry
    } finally {
      pollingRef.current.delete(fileId);
    }
  }, [companyId]);

  useEffect(() => {
    if (!projectFiles) return;
    const processingFiles = projectFiles.filter(
      (f: any) => (f.status === 'processing' || f.status === 'generating') && f.taskId && f.categoryId === activeShot?.id && f.model?.startsWith('ai-music-api/')
    );
    // Only poll files created within the last 10 minutes
    const fiveMinAgo = Date.now() - 10 * 60 * 1000;
    const recentProcessing = processingFiles.filter((f: any) => (f.createdAt || 0) > fiveMinAgo);
    if (recentProcessing.length === 0) return;

    // Poll every 15 seconds, auto-stops after 5 min (file falls out of recentProcessing)
    const interval = setInterval(() => {
      recentProcessing.forEach((f: any) => {
        if (f.taskId) pollResult(f.taskId, String(f._id));
      });
    }, 15000);

    // First poll after 5 seconds
    const initialTimeout = setTimeout(() => {
      recentProcessing.forEach((f: any) => {
        if (f.taskId) pollResult(f.taskId, String(f._id));
      });
    }, 5000);

    return () => { clearInterval(interval); clearTimeout(initialTimeout); };
  }, [projectFiles, activeShot?.id, pollResult]);

  // Free personal users cannot unshare
  const isPersonalFree = !companyId?.startsWith("org_") && currentPlan === "free";
  const canUnshare = !isPersonalFree;

  const handleTagToggle = async (fileId: string, tag: string) => {
    try {
      await updateTagsMutation({ fileId: fileId as Id<"storyboard_files">, tag });
    } catch (err: any) {
      toast.error(err.message || "Failed to update tag");
    }
  };

  const handleShare = async (image: any) => {
    try {
      await shareFileMutation({ fileId: image.id as Id<"storyboard_files"> });
      toast.success("File shared to gallery!");
    } catch (err: any) {
      toast.error(err.message || "Failed to share");
    }
  };

  const handleUnshare = async (image: any) => {
    try {
      await unshareFileMutation({ fileId: image.id as Id<"storyboard_files"> });
      toast.success("File unshared from gallery");
    } catch (err: any) {
      toast.error(err.message || "Failed to unshare");
    }
  };
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'comparison'>('grid');
  const [comparisonPair, setComparisonPair] = useState<[string, string] | undefined>();

  // Build cards strictly from real storyboard_files rows for the active storyboard item.
  const processedImages = useMemo(() => {
    if (!projectFiles || !activeShot?.id) {
      return [] as GeneratedImageCard[];
    }

    return projectFiles
      .filter((file) => {
        if (file.category !== "generated" && file.category !== "combine") return false;
        if (String(file.categoryId ?? "") !== String(activeShot.id)) return false;
        if (file.status === "deleted") return false;

        const hasR2Key = Boolean(file.r2Key);
        const isProcessing = file.status === "processing" || file.status === "generating";
        const isCompleted = file.status === "completed" || file.status === "ready";
        const isFailed = file.status === "failed" || file.status === "error";

        if (isProcessing) {
          return !hasR2Key;
        }

        if (isCompleted) {
          return hasR2Key && Boolean(file.sourceUrl);
        }

        if (isFailed) {
          return true; // Show failed files so user can see error codes
        }

        return false;
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .map((file) => {
        const isProcessing = file.status === "processing" || file.status === "generating";
        const isFailed = file.status === "failed" || file.status === "error";

        return {
          id: String(file._id),
          url: file.sourceUrl || "",
          thumbnail: file.sourceUrl || "",
          fileType: file.fileType as 'image' | 'video' | 'audio' | 'music',
          metadata: {
            timestamp: new Date(file.createdAt ?? Date.now()),
            model: (file.fileType === 'audio' || file.fileType === 'music') ? (file.metadata?.musicTitle || file.filename || file.model || 'Unknown') : (file.model || file.metadata?.model || file.filename || 'Unknown'),
            prompt: file.metadata?.prompt || '',
            parameters: file.metadata?.parameters || {},
            generationTime: file.metadata?.generationTime || 0,
            progress: isProcessing ? file.metadata?.progress : undefined,
            stage: isProcessing ? file.metadata?.stage : undefined,
            estimatedTime: isProcessing ? file.metadata?.estimatedTime : undefined,
            error: file.metadata?.error || (isFailed ? file.responseMessage : undefined),
          },
          status: isFailed ? 'error' : (isProcessing ? 'processing' : 'completed'),
          isFavorite: Boolean(file.isFavorite),
          r2Key: file.r2Key,
          responseCode: file.responseCode,
          responseMessage: file.responseMessage,
          creditsUsed: file.creditsUsed,
          prompt: file.prompt || file.metadata?.prompt || '',
          isShared: file.isShared || false,
          category: file.category || "generated",
          tags: file.tags || [],
          size: file.size || 0,
          categoryId: file.categoryId ? String(file.categoryId) : "",
          taskId: file.taskId,
          userId: file.userId,
          rawMetadata: file.metadata,
        } as GeneratedImageCard & { responseCode?: number; responseMessage?: string; creditsUsed?: number; prompt?: string; isShared?: boolean; category?: string; tags?: string[]; size?: number; categoryId?: string; taskId?: string; userId?: string; metadata?: any };
      });
  }, [activeShot?.id, projectFiles]);

  // Filter images based on current filters
  const filteredImages = useMemo(() => {
    let filtered = processedImages;

    // Filter by statuses
    if (filters.statuses.length > 0) {
      filtered = filtered.filter(img => filters.statuses.includes(img.status));
    }

    // Sort images
    filtered = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case 'date':
          return (b.metadata?.timestamp?.getTime?.() ?? 0) - (a.metadata?.timestamp?.getTime?.() ?? 0);
        case 'date-asc':
          return (a.metadata?.timestamp?.getTime?.() ?? 0) - (b.metadata?.timestamp?.getTime?.() ?? 0);
        case 'name':
          return (a.metadata.prompt || '').localeCompare(b.metadata.prompt || '');
        case 'model':
          return a.metadata.model.localeCompare(b.metadata.model);
        case 'favorites':
          return (b.isFavorite ? 1 : 0) - (a.isFavorite ? 1 : 0);
        case 'status':
          return a.status.localeCompare(b.status);
        default:
          return 0;
      }
    });

    return filtered;
  }, [processedImages, filters]);

  // Update processing count
  const processingCount = processedImages.filter(img => img.status === 'processing').length;
  const completedCount = processedImages.filter(img => img.status === 'completed').length;
  const errorCount = processedImages.filter(img => img.status === 'error').length;

  const handleFilterChange = (newFilters: Partial<FilterState>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  };

  const toggleFilter = (type: 'statuses', value: string) => {
    const currentFilters = filters.statuses;
    const newFilters = currentFilters.includes(value)
      ? currentFilters.filter(item => item !== value)
      : [...currentFilters, value];
    
    setFilters(prev => ({ ...prev, statuses: newFilters }));
  };

  const handleImageSelect = (image: GeneratedImageCard) => {
    const index = processedImages.findIndex(img => img.id === image.id);
    onImageSelect(image.url, index);
  };

  const handleOriginalImageClick = () => {
    const imageToSet = originalImage || backgroundImage || activeShot?.imageUrl;
    if (imageToSet) {
      onImageSelect(imageToSet, -1);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className={`absolute top-0 left-0 h-full w-80 bg-(--bg-secondary)/95 backdrop-blur-md border-r border-(--border-primary) transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="px-4 py-3.5 border-b border-(--border-secondary) flex items-center justify-between">
          <h3 className="text-(--text-primary) text-[14px] font-semibold">Generated Images</h3>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition"
          >
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Filter Controls */}
        <FilterControls
          filters={{ ...filters, generatingCount: processingCount, completedCount, errorCount }}
          onFilterChange={handleFilterChange}
        />

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 min-h-0 overflow-y-auto pb-32 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-(--border-primary)">
            {/* Original Image Section */}
            {(originalImage || backgroundImage || activeShot?.imageUrl) && (
              <div className="p-4">
                <h4 className="text-(--text-primary) text-[13px] font-semibold mb-3">Original</h4>
                <div className="relative group cursor-pointer rounded-xl overflow-hidden border border-(--border-secondary) hover:border-(--border-primary) transition"
                       onClick={handleOriginalImageClick}
                       onContextMenu={(event) => {
                         const imageToSet = originalImage || backgroundImage || activeShot?.imageUrl;
                         if (!imageToSet) return;
                         openSceneImageContextMenu(event, imageToSet, `${activeShot?.title || "Scene"} reference`, "environment");
                       }}>
                  <img
                    src={originalImage || backgroundImage || activeShot?.imageUrl}
                    alt="Original"
                    className="w-full h-32 object-cover pointer-events-none"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                    <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </div>
              </div>
            )}
            
            {/* Generated Images Section */}
            {filteredImages.length > 0 ? (
              <div className="p-4">
                <h4 className="text-(--text-primary) text-[13px] font-semibold mb-3">
                  Generated ({filteredImages.length})
                </h4>
                <div className="space-y-2 pb-4">
                  {filteredImages.map((image) => (
                    <GeneratedImageCard
                      key={image.id}
                      image={image}
                      onSelect={handleImageSelect}
                      onFavorite={onImageFavorite}
                      onDelete={onImageDelete}
                      onRetry={onImageRetry}
                      onCompare={onImageCompare}
                      fileId={image.id}
                      responseCode={(image as any).responseCode}
                      responseMessage={(image as any).responseMessage}
                      creditsUsed={(image as any).creditsUsed}
                      prompt={(image as any).prompt}
                      isShared={(image as any).isShared}
                      r2Key={(image as any).r2Key}
                      category={(image as any).category}
                      tags={(image as any).tags || []}
                      size={(image as any).size}
                      categoryId={(image as any).categoryId}
                      onTagToggle={(tag) => handleTagToggle(image.id, tag)}
                      onShare={handleShare}
                      onUnshare={canUnshare ? handleUnshare : undefined}
                      taskId={(image as any).taskId}
                      companyId={companyId}
                      userId={(image as any).userId}
                      metadata={(image as any).metadata}
                      onSnapshotToSelf={onVideoSnapshotToSelf}
                      onSnapshotToNext={onVideoSnapshotToNext}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <div className="p-4">
                <EmptyState onStartGeneration={() => {}} />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Comparison Modal */}
      {comparisonPair && (
        <ComparisonView
          images={comparisonPair.map(id => processedImages.find(img => img.id === id)!).filter(Boolean)}
          onClose={() => setComparisonPair(undefined)}
        />
      )}

      {/* Share Confirmation — gallery-style dialog with image preview */}
      {shareCandidate && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={() => setShareCandidate(null)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div
            className="relative bg-(--bg-secondary) rounded-2xl w-[440px] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-(--border-primary)"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Image preview */}
            {shareCandidate.url && (
              <div className="w-full h-[200px] overflow-hidden bg-black">
                {shareCandidate.fileType === 'video' ? (
                  <video src={shareCandidate.url} className="w-full h-full object-cover" muted preload="metadata" />
                ) : (
                  <img src={shareCandidate.url} alt="Share preview" className="w-full h-full object-cover" />
                )}
              </div>
            )}

            {/* Content */}
            <div className="p-5">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-(--accent-blue)/15 flex items-center justify-center shrink-0">
                  <svg className="w-5 h-5 text-[#3B82F6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-white font-bold text-[15px]">Share to Gallery</h3>
                  <p className="text-(--text-secondary) text-xs">{shareCandidate.metadata?.model || 'AI Generated'}</p>
                </div>
              </div>

              <p className="text-(--text-secondary) text-[13px] leading-relaxed mb-5">
                Once shared, this file will be permanently visible in the Community Gallery. Other users can view, rate, and donate credits to you. This cannot be undone.
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShareCandidate(null)}
                  className="px-5 py-2.5 text-[13px] text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-tertiary) hover:bg-white/10 border border-(--border-primary) rounded-xl transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={async () => {
                    try {
                      await shareFileMutation({ fileId: shareCandidate.id as Id<"storyboard_files"> });
                      toast.success("File shared to gallery!");
                    } catch (err: any) {
                      toast.error(err.message || "Failed to share file");
                    }
                    setShareCandidate(null);
                  }}
                  className="px-5 py-2.5 text-[13px] text-white bg-(--accent-blue) hover:bg-(--accent-blue-hover) rounded-xl transition font-semibold"
                >
                  Share
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
