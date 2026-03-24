"use client";

import { useUser } from "@clerk/nextjs";
import { getCurrentCompanyId } from "@/lib/auth-utils";
import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Sparkles, Loader2, X, Zap, Image as ImageIcon, CheckCircle2 } from "lucide-react";
import { STYLE_PRESETS, IMAGE_CREDITS, type ImageStyle, type ImageQuality } from "@/lib/storyboard/kieAI";

interface ImageAIPanelProps {
  projectId: Id<"storyboard_projects">;
  items: Array<{
    _id: Id<"storyboard_items">;
    title: string;
    description?: string;
    imageUrl?: string;
    generationStatus: string;
    order: number;
  }>;
  selectedItemIds: string[];
  frameRatio: string;
  projectStyle: string;
  userId: string;
  orgId: string;
  user: any; // Clerk user object
  onClose: () => void;
  characterRef?: { name: string; urls: string[] } | null;
}

export function ImageAIPanel({
  projectId, items, selectedItemIds, frameRatio, projectStyle, userId, orgId, user, onClose, characterRef,
}: ImageAIPanelProps) {
  const [style, setStyle] = useState<ImageStyle>(
    (projectStyle as ImageStyle) in STYLE_PRESETS ? (projectStyle as ImageStyle) : "cinematic"
  );
  const [quality, setQuality] = useState<ImageQuality>("standard");
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<Record<string, "pending" | "done" | "error">>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateItem = useMutation(api.storyboard.storyboardItems.update);
  const logCredit = useMutation(api.storyboard.creditUsage.log);

  const targetIds = selectedItemIds.length > 0
    ? selectedItemIds
    : items.filter((i) => !i.imageUrl).map((i) => i._id);

  const handleGenerate = async () => {
    if (targetIds.length === 0) return;
    setGenerating(true);
    setErrorMsg(null);

    const initial: Record<string, "pending" | "done" | "error"> = {};
    targetIds.forEach((id) => { initial[id] = "pending"; });
    setProgress(initial);

    for (const rawId of targetIds) {
      const id = rawId as Id<"storyboard_items">;
      const item = items.find((i) => i._id === id);
      if (!item) continue;

      try {
        await updateItem({
          id,
          generationStatus: "generating",
        });

        const res = await fetch("/api/storyboard/generate-image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sceneContent: item.description ?? item.title,
            style,
            quality,
            aspectRatio: frameRatio,
            itemId: id,
            enhance: true,
            characterContext: characterRef?.urls.length
              ? `Character reference: ${characterRef.name}. Maintain consistent appearance throughout.`
              : undefined,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        await updateItem({
          id,
          imageGeneration: {
            model: STYLE_PRESETS[style].model,
            creditsUsed: IMAGE_CREDITS[quality],
            status: "generating",
            taskId: data.taskId,
          },
          generationStatus: "generating",
        });

        const companyId = getCurrentCompanyId(user);
        
        await logImageGeneration({
          projectId,
          model: STYLE_PRESETS[style].model,
          creditsUsed: IMAGE_CREDITS[quality],
          metadata: { style, quality, taskId: data.taskId },
          companyId: companyId,
        });

        await logCredit({
          orgId,
          userId,
          projectId,
          itemId: id,
          action: "image_generation",
          model: STYLE_PRESETS[style].model,
          creditsUsed: IMAGE_CREDITS[quality],
          metadata: { style, quality, taskId: data.taskId },
          companyId: companyId,
        });

        setProgress((prev) => ({ ...prev, [id]: "done" }));
      } catch (err) {
        console.error("[ImageAIPanel]", err);
        await updateItem({ id, generationStatus: "failed" });
        setProgress((prev) => ({ ...prev, [id]: "error" }));
        setErrorMsg(String(err));
      }
    }

    setGenerating(false);
  };

  const pendingCount = targetIds.length;
  const totalCredits = pendingCount * IMAGE_CREDITS[quality];

  return (
    <div className="flex flex-col h-full bg-[#14141e] border-l border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span className="text-sm font-semibold text-white">Image AI</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/8 rounded-lg transition">
          <X className="w-4 h-4 text-gray-400" />============
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Target info */}
        <div className="p-3 bg-white/4 rounded-lg border border-white/6 space-y-2">
          <p className="text-xs text-gray-400">
            {selectedItemIds.length > 0
              ? `${selectedItemIds.length} selected frame${selectedItemIds.length > 1 ? "s" : ""}`
              : `${pendingCount} frames without images`}
          </p>
          {characterRef && (
            <div className="flex items-center gap-1.5 pt-1">
              <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <p className="text-[11px] text-emerald-300">
                Character: <span className="font-medium">{characterRef.name}</span>
              </p>
            </div>
          )}
        </div>

        {/* Style picker */}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Art Style</p>
          <div className="grid grid-cols-2 gap-2">
            {(Object.entries(STYLE_PRESETS) as [ImageStyle, typeof STYLE_PRESETS[ImageStyle]][]).map(([key, preset]) => (
              <button key={key} onClick={() => setStyle(key)}
                className={`p-2.5 rounded-lg border text-left transition ${
                  style === key
                    ? "border-purple-500 bg-purple-600/15 text-purple-300"
                    : "border-white/8 text-gray-400 hover:border-white/20"
                }`}>
                <p className="text-xs font-medium">{preset.label}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Quality</p>
          <div className="flex gap-2">
            {(["standard", "high"] as ImageQuality[]).map((q) => (
              <button key={q} onClick={() => setQuality(q)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                  quality === q
                    ? "border-purple-500 bg-purple-600/15 text-purple-300"
                    : "border-white/8 text-gray-400 hover:border-white/20"
                }`}>
                {q === "standard" ? "Standard" : "High"}{" "}
                <span className="opacity-60">({IMAGE_CREDITS[q]} cr)</span>
              </button>
            ))}
          </div>
        </div>

        {/* Credits summary */}
        <div className="flex items-center gap-2 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-lg">
          <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300">
            {totalCredits} credits · {pendingCount} frame{pendingCount !== 1 ? "s" : ""}
          </p>
        </div>

        {/* Progress list */}
        {Object.keys(progress).length > 0 && (
          <div className="space-y-1.5">
            {targetIds.map((id) => {
              const item = items.find((i) => i._id === id);
              const st = progress[id];
              return (
                <div key={id} className="flex items-center gap-2.5 p-2 bg-white/3 rounded-lg">
                  {st === "pending" && <Loader2 className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" />}
                  {st === "done" && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                  {st === "error" && <X className="w-3.5 h-3.5 text-red-400 shrink-0" />}
                  <p className="text-xs text-gray-300 truncate">{item?.title ?? id}</p>
                </div>
              );
            })}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-xs text-red-400">{errorMsg}</p>
          </div>
        )}
      </div>

      {/* Generate button */}
      <div className="p-4 border-t border-white/8 shrink-0">
        <button onClick={handleGenerate}
          disabled={generating || pendingCount === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><ImageIcon className="w-4 h-4" /> Generate 8888 {pendingCount > 1 ? `${pendingCount} Images` : "Image"}</>}
        </button>
      </div>
    </div>
  );
}
