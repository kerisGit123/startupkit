"use client";

import { useState } from "react";
import { X, Plus, Palette, BookOpen, User, Sparkles } from "lucide-react";

interface NewComicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PRESET_STYLES = [
  { id: "normal-anime", label: "Normal Anime", desc: "Classic anime aesthetic", gradient: "from-pink-500 to-purple-500", emoji: "💖" },
  { id: "neon-punk", label: "Neon Punk", desc: "Cyberpunk neon glow", gradient: "from-purple-600 to-blue-500", emoji: "🌃" },
  { id: "monochrome", label: "Monochrome", desc: "Black & white grayscale", gradient: "from-gray-500 to-gray-700", emoji: "⚫" },
  { id: "gothic", label: "Gothic", desc: "Dark, ornate Victorian", gradient: "from-gray-700 to-purple-900", emoji: "🦇" },
  { id: "heightened-line-art", label: "Heightened Line Art", desc: "Bold expressive linework", gradient: "from-red-500 to-pink-500", emoji: "✍️" },
  { id: "analog-film", label: "Analog Film", desc: "Vintage film grain", gradient: "from-yellow-700 to-orange-800", emoji: "📸" },
  { id: "fantasy-art", label: "Fantasy Art", desc: "Ethereal high fantasy", gradient: "from-emerald-500 to-teal-500", emoji: "🧚" },
  { id: "superhero-comic", label: "Superhero Comic", desc: "Bold dynamic hero style", gradient: "from-blue-500 to-red-500", emoji: "🦸" },
  { id: "heightened-reality", label: "Heightened Reality", desc: "Photo-realistic anime", gradient: "from-blue-400 to-indigo-600", emoji: "🌟" },
  { id: "manhwa-romance", label: "Manhwa Romance", desc: "Soft pastel Korean romance", gradient: "from-pink-400 to-rose-500", emoji: "💕" },
  { id: "manhwa-action", label: "Manhwa Action", desc: "Dynamic Korean action", gradient: "from-red-500 to-orange-500", emoji: "💥" },
  { id: "cel-art", label: "Cel Art", desc: "Cel shaded animation", gradient: "from-blue-500 to-cyan-400", emoji: "🎬" },
  { id: "manga-shonen", label: "Manga (Shonen)", desc: "Action-packed shonen", gradient: "from-orange-500 to-yellow-500", emoji: "🔥" },
  { id: "manga-seinen", label: "Manga (Seinen)", desc: "Mature seinen style", gradient: "from-gray-600 to-blue-800", emoji: "🌃" },
  { id: "manga-shojo", label: "Manga (Shojo)", desc: "Romantic shojo style", gradient: "from-pink-300 to-purple-400", emoji: "🌸" },
  { id: "western-comic", label: "Western Comic", desc: "Classic American comic", gradient: "from-blue-600 to-red-600", emoji: "🇺🇸" },
  { id: "noir", label: "Noir", desc: "High contrast noir", gradient: "from-gray-900 to-gray-600", emoji: "🕵️" },
  { id: "toon-cartoon", label: "Toon / Cartoon", desc: "Playful cartoon style", gradient: "from-yellow-400 to-green-400", emoji: "🤪" },
  { id: "watercolor", label: "Watercolor", desc: "Soft watercolor washes", gradient: "from-cyan-400 to-purple-400", emoji: "🎨" },
  { id: "webtoon", label: "Webtoon", desc: "Clean Korean webtoon", gradient: "from-green-400 to-blue-400", emoji: "📱" },
  { id: "ink-coloring", label: "Ink & Coloring", desc: "Traditional ink + flat color", gradient: "from-gray-800 to-orange-600", emoji: "✒️" },
];

