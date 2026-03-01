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

export type CanvasActiveTool = "layers" | "bubbles" | "text" | "elements" | "inpaint" | "rectInpaint" | "panel" | "aimanga" | "image" | "crop" | "comments";

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
  hideMask?: boolean;
  hiddenObjectIds?: Set<string>;
  onSelectionChange?: (sel: CanvasSelection) => void;
  selection?: CanvasSelection;
  aspectRatio?: string;
  resetAllTransformations?: () => void;
  rectangle?: { x: number; y: number; width: number; height: number } | null;
  onRectangleChange?: (rect: { x: number; y: number; width: number; height: number } | null) => void;
  rectangleVisible?: boolean;
  canvasTool?: CanvasActiveTool;
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
  brushSize, isEraser, maskOpacity, hideMask = false, hiddenObjectIds = new Set(),
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
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; kind: "bubble" | "text" | "asset" | "canvas"; id?: string; submenu?: 'tailDirection' | 'layer'; parentX?: number; parentY?: number; parentWidth?: number; parentHeight?: number; menuItemIndex?: number; menuItemHeight?: number } | null>(null);
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
    console.log('[CanvasEditor] Adding mask dot:', { x, y, r: brushSize, isEraser, maskLength: newMask.length });
    onStateChange({ ...state, mask: newMask });
  }, [state, mask, isEraser, brushSize, onStateChange]);

  const commitMaskSnapshot = useCallback(() => {
    onStateChange({ ...state, undoStack: [...state.undoStack, mask], redoStack: [] });
  }, [state, mask, onStateChange]);

  // ── Mouse down ──
  const handleMouseDown = (e: React.MouseEvent) => {
    if (activeTool === "inpaint" && e.button === 0) {
      // Paint with left mouse button (button === 0) - only for brush inpaint
      console.log('[CanvasEditor] Brush painting started - activeTool:', activeTool);
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
      if (isPainting && activeTool === "inpaint" && isMouseDown) { addMaskDot(e); return; }

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

  const cursor = activeTool === "inpaint" ? (isEraser ? "cell" : "crosshair") : "default";
  const arMap: Record<string, number> = { "16:9": 16/9, "9:16": 9/16, "1:1": 1 };
  const ar = aspectRatio ? (arMap[aspectRatio] ?? null) : null;

  // Compute exact pixel box that fits inside outer container preserving aspect ratio
  // Leave 50px padding on all sides so the canvas never touches the edges
  const PAD = 50;
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
        onContextMenu={e => { if (e.target === containerRef.current) { e.preventDefault(); e.stopPropagation(); const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return; setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, kind: "canvas" }); } }}
      >
        {imageUrl
          ? <img key={imageUrl} src={imageUrl} alt="" className="absolute inset-0 w-full h-full object-contain pointer-events-none" /> // eslint-disable-line @next/next/no-img-element
          : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-700 pointer-events-none select-none">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm">No image — upload one to start</span>
            </div>
        }
        {mask.length > 0 && !hideMask && <MaskCanvas mask={mask} opacity={maskOpacity} width={containerSize.w} height={containerSize.h} />}
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
            <div key={a.id} className={`absolute ${dragRef.current?.id === a.id ? "transition-none" : "transition-all duration-200"} ${isSel ? "drop-shadow-[0_0_12px_rgba(251,146,60,0.6)]" : ""}`} style={{ 
              left: a.x, 
              top: a.y, 
              width: a.w, 
              height: a.h, 
              transform: `rotate(${a.rotation??0}deg) scaleX(${a.flipX?-1:1}) scaleY(${a.flipY?-1:1})`, 
              transformOrigin: "center", 
              zIndex: a.zIndex??2, 
              cursor: "move", 
              overflow: "visible",
              backgroundColor: 'rgba(255, 255, 255, 0.01)',
              mixBlendMode: (dragRef.current?.id === a.id ? 'source-over' : 'normal') as any,
              isolation: 'isolate',
              willChange: dragRef.current?.id === a.id ? 'transform' : 'auto'
            }}
              onMouseDown={e => { setSelection(null, null, a.id); startDrag("asset", a.id, e); }}
              onClick={e => { e.stopPropagation(); setSelection(null, null, a.id); }}
              onContextMenu={e => { setSelection(null, null, a.id); openCtxMenu(e, "asset", a.id); }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={lib.url} 
                alt={lib.name} 
                style={{ 
                  width:"100%", 
                  height:"100%", 
                  objectFit:"contain", 
                  pointerEvents:"none",
                  backgroundColor: 'transparent',
                  mixBlendMode: 'normal'
                }} 
              />
              {isSel && (<><ResizeHandles isSelected={isSel} accentColor="orange" rotation={a.rotation} onResizeStart={(h,e)=>startDrag("asset",a.id,e,"resize",h)} onRotateStart={e=>startRotate("asset",a.id,e)} /></>)}
            </div>
          );
        })}

        {/* Text */}
        {panelTexts.map(t => {
          const isSel = selectedTextId === t.id;
          const isEditingText = editingTextId === t.id;
          return (
            <div key={t.id} className={`absolute ${dragRef.current?.id === t.id ? "transition-none" : "transition-all duration-200"} ${isSel ? "drop-shadow-[0_0_12px_rgba(168,85,247,0.6)]" : ""}`} style={{ left: t.x, top: t.y, width: t.w, height: t.h, transform: `rotate(${t.rotation??0}deg) scaleX(${t.flipX?-1:1}) scaleY(${t.flipY?-1:1})`, transformOrigin: "center", zIndex: t.zIndex??3, cursor: isEditingText ? "text" : (isSel ? "move" : "pointer"), backgroundColor: t.backgroundColor||"transparent", overflow: "visible", mixBlendMode: (dragRef.current?.id === t.id ? 'source-over' : 'normal') as any, isolation: 'isolate', willChange: dragRef.current?.id === t.id ? 'transform' : 'auto' }}
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
                  <ResizeHandles isSelected={isSel} accentColor="purple" rotation={t.rotation} onResizeStart={(h,e)=>startDrag("text",t.id,e,"resize",h)} onRotateStart={e=>startRotate("text",t.id,e)} />
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
            
            // Use the same color logic as regular bubbles
            const fillColor = b.flippedColors ? "#1a1a2e" : (b.bubbleType === "whisper" ? "rgba(240,240,255,0.85)" : "rgba(255,255,255,0.97)");
            const strokeColor = b.flippedColors ? "rgba(255,255,255,0.9)" : "#1a1a2e";
            
            return (
              <g key={`tc-${b.id}`}>
                <circle cx={transformX + ux * 14} cy={transformY + uy * 14} r={10} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
                <circle cx={transformX + ux * 36} cy={transformY + uy * 36} r={7} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
                <circle cx={transformX + ux * 52} cy={transformY + uy * 52} r={4.5} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
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
            <div key={b.id} className={`absolute ${dragRef.current?.id === b.id ? "transition-none" : "transition-all duration-200"} ${isSel ? "drop-shadow-[0_0_12px_rgba(16,185,129,0.6)]" : ""}`}
              style={{ left: b.x, top: b.y, width: b.w, height: b.h,
                filter: isSel ? "drop-shadow(0 0 12px rgba(16,185,129,0.6))" : "drop-shadow(0 2px 8px rgba(0,0,0,0.15))",
                transform: `rotate(${b.rotation||0}deg) scaleX(${b.flipX?-1:1}) scaleY(${b.flipY?-1:1})`,
                transformOrigin: "center", zIndex: b.zIndex??4, overflow: "visible",
                mixBlendMode: (dragRef.current?.id === b.id ? 'source-over' : 'normal') as any,
                isolation: 'isolate',
                willChange: dragRef.current?.id === b.id ? 'transform' : 'auto' }}
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
                <ResizeHandles isSelected={isSel} accentColor="emerald" rotation={b.rotation}
                  onResizeStart={(h,ev) => { setSelection(b.id, null, null); startDrag("bubble",b.id,ev,"resize",h); }}
                  onRotateStart={ev => { setSelection(b.id, null, null); startRotate("bubble",b.id,ev); }}
                />
              )}
                          </div>
          );
        })}
        {/* Context menu */}
        {ctxMenu && (() => {
          // Calculate smart positioning to prevent clipping
          const menuWidth = 200;
          const menuHeight = ctxMenu.kind === "canvas" ? 400 : 300; // Approximate heights - increased for action menus
          const containerRect = containerRef.current?.getBoundingClientRect();
          const outerRect = outerRef.current?.getBoundingClientRect();
          
          let adjustedX = ctxMenu.x;
          let adjustedY = ctxMenu.y;
          
          if (containerRect && outerRect) {
            // Calculate the actual available width (outer container minus any right panel)
            const availableWidth = outerRect.width;
            const availableHeight = outerRect.height;
            
            // Check if menu would go beyond right edge of available space
            // If so, position it to the left of the cursor instead of to the right
            if (ctxMenu.x + menuWidth > availableWidth) {
              adjustedX = ctxMenu.x - menuWidth - 10; // Position to the left of cursor
              
              // If that would go beyond the left edge, clamp to left with padding
              if (adjustedX < 10) {
                adjustedX = 10;
              }
            }
            
            // Check if menu would go beyond bottom edge of available space
            // Add extra margin for bottom panel (approximately 180px for panel + padding)
            const bottomPanelHeight = 180; // Approximate bottom panel height + safety margin
            const safeBottomHeight = availableHeight - bottomPanelHeight;
            
            if (ctxMenu.y + menuHeight > safeBottomHeight) {
              // Position menu above the cursor instead of below
              adjustedY = ctxMenu.y - menuHeight - 10; // Position above cursor
              
              // If that would go above the top edge, position at top with padding
              if (adjustedY < 10) {
                adjustedY = 10;
              }
            }
            
            // Ensure menu doesn't go beyond left edge (double-check)
            if (adjustedX < 10) {
              adjustedX = 10;
            }
            
            // Ensure menu doesn't go beyond right edge (final check)
            if (adjustedX + menuWidth > availableWidth) {
              adjustedX = availableWidth - menuWidth - 10;
            }
          }
          
          return (
            <div
              className="absolute z-200 bg-[#1a1a24] border border-white/15 rounded-xl shadow-2xl py-2 w-[200px]"
              style={{ left: adjustedX, top: adjustedY }}
              onMouseDown={e => e.stopPropagation()}
            >
            {ctxMenu.kind === "canvas" ? (
              // Canvas context menu - creation options
              <>
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 text-gray-200 hover:text-white transition-colors group"
                  onClick={() => {
                    const textId = makeId();
                    onStateChange({
                      ...state,
                      textElements: [...state.textElements, {
                        id: textId,
                        panelId: panelId,
                        x: ctxMenu.x - 50,
                        y: ctxMenu.y - 15,
                        w: 100,
                        h: 30,
                        text: "New Text",
                        fontSize: 16,
                        fontWeight: "normal",
                        fontStyle: "normal",
                        fontFamily: "Arial",
                        color: "#000000",
                        backgroundColor: "transparent",
                        zIndex: 3
                      }]
                    });
                    setSelection(null, textId, null);
                    setCtxMenu(null);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-[13px] font-medium">Text Element</span>
                  </div>
                </button>
                
                <div className="mx-3 my-1 h-px bg-white/10" />
                
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 text-gray-200 hover:text-white transition-colors group"
                  onClick={() => {
                    const bubbleId = makeId();
                    onStateChange({
                      ...state,
                      bubbles: [...state.bubbles, {
                        id: bubbleId,
                        panelId: panelId,
                        x: ctxMenu.x - 100,
                        y: ctxMenu.y - 50,
                        w: 200,
                        h: 100,
                        text: "Speech",
                        bubbleType: "speech" as const,
                        tailMode: "auto" as const,
                        tailDir: "bottom-left" as const,
                        tailX: 50,
                        tailY: 130,
                        autoFitFont: true,
                        fontSize: 15,
                        flippedColors: false,
                        rotation: 0,
                        flipX: false,
                        flipY: false,
                        zIndex: 4
                      }]
                    });
                    setSelection(bubbleId, null, null);
                    setCtxMenu(null);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                    <span className="text-[13px] font-medium">Bubble Text</span>
                  </div>
                  <svg className="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
                
                {/* Bubble sub-menu */}
                <div className="pl-8 pr-4 py-2">
                  <div className="text-[11px] text-gray-500 font-medium mb-2">Bubble Types:</div>
                  {[
                    { type: "speech", label: "Speech" },
                    { type: "speechRough", label: "Speech (Rough)" },
                    { type: "thought", label: "Thought" },
                    { type: "shout", label: "Shout" },
                    { type: "whisper", label: "Whisper" },
                    { type: "sfx", label: "Sfx" },
                    { type: "rectRound", label: "RndRect" },
                    { type: "rect", label: "Rect" },
                    { type: "oval", label: "Oval" }
                  ].map(({ type, label }) => (
                    <button
                      key={type}
                      className="w-full text-left px-3 py-2 text-[12px] text-gray-400 hover:text-white hover:bg-white/5 rounded transition-colors"
                      onClick={() => {
                        const bubbleId = makeId();
                        onStateChange({
                          ...state,
                          bubbles: [...state.bubbles, {
                            id: bubbleId,
                            panelId: panelId,
                            x: ctxMenu.x - 100,
                            y: ctxMenu.y - 50,
                            w: 200,
                            h: 100,
                            text: label,
                            bubbleType: type as any,
                            tailMode: "auto" as const,
                            tailDir: "bottom-left" as const,
                            tailX: 50,
                            tailY: 130,
                            autoFitFont: true,
                            fontSize: 15,
                            flippedColors: false,
                            rotation: 0,
                            flipX: false,
                            flipY: false,
                            zIndex: 4
                          }]
                        });
                        setSelection(bubbleId, null, null);
                        setCtxMenu(null);
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </>
            ) : (
              // Element context menu - editing options
              (() => {
                // Get current bubble for conditional menu items
                const currentBubble = ctxMenu.kind === "bubble" && ctxMenu.id 
                  ? bubbles.find(b => b.id === ctxMenu.id) 
                  : null;
                
                // Check if bubble has tail (only certain bubble types have tails)
                const bubbleHasTail = currentBubble && !["shout", "sfx"].includes(currentBubble.bubbleType);
                
                return [
                { label: "Duplicate",      shortcut: "Ctrl+D",     icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", action: (e) => { 
                  e?.stopPropagation();
                  if (ctxMenu.id) {
                    if (ctxMenu.kind === "asset") duplicateAsset(ctxMenu.id);
                    else if (ctxMenu.kind === "text") duplicateText(ctxMenu.id);
                    else if (ctxMenu.kind === "bubble") duplicateBubble(ctxMenu.id);
                  }
                  setCtxMenu(null); 
                } },
                { label: "Reset Position", shortcut: "Ctrl+R",     icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", action: (e) => { 
                  e?.stopPropagation();
                  if (ctxMenu.id) {
                    if (ctxMenu.kind === "asset") patchAsset(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
                    else if (ctxMenu.kind === "text") patchText(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
                    else if (ctxMenu.kind === "bubble") patchBubble(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
                  }
                  setCtxMenu(null); 
                } },
                { label: "Flip Horizontal", shortcut: "H",         icon: "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4", action: (e) => { 
                  e?.stopPropagation();
                  if (ctxMenu.id) {
                    if (ctxMenu.kind === "asset") {
                      const asset = assetElements.find(a => a.id === ctxMenu.id);
                      if (asset) patchAsset(ctxMenu.id, { flipX: !asset.flipX });
                    } else if (ctxMenu.kind === "text") {
                      const text = textElements.find(t => t.id === ctxMenu.id);
                      if (text) patchText(ctxMenu.id, { flipX: !text.flipX });
                    } else if (ctxMenu.kind === "bubble") {
                      const bubble = bubbles.find(b => b.id === ctxMenu.id);
                      if (bubble) patchBubble(ctxMenu.id, { flipX: !bubble.flipX });
                    }
                  }
                  setCtxMenu(null); 
                } },
                { label: "Flip Vertical",   shortcut: "V",         icon: "M7 16V8m0 0l3 3m-3-3l-3 3m14 8V8m0 0l-3 3m3-3l3 3", action: (e) => { 
                  e?.stopPropagation();
                  if (ctxMenu.id) {
                    if (ctxMenu.kind === "asset") {
                      const asset = assetElements.find(a => a.id === ctxMenu.id);
                      if (asset) patchAsset(ctxMenu.id, { flipY: !asset.flipY });
                    } else if (ctxMenu.kind === "text") {
                      const text = textElements.find(t => t.id === ctxMenu.id);
                      if (text) patchText(ctxMenu.id, { flipY: !text.flipY });
                    } else if (ctxMenu.kind === "bubble") {
                      const bubble = bubbles.find(b => b.id === ctxMenu.id);
                      if (bubble) patchBubble(ctxMenu.id, { flipY: !bubble.flipY });
                    }
                  }
                  setCtxMenu(null); 
                } },
                // Bubble-specific options
                ...(bubbleHasTail ? [
                  null, // Divider
                  { label: "Tail Direction", shortcut: "", icon: "M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
                      const contextMenuItems = [
                        "Duplicate", "Reset Position", "Flip Horizontal", "Flip Vertical",
                        "Tail Direction", "Hide/Show Tail", "Flip Colors", "Layer"
                      ];
                      
                      // Find the index of "Tail Direction" in the menu
                      const tailDirectionIndex = contextMenuItems.indexOf("Tail Direction");
                      
                      // Calculate adjusted position (same as main context menu)
                      const menuWidth = 200;
                      const menuHeight = 300;
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const outerRect = outerRef.current?.getBoundingClientRect();
                      
                      let adjustedX = ctxMenu.x;
                      let adjustedY = ctxMenu.y;
                      
                      if (containerRect && outerRect) {
                        const availableWidth = outerRect.width;
                        const availableHeight = outerRect.height;
                        const bottomPanelHeight = 180;
                        const safeBottomHeight = availableHeight - bottomPanelHeight;
                        
                        if (ctxMenu.x + menuWidth > availableWidth) {
                          adjustedX = ctxMenu.x - menuWidth - 10;
                          if (adjustedX < 10) adjustedX = 10;
                        }
                        
                        if (ctxMenu.y + menuHeight > safeBottomHeight) {
                          adjustedY = ctxMenu.y - menuHeight - 10;
                          if (adjustedY < 10) adjustedY = 10;
                        }
                      }
                      
                      // Calculate menu item position using adjusted coordinates
                      const menuItemTop = adjustedY + (tailDirectionIndex * menuItemHeight);
                      
                      setCtxMenu({ 
                        ...ctxMenu, 
                        submenu: 'tailDirection',
                        parentX: adjustedX,
                        parentY: menuItemTop,
                        menuItemIndex: tailDirectionIndex,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
                  { label: currentBubble?.tailMode === "none" ? "Show Tail" : "Hide Tail", shortcut: "", icon: currentBubble?.tailMode === "none" ? "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" : "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id && currentBubble) {
                      const newTailMode = currentBubble.tailMode === "none" ? "default" : "none";
                      patchBubble(ctxMenu.id, { tailMode: newTailMode });
                    }
                    setCtxMenu(null);
                  } },
                  { label: "Flip Colors",     shortcut: "",          icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id && currentBubble) {
                      patchBubble(ctxMenu.id, { flippedColors: !currentBubble.flippedColors });
                    }
                    setCtxMenu(null);
                  } },
                ] : []),
                null, // Divider
                { label: "Layer", shortcut: "", icon: "M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
                      const contextMenuItems = [
                        "Duplicate", "Reset Position", "Flip Horizontal", "Flip Vertical",
                        "Tail Direction", "Hide/Show Tail", "Flip Colors", "Layer"
                      ];
                      
                      // Find the index of "Layer" in the menu
                      const layerIndex = contextMenuItems.indexOf("Layer");
                      
                      // Calculate adjusted position (same as main context menu)
                      const menuWidth = 200;
                      const menuHeight = 300;
                      const containerRect = containerRef.current?.getBoundingClientRect();
                      const outerRect = outerRef.current?.getBoundingClientRect();
                      
                      let adjustedX = ctxMenu.x;
                      let adjustedY = ctxMenu.y;
                      
                      if (containerRect && outerRect) {
                        const availableWidth = outerRect.width;
                        const availableHeight = outerRect.height;
                        const bottomPanelHeight = 180;
                        const safeBottomHeight = availableHeight - bottomPanelHeight;
                        
                        if (ctxMenu.x + menuWidth > availableWidth) {
                          adjustedX = ctxMenu.x - menuWidth - 10;
                          if (adjustedX < 10) adjustedX = 10;
                        }
                        
                        if (ctxMenu.y + menuHeight > safeBottomHeight) {
                          adjustedY = ctxMenu.y - menuHeight - 10;
                          if (adjustedY < 10) adjustedY = 10;
                        }
                      }
                      
                      // Calculate menu item position using adjusted coordinates
                      const menuItemTop = adjustedY + (layerIndex * menuItemHeight);
                      
                      setCtxMenu({ 
                        ...ctxMenu, 
                        submenu: 'layer',
                        parentX: adjustedX,
                        parentY: menuItemTop,
                        menuItemIndex: layerIndex,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
              ];
              })().map((item, index) => {
                if (item === null) {
                  return <div key={`divider-${index}`} className="mx-3 my-1 h-px bg-white/10" />;
                }
                return (
                  <button key={item.label}
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 text-gray-200 hover:text-white transition-colors group"
                    onClick={(e) => item.action(e)}
                  >
                    <div className="flex items-center gap-2.5">
                      <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                      </svg>
                      <span className="text-[13px] font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.shortcut && <span className="text-[10px] text-gray-500 font-mono">{item.shortcut}</span>}
                      {(item.label === "Tail Direction" || item.label === "Layer") && (
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </button>
                );
              }))}
            </div>
          );
        })()}
        
        {/* Submenu rendering */}
        {ctxMenu && ctxMenu.submenu && (() => {
          const submenuItems = ctxMenu.submenu === 'tailDirection' ? [
            { label: "← Tail Left", icon: "M15 19l-7-7 7-7", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "left" as any }); setCtxMenu(null); } },
            { label: "→ Tail Right", icon: "M9 5l7 7-7 7", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "right" as any }); setCtxMenu(null); } },
            { label: "↙ Tail Bottom Left", icon: "M7 16l-4-4 4-4", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "bottom-left" as any }); setCtxMenu(null); } },
            { label: "↘ Tail Bottom Right", icon: "M17 8l4 4-4 4", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "bottom-right" as any }); setCtxMenu(null); } },
          ] : ctxMenu.submenu === 'layer' ? [
            { label: "↑ Bring Forward", icon: "M12 5l7 7-7 7M5 5l7 7-7 7", action: () => { if (ctxMenu.id) { bringForward(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
            { label: "⇈ Bring to Front", icon: "M5 3h14M12 7l7 7-7 7M5 7l7 7-7 7", action: () => { if (ctxMenu.id) { bringToFront(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
            { label: "↓ Send Backward", icon: "M12 19l-7-7 7-7M19 19l-7-7 7-7", action: () => { if (ctxMenu.id) { sendBackward(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
            { label: "⇊ Send to Back", icon: "M19 21H5M12 17l-7-7 7-7M19 17l-7-7 7-7", action: () => { if (ctxMenu.id) { sendToBack(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
          ] : [];
          
          return (
            <div
              className="absolute bg-[#1a1d23] border border-white/10 rounded-lg shadow-2xl py-2 z-[1002] min-w-[180px]"
              style={{
                // Smart horizontal positioning based on available space
                left: `${(() => {
                  const submenuWidth = 180;
                  const parentX = ctxMenu.parentX || 0;
                  const containerRect = containerRef.current?.getBoundingClientRect();
                  
                  if (!containerRect) return `${parentX + 200}px`;
                  
                  // Calculate available space
                  const spaceRight = containerRect.width - (parentX + 200); // Space to the right of main menu
                  const spaceLeft = parentX; // Space to the left of main menu
                  
                  // Position submenu based on available space
                  if (spaceRight >= submenuWidth) {
                    return `${parentX + 200}px`; // Open to right of main menu
                  } else if (spaceLeft >= submenuWidth) {
                    return `${parentX - submenuWidth}px`; // Open to left of main menu
                  } else {
                    // Not enough space on either side, prioritize right
                    return `${parentX + 200}px`;
                  }
                })()}`,
                // Position so submenu BOTTOM aligns with menu item BOTTOM
                // Submenu top = menu item bottom - submenu height
                top: `${(() => {
                  const menuItemHeight = ctxMenu.menuItemHeight || 44;
                  const submenuHeight = submenuItems.length * 44;
                  return (ctxMenu.parentY || 0) + menuItemHeight - submenuHeight;
                })()}px`,
              }}
              onMouseDown={e => e.stopPropagation()}
            >
              {submenuItems.map((item, index) => (
                <button key={item.label}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 text-gray-200 hover:text-white transition-colors group"
                  onClick={item.action}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={item.icon} />
                    </svg>
                    <span className="text-[13px] font-medium">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>
          );
        })()}
      </div>
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
