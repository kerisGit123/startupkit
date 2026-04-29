"use client";

import React, { useState } from "react";
import {
  ALargeSmall, Square, Circle, ArrowUpRight, Minus, Image as ImageIcon, Film, Music,
  Eye, EyeOff, Lock, Unlock, Trash2, Copy, ChevronUp, ChevronDown, Layers, ScrollText, Blend,
} from "lucide-react";
import { OverlayLayer, OVERLAY_FONTS, R2_PUBLIC_URL } from "./types";

interface LayerPanelProps {
  overlayLayers: OverlayLayer[];
  setOverlayLayers: React.Dispatch<React.SetStateAction<OverlayLayer[]>>;
  selectedOverlayId: string | null;
  setSelectedOverlayId: (id: string | null) => void;
  currentTime: number;
  totalDur: number;
  bgColor: string;
  setBgColor: (c: string) => void;
  mediaFiles: any[];
  canvasSize: { w: number; h: number };
  onBeforeChange?: () => void;
}

export function LayerPanel({
  overlayLayers, setOverlayLayers, selectedOverlayId, setSelectedOverlayId,
  currentTime, totalDur, bgColor, setBgColor, mediaFiles, canvasSize, onBeforeChange,
}: LayerPanelProps) {
  const CW = canvasSize.w, CH = canvasSize.h;
  const sel = overlayLayers.find(l => l.id === selectedOverlayId);
  const patch = (id: string, p: Partial<OverlayLayer>) => setOverlayLayers(prev => prev.map(l => l.id !== id ? l : { ...l, ...p }));
  const safeTime = isNaN(currentTime) ? 0 : currentTime;
  const safeDur = isNaN(totalDur) ? 0 : totalDur;
  const end = Math.min(safeTime + 5, safeDur || safeTime + 5);
  const [showMediaPicker, setShowMediaPicker] = useState(false);
  const [loadingMedia, setLoadingMedia] = useState(false);

  const add = (layer: OverlayLayer) => { onBeforeChange?.(); setOverlayLayers(p => [...p, layer]); setSelectedOverlayId(layer.id); };
  const moveLayer = (id: string, dir: -1 | 1) => {
    setOverlayLayers(p => {
      const idx = p.findIndex(l => l.id === id);
      const target = idx + dir;
      if (idx < 0 || target < 0 || target >= p.length) return p;
      const arr = [...p]; [arr[idx], arr[target]] = [arr[target], arr[idx]]; return arr;
    });
  };
  const duplicate = (layer: OverlayLayer) => add({ ...layer, id: `ol-${Date.now()}-dup`, x: layer.x + 20, y: layer.y + 20 });

  const btnCls = "w-7 h-7 flex items-center justify-center rounded-md hover:bg-white/10 transition text-(--text-secondary) hover:text-(--text-primary)";
  const inputCls = "w-full px-2 py-1.5 text-[11px] bg-(--bg-primary) border border-(--border-primary) rounded-lg text-(--text-primary) outline-none focus:border-(--accent-blue)/40";
  const labelCls = "text-[9px] text-(--text-tertiary) uppercase tracking-wider font-semibold";

  const layerIcon = (layer: OverlayLayer) => {
    if (layer.type === "text") return <ALargeSmall className="w-3 h-3 text-teal-400/70" />;
    if (layer.type === "scrolling-text") return <ScrollText className="w-3 h-3 text-amber-400/70" />;
    if (layer.type === "transition") return <Blend className="w-3 h-3 text-rose-400/70" />;
    if (layer.type === "video") return <Film className="w-3 h-3 text-violet-400/70" />;
    if (layer.type === "image") return <ImageIcon className="w-3 h-3 text-orange-400/70" />;
    if (layer.shapeType === "circle") return <Circle className="w-3 h-3 text-cyan-400/70" />;
    if (layer.shapeType === "arrow") return <ArrowUpRight className="w-3 h-3 text-cyan-400/70" />;
    if (layer.shapeType === "line") return <Minus className="w-3 h-3 text-cyan-400/70" />;
    return <Square className="w-3 h-3 text-cyan-400/70" />;
  };

  const mediaItems = mediaFiles.filter((f: any) => f.fileType === "video" || f.fileType === "image");

  return (
    <div className="w-56 bg-(--bg-primary) border-l border-(--border-primary) flex flex-col overflow-hidden shrink-0">
      {/* Header */}
      <div className="px-3 py-2.5 border-b border-(--border-primary) flex items-center gap-2">
        <Layers className="w-3.5 h-3.5 text-(--accent-teal)" />
        <span className="text-[13px] font-semibold text-(--text-primary)">Layers</span>
      </div>

      {/* Tool buttons */}
      <div className="px-2 py-2 border-b border-(--border-primary)">
        <div className="flex flex-wrap gap-0.5">
          <button title="Text" onClick={() => add({ id: `ol-${Date.now()}-t`, type: "text", startTime: safeTime, endTime: end, x: Math.round(CW * 0.35), y: 40, w: Math.round(CW * 0.3), h: 60, text: "Label", fontSize: 48, fontColor: "#FFFFFF", backgroundColor: "transparent", borderRadius: 8, fontWeight: "bold" })}
            className={btnCls}><ALargeSmall className="w-3.5 h-3.5" /></button>
          <button title="Rectangle" onClick={() => add({ id: `ol-${Date.now()}-r`, type: "shape", startTime: safeTime, endTime: end, x: 48, y: 48, w: CW - 96, h: CH - 96, shapeType: "rectangle", strokeColor: "#00D4AA", strokeWidth: 4 })}
            className={btnCls}><Square className="w-3.5 h-3.5" /></button>
          <button title="Circle" onClick={() => add({ id: `ol-${Date.now()}-c`, type: "shape", startTime: safeTime, endTime: end, x: Math.round(CW * 0.45), y: Math.round(CH * 0.4), w: 200, h: 200, shapeType: "circle", strokeColor: "#00D4AA", strokeWidth: 3 })}
            className={btnCls}><Circle className="w-3.5 h-3.5" /></button>
          <button title="Arrow" onClick={() => add({ id: `ol-${Date.now()}-a`, type: "shape", startTime: safeTime, endTime: end, x: 400, y: 520, w: 300, h: 4, shapeType: "arrow", strokeColor: "#00D4AA", strokeWidth: 3, endX: 700, endY: 520 })}
            className={btnCls}><ArrowUpRight className="w-3.5 h-3.5" /></button>
          <button title="Line" onClick={() => add({ id: `ol-${Date.now()}-l`, type: "shape", startTime: safeTime, endTime: end, x: 400, y: 560, w: 300, h: 4, shapeType: "line", strokeColor: "#FFFFFF", strokeWidth: 2, endX: 700, endY: 560 })}
            className={btnCls}><Minus className="w-3.5 h-3.5" /></button>
          <button title="Prompt Scroller" onClick={() => add({ id: `ol-${Date.now()}-sc`, type: "scrolling-text", startTime: safeTime, endTime: Math.max(end, safeTime + 10), x: Math.round(CW * 0.1), y: Math.round(CH * 0.1), w: Math.round(CW * 0.8), h: Math.round(CH * 0.8), text: "Enter your script here...", fontSize: 24, fontColor: "#FFFFFF", fontFamily: "Arial", fontWeight: "normal", backgroundColor: "rgba(0,0,0,0.75)", borderRadius: 12, scrollDirection: "up" })}
            className={btnCls}><ScrollText className="w-3.5 h-3.5" /></button>
          <button title="Transition" onClick={() => add({ id: `ol-${Date.now()}-tr`, type: "transition", startTime: Math.max(0, safeTime - 0.5), endTime: safeTime + 0.5, x: 0, y: 0, w: CW, h: CH, transitionType: "crossfade", backgroundColor: "#000000" })}
            className={btnCls}><Blend className="w-3.5 h-3.5" /></button>
          <div className="flex items-center gap-1 px-1.5 rounded-md bg-(--bg-secondary) border border-(--border-primary)" title="Background">
            <span className="text-[9px] text-(--text-tertiary)">BG</span>
            <input type="color" value={bgColor} onChange={(e) => setBgColor(e.target.value)} className="w-4 h-4 rounded cursor-pointer border-none" />
          </div>
        </div>

        {/* Media picker */}
        {mediaItems.length > 0 && (
          <div className="relative mt-1.5">
            <button onClick={() => setShowMediaPicker(!showMediaPicker)}
              className="w-full px-2 py-1.5 text-[11px] bg-(--bg-secondary) border border-(--border-primary) rounded-lg text-violet-400 hover:bg-white/5 transition text-left">
              {loadingMedia ? "Loading..." : "+ Image / Video overlay"}
            </button>
            {showMediaPicker && (
              <div className="absolute left-0 right-0 top-full mt-1 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-50 max-h-48 overflow-y-auto">
                {mediaItems.map((f: any) => {
                  const origSrc = f.r2Key ? `${R2_PUBLIC_URL}/${f.r2Key}` : f.sourceUrl || "";
                  return (
                    <button key={f._id} onClick={async () => {
                      setShowMediaPicker(false);
                      let finalSrc = origSrc;
                      setLoadingMedia(true);
                      try {
                        let blob: Blob | null = null;
                        try {
                          const res = await fetch(origSrc);
                          if (res.ok) blob = await res.blob();
                        } catch { /* CORS — try presigned */ }
                        if (!blob && f.r2Key) {
                          const presignRes = await fetch("/api/storyboard/download-file", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ r2Key: f.r2Key, filename: f.filename || "file" }),
                          });
                          const data = await presignRes.json();
                          if (data.downloadUrl) {
                            const res2 = await fetch(data.downloadUrl);
                            if (res2.ok) blob = await res2.blob();
                          }
                        }
                        if (blob) finalSrc = URL.createObjectURL(blob);
                      } catch (err) {
                        console.error("[LayerPanel] Failed to fetch media:", err);
                      }
                      setLoadingMedia(false);
                      add({ id: `ol-${Date.now()}-m`, type: f.fileType === "image" ? "image" : "video", startTime: safeTime, endTime: end, x: 96, y: 96, w: Math.round(CW * 0.45), h: Math.round(CH * 0.45), src: finalSrc, borderRadius: 16, borderWidth: 4, borderColor: "#00D4AA" });
                    }} className="w-full flex items-center gap-2 px-2.5 py-2 hover:bg-white/5 transition text-left">
                      {f.fileType === "image" ? (
                        <img src={origSrc} className="w-8 h-5 rounded-md object-cover shrink-0 bg-black" alt="" />
                      ) : f.fileType === "video" ? (
                        <div className="w-8 h-5 rounded-md bg-(--bg-primary) flex items-center justify-center shrink-0 border border-(--border-primary)">
                          <Film className="w-3 h-3 text-violet-400/60" />
                        </div>
                      ) : (
                        <div className="w-8 h-5 rounded-md bg-(--bg-primary) flex items-center justify-center shrink-0 border border-(--border-primary)">
                          <Music className="w-3 h-3 text-purple-400/60" />
                        </div>
                      )}
                      <span className="text-[10px] text-(--text-secondary) truncate flex-1">{(f.filename || f.model || "Untitled").slice(0, 22)}</span>
                      <span className="text-[8px] text-(--text-tertiary) uppercase shrink-0">{f.fileType}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Layer list */}
      <div className="flex-1 overflow-y-auto px-1.5 py-1.5 space-y-0.5 min-h-0">
        {overlayLayers.length === 0 ? (
          <div className="text-center py-6 text-[11px] text-(--text-tertiary)">No layers yet</div>
        ) : (
          [...overlayLayers].reverse().map(layer => {
            const isSel = layer.id === selectedOverlayId;
            const label = layer.type === "text" ? (layer.text || "Text").slice(0, 10) :
              layer.type === "video" ? "Video" : layer.type === "image" ? "Image" :
              layer.shapeType || "Shape";
            return (
              <div key={layer.id}
                className={`flex items-center gap-0.5 px-1.5 py-1.5 rounded-lg text-[11px] cursor-pointer transition ${
                  isSel ? "bg-(--accent-teal)/15 text-(--accent-teal) ring-1 ring-(--accent-teal)/30" : "text-(--text-secondary) hover:bg-white/5"
                }`}
                onClick={() => setSelectedOverlayId(layer.id)}>
                <button onClick={(e) => { e.stopPropagation(); patch(layer.id, { locked: !layer.locked }); }}
                  className="shrink-0 p-0.5 hover:text-(--text-primary) transition" title={layer.locked ? "Unlock" : "Lock"}>
                  {layer.locked ? <Lock className="w-2.5 h-2.5 text-red-400/70" /> : <Unlock className="w-2.5 h-2.5 text-(--text-tertiary)" />}
                </button>
                <button onClick={(e) => { e.stopPropagation(); patch(layer.id, { visible: !(layer.visible ?? true) }); }}
                  className="shrink-0 p-0.5 hover:text-(--text-primary) transition">
                  {(layer.visible ?? true) ? <Eye className="w-2.5 h-2.5" /> : <EyeOff className="w-2.5 h-2.5 text-(--text-tertiary)" />}
                </button>
                <span className="shrink-0">{layerIcon(layer)}</span>
                <span className="flex-1 truncate">{label}</span>
                <div className="flex shrink-0">
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, 1); }} className="p-0.5 hover:text-(--text-primary)"><ChevronUp className="w-2.5 h-2.5" /></button>
                  <button onClick={(e) => { e.stopPropagation(); moveLayer(layer.id, -1); }} className="p-0.5 hover:text-(--text-primary)"><ChevronDown className="w-2.5 h-2.5" /></button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Properties panel */}
      {sel && (
        <div className="border-t border-(--border-primary) px-3 py-3 space-y-3 overflow-y-auto max-h-[45%]">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-(--text-primary)">Properties</span>
            <div className="flex gap-1">
              <button onClick={() => duplicate(sel)} className="p-1 text-(--text-tertiary) hover:text-(--accent-teal) transition" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
              <button onClick={() => { onBeforeChange?.(); setOverlayLayers(p => p.filter(l => l.id !== sel.id)); setSelectedOverlayId(null); }}
                className="p-1 text-(--text-tertiary) hover:text-red-400 transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
            </div>
          </div>

          {/* Timing */}
          <div>
            <span className={labelCls}>Time</span>
            <div className="flex gap-1.5 mt-1">
              <input type="number" min={0} step={0.1} value={sel.startTime ?? 0} onChange={(e) => patch(sel.id, { startTime: parseFloat(e.target.value) || 0 })} className={`${inputCls} flex-1`} title="Start" />
              <span className="text-[10px] text-(--text-tertiary) self-center">→</span>
              <input type="number" min={0} step={0.1} value={sel.endTime ?? 5} onChange={(e) => patch(sel.id, { endTime: parseFloat(e.target.value) || 5 })} className={`${inputCls} flex-1`} title="End" />
            </div>
          </div>

          {/* Position */}
          <div>
            <span className={labelCls}>Position</span>
            <div className="grid grid-cols-4 gap-1 mt-1">
              <input type="number" value={Math.round(sel.x) || 0} onChange={(e) => patch(sel.id, { x: parseInt(e.target.value) || 0 })} className={inputCls} />
              <input type="number" value={Math.round(sel.y) || 0} onChange={(e) => patch(sel.id, { y: parseInt(e.target.value) || 0 })} className={inputCls} />
              <input type="number" value={Math.round(sel.w) || 40} onChange={(e) => patch(sel.id, { w: parseInt(e.target.value) || 40 })} className={inputCls} />
              <input type="number" value={Math.round(sel.h) || 20} onChange={(e) => patch(sel.id, { h: parseInt(e.target.value) || 20 })} className={inputCls} />
            </div>
            <div className="flex gap-1 text-[8px] text-(--text-tertiary) mt-0.5"><span className="flex-1 text-center">X</span><span className="flex-1 text-center">Y</span><span className="flex-1 text-center">W</span><span className="flex-1 text-center">H</span></div>
          </div>

          {/* Rotation + Opacity */}
          <div className="flex gap-2">
            <div className="flex-1">
              <span className={labelCls}>Rotation</span>
              <input type="number" min={-360} max={360} value={sel.rotation || 0} onChange={(e) => patch(sel.id, { rotation: parseInt(e.target.value) || 0 })} className={`${inputCls} mt-1`} />
            </div>
            <div className="flex-1">
              <span className={labelCls}>Opacity</span>
              <input type="range" min={0} max={100} value={sel.opacity ?? 100} onChange={(e) => patch(sel.id, { opacity: parseInt(e.target.value) })}
                className="w-full h-1 accent-[var(--accent-teal)] cursor-pointer mt-2.5" />
            </div>
          </div>

          {/* Type-specific properties */}
          {sel.type === "text" && (
            <div className="space-y-2">
              <div><span className={labelCls}>Text</span><input value={sel.text || ""} onChange={(e) => patch(sel.id, { text: e.target.value })} className={`${inputCls} mt-1`} /></div>
              <div className="flex gap-1">
                <select value={sel.fontFamily || "Arial"} onChange={(e) => patch(sel.id, { fontFamily: e.target.value })} className={`${inputCls} flex-1`}>
                  {OVERLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <input type="number" min={12} max={200} value={sel.fontSize || 48} onChange={(e) => patch(sel.id, { fontSize: parseInt(e.target.value) || 48 })} className={`${inputCls} w-14`} />
              </div>
              <select value={sel.fontWeight || "bold"} onChange={(e) => patch(sel.id, { fontWeight: e.target.value })} className={inputCls}>
                <option value="normal">Regular</option><option value="bold">Bold</option><option value="lighter">Light</option>
              </select>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">Text</span><input type="color" value={sel.fontColor || "#FFFFFF"} onChange={(e) => patch(sel.id, { fontColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" /></div>
                <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">BG</span><input type="color" value={sel.backgroundColor === "transparent" ? "#000000" : (sel.backgroundColor || "#000000")} onChange={(e) => patch(sel.id, { backgroundColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" /></div>
                <button onClick={() => patch(sel.id, { backgroundColor: "transparent" })}
                  className={`px-1.5 py-0.5 text-[9px] rounded-md border border-(--border-primary) ${sel.backgroundColor === "transparent" || !sel.backgroundColor ? "bg-(--accent-teal)/20 text-(--accent-teal)" : "text-(--text-tertiary)"}`}>None</button>
              </div>
              <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">Radius</span><input type="number" min={0} max={50} value={sel.borderRadius || 0} onChange={(e) => patch(sel.id, { borderRadius: parseInt(e.target.value) || 0 })} className={`${inputCls} w-14`} /></div>
            </div>
          )}

          {sel.type === "shape" && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-(--text-tertiary)">Stroke</span>
                <input type="color" value={sel.strokeColor || "#00D4AA"} onChange={(e) => patch(sel.id, { strokeColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" />
                <input type="number" min={1} max={20} value={sel.strokeWidth || 4} onChange={(e) => patch(sel.id, { strokeWidth: parseInt(e.target.value) || 4 })} className={`${inputCls} w-12`} />
              </div>
              {(sel.shapeType === "rectangle" || sel.shapeType === "circle") && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-(--text-tertiary)">Fill</span>
                  <input type="color" value={sel.fillColor === "transparent" ? "#000000" : (sel.fillColor || "#000000")} onChange={(e) => patch(sel.id, { fillColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" />
                  <button onClick={() => patch(sel.id, { fillColor: "transparent" })}
                    className={`px-1.5 py-0.5 text-[9px] rounded-md border border-(--border-primary) ${!sel.fillColor || sel.fillColor === "transparent" ? "bg-(--accent-teal)/20 text-(--accent-teal)" : "text-(--text-tertiary)"}`}>None</button>
                </div>
              )}
              {sel.shapeType === "rectangle" && (
                <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">Radius</span><input type="number" min={0} max={100} value={sel.borderRadius || 0} onChange={(e) => patch(sel.id, { borderRadius: parseInt(e.target.value) || 0 })} className={`${inputCls} w-14`} /></div>
              )}
            </div>
          )}

          {(sel.type === "video" || sel.type === "image") && (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-(--text-tertiary)">Border</span>
                <input type="color" value={sel.borderColor || "#00D4AA"} onChange={(e) => patch(sel.id, { borderColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" />
                <input type="number" min={0} max={20} value={sel.borderWidth || 0} onChange={(e) => patch(sel.id, { borderWidth: parseInt(e.target.value) || 0 })} className={`${inputCls} w-12`} />
              </div>
              <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">Radius</span><input type="number" min={0} max={50} value={sel.borderRadius || 0} onChange={(e) => patch(sel.id, { borderRadius: parseInt(e.target.value) || 0 })} className={`${inputCls} w-14`} /></div>
            </div>
          )}

          {sel.type === "scrolling-text" && (
            <div className="space-y-2">
              <div><span className={labelCls}>Script</span>
                <textarea value={sel.text || ""} onChange={(e) => patch(sel.id, { text: e.target.value })}
                  className={`${inputCls} mt-1 resize-none`} rows={5} placeholder="Enter your script text..." />
              </div>
              <div className="flex gap-1">
                <select value={sel.fontFamily || "Arial"} onChange={(e) => patch(sel.id, { fontFamily: e.target.value })} className={`${inputCls} flex-1`}>
                  {OVERLAY_FONTS.map(f => <option key={f} value={f}>{f}</option>)}
                </select>
                <input type="number" min={12} max={120} value={sel.fontSize || 24} onChange={(e) => patch(sel.id, { fontSize: parseInt(e.target.value) || 24 })} className={`${inputCls} w-14`} />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[9px] text-(--text-tertiary)">Direction</span>
                <select value={sel.scrollDirection || "up"} onChange={(e) => patch(sel.id, { scrollDirection: e.target.value as "up" | "down" })} className={`${inputCls} flex-1`}>
                  <option value="up">Scroll Up</option>
                  <option value="down">Scroll Down</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">Text</span><input type="color" value={sel.fontColor || "#FFFFFF"} onChange={(e) => patch(sel.id, { fontColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" /></div>
                <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">BG</span><input type="color" value={sel.backgroundColor === "rgba(0,0,0,0.75)" ? "#000000" : (sel.backgroundColor || "#000000")} onChange={(e) => patch(sel.id, { backgroundColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" /></div>
              </div>
              <div className="flex items-center gap-1"><span className="text-[9px] text-(--text-tertiary)">Radius</span><input type="number" min={0} max={50} value={sel.borderRadius || 0} onChange={(e) => patch(sel.id, { borderRadius: parseInt(e.target.value) || 0 })} className={`${inputCls} w-14`} /></div>
            </div>
          )}
          {sel.type === "transition" && (
            <div className="space-y-2">
              <div>
                <span className={labelCls}>Effect</span>
                <select value={sel.transitionType || "crossfade"} onChange={(e) => patch(sel.id, { transitionType: e.target.value as any })} className={`${inputCls} mt-1`}>
                  <option value="crossfade">Crossfade</option>
                  <option value="fade-color">Fade to Color</option>
                  <option value="slide-left">Slide Left</option>
                  <option value="wipe">Wipe</option>
                  <option value="cross-dissolve">Cross Dissolve</option>
                </select>
              </div>
              {sel.transitionType === "fade-color" && (
                <div className="flex items-center gap-2">
                  <span className="text-[9px] text-(--text-tertiary)">Color</span>
                  <input type="color" value={sel.backgroundColor || "#000000"} onChange={(e) => patch(sel.id, { backgroundColor: e.target.value })} className="w-5 h-5 rounded cursor-pointer border-none" />
                </div>
              )}
              <div className="text-[9px] text-(--text-tertiary) leading-relaxed">
                Position this layer across the boundary between two clips. The transition auto-blends between them.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
