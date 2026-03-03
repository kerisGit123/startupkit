// Shared canvas types used by both playground and SceneEditor

export type MaskDot = { x: number; y: number; r: number };

export type BubbleType =
  | "speech"
  | "speechRough"
  | "speechHalftone"
  | "thought"
  | "whisper"
  | "shout"
  | "rect"
  | "rectRound"
  | "oval"
  | "sfx";

export type TailMode = "none" | "auto" | "manual";
export type TailDir = "bottom-left" | "bottom-right" | "left" | "right";

export type FontWeight = "normal" | "bold" | "lighter";
export type FontStyle = "normal" | "italic" | "oblique";
export type FontFamily =
  | "Arial"
  | "Times New Roman"
  | "Comic Sans MS"
  | "Impact"
  | "Verdana"
  | "Georgia"
  | "Noto Sans"
  | "Noto Serif"
  | "Noto Sans JP"
  | "Noto Sans KR"
  | "Noto Sans SC"
  | "Noto Sans TC"
  | "Noto Sans Thai"
  | "Roboto"
  | "Open Sans"
  | "Montserrat"
  | "Playfair Display"
  | "Oswald"
  | "Raleway";

export type Bubble = {
  id: string;
  panelId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  tailMode: TailMode;
  tailDir: TailDir;
  tailX: number;
  tailY: number;
  text: string;
  bubbleType: BubbleType;
  autoFitFont: boolean;
  fontSize: number;
  flippedColors?: boolean;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
};

export type TextElement = {
  id: string;
  panelId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  fontFamily: FontFamily;
  color: string;
  borderWidth?: number;
  borderColor?: string;
  backgroundColor?: string;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
};

export type AssetLibraryItem = { id: string; url: string; name: string };

export type AssetElement = {
  id: string;
  panelId: string;
  assetId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
};

export type ShapeElement = {
  id: string;
  panelId: string;
  type: "arrow" | "line" | "rectangle" | "circle";
  x: number;
  y: number;
  w: number;
  h: number;
  // For arrow: end coordinates
  endX?: number;
  endY?: number;
  // Common properties
  strokeWidth: number;
  strokeColor: string;
  fillColor?: string;
  rotation?: number;
  flipX?: boolean;
  flipY?: boolean;
  zIndex?: number;
};

export type DragMode =
  | { type: "move"; startX: number; startY: number; origX: number; origY: number }
  | { type: "resize"; handle: "se" | "sw" | "ne" | "nw" | "n" | "s" | "w" | "e"; startX: number; startY: number; orig: Bubble }
  | { type: "tail"; startX: number; startY: number; origTailX: number; origTailY: number }
  | null;

export type CanvasActiveTool = "layers" | "bubbles" | "text" | "assets" | "paint" | "panel" | "aimanga" | "comments";
