"use client";

import { toast } from "sonner";
import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { 
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Settings, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp, BookOpen, Check,
  FolderOpen, FileText, Video, Filter, Search,
  Zap, Camera, Film, Palette, Clock, Monitor, Volume2, VolumeX, Coins, Mic, Music, Play, Pause, Loader2, Lock, LayoutGrid, SlidersHorizontal, Timer, Crosshair,
} from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { AddImageMenu } from "../shared/AddImageMenu";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { usePromptEditor } from "../shared/usePromptEditor";
import { PromptTextarea } from "../shared/PromptTextarea";
import { composeCustomElementPrompt } from "./elementForgeConfig";
import { ConvexHttpClient } from "convex/browser";
import { useUser, useOrganization } from "@clerk/nextjs";
import { usePricingData } from "@/app/storyboard-studio/components/shared/usePricingData";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { useSubscription } from "@/hooks/useSubscription";
import { useFeatures } from "@/hooks/useFeatures";
import PromptLibrary from "./PromptLibrary";
import { FORMAT_PROMPT_MAP, GENRE_PRESETS, GENRE_PROMPTS, FORMAT_PRESETS } from "../../constants";
import { GenrePicker } from "./GenrePicker";
import { FormatPicker } from "./FormatPicker";
import { FileBrowser } from "./FileBrowser";
import { AudioPreviewDialog } from "../shared/AudioPreviewDialog";
import { CreatePersonaDialog } from "../GeneratedImagesPanel/CreatePersonaDialog";
import { ManagePersonaDialog } from "../shared/ManagePersonaDialog";
import { ElementLibrary } from "./ElementLibrary";
import { TtsVoiceSelector, TtsLanguageSelector, TTS_DEFAULT_VOICE } from "../shared/TtsVoiceSelector";
import { PromptActionsDropdown } from "../shared/PromptActionsDropdown";
import { VirtualCameraStyle, buildCameraPromptText, buildCinemaStudioMetadata, type CinemaStudioMetadata, CAMERA_OPTIONS, LENS_OPTIONS } from "./VirtualCameraStyle";
import { CameraAnglePicker, buildAnglePromptText, DEFAULT_ANGLE_SETTINGS } from "./CameraAnglePicker";
import type { CameraAngleSettings } from "./CameraAnglePicker";
import { ColorPalettePicker, buildColorPalettePromptText, type ColorPaletteColors } from "./ColorPalettePicker";
import { SpeedRampEditor, buildSpeedRampPromptText, type SpeedCurve } from "./SpeedRampEditor";

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
  source: 'upload' | 'r2' | 'element';
  name?: string;
  metadata?: ReferenceImageMetadata;
  type?: 'reference' | 'background'; // NEW: Track if this is a background image
}

export interface ImageAIPanelProps {
  mode: ImageAIEditMode;
  onModeChange: (mode: ImageAIEditMode) => void;
  onGenerate: (creditsUsed: number, quality: string, aspectRatio: string, duration: string, audioEnabled: boolean, extractedPrompt: string, veoQuality?: string, veoMode?: string, klingOrientation?: string, klingSource?: string, videoUrls?: string[], audioUrls?: string[], seedanceMode?: string, firstFrameUrl?: string, lastFrameUrl?: string, ugcImageUrls?: string[], cinemaMetadata?: CinemaStudioMetadata) => void;
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
  activeShotId?: string; // Active shot/item ID for filtering generated files
  activeShotLinkedElements?: Array<{ id: string; name: string; type: string }>;
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
  showMask?: boolean;
  setShowMask?: (value: boolean) => void;
  onZoomChange?: (value: number) => void;
  onAddReferenceFromUrl?: (url: string) => Promise<void>;
  onDownloadCanvas?: (() => void) | undefined;
  onSaveAsOriginal?: (() => void) | undefined;
  onSaveToUploadFolder?: () => void;
  onUploadOverride?: () => void;
  onCombine?: () => void;
  originalImage?: string;
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
      className={`w-8 h-8 rounded-md flex items-center justify-center transition-all ${
        active
          ? "bg-white/10 text-(--text-primary)"
          : danger
          ? "text-red-400 hover:bg-red-500/10 hover:text-red-300"
          : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
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
  model = "gpt-image-2-image-to-image",
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
  activeShotId,
  activeShotLinkedElements,
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
  const { hasProFeatures } = useFeatures();
  
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
  // showPromptActions now managed by PromptActionsDropdown component
  const [outputMode, setOutputMode] = useState<"image" | "video" | "audio" | "analyze">("image");
  const createTemplate = useMutation(api.promptTemplates.create);
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const deductCredits = useMutation(api.credits.deductCredits);
  const refundCredits = useMutation(api.credits.refundCredits);
  
  // Use exact same pattern as working CreditBalanceDisplay (avoid naming conflicts)
  const { user: clerkUser } = useUser();
  const { organization } = useOrganization();
  const companyId = currentCompanyId || "personal";
  
  const getBalance = useQuery(api.credits.getBalance, {
    companyId: companyId
  });
  const projectData = useQuery(api.storyboard.projects.get, projectId ? { id: projectId } : "skip");
  // Project elements for @mention autocomplete + generation-time reference image injection
  const projectElements = useQuery(api.storyboard.build.listElementsForBuild, projectId ? { projectId } : "skip");
  const savedPersonas = useQuery(api.storyboard.personas.list, { companyId });
  const renameFileMutation = useMutation(api.storyboard.storyboardFiles.renameFile);
  const updateProjectMutation = useMutation(api.storyboard.projects.update);
  const audioFiles = useQuery(api.storyboard.storyboardFiles.listAudioFiles, { companyId, categoryId: activeShotId });
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
    parseMentions,
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
    // Auto-switch to GPT Image 2 when switching to image mode
    else if (newMode === "image" && onModelChange) {
      onModelChange("gpt-image-2-image-to-image");
    }
  };

  // Model options for describe mode
  const inpaintModelOptions = [
    { value: "nano-banana-2", label: "Nano Banana 2", sub: "General purpose", maxReferenceImages: 13, icon: Zap, category: "image" as const },
    { value: "nano-banana-pro", label: "Nano Banana Pro", sub: "Higher quality • Max 8 refs", maxReferenceImages: 8, icon: Camera, category: "image" as const },
    { value: "z-image", label: "Z-Image", sub: "Text-to-image • Fixed price", maxReferenceImages: 0, icon: Zap, category: "image" as const },
    { value: "gpt-image-2-image-to-image", label: "GPT Image 2", sub: "Photorealism • up to 16 refs • 12 cr", maxReferenceImages: 16, icon: Camera, category: "image" as const },
  ];
  const videoModelOptions = [
    { value: "bytedance/seedance-1.5-pro", label: "Seedance 1.5 Pro", sub: "Video generation", icon: Film, maxReferenceImages: 2, category: "video" as const },
    { value: "bytedance/seedance-2", label: "Seedance 2.0", sub: "Quality • 480p/720p", icon: Film, maxReferenceImages: 9, category: "video" as const },
    { value: "bytedance/seedance-2-fast", label: "Seedance 2.0 Fast", sub: "Faster • 480p/720p", icon: Film, maxReferenceImages: 9, category: "video" as const },
    { value: "kling-3.0/motion-control", label: "Kling 3.0 Motion", sub: "720p/1080p • 1 img + 1 video", icon: Film, maxReferenceImages: 1, category: "video" as const },
    { value: "google/veo-3.1", label: "Veo 3.1", sub: "Google Video generation", icon: Film, maxReferenceImages: 3, category: "video" as const },
    { value: "grok-imagine/image-to-video", label: "Grok Imagine", sub: "480p/720p • up to 7 refs • 6-30s", icon: Film, maxReferenceImages: 7, category: "video" as const },
    { value: "topaz/video-upscale", label: "Topaz Video Upscale", sub: "1x/2x/4x • MP4, MOV, WEBM, M4V, GIF", icon: ArrowUp, maxReferenceImages: 0, category: "video" as const },
    { value: "infinitalk/from-audio", label: "InfiniteTalk", sub: "Lip sync • image + audio • 480p/720p", icon: Mic, maxReferenceImages: 1, category: "video" as const },
    { value: "ai-music-api/generate", label: "AI Music", sub: "Generate music • up to 4min", icon: Music, maxReferenceImages: 0, category: "audio" as const },
    { value: "ai-music-api/upload-cover", label: "Cover Song", sub: "Re-sing with persona • upload audio", icon: Music, maxReferenceImages: 0, category: "audio" as const },
    { value: "ai-music-api/extend", label: "Extend Music", sub: "Make songs longer • from timestamp", icon: Music, maxReferenceImages: 0, category: "audio" as const },
    { value: "ai-music-api/generate-persona", label: "Create Persona", sub: "Extract voice • free", icon: Mic, maxReferenceImages: 0, category: "audio" as const },
    { value: "elevenlabs/text-to-speech-multilingual-v2", label: "ElevenLabs TTS", sub: "Text-to-speech • multilingual • 12 cr/1K chars", icon: Volume2, maxReferenceImages: 0, category: "audio" as const, extraBadge: "speech" as const },
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
  const [nsfwChecker, setNsfwChecker] = useState(true); // Z-Image / Topaz / Grok: NSFW checker (default on)
  const [grokMode, setGrokMode] = useState<"normal" | "fun">("normal"); // Grok Imagine: generation mode
  const [topazUpscaleFactor, setTopazUpscaleFactor] = useState<"1" | "2" | "4">("2"); // Topaz Video Upscale factor
  const [infinitalkResolution, setInfinitalkResolution] = useState<"480p" | "720p">("480p"); // InfiniteTalk: resolution
  const [infinitalkAudioUrl, setInfinitalkAudioUrl] = useState<string>(""); // InfiniteTalk: audio URL
  const [musicInstrumental, setMusicInstrumental] = useState(true); // Music: instrumental only (no vocals)
  const [musicStyle, setMusicStyle] = useState(""); // Music: genre/style tag
  const [musicVocalGender, setMusicVocalGender] = useState<"m" | "f">("f"); // Music: vocal gender
  const [musicModel, setMusicModel] = useState<string>("V4"); // Music: model version
  const [musicNegativeTags, setMusicNegativeTags] = useState(""); // Music: styles to exclude
  const [musicTitle, setMusicTitle] = useState(""); // Music: song title (required in custom mode)
  const [selectedPersonaId, setSelectedPersonaId] = useState<string>(""); // Music: selected persona for Generate/Cover/Extend
  const [musicCoverAudioUrl, setMusicCoverAudioUrl] = useState<string>(""); // Cover: uploaded audio URL
  const [coverCustomMode, setCoverCustomMode] = useState(true); // Cover: custom mode toggle
  const [coverStyleWeight, setCoverStyleWeight] = useState(0.5); // Cover: style weight 0-1
  const [coverWeirdnessConstraint, setCoverWeirdnessConstraint] = useState(0.5); // Cover: weirdness constraint 0-1
  const [coverAudioWeight, setCoverAudioWeight] = useState(0.5); // Cover: audio weight 0-1
  const [musicExtendAudioId, setMusicExtendAudioId] = useState<string>(""); // Extend: audioId of song to extend
  const [musicExtendContinueAt, setMusicExtendContinueAt] = useState<number>(60); // Extend: timestamp to continue from
  const [personaName, setPersonaName] = useState(""); // Create Persona: name
  const [personaDescription, setPersonaDescription] = useState(""); // Create Persona: description
  const [personaSourceAudioId, setPersonaSourceAudioId] = useState(""); // Create Persona: audioId from generated song
  const [personaSourceTaskId, setPersonaSourceTaskId] = useState(""); // Create Persona: taskId from generated song
  // ElevenLabs TTS state
  const [ttsVoice, setTtsVoice] = useState(TTS_DEFAULT_VOICE); // TTS: default to James (Husky, Engaging and Bold)
  const [ttsStability, setTtsStability] = useState(0.5); // TTS: voice stability 0-1
  const [ttsSimilarityBoost, setTtsSimilarityBoost] = useState(0.75); // TTS: similarity boost 0-1
  const [ttsStyle, setTtsStyle] = useState(0); // TTS: style exaggeration 0-1
  const [ttsSpeed, setTtsSpeed] = useState(1); // TTS: speed 0.7-1.2
  const [ttsLanguageCode, setTtsLanguageCode] = useState(""); // TTS: language code (ISO 639-1)
  const [ttsPreviousText, setTtsPreviousText] = useState(""); // TTS: context before current text
  const [ttsNextText, setTtsNextText] = useState(""); // TTS: context after current text
  const [showTtsVoiceDropdown, setShowTtsVoiceDropdown] = useState(false); // TTS: voice selector dropdown
  // GPT Image 2 state
  const [gptImage2Mode, setGptImage2Mode] = useState<"image-to-image" | "text-to-image">("image-to-image"); // GPT Image 2: mode
  const [gptImage2Nsfw, setGptImage2Nsfw] = useState(false); // GPT Image 2: NSFW checker
  const [showGptImage2ModeDropdown, setShowGptImage2ModeDropdown] = useState(false); // GPT Image 2: mode dropdown
  const [showTtsLanguageDropdown, setShowTtsLanguageDropdown] = useState(false); // TTS: language selector dropdown
  const [showMusicStyleDropdown, setShowMusicStyleDropdown] = useState(false); // Music: style dropdown
  const [showPersonaDropdown, setShowPersonaDropdown] = useState(false); // Music: persona dropdown
  const [showCoverAdvanced, setShowCoverAdvanced] = useState(false); // Cover: advanced options toggle
  const [showModelVersionDropdown, setShowModelVersionDropdown] = useState(false); // Music: model version dropdown
  // showCoverAdvanced is now shared for all music models (generate/cover/extend)
  const [showExtendAudioDropdown, setShowExtendAudioDropdown] = useState(false); // Extend: audio file selector
  // extendDefaultParam removed — now using shared coverCustomMode for all music models
  const [extendPreviewPlaying, setExtendPreviewPlaying] = useState<string | null>(null); // Extend: playing audio preview
  // extendPreviewPopup uses mediaPreview state (shared)
  const [personaSourceSong, setPersonaSourceSong] = useState<{ audioId: string; taskId: string; sourceUrl: string; name: string; fileId: string } | null>(null);
  const [showPersonaCreateDialog, setShowPersonaCreateDialog] = useState(false);
  const [showManagePersona, setShowManagePersona] = useState(false);
  const extendPreviewAudioRef = React.useRef<HTMLAudioElement>(null);
  const [klingOrientation, setKlingOrientation] = useState<"image" | "video">("video"); // Kling: default video orient
  const [klingSource, setKlingSource] = useState<"input_video" | "input_image">("input_video"); // Kling: background source
  const [firstFrameUrl, setFirstFrameUrl] = useState<string | null>(null); // Seedance 2.0: first frame
  const [lastFrameUrl, setLastFrameUrl] = useState<string | null>(null); // Seedance 2.0: last frame
  const [showFirstFrameBrowser, setShowFirstFrameBrowser] = useState(false);
  const [showLastFrameBrowser, setShowLastFrameBrowser] = useState(false);
  // Media preview popup
  const [mediaPreview, setMediaPreview] = useState<{ type: 'video' | 'audio' | 'image'; url: string; label: string; prompt?: string; fileId?: string } | null>(null);
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
  const [gridSize, setGridSize] = useState(1); // 1=1x1, 4=2x2, 9=3x3, 16=4x4
  const [showGridDropdown, setShowGridDropdown] = useState(false);
  const [showCreateModeDropdown, setShowCreateModeDropdown] = useState(false);
  const [showSettingsPopover, setShowSettingsPopover] = useState(false);
  const [pillBarExpanded, setPillBarExpanded] = useState(true);
  const [showPillGenre, setShowPillGenre] = useState(false);
  const [showPillFormat, setShowPillFormat] = useState(false);
  const [showPillCamera, setShowPillCamera] = useState(false);
  const [showPillMotion, setShowPillMotion] = useState(false);
  const [addImageMenuOpen, setAddImageMenuOpen] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analyzeType, setAnalyzeType] = useState<"image" | "video" | "audio">("image");
  const [analyzeMediaUrl, setAnalyzeMediaUrl] = useState("");
  const [analyzeResult, setAnalyzeResult] = useState("");
  const [showAnalyzeBrowser, setShowAnalyzeBrowser] = useState(false);

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
    // GPT Image 2 text-to-image mode: no reference images needed
    if (selectedModelOption.value === "gpt-image-2-image-to-image" && gptImage2Mode === "text-to-image") {
      return 0;
    }
    return selectedModelOption.maxReferenceImages || 0;
  };

  const maxReferenceImages = getMaxReferenceImages();
  
  // Dynamic credit calculation for video models using getSeedance15 function
  const _rawCredits = (["nano-banana-2", "nano-banana-pro"].includes(selectedModelOption.value)
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
    : selectedModelOption.value === "ai-music-api/upload-cover"
    ? (() => {
        const coverCredits = getModelCredits("ai-music-api/upload-cover", "fixed");
        return coverCredits > 0 ? coverCredits : 15;
      })()
    : selectedModelOption.value === "ai-music-api/extend"
    ? (() => {
        const extendCredits = getModelCredits("ai-music-api/extend", "fixed");
        return extendCredits > 0 ? extendCredits : 15;
      })()
    : selectedModelOption.value === "ai-music-api/generate-persona"
    ? 0 // Free
    : selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2"
    ? (() => {
        const charCount = currentPrompt.length || 0;
        if (charCount <= 0) return getModelCredits("elevenlabs/text-to-speech-multilingual-v2", "chars_1000");
        return getModelCredits("elevenlabs/text-to-speech-multilingual-v2", `chars_${charCount}`);
      })()
    : selectedModelOption.value === "z-image"
    ? (() => {
        const credits = getModelCredits("z-image", "fixed");
        return credits > 0 ? credits : 1;
      })()
    : selectedModelOption.value === "gpt-image-2-image-to-image"
    ? (() => {
        const modelId = gptImage2Mode === "text-to-image" ? "gpt-image-2-text-to-image" : "gpt-image-2-image-to-image";
        const credits = getModelCredits(modelId, resolution);
        return credits > 0 ? credits : 6;
      })()
    : credits);
  const displayedCredits = Number.isFinite(_rawCredits) ? _rawCredits : 0;

  // Dropdown visibility states
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const modelBtnRef = useRef<HTMLButtonElement>(null);
  const createModeBtnRef = useRef<HTMLButtonElement>(null);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [modelFilter, setModelFilter] = useState<"all" | "image" | "video" | "audio">("all");
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
  const [showResolutionDropdown, setShowResolutionDropdown] = useState(false);
  const [showOutputFormatDropdown, setShowOutputFormatDropdown] = useState(false);
  const [showVideoDurationDropdown, setShowVideoDurationDropdown] = useState(false);
  const [showAudioDropdown, setShowAudioDropdown] = useState(false);
  const [showVeoQualityDropdown, setShowVeoQualityDropdown] = useState(false);
  const [showVeoModeDropdown, setShowVeoModeDropdown] = useState(false);
  const [cameraMotion, setCameraMotion] = useState("none");
  const [virtualCameraSettings, setVirtualCameraSettings] = useState<import("./VirtualCameraStyle").VirtualCameraSettings>({ camera: "default", lens: "none", focalLength: "none", aperture: "none" });
  const [cameraAngleSettings, setCameraAngleSettings] = useState<CameraAngleSettings>({ ...DEFAULT_ANGLE_SETTINGS });
  const [colorPaletteColors, setColorPaletteColors] = useState<ColorPaletteColors>({ colors: [] });
  const [speedRampCurve, setSpeedRampCurve] = useState<SpeedCurve>([2, 2, 2, 2, 2]);
  const [showPaletteFileBrowser, setShowPaletteFileBrowser] = useState(false);
  const [showCameraMotionDropdown, setShowCameraMotionDropdown] = useState(false);

  // Camera motion presets — appended to video prompt as natural language
  const cameraMotionOptions = [
    { value: "none", label: "No Motion", description: "" },
    { value: "static", label: "Static", description: "Static camera, locked position, no movement" },
    { value: "dolly-in", label: "Dolly In", description: "The camera smoothly dollies forward toward the subject" },
    { value: "dolly-out", label: "Dolly Out", description: "The camera smoothly dollies backward away from the subject" },
    { value: "crane-up", label: "Crane Up", description: "The camera rises vertically on a crane, revealing the scene from above" },
    { value: "crane-down", label: "Crane Down", description: "The camera descends vertically on a crane, dropping into the scene" },
    { value: "pan-left", label: "Pan Left", description: "The camera pans smoothly to the left" },
    { value: "pan-right", label: "Pan Right", description: "The camera pans smoothly to the right" },
    { value: "tilt-up", label: "Tilt Up", description: "The camera tilts upward" },
    { value: "tilt-down", label: "Tilt Down", description: "The camera tilts downward" },
    { value: "orbit", label: "Orbit", description: "The camera orbits slowly around the subject in a circular motion" },
    { value: "tracking", label: "Tracking", description: "The camera tracks alongside the moving subject" },
    { value: "handheld", label: "Handheld", description: "Handheld camera with natural subtle shake, documentary style" },
    { value: "zoom-in", label: "Zoom In", description: "The camera zooms in toward the subject" },
    { value: "zoom-out", label: "Zoom Out", description: "The camera zooms out from the subject" },
  ];

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
        (targetElement as HTMLCanvasElement).toBlob((blob) => {
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
  const showToast = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    // Simple console.log for now - can be replaced with actual toast library
    console.log(`[${type.toUpperCase()}] ${message}`);
  };

  // Unified handler for R2 and element library image selection
  const handleImageSelect = async (
    source: 'r2' | 'element',
    data: {
      url: string;
      name?: string;
      source?: string;
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
    // Use the primary identity sheet if available, otherwise fall back to all referenceUrls
    const primaryIdx = element?.primaryIndex ?? 0;
    const primaryUrl = referenceUrls[primaryIdx];
    const urlsToUse = primaryUrl ? [primaryUrl] : referenceUrls;

    urlsToUse.forEach(url => {
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

  // Convert @ElementName placeholders → badges whenever the active shot or elements change.
  // Two-pass: parseMentions handles inline @mentions (new storyboards); the fallback
  // inserts badges at the end for linked elements with no matching @mention in the text
  // (old storyboards built before inline injection was added).
  const lastParsedShotId = useRef<string | null>(null);
  useEffect(() => {
    if (!activeShotId || !projectElements?.length) return;
    if (lastParsedShotId.current === activeShotId) return; // Already processed this shot

    const el = editorRef.current;
    if (!el) return;

    const run = () => {
      // Pass 1 — convert any @ElementName text nodes to badge DOM elements
      parseMentions(projectElements);

      // Pass 2 — for linked elements that still have no badge in the editor, append at end
      if (activeShotLinkedElements?.length) {
        const existingIds = new Set(
          Array.from(el.querySelectorAll("[data-element-id]")).map(
            n => (n as HTMLElement).dataset.elementId
          )
        );
        let badgeNum = el.querySelectorAll('[data-type="mention"]').length + 1;
        for (const link of activeShotLinkedElements) {
          if (existingIds.has(link.id)) continue;
          const elData = projectElements.find((e: any) => e._id === link.id);
          if (!elData) continue;
          const imgUrl =
            elData.referenceUrls?.[elData.primaryIndex ?? 0] ||
            elData.referenceUrls?.[0] ||
            elData.thumbnailUrl || "";
          insertBadgeAtCaret({
            id: `el-${link.id}-${Date.now()}`,
            imageUrl: imgUrl,
            imageNumber: badgeNum++,
            badgeType: "element",
            elementName: link.name.replace(/\s+/g, ""),
            elementId: link.id,
          });
        }
      }

      lastParsedShotId.current = activeShotId;
    };

    // Brief delay to let the editor DOM settle after the initial text is set
    const t = setTimeout(run, 120);
    return () => clearTimeout(t);
  }, [activeShotId, projectElements, activeShotLinkedElements]);

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
      setGrokMode("normal");
      setNsfwChecker(true);
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
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  // ── AI Analyze: user-selected media type + URL ─────────────────────────
  const handleAnalyze = async () => {
    if (isAnalyzing) return;

    const mediaType = analyzeType;
    const mediaUrl = analyzeMediaUrl;

    if (!mediaUrl) {
      toast.error(`No ${mediaType} to analyze. Upload or paste a URL first.`);
      return;
    }

    // Credit cost: image=1, video=3, audio=1
    const creditCost = mediaType === "video" ? 3 : 1;
    const currentCredits = typeof getBalance === "number" ? getBalance : 0;
    if (currentCredits < creditCost) {
      toast.error(`Insufficient credits. Need ${creditCost} but you have ${currentCredits}.`);
      return;
    }

    const modelName = mediaType === "image" ? "ImageAnalyzer" : mediaType === "video" ? "VideoAnalyzer" : "AudioAnalyzer";

    setIsAnalyzing(true);
    try {
      // Deduct credits first
      await deductCredits({
        companyId,
        tokens: creditCost,
        reason: `AI Analyze ${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)}`,
      });

      const response = await fetch("/api/ai-analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaType, mediaUrl }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || `Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const result = data.result;

