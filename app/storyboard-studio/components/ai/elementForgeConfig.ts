// ─── Element Forge Configuration ────────────────────────────────────────────
// Step definitions, option data, and prompt composition for Character/Environment/Prop wizards.

// ═══════════════════════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════════════════════

export type ForgeElementType = "character" | "environment" | "prop";

export interface ForgeOption {
  key: string;
  label: string;
  color?: string; // For color dots (hair/eye color)
  icon?: string;  // Future: thumbnail path
}

export interface ForgeStep {
  key: string;
  label: string;
  fields: ForgeField[];
  /** When true, each field becomes its own sub-tab (Higgsfield Physical Appearance style) */
  hasSubTabs?: boolean;
}

export interface ForgeField {
  key: string;
  label: string;
  type: "button-group" | "visual-grid" | "color-dots" | "multi-select" | "text" | "textarea" | "dropdown" | "two-level" | "era-slider" | "combobox" | "carousel" | "multi-carousel" | "image-upload";
  options?: ForgeOption[];
  subOptions?: Record<string, ForgeOption[]>; // For two-level fields
  placeholder?: string;
  required?: boolean;
  columns?: number; // Grid columns for visual-grid
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const T = "/storytica/element_forge/thumbs/";

// ─── Era (shared between human and non-human) ───────────────────────────────

export const ERA_OPTIONS: ForgeOption[] = [
  { key: "prehistoric", label: "Prehistoric" },
  { key: "ancient", label: "Ancient" },
  { key: "medieval", label: "Medieval" },
  { key: "renaissance", label: "Renaissance" },
  { key: "1700s", label: "1700s" },
  { key: "1800s", label: "1800s" },
  { key: "1900s", label: "1900s" },
  { key: "1910s", label: "1910s" },
  { key: "1920s", label: "1920s" },
  { key: "1930s", label: "1930s" },
  { key: "1940s", label: "1940s" },
  { key: "1950s", label: "1950s" },
  { key: "1960s", label: "1960s" },
  { key: "1970s", label: "1970s" },
  { key: "1980s", label: "1980s" },
  { key: "1990s", label: "1990s" },
  { key: "2000s", label: "2000s" },
  { key: "2010s", label: "2010s" },
  { key: "2020s", label: "2020s" },
  { key: "modern", label: "Modern" },
  { key: "near-future", label: "Near Future" },
  { key: "far-future", label: "Far Future" },
  { key: "timeless", label: "Timeless" },
  { key: "fantasy", label: "Fantasy" },
];

// ─── Non-human type presets (combobox — user can also type freely) ───────────

const NON_HUMAN_TYPE_PRESETS: ForgeOption[] = [
  { key: "robot", label: "Robot" },
  { key: "mecha", label: "Mecha" },
  { key: "android", label: "Android" },
  { key: "cyborg", label: "Cyborg" },
  { key: "monster", label: "Monster" },
  { key: "creature", label: "Creature" },
  { key: "alien", label: "Alien" },
  { key: "ghost", label: "Ghost" },
  { key: "spirit", label: "Spirit" },
  { key: "demon", label: "Demon" },
  { key: "angel", label: "Angel" },
  { key: "vampire", label: "Vampire" },
  { key: "zombie", label: "Zombie" },
  { key: "dragon", label: "Dragon" },
  { key: "elemental", label: "Elemental" },
  { key: "animal", label: "Animal" },
  { key: "mythical-beast", label: "Mythical Beast" },
  { key: "ai", label: "AI / Digital Being" },
];

const GENDER_OPTIONS: ForgeOption[] = [
  { key: "male", label: "Male", icon: T + "gender-male.jpg" },
  { key: "female", label: "Female", icon: T + "gender-female.jpg" },
  { key: "non-binary", label: "Non-binary", icon: T + "gender-nonbinary.jpg" },
  { key: "other", label: "Other", icon: T + "gender-other.jpg" },
];

const AGE_OPTIONS: ForgeOption[] = [
  { key: "child", label: "Child", icon: T + "age-child.jpg" },
  { key: "teen", label: "Teen", icon: T + "age-teen.jpg" },
  { key: "young-adult", label: "Young Adult", icon: T + "age-young-adult.jpg" },
  { key: "adult", label: "Adult", icon: T + "age-adult.jpg" },
  { key: "middle-aged", label: "Middle-aged", icon: T + "age-middle-aged.jpg" },
  { key: "elderly", label: "Elderly", icon: T + "age-elderly.jpg" },
];

const ETHNICITY_OPTIONS: ForgeOption[] = [
  { key: "east-asian", label: "East Asian" },
  { key: "south-asian", label: "South Asian" },
  { key: "southeast-asian", label: "Southeast Asian" },
  { key: "black", label: "Black" },
  { key: "white", label: "White" },
  { key: "latino", label: "Latino" },
  { key: "middle-eastern", label: "Middle Eastern" },
  { key: "mixed", label: "Mixed" },
  { key: "other", label: "Other" },
];

const BUILD_OPTIONS: ForgeOption[] = [
  { key: "slim", label: "Slim", icon: T + "build-slim.jpg" },
  { key: "average", label: "Average", icon: T + "build-average.jpg" },
  { key: "athletic", label: "Athletic", icon: T + "build-athletic.jpg" },
  { key: "muscular", label: "Muscular", icon: T + "build-muscular.jpg" },
  { key: "stocky", label: "Stocky", icon: T + "build-stocky.jpg" },
];

const HEIGHT_OPTIONS: ForgeOption[] = [
  { key: "very-short", label: "Very short" },
  { key: "short", label: "Short" },
  { key: "average", label: "Average" },
  { key: "tall", label: "Tall" },
  { key: "very-tall", label: "Very tall" },
];

const HAIR_COLOR_OPTIONS: ForgeOption[] = [
  { key: "black", label: "Black", color: "#1a1a1a" },
  { key: "brown", label: "Brown", color: "#5c3317" },
  { key: "blonde", label: "Blonde", color: "#d4a853" },
  { key: "red", label: "Red", color: "#a0522d" },
  { key: "white", label: "Silver White", color: "#c0c0c0" },
  { key: "blue", label: "Blue", color: "#4a90e2" },
  { key: "pink", label: "Pink", color: "#e27a9e" },
  { key: "green", label: "Green", color: "#4a9e6e" },
];

const HAIR_STYLE_OPTIONS: ForgeOption[] = [
  { key: "short-straight", label: "Short Straight", icon: T + "hair-short-straight.jpg" },
  { key: "short-curly", label: "Short Curly", icon: T + "hair-short-curly.jpg" },
  { key: "medium-straight", label: "Medium Straight", icon: T + "hair-medium-straight.jpg" },
  { key: "medium-wavy", label: "Medium Wavy", icon: T + "hair-medium-wavy.jpg" },
  { key: "long-straight", label: "Long Straight", icon: T + "hair-long-straight.jpg" },
  { key: "long-curly", label: "Long Curly", icon: T + "hair-long-curly.jpg" },
  { key: "long-wavy", label: "Long Wavy", icon: T + "hair-long-wavy.jpg" },
  { key: "braids", label: "Braids", icon: T + "hair-braids.jpg" },
  { key: "bald", label: "Bald", icon: T + "hair-bald.jpg" },
  { key: "buzz-cut", label: "Buzz Cut", icon: T + "hair-buzz-cut.jpg" },
];

const HAIR_TEXTURE_OPTIONS: ForgeOption[] = [
  { key: "straight", label: "Straight", icon: T + "hair-texture-straight.jpg" },
  { key: "wavy", label: "Wavy", icon: T + "hair-texture-wavy.jpg" },
  { key: "curly", label: "Curly", icon: T + "hair-texture-curly.jpg" },
  { key: "coily", label: "Coily", icon: T + "hair-texture-coily.jpg" },
];

const FACIAL_HAIR_OPTIONS: ForgeOption[] = [
  { key: "clean-shaven", label: "Clean Shaven", icon: T + "facial-clean-shaven.jpg" },
  { key: "stubble", label: "Stubble", icon: T + "facial-stubble.jpg" },
  { key: "short-beard", label: "Short Beard", icon: T + "facial-short-beard.jpg" },
  { key: "full-beard", label: "Full Beard", icon: T + "facial-full-beard.jpg" },
  { key: "goatee", label: "Goatee", icon: T + "facial-goatee.jpg" },
  { key: "moustache", label: "Moustache", icon: T + "facial-moustache.jpg" },
  { key: "long-beard", label: "Long Beard", icon: T + "facial-long-beard.jpg" },
];

const EYE_COLOR_OPTIONS: ForgeOption[] = [
  { key: "brown", label: "Brown", color: "#5c3317", icon: T + "eye-brown.jpg" },
  { key: "blue", label: "Blue", color: "#4a90e2", icon: T + "eye-blue.jpg" },
  { key: "green", label: "Green", color: "#2e8b57", icon: T + "eye-green.jpg" },
  { key: "hazel", label: "Hazel", color: "#8e7618", icon: T + "eye-hazel.jpg" },
  { key: "gray", label: "Gray", color: "#808080", icon: T + "eye-gray.jpg" },
  { key: "amber", label: "Amber", color: "#cf8a00", icon: T + "eye-amber.jpg" },
];

const ARCHETYPE_OPTIONS: ForgeOption[] = [
  { key: "hero", label: "Hero", icon: T + "archetype-hero.jpg" },
  { key: "rebel", label: "Rebel", icon: T + "archetype-rebel.jpg" },
  { key: "innocent", label: "Innocent", icon: T + "archetype-innocent.jpg" },
  { key: "everyman", label: "Everyman", icon: T + "archetype-everyman.jpg" },
  { key: "explorer", label: "Explorer", icon: T + "archetype-explorer.jpg" },
  { key: "caregiver", label: "Caregiver", icon: T + "archetype-caregiver.jpg" },
  { key: "trickster", label: "Trickster", icon: T + "archetype-trickster.jpg" },
  { key: "sage", label: "Sage", icon: T + "archetype-sage.jpg" },
];

const EXPRESSION_OPTIONS: ForgeOption[] = [
  { key: "neutral", label: "Neutral", icon: T + "expression-neutral.jpg" },
  { key: "happy", label: "Happy", icon: T + "expression-happy.jpg" },
  { key: "serious", label: "Serious", icon: T + "expression-serious.jpg" },
  { key: "angry", label: "Angry", icon: T + "expression-angry.jpg" },
  { key: "sad", label: "Sad", icon: T + "expression-sad.jpg" },
  { key: "confident", label: "Confident", icon: T + "expression-confident.jpg" },
  { key: "mysterious", label: "Mysterious", icon: T + "expression-mysterious.jpg" },
  { key: "fearful", label: "Fearful", icon: T + "expression-fearful.jpg" },
];

const DETAIL_PRESETS: ForgeOption[] = [
  { key: "scar", label: "Scar", icon: T + "detail-scar.jpg" },
  { key: "freckles", label: "Freckles", icon: T + "detail-freckles.jpg" },
  { key: "tattoos", label: "Tattoos", icon: T + "detail-tattoos.jpg" },
  { key: "eye-patch", label: "Eye Patch", icon: T + "detail-eye-patch.jpg" },
  { key: "glasses", label: "Glasses", icon: T + "detail-glasses.jpg" },
  { key: "beard", label: "Beard", icon: T + "detail-beard.jpg" },
  { key: "moustache", label: "Moustache", icon: T + "detail-moustache.jpg" },
  { key: "piercing", label: "Piercing", icon: T + "detail-piercing.jpg" },
];

const OUTFIT_OPTIONS: ForgeOption[] = [
  { key: "casual", label: "Casual", icon: T + "outfit-casual.jpg" },
  { key: "formal", label: "Formal", icon: T + "outfit-formal.jpg" },
  { key: "streetwear", label: "Streetwear", icon: T + "outfit-streetwear.jpg" },
  { key: "high-fashion", label: "High Fashion", icon: T + "outfit-high-fashion.jpg" },
  { key: "military", label: "Military", icon: T + "outfit-military.jpg" },
  { key: "sporty", label: "Sporty", icon: T + "outfit-sporty.jpg" },
  { key: "fantasy", label: "Fantasy", icon: T + "outfit-fantasy.jpg" },
  { key: "sci-fi", label: "Sci-fi", icon: T + "outfit-sci-fi.jpg" },
  { key: "historical", label: "Historical", icon: T + "outfit-historical.jpg" },
  { key: "uniform", label: "Uniform", icon: T + "outfit-uniform.jpg" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// ENVIRONMENT OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const SETTING_OPTIONS: ForgeOption[] = [
  { key: "chinese-traditional", label: "Chinese Traditional" },
  { key: "japanese", label: "Japanese" },
  { key: "korean", label: "Korean" },
  { key: "southeast-asian", label: "Southeast Asian" },
  { key: "indian", label: "Indian" },
  { key: "middle-eastern", label: "Middle Eastern" },
  { key: "medieval-european", label: "Medieval European" },
  { key: "victorian", label: "Victorian" },
  { key: "gothic", label: "Gothic" },
  { key: "modern", label: "Modern" },
  { key: "industrial", label: "Industrial" },
  { key: "futuristic", label: "Futuristic" },
  { key: "cyberpunk", label: "Cyberpunk" },
  { key: "fantasy", label: "Fantasy" },
  { key: "post-apocalyptic", label: "Post-Apocalyptic" },
  { key: "nature", label: "Nature" },
];

const SUB_SETTING_OPTIONS: Record<string, ForgeOption[]> = {
  "chinese-traditional": [
    { key: "imperial-palace", label: "Imperial Palace" },
    { key: "mountain-temple", label: "Mountain Temple" },
    { key: "bamboo-forest", label: "Bamboo Forest" },
    { key: "tea-house", label: "Tea House" },
    { key: "fortress", label: "Fortress" },
    { key: "village", label: "Village" },
    { key: "marketplace", label: "Marketplace" },
  ],
  "japanese": [
    { key: "shrine", label: "Shrine" },
    { key: "castle", label: "Castle" },
    { key: "zen-garden", label: "Zen Garden" },
    { key: "village", label: "Village" },
    { key: "onsen", label: "Onsen" },
    { key: "dojo", label: "Dojo" },
  ],
  "korean": [
    { key: "palace", label: "Palace" },
    { key: "hanok-village", label: "Hanok Village" },
    { key: "temple", label: "Temple" },
    { key: "marketplace", label: "Marketplace" },
  ],
  "southeast-asian": [
    { key: "temple-complex", label: "Temple Complex" },
    { key: "floating-market", label: "Floating Market" },
    { key: "jungle-ruins", label: "Jungle Ruins" },
    { key: "rice-terraces", label: "Rice Terraces" },
  ],
  "indian": [
    { key: "palace", label: "Palace" },
    { key: "temple", label: "Temple" },
    { key: "bazaar", label: "Bazaar" },
    { key: "garden", label: "Garden" },
    { key: "fort", label: "Fort" },
  ],
  "middle-eastern": [
    { key: "palace", label: "Palace" },
    { key: "bazaar", label: "Bazaar" },
    { key: "desert-oasis", label: "Desert Oasis" },
    { key: "mosque", label: "Mosque" },
    { key: "caravanserai", label: "Caravanserai" },
  ],
  "medieval-european": [
    { key: "castle", label: "Castle" },
    { key: "cathedral", label: "Cathedral" },
    { key: "village", label: "Village" },
    { key: "tavern", label: "Tavern" },
    { key: "dungeon", label: "Dungeon" },
    { key: "battlefield", label: "Battlefield" },
  ],
  "victorian": [
    { key: "mansion", label: "Mansion" },
    { key: "factory", label: "Factory" },
    { key: "street", label: "Street" },
    { key: "parlor", label: "Parlor" },
    { key: "train-station", label: "Train Station" },
  ],
  "gothic": [
    { key: "cathedral", label: "Cathedral" },
    { key: "graveyard", label: "Graveyard" },
    { key: "haunted-manor", label: "Haunted Manor" },
    { key: "crypt", label: "Crypt" },
  ],
  "modern": [
    { key: "office", label: "Office" },
    { key: "apartment", label: "Apartment" },
    { key: "warehouse", label: "Warehouse" },
    { key: "rooftop", label: "Rooftop" },
    { key: "street", label: "Street" },
    { key: "cafe", label: "Cafe" },
    { key: "subway", label: "Subway" },
  ],
  "industrial": [
    { key: "factory", label: "Factory" },
    { key: "shipyard", label: "Shipyard" },
    { key: "mine", label: "Mine" },
    { key: "power-plant", label: "Power Plant" },
    { key: "refinery", label: "Refinery" },
  ],
  "futuristic": [
    { key: "space-station", label: "Space Station" },
    { key: "colony", label: "Colony" },
    { key: "lab", label: "Lab" },
    { key: "bridge", label: "Bridge" },
    { key: "megacity", label: "Megacity" },
  ],
  "cyberpunk": [
    { key: "neon-alley", label: "Neon Alley" },
    { key: "underground-club", label: "Underground Club" },
    { key: "hacker-den", label: "Hacker Den" },
    { key: "megacorp-tower", label: "Megacorp Tower" },
    { key: "black-market", label: "Black Market" },
  ],
  "fantasy": [
    { key: "enchanted-forest", label: "Enchanted Forest" },
    { key: "crystal-cave", label: "Crystal Cave" },
    { key: "floating-island", label: "Floating Island" },
    { key: "dark-tower", label: "Dark Tower" },
    { key: "elven-city", label: "Elven City" },
    { key: "dragon-lair", label: "Dragon Lair" },
  ],
  "post-apocalyptic": [
    { key: "ruins", label: "Ruins" },
    { key: "wasteland", label: "Wasteland" },
    { key: "bunker", label: "Bunker" },
    { key: "overgrown-city", label: "Overgrown City" },
    { key: "survivor-camp", label: "Survivor Camp" },
  ],
  "nature": [
    { key: "beach", label: "Beach" },
    { key: "mountain", label: "Mountain" },
    { key: "desert", label: "Desert" },
    { key: "rainforest", label: "Rainforest" },
    { key: "tundra", label: "Tundra" },
    { key: "waterfall", label: "Waterfall" },
    { key: "volcano", label: "Volcano" },
  ],
};

const TIME_OF_DAY_OPTIONS: ForgeOption[] = [
  { key: "dawn", label: "Dawn" },
  { key: "morning", label: "Morning" },
  { key: "noon", label: "Noon" },
  { key: "afternoon", label: "Afternoon" },
  { key: "golden-hour", label: "Golden Hour" },
  { key: "sunset", label: "Sunset" },
  { key: "dusk", label: "Dusk" },
  { key: "night", label: "Night" },
  { key: "midnight", label: "Midnight" },
];

const WEATHER_OPTIONS: ForgeOption[] = [
  { key: "clear", label: "Clear" },
  { key: "cloudy", label: "Cloudy" },
  { key: "rainy", label: "Rainy" },
  { key: "foggy", label: "Foggy" },
  { key: "snowy", label: "Snowy" },
  { key: "stormy", label: "Stormy" },
  { key: "dusty", label: "Dusty" },
  { key: "misty", label: "Misty" },
];

const MOOD_OPTIONS: ForgeOption[] = [
  { key: "cozy", label: "Cozy" },
  { key: "eerie", label: "Eerie" },
  { key: "grand", label: "Grand" },
  { key: "intimate", label: "Intimate" },
  { key: "vast", label: "Vast" },
  { key: "claustrophobic", label: "Claustrophobic" },
  { key: "serene", label: "Serene" },
  { key: "chaotic", label: "Chaotic" },
  { key: "mysterious", label: "Mysterious" },
  { key: "romantic", label: "Romantic" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PROP OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const PROP_CATEGORY_OPTIONS: ForgeOption[] = [
  { key: "vehicle", label: "Vehicle" },
  { key: "weapon", label: "Weapon" },
  { key: "tool", label: "Tool" },
  { key: "furniture", label: "Furniture" },
  { key: "food", label: "Food" },
  { key: "technology", label: "Technology" },
  { key: "clothing-accessory", label: "Clothing/Accessory" },
  { key: "natural", label: "Natural" },
  { key: "container", label: "Container" },
  { key: "musical-instrument", label: "Musical Instrument" },
  { key: "misc", label: "Misc" },
];

const PROP_MATERIAL_OPTIONS: ForgeOption[] = [
  { key: "metal", label: "Metal" },
  { key: "wood", label: "Wood" },
  { key: "plastic", label: "Plastic" },
  { key: "glass", label: "Glass" },
  { key: "leather", label: "Leather" },
  { key: "stone", label: "Stone" },
  { key: "fabric", label: "Fabric" },
  { key: "crystal", label: "Crystal" },
  { key: "ceramic", label: "Ceramic" },
  { key: "bone", label: "Bone" },
];

const PROP_ERA_OPTIONS: ForgeOption[] = [
  { key: "ancient", label: "Ancient" },
  { key: "medieval", label: "Medieval" },
  { key: "victorian", label: "Victorian" },
  { key: "modern", label: "Modern" },
  { key: "futuristic", label: "Futuristic" },
  { key: "steampunk", label: "Steampunk" },
  { key: "vintage", label: "Vintage" },
  { key: "minimalist", label: "Minimalist" },
];

const PROP_SIZE_OPTIONS: ForgeOption[] = [
  { key: "tiny", label: "Tiny" },
  { key: "small", label: "Small" },
  { key: "medium", label: "Medium" },
  { key: "large", label: "Large" },
  { key: "massive", label: "Massive" },
];

const PROP_CONDITION_OPTIONS: ForgeOption[] = [
  { key: "pristine", label: "Pristine" },
  { key: "new", label: "New" },
  { key: "worn", label: "Worn" },
  { key: "damaged", label: "Damaged" },
  { key: "ancient", label: "Ancient" },
  { key: "weathered", label: "Weathered" },
  { key: "rusted", label: "Rusted" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// STEP DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

// Human-specific character steps
const HUMAN_CHARACTER_STEPS: ForgeStep[] = [
  {
    key: "identity",
    label: "Identity",
    hasSubTabs: true,
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Sarah Chen", required: true },
      { key: "gender", label: "Gender", type: "carousel", options: GENDER_OPTIONS },
      { key: "ageRange", label: "Age", type: "carousel", options: AGE_OPTIONS },
      { key: "ethnicity", label: "Ethnicity", type: "carousel", options: ETHNICITY_OPTIONS },
    ],
  },
  {
    key: "era",
    label: "Era",
    fields: [
      { key: "era", label: "What period is your story set in?", type: "era-slider", options: ERA_OPTIONS },
    ],
  },
  {
    key: "physique",
    label: "Physical Appearance",
    hasSubTabs: true,
    fields: [
      { key: "build", label: "Build", type: "carousel", options: BUILD_OPTIONS },
      { key: "height", label: "Height", type: "era-slider", options: HEIGHT_OPTIONS },
      { key: "eyeColor", label: "Eye Color", type: "carousel", options: EYE_COLOR_OPTIONS },
      { key: "hairStyle", label: "Hair Style", type: "carousel", options: HAIR_STYLE_OPTIONS },
      { key: "hairTexture", label: "Hair Texture", type: "carousel", options: HAIR_TEXTURE_OPTIONS },
      { key: "hairColor", label: "Hair Color", type: "carousel", options: HAIR_COLOR_OPTIONS },
      { key: "facialHair", label: "Facial Hair", type: "carousel", options: FACIAL_HAIR_OPTIONS },
    ],
  },
  {
    key: "personality",
    label: "Personality",
    hasSubTabs: true,
    fields: [
      { key: "archetype", label: "Archetype", type: "carousel", options: ARCHETYPE_OPTIONS },
      { key: "expression", label: "Expression", type: "carousel", options: EXPRESSION_OPTIONS },
    ],
  },
  {
    key: "details",
    label: "Details",
    hasSubTabs: true,
    fields: [
      { key: "details", label: "Features", type: "multi-carousel", options: DETAIL_PRESETS },
      { key: "detailsCustom", label: "Custom", type: "textarea", placeholder: "e.g. a slight scar on her cheek, tattoo of a dragon on left forearm, birthmark near the jawline..." },
    ],
  },
  {
    key: "outfit",
    label: "Outfit",
    hasSubTabs: true,
    fields: [
      { key: "outfit", label: "Style", type: "carousel", options: OUTFIT_OPTIONS },
      { key: "outfitCustom", label: "Custom", type: "textarea", placeholder: "e.g. black leather jacket with silver zippers, dark slim-fit pants, combat boots, fingerless gloves, silver chain necklace..." },
    ],
  },
  {
    key: "references",
    label: "Generate",
    fields: [
      { key: "ref_face", label: "Face", type: "image-upload", placeholder: "Upload a face / headshot reference" },
      { key: "ref_outfit", label: "Outfit", type: "image-upload", placeholder: "Upload an outfit / clothing reference" },
      { key: "ref_fullBody", label: "Full Body", type: "image-upload", placeholder: "Upload a full body reference (overrides face+outfit)" },
    ],
  },
];

// Non-human character steps — simple: type + describe it, upload references, pick prompt template
const NON_HUMAN_CHARACTER_STEPS: ForgeStep[] = [
  {
    key: "identity",
    label: "Identity",
    fields: [
      { key: "name", label: "Character Name", type: "text", placeholder: "e.g. ATLAS-7, Shadow Lurker, Phantom Queen", required: true },
      { key: "characterKind", label: "What is this character?", type: "combobox", options: NON_HUMAN_TYPE_PRESETS, placeholder: "e.g. Ghost, Mecha Robot, Shadow Dragon..." },
      { key: "description", label: "Description", type: "textarea", placeholder: "Describe appearance in detail — shape, material, colors, features, size, abilities, personality, backstory..." },
    ],
  },
  {
    key: "era",
    label: "Era",
    fields: [
      { key: "era", label: "What period is your story set in?", type: "era-slider", options: ERA_OPTIONS },
    ],
  },
  {
    key: "references",
    label: "Generate",
    fields: [
      { key: "ref_head", label: "Head", type: "image-upload", placeholder: "Upload a head / face reference" },
      { key: "ref_body", label: "Body", type: "image-upload", placeholder: "Upload a body / torso reference" },
      { key: "ref_fullBody", label: "Full Body", type: "image-upload", placeholder: "Upload a full body reference (overrides head+body)" },
    ],
  },
];

export const ENVIRONMENT_STEPS: ForgeStep[] = [
  {
    key: "setting",
    label: "Setting",
    hasSubTabs: true,
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Dragon Gate Temple", required: true },
      { key: "setting", label: "Setting", type: "carousel", options: SETTING_OPTIONS },
      { key: "subSetting", label: "Location", type: "two-level", subOptions: SUB_SETTING_OPTIONS },
    ],
  },
  {
    key: "atmosphere",
    label: "Atmosphere",
    hasSubTabs: true,
    fields: [
      { key: "timeOfDay", label: "Time of Day", type: "carousel", options: TIME_OF_DAY_OPTIONS },
      { key: "weather", label: "Weather", type: "carousel", options: WEATHER_OPTIONS },
    ],
  },
  {
    key: "mood",
    label: "Mood & Details",
    hasSubTabs: true,
    fields: [
      { key: "mood", label: "Mood", type: "carousel", options: MOOD_OPTIONS },
      { key: "keyFeatures", label: "Features", type: "text", placeholder: "e.g. stone walls, red lanterns, mountain backdrop" },
      { key: "customNotes", label: "Notes", type: "text", placeholder: "Any extra details..." },
    ],
  },
];

export const PROP_STEPS: ForgeStep[] = [
  {
    key: "basics",
    label: "Basics",
    hasSubTabs: true,
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Dragon's Blade", required: true },
      { key: "category", label: "Category", type: "carousel", options: PROP_CATEGORY_OPTIONS },
    ],
  },
  {
    key: "appearance",
    label: "Appearance",
    fields: [
      { key: "material", label: "Material", type: "button-group", options: PROP_MATERIAL_OPTIONS },
      { key: "era", label: "Era / Style", type: "button-group", options: PROP_ERA_OPTIONS },
      { key: "size", label: "Size", type: "button-group", options: PROP_SIZE_OPTIONS },
      { key: "condition", label: "Condition", type: "button-group", options: PROP_CONDITION_OPTIONS },
    ],
  },
  {
    key: "details",
    label: "Details",
    fields: [
      { key: "details", label: "Description", type: "text", placeholder: "e.g. ornate dragon engravings on the blade" },
      { key: "customNotes", label: "Additional Notes", type: "text", placeholder: "Any extra details..." },
    ],
  },
];

/** Simple mode: only identity + generate (prompt tab added separately in ElementForge) */
const SIMPLE_TABS: Record<string, string[]> = {
  character: ["identity"],
  environment: ["setting"],
  prop: ["basics"],
};

export function getStepsForType(type: ForgeElementType, characterType?: string, isSimple?: boolean): ForgeStep[] {
  let steps: ForgeStep[];
  switch (type) {
    case "character":
      steps = (characterType && characterType !== "human") ? NON_HUMAN_CHARACTER_STEPS : HUMAN_CHARACTER_STEPS;
      break;
    case "environment":
      steps = ENVIRONMENT_STEPS;
      break;
    case "prop":
      steps = PROP_STEPS;
      break;
  }
  if (isSimple) {
    const allowedKeys = SIMPLE_TABS[type] || ["identity", "references"];
    return steps.filter(s => allowedKeys.includes(s.key));
  }
  return steps;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════

function labelFor(options: ForgeOption[], key: string): string {
  return options.find(o => o.key === key)?.label ?? key;
}

export function composeCharacterPrompt(identity: Record<string, any>): string {
  // Era prefix (shared between human and non-human)
  const eraPart = identity.era ? labelFor(ERA_OPTIONS, identity.era) : "";

  // ── Non-human: simple composition from kind + era + description ──
  if (identity.characterKind || identity.isNonHuman) {
    const parts: string[] = [];
    const kind = identity.characterKind || "character";
    if (eraPart) {
      parts.push(`A ${eraPart}-era ${kind}`);
    } else {
      parts.push(`A ${kind}`);
    }
    if (identity.description?.trim()) parts.push(identity.description.trim());
    return parts.join(". ").replace(/\.\s*$/, "") + ".";
  }

  // ── Human: full structured composition ──
  const parts: string[] = [];

  const agePart = identity.ageRange ? labelFor(AGE_OPTIONS, identity.ageRange).toLowerCase() : "";
  const ethPart = identity.ethnicity ? labelFor(ETHNICITY_OPTIONS, identity.ethnicity) : "";
  const genPart = identity.gender ? labelFor(GENDER_OPTIONS, identity.gender).toLowerCase() : "";

  const baseParts = [eraPart ? `${eraPart}-era` : "", agePart, ethPart, genPart].filter(Boolean);
  if (baseParts.length > 0) {
    parts.push(`A ${baseParts.join(" ")}`);
  }

  if (identity.build) parts.push(`${labelFor(BUILD_OPTIONS, identity.build).toLowerCase()} build`);
  if (identity.height) parts.push(labelFor(HEIGHT_OPTIONS, identity.height).toLowerCase());

  // Hair: combine color + texture + style
  const hairParts: string[] = [];
  if (identity.hairColor) hairParts.push(labelFor(HAIR_COLOR_OPTIONS, identity.hairColor).toLowerCase());
  if (identity.hairTexture) hairParts.push(labelFor(HAIR_TEXTURE_OPTIONS, identity.hairTexture).toLowerCase());
  if (identity.hairStyle) hairParts.push(labelFor(HAIR_STYLE_OPTIONS, identity.hairStyle).toLowerCase());
  if (hairParts.length > 0) parts.push(`${hairParts.join(" ")} hair`);

  if (identity.eyeColor) parts.push(`${labelFor(EYE_COLOR_OPTIONS, identity.eyeColor).toLowerCase()} eyes`);
  if (identity.facialHair && identity.facialHair !== "clean-shaven") {
    parts.push(`with ${labelFor(FACIAL_HAIR_OPTIONS, identity.facialHair).toLowerCase()}`);
  }
  if (identity.archetype) parts.push(`${labelFor(ARCHETYPE_OPTIONS, identity.archetype)} archetype`);
  if (identity.expression) parts.push(`${labelFor(EXPRESSION_OPTIONS, identity.expression).toLowerCase()} expression`);

  const detailList: string[] = [];
  if (Array.isArray(identity.details)) {
    detailList.push(...identity.details.map((d: string) => labelFor(DETAIL_PRESETS, d).toLowerCase()));
  }
  if (identity.detailsCustom?.trim()) detailList.push(identity.detailsCustom.trim());
  if (detailList.length > 0) parts.push(detailList.join(", "));

  if (identity.outfitCustom?.trim()) {
    parts.push(`wearing ${identity.outfitCustom.trim()}`);
  } else if (identity.outfit) {
    parts.push(`wearing ${labelFor(OUTFIT_OPTIONS, identity.outfit).toLowerCase()} clothing`);
  }

  if (identity.customNotes?.trim()) parts.push(identity.customNotes.trim());

  return parts.join(", ").replace(/,\s*$/, "") + ".";
}

export function composeEnvironmentPrompt(identity: Record<string, any>): string {
  const parts: string[] = [];

  // Setting
  if (identity.setting && identity.subSetting) {
    const settingLabel = labelFor(SETTING_OPTIONS, identity.setting);
    const subLabel = labelFor(SUB_SETTING_OPTIONS[identity.setting] || [], identity.subSetting);
    parts.push(`A ${settingLabel} ${subLabel}`);
  } else if (identity.setting) {
    parts.push(`A ${labelFor(SETTING_OPTIONS, identity.setting)} setting`);
  }

  // Atmosphere
  if (identity.timeOfDay) parts.push(`at ${labelFor(TIME_OF_DAY_OPTIONS, identity.timeOfDay).toLowerCase()}`);
  if (identity.weather) parts.push(`${labelFor(WEATHER_OPTIONS, identity.weather).toLowerCase()} weather`);

  // Mood
  if (identity.mood) parts.push(`${labelFor(MOOD_OPTIONS, identity.mood).toLowerCase()} atmosphere`);

  // Features
  if (identity.keyFeatures?.trim()) parts.push(`with ${identity.keyFeatures.trim()}`);

  // Notes
  if (identity.customNotes?.trim()) parts.push(identity.customNotes.trim());

  return parts.join(", ").replace(/,\s*$/, "") + ".";
}

export function composePropPrompt(identity: Record<string, any>): string {
  const parts: string[] = [];

  // Category + era
  const catPart = identity.category ? labelFor(PROP_CATEGORY_OPTIONS, identity.category).toLowerCase() : "";
  const eraPart = identity.era ? labelFor(PROP_ERA_OPTIONS, identity.era).toLowerCase() : "";

  if (eraPart && catPart) {
    parts.push(`A ${eraPart} ${catPart}`);
  } else if (catPart) {
    parts.push(`A ${catPart}`);
  }

  // Material & size & condition
  if (identity.material) parts.push(`made of ${labelFor(PROP_MATERIAL_OPTIONS, identity.material).toLowerCase()}`);
  if (identity.size) parts.push(`${labelFor(PROP_SIZE_OPTIONS, identity.size).toLowerCase()} sized`);
  if (identity.condition) parts.push(`${labelFor(PROP_CONDITION_OPTIONS, identity.condition).toLowerCase()} condition`);

  // Details
  if (identity.details?.trim()) parts.push(identity.details.trim());

  // Notes
  if (identity.customNotes?.trim()) parts.push(identity.customNotes.trim());

  return parts.join(", ").replace(/,\s*$/, "") + ".";
}

export function composePrompt(type: ForgeElementType, identity: Record<string, any>): string {
  switch (type) {
    case "character": return composeCharacterPrompt(identity);
    case "environment": return composeEnvironmentPrompt(identity);
    case "prop": return composePropPrompt(identity);
  }
}

/**
 * Build override instructions for image-to-image models.
 * When reference photos are provided, the model tends to copy visual features
 * (hair color, eye color, etc.) from the image instead of following the prompt.
 * This returns explicit override text to append to the prompt.
 */
export function composeImageOverrides(identity: Record<string, any>): string {
  const overrides: string[] = [];

  if (identity.hairColor) {
    const color = labelFor(HAIR_COLOR_OPTIONS, identity.hairColor).toLowerCase();
    overrides.push(`hair color must be ${color}`);
  }
  if (identity.eyeColor) {
    const color = labelFor(EYE_COLOR_OPTIONS, identity.eyeColor).toLowerCase();
    overrides.push(`eye color must be ${color}`);
  }
  if (identity.ethnicity) {
    overrides.push(`${labelFor(ETHNICITY_OPTIONS, identity.ethnicity)} ethnicity`);
  }

  if (identity.ref_outfit) {
    overrides.push(`the character MUST wear the exact outfit shown in the second reference image (@Image2) — preserve its design, colors, materials, and silhouette faithfully`);
  }

  if (overrides.length === 0) return "";
  return `\n\nIMPORTANT — override the reference image for these attributes: ${overrides.join(". ")}. Follow the text description, not the reference photo, for these features.`;
}

// ═══════════════════════════════════════════════════════════════════════════════
// BADGE HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

/** Get all non-empty identity values as display badges */
export function getIdentityBadges(type: ForgeElementType, identity: Record<string, any>): { key: string; label: string }[] {
  const badges: { key: string; label: string }[] = [];
  const steps = getStepsForType(type);

  for (const step of steps) {
    for (const field of step.fields) {
      const val = identity[field.key];
      if (!val || field.key === "name" || field.type === "image-upload") continue;

      if (field.type === "multi-select" && Array.isArray(val)) {
        for (const v of val) {
          const opt = field.options?.find(o => o.key === v);
          badges.push({ key: `${field.key}:${v}`, label: opt?.label ?? v });
        }
      } else if (field.type === "text") {
        if (typeof val === "string" && val.trim()) {
          badges.push({ key: field.key, label: val.trim().length > 20 ? val.trim().slice(0, 20) + "..." : val.trim() });
        }
      } else if (field.type === "two-level") {
        // Sub-setting — show label from parent's subOptions
        const parentVal = identity.setting;
        if (parentVal && field.subOptions?.[parentVal]) {
          const opt = field.subOptions[parentVal].find((o: ForgeOption) => o.key === val);
          badges.push({ key: field.key, label: opt?.label ?? val });
        }
      } else {
        const opt = field.options?.find(o => o.key === val);
        badges.push({ key: field.key, label: opt?.label ?? val });
      }
    }
  }

  return badges;
}

/** Randomize identity for a given type */
export function randomizeIdentity(type: ForgeElementType): Record<string, any> {
  const pick = (opts: ForgeOption[]) => opts[Math.floor(Math.random() * opts.length)]?.key;

  if (type === "character") {
    return {
      gender: pick(GENDER_OPTIONS),
      ageRange: pick(AGE_OPTIONS),
      ethnicity: pick(ETHNICITY_OPTIONS),
      build: pick(BUILD_OPTIONS),
      height: pick(HEIGHT_OPTIONS),
      hairColor: pick(HAIR_COLOR_OPTIONS),
      hairStyle: pick(HAIR_STYLE_OPTIONS),
      hairTexture: pick(HAIR_TEXTURE_OPTIONS),
      eyeColor: pick(EYE_COLOR_OPTIONS),
      facialHair: pick(FACIAL_HAIR_OPTIONS),
      archetype: pick(ARCHETYPE_OPTIONS),
      expression: pick(EXPRESSION_OPTIONS),
      details: [],
      outfit: pick(OUTFIT_OPTIONS),
      outfitCustom: "",
      detailsCustom: "",
      customNotes: "",
    };
  }

  if (type === "environment") {
    const setting = pick(SETTING_OPTIONS);
    const subs = SUB_SETTING_OPTIONS[setting] || [];
    return {
      setting,
      subSetting: subs.length > 0 ? pick(subs) : "",
      timeOfDay: pick(TIME_OF_DAY_OPTIONS),
      weather: pick(WEATHER_OPTIONS),
      mood: pick(MOOD_OPTIONS),
      keyFeatures: "",
      customNotes: "",
    };
  }

  // prop
  return {
    category: pick(PROP_CATEGORY_OPTIONS),
    material: pick(PROP_MATERIAL_OPTIONS),
    era: pick(PROP_ERA_OPTIONS),
    size: pick(PROP_SIZE_OPTIONS),
    condition: pick(PROP_CONDITION_OPTIONS),
    details: "",
    customNotes: "",
  };
}
