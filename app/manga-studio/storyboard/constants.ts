import type { Shot, CastMember, LocationAsset } from "./types";

export const TAG_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];

export const VISUAL_STYLES = [
  { id: "cinematic", label: "Cinematic", gradient: "from-amber-700 to-orange-900" },
  { id: "sketch", label: "Sketch", gradient: "from-gray-400 to-gray-600" },
  { id: "dynamic-ink", label: "Dynamic Ink", gradient: "from-gray-800 to-black" },
  { id: "vintage-bw", label: "Vintage B&W", gradient: "from-gray-500 to-gray-800" },
  { id: "japanese-ink", label: "Japanese Ink", gradient: "from-red-800 to-gray-700" },
  { id: "woodblock", label: "Woodblock Print", gradient: "from-orange-800 to-amber-700" },
  { id: "cartoon", label: "Cartoon", gradient: "from-yellow-400 to-pink-400" },
  { id: "3d-animation", label: "Computer Animation", gradient: "from-blue-500 to-purple-500" },
  { id: "anime", label: "Anime", gradient: "from-pink-500 to-purple-500" },
  { id: "pencil", label: "Pencil Drawing", gradient: "from-gray-300 to-gray-500" },
  { id: "comic-book", label: "Comic Book", gradient: "from-blue-600 to-red-600" },
  { id: "pixel-art", label: "Pixel Art", gradient: "from-green-500 to-blue-500" },
  { id: "watercolor", label: "Watercolor", gradient: "from-cyan-400 to-purple-400" },
  { id: "oil-painting", label: "Oil Painting", gradient: "from-amber-600 to-green-700" },
  { id: "noir", label: "Noir", gradient: "from-gray-900 to-gray-600" },
  { id: "pop-art", label: "Pop Art", gradient: "from-yellow-400 to-red-500" },
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
