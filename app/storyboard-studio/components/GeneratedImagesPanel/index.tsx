import React, { useState, useMemo } from "react";
import { X, Search, Eye, Star, GitCompare, Trash2, AlertCircle, Loader2, Clock, Cpu, Image } from "lucide-react";
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
  openSceneImageContextMenu
}: GeneratedImagesPanelProps) {
  const [filters, setFilters] = useState<FilterState>({
    statuses: [],
    sortBy: 'date'
  });
  
  const [viewMode, setViewMode] = useState<'grid' | 'list' | 'comparison'>('grid');
  const [comparisonPair, setComparisonPair] = useState<[string, string] | undefined>();

  // Build cards strictly from real storyboard_files rows for the active storyboard item.
  const processedImages = useMemo(() => {
    if (!projectFiles || !activeShot?.id) {
      return [] as GeneratedImageCard[];
    }

    return projectFiles
      .filter((file) => {
        if (file.category !== "generated") return false;
        if (String(file.categoryId ?? "") !== String(activeShot.id)) return false;

        const hasR2Key = Boolean(file.r2Key);
        const isProcessing = file.status === "processing" || file.status === "generating";
        const isCompleted = file.status === "completed" || file.status === "ready";

        if (isProcessing) {
          return !hasR2Key;
        }

        if (isCompleted) {
          return hasR2Key && Boolean(file.sourceUrl);
        }

        return false;
      })
      .sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0))
      .map((file) => {
        const isProcessing = file.status === "processing" || file.status === "generating";

        return {
          id: String(file._id),
          url: file.sourceUrl || "",
          thumbnail: file.sourceUrl || "",
          metadata: {
            timestamp: new Date(file.createdAt ?? Date.now()),
            model: file.metadata?.model || file.filename || 'Unknown',
            prompt: file.metadata?.prompt || '',
            parameters: file.metadata?.parameters || {},
            generationTime: file.metadata?.generationTime || 0,
            progress: isProcessing ? file.metadata?.progress : undefined,
            stage: isProcessing ? file.metadata?.stage : undefined,
            estimatedTime: isProcessing ? file.metadata?.estimatedTime : undefined,
            error: file.metadata?.error
          },
          status: isProcessing ? 'processing' : 'completed',
          isFavorite: Boolean(file.isFavorite),
          r2Key: file.r2Key,
        } as GeneratedImageCard;
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
          return b.metadata.timestamp.getTime() - a.metadata.timestamp.getTime();
        case 'date-asc':
          return a.metadata.timestamp.getTime() - b.metadata.timestamp.getTime();
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
      <div className={`absolute top-0 left-0 h-full w-80 bg-[#111118] border-r border-white/6 transform transition-transform duration-300 ease-in-out z-30 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Header */}
        <div className="p-4 border-b border-white/6 flex items-center justify-between">
          <h3 className="text-white font-medium">Generated Images</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Controls */}
        <FilterControls
          filters={{ ...filters, generatingCount: processingCount, completedCount, errorCount }}
          onFilterChange={handleFilterChange}
        />

        {/* Content */}
        <div className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto">
            {/* Original Image Section */}
            {(originalImage || backgroundImage || activeShot?.imageUrl) && (
              <div className="p-4">
                <h4 className="text-white text-sm font-medium mb-3">Original</h4>
                <div className="relative group cursor-pointer rounded-xl overflow-hidden border-2 border-gray-700 hover:border-gray-600 transition"
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
                <h4 className="text-white text-sm font-medium mb-3">
                  Generated ({filteredImages.length})
                </h4>
                <div className="space-y-3 pb-4">
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
    </>
  );
}
