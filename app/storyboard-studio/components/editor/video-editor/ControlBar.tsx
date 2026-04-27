"use client";

import React from "react";
import {
  Scissors, Trash2, Clock, Music, Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, Plus, Loader2, Type,
  Layers, Square, ALargeSmall, Circle, Minus, ArrowUpRight, Image as ImageIcon, Film as FilmIcon,
} from "lucide-react";
import { TimelineClip, SubtitleClip, OverlayLayer, BLEND_MODES, BlendMode, OVERLAY_FONTS, formatTime } from "./types";

interface ControlBarProps {
  sel: TimelineClip | undefined;
  selectedTrack: "video" | "audio" | "subtitle" | "overlay";
  splitClip: () => void;
  removeClip: (id: string) => void;
  showRangeCut: boolean;
  setShowRangeCut: (v: boolean) => void;
  openRangeCut: () => void;
  extractAudioFromVideo: (clip: TimelineClip) => Promise<void>;
  extracting: boolean;
  setVideoClips: React.Dispatch<React.SetStateAction<TimelineClip[]>>;
  playing: boolean;
  toggle: () => void;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  totalDur: number;
  timeDisplayRef: React.RefObject<HTMLSpanElement | null>;
  pxPerSec: number;
  setPxPerSec: React.Dispatch<React.SetStateAction<number>>;
  timelineRef: React.RefObject<HTMLDivElement | null>;
  subtitleClips: SubtitleClip[];
  setSubtitleClips: React.Dispatch<React.SetStateAction<SubtitleClip[]>>;
  selectedSubtitleId: string | null;
  setSelectedSubtitleId: (id: string | null) => void;
  overlayLayers: OverlayLayer[];
  setOverlayLayers: React.Dispatch<React.SetStateAction<OverlayLayer[]>>;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  bgColor: string;
  setBgColor: (c: string) => void;
  mediaFiles: any[];
}