      if (!result) {
        throw new Error("No result from AI analysis");
      }

      // Create file record with completed result
      await logUpload({
        companyId,
        userId: user?.id || "",
        projectId: projectId || undefined,
        filename: `${modelName} — ${new Date().toLocaleString()}`,
        fileType: "analysis",
        mimeType: "text/plain",
        size: result.length,
        category: "generated",
        tags: ["analysis", mediaType],
        uploadedBy: user?.id || "",
        status: "completed",
        creditsUsed: creditCost,
        model: modelName,
        prompt: result,
        categoryId: activeShotId ? activeShotId as any : undefined,
        metadata: { analysisType: mediaType, sourceUrl: mediaUrl },
      });

      // Store result — user can click "Use as Prompt" to load it
      setAnalyzeResult(result);

      toast.success(`${mediaType.charAt(0).toUpperCase() + mediaType.slice(1)} analyzed (${creditCost} credit${creditCost > 1 ? 's' : ''})`);
    } catch (error: any) {
      console.error("[AI Analyze] Error:", error);
      toast.error(error.message || "Analysis failed");
      // Refund on failure
      try {
        await refundCredits({
          companyId,
          tokens: creditCost,
          reason: `AI Analyze ${mediaType} — refund (failed)`,
        });
      } catch { /* best effort refund */ }
    } finally {
      setIsAnalyzing(false);
    }
  };

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

    // Step 1: Check if user has sufficient credits (multiply by gridSize for grid generation)
    const totalCreditsNeeded = displayedCredits * gridSize;
    const currentCredits = getBalance ?? 0;
    if (currentCredits < totalCreditsNeeded) {
      toast.error(`Insufficient credits. Need ${totalCreditsNeeded} credits (${displayedCredits} x ${gridSize}), but you only have ${currentCredits}.`);
      return;
    }

    console.log("Step 1: Credits check passed, gridSize:", gridSize, "totalCredits:", totalCreditsNeeded);
    
    try {
      // Note: Placeholder record creation and credit deduction are handled downstream
      // by triggerImageGeneration (for image models) or SceneEditor (for Seedance/Veo).
      // VideoImageAIPanel only does the balance check and passes parameters to onGenerate.

      if (onGenerate) {
        const isSeedance2 = selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast";
        const qualityParam = (outputMode === "video" || outputMode === "audio" || selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2")
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
            ? JSON.stringify({ type: 'music', instrumental: musicInstrumental, style: musicStyle, model: musicModel, vocalGender: musicInstrumental ? undefined : musicVocalGender, personaId: selectedPersonaId || undefined, customMode: coverCustomMode, title: musicTitle || undefined, negativeTags: musicNegativeTags || undefined, styleWeight: coverStyleWeight, weirdnessConstraint: coverWeirdnessConstraint, audioWeight: coverAudioWeight })
            : selectedModelOption.value === "ai-music-api/upload-cover"
            ? JSON.stringify({ type: 'cover', instrumental: musicInstrumental, style: musicStyle, model: musicModel, vocalGender: musicInstrumental ? undefined : musicVocalGender, personaId: selectedPersonaId || undefined, customMode: coverCustomMode, title: musicTitle || undefined, negativeTags: musicNegativeTags || undefined, styleWeight: coverStyleWeight, weirdnessConstraint: coverWeirdnessConstraint, audioWeight: coverAudioWeight })
            : selectedModelOption.value === "ai-music-api/extend"
            ? JSON.stringify({ type: 'extend', continueAt: musicExtendContinueAt, model: musicModel, personaId: selectedPersonaId || undefined, customMode: coverCustomMode, style: musicStyle || undefined, title: musicTitle || undefined, vocalGender: musicInstrumental ? undefined : musicVocalGender, negativeTags: musicNegativeTags || undefined, styleWeight: coverStyleWeight, weirdnessConstraint: coverWeirdnessConstraint, audioWeight: coverAudioWeight })
            : selectedModelOption.value === "ai-music-api/generate-persona"
            ? `persona_free`
            : selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2"
            ? JSON.stringify({ type: 'tts', voice: ttsVoice, stability: ttsStability, similarityBoost: ttsSimilarityBoost, style: ttsStyle, speed: ttsSpeed, languageCode: ttsLanguageCode || undefined, previousText: ttsPreviousText || undefined, nextText: ttsNextText || undefined })
            : selectedModelOption.value === "grok-imagine/image-to-video"
            ? `${resolution}_${videoDuration}_${grokMode}_${nsfwChecker ? 'nsfw' : 'nonsfw'}`
            : `${resolution}_${videoDuration}_${audioEnabled ? 'audio' : 'noaudio'}`
          : selectedModelOption.value === "gpt-image-2-image-to-image"
          ? JSON.stringify({ type: 'gpt-image-2', mode: gptImage2Mode, nsfwChecker: gptImage2Nsfw, resolution })
          : resolution;

        // Pass resolution separately for GPT Image 2
        const resolutionParam = selectedModelOption.value === "gpt-image-2-image-to-image" ? resolution : undefined;
        
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
        const isCoverSong = selectedModelOption.value === "ai-music-api/upload-cover";
        const isExtendMusic = selectedModelOption.value === "ai-music-api/extend";
        const audioUrlsParam = (isSeedance2 && (seedanceMode === "multimodal" || seedanceMode === "ugc" || seedanceMode === "showcase" || seedanceMode === "lipsync")) || isInfinitalk || isCoverSong ? audioRefs.map(a => a.url)
          : isExtendMusic && musicExtendAudioId ? [musicExtendAudioId] // Pass audioId as first element for extend
          : undefined;
        // Lipsync sends as multimodal (first_frame_url + audio is invalid — they're mutually exclusive)
        // Character image goes into referenceImages, audio into audioUrls
        const seedanceModeParam = isSeedance2 ? (seedanceMode === "lipsync" ? "multimodal" : seedanceMode) : undefined;
        const firstFrameParam = isSeedance2 && (seedanceMode === "first-frame" || seedanceMode === "first-last-frame") ? firstFrameUrl || undefined : undefined;
        const lastFrameParam = isSeedance2 && seedanceMode === "first-last-frame" ? lastFrameUrl || undefined : undefined;

        // For Seedance 2.0, pass generateAudio state — lipsync always enables audio
        const audioParam = isSeedance2 ? (seedanceMode === "lipsync" ? true : generateAudio) : audioEnabled;

        // Auto-prepend project style + format + color palette to prompt
        let finalPrompt = extractedPrompt;
        {
          const parts: string[] = [];
          if (projectData?.stylePrompt) parts.push(projectData.stylePrompt);
          if (projectData?.formatPreset && FORMAT_PROMPT_MAP[projectData.formatPreset]) {
            parts.push(FORMAT_PROMPT_MAP[projectData.formatPreset]);
          }
          if (colorPaletteColors.colors.length > 0) {
            parts.push(buildColorPalettePromptText(colorPaletteColors));
          } else if (projectData?.colorPalette?.colors?.length) {
            const colorNames = projectData.colorPalette.colors.map((c: string) => c.toUpperCase()).join(', ');
            parts.push(`Color graded with dominant palette: ${colorNames}.`);
          }
          // Speed ramp (video only)
          const speedRampText = buildSpeedRampPromptText(speedRampCurve);
          if (speedRampText) parts.push(speedRampText);

          if (parts.length > 0) {
            finalPrompt = parts.join(' ') + ' ' + finalPrompt;
          }
        }

        // Resolve @ElementName badges → @Image{N}
        // Reference images are auto-attached by SceneEditor from linkedElements.
        // Here we convert @LeadPilot → @Image{N} and inject context for custom elements.
        {
          const elementBadges = Array.from(editorRef.current?.querySelectorAll('[data-element-name]') || []);
          if (elementBadges.length > 0) {
            const customContextParts: string[] = [];
            let nextIdx = (referenceImages?.length || 0) + 1;
            for (const badge of elementBadges) {
              const elName = (badge as HTMLElement).dataset.elementName || "";
              const elId = (badge as HTMLElement).dataset.elementId || "";
              const mentionText = `@${elName.replace(/\s+/g, "")}`;
              if (finalPrompt.includes(mentionText)) {
                finalPrompt = finalPrompt.replace(mentionText, `@Image${nextIdx}`);
                console.log(`[VideoImageAIPanel] ${mentionText} → @Image${nextIdx}`);
                // For custom element types (logo/style/other), inject prompt context
                const el = projectElements?.find((e: any) => e._id === elId);
                if (el && ["logo", "style", "other"].includes(el.type)) {
                  const context = composeCustomElementPrompt(el.type, el.name, el.description);
                  if (context) customContextParts.push(context);
                }
                nextIdx++;
              }
            }
            // Append custom element context to prompt
            if (customContextParts.length > 0) {
              finalPrompt = finalPrompt.trimEnd() + ". " + customContextParts.join(". ");
            }
          }
        }

        // UGC/Showcase mode: convert custom badges to @Image(n) and merge images
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

        // Append virtual camera style to prompt
        const cameraStyleText = buildCameraPromptText(virtualCameraSettings);
        if (cameraStyleText) {
          finalPrompt = finalPrompt.trimEnd() + '. ' + cameraStyleText;
        }

        // Append 3D camera angle to prompt
        const angleText = buildAnglePromptText(cameraAngleSettings);
        if (angleText) {
          finalPrompt = finalPrompt.trimEnd() + '. ' + angleText;
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
        // Grid generation: call onGenerate multiple times for gridSize > 1
        const genCount = (outputMode === "image" && gridSize > 1) ? gridSize : 1;
        for (let i = 0; i < genCount; i++) {
          if (i > 0) await new Promise(r => setTimeout(r, 500)); // small delay between calls
          const cinemaMetadata = buildCinemaStudioMetadata(virtualCameraSettings, {
            model: selectedModelOption.value,
            quality: qualityParam,
            aspectRatio,
            prompt: finalPrompt,
            cameraMotion: cameraMotion !== "none" ? cameraMotion : undefined,
          });
          onGenerate(displayedCredits, qualityParam, aspectRatio, videoDuration, audioParam, finalPrompt, veoQualityParam, veoModeParam, klingOrientParam, klingSourceParam, videoUrlsParam, audioUrlsParam, seedanceModeParam, firstFrameParam, lastFrameParam, mergedUrls, cinemaMetadata);
        }
        if (genCount > 1) {
          toast.success(`${genCount} images generating (${genCount} x ${displayedCredits} = ${genCount * displayedCredits} credits)`);
        }
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
    <div className="absolute bottom-0 left-0 right-0 mx-[20px] mb-[20px] flex flex-col gap-0">
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

        {/* Create Persona — song selector */}
        {selectedModelOption.value === "ai-music-api/generate-persona" && (
          <div className="mb-[0px]">
            <div className="px-0 py-0">
              <div className="flex items-start gap-2.5">
                {personaSourceSong ? (
                  <div className="relative group flex-shrink-0">
                    <div className="w-16 h-16 rounded-md border border-purple-500/30 bg-[#1a1a24] flex flex-col items-center justify-center cursor-pointer"
                      onClick={() => setMediaPreview({ type: 'audio', url: personaSourceSong.sourceUrl, label: personaSourceSong.name, fileId: personaSourceSong.fileId })}
                    >
                      <Mic className="w-5 h-5 text-purple-400" />
                      <span className="text-[9px] text-purple-300 mt-0.5 truncate max-w-[56px]">{personaSourceSong.name}</span>
                    </div>
                    <button onClick={() => setPersonaSourceSong(null)}
                      className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20">
                      <X className="w-2 h-2 text-white" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowExtendAudioDropdown(!showExtendAudioDropdown)}
                      className="w-16 h-16 rounded-md border border-dashed border-purple-800/50 hover:border-purple-700/70 flex flex-col items-center justify-center gap-0.5 group transition-colors bg-purple-900/10"
                      title="Select a generated song"
                    >
                      <Music className="w-4 h-4 text-purple-600 group-hover:text-purple-400" />
                      <span className="text-[9px] text-purple-600 group-hover:text-purple-400">Song</span>
                    </button>
                    {showExtendAudioDropdown && (
                      <div className="absolute bottom-full left-0 mb-1 w-[280px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50 py-1 max-h-56 overflow-y-auto">
                        <audio ref={extendPreviewAudioRef} style={{ display: "none" }} preload="none" onEnded={() => setExtendPreviewPlaying(null)} />
                        {audioFiles && audioFiles.length > 0 ? (
                          audioFiles.map((af) => (
                            <div key={af.audioId} className={`flex items-center gap-2 px-2 py-1.5 transition-colors ${af.personaCreated ? 'opacity-50' : 'hover:bg-[#1E1E24]'}`}>
                              <button onClick={(e) => { e.stopPropagation(); const audio = extendPreviewAudioRef.current; if (!audio || !af.sourceUrl) return; if (extendPreviewPlaying === af.audioId) { audio.pause(); setExtendPreviewPlaying(null); } else { audio.src = af.sourceUrl; audio.play().catch(() => {}); setExtendPreviewPlaying(af.audioId); } }}
                                className="w-6 h-6 rounded-full bg-purple-500/20 hover:bg-purple-500/40 flex items-center justify-center flex-shrink-0 transition">
                                {extendPreviewPlaying === af.audioId ? <Pause className="w-3 h-3 text-purple-400" /> : <Play className="w-3 h-3 text-purple-400 ml-0.5" />}
                              </button>
                              <button onClick={() => {
                                if (af.personaCreated) { toast.warning("This audio already has a persona created"); return; }
                                if (!af.sourceUrl || !af.taskId) return;
                                setPersonaSourceSong({ audioId: af.audioId, taskId: af.taskId, sourceUrl: af.sourceUrl, name: af.name, fileId: String(af._id) });
                                if (extendPreviewAudioRef.current) { extendPreviewAudioRef.current.pause(); setExtendPreviewPlaying(null); }
                                setShowExtendAudioDropdown(false);
                              }} className={`flex-1 text-left text-[12px] truncate ${af.personaCreated ? 'text-gray-500' : 'text-[#EAEAEA]'}`}>
                                {af.name}
                                {af.personaCreated && <span className="text-[9px] text-amber-500 ml-1">✓ Persona</span>}
                              </button>
                              {af.sourceUrl && (
                                <button onClick={(e) => { e.stopPropagation(); if (extendPreviewAudioRef.current) { extendPreviewAudioRef.current.pause(); setExtendPreviewPlaying(null); } setMediaPreview({ type: 'audio', url: af.sourceUrl!, label: af.name, prompt: af.prompt, fileId: String(af._id) }); }}
                                  className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 flex-shrink-0 transition" title="Open full player">
                                  <Maximize2 className="w-3 h-3" />
                                </button>
                              )}
                              {af.duration && <span className="text-[10px] text-gray-600 flex-shrink-0">{Math.round(af.duration)}s</span>}
                            </div>
                          ))
                        ) : (
                          <div className="px-3 py-2 text-[11px] text-gray-600">No completed songs — generate music first</div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <div className="self-center">
                  <span className="text-[11px] text-gray-500">Select a generated song to extract voice from</span>
                  <br /><span className="text-[10px] text-gray-600">The persona captures the singing voice for reuse</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ElevenLabs TTS — character count + info & usage guide */}
        {selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2" && (
          <div className="mb-[0px] px-[10px] pt-[6px] pb-0 space-y-1.5">
            {/* Character count & flat cost */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Mic className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-[11px] text-gray-400">
                  <span className={`font-medium ${currentPrompt.length > 5000 ? 'text-red-400' : currentPrompt.length > 0 ? 'text-[#EAEAEA]' : 'text-gray-600'}`}>{currentPrompt.length.toLocaleString()}</span>
                  <span className="text-gray-600"> / 5,000 chars</span>
                </span>
              </div>
              <div className="text-[11px] text-gray-500">
                <span className="text-blue-400 font-medium">{displayedCredits}</span> credits
                <span className="text-gray-600 ml-1">(12 cr / 1K block)</span>
              </div>
            </div>
            {currentPrompt.length > 5000 && (
              <div className="text-[10px] text-red-400">Text exceeds 5,000 character limit. Please shorten your text.</div>
            )}
            <details className="group">
              <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-blue-400 hover:text-blue-300 transition-colors">
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M12 16v-4m0-4h.01"/></svg>
                <span>How to use ElevenLabs TTS — click for guide</span>
              </summary>
              <div className="mt-2 p-3 bg-[#141418] border border-[#2A2A32] rounded-lg text-[11px] text-gray-400 leading-relaxed space-y-3">

                {/* Quick Start */}
                <div>
                  <p className="text-[#EAEAEA] font-medium mb-1">Convert text to natural speech:</p>
                  <div className="bg-[#0A0A0F] rounded-md px-3 py-2 text-[11px] space-y-0.5">
                    <p><span className="text-blue-400">1.</span> Type or paste your text in the prompt area below (max 5,000 characters)</p>
                    <p><span className="text-blue-400">2.</span> Click <span className="text-blue-400">Advanced</span> to choose a voice and preview it before selecting</p>
                    <p><span className="text-blue-400">3.</span> Adjust voice settings (stability, speed, etc.) if needed</p>
                    <p><span className="text-blue-400">4.</span> Click <span className="text-green-400">Generate</span> — audio will appear when ready</p>
                  </div>
                </div>

                {/* Example prompts */}
                <div>
                  <p className="text-[#EAEAEA] font-medium mb-1">Example prompts:</p>
                  <div className="space-y-1 text-gray-500 italic">
                    <p>"Welcome to our product demo. Today we'll walk you through the key features that make our platform stand out."</p>
                    <p>"In a world where technology meets creativity, the possibilities are truly endless."</p>
                  </div>
                </div>

                {/* Tips & Settings — collapsible */}
                <details className="group/more">
                  <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-300 transition">
                    See more — tips & settings
                  </summary>
                  <div className="mt-2 space-y-3 text-[10px]">

                    {/* Voice settings */}
                    <div>
                      <p className="text-[#EAEAEA] font-medium mb-1">Voice settings:</p>
                      <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1">
                        <span className="text-blue-400 font-medium">Stability</span>
                        <span>Lower = more expressive/varied. Higher = more consistent/monotone.</span>

                        <span className="text-purple-400 font-medium">Similarity</span>
                        <span>Higher = closer to original voice. Lower = more creative interpretation.</span>

                        <span className="text-amber-400 font-medium">Style</span>
                        <span>Amplifies the voice's unique style. Keep at <span className="text-white">0</span> for neutral delivery.</span>

                        <span className="text-teal-400 font-medium">Speed</span>
                        <span><span className="text-white">0.7x</span> slow narration, <span className="text-white">1.0</span> normal, <span className="text-white">1.2x</span> fast-paced.</span>

                        <span className="text-gray-300 font-medium">Language</span>
                        <span>ISO 639-1 code (e.g. <span className="text-white">en</span>, <span className="text-white">es</span>, <span className="text-white">zh</span>). Only for Turbo/Flash models.</span>
                      </div>
                    </div>

                    {/* Previous / Next text */}
                    <div>
                      <p className="text-[#EAEAEA] font-medium mb-1">Previous / Next text (multi-part speech):</p>
                      <div className="space-y-1 text-gray-400">
                        <p>Use these when generating speech in <span className="text-white">multiple parts</span>. They help the AI maintain natural flow between segments.</p>
                      </div>
                      <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1 mt-1">
                        <span className="text-blue-400 font-medium">Previous</span>
                        <span>Paste the text from your <span className="text-white">last</span> generation so the new audio continues smoothly.</span>

                        <span className="text-blue-400 font-medium">Next</span>
                        <span>Paste the text you plan to generate <span className="text-white">next</span> so the current audio leads into it naturally.</span>
                      </div>
                      <div className="bg-[#0A0A0F] rounded-md px-3 py-2 mt-2 text-gray-500 italic">
                        Example: Generating a 3-part narration? When generating part 2, paste part 1 as "Previous" and part 3 as "Next" for seamless transitions.
                      </div>
                    </div>

                  </div>
                </details>

              </div>
            </details>
          </div>
        )}

        {/* Cover Song — audio upload area */}
        {selectedModelOption.value === "ai-music-api/upload-cover" && (
          <div className="mb-[0px]">
            <div className="px-0 py-0">
              <div className="flex items-start gap-2.5">
                {/* Audio Slot */}
                <div className="relative flex-shrink-0">
                  {audioRefs.length > 0 ? (
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-md border border-amber-500/30 bg-[#1a1a24] flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'audio', url: audioRefs[0].url, label: 'Cover Audio' })}
                      >
                        <Music className="w-5 h-5 text-amber-400" />
                        {audioRefs[0].duration > 0 && (
                          <span className="text-[10px] text-amber-300 mt-0.5">{audioRefs[0].duration}s</span>
                        )}
                      </div>
                      <div className="absolute top-1 left-1 bg-amber-600 text-white text-[7px] px-1 py-0.5 rounded-full z-20 font-medium">Audio</div>
                      <button
                        onClick={() => setAudioRefs([])}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setShowAudioBrowser(true)}
                        className="w-16 h-16 rounded-md border border-dashed border-amber-800/50 hover:border-amber-700/70 flex flex-col items-center justify-center gap-0.5 group transition-colors bg-amber-900/10"
                        title="Browse files to upload"
                      >
                        <Music className="w-4 h-4 text-amber-600 group-hover:text-amber-400" />
                        <span className="text-[9px] text-amber-600 group-hover:text-amber-400">Browse</span>
                      </button>
                      {/* Pick from generated songs */}
                      <div className="relative">
                        <button
                          onClick={() => setShowExtendAudioDropdown(!showExtendAudioDropdown)}
                          className="w-16 h-16 rounded-md border border-dashed border-purple-800/50 hover:border-purple-700/70 flex flex-col items-center justify-center gap-0.5 group transition-colors bg-purple-900/10"
                          title="Pick from generated songs"
                        >
                          <Music className="w-4 h-4 text-purple-600 group-hover:text-purple-400" />
                          <span className="text-[9px] text-purple-600 group-hover:text-purple-400">Songs</span>
                        </button>
                        {showExtendAudioDropdown && (
                          <div className="absolute top-full left-0 mt-1 w-[260px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50 py-1 max-h-48 overflow-y-auto">
                            <audio ref={extendPreviewAudioRef} style={{ display: "none" }} preload="none" onEnded={() => setExtendPreviewPlaying(null)} />
                            {audioFiles && audioFiles.length > 0 ? (
                              audioFiles.map((af) => (
                                <div key={af.audioId} className="flex items-center gap-2 px-2 py-1.5 hover:bg-[#1E1E24] transition-colors">
                                  <button onClick={(e) => { e.stopPropagation(); const audio = extendPreviewAudioRef.current; if (!audio || !af.sourceUrl) return; if (extendPreviewPlaying === af.audioId) { audio.pause(); setExtendPreviewPlaying(null); } else { audio.src = af.sourceUrl; audio.play().catch(() => {}); setExtendPreviewPlaying(af.audioId); } }}
                                    className="w-6 h-6 rounded-full bg-purple-500/20 hover:bg-purple-500/40 flex items-center justify-center flex-shrink-0 transition">
                                    {extendPreviewPlaying === af.audioId ? <Pause className="w-3 h-3 text-purple-400" /> : <Play className="w-3 h-3 text-purple-400 ml-0.5" />}
                                  </button>
                                  <button onClick={async () => {
                                    if (!af.sourceUrl) return;
                                    const dur = af.duration || await new Promise<number>(r => { const a = new Audio(af.sourceUrl!); a.onloadedmetadata = () => r(a.duration); a.onerror = () => r(0); setTimeout(() => r(0), 3000); });
                                    setAudioRefs([{ url: af.sourceUrl, duration: Math.round(dur) }]);
                                    if (extendPreviewAudioRef.current) { extendPreviewAudioRef.current.pause(); setExtendPreviewPlaying(null); }
                                    setShowExtendAudioDropdown(false);
                                  }} className="flex-1 text-left text-[12px] text-[#EAEAEA] truncate">
                                    {af.name}
                                    {af.personaCreated && <span className="text-[9px] text-amber-500 ml-1">✓ Persona</span>}
                                  </button>
                                  {af.sourceUrl && (
                                    <button onClick={(e) => { e.stopPropagation(); if (extendPreviewAudioRef.current) { extendPreviewAudioRef.current.pause(); setExtendPreviewPlaying(null); } setMediaPreview({ type: 'audio', url: af.sourceUrl!, label: af.name, prompt: af.prompt, fileId: String(af._id) }); }}
                                      className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 flex-shrink-0 transition" title="Open full player">
                                      <Maximize2 className="w-3 h-3" />
                                    </button>
                                  )}
                                  {af.duration && <span className="text-[10px] text-gray-600 flex-shrink-0">{Math.round(af.duration)}s</span>}
                                </div>
                              ))
                            ) : (
                              <div className="px-3 py-2 text-[11px] text-gray-600">No completed songs in this shot</div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <span className="text-[11px] text-gray-500 self-center">Upload audio or pick from generated songs<br /><span className="text-gray-600">MP3, WAV, OGG, M4A, FLAC, AAC (Max 200MB)</span></span>
              </div>
            </div>
          </div>
        )}

        {/* ── ANALYZE MODE: media input using AddImageMenu ──────────── */}
        {outputMode === "analyze" && (
          <div className="mb-[0px]">
            <div className="px-0 py-0">
              <div className="flex items-start gap-2.5">
                <div className="flex-shrink-0 flex items-center gap-1.5">
                  {/* Preview of selected media — reuses existing video/audio preview patterns */}
                  {analyzeMediaUrl && analyzeType === "image" && (
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-md border border-amber-500/30 bg-[#1a1a24] overflow-hidden">
                        <img src={analyzeMediaUrl} alt="Analyze" className="w-full h-full object-cover" />
                      </div>
                      <button
                        onClick={() => { setAnalyzeMediaUrl(""); setAnalyzeResult(""); }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    </div>
                  )}
                  {analyzeMediaUrl && analyzeType === "video" && (
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-md border border-green-500/30 bg-[#1a1a24] overflow-hidden cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'video', url: analyzeMediaUrl, label: 'Analyze Video' })}
                      >
                        <video src={analyzeMediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-black border-y-[5px] border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-1.5 -left-1 bg-green-800 text-green-200 text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium pointer-events-none">Video</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAnalyzeMediaUrl(""); setAnalyzeResult(""); }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    </div>
                  )}
                  {analyzeMediaUrl && analyzeType === "audio" && (
                    <div className="relative group">
                      <div className="w-16 h-16 rounded-md border border-purple-500/30 bg-[#1a1a24] flex flex-col items-center justify-center cursor-pointer"
                        onClick={() => setMediaPreview({ type: 'audio', url: analyzeMediaUrl, label: 'Analyze Audio' })}
                      >
                        <Volume2 className="w-5 h-5 text-purple-400" />
                        <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity rounded-md">
                          <div className="w-6 h-6 rounded-full bg-white/90 flex items-center justify-center">
                            <div className="w-0 h-0 border-l-[8px] border-l-purple-600 border-y-[5px] border-y-transparent ml-0.5" />
                          </div>
                        </div>
                      </div>
                      <div className="absolute -top-1.5 -left-1 bg-purple-800 text-purple-200 text-[8px] px-1.5 py-0.5 rounded-full z-20 font-medium pointer-events-none">Audio</div>
                      <button
                        onClick={(e) => { e.stopPropagation(); setAnalyzeMediaUrl(""); setAnalyzeResult(""); }}
                        className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-20"
                      >
                        <X className="w-2 h-2 text-white" />
                      </button>
                    </div>
                  )}

                  {/* Add media — reuse AddImageMenu for images, direct browse for video/audio */}
                  {!analyzeMediaUrl && analyzeType === "image" && (
                    <AddImageMenu
                      label="Add Image"
                      onUploadClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = 'image/*';
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append('file', file, file.name);
                            formData.append('category', 'temps');
                            const res = await fetch('/api/storyboard/upload', { method: 'POST', body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setAnalyzeMediaUrl(data.publicUrl);
                              setAnalyzeResult("");
                            } else { toast.error("Upload failed"); }
                          } catch { toast.error("Upload failed"); }
                        };
                        input.click();
                      }}
                      onR2Click={() => setShowAnalyzeBrowser(true)}
                      canOpenR2={canOpenFileBrowser()}
                      onR2Unavailable={() => showToast('Project info required', 'error')}
                      onElementsClick={() => setShowElementLibrary(true)}
                      canOpenElements={canOpenElementLibrary()}
                      onElementsUnavailable={() => showToast('Project info required', 'error')}
                      onCaptureClick={backgroundImage ? () => {
                        setAnalyzeMediaUrl(backgroundImage);
                        setAnalyzeResult("");
                      } : undefined}
                      generatedItemImages={generatedItemImages}
                      generatedProjectImages={generatedProjectImages}
                      onSelectGeneratedImage={(url) => { setAnalyzeMediaUrl(url); setAnalyzeResult(""); }}
                    />
                  )}
                  {!analyzeMediaUrl && (analyzeType === "video" || analyzeType === "audio") && (
                    <AddImageMenu
                      mediaType={analyzeType}
                      onUploadClick={() => {
                        const input = document.createElement('input');
                        input.type = 'file';
                        input.accept = analyzeType === "video" ? 'video/mp4,video/webm' : 'audio/mpeg,audio/wav,audio/mp4,audio/ogg,.mp3,.wav,.m4a';
                        input.onchange = async (e: any) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          try {
                            const formData = new FormData();
                            formData.append('file', file, file.name);
                            formData.append('category', 'temps');
                            const res = await fetch('/api/storyboard/upload', { method: 'POST', body: formData });
                            if (res.ok) {
                              const data = await res.json();
                              setAnalyzeMediaUrl(data.publicUrl);
                              setAnalyzeResult("");
                            } else { toast.error("Upload failed"); }
                          } catch { toast.error("Upload failed"); }
                        };
                        input.click();
                      }}
                      onR2Click={() => setShowAnalyzeBrowser(true)}
                      canOpenR2={canOpenFileBrowser()}
                      onR2Unavailable={() => showToast('Project info required', 'error')}
                    />
                  )}
                </div>

                {/* Description text */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className="text-[11px] text-(--text-tertiary) leading-relaxed">
                    {analyzeMediaUrl
                      ? `Ready to analyze. Click Analyze to generate a prompt from this ${analyzeType}.`
                      : analyzeType === "image"
                        ? "Click to add reference images from computer, R2 storage, or element library"
                        : `Click to browse ${analyzeType} files from R2 storage`
                    }
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Reference Images thumbnails — only show when images exist, hidden when empty (compact Add Image in pill row handles adding) */}
        {outputMode !== "analyze" && selectedModelOption.value !== "z-image" && selectedModelOption.value !== "topaz/video-upscale" && selectedModelOption.value !== "infinitalk/from-audio" && selectedModelOption.value !== "ai-music-api/generate" && !selectedModelOption.value.startsWith("ai-music-api/") && selectedModelOption.value !== "elevenlabs/text-to-speech-multilingual-v2" && (referenceImages.length > 0 || seedanceMode === "lipsync" || seedanceMode === "ugc" || seedanceMode === "showcase" || seedanceMode === "first-frame" || seedanceMode === "first-last-frame") && (
        <div className={`mb-0 ${addImageMenuOpen ? "invisible" : ""}`}>
          <div className="px-0 py-0">
            <div className="flex items-center gap-2 overflow-x-auto">
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

                {/* Add Image button moved to compact pill row below — no duplicate here */}
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
              <p className="text-xs text-gray-500 mt-1">
                Add a character image and audio file for lip-sync.
              </p>
            )
          ) : seedanceMode === "ugc" ? (
            productImages.length === 0 && influencerImages.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Add product and influencer images.
              </p>
            )
          ) : seedanceMode === "showcase" ? (
            subjectImages.length === 0 && presenterImages.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Add presenter, subject, and scene images.
              </p>
            )
          ) : null}
        </div>
        )}

        {/* Add Image (left) + Genre / Format / Camera pill (center) — single row above main panel */}
        {outputMode !== "analyze" && selectedModelOption.value !== "topaz/video-upscale" && !selectedModelOption.value.startsWith("ai-music-api/") && projectData && (
          <div className="relative flex items-center justify-center mb-[3px] min-h-[32px]">
            {/* Inline Add Image — compact, pinned left */}
            {selectedModelOption.value !== "z-image" && selectedModelOption.value !== "infinitalk/from-audio" && !selectedModelOption.value.startsWith("ai-music-api/") && selectedModelOption.value !== "elevenlabs/text-to-speech-multilingual-v2" && maxReferenceImages > 0 && referenceImages.length < maxReferenceImages && (
              <div className="absolute left-0">
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
                compact
                onMenuToggle={setAddImageMenuOpen}
              />
              </div>
            )}
            {/* Settings pill bar — Genre / Format / Camera / Angle / Motion / Speed / Palette */}
            {(() => {
              const activeGenre = GENRE_PRESETS.find(s => s.id === projectData?.style);
              const activeFormat = FORMAT_PRESETS.find(f => f.id === projectData?.formatPreset);
              const camParts = [
                virtualCameraSettings.camera !== "default" ? CAMERA_OPTIONS.find(o => o.value === virtualCameraSettings.camera)?.label : null,
                virtualCameraSettings.lens !== "none" ? LENS_OPTIONS.find(o => o.value === virtualCameraSettings.lens)?.label : null,
                virtualCameraSettings.focalLength !== "none" ? virtualCameraSettings.focalLength + "mm" : null,
              ].filter(Boolean);
              const camLabel = camParts.length > 0 ? camParts.join(" · ") : "Auto";
              const isAngleDefault = cameraAngleSettings.rotation === 0 && cameraAngleSettings.tilt === 0 && cameraAngleSettings.zoom === 0;
              const isSpeedDefault = speedRampCurve.every(v => v === 2);
              const matchedSpeedPreset = !isSpeedDefault ? [{ name: "Slow-mo", curve: [0,0,1,0,0] }, { name: "Bullet Time", curve: [2,2,0,0,2] }, { name: "Flash In", curve: [4,3,2,2,2] }, { name: "Flash Out", curve: [2,2,2,3,4] }, { name: "Impact", curve: [2,3,0,1,2] }, { name: "Ramp Up", curve: [0,1,2,3,4] }, { name: "Ramp Down", curve: [4,3,2,1,0] }, { name: "Burst", curve: [1,1,4,4,1] }].find(p => p.curve.every((v, i) => v === speedRampCurve[i])) : null;
              const motionLabel = cameraMotionOptions.find(o => o.value === cameraMotion)?.label || "None";
              const speedLabel = matchedSpeedPreset?.name || (isSpeedDefault ? "Normal" : "Custom");
              const isVideoMode = outputMode === "video";
              const isImageOrVideo = outputMode === "image" || outputMode === "video";
              const showAdvancedPills = isImageOrVideo && !["topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/");

              // Build compact summary segments
              const summaryParts: string[] = [
                activeGenre?.label || "Auto",
                activeFormat?.label || "Auto",
              ];
              if (showAdvancedPills) {
                if (camLabel !== "Auto") summaryParts.push(camLabel);
                if (!isAngleDefault) summaryParts.push(`${cameraAngleSettings.rotation}°`);
              }
              if (isVideoMode && showAdvancedPills) {
                if (cameraMotion !== "none") summaryParts.push(motionLabel);
                if (!isSpeedDefault) summaryParts.push(speedLabel);
              }
              if (showAdvancedPills && colorPaletteColors.colors.length > 0) summaryParts.push("Palette");

              return pillBarExpanded ? (
                <div data-settings-pill className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-(--bg-secondary)/95 backdrop-blur-md border border-white/[0.06]">
                  {/* Genre — clickable, opens grid dialog */}
                  <button
                    onClick={() => { setShowPillGenre(!showPillGenre); setShowPillFormat(false); setShowPillMotion(false); }}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <img
                      src={activeGenre?.preview || "/storytica/element_forge/grids/genre/auto.png"}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <span className="text-[11px] text-gray-500">Genre:</span>
                    <span className="text-[11px] font-semibold text-white">{activeGenre?.label || "Auto"}</span>
                  </button>
                  <GenrePicker
                    open={showPillGenre}
                    onClose={() => setShowPillGenre(false)}
                    selected={projectData?.style}
                    onSelect={(id, prompt) => updateProjectMutation({ id: projectData._id, style: id, stylePrompt: prompt })}
                  />
                  <div className="w-px h-3 bg-white/10" />
                  {/* Format — clickable, opens grid dialog */}
                  <button
                    onClick={() => { setShowPillFormat(!showPillFormat); setShowPillGenre(false); setShowPillMotion(false); }}
                    className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                  >
                    <img
                      src={activeFormat?.preview || "/storytica/element_forge/grids/format/auto.png"}
                      alt=""
                      className="w-5 h-5 rounded-full object-cover ring-1 ring-white/10"
                    />
                    <span className="text-[11px] text-gray-500">Format:</span>
                    <span className="text-[11px] font-semibold text-white">{activeFormat?.label || "Auto"}</span>
                  </button>
                  <FormatPicker
                    open={showPillFormat}
                    onClose={() => setShowPillFormat(false)}
                    selected={projectData?.formatPreset}
                    onSelect={(id) => updateProjectMutation({ id: projectData._id, formatPreset: id })}
                  />
                  {/* Camera — visible in image + video modes */}
                  {showAdvancedPills && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <button
                        data-pill-camera
                        onClick={() => {
                          setShowPillGenre(false); setShowPillFormat(false); setShowPillMotion(false);
                          if (hasProFeatures) {
                            const trigger = document.querySelector('[data-camera-studio-trigger] button') as HTMLButtonElement;
                            trigger?.click();
                          } else {
                            toast.info("Upgrade to Pro to use Camera Studio");
                          }
                        }}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Camera className={`w-4 h-4 ${hasProFeatures && camLabel !== "Auto" ? "text-blue-400" : "text-gray-500"}`} />
                        <span className="text-[11px] text-gray-500">Camera:</span>
                        <span className={`text-[11px] font-semibold truncate max-w-[120px] ${hasProFeatures && camLabel !== "Auto" ? "text-blue-400" : "text-white"}`}>{hasProFeatures ? camLabel : <Lock className="w-3 h-3 inline text-gray-600" />}</span>
                      </button>
                    </>
                  )}
                  {/* Angle — visible in image + video modes */}
                  {showAdvancedPills && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <button
                        onClick={() => {
                          setShowPillGenre(false); setShowPillFormat(false); setShowPillMotion(false);
                          if (hasProFeatures) {
                            const trigger = document.querySelector('[data-angle-picker-trigger]') as HTMLButtonElement;
                            trigger?.click();
                          } else {
                            toast.info("Upgrade to Pro to use Camera Angle");
                          }
                        }}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Crosshair className={`w-4 h-4 ${hasProFeatures && !isAngleDefault ? "text-blue-400" : "text-gray-500"}`} />
                        <span className="text-[11px] text-gray-500">Angle:</span>
                        <span className={`text-[11px] font-semibold ${hasProFeatures && !isAngleDefault ? "text-blue-400" : "text-white"}`}>{hasProFeatures ? (isAngleDefault ? "Auto" : `${cameraAngleSettings.rotation}°`) : <Lock className="w-3 h-3 inline text-gray-600" />}</span>
                      </button>
                    </>
                  )}
                  {/* Motion — visible in video mode only */}
                  {isVideoMode && showAdvancedPills && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <div className="relative">
                        <button
                          onClick={() => { setShowPillMotion(!showPillMotion); setShowPillGenre(false); setShowPillFormat(false); }}
                          className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                          <Film className={`w-4 h-4 ${cameraMotion !== "none" ? "text-blue-400" : "text-gray-500"}`} />
                          <span className="text-[11px] text-gray-500">Motion:</span>
                          <span className={`text-[11px] font-semibold ${cameraMotion !== "none" ? "text-blue-400" : "text-white"}`}>{motionLabel}</span>
                        </button>
                        {showPillMotion && createPortal(
                          <div className="fixed inset-0 z-[9998]" onClick={() => setShowPillMotion(false)} />,
                          document.body
                        )}
                        {showPillMotion && (
                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-[170px] max-h-[300px] overflow-y-auto bg-(--bg-secondary) border border-white/10 rounded-xl shadow-2xl shadow-black/50 z-[9999] py-1.5">
                            {cameraMotionOptions.map((option) => (
                              <button
                                key={option.value}
                                onClick={() => {
                                  setCameraMotion(option.value);
                                  setShowPillMotion(false);
                                  const el = editorRef.current;
                                  if (el && option.description) {
                                    const hasContent = el.innerHTML && el.innerHTML !== '<br>';
                                    if (hasContent) {
                                      el.innerHTML = el.innerHTML + '<br>' + option.description;
                                    } else {
                                      el.textContent = option.description;
                                    }
                                    const plainText = el.innerText || '';
                                    setEditorIsEmpty(false);
                                    setCurrentPrompt(plainText);
                                    onUserPromptChange?.(plainText);
                                  }
                                }}
                                className={`w-full px-3 py-1.5 text-left text-[11px] transition-colors ${
                                  cameraMotion === option.value
                                    ? "bg-white/8 text-white"
                                    : "text-gray-400 hover:bg-white/5 hover:text-white"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                  {/* Speed — visible in video mode only */}
                  {isVideoMode && showAdvancedPills && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <button
                        onClick={() => {
                          setShowPillGenre(false); setShowPillFormat(false); setShowPillMotion(false);
                          if (hasProFeatures) {
                            const trigger = document.querySelector('[data-speed-ramp-trigger]') as HTMLButtonElement;
                            trigger?.click();
                          } else {
                            toast.info("Upgrade to Pro to use Speed Ramp");
                          }
                        }}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Timer className={`w-4 h-4 ${hasProFeatures && !isSpeedDefault ? "text-violet-400" : "text-gray-500"}`} />
                        <span className="text-[11px] text-gray-500">Speed:</span>
                        <span className={`text-[11px] font-semibold ${hasProFeatures && !isSpeedDefault ? "text-violet-400" : "text-white"}`}>{hasProFeatures ? speedLabel : <Lock className="w-3 h-3 inline text-gray-600" />}</span>
                      </button>
                    </>
                  )}
                  {/* Palette — visible in image + video modes */}
                  {showAdvancedPills && (
                    <>
                      <div className="w-px h-3 bg-white/10" />
                      <button
                        onClick={() => {
                          setShowPillGenre(false); setShowPillFormat(false); setShowPillMotion(false);
                          if (hasProFeatures) {
                            const trigger = document.querySelector('[data-palette-picker-trigger]') as HTMLButtonElement;
                            trigger?.click();
                          } else {
                            toast.info("Upgrade to Pro to use Color Palette");
                          }
                        }}
                        className="flex items-center gap-1.5 hover:opacity-80 transition-opacity cursor-pointer"
                      >
                        <Palette className={`w-4 h-4 ${hasProFeatures && colorPaletteColors.colors.length > 0 ? "text-rose-400" : "text-gray-500"}`} />
                        {hasProFeatures && colorPaletteColors.colors.length > 0 ? (
                          <div className="flex items-center gap-0.5">
                            {colorPaletteColors.colors.map((c, i) => (
                              <div key={i} className="w-2.5 h-2.5 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                            ))}
                          </div>
                        ) : (
                          <>
                            <span className="text-[11px] text-gray-500">Palette:</span>
                            <span className="text-[11px] font-semibold text-white">{hasProFeatures ? "Auto" : <Lock className="w-3 h-3 inline text-gray-600" />}</span>
                          </>
                        )}
                      </button>
                    </>
                  )}
                  {/* Collapse toggle */}
                  <div className="w-px h-3 bg-white/10" />
                  <button
                    onClick={() => setPillBarExpanded(false)}
                    className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
                    title="Collapse settings bar"
                  >
                    <ChevronDown className="w-3.5 h-3.5 text-gray-500" />
                  </button>
                </div>
              ) : (
                /* Collapsed state — compact summary */
                <button
                  data-settings-pill
                  onClick={() => setPillBarExpanded(true)}
                  className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-(--bg-secondary)/95 backdrop-blur-md border border-white/[0.06] hover:border-white/15 transition-colors cursor-pointer group"
                  title="Expand settings bar"
                >
                  <SlidersHorizontal className="w-3.5 h-3.5 text-gray-500 group-hover:text-gray-300 transition-colors" />
                  <span className="text-[11px] text-gray-400 group-hover:text-gray-200 transition-colors truncate max-w-[400px]">
                    {summaryParts.join(" · ")}
                  </span>
                  {colorPaletteColors.colors.length > 0 && hasProFeatures && (
                    <div className="flex items-center gap-0.5 ml-0.5">
                      {colorPaletteColors.colors.slice(0, 3).map((c, i) => (
                        <div key={i} className="w-2 h-2 rounded-full border border-white/20" style={{ backgroundColor: c }} />
                      ))}
                    </div>
                  )}
                </button>
              );
            })()}
          </div>
        )}

        {/* Main Panel */}
        <div data-main-panel className="bg-(--bg-secondary)/95 backdrop-blur-md rounded-2xl">
          {/* Cover Song quick guide */}
          {selectedModelOption.value === "ai-music-api/upload-cover" && (
            <div className="px-[10px] pt-[10px] pb-0">
              <details className="group">
                <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-amber-400 hover:text-amber-300 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M12 16v-4m0-4h.01"/></svg>
                  <span>How to use Cover Song — click for guide</span>
                </summary>
                <div className="mt-2 p-3 bg-[#141418] border border-[#2A2A32] rounded-lg text-[11px] text-gray-400 leading-relaxed space-y-3">

                  {/* Quick Start */}
                  <div>
                    <p className="text-[#EAEAEA] font-medium mb-1">Re-sing a full song with your Persona:</p>
                    <div className="bg-[#0A0A0F] rounded-md px-3 py-2 text-[11px] space-y-0.5">
                      <p><span className="text-green-400">1.</span> Upload your song (Browse or pick from Songs)</p>
                      <p><span className="text-green-400">2.</span> Set <span className="text-blue-400">Custom ON</span></p>
                      <p><span className="text-green-400">3.</span> Set <span className="text-orange-400">Instrumental OFF</span> (Vocals)</p>
                      <p><span className="text-green-400">4.</span> Open <span className="text-gray-300">Advanced</span> → select your <span className="text-purple-400">Persona</span> → click <span className="text-purple-400">Strong Persona</span></p>
                      <p><span className="text-green-400">5.</span> Set Model to <span className="text-amber-400">V4.5+</span> or higher (supports up to 8 min, generates full song)</p>
                      <p><span className="text-green-400">6.</span> Write lyrics in prompt</p>
                      <p><span className="text-green-400">7.</span> Click Generate</p>
                    </div>
                    <div className="mt-2 bg-amber-500/10 border border-amber-500/20 rounded-md px-3 py-2 text-[10px] text-amber-400">
                      <p className="font-medium">Important tips:</p>
                      <p>• Use <span className="text-white">V4.5+, V4.5 ALL, V5, or V5.5</span> model for full-length songs (up to 8 min). V4 only generates up to 4 min and may produce partial songs.</p>
                      <p>• Click <span className="text-purple-400">Strong Persona</span> to auto-apply the persona's style and optimal slider settings.</p>
                      <p>• Only AI-generated songs can be covered. Commercially copyrighted songs will be blocked (error 413).</p>
                    </div>
                    <p className="text-gray-600 mt-1 text-[10px]">Don't have a persona? Switch to Create Persona model, select a generated song, and extract the voice.</p>
                  </div>

                  {/* 3 Modes */}
                  <div>
                    <p className="text-[#EAEAEA] font-medium mb-1">3 ways to cover:</p>
                    <div className="space-y-1">
                      <p><span className="text-amber-400 font-medium">1. Persona cover</span> — Upload song + Persona + Custom ON + Vocals → AI re-sings with that voice</p>
                      <p><span className="text-amber-400 font-medium">2. Quick cover</span> — Upload song + Custom OFF + describe mood → AI auto-generates lyrics & voice</p>
                      <p><span className="text-amber-400 font-medium">3. Instrumental remix</span> — Upload song + Custom ON + Instrumental ON → re-arranged, no vocals</p>
                    </div>
                  </div>

                  {/* What each field does */}
                  <details className="group/more">
                    <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-300 transition">
                      See more — what each setting does
                    </summary>
                    <div className="mt-2 space-y-1.5 text-[10px]">
                      <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1">
                        <span className="text-orange-400 font-medium">Instrumental</span>
                        <span><span className="text-white">ON</span> = no vocals, music only. <span className="text-white">OFF</span> = vocals included. When OFF, select <span className="text-white">Male/Female</span> to control the vocal gender.</span>

                        <span className="text-blue-400 font-medium">Custom Mode</span>
                        <span><span className="text-white">ON</span> = you control everything (prompt = exact lyrics, style + title required). <span className="text-white">OFF</span> = simple mode (prompt = mood description, AI auto-generates lyrics).</span>

                        <span className="text-gray-300 font-medium">Title</span>
                        <span>The song name. Required when Custom ON. Used for file naming and display in Kie AI.</span>

                        <span className="text-gray-300 font-medium">Style</span>
                        <span>Music genre (Rock, Pop, Jazz...). Guides the AI's arrangement and vocal delivery style.</span>

                        <span className="text-purple-400 font-medium">Persona</span>
                        <span>A saved voice profile. The AI will sing using this voice. Requires Custom ON. Create one from any generated song.</span>

                        <span className="text-gray-300 font-medium">Negative Tags</span>
                        <span>Styles to <span className="text-red-400">avoid</span>. e.g. "heavy metal, strong drums" — the AI won't use these elements. Optional.</span>

                        <span className="text-blue-400 font-medium">Style Weight</span>
                        <span>0–1. How closely to follow the style tag. Higher = stricter genre adherence. Default 0.5. Optional.</span>

                        <span className="text-purple-400 font-medium">Weirdness</span>
                        <span>0–1. Creative deviation. Higher = more experimental/unusual output. Default 0.5. Optional.</span>

                        <span className="text-amber-400 font-medium">Audio Weight</span>
                        <span>0–1. How closely to follow the original uploaded audio. Higher = more faithful to the original melody. Default 0.5. Optional.</span>

                        <span className="text-gray-300 font-medium">Vocal Gender</span>
                        <span>Male or Female. Only applies when Instrumental is OFF (vocals enabled). Ignored if a Persona is selected.</span>

                        <span className="text-gray-300 font-medium">Model</span>
                        <span>V4 = stable, V5 = better quality, V5.5 = latest. Higher versions may produce more natural vocals.</span>
                      </div>
                    </div>
                  </details>

                </div>
              </details>
            </div>
          )}

          {/* Extend Music quick guide */}
          {selectedModelOption.value === "ai-music-api/extend" && (
            <div className="px-[10px] pt-[10px] pb-0">
              <details className="group">
                <summary className="flex items-center gap-1.5 cursor-pointer text-[11px] text-teal-400 hover:text-teal-300 transition-colors">
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><circle cx="12" cy="12" r="10" strokeWidth="1.5"/><path strokeLinecap="round" strokeWidth="1.5" d="M12 16v-4m0-4h.01"/></svg>
                  <span>How to use Extend Music — click for guide</span>
                </summary>
                <div className="mt-2 p-3 bg-[#141418] border border-[#2A2A32] rounded-lg text-[11px] text-gray-400 leading-relaxed space-y-3">

                  {/* Quick Start */}
                  <div>
                    <p className="text-[#EAEAEA] font-medium mb-1">Make your song longer:</p>
                    <div className="bg-[#0A0A0F] rounded-md px-3 py-2 text-[11px] space-y-0.5">
                      <p><span className="text-green-400">1.</span> Select a completed song from the <span className="text-teal-400">Select Song</span> dropdown</p>
                      <p><span className="text-green-400">2.</span> The "From" time auto-fills to the song's end (you can adjust)</p>
                      <p><span className="text-green-400">3.</span> Write continuation lyrics in the prompt</p>
                      <p><span className="text-green-400">4.</span> Click Generate</p>
                    </div>
                  </div>

                  {/* Two modes */}
                  <div>
                    <p className="text-[#EAEAEA] font-medium mb-1">Two modes:</p>
                    <div className="space-y-1">
                      <p><span className="text-teal-400 font-medium">Custom OFF</span> (simple) — only select song + audioId needed. AI uses the original song's style, title, and settings to continue.</p>
                      <p><span className="text-teal-400 font-medium">Custom ON</span> — you control everything: prompt (lyrics), style, title, continueAt, persona. Use this for changing style mid-song or adding specific lyrics.</p>
                    </div>
                  </div>

                  {/* Tips */}
                  <details className="group/more">
                    <summary className="cursor-pointer text-[11px] text-gray-500 hover:text-gray-300 transition">
                      See more — tips & settings
                    </summary>
                    <div className="mt-2 space-y-1.5 text-[10px]">
                      <div className="grid grid-cols-[90px_1fr] gap-x-2 gap-y-1">
                        <span className="text-teal-400 font-medium">Select Song</span>
                        <span>Pick the song to extend from your generated panel. Shows name and duration.</span>

                        <span className="text-blue-400 font-medium">Custom On/Off</span>
                        <span><span className="text-white">OFF</span> = inherit original params (simplest). <span className="text-white">ON</span> = set your own prompt, style, continueAt.</span>

                        <span className="text-gray-300 font-medium">From (s)</span>
                        <span>Where to start extending from. This is the most important setting:
                          <br /><span className="text-teal-400">From = song end (e.g. 90/93s)</span> → adds new music after the song ends. Use this to make the song longer.
                          <br /><span className="text-amber-400">From = middle (e.g. 30s)</span> → keeps the first 30s, re-generates everything after. Use this to change the second half.
                          <br /><span className="text-red-400">From = near start (e.g. 5s)</span> → re-generates almost the entire song with your new lyrics/style.
                          <br />Auto-set to song duration when you select a song. Adjust as needed.</span>

                        <span className="text-gray-300 font-medium">Prompt</span>
                        <span>Lyrics for the extension (Custom ON). Write the next section: [Verse 3], [Bridge], [Outro], etc.</span>

                        <span className="text-purple-400 font-medium">Persona</span>
                        <span>Use the same persona as the original for consistent voice. Requires Custom ON.</span>

                        <span className="text-gray-300 font-medium">Style/Title</span>
                        <span>Required when Custom ON. Match the original song's style for consistency.</span>
                      </div>
                    </div>
                  </details>

                </div>
              </details>
            </div>
          )}

          {/* Lyrics format guide — only when Music + Vocals mode */}
          {(selectedModelOption.value === "ai-music-api/generate" || selectedModelOption.value === "ai-music-api/upload-cover") && !musicInstrumental && (
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

          {/* ── ANALYZE MODE: URL input + result display ─────────────── */}
          {outputMode === "analyze" && (
            <div className="px-[10px] pt-[6px] pb-[10px] space-y-2">
              {/* URL input */}
              <input
                type="text"
                placeholder={`Paste ${analyzeType} URL...`}
                value={analyzeMediaUrl}
                onChange={(e) => { setAnalyzeMediaUrl(e.target.value); setAnalyzeResult(""); }}
                className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-xs text-white placeholder-[#6E6E6E] outline-none focus:border-amber-500/50 transition"
              />

              {/* Result display */}
              {analyzeResult && (
                <div className="relative">
                  <div className="px-3 py-2 bg-[#141418] border border-amber-500/20 rounded-lg max-h-28 overflow-y-auto">
                    <p className="text-[11px] text-(--text-secondary) whitespace-pre-wrap leading-relaxed">{analyzeResult}</p>
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <button
                      onClick={() => {
                        setOutputMode("image");
                        setTimeout(() => {
                          const el = editorRef.current;
                          if (el) {
                            el.textContent = analyzeResult;
                            setEditorIsEmpty(false);
                            setCurrentPrompt(analyzeResult);
                            onUserPromptChange?.(analyzeResult);
                          }
                          toast.success("Result loaded into prompt");
                        }, 100);
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-amber-400 hover:bg-amber-500/10 transition"
                    >
                      <ArrowUp className="w-3 h-3" /> Use as Prompt
                    </button>
                    <button
                      onClick={() => { navigator.clipboard.writeText(analyzeResult); toast.success("Copied!"); }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-(--text-secondary) hover:bg-white/5 transition"
                    >
                      <Copy className="w-3 h-3" /> Copy
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          await createTemplate({
                            name: `Analyzed ${analyzeType} — ${new Date().toLocaleDateString()}`,
                            type: "notes" as const,
                            prompt: analyzeResult,
                            notes: `AI analysis of ${analyzeType}`,
                            companyId,
                            isPublic: false,
                            tags: [analyzeType],
                          });
                          toast.success("Saved as note!");
                        } catch (err) {
                          toast.error("Failed to save template");
                          console.error("[save-template]", err);
                        }
                      }}
                      className="flex items-center gap-1 px-2 py-1 rounded-md text-[11px] text-purple-400 hover:bg-purple-500/10 transition"
                    >
                      <Save className="w-3 h-3" /> Save as Notes
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Prompt Area — hidden for Topaz Video Upscale, Create Persona, and Analyze mode */}
          {outputMode === "analyze" || selectedModelOption.value === "topaz/video-upscale" || selectedModelOption.value === "ai-music-api/generate-persona" ? null : (
            <div className="px-[10px] pt-[10px] pb-[10px]">
              <div className="flex gap-2">
                {/* Text Area (shared component) with context menu */}
                <PromptTextarea
                  editorRef={editorRef}
                  editorIsEmpty={editorIsEmpty}
                  placeholder={
                    selectedModelOption.value.startsWith("ai-music-api/")
                      ? coverCustomMode
                        ? musicInstrumental
                          ? "Describe the music mood, instruments... e.g. calm piano with soft melodies"
                          : "Write your lyrics here... use [Verse], [Chorus], [Bridge] to structure. e.g. [Verse 1] Walking through the city lights..."
                        : "Describe the mood and style. Lyrics will be auto-generated. e.g. A powerful rock ballad with emotional vocals"
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
                  cameraMotionOptions={outputMode === "video" && !["topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") ? cameraMotionOptions : undefined}
                  onCameraMotionSelect={(value) => setCameraMotion(value)}
                  onPromptChange={(text) => { setEditorIsEmpty(!text.trim()); setCurrentPrompt(text); onUserPromptChange?.(text); }}
                  mentionableElements={projectElements?.map((el: any) => ({
                    id: el._id,
                    name: el.name,
                    type: el.type,
                    thumbnailUrl: el.thumbnailUrl,
                    referenceUrls: el.referenceUrls,
                  }))}
                  onElementMention={(element) => {
                    // Get thumbnail or first reference image for the badge
                    const imgUrl = element.thumbnailUrl || element.referenceUrls?.[0] || "";
                    // Count existing element badges to get next number
                    const existingBadges = editorRef.current?.querySelectorAll('[data-element-id]') || [];
                    const imageNumber = existingBadges.length + 1;
                    insertBadgeAtCaret({
                      id: `el-${element.id}-${Date.now()}`,
                      imageUrl: imgUrl,
                      imageNumber,
                      badgeType: "element",
                      elementName: element.name,
                      elementId: element.id,
                    });
                  }}
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

                {/* Enhance button */}
                {(outputMode === "image" || outputMode === "video") && !selectedModelOption.value.startsWith("ai-music-api/") && (
                  <button
                    onClick={async () => {
                      const prompt = extractPlainText();
                      if (!prompt.trim()) { toast("Write a prompt first"); return; }
                      if (isEnhancing) return;
                      setIsEnhancing(true);
                      try {
                        await deductCredits({
                          companyId: companyId || "",
                          tokens: 1,
                          reason: "Prompt enhancement",
                          model: "claude-haiku-4-5",
                          action: "prompt-enhance",
                          plan: currentPlan || undefined,
                        });
                        const res = await fetch("/api/prompt-enhance", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ prompt, userId: user?.id, mode: outputMode }),
                        });
                        const data = await res.json();
                        if (!res.ok) { toast.error(data.error || "Enhancement failed"); return; }
                        const el = editorRef.current;
                        if (el && data.enhanced) {
                          el.textContent = data.enhanced;
                          setEditorIsEmpty(false);
                          setCurrentPrompt(data.enhanced);
                          onUserPromptChange?.(data.enhanced);
                          toast.success("Prompt enhanced (1 cr)");
                        }
                      } catch (err: any) {
                        toast.error(err?.message || "Enhancement failed");
                      } finally {
                        setIsEnhancing(false);
                      }
                    }}
                    disabled={isEnhancing || editorIsEmpty}
                    className={`flex items-center gap-1 px-2 py-1 rounded-md text-[12px] transition-colors cursor-pointer border ${
                      isEnhancing
                        ? "text-amber-400 border-amber-400/30 bg-amber-400/8"
                        : "text-(--text-secondary) border-white/8 hover:text-amber-400 hover:bg-amber-400/8 disabled:opacity-40 disabled:cursor-not-allowed"
                    }`}
                    title="Enhance prompt with AI (1 credit)"
                  >
                    {isEnhancing ? (
                      <div className="w-3 h-3 border border-amber-400/40 border-t-amber-400 rounded-full animate-spin" />
                    ) : (
                      <Wand2 className="w-3 h-3" strokeWidth={1.75} />
                    )}
                    <span>{isEnhancing ? "Enhancing..." : "Enhance"}</span>
                  </button>
                )}

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
                  projectStylePrompt={projectData?.stylePrompt}
                  projectStyleName={projectData?.style}
                  onOpenLibrary={() => setIsPromptLibraryOpen(true)}
                  companyId={companyId}
                  userId={user?.id}
                  onAfterLoadPrompt={() => {
                    // Convert @ElementName text placeholders to badge elements.
                    // The build-storyboard route prepends @mentions to stored prompts;
                    // parseMentions walks the editor DOM and replaces them with badges
                    // that carry the element's reference image (if one has been generated).
                    if (projectElements?.length) {
                      parseMentions(projectElements);
                    }
                  }}
                />

                {/* Component triggers (visually hidden) — controlled from pill bar above */}
                {hasProFeatures && (outputMode === "video") && !["topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") && (
                  <div className="w-0 h-0 overflow-hidden absolute" data-speed-ramp-host>
                    <SpeedRampEditor
                      curve={speedRampCurve}
                      onCurveChange={setSpeedRampCurve}
                      onInsertToPrompt={(text) => {
                        const el = editorRef.current;
                        if (!el || !text) return;
                        const hasContent = el.innerHTML && el.innerHTML !== '<br>';
                        if (hasContent) {
                          el.innerHTML = el.innerHTML + '<br>' + text;
                        } else {
                          el.textContent = text;
                        }
                        const plainText = el.innerText || '';
                        setEditorIsEmpty(false);
                        setCurrentPrompt(plainText);
                        onUserPromptChange?.(plainText);
                      }}
                    />
                  </div>
                )}
                {hasProFeatures && (outputMode === "image" || outputMode === "video") && !["topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") && (
                  <div className="w-0 h-0 overflow-hidden absolute" data-camera-studio-trigger>
                    <VirtualCameraStyle
                      settings={virtualCameraSettings}
                      onSettingsChange={setVirtualCameraSettings}
                      companyId={companyId}
                      userId={user?.id}
                    />
                  </div>
                )}
                {hasProFeatures && (outputMode === "image" || outputMode === "video") && !["topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") && (
                  <div className="w-0 h-0 overflow-hidden absolute" data-angle-picker-host>
                    <CameraAnglePicker
                      settings={cameraAngleSettings}
                      onSettingsChange={setCameraAngleSettings}
                      companyId={companyId}
                      userId={user?.id}
                      onInsertToPrompt={(text) => {
                        const el = editorRef.current;
                        if (!el || !text) return;
                        const hasContent = el.innerHTML && el.innerHTML !== '<br>';
                        if (hasContent) {
                          el.innerHTML = el.innerHTML + '<br>' + text;
                        } else {
                          el.textContent = text;
                        }
                        const plainText = el.innerText || '';
                        setEditorIsEmpty(false);
                        setCurrentPrompt(plainText);
                        onUserPromptChange?.(plainText);
                      }}
                    />
                  </div>
                )}
                {hasProFeatures && (outputMode === "image" || outputMode === "video") && !["topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") && (
                  <div className="w-0 h-0 overflow-hidden absolute" data-palette-picker-host>
                    <ColorPalettePicker
                      colors={colorPaletteColors}
                      onColorsChange={setColorPaletteColors}
                      companyId={companyId}
                      userId={user?.id}
                      generatedItemImages={generatedItemImages}
                      generatedProjectImages={generatedProjectImages}
                      onR2Click={() => setShowPaletteFileBrowser(true)}
                      canOpenR2={canOpenFileBrowser()}
                      onCaptureClick={() => {
                        const canvasEditor = document.querySelector('[data-canvas-editor="true"]');
                        if (!canvasEditor) return;
                        const mainImage = canvasEditor.querySelector('img[data-canvas-base-image="true"], img') as HTMLImageElement;
                        if (mainImage?.src) {
                          setColorPaletteColors(prev => ({ ...prev, referenceUrl: mainImage.src }));
                        }
                      }}
                      onInsertToPrompt={(text) => {
                        const el = editorRef.current;
                        if (!el || !text) return;
                        const hasContent = el.innerHTML && el.innerHTML !== '<br>';
                        if (hasContent) {
                          el.innerHTML = el.innerHTML + '<br>' + text;
                        } else {
                          el.textContent = text;
                        }
                        const plainText = el.innerText || '';
                        setEditorIsEmpty(false);
                        setCurrentPrompt(plainText);
                        onUserPromptChange?.(plainText);
                      }}
                      backgroundImage={backgroundImage}
                      onSetOriginalImage={onSetOriginalImage}
                    />
                  </div>
                )}
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
          
          {/* Toolbar — bottom settings bar */}
          <div className="relative z-50 flex items-center gap-1 px-3 py-2 border-t border-white/5">

            {/* ── Create [Mode] dropdown ────────────────────────── */}
            <div className="relative">
              <div className="flex items-center">
                {/* Main action button area (label only, not clickable for generate) */}
                <button
                  ref={createModeBtnRef}
                  onClick={() => setShowCreateModeDropdown(!showCreateModeDropdown)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-semibold uppercase tracking-wide transition-colors cursor-pointer ${
                    outputMode === "analyze"
                      ? "bg-amber-500/15 text-amber-400"
                      : "bg-white/10 text-(--text-primary)"
                  }`}
                >
                  {outputMode === "image" && <Image className="w-4 h-4" strokeWidth={1.75} />}
                  {outputMode === "video" && <Film className="w-4 h-4" strokeWidth={1.75} />}
                  {outputMode === "audio" && <Music className="w-4 h-4" strokeWidth={1.75} />}
                  {outputMode === "analyze" && <Scan className="w-4 h-4" strokeWidth={1.75} />}
                  <span>
                    {outputMode === "analyze" ? "Analyze" : `Create ${outputMode.charAt(0).toUpperCase() + outputMode.slice(1)}`}
                  </span>
                  <ChevronDown className="w-3 h-3 opacity-50" />
                </button>
              </div>

              {showCreateModeDropdown && createPortal(
                <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowCreateModeDropdown(false)} />
                  <div
                    className="fixed w-[180px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[9999] py-1"
                    style={createModeBtnRef.current ? (() => {
                      const r = createModeBtnRef.current!.getBoundingClientRect();
                      return { left: r.left, bottom: window.innerHeight - r.top + 8 };
                    })() : undefined}
                  >
                    {([
                      { key: "image" as const, Icon: Image, label: "Create Image" },
                      { key: "video" as const, Icon: Film, label: "Create Video" },
                      { key: "audio" as const, Icon: Music, label: "Create Audio" },
                    ] as const).map((cat) => (
                      <button
                        key={cat.key}
                        onClick={() => {
                          if (outputMode === "analyze") setOutputMode(cat.key);
                          setModelFilter(cat.key);
                          const firstInCategory = allModelOptions.find(m => m.category === cat.key);
                          if (firstInCategory) {
                            const modelOutputMode = firstInCategory.category === "audio" ? "audio" as const
                              : firstInCategory.category === "image" ? "image" as const
                              : "video" as const;
                            if (modelOutputMode !== (outputMode as string) || outputMode === "analyze") {
                              setOutputMode(modelOutputMode);
                              setResolution(modelOutputMode === "video" ? "480P" : "1K");
                              setAspectRatio(modelOutputMode === "video" ? "16:9" : "1:1");
                            }
                            onModelChange?.(firstInCategory.value);
                          }
                          setShowCreateModeDropdown(false);
                        }}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
                          outputMode !== "analyze" && selectedModelOption.category === cat.key
                            ? "bg-white/8 text-(--text-primary)"
                            : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                        }`}
                      >
                        <cat.Icon className="w-4 h-4" strokeWidth={1.75} />
                        <span className="font-medium">{cat.label}</span>
                      </button>
                    ))}
                    <div className="border-t border-white/5 my-1" />
                    <button
                      onClick={() => { setOutputMode("analyze"); setShowCreateModeDropdown(false); }}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left text-[13px] transition-colors ${
                        outputMode === "analyze"
                          ? "bg-amber-500/15 text-amber-400"
                          : "text-[#8A8A8A] hover:text-amber-400 hover:bg-amber-500/8"
                      }`}
                    >
                      <Scan className="w-4 h-4" strokeWidth={1.75} />
                      <span className="font-medium">Analyze</span>
                    </button>
                  </div>
                </>,
                document.body
              )}
            </div>

            {/* ── ANALYZE MODE toolbar ─────────────────────────────── */}
            {outputMode === "analyze" && <>
              <div className="w-px h-4 bg-[#32363E] mx-1" />

              {/* Type selector */}
              {([
                { key: "image" as const, label: "Image", icon: Image, cost: 1 },
                { key: "video" as const, label: "Video", icon: Film, cost: 3 },
                { key: "audio" as const, label: "Audio", icon: Mic, cost: 1 },
              ] as const).map((t) => (
                <button
                  key={t.key}
                  onClick={() => { setAnalyzeType(t.key); setAnalyzeMediaUrl(""); setAnalyzeResult(""); }}
                  className={`flex items-center gap-1 px-2 py-1 rounded-md text-[12px] font-medium transition-colors ${
                    analyzeType === t.key
                      ? "bg-amber-500/15 text-amber-400"
                      : "text-[#8A8A8A] hover:text-amber-300 hover:bg-amber-500/8"
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5" />
                  {t.label}
                  <span className="text-[10px] opacity-50">{t.cost}cr</span>
                </button>
              ))}

              <div className="flex-1" />

              {/* Credit cost */}
              <div className="flex items-center gap-1 text-[12px] text-(--text-secondary)">
                <Coins className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                <span>{analyzeType === "video" ? 3 : 1}</span>
              </div>

              {/* Analyze button */}
              <button
                onClick={handleAnalyze}
                disabled={isAnalyzing || !analyzeMediaUrl}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed bg-amber-500 hover:bg-amber-400 text-black"
              >
                {isAnalyzing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Scan className="w-4 h-4" />
                    Analyze
                  </>
                )}
              </button>
            </>}

            {/* ── NON-ANALYZE MODE: Model + Primary Controls + Settings + Generate ── */}
            {outputMode !== "analyze" && <>
            <div className="w-px h-4 bg-[#32363E] mx-1" />

            {/* Model name */}
            {allModelOptions.length > 0 && (
              <div className="relative">
                <button
                  ref={modelBtnRef}
                  onClick={() => setShowModelDropdown(!showModelDropdown)}
                  className="flex items-center gap-1.5 px-2 py-1 rounded-md text-[13px] font-medium text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                >
                  {selectedModelOption?.icon && <selectedModelOption.icon className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />}
                  <span>{selectedModelOption?.label || "Nano Banana 2"}</span>
                </button>

                {showModelDropdown && createPortal(
                  <>
                  <div className="fixed inset-0 z-[9998]" onClick={() => setShowModelDropdown(false)} />
                  <div
                    className="fixed w-[260px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[9999]"
                    style={modelBtnRef.current ? (() => {
                      const r = modelBtnRef.current!.getBoundingClientRect();
                      return { left: r.left, bottom: window.innerHeight - r.top + 8 };
                    })() : undefined}
                  >
                    <div className="py-1.5 max-h-[360px] overflow-y-auto">
                      {(() => {
                        const filtered = allModelOptions.filter((m) => m.category === outputMode);
                        const groups: Record<string, typeof filtered> = {};
                        filtered.forEach((m) => {
                          if (!groups[m.category]) groups[m.category] = [];
                          groups[m.category].push(m);
                        });
                        const categoryOrder = ["image", "video", "audio"];
                        const catIcons: Record<string, React.ComponentType<{ className?: string; strokeWidth?: number }>> = { image: Image, video: Film, audio: Music };
                        return categoryOrder.filter(c => groups[c]).map((cat) => (
                          <div key={cat}>
                            <div className="px-3 pt-2.5 pb-1 text-[10px] font-semibold tracking-wider uppercase text-(--text-secondary)">
                              {cat} model
                            </div>
                            {groups[cat].map((modelOption) => (
                              <button
                                key={modelOption.value}
                                onClick={() => {
                                  const modelOutputMode = modelOption.category === "audio" ? "audio" as const
                                    : modelOption.category === "image" ? "image" as const
                                    : "video" as const;
                                  if (modelOutputMode !== outputMode) {
                                    setOutputMode(modelOutputMode);
                                    setResolution(modelOutputMode === "video" ? "480P" : "1K");
                                    if (modelOutputMode === "video") {
                                      setAspectRatio("16:9");
                                    } else {
                                      const isNanoBanana = modelOption.value.includes("nano-banana");
                                      setAspectRatio(isNanoBanana ? "16:9" : "1:1");
                                    }
                                  }
                                  if (modelOption.value === "kling-3.0/motion-control") {
                                    setResolution("720P"); setVideoDuration("4s");
                                  } else if (modelOption.value === "bytedance/seedance-2" || modelOption.value === "bytedance/seedance-2-fast") {
                                    setResolution("480P"); setVideoDuration("5s"); setHasVideoInput(false); setWebSearch(false); setGenerateAudio(true); setVideoRefs([]); setAudioRefs([]); setFirstFrameUrl(null); setLastFrameUrl(null);
                                  } else if (modelOption.value === "bytedance/seedance-1.5-pro") {
                                    setResolution("480P"); setVideoDuration("8s"); setAudioEnabled(false);
                                  } else if (modelOption.value === "google/veo-3.1") {
                                    setVeoQuality("Fast"); setVeoMode("TEXT_2_VIDEO");
                                  } else if (modelOption.value === "grok-imagine/image-to-video") {
                                    setResolution("480P"); setVideoDuration("6s"); setAspectRatio("16:9");
                                  } else {
                                    setResolution("1K");
                                  }
                                  onModelChange?.(modelOption.value);
                                  setShowModelDropdown(false);
                                }}
                                className={`w-full px-3 py-2 text-left transition-colors ${
                                  selectedModelOption?.value === modelOption.value
                                    ? "bg-white/8"
                                    : "hover:bg-white/5"
                                }`}
                              >
                                <div className="flex items-center gap-2.5">
                                  {(() => {
                                    const CatIcon = catIcons[modelOption.category] || Image;
                                    return <CatIcon className="w-4 h-4 flex-shrink-0 text-(--text-secondary)" strokeWidth={1.75} />;
                                  })()}
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-medium text-[13px] text-(--text-primary)">{modelOption.label}</span>
                                      <span className={`text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide ${
                                        modelOption.category === "image" ? "bg-cyan-500/15 text-cyan-400"
                                        : modelOption.category === "video" ? "bg-green-500/15 text-green-400"
                                        : "bg-purple-500/15 text-purple-400"
                                      }`}>{modelOption.category}</span>
                                      {(modelOption as any).extraBadge && (
                                        <span className="text-[9px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wide bg-blue-500/15 text-blue-400">
                                          {(modelOption as any).extraBadge}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-[11px] text-(--text-secondary) mt-0.5">{modelOption.sub}</div>
                                  </div>
                                </div>
                              </button>
                            ))}
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                  </>,
                  document.body
                )}
              </div>
            )}

            {/* Spacer — push remaining controls to the right */}
            <div className="flex-1" />

            {/* ── PRIMARY CONTROLS (always visible) ────────────── */}

            {/* Aspect ratio — visible for most models */}
            {selectedModelOption.value !== "topaz/video-upscale" && selectedModelOption.value !== "infinitalk/from-audio" && !selectedModelOption.value.startsWith("ai-music-api/") && selectedModelOption.value !== "elevenlabs/text-to-speech-multilingual-v2" && selectedModelOption.value !== "kling-3.0/motion-control" && (
              <div className="relative">
                <button
                  onClick={() => { setShowAspectRatioDropdown(!showAspectRatioDropdown); }}
                  className={`flex items-center gap-1.5 px-1.5 py-1 rounded-md text-[13px] transition-colors cursor-pointer ${
                    showAspectRatioDropdown ? "text-(--text-primary) bg-white/5" : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                  }`}
                  title="Aspect Ratio"
                >
                  <RectangleHorizontal className="w-3.5 h-3.5" strokeWidth={1.75} />
                  <span>{aspectRatioOptions.find(o => o.value === aspectRatio)?.label || "1:1"}</span>
                </button>

                {showAspectRatioDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowAspectRatioDropdown(false)} />
                    <div className="absolute bottom-full right-0 mb-2 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 p-2">
                      <div className="flex flex-col gap-0.5">
                        {aspectRatioOptions
                          .filter(option => {
                            if (selectedModelOption.value === "google/veo-3.1" && veoMode === "REFERENCE_2_VIDEO") return option.value !== "1:1";
                            return true;
                          })
                          .map((option) => (
                            <button
                              key={`ar-${option.value}`}
                              onClick={() => { setAspectRatio(option.value); setShowAspectRatioDropdown(false); }}
                              className={`px-3 py-1.5 rounded-md text-[13px] text-center transition-colors min-w-[52px] ${
                                aspectRatio === option.value
                                  ? "bg-white/10 text-white"
                                  : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Video Duration — primary for video models */}
            {outputMode === "video" && !["google/veo-3.1", "kling-3.0/motion-control", "topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") && (
              <div className="relative">
                <button
                  onClick={() => setShowVideoDurationDropdown(!showVideoDurationDropdown)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  title="Duration"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>{videoDurationOptions.find(o => o.value === videoDuration)?.label || "8s"}</span>
                </button>
                {showVideoDurationDropdown && (
                  <div className="absolute bottom-full left-0 mb-2 w-[80px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50 max-h-[200px] overflow-y-auto">
                    <div className="py-1">
                      {videoDurationOptions.map((option) => (
                        <button
                          key={option.value}
                          onClick={() => { setVideoDuration(option.value); setShowVideoDurationDropdown(false); }}
                          className={`w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                            videoDuration === option.value
                              ? "bg-white/8 text-(--text-primary)"
                              : "text-(--text-primary) hover:bg-white/5"
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

            {/* Seedance Mode selector — primary for seedance */}
            {(selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (() => {
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
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span>{modeOptions.find(o => o.value === seedanceMode)?.label || "Text Only"}</span>
                    <ChevronDown className="w-3 h-3 text-[#808090]" />
                  </button>
                  {seedanceModeOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setSeedanceModeOpen(false)} />
                      <div className="absolute bottom-full mb-1 left-0 bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl py-1 z-50 min-w-[140px]">
                        {modeOptions.map(opt => (
                          <button
                            key={opt.value}
                            onClick={() => { setSeedanceMode(opt.value as any); setSeedanceModeOpen(false); }}
                            className={`w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                              seedanceMode === opt.value
                                ? 'bg-white/8 text-(--text-primary)'
                                : 'text-(--text-primary) hover:bg-white/5'
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

            {/* Veo 3.1 Quality — primary */}
            {selectedModelOption.value === "google/veo-3.1" && (
              <div className="relative">
                <button
                  onClick={() => setShowVeoQualityDropdown(!showVeoQualityDropdown)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  title="Quality"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>{veoQualityOptions.find(o => o.value === veoQuality)?.label || "Fast"}</span>
                </button>
                {showVeoQualityDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowVeoQualityDropdown(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-[100px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50">
                      <div className="py-1">
                        {veoQualityOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => { setVeoQuality(option.value); setShowVeoQualityDropdown(false); }}
                            className={`w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                              veoQuality === option.value
                                ? "bg-white/8 text-(--text-primary)"
                                : "text-(--text-primary) hover:bg-white/5"
                            }`}
                          >
                            <span>{option.label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Veo 3.1 Mode — primary */}
            {selectedModelOption.value === "google/veo-3.1" && (
              <div className="relative">
                <button
                  onClick={() => setShowVeoModeDropdown(!showVeoModeDropdown)}
                  className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[13px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  title="Mode"
                >
                  <Film className="w-3.5 h-3.5" />
                  <span>{veoModeOptions.find(o => o.value === veoMode)?.label || "Text to Video"}</span>
                </button>
                {showVeoModeDropdown && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowVeoModeDropdown(false)} />
                    <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50">
                      <div className="py-1">
                        {veoModeOptions.map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setVeoMode(option.value);
                              setShowVeoModeDropdown(false);
                              if (option.value === "REFERENCE_2_VIDEO") {
                                if (!["16:9", "9:16"].includes(aspectRatio)) {
                                  setAspectRatio(aspectRatio === "1:1" ? "16:9" : "6:19");
                                }
                              }
                            }}
                            className={`w-full px-3 py-1.5 text-left text-[13px] transition-colors ${
                              veoMode === option.value
                                ? "bg-white/8 text-(--text-primary)"
                                : "text-(--text-primary) hover:bg-white/5"
                            }`}
                          >
                            <div className="flex flex-col items-start">
                              <span>{option.label}</span>
                              <span className="text-[10px] text-(--text-tertiary)">{option.sub}</span>
                              {option.value === "REFERENCE_2_VIDEO" && (
                                <span className="text-[9px] text-yellow-400">Only 16:9 & 9:16</span>
                              )}
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Topaz: Upscale Factor — primary */}
            {selectedModelOption.value === "topaz/video-upscale" && (
              <button
                onClick={() => {
                  const factors: Array<"1" | "2" | "4"> = ["1", "2", "4"];
                  const idx = factors.indexOf(topazUpscaleFactor);
                  setTopazUpscaleFactor(factors[(idx + 1) % factors.length]);
                }}
                className={`px-2 py-1 rounded-lg text-[12px] transition-colors hover:bg-white/5 ${
                  topazUpscaleFactor === "4" ? 'text-yellow-400' : 'text-[#EAEAEA]'
                }`}
              >
                {topazUpscaleFactor}x Upscale
              </button>
            )}

            {/* Topaz: Video duration display */}
            {selectedModelOption.value === "topaz/video-upscale" && videoRefs.length > 0 && (
              <span className="px-2 py-1 text-[12px] text-[#808090]">
                {videoRefs[0].duration}s
              </span>
            )}

            {/* Kling Motion: Orientation — primary */}
            {selectedModelOption.value === "kling-3.0/motion-control" && (
              <button
                onClick={() => setKlingOrientation(klingOrientation === "image" ? "video" : "image")}
                className={`px-2 py-1 rounded-lg text-[12px] transition-colors hover:bg-white/5 ${
                  klingOrientation === "video" ? 'text-purple-400' : 'text-(--text-secondary)'
                }`}
              >
                {klingOrientation === "image" ? "Image Orient" : "Video Orient"}
              </button>
            )}

            {/* InfiniteTalk: Resolution — primary */}
            {selectedModelOption.value === "infinitalk/from-audio" && (
              <button
                onClick={() => setInfinitalkResolution(infinitalkResolution === "480p" ? "720p" : "480p")}
                className={`px-2 py-1 rounded-lg text-[12px] transition-colors hover:bg-white/5 ${
                  infinitalkResolution === "720p" ? 'text-purple-400' : 'text-[#EAEAEA]'
                }`}
              >
                {infinitalkResolution}
              </button>
            )}

            {/* ElevenLabs TTS: Voice selector — primary (inline compact) */}
            {selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2" && (
              <TtsVoiceSelector
                value={ttsVoice}
                onChange={setTtsVoice}
                open={showTtsVoiceDropdown}
                onOpenChange={setShowTtsVoiceDropdown}
                inline
              />
            )}

            {/* AI Music: Instrumental / Vocals + Gender — primary */}
            {(selectedModelOption.value === "ai-music-api/generate" || selectedModelOption.value === "ai-music-api/upload-cover" || selectedModelOption.value === "ai-music-api/extend") && (
              <>
                <button
                  onClick={() => setMusicInstrumental(!musicInstrumental)}
                  className={`px-2 py-1 rounded-md text-[12px] flex items-center gap-1.5 transition-colors hover:bg-white/5 ${
                    musicInstrumental ? 'text-purple-400' : 'text-orange-400'
                  }`}
                >
                  <Music className="w-3.5 h-3.5" />
                  <span>{musicInstrumental ? "Instrumental" : "Vocals"}</span>
                </button>
                {/* Vocal Gender — only when not instrumental */}
                {!musicInstrumental && (selectedModelOption.value === "ai-music-api/generate" || selectedModelOption.value === "ai-music-api/upload-cover") && (
                  <button
                    onClick={() => setMusicVocalGender(musicVocalGender === "f" ? "m" : "f")}
                    className="px-2 py-1 rounded-md text-[12px] text-(--text-primary) hover:bg-white/5 transition-colors"
                  >
                    {musicVocalGender === "f" ? "♀ Female" : "♂ Male"}
                  </button>
                )}
              </>
            )}

            {/* Extend Music: Audio selector — primary */}
            {selectedModelOption.value === "ai-music-api/extend" && (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowExtendAudioDropdown(!showExtendAudioDropdown)}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] max-w-[160px] transition-colors hover:bg-white/5 cursor-pointer ${
                      musicExtendAudioId ? 'text-teal-400' : 'text-(--text-secondary)'
                    }`}
                  >
                    <Music className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="truncate">{musicExtendAudioId ? (audioFiles?.find(a => a.audioId === musicExtendAudioId)?.name || 'Selected') : 'Select Song'}</span>
                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                  </button>
                  {showExtendAudioDropdown && (
                    <div className="absolute bottom-full left-0 mb-1 w-[280px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50 py-1 max-h-56 overflow-y-auto">
                      <audio ref={extendPreviewAudioRef} style={{ display: "none" }} preload="none" onEnded={() => setExtendPreviewPlaying(null)} />
                      {audioFiles && audioFiles.length > 0 ? (
                        audioFiles.map((af) => (
                          <div key={af.audioId}
                            className={`flex items-center gap-2 px-2 py-1.5 transition-colors ${
                              musicExtendAudioId === af.audioId ? 'bg-teal-500/15' : 'hover:bg-[#1E1E24]'
                            }`}
                          >
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const audio = extendPreviewAudioRef.current;
                                if (!audio || !af.sourceUrl) return;
                                if (extendPreviewPlaying === af.audioId) {
                                  audio.pause();
                                  setExtendPreviewPlaying(null);
                                } else {
                                  audio.src = af.sourceUrl;
                                  audio.play().catch(() => {});
                                  setExtendPreviewPlaying(af.audioId);
                                }
                              }}
                              className="w-6 h-6 rounded-full bg-purple-500/20 hover:bg-purple-500/40 flex items-center justify-center flex-shrink-0 transition"
                            >
                              {extendPreviewPlaying === af.audioId
                                ? <Pause className="w-3 h-3 text-purple-400" />
                                : <Play className="w-3 h-3 text-purple-400 ml-0.5" />
                              }
                            </button>
                            <button
                              onClick={() => {
                                setMusicExtendAudioId(af.audioId);
                                if (af.duration) setMusicExtendContinueAt(Math.floor(af.duration));
                                if (extendPreviewAudioRef.current) { extendPreviewAudioRef.current.pause(); setExtendPreviewPlaying(null); }
                                setShowExtendAudioDropdown(false);
                              }}
                              className={`flex-1 text-left text-[12px] truncate ${musicExtendAudioId === af.audioId ? 'text-teal-400' : 'text-[#EAEAEA]'}`}
                            >
                              {af.name}
                              {af.personaCreated && <span className="text-[9px] text-amber-500 ml-1">✓ Persona</span>}
                            </button>
                            {af.sourceUrl && (
                              <button
                                onClick={(e) => { e.stopPropagation(); if (extendPreviewAudioRef.current) { extendPreviewAudioRef.current.pause(); setExtendPreviewPlaying(null); } setMediaPreview({ type: 'audio', url: af.sourceUrl!, label: af.name, prompt: af.prompt, fileId: String(af._id) }); }}
                                className="w-5 h-5 rounded flex items-center justify-center text-gray-600 hover:text-white hover:bg-white/10 flex-shrink-0 transition"
                                title="Open full player"
                              >
                                <Maximize2 className="w-3 h-3" />
                              </button>
                            )}
                            {af.duration && <span className="text-[10px] text-gray-600 flex-shrink-0">{Math.round(af.duration)}s</span>}
                          </div>
                        ))
                      ) : (
                        <div className="px-3 py-2 text-[11px] text-gray-600">No completed songs in this shot</div>
                      )}
                    </div>
                  )}
                </div>

                {/* Continue At — only when custom is on */}
                {coverCustomMode && (() => {
                  const selectedSong = audioFiles?.find(a => a.audioId === musicExtendAudioId);
                  const songDur = selectedSong?.duration ? Math.round(selectedSong.duration) : 0;
                  return (
                    <div className="flex items-center gap-1 px-2 py-1 bg-[#141418] border border-[#2A2A35] rounded-lg text-[12px] text-[#808090]"
                      title={`Song is ${songDur}s. Set to ${songDur} to add more at the end, or lower to re-generate from that point.`}>
                      <span className="text-[10px] text-gray-500">From</span>
                      <input type="number" min={1} max={600} value={musicExtendContinueAt}
                        onChange={(e) => setMusicExtendContinueAt(Math.max(1, parseInt(e.target.value) || 1))}
                        className="w-10 px-0 py-0 bg-transparent border-none text-[13px] text-white text-center outline-none" />
                      <span className="text-[10px] text-gray-500">/ {songDur}s</span>
                    </div>
                  );
                })()}
              </>
            )}

            {/* GPT Image 2: Mode dropdown + NSFW toggle */}
            {selectedModelOption.value === "gpt-image-2-image-to-image" && (
              <>
                <div className="relative">
                  <button
                    onClick={() => setShowGptImage2ModeDropdown(!showGptImage2ModeDropdown)}
                    className="flex items-center gap-1.5 px-1.5 py-1 rounded-lg text-[12px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <span>{gptImage2Mode === "image-to-image" ? "Img2Img" : "Txt2Img"}</span>
                    <ChevronDown className="w-3 h-3 text-[#808090]" />
                  </button>
                  {showGptImage2ModeDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-[200px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg shadow-2xl z-50 py-1">
                      <button
                        onClick={() => { setGptImage2Mode("image-to-image"); setShowGptImage2ModeDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${gptImage2Mode === "image-to-image" ? 'bg-white/8 text-(--text-primary)' : 'text-(--text-primary) hover:bg-white/5'}`}
                      >
                        <div className="font-medium">Image to Image</div>
                        <div className="text-[10px] text-(--text-tertiary)">Transform existing images with prompt</div>
                      </button>
                      <button
                        onClick={() => { setGptImage2Mode("text-to-image"); setShowGptImage2ModeDropdown(false); }}
                        className={`w-full text-left px-3 py-2 text-[12px] transition-colors ${gptImage2Mode === "text-to-image" ? 'bg-white/8 text-(--text-primary)' : 'text-(--text-primary) hover:bg-white/5'}`}
                      >
                        <div className="font-medium">Text to Image</div>
                        <div className="text-[10px] text-(--text-tertiary)">Generate images from text prompt only</div>
                      </button>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => setGptImage2Nsfw(!gptImage2Nsfw)}
                  className={`px-2 py-1 rounded-lg text-[12px] transition-colors hover:bg-white/5 ${
                    gptImage2Nsfw ? 'text-amber-400' : 'text-(--text-secondary)'
                  }`}
                  title={gptImage2Nsfw ? "NSFW filter ON" : "NSFW filter OFF"}
                >
                  NSFW {gptImage2Nsfw ? "On" : "Off"}
                </button>
              </>
            )}

            {/* ── SETTINGS ICON + POPOVER (secondary controls) ── */}
            {/* Hide for models with no secondary settings: Veo 3.1, InfiniteTalk, Generate Persona */}
            {selectedModelOption.value !== "ai-music-api/generate-persona" && selectedModelOption.value !== "google/veo-3.1" && selectedModelOption.value !== "infinitalk/from-audio" && (
              <div className="relative">
                <button
                  onClick={() => setShowSettingsPopover(!showSettingsPopover)}
                  className={`flex items-center justify-center w-8 h-8 rounded-md transition-colors ${
                    showSettingsPopover ? "text-(--text-primary) bg-white/10" : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                  }`}
                  title="Settings"
                >
                  <SlidersHorizontal className="w-4 h-4" strokeWidth={1.75} />
                </button>

                {showSettingsPopover && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowSettingsPopover(false)} />
                    <div className="absolute bottom-full right-0 mb-2 w-[260px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 p-3 space-y-3">
                      <div className="text-[11px] text-gray-500 font-medium uppercase tracking-wider">Settings</div>

                      {/* Resolution — most models */}
                      {selectedModelOption.value !== "google/veo-3.1" && selectedModelOption.value !== "z-image" && selectedModelOption.value !== "kling-3.0/motion-control" && selectedModelOption.value !== "topaz/video-upscale" && selectedModelOption.value !== "infinitalk/from-audio" && !selectedModelOption.value.startsWith("ai-music-api/") && selectedModelOption.value !== "elevenlabs/text-to-speech-multilingual-v2" && (
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1.5 block">Resolution</label>
                          <div className="flex flex-wrap gap-1">
                            {currentResolutionOptions.map((option) => (
                              <button
                                key={`res-${option.value}`}
                                onClick={() => setResolution(option.value)}
                                className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                                  resolution === option.value
                                    ? "bg-white/10 text-white"
                                    : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Output Format — image mode only */}
                      {outputMode === "image" && selectedModelOption.value !== "z-image" && selectedModelOption.value !== "gpt-image-2-image-to-image" && (
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1.5 block">Format</label>
                          <div className="flex flex-wrap gap-1">
                            {outputFormatOptions.map((option) => (
                              <button
                                key={`fmt-${option.value}`}
                                onClick={() => setOutputFormat(option.value)}
                                className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                                  outputFormat === option.value
                                    ? "bg-white/10 text-white"
                                    : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Grid Generation — image mode only */}
                      {outputMode === "image" && (
                        <div>
                          <label className="text-[10px] text-gray-500 mb-1.5 block">Grid Generation</label>
                          <div className="flex flex-wrap gap-1">
                            {[
                              { value: 1, label: "1x1" },
                              { value: 4, label: "2x2" },
                              { value: 9, label: "3x3" },
                              { value: 16, label: "4x4" },
                            ].map((opt) => (
                              <button
                                key={opt.value}
                                onClick={() => setGridSize(opt.value)}
                                className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                                  gridSize === opt.value
                                    ? "text-teal-300 bg-teal-500/10"
                                    : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                                }`}
                              >
                                {opt.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Audio toggle — standard video models */}
                      {outputMode === "video" && !["google/veo-3.1", "kling-3.0/motion-control", "bytedance/seedance-2", "bytedance/seedance-2-fast", "grok-imagine/image-to-video", "topaz/video-upscale", "infinitalk/from-audio", "elevenlabs/text-to-speech-multilingual-v2"].includes(selectedModelOption.value) && !selectedModelOption.value.startsWith("ai-music-api/") && (
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-(--text-secondary)">Audio</label>
                          <div className="flex gap-1">
                            {audioOptions.map((option) => (
                              <button
                                key={option.value.toString()}
                                onClick={() => setAudioEnabled(option.value)}
                                className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                                  audioEnabled === option.value
                                    ? "bg-white/10 text-white"
                                    : "text-(--text-secondary) hover:bg-white/5"
                                }`}
                              >
                                {option.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Seedance toggles — Search, Audio, Clean */}
                      {(selectedModelOption.value === "bytedance/seedance-2" || selectedModelOption.value === "bytedance/seedance-2-fast") && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-(--text-secondary)">Web Search</label>
                            <button onClick={() => setWebSearch(!webSearch)} className="relative">
                              <div className={`w-8 h-4.5 rounded-full transition-colors ${webSearch ? 'bg-cyan-500' : 'bg-[#3A3A45]'}`}>
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${webSearch ? 'left-4' : 'left-0.5'}`} />
                              </div>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-(--text-secondary)">Generate Audio</label>
                            <button onClick={() => setGenerateAudio(!generateAudio)} className="relative">
                              <div className={`w-8 h-4.5 rounded-full transition-colors ${generateAudio ? 'bg-purple-500' : 'bg-[#3A3A45]'}`}>
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${generateAudio ? 'left-4' : 'left-0.5'}`} />
                              </div>
                            </button>
                          </div>
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-(--text-secondary)">Clean Output</label>
                            <button onClick={() => setCleanOutput(!cleanOutput)} className="relative">
                              <div className={`w-8 h-4.5 rounded-full transition-colors ${cleanOutput ? 'bg-emerald-500' : 'bg-[#3A3A45]'}`}>
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${cleanOutput ? 'left-4' : 'left-0.5'}`} />
                              </div>
                            </button>
                          </div>
                        </div>
                      )}

                      {/* NSFW toggles — Z-Image, Topaz, Grok */}
                      {(selectedModelOption.value === "z-image" || selectedModelOption.value === "topaz/video-upscale" || selectedModelOption.value === "grok-imagine/image-to-video") && (
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-(--text-secondary)">NSFW Filter</label>
                          <button onClick={() => setNsfwChecker(!nsfwChecker)} className="relative">
                            <div className={`w-8 h-4.5 rounded-full transition-colors ${nsfwChecker ? 'bg-emerald-500' : 'bg-[#3A3A45]'}`}>
                              <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${nsfwChecker ? 'left-4' : 'left-0.5'}`} />
                            </div>
                          </button>
                        </div>
                      )}

                      {/* Kling Motion: Background Source */}
                      {selectedModelOption.value === "kling-3.0/motion-control" && (
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-(--text-secondary)">Background Source</label>
                          <button
                            onClick={() => setKlingSource(klingSource === "input_video" ? "input_image" : "input_video")}
                            className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                              klingSource === "input_image" ? 'text-cyan-400 bg-cyan-500/10' : 'text-(--text-secondary) hover:bg-white/5'
                            }`}
                          >
                            {klingSource === "input_video" ? "Video" : "Image"}
                          </button>
                        </div>
                      )}

                      {/* Grok: Mode */}
                      {selectedModelOption.value === "grok-imagine/image-to-video" && (
                        <div className="flex items-center justify-between">
                          <label className="text-[11px] text-(--text-secondary)">Mode</label>
                          <button
                            onClick={() => setGrokMode(grokMode === "normal" ? "fun" : "normal")}
                            className={`px-2.5 py-1 rounded-md text-[12px] transition-colors ${
                              grokMode === "fun" ? 'text-amber-400 bg-amber-500/10' : 'text-(--text-secondary) hover:bg-white/5'
                            }`}
                          >
                            {grokMode === "fun" ? "Fun" : "Normal"}
                          </button>
                        </div>
                      )}

                      {/* AI Music settings */}
                      {(selectedModelOption.value === "ai-music-api/generate" || selectedModelOption.value === "ai-music-api/upload-cover" || selectedModelOption.value === "ai-music-api/extend") && (
                        <>
                          {/* Style/Genre */}
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1.5 block">Style / Genre</label>
                            <div className="flex items-center bg-[#141418] border border-[#2A2A35] rounded-lg overflow-hidden">
                              <input
                                type="text"
                                value={musicStyle}
                                onChange={(e) => setMusicStyle(e.target.value)}
                                placeholder="Any Style"
                                className="flex-1 px-2.5 py-1.5 bg-transparent text-[12px] text-[#EAEAEA] placeholder-[#555560] outline-none min-w-0"
                              />
                              <button
                                onClick={() => setShowMusicStyleDropdown(!showMusicStyleDropdown)}
                                className="px-1.5 py-1 hover:bg-white/5 transition-colors flex-shrink-0"
                              >
                                <ChevronDown className="w-3 h-3 text-[#808090]" />
                              </button>
                            </div>
                            {showMusicStyleDropdown && (
                              <div className="mt-1 w-full bg-[#0A0A0F] border border-[#2A2A32] rounded-lg py-1 max-h-48 overflow-y-auto">
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
                                  { value: "Children's Music", label: "Children's" },
                                  { value: "Reggae", label: "Reggae" },
                                  { value: "Metal", label: "Metal" },
                                  { value: "Blues", label: "Blues" },
                                  { value: "Soul", label: "Soul" },
                                ].map((opt) => (
                                  <button
                                    key={opt.value}
                                    onClick={() => { setMusicStyle(opt.value); setShowMusicStyleDropdown(false); }}
                                    className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${
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

                          {/* Custom Mode */}
                          <div className="flex items-center justify-between">
                            <label className="text-[11px] text-(--text-secondary)">Custom Mode</label>
                            <button onClick={() => setCoverCustomMode(!coverCustomMode)} className="relative">
                              <div className={`w-8 h-4.5 rounded-full transition-colors ${coverCustomMode ? 'bg-blue-500' : 'bg-[#3A3A45]'}`}>
                                <div className={`absolute top-0.5 w-3.5 h-3.5 rounded-full bg-white transition-transform ${coverCustomMode ? 'left-4' : 'left-0.5'}`} />
                              </div>
                            </button>
                          </div>

                          {/* Persona selector (requires custom mode) */}
                          {coverCustomMode && (
                            <>
                              <div>
                                <label className="text-[10px] text-gray-500 mb-1 block">Persona</label>
                                <div className="relative">
                                  <button
                                    onClick={() => setShowPersonaDropdown(!showPersonaDropdown)}
                                    className={`w-full px-2.5 py-1.5 border rounded-md text-[12px] flex items-center justify-between transition-colors ${
                                      selectedPersonaId
                                        ? 'bg-purple-500/10 border-purple-500/30 text-purple-400'
                                        : 'bg-[#0A0A0F] border-[#2A2A32] text-gray-400'
                                    }`}
                                  >
                                    <div className="flex items-center gap-1.5 truncate">
                                      <Mic className="w-3 h-3 flex-shrink-0" />
                                      <span className="truncate">{selectedPersonaId ? (savedPersonas?.find(p => p.personaId === selectedPersonaId)?.name || 'Persona') : 'No Persona'}</span>
                                    </div>
                                    <ChevronDown className="w-3 h-3 flex-shrink-0" />
                                  </button>
                                  {showPersonaDropdown && (
                                    <div className="absolute top-full left-0 mt-1 w-full bg-[#0A0A0F] border border-[#2A2A32] rounded-md shadow-xl z-50 py-1 max-h-36 overflow-y-auto">
                                      <button
                                        onClick={() => { setSelectedPersonaId(""); setShowPersonaDropdown(false); }}
                                        className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${!selectedPersonaId ? 'bg-purple-500/15 text-purple-400' : 'text-[#EAEAEA] hover:bg-[#1E1E24]'}`}
                                      >No Persona</button>
                                      {savedPersonas && savedPersonas.length > 0 ? (
                                        savedPersonas.map((p) => (
                                          <button key={p.personaId}
                                            onClick={() => { setSelectedPersonaId(p.personaId); if (p.style && !musicStyle) setMusicStyle(p.style); setShowPersonaDropdown(false); }}
                                            className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${selectedPersonaId === p.personaId ? 'bg-purple-500/15 text-purple-400' : 'text-[#EAEAEA] hover:bg-[#1E1E24]'}`}
                                          >
                                            <div className="truncate">{p.name}</div>
                                            {p.style && <div className="text-[9px] text-gray-600 truncate">{p.style}</div>}
                                          </button>
                                        ))
                                      ) : (
                                        <div className="px-3 py-2 text-[10px] text-gray-600">No personas yet — create one from a generated song</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Quick persona actions */}
                              {selectedPersonaId && (() => {
                                const persona = savedPersonas?.find(p => p.personaId === selectedPersonaId);
                                return (
                                  <div className="flex items-center gap-1">
                                    {persona?.style && (
                                      <button
                                        onClick={() => { setMusicStyle(persona.style!); toast.success(`Style set to "${persona.style}"`); }}
                                        className="text-[9px] px-1.5 py-0.5 bg-blue-500/20 text-blue-400 rounded-full hover:bg-blue-500/30 transition font-medium"
                                      >
                                        Apply Style
                                      </button>
                                    )}
                                    <button
                                      onClick={() => { setCoverStyleWeight(0.2); setCoverWeirdnessConstraint(0.3); setCoverAudioWeight(0.6); if (persona?.style) { setMusicStyle(persona.style); toast.success("Strong Persona applied — style set to " + persona.style); } else { toast.success("Strong Persona applied — no style saved, set one in Edit Persona or Style field"); } }}
                                      className="text-[9px] px-1.5 py-0.5 bg-purple-500/20 text-purple-400 rounded-full hover:bg-purple-500/30 transition font-medium"
                                    >
                                      Strong Persona
                                    </button>
                                  </div>
                                );
                              })()}

                              {/* Style Weight / Weirdness / Audio Weight sliders */}
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] text-gray-500">Style Weight</label>
                                  <span className="text-[10px] text-gray-400">{coverStyleWeight}</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.05" value={coverStyleWeight}
                                  onChange={(e) => setCoverStyleWeight(parseFloat(e.target.value))}
                                  className="w-full h-1 accent-blue-500 cursor-pointer" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] text-gray-500">Weirdness</label>
                                  <span className="text-[10px] text-gray-400">{coverWeirdnessConstraint}</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.05" value={coverWeirdnessConstraint}
                                  onChange={(e) => setCoverWeirdnessConstraint(parseFloat(e.target.value))}
                                  className="w-full h-1 accent-purple-500 cursor-pointer" />
                              </div>
                              <div>
                                <div className="flex items-center justify-between mb-1">
                                  <label className="text-[10px] text-gray-500">Audio Weight</label>
                                  <span className="text-[10px] text-gray-400">{coverAudioWeight}</span>
                                </div>
                                <input type="range" min="0" max="1" step="0.05" value={coverAudioWeight}
                                  onChange={(e) => setCoverAudioWeight(parseFloat(e.target.value))}
                                  className="w-full h-1 accent-amber-500 cursor-pointer" />
                              </div>
                            </>
                          )}

                          {/* Model version */}
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">Model</label>
                            <div className="relative">
                              <button
                                onClick={() => setShowModelVersionDropdown(!showModelVersionDropdown)}
                                className="w-full px-2.5 py-1.5 bg-[#0A0A0F] border border-[#2A2A32] rounded-md text-[12px] text-[#EAEAEA] flex items-center justify-between cursor-pointer hover:border-[#4A4A4A] transition"
                              >
                                <span>{[{v:"V4",l:"V4"},{v:"V4_5",l:"V4.5"},{v:"V4_5PLUS",l:"V4.5+"},{v:"V4_5ALL",l:"V4.5 ALL"},{v:"V5",l:"V5"},{v:"V5_5",l:"V5.5"}].find(m=>m.v===musicModel)?.l || musicModel}</span>
                                <ChevronDown className="w-3 h-3 text-gray-500" />
                              </button>
                              {showModelVersionDropdown && (
                                <div className="absolute top-full left-0 mt-1 w-full bg-[#0A0A0F] border border-[#2A2A32] rounded-md shadow-xl z-50 py-1 max-h-48 overflow-y-auto">
                                  {[
                                    { value: "V4", label: "V4", desc: "Stable, max 4 min" },
                                    { value: "V4_5", label: "V4.5", desc: "Smarter prompts, max 8 min" },
                                    { value: "V4_5PLUS", label: "V4.5+", desc: "Richer sound, max 8 min" },
                                    { value: "V4_5ALL", label: "V4.5 ALL", desc: "Smarter prompts, max 8 min" },
                                    { value: "V5", label: "V5", desc: "Superior expression, faster" },
                                    { value: "V5_5", label: "V5.5", desc: "Custom models, latest" },
                                  ].map(m => (
                                    <button key={m.value}
                                      onClick={() => { setMusicModel(m.value); setShowModelVersionDropdown(false); }}
                                      className={`w-full text-left px-3 py-1.5 text-[12px] transition-colors ${musicModel === m.value ? 'bg-[#4A90E2]/15 text-[#4A90E2]' : 'text-[#EAEAEA] hover:bg-[#1E1E24]'}`}
                                    >
                                      <span className="font-medium">{m.label}</span>
                                      <span className="text-[10px] text-gray-600 ml-1.5">{m.desc}</span>
                                    </button>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Title */}
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">Title</label>
                            <input
                              type="text"
                              value={musicTitle}
                              onChange={(e) => setMusicTitle(e.target.value)}
                              placeholder="Song title"
                              className="w-full px-2.5 py-1.5 bg-[#0A0A0F] border border-[#2A2A32] rounded-md text-[12px] text-[#EAEAEA] placeholder-gray-600 outline-none"
                            />
                          </div>

                          {/* Negative Tags */}
                          <div>
                            <label className="text-[10px] text-gray-500 mb-1 block">Negative Tags</label>
                            <input
                              type="text"
                              value={musicNegativeTags}
                              onChange={(e) => setMusicNegativeTags(e.target.value)}
                              placeholder="e.g. heavy metal, strong drums"
                              className="w-full px-2.5 py-1.5 bg-[#0A0A0F] border border-[#2A2A32] rounded-md text-[12px] text-[#EAEAEA] placeholder-gray-600 outline-none"
                            />
                          </div>
                        </>
                      )}

                      {/* ElevenLabs TTS Voice Settings (voice selector is in the bar) */}
                      {selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2" && (
                        <>
                          <div className="text-[11px] text-gray-500 font-medium">Voice Settings</div>
                          <TtsLanguageSelector
                            value={ttsLanguageCode}
                            onChange={setTtsLanguageCode}
                            open={showTtsLanguageDropdown}
                            onOpenChange={setShowTtsLanguageDropdown}
                          />
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-gray-500">Stability</label>
                              <span className="text-[10px] text-gray-400">{ttsStability.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={ttsStability}
                              onChange={(e) => setTtsStability(parseFloat(e.target.value))}
                              className="w-full h-1 accent-blue-500 cursor-pointer" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-gray-500">Similarity Boost</label>
                              <span className="text-[10px] text-gray-400">{ttsSimilarityBoost.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={ttsSimilarityBoost}
                              onChange={(e) => setTtsSimilarityBoost(parseFloat(e.target.value))}
                              className="w-full h-1 accent-purple-500 cursor-pointer" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-gray-500">Style</label>
                              <span className="text-[10px] text-gray-400">{ttsStyle.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0" max="1" step="0.05" value={ttsStyle}
                              onChange={(e) => setTtsStyle(parseFloat(e.target.value))}
                              className="w-full h-1 accent-amber-500 cursor-pointer" />
                          </div>
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[10px] text-gray-500">Speed</label>
                              <span className="text-[10px] text-gray-400">{ttsSpeed.toFixed(2)}</span>
                            </div>
                            <input type="range" min="0.7" max="1.2" step="0.05" value={ttsSpeed}
                              onChange={(e) => setTtsSpeed(parseFloat(e.target.value))}
                              className="w-full h-1 accent-teal-500 cursor-pointer" />
                          </div>
                          <div className="border-t border-[#2A2A32] pt-2">
                            <div className="text-[10px] text-gray-500 font-medium mb-2">Context Text</div>
                            <div className="space-y-2">
                              <div>
                                <label className="text-[9px] text-gray-600 block mb-0.5">Previous text</label>
                                <textarea value={ttsPreviousText} onChange={(e) => setTtsPreviousText(e.target.value)} rows={2} placeholder="Text before..."
                                  className="w-full px-2 py-1 bg-[#0A0A0F] border border-[#2A2A32] rounded text-[11px] text-[#EAEAEA] placeholder-gray-600 resize-none outline-none" />
                              </div>
                              <div>
                                <label className="text-[9px] text-gray-600 block mb-0.5">Next text</label>
                                <textarea value={ttsNextText} onChange={(e) => setTtsNextText(e.target.value)} rows={2} placeholder="Text after..."
                                  className="w-full px-2 py-1 bg-[#0A0A0F] border border-[#2A2A32] rounded text-[11px] text-[#EAEAEA] placeholder-gray-600 resize-none outline-none" />
                              </div>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Cost per generation */}
            {selectedModelOption.value !== "ai-music-api/generate-persona" && (
              <div className="flex items-center gap-1 text-[12px] text-(--text-secondary)">
                <Coins className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                <span>{gridSize > 1 ? `${displayedCredits} x ${gridSize} = ${displayedCredits * gridSize}` : displayedCredits}</span>
              </div>
            )}

            {/* Generate Button / Create Persona Button */}
            {selectedModelOption.value === "ai-music-api/generate-persona" ? (
              <>
                <button
                  onClick={() => setShowManagePersona(true)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg transition font-medium text-[13px] bg-[#1E1E24] border border-[#2A2A32] text-gray-400 hover:text-white hover:bg-[#2A2A35]"
                >
                  <Settings className="w-3.5 h-3.5" />
                  Manage
                </button>
                <button
                  onClick={() => { if (personaSourceSong) setShowPersonaCreateDialog(true); else toast.warning("Select a song first"); }}
                  disabled={!personaSourceSong}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed bg-purple-500 hover:bg-purple-400 text-white"
                >
                  <Mic className="w-4 h-4" />
                  Create Persona
                  <span className="text-xs opacity-75">Free</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleKieAIGenerate}
                disabled={isGenerating || generateCooldown || (selectedModelOption.value === "elevenlabs/text-to-speech-multilingual-v2" && (currentPrompt.length === 0 || currentPrompt.length > 5000))}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-md transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white"
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
                    {/* Active auto-append indicators */}
                    {cameraAngleSettings.rotation !== 0 || cameraAngleSettings.tilt !== 0 || cameraAngleSettings.zoom !== 0 ? (
                      <span className="text-[9px] bg-blue-500/30 text-blue-200 px-1 py-0.5 rounded font-normal">Angle</span>
                    ) : null}
                    {!speedRampCurve.every(v => v === 2) && (
                      <span className="text-[9px] bg-violet-500/30 text-violet-200 px-1 py-0.5 rounded font-normal">Speed</span>
                    )}
                    {colorPaletteColors.colors.length > 0 && (
                      <span className="text-[9px] bg-rose-500/30 text-rose-200 px-1 py-0.5 rounded font-normal">Palette</span>
                    )}
                    <span className="text-xs opacity-75">+ {displayedCredits}</span>
                  </>
                )}
              </button>
            )}
          </>}

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
          defaultFileType={'image' as any} // Only show images
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

      {/* Palette FileBrowser — for color palette image picking */}
      {showPaletteFileBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          onClose={() => setShowPaletteFileBrowser(false)}
          imageSelectionMode={true}
          defaultFileType={'image' as any}
          onSelectImage={(imageUrl) => {
            setColorPaletteColors(prev => ({ ...prev, referenceUrl: imageUrl }));
            setShowPaletteFileBrowser(false);
          }}
          onSelectFile={(url, type) => {
            if (type === 'image') {
              setColorPaletteColors(prev => ({ ...prev, referenceUrl: url }));
              setShowPaletteFileBrowser(false);
            }
          }}
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
                toast.warning(`Video too long (${Math.round(totalVideoDuration + duration)}s). Maximum is 15 seconds.`);
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
              const isCover = selectedModelOption.value === "ai-music-api/upload-cover";
              const maxDuration = isCover ? 300 : 15; // Cover Song: 5min, Seedance: 15s
              const maxFiles = isCover ? 1 : 3;
              if (audioRefs.length >= maxFiles) {
                setShowAudioBrowser(false);
                return;
              }
              // Get audio duration
              const duration = await getMediaDuration(url, 'audio');
              if (totalAudioDuration + duration > maxDuration) {
                toast.warning(`Audio too long (${Math.round(totalAudioDuration + duration)}s). Maximum is ${isCover ? '5 minutes' : '15 seconds'}.`);
                return;
              }
              setAudioRefs(prev => [...prev, { url, duration }]);
              setShowAudioBrowser(false);
            }
          }}
        />
      )}

      {/* Analyze FileBrowser — picks image/video/audio based on analyzeType */}
      {showAnalyzeBrowser && projectId && (
        <FileBrowser
          projectId={projectId}
          defaultFileType={analyzeType === "image" ? "image" : analyzeType === "video" ? "video" : "audio"}
          onClose={() => setShowAnalyzeBrowser(false)}
          onSelectFile={(url, type) => {
            const validTypes = analyzeType === "image" ? ["image"]
              : analyzeType === "video" ? ["video"]
              : ["audio", "file"];
            if (validTypes.includes(type)) {
              setAnalyzeMediaUrl(url);
              setAnalyzeResult("");
              setShowAnalyzeBrowser(false);
            }
          }}
          onSelectImage={analyzeType === "image" ? (imageUrl) => {
            setAnalyzeMediaUrl(imageUrl);
            setAnalyzeResult("");
            setShowAnalyzeBrowser(false);
          } : undefined}
          imageSelectionMode={analyzeType === "image"}
        />
      )}

      {/* Media Preview Popup */}
      {mediaPreview && mediaPreview.type === 'audio' && (
        <AudioPreviewDialog
          url={mediaPreview.url}
          name={mediaPreview.label}
          prompt={mediaPreview.prompt}
          fileId={mediaPreview.fileId}
          onClose={() => setMediaPreview(null)}
          onNameChange={(newName) => setMediaPreview({ ...mediaPreview, label: newName })}
        />
      )}
      {mediaPreview && mediaPreview.type === 'video' && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4" style={{ zIndex: 99999 }}
          onClick={() => setMediaPreview(null)}>
          <div className="bg-[#1A1A1A] rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-[#3D3D3D]">
              <h3 className="text-white font-medium">{mediaPreview.label || 'Video Preview'}</h3>
              <button onClick={() => setMediaPreview(null)} className="text-gray-400 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <video src={mediaPreview.url} controls autoPlay className="w-full rounded-lg" style={{ maxHeight: '70vh' }} />
            </div>
          </div>
        </div>
      )}

      {/* Manage Persona Dialog */}
      {showManagePersona && (
        <ManagePersonaDialog companyId={companyId} onClose={() => setShowManagePersona(false)} />
      )}

      {/* Create Persona Dialog */}
      {showPersonaCreateDialog && personaSourceSong && (
        <CreatePersonaDialog
          audioUrl={personaSourceSong.sourceUrl}
          taskId={personaSourceSong.taskId}
          audioId={personaSourceSong.audioId}
          fileId={personaSourceSong.fileId}
          companyId={companyId}
          userId={clerkUser?.id || ""}
          onClose={() => setShowPersonaCreateDialog(false)}
        />
      )}

      {/* Element Library Modal */}
      {showElementLibrary && projectId && userId && user && (
        <ElementLibrary
          projectId={projectId}
          userId={userId}
          user={user}
          onClose={() => setShowElementLibrary(false)}
          imageSelectionMode={true}
          onSendToStudio={(prompt, refUrls) => {
            // Inject prompt into the prompt editor
            const el = editorRef.current;
            if (el) {
              el.textContent = prompt;
              setCurrentPrompt(prompt);
              setEditorIsEmpty(false);
              onUserPromptChange?.(prompt);
            }
            // Add reference images
            if (refUrls && refUrls.length > 0) {
              refUrls.forEach(url => handleImageSelect('element', {
                url,
                name: 'forge-reference',
                metadata: { source: 'element-forge', selectedAt: Date.now() }
              }));
            }
            setShowElementLibrary(false);
          }}
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
