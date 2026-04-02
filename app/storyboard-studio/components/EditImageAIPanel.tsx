"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { usePricingData } from "./usePricingData";
import type { Id } from "@/convex/_generated/dataModel";
import { useMutation, useQuery } from "convex/react";
import { useUser, useOrganization } from "@clerk/nextjs";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { api } from "@/convex/_generated/api";
import { FileBrowser } from "./storyboard/FileBrowser";
import { ElementLibrary } from "./storyboard/ElementLibrary";
import PromptLibrary from "./storyboard/PromptLibrary";
import {
  Hand, Copy, Type, ArrowUpRight, Minus, Square, Circle, Pencil,
  Eraser, Brush, Undo2, Redo2, ChevronDown, Plus, X, Sparkles,
  Upload, Download, Save, History, Trash2, BookOpen, FolderOpen, FileText, Camera, Zap,
  ZoomIn, ZoomOut, Maximize2, MessageSquareText, Scan, Wand2, Scissors, MousePointer, RectangleHorizontal, Image, ArrowUp,
  Eye, EyeOff, Bug, Video,
} from "lucide-react";

// Import Paintbrush separately to avoid conflicts
const Paintbrush = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
  </svg>
);

// ── Types ─────────────────────────────────────────────────────────────
export type AIEditMode = "area-edit" | "annotate";

interface ReferenceImage {
  id: string;
  url: string;
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
  onRectangleMaskAspectRatioChange?: (aspectRatio: string) => void; // Add handler for rectangle mask aspect ratio changes
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
  const companyId = organization?.id ?? clerkUser?.id ?? "personal";
  const userId = clerkUser?.id; // Add missing userId variable
  const [activeTool, setActiveTool] = useState("canvas-object");
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [contentType, setContentType] = useState("image");
  const { models, loading: pricingLoading, error: pricingError } = usePricingData();
  const [selectedQuality, setSelectedQuality] = useState("1K"); // Default quality for Nano Banana/Topaz
  const [gptImageQuality, setGptImageQuality] = useState("medium"); // Default quality for GPT Image
  
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

