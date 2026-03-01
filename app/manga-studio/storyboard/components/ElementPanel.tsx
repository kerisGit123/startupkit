"use client";

import React from "react";
import { Upload, Image as ImageIcon, ChevronDown } from "lucide-react";
import type { Bubble, TextElement, AssetElement } from "../../shared/canvas-types";
import type { CanvasSelection, CanvasEditorState } from "../../shared/CanvasEditor";
import type { TailDir, FontFamily } from "../../shared/canvas-types";

interface ElementPanelProps {
  panelBubbles: Bubble[];
  panelTexts: TextElement[];
  panelAssets: AssetElement[];
  canvasSelection: CanvasSelection;
  setCanvasSelection: (selection: CanvasSelection) => void;
  canvasState: CanvasEditorState;
  setCanvasState: React.Dispatch<React.SetStateAction<CanvasEditorState>>;
  assetInputRef: React.RefObject<HTMLInputElement | null>;
  handleAssetUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  generateImageWithElements: () => void;
  backgroundImage: string | null | undefined;
  isInpainting: boolean;
  inpaintError: string | null;
}

export function ElementPanel({
  panelBubbles,
  panelTexts,
  panelAssets,
  canvasSelection,
  setCanvasSelection,
  canvasState,
  setCanvasState,
  assetInputRef,
  handleAssetUpload,
  generateImageWithElements,
  backgroundImage,
  isInpainting,
  inpaintError,
}: ElementPanelProps) {
  // Get selected elements
  const selBubble = panelBubbles.find(b => b.id === canvasSelection.selectedBubbleId) ?? null;
  const selText = panelTexts.find(t => t.id === canvasSelection.selectedTextId) ?? null;
  const selAsset = panelAssets.find(a => a.id === canvasSelection.selectedAssetId) ?? null;

  // Update functions
  const updBubble = (patch: Record<string, unknown>) => {
    if (!selBubble) return;
    setCanvasState(s => ({ ...s, bubbles: s.bubbles.map(b => b.id === selBubble.id ? { ...b, ...patch } : b) }));
  };
  const updText = (patch: Record<string, unknown>) => {
    if (!selText) return;
    setCanvasState(s => ({ ...s, textElements: s.textElements.map(t => t.id === selText.id ? { ...t, ...patch } : t) }));
  };
  const updAsset = (patch: Record<string, unknown>) => {
    if (!selAsset) return;
    setCanvasState(s => ({ ...s, assetElements: s.assetElements.map(a => a.id === selAsset.id ? { ...a, ...patch } : a) }));
  };
  return (
    <div className="p-3 space-y-3">
      {/* Header */}
      <div>
        <h3 className="text-white font-bold text-sm">Elements</h3>
        <p className="text-[10px] text-gray-500 mt-0.5">Create bubbles, text, and upload images</p>
      </div>

      {/* Upload Image Button */}
      <input ref={assetInputRef} type="file" accept="image/*" className="hidden" onChange={handleAssetUpload} />
      <button onClick={() => assetInputRef.current?.click()}
        className="w-full py-2.5 border border-dashed border-white/15 hover:border-orange-500/40 rounded-lg text-[11px] text-gray-500 hover:text-orange-300 transition flex items-center justify-center gap-1.5">
        <Upload className="w-3.5 h-3.5" />
        Upload Image
      </button>

      {/* Elements List */}
      <div className="space-y-1">
        <div className="flex items-center justify-between px-2 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="text-white text-xs font-bold">All Elements</span>
            <span className="text-gray-500 text-[10px] font-mono">{panelBubbles.length + panelTexts.length + panelAssets.length}</span>
          </div>
        </div>

        {/* Bubbles */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] text-emerald-400 font-semibold">Bubbles ({panelBubbles.length})</span>
          </div>
          {panelBubbles.length === 0 && <div className="text-center py-2 text-gray-600 text-[9px] px-2">No bubbles yet</div>}
          {panelBubbles.map((b, i) => (
            <button key={b.id} onClick={() => setCanvasSelection({ selectedBubbleId: b.id, selectedTextId: null, selectedAssetId: null })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${b.id===canvasSelection.selectedBubbleId?"bg-emerald-500/10 border-emerald-500/30 text-emerald-200":"bg-[#13131a] border-white/10 text-gray-300 hover:bg-white/5"}`}>
              <span className="text-[10px] font-semibold">Bubble {i+1}</span>
              <span className="text-[9px] text-gray-500">{b.bubbleType}</span>
            </button>
          ))}
        </div>

        {/* Text */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] text-purple-400 font-semibold">Text ({panelTexts.length})</span>
          </div>
          {panelTexts.length === 0 && <div className="text-center py-2 text-gray-600 text-[9px] px-2">No text yet</div>}
          {panelTexts.map((t, i) => (
            <button key={t.id} onClick={() => setCanvasSelection({ selectedBubbleId: null, selectedTextId: t.id, selectedAssetId: null })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${t.id===canvasSelection.selectedTextId?"bg-purple-500/10 border-purple-500/30 text-purple-200":"bg-[#13131a] border-white/10 text-gray-300 hover:bg-white/5"}`}>
              <span className="text-[10px] font-semibold">Text {i+1}</span>
              <span className="text-[9px] text-gray-500">{t.text?.slice(0, 10)}</span>
            </button>
          ))}
        </div>

        {/* Assets */}
        <div className="space-y-1">
          <div className="flex items-center justify-between px-2 py-1">
            <span className="text-[10px] text-orange-400 font-semibold">Images ({panelAssets.length})</span>
          </div>
          {panelAssets.length === 0 && <div className="text-center py-2 text-gray-600 text-[9px] px-2">No images yet</div>}
          {panelAssets.map((a, i) => (
            <button key={a.id} onClick={() => setCanvasSelection({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: a.id })}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${a.id===canvasSelection.selectedAssetId?"bg-orange-500/10 border-orange-500/30 text-orange-200":"bg-[#13131a] border-white/10 text-gray-300 hover:bg-white/5"}`}>
              <span className="text-[10px] font-semibold">Image {i+1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Combine Button - Always Visible in Elements Panel */}
      <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
        <button
          onClick={() => {
            generateImageWithElements();
          }}
          disabled={!backgroundImage || isInpainting}
          className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2"
          title="Combine all elements with background image">
          {isInpainting ? (
            <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Combining...</>
          ) : (
            <>
              <ImageIcon className="w-3.5 h-3.5 ml-1" />
              <span>Combine with Background</span>
            </>
          )}
        </button>
        {inpaintError && (
          <p className="text-red-400 text-[10px] mt-1">{inpaintError}</p>
        )}
      </div>

      {/* No Selection Message */}
      <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
        <p className="text-[10px] text-gray-500 text-center">Click an element on canvas to edit its properties</p>
      </div>

      {/* Selected Bubble Properties */}
      {selBubble && (
        <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
          <span className="text-[11px] text-emerald-400 font-semibold block">Selected Bubble</span>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-gray-300">Auto-fit font</span>
              <button 
                onClick={() => updBubble({ autoFitFont: !selBubble.autoFitFont })} 
                className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${
                  selBubble.autoFitFont 
                    ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-200" 
                    : "bg-white/5 border-white/10 text-gray-300"
                }`}
              >
                {selBubble.autoFitFont ? "On" : "Off"}
              </button>
            </div>
            {!selBubble.autoFitFont && (
              <div>
                <div className="flex justify-between mb-1">
                  <span className="text-[10px] text-gray-300">Font Size</span>
                  <span className="text-[10px] text-emerald-300 font-mono">{selBubble.fontSize}px</span>
                </div>
                <input 
                  type="range" 
                  min={10} 
                  max={44} 
                  value={selBubble.fontSize} 
                  onChange={e => updBubble({ fontSize: Number(e.target.value) })} 
                  className="w-full accent-emerald-500" 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Text Properties */}
      {selText && (
        <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
          <span className="text-[11px] text-purple-400 font-semibold block">Selected Text</span>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between mb-1">
                <span className="text-[10px] text-gray-300">Font Size</span>
                <span className="text-[10px] text-purple-300 font-mono">{selText.fontSize}px</span>
              </div>
              <input 
                type="range" 
                min={12} 
                max={72} 
                value={selText.fontSize} 
                onChange={e => updText({ fontSize: Number(e.target.value) })} 
                className="w-full accent-purple-500" 
              />
            </div>
            <div>
              <span className="text-[10px] text-gray-300 block mb-1">Weight</span>
              <div className="grid grid-cols-2 gap-1">
                {(["400","700"] as const).map(w => (
                  <button 
                    key={w} 
                    onClick={() => updText({ fontWeight: w })} 
                    className={`py-1 rounded text-[10px] border transition ${
                      selText.fontWeight===w 
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-200" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {w==="400" ? "Normal" : "Bold"}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <span className="text-[10px] text-gray-300 block mb-1">Style</span>
              <div className="grid grid-cols-2 gap-1">
                {(["normal","italic"] as const).map(s => (
                  <button 
                    key={s} 
                    onClick={() => updText({ fontStyle: s })} 
                    className={`py-1 rounded text-[10px] border transition capitalize ${
                      selText.fontStyle===s 
                        ? "bg-purple-500/20 border-purple-500/40 text-purple-200" 
                        : "bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-[10px] text-gray-300 block mb-1">Font Family</label>
              <select 
                value={selText.fontFamily} 
                onChange={e => updText({ fontFamily: e.target.value as FontFamily })} 
                className="w-full bg-[#1a1a24] border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none"
              >
                <option value="Arial">Arial</option>
                <option value="Times New Roman">Times New Roman</option>
                <option value="Comic Sans MS">Comic Sans MS</option>
                <option value="Impact">Impact</option>
                <option value="Verdana">Verdana</option>
                <option value="Georgia">Georgia</option>
                <option value="Noto Sans JP">Noto Sans JP</option>
                <option value="Roboto">Roboto</option>
                <option value="Montserrat">Montserrat</option>
              </select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <label className="text-[10px] text-gray-300 block mb-1">Color</label>
                <input 
                  type="color" 
                  value={selText.color} 
                  onChange={e => updText({ color: e.target.value })} 
                  className="w-full h-7 rounded cursor-pointer border border-white/10" 
                />
              </div>
              <div className="flex-1">
                <label className="text-[10px] text-gray-300 block mb-1">Border px</label>
                <input 
                  type="range" 
                  min={0} 
                  max={10} 
                  value={selText.borderWidth ?? 0} 
                  onChange={e => updText({ borderWidth: Number(e.target.value) })} 
                  className="w-full accent-purple-500 mt-2" 
                />
              </div>
            </div>
            {(selText.borderWidth ?? 0) > 0 && (
              <div>
                <label className="text-[10px] text-gray-300 block mb-1">Border Color</label>
                <input 
                  type="color" 
                  value={selText.borderColor ?? "#000000"} 
                  onChange={e => updText({ borderColor: e.target.value })} 
                  className="w-full h-7 rounded cursor-pointer border border-white/10" 
                />
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selected Asset Properties */}
      {selAsset && (
        <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
          <span className="text-[11px] text-orange-400 font-semibold block">Selected Image</span>
          <div className="text-[10px] text-gray-500">Image properties and transformations will appear here</div>
        </div>
      )}
    </div>
  );
}
