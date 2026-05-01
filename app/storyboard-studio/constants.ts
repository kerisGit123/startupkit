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

// ── Genre Presets ──────────────────────────────────────────────────────────────
// Genre controls mood, lighting, tone, and atmosphere.
// 16 genres — flat list, no sub-categories.

export interface GenrePreset {
  id: string;
  label: string;
  gradient: string;
  preview: string;
}

export const GENRE_PRESETS: GenrePreset[] = [
  { id: "cinematic",     label: "Cinematic",     gradient: "from-amber-700 to-orange-900",  preview: "/storytica/element_forge/grids/genre/cinematic.png" },
  { id: "horror",        label: "Horror",        gradient: "from-red-900 to-gray-900",      preview: "/storytica/element_forge/grids/genre/horror.png" },
  { id: "noir",          label: "Noir",          gradient: "from-gray-900 to-gray-600",      preview: "/storytica/element_forge/grids/genre/noir.png" },
  { id: "sci-fi",        label: "Sci-Fi",        gradient: "from-cyan-600 to-blue-900",      preview: "/storytica/element_forge/grids/genre/sci-fi.png" },
  { id: "fantasy",       label: "Fantasy",       gradient: "from-purple-700 to-emerald-600",  preview: "/storytica/element_forge/grids/genre/fantasy.png" },
  { id: "drama",         label: "Drama",         gradient: "from-amber-800 to-gray-700",      preview: "/storytica/element_forge/grids/genre/drama.png" },
  { id: "action",        label: "Action",        gradient: "from-orange-600 to-red-700",      preview: "/storytica/element_forge/grids/genre/action.png" },
  { id: "comedy",        label: "Comedy",        gradient: "from-yellow-400 to-orange-400",    preview: "/storytica/element_forge/grids/genre/comedy.png" },
  { id: "thriller",      label: "Thriller",      gradient: "from-slate-700 to-blue-900",      preview: "/storytica/element_forge/grids/genre/thriller.png" },
  { id: "anime",         label: "Anime",         gradient: "from-pink-500 to-purple-500",      preview: "/storytica/element_forge/grids/genre/anime.png" },
  { id: "wuxia",         label: "Wuxia",         gradient: "from-emerald-700 to-slate-800",    preview: "/storytica/element_forge/grids/genre/wuxia.png" },
  { id: "cyberpunk",     label: "Cyberpunk",     gradient: "from-fuchsia-600 to-cyan-600",    preview: "/storytica/element_forge/grids/genre/cyberpunk.png" },
  { id: "luxury",        label: "Luxury",        gradient: "from-amber-500 to-yellow-700",    preview: "/storytica/element_forge/grids/genre/luxury.png" },
  { id: "epic",          label: "Epic",          gradient: "from-amber-600 to-indigo-800",    preview: "/storytica/element_forge/grids/genre/epic.png" },
  { id: "corporate",     label: "Corporate",     gradient: "from-blue-600 to-slate-700",      preview: "/storytica/element_forge/grids/genre/corporate.png" },
  { id: "vintage-retro", label: "Vintage Retro", gradient: "from-gray-500 to-gray-800",      preview: "/storytica/element_forge/grids/genre/vintage-retro.png" },
];

// Backward-compatible alias so old imports still work
export const VISUAL_STYLES = GENRE_PRESETS;

