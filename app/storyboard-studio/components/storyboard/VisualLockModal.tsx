"use client";

import { useState, useCallback, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  Lock, X, Sparkles, Coins, CheckCircle2, XCircle, ChevronDown, ChevronUp,
  AlertCircle, Loader2, User, Trees, Package, RefreshCw, FileText, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { useCurrentCompanyId } from "@/lib/auth-utils";

// ── Types ─────────────────────────────────────────────────────────────────────

type Step =
  | "select"
  | "pre_cost"
  | "analyzing"
  | "reviewing"
  | "elements_saved"
  | "confirm_rewrite"
  | "rewriting"
  | "script_preview"
  | "done";

interface AnalysisChange {
  field: string;
  oldValue: string;
  newValue: string;
  reason: string;
  confidence: "high" | "medium" | "low";
}

interface AnalysisResult {
  elementId: string;
  elementName: string;
  elementType: string;
  primaryImageUrl: string;
  currentDescription: string;
  currentIdentity: Record<string, any>;
  newDescription: string;
  updatedIdentity: Record<string, any>;
  changes: AnalysisChange[];
  success: boolean;
  error?: string;
}

interface ConfirmedElement extends AnalysisResult {
  acceptedChanges: Set<number>; // indices of accepted changes
  editedDescription: string;
  editedIdentity: Record<string, any>;
}

interface SceneChange {
  sceneId: string;
  changes: string[];
}

interface VisualLockModalProps {
  projectId: string;
  onClose: () => void;
  onScriptUpdated?: (newScript: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const TYPE_ICON = {
  character: User,
  environment: Trees,
  prop: Package,
};

const TYPE_COLOR: Record<string, string> = {
  character: "text-purple-400 bg-purple-500/15",
  environment: "text-emerald-400 bg-emerald-500/15",
  prop:        "text-blue-400 bg-blue-500/15",
};

const CONFIDENCE_STYLE: Record<string, string> = {
  high:   "text-emerald-400 bg-emerald-500/10 border-emerald-500/20",
  medium: "text-amber-400 bg-amber-500/10 border-amber-500/20",
  low:    "text-red-400 bg-red-500/10 border-red-500/20",
};

// ── Main Component ────────────────────────────────────────────────────────────

export function VisualLockModal({ projectId, onClose, onScriptUpdated }: VisualLockModalProps) {
  const companyId = useCurrentCompanyId();

  // Convex
  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId: projectId as Id<"storyboard_projects">,
  });
  const items = useQuery(api.storyboard.moveItems.getStoryboardItemsOrdered, {
    projectId: projectId as Id<"storyboard_projects">,
  });
  const deductCredits = useMutation(api.credits.deductCredits);

  // State
  const [step, setStep] = useState<Step>("select");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [analysisResults, setAnalysisResults] = useState<AnalysisResult[]>([]);
  const [confirmedElements, setConfirmedElements] = useState<ConfirmedElement[]>([]);
  const [rewriteResult, setRewriteResult] = useState<{ newScript: string; sceneChanges: SceneChange[]; creditsCharged: number } | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isRewriting, setIsRewriting] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [analyzingElement, setAnalyzingElement] = useState<string | null>(null);
  const [expandedScenes, setExpandedScenes] = useState<Set<string>>(new Set());
  const [creditsUsed, setCreditsUsed] = useState(0);

  // Elements with primary images
  const analyzableElements = useMemo(() =>
    (elements || []).filter((el: any) => el.referenceUrls?.length > 0),
    [elements]
  );

  const allElements = elements || [];

  // Credit calculation
  const analysisCost = selectedIds.size; // 1 credit per element
  const rewriteCost = rewriteResult?.creditsCharged ?? 2; // shown after analysis

  // ── Step: Select ──────────────────────────────────────────────────────────

  const toggleElement = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(analyzableElements.map((el: any) => el._id)));
  const deselectAll = () => setSelectedIds(new Set());

  // ── Step: Analyze ─────────────────────────────────────────────────────────

  const runAnalysis = useCallback(async () => {
    if (!selectedIds.size) return;
    setStep("analyzing");
    setIsAnalyzing(true);

    try {
      const res = await fetch("/api/storyboard/visual-lock/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, elementIds: [...selectedIds] }),
      });

      if (!res.ok) throw new Error("Analysis failed");
      const data = await res.json();
      const results: AnalysisResult[] = data.results || [];

      // Deduct 1 credit per successful analysis
      const successCount = results.filter(r => r.success).length;
      if (successCount > 0 && companyId) {
        await deductCredits({
          companyId,
          tokens: successCount,
          reason: "Visual Lock element analysis",
          plan: "pro",
        });
        setCreditsUsed(prev => prev + successCount);
      }

      setAnalysisResults(results);

      // Initialize confirmed state with all changes accepted
      const confirmed: ConfirmedElement[] = results
        .filter(r => r.success)
        .map(r => ({
          ...r,
          acceptedChanges: new Set(r.changes.map((_, i) => i)),
          editedDescription: r.newDescription,
          editedIdentity: { ...r.currentIdentity, ...r.updatedIdentity },
        }));
      setConfirmedElements(confirmed);
      setStep("reviewing");
    } catch (err) {
      toast.error("Analysis failed. Please try again.");
      setStep("select");
    } finally {
      setIsAnalyzing(false);
      setAnalyzingElement(null);
    }
  }, [selectedIds, projectId, companyId, deductCredits]);

  // ── Step: Review → Save Elements ─────────────────────────────────────────

  const toggleChange = (elementIdx: number, changeIdx: number) => {
    setConfirmedElements(prev => {
      const next = [...prev];
      const el = { ...next[elementIdx] };
      const accepted = new Set(el.acceptedChanges);
      if (accepted.has(changeIdx)) accepted.delete(changeIdx); else accepted.add(changeIdx);
      el.acceptedChanges = accepted;
      next[elementIdx] = el;
      return next;
    });
  };

  const acceptAll = (idx: number) => {
    setConfirmedElements(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], acceptedChanges: new Set(next[idx].changes.map((_, i) => i)) };
      return next;
    });
  };

  const rejectAll = (idx: number) => {
    setConfirmedElements(prev => {
      const next = [...prev];
      next[idx] = { ...next[idx], acceptedChanges: new Set() };
      return next;
    });
  };

  const saveElements = useCallback(async () => {
    setIsApplying(true);
    try {
      const updatedElements = confirmedElements.map(el => ({
        elementId: el.elementId,
        newDescription: el.editedDescription,
        newIdentity: el.editedIdentity,
      }));

      const res = await fetch("/api/storyboard/visual-lock/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, updatedElements }),
      });
      if (!res.ok) throw new Error("Failed to save elements");
      setStep("elements_saved");
    } catch {
      toast.error("Failed to save element changes.");
    } finally {
      setIsApplying(false);
    }
  }, [confirmedElements, projectId]);

  // ── Step: Rewrite ─────────────────────────────────────────────────────────

  const runRewrite = useCallback(async () => {
    setStep("rewriting");
    setIsRewriting(true);

    try {
      // Get affected scene IDs from element sceneIds
      const affectedSceneIds = [...new Set(
        analysisResults.flatMap(r => {
          const el = allElements.find((e: any) => e._id === r.elementId);
          return el?.sceneIds || [];
        })
      )];

      const confirmedForRewrite = confirmedElements.map(el => ({
        elementId: el.elementId,
        elementName: el.elementName,
        elementType: el.elementType,
        oldDescription: el.currentDescription,
        newDescription: el.editedDescription,
      }));

      const res = await fetch("/api/storyboard/visual-lock/rewrite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, confirmedElements: confirmedForRewrite, affectedSceneIds }),
      });

      if (!res.ok) throw new Error("Rewrite failed");
      const data = await res.json();

      // Deduct rewrite credits
      const rewriteCredits = data.creditsCharged || 2;
      if (companyId) {
        await deductCredits({
          companyId,
          tokens: rewriteCredits,
          reason: `Visual Lock script rewrite (${data.modelUsed})`,
          plan: "pro",
        });
        setCreditsUsed(prev => prev + rewriteCredits);
      }

      setRewriteResult(data);
      setStep("script_preview");
    } catch {
      toast.error("Script rewrite failed. Please try again.");
      setStep("elements_saved");
    } finally {
      setIsRewriting(false);
    }
  }, [analysisResults, confirmedElements, allElements, projectId, companyId, deductCredits]);

  // ── Step: Apply Script ────────────────────────────────────────────────────

  const applyScript = useCallback(async (rebuildScenes: boolean) => {
    if (!rewriteResult) return;
    setIsApplying(true);

    try {
      const affectedSceneIds = rewriteResult.sceneChanges.map(s => s.sceneId);
      const updatedElements = confirmedElements.map(el => ({
        elementId: el.elementId,
        newDescription: el.editedDescription,
        newIdentity: el.editedIdentity,
      }));

      const res = await fetch("/api/storyboard/visual-lock/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId,
          updatedElements,
          newScript: rewriteResult.newScript,
          rebuildScenes,
          affectedSceneIds,
        }),
      });
      if (!res.ok) throw new Error("Apply failed");

      onScriptUpdated?.(rewriteResult.newScript);
      setStep("done");

      if (rebuildScenes) {
        toast.success("Script updated. Storyboard rebuild started — frames updating in background.");
      } else {
        toast.success("Script and elements updated successfully.");
      }
    } catch {
      toast.error("Failed to apply changes.");
    } finally {
      setIsApplying(false);
    }
  }, [rewriteResult, confirmedElements, projectId, onScriptUpdated]);

  // ── RENDER ────────────────────────────────────────────────────────────────

  const renderStep = () => {
    switch (step) {
      case "select": return <StepSelect />;
      case "pre_cost": return <StepPreCost />;
      case "analyzing": return <StepAnalyzing />;
      case "reviewing": return <StepReviewing />;
      case "elements_saved": return <StepElementsSaved />;
      case "confirm_rewrite": return <StepConfirmRewrite />;
      case "rewriting": return <StepRewriting />;
      case "script_preview": return <StepScriptPreview />;
      case "done": return <StepDone />;
    }
  };

  const STEP_LABELS: Record<Step, string> = {
    select: "Select Elements",
    pre_cost: "Review Cost",
    analyzing: "Analyzing...",
    reviewing: "Review Changes",
    elements_saved: "Elements Updated",
    confirm_rewrite: "Rewrite Script",
    rewriting: "Rewriting...",
    script_preview: "Script Preview",
    done: "Complete",
  };

  // ── SUB-RENDERS ───────────────────────────────────────────────────────────

  function StepSelect() {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-3">
          <p className="text-[13px] text-(--text-secondary) mb-4">
            Select elements with reference images to analyze. The system will compare each image against the current script description and identity fields.
          </p>

          {/* Select all / none */}
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">
              {allElements.length} Elements
            </span>
            <div className="flex items-center gap-3">
              <button onClick={selectAll} className="text-[11px] text-(--accent-blue) hover:underline">Select all</button>
              <button onClick={deselectAll} className="text-[11px] text-(--text-tertiary) hover:text-(--text-secondary)">Clear</button>
            </div>
          </div>

          {allElements.map((el: any) => {
            const hasImage = el.referenceUrls?.length > 0;
            const isSelected = selectedIds.has(el._id);
            const TypeIcon = TYPE_ICON[el.type as keyof typeof TYPE_ICON] || Package;
            const primaryUrl = el.referenceUrls?.[el.primaryIndex ?? 0] || el.referenceUrls?.[0];

            return (
              <div
                key={el._id}
                onClick={() => hasImage && toggleElement(el._id)}
                className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${
                  !hasImage
                    ? "border-(--border-primary) opacity-40 cursor-not-allowed"
                    : isSelected
                    ? "border-(--accent-blue)/50 bg-(--accent-blue)/5 cursor-pointer"
                    : "border-(--border-primary) bg-(--bg-primary) cursor-pointer hover:border-(--border-secondary)"
                }`}
              >
                {/* Checkbox */}
                <div className={`w-4 h-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                  isSelected ? "bg-(--accent-blue) border-(--accent-blue)" : "border-(--border-secondary)"
                }`}>
                  {isSelected && <CheckCircle2 className="w-3 h-3 text-white" strokeWidth={2.5} />}
                </div>

                {/* Thumbnail */}
                <div className="w-10 h-10 rounded-lg overflow-hidden bg-(--bg-primary) shrink-0 border border-(--border-primary)">
                  {primaryUrl
                    ? <img src={primaryUrl} alt={el.name} className="w-full h-full object-cover" />
                    : <div className="w-full h-full flex items-center justify-center"><TypeIcon className="w-4 h-4 text-(--text-tertiary)" strokeWidth={1.75} /></div>
                  }
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-medium text-(--text-primary) truncate block">{el.name}</span>
                  <span className={`inline-flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded mt-0.5 ${TYPE_COLOR[el.type] || ""}`}>
                    <TypeIcon className="w-2.5 h-2.5" strokeWidth={1.75} />
                    {el.type}
                  </span>
                </div>

                {/* Status */}
                <div className="text-[11px] shrink-0">
                  {hasImage
                    ? <span className="text-(--text-tertiary)">1 credit</span>
                    : <span className="text-(--text-tertiary) italic">No image</span>
                  }
                </div>
              </div>
            );
          })}

          {allElements.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Package className="w-10 h-10 text-(--text-tertiary) mb-3" strokeWidth={1.75} />
              <p className="text-[13px] text-(--text-secondary)">No elements in this project yet.</p>
              <p className="text-[11px] text-(--text-tertiary) mt-1">Add elements via the Elements panel.</p>
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-(--border-primary)/50 flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[12px] text-(--text-secondary)">
            <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
            <span>{selectedIds.size} element{selectedIds.size !== 1 ? "s" : ""} × 1 credit = <strong className="text-(--text-primary)">{selectedIds.size} credits</strong></span>
          </div>
          <button
            onClick={() => setStep("pre_cost")}
            disabled={selectedIds.size === 0}
            className="flex items-center gap-1.5 px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Zap className="w-3.5 h-3.5" strokeWidth={1.75} />
            Review Cost →
          </button>
        </div>
      </>
    );
  }

  function StepPreCost() {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl p-5 space-y-4">
            <h3 className="text-[13px] font-semibold text-(--text-primary)">Analysis cost</h3>

            <div className="space-y-2">
              {[...selectedIds].map(id => {
                const el = allElements.find((e: any) => e._id === id);
                if (!el) return null;
                const TypeIcon = TYPE_ICON[el.type as keyof typeof TYPE_ICON] || Package;
                return (
                  <div key={id} className="flex items-center justify-between text-[12px]">
                    <div className="flex items-center gap-2 text-(--text-secondary)">
                      <TypeIcon className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {el.name}
                    </div>
                    <span className="text-(--text-tertiary)">1 credit</span>
                  </div>
                );
              })}
            </div>

            <div className="border-t border-(--border-primary) pt-3 flex items-center justify-between">
              <span className="text-[12px] text-(--text-secondary)">Analysis total</span>
              <div className="flex items-center gap-1.5 text-[14px] font-semibold text-(--text-primary)">
                <Coins className="w-4 h-4 text-amber-400" strokeWidth={1.75} />
                {selectedIds.size} credits
              </div>
            </div>

            <p className="text-[11px] text-(--text-tertiary) bg-(--bg-secondary) rounded-lg p-3 leading-relaxed">
              Script rewrite cost will be shown after analysis. You can stop after analysis without rewriting the script — only analysis credits will be charged.
            </p>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-(--border-primary)/50 flex items-center gap-3 justify-end">
          <button onClick={() => setStep("select")} className="px-4 py-2 text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 rounded-xl transition-colors">
            ← Back
          </button>
          <button
            onClick={runAnalysis}
            className="flex items-center gap-1.5 px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-all"
          >
            <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
            Analyze — {selectedIds.size} credits
          </button>
        </div>
      </>
    );
  }

  function StepAnalyzing() {
    const selectedElements = allElements.filter((el: any) => selectedIds.has(el._id));
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-6">
        <div className="w-14 h-14 rounded-2xl bg-(--accent-blue)/10 border border-(--accent-blue)/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-(--accent-blue) animate-spin" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-(--text-primary)">Analyzing elements...</p>
          <p className="text-[12px] text-(--text-secondary) mt-1">Comparing reference images against script descriptions</p>
        </div>
        <div className="w-full max-w-sm space-y-2">
          {selectedElements.map((el: any) => (
            <div key={el._id} className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-(--bg-primary)">
              <Loader2 className="w-3.5 h-3.5 text-(--accent-blue) animate-spin" strokeWidth={1.75} />
              <span className="text-[12px] text-(--text-secondary)">{el.name}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function StepReviewing() {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <p className="text-[12px] text-(--text-secondary)">
            Review the detected conflicts. Accept or reject individual changes. Accepted changes will update the element's description and identity.
          </p>

          {confirmedElements.map((el, elIdx) => (
            <div key={el.elementId} className="border border-(--border-primary) rounded-xl overflow-hidden">
              {/* Element header */}
              <div className="flex items-center gap-3 px-4 py-3 bg-(--bg-primary)/60">
                <div className="w-9 h-9 rounded-lg overflow-hidden border border-(--border-primary) shrink-0">
                  <img src={el.primaryImageUrl} alt={el.elementName} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="text-[13px] font-semibold text-(--text-primary) block truncate">{el.elementName}</span>
                  <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded ${TYPE_COLOR[el.elementType] || ""}`}>{el.elementType}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => acceptAll(elIdx)} className="text-[11px] text-emerald-400 hover:underline">Accept all</button>
                  <button onClick={() => rejectAll(elIdx)} className="text-[11px] text-red-400 hover:underline">Reject all</button>
                </div>
              </div>

              {/* Changes */}
              {el.changes.length === 0 ? (
                <div className="px-4 py-3 flex items-center gap-2 text-[12px] text-(--text-tertiary)">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" strokeWidth={1.75} />
                  No conflicts detected — image matches current description
                </div>
              ) : (
                <div className="divide-y divide-(--border-primary)/50">
                  {el.changes.map((change, changeIdx) => {
                    const accepted = el.acceptedChanges.has(changeIdx);
                    return (
                      <div key={changeIdx} className={`px-4 py-3 transition-colors ${accepted ? "" : "opacity-40"}`}>
                        <div className="flex items-start gap-3">
                          <button
                            onClick={() => toggleChange(elIdx, changeIdx)}
                            className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${
                              accepted ? "bg-(--accent-blue) border-(--accent-blue)" : "border-(--border-secondary) hover:border-(--border-primary)"
                            }`}
                          >
                            {accepted && <CheckCircle2 className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />}
                          </button>
                          <div className="flex-1 min-w-0 space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] font-semibold text-(--text-primary)">{change.field}</span>
                              <span className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded border ${CONFIDENCE_STYLE[change.confidence]}`}>
                                {change.confidence}
                              </span>
                            </div>
                            <div className="flex items-start gap-2 text-[11px]">
                              <span className="text-red-400/70 line-through shrink-0">"{change.oldValue}"</span>
                              <span className="text-(--text-tertiary)">→</span>
                              <span className="text-emerald-400">"{change.newValue}"</span>
                            </div>
                            <p className="text-[10px] text-(--text-tertiary) italic">{change.reason}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ))}

          {analysisResults.filter(r => !r.success).map(r => (
            <div key={r.elementId} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-red-500/20 bg-red-500/5">
              <XCircle className="w-4 h-4 text-red-400 shrink-0" strokeWidth={1.75} />
              <span className="text-[12px] text-red-400">{r.elementName} — analysis failed: {r.error}</span>
            </div>
          ))}
        </div>

        <div className="px-6 py-4 border-t border-(--border-primary)/50 flex items-center justify-between">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 rounded-xl transition-colors">
            Close — keep changes
          </button>
          <button
            onClick={saveElements}
            disabled={isApplying}
            className="flex items-center gap-1.5 px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-all disabled:opacity-50"
          >
            {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} /> : <CheckCircle2 className="w-3.5 h-3.5" strokeWidth={1.75} />}
            Save Element Changes →
          </button>
        </div>
      </>
    );
  }

  function StepElementsSaved() {
    return (
      <>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/8 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" strokeWidth={1.75} />
            <div>
              <p className="text-[13px] font-semibold text-(--text-primary)">{confirmedElements.length} element{confirmedElements.length !== 1 ? "s" : ""} updated</p>
              <p className="text-[11px] text-(--text-secondary) mt-0.5">Descriptions and identity fields saved. You can close here or continue to rewrite the script.</p>
            </div>
          </div>

          <div className="border border-(--border-primary) rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-(--bg-primary)/60 border-b border-(--border-primary)">
              <p className="text-[12px] font-semibold text-(--text-primary)">Also rewrite the script?</p>
              <p className="text-[11px] text-(--text-secondary) mt-0.5">Update script descriptions to match the reference images throughout your scenes.</p>
            </div>
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] text-(--text-secondary)">Script rewrite</span>
                <div className="flex items-center gap-1.5 text-[12px]">
                  <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
                  <span className="text-(--text-primary) font-medium">2 credits</span>
                  <span className="text-[10px] text-(--text-tertiary)">(Haiku)</span>
                </div>
              </div>
              <p className="text-[10px] text-(--text-tertiary) bg-(--bg-secondary) rounded-lg px-3 py-2 leading-relaxed">
                Only visual appearance descriptions will change. Camera directions, timing, plot, and structure are preserved exactly.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-(--border-primary)/50 flex items-center gap-3 justify-between">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 rounded-xl transition-colors">
            Close
          </button>
          <button
            onClick={runRewrite}
            className="flex items-center gap-1.5 px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-all"
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
            Rewrite Script — 2 credits →
          </button>
        </div>
      </>
    );
  }

  function StepConfirmRewrite() {
    return <StepElementsSaved />;
  }

  function StepRewriting() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-5">
        <div className="w-14 h-14 rounded-2xl bg-(--accent-blue)/10 border border-(--accent-blue)/20 flex items-center justify-center">
          <Loader2 className="w-7 h-7 text-(--accent-blue) animate-spin" strokeWidth={1.75} />
        </div>
        <div className="text-center">
          <p className="text-[15px] font-semibold text-(--text-primary)">Rewriting script...</p>
          <p className="text-[12px] text-(--text-secondary) mt-1">Updating visual descriptions to match reference images</p>
        </div>
      </div>
    );
  }

  function StepScriptPreview() {
    if (!rewriteResult) return null;
    const { sceneChanges, totalChanges } = rewriteResult;
    const unchangedItems = (items || []).filter((item: any) =>
      item.sceneId && !sceneChanges.find(s => s.sceneId === item.sceneId)
    );

    return (
      <>
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-(--bg-primary) border border-(--border-primary)">
            <FileText className="w-4 h-4 text-(--accent-blue) shrink-0" strokeWidth={1.75} />
            <span className="text-[12px] text-(--text-secondary)">
              <strong className="text-(--text-primary)">{sceneChanges.length} scenes</strong> affected · <strong className="text-(--text-primary)">{totalChanges}</strong> text changes
            </span>
          </div>

          {/* Affected scenes */}
          {sceneChanges.length > 0 && (
            <div className="space-y-2">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">Changed Scenes</p>
              {sceneChanges.map(sc => {
                const item = (items || []).find((i: any) => i.sceneId === sc.sceneId);
                const isExpanded = expandedScenes.has(sc.sceneId);
                return (
                  <div key={sc.sceneId} className="border border-amber-500/20 bg-amber-500/5 rounded-xl overflow-hidden">
                    <button
                      onClick={() => setExpandedScenes(prev => {
                        const next = new Set(prev);
                        if (next.has(sc.sceneId)) next.delete(sc.sceneId); else next.add(sc.sceneId);
                        return next;
                      })}
                      className="w-full flex items-center justify-between px-4 py-2.5 text-left"
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-amber-400/70">{sc.sceneId}</span>
                        <span className="text-[12px] font-medium text-(--text-primary)">{item?.title || sc.sceneId}</span>
                        <span className="text-[10px] text-amber-400">{sc.changes.length} change{sc.changes.length !== 1 ? "s" : ""}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5 text-(--text-tertiary)" strokeWidth={1.75} /> : <ChevronDown className="w-3.5 h-3.5 text-(--text-tertiary)" strokeWidth={1.75} />}
                    </button>
                    {isExpanded && (
                      <div className="px-4 pb-3 space-y-1 border-t border-amber-500/10">
                        {sc.changes.map((c, i) => (
                          <p key={i} className="text-[11px] text-(--text-secondary) flex items-start gap-2 mt-2">
                            <span className="text-amber-400 shrink-0">→</span> {c}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Unchanged scenes */}
          {unchangedItems.length > 0 && (
            <div className="space-y-1">
              <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">Unchanged Scenes</p>
              <div className="flex flex-wrap gap-2">
                {unchangedItems.map((item: any) => (
                  <span key={item._id} className="text-[10px] px-2 py-0.5 rounded-md bg-(--bg-primary) border border-(--border-primary) text-(--text-tertiary)">
                    {item.title || item.sceneId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Info box */}
          <div className="flex items-start gap-2.5 p-3 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-[11px] text-(--text-secondary) leading-relaxed">
            <AlertCircle className="w-3.5 h-3.5 text-(--text-tertiary) mt-0.5 shrink-0" strokeWidth={1.75} />
            <span>Existing generated images are not affected. Scene prompts will be updated — regenerate individual frames to apply the new descriptions.</span>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-(--border-primary)/50 flex items-center gap-3 justify-between">
          <button onClick={onClose} className="px-4 py-2 text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 rounded-xl transition-colors">
            Don&apos;t apply script
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => applyScript(false)}
              disabled={isApplying}
              className="px-4 py-2 text-[13px] font-medium border border-(--border-primary) text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 rounded-xl transition-all disabled:opacity-50"
            >
              {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1.5" strokeWidth={1.75} /> : null}
              Update Script Only
            </button>
            <button
              onClick={() => applyScript(true)}
              disabled={isApplying}
              className="flex items-center gap-1.5 px-4 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-all disabled:opacity-50"
            >
              {isApplying ? <Loader2 className="w-3.5 h-3.5 animate-spin" strokeWidth={1.75} /> : <RefreshCw className="w-3.5 h-3.5" strokeWidth={1.75} />}
              Update + Rebuild Scenes
            </button>
          </div>
        </div>
      </>
    );
  }

  function StepDone() {
    return (
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-10 gap-5 text-center">
        <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" strokeWidth={1.75} />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-(--text-primary)">Visual Lock complete</p>
          <p className="text-[12px] text-(--text-secondary) mt-1">Elements and script aligned to your reference images</p>
        </div>
        <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl px-5 py-4 text-left w-full max-w-sm space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-3">Session summary</p>
          <div className="flex items-center justify-between text-[12px]">
            <span className="text-(--text-secondary)">{confirmedElements.length} elements updated</span>
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
          </div>
          {rewriteResult && (
            <div className="flex items-center justify-between text-[12px]">
              <span className="text-(--text-secondary)">Script rewritten ({rewriteResult.sceneChanges.length} scenes)</span>
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" strokeWidth={1.75} />
            </div>
          )}
          <div className="border-t border-(--border-primary) pt-2 flex items-center justify-between text-[12px]">
            <span className="text-(--text-secondary)">Credits used</span>
            <div className="flex items-center gap-1">
              <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
              <span className="text-(--text-primary) font-semibold">{creditsUsed}</span>
            </div>
          </div>
        </div>
        <button onClick={onClose} className="px-5 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white text-[13px] font-medium rounded-xl transition-all">
          Done
        </button>
      </div>
    );
  }

  // ── MODAL WRAPPER ─────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={step === "select" || step === "done" ? onClose : undefined} />

      <div className="relative w-[90vw] max-w-[680px] max-h-[85vh] bg-(--bg-secondary)/98 backdrop-blur-xl border border-(--border-primary) rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-(--border-primary)/50 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-(--accent-blue)/10 border border-(--accent-blue)/20 flex items-center justify-center">
              <Lock className="w-4 h-4 text-(--accent-blue)" strokeWidth={1.75} />
            </div>
            <div>
              <h2 className="text-[14px] font-semibold text-(--text-primary)">Visual Lock</h2>
              <p className="text-[11px] text-(--text-tertiary)">{STEP_LABELS[step]}</p>
            </div>
          </div>
          {creditsUsed > 0 && (
            <div className="flex items-center gap-1 text-[11px] text-(--text-secondary) mr-3">
              <Coins className="w-3.5 h-3.5 text-amber-400" strokeWidth={1.75} />
              {creditsUsed} used
            </div>
          )}
          <button onClick={onClose} className="w-7 h-7 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 flex items-center justify-center transition-colors">
            <X className="w-4 h-4" strokeWidth={1.75} />
          </button>
        </div>

        {/* Step content */}
        <div className="flex flex-col flex-1 min-h-0">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}
