"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { Palette, X, Save, Download, Pipette, Trash2, Wand2 } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { AddImageMenu, type GeneratedImageItem } from "../shared/AddImageMenu";

// ── Types ────────────────────────────────────────────────────────────────

export interface ColorPaletteColors {
  colors: string[]; // up to 6 hex colors
  referenceUrl?: string;
}

interface ColorPalettePickerProps {
  colors: ColorPaletteColors;
  onColorsChange: (colors: ColorPaletteColors) => void;
  companyId?: string;
  userId?: string;
  /** Generated images for AddImageMenu */
  generatedItemImages?: GeneratedImageItem[];
  generatedProjectImages?: GeneratedImageItem[];
  /** AddImageMenu callbacks */
  onR2Click?: () => void;
  canOpenR2?: boolean;
  onCaptureClick?: () => void;
  /** Insert palette text into prompt textarea for user editing */
  onInsertToPrompt?: (text: string) => void;
  /** Current canvas image URL for "Apply to Image" */
  backgroundImage?: string | null;
  /** Callback to set the canvas image after color grading */
  onSetOriginalImage?: (imageUrl: string) => void;
}

// ── Build prompt text from colors ────────────────────────────────────────

export function buildColorPalettePromptText(colors: ColorPaletteColors): string {
  if (!colors.colors.length) return "";
  return `Color graded with dominant palette: ${colors.colors.map(c => c.toUpperCase()).join(", ")}.`;
}

// ── Main Component ──────────────────────────────────────────────────────

