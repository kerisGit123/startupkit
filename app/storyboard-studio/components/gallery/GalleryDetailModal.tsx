"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { X, Copy, Download, Cpu, Coins, Calendar, ChevronDown, MoreHorizontal, Music } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { toast } from "sonner";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

// Extract dominant colors from an image
function extractPalette(img: HTMLImageElement, count = 6): string[] {
  try {
    const canvas = document.createElement("canvas");
    const size = 50;
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return [];
    ctx.drawImage(img, 0, 0, size, size);
    const data = ctx.getImageData(0, 0, size, size).data;
    const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
    for (let i = 0; i < data.length; i += 16) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const brightness = (r + g + b) / 3;
      if (brightness < 20 || brightness > 240) continue;
      const qr = Math.round(r / 32) * 32;
      const qg = Math.round(g / 32) * 32;
      const qb = Math.round(b / 32) * 32;
      const key = `${qr}-${qg}-${qb}`;
      if (!buckets[key]) buckets[key] = { r: qr, g: qg, b: qb, count: 0 };
      buckets[key].count++;
    }
    return Object.values(buckets)
      .sort((a, b) => b.count - a.count)
      .slice(0, count)
      .map(c => `rgb(${c.r},${c.g},${c.b})`);
  } catch {
    return [];
  }
}

interface GalleryDetailModalProps {
  fileId: string;
  onClose: () => void;
}

