"use client";

import React, { useState } from "react";
import { Film, Music, Plus, Scissors, Layers, ALargeSmall, Square, Circle, ArrowUpRight, Minus, ChevronDown, ChevronRight, Image as ImageIcon, ScrollText, Blend } from "lucide-react";
import { TimelineClip, SubtitleClip, OverlayLayer, formatTime, getVisDur } from "./types";

interface TimelineTracksProps {
  videoClips: TimelineClip[];
  audioClips: TimelineClip[];
  subtitleClips: SubtitleClip[];
  overlayLayers: OverlayLayer[];
  selectedTrack: "video" | "audio" | "overlay";
  selectedClipId: string | null;
  selectedSubtitleId: string | null;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  setOverlayLayers: React.Dispatch<React.SetStateAction<OverlayLayer[]>>;
  pxPerSec: number;
  currentTime: number;
  totalDur: number;
  playing: boolean;
  draggedClipId: string | null;
  showRangeCut: boolean;
  rangeCutStart: number;
  rangeCutEnd: number;
  setSelectedTrack: (t: "video" | "audio" | "overlay") => void;
  setSelectedClipId: (id: string | null) => void;
  setSelectedSubtitleId: (id: string | null) => void;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  setRangeCutStart: React.Dispatch<React.SetStateAction<number>>;
  setRangeCutEnd: React.Dispatch<React.SetStateAction<number>>;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onTrimDown: (e: React.MouseEvent, id: string, side: "left" | "right") => void;
  onTimelineClick: (e: React.MouseEvent) => void;
  splitClip: () => void;
  applyRangeCut: () => void;
  syncPreview: (t: number) => void;
  setClipContextMenu: (v: { x: number; y: number; clipId: string } | null) => void;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  playheadRef: React.RefObject<HTMLDivElement | null>;
  progressBarRef: React.RefObject<HTMLDivElement | null>;
  playStart: React.MutableRefObject<{ realTime: number; offset: number }>;
  onBeforeLayerChange?: () => void;
}

