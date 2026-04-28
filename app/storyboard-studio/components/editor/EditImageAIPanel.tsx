"use client";

import { toast } from "sonner";
import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePricingData } from "../shared/usePricingData";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { api } from "@/convex/_generated/api";
import { FileBrowser } from "../ai/FileBrowser";
import { ElementLibrary } from "../ai/ElementLibrary";
import PromptLibrary from "../ai/PromptLibrary";
import { AddImageMenu } from "../shared/AddImageMenu";
import { usePromptEditor } from "../shared/usePromptEditor";
import { PromptTextarea } from "../shared/PromptTextarea";
import { PromptActionsDropdown } from "../shared/PromptActionsDropdown";
import {
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2, FolderOpen, MonitorDown, FolderDown, FileText, Camera, Zap, Layers,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp,
  Eye, EyeOff, Bug, Video, Coins, Sun, ImageOff, Expand,
} from "lucide-react";

// Import Paintbrush separately to avoid conflicts
const Paintbrush = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

// ── Post-Processing Presets ────────────────────────────────────────────
const ENHANCE_PRESETS = [
  { id: "face-skin", label: "Face & Skin", prompt: "Enhance facial details, natural skin retouching, restore clarity, improve skin texture while maintaining realism, professional portrait retouching" },
  { id: "sharpen", label: "Sharpen", prompt: "Enhance fine details, sharpen textures and edges, increase clarity, improve micro-contrast while preserving natural look" },
  { id: "color-tone", label: "Color & Tone", prompt: "Professional color correction, enhance color vibrancy, improve tonal range, cinematic color grading, balanced highlights and shadows" },
  { id: "cinematic", label: "Cinematic", prompt: "Cinematic film grade enhancement, add subtle film grain, anamorphic lens quality, professional color grading, shallow depth of field feel" },
  { id: "full", label: "Full Enhance", prompt: "Professional image enhancement: sharpen details, improve skin texture, enhance colors, cinematic color grading, increase clarity, natural retouching" },
  { id: "bw-film", label: "B&W Film", prompt: "Convert to black and white film photography, rich tonal range, deep blacks, bright whites, classic silver gelatin print look, Kodak Tri-X grain texture, dramatic contrast" },
  { id: "16mm-film", label: "16mm Film", prompt: "Apply 16mm film stock look, visible film grain, slightly soft focus, warm color cast, lifted blacks, vintage color science, nostalgic indie film aesthetic" },
  { id: "old-lens", label: "Old Lens", prompt: "Apply vintage lens characteristics, soft vignetting, subtle chromatic aberration, dreamy glow in highlights, slightly desaturated colors, classic portrait lens rendering" },
  { id: "split-tone", label: "Split Tone", prompt: "Apply split toning color grade, cool blue shadows with warm amber highlights, cinematic color separation, teal and orange look, balanced mid-tones" },
  { id: "soft-skin", label: "Soft Skin", prompt: "Apply soft skin beauty retouching, smooth skin texture, preserve pores subtly, soft diffused glow, beauty dish lighting feel, magazine editorial finish" },
  { id: "natural", label: "Natural", prompt: "Apply natural color correction, true-to-life colors, balanced white point, neutral skin tones, clean highlights, natural shadow detail, no artificial grading" },
];

const RELIGHT_PRESETS = [
  { id: "dramatic-side", label: "Dramatic Side", prompt: "Relight this image with strong directional side light from the left, deep shadows on right, high contrast, dramatic cinematic mood" },
  { id: "soft-front", label: "Soft Front", prompt: "Relight this image with soft diffused front lighting, even illumination, beauty lighting, soft shadows, flattering portrait light" },
  { id: "backlit", label: "Backlit / Rim", prompt: "Relight this image with strong backlight creating rim light and silhouette edge glow, lens flare, contre-jour cinematic lighting" },
  { id: "golden-hour", label: "Golden Hour", prompt: "Relight this image with warm golden hour sunlight, long shadows, amber tones, magic hour cinematography, warm color grading" },
  { id: "blue-hour", label: "Blue Hour", prompt: "Relight this image with cool blue twilight lighting, soft ambient, pre-dawn or post-sunset atmosphere, cold color grading" },
  { id: "neon", label: "Neon Night", prompt: "Relight this image with neon colored lighting, cyberpunk city glow, mixed colored light sources, urban night atmosphere" },
  { id: "moonlight", label: "Moonlight", prompt: "Relight this image with cold moonlight from above, blue-silver tones, night scene, low ambient light, mysterious atmosphere" },
  { id: "rembrandt", label: "Studio Rembrandt", prompt: "Relight this image with classic Rembrandt lighting, triangle of light on cheek, one key light at 45 degrees, dramatic portrait" },
  { id: "overhead", label: "Overhead", prompt: "Relight this image with harsh overhead lighting, strong top-down shadows, noon sun directly above, high contrast" },
  { id: "underlight", label: "Underlight", prompt: "Relight this image with dramatic underlighting from below, horror/thriller mood, eerie upward shadows, unsettling atmosphere" },
];

const REFRAME_SIZES = [
  { id: "landscape_16_9", label: "16:9" },
  { id: "landscape_4_3", label: "4:3" },
  { id: "square_hd", label: "1:1" },
  { id: "portrait_4_3", label: "3:4" },
  { id: "portrait_16_9", label: "9:16" },
];

// ── Types ─────────────────────────────────────────────────────────────
export type AIEditMode = "area-edit" | "annotate";

interface ReferenceImageMetadata {
  companyId: string;
  elementId?: string;
  fileId?: string;
  r2Key?: string;
  addedAt: number;
  originalId?: string;
  originalSource?: string;
  element?: any;
  type?: string;
  source?: string;
  selectedAt?: number;
  category?: string;
  isFavorite?: boolean;
  isGlobal?: boolean;
  elementType?: string;
  elementName?: string;
}

interface ReferenceImage {
  id: string;
  url: string;
  source?: string;
}

export interface EditImageAIPanelProps {
  mode: AIEditMode;
  onModeChange: (mode: AIEditMode) => void;
  onGenerate: (creditsUsed: number, quality?: string) => void;
  onGenerateQuality?: (quality: string) => void;
  onSaveSelectedImage?: () => void;
  projectId?: Id<"storyboard_projects">;
  credits?: number;
  model?: string;
  onModelChange?: (model: string) => void;
  referenceImages?: ReferenceImage[];
  onAddReferenceImage?: (file: File) => void;
  onRemoveReferenceImage?: (id: string) => void;
  userPrompt?: string;
  onUserPromptChange?: (prompt: string) => void;
  isGenerating?: boolean;
  userCompanyId?: string;
  // Canvas props for area-edit mode
  isEraser?: boolean;
  setIsEraser?: (isEraser: boolean) => void;
  // NEW: Active shot props for loading prompts
  activeShotDescription?: string;
  activeShotImagePrompt?: string;
  activeShotVideoPrompt?: string;
  maskBrushSize?: number;
  setMaskBrushSize?: (size: number) => void;
  maskOpacity?: number;
  setMaskOpacity?: (opacity: number) => void;
  showMask?: boolean;
  setShowMask?: (show: boolean) => void;
  canvasState?: {
    mask: Array<{ x: number; y: number; }>;
  };
  setCanvasState?: (state: any) => void;
  onToolSelect?: (tool: string) => void;
  onCropRemove?: () => void;
  onCropExecute?: (aspectRatio: string) => void;
  onSetSquareMode?: (isSquare: boolean) => void;
  onResetRectangle?: () => void;
  onSetOriginalImage?: (imageUrl: string) => void;
  onUploadOverride?: () => void;
  onDownloadCanvas?: () => void;
  onSaveAsOriginal?: () => void;
  onSaveToUploadFolder?: () => void;
  onAddCanvasElement?: (file: File) => void;
  backgroundImage?: string;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
  onFitToScreen?: () => void;
  zoomLevel?: number;
  onZoomChange?: (zoom: number) => void;
  selectedColor?: string;
  setSelectedColor?: (color: string) => void;
  onColorPickerClick?: () => void; // Add handler for color picker click
  onDeleteSelected?: () => void; // Add handler for delete selected element
  onAspectRatioChange?: (aspectRatio: string) => void; // Add handler for aspect ratio changes
  selectedAspectRatio?: string; // Add selected aspect ratio prop
  onRectangleMaskAspectRatioChange?: (aspectRatio: string) => void;
  // Combine layers callback
  onCombine?: () => void;
  // Generated images for reference selection
  generatedItemImages?: Array<{ id: string; url: string; filename: string }>;
  generatedProjectImages?: Array<{ id: string; url: string; filename: string }>;
  onAddReferenceFromUrl?: (url: string) => void | Promise<void>;
  activeShotId?: string;
  originalImage?: string;
  userId?: string;
  user?: any;
}

