"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp,
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
  userPrompt?: string;
  onUserPromptChange?: (prompt: string) => void;
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
  onColorPickerClick?: () => void; // Add handler for color picker click
  onDeleteSelected?: () => void; // Add handler for delete selected element
  onAspectRatioChange?: (aspectRatio: string) => void; // Add handler for aspect ratio changes
  selectedAspectRatio?: string; // Add selected aspect ratio prop
  onRectangleMaskAspectRatioChange?: (aspectRatio: string) => void; // Add handler for rectangle mask aspect ratio changes
}

// ── Available Models ─────────────────────────────────────────────────
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "nano-banana-1", label: "Nano Banana 1", icon: "G" },
  { id: "stable-diffusion", label: "Stable Diffusion", icon: "S" },
  { id: "gpt-image-1-5-text-to-image", label: "GPT Image 1.5 Text", icon: "🟦" },
  { id: "nano-banana-edit", label: "Nano Banana Edit", icon: "🟩" },
  { id: "flux-2/flex-image-to-image", label: "Flux 2 Flex", icon: "🟡" },
  { id: "character-remix", label: "Character Remix", icon: "🟣" },
  { id: "qwen-z-image", label: "Qwen Image Edit", icon: "🟠" },
  { id: "ideogram/character-edit", label: "Character Edit", icon: "🔵" },
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
  className,
}: {
  active?: boolean;
  danger?: boolean;
  onClick: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
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
      } ${className || ""}`}
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
  userPrompt,
  onUserPromptChange,
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
  onColorPickerClick,
  onDeleteSelected,
  onAspectRatioChange,
  selectedAspectRatio,
  onRectangleMaskAspectRatioChange,
}: ImageAIPanelProps) {
  const [activeTool, setActiveTool] = useState("canvas-object");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [contentType, setContentType] = useState("image");

  // Use passed props for prompt
  const currentPrompt = userPrompt || "";
  const handlePromptChange = (value: string) => {
    onUserPromptChange?.(value);
  };
  
  const [showBrushSizeMenu, setShowBrushSizeMenu] = useState(false);
  const [showImageMaskMenu, setShowImageMaskMenu] = useState(false);
  const [showInpaintModelDropdown, setShowInpaintModelDropdown] = useState(false);
  const [showColorMenu, setShowColorMenu] = useState(false);
  // Use existing brush size from props instead of local state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Model options for area-edit mode (filtered by mask type)
  const inpaintModelOptions = activeTool === "text-to-image" ? [
    { value: "gpt-image-1-5-text-to-image", label: "🟦 GPT Image 1.5 Text", sub: "Text Mode • 8 credits", credits: 8, maxReferenceImages: 0 },
    { value: "nano-banana-edit", label: "🟩 Nano Banana Edit", sub: "Text Mode • 8 credits", credits: 8, maxReferenceImages: 0 },
    
    { value: "qwen/image-edit", label: "🟠 Qwen Image Edit", sub: "Text Mode • 10 credits", credits: 10, maxReferenceImages: 0 },
  ] : activeTool === "image-to-image" ? [
    { value: "flux-2/pro-image-to-image", label: "🔥 Flux 2 Pro", sub: "1:1 • 7 refs • 15 credits", credits: 15, maxReferenceImages: 7 },
    { value: "flux-2/flex-image-to-image", label: "🟡 Flux 2 Flex", sub: "1:1 • 7 refs • 30 credits", credits: 30, maxReferenceImages: 7 },
    
   
    { value: "gpt-image-1-5-image-to-image", label: "🟦 GPT Image 1.5", sub: "1:1 • 15 refs • 45 credits", credits: 45, maxReferenceImages: 15 },
  ] : activeTool === "upscale" ? [
    { value: "recraft/crisp-upscale", label: "🎨 Recraft Crisp", sub: "AI Upscale 1 credit", credits: 1, maxReferenceImages: 0 },
    { value: "topaz/image-upscale", label: "💎 Topaz Upscale", sub: "AI Upscale 20 credits", credits: 20, maxReferenceImages: 0 },
  ] : mode === "describe" ? [
    // Describe mode specific models
    { value: "nano-banana-2", label: "🟩 Nano Banana 2", sub: "13 refs • 40 credits", credits: 40, maxReferenceImages: 13 },
    { value: "seedream-5-lite-image-to-image", label: "🌸 SeeDream 5 Lite", sub: "13 refs • 10 credits", credits: 10, maxReferenceImages: 13 },
  ] : [
    // Default: include character-edit for any other tools in area-edit mode
    { value: "ideogram/character-edit", label: "Character-edit", sub: "Faceshift" },
  ];

  const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];

  // Get current selected model display name
  const getSelectedModelDisplay = () => {
    const selected = inpaintModelOptions.find(m => m.value === model) || inpaintModelOptions[0];
    return selected ? selected.label : "Model";
  };

  // Get current selected model credits
  const getSelectedModelCredits = () => {
    const selected = inpaintModelOptions.find(m => m.value === model) || inpaintModelOptions[0];
    return selected && (selected as any).credits ? (selected as any).credits : credits;
  };

  // Handle keyboard events for crop removal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && activeTool === 'crop') {
        setActiveTool('canvas-object');
        onCropRemove?.(); // Call parent to remove crop rectangle from canvas
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, onCropRemove]);

  // Clean up images when switching to area-edit mode
  useEffect(() => {
    if (mode === "area-edit" && referenceImages && referenceImages.length > 1) {
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
        
      }
    }
  };

  const pick = (id: string) => {
    if (id === "canvas-object") {
      // Deselect all tools — pointer/select mode
      setActiveTool("canvas-object");
      setShowBrushSizeMenu(false);
      setIsEraser?.(false);
      onToolSelect?.("canvas-object");
    } else if (id === "move") {
      // Select move tool for dragging canvas
      setActiveTool("move");
      setShowBrushSizeMenu(false);
      onToolSelect?.("move");
    } else if (id === "upload-override") {
      uploadInputRef.current?.click();
    } else if (id === "brush") {
      // Select brush tool (paint brush) - set character-edit model for face editing
      setActiveTool(id);
      setIsEraser?.(false);
      setShowBrushSizeMenu(false);
      onToolSelect?.("brush");
      // Auto-set character-edit model for brush tools
      onModelChange?.("character-edit");
    } else if (id === "pen-brush") {
      // Select pen brush (directly activate brush tool) - set character-edit model for face editing
      setActiveTool(id);
      setIsEraser?.(false);
      setShowBrushSizeMenu(false);
      onToolSelect?.("pen-brush");
      // Auto-set character-edit model for brush tools
      onModelChange?.("character-edit");
    } else if (id === "eraser") {
      // Select eraser tool - set character-edit model for face editing
      setActiveTool(id);
      setIsEraser?.(true);
      setShowBrushSizeMenu(false);
      onToolSelect?.("eraser");
      // Auto-set character-edit model for brush tools
      onModelChange?.("character-edit");
    } else if (id === "text") {
      // Select text tool and create text in center
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onToolSelect?.("text");
      // Text icon stays selected - no automatic switch back
    } else if (id === "arrow") {
      // Select arrow tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("arrow");
    } else if (id === "line") {
      // Select line tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("line");
    } else if (id === "square") {
      // Select square tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("square");
    } else if (id === "circle") {
      // Select circle tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      setShowColorMenu(false);
      onToolSelect?.("circle");
    } else if (id === "color-picker") {
      // Toggle color picker menu
      setShowColorMenu(!showColorMenu);
      setShowBrushSizeMenu(false);
    } else if (id === "undo") {
      // Handle undo functionality
      // TODO: Implement actual undo logic
    } else if (id === "crop") {
      // Select crop tool - aspect ratio comes from top dropdown
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onToolSelect?.("crop");
    } else if (id === "upscale") {
      // Select upscale tool
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onToolSelect?.("upscale");
    } else if (id === "image-to-image") {
      // Select image to image tool
      setActiveTool("image-to-image");
      setShowBrushSizeMenu(false);
      // Set square mode to false for image to image
      onSetSquareMode?.(false);
      onToolSelect?.("rectInpaint");
    } else if (id === "text-to-image") {
      // Select text to image tool
      setActiveTool("text-to-image");
      setShowBrushSizeMenu(false);
      // Set square mode to true for text to image
      onSetSquareMode?.(true);
      onToolSelect?.("rectInpaint");
      // Reset square size to 200x200
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
      } else {
      }
    } else if (id === "save") {
      // Handle save functionality
      // TODO: Implement actual save logic
    } else if (id === "zoom-in") {
      // Handle zoom in functionality
      onZoomIn?.();
    } else if (id === "zoom-out") {
      // Handle zoom out functionality
      onZoomOut?.();
    } else if (id === "fit-screen") {
      // Handle fit to screen functionality
      onFitToScreen?.();
    } else if (id === "redo") {
      // Handle redo functionality
      // TODO: Implement actual redo logic
    } else {
      setActiveTool(id);
      setShowBrushSizeMenu(false);
    }
  };

  const ic = "w-4 h-4";

  // ── Left Toolbar (Annotate + Area Edit) ────────────────────────────
  const renderLeftToolbar = () => {
    if (mode === "describe") return null;
    
    return (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <div className={`flex flex-col gap-1 rounded-lg p-1 shadow-lg border ${
          mode === "annotate" 
            ? "bg-[#0a0a0f]/98 backdrop-blur-md border-white/10" 
            : "bg-[#0a0a0f]/98 backdrop-blur-md border-white/10"
        }`}>
          {mode === "annotate" ? (
            <>
              <ToolBtn active={activeTool === "canvas-object"} onClick={() => { pick("canvas-object"); setShowImageMaskMenu(false); }} title="Canvas Object (no tool)">
                <MousePointer className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/[0.08] my-0.5" />
              <ToolBtn active={activeTool === "text"} onClick={() => { pick("text"); setShowImageMaskMenu(false); }} title="Text">
                <Type className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "arrow"} onClick={() => { pick("arrow"); setShowImageMaskMenu(false); }} title="Arrow">
                <ArrowUpRight className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "line"} onClick={() => { pick("line"); setShowImageMaskMenu(false); }} title="Line">
                <Minus className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "square"} onClick={() => { pick("square"); setShowImageMaskMenu(false); }} title="Square">
                <Square className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "circle"} onClick={() => { pick("circle"); setShowImageMaskMenu(false); }} title="Circle">
                <Circle className={ic} />
              </ToolBtn>
              <ToolBtn active={false} onClick={() => {
                // Always use the original color picker behavior
                pick("color-picker");
              }} title="Color Picker">
                <div 
                  className="w-6 h-6 rounded-md border-2 border-white/50 hover:border-white transition-all"
                  style={{ backgroundColor: selectedColor }}
                />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/[0.08] my-0.5" />
              <ToolBtn active={false} onClick={() => {
                // Trigger delete selected element
                const canvasContainer = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                if (canvasContainer) {
                  const event = new CustomEvent('deleteSelectedElement');
                  canvasContainer.dispatchEvent(event);
                } else {
                }
              }} title="Delete Selected">
                <Trash2 className={ic} />
              </ToolBtn>
            </>
          ) : (
            /* Area Edit tools */
            <>
              <ToolBtn active={activeTool === "canvas-object"} onClick={() => { pick("canvas-object"); setShowImageMaskMenu(false); }} title="Canvas Object (no tool)">
                <MousePointer className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/8 my-0.5" />
              <ToolBtn active={activeTool === "brush"} onClick={() => { pick("brush"); setShowImageMaskMenu(false); }} title="Brush">
                <Brush className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "eraser"} onClick={() => { pick("eraser"); setShowImageMaskMenu(false); }} title="Eraser">
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
                    width: `${Math.min((maskBrushSize ?? 20) / 6, 8)}px`, 
                    height: `${Math.min((maskBrushSize ?? 20) / 6, 8)}px` 
                  }}
                />
              </button>
              <ToolBtn 
                active={activeTool === "image-to-image"} 
                onClick={() => {
                  pick("image-to-image");
                  setShowBrushSizeMenu(false);
                }} 
                title="Image to Image"
                className="image-to-image-button"
              >
                <Image className={`${ic} ${activeTool === "image-to-image" ? "text-cyan-400" : ""}`} />
              </ToolBtn>
              <ToolBtn active={activeTool === "text-to-image"} onClick={() => { pick("text-to-image"); setShowImageMaskMenu(false); }} title="Text to Image">
                <Square className={`${ic} ${activeTool === "text-to-image" ? "text-purple-400" : ""}`} />
              </ToolBtn>
              <ToolBtn active={activeTool === "crop"} onClick={() => { pick("crop"); setShowImageMaskMenu(false); }} title="Crop">
                <Scissors className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "upscale"} onClick={() => { pick("upscale"); setShowImageMaskMenu(false); }} title="Upscale">
                <ArrowUp className={`${ic} ${activeTool === "upscale" ? "text-yellow-400" : ""}`} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-white/8 my-0.5" />
              {/* Clear Mask */}
              <button
                onClick={() => {
                  setCanvasState?.(s => ({ ...s, mask: [] }));
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
          <div className="absolute left-[52px] top-[120px] translate-y-0 bg-[#0a0a0f]/95 backdrop-blur-lg rounded-xl border border-white/20 shadow-2xl p-4 z-[9999] w-48">
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
                    setSelectedColor?.(color);
                    setShowColorMenu(false);
                    // Apply color to selected shape by triggering CanvasEditor's color picker
                    if (setSelectedColor) {
                      setSelectedColor?.(color);
                      // Trigger the CanvasEditor's color application
                      const canvasContainer = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                      if (canvasContainer) {
                        // Create and dispatch a custom event to apply color
                        const event = new CustomEvent('applyColorToShape', { detail: color });
                        canvasContainer.dispatchEvent(event);
                      }
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
      mode === "annotate" 
        ? "flex flex-col gap-1 bg-[#0a0a0f]/98 backdrop-blur-md rounded-lg p-1 shadow-lg border border-white/10"
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
          {(referenceImages ?? []).map((img) => (
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
          {(mode === "describe" || (referenceImages ?? []).length === 0) && (
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
            value={currentPrompt || ""}
            onChange={(e) => handlePromptChange(e.target.value)}
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
                  onClick={() => {
                    onModeChange(tab.id);
                    // Auto-select canvas-object (no tool) when switching to describe or area-edit
                    if (tab.id === "describe" || tab.id === "area-edit") {
                      pick("canvas-object");
                    }
                  }}
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
      

          {/* Model Select Box (in describe and area-edit modes) */}
          {(mode === "area-edit" || mode === "describe") && inpaintModelOptions.length > 0 && (
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
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${
              mode === "annotate" 
                ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            }`}
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Generate</span>
            <span className="text-white/70 text-xs">✦ {getSelectedModelCredits()}</span>
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