export function TimelineTracks(props: TimelineTracksProps) {
  const {
    videoClips, audioClips, overlayLayers,
    selectedTrack, selectedClipId,
    selectedOverlayId, setSelectedOverlayId, setOverlayLayers,
    pxPerSec, currentTime, totalDur, playing,
    draggedClipId, showRangeCut, rangeCutStart, rangeCutEnd,
    setSelectedTrack, setSelectedClipId, setSelectedSubtitleId, setCurrentTime,
    setRangeCutStart, setRangeCutEnd,
    onDragStart, onDragOver, onDrop, onDragEnd, onTrimDown, onTimelineClick,
    splitClip, applyRangeCut, syncPreview, setClipContextMenu,
    timelineRef, playheadRef, progressBarRef, playStart,
  } = props;

  const clips = selectedTrack === "video" ? videoClips : audioClips;
  const sel = videoClips.find(c => c.id === selectedClipId) || audioClips.find(c => c.id === selectedClipId);
  const tlWidth = Math.max(totalDur * pxPerSec + 200, 500);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggleCollapse = (t: string) => setCollapsed(p => ({ ...p, [t]: !p[t] }));

  const vH = collapsed.video ? 0 : 56;
  const aH = collapsed.audio ? 0 : 36;
  const layerRowH = 24;
  const oH = collapsed.overlay ? 0 : Math.max(36, overlayLayers.length * layerRowH);
  const labelH = 20;
  const totalTrackH = (collapsed.video ? labelH : vH) + (collapsed.audio ? labelH : aH) + (collapsed.overlay ? labelH : oH);
  const trackHeight = 24 + totalTrackH;
  const videoTop = 24;
  const audioTop = videoTop + (collapsed.video ? labelH : vH);
  const overlayTop = audioTop + (collapsed.audio ? labelH : aH);

  const trackLabelData = [
    { key: "video", label: "Background", icon: <Film className="w-2.5 h-2.5" />, h: vH, colorCls: "text-teal-400", bgCls: "bg-teal-500/5" },
    { key: "audio", label: "Audio", icon: <Music className="w-2.5 h-2.5" />, h: aH, colorCls: "text-purple-400", bgCls: "bg-purple-500/5" },
    { key: "overlay", label: "Layers", icon: <Layers className="w-2.5 h-2.5" />, h: oH, colorCls: "text-pink-400", bgCls: "bg-pink-500/5" },
  ] as const;

  const layerIcon = (layer: OverlayLayer) => {
    if (layer.type === "text") return <ALargeSmall className="w-2.5 h-2.5 text-pink-400/70" />;
    if (layer.type === "scrolling-text") return <ScrollText className="w-2.5 h-2.5 text-amber-400/70" />;
    if (layer.type === "transition") return <Blend className="w-2.5 h-2.5 text-rose-400/70" />;
    if (layer.type === "video") return <Film className="w-2.5 h-2.5 text-violet-400/70" />;
    if (layer.type === "image") return <ImageIcon className="w-2.5 h-2.5 text-orange-400/70" />;
    if (layer.shapeType === "circle") return <Circle className="w-2.5 h-2.5 text-cyan-400/70" />;
    if (layer.shapeType === "arrow") return <ArrowUpRight className="w-2.5 h-2.5 text-cyan-400/70" />;
    if (layer.shapeType === "line") return <Minus className="w-2.5 h-2.5 text-cyan-400/70" />;
    return <Square className="w-2.5 h-2.5 text-cyan-400/70" />;
  };

  return (
    <div
      ref={timelineRef}
      className="relative overflow-x-auto overflow-y-hidden cursor-pointer"
      style={{ height: trackHeight }}
      onClick={onTimelineClick}
    >
          {/* Track labels */}
          <div className="absolute left-0 top-6 bottom-0 w-12 bg-(--bg-secondary) border-r border-(--border-primary) z-20 flex flex-col">
            {trackLabelData.map(track => (
              <div key={track.key} className="flex items-stretch border-b border-(--border-primary)"
                style={{ height: collapsed[track.key] ? labelH : track.h }}>
                <button onClick={() => toggleCollapse(track.key)}
                  className="w-2.5 flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) transition shrink-0">
                  {collapsed[track.key] ? <ChevronRight className="w-2 h-2" /> : <ChevronDown className="w-2 h-2" />}
                </button>
                <button onClick={() => setSelectedTrack(track.key as any)}
                  className={`flex-1 flex items-center gap-0.5 px-0.5 text-[7px] transition ${
                    selectedTrack === track.key ? `${track.colorCls} ${track.bgCls}` : "text-(--text-tertiary) hover:text-(--text-secondary)"
                  }`}>
                  {track.icon}<span>{track.label}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Ruler */}
          <div className="sticky top-0 h-6 bg-(--bg-secondary) border-b border-(--border-primary) z-10 pointer-events-none" style={{ width: tlWidth, marginLeft: 48 }}>
            {totalDur > 0 && (
              <div ref={progressBarRef} className="absolute bottom-0 left-0 h-[2px] bg-(--accent-teal)/40" style={{ width: currentTime * pxPerSec }} />
            )}
            {(() => {
              const tickInterval = pxPerSec >= 60 ? 1 : pxPerSec >= 20 ? 5 : pxPerSec >= 8 ? 10 : pxPerSec >= 4 ? 30 : 60;
              const tickCount = Math.ceil(totalDur / tickInterval) + 2;
              return Array.from({ length: tickCount }, (_, i) => {
                const sec = i * tickInterval;
                return (
                  <div key={sec} className="absolute top-0" style={{ left: sec * pxPerSec }}>
                    <div className="w-px h-2.5 bg-(--border-primary)" />
                    <span className="text-[8px] text-(--text-tertiary) ml-0.5 select-none">{formatTime(sec)}</span>
                  </div>
                );
              });
            })()}
          </div>

          {/* Video Track */}
          {!collapsed.video && (
            <div className={`absolute left-12 flex items-stretch gap-1 px-2 py-1 border-b border-(--border-primary) ${selectedTrack === "video" ? "bg-teal-500/[0.02]" : ""}`}
              style={{ width: tlWidth, top: videoTop, height: vH }}>
              {videoClips.map(clip => {
                const vd = getVisDur(clip);
                const w = vd * pxPerSec;
                const isSel = clip.id === selectedClipId;
                return (
                  <div key={clip.id} data-clip draggable
                    onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, clip.id)} onDragEnd={onDragEnd}
                    onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("video"); }}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("video"); setClipContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); }}
                    className={`relative shrink-0 rounded-lg overflow-hidden transition cursor-grab active:cursor-grabbing ${
                      isSel ? "ring-2 ring-(--accent-teal) shadow-lg shadow-teal-500/20" : "ring-1 ring-(--border-primary) hover:ring-(--border-secondary)"
                    } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                    style={{ width: Math.max(w || 30, 30), height: "100%" }}>
                    {clip.type === "video" && <video src={clip.src} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata" onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = clip.trimStart + 0.5; }} />}
                    {clip.type === "image" && <img src={clip.src} className="absolute inset-0 w-full h-full object-cover" alt="" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />
                    <span className={`absolute top-1 left-1 text-[7px] font-bold px-1 py-0.5 rounded-md ${clip.type === "video" ? "bg-emerald-600/90" : "bg-purple-600/90"} text-white`}>
                      {clip.type === "video" ? "VID" : "IMG"}
                    </span>
                    <div className="absolute bottom-0.5 left-1 right-1 flex items-center justify-between">
                      <span className="text-[8px] text-white/80 truncate">{clip.name}</span>
                      <span className="text-[7px] text-white/40 shrink-0 ml-0.5">{formatTime(vd)}</span>
                    </div>
                    {!showRangeCut && (<>
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover/t:bg-(--accent-teal) transition rounded-l" />
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover/t:bg-(--accent-teal) transition rounded-r" />
                      </div>
                    </>)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Audio Track */}
          {!collapsed.audio && (
            <div className={`absolute left-12 flex items-stretch gap-1 px-2 py-1 border-b border-(--border-primary) ${selectedTrack === "audio" ? "bg-purple-500/[0.02]" : ""}`}
              style={{ width: tlWidth, top: audioTop, height: aH }}>
              {audioClips.map(clip => {
                const vd = getVisDur(clip);
                const w = vd * pxPerSec;
                const isSel = clip.id === selectedClipId;
                return (
                  <div key={clip.id} data-clip draggable
                    onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver}
                    onDrop={(e) => onDrop(e, clip.id)} onDragEnd={onDragEnd}
                    onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("audio"); }}
                    onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("audio"); setClipContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); }}
                    className={`relative shrink-0 rounded-lg overflow-hidden transition cursor-grab ${
                      isSel ? "ring-2 ring-purple-400" : "ring-1 ring-(--border-primary) hover:ring-(--border-secondary)"
                    } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                    style={{ width: Math.max(w || 30, 30), height: "100%" }}>
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-950/40 to-purple-900/20 flex items-center px-1.5 gap-1">
                      <Music className="w-3 h-3 text-purple-500/40 shrink-0" />
                      <span className="text-[8px] text-white/70 truncate">{clip.name}</span>
                      <span className="text-[7px] text-white/40 shrink-0 ml-auto">{formatTime(vd)}</span>
                    </div>
                    {!showRangeCut && (<>
                      <div className="absolute left-0 top-0 bottom-0 w-2 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover/t:bg-purple-400 transition rounded-l" />
                      </div>
                      <div className="absolute right-0 top-0 bottom-0 w-2 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                        <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover/t:bg-purple-400 transition rounded-r" />
                      </div>
                    </>)}
                  </div>
                );
              })}
            </div>
          )}

          {/* Overlay/Layers Track */}
          {!collapsed.overlay && (
            <div className={`absolute left-12 border-b border-(--border-primary) ${selectedTrack === "overlay" ? "bg-teal-500/2" : ""}`}
              style={{ width: tlWidth, top: overlayTop, height: oH }}>
              {overlayLayers.map((layer, li) => {
                const x = (layer.startTime || 0) * pxPerSec;
                const w = ((layer.endTime || 0) - (layer.startTime || 0)) * pxPerSec;
                const isSel = layer.id === selectedOverlayId;
                const label = layer.type === "text" ? (layer.text || "Text").slice(0, 8) :
                  layer.type === "scrolling-text" ? "Scroller" :
                  layer.type === "transition" ? (layer.transitionType || "Transition") :
                  layer.type === "video" ? "Video" : layer.type === "image" ? "Image" :
                  layer.shapeType || "Shape";
                const rowY = li * layerRowH;

                const onLayerDrag = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  props.onBeforeLayerChange?.();
                  setSelectedOverlayId(layer.id); setSelectedTrack("overlay");
                  const startX = e.clientX;
                  const origStart = layer.startTime;
                  const dur = layer.endTime - layer.startTime;
                  const onMove = (me: MouseEvent) => {
                    const dt = (me.clientX - startX) / pxPerSec;
                    const newStart = Math.max(0, origStart + dt);
                    setOverlayLayers(p => p.map(l => l.id !== layer.id ? l : { ...l, startTime: parseFloat(newStart.toFixed(2)), endTime: parseFloat((newStart + dur).toFixed(2)) }));
                  };
                  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                  window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                };

                const onTrimLeft = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  props.onBeforeLayerChange?.();
                  const startX = e.clientX;
                  const origStart = layer.startTime;
                  const onMove = (me: MouseEvent) => {
                    const dt = (me.clientX - startX) / pxPerSec;
                    const newStart = Math.max(0, Math.min(layer.endTime - 0.2, origStart + dt));
                    setOverlayLayers(p => p.map(l => l.id !== layer.id ? l : { ...l, startTime: parseFloat(newStart.toFixed(2)) }));
                  };
                  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                  window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                };

                const onTrimRight = (e: React.MouseEvent) => {
                  e.stopPropagation();
                  props.onBeforeLayerChange?.();
                  const startX = e.clientX;
                  const origEnd = layer.endTime;
                  const onMove = (me: MouseEvent) => {
                    const dt = (me.clientX - startX) / pxPerSec;
                    const newEnd = Math.max(layer.startTime + 0.2, origEnd + dt);
                    setOverlayLayers(p => p.map(l => l.id !== layer.id ? l : { ...l, endTime: parseFloat(newEnd.toFixed(2)) }));
                  };
                  const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                  window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
                };

                return (
                  <div key={layer.id}
                    className={`absolute rounded cursor-grab active:cursor-grabbing transition ${
                      isSel ? "ring-1 ring-(--accent-teal) shadow-md shadow-teal-500/20" : "ring-1 ring-(--border-primary) hover:ring-(--border-secondary)"
                    } ${!(layer.visible ?? true) ? "opacity-30" : ""}`}
                    style={{ left: x + 8, width: Math.max(w, 24), top: rowY + 2, height: layerRowH - 4 }}
                    onMouseDown={onLayerDrag}
                    onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(layer.id); setSelectedTrack("overlay"); }}
                  >
                    <div className={`h-full rounded px-1 flex items-center gap-1 overflow-hidden ${
                      layer.type === "text" ? "bg-linear-to-r from-teal-900/30 to-teal-800/15" :
                      layer.type === "scrolling-text" ? "bg-linear-to-r from-amber-900/30 to-amber-800/15" :
                      layer.type === "transition" ? "bg-linear-to-r from-rose-900/40 to-rose-800/20" :
                      layer.type === "video" ? "bg-linear-to-r from-violet-900/30 to-violet-800/15" :
                      layer.type === "image" ? "bg-linear-to-r from-orange-900/30 to-orange-800/15" :
                      "bg-linear-to-r from-cyan-900/30 to-cyan-800/15"
                    }`}>
                      {layerIcon(layer)}
                      <span className="text-[7px] text-white/60 truncate">{label}</span>
                    </div>
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group/tl"
                      onMouseDown={onTrimLeft}>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-transparent group-hover/tl:bg-(--accent-teal) transition rounded-l-lg" />
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize z-10 group/tr"
                      onMouseDown={onTrimRight}>
                      <div className="absolute right-0 top-0 bottom-0 w-1 bg-transparent group-hover/tr:bg-(--accent-teal) transition rounded-r-lg" />
                    </div>
                  </div>
                );
              })}
              {selectedTrack === "overlay" && overlayLayers.length === 0 && (
                <div className="flex items-center justify-center h-full text-[9px] text-(--text-tertiary)">
                  Use layer panel to add overlays
                </div>
              )}
            </div>
          )}

          {/* Playhead */}
          <div ref={playheadRef} className="absolute top-0 bottom-0 z-30" style={{ left: currentTime * pxPerSec + 48 }}>
            <div className="absolute top-0 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing pointer-events-auto"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startTime = currentTime;
                const onMove = (me: MouseEvent) => {
                  const dt = (me.clientX - startX) / pxPerSec;
                  const newTime = Math.max(0, Math.min(totalDur, startTime + dt));
                  setCurrentTime(newTime);
                  if (playing) { playStart.current = { realTime: performance.now(), offset: newTime }; syncPreview(newTime); }
                };
                const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
              }}>
              <div className="w-0 h-0 border-l-[6px] border-r-[6px] border-t-[8px] border-l-transparent border-r-transparent border-t-red-500" />
            </div>
            <div className="absolute top-[8px] left-1/2 -translate-x-1/2 w-px bg-red-500 pointer-events-none" style={{ height: "calc(50% - 8px)" }} />
            <button onClick={(e) => { e.stopPropagation(); splitClip(); }}
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 transition shadow-[0_0_8px_rgba(239,68,68,0.3)] pointer-events-auto z-10 border border-red-400/50"
              title="Split (S)">
              <Scissors className="w-3 h-3 text-white" />
            </button>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-red-500 pointer-events-none" style={{ height: "calc(50% - 10px)" }} />
          </div>

      {/* Range Cut needles */}
      {showRangeCut && sel && (() => {
        const rcVd = getVisDur(sel);
        let clipOffset = 0;
        for (const c of clips) { if (c.id === sel.id) break; clipOffset += getVisDur(c) * pxPerSec + 4; }
        const rcStartX = clipOffset + (rangeCutStart / rcVd) * (getVisDur(sel) * pxPerSec) + 48 + 8;
        const rcEndX = clipOffset + (rangeCutEnd / rcVd) * (getVisDur(sel) * pxPerSec) + 48 + 8;
        const makeDrag = (side: "start" | "end") => (e: React.MouseEvent) => {
          e.stopPropagation();
          const clipW = getVisDur(sel) * pxPerSec;
          const clipLeft = clipOffset + 48 + 8;
          const tl = timelineRef.current;
          const onMove = (me: MouseEvent) => {
            if (!tl) return;
            const tlRect = tl.getBoundingClientRect();
            const x = me.clientX - tlRect.left + tl.scrollLeft - clipLeft;
            const t = parseFloat((Math.max(0, Math.min(1, x / clipW)) * rcVd).toFixed(1));
            if (side === "start") setRangeCutStart(Math.max(0, Math.min(t, rangeCutEnd - 0.5)));
            else setRangeCutEnd(Math.max(rangeCutStart + 0.5, Math.min(t, rcVd)));
          };
          const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
          window.addEventListener("mousemove", onMove); window.addEventListener("mouseup", onUp);
        };
        return (
          <>
            <div className="absolute top-0 bottom-0 z-30" style={{ left: rcStartX }}>
              <div className="absolute top-0 bottom-[9px] left-1/2 -translate-x-1/2 w-px bg-green-400 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-green-400 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto" onMouseDown={makeDrag("start")} />
            </div>
            <div className="absolute top-0 bottom-0 z-30" style={{ left: rcEndX }}>
              <div className="absolute top-0 bottom-[9px] left-1/2 -translate-x-1/2 w-px bg-red-400 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-r-[6px] border-b-[8px] border-l-transparent border-r-transparent border-b-red-400 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto" onMouseDown={makeDrag("end")} />
            </div>
            <div className="absolute z-30 flex items-center justify-center pointer-events-none" style={{ left: rcStartX, width: rcEndX - rcStartX, top: "50%", transform: "translateY(-50%)" }}>
              <button onClick={(e) => { e.stopPropagation(); applyRangeCut(); }}
                className="pointer-events-auto px-4 py-1.5 bg-red-500/90 hover:bg-red-500 text-white text-[11px] font-bold rounded-md shadow-lg transition">
                CUT
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
