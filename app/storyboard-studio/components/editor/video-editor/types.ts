// Video editor types, constants, and pure helpers

export type BlendMode = "normal" | "multiply" | "screen" | "overlay" | "darken" | "lighten" | "color-dodge" | "color-burn";
export const BLEND_MODES: BlendMode[] = ["normal", "multiply", "screen", "overlay", "darken", "lighten", "color-dodge", "color-burn"];

export interface TimelineClip {
  id: string;
  type: "video" | "image" | "audio";
  src: string;
  name: string;
  duration: number;
  trimStart: number;
  trimEnd: number;
  originalDuration: number;
  blendMode?: BlendMode;
  opacity?: number; // 0-100, default 100
  // Layer positioning (optional — omit for sequential base-track behavior)
  layer?: number;        // 0 = base sequential, 1+ = positioned overlay
  startTime?: number;    // absolute time on timeline (overlay layers only)
  x?: number;            // canvas x position
  y?: number;            // canvas y position
  w?: number;            // width override (default = full canvas)
  h?: number;            // height override (default = full canvas)
  borderRadius?: number; // rounded corners
  borderWidth?: number;  // frame border thickness
  borderColor?: string;  // frame border color
  volume?: number;       // 0-100, default 100 (audio mixing)
  prompt?: string;       // AI generation prompt text
}

export interface SubtitleClip {
  id: string;
  text: string;
  startTime: number;
  endTime: number;
  position: "top" | "center" | "bottom";
  fontSize: number;
  fontColor: string;
  backgroundColor: string;
  fontWeight: "normal" | "bold";
}

export const OVERLAY_FONTS = [
  "Arial", "Impact", "Georgia", "Montserrat", "Oswald", "Playfair Display",
  "Roboto", "Open Sans", "Raleway", "Verdana", "Times New Roman", "Comic Sans MS",
] as const;

export interface OverlayLayer {
  id: string;
  type: "text" | "shape" | "image-strip" | "scrolling-text" | "video" | "image" | "transition";
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  w: number;
  h: number;
  // Common
  rotation?: number;    // degrees, default 0
  opacity?: number;     // 0-100, default 100
  visible?: boolean;    // default true
  locked?: boolean;     // prevent drag/resize when true
  // Text
  text?: string;
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  fontWeight?: string;
  fontStyle?: string;
  backgroundColor?: string;
  borderRadius?: number;
  borderWidth?: number;
  borderColor?: string;
  // Shape
  shapeType?: "arrow" | "line" | "rectangle" | "circle";
  strokeColor?: string;
  strokeWidth?: number;
  fillColor?: string;
  endX?: number;
  endY?: number;
  // Image strip
  images?: string[];
  imageGap?: number;
  // Scrolling text
  scrollSpeed?: number;
  scrollDirection?: "up" | "down";
  // Video overlay
  src?: string;
  // Transition
  transitionType?: "crossfade" | "fade-color" | "slide-left" | "wipe" | "cross-dissolve";
}

export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

export type AspectRatio = "16:9" | "9:16" | "1:1";

export const ASPECT_RATIOS: { key: AspectRatio; label: string; w: number; h: number }[] = [
  { key: "16:9", label: "16:9 Landscape", w: 1920, h: 1080 },
  { key: "9:16", label: "9:16 Vertical", w: 1080, h: 1920 },
  { key: "1:1", label: "1:1 Square", w: 1080, h: 1080 },
];

export function getCanvasSize(ratio?: string): { w: number; h: number } {
  const found = ASPECT_RATIOS.find(r => r.key === ratio);
  return found ? { w: found.w, h: found.h } : { w: 1920, h: 1080 };
}

export function formatTime(s: number): string {
  if (!isFinite(s) || isNaN(s)) return "0:00.0";
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
}

export function getVisDur(c: TimelineClip): number {
  const d = c.duration - c.trimStart - c.trimEnd;
  return isNaN(d) || d < 0.1 ? 0.1 : d;
}

export function getClipAtTime(
  clips: TimelineClip[],
  t: number,
): { clip: TimelineClip; offset: number; idx: number } | null {
  let e = 0;
  for (let i = 0; i < clips.length; i++) {
    const d = getVisDur(clips[i]);
    if (t < e + d) return { clip: clips[i], offset: t - e + clips[i].trimStart, idx: i };
    e += d;
  }
  return null;
}

/** Find the two clips at a transition boundary: the outgoing clip and the incoming clip */
export function getTransitionClips(
  clips: TimelineClip[],
  transStartTime: number,
  transEndTime: number,
): { clipA: { clip: TimelineClip; idx: number } | null; clipB: { clip: TimelineClip; idx: number } | null } {
  let e = 0;
  let clipA: { clip: TimelineClip; idx: number } | null = null;
  let clipB: { clip: TimelineClip; idx: number } | null = null;
  const mid = (transStartTime + transEndTime) / 2;
  for (let i = 0; i < clips.length; i++) {
    const d = getVisDur(clips[i]);
    const clipEnd = e + d;
    // Clip A: the one whose end falls within or near the transition
    if (clipEnd > transStartTime && clipEnd <= transEndTime + 0.1 && e < mid) {
      clipA = { clip: clips[i], idx: i };
    }
    // Clip B: the one whose start falls within or near the transition
    if (e >= transStartTime - 0.1 && e < transEndTime && clipEnd > mid) {
      clipB = { clip: clips[i], idx: i };
    }
    e += d;
  }
  return { clipA, clipB };
}

/** Find overlay image/video layers at a transition boundary.
 *  Layer A = outgoing (its endTime falls within the transition window)
 *  Layer B = incoming (its startTime falls within the transition window)
 *  Works with any combo: image↔image, video↔video, image↔video */
export function getTransitionLayers(
  layers: OverlayLayer[],
  transStartTime: number,
  transEndTime: number,
): { layerA: OverlayLayer | null; layerB: OverlayLayer | null } {
  const candidates = layers.filter(l =>
    (l.type === "image" || l.type === "video") && l.src && (l.visible ?? true)
  );
  let layerA: OverlayLayer | null = null;
  let layerB: OverlayLayer | null = null;
  const tolerance = 0.15; // seconds
  for (const l of candidates) {
    // Layer A: its endTime falls within or near the transition window
    if (l.endTime > transStartTime - tolerance && l.endTime <= transEndTime + tolerance && l.startTime < transStartTime) {
      // Pick the one whose endTime is closest to the transition midpoint
      if (!layerA || Math.abs(l.endTime - transStartTime) < Math.abs(layerA.endTime - transStartTime)) {
        layerA = l;
      }
    }
    // Layer B: its startTime falls within or near the transition window
    if (l.startTime >= transStartTime - tolerance && l.startTime < transEndTime + tolerance && l.endTime > transEndTime) {
      if (!layerB || Math.abs(l.startTime - transEndTime) < Math.abs(layerB.startTime - transEndTime)) {
        layerB = l;
      }
    }
  }
  return { layerA, layerB };
}
