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
  row?: string; // Group fields with same row value side-by-side
  collapsible?: boolean; // Start collapsed, expand on click
  pinned?: boolean; // Render above sub-tabs (always visible)
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
  { key: "east-asian", label: "East Asian", icon: T + "ethnicity-east-asian.jpg" },
  { key: "south-asian", label: "South Asian", icon: T + "ethnicity-south-asian.jpg" },
  { key: "southeast-asian", label: "Southeast Asian", icon: T + "ethnicity-southeast-asian.jpg" },
  { key: "black", label: "Black", icon: T + "ethnicity-black.jpg" },
  { key: "white", label: "White", icon: T + "ethnicity-white.jpg" },
  { key: "latino", label: "Latino", icon: T + "ethnicity-latino.jpg" },
  { key: "middle-eastern", label: "Middle Eastern", icon: T + "ethnicity-middle-eastern.jpg" },
  { key: "mixed", label: "Mixed", icon: T + "ethnicity-mixed.jpg" },
  { key: "other", label: "Other", icon: T + "ethnicity-other.jpg" },
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
  { key: "black", label: "Black", color: "#1a1a1a", icon: T + "hair-color-black.jpg" },
  { key: "brown", label: "Brown", color: "#5c3317", icon: T + "hair-color-brown.jpg" },
  { key: "blonde", label: "Blonde", color: "#d4a853", icon: T + "hair-color-blonde.jpg" },
  { key: "red", label: "Red", color: "#a0522d", icon: T + "hair-color-red.jpg" },
  { key: "white", label: "Silver White", color: "#c0c0c0", icon: T + "hair-color-white.jpg" },
  { key: "blue", label: "Blue", color: "#4a90e2", icon: T + "hair-color-blue.jpg" },
  { key: "pink", label: "Pink", color: "#e27a9e", icon: T + "hair-color-pink.jpg" },
  { key: "green", label: "Green", color: "#4a9e6e", icon: T + "hair-color-green.jpg" },
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
  { key: "villain", label: "Villain", icon: T + "archetype-villain.jpg" },
  { key: "lover", label: "Lover", icon: T + "archetype-lover.jpg" },
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
  { key: "chinese-traditional", label: "Chinese Traditional", icon: T + "env-set-chinese-traditional.jpg" },
  { key: "japanese", label: "Japanese", icon: T + "env-set-japanese.jpg" },
  { key: "korean", label: "Korean", icon: T + "env-set-korean.jpg" },
  { key: "southeast-asian", label: "Southeast Asian", icon: T + "env-set-southeast-asian.jpg" },
  { key: "indian", label: "Indian", icon: T + "env-set-indian.jpg" },
  { key: "middle-eastern", label: "Middle Eastern", icon: T + "env-set-middle-eastern.jpg" },
  { key: "medieval-european", label: "Medieval European", icon: T + "env-set-medieval-european.jpg" },
  { key: "victorian", label: "Victorian", icon: T + "env-set-victorian.jpg" },
  { key: "gothic", label: "Gothic", icon: T + "env-set-gothic.jpg" },
  { key: "modern", label: "Modern", icon: T + "env-set-modern.jpg" },
  { key: "industrial", label: "Industrial", icon: T + "env-set-industrial.jpg" },
  { key: "futuristic", label: "Futuristic", icon: T + "env-set-futuristic.jpg" },
  { key: "cyberpunk", label: "Cyberpunk", icon: T + "env-set-cyberpunk.jpg" },
  { key: "fantasy", label: "Fantasy", icon: T + "env-set-fantasy.jpg" },
  { key: "post-apocalyptic", label: "Post-Apocalyptic", icon: T + "env-set-post-apocalyptic.jpg" },
  { key: "nature", label: "Nature", icon: T + "env-set-nature.jpg" },
];

