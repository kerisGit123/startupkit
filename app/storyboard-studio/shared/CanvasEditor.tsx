"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import type { Bubble, TextElement, AssetElement, AssetLibraryItem, ShapeElement, MaskDot, TailDir } from "./canvas-types";
import {
  makeId, estimateFontSize, bubbleEllipse, roughEllipsePath,
  tailPath, rectTailPath, rectOutlinePathWithGap, cloudPath, burstPoints,
} from "./canvas-helpers";
import { ResizeHandles, MaskCanvas, RectangleCanvas } from "./canvas-components";

// ── Public types ───────────────────────────────────────────────────────────
export type { Bubble, TextElement, AssetElement, AssetLibraryItem, ShapeElement, MaskDot };

export interface CanvasEditorState {
  bubbles: Bubble[];
  textElements: TextElement[];
  assetElements: AssetElement[];
  shapeElements: ShapeElement[];
  assetLibrary: AssetLibraryItem[];
  mask: MaskDot[];
  undoStack: MaskDot[][];
  redoStack: MaskDot[][];
}

export function emptyCanvasState(): CanvasEditorState {
  return { bubbles: [], textElements: [], assetElements: [], shapeElements: [], assetLibrary: [], mask: [], undoStack: [], redoStack: [] };
}

export type CanvasActiveTool = "layers" | "bubbles" | "text" | "canvas-objects" | "inpaint" | "rectInpaint" | "panel" | "image" | "crop" | "comments" | "move" | "arrow" | "line" | "square" | "circle";

export interface CanvasSelection {
  selectedBubbleId: string | null;
  selectedTextId: string | null;
  selectedAssetId: string | null;
  selectedShapeId: string | null;
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
  showMask?: boolean;
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
  onToolSelect?: (tool: CanvasActiveTool) => void;
  generateImageWithElements?: () => Promise<string | null>;
  /** Called when the image loads; receives the fit-to-container scale */
  onImageLoad?: (scale: number) => void;
  /** Called when the user clicks the crop button overlay */
  onCropClick?: () => void;
  selectedColor?: string;
  onColorPickerClick?: () => void; // Add handler for color picker click
  onDeleteSelected?: () => void; // Add handler for delete selected element
  onAspectRatioChange?: (aspectRatio: string) => void; // Add handler for aspect ratio changes
  mode?: "describe" | "area-edit" | "annotate"; // AI Edit mode
  onSetOriginalImage?: (imageUrl: string) => void; // Add handler for setting original image
  zoomLevel?: number; // Zoom level in percent (100 = fit to screen)
}

type DragInfo = {
  kind: "bubble" | "text" | "asset" | "canvas" | "shape";
  id: string;
  type: "move" | "resize" | "move-canvas";
  handle?: string;
  startX: number; startY: number;
  origX: number; origY: number;
  origW: number; origH: number;
  origRot: number;
  origScale?: number;
} | null;

type RotDragInfo = {
  kind: "bubble" | "text" | "asset" | "shape";
  id: string;
  startAngle: number;
  centerX: number;
  centerY: number;
  origRot: number;
};

