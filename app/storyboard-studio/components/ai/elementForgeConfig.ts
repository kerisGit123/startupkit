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
}

export interface ForgeField {
  key: string;
  label: string;
  type: "button-group" | "visual-grid" | "color-dots" | "multi-select" | "text" | "dropdown" | "two-level";
  options?: ForgeOption[];
  subOptions?: Record<string, ForgeOption[]>; // For two-level fields
  placeholder?: string;
  required?: boolean;
  columns?: number; // Grid columns for visual-grid
}

// ═══════════════════════════════════════════════════════════════════════════════
// CHARACTER OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const GENDER_OPTIONS: ForgeOption[] = [
  { key: "male", label: "Male" },
  { key: "female", label: "Female" },
  { key: "non-binary", label: "Non-binary" },
  { key: "other", label: "Other" },
];

const AGE_OPTIONS: ForgeOption[] = [
  { key: "child", label: "Child" },
  { key: "teen", label: "Teen" },
  { key: "young-adult", label: "Young Adult" },
  { key: "adult", label: "Adult" },
  { key: "middle-aged", label: "Middle-aged" },
  { key: "elderly", label: "Elderly" },
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
  { key: "slim", label: "Slim" },
  { key: "average", label: "Average" },
  { key: "athletic", label: "Athletic" },
  { key: "muscular", label: "Muscular" },
  { key: "stocky", label: "Stocky" },
];

const HEIGHT_OPTIONS: ForgeOption[] = [
  { key: "short", label: "Short" },
  { key: "average", label: "Average" },
  { key: "tall", label: "Tall" },
];

const HAIR_COLOR_OPTIONS: ForgeOption[] = [
  { key: "black", label: "Black", color: "#1a1a1a" },
  { key: "brown", label: "Brown", color: "#5c3317" },
  { key: "blonde", label: "Blonde", color: "#d4a853" },
  { key: "red", label: "Red", color: "#a0522d" },
  { key: "white", label: "White/Gray", color: "#c0c0c0" },
  { key: "blue", label: "Blue", color: "#4a90e2" },
  { key: "pink", label: "Pink", color: "#e27a9e" },
  { key: "green", label: "Green", color: "#4a9e6e" },
];

const HAIR_STYLE_OPTIONS: ForgeOption[] = [
  { key: "short-straight", label: "Short Straight" },
  { key: "short-curly", label: "Short Curly" },
  { key: "medium-straight", label: "Medium Straight" },
  { key: "medium-wavy", label: "Medium Wavy" },
  { key: "long-straight", label: "Long Straight" },
  { key: "long-curly", label: "Long Curly" },
  { key: "long-wavy", label: "Long Wavy" },
  { key: "braids", label: "Braids" },
  { key: "bald", label: "Bald" },
  { key: "buzz-cut", label: "Buzz Cut" },
];

const EYE_COLOR_OPTIONS: ForgeOption[] = [
  { key: "brown", label: "Brown", color: "#5c3317" },
  { key: "blue", label: "Blue", color: "#4a90e2" },
  { key: "green", label: "Green", color: "#2e8b57" },
  { key: "hazel", label: "Hazel", color: "#8e7618" },
  { key: "gray", label: "Gray", color: "#808080" },
  { key: "amber", label: "Amber", color: "#cf8a00" },
];

const ARCHETYPE_OPTIONS: ForgeOption[] = [
  { key: "hero", label: "Hero" },
  { key: "rebel", label: "Rebel" },
  { key: "innocent", label: "Innocent" },
  { key: "everyman", label: "Everyman" },
  { key: "explorer", label: "Explorer" },
  { key: "caregiver", label: "Caregiver" },
  { key: "trickster", label: "Trickster" },
  { key: "sage", label: "Sage" },
];

const EXPRESSION_OPTIONS: ForgeOption[] = [
  { key: "neutral", label: "Neutral" },
  { key: "happy", label: "Happy" },
  { key: "serious", label: "Serious" },
  { key: "angry", label: "Angry" },
  { key: "sad", label: "Sad" },
  { key: "confident", label: "Confident" },
  { key: "mysterious", label: "Mysterious" },
  { key: "fearful", label: "Fearful" },
];

