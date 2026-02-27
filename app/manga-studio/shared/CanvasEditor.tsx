"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Bubble, TextElement, AssetElement, AssetLibraryItem, MaskDot, TailDir } from "./canvas-types";
import {
  makeId, estimateFontSize, bubbleEllipse, roughEllipsePath,
  tailPath, rectTailPath, rectOutlinePathWithGap, cloudPath, burstPoints,
} from "./canvas-helpers";
import { ResizeHandles, MaskCanvas, RectangleCanvas } from "./canvas-components";

// ── Public types ───────────────────────────────────────────────────────────
export type { Bubble, TextElement, AssetElement, AssetLibraryItem, MaskDot };

export interface CanvasEditorState {
  bubbles: Bubble[];
  textElements: TextElement[];
  assetElements: AssetElement[];
  assetLibrary: AssetLibraryItem[];
  mask: MaskDot[];
  undoStack: MaskDot[][];
  redoStack: MaskDot[][];
}

export function emptyCanvasState(): CanvasEditorState {
  return { bubbles: [], textElements: [], assetElements: [], assetLibrary: [], mask: [], undoStack: [], redoStack: [] };
}

export type CanvasActiveTool = "layers" | "bubbles" | "text" | "assets" | "inpaint" | "rectInpaint" | "panel" | "aimanga" | "image" | "crop" | "comments";

export interface CanvasSelection {
  selectedBubbleId: string | null;
  selectedTextId: string | null;
  selectedAssetId: string | null;
}

interface CanvasEditorProps {
  panelId: string;
  imageUrl?: string | null;
  activeTool: CanvasActiveTool;
  state: CanvasEditorState;
  onStateChange: (s: CanvasEditorState) => void;
  brushSize: number;
  isEraser: boolean;
  maskOpacity: number;
  hiddenObjectIds?: Set<string>;
  onSelectionChange?: (sel: CanvasSelection) => void;
  selection?: CanvasSelection;
  /** "16:9" | "9:16" | "1:1" — constrains canvas to this ratio */
  aspectRatio?: string;
  /** Function to reset all transformations */
  resetAllTransformations?: () => void;
  /** Rectangle support for Closer Look */
  rectangle?: { x: number; y: number; width: number; height: number } | null;
  onRectangleChange?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  rectangleVisible?: boolean;
  canvasTool?: CanvasActiveTool;
  /** Whether aspect ratio animation is in progress */
  isAspectRatioAnimating?: boolean;
  /** Whether rectangle is in square mode (GPT-1.5) */
  isSquareMode?: boolean;
}

// ── Drag state ─────────────────────────────────────────────────────────────
type DragInfo = {
  kind: "bubble" | "text" | "asset";
  id: string;
  type: "move" | "resize";
  handle?: string;
  startX: number; startY: number;
  origX: number; origY: number;
  origW: number; origH: number;
  origRot: number;
} | null;

type RotDragInfo = {
  kind: "bubble" | "text" | "asset";
  id: string;
  startAngle: number;
  centerX: number; centerY: number;
  origRot: number;
} | null;

