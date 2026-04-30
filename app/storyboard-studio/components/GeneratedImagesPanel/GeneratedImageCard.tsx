"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Eye, Trash2, AlertCircle, Loader2, Cpu, Info, Copy, Play, X, Download, FileText, Share2, RefreshCw, Mic, Pencil, Check, Clock, RectangleHorizontal, Coins } from "lucide-react";
import { VideoPreviewDialog } from "../shared/VideoPreviewDialog";
import { CreatePersonaDialog } from "./CreatePersonaDialog";
import { EditPersonaDialog } from "./EditPersonaDialog";
import { toast } from "sonner";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { getResponseCodeInfo, getResponseCodeColor } from "@/lib/storyboard/kieResponse";
import { FileContextMenu, getTagColor } from "../shared/FileContextMenu";
import { AudioPreviewDialog } from "../shared/AudioPreviewDialog";

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
  fileType?: 'image' | 'video' | 'audio' | 'music';
  filename?: string;
  prompt?: string;
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
  taskId?: string;
  companyId?: string;
  userId?: string;
  metadata?: any;
  /** Capture video frame → save as current shot's imageUrl */
  onSnapshotToSelf?: (videoUrl: string, currentTime: number) => Promise<void>;
  /** Capture video frame → save as next shot's imageUrl */
  onSnapshotToNext?: (videoUrl: string, currentTime: number) => Promise<void>;
}

