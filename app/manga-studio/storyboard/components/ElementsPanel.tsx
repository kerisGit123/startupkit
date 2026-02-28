import React, { useState } from 'react';
import { Eye, EyeOff, Download, Type, Image as ImageIcon, Layers, Trash2 } from 'lucide-react';
import { type CanvasEditorState, type CanvasActiveTool, type CanvasSelection } from '../../shared/CanvasEditor';
import type { BubbleType } from '../../shared/canvas-types';

type CanvasTool = CanvasActiveTool;
type CanvasState = CanvasEditorState;

interface ElementsPanelProps {
  canvasTool: CanvasTool;
  canvasState: CanvasState;
  canvasSelection: CanvasSelection;
  activeShotId: string;
  hiddenIds: Set<string>;
  setHiddenIds: (ids: Set<string>) => void;
  onSelectionChange: (selection: Partial<CanvasSelection>) => void;
  onCanvasStateChange: (state: Partial<CanvasState>) => void;
  generateImageWithElements: () => void;
}

export const ElementsPanel: React.FC<ElementsPanelProps> = ({
  canvasTool,
  canvasState,
  canvasSelection,
  activeShotId,
  hiddenIds,
  setHiddenIds,
  onSelectionChange,
  onCanvasStateChange,
  generateImageWithElements,
}) => {
  const [collapsedCards, setCollapsedCards] = useState<Record<string, boolean>>({});

  // Get elements for current panel
  const panelBubbles = canvasState.bubbles.filter(b => b.panelId === activeShotId && !hiddenIds.has(b.id));
  const panelTexts = canvasState.textElements.filter(t => t.panelId === activeShotId && !hiddenIds.has(t.id));
  const panelAssets = canvasState.assetElements.filter(a => a.panelId === activeShotId && !hiddenIds.has(a.id));

  // Get selected elements
  const selBubble = panelBubbles.find(b => b.id === canvasSelection.selectedBubbleId) ?? null;
  const selText = panelTexts.find(t => t.id === canvasSelection.selectedTextId) ?? null;
  const selAsset = panelAssets.find(a => a.id === canvasSelection.selectedAssetId) ?? null;

  // Update functions
  const updBubble = (patch: Record<string, unknown>) => {
    if (!selBubble) return;
    onCanvasStateChange({
      bubbles: canvasState.bubbles.map(b => b.id === selBubble.id ? { ...b, ...patch } : b)
    });
  };

  const updText = (patch: Record<string, unknown>) => {
    if (!selText) return;
    onCanvasStateChange({
      textElements: canvasState.textElements.map(t => t.id === selText.id ? { ...t, ...patch } : t)
    });
  };

  const updAsset = (patch: Record<string, unknown>) => {
    if (!selAsset) return;
    onCanvasStateChange({
      assetElements: canvasState.assetElements.map(a => a.id === selAsset.id ? { ...a, ...patch } : a)
    });
  };

  const deleteSelected = () => {
    if (selBubble) {
      onCanvasStateChange({
        bubbles: canvasState.bubbles.filter(b => b.id !== selBubble.id)
      });
      onSelectionChange({ selectedBubbleId: null });
    }
    if (selText) {
      onCanvasStateChange({
        textElements: canvasState.textElements.filter(t => t.id !== selText.id)
      });
      onSelectionChange({ selectedTextId: null });
    }
    if (selAsset) {
      onCanvasStateChange({
        assetElements: canvasState.assetElements.filter(a => a.id !== selAsset.id)
      });
      onSelectionChange({ selectedAssetId: null });
    }
  };

  const toggleCard = (id: string) => {
    setCollapsedCards(prev => ({ ...prev, [id]: !prev[id] }));
  };

  if (canvasTool !== "elements") return null;

  return (
    <div className="w-60 border-l border-white/6 flex flex-col bg-[#111118] shrink-0 overflow-y-auto">
      {/* ── Unified Properties Panel ── */}
      {(() => {
        const hasSelection = selBubble || selText || selAsset;
        
        if (!hasSelection) {
          return (
            <div className="p-3 space-y-3">
              <div className="text-center py-8">
                <Layers className="w-8 h-8 text-gray-700 mx-auto mb-2" />
                <p className="text-gray-600 text-xs">No element selected</p>
                <p className="text-gray-700 text-[10px] mt-1">Select an element to edit properties</p>
              </div>
            </div>
          );
        }

        return (
          <div className="p-3 space-y-3">
            {/* Dynamic Header */}
            <div>
              <h3 className="text-white font-bold text-sm">
                {selBubble ? "Bubble Properties" : selText ? "Text Properties" : "Image Properties"}
              </h3>
              <p className="text-[10px] text-gray-500 mt-0.5">
                {selBubble ? "Style and appearance" : selText ? "Text formatting" : "Image settings"}
              </p>
            </div>

            {/* Bubble Properties */}
            {selBubble && (
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-bold">Bubble</span>
                  <button
                    onClick={() => toggleCard('bubble')}
                    className="text-gray-500 hover:text-white transition-colors p-1"
                  >
                    {collapsedCards['bubble'] ? '▼' : '▲'}
                  </button>
                </div>
                
                {!collapsedCards['bubble'] && (
                  <>
                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Text</label>
                      <textarea
                        value={selBubble.text}
                        onChange={(e) => updBubble({ text: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs resize-none h-16 focus:outline-none focus:border-orange-500/30"
                        placeholder="Enter bubble text..."
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Style</label>
                      <select
                        value={selBubble.bubbleType}
                        onChange={(e) => updBubble({ bubbleType: e.target.value as BubbleType })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500/30"
                      >
                        <option value="speech">Speech</option>
                        <option value="thought">Thought</option>
                        <option value="shout">Shout</option>
                        <option value="whisper">Whisper</option>
                        <option value="sfx">SFX</option>
                        <option value="oval">Oval</option>
                        <option value="rect">Rectangle</option>
                        <option value="rectRound">Rounded Rect</option>
                        <option value="speechRough">Rough Speech</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selBubble.fontSize}
                        onChange={(e) => updBubble({ fontSize: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500/30"
                        min="8"
                        max="72"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updBubble({ flippedColors: !selBubble.flippedColors })}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                          selBubble.flippedColors
                            ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {selBubble.flippedColors ? "Inverted" : "Normal"}
                      </button>
                      <button
                        onClick={() => updBubble({ autoFitFont: !selBubble.autoFitFont })}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                          selBubble.autoFitFont
                            ? "bg-blue-500/20 border-blue-500/30 text-blue-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        {selBubble.autoFitFont ? "Auto Fit" : "Fixed Size"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Text Properties */}
            {selText && (
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-bold">Text Element</span>
                  <button
                    onClick={() => toggleCard('text')}
                    className="text-gray-500 hover:text-white transition-colors p-1"
                  >
                    {collapsedCards['text'] ? '▼' : '▲'}
                  </button>
                </div>
                
                {!collapsedCards['text'] && (
                  <>
                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Text Content</label>
                      <textarea
                        value={selText.text}
                        onChange={(e) => updText({ text: e.target.value })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs resize-none h-16 focus:outline-none focus:border-orange-500/30"
                        placeholder="Enter text..."
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Font Size</label>
                      <input
                        type="number"
                        value={selText.fontSize}
                        onChange={(e) => updText({ fontSize: parseInt(e.target.value) })}
                        className="w-full bg-white/5 border border-white/10 rounded-lg px-2 py-1.5 text-white text-xs focus:outline-none focus:border-orange-500/30"
                        min="8"
                        max="120"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Text Color</label>
                      <input
                        type="color"
                        value={selText.color || "#ffffff"}
                        onChange={(e) => updText({ color: e.target.value })}
                        className="w-full h-8 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
                      />
                    </div>

                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Background Color</label>
                      <input
                        type="color"
                        value={selText.backgroundColor || "#000000"}
                        onChange={(e) => updText({ backgroundColor: e.target.value })}
                        className="w-full h-8 bg-white/5 border border-white/10 rounded-lg cursor-pointer"
                      />
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Asset Properties */}
            {selAsset && (
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-white text-xs font-bold">Image Element</span>
                  <button
                    onClick={() => toggleCard('asset')}
                    className="text-gray-500 hover:text-white transition-colors p-1"
                  >
                    {collapsedCards['asset'] ? '▼' : '▲'}
                  </button>
                </div>
                
                {!collapsedCards['asset'] && (
                  <>
                    <div>
                      <label className="text-gray-400 text-[10px] block mb-1">Opacity</label>
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selAsset.opacity ?? 1}
                        onChange={(e) => updAsset({ opacity: parseFloat(e.target.value) })}
                        className="w-full"
                      />
                      <div className="text-gray-500 text-[10px] text-center mt-1">
                        {Math.round((selAsset.opacity ?? 1) * 100)}%
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => updAsset({ flipX: !selAsset.flipX })}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                          selAsset.flipX
                            ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        Flip H
                      </button>
                      <button
                        onClick={() => updAsset({ flipY: !selAsset.flipY })}
                        className={`flex-1 px-2 py-1.5 rounded-lg text-[11px] font-semibold transition ${
                          selAsset.flipY
                            ? "bg-purple-500/20 border-purple-500/30 text-purple-300"
                            : "bg-white/5 border-white/10 text-gray-300 hover:bg-white/10"
                        }`}
                      >
                        Flip V
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* Common Actions */}
            <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white text-xs font-bold">Actions</span>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={deleteSelected}
                  className="w-full px-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-3 h-3" />
                  Delete Element
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Elements List - All Elements in Asset Panel */}
      <div className="space-y-1">
        {/* Elements Header with Hide/Show All */}
        {(() => {
          const allElementIds = [...panelBubbles, ...panelTexts, ...panelAssets].map(o => o.id);
          const allElementsHidden = allElementIds.every(id => hiddenIds.has(id));
          
          return (
            <div className="flex items-center justify-between px-2 py-2 border-b border-white/10">
              <div className="flex items-center gap-2">
                <span className="text-white text-xs font-bold">All Elements</span>
                <span className="text-gray-500 text-[10px] font-mono">
                  {panelBubbles.length + panelTexts.length + panelAssets.length}
                </span>
              </div>
              <button onClick={() => {
                if (allElementsHidden) {
                  // Show all elements - remove all element IDs from hiddenIds
                  setHiddenIds(prev => {
                    const newSet = new Set(prev);
                    allElementIds.forEach(id => newSet.delete(id));
                    return newSet;
                  });
                } else {
                  // Hide all elements - add all element IDs to hiddenIds
                  setHiddenIds(prev => {
                    const newSet = new Set(prev);
                    allElementIds.forEach(id => newSet.add(id));
                    return newSet;
                  });
                }
              }} className="text-gray-500 hover:text-white transition-colors p-1" 
               title={allElementsHidden ? "Show All Elements" : "Hide All Elements"}>
                {allElementsHidden ? (
                  <Eye className="w-3 h-3" />
                ) : (
                  <EyeOff className="w-3 h-3" />
                )}
              </button>
            </div>
          );
        })()}

        {/* Empty State */}
        {panelBubbles.length === 0 && panelTexts.length === 0 && panelAssets.length === 0 && (
          <div className="px-3 py-8 text-center">
            <Layers className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p className="text-gray-600 text-xs">No elements yet</p>
            <p className="text-gray-700 text-[10px] mt-1">Add bubbles, text, or images to get started</p>
          </div>
        )}

        {/* Bubbles List */}
        {panelBubbles.map(bubble => (
          <div
            key={bubble.id}
            onClick={() => onSelectionChange({ selectedBubbleId: bubble.id, selectedTextId: null, selectedAssetId: null })}
            className={`px-3 py-2 cursor-pointer transition-colors border-l-2 ${
              canvasSelection.selectedBubbleId === bubble.id
                ? "bg-orange-500/10 border-orange-500"
                : "hover:bg-white/5 border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-3 h-3 text-blue-400" />
                <span className="text-white text-xs truncate max-w-[120px]">
                  {bubble.text || "Empty bubble"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiddenIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(bubble.id)) {
                        newSet.delete(bubble.id);
                      } else {
                        newSet.add(bubble.id);
                      }
                      return newSet;
                    });
                  }}
                  className="text-gray-500 hover:text-white transition-colors p-0.5"
                  title={hiddenIds.has(bubble.id) ? "Show" : "Hide"}
                >
                  {hiddenIds.has(bubble.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="text-gray-500 text-[10px] mt-0.5">
              {bubble.bubbleType} • {bubble.fontSize}px
            </div>
          </div>
        ))}

        {/* Text Elements List */}
        {panelTexts.map(text => (
          <div
            key={text.id}
            onClick={() => onSelectionChange({ selectedTextId: text.id, selectedBubbleId: null, selectedAssetId: null })}
            className={`px-3 py-2 cursor-pointer transition-colors border-l-2 ${
              canvasSelection.selectedTextId === text.id
                ? "bg-orange-500/10 border-orange-500"
                : "hover:bg-white/5 border-transparent"
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Type className="w-3 h-3 text-green-400" />
                <span className="text-white text-xs truncate max-w-[120px]">
                  {text.text || "Empty text"}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setHiddenIds(prev => {
                      const newSet = new Set(prev);
                      if (newSet.has(text.id)) {
                        newSet.delete(text.id);
                      } else {
                        newSet.add(text.id);
                      }
                      return newSet;
                    });
                  }}
                  className="text-gray-500 hover:text-white transition-colors p-0.5"
                  title={hiddenIds.has(text.id) ? "Show" : "Hide"}
                >
                  {hiddenIds.has(text.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                </button>
              </div>
            </div>
            <div className="text-gray-500 text-[10px] mt-0.5">
              Text element • {text.fontSize}px
            </div>
          </div>
        ))}

        {/* Asset Elements List */}
        {panelAssets.map(asset => {
          const libItem = canvasState.assetLibrary.find(lib => lib.id === asset.assetId);
          return (
            <div
              key={asset.id}
              onClick={() => onSelectionChange({ selectedAssetId: asset.id, selectedBubbleId: null, selectedTextId: null })}
              className={`px-3 py-2 cursor-pointer transition-colors border-l-2 ${
                canvasSelection.selectedAssetId === asset.id
                  ? "bg-orange-500/10 border-orange-500"
                  : "hover:bg-white/5 border-transparent"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ImageIcon className="w-3 h-3 text-purple-400" />
                  <span className="text-white text-xs truncate max-w-[120px]">
                    {libItem?.name || "Image"}
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setHiddenIds(prev => {
                        const newSet = new Set(prev);
                        if (newSet.has(asset.id)) {
                          newSet.delete(asset.id);
                        } else {
                          newSet.add(asset.id);
                        }
                        return newSet;
                      });
                    }}
                    className="text-gray-500 hover:text-white transition-colors p-0.5"
                    title={hiddenIds.has(asset.id) ? "Show" : "Hide"}
                  >
                    {hiddenIds.has(asset.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="text-gray-500 text-[10px] mt-0.5">
                Image • {Math.round(asset.w)}×{Math.round(asset.h)}
              </div>
            </div>
          );
        })}
      </div>

      {/* Combine with Background Button */}
      <div className="p-3 border-t border-white/10">
        <button
          onClick={generateImageWithElements}
          className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-2"
        >
          <Download className="w-3.5 h-3.5" />
          Combine with Background
        </button>
      </div>
    </div>
  );
};
