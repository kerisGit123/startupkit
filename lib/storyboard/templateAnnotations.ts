/**
 * Template annotations for AI agent template matching.
 *
 * Each entry maps a template name (must match exactly) to:
 *   matchKeywords   — terms that trigger this template (case-insensitive substring match)
 *   matchDescription — one sentence used by the LLM for final candidate selection
 *   priority        — 1–10 tie-breaker; higher = more specific, wins over broad templates
 *
 * Priority guide:
 *   1–2  Broad fallback  (C01, P01, E01 — used when nothing specific matches)
 *   3–5  General purpose (single-shot, fast, contextual)
 *   6–7  Category-specific (interior, nature, consumer product)
 *   8–9  Specialized subject (robot, historical, fantasy, sci-fi)
 *   10   Exact-match specialist (werewolf→C10, cockpit→E15, jewelry→P07)
 */

export interface TemplateAnnotation {
  matchKeywords: string[];
  matchDescription: string;
  priority: number;
}

export const TEMPLATE_ANNOTATIONS: Record<string, TemplateAnnotation> = {

  // ─────────────────────────────────────────────────────────────
  // CHARACTER TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'C01 - Full Production Character Reference Sheet': {
    matchKeywords: [
      'human', 'person', 'man', 'woman', 'male', 'female', 'character',
      'protagonist', 'hero', 'villain', 'npc', 'soldier', 'warrior', 'fighter',
      'guard', 'civilian', 'adult', 'humanoid', 'figure', 'assassin', 'spy',
      'agent', 'detective', 'wizard', 'mage', 'archer', 'pirate', 'samurai',
      'ninja', 'elf', 'dwarf', 'orc humanoid', 'ranger', 'paladin', 'cleric',
      'mercenary', 'bounty hunter', 'shopkeeper', 'priest', 'monk',
    ],
    matchDescription: 'Flagship full production reference sheet for realistic adult human and humanoid characters — the default for any human character',
    priority: 4,
  },

  'C02 - Ultra Realistic Character Sheet (Fast)': {
    matchKeywords: [
      'quick character', 'fast character', 'concept character', 'draft character',
      'explore character', 'human concept', 'person concept',
    ],
    matchDescription: 'Quick first-pass concept sheet for human characters — use for initial exploration before committing to C01',
    priority: 2,
  },

  'C03 - UGC Character': {
    matchKeywords: [
      'ugc', 'generic character', 'neutral character', 'base character',
      'universal character', 'simple character', 'plain character',
    ],
    matchDescription: 'Generic neutral base character for UGC content — simplified, adaptable, minimal styling',
    priority: 1,
  },

  'C04 - Ultra-Realistic Robot Identity Sheet v4.3 (Full-Body Enforced)': {
    matchKeywords: [
      'robot', 'mech', 'mecha', 'android', 'cyborg', 'machine being',
      'automaton', 'droid', 'mechanical humanoid', 'mechanical character',
      'ai robot', 'combat robot', 'war machine humanoid', 'exoskeleton character',
      'humanoid robot', 'battle mech', 'bipedal robot', 'metal humanoid',
    ],
    matchDescription: 'Robots, mechs, androids, and cyborgs — fully mechanical humanoid characters',
    priority: 9,
  },

  'C05 - Monster Creature': {
    matchKeywords: [
      'monster', 'giant monster', 'kaiju', 'abomination', 'horror monster',
      'massive creature', 'terrifying beast', 'eldritch', 'lovecraftian',
      'tentacle monster', 'undead monster', 'zombie monster', 'troll', 'ogre',
      'golem', 'giant', 'titan creature', 'colossus creature', 'demon lord',
      'elder dragon', 'leviathan', 'kraken', 'behemoth',
    ],
    matchDescription: 'Large terrifying monsters and horror creatures — massive fully non-human beasts at scale',
    priority: 9,
  },

  'C07 - Creature Character Identity Sheet': {
    matchKeywords: [
      'creature', 'dragon', 'dinosaur', 'raptor', 'serpent', 'snake creature',
      'lizard creature', 'wyvern', 'griffin', 'basilisk', 'phoenix', 'hydra',
      'fantasy creature', 'mythical creature', 'wildlife creature', 'predator',
      'big cat', 'panther creature', 'wolf creature', 'bear creature',
      'eagle creature', 'sea creature', 'underwater creature',
    ],
    matchDescription: 'Photorealistic creatures and fantasy beasts — dragons, dinosaurs, mythical creatures with locked morphology and texture DNA',
    priority: 8,
  },

  'C08 - Enhanced Image Realistic': {
    matchKeywords: [
      'film look', 'film simulation', 'mamiya', 'kodak portra', 'analog film',
      'film grain character', 'medium format',
    ],
    matchDescription: 'Photography modifier — append to character prompts for ultra-realistic medium format film simulation',
    priority: 1,
  },

  'C09 - Ultra Realistic Character (Single Shot)': {
    matchKeywords: [
      'single shot', 'portrait', 'cinematic portrait', 'photo portrait',
      'headshot', 'close portrait', 'realistic portrait', 'single frame character',
    ],
    matchDescription: 'Single cinematic portrait — transforms a character reference into ultra-realistic photographic quality in one shot',
    priority: 3,
  },

  'C10 - Semi-Humanoid Creature Reference Sheet': {
    matchKeywords: [
      'werewolf', 'demon', 'hybrid character', 'semi human', 'vampire',
      'mermaid', 'centaur', 'faun', 'satyr', 'alien humanoid', 'mutant',
      'half human', 'half creature', 'lizardman', 'dragonborn', 'tiefling',
      'half demon', 'chimera', 'beast man', 'feral human', 'lycanthrope',
      'succubus', 'incubus', 'naga', 'lamia', 'harpy', 'minotaur', 'gnoll',
    ],
    matchDescription: 'Semi-humanoid hybrids — part human part creature such as werewolf, demon, mermaid, tiefling, dragonborn',
    priority: 10,
  },

  'C11 - Stylized / Animated Character Reference Sheet': {
    matchKeywords: [
      'anime', 'cartoon', 'stylized', 'animated', '2d character', 'cel shaded',
      'illustration character', 'chibi', 'manga', 'comic character', 'toon',
      'painterly character', 'flat design character', 'pixel art character',
      'graphic novel character', 'hand drawn', 'illustrated character',
    ],
    matchDescription: 'Non-photorealistic stylized characters — anime, cartoon, 2D illustration, cel-shaded art styles',
    priority: 10,
  },

  'C12 - Child / Youth Character Reference Sheet': {
    matchKeywords: [
      'child', 'kid', 'boy', 'girl', 'youth', 'teen', 'teenager', 'toddler',
      'young character', 'juvenile', 'baby', 'infant', 'young hero', 'child hero',
      'school age', 'preteen', 'young adult', 'adolescent',
    ],
    matchDescription: 'Child and youth characters ages 1–17 with age-accurate proportions and facial features',
    priority: 10,
  },

  'C13 - Full Armor / Suit Character Reference Sheet': {
    matchKeywords: [
      'armor', 'armour', 'knight', 'astronaut', 'hazmat', 'power armor',
      'full suit', 'mech pilot', 'space suit', 'diving suit', 'plague doctor',
      'full plate', 'battle suit', 'exosuit', 'power suit', 'tactical suit',
      'full armor character', 'iron clad', 'plate mail', 'heavy armor',
      'stormtrooper', 'space marine', 'spartan armor', 'juggernaut suit',
    ],
    matchDescription: 'Characters whose identity IS the suit or armor — knight, astronaut, hazmat worker, mech pilot, full plate armor',
    priority: 9,
  },

  'C14 - Animal Character Reference Sheet': {
    matchKeywords: [
      'dog', 'cat', 'horse', 'wolf', 'eagle', 'bear', 'lion', 'tiger', 'fox',
      'rabbit', 'bird character', 'companion animal', 'pet', 'stallion', 'hound',
      'hawk', 'raven', 'owl', 'panther', 'cheetah', 'deer', 'elk', 'boar',
      'animal character', 'animal protagonist', 'animal companion', 'familiar',
      'mount animal', 'war horse', 'direwolf', 'snow leopard',
    ],
    matchDescription: 'Fully non-humanoid animal characters — dogs, cats, horses, wolves, birds, and wildlife companions',
    priority: 9,
  },

  // ─────────────────────────────────────────────────────────────
  // ENVIRONMENT TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'E01 - Full Production Environment Reference Sheet': {
    matchKeywords: [
      // exterior / outdoor
      'exterior', 'outdoor', 'outside', 'building exterior', 'facade', 'urban',
      'city', 'street', 'plaza', 'square', 'town', 'courtyard', 'alley',
      'neighborhood', 'district', 'village', 'campus', 'compound',
      'rooftop', 'bridge', 'park', 'garden exterior', 'waterfront', 'harbor',
      // interior venues & large spaces
      'arena', 'stadium', 'tournament', 'venue', 'stage', 'hall', 'auditorium',
      'colosseum', 'gymnasium', 'dojo', 'training ground', 'battle ring',
      // cultural / period settings
      'chinese traditional', 'japanese', 'medieval', 'ancient', 'historical setting',
      'period setting', 'traditional setting', 'cultural setting',
      // generic strong signals
      'location', 'setting', 'production reference', 'environment reference',
    ],
    matchDescription: 'Flagship full-production location reference sheet — any environment type: exterior, interior venue, cultural or period setting',
    priority: 4,
  },

  'E02 - General Environment (Fast)': {
    matchKeywords: [
      'quick environment', 'fast environment', 'concept location',
      'general location', 'simple environment', 'environment concept',
    ],
    matchDescription: 'Quick general environment concept pass — fewer panels for first-pass location exploration',
    priority: 2,
  },

  'E03 - Interior Property Identity Sheet': {
    matchKeywords: [
      'living room', 'bedroom', 'kitchen', 'bathroom', 'apartment',
      'house interior', 'home interior', 'real estate', 'room interior',
      'hallway', 'showroom', 'hotel room', 'property interior', 'condo',
      'penthouse interior', 'dining room', 'study', 'library room',
    ],
    matchDescription: 'Real estate and property interior spaces — rooms, apartments, homes, showrooms',
    priority: 7,
  },

  'E04 - Cinematic Travel Destination': {
    matchKeywords: [
      'travel destination', 'landmark', 'tourist', 'city landmark',
      'iconic location', 'famous place', 'destination', 'monument',
      'tourist attraction', 'viewpoint', 'panorama', 'sightseeing',
      'temple', 'cathedral', 'palace', 'ruins tourist',
    ],
    matchDescription: 'Cinematic travel destination reference — iconic landmarks, monuments, tourist destinations',
    priority: 7,
  },

  'E05 - Airbnb & Property Showcase': {
    matchKeywords: [
      'airbnb', 'vacation rental', 'holiday home', 'villa', 'cottage',
      'retreat', 'holiday property', 'rental property', 'cabin rental',
      'beach house', 'mountain cabin', 'country house',
    ],
    matchDescription: 'Vacation rental and Airbnb property showcase — holiday homes, villas, cottages, retreats',
    priority: 8,
  },

  'E06 - Guided Tour Experience (Zoo / Museum / Area)': {
    matchKeywords: [
      'zoo', 'museum', 'aquarium', 'gallery', 'exhibition', 'attraction',
      'tour location', 'wildlife park', 'safari park', 'theme park',
      'botanical garden', 'science center', 'visitor center',
    ],
    matchDescription: 'Guided tour attraction environments — zoos, museums, aquariums, galleries, wildlife parks',
    priority: 8,
  },

  'E07 - Luxury Resort & Hotel Marketing': {
    matchKeywords: [
      'hotel', 'resort', 'luxury hotel', 'spa', 'pool resort', 'five star',
      'boutique hotel', 'lodge', 'mansion', 'estate', 'palace hotel',
      'luxury resort', 'grand hotel', 'overwater bungalow', 'safari lodge',
    ],
    matchDescription: 'Luxury hotels, resorts, and spas — high-end hospitality marketing environments',
    priority: 8,
  },

  'E08 - Street & Cultural Explorer': {
    matchKeywords: [
      'market', 'bazaar', 'night market', 'food market', 'street scene',
      'cultural district', 'old town', 'medina', 'souk', 'street culture',
      'local market', 'spice market', 'flower market', 'fishing village',
      'back alley', 'lantern street', 'cobblestone street',
    ],
    matchDescription: 'Street scenes and cultural spaces — markets, bazaars, night markets, cultural alleyways',
    priority: 7,
  },

  'E09 - Nature & Adventure Landscape': {
    matchKeywords: [
      'mountain', 'forest', 'jungle', 'wilderness', 'landscape', 'nature',
      'valley', 'cliff', 'waterfall', 'canyon', 'glacier', 'tundra',
      'savanna', 'desert', 'beach', 'coastline', 'lake', 'river',
      'volcano', 'swamp', 'marsh', 'rainforest', 'bamboo forest',
      'cherry blossom', 'alpine', 'arctic', 'plains',
    ],
    matchDescription: 'Nature and adventure landscapes — mountains, forests, wilderness, coastlines, natural terrain',
    priority: 7,
  },

  'E10 - Historical & Period Location Reference Sheet': {
    matchKeywords: [
      'medieval', 'historical', 'ancient', 'period location', 'roman',
      'greek', 'castle', 'fortress', 'ruins', 'old city', 'ancient city',
      'temple ruins', 'colosseum', 'pyramid', 'historical battlefield',
      'victorian', 'renaissance', 'aztec', 'mayan', 'viking settlement',
      'samurai era', 'feudal', 'ancient rome', 'ancient egypt',
      'silk road', 'medieval town', 'dungeon stone',
    ],
    matchDescription: 'Historical and period locations — medieval castles, ancient ruins, historical towns, period-accurate settings',
    priority: 8,
  },

  'E11 - Pure Interior Reference Sheet': {
    matchKeywords: [
      'interior space', 'indoor space', 'hall', 'corridor', 'lobby',
      'chamber', 'vault', 'warehouse interior', 'factory interior',
      'hangar', 'station interior', 'arena interior', 'arena', 'throne room',
      'great hall', 'dungeon interior', 'laboratory', 'control room',
      'server room', 'power plant interior', 'cathedral interior',
      'temple interior', 'cave interior', 'underground chamber',
    ],
    matchDescription: 'Generic interior spaces — halls, corridors, chambers, industrial interiors, grand architectural interiors',
    priority: 5,
  },

  'E12 - Cinematic Establishing Shot': {
    matchKeywords: [
      'establishing shot', 'wide shot location', 'cinematic wide',
      'skyline', 'aerial establishing', 'overview location',
      'wide establishing', 'panoramic location', 'horizon line',
    ],
    matchDescription: 'Single cinematic establishing shot — wide atmospheric location reveal in one composed frame',
    priority: 5,
  },

  'E13 - Sci-Fi / Futuristic Environment Reference Sheet': {
    matchKeywords: [
      'sci-fi', 'futuristic', 'space station', 'cyberpunk', 'future city',
      'neon city', 'alien planet', 'spacecraft interior', 'orbital station',
      'research lab future', 'megacity', 'dystopian', 'utopian city',
      'space interior', 'alien landscape', 'terraformed planet',
      'holographic', 'neon alley', 'android city', 'bio lab',
      'cryogenic chamber', 'reactor room',
    ],
    matchDescription: 'Sci-fi and futuristic environments — space stations, cyberpunk cities, alien planets, spacecraft interiors',
    priority: 9,
  },

  'E14 - Fantasy / Magical Environment Reference Sheet': {
    matchKeywords: [
      'fantasy', 'magical', 'enchanted', 'fairy tale', 'magic forest',
      'elven', 'dwarven', 'floating island', 'crystal cave', 'dragon lair',
      'wizard tower', 'dark fantasy', 'high fantasy', 'mystical',
      'arcane', 'ethereal', 'realm', 'fantasy world', 'magical realm',
      'cursed castle', 'lich tower', 'fae forest', 'shadowrealm',
      'astral plane', 'underwater kingdom', 'sky city fantasy',
    ],
    matchDescription: 'Fantasy and magical environments — enchanted forests, magical castles, mystical realms, high and dark fantasy settings',
    priority: 9,
  },

  'E15 - Vehicle & Cockpit Interior Reference Sheet': {
    matchKeywords: [
      'cockpit', 'helicopter cockpit', 'car interior', 'vehicle interior',
      'aircraft interior', 'dashboard', 'pilot seat', 'driver seat',
      'cabin interior', 'fighter cockpit', 'jet cockpit', 'spaceship cockpit',
      'racing cockpit', 'submarine interior', 'tank interior',
      'spacecraft cabin', 'apache interior', 'blackhawk interior',
      'sports car interior', 'truck cab', 'train cab',
    ],
    matchDescription: 'Vehicle cockpit and interior reference — cars, helicopters, fighter jets, spacecraft cabins, any vehicle interior',
    priority: 10,
  },

  // ─────────────────────────────────────────────────────────────
  // PROP TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'P01 - Full Production Object Reference Sheet': {
    matchKeywords: [
      'object', 'item', 'prop', 'artifact', 'relic', 'tool', 'equipment',
      'device', 'generic prop', 'production prop', 'mystery object',
    ],
    matchDescription: 'Flagship generic production prop reference — use for any object not covered by a specialized prop template',
    priority: 2,
  },

  'P02 - Photorealistic Prop Identity Sheet (Fast)': {
    matchKeywords: [
      'quick prop', 'fast prop', 'simple prop', 'prop concept', 'prop draft',
    ],
    matchDescription: 'Quick prop concept pass — fewer panels, faster generation for prop exploration',
    priority: 1,
  },

  'P03 - Helicopter Identity Sheet': {
    matchKeywords: [
      'helicopter', 'chopper', 'helo', 'rotorcraft', 'apache', 'blackhawk',
      'chinook', 'huey', 'military helicopter', 'civilian helicopter',
      'rescue helicopter', 'attack helicopter', 'transport helicopter',
      'gunship', 'medevac', 'osprey', 'seahawk',
    ],
    matchDescription: 'Helicopter and rotorcraft identity sheet — military and civilian helicopters, exterior and detail reference',
    priority: 10,
  },

  'P04 - Robot Identity Sheet': {
    matchKeywords: [
      'robot prop', 'battle robot', 'war robot', 'combat droid',
      'military robot', 'sentry robot', 'turret robot', 'drone robot',
      'robot unit', 'mechanical unit prop',
    ],
    matchDescription: 'Robot prop identity sheet — standalone mechanical robot units as props, weapons, or secondary objects',
    priority: 8,
  },

  'P05 - Creature Identity Sheet': {
    matchKeywords: [
      'creature prop', 'monster prop', 'alien prop', 'creature design',
      'creature model', 'creature reference',
    ],
    matchDescription: 'Creature prop identity sheet — creature designs used as props or background creature elements',
    priority: 7,
  },

  'P06 - Consumer Product Identity Sheet': {
    matchKeywords: [
      'consumer product', 'electronics', 'phone', 'laptop', 'gadget',
      'appliance', 'tech product', 'headphones', 'camera product', 'speaker',
      'tablet', 'smartwatch', 'product design', 'earbuds', 'charger',
      'keyboard', 'mouse', 'monitor', 'television', 'coffee machine',
      'blender', 'kitchen appliance', 'power tool',
    ],
    matchDescription: 'Consumer electronics and product reference — phones, laptops, gadgets, home appliances, tech products',
    priority: 8,
  },

  'P07 - Jewelry & Precious Object Identity Sheet': {
    matchKeywords: [
      'jewelry', 'jewellery', 'ring', 'necklace', 'bracelet', 'earring',
      'crown', 'gem', 'diamond', 'gold jewelry', 'silver jewelry', 'pendant',
      'brooch', 'tiara', 'amulet', 'precious object', 'gemstone', 'sapphire',
      'ruby', 'emerald', 'pearl', 'locket', 'signet ring', 'talisman',
      'ornament', 'magical gem', 'cursed ring', 'enchanted jewelry',
    ],
    matchDescription: 'Jewelry and precious objects — rings, necklaces, crowns, gems, precious metals, magical ornaments',
    priority: 10,
  },

  'P08 - Photorealistic Car Prop Identity Sheet': {
    matchKeywords: [
      'car', 'automobile', 'vehicle', 'sports car', 'supercar', 'truck',
      'suv', 'sedan', 'coupe', 'van', 'pickup', 'racing car', 'muscle car',
      'electric car', 'luxury car', 'motorcycle', 'motorbike', 'bike vehicle',
      'buggy', 'jeep', 'armored vehicle', 'tank car', 'police car',
      'ambulance', 'fire truck', 'limousine',
    ],
    matchDescription: 'Photorealistic car and ground vehicle reference — cars, trucks, motorcycles, race cars, armored vehicles',
    priority: 10,
  },

  'P09 - Small & Simple Object Reference Sheet': {
    matchKeywords: [
      'small object', 'household item', 'everyday item', 'cup', 'bottle',
      'book', 'bag', 'key', 'candle', 'lamp', 'vase', 'clock', 'mirror',
      'frame', 'box', 'container', 'jar', 'bowl', 'plate', 'glass', 'mug',
      'pen', 'notebook', 'backpack', 'purse', 'satchel', 'lantern',
      'scroll', 'potion bottle', 'flask', 'compass', 'map',
    ],
    matchDescription: 'Small everyday objects and household items — cups, bottles, books, bags, tools, everyday props',
    priority: 6,
  },

  'P10 - Object in Context': {
    matchKeywords: [
      'prop in scene', 'object in environment', 'contextual prop',
      'prop placement', 'hero prop', 'featured object', 'object story',
      'atmospheric prop',
    ],
    matchDescription: 'Prop shown within its natural environment context — the object as a cinematic focal element in a scene',
    priority: 3,
  },

  'P11 - Weapon Identity Sheet': {
    matchKeywords: [
      'weapon', 'sword', 'gun', 'knife', 'blade', 'axe', 'bow', 'rifle',
      'pistol', 'shotgun', 'dagger', 'spear', 'lance', 'mace', 'warhammer',
      'crossbow', 'firearm', 'handgun', 'assault rifle', 'sniper rifle',
      'katana', 'rapier', 'scimitar', 'halberd', 'trident', 'club',
      'flail', 'glaive', 'arrow', 'quiver', 'grenade', 'explosive',
      'magical staff', 'wand weapon', 'enchanted sword', 'lightsaber',
    ],
    matchDescription: 'Weapon identity sheet — swords, guns, knives, bows, all weapon types with surface material and wear detail',
    priority: 10,
  },

  'P12 - Clothing / Costume / Garment Reference Sheet': {
    matchKeywords: [
      'clothing', 'clothes', 'outfit', 'garment', 'dress', 'shirt', 'coat',
      'jacket', 'uniform', 'costume', 'robe', 'cloak', 'fashion item',
      'wardrobe', 'suit clothing', 'gown', 'tunic', 'vest', 'pants',
      'boots', 'shoe', 'hat', 'helmet clothing', 'cape', 'hood',
      'armor costume', 'fantasy outfit', 'period costume', 'military uniform',
    ],
    matchDescription: 'Clothing and costume reference — garments, outfits, uniforms, costumes, fashion items with fabric and construction detail',
    priority: 9,
  },

  // ─────────────────────────────────────────────────────────────
  // VIDEO TEMPLATES (basic annotations — agent uses these for video prompts)
  // ─────────────────────────────────────────────────────────────

  'V01 - Kling 3.0 Motion Character (Arc Shot)': {
    matchKeywords: ['motion character', 'kling', 'character arc', 'character orbit'],
    matchDescription: 'Character arc orbit shot for Kling 3.0 motion control',
    priority: 5,
  },
  'V02a - Property Tour: Exterior & Arrival (Pedestal Down + Dolly)': {
    matchKeywords: ['property tour', 'real estate video', 'house tour'],
    matchDescription: 'Real estate property tour — exterior arrival shot',
    priority: 5,
  },
  'V02b - Property Tour: Entrance & Living Room (Dolly Through)': {
    matchKeywords: ['property tour', 'living room tour'],
    matchDescription: 'Real estate property tour — entrance and living room reveal',
    priority: 5,
  },
  'V02c - Property Tour: Kitchen & Dining (Truck + Pan)': {
    matchKeywords: ['property tour', 'kitchen tour'],
    matchDescription: 'Real estate property tour — kitchen and dining area',
    priority: 5,
  },
  'V02d - Property Tour: Master Bedroom (Dolly Through + Pan)': {
    matchKeywords: ['property tour', 'bedroom tour'],
    matchDescription: 'Real estate property tour — master bedroom reveal',
    priority: 5,
  },
  'V02e - Property Tour: Children Bedroom (Dolly + Tilt Down)': {
    matchKeywords: ['property tour', 'children bedroom'],
    matchDescription: 'Real estate property tour — children bedroom',
    priority: 5,
  },
  'V02f - Property Tour: Bathroom (Slow Zoom In on Details)': {
    matchKeywords: ['property tour', 'bathroom tour'],
    matchDescription: 'Real estate property tour — bathroom detail zoom',
    priority: 5,
  },
  'V02g - Property Tour: Backyard & Garden (Dolly Through Door)': {
    matchKeywords: ['property tour', 'backyard tour', 'garden tour'],
    matchDescription: 'Real estate property tour — backyard and garden reveal',
    priority: 5,
  },
  'V02h - Property Tour: Closing & CTA (Zoom Out + Pedestal Up)': {
    matchKeywords: ['property tour', 'real estate closing'],
    matchDescription: 'Real estate property tour — closing and call to action',
    priority: 5,
  },
  'V05a - Car Tour: First Impression (Arc Shot 180°)': {
    matchKeywords: ['car tour', 'car video', 'car reveal'],
    matchDescription: 'Car showcase tour — first impression arc reveal',
    priority: 5,
  },
  'V05b - Car Tour: Exterior Walkaround (Truck Shot)': {
    matchKeywords: ['car tour', 'car walkaround'],
    matchDescription: 'Car showcase tour — exterior walkaround',
    priority: 5,
  },
  'V05c - Car Tour: Interior & Cockpit (Dolly Through Door)': {
    matchKeywords: ['car tour', 'car interior video', 'car cockpit video'],
    matchDescription: 'Car showcase tour — interior and cockpit reveal',
    priority: 5,
  },
  'V05d - Car Tour: Engine Bay (Dolly + Tilt Down)': {
    matchKeywords: ['car tour', 'engine bay'],
    matchDescription: 'Car showcase tour — engine bay detail',
    priority: 5,
  },
  'V05e - Car Tour: Driving Experience (Static Cockpit Rig)': {
    matchKeywords: ['car tour', 'driving experience video'],
    matchDescription: 'Car showcase tour — driving experience from cockpit rig',
    priority: 5,
  },
  'V05f - Car Tour: Performance (Low-Angle Tracking Shot)': {
    matchKeywords: ['car tour', 'car performance video'],
    matchDescription: 'Car showcase tour — performance tracking shot',
    priority: 5,
  },
  'V05g - Car Tour: Closing (Zoom Out to Hero Silhouette)': {
    matchKeywords: ['car tour', 'car closing shot'],
    matchDescription: 'Car showcase tour — closing hero silhouette',
    priority: 5,
  },
  'V06a - Fashion Lookbook: Opening Walk (Dolly Back + Arc)': {
    matchKeywords: ['fashion lookbook', 'fashion video'],
    matchDescription: 'Fashion lookbook — opening walk reveal',
    priority: 5,
  },
  'V06b - Fashion Lookbook: Casual Daywear (Telephoto Truck)': {
    matchKeywords: ['fashion lookbook', 'daywear video'],
    matchDescription: 'Fashion lookbook — casual daywear telephoto shot',
    priority: 5,
  },
  'V06c - Fashion Lookbook: Evening Glamour (Low-Angle Tilt Up)': {
    matchKeywords: ['fashion lookbook', 'evening fashion video'],
    matchDescription: 'Fashion lookbook — evening glamour low-angle reveal',
    priority: 5,
  },
  'V06d - Fashion Lookbook: Activewear (Arc Shot + Rim Light)': {
    matchKeywords: ['fashion lookbook', 'activewear video'],
    matchDescription: 'Fashion lookbook — activewear arc shot',
    priority: 5,
  },
  'V06e - Fashion Lookbook: Closing (Dolly Forward Push-In)': {
    matchKeywords: ['fashion lookbook', 'fashion closing'],
    matchDescription: 'Fashion lookbook — closing push-in shot',
    priority: 5,
  },
  'V07a - Fashion Haul: Try-On Reveal (Static + Jump Cut)': {
    matchKeywords: ['fashion haul', 'try on video'],
    matchDescription: 'Fashion haul — try-on reveal with jump cuts',
    priority: 5,
  },
  'V07b - Fashion Haul: OOTD (Static Full-Body)': {
    matchKeywords: ['fashion haul', 'ootd video', 'outfit of the day'],
    matchDescription: 'Fashion haul — OOTD full-body static shot',
    priority: 5,
  },
  'V07c - Fashion Haul: Outfit Orbit (180° Arc)': {
    matchKeywords: ['fashion haul', 'outfit orbit'],
    matchDescription: 'Fashion haul — 180° outfit orbit arc',
    priority: 5,
  },
  'V07d - Fashion Haul: Collection Review (Static Talking Head)': {
    matchKeywords: ['fashion haul', 'collection review'],
    matchDescription: 'Fashion haul — collection review talking head',
    priority: 5,
  },
  'V07e - Fashion Haul: Street Style (Telephoto + Slow-Mo)': {
    matchKeywords: ['fashion haul', 'street style video'],
    matchDescription: 'Fashion haul — street style telephoto slow-motion',
    priority: 5,
  },
  'V08 - Makeup Tutorial (Zoom In Macro + Static)': {
    matchKeywords: ['makeup tutorial', 'beauty tutorial', 'makeup video'],
    matchDescription: 'Makeup tutorial — macro zoom detail on application',
    priority: 5,
  },
  'V09 - Cooking Recipe (Overhead + Arc Plate)': {
    matchKeywords: ['cooking video', 'recipe video', 'food video'],
    matchDescription: 'Cooking and recipe video — overhead and arc plate shots',
    priority: 5,
  },
  'V10 - DIY Repair (Macro Hands + Dolly Push)': {
    matchKeywords: ['diy video', 'repair video', 'how to video'],
    matchDescription: 'DIY and repair tutorial — macro hands detail with dolly push',
    priority: 5,
  },
  'V11 - UGC Product Unboxing (Selfie Static)': {
    matchKeywords: ['ugc video', 'unboxing video', 'product video'],
    matchDescription: 'UGC product unboxing — selfie static shot',
    priority: 5,
  },
  'V12 - UGC Skincare Review (Close-Up + Macro)': {
    matchKeywords: ['ugc video', 'skincare video', 'beauty review'],
    matchDescription: 'UGC skincare review — close-up and macro skin detail',
    priority: 5,
  },
  'V13 - UGC App Review (Handheld Selfie POV)': {
    matchKeywords: ['ugc video', 'app review video'],
    matchDescription: 'UGC app review — handheld selfie POV',
    priority: 5,
  },
  'V14 - UGC Gym Shoes (Handheld + Low-Angle)': {
    matchKeywords: ['ugc video', 'shoes video', 'sneaker video'],
    matchDescription: 'UGC gym shoes — handheld low-angle product shot',
    priority: 5,
  },
  'V15 - UGC Gym Tour (Walking Selfie + Pan)': {
    matchKeywords: ['ugc video', 'gym tour video'],
    matchDescription: 'UGC gym tour — walking selfie with pan',
    priority: 5,
  },
  'V16 - UGC Building Tour (Selfie Walk-Through)': {
    matchKeywords: ['ugc video', 'building tour video'],
    matchDescription: 'UGC building tour — selfie walk-through',
    priority: 5,
  },
  'V17 - UGC Drink Taste Test (Static + Close-Up)': {
    matchKeywords: ['ugc video', 'drink video', 'taste test video'],
    matchDescription: 'UGC drink taste test — static and close-up reaction',
    priority: 5,
  },
  'V18 - UGC Restaurant Visit (Overhead + Reaction)': {
    matchKeywords: ['ugc video', 'restaurant video', 'food review video'],
    matchDescription: 'UGC restaurant visit — overhead food and reaction shots',
    priority: 5,
  },
  'V19 - UGC Lip Product (Car Selfie + Natural Light)': {
    matchKeywords: ['ugc video', 'lip product video', 'beauty ugc'],
    matchDescription: 'UGC lip product review — car selfie natural light',
    priority: 5,
  },
  'V20 - UGC Dentist Endorsement (Static Medium)': {
    matchKeywords: ['ugc video', 'dentist video', 'dental ugc'],
    matchDescription: 'UGC dentist endorsement — static medium talking head',
    priority: 5,
  },
  'V21 - UGC Dentist Demo (Static Close-Up)': {
    matchKeywords: ['ugc video', 'dentist demo video'],
    matchDescription: 'UGC dentist demo — static close-up procedure',
    priority: 5,
  },
  'V22 - UGC Dentist Education (Talking Head + Model Demo)': {
    matchKeywords: ['ugc video', 'dentist education video'],
    matchDescription: 'UGC dentist education — talking head with dental model demo',
    priority: 5,
  },
  'V23a - Travel: Destination Arrival (Pedestal Down + Dolly)': {
    matchKeywords: ['travel video', 'destination arrival video'],
    matchDescription: 'Travel video — destination arrival pedestal down reveal',
    priority: 5,
  },
  'V23b - Travel: Cultural Experience (Truck + Pan)': {
    matchKeywords: ['travel video', 'cultural experience video'],
    matchDescription: 'Travel video — cultural experience truck and pan',
    priority: 5,
  },
  'V23c - Travel: Hotel & Accommodation (Dolly Through + Tilt)': {
    matchKeywords: ['travel video', 'hotel video'],
    matchDescription: 'Travel video — hotel accommodation reveal',
    priority: 5,
  },
  'V23d - Travel: Adventure & Activity (Truck + Zoom In)': {
    matchKeywords: ['travel video', 'adventure video'],
    matchDescription: 'Travel video — adventure activity truck and zoom',
    priority: 5,
  },
  'V23e - Travel: Sunset & Closing (Arc Shot + Pedestal Up)': {
    matchKeywords: ['travel video', 'travel closing shot'],
    matchDescription: 'Travel video — sunset and closing arc pedestal up',
    priority: 5,
  },
  'V24 - Lipsync: Singing (Static Close-Up)': {
    matchKeywords: ['lipsync video', 'singing video'],
    matchDescription: 'Lipsync singing — static close-up',
    priority: 5,
  },
  'V25 - Lipsync: Talking Head (Static Medium)': {
    matchKeywords: ['lipsync video', 'talking head video'],
    matchDescription: 'Lipsync talking head — static medium shot',
    priority: 5,
  },
  'V26 - Lipsync: Narration (Static Medium + Key Light)': {
    matchKeywords: ['lipsync video', 'narration video'],
    matchDescription: 'Lipsync narration — static medium with key light',
    priority: 5,
  },
  'V27 - Airbnb: Dolly Through Room Reveal': {
    matchKeywords: ['airbnb video', 'room reveal video'],
    matchDescription: 'Airbnb room reveal — dolly through',
    priority: 5,
  },
  'V28 - Walking Tour: Dolly Forward POV': {
    matchKeywords: ['walking tour video', 'pov tour video'],
    matchDescription: 'Walking tour — dolly forward POV',
    priority: 5,
  },
  'V29 - Zoo Wildlife: Static to Life + Slow Zoom': {
    matchKeywords: ['zoo video', 'wildlife video'],
    matchDescription: 'Zoo wildlife — static to life with slow zoom',
    priority: 5,
  },
  'V30 - Museum: Dolly + Tilt Up (Grand Reveal)': {
    matchKeywords: ['museum video', 'gallery video'],
    matchDescription: 'Museum grand reveal — dolly and tilt up',
    priority: 5,
  },
  'V31 - Night Market: Truck Shot + Rack Focus': {
    matchKeywords: ['night market video', 'market video'],
    matchDescription: 'Night market — truck shot with rack focus',
    priority: 5,
  },
  'V32 - Nature Epic: Pedestal Up (Landscape Reveal)': {
    matchKeywords: ['nature video', 'landscape video'],
    matchDescription: 'Nature epic — pedestal up landscape reveal',
    priority: 5,
  },
  'V33 - Travel: Arc Shot Around Subject': {
    matchKeywords: ['travel video', 'arc travel shot'],
    matchDescription: 'Travel arc shot around subject',
    priority: 5,
  },
  'V34 - Travel: Dolly Zoom (Vertigo Effect)': {
    matchKeywords: ['travel video', 'vertigo effect video', 'dolly zoom'],
    matchDescription: 'Travel dolly zoom — vertigo effect',
    priority: 5,
  },
  'V35 - Travel: Static to Life (Photo Animation)': {
    matchKeywords: ['travel video', 'photo animation video'],
    matchDescription: 'Travel static to life — photo animation',
    priority: 5,
  },
  'V36 - Car Ad: Hero Reveal (Arc Shot 360°)': {
    matchKeywords: ['car ad video', 'car commercial'],
    matchDescription: 'Car ad — hero 360° arc reveal',
    priority: 5,
  },
  'V37 - Car Ad: Body Line Detail (Slow Truck)': {
    matchKeywords: ['car ad video', 'car detail video'],
    matchDescription: 'Car ad — body line detail slow truck',
    priority: 5,
  },
  'V38 - Car Ad: Static to Life (Paint Reflections)': {
    matchKeywords: ['car ad video', 'car paint video'],
    matchDescription: 'Car ad — static to life paint reflections',
    priority: 5,
  },
  'V39 - Car Ad: Rolling Shot (Truck Alongside)': {
    matchKeywords: ['car ad video', 'rolling shot car'],
    matchDescription: 'Car ad — rolling truck alongside shot',
    priority: 5,
  },
  'V40 - Car Ad: Front Approach (Dolly Back Low-Angle)': {
    matchKeywords: ['car ad video', 'car approach video'],
    matchDescription: 'Car ad — front approach dolly back low-angle',
    priority: 5,
  },
  'V41 - Car Ad: Interior Cockpit (Static + Light Sweep)': {
    matchKeywords: ['car ad video', 'car interior video'],
    matchDescription: 'Car ad — interior cockpit static with light sweep',
    priority: 5,
  },
  'V42 - Car Ad: Wheel & Brake (Zoom In Macro)': {
    matchKeywords: ['car ad video', 'car wheel video'],
    matchDescription: 'Car ad — wheel and brake macro zoom',
    priority: 5,
  },
  'V43 - TV Ad: Product Hero Reveal (Pedestal Up + Light Burst)': {
    matchKeywords: ['tv ad video', 'product commercial', 'product ad'],
    matchDescription: 'TV ad — product hero reveal pedestal up with light burst',
    priority: 5,
  },
  'V44 - TV Ad: Product in Action (Macro Slow-Motion)': {
    matchKeywords: ['tv ad video', 'product in action video'],
    matchDescription: 'TV ad — product in action macro slow-motion',
    priority: 5,
  },
  'V45 - TV Ad: Lifestyle Context (Dolly + Rack Focus)': {
    matchKeywords: ['tv ad video', 'lifestyle ad video'],
    matchDescription: 'TV ad — lifestyle context dolly with rack focus',
    priority: 5,
  },

  // ─────────────────────────────────────────────────────────────
  // DESIGN TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'D01 - Magazine Cover: Fashion Editorial': {
    matchKeywords: ['magazine cover', 'fashion editorial', 'vogue style'],
    matchDescription: 'High-end fashion magazine cover — editorial portrait layout',
    priority: 7,
  },
  'D02 - Magazine Cover: Tech/Business': {
    matchKeywords: ['magazine cover', 'business magazine', 'tech magazine'],
    matchDescription: 'Tech and business magazine cover — professional leader portrait',
    priority: 7,
  },
  'D03 - YouTube Thumbnail: Reaction/Shock': {
    matchKeywords: ['youtube thumbnail', 'reaction thumbnail', 'shock thumbnail'],
    matchDescription: 'High-CTR YouTube reaction thumbnail — exaggerated expression, vibrant background',
    priority: 7,
  },
  'D04 - YouTube Thumbnail: Tutorial/How-To': {
    matchKeywords: ['youtube thumbnail', 'tutorial thumbnail', 'how to thumbnail'],
    matchDescription: 'Tutorial YouTube thumbnail — presenter pointing at result',
    priority: 7,
  },
  'D05 - YouTube Thumbnail: VS/Comparison': {
    matchKeywords: ['youtube thumbnail', 'vs thumbnail', 'comparison thumbnail'],
    matchDescription: 'VS comparison YouTube thumbnail — split frame dramatic contrast',
    priority: 7,
  },
  'D06 - Instagram Post: Lifestyle Product': {
    matchKeywords: ['instagram post', 'product instagram', 'lifestyle post'],
    matchDescription: 'Aesthetic Instagram product lifestyle post — styled flat lay or product scene',
    priority: 7,
  },
  'D07 - Instagram Story: Event Announcement': {
    matchKeywords: ['instagram story', 'event announcement', 'story design'],
    matchDescription: 'Vertical Instagram Story for event promotion — editorial design with dramatic lighting',
    priority: 7,
  },
  'D08 - TikTok Cover: Bold & Vibrant': {
    matchKeywords: ['tiktok cover', 'tiktok design', 'social media cover'],
    matchDescription: 'Bold TikTok video cover — Gen-Z aesthetic, maximum visual impact',
    priority: 7,
  },
  'D09 - Movie Poster: Action/Thriller': {
    matchKeywords: ['movie poster', 'film poster', 'action poster', 'thriller poster'],
    matchDescription: 'Cinematic action movie poster — hero pose, epic background, one-sheet layout',
    priority: 7,
  },
  'D10 - Poster: Music/Concert': {
    matchKeywords: ['concert poster', 'music poster', 'event poster'],
    matchDescription: 'Concert and music event poster — dramatic silhouette, stage lighting aesthetic',
    priority: 7,
  },
  'D11 - Book Cover: Sci-Fi/Fantasy': {
    matchKeywords: ['book cover', 'novel cover', 'sci-fi cover', 'fantasy book'],
    matchDescription: 'Epic sci-fi or fantasy book cover — character against vast impossible landscape',
    priority: 7,
  },
  'D12 - Album Art: R&B/Hip-Hop': {
    matchKeywords: ['album art', 'album cover', 'music artwork', 'hip hop cover'],
    matchDescription: 'Square album artwork — artistic character portrait with abstract elements',
    priority: 7,
  },

  // ─────────────────────────────────────────────────────────────
  // CAMERA TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'CA01 - Slow Dolly Push In': {
    matchKeywords: ['dolly push', 'push in', 'slow dolly', 'forward move'],
    matchDescription: 'Slow cinematic dolly push-in — camera moves forward toward subject creating intimacy',
    priority: 5,
  },
  'CA02 - Arc / Orbital Shot': {
    matchKeywords: ['arc shot', 'orbit shot', 'orbital camera', 'camera orbit'],
    matchDescription: 'Smooth arc orbit — camera circles subject at fixed distance revealing all angles',
    priority: 5,
  },
  'CA03 - Handheld Documentary': {
    matchKeywords: ['handheld', 'documentary style', 'naturalistic camera', 'raw footage'],
    matchDescription: 'Handheld documentary style — organic camera movement communicating authenticity',
    priority: 5,
  },
  'CA04 - Crane Rise / Pedestal Up': {
    matchKeywords: ['crane shot', 'pedestal up', 'camera rise', 'vertical rise'],
    matchDescription: 'Crane rise — camera ascends vertically revealing scale and context',
    priority: 5,
  },
  'CA05 - Tracking / Follow Shot': {
    matchKeywords: ['tracking shot', 'follow shot', 'camera follow', 'moving follow'],
    matchDescription: 'Tracking follow shot — camera maintains distance while moving with subject',
    priority: 5,
  },
  'CA06 - Whip Pan Transition': {
    matchKeywords: ['whip pan', 'snap pan', 'fast pan', 'transition pan'],
    matchDescription: 'Whip pan — rapid horizontal pan creating motion blur for energetic transitions',
    priority: 5,
  },
  'CA07 - Static Lock-Off': {
    matchKeywords: ['static shot', 'locked off', 'tripod shot', 'still camera'],
    matchDescription: 'Static locked-off shot — completely still camera, all motion from subjects',
    priority: 5,
  },
  'CA08 - Low Angle / Worm\'s Eye': {
    matchKeywords: ['low angle', 'worm eye', 'looking up', 'below subject'],
    matchDescription: "Low angle / worm's eye — camera below subject looking up, exaggerating power",
    priority: 5,
  },
  'CA09 - Dutch Angle / Canted Frame': {
    matchKeywords: ['dutch angle', 'canted frame', 'tilted camera', 'diagonal horizon'],
    matchDescription: 'Dutch angle — camera rotated on roll axis creating psychological unease',
    priority: 5,
  },
  'CA10 - Drone / Aerial Establishing': {
    matchKeywords: ['drone shot', 'aerial shot', 'aerial establishing', 'bird eye view'],
    matchDescription: 'Drone aerial establishing — high altitude overview establishing location and scale',
    priority: 5,
  },

  // ─────────────────────────────────────────────────────────────
  // ACTION TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'AC01 - Hero Entrance / Reveal': {
    matchKeywords: ['hero entrance', 'character reveal', 'introduction scene', 'arrival scene'],
    matchDescription: 'Hero entrance reveal — deliberate arrival that commands the frame and establishes presence',
    priority: 5,
  },
  'AC02 - Combat / Fight Action': {
    matchKeywords: ['combat', 'fight scene', 'battle action', 'physical confrontation'],
    matchDescription: 'Combat and fight action — explosive physical confrontation with correct body mechanics',
    priority: 5,
  },
  'AC03 - Emotional Reaction / Close-Up': {
    matchKeywords: ['emotional reaction', 'close up acting', 'facial expression scene', 'reaction shot'],
    matchDescription: 'Emotional reaction close-up — internal story told through micro-expressions',
    priority: 5,
  },
  'AC04 - Running / Chase Sequence': {
    matchKeywords: ['running scene', 'chase sequence', 'pursuit scene', 'fleeing scene'],
    matchDescription: 'Running and chase sequence — urgent motion through environment at full commitment',
    priority: 5,
  },
  'AC05 - Dialogue / Conversation': {
    matchKeywords: ['dialogue scene', 'conversation scene', 'two shot', 'talking scene'],
    matchDescription: 'Dialogue and conversation — physical distance and body language communicating relationship',
    priority: 5,
  },
  'AC06 - Discovery / Investigation': {
    matchKeywords: ['discovery scene', 'investigation scene', 'examining scene', 'found object scene'],
    matchDescription: 'Discovery and investigation — character examines something significant with full attention',
    priority: 5,
  },
  'AC07 - Crowd / Group Scene': {
    matchKeywords: ['crowd scene', 'group scene', 'mass scene', 'ensemble scene'],
    matchDescription: 'Crowd and group scene — collective motion with individual reactions and a focal character',
    priority: 5,
  },

  // ─────────────────────────────────────────────────────────────
  // NOTES TEMPLATES
  // ─────────────────────────────────────────────────────────────

  'N01 - Director\'s Intent': {
    matchKeywords: ["director's note", 'director intent', 'scene intent', 'vision note'],
    matchDescription: "Director's intent note — documents vision, tone, pacing, and performance direction for a scene",
    priority: 5,
  },
  'N02 - Scene Mood & Atmosphere': {
    matchKeywords: ['mood note', 'atmosphere note', 'scene tone', 'visual tone note'],
    matchDescription: 'Scene mood and atmosphere — defines emotional register, light quality, and colour palette',
    priority: 5,
  },
  'N03 - Continuity Note': {
    matchKeywords: ['continuity note', 'matching note', 'continuity flag', 'scene matching'],
    matchDescription: 'Continuity note — flags costume, prop, and environment matching requirements between scenes',
    priority: 5,
  },
  'N04 - VFX / Technical Note': {
    matchKeywords: ['vfx note', 'technical note', 'visual effects note', 'post production note'],
    matchDescription: 'VFX and technical note — on-set requirements and post-production handoff for visual effects',
    priority: 5,
  },
  'N05 - Casting & Character Note': {
    matchKeywords: ['casting note', 'character note', 'performance note', 'character direction'],
    matchDescription: 'Casting and character note — who the character is, what they want, and how to perform them',
    priority: 5,
  },

  // ─────────────────────────────────────────────────────────────
  // OTHER
  // ─────────────────────────────────────────────────────────────

  'O01 - Prompt Edit Image': {
    matchKeywords: ['edit image', 'modify image', 'adjust image', 'image edit'],
    matchDescription: 'Image editing prompt — modify or adjust an existing image',
    priority: 3,
  },
};
