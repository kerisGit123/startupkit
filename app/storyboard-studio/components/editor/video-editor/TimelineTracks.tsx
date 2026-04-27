"use client";

import React from "react";
import { useState } from "react";
import { Film, Music, Type, Plus, Scissors, Layers, ALargeSmall, Square, ChevronDown, ChevronRight } from "lucide-react";
import { TimelineClip, SubtitleClip, OverlayLayer, formatTime, getVisDur } from "./types";

interface TimelineTracksProps {
  videoClips: TimelineClip[];
  audioClips: TimelineClip[];
  subtitleClips: SubtitleClip[];
  overlayLayers: OverlayLayer[];
  selectedTrack: "video" | "audio" | "subtitle" | "overlay";
  selectedClipId: string | null;
  selectedSubtitleId: string | null;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  pxPerSec: number;
  currentTime: number;
  totalDur: number;
  playing: boolean;
  draggedClipId: string | null;
  showRangeCut: boolean;
  rangeCutStart: number;
  rangeCutEnd: number;
  setSelectedTrack: (t: "video" | "audio" | "subtitle" | "overlay") => void;
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
}

export function TimelineTracks(props: TimelineTracksProps) {
  const {
    videoClips, audioClips, subtitleClips,
    selectedTrack, selectedClipId, selectedSubtitleId,
    selectedOverlayId, setSelectedOverlayId,
    pxPerSec, currentTime, totalDur, playing,
    draggedClipId, showRangeCut, rangeCutStart, rangeCutEnd,
    setSelectedTrack, setSelectedClipId, setSelectedSubtitleId, setCurrentTime,
    setRangeCutStart, setRangeCutEnd,
    onDragStart, onDragOver, onDrop, onDragEnd, onTrimDown, onTimelineClick,
    splitClip, applyRangeCut, syncPreview, setClipContextMenu,
    timelineRef, playheadRef, progressBarRef, playStart,
  } = props;
  const { overlayLayers } = props;

  const clips = selectedTrack === "video" ? videoClips : audioClips;
  const sel = videoClips.find(c => c.id === selectedClipId) || audioClips.find(c => c.id === selectedClipId);
  const tlWidth = Math.max(totalDur * pxPerSec + 200, 500);
  const hasClips = videoClips.length > 0 || audioClips.length > 0 || subtitleClips.length > 0 || overlayLayers.length > 0;

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (t: string) => setCollapsed(p => ({ ...p, [t]: !p[t] }));
  const vH = collapsed.video ? 0 : 120;
  const aH = collapsed.audio ? 0 : 100;
  const sH = collapsed.subtitle ? 0 : 60;
  const oH = collapsed.overlay ? 0 : 80;
  const labelH = 24; // collapsed track label height
  const totalTrackH = (collapsed.video ? labelH : vH) + (collapsed.audio ? labelH : aH) + (collapsed.subtitle ? labelH : sH) + (collapsed.overlay ? labelH : oH);
  const trackHeight = hasClips ? 28 + totalTrackH : 60;
  const videoTop = 28;
  const audioTop = videoTop + (collapsed.video ? labelH : vH);
  const subtitleTop = audioTop + (collapsed.audio ? labelH : aH);
  const overlayTop = subtitleTop + (collapsed.subtitle ? labelH : sH);

  return (
    <div
      ref={timelineRef}
      className="relative overflow-x-auto overflow-y-hidden cursor-pointer"
      style={{ height: trackHeight }}
      onClick={onTimelineClick}
    >
      {!hasClips ? (
        <div className="flex items-center justify-center h-full text-xs text-[#2a2a35]">
          <Plus className="w-4 h-4 mr-2" /> Add clips to build your timeline
        </div>
      ) : (
        <>
          {/* Track labels (fixed left) */}
          <div className="absolute left-0 top-7 bottom-0 w-14 bg-[#111118] border-r border-[#1e1e28] z-20 flex flex-col">
            {([
              { key: "video", label: "Video", icon: <Film className="w-3 h-3" />, h: vH, color: "teal" },
              { key: "audio", label: "Audio", icon: <Music className="w-3 h-3" />, h: aH, color: "purple" },
              { key: "subtitle", label: "Subs", icon: <Type className="w-3 h-3" />, h: sH, color: "yellow" },
              { key: "overlay", label: "Layers", icon: <Layers className="w-3 h-3" />, h: oH, color: "pink" },
            ] as const).map(track => (
              <div key={track.key} className="flex items-stretch border-b border-[#1e1e28]"
                style={{ height: collapsed[track.key] ? labelH : track.h }}>
                <button onClick={() => toggle(track.key)}
                  className="w-3 flex items-center justify-center text-[#4A4A4A] hover:text-white transition shrink-0">
                  {collapsed[track.key] ? <ChevronRight className="w-2.5 h-2.5" /> : <ChevronDown className="w-2.5 h-2.5" />}
                </button>
                <button onClick={() => setSelectedTrack(track.key as any)}
                  className={`flex-1 flex items-center gap-1 px-0.5 text-[8px] transition ${
                    selectedTrack === track.key ? `text-${track.color}-400 bg-${track.color}-500/5` : "text-[#6E6E6E] hover:text-[#A0A0A0]"
                  }`}>
                  {track.icon}<span>{track.label}</span>
                </button>
              </div>
            ))}
          </div>

          {/* Ruler */}
          <div className="sticky top-0 h-7 bg-[#111118] border-b border-[#1e1e28] z-10 pointer-events-none" style={{ width: tlWidth, marginLeft: 56 }}>
            {totalDur > 0 && (
              <div ref={progressBarRef} className="absolute bottom-0 left-0 h-[2px] bg-teal-500/40" style={{ width: currentTime * pxPerSec }} />
            )}
            {(() => {
              const tickInterval = pxPerSec >= 60 ? 1 : pxPerSec >= 20 ? 5 : pxPerSec >= 8 ? 10 : pxPerSec >= 4 ? 30 : 60;
              const tickCount = Math.ceil(totalDur / tickInterval) + 2;
              return Array.from({ length: tickCount }, (_, i) => {
                const sec = i * tickInterval;
                return (
                  <div key={sec} className="absolute top-0" style={{ left: sec * pxPerSec }}>
                    <div className="w-px h-3 bg-[#2a2a35]" />
                    <span className="text-[9px] text-[#4A4A4A] ml-1 select-none">{formatTime(sec)}</span>
                    {pxPerSec >= 60 && (
                      <div className="absolute top-0 w-px h-2 bg-[#1e1e28]" style={{ left: pxPerSec / 2 }} />
                    )}
                  </div>
                );
              });
            })()}
          </div>

          {/* Video Track */}
          {!collapsed.video && <div className={`absolute left-14 flex items-stretch gap-2 px-3 py-2 border-b border-[#1e1e28] ${selectedTrack === "video" ? "bg-teal-500/[0.02]" : ""}`} style={{ width: tlWidth, top: videoTop, height: vH }}>
            {videoClips.map(clip => {
              const vd = getVisDur(clip);
              const w = vd * pxPerSec;
              const isSel = clip.id === selectedClipId;
              return (
                <div key={clip.id} data-clip draggable onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, clip.id)} onDragEnd={onDragEnd}
                  onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("video"); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("video"); setClipContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); }}
                  className={`relative shrink-0 rounded-xl overflow-hidden transition cursor-grab active:cursor-grabbing ${
                    isSel ? "ring-[3px] ring-teal-400 shadow-lg shadow-teal-500/30" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"
                  } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                  style={{ width: Math.max(w, 36), height: "100%" }}>
                  {clip.type === "video" && (
                    <video src={clip.src} className="absolute inset-0 w-full h-full object-cover" muted preload="metadata"
                      onLoadedMetadata={(e) => { (e.target as HTMLVideoElement).currentTime = clip.trimStart + 0.5; }} />
                  )}
                  {clip.type === "image" && (
                    <img src={clip.src} className="absolute inset-0 w-full h-full object-cover" alt="" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/30" />
                  <div className="absolute top-2 left-2 flex items-center gap-1">
                    <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-md ${clip.type === "video" ? "bg-emerald-600/90" : "bg-purple-600/90"} text-white shadow-sm`}>
                      {clip.type === "video" ? "VIDEO" : "IMAGE"}
                    </span>
                    {clip.src.startsWith("blob:") && (
                      <span className="text-[7px] font-medium px-1 py-0.5 rounded bg-amber-500/80 text-white shadow-sm" title="Unsaved — right-click to save">UNSAVED</span>
                    )}
                  </div>
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="text-[10px] text-white/90 font-medium truncate">{clip.name}</span>
                      {clip.blendMode && clip.blendMode !== "normal" && (
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-orange-500/80 text-white shrink-0">{clip.blendMode.toUpperCase()}</span>
                      )}
                      {clip.opacity != null && clip.opacity < 100 && (
                        <span className="text-[7px] font-bold px-1 py-0.5 rounded bg-white/20 text-white shrink-0">{clip.opacity}%</span>
                      )}
                    </div>
                    <span className="text-[9px] text-white/50 shrink-0 ml-1 bg-black/40 px-1.5 py-0.5 rounded">{formatTime(vd)}</span>
                  </div>
                  {showRangeCut && isSel && (() => {
                    const rcVd = getVisDur(clip); const rcStartPct = (rangeCutStart / rcVd) * 100; const rcEndPct = (rangeCutEnd / rcVd) * 100;
                    return <div className="absolute top-0 bottom-0 bg-red-500/25 z-20 pointer-events-none" style={{ left: `${rcStartPct}%`, width: `${rcEndPct - rcStartPct}%` }} />;
                  })()}
                  {!showRangeCut && (<>
                    <div className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-teal-400/0 group-hover/t:bg-teal-400 transition rounded-l-xl flex items-center justify-center"><div className="w-0.5 h-8 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-teal-400/0 group-hover/t:bg-teal-400 transition rounded-r-xl flex items-center justify-center"><div className="w-0.5 h-8 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                    </div>
                  </>)}
                </div>
              );
            })}
          </div>}

          {/* Audio Track */}
          {!collapsed.audio && <div className={`absolute left-14 flex items-stretch gap-2 px-3 py-2 border-b border-[#1e1e28] ${selectedTrack === "audio" ? "bg-purple-500/[0.02]" : ""}`} style={{ width: tlWidth, top: audioTop, height: aH }}>
            {audioClips.map(clip => {
              const vd = getVisDur(clip);
              const w = vd * pxPerSec;
              const isSel = clip.id === selectedClipId;
              return (
                <div key={clip.id} data-clip draggable onDragStart={(e) => onDragStart(e, clip.id)} onDragOver={onDragOver} onDrop={(e) => onDrop(e, clip.id)} onDragEnd={onDragEnd}
                  onClick={(e) => { e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("audio"); }}
                  onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedClipId(clip.id); setSelectedTrack("audio"); setClipContextMenu({ x: e.clientX, y: e.clientY, clipId: clip.id }); }}
                  className={`relative shrink-0 rounded-xl overflow-hidden transition cursor-grab active:cursor-grabbing ${
                    isSel ? "ring-[3px] ring-purple-400 shadow-lg shadow-purple-500/30" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"
                  } ${draggedClipId === clip.id ? "opacity-30" : ""}`}
                  style={{ width: Math.max(w, 36), height: "100%" }}>
                  <div className="absolute inset-0 bg-gradient-to-r from-[#0f1a2a] to-[#1a1a30] flex items-center justify-center">
                    <Music className="w-5 h-5 text-purple-500/30" />
                  </div>
                  <div className="absolute top-1.5 left-2">
                    <span className="text-[8px] font-bold px-1.5 py-0.5 rounded-md bg-purple-600/90 text-white shadow-sm">AUDIO</span>
                  </div>
                  <div className="absolute bottom-1.5 left-2 right-2 flex items-center justify-between">
                    <span className="text-[9px] text-white/90 font-medium truncate">{clip.name}</span>
                    <span className="text-[8px] text-white/50 shrink-0 ml-1 bg-black/40 px-1 py-0.5 rounded">{formatTime(vd)}</span>
                  </div>
                  {showRangeCut && isSel && (() => {
                    const rcVd = getVisDur(clip); const rcStartPct = (rangeCutStart / rcVd) * 100; const rcEndPct = (rangeCutEnd / rcVd) * 100;
                    return <div className="absolute top-0 bottom-0 bg-red-500/25 z-20 pointer-events-none" style={{ left: `${rcStartPct}%`, width: `${rcEndPct - rcStartPct}%` }} />;
                  })()}
                  {!showRangeCut && (<>
                    <div className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "left")}>
                      <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-purple-400/0 group-hover/t:bg-purple-400 transition rounded-l-xl flex items-center justify-center"><div className="w-0.5 h-6 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                    </div>
                    <div className="absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 group/t" onMouseDown={(e) => onTrimDown(e, clip.id, "right")}>
                      <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-purple-400/0 group-hover/t:bg-purple-400 transition rounded-r-xl flex items-center justify-center"><div className="w-0.5 h-6 bg-white/0 group-hover/t:bg-white/80 rounded-full transition" /></div>
                    </div>
                  </>)}
                </div>
              );
            })}
          </div>}

          {/* Subtitle Track */}
          {!collapsed.subtitle && <div className={`absolute left-14 px-3 py-1 border-b border-[#1e1e28] ${selectedTrack === "subtitle" ? "bg-yellow-500/[0.02]" : ""}`} style={{ width: tlWidth, top: subtitleTop, height: sH }}>
            {subtitleClips.map(sub => {
              const x = sub.startTime * pxPerSec;
              const w = (sub.endTime - sub.startTime) * pxPerSec;
              const isSel = sub.id === selectedSubtitleId;
              return (
                <div key={sub.id}
                  className={`absolute top-1 bottom-1 rounded-lg cursor-pointer transition ${isSel ? "ring-2 ring-yellow-400 shadow-lg shadow-yellow-500/20" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"}`}
                  style={{ left: x, width: Math.max(w, 30) }}
                  onClick={(e) => { e.stopPropagation(); setSelectedSubtitleId(sub.id); setSelectedTrack("subtitle"); }}
                >
                  <div className="h-full bg-gradient-to-r from-yellow-900/40 to-yellow-800/20 rounded-lg px-2 flex items-center overflow-hidden">
                    <span className="text-[9px] text-yellow-200/80 truncate">{sub.text}</span>
                  </div>
                </div>
              );
            })}
            {selectedTrack === "subtitle" && subtitleClips.length === 0 && (
              <div className="flex items-center justify-center h-full text-[10px] text-[#2a2a35]">
                <Plus className="w-3 h-3 mr-1" /> Click "Add Sub" to add subtitles
              </div>
            )}
          </div>}

          {/* Overlay Track */}
          {!collapsed.overlay && <div className={`absolute left-14 px-3 py-1 border-b border-[#1e1e28] ${selectedTrack === "overlay" ? "bg-pink-500/[0.02]" : ""}`} style={{ width: tlWidth, top: overlayTop, height: oH }}>
            {overlayLayers.map(layer => {
              const x = layer.startTime * pxPerSec;
              const w = (layer.endTime - layer.startTime) * pxPerSec;
              const isSel = layer.id === selectedOverlayId;
              const label = layer.type === "text" ? (layer.text || "Text") : layer.type === "video" ? "Video" : layer.type === "shape" ? (layer.shapeType || "Shape") : layer.type === "image-strip" ? "Strip" : "Scroll";
              return (
                <div key={layer.id}
                  className={`absolute top-1 bottom-1 rounded-lg cursor-pointer transition ${isSel ? "ring-2 ring-pink-400 shadow-lg shadow-pink-500/20" : "ring-1 ring-[#2a2a35] hover:ring-[#4A4A4A]"}`}
                  style={{ left: x, width: Math.max(w, 40) }}
                  onClick={(e) => { e.stopPropagation(); setSelectedOverlayId(layer.id); setSelectedTrack("overlay"); }}
                >
                  <div className={`h-full rounded-lg px-2 flex items-center gap-1.5 overflow-hidden ${
                    layer.type === "text" ? "bg-gradient-to-r from-pink-900/40 to-pink-800/20" :
                    layer.type === "video" ? "bg-gradient-to-r from-violet-900/40 to-violet-800/20" :
                    layer.type === "shape" ? "bg-gradient-to-r from-cyan-900/40 to-cyan-800/20" :
                    "bg-gradient-to-r from-orange-900/40 to-orange-800/20"
                  }`}>
                    {layer.type === "text" ? <ALargeSmall className="w-3 h-3 text-pink-400/70 shrink-0" /> :
                     layer.type === "video" ? <Film className="w-3 h-3 text-violet-400/70 shrink-0" /> :
                     layer.type === "shape" ? <Square className="w-3 h-3 text-cyan-400/70 shrink-0" /> :
                     <Layers className="w-3 h-3 text-orange-400/70 shrink-0" />}
                    <span className="text-[9px] text-white/70 truncate">{label}</span>
                  </div>
                </div>
              );
            })}
            {selectedTrack === "overlay" && overlayLayers.length === 0 && (
              <div className="flex items-center justify-center h-full text-[10px] text-[#2a2a35]">
                <Plus className="w-3 h-3 mr-1" /> Use controls above to add overlays
              </div>
            )}
          </div>}

          {/* Playhead */}
          <div ref={playheadRef} className="absolute top-0 bottom-0 z-30" style={{ left: currentTime * pxPerSec + 56 }}>
            <div
              className="absolute top-0 left-1/2 -translate-x-1/2 cursor-grab active:cursor-grabbing pointer-events-auto"
              onMouseDown={(e) => {
                e.stopPropagation();
                const startX = e.clientX;
                const startTime = currentTime;
                const onMove = (me: MouseEvent) => {
                  const dt = (me.clientX - startX) / pxPerSec;
                  const newTime = Math.max(0, Math.min(totalDur, startTime + dt));
                  setCurrentTime(newTime);
                  if (playing) {
                    playStart.current = { realTime: performance.now(), offset: newTime };
                    syncPreview(newTime);
                  }
                };
                const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                window.addEventListener("mousemove", onMove);
                window.addEventListener("mouseup", onUp);
              }}
            >
              <div className="w-0 h-0 border-l-[7px] border-r-[7px] border-t-[9px] border-l-transparent border-r-transparent border-t-red-500" />
            </div>
            <div className="absolute top-[9px] left-1/2 -translate-x-1/2 w-px bg-red-500 pointer-events-none" style={{ height: "calc(50% - 9px)" }} />
            <button
              onClick={(e) => { e.stopPropagation(); splitClip(); }}
              className="absolute left-1/2 -translate-x-1/2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-400 hover:scale-110 transition shadow-[0_0_10px_rgba(239,68,68,0.4)] pointer-events-auto z-10 border-2 border-red-400/50"
              title="Split here (S)"
            >
              <Scissors className="w-4 h-4 text-white" />
            </button>
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-px bg-red-500 pointer-events-none" style={{ height: "calc(50% - 13px)" }} />
          </div>
        </>
      )}

      {/* Range Cut needles */}
      {showRangeCut && sel && (() => {
        const rcVd = getVisDur(sel);
        let clipOffset = 0;
        for (const c of clips) {
          if (c.id === sel.id) break;
          clipOffset += getVisDur(c) * pxPerSec + 8;
        }
        const rcStartX = clipOffset + (rangeCutStart / rcVd) * (getVisDur(sel) * pxPerSec) + 56 + 12;
        const rcEndX = clipOffset + (rangeCutEnd / rcVd) * (getVisDur(sel) * pxPerSec) + 56 + 12;

        const makeDrag = (side: "start" | "end") => (e: React.MouseEvent) => {
          e.stopPropagation();
          const clipW = getVisDur(sel) * pxPerSec;
          const clipLeft = clipOffset + 56 + 12;
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
          window.addEventListener("mousemove", onMove);
          window.addEventListener("mouseup", onUp);
        };

        return (
          <>
            <div className="absolute top-0 bottom-0 z-30" style={{ left: rcStartX }}>
              <div className="absolute top-0 bottom-[9px] left-1/2 -translate-x-1/2 w-px bg-green-400 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-green-400 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto" onMouseDown={makeDrag("start")} />
            </div>
            <div className="absolute top-0 bottom-0 z-30" style={{ left: rcEndX }}>
              <div className="absolute top-0 bottom-[9px] left-1/2 -translate-x-1/2 w-px bg-red-400 pointer-events-none" />
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[7px] border-r-[7px] border-b-[9px] border-l-transparent border-r-transparent border-b-red-400 pointer-events-none" />
              <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 cursor-ew-resize pointer-events-auto" onMouseDown={makeDrag("end")} />
            </div>
            <div className="absolute z-30 flex items-center justify-center pointer-events-none" style={{ left: rcStartX, width: rcEndX - rcStartX, top: "50%", transform: "translateY(-50%)" }}>
              <button onClick={(e) => { e.stopPropagation(); applyRangeCut(); }}
                className="pointer-events-auto px-5 py-2 bg-red-500/90 hover:bg-red-500 text-white text-xs font-bold rounded-full shadow-lg shadow-red-500/30 transition border border-red-400/50">
                CUT
              </button>
            </div>
          </>
        );
      })()}
    </div>
  );
}
