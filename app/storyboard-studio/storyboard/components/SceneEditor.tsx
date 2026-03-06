"use client";

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import {
  ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Plus, X, Send, MoreHorizontal, Square, MessageSquare, Eye, EyeOff, Trash2, Paintbrush, Eraser, Upload,
  Pencil, ZoomIn, ZoomOut, Play, Tag, Type, RotateCcw, RotateCw, Sparkles, List, Mic, Check, Image, Clock,
} from "lucide-react";
import UseCaseInfoModal from "./UseCaseInfoModal";
import { CanvasArea } from "./CanvasArea";
import type { Shot, CommentItem, Tag as TagType } from "../types";
import { TAG_COLORS } from "../constants";
import {
  CanvasEditor, emptyCanvasState, undoMask, redoMask,
  type CanvasEditorState, type CanvasActiveTool, type CanvasSelection,
} from "../../shared/CanvasEditor";
import { makeId, bubbleEllipse, cloudPath, tailPath, rectTailPath, rectOutlinePathWithGap, burstPoints, roughEllipsePath, estimateFontSize } from "../../shared/canvas-helpers";
import type { BubbleType, TailDir, FontFamily } from "../../shared/canvas-types";
import { AIGenerationModal } from "../../components/modals/AIGenerationModal";
import { ImageAIPanel, type AIEditMode } from "./ImageAIPanel";
import { VideoAIPanel, type VideoEditMode } from "./VideoAIPanel";
import { Video, Image as ImageIcon } from "lucide-react";

type CanvasTool = CanvasActiveTool;

interface SceneEditorProps {
  shots: Shot[];
  initialShotId: string;
  onClose: () => void;
  onShotsChange: (shots: Shot[]) => void;
}

