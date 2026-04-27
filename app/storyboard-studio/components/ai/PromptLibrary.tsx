"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Edit, Trash2, Copy, Star, Grid, List, X, Zap, Clock, Save, Eye, RotateCcw } from 'lucide-react';

interface Prompt {
  _id: string;
  name: string;
  type: 'character' | 'environment' | 'prop' | 'design' | 'camera' | 'action' | 'video' | 'other' | 'notes';
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
  { key: 'camera', label: 'Camera' },
  { key: 'action', label: 'Action' },
  { key: 'video', label: 'Video' },
  { key: 'notes', label: 'Notes' },
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
    name: 'C04 - Ultra-Realistic Robot Identity Sheet v4.3 (Full-Body Enforced)',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'robot', 'mecha'],
    isPublic: false,
    notes: 'Use @image1 as robot reference. Compact: Single robot only, no duplicates. All main views must be FULL BODY (highest point to feet, no cropping). Back view = same robot rotated 180°. 2/3 main views: front, back, left 90°, right 90°, 3/4 (all full body). 1/3 detail panels: cockpit, armor, hydraulics, weapons, object (horizontal if long). Ultra-realistic (metal wear, scratches, dents, glass reflections, paint chipping). Clean layout, real photography. No CGI, no cartoon.',
    prompt: `# Ultra-Realistic Robot Identity Sheet v4.3 (Full-Body Enforced)

Create a photorealistic robot identity sheet based strictly on the provided reference image. The result must look like a real professional studio identity sheet, with a clean, organized layout, ultra-realistic rendering, and clear separation between full-body views and detail panels.

CRITICAL RULE — SINGLE SUBJECT ONLY:
- The identity sheet must contain ONLY ONE robot
- All views must represent the SAME robot
- No duplicated robots
- Back view = same robot rotated 180°, NOT a second robot
- Must match armor, colors, cockpit, weapons, and proportions exactly as shown in the reference image

Page Layout (STRICT):

Section A — Main Views (2/3 area):
Display FULL-BODY views of the SAME robot.

Full-Body Requirement (MANDATORY):
Each view must show the entire robot from highest point to feet:
- highest point (head OR glass cockpit) fully visible (no cropping)
- feet fully visible (no cropping)
- full silhouette clearly defined
- no zoomed-in, half-body, or portrait framing
The robot must fit naturally within frame with proper margins, like a military mecha specification sheet.

Required Views:
1. Front View (full body, facing camera)
2. Left Profile (full body, 90° side view)
3. Right Profile (full body, 90° side view)
4. Back View (full body, 180° rear view)
5. 3/4 View (full body, ~45° angle)

Layout Rules: All views must be same scale, aligned and evenly spaced, consistently framed. Clean grid layout, no overlap, consistent lighting across all views.

Section B — Detail Panels (1/3 area):
Top Row (2 panels): Cockpit detail, Pilot or interior detail (if visible).
Middle Row: Armor texture detail, Hydraulic/joint detail, Primary weapon detail, Secondary weapon or shield detail.
Bottom Row (Adaptive Object Panel): Wide horizontal panel for long objects (e.g. cannon, machine gun, sword, or ammo belt) — must be horizontal and simplified.

Angle Accuracy Rules:
- Left/Right = true 90° profiles
- Back = full 180° rotation
- Front = direct
- 3/4 = ~45°

Identity Consistency:
- Same robot, same armor, same colors
- Same weapons and equipment
- Same cockpit/head design

Ultra-Realistic Detail:
- metal wear, scratches, dents, imperfections
- realistic glass reflections (if cockpit present)
- realistic paint chipping and material behavior
- hydraulic fluid stains, carbon fiber or metal weave
- fabric texture if pilot visible

Photography Style:
- studio lighting (soft key + rim light)
- natural shadows
- realistic exposure
- subtle depth of field
Must look like real photography of a physical robot or mecha model.

Strict Negative Constraints — Do NOT produce:
- cropped body (must be full body)
- zoomed-in views in main section
- multiple robots
- incorrect back view
- cartoon / anime / CGI style
- smooth or plastic-looking metal

Output: A single identity sheet image containing 2/3 area full-body multi-angle views, 1/3 area structured detail panels. All views must be complete, consistent, and ultra-realistic, like a professional military mecha specification sheet.`,
  },
  {
    name: 'V01 - Kling 3.0 Motion Character (Arc Shot)',
    type: 'video' as const,
    isSystem: true,
    tags: ['kling', 'motion', 'arc', 'character'],
    isPublic: false,
    notes: 'Kling 3.0 Motion Control mode. Upload character image + motion video reference. Camera: smooth arc orbit around character. Maintains identity consistency with natural body movement.',
    prompt: `The character stands in a natural pose, weight on one leg, relaxed and present. Camera performs a slow smooth arc orbit around the character at eye level — moving from front 3/4 angle around to the side profile, capturing the full silhouette and clothing detail. The character shifts weight naturally, turns their head slightly to follow the camera, blinks, breathes. Subtle environmental motion: hair or fabric moving gently in a light breeze. Consistent identity throughout — same face, same proportions, same outfit. No distortion, no morphing, no unnatural limb positions. Soft key light from the front with a warm rim light from behind, creating depth and separation from the background. Smooth continuous motion, cinematic quality, natural human movement.`,
  },
  {
    name: 'V02a - Property Tour: Exterior & Arrival (Pedestal Down + Dolly)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'pedestal', 'dolly'],
    isPublic: false,
    notes: 'Showcase mode. Frame 1 of property tour. Presenter = agent, Subject = facade, Scene = street. Camera: pedestal down from aerial establishing to ground-level dolly follow as agent walks to front door.',
    prompt: `Camera begins at drone height showing @Subject1 the property facade and @Scene1 the tree-lined neighborhood from above, then pedestals down smoothly to eye level where @Presenter1 stands on the curb. As the camera reaches her, she smiles and gestures toward the property, then turns and walks up the front path. Camera transitions into a steady dolly follow behind her as she approaches the front door. Golden hour warm side-lighting sculpts the facade. Manicured lawn, architectural lines, and welcoming entrance visible throughout the descent. Single continuous pedestal-to-dolly shot, professional real estate cinematography.`,
  },
  {
    name: 'V02b - Property Tour: Entrance & Living Room (Dolly Through)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'dolly'],
    isPublic: false,
    notes: 'Showcase mode. Frame 2. Presenter = agent, Subject = living room, Scene = foyer. Camera: dolly forward through doorway into the living space reveal.',
    prompt: `@Presenter1 pushes open the front door. Camera dollies forward from behind her shoulder, crossing the threshold into @Scene1 the bright entrance foyer. She sweeps her arm toward @Subject1 the spacious open-plan living room as the camera continues its slow dolly forward into the space — revealing high ceilings, large windows flooding the room with natural light, premium hardwood flooring. She walks alongside the camera, running her hand along the feature wall, then turns to face the lens with a warm, inviting expression. Lighting transitions from exterior daylight to warm interior ambient as the camera crosses the doorway. Single continuous dolly-through, gimbal-smooth, luxury property reveal.`,
  },
  {
    name: 'V02c - Property Tour: Kitchen & Dining (Truck + Pan)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'truck', 'pan'],
    isPublic: false,
    notes: 'Showcase mode. Frame 3. Presenter = agent, Subject1 = kitchen, Subject2 = dining area. Camera: lateral truck along the kitchen island, panning to reveal the dining area.',
    prompt: `Camera trucks laterally along @Subject1 the marble kitchen island as @Presenter1 walks alongside it, running her fingertips across the countertop. She pauses at the appliances and the camera pans smoothly past her to reveal @Subject2 the adjacent dining area with floor-to-ceiling windows overlooking the garden — natural light flooding the space. She steps into the pan's frame at the island, gesturing toward the entertaining layout. Warm kitchen lighting from overhead pendants mixing with natural window light. Single continuous truck-to-pan, smooth and unhurried, professional property cinematography.`,
  },
  {
    name: 'V02d - Property Tour: Master Bedroom (Dolly Through + Pan)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'dolly', 'pan'],
    isPublic: false,
    notes: 'Showcase mode. Frame 4. Presenter = agent, Subject1 = bedroom, Subject2 = wardrobe/ensuite. Camera: dolly through doorway into bedroom, pan to reveal wardrobe and ensuite.',
    prompt: `@Presenter1 opens the door to @Subject1 the master bedroom. Camera dollies forward through the doorway as morning light streams through sheer curtains, revealing the spacious bed, designer lighting fixtures, and peaceful atmosphere. She steps inside and the camera pans smoothly to follow her toward @Subject2 the walk-in wardrobe — she slides open the doors revealing the generous storage space. The pan continues to the ensuite entrance, catching a glimpse of the rainfall shower and freestanding bathtub. Soft diffused morning light throughout, warm linen tones. Single continuous dolly-through-and-pan, slow cinematic reveal, luxury property aesthetic.`,
  },
  {
    name: 'V02e - Property Tour: Children Bedroom (Dolly + Tilt Down)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'dolly', 'tilt'],
    isPublic: false,
    notes: 'Showcase mode. Frame 5. Presenter = agent, Subject1 = first child bedroom, Subject2 = second bedroom. Camera: dolly into room with gentle tilt down to show scale.',
    prompt: `@Presenter1 opens the door to @Subject1 a bright children's bedroom. Camera dollies forward into the room, with a gentle tilt down from the ceiling height showing the generous space — large window flooding natural light, built-in storage shelving, cheerful colour palette. She gestures warmly at the room's features. Camera continues its dolly through the connecting doorway to @Subject2 the second bedroom, equally spacious with a different personality. She emphasizes the premium finish consistent throughout. Warm natural daylight, family-friendly atmosphere, gentle unhurried camera movement. Single continuous dolly-through connecting both rooms.`,
  },
  {
    name: 'V02f - Property Tour: Bathroom (Slow Zoom In on Details)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'zoom'],
    isPublic: false,
    notes: 'Showcase mode. Frame 6. Presenter = agent, Subject = bathroom. Camera: slow zoom in from wide to tight detail — floor-to-ceiling tiles, fixtures, finishes.',
    prompt: `Camera starts on a wide shot of @Subject1 the main bathroom as @Presenter1 steps into frame. She gestures across the space — floor-to-ceiling tiles, frameless glass shower, floating vanity with dual basins. The camera begins a slow zoom in, tightening from the full room to the detail level — brushed nickel fixtures, stone benchtop texture, recessed lighting casting a spa-like glow. She turns on the tap briefly, water catching the light, showing the quality fittings. The zoom settles on the fixture detail as she looks at the camera with an appreciative nod. Clean bright bathroom lighting with warm fill, single continuous zoom shot from context to craftsmanship.`,
  },
  {
    name: 'V02g - Property Tour: Backyard & Garden (Dolly Through Door)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'dolly'],
    isPublic: false,
    notes: 'Showcase mode. Frame 7. Presenter = agent, Subject = backyard/pool, Scene = outdoor area. Camera: dolly through glass door from interior to exterior reveal.',
    prompt: `@Presenter1 slides open the glass doors. Camera dollies forward from the interior through the doorway and into @Subject1 the private backyard — the covered patio, manicured lawn, and mature landscaping reveal as the camera crosses the threshold. Lighting transitions dramatically from warm interior to bright natural daylight. She walks ahead into @Scene1 the entertainment deck, gesturing at the barbecue area and outdoor dining. Camera continues its slow dolly forward, taking in the full outdoor space. She opens her arms at the garden's edge, presenting the private oasis. Wide-angle lens emphasising the garden depth. Single continuous dolly-through from inside to outside, the signature property tour reveal shot.`,
  },
  {
    name: 'V02h - Property Tour: Closing & CTA (Zoom Out + Pedestal Up)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'real-estate', 'property-tour', 'zoom', 'pedestal'],
    isPublic: false,
    notes: 'Showcase mode. Frame 8 (final). Presenter = agent, Subject = property exterior, Scene = street. Camera: medium close-up of agent delivering CTA, then zoom out + pedestal up to reveal full property in golden light.',
    prompt: `Camera holds a medium close-up on @Presenter1 as she stands in front of @Subject1 the property exterior in @Scene1 the neighborhood. She faces the camera directly, speaking with confidence and warmth — summarizing key highlights. She gestures toward the home one final time with a genuine smile. The camera begins a slow zoom out combined with a gentle pedestal up, pulling back and rising to reveal the full property and street setting in warm golden hour light. Her figure becomes small against the elegant facade. The shot completes as a wide establishing view — the same framing as the opening but now bathed in sunset warmth. Bookend symmetry with Frame 1. Professional closing, warm confident delivery.`,
  },
  {
    name: 'V05a - Car Tour: First Impression (Arc Shot 180°)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'arc'],
    isPublic: false,
    notes: 'Showcase mode. Frame 1. Presenter = host, Subject = car exterior, Scene = showroom/location. Camera: 180° arc orbit around car with presenter, the hero reveal.',
    prompt: `@Presenter1 stands beside @Subject1 the car in @Scene1 a sleek showroom with dramatic spotlighting, one hand resting on the roof. Camera performs a slow 180-degree arc orbit around the vehicle at hip height — starting from the front 3/4, sweeping past the presenter and along the side profile, capturing body lines, paint reflections, and wheel design in a single continuous circular movement. She traces her fingers along the fender as the camera passes, crouches briefly to show the low aggressive stance. The arc reveals the full car from every angle without cutting. Dramatic directional lighting creates specular highlights that travel across the paint surface as the camera orbits. Single continuous arc shot, cinematic automotive reveal, slow and deliberate.`,
  },
  {
    name: 'V05b - Car Tour: Exterior Walkaround (Truck Shot)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'truck'],
    isPublic: false,
    notes: 'Showcase mode. Frame 2. Presenter = host, Subject1 = front design, Subject2 = rear. Camera: lateral truck alongside presenter as she walks the car length, front to rear.',
    prompt: `Camera trucks laterally at low angle alongside @Presenter1 as she walks the length of the car from front to rear. She begins crouching at @Subject1 the front — LED headlight signature, sculpted hood lines, air intake design illuminated by dramatic side-lighting. She stands and runs her hand along the side profile as the camera tracks smoothly with her at the same pace. She reaches @Subject2 the rear, highlighting tail lights, exhaust tips, spoiler, and badge. Her fingertip traces the brand emblem. Specular highlights travel across chrome and paint as the camera's angle shifts during the truck. Single continuous lateral truck from front to rear, low camera height emphasising the car's presence, premium automotive commercial lighting.`,
  },
  {
    name: 'V05c - Car Tour: Interior & Cockpit (Dolly Through Door)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'dolly'],
    isPublic: false,
    notes: 'Showcase mode. Frame 3. Presenter = host, Subject1 = interior, Subject2 = dashboard. Camera: dolly from exterior through open door into cabin.',
    prompt: `@Presenter1 opens the driver door with a smooth pull. Camera dollies forward from outside through the open door into @Subject1 the premium leather interior — quilted stitching, contrast piping, and aluminium trim revealed as the lens crosses the threshold. She slides into the driver seat. The camera continues its dolly deeper into the cabin, settling on @Subject2 the digital dashboard, floating infotainment screen, and ambient lighting strip. Her hand sweeps across the controls, fingertips tracing the gear selector and steering wheel. Lighting transitions from bright exterior to warm amber cabin ambience as the camera enters the car. Single continuous dolly-through, interior automotive cinematography, shallow depth of field on material details.`,
  },
  {
    name: 'V05d - Car Tour: Engine Bay (Dolly + Tilt Down)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'dolly', 'tilt'],
    isPublic: false,
    notes: 'Showcase mode. Frame 4. Presenter = host, Subject = engine bay. Camera: continuous dolly forward past presenter shoulder, tilting down into engine bay detail. One unbroken portrait-to-mechanical shot.',
    prompt: `@Presenter1 lifts the hood to reveal @Subject1 the engine bay. Camera begins on her face — the reveal reflected in her expression — then dollies forward slowly past her shoulder while tilting down in one continuous movement, descending into the engine bay. The dolly continues deeper, gliding over engine cover branding, across carbon fibre intake, settling into a tight close-up of the engineering centrepiece. She rests one hand on the strut tower brace. Dramatic side-lighting sculpts every component in shadow and highlight. Single unbroken dolly-tilt from portrait to mechanical macro detail, industrial automotive cinematography, sharp focus throughout.`,
  },
  {
    name: 'V05e - Car Tour: Driving Experience (Static Cockpit Rig)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'static', 'cockpit'],
    isPublic: false,
    notes: 'Showcase mode. Frame 5. Presenter = driver, Subject = steering/controls, Scene = scenic road. Camera: locked dashboard rig — static interior with moving landscape outside.',
    prompt: `Camera locked on a dashboard rig inside the cabin holding a steady cockpit-perspective shot. @Presenter1 sits in the driver seat on @Scene1 a scenic mountain road, gripping @Subject1 the steering wheel. She guides the car through a long sweeping curve — hands making a smooth correction, eyes tracking the road, a relaxed smile of genuine driving pleasure. The mountain landscape scrolls continuously past the windscreen and side windows, creating parallax depth. Wind from the cracked window moves her hair gently. Golden hour sun streams through the windscreen, flaring softly. One continuous static interior shot — the stillness of the locked camera contrasts with the moving world outside. Cinematic warm cabin lighting, driver and landscape in frame together.`,
  },
  {
    name: 'V05f - Car Tour: Performance (Low-Angle Tracking Shot)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'tracking', 'low-angle'],
    isPublic: false,
    notes: 'Showcase mode. Frame 6. Presenter = driver, Subject = car in action, Scene = track/road. Camera: low-angle lateral tracking shot following car through a bend.',
    prompt: `Single low-angle tracking shot following @Subject1 the car as @Presenter1 pushes it hard through a sweeping curve on @Scene1 an open track or coastal road. Camera holds at knee height, trucking laterally with the car's momentum — tyres gripping asphalt, body rolling under lateral load, tyre smoke curling off the rear. The tracking continues smoothly as the car accelerates out of the curve and pulls away toward the horizon, the camera panning to hold the vehicle in frame. Golden hour side-light rakes across the bodywork, creating long shadows and specular highlights on the paint. One continuous fluid tracking shot, wide-angle lens emphasising speed and proximity, adrenaline automotive cinematography.`,
  },
  {
    name: 'V05g - Car Tour: Closing (Zoom Out to Hero Silhouette)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'car', 'car-tour', 'zoom', 'silhouette'],
    isPublic: false,
    notes: 'Showcase mode. Frame 7 (final). Presenter = host, Subject = car hero shot, Scene = sunset location. Camera: medium on presenter, slow zoom out to reveal car silhouetted against sunset.',
    prompt: `Camera holds a medium shot on @Presenter1 as she leans against @Subject1 the car at @Scene1 a scenic overlook. Golden sunset light reflects off the paint and her expression is relaxed, satisfied. She delivers her final verdict directly to camera — confident, personal. She taps the roof twice and steps away. The camera begins a slow zoom out, revealing the full car silhouetted against the sunset sky, growing smaller in frame until it becomes a hero-framed automotive silhouette against layers of orange and purple. The last light catches the badge. Single continuous zoom out from intimate presenter close-up to epic automotive hero shot. Warm sunset colour grading, the emotional bookend.`,
  },
  {
    name: 'V06a - Fashion Lookbook: Opening Walk (Dolly Back + Arc)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook', 'dolly', 'arc'],
    isPublic: false,
    notes: 'Showcase mode. Frame 1. Presenter = model, Subject = hero outfit, Scene = studio/location. Camera: dolly backward as model walks toward lens, transitioning to arc as she pauses.',
    prompt: `@Presenter1 wearing @Subject1 the hero outfit walks confidently toward the camera in @Scene1 a minimalist white studio with dramatic directional lighting. Camera dollies backward at her walking pace, maintaining a full-body frame from head to toe. She moves with powerful editorial energy — chin up, shoulders back. As she reaches her mark, the dolly stops and transitions into a slow arc orbit around her as she pauses with arms slightly out. The arc captures the silhouette, fabric texture, and construction from every angle. Dramatic key light shifts across the outfit as the camera orbits. Single continuous dolly-back-to-arc, high fashion editorial cinematography, clean minimalist backdrop, runway energy.`,
  },
  {
    name: 'V06b - Fashion Lookbook: Casual Daywear (Telephoto Truck)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook', 'truck', 'telephoto'],
    isPublic: false,
    notes: 'Showcase mode. Frame 2. Presenter = model, Subject = casual outfit, Scene = street/cafe. Camera: telephoto truck from across the street — compressed background bokeh, street-style candid energy.',
    prompt: `Camera trucks laterally from across the street on a telephoto lens, following @Presenter1 as she walks down @Scene1 a sun-drenched European cobblestone street wearing @Subject1 a chic casual daywear look. The long lens compresses the background into a beautiful bokeh of passing pedestrians and warm shopfronts. She walks naturally, adjusts her sunglasses, the fabric catching golden hour side-light. She pauses at a cafe — the camera holds its telephoto distance as she sits and crosses her legs, catching shoe detail, handbag placement, and fabric drape in a candid, observed style. Street-style fashion cinematography — the model is photographed, not directed. Single continuous telephoto truck, warm European colour grading.`,
  },
  {
    name: 'V06c - Fashion Lookbook: Evening Glamour (Low-Angle Tilt Up)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook', 'tilt', 'low-angle'],
    isPublic: false,
    notes: 'Showcase mode. Frame 3. Presenter = model, Subject = evening dress, Scene = upscale venue. Camera: low-angle tilt up from heels to face as model descends staircase — the classic glamour reveal.',
    prompt: `Camera holds a low angle at the base of a grand staircase in @Scene1 an opulent hotel lobby or gallery. @Presenter1 descends wearing @Subject1 an elegant evening gown. The camera tilts slowly upward from the heels on marble steps, up the flowing fabric — silk catching chandelier light, sequins sparkling — past the waist and neckline, arriving at her face as she reaches the bottom step. She pauses, the camera now at eye level, holding on her composed expression. She adjusts an earring, the gesture reflected in a nearby mirror creating a double composition. She turns and walks away from camera — the back of the dress revealed in full. Single continuous low-angle tilt-up to eye-level hold. Old Hollywood glamour lighting — warm practicals from chandeliers, cool fill from architectural windows. Luxurious, cinematic, editorial.`,
  },
  {
    name: 'V06d - Fashion Lookbook: Activewear (Arc Shot + Rim Light)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook', 'activewear', 'arc'],
    isPublic: false,
    notes: 'Showcase mode. Frame 4. Presenter = model, Subject = activewear, Scene = rooftop/urban. Camera: slow arc orbit during stretch pose, sunrise rim light behind — empowering athletic energy.',
    prompt: `@Presenter1 wearing @Subject1 a sleek activewear set stands on @Scene1 a rooftop at sunrise, pausing mid-stretch with one arm overhead. Camera performs a slow arc orbit at waist height, circling around her during the held pose — capturing the leggings, sports bra, and jacket from every angle as sunrise rim light blazes behind her silhouette. The fabric catches the warm directional light, showing mesh panel detail, reflective elements, and the body's form within the athletic cut. As the arc completes, she shifts into a powerful stance — hands on hips, facing the sun, the camera settling on her determined profile against the golden sky. Single continuous arc shot, sunrise warmth creating strong rim lighting and long shadows, empowering athletic cinematography.`,
  },
  {
    name: 'V06e - Fashion Lookbook: Closing (Dolly Forward Push-In)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'lookbook', 'dolly', 'push-in'],
    isPublic: false,
    notes: 'Showcase mode. Frame 5 (final). Presenter = model, Subject = closing look, Scene = studio. Camera: single continuous dolly forward push-in from full-body wide to face close-up.',
    prompt: `@Presenter1 wearing @Subject1 the closing look begins a slow, confident walk directly toward the camera from the far end of @Scene1 the studio. The camera holds a single low wide shot as she closes the distance — her full outfit visible, each step deliberate and unhurried. As she gets closer the frame gradually tightens, moving from full-body to mid-shot to chest-up, the camera moving smoothly forward to meet her. Just before she fills the frame she breaks into a genuine, warm smile that cuts through the editorial cool. The shot ends on a tight close-up of her face, relaxed and present. One continuous forward push with the camera, editorial confidence giving way to human warmth, soft studio lighting, the collection's identity carried in a single unbroken take.`,
  },
  {
    name: 'V07a - Fashion Haul: Try-On Reveal (Static + Jump Cut)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'tiktok', 'influencer', 'static'],
    isPublic: false,
    notes: 'UGC mode. Static locked camera, jump cut transition reveal. Presenter = influencer, Subject = outfit. TikTok before/after style.',
    prompt: `@Presenter1 stands in front of @Scene1 a clean, bright bedroom or dressing room with a full-length mirror and ring light visible. She starts in a casual oversized hoodie, holds up @Subject1 the new outfit on a hanger to show it to camera, eyes wide with excitement. Quick jump cut — she now wears the outfit, doing a confident spin. Camera captures the full look from head to toe. She adjusts the belt, smooths the fabric, checks herself in the mirror with a satisfied nod. Natural and warm lighting from the ring light creates flattering soft shadows. She does the classic TikTok "show and tell" — pointing at details, the tag, the material. Genuine excitement, relatable energy, bright airy bedroom aesthetic with soft warm tones. Shot at eye level, slightly wide to show the full outfit.`,
  },
  {
    name: 'V07b - Fashion Haul: OOTD (Static Full-Body)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'ootd', 'influencer', 'static'],
    isPublic: false,
    notes: 'UGC mode. Static full-body camera, model walks into frame and poses. Presenter = influencer, Subject = outfit, Scene = aesthetic wall.',
    prompt: `@Presenter1 walks out from behind @Scene1 a neutral beige curtain or clean white wall into frame wearing @Subject1 a carefully styled outfit. She does the viral "outfit check" walk — stepping forward confidently, camera tilted slightly upward for a flattering angle. She pauses, does a slow turn showing front, side, and back. Close-up cuts: shoes with a foot tap, bag detail, necklace layering, watch or bracelet close-up. She pairs the outfit with two accessory options, holding each up to camera for comparison. Final shot: full-body mirror selfie angle showing the complete look. Bright, even lighting with no harsh shadows. The space is Instagram-perfect — minimal clutter, soft textured backgrounds, a plant or candle adding warmth. Trendy, aspirational but achievable, the kind of content that makes viewers screenshot the outfit details.`,
  },
  {
    name: 'V07c - Fashion Haul: Outfit Orbit (180° Arc)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'tiktok', 'influencer', 'arc'],
    isPublic: false,
    notes: 'Showcase mode. Single slow 180° orbit around influencer in one outfit — captures every angle. Presenter = influencer, Subject = outfit, Scene = bright room.',
    prompt: `@Presenter1 wearing @Subject1 the hero outfit stands centred in @Scene1 a bright room with large window light flooding in from the side. The camera performs a single slow 180-degree orbit around her — starting from a three-quarter front angle, moving around her side to reveal the back of the outfit in full detail, then continuing around to arrive at the opposite three-quarter front angle. She moves naturally with the camera, shifting weight, adjusting her jacket, glancing over her shoulder mid-orbit with a playful smile. The continuous circular movement showcases every angle of the outfit — fabric texture, fit across the shoulders, silhouette from behind, styling details at the front. Bright even lighting with soft golden window undertones, flattering and shadow-free, shoppable energy in one unbroken revolving shot.`,
  },
  {
    name: 'V07d - Fashion Haul: Collection Review (Static Talking Head)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'youtube', 'influencer', 'static'],
    isPublic: false,
    notes: 'UGC mode. Static camera on bed/couch, influencer holds up and tries on items. YouTube sit-down review format. Presenter = influencer, Subject = clothing items, Scene = cosy room.',
    prompt: `@Presenter1 sits cross-legged on a bed or couch in @Scene1 a beautifully styled room with soft ambient lighting — fairy lights in the background, a neatly arranged clothing rack visible behind her. She holds up @Subject1 a folded clothing item, unfolds it toward the camera showing the fabric, the print, the details. She describes the material, touches it to show the texture. Cut to her wearing it — she stands in front of the mirror, adjusting the fit, showing how it looks tucked in versus left out. She gives an honest reaction — nodding approvingly or scrunching her nose playfully. Close-up detail shots: the stitching quality, the label, how the fabric catches light. The room has warm, cosy lighting — a mix of natural daylight and warm lamp light creating a golden, inviting atmosphere. YouTube creator aesthetic — personal, authentic, well-lit but not over-produced. The viewer feels like they are getting honest advice from a friend.`,
  },
  {
    name: 'V07e - Fashion Haul: Street Style (Telephoto + Slow-Mo)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'fashion', 'haul', 'street-style', 'influencer', 'telephoto'],
    isPublic: false,
    notes: 'Showcase mode. Telephoto from across street with compressed bokeh, slow-motion walking. Premium street-style campaign feel. Presenter = influencer, Subject = outfit, Scene = urban street.',
    prompt: `@Presenter1 steps out of a doorway onto @Scene1 a photogenic urban street — colourful shopfronts, warm brick walls, or a trendy neighbourhood with character. She wears @Subject1 a street-style outfit and walks naturally down the pavement. Camera shoots from across the street in a long telephoto compression shot creating beautiful background blur of the street life behind her. She stops at a wall, leans casually, one foot up — the classic influencer street photo pose but in motion. The wind catches her hair and jacket naturally. Cut to a slow-motion walking shot from the front, eye-level, warm afternoon sunlight creating a golden rim light on one side. Close-up of the sneakers on pavement, the bag swinging, the sunglasses reflecting the street scene. The video feels like a premium street-style campaign — effortlessly cool, natural movement, real-world environment with beautiful light. Golden hour warmth, shallow depth of field, cinematic yet authentic.`,
  },
  {
    name: 'V08 - Makeup Tutorial (Zoom In Macro + Static)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'tutorial', 'beauty', 'zoom', 'macro'],
    isPublic: false,
    notes: 'Showcase mode. Static medium with zoom-in to macro detail for application technique. Presenter = model, Subject1-3 = bare face/process/reveal, Scene = vanity.',
    prompt: `@Presenter1 sits close to the camera in front of @Scene1 a well-lit vanity station — ring light creating perfect catchlights in her eyes, warm LED strips along the mirror casting a flattering glow. She leans in and shows @Subject1 her bare, clean face — no makeup, natural skin texture visible, being vulnerable and real. She picks up a beauty blender, dips it into foundation, and begins dabbing across her cheek — camera zooms into an extreme close-up of the blending technique, the product melting into skin. Time-lapse of contour lines being drawn and blended. She builds the look layer by layer: concealer under the eyes, setting powder with a satisfying cloud of dust, @Subject2 the eye look — brushes sweeping colour across the lid, each stroke deliberate and artistic. Mascara application with the classic open-mouth expression. She pauses, examines herself in the mirror, does one final touch-up, then turns to camera for @Subject3 the full reveal — dramatic before-and-after energy. She tilts her head side to side showing the glow from every angle, runs her fingers through her hair, gives a confident knowing look. The transformation is stunning. Warm vanity lighting, macro lens detail shots intercut with medium beauty shots, ASMR-satisfying product textures.`,
  },
  {
    name: 'V09 - Cooking Recipe (Overhead + Arc Plate)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'tutorial', 'cooking', 'overhead', 'arc'],
    isPublic: false,
    notes: 'Showcase mode. Overhead for prep, eye-level for cooking drama, slow arc around final plate. Presenter = chef, Subject1-3 = ingredients/cooking/plated, Scene = kitchen.',
    prompt: `@Presenter1 stands behind a marble island in @Scene1 a bright, modern kitchen flooded with natural window light. She gestures to @Subject1 the fresh ingredients arranged in a beautiful mise en place — vibrant vegetables, herbs, spices in small bowls, raw protein on a cutting board. Overhead camera captures her hands as she chops — the knife rhythm is confident and satisfying, close-up of the blade slicing through a tomato, juice and seeds glistening. She sweeps ingredients into a hot pan — dramatic sizzle, steam billowing up, caught by the backlight from the window. She tosses the pan, flames briefly lick upward. @Subject2 the cooking process in full swing — stirring, tasting with a wooden spoon, adding a pinch of salt from height. The colours in the pan are rich and appetising. She plates with precision, using tweezers for a micro-herb garnish, a drizzle of sauce in an artistic pattern. Final reveal: @Subject3 the finished dish on a beautiful ceramic plate, camera slowly orbiting around it at table height. She steps back, wipes her hands on her apron, picks up a fork, takes a bite and closes her eyes in satisfaction. Warm kitchen tones, golden natural light, food photography angles — overhead prep shots, eye-level sizzle shots, macro texture close-ups.`,
  },
  {
    name: 'V10 - DIY Repair (Macro Hands + Dolly Push)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'tutorial', 'diy', 'macro', 'dolly'],
    isPublic: false,
    notes: 'Showcase mode. Macro close-ups on hands and tools, slow dolly push from medium to tight detail. Presenter = technician, Subject1-3 = broken/repair/fixed, Scene = workshop.',
    prompt: `@Presenter1 stands at a sturdy workbench in @Scene1 a well-organised garage workshop — pegboard wall of tools behind him, work lamp casting focused light on the bench, faint sawdust in the air. He holds up @Subject1 the broken item, rotating it to show the damage — a crack, a loose part, a worn component. He sets it down, reaches for the right tool from the wall with practised confidence. Camera follows his hands in extreme close-up as he carefully disassembles — screws turning, components separating, the satisfying click of parts coming apart. He examines @Subject2 the internal mechanism, points to the problem area for the camera, explains with a knowing nod. Detailed shots of the repair: soldering iron tip meeting contact points with a wisp of smoke, adhesive being applied with precision, a new part clicking into place. He reassembles methodically, each piece fitting back together. The moment of truth — he powers it on or tests the function. @Subject3 the repaired item works perfectly. He holds it up triumphantly, gives the camera a satisfied grin. Workshop ambient lighting with focused task lamp, macro detail shots of hands and tools, the ASMR-satisfying sounds of mechanical work.`,
  },
  {
    name: 'V11 - UGC Product Unboxing (Selfie Static)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'product'],
    isPublic: false,
    notes: 'UGC mode prompt for product unboxing. Use with Product (1-2 shots) + Influencer.',
    prompt: `@Influencer1 sits cross-legged on her bed, phone propped up selfie-style, filming herself. A branded delivery box sits on her lap — she reads the label out loud with building anticipation. She slices the tape with her finger, pulls back the flaps, pushes aside the tissue paper. She reaches in and lifts out @Product1, her face lighting up with genuine surprise — mouth drops open, she squeals and holds it up to the camera. She turns it around slowly showing every detail: the packaging, the texture, the weight in her hands. She unboxes any accessories, laying them out neatly on the bedsheets. She holds the product next to her face for scale, examines the craftsmanship close-up. She puts it down, leans back, looks at the camera and mouths "wow." Bedroom setting with warm afternoon light from a window, fairy lights in the background, messy-but-aesthetic bed setup. Smartphone vertical format, authentic unboxing energy, the kind of genuine reaction that makes viewers want to order immediately.`,
  },
  {
    name: 'V12 - UGC Skincare Review (Close-Up + Macro)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'beauty', 'product'],
    isPublic: false,
    notes: 'UGC mode for skincare/beauty product review. Use with Product + Influencer.',
    prompt: `@Influencer1 appears fresh-faced in a bathroom or vanity setup, natural morning light mixing with a soft ring light. She holds up @Product1 the skincare product close to the camera — the label fills the frame, she taps it twice for emphasis. She opens the cap, squeezes a small amount onto her fingertips — close-up of the product texture, the consistency, the colour. She dots it across her cheeks, forehead, and chin, then begins to massage it in with upward circular motions. Extreme close-up of the product absorbing into skin, the dewy glow appearing in real-time. She pats gently under her eyes, tilts her face left and right to show the even application. She touches her cheek and gives a genuine reaction — soft skin, no residue, impressed expression. Before-and-after split: one side bare skin, one side with the product applied showing the difference. She holds the product next to her glowing face, gives an honest, warm smile to camera. Bathroom natural light with soft ring light fill, macro skin texture shots, dewy-skin aesthetic, authentic and trustworthy energy.`,
  },
  {
    name: 'V13 - UGC App Review (Handheld Selfie POV)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'app', 'travel', 'testimonial'],
    isPublic: false,
    notes: 'UGC mode — person talking about an app in a real-world setting. Influencer = the person, Product = phone screen showing the app. Candid selfie-style, raw authentic feel.',
    prompt: `@Influencer1 films a candid selfie-style video in @Scene1 a busy airport terminal, bright overhead fluorescent lighting, crowds moving behind her. She looks slightly frazzled at first, glancing down at her phone. She holds up @Product1 the phone screen showing the app interface toward the camera. Her expression shifts to relieved and excited. She taps the screen a few times demonstrating the app, then looks directly into the camera with a natural, genuine smile. The footage has a raw, slightly shaky smartphone quality — vertical format, slight motion blur, real ambient airport noise feel. No professional lighting setup, just the natural overhead terminal lights creating realistic shadows under the eyes. She speaks animatedly, gesturing with one hand. Authentic UGC testimonial style, not polished, not scripted-looking — the kind of content that feels real and trustworthy.`,
  },
  {
    name: 'V14 - UGC Gym Shoes (Handheld + Low-Angle)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'fitness', 'shoes', 'product'],
    isPublic: false,
    notes: 'UGC mode — gym-goer reviewing shoes mid-workout. Influencer = the person, Product = the shoes. Raw gym footage style.',
    prompt: `@Influencer1 is in @Scene1 a busy, gritty powerlifting gym — rubber flooring, chalk dust in the air, weights clanking in the background. They are slightly sweaty, wearing a faded gym tee and shorts. Camera is handheld smartphone vertical format with slight shake for authenticity. They step back from a squat rack, the camera pans down to their feet showing @Product1 the training shoes — tapping their toe and planting their foot flat on the rubber floor. Cut to a low-angle B-roll shot from the ground: they perform a slow, heavy barbell back squat, camera focused on the shoe sole gripping the floor, the flat base stable under load. Back to selfie angle — they look directly at camera, breathing naturally between sets, genuine enthusiasm on their face. Raw gym lighting — harsh overhead fluorescents with some warm spots. No filters, no colour grading, real sweat, real iron. The kind of review that makes gym bros immediately check the link in bio.`,
  },
  {
    name: 'V15 - UGC Gym Tour (Walking Selfie + Pan)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'fitness', 'gym', 'tour'],
    isPublic: false,
    notes: 'UGC mode — person giving a casual gym tour. Influencer = the guide, Scene = gym facility areas. Works with Showcase mode too.',
    prompt: `@Influencer1 walks backward through @Scene1 the gym entrance, filming selfie-style, big smile and high energy. They gesture behind them showing the front desk and check-in area. Quick walk-through: they pan the phone to show @Subject1 the main floor — rows of equipment, people working out, motivating atmosphere. They jog over to the free weights section, pick up a dumbbell to show the quality. Walk past the cardio machines, the stretching area. They push open a door to reveal the group fitness studio, spin their phone around to show the mirrors and sound system. End at the smoothie bar or lounge area, they grab a shake and cheers the camera. The whole video has energetic walking pace, natural gym lighting mixing warm and cool zones, real members in the background creating authentic atmosphere. Smartphone vertical format, casual and inviting, the feeling of a friend showing you their favourite gym.`,
  },
  {
    name: 'V16 - UGC Building Tour (Selfie Walk-Through)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'property', 'building', 'lifestyle'],
    isPublic: false,
    notes: 'UGC mode — resident or visitor giving a casual building tour. Influencer = the person, Scene = building/condo areas. Authentic walk-through.',
    prompt: `@Influencer1 stands outside @Scene1 a modern residential building or condo complex, filming selfie-style in natural daylight. They gesture excitedly at the facade behind them, then walk through the lobby — marble floors, concierge desk, designer furniture. They step into the elevator, press the button, quick cut to the doors opening on a high floor. They walk down a bright hallway and push open the door to @Subject1 the apartment or unit — camera reveals the view through floor-to-ceiling windows. They spin the phone around showing the open kitchen, the living space, the balcony with city or garden views. They step onto the balcony, the wind catches their hair, they lean on the railing showing the panorama. Back to selfie: genuine wow expression, can barely contain their excitement. Natural lighting throughout — lobby warm, apartment bright with daylight, balcony golden hour glow. Smartphone vertical format, raw and authentic, the kind of tour that makes people DM asking for the building name.`,
  },
  {
    name: 'V17 - UGC Drink Taste Test (Static + Close-Up)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'food', 'drink', 'product'],
    isPublic: false,
    notes: 'UGC mode — person trying and reviewing a drink. Influencer = the person, Product = the drink/bottle. Casual taste-test style.',
    prompt: `@Influencer1 sits at @Scene1 a cosy cafe table or kitchen counter with warm ambient lighting. They hold up @Product1 the drink bottle or cup to the camera, rotating it to show the label and branding. They crack it open or take the lid off — close-up of the pour, the colour, the fizz or steam rising. They take the first sip, eyes closing momentarily, then open with a surprised, delighted expression. They nod enthusiastically, take another sip, then hold the drink beside their face giving a genuine thumbs up. Camera alternates between tight close-ups of the drink — the condensation on the bottle, the ice clinking, the liquid colour in the light — and medium selfie shots of their authentic reactions. Warm, inviting cafe lighting or natural kitchen window light creating a golden, cosy mood. Smartphone vertical format, no professional setup visible. The kind of content where the genuine reaction sells the product more than any scripted ad ever could.`,
  },
  {
    name: 'V18 - UGC Restaurant Visit (Overhead + Reaction)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'food', 'restaurant'],
    isPublic: false,
    notes: 'UGC mode — foodie visiting a restaurant. Influencer = the person, Subject = the dishes, Scene = restaurant.',
    prompt: `@Influencer1 walks into @Scene1 a trendy restaurant with moody ambient lighting — exposed brick, warm Edison bulbs, candles on tables. They do a quick pan showing the vibe and decor. Sitting down, the waiter places @Subject1 the first dish on the table. Close-up overhead shot: the plating, the colours, steam rising. They pick up a fork, take the first bite — eyes widen, they cover their mouth in delight, genuine foodgasm reaction. Quick montage of more dishes arriving: @Subject2 a signature cocktail being poured, @Subject3 the dessert with a dramatic presentation. Each dish gets a beauty shot followed by their authentic tasting reaction. The lighting is warm and flattering — candle glow on the face, ambient restaurant warmth creating a romantic food-content atmosphere. Smartphone filming with occasional stabilised B-roll shots of the food close-ups. The content makes the viewer immediately want to book a table.`,
  },
  {
    name: 'V19 - UGC Lip Product (Car Selfie + Natural Light)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'beauty', 'lips', 'product'],
    isPublic: false,
    notes: 'UGC mode — casual car selfie lip product review. Influencer = the person, Product = lip product. Based on the viral car-review format.',
    prompt: `@Influencer1 sits in the driver seat of her parked car, hair in a messy bun, wearing an oversized sweater. She holds up her phone filming selfie-style in vertical format, natural daylight streaming through the windshield creating soft, flattering light on her face. She casually holds up @Product1 the lip product tube between two fingers, turning it so the camera catches the brand name and shade. She uncaps it, leans into the rearview mirror, and applies it to her bottom lip first — camera catches the close-up of the colour gliding on. She presses her lips together, smacks them lightly, then turns back to camera. She pouts, tilts her chin up and down to show the finish in different light — the sheer tint, the subtle gloss, the natural berry tone. She touches her lips with a fingertip to demonstrate the texture — not sticky, hydrating. She holds the product next to her face one final time, gives an honest, slightly obsessed expression and nods slowly. Car interior with natural window light, slightly shaky handheld smartphone feel, candid and unfiltered. The authentic "I just found my new favourite product" energy that gets saved and shared.`,
  },
  {
    name: 'V20 - UGC Dentist Endorsement (Static Medium)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'dental', 'medical', 'professional', 'product'],
    isPublic: false,
    notes: 'UGC mode — dentist/doctor endorsing a dental product. Influencer = the dentist, Product = dental product, Scene = clinic. Professional authority meets approachable delivery.',
    prompt: `@Influencer1 a dentist in a clean white coat stands in @Scene1 a bright, modern dental clinic — treatment chair visible in the background, overhead dental lamp, clean white walls with a calming accent colour. She holds @Product1 the dental product at chest height, label facing camera. She speaks directly to camera with calm, professional authority but warm and approachable — not stiff or salesy. She picks up a dental model or opens the product to demonstrate how it works — squeezing the toothpaste on a brush to show the consistency, or demonstrating a whitening strip application technique. Close-up of her hands showing the product details: the active ingredients on the label, the texture, the application. She puts on gloves, picks up a dental mirror, and briefly shows her own teeth as an example of results — bright, confident smile under the clinical lighting. She removes the gloves, holds the product one more time, and gives her professional recommendation with a reassuring nod. Clean clinical lighting — bright, even, professional white with subtle warm fill to avoid looking too sterile. The combination of medical authority and genuine personal endorsement that builds trust instantly.`,
  },
  {
    name: 'V21 - UGC Dentist Demo (Static Close-Up)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'dental', 'medical', 'product'],
    isPublic: false,
    notes: 'UGC mode — dentist demonstrating a specific dental product (toothpaste, mouthwash, whitening kit). One continuous shot. Influencer = dentist, Product = dental product.',
    prompt: `@Influencer1 a male dentist in scrubs and a white coat sits on the edge of @Scene1 a dental treatment chair in his clinic, filmed at eye level in vertical smartphone format. He holds up @Product1 the dental product close to camera — the label fills the frame. He rotates it slowly, taps the key ingredient on the label with his finger. He uncaps it and squeezes a small amount onto a toothbrush or his gloved fingertip, showing the texture and consistency to camera. He points to a dental model jaw on the counter beside him, demonstrates the correct application technique — gentle circular brushing on the gum line, working the product between the teeth. He sets the model down, looks directly at camera and gives a calm, confident nod of recommendation. Bright clinical overhead lighting with a warm fill from the window to keep it approachable. The energy is a trusted professional casually sharing his go-to product — not a commercial, more like a friend who happens to be a dentist giving you honest advice.`,
  },
  {
    name: 'V22 - UGC Dentist Education (Talking Head + Model Demo)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ugc', 'dental', 'medical', 'education', 'gum-care'],
    isPublic: false,
    notes: 'UGC mode — dentist explaining how to protect gums. Educational content, no product push. Influencer = dentist, Subject = dental model for demo.',
    prompt: `@Influencer1 a dentist in a white coat sits behind his desk in @Scene1 a clean, modern dental office. He looks into camera with a warm, concerned expression — the kind of look that says "I see this problem every day." He picks up @Subject1 a dental jaw model and holds it at camera level. With a dental probe, he gently points to the gum line area, tracing where plaque builds up if not cleaned properly. He demonstrates the correct brushing angle — 45 degrees toward the gum line — moving the brush in small gentle strokes. He flips the model to show the inner gum side that most people miss. He sets down the brush and holds up three fingers, counting off the key habits: brushing technique, daily flossing, and regular check-ups. He places the model down, leans slightly forward toward camera with a reassuring expression and gives a final encouraging message. Bright, clean clinic lighting, calm and educational tone, the doctor is genuinely passionate about preventing gum disease. Smartphone vertical format, the kind of dental advice video that gets millions of views because it is clear, visual, and immediately actionable.`,
  },
  {
    name: 'V23a - Travel: Destination Arrival (Pedestal Down + Dolly)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'destination', 'pedestal', 'dolly'],
    isPublic: false,
    notes: 'Showcase mode. Presenter = travel host, Subject = landmark, Scene = destination. Camera: pedestal down from aerial into ground-level dolly follow. The "arrival reveal" hook shot.',
    prompt: `@Presenter1 steps forward into @Scene1 the destination, arms opening wide as she takes in the view. Camera begins high (pedestal down) descending smoothly from an aerial angle to eye level, revealing @Subject1 the landmark or scenic vista expanding behind her. As the camera reaches ground level, it transitions into a slow dolly forward following her as she walks toward the location. She glances back at the camera with genuine wonder. Golden hour key light from behind the landmark creates a warm rim light on her silhouette. Shallow depth of field shifts from her face to the background as the reveal completes. Single continuous shot, cinematic 24fps, warm saturated travel colour grading.`,
  },
  {
    name: 'V23b - Travel: Cultural Experience (Truck + Pan)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'culture', 'experience', 'truck', 'pan'],
    isPublic: false,
    notes: 'Showcase mode. Presenter = host, Subject = cultural activity, Scene = local setting (market/temple/workshop). Camera: lateral truck following presenter, with pans to capture details.',
    prompt: `Camera trucks laterally alongside @Presenter1 as she walks through @Scene1 a vibrant local setting — market stalls, temple courtyard, or artisan workshop. She pauses at @Subject1 a cultural activity in action, and the camera pans from her curious expression to the detail of what she is watching — hands preparing food, tools shaping craft, or a performance unfolding. She reaches out to interact — picking up an item, tasting food, her reaction genuine. The camera holds on her face for the emotional beat, then pans back to the environment. Warm ambient lighting from lanterns, bulbs, and natural sun filtering through canopy. Rich local colour palette — spices, fabrics, painted surfaces. Handheld stabilised energy, documentary intimacy. Single continuous truck-and-pan shot with natural pauses.`,
  },
  {
    name: 'V23c - Travel: Hotel & Accommodation (Dolly Through + Tilt)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'hotel', 'accommodation', 'dolly', 'tilt'],
    isPublic: false,
    notes: 'Showcase mode. Presenter = host, Subject1 = room/villa, Subject2 = the view, Scene = hotel/resort. Camera: dolly forward through doorway reveal, tilt up to the view.',
    prompt: `@Presenter1 pushes open the door to @Subject1 the hotel room or villa. Camera dollies forward from behind her shoulder, crossing the threshold into the space as it reveals — king bed with pristine linens, warm afternoon light pouring through floor-to-ceiling windows. She steps inside, runs her fingertips across the bed fabric. Camera continues its slow dolly forward toward the windows, passing her as she moves to the balcony. She opens the glass door and steps out. Camera follows through onto the terrace and tilts up to reveal @Subject2 the view — ocean, mountains, or skyline stretching to the horizon in @Scene1. She leans on the railing, wind in her hair, a blissful expression. Camera holds on the wide vista. Lighting transitions from warm interior ambient to bright natural exterior golden hour. Gimbal-smooth continuous dolly-through, luxury real estate cinematography style.`,
  },
  {
    name: 'V23d - Travel: Adventure & Activity (Truck + Zoom In)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'adventure', 'activity', 'truck', 'zoom'],
    isPublic: false,
    notes: 'Showcase mode. Presenter = host, Subject = trail/activity, Scene = natural landscape. Camera: lateral truck alongside presenter, transitioning to slow zoom in as she pauses at the viewpoint.',
    prompt: `Camera trucks laterally alongside @Presenter1 as she hikes along @Subject1 a dramatic trail in @Scene1 the vast natural landscape. She is frame-left, the epic terrain scrolling behind her — mountains, ocean, canyon, or forest canopy. Wide-angle lens exaggerates the scale between her and the environment. She walks with confident energy, glancing at the view. Midway she pauses, plants her feet, and turns to face the panorama. The camera stops trucking and begins a slow zoom in on her face as she absorbs the moment — expression shifting from exhilaration to quiet awe. Background softens into bokeh as the zoom tightens. Golden hour side-key light sculpts her profile against the landscape. Single continuous shot: truck to zoom transition, adventure travel cinematography, warm natural colour grading.`,
  },
  {
    name: 'V23e - Travel: Sunset & Closing (Arc Shot + Pedestal Up)',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'sunset', 'closing', 'arc', 'pedestal'],
    isPublic: false,
    notes: 'Showcase mode. Presenter = host, Subject = sunset vista, Scene = viewpoint location. Camera: slow arc around presenter silhouette, then pedestal up to reveal the full landscape. The emotional closing shot.',
    prompt: `@Presenter1 sits at @Scene1 a sunset viewpoint — beach blanket, cliff edge, rooftop, or boat deck. Golden hour light paints everything warm amber. Camera begins a slow arc shot circling around her silhouette against @Subject1 the sunset sky — moving from a profile angle to reveal the vast landscape and the sun sinking toward the horizon. Layers of orange, pink, and purple fill the sky. As the arc completes, the camera pedestals up smoothly, rising above her to reveal the full scope of the destination in its most beautiful moment — her small figure against the enormous landscape. She is still, reflective, at peace. Warm rim light outlines her silhouette. Lighting transitions from golden hour warmth to early blue hour cool tones during the shot. Slow, contemplative pacing. Rich sunset colour grading. The final shot that makes the viewer feel they have been on this journey.`,
  },
  // ── Lipsync Prompts ──────────────────────────────────────────────
  {
    name: 'V24 - Lipsync: Singing (Static Close-Up)',
    type: 'video' as const,
    isSystem: true,
    tags: ['lipsync', 'singing', 'music-video'],
    isPublic: false,
    notes: 'Lipsync mode. Add character image + audio file. The AI animates the character singing the provided audio.',
    prompt: `The character sings passionately, lips moving naturally in perfect sync with the audio. Expressive facial movements — eyes closing on emotional notes, subtle head tilts, natural breathing between phrases. Close-up to medium shot, soft studio lighting, shallow depth of field. The performance feels intimate and genuine.`,
  },
  {
    name: 'V25 - Lipsync: Talking Head (Static Medium)',
    type: 'video' as const,
    isSystem: true,
    tags: ['lipsync', 'talking', 'vlog'],
    isPublic: false,
    notes: 'Lipsync mode for talking head content. Character speaks naturally to camera.',
    prompt: `The character speaks directly to camera in a natural, conversational tone. Realistic lip movements matching the audio perfectly. Natural micro-expressions — eyebrow raises, slight nods, hand gestures near the face. Medium close-up framing, warm indoor lighting, slightly blurred background. Casual vlog style, authentic and engaging.`,
  },
  {
    name: 'V26 - Lipsync: Narration (Static Medium + Key Light)',
    type: 'video' as const,
    isSystem: true,
    tags: ['lipsync', 'narration', 'voiceover'],
    isPublic: false,
    notes: 'Lipsync mode for narration. Character speaks with authority, professional delivery.',
    prompt: `The character delivers a professional narration, speaking clearly with confident lip movements synced to the audio. Slight head movements and controlled expressions convey authority and warmth. Clean studio backdrop, professional lighting with soft key and rim light. The delivery is polished, measured, trustworthy — like a news anchor or documentary narrator.`,
  },
  // ── Travel & Hospitality — Single-Shot Cinematic Prompts ──────────────
  // Each prompt = ONE camera move, 5-15 seconds. Combine shots to build a sequence.
  // Use first-frame mode (upload location photo) to bring a static image to life.
  {
    name: 'V27 - Airbnb: Dolly Through Room Reveal',
    type: 'video' as const,
    isSystem: true,
    tags: ['airbnb', 'property', 'hotel', 'interior', 'dolly', 'travel'],
    isPublic: false,
    notes: 'First-frame mode — upload a room photo as first frame to bring it to life. Camera: slow dolly forward through space. No presenter. For presenter-led tours, use V02 series or V23c.',
    prompt: `Slow dolly forward through a beautifully styled accommodation interior. Camera at waist height, gimbal-smooth, moving through the space at walking pace. Warm afternoon light pours through windows, casting soft golden patches across the floor and furniture. The camera glides past textured cushions, a steaming coffee cup, layered linens on the bed. Dust motes float in the sunbeams. Curtains drift gently in a breeze from an open window. The dolly continues toward the balcony or window, the exterior view gradually filling the frame — landscape, ocean, or garden glowing in golden hour warmth. Lighting transitions from warm interior ambient to bright natural exterior as the camera approaches the window. Static objects brought to life through subtle environmental motion: steam rising, fabric swaying, light shifting. Real estate cinematography, warm inviting colour grading.`,
  },
  {
    name: 'V28 - Walking Tour: Dolly Forward POV',
    type: 'video' as const,
    isSystem: true,
    tags: ['tour', 'walking', 'pov', 'street', 'dolly', 'travel'],
    isPublic: false,
    notes: 'First-frame mode — upload a street or location photo. Camera: steady dolly forward at eye level (POV walk). No presenter visible. For presenter-led tours, use V23b.',
    prompt: `Steady dolly forward at eye level through a vibrant street or pathway, moving at natural walking pace. The camera pushes through the scene as life unfolds on both sides — vendors arranging produce, locals chatting at doorways, children passing by. Architecture frames the shot: weathered stone walls, colourful shuttered windows, hand-painted signage. Steam rises from a food stall. A cat watches from a windowsill. Light filters through overhead canopy or between buildings, creating dappled patterns on the cobblestones. The dolly continues forward, the path opening into a wider square or viewpoint ahead. Foreground elements pass close to the lens, creating natural parallax depth. Morning clarity or warm late-afternoon light. Real surface textures: worn stone, peeling paint, polished brass. POV immersion — the viewer IS the walker.`,
  },
  {
    name: 'V29 - Zoo Wildlife: Static to Life + Slow Zoom',
    type: 'video' as const,
    isSystem: true,
    tags: ['zoo', 'wildlife', 'animals', 'zoom', 'static-to-life', 'travel'],
    isPublic: false,
    notes: 'First-frame mode — upload an animal or exhibit photo to bring it to life. Camera: starts static, then slow zoom in as the animal moves. Nature documentary style.',
    prompt: `A still, contemplative shot of an animal in a naturalistic habitat — lush vegetation, natural substrate, dappled sunlight filtering through canopy. The scene begins almost static, like a photograph coming to life. Then subtle motion emerges: the animal blinks, shifts its weight, turns its head. Leaves rustle in a gentle breeze. Water ripples at the edge of a pool. The camera begins a very slow zoom in, tightening from a medium-wide to a close-up as the animal becomes more active — stretching, yawning, or making eye contact with the lens. Fur, feather, or scale texture becomes visible in detail. The eyes catch the light. A moment of connection between viewer and animal. Soft natural lighting, shallow depth of field on the close-up. Nature documentary cinematography — patient, respectful, awe-filled. Warm natural colour grading.`,
  },
  {
    name: 'V30 - Museum: Dolly + Tilt Up (Grand Reveal)',
    type: 'video' as const,
    isSystem: true,
    tags: ['museum', 'gallery', 'art', 'dolly', 'tilt', 'travel'],
    isPublic: false,
    notes: 'First-frame mode — upload a museum or gallery photo. Camera: slow dolly forward through gallery, with a tilt up to reveal grand architecture. Reverent pacing.',
    prompt: `Slow dolly forward through a grand museum or gallery hall at a reverent pace. Polished marble floors reflect overhead gallery lights. The camera passes paintings in gilded frames, sculptures casting long shadows, artefacts behind glass cases with soft spotlighting. Dust motes float in natural light beams from skylights above. As the dolly reaches a central atrium or rotunda, the camera begins a smooth tilt up — rising from floor-level exhibits up past ornate wall details, ascending columns, and finally revealing the soaring ceiling with its skylight pouring dramatic natural light downward. The tilt holds on the architectural grandeur above. Visitors move softly in the background, slightly blurred by the slow deliberate pacing. Lighting transitions from warm focused gallery spots to cool diffused skylight. Sophisticated muted colour grading: warm gallery tones mixing with cool marble blues.`,
  },
  {
    name: 'V31 - Night Market: Truck Shot + Rack Focus',
    type: 'video' as const,
    isSystem: true,
    tags: ['street-food', 'night-market', 'food', 'truck', 'travel'],
    isPublic: false,
    notes: 'First-frame or multimodal mode — upload market or food stall photos. Camera: lateral truck past food stalls with rack focus between foreground food and background atmosphere.',
    prompt: `Camera trucks laterally past a row of night market food stalls at close range. Bare bulbs and neon signs glow overhead, creating warm hazy atmosphere. Steam and smoke rise from cooking stations, catching the light. The focus racks between foreground and background — sharp on sizzling wok with flames erupting around tossed noodles, then pulling focus to the bustling lane of customers and lanterns behind. Truck continues past the next stall: skewers rotating over glowing coals, focus shifts to a vendor's hands folding dumplings with practiced precision. Condensation glistens on cold bottles. Chili oil catches the light like amber. The camera moves at walking pace, smooth and steady, pulling the viewer through the sensory experience. Warm saturated colour grading: rich oranges, deep reds, golden highlights against blue-black night sky. Every frame should make the viewer hungry.`,
  },
  {
    name: 'V32 - Nature Epic: Pedestal Up (Landscape Reveal)',
    type: 'video' as const,
    isSystem: true,
    tags: ['nature', 'adventure', 'landscape', 'pedestal', 'epic', 'travel'],
    isPublic: false,
    notes: 'First-frame mode — upload a landscape photo. Camera: pedestal up from ground detail to epic wide landscape reveal. For presenter-led adventure, use V23d instead.',
    prompt: `Camera begins at ground level on a natural detail — boots on rocky trail, grass swaying in wind, water flowing over smooth stones, or wildflowers nodding in a breeze. The scene is intimate, close, textured. Then the camera begins a slow pedestal up, rising steadily and revealing more of the landscape with each moment. First the immediate terrain — trail, meadow, riverbank. Then the middle distance — forest canopy, valley floor, distant ridgeline. Finally the full epic vista fills the frame — mountain range layered in atmospheric haze, coastline curving to the horizon, or canyon dropping away into mist below. A lone figure stands small against the enormity — a hiker on a ridge, silhouetted against the sky. Golden hour side-lighting sculpts the terrain with long shadows. The pedestal holds at the apex, letting the viewer absorb the scale. Lighting transitions from shadowed ground detail to warm open-sky exposure. Cinematic dramatic colour grading: earth tones warming into golden hour amber. Nature documentary grandeur.`,
  },
  {
    name: 'V33 - Travel: Arc Shot Around Subject',
    type: 'video' as const,
    isSystem: true,
    tags: ['showcase', 'travel', 'arc', 'subject', 'cinematic'],
    isPublic: false,
    notes: 'Showcase mode. Presenter = host/model, Subject = landmark or feature, Scene = destination. Camera: 180° arc shot orbiting the presenter with the landmark revealed behind. Hero shot for any destination.',
    prompt: `Smooth 180-degree arc shot orbiting around @Presenter1 who stands facing the camera at @Scene1 the destination. The camera circles from a front 3/4 angle, moving steadily around to their side, then behind — revealing @Subject1 the landmark, vista, or scenic feature expanding into view as the presenter moves out of frame. The arc continues until the subject fills the frame entirely. The presenter's hair and clothing move naturally in the wind as the camera passes. Golden hour light creates a warm rim light on their profile during the arc. Background transitions from bokeh to sharp as the landmark takes focus. Smooth gimbal or drone orbit at eye level. The arc captures both the human connection and the destination grandeur in a single unbroken movement. Cinematic travel colour grading, warm and aspirational.`,
  },
  {
    name: 'V34 - Travel: Dolly Zoom (Vertigo Effect)',
    type: 'video' as const,
    isSystem: true,
    tags: ['travel', 'dolly-zoom', 'vertigo', 'cinematic', 'dramatic'],
    isPublic: false,
    notes: 'First-frame mode or text-to-video. Camera: dolly zoom (Vertigo/Hitchcock effect) — background expands while subject stays same size. Creates dramatic "awe" moment at viewpoints, cliff edges, or grand interiors.',
    prompt: `Dolly zoom (Vertigo effect) on a dramatic viewpoint scene. A figure stands at the edge — cliff, balcony railing, or observation deck — looking out at a vast landscape. The camera dollies backward while simultaneously zooming in, keeping the figure the same size in frame while the background dramatically expands and flattens. The landscape behind them — mountains, ocean, cityscape, or canyon — stretches and warps with an unsettling, awe-inducing perspective shift. The effect is slow and deliberate, building over the full duration of the shot. The figure remains still, grounded, while the world behind them transforms. Golden hour light, atmospheric haze enhancing the depth compression. This is the "moment of realisation" shot — used at the emotional peak of a travel film when the destination's scale hits the viewer. Cinematic, dramatic, unforgettable.`,
  },
  {
    name: 'V35 - Travel: Static to Life (Photo Animation)',
    type: 'video' as const,
    isSystem: true,
    tags: ['static-to-life', 'first-frame', 'photo-animation', 'travel', 'cinematic'],
    isPublic: false,
    notes: 'First-frame mode — upload ANY travel photo. Brings a still image to life with subtle environmental motion. The most versatile travel prompt — works with any location photo.',
    prompt: `A photorealistic scene that appears to be a still photograph slowly coming to life. The composition holds steady — no camera movement. Instead, the world within the frame begins to animate with subtle, natural motion: water ripples and flows, clouds drift slowly across the sky, leaves and grass sway gently in the wind, flags or fabric flutter, steam or mist drifts across the scene. If people are present, they shift their weight slightly, turn their heads, or take a slow step. Birds glide across the background. Sunlight shifts subtly, a shaft of light moving across a wall or floor. Reflections shimmer on wet surfaces or glass. The effect is dreamlike and mesmerising — a frozen moment gently unfreezing. No dramatic camera moves. The magic is in the environmental animation bringing depth and life to what appeared static. Natural lighting, photorealistic quality, warm cinematic colour grading matching the mood of the original scene.`,
  },
  // ── Car Ads — Presenter-Less Automotive Cinematography ────────────────
  // Each prompt = ONE shot, no presenter. Upload car photo as first frame.
  // Designed for dealership ads, social media, listing videos.
  {
    name: 'V36 - Car Ad: Hero Reveal (Arc Shot 360°)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'arc', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload a car photo. Camera: full 360° arc orbit around the car. No presenter. The classic hero automotive ad shot. Works in studio or outdoor setting.',
    prompt: `Camera performs a slow, smooth 360-degree arc orbit around the car at hip height. The vehicle stands alone — no people, no distractions. As the camera circles, dramatic lighting travels across the paint surface — specular highlights rolling along the body lines, reflections shifting in the glass, chrome catching directional light. Each angle reveals a new design element: aggressive front grille, sculpted fender, flowing roofline, muscular rear haunches, wheel design. The car sits on a wet reflective surface that mirrors the underside and lights. The orbit is perfectly smooth and continuous, never stopping. Dramatic studio lighting with a single strong key light and subtle warm fill. Dark moody background that isolates the vehicle. Premium automotive commercial — the kind of shot that opens a Super Bowl car ad.`,
  },
  {
    name: 'V37 - Car Ad: Body Line Detail (Slow Truck)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'truck', 'detail', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload a car side profile photo. Camera: ultra-slow lateral truck along the body, macro-close to paint surface. Detail and craftsmanship shot.',
    prompt: `Camera trucks laterally at extreme close range along the car body — just inches from the paint surface. The movement is ultra-slow, gliding from the front headlight along the character line, across the door handle, past the rear quarter panel to the tail light. At this proximity, every detail becomes monumental: the depth of the metallic paint layers, the precision of the panel gaps, the machined aluminium trim, the LED light elements inside the headlamp cluster. Reflections of the environment slide across the curved surfaces as the camera travels. Shallow depth of field isolates each detail in turn. Dramatic side-lighting rakes across the body, emphasising every curve and crease. No people, no context — pure design appreciation. Single continuous truck, automotive macro cinematography, dark moody colour grading with warm metal highlights.`,
  },
  {
    name: 'V38 - Car Ad: Static to Life (Paint Reflections)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'static-to-life', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload ANY car photo. Brings a static car image to life with environmental motion — reflections, light movement, rain, steam. Most versatile car ad prompt.',
    prompt: `The car sits perfectly still in a dramatic setting — the camera does not move. Instead, the world around the car comes alive. Light shifts slowly across the paint — a cloud passing overhead, a neon sign cycling colours, or golden hour sun creeping across the body. Reflections in the glass and paint animate with the moving environment: trees swaying in the wind mirror across the windscreen, city lights pulse in the lacquer finish. If the surface is wet, water droplets catch the light and shimmer. A subtle heat haze rises from the hood after the engine has been running. Brake light glow pulses once. Exhaust note implied by a tiny tremor of heat distortion at the tailpipe. The car is a sculpture responding to its environment. No camera movement — the stillness of the vehicle contrasts with the living world reflected in its surfaces. Dramatic lighting, photorealistic quality, premium automotive mood.`,
  },
  {
    name: 'V39 - Car Ad: Rolling Shot (Truck Alongside)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'truck', 'rolling', 'motion', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload a car photo. Camera: lateral truck matching the car speed on a road — the classic rolling shot. Background motion-blurred, car sharp. For driving lifestyle ads.',
    prompt: `Camera trucks laterally at the exact speed of the car as it drives along a scenic road. The vehicle is perfectly sharp and centred in frame while the background streaks past in smooth horizontal motion blur — mountains, trees, coastline, or city lights. The camera holds at door height, showing the full side profile of the car in motion. Wheels are spinning, suspension working over subtle road imperfections. The paint catches shifting light from the passing environment — sun through trees creating a strobe effect, or city neon washing across the body in colour waves. No driver visible through the tinted glass — the car is the star. Golden hour or blue hour lighting for maximum drama. Single continuous rolling truck shot, the signature automotive commercial technique. Cinematic motion blur, sharp subject, premium colour grading.`,
  },
  {
    name: 'V40 - Car Ad: Front Approach (Dolly Back Low-Angle)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'dolly', 'low-angle', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload a car front photo. Camera: low-angle dolly backward as the car approaches — headlights growing, grille filling the frame. The intimidation shot.',
    prompt: `Camera holds a low angle at road level as the car approaches head-on, headlights blazing. The camera dollies backward slowly, slightly slower than the car — so the vehicle gradually fills the frame, growing larger and more imposing with each moment. The grille, badge, and hood expand toward the lens. Headlight beams flare across the camera creating cinematic lens flares. The low perspective exaggerates the car's height and aggression. Road surface texture races beneath the camera. The car's shadow stretches forward, reaching the lens. The approach continues until the grille nearly fills the entire frame — overwhelming, powerful, dominant. Dramatic front-lighting from the headlamps mixed with ambient golden hour from behind the camera. Single continuous low-angle dolly back, the power shot used in every premium car launch commercial.`,
  },
  {
    name: 'V41 - Car Ad: Interior Cockpit (Static + Light Sweep)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'interior', 'static', 'lighting', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload a car interior photo. Camera: static interior shot with light sweeping across the cabin — dashboard, leather, ambient lighting coming alive. Luxury detail shot.',
    prompt: `Camera holds perfectly still inside the car cabin, framing the dashboard, steering wheel, centre console, and windscreen. The interior is empty — no driver. The scene begins in near-darkness, then light slowly sweeps through the cabin as if the car is passing through a tunnel exit or sunrise is breaking through the windscreen. The light travels across the leather seats revealing the quilted stitching texture, moves across the brushed aluminium trim, catches the glass of the infotainment screen, and illuminates the ambient LED strips that glow to life along the door panels and dashboard. Materials respond to the light — leather gains depth, metal surfaces sparkle, carbon fibre weave becomes visible. The digital dashboard illuminates, gauges sweeping to life. The light sweep completes and the interior settles into warm, inviting ambient glow. No camera movement — all drama comes from the lighting transition. Interior automotive luxury, material showcase, ASMR-satisfying detail.`,
  },
  {
    name: 'V42 - Car Ad: Wheel & Brake (Zoom In Macro)',
    type: 'video' as const,
    isSystem: true,
    tags: ['car', 'automotive', 'ad', 'zoom', 'macro', 'detail', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload a car wheel close-up. Camera: slow zoom in from full wheel to brake caliper macro detail. Engineering precision showcase.',
    prompt: `Camera begins on the full wheel and tyre in frame — alloy design catching dramatic side-light, tyre sidewall lettering visible, the arc of the fender above. The camera begins a slow, steady zoom in — tightening from the full wheel to the spoke pattern, past the wheel bolts, through the spoke gaps to the brake caliper behind. The zoom continues to macro level: the caliper's machined surface, the brand logo engraved in the metal, the brake disc ventilation slots, the pad material visible at the edge. At this magnification, the engineering precision is breathtaking — CNC machining marks on aluminium, the heat-discoloured edge of the disc, a faint dusting of brake dust on the caliper. Dramatic directional lighting sculpts every machined edge in sharp shadow. Single continuous zoom from product shot to engineering detail, no camera movement beyond the zoom. Automotive engineering cinematography, dark background isolating the component, warm metallic colour grading.`,
  },
  // ── TV Commercial / Product Ad — Broadcast Quality ────────────────────
  // No presenter. Product is the hero. Upload product photo as first frame.
  // These are the shots that run between TV shows, on YouTube pre-roll, and Instagram Reels.
  {
    name: 'V43 - TV Ad: Product Hero Reveal (Pedestal Up + Light Burst)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ad', 'commercial', 'product', 'tv', 'pedestal', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload product photo. The classic TV commercial money shot. Camera: pedestal up from base to full product, dramatic light burst as the hero is revealed. Works for ANY product — perfume, skincare, tech, food, supplements, toothpaste.',
    prompt: `The scene opens in darkness. A single shaft of light descends from above, striking the surface below and spreading outward in a soft pool. The product sits at the centre — but only the base is visible. Camera begins at surface level, just millimetres above the glossy reflective plane, the product towering above like a monolith. The camera begins a slow pedestal up — rising smoothly from the base, past the body of the product, revealing the label, the texture, the form. As the camera reaches the top, a dramatic light burst blooms behind the product — warm and golden, or cool and clinical depending on the brand — creating a halo effect and illuminating the full hero silhouette. Particles drift through the light beam — dust motes for luxury, water droplets for freshness, golden sparkles for premium. The product now stands fully revealed, perfectly lit, commanding the frame. The reflective surface below mirrors the product and the light. Camera holds on the final hero composition. Single continuous pedestal up with timed light burst at the apex. This is the last 3 seconds of every television commercial — the shot the viewer remembers. Studio-grade lighting, flawless product surface, broadcast-quality colour grading.`,
  },
  {
    name: 'V44 - TV Ad: Product in Action (Macro Slow-Motion)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ad', 'commercial', 'product', 'tv', 'macro', 'slow-motion', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload product photo. The "sensory proof" shot. Camera: macro slow-motion of the product being used — cream spreading, liquid pouring, tablet dissolving, bristles bending. Proves quality through texture and motion. Works for skincare, food, beverages, cleaning, dental, pharma.',
    prompt: `Extreme macro slow-motion capturing the product in the moment of use. The camera holds static at macro distance — the product fills 80% of the frame. Then the action begins in ultra slow-motion: cream being squeezed from a tube, the thick luxurious texture curling as it emerges, catching studio light on its glossy surface. Or: liquid being poured in a perfect arc, the stream catching light like liquid gold, splashing into a glass with a crown of droplets frozen mid-air. Or: toothpaste meeting bristles, the paste sitting perfectly shaped on the brush head, the bristles bending as they press against a surface showing flexibility and precision. Or: serum dropping from a pipette, the droplet stretching, separating, landing on skin and spreading outward in a satisfying radial pattern. The macro lens reveals what the naked eye cannot — the texture, the viscosity, the quality of ingredients made visible. Every surface is hyper-detailed: product label sharp in the background bokeh, the material behaviour proving premium formulation. Studio lighting with a strong key light creating dimensional shadows on the product texture. High-speed cinematography feel (240fps equivalent), the product in slow-motion glory. This is the shot that makes viewers believe the product works before they even read the claims.`,
  },
  {
    name: 'V45 - TV Ad: Lifestyle Context (Dolly + Rack Focus)',
    type: 'video' as const,
    isSystem: true,
    tags: ['ad', 'commercial', 'product', 'tv', 'dolly', 'rack-focus', 'lifestyle', 'first-frame'],
    isPublic: false,
    notes: 'First-frame mode — upload product photo. The "desire" shot. Camera: slow dolly forward through a lifestyle scene, rack focus from environment to product in the foreground. Places the product in an aspirational context — bathroom, kitchen, gym bag, desk, bedside table. The product belongs in YOUR life.',
    prompt: `Camera begins on a soft, out-of-focus lifestyle scene — a sunlit bathroom counter, a minimalist kitchen shelf, a stylish bedside table, or a gym bag with morning light streaming across it. The environment is aspirational but attainable: clean surfaces, warm natural tones, curated but not sterile. One or two contextual props set the scene (a folded towel, a coffee cup, a succulent, a pair of glasses). The camera dollies forward slowly, moving toward the product which sits prominently in the foreground, currently soft and undefined. As the dolly continues, the focus racks smoothly from the background environment to the product — which snaps into crisp, sharp detail. The label is readable. The packaging catches the light. The product texture is visible. The background falls into a creamy bokeh that still communicates "this is a beautiful place." The camera holds on the sharp product for the final beat, perfectly framed in its lifestyle context. The message is clear without words: this product belongs in this life, and this life could be yours. Warm natural lighting (window light preferred), single continuous dolly with rack focus, aspirational lifestyle commercial, the kind of product placement that feels editorial, not salesy. Works for skincare, supplements, tech accessories, home goods, beverages, dental care, any consumer product.`,
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
    name: 'C08 - Enhanced Image Realistic',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'realistic', 'camera', 'film'],
    isPublic: false,
    notes: 'Append this to any character prompt for ultra-realistic film photography look. Uses Mamiya RZ67 + Kodak Portra 800 film simulation with detailed skin rendering parameters.',
    prompt: '{ "camera": { "model": "Mamiya RZ67", "lens": "110mm f/2.8" }, "film": { "type": "Kodak Portra 800" }, "skin_details": { "pores": "visible fine pores", "texture": "natural micro-relief skin texture", "vellus_hair": "subtle", "freckles": "natural" }, "shading": { "subsurface_scattering": "melanin-based", "roughness": { "cheeks": "slightly higher", "t_zone": "slightly lower" }, "specular": { "model": "GGX", "ior": 1.48 } }, "geometry_detail": { "micro_displacement": true, "normal_map": "high-resolution" }, "lighting": { "key_light": "soft 45-degree", "fill_light": "low intensity" }, "post_processing": { "plastic_skin": false, "over_retouching": false, "noise_reduction": "minimal" } }, professional photography, cinematic lighting, high detail',
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

  // ── Travel & Hospitality Prompts ─────────────────────────────────────
  {
    name: 'E04 - Cinematic Travel Destination',
    type: 'environment' as const,
    isSystem: true,
    tags: ['travel', 'cinematic', 'destination', 'tourism', 'photorealistic'],
    isPublic: false,
    notes: 'Versatile travel prompt for any destination — beach, mountain, city, landmark. Describe the location after the prompt. Produces cinematic establishing shots with consistent mood and color grading. Works with @image1 as location reference.',
    prompt: `# Cinematic Travel Destination — Photorealistic Scene

Create a **photorealistic travel scene** that captures the essence of the described destination. The result must feel like **real cinematic travel footage** — not CGI, not a stock photo, not an illustration.

---

## Visual Identity (Soft Lock)

Maintain across all generated shots:
- **Same color grading** — warm, natural, cinematic palette
- **Same mood and atmosphere** — immersive, inviting, aspirational
- **Same time of day and lighting tone** — golden hour preferred, or match the described setting
- **Same camera language** — cinematic, deliberate, storytelling-driven

Allow natural variation in:
- Composition and framing
- Camera angle and distance
- Foreground/background elements
- Human activity and motion

---

## Camera & Cinematography

- **Lens**: 24mm–85mm equivalent (wide establishing to medium portrait of place)
- **Style**: Cinematic travel documentary — smooth, intentional framing
- **Movement feel**: Slow drone glide, steady tracking, or locked tripod — NO handheld shake
- **Depth of field**: Natural, moderate — environment is the subject, keep it sharp
- **Aspect ratio**: 16:9 widescreen preferred

---

## Lighting & Atmosphere

- Golden hour warmth OR moody blue hour — match the destination's character
- Natural light only — sunlight, cloud diffusion, ambient glow
- Realistic atmospheric effects — haze, mist, light rays through trees/buildings
- No artificial studio lighting
- Shadows must be soft and directional

---

## Environment Realism

- Real-world materials — stone, water, sand, foliage, architecture
- Weather-appropriate details — wet surfaces after rain, dust in arid locations, condensation in humid settings
- Human presence is optional but if included: natural poses, local clothing, candid — NOT posed stock photo people
- Animals and wildlife: natural behavior, not staged

---

## Shot Composition Guide

Generate shots that tell a visual story:
1. **Hero Wide** — Establishing shot, full destination reveal, dramatic scale
2. **Immersive Medium** — Viewer feels present, walking through or arriving at the location
3. **Intimate Detail** — Texture, local element, food, signage, or cultural artifact
4. **Human Scale** — Person or silhouette that gives the scene emotional weight
5. **Departure/Transition** — Looking back, path ahead, or fading light — cinematic closure

---

## Mood Anchors

The image must evoke ONE of these moods (match to destination):
- **Peaceful luxury** — resort, beach, vineyard
- **Awe and wonder** — mountain, canyon, ancient ruin
- **Vibrant energy** — market, festival, street scene
- **Quiet discovery** — hidden alley, forest trail, small village
- **Epic scale** — aerial, coastline, skyline at sunset

---

## Strict Negative Constraints

Do NOT produce:
- Stock photo aesthetic (overly clean, fake smiles, staged poses)
- HDR over-processing or oversaturated colors
- CGI or 3D render appearance
- Drone shots that look like Google Earth
- Text overlays, watermarks, or UI elements
- Anime, illustration, or painterly style

---

## AI Control Instruction

"Prioritize mood, lighting, and realism. Do not enforce strict geometry consistency. Allow natural variation while maintaining visual coherence across all shots. Every frame should feel like it belongs in the same travel film."

---

## Output

Produce a **single photorealistic image** that looks like a frame from a high-end travel documentary or luxury tourism campaign.`,
  },
  {
    name: 'E05 - Airbnb & Property Showcase',
    type: 'environment' as const,
    isSystem: true,
    tags: ['airbnb', 'property', 'hotel', 'interior', 'real-estate', 'photorealistic', 'travel'],
    isPublic: false,
    notes: 'For Airbnb listings, hotel room marketing, vacation rental photos. Produces warm, inviting interior/exterior shots that make spaces look aspirational. Use @image1 as property reference photo.',
    prompt: `# Airbnb & Property Showcase — Photorealistic Marketing Shot

Create a **photorealistic property showcase image** that makes the space feel warm, inviting, and aspirational — like the best Airbnb listing photo or a boutique hotel campaign shot.

The result must look like **real professional property photography**, not CGI or virtual staging.

---

## Visual Style — "I Want to Stay Here"

The image must trigger an emotional booking impulse:
- **Warm and inviting** — cozy lighting, lived-in but pristine
- **Aspirational but attainable** — luxury without intimidation
- **Lifestyle-focused** — show how it FEELS to be in this space, not just what it looks like

---

## Photography Style

- **Lens**: 16mm–35mm wide angle (interior) or 35mm–85mm (exterior/detail)
- **Camera height**: Low tripod (~waist height) for interiors — makes rooms feel spacious
- **Lighting**: Natural window light + warm ambient. Golden hour for exteriors
- **Color grading**: Warm whites, soft shadows, no harsh contrast
- **Post-processing feel**: Edited but natural — like a professional Airbnb photographer

---

## Interior Shot Rules

When generating interior views:
- Shoot from corners or doorways to maximize visible space
- Include at least one window with natural light streaming in
- Bed/sofa must look freshly made with textured linens
- Add lifestyle touches: open book, coffee cup, fresh flowers, soft throw blanket
- Floor must be visible — grounds the perspective
- No clutter, but not sterile — "curated casual"

---

## Exterior Shot Rules

When generating exterior views:
- Show the property within its environment (garden, street, view)
- Include outdoor living space if applicable (patio, balcony, pool)
- Time of day: golden hour or blue hour preferred
- Landscaping should look maintained but natural

---

## Detail Shot Guide

- Bathroom: fluffy towels, rainfall shower, natural toiletries
- Kitchen: clean counters, one styled element (fruit bowl, herb pot, espresso machine)
- Bedroom: layered textiles, reading lamp glow, view through window
- Living area: cushions arranged, soft lighting, sense of comfort
- Unique feature: fireplace, hot tub, hammock, view from balcony

---

## Consistency Rules (Soft Lock)

Maintain across all shots of the same property:
- Same color temperature and warmth
- Same time of day / lighting direction
- Same level of styling (don't mix minimal with cluttered)
- Same architectural style and materials

---

## Strict Negative Constraints

Do NOT produce:
- Empty, cold, sterile rooms
- Fish-eye lens distortion
- Virtual staging that looks fake
- Stock photo people in the space
- Over-saturated or HDR look
- Dark, underexposed rooms
- CGI or 3D render aesthetic

---

## AI Control Instruction

"Create a space that makes someone immediately want to book it. Prioritize warmth, natural light, and lifestyle appeal. The space should feel real, photographed, and emotionally inviting."

---

## Output

Produce a **single photorealistic image** that looks like a professional Airbnb Superhost or boutique hotel marketing photograph.`,
  },
  {
    name: 'E06 - Guided Tour Experience (Zoo / Museum / Area)',
    type: 'environment' as const,
    isSystem: true,
    tags: ['tour', 'zoo', 'museum', 'walking-tour', 'experience', 'photorealistic', 'travel'],
    isPublic: false,
    notes: 'For tour operators, museums, zoos, theme parks, walking tours. Generates immersive POV-style shots that make viewers feel like they are ON the tour. Describe the tour type and location after the prompt.',
    prompt: `# Guided Tour Experience — Immersive POV Scene

Create a **photorealistic tour experience image** that makes the viewer feel like they are physically present — walking through, exploring, and discovering. The result must feel like a real moment captured during an actual visit.

This is NOT a brochure photo. This is a **"you are here"** moment.

---

## Experience Types (match to your description)

### Zoo / Wildlife Park
- Animals in naturalistic enclosures, not cages
- Visitor perspective: looking through glass, over railings, along pathways
- Include environmental context: signage, pathways, other visitors (background)
- Animals in natural behavior: feeding, resting, playing, moving
- Close encounter moments: animal looking at camera, feeding station

### Museum / Gallery
- Perspective: standing in front of exhibits, walking through halls
- Dramatic gallery lighting on exhibits
- Include architectural details: high ceilings, polished floors, display cases
- Other visitors as background context (not focus)
- Mix of wide gallery shots and close exhibit detail

### Walking Tour / Area Tour
- Street-level perspective, following a path or route
- Local architecture, signage, street life
- Guided group optional: seen from behind, following a leader
- Seasonal/weather appropriate: umbrellas, sunlight, autumn leaves
- Discovery moments: turning a corner, arriving at a viewpoint

### Food & Market Tour
- Market stalls with colorful produce, spices, local goods
- Street food preparation: steam, flame, motion
- Tasting moments: hands holding food, close-up plates
- Vendor interaction: natural, candid, not posed
- Sensory richness: textures, colors, steam, condensation

---

## Camera Style — "First Person Travel"

- **Lens**: 24mm–50mm (immersive but not distorted)
- **Height**: Eye level — viewer's natural perspective
- **Style**: Documentary / travel vlog aesthetic
- **Depth of field**: Moderate — environment stays readable
- **Motion**: Implied through composition — someone is walking, looking, discovering

---

## Storytelling Beat Structure

Each image should feel like one beat in a tour narrative:
1. **Arrival** — First glimpse, entrance, gate, threshold
2. **Discovery** — "Wow" moment — main attraction reveal
3. **Immersion** — Deep inside the experience, surrounded by it
4. **Detail** — Close-up of something fascinating, unique, or beautiful
5. **Memory** — The shot you'd share on Instagram — the defining moment

---

## Atmosphere & Mood

- **Curious and engaged** — viewer is actively exploring
- **Natural imperfection** — real crowds, real weather, real light
- **Sensory immersion** — you can almost hear/smell the scene
- Lighting: match real conditions (indoor = artificial/mixed, outdoor = natural)

---

## Human Element Rules

- People as context, not subjects (unless describing a guide)
- Natural crowd density — not empty, not packed
- Diverse, realistic visitors
- No one looking at camera (candid only)
- Guide (if present): gesturing, explaining, leading — seen from participant's POV

---

## Strict Negative Constraints

Do NOT produce:
- Brochure / stock photo aesthetic
- Empty, sterile environments
- Posed group photos
- Birds-eye or satellite views
- Cartoon or illustrated style
- Over-saturated or HDR processing
- Text overlays or UI elements

---

## AI Control Instruction

"Generate from the visitor's perspective. The viewer should feel physically present in the scene. Prioritize immersion, natural lighting, and authentic atmosphere. Allow imperfection — real tours have real conditions."

---

## Output

Produce a **single photorealistic image** that feels like an authentic moment captured during a real guided tour experience.`,
  },
  {
    name: 'E07 - Luxury Resort & Hotel Marketing',
    type: 'environment' as const,
    isSystem: true,
    tags: ['hotel', 'resort', 'luxury', 'spa', 'hospitality', 'photorealistic', 'travel'],
    isPublic: false,
    notes: 'For luxury hotel, resort, and spa marketing. Produces aspirational, magazine-quality shots of pools, lobbies, dining, spa, and suites. Premium feel with warm, inviting atmosphere.',
    prompt: `# Luxury Resort & Hotel Marketing — Premium Campaign Shot

Create a **photorealistic luxury hospitality image** suitable for a 5-star hotel marketing campaign, resort website hero image, or luxury travel magazine spread.

The result must feel like it was shot by a **professional hospitality photographer** — aspirational, warm, and effortlessly elegant.

---

## Visual Identity — "Effortless Luxury"

- **Tone**: Warm, sophisticated, serene
- **Feel**: You can almost feel the temperature, hear the water, smell the lobby
- **Style**: Editorial luxury — somewhere between Condé Nast Traveller and Aman Resorts
- **NOT**: Cold corporate, sterile showroom, or over-the-top gaudy

---

## Scene Categories (match to description)

### Infinity Pool & Water Features
- Pool edge meeting horizon (ocean, jungle, mountains)
- Turquoise water with realistic caustics and reflections
- Towels, sun loungers, cocktails as styling elements
- Golden hour or blue hour lighting preferred
- Steam/mist on heated pools at dawn

### Lobby & Public Spaces
- Grand entrance with natural light
- Architectural drama: high ceilings, statement lighting, natural materials
- Fresh flowers, subtle fragrance implied through visual cues
- One or two guests in background (never crowded)

### Suite & Bedroom
- King bed with premium layered linens
- View through floor-to-ceiling windows
- Turndown service styling: robe, slippers, welcome amenity
- Warm bedside lighting, twilight through window

### Restaurant & Dining
- Plated dish as art — chef's presentation
- Table setting with candles, linen, glassware
- View from the table (ocean, garden, city skyline)
- Warm candlelight mixed with ambient twilight

### Spa & Wellness
- Treatment room: warm stones, oil, candles, folded towels
- Natural materials: wood, stone, water features
- Outdoor spa with nature backdrop
- Steam, soft focus, tranquility

### Grounds & Exterior
- Manicured gardens, pathways lit at dusk
- Architecture that blends with landscape
- Arrival experience: car pulling up, doorman, entrance reveal

---

## Photography Rules

- **Lens**: 24mm (wide architectural) to 85mm (detail/dining)
- **Lighting**: Natural + warm ambient. Never harsh flash
- **Color**: Warm neutrals, earth tones, with one accent color from the environment
- **Shadows**: Soft, directional, adding depth
- **Post-processing**: Clean, warm, subtle contrast — magazine editorial grade

---

## Lifestyle Touches (Critical)

Every shot must include at least ONE human-scale lifestyle element:
- An open book by the pool
- A half-drunk cocktail on the balcony railing
- Steam rising from a coffee cup at sunrise
- A robe draped over a chair
- Bare footprints in sand leading to the water

These details transform a "property photo" into a "lifestyle story."

---

## Strict Negative Constraints

Do NOT produce:
- Empty, uninviting spaces
- Harsh overhead lighting
- Crowded tourist scenes
- Budget hotel aesthetic
- Over-processed HDR
- Stock photo people with fake smiles
- CGI or 3D render look
- Cold, blue-tinted color grading

---

## AI Control Instruction

"Create an image that belongs in a luxury travel magazine. Prioritize warmth, atmosphere, and lifestyle storytelling. The viewer should feel the invitation — 'I need to go there.' Natural, editorial, aspirational."

---

## Output

Produce a **single photorealistic image** that looks like a professional luxury hospitality campaign photograph — warm, inviting, and magazine-ready.`,
  },
  {
    name: 'E08 - Street & Cultural Explorer',
    type: 'environment' as const,
    isSystem: true,
    tags: ['street', 'culture', 'market', 'food', 'local', 'photorealistic', 'travel'],
    isPublic: false,
    notes: 'For cultural travel content — street markets, local food, traditional neighborhoods, festivals, daily life. Captures the authentic energy of a place. Describe the culture/location after the prompt.',
    prompt: `# Street & Cultural Explorer — Authentic Local Scene

Create a **photorealistic street-level cultural scene** that captures the authentic energy, texture, and soul of a real place. The result must feel like a candid travel photograph taken by someone who truly understands and respects the location.

This is NOT tourism marketing. This is **real travel photography** — raw, beautiful, honest.

---

## Visual Style — "The Real Place"

- **Tone**: Authentic, warm, alive
- **Feel**: Documentary travel photography meets Instagram travel creator
- **Influence**: Steve McCurry meets modern travel vlogger
- **NOT**: Stock photo, tourist brochure, or poverty tourism

---

## Scene Categories (match to description)

### Street Market / Bazaar
- Overhead spice displays, colorful produce, stacked goods
- Vendor hands preparing, measuring, packaging
- Narrow aisles, hanging fabrics, layered visual depth
- Mixed lighting: sunlight through canopy + bare bulbs
- Steam, smoke from cooking, dust particles in light

### Street Food Scene
- Chef/vendor actively cooking — flame, wok toss, steam
- Close-up of finished dish with authentic presentation (NOT fine dining plating)
- Condiments, sauces, chopsticks, paper plates — real street food context
- Queue or crowd in background — popular spot indicator
- Night market glow: neon, lanterns, bare bulbs

### Traditional Neighborhood
- Narrow streets, balconies, laundry lines, potted plants
- Weathered walls with character — peeling paint, old tile, patina
- Local residents going about daily life (NOT posing)
- Cats, motorcycles, bicycles — lived-in details
- Morning light or late afternoon warmth

### Temple / Sacred Space
- Respectful distance, architectural grandeur
- Incense smoke, candle light, flower offerings
- Devotees in natural worship (NOT staged)
- Stone texture, carved detail, weathered surfaces
- Quiet atmosphere — even in a busy place

### Festival / Celebration
- Color explosion: costumes, decorations, face paint
- Motion blur on dancers, sharp on spectators
- Confetti, flowers, powder, water — festival elements
- Crowd energy without chaos
- Night celebrations with fire, lanterns, light trails

---

## Camera Style — "Street Photographer"

- **Lens**: 35mm–50mm (classic street photography)
- **Style**: Candid, decisive moment, never staged
- **Depth of field**: Moderate — subject in context, not isolated
- **Color**: Rich but natural — local color palette, not graded to a trend
- **Grain**: Subtle film grain is acceptable — adds authenticity

---

## Authenticity Rules (Critical)

- Local materials, real architecture, real textures
- Food must look like REAL local food, not westernized versions
- Clothing must be culturally accurate
- Signage in local language (if visible)
- Weather appropriate: humidity haze, dry heat shimmer, monsoon wet streets
- Imperfections are features: cracked pavement, tangled wires, mismatched chairs

---

## Human Element

- People are part of the scene, not the subject
- Natural activity: shopping, eating, praying, chatting, working
- No one looking at camera
- Diverse age groups
- Culturally respectful representation

---

## Strict Negative Constraints

Do NOT produce:
- Western/tourist perspective clichés
- Poverty exploitation imagery
- Overly clean or sanitized version of real places
- Stock photo diversity casting
- Instagram filter over-processing
- Cartoon, illustration, or painterly style
- Empty streets (unless dawn/specific context)

---

## AI Control Instruction

"Capture the authentic spirit of this place. Prioritize real textures, real light, real life. The image should smell like the place. Allow natural imperfection — this is what makes travel photography powerful."

---

## Output

Produce a **single photorealistic image** that feels like an authentic street-level travel photograph — alive, textured, and culturally rich.`,
  },
  {
    name: 'E09 - Nature & Adventure Landscape',
    type: 'environment' as const,
    isSystem: true,
    tags: ['nature', 'adventure', 'landscape', 'outdoor', 'hiking', 'safari', 'photorealistic', 'travel'],
    isPublic: false,
    notes: 'For outdoor adventure content — hiking, safari, diving, mountains, forests, waterfalls, coastlines. Epic landscape with human scale. Describe the specific environment after the prompt.',
    prompt: `# Nature & Adventure Landscape — Epic Outdoor Scene

Create a **photorealistic nature and adventure scene** that captures the raw grandeur and emotional power of the natural world. The result must feel like a **National Geographic photograph** or a frame from a premium nature documentary.

---

## Visual Identity — "Earth is the Subject"

- **Tone**: Awe-inspiring, vast, humbling
- **Scale**: The landscape dominates — humans are small within it
- **Light**: Natural, dramatic, weather-dependent
- **NOT**: Desktop wallpaper cliché, oversaturated postcard, or fantasy landscape

---

## Scene Categories (match to description)

### Mountain & Alpine
- Snow-capped peaks with cloud interaction
- Hiking trail with lone figure for scale
- Alpine meadow, glacial lake, rocky ridge
- Dramatic weather: clearing storm, first light on summit
- Altitude atmosphere: thin air clarity, blue shadows

### Tropical & Coastal
- Turquoise water with realistic wave patterns
- Coral reef (underwater): natural light penetration, marine life
- Jungle canopy: light filtering through layers
- Beach: footprints, tide line, driftwood, shell details
- Cliff coastline: sea spray, dramatic erosion

### Safari & Wildlife
- Animals in natural habitat — not zoo, not staged
- African savanna: golden grass, acacia trees, dust
- Vehicle perspective: through open safari truck window
- Golden hour or dramatic storm light
- Animal behavior: herd movement, predator stalking, watering hole

### Forest & Woodland
- Light rays through canopy (god rays)
- Mossy forest floor, fallen trees, mushrooms
- River/stream with realistic water flow
- Seasonal variation: autumn color, winter frost, spring bloom
- Trail disappearing into depth — mystery and invitation

### Desert & Arid
- Sand dune patterns, wind-sculpted rock
- Extreme light contrast: bright sun, deep shade
- Oasis or water feature as focal point
- Star trails or milky way (if night scene)
- Heat shimmer on horizon

### Waterfall & River
- Long exposure feel: silky water texture
- Mist and spray catching light (rainbow possible)
- Wet rock surfaces with realistic reflections
- Surrounding vegetation with water droplets
- Scale reference: person, bridge, or recognizable object

---

## Camera Style — "Adventure Photographer"

- **Lens**: 16mm–24mm ultra-wide for landscape, 200mm+ for wildlife
- **Style**: National Geographic editorial
- **Tripod stability**: Sharp foreground-to-background
- **Golden hour**: Preferred for most landscapes
- **Blue hour**: For moody, atmospheric scenes

---

## Human Element (Optional but Powerful)

When a person appears:
- Small in frame — establishes SCALE of the landscape
- Wearing appropriate gear (hiking boots, backpack, wetsuit)
- Looking INTO the scene, not at camera
- Standing at viewpoint, edge, or trail
- Silhouette against dramatic sky is very effective

---

## Technical Realism

- Real weather patterns (not always perfect blue sky)
- Accurate geology and vegetation for the biome
- Water behavior: currents, foam patterns, clarity
- Sky: real cloud formations, atmospheric perspective
- Wildlife: accurate species, natural behavior, real proportions

---

## Strict Negative Constraints

Do NOT produce:
- Fantasy landscapes (floating islands, impossible geology)
- Over-saturated "screensaver" images
- Perfect symmetry (nature is asymmetric)
- Cartoon or illustrated style
- HDR processing artifacts
- Animals in unnatural settings or poses
- Multiple focal points competing for attention

---

## AI Control Instruction

"Let nature be dramatic on its own terms. Do not over-enhance. Real weather, real light, real scale. One clear subject within a vast environment. The viewer should feel small and amazed."

---

## Output

Produce a **single photorealistic image** that feels like a professional nature/adventure photograph — dramatic, authentic, and emotionally powerful.`,
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
  // STYLE PROMPTS — Moved to constants.ts STYLE_PROMPTS map
  // S01-S22 removed — now managed as fixed Art Styles in VISUAL_STYLES + STYLE_PROMPTS
  // ══════════════════════════════════════════════════════════════
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
  const [sourceFilter, setSourceFilter] = useState<'all' | 'personal' | 'system'>('all');
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
                const sourceFiltered = allTemplates.filter(t =>
                  sourceFilter === 'all' ? true :
                  sourceFilter === 'system' ? (t as any).isSystem === true :
                  (t as any).isSystem !== true
                );
                const count = cat.key === 'all'
                  ? sourceFiltered.length
                  : sourceFiltered.filter(t => t.type === cat.key).length;
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
                    template={template as Prompt}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={() => {
                      setEditingTemplate(template as Prompt);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template as Prompt)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTemplates.map(template => (
                  <PromptListItem
                    key={template._id}
                    template={template as Prompt}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={() => {
                      setEditingTemplate(template as Prompt);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template as Prompt)}
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
              <option value="camera">Camera</option>
              <option value="action">Action</option>
              <option value="notes">Notes</option>
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
