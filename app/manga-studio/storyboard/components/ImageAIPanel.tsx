"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
export type AIEditMode = "describe" | "area-edit" | "annotate";

interface ReferenceImage {
  id: string;
  url: string;
}

export interface ImageAIPanelProps {
  mode: AIEditMode;
  onModeChange: (mode: AIEditMode) => void;
  onGenerate: () => void;
  credits?: number;
  model?: string;
  onModelChange?: (model: string) => void;
  referenceImages?: ReferenceImage[];
  onAddReferenceImage?: (file: File) => void;
  onRemoveReferenceImage?: (id: string) => void;
  isGenerating?: boolean;
  // Brush inpaint integration
  isEraser?: boolean;
  setIsEraser?: (value: boolean) => void;
  maskBrushSize?: number;
  setMaskBrushSize?: (value: number) => void;
  maskOpacity?: number;
  setMaskOpacity?: (value: number) => void;
  canvasState?: {
    mask: Array<{ x: number; y: number }>;
  };
  setCanvasState?: (value: any) => void;
  onToolSelect?: (tool: string) => void;
  onCropRemove?: () => void;
  onCropExecute?: (aspectRatio: string) => void;
  onSetSquareMode?: (isSquare: boolean) => void;
  onResetRectangle?: () => void;
  onSetOriginalImage?: (imageUrl: string) => void;
  onAddCanvasElement?: (file: File) => void; // New prop for adding canvas elements
  backgroundImage?: string | null;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  zoomLevel?: number;
  selectedColor?: string;
  setSelectedColor?: (color: string) => void;
}

// ── Available Models ─────────────────────────────────────────────────
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "nano-banana-1", label: "Nano Banana 1", icon: "G" },
  { id: "stable-diffusion", label: "Stable Diffusion", icon: "S" },
];

// ── Content Type Tabs ────────────────────────────────────────────────
const CONTENT_TYPES = [
  // Removed video, image, character, and audio tabs
];

