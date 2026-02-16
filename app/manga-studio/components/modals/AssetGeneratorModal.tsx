"use client";

import { useState } from "react";
import { X, Sparkles, Upload, RefreshCw } from "lucide-react";

interface AssetGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  assetType?: "character" | "location" | "prop" | "scene";
}

export function AssetGeneratorModal({ isOpen, onClose, assetType = "character" }: AssetGeneratorModalProps) {
  const [activeTab, setActiveTab] = useState<"character" | "location" | "prop" | "scene">(assetType);
  const [description, setDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVariations, setGeneratedVariations] = useState<string[]>([]);
  const [selectedStyle, setSelectedStyle] = useState("shonen");

  if (!isOpen) return null;

  const handleGenerate = async () => {
    setIsGenerating(true);
    // Simulate AI generation
    setTimeout(() => {
      setGeneratedVariations([
        "variation-1",
        "variation-2",
        "variation-3",
        "variation-4",
      ]);
      setIsGenerating(false);
    }, 2000);
  };

  const tabs = [
    { id: "character" as const, label: "Characters", icon: "👤" },
    { id: "location" as const, label: "Locations", icon: "📍" },
    { id: "prop" as const, label: "Props", icon: "🎨" },
    { id: "scene" as const, label: "Scenes", icon: "🎬" },
  ];

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Sparkles className="w-6 h-6 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">AI Asset Generator</h2>
                <p className="text-sm text-gray-400 mt-0.5">Generate characters, locations, props, and scenes</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/10 bg-[#0f1117]">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-6 py-4 text-sm font-semibold transition flex items-center justify-center gap-2 ${
                activeTab === tab.id
                  ? "text-emerald-400 border-b-2 border-emerald-400 bg-[#1a1a24]"
                  : "text-gray-400 hover:text-gray-300 hover:bg-[#1a1a24]"
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-6">
            {/* Description Input */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={`Describe the ${activeTab} you want to generate...`}
                className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-500 transition resize-none"
                rows={4}
              />
              <p className="text-xs text-gray-400 mt-2">
                Be specific about appearance, style, mood, and key features
              </p>
            </div>

            {/* Style Selection */}
            <div>
              <label className="block text-sm font-semibold text-white mb-3">
                Art Style
              </label>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {[
                  { id: "shonen", name: "Shonen", desc: "Action-packed, teenage boys" },
                  { id: "shojo", name: "Shojo", desc: "Emotion-driven, teenage girls" },
                  { id: "seinen", name: "Seinen", desc: "Mature themes, young adults" },
                  { id: "josei", name: "Josei", desc: "Adult romance/life, women" },
                  { id: "kodomo", name: "Kodomo", desc: "For young children" },
                  { id: "ghibli", name: "Ghibli Style", desc: "Studio Ghibli aesthetic" },
                  { id: "doraemon", name: "Doraemon Style", desc: "Classic cartoon style" },
                  { id: "custom", name: "Custom Style", desc: "Your own style" },
                ].map((style) => (
                  <button
                    key={style.id}
                    onClick={() => setSelectedStyle(style.id)}
                    className={`p-3 rounded-lg border-2 transition text-left ${
                      selectedStyle === style.id
                        ? "border-emerald-500 bg-emerald-500/10"
                        : "border-white/10 bg-[#0f1117] hover:border-emerald-500/30"
                    }`}
                  >
                    <div className="font-semibold text-white text-sm mb-1">{style.name}</div>
                    <div className="text-xs text-gray-400">{style.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Reference Image Upload */}
            <div>
              <label className="block text-sm font-semibold text-white mb-2">
                Reference Image (Optional)
              </label>
              <div className="border-2 border-dashed border-white/20 rounded-lg p-8 text-center hover:border-emerald-500/50 transition cursor-pointer">
                {referenceImage ? (
                  <div className="relative">
                    <img src={referenceImage} alt="Reference" className="max-h-48 mx-auto rounded-lg" />
                    <button
                      onClick={() => setReferenceImage(null)}
                      className="absolute top-2 right-2 w-8 h-8 bg-black/70 rounded-lg flex items-center justify-center text-white hover:bg-black"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div>
                    <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">Click to upload reference image</p>
                    <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB</p>
                  </div>
                )}
              </div>
            </div>

            {/* Generate Button */}
            <button
              onClick={handleGenerate}
              disabled={!description || isGenerating}
              className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg py-4 font-semibold text-sm hover:opacity-90 transition flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  Generate {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
                </>
              )}
            </button>

            {/* Generated Variations */}
            {generatedVariations.length > 0 && (
              <div>
                <h3 className="text-white font-semibold mb-4">Generated Variations</h3>
                <div className="grid grid-cols-2 gap-4">
                  {generatedVariations.map((variation, index) => (
                    <div
                      key={index}
                      className="bg-[#0f1117] rounded-lg border border-white/10 overflow-hidden hover:border-emerald-500/50 transition cursor-pointer group"
                    >
                      <div className="aspect-square bg-gradient-to-br from-emerald-900/20 to-teal-900/20 flex items-center justify-center">
                        <Sparkles className="w-16 h-16 text-emerald-400/50" />
                      </div>
                      <div className="p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-white font-medium">Variation {index + 1}</span>
                          <button className="px-3 py-1 bg-emerald-500/20 text-emerald-400 rounded text-xs font-medium hover:bg-emerald-500/30 transition">
                            Use This
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
