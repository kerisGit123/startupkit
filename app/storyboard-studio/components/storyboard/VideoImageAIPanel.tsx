"use client";

import React, { useState, useRef, useEffect } from "react";
import { 
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp, BookOpen, Check,
  FolderOpen, FileText, Video, Filter, Search,
  Zap, Camera, Film, Palette, Clock, Monitor, Volume2, VolumeX
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ConvexHttpClient } from "convex/browser";
import { useUser, useOrganization } from "@clerk/nextjs";
import { usePricingData } from "@/app/storyboard-studio/components/usePricingData";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";
import PromptLibrary from "./PromptLibrary";
import { FileBrowser } from "./FileBrowser";
import { ElementLibrary } from "./ElementLibrary";

// Constants for mention system
const TEXTAREA_MIN_HEIGHT = 60;
const TEXTAREA_MAX_HEIGHT = 200;

// ── Types ─────────────────────────────────────────────────────────────
export type ImageAIEditMode = "describe";

interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
}

interface ReferenceImage {
  id: string;
  url: string;
  source: 'upload' | 'r2' | 'element';
  name?: string;
  metadata?: ReferenceImageMetadata;
  type?: 'reference' | 'background'; // NEW: Track if this is a background image
}

export interface ImageAIPanelProps {
  mode: ImageAIEditMode;
  onModeChange: (mode: ImageAIEditMode) => void;
  onGenerate: () => void;
  credits?: number;
  model?: string;
  onModelChange?: (model: string) => void;
  referenceImages?: ReferenceImage[];
  onAddReferenceImage?: (file: File) => void;
  onRemoveReferenceImage?: (id: string) => void;
  onAddBackgroundImage?: (file: File) => void; // NEW: Add background image
  onRemoveBackgroundImage?: (id: string) => void; // NEW: Remove background image
  backgroundImages?: ReferenceImage[]; // NEW: Background images array
  isGenerating?: boolean;
  userPrompt?: string;
  onUserPromptChange?: (prompt: string) => void;
  activeShotDescription?: string; // NEW: For loading storyboard item description
  activeShotImagePrompt?: string; // NEW: For loading storyboard item image prompt
  activeShotVideoPrompt?: string; // NEW: For loading storyboard item video prompt
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
  // New props for R2 and element library
  projectId?: Id<"storyboard_projects">;
  userId?: string;
  user?: any; // Clerk user object
}

