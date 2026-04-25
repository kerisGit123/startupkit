"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";
import { Crosshair, X, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, Check, Save, Download } from "lucide-react";
import { toast } from "sonner";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

// ── Types ────────────────────────────────────────────────────────────────

export interface CameraAngleSettings {
  rotation: number;   // 0 to 360 (horizontal orbit around subject)
  tilt: number;       // -90 to 90 (vertical angle)
  zoom: number;       // 0 to 100 (close-up to wide)
}

export const DEFAULT_ANGLE_SETTINGS: CameraAngleSettings = {
  rotation: 0,
  tilt: 0,
  zoom: 0,
};

interface CameraAnglePickerProps {
  settings: CameraAngleSettings;
  onSettingsChange: (settings: CameraAngleSettings) => void;
  /** Optional subject thumbnail URL shown inside the sphere */
  subjectImageUrl?: string;
  companyId?: string;
  userId?: string;
  /** Insert angle text into prompt textarea for user editing */
  onInsertToPrompt?: (text: string) => void;
}

// ── Prompt Text Builder ──────────────────────────────────────────────────

function getTiltText(tilt: number): string {
  if (tilt >= 75) return "bird's eye view, overhead shot, looking straight down";
  if (tilt >= 50) return "high angle shot, looking down at subject";
  if (tilt >= 20) return "slightly high angle, looking down";
  if (tilt > -20) return "eye level shot";
  if (tilt > -50) return "low angle shot, looking up at subject";
  if (tilt > -75) return "very low angle, looking up";
  return "worm's eye view, extreme low angle, looking straight up";
}

function getRotationText(rotation: number): string {
  // Normalize to 0-360
  const r = ((rotation % 360) + 360) % 360;
  if (r <= 15 || r >= 345) return "front view, facing camera";
  if (r <= 75) return "three-quarter view";
  if (r <= 105) return "side profile view";
  if (r <= 165) return "three-quarter rear view";
  if (r <= 195) return "rear view, from behind";
  if (r <= 255) return "three-quarter rear view";
  if (r <= 285) return "side profile view";
  return "three-quarter view";
}

function getZoomText(zoom: number): string {
  if (zoom <= -60) return "extreme wide shot, environmental, establishing shot";
  if (zoom <= -30) return "wide shot, full body";
  if (zoom <= -10) return "medium wide shot";
  if (zoom < 10) return "";
  if (zoom <= 30) return "medium close-up";
  if (zoom <= 60) return "close-up shot, tight framing";
  return "extreme close-up, macro framing";
}

export function buildAnglePromptText(settings: CameraAngleSettings): string {
  const isDefault =
    settings.rotation === 0 &&
    settings.tilt === 0 &&
    settings.zoom === 0;
  if (isDefault) return "";

  const parts: string[] = [];

  if (Math.abs(settings.tilt) > 10) {
    parts.push(getTiltText(settings.tilt));
  }
  const r = ((settings.rotation % 360) + 360) % 360;
  if (r > 15 && r < 345) {
    parts.push(getRotationText(settings.rotation));
  }
  const zoomText = getZoomText(settings.zoom);
  if (zoomText) parts.push(zoomText);

  return parts.join(", ");
}

// ── Preset Angles ────────────────────────────────────────────────────────

interface Preset {
  label: string;
  icon: string;
  settings: CameraAngleSettings;
}

const PRESETS: Preset[] = [
  { label: "Front", icon: "👤", settings: { rotation: 0, tilt: 0, zoom: 0 } },
  { label: "3/4 View", icon: "◩", settings: { rotation: 45, tilt: 10, zoom: 0 } },
  { label: "Profile", icon: "👤", settings: { rotation: 90, tilt: 0, zoom: 0 } },
  { label: "Back", icon: "🔙", settings: { rotation: 180, tilt: 0, zoom: 0 } },
  { label: "Bird's Eye", icon: "🦅", settings: { rotation: 0, tilt: 80, zoom: -20 } },
  { label: "Low Angle", icon: "⬆", settings: { rotation: 0, tilt: -40, zoom: 0 } },
  { label: "Worm's Eye", icon: "🐛", settings: { rotation: 0, tilt: -80, zoom: -10 } },
  { label: "Over Shoulder", icon: "🎬", settings: { rotation: 150, tilt: 15, zoom: 20 } },
  { label: "Close-Up", icon: "🔍", settings: { rotation: 0, tilt: 0, zoom: 70 } },
  { label: "Wide", icon: "🏞", settings: { rotation: 0, tilt: 5, zoom: -70 } },
  { label: "High 3/4", icon: "📐", settings: { rotation: 45, tilt: 50, zoom: -10 } },
  { label: "Dutch Low", icon: "🎥", settings: { rotation: 30, tilt: -25, zoom: 10 } },
];

