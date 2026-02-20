"use client";

import { useRef, useState, useEffect } from "react";
import { ArrowLeft, BookOpen, ChevronDown, ChevronLeft, ChevronRight, Download, Eraser, Eye, EyeOff, GripVertical, Image as ImageIcon, LayoutGrid, Layers, MessageSquare, Move, Paintbrush, Plus, RotateCcw, RotateCw, SlidersHorizontal, Sparkles, Trash2, Type, Upload, Maximize2, X as XIcon, FileText, Archive } from "lucide-react";
import Link from "next/link";

// Note: For proper display of Noto fonts, add Google Fonts import:
// @import url('https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&family=Noto+Serif:wght@400;700&family=Noto+Sans+JP:wght@400;700&family=Noto+Sans+KR:wght@400;700&family=Noto+Sans+SC:wght@400;700&family=Noto+Sans+TC:wght@400;700&family=Noto+Sans+Thai:wght@400;700&family=Roboto:wght@400;700&family=Open+Sans:wght@400;700&family=Montserrat:wght@400;700&family=Playfair+Display:wght@400;700&family=Oswald:wght@400;700&family=Raleway:wght@400;700&display=swap');

type MaskDot = { x: number; y: number; r: number };

type Scene = {
  id: string;
  description: string;
  position: { x: number; y: number; width: number; height: number };
  generated: boolean;
  image?: string;
};

type Panel = {
  id: string;
  pageId: number;
  order: number;
  title: string;
  height: number;
  sizePreset: string;
  characters: string[];
  location: string;
  time: string;
  stageDir: string;
  dialogue: string;
  generationMode: "single" | "multi";
  scenes: Scene[];
};

type BubbleType =
  | "speech"
  | "speechRough"
  | "speechHalftone"
  | "thought"
  | "whisper"
  | "shout"
  | "rect"
  | "rectRound"
  | "oval"
  | "sfx";

type TailMode = "none" | "auto" | "manual";

type TailDir = "bottom-left" | "bottom-right" | "left" | "right";

type FontWeight = "normal" | "bold" | "lighter";
type FontStyle = "normal" | "italic" | "oblique";
type FontFamily = 
  | "Arial" 
  | "Times New Roman" 
  | "Comic Sans MS" 
  | "Impact" 
  | "Verdana" 
  | "Georgia"
  | "Noto Sans"
  | "Noto Serif"
  | "Noto Sans JP"
  | "Noto Sans KR"
  | "Noto Sans SC"
  | "Noto Sans TC"
  | "Noto Sans Thai"
  | "Roboto"
  | "Open Sans"
  | "Montserrat"
  | "Playfair Display"
  | "Oswald"
  | "Raleway";

type Bubble = {
  id: string;
  panelId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tailMode: TailMode;
  tailDir: TailDir;
  tailX: number;
  tailY: number;
  text: string;
  bubbleType: BubbleType;
  autoFitFont: boolean;
  fontSize: number;
  flippedColors?: boolean;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
};

type DragMode =
  | { type: "move"; startX: number; startY: number; origX: number; origY: number }
  | { type: "resize"; handle: "se" | "sw" | "ne" | "nw" | "n" | "s" | "w" | "e"; startX: number; startY: number; orig: Bubble }
  | { type: "tail"; startX: number; startY: number; origTailX: number; origTailY: number }
  | null;

// Unified Transform Controls Component
function TransformControls({ 
  rotation, 
  flipX, 
  flipY, 
  onRotationChange, 
  onFlipXChange, 
  onFlipYChange,
  accentColor = "emerald"
}: {
  rotation: number;
  flipX: boolean;
  flipY: boolean;
  onRotationChange: (value: number) => void;
  onFlipXChange: (value: boolean) => void;
  onFlipYChange: (value: boolean) => void;
  accentColor?: string;
}) {
  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-300 font-semibold">Transform</span>
        <div className="flex gap-1">
          <button
            onClick={() => onRotationChange(0)}
            className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition"
          >
            Reset
          </button>
        </div>
      </div>

      {/* Rotation Control */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-300 font-semibold">Rotation</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onRotationChange(Math.max(-180, rotation - 15))}
              className="w-6 h-6 bg-white/5 hover:bg-white/10 text-gray-300 rounded flex items-center justify-center text-xs transition"
            >
              -15°
            </button>
            <button
              onClick={() => onRotationChange(Math.min(180, rotation + 15))}
              className="w-6 h-6 bg-white/5 hover:bg-white/10 text-gray-300 rounded flex items-center justify-center text-xs transition"
            >
              +15°
            </button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={-180}
            max={180}
            value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
            className={`flex-1 accent-${accentColor}-500`}
          />
          <input
            type="number"
            min={-180}
            max={180}
            value={rotation}
            onChange={(e) => onRotationChange(Number(e.target.value))}
            className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none focus:ring-1 focus:ring-emerald-500/30"
          />
          <span className="text-xs text-gray-400">°</span>
        </div>
      </div>

      {/* Flip Controls */}
      <div>
        <span className="text-xs text-gray-300 font-semibold mb-2 block">Flip & Mirror</span>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onFlipXChange(!flipX)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
              flipX
                ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V8m0 0l3 3m-3-3l-3 3m14 8V8m0 0l-3 3m3-3l3 3" />
            </svg>
            Flip H
          </button>
          <button
            onClick={() => onFlipYChange(!flipY)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 ${
              flipY
                ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7H8m0 0l3 3m-3-3L8 4M8 17h8m0 0l-3-3m3 3l3-3" />
            </svg>
            Flip V
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div>
        <span className="text-xs text-gray-300 font-semibold mb-2 block">Quick Actions</span>
        <div className="grid grid-cols-3 gap-2">
          <button
            onClick={() => { onFlipXChange(false); onFlipYChange(false); onRotationChange(0); }}
            className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition"
          >
            Reset All
          </button>
          <button
            onClick={() => onRotationChange(90)}
            className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition"
          >
            90°
          </button>
          <button
            onClick={() => onRotationChange(-90)}
            className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition"
          >
            -90°
          </button>
        </div>
      </div>
    </div>
  );
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

// Unified Resize Handle Component
function ResizeHandles({ 
  isSelected, 
  onResizeStart,
  onRotateStart,
  accentColor = "emerald"
}: {
  isSelected: boolean;
  onResizeStart: (handle: string, event: React.MouseEvent) => void;
  onRotateStart: (event: React.MouseEvent) => void;
  accentColor?: string;
}) {
  if (!isSelected) return null;

  const handleStyle = "absolute w-3 h-3 rounded-full border-2 border-white cursor-pointer";
  const colorClass = accentColor === "emerald" ? "bg-emerald-500" : accentColor === "purple" ? "bg-purple-500" : "bg-orange-500";
  const shadowColor = accentColor === "emerald" ? "rgba(16,185,129,0.25)" : accentColor === "purple" ? "rgba(147,51,234,0.25)" : "rgba(251,146,60,0.25)";

  return (
    <>
      {/* Corner handles */}
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ top: -6, left: -6, boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "nw-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("nw", e); }}
      />
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ top: -6, right: -6, boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "ne-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("ne", e); }}
      />
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ bottom: -6, left: -6, boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "sw-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("sw", e); }}
      />
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ bottom: -6, right: -6, boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "se-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("se", e); }}
      />
      
      {/* Edge handles */}
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ top: -6, left: "50%", transform: "translateX(-50%)", boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "n-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("n", e); }}
      />
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ bottom: -6, left: "50%", transform: "translateX(-50%)", boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "s-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("s", e); }}
      />
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ top: "50%", left: -6, transform: "translateY(-50%)", boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "w-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("w", e); }}
      />
      <div
        className={`${handleStyle} ${colorClass}`}
        style={{ top: "50%", right: -6, transform: "translateY(-50%)", boxShadow: `0 0 0 2px ${shadowColor}`, cursor: "e-resize" }}
        onMouseDown={(e) => { e.stopPropagation(); onResizeStart("e", e); }}
      />
      
      {/* Rotation handle */}
      <div
        className="absolute w-5 h-5 rounded-full border-2 border-white flex items-center justify-center cursor-pointer"
        style={{ 
          top: "50%", 
          right: -35, 
          transform: "translateY(-50%)", 
          backgroundColor: accentColor === "emerald" ? "#10b981" : accentColor === "purple" ? "#9333ea" : "#f97316",
          boxShadow: `0 0 0 2px ${shadowColor}`,
          cursor: "grab"
        }}
        onMouseDown={(e) => { e.stopPropagation(); onRotateStart(e); }}
      >
        <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
    </>
  );
}


function estimateFontSize(text: string, w: number, h: number) {
  const min = 10;
  const max = 30;
  const area = Math.max(1, w * h);
  const density = text.trim().length / area;
  const raw = Math.round(26 - density * 90000);
  return clamp(raw, min, max);
}

function hashToUnit(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

function jitter(seed: string, idx: number) {
  const a = hashToUnit(`${seed}:${idx}:a`);
  const b = hashToUnit(`${seed}:${idx}:b`);
  return (a * 2 - 1) * 0.6 + (b * 2 - 1) * 0.2;
}

// Ellipse helper: returns SVG ellipse attributes
function bubbleEllipse(w: number, h: number) {
  return { cx: w / 2, cy: h / 2, rx: w * 0.48, ry: h * 0.44 };
}

function roughEllipsePath(w: number, h: number, seed: string) {
  const e = bubbleEllipse(w, h);
  const bumps = 28;
  const amp = Math.max(0.8, Math.min(w, h) * 0.01);

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2;
    const j = jitter(seed, i);
    const rj = 1 + j * 0.28;
    const x = e.cx + Math.cos(t) * (e.rx + amp * j) * rj;
    const y = e.cy + Math.sin(t) * (e.ry + amp * j) * rj;
    pts.push({ x, y });
  }
  const d: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    if (i === 0) d.push(`M ${mx.toFixed(1)} ${my.toFixed(1)}`);
    d.push(`Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`);
  }
  d.push("Z");
  return d.join(" ");
}

// Tail path using quadratic bezier curves.
// Starts slightly INSIDE the ellipse so the fill overlay fully hides the seam.
function tailPath(w: number, h: number, dir: TailDir, tailLen = 28) {
  const e = bubbleEllipse(w, h);
  const len = tailLen;
  const spread = 10; // half-width at base
  const inset = 6; // how far inside the ellipse the path starts, increased to cover seam

  if (dir === "bottom-left") {
    const sx = e.cx - spread;
    const sy = e.cy + e.ry - inset;
    return `M ${sx},${sy} q -${len * 0.2},${len * 1.0} -${len * 0.7},${len * 1.2} q ${len * 0.6},-${len * 0.25} ${len * 0.7 + spread * 2},-${len * 1.2} Z`;
  }
  if (dir === "bottom-right") {
    const sx = e.cx + spread;
    const sy = e.cy + e.ry - inset;
    return `M ${sx},${sy} q ${len * 0.2},${len * 1.0} ${len * 0.7},${len * 1.2} q -${len * 0.6},-${len * 0.25} -${len * 0.7 + spread * 2},-${len * 1.2} Z`;
  }
  if (dir === "left") {
    const sx = e.cx - e.rx + inset;
    const sy = e.cy + spread * 0.4;
    return `M ${sx},${sy} q -${len * 1.0},${len * 0.15} -${len * 1.2},${len * 0.6} q ${len * 0.2},-${len * 0.6} ${len * 1.2},-${len * 0.6 + spread} Z`;
  }
  // right
  const sx = e.cx + e.rx - inset;
  const sy = e.cy + spread * 0.4;
  return `M ${sx},${sy} q ${len * 1.0},${len * 0.15} ${len * 1.2},${len * 0.6} q -${len * 0.2},-${len * 0.6} -${len * 1.2},-${len * 0.6 + spread} Z`;
}

// Rectangle tail: curved bezier tail matching speech bubble style
// Key: tail base starts INSIDE the rect so the filled rect covers the seam
function rectTailPath(w: number, h: number, dir: TailDir, tailLen = 28) {
  const len = tailLen;
  const edge = 4; // rect inset from SVG viewport
  const spread = 10;
  const inset = 8; // how far INSIDE the rect edge the tail base starts

  if (dir === "bottom-left") {
    const cx = w * 0.2; // tail center on bottom edge
    const sx = cx - spread;
    const sy = (h - edge) - inset; // INSIDE rect (above bottom edge)
    return `M ${sx},${sy} q -${len * 0.2},${len * 1.0} -${len * 0.7},${len * 1.2} q ${len * 0.6},-${len * 0.25} ${len * 0.7 + spread * 2},-${len * 1.2} Z`;
  }
  if (dir === "bottom-right") {
    const cx = w * 0.8;
    const sx = cx + spread;
    const sy = (h - edge) - inset; // INSIDE rect
    return `M ${sx},${sy} q ${len * 0.2},${len * 1.0} ${len * 0.7},${len * 1.2} q -${len * 0.6},-${len * 0.25} -${len * 0.7 + spread * 2},-${len * 1.2} Z`;
  }
  if (dir === "left") {
    const sx = edge + inset; // INSIDE rect (right of left edge)
    const sy = h * 0.6 + spread * 0.4;
    return `M ${sx},${sy} q -${len * 1.0},${len * 0.15} -${len * 1.2},${len * 0.6} q ${len * 0.2},-${len * 0.6} ${len * 1.2},-${len * 0.6 + spread} Z`;
  }
  // right
  const sx = (w - edge) - inset; // INSIDE rect (left of right edge)
  const sy = h * 0.6 + spread * 0.4;
  return `M ${sx},${sy} q ${len * 1.0},${len * 0.15} ${len * 1.2},${len * 0.6} q -${len * 0.2},-${len * 0.6} -${len * 1.2},-${len * 0.6 + spread} Z`;
}

function rectOutlinePathWithGap(
  w: number,
  h: number,
  cr: number,
  edge: "bottom" | "left" | "right",
  gapCenter: number,
  gapW: number
) {
  const left = 4;
  const top = 4;
  const right = w - 4;
  const bottom = h - 4;
  const r = Math.max(0, Math.min(cr, (right - left) / 2, (bottom - top) / 2));

  const gapHalf = gapW / 2;

  if (edge === "bottom") {
    const g0 = Math.max(left + r, Math.min(right - r, gapCenter - gapHalf));
    const g1 = Math.max(left + r, Math.min(right - r, gapCenter + gapHalf));
    return [
      `M ${g0} ${bottom}`,
      `H ${left + r}`,
      `Q ${left} ${bottom} ${left} ${bottom - r}`,
      `V ${top + r}`,
      `Q ${left} ${top} ${left + r} ${top}`,
      `H ${right - r}`,
      `Q ${right} ${top} ${right} ${top + r}`,
      `V ${bottom - r}`,
      `Q ${right} ${bottom} ${right - r} ${bottom}`,
      `H ${g1}`,
    ].join(" ");
  }

  if (edge === "left") {
    const g0 = Math.max(top + r, Math.min(bottom - r, gapCenter - gapHalf));
    const g1 = Math.max(top + r, Math.min(bottom - r, gapCenter + gapHalf));
    return [
      `M ${left} ${g0}`,
      `V ${bottom - r}`,
      `Q ${left} ${bottom} ${left + r} ${bottom}`,
      `H ${right - r}`,
      `Q ${right} ${bottom} ${right} ${bottom - r}`,
      `V ${top + r}`,
      `Q ${right} ${top} ${right - r} ${top}`,
      `H ${left + r}`,
      `Q ${left} ${top} ${left} ${top + r}`,
      `V ${g1}`,
    ].join(" ");
  }

  // right
  const g0 = Math.max(top + r, Math.min(bottom - r, gapCenter - gapHalf));
  const g1 = Math.max(top + r, Math.min(bottom - r, gapCenter + gapHalf));
  return [
    `M ${right} ${g1}`,
    `V ${top + r}`,
    `Q ${right} ${top} ${right - r} ${top}`,
    `H ${left + r}`,
    `Q ${left} ${top} ${left} ${top + r}`,
    `V ${bottom - r}`,
    `Q ${left} ${bottom} ${left + r} ${bottom}`,
    `H ${right - r}`,
    `Q ${right} ${bottom} ${right} ${bottom - r}`,
    `V ${g0}`,
  ].join(" ");
}

// Cloud/thought bubble: scalloped edge using arc bumps for proper cloud look
function cloudPath(w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const rx = w * 0.46;
  const ry = h * 0.40;
  const bumps = 14;
  const bumpDepth = Math.min(w, h) * 0.10;

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2;
    pts.push({
      x: cx + Math.cos(t) * rx,
      y: cy + Math.sin(t) * ry,
    });
  }

  const d: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    const nx = mx - cx;
    const ny = my - cy;
    const nl = Math.max(1, Math.hypot(nx, ny));
    const bx = mx + (nx / nl) * bumpDepth;
    const by = my + (ny / nl) * bumpDepth;

    if (i === 0) d.push(`M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`);
    d.push(`Q ${bx.toFixed(1)} ${by.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`);
  }
  d.push("Z");
  return d.join(" ");
}

function burstPoints(w: number, h: number, spikes: number, seed: string, shortSpikes = false) {
  const cx = w / 2;
  const cy = h / 2;
  const rOuter = Math.min(w, h) * (shortSpikes ? 0.48 : 0.50);
  const rInner = Math.min(w, h) * (shortSpikes ? 0.36 : 0.28);

  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const t = (i / (spikes * 2)) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const j = jitter(seed, i);
    const angleJitter = jitter(seed, i + 500) * (shortSpikes ? 0.06 : 0.12);
    const r = (isOuter ? rOuter : rInner) * (1 + j * (shortSpikes ? 0.10 : 0.18));
    const angle = t + angleJitter;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return pts;
}