export function ControlBar({
  sel, selectedTrack, splitClip, removeClip, showRangeCut, setShowRangeCut, openRangeCut,
  extractAudioFromVideo, extracting, setVideoClips,
  playing, toggle, currentTime, setCurrentTime, totalDur,
  timeDisplayRef, pxPerSec, setPxPerSec, timelineRef,
  subtitleClips, setSubtitleClips, selectedSubtitleId, setSelectedSubtitleId,
  overlayLayers, setOverlayLayers, selectedOverlayId, setSelectedOverlayId,
  bgColor, setBgColor, mediaFiles,
}: ControlBarProps) {
  const selSub = subtitleClips.find(s => s.id === selectedSubtitleId);
  const selOverlay = overlayLayers.find(l => l.id === selectedOverlayId);

  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2.5 border-b border-[#1e1e28]">
      {/* Left: clip actions */}
      <div className="flex items-center gap-1 absolute left-4">
        {sel && (
          <>
            <button onClick={splitClip} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-white hover:bg-[#1a1a24] rounded transition">
              <Scissors className="w-3.5 h-3.5" /> Split
            </button>
            {(sel.type === "video" || sel.type === "audio") && (
              <button onClick={() => showRangeCut ? setShowRangeCut(false) : openRangeCut()} className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition ${showRangeCut ? 'text-teal-400 bg-teal-500/10' : 'text-[#A0A0A0] hover:text-white hover:bg-[#1a1a24]'}`}>
                <Scissors className="w-3.5 h-3.5" /> Range Cut
              </button>
            )}
            {sel.type === "image" && (
              <div className="flex items-center gap-0.5 px-2.5 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded-full text-[10px] text-[#A0A0A0]">
                <Clock className="w-3 h-3 text-teal-500" />
                <input type="number" min={1} max={30} value={sel.duration}
                  onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, duration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)), originalDuration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)) }))}
                  className="w-7 px-0 py-0 bg-transparent border-none text-[10px] text-white text-center outline-none" />
                <span>s</span>
              </div>
            )}
            {sel.type === "video" && (
              <button onClick={() => extractAudioFromVideo(sel)} disabled={extracting}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-teal-400 hover:bg-teal-500/10 rounded transition disabled:opacity-50">
                {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
                {extracting ? "Extracting..." : "Extract Audio"}
              </button>
            )}
            {(sel.type === "video" || sel.type === "image") && (
              <select
                value={sel.blendMode || "normal"}
                onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, blendMode: e.target.value as BlendMode }))}
                className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] hover:text-white outline-none cursor-pointer"
                title="Blend mode"
              >
                {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            )}
            {(sel.type === "video" || sel.type === "image") && (
              <div className="flex items-center gap-1 px-1.5 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded text-[10px] text-[#A0A0A0]">
                <input
                  type="range" min={0} max={100} value={sel.opacity ?? 100}
                  onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, opacity: parseInt(e.target.value) }))}
                  className="w-12 h-1 accent-teal-500 cursor-pointer"
                  title={`Opacity: ${sel.opacity ?? 100}%`}
                />
                <span className="w-6 text-center tabular-nums">{sel.opacity ?? 100}%</span>
              </div>
            )}
            <button onClick={() => removeClip(sel.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </>
        )}

        {/* Subtitle controls */}
        {selectedTrack === "subtitle" && (
          <>
            <button
              onClick={() => {
                const newSub: SubtitleClip = {
                  id: `sub-${Date.now()}`,
                  text: "Subtitle text",
                  startTime: currentTime,
                  endTime: Math.min(currentTime + 3, totalDur || currentTime + 3),
                  position: "bottom",
                  fontSize: 32,
                  fontColor: "#FFFFFF",
                  backgroundColor: "#00000080",
                  fontWeight: "normal",
                };
                setSubtitleClips(p => [...p, newSub]);
                setSelectedSubtitleId(newSub.id);
              }}
              className="flex items-center gap-1 px-2 py-1 text-[10px] text-yellow-400 hover:bg-yellow-500/10 rounded transition"
            >
              <Plus className="w-3.5 h-3.5" /> Add Sub
            </button>
            {selSub && (
              <>
                <input
                  value={selSub.text}
                  onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, text: e.target.value }))}
                  className="px-2 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none w-32"
                  placeholder="Subtitle text..."
                />
                <select
                  value={selSub.position}
                  onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, position: e.target.value as "top" | "center" | "bottom" }))}
                  className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
                <select
                  value={selSub.fontWeight}
                  onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, fontWeight: e.target.value as "normal" | "bold" }))}
                  className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer"
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
                <input
                  type="color" value={selSub.fontColor}
                  onChange={(e) => setSubtitleClips(p => p.map(s => s.id !== selSub.id ? s : { ...s, fontColor: e.target.value }))}
                  className="w-5 h-5 rounded cursor-pointer border-none"
                  title="Font color"
                />
                <button
                  onClick={() => { setSubtitleClips(p => p.filter(s => s.id !== selSub.id)); setSelectedSubtitleId(null); }}
                  className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </>
            )}
          </>
        )}

        {/* Overlay controls */}
        {selectedTrack === "overlay" && (() => {
          const patch = (id: string, p: Partial<OverlayLayer>) => setOverlayLayers(prev => prev.map(l => l.id !== id ? l : { ...l, ...p }));
          const add = (layer: OverlayLayer) => { setOverlayLayers(p => [...p, layer]); setSelectedOverlayId(layer.id); };
          const end = Math.min(currentTime + 5, totalDur || currentTime + 5);
          const R2 = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
          const btnCls = "flex items-center gap-1 px-1.5 py-1 text-[10px] rounded transition hover:bg-white/5";
          return (
            <>
              {/* Add buttons */}
              <button onClick={() => add({ id: `ol-${Date.now()}-t`, type: "text", startTime: currentTime, endTime: end, x: 672, y: 40, w: 576, h: 60, text: "Label", fontSize: 48, fontColor: "#FFFFFF", backgroundColor: "#FF00FF", borderRadius: 8, fontWeight: "bold" })}
                className={`${btnCls} text-pink-400`}><ALargeSmall className="w-3 h-3" /> Text</button>
              <button onClick={() => add({ id: `ol-${Date.now()}-r`, type: "shape", startTime: currentTime, endTime: end, x: 48, y: 48, w: 1824, h: 984, shapeType: "rectangle", strokeColor: "#FF00FF", strokeWidth: 4 })}
                className={`${btnCls} text-cyan-400`}><Square className="w-3 h-3" /> Rect</button>
              <button onClick={() => add({ id: `ol-${Date.now()}-c`, type: "shape", startTime: currentTime, endTime: end, x: 860, y: 440, w: 200, h: 200, shapeType: "circle", strokeColor: "#FF00FF", strokeWidth: 3 })}
                className={`${btnCls} text-cyan-400`}><Circle className="w-3 h-3" /> Circle</button>
              <button onClick={() => add({ id: `ol-${Date.now()}-a`, type: "shape", startTime: currentTime, endTime: end, x: 400, y: 500, w: 300, h: 4, shapeType: "arrow", strokeColor: "#FF00FF", strokeWidth: 3, endX: 700, endY: 500 })}
                className={`${btnCls} text-cyan-400`}><ArrowUpRight className="w-3 h-3" /> Arrow</button>
              <button onClick={() => add({ id: `ol-${Date.now()}-l`, type: "shape", startTime: currentTime, endTime: end, x: 400, y: 540, w: 300, h: 4, shapeType: "line", strokeColor: "#FFFFFF", strokeWidth: 2 })}
                className={`${btnCls} text-cyan-400`}><Minus className="w-3 h-3" /> Line</button>
              {mediaFiles.length > 0 && (
                <select value="" onChange={(e) => {
                  if (!e.target.value) return;
                  const [fid, ftype] = e.target.value.split("|");
                  const file = mediaFiles.find((f: any) => f._id === fid);
                  if (!file) return;
                  const src = file.r2Key ? `${R2}/${file.r2Key}` : file.sourceUrl || "";
                  add({ id: `ol-${Date.now()}-m`, type: ftype === "image" ? "image" : "video", startTime: currentTime, endTime: end, x: 96, y: 96, w: 864, h: 486, src, borderRadius: 16, borderWidth: 4, borderColor: "#FF00FF" });
                  e.target.value = "";
                }} className="px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-violet-400 outline-none cursor-pointer max-w-[90px]">
                  <option value="">+ Media</option>
                  {mediaFiles.filter((f: any) => f.fileType === "video" || f.fileType === "image").map((f: any) => (
                    <option key={f._id} value={`${f._id}|${f.fileType}`}>{(f.filename || f.model || "Untitled").slice(0, 20)}</option>
                  ))}
                </select>
              )}
              <div className="flex items-center gap-1 px-1 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded text-[10px] text-[#A0A0A0]" title="Canvas background">
                <span>BG</span>
                <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-4 h-4 rounded cursor-pointer border-none" />
              </div>

              {/* Selected overlay properties */}
              {selOverlay && (
                <>
                  <div className="w-px h-5 bg-[#2a2a35] mx-1" />
                  {/* Text properties */}
                  {selOverlay.type === "text" && (
                    <>
                      <input value={selOverlay.text || ""} onChange={(e) => patch(selOverlay.id, { text: e.target.value })}
                        className="px-1.5 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none w-20" placeholder="Text..." />
                      <select value={selOverlay.fontFamily || "Arial"} onChange={(e) => patch(selOverlay.id, { fontFamily: e.target.value })}
                        className="px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer max-w-[70px]">
                        {OVERLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                      <input type="number" min={12} max={200} value={selOverlay.fontSize || 48} onChange={(e) => patch(selOverlay.id, { fontSize: parseInt(e.target.value) || 48 })}
                        className="w-9 px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none text-center" title="Size" />
                      <select value={selOverlay.fontWeight || "bold"} onChange={(e) => patch(selOverlay.id, { fontWeight: e.target.value })}
                        className="px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer">
                        <option value="normal">Regular</option><option value="bold">Bold</option><option value="lighter">Light</option>
                      </select>
                      <input type="color" value={selOverlay.fontColor || "#FFFFFF"} onChange={(e) => patch(selOverlay.id, { fontColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border-none" title="Text color" />
                      <input type="color" value={selOverlay.backgroundColor || "#FF00FF"} onChange={(e) => patch(selOverlay.id, { backgroundColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border-none" title="Background" />
                      <button onClick={() => patch(selOverlay.id, { backgroundColor: "transparent" })}
                        className={`px-1.5 py-0.5 text-[9px] rounded ${selOverlay.backgroundColor === "transparent" ? "bg-teal-500/20 text-teal-300" : "bg-[#1a1a24] text-[#6E6E6E]"} border border-[#2a2a35]`}>
                        No BG
                      </button>
                      <input type="number" min={0} max={30} value={selOverlay.borderRadius || 0} onChange={(e) => patch(selOverlay.id, { borderRadius: parseInt(e.target.value) || 0 })}
                        className="w-8 px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none text-center" title="Radius" />
                    </>
                  )}
                  {/* Shape properties */}
                  {selOverlay.type === "shape" && (
                    <>
                      <input type="color" value={selOverlay.strokeColor || "#FF00FF"} onChange={(e) => patch(selOverlay.id, { strokeColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border-none" title="Stroke" />
                      <input type="number" min={1} max={20} value={selOverlay.strokeWidth || 4} onChange={(e) => patch(selOverlay.id, { strokeWidth: parseInt(e.target.value) || 4 })}
                        className="w-7 px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none text-center" title="Width" />
                      {(selOverlay.shapeType === "rectangle" || selOverlay.shapeType === "circle") && (
                        <>
                          <input type="color" value={selOverlay.fillColor || "#000000"} onChange={(e) => patch(selOverlay.id, { fillColor: e.target.value })}
                            className="w-5 h-5 rounded cursor-pointer border-none" title="Fill" />
                          <button onClick={() => patch(selOverlay.id, { fillColor: "transparent" })}
                            className={`px-1.5 py-0.5 text-[9px] rounded ${selOverlay.fillColor === "transparent" || !selOverlay.fillColor ? "bg-teal-500/20 text-teal-300" : "bg-[#1a1a24] text-[#6E6E6E]"} border border-[#2a2a35]`}>
                            No Fill
                          </button>
                        </>
                      )}
                      {selOverlay.shapeType === "rectangle" && (
                        <input type="number" min={0} max={100} value={selOverlay.borderRadius || 0} onChange={(e) => patch(selOverlay.id, { borderRadius: parseInt(e.target.value) || 0 })}
                          className="w-8 px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none text-center" title="Corner radius" />
                      )}
                    </>
                  )}
                  {/* Video/Image border */}
                  {(selOverlay.type === "video" || selOverlay.type === "image") && (
                    <>
                      <input type="color" value={selOverlay.borderColor || "#FF00FF"} onChange={(e) => patch(selOverlay.id, { borderColor: e.target.value })}
                        className="w-5 h-5 rounded cursor-pointer border-none" title="Border" />
                      <input type="number" min={0} max={20} value={selOverlay.borderWidth || 0} onChange={(e) => patch(selOverlay.id, { borderWidth: parseInt(e.target.value) || 0 })}
                        className="w-7 px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none text-center" title="Border width" />
                      <input type="number" min={0} max={50} value={selOverlay.borderRadius || 0} onChange={(e) => patch(selOverlay.id, { borderRadius: parseInt(e.target.value) || 0 })}
                        className="w-8 px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-white outline-none text-center" title="Corner radius" />
                    </>
                  )}
                  <button onClick={() => { setOverlayLayers(p => p.filter(l => l.id !== selOverlay.id)); setSelectedOverlayId(null); }}
                    className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </>
              )}
            </>
          );
        })()}
      </div>

      {/* Center: playback */}
      <div className="flex items-center gap-3">
        <button onClick={() => setCurrentTime(0)} className="p-1 text-[#6E6E6E] hover:text-white transition"><SkipBack className="w-4 h-4" /></button>
        <button onClick={toggle} className="w-10 h-10 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition shadow-lg">
          {playing ? <Pause className="w-4.5 h-4.5 text-black" /> : <Play className="w-4.5 h-4.5 text-black ml-0.5" />}
        </button>
        <button onClick={() => setCurrentTime(totalDur)} className="p-1 text-[#6E6E6E] hover:text-white transition"><SkipForward className="w-4 h-4" /></button>
      </div>

      {/* Right: time + zoom */}
      <div className="flex items-center gap-3 absolute right-4">
        <span ref={timeDisplayRef} className="text-[11px] text-[#6E6E6E] font-mono">{formatTime(currentTime)} / {formatTime(totalDur)}</span>
        <div className="flex items-center gap-1.5">
          <ZoomOut className="w-3 h-3 text-[#4A4A4A]" />
          <input
            type="range" min={2} max={300} value={pxPerSec}
            onChange={(e) => setPxPerSec(parseInt(e.target.value))}
            className="w-20 h-1 accent-teal-500 cursor-pointer"
          />
          <ZoomIn className="w-3 h-3 text-[#4A4A4A]" />
          <button
            onClick={() => { if (timelineRef.current && totalDur > 0) setPxPerSec(Math.max(2, Math.floor((timelineRef.current.clientWidth - 80) / totalDur))); }}
            className="px-3 py-1 text-[10px] font-semibold text-[#A0A0A0] hover:text-white bg-[#1a1a24] border border-[#2a2a35] rounded-full hover:border-teal-500/50 hover:bg-teal-500/10 transition"
          >
            Fit
          </button>
        </div>
      </div>
    </div>
  );
}
