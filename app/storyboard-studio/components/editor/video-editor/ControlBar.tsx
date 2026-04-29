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
    <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-(--border-primary) relative">
      {/* Left: undo/redo + clip actions */}
      <div className="flex items-center gap-1 absolute left-4">
        <button onClick={undo} disabled={!canUndo}
          className="p-1 text-(--text-tertiary) hover:text-(--text-primary) transition disabled:opacity-20" title="Undo (Ctrl+Z)">
          <Undo2 className="w-3.5 h-3.5" />
        </button>
        <button onClick={redo} disabled={!canRedo}
          className="p-1 text-(--text-tertiary) hover:text-(--text-primary) transition disabled:opacity-20" title="Redo (Ctrl+Shift+Z)">
          <Redo2 className="w-3.5 h-3.5" />
        </button>
        <div className="w-px h-4 bg-(--border-primary) mx-1" />
        {sel && (
          <>
            <button onClick={splitClip}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 rounded-md transition">
              <Scissors className="w-3.5 h-3.5" /> Split
            </button>
            {(sel.type === "video" || sel.type === "audio") && (
              <button onClick={() => showRangeCut ? setShowRangeCut(false) : openRangeCut()}
                className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition ${showRangeCut ? 'text-(--accent-teal) bg-(--accent-teal)/10' : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5'}`}>
                <Scissors className="w-3.5 h-3.5" /> Range
              </button>
            )}
            {sel.type === "image" && (
              <div className="flex items-center gap-0.5 px-2 py-1 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-[11px] text-(--text-secondary)">
                <Clock className="w-3 h-3 text-(--accent-teal)" />
                <input type="number" min={1} max={30} value={sel.duration}
                  onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, duration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)), originalDuration: Math.max(1, Math.min(30, parseInt(e.target.value) || 3)) }))}
                  className="w-7 bg-transparent border-none text-[11px] text-(--text-primary) text-center outline-none" />
                <span>s</span>
              </div>
            )}
            {sel.type === "video" && (
              <button onClick={() => extractAudioFromVideo(sel)} disabled={extracting}
                className="flex items-center gap-1 px-2 py-1 text-[11px] text-(--text-secondary) hover:text-(--accent-teal) hover:bg-(--accent-teal)/10 rounded-md transition disabled:opacity-50">
                {extracting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Music className="w-3.5 h-3.5" />}
              </button>
            )}
            {(sel.type === "video" || sel.type === "image") && (
              <>
                <select value={sel.blendMode || "normal"}
                  onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, blendMode: e.target.value as BlendMode }))}
                  className="px-1.5 py-1 text-[11px] bg-(--bg-primary) border border-(--border-primary) rounded-lg text-(--text-secondary) outline-none cursor-pointer">
                  {BLEND_MODES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
                <div className="flex items-center gap-1 px-1.5 py-1 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-[11px] text-(--text-secondary)">
                  <input type="range" min={0} max={100} value={sel.opacity ?? 100}
                    onChange={(e) => setVideoClips(p => p.map(c => c.id !== sel.id ? c : { ...c, opacity: parseInt(e.target.value) }))}
                    className="w-12 h-1 accent-[var(--accent-teal)] cursor-pointer" />
                  <span className="w-5 text-center tabular-nums text-[10px]">{sel.opacity ?? 100}%</span>
                </div>
              </>
            )}
            <button onClick={() => removeClip(sel.id)}
              className="flex items-center gap-1 px-2 py-1 text-[11px] text-(--text-secondary) hover:text-red-400 hover:bg-red-500/10 rounded-md transition">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Center: playback */}
      <div className="flex items-center gap-2">
        <button onClick={() => setCurrentTime(0)} className="p-1 text-(--text-tertiary) hover:text-(--text-primary) transition">
          <SkipBack className="w-3.5 h-3.5" />
        </button>
        <button onClick={toggle} className="w-9 h-9 rounded-full bg-(--accent-teal) flex items-center justify-center hover:bg-(--accent-teal)/80 transition shadow-lg">
          {playing ? <Pause className="w-4 h-4 text-white" /> : <Play className="w-4 h-4 text-white ml-0.5" />}
        </button>
        <button onClick={() => setCurrentTime(totalDur)} className="p-1 text-(--text-tertiary) hover:text-(--text-primary) transition">
          <SkipForward className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Right: time + zoom + layer panel toggle */}
      <div className="flex items-center gap-2 absolute right-4">
        <span ref={timeDisplayRef} className="text-[11px] text-(--text-tertiary) font-mono tabular-nums">
          {formatTime(currentTime)} / {formatTime(totalDur)}
        </span>
        <div className="flex items-center gap-1">
          <ZoomOut className="w-3 h-3 text-(--text-tertiary)" />
          <input type="range" min={2} max={300} value={pxPerSec} onChange={(e) => setPxPerSec(parseInt(e.target.value))}
            className="w-16 h-1 accent-[var(--accent-teal)] cursor-pointer" />
          <ZoomIn className="w-3 h-3 text-(--text-tertiary)" />
          <button onClick={() => { if (timelineRef.current && totalDur > 0) setPxPerSec(Math.max(2, Math.floor((timelineRef.current.clientWidth - 80) / totalDur))); }}
            className="px-2 py-0.5 text-[10px] font-medium text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-primary) border border-(--border-primary) rounded-md transition">
            Fit
          </button>
        </div>
        <button onClick={() => setShowLayerPanel(!showLayerPanel)}
          className={`flex items-center gap-1 px-2 py-1 text-[11px] rounded-md transition ${showLayerPanel ? "text-pink-400 bg-pink-500/10" : "text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5"}`}>
          <Layers className="w-3.5 h-3.5" /> Layers
        </button>
      </div>
    </div>
  );
}