function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export default function MangaStudioPlaygroundPage() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const assetInputRef = useRef<HTMLInputElement | null>(null);

  const [tool, setTool] = useState<"paint" | "bubble" | "text" | "asset">("paint");
  const [activeTab, setActiveTab] = useState<"layers" | "bubbles" | "text" | "assets" | "paint" | "panel" | "aimanga">("layers");
  const [hiddenObjectIds, setHiddenObjectIds] = useState<Set<string>>(new Set());

  // Episode, Page & Panel management
  const [episodes] = useState([
    { id: 1, number: 1, title: "Episode 1" },
    { id: 2, number: 2, title: "Episode 2" },
  ]);
  const [currentEpisodeId, setCurrentEpisodeId] = useState(1);
  const currentEpisode = episodes.find(e => e.id === currentEpisodeId);

  const [pages, setPages] = useState([
    { id: 1, number: 1, episodeId: 1, status: "drawing" as const, template: "standard-vertical" },
    { id: 2, number: 2, episodeId: 1, status: "queued" as const, template: "standard-vertical" },
    { id: 3, number: 1, episodeId: 2, status: "queued" as const, template: "standard-vertical" },
  ]);
  const [currentPageId, setCurrentPageId] = useState(1);
  const episodePages = pages.filter(p => p.episodeId === currentEpisodeId).sort((a, b) => a.number - b.number);
  const [panels, setPanels] = useState<Panel[]>([
    { id: "panel-1", pageId: 1, order: 0, title: "Opening Shot", height: 600, sizePreset: "standard", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
    { id: "panel-2", pageId: 1, order: 1, title: "Determination", height: 400, sizePreset: "short", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
    { id: "panel-3", pageId: 1, order: 2, title: "Flashback", height: 1000, sizePreset: "tall", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
  ]);
  const [selectedPanelId, setSelectedPanelId] = useState<string | null>("panel-1");
  const [showTimeline, setShowTimeline] = useState(true);
  const [showEpisodeDropdown, setShowEpisodeDropdown] = useState(false);
  const [showPageDropdown, setShowPageDropdown] = useState(false);
  const [canvasViewMode, setCanvasViewMode] = useState<"single" | "fullpage">("single");
  const [panelDetailView, setPanelDetailView] = useState<"simple" | "detailed">("detailed");
  // Zoom & Pan
  const [zoom, setZoom] = useState(1);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStart = useRef({ x: 0, y: 0, ox: 0, oy: 0 });
  // Multi-select & Group
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [groups, setGroups] = useState<Record<string, string[]>>({});
  // Snap guides
  const [snapLines, setSnapLines] = useState<{ x?: number; y?: number }[]>([]);
  // Bubble presets library
  const [bubblePresets, setBubblePresets] = useState<{ id: string; name: string; bubbleType: BubbleType; tailMode: TailMode; tailDir: TailDir; flippedColors?: boolean; fontSize: number; autoFitFont: boolean; w: number; h: number }[]>([]);
  
  // AI Generator and Quick Start states
  const [showAIGenerator, setShowAIGenerator] = useState(false);
  const [showQuickStart, setShowQuickStart] = useState(false);
  const [showExportMenu, setShowExportMenu] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  
  // Multi-scene panel states
  const [generationMode, setGenerationMode] = useState<"single" | "multi">("single");
  const [sceneCount, setSceneCount] = useState(4);
  const [sceneLayout, setSceneLayout] = useState<"grid" | "sequence" | "dynamic">("dynamic");
  const [templateStyle, setTemplateStyle] = useState<"manga" | "storyboard">("manga");
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const refImageInputRef = useRef<HTMLInputElement | null>(null);
  const [aiGenTab, setAiGenTab] = useState<"chars" | "scene" | "props" | "time" | "adv">("chars");

  const currentPage = pages.find(p => p.id === currentPageId);
  const currentPanels = panels.filter(p => p.pageId === currentPageId).sort((a, b) => a.order - b.order);
  const selectedPanel = panels.find(p => p.id === selectedPanelId);

  const panelSizePresets = [
    { id: "short", name: "Short", height: 400, desc: "Action / Close-up" },
    { id: "standard", name: "Standard", height: 600, desc: "Dialogue / Mid-shot" },
    { id: "tall", name: "Tall", height: 1000, desc: "Establishing / Drama" },
    { id: "splash", name: "Splash", height: 1600, desc: "Full-width impact" },
    { id: "custom", name: "Custom", height: 600, desc: "Set your own size" },
  ];

  const addPanel = () => {
    saveHistory();
    const maxOrder = currentPanels.length > 0 ? Math.max(...currentPanels.map(p => p.order)) : -1;
    const id = `panel-${Date.now()}`;
    setPanels(prev => [...prev, {
      id, pageId: currentPageId, order: maxOrder + 1, title: `Panel ${currentPanels.length + 1}`,
      height: 600, sizePreset: "standard", characters: [], location: "", time: "", stageDir: "", dialogue: "",
      generationMode: "single", scenes: [],
    }]);
    setSelectedPanelId(id);
    setActiveTab("panel");
  };

  const duplicatePanel = (panelId: string) => {
    saveHistory();
    const src = panels.find(p => p.id === panelId);
    if (!src) return;
    const maxOrder = currentPanels.length > 0 ? Math.max(...currentPanels.map(p => p.order)) : -1;
    const newId = `panel-${Date.now()}`;
    setPanels(prev => [...prev, { ...src, id: newId, order: maxOrder + 1, title: `${src.title} (copy)` }]);
    // Duplicate bubbles, text, assets for this panel
    const srcBubbles = bubbles.filter(b => b.panelId === panelId);
    const srcTexts = textElements.filter(t => t.panelId === panelId);
    const srcAssets = assetElements.filter(a => a.panelId === panelId);
    if (srcBubbles.length) setBubbles(prev => [...prev, ...srcBubbles.map(b => ({ ...b, id: `bub-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, panelId: newId }))]);
    if (srcTexts.length) setTextElements(prev => [...prev, ...srcTexts.map(t => ({ ...t, id: `txt-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, panelId: newId }))]);
    if (srcAssets.length) setAssetElements(prev => [...prev, ...srcAssets.map(a => ({ ...a, id: `asset-${Date.now()}-${Math.random().toString(36).slice(2,6)}`, panelId: newId }))]);
    // Copy panel image if exists
    if (panelImages[panelId]) setPanelImages(prev => ({ ...prev, [newId]: prev[panelId] }));
    setSelectedPanelId(newId);
  };

  const deletePanel = (id: string) => {
    saveHistory();
    setPanels(prev => prev.filter(p => p.id !== id));
    if (selectedPanelId === id) setSelectedPanelId(currentPanels.find(p => p.id !== id)?.id || null);
  };

  const movePanelOrder = (panelId: string, direction: "up" | "down") => {
    saveHistory();
    const sorted = [...currentPanels];
    const idx = sorted.findIndex(p => p.id === panelId);
    if (idx < 0) return;
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const newPanels = [...panels];
    const a = newPanels.find(p => p.id === sorted[idx].id)!;
    const b = newPanels.find(p => p.id === sorted[swapIdx].id)!;
    const tmp = a.order; a.order = b.order; b.order = tmp;
    setPanels(newPanels);
  };

  // AI Generator Functions
  const handleAIGenerator = () => {
    setShowAIGenerator(true);
    setActiveTab("aimanga");
  };

  const handleQuickStart = () => {
    setShowQuickStart(true);
    // Create a quick template with common panel layout
    const quickTemplatePanels: Panel[] = [
      { id: `panel-${Date.now()}-1`, pageId: currentPageId, order: 0, title: "Opening", height: 800, sizePreset: "standard", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
      { id: `panel-${Date.now()}-2`, pageId: currentPageId, order: 1, title: "Action", height: 600, sizePreset: "short", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
      { id: `panel-${Date.now()}-3`, pageId: currentPageId, order: 2, title: "Dialogue", height: 600, sizePreset: "standard", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
      { id: `panel-${Date.now()}-4`, pageId: currentPageId, order: 3, title: "Closing", height: 800, sizePreset: "tall", characters: [], location: "", time: "", stageDir: "", dialogue: "", generationMode: "single", scenes: [] },
    ];
    
    setPanels(prev => [...prev, ...quickTemplatePanels]);
    setSelectedPanelId(quickTemplatePanels[0].id);
    setActiveTab("panel");
    setShowQuickStart(false);
  };

  const generatePanelContent = async () => {
    if (!aiPrompt.trim() || !selectedPanel) return;
    
    setIsGenerating(true);
    try {
      // Simulate AI generation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      if (generationMode === "single") {
        // Single panel generation
        setPanels(prev => prev.map(p => 
          p.id === selectedPanel.id 
            ? { ...p, dialogue: aiPrompt, stageDir: "AI generated scene", generationMode: "single" as const, scenes: [] }
            : p
        ));
      } else {
        // Multi-scene generation
        const scenes: Scene[] = [];
        const panelWidth = 800;
        const panelHeight = selectedPanel.height;
        
        if (sceneLayout === "grid") {
          // 2x2 grid layout
          const sceneWidth = panelWidth / 2;
          const sceneHeight = panelHeight / 2;
          for (let i = 0; i < Math.min(sceneCount, 4); i++) {
            const row = Math.floor(i / 2);
            const col = i % 2;
            scenes.push({
              id: `scene-${Date.now()}-${i}`,
              description: `${aiPrompt} - Scene ${i + 1}`,
              position: {
                x: col * sceneWidth,
                y: row * sceneHeight,
                width: sceneWidth,
                height: sceneHeight
              },
              generated: false
            });
          }
        } else if (sceneLayout === "sequence") {
          // Horizontal sequence
          const sceneWidth = panelWidth / sceneCount;
          for (let i = 0; i < sceneCount; i++) {
            scenes.push({
              id: `scene-${Date.now()}-${i}`,
              description: `${aiPrompt} - Scene ${i + 1}`,
              position: {
                x: i * sceneWidth,
                y: 0,
                width: sceneWidth,
                height: panelHeight
              },
              generated: false
            });
          }
        } else {
          // Dynamic layout
          scenes.push({
            id: `scene-${Date.now()}-0`,
            description: aiPrompt,
            position: {
              x: 0,
              y: 0,
              width: panelWidth,
              height: panelHeight
            },
            generated: false
          });
        }
        
        setPanels(prev => prev.map(p => 
          p.id === selectedPanel.id 
            ? { ...p, dialogue: aiPrompt, stageDir: "AI generated multi-scene", generationMode: "multi" as const, scenes }
            : p
        ));
      }
      
      setAiPrompt("");
      setShowAIGenerator(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // Switch page and auto-select its first panel
  const switchToPage = (pageId: number) => {
    setCurrentPageId(pageId);
    const pagePanels = panels.filter(p => p.pageId === pageId).sort((a, b) => a.order - b.order);
    setSelectedPanelId(pagePanels.length > 0 ? pagePanels[0].id : null);
  };

  const addPage = () => {
    const epPages = pages.filter(p => p.episodeId === currentEpisodeId);
    const maxNum = epPages.length > 0 ? Math.max(...epPages.map(p => p.number)) : 0;
    const newPageId = Date.now();
    const newPanelId = `panel-${newPageId}`;
    setPages(prev => [...prev, { id: newPageId, number: maxNum + 1, episodeId: currentEpisodeId, status: "queued" as const, template: "standard-vertical" }]);
    setPanels(prev => [...prev, {
      id: newPanelId, pageId: newPageId, order: 0, title: "Panel 1",
      height: 600, sizePreset: "standard", characters: [], location: "", time: "", stageDir: "", dialogue: "",
      generationMode: "single", scenes: [],
    }]);
    setCurrentPageId(newPageId);
    setSelectedPanelId(newPanelId);
  };

  // Panel Builder state
  const [activeBuilderTab, setActiveBuilderTab] = useState("characters");
  const [selectedCharacters, setSelectedCharacters] = useState<string[]>([]);
  const [selectedLocation, setSelectedLocation] = useState("");
  const [selectedTime, setSelectedTime] = useState("");
  const [stageDirection, setStageDirection] = useState("");
  const [dialogue, setDialogue] = useState("");
  const [expandedField, setExpandedField] = useState<"stageDirection" | "dialogue" | null>(null);
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [selectedProps, setSelectedProps] = useState<string[]>([]);
  const [techniqueActive, setTechniqueActive] = useState(false);
  const [weather, setWeather] = useState("");
  const [framing, setFraming] = useState("none");
  const [mangaAngle, setMangaAngle] = useState("none");
  const [inkStyle, setInkStyle] = useState("none");
  const [moodTone, setMoodTone] = useState("none");
  const [styleModel, setStyleModel] = useState("nano-banana");

  // Sync builder fields when selectedPanel changes
  useEffect(() => {
    if (selectedPanel) {
      setSelectedCharacters(selectedPanel.characters || []);
      setSelectedLocation(selectedPanel.location || "");
      setSelectedTime(selectedPanel.time || "");
      setStageDirection(selectedPanel.stageDir || "");
      setDialogue(selectedPanel.dialogue || "");
    }
  }, [selectedPanelId]); // eslint-disable-line react-hooks/exhaustive-deps

  const characters = [
    { id: "kaito", name: "Kaito", avatar: "K" },
    { id: "ryu", name: "Ryu", avatar: "R" },
  ];
  const locations = [
    { id: "basketball-court", name: "Basketball Court", type: "Outdoor", thumbnail: "🏀" },
    { id: "school-hallway", name: "School Hallway", type: "Indoor", thumbnail: "🏫" },
    { id: "kaito-room", name: "Kaito's Room", type: "Indoor", thumbnail: "🛏️" },
    { id: "gym", name: "Training Gym", type: "Indoor", thumbnail: "💪" },
  ];
  const panelBuilderProps = [
    { id: "basketball", name: "Basketball", category: "Sports", thumbnail: "🏀" },
    { id: "backpack", name: "School Backpack", category: "School", thumbnail: "🎒" },
    { id: "water-bottle", name: "Water Bottle", category: "Items", thumbnail: "💧" },
  ];
  const times = [
    { id: "dawn", name: "Dawn" },
    { id: "morning", name: "Morning" },
    { id: "afternoon", name: "Afternoon" },
    { id: "evening", name: "Evening" },
    { id: "night", name: "Night" },
  ];

  const toggleObjectVisibility = (id: string) => {
    setHiddenObjectIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Per-panel background images & masks
  const [panelImages, setPanelImages] = useState<Record<string, string>>({});
  const [panelMasks, setPanelMasks] = useState<Record<string, MaskDot[]>>({});
  const [panelMaskUndoStacks, setPanelMaskUndoStacks] = useState<Record<string, MaskDot[][]>>({});
  const [panelMaskRedoStacks, setPanelMaskRedoStacks] = useState<Record<string, MaskDot[][]>>({});
  const [panelRefImages, setPanelRefImages] = useState<Record<string, string>>({});

  // Derived per-panel image/mask for current panel
  const imageUrl = selectedPanelId ? panelImages[selectedPanelId] || null : null;
  const mask = selectedPanelId ? panelMasks[selectedPanelId] || [] : [];
  const undoStack = selectedPanelId ? panelMaskUndoStacks[selectedPanelId] || [] : [];
  const redoStack = selectedPanelId ? panelMaskRedoStacks[selectedPanelId] || [] : [];

  const setImageUrl = (url: string | null) => {
    if (!selectedPanelId) return;
    setPanelImages(prev => url ? { ...prev, [selectedPanelId]: url } : (() => { const n = { ...prev }; delete n[selectedPanelId]; return n; })());
  };
  const setMask = (updater: MaskDot[] | ((prev: MaskDot[]) => MaskDot[])) => {
    if (!selectedPanelId) return;
    setPanelMasks(prev => {
      const curr = prev[selectedPanelId] || [];
      const next = typeof updater === "function" ? updater(curr) : updater;
      return { ...prev, [selectedPanelId]: next };
    });
  };
  const setUndoStack = (updater: MaskDot[][] | ((prev: MaskDot[][]) => MaskDot[][])) => {
    if (!selectedPanelId) return;
    setPanelMaskUndoStacks(prev => {
      const curr = prev[selectedPanelId] || [];
      const next = typeof updater === "function" ? updater(curr) : updater;
      return { ...prev, [selectedPanelId]: next };
    });
  };
  const setRedoStack = (updater: MaskDot[][] | ((prev: MaskDot[][]) => MaskDot[][])) => {
    if (!selectedPanelId) return;
    setPanelMaskRedoStacks(prev => {
      const curr = prev[selectedPanelId] || [];
      const next = typeof updater === "function" ? updater(curr) : updater;
      return { ...prev, [selectedPanelId]: next };
    });
  };

  const [brushSize, setBrushSize] = useState(28);
  const [maskOpacity, setMaskOpacity] = useState(0.45);
  const [isEraser, setIsEraser] = useState(false);
  const [isPainting, setIsPainting] = useState(false);

  const [inpaintPrompt, setInpaintPrompt] = useState("");

  // Clipboard for Ctrl+C/V between panels
  const [clipboard, setClipboard] = useState<{ type: "bubble"; data: Bubble } | { type: "text"; data: typeof textElements[0] } | { type: "asset"; data: typeof assetElements[0] } | null>(null);

  // Global undo/redo history for all operations
  type HistoryState = {
    bubbles: Bubble[];
    textElements: typeof textElements;
    assetElements: typeof assetElements;
    panels: typeof panels;
  };
  const [history, setHistory] = useState<HistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const saveHistory = () => {
    const state: HistoryState = { bubbles, textElements, assetElements, panels };
    setHistory(prev => [...prev.slice(0, historyIndex + 1), state]);
    setHistoryIndex(prev => prev + 1);
  };
  const undoGlobal = () => {
    if (historyIndex > 0) {
      const prevState = history[historyIndex - 1];
      setBubbles(prevState.bubbles);
      setTextElements(prevState.textElements);
      setAssetElements(prevState.assetElements);
      setPanels(prevState.panels);
      setHistoryIndex(prev => prev - 1);
    }
  };
  const redoGlobal = () => {
    if (historyIndex < history.length - 1) {
      const nextState = history[historyIndex + 1];
      setBubbles(nextState.bubbles);
      setTextElements(nextState.textElements);
      setAssetElements(nextState.assetElements);
      setPanels(nextState.panels);
      setHistoryIndex(prev => prev + 1);
    }
  };

  // Page preview & export
  const [showPagePreview, setShowPagePreview] = useState(false);
  const [gutterSize, setGutterSize] = useState(30);

  // Drag-and-drop reorder
  const [dragPanelId, setDragPanelId] = useState<string | null>(null);

  // Text elements state
  const [textElements, setTextElements] = useState<{
    id: string;
    panelId: string;
    x: number;
    y: number;
    w: number;
    h: number;
    text: string;
    fontSize: number;
    fontWeight: string;
    fontStyle: string;
    fontFamily: FontFamily;
    color: string;
    borderWidth?: number;
    borderColor?: string;
    backgroundColor?: string;
    rotation?: number;
    flipX?: boolean;
    flipY?: boolean;
  }[]>([]);
  const [selectedTextId, setSelectedTextId] = useState<string | null>(null);

  // Asset library and elements
  const [assetLibrary, setAssetLibrary] = useState<{ id: string; url: string; name: string }[]>([]);
  const [assetElements, setAssetElements] = useState<{
    id: string;
    panelId: string;
    assetId: string;
    x: number;
    y: number;
    w: number;
    h: number;
    rotation?: number;
    flipX?: boolean;
    flipY?: boolean;
  }[]>([]);
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);

  const [assetDrag, setAssetDrag] = useState<{
    type: "move" | "resize";
    handle?: "se" | "sw" | "ne" | "nw" | "n" | "s" | "w" | "e";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW?: number;
    origH?: number;
  } | null>(null);
  
    const [textDrag, setTextDrag] = useState<{
    type: "move" | "resize";
    handle?: "se" | "sw" | "ne" | "nw" | "n" | "s" | "w" | "e";
    startX: number;
    startY: number;
    origX: number;
    origY: number;
    origW?: number;
    origH?: number;
  } | null>(null);

  // Rotation state
  const [rotationDrag, setRotationDrag] = useState<{
    startX: number;
    startY: number;
    startAngle: number;
    centerX: number;
    centerY: number;
    currentRotation: number;
  } | null>(null);

  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      id: "b-speech-1",
      panelId: "panel-1",
      x: 40,
      y: 30,
      w: 240,
      h: 110,
      tailMode: "auto",
      tailDir: "bottom-left",
      tailX: 40,
      tailY: 180,
      text: "NGH,\nUGH... N-NO,\nMY LORD...",
      bubbleType: "speech",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-speech-2",
      panelId: "panel-1",
      x: 340,
      y: 20,
      w: 220,
      h: 100,
      tailMode: "auto",
      tailDir: "bottom-right",
      tailX: 500,
      tailY: 160,
      text: "I'M NOT\nGONNA\nDIE.",
      bubbleType: "speech",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-thought-1",
      panelId: "panel-1",
      x: 620,
      y: 20,
      w: 200,
      h: 100,
      tailMode: "auto",
      tailDir: "bottom-left",
      tailX: 620,
      tailY: 160,
      text: "...SOMEONE'S\nWATCHING.",
      bubbleType: "thought",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-whisper-1",
      panelId: "panel-1",
      x: 40,
      y: 220,
      w: 180,
      h: 80,
      tailMode: "auto",
      tailDir: "right",
      tailX: 260,
      tailY: 270,
      text: "(DON'T\nTURN AROUND...)",
      bubbleType: "whisper",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-shout-1",
      panelId: "panel-1",
      x: 280,
      y: 190,
      w: 200,
      h: 140,
      tailMode: "none",
      tailDir: "bottom-left",
      tailX: 340,
      tailY: 370,
      text: "BOOM!",
      bubbleType: "shout",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-sfx-1",
      panelId: "panel-1",
      x: 530,
      y: 180,
      w: 160,
      h: 110,
      tailMode: "none",
      tailDir: "bottom-left",
      tailX: 580,
      tailY: 330,
      text: "CRASH!",
      bubbleType: "sfx",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-rect-1",
      panelId: "panel-1",
      x: 740,
      y: 170,
      w: 200,
      h: 110,
      tailMode: "auto",
      tailDir: "left",
      tailX: 700,
      tailY: 240,
      text: "DON'T MAKE\nA SOUND.\n...MOVE.",
      bubbleType: "rect",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-oval-1",
      panelId: "panel-1",
      x: 600,
      y: 250,
      w: 220,
      h: 120,
      tailMode: "auto",
      tailDir: "bottom-left",
      tailX: 600,
      tailY: 400,
      text: "NGH...\nN-NO.\nNOT NOW...",
      bubbleType: "oval",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-rough-1",
      panelId: "panel-1",
      x: 850,
      y: 40,
      w: 220,
      h: 120,
      tailMode: "auto",
      tailDir: "bottom-right",
      tailX: 1050,
      tailY: 200,
      text: "...IT'S\nRIGHT BEHIND\nYOU.",
      bubbleType: "speechRough",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-half-1",
      panelId: "panel-1",
      x: 40,
      y: 340,
      w: 220,
      h: 120,
      tailMode: "auto",
      tailDir: "bottom-left",
      tailX: 20,
      tailY: 500,
      text: "I CAN'T\nBREATHE...\nIT'S COLD.",
      bubbleType: "speechHalftone",
      autoFitFont: true,
      fontSize: 15,
    },
    {
      id: "b-rect-round-1",
      panelId: "panel-1",
      x: 850,
      y: 320,
      w: 240,
      h: 120,
      tailMode: "auto",
      tailDir: "bottom-right",
      tailX: 1100,
      tailY: 480,
      text: "THE WALLS\nARE MOVING.\nDON'T LOOK.",
      bubbleType: "rectRound",
      autoFitFont: true,
      fontSize: 15,
    },
  ]);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [bubbleDrag, setBubbleDrag] = useState<DragMode>(null);

  // Per-panel filtered views: only show objects belonging to current panel
  const panelBubbles = bubbles.filter(b => b.panelId === selectedPanelId);
  const panelTextElements = textElements.filter(t => t.panelId === selectedPanelId);
  const panelAssetElements = assetElements.filter(a => a.panelId === selectedPanelId);

  const padding = 18;

  const addStrokePoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    setMask((prev) => {
      if (isEraser) {
        const cut = Math.max(6, brushSize / 2);
        return prev.filter((d) => Math.hypot(d.x - x, d.y - y) > cut);
      }
      return [...prev, { x, y, r: brushSize }];
    });
  };

  const commitMaskSnapshot = () => {
    setUndoStack((prev) => [...prev, mask]);
    setRedoStack([]);
  };

  const undo = () => {
    setUndoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setRedoStack((r) => [...r, mask]);
      setMask(last);
      return next;
    });
  };

  const redo = () => {
    setRedoStack((prev) => {
      if (prev.length === 0) return prev;
      const next = [...prev];
      const last = next.pop()!;
      setUndoStack((u) => [...u, mask]);
      setMask(last);
      return next;
    });
  };

  const selectedBubble = bubbles.find((b) => b.id === selectedBubbleId);
  const effectiveSelectedBubbleId = selectedBubble?.id || null;
  const bubbleFontSize = selectedBubble
    ? (selectedBubble.autoFitFont ? estimateFontSize(selectedBubble.text, selectedBubble.w, selectedBubble.h) : selectedBubble.fontSize)
    : 16;

  const uploadImage = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    setImageUrl(dataUrl);
  };

  const uploadAsset = async (file: File) => {
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
    const id = makeId();
    setAssetLibrary((prev) => [...prev, { id, url: dataUrl, name: file.name }]);
  };

  const addAssetElement = (assetId: string) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const id = makeId();
    const w = 120;
    const h = 120;
    const x = rect ? clamp(rect.width * 0.5 - w / 2, padding, rect.width - padding - w) : 300;
    const y = rect ? clamp(rect.height * 0.5 - h / 2, padding, rect.height - padding - h) : 300;
    
    setAssetElements((prev) => [...prev, { id, panelId: selectedPanelId || "panel-1", assetId, x, y, w, h }]);
    setSelectedAssetId(id);
    setTool("asset");
  };

  const deleteSelectedAsset = () => {
    if (!selectedAssetId) return;
    setAssetElements((prev) => prev.filter((a) => a.id !== selectedAssetId));
    setSelectedAssetId(null);
  };

  const updateSelectedAsset = (updates: Partial<typeof assetElements[0]>) => {
    if (!selectedAssetId) return;
    setAssetElements((prev) =>
      prev.map((a) => (a.id === selectedAssetId ? { ...a, ...updates } : a))
    );
  };

  // Snap guide computation
  const SNAP_THRESHOLD = 4;
  const computeSnapGuides = (dragId: string, nx: number, ny: number, nw: number, nh: number) => {
    const guides: { x?: number; y?: number }[] = [];
    const rect = containerRef.current?.getBoundingClientRect();
    const cw = rect?.width || 800;
    const ch = rect?.height || 600;
    const edges = { left: nx, right: nx + nw, cx: nx + nw / 2, top: ny, bottom: ny + nh, cy: ny + nh / 2 };
    // Canvas edges + center
    const targets = [
      { x: 0 }, { x: cw / 2 }, { x: cw },
      { y: 0 }, { y: ch / 2 }, { y: ch },
    ];
    // Other objects
    const allObjs = [
      ...panelBubbles.filter(b => b.id !== dragId).map(b => ({ x: b.x, y: b.y, w: b.w, h: b.h })),
      ...panelTextElements.filter(t => t.id !== dragId).map(t => ({ x: t.x, y: t.y, w: 100, h: 30 })),
      ...panelAssetElements.filter(a => a.id !== dragId).map(a => ({ x: a.x, y: a.y, w: a.w, h: a.h })),
    ];
    allObjs.forEach(o => {
      targets.push({ x: o.x }, { x: o.x + o.w }, { x: o.x + o.w / 2 });
      targets.push({ y: o.y }, { y: o.y + o.h }, { y: o.y + o.h / 2 });
    });
    targets.forEach(t => {
      if (t.x !== undefined) {
        if (Math.abs(edges.left - t.x) < SNAP_THRESHOLD) guides.push({ x: t.x });
        if (Math.abs(edges.right - t.x) < SNAP_THRESHOLD) guides.push({ x: t.x });
        if (Math.abs(edges.cx - t.x) < SNAP_THRESHOLD) guides.push({ x: t.x });
      }
      if (t.y !== undefined) {
        if (Math.abs(edges.top - t.y) < SNAP_THRESHOLD) guides.push({ y: t.y });
        if (Math.abs(edges.bottom - t.y) < SNAP_THRESHOLD) guides.push({ y: t.y });
        if (Math.abs(edges.cy - t.y) < SNAP_THRESHOLD) guides.push({ y: t.y });
      }
    });
    setSnapLines(guides);
    return guides;
  };

  const clearSnapGuides = () => setSnapLines([]);

  // Multi-select helper: toggle id in selectedIds
  const toggleMultiSelect = (id: string, shiftKey: boolean) => {
    if (shiftKey) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } else {
      setSelectedIds(new Set([id]));
    }
  };

  // Find group containing an object
  const findGroup = (id: string) => {
    for (const [gid, members] of Object.entries(groups)) {
      if (members.includes(id)) return { groupId: gid, members };
    }
    return null;
  };

  // Move all objects in a group
  const moveGroupBy = (groupId: string, dx: number, dy: number) => {
    const members = groups[groupId];
    if (!members) return;
    setBubbles(prev => prev.map(b => members.includes(b.id) ? { ...b, x: b.x + dx, y: b.y + dy } : b));
    setTextElements(prev => prev.map(t => members.includes(t.id) ? { ...t, x: t.x + dx, y: t.y + dy } : t));
    setAssetElements(prev => prev.map(a => members.includes(a.id) ? { ...a, x: a.x + dx, y: a.y + dy } : a));
  };

  // Z-order helpers
  const bringToFront = (id: string) => {
    const maxZ = Math.max(0, ...panelBubbles.map(b => b.zIndex || 0), ...panelTextElements.map(t => (t as any).zIndex || 0), ...panelAssetElements.map(a => (a as any).zIndex || 0));
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, zIndex: maxZ + 1 } : b));
    setTextElements(prev => prev.map(t => t.id === id ? { ...t, zIndex: maxZ + 1 } : t));
    setAssetElements(prev => prev.map(a => a.id === id ? { ...a, zIndex: maxZ + 1 } : a));
  };

  const sendToBack = (id: string) => {
    const minZ = Math.min(0, ...panelBubbles.map(b => b.zIndex || 0), ...panelTextElements.map(t => (t as any).zIndex || 0), ...panelAssetElements.map(a => (a as any).zIndex || 0));
    setBubbles(prev => prev.map(b => b.id === id ? { ...b, zIndex: minZ - 1 } : b));
    setTextElements(prev => prev.map(t => t.id === id ? { ...t, zIndex: minZ - 1 } : t));
    setAssetElements(prev => prev.map(a => a.id === id ? { ...a, zIndex: minZ - 1 } : a));
  };

  // Render a single panel onto a canvas context at given yOffset
  const renderPanelToCtx = async (ctx: CanvasRenderingContext2D, panelId: string, w: number, panelH: number, yOffset: number) => {
    const pImg = panelImages[panelId];
    const pBubbles = bubbles.filter(b => b.panelId === panelId && !hiddenObjectIds.has(b.id));
    const pTexts = textElements.filter(t => t.panelId === panelId && !hiddenObjectIds.has(t.id));
    const pAssets = assetElements.filter(a => a.panelId === panelId && !hiddenObjectIds.has(a.id));

    // Background
    if (pImg) {
      const img = new window.Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); img.src = pImg; });
      const scale = Math.min(w / img.width, panelH / img.height);
      const dx = (w - img.width * scale) / 2;
      const dy = yOffset + (panelH - img.height * scale) / 2;
      ctx.drawImage(img, dx, dy, img.width * scale, img.height * scale);
    }

    // Assets
    for (const ae of pAssets) {
      const asset = assetLibrary.find(a => a.id === ae.assetId);
      if (asset) {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        await new Promise<void>((resolve) => { img.onload = () => resolve(); img.onerror = () => resolve(); img.src = asset.url; });
        ctx.drawImage(img, ae.x, yOffset + ae.y, ae.w, ae.h);
      }
    }

    // Bubbles
    for (const b of pBubbles) {
      ctx.save();
      ctx.fillStyle = b.flippedColors ? "#000" : "#fff";
      ctx.beginPath();
      if (b.bubbleType === "rect" || b.bubbleType === "rectRound") {
        const r = b.bubbleType === "rectRound" ? 20 : 2;
        ctx.roundRect(b.x + 4, yOffset + b.y + 4, b.w - 8, b.h - 8, r);
      } else {
        ctx.ellipse(b.x + b.w / 2, yOffset + b.y + b.h / 2, b.w / 2 - 4, b.h / 2 - 4, 0, 0, Math.PI * 2);
      }
      ctx.fill();
      ctx.strokeStyle = b.flippedColors ? "#fff" : "#1a1a1a";
      ctx.lineWidth = 2.5;
      ctx.stroke();

      const fs = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;
      ctx.fillStyle = b.flippedColors ? "#fff" : "#111";
      ctx.font = `${b.bubbleType === "sfx" || b.bubbleType === "shout" ? "900" : "400"} ${fs}px 'Comic Sans MS', Arial`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      const lines = b.text.split("\n");
      const lineHeight = fs * 1.3;
      const startY = yOffset + b.y + b.h / 2 - ((lines.length - 1) * lineHeight) / 2;
      lines.forEach((line, i) => { ctx.fillText(line, b.x + b.w / 2, startY + i * lineHeight, b.w - 32); });
      ctx.restore();
    }

    // Text elements
    for (const te of pTexts) {
      ctx.save();
      ctx.fillStyle = te.color;
      ctx.font = `${te.fontStyle} ${te.fontWeight} ${te.fontSize}px ${te.fontFamily}`;
      ctx.textBaseline = "top";
      te.text.split("\n").forEach((line, i) => { ctx.fillText(line, te.x, yOffset + te.y + i * te.fontSize * 1.3); });
      ctx.restore();
    }
  };

  // Export with all layers - supports single panel or full page
  const exportWithAllLayers = async () => {
    const w = 800;
    if (canvasViewMode === "fullpage") {
      // Export ALL panels stitched vertically
      const totalH = currentPanels.reduce((sum, p) => sum + p.height, 0) + gutterSize * (currentPanels.length - 1);
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = totalH;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, w, totalH);
      let yOff = 0;
      for (const p of currentPanels) {
        await renderPanelToCtx(ctx, p.id, w, p.height, yOff);
        yOff += p.height + gutterSize;
      }
      const link = document.createElement("a");
      link.download = `page-${currentPage?.number || 1}-full.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } else {
      // Export single panel
      const h = selectedPanel?.height || 600;
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, w, h);
      if (selectedPanelId) await renderPanelToCtx(ctx, selectedPanelId, w, h, 0);
      const link = document.createElement("a");
      link.download = `panel-${selectedPanelId || "export"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    }
  };

  const addBubble = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const id = makeId();
    const w = 280;
    const h = 130;
    const x = rect ? clamp(rect.width * 0.5 - w / 2, padding, rect.width - padding - w) : 520;
    const y = rect ? clamp(rect.height * 0.15, padding, rect.height - padding - h) : 120;
    const tailX = rect ? x + w * 0.6 : x + 160;
    const tailY = rect ? y + h + 120 : y + 220;

    const next: Bubble = {
      id,
      panelId: selectedPanelId || "panel-1",
      x,
      y,
      w,
      h,
      tailMode: "auto",
      tailDir: "bottom-left",
      tailX,
      tailY,
      text: "New bubble...",
      bubbleType: "speech",
      autoFitFont: true,
      fontSize: 15,
    };
    setBubbles((prev) => [...prev, next]);
    setSelectedBubbleId(id);
  };

  const deleteSelectedBubble = () => {
    if (!effectiveSelectedBubbleId) return;
    setBubbles((prev) => prev.filter((b) => b.id !== effectiveSelectedBubbleId));
    setSelectedBubbleId(null);
    setBubbleDrag(null);
  };

  const updateSelectedBubble = (patch: Partial<Bubble>) => {
    if (!effectiveSelectedBubbleId) return;
    setBubbles((prev) => prev.map((b) => (b.id === effectiveSelectedBubbleId ? { ...b, ...patch } : b)));
  };

  // Text management functions
  const addTextElement = () => {
    const rect = containerRef.current?.getBoundingClientRect();
    const id = makeId();
    const w = 200;
    const h = 50;
    const x = rect ? clamp(rect.width * 0.5 - w / 2, padding, rect.width - padding - w) : 400;
    const y = rect ? clamp(rect.height * 0.5 - h / 2, padding, rect.height - padding - h) : 300;

    const newTextElement = {
      id,
      panelId: selectedPanelId || "panel-1",
      x,
      y,
      w,
      h,
      text: "New text...",
      fontSize: 24,
      fontWeight: "700",
      fontStyle: "normal",
      fontFamily: "Arial" as FontFamily,
      color: "#000000",
    };
    setTextElements((prev) => [...prev, newTextElement]);
    setSelectedTextId(id);
  };

  const deleteSelectedText = () => {
    if (!selectedTextId) return;
    setTextElements((prev) => prev.filter((t) => t.id !== selectedTextId));
    setSelectedTextId(null);
    setTextDrag(null);
  };

  const updateSelectedText = (patch: Partial<typeof textElements[0]>) => {
    if (!selectedTextId) return;
    setTextElements((prev) => prev.map((t) => (t.id === selectedTextId ? { ...t, ...patch } : t)));
  };

  
  // Keyboard event handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";

      if (e.key === "Delete" && !isInput) {
        if (effectiveSelectedBubbleId) deleteSelectedBubble();
        else if (selectedTextId) deleteSelectedText();
        else if (selectedAssetId) deleteSelectedAsset();
      }

      // Ctrl+C: Copy selected object
      if ((e.ctrlKey || e.metaKey) && e.key === "c" && !isInput) {
        if (effectiveSelectedBubbleId) {
          const b = bubbles.find(b => b.id === effectiveSelectedBubbleId);
          if (b) setClipboard({ type: "bubble", data: { ...b } });
        } else if (selectedTextId) {
          const t = textElements.find(t => t.id === selectedTextId);
          if (t) setClipboard({ type: "text", data: { ...t } });
        } else if (selectedAssetId) {
          const a = assetElements.find(a => a.id === selectedAssetId);
          if (a) setClipboard({ type: "asset", data: { ...a } });
        }
      }

      // Ctrl+V: Paste to current panel
      if ((e.ctrlKey || e.metaKey) && e.key === "v" && !isInput && clipboard) {
        e.preventDefault();
        const pid = selectedPanelId || "panel-1";
        const newId = `${clipboard.type[0]}-${Date.now()}`;
        if (clipboard.type === "bubble") {
          const nb: Bubble = { ...clipboard.data, id: newId, panelId: pid, x: clipboard.data.x + 20, y: clipboard.data.y + 20 };
          setBubbles(prev => [...prev, nb]);
          setSelectedBubbleId(newId);
        } else if (clipboard.type === "text") {
          const nt = { ...clipboard.data, id: newId, panelId: pid, x: clipboard.data.x + 20, y: clipboard.data.y + 20 };
          setTextElements(prev => [...prev, nt]);
          setSelectedTextId(newId);
        } else if (clipboard.type === "asset") {
          const na = { ...clipboard.data, id: newId, panelId: pid, x: clipboard.data.x + 20, y: clipboard.data.y + 20 };
          setAssetElements(prev => [...prev, na]);
          setSelectedAssetId(newId);
        }
      }

      // Keyboard shortcuts (when not in input)
      if (!isInput && !e.ctrlKey && !e.metaKey) {
        // Tool shortcuts
        if (e.key === "b") { setTool("bubble"); setActiveTab("bubbles"); }
        if (e.key === "t") { setTool("text"); setActiveTab("text"); }
        if (e.key === "a") { setTool("asset"); setActiveTab("assets"); }
        if (e.key === "m") { setTool("paint"); setActiveTab("paint"); }
        if (e.key === "p") setActiveTab("panel");
        if (e.key === "l") setActiveTab("layers");

        // Panel switching: [ and ]
        if (e.key === "[" || e.key === "]") {
          const idx = currentPanels.findIndex(p => p.id === selectedPanelId);
          if (e.key === "[" && idx > 0) setSelectedPanelId(currentPanels[idx - 1].id);
          if (e.key === "]" && idx < currentPanels.length - 1) setSelectedPanelId(currentPanels[idx + 1].id);
        }

        // Ctrl+Z / Ctrl+Y undo/redo mask (handled by ctrl check above, but let's add)
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !isInput) { e.preventDefault(); undoGlobal(); }
      if ((e.ctrlKey || e.metaKey) && e.key === "y" && !isInput) { e.preventDefault(); redoGlobal(); }

      // Ctrl+G group selected objects
      if ((e.ctrlKey || e.metaKey) && e.key === "g" && !isInput && selectedIds.size > 1) {
        e.preventDefault();
        const groupId = `group-${Date.now()}`;
        setGroups(prev => ({ ...prev, [groupId]: Array.from(selectedIds) }));
      }

      // Reset zoom: Ctrl+0
      if ((e.ctrlKey || e.metaKey) && e.key === "0" && !isInput) {
        e.preventDefault();
        setZoom(1);
        setPanOffset({ x: 0, y: 0 });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [effectiveSelectedBubbleId, selectedTextId, selectedAssetId, clipboard, selectedPanelId, currentPanels, bubbles, textElements, assetElements]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClick = () => { setShowEpisodeDropdown(false); setShowPageDropdown(false); };
    if (showEpisodeDropdown || showPageDropdown) {
      const timer = setTimeout(() => document.addEventListener("click", handleClick), 0);
      return () => { clearTimeout(timer); document.removeEventListener("click", handleClick); };
    }
  }, [showEpisodeDropdown, showPageDropdown]);

  return (
    <div className="flex flex-col h-full" data-testid="manga-studio">
      <div className="px-4 py-3 border-b border-white/10 bg-[#0f1117] flex items-center justify-between">
        {/* Left: Back + Episode/Page breadcrumb */}
        <div className="flex items-center gap-3">
          <Link href="/manga-studio" className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="w-px h-5 bg-white/10" />
          {/* Custom Episode Dropdown */}
          <div className="relative">
            <button onClick={() => { setShowEpisodeDropdown(!showEpisodeDropdown); setShowPageDropdown(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] hover:bg-[#222233] border border-white/10 rounded-lg transition cursor-pointer">
              <BookOpen className="w-3.5 h-3.5 text-purple-400" />
              <span className="text-white text-sm font-semibold">{episodes.find(e => e.id === currentEpisodeId)?.title || "Episode"}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {showEpisodeDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-[#13131a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-1">
                  {episodes.map(ep => {
                    const epPages = pages.filter(p => p.episodeId === ep.id);
                    return (
                      <button key={ep.id} onClick={() => {
                        setCurrentEpisodeId(ep.id);
                        const firstPage = pages.find(p => p.episodeId === ep.id);
                        if (firstPage) switchToPage(firstPage.id);
                        setShowEpisodeDropdown(false);
                      }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition ${ep.id === currentEpisodeId ? "bg-purple-500/15 border border-purple-500/30" : "hover:bg-white/5"}`}>
                        <div className="text-sm font-semibold text-white">Episode {ep.id}: {ep.title}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{epPages.length} pages • {ep.id === currentEpisodeId ? "Current" : "Draft"}</div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-white/10 p-2">
                  <button className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">
                    <Plus className="w-3.5 h-3.5" /> New Episode
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className="text-gray-600 mx-0.5">/</span>
          {/* Custom Page Dropdown */}
          <div className="relative">
            <button onClick={() => { setShowPageDropdown(!showPageDropdown); setShowEpisodeDropdown(false); }}
              className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] hover:bg-[#222233] border border-white/10 rounded-lg transition cursor-pointer">
              <span className="text-white text-sm font-semibold">Page {currentPage?.number || 1}</span>
              <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
            </button>
            {showPageDropdown && (
              <div className="absolute top-full left-0 mt-2 w-56 bg-[#13131a] border border-white/10 rounded-xl shadow-2xl z-50 overflow-hidden">
                <div className="p-1">
                  {episodePages.map(pg => {
                    const pgPanels = panels.filter(p => p.pageId === pg.id);
                    return (
                      <button key={pg.id} onClick={() => { switchToPage(pg.id); setShowPageDropdown(false); }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition ${pg.id === currentPageId ? "bg-blue-500/15 border border-blue-500/30" : "hover:bg-white/5"}`}>
                        <div className="text-sm font-semibold text-white">Page {pg.number}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{pgPanels.length} panels</div>
                      </button>
                    );
                  })}
                </div>
                <div className="border-t border-white/10 p-2">
                  <button onClick={() => { addPage(); setShowPageDropdown(false); }}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition">
                    <Plus className="w-3.5 h-3.5" /> Add New Page
                  </button>
                </div>
              </div>
            )}
          </div>
          <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-semibold ${
            currentPage?.status === "drawing" ? "bg-blue-500/20 text-blue-400" : "bg-gray-500/20 text-gray-400"
          }`}>{currentPage?.status === "drawing" ? "Drawing" : "Queued"}</span>
        </div>

        {/* Center: Page navigation + panel count + timeline toggle */}
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-500">{currentPanels.length} Panels • 800px</span>
          <button onClick={() => setShowTimeline(!showTimeline)} data-testid="timeline-toggle-btn"
            className={`px-2 py-1 text-[10px] font-semibold rounded transition flex items-center gap-1 ${showTimeline ? "bg-pink-500/15 text-pink-400" : "bg-white/5 text-gray-500 hover:text-gray-300"}`}>
            <GripVertical className="w-3 h-3" /> Timeline
          </button>
          <div className="w-px h-4 bg-white/10" />
          <div className="flex items-center gap-0.5">
            <button onClick={() => {
              const idx = episodePages.findIndex(p => p.id === currentPageId);
              if (idx > 0) switchToPage(episodePages[idx - 1].id);
            }} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition">
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <span className="text-[10px] text-gray-500 font-mono min-w-[32px] text-center">
              {episodePages.findIndex(p => p.id === currentPageId) + 1}/{episodePages.length}
            </span>
            <button onClick={() => {
              const idx = episodePages.findIndex(p => p.id === currentPageId);
              if (idx < episodePages.length - 1) switchToPage(episodePages[idx + 1].id);
            }} className="p-1 rounded hover:bg-white/10 text-gray-400 hover:text-white transition">
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Center: Main Actions — matches manga editor nav (pic7) */}
        <div className="flex items-center gap-2.5">
          <button 
            onClick={handleQuickStart}
            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-white/10"
          >
            <BookOpen className="w-4 h-4" /> Quick Start
          </button>
          {/* Export with dropdown */}
          <div className="relative">
            <button 
              onClick={() => setShowExportMenu(!showExportMenu)}
              className="px-4 py-2 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 rounded-lg text-sm font-medium transition flex items-center gap-2 border border-orange-500/20"
            >
              <Download className="w-4 h-4" /> Export <ChevronDown className="w-3 h-3" />
            </button>
            {showExportMenu && (
              <div className="absolute top-full mt-1 left-0 w-48 bg-[#1a1a24] border border-white/10 rounded-xl shadow-2xl z-50 py-1 overflow-hidden">
                <button onClick={() => { exportWithAllLayers(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition flex items-center gap-3">
                  <FileText className="w-4 h-4 text-red-400" />Export as PDF
                </button>
                <button onClick={() => { exportWithAllLayers(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition flex items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-blue-400" />Export as PNG
                </button>
                <button onClick={() => { exportWithAllLayers(); setShowExportMenu(false); }}
                  className="w-full px-4 py-2.5 text-left text-sm text-white hover:bg-white/5 transition flex items-center gap-3">
                  <Archive className="w-4 h-4 text-purple-400" />Export as CBZ
                </button>
              </div>
            )}
          </div>
          <button 
            onClick={() => setCanvasViewMode(canvasViewMode === "single" ? "fullpage" : "single")}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-purple-500/20"
          >
            <Layers className="w-4 h-4" /> Page Mode
          </button>
          <button 
            onClick={() => setActiveTab("aimanga")}
            className="px-5 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:opacity-90 text-white rounded-lg text-sm font-semibold transition flex items-center gap-2 shadow-lg shadow-emerald-500/20"
          >
            <Sparkles className="w-4 h-4" /> AI Generate
          </button>
        </div>

        {/* Right: Secondary Actions */}
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const file = e.target.files?.[0]; if (file) uploadImage(file); }} />
          <button onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 border bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setShowPagePreview(true)}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 border bg-white/5 border-white/10 text-gray-300 hover:bg-white/10">
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button onClick={addPage}
            className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition flex items-center gap-1.5 border bg-purple-500/10 border-purple-500/20 text-purple-300 hover:bg-purple-500/20">
            <Plus className="w-3.5 h-3.5" /> Page
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 p-6 bg-[#0a0a0f] overflow-auto pb-28">
          {/* Panel indicator bar */}
          {currentPanels.length > 0 && (
            <div className="flex items-center justify-between mb-3 px-1">
              <div className="flex items-center gap-2">
                {selectedPanel && <>
                  <span className="w-6 h-6 rounded-md bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center">{currentPanels.findIndex(p => p.id === selectedPanel.id) + 1}</span>
                  <span className="text-sm font-semibold text-white">{selectedPanel.title}</span>
                  <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded">{panelSizePresets.find(s => s.id === selectedPanel.sizePreset)?.name} • {selectedPanel.height}px</span>
                </>}
                {/* View mode toggle */}
                <div className="flex items-center bg-[#1a1a24] rounded-lg border border-white/10 ml-2">
                  <button onClick={() => setCanvasViewMode("single")}
                    className={`px-2 py-1 text-[10px] font-semibold rounded-l-lg transition ${canvasViewMode === "single" ? "bg-pink-500/20 text-pink-400" : "text-gray-500 hover:text-gray-300"}`}>Single</button>
                  <button onClick={() => setCanvasViewMode("fullpage")} data-testid="fullpage-view-btn"
                    className={`px-2 py-1 text-[10px] font-semibold rounded-r-lg transition ${canvasViewMode === "fullpage" ? "bg-pink-500/20 text-pink-400" : "text-gray-500 hover:text-gray-300"}`}>Full Page</button>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <div className="group relative">
                  <button className="px-2 py-1 text-[10px] text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded transition">?</button>
                  <div className="absolute right-0 top-full mt-1 w-52 p-3 bg-[#13131a] border border-white/10 rounded-xl shadow-2xl z-50 hidden group-hover:block">
                    <div className="text-[10px] font-bold text-white mb-2">Keyboard Shortcuts</div>
                    <div className="space-y-1 text-[9px] text-gray-400">
                      <div className="flex justify-between"><span>Bubble tool</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">B</kbd></div>
                      <div className="flex justify-between"><span>Text tool</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">T</kbd></div>
                      <div className="flex justify-between"><span>Asset tool</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">A</kbd></div>
                      <div className="flex justify-between"><span>Mask tool</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">M</kbd></div>
                      <div className="flex justify-between"><span>Panels tab</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">P</kbd></div>
                      <div className="flex justify-between"><span>Layers tab</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">L</kbd></div>
                      <div className="flex justify-between"><span>Prev/Next panel</span><span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">[</kbd> <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">]</kbd></span></div>
                      <div className="flex justify-between"><span>Copy / Paste</span><span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Ctrl+C</kbd> <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">V</kbd></span></div>
                      <div className="flex justify-between"><span>Undo / Redo</span><span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Ctrl+Z</kbd> <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Y</kbd></span></div>
                      <div className="flex justify-between"><span>Delete object</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Del</kbd></div>
                      <div className="flex justify-between"><span>Group selected</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Ctrl+G</kbd></div>
                      <div className="flex justify-between"><span>Reset zoom</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Ctrl+0</kbd></div>
                      <div className="flex justify-between"><span>Multi-select</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Shift+Click</kbd></div>
                      <div className="flex justify-between"><span>Zoom</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Scroll</kbd></div>
                      <div className="flex justify-between"><span>Pan</span><kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-300">Mid-Click</kbd></div>
                    </div>
                  </div>
                </div>
                {!showTimeline && (
                  <button onClick={() => setShowTimeline(true)} className="px-2 py-1 text-[10px] text-pink-400 hover:bg-pink-500/10 rounded transition flex items-center gap-1">
                    <GripVertical className="w-3 h-3" /> Timeline
                  </button>
                )}
              </div>
            </div>
          )}
          {/* Full Page Vertical View */}
          {canvasViewMode === "fullpage" && (
            <div className="mx-auto mb-4" style={{ width: "800px", maxWidth: "100%" }}>
              {currentPanels.map((p, idx) => {
                const pImg = panelImages[p.id];
                const pBubbles = bubbles.filter(b => b.panelId === p.id);
                const pTexts = textElements.filter(t => t.panelId === p.id);
                const pAssets = assetElements.filter(a => a.panelId === p.id);
                const isSelected = selectedPanelId === p.id;
                return (
                  <div key={p.id}>
                    <div
                      className={`relative w-full rounded-lg border-2 transition cursor-pointer overflow-hidden ${
                        isSelected ? "border-pink-500/60 ring-2 ring-pink-500/20" : "border-white/10 hover:border-white/20"
                      }`}
                      style={{ height: `${Math.min(p.height, 720)}px`, backgroundColor: "#0a0a0f" }}
                      onClick={() => setSelectedPanelId(p.id)}
                      onDoubleClick={() => { setSelectedPanelId(p.id); setCanvasViewMode("single"); }}
                    >
                      {pImg ? (
                        <div className="absolute inset-0">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={pImg} alt="" className="w-full h-full object-contain" />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-sm text-gray-600">Panel {idx + 1}: {p.title}</span>
                        </div>
                      )}
                      
                      {/* Show asset elements */}
                      {pAssets.map(ae => {
                        const asset = assetLibrary.find(a => a.id === ae.assetId);
                        if (!asset) return null;
                        return (
                          <div key={ae.id} className="absolute pointer-events-none" style={{ left: ae.x, top: ae.y, width: ae.w, height: ae.h }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={asset.url} alt="" className="w-full h-full object-contain" />
                          </div>
                        );
                      })}

                      {/* Show bubbles with EXACT same rendering as single panel view */}
                      {pBubbles.filter(b => !hiddenObjectIds.has(b.id)).map((b) => {
                        const seed = b.id;
                        const font = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;
                        const dashed = b.bubbleType === "whisper";
                        const hasTail = b.tailMode !== "none" && b.bubbleType !== "shout" && b.bubbleType !== "sfx";
                        const e = bubbleEllipse(b.w, b.h);
                        const sw = 2.5;
                        const whisperSw = 3.5;
                        const whisperStroke = "#333";
                        const whisperDash = "10 8";
                        const isFlipped = b.flippedColors || false;
                        const fillColor = isFlipped ? "#000000" : "#ffffff";
                        const strokeColor = isFlipped ? "#ffffff" : "#1a1a1a";
                        const textColor = isFlipped ? "#ffffff" : "#111111";
                        return (
                          <div key={b.id} className="absolute pointer-events-none" style={{
                            left: b.x, top: b.y, width: b.w, height: b.h,
                            filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
                            transform: `rotate(${b.rotation || 0}deg) scaleX(${b.flipX ? -1 : 1}) scaleY(${b.flipY ? -1 : 1})`,
                            transformOrigin: "center",
                          }}>
                            <svg width={b.w} height={b.h} viewBox={`0 0 ${b.w} ${b.h}`} className="absolute inset-0" style={{ shapeRendering: "geometricPrecision", overflow: "visible" }}>
                              {b.bubbleType === "thought" ? (
                                <>
                                  <path d={cloudPath(b.w, b.h)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                                  <path d={cloudPath(b.w, b.h)} fill={fillColor} stroke="none" />
                                </>
                              ) : b.bubbleType === "oval" ? (
                                <>
                                  {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
                                  <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" />
                                  <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                                </>
                              ) : b.bubbleType === "speechRough" ? (
                                <>
                                  <path d={roughEllipsePath(b.w, b.h, seed)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                                  {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
                                  <path d={roughEllipsePath(b.w, b.h, seed)} fill={fillColor} stroke="none" />
                                </>
                              ) : b.bubbleType === "shout" ? (
                                <polygon points={burstPoints(b.w, b.h, 12, seed).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="miter" />
                              ) : b.bubbleType === "sfx" ? (
                                <polygon points={burstPoints(b.w, b.h, 18, seed, true).map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")} fill={fillColor} stroke={strokeColor} strokeWidth={2.8} strokeLinejoin="miter" />
                              ) : b.bubbleType === "rectRound" ? (
                                <>
                                  {hasTail && <path d={rectTailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
                                  <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={20} ry={20} fill={fillColor} stroke="none" />
                                  {hasTail && <path d={rectTailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke="none" />}
                                  {hasTail ? (
                                    <path d={rectOutlinePathWithGap(b.w, b.h, 20, b.tailDir === "left" ? "left" : b.tailDir === "right" ? "right" : "bottom", b.tailDir === "left" || b.tailDir === "right" ? b.h * 0.6 : b.w * (b.tailDir === "bottom-left" ? 0.2 : 0.8), 36)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                                  ) : (
                                    <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={20} ry={20} fill="none" stroke={strokeColor} strokeWidth={sw} />
                                  )}
                                </>
                              ) : b.bubbleType === "rect" ? (
                                <>
                                  {hasTail && <path d={rectTailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
                                  <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={2} ry={2} fill={fillColor} stroke="none" />
                                  {hasTail && <path d={rectTailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke="none" />}
                                  {hasTail ? (
                                    <path d={rectOutlinePathWithGap(b.w, b.h, 2, b.tailDir === "left" ? "left" : b.tailDir === "right" ? "right" : "bottom", b.tailDir === "left" || b.tailDir === "right" ? b.h * 0.6 : b.w * (b.tailDir === "bottom-left" ? 0.2 : 0.8), 36)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />
                                  ) : (
                                    <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={2} ry={2} fill="none" stroke={strokeColor} strokeWidth={sw} />
                                  )}
                                </>
                              ) : (
                                <>
                                  <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={dashed ? whisperStroke : strokeColor} strokeWidth={dashed ? whisperSw : sw} strokeDasharray={dashed ? whisperDash : undefined} strokeLinecap={dashed ? "round" : undefined} />
                                  {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={dashed ? whisperStroke : strokeColor} strokeWidth={dashed ? whisperSw : sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed ? whisperDash : undefined} />}
                                  <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" />
                                </>
                              )}
                            </svg>
                            <div className="absolute inset-0 flex items-center justify-center" style={{
                              padding: b.bubbleType === "rect" || b.bubbleType === "rectRound" ? "12px 16px" : "16px 24px",
                              fontSize: font, lineHeight: 1.3, color: textColor,
                              overflowWrap: "anywhere", whiteSpace: "pre-wrap", textAlign: "center",
                              fontFamily: "'Comic Sans MS', 'Bangers', 'Segoe UI', sans-serif",
                              fontWeight: b.bubbleType === "sfx" || b.bubbleType === "shout" ? 900 : 400,
                              letterSpacing: b.bubbleType === "sfx" ? "0.06em" : b.bubbleType === "shout" ? "0.02em" : "0em",
                              fontStyle: b.bubbleType === "whisper" ? "italic" : "normal",
                            }}>
                              {b.text}
                            </div>
                          </div>
                        );
                      })}

                      {/* Show text elements */}
                      {pTexts.filter(t => !hiddenObjectIds.has(t.id)).map(t => (
                        <div key={t.id} className="absolute pointer-events-none" style={{ left: t.x, top: t.y, fontSize: t.fontSize, color: t.color, fontWeight: t.fontWeight, fontStyle: t.fontStyle, fontFamily: t.fontFamily }}>
                          {t.text.split('\n').map((line, i) => (
                            <div key={i}>{line}</div>
                          ))}
                        </div>
                      ))}
                      
                      {/* Panel number badge */}
                      <div className={`absolute top-2 left-2 px-2 py-1 rounded-md text-[10px] font-bold ${isSelected ? "bg-pink-500/30 text-pink-300" : "bg-black/60 text-gray-300"}`}>
                        {idx + 1}
                      </div>
                      {isSelected && (
                        <div className="absolute top-2 right-2 px-2 py-1 bg-pink-500/20 border border-pink-500/30 rounded text-[9px] text-pink-300 font-semibold">
                          Double-click to edit
                        </div>
                      )}
                    </div>
                    {idx < currentPanels.length - 1 && (
                      <div style={{ height: gutterSize }} className="bg-[#0a0a0f] flex items-center justify-center">
                        <div className="w-16 h-px bg-white/10" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Single Panel Editor Canvas */}
          <div
            ref={containerRef}
            className="relative mx-auto rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/15 via-[#13131a] to-blue-900/15 overflow-hidden"
            style={{ width: "800px", maxWidth: "100%", height: selectedPanel ? `${Math.min(selectedPanel.height, 720)}px` : "720px", cursor: isPanning ? "grabbing" : tool === "paint" ? "crosshair" : tool === "text" ? "text" : "default", display: canvasViewMode === "fullpage" ? "none" : "block" }}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY > 0 ? -0.1 : 0.1;
              setZoom(prev => Math.min(5, Math.max(0.2, prev + delta)));
            }}
            onMouseDown={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                setIsPanning(true);
                panStart.current = { x: e.clientX, y: e.clientY, ox: panOffset.x, oy: panOffset.y };
                return;
              }
              if (tool === "paint") {
                commitMaskSnapshot();
                setIsPainting(true);
                addStrokePoint(e.clientX, e.clientY);
              }
            }}
            onMouseMove={(e) => {
              if (isPanning) {
                setPanOffset({ x: panStart.current.ox + (e.clientX - panStart.current.x), y: panStart.current.oy + (e.clientY - panStart.current.y) });
                return;
              }
              if (tool !== "paint") return;
              if (!isPainting) return;
              addStrokePoint(e.clientX, e.clientY);
            }}
            onMouseUp={(e) => { if (e.button === 1) setIsPanning(false); setIsPainting(false); }}
            onMouseLeave={() => { setIsPanning(false); setIsPainting(false); }}
          >
            <div style={{ transform: `scale(${zoom}) translate(${panOffset.x / zoom}px, ${panOffset.y / zoom}px)`, transformOrigin: "center center", width: "100%", height: "100%", position: "absolute", inset: 0 }}>
            {imageUrl ? (
              <div className="absolute inset-0">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Uploaded" className="w-full h-full object-contain" />
              </div>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl">🌅</div>
                  <p className="text-sm text-gray-400 font-medium mt-3">Upload a manga panel image to test</p>
                  <p className="text-xs text-gray-600 mt-1 max-w-md">Then paint mask / place bubbles on real artwork.</p>
                </div>
              </div>
            )}

            {/* Mask overlay */}
            {mask.length > 0 && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: maskOpacity, mixBlendMode: "normal" }}>
                <defs>
                  <filter id="blur-mask" x="-50%" y="-50%" width="200%" height="200%">
                    <feGaussianBlur in="SourceGraphic" stdDeviation="0.8" />
                  </filter>
                </defs>
                {mask.map((d, i) => (
                  <circle
                    key={i}
                    cx={d.x}
                    cy={d.y}
                    r={d.r / 2}
                    fill="rgba(59, 130, 246, 0.75)"
                    filter="url(#blur-mask)"
                  />
                ))}
              </svg>
            )}

            {/* Bubble overlay */}
            <div
              className="absolute inset-0"
              onMouseDown={(e) => {
                if (tool !== "bubble") return;
                const rect = containerRef.current?.getBoundingClientRect();
                if (!rect) return;
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;

                let hit: Bubble | null = null;
                for (let i = panelBubbles.length - 1; i >= 0; i--) {
                  const b = panelBubbles[i];
                  const within = x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
                  if (within) {
                    hit = b;
                    break;
                  }
                }

                if (!hit) return;

                // Ctrl+Click for multi-select
                if (e.ctrlKey || e.metaKey) {
                  toggleMultiSelect(hit.id, true);
                  return;
                }
                setSelectedBubbleId(hit.id);
                setSelectedIds(new Set([hit.id]));

                const nearHandle = Math.abs(x - (hit.x + hit.w)) < 16 && Math.abs(y - (hit.y + hit.h)) < 16;

                if (nearHandle) {
                  setBubbleDrag({ type: "resize", handle: "se", startX: x, startY: y, orig: hit });
                  return;
                }

                setBubbleDrag({ type: "move", startX: x, startY: y, origX: hit.x, origY: hit.y });
              }}
              onMouseMove={(e) => {
                if (tool === "bubble" && bubbleDrag) {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  if (!effectiveSelectedBubbleId) return;

                  const current = bubbles.find((b) => b.id === effectiveSelectedBubbleId);
                  if (!current) return;

                  if (bubbleDrag.type === "move") {
                    const dx = x - bubbleDrag.startX;
                    const dy = y - bubbleDrag.startY;
                    const origX = bubbleDrag.origX ?? current.x;
                    const origY = bubbleDrag.origY ?? current.y;
                    updateSelectedBubble({
                      x: clamp(origX + dx, padding, rect.width - padding - current.w),
                      y: clamp(origY + dy, padding, rect.height - padding - current.h),
                    });
                    return;
                  }

                  if (bubbleDrag.type === "resize") {
                    const dx = x - bubbleDrag.startX;
                    const dy = y - bubbleDrag.startY;
                    const minW = 160;
                    const minH = 72;
                    const handle = bubbleDrag.handle || "se";
                    
                    let nextW = bubbleDrag.orig.w;
                    let nextH = bubbleDrag.orig.h;
                    let nextX = bubbleDrag.orig.x;
                    let nextY = bubbleDrag.orig.y;
                    
                    switch (handle) {
                      case "se": // bottom-right
                        nextW = clamp(bubbleDrag.orig.w + dx, minW, rect.width - padding - bubbleDrag.orig.x);
                        nextH = clamp(bubbleDrag.orig.h + dy, minH, rect.height - padding - bubbleDrag.orig.y);
                        break;
                      case "sw": // bottom-left
                        nextW = clamp(bubbleDrag.orig.w - dx, minW, bubbleDrag.orig.x + bubbleDrag.orig.w - padding);
                        nextH = clamp(bubbleDrag.orig.h + dy, minH, rect.height - padding - bubbleDrag.orig.y);
                        nextX = bubbleDrag.orig.x + bubbleDrag.orig.w - nextW;
                        break;
                      case "ne": // top-right
                        nextW = clamp(bubbleDrag.orig.w + dx, minW, rect.width - padding - bubbleDrag.orig.x);
                        nextH = clamp(bubbleDrag.orig.h - dy, minH, bubbleDrag.orig.y + bubbleDrag.orig.h - padding);
                        nextY = bubbleDrag.orig.y + bubbleDrag.orig.h - nextH;
                        break;
                      case "nw": // top-left
                        nextW = clamp(bubbleDrag.orig.w - dx, minW, bubbleDrag.orig.x + bubbleDrag.orig.w - padding);
                        nextH = clamp(bubbleDrag.orig.h - dy, minH, bubbleDrag.orig.y + bubbleDrag.orig.h - padding);
                        nextX = bubbleDrag.orig.x + bubbleDrag.orig.w - nextW;
                        nextY = bubbleDrag.orig.y + bubbleDrag.orig.h - nextH;
                        break;
                      case "n": // top
                        nextH = clamp(bubbleDrag.orig.h - dy, minH, bubbleDrag.orig.y + bubbleDrag.orig.h - padding);
                        nextY = bubbleDrag.orig.y + bubbleDrag.orig.h - nextH;
                        break;
                      case "s": // bottom
                        nextH = clamp(bubbleDrag.orig.h + dy, minH, rect.height - padding - bubbleDrag.orig.y);
                        break;
                      case "w": // left
                        nextW = clamp(bubbleDrag.orig.w - dx, minW, bubbleDrag.orig.x + bubbleDrag.orig.w - padding);
                        nextX = bubbleDrag.orig.x + bubbleDrag.orig.w - nextW;
                        break;
                      case "e": // right
                        nextW = clamp(bubbleDrag.orig.w + dx, minW, rect.width - padding - bubbleDrag.orig.x);
                        break;
                    }
                    
                    updateSelectedBubble({ x: nextX, y: nextY, w: nextW, h: nextH });
                    return;
                  }
                }

                if (tool === "text" && textDrag) {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  const current = textElements.find((t) => t.id === selectedTextId);
                  if (!current) return;

                  if (textDrag.type === "move") {
                    const dx = x - textDrag.startX;
                    const dy = y - textDrag.startY;
                    updateSelectedText({
                      x: clamp(textDrag.origX + dx, padding, rect.width - padding - current.w),
                      y: clamp(textDrag.origY + dy, padding, rect.height - padding - current.h),
                    });
                    return;
                  }

                  if (textDrag.type === "resize") {
                    const dx = x - textDrag.startX;
                    const dy = y - textDrag.startY;
                    const minW = 80;
                    const minH = 30;
                    const handle = textDrag.handle || "se";
                    
                    let nextW = textDrag.origW || 0;
                    let nextH = textDrag.origH || 0;
                    let nextX = textDrag.origX;
                    let nextY = textDrag.origY;
                    
                    switch (handle) {
                      case "se": // bottom-right
                        nextW = clamp((textDrag.origW || 0) + dx, minW, rect.width - padding - textDrag.origX);
                        nextH = clamp((textDrag.origH || 0) + dy, minH, rect.height - padding - textDrag.origY);
                        break;
                      case "sw": // bottom-left
                        nextW = clamp((textDrag.origW || 0) - dx, minW, textDrag.origX + (textDrag.origW || 0) - padding);
                        nextH = clamp((textDrag.origH || 0) + dy, minH, rect.height - padding - textDrag.origY);
                        nextX = textDrag.origX + (textDrag.origW || 0) - nextW;
                        break;
                      case "ne": // top-right
                        nextW = clamp((textDrag.origW || 0) + dx, minW, rect.width - padding - textDrag.origX);
                        nextH = clamp((textDrag.origH || 0) - dy, minH, textDrag.origY + (textDrag.origH || 0) - padding);
                        nextY = textDrag.origY + (textDrag.origH || 0) - nextH;
                        break;
                      case "nw": // top-left
                        nextW = clamp((textDrag.origW || 0) - dx, minW, textDrag.origX + (textDrag.origW || 0) - padding);
                        nextH = clamp((textDrag.origH || 0) - dy, minH, textDrag.origY + (textDrag.origH || 0) - padding);
                        nextX = textDrag.origX + (textDrag.origW || 0) - nextW;
                        nextY = textDrag.origY + (textDrag.origH || 0) - nextH;
                        break;
                      case "n": // top
                        nextH = clamp((textDrag.origH || 0) - dy, minH, textDrag.origY + (textDrag.origH || 0) - padding);
                        nextY = textDrag.origY + (textDrag.origH || 0) - nextH;
                        break;
                      case "s": // bottom
                        nextH = clamp((textDrag.origH || 0) + dy, minH, rect.height - padding - textDrag.origY);
                        break;
                      case "w": // left
                        nextW = clamp((textDrag.origW || 0) - dx, minW, textDrag.origX + (textDrag.origW || 0) - padding);
                        nextX = textDrag.origX + (textDrag.origW || 0) - nextW;
                        break;
                      case "e": // right
                        nextW = clamp((textDrag.origW || 0) + dx, minW, rect.width - padding - textDrag.origX);
                        break;
                    }
                    
                    updateSelectedText({ x: nextX, y: nextY, w: nextW, h: nextH });
                    return;
                  }
                }

                // Handle asset drag
                if (tool === "asset" && assetDrag) {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  const x = e.clientX - rect.left;
                  const y = e.clientY - rect.top;

                  const current = assetElements.find((a) => a.id === selectedAssetId);
                  if (!current) return;

                  if (assetDrag.type === "move") {
                    const dx = x - assetDrag.startX;
                    const dy = y - assetDrag.startY;
                    updateSelectedAsset({
                      x: clamp(assetDrag.origX + dx, padding, rect.width - padding - current.w),
                      y: clamp(assetDrag.origY + dy, padding, rect.height - padding - current.h),
                    });
                    return;
                  }

                  if (assetDrag.type === "resize") {
                    const dx = x - assetDrag.startX;
                    const dy = y - assetDrag.startY;
                    const minW = 40;
                    const minH = 40;
                    const handle = assetDrag.handle || "se";
                    
                    let nextW = assetDrag.origW || 0;
                    let nextH = assetDrag.origH || 0;
                    let nextX = assetDrag.origX;
                    let nextY = assetDrag.origY;
                    
                    switch (handle) {
                      case "se":
                        nextW = clamp((assetDrag.origW || 0) + dx, minW, rect.width - padding - assetDrag.origX);
                        nextH = clamp((assetDrag.origH || 0) + dy, minH, rect.height - padding - assetDrag.origY);
                        break;
                      case "sw":
                        nextW = clamp((assetDrag.origW || 0) - dx, minW, assetDrag.origX + (assetDrag.origW || 0) - padding);
                        nextH = clamp((assetDrag.origH || 0) + dy, minH, rect.height - padding - assetDrag.origY);
                        nextX = assetDrag.origX + (assetDrag.origW || 0) - nextW;
                        break;
                      case "ne":
                        nextW = clamp((assetDrag.origW || 0) + dx, minW, rect.width - padding - assetDrag.origX);
                        nextH = clamp((assetDrag.origH || 0) - dy, minH, assetDrag.origY + (assetDrag.origH || 0) - padding);
                        nextY = assetDrag.origY + (assetDrag.origH || 0) - nextH;
                        break;
                      case "nw":
                        nextW = clamp((assetDrag.origW || 0) - dx, minW, assetDrag.origX + (assetDrag.origW || 0) - padding);
                        nextH = clamp((assetDrag.origH || 0) - dy, minH, assetDrag.origY + (assetDrag.origH || 0) - padding);
                        nextX = assetDrag.origX + (assetDrag.origW || 0) - nextW;
                        nextY = assetDrag.origY + (assetDrag.origH || 0) - nextH;
                        break;
                      case "n":
                        nextH = clamp((assetDrag.origH || 0) - dy, minH, assetDrag.origY + (assetDrag.origH || 0) - padding);
                        nextY = assetDrag.origY + (assetDrag.origH || 0) - nextH;
                        break;
                      case "s":
                        nextH = clamp((assetDrag.origH || 0) + dy, minH, rect.height - padding - assetDrag.origY);
                        break;
                      case "w":
                        nextW = clamp((assetDrag.origW || 0) - dx, minW, assetDrag.origX + (assetDrag.origW || 0) - padding);
                        nextX = assetDrag.origX + (assetDrag.origW || 0) - nextW;
                        break;
                      case "e":
                        nextW = clamp((assetDrag.origW || 0) + dx, minW, rect.width - padding - assetDrag.origX);
                        break;
                    }
                    
                    updateSelectedAsset({ x: nextX, y: nextY, w: nextW, h: nextH });
                    return;
                  }
                }
                                
                // Handle rotation
                if (rotationDrag) {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (!rect) return;
                  
                  const mouseX = e.clientX - rect.left;
                  const mouseY = e.clientY - rect.top;
                  
                  const currentAngle = Math.atan2(mouseY - rotationDrag.centerY, mouseX - rotationDrag.centerX) * 180 / Math.PI;
                  let rotationDelta = currentAngle - rotationDrag.startAngle;
                  
                  // Snap to 15-degree increments if shift is held
                  if (e.shiftKey) {
                    rotationDelta = Math.round(rotationDelta / 15) * 15;
                  }
                  
                  const newRotation = rotationDrag.currentRotation + rotationDelta;
                  
                  // Apply rotation to the selected object
                  if (tool === "bubble" && effectiveSelectedBubbleId) {
                    updateSelectedBubble({ rotation: newRotation });
                  } else if (tool === "text" && selectedTextId) {
                    updateSelectedText({ rotation: newRotation });
                  } else if (tool === "asset" && selectedAssetId) {
                    updateSelectedAsset({ rotation: newRotation });
                  }
                  
                  // Update rotation drag state
                  setRotationDrag({
                    ...rotationDrag,
                    startAngle: currentAngle,
                    currentRotation: newRotation
                  });
                }
              }}
              onMouseUp={() => {
                setBubbleDrag(null);
                setTextDrag(null);
                setAssetDrag(null);
                setRotationDrag(null);
              }}
              onMouseLeave={() => {
                setBubbleDrag(null);
                setTextDrag(null);
                setAssetDrag(null);
                setRotationDrag(null);
              }}
              onClick={(e) => {
                // Deselect all objects if clicking on empty canvas
                if (e.target === e.currentTarget) {
                  setSelectedBubbleId(null);
                  setSelectedTextId(null);
                  setSelectedAssetId(null);
                }
              }}
            >
              {/* Snap margins guides */}
              {tool === "bubble" && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-[18px] top-[18px] right-[18px] bottom-[18px] border border-white/10 rounded-xl" />
                </div>
              )}

              {/* Thought bubble trailing circles overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {panelBubbles.filter(b => !hiddenObjectIds.has(b.id)).map((b) => {
                  if (b.bubbleType !== "thought" || b.tailMode === "none") return null;
                  const e = bubbleEllipse(b.w, b.h);
                  const dir = b.tailDir;
                  let startX = b.x + e.cx;
                  let startY = b.y + e.cy + e.ry;
                  let dx = 0, dy = 1;
                  if (dir === "bottom-left") { startX = b.x + e.cx - 20; dx = -0.6; dy = 1; }
                  else if (dir === "bottom-right") { startX = b.x + e.cx + 20; dx = 0.6; dy = 1; }
                  else if (dir === "left") { startX = b.x + e.cx - e.rx; startY = b.y + e.cy + 12; dx = -1; dy = 0.4; }
                  else if (dir === "right") { startX = b.x + e.cx + e.rx; startY = b.y + e.cy + 12; dx = 1; dy = 0.4; }
                  const nl = Math.hypot(dx, dy);
                  const ux = dx / nl;
                  const uy = dy / nl;
                  return (
                    <g key={`thought-dots-${b.id}`}>
                      <circle cx={startX + ux * 14} cy={startY + uy * 14} r={10} fill="#fff" stroke="#1a1a1a" strokeWidth={2} />
                      <circle cx={startX + ux * 36} cy={startY + uy * 36} r={7} fill="#fff" stroke="#1a1a1a" strokeWidth={2} />
                      <circle cx={startX + ux * 52} cy={startY + uy * 52} r={4.5} fill="#fff" stroke="#1a1a1a" strokeWidth={2} />
                    </g>
                  );
                })}
              </svg>

              {/* Rotation angle display */}
              {rotationDrag && (
                <div 
                  className="absolute bg-black/80 text-white px-2 py-1 rounded text-xs font-mono pointer-events-none z-50"
                  style={{
                    left: rotationDrag.centerX,
                    top: rotationDrag.centerY - 40,
                    transform: "translateX(-50%)"
                  }}
                >
                  {Math.round(rotationDrag.currentRotation)}°
                </div>
              )}

              {/* Action buttons for selected objects - REMOVED - now on individual objects */}

              {panelBubbles.filter(b => !hiddenObjectIds.has(b.id)).map((b) => {
                const seed = b.id;
                const font = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;
                const isSelected = b.id === effectiveSelectedBubbleId;
                const dashed = b.bubbleType === "whisper";
                const hasTail = b.tailMode !== "none" && b.bubbleType !== "shout" && b.bubbleType !== "sfx";
                const e = bubbleEllipse(b.w, b.h);
                const sw = 2.5; // stroke width for all bubbles
                const whisperSw = 3.5; // thicker stroke for whisper visibility
                const whisperStroke = "#333"; // darker border for whisper
                const whisperDash = "10 8"; // larger gaps for whisper
                
                // Color flip logic
                const isFlipped = b.flippedColors || false;
                const fillColor = isFlipped ? "#000000" : "#ffffff";
                const strokeColor = isFlipped ? "#ffffff" : "#1a1a1a";
                const textColor = isFlipped ? "#ffffff" : "#111111";

                return (
                  <div
                    key={b.id}
                    className="absolute"
                    style={{
                      left: b.x,
                      top: b.y,
                      width: b.w,
                      height: b.h,
                      filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
                      transform: `rotate(${b.rotation || 0}deg) scaleX(${b.flipX ? -1 : 1}) scaleY(${b.flipY ? -1 : 1})`,
                      transformOrigin: "center",
                    }}
                  >
                    <svg
                      width={b.w}
                      height={b.h}
                      viewBox={`0 0 ${b.w} ${b.h}`}
                      className="absolute inset-0"
                      style={{ shapeRendering: "geometricPrecision", overflow: "visible", cursor: "pointer" }}
                      onClick={(e) => {
                        if (e.ctrlKey || e.metaKey) { toggleMultiSelect(b.id, true); return; }
                        setSelectedBubbleId(b.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setSelectedIds(new Set([b.id]));
                        setTool("bubble");
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                        if (e.ctrlKey || e.metaKey) { toggleMultiSelect(b.id, true); return; }
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const x = e.clientX - rect.left;
                        const y = e.clientY - rect.top;
                        
                        setSelectedBubbleId(b.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setSelectedIds(new Set([b.id]));
                        setTool("bubble");
                        saveHistory();
                        setBubbleDrag({
                          type: "move",
                          startX: x,
                          startY: y,
                          origX: b.x,
                          origY: b.y,
                        });
                      }}
                    >
                      <defs>
                        <pattern id={`dots-${b.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                          <circle cx="1.5" cy="1.5" r="1.1" fill="#000" opacity="0.12" />
                        </pattern>
                      </defs>
                      {b.bubbleType === "thought" ? (
                        <>
                          {/* Cloud: outline → fill */}
                          <path d={cloudPath(b.w, b.h)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                          <path d={cloudPath(b.w, b.h)} fill={fillColor} stroke="none" />
                        </>
                      ) : b.bubbleType === "oval" ? (
                        <>
                          {/* Oval bubble: simple ellipse */}
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" />
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                        </>
                      ) : b.bubbleType === "speechRough" ? (
                        <>
                          <path d={roughEllipsePath(b.w, b.h, seed)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <path d={roughEllipsePath(b.w, b.h, seed)} fill={fillColor} stroke="none" />
                        </>
                      ) : b.bubbleType === "speechHalftone" ? (
                        <>
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} />
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill={`url(#dots-${b.id})`}
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              fillOpacity={0.86}
                              stroke="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={`url(#dots-${b.id})`} stroke="none" />
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} opacity={0.86} stroke="none" />
                        </>
                      ) : b.bubbleType === "shout" ? (
                        <polygon
                          points={burstPoints(b.w, b.h, 12, seed)
                            .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
                            .join(" ")}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={sw}
                          strokeLinejoin="miter"
                        />
                      ) : b.bubbleType === "sfx" ? (
                        <polygon
                          points={burstPoints(b.w, b.h, 18, seed, true)
                            .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
                            .join(" ")}
                          fill={fillColor}
                          stroke={strokeColor}
                          strokeWidth={2.8}
                          strokeLinejoin="miter"
                        />
                      ) : b.bubbleType === "rectRound" ? (
                        <>
                          {/* rectRound: 1)tail+stroke behind → 2)rect fill → 3)tail fill-only → 4)outline with gap */}
                          {hasTail && (
                            <path
                              d={rectTailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={20} ry={20} fill={fillColor} stroke="none" />
                          {hasTail && (
                            <path
                              d={rectTailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke="none"
                            />
                          )}
                          {hasTail ? (
                            <path
                              d={rectOutlinePathWithGap(
                                b.w, b.h, 20,
                                b.tailDir === "left" ? "left" : b.tailDir === "right" ? "right" : "bottom",
                                b.tailDir === "left" || b.tailDir === "right" ? b.h * 0.6 : b.w * (b.tailDir === "bottom-left" ? 0.2 : 0.8),
                                36
                              )}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : (
                            <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={20} ry={20} fill="none" stroke={strokeColor} strokeWidth={sw} />
                          )}
                        </>
                      ) : b.bubbleType === "rect" ? (
                        <>
                          {/* rect: 1)tail+stroke behind → 2)rect fill → 3)tail fill-only → 4)outline with gap */}
                          {hasTail && (
                            <path
                              d={rectTailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={2} ry={2} fill={fillColor} stroke="none" />
                          {hasTail && (
                            <path
                              d={rectTailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke="none"
                            />
                          )}
                          {hasTail ? (
                            <path
                              d={rectOutlinePathWithGap(
                                b.w, b.h, 2,
                                b.tailDir === "left" ? "left" : b.tailDir === "right" ? "right" : "bottom",
                                b.tailDir === "left" || b.tailDir === "right" ? b.h * 0.6 : b.w * (b.tailDir === "bottom-left" ? 0.2 : 0.8),
                                36
                              )}
                              fill="none"
                              stroke={strokeColor}
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          ) : (
                            <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={2} ry={2} fill="none" stroke={strokeColor} strokeWidth={sw} />
                          )}
                        </>
                      ) : (
                        <>
                          {/* Ellipse: outline → tail behind → fill on top */}
                          <ellipse
                            cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
                            fill="none" stroke={dashed ? whisperStroke : strokeColor} strokeWidth={dashed ? whisperSw : sw}
                            strokeDasharray={dashed ? whisperDash : undefined}
                            strokeLinecap={dashed ? "round" : undefined}
                          />
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill={fillColor}
                              stroke={dashed ? whisperStroke : strokeColor}
                              strokeWidth={dashed ? whisperSw : sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={dashed ? whisperDash : undefined}
                            />
                          )}
                          <ellipse
                            cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
                            fill={fillColor} stroke="none"
                          />
                        </>
                      )}

                      {/* Selection highlight */}
                      {isSelected && (
                        <rect
                          x={2} y={2}
                          width={b.w - 4} height={b.h - 4}
                          rx={b.bubbleType === "rect" || b.bubbleType === "rectRound" ? 14 : 18}
                          ry={b.bubbleType === "rect" || b.bubbleType === "rectRound" ? 14 : 18}
                          fill="none"
                          stroke="rgba(16,185,129,0.65)"
                          strokeWidth={2}
                          strokeDasharray="6 4"
                        />
                      )}
                    </svg>

                    {/* Text layer */}
                    <div
                      className="absolute inset-0 flex items-center justify-center"
                      contentEditable={isSelected}
                      suppressContentEditableWarning={true}
                      style={{
                        padding: b.bubbleType === "rect" || b.bubbleType === "rectRound" ? "12px 16px" : "16px 24px",
                        fontSize: font,
                        lineHeight: 1.3,
                        color: textColor,
                        overflowWrap: "anywhere",
                        whiteSpace: "pre-wrap",
                        textAlign: "center",
                        fontFamily: "'Comic Sans MS', 'Bangers', 'Segoe UI', sans-serif",
                        fontWeight: b.bubbleType === "sfx" || b.bubbleType === "shout" ? 900 : 400,
                        letterSpacing: b.bubbleType === "sfx" ? "0.06em" : b.bubbleType === "shout" ? "0.02em" : "0em",
                        fontStyle: b.bubbleType === "whisper" ? "italic" : "normal",
                        WebkitFontSmoothing: "antialiased",
                        textRendering: "optimizeLegibility",
                        pointerEvents: isSelected ? "auto" : "none",
                      }}
                      onBlur={(e) => {
                        updateSelectedBubble({ text: e.currentTarget.textContent || "" });
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedBubbleId(b.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setTool("bubble");
                      }}
                      onDoubleClick={(e) => {
                        e.stopPropagation();
                        setSelectedBubbleId(b.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setTool("bubble");
                        e.currentTarget.focus();
                        // Select all text
                        const range = document.createRange();
                        range.selectNodeContents(e.currentTarget);
                        const selection = window.getSelection();
                        selection?.removeAllRanges();
                        selection?.addRange(range);
                      }}
                    >
                      {b.text}
                    </div>

                    <ResizeHandles
                      isSelected={isSelected}
                      onResizeStart={(handle, event) => {
                        setSelectedBubbleId(b.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setTool("bubble");
                        
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        
                        setBubbleDrag({
                          type: "resize",
                          handle: handle as any,
                          startX: x,
                          startY: y,
                          orig: b,
                        });
                      }}
                      onRotateStart={(event) => {
                        setSelectedBubbleId(b.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setTool("bubble");
                        setSelectedBubbleId(b.id);
                        
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        
                        const centerX = b.x + b.w / 2;
                        const centerY = b.y + b.h / 2;
                        const mouseX = event.clientX - rect.left;
                        const mouseY = event.clientY - rect.top;
                        
                        const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
                        
                        setRotationDrag({
                          startX: event.clientX,
                          startY: event.clientY,
                          startAngle: startAngle,
                          centerX: centerX,
                          centerY: centerY,
                          currentRotation: b.rotation || 0
                        });
                      }}
                      accentColor="emerald"
                    />

                    {/* Action buttons for selected bubble */}
                    {isSelected && (
                      <div 
                        className="absolute bg-black/80 backdrop-blur-sm rounded-lg p-2 flex gap-2 z-40"
                        style={{
                          top: -50,
                          left: "50%",
                          transform: "translateX(-50%)"
                        }}
                      >
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            const newBubble = { ...b, id: `b-${Date.now()}`, x: b.x + 20, y: b.y + 20 };
                            setBubbles([...bubbles, newBubble]);
                            setSelectedBubbleId(newBubble.id);
                          }}
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            deleteSelectedBubble();
                          }}
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedBubble({ flipX: !b.flipX });
                          }}
                          title="Flip Horizontal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedBubble({ flipY: !b.flipY });
                          }}
                          title="Flip Vertical"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedBubble({ rotation: 0, flipX: false, flipY: false });
                          }}
                          title="Reset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Text Elements */}
              {panelTextElements.filter(t => !hiddenObjectIds.has(t.id)).map((textEl) => {
                const isSelected = textEl.id === selectedTextId;
                return (
                  <div
                    key={textEl.id}
                    className="absolute"
                    style={{
                      left: textEl.x,
                      top: textEl.y,
                      width: textEl.w,
                      height: textEl.h,
                      cursor: tool === "text" ? "move" : "default",
                      transform: `rotate(${textEl.rotation || 0}deg) scaleX(${textEl.flipX ? -1 : 1}) scaleY(${textEl.flipY ? -1 : 1})`,
                      transformOrigin: "center",
                    }}
                    onMouseDown={(e) => {
                      if (e.ctrlKey || e.metaKey) { toggleMultiSelect(textEl.id, true); return; }
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      setSelectedTextId(textEl.id);
                      setSelectedBubbleId(null);
                      setSelectedAssetId(null);
                      setSelectedIds(new Set([textEl.id]));
                      setTool("text");
                      setTextDrag({
                        type: "move",
                        startX: x,
                        startY: y,
                        origX: textEl.x,
                        origY: textEl.y,
                      });
                    }}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) return;
                      setSelectedTextId(textEl.id);
                      setSelectedBubbleId(null);
                      setSelectedAssetId(null);
                      setSelectedIds(new Set([textEl.id]));
                      setTool("text");
                    }}
                  >
                    <div
                      contentEditable={isSelected}
                      suppressContentEditableWarning={true}
                      style={{
                        width: "100%",
                        height: "100%",
                        fontSize: textEl.fontSize,
                        fontWeight: textEl.fontWeight,
                        fontStyle: textEl.fontStyle,
                        fontFamily: textEl.fontFamily,
                        color: textEl.color,
                        border: "none",
                        backgroundColor: textEl.backgroundColor || "transparent",
                        padding: "4px",
                        outline: isSelected ? "2px dashed rgba(147, 51, 234, 0.5)" : "none",
                        lineHeight: 1.3,
                        overflow: "hidden",
                        wordWrap: "break-word",
                        textShadow: (textEl.borderWidth || 0) > 0 
                          ? `-${textEl.borderWidth || 0}px 0 0 ${textEl.borderColor || "#000000"}, ${(textEl.borderWidth || 0)}px 0 0 ${textEl.borderColor || "#000000"}, 0 -${textEl.borderWidth || 0}px 0 ${textEl.borderColor || "#000000"}, 0 ${(textEl.borderWidth || 0)}px 0 ${textEl.borderColor || "#000000"}`
                          : "none",
                      }}
                      onBlur={(e) => {
                        updateSelectedText({ text: e.currentTarget.textContent || "" });
                      }}
                      onDoubleClick={(e) => {
                        if (tool === "text") {
                          setSelectedTextId(textEl.id);
                          e.currentTarget.focus();
                          // Select all text
                          const range = document.createRange();
                          range.selectNodeContents(e.currentTarget);
                          const selection = window.getSelection();
                          selection?.removeAllRanges();
                          selection?.addRange(range);
                        }
                      }}
                    >
                      {textEl.text}
                    </div>

                    <ResizeHandles
                      isSelected={isSelected}
                      onResizeStart={(handle, event) => {
                        setSelectedTextId(textEl.id);
                        setSelectedBubbleId(null);
                        setSelectedAssetId(null);
                        setTool("text");
                        
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        
                        setTextDrag({
                          type: "resize",
                          handle: handle as any,
                          startX: x,
                          startY: y,
                          origX: textEl.x,
                          origY: textEl.y,
                          origW: textEl.w,
                          origH: textEl.h,
                        });
                      }}
                      onRotateStart={(event) => {
                        setSelectedTextId(textEl.id);
                        setSelectedBubbleId(null);
                        setSelectedAssetId(null);
                        setTool("text");
                        
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        
                        const centerX = textEl.x + textEl.w / 2;
                        const centerY = textEl.y + textEl.h / 2;
                        const mouseX = event.clientX - rect.left;
                        const mouseY = event.clientY - rect.top;
                        
                        const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
                        
                        setRotationDrag({
                          startX: event.clientX,
                          startY: event.clientY,
                          startAngle: startAngle,
                          centerX: centerX,
                          centerY: centerY,
                          currentRotation: textEl.rotation || 0
                        });
                      }}
                      accentColor="purple"
                    />

                    {/* Action buttons for selected text */}
                    {isSelected && (
                      <div 
                        className="absolute bg-black/80 backdrop-blur-sm rounded-lg p-2 flex gap-2 z-40"
                        style={{
                          top: -50,
                          left: "50%",
                          transform: "translateX(-50%)"
                        }}
                      >
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            const newText = { ...textEl, id: `t-${Date.now()}`, x: textEl.x + 20, y: textEl.y + 20 };
                            setTextElements([...textElements, newText]);
                            setSelectedTextId(newText.id);
                          }}
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            deleteSelectedText();
                          }}
                          title="Delete"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedText({ flipX: !textEl.flipX });
                          }}
                          title="Flip Horizontal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedText({ flipY: !textEl.flipY });
                          }}
                          title="Flip Vertical"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedText({ rotation: 0, flipX: false, flipY: false });
                          }}
                          title="Reset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

              {/* Asset Elements */}
              {panelAssetElements.filter(a => !hiddenObjectIds.has(a.id)).map((assetEl) => {
                const asset = assetLibrary.find((a) => a.id === assetEl.assetId);
                if (!asset) return null;
                const isSelected = assetEl.id === selectedAssetId;
                return (
                  <div
                    key={assetEl.id}
                    className="absolute"
                    style={{
                      left: assetEl.x,
                      top: assetEl.y,
                      width: assetEl.w,
                      height: assetEl.h,
                      cursor: tool === "asset" ? "move" : "default",
                      transform: `rotate(${assetEl.rotation || 0}deg) scaleX(${assetEl.flipX ? -1 : 1}) scaleY(${assetEl.flipY ? -1 : 1})`,
                      transformOrigin: "center",
                    }}
                    onMouseDown={(e) => {
                      if (e.ctrlKey || e.metaKey) { toggleMultiSelect(assetEl.id, true); return; }
                      const rect = containerRef.current?.getBoundingClientRect();
                      if (!rect) return;
                      const x = e.clientX - rect.left;
                      const y = e.clientY - rect.top;
                      
                      setSelectedAssetId(assetEl.id);
                      setSelectedBubbleId(null);
                      setSelectedTextId(null);
                      setSelectedIds(new Set([assetEl.id]));
                      setTool("asset");
                      setAssetDrag({
                        type: "move",
                        startX: x,
                        startY: y,
                        origX: assetEl.x,
                        origY: assetEl.y,
                      });
                    }}
                    onClick={(e) => {
                      if (e.ctrlKey || e.metaKey) return;
                      setSelectedAssetId(assetEl.id);
                      setSelectedBubbleId(null);
                      setSelectedTextId(null);
                      setSelectedIds(new Set([assetEl.id]));
                      setTool("asset");
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={asset.url}
                      alt={asset.name}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        outline: isSelected ? "2px dashed rgba(251, 146, 60, 0.5)" : "none",
                        pointerEvents: "none",
                      }}
                    />

                    <ResizeHandles
                      isSelected={isSelected}
                      onResizeStart={(handle, event) => {
                        setSelectedAssetId(assetEl.id);
                        setSelectedBubbleId(null);
                        setSelectedTextId(null);
                        setTool("asset");
                        
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        const x = event.clientX - rect.left;
                        const y = event.clientY - rect.top;
                        
                        setAssetDrag({
                          type: "resize",
                          handle: handle as "se" | "sw" | "ne" | "nw" | "n" | "s" | "w" | "e",
                          startX: x,
                          startY: y,
                          origX: assetEl.x,
                          origY: assetEl.y,
                          origW: assetEl.w,
                          origH: assetEl.h,
                        });
                      }}
                      onRotateStart={(event) => {
                        setSelectedAssetId(assetEl.id);
                        setSelectedBubbleId(null);
                        setSelectedTextId(null);
                        setTool("asset");
                        
                        const rect = containerRef.current?.getBoundingClientRect();
                        if (!rect) return;
                        
                        const centerX = assetEl.x + assetEl.w / 2;
                        const centerY = assetEl.y + assetEl.h / 2;
                        const mouseX = event.clientX - rect.left;
                        const mouseY = event.clientY - rect.top;
                        
                        const startAngle = Math.atan2(mouseY - centerY, mouseX - centerX) * 180 / Math.PI;
                        
                        setRotationDrag({
                          startX: mouseX,
                          startY: mouseY,
                          startAngle,
                          centerX,
                          centerY,
                          currentRotation: assetEl.rotation || 0
                        });
                      }}
                      accentColor="orange"
                    />

                    {isSelected && (
                      <div className="absolute -top-12 left-1/2 -translate-x-1/2 flex gap-1 bg-black/80 backdrop-blur-sm rounded-lg p-1 border border-orange-500/30">
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            const newAsset = { ...assetEl, id: makeId() };
                            setAssetElements((prev) => [...prev, newAsset]);
                            setSelectedAssetId(newAsset.id);
                          }}
                          title="Duplicate"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-red-500/20 rounded flex items-center justify-center text-white hover:text-red-300 transition-colors"
                          onClick={() => deleteSelectedAsset()}
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        
                        <div className="w-px bg-white/20 my-1" />
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedAsset({ flipX: !assetEl.flipX });
                          }}
                          title="Flip Horizontal"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedAsset({ flipY: !assetEl.flipY });
                          }}
                          title="Flip Vertical"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                          </svg>
                        </button>
                        
                        <button
                          className="w-8 h-8 bg-white/10 hover:bg-white/20 rounded flex items-center justify-center text-white transition-colors"
                          onClick={() => {
                            updateSelectedAsset({ rotation: 0, flipX: false, flipY: false });
                          }}
                          title="Reset"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}

            </div>

            {/* Snap guide lines */}
            {snapLines.map((sl, i) => (
              <div key={i} className="absolute pointer-events-none z-50" style={{
                ...(sl.x !== undefined ? { left: sl.x, top: 0, width: 1, height: "100%", backgroundColor: "rgba(255,0,128,0.6)" } : {}),
                ...(sl.y !== undefined ? { left: 0, top: sl.y, width: "100%", height: 1, backgroundColor: "rgba(255,0,128,0.6)" } : {}),
              }} />
            ))}
            </div>{/* end transform wrapper */}

            {/* Zoom indicator */}
            {zoom !== 1 && (
              <div className="absolute bottom-2 right-2 z-50 flex items-center gap-1 bg-black/70 rounded-lg px-2 py-1">
                <span className="text-[10px] text-gray-300 font-mono">{Math.round(zoom * 100)}%</span>
                <button onClick={() => { setZoom(1); setPanOffset({ x: 0, y: 0 }); }} className="text-[9px] text-gray-400 hover:text-white ml-1">Reset</button>
              </div>
            )}
          </div>

          {/* + Add Panel button below canvas */}
          <button onClick={addPanel}
            className="mx-auto mt-4 py-3 border-2 border-dashed border-white/10 hover:border-pink-500/30 rounded-xl text-center transition group block"
            style={{ width: "800px", maxWidth: "100%" }}>
            <div className="flex items-center justify-center gap-2">
              <Plus className="w-4 h-4 text-pink-400 group-hover:scale-110 transition-transform" />
              <span className="text-pink-400 text-xs font-semibold">+ Add Panel</span>
            </div>
          </button>
        </div>

        {/* Canva-style Vertical Sidebar + Content Panel */}

        {/* Vertical Icon Strip */}
        <div className="w-[60px] border-l border-white/10 bg-[#0a0a0f] flex flex-col items-center py-3 gap-0.5 shrink-0">
          {[
            { id: "layers" as const, icon: Layers, label: "Layers", color: "white" },
            { id: "bubbles" as const, icon: MessageSquare, label: "Bubbles", color: "emerald" },
            { id: "text" as const, icon: Type, label: "Text", color: "purple" },
            { id: "assets" as const, icon: ImageIcon, label: "Assets", color: "orange" },
            { id: "paint" as const, icon: Paintbrush, label: "Mask", color: "blue" },
            { id: "panel" as const, icon: LayoutGrid, label: "Panel", color: "pink" },
            { id: "aimanga" as const, icon: Sparkles, label: "AI Manga", color: "violet" },
          ].map(({ id, icon: Icon, label, color }) => (
            <button
              key={id}
              data-testid={`${id}-tab`}
              onClick={() => {
                setActiveTab(id);
                if (id === "bubbles") setTool("bubble");
                else if (id === "text") setTool("text");
                else if (id === "assets") setTool("asset");
                else if (id === "paint") setTool("paint");
              }}
              className={`w-[52px] py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                activeTab === id
                  ? color === "emerald" ? "bg-emerald-500/15 text-emerald-300"
                  : color === "purple" ? "bg-purple-500/15 text-purple-300"
                  : color === "orange" ? "bg-orange-500/15 text-orange-300"
                  : color === "blue" ? "bg-blue-500/15 text-blue-300"
                  : color === "pink" ? "bg-pink-500/15 text-pink-300"
                  : color === "violet" ? "bg-violet-500/15 text-violet-300"
                  : "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[9px] font-medium leading-none">{label}</span>
            </button>
          ))}
        </div>

        {/* Content Panel */}
        <div className="w-[320px] border-l border-white/10 bg-[#13131a] overflow-y-auto p-5 shrink-0">
          {activeTab === "layers" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">All Objects</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Manage all canvas elements</p>
              </div>

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-semibold">Layers</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        const allIds = [...panelBubbles.map(b => b.id), ...panelTextElements.map(t => t.id), ...panelAssetElements.map(a => a.id)];
                        const allHidden = allIds.length > 0 && allIds.every(id => hiddenObjectIds.has(id));
                        if (allHidden) {
                          setHiddenObjectIds(new Set());
                        } else {
                          setHiddenObjectIds(new Set(allIds));
                        }
                      }}
                      className="px-2 py-0.5 text-[10px] font-medium text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded transition flex items-center gap-1"
                      title={hiddenObjectIds.size > 0 ? "Show All" : "Hide All"}
                    >
                      {hiddenObjectIds.size > 0 && hiddenObjectIds.size >= panelBubbles.length + panelTextElements.length + panelAssetElements.length
                        ? <><Eye className="w-3 h-3" /> Show All</>
                        : <><EyeOff className="w-3 h-3" /> Hide All</>
                      }
                    </button>
                    <span className="text-[10px] text-gray-500 font-mono">
                      {panelBubbles.length + panelTextElements.length + panelAssetElements.length}
                    </span>
                  </div>
                </div>
                
                <div className="space-y-1 max-h-96 overflow-y-auto">
                  {/* Bubbles */}
                  {panelBubbles.map((bubble, index) => {
                    const grp = findGroup(bubble.id);
                    return (
                    <div
                      key={bubble.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                        effectiveSelectedBubbleId === bubble.id
                          ? "bg-emerald-500/20 border border-emerald-500/30"
                          : selectedIds.has(bubble.id)
                          ? "bg-emerald-500/10 border border-emerald-500/20"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={(e) => {
                        if (e.shiftKey) { toggleMultiSelect(bubble.id, true); return; }
                        setSelectedBubbleId(bubble.id);
                        setSelectedTextId(null);
                        setSelectedAssetId(null);
                        setTool("bubble");
                        setActiveTab("bubbles");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-emerald-500" />
                        <span className={`text-xs ${hiddenObjectIds.has(bubble.id) ? "text-gray-600 line-through" : "text-gray-300"}`}>Bubble {index + 1}</span>
                        <span className="text-[10px] text-gray-500">({bubble.bubbleType})</span>
                        {grp && <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-1 rounded">G</span>}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); bringToFront(bubble.id); }}
                          className="p-0.5 text-gray-600 hover:text-gray-300 transition" title="Bring to Front">
                          <ChevronLeft className="w-3 h-3 rotate-90" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); sendToBack(bubble.id); }}
                          className="p-0.5 text-gray-600 hover:text-gray-300 transition" title="Send to Back">
                          <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(bubble.id); }}
                          className="p-0.5 text-gray-500 hover:text-gray-300 transition"
                          title={hiddenObjectIds.has(bubble.id) ? "Show" : "Hide"}
                        >
                          {hiddenObjectIds.has(bubble.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBubbles(bubbles.filter(b => b.id !== bubble.id));
                            if (effectiveSelectedBubbleId === bubble.id) setSelectedBubbleId(null);
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >×</button>
                      </div>
                    </div>
                    );
                  })}
                  
                  {/* Text Elements */}
                  {panelTextElements.map((textEl, index) => {
                    const grp = findGroup(textEl.id);
                    return (
                    <div
                      key={textEl.id}
                      className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                        selectedTextId === textEl.id
                          ? "bg-purple-500/20 border border-purple-500/30"
                          : selectedIds.has(textEl.id)
                          ? "bg-purple-500/10 border border-purple-500/20"
                          : "bg-white/5 hover:bg-white/10"
                      }`}
                      onClick={(e) => {
                        if (e.shiftKey) { toggleMultiSelect(textEl.id, true); return; }
                        setSelectedTextId(textEl.id);
                        setSelectedBubbleId(null);
                        setSelectedAssetId(null);
                        setTool("text");
                        setActiveTab("text");
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500" />
                        <span className={`text-xs ${hiddenObjectIds.has(textEl.id) ? "text-gray-600 line-through" : "text-gray-300"}`}>Text {index + 1}</span>
                        <span className="text-[10px] text-gray-500 truncate max-w-16">
                          ({textEl.text.substring(0, 8)}...)
                        </span>
                        {grp && <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-1 rounded">G</span>}
                      </div>
                      <div className="flex items-center gap-0.5">
                        <button onClick={(e) => { e.stopPropagation(); bringToFront(textEl.id); }}
                          className="p-0.5 text-gray-600 hover:text-gray-300 transition" title="Bring to Front">
                          <ChevronLeft className="w-3 h-3 rotate-90" />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); sendToBack(textEl.id); }}
                          className="p-0.5 text-gray-600 hover:text-gray-300 transition" title="Send to Back">
                          <ChevronRight className="w-3 h-3 rotate-90" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(textEl.id); }}
                          className="p-0.5 text-gray-500 hover:text-gray-300 transition"
                          title={hiddenObjectIds.has(textEl.id) ? "Show" : "Hide"}
                        >
                          {hiddenObjectIds.has(textEl.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setTextElements(textElements.filter(t => t.id !== textEl.id));
                            if (selectedTextId === textEl.id) setSelectedTextId(null);
                          }}
                          className="text-xs text-red-400 hover:text-red-300"
                        >×</button>
                      </div>
                    </div>
                    );
                  })}

                  {/* Asset Elements */}
                  {panelAssetElements.map((assetEl, index) => {
                    const asset = assetLibrary.find(a => a.id === assetEl.assetId);
                    const grp = findGroup(assetEl.id);
                    return (
                      <div
                        key={assetEl.id}
                        className={`flex items-center justify-between p-2 rounded cursor-pointer transition ${
                          selectedAssetId === assetEl.id
                            ? "bg-orange-500/20 border border-orange-500/30"
                            : selectedIds.has(assetEl.id)
                            ? "bg-orange-500/10 border border-orange-500/20"
                            : "bg-white/5 hover:bg-white/10"
                        }`}
                        onClick={(e) => {
                          if (e.shiftKey) { toggleMultiSelect(assetEl.id, true); return; }
                          setSelectedAssetId(assetEl.id);
                          setSelectedBubbleId(null);
                          setSelectedTextId(null);
                          setTool("asset");
                          setActiveTab("assets");
                        }}
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-3 h-3 rounded-full bg-orange-500" />
                          <span className={`text-xs ${hiddenObjectIds.has(assetEl.id) ? "text-gray-600 line-through" : "text-gray-300"}`}>Asset {index + 1}</span>
                          <span className="text-[10px] text-gray-500 truncate max-w-16">
                            ({asset?.name || "image"})
                          </span>
                          {grp && <span className="text-[8px] text-yellow-500 bg-yellow-500/10 px-1 rounded">G</span>}
                        </div>
                        <div className="flex items-center gap-0.5">
                          <button onClick={(e) => { e.stopPropagation(); bringToFront(assetEl.id); }}
                            className="p-0.5 text-gray-600 hover:text-gray-300 transition" title="Bring to Front">
                            <ChevronLeft className="w-3 h-3 rotate-90" />
                          </button>
                          <button onClick={(e) => { e.stopPropagation(); sendToBack(assetEl.id); }}
                            className="p-0.5 text-gray-600 hover:text-gray-300 transition" title="Send to Back">
                            <ChevronRight className="w-3 h-3 rotate-90" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); toggleObjectVisibility(assetEl.id); }}
                            className="p-0.5 text-gray-500 hover:text-gray-300 transition"
                            title={hiddenObjectIds.has(assetEl.id) ? "Show" : "Hide"}
                          >
                            {hiddenObjectIds.has(assetEl.id) ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setAssetElements(assetElements.filter(a => a.id !== assetEl.id));
                              if (selectedAssetId === assetEl.id) setSelectedAssetId(null);
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >×</button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {panelBubbles.length === 0 && panelTextElements.length === 0 && panelAssetElements.length === 0 && (
                    <div className="text-center py-8 text-gray-500 text-xs">
                      No objects yet. Use the sidebar to create bubbles, text, or assets.
                    </div>
                  )}
                </div>
                
                {/* Multi-select info */}
                {selectedIds.size > 1 && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-2 flex items-center justify-between">
                    <span className="text-[10px] text-yellow-400 font-semibold">{selectedIds.size} objects selected</span>
                    <div className="flex items-center gap-1">
                      <button onClick={() => {
                        const groupId = `group-${Date.now()}`;
                        setGroups(prev => ({ ...prev, [groupId]: Array.from(selectedIds) }));
                      }} className="px-2 py-0.5 text-[9px] bg-yellow-500/20 text-yellow-300 rounded hover:bg-yellow-500/30 transition">
                        Group (Ctrl+G)
                      </button>
                      <button onClick={() => setSelectedIds(new Set())} className="px-2 py-0.5 text-[9px] bg-white/5 text-gray-400 rounded hover:bg-white/10 transition">
                        Clear
                      </button>
                    </div>
                  </div>
                )}

                {/* Groups list */}
                {Object.keys(groups).length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Groups</span>
                    {Object.entries(groups).map(([gid, members]) => (
                      <div key={gid} className="flex items-center justify-between p-1.5 bg-yellow-500/5 border border-yellow-500/10 rounded">
                        <span className="text-[10px] text-yellow-400">{members.length} objects</span>
                        <button onClick={() => setGroups(prev => { const n = { ...prev }; delete n[gid]; return n; })}
                          className="text-[9px] text-gray-500 hover:text-red-400 transition">Ungroup</button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="text-[10px] text-gray-500 space-y-0.5">
                  <div>Click to select • Shift+Click for multi-select</div>
                  <div>▲▼ Z-order • 👁 Show/Hide • Ctrl+G Group</div>
                </div>
              </div>
            </div>
          ) : activeTab === "paint" ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-white font-bold text-lg">Mask</h2>
                  <p className="text-[11px] text-gray-500 mt-0.5">Select areas to inpaint with AI</p>
                </div>
                <button
                  onClick={() => {
                    const allIds = [...panelBubbles.map(b => b.id), ...panelTextElements.map(t => t.id), ...panelAssetElements.map(a => a.id)];
                    const allHidden = allIds.length > 0 && allIds.every(id => hiddenObjectIds.has(id));
                    if (allHidden) {
                      setHiddenObjectIds(new Set());
                    } else {
                      setHiddenObjectIds(new Set(allIds));
                    }
                  }}
                  className="px-2.5 py-1.5 text-[10px] font-semibold text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition flex items-center gap-1.5 border border-white/10"
                >
                  {hiddenObjectIds.size > 0 && hiddenObjectIds.size >= panelBubbles.length + panelTextElements.length + panelAssetElements.length
                    ? <><Eye className="w-3 h-3" /> Show Layers</>
                    : <><EyeOff className="w-3 h-3" /> Hide Layers</>
                  }
                </button>
              </div>

              {/* Brush / Eraser toggle */}
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setIsEraser(false)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 border ${
                      !isEraser
                        ? "bg-blue-500/20 border-blue-500/40 text-blue-200 shadow-sm shadow-blue-500/10"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <Paintbrush className="w-4 h-4" /> Brush
                  </button>
                  <button
                    onClick={() => setIsEraser(true)}
                    className={`px-3 py-2.5 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-2 border ${
                      isEraser
                        ? "bg-red-500/20 border-red-500/40 text-red-200 shadow-sm shadow-red-500/10"
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <Eraser className="w-4 h-4" /> Eraser
                  </button>
                </div>

                {/* Brush preview circle */}
                <div className="flex items-center justify-center py-2">
                  <div
                    className="rounded-full border-2"
                    style={{
                      width: Math.min(brushSize * 1.5, 80),
                      height: Math.min(brushSize * 1.5, 80),
                      borderColor: isEraser ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)",
                      backgroundColor: isEraser ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
                    }}
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300 font-semibold">Size</span>
                    <span className="text-xs text-blue-300 font-mono">{brushSize}px</span>
                  </div>
                  <input
                    type="range"
                    min={4}
                    max={80}
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-gray-300 font-semibold">Opacity</span>
                    <span className="text-xs text-gray-400 font-mono">{Math.round(maskOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min={0.05}
                    max={1}
                    step={0.05}
                    value={maskOpacity}
                    onChange={(e) => setMaskOpacity(Number(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-2">
                <div className="flex gap-2">
                  <button
                    onClick={undo}
                    disabled={undoStack.length === 0}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Undo
                  </button>
                  <button
                    onClick={redo}
                    disabled={redoStack.length === 0}
                    className="flex-1 px-3 py-2 bg-white/5 hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-200 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Redo
                  </button>
                </div>

                <button
                  onClick={() => {
                    commitMaskSnapshot();
                    setMask([]);
                  }}
                  disabled={mask.length === 0}
                  className="w-full px-3 py-2 bg-white/5 hover:bg-red-500/10 disabled:opacity-30 disabled:cursor-not-allowed text-gray-300 hover:text-red-300 rounded-lg text-xs font-semibold transition"
                >
                  Clear Mask
                </button>
              </div>

              {/* Inpaint prompt */}
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <label className="text-xs text-gray-300 font-semibold">Inpaint Prompt</label>
                <textarea
                  value={inpaintPrompt}
                  onChange={(e) => setInpaintPrompt(e.target.value)}
                  placeholder='e.g. "Remove the logo" or "Add sweat drops"'
                  className="w-full h-20 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
                />
                <button
                  onClick={() => {
                    console.log("Playground: Send to AI", {
                      prompt: inpaintPrompt,
                      maskDots: mask.length,
                      imageUploaded: Boolean(imageUrl),
                    });
                  }}
                  disabled={mask.length === 0 || !inpaintPrompt.trim()}
                  className="w-full px-3 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-lg text-xs font-semibold transition"
                >
                  Generate (stub)
                </button>
              </div>

              {/* Status */}
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${mask.length > 0 ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`} />
                  <span className={`text-xs font-medium ${mask.length > 0 ? "text-blue-300" : "text-gray-500"}`}>
                    {mask.length > 0 ? `${mask.length} points selected` : "No mask painted"}
                  </span>
                </div>
              </div>
            </div>
          ) : activeTab === "bubbles" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Bubble Tool</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Place & style manga speech bubbles</p>
              </div>

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-semibold">Bubbles</span>
                  <div className="flex gap-2">
                    <button onClick={addBubble} data-testid="add-bubble-btn" className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg text-xs font-semibold transition flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                    <button onClick={deleteSelectedBubble} disabled={!effectiveSelectedBubbleId} className="px-3 py-2 bg-white/5 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 hover:text-red-300 rounded-lg text-xs font-semibold transition flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {panelBubbles.map((b, idx) => (
                    <button
                      key={b.id}
                      onClick={() => setSelectedBubbleId(b.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-lg border text-left transition ${
                        b.id === effectiveSelectedBubbleId
                          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-200"
                          : "bg-[#13131a] border-white/10 text-gray-300 hover:bg-white/5"
                      }`}
                    >
                      <span className="text-xs font-semibold">Bubble {idx + 1}</span>
                      <span className="text-[10px] text-gray-500">{b.bubbleType}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <Move className="w-4 h-4" />
                  <span>Drag bubble to move</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Tail is optional — most of the time Auto is enough</span>
                </div>
                <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <div className="w-3 h-3 rounded-full bg-emerald-500" />
                  <span>Drag bottom-right handle to resize</span>
                </div>
              </div>

              {effectiveSelectedBubbleId && selectedBubble ? (
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[11px] text-gray-400">Bubble Type</label>
                      <select
                        value={selectedBubble.bubbleType}
                        onChange={(e) => updateSelectedBubble({ bubbleType: e.target.value as BubbleType })}
                        className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                      >
                        <option value="speech">Speech</option>
                        <option value="speechRough">Speech (Rough)</option>
                        <option value="speechHalftone">Speech (Halftone)</option>
                        <option value="thought">Thought</option>
                        <option value="whisper">Whisper</option>
                        <option value="shout">Shout</option>
                        <option value="sfx">SFX</option>
                        <option value="rect">Rectangle</option>
                        <option value="rectRound">Rectangle (Round)</option>
                        <option value="oval">Oval</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[11px] text-gray-400">Tail</label>
                      <select
                        value={selectedBubble.tailMode}
                        onChange={(e) => updateSelectedBubble({ tailMode: e.target.value as TailMode })}
                        className="w-full mt-1 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white focus:outline-none focus:border-emerald-500/50"
                      >
                        <option value="none">None</option>
                        <option value="auto">On</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-[11px] text-gray-400">Tail Direction</label>
                    <div className="grid grid-cols-4 gap-1 mt-1">
                      {(["bottom-left", "bottom-right", "left", "right"] as TailDir[]).map((dir) => (
                        <button
                          key={dir}
                          onClick={() => updateSelectedBubble({ tailDir: dir })}
                          className={`px-2 py-1.5 rounded text-[10px] font-semibold border transition ${
                            selectedBubble.tailDir === dir
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                              : "bg-[#13131a] border-white/10 text-gray-400 hover:bg-white/5"
                          }`}
                        >
                          {dir === "bottom-left" ? "↙ B-L" : dir === "bottom-right" ? "↘ B-R" : dir === "left" ? "← L" : "→ R"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-semibold">Auto-fit font size</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-emerald-300 font-mono">{bubbleFontSize}px</span>
                      <button
                        onClick={() => updateSelectedBubble({ autoFitFont: !(selectedBubble.autoFitFont ?? true) })}
                        className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                          selectedBubble.autoFitFont
                            ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {selectedBubble.autoFitFont ? "On" : "Off"}
                      </button>
                    </div>
                  </div>

                  {!selectedBubble.autoFitFont && (
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-300 font-semibold">Font Size</span>
                        <span className="text-xs text-gray-400 font-mono">{selectedBubble.fontSize || 15}px</span>
                      </div>
                      <input
                        type="range"
                        min={10}
                        max={44}
                        value={selectedBubble.fontSize || 15}
                        onChange={(e) => updateSelectedBubble({ fontSize: Number(e.target.value) })}
                        className="w-full accent-emerald-500 mt-2"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-semibold">Flip Colors</span>
                    <button
                      onClick={() => updateSelectedBubble({ flippedColors: !selectedBubble.flippedColors })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                        selectedBubble.flippedColors
                          ? "bg-blue-500/15 border-blue-500/30 text-blue-200"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {selectedBubble.flippedColors ? "Flipped" : "Normal"}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4">
                  <p className="text-xs text-gray-400 text-center">Select a bubble to edit its properties</p>
                </div>
              )}

              <div className="text-[11px] text-gray-500">
                Snaps inside the safe margin box (18px). Text wraps automatically and font size adapts to the bubble size.
              </div>

              {/* Bubble Presets Library */}
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Quick Presets</span>
                  {effectiveSelectedBubbleId && selectedBubble && (
                    <button onClick={() => {
                      const preset = { bubbleType: selectedBubble.bubbleType, tailMode: selectedBubble.tailMode, tailDir: selectedBubble.tailDir, flippedColors: selectedBubble.flippedColors, fontSize: selectedBubble.fontSize, autoFitFont: selectedBubble.autoFitFont, w: selectedBubble.w, h: selectedBubble.h };
                      setBubblePresets(prev => [...prev, { id: `preset-${Date.now()}`, name: `${selectedBubble.bubbleType} preset`, ...preset }]);
                    }} className="text-[9px] text-emerald-400 hover:text-emerald-300 transition">+ Save Current</button>
                  )}
                </div>
                <div className="grid grid-cols-3 gap-1">
                  {[
                    { label: "Speech", type: "speech" as BubbleType, tail: "auto" as TailMode },
                    { label: "Thought", type: "thought" as BubbleType, tail: "none" as TailMode },
                    { label: "Shout", type: "shout" as BubbleType, tail: "none" as TailMode },
                    { label: "Whisper", type: "whisper" as BubbleType, tail: "auto" as TailMode },
                    { label: "SFX", type: "sfx" as BubbleType, tail: "none" as TailMode },
                    { label: "Rect", type: "rectRound" as BubbleType, tail: "auto" as TailMode },
                  ].map(p => (
                    <button key={p.label} onClick={() => {
                      saveHistory();
                      const rect = containerRef.current?.getBoundingClientRect();
                      const id = makeId();
                      const w = 240; const h = 110;
                      const x = rect ? clamp(Math.random() * (rect.width - w - 40) + 20, padding, rect.width - padding - w) : 200;
                      const y = rect ? clamp(Math.random() * (rect.height - h - 40) + 20, padding, rect.height - padding - h) : 100;
                      setBubbles(prev => [...prev, { id, panelId: selectedPanelId!, x, y, w, h, tailMode: p.tail, tailDir: "bottom-left" as TailDir, tailX: x + w * 0.3, tailY: y + h + 20, text: p.label === "SFX" ? "BOOM!" : "...", bubbleType: p.type, autoFitFont: true, fontSize: 16 }]);
                      setSelectedBubbleId(id);
                    }} className="p-1.5 bg-[#1a1a24] border border-white/10 hover:border-emerald-500/30 rounded text-[9px] text-gray-300 hover:text-white transition text-center">
                      {p.label}
                    </button>
                  ))}
                </div>
                {bubblePresets.length > 0 && (
                  <div className="space-y-1 mt-1">
                    <span className="text-[9px] text-gray-600">Saved presets:</span>
                    {bubblePresets.map(p => (
                      <div key={p.id} className="flex items-center justify-between p-1 bg-[#1a1a24] rounded border border-white/5">
                        <span className="text-[9px] text-gray-400">{p.name}</span>
                        <button onClick={() => setBubblePresets(prev => prev.filter(x => x.id !== p.id))} className="text-[8px] text-gray-600 hover:text-red-400">×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {imageUrl && (
                <button
                  onClick={() => setImageUrl(null)}
                  className="w-full px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg text-xs font-semibold transition"
                >
                  Remove uploaded image
                </button>
              )}
            </div>
          ) : activeTab === "text" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Text Tool</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Add & style standalone text elements</p>
              </div>

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-semibold">Text Elements</span>
                  <div className="flex gap-2">
                    <button onClick={addTextElement} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg text-xs font-semibold transition flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                    <button onClick={deleteSelectedText} disabled={!selectedTextId} className="px-3 py-2 bg-white/5 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 hover:text-red-300 rounded-lg text-xs font-semibold transition flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>

                {selectedTextId && (
                  <>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-300 font-semibold">Font Size</span>
                        <span className="text-xs text-purple-300 font-mono">
                          {textElements.find(t => t.id === selectedTextId)?.fontSize || 24}px
                        </span>
                      </div>
                      <input
                        type="range"
                        min={12}
                        max={72}
                        value={textElements.find(t => t.id === selectedTextId)?.fontSize || 24}
                        onChange={(e) => updateSelectedText({ fontSize: Number(e.target.value) })}
                        className="w-full accent-purple-500"
                      />
                    </div>

                    <div>
                      <span className="text-xs text-gray-300 font-semibold">Font Weight</span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => updateSelectedText({ fontWeight: "400" })}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                            textElements.find(t => t.id === selectedTextId)?.fontWeight === "400"
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => updateSelectedText({ fontWeight: "700" })}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                            textElements.find(t => t.id === selectedTextId)?.fontWeight === "700"
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          Bold
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-300 font-semibold">Font Style</span>
                      <div className="grid grid-cols-2 gap-2 mt-1">
                        <button
                          onClick={() => updateSelectedText({ fontStyle: "normal" })}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                            textElements.find(t => t.id === selectedTextId)?.fontStyle === "normal"
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          Normal
                        </button>
                        <button
                          onClick={() => updateSelectedText({ fontStyle: "italic" })}
                          className={`px-2 py-1.5 rounded text-xs font-medium transition ${
                            textElements.find(t => t.id === selectedTextId)?.fontStyle === "italic"
                              ? "bg-purple-500/20 border-purple-500/40 text-purple-200"
                              : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                          }`}
                        >
                          Italic
                        </button>
                      </div>
                    </div>

                    <div>
                      <span className="text-xs text-gray-300 font-semibold">Font Family</span>
                      <select
                        value={textElements.find(t => t.id === selectedTextId)?.fontFamily || "Arial"}
                        onChange={(e) => updateSelectedText({ fontFamily: e.target.value as FontFamily })}
                        className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/30 mt-1"
                      >
                        <option value="Arial">Arial</option>
                        <option value="Times New Roman">Times New Roman</option>
                        <option value="Comic Sans MS">Comic Sans MS</option>
                        <option value="Impact">Impact</option>
                        <option value="Verdana">Verdana</option>
                        <option value="Georgia">Georgia</option>
                        <option value="Noto Sans">Noto Sans</option>
                        <option value="Noto Serif">Noto Serif</option>
                        <option value="Noto Sans JP">Noto Sans JP (Japanese)</option>
                        <option value="Noto Sans KR">Noto Sans KR (Korean)</option>
                        <option value="Noto Sans SC">Noto Sans SC (Chinese Simplified)</option>
                        <option value="Noto Sans TC">Noto Sans TC (Chinese Traditional)</option>
                        <option value="Noto Sans Thai">Noto Sans Thai (Thai)</option>
                        <option value="Roboto">Roboto</option>
                        <option value="Open Sans">Open Sans</option>
                        <option value="Montserrat">Montserrat</option>
                        <option value="Playfair Display">Playfair Display</option>
                        <option value="Oswald">Oswald</option>
                        <option value="Raleway">Raleway</option>
                      </select>
                    </div>

                    <div>
                      <span className="text-xs text-gray-300 font-semibold">Border Width</span>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        value={textElements.find(t => t.id === selectedTextId)?.borderWidth || 0}
                        onChange={(e) => updateSelectedText({ borderWidth: Number(e.target.value) })}
                        className="w-full accent-purple-500 mt-1"
                      />
                    </div>

                    {(textElements.find(t => t.id === selectedTextId)?.borderWidth || 0) > 0 && (
                      <>
                        <div>
                          <span className="text-xs text-gray-300 font-semibold">Border Color</span>
                          <input
                            type="color"
                            value={textElements.find(t => t.id === selectedTextId)?.borderColor || "#000000"}
                            onChange={(e) => updateSelectedText({ borderColor: e.target.value })}
                            className="w-full h-8 mt-1 rounded cursor-pointer"
                          />
                        </div>

                        <div>
                          <span className="text-xs text-gray-300 font-semibold">Background Color</span>
                          <input
                            type="color"
                            value={textElements.find(t => t.id === selectedTextId)?.backgroundColor || "#ffffff"}
                            onChange={(e) => updateSelectedText({ backgroundColor: e.target.value })}
                            className="w-full h-8 mt-1 rounded cursor-pointer"
                          />
                        </div>

                        <div>
                          <span className="text-xs text-gray-300 font-semibold">Text Color</span>
                          <input
                            type="color"
                            value={textElements.find(t => t.id === selectedTextId)?.color || "#000000"}
                            onChange={(e) => updateSelectedText({ color: e.target.value })}
                            className="w-full h-8 mt-1 rounded cursor-pointer"
                          />
                        </div>

                        {/* Transform Controls Removed - using direct manipulation on canvas */}
                      </>
                    )}

                    {/* If no border, just show text color */}
                    {(textElements.find(t => t.id === selectedTextId)?.borderWidth || 0) === 0 && (
                      <div>
                        <span className="text-xs text-gray-300 font-semibold">Text Color</span>
                        <input
                          type="color"
                          value={textElements.find(t => t.id === selectedTextId)?.color || "#000000"}
                          onChange={(e) => updateSelectedText({ color: e.target.value })}
                          className="w-full h-8 mt-1 rounded cursor-pointer"
                        />
                      </div>
                    )}
                  </>
                )}
              </div>

              <div className="text-[11px] text-gray-500">
                Click to select text, drag to move, resize handle to resize. Text is editable when selected.
              </div>
            </div>
          ) : activeTab === "assets" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Asset Tool</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Upload & place images on canvas</p>
              </div>

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <button
                  onClick={() => assetInputRef.current?.click()}
                  className="w-full px-4 py-3 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-200 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-2"
                >
                  <Upload className="w-4 h-4" /> Upload Asset
                </button>
                <input
                  ref={assetInputRef}
                  type="file"
                  accept=".png,.jpg,.jpeg,.gif,.webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) uploadAsset(file);
                  }}
                />
              </div>

              {assetLibrary.length > 0 && (
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-semibold">Asset Library</span>
                    <span className="text-xs text-gray-500 font-mono">{assetLibrary.length} assets</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {assetLibrary.map((asset) => (
                      <button
                        key={asset.id}
                        onClick={() => addAssetElement(asset.id)}
                        className="aspect-square rounded-lg overflow-hidden border-2 border-white/10 hover:border-orange-500/50 transition-colors bg-white/5"
                        title={asset.name}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={asset.url}
                          alt={asset.name}
                          className="w-full h-full object-cover"
                        />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssetId && (
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-300 font-semibold">Selected Asset</span>
                    <button
                      onClick={deleteSelectedAsset}
                      className="px-2 py-1 bg-red-500/10 hover:bg-red-500/20 text-red-300 rounded text-xs font-semibold transition flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" /> Delete
                    </button>
                  </div>
                </div>
              )}

              <div className="text-[11px] text-gray-500">
                Upload images to your asset library, then click to place them on the canvas. Drag to move, resize handles to scale.
              </div>
            </div>
          ) : activeTab === "panel" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Panels</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Page {currentPage?.number || 1} • {currentPanels.length} panels</p>
              </div>

              {/* Panel List Header with detail toggle */}
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Panel List</span>
                <div className="flex items-center bg-[#1a1a24] rounded border border-white/10">
                  <button onClick={() => setPanelDetailView("simple")}
                    className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-l transition ${panelDetailView === "simple" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>Simple</button>
                  <button onClick={() => setPanelDetailView("detailed")}
                    className={`px-1.5 py-0.5 text-[9px] font-semibold rounded-r transition ${panelDetailView === "detailed" ? "bg-white/10 text-white" : "text-gray-500 hover:text-gray-300"}`}>Detailed</button>
                </div>
              </div>
              <div className="space-y-2">
                {currentPanels.map((p, idx) => {
                  const locName = locations.find(l => l.id === p.location)?.name;
                  const timeName = times.find(t => t.id === p.time)?.name;
                  const charNames = p.characters.map(cid => characters.find(c => c.id === cid)?.name).filter(Boolean);
                  return (
                  <div key={p.id} onClick={() => setSelectedPanelId(p.id)}
                    role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") setSelectedPanelId(p.id); }}
                    className={`w-full text-left p-3 rounded-xl border transition group cursor-pointer ${
                      selectedPanelId === p.id
                        ? "bg-pink-500/10 border-pink-500/30 ring-1 ring-pink-500/20"
                        : "bg-[#0f1117] border-white/10 hover:border-white/20"
                    }`}>
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-bold flex items-center justify-center shrink-0">{idx + 1}</span>
                      <span className="text-xs font-semibold text-white truncate flex-1">Scene {idx + 1}: {p.title}</span>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={(e) => { e.stopPropagation(); movePanelOrder(p.id, "up"); }}
                          className="p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronLeft className="w-3 h-3 rotate-90" /></button>
                        <button onClick={(e) => { e.stopPropagation(); movePanelOrder(p.id, "down"); }}
                          className="p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-white"><ChevronRight className="w-3 h-3 rotate-90" /></button>
                        <button onClick={(e) => { e.stopPropagation(); duplicatePanel(p.id); }}
                          className="p-0.5 hover:bg-white/10 rounded text-gray-400 hover:text-white" title="Duplicate">
                          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); deletePanel(p.id); }}
                          className="p-0.5 hover:bg-red-500/20 rounded text-gray-400 hover:text-red-400"><Trash2 className="w-3 h-3" /></button>
                      </div>
                    </div>
                    {/* Simple view: just size info */}
                    {panelDetailView === "simple" && (
                      <div className="text-[9px] text-gray-600 mt-1">{panelSizePresets.find(s => s.id === p.sizePreset)?.name || "Standard"} • {p.height}px</div>
                    )}
                    {/* Detailed view: tags, stage direction, dialogue like pic3 */}
                    {panelDetailView === "detailed" && (
                      <>
                        {(charNames.length > 0 || locName || timeName) && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {charNames.map(n => (
                              <span key={n} className="px-1.5 py-0.5 bg-orange-500/15 text-orange-400 text-[9px] font-semibold rounded">{n}</span>
                            ))}
                            {locName && <span className="px-1.5 py-0.5 bg-blue-500/15 text-blue-400 text-[9px] font-semibold rounded">{locName}</span>}
                            {timeName && <span className="px-1.5 py-0.5 bg-purple-500/15 text-purple-400 text-[9px] font-semibold rounded">{timeName}</span>}
                          </div>
                        )}
                        {p.stageDir && (
                          <p className="text-[10px] text-gray-400 mt-1.5 line-clamp-2 leading-relaxed">{p.stageDir}</p>
                        )}
                        {p.dialogue && (
                          <p className="text-[10px] text-purple-400/70 mt-0.5 italic line-clamp-1">{p.dialogue}</p>
                        )}
                        <div className="flex items-center justify-between mt-1">
                          <div className="text-[9px] text-gray-600">{panelSizePresets.find(s => s.id === p.sizePreset)?.name || "Standard"} • {p.height}px</div>
                          <button onClick={(e) => { e.stopPropagation(); setSelectedPanelId(p.id); setActiveTab("aimanga"); }}
                            className="text-[9px] text-violet-400 hover:text-violet-300 flex items-center gap-0.5 transition">
                            <Sparkles className="w-2.5 h-2.5" /> Edit
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                  );
                })}
                <button onClick={addPanel} data-testid="add-panel-btn"
                  className="w-full p-3 border-2 border-dashed border-white/10 hover:border-pink-500/30 rounded-xl text-center transition group">
                  <Plus className="w-4 h-4 mx-auto mb-1 text-pink-400 group-hover:scale-110 transition-transform" />
                  <div className="text-pink-400 text-xs font-semibold">+ Add Panel</div>
                </button>

                {/* Panel Templates */}
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                  <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Quick Templates</span>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { name: "3-Panel", desc: "Action sequence", count: 3, heights: [400, 600, 400] },
                      { name: "4-Panel Strip", desc: "Manga strip", count: 4, heights: [400, 400, 400, 400] },
                      { name: "Splash + 2", desc: "Impact opener", count: 3, heights: [1200, 600, 600] },
                      { name: "Dialogue", desc: "5 short panels", count: 5, heights: [300, 300, 300, 300, 300] },
                    ].map(tpl => (
                      <button key={tpl.name} onClick={() => {
                        saveHistory();
                        const base = currentPanels.length > 0 ? Math.max(...currentPanels.map(p => p.order)) + 1 : 0;
                        const newPanels: Panel[] = tpl.heights.map((h, i) => ({
                          id: `panel-${Date.now()}-${i}`,
                          pageId: currentPageId,
                          order: base + i,
                          title: `Panel ${currentPanels.length + i + 1}`,
                          height: h,
                          sizePreset: h <= 400 ? "short" : h <= 600 ? "standard" : h <= 1000 ? "tall" : "splash",
                          characters: [] as string[],
                          location: "",
                          time: "",
                          stageDir: "",
                          dialogue: "",
                          generationMode: "single" as const,
                          scenes: [] as Scene[],
                        }));
                        setPanels(prev => [...prev, ...newPanels]);
                        setSelectedPanelId(newPanels[0].id);
                      }}
                        className="p-2 bg-[#1a1a24] border border-white/10 hover:border-pink-500/30 rounded-lg text-left transition">
                        <div className="text-[11px] font-semibold text-white">{tpl.name}</div>
                        <div className="text-[9px] text-gray-500">{tpl.desc} • {tpl.count} panels</div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Selected Panel Settings */}
              {selectedPanel && (
                <div className="space-y-3">
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300 font-semibold">Panel Settings</span>
                      <span className="text-[10px] text-gray-500">#{currentPanels.findIndex(p => p.id === selectedPanel.id) + 1}</span>
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1">Title</label>
                      <input value={selectedPanel.title} onChange={(e) => setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, title: e.target.value } : p))}
                        className="w-full px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:border-pink-500/50 focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 mb-1.5">Panel Size</label>
                      <div className="grid grid-cols-2 gap-1.5">
                        {panelSizePresets.map(preset => (
                          <button key={preset.id} onClick={() => setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, sizePreset: preset.id, height: preset.height } : p))}
                            className={`p-2 rounded-lg border text-left transition ${
                              selectedPanel.sizePreset === preset.id
                                ? "bg-pink-500/10 border-pink-500/30 text-pink-300"
                                : "bg-[#1a1a24] border-white/10 text-gray-300 hover:border-pink-500/20"
                            }`}>
                            <div className="text-[11px] font-semibold">{preset.name}</div>
                            <div className="text-[9px] text-gray-500">{preset.desc} • {preset.height}px</div>
                          </button>
                        ))}
                      </div>
                      {selectedPanel.sizePreset === "custom" && (
                        <input type="number" value={selectedPanel.height} onChange={(e) => setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, height: Number(e.target.value) } : p))}
                          className="w-full mt-2 px-3 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-xs text-white focus:border-pink-500/50 focus:outline-none" placeholder="Height in px" />
                      )}
                    </div>
                  </div>

                  {/* Gutter Spacing */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-2">
                    <span className="text-xs text-gray-300 font-semibold">Page Gutter Spacing</span>
                    <div className="flex items-center gap-2">
                      <input type="range" min={0} max={100} value={gutterSize} onChange={(e) => setGutterSize(Number(e.target.value))}
                        className="flex-1 h-1 accent-pink-500" />
                      <span className="text-[10px] text-gray-400 font-mono w-8 text-right">{gutterSize}px</span>
                    </div>
                    <p className="text-[9px] text-gray-600">Space between panels when exported/previewed</p>
                  </div>

                  {/* Edit in AI Manga link */}
                  <button onClick={() => setActiveTab("aimanga")}
                    className="w-full px-4 py-2.5 bg-gradient-to-r from-violet-500/10 to-pink-500/10 border border-violet-500/20 hover:border-violet-500/40 rounded-xl transition flex items-center justify-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                    <span className="text-xs font-semibold text-violet-300">Edit Scene in AI Manga</span>
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "aimanga" ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-violet-400" />
                  <h2 className="text-white font-bold text-lg">AI Manga</h2>
                </div>
                <p className="text-[11px] text-gray-500 mt-0.5">Scene builder & AI generator</p>
              </div>

              {selectedPanel ? (
                <div className="space-y-3">
                  {/* Current panel indicator */}
                  <div className="flex items-center gap-2 px-3 py-2 bg-pink-500/10 border border-pink-500/20 rounded-lg">
                    <span className="w-5 h-5 rounded bg-pink-500/20 text-pink-400 text-[10px] font-bold flex items-center justify-center">{currentPanels.findIndex(p => p.id === selectedPanel.id) + 1}</span>
                    <span className="text-xs font-semibold text-white flex-1">{selectedPanel.title}</span>
                    <button onClick={() => setActiveTab("panel")} className="text-[9px] text-gray-400 hover:text-white transition">← Panels</button>
                  </div>

                  {/* Single / Multi-Scene Toggle */}
                  <div className="flex gap-1.5">
                    <button onClick={() => setGenerationMode("single")}
                      className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition border ${generationMode === "single" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-500 border-white/10"}`}>
                      Single Scene
                    </button>
                    <button onClick={() => setGenerationMode("multi")}
                      className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition border ${generationMode === "multi" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-500 border-white/10"}`}>
                      Multi-Scene
                    </button>
                  </div>

                  {/* Multi-scene: scene count + manga/storyboard layout templates */}
                  {generationMode === "multi" && (
                    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold text-gray-400">Scenes per Panel</span>
                        <span className="text-[9px] text-emerald-400 font-semibold">Save ~{Math.round((1 - 1/Math.max(sceneCount, 2)) * 100)}%</span>
                      </div>
                      <div className="grid grid-cols-6 gap-1">
                        {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                          <button key={n} onClick={() => setSceneCount(n)}
                            className={`py-1 rounded text-[10px] font-bold transition border ${sceneCount === n ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-600 border-white/5 hover:text-gray-400"}`}>
                            {n}
                          </button>
                        ))}
                      </div>

                      {/* Manga / Storyboard style toggle */}
                      <div className="flex gap-1">
                        <button onClick={() => setTemplateStyle("manga")}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition border ${templateStyle === "manga" ? "bg-purple-500/15 text-purple-300 border-purple-500/30" : "bg-white/5 text-gray-500 border-white/5"}`}>
                          Manga
                        </button>
                        <button onClick={() => setTemplateStyle("storyboard")}
                          className={`flex-1 px-2 py-1.5 rounded-lg text-[10px] font-semibold transition border ${templateStyle === "storyboard" ? "bg-blue-500/15 text-blue-300 border-blue-500/30" : "bg-white/5 text-gray-500 border-white/5"}`}>
                          Storyboard
                        </button>
                      </div>

                      {/* Layout Template thumbnails */}
                      <div>
                        <span className="text-[9px] text-gray-500 font-medium">Layout Template</span>
                        <div className="grid grid-cols-3 gap-1.5 mt-1">
                          {templateStyle === "manga" ? (
                            <>
                              {/* Manga templates — asymmetric traditional layouts */}
                              {[
                                { id: "m2", label: "2-Panel", src: "/manga-studio/images/panel template/manga-2panel.svg",
                                  cells: [{x:0,y:0,w:2,h:1},{x:0,y:1,w:2,h:1}] },
                                { id: "m3a", label: "3-Panel A", src: "/manga-studio/images/panel template/manga-3panel-a.svg",
                                  cells: [{x:0,y:0,w:1,h:2},{x:1,y:0,w:1,h:1},{x:1,y:1,w:1,h:1}] },
                                { id: "m3b", label: "3-Panel B", src: "/manga-studio/images/panel template/manga-3panel-b.svg",
                                  cells: [{x:0,y:0,w:2,h:1},{x:0,y:1,w:1,h:1},{x:1,y:1,w:1,h:1}] },
                                { id: "m4", label: "4-Panel", src: "/manga-studio/images/panel template/manga-4panel.svg",
                                  cells: [{x:0,y:0,w:1,h:1},{x:1,y:0,w:1,h:1},{x:0,y:1,w:1,h:1},{x:1,y:1,w:1,h:1}] },
                                { id: "m4d", label: "4-Dynamic", src: "/manga-studio/images/panel template/manga-4panel-dynamic.svg",
                                  cells: [{x:0,y:0,w:2,h:1},{x:0,y:1,w:1,h:1},{x:1,y:1,w:1,h:2},{x:0,y:2,w:1,h:1}] },
                                { id: "m5", label: "5-Panel", src: "/manga-studio/images/panel template/manga-5panel.svg",
                                  cells: [{x:0,y:0,w:1,h:2},{x:1,y:0,w:1,h:1},{x:1,y:1,w:1,h:1},{x:0,y:2,w:1,h:1},{x:1,y:2,w:1,h:1}] },
                              ].map(tpl => (
                                <button key={tpl.id} onClick={() => { setSelectedTemplateId(tpl.id); setSceneLayout("dynamic"); setSceneCount(tpl.cells.length); }}
                                  className={`p-1 rounded-lg border transition ${selectedTemplateId === tpl.id ? "bg-purple-500/15 border-purple-500/40" : "bg-[#1a1a24] border-white/10 hover:border-purple-500/30"}`}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={tpl.src} alt={tpl.label} className="w-full h-14 object-contain" />
                                  <span className="text-[8px] text-gray-500 block text-center mt-0.5">{tpl.label}</span>
                                </button>
                              ))}
                            </>
                          ) : (
                            <>
                              {/* Storyboard templates — uniform grids for 6-12 scenes */}
                              {[
                                { id: "sb6", label: "6-Grid", src: "/manga-studio/images/storyboard/storyboard-6.svg", count: 6, r: 3, c: 2 },
                                { id: "sb8", label: "8-Grid", src: "/manga-studio/images/storyboard/storyboard-8.svg", count: 8, r: 4, c: 2 },
                                { id: "sb9", label: "9-Grid", src: "/manga-studio/images/storyboard/storyboard-9.svg", count: 9, r: 3, c: 3 },
                                { id: "sb12", label: "12-Grid", src: "/manga-studio/images/storyboard/storyboard-12.svg", count: 12, r: 3, c: 4 },
                              ].map(tpl => (
                                <button key={tpl.id} onClick={() => { setSelectedTemplateId(tpl.id); setSceneLayout("grid"); setSceneCount(tpl.count); }}
                                  className={`p-1 rounded-lg border transition ${selectedTemplateId === tpl.id ? "bg-blue-500/15 border-blue-500/40" : "bg-[#1a1a24] border-white/10 hover:border-blue-500/30"}`}>
                                  {/* eslint-disable-next-line @next/next/no-img-element */}
                                  <img src={tpl.src} alt={tpl.label} className="w-full h-14 object-contain" />
                                  <span className="text-[8px] text-gray-500 block text-center mt-0.5">{tpl.label}</span>
                                </button>
                              ))}
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Shot Type visual selector (pic5) */}
                  {generationMode === "single" && (
                    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                      <span className="text-[10px] font-semibold text-gray-400 mb-1.5 block">Shot Type</span>
                      <div className="grid grid-cols-3 gap-1">
                        {[
                          { id: "establishing", label: "Establishing", desc: "Wide view" },
                          { id: "full", label: "Full Shot", desc: "Full body" },
                          { id: "medium", label: "Medium", desc: "Waist up" },
                          { id: "medium-close", label: "Med Close", desc: "Chest up" },
                          { id: "close", label: "Close-up", desc: "Face" },
                          { id: "extreme-close", label: "Extreme CU", desc: "Eyes/detail" },
                        ].map(shot => (
                          <button key={shot.id} onClick={() => setFraming(framing === shot.id ? "none" : shot.id)}
                            className={`p-1.5 rounded-lg border text-center transition ${framing === shot.id ? "bg-violet-500/15 border-violet-500/30 text-violet-300" : "bg-[#1a1a24] border-white/10 text-gray-500 hover:text-gray-300"}`}>
                            <div className="text-[10px] font-semibold">{shot.label}</div>
                            <div className="text-[8px] text-gray-600">{shot.desc}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reference Images — multi-upload (compact for sidebar) */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                    <span className="text-[10px] font-semibold text-gray-400 mb-1.5 block">Reference Images</span>
                    <input ref={refImageInputRef} type="file" accept="image/*" multiple className="hidden"
                      onChange={(e) => {
                        const files = e.target.files;
                        if (!files) return;
                        Array.from(files).forEach(file => {
                          const reader = new FileReader();
                          reader.onload = (ev) => {
                            if (ev.target?.result) setReferenceImages(prev => [...prev, ev.target!.result as string]);
                          };
                          reader.readAsDataURL(file);
                        });
                        e.target.value = "";
                      }}
                    />
                    {referenceImages.length > 0 || panelRefImages[selectedPanel.id] ? (
                      <div className="flex flex-wrap gap-1.5">
                        {panelRefImages[selectedPanel.id] && (
                          <div className="relative w-12 h-12 rounded-lg overflow-hidden border-2 border-violet-500/40 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={panelRefImages[selectedPanel.id]} alt="Main ref" className="w-full h-full object-cover" />
                            <button onClick={() => setPanelRefImages(prev => { const n = { ...prev }; delete n[selectedPanel.id]; return n; })}
                              className="absolute top-0 right-0 p-0.5 bg-red-500/80 rounded-bl opacity-0 group-hover:opacity-100 transition">
                              <XIcon className="w-2.5 h-2.5 text-white" />
                            </button>
                          </div>
                        )}
                        {referenceImages.map((img, i) => (
                          <div key={i} className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={img} alt={`ref-${i}`} className="w-full h-full object-cover" />
                            <button onClick={() => setReferenceImages(prev => prev.filter((_, idx) => idx !== i))}
                              className="absolute top-0 right-0 p-0.5 bg-red-500/80 rounded-bl opacity-0 group-hover:opacity-100 transition">
                              <XIcon className="w-2.5 h-2.5 text-white" />
                            </button>
                          </div>
                        ))}
                        <button onClick={() => refImageInputRef.current?.click()}
                          className="w-12 h-12 rounded-lg border border-dashed border-white/15 flex items-center justify-center hover:border-white/30 transition">
                          <Plus className="w-3.5 h-3.5 text-gray-600" />
                        </button>
                      </div>
                    ) : (
                      <button onClick={() => refImageInputRef.current?.click()}
                        className="w-full py-2.5 border border-dashed border-white/10 hover:border-violet-500/30 rounded-lg text-[10px] text-gray-500 hover:text-gray-300 transition flex items-center justify-center gap-1.5">
                        <Upload className="w-3 h-3" /> Upload reference images
                      </button>
                    )}
                  </div>

                  {/* Builder Sub-tabs */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 overflow-hidden">
                    <div className="flex border-b border-white/10">
                      <button onClick={() => setActiveBuilderTab("characters")}
                        className={`flex-1 px-2 py-2 text-[10px] font-semibold transition ${activeBuilderTab === "characters" ? "text-orange-400 border-b-2 border-orange-400 bg-[#13131a]" : "text-gray-500 hover:text-gray-300"}`}>Chars</button>
                      <button onClick={() => setActiveBuilderTab("scene")}
                        className={`flex-1 px-2 py-2 text-[10px] font-semibold transition ${activeBuilderTab === "scene" ? "text-blue-400 border-b-2 border-blue-400 bg-[#13131a]" : "text-gray-500 hover:text-gray-300"}`}>Scene</button>
                      <button onClick={() => setActiveBuilderTab("props")}
                        className={`flex-1 px-2 py-2 text-[10px] font-semibold transition ${activeBuilderTab === "props" ? "text-emerald-400 border-b-2 border-emerald-400 bg-[#13131a]" : "text-gray-500 hover:text-gray-300"}`}>Props</button>
                      <button onClick={() => setActiveBuilderTab("time")}
                        className={`flex-1 px-2 py-2 text-[10px] font-semibold transition ${activeBuilderTab === "time" ? "text-purple-400 border-b-2 border-purple-400 bg-[#13131a]" : "text-gray-500 hover:text-gray-300"}`}>Time</button>
                      <button onClick={() => setActiveBuilderTab("advanced")}
                        className={`flex-1 px-2 py-2 text-[10px] font-semibold transition flex items-center justify-center gap-0.5 ${activeBuilderTab === "advanced" ? "text-pink-400 border-b-2 border-pink-400 bg-[#13131a]" : "text-gray-500 hover:text-gray-300"}`}>
                        <SlidersHorizontal className="w-2.5 h-2.5" /> Adv
                      </button>
                    </div>

                    <div className="p-3 space-y-3">
                      {activeBuilderTab === "characters" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-semibold text-gray-400 uppercase tracking-wide">Characters</label>
                            <button className="flex items-center gap-1 px-2 py-1 bg-orange-500/10 border border-orange-500/20 hover:bg-orange-500/20 rounded text-[9px] text-orange-400 transition">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {characters.map((char) => (
                              <button key={char.id}
                                onClick={() => {
                                  const next = selectedCharacters.includes(char.id) ? selectedCharacters.filter(id => id !== char.id) : [...selectedCharacters, char.id];
                                  setSelectedCharacters(next);
                                  if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, characters: next } : p));
                                }}
                                className={`flex items-center gap-2 p-2 rounded-lg border transition ${
                                  selectedCharacters.includes(char.id)
                                    ? "bg-orange-500/10 border-orange-500/30 text-orange-400"
                                    : "bg-[#1a1a24] border-white/10 text-gray-300 hover:border-white/20"
                                }`}>
                                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white font-bold text-[9px]">{char.avatar}</div>
                                <span className="text-[11px] font-medium">{char.name}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeBuilderTab === "scene" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-semibold text-gray-400">Location</label>
                            <button className="flex items-center gap-1 px-2 py-1 bg-blue-500/10 border border-blue-500/20 hover:bg-blue-500/20 rounded text-[9px] text-blue-400 transition">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {locations.map((loc) => (
                              <button key={loc.id} onClick={() => {
                                const next = loc.id === selectedLocation ? "" : loc.id;
                                setSelectedLocation(next);
                                if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, location: next } : p));
                              }}
                                className={`p-2 rounded-lg border transition text-left ${
                                  selectedLocation === loc.id ? "bg-blue-500/10 border-blue-500/30" : "bg-[#1a1a24] border-white/10 hover:border-blue-500/30"
                                }`}>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-lg">{loc.thumbnail}</span>
                                  <div>
                                    <div className="text-[11px] font-medium text-white">{loc.name}</div>
                                    <div className="text-[9px] text-gray-500">{loc.type}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeBuilderTab === "props" && (
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <label className="block text-[10px] font-semibold text-gray-400">Props</label>
                            <button className="flex items-center gap-1 px-2 py-1 bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 rounded text-[9px] text-emerald-400 transition">
                              <Plus className="w-3 h-3" /> Add
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            {panelBuilderProps.map((prop) => (
                              <button key={prop.id}
                                onClick={() => { if (!selectedProps.includes(prop.id)) setSelectedProps(prev => [...prev, prop.id]); else setSelectedProps(prev => prev.filter(id => id !== prop.id)); }}
                                className={`p-2 rounded-lg border transition text-left ${
                                  selectedProps.includes(prop.id) ? "bg-emerald-500/10 border-emerald-500/30" : "bg-[#1a1a24] border-white/10 hover:border-emerald-500/30"
                                }`}>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-lg">{prop.thumbnail}</span>
                                  <div>
                                    <div className="text-[11px] font-medium text-white">{prop.name}</div>
                                    <div className="text-[9px] text-gray-500">{prop.category}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeBuilderTab === "time" && (
                        <div>
                          <label className="block text-[10px] font-semibold text-gray-400 mb-2">Time of Day</label>
                          <div className="flex flex-wrap gap-1.5">
                            {times.map((time) => (
                              <button key={time.id} onClick={() => {
                                const next = time.id === selectedTime ? "" : time.id;
                                setSelectedTime(next);
                                if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, time: next } : p));
                              }}
                                className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition ${
                                  selectedTime === time.id ? "bg-purple-500/20 text-purple-400 border border-purple-500/50" : "bg-[#1a1a24] text-gray-300 border border-white/10 hover:border-purple-500/30"
                                }`}>{time.name}</button>
                            ))}
                          </div>
                        </div>
                      )}

                      {activeBuilderTab === "advanced" && (
                        <div className="space-y-2">
                          <div>
                            <label className="block text-[10px] text-gray-500 mb-1">Style Model</label>
                            <select value={styleModel} onChange={(e) => setStyleModel(e.target.value)}
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[11px] text-white focus:outline-none focus:border-pink-500/50 appearance-none cursor-pointer">
                              <option value="nano-banana">Nano Banana</option>
                              <option value="flux-pro">Flux Pro</option>
                              <option value="sdxl">SDXL 1.0</option>
                            </select>
                          </div>
                          <div className="grid grid-cols-2 gap-1.5">
                            <div>
                              <label className="block text-[9px] text-gray-500 mb-0.5">Framing</label>
                              <select value={framing} onChange={(e) => setFraming(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[10px] text-white focus:outline-none appearance-none cursor-pointer">
                                <option value="none">Auto</option><option value="extreme-close">Extreme Close-up</option><option value="close">Close-up</option><option value="bust">Bust</option><option value="waist">Waist</option><option value="full">Full Body</option><option value="wide">Wide</option><option value="two-shot">Two-Shot</option><option value="group">Group</option>
                              </select>
                            </div>
                            <div>
                              <label className="block text-[9px] text-gray-500 mb-0.5">Camera Angle</label>
                              <select value={mangaAngle} onChange={(e) => setMangaAngle(e.target.value)}
                                className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[10px] text-white focus:outline-none appearance-none cursor-pointer">
                                <option value="none">Auto</option><option value="front-view">Front View</option><option value="eye-level">Eye Level</option><option value="from-above">From Above</option><option value="from-below">From Below</option><option value="from-behind">From Behind</option><option value="over-shoulder">Over Shoulder</option><option value="dutch">Dutch Angle</option><option value="dynamic">Dynamic</option><option value="cinematic">Cinematic</option><option value="aerial">Aerial</option><option value="side-profile">Side Profile</option><option value="three-quarter">3/4 View</option>
                              </select>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[9px] text-gray-500 mb-0.5">Weather / Atmosphere</label>
                            <input type="text" value={weather} onChange={(e) => setWeather(e.target.value)}
                              placeholder="e.g. Rain, Fog, Snow... or blank for AI"
                              className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded text-[10px] text-white placeholder-gray-600 focus:outline-none focus:border-pink-500/50" />
                            <div className="flex flex-wrap gap-0.5 mt-1">
                              {["Clear", "Rain", "Snow", "Fog", "Storm", "Wind", "Night"].map(w => (
                                <button key={w} type="button" onClick={() => setWeather(weather === w ? "" : w)}
                                  className={`px-1 py-0.5 rounded text-[8px] transition ${weather === w ? "bg-pink-500/20 text-pink-400 border border-pink-500/30" : "bg-white/5 text-gray-500 hover:text-gray-300 border border-white/5"}`}>
                                  {w}
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Stage Direction & Dialogue */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-gray-400">Stage Direction</label>
                        <button onClick={() => setExpandedField("stageDirection")} className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-purple-400 transition" title="Expand"><Maximize2 className="w-3 h-3" /></button>
                      </div>
                      <textarea value={stageDirection} onChange={(e) => {
                        setStageDirection(e.target.value);
                        if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, stageDir: e.target.value } : p));
                      }}
                        placeholder="Describe the scene action..."
                        className="w-full h-16 px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none resize-none" />
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[10px] font-semibold text-gray-400">Dialogue</label>
                        <button onClick={() => setExpandedField("dialogue")} className="p-0.5 hover:bg-white/10 rounded text-gray-500 hover:text-purple-400 transition" title="Expand"><Maximize2 className="w-3 h-3" /></button>
                      </div>
                      <textarea value={dialogue} onChange={(e) => {
                        setDialogue(e.target.value);
                        if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, dialogue: e.target.value } : p));
                      }}
                        placeholder='Character: "Line..."'
                        className="w-full h-12 px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-600 focus:border-purple-500/50 focus:outline-none resize-none" />
                    </div>
                  </div>

                  {/* Generate Button */}
                  <button onClick={generatePanelContent} disabled={isGenerating}
                    className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl font-bold transition flex items-center justify-center gap-2 text-sm shadow-lg shadow-purple-500/20">
                    {isGenerating ? (
                      <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate with AI Manga{generationMode === "multi" ? ` (${sceneCount})` : ""}</>
                    )}
                  </button>

                  {/* Use as Background button */}
                  {selectedPanel && panelRefImages[selectedPanel.id] && (
                    <button onClick={() => {
                      if (!selectedPanel) return;
                      const refImg = panelRefImages[selectedPanel.id];
                      if (refImg) {
                        setPanelImages(prev => ({ ...prev, [selectedPanel.id]: refImg }));
                        setCanvasViewMode("single");
                      }
                    }}
                    className="w-full px-3 py-2 bg-violet-500/10 border border-violet-500/20 hover:bg-violet-500/20 text-violet-300 rounded-lg font-semibold transition flex items-center justify-center gap-2 text-[11px]">
                      <ImageIcon className="w-3.5 h-3.5" />
                      Use Reference as Panel Background
                    </button>
                  )}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  Select a panel first to configure AI generation
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Panel Timeline Strip */}
        {showTimeline && currentPanels.length > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-24 bg-[#0a0a0f]/95 border-t border-white/10 backdrop-blur-sm flex items-center px-4 gap-2 z-30">
            <div className="flex flex-col items-start gap-0.5 mr-2 shrink-0">
              <div className="flex items-center gap-1.5">
                <GripVertical className="w-3.5 h-3.5 text-pink-400" />
                <span className="text-[10px] font-bold text-pink-400 uppercase tracking-wider">Timeline</span>
              </div>
              <span className="text-[9px] text-gray-600">Drag to reorder</span>
            </div>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto py-1">
              {currentPanels.map((p, idx) => (
                <div
                  key={p.id}
                  draggable
                  onDragStart={(e) => {
                    setDragPanelId(p.id);
                    e.dataTransfer.effectAllowed = "move";
                  }}
                  onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = "move"; }}
                  onDrop={(e) => {
                    e.preventDefault();
                    if (dragPanelId && dragPanelId !== p.id) {
                      saveHistory();
                      setPanels(prev => {
                        const next = prev.map(x => ({ ...x }));
                        const dragPanel = next.find(x => x.id === dragPanelId);
                        const dropPanel = next.find(x => x.id === p.id);
                        if (dragPanel && dropPanel) {
                          const tmp = dragPanel.order;
                          dragPanel.order = dropPanel.order;
                          dropPanel.order = tmp;
                        }
                        return next;
                      });
                    }
                    setDragPanelId(null);
                  }}
                  onDragEnd={() => setDragPanelId(null)}
                  onClick={() => { setSelectedPanelId(p.id); setActiveTab("panel"); }}
                  className={`flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg border transition shrink-0 cursor-grab active:cursor-grabbing ${
                    dragPanelId === p.id ? "opacity-50" : ""
                  } ${
                    selectedPanelId === p.id
                      ? "bg-pink-500/15 border-pink-500/30"
                      : "bg-[#13131a] border-white/10 hover:border-white/20"
                  }`}>
                  {/* Thumbnail */}
                  <div className="w-16 h-10 rounded bg-[#1a1a24] border border-white/5 overflow-hidden flex items-center justify-center">
                    {panelImages[p.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={panelImages[p.id]} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] text-gray-600">Empty</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className={`w-4 h-4 rounded text-[8px] font-bold flex items-center justify-center ${
                      selectedPanelId === p.id ? "bg-pink-500/30 text-pink-300" : "bg-white/10 text-gray-500"
                    }`}>{idx + 1}</span>
                    <span className={`text-[10px] font-medium truncate max-w-[60px] ${selectedPanelId === p.id ? "text-pink-300" : "text-gray-400"}`}>{p.title}</span>
                  </div>
                </div>
              ))}
              <button onClick={addPanel}
                className="flex flex-col items-center gap-1 px-3 py-3 rounded-lg border-2 border-dashed border-white/10 hover:border-pink-500/30 text-pink-400 transition shrink-0">
                <Plus className="w-4 h-4" />
                <span className="text-[9px] font-medium">Add</span>
              </button>
            </div>
            <div className="flex items-center gap-1 ml-2 shrink-0">
              <span className="text-[10px] text-gray-500 font-mono">{currentPanels.findIndex(p => p.id === selectedPanelId) + 1}/{currentPanels.length}</span>
              <button onClick={() => setShowTimeline(false)} className="p-1 hover:bg-white/10 rounded text-gray-500 hover:text-white transition">
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Full Page Vertical Preview Modal */}
      {showPagePreview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowPagePreview(false)}>
          <div className="relative max-w-[860px] w-full max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 bg-[#0f1117] border-b border-white/10 rounded-t-xl">
              <div className="flex items-center gap-3">
                <h3 className="text-white font-bold text-sm">Page {currentPage?.number || 1} — Full Preview</h3>
                <span className="text-[10px] text-gray-500">{currentPanels.length} panels • 800px wide • Gutter {gutterSize}px</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-gray-500">Gutter:</span>
                  <input type="range" min={0} max={100} value={gutterSize} onChange={(e) => setGutterSize(Number(e.target.value))}
                    className="w-20 h-1 accent-pink-500" />
                  <span className="text-[10px] text-gray-400 font-mono w-7">{gutterSize}px</span>
                </div>
                <button onClick={() => setShowPagePreview(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">✕</button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto bg-[#1a1a24] p-6 rounded-b-xl">
              <div className="mx-auto" style={{ width: 400 }}>
                {currentPanels.map((p, idx) => (
                  <div key={p.id}>
                    <div
                      className={`relative w-full border transition cursor-pointer ${selectedPanelId === p.id ? "border-pink-500/50 ring-1 ring-pink-500/30" : "border-white/10"}`}
                      style={{ height: Math.round(p.height * 0.5), backgroundColor: "#0a0a0f" }}
                      onClick={() => { setSelectedPanelId(p.id); setShowPagePreview(false); }}
                    >
                      {panelImages[p.id] ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={panelImages[p.id]} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-xs text-gray-600">Panel {idx + 1}: {p.title}</span>
                        </div>
                      )}
                      <div className="absolute top-1 left-1 px-1.5 py-0.5 bg-black/60 rounded text-[9px] text-gray-300 font-mono">{idx + 1}</div>
                    </div>
                    {idx < currentPanels.length - 1 && (
                      <div style={{ height: Math.round(gutterSize * 0.5) }} className="bg-[#1a1a24]" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Expanded Text Dialog for Stage Direction / Dialogue — with prompt template badges */}
      {expandedField && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl">
            <div className="p-5 border-b border-white/10 flex items-center justify-between">
              <h3 className="text-white font-bold text-base">
                {expandedField === "stageDirection" ? "Stage Direction" : "Dialogue"}
              </h3>
              <button onClick={() => setExpandedField(null)} className="w-8 h-8 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400 hover:text-white">
                <XIcon className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-3">
              {/* Prompt template badges */}
              <div>
                <span className="text-[10px] text-gray-500 font-medium mb-1.5 block">Quick Templates — click to insert</span>
                <div className="flex flex-wrap gap-1.5">
                  {expandedField === "stageDirection" ? (
                    <>
                      {[
                        { label: "Establishing Shot", text: "[ESTABLISHING SHOT] Wide view of the location. Show the environment, time of day, and atmosphere. Characters are small in frame to emphasize the setting." },
                        { label: "Character Entrance", text: "[CHARACTER ENTRANCE] [Character] enters the scene from [direction]. Expression: [emotion]. Pose: [describe stance/gesture]. Background characters react." },
                        { label: "Close-up Reaction", text: "[CLOSE-UP] Focus on [Character]'s face. Expression shifts from [emotion A] to [emotion B]. Eyes [detail]. Sweat/tears/blush effect: [yes/no]." },
                        { label: "Action Sequence", text: "[ACTION] [Character] performs [action]. Motion lines from [direction]. Impact effect: [type]. Camera follows the movement dynamically." },
                        { label: "Dramatic Reveal", text: "[DRAMATIC REVEAL] Slow pan/zoom to reveal [subject]. Dramatic lighting from [direction]. Shadow effects. Other characters shown reacting in shock/awe." },
                        { label: "Conversation", text: "[CONVERSATION] [Character A] and [Character B] face each other. Shot alternates between speakers. Setting: [location]. Mood: [tense/casual/emotional]." },
                        { label: "Transition", text: "[TRANSITION] Scene shifts from [scene A] to [scene B]. Visual bridge: [overlay/fade/cut/panel break]. Time indicator: [same day/next day/flashback]." },
                        { label: "Multi-Panel Action", text: "[SEQUENTIAL PANELS] Panel 1: [setup action]. Panel 2: [mid-action]. Panel 3: [impact/result]. Speed lines increase across panels. Sound effects: [describe]." },
                      ].map(t => (
                        <button key={t.label} onClick={() => {
                          const val = stageDirection ? stageDirection + "\n\n" + t.text : t.text;
                          setStageDirection(val);
                          if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, stageDir: val } : p));
                        }}
                          className="px-2.5 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] text-purple-300 hover:bg-purple-500/20 hover:border-purple-500/30 transition font-medium">
                          {t.label}
                        </button>
                      ))}
                    </>
                  ) : (
                    <>
                      {[
                        { label: "Standard Line", text: '[Character]: "Your dialogue here."' },
                        { label: "Inner Thought", text: "[Character] (thinking): *If only I could tell them the truth...*" },
                        { label: "Narration", text: "[NARRATOR]: The sun set on another day, and nothing would ever be the same." },
                        { label: "Shout", text: '[Character]: "STOP RIGHT THERE!" (bold, large text, jagged bubble)' },
                        { label: "Whisper", text: '[Character]: "...don\'t look now, but..." (small text, dotted bubble)' },
                        { label: "Group Talk", text: '[Character A]: "Line A."\n[Character B]: "Line B."\n[Character C]: "Line C."' },
                        { label: "Confrontation", text: '[Character A]: "How could you do this?!"\n[Character B]: "You left me no choice."\n[Character A]: "..."' },
                        { label: "Sound Effect", text: "[SFX]: *CRASH!* / *whoooosh* / *thud*" },
                      ].map(t => (
                        <button key={t.label} onClick={() => {
                          const val = dialogue ? dialogue + "\n\n" + t.text : t.text;
                          setDialogue(val);
                          if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, dialogue: val } : p));
                        }}
                          className="px-2.5 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-[11px] text-pink-300 hover:bg-pink-500/20 hover:border-pink-500/30 transition font-medium">
                          {t.label}
                        </button>
                      ))}
                    </>
                  )}
                </div>
              </div>

              {/* Textarea */}
              <textarea
                value={expandedField === "stageDirection" ? stageDirection : dialogue}
                onChange={(e) => {
                  if (expandedField === "stageDirection") {
                    setStageDirection(e.target.value);
                    if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, stageDir: e.target.value } : p));
                  } else {
                    setDialogue(e.target.value);
                    if (selectedPanel) setPanels(prev => prev.map(p => p.id === selectedPanel.id ? { ...p, dialogue: e.target.value } : p));
                  }
                }}
                placeholder={expandedField === "stageDirection"
                  ? "Describe the scene in detail: setting, character positions, camera angles, lighting, mood, actions, expressions, background elements..."
                  : 'Write dialogue for each character. Use format:\nCharacter: "Line..."\n\nExample:\nKaito: "This is where it all begins."\nRyu: "Show me what you\'ve got."'}
                className="w-full h-64 px-4 py-3 bg-[#13131a] border border-purple-500/30 rounded-xl text-sm text-white placeholder-gray-500 focus:border-purple-500/50 focus:outline-none resize-none leading-relaxed"
                autoFocus
              />
              <div className="flex items-center justify-between">
                <p className="text-[10px] text-gray-500">
                  {(expandedField === "stageDirection" ? stageDirection : dialogue).split(/\s+/).filter(Boolean).length} words
                </p>
                <button onClick={() => setExpandedField(null)}
                  className="px-5 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg text-sm font-semibold transition">
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* AI Generator Modal — redesigned with single + multi-scene support */}
      {showAIGenerator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowAIGenerator(false)}>
          <div className="relative max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#13131a] border border-white/10 rounded-xl">
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center">
                    <Sparkles className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">AI Manga</h3>
                    <p className="text-[10px] text-gray-500">Scene builder & AI generator</p>
                  </div>
                </div>
                <button onClick={() => setShowAIGenerator(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>

              <div className="p-6 space-y-5">
                {/* Current Panel indicator */}
                {selectedPanel && (
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-md bg-pink-500/20 text-pink-400 text-xs font-bold flex items-center justify-center">
                      {currentPanels.findIndex(p => p.id === selectedPanel.id) + 1}
                    </span>
                    <span className="text-sm font-semibold text-white">{selectedPanel.title}</span>
                    <span className="text-[10px] text-gray-500 ml-auto">← Panels</span>
                  </div>
                )}

                {/* Generation Mode Toggle */}
                <div>
                  <div className="flex gap-2">
                    <button onClick={() => setGenerationMode("single")}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition border ${
                        generationMode === "single" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                      }`}>
                      Single Scene
                    </button>
                    <button onClick={() => setGenerationMode("multi")}
                      className={`flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition border ${
                        generationMode === "multi" ? "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-400 border-white/10 hover:border-white/20"
                      }`}>
                      Multi-Scene
                    </button>
                  </div>
                </div>

                {/* Multi-scene settings */}
                {generationMode === "multi" && (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-400 mb-2">Scenes per Panel:</label>
                      <div className="grid grid-cols-6 gap-1.5">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(num => (
                          <button key={num} onClick={() => setSceneCount(num)}
                            className={`px-2 py-1.5 rounded-lg text-xs font-bold transition border ${
                              sceneCount === num ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" : "bg-white/5 text-gray-500 border-white/10 hover:text-gray-300"
                            }`}>
                            {num}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Layout visual preview */}
                    <div className="p-3 bg-[#0a0a10] rounded-lg border border-white/5">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] text-gray-500 font-medium">Layout Preview</span>
                        <span className="text-[10px] text-emerald-400 font-semibold">Save ~{Math.round((1 - 1/sceneCount) * 100)}% tokens</span>
                      </div>
                      <div className="grid gap-1" style={{
                        gridTemplateColumns: `repeat(${sceneCount <= 3 ? sceneCount : sceneCount <= 6 ? 3 : 4}, 1fr)`,
                        gridTemplateRows: `repeat(${Math.ceil(sceneCount / (sceneCount <= 3 ? sceneCount : sceneCount <= 6 ? 3 : 4))}, 1fr)`
                      }}>
                        {[...Array(sceneCount)].map((_, i) => (
                          <div key={i} className="aspect-[4/3] bg-[#1a1a24] rounded border border-purple-500/20 flex items-center justify-center">
                            <span className="text-[9px] text-purple-400/60 font-bold">{i + 1}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* Reference Images — multi-upload */}
                <div>
                  <label className="block text-xs font-medium text-gray-400 mb-2">Reference Images</label>
                  <input ref={refImageInputRef} type="file" accept="image/*" multiple className="hidden"
                    onChange={(e) => {
                      const files = e.target.files;
                      if (!files) return;
                      Array.from(files).forEach(file => {
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                          if (ev.target?.result) setReferenceImages(prev => [...prev, ev.target!.result as string]);
                        };
                        reader.readAsDataURL(file);
                      });
                      e.target.value = "";
                    }}
                  />
                  {referenceImages.length > 0 ? (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {referenceImages.map((img, i) => (
                        <div key={i} className="relative w-16 h-16 rounded-lg overflow-hidden border border-white/10 group">
                          <img src={img} alt={`ref-${i}`} className="w-full h-full object-cover" />
                          <button onClick={() => setReferenceImages(prev => prev.filter((_, idx) => idx !== i))}
                            className="absolute top-0 right-0 p-0.5 bg-red-500/80 rounded-bl-lg opacity-0 group-hover:opacity-100 transition">
                            <XIcon className="w-3 h-3 text-white" />
                          </button>
                        </div>
                      ))}
                      <button onClick={() => refImageInputRef.current?.click()}
                        className="w-16 h-16 rounded-lg border border-dashed border-white/20 flex items-center justify-center hover:border-white/40 transition">
                        <Plus className="w-4 h-4 text-gray-500" />
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => refImageInputRef.current?.click()}
                      className="w-full py-3 border border-dashed border-white/15 rounded-lg text-xs text-gray-500 hover:text-gray-300 hover:border-white/30 transition flex items-center justify-center gap-2">
                      <Upload className="w-3.5 h-3.5" /> Upload reference images (multiple)
                    </button>
                  )}
                </div>

                {/* Tabs: Chars, Scene, Props, Time, Adv */}
                <div className="flex gap-0 border-b border-white/10">
                  {([["chars", "Chars"], ["scene", "Scene"], ["props", "Props"], ["time", "Time"], ["adv", "Adv"]] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setAiGenTab(key)}
                      className={`px-4 py-2 text-xs font-semibold transition border-b-2 ${
                        aiGenTab === key ? "text-orange-400 border-orange-400" : "text-gray-500 border-transparent hover:text-gray-300"
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Tab Content */}
                <div className="min-h-[80px]">
                  {aiGenTab === "chars" && (
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-xs font-semibold text-gray-300">CHARACTERS</span>
                        <button className="text-[10px] text-emerald-400 hover:text-emerald-300 transition font-semibold flex items-center gap-1">
                          <Plus className="w-3 h-3" /> Add
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {(selectedPanel?.characters?.length ? selectedPanel.characters : ["Kaito", "Ryu"]).map((char, i) => (
                          <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-[#1a1a24] rounded-lg border border-white/10">
                            <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white ${
                              i % 3 === 0 ? "bg-orange-500" : i % 3 === 1 ? "bg-red-500" : "bg-blue-500"
                            }`}>{(typeof char === "string" ? char : "C")[0]}</div>
                            <span className="text-xs text-gray-300">{typeof char === "string" ? char : `Char ${i+1}`}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiGenTab === "scene" && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-300">SCENE DESCRIPTION</span>
                      <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                        placeholder="Describe what happens in this scene..."
                        className="w-full h-20 px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none" />
                    </div>
                  )}
                  {aiGenTab === "props" && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-300">PROPS & OBJECTS</span>
                      <input placeholder="e.g. sword, book, phone..." className="w-full px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none" />
                    </div>
                  )}
                  {aiGenTab === "time" && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-300">TIME & SETTING</span>
                      <div className="flex flex-wrap gap-1.5">
                        {["Day", "Night", "Dawn", "Dusk", "Rain", "Snow", "Indoor", "Outdoor"].map(t => (
                          <button key={t} className="px-3 py-1.5 rounded-lg text-[10px] font-medium bg-[#1a1a24] text-gray-400 border border-white/10 hover:border-purple-500/30 hover:text-purple-300 transition">{t}</button>
                        ))}
                      </div>
                    </div>
                  )}
                  {aiGenTab === "adv" && (
                    <div className="space-y-2">
                      <span className="text-xs font-semibold text-gray-300">ADVANCED</span>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">Shot Type</label>
                          <select className="w-full px-2 py-1.5 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white focus:outline-none">
                            <option>Auto</option>
                            <option>Close-up</option>
                            <option>Medium Shot</option>
                            <option>Full Shot</option>
                            <option>Establishing Shot</option>
                            <option>Extreme Close-up</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1 block">Style</label>
                          <select className="w-full px-2 py-1.5 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white focus:outline-none">
                            <option>Manga B&W</option>
                            <option>Full Color</option>
                            <option>Webtoon</option>
                            <option>Realistic</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Stage Direction */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-400">Stage Direction</label>
                    <button className="text-gray-600 hover:text-gray-400 transition"><Maximize2 className="w-3 h-3" /></button>
                  </div>
                  <textarea value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                    placeholder="Describe the scene action..."
                    className="w-full h-16 px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none" />
                </div>

                {/* Dialogue */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-medium text-gray-400">Dialogue</label>
                    <button className="text-gray-600 hover:text-gray-400 transition"><Maximize2 className="w-3 h-3" /></button>
                  </div>
                  <textarea placeholder='Character: "Line..."'
                    className="w-full h-12 px-3 py-2 bg-[#0f0f14] border border-white/10 rounded-lg text-xs text-white placeholder-gray-600 focus:border-emerald-500/50 focus:outline-none resize-none" />
                </div>

                {/* Generate Button */}
                <button
                  onClick={generatePanelContent}
                  disabled={isGenerating}
                  className="w-full py-3 bg-gradient-to-r from-pink-500 via-purple-500 to-pink-500 hover:opacity-90 disabled:opacity-50 text-white rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-500/20"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate with AI Manga {generationMode === "multi" ? `(${sceneCount} scenes)` : ""}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Quick Start Guide (pic2) */}
      {showQuickStart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setShowQuickStart(false)}>
          <div className="relative max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="bg-[#13131a] border border-white/10 rounded-2xl p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-black text-white tracking-tight">QUICK START GUIDE</h3>
                <button onClick={() => setShowQuickStart(false)} className="p-1.5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition">
                  <XIcon className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3">
                <button onClick={() => { setShowQuickStart(false); }}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-[#1a1a24] hover:bg-[#1f1f2c] border border-white/5 hover:border-white/10 rounded-xl transition group">
                  <div className="w-8 h-8 rounded-full bg-purple-500 flex items-center justify-center text-white font-bold text-sm shrink-0">1</div>
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition">Create Story & Episodes</span>
                </button>
                <button onClick={() => { setShowQuickStart(false); }}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-[#1a1a24] hover:bg-[#1f1f2c] border border-white/5 hover:border-white/10 rounded-xl transition group">
                  <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white font-bold text-sm shrink-0">2</div>
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition">Build Assets <span className="text-gray-500 font-normal">(Characters, Scenes)</span></span>
                </button>
                <button onClick={() => { setShowQuickStart(false); setActiveTab("aimanga"); }}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-[#1a1a24] hover:bg-[#1f1f2c] border border-white/5 hover:border-white/10 rounded-xl transition group">
                  <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-bold text-sm shrink-0">3</div>
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition">Generate Panels</span>
                </button>
                <button onClick={() => { setShowQuickStart(false); setCanvasViewMode("fullpage"); }}
                  className="w-full flex items-center gap-4 px-5 py-4 bg-[#1a1a24] hover:bg-[#1f1f2c] border border-white/5 hover:border-white/10 rounded-xl transition group">
                  <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold text-sm shrink-0">4</div>
                  <span className="text-sm font-semibold text-gray-200 group-hover:text-white transition">Compose Pages</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
