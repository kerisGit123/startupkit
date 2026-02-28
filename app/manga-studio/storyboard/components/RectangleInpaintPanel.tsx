"use client";

import { Eye, EyeOff, Plus, X, ChevronDown } from "lucide-react";
import { Image as ImageIcon } from "lucide-react";
import { useState } from "react";

interface Rectangle {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface RectangleInpaintPanelProps {
  rectangle: Rectangle | null;
  setRectangle: (rect: Rectangle | null) => void;
  isSquareMode: boolean;
  setIsSquareMode: (v: boolean) => void;
  imageIsRectangleVisible: boolean;
  setImageIsRectangleVisible: (v: boolean) => void;
  inpaintPrompt: string;
  setInpaintPrompt: (v: string) => void;
  inpaintModel: string;
  setInpaintModel: (v: string) => void;
  imageReferenceImages: string[];
  setImageReferenceImages: (fn: ((prev: string[]) => string[]) | string[]) => void;
  isInpainting: boolean;
  inpaintError: string | null;
  showGenPanel: boolean;
  setShowGenPanel: (fn: (v: boolean) => boolean) => void;
  generatedImages: string[];
  onRunInpaint: () => void;
}

export default function RectangleInpaintPanel({
  rectangle,
  setRectangle,
  isSquareMode,
  setIsSquareMode,
  imageIsRectangleVisible,
  setImageIsRectangleVisible,
  inpaintPrompt,
  setInpaintPrompt,
  inpaintModel,
  setInpaintModel,
  imageReferenceImages,
  setImageReferenceImages,
  isInpainting,
  inpaintError,
  showGenPanel,
  setShowGenPanel,
  generatedImages,
  onRunInpaint,
}: RectangleInpaintPanelProps) {
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  const modelOptions = !isSquareMode ? [
    { value: "flux-kontext-pro", label: "Flux Kontext Pro", sub: "Best for rectangle inpainting" },
    { value: "grok", label: "Grok Imagine", sub: "Fast generation" },
    { value: "qwen-z-image", label: "Qwen Z Image", sub: "High quality" },
  ] : [
    { value: "gpt-image", label: "🟦 GPT Image 1.5", sub: "Square Mode" },
    { value: "nano-banana-edit", label: "🟩 Nano Banana Edit", sub: "Square Mode" },
  ];

  const selectedModel = modelOptions.find(m => m.value === inpaintModel) || modelOptions[0];
  const addRectangle = () => {
    const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const width = rect.width * 0.5;
      const height = rect.height * 0.5;
      const x = (rect.width - width) / 2;
      const y = (rect.height - height) / 2;
      setRectangle({ x, y, width, height });
      setImageIsRectangleVisible(true);
      setIsSquareMode(false);
    }
  };

  const addSquare = () => {
    const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
    if (container) {
      const rect = container.getBoundingClientRect();
      const size = Math.min(rect.width, rect.height) * 0.4;
      const x = (rect.width - size) / 2;
      const y = (rect.height - size) / 2;
      setRectangle({ x, y, width: size, height: size });
      setImageIsRectangleVisible(true);
      setIsSquareMode(true);
      setInpaintModel("gpt-image");
    }
  };