// ── Available Models ─────────────────────────────────────────────────
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "nano-banana-1", label: "Nano Banana 1", icon: "G" },
  { id: "stable-diffusion", label: "Stable Diffusion", icon: "S" },
  { id: "gpt-image-1-5-text-to-image", label: "GPT Image 1.5 Text", icon: "🟦" },
  { id: "nano-banana-edit", label: "Nano Banana Edit", icon: "🟩" },
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
export function ImageAIPanel({
  mode,
  onModeChange,
  onGenerate,
  credits = 20,
  model = "nano-banana-2",
  onModelChange,
  referenceImages = [],
  onAddReferenceImage,
  onRemoveReferenceImage,
  onAddBackgroundImage,
  onRemoveBackgroundImage,
  backgroundImages = [],
  isGenerating = false,
  userPrompt = "",
  onUserPromptChange,
  activeShotDescription,
  activeShotImagePrompt,
  activeShotVideoPrompt,
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
  // New props for R2 and element library
  projectId,
  userId,
  user,
}: ImageAIPanelProps) {
  const [activeTool, setActiveTool] = useState("canvas-object");
  const [showBrushSizeMenu, setShowBrushSizeMenu] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showInpaintModelDropdown, setShowInpaintModelDropdown] = useState(false);
  const [showImageMaskMenu, setShowImageMaskMenu] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  const [isSavePromptOpen, setIsSavePromptOpen] = useState(false);
  const [savePromptName, setSavePromptName] = useState("");
  const [savePromptSaving, setSavePromptSaving] = useState(false);
  const [savePromptSuccess, setSavePromptSuccess] = useState(false);
  // New state for R2 and element library
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showElementLibrary, setShowElementLibrary] = useState(false);
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showPromptActions, setShowPromptActions] = useState(false);
  const [outputMode, setOutputMode] = useState<"image" | "video">("image");
  const createTemplate = useMutation(api.promptTemplates.create);
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const deductCredits = useMutation(api.credits.deductCredits);
  
  // Use exact same pattern as working CreditBalanceDisplay (avoid naming conflicts)
  const { user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const companyId = organization?.id ?? clerkUser?.id ?? "personal";
  
  const getBalance = useQuery(api.credits.getBalance, {
    companyId: companyId
  });
  const { getModelCredits } = usePricingData();
  
  // Debug: Log when company ID changes and getBalance result
  useEffect(() => {
    console.log('[VideoImageAIPanel] clerkUser:', clerkUser?.id);
    console.log('[VideoImageAIPanel] organization:', organization?.id);
    console.log('[VideoImageAIPanel] final companyId:', companyId);
    console.log('[VideoImageAIPanel] getBalance result:', getBalance);
    console.log('[VideoImageAIPanel] getBalance type:', typeof getBalance);
    console.log('[VideoImageAIPanel] getBalance loading state:', getBalance === undefined ? 'loading' : 'loaded');
  }, [companyId, clerkUser?.id, organization?.id, getBalance]);

  // Test function to verify getBalance works - using same pattern as CreditBalanceDisplay
  const testGetBalance = async () => {
    console.log('[VideoImageAIPanel] Testing getBalance manually...');
    if (!companyId) {
      console.log('[VideoImageAIPanel] No companyId available');
      return;
    }
    
    try {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      const { api } = await import("@/convex/_generated/api");
      const balance = await convex.query(api.credits.getBalance, { companyId: companyId });
      console.log('[VideoImageAIPanel] Manual getBalance result:', balance);
      console.log('[VideoImageAIPanel] Manual getBalance type:', typeof balance);
      alert(`✅ Manual getBalance test: ${balance} credits`);
    } catch (error) {
      console.error('[VideoImageAIPanel] Manual getBalance error:', error);
      alert(`❌ Manual getBalance error: ${error}`);
    }
  };
  
  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const savedSelectionRef = useRef<{ container: Node; offset: number } | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState(userPrompt ?? "");
  const [editorIsEmpty, setEditorIsEmpty] = useState(!userPrompt);

  // Handle output mode toggle and auto-switch to Seedance model for video
  const handleOutputModeToggle = () => {
    const newMode = outputMode === "image" ? "video" : "image";
    setOutputMode(newMode);
    
    // Reset resolution to appropriate default when switching modes
    if (newMode === "video") {
      setResolution("480P");
    } else {
      setResolution("1K");
    }
    
    // Auto-switch to Seedance 1.5 Pro when switching to video mode
    if (newMode === "video" && onModelChange) {
      onModelChange("bytedance/seedance-1.5-pro");
    }
    // Auto-switch to Nano Banana 2 when switching to image mode
    else if (newMode === "image" && onModelChange) {
      onModelChange("nano-banana-2");
    }
  };

  // Model options for describe mode
  const inpaintModelOptions = [
    { value: "nano-banana-2", label: "Nano Banana 2", sub: "General purpose", maxReferenceImages: 13, icon: Zap },
    { value: "nano-banana-pro", label: "Nano Banana Pro", sub: "Higher quality • Max 8 refs", maxReferenceImages: 8, icon: Camera },
  ];
  const videoModelOptions = [
    { value: "bytedance/seedance-1.5-pro", label: "Seedance 1.5 Pro", sub: "Video generation", icon: Film, maxReferenceImages: 2 },
    { value: "google/veo-3.1", label: "Veo 3.1", sub: "Google Video generation", icon: Film, maxReferenceImages: 3 },
  ];
  // Combine all models for the consolidated dropdown
  const allModelOptions = [...inpaintModelOptions, ...videoModelOptions];
  const selectedModelOption = allModelOptions.find((option) => option.value === model) ?? allModelOptions[0];

  // Aspect ratio options
  const aspectRatioOptions = [
    { value: "1:1", label: "1:1", sub: "Square" },
    { value: "9:16", label: "9:16", sub: "Portrait" },
    { value: "16:9", label: "16:9", sub: "Landscape" },
  ];

  // Resolution options
  const imageResolutionOptions = [
    { value: "1K", label: "1K", sub: "1024×1024", icon: Monitor },
    { value: "2K", label: "2K", sub: "2048×2048", icon: Monitor },
    { value: "4K", label: "4K", sub: "4096×4096", icon: Monitor },
  ];
  const videoResolutionOptions = [
    { value: "480P", label: "480p", sub: "854×480", icon: Monitor },
    { value: "720P", label: "720p", sub: "1280×720", icon: Monitor },
    { value: "1080P", label: "1080p", sub: "1920×1080", icon: Monitor },
  ];
  const currentResolutionOptions = outputMode === "video" ? videoResolutionOptions : imageResolutionOptions;

  // Output format options
  const outputFormatOptions = [
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPG" },
  ];

  // State for new dropdowns
  const [aspectRatio, setAspectRatio] = useState("1:1");
  const [resolution, setResolution] = useState(outputMode === "video" ? "480P" : "1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [videoDuration, setVideoDuration] = useState("8s");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [veoQuality, setVeoQuality] = useState("Fast");
  const [veoMode, setVeoMode] = useState("TEXT_2_VIDEO");
  
  // Calculate maximum reference images based on model and mode
  const getMaxReferenceImages = () => {
    if (selectedModelOption.value === "google/veo-3.1") {
      if (veoMode === "FIRST_AND_LAST_FRAMES_2_VIDEO") {
        return 2;
      } else if (veoMode === "REFERENCE_2_VIDEO") {
        return 3;
      } else {
        return 0; // TEXT_2_VIDEO doesn't support reference images
      }
    }
    return selectedModelOption.maxReferenceImages || 0;
  };

  const maxReferenceImages = getMaxReferenceImages();
  
  // Dynamic credit calculation for video models using getSeedance15 function
  const displayedCredits = ["nano-banana-2", "nano-banana-pro"].includes(selectedModelOption.value)
    ? getModelCredits(selectedModelOption.value, resolution)
    : selectedModelOption.value === "bytedance/seedance-1.5-pro"
    ? (() => {
        const params = `${resolution}_${videoDuration}_${audioEnabled ? 'audio' : 'noaudio'}`;
        const credits = getModelCredits(selectedModelOption.value, params);
        console.log("[ElementImageAIPanel] Seedance credit calculation:", {
          model: selectedModelOption.value,
          resolution,
          videoDuration,
          audioEnabled,
          params,
          credits
        });
        return credits;
      })()
    : selectedModelOption.value === "google/veo-3.1"
    ? (() => {
        const credits = getModelCredits(selectedModelOption.value, veoQuality);
        console.log("[ElementImageAIPanel] Veo 3.1 credit calculation:", {
          model: selectedModelOption.value,
          veoQuality,
          credits
        });
        return credits;
      })()
    : credits;

  // Dropdown visibility states
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showOutputFormatDropdown, setShowOutputFormatDropdown] = useState(false);
  const [showVideoDurationDropdown, setShowVideoDurationDropdown] = useState(false);
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVeoQualityDropdown, setShowVeoQualityDropdown] = useState(false);
  const [showVeoModeDropdown, setShowVeoModeDropdown] = useState(false);

  // Video duration options
  const videoDurationOptions = [
    { value: "4s", label: "4s", icon: Clock },
    { value: "8s", label: "8s", icon: Clock },
    { value: "12s", label: "12s", icon: Clock },
  ];

  // Audio options
  const audioOptions = [
    { value: false, label: "Off", icon: VolumeX },
    { value: true, label: "On", icon: Volume2 },
  ];

  // Veo 3.1 quality options
  const veoQualityOptions = [
    { value: "fast", label: "Fast" },
    { value: "quality", label: "Quality" },
  ];

  // Veo 3.1 mode options
  const veoModeOptions = [
    { value: "TEXT_2_VIDEO", label: "Text to Video", sub: "Generate video from text" },
    { value: "FIRST_AND_LAST_FRAMES_2_VIDEO", label: "First & Last Frames", sub: "Generate from start/end frames" },
    { value: "REFERENCE_2_VIDEO", label: "Reference to Video", sub: "Generate from reference image" },
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

  // ── ContentEditable editor helpers ──────────────────────────────────

  // Extract plain text from the editor DOM (include badge mentions as @Image text)
  const extractPlainText = (): string => {
    const el = editorRef.current;
    if (!el) return "";
    const collect = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      const htmlEl = node as HTMLElement;
      if (htmlEl.nodeName === "BR") return "\n";
      
      // Include badge mentions as @Image text with spaces around them
      if (htmlEl.dataset?.type === "mention") {
        const label = htmlEl.querySelector('span[class*="text-cyan-300"]');
        const mentionText = label?.textContent ?? "";
        return ` ${mentionText} `; // Add spaces before and after
      }
      
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
    label.textContent = entry.source === 'r2' ? `@R2${entry.imageNumber}` : 
                        entry.source === 'element' ? `@EL${entry.imageNumber}` : 
                        `@Image${entry.imageNumber}`;

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
  const insertBadgeAtCaret = (entry: { id: string; imageUrl: string; imageNumber: number; source?: string }) => {
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
    // Check if we've reached the maximum reference images limit
    if (maxReferenceImages > 0 && referenceImages.length >= maxReferenceImages) {
      showToast(`Maximum ${maxReferenceImages} reference images allowed for this mode`, 'error');
      return;
    }
    onAddReferenceImage?.(file);
  };

  // Left upload handler - changes background/original image only
  const handleLeftImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Upload to R2 temps folder for stable storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('useTemp', 'true'); // Store in temps folder
        formData.append('companyId', companyId); // Add companyId
        if (projectId) {
          formData.append('projectId', projectId); // Add projectId if available
        }

        const response = await fetch('/api/storyboard/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success && onSetOriginalImage) {
          console.log("[VideoImageAIPanel] Background image uploaded to temps:", {
            r2Key: result.r2Key,
            publicUrl: result.publicUrl,
            isTemporary: result.isTemporary,
            expiresAt: result.expiresAt
          });
          
          // Convert the original file to data URL for AI generation
          const reader = new FileReader();
          reader.onload = (event) => {
            const dataUrl = event.target?.result as string;
            // Store R2 metadata on the data URL for reference
            (dataUrl as any).__r2Url = result.publicUrl;
            (dataUrl as any).__r2Key = result.r2Key;
            (dataUrl as any).__isTemporary = result.isTemporary;
            (dataUrl as any).__expiresAt = result.expiresAt;
            
            onSetOriginalImage(dataUrl);
          };
          reader.readAsDataURL(file);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error("[VideoImageAIPanel] Failed to upload background image to temps:", error);
        
        // Fallback to FileReader if R2 upload fails
        const reader = new FileReader();
        reader.onload = (event) => {
          const imageUrl = event.target?.result as string;
          if (onSetOriginalImage) {
            onSetOriginalImage(imageUrl);
          }
        };
        reader.readAsDataURL(file);
      }
      
      // DO NOT change reference images
      // Reference images should remain completely unchanged
    }
    // Clear the input to prevent duplicate uploads
    if (uploadInputRef.current) {
      uploadInputRef.current.value = "";
    }
  };

  // Right menu upload handler - only changes reference images
  const handleRightImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Upload to R2 temps folder for stable storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('useTemp', 'true'); // Store in temps folder
        formData.append('companyId', companyId); // Add companyId
        if (projectId) {
          formData.append('projectId', projectId); // Add projectId if available
        }

        const response = await fetch('/api/storyboard/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success && onAddReferenceImage) {
          console.log("[VideoImageAIPanel] Reference image uploaded to temps:", {
            r2Key: result.r2Key,
            publicUrl: result.publicUrl,
            fileSize: result.fileSize,
            isTemporary: result.isTemporary,
            expiresAt: result.expiresAt
          });
          
          // Create a File object with R2 metadata for the reference image
          const uploadedFile = new File([file], file.name, { type: file.type });
          (uploadedFile as any).__r2Url = result.publicUrl;
          (uploadedFile as any).__r2Key = result.r2Key;
          (uploadedFile as any).__isTemporary = result.isTemporary;
          (uploadedFile as any).__expiresAt = result.expiresAt;
          (uploadedFile as any).__size = result.fileSize; // Store file size
          
          onAddReferenceImage(uploadedFile);
        } else {
          throw new Error(result.error || 'Upload failed');
        }
      } catch (error) {
        console.error("[VideoImageAIPanel] Failed to upload reference image to temps:", error);
        
        // Fallback to direct file upload if R2 upload fails
        if (file && onAddReferenceImage) {
          onAddReferenceImage(file);
        }
      }
      
      // DO NOT change the original/background image
      // The canvas background should remain unchanged
    }
    // Clear the input to prevent duplicate uploads
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAddBackground = () => {
    console.log('🎯 Capture button clicked');
    
    // Check if we've reached the maximum reference images limit
    if (maxReferenceImages > 0 && referenceImages.length >= maxReferenceImages) {
      showToast(`Maximum ${maxReferenceImages} reference images allowed for this mode`, 'error');
      return;
    }
    
    // Reference current image as reference image (no download needed)
    try {
      console.log('🔍 Starting image reference process...');
      let targetElement = null;
      let imageUrl = null;
      
      // Method 1: Look for the main canvas in SceneEditor area
      const sceneEditorCanvases = document.querySelectorAll('.scene-editor canvas, .canvas-container canvas, canvas');
      console.log(`📊 Found ${sceneEditorCanvases.length} canvas elements`);
      
      // Method 2: Find the canvas with actual content (not just small UI canvases)
      for (let i = 0; i < sceneEditorCanvases.length; i++) {
        const canvas = sceneEditorCanvases[i];
        console.log(`🖼️ Canvas ${i}: ${canvas.width}x${canvas.height}`);
        // Check if canvas has reasonable size (likely the main canvas)
        if (canvas.width > 100 && canvas.height > 100) {
          targetElement = canvas;
          console.log('✅ Selected large canvas:', canvas);
          break;
        }
      }
      
      // Method 3: Fallback to any canvas if no large one found
      if (!targetElement && sceneEditorCanvases.length > 0) {
        targetElement = sceneEditorCanvases[0];
        console.log('🔄 Using fallback canvas:', targetElement);
      }
      
      // Method 4: If no canvas found, try to find the main image element
      if (!targetElement) {
        const mainImages = document.querySelectorAll('.scene-editor img, .canvas-container img, .main-image img, img[src*="storyboard"], img[src*="generated"]');
        console.log(`📸 Found ${mainImages.length} image elements`);
        
        for (let i = 0; i < mainImages.length; i++) {
          const img = mainImages[i];
          console.log(`🖼️ Image ${i}: ${img.naturalWidth}x${img.naturalHeight}, src: ${img.src.substring(0, 100)}...`);
          // Check if image has reasonable size and is not a thumbnail
          if (img.naturalWidth > 100 && img.naturalHeight > 100 && !img.src.includes('thumb')) {
            targetElement = img;
            imageUrl = img.src;
            console.log('✅ Selected large image:', img);
            break;
          }
        }
      }
      
      if (!targetElement) {
        console.error('❌ No image or canvas found to reference');
        showToast('No image or canvas found to reference', 'error');
        return;
      }
      
      console.log('🎯 Target element found:', targetElement.tagName, targetElement);
      
      // For image elements, create a URL-based reference instead of capturing
      if (targetElement.tagName === 'IMG' && imageUrl) {
        console.log('🖼️ Creating URL-based reference for:', imageUrl);
        
        if (onAddReferenceImage) {
          console.log('🔄 Creating reference image with URL...');
          
          // Create a File object with the expected metadata format for SceneEditor
          const filename = imageUrl.split('/').pop() || `reference-${Date.now()}.png`;
          const file = new File([''], filename, { type: 'image/png' });
          
          // Add the expected metadata properties that SceneEditor looks for
          (file as any).__r2Url = imageUrl; // SceneEditor will use this as the URL
          (file as any).__r2Key = filename; // Store the filename as R2 key
          (file as any).__isTemporary = false; // Mark as not temporary
          
          onAddReferenceImage(file);
          showToast('Image referenced successfully', 'success');
          
          console.log('✅ URL reference created with R2 metadata:', filename);
        } else {
          console.error('❌ onAddReferenceImage function not available');
          showToast('Reference image function not available', 'error');
        }
      }
      // For canvas elements, we still need to capture
      else if (targetElement.tagName === 'CANVAS') {
        console.log('🖼️ Capturing from canvas...');
        targetElement.toBlob((blob) => {
          if (blob) {
            console.log('✅ Canvas blob created, size:', blob.size);
            const filename = `canvas-capture-${Date.now()}.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            console.log('📁 File created:', file);
            
            if (onAddReferenceImage) {
              console.log('🔄 Calling onAddReferenceImage...');
              onAddReferenceImage(file);
              showToast('Canvas image added to reference images', 'success');
            } else {
              console.error('❌ onAddReferenceImage function not available');
              showToast('Reference image function not available', 'error');
            }
          } else {
            console.error('❌ Failed to create canvas blob');
            showToast('Failed to capture canvas image', 'error');
          }
        }, 'image/png');
      } else {
        console.error('❌ Unable to capture element type:', targetElement.tagName);
        showToast('Unable to capture image element', 'error');
      }
    } catch (error) {
      console.error('❌ Error referencing image:', error);
      showToast('Error referencing image', 'error');
    }
  };

  // Fallback method for image capture
  const fallbackImageCapture = (img: HTMLImageElement) => {
    console.log('� Using fallback capture method...');
    
    try {
      // Try to create a data URL from the current image
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        console.error('❌ Failed to get canvas context for fallback');
        showToast('Failed to capture image', 'error');
        return;
      }
      
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      
      // Fill with a background color first
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Try to draw the image
      ctx.drawImage(img, 0, 0);
      
      // Try to get data URL (this might still fail due to CORS)
      try {
        const dataURL = canvas.toDataURL('image/png');
        console.log('✅ Got data URL, length:', dataURL.length);
        
        // Convert data URL to blob
        fetch(dataURL)
          .then(res => res.blob())
          .then(blob => {
            const filename = `fallback-capture-${Date.now()}.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            
            if (onAddReferenceImage) {
              console.log('🔄 Calling onAddReferenceImage with fallback...');
              onAddReferenceImage(file);
              showToast('Image added to reference images', 'success');
            } else {
              console.error('❌ onAddReferenceImage function not available');
              showToast('Reference image function not available', 'error');
            }
          })
          .catch(error => {
            console.error('❌ Fallback also failed:', error);
            showToast('Failed to capture image due to CORS restrictions', 'error');
          });
      } catch (error) {
        console.error('❌ Data URL creation failed:', error);
        showToast('Unable to capture image due to CORS restrictions', 'error');
      }
    } catch (error) {
      console.error('❌ Fallback method failed:', error);
      showToast('Failed to capture image', 'error');
    }
  };

  // Validation functions
  const canOpenFileBrowser = () => !!(projectId && userCompanyId);
  const canOpenElementLibrary = () => !!(projectId && userId && user && userCompanyId);

  // Toast notification helper (simple implementation)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    // Simple console.log for now - can be replaced with actual toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Unified handler for R2 and element library image selection
  const handleImageSelect = async (
    source: 'r2' | 'element',
    data: { 
      url: string; 
      name?: string; 
      metadata?: Partial<ReferenceImageMetadata>;
    }
  ) => {
    try {
      if (!data.url?.trim()) {
        throw new Error('URL required');
      }

      const url = data.url.trim();
      console.log(`[handleImageSelect] Processing ${source} image:`, { url, name: data.name, source });

      // Skip fetch for blob URLs (local previews) and convert directly
      if (url.startsWith('blob:')) {
        console.log(`[handleImageSelect] Skipping fetch for blob URL: ${url}`);
        // For blob URLs, we can't fetch them reliably, but they're already local
        // We'll create a placeholder file with the blob data
        try {
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch blob: ${response.status}`);
          }
          const blob = await response.blob();
          const filename = data.name || `element-image-${Date.now()}.png`;
          const file = new File([blob], filename, { type: 'image/png' });
          onAddReferenceImage?.(file);
          showToast(`Added ${source} image: ${filename}`, 'success');
        } catch (err) {
          console.error(`Error fetching blob ${source} image:`, err);
          // For blob URLs that fail to fetch, create a placeholder
          const filename = data.name || `element-image-${Date.now()}.png`;
          const file = new File([''], filename, { type: 'image/png' });
          onAddReferenceImage?.(file);
          showToast(`Added ${source} image: ${filename}`, 'success');
        }
      } else {
        // For R2 URLs, handle as URL-based references (like background capture) instead of fetching
        let normalizedUrl = url;
        const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").trim().replace(/\/$/, '');
        
        console.log(`[handleImageSelect] Processing ${source} image:`, { url, name: data.name, source });
        console.log(`[handleImageSelect] Original URL: "${url}"`);
        console.log(`[handleImageSelect] Public base: "${publicBase}"`);
        
        // Strategy 1: Fix malformed URLs (duplicate protocols, missing https)
        if (url.startsWith('http://https://')) {
          normalizedUrl = url.replace('http://https://', 'https://');
        } else if (url.startsWith('https://https://')) {
          normalizedUrl = url.replace('https://https://', 'https://');
        } else if (url.startsWith('http://http://')) {
          normalizedUrl = url.replace('http://http://', 'http://');
        } else if (url.startsWith('https://http://')) {
          normalizedUrl = url.replace('https://http://', 'http://');
        } else if (!/^https?:\/\//i.test(url)) {
          // If no protocol, try multiple approaches
          if (publicBase && !url.startsWith(publicBase)) {
            normalizedUrl = `${publicBase}/${url.replace(/^\/+/, '')}`;
          } else {
            normalizedUrl = `https://${url}`;
          }
        }

        console.log(`[handleImageSelect] Normalized URL: "${normalizedUrl}"`);
        
        // For R2 reference images, create URL-based reference (like background capture)
        if (source === 'r2') {
          console.log(`[handleImageSelect] Creating URL-based reference for R2 image:`, normalizedUrl);
          
          if (onAddReferenceImage) {
            console.log(`[handleImageSelect] Creating reference image with URL...`);
            
            // Create a File object with the expected metadata format for SceneEditor
            const filename = data.name || normalizedUrl.split('/').pop() || `r2-ref-${Date.now()}.png`;
            const file = new File([''], filename, { type: 'image/png' });
            
            // Add the expected metadata properties that SceneEditor looks for
            (file as any).__r2Url = normalizedUrl; // SceneEditor will use this as the URL
            (file as any).__r2Key = data.metadata?.r2Key || filename; // Store the R2 key
            (file as any).__isTemporary = false; // Mark as not temporary
            (file as any).__source = 'r2'; // Mark as R2 source
            
            onAddReferenceImage(file);
            showToast(`Added R2 reference image: ${filename}`, 'success');
            
            console.log(`[handleImageSelect] ✅ URL reference created:`, filename);
          } else {
            console.error(`[handleImageSelect] ❌ onAddReferenceImage function not available`);
            showToast(`Reference image function not available`, 'error');
          }
        } else {
          // For element library images, try to fetch (original behavior)
          console.log(`[handleImageSelect] Attempting to fetch element library image...`);
          
          // Try to fetch with fallback strategies
          const urlAttempts = [normalizedUrl];
          
          console.log(`[handleImageSelect] Initial URL attempt: "${normalizedUrl}"`);
          console.log(`[handleImageSelect] Public base: "${publicBase}"`);
          console.log(`[handleImageSelect] Original URL starts with public base: ${url.startsWith(publicBase)}`);
          
          // Add fallback URLs if the first one fails
          if (publicBase && !normalizedUrl.startsWith(publicBase)) {
            const fallbackUrl = `${publicBase}/${url.replace(/^\/+/, '')}`;
            console.log(`[handleImageSelect] Adding fallback URL: "${fallbackUrl}"`);
            if (!urlAttempts.includes(fallbackUrl)) {
              urlAttempts.push(fallbackUrl);
            }
          }
          
          // Try without the base if it includes it
          if (url.startsWith(publicBase)) {
            const relativeUrl = url.replace(publicBase, '').replace(/^\/+/, '');
            console.log(`[handleImageSelect] Adding relative URL: "${relativeUrl}"`);
            if (relativeUrl && !urlAttempts.includes(relativeUrl)) {
              urlAttempts.push(relativeUrl);
            }
          }

          console.log(`[handleImageSelect] All URL attempts:`, urlAttempts);

          let fetchSuccess = false;
          let lastError: Error | null = null;

          for (const attemptUrl of urlAttempts) {
            console.log(`[handleImageSelect] Attempting fetch: "${attemptUrl}"`);
            console.log(`[handleImageSelect] URL details:`, {
              url: attemptUrl,
              startsWithHttp: attemptUrl.startsWith('http'),
              startsWithHttps: attemptUrl.startsWith('https'),
              containsR2Domain: attemptUrl.includes('r2.dev') || attemptUrl.includes('r2.cloudflarestorage.com'),
              urlLength: attemptUrl.length
            });
            
            try {
              const response = await fetch(attemptUrl, {
                method: 'GET',
                mode: 'cors',
                cache: 'no-cache',
                headers: {
                  'Accept': 'image/*',
                  'Origin': window.location.origin
                }
              });
              
              console.log(`[handleImageSelect] Response details for "${attemptUrl}":`, {
                status: response.status,
                statusText: response.statusText,
                ok: response.ok,
                headers: {
                  'content-type': response.headers.get('content-type'),
                  'access-control-allow-origin': response.headers.get('access-control-allow-origin'),
                  'content-length': response.headers.get('content-length')
                }
              });
              
              if (response.ok) {
                console.log(`[handleImageSelect] Fetch successful for: "${attemptUrl}"`);
                const blob = await response.blob();
                console.log(`[handleImageSelect] Blob details:`, {
                  size: blob.size,
                  type: blob.type,
                  isImage: blob.type.startsWith('image/')
                });
                const filename = data.name || attemptUrl.split('/').pop() || `${source}-image.png`;
                const file = new File([blob], filename, { type: blob.type || 'image/png' });
                onAddReferenceImage?.(file);
                showToast(`Added ${source} image: ${filename}`, 'success');
                fetchSuccess = true;
                break;
              } else {
                console.log(`[handleImageSelect] Fetch failed with status ${response.status} for: "${attemptUrl}"`);
                lastError = new Error(`Failed to fetch image: ${response.status} ${response.statusText}`);
              }
            } catch (err) {
              console.log(`[handleImageSelect] Fetch error for "${attemptUrl}":`, err);
              console.log(`[handleImageSelect] Error details:`, {
                name: err instanceof Error ? err.name : 'Unknown',
                message: err instanceof Error ? err.message : String(err),
                stack: err instanceof Error ? err.stack : undefined
              });
              lastError = err instanceof Error ? err : new Error('Unknown fetch error');
            }
          }

          if (!fetchSuccess) {
            console.error(`[handleImageSelect] All fetch attempts failed for ${source} image`);
            console.error(`[handleImageSelect] Attempted URLs:`, urlAttempts);
            console.error(`[handleImageSelect] Last error:`, lastError);
            
            // Check if it's a 404 error (image not found in R2)
            const isNotFoundError = lastError?.message.includes('404');
            const isCorsError = lastError?.message.includes('CORS') || lastError?.message.includes('cors');
            const isNetworkError = lastError?.message.includes('network') || lastError?.message.includes('fetch');
            
            console.log(`[handleImageSelect] Error type analysis:`, {
              isNotFoundError,
              isCorsError, 
              isNetworkError,
              errorMessage: lastError?.message
            });
            
            // Create a proper file with the original name even if fetch fails
            // This ensures duplicate detection still works
            const filename = data.name || `${source}-image-${Date.now()}.png`;
            console.log(`[handleImageSelect] Creating fallback file with name: ${filename}`);
            
            // Create a minimal 1x1 PNG file as fallback
            const pngData = atob('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==');
            const pngBytes = new Uint8Array(pngData.length);
            for (let i = 0; i < pngData.length; i++) {
              pngBytes[i] = pngData.charCodeAt(i);
            }
            const blob = new Blob([pngBytes], { type: 'image/png' });
            const file = new File([blob], filename, { type: 'image/png' });
            
            // Store the original URL and error info in metadata for debugging
            (file as any).__originalUrl = url;
            (file as any).__fetchError = lastError?.message;
            (file as any).__errorType = isNotFoundError ? '404' : isCorsError ? 'CORS' : isNetworkError ? 'network' : 'unknown';
            (file as any).__attemptedUrls = urlAttempts;
            
            onAddReferenceImage?.(file);
            
            // Show appropriate error message to user
            if (isNotFoundError) {
              showToast(`Image "${filename}" not found in storage. Using placeholder.`, 'warning');
            } else if (isCorsError) {
              showToast(`CORS error accessing image "${filename}". Using placeholder.`, 'warning');
            } else if (isNetworkError) {
              showToast(`Network error accessing image "${filename}". Using placeholder.`, 'warning');
            } else {
              showToast(`Failed to load image "${filename}". Using placeholder.`, 'warning');
            }
          }
        }
      }
      
      if (source === 'r2') setShowFileBrowser(false);
      // Don't close element library - let user select more elements
      // else if (source === 'element') setShowElementLibrary(false);
      
    } catch (error) {
      console.error(`[handleImageSelect]`, error);
      showToast(`Failed to add image: ${error instanceof Error ? error.message : 'Unknown error'}`, 'error');
    }
  };

  // Handlers for existing component interfaces
  const handleFileBrowserSelect = (url: string, type: string, file?: any) => {
    if (type === 'image') {
      handleImageSelect('r2', { 
        url,
        name: file?.name,
        metadata: { 
          fileId: file?._id,
          r2Key: file?.r2Key 
        }
      });
    }
  };

  const handleElementLibrarySelect = (referenceUrls: string[], name: string, element?: any) => {
    referenceUrls.forEach(url => {
      handleImageSelect('element', { 
        url, 
        name,
        metadata: { 
          elementId: element?._id,
          type: element?.type 
        }
      });
    });
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
    console.log("ElementImageAIPanel - prompt fields changed:", {
      activeShotDescription,
      activeShotImagePrompt,
      activeShotVideoPrompt,
      hasDescription: !!activeShotDescription,
      hasImagePrompt: !!activeShotImagePrompt,
      hasVideoPrompt: !!activeShotVideoPrompt
    });
  }, [activeShotDescription, activeShotImagePrompt, activeShotVideoPrompt]);

  useEffect(() => {
    const el = editorRef.current;
    if (!el || !userPrompt) return;
    if (el.textContent === "") {
      el.textContent = userPrompt;
      setEditorIsEmpty(false);
    }
  }, []);

  useEffect(() => {
    if (!selectedModelOption) return;
    if (model !== selectedModelOption.value) {
      onModelChange?.(selectedModelOption.value);
    }
  }, [model, onModelChange, selectedModelOption]);

  // Communicate to parent that we're in element mode (no brush tools needed)
  useEffect(() => {
    onToolSelect?.("element");
  }, [onToolSelect]);

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

  // ── KIE AI Generate Function ─────────────────────────────────────────────
  const handleKieAIGenerate = async () => {
    // Extract the current prompt with badges from the editor
    const extractedPrompt = extractPlainText();
    
    if (!extractedPrompt?.trim()) {
      alert("Please enter a prompt to generate");
      return;
    }

    // Check if selected model is a Nano Banana model
    if (!selectedModelOption.value.includes("nano-banana")) {
      // For non-Nano Banana models, use the original onGenerate
      onGenerate();
      return;
    }

    // For Nano Banana models, use the actual credits from getModelCredits
    console.log("🚀 Starting KIE AI generation workflow...");
    console.log("Model:", selectedModelOption.value);
    console.log("Credits needed from getModelCredits:", displayedCredits);
    console.log("Quality (resolution):", resolution);
    console.log("Extracted prompt with badges:", extractedPrompt);
    console.log("Reference images:", referenceImages);
    
    // Call onGenerate with the actual calculated credits and quality for Nano Banana models
    // This will pass the correct credits (11) and quality to the API
    onGenerate(displayedCredits, resolution, aspectRatio, outputFormat, extractedPrompt);
  };

  // ── Bottom Bar (Element AI style) ───────────────────────────────────
  const renderBottomBar = () => {
    const modeTabs: Array<{
      id: ImageAIEditMode;
      label: string;
      icon: React.ComponentType<{ className?: string }>;
    }> = [
      { id: "describe", label: "Image / Video", icon: MessageSquareText },
    ];

    return (
    <div className="absolute bottom-0 left-0 right-0 mx-[20px] mb-[20px] flex flex-col gap-3">
        {/* Reference Images Panel */}
        <div className="mb-[0px]">
          <div className="px-0 py-0">
            <div className="flex items-start gap-2.5 overflow-x-auto">
            {referenceImages.map((img, index) => (
              <div key={img.id} className="relative flex-shrink-0 group">
                <img
                  src={img.url}
                  alt={`Reference ${index + 1}`}
                  className="w-20 h-20 object-cover rounded-lg border border-white/10 cursor-move relative z-10"
                  draggable
                  onDragStart={(e) => handleDragStart(e, img.url, index)}
                />
                <div className={`absolute top-1.5 right-1.5 text-white text-[10px] px-1 rounded-full z-20 ${
                  img.source === 'r2' ? 'bg-blue-500' : 
                  img.source === 'element' ? 'bg-purple-500' : 
                  'bg-emerald-500'
                }`}>
                  {img.source === 'r2' ? 'R2' : 
                   img.source === 'element' ? 'EL' : 
                   `Image ${index + 1}`}
                </div>
                <button
                  onClick={() => insertBadgeAtCaret({ id: `mention-${Date.now()}`, imageUrl: img.url, imageNumber: index + 1, source: img.source })}
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
            
            {/* Combined Upload Button with Slide Menu */}
            {maxReferenceImages > 0 && referenceImages.length < maxReferenceImages && (
              <div className="relative">
                {/* Add Button */}
                <button
                  onClick={() => setShowUploadMenu(!showUploadMenu)}
                  className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-emerald-500/30 hover:border-emerald-500/50 transition-colors flex flex-col items-center justify-center gap-1 group"
                  title="Add reference image"
                >
                  <Plus className="w-4 h-4 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
                  <span className="text-[10px] text-emerald-400 group-hover:text-emerald-300 transition-colors">Add Image</span>
                </button>
                
                {/* Slide-out Menu from Left - Horizontal Layout */}
                {showUploadMenu && (
                  <>
                    {/* Overlay */}
                    <div 
                      className="fixed inset-0 bg-black/50 z-40"
                      onClick={() => setShowUploadMenu(false)}
                    />
                    {/* Slide Menu - Horizontal */}
                    <div className="absolute top-0 left-full ml-2 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-2xl z-50">
                      <div className="p-3">
                        {/* Horizontal Options */}
                        <div className="flex gap-2">
                          {/* Upload from computer */}
                          <button
                            onClick={() => {
                              fileInputRef.current?.click();
                              setShowUploadMenu(false);
                            }}
                            className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                            title="Upload from computer"
                          >
                            <Upload className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs">Upload</span>
                          </button>
                          
                          {/* R2 File Browser */}
                          <button
                            onClick={() => {
                              if (!canOpenFileBrowser()) {
                                if (!projectId) {
                                  showToast('Project ID required to browse R2 files', 'error');
                                } else if (!userCompanyId) {
                                  showToast('Company ID required to browse R2 files', 'error');
                                } else {
                                  showToast('Project information required to browse R2 files', 'error');
                                }
                                return;
                              }
                              setShowFileBrowser(true);
                              setShowUploadMenu(false);
                            }}
                            className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                            title="Browse R2 files"
                          >
                            <FolderOpen className="w-4 h-4 text-blue-400" />
                            <span className="text-xs">R2</span>
                          </button>
                          
                          {/* Element Library */}
                          <button
                            onClick={() => {
                              if (!canOpenElementLibrary()) {
                                if (!projectId) {
                                  showToast('Project ID required to browse elements', 'error');
                                } else if (!userId) {
                                  showToast('User ID required to browse elements', 'error');
                                } else if (!user) {
                                  showToast('Authentication required to browse elements', 'error');
                                } else if (!userCompanyId) {
                                  showToast('Company ID required to browse elements', 'error');
                                } else {
                                  showToast('Project and user information required to browse elements', 'error');
                                }
                                return;
                              }
                              setShowElementLibrary(true);
                              setShowUploadMenu(false);
                            }}
                            className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                            title="Browse elements"
                          >
                            <FileText className="w-4 h-4 text-purple-400" />
                            <span className="text-xs">Elements</span>
                          </button>
                          
                          {/* Capture Background */}
                          <button
                            onClick={() => {
                              handleAddBackground();
                              setShowUploadMenu(false);
                            }}
                            className="flex flex-col items-center gap-1 px-3 py-2 text-gray-300 hover:bg-white/10 hover:text-white transition-colors rounded-md min-w-[80px]"
                            title="Capture background"
                          >
                            <Camera className="w-4 h-4 text-orange-400" />
                            <span className="text-xs">Capture</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
          </div>
          
          {referenceImages.length === 0 && (
            <p className="text-xs text-gray-500">
              Click to add reference images from computer, R2 storage, or element library for consistent characters and props
            </p>
          )}
        </div>

        {/* Main Panel */}
        <div className="bg-[#0a0a0f]/98 backdrop-blur-md rounded-2xl border border-white/10">
          {/* User Prompt Area */}
          {mode !== "describe" ? null : (
            <div className="px-[10px] pt-[10px] pb-0">
              <div className="flex gap-2">
                {/* Text Area */}
                <div className="relative flex-1">
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
                
                {/* Prompt Actions Button on the Right */}
                <div className="flex-shrink-0">
                  <div className="relative">
                    <button
                      onClick={() => setShowPromptActions(!showPromptActions)}
                      className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-500/30 transition-colors text-xs font-medium h-full"
                      title="Prompt actions"
                    >
                      <BookOpen className="w-3 h-3" />
                      Prompt Actions
                      <ChevronDown className={`w-3 h-3 transition-transform ${showPromptActions ? 'rotate-180' : ''}`} />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {showPromptActions && (
                      <div className="absolute bottom-full right-0 mb-1 bg-[#1a1a1a] border border-white/10 rounded-lg shadow-lg z-50 min-w-[160px]">
                        <div className="py-1">
                          {/* Save Prompt */}
                          <button
                            onClick={() => {
                              const prompt = extractPlainText();
                              if (!prompt.trim()) return;
                              setSavePromptName("");
                              setSavePromptSuccess(false);
                              setIsSavePromptOpen(true);
                              setShowPromptActions(false);
                            }}
                            disabled={editorIsEmpty}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Save className="w-4 h-4 text-blue-400" />
                            <span>Save Prompt</span>
                          </button>
                          
                          {/* Test */}
                          <button
                            onClick={() => {
                              const htmlContent = editorRef.current?.innerHTML || '';
                              const plainText = extractPlainText();
                              
                              // Extract @Image mentions from HTML
                              const imageMentions = htmlContent.match(/@Image\d+/g) || [];
                              const r2Mentions = htmlContent.match(/@R2\d+/g) || [];
                              const elMentions = htmlContent.match(/@EL\d+/g) || [];
                              const allMentions = [...imageMentions, ...r2Mentions, ...elMentions];
                              
                              const mentionsText = allMentions.length > 0 ? allMentions.join(', ') : 'No @Image mentions found';
                              
                              alert(`Current textarea content:\n\n@IMAGE MENTIONS:\n${mentionsText}\n\nPLAIN TEXT:\n${plainText}`);
                              setShowPromptActions(false);
                            }}
                            disabled={editorIsEmpty}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <FileText className="w-4 h-4 text-gray-400" />
                            <span>Test</span>
                          </button>
                          
                          {/* Load Description */}
                          <button
                            onClick={() => {
                              console.log("Load Description clicked");
                              if (activeShotDescription) {
                                const el = editorRef.current;
                                if (el) {
                                  el.textContent = activeShotDescription;
                                  setEditorIsEmpty(false);
                                  setCurrentPrompt(activeShotDescription);
                                  onUserPromptChange?.(activeShotDescription);
                                  console.log("Description loaded:", activeShotDescription);
                                }
                              } else {
                                console.log("No description available");
                              }
                              setShowPromptActions(false);
                            }}
                            disabled={!activeShotDescription}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Download className="w-4 h-4 text-purple-400" />
                            <span>Load Description</span>
                          </button>
                          
                          {/* Load Image Prompt */}
                          <button
                            onClick={() => {
                              console.log("Load Image Prompt clicked");
                              if (activeShotImagePrompt) {
                                const el = editorRef.current;
                                if (el) {
                                  el.textContent = activeShotImagePrompt;
                                  setEditorIsEmpty(false);
                                  setCurrentPrompt(activeShotImagePrompt);
                                  onUserPromptChange?.(activeShotImagePrompt);
                                  console.log("Image prompt loaded:", activeShotImagePrompt);
                                }
                              } else {
                                console.log("No image prompt available");
                              }
                              setShowPromptActions(false);
                            }}
                            disabled={!activeShotImagePrompt}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Image className="w-4 h-4 text-blue-400" />
                            <span>Load Image Prompt</span>
                          </button>
                          
                          {/* Load Video Prompt */}
                          <button
                            onClick={() => {
                              console.log("Load Video Prompt clicked");
                              console.log("activeShotVideoPrompt:", activeShotVideoPrompt);
                              console.log("Type of activeShotVideoPrompt:", typeof activeShotVideoPrompt);
                              console.log("Length of activeShotVideoPrompt:", activeShotVideoPrompt?.length);
                              if (activeShotVideoPrompt) {
                                const el = editorRef.current;
                                if (el) {
                                  el.textContent = activeShotVideoPrompt;
                                  setEditorIsEmpty(false);
                                  setCurrentPrompt(activeShotVideoPrompt);
                                  onUserPromptChange?.(activeShotVideoPrompt);
                                  console.log("Video prompt loaded:", activeShotVideoPrompt);
                                }
                              } else {
                                console.log("No video prompt available");
                              }
                              setShowPromptActions(false);
                            }}
                            disabled={!activeShotVideoPrompt}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Video className="w-4 h-4 text-orange-400" />
                            <span>Load Video Prompt</span>
                          </button>
                          
                          {/* Prompt Library */}
                          <button
                            onClick={() => {
                              setIsPromptLibraryOpen(true);
                              setShowPromptActions(false);
                            }}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2"
                          >
                            <BookOpen className="w-4 h-4 text-emerald-400" />
                            <span>Prompt Library</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Save Prompt Inline Modal */}
              {isSavePromptOpen && (
                <div className="mt-2 p-3 bg-[#1a1a2e] border border-blue-500/30 rounded-lg">
                  <p className="text-xs text-gray-400 mb-2">Save prompt as:</p>
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. Dark fantasy warrior..."
                    value={savePromptName}
                    onChange={(e) => setSavePromptName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (!savePromptName.trim()) return;
                        setSavePromptSaving(true);
                        try {
                          await createTemplate({
                            name: savePromptName.trim(),
                            prompt: extractPlainText(),
                            type: 'custom',
                            companyId: userCompanyId,
                            isPublic: false,
                          });
                          setSavePromptSuccess(true);
                          setTimeout(() => setIsSavePromptOpen(false), 1000);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setSavePromptSaving(false);
                        }
                      } else if (e.key === 'Escape') {
                        setIsSavePromptOpen(false);
                      }
                    }}
                    className="w-full bg-[#0a0a0f] border border-white/10 rounded px-2 py-1.5 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:border-blue-500/50"
                  />
                  <div className="flex items-center gap-2 mt-2">
                    <button
                      onClick={async () => {
                        if (!savePromptName.trim()) return;
                        setSavePromptSaving(true);
                        try {
                          await createTemplate({
                            name: savePromptName.trim(),
                            prompt: extractPlainText(),
                            type: 'custom',
                            companyId: userCompanyId,
                            isPublic: false,
                          });
                          setSavePromptSuccess(true);
                          setTimeout(() => setIsSavePromptOpen(false), 1000);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setSavePromptSaving(false);
                        }
                      }}
                      disabled={!savePromptName.trim() || savePromptSaving}
                      className="flex items-center gap-1.5 px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white rounded text-xs font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {savePromptSuccess ? (
                        <><Check className="w-3 h-3" /> Saved!</>
                      ) : savePromptSaving ? (
                        <><div className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Saving...</>
                      ) : (
                        <><Save className="w-3 h-3" /> Save</>
                      )}
                    </button>
                    <button
                      onClick={() => setIsSavePromptOpen(false)}
                      className="px-3 py-1 text-gray-400 hover:text-white text-xs transition-colors"
                    >
                      Cancel
                    </button>
                    <span className="text-xs text-gray-500 ml-auto">Enter to save · Esc to cancel</span>
                  </div>
                </div>
              )}
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

            {/* Aspect Ratio Select Box */}
            <div className="relative" style={{ width: "80px" }}>
              <button
                onClick={() => setShowAspectRatioDropdown(!showAspectRatioDropdown)}
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
              >
                <span>{aspectRatioOptions.find(o => o.value === aspectRatio)?.label || "1:1"}</span>
                <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
              </button>
              
              {showAspectRatioDropdown && (
                <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                  <div className="p-2">
                    {aspectRatioOptions
                      .filter(option => {
                        // Hide 1:1 when Veo 3.1 is selected and mode is REFERENCE_2_VIDEO
                        if (selectedModelOption.value === "google/veo-3.1" && veoMode === "REFERENCE_2_VIDEO") {
                          return option.value !== "1:1";
                        }
                        return true;
                      })
                      .map((option) => (
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
                          <span>{option.label}</span>
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Model Select Box - Combined with Output Mode */}
            {allModelOptions.length > 0 && (
              <div className="relative" style={{ width: "220px" }}>
                <button
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {selectedModelOption?.icon && <selectedModelOption.icon className="w-4 h-4" />}
                    <span>{selectedModelOption?.label || "Nano Banana 2"}</span>
                    <span className={`text-[10px] px-2 py-0.5 rounded ${
                      outputMode === "image" ? "bg-cyan-500/20 text-cyan-300" : "bg-green-500/20 text-green-300"
                    }`}>
                      {outputMode === "image" ? "Image" : "Video"}
                    </span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showModelDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {allModelOptions.map((modelOption) => (
                        <button
                          key={modelOption.value}
                          onClick={() => {
                            // Determine the output mode based on model type
                            const modelOutputMode = videoModelOptions.some(m => m.value === modelOption.value) ? "video" : "image";
                            
                            // Switch output mode if different
                            if (modelOutputMode !== outputMode) {
                              setOutputMode(modelOutputMode);
                              // Reset resolution for the new mode
                              setResolution(modelOutputMode === "video" ? "480P" : "1K");
                            }
                            
                            onModelChange?.(modelOption.value);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            selectedModelOption?.value === modelOption.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-2">
                              {modelOption.icon && <modelOption.icon className="w-4 h-4" />}
                              <span className="font-medium">{modelOption.label}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className={`text-[10px] px-2 py-0.5 rounded ${
                                videoModelOptions.some(m => m.value === modelOption.value) 
                                  ? "bg-green-500/20 text-green-300" 
                                  : "bg-cyan-500/20 text-cyan-300"
                              }`}>
                                {videoModelOptions.some(m => m.value === modelOption.value) ? "Video" : "Image"}
                              </span>
                            </div>
                          </div>
                          <div className="text-[10px] text-gray-500 text-left mt-1">
                            {modelOption.sub}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Resolution Select Box - Only show when not Veo 3.1 */}
            {selectedModelOption.value !== "google/veo-3.1" && (
              <div className="relative" style={{ width: "120px" }}>
                <button
                  onClick={() => setShowResolutionDropdown(!showResolutionDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {currentResolutionOptions.find(o => o.value === resolution)?.icon && 
                      React.createElement(currentResolutionOptions.find(o => o.value === resolution)!.icon, { className: "w-4 h-4" })}
                    <span>{currentResolutionOptions.find(o => o.value === resolution)?.label || "Res"}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showResolutionDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {currentResolutionOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            console.log("[ElementImageAIPanel] Resolution changing from", resolution, "to", option.value);
                            setResolution(option.value);
                            setShowResolutionDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            resolution === option.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Video Duration Select Box - Only show in video mode and not Veo 3.1 */}
            {outputMode === "video" && selectedModelOption.value !== "google/veo-3.1" && (
              <div className="relative" style={{ width: "100px" }}>
                <button
                  onClick={() => setShowVideoDurationDropdown(!showVideoDurationDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {videoDurationOptions.find(o => o.value === videoDuration)?.icon && 
                      React.createElement(videoDurationOptions.find(o => o.value === videoDuration)!.icon, { className: "w-4 h-4" })}
                    <span>{videoDurationOptions.find(o => o.value === videoDuration)?.label || "8s"}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showVideoDurationDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {videoDurationOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setVideoDuration(option.value);
                            setShowVideoDurationDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            videoDuration === option.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Audio Select Box - Only show in video mode and not Veo 3.1 */}
            {outputMode === "video" && selectedModelOption.value !== "google/veo-3.1" && (
              <div className="relative" style={{ width: "120px" }}>
                <button
                  onClick={() => setShowAudioDropdown(!showAudioDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {audioOptions.find(o => o.value === audioEnabled)?.icon && 
                      React.createElement(audioOptions.find(o => o.value === audioEnabled)!.icon, { className: "w-4 h-4" })}
                    <span>{audioOptions.find(o => o.value === audioEnabled)?.label || "Off"}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showAudioDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {audioOptions.map((option) => (
                        <button
                          key={option.value.toString()}
                          onClick={() => {
                            console.log("[ElementImageAIPanel] Audio changing from", audioEnabled, "to", option.value);
                            setAudioEnabled(option.value);
                            setShowAudioDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            audioEnabled === option.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Veo 3.1 Quality Select Box - Only show for Veo 3.1 model */}
            {selectedModelOption.value === "google/veo-3.1" && (
              <div className="relative" style={{ width: "100px" }}>
                <button
                  onClick={() => setShowVeoQualityDropdown(!showVeoQualityDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{veoQualityOptions.find(o => o.value === veoQuality)?.label || "Fast"}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showVeoQualityDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {veoQualityOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setVeoQuality(option.value);
                            setShowVeoQualityDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            veoQuality === option.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <span>{option.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Veo 3.1 Mode Select Box - Only show for Veo 3.1 model */}
            {selectedModelOption.value === "google/veo-3.1" && (
              <div className="relative" style={{ width: "180px" }}>
                <button
                  onClick={() => setShowVeoModeDropdown(!showVeoModeDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{veoModeOptions.find(o => o.value === veoMode)?.label || "Text to Video"}</span>
                  </div>
                  <ChevronDown className={`w-3 h-3 text-gray-400 group-hover:text-purple-400 transition flex-shrink-0`} />
                </button>
                
                {showVeoModeDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                    <div className="p-2">
                      {veoModeOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => {
                            setVeoMode(option.value);
                            setShowVeoModeDropdown(false);
                            
                            // Handle aspect ratio restriction for REFERENCE_2_VIDEO
                            if (option.value === "REFERENCE_2_VIDEO") {
                              // Only allow 16:9 and 9:16 for reference mode
                              if (!["16:9", "9:16"].includes(aspectRatio)) {
                                // Change 1:1 to 6:19 if aspect ratio is not supported
                                setAspectRatio(aspectRatio === "1:1" ? "6:19" : "16:9");
                              }
                            }
                          }}
                          className={`w-full px-3 py-2 text-left text-[13px] transition-colors rounded ${
                            veoMode === option.value
                              ? "bg-blue-500/20 text-blue-300"
                              : "text-gray-300 hover:bg-white/5"
                          }`}
                        >
                          <div className="flex flex-col items-start">
                            <span>{option.label}</span>
                            <span className="text-[10px] text-gray-500">{option.sub}</span>
                            {option.value === "REFERENCE_2_VIDEO" && (
                              <span className="text-[9px] text-yellow-400">Only 16:9 & 9:16</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Output Format Select Box - Only show in image mode */}
            {outputMode === "image" && (
              <div className="relative" style={{ width: "80px" }}>
                <button
                  onClick={() => setShowOutputFormatDropdown(!showOutputFormatDropdown)}
                  className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center justify-between hover:bg-white/10 transition-colors"
                >
                  <span>{outputFormatOptions.find(o => o.value === outputFormat)?.label || "PNG"}</span>
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
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {option.icon && React.createElement(option.icon, { className: "w-4 h-4" })}
                              <span>{option.label}</span>
                            </div>
                            <span className="text-[10px] text-gray-500">{option.sub}</span>
                          </div>
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
              <span>{displayedCredits} credits</span>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleKieAIGenerate}
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
                  <span className="text-xs opacity-75">({displayedCredits} credits)</span>
                </>
              )}
            </button>

            {/* DEBUG: Test getBalance button */}
            {process.env.NODE_ENV === 'development' && (
              <button
                onClick={testGetBalance}
                className="flex items-center gap-2 px-3 py-1 rounded-lg transition font-medium text-[11px] bg-purple-500 hover:bg-purple-600 text-white"
              >
                Test Balance
              </button>
            )}
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

      {/* R2 File Browser Modal */}
      {showFileBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowFileBrowser(false)}
          imageSelectionMode={true} // Enable image selection mode
          filterTypes={['image']} // Only show images
          onSelectImage={(imageUrl, fileName, fileData) => {
            // Handle single image selection from R2 File Browser
            handleImageSelect('r2', {
              url: imageUrl,
              name: fileName,
              metadata: {
                source: 'r2-file-browser',
                selectedAt: Date.now(),
                r2Key: fileData.r2Key,
                fileId: fileData._id,
                category: fileData.category,
                isFavorite: fileData.isFavorite,
                isGlobal: !fileData.projectId
              }
            });
            // Auto-close after selection
            setShowFileBrowser(false);
          }}
          onSelectFile={(url, type) => 
            type === 'image' && handleFileBrowserSelect(url, type)
          }
        />
      )}

      {/* Element Library Modal */}
      {showElementLibrary && projectId && userId && user && (
        <ElementLibrary
          projectId={projectId}
          userId={userId}
          user={user}
          onClose={() => setShowElementLibrary(false)}
          imageSelectionMode={true} // Enable image selection mode
          onSelectImage={(imageUrl, elementName, element) => {
            // Handle single image selection
            handleImageSelect('element', {
              url: imageUrl,
              name: elementName,
              metadata: {
                source: 'element-library-image',
                selectedAt: Date.now(),
                elementId: element._id,
                elementType: element.type,
                elementName: element.name
              }
            });
          }}
          onSelectElement={(referenceUrls, name, element) => {
            // Handle multi-image element selection (existing behavior)
            if (referenceUrls && referenceUrls.length > 0) {
              referenceUrls.forEach(url => handleImageSelect('element', {
                url,
                name,
                metadata: {
                  source: 'element-library-element',
                  elementId: element._id,
                  elementType: element.type,
                  elementName: element.name,
                  selectedAt: Date.now()
                }
              }));
            }
          }}
        />
      )}
    </>
  );
}
