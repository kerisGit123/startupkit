"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";
import { Camera, X, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ── Types ────────────────────────────────────────────────────────────────

export interface VirtualCameraSettings {
  camera: string;
  lens: string;
  focalLength: string;
  aperture: string;
}

export interface CinemaStudioMetadata {
  feature?: string;         // "Cinema Studio"
  camera?: string;          // "ARRI Alexa"
  lens?: string;            // "Anamorphic"
  focalLength?: string;     // "50mm"
  aperture?: string;        // "f/4"
  model?: string;           // AI model ID
  quality?: string;         // "1K" | "2K" | "4K"
  aspectRatio?: string;     // "16:9"
  dimensions?: string;      // "1920x1080"
  prompt?: string;          // Generation prompt
  cameraMotion?: string;    // "dolly-in" | "orbit" etc.
}

interface Option {
  value: string;
  label: string;
  sublabel?: string;
  image?: string;
  promptText: string;
}

interface VirtualCameraStyleProps {
  settings: VirtualCameraSettings;
  onSettingsChange: (settings: VirtualCameraSettings) => void;
  companyId?: string;
  userId?: string;
}

// ── Option Data ──────────────────────────────────────────────────────────

export const CAMERA_OPTIONS: Option[] = [
  { value: "default", label: "Default", sublabel: "", promptText: "" },
  { value: "arri", label: "ARRI Alexa", sublabel: "CINEMA", image: "/storytica/cameras/ARRI.png", promptText: "Shot on ARRI Alexa, cinematic color science, wide dynamic range" },
  { value: "hasselblad", label: "Hasselblad", sublabel: "MEDIUM FORMAT", image: "/storytica/cameras/HASSELBLAD.png", promptText: "Shot on Hasselblad medium format, rich detail, creamy depth" },
  { value: "iphone", label: "iPhone", sublabel: "SMARTPHONE", image: "/storytica/cameras/IPHONE.png", promptText: "Shot on iPhone, computational photography, natural mobile look" },
  { value: "gopro", label: "GoPro", sublabel: "ACTION", image: "/storytica/cameras/GOPRO.png", promptText: "Shot on GoPro, wide-angle action camera, barrel distortion" },
  { value: "drone", label: "DJI Drone", sublabel: "AERIAL", image: "/storytica/cameras/DJI_DRONE.png", promptText: "Aerial drone shot, DJI cinematic look, bird's eye perspective" },
  { value: "film35", label: "Film 35mm", sublabel: "ANALOG", image: "/storytica/cameras/35MM_FILM.png", promptText: "Shot on 35mm film, organic grain, warm analog tones" },
  { value: "polaroid", label: "Polaroid", sublabel: "INSTANT", image: "/storytica/cameras/POLAROID.png", promptText: "Polaroid instant film, faded colors, soft vignette, vintage feel" },
  { value: "vhs", label: "VHS", sublabel: "RETRO", image: "/storytica/cameras/VHS_CAMCORDER.png", promptText: "VHS camcorder look, scan lines, tracking artifacts, retro video" },
];

export const LENS_OPTIONS: Option[] = [
  { value: "none", label: "Default", sublabel: "", promptText: "" },
  { value: "spherical", label: "Spherical", sublabel: "STANDARD", image: "/storytica/cameras/LENS.png", promptText: "spherical lens, natural rendering" },
  { value: "anamorphic", label: "Anamorphic", sublabel: "CINEMATIC", image: "/storytica/cameras/LENS.png", promptText: "anamorphic lens, oval bokeh, horizontal lens flares, widescreen cinematic" },
  { value: "vintage", label: "Vintage Helios", sublabel: "CHARACTER", image: "/storytica/cameras/LENS.png", promptText: "vintage Helios lens, swirly bokeh, warm character" },
  { value: "macro", label: "Macro", sublabel: "CLOSE-UP", image: "/storytica/cameras/LENS.png", promptText: "macro lens, extreme close-up, shallow depth of field" },
  { value: "tiltshift", label: "Tilt-Shift", sublabel: "MINIATURE", image: "/storytica/cameras/LENS.png", promptText: "tilt-shift lens, selective focus, miniature effect" },
  { value: "fisheye", label: "Fisheye", sublabel: "ULTRA-WIDE", image: "/storytica/cameras/LENS.png", promptText: "fisheye lens, ultra-wide barrel distortion" },
];

export const FOCAL_LENGTH_OPTIONS: Option[] = [
  { value: "none", label: "—", promptText: "" },
  { value: "14", label: "14", promptText: "14mm ultra-wide focal length" },
  { value: "24", label: "24", promptText: "24mm wide-angle focal length" },
  { value: "35", label: "35", promptText: "35mm focal length" },
  { value: "50", label: "50", promptText: "50mm standard focal length" },
  { value: "85", label: "85", promptText: "85mm portrait focal length" },
  { value: "135", label: "135", promptText: "135mm telephoto focal length" },
  { value: "200", label: "200", promptText: "200mm telephoto focal length, compressed perspective" },
];

export const APERTURE_OPTIONS: Option[] = [
  { value: "none", label: "Default", sublabel: "", promptText: "" },
  { value: "1.4", label: "f/1.4", sublabel: "SHALLOW", image: "/storytica/cameras/APERTURE.png", promptText: "f/1.4 wide aperture, extremely shallow depth of field, creamy bokeh" },
  { value: "2.0", label: "f/2.0", sublabel: "SOFT", image: "/storytica/cameras/APERTURE.png", promptText: "f/2.0 aperture, shallow depth of field, soft background" },
  { value: "2.8", label: "f/2.8", sublabel: "MODERATE", image: "/storytica/cameras/APERTURE.png", promptText: "f/2.8 aperture, moderate depth of field" },
  { value: "4.0", label: "f/4.0", sublabel: "BALANCED", image: "/storytica/cameras/APERTURE.png", promptText: "f/4.0 aperture, balanced depth of field" },
  { value: "8.0", label: "f/8.0", sublabel: "SHARP", image: "/storytica/cameras/APERTURE.png", promptText: "f/8.0 aperture, deep depth of field, sharp throughout" },
  { value: "16", label: "f/16", sublabel: "DEEP", image: "/storytica/cameras/APERTURE.png", promptText: "f/16 narrow aperture, everything in sharp focus" },
];

// ── Build Prompt Text ────────────────────────────────────────────────────

export function buildCinemaStudioMetadata(
  settings: VirtualCameraSettings,
  opts?: { model?: string; quality?: string; aspectRatio?: string; prompt?: string; cameraMotion?: string }
): CinemaStudioMetadata {
  const cam = CAMERA_OPTIONS.find(o => o.value === settings.camera);
  const lens = LENS_OPTIONS.find(o => o.value === settings.lens);
  const fl = FOCAL_LENGTH_OPTIONS.find(o => o.value === settings.focalLength);
  const ap = APERTURE_OPTIONS.find(o => o.value === settings.aperture);
  const meta: CinemaStudioMetadata = { feature: "Cinema Studio" };
  if (cam && settings.camera !== "default") meta.camera = cam.label;
  if (lens && settings.lens !== "none") meta.lens = lens.label;
  if (fl && settings.focalLength !== "none") meta.focalLength = `${fl.label}mm`;
  if (ap && settings.aperture !== "none") meta.aperture = `f/${ap.value}`;
  if (opts?.model) meta.model = opts.model;
  if (opts?.quality) meta.quality = opts.quality;
  if (opts?.aspectRatio) meta.aspectRatio = opts.aspectRatio;
  if (opts?.prompt) meta.prompt = opts.prompt;
  if (opts?.cameraMotion) meta.cameraMotion = opts.cameraMotion;
  return meta;
}

export function buildCameraPromptText(settings: VirtualCameraSettings): string {
  const parts: string[] = [];
  const cam = CAMERA_OPTIONS.find(o => o.value === settings.camera);
  if (cam?.promptText) parts.push(cam.promptText);
  const lens = LENS_OPTIONS.find(o => o.value === settings.lens);
  if (lens?.promptText) parts.push(lens.promptText);
  const fl = FOCAL_LENGTH_OPTIONS.find(o => o.value === settings.focalLength);
  if (fl?.promptText) parts.push(fl.promptText);
  const ap = APERTURE_OPTIONS.find(o => o.value === settings.aperture);
  if (ap?.promptText) parts.push(ap.promptText);
  return parts.join('. ');
}

// ── Selector Card ────────────────────────────────────────────────────────

type SectionKey = "camera" | "lens" | "focalLength" | "aperture";

function SelectorCard({
  title,
  options,
  selectedValue,
  sectionKey,
  activeSection,
  onToggle,
  onSelect,
}: {
  title: string;
  options: Option[];
  selectedValue: string;
  sectionKey: SectionKey;
  activeSection: SectionKey | null;
  onToggle: (key: SectionKey) => void;
  onSelect: (key: SectionKey, value: string) => void;
}) {
  const selected = options.find(o => o.value === selectedValue) || options[0];
  const isOpen = activeSection === sectionKey;
  const isActive = selectedValue !== "default" && selectedValue !== "none";
  const isFocalLength = sectionKey === "focalLength";

  return (
    <div className="relative flex-1 min-w-0">
      {/* Main card */}
      <button
        onClick={() => onToggle(sectionKey)}
        className={`w-full rounded-xl overflow-hidden transition-all cursor-pointer border ${
          isOpen
            ? "border-(--accent-blue)/50 bg-(--bg-tertiary)"
            : isActive
              ? "border-(--accent-blue)/30 bg-(--accent-blue)/5"
              : "border-(--border-primary) bg-(--bg-tertiary)/60 hover:bg-(--bg-tertiary)"
        }`}
      >
        {/* Section title */}
        <div className="px-2 pt-2 pb-1">
          <span className="text-[9px] font-semibold tracking-wider uppercase text-(--text-tertiary)">
            {title}
          </span>
        </div>

        {/* Image or number */}
        <div className="flex items-center justify-center h-[52px] px-2">
          {isFocalLength ? (
            <span className={`text-[28px] font-light tabular-nums ${
              isActive ? "text-(--text-primary)" : "text-(--text-secondary)"
            }`}>
              {selected.label}
            </span>
          ) : selected.image ? (
            <img
              src={selected.image}
              alt={selected.label}
              className="max-h-[44px] max-w-full object-contain"
              loading="lazy"
            />
          ) : (
            <Camera className="w-6 h-6 text-(--text-tertiary)" strokeWidth={1.5} />
          )}
        </div>

        {/* Sublabel + name */}
        <div className="px-2 pb-2 text-center">
          {selected.sublabel && (
            <div className="text-[8px] font-semibold tracking-wider uppercase text-(--text-tertiary) leading-none mb-0.5">
              {selected.sublabel}
            </div>
          )}
          <div className={`text-[10px] font-medium truncate leading-tight ${
            isActive ? "text-(--text-primary)" : "text-(--text-secondary)"
          }`}>
            {isFocalLength && isActive ? "mm" : selected.label}
          </div>
        </div>
      </button>

      {/* Dropdown picker — opens upward */}
      {isOpen && (
        <div className={`absolute bottom-full mb-2 w-[200px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[60] max-h-[240px] overflow-y-auto py-1.5 ${
          sectionKey === "aperture" ? "right-0" : "left-0"
        }`}>
          {options.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(sectionKey, opt.value)}
              className={`w-full px-3 py-2 text-left transition-colors flex items-center gap-2.5 ${
                selectedValue === opt.value
                  ? "bg-white/8 text-(--text-primary)"
                  : "text-(--text-primary) hover:bg-white/5"
              }`}
            >
              {opt.image && (
                <img src={opt.image} alt="" className="w-7 h-7 object-contain shrink-0" loading="lazy" />
              )}
              <div className="min-w-0 flex-1">
                <div className="text-[13px] font-medium truncate">{opt.label}</div>
                {opt.sublabel && (
                  <div className="text-[10px] text-(--text-tertiary)">{opt.sublabel}</div>
                )}
              </div>
              {selectedValue === opt.value && (
                <div className="w-1.5 h-1.5 rounded-full bg-(--accent-blue) shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Component — Floating Panel ──────────────────────────────────────

export function VirtualCameraStyle({ settings, onSettingsChange, companyId, userId }: VirtualCameraStyleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState<SectionKey | null>(null);
  const [showSaveInput, setShowSaveInput] = useState(false);
  const [saveName, setSaveName] = useState("");
  const [showLoadList, setShowLoadList] = useState(false);

  const createPreset = useMutation(api.storyboard.presets.create);
  const incrementUsage = useMutation(api.storyboard.presets.incrementUsage);
  const cameraPresets = useQuery(
    api.storyboard.presets.list,
    companyId ? { companyId, category: "camera-studio" } : "skip"
  );
  const triggerRef = React.useRef<HTMLButtonElement>(null);

  const hasSettings = settings.camera !== "default" || settings.lens !== "none" || settings.focalLength !== "none" || settings.aperture !== "none";

  const toggleSection = (key: SectionKey) => {
    setActiveSection(activeSection === key ? null : key);
  };

  const selectOption = (key: SectionKey, value: string) => {
    onSettingsChange({ ...settings, [key]: value });
    setActiveSection(null);
  };

  // Summary for trigger button
  const summaryParts: string[] = [];
  if (settings.camera !== "default") summaryParts.push(CAMERA_OPTIONS.find(o => o.value === settings.camera)?.label || "");
  if (settings.lens !== "none") summaryParts.push(LENS_OPTIONS.find(o => o.value === settings.lens)?.label || "");
  if (settings.focalLength !== "none") summaryParts.push(FOCAL_LENGTH_OPTIONS.find(o => o.value === settings.focalLength)?.label + "mm");
  if (settings.aperture !== "none") summaryParts.push(APERTURE_OPTIONS.find(o => o.value === settings.aperture)?.label || "");

  // Panel position — centered above the trigger
  const getPanelStyle = (): React.CSSProperties => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const panelW = 420;
    const gap = 10;
    let left = rect.left + rect.width / 2 - panelW / 2;
    // Clamp to viewport
    left = Math.max(gap, Math.min(left, window.innerWidth - panelW - gap));
    const top = Math.max(gap, rect.top - 220);
    return { left, top, width: panelW };
  };

  return (
    <>
      {/* Trigger button — inline, sits in the prompt actions area */}
      <button
        ref={triggerRef}
        onClick={() => { setIsOpen(!isOpen); setActiveSection(null); }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors cursor-pointer border ${
          isOpen
            ? "text-(--accent-blue) border-(--accent-blue)/30 bg-(--accent-blue)/8"
            : hasSettings
              ? "text-(--accent-blue) border-(--accent-blue)/30 bg-(--accent-blue)/8"
              : "text-(--text-secondary) border-white/8 hover:text-(--text-primary) hover:bg-white/5"
        }`}
        title="Virtual Camera Style"
      >
        <Camera className="w-3 h-3" strokeWidth={1.75} />
        <span>{hasSettings ? summaryParts.filter(Boolean).join(" · ") : "Camera"}</span>
      </button>

      {/* Floating panel (portal) */}
      {isOpen && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-[9990] bg-black/30"
            onClick={() => { setIsOpen(false); setActiveSection(null); }}
          />

          {/* Panel */}
          <div
            className="fixed z-[9991] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl"
            style={getPanelStyle()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 pt-3 pb-2">
              <div className="flex items-center gap-2">
                <Camera className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                <span className="text-[14px] font-semibold text-(--text-primary)">Camera Studio</span>
              </div>
              <div className="flex items-center gap-2">
                {/* Load preset */}
                {companyId && (
                  <button
                    onClick={() => { setShowLoadList(!showLoadList); setShowSaveInput(false); }}
                    className="text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) transition-colors flex items-center gap-1"
                    title="Load camera preset"
                  >
                    <Download className="w-3 h-3" /> Load
                  </button>
                )}
                {/* Save preset */}
                {companyId && userId && (
                  <button
                    onClick={() => {
                      if (!hasSettings) { toast("Change camera settings first"); return; }
                      setShowSaveInput(!showSaveInput); setShowLoadList(false);
                    }}
                    className={`text-[11px] transition-colors flex items-center gap-1 ${hasSettings ? "text-(--text-tertiary) hover:text-(--text-secondary)" : "text-(--text-tertiary)/40 cursor-not-allowed"}`}
                    title="Save camera preset"
                  >
                    <Save className="w-3 h-3" /> Save
                  </button>
                )}
                {hasSettings && (
                  <button
                    onClick={() => onSettingsChange({ camera: "default", lens: "none", focalLength: "none", aperture: "none" })}
                    className="text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) transition-colors"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => { setIsOpen(false); setActiveSection(null); }}
                  className="w-6 h-6 rounded-md flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
                >
                  <X className="w-4 h-4" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Save preset input */}
            {showSaveInput && (
              <div className="px-4 pb-2 flex gap-2">
                <input
                  value={saveName}
                  onChange={(e) => setSaveName(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && saveName.trim() && companyId && userId) {
                      await createPreset({
                        name: saveName.trim(),
                        category: "camera-studio",
                        format: JSON.stringify(settings),
                        prompt: buildCameraPromptText(settings),
                        companyId,
                        userId,
                      });
                      toast.success(`Camera preset "${saveName.trim()}" saved`);
                      setSaveName("");
                      setShowSaveInput(false);
                    }
                  }}
                  placeholder="Preset name..."
                  autoFocus
                  className="flex-1 px-2 py-1 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-xs text-(--text-primary) outline-none focus:border-(--accent-blue)/50"
                />
                <button
                  onClick={async () => {
                    if (saveName.trim() && companyId && userId) {
                      await createPreset({
                        name: saveName.trim(),
                        category: "camera-studio",
                        format: JSON.stringify(settings),
                        prompt: buildCameraPromptText(settings),
                        companyId,
                        userId,
                      });
                      toast.success(`Camera preset "${saveName.trim()}" saved`);
                      setSaveName("");
                      setShowSaveInput(false);
                    }
                  }}
                  disabled={!saveName.trim()}
                  className="px-2 py-1 text-[11px] bg-(--accent-blue) text-white rounded-lg disabled:opacity-40"
                >
                  Save
                </button>
              </div>
            )}

            {/* Load preset list */}
            {showLoadList && (
              <div className="px-4 pb-2">
                <div className="bg-(--bg-primary) border border-(--border-primary) rounded-lg max-h-[120px] overflow-y-auto py-1">
                  {cameraPresets && cameraPresets.length > 0 ? cameraPresets.map((p) => (
                    <button
                      key={p._id}
                      onClick={() => {
                        try {
                          const parsed = JSON.parse(p.format);
                          onSettingsChange(parsed);
                          incrementUsage({ id: p._id });
                          toast.success(`Loaded "${p.name}"`);
                          setShowLoadList(false);
                        } catch { toast.error("Invalid preset"); }
                      }}
                      className="w-full px-3 py-1.5 text-left text-[11px] text-(--text-primary) hover:bg-white/5 transition truncate"
                      title={p.prompt || p.name}
                    >
                      {p.name}
                    </button>
                  )) : (
                    <p className="px-3 py-2 text-[11px] text-(--text-tertiary)">No saved presets</p>
                  )}
                </div>
              </div>
            )}

            {/* 4 selector cards */}
            <div className="px-4 pb-4 pt-1">
              {/* Backdrop for dropdown pickers inside panel */}
              {activeSection && (
                <div className="fixed inset-0 z-[50]" onClick={() => setActiveSection(null)} />
              )}

              <div className="flex gap-2 relative z-[55]">
                <SelectorCard
                  title="Camera"
                  options={CAMERA_OPTIONS}
                  selectedValue={settings.camera}
                  sectionKey="camera"
                  activeSection={activeSection}
                  onToggle={toggleSection}
                  onSelect={selectOption}
                />
                <SelectorCard
                  title="Lens"
                  options={LENS_OPTIONS}
                  selectedValue={settings.lens}
                  sectionKey="lens"
                  activeSection={activeSection}
                  onToggle={toggleSection}
                  onSelect={selectOption}
                />
                <SelectorCard
                  title="Focal Length"
                  options={FOCAL_LENGTH_OPTIONS}
                  selectedValue={settings.focalLength}
                  sectionKey="focalLength"
                  activeSection={activeSection}
                  onToggle={toggleSection}
                  onSelect={selectOption}
                />
                <SelectorCard
                  title="Aperture"
                  options={APERTURE_OPTIONS}
                  selectedValue={settings.aperture}
                  sectionKey="aperture"
                  activeSection={activeSection}
                  onToggle={toggleSection}
                  onSelect={selectOption}
                />
              </div>
            </div>
          </div>
        </>,
        document.body
      )}
    </>
  );
}
