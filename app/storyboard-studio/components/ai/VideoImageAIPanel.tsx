"use client";

import { toast } from "sonner";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { 
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp, BookOpen, Check,
  FolderOpen, FileText, Video, Filter, Search,
  Zap, Camera, Film, Palette, Clock, Monitor, Volume2, VolumeX, Coins, Mic, Music
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AddImageMenu } from "../shared/AddImageMenu";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { usePromptEditor } from "../shared/usePromptEditor";
import { PromptTextarea } from "../shared/PromptTextarea";
import { ConvexHttpClient } from "convex/browser";
import { useUser, useOrganization } from "@clerk/nextjs";
import { usePricingData } from "@/app/storyboard-studio/components/shared/usePricingData";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useSubscription } from "@/hooks/useSubscription";
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
  onGenerate: (creditsUsed: number, quality: string, aspectRatio: string, duration: string, audioEnabled: boolean, extractedPrompt: string, veoQuality?: string, veoMode?: string, klingOrientation?: string, klingSource?: string, videoUrls?: string[], audioUrls?: string[], seedanceMode?: string, firstFrameUrl?: string, lastFrameUrl?: string, ugcImageUrls?: string[]) => void;
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
  // Generated images for reference selection
  generatedItemImages?: Array<{ id: string; url: string; filename: string }>;
  generatedProjectImages?: Array<{ id: string; url: string; filename: string }>;
  onSelectGeneratedImage?: (url: string) => void;
}

