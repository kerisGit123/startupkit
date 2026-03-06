// SVG math helpers extracted from playground/page.tsx
// Used by both playground and SceneEditor canvas rendering

import type { TailDir } from "./canvas-types";

export function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

export function hashToUnit(seed: string) {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return (h >>> 0) / 4294967295;
}

export function jitter(seed: string, idx: number) {
  const a = hashToUnit(`${seed}:${idx}:a`);
  const b = hashToUnit(`${seed}:${idx}:b`);
  return (a * 2 - 1) * 0.6 + (b * 2 - 1) * 0.2;
}

export function estimateFontSize(text: string, w: number, h: number) {
  const min = 10, max = 30;
  const area = Math.max(1, w * h);
  const density = text.trim().length / area;
  const raw = Math.round(26 - density * 90000);
  return clamp(raw, min, max);
}

// Ellipse helper: returns SVG ellipse attributes
export function bubbleEllipse(w: number, h: number) {
  return { cx: w / 2, cy: h / 2, rx: w * 0.48, ry: h * 0.44 };
}

export function roughEllipsePath(w: number, h: number, seed: string) {
  const e = bubbleEllipse(w, h);
  const bumps = 28;
  const amp = Math.max(0.8, Math.min(w, h) * 0.01);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2;
    const j = jitter(seed, i);
    const rj = 1 + j * 0.28;
    const x = e.cx + Math.cos(t) * (e.rx + amp * j) * rj;
    const y = e.cy + Math.sin(t) * (e.ry + amp * j) * rj;
    pts.push({ x, y });
  }
  const d: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i];
    const p1 = pts[(i + 1) % pts.length];
    const mx = (p0.x + p1.x) / 2;
    const my = (p0.y + p1.y) / 2;
    if (i === 0) d.push(`M ${mx.toFixed(1)} ${my.toFixed(1)}`);
    d.push(`Q ${p1.x.toFixed(1)} ${p1.y.toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`);
  }
  d.push("Z");
  return d.join(" ");
}

export function tailPath(w: number, h: number, dir: TailDir, tailLen = 28) {
  const e = bubbleEllipse(w, h);
  const len = tailLen;
  const spread = 10;
  const inset = 6;
  if (dir === "bottom-left") {
    const sx = e.cx - spread, sy = e.cy + e.ry - inset;
    return `M ${sx},${sy} q -${len*0.2},${len*1.0} -${len*0.7},${len*1.2} q ${len*0.6},-${len*0.25} ${len*0.7+spread*2},-${len*1.2} Z`;
  }
  if (dir === "bottom-right") {
    const sx = e.cx + spread, sy = e.cy + e.ry - inset;
    return `M ${sx},${sy} q ${len*0.2},${len*1.0} ${len*0.7},${len*1.2} q -${len*0.6},-${len*0.25} -${len*0.7+spread*2},-${len*1.2} Z`;
  }
  if (dir === "left") {
    const sx = e.cx - e.rx + inset, sy = e.cy + spread * 0.4;
    return `M ${sx},${sy} q -${len*1.0},${len*0.15} -${len*1.2},${len*0.6} q ${len*0.2},-${len*0.6} ${len*1.2},-${len*0.6+spread} Z`;
  }
  const sx = e.cx + e.rx - inset, sy = e.cy + spread * 0.4;
  return `M ${sx},${sy} q ${len*1.0},${len*0.15} ${len*1.2},${len*0.6} q -${len*0.2},-${len*0.6} -${len*1.2},-${len*0.6+spread} Z`;
}

export function rectTailPath(w: number, h: number, dir: TailDir, tailLen = 28) {
  const len = tailLen, edge = 4, spread = 10, inset = 8;
  if (dir === "bottom-left") {
    const cx = w * 0.2, sx = cx - spread, sy = (h - edge) - inset;
    return `M ${sx},${sy} q -${len*0.2},${len*1.0} -${len*0.7},${len*1.2} q ${len*0.6},-${len*0.25} ${len*0.7+spread*2},-${len*1.2} Z`;
  }
  if (dir === "bottom-right") {
    const cx = w * 0.8, sx = cx + spread, sy = (h - edge) - inset;
    return `M ${sx},${sy} q ${len*0.2},${len*1.0} ${len*0.7},${len*1.2} q -${len*0.6},-${len*0.25} -${len*0.7+spread*2},-${len*1.2} Z`;
  }
  if (dir === "left") {
    const sx = edge + inset, sy = h * 0.6 + spread * 0.4;
    return `M ${sx},${sy} q -${len*1.0},${len*0.15} -${len*1.2},${len*0.6} q ${len*0.2},-${len*0.6} ${len*1.2},-${len*0.6+spread} Z`;
  }
  const sx = (w - edge) - inset, sy = h * 0.6 + spread * 0.4;
  return `M ${sx},${sy} q ${len*1.0},${len*0.15} ${len*1.2},${len*0.6} q -${len*0.2},-${len*0.6} -${len*1.2},-${len*0.6+spread} Z`;
}

