"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Play, Sparkles, CheckCircle2 } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

interface BuildStoryboardDialogSimplifiedProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  onSuccess?: () => void;
}

export function BuildStoryboardDialogSimplified({
  open,
  onOpenChange,
  projectId,
  onSuccess
}: BuildStoryboardDialogSimplifiedProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const project = useQuery(api.storyboard.projects.get, {
    id: projectId as Id<"storyboard_projects">,
  });

  const handleBuild = () => {
    setIsSubmitting(true);

    // Fire and forget — Convex reactivity shows frames appearing in real-time
    fetch('/api/storyboard/build-storyboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        projectId: projectId,
        rebuildStrategy: "replace_all",
      }),
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

    // Close immediately — user sees frames appear via Convex reactivity
    toast.info("Building storyboard... frames will appear as they're created.");
    onSuccess?.();
    onOpenChange(false);
    setIsSubmitting(false);
  };

  const sceneCount = project?.script ?
    project.script.split('SCENE').length - 1 : 0;

  const steps = [
    "Parse script scenes (structured or freeform)",
    "Extract characters, environments, and props",
    "Create storyboard frames with image & video prompts",
    "Set default generation models per scene",
  ];

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

        <div className="px-6 py-5 space-y-5">
          <p className="text-[13px] text-(--text-secondary) text-center">
            AI will parse your script, extract elements, and create storyboard frames automatically.
          </p>

          {/* Steps */}
          <div className="rounded-xl border border-(--border-primary) bg-(--bg-primary) p-4">
            <h3 className="text-[13px] font-semibold text-(--text-primary) mb-3">What will happen:</h3>
            <div className="space-y-2.5">
              {steps.map((label) => (
                <div key={label} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-6 h-6 rounded-md bg-green-500/10">
                    <CheckCircle2 className="h-3.5 w-3.5 text-green-400" />
                  </div>
                  <span className="text-[12px] text-(--text-secondary)">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-primary) p-3 text-center">
              <div className="text-[10px] text-(--text-tertiary) font-medium uppercase tracking-wider mb-1">Scenes Detected</div>
              <div className="text-lg font-semibold text-(--text-primary) tabular-nums">{sceneCount || "Auto"}</div>
            </div>
            <div className="rounded-xl border border-(--border-primary) bg-(--bg-primary) p-3 text-center">
              <div className="text-[10px] text-(--text-tertiary) font-medium uppercase tracking-wider mb-1">Build Mode</div>
              <div className="text-lg font-semibold text-(--text-primary)">Replace All</div>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 px-4 py-3">
            <p className="text-[12px] text-amber-400/90">
              This will replace all existing frames with new ones from the script.
            </p>
          </div>
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