// ── Available Models ─────────────────────────────────────────────────
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "nano-banana-pro", label: "Nano Banana Pro", icon: "G" },
  { id: "nano-banana-1", label: "Nano Banana 1", icon: "G" },
  { id: "stable-diffusion", label: "Stable Diffusion", icon: "S" },
  { id: "google/nano-banana-edit", label: "Nano Banana Edit", icon: "" },
  { id: "character-remix", label: "Character Remix", icon: "" },
  { id: "gpt-image/1.5-image-to-image", label: "GPT 1.5 Image to Image", icon: "" },
  { id: "ideogram/character-edit", label: "Character Edit", icon: "" },
  { id: "recraft/crisp-upscale", label: "Recraft Crisp", icon: "" },
  { id: "topaz/image-upscale", label: "Topaz Upscale", icon: "" },
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
      className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
        active
          ? "bg-white/10 text-(--text-primary)"
          : danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
      } ${className || ""}`}
      title={title}
    >
      {children}
    </button>
  );
}

// ── Component ─────────────────────────────────────────────────────────
export default function EditImageAIPanel({
  mode,
  onModeChange,
  onGenerate,
  onGenerateQuality,
  onSaveSelectedImage,
  projectId,
  credits,
  model,
  onModelChange,
  referenceImages,
  onAddReferenceImage,
  onRemoveReferenceImage,
  userPrompt,
  onUserPromptChange,
  isGenerating = false,
  userCompanyId = "",
  isEraser,
  setIsEraser,
  maskBrushSize,
  setMaskBrushSize,
  maskOpacity,
  setMaskOpacity,
  showMask,
  setShowMask,
  canvasState,
  setCanvasState,
  onToolSelect,
  onCropRemove,
  onCropExecute,
  onSetSquareMode,
  onResetRectangle,
  onSetOriginalImage,
  onUploadOverride,
  onDownloadCanvas,
  onSaveAsOriginal,
  onSaveToUploadFolder,
  onAddCanvasElement,
  backgroundImage,
  onZoomIn,
  onZoomOut,
  onFitToScreen,
  zoomLevel,
  onZoomChange,
  selectedColor,
  setSelectedColor,
  onColorPickerClick,
  onDeleteSelected,
  onAspectRatioChange,
  selectedAspectRatio,
  onRectangleMaskAspectRatioChange,
  onCombine,
  generatedItemImages,
  generatedProjectImages,
  onAddReferenceFromUrl,
  // NEW: Active shot props
  activeShotDescription,
  activeShotImagePrompt,
  activeShotVideoPrompt,
}: EditImageAIPanelProps) {
  console.log('🚀 EditImageAIPanel component loaded! Are we on the right component?');
  
  // Get the proper companyId using the auth hook
  const currentCompanyId = useCurrentCompanyId();
  
  console.log('🎯 EditImageAIPanel component mounted!');
  console.log('🎯 ReferenceImages prop:', referenceImages);
  console.log('🎯 ReferenceImages length:', referenceImages?.length || 0);
  console.log('🎯 onAddReferenceImage:', !!onAddReferenceImage);
  console.log('🎯 onRemoveReferenceImage:', !!onRemoveReferenceImage);
  
  // Use exact same pattern as working CreditBalanceDisplay (avoid naming conflicts)
  const { user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const companyId = currentCompanyId || "personal";
  const userId = clerkUser?.id; // Add missing userId variable
  const [activeTool, setActiveTool] = useState("canvas-object");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showGeneratedPicker, setShowGeneratedPicker] = useState(false);
  const [fileBrowserMode, setFileBrowserMode] = useState<'reference' | 'override'>('reference');
  const [contentType, setContentType] = useState("image");
  const { models, loading: pricingLoading, error: pricingError, getModelCredits: hookGetModelCredits } = usePricingData();
  const [selectedQuality, setSelectedQuality] = useState("1K"); // Default quality for Nano Banana/Topaz
  const [gptImageQuality, setGptImageQuality] = useState("medium"); // Default quality for GPT Image
  const [outputMode, setOutputMode] = useState("image"); // Output mode: image or video
  const [resolution, setResolution] = useState("1K"); // Resolution setting
  
  // NEW: Prompt actions state
  const [savePromptName, setSavePromptName] = useState("");
  const [savePromptSaving, setSavePromptSaving] = useState(false);
  const [savePromptSuccess, setSavePromptSuccess] = useState(false);
  const [isSavePromptOpen, setIsSavePromptOpen] = useState(false);
  const [isPromptLibraryOpen, setIsPromptLibraryOpen] = useState(false);
  
  // NEW: Mutations for prompt actions
  const createTemplate = useMutation(api.promptTemplates.create);
  
  const getBalance = useQuery(api.credits.getBalance, {
    companyId: companyId
  });

  // Debug: Log when company ID changes and getBalance result
  useEffect(() => {
    console.log('[EditImageAIPanel] clerkUser:', clerkUser?.id);
    console.log('[EditImageAIPanel] organization:', organization?.id);
    console.log('[EditImageAIPanel] final companyId:', companyId);
    console.log('[EditImageAIPanel] getBalance result:', getBalance);
    console.log('[EditImageAIPanel] getBalance type:', typeof getBalance);
    console.log('[EditImageAIPanel] getBalance loading state:', getBalance === undefined ? 'loading' : 'loaded');
  }, [companyId, clerkUser?.id, organization?.id, getBalance]);

  // Get quality options from model's formulaJson
  const getQualityOptions = useCallback((modelId: string): string[] => {
    const model = models.find(m => m.modelId === modelId);
    if (!model || !model.formulaJson) {
      // Default fallback
      if (modelId.includes('gpt-image')) return ["high", "medium"];
      return ["1K", "2K", "4K"];
    }
    
    try {
      const formula = JSON.parse(model.formulaJson);
      if (formula.pricing && formula.pricing.qualities) {
        return formula.pricing.qualities.map((q: any) => q.name);
      }
    } catch (e) {
      console.error('[EditImageAIPanel] Failed to parse formulaJson:', e);
    }
    
    // Default fallback
    if (modelId.includes('gpt-image')) return ["high", "medium"];
    return ["1K", "2K", "4K"];
  }, [models]);

  // Delegate to usePricingData's getModelCredits, passing the appropriate quality
  // GPT models use gptImageQuality state, all others use selectedQuality
  const getModelCredits = useCallback((modelId: string): number => {
    const quality = (modelId.includes('gpt-image')) ? gptImageQuality : selectedQuality;
    return hookGetModelCredits(modelId, quality);
  }, [hookGetModelCredits, selectedQuality, gptImageQuality]);

  // ── ContentEditable editor helpers (now from shared usePromptEditor hook) ──

  // Add image as a new reference image (duplicate functionality)
  const addImageAsReference = (img: any, index: number) => {
    console.log('🎯 Plus icon clicked - adding as reference image!', { img, index });
    console.log('🎯 Current reference images count:', referenceImages?.length || 0);
    console.log('🎯 Max reference images:', maxReferenceImages);
    
    // Check if we've reached the maximum reference images limit
    if (maxReferenceImages > 0 && (referenceImages?.length ?? 0) >= maxReferenceImages) {
      console.log('❌ Reference limit reached:', referenceImages?.length ?? 0, '/', maxReferenceImages);
      showToast(`Maximum ${maxReferenceImages} reference images allowed for this mode`, 'error');
      return;
    }

    try {
      // Create a mock element object like ElementLibrary does
      const mockElement = {
        _id: `duplicate-${img.id}-${Date.now()}`,
        name: `Duplicate ${img.source || 'Image'} ${index + 1}`,
        type: 'image',
        thumbnailUrl: img.url,
        referenceUrls: [img.url]
      };
      
      console.log('🎯 Calling handleImageSelect like ElementLibrary...');
      // Call the same handleImageSelect function that ElementLibrary uses
      handleImageSelect('element', {
        url: img.url,
        name: mockElement.name,
        metadata: {
          originalId: img.id,
          originalSource: img.source,
          source: 'duplicate',
          element: mockElement
        }
      });
      
      console.log('✅ Reference image added successfully!');
      
    } catch (error) {
      console.error('❌ Error adding reference image:', error);
      showToast('Failed to add reference image', 'error');
    }
  };

  const promptEditor = usePromptEditor({
    onPromptChange: (text) => {
      setCurrentPrompt(text);
      onUserPromptChange?.(text);
    },
  });
  const {
    editorRef,
    editorIsEmpty,
    setEditorIsEmpty,
    extractPlainText,
    extractTextWithBadges,
    createBadgeElement,
    insertBadgeAtCaret,
    handleEditorInput,
    handleEditorBlur,
    handleCompositionStart,
    handleCompositionEnd,
    handleKeyDown: sharedHandleKeyDown,
    handleDragOver,
    handleDrop,
    savedSelectionRef,
  } = promptEditor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [currentPrompt, setCurrentPrompt] = useState(userPrompt || "");

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
    { value: "nano-banana-2", label: "Nano Banana 2", sub: "General purpose", maxReferenceImages: 7, icon: Zap },
    { value: "nano-banana-pro", label: "Nano Banana Pro", sub: "Higher quality • Max 8 refs", maxReferenceImages: 8, icon: Camera },
  ];

  // Combine all models for the consolidated dropdown
  const allModelOptions = [...inpaintModelOptions];
  const selectedModelOption = allModelOptions.find((option) => option.value === model) ?? allModelOptions[0];

  // handleKeyDown provided by shared usePromptEditor hook (aliased as sharedHandleKeyDown)

  // handleEditorInput, handleEditorBlur, handleCompositionStart/End,
  // handleDrop, handleDragOver — all provided by shared usePromptEditor hook

  const requiresPrompt = activeTool === "text-to-image";
  const [generateCooldown, setGenerateCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const canGenerate = mode === "area-edit" && !isGenerating && !generateCooldown && (!requiresPrompt || !!currentPrompt.trim());
  
  const [showBrushSizeMenu, setShowBrushSizeMenu] = useState(false);
  const [showInpaintModelDropdown, setShowInpaintModelDropdown] = useState(false);
  const [selectedEnhancePreset, setSelectedEnhancePreset] = useState(ENHANCE_PRESETS[4].id); // Full Enhance default
  const [selectedRelightPreset, setSelectedRelightPreset] = useState(RELIGHT_PRESETS[0].id); // Dramatic Side default
  const [selectedReframeSize, setSelectedReframeSize] = useState("landscape_16_9");

  // Constants for textarea
  const TEXTAREA_MIN_HEIGHT = 60;
  const TEXTAREA_MAX_HEIGHT = 200;

  // State for upload menu and prompt actions
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  // showPromptActions now managed by PromptActionsDropdown component
  const [showElementLibrary, setShowElementLibrary] = useState(false);

  // Toast notification helper (simple implementation)
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Validation functions
  const canOpenFileBrowser = () => !!(projectId && companyId); // Use companyId instead of userCompanyId
  const canOpenElementLibrary = () => !!(projectId && userId && companyId); // Use companyId instead of userCompanyId

  // Handle add reference
  const handleAddReference = (file: File) => {
    // Check if we've reached the maximum reference images limit
    if (maxReferenceImages > 0 && (referenceImages?.length ?? 0) >= maxReferenceImages) {
      showToast(`Maximum ${maxReferenceImages} reference images allowed for this mode`, 'error');
      return;
    }
    onAddReferenceImage?.(file);
  };

  // Handlers for existing component interfaces
  const handleFileBrowserSelect = (url: string, type: string, file?: any) => {
    if (type === 'image') {
      handleImageSelect('r2', { 
        url,
        metadata: {
          r2Key: file?.name || 'unknown',
          source: 'r2'
        }
      });
    }
  };

  const handleImageSelect = async (
    source: 'r2' | 'element',
    data: { 
      url: string; 
      name?: string; 
      metadata?: Partial<ReferenceImageMetadata>;
    }
  ) => {
    // Create a File object with R2 metadata for the reference image
    const filename = data.name || `r2-image-${Date.now()}.png`;
    const file = new File([''], filename, { type: 'image/png' });
    
    // Add the expected metadata properties
    (file as any).__r2Url = data.url;
    (file as any).__r2Key = data.metadata?.r2Key || filename;
    (file as any).__isTemporary = false;
    (file as any).__source = source;
    
    onAddReferenceImage?.(file);
    showToast(`Added ${source} reference image: ${filename}`, 'success');
  };

  // Capture functionality - same as VideoImageAIPanel
  const handleAddBackground = () => {
    console.log('🎯 Capture button clicked');
    
    // Check if we've reached the maximum reference images limit
    if (maxReferenceImages > 0 && (referenceImages?.length ?? 0) >= maxReferenceImages) {
      showToast(`Maximum ${maxReferenceImages} reference images allowed for this mode`, 'error');
      return;
    }

    // Reference current image as reference image (no download needed)
    try {
      console.log('🔍 Starting CanvasEditor-specific search...');
      let targetElement: HTMLElement | HTMLCanvasElement | null = null;
      let imageUrl: string | null = null;
      
      // Method 1: Look for the CanvasEditor container with data-canvas-editor="true"
      const canvasEditorContainer = document.querySelector('[data-canvas-editor="true"]');
      console.log('📊 Found CanvasEditor container:', !!canvasEditorContainer);
      
      if (canvasEditorContainer) {
        // Method 2: Look for the main image inside the CanvasEditor
        // This is the currently displayed image that the user sees
        const mainImage = canvasEditorContainer.querySelector('img[data-canvas-base-image="true"], img') as HTMLImageElement | null;
        console.log('📸 Found main image in CanvasEditor:', !!mainImage);
        
        if (mainImage) {
          const rect = mainImage.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0 && 
                           window.getComputedStyle(mainImage).display !== 'none' &&
                           window.getComputedStyle(mainImage).visibility !== 'hidden';
          
          console.log('🖼️ Main image details:', {
            dimensions: `${mainImage.naturalWidth}x${mainImage.naturalHeight}`,
            visual: `${rect.width}x${rect.height}`,
            area: rect.width * rect.height,
            visible: isVisible,
            display: window.getComputedStyle(mainImage).display,
            visibility: window.getComputedStyle(mainImage).visibility,
            src: mainImage.src.substring(0, 100) + '...',
            classes: mainImage.className,
            'data-canvas-base-image': mainImage.getAttribute('data-canvas-base-image')
          });
          
          if (isVisible && mainImage.naturalWidth > 100 && mainImage.naturalHeight > 100) {
            targetElement = mainImage;
            imageUrl = mainImage.src;
            console.log('✅ Selected main image from CanvasEditor');
          }
        }
        
        // Method 3: If no main image found, look for any canvas elements in the CanvasEditor
        if (!targetElement) {
          const canvases = canvasEditorContainer.querySelectorAll('canvas');
          console.log(`📊 Found ${canvases.length} canvas elements in CanvasEditor`);

          let bestCanvas: HTMLCanvasElement | null = null;
          let bestScore = 0;
          
          for (let i = 0; i < canvases.length; i++) {
            const canvas = canvases[i];
            const rect = canvas.getBoundingClientRect();
            const isVisible = rect.width > 0 && rect.height > 0;
            
            if (isVisible) {
              const visualArea = rect.width * rect.height;
              let score = Math.log(visualArea + 1) * 10;
              
              if (canvas.width >= 100 && canvas.height >= 100) {
                score += 50;
              }
              
              console.log(`📈 Canvas ${i} in CanvasEditor score: ${score} (area: ${visualArea})`);
              
              if (score > bestScore) {
                bestScore = score;
                bestCanvas = canvas;
                console.log(`🏆 New best canvas in CanvasEditor: Canvas ${i} with score ${score}`);
              }
            }
          }
          
          if (bestCanvas) {
            targetElement = bestCanvas;
            console.log('✅ Selected best canvas from CanvasEditor');
          }
        }
      }
      
      // Method 4: Fallback to any canvas if CanvasEditor not found
      if (!targetElement) {
        console.log('🔄 CanvasEditor not found, searching all canvases...');
        const allCanvases = document.querySelectorAll('canvas');
        console.log(`📊 Found ${allCanvases.length} total canvas elements`);

        let bestCanvas: HTMLCanvasElement | null = null;
        let bestScore = 0;
        
        for (let i = 0; i < allCanvases.length; i++) {
          const canvas = allCanvases[i];
          const rect = canvas.getBoundingClientRect();
          const isVisible = rect.width > 0 && rect.height > 0;
          
          if (isVisible) {
            const visualArea = rect.width * rect.height;
            let score = Math.log(visualArea + 1) * 10;
            
            if (canvas.width >= 100 && canvas.height >= 100) {
              score += 50;
            }
            
            if (canvas.closest('[data-canvas-editor="true"]')) {
              score += 100; // Huge bonus for CanvasEditor canvases
            }
            
            console.log(`📈 Canvas ${i} fallback score: ${score} (area: ${visualArea})`);
            
            if (score > bestScore) {
              bestScore = score;
              bestCanvas = canvas;
              console.log(`🏆 New best fallback canvas: Canvas ${i} with score ${score}`);
            }
          }
        }
        
        if (bestCanvas) {
          targetElement = bestCanvas;
          console.log('✅ Selected best fallback canvas');
        }
      }
      
      if (!targetElement) {
        console.error('❌ No suitable element found to capture');
        console.log('❌ CanvasEditor container found:', !!canvasEditorContainer);
        if (canvasEditorContainer) {
          console.log('❌ Images in CanvasEditor:', canvasEditorContainer.querySelectorAll('img').length);
          console.log('❌ Canvases in CanvasEditor:', canvasEditorContainer.querySelectorAll('canvas').length);
        }
        console.log('❌ Total canvases on page:', document.querySelectorAll('canvas').length);
        showToast('No suitable element found to capture', 'error');
        return;
      }
      
      console.log('🎯 Target element found:', targetElement.tagName, targetElement);
      console.log('🎯 This captures the currently displayed content in the CanvasEditor');
      
      // Handle image elements (create URL reference)
      if (targetElement instanceof HTMLImageElement && imageUrl) {
        console.log('🖼️ Creating URL-based reference for displayed image:', imageUrl);

        if (onAddReferenceImage) {
          const filename = imageUrl.split('/').pop() || `canvas-reference-${Date.now()}.png`;
          const file = new File([''], filename, { type: 'image/png' });

          // Add the expected metadata properties that SceneEditor looks for
          (file as any).__r2Url = imageUrl; // SceneEditor will use this as the URL
          (file as any).__r2Key = filename; // Store the filename as R2 key
          (file as any).__isTemporary = false; // Mark as not temporary

          onAddReferenceImage(file);
          showToast('Image captured and added to reference images', 'success');
          console.log('✅ Successfully captured displayed image as reference');
        } else {
          console.error('❌ onAddReferenceImage function not available');
          showToast('Reference image function not available', 'error');
        }
      }
      // Handle canvas elements (capture current visual content)
      else if (targetElement instanceof HTMLCanvasElement) {
        console.log('🖼️ Capturing current canvas visual content...');
        targetElement.toBlob((blob) => {
          if (blob) {
            console.log('✅ Canvas blob created from current visual content, size:', blob.size);
            const filename = `canvas-capture-${Date.now()}.png`;
            const file = new File([blob], filename, { type: 'image/png' });
            console.log('📁 File created from canvas visual content:', file);
            
            if (onAddReferenceImage) {
              console.log('🔄 Calling onAddReferenceImage with canvas capture...');
              onAddReferenceImage(file);
              showToast('Canvas content captured and added to reference images', 'success');
              console.log('✅ Successfully captured what is currently displayed on the canvas');
            } else {
              console.error('❌ onAddReferenceImage function not available');
              showToast('Reference image function not available', 'error');
            }
          } else {
            console.error('❌ Failed to create canvas blob from visual content');
            showToast('Failed to capture canvas content', 'error');
          }
        }, 'image/png');
      } else {
        console.error('❌ Unable to capture element type:', targetElement.tagName);
        showToast('Unable to capture element', 'error');
      }
      
    } catch (error) {
      console.error('❌ Error capturing content:', error);
      showToast('Failed to capture content', 'error');
    }
  };

  // Handle drag start for reference images
  const handleDragStart = (e: React.DragEvent, imageUrl: string, imageIndex: number) => {
    e.dataTransfer.setData("imageUrl", imageUrl);
    e.dataTransfer.setData("imageIndex", imageIndex.toString());
  };

  // Calculate maximum reference images based on model and mode
  const getMaxReferenceImages = () => {
    return selectedModelOption?.maxReferenceImages || 0;
  };

  const maxReferenceImages = getMaxReferenceImages();
  const [showColorMenu, setShowColorMenu] = useState(false);
  const [showQualityDropdown, setShowQualityDropdown] = useState(false);

  // Model options for area-edit mode (filtered by mask type)
  const modelOptions = useMemo(() => {
    return activeTool === "text-to-image" ? [
    ] : activeTool === "image-to-image" ? [
      { value: "nano-banana-2", label: "Nano Banana 2", sub: `${selectedQuality} • 7 refs`, credits: getModelCredits("nano-banana-2"), maxReferenceImages: 7 },
      { value: "nano-banana-pro", label: "Nano Banana Pro", sub: `${selectedQuality} • 7 refs`, credits: getModelCredits("nano-banana-pro"), maxReferenceImages: 7 },
      { value: "google/nano-banana-edit", label: "Nano Banana Edit", sub: "1 ref edit", credits: getModelCredits("google/nano-banana-edit"), maxReferenceImages: 1 },
      { value: "gpt-image/1.5-image-to-image", label: "GPT 1.5 Image to Image", sub: `${gptImageQuality} • 1:1 • 15 refs`, credits: getModelCredits("gpt-image/1.5-image-to-image"), maxReferenceImages: 15 },
    ] : activeTool === "upscale" ? [
      { value: "recraft/crisp-upscale", label: "Recraft Crisp", sub: "AI Upscale", credits: getModelCredits("recraft/crisp-upscale"), maxReferenceImages: 0 },
      { value: "topaz/image-upscale", label: "Topaz Upscale", sub: `${selectedQuality} Upscale`, credits: getModelCredits("topaz/image-upscale"), maxReferenceImages: 0 },
    ] : activeTool === "enhance" ? [
      { value: "gpt-image/1.5-image-to-image", label: "GPT Image 2", sub: "Best quality", credits: getModelCredits("gpt-image/1.5-image-to-image"), maxReferenceImages: 0 },
      { value: "google/nano-banana-edit", label: "Nano Banana Edit", sub: "Cheaper", credits: getModelCredits("google/nano-banana-edit"), maxReferenceImages: 0 },
    ] : activeTool === "relight" ? [
      { value: "gpt-image/1.5-image-to-image", label: "GPT Image 2", sub: "Best quality", credits: getModelCredits("gpt-image/1.5-image-to-image"), maxReferenceImages: 0 },
      { value: "google/nano-banana-edit", label: "Nano Banana Edit", sub: "Cheaper", credits: getModelCredits("google/nano-banana-edit"), maxReferenceImages: 0 },
    ] : activeTool === "remove-bg" ? [
      { value: "recraft/remove-background", label: "Recraft Remove BG", sub: "1 credit", credits: 1, maxReferenceImages: 0 },
    ] : activeTool === "reframe" ? [
      { value: "ideogram/v3-reframe", label: "Ideogram V3 Reframe", sub: "Turbo/Balanced/Quality", credits: getModelCredits("ideogram/v3-reframe"), maxReferenceImages: 0 },
    ] : [
      // Default: include character-edit for any other tools in area-edit mode
      { value: "ideogram/character-edit", label: "Character Edit", sub: "Faceshift", credits: getModelCredits("ideogram/character-edit"), maxReferenceImages: 0 },
    ];
  }, [activeTool, selectedQuality, gptImageQuality, getModelCredits, model]);

  const selectedModel = MODELS.find((m) => m.id === model) || MODELS[0];
  
  // Enhanced model normalization to handle different model formats
  const normalizedModel = (() => {
    if (model === "character-edit") return "ideogram/character-edit";
    
    // Handle GPT Image 1.5 Text model selection
    if (model === "gpt-image/1.5-text-to-image") {
      // Only set tool to text-to-image if user hasn't explicitly selected a different tool
      // Don't override if user selected image-to-image tool
      if (activeTool !== "text-to-image" && activeTool !== "image-to-image") {
        setActiveTool("text-to-image");
      }
      return "gpt-image/1.5-text-to-image";
    }
    
    // Handle GPT Image 1.5 Image to Image model selection  
    if (model === "gpt-image/1.5-image-to-image") {
      // Only set tool to image-to-image if user hasn't explicitly selected a different tool
      // Don't override if user selected text-to-image tool
      if (activeTool !== "image-to-image" && activeTool !== "text-to-image") {
        setActiveTool("image-to-image");
      }
      return "gpt-image/1.5-image-to-image";
    }
    
    // Handle Nano Banana 2 and Topaz Upscale (return as-is for quality dropdown)
    if (model === "nano-banana-2") return "nano-banana-2";
    if (model === "topaz/image-upscale") return "topaz/image-upscale";
    
    return model;
  })();

  // Auto-set quality when model changes to first available option
  useEffect(() => {
    if (normalizedModel && (normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image")) {
      // For GPT Image models, set to medium if not already set
      if (!gptImageQuality || !["high", "medium"].includes(gptImageQuality)) {
        setGptImageQuality("medium");
      }
    } else if (normalizedModel) {
      // For other models, set to first available quality
      const availableQualities = getQualityOptions(normalizedModel);
      if (availableQualities.length > 0 && !availableQualities.includes(selectedQuality)) {
        setSelectedQuality(availableQualities[0]);
      }
    }
  }, [normalizedModel, selectedQuality, gptImageQuality, getQualityOptions]);

  // Get current selected model display name
  const getSelectedModelDisplay = () => {
    const selected = modelOptions.find(m => m.value === normalizedModel) || modelOptions[0];
    return selected ? selected.label : "Model";
  };

  // Get current selected model credits
  const getSelectedModelCredits = () => {
    console.log('[DEBUG] getSelectedModelCredits called:', {
      normalizedModel,
      activeTool,
      modelOptions: modelOptions.map(m => ({ value: m.value, label: m.label, credits: m.credits }))
    });
    
    const selected = modelOptions.find(m => m.value === normalizedModel) || modelOptions[0];
    const credits = selected && (selected as any).credits ? (selected as any).credits : getModelCredits(normalizedModel ?? '');
    
    console.log('[DEBUG] getSelectedModelCredits result:', {
      selected: selected ? { value: selected.value, label: selected.label, credits: selected.credits } : null,
      credits
    });
    
    // Debug: Show the actual model data from database for recraft
    if (normalizedModel === 'recraft/crisp-upscale') {
      const model = models.find(m => m.modelId === 'recraft/crisp-upscale');
      console.log('[DEBUG] Recraft Crisp model from database:', {
        modelId: model?.modelId,
        pricingType: model?.pricingType,
        assignedFunction: model?.assignedFunction,
        creditCost: model?.creditCost,
        factor: model?.factor,
        formulaJson: model?.formulaJson
      });
    }
    
    return credits;
  };

  const alertModelCredits = (selectedModelId: string, quality?: string) => {
    const normalizedSelectedModelId = selectedModelId === "character-edit" ? "ideogram/character-edit" : selectedModelId;
    
    // Use provided quality or fallback to current selectedQuality
    const qualityForCalculation = quality || selectedQuality;
    
    // Temporarily set selectedQuality for calculation if provided
    const originalQuality = selectedQuality;
    if (quality) {
      // We need to calculate with the new quality, so we'll pass it directly to calculation
      const tempModel = models.find(m => m.modelId === normalizedSelectedModelId);
      if (tempModel && tempModel.formulaJson) {
        try {
          const formula = JSON.parse(tempModel.formulaJson);
          const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === qualityForCalculation);
          if (qualityData) {
            const factor = tempModel.factor || 1;
            const creditCharge = Math.ceil(qualityData.cost * factor);
            const fallbackOption = inpaintModelOptions.find((option) => option.value === normalizedSelectedModelId);
            const modelLabel = fallbackOption?.label || selectedModelId;
            const qualityInfo = ` (${qualityForCalculation})`;
            
            console.log("[EditImageAIPanel] Alert with new quality:", { 
              selectedModelId, 
              normalizedSelectedModelId, 
              modelLabel, 
              creditCharge, 
              qualityInfo,
              qualityForCalculation,
              activeTool
            });
            
            window.alert(`${modelLabel}${qualityInfo} will charge ${creditCharge} credits.`);
            return;
          }
        } catch (e) {
          console.error("[EditImageAIPanel] Error parsing formula for alert:", e);
        }
      }
    }
    
    // Fallback to regular calculation
    const creditCharge = getModelCredits(normalizedSelectedModelId);
    const fallbackOption = inpaintModelOptions.find((option) => option.value === normalizedSelectedModelId);
    const modelLabel = fallbackOption?.label || selectedModelId;

    // Add quality info for Nano Banana 2 and Topaz Upscale
    const qualityInfo = (normalizedSelectedModelId === "nano-banana-2" || normalizedSelectedModelId === "topaz/image-upscale") 
      ? ` (${qualityForCalculation})` 
      : '';

    console.log("[EditImageAIPanel] Alert debug:", { 
      selectedModelId, 
      normalizedSelectedModelId, 
      modelLabel, 
      creditCharge, 
      qualityInfo,
      qualityForCalculation,
      activeTool,
      normalizedModel
    });

    window.alert(`${modelLabel}${qualityInfo} will charge ${creditCharge} credits.`);
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
  const handleLeftImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        // Upload to R2 temps folder for stable storage
        const formData = new FormData();
        formData.append('file', file);
        formData.append('useTemp', 'true'); // Store in temps folder

        const response = await fetch('/api/storyboard/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success && onSetOriginalImage) {
          console.log("[EditImageAIPanel] Background image uploaded to temps:", {
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
        console.error("[EditImageAIPanel] Failed to upload background image to temps:", error);
        
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

        const response = await fetch('/api/storyboard/upload', {
          method: 'POST',
          body: formData
        });

        const result = await response.json();

        if (result.success && onAddReferenceImage) {
          console.log("[EditImageAIPanel] Reference image uploaded to temps:", {
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
        console.error("[EditImageAIPanel] Failed to upload reference image to temps:", error);
        
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
      if (onUploadOverride) {
        onUploadOverride();
      } else {
        uploadInputRef.current?.click();
      }
    } else if (id === "brush") {
      // Select brush tool (paint brush) - set character-edit model for face editing
      setActiveTool(id);
      setIsEraser?.(false);
      setShowBrushSizeMenu(false);
      onToolSelect?.("inpaint");
      // Auto-set character-edit model for brush tools
      onModelChange?.("ideogram/character-edit");
    } else if (id === "pen-brush") {
      // Select pen brush (directly activate brush tool) - set character-edit model for face editing
      setActiveTool(id);
      setIsEraser?.(false);
      setShowBrushSizeMenu(false);
      onToolSelect?.("inpaint");
      // Auto-set character-edit model for brush tools
      onModelChange?.("ideogram/character-edit");
    } else if (id === "eraser") {
      // Select eraser tool - set character-edit model for face editing
      setActiveTool(id);
      setIsEraser?.(true);
      setShowBrushSizeMenu(false);
      onToolSelect?.("inpaint");
      // Auto-set character-edit model for brush tools
      onModelChange?.("ideogram/character-edit");
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
      // Auto-set Topaz Upscale model for upscale tool
      onModelChange?.("topaz/image-upscale");
      onToolSelect?.("upscale");
    } else if (id === "enhance") {
      // Select enhance tool — uses GPT Image 2 img2img with enhance prompt presets
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onModelChange?.("gpt-image/1.5-image-to-image");
      onToolSelect?.("enhance");
      // Auto-set prompt from selected preset
      const preset = ENHANCE_PRESETS.find(p => p.id === selectedEnhancePreset) ?? ENHANCE_PRESETS[4];
      onUserPromptChange?.(preset.prompt);
      setCurrentPrompt(preset.prompt);
    } else if (id === "relight") {
      // Select relight tool — uses GPT Image 2 img2img with lighting prompt presets
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onModelChange?.("gpt-image/1.5-image-to-image");
      onToolSelect?.("relight");
      // Auto-set prompt from selected preset
      const preset = RELIGHT_PRESETS.find(p => p.id === selectedRelightPreset) ?? RELIGHT_PRESETS[0];
      onUserPromptChange?.(preset.prompt);
      setCurrentPrompt(preset.prompt);
    } else if (id === "remove-bg") {
      // Select remove background tool — uses recraft/remove-background (no prompt needed)
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onModelChange?.("recraft/remove-background");
      onToolSelect?.("remove-bg");
      // Remove BG needs no prompt — set a placeholder
      onUserPromptChange?.("Remove background");
      setCurrentPrompt("Remove background");
    } else if (id === "reframe") {
      // Select reframe/extend tool — uses ideogram/v3-reframe
      setActiveTool(id);
      setShowBrushSizeMenu(false);
      onModelChange?.("ideogram/v3-reframe");
      onToolSelect?.("reframe");
      // Set prompt for reframe
      onUserPromptChange?.("Extend and reframe this image");
      setCurrentPrompt("Extend and reframe this image");
    } else if (id === "image-to-image") {
      // Select image to image tool
      setActiveTool("image-to-image");
      setShowBrushSizeMenu(false);
      // Set square mode to false for image to image
      onSetSquareMode?.(false);
      onToolSelect?.("rectInpaint");
      // Default to nano-banana-2 for image-to-image
      onModelChange?.("nano-banana-2");
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
      if (onDownloadCanvas) {
        onDownloadCanvas();
      } else if (backgroundImage) {
        // Proxy through server to avoid CORS and force download
        const link = document.createElement('a');
        link.href = `/api/storyboard/download-image?url=${encodeURIComponent(backgroundImage)}`;
        link.download = `generated-image-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } else if (id === "delete") {
      onDeleteSelected?.();
      setActiveTool("canvas-object");
      setShowBrushSizeMenu(false);
    } else if (id === "save") {
      // Save current image as the original image (imageUrl in storyboard_items)
      if (onSaveAsOriginal) {
        onSaveAsOriginal();
      } else {
        onSaveSelectedImage?.();
      }
    } else if (id === "save-to-uploads") {
      onSaveToUploadFolder?.();
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
    return (
      <div className="absolute left-4 top-1/2 -translate-y-1/2 z-20">
        <div className="flex flex-col gap-0.5 rounded-lg p-1 shadow-lg bg-(--bg-secondary)/95 backdrop-blur-md border border-(--border-primary)">
          {mode === "annotate" ? (
            <>
              <ToolBtn active={activeTool === "canvas-object"} onClick={() => pick("canvas-object")} title="Canvas Object (no tool)">
                <MousePointer className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "move"} onClick={() => pick("move")} title="Move / Pan">
                <Hand className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-[#32363E] my-0.5" />
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
              <div className="w-full h-px bg-[#32363E] my-0.5" />
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
              <ToolBtn active={activeTool === "canvas-object"} onClick={() => pick("canvas-object")} title="Canvas Object (no tool)">
                <MousePointer className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "move"} onClick={() => pick("move")} title="Move / Pan">
                <Hand className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-[#32363E] my-0.5" />
              <ToolBtn active={activeTool === "brush"} onClick={() => pick("brush")} title="Brush">
                <Brush className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "eraser"} onClick={() => pick("eraser")} title="Eraser">
                <Eraser className={ic} />
              </ToolBtn>
              {/* Show/Hide Mask Toggle */}
              <ToolBtn active={showMask} onClick={() => setShowMask?.(!showMask)} title={showMask ? "Hide Mask" : "Show Mask"}>
                {showMask ? <Eye className={ic} /> : <EyeOff className={ic} />}
              </ToolBtn>
              {/* Pen size - shows actual brush size, independent button */}
              <button
                onClick={() => setShowBrushSizeMenu(!showBrushSizeMenu)}
                className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
                  showBrushSizeMenu
                    ? "bg-white/10 text-(--text-primary)"
                    : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                }`}
                title={`Pen Brush Size: ${maskBrushSize}px`}
              >
                <div
                  className="bg-[#E5E7EB] rounded-full" 
                  style={{ 
                    width: `${Math.min((maskBrushSize ?? 20) / 6, 8)}px`, 
                    height: `${Math.min((maskBrushSize ?? 20) / 6, 8)}px` 
                  }}
                />
              </button>
              <ToolBtn active={activeTool === "crop"} onClick={() => pick("crop")} title="Crop">
                <Scissors className={ic} />
              </ToolBtn>
              {/* Separator */}
              <div className="w-full h-px bg-[#32363E] my-0.5" />
                            {/* Clear Mask */}
              <button
                onClick={() => {
                  setCanvasState?.(s => ({ ...s, mask: [] }));
                }}
                disabled={!canvasState?.mask?.length}
                className="w-8 h-8 rounded-md flex items-center justify-center transition-all text-(--text-secondary) hover:bg-red-500/10 hover:text-red-400 disabled:opacity-30"
                title="Clear Mask"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>

        
        {/* Brush Size Menu */}
        {showBrushSizeMenu && (
          <div className="absolute left-[52px] top-[129px] translate-y-0 bg-[#0a0a0f]/98 backdrop-blur-md rounded-lg border border-white/10 shadow-xl p-2 z-30">
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

  // ── Reference Images Panel (all modes) ──────────────────
  const renderReferencePanel = () => {
    // Show in all modes now
    console.log('🎯 Rendering reference panel, mode:', mode);
    console.log('🎯 Reference images:', referenceImages);
    console.log('🎯 Reference images length:', referenceImages?.length || 0);

    return (
      <div className="px-0 py-0">
        <div className="flex items-start gap-2.5 overflow-x-auto">
        {referenceImages?.map((img, index) => {
          console.log('🎯 Rendering image:', index, img);
          return (
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
              onClick={() => onRemoveReferenceImage?.(img.id)}
              className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
            >
              <X className="w-2.5 h-2.5 text-white" />
            </button>
          </div>
        )})}
        
        {/* Combined Upload Button with Slide Menu (shared component) */}
        {maxReferenceImages > 0 && (referenceImages?.length ?? 0) < maxReferenceImages && (
          <AddImageMenu
            onUploadClick={() => fileInputRef.current?.click()}
            onR2Click={() => setShowFileBrowser(true)}
            canOpenR2={canOpenFileBrowser()}
            onR2Unavailable={() => showToast('Project and company info required to browse R2 files', 'error')}
            onElementsClick={() => setShowElementLibrary(true)}
            canOpenElements={canOpenElementLibrary()}
            onElementsUnavailable={() => showToast('Project and user info required to browse elements', 'error')}
            onCaptureClick={backgroundImage ? handleAddBackground : undefined}
            generatedItemImages={generatedItemImages}
            generatedProjectImages={generatedProjectImages}
            onSelectGeneratedImage={onAddReferenceFromUrl}
          />
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
    if (mode !== "area-edit") return null;

    // Enhance presets UI
    if (activeTool === "enhance") {
      return (
        <div className="px-3 pt-3 pb-2">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary) mb-2">Enhance Preset</div>
          <div className="flex flex-wrap gap-1.5">
            {ENHANCE_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedEnhancePreset(preset.id);
                  onUserPromptChange?.(preset.prompt);
                  setCurrentPrompt(preset.prompt);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedEnhancePreset === preset.id
                    ? "bg-purple-500/20 text-purple-300 border border-purple-500/40"
                    : "bg-white/5 text-(--text-secondary) hover:bg-white/10 border border-transparent"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Relight presets UI
    if (activeTool === "relight") {
      return (
        <div className="px-3 pt-3 pb-2">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary) mb-2">Lighting Preset</div>
          <div className="flex flex-wrap gap-1.5">
            {RELIGHT_PRESETS.map((preset) => (
              <button
                key={preset.id}
                onClick={() => {
                  setSelectedRelightPreset(preset.id);
                  onUserPromptChange?.(preset.prompt);
                  setCurrentPrompt(preset.prompt);
                }}
                className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                  selectedRelightPreset === preset.id
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : "bg-white/5 text-(--text-secondary) hover:bg-white/10 border border-transparent"
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    // Remove BG — no prompt needed, just show info
    if (activeTool === "remove-bg") {
      return (
        <div className="px-3 pt-3 pb-2">
          <div className="text-[11px] text-(--text-secondary)">
            One-click background removal. Click Generate to isolate the subject with transparent background.
          </div>
        </div>
      );
    }

    // Reframe — aspect ratio selector
    if (activeTool === "reframe") {
      return (
        <div className="px-3 pt-3 pb-2">
          <div className="text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary) mb-2">Target Aspect Ratio</div>
          <div className="flex flex-wrap gap-1.5">
            {REFRAME_SIZES.map((size) => (
              <button
                key={size.id}
                onClick={() => setSelectedReframeSize(size.id)}
                className={`px-3 py-1.5 rounded-md text-[12px] font-semibold transition-colors ${
                  selectedReframeSize === size.id
                    ? "bg-teal-500/20 text-teal-300 border border-teal-500/40"
                    : "bg-white/5 text-(--text-secondary) hover:bg-white/10 border border-transparent"
                }`}
              >
                {size.label}
              </button>
            ))}
          </div>
        </div>
      );
    }

    return (
      <div className="px-3 pt-3 pb-2">
        <div className="flex items-start gap-2">
          {/* Text Area */}
                <PromptTextarea
                  editorRef={editorRef}
                  editorIsEmpty={editorIsEmpty}
                  placeholder="Describe your edit... drag & drop reference images here"
                  minHeight={TEXTAREA_MIN_HEIGHT}
                  maxHeight={TEXTAREA_MAX_HEIGHT}
                  onInput={handleEditorInput}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onBlur={handleEditorBlur}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onKeyDown={sharedHandleKeyDown}
                />

                <PromptActionsDropdown
                  editorRef={editorRef}
                  editorIsEmpty={editorIsEmpty}
                  setEditorIsEmpty={setEditorIsEmpty}
                  setCurrentPrompt={setCurrentPrompt}
                  onUserPromptChange={onUserPromptChange}
                  extractPlainText={extractPlainText}
                  extractTextWithBadges={extractTextWithBadges}
                  onSavePrompt={() => {
                    const prompt = extractPlainText();
                    if (!prompt.trim()) return;
                    setSavePromptName("");
                    setSavePromptSuccess(false);
                    setIsSavePromptOpen(true);
                  }}
                  activeShotDescription={activeShotDescription}
                  activeShotImagePrompt={activeShotImagePrompt}
                  activeShotVideoPrompt={activeShotVideoPrompt}
                  onOpenLibrary={() => setIsPromptLibraryOpen(true)}
                  onEditorInput={handleEditorInput}
                />

              {/* Save Prompt Inline Modal */}
              {isSavePromptOpen && (
                <div className="mt-2 p-3 bg-(--bg-secondary) border border-(--border-primary) rounded-lg">
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
                            companyId: currentCompanyId,
                            isPublic: false,
                          });
                          setSavePromptSuccess(true);
                          setTimeout(() => setIsSavePromptOpen(false), 1000);
                        } catch (err) {
                          console.error(err);
                        } finally {
                          setSavePromptSaving(false);
                        }
                      }
                    }}
                    className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg px-3 py-2 text-gray-300 text-sm focus:outline-none focus:border-blue-500/30"
                    disabled={savePromptSaving}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <button
                      onClick={() => setIsSavePromptOpen(false)}
                      className="text-xs text-gray-400 hover:text-gray-300 transition-colors"
                      disabled={savePromptSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={async () => {
                        if (!savePromptName.trim()) return;
                        setSavePromptSaving(true);
                        try {
                          await createTemplate({
                            name: savePromptName.trim(),
                            prompt: extractPlainText(),
                            type: 'custom',
                            companyId: currentCompanyId,
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
                      className="text-xs bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {savePromptSaving ? 'Saving...' : savePromptSuccess ? 'Saved!' : 'Save'}
                    </button>
                  </div>
                </div>
              )}
        </div>
      </div>
    );
  };

  // ── Bottom Bar (openart.ai style with 20px gaps) ───────────────────────
  const renderBottomBar = () => {
    const modeTabs: {
      id: AIEditMode;
      label: string;
      icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
    }[] = [
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
        <div className="bg-(--bg-secondary)/95 backdrop-blur-md rounded-2xl">
          {/* Post-Processing Tools Bar (area-edit mode only) */}
          {mode === "area-edit" && (
            <div className="flex items-center gap-0.5 px-2 py-1.5 overflow-x-auto">
              {[
                { id: "_inpaint", label: "Inpaint", icon: Brush, color: "text-blue-400", bgColor: "bg-blue-500/15" },
                { id: "image-to-image", label: "Img2Img", icon: Image, color: "text-cyan-400", bgColor: "bg-cyan-500/15" },
                { id: "upscale", label: "Upscale", icon: ArrowUp, color: "text-yellow-400", bgColor: "bg-yellow-500/15" },
                { id: "enhance", label: "Enhance", icon: Sparkles, color: "text-purple-400", bgColor: "bg-purple-500/15" },
                { id: "relight", label: "Relight", icon: Sun, color: "text-amber-400", bgColor: "bg-amber-500/15" },
                { id: "remove-bg", label: "BG Remove", icon: ImageOff, color: "text-rose-400", bgColor: "bg-rose-500/15" },
                { id: "reframe", label: "Reframe", icon: Expand, color: "text-teal-400", bgColor: "bg-teal-500/15" },
              ].map((tool) => {
                const postProcessIds = ["image-to-image", "upscale", "enhance", "relight", "remove-bg", "reframe"];
                const isActive = tool.id === "_inpaint"
                  ? !postProcessIds.includes(activeTool)
                  : activeTool === tool.id;
                return (
                  <button
                    key={tool.id}
                    onClick={() => {
                      if (tool.id === "_inpaint") {
                        pick("canvas-object");
                      } else {
                        pick(tool.id);
                      }
                    }}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-[11px] font-medium tracking-wide transition-all whitespace-nowrap ${
                      isActive
                        ? `${tool.bgColor} ${tool.color}`
                        : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                    }`}
                  >
                    <tool.icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>{tool.label}</span>
                  </button>
                );
              })}
            </div>
          )}
          {/* User Prompt Area (only in area-edit mode) */}
          {renderUserPromptArea()}

          {/* Toolbar */}
          <div className="relative z-50 px-3 py-2 flex items-center gap-1 border-t border-white/5">
          {/* Mode Tabs */}
          {modeTabs.map((tab) => {
            const isActive = mode === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  onModeChange(tab.id);
                  if (tab.id === "area-edit") {
                    pick("canvas-object");
                  }
                }}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium uppercase tracking-wide transition-colors ${
                  isActive
                    ? "bg-white/10 text-(--text-primary)"
                    : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                }`}
              >
                <tab.icon className="w-4 h-4" strokeWidth={1.75} />
                <span>{tab.label}</span>
              </button>
            );
          })}

          {/* Separator */}
          <div className="w-px h-4 bg-[#32363E] mx-1" />

          {/* Model Select (in area-edit mode) */}
          {mode === "area-edit" && modelOptions.length > 0 && (
            <>
              <div className="relative">
                <button
                  onClick={() => setShowInpaintModelDropdown(!showInpaintModelDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] font-medium text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                  <span>{getSelectedModelDisplay()}</span>
                  <ChevronDown className="w-3 h-3 text-(--text-secondary)" />
                </button>
                {showInpaintModelDropdown && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowInpaintModelDropdown(false)} />
                  <div className="absolute bottom-full left-0 mb-2 w-[240px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50">
                    <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
                      Edit Model
                    </div>
                    <div className="py-1">
                      {modelOptions.map((modelOption) => (
                        <button
                          key={modelOption.value}
                          onClick={() => {
                            onModelChange?.(modelOption.value);
                            setShowInpaintModelDropdown(false);
                          }}
                          className={`w-full px-3 py-2 text-left transition-colors ${
                            model === modelOption.value ? "bg-white/8" : "hover:bg-white/5"
                          }`}
                        >
                          <div className="text-[13px] font-medium text-(--text-primary)">{modelOption.label}</div>
                          <div className="text-[11px] text-(--text-secondary) mt-0.5">{modelOption.sub}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  </>
                )}
              </div>

              {/* Quality */}
              {(normalizedModel === "nano-banana-2" || normalizedModel === "nano-banana-pro" || normalizedModel === "topaz/image-upscale" || normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") && (
                <div className="relative">
                  <button
                    onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
                    <span>
                      {(normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") ? gptImageQuality : selectedQuality}
                    </span>
                  </button>
                  {showQualityDropdown && (
                    <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowQualityDropdown(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-[100px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50">
                      <div className="py-1">
                        {getQualityOptions(normalizedModel).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => {
                              if (normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") {
                                setGptImageQuality(quality);
                              } else {
                                setSelectedQuality(quality);
                                const availableQualities = getQualityOptions(normalizedModel);
                                if (!availableQualities.includes(selectedQuality)) {
                                  setSelectedQuality(availableQualities[0]);
                                }
                              }
                              setShowQualityDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                              ((normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") ? gptImageQuality : selectedQuality) === quality
                                ? "bg-white/8 text-(--text-primary)"
                                : "text-(--text-primary) hover:bg-white/5"
                            }`}
                          >
                            {quality}
                          </button>
                        ))}
                      </div>
                    </div>
                    </>
                  )}
                </div>
              )}
            </>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Credits */}
          {mode === "area-edit" && (
            <div className="flex items-center gap-1 text-[12px] text-(--text-secondary)">
              <Coins className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
              <span>{getSelectedModelCredits()}</span>
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={() => {
              if (generateCooldown) return;
              if (mode === "area-edit" && onGenerate) {
                const modelId: string = typeof model === "string" && model.length > 0
                  ? model
                  : normalizedModel || "";
                const qualityToPass = (normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") ? gptImageQuality : selectedQuality;
                const creditsNeeded = getModelCredits(modelId);
                if (getBalance !== undefined && getBalance < creditsNeeded) {
                  toast.error(`Insufficient credits. You have ${getBalance} but need ${creditsNeeded}.`);
                  return;
                }
                setGenerateCooldown(true);
                setCooldownSeconds(5);
                const interval = setInterval(() => {
                  setCooldownSeconds(prev => {
                    if (prev <= 1) { clearInterval(interval); setGenerateCooldown(false); return 0; }
                    return prev - 1;
                  });
                }, 1000);
                onGenerate?.(creditsNeeded, qualityToPass);
                onGenerateQuality?.(qualityToPass);
              }
            }}
            disabled={!canGenerate}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-md transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white"
            title={
              mode === "annotate"
                ? "Generate not available in annotate mode."
                : requiresPrompt && !currentPrompt.trim()
                ? "Please enter a prompt."
                : undefined
            }
          >
            {isGenerating || generateCooldown ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">
              {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s...` : isGenerating ? "Generating..." : "Generate"}
            </span>
            {!generateCooldown && !isGenerating && (
              <span className="text-white/70 text-xs">+ {getSelectedModelCredits()}</span>
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
      <div className="absolute inset-0 pointer-events-none z-10 flex flex-col">
        {/* Canvas area with toolbars */}
        <div className="flex-1 relative">
          <div className="pointer-events-auto">{renderLeftToolbar()}</div>
        </div>

        {/* Bottom: Reference panel + Bottom bar */}
        <div className="pointer-events-auto">
          {renderBottomBar()}
        </div>
      </div>

      {/* Modals - rendered outside pointer-events-none container */}

      {/* FileBrowser for REFERENCE images (Add Image button) */}
      {showFileBrowser && fileBrowserMode === 'reference' && projectId && (
        <div className="pointer-events-auto">
          <FileBrowser
            projectId={projectId}
            onClose={() => setShowFileBrowser(false)}
            imageSelectionMode={true}
            onSelectImage={(imageUrl, fileName, fileData) => {
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
              setShowFileBrowser(false);
            }}
            onSelectFile={(url, type) => {
              type === 'image' && handleFileBrowserSelect(url, type);
            }}
          />
        </div>
      )}

      {/* Upload Override FileBrowser is now in SceneEditor */}

      {/* Element Library Modal */}
      {showElementLibrary && projectId && userId && clerkUser && (
        <div className="pointer-events-auto">
          <ElementLibrary
            projectId={projectId}
            userId={userId}
            user={clerkUser}
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
        </div>
      )}

      {/* Prompt Library Modal */}
      <PromptLibrary
        isOpen={isPromptLibraryOpen}
        onClose={() => setIsPromptLibraryOpen(false)}
        onSelectPrompt={(prompt) => {
          const el = editorRef.current;
          if (el) {
            el.textContent = prompt;
            setEditorIsEmpty(false);
            handleEditorInput();
          }
        }}
        userCompanyId={currentCompanyId}
      />
    </>
  );
}
