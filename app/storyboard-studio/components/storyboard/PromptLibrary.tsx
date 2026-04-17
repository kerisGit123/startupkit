"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Edit, Trash2, Copy, Star, Grid, List, X, Zap, Clock, Save, Eye, RotateCcw } from 'lucide-react';

interface Prompt {
  _id: string;
  name: string;
  type: 'character' | 'environment' | 'prop' | 'design' | 'style' | 'camera' | 'action' | 'video' | 'other';
  prompt: string;
  notes?: string;
  companyId: string;
  isPublic: boolean;
  isSystem?: boolean;
  tags?: string[];
  usageCount: number;
}

const PROMPT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'character', label: 'Character' },
  { key: 'environment', label: 'Environment' },
  { key: 'prop', label: 'Prop' },
  { key: 'design', label: 'Design' },
  { key: 'style', label: 'Style' },
  { key: 'camera', label: 'Camera' },
  { key: 'action', label: 'Action' },
  { key: 'video', label: 'Video' },
  { key: 'other', label: 'Other' },
] as const;

const ITEMS_PER_PAGE = 12;

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userCompanyId: string;
}

const DEFAULT_PROMPT_TEMPLATES = [
  {
    name: 'C01 - UGC Character',
    type: 'character' as const,
    isSystem: true,
    tags: ['ugc', 'reference-sheet'],
    isPublic: false,
    notes: 'Character for UGC',
    prompt: `Create a professional character turnaround and reference sheet based on the reference image. Use the uploaded image as the primary visual reference for the character's identity, proportions, facial features, body shape, hairstyle, and overall design language, while translating it into a clean, neutral, reusable presentation board. The final image should be arranged like a polished concept art sheet on a pure white studio background. Show the same character in four full body views: front view, side profile, back view, and three quarter view. On the right side, include multiple clean detail panels with close ups of the eyes, upper face, lower face, lips, skin texture, hair detail, and one small clothing or material detail. Keep the styling neutral and generic so the sheet can be reused as a base template for future adaptations. Simplify anything overly specific, thematic, fantasy based, branded, culturally tied, or heavily ornamental from the source image into a more universal version while preserving the essence of the character. The outfit should become a clean neutral base outfit with minimal detailing, soft solid tones, and a refined silhouette. No excessive accessories, no dramatic headpieces, no strong lore specific elements, no heavy decoration unless they are essential to the base identity. The character should feel balanced, elegant, realistic, and adaptable. Expression should be calm and neutral. Makeup should be subtle and natural. Lighting should be soft, even, and studio clean. The layout should feel like a premium design presentation board used for model sheets, character development, or production reference. Preserve the core identity from @lmage1, but present it in a simplified, neutral, production ready format that can serve as a universal template for future redesigns.`,
  },
  {
    name: 'C02 - Ultra Realistic Character',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic'],
    isPublic: false,
    notes: '@Image1 = Character reference, @Image2 = Style reference (optional realism tone), @Image3 = Environment (optional). Use @Image1 as the primary identity source. Apply ultra-realistic transformation while preserving identity. Use @Image2 for realism tone (lighting, color grading). Use @Image3 for environment grounding (optional). Strong Negative Prompt: Avoid cartoon style, anime style, CGI/3D render look, plastic skin, over-smooth textures, exaggerated proportions, fantasy stylization, painterly or illustration effects.',
    prompt: `Transform the provided character into an ultra-realistic, photorealistic version as if captured by a high-end cinema camera.

Maintain 100% identity consistency:
- facial structure
- proportions
- recognizable features
- expression and personality

Convert all stylized elements into real-world equivalents:
- realistic skin with pores, fine wrinkles, natural imperfections
- physically accurate hair strands with flyaways
- detailed eyes with reflections, moisture, and depth
- natural lighting interaction with skin and materials

Apply cinematic realism:
- shot on ARRI Alexa / RED camera look
- shallow depth of field
- realistic lens imperfections (bokeh, slight chromatic aberration)
- global illumination and soft shadows

Ensure material realism:
- cloth behaves like real fabric (cotton, leather, metal, etc.)
- physically accurate reflections and roughness
- no cartoon, no stylization, no CGI look

Style direction:
- hyper-detailed
- grounded in reality
- believable as a real human photographed in real life

Output must look like: a real photograph, not illustration, not 3D render, not concept art.`,
  },
  {
    name: 'C03 - Ultra Realistic Character Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet'],
    isPublic: false,
    notes: 'Use @image1 as character reference. Compact: Single character only, no duplicates. All main views must be FULL BODY (head to toe, no cropping). Back view = same subject rotated 180°. 2/3 main views: front, back, left 90°, right 90°, 3/4 (all full body). 1/3 detail panels: eyes, face, skin, hair, tunic, clothing, object (horizontal if long). Ultra-realistic (pores, eyes, lips, hair strands, fabric, metal wear). Clean layout, real photography. No CGI, no cartoon.',
    prompt: `# Ultra-Realistic Character Identity Sheet v4.3 (Full-Body Enforced)

Create a photorealistic character identity sheet based strictly on the provided reference image. The result must look like a real professional studio identity sheet, with a clean, organized layout, ultra-realistic rendering, and clear separation between full-body views and detail panels.

CRITICAL RULE — SINGLE SUBJECT ONLY:
- The identity sheet must contain ONLY ONE character
- All views must represent the SAME individual
- No duplicated characters
- Back view = same subject rotated 180°, NOT a second person
- Must match body, clothing, hair, and proportions exactly

Page Layout (STRICT):

Section A — Main Views (2/3 area):
Display FULL-BODY views of the SAME character.

Full-Body Requirement (MANDATORY):
Each view must show the entire character from head to toe:
- head fully visible (no cropping)
- feet fully visible (no cropping)
- full silhouette clearly defined
- no zoomed-in, half-body, or portrait framing
The character must fit naturally within frame with proper margins, like a fashion or casting sheet.

Required Views:
1. Front View (full body, facing camera)
2. Left Profile (full body, 90° side view)
3. Right Profile (full body, 90° side view)
4. Back View (full body, 180° rear view)
5. 3/4 View (full body, ~45° angle)

Layout Rules: All views must be same scale, aligned and evenly spaced, consistently framed. Clean grid layout, no overlap, consistent lighting across all views.

Section B — Detail Panels (1/3 area):
Top Row (2 panels): Eyes detail, Face detail.
Middle Row: Skin texture, Hair texture, Tunic detail, Sash/clothing detail.
Bottom Row (Adaptive Object Panel): Wide horizontal panel, long objects (e.g. sword) must be horizontal and simplified.

Angle Accuracy Rules:
- Left/Right = true 90° profiles
- Back = full 180° rotation
- Front = direct
- 3/4 = ~45°

Identity Consistency:
- Same face, body, proportions
- Same outfit and materials
- Same hairstyle and structure

Expression Rules:
- Front view = primary expression
- Natural, alive (not blank)
- Eyes focused, lips natural

Ultra-Realistic Detail:
- skin pores, fine lines, imperfections
- realistic eyes (reflections, moisture)
- real hair strands
- fabric texture, stitching, folds
- realistic material behavior

Photography Style:
- studio lighting (soft key + rim light)
- natural shadows
- realistic exposure
- subtle depth of field
Must look like real photography.

Strict Negative Constraints — Do NOT produce:
- cropped body (must be full body)
- zoomed-in views in main section
- multiple characters
- incorrect back view
- cartoon / anime / CGI style
- smooth or plastic skin

Output: A single identity sheet image containing 2/3 area full-body multi-angle views, 1/3 area structured detail panels. All views must be complete, consistent, and ultra-realistic, like a professional casting sheet.`,
  },
  {
    name: 'V01 - Kling 3.0 Motion Character',
    type: 'video' as const,
    isSystem: true,
    tags: ['kling', 'motion'],
    isPublic: false,
    notes: 'Default prompt for Kling 3.0 Motion',
    prompt: `No distortion, the character's movements are consistent with the video.`,
  },
  {
    name: 'V02a - Property Tour: Exterior & Arrival',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 1 of property tour. Presenter = agent, Subject = building exterior/facade, Scene = street/neighborhood. Use as opening shot.',
    prompt: `@Presenter1 stands confidently on the curb in @Scene1 the quiet tree-lined neighborhood street. She smiles at the camera and gestures toward @Subject1 the elegant property facade behind her. Camera pulls back to reveal the full exterior — manicured front lawn, modern architectural lines, and a welcoming entrance. She walks up the front path, opens the gate, and approaches the front door. Drone-style establishing shot that transitions to eye-level follow. Professional real estate video, golden hour warm lighting, smooth gimbal movement.`,
  },
  {
    name: 'V02b - Property Tour: Entrance & Living Room',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 2 of property tour. Presenter = agent, Subject = living room, Scene = entrance foyer.',
    prompt: `@Presenter1 pushes open the front door and steps into @Scene1 the bright entrance foyer. She pauses, smiles, and sweeps her arm toward @Subject1 the spacious open-plan living room. Camera follows as she walks into the living area, pointing out the high ceilings, large windows flooding the room with natural light, and the premium hardwood flooring. She runs her hand along the feature wall, then turns to camera with a warm, inviting expression. Steady gimbal tracking, natural daylight, luxury property video aesthetic.`,
  },
  {
    name: 'V02c - Property Tour: Kitchen & Dining',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 3 of property tour. Presenter = agent, Subject1 = kitchen, Subject2 = dining area.',
    prompt: `@Presenter1 walks through from the living area into @Subject1 the modern kitchen. She runs her hand along the marble island countertop, opens a cabinet to show the soft-close mechanism, and gestures to the premium stainless-steel appliances. Camera pans smoothly to reveal @Subject2 the adjacent dining area with floor-to-ceiling windows overlooking the garden. The presenter stands at the island and speaks enthusiastically about the entertaining potential. Professional property tour, warm kitchen lighting, smooth tracking shots.`,
  },
  {
    name: 'V02d - Property Tour: Master Bedroom',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 4 of property tour. Presenter = agent, Subject1 = master bedroom, Subject2 = walk-in wardrobe or ensuite.',
    prompt: `@Presenter1 opens the door and reveals @Subject1 the luxurious master bedroom suite. Camera follows her inside as morning light streams through sheer curtains. She gestures to the spacious layout, the designer lighting fixtures, and the peaceful ambiance. She walks to @Subject2 the walk-in wardrobe, slides open the doors to show the generous storage space, then peeks into the ensuite bathroom highlighting the rainfall shower and freestanding bathtub. Soft natural lighting, slow cinematic reveal, luxury property aesthetic.`,
  },
  {
    name: 'V02e - Property Tour: Children Bedroom',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 5 of property tour. Presenter = agent, Subject = children bedroom(s).',
    prompt: `@Presenter1 opens the door to @Subject1 a bright and cheerful children's bedroom. She points out the generous size, the large window letting in natural light, and the built-in storage shelving. Camera follows as she moves to @Subject2 the second bedroom next door, showing it is equally spacious with a different colour palette. She emphasizes how both rooms have their own personality while maintaining the same premium finish throughout. Warm, family-friendly energy, gentle camera movement, inviting atmosphere.`,
  },
  {
    name: 'V02f - Property Tour: Bathroom',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 6 of property tour. Presenter = agent, Subject = main bathroom.',
    prompt: `@Presenter1 steps into @Subject1 the main family bathroom. She highlights the floor-to-ceiling tiles, the frameless glass shower, and the floating vanity with dual basins. Camera captures close-up details — the brushed nickel fixtures, the stone benchtop texture, the recessed lighting creating a spa-like atmosphere. The presenter turns on the tap briefly, showing the quality fittings, then looks at the camera with an appreciative nod. Clean, bright bathroom lighting, detail-oriented shots, premium finish showcase.`,
  },
  {
    name: 'V02g - Property Tour: Backyard & Garden',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 7 of property tour. Presenter = agent, Subject = backyard/garden/pool, Scene = outdoor area.',
    prompt: `@Presenter1 slides open the glass doors and steps out into @Subject1 the private backyard. Camera follows from inside to outside, revealing the covered patio, manicured lawn, and mature landscaping. She walks across @Scene1 the entertainment deck, gesturing to the built-in barbecue area and the outdoor dining space. If there is a pool, she walks alongside it. She stands at the edge of the garden, arms open, showcasing the private outdoor oasis. Bright daylight, wide-angle establishing shots transitioning to medium follow shots.`,
  },
  {
    name: 'V02h - Property Tour: Closing & Call to Action',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour'],
    isPublic: false,
    notes: 'Frame 8 of property tour. Final frame. Presenter = agent, Subject = property exterior (same as Frame 1), Scene = street.',
    prompt: `@Presenter1 stands in front of @Subject1 the property exterior, the same angle as the opening shot but now at a slightly different time of day. She faces the camera directly, speaks with confidence and warmth, summarizing the key highlights — the location, the space, the lifestyle. She gestures toward the home one final time, smiles genuinely, and delivers the call to action. Camera slowly pulls back to a wide shot of the property in @Scene1 the beautiful neighborhood setting. Professional closing shot, warm golden light, confident and personable delivery.`,
  },
  {
    name: 'V05a - Car Tour: First Impression & Exterior',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 1 of car showcase. Presenter = female host, Subject = car exterior, Scene = showroom or outdoor location. Opening reveal shot.',
    prompt: `@Presenter1 walks into frame in @Scene1 a sleek modern showroom with dramatic spotlighting. She stops beside @Subject1 the car, places one hand on the roof, and turns to camera with a confident smile. Camera circles around the vehicle in a slow 180-degree arc, capturing the body lines, paint finish, and wheel design. She traces her fingers along the front fender, crouches to show the low stance and aggressive front grille. She stands back up, flips her hair, and says her opening line to camera. Cinematic automotive reveal, dramatic lighting with reflections on the paint, slow glamour shots.`,
  },
  {
    name: 'V05b - Car Tour: Exterior Walkaround',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 2 of car showcase. Presenter = female host, Subject1 = front design, Subject2 = rear design.',
    prompt: `@Presenter1 begins at the front of the car, crouching to showcase @Subject1 the LED headlight signature, the sculpted hood lines, and the air intake design. She runs her hand along the side profile as camera tracks alongside her. At the rear, she highlights @Subject2 the tail light design, the quad exhaust tips, the integrated rear spoiler, and the badge. She opens the boot briefly to show the cargo space. Camera captures tight detail shots intercut with her medium shots. Premium automotive commercial style, soft ambient lighting with specular highlights on chrome and paint.`,
  },
  {
    name: 'V05c - Car Tour: Interior & Cockpit',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 3 of car showcase. Presenter = female host, Subject1 = interior cabin, Subject2 = dashboard/infotainment.',
    prompt: `@Presenter1 opens the driver door with a smooth pull. Camera follows from outside to inside, revealing @Subject1 the premium leather interior — the quilted seat stitching, the contrast piping, the aluminium trim accents. She slides into the driver seat, adjusts the mirrors, and pans her hand across @Subject2 the digital dashboard, the floating infotainment screen, and the ambient lighting strip. Close-ups of the gear selector, the steering wheel controls, and the centre console storage. She looks impressed and nods approvingly at camera. Interior automotive photography style, warm ambient cabin lighting, detail macro shots.`,
  },
  {
    name: 'V05d - Car Tour: Engine & Performance',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 4 of car showcase. Presenter = female host, Subject = engine bay.',
    prompt: `@Presenter1 stands at the front of the car and lifts the hood to reveal @Subject1 the engine bay. The camera begins on her face — the moment of reveal reflected in her expression — then slowly pushes forward and tilts down in one continuous movement, drifting past her shoulder and descending into the engine bay. The push continues deeper, gliding over the engine cover branding, across the carbon fibre intake, and settling into a tight close-up of the engineering centrepiece. She rests one hand on the strut tower brace and glances into the bay with quiet appreciation. One slow unbroken camera push from portrait to mechanical detail, industrial automotive style, sharp focus, dramatic side-lighting that sculpts every component in shadow and highlight.`,
  },
  {
    name: 'V05e - Car Tour: Driving Experience',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 5 of car showcase. Presenter = female driver, Subject = steering/controls, Scene = scenic road.',
    prompt: `@Presenter1 sits in the driver seat of the car on @Scene1 a scenic mountain road. The camera is mounted inside the cabin on a dashboard rig, holding a steady cockpit-perspective shot. She grips @Subject1 the steering wheel and guides the car through a long sweeping curve — hands making a smooth correction, eyes tracking the road ahead, a relaxed smile of genuine driving pleasure crossing her face. The mountain landscape scrolls continuously past the windscreen and side windows throughout the shot. Wind from her cracked window moves her hair gently. One continuous interior cockpit shot, driver and landscape in frame together, cinematic cabin lighting, golden hour sun streaming through the windscreen.`,
  },
  {
    name: 'V05f - Car Tour: Performance & Manoeuvres',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 6 of car showcase. Presenter = female driver, Subject = car in action, Scene = track or open road.',
    prompt: `@Presenter1 pushes @Subject1 the car hard through a sweeping curve on @Scene1 an open track or empty coastal road. A single low-angle side-tracking shot follows the car continuously from entry to exit of the bend — tyres gripping the asphalt, the body rolling slightly under lateral load, tyre smoke curling off the rear. The camera pans smoothly with the car's momentum, holding the full vehicle in frame as it accelerates out of the curve and pulls away toward the horizon. Adrenaline automotive content, one continuous fluid tracking shot, tyre smoke and engine roar, cinematic wide-angle perspective, golden hour side-light raking across the bodywork.`,
  },
  {
    name: 'V05g - Car Tour: Closing & Verdict',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour'],
    isPublic: false,
    notes: 'Frame 7 of car showcase. Final frame. Presenter = female host, Subject = car parked hero shot, Scene = sunset location.',
    prompt: `@Presenter1 leans against @Subject1 the car, now parked at @Scene1 a scenic overlook at sunset. The golden light reflects off the paint and her expression is relaxed, satisfied. She faces the camera directly and delivers her final verdict — the highlights, the driving feel, who this car is for. She taps the roof twice, steps away, and the camera pulls back to a wide cinematic hero shot of the car silhouetted against the sunset sky. Final lingering close-up of the badge catching the last light. Premium automotive conclusion, warm sunset tones, confident and personal delivery, hero framing.`,
  },
  {
    name: 'V06a - Fashion Lookbook: Opening Walk',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook'],
    isPublic: false,
    notes: 'Frame 1 of fashion lookbook. Presenter = model, Subject = outfit 1 (full look), Scene = location (studio/street/boutique).',
    prompt: `@Presenter1 the model steps into frame in @Scene1 a minimalist white studio with dramatic directional lighting. She wears @Subject1 a bold statement outfit — the hero look. Camera captures her full body from head to toe as she walks confidently toward the lens, then pauses. Close-up of the fabric texture, the silhouette catching the light. She does a slow 360 turn, arms slightly out, letting the camera capture every angle of the outfit. Her walk is powerful, editorial — chin up, shoulders back, owning the space. The lighting shifts subtly between warm and cool as she moves. High fashion editorial video, clean minimalist backdrop, runway energy with editorial intimacy.`,
  },
  {
    name: 'V06b - Fashion Lookbook: Casual Daywear',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook'],
    isPublic: false,
    notes: 'Frame 2 of fashion lookbook. Presenter = model, Subject = casual daytime outfit, Scene = street/cafe.',
    prompt: `@Presenter1 walks down @Scene1 a sun-drenched European cobblestone street wearing @Subject1 a chic casual daywear look. Camera follows from across the street, shooting through passing pedestrians for a candid, lived-in feel. She stops at a cafe, sits down, crosses her legs — the camera catches the shoe detail, the handbag placement, the way the fabric drapes when seated. She flips her hair, laughs naturally, adjusts her sunglasses. Golden hour side lighting creates warm highlights on the fabric. Cut to a slow-motion walking shot from behind showing the outfit silhouette against the warm street light. Street-style fashion video, documentary candid energy, warm European tones.`,
  },
  {
    name: 'V06c - Fashion Lookbook: Evening & Glamour',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook'],
    isPublic: false,
    notes: 'Frame 3 of fashion lookbook. Presenter = model, Subject = evening dress/gown, Scene = upscale venue.',
    prompt: `@Presenter1 descends a grand staircase in @Scene1 an opulent hotel lobby or gallery space, wearing @Subject1 an elegant evening gown or cocktail dress. The fabric flows with each step — silk catching the chandelier light, sequins sparkling, the cut revealing and refined. Camera shoots from below looking up as she descends, then transitions to a tracking shot at eye level. She reaches the bottom, pauses at a mirror, adjusts an earring — the reflection creates a beautiful double composition. Close-up of jewellery details, the neckline, the heel. She turns and walks away from camera, the back of the dress revealed in full. Luxurious, cinematic, old Hollywood glamour meets modern fashion film.`,
  },
  {
    name: 'V06d - Fashion Lookbook: Activewear & Movement',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook', 'activewear'],
    isPublic: false,
    notes: 'Frame 4 of fashion lookbook. Presenter = model, Subject = activewear/athleisure, Scene = outdoor/urban.',
    prompt: `@Presenter1 jogs toward the camera on @Scene1 a rooftop or urban park at sunrise, wearing @Subject1 a sleek activewear set. Camera captures the outfit in motion — the leggings stretching, the sports bra supporting, the jacket unzipped and flowing. She stops, stretches, the camera circles around her at waist height showing the outfit from every angle during the stretch. Quick cuts: close-up of the mesh panel detail, the reflective logo, the waistband fit. She does a powerful pose — hands on hips, sunrise behind her creating a silhouette with rim light. The energy is empowering, athletic, aspirational. Shot handheld for dynamic energy, golden sunrise tones, fitness-meets-fashion aesthetic.`,
  },
  {
    name: 'V06e - Fashion Lookbook: Closing Montage',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook'],
    isPublic: false,
    notes: 'Frame 5 of fashion lookbook. Final frame — montage of all looks. Presenter = model.',
    prompt: `@Presenter1 wearing @Subject1 the closing look begins a slow, confident walk directly toward the camera from the far end of @Scene1 the studio. The camera holds a single low wide shot as she closes the distance — her full outfit visible, each step deliberate and unhurried. As she gets closer the frame gradually tightens, moving from full-body to mid-shot to chest-up, the camera moving smoothly forward to meet her. Just before she fills the frame she breaks into a genuine, warm smile that cuts through the editorial cool. The shot ends on a tight close-up of her face, relaxed and present. One continuous forward push with the camera, editorial confidence giving way to human warmth, soft studio lighting, the collection's identity carried in a single unbroken take.`,
  },
  {
    name: 'V07a - Fashion Haul: Try-On Reveal',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'tiktok', 'influencer'],
    isPublic: false,
    notes: 'TikTok/YouTube fashion haul - outfit reveal moment. Presenter = influencer, Subject = outfit. Best for the "before/after" transition style.',
    prompt: `@Presenter1 stands in front of @Scene1 a clean, bright bedroom or dressing room with a full-length mirror and ring light visible. She starts in a casual oversized hoodie, holds up @Subject1 the new outfit on a hanger to show it to camera, eyes wide with excitement. Quick jump cut — she now wears the outfit, doing a confident spin. Camera captures the full look from head to toe. She adjusts the belt, smooths the fabric, checks herself in the mirror with a satisfied nod. Natural and warm lighting from the ring light creates flattering soft shadows. She does the classic TikTok "show and tell" — pointing at details, the tag, the material. Genuine excitement, relatable energy, bright airy bedroom aesthetic with soft warm tones. Shot at eye level, slightly wide to show the full outfit.`,
  },
  {
    name: 'V07b - Fashion Haul: Outfit of the Day',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'ootd', 'influencer'],
    isPublic: false,
    notes: 'OOTD style video. Presenter = influencer, Subject = complete outfit, Scene = aesthetic background.',
    prompt: `@Presenter1 walks out from behind @Scene1 a neutral beige curtain or clean white wall into frame wearing @Subject1 a carefully styled outfit. She does the viral "outfit check" walk — stepping forward confidently, camera tilted slightly upward for a flattering angle. She pauses, does a slow turn showing front, side, and back. Close-up cuts: shoes with a foot tap, bag detail, necklace layering, watch or bracelet close-up. She pairs the outfit with two accessory options, holding each up to camera for comparison. Final shot: full-body mirror selfie angle showing the complete look. Bright, even lighting with no harsh shadows. The space is Instagram-perfect — minimal clutter, soft textured backgrounds, a plant or candle adding warmth. Trendy, aspirational but achievable, the kind of content that makes viewers screenshot the outfit details.`,
  },
  {
    name: 'V07c - Fashion Haul: Multiple Outfits Quick Change',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'tiktok', 'influencer'],
    isPublic: false,
    notes: 'Quick-change fashion haul with 3 outfits. Presenter = influencer, Subject1-3 = different outfits. TikTok transition style.',
    prompt: `@Presenter1 wearing @Subject1 the hero outfit stands centred in @Scene1 a bright room with large window light flooding in from the side. The camera performs a single slow 180-degree orbit around her — starting from a three-quarter front angle, moving around her side to reveal the back of the outfit in full detail, then continuing around to arrive at the opposite three-quarter front angle. She moves naturally with the camera, shifting weight, adjusting her jacket, glancing over her shoulder mid-orbit with a playful smile. The continuous circular movement showcases every angle of the outfit — fabric texture, fit across the shoulders, silhouette from behind, styling details at the front. Bright even lighting with soft golden window undertones, flattering and shadow-free, shoppable energy in one unbroken revolving shot.`,
  },
  {
    name: 'V07d - Fashion Haul: Seasonal Collection Review',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'youtube', 'influencer'],
    isPublic: false,
    notes: 'YouTube-style longer format fashion review. Presenter = influencer, Subject = clothing item close-ups, Scene = well-lit room.',
    prompt: `@Presenter1 sits cross-legged on a bed or couch in @Scene1 a beautifully styled room with soft ambient lighting — fairy lights in the background, a neatly arranged clothing rack visible behind her. She holds up @Subject1 a folded clothing item, unfolds it toward the camera showing the fabric, the print, the details. She describes the material, touches it to show the texture. Cut to her wearing it — she stands in front of the mirror, adjusting the fit, showing how it looks tucked in versus left out. She gives an honest reaction — nodding approvingly or scrunching her nose playfully. Close-up detail shots: the stitching quality, the label, how the fabric catches light. The room has warm, cosy lighting — a mix of natural daylight and warm lamp light creating a golden, inviting atmosphere. YouTube creator aesthetic — personal, authentic, well-lit but not over-produced. The viewer feels like they are getting honest advice from a friend.`,
  },
  {
    name: 'V07e - Fashion Haul: Street Style Lookbook',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'street-style', 'influencer'],
    isPublic: false,
    notes: 'Outdoor street style fashion video. Presenter = influencer, Subject = outfit, Scene = urban location.',
    prompt: `@Presenter1 steps out of a doorway onto @Scene1 a photogenic urban street — colourful shopfronts, warm brick walls, or a trendy neighbourhood with character. She wears @Subject1 a street-style outfit and walks naturally down the pavement. Camera shoots from across the street in a long telephoto compression shot creating beautiful background blur of the street life behind her. She stops at a wall, leans casually, one foot up — the classic influencer street photo pose but in motion. The wind catches her hair and jacket naturally. Cut to a slow-motion walking shot from the front, eye-level, warm afternoon sunlight creating a golden rim light on one side. Close-up of the sneakers on pavement, the bag swinging, the sunglasses reflecting the street scene. The video feels like a premium street-style campaign — effortlessly cool, natural movement, real-world environment with beautiful light. Golden hour warmth, shallow depth of field, cinematic yet authentic.`,
  },
  {
    name: 'V08 - Showcase Makeup Tutorial',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'tutorial', 'beauty'],
    isPublic: false,
    notes: 'Showcase mode for makeup/beauty tutorials. Presenter = model, Subject = step photos (bare face, foundation, final look), Scene = vanity/studio.',
    prompt: `@Presenter1 sits close to the camera in front of @Scene1 a well-lit vanity station — ring light creating perfect catchlights in her eyes, warm LED strips along the mirror casting a flattering glow. She leans in and shows @Subject1 her bare, clean face — no makeup, natural skin texture visible, being vulnerable and real. She picks up a beauty blender, dips it into foundation, and begins dabbing across her cheek — camera zooms into an extreme close-up of the blending technique, the product melting into skin. Time-lapse of contour lines being drawn and blended. She builds the look layer by layer: concealer under the eyes, setting powder with a satisfying cloud of dust, @Subject2 the eye look — brushes sweeping colour across the lid, each stroke deliberate and artistic. Mascara application with the classic open-mouth expression. She pauses, examines herself in the mirror, does one final touch-up, then turns to camera for @Subject3 the full reveal — dramatic before-and-after energy. She tilts her head side to side showing the glow from every angle, runs her fingers through her hair, gives a confident knowing look. The transformation is stunning. Warm vanity lighting, macro lens detail shots intercut with medium beauty shots, ASMR-satisfying product textures.`,
  },
  {
    name: 'V09 - Showcase Cooking Recipe',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'tutorial', 'cooking'],
    isPublic: false,
    notes: 'Showcase mode for cooking tutorials. Presenter = chef, Subject = dish stages (ingredients, cooking, plated), Scene = kitchen.',
    prompt: `@Presenter1 stands behind a marble island in @Scene1 a bright, modern kitchen flooded with natural window light. She gestures to @Subject1 the fresh ingredients arranged in a beautiful mise en place — vibrant vegetables, herbs, spices in small bowls, raw protein on a cutting board. Overhead camera captures her hands as she chops — the knife rhythm is confident and satisfying, close-up of the blade slicing through a tomato, juice and seeds glistening. She sweeps ingredients into a hot pan — dramatic sizzle, steam billowing up, caught by the backlight from the window. She tosses the pan, flames briefly lick upward. @Subject2 the cooking process in full swing — stirring, tasting with a wooden spoon, adding a pinch of salt from height. The colours in the pan are rich and appetising. She plates with precision, using tweezers for a micro-herb garnish, a drizzle of sauce in an artistic pattern. Final reveal: @Subject3 the finished dish on a beautiful ceramic plate, camera slowly orbiting around it at table height. She steps back, wipes her hands on her apron, picks up a fork, takes a bite and closes her eyes in satisfaction. Warm kitchen tones, golden natural light, food photography angles — overhead prep shots, eye-level sizzle shots, macro texture close-ups.`,
  },
  {
    name: 'V10 - Showcase DIY Repair',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'tutorial', 'diy'],
    isPublic: false,
    notes: 'Showcase mode for repair/DIY tutorials. Presenter = technician, Subject = repair steps, Scene = workshop.',
    prompt: `@Presenter1 stands at a sturdy workbench in @Scene1 a well-organised garage workshop — pegboard wall of tools behind him, work lamp casting focused light on the bench, faint sawdust in the air. He holds up @Subject1 the broken item, rotating it to show the damage — a crack, a loose part, a worn component. He sets it down, reaches for the right tool from the wall with practised confidence. Camera follows his hands in extreme close-up as he carefully disassembles — screws turning, components separating, the satisfying click of parts coming apart. He examines @Subject2 the internal mechanism, points to the problem area for the camera, explains with a knowing nod. Detailed shots of the repair: soldering iron tip meeting contact points with a wisp of smoke, adhesive being applied with precision, a new part clicking into place. He reassembles methodically, each piece fitting back together. The moment of truth — he powers it on or tests the function. @Subject3 the repaired item works perfectly. He holds it up triumphantly, gives the camera a satisfied grin. Workshop ambient lighting with focused task lamp, macro detail shots of hands and tools, the ASMR-satisfying sounds of mechanical work.`,
  },
  {
    name: 'V11 - UGC Product Unboxing',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'product'],
    isPublic: false,
    notes: 'UGC mode prompt for product unboxing. Use with Product (1-2 shots) + Influencer.',
    prompt: `@Influencer1 sits cross-legged on her bed, phone propped up selfie-style, filming herself. A branded delivery box sits on her lap — she reads the label out loud with building anticipation. She slices the tape with her finger, pulls back the flaps, pushes aside the tissue paper. She reaches in and lifts out @Product1, her face lighting up with genuine surprise — mouth drops open, she squeals and holds it up to the camera. She turns it around slowly showing every detail: the packaging, the texture, the weight in her hands. She unboxes any accessories, laying them out neatly on the bedsheets. She holds the product next to her face for scale, examines the craftsmanship close-up. She puts it down, leans back, looks at the camera and mouths "wow." Bedroom setting with warm afternoon light from a window, fairy lights in the background, messy-but-aesthetic bed setup. Smartphone vertical format, authentic unboxing energy, the kind of genuine reaction that makes viewers want to order immediately.`,
  },
  {
    name: 'V12 - UGC Skincare Review',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'beauty', 'product'],
    isPublic: false,
    notes: 'UGC mode for skincare/beauty product review. Use with Product + Influencer.',
    prompt: `@Influencer1 appears fresh-faced in a bathroom or vanity setup, natural morning light mixing with a soft ring light. She holds up @Product1 the skincare product close to the camera — the label fills the frame, she taps it twice for emphasis. She opens the cap, squeezes a small amount onto her fingertips — close-up of the product texture, the consistency, the colour. She dots it across her cheeks, forehead, and chin, then begins to massage it in with upward circular motions. Extreme close-up of the product absorbing into skin, the dewy glow appearing in real-time. She pats gently under her eyes, tilts her face left and right to show the even application. She touches her cheek and gives a genuine reaction — soft skin, no residue, impressed expression. Before-and-after split: one side bare skin, one side with the product applied showing the difference. She holds the product next to her glowing face, gives an honest, warm smile to camera. Bathroom natural light with soft ring light fill, macro skin texture shots, dewy-skin aesthetic, authentic and trustworthy energy.`,
  },
  {
    name: 'V13 - UGC App Review: Travel/Lifestyle',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'app', 'travel', 'testimonial'],
    isPublic: false,
    notes: 'UGC mode — person talking about an app in a real-world setting. Influencer = the person, Product = phone screen showing the app. Candid selfie-style, raw authentic feel.',
    prompt: `@Influencer1 films a candid selfie-style video in @Scene1 a busy airport terminal, bright overhead fluorescent lighting, crowds moving behind her. She looks slightly frazzled at first, glancing down at her phone. She holds up @Product1 the phone screen showing the app interface toward the camera. Her expression shifts to relieved and excited. She taps the screen a few times demonstrating the app, then looks directly into the camera with a natural, genuine smile. The footage has a raw, slightly shaky smartphone quality — vertical format, slight motion blur, real ambient airport noise feel. No professional lighting setup, just the natural overhead terminal lights creating realistic shadows under the eyes. She speaks animatedly, gesturing with one hand. Authentic UGC testimonial style, not polished, not scripted-looking — the kind of content that feels real and trustworthy.`,
  },
  {
    name: 'V14 - UGC Gym Shoes: Workout Review',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'fitness', 'shoes', 'product'],
    isPublic: false,
    notes: 'UGC mode — gym-goer reviewing shoes mid-workout. Influencer = the person, Product = the shoes. Raw gym footage style.',
    prompt: `@Influencer1 is in @Scene1 a busy, gritty powerlifting gym — rubber flooring, chalk dust in the air, weights clanking in the background. They are slightly sweaty, wearing a faded gym tee and shorts. Camera is handheld smartphone vertical format with slight shake for authenticity. They step back from a squat rack, the camera pans down to their feet showing @Product1 the training shoes — tapping their toe and planting their foot flat on the rubber floor. Cut to a low-angle B-roll shot from the ground: they perform a slow, heavy barbell back squat, camera focused on the shoe sole gripping the floor, the flat base stable under load. Back to selfie angle — they look directly at camera, breathing naturally between sets, genuine enthusiasm on their face. Raw gym lighting — harsh overhead fluorescents with some warm spots. No filters, no colour grading, real sweat, real iron. The kind of review that makes gym bros immediately check the link in bio.`,
  },
  {
    name: 'V15 - UGC Gym Tour: Facility Introduction',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'fitness', 'gym', 'tour'],
    isPublic: false,
    notes: 'UGC mode — person giving a casual gym tour. Influencer = the guide, Scene = gym facility areas. Works with Showcase mode too.',
    prompt: `@Influencer1 walks backward through @Scene1 the gym entrance, filming selfie-style, big smile and high energy. They gesture behind them showing the front desk and check-in area. Quick walk-through: they pan the phone to show @Subject1 the main floor — rows of equipment, people working out, motivating atmosphere. They jog over to the free weights section, pick up a dumbbell to show the quality. Walk past the cardio machines, the stretching area. They push open a door to reveal the group fitness studio, spin their phone around to show the mirrors and sound system. End at the smoothie bar or lounge area, they grab a shake and cheers the camera. The whole video has energetic walking pace, natural gym lighting mixing warm and cool zones, real members in the background creating authentic atmosphere. Smartphone vertical format, casual and inviting, the feeling of a friend showing you their favourite gym.`,
  },
  {
    name: 'V16 - UGC Building/Property: Lifestyle Tour',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'property', 'building', 'lifestyle'],
    isPublic: false,
    notes: 'UGC mode — resident or visitor giving a casual building tour. Influencer = the person, Scene = building/condo areas. Authentic walk-through.',
    prompt: `@Influencer1 stands outside @Scene1 a modern residential building or condo complex, filming selfie-style in natural daylight. They gesture excitedly at the facade behind them, then walk through the lobby — marble floors, concierge desk, designer furniture. They step into the elevator, press the button, quick cut to the doors opening on a high floor. They walk down a bright hallway and push open the door to @Subject1 the apartment or unit — camera reveals the view through floor-to-ceiling windows. They spin the phone around showing the open kitchen, the living space, the balcony with city or garden views. They step onto the balcony, the wind catches their hair, they lean on the railing showing the panorama. Back to selfie: genuine wow expression, can barely contain their excitement. Natural lighting throughout — lobby warm, apartment bright with daylight, balcony golden hour glow. Smartphone vertical format, raw and authentic, the kind of tour that makes people DM asking for the building name.`,
  },
  {
    name: 'V17 - UGC Drink/Beverage: Taste Test',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'food', 'drink', 'product'],
    isPublic: false,
    notes: 'UGC mode — person trying and reviewing a drink. Influencer = the person, Product = the drink/bottle. Casual taste-test style.',
    prompt: `@Influencer1 sits at @Scene1 a cosy cafe table or kitchen counter with warm ambient lighting. They hold up @Product1 the drink bottle or cup to the camera, rotating it to show the label and branding. They crack it open or take the lid off — close-up of the pour, the colour, the fizz or steam rising. They take the first sip, eyes closing momentarily, then open with a surprised, delighted expression. They nod enthusiastically, take another sip, then hold the drink beside their face giving a genuine thumbs up. Camera alternates between tight close-ups of the drink — the condensation on the bottle, the ice clinking, the liquid colour in the light — and medium selfie shots of their authentic reactions. Warm, inviting cafe lighting or natural kitchen window light creating a golden, cosy mood. Smartphone vertical format, no professional setup visible. The kind of content where the genuine reaction sells the product more than any scripted ad ever could.`,
  },
  {
    name: 'V18 - UGC Food: Restaurant Visit',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'food', 'restaurant'],
    isPublic: false,
    notes: 'UGC mode — foodie visiting a restaurant. Influencer = the person, Subject = the dishes, Scene = restaurant.',
    prompt: `@Influencer1 walks into @Scene1 a trendy restaurant with moody ambient lighting — exposed brick, warm Edison bulbs, candles on tables. They do a quick pan showing the vibe and decor. Sitting down, the waiter places @Subject1 the first dish on the table. Close-up overhead shot: the plating, the colours, steam rising. They pick up a fork, take the first bite — eyes widen, they cover their mouth in delight, genuine foodgasm reaction. Quick montage of more dishes arriving: @Subject2 a signature cocktail being poured, @Subject3 the dessert with a dramatic presentation. Each dish gets a beauty shot followed by their authentic tasting reaction. The lighting is warm and flattering — candle glow on the face, ambient restaurant warmth creating a romantic food-content atmosphere. Smartphone filming with occasional stabilised B-roll shots of the food close-ups. The content makes the viewer immediately want to book a table.`,
  },
  {
    name: 'V19 - UGC Lip Product: Car Casual Review',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'beauty', 'lips', 'product'],
    isPublic: false,
    notes: 'UGC mode — casual car selfie lip product review. Influencer = the person, Product = lip product. Based on the viral car-review format.',
    prompt: `@Influencer1 sits in the driver seat of her parked car, hair in a messy bun, wearing an oversized sweater. She holds up her phone filming selfie-style in vertical format, natural daylight streaming through the windshield creating soft, flattering light on her face. She casually holds up @Product1 the lip product tube between two fingers, turning it so the camera catches the brand name and shade. She uncaps it, leans into the rearview mirror, and applies it to her bottom lip first — camera catches the close-up of the colour gliding on. She presses her lips together, smacks them lightly, then turns back to camera. She pouts, tilts her chin up and down to show the finish in different light — the sheer tint, the subtle gloss, the natural berry tone. She touches her lips with a fingertip to demonstrate the texture — not sticky, hydrating. She holds the product next to her face one final time, gives an honest, slightly obsessed expression and nods slowly. Car interior with natural window light, slightly shaky handheld smartphone feel, candid and unfiltered. The authentic "I just found my new favourite product" energy that gets saved and shared.`,
  },
  {
    name: 'V20 - UGC Dentist: Professional Product Endorsement',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'dental', 'medical', 'professional', 'product'],
    isPublic: false,
    notes: 'UGC mode — dentist/doctor endorsing a dental product. Influencer = the dentist, Product = dental product, Scene = clinic. Professional authority meets approachable delivery.',
    prompt: `@Influencer1 a dentist in a clean white coat stands in @Scene1 a bright, modern dental clinic — treatment chair visible in the background, overhead dental lamp, clean white walls with a calming accent colour. She holds @Product1 the dental product at chest height, label facing camera. She speaks directly to camera with calm, professional authority but warm and approachable — not stiff or salesy. She picks up a dental model or opens the product to demonstrate how it works — squeezing the toothpaste on a brush to show the consistency, or demonstrating a whitening strip application technique. Close-up of her hands showing the product details: the active ingredients on the label, the texture, the application. She puts on gloves, picks up a dental mirror, and briefly shows her own teeth as an example of results — bright, confident smile under the clinical lighting. She removes the gloves, holds the product one more time, and gives her professional recommendation with a reassuring nod. Clean clinical lighting — bright, even, professional white with subtle warm fill to avoid looking too sterile. The combination of medical authority and genuine personal endorsement that builds trust instantly.`,
  },
  {
    name: 'V21 - UGC Dentist: Product Demo',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'dental', 'medical', 'product'],
    isPublic: false,
    notes: 'UGC mode — dentist demonstrating a specific dental product (toothpaste, mouthwash, whitening kit). One continuous shot. Influencer = dentist, Product = dental product.',
    prompt: `@Influencer1 a male dentist in scrubs and a white coat sits on the edge of @Scene1 a dental treatment chair in his clinic, filmed at eye level in vertical smartphone format. He holds up @Product1 the dental product close to camera — the label fills the frame. He rotates it slowly, taps the key ingredient on the label with his finger. He uncaps it and squeezes a small amount onto a toothbrush or his gloved fingertip, showing the texture and consistency to camera. He points to a dental model jaw on the counter beside him, demonstrates the correct application technique — gentle circular brushing on the gum line, working the product between the teeth. He sets the model down, looks directly at camera and gives a calm, confident nod of recommendation. Bright clinical overhead lighting with a warm fill from the window to keep it approachable. The energy is a trusted professional casually sharing his go-to product — not a commercial, more like a friend who happens to be a dentist giving you honest advice.`,
  },
  {
    name: 'V22 - UGC Dentist: Gum Care Education',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'dental', 'medical', 'education', 'gum-care'],
    isPublic: false,
    notes: 'UGC mode — dentist explaining how to protect gums. Educational content, no product push. Influencer = dentist, Subject = dental model for demo.',
    prompt: `@Influencer1 a dentist in a white coat sits behind his desk in @Scene1 a clean, modern dental office. He looks into camera with a warm, concerned expression — the kind of look that says "I see this problem every day." He picks up @Subject1 a dental jaw model and holds it at camera level. With a dental probe, he gently points to the gum line area, tracing where plaque builds up if not cleaned properly. He demonstrates the correct brushing angle — 45 degrees toward the gum line — moving the brush in small gentle strokes. He flips the model to show the inner gum side that most people miss. He sets down the brush and holds up three fingers, counting off the key habits: brushing technique, daily flossing, and regular check-ups. He places the model down, leans slightly forward toward camera with a reassuring expression and gives a final encouraging message. Bright, clean clinic lighting, calm and educational tone, the doctor is genuinely passionate about preventing gum disease. Smartphone vertical format, the kind of dental advice video that gets millions of views because it is clear, visual, and immediately actionable.`,
  },
  {
    name: 'V23a - Travel: Destination Arrival',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'destination'],
    isPublic: false,
    notes: 'Frame 1 of travel showcase. Presenter = travel host/agent, Subject = landmark or arrival point, Scene = destination overview. Opening frame of a destination video.',
    prompt: `@Presenter1 steps out of a vehicle or walks through an arrivals gate into @Scene1 a stunning destination — a tropical beachfront, a historic European plaza, or a bustling Asian night market. She pauses, takes a deep breath, spreads her arms wide and takes in the view. Camera starts tight on her face showing the genuine wonder, then pulls back dramatically to reveal the full panorama of @Subject1 the iconic landmark or scenic vista behind her. She turns to camera, sunlight catching her hair, and begins walking toward the location. Drone-style establishing shot that descends into a ground-level follow as she enters the scene. Golden hour travel photography, vivid saturated colours, the cinematic "arrival moment" that every travel video needs as its hook.`,
  },
  {
    name: 'V23b - Travel: Cultural Experience',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'culture', 'experience'],
    isPublic: false,
    notes: 'Frame 2 of travel showcase. Presenter = host, Subject = cultural activity or local experience, Scene = authentic local setting.',
    prompt: `@Presenter1 immerses herself in @Scene1 an authentic local setting — a traditional market, a street food alley, a temple courtyard, or a local artisan workshop. She interacts with a vendor, watches @Subject1 a cultural activity in action — food being prepared, crafts being made, a performance unfolding. She tries the local food, her reaction genuine and delighted. She picks up a handmade souvenir, examines it with curiosity. Camera captures the vibrant textures, colours, and energy of the surroundings — spices piled high, lanterns glowing, fabric patterns, the faces of local people going about their day. She walks through the crowd, the camera weaving through with her, capturing the sensory overload. Handheld travel documentary style, warm ambient local lighting, rich saturated colours, the energy of discovery and cultural connection.`,
  },
  {
    name: 'V23c - Travel: Hotel & Accommodation',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'hotel', 'accommodation'],
    isPublic: false,
    notes: 'Frame 3 of travel showcase. Presenter = host, Subject = hotel room or villa, Scene = resort/hotel grounds.',
    prompt: `@Presenter1 walks through @Scene1 the hotel lobby or resort entrance — lush tropical landscaping, infinity pool glimpsed through glass walls, a dramatic chandelier overhead. She checks in, receives a key, walks down an elegant corridor. She pushes open the door to @Subject1 the room or villa — camera follows from behind her shoulder as the space is revealed: a king bed with pristine white linens, floor-to-ceiling windows with a breathtaking view, a private balcony or plunge pool. She runs her hand across the bed fabric, opens the bathroom to show the rain shower and freestanding tub. She steps onto the balcony, leans on the railing, and the camera captures @Subject2 the view — ocean, mountains, city skyline, or jungle canopy stretching to the horizon. She turns back with a blissful expression. Luxury travel content style, warm golden lighting mixing with natural daylight, smooth gimbal movement through doorways and reveals.`,
  },
  {
    name: 'V23d - Travel: Adventure & Activity',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'adventure', 'activity'],
    isPublic: false,
    notes: 'Frame 4 of travel showcase. Presenter = host, Subject = adventure activity, Scene = outdoor location.',
    prompt: `@Presenter1 hikes along @Subject1 a dramatic cliff-edge trail in @Scene1 the natural landscape, the vast terrain stretching behind her. The camera tracks alongside her in a single continuous side-dolly shot — keeping her at the left of the frame while the epic backdrop scrolls behind. She walks with confident energy, glancing out at the view, then turning to camera with a breathless, elated smile. Midway through the shot she pauses, planting her feet and taking in the panorama — the camera slowly pushing in toward her face as the landscape settles behind her. Her expression shifts from exhilaration to quiet awe. One continuous tracking shot moving to a slow push-in, adventure travel content, wide-angle lens emphasising the scale of the landscape, golden natural light, handheld energy with smooth stabilisation.`,
  },
  {
    name: 'V23e - Travel: Sunset & Closing Reflection',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'sunset', 'closing'],
    isPublic: false,
    notes: 'Frame 5 of travel showcase. Final frame — sunset closing shot. Presenter = host, Subject = scenic sunset location, Scene = destination landmark revisited.',
    prompt: `@Presenter1 sits at @Scene1 a beautiful sunset viewpoint — a beach blanket, a rooftop bar, a cliff edge, or a boat deck. The golden hour light paints everything warm. She holds a drink, watching @Subject1 the sun sinking toward the horizon, painting the sky in layers of orange, pink, and purple. Camera captures her silhouette against the sky, then moves to face her. She looks into the camera one final time, relaxed and reflective, the glow on her face. She shares her parting thoughts about the destination — what surprised her, what she will remember, why someone should visit. The camera slowly pulls back to a wide shot showing her small figure against the vast, beautiful landscape as the last light fades. Gentle drone ascent revealing the full scope of the destination in its most beautiful moment. Warm, emotional, the perfect ending that makes viewers immediately start searching for flights. Golden hour cinematography, slow contemplative pacing, rich sunset tones, the feeling of a journey well-lived.`,
  },
  // ── Lipsync Prompts ──────────────────────────────────────────────
  {
    name: 'V24 - Lipsync: Singing Performance',
    type: 'video' as const,
    isSystem: true,
    tags: ['lipsync', 'singing', 'music-video'],
    isPublic: false,
    notes: 'Lipsync mode. Add character image + audio file. The AI animates the character singing the provided audio.',
    prompt: `The character sings passionately, lips moving naturally in perfect sync with the audio. Expressive facial movements — eyes closing on emotional notes, subtle head tilts, natural breathing between phrases. Close-up to medium shot, soft studio lighting, shallow depth of field. The performance feels intimate and genuine.`,
  },
  {
    name: 'V25 - Lipsync: Talking Head / Vlog',
    type: 'video' as const,
    isSystem: true,
    tags: ['lipsync', 'talking', 'vlog'],
    isPublic: false,
    notes: 'Lipsync mode for talking head content. Character speaks naturally to camera.',
    prompt: `The character speaks directly to camera in a natural, conversational tone. Realistic lip movements matching the audio perfectly. Natural micro-expressions — eyebrow raises, slight nods, hand gestures near the face. Medium close-up framing, warm indoor lighting, slightly blurred background. Casual vlog style, authentic and engaging.`,
  },
  {
    name: 'V26 - Lipsync: Narration / Voiceover',
    type: 'video' as const,
    isSystem: true,
    tags: ['lipsync', 'narration', 'voiceover'],
    isPublic: false,
    notes: 'Lipsync mode for narration. Character speaks with authority, professional delivery.',
    prompt: `The character delivers a professional narration, speaking clearly with confident lip movements synced to the audio. Slight head movements and controlled expressions convey authority and warmth. Clean studio backdrop, professional lighting with soft key and rim light. The delivery is polished, measured, trustworthy — like a news anchor or documentary narrator.`,
  },
  {
    name: 'O01 - Prompt Edit Image',
    type: 'other' as const,
    isSystem: true,
    tags: ['edit'],
    isPublic: false,
    notes: 'Simple edit prompt for modifying a character in an existing scene while preserving the background.',
    prompt: `character holding flower , need to preserve the surrounding . maintain the background, maintain exact proportions and height.`,
  },
  {
    name: 'C04 - General Character',
    type: 'character' as const,
    isSystem: true,
    tags: ['general', 'reference-sheet'],
    isPublic: false,
    notes: 'General-purpose character reference sheet. Works with any character style.',
    prompt: `Create a professional character reference sheet based strictly on the uploaded reference image. Use a clean, neutral plain background and present the sheet as a technical model turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic). Arrange the composition into two horizontal rows. Top row: four full-body standing views placed side-by-side in this order: front view, left profile view (facing left), right profile view (facing right), back view. Bottom row: three highly detailed close-up portraits aligned beneath the full-body row in this order: front portrait, left profile portrait (facing left), right profile portrait (facing right). Maintain perfect identity consistency across every panel. Keep the subject in a relaxed A-pose and with consistent scale and alignment between views, accurate anatomy, and clear silhouette; ensure even spacing and clean panel separation, with uniform framing and consistent head height across the full-body lineup and consistent facial scale across the portraits. Lighting should be consistent across all panels (same direction, intensity, and softness), with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details.`,
  },
  {
    name: 'C05 - Monster Creature',
    type: 'character' as const,
    isSystem: true,
    tags: ['creature', 'reference-sheet'],
    isPublic: false,
    notes: 'Creature/monster identity sheet for film or game design production.',
    prompt: `Create a **professional creature identity sheet** based strictly on the uploaded reference image.

Present the result as a **technical production reference sheet used in film or game design**, matching the exact visual style of the reference (same realism level, rendering style, texture quality, color treatment, and overall aesthetic).

Use a **clean neutral studio background** so the creature silhouette and anatomical details remain clearly visible.

---

## Sheet Layout

Arrange the sheet into **two horizontal rows**.

### Top Row — Anatomical Turnaround

Four full-body views placed side-by-side in this order:

1. **Front view**
2. **Left profile view (facing left)**
3. **Right profile view (facing right)**
4. **Back view**

The creature should stand in a **neutral anatomical pose (A-pose or relaxed stance)**.

All anatomical structures must remain fully visible, including:

* horns
* claws
* wings
* dorsal spines
* tentacles
* tail
* armor plates
* skeletal protrusions
* unique biological features

Maintain **perfect anatomical consistency across every view**.

---

### Bottom Row — Surface Detail and Facial Structure

Three detailed close-up portraits aligned beneath the full-body row:

1. **Front head portrait**
2. **Left profile head portrait**
3. **Right profile head portrait**

These close-ups must clearly display:

* eye structure
* teeth or mandibles
* facial anatomy
* skin texture or scales
* scars or unique markings
* biological surface details

---

# Silhouette Lock (Important)

The creature must maintain a **strong and identical silhouette across all views**.

The outer shape formed by:

* head
* limbs
* wings
* tail
* horns
* dorsal structures

must remain **structurally identical from every angle**.

Do not redesign or alter the creature's body structure.

---

# Texture Mapping Consistency

Surface patterns must remain consistent across all views, including:

* scale arrangement
* skin texture
* scars
* color distribution
* glowing elements
* biological markings

Patterns should **align naturally across the body**, as if mapped to a real three-dimensional creature.

Avoid random texture changes between views.

---

# Proportion Lock

Maintain strict proportional consistency:

* limb length
* head size relative to body
* torso thickness
* wing span
* tail length

All proportions must remain identical across every panel.

---

# Lighting

Use **neutral studio lighting** with consistent direction and intensity across all panels.

Lighting should reveal surface details without dramatic shadows or cinematic mood lighting.

---

# Alignment

Ensure professional presentation:

* consistent scale between full-body views
* identical head height across the turnaround lineup
* consistent portrait scale for close-ups
* evenly spaced panels
* clean separation between views

The result should resemble a **professional creature model sheet used in visual effects production**.

---

# Output

Produce a **high-resolution creature identity sheet** with crisp details suitable for design reference.`,
  },
  {
    name: 'E01 - General Environment',
    type: 'environment' as const,
    isSystem: true,
    tags: ['general', 'reference-sheet'],
    isPublic: false,
    notes: `Environment identity sheet with 4-panel 2x2 grid layout. Replace the environment description at the bottom. 
    ## Output Format

Produce **one high-resolution environment reference sheet** with a **2x2 grid layout**, showing the **four views of the same environment**.

---

## Example Environment Slot (replace when needed)

You can insert the environment description here:

Environment: futuristic alpine research habitat in a grassy valley,
with spherical concrete research domes, a winding stream,
rocky terrain, and towering jagged mountains in the background.`,
    prompt: `Use **Image 1 as the base reference environment**.

Generate a **photorealistic environment identity sheet** composed of **four panels arranged in a 2x2 grid**, showing the **same real-world location** from multiple viewpoints.

All panels must depict the **exact same environment from Image 1**, preserving:

* architectural structures
* terrain layout
* ground surfaces
* materials and textures
* lighting conditions
* spatial relationships between objects

No new elements may be introduced.

---

## Panel Layout

**Panel 1 (Top-Left) — Establishing Perspective**

A wide establishing view matching the **main front perspective** of the environment seen in Image 1.

Show the full spatial composition and surrounding landscape.

---

**Panel 2 (Top-Right) — Side Perspective**

A side-angle view of the **same location**, revealing the **depth, side structures, and surrounding terrain** while keeping the primary landmarks visible.

---

**Panel 3 (Bottom-Left) — Elevated / Aerial Perspective**

A slightly elevated **three-quarter aerial view** revealing the **overall layout of the environment**, including placement of structures, paths, terrain features, and spatial relationships.

---

**Panel 4 (Bottom-Right) — Environmental Detail Perspective**

A closer environmental view highlighting **architectural details, materials, textures, surfaces, and ground elements** from the same location.

---

## Consistency Rules

Maintain **strict environmental continuity across all panels**:

* identical architecture and structures
* identical terrain layout
* identical ground elements (rocks, paths, water, vegetation)
* identical scale and spatial positioning
* identical landmark placement

All perspectives must clearly represent **the same physical location**.

---

## Lighting & Atmosphere

Preserve the **exact lighting conditions and atmospheric qualities** from Image 1, including:

* time of day
* color temperature
* shadows
* haze, fog, or environmental atmosphere

---

## Style Requirements

The result must appear as **real photography of the same location captured from different camera positions**, not concept art or stylized illustration.

Maintain:

* photorealistic lighting
* natural materials and textures
* realistic scale and perspective

---

## Restrictions

Do **not** add:

* people
* vehicles
* animals
* logos
* text
* watermarks
* new buildings or objects

Only the environment from Image 1 should exist.

---


`,
  },
  {
    name: 'C06 - Photorealistic Character Identity Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'identity'],
    isPublic: false,
    prompt: `1. Photorealistic character identity sheet (using a reference image )
Prompt
Create a photorealistic multi-angle photographic identify sheet
based strickly on the uploaded reference image.



• Match the exact real-world appearance of the person: facial structure, proportions, skin texture, age, asymmetry, and natural imperfections.
The result must look like real photography of a real human, not a digital character or 3D asset.
Use a simple, neutral background, similar to a studio or indoor wall.
The overall feeling should be documentary and natural, not stylized or cinematic.
Layout
• Two horizontal rows, presented as a clean photo contact sheet
• Top row: four full-body photographs of the same person:
1. Facing the camera
2. Left-facing profile
3. Right-facing profile
4. Facing away from the camera
• Bottom row: three close-up photographic portraits:
1. Facing the camera
2. Left-facing profile
3. Right-facing profile
Pose & Body Language
• The subject stands naturally and casually, as a real person would when asked to stand still.
• No exaggerated stance, no rigid pose, no symmetry.
• Subtle, natural weight distribution and relaxed posture.
• Shoulders relaxed, arms resting naturally at the sides.
Consistency & Accuracy
• Maintain strong identity consistency across all images.
• Preserve natural human asymmetry.
• Proportions must remain realistic and consistent without looking mechanically aligned.
• The subject should feel like the same person photographed multiple times, not a replicated model.


Lighting & Camera
• Soft, neutral, real-world lighting (similar to window light or soft studio light).
⚫ No dramatic, cinematic, or stylized lighting.
• Natural shadows with gentle falloff.
Realistic camera perspective and lens behavior.
Critical constraints
• Not a 3D render
• Not CGI
• Not a game character
• Not stylized
Not a model turnaround`,
  },
  {
    name: 'C07 - Creature Character Identity Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'creature', 'wildlife', 'reference-sheet'],
    isPublic: false,
    notes: `Use @Image1 as side profile master silhouette. Lock morphology and texture DNA across all views. For fantasy creatures, maintain biological plausibility.`,
    prompt: `Create a **photorealistic creature identity sheet** representing the exact same biological entity across multiple views.

The result must look like **real wildlife or cinematic creature reference photography**, not fantasy illustration.

---

## Core Identity Lock (CRITICAL)

### Master Silhouette Anchor

* Side profile defines:
  * body shape
  * limb count
  * proportions

---

### Silhouette DNA Lock

* Body shape must remain identical
* Limb count must not change
* Tail / fins / wings must remain consistent

---

### Texture DNA Lock

* Skin pattern must remain identical
* Scales, scars, markings must persist
* Color gradient must not shift

---

### Anatomy Lock

* Muscle and bone structure must remain consistent
* Biological plausibility required

---

## Layout

### Top Row — Form (5 images)

1. Front
2. Left 3/4
3. Right 3/4
4. Side profile (**MASTER SILHOUETTE**)
5. Rear

---

### Bottom Row — Detail (4 images)

1. Skin texture macro
2. Eye close-up
3. Limb/claw detail
4. Light interaction on skin

---

## Environment

* Neutral natural backdrop
* Controlled lighting

---

## Consistency Constraints

* Same anatomy
* Same texture pattern
* Same proportions

---

## Critical Restrictions

No mutation, no redesign, no stylization.

---

## AI Lock Instruction

"Creature identity is defined by silhouette and texture DNA.
Lock morphology and surface pattern across all views."
`,
  },
  {
    name: 'E02 - Photorealistic Environment Identity Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'identity'],
    isPublic: false,
    prompt: `# Photorealistic Environment Identity Sheet

### Prompt

Create a **photorealistic environment identity sheet** representing the same real-world location photographed from multiple angles.

The result must look like **real location photography captured during a single scouting session**, not a CGI environment, concept art, or game map.

The environment must maintain consistent:

* spatial layout
* architectural structures
* terrain and ground surfaces
* materials and textures
* scale and distance relationships
* lighting direction and shadow behavior

The images should resemble **documentary-style location reference photography used in film production**.

Use natural lighting and realistic camera behavior.

---

# Layout

Two horizontal rows presented as a **clean location reference contact sheet**.

All images must depict **the same location at the same time of day with consistent lighting**.

---

# Top Row — Spatial Orientation (4 images)

1. **Primary establishing view**
   Wide-angle view showing the main structure or area.

2. **Left perspective view**
   Camera moved slightly left to reveal spatial depth and surrounding structures.

3. **Right perspective view**
   Camera moved slightly right to show additional environmental context.

4. **Reverse view**
   Looking back toward the original direction to reveal what exists behind the main viewpoint.

Purpose:
These views establish **environment geometry and layout consistency**.

---

# Bottom Row — Detail & Material References (3 images)

1. **Key focal area**
   A closer view of the most recognizable part of the environment
   (e.g., building entrance, central landmark, important area).

2. **Material and surface detail**
   Close-up view of ground texture, wall material, vegetation, or structural surface.

3. **Lighting interaction view**
   A shot emphasizing natural light interaction with the environment
   (shadows, reflections, light falloff).

Purpose:
These images help models learn **material realism and lighting behavior**.

---

# Environment Composition Rules

Preserve the **true spatial structure of the location**.

Maintain consistent:

* building positions
* object placement
* terrain shape
* scale relationships

Avoid introducing new structures or moving objects between frames.

The images must feel like **multiple photographs of the same place taken from different positions**.

---

# Lighting & Camera

Use realistic photographic conditions:

* natural daylight or natural indoor lighting
* soft shadows with gentle falloff
* realistic camera perspective
* natural depth of field

Avoid:

* cinematic lighting
* stylized color grading
* fantasy lighting effects

---

# Consistency Constraints

The environment must remain identical across all images.

Maintain consistency in:

* architecture
* materials
* environmental objects
* lighting direction
* atmosphere

The location should appear like **a real place photographed from several camera positions during one moment in time**.

---

# Critical Restrictions

The output must **not resemble**:

* a 3D render
* CGI environment
* video game level
* stylized concept art
* architectural blueprint

The final result should look like **real photographic documentation of a real environment**.
.`,
  },
  {
    name: 'E03 - Interior Property Identity Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['photorealistic', 'interior', 'real-estate', 'property', 'reference-sheet'],
    isPublic: false,
    notes: `For real estate, hotel rooms, showrooms. Wide corner shot is the master layout anchor. All views must conform to the same room geometry and furniture placement.`,
    prompt: `Create a **photorealistic environment identity sheet** representing the exact same interior space photographed from multiple angles during a single controlled session.

The result must look like **real architectural / real estate photography**, not CGI, 3D render, or staged concept art.

---

## Core Identity Lock (CRITICAL)

The environment must behave as a **fixed physical space**.

---

### Master Layout Anchor (MANDATORY)

* The **wide corner shot (diagonal view)** is the master reference
* It defines:
  * wall positions
  * room proportions
  * door and window placement
  * furniture layout

**All other views must strictly conform to this layout**

---

### Spatial Geometry Lock

* Room dimensions must remain identical
* Walls, ceiling height, and floor area must not change
* Doors and windows must remain in exact positions

**Failure Prevention:**

* No shifting walls
* No disappearing windows
* No changing room size

---

### Furniture & Object Lock

* All furniture must remain:
  * same position
  * same orientation
  * same scale
* Decor items must not move or change

---

### Material & Surface Lock

Maintain identical:

* wall color and texture
* flooring material (wood, tile, marble, etc.)
* furniture materials
* reflections and gloss levels

---

### Lighting Direction Lock (VERY IMPORTANT)

* Sunlight direction must remain consistent
* Window light must match across all views
* Artificial lights must stay fixed

**Failure Prevention:**

* No changing time of day
* No inconsistent shadows

---

### Camera System Consistency

* Use realistic architectural photography perspective
* No extreme distortion
* Maintain consistent camera height (~eye level or tripod level)

---

## Layout

Two horizontal rows forming a **real estate contact sheet**

---

### Top Row — Spatial Structure (5 images)

1. **Wide corner shot (MASTER LAYOUT)**
2. Opposite corner wide shot
3. Straight-on wall view (main feature wall)
4. Secondary wall / angle
5. Entry view (door perspective)

---

### Bottom Row — Detail & Material (4 images)

1. Floor material close-up
2. Wall texture / finish
3. Furniture detail
4. Lighting interaction (sunlight / lamp on surfaces)

---

## Environment Rules

* Clean, realistic interior
* No stylization
* No clutter unless intentional and consistent

---

## Consistency Constraints (STRICT)

* Identical layout across all images
* Identical furniture placement
* Identical lighting direction
* Identical materials

---

## Critical Restrictions

Must NOT resemble:

* CGI render
* interior concept art
* unrealistic staging

---

## AI Lock Instruction

"Lock environment as a fixed architectural space.
Use the wide corner shot as master layout.
Maintain identical geometry, furniture placement, and lighting direction across all views."
`,
  },
  {
    name: 'P01 - Photorealistic Prop Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'identity'],
    isPublic: false,
    notes:`
# How This Fits Your Full Pipeline

Your generation pipeline becomes very stable when you anchor **three identity layers**.

**1. Character Identity Sheet**
Defines people.

**2. Environment Identity Sheet**
Defines locations.

**3. Prop / Object Identity Sheet**
Defines objects that appear repeatedly.

Scene generation then references these anchors.

Example scene prompt:

Character: little boy Jerry
Environment: Paris street café environment sheet
Prop: small red backpack prop identity sheet
Action: Jerry walking along the street holding the backpack

This structure significantly reduces **visual drift in long image → video sequences**.`,
    prompt: `# Photorealistic Prop / Object Identity Sheet

### Prompt

Create a **photorealistic prop identity sheet** representing the same real-world object photographed from multiple angles.

The result must look like **real product-style photography captured during a single reference session**, not a CGI model, 3D render, or stylized illustration.

The object must maintain consistent:

* shape and proportions
* materials and surface textures
* color and finish
* scale and thickness
* wear, scratches, and natural imperfections

The images should resemble **real photographic documentation of a physical object used as a film prop reference**.

Use neutral lighting and realistic camera behavior.

---

# Layout

Two horizontal rows presented as a **clean prop reference contact sheet**.

All images must depict **the exact same object photographed under identical lighting conditions**.

---

# Top Row — Structural Orientation (4 images)

1. **Front view**
   The object facing directly toward the camera.

2. **Left perspective view**
   Slightly angled to reveal depth and side structure.

3. **Right perspective view**
   Opposite angle showing the other side.

4. **Rear view**
   Back side of the object.

Purpose:
These views establish **overall geometry, structure, and silhouette**.

---

# Bottom Row — Detail & Material References (3 images)

1. **Top or functional view**
   The most important functional or recognizable surface of the object.

2. **Material / texture close-up**
   A close-up showing surface material, texture, or wear.

3. **Lighting interaction view**
   A view showing how light interacts with the object’s material
   (reflections, matte surfaces, gloss, metal shine, etc.).

Purpose:
These images help models understand **material realism and small details**.

---

# Object Composition Rules

Preserve the **true structure and proportions** of the object.

Maintain consistency in:

* shape and geometry
* material appearance
* surface imperfections
* object scale

Avoid altering or redesigning the object between images.

The images must feel like **multiple photographs of the same physical object placed on a table and photographed from different angles**.

---

# Background

Use a **simple neutral background** similar to product photography:

* neutral studio backdrop
* simple tabletop surface
* minimal visual distractions

The background should not dominate the image.

---

# Lighting & Camera

Use realistic photography conditions:

* soft neutral studio lighting
* gentle shadows
* natural reflections
* realistic camera perspective

Avoid:

* dramatic cinematic lighting
* stylized lighting effects
* exaggerated reflections

---

# Consistency Constraints

The object must remain identical across all images.

Maintain consistent:

* size
* shape
* materials
* color tone
* surface wear

All photographs should appear as if they were taken **during the same photography session of the same physical object**.

---

# Critical Restrictions

The output must **not resemble**:

* a 3D render
* CGI model
* game asset
* stylized illustration
* concept art

The result must resemble **real photographic documentation of a physical object**.

---

`,
  },
  {
    name: 'P02 - Photorealistic Car Prop Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'car', 'vehicle', 'reference-sheet'],
    isPublic: false,
    notes: `# System Integration

If you are structuring inputs:

* \`@Image1\` → Side profile (geometry lock)
* \`@Image2\` → Reflection / paint reference
* \`@Image3\` → Wheel / detail reference

Add:
> "Match @Image1 silhouette exactly, apply @Image2 reflection behavior, and preserve @Image3 detail fidelity across all views."`,
    prompt: `Create a **photorealistic car prop identity sheet** representing the exact same real-world vehicle photographed from multiple angles.

The result must look like **real automotive reference photography captured during a single controlled studio session**, not CGI, 3D render, or stylized illustration.

The car must behave as a **persistent physical prop** that can be reused across scenes.

---

# Core Vehicle Consistency Requirements (CRITICAL)

The vehicle must maintain absolute consistency in:

* body shape and proportions (no variation)
* silhouette and stance (locked geometry)
* paint color and finish (gloss / matte / metallic)
* reflections and highlight behavior
* wheel design, size, and position
* tire profile and texture
* panel gaps and body lines
* headlights and taillights structure
* glass tint and transparency
* small imperfections (must remain consistent)

> Treat this as **one real car photographed multiple times**, not variations.

---

# Layout

Two horizontal rows in a **clean automotive contact sheet format**.

All images must appear as if captured in **one uninterrupted studio photography session**.

---

# Top Row — Structural Orientation (Vehicle Geometry Lock) (4 images)

1. **Front view (direct alignment)**
   Car facing directly forward. Symmetry and stance clearly visible.

2. **Front 3/4 view (left angle)**
   Slight angle showing depth, hood lines, and side curvature.

3. **Rear 3/4 view (right angle)**
   Opposite angle showing rear form and volume.

4. **Rear view (direct alignment)**
   Straight rear shot showing taillights and structure.

**Purpose:**
Defines **overall geometry, proportions, and silhouette consistency**.

---

# Bottom Row — Functional & Material Identity (4 images)

1. **Side profile (MASTER SILHOUETTE LOCK)**
   Perfect side view — must define exact proportions (wheelbase, roofline, ride height).
   This is the **anchor reference for all future generations**

2. **Wheel & tire close-up**
   Rim design, brake system, tire texture and wear.

3. **Surface material close-up (paint)**
   Body panel showing paint finish, micro-texture, and imperfections.

4. **Reflection / lighting interaction view (CRITICAL)**
   Close-up showing how light reflects across the car surface
   (gloss highlights, gradients, curvature reflections)

**Purpose:**
Defines **material realism + reflection behavior + micro details**.

---

# Car-Specific Composition Rules

The vehicle must be:

* physically realistic and production-feasible
* aerodynamically believable
* structurally coherent (no impossible geometry)
* consistent in panel alignment and engineering logic

Avoid:

* concept-car exaggeration
* inconsistent air intakes or vents
* unrealistic wheel placement
* changing proportions between images

---

# Background

Use a **neutral automotive studio environment**:

* seamless white / grey backdrop
* clean studio floor (slight reflection allowed)
* no environmental distractions

The car must remain the **primary focus**.

---

# Lighting & Camera

Use **realistic automotive studio lighting**:

* softbox lighting defining body contours
* controlled highlight lines along curves
* consistent reflection direction across all images
* soft shadows under vehicle

Camera:

* full-frame realistic perspective
* 50mm-85mm equivalent
* minimal distortion
* consistent camera height across shots

---

# Consistency Constraints (STRICT)

The vehicle must remain identical across all images:

* same exact geometry
* same paint and material response
* same reflections and highlight behavior
* same wheel alignment and orientation
* same ride height and stance

All images must feel like:

> **the same car, unmoved, photographed from different angles in the same session**

---

# Critical Restrictions

The output must NOT resemble:

* CGI / 3D render
* concept art
* game asset
* stylized illustration

The result must resemble:

> **real-world automotive reference photography used for film prop continuity or manufacturer documentation**

---

# AI Consistency Reinforcement (VERY IMPORTANT)

"Lock this vehicle as a persistent prop.
Do not redesign, reinterpret, or mutate across views.
Maintain identical silhouette, reflections, and material response.
Use side profile as the master geometry reference."
`,
  },
  {
    name: 'P03 - Helicopter Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'helicopter', 'aviation', 'reference-sheet'],
    isPublic: false,
    notes: `Use @Image1 as the side profile master geometry reference. All other views must conform to this silhouette.`,
    prompt: `Create a **photorealistic helicopter identity sheet** representing the exact same real-world helicopter photographed from multiple angles in a single controlled session.

The result must look like **real aviation photography**, not CGI, 3D render, or concept art.

---

## Core Identity Lock (CRITICAL)

The helicopter must behave as a **single fixed mechanical system**.

### Master Geometry Anchor (MANDATORY)

* The **side profile view is the master reference**
* It defines:
  * fuselage length
  * rotor mast position
  * tail boom length
  * landing gear placement
* ALL other views must strictly conform to this geometry

---

### Rotor Physics Lock (CRITICAL)

* Main rotor blade count must remain identical across all views
* Blade length must remain proportional to fuselage
* Rotor hub must maintain identical structure
* Blade pitch must be realistic and consistent
* Tail rotor must maintain exact size, position, and orientation

**Failure Prevention:**

* No extra or missing blades
* No warped or melted rotor shapes
* No inconsistent rotor size between views

---

### Material & Surface Lock

Maintain identical:

* paint scheme and markings
* panel lines and rivets
* glass transparency and tint
* metal surface finish

---

## Layout

Two horizontal rows forming a **clean aviation contact sheet**.

---

### Top Row — Structural Geometry (5 images)

1. Front view (symmetrical alignment)
2. Front 3/4 view
3. Side profile (**MASTER GEOMETRY REFERENCE**)
4. Rear 3/4 view
5. Rear view

---

### Bottom Row — Functional Detail (4 images)

1. **Top-down view (CRITICAL for rotor geometry)**
2. Rotor hub and blade close-up
3. Landing gear and underside
4. Cockpit glass and nose detail

---

## Environment

* Neutral airfield or studio
* Static helicopter (no motion blur)
* Minimal background distraction

---

## Lighting & Camera

* Soft natural daylight or studio light
* Consistent lighting direction across all views
* Realistic reflections on metal and glass
* 50-85mm lens equivalent
* No distortion

---

## Consistency Constraints (STRICT)

* Identical geometry across all views
* Identical rotor system
* Identical materials and markings
* Identical proportions and alignment

---

## Critical Restrictions

The output must NOT resemble:

* CGI or 3D render
* concept art
* stylized illustration

---

## AI Lock Instruction

"Lock helicopter identity as a fixed mechanical system.
Use side profile as master geometry.
Enforce rotor physics consistency across all views.
Do not mutate blade count, structure, or proportions."
`,
  },
  {
    name: 'P04 - Robot Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'robot', 'mechanical', 'reference-sheet'],
    isPublic: false,
    notes: `Use @Image1 as side profile master structure reference. Lock joint topology and panel system across all views.`,
    prompt: `Create a **photorealistic robot identity sheet** representing the exact same mechanical unit across multiple angles.

The result must look like **real industrial or cinematic robot photography**, not CGI or concept art.

---

## Core Identity Lock (CRITICAL)

### Master Geometry Anchor

* Side profile defines:
  * limb proportions
  * torso size
  * joint positions
* All views must conform

---

### Joint System Lock (CRITICAL)

* Each joint (shoulder, elbow, knee, etc.) must remain in identical position
* Limb connections must not change
* Joint count must remain constant

**Failure Prevention:**

* No extra joints
* No missing joints
* No floating or disconnected parts

---

### Panel System Lock

* Armor panels must remain consistent
* Panel segmentation must not shift
* Gaps and overlaps must be identical

---

### Material Zoning

Maintain fixed zones:

* metal frame
* rubber joints
* glass / LED components

---

## Layout

### Top Row — Structure (5 images)

1. Front view
2. Left 3/4
3. Right 3/4
4. Side profile (**MASTER STRUCTURE**)
5. Rear view

---

### Bottom Row — Detail (4 images)

1. Joint close-up
2. Panel segmentation detail
3. Head / sensor detail
4. Material reflection detail

---

## Lighting & Camera

* Neutral industrial lighting
* Soft reflections on metal
* No dramatic lighting

---

## Consistency Constraints

* Same structure across all views
* Same panel layout
* Same materials

---

## Critical Restrictions

No stylization, no redesign, no mutation.

---

## AI Lock Instruction

"Robot is a fixed mechanical rig.
Lock joint structure and panel system.
Do not redesign or mutate mechanical topology."
`,
  },
  {
    name: 'P05 - Creature Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'creature', 'wildlife', 'reference-sheet'],
    isPublic: false,
    notes: `Use @Image1 as side profile master silhouette reference. Lock morphology and texture DNA across all views.`,
    prompt: `Create a **photorealistic creature identity sheet** representing the exact same biological entity across multiple views.

The result must look like **real wildlife or cinematic creature reference photography**, not fantasy illustration.

---

## Core Identity Lock (CRITICAL)

### Master Silhouette Anchor

* Side profile defines:
  * body shape
  * limb count
  * proportions

---

### Silhouette DNA Lock

* Body shape must remain identical
* Limb count must not change
* Tail / fins / wings must remain consistent

---

### Texture DNA Lock

* Skin pattern must remain identical
* Scales, scars, markings must persist
* Color gradient must not shift

---

### Anatomy Lock

* Muscle and bone structure must remain consistent
* Biological plausibility required

---

## Layout

### Top Row — Form (5 images)

1. Front
2. Left 3/4
3. Right 3/4
4. Side profile (**MASTER SILHOUETTE**)
5. Rear

---

### Bottom Row — Detail (4 images)

1. Skin texture macro
2. Eye close-up
3. Limb/claw detail
4. Light interaction on skin

---

## Environment

* Neutral natural backdrop
* Controlled lighting

---

## Consistency Constraints

* Same anatomy
* Same texture pattern
* Same proportions

---

## Critical Restrictions

No mutation, no redesign, no stylization.

---

## AI Lock Instruction

"Creature identity is defined by silhouette and texture DNA.
Lock morphology and surface pattern across all views."
`,
  },
  {
    name: 'P06 - Consumer Product Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'product', 'commercial', 'reference-sheet'],
    isPublic: false,
    notes: `Use for phones, electronics, bottles, packaging, or any manufactured item. Lock geometry, material finish, and branding across all views.`,
    prompt: `Create a **photorealistic consumer product identity sheet** representing the exact same manufactured item across multiple angles.

The result must look like **real product photography**, not CGI.

---

## Core Identity Lock (CRITICAL)

### Master Geometry Anchor

* Front and side views define exact dimensions

---

### Precision Geometry Lock

* Edge curvature must remain identical
* Thickness must not change
* All dimensions fixed

---

### Branding Lock

* Logo position fixed
* Text and markings consistent

---

### Material Finish Lock

* Matte / gloss must be identical
* Reflection intensity consistent

---

## Layout

### Top Row — Form (4 images)

1. Front
2. Left perspective
3. Right perspective
4. Rear

---

### Bottom Row — Detail (4 images)

1. Top / functional surface
2. Button / interface close-up
3. Material texture
4. Reflection behavior

---

## Lighting & Camera

* Studio lighting
* Clean reflections
* No stylization

---

## Consistency Constraints

* Same geometry
* Same material
* Same branding

---

## Critical Restrictions

No variation allowed.

---

## AI Lock Instruction

"Treat as precision-manufactured object.
Lock geometry, material, and branding exactly."
`,
  },
  // ══════════════════════════════════════════════════════════════
  // DESIGN PROMPTS — Magazine, Thumbnails, Social Media, Posters
  // ══════════════════════════════════════════════════════════════
  {
    name: 'D01 - Magazine Cover: Fashion Editorial',
    type: 'design' as const,
    isSystem: true,
    tags: ['magazine', 'fashion', 'editorial'],
    isPublic: false,
    notes: 'High-end fashion magazine cover. Use @Image1 as the model/character reference.',
    prompt: `Create a high-end fashion magazine cover featuring @Image1 as the cover model. The composition follows classic Vogue editorial layout — the subject is centre-framed, shot from slightly below eye level, creating an empowering perspective. Dramatic studio lighting with a single key light creating sharp shadows on one side of the face, rim light separating the subject from a deep midnight blue gradient background. The subject wears haute couture with bold textures — velvet, metallic, structured shoulders. Expression is intense yet elegant, direct eye contact with the camera. Leave clean negative space at the top for masthead text and along the left side for cover line text. The overall tone is luxurious, confident, and aspirational. Shot on medium format digital, 85mm equivalent, f/2.8, razor-sharp focus on the eyes with gentle falloff.`,
  },
  {
    name: 'D02 - Magazine Cover: Tech/Business',
    type: 'design' as const,
    isSystem: true,
    tags: ['magazine', 'business', 'tech'],
    isPublic: false,
    notes: 'Professional tech/business magazine cover. Use @Image1 as the person/founder reference.',
    prompt: `Create a premium business and technology magazine cover featuring @Image1 as a visionary tech leader. The subject stands in a futuristic office environment with floor-to-ceiling glass walls overlooking a city skyline at blue hour. Cool-toned lighting with subtle blue and white accents reflecting off glass surfaces. The subject wears a tailored dark suit or smart casual blazer, arms crossed or one hand in pocket, exuding quiet confidence. Expression is thoughtful and forward-looking, slight knowing smile. Composition places the subject in the right two-thirds with the cityscape visible through the glass on the left, creating depth and scale. Clean space at the top for the magazine title and along the sides for feature headlines. The aesthetic is clean, modern, Silicon Valley meets Wall Street. Shot at 50mm, f/4, with the city lights creating beautiful bokeh behind the glass.`,
  },
  {
    name: 'D03 - YouTube Thumbnail: Reaction/Shock',
    type: 'design' as const,
    isSystem: true,
    tags: ['thumbnail', 'youtube', 'reaction'],
    isPublic: false,
    notes: 'High-CTR YouTube thumbnail with dramatic expression. Use @Image1 as the person.',
    prompt: `Create a YouTube thumbnail that demands clicks. @Image1 the person is shown from the chest up, slightly tilted, with an exaggerated shocked or amazed facial expression — wide eyes, open mouth, hands on cheeks or pointing at something off-screen. The background is a vibrant gradient explosion of saturated colours — electric yellow to hot orange with radial speed lines emanating from behind the subject. Add a dramatic spotlight glow behind the head creating a halo effect. The image uses extreme colour saturation, high contrast, and punchy shadows. The subject pops off the background with a thick white or coloured outline stroke effect. Leave a bold empty area on the right side for large text overlay. Everything about this image screams CLICK ME — it is designed to stop the scroll at 2% thumbnail size. Ultra-sharp, hyper-saturated, maximum visual impact.`,
  },
  {
    name: 'D04 - YouTube Thumbnail: Tutorial/How-To',
    type: 'design' as const,
    isSystem: true,
    tags: ['thumbnail', 'youtube', 'tutorial'],
    isPublic: false,
    notes: 'Clean tutorial-style YouTube thumbnail. Use @Image1 as the presenter, @Image2 as the subject/result.',
    prompt: `Create a professional YouTube tutorial thumbnail. Split composition — @Image1 the presenter on the left side, smiling confidently and pointing toward @Image2 the finished result or subject on the right side. The presenter is brightly lit with soft studio lighting, clean background fading to a solid colour that complements the subject. A large curved arrow or visual connector links the presenter to the result. The overall colour palette uses 2-3 bold complementary colours — think teal and orange, or purple and yellow. High saturation, crisp edges, the image reads clearly even at thumbnail size. The presenter has an encouraging, approachable expression. Leave space at the bottom or top for bold text overlay. The composition creates a clear visual story: this person will show you how to achieve this result.`,
  },
  {
    name: 'D05 - YouTube Thumbnail: VS/Comparison',
    type: 'design' as const,
    isSystem: true,
    tags: ['thumbnail', 'youtube', 'comparison'],
    isPublic: false,
    notes: 'VS-style comparison thumbnail. Use @Image1 and @Image2 as the two items being compared.',
    prompt: `Create a dramatic VS comparison YouTube thumbnail. The frame is split diagonally or with a lightning bolt divider down the centre. @Image1 on the left side with a blue/cool tone colour grade, @Image2 on the right side with a red/warm tone colour grade. Both subjects face each other across the divide creating visual tension. The divider line crackles with energy — electric sparks, glow effects, or fire and ice contrasting elements. Background has dramatic clouds or abstract energy patterns matching each side's colour scheme. Both subjects are dramatically lit from opposite sides. The composition is bold, confrontational, and immediately tells the viewer these two things are being compared. Maximum contrast between the two halves. Leave a narrow centre strip clean for VS text overlay. Epic, competitive energy, high drama.`,
  },
  {
    name: 'D06 - Instagram Post: Lifestyle Product',
    type: 'design' as const,
    isSystem: true,
    tags: ['social-media', 'instagram', 'product'],
    isPublic: false,
    notes: 'Aesthetic Instagram product post. Use @Image1 as the product reference.',
    prompt: `Create an aesthetic Instagram-worthy product shot of @Image1. The product is placed on a textured surface — raw concrete, marble slab, or natural linen fabric — with carefully curated props that tell a lifestyle story: fresh flowers, a linen napkin, scattered botanicals, or complementary items. Shot from a 45-degree overhead angle with soft, diffused natural window light creating gentle shadows. The colour palette is warm and muted — cream, sage, terracotta, soft gold — creating a cohesive feed-worthy aesthetic. Shallow depth of field keeps the product sharp while the background melts into a dreamy softness. Negative space is intentionally placed for text or logo overlay. The overall mood is aspirational yet attainable, the kind of image that makes someone save it to their collection. Shot on 35mm film aesthetic with subtle grain and warm highlights.`,
  },
  {
    name: 'D07 - Instagram Story: Event Announcement',
    type: 'design' as const,
    isSystem: true,
    tags: ['social-media', 'instagram', 'event'],
    isPublic: false,
    notes: 'Vertical Instagram Story for event promotion. Use @Image1 as the event visual or headliner.',
    prompt: `Create a stunning vertical 9:16 Instagram Story design for an event announcement. @Image1 is the main visual — a performer, speaker, or event venue — placed in the upper two-thirds of the frame. The image has a dramatic colour grade with deep blacks, crushed shadows, and a single accent colour popping — neon pink, electric blue, or gold. Geometric overlay elements — thin lines, circles, or abstract shapes — frame the subject creating a designed, editorial feel. The lower third is a clean dark gradient area perfect for event details text. Subtle animated-look elements: light leak flares, floating particles, or a gentle grain texture add movement and energy. The design feels premium, exclusive, and creates FOMO. Modern event poster aesthetic meets social media native design.`,
  },
  {
    name: 'D08 - TikTok Cover: Bold & Vibrant',
    type: 'design' as const,
    isSystem: true,
    tags: ['social-media', 'tiktok', 'cover'],
    isPublic: false,
    notes: 'Eye-catching TikTok video cover. Use @Image1 as the main visual.',
    prompt: `Create a bold, scroll-stopping TikTok cover image in 9:16 vertical format. @Image1 is the central subject, captured in a dynamic pose or mid-action moment. The background is an explosion of Gen-Z aesthetic — Y2K gradients, chrome metallic elements, holographic textures, or abstract liquid shapes in trending colours (lavender, hot pink, lime green, electric blue). The subject has a slight glow or outline effect that separates them from the chaotic background. Sticker-like decorative elements float around — stars, sparkles, emoji-inspired shapes, squiggly lines. The composition is intentionally slightly off-centre and energetic, not perfectly balanced — it feels alive and spontaneous. High saturation, bold contrast, maximum personality. This cover makes someone stop scrolling and tap.`,
  },
  {
    name: 'D09 - Movie Poster: Action/Thriller',
    type: 'design' as const,
    isSystem: true,
    tags: ['poster', 'movie', 'action'],
    isPublic: false,
    notes: 'Cinematic movie poster design. Use @Image1 as the main character, @Image2 as the secondary character or scene.',
    prompt: `Create a cinematic action movie poster. @Image1 the main character stands in a powerful hero pose in the centre foreground — dramatic low-angle perspective, wearing tactical or stylish attire, bathed in warm firelight from one side and cool blue moonlight from the other. Behind them, @Image2 the secondary element — a cityscape in chaos, explosions, or a dramatic landscape — creates an epic sense of scale. The sky above is turbulent with dramatic clouds lit by orange and teal tones. Lens flares streak across the frame. The composition follows the classic Hollywood one-sheet layout — hero large in centre, action scenes smaller in the background, clean sky area at top for the title, bottom area for credits block. Photorealistic, shot on anamorphic lens with horizontal flares, colour-graded like a Nolan or Bay production. Cinematic grain, extreme detail, epic scale.`,
  },
  {
    name: 'D10 - Poster: Music/Concert',
    type: 'design' as const,
    isSystem: true,
    tags: ['poster', 'music', 'concert'],
    isPublic: false,
    notes: 'Concert/music event poster. Use @Image1 as the artist/performer.',
    prompt: `Create a striking music concert poster. @Image1 the artist is shown in a dramatic silhouette or high-contrast portrait, emerging from darkness with stage lighting — intense back-rim light in a signature colour (deep purple, crimson red, or neon cyan) creating a godlike halo effect. The background layers abstract elements: sound wave visualizations, geometric patterns, smoke/fog effects, and scattered light particles that suggest a live concert atmosphere. The composition is vertical with the artist in the upper portion and generous negative space below for event details. The overall aesthetic references iconic concert posters — bold, moody, with a single dominant colour accent against near-black backgrounds. Subtle texture overlay — torn paper edges, screen-print halftone dots, or distressed grain — adds authenticity. The poster should feel like something you would frame on your wall.`,
  },
  {
    name: 'D11 - Book Cover: Sci-Fi/Fantasy',
    type: 'design' as const,
    isSystem: true,
    tags: ['book-cover', 'sci-fi', 'fantasy'],
    isPublic: false,
    notes: 'Epic sci-fi or fantasy book cover. Use @Image1 as the main character.',
    prompt: `Create an epic sci-fi or fantasy book cover illustration. @Image1 the protagonist stands at the centre of the composition, back partially turned to the viewer, gazing out at a vast, impossible landscape — floating islands, a massive alien structure, twin moons, or an ancient magical citadel. The scale is immense — the character is small against the overwhelming world, creating wonder and adventure. Dramatic volumetric lighting — god rays breaking through clouds, bioluminescent elements in the foreground, or a distant sun casting long shadows across an alien terrain. The colour palette is rich and otherworldly — deep midnight purples, ethereal teals, warm amber highlights on the character. Painterly digital art style with visible brushwork in the sky and environment, hyper-detailed on the character. Classic epic fantasy cover composition with clean top area for the title and bottom for the author name.`,
  },
  {
    name: 'D12 - Album Art: R&B/Hip-Hop',
    type: 'design' as const,
    isSystem: true,
    tags: ['album-art', 'music', 'hip-hop'],
    isPublic: false,
    notes: 'Square album artwork. Use @Image1 as the artist.',
    prompt: `Create a square 1:1 album cover artwork. @Image1 the artist is shot in a stylized portrait — not a standard photo but an artistic interpretation. The treatment combines photorealism with abstract elements: one half of the face dissolves into paint splashes, digital glitch artifacts, or liquid chrome. The background is a deep, moody gradient — midnight blue to black — with subtle floating elements: rose petals, shattered glass particles, smoke wisps, or abstract light trails. The lighting is dramatic and editorial — strong side light creating deep shadows, with a single colour accent reflecting on the skin (warm amber or cool purple). The composition is tight — face fills most of the frame, slightly off-centre. The overall mood is introspective, raw, and artistic. Reference the visual language of iconic album covers — The Weeknd's moody neon, Drake's intimate portraits, SZA's dreamlike aesthetics. Premium, gallery-worthy, immediate emotional impact.`,
  },
  // ══════════════════════════════════════════════════════════════
  // STYLE PROMPTS — Visual style presets for image/video generation
  // ══════════════════════════════════════════════════════════════
  {
    name: 'S01 - Cinematic',
    type: 'style' as const,
    isSystem: true,
    tags: ['cinematic', 'film', 'dramatic'],
    isPublic: false,
    notes: 'Append to any prompt for cinematic film look. Works with all image models.',
    prompt: `Cinematic film look. Shot on ARRI Alexa with anamorphic lenses. Warm color grading with teal shadows and amber highlights. Shallow depth of field with natural bokeh. Dramatic side lighting with soft fill. Film grain texture. 2.39:1 widescreen composition. Rich contrast, lifted blacks, desaturated midtones. Professional color science reminiscent of Roger Deakins cinematography.`,
  },
  {
    name: 'S02 - Anime',
    type: 'style' as const,
    isSystem: true,
    tags: ['anime', 'japanese', 'cel-shading'],
    isPublic: false,
    notes: 'Japanese anime style. Works best with character and scene prompts.',
    prompt: `Japanese anime art style. Clean cel-shaded rendering with bold outlines. Vibrant saturated colors with smooth gradients. Large expressive eyes with detailed highlights. Dynamic hair with individual strand detail. Soft ambient occlusion shading. Studio Ghibli-inspired background painting with watercolor sky. Clean line art, consistent stroke weight. Dramatic speed lines for action. Beautiful lighting with rim highlights and color bounce.`,
  },
  {
    name: 'S03 - Watercolor',
    type: 'style' as const,
    isSystem: true,
    tags: ['watercolor', 'painting', 'artistic'],
    isPublic: false,
    notes: 'Soft watercolor painting effect. Great for environments and portraits.',
    prompt: `Traditional watercolor painting style. Soft translucent washes with visible paper texture showing through. Wet-on-wet blending with organic color bleeding at edges. Limited palette with harmonious color mixing. Loose brushwork with confident strokes. White paper preserved as highlights. Subtle granulation in darker tones. Natural paint drips and splatter marks. Atmospheric perspective with lighter, cooler distant elements. Hand-painted quality with artistic imperfection.`,
  },
  {
    name: 'S04 - Oil Painting',
    type: 'style' as const,
    isSystem: true,
    tags: ['oil-painting', 'classical', 'fine-art'],
    isPublic: false,
    notes: 'Classical oil painting texture. Rich, museum-quality feel.',
    prompt: `Classical oil painting style. Rich impasto brushstrokes with visible texture and paint thickness. Deep, luminous color with layered glazing technique. Chiaroscuro lighting with dramatic light-dark contrast. Warm undertones in shadows, cool highlights. Canvas weave texture visible in thin areas. Renaissance-inspired composition with golden ratio. Rembrandt lighting on faces. Baroque richness in color saturation. Museum-quality fine art presentation.`,
  },
  {
    name: 'S05 - Noir',
    type: 'style' as const,
    isSystem: true,
    tags: ['noir', 'black-white', 'dramatic'],
    isPublic: false,
    notes: 'High contrast black and white film noir. Perfect for dramatic scenes.',
    prompt: `Film noir style. High contrast black and white with deep pure blacks and bright whites. Dramatic hard shadows from venetian blinds, streetlamps, or single light sources. Expressionistic angles and Dutch tilts. Fog, rain, and wet reflective surfaces. Silhouettes and rim lighting. 1940s aesthetic with fedora hats and long coats. Gritty urban atmosphere. Cigarette smoke catching the light. Harsh shadows cutting across faces. Moody, mysterious, dangerous atmosphere.`,
  },
  {
    name: 'S06 - Pop Art',
    type: 'style' as const,
    isSystem: true,
    tags: ['pop-art', 'bold', 'graphic'],
    isPublic: false,
    notes: 'Bold pop art style inspired by Warhol and Lichtenstein.',
    prompt: `Pop art style inspired by Andy Warhol and Roy Lichtenstein. Bold flat colors — primary red, blue, yellow with black outlines. Ben-Day dot halftone pattern on skin and backgrounds. High contrast with no subtle gradients. Thick comic-book outlines. Bright saturated palette. Repetitive grid layout option. Speech bubbles and onomatopoeia text. Screen-print aesthetic with slight color misregistration. Bold, graphic, immediate visual impact.`,
  },
  {
    name: 'S07 - Pixel Art',
    type: 'style' as const,
    isSystem: true,
    tags: ['pixel-art', 'retro', '8-bit'],
    isPublic: false,
    notes: 'Retro pixel art game aesthetic. Best at lower resolutions.',
    prompt: `Retro pixel art style. Crisp square pixels with no anti-aliasing. Limited 16-32 color palette with careful dithering for gradients. Clean readable silhouettes. 16-bit era aesthetic with detailed sprite work. Isometric or side-view perspective. Bright saturated colors on dark backgrounds. Pixel-perfect placement with no sub-pixel rendering. Nostalgic video game aesthetic reminiscent of SNES/Genesis era. Clean, deliberate, each pixel intentionally placed.`,
  },
  {
    name: 'S08 - Comic Book',
    type: 'style' as const,
    isSystem: true,
    tags: ['comic-book', 'marvel', 'graphic-novel'],
    isPublic: false,
    notes: 'Western comic book style with bold inks and dynamic composition.',
    prompt: `Western comic book style. Bold black ink outlines with confident line weight variation — thick for contours, thin for detail. Flat cel colors with dramatic shadows. Cross-hatching for texture and depth. Dynamic foreshortened poses with extreme perspective. Speed lines and motion blur for action. Panel-style composition. Rich saturated colors — primary palette. Strong chins, defined muscles, heroic proportions. Marvel/DC inspired visual language with kinetic energy.`,
  },
  {
    name: 'S09 - Sketch / Pencil Drawing',
    type: 'style' as const,
    isSystem: true,
    tags: ['sketch', 'pencil', 'drawing'],
    isPublic: false,
    notes: 'Hand-drawn pencil sketch effect. Raw, artistic quality.',
    prompt: `Hand-drawn pencil sketch style. Graphite on textured paper with visible tooth. Loose gestural strokes for form, tighter rendering for focal areas. Cross-hatching and stippling for shadows. Visible construction lines and guide marks. Soft HB pencil for light areas, dark 6B for deep shadows. Smudged edges for atmospheric depth. Paper texture visible throughout. Artistic imperfection — eraser marks, finger smudges, overlapping strokes. Raw, immediate, sketchbook quality.`,
  },
  {
    name: 'S10 - Vintage / Retro',
    type: 'style' as const,
    isSystem: true,
    tags: ['vintage', 'retro', 'film'],
    isPublic: false,
    notes: 'Faded vintage film look. 1970s-80s nostalgia.',
    prompt: `Vintage retro film style. Faded colors with heavy warm cast — yellowed highlights, orange midtones, teal shadows. Heavy film grain with light leaks and lens flare. Slightly overexposed with blown-out highlights. Soft focus with chromatic aberration at edges. Kodak Portra or Fuji Superia color science. Vignetting at corners. Muted pastel palette. 1970s-80s aesthetic. Polaroid-like color shift. Nostalgic, dreamy, sun-drenched atmosphere.`,
  },
  {
    name: 'S11 - Japanese Ink (Sumi-e)',
    type: 'style' as const,
    isSystem: true,
    tags: ['japanese-ink', 'sumi-e', 'traditional'],
    isPublic: false,
    notes: 'Traditional Japanese ink wash painting. Minimalist and elegant.',
    prompt: `Traditional Japanese sumi-e ink wash painting. Black ink on rice paper with varying ink density — from pale grey washes to deep saturated black. Minimalist composition with intentional empty space (ma). Confident single-stroke brushwork — each stroke deliberate and unrepeated. Bamboo brush texture visible in dry-brush passages. Subtle ink bleeding into wet paper. Zen aesthetic — simplicity, asymmetry, natural flow. Seasonal nature themes. Seal stamp in red ink. Meditative, elegant, effortless mastery.`,
  },
  {
    name: 'S12 - 3D Animation / Pixar',
    type: 'style' as const,
    isSystem: true,
    tags: ['3d', 'pixar', 'animation'],
    isPublic: false,
    notes: 'Pixar/Disney 3D animation style. Family-friendly, polished.',
    prompt: `Pixar/Disney 3D animation style. Clean subsurface scattering on skin with warm glow. Large expressive eyes with detailed iris reflections. Stylized proportions — slightly oversized heads, expressive hands. Smooth plastic-like surfaces with subtle texture. Volumetric studio lighting — warm key light, cool fill, subtle rim. Rich saturated color palette. Hair rendered as soft clumps, not individual strands. Clean, family-friendly aesthetic. Professional render quality with ambient occlusion and global illumination.`,
  },
  {
    name: 'S13 - Photorealistic Studio',
    type: 'style' as const,
    isSystem: true,
    tags: ['photorealistic', 'studio', 'professional'],
    isPublic: false,
    notes: 'Clean professional studio photography. Product and portrait use.',
    prompt: `Professional studio photography. Shot on medium format Hasselblad with 80mm lens. Clean white or grey seamless backdrop. Three-point lighting — key, fill, and hair light. Crisp focus with shallow depth of field. Natural skin texture with pores visible. Accurate color reproduction — no heavy grading. Clean catchlights in eyes. Soft shadows with gentle falloff. Magazine-quality retouching — blemish removal but preserving texture. Color-accurate white balance. Commercial photography standard.`,
  },
  {
    name: 'S14 - Cyberpunk / Neon',
    type: 'style' as const,
    isSystem: true,
    tags: ['cyberpunk', 'neon', 'sci-fi'],
    isPublic: false,
    notes: 'Futuristic cyberpunk with neon lighting. Blade Runner inspired.',
    prompt: `Cyberpunk neon aesthetic. Rain-soaked streets reflecting pink, blue, and purple neon signs. Dense urban environment with holographic advertisements. Atmospheric haze and volumetric fog catching colored light. High contrast between deep shadows and vibrant neon highlights. Chrome and glass surfaces with complex reflections. Blade Runner 2049 inspired color palette — orange, teal, magenta. Lens flare from neon sources. Gritty dystopian atmosphere with high-tech elements. Night scene with artificial lighting only.`,
  },
  {
    name: 'S15 - Golden Hour / Magic Hour',
    type: 'style' as const,
    isSystem: true,
    tags: ['golden-hour', 'sunset', 'warm'],
    isPublic: false,
    notes: 'Warm sunset/sunrise golden hour lighting. Universal style modifier.',
    prompt: `Golden hour photography. Warm directional sunlight at 15-degree angle, casting long dramatic shadows. Rich amber and honey tones flooding the scene. Backlit subjects with glowing rim light and lens flare. Soft diffused light with no harsh shadows on faces. Warm color temperature (3200K). Sun-kissed skin tones. Atmospheric haze creating depth and dimension. Light rays visible through trees or windows. Everything bathed in warm golden glow. Magical, romantic, ethereal quality.`,
  },
  {
    name: 'S16 - Dark Moody / Low Key',
    type: 'style' as const,
    isSystem: true,
    tags: ['dark', 'moody', 'low-key'],
    isPublic: false,
    notes: 'Dark dramatic low-key lighting. Intense, mysterious atmosphere.',
    prompt: `Low-key dramatic lighting. Predominantly dark with selective illumination revealing only key elements. Single hard light source creating deep shadows. Chiaroscuro contrast — near-black shadows, bright focused highlights. Matte black negative space dominating the frame. Smoke or atmospheric haze catching the light beam. Cool blue or warm amber accent light. Minimal fill light — shadows are deep and pure. Mysterious, intense, theatrical atmosphere. Subjects emerging from darkness.`,
  },
  // ── Camera Medium Presets (for realistic AI video) ──────────────────
  {
    name: 'S17 - VHS Camcorder',
    type: 'style' as const,
    isSystem: true,
    tags: ['vhs', 'retro', 'camcorder', 'camera-medium'],
    isPublic: false,
    notes: 'Mimics 1990s home video. Adds authentic imperfections that trick viewers into thinking footage is real.',
    prompt: `VHS camcorder footage from the 1990s. Analog video artifacts — scan lines, tracking noise, slight color bleed between channels. Warm oversaturated colors shifting toward red and yellow. Soft focus with slight blur. Interlacing artifacts on motion. Low resolution with visible noise. Date/time stamp overlay in bottom corner. Auto-exposure adjustments causing brightness shifts. Slight barrel distortion from cheap lens. Home video feel — raw, unpolished, authentic.`,
  },
  {
    name: 'S18 - Smartphone Video',
    type: 'style' as const,
    isSystem: true,
    tags: ['smartphone', 'iphone', 'mobile', 'camera-medium'],
    isPublic: false,
    notes: 'Modern iPhone/smartphone look. Perfect for UGC and social media content.',
    prompt: `Smartphone video shot on iPhone. Slightly shaky handheld movement with digital stabilization corrections. Natural auto-exposure and auto-white-balance shifts. Vertical or horizontal framing. High dynamic range with slightly over-processed HDR look. Natural compression artifacts. Tap-to-focus with occasional focus hunting. Built-in lens characteristics — wide angle slight distortion, no optical zoom. Natural ambient lighting — no professional lights. Casual, spontaneous, authentic social media quality.`,
  },
  {
    name: 'S19 - Webcam Footage',
    type: 'style' as const,
    isSystem: true,
    tags: ['webcam', 'stream', 'video-call', 'camera-medium'],
    isPublic: false,
    notes: 'Webcam/video call aesthetic. Great for interview or talking-head content.',
    prompt: `Webcam footage, 720p resolution. Fixed camera angle, slightly above eye level. Flat, unflattering indoor lighting from overhead fluorescents or desk lamp. Slight motion blur at 30fps. Auto-exposure creating washed-out skin tones. Compression artifacts especially in dark areas. Narrow depth of field from small sensor. Slight lag and frame drops. Background slightly out of focus. Ring light reflection in eyes optional. Video call aesthetic — zoom meeting, YouTube vlog, live stream quality.`,
  },
  {
    name: 'S20 - DSLR Handheld',
    type: 'style' as const,
    isSystem: true,
    tags: ['dslr', 'handheld', 'documentary', 'camera-medium'],
    isPublic: false,
    notes: 'Professional DSLR with handheld movement. Documentary/indie film look.',
    prompt: `DSLR handheld footage. Shallow depth of field with beautiful natural bokeh from fast 50mm lens. Subtle organic camera shake — professional but not stabilized. Accurate color reproduction with slight warmth. Full-frame sensor look with clean high-ISO performance. Natural rack focus between subjects. Slight breathing of the lens during focus pulls. Motion cadence of 24fps for cinematic feel. Available light photography — no artificial lighting rigs. Documentary style, intimate, observational.`,
  },
  {
    name: 'S21 - Surveillance CCTV',
    type: 'style' as const,
    isSystem: true,
    tags: ['cctv', 'surveillance', 'security', 'camera-medium'],
    isPublic: false,
    notes: 'Security camera aesthetic. Great for thriller/mystery scenes.',
    prompt: `Surveillance CCTV security camera footage. Wide-angle fisheye lens distortion. Fixed overhead or corner-mounted camera position. Low resolution with heavy compression artifacts. Harsh infrared or fluorescent lighting. Timestamp and camera ID overlay text. Monochrome green-tinted night vision or washed-out daytime colors. Motion detection artifacts. Frame rate drops creating slight stutter. No audio. Clinical, voyeuristic, unsettling perspective. Found footage aesthetic.`,
  },
  {
    name: 'S22 - 35mm Film Stock',
    type: 'style' as const,
    isSystem: true,
    tags: ['35mm', 'film', 'analog', 'camera-medium'],
    isPublic: false,
    notes: 'Authentic 35mm film look. Organic texture that makes AI video feel real.',
    prompt: `Shot on 35mm film stock. Organic film grain with natural density variation — heavier in shadows, lighter in highlights. Kodak Vision3 500T color science — warm skin tones, rich shadows, subtle halation around bright lights. Natural lens flare from anamorphic glass. Slight gate weave and frame jitter. Color dye layers creating natural cross-contamination between channels. Highlight rolloff that blooms naturally instead of clipping digitally. Mechanical shutter creating natural motion blur at 180-degree angle. The unmistakable organic texture of real celluloid.`,
  },
];

