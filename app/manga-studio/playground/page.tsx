"use client";

import { useRef, useState } from "react";
import { ArrowLeft, Eraser, Move, Paintbrush, Plus, RotateCcw, RotateCw, Trash2, Type } from "lucide-react";
import Link from "next/link";

type MaskDot = { x: number; y: number; r: number };

type BubbleType =
  | "speech"
  | "speechTop"
  | "speechRough"
  | "speechHalftone"
  | "thought"
  | "whisper"
  | "shout"
  | "sfx"
  | "rect"
  | "rectHalftone"
  | "double";

type TailMode = "none" | "auto" | "manual";

type TailDir = "bottom-left" | "bottom-right" | "left" | "right";

type Bubble = {
  id: string;
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
};

type DragMode =
  | { type: "move"; startX: number; startY: number; origX: number; origY: number }
  | { type: "resize"; handle: "se"; startX: number; startY: number; orig: Bubble }
  | { type: "tail"; startX: number; startY: number; origTailX: number; origTailY: number }
  | null;

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
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
  const inset = 4; // how far inside the ellipse the path starts

  if (dir === "bottom-left") {
    const sx = e.cx - spread;
    const sy = e.cy + e.ry - inset;
    return `M ${sx},${sy} q -${len * 0.2},${len * 1.0} -${len * 0.7},${len * 1.2} q ${len * 0.6},-${len * 0.25} ${len * 0.7 + spread * 2},-${len * 1.2}`;
  }
  if (dir === "bottom-right") {
    const sx = e.cx + spread;
    const sy = e.cy + e.ry - inset;
    return `M ${sx},${sy} q ${len * 0.2},${len * 1.0} ${len * 0.7},${len * 1.2} q -${len * 0.6},-${len * 0.25} -${len * 0.7 + spread * 2},-${len * 1.2}`;
  }
  if (dir === "left") {
    const sx = e.cx - e.rx + inset;
    const sy = e.cy + spread * 0.4;
    return `M ${sx},${sy} q -${len * 1.0},${len * 0.15} -${len * 1.2},${len * 0.6} q ${len * 0.2},-${len * 0.6} ${len * 1.2},-${len * 0.6 + spread}`;
  }
  // right
  const sx = e.cx + e.rx - inset;
  const sy = e.cy + spread * 0.4;
  return `M ${sx},${sy} q ${len * 1.0},${len * 0.15} ${len * 1.2},${len * 0.6} q -${len * 0.2},-${len * 0.6} -${len * 1.2},-${len * 0.6 + spread}`;
}

