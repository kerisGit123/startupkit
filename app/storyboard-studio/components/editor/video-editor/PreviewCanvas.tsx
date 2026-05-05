"use client";

import React, { useRef, useEffect, useState } from "react";
import { Film, Music, Loader2 } from "lucide-react";
import type { TimelineClip, SubtitleClip, OverlayLayer } from "./types";
import { R2_PUBLIC_URL, getClipAtTime, getVisDur, getTransitionClips, getTransitionLayers } from "./types";

interface PreviewCanvasProps {
  cur: { clip: TimelineClip; offset: number; idx: number } | null;
  videoClips: TimelineClip[];
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
  playing: boolean;
  canvasSize: { w: number; h: number };
  onBeforeChange?: () => void;
}

type DragState = { id: string; startX: number; startY: number; origX: number; origY: number } | null;
type ResizeState = { id: string; handle: string; startX: number; startY: number; origX: number; origY: number; origW: number; origH: number; origEndX?: number; origEndY?: number } | null;

export function PreviewCanvas({
  cur, videoClips, previewRef, audioRef, currentTime, subtitleClips, overlayLayers,
  exporting, exportProgress, selectedOverlayId, setSelectedOverlayId, setOverlayLayers, bgColor, playing, canvasSize, onBeforeChange,
}: PreviewCanvasProps) {
  const CW = canvasSize.w, CH = canvasSize.h;
  const activeSub = subtitleClips.find(s => currentTime >= s.startTime && currentTime < s.endTime);
  const activeOverlays = overlayLayers.filter(l => currentTime >= l.startTime && currentTime < l.endTime && (l.visible ?? true) && l.type !== "transition");
  const activeTransition = overlayLayers.find(l => l.type === "transition" && currentTime >= l.startTime && currentTime < l.endTime && (l.visible ?? true));
  const transProgress = activeTransition ? (currentTime - activeTransition.startTime) / (activeTransition.endTime - activeTransition.startTime) : 0;
  const transLayers = activeTransition ? getTransitionLayers(overlayLayers, activeTransition.startTime, activeTransition.endTime) : null;
  const transClips = activeTransition && !transLayers?.layerA && !transLayers?.layerB
    ? getTransitionClips(videoClips, activeTransition.startTime, activeTransition.endTime) : null;

  // Pre-compute base clip modifiers so Clip A fades/slides correctly during transitions
  const activeTT = activeTransition?.transitionType || "crossfade";
  const baseOpacityMul = (() => {
    if (!activeTransition || !transClips) return 1;
    if (activeTT === "crossfade" || activeTT === "cross-dissolve") return 1 - transProgress;
    // fade-color: base video fades out in first half, fades back in (as clip B) in second half
    // so at peak-black (p=0.5) the base is opacity=0 — no subpixel edge bleed
    if (activeTT === "fade-color") {
      if (transProgress <= 0.5) return Math.max(0, 1 - transProgress * 2);
      return Math.max(0, (transProgress - 0.5) * 2);
    }
    return 1;
  })();
  const baseSlideXPct = (activeTransition && transClips && activeTT === "slide-left") ? -transProgress * 100 : 0;

  // Clip B video time offset for correct seeking in transition preview
  let clipBTimelineStart = 0;
  if (transClips?.clipB) {
    for (let i = 0; i < transClips.clipB.idx; i++) clipBTimelineStart += getVisDur(videoClips[i]);
  }
  const clipBVideoOffset = transClips?.clipB
    ? Math.max(0, currentTime - clipBTimelineStart + (transClips.clipB.clip.trimStart ?? 0))
    : 0;

  const areaRef = useRef<HTMLDivElement>(null);
  const [dragging, setDragging] = useState<DragState>(null);
  const [resizing, setResizing] = useState<ResizeState>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  const [mediaBlobUrls, setMediaBlobUrls] = useState<Record<string, string>>({});
  const loadingRef = useRef<Set<string>>(new Set());
  const blobUrlsRef = useRef<Record<string, string>>({});
  blobUrlsRef.current = mediaBlobUrls;
  useEffect(() => {
    const fetchWithFallback = async (src: string): Promise<Blob> => {
      try {
        const res = await fetch(src);
        if (res.ok) return await res.blob();
      } catch { /* CORS or network error — try presigned */ }
      const r2Key = src.replace(`${R2_PUBLIC_URL}/`, "");
      const presignRes = await fetch("/api/storyboard/download-file", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ r2Key, filename: r2Key.split("/").pop() || "file" }),
      });
      const data = await presignRes.json();
      if (!data.downloadUrl) throw new Error("No presigned URL");
      const res = await fetch(data.downloadUrl);
      return await res.blob();
    };

    for (const layer of overlayLayers) {
      if ((layer.type === "video" || layer.type === "image") && layer.src && !blobUrlsRef.current[layer.id] && !loadingRef.current.has(layer.id)) {
        loadingRef.current.add(layer.id);
        fetchWithFallback(layer.src)
          .then(blob => setMediaBlobUrls(prev => ({ ...prev, [layer.id]: URL.createObjectURL(blob) })))
          .catch(err => console.error("[MediaOverlay] All fetch methods failed:", layer.src, err))
          .finally(() => loadingRef.current.delete(layer.id));
      }
    }
  }, [overlayLayers]);

  const toCanvas = (dx: number, dy: number) => {
    const el = areaRef.current;
    if (!el) return { dx: 0, dy: 0 };
    return { dx: (dx / el.clientWidth) * CW, dy: (dy / el.clientHeight) * CH };
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const d = toCanvas(e.clientX - dragging.startX, e.clientY - dragging.startY);
      setOverlayLayers(p => p.map(l => {
        if (l.id !== dragging.id) return l;
        const upd: Partial<OverlayLayer> = { x: Math.round(dragging.origX + d.dx), y: Math.round(dragging.origY + d.dy) };
        if ((l.shapeType === "arrow" || l.shapeType === "line") && l.endX != null && l.endY != null) {
          const origEndX = (dragging as any).origEndX ?? l.endX;
          const origEndY = (dragging as any).origEndY ?? l.endY;
          upd.endX = Math.round(origEndX + d.dx);
          upd.endY = Math.round(origEndY + d.dy);
        }
        return { ...l, ...upd };
      }));
    };
    const onUp = () => setDragging(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [dragging, setOverlayLayers]);

  useEffect(() => {
    if (!resizing) return;
    const onMove = (e: MouseEvent) => {
      const d = toCanvas(e.clientX - resizing.startX, e.clientY - resizing.startY);
      setOverlayLayers(p => p.map(l => {
        if (l.id !== resizing.id) return l;
        const hdl = resizing.handle;

        if (hdl === "start" || hdl === "end") {
          if (hdl === "start") {
            return { ...l, x: Math.round(resizing.origX + d.dx), y: Math.round(resizing.origY + d.dy) };
          } else {
            return { ...l, endX: Math.round((resizing.origEndX ?? l.endX ?? l.x + l.w) + d.dx), endY: Math.round((resizing.origEndY ?? l.endY ?? l.y) + d.dy) };
          }
        }

        let { origX: x, origY: y, origW: w, origH: h } = resizing;
        if (hdl.includes("e")) w = Math.max(20, w + d.dx);
        if (hdl.includes("s")) h = Math.max(10, h + d.dy);
        if (hdl.includes("w")) { x += d.dx; w = Math.max(20, w - d.dx); }
        if (hdl.includes("n")) { y += d.dy; h = Math.max(10, h - d.dy); }
        return { ...l, x: Math.round(x), y: Math.round(y), w: Math.round(w), h: Math.round(h) };
      }));
    };
    const onUp = () => setResizing(null);
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [resizing, setOverlayLayers]);

  const startDrag = (e: React.MouseEvent, layer: OverlayLayer) => {
    e.stopPropagation();
    setSelectedOverlayId(layer.id);
    if (layer.locked) return;
    onBeforeChange?.();
    setDragging({ id: layer.id, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y, origEndX: layer.endX, origEndY: layer.endY } as any);
  };

  const startResize = (e: React.MouseEvent, layer: OverlayLayer, handle: string) => {
    e.stopPropagation();
    if (layer.locked) return;
    onBeforeChange?.();
    setResizing({ id: layer.id, handle, startX: e.clientX, startY: e.clientY, origX: layer.x, origY: layer.y, origW: layer.w, origH: layer.h, origEndX: layer.endX, origEndY: layer.endY });
  };

  const startRotate = (e: React.MouseEvent, layer: OverlayLayer) => {
    e.stopPropagation();
    if (layer.locked) return;
    onBeforeChange?.();
    const el = areaRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + ((layer.x + layer.w / 2) / CW) * rect.width;
    const cy = rect.top + ((layer.y + layer.h / 2) / CH) * rect.height;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    const origRotation = layer.rotation || 0;
    const onMove = (me: MouseEvent) => {
      const angle = Math.atan2(me.clientY - cy, me.clientX - cx) * (180 / Math.PI);
      const delta = angle - startAngle;
      setOverlayLayers(p => p.map(l => l.id !== layer.id ? l : { ...l, rotation: Math.round(origRotation + delta) }));
    };
    const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
    window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
  };

  const isLineType = (l: OverlayLayer) => l.type === "shape" && (l.shapeType === "arrow" || l.shapeType === "line");

  const rectHandles = [
    { key: "nw", x: "0%", y: "0%", cursor: "nw-resize" },
    { key: "n", x: "50%", y: "0%", cursor: "ns-resize" },
    { key: "ne", x: "100%", y: "0%", cursor: "ne-resize" },
    { key: "e", x: "100%", y: "50%", cursor: "ew-resize" },
    { key: "se", x: "100%", y: "100%", cursor: "se-resize" },
    { key: "s", x: "50%", y: "100%", cursor: "ns-resize" },
    { key: "sw", x: "0%", y: "100%", cursor: "sw-resize" },
    { key: "w", x: "0%", y: "50%", cursor: "ew-resize" },
  ];

  const lineHandles = [
    { key: "w", x: "0%", y: "50%", cursor: "ew-resize" },
    { key: "e", x: "100%", y: "50%", cursor: "ew-resize" },
  ];

  const renderOverlayContent = (layer: OverlayLayer) => {
    if (layer.type === "text") {
      if (editingTextId === layer.id) {
        return (
          <input
            autoFocus
            defaultValue={layer.text || ""}
            onBlur={(e) => { setOverlayLayers(p => p.map(l => l.id !== layer.id ? l : { ...l, text: e.target.value })); setEditingTextId(null); }}
            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
            onMouseDown={(e) => e.stopPropagation()}
            style={{
              fontSize: `clamp(10px, ${(layer.fontSize || 48) / 19.2}cqw, 200px)`,
              color: layer.fontColor || "#FFFFFF",
              fontWeight: (layer.fontWeight as any) || "bold",
              fontFamily: layer.fontFamily || "Arial",
              fontStyle: layer.fontStyle || "normal",
              background: "transparent", border: "none", outline: "none",
              width: "100%", textAlign: "center",
            }}
          />
        );
      }
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
    if (layer.type === "scrolling-text") {
      const layerDur = layer.endTime - layer.startTime;
      const elapsed = currentTime - layer.startTime;
      const rawProgress = layerDur > 0 ? Math.max(0, Math.min(1, elapsed / layerDur)) : 0;
      const progress = rawProgress < 0.5
        ? 4 * rawProgress * rawProgress * rawProgress
        : 1 - Math.pow(-2 * rawProgress + 2, 3) / 2;
      const dir = layer.scrollDirection || "up";
      const scrollPct = dir === "up" ? (1 - progress) * 200 - 100 : progress * 200 - 100;
      return (
        <div style={{ position: "absolute", inset: 0, overflow: "hidden" }}>
          <div style={{
            position: "absolute", left: 0, right: 0,
            top: `${scrollPct}%`,
            padding: "0 8%",
            fontSize: `clamp(10px, ${(layer.fontSize || 24) / 19.2}cqw, 120px)`,
            color: layer.fontColor || "#FFFFFF",
            fontWeight: (layer.fontWeight as any) || "normal",
            fontFamily: layer.fontFamily || "Arial",
            lineHeight: 1.6,
            textAlign: "center",
            whiteSpace: "pre-wrap",
          }}>
            {layer.text}
          </div>
        </div>
      );
    }
    if (layer.type === "video" && layer.src) {
      const layerTime = currentTime - layer.startTime;
      const blobUrl = mediaBlobUrls[layer.id];
      return (
        <video
          key={`v-${layer.id}`}
          src={blobUrl || layer.src}
          playsInline
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: layer.borderRadius || 0, display: "block" }}
          ref={(el) => {
            if (!el) return;
            el.volume = (layer.volume ?? 100) / 100;
            el.muted = false;
            el.loop = true;
            if (el.readyState >= 1 && el.duration > 0) {
              const loopedTime = Math.max(0, layerTime) % el.duration;
              const target = Math.min(loopedTime, el.duration - 0.01);
              if (Math.abs(el.currentTime - target) > 0.15) el.currentTime = target;
            }
            if (playing && el.paused) el.play().catch(() => {});
            if (!playing && !el.paused) el.pause();
          }}
        />
      );
    }
    if (layer.type === "image" && layer.src) {
      const blobUrl = mediaBlobUrls[layer.id];
      return (
        <img src={blobUrl || layer.src} alt=""
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: layer.borderRadius || 0, display: "block" }} />
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
        const sx = layer.x, sy = layer.y;
        const ex = layer.endX ?? (layer.x + layer.w), ey = layer.endY ?? layer.y;
        const pad = Math.max(8, (layer.strokeWidth || 2) * 2);
        const bx = Math.min(sx, ex) - pad, by = Math.min(sy, ey) - pad;
        const bw = Math.abs(ex - sx) + pad * 2;
        const bh = Math.max(Math.abs(ey - sy) + pad * 2, pad * 2);
        const lx1 = sx - bx, ly1 = sy - by, lx2 = ex - bx, ly2 = ey - by;
        return (
          <svg width="100%" height="100%" viewBox={`0 0 ${bw} ${bh}`} style={{ overflow: "visible", position: "absolute", inset: 0, pointerEvents: "none" }} preserveAspectRatio="none">
            <defs>
              {layer.shapeType === "arrow" && (
                <marker id={`ah-${layer.id}`} viewBox="0 -4 8 8" refX="7" refY="0" markerWidth="5" markerHeight="5" orient="auto">
                  <path d="M0,-3 L8,0 L0,3 Z" fill={layer.strokeColor || "#FF00FF"} />
                </marker>
              )}
            </defs>
            <line x1={lx1} y1={ly1} x2={lx2} y2={ly2}
              stroke={layer.strokeColor || "#FF00FF"} strokeWidth={layer.strokeWidth || 2}
              vectorEffect="non-scaling-stroke"
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

      {/* Aspect-ratio locked canvas wrapper */}
      <div className="absolute inset-0 flex items-center justify-center z-10 p-4"
        style={{ containerType: "size" }}>
      <div ref={areaRef} className="relative rounded-xl shadow-2xl overflow-hidden" style={{
        aspectRatio: `${CW} / ${CH}`,
        maxWidth: "100%", height: "100%",
        containerType: "inline-size",
      }}
        onClick={() => setSelectedOverlayId(null)}>

        {/* Base video/image/empty state */}
        <div className="absolute inset-0 flex items-center justify-center overflow-hidden" style={{ backgroundColor: bgColor }}>
          {cur?.clip.type === "video" ? (
            <video ref={previewRef} className="absolute inset-0 w-full h-full object-cover" playsInline
              style={{ mixBlendMode: (cur.clip.blendMode || "normal") as any, opacity: (cur.clip.opacity ?? 100) / 100 * baseOpacityMul, transform: baseSlideXPct !== 0 ? `translateX(${baseSlideXPct}%)` : undefined }} />
          ) : cur?.clip.type === "audio" ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 rounded-full bg-(--bg-secondary) flex items-center justify-center border border-(--border-primary)">
                <Music className="w-10 h-10 text-(--accent-teal)/60" />
              </div>
              <span className="text-[13px] text-(--text-tertiary)">{cur.clip.name}</span>
            </div>
          ) : cur?.clip.type === "image" ? (
            <img src={cur.clip.src} className="absolute inset-0 w-full h-full object-cover" alt=""
              style={{ mixBlendMode: (cur.clip.blendMode || "normal") as any, opacity: (cur.clip.opacity ?? 100) / 100 * baseOpacityMul, transform: baseSlideXPct !== 0 ? `translateX(${baseSlideXPct}%)` : undefined }} />
          ) : (
            <div className="flex flex-col items-center gap-4 text-(--border-primary)">
              <Film className="w-20 h-20" />
              <p className="text-[13px] text-(--text-tertiary)">Add media or open <span className="text-(--accent-teal) font-medium">Layers</span> to start</p>
            </div>
          )}

          {/* Transition effects */}
          {activeTransition && transClips && (() => {
            const tt = activeTransition.transitionType || "crossfade";
            const p = transProgress;
            const clipB = transClips.clipB?.clip;
            const hasB = !!(clipB && (clipB.type === "image" || clipB.type === "video"));

            // Renders Clip B; video elements get time-synced via ref callback
            const renderClipB = () => {
              if (!hasB || !clipB) return null;
              if (clipB.type === "image") return <img src={clipB.src} className="w-full h-full object-cover" alt="" />;
              return (
                <video src={clipB.src} className="w-full h-full object-cover" muted playsInline
                  ref={(el) => {
                    if (!el || el.readyState < 1) return;
                    const target = el.duration > 0 ? Math.min(clipBVideoOffset, el.duration - 0.01) : clipBVideoOffset;
                    if (Math.abs(el.currentTime - target) > 0.15) el.currentTime = target;
                  }} />
              );
            };

            if (tt === "fade-color") {
              const colorOpacity = Math.min(1, p < 0.5 ? p * 2 : (1 - p) * 2);
              return <div className="absolute inset-0 pointer-events-none" style={{ backgroundColor: activeTransition.backgroundColor || "#000000", opacity: colorOpacity }} />;
            }

            if (tt === "crossfade" || tt === "cross-dissolve") {
              // Clip A fade-out is handled via baseOpacityMul on the base content element above
              return hasB ? (
                <div className="absolute inset-0 pointer-events-none" style={{ opacity: p }}>
                  {renderClipB()}
                </div>
              ) : null;
            }

            if (tt === "slide-left" && hasB) {
              // Clip A slide-out is handled via baseSlideXPct on the base content element above
              return (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ transform: `translateX(${(1 - p) * 100}%)` }}>
                  {renderClipB()}
                </div>
              );
            }

            if (tt === "wipe" && hasB) {
              return (
                <div className="absolute inset-0 pointer-events-none overflow-hidden" style={{ clipPath: `inset(0 ${(1 - p) * 100}% 0 0)` }}>
                  {renderClipB()}
                </div>
              );
            }

            return null;
          })()}
        </div>

        {/* Overlay layers */}
        {activeOverlays.map(layer => {
          const isSel = layer.id === selectedOverlayId;
          const isLine = isLineType(layer);

          let transOpacity = 1;
          let transTranslate = "";
          let transClipPath: string | undefined;
          let isInTransition = false;
          if (activeTransition && transLayers) {
            const isA = transLayers.layerA?.id === layer.id;
            const isB = transLayers.layerB?.id === layer.id;
            if (isA || isB) {
              isInTransition = true;
              const p = transProgress;
              const tt = activeTransition.transitionType || "crossfade";
              if (tt === "crossfade" || tt === "cross-dissolve") {
                transOpacity = isA ? (1 - p) : p;
              } else if (tt === "fade-color") {
                // Clip B enters the DOM at p=0.3 (color still fully opaque) so the
                // video element has ~30% of the transition to seek before it's revealed.
                transOpacity = isA ? (p < 0.5 ? 1 : 0) : (p >= 0.3 ? 1 : 0);
              } else if (tt === "slide-left") {
                transTranslate = isA ? `translateX(${-p * 100}%)` : `translateX(${(1 - p) * 100}%)`;
              } else if (tt === "wipe") {
                if (isB) transClipPath = `inset(0 ${(1 - p) * 100}% 0 0)`;
              }
            }
          }

          let bx = layer.x, by = layer.y, bw = layer.w, bh = layer.h;
          if (isLine && layer.endX != null && layer.endY != null) {
            const pad = Math.max(8, (layer.strokeWidth || 2) * 2);
            bx = Math.min(layer.x, layer.endX) - pad;
            by = Math.min(layer.y, layer.endY) - pad;
            bw = Math.abs(layer.endX - layer.x) + pad * 2;
            bh = Math.max(Math.abs(layer.endY - layer.y) + pad * 2, pad * 2);
          }

          const baseStyle: React.CSSProperties = {
            position: "absolute",
            left: `${(bx / CW) * 100}%`,
            top: `${(by / CH) * 100}%`,
            width: `${(bw / CW) * 100}%`,
            height: `${(bh / CH) * 100}%`,
            cursor: dragging?.id === layer.id ? "grabbing" : "grab",
            opacity: ((layer.opacity ?? 100) / 100) * transOpacity,
            transform: [layer.rotation ? `rotate(${layer.rotation}deg)` : "", transTranslate].filter(Boolean).join(" ") || undefined,
            clipPath: transClipPath,
            zIndex: isSel ? 50 : undefined,
            willChange: isInTransition ? "opacity, transform" : undefined,
            backfaceVisibility: isInTransition ? "hidden" : undefined,
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
          } else if (layer.type === "scrolling-text") {
            Object.assign(baseStyle, {
              overflow: "hidden",
              backgroundColor: layer.backgroundColor || "rgba(0,0,0,0.75)",
              borderRadius: layer.borderRadius || 0,
            });
          } else if (layer.type === "shape" && layer.shapeType === "rectangle") {
            Object.assign(baseStyle, {
              borderWidth: layer.strokeWidth || 4,
              borderColor: layer.strokeColor || "#FF00FF",
              borderStyle: "solid",
              borderRadius: layer.borderRadius || 0,
              backgroundColor: layer.fillColor || "transparent",
            });
          } else if (layer.type === "video" || layer.type === "image") {
            Object.assign(baseStyle, {
              borderWidth: layer.borderWidth || 0,
              borderColor: layer.borderColor || "transparent",
              borderStyle: layer.borderWidth ? "solid" : "none",
              borderRadius: layer.borderRadius || 0,
              overflow: "hidden",
            });
          }

          const handlesArr = isLine ? lineHandles : rectHandles;

          return (
            <div key={layer.id}
              style={baseStyle}
              onMouseDown={(e) => startDrag(e, layer)}
              onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(layer.id); }}
              onDoubleClick={(e) => { e.stopPropagation(); if (layer.type === "text") setEditingTextId(layer.id); }}
            >
              {renderOverlayContent(layer)}

              {/* Selection ring + resize handles + rotation handle */}
              {isSel && (
                <>
                  {!isLine && <div className="absolute inset-0 ring-2 ring-(--accent-teal) rounded pointer-events-none" />}
                  {isLine && layer.endX != null && layer.endY != null ? (
                    <>
                      <div className="absolute w-4 h-4 bg-(--accent-teal) border-2 border-white rounded-full z-10 shadow-md"
                        style={{ left: `${((layer.x - bx) / bw) * 100}%`, top: `${((layer.y - by) / bh) * 100}%`, transform: "translate(-50%, -50%)", cursor: layer.locked ? "not-allowed" : "move" }}
                        onMouseDown={(e) => startResize(e, layer, "start")} />
                      <div className="absolute w-4 h-4 bg-rose-400 border-2 border-white rounded-full z-10 shadow-md"
                        style={{ left: `${((layer.endX - bx) / bw) * 100}%`, top: `${((layer.endY - by) / bh) * 100}%`, transform: "translate(-50%, -50%)", cursor: layer.locked ? "not-allowed" : "move" }}
                        onMouseDown={(e) => startResize(e, layer, "end")} />
                    </>
                  ) : handlesArr.map(h => {
                    const big = layer.type === "video" || layer.type === "image";
                    return (
                      <div key={h.key}
                        className={`absolute ${big ? "w-4 h-4" : "w-2.5 h-2.5"} bg-(--accent-teal) border-2 border-white rounded-full z-10 shadow-md`}
                        style={{ left: h.x, top: h.y, transform: "translate(-50%, -50%)", cursor: layer.locked ? "not-allowed" : h.cursor }}
                        onMouseDown={(e) => startResize(e, layer, h.key)}
                      />
                    );
                  })}
                  {/* Rotation handle */}
                  <div className="absolute left-1/2 -translate-x-1/2 w-px h-5 bg-(--accent-teal)/60 pointer-events-none" style={{ bottom: "100%" }} />
                  <div className="absolute left-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-(--accent-teal) border-2 border-white z-10 flex items-center justify-center"
                    style={{ bottom: "calc(100% + 18px)", cursor: layer.locked ? "not-allowed" : "grab", transform: "translateX(-50%)" }}
                    onMouseDown={(e) => startRotate(e, layer)}>
                    <svg className="w-2.5 h-2.5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                      <path d="M1 4v6h6M23 20v-6h-6" /><path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15" />
                    </svg>
                  </div>
                </>
              )}
            </div>
          );
        })}

        {/* Fade-to-color overlay for overlay-layer transitions */}
        {activeTransition && transLayers && (transLayers.layerA || transLayers.layerB) && activeTransition.transitionType === "fade-color" && (() => {
          const p = transProgress;
          // Fully opaque from 30%–70% of transition so the async video seek window is hidden.
          // Ramps: 0→1 over [0, 0.3], holds 1 over [0.3, 0.7], 1→0 over [0.7, 1].
          const colorOp = p < 0.3 ? p / 0.3 : p > 0.7 ? (1 - p) / 0.3 : 1;
          const lA = transLayers.layerA;
          const lB = transLayers.layerB;
          const aX = lA?.x ?? lB!.x, aY = lA?.y ?? lB!.y, aR = lA ? lA.x + lA.w : lB!.x + lB!.w, aB = lA ? lA.y + lA.h : lB!.y + lB!.h;
          const bX = lB?.x ?? lA!.x, bY = lB?.y ?? lA!.y, bR = lB ? lB.x + lB.w : lA!.x + lA!.w, bB = lB ? lB.y + lB.h : lA!.y + lA!.h;
          const x1 = Math.min(aX, bX), y1 = Math.min(aY, bY);
          const x2 = Math.max(aR, bR), y2 = Math.max(aB, bB);
          return (
            <div className="absolute pointer-events-none" style={{
              left: `${(x1 / CW) * 100}%`, top: `${(y1 / CH) * 100}%`,
              width: `${((x2 - x1) / CW) * 100}%`, height: `${((y2 - y1) / CH) * 100}%`,
              backgroundColor: activeTransition.backgroundColor || "#000000",
              opacity: colorOp,
              zIndex: 45,
              willChange: "opacity",
            }} />
          );
        })()}

        {/* Subtitle overlay */}
        {activeSub && (
          <div className={`absolute left-0 right-0 pointer-events-none flex justify-center px-4 z-20 ${
            activeSub.position === "top" ? "top-4" :
            activeSub.position === "center" ? "top-1/2 -translate-y-1/2" : "bottom-4"
          }`}>
            <span style={{ fontSize: activeSub.fontSize, color: activeSub.fontColor, backgroundColor: activeSub.backgroundColor, fontWeight: activeSub.fontWeight }}
              className="px-3 py-1 rounded-md max-w-[80%] text-center">
              {activeSub.text}
            </span>
          </div>
        )}
      </div>
      </div>

      {/* Export overlay */}
      {exporting && (
        <div className="absolute inset-0 bg-black/85 flex flex-col items-center justify-center gap-4 z-30">
          <Loader2 className="w-10 h-10 text-(--accent-teal) animate-spin" />
          <p className="text-(--text-primary) font-medium">Exporting... {exportProgress}%</p>
          <div className="w-56 h-2 bg-(--border-primary) rounded-full overflow-hidden">
            <div className="h-full bg-(--accent-teal) transition-all" style={{ width: `${exportProgress}%` }} />
          </div>
        </div>
      )}
    </>
  );
}