const DETAIL_PRESETS: ForgeOption[] = [
  { key: "scar", label: "Scar" },
  { key: "freckles", label: "Freckles" },
  { key: "tattoos", label: "Tattoos" },
  { key: "eye-patch", label: "Eye Patch" },
  { key: "glasses", label: "Glasses" },
  { key: "beard", label: "Beard" },
  { key: "moustache", label: "Moustache" },
  { key: "piercing", label: "Piercing" },
];

const OUTFIT_OPTIONS: ForgeOption[] = [
  { key: "casual", label: "Casual" },
  { key: "formal", label: "Formal" },
  { key: "streetwear", label: "Streetwear" },
  { key: "high-fashion", label: "High Fashion" },
  { key: "military", label: "Military" },
  { key: "sporty", label: "Sporty" },
  { key: "fantasy", label: "Fantasy" },
  { key: "sci-fi", label: "Sci-fi" },
  { key: "historical", label: "Historical" },
  { key: "uniform", label: "Uniform" },
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

export const CHARACTER_STEPS: ForgeStep[] = [
  {
    key: "identity",
    label: "Identity",
    fields: [
      { key: "name", label: "Character Name", type: "text", placeholder: "e.g. Sarah Chen", required: true },
      { key: "gender", label: "Gender", type: "button-group", options: GENDER_OPTIONS },
      { key: "ageRange", label: "Age", type: "button-group", options: AGE_OPTIONS },
      { key: "ethnicity", label: "Ethnicity", type: "button-group", options: ETHNICITY_OPTIONS },
    ],
  },
  {
    key: "physique",
    label: "Physique",
    fields: [
      { key: "build", label: "Build", type: "visual-grid", options: BUILD_OPTIONS, columns: 5 },
      { key: "height", label: "Height", type: "button-group", options: HEIGHT_OPTIONS },
      { key: "hairColor", label: "Hair Color", type: "color-dots", options: HAIR_COLOR_OPTIONS },
      { key: "hairStyle", label: "Hair Style", type: "button-group", options: HAIR_STYLE_OPTIONS },
      { key: "eyeColor", label: "Eye Color", type: "color-dots", options: EYE_COLOR_OPTIONS },
    ],
  },
  {
    key: "personality",
    label: "Personality",
    fields: [
      { key: "archetype", label: "Archetype", type: "visual-grid", options: ARCHETYPE_OPTIONS, columns: 4 },
      { key: "expression", label: "Expression", type: "button-group", options: EXPRESSION_OPTIONS },
    ],
  },
  {
    key: "details",
    label: "Details",
    fields: [
      { key: "details", label: "Distinguishing Features", type: "multi-select", options: DETAIL_PRESETS },
      { key: "detailsCustom", label: "Custom Details", type: "text", placeholder: "e.g. a slight scar on her cheek" },
    ],
  },
  {
    key: "outfit",
    label: "Outfit",
    fields: [
      { key: "outfit", label: "Outfit Style", type: "visual-grid", options: OUTFIT_OPTIONS, columns: 5 },
      { key: "outfitCustom", label: "Custom Outfit", type: "text", placeholder: "e.g. black leather jacket, dark pants" },
    ],
  },
];

export const ENVIRONMENT_STEPS: ForgeStep[] = [
  {
    key: "setting",
    label: "Setting",
    fields: [
      { key: "name", label: "Location Name", type: "text", placeholder: "e.g. Dragon Gate Temple", required: true },
      { key: "setting", label: "Setting", type: "visual-grid", options: SETTING_OPTIONS, columns: 4 },
      { key: "subSetting", label: "Sub-Setting", type: "two-level", subOptions: SUB_SETTING_OPTIONS, columns: 4 },
    ],
  },
  {
    key: "atmosphere",
    label: "Atmosphere",
    fields: [
      { key: "timeOfDay", label: "Time of Day", type: "button-group", options: TIME_OF_DAY_OPTIONS },
      { key: "weather", label: "Weather", type: "button-group", options: WEATHER_OPTIONS },
    ],
  },
  {
    key: "mood",
    label: "Mood & Details",
    fields: [
      { key: "mood", label: "Mood", type: "visual-grid", options: MOOD_OPTIONS, columns: 5 },
      { key: "keyFeatures", label: "Key Features", type: "text", placeholder: "e.g. stone walls, red lanterns, mountain backdrop" },
      { key: "customNotes", label: "Additional Notes", type: "text", placeholder: "Any extra details..." },
    ],
  },
];

export const PROP_STEPS: ForgeStep[] = [
  {
    key: "basics",
    label: "Basics",
    fields: [
      { key: "name", label: "Prop Name", type: "text", placeholder: "e.g. Dragon's Blade", required: true },
      { key: "category", label: "Category", type: "visual-grid", options: PROP_CATEGORY_OPTIONS, columns: 4 },
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

export function getStepsForType(type: ForgeElementType): ForgeStep[] {
  switch (type) {
    case "character": return CHARACTER_STEPS;
    case "environment": return ENVIRONMENT_STEPS;
    case "prop": return PROP_STEPS;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT COMPOSITION
// ═══════════════════════════════════════════════════════════════════════════════

function labelFor(options: ForgeOption[], key: string): string {
  return options.find(o => o.key === key)?.label ?? key;
}

export function composeCharacterPrompt(identity: Record<string, any>): string {
  const parts: string[] = [];

  // Base: "A [age] [ethnicity] [gender]"
  const agePart = identity.ageRange ? labelFor(AGE_OPTIONS, identity.ageRange).toLowerCase() : "";
  const ethPart = identity.ethnicity ? labelFor(ETHNICITY_OPTIONS, identity.ethnicity) : "";
  const genPart = identity.gender ? labelFor(GENDER_OPTIONS, identity.gender).toLowerCase() : "";

  const baseParts = [agePart, ethPart, genPart].filter(Boolean);
  if (baseParts.length > 0) {
    parts.push(`A ${baseParts.join(" ")}`);
  }

  // Physique
  if (identity.build) parts.push(`${labelFor(BUILD_OPTIONS, identity.build).toLowerCase()} build`);
  if (identity.height) parts.push(labelFor(HEIGHT_OPTIONS, identity.height).toLowerCase());

  // Hair
  if (identity.hairColor && identity.hairStyle) {
    parts.push(`${labelFor(HAIR_COLOR_OPTIONS, identity.hairColor).toLowerCase()} ${labelFor(HAIR_STYLE_OPTIONS, identity.hairStyle).toLowerCase()} hair`);
  } else if (identity.hairColor) {
    parts.push(`${labelFor(HAIR_COLOR_OPTIONS, identity.hairColor).toLowerCase()} hair`);
  } else if (identity.hairStyle) {
    parts.push(`${labelFor(HAIR_STYLE_OPTIONS, identity.hairStyle).toLowerCase()} hair`);
  }

  // Eyes
  if (identity.eyeColor) parts.push(`${labelFor(EYE_COLOR_OPTIONS, identity.eyeColor).toLowerCase()} eyes`);

  // Archetype & expression
  if (identity.archetype) parts.push(`${labelFor(ARCHETYPE_OPTIONS, identity.archetype)} archetype`);
  if (identity.expression) parts.push(`${labelFor(EXPRESSION_OPTIONS, identity.expression).toLowerCase()} expression`);

  // Details
  const detailList: string[] = [];
  if (Array.isArray(identity.details)) {
    detailList.push(...identity.details.map((d: string) => labelFor(DETAIL_PRESETS, d).toLowerCase()));
  }
  if (identity.detailsCustom?.trim()) {
    detailList.push(identity.detailsCustom.trim());
  }
  if (detailList.length > 0) parts.push(detailList.join(", "));

  // Outfit
  if (identity.outfitCustom?.trim()) {
    parts.push(`wearing ${identity.outfitCustom.trim()}`);
  } else if (identity.outfit) {
    parts.push(`wearing ${labelFor(OUTFIT_OPTIONS, identity.outfit).toLowerCase()} clothing`);
  }

  // Custom notes
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
      if (!val || field.key === "name") continue;

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
      eyeColor: pick(EYE_COLOR_OPTIONS),
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