// Rectangle tail: starts from rect edge, slightly inset so fill covers the seam
function rectTailPath(w: number, h: number, dir: TailDir, tailLen = 26) {
  const len = tailLen;
  const isSide = dir === "left" || dir === "right";
  const sideLen = Math.max(len, 46);
  const spread = isSide ? 14 : 9;
  const cr = 14; // corner radius
  const inset = 6;

  if (dir === "bottom-left") {
    const sx = w * 0.35;
    return `M ${sx - spread},${h - inset} q -${len * 0.15},${len * 0.9} -${len * 0.6},${len * 1.1} q ${len * 0.55},-${len * 0.2} ${len * 0.6 + spread * 2},-${len * 1.1}`;
  }
  if (dir === "bottom-right") {
    const sx = w * 0.65;
    return `M ${sx + spread},${h - inset} q ${len * 0.15},${len * 0.9} ${len * 0.6},${len * 1.1} q -${len * 0.55},-${len * 0.2} -${len * 0.6 + spread * 2},-${len * 1.1}`;
  }
  if (dir === "left") {
    const sy = h * 0.55;
    return `M ${cr + inset},${sy - spread * 0.4} q -${sideLen * 0.95},${sideLen * 0.1} -${sideLen * 1.15},${sideLen * 0.55} q ${sideLen * 0.18},-${sideLen * 0.6} ${sideLen * 1.15},-${sideLen * 0.55 + spread}`;
  }
  // right
  const sy = h * 0.55;
  return `M ${w - cr - inset},${sy - spread * 0.4} q ${sideLen * 0.95},${sideLen * 0.1} ${sideLen * 1.15},${sideLen * 0.55} q -${sideLen * 0.18},-${sideLen * 0.6} -${sideLen * 1.15},-${sideLen * 0.55 + spread}`;
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

  const [tool, setTool] = useState<"paint" | "bubble">("paint");

  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const [brushSize, setBrushSize] = useState(28);
  const [maskOpacity, setMaskOpacity] = useState(0.45);
  const [isEraser, setIsEraser] = useState(false);
  const [isPainting, setIsPainting] = useState(false);
  const [mask, setMask] = useState<MaskDot[]>([]);
  const [undoStack, setUndoStack] = useState<MaskDot[][]>([]);
  const [redoStack, setRedoStack] = useState<MaskDot[][]>([]);

  const [inpaintPrompt, setInpaintPrompt] = useState("");

  const [bubbles, setBubbles] = useState<Bubble[]>([
    {
      id: "b-speech-1",
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
      fontSize: 18,
    },
    {
      id: "b-speech-2",
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
      fontSize: 18,
    },
    {
      id: "b-thought-1",
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
      fontSize: 18,
    },
    {
      id: "b-whisper-1",
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
      fontSize: 18,
    },
    {
      id: "b-shout-1",
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
      fontSize: 18,
    },
    {
      id: "b-sfx-1",
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
      fontSize: 18,
    },
    {
      id: "b-rect-1",
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
      fontSize: 18,
    },
    {
      id: "b-top-1",
      x: 600,
      y: 250,
      w: 220,
      h: 120,
      tailMode: "auto",
      tailDir: "bottom-left",
      tailX: 600,
      tailY: 400,
      text: "NGH...\nN-NO.\nNOT NOW...",
      bubbleType: "speechTop",
      autoFitFont: true,
      fontSize: 18,
    },
    {
      id: "b-rough-1",
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
      fontSize: 18,
    },
    {
      id: "b-half-1",
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
      fontSize: 18,
    },
    {
      id: "b-double-1",
      x: 280,
      y: 330,
      w: 320,
      h: 160,
      tailMode: "none",
      tailDir: "bottom-left",
      tailX: 340,
      tailY: 520,
      text: "I'VE GOT A\nCAT THAT'S\nWAITING\nFOR ME\nAT HOME...",
      bubbleType: "double",
      autoFitFont: true,
      fontSize: 18,
    },
    {
      id: "b-rect-half-1",
      x: 850,
      y: 320,
      w: 240,
      h: 120,
      tailMode: "auto",
      tailDir: "bottom-right",
      tailX: 1100,
      tailY: 480,
      text: "THE WALLS\nARE MOVING.\nDON'T LOOK.",
      bubbleType: "rectHalftone",
      autoFitFont: true,
      fontSize: 18,
    },
  ]);
  const [selectedBubbleId, setSelectedBubbleId] = useState<string | null>(null);
  const [bubbleDrag, setBubbleDrag] = useState<DragMode>(null);

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

  const selectedBubble = bubbles.find((b) => b.id === (selectedBubbleId || bubbles[0]?.id)) || bubbles[0];
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
      fontSize: 18,
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

  // No longer needed: tails are rendered inline using the layered SVG technique

  return (
    <div className="flex flex-col h-full">
      <div className="px-6 py-4 border-b border-white/10 bg-[#0f1117] flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/manga-studio" className="inline-flex items-center gap-2 text-xs text-gray-400 hover:text-white transition">
            <ArrowLeft className="w-4 h-4" />
            Back to Manga Studio
          </Link>
          <div className="w-px h-5 bg-white/10" />
          <div>
            <h1 className="text-white font-bold">Editor Playground</h1>
            <p className="text-[11px] text-gray-500">Iterate on mask + bubbles UX before wiring episodes/pages</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 border bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
          >
            Upload Image
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadImage(file);
            }}
          />
          <button
            onClick={() => setTool("paint")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 border ${
              tool === "paint"
                ? "bg-blue-500/15 border-blue-500/30 text-blue-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <Paintbrush className="w-4 h-4" />
            Paint Mask
          </button>
          <button
            onClick={() => setTool("bubble")}
            className={`px-3 py-2 rounded-lg text-xs font-semibold transition flex items-center gap-2 border ${
              tool === "bubble"
                ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-300"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <Type className="w-4 h-4" />
            Bubble Tool
          </button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_360px] overflow-hidden">
        <div className="p-6 bg-[#0a0a0f]">
          <div
            ref={containerRef}
            className="relative w-full h-[720px] rounded-2xl border border-white/10 bg-gradient-to-br from-purple-900/15 via-[#13131a] to-blue-900/15 overflow-hidden"
            style={{ cursor: tool === "paint" ? "crosshair" : "default" }}
            onMouseDown={(e) => {
              if (tool !== "paint") return;
              commitMaskSnapshot();
              setIsPainting(true);
              addStrokePoint(e.clientX, e.clientY);
            }}
            onMouseMove={(e) => {
              if (tool !== "paint") return;
              if (!isPainting) return;
              addStrokePoint(e.clientX, e.clientY);
            }}
            onMouseUp={() => setIsPainting(false)}
            onMouseLeave={() => setIsPainting(false)}
          >
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
                for (let i = bubbles.length - 1; i >= 0; i--) {
                  const b = bubbles[i];
                  const within = x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h;
                  if (within) {
                    hit = b;
                    break;
                  }
                }

                if (!hit) return;
                setSelectedBubbleId(hit.id);

                const nearHandle = Math.abs(x - (hit.x + hit.w)) < 16 && Math.abs(y - (hit.y + hit.h)) < 16;

                if (nearHandle) {
                  setBubbleDrag({ type: "resize", handle: "se", startX: x, startY: y, orig: hit });
                  return;
                }

                setBubbleDrag({ type: "move", startX: x, startY: y, origX: hit.x, origY: hit.y });
              }}
              onMouseMove={(e) => {
                if (tool !== "bubble") return;
                if (!bubbleDrag) return;
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
                  updateSelectedBubble({
                    x: clamp(bubbleDrag.origX + dx, padding, rect.width - padding - current.w),
                    y: clamp(bubbleDrag.origY + dy, padding, rect.height - padding - current.h),
                  });
                  return;
                }

                if (bubbleDrag.type === "resize") {
                  const dx = x - bubbleDrag.startX;
                  const dy = y - bubbleDrag.startY;
                  const minW = 160;
                  const minH = 72;
                  const nextW = clamp(bubbleDrag.orig.w + dx, minW, rect.width - padding - bubbleDrag.orig.x);
                  const nextH = clamp(bubbleDrag.orig.h + dy, minH, rect.height - padding - bubbleDrag.orig.y);
                  updateSelectedBubble({ w: nextW, h: nextH });
                  return;
                }

                // tail drag removed: direction now controlled via dropdown
              }}
              onMouseUp={() => {
                if (!bubbleDrag) return;
                setBubbleDrag(null);
              }}
              onMouseLeave={() => setBubbleDrag(null)}
            >
              {/* Snap margins guides */}
              {tool === "bubble" && (
                <div className="absolute inset-0 pointer-events-none">
                  <div className="absolute left-[18px] top-[18px] right-[18px] bottom-[18px] border border-white/10 rounded-xl" />
                </div>
              )}

              {/* Thought bubble trailing circles overlay */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                {bubbles.map((b) => {
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

              {bubbles.map((b) => {
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
                    }}
                  >
                    <svg
                      width={b.w}
                      height={b.h}
                      viewBox={`0 0 ${b.w} ${b.h}`}
                      className="absolute inset-0"
                      style={{ shapeRendering: "geometricPrecision", overflow: "visible" }}
                    >
                      <defs>
                        <pattern id={`dots-${b.id}`} width="8" height="8" patternUnits="userSpaceOnUse">
                          <circle cx="1.5" cy="1.5" r="1.1" fill="#000" opacity="0.12" />
                        </pattern>
                      </defs>
                      {b.bubbleType === "thought" ? (
                        <>
                          {/* Cloud: outline → fill */}
                          <path d={cloudPath(b.w, b.h)} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" />
                          <path d={cloudPath(b.w, b.h)} fill="#fff" stroke="none" />
                        </>
                      ) : b.bubbleType === "double" ? (
                        <>
                          {/* Double bubble: two overlapping ellipses */}
                          <ellipse cx={b.w * 0.37} cy={b.h * 0.55} rx={b.w * 0.22} ry={b.h * 0.34} fill="#fff" stroke="none" />
                          <ellipse cx={b.w * 0.67} cy={b.h * 0.38} rx={b.w * 0.22} ry={b.h * 0.34} fill="#fff" stroke="none" />
                          <ellipse cx={b.w * 0.37} cy={b.h * 0.55} rx={b.w * 0.22} ry={b.h * 0.34} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" />
                          <ellipse cx={b.w * 0.67} cy={b.h * 0.38} rx={b.w * 0.22} ry={b.h * 0.34} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" />
                        </>
                      ) : b.bubbleType === "speechTop" ? (
                        <>
                          {/* Top-spike speech: spike behind → fill → outline on top */}
                          <path
                            d={`M ${e.cx - 10} ${e.cy - e.ry + 2} L ${e.cx} ${e.cy - e.ry - 34} L ${e.cx + 10} ${e.cy - e.ry + 2} Z`}
                            fill="#fff"
                            stroke="#1a1a1a"
                            strokeWidth={sw}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                          />
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="#fff" stroke="none" />
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" />
                        </>
                      ) : b.bubbleType === "speechRough" ? (
                        <>
                          <path d={roughEllipsePath(b.w, b.h, seed)} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" />
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill="#fff"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <path d={roughEllipsePath(b.w, b.h, seed)} fill="#fff" stroke="none" />
                        </>
                      ) : b.bubbleType === "speechHalftone" ? (
                        <>
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke="#1a1a1a" strokeWidth={sw} />
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill="#fff"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={`url(#dots-${b.id})`} stroke="none" />
                          <ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="#fff" opacity={0.86} stroke="none" />
                        </>
                      ) : b.bubbleType === "shout" ? (
                        <polygon
                          points={burstPoints(b.w, b.h, 12, seed)
                            .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
                            .join(" ")}
                          fill="#fff"
                          stroke="#1a1a1a"
                          strokeWidth={sw}
                          strokeLinejoin="miter"
                        />
                      ) : b.bubbleType === "sfx" ? (
                        <polygon
                          points={burstPoints(b.w, b.h, 18, seed, true)
                            .map((p) => `${p.x.toFixed(2)},${p.y.toFixed(2)}`)
                            .join(" ")}
                          fill="#fff"
                          stroke="#1a1a1a"
                          strokeWidth={2.8}
                          strokeLinejoin="miter"
                        />
                      ) : b.bubbleType === "rect" ? (
                        <>
                          {/* Rect: tail behind → fill → outline (with gap under BL/BR tail) */}
                          {hasTail && (
                            <path
                              d={rectTailPath(b.w, b.h, b.tailDir)}
                              fill="#fff"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={14} ry={14} fill="#fff" stroke="none" />
                          {hasTail && (b.tailDir === "bottom-left" || b.tailDir === "bottom-right") ? (
                            <path
                              d={rectOutlinePathWithGap(b.w, b.h, 14, "bottom", b.tailDir === "bottom-left" ? b.w * 0.35 : b.w * 0.65, 60)}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          ) : hasTail && b.tailDir === "left" ? (
                            <path
                              d={rectOutlinePathWithGap(b.w, b.h, 14, "left", b.h * 0.55, 48)}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          ) : hasTail && b.tailDir === "right" ? (
                            <path
                              d={rectOutlinePathWithGap(b.w, b.h, 14, "right", b.h * 0.55, 48)}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          ) : (
                            <rect
                              x={4}
                              y={4}
                              width={b.w - 8}
                              height={b.h - 8}
                              rx={14}
                              ry={14}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          )}
                        </>
                      ) : b.bubbleType === "rectHalftone" ? (
                        <>
                          {/* Halftone rect */}
                          {hasTail && (
                            <path
                              d={rectTailPath(b.w, b.h, b.tailDir)}
                              fill="#fff"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          )}
                          <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={14} ry={14} fill={`url(#dots-${b.id})`} stroke="none" />
                          <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={14} ry={14} fill="#fff" opacity={0.86} stroke="none" />
                          {hasTail && (b.tailDir === "bottom-left" || b.tailDir === "bottom-right") ? (
                            <path
                              d={rectOutlinePathWithGap(b.w, b.h, 14, "bottom", b.tailDir === "bottom-left" ? b.w * 0.35 : b.w * 0.65, 60)}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          ) : hasTail && b.tailDir === "left" ? (
                            <path
                              d={rectOutlinePathWithGap(b.w, b.h, 14, "left", b.h * 0.55, 48)}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          ) : hasTail && b.tailDir === "right" ? (
                            <path
                              d={rectOutlinePathWithGap(b.w, b.h, 14, "right", b.h * 0.55, 48)}
                              fill="none"
                              stroke="#1a1a1a"
                              strokeWidth={sw}
                              strokeLinejoin="round"
                              strokeLinecap="round"
                            />
                          ) : (
                            <rect x={4} y={4} width={b.w - 8} height={b.h - 8} rx={14} ry={14} fill="none" stroke="#1a1a1a" strokeWidth={sw} strokeLinejoin="round" strokeLinecap="round" />
                          )}
                        </>
                      ) : (
                        <>
                          {/* Ellipse: outline → tail behind → fill on top */}
                          <ellipse
                            cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
                            fill="none" stroke={dashed ? whisperStroke : "#1a1a1a"} strokeWidth={dashed ? whisperSw : sw}
                            strokeDasharray={dashed ? whisperDash : undefined}
                            strokeLinecap={dashed ? "round" : undefined}
                          />
                          {hasTail && (
                            <path
                              d={tailPath(b.w, b.h, b.tailDir)}
                              fill="#fff"
                              stroke={dashed ? whisperStroke : "#1a1a1a"}
                              strokeWidth={dashed ? whisperSw : sw}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeDasharray={dashed ? whisperDash : undefined}
                            />
                          )}
                          <ellipse
                            cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry}
                            fill="#fff" stroke="none"
                          />
                        </>
                      )}

                      {/* Selection highlight */}
                      {isSelected && (
                        <rect
                          x={2} y={2}
                          width={b.w - 4} height={b.h - 4}
                          rx={b.bubbleType === "rect" || b.bubbleType === "rectHalftone" ? 14 : 18}
                          ry={b.bubbleType === "rect" || b.bubbleType === "rectHalftone" ? 14 : 18}
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
                      style={{
                        padding: b.bubbleType === "rect" || b.bubbleType === "rectHalftone" ? "12px 16px" : "16px 24px",
                        fontSize: font,
                        lineHeight: 1.3,
                        color: "#111",
                        overflowWrap: "anywhere",
                        whiteSpace: "pre-wrap",
                        textAlign: "center",
                        fontFamily: "'Comic Sans MS', 'Bangers', 'Segoe UI', sans-serif",
                        fontWeight: b.bubbleType === "sfx" || b.bubbleType === "shout" ? 900 : 700,
                        letterSpacing: b.bubbleType === "sfx" ? "0.06em" : b.bubbleType === "shout" ? "0.02em" : "0em",
                        fontStyle: b.bubbleType === "whisper" ? "italic" : "normal",
                        WebkitFontSmoothing: "antialiased",
                        textRendering: "optimizeLegibility",
                      }}
                    >
                      {b.text}
                    </div>

                    {/* Resize handle */}
                    <div
                      className="absolute -right-2 -bottom-2 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"
                      style={{ boxShadow: "0 0 0 2px rgba(16,185,129,0.25)" }}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Controls */}
        <div className="border-l border-white/10 bg-[#13131a] p-5 overflow-y-auto">
          {tool === "paint" ? (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Paint Mask</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Select areas to inpaint with AI</p>
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
          ) : (
            <div className="space-y-4">
              <div>
                <h2 className="text-white font-bold text-lg">Bubble Tool</h2>
                <p className="text-[11px] text-gray-500 mt-0.5">Place & style manga speech bubbles</p>
              </div>

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-300 font-semibold">Bubbles</span>
                  <div className="flex gap-2">
                    <button onClick={addBubble} className="px-3 py-2 bg-white/5 hover:bg-white/10 text-gray-200 rounded-lg text-xs font-semibold transition flex items-center gap-2">
                      <Plus className="w-4 h-4" /> Add
                    </button>
                    <button onClick={deleteSelectedBubble} disabled={!effectiveSelectedBubbleId} className="px-3 py-2 bg-white/5 hover:bg-red-500/10 disabled:opacity-40 disabled:cursor-not-allowed text-gray-200 hover:text-red-300 rounded-lg text-xs font-semibold transition flex items-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </button>
                  </div>
                </div>

                <div className="space-y-1">
                  {bubbles.map((b, idx) => (
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

              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-4 space-y-3">
                <label className="text-xs text-gray-300 font-semibold">Bubble Text</label>
                <textarea
                  value={selectedBubble?.text || ""}
                  onChange={(e) => updateSelectedBubble({ text: e.target.value })}
                  className="w-full h-28 px-3 py-2 bg-[#13131a] border border-white/10 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500/50 resize-none"
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] text-gray-400">Bubble Type</label>
                    <select
                      value={selectedBubble?.bubbleType || "speech"}
                      onChange={(e) => updateSelectedBubble({ bubbleType: e.target.value as BubbleType })}
                      className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      <option value="speech">Speech</option>
                      <option value="speechTop">Speech (Top Spike)</option>
                      <option value="speechRough">Speech (Rough)</option>
                      <option value="speechHalftone">Speech (Halftone)</option>
                      <option value="thought">Thought</option>
                      <option value="whisper">Whisper</option>
                      <option value="shout">Shout</option>
                      <option value="sfx">SFX</option>
                      <option value="rect">Rectangle</option>
                      <option value="rectHalftone">Rectangle (Halftone)</option>
                      <option value="double">Double Bubble</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[11px] text-gray-400">Tail</label>
                    <select
                      value={selectedBubble?.tailMode || "auto"}
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
                          selectedBubble?.tailDir === dir
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
                      onClick={() => updateSelectedBubble({ autoFitFont: !(selectedBubble?.autoFitFont ?? true) })}
                      className={`px-2 py-1 rounded text-[11px] font-semibold border transition ${
                        selectedBubble?.autoFitFont
                          ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                          : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                      }`}
                    >
                      {selectedBubble?.autoFitFont ? "On" : "Off"}
                    </button>
                  </div>
                </div>

                {!selectedBubble?.autoFitFont && (
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-300 font-semibold">Font Size</span>
                      <span className="text-xs text-gray-400 font-mono">{selectedBubble?.fontSize || 18}px</span>
                    </div>
                    <input
                      type="range"
                      min={10}
                      max={44}
                      value={selectedBubble?.fontSize || 18}
                      onChange={(e) => updateSelectedBubble({ fontSize: Number(e.target.value) })}
                      className="w-full accent-emerald-500 mt-2"
                    />
                  </div>
                )}

                <div className="text-[11px] text-gray-500">
                  Snaps inside the safe margin box (18px). Text wraps automatically and font size adapts to the bubble size.
                </div>
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
          )}
        </div>
      </div>
    </div>
  );
}
