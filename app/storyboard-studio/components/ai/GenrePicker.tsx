"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { GENRE_PRESETS, GENRE_PROMPTS, type GenrePreset } from "../../constants";

// ── Types ────────────────────────────────────────────────────────────────

interface GenrePickerProps {
  open: boolean;
  onClose: () => void;
  /** Current genre id (empty string or undefined = Auto) */
  selected: string | undefined;
  /** Called when a genre is picked. `id` and `prompt` are empty strings for Auto. */
  onSelect: (id: string, prompt: string) => void;
  /** Accent color for the active border + check badge. Default "purple" */
  accent?: "purple" | "pink" | "blue" | "teal" | "amber";
}

const ACCENT_CLASSES: Record<string, { border: string; ring: string; badge: string }> = {
  purple: { border: "border-purple-500", ring: "ring-purple-500/30", badge: "bg-purple-500" },
  pink:   { border: "border-pink-500",   ring: "ring-pink-500/30",   badge: "bg-pink-500" },
  blue:   { border: "border-[#4A90E2]",  ring: "ring-[#4A90E2]/30",  badge: "bg-[#4A90E2]" },
  teal:   { border: "border-teal-500",   ring: "ring-teal-500/30",   badge: "bg-teal-500" },
  amber:  { border: "border-amber-500",  ring: "ring-amber-500/30",  badge: "bg-amber-500" },
};

// ── Component ────────────────────────────────────────────────────────────

export function GenrePicker({ open, onClose, selected, onSelect, accent = "purple" }: GenrePickerProps) {
  if (!open) return null;

  const ac = ACCENT_CLASSES[accent] || ACCENT_CLASSES.purple;
  const isAuto = !selected;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/40" onClick={onClose} />
      <div className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] max-h-[80vh] bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl shadow-2xl overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-white">Genre</h3>
          <button onClick={onClose} className="text-[#6E6E6E] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Auto option */}
          <button
            onClick={() => { onSelect("", ""); onClose(); }}
            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] group ${isAuto ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
          >
            <img src="/storytica/element_forge/grids/genre/auto.png" alt="Auto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">Auto</span>
            {isAuto && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
          </button>
          {GENRE_PRESETS.map(g => (
            <button
              key={g.id}
              onClick={() => { onSelect(g.id, GENRE_PROMPTS[g.id] || ""); onClose(); }}
              className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] group ${selected === g.id ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
            >
              <img src={g.preview} alt={g.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">{g.label}</span>
              {selected === g.id && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

export default GenrePicker;
