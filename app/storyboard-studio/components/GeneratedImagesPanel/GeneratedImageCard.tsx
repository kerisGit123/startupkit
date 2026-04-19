"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Trash2, AlertCircle, Loader2, Cpu, Info, Copy, Play, X, Download, FileText, Share2 } from "lucide-react";
import { toast } from "sonner";
import { getResponseCodeInfo, getResponseCodeColor } from "@/lib/storyboard/kieResponse";
import { FileContextMenu, getTagColor } from "../shared/FileContextMenu";

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
  fileType?: 'image' | 'video'; // Add fileType to distinguish between images and videos
}

interface GeneratedImageCardProps {
  image: GeneratedImageCard;
  onSelect: (image: GeneratedImageCard) => void;
  onFavorite: (image: GeneratedImageCard) => void;
  onDelete: (image: GeneratedImageCard) => void;
  onRetry: (image: GeneratedImageCard) => void;
  onCompare: (image: GeneratedImageCard) => void;
  onShare?: (image: GeneratedImageCard) => void;
  onUnshare?: (image: GeneratedImageCard) => void;
  isShared?: boolean;
  r2Key?: string;
  category?: string;
  fileId?: string;
  responseCode?: number;
  responseMessage?: string;
  creditsUsed?: number;
  prompt?: string;
  tags?: string[];
  onTagToggle?: (tag: string) => void;
  size?: number;
  categoryId?: string;
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
  onShare,
  isShared,
  r2Key,
  category,
  fileId,
  responseCode,
  responseMessage,
  creditsUsed,
  prompt,
  tags = [],
  onTagToggle,
  onUnshare,
  size,
  categoryId,
}: GeneratedImageCardProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  const structuredTags = tags.filter(t => t.includes(":"));

  // Eligibility: tags and share/unshare only for category=generated, categoryId not empty, size>0
  const isEligible = category === "generated" && !!categoryId && (size ?? 0) > 0;

  const handleContextMenu = (e: React.MouseEvent) => {
    if (image.status !== "completed" || !onTagToggle || !isEligible) return;
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };
  
  const handleCopyId = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!fileId) return;
    navigator.clipboard.writeText(fileId);
  };

  const handleImageClick = () => {
    if (image.fileType === 'video') {
      setShowVideoDialog(true);
    } else {
      setShowImagePreview(true);
    }
  };

  const handleDownload = async () => {
    try {
      // For videos, fetch the video and create a blob URL for download
      if (image.fileType === 'video') {
        const response = await fetch(image.url);
        const blob = await response.blob();
        const blobUrl = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = blobUrl;
        link.download = `${image.metadata.model}-${image.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } else {
        // For images, use the direct URL
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `${image.metadata.model}-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `${image.metadata.model}-${image.id}.${image.fileType === 'video' ? 'mp4' : 'png'}`;
      link.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className="group relative bg-[#1A1A1A] rounded-xl border border-[#3D3D3D] overflow-hidden transition-all hover:border-[#4A90E2] hover:shadow-lg"
      onContextMenu={handleContextMenu}
    >
      {/* Image Container */}
      <div className="relative h-[100px] bg-[#0A0A0A]">
        {image.status === 'completed' && image.thumbnail ? (
          <div 
            className="relative w-full h-full cursor-pointer group"
            onClick={handleImageClick}
          >
            {image.fileType === 'video' ? (
              // Video thumbnail with overlay
              <>
                <video
                  src={image.thumbnail}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.currentTime = 1; // Set to 1 second for thumbnail
                  }}
                />
                {/* Dark overlay for better text visibility */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                
                {/* Video overlay removed — hover actions handled below */}

                {/* AI + Video badges — top left */}
                <div className="absolute top-2 left-2 flex items-center gap-1">
                  <div className="bg-emerald-600/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg font-medium backdrop-blur-sm">
                    AI
                  </div>
                  <div className="bg-red-600/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg font-medium backdrop-blur-sm">
                    VIDEO
                  </div>
                </div>
                
                {/* Duration indicator */}
                <div className="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                  {image.metadata.parameters?.duration ? `${image.metadata.parameters.duration}s` : '4s'}
                </div>
              </>
            ) : (
              // Image
              <>
                <img
                  src={image.thumbnail}
                  alt={image.metadata.prompt || `Generated ${image.id}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Source badge */}
                {image.metadata.model === 'combine-layers' ? (
                  <div className="absolute top-2 left-2 bg-purple-600/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg font-medium backdrop-blur-sm">
                    COMBINE
                  </div>
                ) : (
                  <div className="absolute top-2 left-2 bg-emerald-600/90 text-white text-[9px] px-1.5 py-0.5 rounded shadow-lg font-medium backdrop-blur-sm">
                    AI
                  </div>
                )}
              </>
            )}
          </div>
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
            {responseCode !== undefined && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-mono font-medium mt-1 cursor-default ${getResponseCodeColor(responseCode)}`}
                title={`${getResponseCodeInfo(responseCode).label}${responseMessage ? `: ${responseMessage}` : ''}`}
              >
                {responseCode} - {getResponseCodeInfo(responseCode).label}
              </span>
            )}
            {image.metadata.error && !responseCode && (
              <div className="text-red-300 text-xs mt-1 text-center px-2">{image.metadata.error}</div>
            )}
            <div className="flex items-center gap-2 mt-2">
              <button
                onClick={() => onRetry(image)}
                className="px-3 py-1 bg-red-500 text-white text-xs rounded hover:bg-red-600 transition"
              >
                Retry
              </button>
              {(creditsUsed === 0 || creditsUsed === undefined) && (
                <button
                  onClick={() => onDelete(image)}
                  className="p-1.5 bg-red-500/80 rounded hover:bg-red-500 transition"
                  title="Delete failed generation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-white" />
                </button>
              )}
            </div>
          </div>
        )}
        
        {/* Top-right: tag badges + shared indicator */}
        {image.status === 'completed' && (structuredTags.length > 0 || isShared) && (
          <div className="absolute top-1.5 right-1.5 z-10 flex flex-col items-end gap-1">
            {isShared && (
              <div className="w-5 h-5 rounded-full bg-green-600/90 flex items-center justify-center" title="Shared to Gallery">
                <Share2 className="w-3 h-3 text-white" />
              </div>
            )}
            {structuredTags.map(tag => {
              const parts = tag.split(":");
              const category = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
              const sub = parts[1] ? parts[1].split("-").map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(" ") : "";
              return (
                <span
                  key={tag}
                  className="px-2 py-0.5 rounded text-[10px] font-semibold backdrop-blur-sm shadow-sm"
                  style={{ backgroundColor: `${getTagColor(tag)}CC`, color: "#fff" }}
                  title={`${category}: ${sub}`}
                >
                  {sub}
                </span>
              );
            })}
          </div>
        )}

        {/* Hover Actions (only for completed images) */}
        {image.status === 'completed' && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
            {image.fileType === 'video' ? (
              // Video: Show play, download, copy prompt, and delete buttons
              <>
                <button onClick={handleImageClick} className="p-2 bg-white/20 rounded-lg hover:bg-white/30" title="Play video">
                  <Play className="w-4 h-4 text-white" />
                </button>
                <button onClick={handleDownload} className="p-2 bg-white/20 rounded-lg hover:bg-white/30" title="Download video">
                  <Download className="w-4 h-4 text-white" />
                </button>
                {prompt && (
                  <button onClick={() => { navigator.clipboard.writeText(prompt); toast.success('Prompt copied!'); }} className="p-2 bg-white/20 rounded-lg hover:bg-white/30" title="Copy prompt">
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                )}
                <button onClick={() => onDelete(image)} className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500" title="Delete video">
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              // Image: Show preview, copy prompt, and delete icons
              <>
                <button onClick={() => onSelect(image)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30" title="Preview">
                  <Eye className="w-4 h-4 text-white" />
                </button>
                {prompt ? (
                  <button onClick={() => { navigator.clipboard.writeText(prompt); toast.success('Prompt copied!'); }} className="p-2 bg-white/20 rounded-lg hover:bg-white/30" title="Copy prompt">
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button onClick={() => navigator.clipboard.writeText(fileId || image.id)} className="p-2 bg-white/20 rounded-lg hover:bg-white/30" title="Copy file ID">
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                )}
                <button onClick={() => onDelete(image)} className="p-2 bg-red-500/80 rounded-lg hover:bg-red-500" title="Delete">
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Metadata Section */}
      {image.status !== 'completed' && (
        <div className="p-3">
          {/* Status Badge + Response Code */}
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className={`px-2 py-1 rounded text-xs font-medium ${
              image.status === 'processing' ? 'bg-blue-500/20 text-blue-400' :
              'bg-red-500/20 text-red-400'
            }`}>
              {image.status === 'processing' ? 'Processing' : 'Failed'}
            </span>

            {responseCode !== undefined && (
              <span
                className={`px-2 py-1 rounded text-xs font-mono font-medium cursor-default ${getResponseCodeColor(responseCode)}`}
                title={`${getResponseCodeInfo(responseCode).label}${responseMessage ? `: ${responseMessage}` : ''}`}
              >
                {responseCode}
              </span>
            )}

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
      

      {/* Tag + Share Context Menu */}
      {contextMenu && onTagToggle && (
        <FileContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          fileId={fileId}
          currentTags={tags}
          onTagToggle={onTagToggle}
          onClose={() => setContextMenu(null)}
          isShared={isShared}
          onShare={onShare && r2Key ? () => onShare(image) : undefined}
          onUnshare={onUnshare ? () => onUnshare(image) : undefined}
        />
      )}

      {/* Image Preview Popup — rendered via portal to escape panel overflow */}
      {showImagePreview && image.fileType !== 'video' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }}
          onClick={() => setShowImagePreview(false)}
        >
          <div className="bg-[#1A1A1A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
              <h3 className="text-white font-medium">{image.metadata?.model === 'combine-layers' ? 'Combined Image' : 'Generated Image'}</h3>
              <button
                onClick={() => setShowImagePreview(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Image */}
            <div className="p-4 flex justify-center">
              <img
                src={image.url}
                alt={image.filename}
                className="max-w-full rounded-lg"
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-[#3D3D3D] flex items-center justify-between">
              <div>
                {image.metadata?.model && (
                  <div className="text-sm text-gray-400">Model: {image.metadata.model}</div>
                )}
                {image.prompt && (
                  <div className="text-sm text-gray-400 mt-1 line-clamp-2">Prompt: {image.prompt}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white text-sm rounded-lg transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => { onSelect(image); setShowImagePreview(false); }}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-sm rounded-lg transition-colors"
                >
                  Use as Background
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Video Preview Popup — rendered via portal to escape panel overflow */}
      {showVideoDialog && image.fileType === 'video' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }}
          onClick={() => setShowVideoDialog(false)}
        >
          <div className="bg-[#1A1A1A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
              <h3 className="text-white font-medium">Video Preview</h3>
              <button
                onClick={() => setShowVideoDialog(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Video Player */}
            <div className="p-4">
              <video
                src={image.url}
                controls
                autoPlay
                className="w-full rounded-lg"
                style={{ maxHeight: '70vh' }}
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#3D3D3D]">
              <div className="text-sm text-gray-400">
                Model: {image.metadata.model}
              </div>
              {image.metadata.prompt && (
                <div className="text-sm text-gray-400 mt-1">
                  Prompt: {image.metadata.prompt}
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}