export function NewComicModal({ isOpen, onClose }: NewComicModalProps) {
  const [comicName, setComicName] = useState("");
  const [creatorName, setCreatorName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStyle, setSelectedStyle] = useState(PRESET_STYLES[0].id);
  const [isCustomStyle, setIsCustomStyle] = useState(false);
  const [customStylePrompt, setCustomStylePrompt] = useState("");

  if (!isOpen) return null;

  const selectedStyleData = PRESET_STYLES.find(s => s.id === selectedStyle) || PRESET_STYLES[0];

  const handleCreate = () => {
    if (!comicName.trim() || !creatorName.trim()) return;
    
    // TODO: Create comic in database
    console.log("Creating comic:", {
      name: comicName,
      creator: creatorName,
      description,
      style: isCustomStyle ? customStylePrompt : selectedStyle,
      isCustomStyle
    });
    
    onClose();
    // Reset form
    setComicName("");
    setCreatorName("");
    setDescription("");
    setSelectedStyle(PRESET_STYLES[0].id);
    setIsCustomStyle(false);
    setCustomStylePrompt("");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-3xl w-full mx-4 border border-white/10 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Create New Comic</h2>
              <p className="text-sm text-gray-400">Start your comic project with custom settings</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-6">
          {/* Comic Name */}
          <div>
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
              <BookOpen className="w-4 h-4" />
              Comic Name *
            </label>
            <input
              type="text"
              value={comicName}
              onChange={(e) => setComicName(e.target.value)}
              placeholder="Enter your comic title..."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          {/* Creator Name */}
          <div>
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-2">
              <User className="w-4 h-4" />
              Creator Name *
            </label>
            <input
              type="text"
              value={creatorName}
              onChange={(e) => setCreatorName(e.target.value)}
              placeholder="Your name or pen name..."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Brief Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What's your comic about? (Optional)"
              rows={3}
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
            />
          </div>

          {/* Art Style */}
          <div>
            <label className="text-sm font-medium text-gray-300 flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4" />
              Art Style
            </label>
            
            {/* Style Toggle */}
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => setIsCustomStyle(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  !isCustomStyle 
                    ? "bg-pink-500 text-white" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Preset Styles
              </button>
              <button
                onClick={() => setIsCustomStyle(true)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                  isCustomStyle 
                    ? "bg-pink-500 text-white" 
                    : "bg-white/5 text-gray-400 hover:bg-white/10"
                }`}
              >
                Custom Style
              </button>
            </div>

            {!isCustomStyle ? (
              /* Preset Styles Grid */
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2">
                {PRESET_STYLES.map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-lg border transition text-left ${
                      selectedStyle === style.id
                        ? "border-pink-500 bg-pink-500/10"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{style.emoji}</span>
                      <span className="text-sm font-medium text-white">{style.label}</span>
                    </div>
                    <div className="text-xs text-gray-400">{style.desc}</div>
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Style Input */
              <div>
                <textarea
                  value={customStylePrompt}
                  onChange={(e) => setCustomStylePrompt(e.target.value)}
                  placeholder="Describe your custom art style... (e.g., 'Watercolor style with soft pastels, inspired by Studio Ghibli, with detailed backgrounds and expressive character designs')"
                  rows={4}
                  className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-pink-500/50 resize-none"
                />
                <div className="mt-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <Sparkles className="w-4 h-4 text-blue-400 mt-0.5" />
                    <div className="text-xs text-blue-400">
                      <strong>Pro tip:</strong> Be specific about artistic influences, color palettes, line work style, and mood for best results.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Selected Style Preview */}
          {!isCustomStyle && (
            <div className="p-4 bg-gradient-to-r from-pink-500/10 to-rose-500/10 border border-pink-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${selectedStyleData.gradient} flex items-center justify-center`}>
                  <span className="text-lg">{selectedStyleData.emoji}</span>
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{selectedStyleData.label}</div>
                  <div className="text-xs text-gray-400">{selectedStyleData.desc}</div>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/10">
            <button
              onClick={onClose}
              className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!comicName.trim() || !creatorName.trim()}
              className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white rounded-lg text-sm font-bold transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Create Comic
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
