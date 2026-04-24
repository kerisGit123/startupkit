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
  // Camera Medium Presets (S17-S22)
  { id: "vhs-camcorder", label: "VHS Camcorder", gradient: "from-yellow-700 to-orange-800", preview: "https://images.unsplash.com/photo-1594909122845-11baa439b7bf?w=400&h=300&fit=crop" },
  { id: "smartphone", label: "Smartphone", gradient: "from-gray-500 to-blue-600", preview: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?w=400&h=300&fit=crop" },
  { id: "webcam", label: "Webcam", gradient: "from-green-600 to-gray-600", preview: "https://images.unsplash.com/photo-1596742578443-7682ef5251cd?w=400&h=300&fit=crop" },
  { id: "dslr-handheld", label: "DSLR Handheld", gradient: "from-amber-500 to-gray-700", preview: "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=400&h=300&fit=crop" },
  { id: "cctv", label: "CCTV", gradient: "from-green-800 to-gray-900", preview: "https://images.unsplash.com/photo-1590856029826-c7a73142bbf1?w=400&h=300&fit=crop" },
  { id: "35mm-film", label: "35mm Film", gradient: "from-amber-600 to-red-800", preview: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=400&h=300&fit=crop" },
  { id: "custom", label: "Custom", gradient: "from-purple-500 to-pink-500", preview: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop" },
];

// Style ID → default style prompt mapping. Used to auto-populate project.stylePrompt when style is selected.
export const STYLE_PROMPTS: Record<string, string> = {
  "cinematic": "Cinematic film look. Shot on ARRI Alexa with anamorphic lenses. Warm color grading with teal shadows and amber highlights. Shallow depth of field with natural bokeh. Dramatic side lighting with soft fill. Film grain texture. 2.39:1 widescreen composition. Rich contrast, lifted blacks, desaturated midtones. Professional color science reminiscent of Roger Deakins cinematography.",
  "sketch": "Hand-drawn pencil sketch style. Graphite on textured paper with visible tooth. Loose gestural strokes for form, tighter rendering for focal areas. Cross-hatching and stippling for shadows. Visible construction lines and guide marks. Soft HB pencil for light areas, dark 6B for deep shadows. Smudged edges for atmospheric depth. Paper texture visible throughout. Raw, immediate, sketchbook quality.",
  "dynamic-ink": "Dynamic ink illustration. Bold black ink with aggressive splatter and drip marks. High contrast black and white with occasional spot color accent. Energetic brushstrokes with speed and force. Ink wash gradients for depth. Splattered ink creating organic texture. Japanese calligraphy brush influence. Raw, expressive, kinetic energy in every stroke.",
  "vintage-bw": "Vintage retro film style. Faded colors with heavy warm cast — yellowed highlights, orange midtones, teal shadows. Heavy film grain with light leaks and lens flare. Slightly overexposed with blown-out highlights. Soft focus with chromatic aberration at edges. Kodak Portra color science. Vignetting at corners. Muted pastel palette. 1970s-80s aesthetic. Nostalgic, dreamy, sun-drenched atmosphere.",
  "japanese-ink": "Traditional Japanese sumi-e ink wash painting. Black ink on rice paper with varying ink density — from pale grey washes to deep saturated black. Minimalist composition with intentional empty space (ma). Confident single-stroke brushwork — each stroke deliberate and unrepeated. Bamboo brush texture visible in dry-brush passages. Zen aesthetic — simplicity, asymmetry, natural flow.",
  "woodblock": "Japanese woodblock print style (ukiyo-e). Bold black outlines with flat color fills. Limited color palette — indigo, vermillion, ochre, forest green. Visible wood grain texture in printed areas. Registration marks from multi-block printing. Gradated color using bokashi technique. Flowing lines for water and fabric. Stylized clouds and waves. Edo period aesthetic with modern composition.",
  "cartoon": "Bright cartoon animation style. Bold clean outlines with consistent stroke weight. Flat vibrant colors — primary palette with high saturation. Exaggerated proportions and expressions. Simple clean shapes. Smooth gradients for shadows. Big eyes, expressive mouths. Bouncy, energetic, playful. Saturday morning cartoon aesthetic. Family-friendly, fun, instantly readable.",
  "3d-animation": "Pixar/Disney 3D animation style. Clean subsurface scattering on skin with warm glow. Large expressive eyes with detailed iris reflections. Stylized proportions — slightly oversized heads, expressive hands. Smooth surfaces with subtle texture. Volumetric studio lighting — warm key light, cool fill, subtle rim. Rich saturated color palette. Professional render quality with ambient occlusion and global illumination.",
  "anime": "Japanese anime art style. Clean cel-shaded rendering with bold outlines. Vibrant saturated colors with smooth gradients. Large expressive eyes with detailed highlights. Dynamic hair with individual strand detail. Soft ambient occlusion shading. Studio Ghibli-inspired background painting with watercolor sky. Clean line art, consistent stroke weight. Beautiful lighting with rim highlights and color bounce.",
  "pencil": "Hand-drawn pencil sketch style. Graphite on textured paper with visible tooth. Loose gestural strokes for form, tighter rendering for focal areas. Cross-hatching and stippling for shadows. Visible construction lines and guide marks. Paper texture visible throughout. Artistic imperfection — eraser marks, finger smudges, overlapping strokes. Raw, immediate, sketchbook quality.",
  "comic-book": "Western comic book style. Bold black ink outlines with confident line weight variation — thick for contours, thin for detail. Flat cel colors with dramatic shadows. Cross-hatching for texture and depth. Dynamic foreshortened poses with extreme perspective. Speed lines and motion blur for action. Rich saturated colors — primary palette. Marvel/DC inspired visual language with kinetic energy.",
  "pixel-art": "Retro pixel art style. Crisp square pixels with no anti-aliasing. Limited 16-32 color palette with careful dithering for gradients. Clean readable silhouettes. 16-bit era aesthetic with detailed sprite work. Bright saturated colors on dark backgrounds. Pixel-perfect placement with no sub-pixel rendering. Nostalgic video game aesthetic.",
  "watercolor": "Traditional watercolor painting style. Soft translucent washes with visible paper texture showing through. Wet-on-wet blending with organic color bleeding at edges. Limited palette with harmonious color mixing. Loose brushwork with confident strokes. White paper preserved as highlights. Subtle granulation in darker tones. Natural paint drips and splatter marks. Hand-painted quality with artistic imperfection.",
  "oil-painting": "Classical oil painting style. Rich impasto brushstrokes with visible texture and paint thickness. Deep, luminous color with layered glazing technique. Chiaroscuro lighting with dramatic light-dark contrast. Warm undertones in shadows, cool highlights. Canvas weave texture visible in thin areas. Renaissance-inspired composition. Rembrandt lighting on faces. Museum-quality fine art presentation.",
  "noir": "Film noir style. High contrast black and white with deep pure blacks and bright whites. Dramatic hard shadows from venetian blinds, streetlamps, or single light sources. Expressionistic angles and Dutch tilts. Fog, rain, and wet reflective surfaces. Silhouettes and rim lighting. 1940s aesthetic. Gritty urban atmosphere. Moody, mysterious, dangerous atmosphere.",
  "pop-art": "Pop art style inspired by Andy Warhol and Roy Lichtenstein. Bold flat colors — primary red, blue, yellow with black outlines. Ben-Day dot halftone pattern on skin and backgrounds. High contrast with no subtle gradients. Thick comic-book outlines. Bright saturated palette. Screen-print aesthetic with slight color misregistration. Bold, graphic, immediate visual impact.",
  "vhs-camcorder": "VHS camcorder footage from the 1990s. Analog video artifacts — scan lines, tracking noise, slight color bleed between channels. Warm oversaturated colors shifting toward red and yellow. Soft focus with slight blur. Interlacing artifacts on motion. Low resolution with visible noise. Date/time stamp overlay in bottom corner. Auto-exposure adjustments causing brightness shifts. Slight barrel distortion from cheap lens. Home video feel — raw, unpolished, authentic.",
  "smartphone": "Smartphone video shot on iPhone. Slightly shaky handheld movement with digital stabilization corrections. Natural auto-exposure and auto-white-balance shifts. High dynamic range with slightly over-processed HDR look. Natural compression artifacts. Tap-to-focus with occasional focus hunting. Built-in lens characteristics — wide angle slight distortion, no optical zoom. Natural ambient lighting — no professional lights. Casual, spontaneous, authentic social media quality.",
  "webcam": "Webcam footage, 720p resolution. Fixed camera angle, slightly above eye level. Flat, unflattering indoor lighting from overhead fluorescents or desk lamp. Slight motion blur at 30fps. Auto-exposure creating washed-out skin tones. Compression artifacts especially in dark areas. Narrow depth of field from small sensor. Slight lag and frame drops. Background slightly out of focus. Video call aesthetic — zoom meeting, YouTube vlog, live stream quality.",
  "dslr-handheld": "DSLR handheld footage. Shallow depth of field with beautiful natural bokeh from fast 50mm lens. Subtle organic camera shake — professional but not stabilized. Accurate color reproduction with slight warmth. Full-frame sensor look with clean high-ISO performance. Natural rack focus between subjects. Slight breathing of the lens during focus pulls. Motion cadence of 24fps for cinematic feel. Available light photography — no artificial lighting rigs. Documentary style, intimate, observational.",
  "cctv": "Surveillance CCTV security camera footage. Wide-angle fisheye lens distortion. Fixed overhead or corner-mounted camera position. Low resolution with heavy compression artifacts. Harsh infrared or fluorescent lighting. Timestamp and camera ID overlay text. Monochrome green-tinted night vision or washed-out daytime colors. Motion detection artifacts. Frame rate drops creating slight stutter. No audio. Clinical, voyeuristic, unsettling perspective. Found footage aesthetic.",
  "35mm-film": "Shot on 35mm film stock. Organic film grain with natural density variation — heavier in shadows, lighter in highlights. Kodak Vision3 500T color science — warm skin tones, rich shadows, subtle halation around bright lights. Natural lens flare from anamorphic glass. Slight gate weave and frame jitter. Color dye layers creating natural cross-contamination between channels. Highlight rolloff that blooms naturally instead of clipping digitally. Mechanical shutter creating natural motion blur at 180-degree angle. The unmistakable organic texture of real celluloid.",
  "custom": "",
};

// Content format preset ID → prompt text mapping. Auto-appended to generation prompts when a format is selected.
// Format controls framing, pacing, energy, and camera behavior — NOT visual aesthetics (that's Style).
export const FORMAT_PRESETS: { id: string; label: string; color: string; prompt: string }[] = [
  { id: "film", label: "Film", color: "#d97706", prompt: "Cinematic film framing. Wide establishing shots transitioning to medium close-ups. 24fps motion cadence with deliberate camera movement. Shot-reverse-shot conversation coverage. Careful depth staging with foreground, midground, background separation. Slow dolly and pan movements. Traditional three-act visual rhythm." },
  { id: "documentary", label: "Documentary", color: "#059669", prompt: "Documentary style framing. Observational handheld camera with natural subtle movement. Interview-style medium shots at eye level. B-roll coverage of environments and details. Available light, no staged compositions. Fly-on-the-wall perspective. Authentic, unscripted energy with reactive camera following action." },
  { id: "youtube", label: "YouTube", color: "#ef4444", prompt: "YouTube video framing. Direct-to-camera eye-level medium shot. Clean well-lit background with depth separation. Headroom for subscribe buttons and end screens. Engaging facial expressions visible. Bright, evenly lit subject. Open composition with space for text overlays and graphics. Energetic, personal, conversational tone." },
  { id: "reel", label: "Reel / TikTok", color: "#ec4899", prompt: "Short-form vertical content framing. 9:16 vertical composition optimized for mobile. Fast-paced cuts, punchy transitions. Subject centered with bold framing. Eye-catching opening frame. Space reserved for caption text at bottom and username at top. High energy, trend-aware, scroll-stopping visual impact. Quick visual payoff." },
  { id: "commercial", label: "Commercial", color: "#3b82f6", prompt: "Commercial advertisement framing. Product hero shots with clean isolation. Polished, brand-safe compositions. Smooth controlled camera movement — slider and gimbal. Lifestyle context showing product in use. Professional talent direction. Call-to-action framing in final frames. Premium, aspirational, purchase-motivating energy." },
  { id: "music-video", label: "Music Video", color: "#a855f7", prompt: "Music video framing. Performance shots alternating with narrative cutaways. Rhythmic editing synced to beat. Slow motion accent moments at 60-120fps. Dynamic camera movement — crane, steadicam, whip pans. Dramatic poses and choreographed movement. Stylized compositions with strong visual motifs. Energetic, expressive, visually bold." },
  { id: "vlog", label: "Vlog", color: "#f59e0b", prompt: "Vlog-style framing. Handheld or selfie-angle camera, slightly above eye level. Casual walk-and-talk movement. Natural environments, no staged sets. Frequent location changes and jump cuts. Personal, intimate distance to camera. Spontaneous, authentic, unpolished feel with genuine reactions." },
  { id: "tutorial", label: "Tutorial", color: "#10b981", prompt: "Tutorial instructional framing. Clear overhead or eye-level shots of workspace. Step-by-step visual progression. Clean uncluttered frame with subject centered. Space for text annotations and callout graphics. Well-lit detail shots for close-up demonstrations. Steady tripod-mounted camera. Methodical, clear, easy-to-follow visual flow." },
  { id: "presentation", label: "Presentation", color: "#6366f1", prompt: "Corporate presentation framing. Clean professional compositions with minimal distractions. Speaker medium shot with confident posture. Slide-compatible layouts with space for data overlays. Neutral corporate backgrounds. Even professional lighting. Steady camera, no handheld movement. Polished, authoritative, trustworthy visual tone." },
  { id: "podcast", label: "Podcast", color: "#8b5cf6", prompt: "Podcast video framing. Two or three-person conversation setup with individual medium shots. Clean desk or studio background with microphones visible. Switching between speaker close-ups and wide two-shot. Minimal camera movement, focus on faces and reactions. Relaxed conversational distance. Intimate, engaging, discussion-driven composition." },
  { id: "product-demo", label: "Product Demo", color: "#0ea5e9", prompt: "Product demonstration framing. Close-up detail shots of product features. Hands-on interaction showing scale and usability. Clean neutral background isolating the product. Smooth 360-degree rotation reveals. Macro shots of texture and materials. Before-after comparisons. Informative, clear, purchase-decision supporting visuals." },
  { id: "cinematic-ad", label: "Cinematic Ad", color: "#1e293b", prompt: "Cinematic advertisement framing. Film-quality camera movement — dolly, crane, steadicam tracking. Narrative storytelling structure with emotional arc. Hero moments with dramatic reveals. Shallow depth of field for premium feel. Aspirational lifestyle context. Brand integration without product dominance. Premium, emotionally resonant, story-driven commercial filmmaking." },
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