// ── Available Models ─────────────────────────────────────────────────
const MODELS = [
  { id: "nano-banana-2", label: "Nano Banana 2", icon: "G" },
  { id: "nano-banana-1", label: "Nano Banana 1", icon: "G" },
  { id: "z-image", label: "Z-Image", icon: "Z" },
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
  generatedItemImages,
  generatedProjectImages,
  onSelectGeneratedImage,
}: ImageAIPanelProps) {
  // Get the proper companyId using the auth hook
  const currentCompanyId = useCurrentCompanyId();
  // Plan drives auto-grant of monthly credits inside deductCredits
  const { plan: currentPlan } = useSubscription();
  
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
  const [outputMode, setOutputMode] = useState<"image" | "video" | "music">("image");
  const createTemplate = useMutation(api.promptTemplates.create);
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const deductCredits = useMutation(api.credits.deductCredits);
  
  // Use exact same pattern as working CreditBalanceDisplay (avoid naming conflicts)
  const { user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const companyId = currentCompanyId || "personal";
  
  const getBalance = useQuery(api.credits.getBalance, {
    companyId: companyId
  });
  const projectData = useQuery(api.storyboard.projects.get, projectId ? { id: projectId } : "skip");
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
    handleKeyDown,
    handleDragOver,
    handleDrop,
    savedSelectionRef,
  } = promptEditor;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const [currentPrompt, setCurrentPrompt] = useState(userPrompt ?? "");

  // Handle output mode toggle and auto-switch to Seedance model for video
  const handleOutputModeToggle = () => {
    const newMode = outputMode === "image" ? "video" : "image";
    setOutputMode(newMode);
    
    // Reset resolution and aspect ratio to appropriate defaults when switching modes
    if (newMode === "video") {
      setResolution("480P");
      setAspectRatio("16:9"); // ✅ Set to 16:9 for video mode
    } else {
      setResolution("1K");
      setAspectRatio("1:1"); // ✅ Set to 1:1 for image mode
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
    { value: "z-image", label: "Z-Image", sub: "Text-to-image • Fixed price", maxReferenceImages: 0, icon: Zap },
  ];
  const videoModelOptions = [
    { value: "bytedance/seedance-1.5-pro", label: "Seedance 1.5 Pro", sub: "Video generation", icon: Film, maxReferenceImages: 2 },
    { value: "bytedance/seedance-2", label: "Seedance 2.0", sub: "Quality • 480p/720p", icon: Film, maxReferenceImages: 9 },
    { value: "bytedance/seedance-2-fast", label: "Seedance 2.0 Fast", sub: "Faster • 480p/720p", icon: Film, maxReferenceImages: 9 },
    { value: "kling-3.0/motion-control", label: "Kling 3.0 Motion", sub: "720p/1080p • 1 img + 1 video", icon: Film, maxReferenceImages: 1 },
    { value: "google/veo-3.1", label: "Veo 3.1", sub: "Google Video generation", icon: Film, maxReferenceImages: 3 },
    { value: "grok-imagine/image-to-video", label: "Grok Imagine", sub: "480p/720p • up to 7 refs • 6-30s", icon: Film, maxReferenceImages: 7 },
    { value: "topaz/video-upscale", label: "Topaz Video Upscale", sub: "1x/2x/4x • MP4, MOV, WEBM, M4V, GIF", icon: ArrowUp, maxReferenceImages: 0 },
    { value: "infinitalk/from-audio", label: "InfiniteTalk", sub: "Lip sync • image + audio • 480p/720p", icon: Mic, maxReferenceImages: 1 },
    { value: "ai-music-api/generate", label: "AI Music", sub: "Generate music • up to 4min", icon: Music, maxReferenceImages: 0 },
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
  const currentResolutionOptions = (() => {
    if (outputMode !== "video") return imageResolutionOptions;
    if (selectedModelOption.value === "kling-3.0/motion-control") {
      return [
        { value: "720P", label: "720p", sub: "1280×720", icon: Monitor },
        { value: "1080P", label: "1080p", sub: "1920×1080", icon: Monitor },
      ];
    }
    if (selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") {
      return [
        { value: "480P", label: "480p", sub: "854×480", icon: Monitor },
        { value: "720P", label: "720p", sub: "1280×720", icon: Monitor },
      ];
    }
    if (selectedModelOption.value === "grok-imagine/image-to-video") {
      return [
        { value: "480P", label: "480p", sub: "854×480", icon: Monitor },
        { value: "720P", label: "720p", sub: "1280×720", icon: Monitor },
      ];
    }
    return videoResolutionOptions;
  })();

  // Output format options
  const outputFormatOptions = [
    { value: "png", label: "PNG" },
    { value: "jpg", label: "JPG" },
  ];

  // State for new dropdowns
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState(outputMode === "video" ? "480P" : "1K");
  const [outputFormat, setOutputFormat] = useState("png");
  const [videoDuration, setVideoDuration] = useState("8s");
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [veoQuality, setVeoQuality] = useState("Fast");
  const [veoMode, setVeoMode] = useState("TEXT_2_VIDEO");
  const [hasVideoInput, setHasVideoInput] = useState(false); // Legacy (kept for Seedance 1.5 Pro pricing)
  const [seedanceMode, setSeedanceMode] = useState<"text-to-video" | "first-frame" | "first-last-frame" | "multimodal" | "ugc" | "showcase" | "lipsync">("text-to-video");
  // UGC mode: separate product and influencer image arrays
  const [productImages, setProductImages] = useState<ReferenceImage[]>([]);
  const [influencerImages, setInfluencerImages] = useState<ReferenceImage[]>([]);
  const [showProductBrowser, setShowProductBrowser] = useState(false);
  const [showInfluencerBrowser, setShowInfluencerBrowser] = useState(false);
  // Showcase mode: presenter, subject, scene image arrays
  const [presenterImages, setPresenterImages] = useState<ReferenceImage[]>([]);
  const [subjectImages, setSubjectImages] = useState<ReferenceImage[]>([]);
  const [sceneImages, setSceneImages] = useState<ReferenceImage[]>([]);
  const [showPresenterBrowser, setShowPresenterBrowser] = useState(false);
  const [showSubjectBrowser, setShowSubjectBrowser] = useState(false);
  const [showSceneBrowser, setShowSceneBrowser] = useState(false);
  const [seedanceModeOpen, setSeedanceModeOpen] = useState(false);
  const [promptLengthError, setPromptLengthError] = useState<{ current: number; max: number } | null>(null);
  const [nsfwChecker, setNsfwChecker] = useState(true); // Z-Image / Topaz: NSFW checker (default on)
  const [topazUpscaleFactor, setTopazUpscaleFactor] = useState<"1" | "2" | "4">("2"); // Topaz Video Upscale factor
  const [infinitalkResolution, setInfinitalkResolution] = useState<"480p" | "720p">("480p"); // InfiniteTalk: resolution
  const [infinitalkAudioUrl, setInfinitalkAudioUrl] = useState<string>(""); // InfiniteTalk: audio URL
  const [musicInstrumental, setMusicInstrumental] = useState(true); // Music: instrumental only (no vocals)
  const [musicStyle, setMusicStyle] = useState(""); // Music: genre/style tag
  const [musicVocalGender, setMusicVocalGender] = useState<"m" | "f">("f"); // Music: vocal gender
  const [musicModel, setMusicModel] = useState<"V4" | "V5">("V4"); // Music: model version
  const [musicNegativeTags, setMusicNegativeTags] = useState(""); // Music: styles to exclude
  const [showMusicStyleDropdown, setShowMusicStyleDropdown] = useState(false); // Music: style dropdown
  const [klingOrientation, setKlingOrientation] = useState<"image" | "video">("video"); // Kling: default video orient
  const [klingSource, setKlingSource] = useState<"input_video" | "input_image">("input_video"); // Kling: background source
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null); // Seedance 2.0: first frame
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null); // Seedance 2.0: last frame
  const [showFirstFrameBrowser, setShowFirstFrameBrowser] = useState(false);
  const [showLastFrameBrowser, setShowLastFrameBrowser] = useState(false);
  // Media preview popup
  const [mediaPreview, setMediaPreview] = useState<{ type: 'video' | 'audio'; url: string; label: string } | null>(null);
  // Video references: Kling (1 video), Seedance 2.0 (max 3 videos, total ≤15s)
  const [videoRefs, setVideoRefs] = useState<Array<{ url: string; duration: number }>>([]);
  const [showVideoBrowser, setShowVideoBrowser] = useState(false);
  // Audio references: Seedance 2.0 (max 3 audio, total ≤15s)
  const [audioRefs, setAudioRefs] = useState<Array<{ url: string; duration: number }>>([]);
  const [showAudioBrowser, setShowAudioBrowser] = useState(false);
  // Seedance 2.0 toggles
  const [webSearch, setWebSearch] = useState(false);
  const [generateAudio, setGenerateAudio] = useState(true);
  const [cleanOutput, setCleanOutput] = useState(true); // Appends "no subtitles, no music, no text" for cleaner output

  // Get media duration from URL
  const getMediaDuration = (url: string, type: 'video' | 'audio'): Promise<number> => {
    return new Promise((resolve) => {
      const el = document.createElement(type);
      el.preload = 'metadata';
      // Don't set crossOrigin for R2 URLs — they serve without CORS for same-origin
      // Setting crossOrigin = 'anonymous' causes CORS errors on R2 public URLs

      let resolved = false;

      el.onloadedmetadata = () => {
        if (!resolved) {
          resolved = true;
          const dur = Math.round(el.duration);
          console.log(`[getMediaDuration] ${type} duration loaded: ${dur}s from ${url.substring(0, 60)}`);
          resolve(dur);
        }
      };

      el.ondurationchange = () => {
        if (!resolved && el.duration && isFinite(el.duration)) {
          resolved = true;
          const dur = Math.round(el.duration);
          console.log(`[getMediaDuration] ${type} duration from durationchange: ${dur}s`);
          resolve(dur);
        }
      };

      el.onerror = (e) => {
        if (!resolved) {
          resolved = true;
          console.warn(`[getMediaDuration] Failed to load ${type} metadata:`, e);
          resolve(0);
        }
      };

      // Timeout after 10 seconds
      setTimeout(() => {
        if (!resolved) {
          resolved = true;
          console.warn(`[getMediaDuration] Timeout loading ${type} metadata`);
          resolve(0);
        }
      }, 10000);

      el.src = url;
      // Force load for some browsers
      el.load();
    });
  };

  // Total duration of video + audio refs
  const totalVideoDuration = videoRefs.reduce((sum, v) => sum + v.duration, 0);
  const totalAudioDuration = audioRefs.reduce((sum, a) => sum + a.duration, 0);
  
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
    : (selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast")
    ? (() => {
        // "with video input" = has actual video reference (totalVideoDuration > 0)
        // "no video input" = text-only OR images-only (no video refs)
        const outputDur = parseInt(videoDuration.replace('s', '')) || 5;
        const inputVideoDur = ((seedanceMode === "multimodal" || seedanceMode === "ugc" || seedanceMode === "showcase") && totalVideoDuration > 0) ? totalVideoDuration : 0;
        const hasVideoRef = inputVideoDur > 0;
        const totalDur = outputDur + inputVideoDur;
        const params = `${resolution}_${totalDur}s_${hasVideoRef ? 'video' : 'novideo'}`;
        return getModelCredits(selectedModelOption.value, params);
      })()
    : selectedModelOption.value === "kling-3.0/motion-control"
    ? (() => {
        // Use video ref duration if available, otherwise 0
        const durationSec = videoRefs.length > 0 ? videoRefs[0].duration : 0;
        const params = `${resolution}_${durationSec}s`;
        const credits = getModelCredits(selectedModelOption.value, params);
        return credits;
      })()
    : selectedModelOption.value === "google/veo-3.1"
    ? (() => {
        const credits = getModelCredits(selectedModelOption.value, veoQuality);
        return credits;
      })()
    : selectedModelOption.value === "grok-imagine/image-to-video"
    ? (() => {
        const durSec = parseInt(videoDuration.replace('s', '')) || 6;
        const params = `${resolution}_${durSec}s`;
        const credits = getModelCredits(selectedModelOption.value, params);
        console.log("[VideoImageAIPanel] Grok Imagine pricing:", { resolution, durSec, params, credits });
        return credits;
      })()
    : selectedModelOption.value === "topaz/video-upscale"
    ? (() => {
        // Topaz Video Upscale: cost per second × video duration
        const vidDur = videoRefs.length > 0 ? videoRefs[0].duration : 0;
        const params = `${topazUpscaleFactor}_${vidDur}s`;
        const credits = getModelCredits(selectedModelOption.value, params);
        console.log("[VideoImageAIPanel] Topaz Video Upscale pricing:", { topazUpscaleFactor, vidDur, params, credits });
        return credits;
      })()
    : selectedModelOption.value === "infinitalk/from-audio"
    ? (() => {
        const itDur = audioRefs.length > 0 ? audioRefs[0].duration : parseInt(videoDuration.replace('s', '')) || 5;
        const params = `${infinitalkResolution}_${itDur}s`;
        const itCredits = getModelCredits("infinitalk/from-audio", params);
        console.log("[VideoImageAIPanel] InfiniteTalk pricing:", { infinitalkResolution, itDur, params, itCredits });
        return itCredits;
      })()
    : selectedModelOption.value === "ai-music-api/generate"
    ? (() => {
        const musicCredits = getModelCredits("ai-music-api/generate", "fixed");
        return musicCredits > 0 ? musicCredits : 15;
      })()
    : selectedModelOption.value === "z-image"
    ? (() => {
        const credits = getModelCredits("z-image", "fixed");
        return credits > 0 ? credits : 1;
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

  // Video duration options — model-specific
  const videoDurationOptions = (selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast")
    ? Array.from({ length: 12 }, (_, i) => ({ value: `${i + 4}s`, label: `${i + 4}s`, icon: Clock }))
    : selectedModelOption.value === "grok-imagine/image-to-video"
    ? Array.from({ length: 25 }, (_, i) => ({ value: `${i + 6}s`, label: `${i + 6}s`, icon: Clock }))
    : [
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

  // UGC/Showcase mode: expose merged image URLs for SceneEditor
  // Order matches @Image(n) numbering at generate time
  const ugcImageUrls = seedanceMode === "ugc"
    ? [...productImages.map(p => p.url), ...influencerImages.map(i => i.url)]
    : seedanceMode === "showcase"
    ? [...subjectImages.map(s => s.url), ...presenterImages.map(p => p.url), ...sceneImages.map(s => s.url)]
    : undefined;

  const pick = (tool: string) => {
    setActiveTool(tool);
    onToolSelect?.(tool);
  };

  // ── ContentEditable editor helpers (now from shared usePromptEditor hook) ──

  // Add image as a new reference image (duplicate functionality)
  const addImageAsReference = (img: any, index: number) => {
    try {
      const mockElement = {
        _id: `duplicate-${img.id}-${Date.now()}`,
        name: `Duplicate ${img.source || 'Image'} ${index + 1}`,
        type: 'image',
        thumbnailUrl: img.url,
        referenceUrls: [img.url]
      };
      handleImageSelect('element', {
        url: img.url,
        name: mockElement.name,
        source: 'duplicate',
        metadata: { originalId: img.id, originalSource: img.source, element: mockElement }
      });
    } catch (error) {
      console.error('Error adding reference image:', error);
    }
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
        // Validate for Kling 3.0 Motion Control requirements
        if (selectedModelOption.value === "kling-3.0/motion-control") {
          // File type: JPEG, PNG, JPG only (no webp)
          const allowedTypes = ['image/jpeg', 'image/png'];
          if (!allowedTypes.includes(file.type)) {
            toast.error('Kling 3.0 Motion requires JPEG or PNG format (no WebP)');
            e.target.value = '';
            return;
          }
          // Max file size: 10MB
          if (file.size > 10 * 1024 * 1024) {
            toast.error(`File too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Kling 3.0 Motion max is 10MB.`);
            e.target.value = '';
            return;
          }
          // Min dimensions: 340px, aspect ratio 2:5 to 5:2
          const img = document.createElement('img');
          const imgUrl = URL.createObjectURL(file);
          const dimensions = await new Promise<{ w: number; h: number }>((resolve) => {
            img.onload = () => { resolve({ w: img.naturalWidth, h: img.naturalHeight }); URL.revokeObjectURL(imgUrl); };
            img.onerror = () => { resolve({ w: 0, h: 0 }); URL.revokeObjectURL(imgUrl); };
            img.src = imgUrl;
          });
          if (dimensions.w < 300 || dimensions.h < 300) {
            toast.error(`Image too small (${dimensions.w}x${dimensions.h}). Minimum 300px on each side.`);
            e.target.value = '';
            return;
          }
          const ratio = dimensions.w / dimensions.h;
          if (ratio < 2/5 || ratio > 5/2) {
            toast.error(`Aspect ratio ${ratio.toFixed(2)} out of range. Kling 3.0 Motion requires 2:5 to 5:2.`);
            e.target.value = '';
            return;
          }
        }

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
      console.log('🔍 Starting CanvasEditor-specific search...');
      let targetElement = null;
      let imageUrl = null;
      
      // Method 1: Look for the CanvasEditor container with data-canvas-editor="true"
      const canvasEditorContainer = document.querySelector('[data-canvas-editor="true"]');
      console.log('📊 Found CanvasEditor container:', !!canvasEditorContainer);
      
      if (canvasEditorContainer) {
        // Method 2: Look for the main image inside the CanvasEditor
        // This is the currently displayed image that the user sees
        const mainImage = canvasEditorContainer.querySelector('img[data-canvas-base-image="true"], img');
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
          
          let bestCanvas = null;
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
        
        let bestCanvas = null;
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
      if (targetElement.tagName === 'IMG' && imageUrl) {
        console.log('🖼️ Creating URL-based reference for displayed image:', imageUrl);
        
        if (onAddReferenceImage) {
          const filename = imageUrl.split('/').pop() || `canvas-reference-${Date.now()}.png`;
          const file = new File([''], filename, { type: 'image/png' });
          
          // Add the expected metadata properties that SceneEditor looks for
          (file as any).__r2Url = imageUrl; // SceneEditor will use this as the URL
          (file as any).__r2Key = filename; // Store the filename as R2 key
          (file as any).__isTemporary = false; // Mark as not temporary
          
          onAddReferenceImage(file);
          showToast('Canvas image referenced successfully', 'success');
          console.log('✅ URL reference created for CanvasEditor image:', filename);
        } else {
          console.error('❌ onAddReferenceImage function not available');
          showToast('Reference image function not available', 'error');
        }
      }
      // Handle canvas elements (capture current visual content)
      else if (targetElement.tagName === 'CANVAS') {
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

  // Fallback method for image capture
  const fallbackImageCapture = (img: HTMLImageElement) => {
    console.log('🔍 Using fallback capture method...');
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
  const canOpenFileBrowser = () => !!(projectId && currentCompanyId);
  const canOpenElementLibrary = () => !!(projectId && userId && user && currentCompanyId);

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

  // handleEditorInput, handleCompositionStart/End, handleKeyDown, handleEditorBlur,
  // handleDragOver, handleDrop — all provided by shared usePromptEditor hook

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

  // Reset resolution/duration/toggles when model prop changes from parent
  useEffect(() => {
    if (!model) return;
    if (model === "kling-3.0/motion-control") {
      setResolution("720P");
    } else if (model === "bytedance/seedance-2" || model === "bytedance/seedance-2-fast") {
      setResolution("480P");
      setVideoDuration("5s");
      setSeedanceMode("text-to-video");
    } else if (model === "bytedance/seedance-1.5-pro") {
      setResolution("480P");
      setVideoDuration("8s");
    } else if (model === "google/veo-3.1") {
      // Veo uses quality, not resolution
    } else if (model === "grok-imagine/image-to-video") {
      setResolution("480P");
      setVideoDuration("6s");
      setAspectRatio("16:9");
    } else if (model === "topaz/video-upscale") {
      setTopazUpscaleFactor("2");
    } else if (model === "infinitalk/from-audio") {
      setInfinitalkResolution("480p");
      setInfinitalkAudioUrl("");
    } else if (model.includes("nano-banana")) {
      setResolution("1K");
    }
  }, [model]);

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
  // handleDragOver and handleDrop provided by shared usePromptEditor hook

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

  // ── KIE AI Generate Function with Complete Callback Workflow ─────────────────────────────────────────────
  const [generateCooldown, setGenerateCooldown] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  const handleKieAIGenerate = async () => {
    // Rate limit: prevent double-click / rapid submissions
    if (generateCooldown) return;

    // Extract the current prompt with badges from the editor for AI model
    const extractedPrompt = extractTextWithBadges();

    // Topaz Video Upscale doesn't need a prompt — skip prompt validation
    const noPromptModels = ["topaz/video-upscale"];
    if (!noPromptModels.includes(selectedModelOption.value) && !extractedPrompt?.trim()) {
      toast.warning("Please enter a prompt to generate");
      return;
    }

    // Topaz Video Upscale validation: needs a video reference
    if (selectedModelOption.value === "topaz/video-upscale") {
      if (videoRefs.length === 0) {
        toast.warning("Topaz Video Upscale requires a video reference");
        return;
      }
    }

    // InfiniteTalk validation: needs image + audio
    if (selectedModelOption.value === "infinitalk/from-audio") {
      if (referenceImages.length === 0) {
        toast.warning("InfiniteTalk requires an image reference");
        return;
      }
      if (audioRefs.length === 0) {
        toast.warning("InfiniteTalk requires an audio file");
        return;
      }
    }

    // Start cooldown immediately
    setGenerateCooldown(true);
    setCooldownSeconds(5);
    const interval = setInterval(() => {
      setCooldownSeconds(prev => {
        if (prev <= 1) { clearInterval(interval); setGenerateCooldown(false); return 0; }
        return prev - 1;
      });
    }, 1000);

    console.log("🚀 Starting KIE AI generation workflow...");
    console.log("Model:", selectedModelOption.value);
    console.log("Credits needed from getModelCredits:", displayedCredits);
    console.log("Extracted prompt with badges:", extractedPrompt);
    console.log("Reference images:", referenceImages);
    console.log("Current company credits:", getBalance);
    
    // Step 0: Check prompt length limits
    const isSeedance2Model = selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast";
    const isZImage = selectedModelOption.value === "z-image";
    if (isSeedance2Model && extractedPrompt.length > 1536) {
      setPromptLengthError({ current: extractedPrompt.length, max: 1536 });
      return;
    }
    if (isZImage && extractedPrompt.length > 1000) {
      setPromptLengthError({ current: extractedPrompt.length, max: 1000 });
      return;
    }

    // Step 1: Check if user has sufficient credits
    const currentCredits = getBalance ?? 0;
    if (currentCredits < displayedCredits) {
      toast.error(`Insufficient credits. Need ${displayedCredits} credits, but you only have ${currentCredits}.`);
      return;
    }
    
    console.log("Step 1: Credits check passed");
    
    try {
      // Note: Placeholder record creation and credit deduction are handled downstream
      // by triggerImageGeneration (for image models) or SceneEditor (for Seedance/Veo).
      // VideoImageAIPanel only does the balance check and passes parameters to onGenerate.

      if (onGenerate) {
        const isSeedance2 = selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast";
        const qualityParam = outputMode === "video"
          ? isSeedance2
            ? (() => {
                const outputDur = parseInt(videoDuration.replace('s', '')) || 5;
                const inputVideoDur = ((seedanceMode === "multimodal" || seedanceMode === "ugc" || seedanceMode === "showcase") && totalVideoDuration > 0) ? totalVideoDuration : 0;
                const totalDur = outputDur + inputVideoDur;
                const hasVideoRef = inputVideoDur > 0;
                return `${resolution}_${totalDur}s_${hasVideoRef ? 'video' : 'novideo'}${webSearch ? '_ws' : ''}`;
              })()
            : selectedModelOption.value === "kling-3.0/motion-control"
            ? `${resolution}_${videoDuration}`
            : selectedModelOption.value === "topaz/video-upscale"
            ? `${topazUpscaleFactor}_${videoRefs.length > 0 ? videoRefs[0].duration : 0}s`
            : selectedModelOption.value === "infinitalk/from-audio"
            ? `${infinitalkResolution}_${audioRefs.length > 0 ? audioRefs[0].duration : parseInt(videoDuration.replace('s', '')) || 5}s`
            : selectedModelOption.value === "ai-music-api/generate"
            ? `music_${musicInstrumental ? 'instrumental' : 'vocal'}_${musicStyle || 'any'}_${musicModel}_${musicInstrumental ? 'none' : musicVocalGender}`
            : `${resolution}_${videoDuration}_${audioEnabled ? 'audio' : 'noaudio'}`
          : resolution;
        
        // Include Veo 3.1 parameters if the model is Veo 3.1
        const isVeoModel = selectedModelOption?.value === "google/veo-3.1";
        const veoQualityParam = isVeoModel ? veoQuality : undefined;
        const veoModeParam = isVeoModel ? veoMode : undefined;

        // Include Kling Motion parameters
        const isKlingMotion = selectedModelOption?.value === "kling-3.0/motion-control";
        const klingOrientParam = isKlingMotion ? klingOrientation : undefined;
        const klingSourceParam = isKlingMotion ? klingSource : undefined;

        // Video/audio URLs — Kling uses videoRefs, Seedance uses both video+audio refs, Topaz uses single video
        const isTopazVideo = selectedModelOption?.value === "topaz/video-upscale";
        const videoUrlsParam = isKlingMotion ? videoRefs.map(v => v.url)
          : isTopazVideo ? videoRefs.map(v => v.url)
          : isSeedance2 && (seedanceMode === "multimodal" || seedanceMode === "ugc" || seedanceMode === "showcase") ? videoRefs.map(v => v.url)
          : undefined;
        const isInfinitalk = selectedModelOption.value === "infinitalk/from-audio";
        const audioUrlsParam = (isSeedance2 && (seedanceMode === "multimodal" || seedanceMode === "ugc" || seedanceMode === "showcase" || seedanceMode === "lipsync")) || isInfinitalk ? audioRefs.map(a => a.url) : undefined;
        // Lipsync sends as multimodal (first_frame_url + audio is invalid — they're mutually exclusive)
        // Character image goes into referenceImages, audio into audioUrls
        const seedanceModeParam = isSeedance2 ? (seedanceMode === "lipsync" ? "multimodal" : seedanceMode) : undefined;
        const firstFrameParam = isSeedance2 && (seedanceMode === "first-frame" || seedanceMode === "first-last-frame") ? firstFrameUrl || undefined : undefined;
        const lastFrameParam = isSeedance2 && seedanceMode === "first-last-frame" ? lastFrameUrl || undefined : undefined;

        // For Seedance 2.0, pass generateAudio state — lipsync always enables audio
        const audioParam = isSeedance2 ? (seedanceMode === "lipsync" ? true : generateAudio) : audioEnabled;

        // UGC/Showcase mode: convert custom badges to @Image(n) and merge images
        let finalPrompt = extractedPrompt;
        if (seedanceMode === "ugc") {
          const productCount = productImages.length;
          for (let i = 1; i <= productCount; i++) {
            finalPrompt = finalPrompt.replace(new RegExp(`@Product${i}`, 'g'), `@Image${i}`);
          }
          for (let i = 1; i <= influencerImages.length; i++) {
            finalPrompt = finalPrompt.replace(new RegExp(`@Influencer${i}`, 'g'), `@Image${productCount + i}`);
          }
        } else if (seedanceMode === "showcase") {
          // Order: Subject(1-6) → Presenter(1) → Scene(1-2)
          const subjectCount = subjectImages.length;
          const presenterCount = presenterImages.length;
          for (let i = 1; i <= subjectCount; i++) {
            finalPrompt = finalPrompt.replace(new RegExp(`@Subject${i}`, 'g'), `@Image${i}`);
          }
          for (let i = 1; i <= presenterCount; i++) {
            finalPrompt = finalPrompt.replace(new RegExp(`@Presenter${i}`, 'g'), `@Image${subjectCount + i}`);
          }
          for (let i = 1; i <= sceneImages.length; i++) {
            finalPrompt = finalPrompt.replace(new RegExp(`@Scene${i}`, 'g'), `@Image${subjectCount + presenterCount + i}`);
          }
        }

        // Append clean output suffix for Seedance models
        // Clean output — skip "no music" if audio refs are provided or generate_audio is on
        if (isSeedance2 && cleanOutput) {
          const hasAudioInput = audioRefs.length > 0 || generateAudio;
          const cleanSuffix = hasAudioInput
            ? '. No subtitles, no text overlays, no watermark.'
            : '. No subtitles, no music, no text overlays, no watermark.';
          finalPrompt = finalPrompt.trimEnd() + cleanSuffix;
        }

        // Remove stray @Audio badges from prompt — Seedance uses reference_audio_urls, not prompt text
        finalPrompt = finalPrompt.replace(/@?[Aa]udio\d+/g, '').replace(/\s{2,}/g, ' ').trim();

        // For lipsync, character image becomes a reference image (multimodal mode)
        const mergedUrls = seedanceMode === "lipsync" ? (firstFrameUrl ? [firstFrameUrl] : [])
          : (seedanceMode === "ugc" || seedanceMode === "showcase") ? ugcImageUrls
          : undefined;
        onGenerate(displayedCredits, qualityParam, aspectRatio, videoDuration, audioParam, finalPrompt, veoQualityParam, veoModeParam, klingOrientParam, klingSourceParam, videoUrlsParam, audioUrlsParam, seedanceModeParam, firstFrameParam, lastFrameParam, mergedUrls);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      console.error("❌ KIE AI generation failed:", error);
      
      // Handle insufficient credits error specifically
      if (errorMessage.includes('Insufficient credits')) {
        toast.error(errorMessage);
      } else {
        toast.error(`AI generation failed: ${errorMessage}`);
      }
    }
  };
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
        {/* Topaz Video Upscale — standalone video input area */}
        {selectedModelOption.value === "topaz/video-upscale" && (
          <div className="mb-[0px]">
            <div className="px-0 py-0">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  {videoRefs.map((vid, index) => (
                    <div key={`topaz-video-${index}`} className="relative group">
                      <div className="w-16 h-16 rounded-md border border-green-500/30 bg-[#1a1a24] overflow-hidden cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'video', url: vid.url, label: `Video` })}
                      >
                        <video src={vid.url} className="w-full h-full object-cover" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[5px] border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                      {vid.duration > 0 && (
                        <div className="absolute -bottom-1.5 left-0 right-0 text-center z-20 pointer-events-none">
                          <span className="text-[11px] bg-green-800 text-green-200 px-1.5 py-0.5 rounded-full font-medium">{vid.duration}s</span>
                        </div>
                      )}
                      <button onClick={(e) => { e.stopPropagation(); setVideoRefs(prev => prev.filter((_, i) => i !== index)); }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
                        <X className="w-2 h-2 text-white" />
                      </button>
                    </div>
                  ))}
                  {videoRefs.length < 1 && (
                    <button onClick={() => setShowVideoBrowser(true)}
                      className="w-16 h-16 rounded-md border border-dashed border-green-800/50 hover:border-green-700/70 flex flex-col items-center justify-center gap-0.5 group transition-colors bg-green-900/10"
                      title="Add Video to Upscale">
                      <Film className="w-4 h-4 text-green-600 group-hover:text-green-400" />
                      <span className="text-[11px] text-green-600 group-hover:text-green-400">Video</span>
                    </button>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 self-center">Upload a video to upscale<br /><span className="text-gray-600">MP4, MOV, WEBM, M4V, GIF</span></span>
              </div>
            </div>
          </div>
        )}

        {/* InfiniteTalk — image + audio input area */}
        {selectedModelOption.value === "infinitalk/from-audio" && (
          <div className="mb-[0px]">
            <div className="px-0 py-0">
              <div className="flex items-start gap-2.5">
                {/* Image reference slot */}
                <div className="flex-shrink-0">
                  {referenceImages.length > 0 ? (
                    <div className="relative group">
                      <img src={referenceImages[0].url} alt="Reference" className="w-20 h-20 object-cover rounded-lg border border-blue-500/30 cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'image', url: referenceImages[0].url, label: 'Reference Image' })}
                      />
                      <div className="absolute top-1.5 left-1.5 bg-blue-600 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium pointer-events-none">Image</div>
                      <button onClick={() => {
                        onRemoveReferenceImage?.(referenceImages[0].id);
                      }} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <AddImageMenu
                      label="Image"
                      onUploadClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e) => {
                          const file = (e.target as HTMLInputElement).files?.[0];
                          if (!file) return;
                          onAddReferenceImage?.(file);
                        };
                        input.click();
                      }}
                      onR2Click={() => setShowFileBrowser(true)}
                      canOpenElements={canOpenElementLibrary()}
                      onElementsClick={() => setShowElementLibrary(true)}
                      onElementsUnavailable={() => showToast('Project info required', 'error')}
                      onCaptureClick={handleAddBackground}
                      generatedItemImages={generatedItemImages}
                      generatedProjectImages={generatedProjectImages}
                      onSelectGeneratedImage={(url) => {
                        // Create a File-like object from the URL for the callback
                        fetch(url).then(r => r.blob()).then(blob => {
                          const file = new File([blob], `ref-${Date.now()}.png`, { type: blob.type });
                          onAddReferenceImage?.(file);
                        });
                      }}
                    />
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-16 bg-white/10 self-center mx-1" />

                {/* Audio Slot */}
                <div className="relative flex-shrink-0">
                  {audioRefs.length > 0 ? (
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-lg border border-violet-500/30 bg-[#1a1a24] flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'audio', url: audioRefs[0].url, label: 'Audio' })}
                      >
                        <Volume2 className="w-6 h-6 text-violet-400" />
                        {audioRefs[0].duration > 0 && (
                          <span className="text-[10px] text-violet-300 mt-1">{audioRefs[0].duration}s</span>
                        )}
                      </div>
                      <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium">Audio</div>
                      <button
                        onClick={() => setAudioRefs([])}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAudioBrowser(true)}
                      className="w-20 h-20 rounded-lg border-2 border-dashed border-violet-500/30 hover:border-violet-500/50 flex flex-col items-center justify-center gap-1 group transition-colors"
                      title="Add audio for lip sync"
                    >
                      <Volume2 className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                      <span className="text-[9px] text-violet-400 group-hover:text-violet-300 transition-colors leading-tight text-center">Audio</span>
                    </button>
                  )}
                </div>

                <span className="text-[11px] text-gray-500 self-center">Upload image + audio for lip sync</span>
              </div>
            </div>
          </div>
        )}

        {/* Reference Images Panel — hidden for text-only models like z-image and Topaz Video Upscale (video-only) */}
        {selectedModelOption.value !== "z-image" && selectedModelOption.value !== "topaz/video-upscale" && selectedModelOption.value !== "infinitalk/from-audio" && selectedModelOption.value !== "ai-music-api/generate" && (
        <div className="mb-[0px]">
          <div className="px-0 py-0">
            <div className="flex items-start gap-2.5 overflow-x-auto">
            {/* Lipsync Mode: Character image + Audio slot */}
            {seedanceMode === "lipsync" ? (
              <>
                {/* Character Image (uses firstFrameUrl) */}
                <div className="relative flex-shrink-0">
                  {firstFrameUrl ? (
                    <div className="relative group"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `@Image1`);
                        e.dataTransfer.setData("imageUrl", firstFrameUrl);
                        e.dataTransfer.setData("imageIndex", "0");
                      }}
                    >
                      <img src={firstFrameUrl} alt="Character" className="w-20 h-20 object-cover rounded-lg border border-purple-500/30 cursor-move" />
                      <div className="absolute top-1.5 left-1.5 bg-purple-600 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium pointer-events-none">Character</div>
                      <button
                        onClick={() => setFirstFrameUrl(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <AddImageMenu
                      label="Character"
                      onUploadClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = (e: any) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          const url = URL.createObjectURL(file);
                          setFirstFrameUrl(url);
                        };
                        input.click();
                      }}
                      onR2Click={() => setShowFirstFrameBrowser(true)}
                      canOpenR2={canOpenFileBrowser()}
                      onR2Unavailable={() => showToast('Project info required', 'error')}
                      onElementsClick={() => setShowElementLibrary(true)}
                      canOpenElements={canOpenElementLibrary()}
                      onElementsUnavailable={() => showToast('Project info required', 'error')}
                      onCaptureClick={handleAddBackground}
                      generatedItemImages={generatedItemImages}
                      generatedProjectImages={generatedProjectImages}
                      onSelectGeneratedImage={(url) => setFirstFrameUrl(url)}
                    />
                  )}
                </div>

                {/* Divider */}
                <div className="w-px h-16 bg-white/10 self-center mx-1" />

                {/* Audio Slot */}
                <div className="relative flex-shrink-0">
                  {audioRefs.length > 0 ? (
                    <div className="relative group">
                      <div className="w-20 h-20 rounded-lg border border-violet-500/30 bg-[#1a1a24] flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'audio', url: audioRefs[0].url, label: 'Audio' })}
                      >
                        <Volume2 className="w-6 h-6 text-violet-400" />
                        {audioRefs[0].duration > 0 && (
                          <span className="text-[10px] text-violet-300 mt-1">{audioRefs[0].duration}s</span>
                        )}
                      </div>
                      <div className="absolute top-1.5 left-1.5 bg-violet-600 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium">Audio</div>
                      <button
                        onClick={() => setAudioRefs([])}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowAudioBrowser(true)}
                      className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-violet-500/30 hover:border-violet-500/50 transition-colors flex flex-col items-center justify-center gap-1 group"
                      title="Add audio for lipsync"
                    >
                      <Volume2 className="w-5 h-5 text-violet-400 group-hover:text-violet-300 transition-colors" />
                      <span className="text-[9px] text-violet-400 group-hover:text-violet-300 transition-colors leading-tight text-center">Audio</span>
                    </button>
                  )}
                </div>
              </>
            ) : seedanceMode === "ugc" ? (
              <>
                {/* Product Images */}
                {productImages.map((img, index) => (
                  <div key={img.id} className="relative flex-shrink-0 group">
                    <img
                      src={img.url}
                      alt={`Product ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-amber-500/30 cursor-move relative z-10"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `@Product${index + 1}`);
                        e.dataTransfer.setData("application/x-badge", JSON.stringify({ type: "product", index: index + 1, url: img.url }));
                        e.dataTransfer.setData("imageUrl", img.url);
                        e.dataTransfer.setData("imageIndex", String(index));
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-amber-500 text-white text-[10px] px-1 rounded-full z-20">
                      Product {index + 1}
                    </div>
                    <button
                      onClick={() => setProductImages(prev => prev.filter(p => p.id !== img.id))}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {productImages.length < 3 && (
                  <AddImageMenu
                    label="Product"
                    onUploadClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setProductImages(prev => [...prev, { id: `product-${Date.now()}`, url, source: 'upload', name: file.name }]);
                      };
                      input.click();
                    }}
                    onR2Click={() => setShowProductBrowser(true)}
                    canOpenR2={canOpenFileBrowser()}
                    onR2Unavailable={() => showToast('Project and company info required', 'error')}
                    onElementsClick={() => setShowElementLibrary(true)}
                    canOpenElements={canOpenElementLibrary()}
                    onElementsUnavailable={() => showToast('Project info required', 'error')}
                    onCaptureClick={handleAddBackground}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={(url) => {
                      setProductImages(prev => [...prev, { id: `product-${Date.now()}`, url, source: 'upload', name: 'product' }]);
                    }}
                  />
                )}

                {/* Divider */}
                <div className="w-px h-16 bg-white/10 self-center mx-1" />

                {/* Influencer Images */}
                {influencerImages.map((img, index) => (
                  <div key={img.id} className="relative flex-shrink-0 group">
                    <img
                      src={img.url}
                      alt={`Influencer ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-pink-500/30 cursor-move relative z-10"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `@Influencer${index + 1}`);
                        e.dataTransfer.setData("application/x-badge", JSON.stringify({ type: "influencer", index: index + 1, url: img.url }));
                        e.dataTransfer.setData("imageUrl", img.url);
                        e.dataTransfer.setData("imageIndex", String(index));
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-pink-500 text-white text-[10px] px-1 rounded-full z-20">
                      Influencer {index + 1}
                    </div>
                    <button
                      onClick={() => setInfluencerImages(prev => prev.filter(p => p.id !== img.id))}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {influencerImages.length < 3 && (
                  <AddImageMenu
                    label="Influencer"
                    onUploadClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0];
                        if (!file) return;
                        const url = URL.createObjectURL(file);
                        setInfluencerImages(prev => [...prev, { id: `influencer-${Date.now()}`, url, source: 'upload', name: file.name }]);
                      };
                      input.click();
                    }}
                    onR2Click={() => setShowInfluencerBrowser(true)}
                    canOpenR2={canOpenFileBrowser()}
                    onR2Unavailable={() => showToast('Project and company info required', 'error')}
                    onElementsClick={() => setShowElementLibrary(true)}
                    canOpenElements={canOpenElementLibrary()}
                    onElementsUnavailable={() => showToast('Project info required', 'error')}
                    onCaptureClick={handleAddBackground}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={(url) => {
                      setInfluencerImages(prev => [...prev, { id: `influencer-${Date.now()}`, url, source: 'upload', name: 'influencer' }]);
                    }}
                  />
                )}
              </>
            ) : seedanceMode === "showcase" ? (
              <>
                {/* Showcase Mode: Presenter + Subject + Scene image slots */}
                {/* Presenter (purple, max 1) */}
                {presenterImages.map((img, index) => (
                  <div key={img.id} className="relative flex-shrink-0 group">
                    <img
                      src={img.url}
                      alt={`Presenter ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-purple-500/30 cursor-move relative z-10"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `@Presenter${index + 1}`);
                        e.dataTransfer.setData("application/x-badge", JSON.stringify({ type: "presenter", index: index + 1, url: img.url }));
                        e.dataTransfer.setData("imageUrl", img.url);
                        e.dataTransfer.setData("imageIndex", String(index));
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-purple-500 text-white text-[9px] px-1 rounded-full z-20">Presenter</div>
                    <button
                      onClick={() => setPresenterImages(prev => prev.filter(p => p.id !== img.id))}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {presenterImages.length < 1 && (
                  <AddImageMenu
                    label="Presenter"
                    onUploadClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const url = URL.createObjectURL(file);
                        setPresenterImages([{ id: `presenter-${Date.now()}`, url, source: 'upload', name: file.name }]);
                      };
                      input.click();
                    }}
                    onR2Click={() => setShowPresenterBrowser(true)}
                    canOpenR2={canOpenFileBrowser()}
                    onR2Unavailable={() => showToast('Project info required', 'error')}
                    onElementsClick={() => setShowElementLibrary(true)}
                    canOpenElements={canOpenElementLibrary()}
                    onElementsUnavailable={() => showToast('Project info required', 'error')}
                    onCaptureClick={handleAddBackground}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={(url) => {
                      setPresenterImages([{ id: `presenter-${Date.now()}`, url, source: 'upload', name: 'presenter' }]);
                    }}
                  />
                )}

                <div className="w-px h-16 bg-white/10 self-center mx-1" />

                {/* Subject (blue, max 6) */}
                {subjectImages.map((img, index) => (
                  <div key={img.id} className="relative flex-shrink-0 group">
                    <img
                      src={img.url}
                      alt={`Subject ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-blue-500/30 cursor-move relative z-10"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `@Subject${index + 1}`);
                        e.dataTransfer.setData("application/x-badge", JSON.stringify({ type: "subject", index: index + 1, url: img.url }));
                        e.dataTransfer.setData("imageUrl", img.url);
                        e.dataTransfer.setData("imageIndex", String(index));
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-blue-500 text-white text-[9px] px-1 rounded-full z-20">Subject {index + 1}</div>
                    <button
                      onClick={() => setSubjectImages(prev => prev.filter(p => p.id !== img.id))}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {subjectImages.length < 6 && (
                  <AddImageMenu
                    label="Subject"
                    onUploadClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const url = URL.createObjectURL(file);
                        setSubjectImages(prev => [...prev, { id: `subject-${Date.now()}`, url, source: 'upload', name: file.name }]);
                      };
                      input.click();
                    }}
                    onR2Click={() => setShowSubjectBrowser(true)}
                    canOpenR2={canOpenFileBrowser()}
                    onR2Unavailable={() => showToast('Project info required', 'error')}
                    onElementsClick={() => setShowElementLibrary(true)}
                    canOpenElements={canOpenElementLibrary()}
                    onElementsUnavailable={() => showToast('Project info required', 'error')}
                    onCaptureClick={handleAddBackground}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={(url) => {
                      setSubjectImages(prev => [...prev, { id: `subject-${Date.now()}`, url, source: 'upload', name: 'subject' }]);
                    }}
                  />
                )}

                <div className="w-px h-16 bg-white/10 self-center mx-1" />

                {/* Scene (green, max 2, optional) */}
                {sceneImages.map((img, index) => (
                  <div key={img.id} className="relative flex-shrink-0 group">
                    <img
                      src={img.url}
                      alt={`Scene ${index + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-emerald-500/30 cursor-move relative z-10"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData("text/plain", `@Scene${index + 1}`);
                        e.dataTransfer.setData("application/x-badge", JSON.stringify({ type: "scene", index: index + 1, url: img.url }));
                        e.dataTransfer.setData("imageUrl", img.url);
                        e.dataTransfer.setData("imageIndex", String(index));
                      }}
                    />
                    <div className="absolute top-1.5 right-1.5 bg-emerald-500 text-white text-[9px] px-1 rounded-full z-20">Scene {index + 1}</div>
                    <button
                      onClick={() => setSceneImages(prev => prev.filter(p => p.id !== img.id))}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {sceneImages.length < 2 && (
                  <AddImageMenu
                    label="Scene"
                    onUploadClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file'; input.accept = 'image/*';
                      input.onchange = (e: any) => {
                        const file = e.target.files?.[0]; if (!file) return;
                        const url = URL.createObjectURL(file);
                        setSceneImages(prev => [...prev, { id: `scene-${Date.now()}`, url, source: 'upload', name: file.name }]);
                      };
                      input.click();
                    }}
                    onR2Click={() => setShowSceneBrowser(true)}
                    canOpenR2={canOpenFileBrowser()}
                    onR2Unavailable={() => showToast('Project info required', 'error')}
                    onElementsClick={() => setShowElementLibrary(true)}
                    canOpenElements={canOpenElementLibrary()}
                    onElementsUnavailable={() => showToast('Project info required', 'error')}
                    onCaptureClick={handleAddBackground}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={(url) => {
                      setSceneImages(prev => [...prev, { id: `scene-${Date.now()}`, url, source: 'upload', name: 'scene' }]);
                    }}
                  />
                )}
              </>
            ) : (
              <>
                {/* Standard reference images (non-UGC/Showcase modes) */}
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
                      onClick={() => onRemoveReferenceImage?.(img.id)}
                      className="absolute -top-1 -left-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}

                {/* Combined Upload Button with Slide Menu */}
                {maxReferenceImages > 0 && referenceImages.length < maxReferenceImages && (
                  <AddImageMenu
                    onUploadClick={() => fileInputRef.current?.click()}
                    onR2Click={() => setShowFileBrowser(true)}
                    canOpenR2={canOpenFileBrowser()}
                    onR2Unavailable={() => showToast('Project and company info required to browse R2 files', 'error')}
                    onElementsClick={() => setShowElementLibrary(true)}
                    canOpenElements={canOpenElementLibrary()}
                    onElementsUnavailable={() => showToast('Project and user info required to browse elements', 'error')}
                    onCaptureClick={handleAddBackground}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={onSelectGeneratedImage}
                  />
                )}
              </>
            )}

            {/* Seedance 2.0: First Frame & Last Frame slots (only in frame modes) */}
            {(selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (seedanceMode === "first-frame" || seedanceMode === "first-last-frame") && (
              <>
                {/* First Frame */}
                <div className="relative flex-shrink-0">
                  {firstFrameUrl ? (
                    <div className="relative group">
                      <img src={firstFrameUrl} alt="First Frame" className="w-20 h-20 object-cover rounded-lg border border-blue-500/30" />
                      <div className="absolute top-1.5 left-1.5 bg-blue-500 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium">1st</div>
                      <button
                        onClick={() => setFirstFrameUrl(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowFirstFrameBrowser(true)}
                      className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-blue-500/30 hover:border-blue-500/50 transition-colors flex flex-col items-center justify-center gap-1 group"
                      title="Set first frame"
                    >
                      <Plus className="w-4 h-4 text-blue-400 group-hover:text-blue-300 transition-colors" />
                      <span className="text-[9px] text-blue-400 group-hover:text-blue-300 transition-colors leading-tight text-center">First Frame</span>
                    </button>
                  )}
                </div>

                {/* Last Frame — only show in "first-last-frame" mode */}
                {seedanceMode === "first-last-frame" && (
                <div className="relative flex-shrink-0">
                  {lastFrameUrl ? (
                    <div className="relative group">
                      <img src={lastFrameUrl} alt="Last Frame" className="w-20 h-20 object-cover rounded-lg border border-orange-500/30" />
                      <div className="absolute top-1.5 left-1.5 bg-orange-500 text-white text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium">Last</div>
                      <button
                        onClick={() => setLastFrameUrl(null)}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2.5 h-2.5 text-white" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowLastFrameBrowser(true)}
                      className="w-20 h-20 flex-shrink-0 rounded-lg border-2 border-dashed border-orange-500/30 hover:border-orange-500/50 transition-colors flex flex-col items-center justify-center gap-1 group"
                      title="Set last frame"
                    >
                      <Plus className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors" />
                      <span className="text-[9px] text-orange-400 group-hover:text-orange-300 transition-colors leading-tight text-center">Last Frame</span>
                    </button>
                  )}
                </div>
                )}
              </>
            )}
          </div>
          </div>

          {seedanceMode === "lipsync" ? (
            !firstFrameUrl && audioRefs.length === 0 && (
              <p className="text-xs text-gray-500">
                Add a character image and audio file. The AI will animate the character to match the audio (lip-sync).
              </p>
            )
          ) : seedanceMode === "ugc" ? (
            productImages.length === 0 && influencerImages.length === 0 && (
              <p className="text-xs text-gray-500">
                Add product and influencer images, then drag them into your prompt as @Product1, @Influencer1, etc.
              </p>
            )
          ) : seedanceMode === "showcase" ? (
            subjectImages.length === 0 && presenterImages.length === 0 && (
              <p className="text-xs text-gray-500">
                Add presenter, subject (room/car/item), and scene images. Drag into prompt as @Presenter1, @Subject1, @Scene1.
              </p>
            )
          ) : referenceImages.length === 0 && (
            <p className="text-xs text-gray-500">
              Click to add reference images from computer, R2 storage, or element library for consistent characters and props
            </p>
          )}
        </div>
        )}

        {/* Main Panel */}
        <div className="bg-[#0a0a0f]/98 backdrop-blur-md rounded-2xl border border-white/10">
          {/* Lyrics format guide — only when Music + Vocals mode */}
          {selectedModelOption.value === "ai-music-api/generate" && !musicInstrumental && (
            <div className="px-[10px] pt-[10px] pb-0">
              <details className="group">
                <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-purple-400 hover:text-purple-300 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M12 16v-4m0-4h.01"/></svg>
                  <span>How to write lyrics — click to see format guide</span>
                </summary>
                <div className="mt-2 p-3 bg-[#141418] border border-[#2A2A32] rounded-lg text-[11px] text-gray-400 leading-relaxed">
                  <p className="text-[#EAEAEA] font-medium mb-1.5">Use section tags to structure your song:</p>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-0.5">
                    <span><span className="text-purple-400">[Verse]</span> — Storytelling, softer delivery</span>
                    <span><span className="text-purple-400">[Chorus]</span> — Catchy, louder, repeated hook</span>
                    <span><span className="text-purple-400">[Bridge]</span> — Transition, contrast moment</span>
                    <span><span className="text-purple-400">[Outro]</span> — Fade out / ending</span>
                  </div>
                  <p className="mt-2 text-gray-500 border-t border-[#2A2A32] pt-2">
                    Example: <span className="text-purple-400">[Verse 1]</span> Walking through the city lights / Every shadow tells a story <span className="text-purple-400">[Chorus]</span> We are the midnight runners / Chasing stars across the sky
                  </p>
                </div>
              </details>
            </div>
          )}

          {/* User Prompt Area — hidden for Topaz Video Upscale (no prompt needed) */}
          {mode !== "describe" || selectedModelOption.value === "topaz/video-upscale" ? null : (
            <div className="px-[10px] pt-[10px] pb-0">
              <div className="flex gap-2">
                {/* Text Area (shared component) */}
                <PromptTextarea
                  editorRef={editorRef}
                  editorIsEmpty={editorIsEmpty}
                  placeholder={
                    selectedModelOption.value === "ai-music-api/generate"
                      ? musicInstrumental
                        ? "Describe the music mood, tempo, instruments... e.g. calm piano with soft melodies, 80bpm"
                        : "Write your lyrics here... use [Verse], [Chorus], [Bridge] to structure"
                      : "Describe your element... drag & drop reference images here"
                  }
                  minHeight={TEXTAREA_MIN_HEIGHT}
                  maxHeight={TEXTAREA_MAX_HEIGHT}
                  onInput={handleEditorInput}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onBlur={handleEditorBlur}
                  onCompositionStart={handleCompositionStart}
                  onCompositionEnd={handleCompositionEnd}
                  onKeyDown={handleKeyDown}
                />
                
                {/* Video & Audio slots — right side, for Kling/Seedance 2.0 multimodal/Topaz Video Upscale */}
                {(selectedModelOption.value === "kling-3.0/motion-control" || selectedModelOption.value === "topaz/video-upscale" || ((selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (seedanceMode === "multimodal" || seedanceMode === "ugc" || seedanceMode === "showcase"))) && (
                  <div className="flex-shrink-0 flex items-center gap-1.5">
                    {/* Video refs with duration */}
                    {videoRefs.map((vid, index) => (
                      <div key={`video-${index}`} className="relative group">
                        <div className="w-16 h-16 rounded-md border border-green-500/30 bg-[#1a1a24] overflow-hidden cursor-pointer"
                          onClick={() => setMediaPreview({ type: 'video', url: vid.url, label: `Video ${index + 1}` })}
                        >
                          <video src={vid.url} className="w-full h-full object-cover" muted preload="metadata" />
                          {/* Play icon overlay on hover */}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                              <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[5px] border-y-transparent ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <div className="absolute -top-1.5 -left-1 bg-green-800 text-green-200 text-[11px] px-1.5 py-0.5 rounded-full z-20 font-medium pointer-events-none">Video {index + 1}</div>
                        {vid.duration > 0 && (
                          <div className="absolute -bottom-1.5 left-0 right-0 text-center z-20 pointer-events-none">
                            <span className="text-[11px] bg-green-800 text-green-200 px-1.5 py-0.5 rounded-full font-medium">{vid.duration}s</span>
                          </div>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); setVideoRefs(prev => prev.filter((_, i) => i !== index)); }}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
                          <X className="w-2 h-2 text-white" />
                        </button>
                      </div>
                    ))}
                    {((selectedModelOption.value === "kling-3.0/motion-control" && videoRefs.length < 1) ||
                      (selectedModelOption.value === "topaz/video-upscale" && videoRefs.length < 1) ||
                      ((selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && videoRefs.length < 3)) && (
                      <button onClick={() => setShowVideoBrowser(true)}
                        className="w-16 h-16 rounded-md border border-dashed border-green-800/50 hover:border-green-700/70 flex flex-col items-center justify-center gap-0.5 group transition-colors bg-green-900/10"
                        title="Add Video">
                        <Film className="w-4 h-4 text-green-600 group-hover:text-green-400" />
                        <span className="text-[11px] text-green-600 group-hover:text-green-400">Video</span>
                      </button>
                    )}

                    {/* Audio refs with duration — Seedance 2.0 only */}
                    {(selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (
                      <>
                        {audioRefs.map((aud, index) => (
                          <div key={`audio-${index}`} className="relative group"
                            draggable
                            onDragStart={(e) => {
                              e.dataTransfer.setData("text/plain", `@Audio${index + 1}`);
                              e.dataTransfer.setData("application/x-badge", JSON.stringify({ type: "audio", index: index + 1, url: aud.url }));
                            }}
                          >
                            <div className="w-16 h-16 rounded-md border border-purple-500/30 bg-[#1a1a24] flex flex-col items-center justify-center cursor-pointer"
                              onClick={() => setMediaPreview({ type: 'audio', url: aud.url, label: `Audio ${index + 1}` })}
                            >
                              <Volume2 className="w-5 h-5 text-purple-400" />
                              {/* Play icon overlay on hover */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                                <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                                  <div className="w-0 h-0 border-l-[8px] border-l-purple-600 border-y-[5px] border-y-transparent ml-0.5" />
                                </div>
                              </div>
                            </div>
                            <div className="absolute -top-1.5 -left-1 bg-purple-800 text-purple-200 text-[11px] px-1.5 py-0.5 rounded-full z-20 font-medium pointer-events-none">Audio {index + 1}</div>
                            {aud.duration > 0 && (
                              <div className="absolute -bottom-1.5 left-0 right-0 text-center z-20 pointer-events-none">
                                <span className="text-[11px] bg-purple-800 text-purple-200 px-1.5 py-0.5 rounded-full font-medium">{aud.duration}s</span>
                              </div>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); setAudioRefs(prev => prev.filter((_, i) => i !== index)); }}
                              className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
                              <X className="w-2 h-2 text-white" />
                            </button>
                          </div>
                        ))}
                        {audioRefs.length < 3 && (
                          <button onClick={() => setShowAudioBrowser(true)}
                            className="w-16 h-16 rounded-md border border-dashed border-purple-800/50 hover:border-purple-700/70 flex flex-col items-center justify-center gap-0.5 group transition-colors bg-purple-900/10"
                            title="Add Audio">
                            <Volume2 className="w-4 h-4 text-purple-600 group-hover:text-purple-400" />
                            <span className="text-[11px] text-purple-600 group-hover:text-purple-400">Audio</span>
                          </button>
                        )}
                      </>
                    )}

                    {/* Total duration warning for Seedance 2.0 */}
                    {(selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (totalVideoDuration > 0 || totalAudioDuration > 0) && (
                      <div className={`text-[9px] px-1.5 py-0.5 rounded-md font-medium ${
                        totalVideoDuration > 15 || totalAudioDuration > 15
                          ? 'bg-red-500/20 text-red-400'
                          : 'bg-gray-500/20 text-gray-400'
                      }`}>
                        {totalVideoDuration > 0 && <span>V:{totalVideoDuration}s </span>}
                        {totalAudioDuration > 0 && <span>A:{totalAudioDuration}s</span>}
                        {(totalVideoDuration > 15 || totalAudioDuration > 15) && <span> (max 15s)</span>}
                      </div>
                    )}
                  </div>
                )}

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
                          {/* Clear */}
                          <button
                            onClick={() => {
                              const el = editorRef.current;
                              if (el) {
                                el.innerHTML = '';
                                setEditorIsEmpty(true);
                                setCurrentPrompt('');
                                setShowPromptActions(false);
                              }
                            }}
                            disabled={editorIsEmpty}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                            <span>Clear Text</span>
                          </button>
                          
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
                              const textWithBadges = extractTextWithBadges();
                              
                              // Extract @Image mentions from HTML
                              const imageMentions = htmlContent.match(/@Image\d+/g) || [];
                              const r2Mentions = htmlContent.match(/@R2\d+/g) || [];
                              const elMentions = htmlContent.match(/@EL\d+/g) || [];
                              const allMentions = [...imageMentions, ...r2Mentions, ...elMentions];
                              
                              const mentionsText = allMentions.length > 0 ? allMentions.join(' ') : 'No @Image mentions found';
                              
                              alert(`Current textarea content with badges:\n\n${textWithBadges}\n\n@MENTIONS FOUND:\n${mentionsText}\n\nPLAIN TEXT (for AI):\n${plainText}`);
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
                          
                          {/* Load Style */}
                          <button
                            onClick={() => {
                              const stylePrompt = projectData?.stylePrompt;
                              if (stylePrompt) {
                                const el = editorRef.current;
                                if (el) {
                                  // Append style to existing prompt
                                  const existing = el.textContent || "";
                                  const combined = existing ? `${existing}\n\n${stylePrompt}` : stylePrompt;
                                  el.textContent = combined;
                                  setEditorIsEmpty(false);
                                  setCurrentPrompt(combined);
                                  onUserPromptChange?.(combined);
                                  toast.success(`Style "${projectData?.style || 'project'}" loaded`);
                                }
                              } else {
                                toast.error("No style set for this project");
                              }
                              setShowPromptActions(false);
                            }}
                            disabled={!projectData?.stylePrompt}
                            className="w-full px-3 py-2 text-left text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-colors flex items-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed"
                          >
                            <Palette className="w-4 h-4 text-purple-400" />
                            <span>Load Style</span>
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

            {/* Aspect Ratio Select Box - Hide for Kling Motion, Topaz Video Upscale, InfiniteTalk, and Music */}
            {selectedModelOption.value !== "kling-3.0/motion-control" && selectedModelOption.value !== "topaz/video-upscale" && selectedModelOption.value !== "infinitalk/from-audio" && selectedModelOption.value !== "ai-music-api/generate" && (
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
            )}

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
                      selectedModelOption.value === "ai-music-api/generate" ? "bg-purple-500/20 text-purple-300"
                      : outputMode === "image" ? "bg-cyan-500/20 text-cyan-300" : "bg-green-500/20 text-green-300"
                    }`}>
                      {selectedModelOption.value === "ai-music-api/generate" ? "Music" : outputMode === "image" ? "Image" : "Video"}
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
                            const modelOutputMode = modelOption.value === "ai-music-api/generate" ? "music" as const
                              : videoModelOptions.some(m => m.value === modelOption.value) ? "video" as const : "image" as const;
                            
                            // Switch output mode if different
                            if (modelOutputMode !== outputMode) {
                              setOutputMode(modelOutputMode);
                              // Reset resolution for the new mode
                              setResolution(modelOutputMode === "video" ? "480P" : "1K");
                              
                              // Set aspect ratio based on model and mode
                              if (modelOutputMode === "video") {
                                setAspectRatio("16:9"); // Video mode always 16:9
                              } else {
                                // Image mode: 16:9 for Nano Banana models, 1:1 for others
                                const isNanoBanana = modelOption.value.includes("nano-banana");
                                setAspectRatio(isNanoBanana ? "16:9" : "1:1");
                              }
                            }
                            
                            // Reset resolution/duration to valid defaults for the new model
                            if (modelOption.value === "kling-3.0/motion-control") {
                              setResolution("720P");
                              setVideoDuration("4s");
                            } else if (modelOption.value === "bytedance/seedance-2" || modelOption.value === "bytedance/seedance-2-fast") {
                              setResolution("480P");
                              setVideoDuration("5s");
                              setHasVideoInput(false);
                              setWebSearch(false);
                              setGenerateAudio(true);
                              setVideoRefs([]);
                              setAudioRefs([]);
                              setFirstFrameUrl(null);
                              setLastFrameUrl(null);
                            } else if (modelOption.value === "bytedance/seedance-1.5-pro") {
                              setResolution("480P");
                              setVideoDuration("8s");
                              setAudioEnabled(false);
                            } else if (modelOption.value === "google/veo-3.1") {
                              setVeoQuality("Fast");
                              setVeoMode("TEXT_2_VIDEO");
                            } else if (modelOption.value === "grok-imagine/image-to-video") {
                              setResolution("480P");
                              setVideoDuration("6s");
                              setAspectRatio("16:9");
                            } else {
                              // Image models
                              setResolution("1K");
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
                                modelOption.value === "ai-music-api/generate"
                                  ? "bg-purple-500/20 text-purple-300"
                                  : videoModelOptions.some(m => m.value === modelOption.value)
                                  ? "bg-green-500/20 text-green-300"
                                  : "bg-cyan-500/20 text-cyan-300"
                              }`}>
                                {modelOption.value === "ai-music-api/generate" ? "Music" : videoModelOptions.some(m => m.value === modelOption.value) ? "Video" : "Image"}
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

            {/* Resolution Select Box - Hide for Veo 3.1, Z-Image, Topaz Video Upscale, and InfiniteTalk */}
            {selectedModelOption.value !== "google/veo-3.1" && selectedModelOption.value !== "z-image" && selectedModelOption.value !== "topaz/video-upscale" && selectedModelOption.value !== "infinitalk/from-audio" && selectedModelOption.value !== "ai-music-api/generate" && (
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

            {/* Kling Motion: Orientation dropdown */}
            {selectedModelOption.value === "kling-3.0/motion-control" && (
              <div className="relative" style={{ width: "120px" }}>
                <button
                  onClick={() => setKlingOrientation(klingOrientation === "image" ? "video" : "image")}
                  className={`w-full px-3 py-2 border rounded-lg text-[13px] flex items-center justify-between transition-colors ${
                    klingOrientation === "video"
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{klingOrientation === "image" ? "Image Orient" : "Video Orient"}</span>
                </button>
              </div>
            )}

            {/* Kling Motion: Background Source dropdown */}
            {selectedModelOption.value === "kling-3.0/motion-control" && (
              <div className="relative" style={{ width: "120px" }}>
                <button
                  onClick={() => setKlingSource(klingSource === "input_video" ? "input_image" : "input_video")}
                  className={`w-full px-3 py-2 border rounded-lg text-[13px] flex items-center justify-between transition-colors ${
                    klingSource === "input_image"
                      ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{klingSource === "input_video" ? "Video Source" : "Image Source"}</span>
                </button>
              </div>
            )}

            {/* Topaz Video Upscale: Upscale Factor dropdown */}
            {selectedModelOption.value === "topaz/video-upscale" && (
              <div className="relative" style={{ width: "100px" }}>
                <button
                  onClick={() => {
                    const factors: Array<"1" | "2" | "4"> = ["1", "2", "4"];
                    const idx = factors.indexOf(topazUpscaleFactor);
                    setTopazUpscaleFactor(factors[(idx + 1) % factors.length]);
                  }}
                  className={`w-full px-3 py-2 border rounded-lg text-[13px] flex items-center justify-between transition-colors ${
                    topazUpscaleFactor === "4"
                      ? 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{topazUpscaleFactor}x Upscale</span>
                </button>
              </div>
            )}

            {/* Topaz Video Upscale: NSFW Checker toggle */}
            {selectedModelOption.value === "topaz/video-upscale" && (
              <div className="relative" style={{ width: "100px" }}>
                <button
                  onClick={() => setNsfwChecker(!nsfwChecker)}
                  className={`w-full px-3 py-2 border rounded-lg text-[13px] flex items-center justify-between transition-colors ${
                    nsfwChecker
                      ? 'bg-green-500/10 border-green-500/30 text-green-400'
                      : 'bg-red-500/10 border-red-500/30 text-red-400'
                  }`}
                >
                  <span>NSFW {nsfwChecker ? "On" : "Off"}</span>
                </button>
              </div>
            )}

            {/* Topaz Video Upscale: Video duration display (from video ref) */}
            {selectedModelOption.value === "topaz/video-upscale" && videoRefs.length > 0 && (
              <div className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-[13px] text-gray-400">
                {videoRefs[0].duration}s video
              </div>
            )}

            {/* InfiniteTalk: Resolution dropdown */}
            {selectedModelOption.value === "infinitalk/from-audio" && (
              <div className="relative" style={{ width: "100px" }}>
                <button
                  onClick={() => setInfinitalkResolution(infinitalkResolution === "480p" ? "720p" : "480p")}
                  className={`w-full px-3 py-2 border rounded-lg text-[13px] flex items-center justify-between transition-colors ${
                    infinitalkResolution === "720p"
                      ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                      : 'bg-white/5 border-white/10 text-white hover:bg-white/10'
                  }`}
                >
                  <span>{infinitalkResolution}</span>
                </button>
              </div>
            )}


            {/* AI Music: Instrumental / Vocals toggle */}
            {selectedModelOption.value === "ai-music-api/generate" && (
              <button
                onClick={() => setMusicInstrumental(!musicInstrumental)}
                className={`px-3 py-2 border rounded-lg text-[13px] flex items-center gap-1.5 transition-colors ${
                  musicInstrumental
                    ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                    : 'bg-orange-500/10 border-orange-500/30 text-orange-400'
                }`}
              >
                <Music className="w-3.5 h-3.5" />
                <span>{musicInstrumental ? "Instrumental" : "Vocals"}</span>
              </button>
            )}

            {/* AI Music: Vocal Gender — only when vocals enabled */}
            {selectedModelOption.value === "ai-music-api/generate" && !musicInstrumental && (
              <button
                onClick={() => setMusicVocalGender(musicVocalGender === "f" ? "m" : "f")}
                className="px-3 py-2 bg-[#1E1E24] border border-[#2A2A32] rounded-lg text-[13px] text-[#EAEAEA] flex items-center gap-1.5 hover:bg-[#2A2A35] transition-colors"
              >
                <span>{musicVocalGender === "f" ? "♀ Female" : "♂ Male"}</span>
              </button>
            )}

            {/* AI Music: Style/Genre selector — custom dropdown */}
            {selectedModelOption.value === "ai-music-api/generate" && (
              <div className="relative">
                <button
                  onClick={() => setShowMusicStyleDropdown(!showMusicStyleDropdown)}
                  className="px-3 py-2 bg-[#1E1E24] border border-[#2A2A32] rounded-lg text-[13px] text-[#EAEAEA] flex items-center gap-1.5 hover:bg-[#2A2A35] transition-colors"
                  style={{ width: "110px" }}
                >
                  <span className="flex-1 text-left truncate">{musicStyle || "Any Style"}</span>
                  <ChevronDown className="w-3 h-3 text-gray-400" />
                </button>
                {showMusicStyleDropdown && (
                  <div className="absolute bottom-full left-0 mb-1 w-[140px] bg-[#141418] border border-[#2A2A32] rounded-lg shadow-xl z-50 py-1 max-h-64 overflow-y-auto">
                    {[
                      { value: "", label: "Any Style" },
                      { value: "Cinematic", label: "Cinematic" },
                      { value: "Electronic", label: "Electronic" },
                      { value: "Lo-fi", label: "Lo-fi" },
                      { value: "Ambient", label: "Ambient" },
                      { value: "Jazz", label: "Jazz" },
                      { value: "Rock", label: "Rock" },
                      { value: "Classical", label: "Classical" },
                      { value: "Pop", label: "Pop" },
                      { value: "Hip Hop", label: "Hip Hop" },
                      { value: "R&B", label: "R&B" },
                      { value: "Country", label: "Country" },
                      { value: "Folk", label: "Folk" },
                    ].map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => { setMusicStyle(opt.value); setShowMusicStyleDropdown(false); }}
                        className={`w-full text-left px-3 py-1.5 text-[13px] transition-colors ${
                          musicStyle === opt.value
                            ? 'bg-[#4A90E2]/15 text-[#4A90E2]'
                            : 'text-[#EAEAEA] hover:bg-[#1E1E24]'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* AI Music: Model version */}
            {selectedModelOption.value === "ai-music-api/generate" && (
              <button
                onClick={() => setMusicModel(musicModel === "V4" ? "V5" : "V4")}
                className="px-3 py-2 bg-[#1E1E24] border border-[#2A2A32] rounded-lg text-[13px] text-[#EAEAEA] hover:bg-[#2A2A35] transition-colors"
              >
                {musicModel}
              </button>
            )}

            {/* Video Duration Select Box - Hide for Veo 3.1, Kling Motion, Topaz Video Upscale, and InfiniteTalk */}
            {outputMode === "video" && !["google/veo-3.1", "kling-3.0/motion-control", "topaz/video-upscale", "infinitalk/from-audio", "ai-music-api/generate"].includes(selectedModelOption.value) && (
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

            {/* Video Input toggle - Only for Seedance 2.0 */}
            {/* Audio Select Box - Only show in video mode, not Veo 3.1, not Kling Motion, not Seedance 2.0/Fast, not Grok, not Topaz */}
            {outputMode === "video" && !["google/veo-3.1", "kling-3.0/motion-control", "bytedance/seedance-2", "bytedance/seedance-2-fast", "grok-imagine/image-to-video", "topaz/video-upscale", "infinitalk/from-audio"].includes(selectedModelOption.value) && (
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
                                // Change aspect ratio based on current selection
                                setAspectRatio(aspectRatio === "1:1" ? "16:9" : "6:19");
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

            {/* Output Format Select Box - Only show in image mode, hide for z-image */}
            {outputMode === "image" && selectedModelOption.value !== "z-image" && (
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

            {/* Seedance 2.0/Fast: Mode selector + Web Search + Generate Audio switches */}
            {(selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (
              <>
                {/* Mode selector — styled like duration dropdown */}
                {(() => {
                  const [showModeDropdown, setShowModeDropdown] = [seedanceModeOpen, setSeedanceModeOpen];
                  const modeOptions = [
                    { value: "text-to-video", label: "Text Only" },
                    { value: "first-frame", label: "First Frame" },
                    { value: "first-last-frame", label: "First & Last" },
                    { value: "multimodal", label: "Multimodal Ref" },
                    { value: "ugc", label: "UGC" },
                    { value: "showcase", label: "Showcase" },
                    { value: "lipsync", label: "Lipsync" },
                  ];
                  return (
                    <div className="relative">
                      <button
                        onClick={() => setSeedanceModeOpen(!seedanceModeOpen)}
                        className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-white text-[13px] flex items-center gap-2 hover:bg-white/10 transition-colors"
                      >
                        <span>{modeOptions.find(o => o.value === seedanceMode)?.label || "Text Only"}</span>
                        <ChevronDown className="w-3 h-3 text-gray-400" />
                      </button>
                      {seedanceModeOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setSeedanceModeOpen(false)} />
                          <div className="absolute bottom-full mb-1 left-0 bg-[#1a1a24] border border-white/15 rounded-lg shadow-2xl py-1 z-50 min-w-[140px]">
                            {modeOptions.map(opt => (
                              <button
                                key={opt.value}
                                onClick={() => { setSeedanceMode(opt.value as any); setSeedanceModeOpen(false); }}
                                className={`w-full px-3 py-2 text-left text-[13px] transition-colors ${
                                  seedanceMode === opt.value
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'text-gray-300 hover:bg-white/8 hover:text-white'
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })()}

                <button
                  onClick={() => setWebSearch(!webSearch)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    webSearch
                      ? 'bg-cyan-500/15 border-cyan-500/30 text-cyan-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                  title="Web Search"
                >
                  <div className={`w-6 h-3.5 rounded-full relative transition-colors ${webSearch ? 'bg-cyan-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${webSearch ? 'left-3' : 'left-0.5'}`} />
                  </div>
                  Search
                </button>
                <button
                  onClick={() => setGenerateAudio(!generateAudio)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    generateAudio
                      ? 'bg-purple-500/15 border-purple-500/30 text-purple-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                  title="Generate Audio"
                >
                  <div className={`w-6 h-3.5 rounded-full relative transition-colors ${generateAudio ? 'bg-purple-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${generateAudio ? 'left-3' : 'left-0.5'}`} />
                  </div>
                  Audio
                </button>
                <button
                  onClick={() => setCleanOutput(!cleanOutput)}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                    cleanOutput
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                  }`}
                  title="Clean Output — appends 'no subtitles, no music, no text overlays' to prompt"
                >
                  <div className={`w-6 h-3.5 rounded-full relative transition-colors ${cleanOutput ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                    <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${cleanOutput ? 'left-3' : 'left-0.5'}`} />
                  </div>
                  Clean
                </button>
              </>
            )}

            {/* Z-Image: NSFW Checker switch */}
            {selectedModelOption.value === "z-image" && (
              <button
                onClick={() => setNsfwChecker(!nsfwChecker)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-all border ${
                  nsfwChecker
                    ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                    : 'bg-white/5 border-white/10 text-gray-500 hover:text-gray-300'
                }`}
                title="NSFW Content Filter"
              >
                <div className={`w-6 h-3.5 rounded-full relative transition-colors ${nsfwChecker ? 'bg-emerald-500' : 'bg-gray-600'}`}>
                  <div className={`absolute top-0.5 w-2.5 h-2.5 rounded-full bg-white transition-transform ${nsfwChecker ? 'left-3' : 'left-0.5'}`} />
                </div>
                NSFW
              </button>
            )}

            {/* Cost per generation */}
            <div className="flex items-center gap-1.5 text-[12px] text-gray-400">
              <Zap className="w-3.5 h-3.5 text-blue-400" />
              <span>{displayedCredits} credits</span>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleKieAIGenerate}
              disabled={isGenerating || generateCooldown}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${
                "bg-gradient-to-r from-blue-500 to-green-500 hover:from-blue-600 hover:to-green-600 text-white"
              }`}
            >
              {isGenerating || generateCooldown ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {cooldownSeconds > 0 ? `Wait ${cooldownSeconds}s...` : "Generating..."}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Generate
                  <span className="text-xs opacity-75">+ {displayedCredits}</span>
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
        userCompanyId={currentCompanyId}
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

      {/* First Frame FileBrowser */}
      {showFirstFrameBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowFirstFrameBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            setFirstFrameUrl(imageUrl);
            setShowFirstFrameBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image') {
              setFirstFrameUrl(url);
              setShowFirstFrameBrowser(false);
            }
          }}
        />
      )}

      {/* Last Frame FileBrowser */}
      {showLastFrameBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowLastFrameBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            setLastFrameUrl(imageUrl);
            setShowLastFrameBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image') {
              setLastFrameUrl(url);
              setShowLastFrameBrowser(false);
            }
          }}
        />
      )}

      {/* UGC: Product Image FileBrowser */}
      {showProductBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowProductBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            if (productImages.length < 3) {
              setProductImages(prev => [...prev, { id: `product-${Date.now()}`, url: imageUrl, source: 'r2' as const, name: 'product' }]);
            }
            setShowProductBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image' && productImages.length < 3) {
              setProductImages(prev => [...prev, { id: `product-${Date.now()}`, url, source: 'r2' as const, name: 'product' }]);
              setShowProductBrowser(false);
            }
          }}
        />
      )}

      {/* UGC: Influencer Image FileBrowser */}
      {showInfluencerBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowInfluencerBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            if (influencerImages.length < 3) {
              setInfluencerImages(prev => [...prev, { id: `influencer-${Date.now()}`, url: imageUrl, source: 'r2' as const, name: 'influencer' }]);
            }
            setShowInfluencerBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image' && influencerImages.length < 3) {
              setInfluencerImages(prev => [...prev, { id: `influencer-${Date.now()}`, url, source: 'r2' as const, name: 'influencer' }]);
              setShowInfluencerBrowser(false);
            }
          }}
        />
      )}

      {/* Showcase: Presenter Image FileBrowser */}
      {showPresenterBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowPresenterBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            if (presenterImages.length < 1) {
              setPresenterImages([{ id: `presenter-${Date.now()}`, url: imageUrl, source: 'r2' as const, name: 'presenter' }]);
            }
            setShowPresenterBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image' && presenterImages.length < 1) {
              setPresenterImages([{ id: `presenter-${Date.now()}`, url, source: 'r2' as const, name: 'presenter' }]);
              setShowPresenterBrowser(false);
            }
          }}
        />
      )}

      {/* Showcase: Subject Image FileBrowser */}
      {showSubjectBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowSubjectBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            if (subjectImages.length < 6) {
              setSubjectImages(prev => [...prev, { id: `subject-${Date.now()}`, url: imageUrl, source: 'r2' as const, name: 'subject' }]);
            }
            setShowSubjectBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image' && subjectImages.length < 6) {
              setSubjectImages(prev => [...prev, { id: `subject-${Date.now()}`, url, source: 'r2' as const, name: 'subject' }]);
              setShowSubjectBrowser(false);
            }
          }}
        />
      )}

      {/* Showcase: Scene Image FileBrowser */}
      {showSceneBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowSceneBrowser(false)}
          imageSelectionMode={true}
          onSelectImage={(imageUrl) => {
            if (sceneImages.length < 2) {
              setSceneImages(prev => [...prev, { id: `scene-${Date.now()}`, url: imageUrl, source: 'r2' as const, name: 'scene' }]);
            }
            setShowSceneBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image' && sceneImages.length < 2) {
              setSceneImages(prev => [...prev, { id: `scene-${Date.now()}`, url, source: 'r2' as const, name: 'scene' }]);
              setShowSceneBrowser(false);
            }
          }}
        />
      )}

      {/* Video Reference FileBrowser */}
      {showVideoBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowVideoBrowser(false)}
          onSelectFile={async (url, type) => {
            if (type === 'video') {
              const maxVideos = (selectedModelOption.value === "kling-3.0/motion-control" || selectedModelOption.value === "topaz/video-upscale") ? 1 : 3;
              if (videoRefs.length >= maxVideos) {
                setShowVideoBrowser(false);
                return;
              }
              // Get video duration
              const duration = await getMediaDuration(url, 'video');
              // Validate total ≤15s for Seedance 2.0
              if ((selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && totalVideoDuration + duration > 15) {
                alert(`Total video duration would be ${totalVideoDuration + duration}s. Maximum is 15s.`);
                return;
              }
              setVideoRefs(prev => [...prev, { url, duration }]);
              setShowVideoBrowser(false);
            }
          }}
        />
      )}

      {/* Audio Reference FileBrowser — Seedance 2.0 */}
      {showAudioBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          defaultFileType="audio"
          onClose={() => setShowAudioBrowser(false)}
          onSelectFile={async (url, type) => {
            if (type === 'audio' || type === 'file') {
              if (audioRefs.length >= 3) {
                setShowAudioBrowser(false);
                return;
              }
              // Get audio duration
              const duration = await getMediaDuration(url, 'audio');
              // Validate total ≤15s
              if (totalAudioDuration + duration > 15) {
                alert(`Total audio duration would be ${totalAudioDuration + duration}s. Maximum is 15s.`);
                return;
              }
              setAudioRefs(prev => [...prev, { url, duration }]);
              setShowAudioBrowser(false);
            }
          }}
        />
      )}

      {/* Media Preview Popup */}
      {mediaPreview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }}
          onClick={() => setMediaPreview(null)}
        >
          <div className="bg-[#1A1A1A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
              <h3 className="text-white font-medium">{mediaPreview.type === 'video' ? 'Video Preview' : 'Audio Preview'}</h3>
              <button onClick={() => setMediaPreview(null)}
                className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Content */}
            <div className="p-4">
              {mediaPreview.type === 'video' ? (
                <video
                  src={mediaPreview.url}
                  controls
                  autoPlay
                  className="w-full rounded-lg"
                  style={{ maxHeight: '70vh' }}
                />
              ) : (
                <div className="flex flex-col items-center gap-6 py-8">
                  <div className="w-24 h-24 rounded-full bg-purple-500/20 border border-purple-400/40 flex items-center justify-center">
                    <Volume2 className="w-12 h-12 text-purple-400" />
                  </div>
                  <audio
                    src={mediaPreview.url}
                    controls
                    autoPlay
                    className="w-full max-w-lg"
                  />
                </div>
              )}
            </div>
            {/* Footer */}
            <div className="p-4 border-t border-[#3D3D3D]">
              <div className="text-sm text-gray-400">{mediaPreview.label}</div>
            </div>
          </div>
        </div>
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
      {/* Prompt Length Error Dialog for Seedance 2.0 */}
      <ConfirmDialog
        isOpen={!!promptLengthError}
        onCancel={() => setPromptLengthError(null)}
        onConfirm={() => setPromptLengthError(null)}
        title="Prompt Too Long"
        subtitle={`Seedance 2.0 limit: ${promptLengthError?.max || 1536} characters`}
        message={
          <>
            Your prompt is <span className="text-white font-semibold">{promptLengthError?.current || 0}</span> characters,
            which exceeds the maximum of <span className="text-white font-semibold">{promptLengthError?.max || 1536}</span> characters
            for Seedance 2.0 models.
            <br /><br />
            Please shorten your prompt by <span className="text-red-400 font-semibold">{(promptLengthError?.current || 0) - (promptLengthError?.max || 1536)}</span> characters before generating.
          </>
        }
        confirmText="OK"
        cancelText="Close"
        variant="warning"
      />
    </>
  );
}