// ── Toolbar button helper ────────────────────────────────────────────
function ToolBtn({
  active,
  danger,
  onClick,
  title,
  children,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
        active
          ? "bg-gradient-to-r from-cyan-600/30 to-green-600/30 text-cyan-300 shadow-2xl shadow-cyan-400/60 ring-4 ring-cyan-400/40 ring-offset-0"
          : danger
          ? "text-red-500 hover:bg-red-50 hover:text-red-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      }`}
      title={title}
    >
      {children}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────
export function ImageAIPanel({
  mode,
  onModeChange,
  onGenerate,
  credits,
  model = "nano-banana-2",
  onModelChange,
  referenceImages,
  onAddReferenceImage,
  onRemoveReferenceImage,
  isGenerating,
  // Brush inpaint integration
  isEraser,
  setIsEraser,
  maskBrushSize,
  setMaskBrushSize,
  maskOpacity,
  setMaskOpacity,
  canvasState,
  setCanvasState,
  onToolSelect,
  onCropRemove,
  onCropExecute,
  onSetSquareMode,
  onResetRectangle,
  onSetOriginalImage,
  onAddCanvasElement,
  backgroundImage,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  zoomLevel,
  selectedColor,
  setSelectedColor,
}: ImageAIPanelProps) {
  console.log("ImageAIPanel rendering with mode:", mode);
  const [activeTool, setActiveTool] = useState("elements");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [contentType, setContentType] = useState("image");
  const [userPrompt, setUserPrompt] = useState("");
  const [showBrushSizeMenu, setShowBrushSizeMenu] = useState(false);
  const [showCropMenu, setShowCropMenu] = useState(false);
  const [selectedAspectRatio, setSelectedAspectRatio] = useState("16:9");
  const [showInpaintModelDropdown, setShowInpaintModelDropdown] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  // Use existing brush size from props instead of local state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Model options for area-edit mode (filtered by mask type)
  const inpaintModelOptions = activeTool === "square-mask" ? [
    { value: "gpt-image", label: "🟦 GPT Image 1.5", sub: "Square Mode" },
    { value: "nano-banana-edit", label: "🟩 Nano Banana Edit", sub: "Square Mode" },
  ] : activeTool === "rectangle-mask" ? [
    { value: "flux-kontext-pro", label: "Flux Kontext Pro", sub: "Best for rectangle inpainting" },
    { value: "grok", label: "Grok Imagine", sub: "Fast generation" },
    { value: "qwen-z-image", label: "Qwen Z Image", sub: "High quality" },
  ] : (activeTool === "brush" || activeTool === "eraser" || activeTool === "pen-brush") ? [
    { value: "ideogram/character-edit", label: "Character-edit", sub: "Faceshift" },
  ] : [];

  const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];

  // Get current selected model display name
  const getSelectedModelDisplay = () => {
    const selected = inpaintModelOptions.find(m => m.value === model) || inpaintModelOptions[0];
    return selected ? selected.label : "Model";
  };

  // Handle keyboard events for crop removal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && activeTool === 'crop') {
        console.log('Crop removed - Delete key pressed');
        setShowCropMenu(false);
        setActiveTool('elements');
        onCropRemove?.(); // Call parent to remove crop rectangle from canvas
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, onCropRemove]);

  // Clean up images when switching to area-edit mode
  useEffect(() => {
    if (mode === "area-edit" && referenceImages.length > 1) {
      // Keep only the latest image, remove all others
      const latestImage = referenceImages[referenceImages.length - 1];
      const imagesToRemove = referenceImages.slice(0, -1);
      
      imagesToRemove.forEach(img => {
        if (onRemoveReferenceImage) {
          onRemoveReferenceImage(img.id);
        }
      });
    }
  }, [mode, referenceImages, onRemoveReferenceImage]);

  // Left upload handler - changes background/original image only
  const handleLeftImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only set the background/original image, do NOT change reference images
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageUrl = event.target?.result as string;
        if (onSetOriginalImage) {
          onSetOriginalImage(imageUrl);
          console.log("Left upload: Set as background image");
        }
      };
      reader.readAsDataURL(file);
      
      // DO NOT change reference images
      // Reference images should remain completely unchanged
    }
    // Clear the input to prevent duplicate uploads
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  // Right menu upload handler - only changes reference images
  const handleRightImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Only update reference images, do NOT change the original/background image
      if (file && onAddReferenceImage) {
        onAddReferenceImage(file);
        console.log("Right upload: Added to reference images only");
      }
      
      // DO NOT change the original/background image
      // The canvas background should remain unchanged
    }
    // Clear the input to prevent duplicate uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // ── Zoom Functionality ─────────────────────────────────────────────
  const applyZoomToImage = (zoomPercent: number) => {
    // Find the image in the canvas container
    const canvasContainer = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
    if (canvasContainer) {
      const image = canvasContainer.querySelector('img') as HTMLImageElement;
      if (image) {
        const scale = zoomPercent / 100;
        // Get current transform values
        const currentTransform = image.style.transform || '';
        const translateMatch = currentTransform.match(/translate\(([^)]+)\)/);
        const currentTranslate = translateMatch ? translateMatch[1] : '0px, 0px';
        
        // Apply new transform with zoom
        image.style.transform = `${currentTranslate} scale(${scale})`;
        image.style.transformOrigin = 'center';
        
        // Store zoom level
        (image as any).dataset.zoom = zoomPercent.toString();
        
        console.log('Applied zoom:', zoomPercent + '%', 'to image');
      }
    }
  };

  const pick = (id: string) => {
    if (id === "elements") {
      // Deselect all tools — pointer/select mode
      setActiveTool("elements");
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      setIsEraser?.(false);
      onToolSelect?.("elements");
    } else if (id === "move") {
      // Select move tool for dragging canvas
      setActiveTool("move");
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      onToolSelect?.("move");
    } else if (id === "upload-override") {
      uploadInputRef.current?.click();
    } else if (id === "brush") {
      // Select brush tool (paint brush)
      setActiveTool(id);
      setIsEraser?.(false);
      setShowBrushSizeMenu(false);
      onToolSelect?.("brush");
    } else if (id === "pen-brush") {
      // Select pen brush (directly activate like BrushInpaintPanel)
      setActiveTool(id);
      setIsEraser?.(false);
      setShowBrushSizeMenu(false);
      onToolSelect?.("pen-brush");
    } else if (id === "eraser") {
      // Select eraser tool
      setActiveTool(id);
      setIsEraser?.(true);
      setShowBrushSizeMenu(false);
      onToolSelect?.("eraser");
    } else if (id === "text") {
      // Select text tool and create text in center
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      onToolSelect?.("text");
      // Text icon stays selected - no automatic switch back
    } else if (id === "arrow") {
      // Select arrow tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("arrow");
    } else if (id === "line") {
      // Select line tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("line");
    } else if (id === "square") {
      // Select square tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("square");
    } else if (id === "circle") {
      // Select circle tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("circle");
    } else if (id === "color-picker") {
      // Toggle color picker menu
      setShowColorMenu(!showColorMenu);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
    } else if (id === "undo") {
      // Handle undo functionality
      console.log("Undo action triggered");
      // TODO: Implement actual undo logic
    } else if (id === "crop") {
      // Select crop tool and show aspect ratio menu
      setActiveTool(id);
      setShowCropMenu(!showCropMenu);
      setShowBrushSizeMenu(false);
      onToolSelect?.("crop");
    } else if (id === "rectangle-mask") {
      // Select rectangle mask tool
      console.log("Selecting rectangle mask, setting activeTool to:", id);
      setActiveTool("rectangle-mask");
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      // Set square mode to false for rectangle mask
      onSetSquareMode?.(false);
      onToolSelect?.("rectInpaint");
    } else if (id === "square-mask") {
      // Select square mask tool
      console.log("Selecting square mask, setting activeTool to:", id);
      setActiveTool("square-mask");
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
      // Set square mode to true for square mask
      onSetSquareMode?.(true);
      onToolSelect?.("rectInpaint");
      // Reset square size to 200x200
      console.log("Resetting square mask size to 200x200");
      onResetRectangle?.();
    } else if (id === "download") {
      // Handle download functionality
      if (backgroundImage) {
        const link = document.createElement('a');
        link.href = backgroundImage;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        console.log("Downloaded current image");
      } else {
        console.log("No image available to download");
      }
    } else if (id === "save") {
      // Handle save functionality
      console.log("Save action triggered");
      // TODO: Implement actual save logic
    } else if (id === "zoom-in") {
      // Handle zoom in functionality
      console.log("Zoom in button clicked!");
      onZoomIn?.();
      console.log("Zoom in triggered");
    } else if (id === "zoom-out") {
      // Handle zoom out functionality
      console.log("Zoom out button clicked!");
      onZoomOut?.();
      console.log("Zoom out triggered");
    } else if (id === "fit-screen") {
      // Handle fit to screen functionality
      console.log("Fit to screen button clicked!");
      onFitToScreen?.();
      console.log("Fit to screen triggered");
    } else if (id === "redo") {
      // Handle redo functionality
      console.log("Redo action triggered");
      // TODO: Implement actual redo logic
    } else {
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowCropMenu(false);
    }
  };

  const ic = "w-4 h-4";

  // ── Left Toolbar (Annotate + Area Edit) ────────────────────────────
  const renderLeftToolbar = () => {
    if (mode === "describe") return null;
    
    // Debug: Log current active tool
    console.log("Current activeTool:", activeTool);

    return (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <div className={`flex flex-col gap-1 rounded-lg p-1 shadow-lg border ${
          mode === "describe" 
            ? "bg-white border-gray-200" 
            : "bg-[#0a0a0f]/98 backdrop-blur-md border-white/10"
        }`}>
          {mode === "annotate" ? (
            <>
              <ToolBtn active={activeTool === "elements"} onClick={() => pick("elements")} title="Select (no tool)">
                <MousePointer className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/[0.08] my-0.5" />
              <ToolBtn active={activeTool === "text"} onClick={() => pick("text")} title="Text">
                <Type className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "arrow"} onClick={() => pick("arrow")} title="Arrow">
                <ArrowUpRight className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "line"} onClick={() => pick("line")} title="Line">
                <Minus className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "square"} onClick={() => pick("square")} title="Square">
                <Square className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "circle"} onClick={() => pick("circle")} title="Circle">
                <Circle className={ic} />
              </ToolBtn>
              <ToolBtn active={false} onClick={() => pick("color-picker")} title="Color Picker">
                <div 
                  className="w-6 h-6 rounded-md border-2 border-white/50 hover:border-white transition-all"
                  style={{ backgroundColor: selectedColor }}
                />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/[0.08] my-0.5" />
              <ToolBtn active={false} onClick={() => pick("undo")} title="Undo">
                <Trash2 className={ic} />
              </ToolBtn>
            </>
          ) : (
            /* Area Edit tools */
            <>
              <ToolBtn active={activeTool === "elements"} onClick={() => pick("elements")} title="Select (no tool)">
                <MousePointer className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/8 my-0.5" />
              <ToolBtn active={activeTool === "brush"} onClick={() => pick("brush")} title="Brush">
                <Brush className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "eraser"} onClick={() => pick("eraser")} title="Eraser">
                <Eraser className={ic} />
              </ToolBtn>
              {/* Pen size - shows actual brush size, independent button */}
              <button
                onClick={() => setShowBrushSizeMenu(!showBrushSizeMenu)}
                className={`w-9 h-9 rounded-md flex items-center justify-center transition-all ${
                  showBrushSizeMenu
                    ? "bg-gradient-to-r from-cyan-600/30 to-green-600/30 text-cyan-300 shadow-2xl shadow-cyan-400/60 ring-4 ring-cyan-400/40 ring-offset-0" 
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title={`Pen Brush Size: ${maskBrushSize}px`}
              >
                <div 
                  className="bg-cyan-400 rounded-full" 
                  style={{ 
                    width: `${Math.min(maskBrushSize / 6, 8)}px`, 
                    height: `${Math.min(maskBrushSize / 6, 8)}px` 
                  }}
                />
              </button>
              <ToolBtn active={activeTool === "rectangle-mask"} onClick={() => pick("rectangle-mask")} title="Rectangle Mask">
                <Maximize2 className={`${ic} ${activeTool === "rectangle-mask" ? "text-cyan-400" : ""}`} />
              </ToolBtn>
              <ToolBtn active={activeTool === "square-mask"} onClick={() => pick("square-mask")} title="Square Mask">
                <Square className={`${ic} ${activeTool === "square-mask" ? "text-purple-400" : ""}`} />
              </ToolBtn>
              <ToolBtn active={activeTool === "crop"} onClick={() => pick("crop")} title="Crop">
                <Scissors className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/8 my-0.5" />
              {/* Clear Mask */}
              <button
                onClick={() => {
                  setCanvasState?.(s => ({ ...s, mask: [] }));
                  console.log("Mask cleared");
                }}
                disabled={!canvasState?.mask?.length}
                className="w-9 h-9 rounded-md flex items-center justify-center transition-all text-gray-600 hover:bg-red-500/10 hover:text-red-300 disabled:opacity-30"
                title="Clear Mask"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        
        {/* Brush Size Menu */}
        {showBrushSizeMenu && (
          <div className="absolute left-[52px] top-[80px] translate-y-0 bg-[#0a0a0f]/98 backdrop-blur-md rounded-lg border border-white/10 shadow-xl p-2 z-30">
            <div className="flex items-center gap-2">
              {[10, 20, 30, 50, 80].map((size) => (
                <button
                  key={size}
                  onClick={() => {
                    setMaskBrushSize?.(size);
                    setShowBrushSizeMenu(false);
                  }}
                  className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                    maskBrushSize === size
                      ? "bg-gradient-to-r from-cyan-600/30 to-green-600/30 text-cyan-300 shadow-2xl shadow-cyan-400/60 ring-4 ring-cyan-400/40 ring-offset-0"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  title={`Brush Size ${size}px`}
                >
                  <div 
                    className="bg-red-500 rounded-full" 
                    style={{ 
                      width: `${Math.min(size / 4, 12)}px`, 
                      height: `${Math.min(size / 4, 12)}px` 
                    }}
                  />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Color Menu */}
        {showColorMenu && (
          <div className="absolute left-[52px] top-[120px] translate-y-0 bg-[#0a0a0f]/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl p-4 z-30 w-48">
            <div className="grid grid-cols-3 gap-4">
              {[
                { color: '#FF0000', name: 'Red' },
                { color: '#FFA500', name: 'Orange' },
                { color: '#FFFF00', name: 'Yellow' },
                { color: '#00FF00', name: 'Green' },
                { color: '#0000FF', name: 'Blue' },
                { color: '#800080', name: 'Purple' },
                { color: '#FFC0CB', name: 'Pink' },
                { color: '#000000', name: 'Black' },
                { color: '#FFFFFF', name: 'White' }
              ].map(({ color, name }) => (
                <button
                  key={color}
                  onClick={() => {
                    setSelectedColor(color);
                    setShowColorMenu(false);
                    console.log(`Selected color: ${name} (${color})`);
                    // Update selected shape color if a shape is selected
                    if (setSelectedColor) {
                      setSelectedColor(color);
                    }
                  }}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 border-2 transform hover:scale-110 ${
                    selectedColor === color
                      ? "border-blue-400 shadow-xl shadow-blue-400/50 ring-2 ring-blue-400/30 scale-110"
                      : "border-gray-500 hover:border-gray-300 hover:shadow-lg"
                  }`}
                  title={name}
                  style={{ backgroundColor: color }}
                >
                  {color === '#FFFFFF' && (
                    <div className="w-7 h-7 rounded-full border-2 border-gray-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Crop Aspect Ratio Menu */}
        {showCropMenu && (
          <div className="absolute left-[52px] top-[180px] translate-y-0 bg-[#0a0a0f]/98 backdrop-blur-md rounded-lg border border-white/10 shadow-xl p-2 z-30">
            <div className="flex flex-col gap-2">
              <span className="text-[10px] text-gray-400 font-medium text-center">Aspect Ratio</span>
              <div className="flex items-center gap-2">
                {["16:9", "9:16", "1:1", "4:3", "3:4"].map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => {
                      setSelectedAspectRatio(ratio);
                      setShowCropMenu(false);
                      console.log(`Crop aspect ratio selected: ${ratio}`);
                      
                      // Update crop rectangle with new aspect ratio
                      if (onCropExecute) {
                        onCropExecute(ratio);
                      }
                    }}
                    className={`w-12 h-8 rounded flex items-center justify-center transition-all text-[10px] font-bold ${
                      selectedAspectRatio === ratio
                        ? "bg-gradient-to-r from-cyan-600/30 to-green-600/30 text-cyan-300 shadow-2xl shadow-cyan-400/60 ring-2 ring-cyan-400/40 ring-offset-0"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                    title={`Aspect Ratio ${ratio}`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        
        <input
          ref={uploadInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleLeftImageUpload}
        />
      </div>
    );
  };

  // ── Right Toolbar (Annotate + Area Edit) ───────────────────────────
  const renderRightToolbar = () => {
    if (mode === "describe") return null;

    const grp =
      mode === "describe" 
        ? "flex flex-col gap-1 bg-white rounded-lg p-1 shadow-lg border border-gray-200"
        : "flex flex-col gap-1 bg-[#0a0a0f]/98 backdrop-blur-md rounded-lg p-1 shadow-lg border border-white/10";

    return (
      <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2">
        {/* Move Tool */}
        <div className={grp}>
          <ToolBtn active={activeTool === "move"} onClick={() => pick("move")} title="Move Canvas">
            <Hand className={ic} />
          </ToolBtn>
        </div>
        
        {/* Group 1: Upload, History, Delete */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => pick("upload-override")} title="Upload (Override)">
            <Upload className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => pick("history")} title="History">
            <History className={ic} />
          </ToolBtn>
          <ToolBtn danger active={false} onClick={() => pick("delete")} title="Delete">
            <Trash2 className={ic} />
          </ToolBtn>
        </div>

        {/* Group 2: Download, Save */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => pick("download")} title="Download">
            <Download className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => pick("save")} title="Save">
            <Save className={ic} />
          </ToolBtn>
        </div>

        {/* Group 3: Zoom In, Zoom Out, Fit */}
        <div className={grp}>
          <ToolBtn active={false} onClick={() => pick("zoom-in")} title="Zoom In">
            <ZoomIn className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => pick("zoom-out")} title="Zoom Out">
            <ZoomOut className={ic} />
          </ToolBtn>
          <ToolBtn active={false} onClick={() => pick("fit-screen")} title="Fit to Screen">
            <Maximize2 className={ic} />
          </ToolBtn>
          <div className="text-xs text-gray-400 text-center mt-1">
            {zoomLevel}%
          </div>
        </div>
      </div>
    );
  };

  // ── Reference Images Panel (all modes) ──────────────────
  const renderReferencePanel = () => {
    // Show in all modes now

    return (
      <div className="px-0 py-0">
        <div className="flex items-start gap-2.5 overflow-x-auto">
          {/* Reference image thumbnails */}
          {referenceImages.map((img) => (
            <div
              key={img.id}
              className="relative shrink-0 w-14 h-14 rounded-lg overflow-hidden border border-white/20 group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="w-full h-full object-cover" />
              {onRemoveReferenceImage && (
                <button
                  onClick={() => onRemoveReferenceImage(img.id)}
                  className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              )}
            </div>
          ))}

          {/* Add Image button - only show if no images or in describe mode */}
          {(mode === "describe" || referenceImages.length === 0) && (
            <button
              onClick={() => fileInputRef.current?.click()}
              className="shrink-0 w-14 h-14 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 flex flex-col items-center justify-center gap-1 transition text-gray-400 hover:text-gray-200"
            >
              <Plus className="w-4 h-4" />
              <span className="text-[9px]">Image</span>
            </button>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleRightImageUpload}
        />
      </div>
    );
  };

  // ── User Prompt Text Area (inside bottom panel) ───────────────────────
  const renderUserPromptArea = () => {
    if (mode !== "describe" && mode !== "area-edit") return null;

    return (
      <div className="px-[10px] pt-[10px] pb-0">
        <div className="flex items-start gap-2">
          <textarea
            value={userPrompt || ""}
            onChange={(e) => setUserPrompt(e.target.value)}
            placeholder="Describe what you want to create..."
            className="flex-1 min-h-[40px] px-4 py-2 bg-transparent border border-white/[0.08] rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/[0.15] transition-all text-sm overflow-hidden resize-none"
            style={{ 
              caretColor: 'white',
              height: 'auto',
              minHeight: '40px'
            }}
            onInput={(e) => {
              const target = e.target as HTMLTextAreaElement;
              target.style.height = 'auto';
              target.style.height = `${target.scrollHeight}px`;
            }}
          />
          <button
            className="shrink-0 w-8 h-8 rounded-lg bg-white/10 hover:bg-white/15 border border-white/20 flex items-center justify-center transition text-gray-400 hover:text-gray-200 mt-1"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  };

  // ── Bottom Bar (openart.ai style with 20px gaps) ───────────────────────
  const renderBottomBar = () => {
    const modeTabs: {
      id: AIEditMode;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [
      { id: "describe", label: "Describe", icon: MessageSquareText },
      { id: "area-edit", label: "Area Edit", icon: Scan },
      { id: "annotate", label: "Annote", icon: Wand2 },
    ];

    return (
      <div className="absolute bottom-0 left-0 right-0 mx-[20px] mb-[20px] flex flex-col gap-3">
        {/* Reference Images Panel */}
        <div className="mb-[0px]">
          {renderReferencePanel()}
        </div>

        {/* Main Panel */}
        <div className="bg-[#0a0a0f]/98 backdrop-blur-md rounded-2xl border border-white/10">
          {/* User Prompt Area (only in describe mode) */}
          {renderUserPromptArea()}
          
          {/* Row 1: Mode tabs + Model + Generate */}
          <div className="px-4 py-3 flex items-center gap-3">
          {/* Mode Tabs */}
          <div className="flex items-center gap-1">
            {modeTabs.map((tab) => {
              const isActive = mode === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => onModeChange(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[13px] font-medium ${
                    isActive
                      ? "bg-gradient-to-r from-cyan-600/30 to-green-600/30 text-cyan-300 shadow-2xl shadow-cyan-400/60 ring-4 ring-cyan-400/40 ring-offset-0"
                      : "text-gray-400 hover:text-gray-200 hover:bg-white/[0.05]"
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Model Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/15 rounded-lg transition text-white text-[12px]"
            >
              <span className="w-4 h-4 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold">
                {selectedModel.icon}
              </span>
              <span className="hidden sm:inline">{selectedModel.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {showModelDropdown && (
              <div className="absolute bottom-full mb-2 left-0 bg-[#0a0a0f]/98 backdrop-blur-md rounded-lg border border-white/10 shadow-xl min-w-[150px] z-50">
                {MODELS.map((model) => (
                  <button
                    key={model.id}
                    onClick={() => {
                      onModelChange?.(model.id);
                      setShowModelDropdown(false);
                    }}
                    className={`w-full flex items-center gap-2 px-3 py-2 text-left text-[12px] transition ${
                      model.id === selectedModel.id
                        ? "bg-white/10 text-white"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <span className="w-4 h-4 bg-white/20 rounded flex items-center justify-center text-[10px] font-bold">
                      {model.icon}
                    </span>
                    <span>{model.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Model Select Box (only in area-edit mode) */}
          {mode === "area-edit" && inpaintModelOptions.length > 0 && (
            <div className="relative" style={{ width: "200px" }}>
              <button
                onClick={() => setShowInpaintModelDropdown(!showInpaintModelDropdown)}
                className="w-full flex items-center justify-between px-3 py-2 bg-[#1a1a24] text-white rounded-lg text-sm font-semibold hover:bg-[#1f1f2a] transition-all duration-200 border border-white/10 hover:border-purple-500/30 group"
              >
                <span className="text-xs truncate">{getSelectedModelDisplay()}</span>
                <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0" />
              </button>
              {showInpaintModelDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    {inpaintModelOptions.map((modelOption) => (
                      <button
                        key={modelOption.value}
                        onClick={() => {
                          onModelChange?.(modelOption.value);
                          setShowInpaintModelDropdown(false);
                        }}
                        className="w-full px-2 py-2 text-left hover:bg-white/5 rounded-lg transition"
                      >
                        <div className="text-xs font-medium text-white">{modelOption.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{modelOption.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-lg transition text-white font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Generate</span>
            <span className="text-white/70 text-xs">✦ {credits}</span>
          </button>
        </div>
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────
  return (
    <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
      {/* Canvas area with toolbars */}
      <div className="flex-1 relative">
        <div className="pointer-events-auto">{renderLeftToolbar()}</div>
        <div className="pointer-events-auto">{renderRightToolbar()}</div>
      </div>

      {/* Bottom: Reference panel + Bottom bar */}
      <div className="pointer-events-auto">
        {renderBottomBar()}
      </div>
    </div>
  );
}