// Genre ID → prompt text mapping. Controls mood, lighting, tone, and atmosphere.
export const GENRE_PROMPTS: Record<string, string> = {
  "cinematic": "Cinematic film look. Shot on ARRI Alexa with anamorphic lenses. Warm color grading with teal shadows and amber highlights. Shallow depth of field with natural bokeh. Dramatic side lighting with soft fill. Film grain texture. 2.39:1 widescreen composition. Rich contrast, lifted blacks, desaturated midtones. Professional color science reminiscent of Roger Deakins cinematography.",
  "horror": "Horror film aesthetic. Desaturated cold color palette with sickly green and blue-grey undertones. Deep impenetrable shadows with minimal fill light. Single harsh light source creating stark shadows on faces. Slightly underexposed with crushed blacks. Unsettling Dutch angles and claustrophobic framing. Fog, mist, and atmospheric haze. Dim flickering practical lights. Tension in every shadow. Dread-inducing atmosphere.",
  "noir": "Film noir style. High contrast black and white with deep pure blacks and bright whites. Dramatic hard shadows from venetian blinds, streetlamps, or single light sources. Expressionistic angles and Dutch tilts. Fog, rain, and wet reflective surfaces. Silhouettes and rim lighting. 1940s aesthetic. Gritty urban atmosphere. Moody, mysterious, dangerous atmosphere.",
  "sci-fi": "Science fiction aesthetic. Cool blue-teal color palette with neon accent lighting in cyan, magenta, and electric blue. Volumetric light beams cutting through atmospheric haze. Holographic lens flares and anamorphic streaks. Hard-edged shadows from synthetic light sources. High contrast between shadow and neon glow. Slightly desaturated base tones with hyper-saturated accent colors. Futuristic, clinical, otherworldly atmosphere.",
  "fantasy": "Epic fantasy film lighting. Rich saturated color palette — deep emerald greens, royal purples, warm golds. Ethereal volumetric god-rays streaming through canopy or clouds. Magical warm ambient glow with slight bloom on highlights. Painterly quality with lush depth. Golden-hour warmth mixed with mystical cool tones. Atmospheric fog creating depth layers. Enchanted, mythical, wonder-filled atmosphere.",
  "drama": "Dramatic film lighting. Natural motivated lighting from windows and practicals. Subdued color palette with earthy desaturated tones — browns, muted greens, warm greys. Realistic skin tones with careful exposure. Thoughtful shadow placement revealing character emotion. Medium contrast with detail preserved in both shadows and highlights. Intimate compositions at eye level. Emotionally honest, grounded, naturalistic atmosphere.",
  "action": "High-energy action film aesthetic. High contrast with punchy saturated colors — deep orange explosions against teal shadows. Dynamic motion blur and speed ramping. Hard directional lighting with dramatic rim light. Slightly crushed blacks with boosted highlights. Lens flare from practical light sources. Shaky handheld energy in static frames. Fast, intense, adrenaline-pumping visual energy.",
  "comedy": "Bright comedy film lighting. High-key even lighting with minimal shadows. Warm, saturated color palette — vivid primary colors with cheerful tones. Clean well-lit compositions with nothing hidden. Slightly elevated color saturation for a lively feel. Soft neutral shadows, no harsh contrast. Open, inviting framing with space for expression. Light, fun, energetic, accessible atmosphere.",
  "thriller": "Psychological thriller aesthetic. Cold desaturated color palette with steel blue and muted green undertones. Low-key lighting with pools of light surrounded by darkness. Motivated shadows that feel deliberate and menacing. Slightly underexposed midtones creating unease. Sharp focused image with clinical precision. Cool white balance suggesting emotional distance. Tense, controlled, suspenseful atmosphere.",
  "anime": "Japanese anime art style. Clean cel-shaded rendering with bold outlines. Vibrant saturated colors with smooth gradients. Large expressive eyes with detailed highlights. Dynamic hair with individual strand detail. Soft ambient occlusion shading. Studio Ghibli-inspired background painting with watercolor sky. Clean line art, consistent stroke weight. Beautiful lighting with rim highlights and color bounce.",
  "wuxia": "Chinese wuxia martial arts film aesthetic. Misty mountain landscapes with layered fog creating infinite depth. Flowing silk robes and ribbons caught in wind. Bamboo forest with filtered ethereal light. Muted jade green and ink-wash grey color palette with selective warm gold accents. Soft diffused lighting suggesting early morning or twilight. Wire-fu gravity-defying movement implied in pose and composition. Chinese period drama color science — desaturated earth tones with rich fabric colors. Poetic, graceful, legendary atmosphere.",
  "cyberpunk": "Cyberpunk neon-noir aesthetic. Rain-slicked streets reflecting neon signs in magenta, cyan, and electric purple. Dense urban environment with holographic advertisements. Volumetric fog and steam from street vents catching colored light. High contrast between deep shadows and hyper-saturated neon glow. Cool blue-black base tones with hot accent colors. Lens flare from neon sources. Gritty, dystopian, technologically overwhelming atmosphere.",
  "luxury": "Premium luxury advertising aesthetic. Warm golden lighting with soft directional key light. Rich deep color palette — champagne gold, deep burgundy, midnight navy, cream white. Soft shadows with smooth falloff creating elegant depth. Slight warm color grading with lifted blacks for a polished look. Subtle lens flare and bokeh from product reflections. Clean negative space with refined composition. Aspirational, sophisticated, premium atmosphere.",
  "epic": "Epic cinematic grandeur. Sweeping wide-angle landscapes with massive scale — towering mountains, vast battlefields, endless horizons. Golden-hour and magic-hour lighting with dramatic god-rays breaking through storm clouds. Rich saturated color palette with deep golds, burnt oranges, and royal blues. Aerial and crane-level perspectives emphasizing scale and majesty. Slow deliberate camera movement. Orchestral energy — every frame feels monumental. Deep staging with layers of atmosphere, dust, and volumetric light. Heroic, awe-inspiring, larger-than-life atmosphere.",
  "corporate": "Clean professional aesthetic. Even, well-balanced studio lighting with soft shadows. Neutral color palette — clean whites, soft greys, trustworthy blues, subtle greens. High-key exposure with bright, airy feel. Sharp focus throughout with deep depth of field. Minimal distractions, clean backgrounds. Professional color grading — neutral white balance, accurate skin tones. Polished, credible, approachable, trustworthy atmosphere.",
  "vintage-retro": "Vintage retro film style. Faded colors with heavy warm cast — yellowed highlights, orange midtones, teal shadows. Heavy film grain with light leaks and lens flare. Slightly overexposed with blown-out highlights. Soft focus with chromatic aberration at edges. Kodak Portra color science. Vignetting at corners. Muted pastel palette. 1970s-80s aesthetic. Nostalgic, dreamy, sun-drenched atmosphere.",
};

