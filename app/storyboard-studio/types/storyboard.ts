// Core types for the storyboard system
export interface StoryboardItem {
  id: string;
  projectId: string;
  visual: {
    imageUrl?: string;
    composition: string;
    cameraAngle: string;
    style: string;
    colorPalette?: string[];
  };
  script: {
    dialogue: string;
    action: string;
    description: string;
    sceneNumber?: number;
  };
  metadata: {
    characters: string[];
    locations: string[];
    assets: string[];
    tags: string[];
    mood: string;
    timeOfDay?: string;
  };
  createdAt: Date;
  modifiedAt: Date;
  status: 'draft' | 'in-progress' | 'completed';
  priority: number;
  duration?: number; // in seconds for animation
}

export interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  storyboard: StoryboardItem[];
  settings: {
    theme: string;
    style: string;
    defaultView: 'script' | 'storyboard' | 'single';
    aiModel: string;
  };
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  status: 'draft' | 'in-progress' | 'completed';
  collaborators: string[];
}

export interface Character {
  id: string;
  name: string;
  description: string;
  appearance: {
    hairColor: string;
    eyeColor: string;
    height: string;
    build: string;
    clothing: string[];
  };
  personality: string[];
  referenceImages?: string[];
}

export interface Location {
  id: string;
  name: string;
  description: string;
  type: 'indoor' | 'outdoor' | 'vehicle' | 'abstract';
  timeOfDay: string[];
  weather?: string[];
  referenceImages?: string[];
}

export interface Asset {
  id: string;
  name: string;
  type: 'prop' | 'clothing' | 'weapon' | 'vehicle' | 'effect';
  description: string;
  referenceImages?: string[];
}

export type ViewMode = 'script' | 'storyboard' | 'single' | 'timeline';
export type FilterType = 'tags' | 'characters' | 'locations' | 'status' | 'mood';

export interface AIGenerationRequest {
  prompt: string;
  style: string;
  itemCount: number;
  includeVisuals: boolean;
  includeScript: boolean;
  characterContext?: string[];
  locationContext?: string[];
  moodContext?: string;
}

export interface AIGenerationResponse {
  items: Partial<StoryboardItem>[];
  characters?: Character[];
  locations?: Location[];
  assets?: Asset[];
}