export function rectOutlinePathWithGap(
  w: number, h: number, cr: number,
  edge: "bottom" | "left" | "right",
  gapCenter: number, gapW: number
) {
  const left = 4, top = 4, right = w - 4, bottom = h - 4;
  const r = Math.max(0, Math.min(cr, (right - left) / 2, (bottom - top) / 2));
  const gapHalf = gapW / 2;
  if (edge === "bottom") {
    const g0 = Math.max(left + r, Math.min(right - r, gapCenter - gapHalf));
    const g1 = Math.max(left + r, Math.min(right - r, gapCenter + gapHalf));
    return [`M ${g0} ${bottom}`, `H ${left+r}`, `Q ${left} ${bottom} ${left} ${bottom-r}`, `V ${top+r}`, `Q ${left} ${top} ${left+r} ${top}`, `H ${right-r}`, `Q ${right} ${top} ${right} ${top+r}`, `V ${bottom-r}`, `Q ${right} ${bottom} ${right-r} ${bottom}`, `H ${g1}`].join(" ");
  }
  if (edge === "left") {
    const g0 = Math.max(top + r, Math.min(bottom - r, gapCenter - gapHalf));
    const g1 = Math.max(top + r, Math.min(bottom - r, gapCenter + gapHalf));
    return [`M ${left} ${g0}`, `V ${bottom-r}`, `Q ${left} ${bottom} ${left+r} ${bottom}`, `H ${right-r}`, `Q ${right} ${bottom} ${right} ${bottom-r}`, `V ${top+r}`, `Q ${right} ${top} ${right-r} ${top}`, `H ${left+r}`, `Q ${left} ${top} ${left} ${top+r}`, `V ${g1}`].join(" ");
  }
  const g0 = Math.max(top + r, Math.min(bottom - r, gapCenter - gapHalf));
  const g1 = Math.max(top + r, Math.min(bottom - r, gapCenter + gapHalf));
  return [`M ${right} ${g1}`, `V ${top+r}`, `Q ${right} ${top} ${right-r} ${top}`, `H ${left+r}`, `Q ${left} ${top} ${left} ${top+r}`, `V ${bottom-r}`, `Q ${left} ${bottom} ${left+r} ${bottom}`, `H ${right-r}`, `Q ${right} ${bottom} ${right} ${bottom-r}`, `V ${g0}`].join(" ");
}

export function cloudPath(w: number, h: number) {
  const cx = w / 2, cy = h / 2, rx = w * 0.46, ry = h * 0.40, bumps = 14;
  const bumpDepth = Math.min(w, h) * 0.10;
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < bumps; i++) {
    const t = (i / bumps) * Math.PI * 2;
    pts.push({ x: cx + Math.cos(t) * rx, y: cy + Math.sin(t) * ry });
  }
  const d: string[] = [];
  for (let i = 0; i < pts.length; i++) {
    const p0 = pts[i], p1 = pts[(i + 1) % pts.length];
    const mx = (p0.x + p1.x) / 2, my = (p0.y + p1.y) / 2;
    const nx = mx - cx, ny = my - cy, nl = Math.max(1, Math.hypot(nx, ny));
    const bx = mx + (nx / nl) * bumpDepth, by = my + (ny / nl) * bumpDepth;
    if (i === 0) d.push(`M ${p0.x.toFixed(1)} ${p0.y.toFixed(1)}`);
    d.push(`Q ${bx.toFixed(1)} ${by.toFixed(1)} ${p1.x.toFixed(1)} ${p1.y.toFixed(1)}`);
  }
  d.push("Z");
  return d.join(" ");
}

export function burstPoints(w: number, h: number, spikes: number, seed: string, shortSpikes = false) {
  const cx = w / 2, cy = h / 2;
  const rOuter = Math.min(w, h) * (shortSpikes ? 0.48 : 0.50);
  const rInner = Math.min(w, h) * (shortSpikes ? 0.36 : 0.28);
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const t = (i / (spikes * 2)) * Math.PI * 2;
    const isOuter = i % 2 === 0;
    const j = jitter(seed, i);
    const angleJitter = jitter(seed, i + 500) * (shortSpikes ? 0.06 : 0.12);
    const r = (isOuter ? rOuter : rInner) * (1 + j * (shortSpikes ? 0.10 : 0.18));
    const angle = t + angleJitter;
    pts.push({ x: cx + Math.cos(angle) * r, y: cy + Math.sin(angle) * r });
  }
  return pts;
}

export function makeId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
