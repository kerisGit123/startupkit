"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { X, Check, Plus, Edit3, Palette } from "lucide-react";
import { GENRE_PRESETS, GENRE_PROMPTS, GENRE_COMBO_TIPS } from "../../constants";

export interface CustomGenrePreset {
  id: string;
  name: string;
  prompt: string;
  thumbnailUrl?: string;
}

interface GenrePickerProps {
  open: boolean;
  onClose: () => void;
  selected: string | undefined;
  onSelect: (id: string, prompt: string) => void;
  accent?: "purple" | "pink" | "blue" | "teal" | "amber";
  customPresets?: CustomGenrePreset[];
  onCreateCustom?: (name: string, prompt: string) => Promise<void>;
  onEditPreset?: (id: string, name: string, prompt: string) => Promise<void>;
  onDeletePreset?: (id: string) => void;
  showComboTips?: boolean;
  /** When provided, picker opens as a dropdown below this element instead of centered */
  anchorEl?: HTMLElement | null;
}

const ACCENT_CLASSES: Record<string, { border: string; ring: string; badge: string }> = {
  purple: { border: "border-purple-500", ring: "ring-purple-500/30", badge: "bg-purple-500" },
  pink:   { border: "border-pink-500",   ring: "ring-pink-500/30",   badge: "bg-pink-500" },
  blue:   { border: "border-(--accent-blue)", ring: "ring-(--accent-blue)/30", badge: "bg-(--accent-blue)" },
  teal:   { border: "border-teal-500",   ring: "ring-teal-500/30",   badge: "bg-teal-500" },
  amber:  { border: "border-amber-500",  ring: "ring-amber-500/30",  badge: "bg-amber-500" },
};

function getAnchorStyle(el: HTMLElement): React.CSSProperties {
  const rect = el.getBoundingClientRect();
  const pickerWidth = 540;
  const pickerEstHeight = 500;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - pickerWidth - 8));
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow >= pickerEstHeight || spaceBelow >= rect.top) {
    return { top: rect.bottom + 12, left };
  }
  return { bottom: window.innerHeight - rect.top + 12, left };
}