const SUB_SETTING_OPTIONS: Record<string, ForgeOption[]> = {
  "chinese-traditional": [
    { key: "imperial-palace", label: "Imperial Palace", icon: T + "env-loc-imperial-palace.jpg" },
    { key: "mountain-temple", label: "Mountain Temple", icon: T + "env-loc-mountain-temple.jpg" },
    { key: "bamboo-forest", label: "Bamboo Forest", icon: T + "env-loc-bamboo-forest.jpg" },
    { key: "tea-house", label: "Tea House", icon: T + "env-loc-tea-house.jpg" },
    { key: "fortress", label: "Fortress", icon: T + "env-loc-cn-fortress.jpg" },
    { key: "village", label: "Village", icon: T + "env-loc-cn-village.jpg" },
    { key: "marketplace", label: "Marketplace", icon: T + "env-loc-cn-marketplace.jpg" },
  ],
  "japanese": [
    { key: "shrine", label: "Shrine", icon: T + "env-loc-shrine.jpg" },
    { key: "castle", label: "Castle", icon: T + "env-loc-jp-castle.jpg" },
    { key: "zen-garden", label: "Zen Garden", icon: T + "env-loc-zen-garden.jpg" },
    { key: "village", label: "Village", icon: T + "env-loc-jp-village.jpg" },
    { key: "onsen", label: "Onsen", icon: T + "env-loc-onsen.jpg" },
    { key: "dojo", label: "Dojo", icon: T + "env-loc-dojo.jpg" },
  ],
  "korean": [
    { key: "palace", label: "Palace", icon: T + "env-loc-kr-palace.jpg" },
    { key: "hanok-village", label: "Hanok Village", icon: T + "env-loc-hanok-village.jpg" },
    { key: "temple", label: "Temple", icon: T + "env-loc-kr-temple.jpg" },
    { key: "marketplace", label: "Marketplace", icon: T + "env-loc-kr-marketplace.jpg" },
  ],
  "southeast-asian": [
    { key: "temple-complex", label: "Temple Complex", icon: T + "env-loc-temple-complex.jpg" },
    { key: "floating-market", label: "Floating Market", icon: T + "env-loc-floating-market.jpg" },
    { key: "jungle-ruins", label: "Jungle Ruins", icon: T + "env-loc-jungle-ruins.jpg" },
    { key: "rice-terraces", label: "Rice Terraces", icon: T + "env-loc-rice-terraces.jpg" },
  ],
  "indian": [
    { key: "palace", label: "Palace", icon: T + "env-loc-in-palace.jpg" },
    { key: "temple", label: "Temple", icon: T + "env-loc-in-temple.jpg" },
    { key: "bazaar", label: "Bazaar", icon: T + "env-loc-in-bazaar.jpg" },
    { key: "garden", label: "Garden", icon: T + "env-loc-in-garden.jpg" },
    { key: "fort", label: "Fort", icon: T + "env-loc-in-fort.jpg" },
  ],
  "middle-eastern": [
    { key: "palace", label: "Palace", icon: T + "env-loc-me-palace.jpg" },
    { key: "bazaar", label: "Bazaar", icon: T + "env-loc-me-bazaar.jpg" },
    { key: "desert-oasis", label: "Desert Oasis", icon: T + "env-loc-desert-oasis.jpg" },
    { key: "mosque", label: "Mosque", icon: T + "env-loc-mosque.jpg" },
    { key: "caravanserai", label: "Caravanserai", icon: T + "env-loc-caravanserai.jpg" },
  ],
  "medieval-european": [
    { key: "castle", label: "Castle", icon: T + "env-loc-castle.jpg" },
    { key: "cathedral", label: "Cathedral", icon: T + "env-loc-cathedral.jpg" },
    { key: "village", label: "Village", icon: T + "env-loc-me-village.jpg" },
    { key: "tavern", label: "Tavern", icon: T + "env-loc-tavern.jpg" },
    { key: "dungeon", label: "Dungeon", icon: T + "env-loc-dungeon.jpg" },
    { key: "battlefield", label: "Battlefield", icon: T + "env-loc-battlefield.jpg" },
  ],
  "victorian": [
    { key: "mansion", label: "Mansion", icon: T + "env-loc-mansion.jpg" },
    { key: "factory", label: "Factory", icon: T + "env-loc-vic-factory.jpg" },
    { key: "street", label: "Street", icon: T + "env-loc-vic-street.jpg" },
    { key: "parlor", label: "Parlor", icon: T + "env-loc-parlor.jpg" },
    { key: "train-station", label: "Train Station", icon: T + "env-loc-train-station.jpg" },
  ],
  "gothic": [
    { key: "cathedral", label: "Cathedral", icon: T + "env-loc-goth-cathedral.jpg" },
    { key: "graveyard", label: "Graveyard", icon: T + "env-loc-graveyard.jpg" },
    { key: "haunted-manor", label: "Haunted Manor", icon: T + "env-loc-haunted-manor.jpg" },
    { key: "crypt", label: "Crypt", icon: T + "env-loc-crypt.jpg" },
  ],
  "modern": [
    { key: "office", label: "Office", icon: T + "env-loc-office.jpg" },
    { key: "apartment", label: "Apartment", icon: T + "env-loc-apartment.jpg" },
    { key: "warehouse", label: "Warehouse", icon: T + "env-loc-warehouse.jpg" },
    { key: "rooftop", label: "Rooftop", icon: T + "env-loc-rooftop.jpg" },
    { key: "street", label: "Street", icon: T + "env-loc-mod-street.jpg" },
    { key: "cafe", label: "Cafe", icon: T + "env-loc-cafe.jpg" },
    { key: "subway", label: "Subway", icon: T + "env-loc-subway.jpg" },
  ],
  "industrial": [
    { key: "factory", label: "Factory", icon: T + "env-loc-ind-factory.jpg" },
    { key: "shipyard", label: "Shipyard", icon: T + "env-loc-shipyard.jpg" },
    { key: "mine", label: "Mine", icon: T + "env-loc-mine.jpg" },
    { key: "power-plant", label: "Power Plant", icon: T + "env-loc-power-plant.jpg" },
    { key: "refinery", label: "Refinery", icon: T + "env-loc-refinery.jpg" },
  ],
  "futuristic": [
    { key: "space-station", label: "Space Station", icon: T + "env-loc-space-station.jpg" },
    { key: "colony", label: "Colony", icon: T + "env-loc-colony.jpg" },
    { key: "lab", label: "Lab", icon: T + "env-loc-lab.jpg" },
    { key: "bridge", label: "Bridge", icon: T + "env-loc-bridge.jpg" },
    { key: "megacity", label: "Megacity", icon: T + "env-loc-megacity.jpg" },
  ],
  "cyberpunk": [
    { key: "neon-alley", label: "Neon Alley", icon: T + "env-loc-neon-alley.jpg" },
    { key: "underground-club", label: "Underground Club", icon: T + "env-loc-underground-club.jpg" },
    { key: "hacker-den", label: "Hacker Den", icon: T + "env-loc-hacker-den.jpg" },
    { key: "megacorp-tower", label: "Megacorp Tower", icon: T + "env-loc-megacorp-tower.jpg" },
    { key: "black-market", label: "Black Market", icon: T + "env-loc-black-market.jpg" },
  ],
  "fantasy": [
    { key: "enchanted-forest", label: "Enchanted Forest", icon: T + "env-loc-enchanted-forest.jpg" },
    { key: "crystal-cave", label: "Crystal Cave", icon: T + "env-loc-crystal-cave.jpg" },
    { key: "floating-island", label: "Floating Island", icon: T + "env-loc-floating-island.jpg" },
    { key: "dark-tower", label: "Dark Tower", icon: T + "env-loc-dark-tower.jpg" },
    { key: "elven-city", label: "Elven City", icon: T + "env-loc-elven-city.jpg" },
    { key: "dragon-lair", label: "Dragon Lair", icon: T + "env-loc-dragon-lair.jpg" },
  ],
  "post-apocalyptic": [
    { key: "ruins", label: "Ruins", icon: T + "env-loc-ruins.jpg" },
    { key: "wasteland", label: "Wasteland", icon: T + "env-loc-wasteland.jpg" },
    { key: "bunker", label: "Bunker", icon: T + "env-loc-bunker.jpg" },
    { key: "overgrown-city", label: "Overgrown City", icon: T + "env-loc-overgrown-city.jpg" },
    { key: "survivor-camp", label: "Survivor Camp", icon: T + "env-loc-survivor-camp.jpg" },
  ],
  "nature": [
    { key: "beach", label: "Beach", icon: T + "env-loc-beach.jpg" },
    { key: "mountain", label: "Mountain", icon: T + "env-loc-mountain.jpg" },
    { key: "desert", label: "Desert", icon: T + "env-loc-desert.jpg" },
    { key: "rainforest", label: "Rainforest", icon: T + "env-loc-rainforest.jpg" },
    { key: "tundra", label: "Tundra", icon: T + "env-loc-tundra.jpg" },
    { key: "waterfall", label: "Waterfall", icon: T + "env-loc-waterfall.jpg" },
    { key: "volcano", label: "Volcano", icon: T + "env-loc-volcano.jpg" },
  ],
};