  // Local helper to match the old usePricingModels API
  const getModelCredits = useCallback((modelId: string): number => {
    console.log('[EditImageAIPanel] getModelCredits called with modelId:', modelId);
    console.log('[EditImageAIPanel] Available models in pricing:', models.map(m => ({ 
      modelId: m.modelId, 
      creditCost: m.creditCost, 
      pricingType: m.pricingType,
      factor: m.factor,
      assignedFunction: m.assignedFunction
    })));
    console.log('[EditImageAIPanel] Full model objects:', JSON.stringify(models, null, 2));
    
    // Try to find exact match first
    let model = models.find(m => m.modelId === modelId);
    
    // If not found, try to find partial match (for GPT Image variations)
    if (!model && modelId.includes('gpt-image')) {
      console.log('[EditImageAIPanel] Exact match not found, searching for GPT Image models...');
      model = models.find(m => m.modelId.includes('gpt-image'));
      if (model) {
        console.log('[EditImageAIPanel] Found GPT Image model with partial match:', model.modelId);
      }
    }
    
    if (!model) {
      console.log("[EditImageAIPanel] Model not found:", modelId);
      return 0;
    }
    
    console.log("[EditImageAIPanel] Using model:", { modelId: model.modelId, creditCost: model.creditCost, pricingType: model.pricingType });
    
    console.log("[EditImageAIPanel] Calculating credits for:", modelId, {
      pricingType: model.pricingType,
      assignedFunction: model.assignedFunction,
      creditCost: model.creditCost,
      factor: model.factor,
      selectedQuality
    });
    
        
    if (model.pricingType === 'fixed') {
      const result = Math.ceil((model.creditCost || 0) * (model.factor || 1));
      console.log("[EditImageAIPanel] Fixed pricing result:", result);
      return result;
    }
    
    // Formula-based pricing (use selected quality for multipliers)
    if (model.assignedFunction) {
      const base = model.creditCost || 0;
      const factor = model.factor || 1;
      
      switch (model.assignedFunction) {
        case 'getNanoBananaPrice':
          // Use formulaJson for Nano Banana pricing (same as other formula-based models)
          console.log("[EditImageAIPanel] getNanoBananaPrice called for:", { modelId, selectedQuality, model });
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              console.log("[EditImageAIPanel] Parsed formula:", formula);
              const quality = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              console.log("[EditImageAIPanel] Found quality:", quality, "for selectedQuality:", selectedQuality);
              if (quality) {
                const factor = model.factor || 1;
                const result = Math.ceil(quality.cost * factor);
                console.log("[EditImageAIPanel] Nano Banana from formula:", { 
                  modelId, 
                  selectedQuality, 
                  cost: quality.cost, 
                  factor, 
                  result 
                });
                return result;
              } else {
                console.log("[EditImageAIPanel] Quality not found, available qualities:", formula.pricing?.qualities);
              }
            } catch (e) {
              console.error("[EditImageAIPanel] Error parsing Nano Banana formula:", e);
            }
          }
          // Fallback to hardcoded multipliers if formula parsing fails
          const qualityMultipliers = { '1K': 1, '2K': 1.5, '4K': 2.25 };
          const qualityMultiplier = qualityMultipliers[selectedQuality as keyof typeof qualityMultipliers] || 1;
          const nanoResult = Math.ceil(base * factor * qualityMultiplier);
          console.log("[EditImageAIPanel] Nano Banana fallback pricing:", { 
            modelId, 
            base, 
            factor, 
            qualityMultiplier, 
            selectedQuality, 
            calculation: `${base} * ${factor} * ${qualityMultiplier} = ${base * factor * qualityMultiplier}`,
            result: nanoResult 
          });
          return nanoResult;
        case 'getSeedance15':
          const resolutionMultipliers = { '480p': 1, '720p': 2, '1080p': 4, '4K': 5 };
          const resolutionMultiplier = resolutionMultipliers['720p'] || 1;
          const audioMultiplier = 1;
          const durationMultiplier = 1;
          return Math.ceil(base * factor * resolutionMultiplier * audioMultiplier * durationMultiplier);
        case 'getTopazUpscale':
          // Use formulaJson for Topaz Upscale pricing (same as other formula-based models)
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const quality = formula.pricing?.qualities?.find((q: any) => q.name === selectedQuality);
              if (quality) {
                const factor = model.factor || 1;
                const result = Math.ceil(quality.cost * factor);
                console.log("[EditImageAIPanel] Topaz Upscale from formula:", { 
                  modelId, 
                  selectedQuality, 
                  cost: quality.cost, 
                  factor, 
                  result 
                });
                return result;
              }
            } catch (e) {
              console.error("[EditImageAIPanel] Error parsing Topaz Upscale formula:", e);
            }
          }
          // Fallback to hardcoded multipliers if formula parsing fails
          const upscaleMultipliers = { '1x': 1, '2x': 2, '3x': 3, '4x': 4 };
          // Map quality to upscale multiplier
          const qualityToUpscale = { '1K': '1x', '2K': '2x', '4K': '4x' };
          const upscaleKey = qualityToUpscale[selectedQuality as keyof typeof qualityToUpscale] || '2x';
          const upscaleMultiplier = upscaleMultipliers[upscaleKey as keyof typeof upscaleMultipliers] || 1;
          const topazResult = Math.ceil(base * factor * upscaleMultiplier);
          console.log("[EditImageAIPanel] Topaz Upscale fallback pricing:", { 
            modelId, 
            base, 
            factor, 
            upscaleKey, 
            upscaleMultiplier, 
            selectedQuality, 
            calculation: `${base} * ${factor} * ${upscaleMultiplier} = ${base * factor * upscaleMultiplier}`,
            result: topazResult 
          });
          return topazResult;
        case 'getGptImagePrice':
          // GPT Image pricing: use formula from database dynamically
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const gptQuality = (modelId === "gpt-image/1.5-image-to-image" || modelId === "gpt-image/1.5-text-to-image") ? gptImageQuality : selectedQuality;
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === gptQuality);
              console.log("[EditImageAIPanel] GPT Image formula:", { formula, gptQuality, qualityData });
              
              if (qualityData) {
                const factor = model.factor || 1;
                const gptResult = Math.ceil(qualityData.cost * factor);
                console.log("[EditImageAIPanel] GPT Image from formula:", { 
                  modelId, 
                  gptQuality, 
                  cost: qualityData.cost, 
                  factor, 
                  result: gptResult 
                });
                return gptResult;
              } else {
                console.log("[EditImageAIPanel] GPT Image quality not found, available qualities:", formula.pricing?.qualities);
              }
            } catch (e) {
              console.error("[EditImageAIPanel] Error parsing GPT Image formula:", e);
            }
          }
          // Fallback to simple calculation if formula parsing fails
          console.log("[EditImageAIPanel] GPT Image fallback pricing:", { modelId, base, factor });
          return Math.ceil(base * factor);
        case 'getRecraftCrispUpscale':
          // Recraft Crisp Upscale pricing: use formula from database dynamically
          if (model.formulaJson) {
            try {
              const formula = JSON.parse(model.formulaJson);
              const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === "standard");
              console.log("[EditImageAIPanel] Recraft Crisp formula:", { formula, qualityData });
              
              if (qualityData) {
                const factor = model.factor || 1;
                const recraftResult = Math.ceil(qualityData.cost * factor);
                console.log("[EditImageAIPanel] Recraft Crisp from formula:", { 
                  modelId, 
                  cost: qualityData.cost, 
                  factor, 
                  result: recraftResult 
                });
                return recraftResult;
              } else {
                console.log("[EditImageAIPanel] Recraft Crisp quality not found, available qualities:", formula.pricing?.qualities);
              }
            } catch (e) {
              console.error("[EditImageAIPanel] Error parsing Recraft Crisp formula:", e);
            }
          }
          // Fallback to simple calculation if formula parsing fails
          console.log("[EditImageAIPanel] Recraft Crisp fallback pricing:", { modelId, base, factor });
          return Math.ceil(base * factor);
        default:
          console.log("[EditImageAIPanel] Unknown assigned function, using fallback");
          // Special case for Recraft Crisp: use correct base cost of 0.5 instead of database value
          if (modelId === 'recraft/crisp-upscale') {
            const recraftBaseCost = 0.5;
            const recraftFactor = 1.3;
            const recraftResult = Math.ceil(recraftBaseCost * recraftFactor);
            console.log("[EditImageAIPanel] Recraft Crisp special pricing:", { 
              modelId, 
              baseCost: recraftBaseCost, 
              factor: recraftFactor, 
              result: recraftResult 
            });
            return recraftResult; // 0.5 × 1.3 = 0.65 → 1 credit
          }
          return Math.ceil((model.creditCost || 0) * (model.factor || 1));
      }
    } else {
      console.log("[EditImageAIPanel] No assigned function, using simple calculation");
      // For fixed pricing models, use correct values when database has wrong ones
      if (modelId === 'recraft/crisp-upscale') {
        // Recraft Crisp should be 0.5 * 1.3 = 1 credit (from usePricingData.ts defaults)
        const recraftBaseCost = 0.5;
        const recraftFactor = 1.3;
        const recraftResult = Math.ceil(recraftBaseCost * recraftFactor);
        console.log("[EditImageAIPanel] Recraft Crisp fixed pricing (database had wrong values):", { 
          modelId, 
          databaseCost: model.creditCost,
          correctCost: recraftBaseCost, 
          factor: recraftFactor, 
          result: recraftResult 
        });
        return recraftResult;
      }
      return Math.ceil((model.creditCost || 0) * (model.factor || 1));
    }
  }, [models, selectedQuality, gptImageQuality]);

  // ── ContentEditable editor helpers ──────────────────────────────────

  // Extract plain text from contentEditable for prompt generation (excluding badges)
  const extractPlainText = (): string => {
    const el = editorRef.current;
    if (!el) return "";
    const collect = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      const htmlEl = node as HTMLElement;
      if (htmlEl.nodeName === "BR") return "\n";
      
      // Exclude badge mentions from prompt text - they should not affect the prompt
      if (htmlEl.dataset?.type === "mention") {
        return ""; // Don't include badge content in prompt
      }
      
      let result = "";
      node.childNodes.forEach((child) => { result += collect(child); });
      if (htmlEl.tagName === "DIV" && node !== el) result += "\n";
      return result;
    };
    return collect(el).replace(/\n$/, "");
  };

  // Extract text WITH badges for test button display
  const extractTextWithBadges = (): string => {
    const el = editorRef.current;
    if (!el) return "";
    const collect = (node: Node): string => {
      if (node.nodeType === Node.TEXT_NODE) return node.textContent ?? "";
      const htmlEl = node as HTMLElement;
      if (htmlEl.nodeName === "BR") return "\n";
      
      // Include badge mentions for test display
      if (htmlEl.dataset?.type === "mention") {
        // Extract the badge text from the label element
        const label = htmlEl.querySelector('span[class*="text-cyan-300"]');
        if (label) {
          return label.textContent || "";
        }
        return "";
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
    
    // Create a space element with non-breaking space to ensure spacing
    const spaceBefore = document.createTextNode('\u00A0'); // Non-breaking space
    range.insertNode(spaceBefore);
    
    // Insert the badge
    const badge = createBadgeElement(entry);
    range.insertNode(badge);
    
    // Create a space element with non-breaking space after the badge
    const spaceAfter = document.createTextNode('\u00A0'); // Non-breaking space
    range.insertNode(spaceAfter);
    
    // Add a regular space as well for better text flow
    const regularSpace = document.createTextNode(' ');
    range.insertNode(regularSpace);
    
    // Set cursor position after the badge and spaces
    const newRange = document.createRange();
    newRange.setStartAfter(regularSpace);
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

  // Add image as a new reference image (duplicate functionality)
  const addImageAsReference = (img: any, index: number) => {
    console.log('🎯 Plus icon clicked - adding as reference image!', { img, index });
    console.log('🎯 Current reference images count:', referenceImages?.length || 0);
    console.log('🎯 Max reference images:', maxReferenceImages);
    
    // Check if we've reached the maximum reference images limit
    if (maxReferenceImages > 0 && referenceImages.length >= maxReferenceImages) {
      console.log('❌ Reference limit reached:', referenceImages.length, '/', maxReferenceImages);
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
        source: 'duplicate',
        metadata: {
          originalId: img.id,
          originalSource: img.source,
          element: mockElement
        }
      });
      
      console.log('✅ Reference image added successfully!');
      
    } catch (error) {
      console.error('❌ Error adding reference image:', error);
      showToast('Failed to add reference image', 'error');
    }
  };

  const editorRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const backgroundInputRef = useRef<HTMLInputElement>(null);
  const isComposingRef = useRef(false);
  const savedSelectionRef = useRef<{ container: Node; offset: number } | null>(null);
  const [currentPrompt, setCurrentPrompt] = useState(userPrompt || "");
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
    { value: "nano-banana-2", label: "Nano Banana 2", sub: "General purpose", maxReferenceImages: 7, icon: Zap },
    { value: "nano-banana-pro", label: "Nano Banana Pro", sub: "Higher quality • Max 8 refs", maxReferenceImages: 8, icon: Camera },
  ];

  // Combine all models for the consolidated dropdown
  const allModelOptions = [...inpaintModelOptions];
  const selectedModelOption = allModelOptions.find((option) => option.value === model) ?? allModelOptions[0];

  // Handle keyboard events for copy and paste
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case 'c':
          // Copy functionality
          e.preventDefault();
          const selection = window.getSelection();
          if (selection && selection.toString()) {
            navigator.clipboard.writeText(selection.toString()).then(() => {
              console.log('Text copied to clipboard');
            }).catch(err => {
              console.error('Failed to copy text:', err);
            });
          }
          break;
        case 'v':
          // Enhanced paste functionality with proper cursor positioning
          e.preventDefault();
          navigator.clipboard.readText().then((text) => {
            if (text) {
              const editor = editorRef.current;
              if (!editor) return;
              
              // Get current selection
              const selection = window.getSelection();
              if (!selection) return;
              
              let range: Range;
              
              // Use existing selection range if available
              if (selection.rangeCount > 0) {
                range = selection.getRangeAt(0);
              } else {
                // Create a new range at the cursor position
                range = document.createRange();
                range.selectNodeContents(editor);
                range.collapse(false); // Collapse to end if no selection
              }
              
              // Check if range is valid and within the editor
              const rangeContainer = range.commonAncestorContainer;
              const isWithinEditor = editor.contains(rangeContainer) || rangeContainer === editor;
              
              if (!isWithinEditor) {
                // If range is outside editor, create a new range at the end
                range = document.createRange();
                range.selectNodeContents(editor);
                range.collapse(false);
              }
              
              // Delete any selected content
              if (!range.collapsed) {
                range.deleteContents();
              }
              
              // Create a text node with the pasted content
              const textNode = document.createTextNode(text);
              
              // Insert the text at the current cursor position
              range.insertNode(textNode);
              
              // Move cursor to the end of the inserted text
              range.setStartAfter(textNode);
              range.collapse(true);
              
              // Apply the new range to selection
              selection.removeAllRanges();
              selection.addRange(range);
              
              // Trigger input event to update state
              const inputEvent = new Event('input', { bubbles: true });
              editor.dispatchEvent(inputEvent);
              
              console.log('Text pasted at cursor position');
            }
          }).catch(err => {
            console.error('Failed to read clipboard:', err);
            // Fallback: let the default paste behavior handle it
            // This should respect cursor position naturally
            const pasteEvent = new ClipboardEvent('paste', {
              bubbles: true,
              cancelable: true,
              clipboardData: new DataTransfer()
            });
            
            // Try to trigger default paste by dispatching the event
            if (e.target) {
              (e.target as HTMLElement).dispatchEvent(pasteEvent);
            }
          });
          break;
      }
    }
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

  const handleEditorBlur = () => {
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      savedSelectionRef.current = { container: range.startContainer, offset: range.startOffset };
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = () => {
    isComposingRef.current = false;
    handleEditorInput();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
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

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
  };

  const requiresPrompt = activeTool === "text-to-image";
  const canGenerate = mode === "area-edit" && !isGenerating && (!requiresPrompt || !!currentPrompt.trim());
  
  const [showBrushSizeMenu, setShowBrushSizeMenu] = useState(false);
  const [showInpaintModelDropdown, setShowInpaintModelDropdown] = useState(false);

  // Constants for textarea
  const TEXTAREA_MIN_HEIGHT = 60;
  const TEXTAREA_MAX_HEIGHT = 200;

  // State for upload menu and prompt actions
  const [showUploadMenu, setShowUploadMenu] = useState(false);
  const [showPromptActions, setShowPromptActions] = useState(false);
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
    if (maxReferenceImages > 0 && referenceImages.length >= maxReferenceImages) {
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
          showToast('Image captured and added to reference images', 'success');
          console.log('✅ Successfully captured displayed image as reference');
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
    const credits = selected && (selected as any).credits ? (selected as any).credits : getModelCredits(normalizedModel);
    
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
      if (projectId) {
        setShowFileBrowser(true);
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
    } else if (id === "delete") {
      onDeleteSelected?.();
      setActiveTool("canvas-object");
      setShowBrushSizeMenu(false);
    } else if (id === "save") {
      onSaveSelectedImage?.();
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
        <div className={`flex flex-col gap-1 rounded-lg p-1 shadow-lg border ${
          mode === "annotate" 
            ? "bg-[#0a0a0f]/98 backdrop-blur-md border-white/10" 
            : "bg-[#0a0a0f]/98 backdrop-blur-md border-white/10"
        }`}>
          {mode === "annotate" ? (
            <>
              <ToolBtn active={activeTool === "canvas-object"} onClick={() => pick("canvas-object")} title="Canvas Object (no tool)">
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
              <ToolBtn active={activeTool === "canvas-object"} onClick={() => pick("canvas-object")} title="Canvas Object (no tool)">
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
              {/* Show/Hide Mask Toggle */}
              <ToolBtn active={showMask} onClick={() => setShowMask?.(!showMask)} title={showMask ? "Hide Mask" : "Show Mask"}>
                {showMask ? <Eye className={ic} /> : <EyeOff className={ic} />}
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
              <ToolBtn active={activeTool === "crop"} onClick={() => pick("crop")} title="Crop">
                <Scissors className={ic} />
              </ToolBtn>
              <ToolBtn active={activeTool === "upscale"} onClick={() => pick("upscale")} title="Upscale">
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

  // ── Right Toolbar (Annotate + Area Edit) ───────────────────────────
  const renderRightToolbar = () => {
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
        
        {/* Combined Upload Button with Slide Menu */}
        {maxReferenceImages > 0 && referenceImages.length < maxReferenceImages && (
          <div className="relative">
            {/* Add Button */}
            <button
              onClick={() => {
                console.log('🔥🔥🔥 ADD BUTTON CLICKED! 🔥🔥🔥');
                setShowUploadMenu(!showUploadMenu);
              }}
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
                          console.log('R2 button clicked!');
                          console.log('canOpenFileBrowser():', canOpenFileBrowser());
                          console.log('projectId:', projectId);
                          console.log('companyId:', companyId);
                          console.log('userId:', userId);
                          console.log('user:', clerkUser);
                          
                          if (!canOpenFileBrowser()) {
                            if (!projectId) {
                              showToast('Project ID required to browse R2 files', 'error');
                            } else if (!companyId) {
                              showToast('Company ID required to browse R2 files', 'error');
                            } else {
                              showToast('Project information required to browse R2 files', 'error');
                            }
                            return;
                          }
                          
                          console.log('Opening FileBrowser...');
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

    return (
      <div className="px-[10px] pt-[10px] pb-0">
        <div className="flex items-start gap-2">
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
                    onKeyDown={handleKeyDown}
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
                      character holding flower , need to preserve the surrounding . maintain the background, maintain exact proportions and height.
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
                              
                              // Debug: Show what each extraction method returns
                              console.log('=== DEBUG EXTRACTION ===');
                              console.log('HTML Content:', htmlContent);
                              console.log('Plain Text (no badges):', plainText);
                              console.log('Text with badges:', textWithBadges);
                              console.log('Mentions from HTML:', mentionsText);
                              
                              alert(`Current textarea content with badges:\n\n${textWithBadges}\n\n@MENTIONS FOUND:\n${mentionsText}\n\nPLAIN TEXT (for AI):\n${plainText}\n\n=== DEBUG INFO ===\nHTML: ${htmlContent.substring(0, 200)}...`);
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
                                  handleEditorInput();
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
                            <FileText className="w-4 h-4 text-orange-400" />
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
                                  handleEditorInput();
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
                            <Image className="w-4 h-4 text-cyan-400" />
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
                                  handleEditorInput();
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
                            <Video className="w-4 h-4 text-pink-400" />
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
      icon: React.ComponentType<{ className?: string }>;
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
                    // Auto-select canvas-object (no tool) when switching to area-edit
                    if (tab.id === "area-edit") {
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
      

          {/* Model Select Box (in area-edit mode) */}
          {mode === "area-edit" && modelOptions.length > 0 && (
            <div className="flex items-center gap-2">
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
                      {modelOptions.map((modelOption) => (
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

              {/* Quality Dropdown for Nano Banana, Topaz Upscale, and GPT Image 1.5 */}
              {(normalizedModel === "nano-banana-2" || normalizedModel === "nano-banana-pro" || normalizedModel === "topaz/image-upscale" || normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") && (
                <div className="relative" style={{ width: "80px" }}>
                  <button
                    onClick={() => setShowQualityDropdown(!showQualityDropdown)}
                    className="w-full flex items-center justify-between px-2 py-2 bg-[#1a1a24] text-white rounded-lg text-xs font-semibold hover:bg-[#1f1f2a] transition-all duration-200 border border-white/10 hover:border-blue-500/30 group"
                  >
                    <span className="text-xs">
                      {(normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") ? gptImageQuality : selectedQuality}
                    </span>
                    <ChevronDown className="w-3 h-3 text-gray-400 group-hover:text-blue-400 transition flex-shrink-0" />
                  </button>
                  {showQualityDropdown && (
                    <div className="absolute bottom-full left-0 mb-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                      <div className="p-1">
                        {getQualityOptions(normalizedModel).map((quality) => (
                          <button
                            key={quality}
                            onClick={() => {
                              if (normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") {
                                setGptImageQuality(quality);
                              } else {
                                setSelectedQuality(quality);
                                // Set default quality to first available option if current quality is not in options
                                const availableQualities = getQualityOptions(normalizedModel);
                                if (!availableQualities.includes(selectedQuality)) {
                                  setSelectedQuality(availableQualities[0]);
                                }
                              }
                              setShowQualityDropdown(false);
                            }}
                            className="w-full px-2 py-1 text-left hover:bg-white/5 rounded transition text-xs"
                          >
                            <div className="text-xs font-medium text-white">{quality}</div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Generate Button */}
          <button
            onClick={() => {
              // Ensure we're calling the n8n-image-proxy route
              if (mode === "area-edit" && onGenerate) {
                const modelId: string = typeof model === "string" && model.length > 0
                  ? model
                  : normalizedModel || "";
                const qualityToPass = (normalizedModel === "gpt-image/1.5-image-to-image" || normalizedModel === "gpt-image/1.5-text-to-image") ? gptImageQuality : selectedQuality;
                const creditsNeeded = getModelCredits(modelId);
                
                console.log('[EditImageAIPanel] Generate clicked with credits:', creditsNeeded, 'quality:', qualityToPass);
                console.log('[EditImageAIPanel] Current balance:', getBalance);
                
                // Check if user has sufficient credits before proceeding
                if (getBalance !== undefined && getBalance < creditsNeeded) {
                  alert(`❌ Insufficient credits. You have ${getBalance} credits but need ${creditsNeeded} credits. Please purchase more credits to continue.`);
                  return;
                }
                
                // Forward both credits and quality to SceneEditor
                onGenerate?.(creditsNeeded, qualityToPass);
                onGenerateQuality?.(qualityToPass);
              } else if (mode === "annotate") {
                console.log("[EditImageAIPanel] Generate not available in annotate mode");
              }
            }}
            disabled={!canGenerate}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition font-medium text-[13px] disabled:opacity-50 disabled:cursor-not-allowed ${
              !canGenerate
                ? "bg-gray-400 text-gray-600 cursor-not-allowed" 
                : "bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white"
            }`}
            title={
              mode === "annotate" 
                ? "Generate not available in annotate mode. Use area-edit mode for AI generation."
                : requiresPrompt && !currentPrompt.trim()
                ? "Please enter a prompt to generate an image."
                : undefined
            }
          >
            {isGenerating ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            <span className="hidden sm:inline">Generate</span>
            <span className="text-white/70 text-xs">✦ {(() => {
              const credits = getSelectedModelCredits();
              console.log('[DEBUG] Generate button rendering credits:', credits);
              return credits;
            })()}</span>
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
          <div className="pointer-events-auto">{renderRightToolbar()}</div>
        </div>

        {/* Bottom: Reference panel + Bottom bar */}
        <div className="pointer-events-auto">
          {renderBottomBar()}
        </div>
      </div>

      {/* Modals - rendered outside pointer-events-none container */}
      {showFileBrowser && projectId && (
        <div className="pointer-events-auto">
          <FileBrowser
            projectId={projectId}
            onClose={() => setShowFileBrowser(false)}
            imageSelectionMode={true} // Enable image selection mode
            filterTypes={['image']} // Only show images
            onSelectImage={(imageUrl, fileName, fileData) => {
              console.log('FileBrowser onSelectImage called:', { imageUrl, fileName, fileData });
              // Handle single image selection from R2 File Browser (same as VideoImageAIPanel)
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
        </div>
      )}

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