export function GenrePicker({
  open, onClose, selected, onSelect,
  accent = "purple",
  customPresets, onCreateCustom, onEditPreset, onDeletePreset, showComboTips,
  anchorEl,
}: GenrePickerProps) {
  const [showForm, setShowForm] = useState(false);
  const [formName, setFormName] = useState("");
  const [formPrompt, setFormPrompt] = useState("");
  const [editingPreset, setEditingPreset] = useState<CustomGenrePreset | null>(null);
  const [saving, setSaving] = useState(false);

  if (!open) return null;

  const ac = ACCENT_CLASSES[accent] || ACCENT_CLASSES.purple;
  const isAuto = !selected;
  const hasCustomSupport = !!onCreateCustom;

  const openCreateForm = () => {
    setEditingPreset(null);
    setFormName("");
    setFormPrompt("");
    setShowForm(true);
  };

  const openEditForm = (preset: CustomGenrePreset) => {
    setEditingPreset(preset);
    setFormName(preset.name);
    setFormPrompt(preset.prompt);
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditingPreset(null);
    setFormName("");
    setFormPrompt("");
  };

  const handleSave = async () => {
    if (!formName.trim() || !formPrompt.trim()) return;
    setSaving(true);
    try {
      if (editingPreset && onEditPreset) {
        await onEditPreset(editingPreset.id, formName.trim(), formPrompt.trim());
      } else if (onCreateCustom) {
        await onCreateCustom(formName.trim(), formPrompt.trim());
      }
      closeForm();
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <>
      <div className="fixed inset-0 z-9998 bg-black/40" onClick={onClose} />
      <div
        className="fixed z-9999 w-[540px] max-h-[80vh] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl overflow-y-auto p-4"
        style={anchorEl ? getAnchorStyle(anchorEl) : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-(--text-primary)">Genre</h3>
          <div className="flex items-center gap-2">
            {hasCustomSupport && (
              <button
                onClick={openCreateForm}
                className="flex items-center gap-1 text-[11px] text-(--accent-blue) hover:text-(--text-primary) transition px-2 py-1 rounded-lg border border-(--border-primary) hover:border-(--accent-blue)/30"
              >
                <Plus className="w-3 h-3" /> Custom
              </button>
            )}
            <button onClick={onClose} className="text-(--text-tertiary) hover:text-(--text-primary) transition">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Custom genre create / edit form */}
        {showForm && (
          <div className="mb-3 p-3 bg-(--bg-tertiary) border border-(--border-primary) rounded-lg space-y-2">
            <p className="text-[11px] text-(--text-secondary) font-medium">
              {editingPreset ? "Edit Custom Genre" : "Create Custom Genre"}
            </p>
            <input
              type="text"
              placeholder="Genre name (e.g. Dark Thriller)"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              className="w-full px-3 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-xs text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-(--accent-blue)/50"
            />
            <textarea
              placeholder="Genre prompt (describe the mood, lighting, tone...)"
              value={formPrompt}
              onChange={(e) => setFormPrompt(e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-xs text-(--text-primary) placeholder:text-(--text-tertiary) focus:outline-none focus:border-(--accent-blue)/50 resize-none"
            />
            <div className="flex gap-2 justify-end">
              <button
                onClick={closeForm}
                className="px-3 py-1.5 text-xs text-(--text-secondary) hover:text-(--text-primary) bg-(--bg-primary) border border-(--border-primary) rounded-lg transition"
              >
                Cancel
              </button>
              <button
                disabled={!formName.trim() || !formPrompt.trim() || saving}
                onClick={handleSave}
                className="px-3 py-1.5 text-xs text-white bg-(--accent-blue) hover:bg-(--accent-blue-hover) rounded-lg transition font-medium disabled:opacity-40"
              >
                {editingPreset ? "Update" : "Create & Apply"}
              </button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 gap-2">
          {/* Auto */}
          <button
            onClick={() => { onSelect("", ""); onClose(); }}
            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-4/3 group ${isAuto ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
          >
            <img src="/storytica/element_forge/grids/genre/auto.png" alt="Auto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">Auto</span>
            {isAuto && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
          </button>

          {/* Built-in genres */}
          {GENRE_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => { onSelect(g.id, GENRE_PROMPTS[g.id] || ""); onClose(); }}
              className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-4/3 group ${selected === g.id ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
            >
              <img src={g.preview} alt={g.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">{g.label}</span>
              {selected === g.id && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
            </button>
          ))}

          {/* Custom presets */}
          {hasCustomSupport && (customPresets || []).map(preset => (
            <button
              key={preset.id}
              onClick={() => { onSelect(preset.name, preset.prompt); onClose(); }}
              className={`group relative rounded-lg overflow-hidden border-2 transition-all aspect-4/3 ${
                selected === preset.name
                  ? `${ac.border} ring-1 ${ac.ring}`
                  : "border-(--border-primary) hover:border-white/20"
              }`}
            >
              {preset.thumbnailUrl ? (
                <img src={preset.thumbnailUrl} alt={preset.name} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
                  <Palette className="w-6 h-6 text-purple-400/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white truncate px-1">{preset.name}</span>
              {selected === preset.name && (
                <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}>
                  <Check className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {onEditPreset && (
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); openEditForm(preset); }}
                  className="absolute bottom-1 right-1 w-5 h-5 bg-(--accent-blue)/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <Edit3 className="w-2.5 h-2.5 text-white" />
                </div>
              )}
              {onDeletePreset && (
                <div
                  role="button"
                  onClick={(e) => { e.stopPropagation(); e.preventDefault(); onDeletePreset(preset.id); }}
                  className="absolute top-1 left-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </div>
              )}
            </button>
          ))}

          {/* + Add Custom cell */}
          {hasCustomSupport && (
            <button
              onClick={openCreateForm}
              className="group relative aspect-4/3 rounded-lg overflow-hidden border-2 border-dashed border-(--border-primary) hover:border-(--accent-blue)/50 transition-all flex items-center justify-center"
            >
              <div className="flex flex-col items-center gap-1">
                <Plus className="w-5 h-5 text-(--text-tertiary) group-hover:text-(--accent-blue) transition" />
                <span className="text-[10px] text-(--text-tertiary) group-hover:text-(--accent-blue) font-medium transition">Add Custom</span>
              </div>
            </button>
          )}
        </div>

        {/* Combo tips */}
        {showComboTips && (
          <div className="border-t border-(--border-primary) pt-2 mt-3">
            <p className="text-[10px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-1.5">Combo Tips: Genre + Format</p>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1">
              {GENRE_COMBO_TIPS.map(tip => (
                <div key={tip.label} className="flex items-baseline gap-1.5 text-[10px]">
                  <span className="text-(--text-secondary) font-medium truncate">{tip.label}:</span>
                  <span className="text-(--text-tertiary) truncate">{tip.genre} + {tip.format}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  );
}

export default GenrePicker;
