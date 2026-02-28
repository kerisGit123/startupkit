import React from 'react';
import { Paintbrush, Eraser, ImageIcon } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────
interface BrushInpaintPanelProps {
  // Header
  title: string;
  description: string;
  
  // Brush Settings
  isEraser: boolean;
  setIsEraser: (value: boolean) => void;
  maskBrushSize: number;
  setMaskBrushSize: (value: number) => void;
  maskOpacity: number;
  setMaskOpacity: (value: number) => void;
  
  // Canvas State
  canvasState: {
    mask: Array<{ x: number; y: number }>;
  };
  setCanvasState: (value: any) => void;
  
  // Generation
  inpaintPrompt: string;
  setInpaintPrompt: (value: string) => void;
  refImages: string[];
  setRefImages: (value: string[]) => void;
  isInpainting: boolean;
  inpaintError: string | null;
  onGenerate: () => void;
  
  // Results Panel
  generatedImages: string[];
  showGenPanel: boolean;
  setShowGenPanel: (value: boolean) => void;
}

// ── Main Component ─────────────────────────────────────────────────────────────
export function BrushInpaintPanel({
  title,
  description,
  isEraser,
  setIsEraser,
  maskBrushSize,
  setMaskBrushSize,
  maskOpacity,
  setMaskOpacity,
  canvasState,
  setCanvasState,
  inpaintPrompt,
  setInpaintPrompt,
  refImages,
  setRefImages,
  isInpainting,
  inpaintError,
  onGenerate,
  generatedImages,
  showGenPanel,
  setShowGenPanel,
}: BrushInpaintPanelProps) {
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-white font-bold text-sm">{title}</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Brush Controls */}
      <BrushControls
        isEraser={isEraser}
        setIsEraser={setIsEraser}
        maskBrushSize={maskBrushSize}
        setMaskBrushSize={setMaskBrushSize}
        maskOpacity={maskOpacity}
        setMaskOpacity={setMaskOpacity}
        canvasState={canvasState}
        setCanvasState={setCanvasState}
      />

      {/* Generation Settings */}
      <GenerationSettings
        inpaintPrompt={inpaintPrompt}
        setInpaintPrompt={setInpaintPrompt}
        refImages={refImages}
        setRefImages={setRefImages}
        isInpainting={isInpainting}
        inpaintError={inpaintError}
        onGenerate={onGenerate}
        canvasState={canvasState}
      />

      {/* Status */}
      <StatusPanel
        canvasState={canvasState}
        generatedImages={generatedImages}
        showGenPanel={showGenPanel}
        setShowGenPanel={setShowGenPanel}
      />
    </div>
  );
}

// ── Brush Controls Sub-component ───────────────────────────────────────────────
interface BrushControlsProps {
  isEraser: boolean;
  setIsEraser: (value: boolean) => void;
  maskBrushSize: number;
  setMaskBrushSize: (value: number) => void;
  maskOpacity: number;
  setMaskOpacity: (value: number) => void;
  canvasState: {
    mask: Array<{ x: number; y: number }>;
  };
  setCanvasState: (value: any) => void;
}

