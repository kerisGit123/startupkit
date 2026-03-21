"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp, BookOpen,
} from "lucide-react";
import PromptLibrary from "./PromptLibrary";

// Constants for mention system
const TEXTAREA_MIN_HEIGHT = 60;
const TEXTAREA_MAX_HEIGHT = 200;

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
  userCompanyId?: string;
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
  userCompanyId = "",
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
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const savedSelectionRef = useRef<{ container: Node; offset: number } | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState(userPrompt ?? "");
  const [editorIsEmpty, setEditorIsEmpty] = useState(!userPrompt);

  // Model options for describe mode
  const inpaintModelOptions = [
    { value: "nano-banana-2", label: "🟩 Nano Banana 2", sub: "General purpose • 40 credits", credits: 40, maxReferenceImages: 13 },
  ];

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: "1:1", label: "1:1", sub: "Square" },
    { value: "6:19", label: "6:19", sub: "Portrait" },
    { value: "19:6", label: "19:6", sub: "Landscape" },
  ];

  // Resolution options
  const resolutionOptions = [
    { value: "1K", label: "1K", sub: "1024×1024" },
    { value: "2K", label: "2K", sub: "2048×2048" },
  ];

  // Output format options
  const outputFormatOptions = [
    { value: "png", label: "PNG", sub: "Lossless" },
    { value: "jpg", label: "JPG", sub: "Compressed" },
  ];

  // State for new dropdowns
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState("1K");
  const [outputFormat, setOutputFormat] = useState("png");

  // Dropdown visibility states
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showOutputFormatDropdown, setShowOutputFormatDropdown] = useState(false);

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

  // ── ContentEditable editor helpers ──────────────────────────────────

  // Extract plain text from the editor DOM (skip badge spans)
  const extractPlainText = (): string => {
    const el = editorRef.current;
    if (!el) return "";
    const collect = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      const htmlEl = node as HTMLElement;
      if (htmlEl.nodeName === "BR") return "\n";
      if (htmlEl.dataset?.type === "mention") return "";
      let result = "";
      node.childNodes.forEach((child) => { result += collect(child); });
      if (htmlEl.tagName === "DIV" && node !== el) result += "\n";
      return result;
    };
    return collect(el).replace(/\n$/, "");
  };

  // Create a badge DOM element (non-editable, inline)
  const createBadgeElement = (entry: { id: string; imageUrl: string; imageNumber: number }): HTMLSpanElement => {
    const span = document.createElement("span");
    span.contentEditable = "false";
    span.dataset.type = "mention";
    span.dataset.mentionId = entry.id;
    span.setAttribute(
      "class",
      "inline-flex items-center gap-1 bg-cyan-500/20 border border-cyan-400/40 rounded px-1.5 py-0.5 align-middle mx-0.5 select-none"
    );
    span.style.cursor = "default";
    span.style.fontSize = "inherit";

    const img = document.createElement("img");
    img.src = entry.imageUrl;
    img.alt = `Image ${entry.imageNumber}`;
    img.setAttribute("class", "w-4 h-4 object-cover rounded");

    const label = document.createElement("span");
    label.setAttribute("class", "text-cyan-300 text-sm font-medium whitespace-nowrap");
    label.textContent = `Image ${entry.imageNumber}`;

    const closeBtn = document.createElement("button");
    closeBtn.setAttribute("type", "button");
    closeBtn.setAttribute("title", "Remove");
    closeBtn.setAttribute(
      "class",
      "ml-0.5 flex items-center justify-center w-3.5 h-3.5 rounded-full text-cyan-400/70 hover:text-white hover:bg-cyan-400/30 transition-colors"
    );
    closeBtn.innerHTML =
      `<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">` +
      `<line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`;
    closeBtn.addEventListener("mousedown", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const editor = editorRef.current;
      span.remove();
      if (editor) {
        editor.dispatchEvent(new Event("input", { bubbles: true }));
      }
    });

    span.appendChild(img);
    span.appendChild(label);
    span.appendChild(closeBtn);
    return span;
  };

  // Insert a badge at current caret position (or restore saved position)
  const insertBadgeAtCaret = (entry: { id: string; imageUrl: string; imageNumber: number }) => {
    const el = editorRef.current;
    if (!el) return;
    el.focus();
    const selection = window.getSelection();
    if (!selection) return;
    let range: Range;
    if (selection.rangeCount > 0) {
      range = selection.getRangeAt(0);
      range.deleteContents();
    } else if (savedSelectionRef.current) {
      try {
        range = document.createRange();
        range.setStart(savedSelectionRef.current.container, savedSelectionRef.current.offset);
        range.collapse(true);
        selection.addRange(range);
      } catch {
        range = document.createRange();
        range.selectNodeContents(el);
        range.collapse(false);
        selection.addRange(range);
      }
      range = selection.getRangeAt(0);
    } else {
      range = document.createRange();
      range.selectNodeContents(el);
      range.collapse(false);
      selection.addRange(range);
      range = selection.getRangeAt(0);
    }
    const badge = createBadgeElement(entry);
    range.insertNode(badge);
    const newRange = document.createRange();
    newRange.setStartAfter(badge);
    newRange.collapse(true);
    selection.removeAllRanges();
    selection.addRange(newRange);
    setEditorIsEmpty(false);
    setTimeout(() => {
      const plainText = extractPlainText();
      setCurrentPrompt(plainText);
      onUserPromptChange?.(plainText);
    }, 0);
  };

  const handleAddReference = (file: File) => {
    onAddReferenceImage?.(file);
  };

  const handleEditorInput = () => {
    if (isComposingRef.current) return;
    const el = editorRef.current;
    if (!el) return;
    const hasContent = el.innerHTML !== "" && el.innerHTML !== "<br>";
    setEditorIsEmpty(!hasContent);
    const plainText = extractPlainText();
    setCurrentPrompt(plainText);
    onUserPromptChange?.(plainText);
  };

  const handleCompositionStart = () => { isComposingRef.current = true; };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    handleEditorInput();
  };

  const handleEditorBlur = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = { container: range.startContainer, offset: range.startOffset };
    }
  };

  useEffect(() => {
    const el = editorRef.current;
    if (!el || !userPrompt) return;
    if (el.textContent === "") {
      el.textContent = userPrompt;
      setEditorIsEmpty(false);
    }
  }, []);

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, imageUrl: string, imageIndex: number) => {
    e.dataTransfer.setData("imageUrl", imageUrl);
    e.dataTransfer.setData("imageIndex", imageIndex.toString());
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  // Handle drop - use browser caretRangeFromPoint for exact cursor placement
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const imageUrl = e.dataTransfer.getData("imageUrl");
    const imageIndex = e.dataTransfer.getData("imageIndex");
    if (!imageUrl || imageIndex === "") return;
    const imageNumber = parseInt(imageIndex) + 1;
    let range: Range | null = null;
    const doc = document as any;
    if (typeof doc.caretRangeFromPoint === "function") {
      range = doc.caretRangeFromPoint(e.clientX, e.clientY);
    } else if (typeof doc.caretPositionFromPoint === "function") {
      const pos = doc.caretPositionFromPoint(e.clientX, e.clientY);
      if (pos) {
        range = document.createRange();
        range.setStart(pos.offsetNode, pos.offset);
        range.collapse(true);
      }
    }
    if (range) {
      const selection = window.getSelection();
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
    insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl, imageNumber });
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
    <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Reference Images */}
        <div className="space-y-2">
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Reference Images</p>
          
          <div className="flex gap-2 overflow-x-auto pb-2">
            {referenceImages.map((img, index) => (
              <div key={img.id} className="relative flex-shrink-0 group">
                <img
                  src={img.url}
                  alt={`Reference ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-white/10 cursor-move relative z-10"
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.url, index)}
                />
                <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[10px] px-1 rounded-full z-20">
                  Image {index + 1}
                </div>
                <button
                  onClick={() => insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl: img.url, imageNumber: index + 1 })}
                  className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center z-0"
                  title="Insert mention"
                >
                  <Plus className="w-4 h-4 text-white" />
                </button>
                <button
                  onClick={() => onRemoveReferenceImage?.(img.id)}
                  className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
            
            {/* Add reference button - positioned after last image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-white/20 hover:border-white/30 transition-colors flex flex-col items-center justify-center gap-1 group"
            >
              <Plus className="w-4 h-4 text-gray-400 group-hover:text-white transition-colors" />
              <span className="text-[10px] text-gray-400 group-hover:text-white transition-colors">Add</span>
            </button>
          </div>
          
          {referenceImages.length === 0 && (
            <p className="text-xs text-gray-500">
              Click to add reference images for consistent characters and props
            </p>
          )}
        </div>

        {/* Main Panel */}
        <div className="bg-[#0a0a0f]/98 backdrop-blur-md rounded-2xl border border-white/10">
          {/* User Prompt Area */}
          {mode !== "describe" ? null : (
            <div className="px-[10px] pt-[10px] pb-0">
              <div className="relative">
                <div
                  ref={editorRef}
                  contentEditable={true}
                  suppressContentEditableWarning={true}
                  onInput={handleEditorInput}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onBlur={handleEditorBlur}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-gray-300 focus:outline-none focus:border-emerald-500/30 leading-6 text-sm selection:bg-white/20"
                  style={{
                    minHeight: `${TEXTAREA_MIN_HEIGHT}px`,
                    maxHeight: `${TEXTAREA_MAX_HEIGHT}px`,
                    overflowY: "auto",
                    whiteSpace: "pre-wrap",
                    wordBreak: "break-word",
                  }}
                />
                {editorIsEmpty && (
                  <div className="absolute top-2 left-3 right-3 text-gray-500 text-sm pointer-events-none select-none leading-6">
                    Describe your element... drag &amp; drop reference images here
                  </div>
                )}
              </div>
              
              {/* Prompt Library Button */}
              <div className="flex items-center justify-end mt-2">
                <button
                  onClick={() => setIsPromptLibraryOpen(true)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-medium"
                >
                  <BookOpen className="w-3 h-3" />
                  Prompt Library
                </button>
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
              <div className="relative" style={{ width: "160px" }}>
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span>{inpaintModelOptions.find(m => m.value === model)?.label || "Select Model"}</span>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {inpaintModelOptions.map((modelOption) => (
                        <button
                          key={modelOption.value}
                          onClick={() => {
                            onModelChange?.(modelOption.value);
                            setShowModelDropdown(false);
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

            {/* Aspect Ratio Select Box */}
            <div className="relative" style={{ width: "120px" }}>
              <button
                onClick={() => setShowAspectRatioDropdown(!showAspectRatioDropdown)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <span>{aspectRatioOptions.find(o => o.value === aspectRatio)?.label || "Ratio"}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
              </button>
              
              {showAspectRatioDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    {aspectRatioOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setAspectRatio(option.value);
                          setShowAspectRatioDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                          aspectRatio === option.value
                            ? "bg-blue-500/20 text-blue-300"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <div>{option.label}</div>
                        <div className="text-[11px] text-gray-500">{option.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Resolution Select Box */}
            <div className="relative" style={{ width: "100px" }}>
              <button
                onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <span>{resolutionOptions.find(o => o.value === resolution)?.label || "Res"}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
              </button>
              
              {showResolutionDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    {resolutionOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setResolution(option.value);
                          setShowResolutionDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                          resolution === option.value
                            ? "bg-blue-500/20 text-blue-300"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <div>{option.label}</div>
                        <div className="text-[11px] text-gray-500">{option.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Output Format Select Box */}
            <div className="relative" style={{ width: "100px" }}>
              <button
                onClick={() => setShowOutputFormatDropdown(!showOutputFormatDropdown)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <span>{outputFormatOptions.find(o => o.value === outputFormat)?.label || "Format"}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
              </button>
              
              {showOutputFormatDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    {outputFormatOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => {
                          setOutputFormat(option.value);
                          setShowOutputFormatDropdown(false);
                        }}
                        className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                          outputFormat === option.value
                            ? "bg-blue-500/20 text-blue-300"
                            : "text-gray-300 hover:bg-white/5"
                        }`}
                      >
                        <div>{option.label}</div>
                        <div className="text-[11px] text-gray-500">{option.sub}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

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

      {/* Prompt Library Modal */}
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(prompt) => {
          const el = editorRef.current;
          if (el) {
            el.textContent = prompt;
            setEditorIsEmpty(false);
            setCurrentPrompt(prompt);
            onUserPromptChange?.(prompt);
          }
        }}
        userCompanyId={userCompanyId}
      />
    </>
  );
}
