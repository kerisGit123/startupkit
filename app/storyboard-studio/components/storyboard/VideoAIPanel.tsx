"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Video, Loader2, X, Zap, CheckCircle2, Film } from "lucide-react";
import {
  VIDEO_MODELS, calcVideoCredits, type VideoModel, type VideoQuality,
} from "@/lib/storyboard/videoAI";

interface VideoAIPanelProps {
  projectId: Id<"storyboard_projects">;
  items: Array<{
    _id: Id<"storyboard_items">;
    title: string;
    description?: string;
    imageUrl?: string;
    videoUrl?: string;
    generationStatus: string;
    duration: number;
    order: number;
  }>;
  selectedItemIds: string[];
  frameRatio: string;
  userId: string;
  orgId: string;
  onClose: () => void;
}

const QUALITY_LABELS: Record<string, string> = {
  fast: "Fast (80 cr)", quality: "Quality (325 cr)",
  std: "Standard", pro: "Pro",
};

export function VideoAIPanel({
  projectId, items, selectedItemIds, frameRatio, userId, orgId, onClose,
}: VideoAIPanelProps) {
  const [model, setModel] = useState<VideoModel>("kling-3.0");
  const [quality, setQuality] = useState<VideoQuality>("std");
  const [duration, setDuration] = useState(5);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState<Record<string, "pending" | "done" | "error">>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const updateItem = useMutation(api.storyboard.storyboardItems.update);
  const logCredit = useMutation(api.storyboard.creditUsage.log);

  const targetIds = selectedItemIds.length > 0
    ? selectedItemIds
    : items.filter((i) => !i.videoUrl && i.imageUrl).map((i) => i._id);

  const maxDur = VIDEO_MODELS[model].maxDuration;
  const credits = calcVideoCredits(model, quality, Math.min(duration, maxDur));
  const totalCredits = targetIds.length * credits;
  const qualities = VIDEO_MODELS[model].qualities as readonly VideoQuality[];

  const handleGenerate = async () => {
    if (targetIds.length === 0) return;
    setGenerating(true);
    setErrorMsg(null);

    const init: Record<string, "pending" | "done" | "error"> = {};
    targetIds.forEach((id) => { init[id] = "pending"; });
    setProgress(init);

    for (const id of targetIds) {
      const item = items.find((i) => i._id === id);
      if (!item) continue;

      try {
        await updateItem({ id, generationStatus: "generating" });

        const res = await fetch("/api/storyboard/generate-video", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            model,
            quality,
            duration: Math.min(duration, maxDur),
            aspectRatio: frameRatio,
            prompt: item.description ?? item.title,
            imageUrl: item.imageUrl,
            itemId: id,
          }),
        });

        const data = await res.json();
        if (data.error) throw new Error(data.error);

        await updateItem({
          id,
          videoGeneration: {
            model,
            mode: "image-to-video",
            quality,
            duration: Math.min(duration, maxDur),
            creditsUsed: data.creditsUsed,
            status: "generating",
            taskId: data.taskId,
          },
          generationStatus: "generating",
        });

        await logCredit({
          orgId,
          userId,
          projectId,
          itemId: id,
          action: "video_generation",
          model,
          creditsUsed: data.creditsUsed,
          metadata: { quality, duration, taskId: data.taskId },
        });

        setProgress((p) => ({ ...p, [id]: "done" }));
      } catch (err) {
        console.error("[VideoAIPanel]", err);
        await updateItem({ id, generationStatus: "failed" });
        setProgress((p) => ({ ...p, [id]: "error" }));
        setErrorMsg(String(err));
      }
    }

    setGenerating(false);
  };

  return (
    <div className="flex flex-col h-full bg-[#14141e] border-l border-white/8">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/8 shrink-0">
        <div className="flex items-center gap-2">
          <Video className="w-4 h-4 text-blue-400" />
          <span className="text-sm font-semibold text-white">Video AI</span>
        </div>
        <button onClick={onClose} className="p-1 hover:bg-white/8 rounded-lg transition">
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* Target info */}
        <div className="p-3 bg-white/4 rounded-lg border border-white/6">
          <p className="text-xs text-gray-400">
            {targetIds.length === 0
              ? "No frames ready (need images first)"
              : `${targetIds.length} frame${targetIds.length !== 1 ? "s" : ""} with images`}
          </p>
        </div>

        {/* Model picker */}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Model</p>
          <div className="space-y-2">
            {(Object.entries(VIDEO_MODELS) as [VideoModel, typeof VIDEO_MODELS[VideoModel]][]).map(([key, info]) => (
              <button key={key} onClick={() => { setModel(key); setQuality(VIDEO_MODELS[key].qualities[0] as VideoQuality); }}
                className={`w-full p-3 rounded-lg border text-left transition ${
                  model === key
                    ? "border-blue-500 bg-blue-600/15"
                    : "border-white/8 hover:border-white/20"
                }`}>
                <p className={`text-xs font-semibold ${model === key ? "text-blue-300" : "text-white"}`}>{info.label}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{info.description} · max {info.maxDuration}s</p>
              </button>
            ))}
          </div>
        </div>

        {/* Quality */}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">Quality</p>
          <div className="flex gap-2">
            {qualities.map((q) => (
              <button key={q} onClick={() => setQuality(q)}
                className={`flex-1 py-2 rounded-lg border text-xs font-medium transition ${
                  quality === q
                    ? "border-blue-500 bg-blue-600/15 text-blue-300"
                    : "border-white/8 text-gray-400 hover:border-white/20"
                }`}>
                {QUALITY_LABELS[q] ?? q}
              </button>
            ))}
          </div>
        </div>

        {/* Duration */}
        <div>
          <p className="text-xs text-gray-500 font-medium uppercase tracking-wider mb-2">
            Duration: {Math.min(duration, maxDur)}s
          </p>
          <input type="range" min={3} max={maxDur} step={1} value={Math.min(duration, maxDur)}
            onChange={(e) => setDuration(Number(e.target.value))}
            className="w-full accent-blue-500" />
          <div className="flex justify-between text-[10px] text-gray-600 mt-1">
            <span>3s</span><span>{maxDur}s max</span>
          </div>
        </div>

        {/* Credits summary */}
        <div className="flex items-center gap-2 p-3 bg-yellow-500/8 border border-yellow-500/20 rounded-lg">
          <Zap className="w-4 h-4 text-yellow-400 shrink-0" />
          <p className="text-xs text-yellow-300">
            {totalCredits} credits · {targetIds.length} video{targetIds.length !== 1 ? "s" : ""}
            {model === "kling-3.0" && <span className="opacity-60"> ({credits} cr/{duration}s each)</span>}
          </p>
        </div>

        {/* Progress */}
        {Object.keys(progress).length > 0 && (
          <div className="space-y-1.5">
            {targetIds.map((id) => {
              const item = items.find((i) => i._id === id);
              const st = progress[id];
              return (
                <div key={id} className="flex items-center gap-2.5 p-2 bg-white/3 rounded-lg">
                  {st === "pending" && <Loader2 className="w-3.5 h-3.5 text-blue-400 animate-spin shrink-0" />}
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
          disabled={generating || targetIds.length === 0}
          className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition disabled:opacity-50">
          {generating
            ? <><Loader2 className="w-4 h-4 animate-spin" /> Generating…</>
            : <><Film className="w-4 h-4" /> Generate {targetIds.length > 1 ? `${targetIds.length} Videos` : "Video"}</>}
        </button>
      </div>
    </div>
  );
}