const TIME_OF_DAY_OPTIONS: ForgeOption[] = [
  { key: "dawn", label: "Dawn", icon: T + "env-time-dawn.jpg" },
  { key: "morning", label: "Morning", icon: T + "env-time-morning.jpg" },
  { key: "noon", label: "Noon", icon: T + "env-time-noon.jpg" },
  { key: "afternoon", label: "Afternoon", icon: T + "env-time-afternoon.jpg" },
  { key: "golden-hour", label: "Golden Hour", icon: T + "env-time-golden-hour.jpg" },
  { key: "sunset", label: "Sunset", icon: T + "env-time-sunset.jpg" },
  { key: "dusk", label: "Dusk", icon: T + "env-time-dusk.jpg" },
  { key: "night", label: "Night", icon: T + "env-time-night.jpg" },
  { key: "midnight", label: "Midnight", icon: T + "env-time-midnight.jpg" },
];

const WEATHER_OPTIONS: ForgeOption[] = [
  { key: "clear", label: "Clear", icon: T + "env-weather-clear.jpg" },
  { key: "cloudy", label: "Cloudy", icon: T + "env-weather-cloudy.jpg" },
  { key: "rainy", label: "Rainy", icon: T + "env-weather-rainy.jpg" },
  { key: "foggy", label: "Foggy", icon: T + "env-weather-foggy.jpg" },
  { key: "snowy", label: "Snowy", icon: T + "env-weather-snowy.jpg" },
  { key: "stormy", label: "Stormy", icon: T + "env-weather-stormy.jpg" },
  { key: "dusty", label: "Dusty", icon: T + "env-weather-dusty.jpg" },
  { key: "misty", label: "Misty", icon: T + "env-weather-misty.jpg" },
];

const MOOD_OPTIONS: ForgeOption[] = [
  { key: "cozy", label: "Cozy", icon: T + "env-mood-cozy.jpg" },
  { key: "eerie", label: "Eerie", icon: T + "env-mood-eerie.jpg" },
  { key: "grand", label: "Grand", icon: T + "env-mood-grand.jpg" },
  { key: "intimate", label: "Intimate", icon: T + "env-mood-intimate.jpg" },
  { key: "vast", label: "Vast", icon: T + "env-mood-vast.jpg" },
  { key: "claustrophobic", label: "Claustrophobic", icon: T + "env-mood-claustrophobic.jpg" },
  { key: "serene", label: "Serene", icon: T + "env-mood-serene.jpg" },
  { key: "chaotic", label: "Chaotic", icon: T + "env-mood-chaotic.jpg" },
  { key: "mysterious", label: "Mysterious", icon: T + "env-mood-mysterious.jpg" },
  { key: "romantic", label: "Romantic", icon: T + "env-mood-romantic.jpg" },
];

// ═══════════════════════════════════════════════════════════════════════════════
// PROP OPTIONS
// ═══════════════════════════════════════════════════════════════════════════════

const PROP_CATEGORY_OPTIONS: ForgeOption[] = [
  { key: "vehicle", label: "Vehicle", icon: T + "prop-cat-vehicle.jpg" },
  { key: "weapon", label: "Weapon", icon: T + "prop-cat-weapon.jpg" },
  { key: "tool", label: "Tool", icon: T + "prop-cat-tool.jpg" },
  { key: "furniture", label: "Furniture", icon: T + "prop-cat-furniture.jpg" },
  { key: "food", label: "Food", icon: T + "prop-cat-food.jpg" },
  { key: "technology", label: "Technology", icon: T + "prop-cat-technology.jpg" },
  { key: "clothing-accessory", label: "Clothing/Accessory", icon: T + "prop-cat-clothing-accessory.jpg" },
  { key: "natural", label: "Natural", icon: T + "prop-cat-natural.jpg" },
  { key: "container", label: "Container", icon: T + "prop-cat-container.jpg" },
  { key: "musical-instrument", label: "Musical Instrument", icon: T + "prop-cat-musical-instrument.jpg" },
  { key: "misc", label: "Misc", icon: T + "prop-cat-misc.jpg" },
];

const PROP_MATERIAL_OPTIONS: ForgeOption[] = [
  { key: "metal", label: "Metal", icon: T + "prop-mat-metal.jpg" },
  { key: "wood", label: "Wood", icon: T + "prop-mat-wood.jpg" },
  { key: "plastic", label: "Plastic", icon: T + "prop-mat-plastic.jpg" },
  { key: "glass", label: "Glass", icon: T + "prop-mat-glass.jpg" },
  { key: "leather", label: "Leather", icon: T + "prop-mat-leather.jpg" },
  { key: "stone", label: "Stone", icon: T + "prop-mat-stone.jpg" },
  { key: "fabric", label: "Fabric", icon: T + "prop-mat-fabric.jpg" },
  { key: "crystal", label: "Crystal", icon: T + "prop-mat-crystal.jpg" },
  { key: "ceramic", label: "Ceramic", icon: T + "prop-mat-ceramic.jpg" },
  { key: "bone", label: "Bone", icon: T + "prop-mat-bone.jpg" },
];

const PROP_ERA_OPTIONS: ForgeOption[] = [
  { key: "ancient", label: "Ancient", icon: T + "prop-era-ancient.jpg" },
  { key: "medieval", label: "Medieval", icon: T + "prop-era-medieval.jpg" },
  { key: "victorian", label: "Victorian", icon: T + "prop-era-victorian.jpg" },
  { key: "modern", label: "Modern", icon: T + "prop-era-modern.jpg" },
  { key: "futuristic", label: "Futuristic", icon: T + "prop-era-futuristic.jpg" },
  { key: "steampunk", label: "Steampunk", icon: T + "prop-era-steampunk.jpg" },
  { key: "vintage", label: "Vintage", icon: T + "prop-era-vintage.jpg" },
  { key: "minimalist", label: "Minimalist", icon: T + "prop-era-minimalist.jpg" },
];

