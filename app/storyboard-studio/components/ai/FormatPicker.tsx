"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { FORMAT_PRESETS } from "../../constants";

// ── Types ────────────────────────────────────────────────────────────────

interface FormatPickerProps {
  open: boolean;
  onClose: () => void;
  /** Current format preset id (empty string or undefined = Auto) */
  selected: string | undefined;
  /** Called when a format is picked. `id` is empty string for Auto. */
  onSelect: (id: string) => void;
  /** Accent color for the active border + check badge. Default "teal" */
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

export function FormatPicker({ open, onClose, selected, onSelect, accent = "teal" }: FormatPickerProps) {
  if (!open) return null;

  const ac = ACCENT_CLASSES[accent] || ACCENT_CLASSES.teal;
  const isAuto = !selected;

  return createPortal(
    <>
      <div className="fixed inset-0 z-[9998] bg-black/40" onClick={onClose} />
      <div className="fixed z-[9999] left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[540px] max-h-[80vh] bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl shadow-2xl overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-sm font-semibold text-white">Content Format</h3>
            <p className="text-[10px] text-[#6E6E6E] mt-0.5">Auto-appends framing, pacing, and camera behavior to all generation prompts.</p>
          </div>
          <button onClick={onClose} className="text-[#6E6E6E] hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Auto option */}
          <button
            onClick={() => { onSelect(""); onClose(); }}
            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] group ${isAuto ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
          >
            <img src="/storytica/element_forge/grids/format/auto.png" alt="Auto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">Auto</span>
            {isAuto && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
          </button>
          {FORMAT_PRESETS.map(f => (
            <button
              key={f.id}
              onClick={() => { onSelect(f.id); onClose(); }}
              className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-[4/3] group ${selected === f.id ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
            >
              <img src={f.preview} alt={f.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">{f.label}</span>
              {selected === f.id && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
            </button>
          ))}
        </div>
      </div>
    </>,
    document.body
  );
}

export default FormatPicker;