// ── CanvasEditor ───────────────────────────────────────────────────────────
export function CanvasEditor({
  panelId, imageUrl, activeTool, state, onStateChange,
  brushSize, isEraser, maskOpacity, hiddenObjectIds = new Set(),
  onSelectionChange, selection, aspectRatio, resetAllTransformations,
  rectangle, onRectangleChange, rectangleVisible = true, canvasTool, isAspectRatioAnimating = false, isSquareMode = false,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragInfo>(null);
  const rotDragRef = useRef<RotDragInfo>(null);
  const [outerSize, setOuterSize] = useState({ w: 0, h: 0 });
  const [isPainting, setIsPainting] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [_selectedBubbleId, _setSelectedBubbleId] = useState<string | null>(null);
  const [_selectedTextId, _setSelectedTextId] = useState<string | null>(null);
  const [_selectedAssetId, _setSelectedAssetId] = useState<string | null>(null);
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; kind: "bubble" | "text" | "asset"; id: string } | null>(null);
  const [copiedObject, setCopiedObject] = useState<{ type: "bubble" | "text" | "asset"; data: any } | null>(null);

  // Use controlled selection if provided, else internal
  const selectedBubbleId = selection ? selection.selectedBubbleId : _selectedBubbleId;
  const selectedTextId   = selection ? selection.selectedTextId   : _selectedTextId;
  const selectedAssetId  = selection ? selection.selectedAssetId  : _selectedAssetId;

  const setSelection = useCallback((bubbleId: string | null, textId: string | null, assetId: string | null) => {
    _setSelectedBubbleId(bubbleId);
    _setSelectedTextId(textId);
    _setSelectedAssetId(assetId);
    onSelectionChange?.({ selectedBubbleId: bubbleId, selectedTextId: textId, selectedAssetId: assetId });
  }, [onSelectionChange]);


  const { bubbles, textElements, assetElements, assetLibrary, mask } = state;

  // Filter to current panel only
  const panelBubbles = bubbles.filter(b => b.panelId === panelId && !hiddenObjectIds.has(b.id));
  const panelTexts = textElements.filter(t => t.panelId === panelId && !hiddenObjectIds.has(t.id));
  const panelAssets = assetElements.filter(a => a.panelId === panelId && !hiddenObjectIds.has(a.id));

  const getPos = (e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  // ── Mask painting ──
  const addMaskDot = useCallback((e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = e.clientX - rect.left, y = e.clientY - rect.top;
    const newMask = isEraser
      ? mask.filter(d => Math.hypot(d.x - x, d.y - y) > brushSize / 2)
      : [...mask, { x, y, r: brushSize }];
    onStateChange({ ...state, mask: newMask });
  }, [state, mask, isEraser, brushSize, onStateChange]);

  const commitMaskSnapshot = useCallback(() => {
    onStateChange({ ...state, undoStack: [...state.undoStack, mask], redoStack: [] });
  }, [state, mask, onStateChange]);

  // ── Mouse down ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (canvasTool === "inpaint" && e.button === 0) {
      // Paint with left mouse button (button === 0) - only for brush inpaint
      console.log('[CanvasEditor] Brush painting started - canvasTool:', canvasTool);
      e.preventDefault();
      commitMaskSnapshot();
      setIsMouseDown(true);
      setIsPainting(true);
      addMaskDot(e);
      return;
    }
    const target = e.target as HTMLElement;
    if (target === containerRef.current || target.tagName === "CANVAS") {
      setSelection(null, null, null);
    }
  };

  // ── Global mouse move/up ──
  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (isPainting && canvasTool === "inpaint" && isMouseDown) { addMaskDot(e); return; }

      if (rotDragRef.current) {
        const rd = rotDragRef.current;
        const { x, y } = { x: e.clientX, y: e.clientY };
        const angle = Math.atan2(y - rd.centerY, x - rd.centerX) * (180 / Math.PI);
        const newRot = Math.round(rd.origRot + (angle - rd.startAngle));
        if (rd.kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === rd.id ? { ...b, rotation: newRot } : b) });
        else if (rd.kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === rd.id ? { ...t, rotation: newRot } : t) });
        else onStateChange({ ...state, assetElements: assetElements.map(a => a.id === rd.id ? { ...a, rotation: newRot } : a) });
        return;
      }

      if (!dragRef.current) return;
      const d = dragRef.current;
      const { x, y } = getPos(e);
      const dx = x - d.startX, dy = y - d.startY;

      if (d.type === "move") {
        const nx = d.origX + dx, ny = d.origY + dy;
        if (d.kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === d.id ? { ...b, x: nx, y: ny } : b) });
        else if (d.kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === d.id ? { ...t, x: nx, y: ny } : t) });
        else onStateChange({ ...state, assetElements: assetElements.map(a => a.id === d.id ? { ...a, x: nx, y: ny } : a) });
      } else if (d.type === "resize") {
        const nw = Math.max(20, d.origW + (d.handle.includes("e") ? dx : d.handle.includes("w") ? -dx : 0));
        const nh = Math.max(20, d.origH + (d.handle.includes("s") ? dy : d.handle.includes("n") ? -dy : 0));
        const nx = d.origX + (d.handle.includes("e") ? 0 : d.handle.includes("w") ? (d.origW - nw) : dx / 2);
        const ny = d.origY + (d.handle.includes("s") ? 0 : d.handle.includes("n") ? (d.origH - nh) : dy / 2);
        if (d.kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === d.id ? { ...b, x: nx, y: ny, w: nw, h: nh } : b) });
        else if (d.kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === d.id ? { ...t, x: nx, y: ny, w: nw, h: nh } : t) });
        else onStateChange({ ...state, assetElements: assetElements.map(a => a.id === d.id ? { ...a, x: nx, y: ny, w: nw, h: nh } : a) });
      }
    };

    const onUp = () => {
      dragRef.current = null;
      rotDragRef.current = null;
      if (isMouseDown) {
        setIsMouseDown(false);
        setIsPainting(false);
      }
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
  }, [isPainting, isMouseDown, activeTool, state, dragRef, rotDragRef]);

  
  // ── Drag start helpers ──
  const startDrag = (kind: "bubble" | "text" | "asset", id: string, e: React.MouseEvent, type: "move" | "resize" = "move", handle?: string) => {
    e.stopPropagation();
    const { x, y } = getPos(e);
    const obj = kind === "bubble" ? bubbles.find(b => b.id === id) : kind === "text" ? textElements.find(t => t.id === id) : assetElements.find(a => a.id === id);
    if (!obj) return;
    const w = (obj as Bubble).w ?? 100, h = (obj as Bubble).h ?? 60;
    dragRef.current = { kind, id, type, handle, startX: x, startY: y, origX: obj.x, origY: obj.y, origW: w, origH: h, origRot: obj.rotation ?? 0 };
  };

  const startRotate = (kind: "bubble" | "text" | "asset", id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = kind === "bubble" ? bubbles.find(b => b.id === id) : kind === "text" ? textElements.find(t => t.id === id) : assetElements.find(a => a.id === id);
    if (!obj) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    const w = (obj as Bubble).w ?? 100, h = (obj as Bubble).h ?? 60;
    const cx = rect.left + obj.x + w / 2, cy = rect.top + obj.y + h / 2;
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    rotDragRef.current = { kind, id, startAngle, centerX: cx, centerY: cy, origRot: obj.rotation ?? 0 };
  };

  // ── Layering helpers ──
  const getAllZOrdered = () => [
    ...bubbles.filter(b => b.panelId === panelId).map(b => ({ kind: "bubble" as const, id: b.id, z: b.zIndex ?? 4 })),
    ...textElements.filter(t => t.panelId === panelId).map(t => ({ kind: "text" as const, id: t.id, z: t.zIndex ?? 3 })),
    ...assetElements.filter(a => a.panelId === panelId).map(a => ({ kind: "asset" as const, id: a.id, z: a.zIndex ?? 2 })),
  ].sort((a, b) => a.z - b.z);

  const setZIndex = (kind: "bubble" | "text" | "asset", id: string, z: number) => {
    if (kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === id ? { ...b, zIndex: z } : b) });
    else if (kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === id ? { ...t, zIndex: z } : t) });
    else onStateChange({ ...state, assetElements: assetElements.map(a => a.id === id ? { ...a, zIndex: z } : a) });
  };

  const bringForward = (kind: "bubble" | "text" | "asset", id: string) => {
    const items = getAllZOrdered();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0 || idx >= items.length - 1) return;
    const above = items[idx + 1];
    setZIndex(kind, id, above.z + 1);
  };
  const bringToFront = (kind: "bubble" | "text" | "asset", id: string) => {
    const items = getAllZOrdered();
    const maxZ = items.reduce((m, i) => Math.max(m, i.z), 0);
    setZIndex(kind, id, maxZ + 1);
  };
  const sendBackward = (kind: "bubble" | "text" | "asset", id: string) => {
    const items = getAllZOrdered();
    const idx = items.findIndex(i => i.id === id);
    if (idx <= 0) return;
    const below = items[idx - 1];
    setZIndex(kind, id, Math.max(0, below.z - 1));
  };
  const sendToBack = (kind: "bubble" | "text" | "asset", id: string) => {
    const items = getAllZOrdered();
    const minZ = items.reduce((m, i) => Math.min(m, i.z), Infinity);
    setZIndex(kind, id, Math.max(0, minZ - 1));
  };

  const openCtxMenu = (e: React.MouseEvent, kind: "bubble" | "text" | "asset", id: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, kind, id });
  };

  // ── Delete / Duplicate / Flip / Rotate ──
  const deleteBubble = (id: string) => { onStateChange({ ...state, bubbles: bubbles.filter(b => b.id !== id) }); setSelection(null, null, null); setEditingBubbleId(null); };
  const deleteText   = (id: string) => { onStateChange({ ...state, textElements: textElements.filter(t => t.id !== id) }); setSelection(null, null, null); setEditingTextId(null); };
  const deleteAsset  = (id: string) => { onStateChange({ ...state, assetElements: assetElements.filter(a => a.id !== id) }); setSelection(null, null, null); };

  // Copy-paste functions
  const copyObject = useCallback(() => {
    if (selectedBubbleId) {
      const b = bubbles.find(x => x.id === selectedBubbleId);
      if (b) setCopiedObject({ type: "bubble", data: b });
    } else if (selectedTextId) {
      const t = textElements.find(x => x.id === selectedTextId);
      if (t) setCopiedObject({ type: "text", data: t });
    } else if (selectedAssetId) {
      const a = assetElements.find(x => x.id === selectedAssetId);
      if (a) setCopiedObject({ type: "asset", data: a });
    }
  }, [selectedBubbleId, selectedTextId, selectedAssetId, bubbles, textElements, assetElements]);

  const pasteObject = useCallback(() => {
    if (!copiedObject) return;
    
    const { cx, cy } = { cx: containerSize.w / 2, cy: containerSize.h / 2 };
    
    if (copiedObject.type === "bubble") {
      const nb = { ...copiedObject.data, id: makeId(), x: cx - 100, y: cy - 50 };
      onStateChange({ ...state, bubbles: [...bubbles, nb] });
      setSelection(nb.id, null, null);
    } else if (copiedObject.type === "text") {
      const nt = { ...copiedObject.data, id: makeId(), x: cx - 100, y: cy - 30 };
      onStateChange({ ...state, textElements: [...textElements, nt] });
      setSelection(null, nt.id, null);
    } else if (copiedObject.type === "asset") {
      const na = { ...copiedObject.data, id: makeId(), x: cx - 80, y: cy - 80 };
      onStateChange({ ...state, assetElements: [...assetElements, na] });
      setSelection(null, null, na.id);
    }
  }, [copiedObject, state, bubbles, textElements, assetElements, containerSize]);

  
  const duplicateBubble = (id: string) => {
    const b = bubbles.find(x => x.id === id); if (!b) return;
    const nb = { ...b, id: makeId(), x: b.x + 20, y: b.y + 20 };
    onStateChange({ ...state, bubbles: [...bubbles, nb] });
    setSelection(nb.id, null, null);
  };
  const duplicateText = (id: string) => {
    const t = textElements.find(x => x.id === id); if (!t) return;
    const nt = { ...t, id: makeId(), x: t.x + 20, y: t.y + 20 };
    onStateChange({ ...state, textElements: [...textElements, nt] });
    setSelection(null, nt.id, null);
  };
  const duplicateAsset = (id: string) => {
    const a = assetElements.find(x => x.id === id); if (!a) return;
    const na = { ...a, id: makeId(), x: a.x + 20, y: a.y + 20 };
    onStateChange({ ...state, assetElements: [...assetElements, na] });
    setSelection(null, null, na.id);
  };

  const patchBubble = (id: string, patch: Partial<Bubble>) =>
    onStateChange({ ...state, bubbles: bubbles.map(b => b.id === id ? { ...b, ...patch } : b) });

  const patchText = (id: string, patch: Partial<TextElement>) =>
    onStateChange({ ...state, textElements: textElements.map(t => t.id === id ? { ...t, ...patch } : t) });

  const patchAsset = (id: string, patch: Partial<AssetElement>) =>
    onStateChange({ ...state, assetElements: assetElements.map(a => a.id === id ? { ...a, ...patch } : a) });

  // Keyboard shortcuts (copy/paste/delete/navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      // Copy
      if ((e.ctrlKey || e.metaKey) && e.key === "c") {
        e.preventDefault();
        copyObject();
      }
      // Paste
      else if ((e.ctrlKey || e.metaKey) && e.key === "v") {
        e.preventDefault();
        pasteObject();
      }
      // Delete
      else if (e.key === "Delete" || e.key === "Backspace") {
        e.preventDefault();
        if (selectedBubbleId) deleteBubble(selectedBubbleId);
        else if (selectedTextId) deleteText(selectedTextId);
        else if (selectedAssetId) deleteAsset(selectedAssetId);
      }
      // Tab navigation
      else if (e.key === "Tab") {
        e.preventDefault();
        const allObjects = [...panelBubbles, ...panelTexts, ...panelAssets];
        if (allObjects.length === 0) return;
        
        let currentIndex = -1;
        if (selectedBubbleId) currentIndex = allObjects.findIndex(obj => obj.id === selectedBubbleId);
        else if (selectedTextId) currentIndex = allObjects.findIndex(obj => obj.id === selectedTextId);
        else if (selectedAssetId) currentIndex = allObjects.findIndex(obj => obj.id === selectedAssetId);
        
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + allObjects.length) % allObjects.length
          : (currentIndex + 1) % allObjects.length;
        
        const nextObj = allObjects[nextIndex];
        if (panelBubbles.find(b => b.id === nextObj.id)) {
          setSelection(nextObj.id, null, null);
        } else if (panelTexts.find(t => t.id === nextObj.id)) {
          setSelection(null, nextObj.id, null);
        } else {
          setSelection(null, null, nextObj.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBubbleId, selectedTextId, selectedAssetId, copiedObject, panelBubbles, panelTexts, panelAssets]);

  // ── Resize observer for inner canvas ──
  useEffect(() => {
    const el = containerRef.current; if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      setContainerSize({ w: width, h: height });
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ── Resize observer for outer wrapper ──
  useEffect(() => {
    const el = outerRef.current; if (!el) return;
    const ro = new ResizeObserver(entries => {
      const { width, height } = entries[0].contentRect;
      if (width > 0 && height > 0) setOuterSize({ w: width, h: height });
    });
    ro.observe(el);
    // Also read after first paint via rAF
    const raf = requestAnimationFrame(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setOuterSize({ w: r.width, h: r.height });
    });
    return () => { ro.disconnect(); cancelAnimationFrame(raf); };
  }, []);

  const cursor = canvasTool === "inpaint" ? (isEraser ? "cell" : "crosshair") : "default";
  const arMap: Record<string, number> = { "16:9": 16/9, "9:16": 9/16, "1:1": 1 };
  const ar = aspectRatio ? (arMap[aspectRatio] ?? null) : null;

  // Compute exact pixel box that fits inside outer container preserving aspect ratio
  // Leave 10px padding on all sides so the canvas never touches the edges
  const PAD = 10;
  let canvasStyle: React.CSSProperties = { width: "100%", height: "100%" };
  if (ar && outerSize.w > 0 && outerSize.h > 0) {
    const maxW = outerSize.w - PAD * 2;
    const maxH = outerSize.h - PAD * 2;
    // "contain" logic: fit by width first, fall back to height if overflows
    let w = maxW;
    let h = w / ar;
    if (h > maxH) {
      h = maxH;
      w = h * ar;
    }
    canvasStyle = { width: `${w}px`, height: `${h}px` };
  }

  return (
    <div ref={outerRef} className="relative w-full h-full flex items-center justify-center bg-[#0d0d12] overflow-hidden">
      <div ref={containerRef} className="relative bg-[#13131a]" data-canvas-editor="true"
        style={{ ...canvasStyle, cursor }}
        onMouseDown={handleMouseDown}
        onClick={e => { if (e.target === containerRef.current) { setSelection(null, null, null); } setCtxMenu(null); }}
        onContextMenu={e => { if (e.target === containerRef.current) { e.preventDefault(); setCtxMenu(null); } }}
      >
        {imageUrl
          ? <img key={imageUrl} src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" /> // eslint-disable-line @next/next/no-img-element
          : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-700 pointer-events-none select-none">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm">No image — upload one to start</span>
            </div>
        }
        {mask.length > 0 && <MaskCanvas mask={mask} opacity={maskOpacity} width={containerSize.w} height={containerSize.h} />}
        {canvasTool === "rectInpaint" && rectangle && rectangleVisible && (
          <RectangleCanvas 
            rectangle={rectangle} 
            width={containerSize.w} 
            height={containerSize.h}
            color={isSquareMode ? "purple" : "cyan"}
            aspectRatio={aspectRatio}
            selected={false}
            isSquareMode={isSquareMode}
            onResize={(handle, x, y, w, h) => {
              // Handle rectangle resize
              if (onRectangleChange) {
                onRectangleChange({ x, y, width: w, height: h });
              }
            }}
            onDrag={(x, y, w, h) => {
              // Handle rectangle drag
              if (onRectangleChange) {
                onRectangleChange({ x, y, width: w, height: h });
              }
            }}
          />
        )}
        {canvasTool === "crop" && rectangle && rectangleVisible && (
          <RectangleCanvas 
            rectangle={rectangle} 
            width={containerSize.w} 
            height={containerSize.h}
            color="orange"
            aspectRatio={aspectRatio}
            selected={false}
            onResize={(handle, x, y, w, h) => {
              // Handle rectangle resize
              if (onRectangleChange) {
                onRectangleChange({ x, y, width: w, height: h });
              }
            }}
            onDrag={(newX, newY, newWidth, newHeight) => {
              // Handle rectangle drag
              if (onRectangleChange) {
                onRectangleChange({ x: newX, y: newY, width: newWidth, height: newHeight });
              }
            }}
          />
        )}

        {/* Assets */}
        {panelAssets.map(a => {
          const lib = assetLibrary.find(l => l.id === a.assetId); if (!lib) return null;
          const isSel = selectedAssetId === a.id;
          return (
            <div key={a.id} className={`absolute transition-all duration-200 ${isSel ? "drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]" : ""}`} style={{ left: a.x, top: a.y, width: a.w, height: a.h, transform: `rotate(${a.rotation??0}deg) scaleX(${a.flipX?-1:1}) scaleY(${a.flipY?-1:1})`, transformOrigin: "center", zIndex: a.zIndex??2, cursor: "move", overflow: "visible" }}
              onMouseDown={e => { setSelection(null, null, a.id); startDrag("asset", a.id, e); }}
              onClick={e => { e.stopPropagation(); setSelection(null, null, a.id); }}
              onContextMenu={e => { setSelection(null, null, a.id); openCtxMenu(e, "asset", a.id); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={lib.url} alt={lib.name} style={{ width:"100%", height:"100%", objectFit:"contain", pointerEvents:"none" }} />
              {isSel && (<><ResizeHandles isSelected={isSel} accentColor="orange" onResizeStart={(h,e)=>startDrag("asset",a.id,e,"resize",h)} onRotateStart={e=>startRotate("asset",a.id,e)} /><PlaygroundActionBar 
                onDuplicate={()=>duplicateAsset(a.id)} 
                onDelete={()=>deleteAsset(a.id)} 
                onFlipV={()=>patchAsset(a.id,{flipY:!a.flipY})} 
                onFlipH={()=>patchAsset(a.id,{flipX:!a.flipX})}
                onReset={()=>patchAsset(a.id,{rotation:0, flipX:false, flipY:false})}
                rotation={a.rotation??0}
              /></>)}
            </div>
          );
        })}

        {/* Text */}
        {panelTexts.map(t => {
          const isSel = selectedTextId === t.id;
          const isEditingText = editingTextId === t.id;
          return (
            <div key={t.id} className={`absolute transition-all duration-200 ${isSel ? "drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" : ""}`} style={{ left: t.x, top: t.y, width: t.w, height: t.h, transform: `rotate(${t.rotation??0}deg) scaleX(${t.flipX?-1:1}) scaleY(${t.flipY?-1:1})`, transformOrigin: "center", zIndex: t.zIndex??3, cursor: isEditingText ? "text" : (isSel ? "move" : "pointer"), backgroundColor: t.backgroundColor||"transparent", overflow: "visible" }}
              onMouseDown={e => {
                if (isEditingText) { e.stopPropagation(); return; }
                e.stopPropagation();
                setSelection(null, t.id, null);
                setEditingTextId(null);
                startDrag("text", t.id, e);
              }}
              onDoubleClick={e => {
                e.stopPropagation();
                setSelection(null, t.id, null);
                setEditingTextId(t.id);
                const container = e.currentTarget;
                setTimeout(() => {
                  const el = container.querySelector("[data-text-el]") as HTMLElement;
                  if (!el) return;
                  el.focus();
                  const r = document.createRange(); r.selectNodeContents(el);
                  const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
                }, 0);
              }}
              onClick={e => { e.stopPropagation(); }}
              onContextMenu={e => { setSelection(null, t.id, null); openCtxMenu(e, "text", t.id); }}
            >
              <div
                data-text-el
                contentEditable={isEditingText}
                suppressContentEditableWarning
                style={{ width:"100%", height:"100%", fontSize: t.fontSize, fontWeight: t.fontWeight||"normal", fontStyle: t.fontStyle||"normal", fontFamily: t.fontFamily||"Arial", color: t.color, border:"none", backgroundColor:"transparent", padding:"4px", outline:"none", lineHeight:1.3, overflow:"hidden", wordWrap:"break-word", pointerEvents: isEditingText ? "auto" : "none",
                  textShadow: (t.borderWidth||0)>0 ? `-${t.borderWidth}px 0 0 ${t.borderColor||"#000"}, ${t.borderWidth}px 0 0 ${t.borderColor||"#000"}, 0 -${t.borderWidth}px 0 ${t.borderColor||"#000"}, 0 ${t.borderWidth}px 0 ${t.borderColor||"#000"}` : "none",
                }}
                onBlur={e => { patchText(t.id, { text: e.currentTarget.textContent||"" }); setEditingTextId(null); }}
                onMouseDown={e => { if (isEditingText) e.stopPropagation(); }}
              >{t.text}</div>
              {isSel && !isEditingText && (
                <>
                  <ResizeHandles isSelected={isSel} accentColor="purple" onResizeStart={(h,e)=>startDrag("text",t.id,e,"resize",h)} onRotateStart={e=>startRotate("text",t.id,e)} />
                  <PlaygroundActionBar 
                    onDuplicate={()=>duplicateText(t.id)} 
                    onDelete={()=>deleteText(t.id)} 
                    onFlipV={()=>patchText(t.id,{flipY:!t.flipY})} 
                    onFlipH={()=>patchText(t.id,{flipX:!t.flipX})}
                    onReset={()=>patchText(t.id,{rotation:0, flipX:false, flipY:false})}
                    rotation={t.rotation??0}
                  />
                </>
              )}
            </div>
          );
        })}

        {/* Thought-bubble trailing circles */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 5 }}>
          {panelBubbles.map(b => {
            if (b.bubbleType !== "thought" || b.tailMode === "none") return null;
            const e = bubbleEllipse(b.w, b.h);
            
            // Use original tail direction and apply flip transformations to positions
            let sx = b.x + e.cx, sy = b.y + e.cy + e.ry, dx = 0, dy = 1;
            if (b.tailDir === "bottom-left") { sx = b.x + e.cx - 20; dx = -0.6; dy = 1; }
            else if (b.tailDir === "bottom-right") { sx = b.x + e.cx + 20; dx = 0.6; dy = 1; }
            else if (b.tailDir === "left") { sx = b.x + e.cx - e.rx; sy = b.y + e.cy + 12; dx = -1; dy = 0.4; }
            else if (b.tailDir === "right") { sx = b.x + e.cx + e.rx; sy = b.y + e.cy + 12; dx = 1; dy = 0.4; }
            
            // Apply flip and rotation transformations to the tail positions
            const flipX = b.flipX ? -1 : 1;
            const flipY = b.flipY ? -1 : 1;
            const bubbleCenterX = b.x + e.cx;
            const bubbleCenterY = b.y + e.cy;
            const rotation = (b.rotation || 0) * Math.PI / 180; // Convert to radians
            
            // Calculate transformed positions relative to bubble center
            const flipXPos = (sx - bubbleCenterX) * flipX;
            const flipYPos = (sy - bubbleCenterY) * flipY;
            const flipDx = dx * flipX;
            const flipDy = dy * flipY;
            
            // Apply rotation transformation
            const rotatedX = flipXPos * Math.cos(rotation) - flipYPos * Math.sin(rotation);
            const rotatedY = flipXPos * Math.sin(rotation) + flipYPos * Math.cos(rotation);
            const rotatedDx = flipDx * Math.cos(rotation) - flipDy * Math.sin(rotation);
            const rotatedDy = flipDx * Math.sin(rotation) + flipDy * Math.cos(rotation);
            
            // Final positions
            const transformX = rotatedX + bubbleCenterX;
            const transformY = rotatedY + bubbleCenterY;
            
            const nl = Math.hypot(rotatedDx, rotatedDy), ux = rotatedDx / nl, uy = rotatedDy / nl;
            
            return (
              <g key={`tc-${b.id}`}>
                <circle cx={transformX + ux * 14} cy={transformY + uy * 14} r={10} fill="#fff" stroke="#1a1a1a" strokeWidth={2} />
                <circle cx={transformX + ux * 36} cy={transformY + uy * 36} r={7} fill="#fff" stroke="#1a1a1a" strokeWidth={2} />
                <circle cx={transformX + ux * 52} cy={transformY + uy * 52} r={4.5} fill="#fff" stroke="#1a1a1a" strokeWidth={2} />
              </g>
            );
          })}
        </svg>

        {/* Bubble elements — playground-exact inline SVG */}
        {panelBubbles.map(b => {
          const isSel = selectedBubbleId === b.id;
          const isEditingBubble = editingBubbleId === b.id;
          const seed = b.id;
          const font = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;
          const hasTail = b.tailMode !== "none" && !["shout","sfx"].includes(b.bubbleType);
          const e = bubbleEllipse(b.w, b.h);
          const sw = 2.5;
          const isFlipped = b.flippedColors || false;
          const fillColor = isFlipped ? "#000000" : "#ffffff";
          const strokeColor = isFlipped ? "#ffffff" : "#1a1a1a";
          const textColor = isFlipped ? "#ffffff" : "#111111";

          // Calculate flipped tail direction
          const getFlippedTailDir = (dir: string): TailDir => {
            if (b.flipX) {
              if (dir === "left") return "right";
              if (dir === "right") return "left";
              if (dir === "bottom-left") return "bottom-right";
              if (dir === "bottom-right") return "bottom-left";
            }
            if (b.flipY) {
              // Vertical flip: bottom directions become top directions, but since top isn't supported,
              // we'll map them to the opposite side
              if (dir === "bottom-left") return "bottom-right";
              if (dir === "bottom-right") return "bottom-left";
              if (dir === "left") return "right";
              if (dir === "right") return "left";
            }
            return dir as TailDir;
          };
          const flippedTailDir = getFlippedTailDir(b.tailDir);
          const dashed = b.bubbleType === "whisper";
          const wSw = 3.5, wStroke = "#333", wDash = "10 8";

          return (
            <div key={b.id} className={`absolute transition-all duration-200 ${isSel ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" : ""}`}
              style={{ left: b.x, top: b.y, width: b.w, height: b.h,
                filter: isSel ? "drop-shadow(0 0 12px rgba(16,185,129,0.6))" : "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
                transform: `rotate(${b.rotation||0}deg) scaleX(${b.flipX?-1:1}) scaleY(${b.flipY?-1:1})`,
                transformOrigin: "center", zIndex: b.zIndex??4, overflow: "visible" }}
              onContextMenu={ev => { if (!isEditingBubble) { setSelection(b.id, null, null); openCtxMenu(ev, "bubble", b.id); } }}
            >
              {/* SVG shape — click/drag to select/move */}
              <svg width={b.w} height={b.h} viewBox={`0 0 ${b.w} ${b.h}`}
                className="absolute inset-0"
                style={{ shapeRendering: "geometricPrecision", overflow: "visible", cursor: isEditingBubble ? "text" : (isSel ? "move" : "pointer"), pointerEvents: isEditingBubble ? "none" : "auto" }}
                onMouseDown={ev => {
                  if (isEditingBubble) return;
                  ev.stopPropagation();
                  setSelection(b.id, null, null);
                  setEditingBubbleId(null);
                  startDrag("bubble", b.id, ev);
                }}
              >
                <defs><pattern id={`dots-${b.id}`} width="8" height="8" patternUnits="userSpaceOnUse"><circle cx="1.5" cy="1.5" r="1.1" fill="#000" opacity="0.12" /></pattern></defs>
                {b.bubbleType === "thought" ? (
                  <g transform={`scale(${b.flipX?-1:1},${b.flipY?-1:1}) translate(${b.flipX?-b.w:0} ${b.flipY?-b.h:0})`}>
                    <path d={cloudPath(b.w,b.h)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />
                    <path d={cloudPath(b.w,b.h)} fill={fillColor} stroke="none" />
                  </g>
                ) : b.bubbleType === "oval" ? (
                  <>{hasTail && <path d={tailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}<ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" /><ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" /></>
                ) : b.bubbleType === "speechRough" ? (
                  <><path d={roughEllipsePath(b.w,b.h,seed)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinejoin="round" />{hasTail && <path d={tailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}<path d={roughEllipsePath(b.w,b.h,seed)} fill={fillColor} stroke="none" /></>
                ) : b.bubbleType === "speechHalftone" ? (
                  <><ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={strokeColor} strokeWidth={sw} />{hasTail && <path d={tailPath(b.w,b.h,flippedTailDir)} fill={`url(#dots-${b.id})`} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}{hasTail && <path d={tailPath(b.w,b.h,flippedTailDir)} fill={fillColor} fillOpacity={0.86} stroke="none" />}<ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={`url(#dots-${b.id})`} stroke="none" /><ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} opacity={0.86} stroke="none" /></>
                ) : b.bubbleType === "shout" ? (
                  <polygon points={burstPoints(b.w,b.h,12,seed).map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinejoin="miter" />
                ) : b.bubbleType === "sfx" ? (
                  <polygon points={burstPoints(b.w,b.h,18,seed,true).map(p=>`${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ")} fill={fillColor} stroke={strokeColor} strokeWidth={2.8} strokeLinejoin="miter" />
                ) : b.bubbleType === "rectRound" ? (
                  <>{hasTail && <path d={rectTailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}<rect x={4} y={4} width={b.w-8} height={b.h-8} rx={20} ry={20} fill={fillColor} stroke="none" />{hasTail && <path d={rectTailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke="none" />}{hasTail ? <path d={rectOutlinePathWithGap(b.w,b.h,20,flippedTailDir==="left"?"left":flippedTailDir==="right"?"right":"bottom",flippedTailDir==="left"||flippedTailDir==="right"?b.h*0.6:b.w*(flippedTailDir==="bottom-left"?0.2:0.8),36)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /> : <rect x={4} y={4} width={b.w-8} height={b.h-8} rx={20} ry={20} fill="none" stroke={strokeColor} strokeWidth={sw} />}</>
                ) : b.bubbleType === "rect" ? (
                  <>{hasTail && <path d={rectTailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" />}<rect x={4} y={4} width={b.w-8} height={b.h-8} rx={2} ry={2} fill={fillColor} stroke="none" />{hasTail && <path d={rectTailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke="none" />}{hasTail ? <path d={rectOutlinePathWithGap(b.w,b.h,2,flippedTailDir==="left"?"left":flippedTailDir==="right"?"right":"bottom",flippedTailDir==="left"||flippedTailDir==="right"?b.h*0.6:b.w*(flippedTailDir==="bottom-left"?0.2:0.8),36)} fill="none" stroke={strokeColor} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round" /> : <rect x={4} y={4} width={b.w-8} height={b.h-8} rx={2} ry={2} fill="none" stroke={strokeColor} strokeWidth={sw} />}</>
                ) : (
                  <><ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill="none" stroke={dashed?wStroke:strokeColor} strokeWidth={dashed?wSw:sw} strokeDasharray={dashed?wDash:undefined} strokeLinecap={dashed?"round":undefined} />{hasTail && <path d={tailPath(b.w,b.h,flippedTailDir)} fill={fillColor} stroke={dashed?wStroke:strokeColor} strokeWidth={dashed?wSw:sw} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={dashed?wDash:undefined} />}<ellipse cx={e.cx} cy={e.cy} rx={e.rx} ry={e.ry} fill={fillColor} stroke="none" /></>
                )}
              </svg>

              {/* Text layer — flex wrapper keeps text centered; inner div is contentEditable */}
              <div className="absolute inset-0 flex items-center justify-center"
                style={{
                  padding: ["rect","rectRound"].includes(b.bubbleType)?"12px 16px":"16px 24px",
                  pointerEvents: "auto",
                  cursor: isEditingBubble ? "text" : (isSel ? "move" : "pointer"),
                  zIndex: 2,
                }}
                onMouseDown={ev => {
                  if (isEditingBubble) { ev.stopPropagation(); return; }
                  ev.stopPropagation();
                  setSelection(b.id, null, null);
                  setEditingBubbleId(null);
                  startDrag("bubble", b.id, ev);
                }}
                onDoubleClick={ev => {
                  ev.stopPropagation();
                  setSelection(b.id, null, null);
                  setEditingBubbleId(b.id);
                  const inner = ev.currentTarget.querySelector("[data-bubble-text]") as HTMLElement;
                  setTimeout(() => {
                    if (!inner) return;
                    inner.focus();
                    const r = document.createRange(); r.selectNodeContents(inner);
                    const s = window.getSelection(); s?.removeAllRanges(); s?.addRange(r);
                  }, 0);
                }}
              >
                <div
                  data-bubble-text
                  contentEditable={isEditingBubble}
                  suppressContentEditableWarning
                  style={{
                    fontSize: font, lineHeight: 1.3, color: textColor,
                    overflowWrap: "anywhere", whiteSpace: "pre-wrap", textAlign: "center",
                    fontFamily: "'Comic Sans MS','Bangers','Segoe UI',sans-serif",
                    fontWeight: ["sfx","shout"].includes(b.bubbleType)?900:400,
                    letterSpacing: b.bubbleType==="sfx"?"0.06em":b.bubbleType==="shout"?"0.02em":"0em",
                    fontStyle: b.bubbleType==="whisper"?"italic":"normal",
                    WebkitFontSmoothing: "antialiased",
                    outline: "none",
                    minWidth: 20,
                    pointerEvents: isEditingBubble ? "auto" : "none",
                  }}
                  onBlur={ev => { patchBubble(b.id, { text: ev.currentTarget.textContent||"" }); setEditingBubbleId(null); }}
                  onMouseDown={ev => { if (isEditingBubble) ev.stopPropagation(); }}
                >{b.text}</div>
              </div>

              {/* Resize handles + ActionBar only when selected and not editing */}
              {!isEditingBubble && (
                <ResizeHandles isSelected={isSel} accentColor="emerald"
                  onResizeStart={(h,ev) => { setSelection(b.id, null, null); startDrag("bubble",b.id,ev,"resize",h); }}
                  onRotateStart={ev => { setSelection(b.id, null, null); startRotate("bubble",b.id,ev); }}
                />
              )}
              {isSel && !isEditingBubble && (
                <PlaygroundActionBar 
                  onDuplicate={()=>duplicateBubble(b.id)} 
                  onDelete={()=>deleteBubble(b.id)} 
                  onFlipV={()=>patchBubble(b.id,{flipY:!b.flipY})} 
                  onFlipH={()=>patchBubble(b.id,{flipX:!b.flipX})}
                  onReset={()=>patchBubble(b.id,{rotation:0, flipX:false, flipY:false})}
                  rotation={b.rotation||0}
                />
              )}
            </div>
          );
        })}
        {/* Context menu */}
        {ctxMenu && (
          <div
            className="absolute z-200 bg-[#1a1a24] border border-white/15 rounded-xl shadow-2xl py-1 min-w-[190px]"
            style={{ left: ctxMenu.x, top: ctxMenu.y }}
            onMouseDown={e => e.stopPropagation()}
          >
            {([
              { label: "Bring Forward",  shortcut: "Ctrl+]",     icon: "M12 5l7 7-7 7M5 5l7 7-7 7",      action: () => { bringForward(ctxMenu.kind, ctxMenu.id); setCtxMenu(null); } },
              { label: "Bring to Front", shortcut: "Ctrl+Alt+]", icon: "M5 3h14M12 7l7 7-7 7M5 7l7 7-7 7", action: () => { bringToFront(ctxMenu.kind, ctxMenu.id); setCtxMenu(null); } },
              { label: "Send Backward",  shortcut: "Ctrl+[",     icon: "M12 19l-7-7 7-7M19 19l-7-7 7-7", action: () => { sendBackward(ctxMenu.kind, ctxMenu.id); setCtxMenu(null); } },
              { label: "Send to Back",   shortcut: "Ctrl+Alt+[", icon: "M19 21H5M12 17l-7-7 7-7M19 17l-7-7 7-7", action: () => { sendToBack(ctxMenu.kind, ctxMenu.id); setCtxMenu(null); } },
            ] as { label: string; shortcut: string; icon: string; action: () => void }[]).map(item => (
              <button key={item.label}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-white/8 text-gray-200 hover:text-white transition-colors group"
                onClick={item.action}
              >
                <div className="flex items-center gap-2.5">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                  </svg>
                  <span className="text-[12px] font-medium">{item.label}</span>
                </div>
                <span className="text-[10px] text-gray-500 font-mono ml-4">{item.shortcut}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ── PlaygroundActionBar — Transformation controls with optional duplicate/delete ──────────────
function PlaygroundActionBar({ onDuplicate, onDelete, onFlipV, onFlipH, onReset, rotation }: {
  onDuplicate?: () => void;
  onDelete?: () => void;
  onFlipV?: () => void;
  onFlipH?: () => void;
  onReset?: () => void;
  rotation?: number;
}) {
  const btn = "w-9 h-9 bg-[#1a1a1f] hover:bg-[#2a2a2f] rounded-xl flex items-center justify-center text-white transition-all duration-200 border border-white/10 hover:shadow-lg hover:border-white/20 active:scale-95 active:shadow-sm";
  return (
    <div className="absolute flex gap-1.5 z-50"
      style={{ 
        top: -50, 
        left: "50%", 
        transform: "translateX(-50%)", 
        background: "rgba(255,255,255,0.08)", 
        backdropFilter: "blur(12px) saturate(180%)", 
        borderRadius: 12, 
        padding: "8px 10px", 
        boxShadow: "0 8px 32px rgba(0,0,0,0.3), 0 2px 8px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.1)", 
        border: "1px solid rgba(255,255,255,0.2)", 
        whiteSpace: "nowrap"
      }}
      onMouseDown={e => e.stopPropagation()}
    >
      {onDelete && (
        <button className={btn} title="Delete (Delete/Backspace)" onClick={e => { e.stopPropagation(); onDelete(); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
        </button>
      )}
      {onDuplicate && (
        <button className={btn} title="Duplicate (Ctrl+C → Ctrl+V)" onClick={e => { e.stopPropagation(); onDuplicate(); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>
        </button>
      )}
      {(onDelete || onDuplicate) && (onReset || rotation !== undefined) && (
        <div className="w-px h-5 bg-white/20" />
      )}
      {onReset && (
        <button className={btn} title="Reset Transform" onClick={e => { e.stopPropagation(); onReset(); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
        </button>
      )}
      {rotation !== undefined && (
        <div className="px-2 py-1 bg-[#111] rounded text-xs text-gray-300 font-mono border border-white/10">
          {rotation}°
        </div>
      )}
      {(onReset || rotation !== undefined) && (onFlipV || onFlipH) && (
        <div className="w-px h-5 bg-white/20" />
      )}
      {onFlipV && (
        <button className={btn} title="Flip Vertical (V)" onClick={e => { e.stopPropagation(); onFlipV(); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 12h16M12 4l-4 4h8l-4-4zm0 16l4-4H8l4 4z" /></svg>
        </button>
      )}
      {onFlipH && (
        <button className={btn} title="Flip Horizontal (H)" onClick={e => { e.stopPropagation(); onFlipH(); }}>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16M4 12l4-4v8l-4-4zm16 0l-4 4V8l4 4z" /></svg>
        </button>
      )}
    </div>
  );
}

// ── Mask undo/redo helpers (call from parent) ─────────────────────────────
export function undoMask(state: CanvasEditorState): CanvasEditorState {
  if (state.undoStack.length === 0) return state;
  const undoStack = [...state.undoStack];
  const last = undoStack.pop()!;
  return { ...state, mask: last, undoStack, redoStack: [...state.redoStack, state.mask] };
}

export function redoMask(state: CanvasEditorState): CanvasEditorState {
  if (state.redoStack.length === 0) return state;
  const redoStack = [...state.redoStack];
  const next = redoStack.pop()!;
  return { ...state, mask: next, redoStack, undoStack: [...state.undoStack, state.mask] };
}
