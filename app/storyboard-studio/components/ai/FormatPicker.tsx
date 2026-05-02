"use client";

import React from "react";
import { createPortal } from "react-dom";
import { X, Check } from "lucide-react";
import { FORMAT_PRESETS } from "../../constants";

interface FormatPickerProps {
  open: boolean;
  onClose: () => void;
  selected: string | undefined;
  onSelect: (id: string) => void;
  accent?: "purple" | "pink" | "blue" | "teal" | "amber";
  /** When provided, picker opens as a dropdown below this element instead of centered */
  anchorEl?: HTMLElement | null;
}

function getAnchorStyle(el: HTMLElement): React.CSSProperties {
  const rect = el.getBoundingClientRect();
  const pickerWidth = 540;
  const pickerEstHeight = 460;
  const left = Math.max(8, Math.min(rect.left, window.innerWidth - pickerWidth - 8));
  const spaceBelow = window.innerHeight - rect.bottom;
  if (spaceBelow >= pickerEstHeight || spaceBelow >= rect.top) {
    return { top: rect.bottom + 12, left };
  }
  return { bottom: window.innerHeight - rect.top + 12, left };
}

const ACCENT_CLASSES: Record<string, { border: string; ring: string; badge: string }> = {
  purple: { border: "border-purple-500", ring: "ring-purple-500/30", badge: "bg-purple-500" },
  pink:   { border: "border-pink-500",   ring: "ring-pink-500/30",   badge: "bg-pink-500" },
  blue:   { border: "border-(--accent-blue)", ring: "ring-(--accent-blue)/30", badge: "bg-(--accent-blue)" },
  teal:   { border: "border-teal-500",   ring: "ring-teal-500/30",   badge: "bg-teal-500" },
  amber:  { border: "border-amber-500",  ring: "ring-amber-500/30",  badge: "bg-amber-500" },
};

export function FormatPicker({ open, onClose, selected, onSelect, accent = "teal", anchorEl }: FormatPickerProps) {
  if (!open) return null;

  const ac = ACCENT_CLASSES[accent] || ACCENT_CLASSES.teal;
  const isAuto = !selected;

  return createPortal(
    <>
      <div className="fixed inset-0 z-9998 bg-black/40" onClick={onClose} />
      <div
        className="fixed z-9999 w-[540px] max-h-[80vh] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl overflow-y-auto p-4"
        style={anchorEl ? getAnchorStyle(anchorEl) : { left: '50%', top: '50%', transform: 'translate(-50%, -50%)' }}
      >
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="text-sm font-semibold text-(--text-primary)">Content Format</h3>
            <p className="text-[10px] text-(--text-tertiary) mt-0.5">Auto-appends framing, pacing, and camera behavior to all generation prompts. Pair with Genre for mood &amp; lighting.</p>
          </div>
          <button onClick={onClose} className="text-(--text-tertiary) hover:text-(--text-primary) transition">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="grid grid-cols-4 gap-2">
          {/* Auto */}
          <button
            onClick={() => { onSelect(""); onClose(); }}
            className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-4/3 group ${isAuto ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
          >
            <img src="/storytica/element_forge/grids/format/auto.png" alt="Auto" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
            <span className="absolute bottom-1.5 left-0 right-0 text-center text-[10px] font-semibold text-white">Auto</span>
            {isAuto && <div className={`absolute top-1.5 right-1.5 w-4 h-4 ${ac.badge} rounded-full flex items-center justify-center`}><Check className="w-2.5 h-2.5 text-white" /></div>}
          </button>

          {FORMAT_PRESETS.map(f => (
            <button
              key={f.id}
              onClick={() => { onSelect(f.id); onClose(); }}
              className={`relative rounded-lg overflow-hidden border-2 transition-all aspect-4/3 group ${selected === f.id ? `${ac.border} ring-1 ${ac.ring}` : "border-transparent hover:border-white/20"}`}
            >
              {f.preview ? (
                <img src={f.preview} alt={f.label} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
              ) : (
                <div className="w-full h-full bg-linear-to-br from-(--bg-secondary) to-(--bg-tertiary) flex items-center justify-center">
                  <div className="w-5 h-5 rounded-full opacity-60" style={{ backgroundColor: f.color }} />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/70 to-transparent" />
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
