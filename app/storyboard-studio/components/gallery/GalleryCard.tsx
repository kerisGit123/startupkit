"use client";

import React from "react";
import { Film, Image, Music } from "lucide-react";

const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

interface GalleryCardProps {
  file: {
    _id: string;
    r2Key?: string;
    sourceUrl?: string;
    fileType: string;
    model?: string;
    prompt?: string;
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
  const isAudio = file.fileType === "audio";
  const modelShort = file.model?.split("/").pop() || "";

  return (
    <button
      onClick={onClick}
      className="group relative w-full rounded-xl overflow-hidden text-left transition-all hover:shadow-lg hover:shadow-black/30 hover:scale-[1.01] focus:outline-none bg-[#111]"
    >
      {isAudio ? (
        <div className="w-full aspect-square bg-linear-to-br from-purple-900/40 to-[#141418] flex flex-col items-center justify-center gap-2 rounded-xl">
          <div className="w-14 h-14 rounded-full bg-purple-500/20 flex items-center justify-center">
            <Music className="w-7 h-7 text-purple-400" />
          </div>
          {file.prompt && (
            <p className="text-[10px] text-gray-500 text-center px-4 line-clamp-2 max-w-[180px]">{file.prompt}</p>
          )}
        </div>
      ) : isVideo ? (
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
          isAudio ? "bg-purple-600/80 text-white" : isVideo ? "bg-red-600/80 text-white" : "bg-black/50 text-white/80"
        }`}>
          {isAudio ? <Music className="w-3 h-3" /> : isVideo ? <Film className="w-3 h-3" /> : <Image className="w-3 h-3" />}
          {modelShort}
        </span>
      </div>

      {/* Bottom overlay — visible on hover */}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity rounded-b-xl">
        <div className="flex items-end justify-between p-3 pt-8">
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
        </div>
      </div>
    </button>
  );
}