const PromptLibrary = ({ onSelectPrompt, isOpen, onClose, userCompanyId }: PromptLibraryProps) => {
  // Show the current companyId for debugging
  console.log('🏢 PromptLibrary - Current companyId:', userCompanyId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('usage');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResettingDefaults, setIsResettingDefaults] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Prompt | null>(null);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'personal' | 'system'>('personal');
  // Fetch templates from Convex
  const userTemplates = useQuery(api.promptTemplates.getByCompany, { 
    companyId: userCompanyId 
  });
  const publicTemplates = useQuery(api.promptTemplates.getPublicTemplates, {});

  // Mutations
  const createTemplate = useMutation(api.promptTemplates.create);
  const updateTemplate = useMutation(api.promptTemplates.update);
  const deleteTemplate = useMutation(api.promptTemplates.remove);
  const incrementUsage = useMutation(api.promptTemplates.incrementUsage);
  const resetDefaultTemplates = useMutation(api.promptTemplates.resetDefaults);

  // Auto-create default prompts if none exist for this company
  useEffect(() => {
    if (userCompanyId && userTemplates && userTemplates.length === 0 && publicTemplates && publicTemplates.length === 0) {
      console.log('No prompts found for company, creating default prompts...');
      resetDefaultTemplates({
        companyId: userCompanyId,
        prompts: DEFAULT_PROMPT_TEMPLATES,
      }).catch(error => {
        console.error('Failed to create default prompts:', error);
      });
    }
  }, [userCompanyId, userTemplates, publicTemplates, resetDefaultTemplates]);

  const allTemplates = useMemo(() => {
    const mergedTemplates = [...(userTemplates || []), ...(publicTemplates || [])];
    return Array.from(new Map(mergedTemplates.map((template) => [template._id, template])).values());
  }, [publicTemplates, userTemplates]);

  // Filter and sort templates
  const filteredTemplates = allTemplates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template as any).tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => (template as any).tags?.includes(tag));
      const matchesSource = sourceFilter === 'all' ? true :
        sourceFilter === 'system' ? (template as any).isSystem === true :
        (template as any).isSystem !== true;
      return matchesSearch && matchesCategory && matchesTags && matchesSource;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'usage': return b.usageCount - a.usageCount;
        default: return 0;
      }
    });

  // Get unique tags from current category for tag filter pills
  const availableTags = [...new Set(
    filteredTemplates.flatMap(t => (t as any).tags || [])
  )].sort();

  // Paginated templates
  const paginatedTemplates = filteredTemplates.slice(0, displayedCount);
  const hasMore = filteredTemplates.length > displayedCount;

  // Reset displayedCount when filters change
  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedTags, sortBy, sourceFilter]);

  const handleSelectPrompt = async (prompt: string, templateId: string) => {
    await incrementUsage({ id: templateId as any });
    onSelectPrompt(prompt);
    onClose();
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      await createTemplate({
        ...templateData,
        type: templateData.type || 'other',
        companyId: userCompanyId
      });
      setIsCreateModalOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: Prompt) => {
    try {
      await createTemplate({
        name: `${template.name} Copy`,
        prompt: template.prompt,
        type: template.type,
        notes: template.notes,
        companyId: userCompanyId,
        isPublic: false,
      });
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleUpdateTemplate = async (templateData: any) => {
    try {
      await updateTemplate({
        id: editingTemplate!._id as any,
        ...templateData
      });
      setIsCreateModalOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate({ id: templateId as any });
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleResetDefaultPrompts = async () => {
    if (!userCompanyId) return;
    if (!confirm('Reset the default prompts? Existing prompts with the same default names will be replaced.')) {
      return;
    }

    setIsResettingDefaults(true);
    try {
      await resetDefaultTemplates({
        companyId: userCompanyId,
        prompts: DEFAULT_PROMPT_TEMPLATES,
      });
    } catch (error) {
      console.error('Failed to reset default prompts:', error);
    } finally {
      setIsResettingDefaults(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <div className="fixed right-0 top-0 h-full w-full max-w-4xl overflow-hidden border-l border-white/10 bg-[#141414] shadow-2xl flex flex-col">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <h2 className="text-2xl font-semibold text-white">Prompt Library</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-b border-white/10 p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-white/10 bg-[#1A1A1A] px-4 py-2 text-sm text-gray-200 focus:border-emerald-500/40 focus:outline-none"
              >
                <option value="name">Name (A-Z)</option>
                <option value="usage">Most Used</option>
              </select>
            </div>

            {/* Source filter: Personal / System / All */}
            <div className="flex gap-1 mb-3">
              {(['personal', 'system', 'all'] as const).map(source => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sourceFilter === source
                      ? source === 'system'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  {source === 'personal' ? 'My Prompts' : source === 'system' ? 'System' : 'All'}
                </button>
              ))}
            </div>

            {/* Category filter tabs */}
            <div className="flex gap-1 flex-wrap mb-4">
              {PROMPT_CATEGORIES.map((cat) => {
                const count = cat.key === 'all'
                  ? allTemplates.length
                  : allTemplates.filter(t => t.type === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            {/* Tag filter pills */}
            {availableTags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-3">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    )}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/8 hover:text-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-2 py-1 rounded-md text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {paginatedTemplates.length} of {filteredTemplates.length} prompts
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-white/5 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#1A1A1A] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded p-2 transition-colors ${viewMode === 'list' ? 'bg-[#1A1A1A] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={handleResetDefaultPrompts}
                  disabled={isResettingDefaults}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isResettingDefaults ? 'animate-spin' : ''}`} />
                  {isResettingDefaults ? 'Resetting...' : 'Reset Prompt'}
                </button>
                
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Prompt
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-24">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTemplates.map(template => (
                  <PromptCard
                    key={template._id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={() => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTemplates.map(template => (
                  <PromptListItem
                    key={template._id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={() => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                  />
                ))}
              </div>
            )}
            
            {/* Load More button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setDisplayedCount(prev => prev + ITEMS_PER_PAGE)}
                  className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Load More ({filteredTemplates.length - displayedCount} remaining)
                </button>
              </div>
            )}

            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Search className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">No prompts found</h3>
                <p className="text-gray-400">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <PromptEditorModal
        template={editingTemplate}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
      />
    </>
  );
};

// Prompt Card Component
const PromptCard = ({ template, onSelect, onEdit, onDelete, onDuplicate }: any) => {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 transition-colors hover:border-white/20 hover:bg-[#202020]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-white">{template.name}</h3>
          <div className="flex items-center gap-2">
            {template.isPublic && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                Public
              </span>
            )}
          </div>
        </div>
        <button aria-label="Favorite prompt" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white">
          <Star className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="line-clamp-3 text-sm text-gray-300">{template.prompt}</p>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {template.usageCount} uses
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm text-white transition-colors hover:bg-emerald-600"
        >
          Use Prompt
        </button>
        <button
          onClick={onDuplicate}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Duplicate prompt"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Edit prompt"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/10"
          title="Delete prompt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Prompt List Item Component
const PromptListItem = ({ template, onSelect, onEdit, onDelete, onDuplicate }: any) => {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 transition-colors hover:border-white/20 hover:bg-[#202020]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-white">{template.name}</h3>
          <div className="flex items-center gap-2">
            {template.isPublic && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                Public
              </span>
            )}
          </div>
        </div>
        <button aria-label="Favorite prompt" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white">
          <Star className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="line-clamp-3 text-sm text-gray-300">{template.prompt}</p>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {template.usageCount} uses
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm text-white transition-colors hover:bg-emerald-600"
        >
          Use Prompt
        </button>
        <button
          onClick={onDuplicate}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Duplicate prompt"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Edit prompt"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/10"
          title="Delete prompt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Prompt Editor Modal Component
const PromptEditorModal = ({ template, isOpen, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'other',
    prompt: template?.prompt || '',
    notes: template?.notes || '',
    isPublic: template?.isPublic || false
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: template?.name || '',
      type: template?.type || 'other',
      prompt: template?.prompt || '',
      notes: template?.notes || '',
      isPublic: template?.isPublic || false,
    });
  }, [isOpen, template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: template?._id
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Edit Prompt' : 'Create New Prompt'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Prompt Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
              placeholder="Enter a descriptive name..."
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Category
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white focus:border-emerald-500/40 focus:outline-none"
            >
              <option value="character">Character</option>
              <option value="environment">Environment</option>
              <option value="prop">Prop</option>
              <option value="style">Style</option>
              <option value="camera">Camera</option>
              <option value="action">Action</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Prompt Text
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
              rows={6}
              placeholder="Enter your prompt text..."
              required
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formData.prompt.length} characters
              </span>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Notes <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
              rows={2}
              placeholder="Internal notes about when/how to use this prompt..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Make Public
              </label>
              <p className="text-xs text-gray-500">
                Other users can see and use this prompt
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle public prompt visibility"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isPublic ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/5 px-4 py-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
            >
              <Save className="w-4 h-4" />
              {template ? 'Update' : 'Create'} Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptLibrary;
