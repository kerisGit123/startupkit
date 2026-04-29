"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { X, Check, RotateCcw, Crop } from "lucide-react";

interface ThumbnailCropperProps {
  imageUrl: string;
  onSave: (croppedBlob: Blob) => void;
  onClose: () => void;
  /** Aspect ratio for the crop region (default 1 = square) */
  aspectRatio?: number;
}

interface CropRegion {
  x: number;
  y: number;
  size: number; // Square crop — size = width = height (before aspect ratio)
}

/**
 * Lightweight thumbnail cropper.
 * Renders an image with a draggable square crop region.
 * Outputs a cropped Blob for upload as element thumbnail.
 */
export function ThumbnailCropper({ imageUrl, onSave, onClose, aspectRatio = 1 }: ThumbnailCropperProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgNatural, setImgNatural] = useState({ w: 1, h: 1 });
  const [displaySize, setDisplaySize] = useState({ w: 1, h: 1 });

  // Crop region in display coordinates
  const [crop, setCrop] = useState<CropRegion>({ x: 0, y: 0, size: 100 });
  const [dragging, setDragging] = useState<"move" | "resize" | null>(null);
  const dragStart = useRef({ mx: 0, my: 0, cx: 0, cy: 0, cs: 0 });

  // Initialize crop to center when image loads
  const handleImageLoad = useCallback(() => {
    const img = imgRef.current;
    if (!img) return;

    setImgNatural({ w: img.naturalWidth, h: img.naturalHeight });

    const container = containerRef.current;
    if (!container) return;

    const maxW = container.clientWidth - 32;
    const maxH = container.clientHeight - 32;
    const scale = Math.min(maxW / img.naturalWidth, maxH / img.naturalHeight, 1);
    const dw = img.naturalWidth * scale;
    const dh = img.naturalHeight * scale;
    setDisplaySize({ w: dw, h: dh });

    // Default crop: center, 40% of shorter dimension
    const initSize = Math.min(dw, dh) * 0.4;
    setCrop({
      x: (dw - initSize) / 2,
      y: (dh - initSize) / 2,
      size: initSize,
    });
    setImgLoaded(true);
  }, []);

  // Mouse handlers for drag
  const handleMouseDown = useCallback((e: React.MouseEvent, type: "move" | "resize") => {
    e.preventDefault();
    e.stopPropagation();
    setDragging(type);
    dragStart.current = { mx: e.clientX, my: e.clientY, cx: crop.x, cy: crop.y, cs: crop.size };
  }, [crop]);

  useEffect(() => {
    if (!dragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      const dx = e.clientX - dragStart.current.mx;
      const dy = e.clientY - dragStart.current.my;
      const { cx, cy, cs } = dragStart.current;

      if (dragging === "move") {
        const newX = Math.max(0, Math.min(displaySize.w - cs, cx + dx));
        const newY = Math.max(0, Math.min(displaySize.h - cs, cy + dy));
        setCrop(prev => ({ ...prev, x: newX, y: newY }));
      } else if (dragging === "resize") {
        const delta = Math.max(dx, dy);
        const minSize = 40;
        const maxSize = Math.min(displaySize.w - cx, displaySize.h - cy);
        const newSize = Math.max(minSize, Math.min(maxSize, cs + delta));
        setCrop(prev => ({ ...prev, size: newSize }));
      }
    };

    const handleMouseUp = () => setDragging(null);

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [dragging, displaySize]);

  // Reset crop to center
  const handleReset = useCallback(() => {
    const initSize = Math.min(displaySize.w, displaySize.h) * 0.4;
    setCrop({
      x: (displaySize.w - initSize) / 2,
      y: (displaySize.h - initSize) / 2,
      size: initSize,
    });
  }, [displaySize]);

  // Save: fetch image as blob (avoids CORS taint), draw cropped region to canvas
  const handleSave = useCallback(async () => {
    try {
      const scale = imgNatural.w / displaySize.w;
      const sx = crop.x * scale;
      const sy = crop.y * scale;
      const sw = crop.size * scale;
      const sh = crop.size * scale;

      // Load image via proxy to avoid CORS issues with external CDN URLs
      const img = new Image();
      const proxyUrl = `/api/proxy/image?url=${encodeURIComponent(imageUrl)}`;
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = proxyUrl;
      });
      const bitmap = await createImageBitmap(img, Math.round(sx), Math.round(sy), Math.round(sw), Math.round(sh));

      const canvas = document.createElement("canvas");
      const outputSize = 256;
      canvas.width = outputSize;
      canvas.height = outputSize;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.drawImage(bitmap, 0, 0, outputSize, outputSize);
      bitmap.close();

      canvas.toBlob((b) => { if (b) onSave(b); }, "image/jpeg", 0.9);
    } catch (err) {
      console.error("[ThumbnailCropper] Save failed:", err);
    }
  }, [crop, imgNatural, displaySize, imageUrl, onSave]);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-[600px] max-w-[90vw] max-h-[85vh] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Crop className="w-4 h-4 text-(--accent-blue)" strokeWidth={1.75} />
            <span className="text-[14px] font-semibold text-(--text-primary)">Crop Thumbnail</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleReset}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-[12px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" strokeWidth={1.75} />
              Reset
            </button>
            <button onClick={onClose} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
              <X className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Crop Area */}
        <div ref={containerRef} className="flex-1 flex items-center justify-center p-4 min-h-[300px] bg-(--bg-primary)">
          <div className="relative" style={{ width: displaySize.w, height: displaySize.h }}>
            {/* Base image (dimmed) */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Crop source"
              onLoad={handleImageLoad}
              onError={() => console.error("[ThumbnailCropper] Failed to load image:", imageUrl)}
              className="block select-none"
              style={{ width: displaySize.w, height: displaySize.h, opacity: 0.35 }}
              draggable={false}
            />

            {imgLoaded && (
              <>
                {/* Dim overlay outside crop */}
                {/* Bright crop region */}
                <div
                  className="absolute overflow-hidden cursor-move"
                  style={{
                    left: crop.x,
                    top: crop.y,
                    width: crop.size,
                    height: crop.size,
                    outline: "2px solid rgba(74, 144, 226, 0.8)",
                    outlineOffset: -2,
                    borderRadius: 8,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "move")}
                >
                  <img
                    src={imageUrl}
                    alt=""
                    className="block select-none pointer-events-none"
                    style={{
                      width: displaySize.w,
                      height: displaySize.h,
                      transform: `translate(${-crop.x}px, ${-crop.y}px)`,
                    }}
                    draggable={false}
                  />
                </div>

                {/* Resize handle (bottom-right) */}
                <div
                  className="absolute w-4 h-4 bg-(--accent-blue) rounded-full cursor-nwse-resize border-2 border-white shadow-md"
                  style={{
                    left: crop.x + crop.size - 8,
                    top: crop.y + crop.size - 8,
                  }}
                  onMouseDown={(e) => handleMouseDown(e, "resize")}
                />
              </>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
          <span className="text-[11px] text-(--text-tertiary)">
            Drag to move, corner handle to resize
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white transition-colors"
            >
              <Check className="w-3.5 h-3.5" strokeWidth={2} />
              Save Thumbnail
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
