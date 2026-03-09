"use client";

import { useState } from "react";
import { Users, MapPin, Wrench, ChevronDown, ChevronUp, Upload, Sparkles, Plus, Check, Image as ImageIcon } from "lucide-react";

const ASSET_TYPES = [
  { id: "characters", label: "Characters",    icon: Users   },
  { id: "locations",  label: "Locations",     icon: MapPin  },
  { id: "props",      label: "Props & Tools", icon: Wrench  },
];

const ART_STYLES = [
  { id: "Manga (Shonen)",            desc: "Action-packed, bold lines, speed effects" },
  { id: "Manga (Seinen)",            desc: "Detailed, mature, realistic proportions" },
  { id: "Manga (Shojo)",             desc: "Soft lines, emotional, decorative tones" },
  { id: "Western Comic",             desc: "Bold inks, strong shadows, superhero style" },
  { id: "Noir",                      desc: "High contrast B&W, dramatic shadows, gritty" },
  { id: "Toon / Cartoon",            desc: "Simplified shapes, bright colors, fun" },
  { id: "Watercolor / Illustration", desc: "Soft washes, painted textures, organic" },
  { id: "Webtoon",                   desc: "Clean digital art, full color, vertical scroll" },
  { id: "Inking & Coloring",         desc: "Traditional ink + flat/cel color" },
];

const PLACEHOLDER_DESCRIPTIONS: Record<string, string> = {
  characters: "A young basketball player with spiky hair, intense eyes, athletic build. Wearing a red jersey #7...",
  locations:  "An abandoned warehouse at night, towering wooden crates, single hanging light bulb, dusty concrete floor...",
  props:      "A worn tactical flashlight with scratched grip, slightly dented casing, faint beam of light...",
};

const GENERATE_LABELS: Record<string, string> = {
  characters: "Generate Character Variations",
  locations:  "Generate Location Variations",
  props:      "Generate Prop Variations",
};