// ── Wireframe Globe Canvas (Higgsfield-style) ────────────────────────────

// ── 3D Projection Helpers ────────────────────────────────────────────────
// View the sphere from above at ~25° so top/bottom/front/back are obvious

const VIEW_ELEV = 25; // degrees — how far above we look at the sphere
const VIEW_ELEV_RAD = (VIEW_ELEV * Math.PI) / 180;
const COS_VIEW = Math.cos(VIEW_ELEV_RAD);
const SIN_VIEW = Math.sin(VIEW_ELEV_RAD);

/** Project a 3D point on a unit sphere to 2D canvas coords */
function project3D(
  azDeg: number,
  elDeg: number,
  cx: number,
  cy: number,
  r: number
): { x: number; y: number; z: number } {
  const az = (azDeg * Math.PI) / 180;
  const el = (elDeg * Math.PI) / 180;
  // 3D position on unit sphere
  const x3 = Math.sin(az) * Math.cos(el);
  const y3 = Math.sin(el);
  const z3 = Math.cos(az) * Math.cos(el);
  // Rotate around X axis by -VIEW_ELEV (look from above)
  const y3r = y3 * COS_VIEW - z3 * SIN_VIEW;
  const z3r = y3 * SIN_VIEW + z3 * COS_VIEW;
  return {
    x: cx + x3 * r,
    y: cy - y3r * r,
    z: z3r, // positive = facing viewer, negative = behind
  };
}

