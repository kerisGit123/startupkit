"use client";

import React, { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { X, Camera, SkipForward } from "lucide-react";

interface VideoPreviewDialogProps {
  url: string;
  onClose: () => void;
  /** Model name shown in footer */
  model?: string;
  /** Prompt shown in footer */
  prompt?: string;
  /** Capture video frame → save as current shot's imageUrl */
  onSnapshotToSelf?: (videoUrl: string, currentTime: number) => Promise<void>;
  /** Capture video frame → save as next shot's imageUrl */
  onSnapshotToNext?: (videoUrl: string, currentTime: number) => Promise<void>;
}

export function VideoPreviewDialog({
  url,
  onClose,
  model,
  prompt,
  onSnapshotToSelf,
  onSnapshotToNext,
}: VideoPreviewDialogProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [snapping, setSnapping] = useState(false);

  const handleSnapshot = async (handler: (videoUrl: string, currentTime: number) => Promise<void>) => {
    const t = videoRef.current?.currentTime ?? 0;
    setSnapping(true);
    try {
      await handler(url, t);
    } finally {
      setSnapping(false);
    }
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0 bg-black/80 flex items-center justify-center p-4"
      style={{ zIndex: 99999 }}
      onClick={onClose}
    >
      <div
        className="bg-(--bg-secondary) rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-(--border-primary)">
          <h3 className="text-white font-medium">Video Preview</h3>
          <div className="flex items-center gap-2">
            {/* Snapshot buttons */}
            {onSnapshotToSelf && (
              <button
                onClick={() => handleSnapshot(onSnapshotToSelf)}
                disabled={snapping}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium
                           bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/10
                           transition disabled:opacity-40"
                title="Snapshot → save to this frame"
              >
                <Camera className="w-3.5 h-3.5" strokeWidth={1.75} />
                This frame
              </button>
            )}
            {onSnapshotToNext && (
              <button
                onClick={() => handleSnapshot(onSnapshotToNext)}
                disabled={snapping}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[12px] font-medium
                           bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/10
                           transition disabled:opacity-40"
                title="Snapshot → send to next frame"
              >
                <SkipForward className="w-3.5 h-3.5" strokeWidth={1.75} />
                Next frame
              </button>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Video Player */}
        <div className="p-4">
          <video
            ref={videoRef}
            src={url}
            controls
            autoPlay
            className="w-full rounded-lg"
            style={{ maxHeight: "70vh" }}
          />
        </div>

        {/* Footer */}
        {(model || prompt) && (
          <div className="p-4 border-t border-(--border-primary)">
            {model && (
              <div className="text-sm text-gray-400">
                Model: {model}
              </div>
            )}
            {prompt && (
              <div className="text-sm text-gray-400 mt-1 line-clamp-2">
                Prompt: {prompt}
              </div>
            )}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