export function ColorPalettePicker({
  colors,
  onColorsChange,
  companyId,
  userId,
  generatedItemImages,
  generatedProjectImages,
  onR2Click,
  canOpenR2,
  onCaptureClick,
  onInsertToPrompt,
  backgroundImage,
  onSetOriginalImage,
}: ColorPalettePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [isApplyingGrade, setIsApplyingGrade] = useState(false);
  const [showLoadMenu, setShowLoadMenu] = useState(false);
  const [isEyedropping, setIsEyedropping] = useState(false);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const createPreset = useMutation(api.storyboard.presets.create);
  const removePreset = useMutation(api.storyboard.presets.remove);
  const incrementUsage = useMutation(api.storyboard.presets.incrementUsage);
  const palettePresets = useQuery(
    api.storyboard.presets.list,
    companyId ? { companyId, category: "color-palette" } : "skip"
  );

  const hasColors = colors.colors.length > 0;
  const canAddMore = colors.colors.length < 6;

  // ── Draw image on canvas ──────────────────────────────────────────────

  const drawImageOnCanvas = useCallback(async (src: string) => {
    const renderToCanvas = (img: HTMLImageElement) => {
      imageRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const maxW = canvas.width;
      const maxH = canvas.height;
      const scale = Math.min(maxW / img.width, maxH / img.height);
      const w = img.width * scale;
      const h = img.height * scale;
      const x = (maxW - w) / 2;
      const y = (maxH - h) / 2;

      ctx.fillStyle = "#0a0a0f";
      ctx.fillRect(0, 0, maxW, maxH);
      ctx.drawImage(img, x, y, w, h);
    };

    // For data URLs or blob URLs, load directly
    if (src.startsWith("data:") || src.startsWith("blob:")) {
      const img = new Image();
      img.onload = () => renderToCanvas(img);
      img.src = src;
      return;
    }

    // For external URLs: proxy through our API to bypass CORS
    try {
      const proxyUrl = `/api/image-proxy?url=${encodeURIComponent(src)}`;
      const res = await fetch(proxyUrl);
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);
      const img = new Image();
      img.onload = () => {
        renderToCanvas(img);
        URL.revokeObjectURL(objectUrl);
      };
      img.onerror = () => URL.revokeObjectURL(objectUrl);
      img.src = objectUrl;
    } catch {
      // Proxy failed — try direct load (image shows but picker may not work)
      const img = new Image();
      img.onload = () => renderToCanvas(img);
      img.src = src;
    }
  }, []);

  // Redraw when panel opens with existing reference
  useEffect(() => {
    if (isOpen && colors.referenceUrl) {
      drawImageOnCanvas(colors.referenceUrl);
    }
  }, [isOpen, colors.referenceUrl, drawImageOnCanvas]);

  // ── Handle image selection (from AddImageMenu) ────────────────────────

  const handleImageSelected = useCallback((src: string) => {
    onColorsChange({ ...colors, referenceUrl: src });
    drawImageOnCanvas(src);
  }, [colors, onColorsChange, drawImageOnCanvas]);

  const handleUploadClick = useCallback(() => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;
      // Read as data URL for canvas (no R2 upload needed for color picking)
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        handleImageSelected(dataUrl);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }, [handleImageSelected]);

  // ── Canvas click → eyedrop ────────────────────────────────────────────

  const handleCanvasClick = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;
    if (!canAddMore) {
      toast("All 6 color slots are filled. Clear one first.");
      return;
    }

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    try {
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
      onColorsChange({ ...colors, colors: [...colors.colors, hex] });
    } catch {
      toast.error("Cannot pick colors from this image (CORS). Try using Capture or Generated instead.");
    }
  }, [colors, onColorsChange, canAddMore]);

  // ── Canvas hover → preview color ──────────────────────────────────────

  const handleCanvasMove = useCallback((e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || !imageRef.current) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    try {
      const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
      const hex = `#${pixel[0].toString(16).padStart(2, "0")}${pixel[1].toString(16).padStart(2, "0")}${pixel[2].toString(16).padStart(2, "0")}`;
      setHoveredColor(hex);
    } catch {
      // Tainted canvas — CORS image, can't read pixels
      setHoveredColor(null);
    }
  }, []);

  // ── Remove a color slot ───────────────────────────────────────────────

  const removeColor = useCallback((index: number) => {
    const newColors = colors.colors.filter((_, i) => i !== index);
    onColorsChange({ ...colors, colors: newColors });
  }, [colors, onColorsChange]);

  // ── Replace a color via native picker ─────────────────────────────────

  const replaceColor = useCallback((index: number, hex: string) => {
    const newColors = [...colors.colors];
    newColors[index] = hex;
    onColorsChange({ ...colors, colors: newColors });
  }, [colors, onColorsChange]);

  // ── Save preset ───────────────────────────────────────────────────────

  const handleSave = useCallback(async () => {
    if (!saveName.trim() || !companyId || !userId || !hasColors) return;
    await createPreset({
      name: saveName.trim(),
      category: "color-palette",
      format: JSON.stringify(colors.colors),
      prompt: colors.colors.join(", "),
      thumbnailUrl: colors.referenceUrl || undefined,
      companyId,
      userId,
    });
    toast.success(`Palette "${saveName.trim()}" saved`);
    setSaveName("");
    setShowSaveInput(false);
  }, [saveName, companyId, userId, hasColors, colors, createPreset]);

  // ── Load preset ───────────────────────────────────────────────────────

  const handleLoad = useCallback((preset: any) => {
    try {
      const parsed = JSON.parse(preset.format);
      onColorsChange({
        colors: Array.isArray(parsed) ? parsed : [],
        referenceUrl: preset.thumbnailUrl || undefined,
      });
      if (preset.thumbnailUrl) {
        drawImageOnCanvas(preset.thumbnailUrl);
      }
      incrementUsage({ id: preset._id });
      toast.success(`Loaded "${preset.name}"`);
      setShowLoadMenu(false);
    } catch {
      toast.error("Invalid palette preset");
    }
  }, [onColorsChange, drawImageOnCanvas, incrementUsage]);

  // ── Clear all ─────────────────────────────────────────────────────────

  const handleClear = useCallback(() => {
    onColorsChange({ colors: [], referenceUrl: undefined });
    imageRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.fillStyle = "#0a0a0f";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, [onColorsChange]);

  // ── Panel position ────────────────────────────────────────────────────

  const getPanelStyle = (): React.CSSProperties => {
    const panelW = 360;
    const gap = 6;
    const pillBar = document.querySelector('[data-settings-pill]') as HTMLElement | null;
    const mainPanel = document.querySelector('[data-main-panel]') as HTMLElement | null;
    const anchor = pillBar || mainPanel || triggerRef.current;
    if (!anchor) return {};
    const rect = anchor.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - panelW / 2;
    left = Math.max(gap, Math.min(left, window.innerWidth - panelW - gap));
    const bottom = window.innerHeight - rect.top + gap;
    return { left, bottom, width: panelW };
  };

  // ── Summary for trigger button ────────────────────────────────────────

  const summary = hasColors ? `${colors.colors.length} colors` : "Palette";

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => { setIsOpen(!isOpen); setShowLoadMenu(false); setShowSaveInput(false); }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors cursor-pointer border ${
          isOpen
            ? "text-rose-400 border-rose-400/30 bg-rose-400/8"
            : hasColors
              ? "text-rose-400 border-rose-400/30 bg-rose-400/8"
              : "text-(--text-secondary) border-white/8 hover:text-(--text-primary) hover:bg-white/5"
        }`}
        title="Color Palette"
      >
        <Palette className="w-3 h-3" strokeWidth={1.75} />
        {hasColors && (
          <div className="flex items-center gap-0.5 mr-0.5">
            {colors.colors.map((c, i) => (
              <div
                key={i}
                className="w-2.5 h-2.5 rounded-full border border-white/20"
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        )}
        <span>{summary}</span>
      </button>

      {/* Floating panel (portal) */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9990] bg-black/30"
            onClick={() => { setIsOpen(false); setShowLoadMenu(false); setShowSaveInput(false); }}
          />

          {/* Panel */}
          <div
            className="fixed z-[9991] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl"
            style={getPanelStyle()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-rose-400" strokeWidth={1.75} />
                <span className="text-[14px] font-semibold text-(--text-primary)">Color Palette</span>
              </div>
              <div className="flex items-center gap-2">
                {hasColors && (
                  <button
                    onClick={handleClear}
                    className="text-[11px] text-(--text-tertiary) hover:text-red-400 transition-colors flex items-center gap-1"
                    title="Clear all colors"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
                <button
                  onClick={() => { setIsOpen(false); setShowLoadMenu(false); setShowSaveInput(false); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Reference image canvas */}
            <div className="px-4 pb-2">
              {colors.referenceUrl ? (
                <div className="relative group">
                  <canvas
                    ref={canvasRef}
                    width={660}
                    height={400}
                    onClick={handleCanvasClick}
                    onMouseMove={handleCanvasMove}
                    onMouseLeave={() => setHoveredColor(null)}
                    className="w-full h-[180px] rounded-lg border border-(--border-primary) bg-[#0a0a0f] object-contain"
                    style={{ cursor: canAddMore ? "crosshair" : "not-allowed" }}
                  />
                  {/* Hover color preview */}
                  {hoveredColor && canAddMore && (
                    <div className="absolute top-2 right-2 flex items-center gap-1.5 px-2 py-1 bg-black/80 rounded-md backdrop-blur-sm">
                      <div
                        className="w-4 h-4 rounded border border-white/30"
                        style={{ backgroundColor: hoveredColor }}
                      />
                      <span className="text-[11px] text-white font-mono">{hoveredColor.toUpperCase()}</span>
                    </div>
                  )}
                  {/* Hint overlay */}
                  {canAddMore && (
                    <div className="absolute bottom-2 left-2 flex items-center gap-1 px-2 py-1 bg-black/60 rounded-md text-[10px] text-gray-300 pointer-events-none">
                      <Pipette className="w-3 h-3" /> Click to pick color
                    </div>
                  )}
                  {/* Remove image */}
                  <button
                    onClick={() => {
                      onColorsChange({ ...colors, referenceUrl: undefined });
                      imageRef.current = null;
                      const canvas = canvasRef.current;
                      if (canvas) {
                        const ctx = canvas.getContext("2d");
                        if (ctx) { ctx.fillStyle = "#0a0a0f"; ctx.fillRect(0, 0, canvas.width, canvas.height); }
                      }
                    }}
                    className="absolute top-2 left-2 w-5 h-5 bg-red-500/80 hover:bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <AddImageMenu
                    label="Add Image"
                    hideUpload
                    onUploadClick={() => {}}
                    onR2Click={onR2Click}
                    canOpenR2={canOpenR2}
                    onCaptureClick={onCaptureClick}
                    generatedItemImages={generatedItemImages}
                    generatedProjectImages={generatedProjectImages}
                    onSelectGeneratedImage={handleImageSelected}
                  />
                  <span className="text-[11px] text-(--text-tertiary)">Upload or pick an image to extract colors from</span>
                </div>
              )}
              {/* Hidden canvas for when no image is shown yet */}
              {!colors.referenceUrl && (
                <canvas ref={canvasRef} width={660} height={400} className="hidden" />
              )}
            </div>

            {/* 6 color slots */}
            <div className="px-4 pb-3">
              <div className="flex items-center gap-1.5 mb-2">
                <span className="text-[11px] text-(--text-tertiary) font-medium">
                  Colors ({colors.colors.length}/6)
                </span>
              </div>
              <div className="flex items-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => {
                  const color = colors.colors[i];
                  if (color) {
                    return (
                      <div key={i} className="relative group">
                        {/* Color swatch — click opens native picker */}
                        <label className="cursor-pointer block">
                          <div
                            className="w-11 h-11 rounded-lg border-2 border-white/20 hover:border-white/40 transition-colors shadow-md"
                            style={{ backgroundColor: color }}
                            title={`${color.toUpperCase()} — Click to change`}
                          />
                          <input
                            type="color"
                            value={color}
                            onChange={(e) => replaceColor(i, e.target.value)}
                            className="sr-only"
                          />
                        </label>
                        {/* Hex label */}
                        <div className="text-[8px] text-(--text-tertiary) text-center mt-0.5 font-mono uppercase">
                          {color.slice(1)}
                        </div>
                        {/* Remove button */}
                        <button
                          onClick={() => removeColor(i)}
                          className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition z-10"
                        >
                          <X className="w-2 h-2 text-white" />
                        </button>
                      </div>
                    );
                  }
                  // Empty slot
                  return (
                    <div key={i} className="flex flex-col items-center">
                      <div className="w-11 h-11 rounded-lg border-2 border-dashed border-white/10 flex items-center justify-center text-(--text-tertiary)">
                        <span className="text-[14px] font-light">+</span>
                      </div>
                      <div className="text-[8px] text-(--text-tertiary) text-center mt-0.5">&nbsp;</div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Footer — Load / Save */}
            <div className="relative px-4 pb-3 flex items-center gap-2">
              {/* Load dropup */}
              <div className="relative">
                <button
                  onClick={() => { setShowLoadMenu(!showLoadMenu); setShowSaveInput(false); }}
                  className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors border border-(--border-primary)"
                >
                  <Download className="w-3 h-3" /> Load
                </button>

                {/* Load dropup menu */}
                {showLoadMenu && (
                  <div className="absolute bottom-full mb-1 left-0 w-[280px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[60] max-h-[200px] overflow-y-auto py-1">
                    {palettePresets && palettePresets.length > 0 ? palettePresets.map((p) => {
                      let presetColors: string[] = [];
                      try { presetColors = JSON.parse(p.format); } catch {}
                      return (
                        <div
                          key={p._id}
                          className="flex items-center gap-2 px-3 py-2 hover:bg-white/5 transition cursor-pointer group"
                          onClick={() => handleLoad(p)}
                        >
                          {/* Thumbnail */}
                          {p.thumbnailUrl ? (
                            <img src={p.thumbnailUrl} alt="" className="w-8 h-8 rounded object-cover shrink-0" />
                          ) : (
                            <div className="w-8 h-8 rounded bg-(--bg-tertiary) flex items-center justify-center shrink-0">
                              <Palette className="w-3.5 h-3.5 text-(--text-tertiary)" />
                            </div>
                          )}
                          {/* Name + color dots */}
                          <div className="flex-1 min-w-0">
                            <div className="text-[11px] font-medium text-(--text-primary) truncate">{p.name}</div>
                            <div className="flex items-center gap-0.5 mt-0.5">
                              {Array.isArray(presetColors) && presetColors.map((c: string, ci: number) => (
                                <div
                                  key={ci}
                                  className="w-3 h-3 rounded-full border border-white/15"
                                  style={{ backgroundColor: c }}
                                />
                              ))}
                            </div>
                          </div>
                          {/* Delete */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              removePreset({ id: p._id });
                              toast.success("Deleted");
                            }}
                            className="w-5 h-5 rounded flex items-center justify-center text-(--text-tertiary) hover:text-red-400 opacity-0 group-hover:opacity-100 transition shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    }) : (
                      <p className="px-3 py-3 text-[11px] text-(--text-tertiary) text-center">No saved palettes</p>
                    )}
                  </div>
                )}
              </div>

              {/* Save */}
              {showSaveInput ? (
                <div className="flex-1 flex gap-1.5">
                  <input
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") setShowSaveInput(false); }}
                    placeholder="Palette name..."
                    autoFocus
                    className="flex-1 px-2 py-1.5 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-[11px] text-(--text-primary) outline-none focus:border-rose-400/50"
                  />
                  <button
                    onClick={handleSave}
                    disabled={!saveName.trim() || !hasColors}
                    className="px-2.5 py-1.5 text-[11px] bg-rose-500 hover:bg-rose-600 text-white rounded-lg disabled:opacity-40 transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setShowSaveInput(false)}
                    className="px-2 py-1.5 text-[11px] text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    if (!hasColors) { toast("Pick some colors first"); return; }
                    setShowSaveInput(true); setShowLoadMenu(false);
                  }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] transition-colors border border-(--border-primary) ${
                    hasColors
                      ? "text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5"
                      : "text-(--text-tertiary)/40 cursor-not-allowed"
                  }`}
                >
                  <Save className="w-3 h-3" /> Save Preset
                </button>
              )}
            </div>

            {/* Preview of what will be appended */}
            {hasColors && (
              <div className="px-4 pb-3 flex items-stretch gap-1.5">
                <div className="flex-1 min-w-0 px-2.5 py-1.5 bg-(--bg-primary) rounded-lg border border-(--border-primary)">
                  <span className="text-[10px] text-(--text-tertiary)">Will append: </span>
                  <span className="text-[10px] text-rose-300 font-mono">
                    {buildColorPalettePromptText(colors)}
                  </span>
                </div>
                {onInsertToPrompt && (
                  <button
                    onClick={() => {
                      const text = buildColorPalettePromptText(colors);
                      if (text) {
                        onInsertToPrompt(text);
                        onColorsChange({ colors: [] });
                        setIsOpen(false);
                      }
                    }}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-medium bg-rose-500/15 border border-rose-500/30 text-rose-300 hover:bg-rose-500/25 transition-colors whitespace-nowrap"
                    title="Insert into prompt textarea for editing"
                  >
                    Send to Prompt
                  </button>
                )}
                {backgroundImage && onSetOriginalImage && hasColors && (
                  <button
                    onClick={async () => {
                      if (isApplyingGrade) return;
                      setIsApplyingGrade(true);
                      try {
                        const palettePrompt = buildColorPalettePromptText(colors);
                        const response = await fetch("/api/inpaint", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            image: backgroundImage,
                            prompt: `Apply this color grading to the image, preserving all content: ${palettePrompt}`,
                            model: "qwen-z-image",
                          }),
                        });
                        if (!response.ok) throw new Error("Color grading failed");
                        const result = await response.json();
                        const resultImage = result.image ?? result.url ?? result.output;
                        if (resultImage) {
                          onSetOriginalImage(resultImage);
                          toast.success("Color grade applied!");
                        }
                      } catch (err) {
                        toast.error("Failed to apply color grade.");
                        console.error("[color-grade]", err);
                      } finally {
                        setIsApplyingGrade(false);
                      }
                    }}
                    disabled={isApplyingGrade}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-medium bg-purple-500/15 border border-purple-500/30 text-purple-300 hover:bg-purple-500/25 transition-colors whitespace-nowrap disabled:opacity-50"
                    title="Apply color palette to current image via AI"
                  >
                    {isApplyingGrade ? (
                      <span className="flex items-center gap-1">
                        <span className="w-2.5 h-2.5 border border-purple-400/30 border-t-purple-400 rounded-full animate-spin" />
                        Applying...
                      </span>
                    ) : (
                      <span className="flex items-center gap-1">
                        <Wand2 className="w-3 h-3" />
                        Apply to Image
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}
          </div>
        </>,
        document.body
      )}
    </>
  );
}