export function SceneEditor({ shots, initialShotId, onClose, onShotsChange }: SceneEditorProps) {
  const [activeShotId, setActiveShotId] = useState(initialShotId);
  const [commentText, setCommentText] = useState("");
  const [editingField, setEditingField] = useState<"voice" | "notes" | "action" | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");
  const [zoom, setZoom] = useState(53);
  const [refImages, setRefImages] = useState<string[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [isInpainting, setIsInpainting] = useState(false);
  const [inpaintError, setInpaintError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [showImageAIPanel, setShowImageAIPanel] = useState(true);
  const [activeAIPanel, setActiveAIPanel] = useState<'image' | 'video'>('image');
  const [inpaintModel, setInpaintModel] = useState<"nano-banana" | "flux-kontext-pro" | "openai-4o" | "grok" | "qwen-z-image" | "ideogram" | "character-edit" | "character-remix">("character-edit");
  const [showBrushModelDropdown, setShowBrushModelDropdown] = useState(false);
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showBubbleStyleModal, setShowBubbleStyleModal] = useState(false);
  const [selectedBubbleStyle, setSelectedBubbleStyle] = useState<"realistic" | "cartoon" | "manga" | "custom">("manga");
  const [zoomLevel, setZoomLevel] = useState(100);
  const fitScaleRef = useRef(1); // actual CSS scale that corresponds to display 100%
  const [originalCanvasSize, setOriginalCanvasSize] = useState({ width: 0, height: 0 });
  
  // Image tab independent state
  const [imageReferenceImages, setImageReferenceImages] = useState<string[]>([]);
  const [imageInpaintPrompt, setImageInpaintPrompt] = useState("");
  const [imageUseCase, setImageUseCase] = useState<string>("image-composition");
  const [imageInpaintModel, setImageInpaintModel] = useState<"nano-banana" | "nano-banana-2" | "nano-banana-edit" | "nano-banana-pro" | "flux-kontext-pro" | "flux-fill" | "openai-4o" | "gpt-image" | "grok" | "grok-text" | "qwen-z-image" | "qwen" | "qwen-text" | "seedream-5.0-lite" | "seedream-5.0-lite-text" | "seedream-5.0-lite-image" | "seedream-4.5" | "seedream-v4" | "flux-2-flex-image-to-image" | "flux-2-flex-text-to-image" | "flux-2-pro-image-to-image" | "flux-2-pro-text-to-image" | "ideogram-reframe" | "character-remix" | "topaz-upscale">("nano-banana-edit");
  const [imageRectangle, setImageRectangle] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [imageIsRectangleVisible, setImageIsRectangleVisible] = useState(true);
  const [imageIsInpainting, setImageIsInpainting] = useState(false);
  const [imageInpaintError, setImageInpaintError] = useState<string | null>(null);
  const [imageGeneratedImages, setImageGeneratedImages] = useState<string[]>([]);
  
  // Rectangle state
  const [rectangle, setRectangle] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isSquareMode, setIsSquareMode] = useState(false); // Track if Add Square mode is active
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("1:1"); // Track selected aspect ratio - default to 1:1
  const [rectangleMaskAspectRatio, setRectangleMaskAspectRatio] = useState("1:1"); // Track rectangle mask aspect ratio - independent from canvas
  
  // Debug: Log rectangleMaskAspectRatio changes
  useEffect(() => {
    // Rectangle mask aspect ratio changed
  }, [rectangleMaskAspectRatio]);
  
  // Canvas tool panel state - moved here to fix initialization error
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("inpaint");
  
  // Minimal state for removed Closer Look functionality (to prevent build errors)
  const [isAspectRatioAnimating] = useState(false);
  const setIsAspectRatioAnimating = () => {}; // No-op function
  const setCloserLookError = (_?: string) => {}; // No-op function
  const setIsCloserLookGenerating = (_?: boolean) => {}; // No-op function
  
  // KIE Modal state
  const [showKIEModal, setShowKIEModal] = useState(false);

  // Aspect Ratio Info Dialog state
  const [showAspectRatioInfo, setShowAspectRatioInfo] = useState(false);
  
  // Tag insertion popup state
  const [showTagPopup, setShowTagPopup] = useState(false);

  // ImageAI Panel state
  const [aiEditMode, setAiEditMode] = useState<AIEditMode>("describe");
  const [aiModel, setAiModel] = useState("nano-banana-2");
  const [aiRefImages, setAiRefImages] = useState<{ id: string; url: string }[]>([]);

  // Information dialog state
  const [showInfoDialog, setShowInfoDialog] = useState(false);

  // ── Zoom Functions ───────────────────────────────────────────────────
  const handleZoomIn = () => {
    const newZoom = Math.min(zoomLevel + 20, 200);
    setZoomLevel(newZoom);
    applyZoomToImage(newZoom);
  };

  const handleZoomOut = () => {
    const newZoom = Math.max(zoomLevel - 20, 20);
    setZoomLevel(newZoom);
    applyZoomToImage(newZoom);
  };

  const handleFitToScreen = () => {
    const canvasContainer = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
    const image = canvasContainer?.querySelector('img:not([class*="mask"])') as HTMLImageElement;
    
    if (canvasContainer && image) {
      const containerWidth = canvasContainer.offsetWidth;
      const containerHeight = canvasContainer.offsetHeight;
      const imageWidth = image.naturalWidth;
      const imageHeight = image.naturalHeight;
      
      const scaleX = containerWidth / imageWidth;
      const scaleY = containerHeight / imageHeight;
      const scale = Math.min(scaleX, scaleY); // Fit image to container (scale up or down)
      
      const scaledWidth = imageWidth * scale;
      const scaledHeight = imageHeight * scale;
      const offsetX = (containerWidth - scaledWidth) / 2;
      const offsetY = (containerHeight - scaledHeight) / 2;
      
      image.style.transform = `translate(${offsetX}px, ${offsetY}px) scale(${scale})`;
      image.style.transformOrigin = 'top left';
      image.style.transition = '';
      image.style.position = 'absolute';
      image.style.left = '0px';
      image.style.top = '0px';
      
      // Store fit scale as the "100%" baseline for zoom in/out
      fitScaleRef.current = scale;
      setZoomLevel(100);
    }
  };

  // Re-centers the active rectangle to the image center without needing stale state
  const recenterRectangleIfActive = useCallback(() => {
    // Skip recentering if we're in square mask mode for debugging
    if (isSquareMode) {
      return;
    }
    
    const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
    if (!container) return;
    const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
    if (!img) return;
    const cRect = container.getBoundingClientRect();
    const iRect = img.getBoundingClientRect();
    setRectangle(prev => {
      if (!prev) return prev;
      const x = (iRect.left - cRect.left) + (iRect.width  - prev.width)  / 2;
      const y = (iRect.top  - cRect.top)  + (iRect.height - prev.height) / 2;
      return { x, y, width: prev.width, height: prev.height };
    });
  }, [isSquareMode]);

  // Aspect ratio change handler
  const handleAspectRatioChange = useCallback((aspectRatio: string) => {
    setSelectedAspectRatio(aspectRatio);
    
    // Only update crop rectangle when crop tool is active
    if (canvasTool === "crop") {
      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();
      const containerWidth = containerRect.width;
      const containerHeight = containerRect.height;
      
      // Parse aspect ratio (e.g., "16:9" -> 1.777...)
      const [w, h] = aspectRatio.split(':').map(Number);
      if (isNaN(w) || isNaN(h) || h === 0) return;
      
      const targetRatio = w / h;
      
      // Calculate rectangle dimensions that fit within container
      let rectWidth, rectHeight;
      
      if (containerWidth / containerHeight > targetRatio) {
        // Container is wider than target ratio, use full height
        rectHeight = containerHeight * 0.8; // 80% of container height
        rectWidth = rectHeight * targetRatio;
      } else {
        // Container is taller than target ratio, use full width
        rectWidth = containerWidth * 0.8; // 80% of container width
        rectHeight = rectWidth / targetRatio;
      }
      
      // Center the rectangle
      const x = (containerWidth - rectWidth) / 2;
      const y = (containerHeight - rectHeight) / 2;
      
      // Update rectangle state
      setRectangle({ x, y, width: rectWidth, height: rectHeight });
      setImageIsRectangleVisible(true);
    }
  }, [selectedAspectRatio, canvasTool]);

  const handleRectangleMaskAspectRatioChange = useCallback((aspectRatio: string) => {
    setRectangleMaskAspectRatio(aspectRatio);
  }, []);

  const applyZoomToImage = (displayPercent: number) => {
    const canvasContainer = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
    if (!canvasContainer) return;

    const image = canvasContainer.querySelector('img:not([class*="mask"])') as HTMLImageElement;
    if (!image || !image.naturalWidth) return;

    // displayPercent is relative to fit-to-screen scale:
    // 100% = fitScaleRef.current, 200% = 2× fit scale, etc.
    const newScale = fitScaleRef.current * (displayPercent / 100);
    const containerWidth = canvasContainer.offsetWidth;
    const containerHeight = canvasContainer.offsetHeight;

    // Zoom toward the viewport center
    const containerRect = canvasContainer.getBoundingClientRect();
    const imgRect = image.getBoundingClientRect();
    const currentTx = imgRect.left - containerRect.left;
    const currentTy = imgRect.top  - containerRect.top;
    const currentScale = imgRect.width / image.naturalWidth;

    const vcX = containerWidth  / 2;
    const vcY = containerHeight / 2;
    const imgCenterX = (vcX - currentTx) / currentScale;
    const imgCenterY = (vcY - currentTy) / currentScale;

    const tx = vcX - imgCenterX * newScale;
    const ty = vcY - imgCenterY * newScale;

    image.style.transformOrigin = 'top left';
    image.style.transition = '';
    image.style.transform = `translate(${tx}px, ${ty}px) scale(${newScale})`;
  };

  // ── Canvas tool panel state ────────────────────────────────────────────────
  const [canvasState, setCanvasState] = useState<CanvasEditorState>(emptyCanvasState());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [hideBrushMask, setHideBrushMask] = useState(false); // Hide/show blue brush mask on canvas
  const [newBubbleText, setNewBubbleText] = useState("test...");
  const [newBubbleType, setNewBubbleType] = useState<BubbleType>("speech");
  const [newTextContent, setNewTextContent] = useState("test...");
  const [newTextSize, setNewTextSize] = useState(16);
  const [newTextColor, setNewTextColor] = useState("#000000");
  
  // Sliding panels state
  const [generatedImagesPanelOpen, setGeneratedImagesPanelOpen] = useState(false);
  const [timelinePanelOpen, setTimelinePanelOpen] = useState(false);
  
  // Collapsible property cards state
  const [collapsedCards, setCollapsedCards] = useState<Set<string>>(new Set());
  const [maskBrushSize, setMaskBrushSize] = useState(20);
  const [maskOpacity, setMaskOpacity] = useState(0.45);
  const [isEraser, setIsEraser] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [canvasSelection, setCanvasSelection] = useState<CanvasSelection>({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: null, selectedShapeId: null });
  const [selectedColor, setSelectedColor] = useState("#FF0000");
  // Function to add image as canvas element (for ImageAIPanel uploads)
  const handleAddCanvasElement = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const url = event.target?.result as string;
      const libId = makeId();
      const elemId = makeId();
      const aw = 160, ah = 160;
      const { cx, cy } = getCanvasCenter();
      
      setCanvasState(prev => ({
        ...prev,
        assetLibrary: [...prev.assetLibrary, { id: libId, url, name: file.name }],
        assetElements: [...prev.assetElements, { id: elemId, panelId, assetId: libId, x: cx - aw/2, y: cy - ah/2, w: aw, h: ah, zIndex: 2 }],
      }));
      
      setCanvasSelection({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: elemId } as CanvasSelection);
    };
    reader.readAsDataURL(file);
  };

  const assetInputRef = useRef<HTMLInputElement | null>(null);

  const panelId = activeShotId;
  const panelBubbles = canvasState.bubbles.filter(b => b.panelId === panelId);
  const panelTexts = canvasState.textElements.filter(t => t.panelId === panelId);
  const panelAssets = canvasState.assetElements.filter(a => a.panelId === panelId);

  const toggleVisibility = (id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteLayer = (id: string) => {
    setCanvasState(prev => ({
      ...prev,
      bubbles: prev.bubbles.filter(b => b.id !== id),
      textElements: prev.textElements.filter(t => t.id !== id),
      assetElements: prev.assetElements.filter(a => a.id !== id),
    }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const toggleCardCollapsed = (cardId: string) => {
    setCollapsedCards(prev => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  };

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  // Computed canvas active tool - enable brush for all inpaint models
  const canvasActiveTool = useMemo(() => {
    if (canvasTool === "inpaint") {
      // Enable brush for all inpaint models
      return "inpaint";
    }
    // Return the actual tool (text, elements, etc.)
    return canvasTool;
  }, [canvasTool]);

  const getCanvasCenter = () => {
    const el = canvasContainerRef.current;
    if (!el) return { cx: 200, cy: 150 };
    return { cx: el.clientWidth / 2, cy: el.clientHeight / 2 };
  };

  const addBubble = () => {
    if (!newBubbleText.trim()) return;
    // reset to default after add
    const bw = 200, bh = 100;
    const { cx, cy } = getCanvasCenter();
    const b = { id: makeId(), panelId, x: cx - bw/2, y: cy - bh/2, w: bw, h: bh, text: newBubbleText.trim(), bubbleType: newBubbleType, tailMode: "auto" as const, tailDir: "bottom-left" as const, tailX: 50, tailY: 130, autoFitFont: true, fontSize: 15, zIndex: 4 };
    setCanvasState(prev => ({ ...prev, bubbles: [...prev.bubbles, b] }));
    setNewBubbleText("test...");
    setCanvasSelection({ selectedBubbleId: b.id, selectedTextId: null, selectedAssetId: null } as CanvasSelection);
  };

  const addText = () => {
    if (!newTextContent.trim()) return;
    const tw = 200, th = 60;
    const { cx, cy } = getCanvasCenter();
    const t = { id: makeId(), panelId, x: cx - tw/2, y: cy - th/2, w: tw, h: th, text: newTextContent.trim(), fontSize: newTextSize, color: newTextColor, fontWeight: "normal", fontStyle: "normal", fontFamily: "Arial" as const, zIndex: 3 };
    setCanvasState(prev => ({ ...prev, textElements: [...prev.textElements, t] }));
    setNewTextContent("test...");
    setCanvasSelection({ selectedBubbleId: null, selectedTextId: t.id, selectedAssetId: null } as CanvasSelection);
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const libId = makeId();
      const elemId = makeId();
      const aw = 160, ah = 160;
      const { cx, cy } = getCanvasCenter();
      setCanvasState(prev => ({
        ...prev,
        assetLibrary: [...prev.assetLibrary, { id: libId, url, name: file.name }],
        assetElements: [...prev.assetElements, { id: elemId, panelId, assetId: libId, x: cx - aw/2, y: cy - ah/2, w: aw, h: ah, zIndex: 2 }],
      }));
      setCanvasSelection({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: elemId } as CanvasSelection);
    };
    reader.readAsDataURL(file);
  };

  // Layering functions
  const moveLayer = (id: string, direction: "forward" | "backward" | "front" | "back") => {
    const allObjects = [...panelBubbles, ...panelTexts, ...panelAssets];
    const obj = allObjects.find(o => o.id === id);
    if (!obj) {
      return;
    }
    
    const sorted = allObjects.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const idx = sorted.findIndex(o => o.id === id);
    
    let newZ: number;
    if (direction === "front") {
      newZ = (sorted[sorted.length - 1]?.zIndex ?? 0) + 1;
    } else if (direction === "back") {
      newZ = (sorted[0]?.zIndex ?? 0) - 1;
    } else if (direction === "forward" && idx < sorted.length - 1) {
      const above = sorted[idx + 1];
      newZ = above.zIndex! + 1;
    } else if (direction === "backward" && idx > 0) {
      const below = sorted[idx - 1];
      newZ = below.zIndex! - 1;
    } else {
      return;
    }
    
    // Update the object's zIndex
    if (panelBubbles.find(b => b.id === id)) {
      setCanvasState(s => ({ ...s, bubbles: s.bubbles.map(b => b.id === id ? { ...b, zIndex: newZ } : b) }));
    } else if (panelTexts.find(t => t.id === id)) {
      setCanvasState(s => ({ ...s, textElements: s.textElements.map(t => t.id === id ? { ...t, zIndex: newZ } : t) }));
    } else if (panelAssets.find(a => a.id === id)) {
      setCanvasState(s => ({ ...s, assetElements: s.assetElements.map(a => a.id === id ? { ...a, zIndex: newZ } : a) }));
    } else {
      return;
    }
  };

  const toggleAllVisibility = () => {
    const allIds = [...panelBubbles, ...panelTexts, ...panelAssets].map(o => o.id);
    const allHidden = allIds.every(id => hiddenIds.has(id));
    if (allHidden) {
      setHiddenIds(new Set());
    } else {
      setHiddenIds(new Set(allIds));
    }
  };

  
  const activeIdx = shots.findIndex(s => s.id === activeShotId);
  const activeShot = shots[activeIdx];

  // Update crop rectangle when activeShot.aspectRatio changes and crop tool is active
  useEffect(() => {
    if (canvasTool === "crop" && activeShot?.aspectRatio) {
      console.log("🔧 activeShot.aspectRatio changed to:", activeShot.aspectRatio, "updating crop rectangle");
      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
      if (container) {
        const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
        const cRect = container.getBoundingClientRect();
        const iRect = img?.getBoundingClientRect();
        
        // Minimum resolution dimensions (multiply by 10 for minimum size)
        const minDimensionMap: Record<string, { width: number; height: number }> = {
          "1:1":  { width: 100, height: 100 },    // 1:1 = 100x100 minimum
          "3:4":  { width: 30, height: 40 },      // 3:4 = 30x40 minimum  
          "4:3":  { width: 40, height: 30 },      // 4:3 = 40x30 minimum
          "16:9": { width: 160, height: 90 },     // 16:9 = 160x90 minimum
          "9:16": { width: 90, height: 160 },     // 9:16 = 90x160 minimum
        };
        
        // Display dimensions (larger for better visibility)
        const displayDimensionMap: Record<string, { width: number; height: number }> = {
          "1:1":  { width: 200, height: 200 },
          "3:4":  { width: 300, height: 400 },
          "4:3":  { width: 400, height: 300 },
          "16:9": { width: 320, height: 180 },
          "9:16": { width: 180, height: 320 },
        };
        
        const { width: w, height: h } = displayDimensionMap[activeShot.aspectRatio] || displayDimensionMap["16:9"];
        const x = iRect ? (iRect.left - cRect.left) + (iRect.width - w) / 2 : (cRect.width - w) / 2;
        const y = iRect ? (iRect.top - cRect.top) + (iRect.height - h) / 2 : (cRect.height - h) / 2;
        
        setRectangle({ x, y, width: w, height: h });
        setImageIsRectangleVisible(true);
        console.log("✅ Crop rectangle updated with new aspect ratio:", activeShot.aspectRatio, { x, y, width: w, height: h });
        console.log("🔧 Minimum resolution for this ratio:", minDimensionMap[activeShot.aspectRatio]);
      }
    }
  }, [activeShot?.aspectRatio, canvasTool]);

  // Update image mask when rectangleMaskAspectRatio changes and rectInpaint tool is active
  useEffect(() => {
    if (canvasTool === "rectInpaint" && rectangleMaskAspectRatio && rectangle) {
      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
      if (container) {
        const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
        if (img) {
          const containerRect = container.getBoundingClientRect();
          const imgRect = img.getBoundingClientRect();
          
          // Calculate the actual rendered image dimensions and position
          const renderedWidth = imgRect.width;
          const renderedHeight = imgRect.height;
          const offsetX = imgRect.left - containerRect.left;
          const offsetY = imgRect.top - containerRect.top;
          
          // For cyan image mask: Always use 1:1 aspect ratio for simplicity
          const targetRatio = 1; // Fixed 1:1 aspect ratio
          const minSize = 100; // 100x100 minimum for 1:1
          
          // Calculate rectangle dimensions that fit within the rendered image
          let rectWidth, rectHeight;
          
          if (renderedWidth / renderedHeight > targetRatio) {
            // Rendered image is wider than target ratio, use full height
            rectHeight = Math.min(renderedHeight, 400); // Max 400px height
            rectWidth = rectHeight * targetRatio;
          } else {
            // Rendered image is taller than target ratio, use full width
            rectWidth = Math.min(renderedWidth, 400); // Max 400px width
            rectHeight = rectWidth / targetRatio;
          }
          
          // Ensure minimum size
          rectWidth = Math.max(rectWidth, minSize);
          rectHeight = Math.max(rectHeight, minSize);
          
          // Center the rectangle within the rendered image area
          const x = offsetX + (renderedWidth - rectWidth) / 2;
          const y = offsetY + (renderedHeight - rectHeight) / 2;
          
          // Only update if the dimensions or position actually changed to prevent infinite loop
          const currentRect = rectangle;
          if (currentRect.width !== rectWidth || currentRect.height !== rectHeight || currentRect.x !== x || currentRect.y !== y) {
            setRectangle({ x, y, width: rectWidth, height: rectHeight });
            setImageIsRectangleVisible(true);
          }
        }
      }
    }
  }, [rectangleMaskAspectRatio, canvasTool]);

  const cropImageToRectangle = async (
    base64Image: string,
    rectangle: { x: number; y: number; width: number; height: number },
    canvasDisplaySize?: { width: number; height: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("Starting cropImageToRectangle with:", rectangle);
        console.log("Canvas display size provided:", canvasDisplaySize);
        
        const img = new Image();
        img.onload = () => {
          try {
            console.log("Image loaded successfully. Dimensions:", img.width, "x", img.height);
            console.log("Crop rectangle (canvas space):", rectangle);
            
            // Scale rectangle from canvas display space to actual image pixel space,
            // accounting for object-contain letterboxing offset within the container.
            let scaledRect = { ...rectangle };
            if (canvasDisplaySize && canvasDisplaySize.width > 0 && canvasDisplaySize.height > 0) {
              const containerW = canvasDisplaySize.width;
              const containerH = canvasDisplaySize.height;

              // Calculate how the image is rendered inside the container (object-contain logic)
              const imgAspect = img.width / img.height;
              const containerAspect = containerW / containerH;

              let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
              if (imgAspect > containerAspect) {
                // Image is wider relative to container → pillarbox (black bars top/bottom)
                renderedW = containerW;
                renderedH = containerW / imgAspect;
                offsetX = 0;
                offsetY = (containerH - renderedH) / 2;
              } else {
                // Image is taller relative to container → letterbox (black bars left/right)
                renderedH = containerH;
                renderedW = containerH * imgAspect;
                offsetX = (containerW - renderedW) / 2;
                offsetY = 0;
              }

              const scaleX = img.width / renderedW;
              const scaleY = img.height / renderedH;

              console.log(`Container: ${containerW}x${containerH}, Image: ${img.width}x${img.height}`);
              console.log(`Rendered image in container: ${renderedW.toFixed(1)}x${renderedH.toFixed(1)} at offset (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
              console.log(`Scale factors: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}`);

              // Subtract letterbox offset before scaling
              scaledRect = {
                x: (rectangle.x - offsetX) * scaleX,
                y: (rectangle.y - offsetY) * scaleY,
                width: rectangle.width * scaleX,
                height: rectangle.height * scaleY,
              };
              console.log("Scaled rectangle (image space):", scaledRect);

              // Apply boundary constraints (0px padding) - rectangle can touch edges but not exceed them
              const PADDING = 0;
              const constrainedRect = {
                x: Math.max(PADDING, Math.min(scaledRect.x, img.width - scaledRect.width)),
                y: Math.max(PADDING, Math.min(scaledRect.y, img.height - scaledRect.height)),
                width: Math.min(scaledRect.width, img.width),
                height: Math.min(scaledRect.height, img.height),
              };

              // Verify the constrained rectangle is valid
              if (constrainedRect.width < 10 || constrainedRect.height < 10) {
                throw new Error("Crop area too small after applying boundary constraints");
              }

              console.log("Constrained rectangle (0px padding):", constrainedRect);
              rectangle = constrainedRect;
            } else {
              console.warn("No canvas display size provided, using rectangle as-is");
            }
            
            // Validate rectangle bounds
            if (rectangle.x < 0 || rectangle.y < 0 || 
                rectangle.x + rectangle.width > img.width || 
                rectangle.y + rectangle.height > img.height) {
              console.warn("Rectangle extends beyond image bounds, adjusting...");
              // Adjust rectangle to fit within image bounds
              const adjustedRect = {
                x: Math.max(0, rectangle.x),
                y: Math.max(0, rectangle.y),
                width: Math.min(rectangle.width, img.width - Math.max(0, rectangle.x)),
                height: Math.min(rectangle.height, img.height - Math.max(0, rectangle.y))
              };
              console.log("Adjusted rectangle:", adjustedRect);
              rectangle = adjustedRect;
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            // Set canvas size to rectangle dimensions, but resize if too large for GPT-4o
            const MAX_SIZE = 1024; // Using URLs now, so size limits are less strict
            let canvasWidth = rectangle.width;
            let canvasHeight = rectangle.height;
            
            // Resize if dimensions exceed limits
            if (canvasWidth > MAX_SIZE || canvasHeight > MAX_SIZE) {
              const scale = Math.min(MAX_SIZE / canvasWidth, MAX_SIZE / canvasHeight);
              canvasWidth = Math.round(canvasWidth * scale);
              canvasHeight = Math.round(canvasHeight * scale);
              console.log("Resizing canvas from", rectangle.width, "x", rectangle.height, "to", canvasWidth, "x", canvasHeight);
            }
            
            canvas.width = canvasWidth;
            canvas.height = canvasHeight;
            console.log("Final canvas dimensions:", canvas.width, "x", canvas.height);

            // Draw the cropped portion of the image (with resizing if needed)
            ctx.drawImage(
              img,
              rectangle.x, rectangle.y, rectangle.width, rectangle.height, // Source rectangle
              0, 0, canvasWidth, canvasHeight  // Destination rectangle (resized)
            );

            // Convert to base64 (will be uploaded as URL)
            const croppedBase64 = canvas.toDataURL('image/png');
            console.log("Canvas converted to base64 (PNG), length:", croppedBase64.length);
            resolve(croppedBase64);
          } catch (error) {
            console.error("Error in canvas processing:", error);
            reject(error);
          }
        };

        img.onerror = (error) => {
          console.error("Image loading failed:", error);
          reject(new Error('Failed to load image for cropping'));
        };
        img.src = base64Image;
      } catch (error) {
        console.error("Error in cropImageToRectangle:", error);
        reject(error);
      }
    });
  };

  // ── Closer Look via n8n ─────────────────────────────────────────────────────
  const runCrop = async () => {
    const imageUrl = backgroundImage || activeShot?.imageUrl;
    if (!imageUrl || !rectangle) {
      setCloserLookError("No image or rectangle selected for cropping");
      return;
    }

    setIsCloserLookGenerating(true);
    setCloserLookError(undefined);

    try {
      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // Convert background image to base64
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        // Validate and construct proper URL
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        
        try {
          const res = await fetch(validUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
          }
          
          const blob = await res.blob();
          if (blob.size === 0) {
            throw new Error("Empty image blob received");
          }
          
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
        } catch (fetchError) {
          console.error("Image fetch error:", fetchError);
          setCloserLookError(`Unable to load image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
          return;
        }
      }

      // Get canvas display size for coordinate scaling
      const canvasEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]');
      const canvasRect = canvasEl?.getBoundingClientRect();
      const canvasDisplaySize = canvasRect
        ? { width: canvasRect.width, height: canvasRect.height }
        : undefined;

      // Crop the image to the rectangle
      console.log("Cropping image to rectangle:", rectangle);
      const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
      console.log("Image cropped successfully");

      // Set the cropped image as the new background
      setBackgroundImage(croppedImage);
      
      // Add cropped image to generated images panel (newest first)
      setGeneratedImages(prev => [croppedImage, ...prev]);
      setShowGenPanel(true);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setCloserLookError(msg);
      console.error("Crop error:", err);
    } finally {
      setIsCloserLookGenerating(false);
    }
  };

  // ── Crop + Generate + Combine Workflow ───────────────────────────────────────────────────────
  const runCropGenerateCombine = async () => {
    const imageUrl = backgroundImage || activeShot?.imageUrl;
    if (!imageUrl || !rectangle) {
      setCloserLookError("No image or rectangle selected for crop and generate");
      return;
    }

    setIsCloserLookGenerating(true);
    setCloserLookError(undefined);

    try {
      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // Convert background image to base64
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        // Validate and construct proper URL
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        
        try {
          const res = await fetch(validUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
          }
          
          const blob = await res.blob();
          if (blob.size === 0) {
            throw new Error("Empty image blob received");
          }
          
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
        } catch (fetchError) {
          console.error("Image fetch error:", fetchError);
          setCloserLookError(`Unable to load image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
          return;
        }
      }

      // Get canvas display size for coordinate scaling
      const canvasEl = canvasContainerRef.current?.querySelector('[data-editor="true"]') as HTMLElement;
      const canvasRect = canvasEl?.getBoundingClientRect();
      const canvasDisplaySize = canvasRect
        ? { width: canvasRect.width, height: canvasRect.height }
        : undefined;

      // Step 1: Crop the image to the rectangle
      console.log("Step 1: Cropping image to rectangle:", rectangle);
      const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
      console.log("Step 1: Image cropped successfully");

      // Step 2: Send cropped image to KIE for generation
      console.log("Step 2: Sending cropped image to KIE for generation...");
      const generatedImage = await runInpaintAPI(croppedImage, "", "Enhance the cropped area with AI", "nano-banana");
      console.log("Step 2: Generated image received:", generatedImage);

      // Step 3: Combine generated image with original image
      console.log("Step 3: Combining generated image with original image...");
      const combinedImage = await combineImages(originalImage ?? '', generatedImage, rectangle, canvasDisplaySize);
      console.log("Step 3: Images combined successfully");

      // Set the combined image as the new background
      setBackgroundImage(combinedImage);
      
      // Add combined image to generated images panel
      setGeneratedImages(prev => [...prev, croppedImage, generatedImage, combinedImage]);
      setShowGenPanel(true);

      // Clear the crop rectangle after successful generation
      setRectangle(null);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setCloserLookError(msg);
      console.error("Crop+Generate+Combine error:", err);
    } finally {
      setIsCloserLookGenerating(false);
    }
  };

  // Helper function to call inpaint API (similar to runInpaint but more generic)
  const runInpaintAPI = async (image: string, mask: string, prompt: string, model: string): Promise<string> => {
    const response = await fetch("/api/inpaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        mask: mask,
        prompt: prompt,
        model: model,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      const errorMessage = err.error || err.message || err.suggestion || "Inpaint failed";
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const resultImage = result.image ?? result.url ?? result.output ?? result.data;
    if (!resultImage) {
      throw new Error("No image returned from inpaint API");
    }
    
    return resultImage;
  };

  // Helper function to combine two images with a mask
  const combineImages = async (originalImage: string, generatedImage: string, rectangle: any, canvasDisplaySize?: { width: number; height: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img1 = new Image();
      const img2 = new Image();
      
      img1.onload = () => {
        img2.onload = () => {
          // Create canvas for combining
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to match display size
          const width = canvasDisplaySize?.width || 800;
          const height = canvasDisplaySize?.height || 600;
          canvas.width = width;
          canvas.height = height;
          
          // Draw original image
          if (ctx) ctx.drawImage(img1, 0, 0, width, height);
          
          // Draw generated image in the cropped area
          if (rectangle && ctx) {
            const scaleX = width / (canvasDisplaySize?.width || 800);
            const scaleY = height / (canvasDisplaySize?.height || 600);
            
            const drawX = rectangle.x * scaleX;
            const drawY = rectangle.y * scaleY;
            const drawWidth = rectangle.width * scaleX;
            const drawHeight = rectangle.height * scaleY;
            
            ctx.drawImage(img2, drawX, drawY, drawWidth, drawHeight);
          } else if (ctx) {
            // If no rectangle, overlay the generated image
            ctx.globalAlpha = 0.5; // Semi-transparent overlay
            ctx.drawImage(img2, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          }
          
          // Convert to base64
          const combinedBase64 = canvas.toDataURL('image/png');
          resolve(combinedBase64);
        };
        
        img1.onerror = () => reject(new Error('Failed to load original image'));
        img2.onerror = () => reject(new Error('Failed to load generated image'));
        
        img1.src = originalImage;
        img2.src = generatedImage;
      };
      
      img1.onerror = () => reject(new Error('Failed to load original image'));
      img2.onerror = () => reject(new Error('Failed to load generated image'));
      
      img1.src = originalImage;
      img2.src = generatedImage;
    });
  };

  type RefMode = "multi" | "single" | "text";
  const USE_CASES: Record<string, {
    label: string; emoji: string; refMode: RefMode;
    bestModel: typeof imageInpaintModel; bestModelLabel: string;
    models: { value: typeof imageInpaintModel; label: string; sub: string }[];
  }> = {
    "character-design": { 
      label: "Character Design", 
      emoji: "👤", 
      refMode: "multi",  
      bestModel: "seedream-5.0-lite-image",             
      bestModelLabel: "Seedream 5 Lite",    
      models: [
        { value: "seedream-5.0-lite-image", label: "Seedream 5 Lite", sub: "Multi-reference expert" }, 
        { value: "gpt-image", label: "GPT Image 1.5", sub: "World knowledge" }, 
        { value: "nano-banana-edit", label: "Nano Banana Edit", sub: "High fidelity" }
      ] 
    },
    "clothing-accessories": { 
      label: "Clothing & Accessories", 
      emoji: "👕", 
      refMode: "multi",  
      bestModel: "flux-2-pro-image-to-image", 
      bestModelLabel: "Flux 2 Pro", 
      models: [
        { value: "flux-2-pro-image-to-image", label: "Flux 2 Pro", sub: "High quality" }, 
        { value: "gpt-image", label: "GPT Image 1.5", sub: "Reliable" }
      ] 
    },
    "environment-products": { 
      label: "Environment & Products", 
      emoji: "🏞️", 
      refMode: "single", 
      bestModel: "flux-2-flex-image-to-image", 
      bestModelLabel: "Flux 2 Flex",     
      models: [
        { value: "flux-2-flex-image-to-image", label: "Flux 2 Flex", sub: "Specialist" },  
        { value: "flux-kontext-pro", label: "Flux Kontext", sub: "Context-aware" }, 
        { value: "gpt-image", label: "GPT Image 1.5", sub: "Reliable" },
        { value: "ideogram-reframe", label: "Ideogram Reframe", sub: "Resize expert" },
        { value: "character-remix", label: "Character Remix", sub: "Character expert" }
      ] 
    },
    "image-composition": { 
      label: "Image Composition", 
      emoji: "🎨", 
      refMode: "multi", 
      bestModel: "seedream-5.0-lite-image",             
      bestModelLabel: "Seedream 5 Lite",    
      models: [
        { value: "seedream-5.0-lite-image", label: "Seedream 5 Lite", sub: "Multi-reference expert" }, 
        { value: "nano-banana-2", label: "Nano Banana 2", sub: "Google search integrated" },
        { value: "flux-kontext-pro", label: "Flux Kontext Pro", sub: "Multi-reference expert" },
        { value: "gpt-image", label: "GPT Image 1.5", sub: "World knowledge" }
      ] 
    },
    "text-to-image": { 
      label: "Text to Image", 
      emoji: "✍️", 
      refMode: "text",   
      bestModel: "flux-2-flex-text-to-image", 
      bestModelLabel: "Flux 2 Flex",     
      models: [
        { value: "flux-2-flex-text-to-image", label: "Flux 2 Flex", sub: "Fast" }, 
        { value: "flux-2-pro-text-to-image", label: "Flux 2 Pro", sub: "High quality" }, 
        { value: "nano-banana-2", label: "Nano Banana 2", sub: "Enhanced" },
        { value: "seedream-5.0-lite-text", label: "Seedream 5 Lite", sub: "Detailed" }
      ] 
    },
  };

  const refModeBadge: Record<RefMode, { label: string; color: string }> = {
    multi:  { label: "📸 Multi-Reference",  color: "bg-green-500/20 text-green-300 border-green-500/30" },
    single: { label: "📸 Single Reference", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
    text:   { label: "📝 Text-Only",         color: "bg-gray-500/20 text-gray-300 border-gray-500/30" },
  };

  
// ── Generate Image (Image Tab) ─────────────────────────────────────────────────────────────────
  const generateImageTab = async () => {
    if (!imageInpaintPrompt.trim()) return;
    setImageIsInpainting(true);
    setImageInpaintError(null);
    try {
      // Base image = current canvas background (what the user is working on)
      const baseImage = backgroundImage ?? activeShot?.imageUrl ?? "";

      // Reference images = all uploaded reference images (optional style/character refs)
      const refImages = imageReferenceImages.filter(Boolean);

      // Check if this is a text-to-image model (shouldn't send base image)
      const isTextToImageModel = imageInpaintModel.includes("text-to-image");
      
      const proxyBody: Record<string, unknown> = {
        prompt: imageInpaintPrompt,
        model: imageInpaintModel,
        aspectRatio: activeShot?.aspectRatio ?? "16:9",
      };
      
      // Only send base image for image-to-image models
      if (!isTextToImageModel && baseImage) {
        proxyBody.image = baseImage;
      }
      
      if (refImages.length > 0) {
        proxyBody.referenceImages = refImages;
      }

      // Call proxy which handles: base64→URL upload, n8n webhook, KIE polling
      const proxyRes = await fetch("/api/n8n-image-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proxyBody),
      });

      const proxyData = await proxyRes.json();
      if (!proxyRes.ok || proxyData.error) {
        throw new Error(proxyData.error ?? `Generation failed: ${proxyRes.status}`);
      }

      if (!proxyData.image) throw new Error("No image returned from generation");

      setImageGeneratedImages((prev) => [proxyData.image, ...prev]);
      // Also push to left Generated panel so it appears below the original thumbnail
      setGeneratedImages((prev) => [proxyData.image, ...prev]);
      // Auto-apply to canvas so the user immediately sees the generated result
      setBackgroundImage(proxyData.image);
      setShowGenPanel(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      
      // Handle specific model failures gracefully
      if (errorMessage.includes("Grok") || errorMessage.includes("grok")) {
        setImageInpaintError("Grok model is temporarily unavailable. Please try again with a different model (Nano Banana, Flux Kontext Pro, or OpenAI 4o).");
      } else if (errorMessage.includes("no image URL found") || errorMessage.includes("500")) {
        setImageInpaintError("The model encountered an issue generating your image. Please try again or select a different model.");
      } else if (errorMessage.includes("timeout") || errorMessage.includes("401") || errorMessage.includes("403")) {
        setImageInpaintError("Service temporarily unavailable. Please wait a moment and try again.");
      } else if (errorMessage.includes("rate limit") || errorMessage.includes("too many requests")) {
        setImageInpaintError("Too many requests. Please wait a moment and try again.");
      } else {
        // Generic error for other cases
        setImageInpaintError(`Generation failed: ${errorMessage}. Please try again or select a different model.`);
      }
    } finally {
      setImageIsInpainting(false);
    }
  };

  // ── Generate Image with Bubbles and Text ───────────────────────────────────────────────────────
  const generateImageWithElements = async () => {
    const imageUrl = backgroundImage || activeShot?.imageUrl;
    if (!imageUrl) {
      setInpaintError("No background image available");
      return;
    }

    // Handle area-edit mode with character-edit model (faceshift)
    console.log("Checking conditions:", {
      aiEditMode,
      aiModel,
      isCharacterEdit: aiModel === "ideogram/character-edit"
    });
    
    if (aiEditMode === "area-edit") {
      // Check if square mask is being used
      const isSquareMaskActive = canvasTool === "rectInpaint" && isSquareMode;
      
      // For faceshift (character-edit), require character-edit model for brush tools when in inpaint mode
      const isBrushTool = canvasTool === "inpaint" && (aiEditMode === "area-edit");
      
      if (isBrushTool && aiModel !== "ideogram/character-edit") {
        console.log("Brush tool detected but not using character-edit model");
        setInpaintError("Please select 'Character-edit' model for faceshift functionality in area-edit mode");
        return;
      }
      
      if (isSquareMaskActive) {
        console.log("Area-edit mode with square mask detected, using square mask logic with model:", aiModel);
        console.log("Area-edit mode - Rectangle state:", rectangle);
        console.log("Area-edit mode - isSquareMode:", isSquareMode);
        console.log("Area-edit mode - canvasTool:", canvasTool);
        // Use square mask logic with the selected model
        await runRectangleInpaint();
        return;
      }
      
      // Use the updated isBrushTool definition
      if (isBrushTool && aiModel === "ideogram/character-edit") {
        console.log("Brush tool with character-edit model detected, using faceshift logic");
        // Use aiRefImages (ImageAI Panel) instead of imageReferenceImages (left toolbox)
        // Convert aiRefImages format to string array for runCharacterEditInpaint
        const aiRefImageUrls = aiRefImages.map(img => img.url);
        console.log("Reference Images from ImageAI Panel:", aiRefImageUrls);
        console.log("Current inpaintPrompt:", inpaintPrompt);
        console.log("Current imageInpaintPrompt:", imageInpaintPrompt);
        
        // Use imageInpaintPrompt (from ImageAI Panel) or default prompt
        const promptToUse = imageInpaintPrompt.trim() || "edit the character face";
        console.log("Using prompt for faceshift:", promptToUse);
        
        await runCharacterEditInpaint(aiRefImageUrls, promptToUse);
      }
      
      // If we reach here, it's not a brush tool with character-edit model
      // Let it fall through to rectangle mask logic
    }

    setIsInpainting(true);
    setInpaintError(null);

    try {
      // Get the container element
      const containerEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]') as HTMLElement;
      if (!containerEl) {
        throw new Error("Canvas container not found");
      }

      // Use clientWidth/clientHeight to match CanvasEditor's ResizeObserver
      // (which uses entries[0].contentRect — same as clientWidth/Height for
      // elements without padding/border). getBoundingClientRect can differ.
      const cssW = containerEl.clientWidth;
      const cssH = containerEl.clientHeight;

      // Convert image to data URL first to avoid CORS issues
      let safeImageUrl = imageUrl;
      
      if (imageUrl.startsWith('http')) {
        try {
          const response = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
          if (response.ok) {
            const blob = await response.blob();
            safeImageUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (fetchError) {
          console.warn("Failed to fetch external image, trying direct load:", fetchError);
        }
      }

      // Load background image to get its natural dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = safeImageUrl;
      });

      // Canvas = exact CSS container size. All coords used directly — no scaling.
      const captureCanvas = document.createElement('canvas');
      const captureCtx = captureCanvas.getContext('2d');
      if (!captureCtx) {
        throw new Error("Failed to get capture canvas context");
      }
      captureCanvas.width  = cssW;
      captureCanvas.height = cssH;

      // Clear canvas with white background to prevent blue screen
      captureCtx.fillStyle = '#ffffff';
      captureCtx.fillRect(0, 0, cssW, cssH);

      // Draw background image with object-contain behavior to prevent stretching
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = cssW / cssH;
      let drawW, drawH, drawX, drawY;
      
      if (imgRatio > containerRatio) {
        // Image is wider than container - fit to width, center vertically
        drawW = cssW;
        drawH = cssW / imgRatio;
        drawX = 0;
        drawY = (cssH - drawH) / 2;
      } else {
        // Image is taller than container - fit to height, center horizontally
        drawH = cssH;
        drawW = cssH * imgRatio;
        drawX = (cssW - drawW) / 2;
        drawY = 0;
      }
      
      captureCtx.drawImage(img, drawX, drawY, drawW, drawH);

      // Store image offset for coordinate adjustment
      const imageOffsetX = drawX;
      const imageOffsetY = drawY;

      // Render each bubble by generating the exact same SVG used by CanvasEditor,
      // then drawing it onto the capture canvas as an image.
      const bubbles = canvasState.bubbles
        .filter(b => b.panelId === activeShotId)
        .sort((a, b) => (a.zIndex ?? 4) - (b.zIndex ?? 4));

      for (const b of bubbles) {
        const seed = b.id;
        const font = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;
        const hasTail = b.tailMode !== "none" && !["shout", "sfx"].includes(b.bubbleType);
        const e = bubbleEllipse(b.w, b.h);
        const sw = 2.5;
        const isFlipped = b.flippedColors || false;
        const fillColor = isFlipped ? "#000000" : "#ffffff";
        const strokeColor = isFlipped ? "#ffffff" : "#1a1a1a";
        const textColor = isFlipped ? "#ffffff" : "#111111";
        const dashed = b.bubbleType === "whisper";
        const wSw = 3.5, wStroke = "#333", wDash = "10 8";

        // Match CanvasEditor: pre-flip tailDir so that when ctx.scale(flipX,flipY)
        // flips the rendering, the tail ends up pointing the correct direction.
        let flippedTailDir = b.tailDir as TailDir;
        if (b.flipX) {
          if (flippedTailDir === "left") flippedTailDir = "right";
          else if (flippedTailDir === "right") flippedTailDir = "left";
          else if (flippedTailDir === "bottom-left") flippedTailDir = "bottom-right";
          else if (flippedTailDir === "bottom-right") flippedTailDir = "bottom-left";
        }
        if (b.flipY) {
          if (flippedTailDir === "bottom-left") flippedTailDir = "bottom-right";
          else if (flippedTailDir === "bottom-right") flippedTailDir = "bottom-left";
          else if (flippedTailDir === "left") flippedTailDir = "right";
          else if (flippedTailDir === "right") flippedTailDir = "left";
        }

        // Build SVG markup at CSS-pixel dimensions (b.w, b.h) so that hardcoded
        // constants in tailPath/rectTailPath (tailLen=28, spread=10, inset) produce
        // the correct proportions — exactly matching CanvasEditor.
        let shapeMarkup = "";
        if (b.bubbleType === "thought") {
          const cp = cloudPath(b.w, b.h);
          shapeMarkup = `<g transform="scale(${b.flipX ? -1 : 1},${b.flipY ? -1 : 1}) translate(${b.flipX ? -b.w : 0} ${b.flipY ? -b.h : 0})">
            <path d="${cp}" fill="${fillColor}" stroke="none"/>
            <path d="${cp}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="round"/>
          </g>`;
        } else if (b.bubbleType === "oval") {
          const tp = hasTail ? tailPath(b.w, b.h, flippedTailDir) : "";
          shapeMarkup = `
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${fillColor}" stroke="none"/>
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="round"/>`;
        } else if (b.bubbleType === "speechRough") {
          const rp = roughEllipsePath(b.w, b.h, seed);
          const tp = hasTail ? tailPath(b.w, b.h, flippedTailDir) : "";
          shapeMarkup = `
            <path d="${rp}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="round"/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <path d="${rp}" fill="${fillColor}" stroke="none"/>`;
        } else if (b.bubbleType === "shout") {
          const pts = burstPoints(b.w, b.h, 12, seed).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
          shapeMarkup = `<polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="miter"/>`;
        } else if (b.bubbleType === "sfx") {
          const pts = burstPoints(b.w, b.h, 18, seed, true).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
          shapeMarkup = `<polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.8" stroke-linejoin="miter"/>`;
        } else if (b.bubbleType === "rectRound") {
          const tp = hasTail ? rectTailPath(b.w, b.h, flippedTailDir) : "";
          const outlineSide = flippedTailDir === "left" ? "left" : flippedTailDir === "right" ? "right" : "bottom";
          const outlineGapPos = (flippedTailDir === "left" || flippedTailDir === "right") ? b.h * 0.6 : b.w * (flippedTailDir === "bottom-left" ? 0.2 : 0.8);
          const outlinePath = hasTail ? rectOutlinePathWithGap(b.w, b.h, 20, outlineSide, outlineGapPos, 36) : "";
          shapeMarkup = `
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="20" ry="20" fill="${fillColor}" stroke="none"/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="none"/>` : ""}
            ${hasTail ? `<path d="${outlinePath}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : `<rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="20" ry="20" fill="none" stroke="${strokeColor}" stroke-width="${sw}"/>`}`;
        } else if (b.bubbleType === "rect") {
          const tp = hasTail ? rectTailPath(b.w, b.h, flippedTailDir) : "";
          const outlineSide = flippedTailDir === "left" ? "left" : flippedTailDir === "right" ? "right" : "bottom";
          const outlineGapPos = (flippedTailDir === "left" || flippedTailDir === "right") ? b.h * 0.6 : b.w * (flippedTailDir === "bottom-left" ? 0.2 : 0.8);
          const outlinePath = hasTail ? rectOutlinePathWithGap(b.w, b.h, 2, outlineSide, outlineGapPos, 36) : "";
          shapeMarkup = `
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="2" ry="2" fill="${fillColor}" stroke="none"/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="none"/>` : ""}
            ${hasTail ? `<path d="${outlinePath}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : `<rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="2" ry="2" fill="none" stroke="${strokeColor}" stroke-width="${sw}"/>`}`;
        } else {
          const tp = hasTail ? tailPath(b.w, b.h, flippedTailDir) : "";
          shapeMarkup = `
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="none" stroke="${dashed ? wStroke : strokeColor}" stroke-width="${dashed ? wSw : sw}"${dashed ? ` stroke-dasharray="${wDash}" stroke-linecap="round"` : ""}/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${dashed ? wStroke : strokeColor}" stroke-width="${dashed ? wSw : sw}" stroke-linecap="round" stroke-linejoin="round"${dashed ? ` stroke-dasharray="${wDash}"` : ""}/>` : ""}
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${fillColor}" stroke="none"/>`;
        }

        // Pad so tails don't clip (tail extends ~40px outside bubble bounds)
        const pad = 60;
        const svgW = b.w + pad * 2;
        const svgH = b.h + pad * 2;
        const bubbleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="${-pad} ${-pad} ${svgW} ${svgH}"><g>${shapeMarkup}</g></svg>`;
        const bubbleBlob = new Blob([bubbleSvg], { type: "image/svg+xml;charset=utf-8" });
        const bubbleUrl = URL.createObjectURL(bubbleBlob);

        await new Promise<void>((resolve) => {
          const bImg = new Image();
          bImg.onload = () => {
            captureCtx.save();
            captureCtx.translate(b.x + b.w / 2, b.y + b.h / 2);
            captureCtx.rotate(((b.rotation || 0) * Math.PI) / 180);
            captureCtx.scale(b.flipX ? -1 : 1, b.flipY ? -1 : 1);
            captureCtx.drawImage(bImg, -b.w / 2 - pad, -b.h / 2 - pad, svgW, svgH);
            captureCtx.restore();
            URL.revokeObjectURL(bubbleUrl);
            resolve();
          };
          bImg.onerror = () => { URL.revokeObjectURL(bubbleUrl); resolve(); };
          bImg.src = bubbleUrl;
        });

        // Thought bubble trailing circles — all in CSS pixels, no scaling
        if (b.bubbleType === "thought" && b.tailMode !== "none") {
          const te = bubbleEllipse(b.w, b.h);
          let sx = b.x + imageOffsetX + te.cx, sy = b.y + imageOffsetY + te.cy + te.ry, dx = 0, dy = 1;
          if (b.tailDir === "bottom-left")  { sx = b.x + imageOffsetX + te.cx - 20; dx = -0.6; dy = 1; }
          else if (b.tailDir === "bottom-right") { sx = b.x + imageOffsetX + te.cx + 20; dx = 0.6; dy = 1; }
          else if (b.tailDir === "left")  { sx = b.x + imageOffsetX + te.cx - te.rx; sy = b.y + imageOffsetY + te.cy + 12; dx = -1; dy = 0.4; }
          else if (b.tailDir === "right") { sx = b.x + imageOffsetX + te.cx + te.rx; sy = b.y + imageOffsetY + te.cy + 12; dx = 1; dy = 0.4; }
          const fX = b.flipX ? -1 : 1, fY = b.flipY ? -1 : 1;
          const bCX = b.x + imageOffsetX + te.cx, bCY = b.y + imageOffsetY + te.cy;
          const rot = ((b.rotation || 0) * Math.PI) / 180;
          const fxP = (sx - bCX) * fX, fyP = (sy - bCY) * fY;
          const fdx = dx * fX, fdy = dy * fY;
          const crx = fxP * Math.cos(rot) - fyP * Math.sin(rot) + bCX;
          const cry = fxP * Math.sin(rot) + fyP * Math.cos(rot) + bCY;
          const rdx = fdx * Math.cos(rot) - fdy * Math.sin(rot);
          const rdy = fdx * Math.sin(rot) + fdy * Math.cos(rot);
          const nl = Math.hypot(rdx, rdy), ux = rdx / nl, uy = rdy / nl;
          const cFill = (b.flippedColors||false) ? "#000" : "#fff";
          const cStroke = (b.flippedColors||false) ? "#fff" : "#1a1a1a";
          [[14, 10], [36, 7], [52, 4.5]].forEach(([dist, r]) => {
            captureCtx.beginPath();
            captureCtx.arc(crx + ux * dist, cry + uy * dist, r, 0, Math.PI * 2);
            captureCtx.fillStyle = cFill; captureCtx.fill();
            captureCtx.strokeStyle = cStroke; captureCtx.lineWidth = 2; captureCtx.stroke();
          });
        }

        // Bubble text — raw CSS coords
        captureCtx.save();
        captureCtx.translate(b.x + b.w / 2, b.y + b.h / 2);
        captureCtx.rotate(((b.rotation || 0) * Math.PI) / 180);
        captureCtx.scale(b.flipX ? -1 : 1, b.flipY ? -1 : 1);
        const fontWeight = ["sfx", "shout"].includes(b.bubbleType) ? 900 : 400;
        const fontStyle = b.bubbleType === "whisper" ? "italic" : "normal";
        const fontFamily = "'Comic Sans MS','Bangers','Segoe UI',sans-serif";
        captureCtx.font = `${fontStyle} ${fontWeight} ${font}px ${fontFamily}`;
        captureCtx.fillStyle = textColor;
        captureCtx.textAlign = "center";
        captureCtx.textBaseline = "middle";
        const lines = b.text.split("\n");
        const lineHeight = font * 1.3;
        const totalH = lines.length * lineHeight;
        lines.forEach((line, i) => captureCtx.fillText(line, 0, -totalH/2 + lineHeight*i + lineHeight/2));
        captureCtx.restore();
      }

      // Draw asset elements (images from assetLibrary) sorted by zIndex
      const assetElements = canvasState.assetElements
        .filter(a => a.panelId === activeShotId)
        .sort((a, b) => (a.zIndex ?? 2) - (b.zIndex ?? 2));

      // Reset composite operation before drawing assets
      captureCtx.globalCompositeOperation = 'source-over';

      for (const a of assetElements) {
        const libItem = canvasState.assetLibrary.find(lib => lib.id === a.assetId);
        if (!libItem?.url) continue;

        // Fetch and convert to data URL to avoid CORS tainting
        let assetUrl = libItem.url;
        if (assetUrl.startsWith("http")) {
          try {
            const res = await fetch(assetUrl, { mode: "cors", credentials: "omit" });
            if (res.ok) {
              const blob = await res.blob();
              assetUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            } else {
              console.warn("Failed to fetch asset image, using original URL");
            }
          } catch (error) {
            console.warn("Error fetching asset image:", error);
          }
        }

        await new Promise<void>((resolve) => {
          const aImg = new Image();
          
          // Set crossOrigin to handle CORS issues
          aImg.crossOrigin = 'anonymous';
          
          aImg.onload = () => {
            captureCtx.save();
            
            // Set composite operation for proper transparency handling
            captureCtx.globalCompositeOperation = 'source-over';
            
            // Create clipping path to prevent drawing outside asset bounds
            captureCtx.beginPath();
            captureCtx.rect(a.x, a.y, a.w, a.h);
            captureCtx.clip();
            
            captureCtx.translate(a.x + a.w / 2, a.y + a.h / 2);
            captureCtx.rotate(((a.rotation || 0) * Math.PI) / 180);
            captureCtx.scale(a.flipX ? -1 : 1, a.flipY ? -1 : 1);
            
            // Preserve aspect ratio like CanvasEditor's objectFit:"contain"
            const imgRatio = aImg.naturalWidth / aImg.naturalHeight;
            const boundRatio = a.w / a.h;
            let drawW, drawH, drawX, drawY;
            
            if (imgRatio > boundRatio) {
              // Image is wider than bounds - fit to width
              drawW = a.w;
              drawH = a.w / imgRatio;
              drawX = -a.w / 2;
              drawY = -(drawH / 2);
            } else {
              // Image is taller than bounds - fit to height
              drawH = a.h;
              drawW = a.h * imgRatio;
              drawX = -(drawW / 2);
              drawY = -a.h / 2;
            }
            
            // Add a subtle background to prevent blue screen when overlapping
            if (drawW < a.w || drawH < a.h) {
              // Fill the bounds with a neutral background when image doesn't fill the entire area
              captureCtx.fillStyle = 'rgba(245, 245, 245, 0.05)';
              captureCtx.fillRect(-a.w / 2, -a.h / 2, a.w, a.h);
            }
            
            captureCtx.drawImage(aImg, drawX, drawY, drawW, drawH);
            captureCtx.restore();
            resolve();
          };
          
          aImg.onerror = (error) => {
            console.warn('Failed to load asset image:', error);
            // Draw a placeholder rectangle when image fails to load
            captureCtx.save();
            captureCtx.fillStyle = 'rgba(200, 200, 200, 0.3)';
            captureCtx.fillRect(a.x, a.y, a.w, a.h);
            captureCtx.strokeStyle = 'rgba(150, 150, 150, 0.5)';
            captureCtx.strokeRect(a.x, a.y, a.w, a.h);
            captureCtx.restore();
            resolve();
          };
          
          aImg.src = assetUrl;
        });
      }

      // Draw text elements — raw CSS pixel coords
      const textElements = canvasState.textElements
        .filter(t => t.panelId === activeShotId)
        .sort((a, b) => (a.zIndex ?? 3) - (b.zIndex ?? 3));

      textElements.forEach(text => {
        captureCtx.save();
        // Translate to top-left corner (like CanvasEditor div positioning)
        captureCtx.translate(text.x, text.y + 7);
        captureCtx.rotate(((text.rotation || 0) * Math.PI) / 180);
        captureCtx.scale(text.flipX ? -1 : 1, text.flipY ? -1 : 1);

        if (text.backgroundColor) {
          captureCtx.fillStyle = text.backgroundColor;
          captureCtx.fillRect(0, 0, text.w, text.h);
        }

        const textPad = 4;
        const tLineH = text.fontSize * 1.3;
        const tLines = text.text.split("\n");
        captureCtx.font = `${text.fontStyle||"normal"} ${text.fontWeight||"normal"} ${text.fontSize}px ${text.fontFamily||"Arial"}`;
        captureCtx.textAlign = "left";
        captureCtx.textBaseline = "top";

        // Check if border properties exist - handle different property names and formats
        const borderWidth = text.borderWidth || text['border-width'] || 0;
        const borderColor = text.borderColor || text['border-color'] || '#000000';
        const hasBorder = borderWidth && borderWidth > 0;
        
                
        if (hasBorder) {
          // Draw border for each line individually to avoid overlap issues
          const bw = borderWidth as number;
          captureCtx.fillStyle = borderColor as string;
          tLines.forEach((line, i) => {
            const y = textPad + i*tLineH;
            // Draw 4 offset copies for border effect
            captureCtx.fillText(line, textPad - bw, y);     // left
            captureCtx.fillText(line, textPad + bw, y);     // right
            captureCtx.fillText(line, textPad, y - bw);     // top
            captureCtx.fillText(line, textPad, y + bw);     // bottom
          });
        }
        captureCtx.fillStyle = text.color;
        tLines.forEach((line, i) => captureCtx.fillText(line, textPad, textPad+i*tLineH));
        captureCtx.restore();
      });

      // Convert to base64
      const canvasDataUrl = captureCanvas.toDataURL('image/png', 1.0);
      
      // Add the generated image to the panel (newest first)
      setGeneratedImages(prev => [canvasDataUrl, ...prev]);
      setShowGenPanel(true);

      console.log("Generated image with text bubbles and assets");

    } catch (err) {
      console.error("Full error details:", err);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err && typeof err === 'object' ? (err as any).constructor?.name : 'unknown');
      console.error("Error message:", err && typeof err === 'object' ? (err as any).message : 'unknown');
      console.error("Error stack:", err && typeof err === 'object' ? (err as any).stack : 'unknown');
      
      const msg = err instanceof Error ? err.message : 
                  err && typeof err === 'object' ? JSON.stringify(err) : 
                  String(err);
      setInpaintError(msg || "Unknown error occurred during image generation");
      console.error("Generate image error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  // ── Rectangle Inpaint via n8n ───────────────────────────────────────────────
  // Helper function to convert blob URL to base64
  const convertBlobUrlToBase64 = async (blobUrl: string): Promise<string> => {
    if (!blobUrl.startsWith("blob:")) {
      return blobUrl; // Already not a blob URL
    }
    
    try {
      const response = await fetch(blobUrl);
      const blob = await response.blob();
      return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const result = reader.result as string;
          resolve(result);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });
    } catch (error) {
      console.error("[rectInpaint] Failed to convert blob URL to base64:", error);
      throw error;
    }
  };

  const runRectangleInpaint = async () => {
    // Use ImageAI Panel data when in area-edit mode, otherwise use rectangle panel data
    const promptToUse = aiEditMode === "area-edit" ? (promptText.trim() || "Generate image in square area") : inpaintPrompt;
    
    // Convert reference images from blob URLs to base64 for server-side upload
    let refImagesToUse: string[] = [];
    if (aiEditMode === "area-edit") {
      console.log("[rectInpaint] Converting", aiRefImages.length, "reference images from blob URLs to base64...");
      refImagesToUse = await Promise.all(
        aiRefImages.map(async (img) => {
          const base64 = await convertBlobUrlToBase64(img.url);
          console.log("[rectInpaint] Converted reference image:", img.id, base64.substring(0, 50) + "...");
          return base64;
        })
      );
    } else {
      refImagesToUse = imageReferenceImages;
    }
    
    console.log("[runRectangleInpaint] Raw promptText:", promptText);
    console.log("[runRectangleInpaint] Final promptToUse:", promptToUse);
    
    if (!rectangle || !promptToUse.trim()) {
      console.log("[runRectangleInpaint] Missing data - Rectangle:", !!rectangle, "Prompt:", !!promptToUse.trim());
      console.log("[runRectangleInpaint] Rectangle state:", rectangle);
      return;
    }

    setIsInpainting(true);
    setInpaintError(null);
    
    console.log("[runRectangleInpaint] Mode:", aiEditMode);
    console.log("[runRectangleInpaint] Using prompt:", `"${promptToUse}"`);
    console.log("[runRectangleInpaint] Prompt length:", promptToUse.length);
    console.log("[runRectangleInpaint] Reference images:", refImagesToUse.length);
    console.log("[runRectangleInpaint] Model:", aiModel);

    try {
      // 1. Get the original image
      const imageUrl = backgroundImage || activeShot?.imageUrl;
      if (!imageUrl) throw new Error("No image available");

      // 2. Convert to base64 if needed
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        const res = await fetch(validUrl, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        const blob = await res.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // 3. Get canvas display size for coordinate scaling
      const canvasEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]');
      const canvasRect = canvasEl?.getBoundingClientRect();
      const canvasDisplaySize = canvasRect
        ? { width: canvasRect.width, height: canvasRect.height }
        : undefined;

      // Determine if this is square mode or rectangle mode
      const isSquareMaskActive = canvasTool === "rectInpaint" && isSquareMode;
      const isRectangleMaskActive = canvasTool === "rectInpaint" && !isSquareMode;
      
      console.log("[rectInpaint] Step 1: Preparing image data...");
      console.log("[rectInpaint] Square mode:", isSquareMode);
      console.log("[rectInpaint] Rectangle mask active:", isRectangleMaskActive);
      
      let requestBody: any = {
        prompt: promptToUse,
        model: aiEditMode === "area-edit" ? aiModel : inpaintModel,
      };
      
      console.log("[rectInpaint] Using model:", aiEditMode === "area-edit" ? aiModel : inpaintModel);
      console.log("[rectInpaint] Request prompt:", requestBody.prompt);
      console.log("[rectInpaint] Request body keys:", Object.keys(requestBody));

      if (isSquareMaskActive) {
        // Square mode: crop square on frontend, send to model, then composite back
        console.log("[rectInpaint] Square mode: cropping square on frontend");
        
        // Step 1: Crop square region from full image
        const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
        console.log("[rectInpaint] Square cropped, sending to model");
        
        // Step 2: Send cropped square to model (NO reference images for square mode)
        requestBody.image = croppedImage;
        requestBody.isSquareMode = true;
        requestBody.rectangle = rectangle;
        requestBody.canvasDisplaySize = canvasDisplaySize;
        
        // IMPORTANT: Square mode does NOT use reference images
        console.log("[rectInpaint] Square mode: NOT using reference images");
      } else if (isRectangleMaskActive) {
        // Rectangle mask mode: crop rectangle on frontend, send to model with reference images
        console.log("[rectInpaint] Rectangle mask mode: cropping rectangle on frontend");
        
        // Step 1: Crop rectangle region from full image
        const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
        console.log("[rectInpaint] Rectangle cropped, sending to model with reference images");
        
        // Step 2: Send cropped rectangle to model WITH reference images
        requestBody.image = croppedImage;
        requestBody.isRectangleMask = true;
        requestBody.rectangle = rectangle;
        requestBody.canvasDisplaySize = canvasDisplaySize;
        
        // Add reference images for rectangle mask mode
        if (refImagesToUse.length > 0) {
          requestBody.referenceImages = refImagesToUse;
          console.log("[rectInpaint] Adding", refImagesToUse.length, "reference images for rectangle mask");
        } else {
          console.log("[rectInpaint] No reference images available for rectangle mask");
        }
      } else {
        // Normal mode: crop and send cropped image
        const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
        console.log("[rectInpaint] Cropped image size:", croppedImage.length);
        requestBody.image = croppedImage;
        
        // Add reference images for normal mode (model-specific)
        if (refImagesToUse.length > 0) {
          // Only add reference images for models that support them
          const modelsWithReferenceSupport = ["gpt-image", "openai-4o", "nano-banana", "nano-banana-edit", "nano-banana-pro"];
          if (modelsWithReferenceSupport.includes(inpaintModel)) {
            requestBody.referenceImages = refImagesToUse;
            console.log("[rectInpaint] Adding", refImagesToUse.length, "reference images for", inpaintModel);
          } else {
            console.log("[rectInpaint] Skipping reference images for", inpaintModel, "(not supported)");
          }
        }
        console.log("[rectInpaint] Sending cropped image for normal mode");
      }

      // OpenAI 4o requires a mask - create a full white mask
      if (inpaintModel === "openai-4o") {
        if (isSquareMode) {
          // Square mode: create mask for the square region
          const maskCanvas = document.createElement("canvas");
          maskCanvas.width = rectangle.width;
          maskCanvas.height = rectangle.height;
          const maskCtx = maskCanvas.getContext("2d");
          if (maskCtx) {
            maskCtx.fillStyle = "white";
            maskCtx.fillRect(0, 0, rectangle.width, rectangle.height);
          }
          const maskData = maskCanvas.toDataURL();
          requestBody.mask = maskData;
        } else {
          // Normal mode: create mask for original image
          const maskCanvas = document.createElement("canvas");
          const img = new Image();
          await new Promise<void>((resolve, reject) => {
            img.onload = () => resolve();
            img.onerror = (e) => reject(e);
            img.src = imageBase64;
          });
          maskCanvas.width = img.width;
          maskCanvas.height = img.height;
          const maskCtx = maskCanvas.getContext("2d");
          if (maskCtx) {
            maskCtx.fillStyle = "white";
            maskCtx.fillRect(0, 0, img.width, img.height);
          }
          const maskData = maskCanvas.toDataURL();
          requestBody.mask = maskData;
        }
      }

      // 5. Send request to n8n-image-proxy
      console.log("[rectInpaint] Step 2: Sending to n8n-image-proxy...");
      console.log("[rectInpaint] Complete request body:", {
        prompt: `"${requestBody.prompt}"`, // Show prompt in quotes
        promptLength: requestBody.prompt?.length || 0,
        model: requestBody.model,
        hasImage: !!requestBody.image,
        hasReferenceImages: !!requestBody.referenceImages,
        referenceImageCount: requestBody.referenceImages?.length || 0,
        isSquareMode: !!requestBody.isSquareMode,
        aiEditMode: aiEditMode,
        rawPromptText: `"${promptText}"`, // Show raw prompt from ImageAI Panel textarea
        finalPromptToUse: `"${promptToUse}"`, // Show final prompt in quotes
        squareModeNoRefImages: isSquareMode ? "Square mode does NOT use reference images" : "Normal mode may use reference images"
      });
      
      // Also log the exact JSON being sent
      console.log("[rectInpaint] Request JSON (first 500 chars):", JSON.stringify(requestBody).substring(0, 500) + "...");
      
      // Log the prompt that will be sent to the model
      console.log("[rectInpaint] PROMPT BEING SENT TO MODEL:", `"${requestBody.prompt}"`);
      console.log("[rectInpaint] PROMPT LENGTH:", requestBody.prompt?.length || 0);
      
      const response = await fetch("/api/n8n-image-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(300000),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.log("[rectInpaint] Error response (raw):", errorText);
        
        let err;
        try {
          err = JSON.parse(errorText);
        } catch {
          // If it's not JSON, create a simple error object
          err = { error: errorText, message: errorText };
        }
        
        throw new Error(err.error || err.message || err.suggestion || "Rectangle inpaint failed");
      }

      const result = await response.json();
      console.log("[rectInpaint] Full KIE response:", JSON.stringify(result, null, 2));
      
      // Debug the image extraction
      console.log("[rectInpaint] result.image:", result.image);
      console.log("[rectInpaint] typeof result.image:", typeof result.image);
      console.log("[rectInpaint] result.image truthy:", !!result.image);
      
      // Handle different response structures from Kie.ai API
      const generatedImageUrl = result.image && result.image !== "" ? result.image : 
                              result.url && result.url !== "" ? result.url :
                              result.output && result.output !== "" ? result.output :
                              result.data?.outputImageUrl && result.data?.outputImageUrl !== "" ? result.data?.outputImageUrl :
                              result.data?.image_url && result.data?.image_url !== "" ? result.data?.image_url :
                              result.data?.output?.image_url && result.data?.output?.image_url !== "" ? result.data?.output?.image_url :
                              result.data && result.data !== "" ? result.data :
                              null;
      
      console.log("[rectInpaint] Extracted image URL:", generatedImageUrl);
      
      if (!generatedImageUrl) {
        console.error("[rectInpaint] No image found in response. Available keys:", Object.keys(result));
        console.error("[rectInpaint] Response structure:", result);
        console.error("[rectInpaint] result.image value:", result.image);
        console.error("[rectInpaint] result.image type:", typeof result.image);
        console.error("[rectInpaint] result.image truthy:", !!result.image);
        throw new Error("No image returned from KIE");
      }

      // 6. Load the generated image and resolve to base64 if it's a URL
      let generatedBase64 = generatedImageUrl;
      if (generatedImageUrl.startsWith("http")) {
        try {
          const genRes = await fetch(generatedImageUrl, { mode: 'cors', cache: 'no-cache' });
          if (genRes.ok) {
            const genBlob = await genRes.blob();
            generatedBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(genBlob);
            });
          }
        } catch { /* use URL directly if fetch fails */ }
      }

      // 7. Composite: draw original image, then paste generated image into the rectangle area
      console.log("[rectInpaint] Step 3: Combining generated image back into original...");
      
      let finalImage = generatedBase64;
      
      // For square mode, we need to composite the generated square back into the original image
      if (isSquareMode) {
        console.log("[rectInpaint] Square mode: compositing generated square back into original");
        finalImage = await new Promise<string>((resolve, reject) => {
          const origImg = new Image();
          origImg.crossOrigin = "anonymous";
          origImg.onload = () => {
            const genImg = new Image();
            genImg.crossOrigin = "anonymous";
            genImg.onload = () => {
              // Canvas at original image natural dimensions
              const canvas = document.createElement("canvas");
              canvas.width = origImg.naturalWidth;
              canvas.height = origImg.naturalHeight;
              const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Cannot get canvas context")); return; }

            // Draw full original image
            ctx.drawImage(origImg, 0, 0);

            // IMPORTANT: Use the same scaling logic as cropImageToRectangle to avoid distortion
            let destRect = { ...rectangle };
            if (canvasDisplaySize && canvasDisplaySize.width > 0 && canvasDisplaySize.height > 0) {
              const containerW = canvasDisplaySize.width;
              const containerH = canvasDisplaySize.height;

              // Calculate how the image is rendered inside the container (object-contain logic)
              const imgAspect = origImg.naturalWidth / origImg.naturalHeight;
              const containerAspect = containerW / containerH;

              let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
              if (imgAspect > containerAspect) {
                // Image is wider relative to container → pillarbox (black bars top/bottom)
                renderedW = containerW;
                renderedH = containerW / imgAspect;
                offsetX = 0;
                offsetY = (containerH - renderedH) / 2;
              } else {
                // Image is taller relative to container → letterbox (black bars left/right)
                renderedH = containerH;
                renderedW = containerH * imgAspect;
                offsetX = (containerW - renderedW) / 2;
                offsetY = 0;
              }

              const scaleX = origImg.naturalWidth / renderedW;
              const scaleY = origImg.naturalHeight / renderedH;

              // Subtract letterbox offset before scaling (same as cropImageToRectangle)
              destRect = {
                x: (rectangle.x - offsetX) * scaleX,
                y: (rectangle.y - offsetY) * scaleY,
                width: rectangle.width * scaleX,
                height: rectangle.height * scaleY,
              };
              
              console.log("[rectInpaint] Compositing details:", {
                canvasDisplaySize,
                origImgSize: { width: origImg.naturalWidth, height: origImg.naturalHeight },
                scale: { x: scaleX, y: scaleY },
                rectangle,
                destRect,
                genImgSize: { width: genImg.naturalWidth, height: genImg.naturalHeight }
              });
            } else {
              // Fallback: simple scaling if no canvas display size
              const scaleX = origImg.naturalWidth  / (canvasDisplaySize?.width  ?? 800);
              const scaleY = origImg.naturalHeight / (canvasDisplaySize?.height ?? 450);
              destRect = {
                x: rectangle.x * scaleX,
                y: rectangle.y * scaleY,
                width: rectangle.width * scaleX,
                height: rectangle.height * scaleY,
              };
              
              console.log("[rectInpaint] Compositing details (fallback):", {
                canvasDisplaySize,
                origImgSize: { width: origImg.naturalWidth, height: origImg.naturalHeight },
                scale: { x: scaleX, y: scaleY },
                rectangle,
                destRect,
                genImgSize: { width: genImg.naturalWidth, height: genImg.naturalHeight }
              });
            }

            // CRITICAL: Use the calculated destRect to avoid stretching
            // The generated image should have the same aspect ratio as the cropped area
            ctx.drawImage(genImg, destRect.x, destRect.y, destRect.width, destRect.height);

            const combined = canvas.toDataURL("image/png");
            console.log("[rectInpaint] Step 3 done: Combined image created");
            resolve(combined);
          };
          genImg.onerror = () => reject(new Error("Failed to load generated image"));
          genImg.src = generatedBase64;
        };
        origImg.onerror = () => reject(new Error("Failed to load original image"));
        origImg.src = imageBase64;
      });
      } else {
        // Rectangle mode: composite the generated image back into the original
        console.log("[rectInpaint] Rectangle mode: compositing generated image back into original");
        finalImage = await new Promise<string>((resolve, reject) => {
          const origImg = new Image();
          origImg.crossOrigin = "anonymous";
          origImg.onload = () => {
            const genImg = new Image();
            genImg.crossOrigin = "anonymous";
            genImg.onload = () => {
              // Canvas at original image natural dimensions
              const canvas = document.createElement("canvas");
              canvas.width = origImg.naturalWidth;
              canvas.height = origImg.naturalHeight;
              const ctx = canvas.getContext("2d");
              if (!ctx) { reject(new Error("Cannot get canvas context")); return; }

              // Draw full original image
              ctx.drawImage(origImg, 0, 0);

              // Calculate destination rectangle for the generated image
              let destRect = { ...rectangle };
              if (canvasDisplaySize && canvasDisplaySize.width > 0 && canvasDisplaySize.height > 0) {
                const scaleX = origImg.naturalWidth / canvasDisplaySize.width;
                const scaleY = origImg.naturalHeight / canvasDisplaySize.height;
                destRect = {
                  x: rectangle.x * scaleX,
                  y: rectangle.y * scaleY,
                  width: rectangle.width * scaleX,
                  height: rectangle.height * scaleY,
                };
              }

              // Draw generated image into the rectangle area
              ctx.drawImage(genImg, destRect.x, destRect.y, destRect.width, destRect.height);

              const combined = canvas.toDataURL("image/png");
              console.log("[rectInpaint] Rectangle mode: Combined image created");
              resolve(combined);
            };
            genImg.onerror = () => reject(new Error("Failed to load generated image"));
            genImg.src = generatedBase64;
          };
          origImg.onerror = () => reject(new Error("Failed to load original image"));
          origImg.src = imageBase64;
        });
      }

      // 8. Show generated images for debugging and update background
      console.log("[rectInpaint] Step 4: Updating background image...");
      console.log("[rectInpaint] Final image type:", isSquareMode ? "combined" : "generated");
      console.log("[rectInpaint] Final image length:", finalImage.length);
      
      // For debugging: Show both generated image and combined image
      const imagesToAdd: string[] = [];
      
      if (isSquareMode) {
        // Add the generated square image (before combining)
        imagesToAdd.push(generatedBase64);
        console.log("[rectInpaint] Debug: Added generated square image to container");
        console.log("[rectInpaint] Debug: Generated square image size:", generatedBase64.length, "characters");
        
        // Log image dimensions for debugging
        const genImg = new Image();
        genImg.onload = () => {
          console.log("[rectInpaint] Debug: Generated square dimensions:", genImg.naturalWidth, "x", genImg.naturalHeight);
        };
        genImg.src = generatedBase64;
      }
      
      // Add the final combined image
      imagesToAdd.push(finalImage);
      console.log("[rectInpaint] Debug: Added final combined image to container");
      console.log("[rectInpaint] Debug: Final combined image size:", finalImage.length, "characters");
      
      // Add all images to generated container (newest first)
      setGeneratedImages(prev => [...imagesToAdd, ...prev]);
      setShowGenPanel(true);
      
      // Update background to the final result
      setBackgroundImage(finalImage);
      console.log("[rectInpaint] ✅ Done - final image set as background");
      console.log("[rectInpaint] Debug: Square mask position preserved for debugging");
      console.log("[rectInpaint] Debug: Rectangle position after generation:", rectangle);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setInpaintError(msg);
      console.error("Rectangle inpaint error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  // ── Inpaint via n8n ───────────────────────────────────────────────────────
  const runInpaint = async () => {
    const mask = canvasState.mask;
    if (mask.length === 0 || !inpaintPrompt.trim()) return;

    setIsInpainting(true);
    setInpaintError(null);

    try {
      // 1. Get the background image URL
      const imageUrl = backgroundImage || activeShot?.imageUrl;
      if (!imageUrl) throw new Error("No background image to inpaint");

      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // 2. Convert background image to base64
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // 3. Render mask dots to a canvas and export as base64
      const canvasEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]');
      const rect = canvasEl?.getBoundingClientRect();
      const w = rect?.width ?? 800;
      const h = rect?.height ?? 450;

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w;
      maskCanvas.height = h;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");
      // OpenAI inpaint mask: opaque (white) = keep, transparent = edit/inpaint
      // Fill all white (keep everything), then cut out painted dots (make transparent)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
      for (const dot of mask) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      const maskBase64 = maskCanvas.toDataURL("image/png");

      // 4. Send to n8n via API route
      const response = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          mask: maskBase64,
          prompt: inpaintPrompt,
          model: inpaintModel,
        }),
      });

      const result = await response.json();
      
      // 5. Store result in the generated images panel (newest first)
      const resultImage = result.image ?? result.url ?? result.output ?? result.data;
      if (resultImage) {
        setGeneratedImages(prev => [resultImage, ...prev]); // Prepend to beginning
        setShowGenPanel(true);
        setCanvasState(prev => ({ ...prev, mask: [] }));
      } else {
        throw new Error("No image returned");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setInpaintError(msg);
      console.error("Inpaint error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  // Helper functions for image processing
  const convertToWebP = async (imageUrl: string, quality: number = 0.8): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/webp", quality));
        } else {
          reject(new Error("Cannot get canvas context"));
        }
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const convertMaskToWebP = async (mask: Array<{ x: number; y: number; r?: number }>, imageUrl: string, quality: number = 0.8): Promise<string> => {
    // Load the original image to get dimensions
    const img = new Image();
    img.crossOrigin = "anonymous";
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
      img.src = imageUrl;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.width;
    canvas.height = img.height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Cannot get canvas context");

    // Create black background
    ctx.fillStyle = "black";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw white circles for mask dots
    ctx.fillStyle = "white";
    const scaleX = canvas.width / 800; // Assuming original canvas is 800px wide
    const scaleY = canvas.height / 450; // Assuming original canvas is 450px high
    
    for (const dot of mask) {
      ctx.beginPath();
      ctx.arc(dot.x * scaleX, dot.y * scaleY, (dot.r || 15) * Math.min(scaleX, scaleY), 0, Math.PI * 2);
      ctx.fill();
    }

    return canvas.toDataURL("image/webp", quality);
  };

  const uploadImageToServer = async (base64Image: string): Promise<string> => {
    // Convert base64 to blob
    const response = await fetch(base64Image);
    const blob = await response.blob();
    
    // Create FormData
    const formData = new FormData();
    formData.append('file', blob, `image-${Date.now()}.webp`);
    
    // Upload to server (you'll need to implement this endpoint)
    const uploadResponse = await fetch('/api/upload', {
      method: 'POST',
      body: formData
    });
    
    if (!uploadResponse.ok) {
      throw new Error('Upload failed');
    }
    
    const result = await uploadResponse.json();
    return result.url;
  };

  // New Character Edit inpaint function - uses direct KIE API
  const runCharacterEditInpaint = async (referenceImages?: string[], promptOverride?: string) => {
    console.log("[brushCharacterEdit] Starting runCharacterEditInpaint");
    console.log("[brushCharacterEdit] Reference images:", referenceImages);
    
    const mask = canvasState.mask;
    const promptToUse = promptOverride || imageInpaintPrompt;
    
    if (mask.length === 0 || !promptToUse.trim()) {
      console.log("[brushCharacterEdit] Missing mask or prompt");
      console.log("[brushCharacterEdit] Mask length:", mask.length);
      console.log("[brushCharacterEdit] promptToUse:", promptToUse);
      return;
    }
    
    console.log("[brushCharacterEdit] Mask points:", mask.length);
    console.log("[brushCharacterEdit] Prompt:", promptToUse);

    setIsInpainting(true);
    setInpaintError(null);

    try {
      // 1. Get the background image URL (same as rectangle inpaint)
      const imageUrl = backgroundImage || activeShot?.imageUrl;
      if (!imageUrl) throw new Error("No background image to inpaint");

      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // 2. Convert to base64 if needed (same as rectangle inpaint)
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        const res = await fetch(validUrl, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        const blob = await res.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // 3. Create Character Edit mask: composite image with colored overlay (like working sample)
      const canvasEl = canvasContainerRef.current?.querySelector('canvas') as HTMLCanvasElement;
      if (!canvasEl) throw new Error("Cannot find canvas element");
      
      // Get original image dimensions (not canvas dimensions)
      const img = new Image();
      img.crossOrigin = "anonymous";
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = imageBase64;
      });
      const w = img.width;
      const h = img.height;

      // Create canvas with same dimensions as main image (required by Character Edit)
      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w;
      maskCanvas.height = h;
      const ctx = maskCanvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) throw new Error("Cannot get canvas context");
      
      // Create pure black and white mask (required by Character Edit)
      // Fill with black first
      ctx.fillStyle = "black";
      ctx.fillRect(0, 0, w, h);
      
      // Draw the blue mask overlay on top
      ctx.drawImage(canvasEl, 0, 0, w, h);
      
      // Get image data to detect blue mask and convert to pure black/white
      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;
      
      // Convert blue mask to pure white, everything else to pure black
      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];
        const a = data[i + 3];
        
        // Detect blue mask (high blue, low red/green, with some alpha)
        if (b > 150 && r < 150 && g < 150 && a > 50) {
          // Set to pure white for masked areas
          data[i] = 255;     // R = white
          data[i + 1] = 255; // G = white
          data[i + 2] = 255; // B = white
          data[i + 3] = 255; // A = opaque
        } else {
          // Set to pure black for non-masked areas
          data[i] = 0;       // R = black
          data[i + 1] = 0;   // G = black
          data[i + 2] = 0;   // B = black
          data[i + 3] = 255; // A = opaque
        }
      }
      
      // Put the enhanced image data back
      ctx.putImageData(imageData, 0, 0);
      
      // Convert all images to WebP format like working examples
      const maskBase64 = maskCanvas.toDataURL("image/webp", 0.8);
      console.log("[brushCharacterEdit] Mask base64 size:", maskBase64.length, "characters");

      // Convert main image to WebP
      const imageWebpBase64 = await new Promise<string>((resolve) => {
        const img = new Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL("image/webp", 0.8));
          }
        };
        img.src = imageBase64;
      });

      // Convert reference images to WebP (use provided referenceImages or fallback to refImages)
      const refImagesToUse = referenceImages || refImages;
      const refWebpImages = await Promise.all(
        refImagesToUse.map(img => convertToWebP(img, 0.8))
      );

      // Upload images to get URLs
      const uploadedImageUrl = await uploadImageToServer(imageWebpBase64);
      const uploadedMaskUrl = await uploadImageToServer(maskBase64);
      const uploadedRefUrls = await Promise.all(
        refWebpImages.map(img => uploadImageToServer(img))
      );

      console.log("[brushCharacterEdit] Uploading images complete:", {
        imageUrl: uploadedImageUrl,
        maskUrl: uploadedMaskUrl,
        refUrls: uploadedRefUrls
      });

      // Use the proxy like other models do
      const proxyRequestBody = {
        prompt: promptToUse,
        model: 'character-edit',  // Use frontend model name, proxy will map to ideogram/character-edit
        image: imageWebpBase64,
        mask: maskBase64,
        referenceImages: refWebpImages.length > 0 ? refWebpImages : undefined,
      };

      console.log("[brushCharacterEdit] Sending to n8n-image-proxy:", {
        model: 'character-edit',
        prompt: promptToUse,
        hasImage: !!imageWebpBase64,
        hasMask: !!maskBase64,
        hasReferenceImages: refWebpImages.length > 0,
        imageLength: imageWebpBase64?.length,
        maskLength: maskBase64?.length,
        refImagesCount: refWebpImages.length
      });

      const response = await fetch("/api/n8n-image-proxy", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proxyRequestBody),
        signal: AbortSignal.timeout(300000),
      });

      console.log("[brushCharacterEdit] Proxy response status:", response.status);
      console.log("[brushCharacterEdit] Proxy response ok:", response.ok);

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || err.suggestion || "Character Edit inpaint failed");
      }

      const result = await response.json();
      const generatedImageUrl = result.image ?? result.url ?? result.output ?? result.data;
      
      if (!generatedImageUrl) throw new Error("No image returned from Character Edit");
      console.log("[brushCharacterEdit] Got generated image from proxy");

      // Convert to base64 if needed
      let generatedBase64 = generatedImageUrl;
      if (generatedImageUrl.startsWith("http")) {
        const imgRes = await fetch(generatedImageUrl);
        if (!imgRes.ok) throw new Error(`Failed to fetch generated image: ${imgRes.status}`);
        const imgBlob = await imgRes.blob();
        generatedBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(imgBlob);
        });
      }

      setGeneratedImages(prev => [generatedBase64, ...prev]);
      setShowGenPanel(true);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      
      if (msg.includes("KIE_AI_API_KEY not configured")) {
        setInpaintError("AI service not configured. Please contact administrator to set up the API key.");
      } else if (msg.includes("Authentication failed") || msg.includes("Unauthorized")) {
        setInpaintError("API authentication failed. The API key may be invalid, expired, or incorrectly formatted.");
      } else if (msg.includes("401")) {
        setInpaintError("API access denied. Please verify your API key is valid and has the necessary permissions.");
      } else if (msg.includes("403")) {
        setInpaintError("API access forbidden. Your API key may not have permission to use this service.");
      } else if (msg.includes("429")) {
        setInpaintError("API rate limit exceeded. Please wait a moment and try again.");
      } else if (msg.includes("500")) {
        setInpaintError("API server error. Please try again later or contact support if the issue persists.");
      } else {
        setInpaintError(msg);
      }
      
      console.error("Character Edit inpaint error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  // Navigation functions
  const goTo = (shotId: string) => {
    setActiveShotId(shotId);
  };

  const goPrev = () => {
    const currentIndex = shots.findIndex(s => s.id === activeShotId);
    if (currentIndex > 0) {
      setActiveShotId(shots[currentIndex - 1].id);
    }
  };

  const goNext = () => {
    const currentIndex = shots.findIndex(s => s.id === activeShotId);
    if (currentIndex < shots.length - 1) {
      setActiveShotId(shots[currentIndex + 1].id);
    }
  };

  // Helper functions that were removed but needed - functions restored
  const saveField = (field: "voice" | "notes" | "action") => {
    if (!editingField || !activeShotId) return;
    const map = { voice: "voiceOver", notes: "notes", action: "action" } as const;
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, [map[field]]: fieldDraft } : s));
    setEditingField(null);
  };

  const startEdit = (field: "voice" | "notes" | "action") => {
    const map = { voice: "voiceOver", notes: "notes", action: "action" } as const;
    setFieldDraft(activeShot[map[field]] || "");
    setEditingField(field);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const nc: CommentItem = { id: `cm${Date.now()}`, author: "You", avatar: "Y", text: commentText, timestamp: "Just now" };
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, comments: [...s.comments, nc] } : s));
    setCommentText("");
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const nt: TagType = { id: `tg${Date.now()}`, name: newTagName, color: newTagColor };
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, tags: [...s.tags, nt] } : s));
    setNewTagName("");
    setShowTagPicker(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, tags: s.tags.filter(t => t.id !== tagId) } : s));
  };

  const handleRefUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map(f => URL.createObjectURL(f));
    setRefImages(prev => [...prev, ...urls]);
  };

  const allComments = shots.flatMap(s => s.comments);

  if (!activeShot) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/6 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-white/10" />
        <span className="text-white font-semibold text-sm">
          {String(activeIdx + 1).padStart(2, "0")}
        </span>
        {activeShot.tags.map(t => (
          <span key={t.id} className="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: t.color + "cc" }}>
            {t.name}
          </span>
        ))}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-xs">Aspect</span>
          <select
            value={activeShot.aspectRatio || "16:9"}
            onChange={(e) => {
              const newAspectRatio = e.target.value;
              onShotsChange(shots.map(s => 
                s.id === activeShotId 
                  ? { ...s, aspectRatio: newAspectRatio }
                  : s
              ));
            }}
            className="bg-white/5 border border-white/10 text-gray-300 text-xs rounded px-2 py-1 focus:outline-none focus:border-blue-500"
          >
            <option value="16:9">16:9</option>
            <option value="9:16">9:16</option>
            <option value="1:1">1:1</option>
          </select>
        </div>
        <button
          onClick={() => setShowInfoDialog(true)}
          className="px-2 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition flex items-center gap-1"
          title="Frame Information"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button 
          onClick={() => {
            try {
              const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
              if (!container) {
                alert('Canvas not found');
                return;
              }
              
              const canvas = document.createElement('canvas');
              const ctx = canvas.getContext('2d');
              if (!ctx) {
                alert('Canvas context not available');
                return;
              }
              
              const rect = container.getBoundingClientRect();
              canvas.width = rect.width;
              canvas.height = rect.height;
              
              // Fill with background color
              ctx.fillStyle = '#13131a';
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // Try to find and draw the image
              const img = container.querySelector('img');
              if (img && img.src) {
                const tempImg = new Image();
                tempImg.crossOrigin = 'anonymous';
                tempImg.onload = () => {
                  ctx.drawImage(tempImg, 0, 0, rect.width, rect.height);
                  downloadCanvas(canvas);
                };
                tempImg.onerror = () => {
                  // If image fails, just download the canvas as-is
                  downloadCanvas(canvas);
                };
                tempImg.src = img.src;
              } else {
                // No image, just download the canvas
                downloadCanvas(canvas);
              }
              
              function downloadCanvas(c: HTMLCanvasElement) {
                const link = document.createElement('a');
                link.download = `frame-${String(activeIdx + 1).padStart(2, "0")}.png`;
                link.href = c.toDataURL('image/png', 1.0);
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              }
            } catch (error) {
              console.error('Download failed:', error);
              alert('Download failed. Please try again.');
            }
          }}
          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition flex items-center gap-1.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4h4" />
          </svg>
          Download
        </button>
        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">Save</button>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Center: large image */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Top Right Controls */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
            {/* Generated Images Button */}
            <button
              onClick={() => {
                setGeneratedImagesPanelOpen(!generatedImagesPanelOpen);
                setTimelinePanelOpen(false); // Close timeline when opening generated images
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-sm transition backdrop-blur-sm ${
                generatedImagesPanelOpen ? 'bg-blue-600/80' : 'bg-black/50 hover:bg-black/80'
              }`}
              title="View Generated Images"
              aria-label="View Generated Images"
            >
              <Image className="w-4 h-4" />
              <span>Generated</span>
            </button>
            
            {/* Timeline Button */}
            <button
              onClick={() => {
                setTimelinePanelOpen(!timelinePanelOpen);
                setGeneratedImagesPanelOpen(false); // Close generated images when opening timeline
              }}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-sm transition backdrop-blur-sm ${
                timelinePanelOpen ? 'bg-blue-600/80' : 'bg-black/50 hover:bg-black/80'
              }`}
              title="View Timeline"
              aria-label="View Timeline"
            >
              <Clock className="w-4 h-4" />
              <span>Timeline</span>
            </button>
            
            {/* AI Panel Switcher Button */}
            <button
              onClick={() => setActiveAIPanel(activeAIPanel === 'image' ? 'video' : 'image')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-white text-sm transition backdrop-blur-sm ${
                activeAIPanel === 'video' ? 'bg-purple-600/80' : 'bg-black/50 hover:bg-black/80'
              }`}
              title={`Switch to ${activeAIPanel === 'image' ? 'Video' : 'Image'} AI`}
              aria-label={`Switch to ${activeAIPanel === 'image' ? 'Video' : 'Image'} AI`}
            >
              {activeAIPanel === 'image' ? (
                <>
                  <Video className="w-4 h-4 text-purple-400" />
                  <span>Video AI</span>
                </>
              ) : (
                <>
                  <ImageIcon className="w-4 h-4 text-cyan-400" />
                  <span>Image AI</span>
                </>
              )}
            </button>
          </div>
          <CanvasArea
            activeIdx={activeIdx}
            shots={shots}
            goPrev={goPrev}
            goNext={goNext}
            panelId={panelId}
            backgroundImage={backgroundImage || undefined}
            activeShot={activeShot}
            canvasActiveTool={canvasActiveTool}
            canvasState={canvasState}
            setCanvasState={setCanvasState}
            canvasContainerRef={canvasContainerRef as React.RefObject<HTMLDivElement>}
            generateImageWithElements={generateImageWithElements}
            maskBrushSize={maskBrushSize}
            isEraser={isEraser}
            maskOpacity={maskOpacity}
            hideBrushMask={hideBrushMask}
            setHideBrushMask={setHideBrushMask}
            hiddenIds={hiddenIds}
            setCanvasSelection={setCanvasSelection}
            canvasSelection={canvasSelection}
            onToolSelect={(tool) => {
              setCanvasTool(tool);
            }}
            rectangle={rectangle}
            setRectangle={setRectangle}
            imageIsRectangleVisible={imageIsRectangleVisible}
            canvasTool={canvasTool}
            isAspectRatioAnimating={isAspectRatioAnimating}
            isSquareMode={isSquareMode}
            selectedAspectRatio={rectangleMaskAspectRatio}
            onCropExecute={runCrop}
            onImageLoad={(scale) => {
              fitScaleRef.current = scale;
              setZoomLevel(100);
              // Recenter any active rectangle to the newly-fitted image
              requestAnimationFrame(recenterRectangleIfActive);
            }}
            selectedColor={selectedColor}
            mode={aiEditMode}
          />

          {/* Sliding Panels */}
          {/* Overlay backdrop */}
          {(generatedImagesPanelOpen || timelinePanelOpen) && (
            <div 
              className="absolute inset-0 bg-black/50 z-15"
              onClick={() => {
                setGeneratedImagesPanelOpen(false);
                setTimelinePanelOpen(false);
              }}
            />
          )}
          
          {/* Generated Images Panel */}
          <div className={`absolute top-0 right-0 h-full w-80 bg-[#111118] border-l border-white/6 transform transition-transform duration-300 ease-in-out z-30 ${
            generatedImagesPanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <h3 className="text-white font-medium">Generated Images</h3>
              <button
                onClick={() => setGeneratedImagesPanelOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-full">
              {/* Original Image Section */}
              {(backgroundImage || originalImage || activeShot?.imageUrl) && (
                <div className="mb-6">
                  <h4 className="text-white text-sm font-medium mb-3">Original</h4>
                  <div className="relative group cursor-pointer rounded-lg overflow-hidden border-2 border-gray-700 hover:border-gray-600 transition">
                    <img
                      src={originalImage || backgroundImage || activeShot?.imageUrl}
                      alt="Original"
                      className="w-full h-32 object-cover"
                      onClick={() => {
                        const imgUrl = originalImage || backgroundImage || activeShot?.imageUrl;
                        if (imgUrl) setBackgroundImage(imgUrl);
                      }}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                      <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                    </div>
                  </div>
                </div>
              )}
              
              {/* Generated Images Section */}
              {generatedImages.length > 0 && (
                <div>
                  <h4 className="text-white text-sm font-medium mb-3">
                    Generated ({generatedImages.length})
                  </h4>
                  <div className="space-y-3">
                    {generatedImages.map((imgUrl, i) => (
                      <div key={i} className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                        backgroundImage === imgUrl
                          ? "border-blue-500/50"
                          : "border-gray-700 hover:border-gray-600"
                      }`}>
                        <img
                          src={imgUrl}
                          alt={`Generated ${i + 1}`}
                          className="w-full h-32 object-cover"
                          onClick={() => setBackgroundImage(imgUrl)}
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition flex items-center justify-center">
                          <Eye className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition" />
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setGeneratedImages(prev => prev.filter((_, index) => index !== i));
                          }}
                          className="absolute top-1 right-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                          title="Delete image"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                        {backgroundImage === imgUrl && (
                          <div className="absolute top-1 left-1 w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Empty State */}
              {generatedImages.length === 0 && (!backgroundImage && !originalImage && !activeShot?.imageUrl) && (
                <div className="text-gray-400 text-sm text-center py-8">
                  <Image className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>No images yet</p>
                  <p className="text-xs mt-1">Generate images to see them here</p>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Panel */}
          <div className={`absolute top-0 right-0 h-full w-80 bg-[#111118] border-l border-white/6 transform transition-transform duration-300 ease-in-out z-30 ${
            timelinePanelOpen ? 'translate-x-0' : 'translate-x-full'
          }`}>
            <div className="p-4 border-b border-white/6 flex items-center justify-between">
              <h3 className="text-white font-medium">Timeline</h3>
              <button
                onClick={() => setTimelinePanelOpen(false)}
                className="text-gray-400 hover:text-white transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-4 overflow-y-auto h-full">
              {/* Timeline Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <List className="w-4 h-4 text-pink-400" />
                  <span className="text-pink-400 text-xs font-bold uppercase tracking-wide">Timeline</span>
                </div>
                <div className="text-gray-600 text-xs">{activeIdx + 1}/{shots.length}</div>
              </div>
              
              {/* Shots Grid */}
              <div className="space-y-3">
                {shots.map((shot, idx) => {
                  const isActive = shot.id === activeShotId;
                  const label = shot.description ? shot.description.slice(0, 20) + (shot.description.length > 20 ? "..." : "") : `Frame ${idx + 1}`;
                  return (
                    <div
                      key={shot.id}
                      onClick={() => goTo(shot.id)}
                      className={`relative rounded-lg overflow-hidden border-2 transition cursor-pointer ${
                        isActive ? "border-violet-500 bg-[#1e1e2a]" : "border-transparent bg-[#1a1a24] hover:border-white/20"
                      }`}
                    >
                      <div className="aspect-video bg-[#1e1e2a] flex items-center justify-center relative">
                        {shot.imageUrl
                          ? <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                          : <span className="text-gray-700 text-[10px]">Empty</span>
                        }
                        {shot.tags.length > 0 && (
                          <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: shot.tags[0].color }} />
                        )}
                        {isActive && (
                          <div className="absolute top-1 left-1 w-2 h-2 bg-violet-500 rounded-full" />
                        )}
                      </div>
                      <div className="px-2 py-1.5">
                        <span className={`text-[10px] truncate block ${isActive ? "text-white" : "text-gray-500"}`}>
                          {label}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              
              {/* Add Shot Button */}
              <button className="w-full mt-4 rounded-lg border-2 border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center gap-1 py-3 hover:border-pink-500/40 hover:bg-white/2 transition">
                <Plus className="w-4 h-4 text-pink-400" />
                <span className="text-pink-400 text-[10px] font-medium">Add Shot</span>
              </button>
            </div>
          </div>

          {/* ImageAI Panel container with gaps */}
          <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
            {/* Canvas area with spacing for bottom panel */}
            <div className="flex-1 pt-[50px] pb-[20px] px-[20px] relative">
              {/* ImageAI Panel Toggle Button - Top Left */}
              <button
                onClick={() => setShowImageAIPanel(!showImageAIPanel)}
                className={`absolute top-4 left-4 z-[9999] w-[44px] py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all pointer-events-auto ${
                  showImageAIPanel 
                    ? 'bg-cyan-500/15 text-cyan-300' 
                    : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                }`}
                style={{ pointerEvents: 'auto' }}
              >
                {showImageAIPanel ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                <span className="text-[8px] font-medium leading-none">{showImageAIPanel ? 'Hide' : 'Show'}</span>
              </button>
              
              {/* Brush Mask Toggle Button - Below ImageAI Panel Toggle */}
              {canvasTool === "inpaint" && (
                <button
                  onClick={() => setHideBrushMask(!hideBrushMask)}
                  className={`absolute top-16 left-4 z-[9999] w-[44px] py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all pointer-events-auto ${
                    hideBrushMask 
                      ? 'bg-purple-500/15 text-purple-300' 
                      : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
                  }`}
                  style={{ pointerEvents: 'auto' }}
                  title={hideBrushMask ? "Show brush mask" : "Hide brush mask"}
                  aria-label={hideBrushMask ? "Show brush mask" : "Hide brush mask"}
                >
                  <Paintbrush className="w-4 h-4" />
                  <span className="text-[8px] font-medium leading-none">{hideBrushMask ? 'Show' : 'Hide'}</span>
                </button>
              )}
              
              {/* AI Panel overlay on canvas */}
              {showImageAIPanel && (
                <div className="pointer-events-auto">
                  {activeAIPanel === 'image' ? (
                    <ImageAIPanel
                  mode={aiEditMode}
                  onModeChange={setAiEditMode}
                  onGenerate={async () => {
                    console.log("=== NEW ONGENERATE FUNCTION CALLED ===");
                    console.log("Generate with mode:", aiEditMode, "model:", aiModel);
                    console.log("Available aiRefImages (ImageAI Panel):", aiRefImages);
                    console.log("aiRefImages details:", aiRefImages.map(img => ({ id: img.id, urlLength: img.url.length, preview: img.url.substring(0, 50) + "..." })));
                    console.log("Canvas mask length:", canvasState.mask.length);
                    console.log("Inpaint prompt:", promptText);
                    console.log("Background image:", backgroundImage || activeShot?.imageUrl ? "Available" : "None");
                    
                    // Route to correct generation function based on mode and tool
                    if (aiEditMode === "area-edit") {
                      // Check if we have rectangle mask or square mask
                      const isSquareMaskActive = canvasTool === "rectInpaint" && isSquareMode;
                      const isRectangleMaskActive = canvasTool === "rectInpaint" && !isSquareMode;
                      
                      console.log("=== MASK DETECTION ===");
                      console.log("canvasTool:", canvasTool);
                      console.log("isSquareMode:", isSquareMode);
                      console.log("isSquareMaskActive:", isSquareMaskActive);
                      console.log("isRectangleMaskActive:", isRectangleMaskActive);
                      
                      if (isSquareMaskActive || isRectangleMaskActive) {
                        console.log("=== Using rectangle mask logic for area-edit mode ===");
                        await runRectangleInpaint();
                      } else {
                        console.log("=== Using faceshift logic for area-edit mode ===");
                        // This will be handled by the area-edit logic below
                        generateImageWithElements?.();
                      }
                    } else {
                      console.log("=== Using original function for non-area-edit mode ===");
                      // Other modes use the original function
                      generateImageWithElements?.();
                    }
                  }}
                  credits={20}
                  model={aiModel}
                  onModelChange={setAiModel}
                  referenceImages={aiRefImages}
                  onAddReferenceImage={(file) => {
                    const url = URL.createObjectURL(file);
                    setAiRefImages(prev => [...prev, { id: `ref-${Date.now()}`, url }]);
                  }}
                  onRemoveReferenceImage={(id) => {
                    setAiRefImages(prev => prev.filter(img => img.id !== id));
                  }}
                  userPrompt={promptText}
                  onUserPromptChange={setPromptText}
                  onAddCanvasElement={handleAddCanvasElement}
                  // Brush inpaint props
                  isEraser={isEraser}
                  setIsEraser={setIsEraser}
                  maskBrushSize={maskBrushSize}
                  setMaskBrushSize={setMaskBrushSize}
                  maskOpacity={maskOpacity}
                  setMaskOpacity={setMaskOpacity}
                  canvasState={canvasState}
                  setCanvasState={setCanvasState}
                  selectedColor={selectedColor}
                  setSelectedColor={setSelectedColor}
                  onColorPickerClick={() => {
                    // Directly trigger the CanvasEditor's color picker
                    console.log("Color picker clicked from ImageAIPanel");
                    // The color palette will be shown by CanvasEditor's handleColorPickerClick
                  }}
                  onAspectRatioChange={handleAspectRatioChange}
                  selectedAspectRatio={selectedAspectRatio}
                  onRectangleMaskAspectRatioChange={handleRectangleMaskAspectRatioChange}
                  onToolSelect={(tool) => {
                    if (tool === "pen-brush" || tool === "brush" || tool === "eraser") {
                      setCanvasTool("inpaint");
                    } else if (tool === "crop") {
                      setCanvasTool("crop");
                      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                      if (container) {
                        const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
                        const cRect = container.getBoundingClientRect();
                        const iRect = img?.getBoundingClientRect();
                        
                        // Use the activeShot.aspectRatio from top navigation menu
                        const currentAspectRatio = activeShot?.aspectRatio || "16:9";
                        console.log("🔧 Crop tool using activeShot.aspectRatio:", currentAspectRatio);
                        console.log("🔧 activeShot:", activeShot);
                        
                        // Minimum resolution dimensions (multiply by 10 for minimum size)
                        const minDimensionMap: Record<string, { width: number; height: number }> = {
                          "1:1":  { width: 100, height: 100 },      // 1:1 = 10x10 minimum
                          "3:4":  { width: 30, height: 40 },      // 3:4 = 30x40 minimum  
                          "4:3":  { width: 40, height: 30 },      // 4:3 = 40x30 minimum
                          "16:9": { width: 160, height: 90 },     // 16:9 = 160x90 minimum
                          "9:16": { width: 90, height: 160 },     // 9:16 = 90x160 minimum
                        };
                        
                        // Display dimensions (larger for better visibility)
                        const displayDimensionMap: Record<string, { width: number; height: number }> = {
                          "1:1":  { width: 200, height: 200 },
                          "3:4":  { width: 300, height: 400 },
                          "4:3":  { width: 400, height: 300 },
                          "16:9": { width: 320, height: 180 },
                          "9:16": { width: 180, height: 320 },
                        };
                        
                        const { width: w, height: h } = displayDimensionMap[currentAspectRatio] || displayDimensionMap["16:9"];
                        const cx = iRect ? (iRect.left - cRect.left) + (iRect.width - w) / 2 : (cRect.width - w) / 2;
                        const cy = iRect ? (iRect.top - cRect.top) + (iRect.height - h) / 2 : (cRect.height - h) / 2;
                        setRectangle({ x: cx, y: cy, width: w, height: h });
                        setImageIsRectangleVisible(true);
                        console.log("✅ Crop rectangle created with aspect ratio:", currentAspectRatio, { x: cx, y: cy, width: w, height: h });
                        console.log("🔧 Minimum resolution for this ratio:", minDimensionMap[currentAspectRatio]);
                      }
                    } else if (tool === "rectInpaint") {
                      console.log("🔧 Before setting rectInpaint - current selectedAspectRatio:", selectedAspectRatio);
                      setCanvasTool("rectInpaint");
                      // Create rectangle with 1:1 aspect ratio (200x200) when selecting rectangle mask tool
                      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                      if (container) {
                        const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
                        const cRect = container.getBoundingClientRect();
                        const iRect = img?.getBoundingClientRect();
                        const w = 200; const h = 200; // 1:1 aspect ratio
                        const cx = iRect ? (iRect.left - cRect.left) + (iRect.width - w) / 2 : (cRect.width - w) / 2;
                        const cy = iRect ? (iRect.top - cRect.top) + (iRect.height - h) / 2 : (cRect.height - h) / 2;
                        setRectangle({ x: cx, y: cy, width: w, height: h });
                        setImageIsRectangleVisible(true);
                        setRectangleMaskAspectRatio("1:1"); // Set rectangle mask aspect ratio to 1:1
                        console.log("✅ Created 1:1 rectangle (200x200) for rectInpaint tool:", { x: cx, y: cy, width: w, height: h });
                        console.log("🔧 Set rectangleMaskAspectRatio to 1:1");
                        console.log("🔧 After setting - rectangleMaskAspectRatio should be 1:1");
                      }
                    } else if (tool === "move") {
                      setCanvasTool("move");
                    } else if (tool === "text") {
                      // Handle text tool - set canvasTool to text
                      console.log("Text tool selected - setting canvasTool to text");
                      setCanvasTool("text");
                    } else {
                      // Default case - set canvasTool to the selected tool
                      setCanvasTool(tool as any);
                    }
                  }}
                  onCropRemove={() => {
                    console.log("Removing crop rectangle from canvas");
                    setCanvasTool("elements");
                    // TODO: Clear crop rectangle from canvas
                    // This should remove the crop rectangle overlay
                  }}
                  onCropExecute={async (aspectRatio) => {
                    console.log("🔧 ImageAIPanel onCropExecute called with aspectRatio:", aspectRatio);
                    if (aspectRatio) {
                      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                      if (container) {
                        const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
                        const cRect = container.getBoundingClientRect();
                        const iRect = img?.getBoundingClientRect();
                        const dimensionMap: Record<string, { width: number; height: number }> = {
                          "1:1":  { width: 200, height: 200 },
                          "3:4":  { width: 300, height: 400 },
                          "4:3":  { width: 400, height: 300 },
                          "16:9": { width: 320, height: 180 },
                          "9:16": { width: 180, height: 320 },
                        };
                        console.log("🔧 ImageAIPanel onCropExecute dimensionMap:", dimensionMap);
                        console.log("🔧 ImageAIPanel onCropExecute looking for aspectRatio:", aspectRatio);
                        const selectedDimensions = dimensionMap[aspectRatio];
                        console.log("🔧 ImageAIPanel onCropExecute selectedDimensions:", selectedDimensions);
                        const fallbackDimensions = dimensionMap["16:9"];
                        console.log("🔧 ImageAIPanel onCropExecute fallbackDimensions:", fallbackDimensions);
                        const { width: w, height: h } = selectedDimensions || fallbackDimensions;
                        console.log("🔧 ImageAIPanel onCropExecute final dimensions:", { w, h, aspectRatio });
                        const x = iRect ? (iRect.left - cRect.left) + (iRect.width - w) / 2 : (cRect.width - w) / 2;
                        const y = iRect ? (iRect.top - cRect.top) + (iRect.height - h) / 2 : (cRect.height - h) / 2;
                        setRectangle({ x, y, width: w, height: h });
                        setImageIsRectangleVisible(true);
                        
                        // IMPORTANT: Update rectangleMaskAspectRatio for rectangle mask resizing
                        setRectangleMaskAspectRatio(aspectRatio);
                        console.log("✅ Rectangle mask aspect ratio set to:", aspectRatio, "for resizing");
                      }
                    }
                  }}
                  onSetSquareMode={(isSquare) => {
                    console.log("Setting square mode:", isSquare);
                    setIsSquareMode(isSquare);
                    // When switching to rectangle mode, set size to 300x200
                    if (!isSquare) {
                      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                      if (container) {
                        const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
                        const cRect = container.getBoundingClientRect();
                        const iRect = img?.getBoundingClientRect();
                        const w = 300; const h = 200;
                        const x = iRect ? (iRect.left - cRect.left) + (iRect.width - w) / 2 : (cRect.width - w) / 2;
                        const y = iRect ? (iRect.top - cRect.top) + (iRect.height - h) / 2 : (cRect.height - h) / 2;
                        setRectangle({ x, y, width: w, height: h });
                        setImageIsRectangleVisible(true);
                      }
                    }
                  }}
                  onResetRectangle={() => {
                    const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                    if (container) {
                      const img = container.querySelector('img:not([class*="mask"])') as HTMLImageElement;
                      const cRect = container.getBoundingClientRect();
                      const iRect = img?.getBoundingClientRect();
                      const w = 200; const h = 200;
                      const x = iRect ? (iRect.left - cRect.left) + (iRect.width - w) / 2 : (cRect.width - w) / 2;
                      const y = iRect ? (iRect.top - cRect.top) + (iRect.height - h) / 2 : (cRect.height - h) / 2;
                      setRectangle({ x, y, width: w, height: h });
                      setImageIsRectangleVisible(true);
                    }
                  }}
                  onSetOriginalImage={(imageUrl) => {
                    console.log("Setting uploaded image as original image:", imageUrl);
                    setBackgroundImage(imageUrl);
                    setOriginalImage(imageUrl);
                    setCanvasState(s => ({ ...s, mask: [] }));
                    fitScaleRef.current = 1;
                    setZoomLevel(100);
                  }}
                  backgroundImage={backgroundImage}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                onFitToScreen={handleFitToScreen}
                zoomLevel={zoomLevel}
                />
                  ) : (
                    <VideoAIPanel
                      mode="describe"
                      onModeChange={() => {}}
                      onGenerate={async () => {
                        console.log("=== VIDEO AI GENERATE CALLED ===");
                        console.log("Video generation with prompt:", promptText);
                        // TODO: Implement video generation logic
                      }}
                      userPrompt={promptText}
                      onUserPromptChange={setPromptText}
                      duration={5}
                      onDurationChange={(duration) => console.log("Duration changed:", duration)}
                      resolution="1080p"
                      onResolutionChange={(resolution) => console.log("Resolution changed:", resolution)}
                      style="cinematic"
                      onStyleChange={(style) => console.log("Style changed:", style)}
                      isGenerating={false}
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      {/* Generated Images Panel (shown after inpaint) */}
      {showGenPanel && (
        <div className="w-[130px] border-l border-white/6 bg-[#0d0d14] flex flex-col shrink-0">
          <div className="flex items-center justify-between px-2 py-2 border-b border-white/6">
            <span className="text-[10px] text-gray-400 font-semibold">Generated</span>
            <button onClick={() => setShowGenPanel(false)} className="text-gray-600 hover:text-gray-300 transition">
              <X className="w-3 h-3" />
            </button>
          </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              {/* Original image always at top */}
              {(originalImage || activeShot?.imageUrl) && (
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-600 px-0.5">Original</span>
                  <div className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    backgroundImage === (originalImage || activeShot?.imageUrl)
                      ? "border-blue-500/50"
                      : "border-white/20 hover:border-blue-500/60"
                  }`}
                    onClick={() => setBackgroundImage(originalImage || activeShot?.imageUrl || null)}
                    title="Click to show original image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={originalImage || activeShot?.imageUrl} alt="Original" className="w-full object-contain bg-[#0d0d14]" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition bg-black/60 px-1.5 py-0.5 rounded">Original</span>
                    </div>
                    {backgroundImage === (originalImage || activeShot?.imageUrl) && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Generated results */}
              {generatedImages.length > 0 && (
                <span className="text-[9px] text-gray-600 px-0.5">Generated</span>
              )}
              {generatedImages.map((imgUrl, i) => (
                <div key={i} className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  backgroundImage === imgUrl
                    ? "border-blue-500/50"
                    : "border-transparent hover:border-blue-500/60"
                }`}
                  onClick={() => setBackgroundImage(imgUrl)}
                  title="Click to apply">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={`Generated ${i + 1}`} className="w-full object-contain bg-[#0d0d14]" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition bg-black/60 px-1.5 py-0.5 rounded">Apply</span>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the image click
                      setGeneratedImages(prev => prev.filter((_, index) => index !== i));
                    }}
                    className="absolute top-1 left-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                    title="Delete image">
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {backgroundImage === imgUrl && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

      </div>

      {/* KIE Modal */}
      <AIGenerationModal 
        isOpen={showKIEModal}
        onClose={() => setShowKIEModal(false)}
        onSelectOption={(option) => {
          if (option === 'rectangle-mask') {
            const maskData = sessionStorage.getItem('kieRectangleMask');
            if (maskData) {
              try {
                const data = JSON.parse(maskData);
                console.log('Processing rectangle mask for KIE:', data);
                alert(`Rectangle mask ready for KIE processing:\nImage: ${data.image.substring(0, 50)}...\nRectangle: ${data.rectangle.width}×${data.rectangle.height}\nPrompt: ${data.prompt}`);
              } catch (e) {
                console.error('Failed to process rectangle mask:', e);
              }
            }
          }
          setShowKIEModal(false);
        }}
      />

      {/* Bubble Style Modal */}
      {showBubbleStyleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a24] rounded-xl border border-white/20 p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4">Choose Bubble Style</h3>
            <p className="text-gray-400 text-sm mb-6">Select how you want the text bubbles to blend with the image</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedBubbleStyle("manga");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "manga"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">🎌 Manga Style</div>
                <div className="text-xs text-gray-400 mt-1">Classic manga speech bubbles with sharp edges and clean lines</div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedBubbleStyle("cartoon");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "cartoon"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">🎨 Cartoon Style</div>
                <div className="text-xs text-gray-400 mt-1">Soft, rounded bubbles with playful appearance</div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedBubbleStyle("realistic");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "realistic"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">📷 Realistic Style</div>
                <div className="text-xs text-gray-400 mt-1">Natural-looking bubbles that blend seamlessly with photos</div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedBubbleStyle("custom");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "custom"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">✨ Custom Style</div>
                <div className="text-xs text-gray-400 mt-1">Keep current bubble design and styling</div>
              </button>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBubbleStyleModal(false)}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Info Modal */}
      <UseCaseInfoModal
        isOpen={showInfoModal}
        onClose={() => setShowInfoModal(false)}
        useCaseLabel={(USE_CASES[imageUseCase] ?? USE_CASES["character-design"]).label}
        useCaseEmoji={(USE_CASES[imageUseCase] ?? USE_CASES["character-design"]).emoji}
        refMode={(USE_CASES[imageUseCase] ?? USE_CASES["character-design"]).refMode}
        models={(USE_CASES[imageUseCase] ?? USE_CASES["character-design"]).models}
      />
    </div>
  );
}