export function AssetGenerator() {
  const [assetType,    setAssetType]    = useState("characters");
  const [description,  setDescription]  = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Manga (Shonen)");
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [generated,    setGenerated]    = useState(false);
  const [generating,   setGenerating]   = useState(false);

  const currentStyle = ART_STYLES.find(s => s.id === selectedStyle) ?? ART_STYLES[0];

  const handleGenerate = () => {
    if (!description.trim()) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  const handleTypeChange = (id: string) => {
    setAssetType(id);
    setDescription("");
    setGenerated(false);
    setStylePickerOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden">
      {/* ── Left panel ── */}
      <div className="w-[420px] shrink-0 border-r border-white/6 flex flex-col overflow-y-auto bg-[#0a0a0f]">
        <div className="p-6 space-y-6">
          {/* Asset type */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-3">Asset Type</label>
            <div className="grid grid-cols-4 gap-2">
              {ASSET_TYPES.map(t => {
                const Icon = t.icon;
                const active = assetType === t.id;
                return (
                  <button key={t.id} onClick={() => handleTypeChange(t.id)}
                    className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border-2 transition ${active ? "border-emerald-500 bg-emerald-500/10" : "border-white/8 bg-[#13131a] hover:border-white/20"}`}>
                    <Icon className={`w-5 h-5 ${active ? "text-emerald-400" : "text-gray-500"}`} />
                    <span className={`text-[10px] font-semibold leading-tight text-center ${active ? "text-white" : "text-gray-500"}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={PLACEHOLDER_DESCRIPTIONS[assetType]}
              rows={5}
              className="w-full px-4 py-3 bg-[#13131a] border border-white/8 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 resize-none leading-relaxed"
            />
            <p className="text-gray-600 text-[11px] mt-1.5">Be specific about appearance, style, mood, and key features</p>
          </div>

          {/* Art Style dropdown */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">Art Style</label>

            {/* Selected style pill */}
            <button onClick={() => setStylePickerOpen(v => !v)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#13131a] border border-white/8 rounded-xl text-white hover:border-white/20 transition">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-emerald-400" />
                </div>
                <div className="text-left">
                  <div className="text-sm font-semibold">{currentStyle.id}</div>
                  <div className="text-[11px] text-gray-500">{currentStyle.desc}</div>
                </div>
              </div>
              {stylePickerOpen ? <ChevronUp className="w-4 h-4 text-gray-500 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />}
            </button>

            {/* Style picker panel */}
            {stylePickerOpen && (
              <div className="mt-2 bg-[#13131a] border border-white/8 rounded-xl overflow-hidden">
                <div className="px-4 py-2 border-b border-white/6 flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Select Art Style</span>
                  <button onClick={() => {}} className="text-emerald-400 text-[11px] font-semibold hover:text-emerald-300 transition flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Create Custom
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-px bg-white/5">
                  {ART_STYLES.map(s => (
                    <button key={s.id} onClick={() => { setSelectedStyle(s.id); setStylePickerOpen(false); }}
                      className={`flex flex-col gap-0.5 p-3 text-left transition ${selectedStyle === s.id ? "bg-emerald-500/10" : "bg-[#13131a] hover:bg-white/3"}`}>
                      <div className="flex items-center gap-2">
                        {selectedStyle === s.id && <Check className="w-3 h-3 text-emerald-400 shrink-0" />}
                        <span className={`text-sm font-semibold ${selectedStyle === s.id ? "text-emerald-300" : "text-white"}`}>{s.id}</span>
                      </div>
                      <span className="text-[11px] text-gray-500 leading-snug">{s.desc}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Reference image */}
          <div>
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest block mb-2">Reference Image (Optional)</label>
            <button className="w-full flex flex-col items-center gap-2 py-6 border-2 border-dashed border-white/8 rounded-xl hover:border-white/20 hover:bg-white/2 transition">
              <Upload className="w-6 h-6 text-gray-600" />
              <span className="text-gray-500 text-sm font-medium">Upload a reference image</span>
              <span className="text-gray-600 text-[11px]">PNG, JPG up to 10MB</span>
            </button>
          </div>

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || generating}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition ${
              description.trim() && !generating
                ? "bg-emerald-600 hover:bg-emerald-500 text-white"
                : "bg-emerald-900/30 text-emerald-700 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating..." : GENERATE_LABELS[assetType]}
          </button>
        </div>
      </div>

      {/* ── Right panel: Generated Variations ── */}
      <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f]">
        <div className="px-6 py-4 border-b border-white/6 shrink-0">
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-widest">Generated Variations</span>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!generated && !generating && (
            <div className="h-full flex flex-col items-center justify-center gap-3 text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center mb-2">
                <Sparkles className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-400 font-medium">No variations generated yet</p>
              <p className="text-gray-600 text-sm">Fill in details and click Generate</p>
            </div>
          )}

          {generating && (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
              <p className="text-gray-400 text-sm">Generating variations...</p>
            </div>
          )}

          {generated && !generating && (
            <div className="space-y-4">
              <p className="text-gray-400 text-sm mb-4">4 variations generated — click any to select</p>
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="group relative bg-[#13131a] border border-white/8 rounded-xl overflow-hidden hover:border-emerald-500/40 transition cursor-pointer">
                    <div className="aspect-square bg-linear-to-br from-[#1e1e2a] to-[#2a2a3a] flex items-center justify-center">
                      <div className="text-center">
                        <ImageIcon className="w-10 h-10 text-gray-700 mx-auto mb-2" />
                        <span className="text-gray-600 text-xs">Variation {i}</span>
                      </div>
                    </div>
                    <div className="p-3 flex items-center justify-between">
                      <span className="text-gray-400 text-xs">v{i}</span>
                      <button className="px-3 py-1 bg-emerald-600/20 hover:bg-emerald-600 text-emerald-400 hover:text-white rounded-lg text-[11px] font-semibold transition">
                        Use This
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <button onClick={() => { setGenerated(false); handleGenerate(); }}
                className="w-full py-2.5 border border-white/8 hover:border-white/20 text-gray-400 hover:text-white rounded-xl text-sm transition flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4" /> Regenerate
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
