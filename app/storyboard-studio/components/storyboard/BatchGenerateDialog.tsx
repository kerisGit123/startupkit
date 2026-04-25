"use client";

import { useState, useMemo } from "react";
import { toast } from "sonner";
import { Sparkles, X, Loader2, Image, AlertTriangle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { STYLE_PROMPTS, FORMAT_PROMPT_MAP } from "../../constants";

interface BatchGenerateDialogProps {
  projectId: Id<"storyboard_projects">;
  companyId: string;
  userId: string;
  items: Array<{
    _id: Id<"storyboard_items">;
    title: string;
    imagePrompt?: string;
    imageUrl?: string;
    linkedElements?: Array<{ id: string; name: string; type: string }>;
  }>;
  project: {
    style?: string;
    stylePrompt?: string;
    formatPreset?: string;
    colorPalette?: { referenceUrl?: string; colors: string[] };
    settings: { frameRatio: string };
  };
  onClose: () => void;
}

// Models that support reference images (for linked elements)
const REF_MODELS = [
  { id: "nano-banana-2", name: "Nano Banana 2", qualities: ["1K", "2K", "4K"], defaultQuality: "1K", creditBase: 8 },
  { id: "nano-banana-pro", name: "Nano Banana Pro", qualities: ["1K", "2K", "4K"], defaultQuality: "1K", creditBase: 18 },
  { id: "gpt-image-2-image-to-image", name: "GPT Image 2", qualities: ["standard"], defaultQuality: "standard", creditBase: 12 },
];

// Models that don't support reference images
const NO_REF_MODELS = [
  { id: "z-image", name: "Z-Image", qualities: ["standard"], defaultQuality: "standard", creditBase: 1 },
];

export function BatchGenerateDialog({ projectId, companyId, userId, items, project, onClose }: BatchGenerateDialogProps) {
  const [selectedModel, setSelectedModel] = useState(REF_MODELS[0].id);
  const [quality, setQuality] = useState(REF_MODELS[0].defaultQuality);
  const [skipExisting, setSkipExisting] = useState(true);
  const [useElements, setUseElements] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0, failed: 0 });

  const balance = useQuery(api.credits.getBalance, { companyId });
  const elements = useQuery(api.storyboard.storyboardElements.listByProject, { projectId });

  // Available models based on useElements toggle
  const availableModels = useMemo(() => {
    return useElements ? REF_MODELS : [...REF_MODELS, ...NO_REF_MODELS];
  }, [useElements]);

  const currentModel = availableModels.find(m => m.id === selectedModel) || availableModels[0];

  // Frames to generate
  const framesToGenerate = useMemo(() => {
    return items.filter(item => {
      if (!item.imagePrompt?.trim()) return false;
      if (skipExisting && item.imageUrl) return false;
      return true;
    });
  }, [items, skipExisting]);

  // Skip reasons for user feedback
  const skipReasons = useMemo(() => {
    const noPrompt = items.filter(item => !item.imagePrompt?.trim()).length;
    const hasImage = skipExisting ? items.filter(item => item.imagePrompt?.trim() && item.imageUrl).length : 0;
    return { noPrompt, hasImage };
  }, [items, skipExisting]);

  // Credit cost per frame
  const creditPerFrame = useMemo(() => {
    const model = availableModels.find(m => m.id === selectedModel);
    if (!model) return 0;
    if (model.id === "z-image") return 1;
    if (model.id === "gpt-image-2-image-to-image") return 12;
    // Nano banana pricing by quality
    const qualityMultiplier = quality === "4K" ? (model.id === "nano-banana-pro" ? 24 : 18)
      : quality === "2K" ? (model.id === "nano-banana-pro" ? 18 : 12)
      : model.creditBase;
    return qualityMultiplier;
  }, [selectedModel, quality, availableModels]);

  const totalCredits = framesToGenerate.length * creditPerFrame;
  const hasEnoughCredits = (typeof balance === "number") && balance >= totalCredits;

  // Build prompt with project style/format/colors
  const buildPrompt = (imagePrompt: string) => {
    const parts: string[] = [];
    if (project.stylePrompt) parts.push(project.stylePrompt);
    if (project.formatPreset && FORMAT_PROMPT_MAP[project.formatPreset]) {
      parts.push(FORMAT_PROMPT_MAP[project.formatPreset]);
    }
    if (project.colorPalette?.colors?.length) {
      const colorHexes = project.colorPalette.colors.map(c => c.toUpperCase()).join(', ');
      parts.push(`Color graded with dominant palette: ${colorHexes}.`);
    }
    if (parts.length > 0) {
      return parts.join(' ') + ' ' + imagePrompt;
    }
    return imagePrompt;
  };

  // Get reference image URLs from linked elements
  const getElementReferenceUrls = (linkedElements?: Array<{ id: string; name: string; type: string }>) => {
    if (!useElements || !linkedElements?.length || !elements?.length) return [];
    const urls: string[] = [];
    for (const linked of linkedElements) {
      const element = elements.find(el => String(el._id) === linked.id);
      if (element) {
        // Use primary thumbnail first, then reference URLs
        if (element.thumbnailUrl) urls.push(element.thumbnailUrl);
        if (element.referenceUrls?.length) {
          for (const url of element.referenceUrls) {
            if (!urls.includes(url)) urls.push(url);
          }
        }
      }
    }
    return urls;
  };

  const handleBatchGenerate = async () => {
    if (framesToGenerate.length === 0) return;
    if (!hasEnoughCredits) {
      toast.error(`Insufficient credits. Need ${totalCredits} but have ${balance}.`);
      return;
    }

    setIsGenerating(true);
    setProgress({ current: 0, total: framesToGenerate.length, failed: 0 });

    let failedCount = 0;

    for (let i = 0; i < framesToGenerate.length; i++) {
      const item = framesToGenerate[i];
      setProgress(prev => ({ ...prev, current: i + 1 }));

      try {
        const prompt = buildPrompt(item.imagePrompt!);
        const referenceImageUrls = getElementReferenceUrls(item.linkedElements);

        await fetch('/api/storyboard/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneContent: prompt,
            style: "realistic",
            quality: quality,
            aspectRatio: project.settings.frameRatio || "16:9",
            itemId: item._id,
            enhance: false, // Prompt already includes style/format
            companyId,
            userId,
            projectId,
            creditsUsed: creditPerFrame,
            model: selectedModel,
            referenceImageUrls: referenceImageUrls.length > 0 ? referenceImageUrls : undefined,
          }),
        });

        // 1 second delay between calls
        if (i < framesToGenerate.length - 1) {
          await new Promise(r => setTimeout(r, 1000));
        }
      } catch (error) {
        console.error(`[BatchGenerate] Frame "${item.title}" failed:`, error);
        failedCount++;
      }
    }

    setProgress(prev => ({ ...prev, failed: failedCount }));
    setIsGenerating(false);

    if (failedCount === 0) {
      toast.success(`All ${framesToGenerate.length} frames queued for generation!`);
    } else {
      toast.warning(`${framesToGenerate.length - failedCount} queued, ${failedCount} failed. Check failed frames in storyboard.`);
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={!isGenerating ? onClose : undefined} />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl w-[420px] shadow-2xl z-50"
        onClick={(e) => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#3D3D3D]">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" />
            <h3 className="text-sm font-semibold text-white">Batch Generate Images</h3>
          </div>
          {!isGenerating && (
            <button onClick={onClose} className="text-[#6E6E6E] hover:text-white transition">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-4">
          {/* Model selector */}
          <div>
            <label className="text-[11px] text-[#A0A0A0] font-medium mb-1.5 block">Model</label>
            <select
              value={selectedModel}
              onChange={(e) => {
                setSelectedModel(e.target.value);
                const model = availableModels.find(m => m.id === e.target.value);
                if (model) setQuality(model.defaultQuality);
              }}
              disabled={isGenerating}
              className="w-full px-3 py-2 bg-[#141418] border border-[#2A2A32] rounded-lg text-xs text-white outline-none focus:border-blue-500/50 transition"
            >
              {availableModels.map(m => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>

          {/* Resolution */}
          {currentModel.qualities.length > 1 && (
            <div>
              <label className="text-[11px] text-[#A0A0A0] font-medium mb-1.5 block">Resolution</label>
              <div className="flex gap-2">
                {currentModel.qualities.map(q => (
                  <button
                    key={q}
                    onClick={() => setQuality(q)}
                    disabled={isGenerating}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition border ${
                      quality === q
                        ? "bg-blue-500/15 border-blue-500/40 text-blue-400"
                        : "bg-[#141418] border-[#2A2A32] text-[#A0A0A0] hover:border-blue-500/20"
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Project settings (read-only) */}
          <div className="flex flex-wrap gap-2">
            <span className="text-[10px] px-2 py-1 rounded-full bg-white/5 border border-white/10 text-[#A0A0A0]">
              {project.settings.frameRatio || "16:9"}
            </span>
            {project.style && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">
                {project.style}
              </span>
            )}
            {project.formatPreset && (
              <span className="text-[10px] px-2 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-300">
                {project.formatPreset}
              </span>
            )}
            {project.colorPalette?.colors?.length ? (
              <div className="flex items-center gap-0.5 px-2 py-1 rounded-full bg-white/5 border border-white/10">
                {project.colorPalette.colors.slice(0, 5).map((c, i) => (
                  <div key={i} className="w-3 h-3 rounded-full" style={{ backgroundColor: c }} />
                ))}
              </div>
            ) : null}
          </div>

          {/* Toggles */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={skipExisting}
                onChange={(e) => setSkipExisting(e.target.checked)}
                disabled={isGenerating}
                className="w-3.5 h-3.5 rounded border-[#3D3D3D] bg-[#141418] text-blue-500 focus:ring-0"
              />
              <span className="text-xs text-[#A0A0A0]">Skip frames that already have images</span>
            </label>
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useElements}
                onChange={(e) => {
                  setUseElements(e.target.checked);
                  // Reset to ref model if switching to elements mode
                  if (e.target.checked && !REF_MODELS.find(m => m.id === selectedModel)) {
                    setSelectedModel(REF_MODELS[0].id);
                    setQuality(REF_MODELS[0].defaultQuality);
                  }
                }}
                disabled={isGenerating}
                className="w-3.5 h-3.5 rounded border-[#3D3D3D] bg-[#141418] text-blue-500 focus:ring-0"
              />
              <span className="text-xs text-[#A0A0A0]">Use linked elements as reference images</span>
            </label>
            {useElements && !REF_MODELS.find(m => m.id === selectedModel) && (
              <p className="text-[10px] text-amber-400 flex items-center gap-1 ml-5">
                <AlertTriangle className="w-3 h-3" />
                Selected model doesn't support reference images
              </p>
            )}
          </div>

          {/* Credits summary */}
          <div className="bg-[#141418] border border-[#2A2A32] rounded-lg px-4 py-3 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A0A0]">Frames to generate</span>
              <span className="text-white font-medium">{framesToGenerate.length} / {items.length}</span>
            </div>
            {skipReasons.noPrompt > 0 && (
              <p className="text-[10px] text-amber-400 ml-1">{skipReasons.noPrompt} frame{skipReasons.noPrompt > 1 ? "s have" : " has"} no prompt</p>
            )}
            {skipReasons.hasImage > 0 && (
              <p className="text-[10px] text-[#6E6E6E] ml-1">{skipReasons.hasImage} frame{skipReasons.hasImage > 1 ? "s" : ""} skipped (already have images)</p>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A0A0]">Credits per frame</span>
              <span className="text-white font-medium">{creditPerFrame}</span>
            </div>
            <div className="h-px bg-[#2A2A32] my-1" />
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A0A0]">Total credits</span>
              <span className={`font-semibold ${hasEnoughCredits ? 'text-white' : 'text-red-400'}`}>{totalCredits}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#A0A0A0]">Your balance</span>
              <span className="text-white">{typeof balance === "number" ? balance.toLocaleString() : "..."}</span>
            </div>
            {!hasEnoughCredits && typeof balance === "number" && (
              <p className="text-[10px] text-red-400 flex items-center gap-1 mt-1">
                <AlertTriangle className="w-3 h-3" />
                Insufficient credits. Need {totalCredits - balance} more.
              </p>
            )}
          </div>

          {/* Progress */}
          {isGenerating && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                <span className="text-xs text-white">
                  Generating {progress.current}/{progress.total}...
                  {progress.failed > 0 && <span className="text-red-400 ml-1">({progress.failed} failed)</span>}
                </span>
              </div>
              <div className="w-full h-1.5 bg-[#2A2A32] rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-[#3D3D3D]">
          {!isGenerating && (
            <button onClick={onClose}
              className="px-4 py-2 text-xs text-[#A0A0A0] hover:text-white bg-[#141418] border border-[#2A2A32] rounded-lg transition">
              Cancel
            </button>
          )}
          <button
            onClick={handleBatchGenerate}
            disabled={isGenerating || framesToGenerate.length === 0 || !hasEnoughCredits}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg transition font-medium text-xs disabled:opacity-50 disabled:cursor-not-allowed bg-blue-500 hover:bg-blue-400 text-white"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Image className="w-3.5 h-3.5" />
                Generate {framesToGenerate.length} Frames
                <span className="opacity-75">→ {totalCredits} cr</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}