  return (
    <div className="p-3 space-y-3">
      <div>
        <h3 className="text-white font-bold text-sm">Rectangle Inpaint</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Select rectangle areas to inpaint with AI</p>
      </div>

      <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
        {/* Rectangle Selection */}
        <div className="space-y-2">
          <label className="text-[11px] text-gray-300 font-semibold">Rectangle Selection</label>

          {/* Row 1: Add Rectangle | Add Square */}
          <div className="flex gap-2">
            <button
              onClick={addRectangle}
              className="flex-1 px-3 py-2 bg-cyan-600/10 hover:bg-cyan-600/20 border border-cyan-600/30 text-cyan-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3 flex-shrink-0" />
              Add Rectangle
            </button>
            <button
              onClick={addSquare}
              className="flex-1 px-3 py-2 bg-purple-600/10 hover:bg-purple-600/20 border border-purple-600/30 text-purple-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
            >
              <Plus className="w-3 h-3 flex-shrink-0" />
              Add Square
            </button>
          </div>

          {/* Row 2: Hide/Show | Clear */}
          <div className="flex gap-2">
            <button
              onClick={() => setImageIsRectangleVisible(!imageIsRectangleVisible)}
              disabled={!rectangle}
              className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-blue-500/10 border border-white/10 text-gray-300 hover:text-blue-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
              title={rectangle ? (imageIsRectangleVisible ? "Hide rectangle" : "Show rectangle") : "Add a rectangle first"}
            >
              {imageIsRectangleVisible ? <Eye className="w-3 h-3 flex-shrink-0" /> : <EyeOff className="w-3 h-3 flex-shrink-0" />}
              {imageIsRectangleVisible ? "Hide" : "Show"}
            </button>
            <button
              onClick={() => { setRectangle(null); setIsSquareMode(false); }}
              disabled={!rectangle}
              className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 text-gray-300 hover:text-red-300 disabled:opacity-30 disabled:cursor-not-allowed rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
            >
              <X className="w-3 h-3 flex-shrink-0" />
              Clear
            </button>
          </div>

          {rectangle && (
            <div className={`${isSquareMode ? "bg-purple-500/10 border-purple-500/30" : "bg-cyan-500/10 border-cyan-500/30"} rounded-lg p-2 border`}>
              <p className={`text-[10px] ${isSquareMode ? "text-purple-300" : "text-cyan-300"}`}>
                {isSquareMode ? "Square" : "Rectangle"}: {Math.round(rectangle.width)}×{Math.round(rectangle.height)} at ({Math.round(rectangle.x)}, {Math.round(rectangle.y)})
              </p>
            </div>
          )}
        </div>

        {/* Inpaint Prompt */}
        <div className="space-y-2">
          <label className="text-[11px] text-gray-300 font-semibold">Inpaint Prompt</label>
          <textarea
            value={inpaintPrompt}
            onChange={(e) => setInpaintPrompt(e.target.value)}
            placeholder="Describe what to generate in the rectangle area..."
            className="w-full px-2 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-500 resize-none h-16 focus:outline-none focus:border-cyan-500/50"
          />
        </div>

        {/* Reference Images — only for square mode (GPT-1.5) */}
        {isSquareMode && (
          <div className="space-y-2">
            <label className="text-[11px] text-gray-300 font-semibold">Reference Images (Optional)</label>
            <div className="space-y-2">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  const files = Array.from(e.target.files || []);
                  files.forEach(file => {
                    const reader = new FileReader();
                    reader.onload = (ev) => {
                      const result = ev.target?.result as string;
                      setImageReferenceImages(prev => [...prev, result]);
                    };
                    reader.readAsDataURL(file);
                  });
                }}
                className="hidden"
                id="square-ref-images"
              />
              <label
                htmlFor="square-ref-images"
                className="block w-full px-3 py-2 bg-purple-500/10 hover:bg-purple-500/20 border border-purple-500/30 text-purple-300 rounded-lg text-[11px] font-semibold transition cursor-pointer text-center"
              >
                📎 Add Reference Images
              </label>

              {imageReferenceImages.length > 0 && (
                <div className="grid grid-cols-3 gap-1">
                  {imageReferenceImages.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Reference ${idx + 1}`}
                        className="w-full h-16 object-cover rounded border border-purple-500/30"
                      />
                      <button
                        onClick={() => setImageReferenceImages(prev => (prev as string[]).filter((_, i) => i !== idx))}
                        className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[9px] hover:bg-red-600 opacity-0 group-hover:opacity-100 transition"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {imageReferenceImages.length > 0 && (
                <button
                  onClick={() => setImageReferenceImages([])}
                  className="w-full px-2 py-1 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded text-[10px] transition"
                >
                  Clear All References
                </button>
              )}
            </div>
          </div>
        )}

        {/* Model */}
        <div className="space-y-1.5">
          <label className="text-[11px] text-gray-400 font-semibold uppercase tracking-wide">Model</label>
          <div className="relative">
            <button
              onClick={() => setShowModelDropdown(!showModelDropdown)}
              className="w-full flex items-center justify-between px-4 py-3 bg-[#1a1a24] text-white rounded-lg text-sm font-semibold hover:bg-[#1f1f2a] transition-all duration-200 border border-white/10 hover:border-purple-500/30 group"
            >
              <span>{selectedModel.label}</span>
              <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-purple-400 transition" />
            </button>
            {showModelDropdown && (
              <div className="absolute top-full left-0 mt-2 w-full bg-[#1a1a24] border border-white/10 rounded-lg shadow-xl z-50">
                <div className="p-2">
                  {modelOptions.map((model) => (
                    <button
                      key={model.value}
                      onClick={() => {
                        setInpaintModel(model.value);
                        setShowModelDropdown(false);
                      }}
                      className="w-full px-3 py-2 text-left hover:bg-white/5 rounded-lg transition"
                    >
                      <div className="text-sm font-medium text-white">{model.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{model.sub}</div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          {!isSquareMode && inpaintModel !== "openai-4o" && (
            <p className="text-yellow-500 text-[9px] mt-1">⚠️ Use OpenAI 4o for proper rectangle inpainting</p>
          )}
          {isSquareMode && (
            <p className="text-[9px] text-purple-400/70 mt-1">Square crop → AI generation → Composite</p>
          )}
        </div>

        {/* Generate Button */}
        <button
          onClick={onRunInpaint}
          disabled={!rectangle || !inpaintPrompt.trim() || isInpainting}
          className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
        >
          {isInpainting ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
          ) : (isSquareMode ? "Generate Square Inpaint" : "Generate Rectangle Inpaint")}
        </button>

        {inpaintError && (
          <p className="text-red-400 text-[10px] mt-1">{inpaintError}</p>
        )}
      </div>

      {/* Status */}
      <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${rectangle ? "bg-cyan-400 animate-pulse" : "bg-gray-600"}`} />
          <span className={`text-[11px] font-medium ${rectangle ? "text-cyan-300" : "text-gray-500"}`}>
            {rectangle ? `Rectangle ready: ${Math.round(rectangle.width)}×${Math.round(rectangle.height)}` : "No rectangle selected"}
          </span>
        </div>
      </div>

          </div>
  );
}