function BrushControls({
  isEraser,
  setIsEraser,
  maskBrushSize,
  setMaskBrushSize,
  maskOpacity,
  setMaskOpacity,
  canvasState,
  setCanvasState,
}: BrushControlsProps) {
  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
      <div className="space-y-2">
        <label className="text-[11px] text-gray-300 font-semibold">Brush Tool</label>
        
        {/* Brush/Eraser Toggle */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsEraser(false)}
            className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border ${
              !isEraser
                ? "bg-blue-500/20 border-blue-500/40 text-blue-200"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <Paintbrush className="w-3 h-3" />
            Brush
          </button>
          <button
            onClick={() => setIsEraser(true)}
            className={`flex-1 px-3 py-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border ${
              isEraser
                ? "bg-red-500/20 border-red-500/40 text-red-200"
                : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
            }`}
          >
            <Eraser className="w-3 h-3" />
            Eraser
          </button>
        </div>

        {/* Brush Preview */}
        <div className="flex justify-center py-2">
          <div
            className="rounded-full border-2"
            style={{
              width: Math.min(maskBrushSize * 1.5, 64),
              height: Math.min(maskBrushSize * 1.5, 64),
              borderColor: isEraser ? "rgba(239,68,68,0.5)" : "rgba(59,130,246,0.5)",
              backgroundColor: isEraser ? "rgba(239,68,68,0.15)" : "rgba(59,130,246,0.15)",
            }}
          />
        </div>

        {/* Brush Size */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-300 font-semibold">Size</span>
            <span className="text-[11px] text-blue-300 font-mono">{maskBrushSize}px</span>
          </div>
          <input
            type="range"
            min={4}
            max={80}
            value={maskBrushSize}
            onChange={e => setMaskBrushSize(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Brush Opacity */}
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[11px] text-gray-300 font-semibold">Opacity</span>
            <span className="text-[11px] text-gray-400 font-mono">{Math.round(maskOpacity * 100)}%</span>
          </div>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={maskOpacity}
            onChange={e => setMaskOpacity(Number(e.target.value))}
            className="w-full accent-blue-500"
          />
        </div>

        {/* Clear Mask */}
        <button
          onClick={() => setCanvasState(s => ({ ...s, mask: [] }))}
          disabled={canvasState.mask.length === 0}
          className="w-full px-2 py-1.5 bg-white/5 hover:bg-red-500/10 disabled:opacity-30 text-gray-300 hover:text-red-300 rounded-lg text-[11px] font-semibold transition"
        >
          Clear Mask
        </button>
      </div>
    </div>
  );
}

// ── Generation Settings Sub-component ──────────────────────────────────────────
interface GenerationSettingsProps {
  inpaintPrompt: string;
  setInpaintPrompt: (value: string) => void;
  refImages: string[];
  setRefImages: (value: string[]) => void;
  isInpainting: boolean;
  inpaintError: string | null;
  onGenerate: () => void;
  canvasState: {
    mask: Array<{ x: number; y: number }>;
  };
}

function GenerationSettings({
  inpaintPrompt,
  setInpaintPrompt,
  refImages,
  setRefImages,
  isInpainting,
  inpaintError,
  onGenerate,
  canvasState,
}: GenerationSettingsProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setRefImages([result]); // Only allow one image
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
      <div className="space-y-2">
        <label className="text-[11px] text-gray-300 font-semibold">Inpaint Prompt</label>
        <textarea
          value={inpaintPrompt}
          onChange={e => setInpaintPrompt(e.target.value)}
          placeholder='e.g. "Remove logo" or "Add sweat drops"'
          rows={3}
          className="w-full px-2 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none"
        />
      </div>

      {/* Reference Image */}
      <div className="space-y-2">
        <label className="text-[11px] text-gray-300 font-semibold">Reference Image (Optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          id="brush-ref-image"
        />
        <label
          htmlFor="brush-ref-image"
          className="block w-full px-3 py-2 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[11px] font-semibold transition cursor-pointer text-center"
        >
          📎 Add Reference Image
        </label>
        
        {refImages.length > 0 && (
          <div className="relative group">
            <img src={refImages[0]} alt="Reference" className="w-full h-20 object-cover rounded-lg border border-blue-500/30" />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <span className="text-white text-[8px] font-medium">Change</span>
            </div>
            <button
              className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500/80 rounded-full text-white text-[8px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
              onClick={() => setRefImages([])}
            >✕</button>
          </div>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={canvasState.mask.length === 0 || !inpaintPrompt.trim() || isInpainting}
        className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
      >
        {isInpainting ? (
          <>
            <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            Generating...
          </>
        ) : (
          <>
            Generate Faceshift
          </>
        )}
      </button>

      {inpaintError && (
        <p className="text-red-400 text-[10px] mt-1">{inpaintError}</p>
      )}
    </div>
  );
}

// ── Status Panel Sub-component ───────────────────────────────────────────────────
interface StatusPanelProps {
  canvasState: {
    mask: Array<{ x: number; y: number }>;
  };
  generatedImages: string[];
  showGenPanel: boolean;
  setShowGenPanel: (value: boolean) => void;
}

function StatusPanel({
  canvasState,
  generatedImages,
  showGenPanel,
  setShowGenPanel,
}: StatusPanelProps) {
  return (
    <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${canvasState.mask.length > 0 ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`} />
        <span className={`text-[11px] font-medium ${canvasState.mask.length > 0 ? "text-blue-300" : "text-gray-500"}`}>
          {canvasState.mask.length > 0 ? `${canvasState.mask.length} points painted` : "No mask painted"}
        </span>
      </div>
      <button
        onClick={() => setShowGenPanel(v => !v)}
        className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
      >
        <ImageIcon className="w-3 h-3" />
        {showGenPanel ? "Hide Results" : generatedImages.length > 0 ? `View Results (${generatedImages.length})` : "View Panel"}
      </button>
    </div>
  );
}
