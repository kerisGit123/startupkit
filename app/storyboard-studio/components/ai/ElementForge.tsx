"use client";

import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  X, Shuffle, ChevronDown, ChevronRight, ChevronLeft, Sparkles, Check, User, Trees, Package,
  ImagePlus, Send, FileText, Crop, Upload, Trash2, Star, Coins, Monitor, RectangleHorizontal, Zap, Camera, FolderOpen,
  RefreshCw, Copy, AlertCircle, Expand,
} from "lucide-react";
import { uploadToR2, deleteFromR2 } from "@/lib/uploadToR2";
import { usePricingData } from "../shared/usePricingData";
import { FileBrowser } from "./FileBrowser";
import {
  type ForgeElementType,
  type ForgeStep,
  type ForgeField,
  type ForgeOption,
  getStepsForType,
  composePrompt,
  composeImageOverrides,
  getIdentityBadges,
  randomizeIdentity,
} from "./elementForgeConfig";
import { ThumbnailCropper } from "./ThumbnailCropper";

// Fallback templates if no prompt templates exist in the database
const FALLBACK_TEMPLATES: Record<ForgeElementType, { name: string; prompt: string }[]> = {
  character: [
    { name: "Basic Character Reference", prompt: "Create a professional character reference sheet based on: {description}. Photorealistic, high detail, clean dark studio background, consistent lighting." },
  ],
  environment: [
    { name: "Basic Environment Reference", prompt: "Cinematic establishing shot of {description}. Photorealistic, high detail, atmospheric lighting." },
  ],
  prop: [
    { name: "Basic Prop Reference", prompt: "Product photography of {description}. Clean background, studio lighting, high detail." },
  ],
};

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ElementForgeProps {
  mode: "create" | "edit";
  type: ForgeElementType;
  projectId: Id<"storyboard_projects">;
  userId: string;
  companyId?: string;
  showSendToStudio?: boolean;
  onSave: (element: { name: string; type: string; description: string; identity: Record<string, any> }) => void;
  onClose: () => void;
  onSendToStudio?: (prompt: string, referenceUrls: string[]) => void;
  onOpenFileBrowser?: () => void;
  onGenerating?: (elementId: Id<"storyboard_elements">) => void;
  element?: {
    _id: Id<"storyboard_elements">;
    name: string;
    type: string;
    description?: string;
    identity?: Record<string, any>;
    thumbnailUrl?: string;
    referenceUrls?: string[];
    referencePhotos?: {
      face?: string;
      outfit?: string;
      fullBody?: string;
      head?: string;
      body?: string;
    };
    variants?: { label: string; model: string; createdAt: number }[];
    primaryIndex?: number;
  } | null;
}

