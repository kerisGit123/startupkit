"use client";

import React from "react";
import {
  Scissors, Trash2, Clock, Music, Play, Pause, SkipBack, SkipForward,
  ZoomIn, ZoomOut, Loader2, Layers, Undo2, Redo2,
} from "lucide-react";
import { TimelineClip, BLEND_MODES, BlendMode, formatTime } from "./types";

interface ControlBarProps {
  sel: TimelineClip | undefined;
  selectedTrack: "video" | "audio" | "overlay";
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
  showLayerPanel: boolean;
  setShowLayerPanel: (v: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

export function ControlBar({
  sel, selectedTrack, splitClip, removeClip, showRangeCut, setShowRangeCut, openRangeCut,
  extractAudioFromVideo, extracting, setVideoClips,
  playing, toggle, currentTime, setCurrentTime, totalDur,
  timeDisplayRef, pxPerSec, setPxPerSec, timelineRef,
  showLayerPanel, setShowLayerPanel, undo, redo, canUndo, canRedo,
}: ControlBarProps) {
  return (
    <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-[#1e1e28] relative">
      {/* Left: undo/redo + clip actions */}
      <div className="flex items-center gap-1 absolute left-4">
        <button onClick={undo} disabled={!canUndo} className="p-1 text-[#6E6E6E] hover:text-white transition disabled:opacity-20" title="Undo (Ctrl+Z)"><Undo2 className="w-3.5 h-3.5" /></button>
        <button onClick={redo} disabled={!canRedo} className="p-1 text-[#6E6E6E] hover:text-white transition disabled:opacity-20" title="Redo (Ctrl+Shift+Z)"><Redo2 className="w-3.5 h-3.5" /></button>
        <div className="w-px h-4 bg-[#2a2a35] mx-1" />
        {sel && (
          <>
            <button onClick={splitClip} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-white hover:bg-[#1a1a24] rounded transition">
              <Scissors className="w-3.5 h-3.5" /> Split
            </button>
            {(sel.type === "video" || sel.type === "audio") && (
              <button onClick={() => showRangeCut ? setShowRangeCut(false) : openRangeCut()} className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition ${showRangeCut ? 'text-teal-400 bg-teal-500/10' : 'text-[#A0A0A0] hover:text-white hover:bg-[#1a1a24]'}`}>
                <Scissors className="w-3.5 h-3.5" /> Range
              </button>
            )}
            {sel.type === "image" && (
              <div className="flex items-center gap-0.5 px-2 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded-full text-[10px] text-[#A0A0A0]">
                <Clock className="w-3 h-3 text-teal-500" />
                <input type="number" min={1} max={30} value={sel.duration}
                  onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, duration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)), originalDuration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)) }))}
                  className="w-7 bg-transparent border-none text-[10px] text-white text-center outline-none" />
                <span>s</span>
              </div>
            )}
            {sel.type === "video" && (
              <button onClick={() => extractAudioFromVideo(sel)} disabled={extracting}
                className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-teal-400 hover:bg-teal-500/10 rounded transition disabled:opacity-50">
                {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
              </button>
            )}
            {(sel.type === "video" || sel.type === "image") && (
              <>
                <select value={sel.blendMode || "normal"}
                  onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, blendMode: e.target.value as BlendMode }))}
                  className="px-1 py-1 text-[10px] bg-[#1a1a24] border border-[#2a2a35] rounded text-[#A0A0A0] outline-none cursor-pointer">
                  {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex items-center gap-1 px-1 py-1 bg-[#1a1a24] border border-[#2a2a35] rounded text-[10px] text-[#A0A0A0]">
                  <input type="range" min={0} max={100} value={sel.opacity ?? 100}
                    onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, opacity: parseInt(e.target.value) }))}
                    className="w-10 h-1 accent-teal-500 cursor-pointer" />
                  <span className="w-5 text-center tabular-nums text-[9px]">{sel.opacity ?? 100}%</span>
                </div>
              </>
            )}
            <button onClick={() => removeClip(sel.id)} className="flex items-center gap-1 px-2 py-1 text-[10px] text-[#A0A0A0] hover:text-red-400 hover:bg-red-500/10 rounded transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Center: playback */}
      <div className="flex items-center gap-2">
        <button onClick={() => setCurrentTime(0)} className="p-1 text-[#6E6E6E] hover:text-white transition"><SkipBack className="w-3.5 h-3.5" /></button>
        <button onClick={toggle} className="w-9 h-9 rounded-full bg-white flex items-center justify-center hover:bg-gray-200 transition shadow-lg">
          {playing ? <Pause className="w-4 h-4 text-black" /> : <Play className="w-4 h-4 text-black ml-0.5" />}
        </button>
        <button onClick={() => setCurrentTime(totalDur)} className="p-1 text-[#6E6E6E] hover:text-white transition"><SkipForward className="w-3.5 h-3.5" /></button>
      </div>

      {/* Right: time + zoom + layer panel toggle */}
      <div className="flex items-center gap-2 absolute right-4">
        <span ref={timeDisplayRef} className="text-[10px] text-[#6E6E6E] font-mono">{formatTime(currentTime)} / {formatTime(totalDur)}</span>
        <div className="flex items-center gap-1">
          <ZoomOut className="w-3 h-3 text-[#4A4A4A]" />
          <input type="range" min={2} max={300} value={pxPerSec} onChange={(e) => setPxPerSec(parseInt(e.target.value))}
            className="w-16 h-1 accent-teal-500 cursor-pointer" />
          <ZoomIn className="w-3 h-3 text-[#4A4A4A]" />
          <button onClick={() => { if (timelineRef.current && totalDur > 0) setPxPerSec(Math.max(2, Math.floor((timelineRef.current.clientWidth - 80) / totalDur))); }}
            className="px-2 py-0.5 text-[9px] font-semibold text-[#A0A0A0] hover:text-white bg-[#1a1a24] border border-[#2a2a35] rounded-full transition">
            Fit
          </button>
        </div>
        <button onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex items-center gap-1 px-2 py-1 text-[10px] rounded transition ${showLayerPanel ? "text-pink-400 bg-pink-500/10" : "text-[#6E6E6E] hover:text-white hover:bg-white/5"}`}>
          <Layers className="w-3.5 h-3.5" /> Layers
        </button>
      </div>
    </div>
  );
}
