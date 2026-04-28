"use client";

import { useState, useMemo, useCallback } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import {
  X, Shuffle, ChevronDown, ChevronRight, Sparkles, Check, User, Trees, Package, Pencil, ImagePlus, Crop,
} from "lucide-react";
import {
  type ForgeElementType,
  type ForgeStep,
  type ForgeField,
  type ForgeOption,
  getStepsForType,
  composePrompt,
  getIdentityBadges,
  randomizeIdentity,
} from "./elementForgeConfig";

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

interface ElementForgeProps {
  mode: "create" | "edit";
  type: ForgeElementType;
  projectId: Id<"storyboard_projects">;
  userId: string;
  onSave: (element: { name: string; type: string; description: string; identity: Record<string, any> }) => void;
  onClose: () => void;
  // Edit mode props
  element?: {
    _id: Id<"storyboard_elements">;
    name: string;
    type: string;
    description?: string;
    identity?: Record<string, any>;
    thumbnailUrl?: string;
    referenceUrls?: string[];
  } | null;
}

const TYPE_META: Record<ForgeElementType, { label: string; Icon: typeof User; accent: string }> = {
  character: { label: "Character", Icon: User, accent: "text-purple-400" },
  environment: { label: "Environment", Icon: Trees, accent: "text-emerald-400" },
  prop: { label: "Prop", Icon: Package, accent: "text-blue-400" },
};

// ═══════════════════════════════════════════════════════════════════════════════
// FIELD RENDERERS
// ═══════════════════════════════════════════════════════════════════════════════

function FieldText({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <input
      value={value || ""}
      onChange={(e) => onChange(e.target.value)}
      placeholder={field.placeholder}
      className="w-full rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2 text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors"
    />
  );
}

function FieldButtonGroup({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {field.options?.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(value === opt.key ? "" : opt.key)}
          className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
            value === opt.key
              ? "bg-white/12 text-(--text-primary) ring-1 ring-(--accent-blue)/40"
              : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FieldColorDots({ field, value, onChange }: { field: ForgeField; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {field.options?.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(value === opt.key ? "" : opt.key)}
          title={opt.label}
          className={`group flex items-center gap-1.5 px-2 py-1 rounded-md transition-all duration-150 ${
            value === opt.key
              ? "bg-white/12 ring-1 ring-(--accent-blue)/40"
              : "hover:bg-white/5"
          }`}
        >
          <span
            className={`w-4 h-4 rounded-full border ${value === opt.key ? "border-white/40 scale-110" : "border-white/15"}`}
            style={{ backgroundColor: opt.color }}
          />
          <span className={`text-[11px] ${value === opt.key ? "text-(--text-primary)" : "text-(--text-secondary)"}`}>
            {opt.label}
          </span>
        </button>
      ))}
    </div>
  );
}

