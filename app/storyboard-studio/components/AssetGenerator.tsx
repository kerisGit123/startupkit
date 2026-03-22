"use client";

import { useState } from "react";
import { Users, MapPin, Wrench, ChevronDown, ChevronUp, Upload, Sparkles, Plus, Check, Image as ImageIcon } from "lucide-react";
import { PricingCalculatorComponent } from "./PricingCalculator";

const ELEMENT_TYPES = [
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
  const [elementType,    setElementType]    = useState("characters");
  const [description,  setDescription]  = useState("");
  const [selectedStyle, setSelectedStyle] = useState("Manga (Shonen)");
  const [stylePickerOpen, setStylePickerOpen] = useState(false);
  const [generated,    setGenerated]    = useState(false);
  const [generating,   setGenerating]   = useState(false);
  const [selectedModel, setSelectedModel] = useState("nano-banana-2");
  const [estimatedCost, setEstimatedCost] = useState<number | null>(null);

  const currentStyle = ART_STYLES.find(s => s.id === selectedStyle) ?? ART_STYLES[0];

  const handleGenerate = () => {
    if (!description.trim()) return;
    setGenerating(true);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 1800);
  };

  const handleTypeChange = (id: string) => {
    setElementType(id);
    setDescription("");
    setGenerated(false);
    setStylePickerOpen(false);
  };

  return (
    <div className="flex-1 flex overflow-hidden bg-[#0a0a0f]">
        {/* ── Left panel ── */}
        <div className="w-[540px] shrink-0 border-r border-white/6 flex flex-col overflow-y-auto bg-[#0a0a0f]">
          <div className="border-b border-white/6 px-8 py-7">
            <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em]">Element Generator</p>
              <h2 className="mt-2 text-2xl font-semibold text-white">Generate reusable element images</h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-gray-400">Create visual variations first, then save the best result into your Element Library. The layout below is designed to feel more open, readable, and closer to the rest of Storyboard Studio.</p>
            </div>
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-emerald-500/20 bg-emerald-500/10">
              <Sparkles className="h-5 w-5 text-emerald-400" />
            </div>
          </div>
        </div>

          <div className="p-8 space-y-7">
          {/* Element type */}
          <div className="rounded-3xl border border-white/6 bg-[#101018] p-6">
            <div className="mb-5">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em] block">Element Type</label>
              <p className="mt-2 text-sm text-gray-400">Choose what kind of reusable element you want to generate.</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {ELEMENT_TYPES.map(t => {
                const Icon = t.icon;
                const active = elementType === t.id;
                return (
                  <button key={t.id} onClick={() => handleTypeChange(t.id)}
                    className={`flex min-h-[88px] flex-col items-center justify-center gap-2 rounded-xl border px-3 py-4 transition ${active ? "border-emerald-500/60 bg-emerald-500/10 shadow-[0_0_0_1px_rgba(16,185,129,0.15)]" : "border-white/8 bg-[#13131a] hover:border-white/20 hover:bg-[#171722]"}`}>
                    <Icon className={`w-5 h-5 ${active ? "text-emerald-400" : "text-gray-500"}`} />
                    <span className={`text-[11px] font-semibold leading-tight text-center ${active ? "text-white" : "text-gray-400"}`}>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Description */}
          <div className="rounded-3xl border border-white/6 bg-[#101018] p-6">
            <div className="mb-3 flex items-center justify-between gap-3">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em] block">Prompt</label>
              <span className="shrink-0 text-[11px] text-gray-600">{description.trim().length} chars</span>
            </div>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={PLACEHOLDER_DESCRIPTIONS[elementType]}
              rows={8}
              className="w-full px-5 py-4 bg-[#13131a] border border-white/8 rounded-2xl text-white text-sm placeholder-gray-600 focus:outline-none focus:border-emerald-500/40 focus:ring-2 focus:ring-emerald-500/10 resize-none leading-relaxed"
            />
            <div className="mt-3 flex items-center justify-between gap-3">
              <p className="text-gray-600 text-[11px]">Describe appearance, materials, silhouette, mood, and key identifying details.</p>
            </div>
          </div>

          {/* Art Style dropdown */}
          <div className="rounded-3xl border border-white/6 bg-[#101018] p-6">
            <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em] block mb-2">Art Style</label>

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
          <div className="rounded-3xl border border-white/6 bg-[#101018] p-6">
            <div className="mb-2">
              <label className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em] block">Reference Image</label>
              <p className="mt-2 text-sm text-gray-400">Optional. Add a visual reference to guide composition, costume, shape, or material details.</p>
            </div>
            <button className="w-full flex flex-col items-center gap-2 py-10 border border-dashed border-white/10 rounded-2xl bg-[#13131a] hover:border-white/20 hover:bg-white/[0.03] transition">
              <Upload className="w-6 h-6 text-gray-600" />
              <span className="text-gray-400 text-sm font-medium">Upload reference image</span>
              <span className="text-gray-600 text-[11px]">PNG or JPG up to 10MB</span>
            </button>
          </div>

          {/* Pricing Calculator */}
          <PricingCalculatorComponent
            modelId={selectedModel}
            onCostCalculated={(credits) => setEstimatedCost(credits)}
            disabled={!description.trim()}
          />

          {/* Generate button */}
          <button
            onClick={handleGenerate}
            disabled={!description.trim() || generating}
            className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm transition ${
              description.trim() && !generating
                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-[0_12px_30px_rgba(16,185,129,0.18)]"
                : "bg-emerald-900/30 text-emerald-700 cursor-not-allowed"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            {generating ? "Generating..." : `${GENERATE_LABELS[elementType]}${estimatedCost ? ` (${estimatedCost} credits)` : ''}`}
          </button>

          <p className="px-1 text-[11px] leading-relaxed text-gray-600">Generated images should be saved into the Element Library so they can be reused across storyboard frames.</p>
          </div>
        </div>

        {/* ── Right panel: Generated Variations ── */}
        <div className="flex-1 flex flex-col overflow-hidden bg-[#0a0a0f] min-w-0">
          <div className="px-8 py-7 border-b border-white/6 shrink-0">
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em]">Generated Variations</span>
              <p className="mt-2 text-sm text-gray-400">Preview generated element images here and choose the strongest result to keep. This side should feel spacious like the project workspace, not boxed in.</p>
            </div>
            <div className="hidden rounded-full border border-white/8 bg-white/[0.03] px-3 py-1 text-[11px] text-gray-500 md:block">
              {generated ? "4 ready" : generating ? "Generating" : "Waiting"}
            </div>
          </div>
        </div>

          <div className="flex-1 overflow-y-auto p-8">
          {!generated && !generating && (
            <div className="h-full min-h-[560px] flex flex-col items-center justify-center gap-3 rounded-[32px] border border-dashed border-white/8 bg-[#0f0f16] text-center">
              <div className="w-16 h-16 rounded-2xl bg-white/3 flex items-center justify-center mb-2">
                <Sparkles className="w-7 h-7 text-gray-600" />
              </div>
              <p className="text-gray-300 font-medium">No element variations yet</p>
              <p className="text-gray-600 text-sm">Choose an element type, write your prompt, and generate to preview results.</p>
            </div>
          )}

          {generating && (
            <div className="h-full min-h-[560px] flex flex-col items-center justify-center gap-4 rounded-[32px] border border-white/8 bg-[#0f0f16]">
              <div className="w-12 h-12 rounded-full border-2 border-emerald-500/30 border-t-emerald-500 animate-spin" />
              <p className="text-gray-400 text-sm">Generating element variations...</p>
            </div>
          )}

          {generated && !generating && (
            <div className="space-y-5">
              <p className="text-gray-400 text-sm mb-4">4 variations generated — review them and save the strongest option to your Element Library.</p>
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
                        Save to Library
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
