"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="overflow-hidden border border-[#3D3D3D] bg-[#2C2C2C]! p-0 text-[#FFFFFF] shadow-2xl sm:max-w-2xl rounded-2xl">
        <DialogHeader className="border-b border-[#3D3D3D] px-6 py-4">
          <DialogTitle className="flex items-center gap-3 text-xl font-semibold text-[#FFFFFF]">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#4A90E2] shadow-lg shadow-[#4A90E2]/20">
              <Play className="h-4 w-4 text-white" />
            </span>
            Build Storyboard from Script
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-6 space-y-6">
          <p className="text-[#A0A0A0] text-center">
            AI will parse your script, extract elements, and create storyboard frames automatically.
          </p>

          {/* What happens */}
          <div className="rounded-xl border border-[#3D3D3D] bg-[#3D3D3D]/20 p-6">
            <h3 className="text-base font-medium text-[#FFFFFF] mb-4">What will happen:</h3>
            <div className="space-y-3">
              {[
                "Parse script scenes (structured or freeform)",
                "Extract characters, environments, and props",
                "Create storyboard frames with image & video prompts",
                "Set default generation models per scene",
              ].map((text) => (
                <div key={text} className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-green-400 shrink-0" />
                  <span className="text-sm text-[#A0A0A0]">{text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 text-center">
            <div className="rounded-lg border border-[#3D3D3D] bg-[#3D3D3D]/20 p-3">
              <div className="text-xs text-[#6E6E6E] mb-1">Scenes Detected</div>
              <div className="text-lg font-medium text-[#FFFFFF]">{sceneCount || "Auto"}</div>
            </div>
            <div className="rounded-lg border border-[#3D3D3D] bg-[#3D3D3D]/20 p-3">
              <div className="text-xs text-[#6E6E6E] mb-1">Build Mode</div>
              <div className="text-lg font-medium text-[#FFFFFF]">Replace All</div>
            </div>
          </div>

          {/* Warning */}
          <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <p className="text-sm text-amber-400">
              This will replace all existing frames with new ones from the script.
            </p>
          </div>
        </div>

        <DialogFooter className="border-t border-[#3D3D3D] bg-[#3D3D3D]/20 px-6 py-4">
          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-[#3D3D3D] bg-[#3D3D3D] text-[#A0A0A0] hover:bg-[#3D3D3D]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBuild}
              disabled={isSubmitting || !project?.script}
              className="bg-[#4A90E2] text-white hover:bg-[#357ABD] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Build from Script
              </div>
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
