"use client";

import { X, Lock, Copy, Check } from "lucide-react";
import { useState } from "react";
import type { BoardSettings } from "../types";

// ── PDF Export Modal ──────────────────────────────────────────────────────────
interface PdfModalProps {
  onClose: () => void;
  boardSettings: BoardSettings;
}
export function PdfModal({ onClose, boardSettings }: PdfModalProps) {
  const [orient, setOrient] = useState("landscape");
  const [layout, setLayout] = useState("three-up");

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c26] border border-white/10 rounded-2xl w-full max-w-lg" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-white font-bold text-base">Download PDF</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-5">
          {/* Orientation */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Orientation</label>
            <div className="flex gap-3">
              {["landscape", "portrait"].map(o => (
                <button key={o} onClick={() => setOrient(o)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition capitalize ${
                    orient === o ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}>{o}</button>
              ))}
            </div>
          </div>
          {/* Layout */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Layout</label>
            <div className="flex gap-3">
              {[
                { id: "three-up", label: "3-up" },
                { id: "two-up",   label: "2-up" },
                { id: "full",     label: "Full" },
              ].map(l => (
                <button key={l.id} onClick={() => setLayout(l.id)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-medium border transition ${
                    layout === l.id ? "border-violet-500 bg-violet-500/10 text-white" : "border-white/10 text-gray-400 hover:border-white/20"
                  }`}>{l.label}</button>
              ))}
            </div>
          </div>
          {/* Board settings summary */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Include in PDF</label>
            <div className="grid grid-cols-2 gap-2">
              {(["showNotes", "showScript", "showAction", "showCamera", "showTags"] as (keyof BoardSettings)[]).map(k => (
                <div key={k} className="flex items-center gap-2">
                  <div className={`w-3.5 h-3.5 rounded flex items-center justify-center ${boardSettings[k] ? "bg-violet-500" : "bg-white/10"}`}>
                    {boardSettings[k] && <Check className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-gray-400 text-xs capitalize">{k.replace("show", "")}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
          <button className="px-5 py-2 bg-violet-600 hover:bg-violet-700 text-white rounded-lg text-sm font-semibold transition">
            Download PDF
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Share Modal ───────────────────────────────────────────────────────────────
interface ShareModalProps {
  onClose: () => void;
  projectName: string;
}
export function ShareModal({ onClose, projectName }: ShareModalProps) {
  const [settings, setSettings] = useState({
    allowDownloads: false, showComments: false,
    showStageDetails: true, showAllVersions: true, passwordEnabled: true,
  });
  const [copied, setCopied] = useState(false);
  const shareLink = `https://storyboard.studio/share/${projectName.toLowerCase().replace(/\s+/g, "-")}`;
  const password = "hfKD[WVE0as:]8Go";

  const handleCopy = () => {
    navigator.clipboard.writeText(shareLink).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c26] border border-white/10 rounded-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/8">
          <h3 className="text-white font-bold text-base">Share</h3>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition"><X className="w-4 h-4" /></button>
        </div>
        <div className="p-6 space-y-4">
          {/* Share link */}
          <div>
            <label className="text-gray-400 text-xs font-medium mb-2 block">Share link</label>
            <div className="flex items-center gap-2 bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5">
              <span className="flex-1 text-gray-300 text-xs truncate">{shareLink}</span>
              <button onClick={handleCopy} className="text-gray-400 hover:text-white transition shrink-0">
                {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Permissions */}
          <div className="space-y-3">
            {[
              { key: "allowDownloads",   label: "Allow downloads" },
              { key: "showComments",     label: "Show comments" },
              { key: "showStageDetails", label: "Show stage details" },
              { key: "showAllVersions",  label: "Show all versions" },
            ].map(item => (
              <div key={item.key} className="flex items-center justify-between">
                <span className="text-gray-300 text-sm">{item.label}</span>
                <button
                  onClick={() => setSettings(s => ({ ...s, [item.key]: !s[item.key as keyof typeof s] }))}
                  aria-label={`Toggle ${item.label}`}
                  className={`w-9 h-5 rounded-full transition-colors relative ${settings[item.key as keyof typeof settings] ? "bg-violet-500" : "bg-white/10"}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings[item.key as keyof typeof settings] ? "left-[18px]" : "left-0.5"}`} />
                </button>
              </div>
            ))}
          </div>

          {/* Password */}
          <div className="pt-2 border-t border-white/8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-gray-500" />
                <span className="text-gray-300 text-sm">Password protection</span>
              </div>
              <button
                onClick={() => setSettings(s => ({ ...s, passwordEnabled: !s.passwordEnabled }))}
                aria-label="Toggle password protection"
                className={`w-9 h-5 rounded-full transition-colors relative ${settings.passwordEnabled ? "bg-violet-500" : "bg-white/10"}`}
              >
                <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${settings.passwordEnabled ? "left-[18px]" : "left-0.5"}`} />
              </button>
            </div>
            {settings.passwordEnabled && (
              <div className="flex items-center gap-2 bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5">
                <span className="flex-1 text-gray-300 text-xs font-mono">{password}</span>
                <button onClick={() => navigator.clipboard.writeText(password).catch(() => {})} className="text-gray-400 hover:text-white transition">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-white/8">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Close</button>
          <button className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">
            Copy link
          </button>
        </div>
      </div>
    </div>
  );
}

// ── New Tag Modal ─────────────────────────────────────────────────────────────
interface TagModalProps {
  onClose: () => void;
  onAdd: (name: string, color: string) => void;
}
const TAG_COLORS = ["#ef4444","#f97316","#eab308","#22c55e","#3b82f6","#8b5cf6","#ec4899","#06b6d4"];

export function TagModal({ onClose, onAdd }: TagModalProps) {
  const [name, setName] = useState("");
  const [color, setColor] = useState(TAG_COLORS[0]);

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-[#1c1c26] border border-white/10 rounded-2xl w-full max-w-sm p-6" onClick={e => e.stopPropagation()}>
        <h3 className="text-white font-bold text-base mb-4">New Tag</h3>
        <div className="mb-4">
          <label className="text-gray-400 text-xs mb-1.5 block">Tag name</label>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. motion"
            className="w-full bg-[#25252f] border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-violet-500/50" autoFocus />
        </div>
        <div className="mb-5">
          <label className="text-gray-400 text-xs mb-2 block">Color</label>
          <div className="flex gap-2 flex-wrap">
            {TAG_COLORS.map(c => (
              <button key={c} onClick={() => setColor(c)} aria-label={`Color ${c}`}
                className={`w-7 h-7 rounded-full transition ${color === c ? "ring-2 ring-white ring-offset-2 ring-offset-[#1c1c26]" : ""}`}
                style={{ backgroundColor: c }} />
            ))}
          </div>
        </div>
        <div className="flex items-center justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition">Cancel</button>
          <button onClick={() => { if (name.trim()) { onAdd(name, color); onClose(); } }}
            disabled={!name.trim()}
            className={`px-5 py-2 rounded-lg text-sm font-semibold transition ${name.trim() ? "bg-violet-600 hover:bg-violet-700 text-white" : "bg-white/5 text-gray-500 cursor-not-allowed"}`}>
            Add Tag
          </button>
        </div>
      </div>
    </div>
  );
}