const TYPE_META: Record<ForgeElementType, { label: string; Icon: typeof User; accent: string; title: string }> = {
  character: { label: "Character", Icon: User, accent: "text-purple-400", title: "CREATE YOUR CHARACTER" },
  environment: { label: "Environment", Icon: Trees, accent: "text-emerald-400", title: "CREATE YOUR ENVIRONMENT" },
  prop: { label: "Prop", Icon: Package, accent: "text-blue-400", title: "CREATE YOUR PROP" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

function FieldText({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <input value={value || ""} onChange={(e) => onChange(e.target.value)} placeholder={field.placeholder}
      className="w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3 text-[15px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors" />
  );
}

function FieldTextarea({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      rows={5}
      className="w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3 text-[14px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors resize-y leading-relaxed"
    />
  );
}

function FieldButtonGroup({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((opt) => (
        <button key={opt.key} onClick={() => onChange(value === opt.key ? "" : opt.key)}
          className={`px-4 py-2 rounded-xl text-[13px] font-medium transition-all duration-200 border ${
            value === opt.key ? "bg-(--accent-blue)/12 text-(--text-primary) border-(--accent-blue)/40"
              : "text-(--text-secondary) border-transparent hover:bg-white/5 hover:text-(--text-primary)"
          }`}>{opt.label}</button>
      ))}
    </div>
  );
}

function FieldEraSlider({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  const options = field.options || [];
  const selectedIdx = options.findIndex(o => o.key === value);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const dragStartX = useRef(0);
  const scrollStartX = useRef(0);
  const ITEM_W = 100;

  // The inner content has padding = 50% - ITEM_W/2 on each side
  // so item[i] center is at: padding + i * ITEM_W + ITEM_W/2
  const getPadding = useCallback(() => {
    const el = containerRef.current;
    return el ? (el.clientWidth / 2 - ITEM_W / 2) : 0;
  }, []);

  const scrollToIdx = useCallback((idx: number, smooth = true) => {
    const el = containerRef.current;
    if (!el) return;
    const pad = getPadding();
    const target = pad + idx * ITEM_W + ITEM_W / 2 - el.clientWidth / 2;
    el.scrollTo({ left: target, behavior: smooth ? "smooth" : "auto" });
  }, [getPadding]);

  const getIdxFromScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return 0;
    const pad = getPadding();
    const center = el.scrollLeft + el.clientWidth / 2;
    const idx = Math.round((center - pad - ITEM_W / 2) / ITEM_W);
    return Math.max(0, Math.min(options.length - 1, idx));
  }, [options.length, getPadding]);

  // Snap to nearest item center after scroll/drag ends
  const snapToNearest = useCallback(() => {
    const idx = getIdxFromScroll();
    scrollToIdx(idx);
    if (options[idx] && options[idx].key !== value) {
      onChange(options[idx].key);
    }
  }, [options, value, onChange, getIdxFromScroll, scrollToIdx]);

  // Scroll selected into center on mount / value change
  useEffect(() => {
    if (selectedIdx < 0) return;
    // Small delay to ensure container is rendered with correct width
    requestAnimationFrame(() => scrollToIdx(selectedIdx, false));
  }, [selectedIdx, scrollToIdx]);

  // Mouse drag handlers
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    isDragging.current = true;
    dragStartX.current = e.clientX;
    scrollStartX.current = containerRef.current?.scrollLeft || 0;
    if (containerRef.current) containerRef.current.style.cursor = "grabbing";
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current || !containerRef.current) return;
      const dx = dragStartX.current - e.clientX;
      containerRef.current.scrollLeft = scrollStartX.current + dx;
    };
    const handleMouseUp = () => {
      if (!isDragging.current) return;
      isDragging.current = false;
      if (containerRef.current) containerRef.current.style.cursor = "grab";
      snapToNearest();
    };
    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseup", handleMouseUp);
    return () => { window.removeEventListener("mousemove", handleMouseMove); window.removeEventListener("mouseup", handleMouseUp); };
  }, [snapToNearest]);

  // Also snap after scroll (wheel/touch)
  const scrollTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const handleScroll = useCallback(() => {
    clearTimeout(scrollTimer.current);
    scrollTimer.current = setTimeout(snapToNearest, 150);
  }, [snapToNearest]);

  // Calculate which index is currently centered (for visual highlight)
  const [centeredIdx, setCenteredIdx] = useState(selectedIdx >= 0 ? selectedIdx : 0);
  const updateCentered = useCallback(() => {
    setCenteredIdx(getIdxFromScroll());
  }, [getIdxFromScroll]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateCentered);
    return () => el.removeEventListener("scroll", updateCentered);
  }, [updateCentered]);

  return (
    <div className="relative py-2">
      {/* Center indicator line */}
      <div className="absolute left-1/2 top-2 -translate-x-1/2 w-[3px] h-9 bg-(--accent-blue) rounded-full z-20 pointer-events-none" />

      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onScroll={handleScroll}
        className="overflow-x-auto select-none"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none", cursor: "grab" } as any}
      >
        <style>{`.era-drag::-webkit-scrollbar { display: none; }`}</style>
        <div className="era-drag flex flex-col min-w-max" style={{ padding: `0 calc(50% - ${ITEM_W / 2}px)` }}>
          {/* Ticks row */}
          <div className="flex items-end h-10">
            {options.map((_, i) => (
              <div key={i} className="shrink-0 flex items-end justify-center" style={{ width: ITEM_W }}>
                {/* 5 sub-ticks per item */}
                <div className="flex items-end gap-[6px] w-full justify-around px-1">
                  {[0,1,2,3,4].map(t => {
                    const isMajor = t === 2;
                    const dist = Math.abs(i - centeredIdx);
                    const op = dist === 0 ? 0.6 : dist <= 2 ? 0.25 : 0.1;
                    return <div key={t} className="w-px" style={{
                      height: isMajor ? 18 : t % 2 === 0 ? 12 : 8,
                      backgroundColor: `rgba(255,255,255,${op})`,
                    }} />;
                  })}
                </div>
              </div>
            ))}
          </div>
          {/* Labels row */}
          <div className="flex mt-1">
            {options.map((opt, i) => {
              const dist = Math.abs(i - centeredIdx);
              const isCenter = dist === 0;
              const opacity = isCenter ? 1 : dist === 1 ? 0.5 : dist === 2 ? 0.28 : 0.1;

              return (
                <div key={opt.key} className="shrink-0 text-center" style={{ width: ITEM_W }}>
                  <span className="whitespace-nowrap block transition-all duration-150" style={{
                    fontSize: isCenter ? 28 : dist === 1 ? 16 : 13,
                    fontWeight: isCenter ? 800 : 500,
                    opacity,
                    color: "var(--text-primary)",
                    letterSpacing: isCenter ? "-0.02em" : "0",
                  }}>
                    {opt.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* Fade edges */}
      <div className="absolute inset-y-0 left-0 w-24 bg-linear-to-r from-(--bg-secondary) to-transparent pointer-events-none z-10" />
      <div className="absolute inset-y-0 right-0 w-24 bg-linear-to-l from-(--bg-secondary) to-transparent pointer-events-none z-10" />
    </div>
  );
}

function FieldImageUpload({
  field, value, onChange, onBrowse, onPreview,
}: {
  field: ForgeField; value: string; onChange: (v: string) => void;
  onBrowse: () => void; onPreview?: (url: string) => void;
}) {
  if (value) {
    return (
      <div className="relative group w-full h-36 rounded-xl overflow-hidden border border-(--border-primary)">
        <img src={value} alt={field.label} className="w-full h-full object-cover cursor-pointer" onDoubleClick={() => onPreview?.(value)} />
        {/* Hover overlay with actions */}
        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center gap-2">
          <button
            onClick={() => onPreview?.(value)}
            className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-all backdrop-blur-sm"
            title="Preview full size"
          >
            <ImagePlus size={14} />
          </button>
          <button
            onClick={onBrowse}
            className="p-2 rounded-lg bg-white/15 text-white hover:bg-white/25 transition-all backdrop-blur-sm"
            title="Change image"
          >
            <FolderOpen size={14} />
          </button>
          <button
            onClick={() => onChange("")}
            className="p-2 rounded-lg bg-red-500/30 text-white hover:bg-red-500/50 transition-all backdrop-blur-sm"
            title="Remove image"
          >
            <Trash2 size={14} />
          </button>
        </div>
        <div className="absolute bottom-0 inset-x-0 bg-black/50 px-3 py-1 text-[11px] text-(--text-secondary)">
          {field.label}
        </div>
      </div>
    );
  }

  return (
    <div
      onClick={onBrowse}
      className="w-full h-36 rounded-xl border-2 border-dashed border-(--border-primary) hover:border-(--accent-blue)/40 flex flex-col items-center justify-center gap-2 cursor-pointer transition-colors"
    >
      <Upload size={20} className="text-(--text-tertiary)" />
      <span className="text-[12px] text-(--text-tertiary)">{field.placeholder || field.label}</span>
    </div>
  );
}

function FieldCombobox({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || "");
  const options = field.options || [];
  const filtered = options.filter(o => o.label.toLowerCase().includes(inputValue.toLowerCase()));

  return (
    <div className="relative">
      <input
        value={inputValue}
        onChange={(e) => { setInputValue(e.target.value); onChange(e.target.value); setOpen(true); }}
        onFocus={() => setOpen(true)}
        placeholder={field.placeholder}
        className="w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3 text-[15px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors"
      />
      {open && filtered.length > 0 && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl max-h-[200px] overflow-y-auto py-1">
            {filtered.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setInputValue(opt.label); onChange(opt.label); setOpen(false); }}
                className={`w-full text-left px-4 py-2 text-[13px] hover:bg-white/5 transition-colors ${
                  inputValue === opt.label ? "text-(--text-primary) bg-white/5" : "text-(--text-secondary)"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

function FieldColorDots({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-3">
      {field.options?.map((opt) => (
        <button key={opt.key} onClick={() => onChange(value === opt.key ? "" : opt.key)} title={opt.label}
          className={`flex flex-col items-center gap-1.5 p-2 rounded-xl transition-all duration-200 ${
            value === opt.key ? "bg-white/8 ring-1 ring-(--accent-blue)/40 scale-105" : "hover:bg-white/5"
          }`}>
          <span className={`w-7 h-7 rounded-full border-2 transition-all ${value === opt.key ? "border-white/50 shadow-lg" : "border-white/10"}`}
            style={{ backgroundColor: opt.color }} />
          <span className={`text-[10px] font-medium ${value === opt.key ? "text-(--text-primary)" : "text-(--text-tertiary)"}`}>{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAROUSEL — Higgsfield-style horizontal scrollable option strip
// ═══════════════════════════════════════════════════════════════════════════════

function CarouselCard({ opt, selected, onClick }: { opt: ForgeOption; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`relative shrink-0 flex flex-col items-center gap-2.5 rounded-2xl transition-all duration-200 overflow-hidden ${
        selected ? "ring-2 ring-(--accent-blue) ring-offset-2 ring-offset-[var(--bg-secondary)]"
          : "hover:brightness-110"
      }`}
      style={{ width: 160 }}
    >
      {opt.icon ? (
        <div className={`w-[160px] h-[180px] overflow-hidden rounded-2xl transition-all duration-200 ${
          selected ? "brightness-110" : "brightness-75 hover:brightness-100"
        }`}>
          <img src={opt.icon} alt={opt.label} className="w-full h-full object-cover" draggable={false} />
        </div>
      ) : opt.color ? (
        <div className={`w-[160px] h-[180px] rounded-2xl flex items-center justify-center transition-all duration-200 bg-white/3 ${
          selected ? "ring-2 ring-(--accent-blue)" : ""
        }`}>
          <div className="w-20 h-20 rounded-full border-3 shadow-lg transition-all" style={{
            backgroundColor: opt.color,
            borderColor: selected ? "rgba(255,255,255,0.5)" : "rgba(255,255,255,0.12)",
          }} />
        </div>
      ) : (
        <div className={`w-[160px] h-[180px] rounded-2xl flex items-center justify-center text-[32px] font-bold transition-all ${
          selected ? "bg-(--accent-blue)/15 text-(--accent-blue)" : "bg-white/4 text-(--text-tertiary)"
        }`}>{opt.label.charAt(0)}</div>
      )}
      <span className={`text-[13px] font-medium text-center leading-tight ${
        selected ? "text-(--text-primary)" : "text-(--text-tertiary)"
      }`}>{opt.label}</span>
      {selected && (
        <div className="absolute top-3 right-3 w-6 h-6 rounded-full bg-(--accent-blue) flex items-center justify-center shadow-md">
          <Check className="w-3.5 h-3.5 text-white" strokeWidth={2.5} />
        </div>
      )}
    </button>
  );
}

function FieldCarousel({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [updateScrollState, field.options]);

  // Scroll selected item into view on mount
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !value) return;
    const idx = field.options?.findIndex(o => o.key === value) ?? -1;
    if (idx >= 0) {
      const child = el.children[idx] as HTMLElement;
      if (child) child.scrollIntoView({ behavior: "auto", block: "nearest", inline: "center" });
    }
  }, []);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 350, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {/* Left arrow */}
      {canScrollLeft && (
        <button onClick={() => scroll(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all shadow-lg">
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
      {/* Right arrow */}
      {canScrollRight && (
        <button onClick={() => scroll(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all shadow-lg">
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </button>
      )}

      {/* Scrollable row */}
      <div ref={scrollRef}
        className="flex gap-5 overflow-x-auto py-4 px-4 scroll-smooth items-end justify-center"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as any}
      >
        {field.options?.map((opt) => (
          <CarouselCard key={opt.key} opt={opt} selected={value === opt.key}
            onClick={() => onChange(value === opt.key ? "" : opt.key)} />
        ))}
      </div>

      {/* Fade edges */}
      {canScrollLeft && <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-(--bg-secondary) to-transparent pointer-events-none z-10" />}
      {canScrollRight && <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-(--bg-secondary) to-transparent pointer-events-none z-10" />}
    </div>
  );
}

function FieldMultiCarousel({ field, value, onChange }: { field: ForgeField; value: string[]; onChange: (v: string[]) => void }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);

  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollState = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    updateScrollState();
    el.addEventListener("scroll", updateScrollState);
    const ro = new ResizeObserver(updateScrollState);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", updateScrollState); ro.disconnect(); };
  }, [updateScrollState, field.options]);

  const scroll = (dir: number) => {
    scrollRef.current?.scrollBy({ left: dir * 350, behavior: "smooth" });
  };

  return (
    <div className="relative">
      {canScrollLeft && (
        <button onClick={() => scroll(-1)}
          className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all shadow-lg">
          <ChevronLeft className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
      {canScrollRight && (
        <button onClick={() => scroll(1)}
          className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/70 backdrop-blur flex items-center justify-center text-white/80 hover:text-white hover:bg-black/90 transition-all shadow-lg">
          <ChevronRight className="w-5 h-5" strokeWidth={2} />
        </button>
      )}
      <div ref={scrollRef}
        className="flex gap-5 overflow-x-auto py-4 px-4 scroll-smooth items-end justify-center"
        style={{ scrollbarWidth: "none", msOverflowStyle: "none" } as any}>
        {field.options?.map((opt) => (
          <CarouselCard key={opt.key} opt={opt} selected={selected.includes(opt.key)}
            onClick={() => toggle(opt.key)} />
        ))}
      </div>
      {canScrollLeft && <div className="absolute inset-y-0 left-0 w-20 bg-linear-to-r from-(--bg-secondary) to-transparent pointer-events-none z-10" />}
      {canScrollRight && <div className="absolute inset-y-0 right-0 w-20 bg-linear-to-l from-(--bg-secondary) to-transparent pointer-events-none z-10" />}
    </div>
  );
}

function FieldTwoLevelCarousel({ field, value, parentValue, onChange }: {
  field: ForgeField; value: string; parentValue: string; onChange: (v: string) => void;
}) {
  const subOptions = parentValue ? (field.subOptions?.[parentValue] || []) : [];
  if (!parentValue) return <div className="text-[13px] text-(--text-tertiary) italic py-4 text-center">Select a setting first</div>;
  if (subOptions.length === 0) return null;

  const fakeField: ForgeField = { key: field.key, label: field.label, type: "carousel", options: subOptions };
  return <FieldCarousel field={fakeField} value={value} onChange={onChange} />;
}

function TemplateDropdown({ templates, selected, onSelect }: {
  templates: { name: string; prompt: string }[];
  selected: number;
  onSelect: (i: number) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = templates[selected];

  return (
    <div>
      <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-3">
        <FileText className="w-3.5 h-3.5" strokeWidth={1.75} />
        Reference Prompt Template
      </label>
      <div className="relative">
        <button onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-(--border-primary) bg-(--bg-primary) text-left hover:border-white/15 transition-colors">
          <div className="min-w-0 flex-1">
            <div className="text-[13px] font-medium text-(--text-primary) truncate">{current?.name || "Select template"}</div>
            <div className="text-[11px] text-(--text-tertiary) truncate mt-0.5">
              {current?.prompt.replace(/\{description\}/g, "...").slice(0, 80)}
            </div>
          </div>
          <ChevronDown className={`w-4 h-4 text-(--text-tertiary) shrink-0 ml-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} strokeWidth={2} />
        </button>

        {open && (
          <>
            <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
            <div className="absolute top-full left-0 right-0 mt-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl max-h-[240px] overflow-y-auto py-1">
              {templates.map((t, i) => (
                <button key={i} onClick={() => { onSelect(i); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 transition-colors ${
                    i === selected
                      ? "bg-(--accent-blue)/10 text-(--text-primary)"
                      : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
                  }`}>
                  <div className="text-[13px] font-medium truncate">{t.name}</div>
                  <div className="text-[10px] text-(--text-tertiary) truncate mt-0.5">
                    {t.prompt.replace(/\{description\}/g, "...").slice(0, 100)}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function VisualCard({ opt, selected, onClick }: { opt: ForgeOption; selected: boolean; onClick: () => void }) {
  return (
    <button onClick={onClick}
      className={`group relative flex flex-col items-center gap-2 rounded-2xl border-2 transition-all duration-200 overflow-hidden ${
        selected ? "border-(--accent-blue)/60 bg-(--accent-blue)/8 shadow-lg shadow-(--accent-blue)/5"
          : "border-white/5 bg-white/2 hover:border-white/12 hover:bg-white/4"
      }`}>
      {opt.icon ? (
        <div className={`w-full overflow-hidden rounded-t-2xl transition-all duration-200 ${
          selected ? "bg-[#3a4a5c]" : "bg-[#252a32] group-hover:bg-[#2c3340]"
        }`}>
          <img src={opt.icon} alt={opt.label} className={`w-full h-auto object-cover transition-all duration-200 ${
            selected ? "brightness-110" : "brightness-90 group-hover:brightness-100"
          }`} draggable={false} />
        </div>
      ) : (
        <div className={`w-[80px] h-[80px] mx-auto mt-3 rounded-xl flex items-center justify-center text-[22px] font-bold transition-all ${
          selected ? "bg-(--accent-blue)/15 text-(--accent-blue)" : "bg-white/4 text-(--text-tertiary) group-hover:bg-white/6"
        }`}>{opt.label.charAt(0)}</div>
      )}
      <span className={`text-[12px] font-medium text-center leading-tight px-2 pb-2 ${
        selected ? "text-(--text-primary)" : "text-(--text-secondary)"
      }`}>{opt.label}</span>
      {selected && (
        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-(--accent-blue) flex items-center justify-center shadow-md">
          <Check className="w-3 h-3 text-white" strokeWidth={2.5} />
        </div>
      )}
    </button>
  );
}

function FieldVisualGrid({ field, value, onChange, columns = 4 }: { field: ForgeField; value: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {field.options?.map((opt) => (
        <VisualCard key={opt.key} opt={opt} selected={value === opt.key} onClick={() => onChange(value === opt.key ? "" : opt.key)} />
      ))}
    </div>
  );
}

function FieldMultiSelect({ field, value, onChange }: { field: ForgeField; value: string[]; onChange: (v: string[]) => void }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (key: string) => onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  return (
    <div className="grid grid-cols-4 gap-3">
      {field.options?.map((opt) => (
        <VisualCard key={opt.key} opt={opt} selected={selected.includes(opt.key)} onClick={() => toggle(opt.key)} />
      ))}
    </div>
  );
}

function FieldTwoLevel({ field, value, parentValue, onChange, columns = 4 }: {
  field: ForgeField; value: string; parentValue: string; onChange: (v: string) => void; columns?: number;
}) {
  const subOptions = parentValue ? (field.subOptions?.[parentValue] || []) : [];
  if (!parentValue) return <div className="text-[13px] text-(--text-tertiary) italic py-4">Select a setting above to see locations</div>;
  if (subOptions.length === 0) return null;
  return (
    <div className="grid gap-3" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {subOptions.map((opt: ForgeOption) => (
        <VisualCard key={opt.key} opt={opt} selected={value === opt.key} onClick={() => onChange(value === opt.key ? "" : opt.key)} />
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ElementForge({
  mode, type, projectId, userId, companyId,
  showSendToStudio = false, onSave, onClose, onSendToStudio, onOpenFileBrowser, onGenerating, element,
}: ElementForgeProps) {
  const meta = TYPE_META[type];

  // Simple / Advanced mode
  const [isSimple, setIsSimple] = useState(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("forge-mode") : null;
    return stored !== "advanced";
  });
  const toggleMode = useCallback(() => {
    setIsSimple(prev => {
      const next = !prev;
      localStorage.setItem("forge-mode", next ? "simple" : "advanced");
      setActiveTab(0);
      setSubTabIdx(0);
      return next;
    });
  }, []);

  // Human / Non-Human toggle (only for character type)
  const [isNonHuman, setIsNonHuman] = useState(() => {
    if (mode === "edit" && element?.identity) return !!element.identity.isNonHuman;
    return false;
  });

  const wizardSteps = useMemo(() =>
    getStepsForType(type, isNonHuman ? "non-human" : "human", isSimple),
  [type, isNonHuman, isSimple]);

  // Tabs: wizard steps + Prompt + Generate (always)
  const tabs = useMemo(() => {
    const result: { key: string; label: string; type: "wizard" | "prompt" | "generate" }[] = wizardSteps
      .filter(s => s.key !== "references") // "references" step rendered as Generate tab
      .map(s => ({ key: s.key, label: s.label, type: "wizard" as const }));
    result.push({ key: "prompt", label: "Prompt", type: "prompt" });
    result.push({ key: "generate", label: "Generate", type: "generate" });
    return result;
  }, [wizardSteps]);

  // Generation state
  const [genModel, setGenModel] = useState("gpt-image-2-text-to-image");
  const [genAspectRatio, setGenAspectRatio] = useState("16:9");
  const [genResolution, setGenResolution] = useState("1K");
  const [genFormat, setGenFormat] = useState("png");
  const [genGridSize, setGenGridSize] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genVariantLabel, setGenVariantLabel] = useState(() => element?.name || "");
  const [showSettingsPopup, setShowSettingsPopup] = useState(false);
  const { getModelCredits } = usePricingData();

  const [activeTab, setActiveTab] = useState(0);
  const [subTabIdx, setSubTabIdx] = useState(0);
  const [identity, setIdentity] = useState<Record<string, any>>(() => {
    const base: Record<string, any> = mode === "edit" && element?.identity
      ? { name: element.name, ...element.identity }
      : { name: element?.name || "", era: "2020s" };
    // Hydrate ref_* fields from stored referencePhotos
    if (element?.referencePhotos) {
      const rp = element.referencePhotos;
      if (rp.face) base.ref_face = rp.face;
      if (rp.outfit) base.ref_outfit = rp.outfit;
      if (rp.fullBody) base.ref_fullBody = rp.fullBody;
      if (rp.head) base.ref_head = rp.head;
      if (rp.body) base.ref_body = rp.body;
    }
    return base;
  });
  const [saving, setSaving] = useState(false);
  const [referenceUrls, setReferenceUrls] = useState<string[]>(element?.referenceUrls || []);
  const [selectedTemplate, setSelectedTemplate] = useState(0);
  const [cropImageUrl, setCropImageUrl] = useState<string | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState<string>(element?.thumbnailUrl || "");
  const [uploadingThumbnail, setUploadingThumbnail] = useState(false);

  // Live element data from Convex (auto-updates when callback adds variants)
  const liveElement = useQuery(
    api.storyboard.storyboardElements.getById,
    element?._id ? { id: element._id } : "skip"
  );
  // Use live data for variants/refs, fall back to prop
  const liveReferenceUrls = liveElement?.referenceUrls ?? referenceUrls;
  const liveVariants = liveElement?.variants ?? element?.variants;
  const livePrimaryIndex = liveElement?.primaryIndex ?? element?.primaryIndex ?? 0;

  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const updateElement = useMutation(api.storyboard.storyboardElements.update);

  // Load ALL prompt templates for this type from the library (system + user)
  const libraryTemplates = useQuery(api.promptTemplates.getByCompany, companyId ? { companyId } : "skip");
  const allTemplates = useMemo(() => {
    const matching = (libraryTemplates || [])
      .filter((t: any) => t.type === type)
      .map((t: any) => ({
        name: t.name + (t.isSystem ? " (system)" : ""),
        prompt: t.prompt,
      }));
    // Fallback if no templates in library
    if (matching.length === 0) return FALLBACK_TEMPLATES[type] || [];
    return matching;
  }, [libraryTemplates, type]);

  const composedPrompt = useMemo(() => composePrompt(type, identity), [type, identity]);
  const badges = useMemo(() => getIdentityBadges(type, identity), [type, identity]);
  const currentTab = tabs[activeTab];
  const currentWizardStep = currentTab.type === "wizard" ? wizardSteps.find(s => s.key === currentTab.key) : null;
  const canSave = Boolean(identity.name?.trim());

  // Merge identity into template:
  // - If template has {description}, replace it
  // - Otherwise, append identity as context at the end
  const referencePrompt = useMemo(() => {
    const template = allTemplates[selectedTemplate];
    if (!template) return composedPrompt;
    if (template.prompt.includes("{description}")) {
      return template.prompt.replace(/\{description\}/g, composedPrompt);
    }
    // Append identity context to the template prompt
    return `${template.prompt}\n\nCharacter Identity: ${composedPrompt}`;
  }, [allTemplates, selectedTemplate, composedPrompt]);

  const updateField = useCallback((key: string, value: any) => {
    setIdentity(prev => {
      const next = { ...prev, [key]: value };
      if (key === "setting") next.subSetting = "";
      return next;
    });
  }, []);

  const handleRandomize = useCallback(() => {
    const name = identity.name;
    setIdentity({ ...randomizeIdentity(type), name });
  }, [type, identity.name]);

  // Returns the element ID (existing or newly created)
  const handleSave = useCallback(async (): Promise<string | null> => {
    if (!canSave || saving) return element?._id ?? null;
    setSaving(true);
    try {
      const { name, ref_face, ref_outfit, ref_fullBody, ref_head, ref_body, ...identityData } = identity;
      const description = composePrompt(type, identity);

      const referencePhotos = (ref_face || ref_outfit || ref_fullBody || ref_head || ref_body)
        ? {
            ...(ref_face ? { face: ref_face } : {}),
            ...(ref_outfit ? { outfit: ref_outfit } : {}),
            ...(ref_fullBody ? { fullBody: ref_fullBody } : {}),
            ...(ref_head ? { head: ref_head } : {}),
            ...(ref_body ? { body: ref_body } : {}),
          }
        : undefined;

      let savedId: string | null = element?._id ?? null;

      if (mode === "edit" && element?._id) {
        await updateElement({
          id: element._id, name: name.trim(), description, identity: identityData,
          thumbnailUrl: thumbnailUrl || undefined,
          referencePhotos,
        });
      } else {
        savedId = await createElement({
          projectId, name: name.trim(), type, description,
          thumbnailUrl: thumbnailUrl || "", referenceUrls, tags: [],
          createdBy: userId, visibility: "private", identity: identityData,
          referencePhotos,
        }) as unknown as string;
      }
      onSave({ name: name.trim(), type, description, identity: identityData });
      return savedId;
    } catch (error) {
      console.error("[ElementForge] Save failed:", error);
      return null;
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, identity, type, mode, element, projectId, userId, referenceUrls, thumbnailUrl, onSave, createElement, updateElement]);

  const handleSendToStudio = useCallback(async () => {
    if (!canSave) return;
    await handleSave();
    onSendToStudio?.(referencePrompt, referenceUrls);
  }, [canSave, handleSave, onSendToStudio, referencePrompt, referenceUrls]);

  // Generate image from the Generate tab
  const handleGenerate = useCallback(async () => {
    if (!canSave || isGenerating || !companyId) return;

    // Auto-save element first (creates if new, updates if existing)
    const elementId = await handleSave();
    if (!elementId) {
      alert("Failed to save element. Please try again.");
      return;
    }

    // Determine reference images from ref_* fields
    const rp = identity;
    const refImageUrls: string[] = [];
    if (rp.ref_fullBody) {
      refImageUrls.push(rp.ref_fullBody);
    } else {
      if (rp.ref_face) refImageUrls.push(rp.ref_face);
      if (rp.ref_outfit) refImageUrls.push(rp.ref_outfit);
      if (rp.ref_head) refImageUrls.push(rp.ref_head);
      if (rp.ref_body) refImageUrls.push(rp.ref_body);
    }

    // Z-Image is text-only — never send reference images
    const isTextOnly = genModel === "z-image";
    const hasRefs = !isTextOnly && refImageUrls.length > 0;
    const model = hasRefs && genModel === "gpt-image-2-text-to-image"
      ? "gpt-image-2-image-to-image" : genModel;
    const modelMode = hasRefs ? "image-to-image" : "text-to-image";

    // Build prompt based on model capabilities
    // Z-Image: short prompt only (composedPrompt), no template wrapping
    // Others: full referencePrompt (template + identity), with img2img overrides if refs present
    let prompt: string;
    if (isTextOnly) {
      prompt = composedPrompt;
    } else if (hasRefs) {
      prompt = referencePrompt + composeImageOverrides(identity);
    } else {
      prompt = referencePrompt;
    }

    const baseName = identity.name?.trim() || "Variant";
    const label = genVariantLabel.trim() || `${baseName} ${(referenceUrls.length) + 1}`;
    const totalGenerations = genGridSize * genGridSize; // 1x1=1, 2x2=4

    setIsGenerating(true);
    onGenerating?.(elementId as Id<"storyboard_elements">);
    try {
      // Fire all generations in parallel
      await Promise.all(Array.from({ length: totalGenerations }, async (_, i) => {
        const variantLbl = totalGenerations > 1 ? `${label} (${i + 1})` : label;
        const res = await fetch('/api/storyboard/generate-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sceneContent: prompt,
            model,
            style: 'realistic',
            quality: JSON.stringify({ type: model.startsWith('gpt-image-2') ? 'gpt-image-2' : model, mode: modelMode }),
            aspectRatio: genAspectRatio,
            companyId,
            userId,
            projectId: projectId as string,
            elementId,
            enhance: false,
            referenceImageUrls: hasRefs ? refImageUrls : undefined,
            variantLabel: variantLbl,
            variantModel: model,
            outputFormat: genFormat,
          }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Generation failed');
        }
        const data = await res.json();
        console.log(`[ElementForge] Generation ${i + 1}/${totalGenerations} started:`, data.taskId);
      }));
      setGenVariantLabel("");
    } catch (error: any) {
      console.error('[ElementForge] Generation failed:', error);
      alert(error.message || 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  }, [canSave, isGenerating, companyId, element, identity, referencePrompt, composedPrompt, genModel, genAspectRatio, genFormat, genGridSize, genVariantLabel, referenceUrls, userId, projectId, handleSave]);

  // Credit calculation for Generate tab
  const genCredits = useMemo(() => {
    if (genModel === "z-image") return 1;
    if (genModel.startsWith("gpt-image-2")) return getModelCredits(genModel, genResolution);
    return getModelCredits(genModel, genResolution);
  }, [genModel, genResolution, getModelCredits]);

  const setPrimaryVariant = useMutation(api.storyboard.storyboardElements.setPrimaryVariant);
  const updateVariantLabelMut = useMutation(api.storyboard.storyboardElements.updateVariantLabel);
  const removeVariantMut = useMutation(api.storyboard.storyboardElements.removeVariant);
  const deleteFileMut = useMutation(api.storyboard.storyboardFiles.remove);

  // Query files linked to this element to show generating/failed states
  const elementFiles = useQuery(
    api.storyboard.storyboardFiles.listByCategoryId,
    element?._id ? { categoryId: element._id } : "skip"
  );
  const pendingFiles = useMemo(() =>
    (elementFiles || []).filter(f => f.status === "generating" || f.status === "processing" || f.status === "failed" || f.status === "error"),
  [elementFiles]);

  const handleDeleteVariant = useCallback(async (idx: number) => {
    if (!element?._id) return;
    const url = liveReferenceUrls[idx];
    if (!window.confirm(`Delete "${liveVariants?.[idx]?.label || `Variant ${idx + 1}`}"? This will remove the image from R2.`)) return;

    try {
      // 1. Remove from element's referenceUrls/variants
      const result = await removeVariantMut({ id: element._id, index: idx });

      // 2. Find and soft-delete the storyboard_files record + R2 file
      if (url) {
        const matchingFile = elementFiles?.find(f => f.sourceUrl === url || (f.r2Key && url.includes(f.r2Key)));
        if (matchingFile) {
          if (matchingFile.r2Key) {
            await fetch("/api/storyboard/delete-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ r2Key: matchingFile.r2Key }),
            });
          }
          await deleteFileMut({ id: matchingFile._id });
        }
      }
    } catch (e) {
      console.error("[ElementForge] Failed to delete variant:", e);
    }
  }, [element, liveReferenceUrls, liveVariants, elementFiles, removeVariantMut, deleteFileMut]);

  const [pullingFileId, setPullingFileId] = useState<string | null>(null);

  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [editingVariantIdx, setEditingVariantIdx] = useState<number | null>(null);
  const [editingVariantName, setEditingVariantName] = useState("");
  const [refBrowseField, setRefBrowseField] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null); // large photo preview
  const variantScrollRef = useRef<HTMLDivElement>(null);

  const removeBadge = useCallback((badgeKey: string) => {
    const colonIdx = badgeKey.indexOf(":");
    if (colonIdx > -1) {
      const fieldKey = badgeKey.slice(0, colonIdx);
      const val = badgeKey.slice(colonIdx + 1);
      setIdentity(prev => {
        const current = prev[fieldKey];
        if (Array.isArray(current)) return { ...prev, [fieldKey]: current.filter((v: string) => v !== val) };
        return prev;
      });
    } else {
      setIdentity(prev => ({ ...prev, [badgeKey]: "" }));
    }
  }, []);

  // File upload removed — users browse files via R2 FileBrowser

  const handleThumbnailCropped = useCallback(async (blob: Blob) => {
    setCropImageUrl(null);
    if (!companyId) return;
    setUploadingThumbnail(true);
    try {
      // Delete old thumbnail from R2 if one exists
      if (thumbnailUrl) {
        try {
          const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
          if (r2Base && thumbnailUrl.startsWith(r2Base)) {
            const oldR2Key = thumbnailUrl.slice(r2Base.length + 1);
            await fetch("/api/storyboard/delete-file", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ r2Key: oldR2Key }),
            });
          }
        } catch (e) {
          // Non-blocking — old file becomes orphan, cleaned up later
          console.warn("[ElementForge] Old thumbnail cleanup failed:", e);
        }
      }

      // Upload new cropped thumbnail
      const file = new File([blob], `thumb-${Date.now()}.jpg`, { type: "image/jpeg" });
      const result = await uploadToR2({
        file,
        category: "elements",
        projectId: projectId as string,
        userId,
        companyId,
        tags: ["thumbnail"],
      });
      if (result.publicUrl) setThumbnailUrl(result.publicUrl);
    } catch (err) {
      console.error("[ElementForge] Thumbnail upload failed:", err);
    } finally {
      setUploadingThumbnail(false);
    }
  }, [companyId, projectId, userId, thumbnailUrl]);

  const renderField = (field: ForgeField) => {
    const val = identity[field.key];
    switch (field.type) {
      case "text": return <FieldText field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "textarea": return <FieldTextarea field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "button-group": return <FieldButtonGroup field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "color-dots": return <FieldColorDots field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "visual-grid": return <FieldVisualGrid field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} columns={field.columns} />;
      case "multi-select": return <FieldMultiSelect field={field} value={val || []} onChange={(v) => updateField(field.key, v)} />;
      case "multi-carousel": return <FieldMultiCarousel field={field} value={val || []} onChange={(v) => updateField(field.key, v)} />;
      case "two-level": return <FieldTwoLevelCarousel field={field} value={val || ""} parentValue={identity.setting || ""} onChange={(v) => updateField(field.key, v)} />;
      case "era-slider": return <FieldEraSlider field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "carousel": return <FieldCarousel field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "combobox": return <FieldCombobox field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "image-upload": return <FieldImageUpload field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} onPreview={(url) => setPreviewUrl(url)} onBrowse={() => setRefBrowseField(field.key)} />;
      default: return null;
    }
  };

  // ─── RENDER ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" onClick={onClose} />

      <div className="relative w-[94vw] max-w-[1100px] h-[75vh] bg-(--bg-secondary)/98 backdrop-blur-xl border border-(--border-primary) rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="px-8 pt-5 pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* Human / Non-Human toggle (character type only) */}
              {type === "character" && (
                <div className="flex items-center rounded-xl border border-white/8 overflow-hidden">
                  <button onClick={() => { setIsNonHuman(false); setActiveTab(0); }}
                    className={`px-4 py-2 text-[13px] font-medium transition-all ${
                      !isNonHuman ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"
                    }`}>Human</button>
                  <button onClick={() => { setIsNonHuman(true); setIdentity(prev => ({ ...prev, isNonHuman: true })); setActiveTab(0); }}
                    className={`px-4 py-2 text-[13px] font-medium transition-all ${
                      isNonHuman ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"
                    }`}>Non-Human</button>
                </div>
              )}
              {/* Simple / Advanced toggle */}
              <div className="flex items-center rounded-xl border border-white/8 overflow-hidden">
                <button onClick={() => { if (!isSimple) toggleMode(); }}
                  className={`px-4 py-2 text-[13px] font-medium transition-all ${
                    isSimple ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"
                  }`}>Simple</button>
                <button onClick={() => { if (isSimple) toggleMode(); }}
                  className={`px-4 py-2 text-[13px] font-medium transition-all ${
                    !isSimple ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"
                  }`}>Advanced</button>
              </div>
              <button onClick={handleRandomize}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 border border-white/8 transition-all">
                <Shuffle className="w-4 h-4" strokeWidth={1.75} /> Randomize
              </button>
            </div>

            {/* Thumbnail preview */}
            {(thumbnailUrl || uploadingThumbnail) && (
              <div className="flex items-center gap-2">
                {uploadingThumbnail ? (
                  <div className="w-9 h-9 rounded-lg bg-white/10 border-2 border-(--accent-blue)/40 flex items-center justify-center animate-pulse">
                    <Crop className="w-4 h-4 text-(--accent-blue)" strokeWidth={1.75} />
                  </div>
                ) : (
                  <img src={thumbnailUrl} alt="Thumbnail"
                    className="w-9 h-9 rounded-lg object-cover border-2 border-(--accent-blue) cursor-pointer hover:border-(--accent-blue-hover) transition-colors"
                    title="Current thumbnail"
                    onClick={() => liveReferenceUrls.length > 0 && setCropImageUrl(liveReferenceUrls[livePrimaryIndex] || liveReferenceUrls[0])}
                  />
                )}
                <div className="w-px h-5 bg-white/8" />
              </div>
            )}

            {/* Generated variant avatars */}
            {liveReferenceUrls.length > 0 && (
              <div className="flex items-center gap-0.5">
                {liveReferenceUrls.slice(0, 4).map((url, i) => {
                  const isPrimary = i === livePrimaryIndex;
                  return (
                    <img key={i} src={url} alt={`Variant ${i + 1}`}
                      onClick={() => setPreviewUrl(url)}
                      className={`w-8 h-8 rounded-full object-cover border-2 cursor-pointer hover:border-white/40 transition-colors ${
                        isPrimary ? "border-amber-400" : "border-white/15"
                      } ${i > 0 ? "-ml-1.5" : ""}`}
                      title="Click to preview"
                    />
                  );
                })}
                {liveReferenceUrls.length > 4 && (
                  <span className="w-8 h-8 rounded-full bg-white/10 border-2 border-white/15 -ml-1.5 flex items-center justify-center text-[10px] font-bold text-white/60">
                    +{liveReferenceUrls.length - 4}
                  </span>
                )}
              </div>
            )}

            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X className="w-5 h-5 text-(--text-secondary)" strokeWidth={1.75} />
            </button>
          </div>

          {/* Tabs — wizard steps + Prompt tab */}
          <div className="flex items-center justify-center gap-1 mt-4">
            {tabs.map((tab, i) => (
              <button key={tab.key} onClick={() => { setActiveTab(i); setSubTabIdx(0); }}
                className={`px-4 py-2 text-[13px] font-medium transition-all duration-200 border-b-2 ${
                  i === activeTab
                    ? "text-white border-white"
                    : "text-(--text-tertiary) hover:text-(--text-secondary) border-transparent"
                }`}>
                {tab.label}
              </button>
            ))}
          </div>

          {/* Sub-tab bar (for Physical Appearance etc) */}
          {currentWizardStep?.hasSubTabs && (
            <div className="flex items-center justify-center gap-1 mt-2">
              {currentWizardStep.fields.map((field, i) => {
                const hasValue = !!identity[field.key];
                return (
                  <button key={field.key} onClick={() => setSubTabIdx(i)}
                    className={`relative px-3.5 py-1.5 text-[12px] font-medium transition-all duration-200 ${
                      i === subTabIdx
                        ? "text-white"
                        : hasValue
                          ? "text-(--text-secondary) hover:text-(--text-primary)"
                          : "text-(--text-tertiary) hover:text-(--text-secondary)"
                    }`}>
                    {field.label}
                    {i === subTabIdx && (
                      <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] bg-white rounded-full" />
                    )}
                    {hasValue && i !== subTabIdx && (
                      <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-(--accent-blue) rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* ─── Tab Content ─────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-8 py-4 min-h-0">
          {/* Wizard step fields (non sub-tabbed) */}
          {currentWizardStep && !currentWizardStep.hasSubTabs && (
            <div className="space-y-8">
              {currentWizardStep.fields.map((field) => (
                <div key={field.key}>
                  <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-3">
                    {field.label}
                    {field.required && <span className="text-red-400 text-[10px]">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Sub-tabbed step — single field, vertically centered */}
          {currentWizardStep?.hasSubTabs && (
            <div className="flex flex-col items-center justify-center h-full w-full">
              {(() => {
                const field = currentWizardStep.fields[subTabIdx];
                if (!field) return null;
                return <div className="w-full">{renderField(field)}</div>;
              })()}
            </div>
          )}

          {/* Prompt tab */}
          {currentTab.key === "prompt" && (
            <div className="space-y-6">
              <div>
                <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-3">
                  Identity Description (auto-composed)
                </label>
                <div className="p-4 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-[13px] text-(--text-secondary) leading-relaxed">
                  {composedPrompt || "Fill in identity fields to see the composed description..."}
                </div>
              </div>
              <TemplateDropdown
                templates={allTemplates}
                selected={selectedTemplate}
                onSelect={setSelectedTemplate}
              />
              <div>
                <label className="flex items-center gap-2 text-[12px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-3">
                  Final Prompt (sent to Studio)
                </label>
                <div className="p-4 rounded-xl bg-(--bg-primary) border border-(--border-primary) text-[13px] text-(--text-primary) leading-relaxed">
                  {referencePrompt}
                </div>
              </div>
            </div>
          )}

          {/* ─── Generate tab ─────────────────────────────────────────── */}
          {currentTab.key === "generate" && (
            <div className="flex flex-col h-full gap-4">
              {/* Reference Photos row */}
              <div className={genModel === "z-image" ? "opacity-40 pointer-events-none" : ""}>
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">
                  Reference Photos <span className="font-normal normal-case opacity-60">
                    {genModel === "z-image" ? "(not supported by Z-Image)" : "(optional)"}
                  </span>
                </label>
                <div className="flex items-stretch gap-2">
                  <div className={`flex-[2] flex gap-2 ${identity.ref_fullBody ? "opacity-30 pointer-events-none" : ""}`}>
                    {isNonHuman ? (
                      <>
                        <div className="flex-1"><FieldImageUpload field={{ key: "ref_head", label: "Head", type: "image-upload", placeholder: "Head" }} value={identity.ref_head || ""} onChange={(v) => updateField("ref_head", v)} onPreview={(url) => setPreviewUrl(url)} onBrowse={() => setRefBrowseField("ref_head")} /></div>
                        <div className="flex-1"><FieldImageUpload field={{ key: "ref_body", label: "Body", type: "image-upload", placeholder: "Body" }} value={identity.ref_body || ""} onChange={(v) => updateField("ref_body", v)} onPreview={(url) => setPreviewUrl(url)} onBrowse={() => setRefBrowseField("ref_body")} /></div>
                      </>
                    ) : (
                      <>
                        <div className="flex-1"><FieldImageUpload field={{ key: "ref_face", label: "Face", type: "image-upload", placeholder: "Face" }} value={identity.ref_face || ""} onChange={(v) => updateField("ref_face", v)} onPreview={(url) => setPreviewUrl(url)} onBrowse={() => setRefBrowseField("ref_face")} /></div>
                        <div className="flex-1"><FieldImageUpload field={{ key: "ref_outfit", label: "Outfit", type: "image-upload", placeholder: "Outfit" }} value={identity.ref_outfit || ""} onChange={(v) => updateField("ref_outfit", v)} onPreview={(url) => setPreviewUrl(url)} onBrowse={() => setRefBrowseField("ref_outfit")} /></div>
                      </>
                    )}
                  </div>
                  <div className="flex flex-col items-center justify-center gap-0.5 shrink-0">
                    <div className="w-px flex-1 bg-white/10" />
                    <span className="text-[10px] font-medium text-(--text-tertiary)">OR</span>
                    <div className="w-px flex-1 bg-white/10" />
                  </div>
                  <div className={`flex-1 ${(identity.ref_face || identity.ref_outfit || identity.ref_head || identity.ref_body) ? "opacity-30 pointer-events-none" : ""}`}>
                    <FieldImageUpload field={{ key: "ref_fullBody", label: "Full Body", type: "image-upload", placeholder: "Full body" }} value={identity.ref_fullBody || ""} onChange={(v) => updateField("ref_fullBody", v)} onPreview={(url) => setPreviewUrl(url)} onBrowse={() => setRefBrowseField("ref_fullBody")} />
                  </div>
                </div>
              </div>

              {/* Toolbar row — VideoImageAIPanel style */}
              <div className="flex items-center gap-2 px-1">
                {/* Model dropdown */}
                <div className="relative">
                  <button onClick={() => setShowModelDropdown(!showModelDropdown)}
                    className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-(--border-primary) bg-(--bg-primary) hover:border-white/15 transition-colors text-[12px] font-medium text-(--text-primary)">
                    <Zap className="w-3.5 h-3.5 text-(--text-tertiary)" />
                    {genModel === "gpt-image-2-text-to-image" ? "GPT Image 2" : genModel === "nano-banana-2" ? "Nano Banana 2" : "Z-Image"}
                    <ChevronDown className={`w-3 h-3 text-(--text-tertiary) transition-transform ${showModelDropdown ? "rotate-180" : ""}`} />
                  </button>
                  {showModelDropdown && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowModelDropdown(false)} />
                      <div className="absolute bottom-full left-0 mb-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl py-1 min-w-[220px]">
                        {[
                          { value: "gpt-image-2-text-to-image", label: "GPT Image 2", sub: "Photorealistic, up to 16 refs" },
                          { value: "nano-banana-2", label: "Nano Banana 2", sub: "General purpose, up to 13 refs" },
                          { value: "z-image", label: "Z-Image", sub: "Text-only, 1 credit" },
                        ].map(m => (
                          <button key={m.value} onClick={() => { setGenModel(m.value); setShowModelDropdown(false); }}
                            className={`w-full text-left px-3 py-2 transition-colors ${
                              genModel === m.value ? "bg-(--accent-blue)/10 text-(--text-primary)" : "text-(--text-secondary) hover:bg-white/5"
                            }`}>
                            <div className="text-[12px] font-medium">{m.label}</div>
                            <div className="text-[10px] text-(--text-tertiary)">{m.sub}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>

                {/* Settings popup trigger — shows current values */}
                <div className="relative">
                  <button onClick={() => setShowSettingsPopup(!showSettingsPopup)}
                    className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-[12px] hover:bg-white/5 transition-colors">
                    <RectangleHorizontal className="w-3.5 h-3.5 text-(--text-tertiary)" />
                    <span className={genAspectRatio === "16:9" ? "text-(--text-primary) font-medium" : "text-(--text-secondary)"}>{genAspectRatio}</span>
                    <Monitor className="w-3.5 h-3.5 text-(--text-tertiary) ml-1" />
                    <span className="text-(--text-secondary)">{genResolution}</span>
                    <FileText className="w-3.5 h-3.5 text-(--text-tertiary) ml-1" />
                    <span className="text-(--text-secondary) uppercase">{genFormat}</span>
                    <span className="text-(--text-secondary) ml-1">{genGridSize}x{genGridSize}</span>
                  </button>

                  {showSettingsPopup && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowSettingsPopup(false)} />
                      <div className="absolute bottom-full left-0 mb-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl p-2">
                        <div className="flex gap-1">
                          {/* Aspect ratio column */}
                          <div className="flex flex-col gap-0.5">
                            {["1:1", "9:16", "16:9"].map(ar => (
                              <button key={ar} onClick={() => setGenAspectRatio(ar)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                                  genAspectRatio === ar ? "bg-white/15 text-(--text-primary)" : "text-(--text-tertiary) hover:bg-white/5 hover:text-(--text-secondary)"
                                }`}>{ar}</button>
                            ))}
                          </div>
                          {/* Resolution column */}
                          <div className="flex flex-col gap-0.5">
                            {["1K", "2K", "4K"].map(res => (
                              <button key={res} onClick={() => setGenResolution(res)}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                                  genResolution === res ? "bg-white/15 text-(--text-primary)" : "text-(--text-tertiary) hover:bg-white/5 hover:text-(--text-secondary)"
                                }`}>{res}</button>
                            ))}
                          </div>
                          {/* Format column */}
                          <div className="flex flex-col gap-0.5">
                            {["PNG", "JPG"].map(fmt => (
                              <button key={fmt} onClick={() => setGenFormat(fmt.toLowerCase())}
                                className={`px-3 py-1.5 rounded-lg text-[12px] font-medium transition-colors whitespace-nowrap ${
                                  genFormat === fmt.toLowerCase() ? "bg-white/15 text-(--text-primary)" : "text-(--text-tertiary) hover:bg-white/5 hover:text-(--text-secondary)"
                                }`}>{fmt}</button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* Grid size */}
                {[{v: 1, l: "1x1"}, {v: 2, l: "2x2"}].map(g => (
                  <button key={g.v} onClick={() => setGenGridSize(g.v)}
                    className={`px-2 py-1.5 rounded-lg text-[12px] font-medium transition-colors ${
                      genGridSize === g.v ? "bg-white/12 text-(--text-primary)" : "text-(--text-tertiary) hover:text-(--text-secondary)"
                    }`}>{g.l}</button>
                ))}

                <div className="flex-1" />

                {/* Variant name input */}
                <input
                  value={genVariantLabel}
                  onChange={(e) => setGenVariantLabel(e.target.value)}
                  placeholder={`${identity.name || "Variant"} ${(referenceUrls.length) + 1}`}
                  className="w-[180px] rounded-lg border border-(--border-primary) bg-(--bg-primary) px-2.5 py-1.5 text-[12px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors"
                />

                {/* Credits */}
                <div className="flex items-center gap-1 text-[12px] text-(--text-secondary)">
                  <Coins className="w-3.5 h-3.5 text-amber-400" />
                  <span>{genGridSize > 1 ? `${genCredits * genGridSize * genGridSize}` : genCredits}</span>
                </div>

                {/* Generate button */}
                <button
                  onClick={handleGenerate}
                  disabled={!canSave || isGenerating}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-semibold bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Generate
                      <span className="text-xs opacity-75">+ {genCredits * genGridSize * genGridSize}</span>
                    </>
                  )}
                </button>
              </div>

              {/* Generated Variants — takes remaining space */}
              <div className="flex-1 min-h-0">
                <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">
                  Generated Variants {(liveReferenceUrls.length > 0 || pendingFiles.length > 0) && (
                    <span className="text-(--text-secondary) font-normal">({liveReferenceUrls.length}{pendingFiles.length > 0 ? ` + ${pendingFiles.length} processing` : ""})</span>
                  )}
                </label>
                {liveReferenceUrls.length === 0 && pendingFiles.length === 0 ? (
                  <div className="flex items-center justify-center h-24 rounded-xl border border-dashed border-(--border-primary) text-[12px] text-(--text-tertiary)">
                    No variants yet — generate your first image above
                  </div>
                ) : (
                  <div
                    ref={variantScrollRef}
                    className="flex gap-3 overflow-x-auto pb-2 cursor-grab active:cursor-grabbing select-none"
                    style={{ scrollbarWidth: "none" }}
                    onMouseDown={(e) => {
                      const el = variantScrollRef.current;
                      if (!el) return;
                      const startX = e.pageX;
                      const scrollLeft = el.scrollLeft;
                      let moved = false;
                      const onMove = (ev: MouseEvent) => { moved = true; el.scrollLeft = scrollLeft - (ev.pageX - startX); };
                      const onUp = () => { window.removeEventListener("mousemove", onMove); window.removeEventListener("mouseup", onUp); };
                      window.addEventListener("mousemove", onMove);
                      window.addEventListener("mouseup", onUp);
                    }}
                  >
                    {/* Processing/failed cards */}
                    {pendingFiles.map((file) => {
                      const isFailed = file.status === "failed" || file.status === "error";
                      const meta = file.metadata as Record<string, any> | undefined;
                      const taskId = file.taskId;
                      const isPulling = pullingFileId === file._id;
                      return (
                        <div key={file._id} className={`group relative shrink-0 w-[180px] rounded-xl overflow-hidden border-2 ${
                          isFailed ? "border-red-500/30" : "border-blue-500/30"
                        }`}>
                          <div className="w-full aspect-[4/3] bg-(--bg-primary) flex flex-col items-center justify-center relative">
                            {isFailed ? (
                              <>
                                <AlertCircle className="w-5 h-5 text-red-400 mb-1.5" />
                                <span className="text-[11px] text-(--text-primary) font-medium">Generation Failed</span>
                                {file.responseMessage && (
                                  <span className="text-[9px] text-red-300/70 mt-0.5 px-2 text-center">{file.responseMessage}</span>
                                )}
                                <button
                                  onClick={() => deleteFileMut({ id: file._id as any })}
                                  className="mt-2 px-3 py-1 bg-red-500 text-white text-[10px] font-medium rounded-md hover:bg-red-600 transition"
                                >
                                  Delete
                                </button>
                              </>
                            ) : (
                              <>
                                <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin mb-2" />
                                <span className="text-[11px] text-blue-400 font-medium">Processing...</span>
                                {file._id && (
                                  <span className="text-[9px] text-(--text-tertiary) font-mono mt-1">{(file._id as string).slice(0, 10)}...</span>
                                )}
                              </>
                            )}
                            {/* Hover actions for processing cards */}
                            {!isFailed && (
                              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-start justify-center gap-1.5 pt-3">
                                {taskId && (
                                  <button
                                    onClick={async (e) => {
                                      e.stopPropagation();
                                      if (isPulling) return;
                                      setPullingFileId(file._id);
                                      try {
                                        const res = await fetch('/api/storyboard/pull-result', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ taskId, fileId: file._id, companyId }),
                                        });
                                        const result = await res.json();
                                        if (!result.success) console.log('[ElementForge] Pull result:', result.status || result.error);
                                      } catch {} finally { setPullingFileId(null); }
                                    }}
                                    className="p-1.5 bg-blue-500/80 rounded-lg hover:bg-blue-500 transition"
                                    title="Pull result from server"
                                  >
                                    <RefreshCw className={`w-3.5 h-3.5 text-white ${isPulling ? 'animate-spin' : ''}`} />
                                  </button>
                                )}
                                <button
                                  onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(file._id as string); }}
                                  className="p-1.5 bg-white/10 rounded-lg hover:bg-white/20 transition"
                                  title="Copy file ID"
                                >
                                  <Copy className="w-3.5 h-3.5 text-white" />
                                </button>
                                <button
                                  onClick={(e) => { e.stopPropagation(); deleteFileMut({ id: file._id as any }); }}
                                  className="p-1.5 bg-red-500/20 rounded-lg hover:bg-red-500/40 transition"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5 text-white" />
                                </button>
                              </div>
                            )}
                          </div>
                          <div className="px-2 py-1.5 bg-(--bg-primary)">
                            <span className={`text-[11px] truncate block ${isFailed ? "text-red-400" : "text-blue-400"}`}>
                              {(meta?.variantLabel as string) || (isFailed ? "Failed" : "Generating...")}
                            </span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Completed variant cards */}
                    {liveReferenceUrls.map((url, idx) => {
                      const isPrimary = idx === livePrimaryIndex;
                      const variant = liveVariants?.[idx];
                      const isEditing = editingVariantIdx === idx;
                      return (
                        <div key={idx} className={`group relative shrink-0 w-[180px] rounded-xl overflow-hidden border-2 transition-all ${
                          isPrimary ? "border-amber-400 ring-1 ring-amber-400/20" : "border-transparent hover:border-white/20"
                        }`}>
                          <img
                            src={url}
                            alt={variant?.label || `${identity.name || "Variant"} ${idx + 1}`}
                            className="w-full aspect-[4/3] object-cover"
                            draggable={false}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                            <button
                              onClick={(e) => { e.stopPropagation(); setPreviewUrl(url); }}
                              className="p-2 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors"
                              title="Preview"
                            >
                              <Expand size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setCropImageUrl(url); }}
                              className="p-2 rounded-lg bg-white/15 hover:bg-white/30 text-white transition-colors"
                              title="Crop as thumbnail"
                            >
                              <Crop size={16} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setPrimaryVariant({ id: element!._id, index: idx }); }}
                              className={`p-2 rounded-lg transition-colors ${
                                isPrimary ? "bg-amber-400/30 text-amber-400" : "bg-white/15 hover:bg-white/30 text-white"
                              }`}
                              title={isPrimary ? "Primary identity sheet" : "Set as primary"}
                            >
                              <Star size={16} className={isPrimary ? "fill-amber-400" : ""} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteVariant(idx); }}
                              className="p-2 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-white transition-colors"
                              title="Delete variant"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                          {isPrimary && (
                            <div className="absolute top-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-400/20 text-[8px] font-semibold text-amber-300 uppercase">Primary</div>
                          )}
                          <div className="px-2 py-1.5 bg-(--bg-primary)">
                            {isEditing ? (
                              <input
                                autoFocus
                                value={editingVariantName}
                                onChange={(e) => setEditingVariantName(e.target.value)}
                                onBlur={() => {
                                  if (editingVariantName.trim() && element?._id) updateVariantLabelMut({ id: element._id, index: idx, label: editingVariantName.trim() });
                                  setEditingVariantIdx(null);
                                }}
                                onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); if (e.key === "Escape") setEditingVariantIdx(null); }}
                                className="w-full bg-transparent text-[11px] text-(--text-primary) outline-none border-b border-(--accent-blue)/40"
                              />
                            ) : (
                              <span
                                className="text-[11px] text-(--text-secondary) truncate block cursor-pointer hover:text-(--text-primary)"
                                onDoubleClick={() => { setEditingVariantIdx(idx); setEditingVariantName(variant?.label || `${identity.name || "Variant"} ${idx + 1}`); }}
                                title="Double-click to rename"
                              >{variant?.label || `${identity.name || "Variant"} ${idx + 1}`}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ─── Bottom Bar ──────────────────────────────────────────────── */}
        <div className="border-t border-white/6 bg-(--bg-primary)/60 backdrop-blur-sm">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex items-center gap-1.5 px-8 pt-2.5 pb-1.5 overflow-x-auto">
              {badges.map((badge) => (
                <span key={badge.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/6 text-[10px] font-medium text-(--text-secondary) border border-white/4 shrink-0">
                  {badge.label}
                  <button onClick={() => removeBadge(badge.key)} className="text-(--text-tertiary) hover:text-(--text-primary) transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              <button onClick={() => setIdentity(prev => ({ name: prev.name }))}
                className="shrink-0 px-2 py-0.5 rounded-md text-[10px] font-medium text-(--text-tertiary) hover:text-red-400 hover:bg-red-500/10 transition-colors">
                Clear all
              </button>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between px-8 py-3 border-t border-white/4">
            <div className="flex items-center gap-2">
              <button onClick={() => setActiveTab(Math.max(0, activeTab - 1))} disabled={activeTab === 0}
                className="p-2 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                <ChevronLeft className="w-4 h-4" strokeWidth={2} />
              </button>
              <button onClick={() => { if (activeTab < tabs.length - 1) setActiveTab(activeTab + 1); }} disabled={activeTab >= tabs.length - 1}
                className="p-2 rounded-lg text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 disabled:opacity-20 disabled:cursor-not-allowed transition-colors">
                <ChevronRight className="w-4 h-4" strokeWidth={2} />
              </button>
              <div className="w-px h-5 bg-white/8 mx-1" />
              {onOpenFileBrowser && (
                <button onClick={onOpenFileBrowser}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors">
                  <ImagePlus className="w-3.5 h-3.5" strokeWidth={1.75} /> References
                </button>
              )}
              {liveReferenceUrls.length > 0 && (
                <button onClick={() => setCropImageUrl(liveReferenceUrls[livePrimaryIndex] || liveReferenceUrls[0])} disabled={uploadingThumbnail}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 disabled:opacity-40 transition-colors">
                  <Crop className={`w-3.5 h-3.5 ${uploadingThumbnail ? "animate-spin" : ""}`} strokeWidth={1.75} /> {uploadingThumbnail ? "Uploading..." : "Thumbnail"}
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <span className="text-[12px] text-(--text-tertiary)">{identity.name?.trim() || "Unnamed"}</span>
              <button onClick={onClose}
                className="px-4 py-2 rounded-xl text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={!canSave || saving}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-lg shadow-(--accent-blue)/20">
                <Sparkles className="w-4 h-4" strokeWidth={1.75} />
                {saving ? "Saving..." : mode === "edit" ? "Save Changes" : `Create ${meta.label}`}
              </button>
              {showSendToStudio && onSendToStudio && (
                <button onClick={handleSendToStudio} disabled={!canSave || saving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold bg-white/8 hover:bg-white/12 text-(--text-primary) border border-white/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all">
                  <Send className="w-4 h-4" strokeWidth={1.75} /> Send to Studio
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Thumbnail Cropper Modal */}
      {cropImageUrl && (
        <ThumbnailCropper
          imageUrl={cropImageUrl}
          onSave={handleThumbnailCropped}
          onClose={() => setCropImageUrl(null)}
        />
      )}

      {/* Large photo preview */}
      {previewUrl && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={() => setPreviewUrl(null)}>
          <div className="relative max-w-[85vw] max-h-[85vh]" onClick={(e) => e.stopPropagation()}>
            <img src={previewUrl} alt="Preview" className="max-w-full max-h-[85vh] object-contain rounded-xl shadow-2xl" />
            <button
              onClick={() => setPreviewUrl(null)}
              className="absolute top-3 right-3 p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors"
            >
              <X size={18} />
            </button>

            {/* Prev / Next navigation */}
            {liveReferenceUrls.length > 1 && (() => {
              const curIdx = liveReferenceUrls.indexOf(previewUrl);
              return (
                <>
                  {curIdx > 0 && (
                    <button onClick={() => setPreviewUrl(liveReferenceUrls[curIdx - 1])}
                      className="absolute left-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors">
                      <ChevronLeft size={20} />
                    </button>
                  )}
                  {curIdx < liveReferenceUrls.length - 1 && (
                    <button onClick={() => setPreviewUrl(liveReferenceUrls[curIdx + 1])}
                      className="absolute right-3 top-1/2 -translate-y-1/2 p-2.5 rounded-xl bg-black/60 hover:bg-black/80 text-white/80 hover:text-white transition-colors">
                      <ChevronRight size={20} />
                    </button>
                  )}
                  {curIdx >= 0 && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-lg bg-black/60 text-[12px] text-white/70">
                      {curIdx + 1} / {liveReferenceUrls.length}
                    </div>
                  )}
                </>
              );
            })()}

            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-2">
              <button
                onClick={() => { setPreviewUrl(null); setCropImageUrl(previewUrl); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-[12px] text-white transition-colors"
              >
                <Crop size={14} /> Crop as Thumbnail
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FileBrowser for picking reference photos */}
      {refBrowseField && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60">
          <div className="w-[90vw] max-w-4xl h-[80vh]">
            <FileBrowser
              projectId={projectId}
              onClose={() => setRefBrowseField(null)}
              imageSelectionMode={true}
              defaultCategory="elements"
              onSelectFile={(url, fileType) => {
                if (fileType === "image" && url && refBrowseField) {
                  updateField(refBrowseField, url);
                  setRefBrowseField(null);
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
