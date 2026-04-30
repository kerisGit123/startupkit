"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Play, Sparkles, CheckCircle2, RefreshCw, Layers, AlertTriangle } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type BuildMode = "smart_merge" | "replace_all";

const BUILD_MODES: { key: BuildMode; label: string; desc: string; icon: typeof RefreshCw }[] = [
  { key: "smart_merge",  label: "Update & Add",         desc: "Update existing prompts, add new scenes, reuse elements", icon: Layers },
  { key: "replace_all",  label: "Rebuild From Scratch",  desc: "Delete all frames and elements, rebuild everything",     icon: RefreshCw },
];

interface BuildStoryboardDialogSimplifiedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function BuildStoryboardDialogSimplified({
  open, onOpenChange, projectId, onSuccess,
}: BuildStoryboardDialogSimplifiedProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [buildMode, setBuildMode] = useState<BuildMode>("smart_merge");

  const project = useQuery(api.storyboard.projects.get, {
    id: projectId as Id<"storyboard_projects">,
  });
  const existingItems = useQuery(api.storyboard.moveItems.getStoryboardItemsOrdered, {
    projectId: projectId as Id<"storyboard_projects">,
  });
  const hasExisting = (existingItems?.length ?? 0) > 0;

  const handleBuild = () => {
    setIsSubmitting(true);

    fetch('/api/storyboard/build-storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, rebuildStrategy: buildMode }),
    }).then(async (response) => {
      if (!response.ok) {
        const text = await response.text();
        let msg = "Build request failed";
        try { msg = JSON.parse(text).error || msg; } catch {}
        toast.error(msg);
      }
    }).catch((err) => {
      toast.error(err instanceof Error ? err.message : "Build failed");
    });

    toast.info("Building storyboard... frames will appear as they're created.");
    onSuccess?.();
    onOpenChange(false);
    setIsSubmitting(false);
  };

  const sceneCount = project?.script
    ? project.script.split('SCENE').length - 1
    : 0;

  const stepsMap: Record<BuildMode, string[]> = {
    smart_merge: [
      "Parse script and match against existing scenes",
      "Update image & video prompts on changed scenes",
      "Add new scenes not yet in the storyboard",
      "Reuse existing elements — no duplicates",
    ],
    replace_all: [
      "Delete all existing frames and elements",
      "Parse full script from scratch",
      "Create all frames with image & video prompts",
      "Extract and create all elements",
    ],
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-(--border-primary) bg-(--bg-secondary)! p-0 text-(--text-primary) shadow-2xl sm:max-w-lg rounded-2xl">
        <DialogHeader className="border-b border-(--border-primary) px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-[14px] font-semibold text-(--text-primary)">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-(--accent-blue) shadow-lg shadow-(--accent-blue)/20">
              <Play className="h-4 w-4 text-white" />
            </span>
            Build Storyboard from Script
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-5 space-y-4">
          {/* Build Mode Selector */}
          <div className="space-y-1.5">
            {BUILD_MODES.map(({ key, label, desc, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setBuildMode(key)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl border transition-all text-left ${
                  buildMode === key
                    ? "border-(--accent-blue)/40 bg-(--accent-blue)/8"
                    : "border-(--border-primary) bg-(--bg-primary) hover:border-(--border-secondary)"
                }`}
              >
                <div className={`flex items-center justify-center w-7 h-7 rounded-lg shrink-0 ${
                  buildMode === key ? "bg-(--accent-blue)/15" : "bg-white/5"
                }`}>
                  <Icon className={`w-3.5 h-3.5 ${buildMode === key ? "text-(--accent-blue)" : "text-(--text-tertiary)"}`} strokeWidth={1.75} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className={`text-[12px] font-medium ${buildMode === key ? "text-(--text-primary)" : "text-(--text-secondary)"}`}>{label}</div>
                  <div className="text-[10px] text-(--text-tertiary) leading-tight">{desc}</div>
                </div>
                {buildMode === key && (
                  <div className="ml-auto shrink-0 w-4 h-4 rounded-full bg-(--accent-blue) flex items-center justify-center">
                    <CheckCircle2 className="w-3 h-3 text-white" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Steps */}
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-primary) p-4">
            <h3 className="text-[12px] font-semibold text-(--text-primary) mb-2.5">What will happen:</h3>
            <div className="space-y-2">
              {stepsMap[buildMode].map((label) => (
                <div key={label} className="flex items-center gap-2.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-green-400 shrink-0" />
                  <span className="text-[11px] text-(--text-secondary)">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-2.5">
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-primary) p-2.5 text-center">
              <div className="text-[9px] text-(--text-tertiary) font-medium uppercase tracking-wider mb-0.5">In Script</div>
              <div className="text-base font-semibold text-(--text-primary) tabular-nums">{sceneCount || "Auto"}</div>
            </div>
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-primary) p-2.5 text-center">
              <div className="text-[9px] text-(--text-tertiary) font-medium uppercase tracking-wider mb-0.5">Existing Frames</div>
              <div className="text-base font-semibold text-(--text-primary) tabular-nums">{existingItems?.length ?? 0}</div>
            </div>
          </div>

          {/* Warning / info */}
          {buildMode === "replace_all" && hasExisting && (
            <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-3.5 py-2.5 flex items-start gap-2">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400/80 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-[11px] text-amber-400/90">
                This will delete {existingItems?.length} existing frames and all elements.
              </p>
            </div>
          )}
          {buildMode === "smart_merge" && hasExisting && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 px-3.5 py-2.5 flex items-start gap-2">
              <Layers className="w-3.5 h-3.5 text-emerald-400/80 shrink-0 mt-0.5" strokeWidth={1.75} />
              <p className="text-[11px] text-emerald-400/90">
                Existing scenes get updated prompts. New scenes are added. Elements are reused. To replace specific frames, select them on the storyboard and use "Replace Frames".
              </p>
            </div>
          )}
        </div>

        <DialogFooter className="border-t border-(--border-primary) bg-(--bg-primary)/50 px-6 py-3.5">
          <div className="flex justify-end gap-2.5 w-full">
            <button
              onClick={() => onOpenChange(false)}
              className="px-4 py-2 rounded-xl text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 border border-(--border-primary) transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleBuild}
              disabled={isSubmitting || !project?.script}
              className="flex items-center gap-2 px-5 py-2 rounded-xl bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Build from Script
            </button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