// Backward-compatible aliases
export const STYLE_PROMPTS = GENRE_PROMPTS;

// ── Genre + Format Combo Tips ─────────────────────────────────────────────────
// Shown in the Genre picker to help users understand how to combine Genre + Format.
export const GENRE_COMBO_TIPS: { label: string; genre: string; format: string }[] = [
  { label: "UGC Content",          genre: "Comedy or Bold",   format: "YouTube or Reel/TikTok" },
  { label: "Finance Education",    genre: "Corporate",        format: "Tutorial or Presentation" },
  { label: "Software Tutorial",    genre: "Corporate",        format: "Tutorial or Product Demo" },
  { label: "Product Ad (Premium)", genre: "Luxury",           format: "Commercial or Cinematic Ad" },
  { label: "Product Ad (Tech)",    genre: "Action",            format: "Commercial or Product Demo" },
  { label: "Short Film",          genre: "Cinematic or Drama", format: "Film" },
  { label: "Horror Short",        genre: "Horror",            format: "Film" },
  { label: "Anime Series",        genre: "Anime",             format: "Film" },
  { label: "Wuxia Film",          genre: "Wuxia",             format: "Film or Cinematic Ad" },
  { label: "Documentary",         genre: "Drama or Corporate", format: "Documentary" },
];