// Helper function to format relative time
const formatRelativeTime = (date: Date): string => {
  if (!date || !date.getTime) return '';
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
  taskId,
  companyId,
  userId,
  metadata,
  onSnapshotToSelf,
  onSnapshotToNext,
}: GeneratedImageCardProps) {
  const [showVideoDialog, setShowVideoDialog] = useState(false);
  const [showImagePreview, setShowImagePreview] = useState(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isPulling, setIsPulling] = useState(false);
  const [showPersonaDialog, setShowPersonaDialog] = useState(false);
  const [showEditPersonaDialog, setShowEditPersonaDialog] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameValue, setNameValue] = useState("");
  const renameFile = useMutation(api.storyboard.storyboardFiles.renameFile);

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

  const handlePullResult = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!taskId || !fileId || isPulling) return;
    setIsPulling(true);
    try {
      const res = await fetch('/api/storyboard/pull-result', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ taskId, fileId, companyId }),
      });
      const result = await res.json();
      if (result.success) {
        toast.success('Result pulled successfully!');
      } else if (result.status === 'unknown' || result.status === 'PENDING' || result.status === 'PROCESSING') {
        toast.info(`Task still ${result.status?.toLowerCase() || 'processing'}...`);
      } else {
        toast.error(result.error || result.message || 'Failed to pull result');
      }
    } catch (err) {
      toast.error('Failed to pull result');
    } finally {
      setIsPulling(false);
    }
  };

  const [showAudioPlayer, setShowAudioPlayer] = useState(false);

  const handleImageClick = () => {
    if (image.fileType === 'video') {
      setShowVideoDialog(true);
    } else if (image.fileType === 'audio' || image.fileType === 'music') {
      setShowAudioPlayer(true);
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
        link.download = `${image.metadata?.model}-${image.id}.mp4`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        // Clean up the blob URL
        URL.revokeObjectURL(blobUrl);
      } else {
        // For images, use the direct URL
        const link = document.createElement('a');
        link.href = image.url;
        link.download = `${image.metadata?.model}-${image.id}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } catch (error) {
      console.error('Download failed:', error);
      // Fallback to direct link
      const link = document.createElement('a');
      link.href = image.url;
      link.download = `${image.metadata?.model}-${image.id}.${image.fileType === 'video' ? 'mp4' : (image.fileType === 'audio' || image.fileType === 'music') ? 'mp3' : 'png'}`;
      link.target = '_blank'; // Open in new tab as fallback
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div
      className="group relative bg-(--bg-secondary) rounded-xl overflow-hidden transition-all duration-200 border border-(--border-secondary) hover:border-(--border-primary) hover:bg-(--bg-tertiary)/40"
      onContextMenu={handleContextMenu}
    >
      {/* Image Container */}
      <div className="relative h-[120px] bg-(--bg-primary) rounded-lg overflow-hidden">
        {image.status === 'completed' && image.thumbnail ? (
          <div
            className="relative w-full h-full cursor-pointer group"
            onClick={handleImageClick}
          >
            {(image.fileType === 'music' || image.fileType === 'audio') ? (
              // Music/Audio card
              <>
                <div className={`w-full h-full bg-linear-to-br ${image.fileType === 'music' ? 'from-purple-950/60 via-purple-900/20' : 'from-blue-950/60 via-blue-900/20'} to-[#0B0D10] flex items-center justify-center`}>
                  <div className={`w-12 h-12 rounded-full ${image.fileType === 'music' ? 'bg-purple-500/20' : 'bg-blue-500/20'} flex items-center justify-center`}>
                    <svg className={`w-6 h-6 ${image.fileType === 'music' ? 'text-purple-400' : 'text-blue-400'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" /></svg>
                  </div>
                </div>
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                  <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold">AI</span>
                  <span className={`${image.fileType === 'music' ? 'bg-purple-500' : 'bg-blue-500'} text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold`}>{image.fileType === 'music' ? 'MUSIC' : 'AUDIO'}</span>
                  {metadata?.personaCreated && (
                    <span className="bg-amber-500 text-white text-[8px] px-1.5 py-0.5 rounded-md font-semibold">PERSONA</span>
                  )}
                </div>
                {/* Title */}
                <div className="absolute bottom-0 left-0 right-0 px-3 py-2">
                  <p className="text-[13px] text-white truncate font-medium">{metadata?.musicTitle || "Untitled"}</p>
                </div>
              </>
            ) : image.fileType === 'video' ? (
              // Video
              <>
                <video
                  src={image.thumbnail}
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                  onLoadedMetadata={(e) => {
                    const video = e.target as HTMLVideoElement;
                    video.currentTime = 1;
                  }}
                />
                <div className="absolute inset-0 bg-linear-to-t from-black/60 via-transparent to-transparent" />
                {/* Badges */}
                <div className="absolute top-2.5 left-2.5 flex items-center gap-1">
                  <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold">AI</span>
                  <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold">VIDEO</span>
                </div>
                {/* Duration */}
                <div className="absolute bottom-2.5 left-2.5 bg-black/60 text-white text-[11px] px-2 py-0.5 rounded-md font-medium backdrop-blur-sm">
                  {image.metadata?.parameters?.duration ? `${image.metadata?.parameters.duration}s` : '4s'}
                </div>
              </>
            ) : (
              // Image
              <>
                <img
                  src={image.thumbnail}
                  alt={image.metadata?.prompt || `Generated ${image.id}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                {/* Badge */}
                <div className="absolute top-2.5 left-2.5">
                  {image.metadata?.model === 'combine-layers' ? (
                    <span className="bg-purple-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold">COMBINE</span>
                  ) : (
                    <span className="bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded-md font-semibold">AI</span>
                  )}
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="w-full h-full bg-(--bg-primary)" />
        )}
        
        {/* Processing State */}
        {image.status === 'processing' && (
          <div className="absolute inset-0 bg-(--bg-primary)/70 backdrop-blur-sm flex flex-col items-center justify-center">
            <Loader2 className="w-5 h-5 text-[#3B82F6] animate-spin mb-2" />
            <div className="text-(--text-primary) text-[12px] font-medium">Processing...</div>

            {fileId && (
              <span className="text-(--text-secondary) text-[10px] font-mono mt-1.5">
                {fileId.slice(0, 8)}...
              </span>
            )}

            {image.metadata?.progress && (
              <div className="w-28 h-1 bg-white/10 rounded-full mt-2 overflow-hidden">
                <div
                  className="h-full bg-[#3B82F6] transition-all duration-300"
                  style={{ width: `${image.metadata?.progress}%` }}
                />
              </div>
            )}

            {image.metadata?.estimatedTime && (
              <div className="text-(--text-secondary) text-[10px] mt-1">
                ~{image.metadata?.estimatedTime}s remaining
              </div>
            )}
            {image.metadata?.stage && (
              <div className="text-(--text-secondary) text-[10px] mt-1">{image.metadata?.stage}</div>
            )}
          </div>
        )}

        {image.status === 'processing' && (
          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-center gap-2 pt-4 pointer-events-none">
            {taskId && (
              <button
                onClick={handlePullResult}
                disabled={isPulling}
                className="p-2 bg-blue-500/80 rounded-lg hover:bg-blue-500 pointer-events-auto disabled:opacity-50"
                title="Pull result from Kie AI"
              >
                <RefreshCw className={`w-4 h-4 text-white ${isPulling ? 'animate-spin' : ''}`} />
              </button>
            )}
            <button
              onClick={handleCopyId}
              className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition pointer-events-auto"
              title="Copy storyboard file ID"
            >
              <Copy className="w-4 h-4 text-white" />
            </button>
            <button
              onClick={() => onDelete(image)}
              className="p-2 bg-red-500/20 rounded-md hover:bg-red-500/40 transition pointer-events-auto"
              title="Delete processing file"
            >
              <Trash2 className="w-4 h-4 text-white" />
            </button>
          </div>
        )}
        
        {/* Error State */}
        {image.status === 'error' && (
          <div className="absolute inset-0 bg-(--bg-primary)/80 backdrop-blur-sm flex flex-col items-center justify-center">
            <AlertCircle className="w-5 h-5 text-red-400 mb-1.5" strokeWidth={1.75} />
            <div className="text-(--text-primary) text-[12px] font-medium">Generation Failed</div>
            {responseCode !== undefined && (
              <span
                className={`px-2 py-0.5 rounded-md text-[11px] font-mono font-medium mt-1.5 cursor-default ${getResponseCodeColor(responseCode)}`}
                title={`${getResponseCodeInfo(responseCode).label}${responseMessage ? `: ${responseMessage}` : ''}`}
              >
                {responseCode} - {getResponseCodeInfo(responseCode).label}
              </span>
            )}
            {image.metadata?.error && !responseCode && (
              <div className="text-red-300/80 text-[11px] mt-1 text-center px-3">{image.metadata?.error}</div>
            )}
            <div className="flex items-center gap-2 mt-2.5">
              <button
                onClick={() => onRetry(image)}
                className="px-3 py-1 bg-red-500 text-white text-[11px] font-medium rounded-md hover:bg-red-600 transition"
              >
                Retry
              </button>
              {(creditsUsed === 0 || creditsUsed === undefined) && (
                <button
                  onClick={() => onDelete(image)}
                  className="p-1.5 bg-white/10 rounded-md hover:bg-white/20 transition"
                  title="Delete failed generation"
                >
                  <Trash2 className="w-3.5 h-3.5 text-(--text-secondary)" strokeWidth={1.75} />
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
          <div className="absolute inset-0 bg-(--bg-primary)/60 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-1.5">
            {(image.fileType === 'audio' || image.fileType === 'music') ? (
              // Music/Audio: play button prominent, then download, copy, delete
              <>
                <button onClick={handleImageClick} className="p-2.5 bg-white rounded-full hover:bg-white/90 shadow-lg transition" title="Play audio">
                  <Play className="w-4 h-4 text-black ml-0.5" />
                </button>
                <button onClick={handleDownload} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Download audio">
                  <Download className="w-4 h-4 text-white" />
                </button>
                {taskId && metadata?.audioId && !metadata?.personaCreated && (
                  <button onClick={(e) => { e.stopPropagation(); setShowPersonaDialog(true); }} className="p-2 bg-purple-500/80 rounded-lg hover:bg-purple-500" title="Create Persona from this song">
                    <Mic className="w-4 h-4 text-white" />
                  </button>
                )}
                {metadata?.personaCreated && metadata?.personaId && (
                  <button onClick={(e) => { e.stopPropagation(); setShowEditPersonaDialog(true); }} className="p-2 bg-purple-500/30 rounded-lg hover:bg-purple-500/50" title={`Edit Persona: ${metadata.personaName || 'Unnamed'}`}>
                    <Pencil className="w-4 h-4 text-purple-400" />
                  </button>
                )}
                {prompt && (
                  <button onClick={() => { navigator.clipboard.writeText(prompt); toast.success('Prompt copied!'); }} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Copy prompt">
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                )}
                <button onClick={() => onDelete(image)} className="p-2 bg-red-500/20 rounded-md hover:bg-red-500/40 transition" title="Delete audio">
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            ) : image.fileType === 'video' ? (
              // Video: Show play, download, copy prompt, and delete buttons
              <>
                <button onClick={handleImageClick} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Play video">
                  <Play className="w-4 h-4 text-white" />
                </button>
                <button onClick={handleDownload} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Download video">
                  <Download className="w-4 h-4 text-white" />
                </button>
                {prompt && (
                  <button onClick={() => { navigator.clipboard.writeText(prompt); toast.success('Prompt copied!'); }} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Copy prompt">
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                )}
                <button onClick={() => onDelete(image)} className="p-2 bg-red-500/20 rounded-md hover:bg-red-500/40 transition" title="Delete video">
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            ) : (
              // Image: Show preview, copy prompt, and delete icons
              <>
                <button onClick={() => onSelect(image)} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Preview">
                  <Eye className="w-4 h-4 text-white" />
                </button>
                {prompt ? (
                  <button onClick={() => { navigator.clipboard.writeText(prompt); toast.success('Prompt copied!'); }} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Copy prompt">
                    <FileText className="w-4 h-4 text-white" />
                  </button>
                ) : (
                  <button onClick={() => navigator.clipboard.writeText(fileId || image.id)} className="p-2 bg-white/10 rounded-md hover:bg-white/20 transition" title="Copy file ID">
                    <Copy className="w-4 h-4 text-white" />
                  </button>
                )}
                <button onClick={() => onDelete(image)} className="p-2 bg-red-500/20 rounded-md hover:bg-red-500/40 transition" title="Delete">
                  <Trash2 className="w-4 h-4 text-white" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      {/* Metadata Footer — Completed */}
      {image.status === 'completed' && (
        <div className="px-3 py-2 space-y-1.5">
          {/* Model + Time */}
          <div className="flex items-center gap-1.5">
            <Cpu className="w-3 h-3 text-(--text-tertiary) shrink-0" strokeWidth={1.75} />
            <span className="text-(--text-secondary) text-[11px] font-medium truncate">
              {image.metadata?.model}
            </span>
            {image.metadata?.timestamp && (
              <span className="text-(--text-tertiary) text-[10px] ml-auto shrink-0">
                {formatRelativeTime(image.metadata.timestamp)}
              </span>
            )}
          </div>

          {/* Duration / Aspect / Credits row */}
          <div className="flex items-center gap-2 flex-wrap">
            {image.fileType === 'video' && image.metadata?.parameters?.duration && (
              <span className="flex items-center gap-1 text-[10px] text-(--text-tertiary)">
                <Clock className="w-2.5 h-2.5" strokeWidth={1.75} />
                {image.metadata.parameters.duration}s
              </span>
            )}
            {image.metadata?.parameters?.aspect_ratio && (
              <span className="flex items-center gap-1 text-[10px] text-(--text-tertiary)">
                <RectangleHorizontal className="w-2.5 h-2.5" strokeWidth={1.75} />
                {image.metadata.parameters.aspect_ratio}
              </span>
            )}
            {creditsUsed !== undefined && creditsUsed > 0 && (
              <span className="flex items-center gap-1 text-[10px] text-(--text-tertiary)">
                <Coins className="w-2.5 h-2.5" strokeWidth={1.75} />
                {creditsUsed}
              </span>
            )}
            {image.metadata?.generationTime > 0 && (
              <span className="text-[10px] text-(--text-tertiary) ml-auto">
                {image.metadata.generationTime}s
              </span>
            )}
          </div>
        </div>
      )}

      {/* Metadata Section — Processing/Error */}
      {image.status !== 'completed' && (
        <div className="px-3 py-2.5">
          {/* Status Badge + Response Code */}
          <div className="flex items-center gap-1.5 mb-2 flex-wrap">
            <span className={`px-2 py-0.5 rounded-md text-[11px] font-medium ${
              image.status === 'processing' ? 'bg-blue-500/15 text-blue-400' :
              'bg-red-500/15 text-red-400'
            }`}>
              {image.status === 'processing' ? 'Processing' : 'Failed'}
            </span>

            {responseCode !== undefined && (
              <span
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono font-medium cursor-default ${getResponseCodeColor(responseCode)}`}
                title={`${getResponseCodeInfo(responseCode).label}${responseMessage ? `: ${responseMessage}` : ''}`}
              >
                {responseCode}
              </span>
            )}

            <span className="text-(--text-secondary) text-[11px] ml-auto">
              {formatRelativeTime(image.metadata?.timestamp)}
            </span>
          </div>

          <div className="flex items-center gap-1.5 mb-2">
            <Cpu className="w-3 h-3 text-(--text-secondary)" strokeWidth={1.75} />
            <span className="text-(--text-secondary) text-[11px]">
              {image.metadata?.model}
            </span>
            {image.metadata?.generationTime > 0 && (
              <span className="text-(--text-secondary) text-[11px]">
                · {image.metadata?.generationTime}s
              </span>
            )}
          </div>

          {image.status === 'processing' && image.metadata?.progress !== undefined && (
            <div className="flex items-center gap-2 text-[11px] text-(--text-secondary) mb-2">
              <Loader2 className="w-3 h-3 animate-spin" />
              <span>{image.metadata?.progress}% complete</span>
              {image.metadata?.estimatedTime && (
                <span>· ~{image.metadata?.estimatedTime}s</span>
              )}
            </div>
          )}

          {/* Error Info */}
          {image.status === 'error' && (
            <div className="flex items-center gap-1.5 text-[11px] text-red-400">
              <AlertCircle className="w-3 h-3" strokeWidth={1.75} />
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
          onCreatePersona={image.fileType === 'music' && taskId && metadata?.audioId && !metadata?.personaCreated ? () => setShowPersonaDialog(true) : undefined}
          onEditPersona={image.fileType === 'music' && metadata?.personaCreated && metadata?.personaId ? () => setShowEditPersonaDialog(true) : undefined}
          onRename={fileId ? () => { setNameValue(image.metadata?.model || metadata?.musicTitle || "Untitled"); setEditingName(true); setShowAudioPlayer(true); } : undefined}
        />
      )}

      {/* Image Preview Popup — rendered via portal to escape panel overflow */}
      {showImagePreview && image.fileType !== 'video' && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4" style={{ zIndex: 99999 }}
          onClick={() => setShowImagePreview(false)}
        >
          <div className="bg-(--bg-secondary) rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-(--border-primary) shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-(--border-primary)">
              <h3 className="text-(--text-primary) text-[14px] font-semibold">{image.metadata?.model === 'combine-layers' ? 'Combined Image' : 'Generated Image'}</h3>
              <button
                onClick={() => setShowImagePreview(false)}
                className="w-7 h-7 rounded-md flex items-center justify-center text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition"
              >
                <X className="w-4 h-4" strokeWidth={1.75} />
              </button>
            </div>

            {/* Image */}
            <div className="p-4 flex justify-center bg-(--bg-primary)">
              <img
                src={image.url}
                alt={image.filename}
                className="max-w-full rounded-lg"
                style={{ maxHeight: '60vh', objectFit: 'contain' }}
              />
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-(--border-primary) flex items-center justify-between">
              <div>
                {image.metadata?.model && (
                  <div className="text-[13px] text-(--text-secondary)">Model: {image.metadata?.model}</div>
                )}
                {image.prompt && (
                  <div className="text-[13px] text-(--text-secondary) mt-1 line-clamp-2">Prompt: {image.prompt}</div>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleDownload}
                  className="px-4 py-2 bg-white/10 hover:bg-white/20 text-(--text-primary) text-[13px] font-medium rounded-xl transition-colors"
                >
                  Download
                </button>
                <button
                  onClick={() => { onSelect(image); setShowImagePreview(false); }}
                  className="px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-colors"
                >
                  Use as Background
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* Video Preview — shared dialog component */}
      {showVideoDialog && image.fileType === 'video' && (
        <VideoPreviewDialog
          url={image.url}
          onClose={() => setShowVideoDialog(false)}
          model={image.metadata?.model}
          prompt={prompt || image.metadata?.prompt}
          onSnapshotToSelf={onSnapshotToSelf}
          onSnapshotToNext={onSnapshotToNext}
        />
      )}

      {/* Audio Player Dialog — shared component */}
      {showAudioPlayer && (image.fileType === 'audio' || image.fileType === 'music') && (
        <AudioPreviewDialog
          url={image.url}
          name={metadata?.musicTitle || image.metadata?.model || "Audio"}
          prompt={prompt}
          model={image.metadata?.model}
          fileId={fileId}
          onClose={() => setShowAudioPlayer(false)}
        />
      )}

      {/* Create Persona Dialog */}
      {showPersonaDialog && taskId && metadata?.audioId && image.url && (
        <CreatePersonaDialog
          audioUrl={image.url}
          taskId={taskId}
          audioId={metadata.audioId}
          fileId={fileId || image.id}
          companyId={companyId || ""}
          userId={userId || ""}
          fileMetadata={metadata}
          onClose={() => setShowPersonaDialog(false)}
        />
      )}

      {/* Edit Persona Dialog */}
      {showEditPersonaDialog && metadata?.personaId && (
        <EditPersonaDialog
          personaId={metadata.personaId}
          fileId={fileId || image.id}
          fileMetadata={metadata}
          companyId={companyId || ""}
          audioUrl={image.url}
          onClose={() => setShowEditPersonaDialog(false)}
        />
      )}
    </div>
  );
}
