"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────
export type ElementAIEditMode = "describe";

interface ReferenceImage {
  id: string;
  url: string;
}

export interface ElementAIPanelProps {
  mode: ElementAIEditMode;
  onModeChange: (mode: ElementAIEditMode) => void;
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
  onAddCanvasElement?: (file: File) => void;
  backgroundImage?: string | null;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  zoomLevel?: number;
  selectedColor?: string;
  setSelectedColor?: (color: string) => void;
  onColorPickerClick?: () => void;
  onDeleteSelected?: () => void;
  onAspectRatioChange?: (aspectRatio: string) => void;
  selectedAspectRatio?: string;
  onRectangleMaskAspectRatioChange?: (aspectRatio: string) => void;
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
          ? "bg-gradient-to-r from-blue-600/30 to-green-600/30 text-blue-300 shadow-2xl shadow-blue-400/60 ring-4 ring-blue-400/40 ring-offset-0"
          : danger
          ? "text-red-500 hover:bg-red-50 hover:text-red-600"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
      } ${className}`}
      title={title}
    >
      {children}
    </button>
  );
}

// ── ElementAIPanel Component ─────────────────────────────────────────────
export function ElementAIPanel({
  mode,
  onModeChange,
  onGenerate,
  credits = 20,
  model = "nano-banana-2",
  onModelChange,
  referenceImages = [],
  onAddReferenceImage,
  onRemoveReferenceImage,
  isGenerating = false,
  userPrompt = "",
  onUserPromptChange,
  isEraser = false,
  setIsEraser,
  maskBrushSize = 20,
  setMaskBrushSize,
  maskOpacity = 0.8,
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
  zoomLevel = 100,
  selectedColor = "#FF0000",
  setSelectedColor,
  onColorPickerClick,
  onDeleteSelected,
  onAspectRatioChange,
  selectedAspectRatio,
  onRectangleMaskAspectRatioChange,
}: ElementAIPanelProps) {
  const [activeTool, setActiveTool] = useState("canvas-object");
  const [showBrushSizeMenu, setShowBrushSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInpaintModelDropdown, setShowInpaintModelDropdown] = useState(false);
  const [showImageMaskMenu, setShowImageMaskMenu] = useState(false);
  const [currentPrompt, setCurrentPrompt] = useState(userPrompt);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);

  // Model options for describe mode
  const inpaintModelOptions = [
    { value: "character", label: "👤 Character", sub: "Character generation • 30 credits", credits: 30, maxReferenceImages: 10 },
    { value: "props", label: "🎭 Props", sub: "Props generation • 20 credits", credits: 20, maxReferenceImages: 5 },
    { value: "environment", label: "🏛️ Environment", sub: "Environment generation • 40 credits", credits: 40, maxReferenceImages: 15 },
    { value: "nano-banana-2", label: "🟩 Nano Banana 2", sub: "General purpose • 40 credits", credits: 40, maxReferenceImages: 13 },
    { value: "seedream-5-lite-image-to-image", label: "🌸 SeeDream 5 Lite", sub: "General purpose • 10 credits", credits: 10, maxReferenceImages: 13 },
  ];

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Delete' && onCropRemove) {
        onCropRemove();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeTool, onCropRemove]);

  // Clean up images when switching to area-edit mode
  useEffect(() => {
    // No cleanup needed since we only have describe mode
  }, [mode, referenceImages, onRemoveReferenceImage]);

  const pick = (tool: string) => {
    setActiveTool(tool);
    onToolSelect?.(tool);
  };

  const handlePromptChange = (value: string) => {
    setCurrentPrompt(value);
    onUserPromptChange?.(value);
  };

  const handleAddReference = (file: File) => {
    const url = URL.createObjectURL(file);
    const id = `ref-${Date.now()}`;
    onAddReferenceImage?.(file);
  };

  const ic = "w-4 h-4";

  // ── Left Toolbar (Area Edit) ────────────────────────────────────
  const renderLeftToolbar = () => {
    // No toolbar for describe mode
    return null;
  };

  // ── Right Toolbar (Area Edit) ───────────────────────────────────
  const renderRightToolbar = () => {
    // No toolbar for describe mode
    return null;
  };

  // ── Bottom Bar (Element AI style) ───────────────────────────────────
  const renderBottomBar = () => {
    const modeTabs: Array<{
      id: ElementAIEditMode;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { id: "describe", label: "Element", icon: MessageSquareText },
    ];

    return (
      <div className="absolute bottom-0 left-0 right-0 mx-[20px] mb-[20px] flex flex-col gap-3">
        {/* Reference Images Panel */}
        <div className="mb-0">
          {referenceImages.length > 0 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {referenceImages.map((img) => (
                <div key={img.id} className="relative flex-shrink-0 group">
                  <img
                    src={img.url}
                    alt="Reference"
                    className="w-16 h-16 object-cover rounded-lg border border-white/10"
                  />
                  <button
                    onClick={() => onRemoveReferenceImage?.(img.id)}
                    className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-2.5 h-2.5 text-white" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Main Panel */}
        <div className="bg-[#0a0a0f]/98 backdrop-blur-md rounded-2xl border border-white/10">
          {/* User Prompt Area */}
          {mode !== "describe" ? null : (
            <div className="px-[10px] pt-[10px] pb-0">
              <div className="flex gap-2">
                <textarea
                  value={currentPrompt || ""}
                  onChange={(e) => handlePromptChange(e.target.value)}
                  placeholder="Describe what you want to create..."
                  className="flex-1 min-h-[40px] px-4 py-2 bg-transparent border border-white/8 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-white/15 transition-all text-sm overflow-hidden resize-none"
                  style={{ 
                    caretColor: 'white',
                  }}
                  rows={1}
                />
              </div>
            </div>
          )}
          
          {/* Row 1: Mode tabs */}
          <div className="flex items-center gap-3 px-[10px] py-[10px]">
            {/* Mode Tabs */}
            <div className="flex gap-1 bg-white/5 rounded-lg p-[3px]">
              {modeTabs.map((tab) => {
                const isActive = mode === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => {
                      onModeChange(tab.id);
                      pick("canvas-object");
                    }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-full transition-all text-[13px] font-medium ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/30 to-green-600/30 text-blue-300 shadow-2xl shadow-blue-400/60 ring-4 ring-blue-400/40 ring-offset-0"
                        : "text-gray-400 hover:text-gray-200 hover:bg-white/5"
                    }`}
                  >
                    <tab.icon className="w-4 h-4" />
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {/* Spacer to push model and generate to right */}
            <div className="flex-1" />

            {/* Model Select Box */}
            {inpaintModelOptions.length > 0 && (
              <div className="relative" style={{ width: "200px" }}>
                <button
                  onClick={() => setShowInpaintModelDropdown(!showInpaintModelDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span>{inpaintModelOptions.find(m => m.value === model)?.label || "Select Model"}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
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
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            model === modelOption.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <div>{modelOption.label}</div>
                          <div className="text-[11px] text-gray-500">{modelOption.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Credits Display */}
            <div className="flex items-center gap-2 text-[12px] text-gray-400">
              <span className="text-blue-400">⚡</span>
              <span>{credits} credits available</span>
            </div>

            {/* Generate Button */}
            <button
              onClick={onGenerate}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${
                "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              }`}
            >
              {isGenerating ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    );
  };

  // ── Main Render ────────────────────────────────────────────────────
  return (
    <>
      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={(e) => {
          const files = Array.from(e.target.files || []);
          files.forEach(handleAddReference);
          e.target.value = "";
        }}
        className="hidden"
      />
      <input
        ref={uploadInputRef}
        type="file"
        accept="image/*"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onAddCanvasElement?.(file);
          e.target.value = "";
        }}
        className="hidden"
      />

      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
        {/* Canvas area with toolbars */}
        <div className="flex-1 relative">
          <div className="pointer-events-auto">{renderLeftToolbar()}</div>
          <div className="pointer-events-auto">{renderRightToolbar()}</div>
        </div>

        {/* Bottom: Bottom bar */}
        <div className="pointer-events-auto">
          {renderBottomBar()}
        </div>
      </div>
    </>
  );
}