function WireframeGlobe({
  rotation,
  tilt,
  zoom,
  subjectImageUrl,
  onChange,
}: {
  rotation: number;
  tilt: number;
  zoom: number;
  subjectImageUrl?: string;
  onChange: (rotation: number, tilt: number) => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const draggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const sizeRef = useRef({ w: 0, h: 0, cx: 0, cy: 0, r: 0 });
  const imgRef = useRef<HTMLImageElement | null>(null);
  const imgLoadedRef = useRef(false);

  // Load subject image
  useEffect(() => {
    if (!subjectImageUrl) {
      imgRef.current = null;
      imgLoadedRef.current = false;
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      imgRef.current = img;
      imgLoadedRef.current = true;
      draw();
    };
    img.src = subjectImageUrl;
  }, [subjectImageUrl]);

  const draw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.scale(dpr, dpr);

    const cx = w / 2;
    const cy = h / 2;
    const r = Math.min(w, h) / 2 - 20;
    sizeRef.current = { w, h, cx, cy, r };

    ctx.clearRect(0, 0, w, h);

    // ── Helper: draw a 3D circle (latitude or longitude) as polyline ──
    function drawWireCircle(
      points: { x: number; y: number; z: number }[],
      frontAlpha: number,
      backAlpha: number
    ) {
      // Split into front/back segments for depth-based opacity
      for (let i = 0; i < points.length - 1; i++) {
        const p0 = points[i];
        const p1 = points[i + 1];
        const avgZ = (p0.z + p1.z) / 2;
        const alpha = avgZ >= 0
          ? frontAlpha
          : backAlpha;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(255,255,255,${alpha})`;
        ctx.lineWidth = avgZ >= 0 ? 0.7 : 0.4;
        ctx.stroke();
      }
    }

    // ── Wireframe: Latitude rings ──
    for (const lat of [-75, -60, -45, -30, -15, 0, 15, 30, 45, 60, 75]) {
      const pts: { x: number; y: number; z: number }[] = [];
      for (let a = 0; a <= 360; a += 5) {
        pts.push(project3D(a, lat, cx, cy, r));
      }
      drawWireCircle(pts, 0.1, 0.04);
    }

    // ── Wireframe: Longitude meridians ──
    for (let lon = 0; lon < 180; lon += 15) {
      const pts: { x: number; y: number; z: number }[] = [];
      for (let el = -90; el <= 90; el += 5) {
        pts.push(project3D(lon, el, cx, cy, r));
      }
      drawWireCircle(pts, 0.1, 0.04);
      // Opposite side
      const pts2: { x: number; y: number; z: number }[] = [];
      for (let el = -90; el <= 90; el += 5) {
        pts2.push(project3D(lon + 180, el, cx, cy, r));
      }
      drawWireCircle(pts2, 0.1, 0.04);
    }

    // ── Outer silhouette circle (always visible) ──
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.strokeStyle = "rgba(255,255,255,0.12)";
    ctx.lineWidth = 1;
    ctx.stroke();

    // ── Subject thumbnail in center ──
    if (imgRef.current && imgLoadedRef.current) {
      const img = imgRef.current;
      const thumbSize = r * 0.5;
      const aspect = img.width / img.height;
      let tw: number, th: number;
      if (aspect > 1) {
        tw = thumbSize;
        th = thumbSize / aspect;
      } else {
        th = thumbSize;
        tw = thumbSize * aspect;
      }
      // Shift thumbnail slightly up (since we view from above)
      const thumbOffY = -r * 0.04;
      ctx.save();
      const rx = cx - tw / 2;
      const ry = cy - th / 2 + thumbOffY;
      const br = 6;
      ctx.beginPath();
      ctx.roundRect(rx, ry, tw, th, br);
      ctx.clip();
      ctx.globalAlpha = 0.85;
      ctx.drawImage(img, rx, ry, tw, th);
      ctx.restore();
      ctx.beginPath();
      ctx.roundRect(rx, ry, tw, th, br);
      ctx.strokeStyle = "rgba(255,255,255,0.12)";
      ctx.lineWidth = 1;
      ctx.stroke();
    } else {
      // Placeholder subject indicator
      const cp = project3D(0, 0, cx, cy, r * 0.01);
      ctx.beginPath();
      ctx.arc(cx, cy - r * 0.04, 4, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255,255,255,0.15)";
      ctx.fill();
    }

    // ── Camera position dot (projected in 3D, scaled by zoom) ──
    // zoom: -100 (far/wide) → dot at 1.3x sphere radius (outside)
    //        0 (neutral)    → dot on sphere surface (1.0x)
    //        100 (close-up) → dot at 0.3x sphere radius (near center)
    const zoomScale = 1 - (zoom / 100) * 0.7; // maps -100..100 → 1.7..0.3
    const cam = project3D(rotation, tilt, cx, cy, r * zoomScale);
    const camOnSphere = project3D(rotation, tilt, cx, cy, r);
    const isFront = camOnSphere.z >= 0;

    // Zoom orbit ring — shows the zoom radius as a faint ellipse at the equator
    if (zoom !== 0) {
      ctx.save();
      ctx.strokeStyle = "rgba(59, 130, 246, 0.12)";
      ctx.lineWidth = 0.7;
      ctx.setLineDash([2, 3]);
      const zoomR = r * zoomScale;
      // Draw zoom orbit as projected equator ring at the zoom radius
      const zoomPts: { x: number; y: number; z: number }[] = [];
      for (let a = 0; a <= 360; a += 5) {
        zoomPts.push(project3D(a, 0, cx, cy, zoomR));
      }
      ctx.beginPath();
      ctx.moveTo(zoomPts[0].x, zoomPts[0].y);
      for (let i = 1; i < zoomPts.length; i++) {
        ctx.lineTo(zoomPts[i].x, zoomPts[i].y);
      }
      ctx.stroke();
      ctx.restore();
    }

    // Sightline from center to camera dot (dashed)
    ctx.save();
    ctx.setLineDash([3, 3]);
    ctx.beginPath();
    ctx.moveTo(cx, cy - r * 0.04);
    ctx.lineTo(cam.x, cam.y);
    ctx.strokeStyle = isFront
      ? "rgba(59, 130, 246, 0.4)"
      : "rgba(59, 130, 246, 0.15)";
    ctx.lineWidth = 1;
    ctx.stroke();
    ctx.restore();

    // Glow
    const glowAlpha = isFront ? 0.35 : 0.12;
    const glow = ctx.createRadialGradient(cam.x, cam.y, 0, cam.x, cam.y, 18);
    glow.addColorStop(0, `rgba(59, 130, 246, ${glowAlpha})`);
    glow.addColorStop(1, "rgba(59, 130, 246, 0)");
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 18, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 7, 0, Math.PI * 2);
    ctx.fillStyle = isFront
      ? "rgba(59, 130, 246, 0.15)"
      : "rgba(59, 130, 246, 0.06)";
    ctx.fill();
    ctx.strokeStyle = isFront
      ? "rgba(59, 130, 246, 0.7)"
      : "rgba(59, 130, 246, 0.3)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Inner dot
    ctx.beginPath();
    ctx.arc(cam.x, cam.y, 3.5, 0, Math.PI * 2);
    ctx.fillStyle = isFront ? "#3b82f6" : "rgba(59, 130, 246, 0.5)";
    ctx.fill();
    ctx.strokeStyle = isFront ? "#fff" : "rgba(255,255,255,0.5)";
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // ── Direction labels (projected) — larger, color-coded ──
    ctx.textBaseline = "middle";
    ctx.textAlign = "center";

    // Determine which quadrant the camera is in for highlighting
    const rNorm = ((rotation % 360) + 360) % 360;
    const isFrontView = rNorm <= 45 || rNorm >= 315;
    const isBackView = rNorm >= 135 && rNorm <= 225;
    const isLeftView = rNorm > 45 && rNorm < 135;
    const isRightView = rNorm > 225 && rNorm < 315;

    // Front label
    const frontP = project3D(0, 0, cx, cy, r);
    ctx.font = `bold ${isFrontView ? 10 : 9}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = isFrontView ? "rgba(59, 130, 246, 0.8)" : "rgba(255,255,255,0.3)";
    ctx.fillText("FRONT", frontP.x, frontP.y + 14);

    // Back label — more visible, highlighted when camera faces back
    const backP = project3D(180, 0, cx, cy, r);
    ctx.font = `bold ${isBackView ? 10 : 9}px system-ui, -apple-system, sans-serif`;
    ctx.fillStyle = isBackView ? "rgba(239, 68, 68, 0.8)" : "rgba(255,255,255,0.25)";
    ctx.fillText("BACK", backP.x, backP.y - 10);

    // Left
    const leftP = project3D(90, 0, cx, cy, r);
    ctx.font = `bold 9px system-ui, -apple-system, sans-serif`;
    ctx.textAlign = "left";
    ctx.fillStyle = isLeftView ? "rgba(168, 85, 247, 0.7)" : "rgba(255,255,255,0.2)";
    ctx.fillText("L", leftP.x + 6, leftP.y);

    // Right
    const rightP = project3D(-90, 0, cx, cy, r);
    ctx.textAlign = "right";
    ctx.fillStyle = isRightView ? "rgba(168, 85, 247, 0.7)" : "rgba(255,255,255,0.2)";
    ctx.fillText("R", rightP.x - 6, rightP.y);

    // Top indicator
    const topP = project3D(0, 90, cx, cy, r);
    ctx.textAlign = "center";
    ctx.font = "bold 8px system-ui, -apple-system, sans-serif";
    ctx.fillStyle = tilt >= 50 ? "rgba(34, 197, 94, 0.7)" : "rgba(255,255,255,0.12)";
    ctx.fillText("TOP", topP.x, topP.y - 8);

    // ── Active direction badge (bottom of globe) ──
    const dirLabel = isBackView ? "BACK" : isLeftView ? "LEFT" : isRightView ? "RIGHT" : isFrontView ? "FRONT" : "";
    if (dirLabel && !isFrontView) {
      const badgeColor = isBackView ? "rgba(239, 68, 68, 0.15)" : "rgba(168, 85, 247, 0.12)";
      const textColor = isBackView ? "rgba(239, 68, 68, 0.9)" : "rgba(168, 85, 247, 0.8)";
      const badgeW = ctx.measureText(dirLabel).width + 12;
      ctx.fillStyle = badgeColor;
      ctx.beginPath();
      ctx.roundRect(cx - badgeW / 2, cy + r + 4, badgeW, 16, 4);
      ctx.fill();
      ctx.fillStyle = textColor;
      ctx.font = "bold 8px system-ui, -apple-system, sans-serif";
      ctx.fillText(dirLabel, cx, cy + r + 12);
    }
  }, [rotation, tilt, zoom]);

  useEffect(() => {
    draw();
  }, [draw]);

  // Resize observer
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const obs = new ResizeObserver(() => draw());
    obs.observe(canvas);
    return () => obs.disconnect();
  }, [draw]);

  // ── Pointer → angle mapping (inverse of 3D projection) ──
  const getAnglesFromPos = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return { rotation: 0, tilt: 0 };
    const rect = canvas.getBoundingClientRect();
    const { cx, cy, r } = sizeRef.current;
    const sx = (clientX - rect.left - cx) / r;
    const sy = -(clientY - rect.top - cy) / r;
    const len = Math.sqrt(sx * sx + sy * sy);
    const scale = len > 1 ? 1 / len : 1;
    const nx = sx * scale;
    const ny = sy * scale;
    const z3r = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny));
    const y3 = ny * COS_VIEW + z3r * SIN_VIEW;
    const x3 = nx;
    const z3 = -ny * SIN_VIEW + z3r * COS_VIEW;
    let newRotation = Math.round((Math.atan2(x3, z3) * 180) / Math.PI);
    newRotation = ((newRotation % 360) + 360) % 360;
    const newTilt = Math.round((Math.asin(Math.max(-1, Math.min(1, y3))) * 180) / Math.PI);
    return {
      rotation: newRotation,
      tilt: Math.max(-90, Math.min(90, newTilt)),
    };
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    draggingRef.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    const angles = getAnglesFromPos(e.clientX, e.clientY);
    onChange(angles.rotation, angles.tilt);
  }, [getAnglesFromPos, onChange]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!draggingRef.current) return;
    const angles = getAnglesFromPos(e.clientX, e.clientY);
    onChange(angles.rotation, angles.tilt);
  }, [getAnglesFromPos, onChange]);

  const handlePointerUp = useCallback(() => {
    draggingRef.current = false;
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-crosshair touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    />
  );
}

