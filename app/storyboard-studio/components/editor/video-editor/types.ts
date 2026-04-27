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
  type: "text" | "shape" | "image-strip" | "scrolling-text" | "video" | "image";
  startTime: number;
  endTime: number;
  x: number;
  y: number;
  w: number;
  h: number;
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
}

export const R2_PUBLIC_URL = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";

export function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  const ms = Math.floor((s % 1) * 10);
  return `${m}:${sec.toString().padStart(2, "0")}.${ms}`;
}

export function getVisDur(c: TimelineClip): number {
  return Math.max(0.1, c.duration - c.trimStart - c.trimEnd);
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
