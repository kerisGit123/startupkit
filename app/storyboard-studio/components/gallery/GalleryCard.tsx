"use client";

import React from "react";
import { ThumbsUp, ThumbsDown, Film, Image } from "lucide-react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

interface GalleryCardProps {
  file: {
    _id: string;
    r2Key?: string;
    sourceUrl?: string;
    fileType: string;
    model?: string;
    prompt?: string;
    thumbsUp?: number;
    thumbsDown?: number;
    totalDonations?: number;
    sharedAt?: number;
    aspectRatio?: string;
    userName: string;
    userAvatar: string | null;
  };
  onClick: () => void;
}

export function GalleryCard({ file, onClick }: GalleryCardProps) {
  const imageUrl = file.r2Key ? `${R2_PUBLIC_URL}/${file.r2Key}` : file.sourceUrl || "";
  const isVideo = file.fileType === "video";
  const modelShort = file.model?.split("/").pop() || "";

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl overflow-hidden text-left transition-all hover:shadow-lg hover:shadow-black/30 hover:scale-[1.01] focus:outline-none bg-[#111]"
    >
      {/* Image at natural aspect ratio — masonry handles the height */}
      {isVideo ? (
        <video
          src={imageUrl}
          className="w-full block rounded-xl"
          muted
          preload="metadata"
          onLoadedMetadata={(e) => {
            const video = e.target as HTMLVideoElement;
            video.currentTime = 1;
          }}
        />
      ) : (
        <img
          src={imageUrl}
          alt="AI Generated"
          className="w-full block rounded-xl"
          loading="lazy"
        />
      )}

      {/* Top-left: model badge */}
      <div className="absolute top-2 left-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium backdrop-blur-sm ${
          isVideo ? "bg-red-600/80 text-white" : "bg-black/50 text-white/80"
        }`}>
          {isVideo ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
          {modelShort}
        </span>
      </div>

      {/* Bottom overlay — visible on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
        <div className="flex items-end justify-between p-3 pt-8">
          {/* User info */}
          <div className="flex items-center gap-2 min-w-0">
            {file.userAvatar ? (
              <img src={file.userAvatar} alt={file.userName} className="w-6 h-6 rounded-full object-cover ring-1 ring-white/20" />
            ) : (
              <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center text-[10px] text-white font-medium">
                {file.userName.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="text-[11px] text-white/90 font-medium truncate">{file.userName}</span>
          </div>

          {/* Thumbs */}
          <div className="flex items-center gap-2 text-[11px] text-white/70">
            <span className="flex items-center gap-0.5">
              <ThumbsUp className="w-3 h-3" />
              {file.thumbsUp ?? 0}
            </span>
            <span className="flex items-center gap-0.5">
              <ThumbsDown className="w-3 h-3" />
              {file.thumbsDown ?? 0}
            </span>
          </div>
        </div>
      </div>
    </button>
  );
}