// ── Styled Slider (Higgsfield-style: label — track — value) ──────────────

function AngleSlider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  // For ranges like -90..90, center is at 50%. For 0..360, it starts from left.
  const pct = ((value - min) / (max - min)) * 100;
  const hasNegative = min < 0;
  const centerPct = hasNegative ? ((0 - min) / (max - min)) * 100 : 0;

  // Fill from center for bipolar sliders, from left for unipolar
  const fillLeft = hasNegative ? Math.min(centerPct, pct) : 0;
  const fillWidth = hasNegative ? Math.abs(pct - centerPct) : pct;

  return (
    <div className="flex items-center gap-3 h-7">
      <span className="text-[11px] font-medium text-(--text-tertiary) w-[60px] shrink-0">
        {label}
      </span>
      <div className="relative flex-1 h-6 flex items-center">
        {/* Track background */}
        <div className="absolute left-0 right-0 h-[3px] rounded-full bg-white/[0.06]" />
        {/* Center tick for bipolar sliders */}
        {hasNegative && (
          <div
            className="absolute w-[1px] h-2 bg-white/15 top-1/2 -translate-y-1/2"
            style={{ left: `${centerPct}%` }}
          />
        )}
        {/* Active fill */}
        <div
          className="absolute h-[3px] rounded-full bg-(--accent-blue)/60"
          style={{ left: `${fillLeft}%`, width: `${fillWidth}%` }}
        />
        {/* Native range (invisible) */}
        <input
          type="range"
          min={min}
          max={max}
          step={1}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="absolute inset-0 w-full opacity-0 cursor-pointer z-10"
        />
        {/* Custom thumb */}
        <div
          className="absolute w-[10px] h-[10px] rounded-full bg-(--accent-blue) border-[1.5px] border-white shadow-md pointer-events-none"
          style={{ left: `calc(${pct}% - 5px)` }}
        />
      </div>
      <span className="text-[12px] tabular-nums font-mono text-(--text-secondary) w-[38px] text-right shrink-0">
        {value}{unit}
      </span>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────

export function CameraAnglePicker({ settings, onSettingsChange, subjectImageUrl, companyId, userId, onInsertToPrompt }: CameraAnglePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [presetIdx, setPresetIdx] = useState(-1);
  const [showPresets, setShowPresets] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [showAngleSaveInput, setShowAngleSaveInput] = useState(false);
  const [angleSaveName, setAngleSaveName] = useState("");
  const [showAngleLoadList, setShowAngleLoadList] = useState(false);

  const createPreset = useMutation(api.storyboard.presets.create);
  const incrementUsage = useMutation(api.storyboard.presets.incrementUsage);
  const anglePresets = useQuery(
    api.storyboard.presets.list,
    companyId ? { companyId, category: "camera-angle" } : "skip"
  );

  const isDefault =
    settings.rotation === 0 &&
    settings.tilt === 0 &&
    settings.zoom === 0;

  const promptPreview = buildAnglePromptText(settings);

  const handleGlobeChange = useCallback(
    (rotation: number, tilt: number) => {
      onSettingsChange({ ...settings, rotation, tilt });
      setPresetIdx(-1);
    },
    [settings, onSettingsChange]
  );

  const handleReset = () => {
    onSettingsChange({ ...DEFAULT_ANGLE_SETTINGS });
    setPresetIdx(-1);
  };

  const handleApply = () => {
    setIsOpen(false);
  };

  const applyPreset = (preset: Preset, idx: number) => {
    onSettingsChange({ ...preset.settings });
    setPresetIdx(idx);
  };

  // Cycle presets with arrows (like Higgsfield)
  const cyclePreset = (dir: 1 | -1) => {
    const nextIdx = presetIdx < 0
      ? (dir === 1 ? 0 : PRESETS.length - 1)
      : ((presetIdx + dir + PRESETS.length) % PRESETS.length);
    applyPreset(PRESETS[nextIdx], nextIdx);
  };

  // Summary for trigger button
  const summaryText = isDefault
    ? "Angle"
    : presetIdx >= 0
      ? PRESETS[presetIdx].label
      : `${settings.rotation}° · ${settings.tilt}°`;

  const getPanelStyle = (): React.CSSProperties => {
    if (!triggerRef.current) return {};
    const rect = triggerRef.current.getBoundingClientRect();
    const panelW = 340;
    const gap = 10;
    let left = rect.left + rect.width / 2 - panelW / 2;
    left = Math.max(gap, Math.min(left, window.innerWidth - panelW - gap));
    const top = Math.max(gap, rect.top - 530);
    return { left, top, width: panelW };
  };

  return (
    <>
      {/* Trigger button — matches VirtualCameraStyle trigger */}
      <button
        ref={triggerRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors cursor-pointer border ${
          isOpen
            ? "text-(--accent-blue) border-(--accent-blue)/30 bg-(--accent-blue)/8"
            : !isDefault
              ? "text-(--accent-blue) border-(--accent-blue)/30 bg-(--accent-blue)/8"
              : "text-(--text-secondary) border-white/8 hover:text-(--text-primary) hover:bg-white/5"
        }`}
        title="3D Camera Angle"
      >
        <Crosshair className="w-3 h-3" strokeWidth={1.75} />
        <span>{summaryText}</span>
      </button>

      {/* Floating panel (portal) */}
      {isOpen &&
        createPortal(
          <>
            <div
              className="fixed inset-0 z-[9990] bg-black/30"
              onClick={() => setIsOpen(false)}
            />

            <div
              className="fixed z-[9991] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl overflow-hidden"
              style={getPanelStyle()}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-4 pt-3 pb-1">
                <div className="flex items-center gap-2">
                  <Crosshair className="w-3.5 h-3.5 text-(--accent-blue)" strokeWidth={2} />
                  <span className="text-[13px] font-semibold text-(--text-primary)">
                    Angles
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {companyId && (
                    <button
                      onClick={() => { setShowAngleLoadList(!showAngleLoadList); setShowAngleSaveInput(false); }}
                      className="text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      <Download className="w-3 h-3" /> Load
                    </button>
                  )}
                  {companyId && userId && (
                    <button
                      onClick={() => {
                        if (isDefault) { toast("Change angle settings first"); return; }
                        setShowAngleSaveInput(!showAngleSaveInput); setShowAngleLoadList(false);
                      }}
                      className={`text-[11px] transition-colors flex items-center gap-1 cursor-pointer ${!isDefault ? "text-(--text-tertiary) hover:text-(--text-secondary)" : "text-(--text-tertiary)/40"}`}
                    >
                      <Save className="w-3 h-3" /> Save
                    </button>
                  )}
                  {!isDefault && (
                    <button
                      onClick={handleReset}
                      className="flex items-center gap-1 text-[11px] text-(--text-tertiary) hover:text-(--text-secondary) transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3 h-3" />
                      Reset
                    </button>
                  )}
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-6 h-6 rounded-md flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition-colors cursor-pointer"
                  >
                    <X className="w-4 h-4" strokeWidth={1.75} />
                  </button>
                </div>
              </div>

              {/* Save angle preset input */}
              {showAngleSaveInput && (
                <div className="px-4 pb-2 flex gap-2">
                  <input
                    value={angleSaveName}
                    onChange={(e) => setAngleSaveName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && angleSaveName.trim() && companyId && userId) {
                        await createPreset({
                          name: angleSaveName.trim(),
                          category: "camera-angle",
                          format: JSON.stringify(settings),
                          prompt: buildAnglePromptText(settings),
                          companyId,
                          userId,
                        });
                        toast.success(`Angle preset "${angleSaveName.trim()}" saved`);
                        setAngleSaveName("");
                        setShowAngleSaveInput(false);
                      }
                    }}
                    placeholder="Preset name..."
                    autoFocus
                    className="flex-1 px-2 py-1 bg-(--bg-primary) border border-(--border-primary) rounded-lg text-xs text-(--text-primary) outline-none focus:border-(--accent-blue)/50"
                  />
                  <button
                    onClick={async () => {
                      if (angleSaveName.trim() && companyId && userId) {
                        await createPreset({
                          name: angleSaveName.trim(),
                          category: "camera-angle",
                          format: JSON.stringify(settings),
                          prompt: buildAnglePromptText(settings),
                          companyId,
                          userId,
                        });
                        toast.success(`Angle preset "${angleSaveName.trim()}" saved`);
                        setAngleSaveName("");
                        setShowAngleSaveInput(false);
                      }
                    }}
                    disabled={!angleSaveName.trim()}
                    className="px-2 py-1 text-[11px] bg-(--accent-blue) text-white rounded-lg disabled:opacity-40"
                  >
                    Save
                  </button>
                </div>
              )}

              {/* Load angle preset list */}
              {showAngleLoadList && (
                <div className="px-4 pb-2">
                  <div className="bg-(--bg-primary) border border-(--border-primary) rounded-lg max-h-[120px] overflow-y-auto py-1">
                    {anglePresets && anglePresets.length > 0 ? anglePresets.map((p) => (
                      <button
                        key={p._id}
                        onClick={() => {
                          try {
                            const parsed = JSON.parse(p.format);
                            onSettingsChange(parsed);
                            incrementUsage({ id: p._id });
                            toast.success(`Loaded "${p.name}"`);
                            setShowAngleLoadList(false);
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

              {/* ── Instruction text ── */}
              <div className="px-4 pb-1">
                <p className="text-[10px] text-(--text-tertiary) text-center">
                  Hold and drag to change camera angle
                </p>
              </div>

              {/* ── Globe with left/right arrows ── */}
              <div className="px-4 flex items-center gap-1">
                {/* Left arrow — cycle presets */}
                <button
                  onClick={() => cyclePreset(-1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>

                {/* Wireframe globe */}
                <div className="flex-1 aspect-square max-h-[200px] rounded-xl bg-black/25 border border-white/[0.06] overflow-hidden">
                  <WireframeGlobe
                    rotation={settings.rotation}
                    tilt={settings.tilt}
                    zoom={settings.zoom}
                    subjectImageUrl={subjectImageUrl}
                    onChange={handleGlobeChange}
                  />
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => cyclePreset(1)}
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition-colors shrink-0 cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* ── Preset name (shown when cycling) ── */}
              {presetIdx >= 0 && (
                <div className="text-center mt-1">
                  <span className="text-[11px] font-medium text-(--accent-blue)">
                    {PRESETS[presetIdx].label}
                  </span>
                </div>
              )}

              {/* ── Sliders: Rotation, Tilt, Zoom ── */}
              <div className="px-4 pt-3 pb-2 space-y-0.5">
                <AngleSlider
                  label="Rotation"
                  value={settings.rotation}
                  min={0}
                  max={360}
                  unit="°"
                  onChange={(v) => { onSettingsChange({ ...settings, rotation: v }); setPresetIdx(-1); }}
                />
                <AngleSlider
                  label="Tilt"
                  value={settings.tilt}
                  min={-90}
                  max={90}
                  unit="°"
                  onChange={(v) => { onSettingsChange({ ...settings, tilt: v }); setPresetIdx(-1); }}
                />
                <AngleSlider
                  label="Zoom"
                  value={settings.zoom}
                  min={-100}
                  max={100}
                  unit=""
                  onChange={(v) => { onSettingsChange({ ...settings, zoom: v }); setPresetIdx(-1); }}
                />
              </div>

              {/* ── Samples (built-in angle presets, collapsible) ── */}
              <div className="px-4 pb-2">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase text-(--text-tertiary) hover:text-(--text-secondary) transition-colors cursor-pointer mb-1"
                >
                  <ChevronDown
                    className={`w-3 h-3 transition-transform duration-200 ${showPresets ? "" : "-rotate-90"}`}
                  />
                  Samples
                </button>
                {showPresets && (
                  <div className="flex flex-wrap gap-1 animate-in fade-in slide-in-from-top-1 duration-150">
                    {PRESETS.map((preset, i) => (
                      <button
                        key={preset.label}
                        onClick={() => applyPreset(preset, i)}
                        className={`px-2 py-1 rounded-md text-[10px] font-medium border transition-colors cursor-pointer ${
                          presetIdx === i
                            ? "border-(--accent-blue)/40 bg-(--accent-blue)/10 text-(--accent-blue)"
                            : "border-white/6 text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 hover:border-white/12"
                        }`}
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* ── Prompt preview ── */}
              {promptPreview && (
                <div className="mx-4 mb-2 rounded-lg bg-black/20 border border-white/4 px-3 py-2">
                  <div className="text-[9px] font-semibold tracking-wider uppercase text-(--text-tertiary) mb-0.5">
                    Will append to prompt
                  </div>
                  <div className="text-[11px] text-(--text-secondary) leading-relaxed italic">
                    &ldquo;{promptPreview}&rdquo;
                  </div>
                </div>
              )}

              {/* ── Apply / Send to Prompt buttons ── */}
              <div className="px-4 pb-3 flex gap-2">
                <button
                  onClick={handleApply}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-medium transition-colors cursor-pointer ${
                    !isDefault
                      ? "bg-(--accent-blue) text-white hover:bg-(--accent-blue)/90"
                      : "bg-white/6 text-(--text-secondary) hover:bg-white/10"
                  }`}
                >
                  <Check className="w-3.5 h-3.5" strokeWidth={2} />
                  {!isDefault ? "Apply" : "Done"}
                </button>
                {onInsertToPrompt && !isDefault && (
                  <button
                    onClick={() => {
                      const text = buildAnglePromptText(settings);
                      if (text) {
                        onInsertToPrompt(text);
                        onSettingsChange({ ...DEFAULT_ANGLE_SETTINGS });
                        setIsOpen(false);
                      }
                    }}
                    className="px-3 py-2 rounded-lg text-[12px] font-medium bg-white/6 text-(--text-secondary) hover:bg-white/10 transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Send to Prompt
                  </button>
                )}
              </div>
            </div>
          </>,
          document.body
        )}
    </>
  );
}