// ── CanvasEditor ───────────────────────────────────────────────────────────
export function CanvasEditor({
  panelId, imageUrl, activeTool, state, onStateChange,
  brushSize, isEraser, maskOpacity, showMask = true, hiddenObjectIds = new Set(),
  onSelectionChange, selection, aspectRatio, resetAllTransformations,
  rectangle, onRectangleChange, rectangleVisible = true, canvasTool, isAspectRatioAnimating = false, isSquareMode = false, onToolSelect, generateImageWithElements,
  onImageLoad, onCropClick, selectedColor = "#FF0000", onColorPickerClick, onDeleteSelected, onAspectRatioChange, mode, onSetOriginalImage, zoomLevel = 100,
}: CanvasEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const outerRef = useRef<HTMLDivElement>(null);
  const [outerSize, setOuterSize] = useState({ w: 0, h: 0 });
  const [containerSize, setContainerSize] = useState({ w: 800, h: 500 });
  const [isPainting, setIsPainting] = useState(false);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [_selectedBubbleId, _setSelectedBubbleId] = useState<string | null>(null);
  const [_selectedTextId, _setSelectedTextId] = useState<string | null>(null);
  const [_selectedAssetId, _setSelectedAssetId] = useState<string | null>(null);

  // Debug: Track imageUrl changes
  useEffect(() => {
    console.log("DEBUG: CanvasEditor imageUrl changed to: ",imageUrl?.substring(0,50));
  }, [imageUrl]);

  // Update image transform when zoomLevel or container size changes
  useEffect(() => {
    const container = containerRef.current;
    const img = getMainCanvasImage();
    if (!container || !img || !img.naturalWidth || !img.naturalHeight) return;

    const cW = container.offsetWidth;
    const cH = container.offsetHeight;
    if (!cW || !cH) return;

    const baseScale = Math.min(cW / img.naturalWidth, cH / img.naturalHeight);
    const zoomScale = baseScale * (zoomLevel / 100);
    const tx = (cW - img.naturalWidth * zoomScale) / 2;
    const ty = (cH - img.naturalHeight * zoomScale) / 2;
    img.style.transform = `translate(${tx}px, ${ty}px) scale(${zoomScale})`;
    onImageLoad?.(baseScale);
  }, [zoomLevel, containerSize.w, containerSize.h]);

  const dragRef = useRef<DragInfo>(null);
  const rotDragRef = useRef<RotDragInfo>(null);
  const [editingBubbleId, setEditingBubbleId] = useState<string | null>(null);
  const [editingTextId, setEditingTextId] = useState<string | null>(null);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number; kind: "bubble" | "text" | "asset" | "canvas" | "shape"; id?: string; submenu?: 'tailDirection' | 'layer' | 'bubbleType' | 'textProperties' | 'shapeProperties' | 'colorPalette'; parentX?: number; parentY?: number; parentWidth?: number; parentHeight?: number; menuItemIndex?: number; menuItemHeight?: number } | null>(null);
  const [copiedObject, setCopiedObject] = useState<{ type: "bubble" | "text" | "asset" | "shape"; data: any } | null>(null);
  const [pendingCombine, setPendingCombine] = useState(false); // TODO: Combine Background feature - pending proper implementation

  // Handle deferred combine background (fires after context menu closes)
  useEffect(() => {
    if (!pendingCombine) return;
    setPendingCombine(false);
    (async () => {
      try {
        const target = containerRef.current;
        if (!target) return;
        console.log("[CanvasEditor] Combine Background: capturing screenshot...");
        const html2canvas = (await import("html2canvas")).default;
        const canvas = await html2canvas(target, {
          useCORS: true,
          allowTaint: true,
          backgroundColor: null,
          scale: 2,
          logging: false,
        });
        const dataUrl = canvas.toDataURL("image/png");
        console.log("[CanvasEditor] Screenshot captured:", dataUrl.length, "chars");
        if (dataUrl) {
          window.dispatchEvent(new CustomEvent('addCombinedImage', { detail: dataUrl }));
        }
      } catch (error) {
        console.error("[CanvasEditor] Combine failed, trying fallback:", error);
        if (generateImageWithElements) {
          try {
            const result = await generateImageWithElements();
            if (result) {
              window.dispatchEvent(new CustomEvent('addCombinedImage', { detail: result }));
            }
          } catch (e) {
            console.error("[CanvasEditor] Fallback also failed:", e);
          }
        }
      }
    })();
  }, [pendingCombine, generateImageWithElements]);

  // Use controlled selection if provided, else internal
  const selectedBubbleId = selection ? selection.selectedBubbleId : _selectedBubbleId;
  const selectedTextId   = selection ? selection.selectedTextId   : _selectedTextId;
  const selectedAssetId  = selection ? selection.selectedAssetId  : _selectedAssetId;
  const selectedShapeId  = selection ? selection.selectedShapeId  : null;

  const setSelection = useCallback((bubbleId: string | null, textId: string | null, assetId: string | null, shapeId: string | null = null) => {
    _setSelectedBubbleId(bubbleId);
    _setSelectedTextId(textId);
    _setSelectedAssetId(assetId);
    onSelectionChange?.({ selectedBubbleId: bubbleId, selectedTextId: textId, selectedAssetId: assetId, selectedShapeId: shapeId });
  }, [onSelectionChange]);


  const { bubbles, textElements, assetElements, shapeElements, assetLibrary, mask } = state;

  // Filter to current panel only
  const panelBubbles = bubbles.filter(b => b.panelId === panelId && !hiddenObjectIds.has(b.id));
  const panelTexts = textElements.filter(t => t.panelId === panelId && !hiddenObjectIds.has(t.id));
  const panelAssets = assetElements.filter(a => a.panelId === panelId && !hiddenObjectIds.has(a.id));
  const panelShapes = shapeElements.filter(s => s.panelId === panelId && !hiddenObjectIds.has(s.id));
  
  // ── Color selection state ─────────────────────────────────────────────────────--
  // Check if any element is selected
  const hasSelectedElement = selectedBubbleId || selectedTextId || selectedAssetId || selectedShapeId;
  
  // State for color palette submenu
  const [showColorPalette, setShowColorPalette] = useState(false);
  const [colorPalettePosition, setColorPalettePosition] = useState({ x: 0, y: 0 });
  
  // Handle color change from toolbar color picker
  const handleColorPickerClick = () => {
    if (hasSelectedElement) {
      // Always show color palette submenu when user clicks color picker with selected element
      setShowColorPalette(true);
      // Position the color palette near the color picker button
      setColorPalettePosition({ x: 100, y: 200 });
      
      // Also call external handler if provided (for additional logic)
      if (onColorPickerClick) {
        onColorPickerClick();
      }
    }
  };

  // Handle delete selected element
  const handleDeleteSelected = () => {
    if (selectedBubbleId) {
      onStateChange({ ...state, bubbles: bubbles.filter(b => b.id !== selectedBubbleId) });
      setSelection(null, null, null);
    } else if (selectedTextId) {
      onStateChange({ ...state, textElements: textElements.filter(t => t.id !== selectedTextId) });
      setSelection(null, null, null);
    } else if (selectedAssetId) {
      onStateChange({ ...state, assetElements: assetElements.filter(a => a.id !== selectedAssetId) });
      setSelection(null, null, null);
    } else if (selectedShapeId) {
      onStateChange({ ...state, shapeElements: shapeElements.filter(s => s.id !== selectedShapeId) });
      setSelection(null, null, null, null);
    } else {
      console.log("No element selected to delete");
    }
  };

  // Listen for custom delete events from ImageAIPanel
  useEffect(() => {
    const handleDeleteEvent = () => {
      handleDeleteSelected();
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('deleteSelectedElement', handleDeleteEvent);
      return () => {
        container.removeEventListener('deleteSelectedElement', handleDeleteEvent);
      };
    }
  }, [handleDeleteSelected]);
  
  // Apply color to selected element (only called when user selects from submenu)
  const applyColorToSelected = (color: string) => {
    if (selectedBubbleId) {
      const bubble = bubbles.find(b => b.id === selectedBubbleId);
      if (bubble) patchBubble(selectedBubbleId, { flippedColors: bubble.flippedColors ? false : true }); // Toggle flipped colors
    } else if (selectedTextId) {
      const text = textElements.find(t => t.id === selectedTextId);
      if (text) patchText(selectedTextId, { color: color });
    } else if (selectedShapeId) {
      const shape = shapeElements.find(s => s.id === selectedShapeId);
      if (shape) patchShape(selectedShapeId, { strokeColor: color });
    } else if (selectedAssetId) {
      const asset = assetElements.find(a => a.id === selectedAssetId);
      if (asset) patchAsset(selectedAssetId, { rotation: 0 }); // Assets don't have color, just reset as placeholder
    }
    setShowColorPalette(false);
  };
  
  // Auto-create text when text tool is activated
  const createTextInCenter = useCallback(() => {
    console.log("Creating text element...");
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const textId = makeId();
      
      console.log("Creating text at center:", cx, cy);
      
      // Create new text element
      const baseWidth = 200; // Always 200px width
      const baseHeight = 30;
      
      const newTextElement = {
        id: textId,
        panelId: panelId,
        x: cx - baseWidth / 2,
        y: cy - baseHeight / 2,
        w: baseWidth,
        h: baseHeight,
        text: "Double click to edit",
        fontSize: 16,
        fontWeight: "normal",
        fontStyle: "normal",
        fontFamily: "Noto Sans SC",
        color: selectedColor || "#000000",
        backgroundColor: "transparent",
        zIndex: 3
      };
      
      console.log("New text element:", newTextElement);
      
      // Use functional update to avoid dependency on state
      onStateChange({
        ...state,
        textElements: [...state.textElements, newTextElement]
      } as CanvasEditorState);
      setSelection(null, textId, null);
      
      // Auto-select canvas-objects tool after text creation
      onToolSelect?.("canvas-objects");
      
      console.log("Text creation completed!");
    } else {
      console.log("Container ref is null!");
    }
  }, [panelId, onStateChange, setSelection, mode, onToolSelect, state]);

  // Auto-create shape when shape tool is activated
  const createShapeInCenter = useCallback((shapeType: "arrow" | "line" | "rectangle" | "circle") => {
    console.log(`Creating ${shapeType} element...`);
    const container = containerRef.current;
    if (container) {
      const rect = container.getBoundingClientRect();
      const cx = rect.width / 2;
      const cy = rect.height / 2;
      const shapeId = makeId();
      
      console.log(`Creating ${shapeType} at center:`, cx, cy);
      
      // For arrow/line: x,y = head (start), endX,endY = tail (end)
      // For rectangle/circle: x,y = top-left, w,h = dimensions
      const isLineOrArrow = shapeType === "arrow" || shapeType === "line";
      
      // Create new shape element
      const newShapeElement: ShapeElement = {
        id: shapeId,
        panelId: panelId,
        type: shapeType,
        // For arrow/line: head at (cx, cy), tail at (cx + 100, cy) - pointing right, 100px long
        x: isLineOrArrow ? cx : cx - 50,
        y: isLineOrArrow ? cy : cy - 50,
        w: isLineOrArrow ? 100 : 100,  // width for rectangle/circle
        h: isLineOrArrow ? 100 : 100,  // height for rectangle/circle
        // For arrow/line: endX,endY = tail position
        endX: isLineOrArrow ? cx + 100 : undefined,
        endY: isLineOrArrow ? cy : undefined,
        strokeColor: selectedColor,
        strokeWidth: 2,
        fillColor: "transparent",
        rotation: 0,
        flipX: false,
        flipY: false,
        zIndex: 2
      };
      
      console.log("New shape element:", newShapeElement);
      
      // Use functional update to avoid dependency on state
      onStateChange({
        ...state,
        shapeElements: [...state.shapeElements, newShapeElement]
      } as CanvasEditorState);
      setSelection(null, null, null, shapeId);
      
      // Auto-select canvas-objects tool after shape creation
      onToolSelect?.("canvas-objects");
      
    }
  }, [panelId, onStateChange, setSelection, selectedColor, onToolSelect, state]);

  useEffect(() => {
    if (activeTool === "text") {
      createTextInCenter();
    } else if (activeTool === "arrow") {
      createShapeInCenter("arrow");
    } else if (activeTool === "line") {
      createShapeInCenter("line");
    } else if (activeTool === "square") {
      createShapeInCenter("rectangle");
    } else if (activeTool === "circle") {
      createShapeInCenter("circle");
    }
  }, [activeTool]);

  useEffect(() => {
    const totalShapes = bubbles.length + textElements.length + assetElements.length + shapeElements.length;
  }, [bubbles, textElements, assetElements, shapeElements]);
  
  
  const getPos = (e: React.MouseEvent | MouseEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const getMainCanvasImage = useCallback(() => {
    return containerRef.current?.querySelector('[data-canvas-base-image="true"]') as HTMLImageElement | null;
  }, []);

  // ── Mask painting ──
  const addMaskDot = useCallback((e: React.MouseEvent | MouseEvent) => {
    console.log('[CanvasEditor] addMaskDot called'); // Test log
    const containerRect = containerRef.current?.getBoundingClientRect();
    if (!containerRect) return;

    // Use getBoundingClientRect to get the actual rendered image position
    // This correctly handles: CSS transforms, flexbox centering, any layout positioning
    const image = getMainCanvasImage();
    
    if (!image || !image.naturalWidth || !image.complete) return;

    const imgRect = image.getBoundingClientRect();
    
    // Get the computed style to check for CSS transforms
    const computedStyle = window.getComputedStyle(image);
    const transform = computedStyle.transform;
    
    // Calculate scale from the actual rendered dimensions
    const scaleX = imgRect.width / image.naturalWidth;
    const scaleY = imgRect.height / image.naturalHeight;
    const imgLeft = imgRect.left - containerRect.left;
    const imgTop = imgRect.top - containerRect.top;
    
    const mouseX = e.clientX - containerRect.left;
    const mouseY = e.clientY - containerRect.top;

    // Store mask in canvas-space (container-relative) coordinates, not image-space
    // This ensures Original and Generated panels share exactly the same mask
    const x = mouseX;
    const y = mouseY;

    // Enhanced debug to compare Original vs Generated image coordinates
    const imageType = image.currentSrc?.includes('generated') ? 'Generated' : 'Original';
    console.log(`[CanvasEditor:addMaskDot] ${imageType} Image`, {
      imageType,
      imageUrl: image.currentSrc?.slice(0, 120),
      naturalSize: { w: image.naturalWidth, h: image.naturalHeight },
      renderedSize: { w: imgRect.width, h: imgRect.height },
      containerSize: { w: containerRect.width, h: containerRect.height },
      imageOffsetInCanvas: { x: imgLeft, y: imgTop },
      mouseInContainer: { x: Math.round(mouseX), y: Math.round(mouseY) },
      imageSpaceResult: { x: Math.round(x), y: Math.round(y) },
      scaleFactors: { x: scaleX.toFixed(3), y: scaleY.toFixed(3) },
      isEraser,
      brushSize,
    });

        
    // Bounds check: reject painting outside the canvas container
    if (!isEraser && (x < 0 || x > containerRect.width || y < 0 || y > containerRect.height)) return;

    // Use brush size directly without problematic normalization
    // The CSS transform handling should handle scaling appropriately
    const r = brushSize;

    const newMask = isEraser
      ? state.mask.filter(d => Math.hypot(d.x - x, d.y - y) > r / 2)
      : [...state.mask, { x, y, r }];
    onStateChange({ ...state, mask: newMask });
  }, [state, isEraser, brushSize, onStateChange, getMainCanvasImage]);

  const commitMaskSnapshot = useCallback(() => {
    onStateChange({ ...state, undoStack: [...state.undoStack, state.mask], redoStack: [] });
  }, [state, onStateChange]);

  // ── Mouse down ──
  const handleMouseDown = (e: React.MouseEvent) => {
    console.log('[CanvasEditor] handleMouseDown', { activeTool, button: e.button });
    if (activeTool === "inpaint" && e.button === 0) {
      // Paint with left mouse button (button === 0) - only for brush inpaint
      e.preventDefault();
      commitMaskSnapshot();
      setIsMouseDown(true);
      setIsPainting(true);
      addMaskDot(e);
      console.log('[CanvasEditor] Calling addMaskDot from handleMouseDown');
      return;
    }
    
    if (activeTool === "move" && e.button === 0) {
      // Start moving canvas image
      e.preventDefault();
      setIsMouseDown(true);
      const { x, y } = getPos(e);
      
      // Get current image position from its actual rendered rect
      const image = getMainCanvasImage();
      let currentX = 0, currentY = 0, currentScale = 1;
      if (image && containerRef.current) {
        const cRect = containerRef.current.getBoundingClientRect();
        const iRect = image.getBoundingClientRect();
        currentX = iRect.left - cRect.left;
        currentY = iRect.top  - cRect.top;
        currentScale = image.naturalWidth ? iRect.width / image.naturalWidth : 1;
      }
      
      dragRef.current = {
        kind: "canvas",
        id: "canvas-main",
        type: "move-canvas",
        handle: "",
        startX: x,
        startY: y,
        origX: currentX,
        origY: currentY,
        origW: 0,
        origH: 0,
        origRot: 0,
        origScale: currentScale,
      };
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
      if (isPainting && activeTool === "inpaint" && isMouseDown) { 
        addMaskDot(e); 
        return; 
      }

      if (rotDragRef.current) {
        const rd = rotDragRef.current;
        const { x, y } = { x: e.clientX, y: e.clientY };
        const angle = Math.atan2(y - rd.centerY, x - rd.centerX) * (180 / Math.PI);
        const newRot = Math.round(rd.origRot + (angle - rd.startAngle));
        if (rd.kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === rd.id ? { ...b, rotation: newRot } : b) });
        else if (rd.kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === rd.id ? { ...t, rotation: newRot } : t) });
        else if (rd.kind === "shape") onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === rd.id ? { ...s, rotation: newRot } : s) });
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
        else if (d.kind === "shape") {
          const shape = shapeElements.find(s => s.id === d.id);
          if (shape && (shape.type === "arrow" || shape.type === "line")) {
            // For arrows/lines, move both head (x,y) and tail (endX,endY) together
            const newTailX = d.origW + dx;
            const newTailY = d.origH + dy;
            onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === d.id ? { ...s, x: nx, y: ny, endX: newTailX, endY: newTailY } : s) });
          } else {
            // For rectangles/circles, normal move
            onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === d.id ? { ...s, x: nx, y: ny } : s) });
          }
        }
        else onStateChange({ ...state, assetElements: assetElements.map(a => a.id === d.id ? { ...a, x: nx, y: ny } : a) });
      } else if (d.type === "move-canvas") {
        // Handle canvas image movement — use origScale captured at mousedown
        const image = containerRef.current?.querySelector('[data-canvas-base-image="true"]') as HTMLImageElement | null;
        if (image) {
          const newTransformX = d.origX + dx;
          const newTransformY = d.origY + dy;
          image.style.transform = `translate(${newTransformX}px, ${newTransformY}px) scale(${d.origScale})`;
        }
      } else if (d.type === "resize") {
        // Check if this is an endpoint resize for arrow/line
        if (d.handle === "start" || d.handle === "end") {
          // Endpoint resize for arrow/line - use endX,endY for tail
          const shape = shapeElements.find(s => s.id === d.id);
          if (shape && (shape.type === "arrow" || shape.type === "line")) {
            if (d.handle === "end") {
              // Dragging end point (tail) - start point stays fixed at (x, y)
              // Update endX,endY to new absolute coordinates
              const newEndX = d.origW + dx;
              const newEndY = d.origH + dy;
              onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === d.id ? { ...s, endX: newEndX, endY: newEndY } : s) });
            } else {
              // Dragging start point (head) - end point stays fixed at (endX,endY)
              // Update x,y to new absolute coordinates
              const newStartX = d.origX + dx;
              const newStartY = d.origY + dy;
              onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === d.id ? { 
                ...s, 
                x: newStartX, 
                y: newStartY
              } : s) });
            }
          }
        } else {
          // Regular corner resize for rectangle/circle
          const nw = Math.max(20, d.origW + (d.handle?.includes("e") ? dx : d.handle?.includes("w") ? -dx : 0));
          const nh = Math.max(20, d.origH + (d.handle?.includes("s") ? dy : d.handle?.includes("n") ? -dy : 0));
          const nx = d.origX + (d.handle?.includes("e") ? 0 : d.handle?.includes("w") ? (d.origW - nw) : dx / 2);
          const ny = d.origY + (d.handle?.includes("s") ? 0 : d.handle?.includes("n") ? (d.origH - nh) : dy / 2);
          if (d.kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === d.id ? { ...b, x: nx, y: ny, w: nw, h: nh } : b) });
          else if (d.kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === d.id ? { ...t, x: nx, y: ny, w: nw, h: nh } : t) });
          else if (d.kind === "shape") onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === d.id ? { ...s, x: nx, y: ny, w: nw, h: nh } : s) });
          else onStateChange({ ...state, assetElements: assetElements.map(a => a.id === d.id ? { ...a, x: nx, y: ny, w: nw, h: nh } : a) });
        }
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
  }, [isPainting, isMouseDown, activeTool, state, dragRef, rotDragRef, getMainCanvasImage]);

  // Listen for custom color application events from ImageAIPanel
  useEffect(() => {
    const handleApplyColorToShape = (event: CustomEvent) => {
      const color = event.detail;
      applyColorToSelected(color);
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener('applyColorToShape', handleApplyColorToShape as EventListener);
      return () => {
        container.removeEventListener('applyColorToShape', handleApplyColorToShape as EventListener);
      };
    }
  }, [applyColorToSelected]);

  
  // ── Line hit detection ──
  const isPointNearLine = (px: number, py: number, x1: number, y1: number, x2: number, y2: number, threshold: number = 10) => {
    // Calculate distance from point to line segment
    const A = px - x1;
    const B = py - y1;
    const C = x2 - x1;
    const D = y2 - y1;

    const dot = A * C + B * D;
    const lenSq = C * C + D * D;
    let param = -1;
    
    if (lenSq !== 0) {
      param = dot / lenSq;
    }

    let xx, yy;

    if (param < 0) {
      xx = x1;
      yy = y1;
    } else if (param > 1) {
      xx = x2;
      yy = y2;
    } else {
      xx = x1 + param * C;
      yy = y1 + param * D;
    }

    const dx = px - xx;
    const dy = py - yy;
    const distance = Math.sqrt(dx * dx + dy * dy);

    return distance <= threshold;
  };

  // ── Drag start helpers ──
  const startDrag = (kind: "bubble" | "text" | "asset" | "shape", id: string, e: React.MouseEvent, type: "move" | "resize" = "move", handle?: string) => {
    e.stopPropagation();
    const { x, y } = getPos(e);
    const obj = kind === "bubble" ? bubbles.find(b => b.id === id) : 
                  kind === "text" ? textElements.find(t => t.id === id) : 
                  kind === "asset" ? assetElements.find(a => a.id === id) :
                  shapeElements.find(s => s.id === id);
    if (!obj) return;
    
    // For arrows/lines: x,y = head, endX,endY = tail
    // For rectangles/circles: x,y = top-left, w,h = dimensions
    const isArrowOrLine = (obj as any).type === "arrow" || (obj as any).type === "line";
    const w = isArrowOrLine ? ((obj as any).endX ?? (obj as any).w) : ((obj as Bubble).w ?? 100);
    const h = isArrowOrLine ? ((obj as any).endY ?? (obj as any).h) : ((obj as Bubble).h ?? 60);
    
    dragRef.current = { kind, id, type, handle, startX: x, startY: y, origX: obj.x, origY: obj.y, origW: w, origH: h, origRot: obj.rotation ?? 0 };
  };

  const startRotate = (kind: "bubble" | "text" | "asset" | "shape", id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const obj = kind === "bubble" ? bubbles.find(b => b.id === id) : 
                  kind === "text" ? textElements.find(t => t.id === id) : 
                  kind === "asset" ? assetElements.find(a => a.id === id) :
                  shapeElements.find(s => s.id === id);
    if (!obj) return;
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    // For shapes, calculate center differently based on type
    let w, h, cx, cy;
    if (kind === "shape") {
      const shape = obj as ShapeElement;
      if (shape.type === "arrow" || shape.type === "line") {
        // For arrows/lines, use the midpoint between head and tail
        const startX = shape.x;
        const startY = shape.y;
        const endX = shape.endX ?? shape.w;
        const endY = shape.endY ?? shape.h;
        cx = rect.left + (startX + endX) / 2;
        cy = rect.top + (startY + endY) / 2;
        w = Math.abs(endX - startX);
        h = Math.abs(endY - startY);
      } else {
        // For rectangles/circles, use normal center calculation
        w = shape.w ?? 100;
        h = shape.h ?? 100;
        cx = rect.left + shape.x + w / 2;
        cy = rect.top + shape.y + h / 2;
      }
    } else {
      // For bubbles, text, and assets
      w = (obj as Bubble).w ?? 100;
      h = (obj as Bubble).h ?? 60;
      cx = rect.left + obj.x + w / 2;
      cy = rect.top + obj.y + h / 2;
    }
    
    const startAngle = Math.atan2(e.clientY - cy, e.clientX - cx) * (180 / Math.PI);
    rotDragRef.current = { kind, id, startAngle, centerX: cx, centerY: cy, origRot: obj.rotation ?? 0 };
  };

  // ── Layering helpers ──
  const getAllZOrdered = () => [
    ...bubbles.filter(b => b.panelId === panelId).map(b => ({ kind: "bubble" as const, id: b.id, z: b.zIndex ?? 4 })),
    ...textElements.filter(t => t.panelId === panelId).map(t => ({ kind: "text" as const, id: t.id, z: t.zIndex ?? 3 })),
    ...assetElements.filter(a => a.panelId === panelId).map(a => ({ kind: "asset" as const, id: a.id, z: a.zIndex ?? 2 })),
    ...shapeElements.filter(s => s.panelId === panelId).map(s => ({ kind: "shape" as const, id: s.id, z: s.zIndex ?? 1 })),
  ].sort((a, b) => a.z - b.z);

  const setZIndex = (kind: "bubble" | "text" | "asset" | "shape", id: string, z: number) => {
    if (kind === "bubble") onStateChange({ ...state, bubbles: bubbles.map(b => b.id === id ? { ...b, zIndex: z } : b) });
    else if (kind === "text") onStateChange({ ...state, textElements: textElements.map(t => t.id === id ? { ...t, zIndex: z } : t) });
    else if (kind === "asset") onStateChange({ ...state, assetElements: assetElements.map(a => a.id === id ? { ...a, zIndex: z } : a) });
    else if (kind === "shape") onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === id ? { ...s, zIndex: z } : s) });
  };

  const bringForward = (kind: "bubble" | "text" | "asset" | "shape", id: string) => {
    const items = getAllZOrdered();
    const idx = items.findIndex(i => i.id === id);
    if (idx < 0 || idx >= items.length - 1) return;
    const above = items[idx + 1];
    setZIndex(kind, id, above.z + 1);
  };
  const bringToFront = (kind: "bubble" | "text" | "asset" | "shape", id: string) => {
    const items = getAllZOrdered();
    const maxZ = items.reduce((m, i) => Math.max(m, i.z), 0);
    setZIndex(kind, id, maxZ + 1);
  };
  const sendBackward = (kind: "bubble" | "text" | "asset" | "shape", id: string) => {
    const items = getAllZOrdered();
    const idx = items.findIndex(i => i.id === id);
    if (idx <= 0) return;
    const below = items[idx - 1];
    setZIndex(kind, id, Math.max(0, below.z - 1));
  };
  const sendToBack = (kind: "bubble" | "text" | "asset" | "shape", id: string) => {
    const items = getAllZOrdered();
    const minZ = items.reduce((m, i) => Math.min(m, i.z), Infinity);
    setZIndex(kind, id, Math.max(0, minZ - 1));
  };

  const openCtxMenu = (e: React.MouseEvent, kind: "bubble" | "text" | "asset" | "shape", id: string) => {
    e.preventDefault(); e.stopPropagation();
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return;
    setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, kind, id });
  };

  // ── Delete / Duplicate / Flip / Rotate ──
  const deleteBubble = (id: string) => { onStateChange({ ...state, bubbles: bubbles.filter(b => b.id !== id) }); setSelection(null, null, null); setEditingBubbleId(null); };
  const deleteText   = (id: string) => { onStateChange({ ...state, textElements: textElements.filter(t => t.id !== id) }); setSelection(null, null, null); setEditingTextId(null); };
  const deleteAsset  = (id: string) => { onStateChange({ ...state, assetElements: assetElements.filter(a => a.id !== id) }); setSelection(null, null, null); };
  const deleteShape  = (id: string) => { onStateChange({ ...state, shapeElements: shapeElements.filter(s => s.id !== id) }); setSelection(null, null, null); };

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
    } else if (selectedShapeId) {
      const s = shapeElements.find(x => x.id === selectedShapeId);
      if (s) setCopiedObject({ type: "shape", data: s });
    }
  }, [selectedBubbleId, selectedTextId, selectedAssetId, selectedShapeId, bubbles, textElements, assetElements, shapeElements]);

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
    } else if (copiedObject.type === "shape") {
      const ns = { ...copiedObject.data, id: makeId(), x: cx - 50, y: cy - 50 };
      onStateChange({ ...state, shapeElements: [...shapeElements, ns] });
      setSelection(null, null, null, ns.id);
    }
  }, [copiedObject, state, bubbles, textElements, assetElements, shapeElements, containerSize]);

  
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
  const duplicateShape = (id: string) => {
    const s = shapeElements.find(x => x.id === id); if (!s) return;
    const ns = { ...s, id: makeId(), x: s.x + 20, y: s.y + 20 };
    onStateChange({ ...state, shapeElements: [...shapeElements, ns] });
    setSelection(null, null, null, ns.id);
  };

  const patchBubble = (id: string, patch: Partial<Bubble>) =>
    onStateChange({ ...state, bubbles: bubbles.map(b => b.id === id ? { ...b, ...patch } : b) });

  const patchText = (id: string, patch: Partial<TextElement>) =>
    onStateChange({ ...state, textElements: textElements.map(t => t.id === id ? { ...t, ...patch } : t) });

  const patchAsset = (id: string, patch: Partial<AssetElement>) =>
    onStateChange({ ...state, assetElements: assetElements.map(a => a.id === id ? { ...a, ...patch } : a) });

  const patchShape = (id: string, patch: Partial<ShapeElement>) =>
    onStateChange({ ...state, shapeElements: shapeElements.map(s => s.id === id ? { ...s, ...patch } : s) });

  // Keyboard shortcuts (copy/paste/delete/navigation)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      // Don't intercept when typing in contentEditable elements (e.g. prompt textarea)
      if (e.target instanceof HTMLElement && e.target.isContentEditable) return;
      
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
      else if (e.key === "Delete") {
        e.preventDefault();
        if (selectedBubbleId) deleteBubble(selectedBubbleId);
        else if (selectedTextId) deleteText(selectedTextId);
        else if (selectedAssetId) deleteAsset(selectedAssetId);
        else if (selectedShapeId) deleteShape(selectedShapeId);
      }
      // Tab navigation
      else if (e.key === "Tab") {
        e.preventDefault();
        const allObjects = [...panelBubbles, ...panelTexts, ...panelAssets, ...panelShapes];
        if (allObjects.length === 0) return;
        
        let currentIndex = -1;
        if (selectedBubbleId) currentIndex = allObjects.findIndex(obj => obj.id === selectedBubbleId);
        else if (selectedTextId) currentIndex = allObjects.findIndex(obj => obj.id === selectedTextId);
        else if (selectedAssetId) currentIndex = allObjects.findIndex(obj => obj.id === selectedAssetId);
        else if (selectedShapeId) currentIndex = allObjects.findIndex(obj => obj.id === selectedShapeId);
        
        const nextIndex = e.shiftKey 
          ? (currentIndex - 1 + allObjects.length) % allObjects.length
          : (currentIndex + 1) % allObjects.length;
        
        const nextObj = allObjects[nextIndex];
        if (panelBubbles.find(b => b.id === nextObj.id)) {
          setSelection(nextObj.id, null, null);
        } else if (panelTexts.find(t => t.id === nextObj.id)) {
          setSelection(null, nextObj.id, null);
        } else if (panelAssets.find(a => a.id === nextObj.id)) {
          setSelection(null, null, nextObj.id);
        } else if (panelShapes.find(s => s.id === nextObj.id)) {
          setSelection(null, null, null, nextObj.id);
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedBubbleId, selectedTextId, selectedAssetId, selectedShapeId, copiedObject, panelBubbles, panelTexts, panelAssets, panelShapes]);

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

  const cursor = activeTool === "inpaint" ? (isEraser ? "cell" : "crosshair") : activeTool === "move" ? "grab" : "default";
  const arMap: Record<string, number> = { "16:9": 16/9, "9:16": 9/16, "1:1": 1 };
  const ar = aspectRatio ? (arMap[aspectRatio] ?? null) : null;

  // Compute exact pixel box that fits inside outer container preserving aspect ratio
  // Responsive padding: smaller on mobile, larger on desktop
  const isMobile = outerSize.w < 640;
  const SIDE_PAD = isMobile ? 16 : 60;
  const TOP_PAD = isMobile ? 8 : 10;
  const BOTTOM_PAD = isMobile ? 8 : 20;
  const BOTTOM_EXTRA = isMobile ? 60 : 80; // space for bottom panel
  let canvasStyle: React.CSSProperties = { width: "100%", height: "100%" };
  if (ar && outerSize.w > 0 && outerSize.h > 0) {
    const maxW = outerSize.w - SIDE_PAD * 2;
    const maxH = outerSize.h - TOP_PAD - BOTTOM_PAD - BOTTOM_EXTRA;
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
    <div ref={outerRef} className="relative w-full h-full flex items-start justify-center bg-(--bg-primary) overflow-hidden pt-2 sm:pt-5">
      <div ref={containerRef} className="relative bg-(--bg-primary)" data-canvas-editor="true"
        style={{ ...canvasStyle, cursor }}
        onMouseDown={handleMouseDown}
        onClick={e => { 
          if (e.target === containerRef.current) { 
            setSelection(null, null, null);
            
            // Create text when text tool is active
            if (activeTool === "text") {
              const rect = containerRef.current?.getBoundingClientRect();
              if (rect) {
                const x = e.clientX - rect.left;
                const y = e.clientY - rect.top;
                const textId = makeId();
                
                onStateChange({
                  ...state,
                  textElements: [...state.textElements, {
                    id: textId,
                    panelId: panelId,
                    x: x - 100,
                    y: y - 15,
                    w: 200,
                    h: 30,
                    text: "Double click to edit",
                    fontSize: 16,
                    fontWeight: "normal",
                    fontStyle: "normal",
                    fontFamily: "Noto Sans SC",
                    color: "#000000",
                    backgroundColor: "transparent",
                    zIndex: 3
                  }]
                });
                setSelection(null, textId, null);
                
                // Auto-select canvas-objects tool after text creation
                onToolSelect?.("canvas-objects");
              }
            }
          }
          setCtxMenu(null);
        }}
        onContextMenu={e => { if (e.target === containerRef.current) { e.preventDefault(); e.stopPropagation(); const rect = containerRef.current?.getBoundingClientRect(); if (!rect) return; setCtxMenu({ x: e.clientX - rect.left, y: e.clientY - rect.top, kind: "canvas" }); } }}
      >
        {imageUrl
          ? <img // eslint-disable-line @next/next/no-img-element
              key={imageUrl}
              src={imageUrl}
              alt=""
              data-canvas-base-image="true"
              className="absolute pointer-events-none"
              style={{ left: 0, top: 0, transformOrigin: 'top left', maxWidth: 'none', maxHeight: 'none' }}
              onLoad={(e) => {
                const img = e.currentTarget;
                const container = containerRef.current;
                if (!container) return;
                const cW = container.offsetWidth;
                const cH = container.offsetHeight;
                if (!cW || !cH || !img.naturalWidth || !img.naturalHeight) return;
                const baseScale = Math.min(cW / img.naturalWidth, cH / img.naturalHeight);
                const zoomScale = baseScale * (zoomLevel / 100);
                const tx = (cW - img.naturalWidth * zoomScale) / 2;
                const ty = (cH - img.naturalHeight * zoomScale) / 2;
                img.style.transform = `translate(${tx}px, ${ty}px) scale(${zoomScale})`;
                onImageLoad?.(baseScale);
                // Notify parent that image loaded (parent decides whether to set as original)
                if (imageUrl) {
                  onSetOriginalImage?.(imageUrl);
                }
              }}
            />
          : <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 text-gray-700 pointer-events-none select-none">
              <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
              <span className="text-sm">No image — upload one to start</span>
            </div>
        }
        {/* Mask Canvas */}
        {state.mask.length > 0 && <MaskCanvas mask={state.mask} opacity={maskOpacity} width={containerSize.w} height={containerSize.h} showMask={showMask} />}
        {canvasTool === "rectInpaint" && rectangle && rectangleVisible && (
          <>
            <RectangleCanvas 
              rectangle={rectangle} 
              width={containerSize.w} 
              height={containerSize.h}
              color={isSquareMode ? "purple" : "cyan"}
              aspectRatio={aspectRatio || "1:1"}
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
          </>
        )}
        {canvasTool === "crop" && rectangle && rectangleVisible && (
          <RectangleCanvas 
            rectangle={rectangle} 
            width={containerSize.w} 
            height={containerSize.h}
            color="orange"
            aspectRatio={aspectRatio || "1:1"}
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
        {canvasTool === "crop" && rectangle && onCropClick && (() => {
          // Calculate safe position for crop button within canvas bounds
          const buttonWidth = 80;
          const buttonHeight = 30;
          const padding = 10;
          
          // Position button inside rectangle at top-right corner with 10px padding
          let buttonLeft = rectangle.x + rectangle.width - 70; // 60px button width + 10px padding
          let buttonTop = rectangle.y + 10; // 10px padding from top
          
          // Get container bounds
          const containerWidth = outerRef.current?.clientWidth || 800;
          const containerHeight = outerRef.current?.clientHeight || 600;
          
          // Adjust if button would go outside right edge
          if (buttonLeft + buttonWidth > containerWidth - padding) {
            buttonLeft = containerWidth - buttonWidth - padding;
          }
          
          // Adjust if button would go outside bottom edge
          if (buttonTop + buttonHeight > containerHeight - padding) {
            buttonTop = containerHeight - buttonHeight - padding;
          }
          
          // Ensure button doesn't go outside left/top edges
          buttonLeft = Math.max(padding, buttonLeft);
          buttonTop = Math.max(padding, buttonTop);
          
          return (
            <button
              onMouseDown={e => e.stopPropagation()}
              onClick={(e) => { e.stopPropagation(); onCropClick(); }}
              className="absolute px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-sm font-bold shadow-xl transition-all hover:scale-105 border-2 border-orange-400"
              style={{ 
                left: `${buttonLeft}px`, 
                top: `${buttonTop}px`, 
                zIndex: 9999,
                minWidth: '60px'
              }}
            >
              Crop
            </button>
          );
        })()}

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

        {/* Shapes */}
        {panelShapes.map((s) => {
          const isSel = selectedShapeId === s.id;
          const isLineOrArrow = s.type === "arrow" || s.type === "line";
          
          // Calculate proper bounding box for arrows/lines
          let containerWidth = s.w;
          let containerHeight = s.h;
          let containerLeft = s.x;
          let containerTop = s.y;
          let svgOffsetX = 0;
          let svgOffsetY = 0;
          
          if (isLineOrArrow) {
            // For arrows/lines: head at (x,y), tail at (endX,endY)
            const startX = s.x;
            const startY = s.y;
            const endX = s.endX ?? s.w;
            const endY = s.endY ?? s.h;
            
            // Calculate bounding box that contains the entire line/arrow
            const minX = Math.min(startX, endX);
            const maxX = Math.max(startX, endX);
            const minY = Math.min(startY, endY);
            const maxY = Math.max(startY, endY);
            
            // Add padding for arrow head and stroke width
            const padding = 20;
            containerWidth = maxX - minX + padding * 2;
            containerHeight = maxY - minY + padding * 2;
            containerLeft = minX - padding;
            containerTop = minY - padding;
            
            // Adjust SVG coordinates to fit in the container
            svgOffsetX = padding - minX;
            svgOffsetY = padding - minY;
          }
          
          return (
            <div key={s.id} className={`absolute ${dragRef.current?.id === s.id ? "transition-none" : "transition-all duration-200"} ${isSel ? "drop-shadow-[0_0_12px_rgba(59,130,246,0.6)]" : ""}`} style={{ 
              left: containerLeft, 
              top: containerTop, 
              width: containerWidth, 
              height: containerHeight, 
              zIndex: s.zIndex??2,
              pointerEvents: 'auto',
              paddingRight: isSel ? '50px' : '0px', // Add padding for rotation handle when selected
              transform: `rotate(${s.rotation??0}deg) scaleX(${s.flipX?-1:1}) scaleY(${s.flipY?-1:1})`,
              transformOrigin: "center",
              cursor: isSel ? "move" : "pointer",
              overflow: "visible",
              mixBlendMode: (dragRef.current?.id === s.id ? 'source-over' : 'normal') as any,
              isolation: 'isolate',
              willChange: dragRef.current?.id === s.id ? 'transform' : 'auto'
            }}
              onMouseDown={e => {
                e.stopPropagation();
                
                // For arrows/lines, only allow selection/dragging if click is near the actual line
                if (isLineOrArrow) {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const isNearLine = isPointNearLine(
                      mouseX, mouseY,
                      s.x, s.y,
                      s.endX ?? s.w, s.endY ?? s.h,
                      10 // 10px threshold
                    );
                    
                    if (!isNearLine) {
                      return; // Don't select/drag if not near the line
                    }
                  }
                }
                
                setSelection(null, null, null, s.id);
                startDrag("shape", s.id, e);
              }}
              onClick={e => { e.stopPropagation(); }}
              onContextMenu={e => { 
                e.stopPropagation();
                
                // For arrows/lines, only allow context menu if click is near the actual line
                if (isLineOrArrow) {
                  const rect = containerRef.current?.getBoundingClientRect();
                  if (rect) {
                    const mouseX = e.clientX - rect.left;
                    const mouseY = e.clientY - rect.top;
                    const isNearLine = isPointNearLine(
                      mouseX, mouseY,
                      s.x, s.y,
                      s.endX ?? s.w, s.endY ?? s.h,
                      10 // 10px threshold
                    );
                    
                    if (!isNearLine) {
                      return; // Don't show context menu if not near the line
                    }
                  }
                }
                
                setSelection(null, null, null, s.id); 
                openCtxMenu(e, "shape", s.id); 
              }}
            >
              <svg width={containerWidth} height={containerHeight} style={{ overflow: "visible" }}>
                <defs>
                  <marker id={`arrow-${s.id}`} viewBox="0 -5 10 10" refX="5" refY="0" markerWidth="4" markerHeight="4" orient="auto">
                    <path d="M0,-5L10,0L0,5" fill={s.strokeColor} />
                  </marker>
                </defs>
                {s.type === "arrow" && (
                  <line
                    x1={s.x - containerLeft}
                    y1={s.y - containerTop}
                    x2={(s.endX ?? s.w) - containerLeft}
                    y2={(s.endY ?? s.h) - containerTop}
                    stroke={s.strokeColor}
                    strokeWidth={s.strokeWidth}
                    fill="none"
                    markerEnd={`url(#arrow-${s.id})`}
                  />
                )}
                {s.type === "line" && (
                  <>
                    <line
                      x1={s.x - containerLeft}
                      y1={s.y - containerTop}
                      x2={(s.endX ?? s.w) - containerLeft}
                      y2={(s.endY ?? s.h) - containerTop}
                      stroke={s.strokeColor}
                      strokeWidth={s.strokeWidth}
                      fill="none"
                    />
                  </>
                )}
                {s.type === "rectangle" && (
                  <rect
                    x={0}
                    y={0}
                    width={s.w}
                    height={s.h}
                    stroke={s.strokeColor}
                    strokeWidth={s.strokeWidth}
                    fill={s.fillColor || "transparent"}
                  />
                )}
                {s.type === "circle" && (
                  <ellipse
                    cx={s.w/2}
                    cy={s.h/2}
                    rx={s.w/2}
                    ry={s.h/2}
                    stroke={s.strokeColor}
                    strokeWidth={s.strokeWidth}
                    fill={s.fillColor || "transparent"}
                  />
                )}
              </svg>
              
              {/* Selection UI - Custom for line/arrow vs rectangle/circle */}
              {isSel && (
                <>
                  {isLineOrArrow ? (
                    /* Endpoint handles for arrow and line - positioned relative to container */
                    <>
                      {/* Head point (x, y) - positioned relative to container */}
                      <div
                        className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-pointer hover:scale-125 transition-transform z-10"
                        style={{ left: s.x - containerLeft - 8, top: s.y - containerTop - 8 }}
                        onMouseDown={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          startDrag("shape", s.id, e, "resize", "start");
                        }}
                      />
                      {/* Tail point (endX, endY) - positioned relative to container */}
                      <div
                        className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full cursor-pointer hover:scale-125 transition-transform z-10"
                        style={{ left: (s.endX ?? s.w) - containerLeft - 8, top: (s.endY ?? s.h) - containerTop - 8 }}
                        onMouseDown={e => {
                          e.stopPropagation();
                          e.preventDefault();
                          startDrag("shape", s.id, e, "resize", "end");
                        }}
                      />
                    </>
                  ) : (
                    /* Corner resize handles for rectangle and circle */
                    <ResizeHandles 
                      isSelected={isSel} 
                      accentColor="blue" 
                      rotation={s.rotation} 
                      onResizeStart={(h,e)=>startDrag("shape",s.id,e,"resize",h)} 
                      onRotateStart={e=>startRotate("shape",s.id,e)} 
                    />
                  )}
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
            const fillColor = b.flippedColors ? "#1a1a2e" : ((b.bubbleType as string) === "whisper" ? "rgba(240,240,255,0.85)" : "rgba(255,255,255,0.97)");
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
                    fontFamily: "'Noto Sans SC', 'Comic Sans MS', 'Bangers', 'Segoe UI', sans-serif",
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
              onClick={e => e.stopPropagation()}
              onMouseUp={e => e.stopPropagation()}
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
                        x: ctxMenu.x - 100,
                        y: ctxMenu.y - 15,
                        w: 200,
                        h: 30,
                        text: "New Text",
                        fontSize: 16,
                        fontWeight: "normal",
                        fontStyle: "normal",
                        fontFamily: "Noto Sans SC",
                        color: "#000000",
                        backgroundColor: "transparent",
                        zIndex: 3
                      }]
                    });
                    setSelection(null, textId, null);
                    
                    // Auto-select canvas-objects tool after text creation
                    onToolSelect?.("canvas-objects");
                    
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
                
                <button
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-white/8 text-gray-200 hover:text-white transition-colors group"
                  onClick={() => {
                    // Create a file input element
                    const fileInput = document.createElement('input');
                    fileInput.type = 'file';
                    fileInput.accept = 'image/*';
                    fileInput.style.display = 'none';
                    
                    fileInput.onchange = (e) => {
                      const file = (e.target as HTMLInputElement).files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const imageUrl = event.target?.result as string;
                          const assetId = makeId();
                          const elementId = makeId();
                          
                          // Create new asset library item and element
                          onStateChange({
                            ...state,
                            assetLibrary: [...state.assetLibrary, {
                              id: assetId,
                              url: imageUrl,
                              name: file.name
                            }],
                            assetElements: [...state.assetElements, {
                              id: elementId,
                              panelId: panelId,
                              assetId: assetId,
                              x: ctxMenu.x - 75,
                              y: ctxMenu.y - 75,
                              w: 150,
                              h: 150,
                              rotation: 0,
                              flipX: false,
                              flipY: false,
                              zIndex: 2
                            }]
                          });
                          
                          setSelection(null, null, elementId);
                        };
                        reader.readAsDataURL(file);
                      }
                      
                      // Clean up
                      document.body.removeChild(fileInput);
                    };
                    
                    // Add to DOM and trigger click
                    document.body.appendChild(fileInput);
                    fileInput.click();
                    
                    setCtxMenu(null);
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <svg className="w-4 h-4 text-gray-400 group-hover:text-white shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span className="text-[13px] font-medium">Upload Image</span>
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
                </button>
                
                {/* Bubble sub-menu */}
                <div className="pl-8 pr-4 py-2">
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
                
                // All bubbles should show context menu
                const showBubbleMenu = currentBubble;
                
                return [
                { label: "Duplicate",      shortcut: "Ctrl+D",     icon: "M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z", action: (e) => { 
                  e?.stopPropagation();
                  if (ctxMenu.id) {
                    if (ctxMenu.kind === "asset") duplicateAsset(ctxMenu.id);
                    else if (ctxMenu.kind === "text") duplicateText(ctxMenu.id);
                    else if (ctxMenu.kind === "bubble") duplicateBubble(ctxMenu.id);
                    else if (ctxMenu.kind === "shape") duplicateShape(ctxMenu.id);
                  }
                  setCtxMenu(null); 
                } },
                { label: "Reset Position", shortcut: "Ctrl+R",     icon: "M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15", action: (e) => { 
                  e?.stopPropagation();
                  if (ctxMenu.id) {
                    if (ctxMenu.kind === "asset") patchAsset(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
                    else if (ctxMenu.kind === "text") patchText(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
                    else if (ctxMenu.kind === "bubble") patchBubble(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
                    else if (ctxMenu.kind === "shape") patchShape(ctxMenu.id, { rotation: 0, flipX: false, flipY: false });
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
                    } else if (ctxMenu.kind === "shape") {
                      const shape = shapeElements.find(s => s.id === ctxMenu.id);
                      if (shape) patchShape(ctxMenu.id, { flipX: !shape.flipX });
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
                    } else if (ctxMenu.kind === "shape") {
                      const shape = shapeElements.find(s => s.id === ctxMenu.id);
                      if (shape) patchShape(ctxMenu.id, { flipY: !shape.flipY });
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
                        "Tail Direction", "Hide/Show Tail", "Flip Colors", "Change Type", "Layer"
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
                  { label: currentBubble?.tailMode === "none" ? "Show Tail" : "Hide Tail", shortcut: "", icon: "M15 12a3 3 0 11-6 0 3 3 0 016 0z", action: (e) => {
                      e?.stopPropagation();
                      if (ctxMenu.id && currentBubble) {
                        const newTailMode = currentBubble.tailMode === "none" ? "auto" : "none";
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
                  { label: "Change Type", shortcut: "", icon: "M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id && currentBubble) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
                      const contextMenuItems = [
                        "Duplicate", "Reset Position", "Flip Horizontal", "Flip Vertical",
                        "Tail Direction", "Hide/Show Tail", "Flip Colors", "Change Type", "Text Properties", "Layer"
                      ];
                      
                      // Find the index of "Change Type" in the menu
                      const changeTypeIndex = contextMenuItems.indexOf("Change Type");
                      
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
                      
                      // Set submenu context
                      setCtxMenu({
                        ...ctxMenu,
                        submenu: 'bubbleType',
                        parentX: adjustedX,
                        parentY: adjustedY + (changeTypeIndex * menuItemHeight),
                        menuItemIndex: changeTypeIndex,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
                  { label: "Text Properties", shortcut: "", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2h2.828l-2.828-2.828z", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id && currentBubble) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
                      const contextMenuItems = [
                        "Duplicate", "Reset Position", "Flip Horizontal", "Flip Vertical",
                        "Tail Direction", "Hide/Show Tail", "Flip Colors", "Change Type", "Text Properties", "Layer"
                      ];
                      
                      // Find the index of "Text Properties" in the menu
                      const textPropsIndex = contextMenuItems.indexOf("Text Properties");
                      
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
                      
                      // Set submenu context
                      setCtxMenu({
                        ...ctxMenu,
                        submenu: 'textProperties',
                        parentX: adjustedX,
                        parentY: adjustedY + (textPropsIndex * menuItemHeight),
                        menuItemIndex: textPropsIndex,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
                ] : [
                  // Options for bubbles without tails (SFX, Shout)
                  null, // Divider
                  { label: "Flip Colors",     shortcut: "",          icon: "M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id && currentBubble) {
                      patchBubble(ctxMenu.id, { flippedColors: !currentBubble.flippedColors });
                    }
                    setCtxMenu(null);
                  } },
                  { label: "Color", shortcut: "", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
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
                      
                      // Set submenu context
                      setCtxMenu({
                        ...ctxMenu,
                        submenu: 'colorPalette',
                        parentX: adjustedX,
                        parentY: adjustedY + (8 * menuItemHeight), // After the first 8 items
                        menuItemIndex: 8,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
                ]),
                // Text-specific options
                ...(ctxMenu.kind === "text" ? [
                  { label: "Text Properties", shortcut: "", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2h2.828l-2.828-2.828z", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
                      const contextMenuItems = [
                        "Duplicate", "Reset Position", "Flip Horizontal", "Flip Vertical",
                        "Text Properties", "Layer"
                      ];
                      
                      // Find the index of "Text Properties" in the menu
                      const textPropsIndex = contextMenuItems.indexOf("Text Properties");
                      
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
                      
                      // Set submenu context
                      setCtxMenu({
                        ...ctxMenu,
                        submenu: 'textProperties',
                        parentX: adjustedX,
                        parentY: adjustedY + (textPropsIndex * menuItemHeight),
                        menuItemIndex: textPropsIndex,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
                ] : []),
                // Shape-specific options
                ...(ctxMenu.kind === "shape" ? [
                  { label: "Shape Properties", shortcut: "", icon: "M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2h2.828l-2.828-2.828z", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
                      const menuWidth = 400;
                      const menuHeight = 500;
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
                      
                      // Set submenu context
                      setCtxMenu({
                        ...ctxMenu,
                        submenu: 'shapeProperties',
                        parentX: adjustedX,
                        parentY: adjustedY + (3 * menuItemHeight), // After the first 3 items
                        menuItemIndex: 3,
                        menuItemHeight: menuItemHeight
                      });
                    }
                  } },
                ] : []),
                // Asset-specific options
                ...(ctxMenu.kind === "asset" ? [
                  { label: "Color", shortcut: "", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", action: (e) => {
                    e?.stopPropagation();
                    if (ctxMenu.id) {
                      // Calculate menu item position using adjusted coordinates
                      const menuItemHeight = 44;
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
                      
                      // Set submenu context
                      setCtxMenu({
                        ...ctxMenu,
                        submenu: 'colorPalette',
                        parentX: adjustedX,
                        parentY: adjustedY + (5 * menuItemHeight), // After the first 5 items
                        menuItemIndex: 5,
                        menuItemHeight: menuItemHeight
                      });
                    }
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
                        "Tail Direction", "Hide/Show Tail", "Flip Colors", "Change Type", "Layer"
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
                  <button key={`${ctxMenu.kind}-${item.label}-${index}`}
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
                      {(item.label === "Tail Direction" || item.label === "Layer" || item.label === "Change Type") && (
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
        
        {/* Text Properties Dialog */}
        {ctxMenu && ctxMenu.submenu === 'textProperties' && (() => {
          const currentBubble = ctxMenu.kind === "bubble" && ctxMenu.id 
            ? bubbles.find(b => b.id === ctxMenu.id) 
            : null;
          const currentText = ctxMenu.kind === "text" && ctxMenu.id 
            ? textElements.find(t => t.id === ctxMenu.id) 
            : null;
          
          if (!currentBubble && !currentText) return null;
          
          const updBubble = (patch: Record<string, unknown>) => {
            if (ctxMenu.id) {
              onStateChange({ ...state, bubbles: state.bubbles.map(b => b.id === ctxMenu.id ? { ...b, ...patch } : b) });
            }
          };
          
          const updText = (patch: Record<string, unknown>) => {
            if (ctxMenu.id) {
              onStateChange({ ...state, textElements: state.textElements.map(t => t.id === ctxMenu.id ? { ...t, ...patch } : t) });
            }
          };
          
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1003]"
                 onClick={() => setCtxMenu(null)}>
              <div className="bg-[#1a1d23] border border-white/10 rounded-lg shadow-2xl p-6 w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
                   onClick={e => e.stopPropagation()}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">Text Properties</h3>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Edit {currentBubble ? "bubble" : "text"} properties
                      </p>
                    </div>
                    <button 
                      onClick={() => setCtxMenu(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Text Input */}
                  <div>
                    <span className="text-[12px] text-gray-300 block mb-2">Text</span>
                    <textarea 
                      value={currentBubble ? currentBubble.text : currentText?.text || ""} 
                      onChange={e => {
                        if (currentBubble) {
                          updBubble({ text: e.target.value });
                        } else if (currentText) {
                          updText({ text: e.target.value });
                        }
                      }} 
                      className="w-full bg-[#1a1a24] border border-white/10 rounded px-3 py-2 text-[12px] text-white resize-none focus:outline-none focus:border-emerald-500/50"
                      style={{ fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, "Noto Sans", sans-serif, "Apple Color Emoji", "Segoe UI Emoji", "Segoe UI Symbol", "Noto Color Emoji"' }}
                      rows={3} 
                      placeholder="Enter text..."
                    />
                  </div>
                  
                  {/* Bubble-specific properties */}
                  {currentBubble && (
                    <>
                      {/* Font Size - Always Visible */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[12px] text-gray-300">Font Size</span>
                          <span className="text-[12px] text-emerald-300 font-mono">{currentBubble.fontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min={10} 
                          max={44} 
                          value={currentBubble.fontSize} 
                          onChange={e => updBubble({ fontSize: Number(e.target.value) })} 
                          className="w-full accent-emerald-500" 
                        />
                      </div>
                      
                      {/* Auto-fit Font */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-300">Auto-fit font</span>
                        <button 
                          onClick={() => updBubble({ autoFitFont: !currentBubble.autoFitFont })} 
                          className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition ${
                            currentBubble.autoFitFont 
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" 
                              : "bg-white/5 border-white/10 text-gray-300"
                          }`}
                        >
                          {currentBubble.autoFitFont ? "On" : "Off"}
                        </button>
                      </div>
                      
                      {/* Bubble Type */}
                      <div>
                        <span className="text-[12px] text-gray-300 block mb-2">Bubble Type</span>
                        <div className="grid grid-cols-4 gap-2">
                          {(["speech","thought","shout","whisper","rect","rectRound","sfx"] as const).map(type => (
                            <button 
                              key={type} 
                              onClick={() => updBubble({ bubbleType: type })} 
                              className={`py-2 rounded text-[10px] font-semibold border transition ${
                                type===currentBubble.bubbleType
                                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                                  : "bg-[#1a1a24] border-white/10 text-gray-400 hover:bg-white/5"
                              }`}
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Tail Direction (only for non-SFX bubbles) */}
                      {currentBubble.bubbleType !== "sfx" && (
                        <div>
                          <span className="text-[12px] text-gray-300 block mb-2">Tail Direction</span>
                          <div className="grid grid-cols-2 gap-2">
                            {(["bottom-left","bottom-right","left","right"] as const).map(dir => (
                              <button 
                                key={dir} 
                                onClick={() => updBubble({ tailDir: dir })} 
                                className={`py-2 rounded text-[10px] font-semibold border transition ${
                                  currentBubble.tailDir===dir
                                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200"
                                    : "bg-[#1a1a24] border-white/10 text-gray-400 hover:bg-white/5"
                                }`}
                              >
                                {dir === "bottom-left" ? "Bottom Left" : dir === "bottom-right" ? "Bottom Right" : dir === "left" ? "Left" : "Right"}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Flip Colors */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-300">Flip Colors</span>
                        <button 
                          onClick={() => updBubble({ flippedColors: !currentBubble.flippedColors })} 
                          className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition ${
                            currentBubble.flippedColors 
                              ? "bg-blue-500/15 border-blue-500/30 text-blue-200" 
                              : "bg-white/5 border-white/10 text-gray-300"
                          }`}
                        >
                          {currentBubble.flippedColors ? "Flipped" : "Normal"}
                        </button>
                      </div>
                    </>
                  )}
                  
                  {/* Text-specific properties */}
                  {currentText && (
                    <>
                      {/* Font Size */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[12px] text-gray-300">Font Size</span>
                          <span className="text-[12px] text-emerald-300 font-mono">{currentText.fontSize}px</span>
                        </div>
                        <input 
                          type="range" 
                          min={10} 
                          max={44} 
                          value={currentText.fontSize} 
                          onChange={e => updText({ fontSize: Number(e.target.value) })} 
                          className="w-full accent-emerald-500" 
                        />
                      </div>
                      
                      {/* Font Weight */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-300">Font Weight</span>
                        <button 
                          onClick={() => updText({ fontWeight: currentText.fontWeight === "bold" ? "normal" : "bold" })} 
                          className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition ${
                            currentText.fontWeight === "bold"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" 
                              : "bg-white/5 border-white/10 text-gray-300"
                          }`}
                        >
                          {currentText.fontWeight === "bold" ? "Bold" : "Normal"}
                        </button>
                      </div>
                      
                      {/* Font Style */}
                      <div className="flex items-center justify-between">
                        <span className="text-[12px] text-gray-300">Font Style</span>
                        <button 
                          onClick={() => updText({ fontStyle: currentText.fontStyle === "italic" ? "normal" : "italic" })} 
                          className={`px-3 py-1.5 rounded text-[12px] font-semibold border transition ${
                            currentText.fontStyle === "italic"
                              ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" 
                              : "bg-white/5 border-white/10 text-gray-300"
                          }`}
                        >
                          {currentText.fontStyle === "italic" ? "Italic" : "Normal"}
                        </button>
                      </div>
                      
                      {/* Text Color */}
                      <div>
                        <span className="text-[12px] text-gray-300 block mb-2">Text Color</span>
                        <input 
                          type="color" 
                          value={currentText.color || "#000000"} 
                          onChange={e => updText({ color: e.target.value })} 
                          className="w-full h-10 bg-[#1a1a24] border border-white/10 rounded cursor-pointer"
                        />
                      </div>
                      
                      {/* Border Width */}
                      <div>
                        <div className="flex justify-between mb-2">
                          <span className="text-[12px] text-gray-300">Border Width</span>
                          <span className="text-[12px] text-emerald-300 font-mono">{currentText.borderWidth || 0}px</span>
                        </div>
                        <input 
                          type="range" 
                          min={0} 
                          max={10} 
                          value={currentText.borderWidth || 0} 
                          onChange={e => updText({ borderWidth: Number(e.target.value) })} 
                          className="w-full accent-emerald-500" 
                        />
                      </div>
                      
                      {/* Border Color (only when border width > 0) */}
                      {(currentText.borderWidth || 0) > 0 && (
                        <div>
                          <span className="text-[12px] text-gray-300 block mb-2">Border Color</span>
                          <input 
                            type="color" 
                            value={currentText.borderColor || "#000000"} 
                            onChange={e => updText({ borderColor: e.target.value })} 
                            className="w-full h-10 bg-[#1a1a24] border border-white/10 rounded cursor-pointer"
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Shape Properties Dialog */}
        {ctxMenu && ctxMenu.submenu === 'shapeProperties' && (() => {
          const currentShape = ctxMenu.kind === "shape" && ctxMenu.id 
            ? shapeElements.find(s => s.id === ctxMenu.id) 
            : null;
          
          if (!currentShape) return null;
          
          const updShape = (patch: Record<string, unknown>) => {
            if (ctxMenu.id) {
              onStateChange({ ...state, shapeElements: state.shapeElements.map(s => s.id === ctxMenu.id ? { ...s, ...patch } : s) });
            }
          };
          
          return (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[1003]"
                 onClick={() => setCtxMenu(null)}>
              <div className="bg-[#1a1d23] border border-white/10 rounded-lg shadow-2xl p-6 w-[400px] max-w-[90vw] max-h-[80vh] overflow-y-auto"
                   onClick={e => e.stopPropagation()}>
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-white font-bold text-lg">Shape Properties</h3>
                      <p className="text-[12px] text-gray-500 mt-1">
                        Edit {currentShape.type} properties
                      </p>
                    </div>
                    <button 
                      onClick={() => setCtxMenu(null)}
                      className="text-gray-400 hover:text-white transition-colors"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                  
                  {/* Stroke Color */}
                  <div>
                    <span className="text-[12px] text-gray-300 block mb-2">Stroke Color</span>
                    <input 
                      type="color" 
                      value={currentShape.strokeColor || "#000000"} 
                      onChange={e => updShape({ strokeColor: e.target.value })} 
                      className="w-full h-10 bg-[#1a1a24] border border-white/10 rounded cursor-pointer"
                    />
                  </div>
                  
                  {/* Fill Color (for rectangle and circle) */}
                  {(currentShape.type === "rectangle" || currentShape.type === "circle") && (
                    <div>
                      <span className="text-[12px] text-gray-300 block mb-2">Fill Color</span>
                      <div className="flex items-center gap-2 mb-2">
                        <input 
                          type="color" 
                          value={currentShape.fillColor || "#ffffff"} 
                          onChange={e => updShape({ fillColor: e.target.value })} 
                          className="flex-1 h-10 bg-[#1a1a24] border border-white/10 rounded cursor-pointer"
                        />
                        <button 
                          onClick={() => updShape({ fillColor: "transparent" })} 
                          className="px-3 py-2 bg-white/5 border border-white/10 rounded text-[12px] text-gray-300 hover:bg-white/10 transition"
                        >
                          None
                        </button>
                      </div>
                    </div>
                  )}
                  
                  {/* Stroke Width */}
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-[12px] text-gray-300">Stroke Width</span>
                      <span className="text-[12px] text-emerald-300 font-mono">{currentShape.strokeWidth}px</span>
                    </div>
                    <input 
                      type="range" 
                      min={1} 
                      max={20} 
                      value={currentShape.strokeWidth} 
                      onChange={e => updShape({ strokeWidth: Number(e.target.value) })} 
                      className="w-full accent-emerald-500" 
                    />
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        
        {/* Color Palette Submenu */}
        {ctxMenu && ctxMenu.submenu === 'colorPalette' && (() => {
          const currentElement = ctxMenu.id ? (() => {
            if (ctxMenu.kind === "shape") return shapeElements.find(s => s.id === ctxMenu.id);
            if (ctxMenu.kind === "text") return textElements.find(t => t.id === ctxMenu.id);
            if (ctxMenu.kind === "bubble") return bubbles.find(b => b.id === ctxMenu.id);
            if (ctxMenu.kind === "asset") return assetElements.find(a => a.id === ctxMenu.id);
            return null;
          })() : null;
          
          if (!currentElement) return null;
          
          const colors = [
            "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
            "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB", "#A52A2A",
            "#808080", "#C0C0C0", "#FFD700", "#32CD32", "#87CEEB", "#FF69B4"
          ];
          
          const applyColor = (color: string) => {
            if (ctxMenu.id) {
              if (ctxMenu.kind === "shape") {
                const shape = currentElement as any;
                patchShape(ctxMenu.id, { strokeColor: color });
              } else if (ctxMenu.kind === "text") {
                const text = currentElement as any;
                patchText(ctxMenu.id, { color: color });
              } else if (ctxMenu.kind === "bubble") {
                const bubble = currentElement as any;
                patchBubble(ctxMenu.id, { textColor: color } as any);
              } else if (ctxMenu.kind === "asset") {
                const asset = currentElement as any;
                patchAsset(ctxMenu.id, { tintColor: color } as any);
              }
            }
            setCtxMenu(null);
          };
          
          return (
            <div className="absolute z-[1002] bg-[#1a1a24] border border-white/15 rounded-xl shadow-2xl p-3 w-[200px]"
                 style={{ left: ctxMenu.parentX, top: ctxMenu.parentY }}
                 onMouseDown={e => e.stopPropagation()}>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => applyColor(color)}
                    className="w-7 h-7 rounded border border-white/20 hover:border-white/60 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <input
                  type="color"
                  onChange={(e) => applyColor(e.target.value)}
                  className="w-full h-8 bg-transparent border border-white/20 rounded cursor-pointer"
                  title="Custom color"
                />
              </div>
            </div>
          );
        })()}

        {/* Submenu rendering */}
        {ctxMenu && ctxMenu.submenu && ctxMenu.submenu !== 'textProperties' && ctxMenu.submenu !== 'shapeProperties' && ctxMenu.submenu !== 'colorPalette' && (() => {
          const submenuItems = ctxMenu.submenu === 'tailDirection' ? [
            { label: "← Tail Left", icon: "M15 19l-7-7 7-7", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "left" as any }); setCtxMenu(null); } },
            { label: "→ Tail Right", icon: "M9 5l7 7-7 7", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "right" as any }); setCtxMenu(null); } },
            { label: "↙ Tail Bottom Left", icon: "M7 16l-4-4 4-4", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "bottom-left" as any }); setCtxMenu(null); } },
            { label: "↘ Tail Bottom Right", icon: "M17 8l4 4-4 4", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { tailDir: "bottom-right" as any }); setCtxMenu(null); } },
          ] : ctxMenu.submenu === 'layer' ? [
            { label: "↑ Bring Forward", icon: "M12 5l7 7-7 7M5 5l7 7-7 7", action: () => { if (ctxMenu.id && ctxMenu.kind !== "canvas") { bringForward(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
            { label: "⇈ Bring to Front", icon: "M5 3h14M12 7l7 7-7 7M5 7l7 7-7 7", action: () => { if (ctxMenu.id && ctxMenu.kind !== "canvas") { bringToFront(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
            { label: "↓ Send Backward", icon: "M12 19l-7-7 7-7M19 19l-7-7 7-7", action: () => { if (ctxMenu.id && ctxMenu.kind !== "canvas") { sendBackward(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
            { label: "⇊ Send to Back", icon: "M19 21H5M12 17l-7-7 7-7M19 17l-7-7 7-7", action: () => { if (ctxMenu.id && ctxMenu.kind !== "canvas") { sendToBack(ctxMenu.kind, ctxMenu.id); } setCtxMenu(null); } },
          ] : ctxMenu.submenu === 'bubbleType' ? [
            { label: "Speech", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "speech" as any }); setCtxMenu(null); } },
            { label: "Speech (Rough)", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "speechRough" as any }); setCtxMenu(null); } },
            { label: "Thought", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "thought" as any }); setCtxMenu(null); } },
            { label: "Shout", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "shout" as any }); setCtxMenu(null); } },
            { label: "Whisper", icon: "M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "whisper" as any }); setCtxMenu(null); } },
            { label: "Rectangle", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "rect" as any }); setCtxMenu(null); } },
            { label: "Rectangle (Round)", icon: "M4 5a1 1 0 011-1h14a1 1 0 011 1v14a1 1 0 01-1 1H5a1 1 0 01-1-1V5z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "rectRound" as any }); setCtxMenu(null); } },
            { label: "SFX", icon: "M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z", action: () => { if (ctxMenu.id) patchBubble(ctxMenu.id, { bubbleType: "sfx" as any }); setCtxMenu(null); } },
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
        
        {/* Color Palette Submenu for Toolbar Color Selection */}
        {showColorPalette && (() => {
          const colors = [
            "#000000", "#FFFFFF", "#FF0000", "#00FF00", "#0000FF", "#FFFF00", 
            "#FF00FF", "#00FFFF", "#FFA500", "#800080", "#FFC0CB", "#A52A2A",
            "#808080", "#C0C0C0", "#FFD700", "#32CD32", "#87CEEB", "#FF69B4"
          ];
          
          return (
            <div 
              className="absolute z-[9999] bg-[#1a1a24] border border-white/15 rounded-xl shadow-2xl p-3 w-[200px]"
              style={{ left: colorPalettePosition.x, top: colorPalettePosition.y }}
              onMouseDown={e => e.stopPropagation()}
            >
              <div className="text-white text-xs font-medium mb-2">Select Color</div>
              <div className="grid grid-cols-6 gap-1">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => applyColorToSelected(color)}
                    className="w-7 h-7 rounded border border-white/20 hover:border-white/60 transition-colors"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
              <div className="mt-2 pt-2 border-t border-white/10">
                <input
                  type="color"
                  onChange={(e) => applyColorToSelected(e.target.value)}
                  className="w-full h-8 bg-transparent border border-white/20 rounded cursor-pointer"
                  title="Custom color"
                />
              </div>
              <button
                onClick={() => setShowColorPalette(false)}
                className="mt-2 w-full py-1 bg-white/10 hover:bg-white/20 rounded text-xs text-white transition-colors"
              >
                Cancel
              </button>
            </div>
          );
        })()}
      </div>
    </div>
  );
}
