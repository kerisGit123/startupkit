"use client";

import { useState } from "react";
import { Check, Sparkles, Pencil } from "lucide-react";

export interface DrawingStyle {
  id: string;
  name: string;
  gradient: string;
  emoji: string;
  description: string;
}

export const DRAWING_STYLES: DrawingStyle[] = [
  { id: "normal-anime", name: "Normal Anime", gradient: "from-indigo-600 to-purple-700", emoji: "🎌", description: "Classic anime aesthetic with vibrant colors" },
  { id: "neon-punk", name: "Neon Punk", gradient: "from-fuchsia-600 to-violet-800", emoji: "🌆", description: "Cyberpunk neon glow, dark backgrounds" },
  { id: "monochrome", name: "Monochrome", gradient: "from-gray-600 to-gray-800", emoji: "🖤", description: "Black & white with grayscale shading" },
  { id: "gothic", name: "Gothic", gradient: "from-purple-900 to-gray-900", emoji: "🦇", description: "Dark, ornate, Victorian-inspired art" },
  { id: "heightened-line-art", name: "Heightened Line Art", gradient: "from-rose-600 to-red-800", emoji: "✒️", description: "Bold expressive linework, vivid details" },
  { id: "analog-film", name: "Analog Film", gradient: "from-amber-700 to-stone-700", emoji: "📷", description: "Vintage film grain, muted warm tones" },
  { id: "fantasy-art", name: "Fantasy Art", gradient: "from-emerald-600 to-teal-800", emoji: "🧝", description: "Ethereal, magical, high fantasy illustration" },
  { id: "superhero-comic", name: "Superhero Comic", gradient: "from-red-600 to-blue-700", emoji: "🦸", description: "Bold colors, dynamic poses, western hero style" },
  { id: "heightened-reality", name: "Heightened Reality", gradient: "from-sky-600 to-indigo-700", emoji: "✨", description: "Hyper-detailed, photo-realistic anime fusion" },
  { id: "manhwa-romance", name: "Manhwa Romance", gradient: "from-pink-500 to-rose-600", emoji: "💕", description: "Soft pastel, Korean romance webtoon style" },
  { id: "manhwa-action", name: "Manhwa Action", gradient: "from-orange-600 to-red-700", emoji: "⚔️", description: "Dynamic Korean action webtoon style" },
  { id: "cel-art", name: "Cel Art", gradient: "from-cyan-500 to-blue-600", emoji: "🎞️", description: "Traditional cel-shaded animation look" },
  { id: "manga-shonen", name: "Manga (Shonen)", gradient: "from-orange-500 to-amber-700", emoji: "💥", description: "High energy, bold lines, action-focused" },
  { id: "manga-seinen", name: "Manga (Seinen)", gradient: "from-slate-600 to-zinc-800", emoji: "🗡️", description: "Mature, detailed, realistic proportions" },
  { id: "manga-shojo", name: "Manga (Shojo)", gradient: "from-pink-400 to-fuchsia-600", emoji: "🌸", description: "Sparkling eyes, flowery backgrounds, soft" },
  { id: "western-comic", name: "Western Comic", gradient: "from-yellow-500 to-red-600", emoji: "💬", description: "Bold outlines, flat colors, halftone dots" },
  { id: "noir", name: "Noir", gradient: "from-gray-900 to-black", emoji: "🕵️", description: "High contrast shadows, detective mood" },
  { id: "toon-cartoon", name: "Toon / Cartoon", gradient: "from-green-400 to-lime-600", emoji: "🎨", description: "Exaggerated, playful, cartoon style" },
  { id: "watercolor", name: "Watercolor / Illustration", gradient: "from-blue-300 to-purple-400", emoji: "🖌️", description: "Soft watercolor washes, painterly feel" },
  { id: "webtoon", name: "Webtoon", gradient: "from-emerald-500 to-cyan-600", emoji: "📱", description: "Clean digital art, vertical scroll optimized" },
  { id: "ink-coloring", name: "Ink & Coloring", gradient: "from-stone-600 to-amber-800", emoji: "🖊️", description: "Traditional ink linework with digital color" },
];

interface DrawingStylePickerProps {
  selectedStyle: string;
  onSelectStyle: (styleId: string) => void;
  customStyle: string;
  onCustomStyleChange: (value: string) => void;
  compact?: boolean;
}

export function DrawingStylePicker({ selectedStyle, onSelectStyle, customStyle, onCustomStyleChange, compact = false }: DrawingStylePickerProps) {
  const [showCustomInput, setShowCustomInput] = useState(selectedStyle === "custom");

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wide">Drawing Style</label>
        <button
          onClick={() => {
            setShowCustomInput(!showCustomInput);
            if (!showCustomInput) onSelectStyle("custom");
          }}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold transition ${
            showCustomInput || selectedStyle === "custom"
              ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
              : "bg-white/5 text-gray-400 hover:text-gray-300 border border-white/10"
          }`}
        >
          <Pencil className="w-3 h-3" />
          Custom Style
        </button>
      </div>

      {/* Custom Style Input */}
      {(showCustomInput || selectedStyle === "custom") && (
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              value={customStyle}
              onChange={(e) => onCustomStyleChange(e.target.value)}
              placeholder='e.g. "Naruto style", "Bleach style", "Studio Ghibli feel"'
              className="w-full px-3 py-2.5 bg-[#1a1a24] border border-pink-500/30 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 pr-8"
            />
            <Sparkles className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-pink-400" />
          </div>
          <p className="text-[9px] text-gray-500 mt-1">AI translates this into an IP-safe art direction automatically</p>
        </div>
      )}

      {/* Style Grid */}
      <div className={`grid gap-2 ${compact ? "grid-cols-3" : "grid-cols-4"}`}>
        {DRAWING_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => {
              onSelectStyle(style.id);
              if (showCustomInput && style.id !== "custom") setShowCustomInput(false);
            }}
            className={`relative group rounded-xl overflow-hidden border-2 transition-all ${
              selectedStyle === style.id
                ? "border-purple-500 ring-2 ring-purple-500/30 scale-[1.02]"
                : "border-transparent hover:border-white/20"
            }`}
          >
            <div className={`aspect-[4/3] bg-gradient-to-br ${style.gradient} flex items-center justify-center`}>
              <span className={`${compact ? "text-xl" : "text-2xl"} drop-shadow-lg`}>{style.emoji}</span>
            </div>
            <div className="bg-[#13131a] px-2 py-1.5">
              <p className={`font-semibold text-white truncate ${compact ? "text-[9px]" : "text-[10px]"}`}>{style.name}</p>
              {!compact && <p className="text-[8px] text-gray-500 truncate">{style.description}</p>}
            </div>
            {selectedStyle === style.id && (
              <div className="absolute top-1.5 right-1.5 w-5 h-5 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                <Check className="w-3 h-3 text-white" />
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
