"use client";

import { useRef, useEffect, useState } from "react";
import type { Bubble, MaskDot } from "./canvas-types";
import {
  estimateFontSize, bubbleEllipse, roughEllipsePath, tailPath, rectTailPath,
  rectOutlinePathWithGap, cloudPath, burstPoints,
} from "./canvas-helpers";

// ── TransformControls ──────────────────────────────────────────────────────
export function TransformControls({
  rotation, flipX, flipY,
  onRotationChange, onFlipXChange, onFlipYChange,
  accentColor = "emerald",
}: {
  rotation: number; flipX: boolean; flipY: boolean;
  onRotationChange: (v: number) => void;
  onFlipXChange: (v: boolean) => void;
  onFlipYChange: (v: boolean) => void;
  accentColor?: string;
}) {
  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-300 font-semibold">Transform</span>
        <button onClick={() => onRotationChange(0)} className="px-2 py-1 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition">Reset</button>
      </div>
      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-300 font-semibold">Rotation</span>
          <div className="flex items-center gap-2">
            <button onClick={() => onRotationChange(Math.max(-180, rotation - 15))} className="w-8 h-6 bg-white/5 hover:bg-white/10 text-gray-300 rounded flex items-center justify-center text-xs transition">-15°</button>
            <button onClick={() => onRotationChange(Math.min(180, rotation + 15))} className="w-8 h-6 bg-white/5 hover:bg-white/10 text-gray-300 rounded flex items-center justify-center text-xs transition">+15°</button>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="range" min={-180} max={180} value={rotation} onChange={e => onRotationChange(Number(e.target.value))} className={`flex-1 accent-${accentColor}-500`} />
          <input type="number" min={-180} max={180} value={rotation} onChange={e => onRotationChange(Number(e.target.value))} className="w-16 bg-[#1a1a1a] border border-white/10 rounded px-2 py-1 text-xs text-white text-center focus:outline-none" />
          <span className="text-xs text-gray-400">°</span>
        </div>
      </div>
      <div>
        <span className="text-xs text-gray-300 font-semibold mb-2 block">Flip & Mirror</span>
        <div className="grid grid-cols-2 gap-2">
          <button onClick={() => onFlipXChange(!flipX)} className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 border ${flipX ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V8m0 0l3 3m-3-3l-3 3m14 8V8m0 0l-3 3m3-3l3 3" /></svg>
            Flip H
          </button>
          <button onClick={() => onFlipYChange(!flipY)} className={`px-3 py-2 rounded-lg text-xs font-medium transition flex items-center justify-center gap-2 border ${flipY ? "bg-blue-500/20 border-blue-500/40 text-blue-200" : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7H8m0 0l3 3m-3-3L8 4M8 17h8m0 0l-3-3m3 3l3-3" /></svg>
            Flip V
          </button>
        </div>
      </div>
      <div>
        <span className="text-xs text-gray-300 font-semibold mb-2 block">Quick Actions</span>
        <div className="grid grid-cols-3 gap-2">
          <button onClick={() => { onFlipXChange(false); onFlipYChange(false); onRotationChange(0); }} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition">Reset All</button>
          <button onClick={() => onRotationChange(90)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition">90°</button>
          <button onClick={() => onRotationChange(-90)} className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded text-xs font-medium transition">-90°</button>
        </div>
      </div>
    </div>
  );
}

// ── ResizeHandles ──────────────────────────────────────────────────────────
export function ResizeHandles({
  isSelected, onResizeStart, onRotateStart, accentColor = "emerald", rotation = 0,
}: {
  isSelected: boolean;
  onResizeStart: (handle: string, event: React.MouseEvent) => void;
  onRotateStart: (event: React.MouseEvent) => void;
  accentColor?: string;
  rotation?: number;
}) {
  if (!isSelected) return null;
  const col   = accentColor === "emerald" ? "#10b981" : accentColor === "purple" ? "#9333ea" : "#f97316";
  const colBg = accentColor === "emerald" ? "#34d399" : accentColor === "purple" ? "#a855f7" : "#fb923c";
  const shadow = `0 0 0 3px ${col}44, 0 2px 6px rgba(0,0,0,0.4)`;
  
  // Show rotation degree indicator when rotation is not 0
  const showRotationIndicator = rotation !== undefined && rotation !== 0;

  return (
    <>
      {/* Dashed selection border */}
      <div className="absolute pointer-events-none"
        style={{ inset: -3, border: `2px dashed ${col}`, borderRadius: 3, opacity: 0.85 }} />
      {[
        { id: "nw", style: { top: -7, left: -7, cursor: "nw-resize" } },
        { id: "ne", style: { top: -7, right: -7, cursor: "ne-resize" } },
        { id: "sw", style: { bottom: -7, left: -7, cursor: "sw-resize" } },
        { id: "se", style: { bottom: -7, right: -7, cursor: "se-resize" } },
        { id: "n",  style: { top: -7,    left: "50%", transform: "translateX(-50%)", cursor: "n-resize" } },
        { id: "s",  style: { bottom: -7, left: "50%", transform: "translateX(-50%)", cursor: "s-resize" } },
        { id: "w",  style: { top: "50%", left: -7,    transform: "translateY(-50%)", cursor: "w-resize" } },
        { id: "e",  style: { top: "50%", right: -7,   transform: "translateY(-50%)", cursor: "e-resize" } },
      ].map(h => (
        <div key={h.id}
          className="absolute w-3.5 h-3.5 rounded-full border-2 border-white"
          style={{ ...h.style, position: "absolute", backgroundColor: colBg, boxShadow: shadow, zIndex: 50 } as React.CSSProperties}
          onMouseDown={e => { e.stopPropagation(); onResizeStart(h.id, e); }}
        />
      ))}
      {/* Rotation handle */}
      <div className="absolute w-8 h-8 rounded-full border-3 border-white flex items-center justify-center bg-blue-500"
        style={{ top: "50%", right: -48, transform: "translateY(-50%)", backgroundColor: col, boxShadow: `0 0 0 3px ${col}44, 0 4px 12px rgba(0,0,0,0.4)`, cursor: "grab", position: "absolute", zIndex: 9999 } as React.CSSProperties}
        onMouseDown={e => { 
          e.stopPropagation(); 
          onRotateStart(e); 
        }}>
        <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
      </div>
      
      {/* Rotation degree indicator in center */}
      {showRotationIndicator && (
        <div 
          className="absolute pointer-events-none flex items-center justify-center"
          style={{
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 60
          }}
        >
          <div className="px-2 py-1 bg-black/80 rounded text-xs text-white font-mono border border-white/20 backdrop-blur-sm">
            {rotation}°
          </div>
        </div>
      )}
    </>
  );
}

// ── BubbleSVG ──────────────────────────────────────────────────────────────
export function BubbleSVG({ b, isSelected }: { b: Bubble; isSelected: boolean }) {
  const seed = b.id;
  const e = bubbleEllipse(b.w, b.h);
  const sw = isSelected ? 2.5 : 2;
  const fillColor = b.flippedColors ? "#1a1a2e" : (b.bubbleType === "whisper" ? "rgba(240,240,255,0.85)" : "rgba(255,255,255,0.97)");
  const strokeColor = b.flippedColors ? "rgba(255,255,255,0.9)" : "#1a1a2e";
  const textColor = b.flippedColors ? "rgba(255,255,255,0.95)" : (b.bubbleType === "whisper" ? "#555" : "#1a1a2e");
  const hasTail = b.tailMode !== "none" && !["shout", "sfx"].includes(b.bubbleType);
  const font = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;

  return (
    <>
      <svg width={b.w} height={b.h} viewBox={`0 0 ${b.w} ${b.h}`}
        style={{ position: "absolute", inset: 0, overflow: "visible", pointerEvents: "none" }}>
        <defs>
          <pattern id={`dots-${b.id}`} patternUnits="userSpaceOnUse" width="6" height="6">
            <circle cx="3" cy="3" r="1.5" fill={strokeColor} opacity="0.3" />
          </pattern>
        </defs>

        {b.bubbleType === "thought" ? (
          <>
            <path d={cloudPath(b.w, b.h)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
            <path d={cloudPath(b.w, b.h)} fill={fillColor} stroke="none" />
          </>
        ) : b.bubbleType === "oval" ? (
          <>
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" />
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke="none" />}
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} />
          </>
        ) : b.bubbleType === "speechRough" ? (
          <>
            <path d={roughEllipsePath(b.w, b.h, seed)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
            <path d={roughEllipsePath(b.w, b.h, seed)} fill={fillColor} stroke="none" />
          </>
        ) : b.bubbleType === "speechHalftone" ? (
          <>
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} />
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={`url(#dots-${b.id})`} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} fillOpacity={0.86} stroke="none" />}
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={`url(#dots-${b.id})`} stroke="none" />
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} opacity={0.86} stroke="none" />
          </>
        ) : b.bubbleType === "shout" ? (
          <polygon
            points={burstPoints(b.w, b.h, 12, seed).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
            fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="miter"
          />
        ) : b.bubbleType === "sfx" ? (
          <polygon
            points={burstPoints(b.w, b.h, 18, seed, true).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")}
            fill={fillColor} stroke={strokeColor} strokeWidth={2.8} strokeLinejoin="miter"
          />
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
        ) : b.bubbleType === "whisper" ? (
          <>
            <path d={roughEllipsePath(b.w, b.h, seed)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" strokeDasharray="4 3" />
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
            <path d={roughEllipsePath(b.w, b.h, seed)} fill={fillColor} stroke="none" />
          </>
        ) : (
          /* default: speech */
          <>
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" />
            {hasTail && <path d={tailPath(b.w, b.h, b.tailDir)} fill={fillColor} stroke="none" />}
            <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
          </>
        )}
      </svg>

      {/* Text layer */}
      <div
        className="absolute inset-0 flex items-center justify-center"
        style={{
          padding: b.bubbleType === "rect" || b.bubbleType === "rectRound" ? "12px 16px" : "16px 24px",
          fontSize: font,
          lineHeight: 1.3,
          color: textColor,
          overflowWrap: "anywhere",
          whiteSpace: "pre-wrap",
          textAlign: "center",
          fontFamily: "'Noto Sans SC', 'Comic Sans MS', 'Bangers', 'Segoe UI', sans-serif",
          fontWeight: b.bubbleType === "sfx" || b.bubbleType === "shout" ? 900 : 400,
          letterSpacing: b.bubbleType === "sfx" ? "0.06em" : b.bubbleType === "shout" ? "0.02em" : "0em",
          fontStyle: b.bubbleType === "whisper" ? "italic" : "normal",
          pointerEvents: "none",
        }}
      >
        {b.text}
      </div>
    </>
  );
}

// ── MaskCanvas ─────────────────────────────────────────────────────────────
// Overlays the image directly by mirroring its CSS transform.
// The canvas moves WITH the image when panned/zoomed — no clipping issues.
export function MaskCanvas({
  mask, opacity, width, height,
}: {
  mask: MaskDot[]; opacity: number; width: number; height: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [imageStyleKey, setImageStyleKey] = useState<string>('');

  // Mirror the image's CSS transform onto the canvas element so they always overlap.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const container = canvas.closest('[data-canvas-editor="true"]');
    const image = container?.querySelector('img:not([class*="mask"])') as HTMLImageElement;
    if (!image) return;

    const update = () => {
      // Copy image transform directly to canvas
      canvas.style.transform = image.style.transform || '';
      canvas.style.transformOrigin = image.style.transformOrigin || 'top left';
      setImageStyleKey(image.getAttribute('style') ?? '');
    };
    const observer = new MutationObserver(update);
    observer.observe(image, { attributes: true, attributeFilter: ['style'] });
    update();
    return () => observer.disconnect();
  }, []);

  // Draw dots in image-pixel space. No ctx.setTransform needed — canvas is already
  // positioned and scaled by CSS transform to match the image exactly.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const container = canvas.closest('[data-canvas-editor="true"]') as HTMLElement;
    const image = container?.querySelector('img:not([class*="mask"])') as HTMLImageElement;

    // Resize canvas to natural image dimensions so 1 canvas px = 1 image px
    const natW = image?.naturalWidth  || width;
    const natH = image?.naturalHeight || height;
    if (canvas.width !== natW)  canvas.width  = natW;
    if (canvas.height !== natH) canvas.height = natH;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (mask.length === 0) return;

    ctx.globalAlpha = opacity;
    ctx.fillStyle = 'rgba(59,130,246,0.7)';
    for (const dot of mask) {
      ctx.beginPath();
      ctx.arc(dot.x, dot.y, dot.r / 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }, [mask, opacity, width, height, imageStyleKey]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute pointer-events-none"
      style={{ zIndex: 10, left: 0, top: 0, transformOrigin: 'top left' }}
    />
  );
}

export function RectangleCanvas({
  rectangle, width, height, selected, onResize, onDrag, color = "blue", aspectRatio, isAspectRatioAnimating = false, isSquareMode = false,
}: {
  rectangle: { x: number; y: number; width: number; height: number } | null;
  width: number;
  height: number;
  selected?: boolean;
  onResize?: (handle: string, newX: number, newY: number, newWidth: number, newHeight: number) => void;
  onDrag?: (newX: number, newY: number, newWidth: number, newHeight: number) => void;
  color?: "blue" | "orange" | "purple" | "cyan";
  aspectRatio?: string; // e.g., "16:9", "9:16", "1:1"
  isAspectRatioAnimating?: boolean;
  isSquareMode?: boolean; // Square mode for GPT-1.5
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number; rectX: number; rectY: number; width: number; height: number } | null>(null);
  const [hoveredCorner, setHoveredCorner] = useState<number | null>(null);
  const [mousePos, setMousePos] = useState<{ x: number; y: number } | null>(null);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeStart, setResizeStart] = useState<{ mouseX: number; mouseY: number; rectX: number; rectY: number; width: number; height: number; handle: string } | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    
    if (!rectangle) return;
    
    // Define colors based on color prop
    const colors = color === "orange" 
      ? { fill: "rgba(251,146,60,1)", border: "rgba(251,146,60,0.8)", selected: "rgba(251,146,60,1)" }
      : color === "purple"
      ? { fill: "rgba(168,85,247,1)", border: "rgba(168,85,247,0.8)", selected: "rgba(168,85,247,1)" }
      : color === "cyan"
      ? { fill: "rgba(6,182,212,1)", border: "rgba(6,182,212,0.8)", selected: "rgba(6,182,212,1)" }
      : { fill: "rgba(59,130,246,1)", border: "rgba(59,130,246,0.8)", selected: "rgba(59,130,246,1)" };
    
    // Always show fill overlay for Rectangle Inpaint (even with aspect ratio)
    ctx.globalAlpha = 0.3;
    ctx.fillStyle = colors.fill;
    ctx.fillRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    
    ctx.globalAlpha = 1;
    ctx.strokeStyle = selected ? colors.selected : colors.border;
    ctx.lineWidth = selected ? 3 : 2;
    ctx.strokeRect(rectangle.x, rectangle.y, rectangle.width, rectangle.height);
    
    // Draw dots when not selected, and edge handles for rectangle mode
    if (!selected) {
      const dotSize = 12; // Increased from 6 to 12 for better usability
      
      // Rectangle Inpaint: 
      // - Purple square mode: show only 4 corner dots for scale-only resizing
      // - Cyan rectangle mask: ALWAYS show only 4 corner dots (no edge resizing)
      // - Blue normal mode: show all 8 dots for full resizing control (corners + edges)
      // Orange crop (Crop): show 4 corner dots when aspect ratio is set, 8 dots when free scaling
      
      // For cyan rectangle mask (color === "cyan"), ALWAYS show only 4 corner dots
      let dots: { x: number; y: number; type: string }[];
      
      if (color === "cyan") {
        // Cyan rectangle mask: ALWAYS show only 4 corner dots (no edge resizing)
        dots = [
          { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
          { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
          { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
        ];
      } else if (isSquareMode) {
        // Purple square mode: show only 4 corner dots
        dots = [
          { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
          { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
          { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
        ];
      } else if (color === "blue") {
        // Blue normal mode: show all 8 dots
        dots = [
          { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
          { x: rectangle.x + rectangle.width / 2, y: rectangle.y, type: "n" }, // top-center
          { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, type: "e" }, // right-center
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
          { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, type: "s" }, // bottom-center
          { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
          { x: rectangle.x, y: rectangle.y + rectangle.height / 2, type: "w" }, // left-center
        ];
      } else if (aspectRatio) {
        // Orange crop with aspect ratio: show 4 corner dots
        dots = [
          { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
          { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
          { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
        ];
      } else {
        // Default: show all 8 dots
        dots = [
          { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
          { x: rectangle.x + rectangle.width / 2, y: rectangle.y, type: "n" }, // top-center
          { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, type: "e" }, // right-center
          { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
          { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, type: "s" }, // bottom-center
          { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
          { x: rectangle.x, y: rectangle.y + rectangle.height / 2, type: "w" }, // left-center
        ];
      }
      
      dots.forEach((dot) => {
        // Check if mouse is hovering over this dot
        const isHovered = mousePos && 
          Math.abs(mousePos.x - dot.x) <= dotSize/2 + 4 && 
          Math.abs(mousePos.y - dot.y) <= dotSize/2 + 4;
        
        // Draw hover highlight (larger glow)
        if (isHovered) {
          ctx.globalAlpha = 0.3;
          ctx.fillStyle = colors.fill;
          ctx.beginPath();
          ctx.arc(dot.x, dot.y, dotSize/2 + 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
        
        // Draw dot with 30% opacity center
        ctx.globalAlpha = 0.3;
        ctx.fillStyle = colors.fill;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw solid border (like text assets)
        ctx.globalAlpha = 1;
        ctx.strokeStyle = isHovered ? "rgba(255,255,255,0.9)" : colors.border;
        ctx.lineWidth = isHovered ? 2 : 1.5;
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dotSize / 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Reset alpha for other elements
        ctx.globalAlpha = 1;
      });
    }
    
    // Draw edge handles for rectangle mode (blue only, NOT for cyan rectangle mask)
    if (!selected && color === "blue") {
      const handleSize = 8;
      ctx.fillStyle = "rgba(6,182,212,0.8)";
      ctx.strokeStyle = "rgba(255,255,255,0.8)";
      ctx.lineWidth = 1;
      
      const handles = [
        { x: rectangle.x + rectangle.width / 2, y: rectangle.y, cursor: "n-resize", type: "n" }, // top-center
        { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, cursor: "e-resize", type: "e" }, // right-center
        { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, cursor: "s-resize", type: "s" }, // bottom-center
        { x: rectangle.x, y: rectangle.y + rectangle.height / 2, cursor: "w-resize", type: "w" }, // left-center
      ];
      
      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      });
    }
    
    // Draw resize handles when selected
    if (selected) {
      const handleSize = 8;
      ctx.fillStyle = "rgba(59,130,246,1)";
      ctx.strokeStyle = "white";
      ctx.lineWidth = 1;
      
      const handles = [
        { x: rectangle.x, y: rectangle.y, cursor: "nw-resize", type: "nw" },
        { x: rectangle.x + rectangle.width / 2, y: rectangle.y, cursor: "n-resize", type: "n" },
        { x: rectangle.x + rectangle.width, y: rectangle.y, cursor: "ne-resize", type: "ne" },
        { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, cursor: "e-resize", type: "e" },
        { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, cursor: "se-resize", type: "se" },
        { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, cursor: "s-resize", type: "s" },
        { x: rectangle.x, y: rectangle.y + rectangle.height, cursor: "sw-resize", type: "sw" },
        { x: rectangle.x, y: rectangle.y + rectangle.height / 2, cursor: "w-resize", type: "w" },
      ];
      
      handles.forEach(handle => {
        ctx.fillRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
        ctx.strokeRect(handle.x - handleSize/2, handle.y - handleSize/2, handleSize, handleSize);
      });
    }
  }, [rectangle, width, height, selected]);

  // Handle mouse move for dragging and resizing
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      // Prevent interactions during aspect ratio animation
      if (isAspectRatioAnimating) return;
      
      // Cancel any pending animation frame
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      // Use requestAnimationFrame for smoother updates
      animationFrameRef.current = requestAnimationFrame(() => {
        // Handle resizing
        if (isResizing && resizeStart && onResize) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          
          // Delta from the initial mouse click position
          const deltaX = currentX - resizeStart.mouseX;
          const deltaY = currentY - resizeStart.mouseY;
          
          // Start from the original rectangle position/size at drag start
          let newX = resizeStart.rectX;
          let newY = resizeStart.rectY;
          let newWidth = resizeStart.width;
          let newHeight = resizeStart.height;
          
          // Parse aspect ratio if provided (e.g., "16:9" -> 1.777...)
          let targetRatio: number | null = null;
          if (isSquareMode) {
            // Square mode always enforces 1:1 aspect ratio
            targetRatio = 1;
          } else if (color === "cyan") {
            // Cyan rectangle mask: ALWAYS use 1:1 aspect ratio for simplicity
            targetRatio = 1;
          } else if (aspectRatio) {
            const [w, h] = aspectRatio.split(':').map(Number);
            if (!isNaN(w) && !isNaN(h) && h > 0) {
              targetRatio = w / h;
            }
          } else {
            // No aspect ratio provided
          }

          // Calculate minimum size based on aspect ratio - use specific minimum resolutions for crop tool
          let minWidth = 20;
          let minHeight = 20;
          
          if (color === "cyan") {
            // Cyan rectangle mask: Always use 1:1 minimum (100x100)
            minWidth = 100;
            minHeight = 100;
          } else if (targetRatio && color === "orange") {
            // Crop tool (orange) - use specific minimum resolutions
            const minDimensionMap: Record<number, { width: number; height: number }> = {
              1: { width: 100, height: 100 },    // 1:1 = 100x100 minimum
              0.75: { width: 30, height: 40 },    // 3:4 = 30x40 minimum  
              1.333: { width: 40, height: 30 },    // 4:3 = 40x30 minimum
              1.778: { width: 160, height: 90 },  // 16:9 = 160x90 minimum
              0.5625: { width: 90, height: 160 },  // 9:16 = 90x160 minimum
            };
            
            // Find the closest aspect ratio match
            const aspectRatios = Object.keys(minDimensionMap).map(Number);
            const closestRatio = aspectRatios.reduce((prev, curr) => 
              Math.abs(curr - targetRatio) < Math.abs(prev - targetRatio) ? curr : prev
            );
            
            const minDimensions = minDimensionMap[closestRatio];
            minWidth = minDimensions.width;
            minHeight = minDimensions.height;
          }
          
          // For cyan rectangle mask, prevent edge resizing (only allow corner resizing)
          if (color === "cyan" && ["n", "s", "e", "w"].includes(resizeStart.handle)) {
            // Edge resizing is disabled for cyan rectangle mask
            return;
          }
          
          // Apply minimum size constraint
          switch (resizeStart.handle) {
            case "nw":
              newX = resizeStart.rectX + deltaX;
              newY = resizeStart.rectY + deltaY;
              newWidth = Math.max(minWidth, resizeStart.width - deltaX);
              newHeight = Math.max(minHeight, resizeStart.height - deltaY);
              break;
            case "ne":
              newY = resizeStart.rectY + deltaY;
              newWidth = Math.max(minWidth, resizeStart.width + deltaX);
              newHeight = Math.max(minHeight, resizeStart.height - deltaY);
              break;
            case "sw":
              newX = resizeStart.rectX + deltaX;
              newWidth = Math.max(minWidth, resizeStart.width - deltaX);
              newHeight = Math.max(minHeight, resizeStart.height + deltaY);
              break;
            case "se":
              newWidth = Math.max(minWidth, resizeStart.width + deltaX);
              newHeight = Math.max(minHeight, resizeStart.height + deltaY);
              break;
            case "n":
              newY = resizeStart.rectY + deltaY;
              newHeight = Math.max(minHeight, resizeStart.height - deltaY);
              break;
            case "s":
              newHeight = Math.max(minHeight, resizeStart.height + deltaY);
              break;
            case "e":
              newWidth = Math.max(minWidth, resizeStart.width + deltaX);
              break;
            case "w":
              newX = resizeStart.rectX + deltaX;
              newWidth = Math.max(minWidth, resizeStart.width - deltaX);
              break;
          }

          // Apply aspect ratio constraint if provided (always for cyan rectangle mask)
          if (targetRatio && (color === "cyan" || ["nw", "ne", "sw", "se"].includes(resizeStart.handle))) {
            
            // Calculate both possible constrained dimensions
            const widthConstrainedHeight = newWidth / targetRatio;
            const heightConstrainedWidth = newHeight * targetRatio;
            
            // Apply aspect ratio constraint - for cyan rectangle mask, always enforce strictly
            let constrainedWidth: number, constrainedHeight: number;
            
            if (color === "cyan") {
              // Cyan rectangle mask: ALWAYS enforce aspect ratio strictly
              // Use the larger dimension to maintain aspect ratio properly
              if (newWidth / newHeight > targetRatio) {
                // Width is too large, constrain by height
                constrainedHeight = newHeight;
                constrainedWidth = newHeight * targetRatio;
              } else {
                // Height is too large, constrain by width
                constrainedWidth = newWidth;
                constrainedHeight = newWidth / targetRatio;
              }
            } else {
              // Other modes: choose constraint that results in smaller area (maintains original rectangle bounds)
              if (Math.abs(widthConstrainedHeight - newHeight) < Math.abs(heightConstrainedWidth - newWidth)) {
                // Width constraint is closer to original
                constrainedWidth = newWidth;
                constrainedHeight = widthConstrainedHeight;
              } else {
                // Height constraint is closer to original
                constrainedWidth = heightConstrainedWidth;
                constrainedHeight = newHeight;
              }
            }
            
            // Adjust position based on which corner is being dragged
            switch (resizeStart.handle) {
              case "nw":
                // Top-left: adjust both X and Y to maintain bottom-right corner
                newX = resizeStart.rectX + resizeStart.width - constrainedWidth;
                newY = resizeStart.rectY + resizeStart.height - constrainedHeight;
                break;
              case "ne":
                // Top-right: adjust Y to maintain bottom-left corner
                newY = resizeStart.rectY + resizeStart.height - constrainedHeight;
                break;
              case "sw":
                // Bottom-left: adjust X to maintain top-right corner
                newX = resizeStart.rectX + resizeStart.width - constrainedWidth;
                break;
              // se: bottom-right - no position adjustment needed
            }
            
            // Apply constrained dimensions if they meet minimum size
            if (constrainedWidth >= 20 && constrainedHeight >= 20) {
              newWidth = constrainedWidth;
              newHeight = constrainedHeight;
            }
          }
          
          // Apply boundary constraints - use actual canvas bounds
          const PADDING = 0;
          newX = Math.max(PADDING, Math.min(newX, width - newWidth));
          newY = Math.max(PADDING, Math.min(newY, height - newHeight));
          
          // For cyan rectangle mask, ensure aspect ratio is maintained even with boundary constraints
          if (color === "cyan" && targetRatio) {
            // Check if boundary constraints broke the aspect ratio
            const boundaryConstrainedWidth = Math.min(newWidth, width);
            const boundaryConstrainedHeight = Math.min(newHeight, height);
            
            // If boundary constraints would break aspect ratio, prioritize aspect ratio
            const boundaryRatio = boundaryConstrainedWidth / boundaryConstrainedHeight;
            if (Math.abs(boundaryRatio - targetRatio) > 0.01) {
              // Boundary constraints broke aspect ratio, recalculate to maintain it
              if (boundaryConstrainedWidth / boundaryConstrainedHeight > targetRatio) {
                // Width is too large, constrain by height
                newHeight = boundaryConstrainedHeight;
                newWidth = boundaryConstrainedHeight * targetRatio;
              } else {
                // Height is too large, constrain by width
                newWidth = boundaryConstrainedWidth;
                newHeight = boundaryConstrainedWidth / targetRatio;
              }
            } else {
              newWidth = boundaryConstrainedWidth;
              newHeight = boundaryConstrainedHeight;
            }
          } else {
            newWidth = Math.min(newWidth, width);
            newHeight = Math.min(newHeight, height);
          }
          
          onResize(resizeStart.handle, newX, newY, newWidth, newHeight);
          return;
        }
        
        // Handle dragging
        if (isDragging && dragStart && onDrag) {
          const rect = canvasRef.current?.getBoundingClientRect();
          if (!rect) return;
          
          const currentX = e.clientX - rect.left;
          const currentY = e.clientY - rect.top;
          
          // Delta from the initial mouse click position
          const deltaX = currentX - dragStart.x;
          const deltaY = currentY - dragStart.y;
          
          // Offset the original rectangle position by the delta
          let newX = dragStart.rectX + deltaX;
          let newY = dragStart.rectY + deltaY;
          
          
          // Apply boundary constraints - use actual canvas bounds
          const PADDING = 0;
          newX = Math.max(PADDING, Math.min(newX, width - dragStart.width));
          newY = Math.max(PADDING, Math.min(newY, height - dragStart.height));
          
          onDrag(newX, newY, dragStart.width, dragStart.height);
        }
      });
    };

    const handleMouseUp = () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsDragging(false);
      setDragStart(null);
      setIsResizing(false);
      setResizeStart(null);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [isDragging, isResizing, dragStart, resizeStart, onDrag, onResize, aspectRatio, color, isSquareMode]);

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className="absolute inset-0"
      style={{ zIndex: 10, cursor: selected ? "move" : "pointer" }}
      tabIndex={0} // Make canvas focusable
      onMouseDown={(e) => {
        if (!rectangle) return;
        
        e.preventDefault(); // Prevent default behavior
        e.stopPropagation(); // Stop event propagation
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // Check if clicking on dots (when not selected)
        if (!selected) {
          const dotSize = 12; // Match the new dot size
          
          // Use same dot logic as drawing - cyan and square mode use only 4 corner dots, blue uses 8, orange uses 4 with aspect ratio
          const dots = (color === "cyan" || isSquareMode) ? [
            { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
            { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
            { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
          ] : color === "blue" ? [
            { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
            { x: rectangle.x + rectangle.width / 2, y: rectangle.y, type: "n" }, // top-center
            { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, type: "e" }, // right-center
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
            { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, type: "s" }, // bottom-center
            { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
            { x: rectangle.x, y: rectangle.y + rectangle.height / 2, type: "w" }, // left-center
          ] : aspectRatio ? [
            { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
            { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
            { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
          ] : [
            { x: rectangle.x, y: rectangle.y, type: "nw" }, // top-left
            { x: rectangle.x + rectangle.width / 2, y: rectangle.y, type: "n" }, // top-center
            { x: rectangle.x + rectangle.width, y: rectangle.y, type: "ne" }, // top-right
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, type: "e" }, // right-center
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, type: "se" }, // bottom-right
            { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, type: "s" }, // bottom-center
            { x: rectangle.x, y: rectangle.y + rectangle.height, type: "sw" }, // bottom-left
            { x: rectangle.x, y: rectangle.y + rectangle.height / 2, type: "w" }, // left-center
          ];
          
          for (const dot of dots) {
            if (Math.abs(x - dot.x) <= dotSize/2 && Math.abs(y - dot.y) <= dotSize/2) {
              // Clicked on dot - start resizing
              setIsResizing(true);
              setResizeStart({ mouseX: x, mouseY: y, rectX: rectangle.x, rectY: rectangle.y, width: rectangle.width, height: rectangle.height, handle: dot.type });
              return;
            }
          }
        }
        
        // Check if clicking inside rectangle area (not on handles/corners)
        if (x >= rectangle.x && x <= rectangle.x + rectangle.width &&
            y >= rectangle.y && y <= rectangle.y + rectangle.height) {
          // Clicked on rectangle area - ready to drag, but don't start dragging yet
          // The actual drag will start on mouse move
          if (onDrag) {
            setIsDragging(true);
            setDragStart({ x, y, rectX: rectangle.x, rectY: rectangle.y, width: rectangle.width, height: rectangle.height });
          }
        }
      }}
      onMouseMove={(e) => {
        if (!rectangle) return;
        
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;
        
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        setMousePos({ x, y });
        
        // Check if hovering over dots to update cursor
        if (!selected) {
          const dotSize = 12;
          
          // Use same dot logic - 4 corners for aspect ratio, 8 dots for free
          const dots = aspectRatio ? [
            { x: rectangle.x, y: rectangle.y, cursor: "nw-resize" }, // top-left
            { x: rectangle.x + rectangle.width, y: rectangle.y, cursor: "ne-resize" }, // top-right
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, cursor: "se-resize" }, // bottom-right
            { x: rectangle.x, y: rectangle.y + rectangle.height, cursor: "sw-resize" }, // bottom-left
          ] : [
            { x: rectangle.x, y: rectangle.y, cursor: "nw-resize" }, // top-left
            { x: rectangle.x + rectangle.width / 2, y: rectangle.y, cursor: "n-resize" }, // top-center
            { x: rectangle.x + rectangle.width, y: rectangle.y, cursor: "ne-resize" }, // top-right
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height / 2, cursor: "e-resize" }, // right-center
            { x: rectangle.x + rectangle.width, y: rectangle.y + rectangle.height, cursor: "se-resize" }, // bottom-right
            { x: rectangle.x + rectangle.width / 2, y: rectangle.y + rectangle.height, cursor: "s-resize" }, // bottom-center
            { x: rectangle.x, y: rectangle.y + rectangle.height, cursor: "sw-resize" }, // bottom-left
            { x: rectangle.x, y: rectangle.y + rectangle.height / 2, cursor: "w-resize" }, // left-center
          ];
          
          let cursorStyle = "pointer";
          for (const dot of dots) {
            if (Math.abs(x - dot.x) <= dotSize/2 + 4 && Math.abs(y - dot.y) <= dotSize/2 + 4) {
              cursorStyle = dot.cursor;
              break;
            }
          }
          
          // Update cursor
          const canvas = canvasRef.current;
          if (canvas) {
            canvas.style.cursor = cursorStyle;
          }
        }
      }}
      onMouseLeave={() => {
        setMousePos(null);
        // Reset cursor when leaving canvas
        const canvas = canvasRef.current;
        if (canvas) {
          canvas.style.cursor = selected ? "move" : "pointer";
        }
      }}
    />
  );
}