export function GalleryDetailModal({ fileId, onClose }: GalleryDetailModalProps) {
  const file = useQuery(api.storyboard.gallery.getFileWithUser, {
    fileId: fileId as Id<"storyboard_files">,
  });

  const [showMore, setShowMore] = useState(false);
  const [palette, setPalette] = useState<string[]>([]);
  const imgRef = useRef<HTMLImageElement>(null);

  const imageUrl = file?.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file?.sourceUrl || "";
  const isVideo = file?.fileType === "video";
  const isMusic = file?.fileType === "music";
  const isAudio = file?.fileType === "audio";
  const isAudioLike = isMusic || isAudio;

  useEffect(() => {
    if (!imageUrl || isVideo || isAudioLike) return;
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setPalette(extractPalette(img));
    img.src = imageUrl;
  }, [imageUrl, isVideo]);

  if (!file) return null;

  const sharedDate = file.sharedAt ? new Date(file.sharedAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "";
  const modelShort = file.model?.split("/").pop() || file.model || "AI";
  const promptPreview = file.prompt ? (file.prompt.length > 150 ? file.prompt.slice(0, 150) + "..." : file.prompt) : "";

  const handleCopyPrompt = () => {
    if (file.prompt) {
      navigator.clipboard.writeText(file.prompt);
      toast.success("Prompt copied!");
    }
  };

  const handleDownload = async () => {
    try {
      if (file.r2Key) {
        const res = await fetch("/api/storyboard/download-file", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            r2Key: file.r2Key,
            filename: file.filename || `gallery-${file._id}.${isAudioLike ? "mp3" : isVideo ? "mp4" : "png"}`,
          }),
        });
        const data = await res.json();
        if (data.downloadUrl) {
          window.open(data.downloadUrl, "_blank");
        } else {
          throw new Error(data.error);
        }
      } else {
        window.open(imageUrl, "_blank");
      }
    } catch {
      toast.error("Download failed");
    }
  };

  const tags: string[] = [];
  if (file.model) tags.push(file.model);
  if (file.fileType) tags.push(file.fileType === "video" ? "Video" : file.fileType === "audio" ? "Audio" : "Image");
  if (file.category) tags.push(file.category);

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

      <div
        className="relative bg-[#1A1A1A] rounded-xl max-w-[1200px] w-full mx-3 max-h-[92vh] overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.25)] border border-[#3D3D3D] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 shrink-0">
          <div className="flex items-center gap-3">
            {file.userAvatar ? (
              <img src={file.userAvatar} alt={file.userName} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-[#4A90E2]/15 flex items-center justify-center text-sm text-[#4A90E2] font-bold">
                {file.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[14px] text-white font-semibold">{file.userName}</span>
          </div>
          <div className="flex items-center gap-2">
            <button className="p-2 rounded-lg hover:bg-white/5 text-[#6E6E6E] hover:text-white transition">
              <MoreHorizontal className="w-5 h-5" />
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-1.5 rounded-full bg-white text-black text-sm font-semibold hover:bg-gray-100 transition"
            >
              Download
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/5 text-[#6E6E6E] hover:text-white transition">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">

          {/* Left: Media */}
          <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#1A1A1A]">
            {isAudioLike ? (
              <div className="flex flex-col items-center justify-center gap-6 p-8 w-full">
                <div className={`w-24 h-24 rounded-full ${isMusic ? 'bg-purple-500/20' : 'bg-blue-500/20'} flex items-center justify-center`}>
                  <Music className={`w-12 h-12 ${isMusic ? 'text-purple-400' : 'text-blue-400'}`} />
                </div>
                <audio src={imageUrl} controls autoPlay className="w-full max-w-md" />
              </div>
            ) : isVideo ? (
              <video src={imageUrl} controls autoPlay className="w-full h-full max-h-[calc(92vh-52px)] object-contain" />
            ) : (
              <img
                ref={imgRef}
                src={imageUrl}
                alt="AI Generated"
                className="w-full h-full max-h-[calc(92vh-52px)] object-contain"
              />
            )}
          </div>

          {/* Right: Sidebar */}
          <div className="lg:w-[380px] border-t lg:border-t-0 lg:border-l border-[#3D3D3D] overflow-y-auto bg-[#1A1A1A]">
            <div className="p-5 space-y-5">

              {/* Title */}
              <div>
                <h2 className="text-xl text-white font-bold leading-tight mb-1.5">
                  {isMusic ? "Music" : isAudio ? "Audio" : isVideo ? "Video" : "Image"} · {modelShort}
                </h2>
                {promptPreview && (
                  <p className="text-[13px] text-[#A0A0A0] leading-relaxed">{promptPreview}</p>
                )}
              </div>

              {/* Palette */}
              {palette.length > 0 && (
                <div>
                  <h4 className="text-sm text-white font-bold mb-2.5">Palette</h4>
                  <div className="flex items-center gap-2">
                    {palette.map((color, i) => (
                      <button
                        key={i}
                        className="w-9 h-9 rounded-full border-2 border-[#3D3D3D] hover:border-[#4A4A4A] transition hover:scale-110"
                        style={{ backgroundColor: color }}
                        title={color}
                        onClick={() => { navigator.clipboard.writeText(color); toast.success(`Color copied: ${color}`); }}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Tags */}
              <div>
                <h4 className="text-sm text-white font-bold mb-2.5">Tags</h4>
                <div className="flex flex-wrap gap-1.5">
                  {tags.map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full border border-[#3D3D3D] text-[12px] text-[#A0A0A0] font-medium">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Creation Actions */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <h4 className="text-sm text-white font-bold">Creation Actions</h4>
                  {file.prompt && (
                    <button
                      onClick={() => setShowMore(!showMore)}
                      className="text-xs text-[#A0A0A0] border border-[#3D3D3D] px-3 py-1 rounded-full hover:text-white hover:border-[#4A4A4A] transition"
                    >
                      {showMore ? "- Less" : "+ More"}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[#6E6E6E]">Use</span>
                  <button
                    onClick={handleDownload}
                    className="px-4 py-1.5 rounded-full bg-[#2C2C2C] text-white text-xs font-medium hover:bg-[#3D3D3D] transition border border-[#3D3D3D]"
                  >
                    {isMusic ? "Music" : isAudio ? "Audio" : isVideo ? "Video" : "Image"}
                  </button>
                  {file.prompt && (
                    <button
                      onClick={handleCopyPrompt}
                      className="px-4 py-1.5 rounded-full bg-[#2C2C2C] text-white text-xs font-medium hover:bg-[#3D3D3D] transition border border-[#3D3D3D]"
                    >
                      Prompt
                    </button>
                  )}
                </div>
              </div>

              {/* Expanded: Full Prompt */}
              {showMore && file.prompt && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-sm text-white font-bold">Prompt</h4>
                    <button onClick={handleCopyPrompt} className="flex items-center gap-1 text-xs text-[#6E6E6E] hover:text-[#4A90E2] transition">
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                  </div>
                  <div className="bg-[#2C2C2C] border border-[#3D3D3D] rounded-xl p-4 max-h-[250px] overflow-y-auto">
                    <p className="text-xs text-[#A0A0A0] leading-relaxed whitespace-pre-wrap">{file.prompt}</p>
                  </div>
                </div>
              )}

              {/* Details footer */}
              <div className="pt-2 space-y-1.5 text-[11px] text-[#6E6E6E]">
                {file.model && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Cpu className="w-3 h-3" /> Model</span>
                    <span className="text-[#A0A0A0]">{file.model}</span>
                  </div>
                )}
                {(file.creditsUsed ?? 0) > 0 && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Coins className="w-3 h-3" /> Credits</span>
                    <span className="text-[#A0A0A0]">{file.creditsUsed}</span>
                  </div>
                )}
                {sharedDate && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Shared</span>
                    <span className="text-[#A0A0A0]">{sharedDate}</span>
                  </div>
                )}
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
