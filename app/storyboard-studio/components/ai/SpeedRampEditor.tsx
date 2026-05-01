"use client";

import React, { useState, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { Timer, X, RotateCcw } from "lucide-react";

// ── Types ────────────────────────────────────────────────────────────────

/** 5 control points, each 0-4 (0=very slow, 2=normal, 4=very fast) */
export type SpeedCurve = [number, number, number, number, number];

interface SpeedRampEditorProps {
  curve: SpeedCurve;
  onCurveChange: (curve: SpeedCurve) => void;
  /** Insert speed ramp text into the prompt textarea for user editing */
  onInsertToPrompt?: (text: string) => void;
}

// ── Speed level labels ──────────────────────────────────────────────────

const SPEED_LABELS = ["Very Slow", "Slow", "Normal", "Fast", "Very Fast"];

// ── Presets ──────────────────────────────────────────────────────────────

const PRESETS: { name: string; curve: SpeedCurve }[] = [
  { name: "Linear",      curve: [2, 2, 2, 2, 2] },
  { name: "Slow-mo",     curve: [0, 0, 1, 0, 0] },
  { name: "Bullet Time", curve: [2, 2, 0, 0, 2] },
  { name: "Flash In",    curve: [4, 3, 2, 2, 2] },
  { name: "Flash Out",   curve: [2, 2, 2, 3, 4] },
  { name: "Impact",      curve: [2, 3, 0, 1, 2] },
  { name: "Ramp Up",     curve: [0, 1, 2, 3, 4] },
  { name: "Ramp Down",   curve: [4, 3, 2, 1, 0] },
  { name: "Burst",       curve: [1, 1, 4, 4, 1] },
];

const DEFAULT_CURVE: SpeedCurve = [2, 2, 2, 2, 2];

// ── Translate curve to prompt text ──────────────────────────────────────

export function buildSpeedRampPromptText(curve: SpeedCurve): string {
  if (curve.every(v => v === 2)) return "";

  const matchedPreset = PRESETS.find(p => p.curve.every((v, i) => v === curve[i]));

  if (matchedPreset) {
    const presetPrompts: Record<string, string> = {
      "Linear": "",
      "Slow-mo": "slow motion throughout, cinematic slow movement, dreamlike pacing",
      "Bullet Time": "normal speed then freeze into extreme slow motion bullet time effect, then resume normal speed",
      "Flash In": "fast energetic opening that gradually settles into normal speed",
      "Flash Out": "normal speed building to a rapid fast-motion ending",
      "Impact": "normal speed accelerating then sudden dramatic slow motion on impact, slowly recovering",
      "Ramp Up": "starting very slow, gradually accelerating to fast dynamic motion",
      "Ramp Down": "starting fast and energetic, gradually decelerating to slow contemplative motion",
      "Burst": "slow deliberate start, explosive burst of rapid speed in the middle, returning to slow",
    };
    return presetPrompts[matchedPreset.name] || "";
  }

  const segmentNames = ["opening", "early", "middle", "late", "ending"];
  const speedWords = ["very slow motion", "slow", "normal speed", "fast", "very fast rapid"];
  const parts: string[] = [];
  let lastDescribed = -1;

  for (let i = 0; i < 5; i++) {
    const speed = curve[i];
    if (speed === 2) continue;
    if (i > 0 && curve[i] === curve[i - 1] && lastDescribed === i - 1) continue;
    parts.push(`${speedWords[speed]} ${segmentNames[i]}`);
    lastDescribed = i;
  }

  if (parts.length === 0) return "";
  return `Speed pacing: ${parts.join(", ")}.`;
}

// ── Catmull-Rom spline (smooth curve through points) ────────────────────

function catmullRomPath(points: { x: number; y: number }[]): string {
  if (points.length < 2) return "";
  const d: string[] = [`M ${points[0].x} ${points[0].y}`];

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d.push(`C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`);
  }
  return d.join(" ");
}

// ── Mini curve preview ──────────────────────────────────────────────────

