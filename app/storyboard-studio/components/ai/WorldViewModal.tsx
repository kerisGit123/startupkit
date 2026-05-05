"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  X, Globe, Sparkles, Coins, Loader2, ChevronDown, Image as ImageIcon,
  User, Trees, Package, RefreshCw, FileText, Maximize2, Check, Copy, AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useUser } from "@clerk/nextjs";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { usePricingData } from "../shared/usePricingData";
import { composeWorldViewPrompt, type WorldViewParams } from "./elementForgeConfig";

// ── Types ─────────────────────────────────────────────────────────────────────

interface WorldViewModalProps {
  projectId: Id<"storyboard_projects">;
  onClose: () => void;
}

type Tab = "overview" | "concept" | "generate";

const RESOLUTION_OPTIONS = [
  { value: "1K", label: "1K" },
  { value: "2K", label: "2K" },
  { value: "4K", label: "4K" },
] as const;

const WV_MODELS = [
  { id: "gpt-image-2", label: "GPT Image 2", supportsImg2Img: true },
  { id: "nano-banana-2", label: "Nano Banana 2", supportsImg2Img: true },
  { id: "nano-banana-pro", label: "Nano Banana Pro", supportsImg2Img: true },
  { id: "z-image", label: "Z-Image", supportsImg2Img: false },
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export function WorldViewModal({ projectId, onClose }: WorldViewModalProps) {
  const { user } = useUser();
  const companyId = useCurrentCompanyId() || "personal";
  const { getModelCredits } = usePricingData();

  const [tab, setTab] = useState<Tab>("overview");
  const [conceptText, setConceptText] = useState("");
  const [conceptDirty, setConceptDirty] = useState(false);
  const [conceptGenerating, setConceptGenerating] = useState(false);
  const [conceptSaving, setConceptSaving] = useState(false);
  const [resolution, setResolution] = useState<"1K" | "2K" | "4K">("1K");
  const [selectedModelId, setSelectedModelId] = useState<string>("gpt-image-2");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [showResolutionMenu, setShowResolutionMenu] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [conceptCopied, setConceptCopied] = useState(false);
  const variantScrollRef = useRef<HTMLDivElement>(null);
  const sheetsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // ── Queries ──────────────────────────────────────────────────────────────────

  const project = useQuery(api.storyboard.projects.get, { id: projectId });
  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    companyId,
  });
  const worldViewFiles = useQuery(api.storyboard.storyboardFiles.listByProject, {
    projectId,
    category: "worldview",
  });

  // ── Mutations ─────────────────────────────────────────────────────────────────

  const updateWorldView = useMutation(api.storyboard.projects.updateWorldView);
  const removeFile = useMutation(api.storyboard.storyboardFiles.remove);

  // ── Effects ───────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (project?.worldViewConcept !== undefined && !conceptDirty) {
      setConceptText(project.worldViewConcept ?? "");
    }
  }, [project?.worldViewConcept, conceptDirty]);

  // ── Derived ───────────────────────────────────────────────────────────────────

  const characters = (elements ?? []).filter(e => e.type === "character");
  const environments = (elements ?? []).filter(e => e.type === "environment");
  const props = (elements ?? []).filter(e => e.type === "prop");

  // Auto-collect element primary images as reference
  const elementRefImages = (elements ?? [])
    .map(el => {
      const url = el.referenceUrls?.[el.primaryIndex ?? 0] || el.thumbnailUrl;
      return url ? { name: el.name, type: el.type, url } : null;
    })
    .filter(Boolean) as { name: string; type: string; url: string }[];

  const resolvedModel = (() => {
    const wvModel = WV_MODELS.find(m => m.id === selectedModelId) ?? WV_MODELS[0];
    if (selectedModelId === "gpt-image-2") {
      return elementRefImages.length > 0 ? "gpt-image-2-image-to-image" : "gpt-image-2-text-to-image";
    }
    return wvModel.supportsImg2Img && elementRefImages.length > 0
      ? selectedModelId
      : selectedModelId;
  })();

  const creditsForResolution = (() => {
    const c = getModelCredits(resolvedModel, resolution);
    return Number.isFinite(c) && c > 0 ? c : 4;
  })();

  const generatedFiles = (worldViewFiles ?? []).filter(f => f.status !== "deleted");
  const pendingFiles = generatedFiles.filter(f => f.status === "generating" || f.status === "pending");
  const failedFiles = generatedFiles.filter(f => f.status === "failed");
  const completedFiles = generatedFiles.filter(f => f.status !== "generating" && f.status !== "pending" && f.status !== "failed" && f.sourceUrl);

  useEffect(() => {
    if (generatedFiles.length > 0) {
      sheetsRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [generatedFiles.length]);

  // ── Handlers ──────────────────────────────────────────────────────────────────

  const handleGenerateConcept = useCallback(async () => {
    if (conceptGenerating || !project) return;
    setConceptGenerating(true);
    try {
      const allElements = (elements ?? []).map(el => ({
        name: el.name,
        type: el.type as string,
        identity: el.identity,
        primaryImageUrl: el.referenceUrls?.[el.primaryIndex ?? 0] || el.thumbnailUrl || "",
      }));
      const res = await fetch("/api/ps-distill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "worldview",
          elements: allElements,
          projectScript: project.script ?? "",
          projectName: project.name,
          genre: project.settings?.genre,
        }),
      });
      if (!res.ok) throw new Error("Concept generation failed");
      const data = await res.json();
      const generated = (data.concept ?? "").replace(/^#+[^\n]*\n?/, "").trim();
      if (generated) {
        setConceptText(generated);
        setConceptDirty(true);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to generate concept");
    } finally {
      setConceptGenerating(false);
    }
  }, [conceptGenerating, project, elements]);

  const handleSaveConcept = useCallback(async () => {
    if (conceptSaving) return;
    setConceptSaving(true);
    try {
      await updateWorldView({ id: projectId, worldViewConcept: conceptText });
      setConceptDirty(false);
      toast.success("Concept saved");
    } catch (e: any) {
      toast.error(e.message || "Failed to save concept");
    } finally {
      setConceptSaving(false);
    }
  }, [conceptSaving, conceptText, projectId, updateWorldView]);

  const handleGenerate = useCallback(async () => {
    if (generating || !project) return;
    const concept = conceptText.trim() || project.worldViewConcept?.trim() || "";
    const allElements: WorldViewParams["elements"] = (elements ?? []).map(el => ({
      name: el.name,
      type: el.type as string,
      identity: el.identity,
      primaryImageUrl: el.referenceUrls?.[el.primaryIndex ?? 0] || el.thumbnailUrl || "",
    }));
    const prompt = composeWorldViewPrompt({
      concept,
      elements: allElements,
      projectName: project.name,
    });
    const refUrls = elementRefImages.map(r => r.url).filter(Boolean);
    const model = resolvedModel;
    const isGptImage2 = model.startsWith("gpt-image-2");
    setGenerating(true);
    try {
      const res = await fetch("/api/storyboard/generate-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sceneContent: prompt,
          model,
          quality: isGptImage2 ? JSON.stringify({
            type: "gpt-image-2",
            mode: refUrls.length > 0 ? "image-to-image" : "text-to-image",
            nsfwChecker: false,
          }) : undefined,
          aspectRatio: "16:9",
          resolution,
          companyId,
          userId: user?.id,
          projectId: projectId as string,
          categoryId: projectId,
          category: "worldview",
          enhance: false,
          creditsUsed: creditsForResolution,
          referenceImageUrls: refUrls.length > 0 ? refUrls : undefined,
          variantLabel: "World View Sheet",
          variantModel: model,
          outputFormat: "png",
        }),
      });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || "Generation failed");
      toast.success(`World view sheet generating — ${creditsForResolution} credits`);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate world view sheet");
    } finally {
      setGenerating(false);
    }
  }, [generating, project, conceptText, elements, elementRefImages, companyId, user, projectId, resolution, creditsForResolution]);

  // ── Render ────────────────────────────────────────────────────────────────────

  if (!project) return null;

  const genre = (project as any).settings?.genre;
  const scriptWordCount = project.script
    ? project.script.trim().split(/\s+/).length
    : 0;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
        {/* Modal */}
        <div
          className="relative flex flex-col bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl w-full max-w-2xl max-h-[88vh] overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-5 pb-0 shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                <Globe className="w-4 h-4 text-indigo-400" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-(--text-primary)">World View Sheet</h2>
                <p className="text-[11px] text-(--text-tertiary)">{project.name}</p>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/8 transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Tab bar */}
          <div className="flex items-center gap-0 px-5 mt-4 border-b border-(--border-primary) shrink-0">
            {(["overview", "concept", "generate"] as Tab[]).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-2.5 text-[13px] font-medium border-b-2 transition-colors capitalize ${
                  tab === t
                    ? "border-indigo-400 text-(--text-primary)"
                    : "border-transparent text-(--text-tertiary) hover:text-(--text-secondary)"
                }`}
              >
                {t}
                {t === "concept" && conceptDirty && (
                  <span className="ml-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                )}
                {t === "generate" && pendingFiles.length > 0 && (
                  <span className="ml-1.5 text-[10px] text-indigo-400">({pendingFiles.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <div ref={contentRef} className="flex-1 min-h-0 overflow-y-auto p-5">

            {/* ── Overview ── */}
            {tab === "overview" && (
              <div className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-(--bg-primary) rounded-xl p-3 border border-(--border-primary)">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-1">Genre</div>
                    <div className="text-[13px] font-medium text-(--text-primary) capitalize">{genre || "—"}</div>
                  </div>
                  <div className="bg-(--bg-primary) rounded-xl p-3 border border-(--border-primary)">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-1">Script</div>
                    <div className="text-[13px] font-medium text-(--text-primary)">{scriptWordCount > 0 ? `${scriptWordCount.toLocaleString()} words` : "—"}</div>
                  </div>
                  <div className="bg-(--bg-primary) rounded-xl p-3 border border-(--border-primary)">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-1">Elements</div>
                    <div className="text-[13px] font-medium text-(--text-primary)">{(elements ?? []).length}</div>
                  </div>
                </div>

                {/* Elements breakdown */}
                {[
                  { label: "Characters", items: characters, color: "text-purple-400", Icon: User },
                  { label: "Environments", items: environments, color: "text-emerald-400", Icon: Trees },
                  { label: "Props", items: props, color: "text-blue-400", Icon: Package },
                ].map(({ label, items, color, Icon }) => items.length > 0 && (
                  <div key={label}>
                    <div className={`flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider mb-2 ${color}`}>
                      <Icon className="w-3.5 h-3.5" />
                      {label} ({items.length})
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {items.map(el => {
                        const thumb = el.referenceUrls?.[el.primaryIndex ?? 0] || el.thumbnailUrl;
                        return (
                          <div key={el._id} className="flex items-center gap-2 bg-(--bg-primary) border border-(--border-primary) rounded-lg px-2.5 py-1.5">
                            {thumb ? (
                              <img src={thumb} alt={el.name} className="w-6 h-6 rounded object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded bg-white/8 flex items-center justify-center">
                                <Icon className="w-3 h-3 text-(--text-tertiary)" />
                              </div>
                            )}
                            <span className="text-[12px] text-(--text-secondary)">{el.name}</span>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}

                {/* World view image thumbnail if exists */}
                {(project as any).worldViewImageUrl && (
                  <div>
                    <div className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2">Primary Sheet</div>
                    <button
                      onClick={() => setLightboxUrl((project as any).worldViewImageUrl)}
                      className="relative group rounded-xl overflow-hidden border border-(--border-primary) hover:border-white/25 transition-colors w-full"
                    >
                      <img
                        src={(project as any).worldViewImageUrl}
                        alt="World view sheet"
                        className="w-full aspect-video object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-all">
                        <Maximize2 className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* ── Concept ── */}
            {tab === "concept" && (
              <div className="flex flex-col gap-4 h-full">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] text-(--text-secondary)">Write or generate a cinematic prose summary of the full story universe. This becomes the narrative core of the World View Sheet.</p>
                  </div>
                </div>
                <div className="relative flex-1">
                  <textarea
                    value={conceptText}
                    onChange={e => { setConceptText(e.target.value); setConceptDirty(true); }}
                    placeholder="A cinematic world concept — its characters, setting, emotional arc, and visual DNA. Keep it to 150–200 words."
                    className="min-h-[200px] w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3 pr-10 text-[13px] text-(--text-secondary) leading-relaxed placeholder:text-(--text-tertiary) outline-none focus:border-indigo-400/40 resize-none transition-colors"
                  />
                  {conceptText && (
                    <button
                      onClick={async () => {
                        await navigator.clipboard.writeText(conceptText);
                        setConceptCopied(true);
                        setTimeout(() => setConceptCopied(false), 2000);
                      }}
                      className="absolute top-2.5 right-2.5 p-1.5 rounded-md text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/8 transition-colors"
                      title="Copy concept"
                    >
                      {conceptCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGenerateConcept}
                    disabled={conceptGenerating || !project.script?.trim()}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title={!project.script?.trim() ? "Add a script first to generate a concept" : undefined}
                  >
                    {conceptGenerating ? (
                      <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-3.5 h-3.5" /> Generate Concept</>
                    )}
                  </button>
                  {conceptDirty && (
                    <button
                      onClick={handleSaveConcept}
                      disabled={conceptSaving}
                      className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[12px] font-medium bg-white/8 hover:bg-white/12 text-(--text-primary) disabled:opacity-40 transition-colors"
                    >
                      {conceptSaving ? (
                        <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Saving...</>
                      ) : (
                        <><Check className="w-3.5 h-3.5" /> Save</>
                      )}
                    </button>
                  )}
                  {!project.script?.trim() && (
                    <span className="text-[11px] text-(--text-tertiary)">Add a script to enable AI concept generation</span>
                  )}
                </div>
              </div>
            )}

            {/* ── Generate ── */}
            {tab === "generate" && (
              <div className="flex flex-col gap-5">
                {/* Reference images */}
                {elementRefImages.length > 0 && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">
                      Element References ({elementRefImages.length}) — auto-populated
                    </label>
                    <div className="flex gap-2 flex-wrap">
                      {elementRefImages.map((r, i) => (
                        <div key={i} className="relative group">
                          <img src={r.url} alt={r.name} className="w-14 h-14 rounded-lg object-cover border border-(--border-primary)" />
                          <div className="absolute inset-0 rounded-lg bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="text-[9px] text-white font-medium text-center px-1 leading-tight">{r.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                    <p className="text-[11px] text-(--text-tertiary) mt-1.5">Character and environment images will guide the visual style.</p>
                  </div>
                )}

                {/* Concept preview */}
                {(conceptText || project.worldViewConcept) && (
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">
                      Concept {!conceptText && project.worldViewConcept ? "(saved)" : conceptDirty ? "(unsaved)" : ""}
                    </label>
                    <p className="text-[12px] text-(--text-secondary) leading-relaxed line-clamp-4 bg-(--bg-primary) rounded-xl px-3 py-2.5 border border-(--border-primary)">
                      {conceptText || project.worldViewConcept}
                    </p>
                    {!conceptText && !project.worldViewConcept && (
                      <button onClick={() => setTab("concept")} className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1 transition-colors">
                        Go to Concept tab to write or generate →
                      </button>
                    )}
                  </div>
                )}
                {!conceptText && !project.worldViewConcept && (
                  <div className="bg-(--bg-primary) rounded-xl px-3 py-3 border border-(--border-primary)">
                    <p className="text-[12px] text-(--text-tertiary)">No concept yet — sheet will be generated from element data alone.</p>
                    <button onClick={() => setTab("concept")} className="text-[11px] text-indigo-400 hover:text-indigo-300 mt-1 transition-colors">
                      Generate a concept first →
                    </button>
                  </div>
                )}

                {/* Generation controls */}
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Model picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowModelMenu(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-primary) hover:border-white/20 text-[12px] font-medium text-(--text-primary) transition-colors"
                    >
                      {WV_MODELS.find(m => m.id === selectedModelId)?.label ?? "GPT Image 2"}
                      <ChevronDown className={`w-3 h-3 text-(--text-tertiary) transition-transform ${showModelMenu ? "rotate-180" : ""}`} />
                    </button>
                    {showModelMenu && (
                      <div className="absolute left-0 top-full mt-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-xl overflow-hidden min-w-[160px]">
                        {WV_MODELS.map(m => (
                          <button
                            key={m.id}
                            onClick={() => { setSelectedModelId(m.id); setShowModelMenu(false); }}
                            className={`w-full flex items-center px-3 py-2 text-[12px] hover:bg-white/8 transition-colors ${selectedModelId === m.id ? "text-(--text-primary)" : "text-(--text-secondary)"}`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Resolution picker */}
                  <div className="relative">
                    <button
                      onClick={() => setShowResolutionMenu(v => !v)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-primary) hover:border-white/20 text-[12px] font-medium text-(--text-primary) transition-colors"
                    >
                      {resolution}
                      <ChevronDown className={`w-3 h-3 text-(--text-tertiary) transition-transform ${showResolutionMenu ? "rotate-180" : ""}`} />
                    </button>
                    {showResolutionMenu && (
                      <div className="absolute left-0 top-full mt-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-xl overflow-hidden min-w-[120px]">
                        {RESOLUTION_OPTIONS.map(opt => {
                          const cr = getModelCredits(resolvedModel, opt.value);
                          const crDisplay = Number.isFinite(cr) && cr > 0 ? cr : "—";
                          return (
                            <button
                              key={opt.value}
                              onClick={() => { setResolution(opt.value); setShowResolutionMenu(false); }}
                              className={`w-full flex items-center justify-between px-3 py-2 text-[12px] hover:bg-white/8 transition-colors ${resolution === opt.value ? "text-(--text-primary)" : "text-(--text-secondary)"}`}
                            >
                              <span>{opt.label}</span>
                              <span className="text-(--text-tertiary)">{crDisplay}cr</span>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1 text-[12px] text-(--text-secondary)">
                    <Coins className="w-3.5 h-3.5 text-amber-400" />
                    <span>{creditsForResolution}</span>
                  </div>

                  <button
                    onClick={handleGenerate}
                    disabled={generating}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-semibold bg-indigo-500 hover:bg-indigo-400 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  >
                    {generating ? (
                      <><Loader2 className="w-4 h-4 animate-spin" /> Generating...</>
                    ) : (
                      <><Sparkles className="w-4 h-4" /> Generate Sheet</>
                    )}
                  </button>
                </div>

                {/* Generated sheets gallery */}
                <div ref={sheetsRef}>
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">
                    Generated Sheets {generatedFiles.length > 0 && `(${generatedFiles.length})`}
                  </label>
                  {generatedFiles.length === 0 ? (
                    <div className="flex flex-col items-center justify-center gap-2 w-full h-24 rounded-xl border border-dashed border-(--border-primary) text-(--text-tertiary)">
                      <ImageIcon className="w-5 h-5 opacity-40" />
                      <span className="text-[12px]">No sheets yet — generate above</span>
                    </div>
                  ) : (
                    <div
                      ref={variantScrollRef}
                      className="flex gap-3 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none"
                      style={{ scrollbarWidth: "none" }}
                      onMouseDown={e => {
                        const el = variantScrollRef.current;
                        if (!el) return;
                        const startX = e.pageX;
                        const scrollLeft = el.scrollLeft;
                        const onMove = (ev: MouseEvent) => { el.scrollLeft = scrollLeft - (ev.pageX - startX); };
                        const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                        window.addEventListener("mousemove", onMove);
                        window.addEventListener("mouseup", onUp);
                      }}
                    >
                      {/* Loading cards */}
                      {pendingFiles.map(f => (
                        <div key={f._id} className="shrink-0 w-[180px] rounded-xl overflow-hidden border-2 border-blue-500/30">
                          <div className="w-full aspect-video bg-(--bg-primary) flex flex-col items-center justify-center gap-2">
                            <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-[11px] text-blue-400 font-medium">Generating...</span>
                          </div>
                          <div className="px-2 py-1.5 bg-(--bg-primary)">
                            <span className="text-[11px] text-blue-400 truncate block">World View Sheet</span>
                          </div>
                        </div>
                      ))}
                      {/* Failed cards */}
                      {failedFiles.map(f => (
                        <div key={f._id} className="group shrink-0 w-[180px] rounded-xl overflow-hidden border-2 border-red-500/30">
                          <div className="w-full aspect-video bg-(--bg-primary) flex flex-col items-center justify-center gap-2">
                            <AlertCircle className="w-5 h-5 text-red-400" />
                            <span className="text-[11px] text-red-400 font-medium">Generation Failed</span>
                            <button
                              onClick={() => removeFile({ id: f._id })}
                              className="mt-1 px-3 py-1 bg-red-500 text-white text-[10px] font-medium rounded-md hover:bg-red-600 transition"
                            >
                              Delete
                            </button>
                          </div>
                          <div className="px-2 py-1.5 bg-(--bg-primary)">
                            <span className="text-[11px] text-red-400 truncate block">Failed</span>
                          </div>
                        </div>
                      ))}
                      {/* Success cards */}
                      {completedFiles.map((f, idx) => (
                        <div key={f._id} className={`group relative shrink-0 w-[180px] rounded-xl overflow-hidden border-2 transition-all ${
                          idx === 0 ? "border-amber-400 ring-1 ring-amber-400/20" : "border-transparent hover:border-white/20"
                        }`}>
                          <button onClick={() => setLightboxUrl(f.sourceUrl!)} className="w-full">
                            <img src={f.sourceUrl!} alt="World view sheet" className="w-full aspect-video object-cover" />
                          </button>
                          <div className="absolute inset-x-0 top-0 opacity-0 group-hover:opacity-100 transition-opacity flex justify-end gap-1 p-1.5">
                            <button
                              onClick={() => setLightboxUrl(f.sourceUrl!)}
                              className="p-1.5 bg-black/60 rounded-lg hover:bg-black/80 transition"
                              title="View full size"
                            >
                              <Maximize2 className="w-3.5 h-3.5 text-white" />
                            </button>
                            <button
                              onClick={() => removeFile({ id: f._id })}
                              className="p-1.5 bg-red-500/60 rounded-lg hover:bg-red-500/80 transition"
                              title="Delete"
                            >
                              <X className="w-3.5 h-3.5 text-white" />
                            </button>
                          </div>
                          <div className="px-2 py-1.5 bg-(--bg-primary)">
                            <span className="text-[11px] text-(--text-secondary) truncate block">
                              {(f.metadata as any)?.variantLabel || "World View Sheet"}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <div
          className="fixed inset-0 z-60 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
        >
          <button onClick={() => setLightboxUrl(null)} className="absolute top-4 right-4 p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors z-10">
            <X className="w-5 h-5" />
          </button>
          <img
            src={lightboxUrl}
            alt="World view sheet"
            className="max-w-full max-h-full object-contain rounded-xl shadow-2xl"
            onClick={e => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
