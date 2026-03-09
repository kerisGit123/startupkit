import type { Shot, CastMember, LocationAsset } from "./types";

export const TAG_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];

// Simple predefined tags
export const SIMPLE_TAGS = [
  { id: "action", name: "Action", color: "#ef4444" },
  { id: "dialogue", name: "Dialogue", color: "#f97316" },
  { id: "dramatic", name: "Dramatic", color: "#eab308" },
  { id: "close-up", name: "Close Up", color: "#22c55e" },
  { id: "wide", name: "Wide", color: "#3b82f6" },
  { id: "interior", name: "Interior", color: "#8b5cf6" },
  { id: "exterior", name: "Exterior", color: "#ec4899" },
  { id: "day", name: "Day", color: "#06b6d4" },
  { id: "night", name: "Night", color: "#ef4444" },
  { id: "montage", name: "Montage", color: "#f97316" },
];

export const VISUAL_STYLES = [
  { id: "cinematic", label: "Cinematic", gradient: "from-amber-700 to-orange-900", preview: "https://images.unsplash.com/photo-1485846234645-a62644f84728?w=400&h=300&fit=crop" },
  { id: "sketch", label: "Sketch", gradient: "from-gray-400 to-gray-600", preview: "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&h=300&fit=crop" },
  { id: "dynamic-ink", label: "Dynamic Ink", gradient: "from-gray-800 to-black", preview: "https://images.unsplash.com/photo-1541961017774-22349e4a1262?w=400&h=300&fit=crop" },
  { id: "vintage-bw", label: "Vintage B&W", gradient: "from-gray-500 to-gray-800", preview: "https://images.unsplash.com/photo-1550684848-fac1c5b4e853?w=400&h=300&fit=crop" },
  { id: "japanese-ink", label: "Japanese Ink", gradient: "from-red-800 to-gray-700", preview: "https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?w=400&h=300&fit=crop" },
  { id: "woodblock", label: "Woodblock Print", gradient: "from-orange-800 to-amber-700", preview: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop" },
  { id: "cartoon", label: "Cartoon", gradient: "from-yellow-400 to-pink-400", preview: "https://images.unsplash.com/photo-1560167016-022b78a0258e?w=400&h=300&fit=crop" },
  { id: "3d-animation", label: "Computer Animation", gradient: "from-blue-500 to-purple-500", preview: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=400&h=300&fit=crop" },
  { id: "anime", label: "Anime", gradient: "from-pink-500 to-purple-500", preview: "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400&h=300&fit=crop" },
  { id: "pencil", label: "Pencil Drawing", gradient: "from-gray-300 to-gray-500", preview: "https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=400&h=300&fit=crop" },
  { id: "comic-book", label: "Comic Book", gradient: "from-blue-600 to-red-600", preview: "https://images.unsplash.com/photo-1612036782180-6f0b6cd846fe?w=400&h=300&fit=crop" },
  { id: "pixel-art", label: "Pixel Art", gradient: "from-green-500 to-blue-500", preview: "https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=400&h=300&fit=crop" },
  { id: "watercolor", label: "Watercolor", gradient: "from-cyan-400 to-purple-400", preview: "https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?w=400&h=300&fit=crop" },
  { id: "oil-painting", label: "Oil Painting", gradient: "from-amber-600 to-green-700", preview: "https://images.unsplash.com/photo-1578301978693-85fa9c0320b9?w=400&h=300&fit=crop" },
  { id: "noir", label: "Noir", gradient: "from-gray-900 to-gray-600", preview: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=400&h=300&fit=crop" },
  { id: "pop-art", label: "Pop Art", gradient: "from-yellow-400 to-red-500", preview: "https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop" },
  { id: "custom", label: "Custom", gradient: "from-purple-500 to-pink-500", preview: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
];

export const SAMPLE_SHOTS: Shot[] = [
  {
    id: "s1", scene: 1, shot: 1,
    description: "Max and Maria sitting side by side in first class, engrossed in their respective books",
    ert: "10 sec", shotSize: "Medium shot", perspective: "Eye-level shot", movement: "Static",
    equipment: "Handheld camera", focalLength: "35mm", aspectRatio: "16:9",
    cast: ["Grant"], location: "Abandoned Warehouse",
    voiceOver: "A man in a dark jacket enters a vast, dimly lit warehouse.",
    action: "Grant walks cautiously between towering stacks of wooden crates.",
    tags: [{ id: "t1", name: "motion", color: "#8b5cf6" }],
    notes: "", comments: [],
  },
  {
    id: "s2", scene: 1, shot: 2,
    description: "Close-up of the humming plane engine",
    ert: "5 sec", shotSize: "Close-up shot", perspective: "Low-angle shot", movement: "Static",
    equipment: "Handheld camera", focalLength: "50mm", aspectRatio: "16:9",
    cast: ["Grant", "Riley"], location: "Abandoned Warehouse",
    voiceOver: "He pauses, brow furrowed, as a shadow flickers in the distance.",
    action: "The man ducks behind a crate, peeking through a gap.",
    tags: [{ id: "t1", name: "motion", color: "#8b5cf6" }],
    notes: "", comments: [],
  },
  {
    id: "s3", scene: 1, shot: 3,
    description: "Inside the plan: Pilot stepping out of the cockpit cabin with a friendly face",
    ert: "7 sec", shotSize: "Medium shot", perspective: "Eye-level shot", movement: "Static",
    equipment: "Handheld camera", focalLength: "35mm", aspectRatio: "16:9",
    cast: ["Grant", "Riley"], location: "Abandoned Warehouse",
    voiceOver: "The man silently navigates around the crates, keeping low.",
    action: "He clutches a small flashlight, scanning the space.",
    tags: [{ id: "t2", name: "motion", color: "#8b5cf6" }],
    notes: "", comments: [],
  },
  {
    id: "s4", scene: 1, shot: 4,
    description: "Pilot stepping out of the cockpit cabin with a friendly face",
    ert: "7 sec", shotSize: "Medium shot", perspective: "Eye-level shot", movement: "Static",
    equipment: "Handheld camera", focalLength: "35mm", aspectRatio: "16:9",
    cast: ["Grant", "Riley"], location: "Abandoned Warehouse",
    voiceOver: "Suddenly, a crate teeters and falls with a loud crash.",
    action: "Both figures freeze, staring across the open space at each other.",
    tags: [{ id: "t3", name: "live action", color: "#eab308" }],
    notes: "", comments: [],
  },
  {
    id: "s5", scene: 1, shot: 5,
    description: "Max and Maria in their seats, exchanging puzzled looks",
    ert: "5 sec", shotSize: "Close-up shot", perspective: "Eye-level shot", movement: "Static",
    equipment: "Handheld camera", focalLength: "50mm", aspectRatio: "16:9",
    cast: ["Grant", "Riley"], location: "Abandoned Warehouse",
    voiceOver: "The tension breaks as the man smiles, revealing a set of blueprints.",
    action: "Together, they approach a crate marked with a red X and pry it open.",
    tags: [{ id: "t1", name: "motion", color: "#8b5cf6" }, { id: "t4", name: "3D", color: "#3b82f6" }],
    notes: "", comments: [],
  },
];

export const SAMPLE_CAST: CastMember[] = [
  { id: "c1", name: "Grant", description: "A dark black jacket over a charcoal t-shirt, rugged build, short brown hair" },
  { id: "c2", name: "Riley", description: "A dark gray hooded sweatshirt, athletic build, long dark hair" },
];

export const SAMPLE_LOCATIONS: LocationAsset[] = [
  { id: "l1", name: "Abandoned Warehouse", description: "Modern Industrial District - vast space with towering wooden crates" },
];