function MiniCurve({ curve, active }: { curve: SpeedCurve; active: boolean }) {
  const W = 36;
  const H = 14;
  const points = curve.map((v, i) => ({
    x: 2 + (i / 4) * (W - 4),
    y: H - 2 - (v / 4) * (H - 4),
  }));
  const path = catmullRomPath(points);
  return (
    <svg width={W} height={H} className="shrink-0">
      <path d={path} fill="none" stroke={active ? "#a78bfa" : "#555"} strokeWidth={1.5} strokeLinecap="round" />
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={1.5} fill={active ? "#c4b5fd" : "#777"} />
      ))}
    </svg>
  );
}

// ── Curve Canvas — wide cinematic layout ────────────────────────────────

function CurveCanvas({ curve, onCurveChange }: { curve: SpeedCurve; onCurveChange: (curve: SpeedCurve) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const W = 420;
  const H = 80;
  const PAD_X = 16;
  const PAD_Y = 10;
  const DOT_R = 6;
  const LEVELS = 5;

  const valToY = (val: number) => PAD_Y + ((LEVELS - 1 - val) / (LEVELS - 1)) * (H - PAD_Y * 2);
  const xForIndex = (i: number) => PAD_X + (i / 4) * (W - PAD_X * 2);

  const yToVal = (y: number) => {
    const normalized = (y - PAD_Y) / (H - PAD_Y * 2);
    const val = Math.round((1 - normalized) * (LEVELS - 1));
    return Math.max(0, Math.min(LEVELS - 1, val));
  };

  const handlePointerDown = useCallback((i: number) => (e: React.PointerEvent) => {
    e.preventDefault();
    setDraggingIndex(i);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (draggingIndex === null || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const newVal = yToVal(y);
    if (newVal !== curve[draggingIndex]) {
      const newCurve = [...curve] as SpeedCurve;
      newCurve[draggingIndex] = newVal;
      onCurveChange(newCurve);
    }
  }, [draggingIndex, curve, onCurveChange]);

  const handlePointerUp = useCallback(() => {
    setDraggingIndex(null);
  }, []);

  const points = curve.map((v, i) => ({ x: xForIndex(i), y: valToY(v) }));
  const curvePath = catmullRomPath(points);
  const fillPath = curvePath + ` L ${points[4].x} ${H} L ${points[0].x} ${H} Z`;
  const gridYs = Array.from({ length: LEVELS }).map((_, i) => valToY(i));

  return (
    <div
      ref={containerRef}
      className="relative select-none touch-none rounded-lg overflow-hidden"
      style={{ width: W, height: H, background: "linear-gradient(180deg, #0c0c18 0%, #0a0a12 100%)" }}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <svg width={W} height={H} className="absolute inset-0">
        <defs>
          <linearGradient id="sLineG" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#6366f1" />
            <stop offset="50%" stopColor="#a78bfa" />
            <stop offset="100%" stopColor="#6366f1" />
          </linearGradient>
          <linearGradient id="sFillG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.2" />
            <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0.01" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {gridYs.map((y, i) => (
          <line key={i} x1={PAD_X} y1={y} x2={W - PAD_X} y2={y}
            stroke={i === 2 ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)"}
            strokeWidth={1}
            strokeDasharray={i === 2 ? "none" : "2 6"}
          />
        ))}

        {/* Fill */}
        <path d={fillPath} fill="url(#sFillG)" />

        {/* Curve */}
        <path d={curvePath} fill="none" stroke="url(#sLineG)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />

        {/* Glow circles behind dots */}
        {points.map((p, i) => (
          <circle
            key={`g-${i}`}
            cx={p.x} cy={p.y}
            r={draggingIndex === i || hoverIndex === i ? 14 : 9}
            fill={draggingIndex === i || hoverIndex === i ? "rgba(139,92,246,0.25)" : "rgba(139,92,246,0.08)"}
            className="transition-all duration-150"
          />
        ))}
      </svg>

      {/* Speed labels — left edge */}
      <span className="absolute text-[7px] text-white/15 font-medium" style={{ left: 2, top: gridYs[0] - 4 }}>FAST</span>
      <span className="absolute text-[7px] text-white/15 font-medium" style={{ left: 2, bottom: 2 }}>SLOW</span>

      {/* Timeline markers at bottom */}
      {["0%", "25%", "50%", "75%", "100%"].map((label, i) => (
        <span
          key={i}
          className="absolute text-[7px] text-white/10 font-mono"
          style={{ left: xForIndex(i), bottom: 1, transform: "translateX(-50%)" }}
        >
          {label}
        </span>
      ))}

      {/* Draggable dots */}
      {points.map((p, i) => {
        const isActive = draggingIndex === i || hoverIndex === i;
        return (
          <div
            key={i}
            onPointerDown={handlePointerDown(i)}
            onPointerEnter={() => setHoverIndex(i)}
            onPointerLeave={() => setHoverIndex(null)}
            className="absolute cursor-grab active:cursor-grabbing"
            style={{
              width: DOT_R * 2 + 10,
              height: DOT_R * 2 + 10,
              left: p.x - DOT_R - 5,
              top: p.y - DOT_R - 5,
            }}
          >
            <div
              className={`absolute inset-[5px] rounded-full border-2 transition-all duration-100 ${
                isActive
                  ? "bg-violet-300 border-white/60 scale-125"
                  : "bg-violet-400 border-violet-300/40"
              }`}
              style={{
                boxShadow: isActive
                  ? "0 0 14px rgba(139,92,246,0.7), 0 0 4px rgba(255,255,255,0.3)"
                  : "0 0 6px rgba(139,92,246,0.3)",
              }}
            />
          </div>
        );
      })}

      {/* Hover tooltip */}
      {hoverIndex !== null && (
        <div
          className="absolute px-2 py-0.5 bg-black/90 rounded text-[8px] text-violet-200 pointer-events-none whitespace-nowrap border border-violet-500/20"
          style={{
            left: points[hoverIndex].x,
            top: Math.max(2, points[hoverIndex].y - 20),
            transform: "translateX(-50%)",
          }}
        >
          {SPEED_LABELS[curve[hoverIndex]]}
        </div>
      )}
    </div>
  );
}

