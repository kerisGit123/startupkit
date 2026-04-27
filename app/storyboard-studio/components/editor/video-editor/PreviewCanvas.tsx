"use client";

import React, { useRef, useCallback, useEffect, useState } from "react";
import { Film, Music, Loader2 } from "lucide-react";
import type { TimelineClip, SubtitleClip, OverlayLayer } from "./types";

interface PreviewCanvasProps {
  cur: { clip: TimelineClip; offset: number; idx: number } | null;
  previewRef: React.RefObject<HTMLVideoElement | null>;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  subtitleClips: SubtitleClip[];
  overlayLayers: OverlayLayer[];
  exporting: boolean;
  exportProgress: number;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  setOverlayLayers: React.Dispatch<React.SetStateAction<OverlayLayer[]>>;
  bgColor: string;
}

type DragState = { id: string; startX: number; startY: number; origX: number; origY: number } | null;
type ResizeState = { id: string; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number } | null;

export function PreviewCanvas({
  cur, previewRef, audioRef, currentTime, subtitleClips, overlayLayers,
  exporting, exportProgress, selectedOverlayId, setSelectedOverlayId, setOverlayLayers, bgColor,
}: PreviewCanvasProps) {
  const activeSub = subtitleClips.find(s => currentTime >= s.startTime && currentTime < s.endTime);
  const activeOverlays = overlayLayers.filter(l => currentTime >= l.startTime && currentTime < l.endTime);
  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState>(null);
  const [resizing, setResizing] = useState<ResizeState>(null);

  const toCanvas = useCallback((dx: number, dy: number) => {
    const el = areaRef.current;
    if (!el) return { dx: 0, dy: 0 };
    return { dx: (dx / el.clientWidth) * 1920, dy: (dy / el.clientHeight) * 1080 };
  }, []);

  // Drag handler
  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const d = toCanvas(e.clientX - dragging.startX, e.clientY - dragging.startY);
      setOverlayLayers(p => p.map(l => l.id !== dragging.id ? l : {
        ...l,
        x: Math.max(0, Math.min(1920 - l.w, Math.round(dragging.origX + d.dx))),
        y: Math.max(0, Math.min(1080 - l.h, Math.round(dragging.origY + d.dy))),
      }));
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, toCanvas, setOverlayLayers]);

  // Resize handler
  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const d = toCanvas(e.clientX - resizing.startX, e.clientY - resizing.startY);
      setOverlayLayers(p => p.map(l => {
        if (l.id !== resizing.id) return l;
        let { origX: x, origY: y, origW: w, origH: h } = resizing;
        const hdl = resizing.handle;
        if (hdl.includes("e")) w = Math.max(40, w + d.dx);
        if (hdl.includes("s")) h = Math.max(20, h + d.dy);
        if (hdl.includes("w")) { x = x + d.dx; w = Math.max(40, w - d.dx); }
        if (hdl.includes("n")) { y = y + d.dy; h = Math.max(20, h - d.dy); }
        return { ...l, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
      }));
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing, toCanvas, setOverlayLayers]);

  const startDrag = (e: React.MouseEvent, layer: OverlayLayer) => {
    e.stopPropagation();
    setSelectedOverlayId(layer.id);
    setDragging({ id: layer.id, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y });
  };

  const startResize = (e: React.MouseEvent, layer: OverlayLayer, handle: string) => {
    e.stopPropagation();
    setResizing({ id: layer.id, handle, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y, origW: layer.w, origH: layer.h });
  };

  const handles = ["nw", "ne", "sw", "se"] as const;
  const handlePos: Record<string, string> = {
    nw: "top-0 left-0 cursor-nw-resize",
    ne: "top-0 right-0 cursor-ne-resize",
    sw: "bottom-0 left-0 cursor-sw-resize",
    se: "bottom-0 right-0 cursor-se-resize",
  };

  const renderOverlayContent = (layer: OverlayLayer) => {
    if (layer.type === "text") {
      return (
        <span style={{
          fontSize: `clamp(10px, ${(layer.fontSize || 48) / 19.2}cqw, 200px)`,
          color: layer.fontColor || "#FFFFFF",
          fontWeight: (layer.fontWeight as any) || "bold",
          fontFamily: layer.fontFamily || "Arial",
          fontStyle: layer.fontStyle || "normal",
          whiteSpace: "nowrap",
        }}>
          {layer.text}
        </span>
      );
    }
    if ((layer.type === "video" || layer.type === "image") && layer.src) {
      return layer.type === "video" ? (
        <video src={layer.src} className="w-full h-full object-cover"
          style={{ borderRadius: layer.borderRadius || 0 }}
          muted autoPlay loop playsInline />
      ) : (
        <img src={layer.src} className="w-full h-full object-cover" alt=""
          style={{ borderRadius: layer.borderRadius || 0 }} />
      );
    }
    if (layer.type === "shape") {
      if (layer.shapeType === "circle") {
        return (
          <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            <ellipse cx="50" cy="50" rx="48" ry="48"
              stroke={layer.strokeColor || "#FF00FF"} strokeWidth={layer.strokeWidth || 2}
              fill={layer.fillColor || "transparent"} />
          </svg>
        );
      }
      if (layer.shapeType === "arrow" || layer.shapeType === "line") {
        return (
          <svg className="w-full h-full" style={{ overflow: "visible" }}>
            <defs>
              {layer.shapeType === "arrow" && (
                <marker id={`ah-${layer.id}`} markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                  <polygon points="0 0, 10 3.5, 0 7" fill={layer.strokeColor || "#FF00FF"} />
                </marker>
              )}
            </defs>
            <line x1="0" y1="50%" x2="100%" y2="50%"
              stroke={layer.strokeColor || "#FF00FF"} strokeWidth={layer.strokeWidth || 2}
              markerEnd={layer.shapeType === "arrow" ? `url(#ah-${layer.id})` : undefined} />
          </svg>
        );
      }
    }
    return null;
  };

  return (
    <>
      <audio ref={audioRef} style={{ display: "none" }} preload="auto" />

      {/* Overlay interaction area */}
      <div ref={areaRef} className="absolute inset-0 z-10" style={{ containerType: "inline-size" }}
        onClick={() => setSelectedOverlayId(null)}>

        {/* Base video/image/empty state */}
        <div className="absolute inset-0 flex items-center justify-center" style={{ backgroundColor: bgColor }}>
          {cur?.clip.type === "video" ? (
            <video
              ref={previewRef}
              className="max-w-full max-h-full object-contain"
              playsInline
              style={{
                mixBlendMode: (cur.clip.blendMode || "normal") as any,
                opacity: (cur.clip.opacity ?? 100) / 100,
              }}
            />
          ) : cur?.clip.type === "audio" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-[#1a1a24] flex items-center justify-center border border-[#2a2a35]">
                <Music className="w-10 h-10 text-teal-500/60" />
              </div>
              <span className="text-sm text-[#6E6E6E]">{cur.clip.name}</span>
            </div>
          ) : cur?.clip.type === "image" ? (
            <img
              src={cur.clip.src}
              className="max-w-full max-h-full object-contain"
              alt=""
              style={{
                mixBlendMode: (cur.clip.blendMode || "normal") as any,
                opacity: (cur.clip.opacity ?? 100) / 100,
              }}
            />
          ) : (
            <div className="flex flex-col items-center gap-4 text-[#2a2a35]">
              <Film className="w-20 h-20" />
              <p className="text-sm text-[#4A4A4A]">Click <span className="text-teal-500 font-medium">+ Add Media</span> to start building your video</p>
            </div>
          )}
        </div>

        {/* Overlay layers — draggable & resizable */}
        {activeOverlays.map(layer => {
          const isSel = layer.id === selectedOverlayId;
          const baseStyle: React.CSSProperties = {
            position: "absolute",
            left: `${(layer.x / 1920) * 100}%`,
            top: `${(layer.y / 1080) * 100}%`,
            width: `${(layer.w / 1920) * 100}%`,
            height: `${(layer.h / 1080) * 100}%`,
            cursor: dragging?.id === layer.id ? "grabbing" : "grab",
          };

          if (layer.type === "text") {
            Object.assign(baseStyle, {
              display: "flex", alignItems: "center", justifyContent: "center",
              backgroundColor: layer.backgroundColor || "transparent",
              borderRadius: layer.borderRadius || 0,
              borderWidth: layer.borderWidth || 0,
              borderColor: layer.borderColor || "transparent",
              borderStyle: layer.borderWidth ? "solid" : "none",
            });
          } else if (layer.type === "shape" && (layer.shapeType === "arrow" || layer.shapeType === "line")) {
            // Arrow/line — no border, just the SVG content
          } else if (layer.type === "shape" && layer.shapeType === "circle") {
            // Circle — no CSS border, SVG handles it
          } else if (layer.type === "shape" && layer.shapeType === "rectangle") {
            Object.assign(baseStyle, {
              borderWidth: layer.strokeWidth || 4,
              borderColor: layer.strokeColor || "#FF00FF",
              borderStyle: "solid",
              borderRadius: layer.borderRadius || 0,
              backgroundColor: layer.fillColor || "transparent",
            });
          } else if (layer.type === "video") {
            Object.assign(baseStyle, {
              borderWidth: layer.borderWidth || 0,
              borderColor: layer.borderColor || "transparent",
              borderStyle: layer.borderWidth ? "solid" : "none",
              borderRadius: layer.borderRadius || 0,
              overflow: "hidden",
            });
          }

          return (
            <div key={layer.id}
              style={baseStyle}
              onMouseDown={(e) => startDrag(e, layer)}
              onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(layer.id); }}
            >
              {renderOverlayContent(layer)}

              {/* Selection ring + resize handles */}
              {isSel && (
                <>
                  <div className="absolute inset-0 ring-2 ring-pink-400 rounded pointer-events-none" />
                  {handles.map(h => (
                    <div key={h}
                      className={`absolute w-3 h-3 bg-pink-400 border-2 border-white rounded-sm ${handlePos[h]} -translate-x-1/2 -translate-y-1/2`}
                      style={{ transform: h === "nw" ? "translate(-50%, -50%)" : h === "ne" ? "translate(50%, -50%)" : h === "sw" ? "translate(-50%, 50%)" : "translate(50%, 50%)" }}
                      onMouseDown={(e) => startResize(e, layer, h)}
                    />
                  ))}
                </>
              )}
            </div>
          );
        })}

        {/* Subtitle overlay */}
        {activeSub && (
          <div className={`absolute left-0 right-0 pointer-events-none flex justify-center px-4 z-20 ${
            activeSub.position === "top" ? "top-4" :
            activeSub.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-4"
          }`}>
            <span
              style={{
                fontSize: activeSub.fontSize,
                color: activeSub.fontColor,
                backgroundColor: activeSub.backgroundColor,
                fontWeight: activeSub.fontWeight,
              }}
              className="px-3 py-1 rounded-md max-w-[80%] text-center"
            >
              {activeSub.text}
            </span>
          </div>
        )}
      </div>

      {/* Export overlay */}
      {exporting && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 z-30">
          <Loader2 className="w-10 h-10 text-teal-400 animate-spin" />
          <p className="text-white font-medium">Exporting... {exportProgress}%</p>
          <div className="w-56 h-2 bg-[#2a2a35] rounded-full overflow-hidden">
            <div className="h-full bg-teal-500 transition-all" style={{ width: `${exportProgress}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
