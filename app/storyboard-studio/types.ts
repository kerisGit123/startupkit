export type Step = "dashboard" | "script" | "breakdown" | "style" | "cast" | "storyboard" | "scene-editor" | "element-generator" | "image-maker" | "members" | "usage";

export interface Project {
  id: string;
  name: string;
  type: "board" | "folder" | "stage" | "link";
  status: "On Hold" | "In Progress" | "Completed" | "Draft";
  version: number;
  members: number;
  reviewers: number;
  dueDate: string;
  assignee?: string;
  tags: string[];
  favourite?: boolean;
  imageUrl?: string; // NEW: Image URL for the project's main image
  settings?: {
    frameRatio: string;
    style: string;
    layout: string;
  };
}

export type Orientation = "16:9" | "9:16" | "1:1";
export type ViewMode = "grid" | "script" | "single" | "video";

export interface Shot {
  id: string;
  scene: number;
  shot: number;
  description: string;
  ert: string;
  shotSize: string;
  perspective: string;
  movement: string;
  equipment: string;
  focalLength: string;
  aspectRatio: string;
  cast: string[];
  location: string;
  voiceOver: string;
  action: string;
  imageUrl?: string;
  videoUrl?: string;
  tags: Tag[];
  notes: string;
  comments: CommentItem[];
  order?: number;
  title?: string;
  duration?: number;
  dialogue?: string[];
  camera?: string[];
  sound?: string[];
  props?: string[];
  wardrobe?: string[];
  makeup?: string[];
  editing?: string;
  vfx?: string;
  colorGrade?: string;
  music?: string;
  sfx?: string[];
  transition?: string;
  specialInstructions?: string;
  mood?: string;
  lighting?: string;
  bgDescription?: string;
  characters?: string[];
}

export interface Tag {
  id: string;
  name: string;
  color: string;
}

export interface CommentItem {
  id: string;
  author: string;
  avatar: string;
  text: string;
  timestamp: string;
}

export interface CastMember {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface LocationAsset {
  id: string;
  name: string;
  description: string;
  imageUrl?: string;
}

export interface BoardSettings {
  showNotes: boolean;
  showScript: boolean;
  showAction: boolean;
  showCamera: boolean;
  showLighting: boolean;
  showTags: boolean;
  showIcons: boolean;
  showFrameNumbers: boolean;
  frameFormat: string;
}