// Content format preset ID → prompt text mapping. Auto-appended to generation prompts when a format is selected.
// Format controls framing, pacing, energy, and camera behavior — NOT visual aesthetics (that's Style).
export const FORMAT_PRESETS: { id: string; label: string; color: string; preview: string; prompt: string }[] = [
  { id: "film", label: "Film", color: "#d97706", preview: "/storytica/element_forge/grids/format/film.png", prompt: "Cinematic film framing. Wide establishing shots transitioning to medium close-ups. 24fps motion cadence with deliberate camera movement. Shot-reverse-shot conversation coverage. Careful depth staging with foreground, midground, background separation. Slow dolly and pan movements. Traditional three-act visual rhythm." },
  { id: "documentary", label: "Documentary", color: "#059669", preview: "/storytica/element_forge/grids/format/documentary.png", prompt: "Documentary style framing. Observational handheld camera with natural subtle movement. Interview-style medium shots at eye level. B-roll coverage of environments and details. Available light, no staged compositions. Fly-on-the-wall perspective. Authentic, unscripted energy with reactive camera following action." },
  { id: "youtube", label: "YouTube", color: "#ef4444", preview: "/storytica/element_forge/grids/format/youtube.png", prompt: "YouTube video framing. Direct-to-camera eye-level medium shot. Clean well-lit background with depth separation. Headroom for subscribe buttons and end screens. Engaging facial expressions visible. Bright, evenly lit subject. Open composition with space for text overlays and graphics. Energetic, personal, conversational tone." },
  { id: "reel", label: "Reel / TikTok", color: "#ec4899", preview: "/storytica/element_forge/grids/format/reel.png", prompt: "Short-form vertical content framing. 9:16 vertical composition optimized for mobile. Fast-paced cuts, punchy transitions. Subject centered with bold framing. Eye-catching opening frame. Space reserved for caption text at bottom and username at top. High energy, trend-aware, scroll-stopping visual impact. Quick visual payoff." },
  { id: "commercial", label: "Commercial", color: "#3b82f6", preview: "/storytica/element_forge/grids/format/commercial.png", prompt: "Commercial advertisement framing. Product hero shots with clean isolation. Polished, brand-safe compositions. Smooth controlled camera movement — slider and gimbal. Lifestyle context showing product in use. Professional talent direction. Call-to-action framing in final frames. Premium, aspirational, purchase-motivating energy." },
  { id: "music-video", label: "Music Video", color: "#a855f7", preview: "/storytica/element_forge/grids/format/music-video.png", prompt: "Music video framing. Performance shots alternating with narrative cutaways. Rhythmic editing synced to beat. Slow motion accent moments at 60-120fps. Dynamic camera movement — crane, steadicam, whip pans. Dramatic poses and choreographed movement. Stylized compositions with strong visual motifs. Energetic, expressive, visually bold." },
  { id: "vlog", label: "Vlog", color: "#f59e0b", preview: "/storytica/element_forge/grids/format/vlog.png", prompt: "Vlog-style framing. Handheld or selfie-angle camera, slightly above eye level. Casual walk-and-talk movement. Natural environments, no staged sets. Frequent location changes and jump cuts. Personal, intimate distance to camera. Spontaneous, authentic, unpolished feel with genuine reactions." },
  { id: "tutorial", label: "Tutorial", color: "#10b981", preview: "/storytica/element_forge/grids/format/tutorial.png", prompt: "Tutorial instructional framing. Clear overhead or eye-level shots of workspace. Step-by-step visual progression. Clean uncluttered frame with subject centered. Space for text annotations and callout graphics. Well-lit detail shots for close-up demonstrations. Steady tripod-mounted camera. Methodical, clear, easy-to-follow visual flow." },
  { id: "presentation", label: "Presentation", color: "#6366f1", preview: "/storytica/element_forge/grids/format/presentation.png", prompt: "Corporate presentation framing. Clean professional compositions with minimal distractions. Speaker medium shot with confident posture. Slide-compatible layouts with space for data overlays. Neutral corporate backgrounds. Even professional lighting. Steady camera, no handheld movement. Polished, authoritative, trustworthy visual tone." },
  { id: "podcast", label: "Podcast", color: "#8b5cf6", preview: "/storytica/element_forge/grids/format/podcast.png", prompt: "Podcast video framing. Two or three-person conversation setup with individual medium shots. Clean desk or studio background with microphones visible. Switching between speaker close-ups and wide two-shot. Minimal camera movement, focus on faces and reactions. Relaxed conversational distance. Intimate, engaging, discussion-driven composition." },
  { id: "product-demo", label: "Product Demo", color: "#0ea5e9", preview: "/storytica/element_forge/grids/format/product-demo.png", prompt: "Product demonstration framing. Close-up detail shots of product features. Hands-on interaction showing scale and usability. Clean neutral background isolating the product. Smooth 360-degree rotation reveals. Macro shots of texture and materials. Before-after comparisons. Informative, clear, purchase-decision supporting visuals." },
  { id: "cinematic-ad", label: "Cinematic Ad", color: "#1e293b", preview: "/storytica/element_forge/grids/format/cinematic-ad.png", prompt: "Cinematic advertisement framing. Film-quality camera movement — dolly, crane, steadicam tracking. Narrative storytelling structure with emotional arc. Hero moments with dramatic reveals. Shallow depth of field for premium feel. Aspirational lifestyle context. Brand integration without product dominance. Premium, emotionally resonant, story-driven commercial filmmaking." },
];

// Format preset ID → prompt text lookup
export const FORMAT_PROMPT_MAP: Record<string, string> = Object.fromEntries(
  FORMAT_PRESETS.map(f => [f.id, f.prompt])
);

export const SAMPLE_SHOTS: Shot[] = [
  {
    id: "s1", scene: 1, shot: 1,
    description: "Max and Maria sitting side by side in first class, engrossed in their respective books",
    ert: "10 sec", shotSize: "Medium shot", perspective: "Eye-level shot", movement: "Static",
    equipment: "Handheld camera", focalLength: "35mm", aspectRatio: "16:9",
    cast: ["Grant"], location: "Abandoned Warehouse",
    voiceOver: "A man in a dark jacket enters a vast, dimly lit warehouse.",
    action: "Grant walks cautiously between towering stacks of wooden crates.",
    imagePrompt: "A detailed image of Max and Maria sitting side by side in first class",
    videoPrompt: "A cinematic video showing Max and Maria reading books",
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
    imagePrompt: "Close-up shot of a humming plane engine with detailed mechanical parts",
    videoPrompt: "Video of plane engine close-up with realistic sound effects",
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
    imagePrompt: "Pilot stepping out of cockpit with friendly expression",
    videoPrompt: "Cinematic shot of pilot exiting airplane cockpit",
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
    imagePrompt: "Dramatic shot of falling crate creating tension",
    videoPrompt: "Video sequence of crate falling with dramatic impact",
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
    imagePrompt: "Close-up of Max and Maria exchanging puzzled expressions",
    videoPrompt: "Video of two people discovering blueprints in a crate",
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
