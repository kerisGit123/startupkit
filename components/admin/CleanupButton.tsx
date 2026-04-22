"use client";

import { useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Trash2, Loader2, AlertTriangle, ChevronDown } from "lucide-react";

const DAY_MS = 24 * 60 * 60 * 1000;

const PRESETS: Array<{ label: string; days: number }> = [
  { label: "Older than 5 days", days: 5 },
  { label: "Older than 30 days", days: 30 },
  { label: "Older than 60 days", days: 60 },
  { label: "Older than 90 days", days: 90 },
];

export interface CleanupPreview {
  count: number;
  secondaryCount?: number; // e.g., "X messages" alongside "Y sessions"
  secondaryLabel?: string;
  cutoffDate: string;
}

export interface CleanupResult {
  deleted: number;
  hasMore: boolean;
  extraLines?: string[]; // e.g., ["Deleted 12 inbox entries"]
}

interface CleanupButtonProps {
  /** e.g., "Clean up sessions" */
  triggerLabel: string;
  /** Singular item noun, e.g., "session" */
  itemNoun: string;
  /** Shown in the confirmation dialog under the count */
  eligibilityHint?: string;
  preview: (olderThanMs: number) => Promise<CleanupPreview>;
  run: (olderThanMs: number) => Promise<CleanupResult>;
}

export function CleanupButton({
  triggerLabel,
  itemNoun,
  eligibilityHint,
  preview,
  run,
}: CleanupButtonProps) {
  const [open, setOpen] = useState(false);
  const [days, setDays] = useState<number | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [previewData, setPreviewData] = useState<CleanupPreview | null>(null);

  const close = () => {
    setOpen(false);
    setDays(null);
    setPreviewData(null);
    setPreviewing(false);
    setDeleting(false);
  };

  const pickPreset = async (d: number) => {
    setDays(d);
    setOpen(true);
    setPreviewing(true);
    setPreviewData(null);
    try {
      const res = await preview(d * DAY_MS);
      setPreviewData(res);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Preview failed: ${msg}`);
      close();
    } finally {
      setPreviewing(false);
    }
  };

  const confirm = async () => {
    if (days == null) return;
    setDeleting(true);
    try {
      const res = await run(days * DAY_MS);
      const lines = [
        `Deleted ${res.deleted} ${itemNoun}${res.deleted === 1 ? "" : "s"}.`,
        ...(res.extraLines ?? []),
      ];
      if (res.hasMore) {
        lines.push("More items still qualify — run the cleanup again to continue.");
      }
      toast.success(lines.join(" "));
      close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      toast.error(`Cleanup failed: ${msg}`);
      setDeleting(false);
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Trash2 className="mr-1 h-4 w-4" />
            {triggerLabel}
            <ChevronDown className="ml-1 h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PRESETS.map((p) => (
            <DropdownMenuItem key={p.days} onClick={() => pickPreset(p.days)}>
              {p.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={(o) => !o && !deleting && close()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Confirm cleanup
            </DialogTitle>
            <DialogDescription>
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3 py-2 text-sm">
            {previewing && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" /> Checking…
              </div>
            )}

            {previewData && (
              <>
                <div className="rounded-md border bg-muted/40 p-3">
                  <div className="text-xs text-muted-foreground">
                    Items matching "older than {days} days" (before{" "}
                    {previewData.cutoffDate.slice(0, 10)})
                  </div>
                  <div className="mt-1 text-2xl font-semibold">
                    {previewData.count}{" "}
                    <span className="text-base font-normal text-muted-foreground">
                      {itemNoun}
                      {previewData.count === 1 ? "" : "s"}
                    </span>
                  </div>
                  {previewData.secondaryCount !== undefined &&
                    previewData.secondaryLabel && (
                      <div className="text-xs text-muted-foreground">
                        Plus {previewData.secondaryCount}{" "}
                        {previewData.secondaryLabel}
                      </div>
                    )}
                </div>

                {eligibilityHint && (
                  <div className="text-xs text-muted-foreground">
                    {eligibilityHint}
                  </div>
                )}

                {previewData.count === 0 && (
                  <div className="text-sm text-muted-foreground">
                    Nothing to clean up.
                  </div>
                )}
              </>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={close}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirm}
              disabled={
                previewing ||
                deleting ||
                !previewData ||
                previewData.count === 0
              }
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Trash2 className="mr-1 h-4 w-4" />
                  Delete{" "}
                  {previewData ? previewData.count : ""}{" "}
                  {itemNoun}
                  {previewData && previewData.count === 1 ? "" : "s"}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