const PROP_SIZE_OPTIONS: ForgeOption[] = [
  { key: "tiny", label: "Tiny", icon: T + "prop-size-tiny.jpg" },
  { key: "small", label: "Small", icon: T + "prop-size-small.jpg" },
  { key: "medium", label: "Medium", icon: T + "prop-size-medium.jpg" },
  { key: "large", label: "Large", icon: T + "prop-size-large.jpg" },
  { key: "massive", label: "Massive", icon: T + "prop-size-massive.jpg" },
];

const PROP_CONDITION_OPTIONS: ForgeOption[] = [
  { key: "pristine", label: "Pristine", icon: T + "prop-cond-pristine.jpg" },
  { key: "new", label: "New", icon: T + "prop-cond-new.jpg" },
  { key: "worn", label: "Worn", icon: T + "prop-cond-worn.jpg" },
  { key: "damaged", label: "Damaged", icon: T + "prop-cond-damaged.jpg" },
  { key: "ancient", label: "Ancient", icon: T + "prop-cond-ancient.jpg" },
  { key: "weathered", label: "Weathered", icon: T + "prop-cond-weathered.jpg" },
  { key: "rusted", label: "Rusted", icon: T + "prop-cond-rusted.jpg" },
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
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Sarah Chen", required: true, pinned: true },
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
    fields: [
      { key: "archetype", label: "Archetype", type: "carousel", options: ARCHETYPE_OPTIONS },
      { key: "expression", label: "Expression", type: "carousel", options: EXPRESSION_OPTIONS },
    ],
  },
  {
    key: "details",
    label: "Details",
    fields: [
      { key: "details", label: "Features", type: "multi-carousel", options: DETAIL_PRESETS },
      { key: "detailsCustom", label: "Custom", type: "textarea", placeholder: "e.g. a slight scar on her cheek, tattoo of a dragon on left forearm, birthmark near the jawline..." },
    ],
  },
  {
    key: "outfit",
    label: "Outfit",
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
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Dragon Gate Temple", required: true },
      { key: "setting", label: "Setting", type: "carousel", options: SETTING_OPTIONS },
      { key: "subSetting", label: "Location", type: "two-level", subOptions: SUB_SETTING_OPTIONS },
    ],
  },
  {
    key: "atmosphere",
    label: "Atmosphere",
    fields: [
      { key: "timeOfDay", label: "Time of Day", type: "carousel", options: TIME_OF_DAY_OPTIONS },
      { key: "weather", label: "Weather", type: "carousel", options: WEATHER_OPTIONS },
    ],
  },
  {
    key: "mood",
    label: "Mood & Details",
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
    fields: [
      { key: "name", label: "Name", type: "text", placeholder: "e.g. Dragon's Blade", required: true },
      { key: "category", label: "Category", type: "carousel", options: PROP_CATEGORY_OPTIONS },
    ],
  },
  {
    key: "appearance",
    label: "Appearance",
    fields: [
      { key: "material", label: "Material", type: "carousel", options: PROP_MATERIAL_OPTIONS },
      { key: "era", label: "Era / Style", type: "carousel", options: PROP_ERA_OPTIONS },
      { key: "size", label: "Size", type: "carousel", options: PROP_SIZE_OPTIONS },
      { key: "condition", label: "Condition", type: "carousel", options: PROP_CONDITION_OPTIONS },
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

// ═══════════════════════════════════════════════════════════════════════════════
// IDENTITY SHEET PROMPT COMPOSERS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Generates a 7-view photorealistic character identity reference contact sheet.
 * Top row: front / left-3/4 / right-3/4 / back (full body).
 * Bottom row: face close-up / costume detail / expression reference.
 * Uses GPT Image 2 at 4K 16:9.
 */
export function composeCharacterSheetPrompt(identity: Record<string, any>): string {
  const characterDesc = composeCharacterPrompt(identity);
  const hasReferencePhotos = identity.ref_face || identity.ref_outfit || identity.ref_fullBody || identity.ref_head || identity.ref_body;

  const outfitDesc = identity.outfitCustom?.trim()
    ? identity.outfitCustom.trim()
    : identity.outfit
      ? `${labelFor(OUTFIT_OPTIONS, identity.outfit).toLowerCase()} clothing`
      : "their outfit";

  const expressionDesc = identity.expression
    ? labelFor(EXPRESSION_OPTIONS, identity.expression).toLowerCase()
    : "neutral";

  const archetypeDesc = identity.archetype
    ? labelFor(ARCHETYPE_OPTIONS, identity.archetype).toLowerCase()
    : "character";

  const ageDesc = identity.ageRange
    ? labelFor(AGE_OPTIONS, identity.ageRange).toLowerCase()
    : "adult";

  const unconventionalHint = !hasReferencePhotos
    ? `\nThe character must have a distinctive, unconventional face — realistic ${ageDesc} features, not conventionally attractive, with genuine lived-in character.`
    : "";

  return `Create a photorealistic character identity reference contact sheet for professional film and TV production.

CHARACTER: ${characterDesc}${unconventionalHint}

LAYOUT: Two horizontal rows arranged on a clean neutral seamless studio background. Each image is clearly labeled with its view name.

TOP ROW — 4 images labeled:
[1 FRONT VIEW] Full body, facing camera directly, neutral standing pose, feet visible
[2 LEFT 3/4 VIEW] Slight left turn, depth and side structure visible, full body
[3 RIGHT 3/4 VIEW] Slight right turn, opposite depth, full body
[4 BACK VIEW] Full body facing away from camera, back of outfit visible

BOTTOM ROW — 3 images labeled:
[5 FACE CLOSE-UP] Sharp facial detail, catch light in eyes, ${expressionDesc} expression, photographed at portrait lens distance
[6 COSTUME DETAIL] Close view showing ${outfitDesc} — fabric texture, construction details, accessories, material quality
[7 EXPRESSION REFERENCE] ${archetypeDesc} emotional expression, slight variation from neutral, character psychology visible

CONSISTENCY RULES:
- All 7 photographs depict the exact same person with identical face, hair, outfit, and proportions
- Same studio lighting session throughout — no variation in light direction between views
- Full-body shots show complete figure from head to feet

TECHNICAL STYLE:
- Background: neutral seamless studio backdrop, light gray or off-white
- Lighting: soft key light from 45 degrees, gentle fill, minimal shadows, no dramatic rim lighting
- Camera: realistic portrait and full-body lens behavior, natural depth of field
- Resolution: ultra-high detail, 4K photographic clarity — every fabric fiber, skin pore, and hair strand visible

CRITICAL RESTRICTIONS — the output must NOT resemble:
- 3D render or CGI asset
- Game asset or character model
- Stylized illustration or concept art
- Anime, cartoon, or painted artwork
This is real film production reference photography. Photorealistic only.`;
}

/**
 * Generates a 7-view photorealistic object/prop identity reference sheet.
 * Top row: front / left perspective / right perspective / rear (structural views).
 * Bottom row: functional surface / material texture / light interaction.
 * Uses GPT Image 2 at 4K 16:9.
 */
export function composePropSheetPrompt(identity: Record<string, any>): string {
  const objectDesc = composePropPrompt(identity);
  const objectName = identity.name?.trim() || "the object";
  const materialDesc = identity.material ? labelFor(PROP_MATERIAL_OPTIONS, identity.material).toLowerCase() : "its material";
  const sizeDesc = identity.size ? labelFor(PROP_SIZE_OPTIONS, identity.size).toLowerCase() : "medium";
  const conditionDesc = identity.condition ? labelFor(PROP_CONDITION_OPTIONS, identity.condition).toLowerCase() : "";

  return `Create a photorealistic object identity reference sheet showing the same real-world physical object photographed from multiple angles.

OBJECT: ${objectDesc}

The result must look like real product-style photography captured during a single reference session — not CGI, not a 3D render, not stylized illustration.

The object (${objectName}) must remain fully consistent across all images in shape, proportions, materials, surface textures, color, finish, and any wear or imperfections.

SCALE RULE: The photography must adapt naturally to the object's real-world size. Use framing, camera distance, and composition appropriate to a ${sizeDesc}-sized object.

LAYOUT: Clean reference contact sheet in two horizontal rows. All images depict the exact same object photographed in the same session under identical lighting.

TOP ROW — 4 images labeled:
[FRONT VIEW] Object facing directly toward camera
[LEFT PERSPECTIVE] Slightly angled left to reveal depth and side structure
[RIGHT PERSPECTIVE] Opposite angle showing the other side
[REAR VIEW] Back side of the object

BOTTOM ROW — 3 images labeled:
[FUNCTIONAL SURFACE] The most recognizable or defining surface of the object
[MATERIAL CLOSE-UP] Close view showing ${materialDesc} texture, surface grain, ${conditionDesc ? conditionDesc + " condition, " : ""}construction detail
[LIGHT INTERACTION] View showing how light reacts with the ${materialDesc} surface — reflections, matte diffusion, gloss, or metallic highlights

BACKGROUND: Simple neutral photographic environment — neutral studio backdrop or clean tabletop surface appropriate to object scale.

LIGHTING: Soft neutral studio lighting, gentle shadows, natural reflections. No dramatic cinematic lighting or exaggerated effects.

TECHNICAL STYLE:
- Resolution: ultra-high detail, 4K photographic clarity — every surface texture, material grain, and finish visible
- Real photographic documentation of a physical object

CRITICAL RESTRICTIONS — the output must NOT resemble:
- 3D render or CGI asset
- Game asset or prop model
- Stylized illustration or concept art
- Anime, cartoon, or painted artwork
This is real product photography reference. Photorealistic only.`;
}

// ── Production Sheet param types ─────────────────────────────────────────────

export interface ProductionSheetElement {
  name: string;
  type: string; // "character" | "prop" | "environment"
  identity?: Record<string, any>;
  description?: string; // full visual description text from element library
  primaryImageUrl?: string;
}

export interface ProductionSheetParams {
  elements: ProductionSheetElement[];
  imagePrompt?: string;
  videoPrompt?: string;
  description?: string;
  cutCount?: number;
}

/**
 * Composes the final GPT Image 2 prompt for a scene production sheet.
 * Uses the partner's proven template structure with Haiku-distilled concept
 * as {user input} and minimal one-line element labels below it.
 *
 * concept: the 120-150 word visual paragraph written by Haiku (or empty string
 *          for graceful fallback to description text).
 */
export function composeProductionSheetPrompt(params: ProductionSheetParams & { concept?: string }): string {
  const { elements, videoPrompt, imagePrompt, description, cutCount, concept } = params;

  const characters = elements.filter(e => e.type === "character");
  const props = elements.filter(e => e.type === "prop");
  const environments = elements.filter(e => e.type === "environment");

  const storyInput = concept?.trim() || description?.trim() || "A cinematic scene.";

  // Parse video prompt into structured cuts — max 6 panels
  const parsedCuts = (videoPrompt ?? "")
    .split(/\n/)
    .map(l => l.trim())
    .filter(Boolean)
    .slice(0, 6);
  const totalCuts = cutCount || parsedCuts.length || 3;

  // Character notes — name + key identity details
  const characterDetails = characters.map((c, i) => {
    const id = c.identity ?? {};
    const parts: string[] = [`CHARACTER ${String.fromCharCode(65 + i)}: ${c.name.toUpperCase()}`];
    if (id.ageRange) parts.push(id.ageRange);
    if (id.archetype) parts.push(`${id.archetype} archetype`);
    if (id.outfitCustom?.trim()) parts.push(id.outfitCustom.trim());
    else if (id.outfit) parts.push(`${id.outfit} outfit`);
    if (id.expression) parts.push(`${id.expression} expression`);
    return parts.join(", ");
  });

  // Prop notes — name + material + condition + details
  const propDetails = props.map(p => {
    const id = p.identity ?? {};
    const parts: string[] = [`PROP: ${p.name.toUpperCase()}`];
    if (id.material) parts.push(id.material);
    if (id.condition) parts.push(id.condition);
    if (id.details?.trim()) parts.push(id.details.trim());
    return parts.join(", ");
  });

  // Environment fingerprint — full identity
  const envFingerprint = environments.length > 0
    ? environments.map(e => {
        if (!e.identity) return e.name;
        const parts: string[] = [e.name];
        if (e.identity.setting) parts.push(labelFor(SETTING_OPTIONS, e.identity.setting));
        if (e.identity.subSetting && e.identity.setting) {
          parts.push(labelFor(SUB_SETTING_OPTIONS[e.identity.setting] || [], e.identity.subSetting));
        }
        if (e.identity.timeOfDay) parts.push(labelFor(TIME_OF_DAY_OPTIONS, e.identity.timeOfDay));
        if (e.identity.weather) parts.push(labelFor(WEATHER_OPTIONS, e.identity.weather));
        if (e.identity.mood) parts.push(labelFor(MOOD_OPTIONS, e.identity.mood));
        if (e.identity.keyFeatures?.trim()) parts.push(e.identity.keyFeatures.trim());
        return parts.join(", ");
      }).join(" | ")
    : "";

  // Structured cut specs from videoPrompt
  const cutSpecs = parsedCuts.length > 0
    ? parsedCuts.map((cut, i) => `Cut ${i + 1}: ${cut}`).join("\n")
    : "";

  // Mood / lighting / style from imagePrompt
  const moodLine = imagePrompt?.trim() ? `MOOD & LIGHTING: ${imagePrompt.trim()}` : "";

  // Genre / tone extracted from description or concept
  const genreTone = description?.trim() ? description.trim().split(/[.,!?]/)[0].trim() : "CINEMATIC";

  // Personality line derived from archetype (one sentence, not hardcoded traits)
  const archetypePersonality: Record<string, string> = {
    hero: "Driven, courageous — the one who acts when others hesitate",
    villain: "Calculating, imposing — pursues their goal without compromise",
    mentor: "Wise, measured — guides through experience rather than force",
    trickster: "Unpredictable, sharp — uses wit and misdirection",
    everyman: "Ordinary person in an extraordinary situation — relatable anchor",
    rebel: "Defiant, independent — refuses to accept the established order",
    caregiver: "Protective, empathetic — motivated by others before self",
    explorer: "Restless, curious — defined by the need to discover",
    sage: "Observant, analytical — seeks truth above all",
    innocent: "Hopeful, pure-hearted — believes in the best outcome",
    ruler: "Commanding, responsible — carries the weight of authority",
    creator: "Imaginative, obsessive — driven to make something new",
  };

  // Character notes as bullet list — physical attributes + costume + personality
  const characterNotesBullets = characters.map(c => {
    const id = c.identity ?? {};
    const bullets: string[] = [];

    // Physical attributes
    if (id.ageRange) bullets.push(`Age: ${labelFor(AGE_OPTIONS, id.ageRange)}`);
    if (id.height) bullets.push(`Height: ${labelFor(HEIGHT_OPTIONS, id.height)}`);
    if (id.build) bullets.push(`Build: ${labelFor(BUILD_OPTIONS, id.build)}`);
    if (id.ethnicity) bullets.push(`Ethnicity: ${labelFor(ETHNICITY_OPTIONS, id.ethnicity)}`);

    // Hair — combine color + texture + style into one line
    const hairParts: string[] = [];
    if (id.hairColor) hairParts.push(labelFor(HAIR_COLOR_OPTIONS, id.hairColor));
    if (id.hairTexture) hairParts.push(labelFor(HAIR_TEXTURE_OPTIONS, id.hairTexture).toLowerCase());
    if (id.hairStyle) hairParts.push(labelFor(HAIR_STYLE_OPTIONS, id.hairStyle).toLowerCase());
    if (hairParts.length > 0) bullets.push(`Hair: ${hairParts.join(", ")}`);

    if (id.eyeColor) bullets.push(`Eyes: ${labelFor(EYE_COLOR_OPTIONS, id.eyeColor)}`);

    // Costume
    if (id.outfitCustom?.trim()) bullets.push(`Outfit: ${id.outfitCustom.trim()}`);
    else if (id.outfit) bullets.push(`Outfit: ${labelFor(OUTFIT_OPTIONS, id.outfit)}`);
    if (id.expression) bullets.push(`Expression: ${labelFor(EXPRESSION_OPTIONS, id.expression)}`);

    // Personality derived from archetype
    const archetypeKey = id.archetype?.toLowerCase() || "";
    const personalityLine = archetypePersonality[archetypeKey]
      || (id.archetype ? `${labelFor(ARCHETYPE_OPTIONS, id.archetype)} — defined by role in the story` : null);
    if (personalityLine) bullets.push(`Personality: ${personalityLine}`);

    // Fallback for auto-extracted characters with sparse identity
    if (bullets.length === 0 && c.description?.trim()) bullets.push(c.description.trim().slice(0, 200));

    return `  ${c.name.toUpperCase()} CHARACTER NOTES:\n${bullets.map(b => `    • ${b}`).join("\n")}`;
  }).join("\n");

  // Gear detail label (first accessory or outfit detail)
  const gearDetailLabel = characters.map(c => {
    const id = c.identity ?? {};
    return id.outfitCustom?.trim() || (id.outfit ? labelFor(OUTFIT_OPTIONS, id.outfit) : null);
  }).filter(Boolean)[0] || "costume accessory";

  // Prop detail labels
  const propDetailLabels = props.map(p => {
    const id = p.identity ?? {};
    return `${p.name.toUpperCase()} (${id.material ? labelFor(PROP_MATERIAL_OPTIONS, id.material) : "prop"})`;
  }).join(", ");

  // Derive floor plan shape from environment identity
  const envNameLower = environments.map(e => e.name + " " + (e.identity?.subSetting || "") + " " + (e.identity?.setting || "")).join(" ").toLowerCase();
  const floorPlanShape = /arena|ring|court|stadium|pit|coliseum|stage|dojo|gym|square|room|office|lab|vault|bunker/.test(envNameLower)
    ? "SQUARE (equal width and height — do NOT stretch into a rectangle)"
    : /street|road|corridor|hallway|alley|highway|bridge|tunnel|runway/.test(envNameLower)
    ? "LONG NARROW RECTANGLE (much wider than tall — linear layout)"
    : "correct proportions matching the actual set shape (square if enclosed space, wide if open landscape)";

  // Floor plan camera positions + movement extracted from video prompt cuts
  const floorPlanCuts = parsedCuts.map((cut, i) => {
    const move = cut.match(/STEADICAM|DOLLY|TRACK|CRANE|HANDHELD|STATIC|PAN|TILT|ZOOM|PUSH|RACK.?FOCUS|INSERT/i)?.[0]?.toUpperCase().replace("-", "") || "CUT";
    return `Cut ${i + 1}/${move}`;
  }).join("  ");

  // Prop narrative notes — use description field first (richest source), fall back to identity fields
  const propNarrative = props.map(p => {
    const id = p.identity ?? {};
    const parts: string[] = [];
    if (p.description?.trim()) {
      parts.push(p.description.trim());
    } else {
      if (id.details?.trim()) parts.push(id.details.trim());
      if (id.material) parts.push(`${labelFor(PROP_MATERIAL_OPTIONS, id.material)} construction`);
      if (id.condition) parts.push(labelFor(PROP_CONDITION_OPTIONS, id.condition));
    }
    return `${p.name}: ${parts.join(". ")}`;
  }).join("\n");

  // Truncate env fingerprint for top bar — long text causes the model to garble/corrupt it
  const envFingerprintShort = envFingerprint
    ? envFingerprint.slice(0, 80) + (envFingerprint.length > 80 ? "…" : "")
    : "[derive from scene]";

  const contextLines = [
    // TOP BAR
    [
      `TOP BAR (full-width dark strip spanning entire board top, white text):`,
      `  "Cut Count: ${totalCuts}"  |  "Color Palette: [derive 3-5 descriptive color names e.g. dawn gold + arena red + iron blue]"  |  "Environment: ${envFingerprintShort}"`,
    ].join("\n"),

    // SECTION 1 — Character + Hero Prop (two columns side by side)
    [
      `SECTION 1: CHARACTER + HERO PROP REFERENCE (two columns, left half of board):`,
      ``,
      `  LEFT COLUMN — CHARACTER REFERENCE:`,
      `    Image row 1: FRONT / SIDE / BACK — full-body photorealistic renders`,
      characterDetails.length > 0 ? `    Character data: ${characterDetails.join("; ")}` : "",
      `    Image row 2: FACIAL CLOSE-UP / SIDE FACE CLOSE-UP / COSTUME DETAIL (close-up of ${gearDetailLabel})`,
      characterNotesBullets ? `${characterNotesBullets}` : "",
      ``,
      props.length > 0 ? [
        `  RIGHT COLUMN — HERO PROP: ${props.map(p => p.name.toUpperCase()).join(", ")}:`,
        `    6 photorealistic prop views: FRONT VIEW / 3/4 VIEW / SIDE VIEW / REAR 3/4 VIEW / DETAIL CLOSE-UP / IN CONTEXT (prop shown in the scene environment)`,
        propDetailLabels ? `    Prop: ${propDetailLabels}` : "",
        propNarrative ? `    PROP NOTES: ${propNarrative}` : "",
      ].filter(Boolean).join("\n") : "",
      ``,
      `  FAR RIGHT PANEL (narrow column):`,
      `    COLOR PALETTE: 4-5 actual filled color swatches with HEX-style codes below each (e.g. #6E7C8A)`,
      `    THEME & TONE: 4-5 short thematic lines derived from the story concept (not physical description — narrative meaning)`,
    ].filter(s => s !== "").join("\n"),

    // SECTION 2 — Environment (env fingerprint is already in top bar — do NOT repeat it here)
    [
      `SECTION 2: ENVIRONMENT / SET DESIGN (three columns):`,
      `  LEFT COLUMN: ESTABLISHING ENVIRONMENT REFERENCE — large cinematic photorealistic keyframe`,
      `  CENTER COLUMN: SUPPLEMENTARY ANGLE — second photorealistic view from a different angle`,
      `  RIGHT COLUMN: FLOOR PLAN (TOP-DOWN DIAGRAM) — bird's-eye schematic, clean technical drawing:`,
      `    Shape: ${floorPlanShape}`,
      `    Numbered camera icons at each cut position with movement labels: ${floorPlanCuts || "Cut 1/STATIC  Cut 2/DOLLY-IN  Cut 3/PUSH-IN  Cut 4/HANDHELD"}`,
      `    Dashed arrows for talent movement paths, solid arrows for camera movement direction`,
      props.length > 0 ? `    Label the hero prop's position (e.g. "${props[0]?.name?.toUpperCase()}")` : "",
      `    Label key set zones: FOREGROUND / MID-ZONE / BACKGROUND DEPTH`,
      `    North arrow in the corner`,
      `    Below the floor plan: SIDE ELEVATION DIAGRAM — cross-section showing vertical spatial layers with height labels`,
      `    (e.g. OVERHEAD RIGS at top, then DEPTH zone, then MID-ZONE / ARENA FLOOR, then FOREGROUND / AUDIENCE)`,
    ].filter(Boolean).join("\n"),

    // SECTION 3 — Storyboard
    [
      `SECTION 3: STORYBOARD (full-width horizontal strip):`,
      `  ${totalCuts} panels numbered 1–${totalCuts} side by side`,
      `  Each panel: PHOTOREALISTIC cinematic scene render — real photography quality, not sketch or illustration`,
      `  Below each panel: "Cut N | [lens]mm anamorphic | [duration]s | [MOVEMENT] | [FRAMING] —"`,
      `  Below the spec line: one sentence describing the action or emotion in that cut`,
      cutSpecs ? `  Shot data to use:\n${cutSpecs}` : `  Derive ${totalCuts} cinematic cuts from the story concept`,
    ].filter(Boolean).join("\n"),

    // SECTION 4 — Lighting / Mood / Style
    [
      `SECTION 4: LIGHTING / MOOD / STYLE NOTES (bottom strip, full width — 3 columns):`,
      `  LEFT: 4 photorealistic lighting reference thumbnails, each with:`,
      `    - ALL-CAPS title (e.g. "FIRST LIGHT RIM ON WATER")`,
      `    - One sentence below describing the lighting quality and emotional effect`,
      moodLine ? `    Derive from: ${moodLine}` : "",
      `  CENTER: MOOD KEYWORDS — plain stacked text, one per line, 5-6 keywords (e.g. solitary / anticipatory / uncanny / awe-struck)`,
      `  RIGHT: CINEMATOGRAPHY NOTES — 4-5 bullet points: lens rationale, movement strategy, color unification approach, scale contrast, emotional arc`,
    ].filter(Boolean).join("\n"),
  ].filter(Boolean).join("\n\n");

  return `${storyInput}
The above is the story plot and narrative concept. Transform it into a professional film pre-production board — a single cohesive A3-style reference document on a LIGHT CREAM or off-white background, styled exactly like a high-end studio production sheet used in real film production.

BACKGROUND: Light cream or off-white. Section dividers as thin dark horizontal rules. All section headers in ALL CAPS bold dark charcoal.

${contextLines}

VISUAL STYLE RULES:
- Light/cream document background — NOT a dark cinematic scene, NOT a movie poster
- All character and environment art is PHOTOREALISTIC — real photography or photorealistic render quality
- Storyboard panels are PHOTOREALISTIC cinematic scene renders — NOT sketches, NOT illustrations
- Color swatches are actual filled color rectangles with text name labels below each
- Mood keywords render as filled rounded pill/badge shapes with text inside
- Floor plan is a clean top-down schematic with camera icons and directional arrows
- ONE unified board image — not multiple images, not a collage
- High detail, balanced whitespace, sharp readable typography throughout`;
}

/**
 * Build prompt context for custom element types (logo, style, other).
 * Injected during generation when these elements are @mentioned or linked.
 */
export function composeCustomElementPrompt(type: string, name: string, description?: string): string {
  const desc = description?.trim() ? `. ${description.trim()}` : "";
  switch (type) {
    case "logo":
      return `Incorporate the ${name} logo exactly as shown in the reference image${desc}`;
    case "style":
      return `Apply the ${name} artistic style as shown in the reference images${desc}`;
    case "other":
      return `Reference the ${name} element as shown in the reference images${desc}`;
    default:
      return "";
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

// ═══════════════════════════════════════════════════════════════════════════════
// WORLD VIEW SHEET PROMPT
// ═══════════════════════════════════════════════════════════════════════════════

export interface WorldViewParams {
  concept: string;                      // Haiku-distilled world concept (150-200 words)
  elements: ProductionSheetElement[];   // All project elements
  projectName?: string;
}

/**
 * Composes the GPT Image 2 prompt for the project-level World View Sheet.
 * Uses the partner's proven template with Haiku concept as {user input}.
 * Sections: cast overview + world design + story arc + visual language.
 */
export function composeWorldViewPrompt(params: WorldViewParams): string {
  const { concept, elements, projectName } = params;

  const characters = elements.filter(e => e.type === "character");
  const props = elements.filter(e => e.type === "prop");
  const environments = elements.filter(e => e.type === "environment");

  const storyInput = concept?.trim() || `A cinematic story titled ${projectName || "Untitled"}.`;

  // Minimal one-line labels — visual identity carried by reference images
  const castLabels = characters
    .map((c, i) => `CHARACTER ${String.fromCharCode(65 + i)}: ${c.name.toUpperCase()}`)
    .join(" | ");

  const propLabels = props.map(p => `KEY PROP: ${p.name.toUpperCase()}`).join(" | ");

  const envLabels = environments.map(e => {
    if (!e.identity) return `WORLD: ${e.name.toUpperCase()}`;
    const parts: string[] = [e.name];
    if (e.identity.setting) parts.push(labelFor(SETTING_OPTIONS, e.identity.setting));
    if (e.identity.timeOfDay) parts.push(labelFor(TIME_OF_DAY_OPTIONS, e.identity.timeOfDay));
    if (e.identity.weather) parts.push(labelFor(WEATHER_OPTIONS, e.identity.weather));
    if (e.identity.mood) parts.push(labelFor(MOOD_OPTIONS, e.identity.mood));
    return `WORLD: ${parts.join(", ")}`;
  }).join(" | ");

  const contextLines = [
    castLabels && `CAST: ${castLabels}`,
    propLabels && `PROPS: ${propLabels}`,
    envLabels,
    `LAYOUT: Four sections — (1) CAST OVERVIEW showing all principal characters side by side with multi-view reference, (2) WORLD DESIGN showing the primary environment as a large establishing keyframe plus 2-3 supporting location views, (3) STORY ARC showing 3-5 key emotional beats labeled ACT 1 / TURNING POINT / CLIMAX / RESOLUTION, (4) VISUAL LANGUAGE showing color palette swatches, mood keywords, and cinematography style notes.`,
  ].filter(Boolean).join("\n");

  return `${storyInput}
The above is the story plot and narrative concept to be translated into a visual filmmaking plan. Create a professional film pre-production board that combines a character design sheet, environment concept art, storyboard sequence, camera diagram or shot plan, and lighting and mood references. Interpret the story and transform it into a complete visual filmmaking plan presented as a single cohesive board that looks like a high-end studio production sheet used in film or game development. The layout must be clearly structured with distinct sections including character design showing multiple views such as front, side, and back along with close-ups for face, materials, or key props while maintaining consistent design language and clear personality and scale; an environment or set design section featuring one large cinematic keyframe plus supporting views that convey scale, lighting, and atmosphere; a storyboard sequence of 4 to 8 panels arranged in a horizontal strip or grid where each panel represents a shot with clear cinematic framing and implied camera motion such as wide shot, close-up, crane, dolly, or pan, showing progression from beginning to climax. Include a camera or shot diagram using a simple top-down or schematic layout with arrows indicating character and camera movement, and a lighting, mood, and style section with small thumbnails that communicate lighting variations, color palette, and atmosphere. The visual style must be cinematic concept art quality similar to AAA film or game production, with a clean, sharp, highly readable layout, balanced composition, strong hierarchy, consistent color grading, and high detail without clutter. Use minimal functional text labels only such as "Cut 1", "Wide Shot", or "Close-up", avoiding long paragraphs or dense text so visuals remain dominant. The output must be a single unified board, not multiple images, and must not be a cinematic scene, poster, collage, UI, or abstract composition; it must maintain strict structure, clear section separation, and logical organization. The final image should clearly read as a professional storyboard and concept development sheet used in real film production, not a movie still or decorative artwork. Include style guidance such as film pre-production board, cinematic storyboard sheet, concept art layout, visual development board, shot planning, structured composition, high detail, dramatic lighting, and production design, and prioritize clarity, readability, and structured visual communication since this output may be used by another AI system.

${contextLines}`;
}