// ── Main Component ──────────────────────────────────────────────────────

export function SpeedRampEditor({ curve, onCurveChange, onInsertToPrompt }: SpeedRampEditorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPresets, setShowPresets] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const isDefault = curve.every(v => v === 2);
  const matchedPreset = PRESETS.find(p => p.curve.every((v, i) => v === curve[i]));

  const getPanelStyle = (): React.CSSProperties => {
    const panelW = 460;
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

  return (
    <>
      {/* Trigger button */}
      <button
        ref={triggerRef}
        onClick={() => { setIsOpen(!isOpen); setShowPresets(false); }}
        className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] transition-colors cursor-pointer border ${
          isOpen
            ? "text-violet-400 border-violet-400/30 bg-violet-400/8"
            : !isDefault
              ? "text-violet-400 border-violet-400/30 bg-violet-400/8"
              : "text-(--text-secondary) border-white/8 hover:text-(--text-primary) hover:bg-white/5"
        }`}
        title="Speed Ramp"
      >
        <Timer className="w-3 h-3" strokeWidth={1.75} />
        <span>{!isDefault && matchedPreset ? matchedPreset.name : "Speed"}</span>
      </button>

      {/* Floating panel — wide cinematic */}
      {isOpen && createPortal(
        <>
          <div
            className="fixed inset-0 z-[9990] bg-black/30"
            onClick={() => { setIsOpen(false); setShowPresets(false); }}
          />

          <div
            className="fixed z-[9991] bg-(--bg-secondary) border border-(--border-primary) rounded-2xl shadow-2xl"
            style={getPanelStyle()}
          >
            {/* Header — compact */}
            <div className="flex items-center justify-between px-4 pt-2.5 pb-1">
              <div className="flex items-center gap-2">
                <Timer className="w-3.5 h-3.5 text-violet-400" strokeWidth={1.75} />
                <span className="text-[12px] font-semibold text-(--text-primary)">Speed Ramp</span>
                {matchedPreset && !isDefault && (
                  <span className="text-[9px] text-violet-300 bg-violet-500/10 px-1.5 py-0.5 rounded-full font-medium">
                    {matchedPreset.name}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                {!isDefault && (
                  <button
                    onClick={() => onCurveChange([...DEFAULT_CURVE] as SpeedCurve)}
                    className="text-[10px] text-(--text-tertiary) hover:text-(--text-secondary) transition-colors flex items-center gap-1 px-1.5 py-0.5 rounded hover:bg-white/5"
                  >
                    <RotateCcw className="w-3 h-3" /> Reset
                  </button>
                )}
                <button
                  onClick={() => { setIsOpen(false); setShowPresets(false); }}
                  className="w-5 h-5 rounded flex items-center justify-center text-(--text-tertiary) hover:text-(--text-primary) hover:bg-white/5 transition-colors"
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.75} />
                </button>
              </div>
            </div>

            {/* Curve canvas — full width */}
            <div className="px-4 py-1.5">
              <CurveCanvas curve={curve} onCurveChange={onCurveChange} />
            </div>

            {/* Prompt preview — full width, always visible */}
            {!isDefault && (
              <div className="px-4 pb-1.5 flex items-stretch gap-1.5">
                <div className="flex-1 min-w-0 px-2.5 py-1.5 bg-(--bg-primary) rounded-lg border border-(--border-primary) flex items-baseline gap-1">
                  <span className="text-[9px] text-(--text-tertiary) shrink-0">Prompt:</span>
                  <span className="text-[9px] text-violet-300/80 font-mono leading-tight">
                    {buildSpeedRampPromptText(curve) || "Normal speed"}
                  </span>
                </div>
                {onInsertToPrompt && (
                  <button
                    onClick={() => {
                      const text = buildSpeedRampPromptText(curve);
                      if (text) {
                        onInsertToPrompt(text);
                        onCurveChange([...DEFAULT_CURVE] as SpeedCurve);
                        setIsOpen(false);
                      }
                    }}
                    className="shrink-0 px-2.5 py-1.5 rounded-lg text-[9px] font-medium bg-violet-500/15 border border-violet-500/30 text-violet-300 hover:bg-violet-500/25 transition-colors whitespace-nowrap"
                    title="Insert into prompt textarea for editing"
                  >
                    Send to Prompt
                  </button>
                )}
              </div>
            )}

            {/* Preset selector — bottom row */}
            <div className="px-4 pb-2.5">
              <div className="relative inline-block">
                <button
                  onClick={() => setShowPresets(!showPresets)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[11px] text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 transition-colors border border-(--border-primary) whitespace-nowrap"
                >
                  <MiniCurve curve={matchedPreset?.curve || curve} active={!!matchedPreset && !isDefault} />
                  <span>{matchedPreset && !isDefault ? matchedPreset.name : "Presets"}</span>
                </button>

                {showPresets && (
                  <div className="absolute bottom-full mb-1 left-0 w-[160px] bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl z-[60] max-h-[240px] overflow-y-auto py-1">
                    {PRESETS.map((preset) => {
                      const isActive = preset.curve.every((v, i) => v === curve[i]);
                      return (
                        <button
                          key={preset.name}
                          onClick={() => {
                            onCurveChange([...preset.curve] as SpeedCurve);
                            setShowPresets(false);
                          }}
                          className={`w-full px-3 py-1.5 text-left transition-colors flex items-center gap-2 ${
                            isActive
                              ? "bg-violet-500/10 text-violet-300"
                              : "text-(--text-primary) hover:bg-white/5"
                          }`}
                        >
                          <MiniCurve curve={preset.curve} active={isActive} />
                          <span className="text-[11px] font-medium">{preset.name}</span>
                          {isActive && <div className="w-1.5 h-1.5 rounded-full bg-violet-400 ml-auto shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

          </div>
        </>,
        document.body
      )}
    </>
  );
}
