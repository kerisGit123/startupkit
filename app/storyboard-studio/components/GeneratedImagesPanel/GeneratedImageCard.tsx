"use client";

import React from "react";
import { Eye, Trash2, AlertCircle, Loader2, Cpu, Info, Copy } from "lucide-react";

// Types
interface GeneratedImageMetadata {
  timestamp: Date;
  model: string;
  prompt?: string;
  parameters?: Record<string, any>;
  generationTime: number;
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
}

interface GeneratedImageCardProps {
  image: GeneratedImageCard;
  onSelect: (image: GeneratedImageCard) => void;
  onFavorite: (image: GeneratedImageCard) => void;
  onDelete: (image: GeneratedImageCard) => void;
  onRetry: (image: GeneratedImageCard) => void;
  onCompare: (image: GeneratedImageCard) => void;
  fileId?: string; // Add file ID prop for processing files
}

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString();
};

export function GeneratedImageCard({ 
  image, 
  onSelect, 
  onFavorite, 
  onDelete, 
  onRetry, 
  onCompare,
  fileId 
}: GeneratedImageCardProps) {
  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileId) return;
    navigator.clipboard.writeText(fileId);
  };

  return (
    <div className="group relative bg-[#1A1A1A] rounded-xl border border-[#3D3D3D] overflow-hidden transition-all hover:border-[#4A90E2] hover:shadow-lg">
      {/* Image Container */}
      <div className="relative h-[100px] bg-[#0A0A0A]">
        {image.status === 'completed' && image.thumbnail ? (
          <img 
            src={image.thumbnail} 
            alt={image.metadata.prompt || `Generated ${image.id}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full bg-[#0A0A0A]" />
        )}
        
        {/* Processing State */}
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center">
            <Loader2 className="w-6 h-6 text-white animate-spin mb-2" />
            <div className="text-white text-xs font-medium">Processing...</div>
            
            {/* File ID Info for Processing Files */}
            {fileId && (
              <div className="flex items-center gap-2 mt-2">
                <Info className="w-4 h-4 text-white" />
                <span className="text-white text-xs font-mono bg-black/50 px-2 py-1 rounded">
                  {fileId.slice(0, 8)}...
                </span>
              </div>
            )}
            
            {image.metadata.progress && (
              <div className="w-32 h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                <div 
                  className="h-full bg-[#4A90E2] transition-all duration-300"
                  style={{ width: `${image.metadata.progress}%` }}
                />
              </div>
            )}
            
            {image.metadata.estimatedTime && (
              <div className="text-[#A0A0A0] text-xs mt-1">
                ~{image.metadata.estimatedTime}s remaining
              </div>
            )}
            {image.metadata.stage && (
              <div className="text-[#A0A0A0] text-xs mt-1">{image.metadata.stage}</div>
            )}
          </div>
        )}

        {image.status === 'processing' && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-center gap-2 pt-4 pointer-events-none">
            <button
              onClick={handleCopyId}
              className="p-2 bg-white/20 rounded-lg hover:bg-white/30 pointer-events-auto"
              title="Copy storyboard file ID"
            >
              <Copy className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => onDelete(image)}
              className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500 pointer-events-auto"
              title="Delete processing file"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        
        {/* Error State */}
        {image.status === 'error' && (
          <div className="absolute inset-0 bg-red-500/20 flex flex-col items-center justify-center">
            <AlertCircle className="w-6 h-6 text-red-400 mb-2" />
            <div className="text-white text-xs font-medium">Generation Failed</div>
            {image.metadata.error && (
              <div className="text-red-300 text-xs mt-1 text-center px-2">{image.metadata.error}</div>
            )}
            <button 
              onClick={() => onRetry(image)}
              className="mt-2 px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
            >
              Retry
            </button>
          </div>
        )}
        
        {/* Hover Actions (only for completed images) */}
        {image.status === 'completed' && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            <button onClick={() => onSelect(image)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <Eye className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => navigator.clipboard.writeText(fileId || image.id)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30">
              <Copy className="w-4 h-4 text-white" />
            </button>
            <button onClick={() => onDelete(image)} className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500">
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
      </div>
      
      {/* Metadata Section */}
      {image.status !== 'completed' && (
        <div className="p-3">
          {/* Status Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              image.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {image.status === 'processing' ? 'Processing' : 'Failed'}
            </span>

            <span className="text-[#6E6E6E] text-xs">
              {formatRelativeTime(image.metadata.timestamp)}
            </span>
          </div>
          
          <div className="flex items-center gap-2 mb-2">
            <Cpu className="w-3 h-3 text-[#6E6E6E]" />
            <span className="text-[#6E6E6E] text-xs">
              {image.metadata.model}
            </span>
            {image.metadata.generationTime > 0 && (
              <span className="text-[#6E6E6E] text-xs">
                • {image.metadata.generationTime}s
              </span>
            )}
          </div>

          {image.status === 'processing' && image.metadata.progress !== undefined && (
            <div className="flex items-center gap-2 text-xs text-[#A0A0A0] mb-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{image.metadata.progress}% complete</span>
              {image.metadata.estimatedTime && (
                <span>• ~{image.metadata.estimatedTime}s</span>
              )}
            </div>
          )}
          
          {/* Error Info (for error state) */}
          {image.status === 'error' && (
            <div className="flex items-center gap-2 text-xs text-red-400 mb-2">
              <AlertCircle className="w-3 h-3" />
              <span>Generation failed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