function FieldVisualGrid({ field, value, onChange, columns = 4 }: { field: ForgeField; value: string; onChange: (v: string) => void; columns?: number }) {
  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {field.options?.map((opt) => (
        <button
          key={opt.key}
          onClick={() => onChange(value === opt.key ? "" : opt.key)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 ${
            value === opt.key
              ? "border-(--accent-blue)/50 bg-(--accent-blue)/8 text-(--text-primary)"
              : "border-(--border-primary) bg-(--bg-primary)/50 text-(--text-secondary) hover:border-(--border-secondary) hover:bg-white/3"
          }`}
        >
          {/* Placeholder for future thumbnails */}
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-bold ${
            value === opt.key ? "bg-(--accent-blue)/15 text-(--accent-blue)" : "bg-white/5 text-(--text-tertiary)"
          }`}>
            {opt.label.charAt(0)}
          </div>
          <span className="text-[11px] font-medium text-center leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

function FieldMultiSelect({ field, value, onChange }: { field: ForgeField; value: string[]; onChange: (v: string[]) => void }) {
  const selected = Array.isArray(value) ? value : [];
  const toggle = (key: string) => {
    onChange(selected.includes(key) ? selected.filter(k => k !== key) : [...selected, key]);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {field.options?.map((opt) => (
        <button
          key={opt.key}
          onClick={() => toggle(opt.key)}
          className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all duration-150 ${
            selected.includes(opt.key)
              ? "bg-white/12 text-(--text-primary) ring-1 ring-(--accent-blue)/40"
              : "text-(--text-secondary) hover:bg-white/5 hover:text-(--text-primary)"
          }`}
        >
          {selected.includes(opt.key) && <Check className="w-3 h-3 inline mr-1" />}
          {opt.label}
        </button>
      ))}
    </div>
  );
}

function FieldTwoLevel({
  field,
  value,
  parentValue,
  onChange,
  columns = 4,
}: {
  field: ForgeField;
  value: string;
  parentValue: string;
  onChange: (v: string) => void;
  columns?: number;
}) {
  const subOptions = parentValue ? (field.subOptions?.[parentValue] || []) : [];

  if (!parentValue) {
    return (
      <div className="text-[12px] text-(--text-tertiary) italic py-2">
        Select a setting above to see sub-options
      </div>
    );
  }

  if (subOptions.length === 0) return null;

  return (
    <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {subOptions.map((opt: ForgeOption) => (
        <button
          key={opt.key}
          onClick={() => onChange(value === opt.key ? "" : opt.key)}
          className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-150 ${
            value === opt.key
              ? "border-(--accent-blue)/50 bg-(--accent-blue)/8 text-(--text-primary)"
              : "border-(--border-primary) bg-(--bg-primary)/50 text-(--text-secondary) hover:border-(--border-secondary) hover:bg-white/3"
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-[14px] font-bold ${
            value === opt.key ? "bg-(--accent-blue)/15 text-(--accent-blue)" : "bg-white/5 text-(--text-tertiary)"
          }`}>
            {opt.label.charAt(0)}
          </div>
          <span className="text-[11px] font-medium text-center leading-tight">{opt.label}</span>
        </button>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════

export function ElementForge({ mode, type, projectId, userId, onSave, onClose, element }: ElementForgeProps) {
  const meta = TYPE_META[type];
  const steps = useMemo(() => getStepsForType(type), [type]);

  // State
  const [activeStep, setActiveStep] = useState(0);
  const [identity, setIdentity] = useState<Record<string, any>>(() => {
    if (mode === "edit" && element?.identity) {
      return { name: element.name, ...element.identity };
    }
    return { name: element?.name || "" };
  });
  const [saving, setSaving] = useState(false);
  const [showPromptPreview, setShowPromptPreview] = useState(false);

  // Mutations
  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const updateElement = useMutation(api.storyboard.storyboardElements.update);

  // Derived
  const composedPrompt = useMemo(() => composePrompt(type, identity), [type, identity]);
  const badges = useMemo(() => getIdentityBadges(type, identity), [type, identity]);
  const currentStep = steps[activeStep];
  const canSave = Boolean(identity.name?.trim());

  // Handlers
  const updateField = useCallback((key: string, value: any) => {
    setIdentity(prev => {
      const next = { ...prev, [key]: value };
      // Clear sub-setting when setting changes
      if (key === "setting") {
        next.subSetting = "";
      }
      return next;
    });
  }, []);

  const handleRandomize = useCallback(() => {
    const name = identity.name; // Preserve name
    const rand = randomizeIdentity(type);
    setIdentity({ ...rand, name });
  }, [type, identity.name]);

  const handleSave = useCallback(async () => {
    if (!canSave || saving) return;
    setSaving(true);

    try {
      const { name, ...identityData } = identity;
      const description = composePrompt(type, identity);

      if (mode === "edit" && element?._id) {
        await updateElement({
          id: element._id,
          name: name.trim(),
          description,
          identity: identityData,
        });
      } else {
        await createElement({
          projectId,
          name: name.trim(),
          type,
          description,
          thumbnailUrl: "",
          referenceUrls: [],
          tags: [],
          createdBy: userId,
          visibility: "private",
          identity: identityData,
        });
      }

      onSave({
        name: name.trim(),
        type,
        description,
        identity: identityData,
      });
    } catch (error) {
      console.error("[ElementForge] Save failed:", error);
    } finally {
      setSaving(false);
    }
  }, [canSave, saving, identity, type, mode, element, projectId, userId, onSave, createElement, updateElement]);

  const removeBadge = useCallback((badgeKey: string) => {
    // Parse "fieldKey:value" or just "fieldKey"
    const colonIdx = badgeKey.indexOf(":");
    if (colonIdx > -1) {
      const fieldKey = badgeKey.slice(0, colonIdx);
      const val = badgeKey.slice(colonIdx + 1);
      setIdentity(prev => {
        const current = prev[fieldKey];
        if (Array.isArray(current)) {
          return { ...prev, [fieldKey]: current.filter((v: string) => v !== val) };
        }
        return prev;
      });
    } else {
      setIdentity(prev => ({ ...prev, [badgeKey]: "" }));
    }
  }, []);

  // ─── Render Field ──────────────────────────────────────────────────────────

  const renderField = (field: ForgeField) => {
    const val = identity[field.key];

    switch (field.type) {
      case "text":
        return <FieldText field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "button-group":
        return <FieldButtonGroup field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "color-dots":
        return <FieldColorDots field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} />;
      case "visual-grid":
        return <FieldVisualGrid field={field} value={val || ""} onChange={(v) => updateField(field.key, v)} columns={field.columns} />;
      case "multi-select":
        return <FieldMultiSelect field={field} value={val || []} onChange={(v) => updateField(field.key, v)} />;
      case "two-level":
        return <FieldTwoLevel field={field} value={val || ""} parentValue={identity.setting || ""} onChange={(v) => updateField(field.key, v)} columns={field.columns} />;
      default:
        return null;
    }
  };

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-[90vw] max-w-[820px] max-h-[88vh] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl flex flex-col overflow-hidden">

        {/* ─── Header ──────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/5">
          <div>
            <h2 className="text-[18px] font-semibold text-(--text-primary) flex items-center gap-2">
              <meta.Icon className={`w-5 h-5 ${meta.accent}`} strokeWidth={1.75} />
              {mode === "edit" ? `Edit ${meta.label}` : `Create ${meta.label}`}
            </h2>
            <p className="text-[12px] text-(--text-tertiary) mt-0.5">
              {mode === "edit"
                ? `Update ${identity.name || meta.label.toLowerCase()} identity and details`
                : `Build your ${meta.label.toLowerCase()}'s identity step by step`}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRandomize}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
            >
              <Shuffle className="w-3.5 h-3.5" strokeWidth={1.75} />
              Randomize
            </button>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/5 rounded-lg transition-colors"
            >
              <X className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* ─── Step Tabs ───────────────────────────────────────────────── */}
        <div className="flex items-center gap-0.5 px-5 py-2 border-b border-white/5 overflow-x-auto">
          {steps.map((step, i) => (
            <button
              key={step.key}
              onClick={() => setActiveStep(i)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-medium whitespace-nowrap transition-all duration-150 ${
                i === activeStep
                  ? "bg-white/10 text-(--text-primary)"
                  : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
              }`}
            >
              <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                i === activeStep ? "bg-(--accent-blue) text-white" : "bg-white/8 text-(--text-tertiary)"
              }`}>
                {i + 1}
              </span>
              {step.label}
            </button>
          ))}
        </div>

        {/* ─── Edit Mode: Images Section ───────────────────────────────── */}
        {mode === "edit" && element?.referenceUrls && element.referenceUrls.length > 0 && (
          <div className="px-5 py-3 border-b border-white/5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">
                Reference Images ({element.referenceUrls.length})
              </span>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {element.thumbnailUrl && (
                <div className="relative shrink-0">
                  <img
                    src={element.thumbnailUrl}
                    alt="Thumbnail"
                    className="w-14 h-14 rounded-lg object-cover border-2 border-(--accent-blue)/50"
                  />
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-(--accent-blue) text-white px-1 rounded">
                    THUMB
                  </span>
                </div>
              )}
              {element.referenceUrls.map((url, i) => (
                <img
                  key={i}
                  src={url}
                  alt={`Ref ${i + 1}`}
                  className="w-14 h-14 rounded-lg object-cover border border-(--border-primary) shrink-0"
                />
              ))}
            </div>
          </div>
        )}

        {/* ─── Step Content ────────────────────────────────────────────── */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          {currentStep && (
            <div className="space-y-5">
              {currentStep.fields.map((field) => (
                <div key={field.key}>
                  <label className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2">
                    {field.label}
                    {field.required && <span className="text-red-400">*</span>}
                  </label>
                  {renderField(field)}
                </div>
              ))}
            </div>
          )}

          {/* Step navigation hint */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-white/5">
            <button
              onClick={() => setActiveStep(Math.max(0, activeStep - 1))}
              disabled={activeStep === 0}
              className="px-3 py-1.5 rounded-lg text-[12px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>
            {activeStep < steps.length - 1 ? (
              <button
                onClick={() => setActiveStep(activeStep + 1)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-[12px] font-medium text-(--accent-blue) hover:bg-(--accent-blue)/8 transition-colors"
              >
                Next
                <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            ) : (
              <span className="text-[11px] text-(--text-tertiary)">Last step</span>
            )}
          </div>
        </div>

        {/* ─── Bottom Bar: Badges + Prompt Preview + Actions ───────────── */}
        <div className="border-t border-white/5 bg-(--bg-primary)/40">
          {/* Badges */}
          {badges.length > 0 && (
            <div className="flex flex-wrap gap-1.5 px-5 pt-3 pb-1">
              {badges.map((badge) => (
                <span
                  key={badge.key}
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-white/8 text-[11px] font-medium text-(--text-primary)"
                >
                  {badge.label}
                  <button
                    onClick={() => removeBadge(badge.key)}
                    className="ml-0.5 text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
            </div>
          )}

          {/* Prompt Preview (collapsible) */}
          <div className="px-5 py-1">
            <button
              onClick={() => setShowPromptPreview(!showPromptPreview)}
              className="flex items-center gap-1.5 text-[11px] font-medium text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${showPromptPreview ? "" : "-rotate-90"}`} />
              Prompt Preview
            </button>
            {showPromptPreview && (
              <div className="mt-1.5 p-2.5 rounded-lg bg-(--bg-primary) border border-(--border-primary) text-[12px] text-(--text-secondary) leading-relaxed max-h-[80px] overflow-y-auto">
                {composedPrompt || "Fill in fields to see the composed prompt..."}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="text-[11px] text-(--text-tertiary)">
              {identity.name?.trim()
                ? <span className="text-(--text-secondary)">{identity.name.trim()}</span>
                : <span className="italic">Enter a name to save</span>}
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="px-4 py-1.5 rounded-lg text-[13px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!canSave || saving}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-[13px] font-medium bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                {saving
                  ? "Saving..."
                  : mode === "edit"
                    ? "Save Changes"
                    : `Create ${meta.label}`}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
