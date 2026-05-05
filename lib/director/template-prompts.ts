// Hardcoded system prompt templates for the AI Director.
// These mirror the DEFAULT_PROMPT_TEMPLATES in PromptLibrary.tsx so the
// Director tool-executor can select a template without querying the database.
// Update this file whenever the canonical prompts in PromptLibrary.tsx change.

export const SYSTEM_TEMPLATE_PROMPTS: Record<string, string> = {

  // ─── CHARACTER ────────────────────────────────────────────────────────────

  C01: `Create a **comprehensive character production reference sheet** — a single professional reference board used by animation studios, film productions, and visual development teams.

All panels must be **photographic or visual only**. No text paragraphs, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real professional casting / production sheet** on a clean white background.

---

## CRITICAL RULE — SINGLE SUBJECT ONLY

- The sheet must contain ONLY ONE character
- All views represent the EXACT SAME individual
- No duplicated characters anywhere on the sheet
- Back view = same subject rotated 180°, NOT a second person
- Match face, body, clothing, hair, and proportions exactly across every panel

---

## ROW 1 — FULL-BODY TURNAROUND (5 panels, left ~60% of sheet)

Five labeled full-body views of the SAME character, aligned side-by-side on a shared baseline:

1. **FRONT** — facing directly toward camera
2. **LEFT** — true 90° left profile
3. **RIGHT** — true 90° right profile
4. **BACK** — full 180° rear view (same subject, rotated — not a second person)
5. **3/4** — approximately 45° angle

Full-Body Requirement (MANDATORY):
- Head fully visible at top — no cropping
- Feet fully visible at bottom — no cropping
- Full silhouette clearly defined within frame
- All five views at identical scale and height — aligned baseline
- Natural relaxed upright stance, slight weight shift is fine
- Clean neutral white or light grey seamless studio background
- Soft key light from front, subtle rim light from behind

Short single-word label beneath each panel: FRONT / LEFT / RIGHT / BACK / 3/4

## ROW 1 RIGHT — FACIAL CLOSE-UPS (2 panels stacked, right ~40% of sheet)

Two portrait close-up panels stacked vertically:

1. **FACE FRONT** — direct face-on portrait, ultra-detailed
2. **FACE PROFILE** — 90° left profile of the face

Requirements:
- Visible pores, fine lines, natural skin imperfections
- Realistic eyes: reflections, moisture, depth, iris detail
- Natural lip texture, hair strands with flyaways
- Consistent identity with all turnaround views
- Calm natural expression, eyes alive and present

Labels: FACE FRONT / FACE PROFILE

---

## ROW 2 — OUTFIT & PROP DETAILS (5 panels, full width)

Five close-up photographic panels:

1. **TORSO** — front upper body: fabric texture, collar, buttons, zipper, print, emblem
2. **LOWER** — lower body: trousers, skirt, boots, shoes — material and construction detail
3. **ACCESSORY** — primary accessory: belt, bag, weapon, watch, jewelry, gear — tight crop
4. **BACK DETAIL** — rear of outfit: collar, back panel, rear accessory, back of hair
5. **PROP** — the character's primary object or tool: 2 small angle views side by side (front + perspective), clean studio light, product-style

Labels: TORSO / LOWER / ACCESSORY / BACK / PROP

---

## ROW 3 — VISUAL REFERENCE PANELS (4 panels, full width)

Four purely visual panels — no paragraph text:

### Panel 1 — COLOR SWATCHES
A grid of 6 solid color chip squares extracted from the character:
- Row 1: skin tone · hair color · primary outfit color
- Row 2: secondary outfit color · eye color · accent / accessory color
Clean solid squares, one short word label beneath each swatch (e.g. SKIN / HAIR / JACKET / PANTS / EYES / BELT)

### Panel 2 — EXPRESSION STATES
Three small portrait close-ups of the same face showing three distinct emotional states:
- NEUTRAL — resting, composed
- INTENSE — focused, determined, or tense
- WARM — open, friendly, or relieved
Same lighting, same framing across all three. Labels: NEUTRAL / INTENSE / WARM

### Panel 3 — SILHOUETTE PROPORTION
A clean full-body silhouette of the character shown as a solid dark shape against white — like a fashion proportion chart. Shows the character's true body ratio, posture, and silhouette outline without color or texture detail. Label: SILHOUETTE

### Panel 4 — IN CHARACTER (MOOD)
One cinematic atmospheric photograph showing the character in their natural environment or emotional context — dramatically lit, evocative, the character is the clear subject. Label: IN CHARACTER

---

## ULTRA-REALISTIC DETAIL

- Skin: visible pores, fine lines, natural imperfections, subsurface scattering
- Eyes: reflections, moisture, iris texture, eyelash detail
- Hair: individual strands visible, flyaways, natural volume
- Fabric: weave texture, stitching, folds, realistic material behavior
- Metal/leather/rubber: accurate material response to light
- Photography: studio soft key + rim light, natural shadows, realistic depth of field

---

## IDENTITY CONSISTENCY (CRITICAL)

The character must be visually IDENTICAL across every panel:
- Same face structure, proportions, and natural asymmetries
- Same outfit design, materials, colors, wear marks
- Same hairstyle and hair color
- Must feel like ONE person documented across a single professional photography session

---

## CRITICAL RESTRICTIONS

DO NOT produce:
- Text paragraphs, spec lists, or written descriptions in any panel
- Cropped body in turnaround section (full body is mandatory)
- Multiple different characters or face drift between panels
- Back view showing a second person (must be same subject rotated)
- CGI, 3D render, anime, cartoon, or concept art aesthetic
- Smooth plastic-looking skin or over-retouched appearance`,

  C02: `# Ultra-Realistic Character Identity Sheet v4.3 (Full-Body Enforced)

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

Output: A single identity sheet image containing 2/3 area full-body multi-angle views, 1/3 area structured detail panels. All views must be complete, consistent, and ultra-realistic, like a professional casting sheet.

FAST EXECUTION MODE: Prioritize identity accuracy and turnaround correctness over panel density. Fewer panels done right beats many panels done poorly. If layout space is constrained, maintain all 5 full-body views and reduce detail panel count before reducing view quality.`,

  C03: `Create a professional character turnaround and reference sheet based on the reference image. Use the uploaded image as the primary visual reference for the character's identity, proportions, facial features, body shape, hairstyle, and overall design language, while translating it into a clean, neutral, reusable presentation board. The final image should be arranged like a polished concept art sheet on a pure white studio background. Show the same character in four full body views: front view, side profile, back view, and three quarter view. On the right side, include multiple clean detail panels with close ups of the eyes, upper face, lower face, lips, skin texture, hair detail, and one small clothing or material detail. Keep the styling neutral and generic so the sheet can be reused as a base template for future adaptations. Simplify anything overly specific, thematic, fantasy based, branded, culturally tied, or heavily ornamental from the source image into a more universal version while preserving the essence of the character. If a second reference image is provided (@Image2), use it as the outfit reference — the character must wear the exact outfit shown in @Image2, preserving its design, colors, materials, and silhouette faithfully. If no outfit reference is provided, the outfit should become a clean neutral base outfit with minimal detailing, soft solid tones, and a refined silhouette. No excessive accessories, no dramatic headpieces, no strong lore specific elements, no heavy decoration unless they are essential to the base identity. The character should feel balanced, elegant, realistic, and adaptable. Expression should be calm and neutral. Makeup should be subtle and natural. Lighting should be soft, even, and studio clean. The layout should feel like a premium design presentation board used for model sheets, character development, or production reference. Preserve the core identity from @Image1, but present it in a simplified, neutral, production ready format that can serve as a universal template for future redesigns.`,

  C04: `# Ultra-Realistic Robot Identity Sheet v4.3 (Full-Body Enforced)

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

  C05: `Create a **professional creature identity sheet** based strictly on the uploaded reference image.

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

  C07: `Create a **photorealistic creature identity sheet** representing the exact same biological entity across multiple views.

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
Lock morphology and surface pattern across all views."`,

  C08: '{ "camera": { "model": "Mamiya RZ67", "lens": "110mm f/2.8" }, "film": { "type": "Kodak Portra 800" }, "skin_details": { "pores": "visible fine pores", "texture": "natural micro-relief skin texture", "vellus_hair": "subtle", "freckles": "natural" }, "shading": { "subsurface_scattering": "melanin-based", "roughness": { "cheeks": "slightly higher", "t_zone": "slightly lower" }, "specular": { "model": "GGX", "ior": 1.48 } }, "geometry_detail": { "micro_displacement": true, "normal_map": "high-resolution" }, "lighting": { "key_light": "soft 45-degree", "fill_light": "low intensity" }, "post_processing": { "plastic_skin": false, "over_retouching": false, "noise_reduction": "minimal" } }, professional photography, cinematic lighting, high detail',

  C09: `Transform the provided character into an ultra-realistic, photorealistic version as if captured by a high-end cinema camera.

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

  C10: `Create a **comprehensive semi-humanoid creature production reference sheet** — a single professional reference board for creature design and visual effects departments.

All panels must be **photographic or painted reference quality only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real creature effects reference board** on a clean neutral background.

---

## HYBRID ANATOMY RULE

The subject is a **semi-humanoid creature** — part human, part non-human. Preserve exact proportions, hybrid features, transition zones, and creature-specific anatomy consistently across every panel.

---

## LAYOUT

### ROW 1 — Full-Body Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | 3/4 |

A-pose or neutral stance. All creature features fully visible in every view:
- wings, horns, claws, tail, spines, scales, armor plates, appendages
- exact silhouette maintained across all 5 views
- both creature and human elements clearly shown in each view

---

### ROW 2 — Facial & Upper Body Detail (3 panels)

| FACE FRONT | FACE SIDE | UPPER BODY |

FACE FRONT — facial close-up showing hybrid features (human eye structure meeting non-human brow, skin transitioning to scale or hide)
FACE SIDE — profile revealing head silhouette, ear/horn placement, jaw structure
UPPER BODY — shoulders and collar zone where human torso meets creature anatomy

---

### ROW 3 — Anatomy Zones (5 panels)

| HUMAN ZONE | CREATURE ZONE | TRANSITION ZONE | APPENDAGE | SCALE REF |

HUMAN ZONE — the most human-looking area of the body (face, chest, or hands)
CREATURE ZONE — the most distinctly non-human area (claws, tail tip, wings, dorsal spine, scaled back)
TRANSITION ZONE — close-up of the exact boundary where human anatomy becomes creature anatomy (skin to scale, flesh to chitin, smooth to textured)
APPENDAGE — detailed view of the primary non-human appendage (wing, tail, claw arm, dorsal fin)
SCALE REF — the creature standing next to a standard adult human silhouette outline showing accurate size relationship

---

### ROW 4 — Expression States (4 panels)

| NEUTRAL | AGGRESSIVE | FEARFUL | FERAL |

Same face/upper body across 4 emotional states. Show how hybrid features respond: do scales flare, do eyes shift, do ears flatten, do markings glow.

---

### ROW 5 — Identity Anchors (5 panels)

| SILHOUETTE | COLOR SWATCHES | MATERIAL MACRO | LIGHT STATE | MOOD |

SILHOUETTE — pure black front-view silhouette against white background
COLOR SWATCHES — 5-8 color tiles: human skin tone, creature primary, creature secondary, highlight, shadow, bioluminescent accent if present
MATERIAL MACRO — extreme close-up of the most distinctive surface texture (scale pattern, hide grain, bioluminescent patch, feather barbs)
LIGHT STATE — the creature under dramatic side-lighting to reveal surface topology and material depth
MOOD — a single environmental frame: the creature at rest in its natural environment, establishing atmosphere and scale

---

## IDENTITY CONSISTENCY CONSTRAINTS

The same hybrid creature must appear in every panel:

* identical skeletal proportions
* identical creature feature placement and count
* identical transition zone anatomy
* identical color distribution and surface textures
* all panels appear as documentation of **one creature reference session**

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written descriptions in any panel
- Generic creature with no human elements present
- Pure human with only cosmetic creature additions
- Inconsistent hybrid anatomy between panels
- Multiple different creature designs presented as the same subject
- Cartoon, anime, CGI-only, or game-engine aesthetic`,

  C11: `Create a **stylized character reference sheet** that exactly matches the art style of the uploaded reference image.

All panels must be rendered in the **exact same art style, line quality, color fill method, and shading approach** as the reference — whether anime, cartoon, flat 2D, cel-shaded, painterly, or illustrated.

The output must look like a **professional animation or illustration character reference board** on a clean neutral background.

---

## STYLE LOCK RULE

Identify and lock the art style from @Image1:
- Line weight, outline presence, and line variation
- Color fill method: flat fill, gradient, cel-shaded, painted, textured
- Shading style: hard cel shading, soft airbrushed, no shading, painterly
- Level of detail: simplified/graphic vs. ornate/detailed
- Eye style: anime, cartoon, realistic-ish, flat icon

Every panel must be rendered identically in this style. Do not drift toward photorealism or change the style between panels.

---

## LAYOUT

### ROW 1 — Full-Body Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | 3/4 |

Neutral A-pose or character's default idle stance. All 5 views in consistent style, consistent scale, consistent line and fill.

---

### ROW 2 — Facial Reference (3 panels)

| FACE FRONT | FACE SIDE | FACE 3/4 |

Larger-scale face close-ups. Show the style's eye design, nose simplification, mouth shape, and hair treatment in detail. All three views must feel like the same character drawn at the same style pass.

---

### ROW 3 — Expression Sheet (5 panels)

| NEUTRAL | HAPPY | ANGRY | SURPRISED | SAD |

Same face/head, 5 emotional states. Show how the art style handles expression: eyebrow shapes, mouth deformation, eye squint, blush marks, sweat drops, shine lines — all style-authentic.

---

### ROW 4 — Style Reference (4 panels)

| LINE WEIGHT | COLOR FILL | SHADING | KEY DETAIL |

LINE WEIGHT — zoomed-in region showing outline thickness variation, line taper, or absence of outlines
COLOR FILL — a surface panel showing the fill method (flat, gradient, hatched, textured)
SHADING — a shadow zone showing how light/shadow is handled in this style
KEY DETAIL — the character's most distinctive design element: hair flow, costume symbol, wing pattern, weapon design

---

### ROW 5 — Identity Anchors (4 panels)

| SILHOUETTE | COLOR PALETTE | SIGNATURE POSE | MOOD |

SILHOUETTE — pure black filled shape of the front view; should be instantly recognizable
COLOR PALETTE — 6-10 color swatches: skin, hair primary, hair secondary, outfit primary, outfit secondary, accent, outline color, eye color
SIGNATURE POSE — the character's most iconic or personality-defining pose (not the neutral A-pose)
MOOD — a single atmospheric panel showing the character in their natural environment or a cinematic moment rendered in full style

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Photorealistic rendering in any panel
- Style drift between panels (each panel must look like the same artist, same pass)
- Text blocks or written descriptions in any panel
- Multiple different art styles within one sheet
- Mixing 2D and 3D aesthetics unless the reference explicitly shows that hybrid`,

  C12: `Create a **child or youth character production reference sheet** with age-accurate proportions.

All panels must be **photographic or rendered quality**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **professional character reference board** on a clean neutral background.

---

## CHILD PROPORTION RULE

Enforce correct age-appropriate anatomy throughout every panel:

* **Toddler (1–3):** head-to-body ratio approximately 1:4, very round face, no visible neck
* **Child (4–8):** ratio approximately 1:5, rounded cheeks, large eyes relative to face, soft features
* **Tween (9–12):** ratio approximately 1:6, transitional features, limbs beginning to lengthen
* **Teen (13–17):** ratio approximately 1:7, approaching adult proportions but softer and less defined

Match the proportions strictly. Do not drift toward adult proportions in any panel.

---

## LAYOUT

### ROW 1 — Full-Body Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | 3/4 |

Relaxed natural stance appropriate to the child's age. All creature features or costume elements fully visible. Consistent scale and head height across all 5 views.

---

### ROW 2 — Facial Reference (3 panels)

| FACE FRONT | FACE SIDE | FACE 3/4 |

Larger-scale face close-ups. Show the child-specific facial structure: rounded jaw, softer nose bridge, larger-appearing eyes, higher forehead ratio, minimal brow ridge. Age must be immediately readable.

---

### ROW 3 — Proportion Reference (3 panels)

| SCALE WITH ADULT | HEAD RATIO | AGE COMPARISON |

SCALE WITH ADULT — the child character standing next to a standard adult silhouette outline (outline only, no real person); shows the height and scale relationship clearly
HEAD RATIO — a panel illustrating the head-to-body proportion of this specific character (head size vs. total body height)
AGE COMPARISON — the same character placed between a younger and older silhouette to anchor their age visually

---

### ROW 4 — Expression States (4 panels)

| NEUTRAL | HAPPY | CRY | MISCHIEF |

Same face, 4 emotional states. Child expressions tend to be more uninhibited and full-face than adult expressions — show that quality.

---

### ROW 5 — Identity Anchors (4 panels)

| SILHOUETTE | COLOR SWATCHES | OUTFIT DETAIL | MOOD |

SILHOUETTE — pure black front-view silhouette; the child proportion must read clearly even as a solid shape
COLOR SWATCHES — 5-6 color tiles: skin, hair, outfit primary, outfit secondary, eye color, accessory
OUTFIT DETAIL — close-up of the most distinctive clothing or accessory element
MOOD — a single atmospheric panel showing the child character in their natural environment

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Adult body proportions applied to a child's face
- Text blocks or written descriptions in any panel
- Inconsistent age proportions between panels
- Mature or adult-coded clothing, poses, or expressions`,

  C13: `Create a **full armor and suit character production reference sheet** — the suit is the primary identity element.

All panels must be **photographic or rendered reference quality**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real armor or suit production reference board** on a clean neutral background.

---

## SUIT IDENTITY RULE

The suit or armor is the primary visual identity. Preserve exact panel geometry, material finish, joint design, and surface detail consistently across every view. If the face is visible through a visor or opening, it must remain consistent — but it is secondary to the suit.

---

## LAYOUT

### ROW 1 — Full Suit Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | 3/4 |

A-pose or power stance. All suit elements fully visible in every view: helmet, pauldrons, chest plate, gauntlets, greaves, boots, backpack unit, visible joints. Consistent scale and lighting across all 5 views.

---

### ROW 2 — Helmet / Head Piece (3 panels)

| HELMET FRONT | HELMET SIDE | HELMET BACK |

Close-up turnaround of the helmet or head piece only. Show visor design, breathing apparatus, sensor placement, aerials, emblem, and surface material. If visor is transparent, show the face visible through it.

---

### ROW 3 — Component Breakdown (5 panels)

| CHEST PLATE | GAUNTLET | BOOT / GREAVE | BACK UNIT | JOINT |

CHEST PLATE — the torso front armor piece: surface texture, emblem, vent design, panel lines
GAUNTLET — one hand/forearm piece: finger articulation, knuckle detail, palm sensor or weapon mount
BOOT / GREAVE — foot and lower leg armor: sole grip, ankle articulation, material
BACK UNIT — the rear torso: backpack, thruster, life support, power cell, or cape attachment
JOINT — one major articulation point (shoulder, elbow, or knee) showing how the armor moves and layers

---

### ROW 4 — Surface & Condition (4 panels)

| MATERIAL MACRO | DAMAGE STATE | INSIGNIA | MECHANISM |

MATERIAL MACRO — extreme close-up of the dominant suit surface: metal grain, painted composite, rubber seal, woven fabric, ceramic tile
DAMAGE STATE — the suit with battle damage or heavy wear: dents, scratches, burn marks, cracked visor, torn fabric
INSIGNIA — any symbol, rank marking, unit badge, faction crest, or serial number on the suit surface
MECHANISM — a functional detail: trigger guard, valve, hinge pin, magnetic lock, cable run, pressurization seal

---

### ROW 5 — Identity Anchors (4 panels)

| SILHOUETTE | COLOR SWATCHES | SCALE REF | MOOD |

SILHOUETTE — pure black front-view silhouette; the suit silhouette must be instantly recognizable
COLOR SWATCHES — 5-7 color tiles: primary armor, secondary armor, visor/lens, padding/undersuit, accent, light source color if any
SCALE REF — the suited character standing next to a standard unarmored adult silhouette outline; shows how the suit changes scale
MOOD — a single cinematic panel of the armored character in their operational environment

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written descriptions in any panel
- Inconsistent suit geometry or panel lines between views
- Visible face or skin in panels where the suit is fully closed
- Multiple different suit designs presented as the same suit
- CGI-only or game-asset aesthetic without photographic reference quality`,

  C14: `Create a **animal character production reference sheet** — a professional reference board for a recurring animal character or companion.

All panels must be **photographic or rendered reference quality**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real animal character reference board** on a clean neutral background.

---

## ANIMAL IDENTITY RULE

The same individual animal must appear in every panel. Preserve exact coat markings, color distribution, body proportions, ear shape, eye color, tail length, and any distinctive features consistently across all views.

---

## LAYOUT

### ROW 1 — Full-Body Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | 3/4 |

Natural neutral stance appropriate to the species (standing for four-legged animals, perched for birds). All distinguishing features visible: markings, ear shape, tail, mane, fur length, feather pattern.

---

### ROW 2 — Head & Extremity Detail (4 panels)

| HEAD FRONT | HEAD SIDE | PAW / CLAW / HOOF | TAIL |

HEAD FRONT — full face close-up: eye color, nose/muzzle structure, ear detail, forehead marking, whiskers
HEAD SIDE — profile showing muzzle length, jaw line, ear placement, cheek structure
PAW / CLAW / HOOF — close-up of the primary foot type: pad texture, claw/nail shape, fur around the foot, hoof structure
TAIL — tail in natural position showing length, fur density, tip color, and carriage angle

---

### ROW 3 — Coat & Marking Pattern (3 panels)

| BACK / TOP VIEW | UNDERBELLY | MARKING MAP |

BACK / TOP VIEW — viewed from directly above showing the full dorsal coat pattern, spine line, color distribution
UNDERBELLY — the underside: lighter coat, skin texture, nursing area if relevant, paw pads viewed from below
MARKING MAP — a simplified flat-view layout of all distinctive markings: spots, stripes, patches, gradient zones, star on forehead — like a "tattoo map" for this animal's coat

---

### ROW 4 — Gait & Behavior States (4 panels)

| STANDING | SITTING / RESTING | RUNNING / MOVING | ALERT |

STANDING — full neutral standing pose (same as Row 1 front view but in a slightly more natural weight distribution)
SITTING / RESTING — the animal in a relaxed seated or lying position appropriate to species
RUNNING / MOVING — mid-motion showing the animal's natural movement gait: trot, gallop, leap, flight, slither
ALERT — head raised, ears forward, tension in the body — the animal noticing something; shows threat/curiosity posture

---

### ROW 5 — Identity Anchors (4 panels)

| SCALE WITH HUMAN | COLOR SWATCHES | FUR / FEATHER MACRO | MOOD |

SCALE WITH HUMAN — the animal standing next to a standard adult human silhouette outline; shows size relationship and whether the animal is small, medium, large, or massive
COLOR SWATCHES — 5-8 color tiles: primary coat, secondary coat, underbelly, eye color, nose/paw pad, claw/nail, marking accent
FUR / FEATHER MACRO — extreme close-up of the coat texture: individual hair strands, scale edges, feather barbs, or smooth skin grain
MOOD — a single atmospheric panel of the animal in its natural habitat, showing personality and environment

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written descriptions in any panel
- Inconsistent coat markings or coloring between panels
- Humanized poses or expressions (no standing on hind legs unless species-appropriate)
- Multiple different animals presented as the same animal
- Cartoon anthropomorphization unless the reference image is stylized`,

  // ─── ENVIRONMENT ──────────────────────────────────────────────────────────

  E01: `Create a **comprehensive environment production reference sheet** — a single professional location reference board used by set designers, art directors, and visual development teams.

All panels must be **photographic or visual only**. No text paragraphs, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real production location board** on a clean white background.

---

## CRITICAL RULE — SINGLE LOCATION ONLY

- Every panel represents the EXACT SAME location
- No new structures, furniture, or elements introduced between panels
- Identical architecture, terrain, ground surfaces, and spatial relationships throughout
- Identical landmark placement — nothing moved between panels
- Consistent lighting direction preserved across all structural view panels

Do NOT add: people, vehicles, animals, logos, or text in any panel.

---

## ROW 1 — SPATIAL OVERVIEW (4 panels, 2×2 grid)

Four labeled photographic views of the same location arranged in a 2×2 grid:

**Top-Left — ESTABLISHING**
Full wide establishing view — complete exterior facade or full-room wide shot showing the entire space, its scale, and overall visual identity.

**Top-Right — SIDE ANGLE**
Side-angle view of the same location — reveals depth, side structures, adjacent terrain, or flanking walls while keeping primary landmarks visible.

**Bottom-Left — AERIAL / ELEVATED**
A slightly elevated three-quarter aerial view — reveals the overall spatial layout: structure placement, pathways, terrain relationships, courtyard or room arrangement.

**Bottom-Right — KEY INTERIOR / FOCAL ZONE**
The most important interior space or primary focal area of the location. Shows scale, ceiling height, fixed furniture, and defining elements.

Labels: ESTABLISHING / SIDE / AERIAL / INTERIOR

---

## ROW 2 — ARCHITECTURAL DETAIL PANELS (5 panels, full width)

Five close-up photographic panels of key structural and material elements:

1. **FLOOR** — floor surface: stone flags, wooden planks, tile mosaic, carpet, concrete, soil — texture, wear, and pattern detail
2. **WALL** — wall treatment: plaster, brick, paneling, tapestry, carved stone, wallpaper, graffiti, glass — material and age detail
3. **CEILING** — overhead: beams, vaulted arches, pipes, chandeliers, skylights, painted fresco, exposed rafters
4. **SIGNATURE ELEMENT** — the single most distinctive design feature of this location
5. **THRESHOLD** — the entry point: door, gate, archway, airlock, torii gate, school gate

Labels: FLOOR / WALL / CEILING / SIGNATURE / THRESHOLD

## ROW 2 RIGHT — SURFACE & LIGHT DETAILS (3 panels stacked)

1. **MATERIAL** — extreme close-up of the primary surface material
2. **WEAR** — natural aging and history: scratches, moss, water stains, paint peeling, oxidation, scorch marks, dust, patina
3. **LIGHT SOURCE** — tight close-up of the primary light source or light entry point

Labels: MATERIAL / WEAR / LIGHT SOURCE

---

## ROW 3 — VISUAL REFERENCE PANELS (4 panels, full width)

### Panel 1 — COLOR SWATCHES
A grid of 6 solid color chip squares extracted from the location's surfaces.

### Panel 2 — LIGHTING RANGE STRIP
Four small panels side-by-side showing the same location angle under four lighting conditions:
- DAWN — cool blue-grey pre-light
- DAY — full natural or artificial light
- DUSK — warm golden or amber
- NIGHT — dark with practical lights only

### Panel 3 — CAMERA ANGLE THUMBNAILS
Three small thumbnail compositions showing suggested key camera angles: WIDE / MID / INSERT

### Panel 4 — MOOD REFERENCE
One cinematic atmospheric photograph of the location — the definitive "how it feels" shot. Label: MOOD

---

## IDENTITY CONSISTENCY (CRITICAL)

The location must be recognizably IDENTICAL across all structural panels:
- Identical architecture, materials, and spatial proportions
- Must feel like ONE real place photographed from multiple camera positions during one visit

---

## PHOTOGRAPHY STYLE

- Real location photography feel — not architectural CGI renders
- Ultra-realistic: visible material grain, natural shadows, realistic depth
- No cartoon, no CGI, no game-engine render, no concept art, no stylized illustration

---

## CRITICAL RESTRICTIONS

DO NOT produce:
- Text paragraphs or written descriptions in any panel
- Different architectural styles or layouts between panels
- People, vehicles, or animals in any panel
- CGI, 3D render, or game-engine aesthetic`,

  E02: `Use **Image 1 as the base reference environment**.

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
A wide establishing view matching the main front perspective of the environment seen in Image 1.

**Panel 2 (Top-Right) — Side Perspective**
A side-angle view of the same location, revealing the depth, side structures, and surrounding terrain.

**Panel 3 (Bottom-Left) — Elevated / Aerial Perspective**
A slightly elevated three-quarter aerial view revealing the overall layout of the environment.

**Panel 4 (Bottom-Right) — Environmental Detail Perspective**
A closer environmental view highlighting architectural details, materials, textures, surfaces, and ground elements.

---

## Consistency Rules

Maintain **strict environmental continuity across all panels**:

* identical architecture and structures
* identical terrain layout
* identical ground elements (rocks, paths, water, vegetation)
* identical scale and spatial positioning
* identical landmark placement

---

## Lighting & Atmosphere

Preserve the **exact lighting conditions and atmospheric qualities** from Image 1.

---

## Style Requirements

The result must appear as **real photography of the same location captured from different camera positions**.

---

## Restrictions

Do **not** add: people, vehicles, animals, logos, text, watermarks, new buildings or objects.

FAST EXECUTION MODE: Prioritize spatial consistency and correct 2×2 grid layout over panel density.`,

  E03: `Create a **photorealistic environment identity sheet** representing the exact same interior space photographed from multiple angles during a single controlled session.

The result must look like **real architectural / real estate photography**, not CGI, 3D render, or staged concept art.

---

## Core Identity Lock (CRITICAL)

The environment must behave as a **fixed physical space**.

### Master Layout Anchor (MANDATORY)

* The **wide corner shot (diagonal view)** is the master reference defining: wall positions, room proportions, door and window placement, furniture layout

**All other views must strictly conform to this layout**

### Spatial Geometry Lock

* Room dimensions must remain identical
* Walls, ceiling height, and floor area must not change
* Doors and windows must remain in exact positions

### Furniture & Object Lock

* All furniture must remain: same position, same orientation, same scale

### Material & Surface Lock

Maintain identical: wall color and texture, flooring material, furniture materials, reflections and gloss levels

### Lighting Direction Lock (VERY IMPORTANT)

* Sunlight direction must remain consistent
* Window light must match across all views

---

## Layout

Two horizontal rows forming a **real estate contact sheet**

### Top Row — Spatial Structure (5 images)

1. Wide corner shot (MASTER LAYOUT)
2. Opposite corner wide shot
3. Straight-on wall view (main feature wall)
4. Secondary wall / angle
5. Entry view (door perspective)

### Bottom Row — Detail & Material (4 images)

1. Floor material close-up
2. Wall texture / finish
3. Furniture detail
4. Lighting interaction (sunlight / lamp on surfaces)

---

## Critical Restrictions

Must NOT resemble: CGI render, interior concept art, unrealistic staging.

AI Lock Instruction: "Lock environment as a fixed architectural space. Use the wide corner shot as master layout. Maintain identical geometry, furniture placement, and lighting direction across all views."`,

  E04: `# Cinematic Travel Destination — Photorealistic Scene

Create a **photorealistic travel scene** that captures the essence of the described destination. The result must feel like **real cinematic travel footage** — not CGI, not a stock photo, not an illustration.

---

## Visual Identity (Soft Lock)

Maintain across all generated shots:
- **Same color grading** — warm, natural, cinematic palette
- **Same mood and atmosphere** — immersive, inviting, aspirational
- **Same time of day and lighting tone** — golden hour preferred, or match the described setting
- **Same camera language** — cinematic, deliberate, storytelling-driven

---

## Camera & Cinematography

- **Lens**: 24mm–85mm equivalent
- **Style**: Cinematic travel documentary — smooth, intentional framing
- **Movement feel**: Slow drone glide, steady tracking, or locked tripod — NO handheld shake
- **Depth of field**: Natural, moderate — environment is the subject
- **Aspect ratio**: 16:9 widescreen preferred

---

## Lighting & Atmosphere

- Golden hour warmth OR moody blue hour — match the destination's character
- Natural light only — sunlight, cloud diffusion, ambient glow
- Realistic atmospheric effects — haze, mist, light rays through trees/buildings

---

## Environment Realism

- Real-world materials — stone, water, sand, foliage, architecture
- Weather-appropriate details
- Human presence optional but if included: natural poses, local clothing, candid

---

## Shot Composition Guide

1. **Hero Wide** — Establishing shot, full destination reveal
2. **Immersive Medium** — Viewer feels present
3. **Intimate Detail** — Texture, local element, cultural artifact
4. **Human Scale** — Person or silhouette for emotional weight
5. **Departure/Transition** — Cinematic closure

---

## Strict Negative Constraints

Do NOT produce:
- Stock photo aesthetic
- HDR over-processing or oversaturated colors
- CGI or 3D render appearance
- Text overlays, watermarks, or UI elements
- Anime, illustration, or painterly style

---

## Output

Produce a **single photorealistic image** that looks like a frame from a high-end travel documentary or luxury tourism campaign.`,

  E05: `# Airbnb & Property Showcase — Photorealistic Marketing Shot

Create a **photorealistic property showcase image** that makes the space feel warm, inviting, and aspirational — like the best Airbnb listing photo or a boutique hotel campaign shot.

The result must look like **real professional property photography**, not CGI or virtual staging.

---

## Visual Style — "I Want to Stay Here"

The image must trigger an emotional booking impulse:
- **Warm and inviting** — cozy lighting, lived-in but pristine
- **Aspirational but attainable** — luxury without intimidation
- **Lifestyle-focused** — show how it FEELS to be in this space

---

## Photography Style

- **Lens**: 16mm–35mm wide angle (interior) or 35mm–85mm (exterior/detail)
- **Camera height**: Low tripod (~waist height) for interiors
- **Lighting**: Natural window light + warm ambient. Golden hour for exteriors
- **Color grading**: Warm whites, soft shadows, no harsh contrast

---

## Interior Shot Rules

- Shoot from corners or doorways to maximize visible space
- Include at least one window with natural light streaming in
- Bed/sofa must look freshly made with textured linens
- Add lifestyle touches: open book, coffee cup, fresh flowers, soft throw blanket
- No clutter, but not sterile — "curated casual"

---

## Exterior Shot Rules

- Show the property within its environment (garden, street, view)
- Include outdoor living space if applicable (patio, balcony, pool)
- Time of day: golden hour or blue hour preferred

---

## Strict Negative Constraints

Do NOT produce:
- Empty, cold, sterile rooms
- Virtual staging that looks fake
- Over-saturated or HDR look
- CGI or 3D render aesthetic

---

## Output

Produce a **single photorealistic image** that looks like a professional Airbnb Superhost or boutique hotel marketing photograph.`,

  E06: `# Guided Tour Experience — Immersive POV Scene

Create a **photorealistic tour experience image** that makes the viewer feel like they are physically present — walking through, exploring, and discovering. The result must feel like a real moment captured during an actual visit.

This is NOT a brochure photo. This is a **"you are here"** moment.

---

## Experience Types (match to description)

### Zoo / Wildlife Park
- Animals in naturalistic enclosures, not cages
- Visitor perspective: looking through glass, over railings, along pathways
- Animals in natural behavior: feeding, resting, playing, moving

### Museum / Gallery
- Perspective: standing in front of exhibits, walking through halls
- Dramatic gallery lighting on exhibits
- Other visitors as background context

### Walking Tour / Area Tour
- Street-level perspective, following a path or route
- Local architecture, signage, street life
- Discovery moments: turning a corner, arriving at a viewpoint

### Food & Market Tour
- Market stalls with colorful produce, spices, local goods
- Street food preparation: steam, flame, motion
- Sensory richness: textures, colors, steam

---

## Camera Style — "First Person Travel"

- **Lens**: 24mm–50mm (immersive but not distorted)
- **Height**: Eye level — viewer's natural perspective
- **Style**: Documentary / travel vlog aesthetic

---

## Storytelling Beat Structure

1. **Arrival** — First glimpse, entrance, gate, threshold
2. **Discovery** — "Wow" moment — main attraction reveal
3. **Immersion** — Deep inside the experience, surrounded by it
4. **Detail** — Close-up of something fascinating, unique, or beautiful
5. **Memory** — The shot you'd share on Instagram

---

## Human Element Rules

- People as context, not subjects
- Natural crowd density — not empty, not packed
- No one looking at camera (candid only)

---

## Strict Negative Constraints

Do NOT produce:
- Brochure / stock photo aesthetic
- Empty, sterile environments
- Posed group photos
- Cartoon or illustrated style

---

## Output

Produce a **single photorealistic image** that feels like an authentic moment captured during a real guided tour experience.`,

  E07: `# Luxury Resort & Hotel Marketing — Premium Campaign Shot

Create a **photorealistic luxury hospitality image** suitable for a 5-star hotel marketing campaign, resort website hero image, or luxury travel magazine spread.

The result must feel like it was shot by a **professional hospitality photographer** — aspirational, warm, and effortlessly elegant.

---

## Visual Identity — "Effortless Luxury"

- **Tone**: Warm, sophisticated, serene
- **Feel**: You can almost feel the temperature, hear the water, smell the lobby
- **Style**: Editorial luxury — somewhere between Condé Nast Traveller and Aman Resorts

---

## Scene Categories (match to description)

### Infinity Pool & Water Features
- Pool edge meeting horizon (ocean, jungle, mountains)
- Turquoise water with realistic caustics and reflections
- Towels, sun loungers, cocktails as styling elements
- Golden hour or blue hour lighting preferred

### Lobby & Public Spaces
- Grand entrance with natural light
- Architectural drama: high ceilings, statement lighting, natural materials
- Fresh flowers, subtle fragrance implied through visual cues

### Suite & Bedroom
- King bed with premium layered linens
- View through floor-to-ceiling windows
- Warm bedside lighting, twilight through window

### Restaurant & Dining
- Plated dish as art — chef's presentation
- Table setting with candles, linen, glassware
- View from the table (ocean, garden, city skyline)

### Spa & Wellness
- Treatment room: warm stones, oil, candles, folded towels
- Natural materials: wood, stone, water features

---

## Lifestyle Touches (Critical)

Every shot must include at least ONE human-scale lifestyle element:
- An open book by the pool
- A half-drunk cocktail on the balcony railing
- Steam rising from a coffee cup at sunrise
- Bare footprints in sand leading to the water

---

## Strict Negative Constraints

Do NOT produce:
- Empty, uninviting spaces
- Harsh overhead lighting
- Stock photo people with fake smiles
- CGI or 3D render look

---

## Output

Produce a **single photorealistic image** that looks like a professional luxury hospitality campaign photograph — warm, inviting, and magazine-ready.`,

  E08: `# Street & Cultural Explorer — Authentic Local Scene

Create a **photorealistic street-level cultural scene** that captures the authentic energy, texture, and soul of a real place. The result must feel like a candid travel photograph taken by someone who truly understands and respects the location.

This is NOT tourism marketing. This is **real travel photography** — raw, beautiful, honest.

---

## Visual Style — "The Real Place"

- **Tone**: Authentic, warm, alive
- **Feel**: Documentary travel photography meets Instagram travel creator
- **Influence**: Steve McCurry meets modern travel vlogger

---

## Scene Categories (match to description)

### Street Market / Bazaar
- Overhead spice displays, colorful produce, stacked goods
- Vendor hands preparing, measuring, packaging
- Mixed lighting: sunlight through canopy + bare bulbs
- Steam, smoke from cooking, dust particles in light

### Street Food Scene
- Chef/vendor actively cooking — flame, wok toss, steam
- Close-up of finished dish with authentic presentation
- Condiments, sauces, chopsticks, paper plates
- Night market glow: neon, lanterns, bare bulbs

### Traditional Neighborhood
- Narrow streets, balconies, laundry lines, potted plants
- Weathered walls with character — peeling paint, old tile, patina
- Local residents going about daily life (NOT posing)

### Temple / Sacred Space
- Respectful distance, architectural grandeur
- Incense smoke, candle light, flower offerings
- Quiet atmosphere — even in a busy place

### Festival / Celebration
- Color explosion: costumes, decorations, face paint
- Motion blur on dancers, sharp on spectators

---

## Camera Style — "Street Photographer"

- **Lens**: 35mm–50mm (classic street photography)
- **Style**: Candid, decisive moment, never staged
- **Depth of field**: Moderate — subject in context, not isolated

---

## Authenticity Rules (Critical)

- Local materials, real architecture, real textures
- Food must look like REAL local food, not westernized versions
- Clothing must be culturally accurate
- Signage in local language (if visible)
- Imperfections are features: cracked pavement, tangled wires, mismatched chairs

---

## Human Element

- People are part of the scene, not the subject
- Natural activity: shopping, eating, praying, chatting, working
- No one looking at camera
- Culturally respectful representation

---

## Strict Negative Constraints

Do NOT produce:
- Western/tourist perspective clichés
- Poverty exploitation imagery
- Overly clean or sanitized version of real places
- Instagram filter over-processing
- Cartoon, illustration, or painterly style

---

## Output

Produce a **single photorealistic image** that feels like an authentic street-level travel photograph — alive, textured, and culturally rich.`,

  E09: `# Nature & Adventure Landscape — Epic Outdoor Scene

Create a **photorealistic nature and adventure scene** that captures the raw grandeur and emotional power of the natural world. The result must feel like a **National Geographic photograph** or a frame from a premium nature documentary.

---

## Visual Identity — "Earth is the Subject"

- **Tone**: Awe-inspiring, vast, humbling
- **Scale**: The landscape dominates — humans are small within it
- **Light**: Natural, dramatic, weather-dependent

---

## Scene Categories (match to description)

### Mountain & Alpine
- Snow-capped peaks with cloud interaction
- Hiking trail with lone figure for scale
- Dramatic weather: clearing storm, first light on summit

### Tropical & Coastal
- Turquoise water with realistic wave patterns
- Jungle canopy: light filtering through layers
- Cliff coastline: sea spray, dramatic erosion

### Safari & Wildlife
- Animals in natural habitat — not zoo, not staged
- African savanna: golden grass, acacia trees, dust
- Golden hour or dramatic storm light

### Forest & Woodland
- Light rays through canopy (god rays)
- Mossy forest floor, fallen trees, mushrooms
- Trail disappearing into depth — mystery and invitation

### Desert & Arid
- Sand dune patterns, wind-sculpted rock
- Star trails or milky way (if night scene)
- Heat shimmer on horizon

### Waterfall & River
- Long exposure feel: silky water texture
- Mist and spray catching light (rainbow possible)
- Wet rock surfaces with realistic reflections

---

## Camera Style — "Adventure Photographer"

- **Lens**: 16mm–24mm ultra-wide for landscape, 200mm+ for wildlife
- **Style**: National Geographic editorial
- **Golden hour**: Preferred for most landscapes

---

## Human Element (Optional but Powerful)

When a person appears:
- Small in frame — establishes SCALE of the landscape
- Wearing appropriate gear (hiking boots, backpack, wetsuit)
- Looking INTO the scene, not at camera
- Silhouette against dramatic sky is very effective

---

## Strict Negative Constraints

Do NOT produce:
- Fantasy landscapes (floating islands, impossible geology)
- Over-saturated "screensaver" images
- Cartoon or illustrated style
- Animals in unnatural settings or poses

---

## Output

Produce a **single photorealistic image** that feels like a professional nature/adventure photograph — dramatic, authentic, and emotionally powerful.`,

  E10: `Create a **comprehensive historical period location production reference sheet** — a single professional reference board for production design and set construction departments.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real location scout reference board** on a clean white background.

---

## PERIOD RULE

This template is for **historical and period locations** — pre-modern, ancient, medieval, Renaissance, colonial, Victorian, feudal, or other era-specific settings. Examples: castle courtyard, Roman bath, temple ruin, medieval market square, samurai village, colonial plantation, Victorian alley, ancient palace, monastery cloister, Greek agora.

All panels must represent **one historically consistent location** with period-accurate materials, construction methods, and weathering.

---

## LAYOUT

### ROW 1 — Spatial Overview (4 panels)

| ESTABLISHING | SIDE ANGLE | ELEVATED | REAR VIEW |

ESTABLISHING — wide-angle view from the primary approach showing full scope, dominant structures, and era-defining architecture
SIDE ANGLE — view from the side revealing spatial depth, layered structures, and surrounding period environment
ELEVATED — slightly elevated view showing spatial layout, courtyard or plaza footprint, structural relationships
REAR VIEW — looking back from inside revealing secondary structures, service areas, or back-wall architecture

---

### ROW 2 — Period Architectural Detail (5 panels)

| STRUCTURE | SURFACE | ENTRANCE | SIGNATURE | DECAY |

STRUCTURE — primary load-bearing element: stone arch, timber frame, clay brick, carved column, iron gate, wooden palisade
SURFACE — dominant wall or floor finish: dressed stone, exposed brick, whitewashed plaster, carved wood, mosaic, packed earth, cobblestone
ENTRANCE — main gateway, door, arch, or threshold revealing period craftsmanship and scale
SIGNATURE — the single most iconic feature: rose window, well, throne dais, bell tower, market stalls, forge, altar, battlement
DECAY — most weathered area: crumbled stonework, rotted timber, moss-covered surface, corroded iron, faded fresco

---

### ROW 3 — Material & Light (3 panels)

| MATERIAL MACRO | CRAFTSMANSHIP | LIGHT QUALITY |

MATERIAL MACRO — extreme close-up of the primary building material: stone grain, wood grain, fired clay texture, mortar joints, hand-hewn marks
CRAFTSMANSHIP — close-up of a handmade detail: carved relief, wrought iron work, hand-thrown pottery, woven textile, painted surface
LIGHT QUALITY — how natural or flame light falls here: window shaft through dust, torch on stone, diffused canopy light

---

### ROW 4 — Lighting Range Strip (5 panels)

| COLOR SWATCHES | DAWN | MIDDAY | DUSK | NIGHT |

COLOR SWATCHES — 6-8 color tiles: primary stone/timber, ground surface, aged metal, dominant vegetation, shadow tone, warm accent, sky
DAWN — early morning light (cold blue, raking light across stone textures, morning mist)
MIDDAY — full overhead sun (hard shadows, bleached stone, maximum detail visibility)
DUSK — golden hour (warm amber, long shadows, fires or torches beginning to glow)
NIGHT — after dark: torch light, oil lamp glow, moonlight on stone — pre-electric era lighting only

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

Four tiny thumbnails at different focal lengths — guides cinematography planning for this period location.

---

### ROW 6 — Mood (1 wide panel, full width)

| ————————————————— MOOD ————————————————— |

A single cinematic-quality establishing panel presenting this historical location at its most atmospheric and emotionally resonant moment.

---

## PERIOD CONSISTENCY CONSTRAINTS

* All structural elements must match one consistent historical era — no anachronistic mixing
* Materials must reflect pre-industrial construction: stone, timber, clay, iron, thatch, plaster
* No modern materials, fixtures, signage, or infrastructure in any panel

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, labels, or written descriptions in any panel
- Modern elements: electricity, contemporary vehicles, signage, plastic, glass curtain walls
- Multiple historical eras mixed in one location
- People, animals, or vehicles in any panel
- CGI, 3D render, or game-engine aesthetic`,

  E11: `Create a **comprehensive pure interior production reference sheet** — a single professional reference board for production design, set construction, and cinematography departments.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real location scout reference board** on a clean white background.

**@Image1 is optional** — use it as a style, mood, or layout reference if provided. Generate from description alone if no reference is supplied.

---

## INTERIOR RULE

This template is for **fully enclosed interior spaces** with no exterior or aerial access. Examples: cockpit, classroom, dungeon, prison cell, monastery hall, submarine module, cave chamber, cathedral nave, nightclub, kitchen, bedroom, laboratory, boiler room, server room.

All panels must represent **one continuous interior space** photographed from different positions.

---

## LAYOUT

### ROW 1 — Spatial Overview (4 panels)

| TOP-DOWN | ESTABLISHING | SIDE ANGLE | REAR VIEW |

TOP-DOWN — camera at ceiling level looking steeply downward; reveals full floor plan, furniture placement, and room geometry
ESTABLISHING — wide-angle view from main entry showing full room depth, ceiling height, and dominant spatial composition
SIDE ANGLE — camera against the longest wall showing room width, depth layers, and spatial extent
REAR VIEW — looking back toward the entry from inside the space

---

### ROW 2 — Architectural Detail (5 panels)

| FLOOR | WALL | CEILING | SIGNATURE | THRESHOLD |

FLOOR — floor surface: material, texture, wear patterns, tile joints, transitions
WALL — representative wall section: finish, texture, paint, plaster, tile, stone, wood panel, or industrial surface
CEILING — looking straight up: beams, vaulted structure, lighting fixtures, painted surface, pipes, or bare construction
SIGNATURE — the single most iconic or story-critical zone: throne, control panel, altar, fireplace, window wall, machine bay
THRESHOLD — the doorway, arch, or transition point between this space and what lies beyond

---

### ROW 3 — Surface & Light (3 panels)

| MATERIAL MACRO | WEAR DETAIL | LIGHT SOURCE |

MATERIAL MACRO — extreme close-up of the dominant interior surface: grain, texture, age, craftsmanship, or industrial finish
WEAR DETAIL — close-up of the most used or aged area: shows occupant history, scratches, stains, fading, or damage
LIGHT SOURCE — the primary lighting element in close focus: window light quality, practical lamp, torch, skylight, fluorescent tube

---

### ROW 4 — Lighting Range Strip (5 panels)

| COLOR SWATCHES | DAWN | DAY | DUSK | NIGHT |

COLOR SWATCHES — 6-8 color tiles: primary wall, floor, ceiling, dominant fixture, accent, shadow pool, light spill
DAWN — same establishing view under early morning light
DAY — same establishing view under full ambient daylight or full artificial illumination
DUSK — late afternoon or transitional state (warm amber, long shadows, practicals beginning to activate)
NIGHT — same space after dark: only practical sources active, deep shadow pools, strong contrast

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

Four tiny thumbnails showing the interior photographed at different focal lengths from the same interior position.

---

### ROW 6 — Mood (1 wide panel, full width)

A single cinematic-quality wide panel presenting this interior at its most atmospheric and emotionally resonant moment.

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec lists, or written descriptions in any panel
- Exterior aerial photography (this is pure interior only)
- Multiple different interiors presented as the same space
- People, animals, or vehicles in any panel
- CGI, 3D render, or game-engine aesthetic`,

  E12: `Create a cinematic wide-angle establishing shot of {description}. The image should feel like a single frame from a high-budget film — composed with clear foreground, midground, and background layers that create depth. Photorealistic rendering with atmospheric perspective — distant elements slightly hazed, close elements sharp and detailed. Cinematic lighting appropriate to the time of day and mood specified. Include environmental storytelling details: wear on surfaces, lived-in textures, ambient elements like dust particles, fog, or light rays. The composition should use leading lines to draw the eye through the scene. Shot on ARRI Alexa look — natural color science, subtle lens characteristics. No characters or people in the frame. The environment should feel real, grounded, and production-ready as a storyboard background plate.`,

  E13: `Create a **science fiction and futuristic environment production reference sheet** — a single professional reference board for production design and VFX departments.

All panels must be **photographic or rendered reference quality**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real VFX or concept production reference board** on a clean white background.

---

## SCI-FI ENVIRONMENT RULE

This template is for **science fiction and futuristic locations** — settings that do not exist in the real world today. Examples: space station corridor, cyberpunk street at night, alien planet surface, future megacity skyline, orbital research platform, spacecraft interior, underground bunker.

All panels must represent **one consistent fictional location** with internally coherent technology, material palette, and lighting logic.

---

## LAYOUT

### ROW 1 — Spatial Overview (4 panels)

| ESTABLISHING | SIDE ANGLE | ELEVATED / ORBITAL | INTERIOR JUNCTION |

ESTABLISHING — primary wide view showing the location's full scope, dominant architectural forms, and sci-fi scale
SIDE ANGLE — reveals depth layers, structural complexity, and surrounding technological environment
ELEVATED / ORBITAL — high-angle or bird's-eye view showing layout; for space environments: orbital or exterior hull perspective
INTERIOR JUNCTION — the point where exterior meets interior (airlock, docking bay, corridor entry, plaza edge)

---

### ROW 2 — Technological Architectural Detail (5 panels)

| STRUCTURE | SURFACE | TECH DETAIL | SIGNATURE | LIGHT SOURCE |

STRUCTURE — primary load-bearing or spatial-defining element: hull plating, space frame, reactor column, transit tube, mega-structure strut
SURFACE — dominant surface finish: brushed titanium, carbon composite, alien mineral, concrete-polymer, corroded metal, bio-organic growth
TECH DETAIL — a functional technological element: panel array, vent system, conduit run, holographic emitter, sensor cluster
SIGNATURE — the single most visually distinctive or story-critical feature: reactor core, command tower, alien artifact, central nexus
LIGHT SOURCE — close-up of the primary artificial or alien light source: LED grid, plasma vent, bioluminescent organism, hologram projector

---

### ROW 3 — Material & Atmosphere (3 panels)

| MATERIAL MACRO | TECH MACRO | ATMOSPHERE |

MATERIAL MACRO — extreme close-up of the dominant structural material: surface texture, weathering, corrosion, alien mineral grain
TECH MACRO — extreme close-up of technology at surface level: circuit trace, cooling fin array, joint seal, display pixel grid
ATMOSPHERE — ambient environment: particle debris in zero-g, atmospheric haze on alien planet, steam venting, energy field shimmer

---

### ROW 4 — Operational State Strip (5 panels)

| COLOR SWATCHES | IDLE | ACTIVE | ALERT | OFFLINE |

COLOR SWATCHES — 6-8 tiles: primary hull, secondary surface, primary light color, secondary light, accent/indicator, shadow, alien/organic element
IDLE — the location in low-power or standby mode (dim ambient light, minimal activity)
ACTIVE — full operational state (all systems running, lighting at designed intensity, full atmosphere)
ALERT — emergency or combat state (red emergency lighting, alarm indicators, heightened activity)
OFFLINE — power failure or derelict state (only emergency or natural light, dark interiors, inactive technology)

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

---

### ROW 6 — Mood (1 wide panel, full width)

A single cinematic-quality wide establishing panel at the location's most dramatic or atmospheric operational state.

---

## SCI-FI CONSISTENCY CONSTRAINTS

* All technology must reflect one consistent technological era — no anachronistic mixing
* Material palette must remain consistent across all panels
* Lighting color language must be consistent

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, labels, or written descriptions in any panel
- Real-world contemporary architecture unexplained by the fiction
- People, animals, or vehicles in any panel
- Cartoon or low-quality game-engine aesthetic`,

  E14: `Create a **fantasy and magical environment production reference sheet** — a single professional reference board for production design and concept art departments.

All panels must be **painted or rendered reference quality**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real fantasy production reference board** on a clean white background.

---

## FANTASY ENVIRONMENT RULE

This template is for **magical and fantastical locations** where the impossible is real. Examples: enchanted forest with glowing flora, floating island citadel, wizard's tower, fairy ring clearing, ancient magical ruin with active wards, underwater magical kingdom, cloud palace, dimensional rift gate, mythical dragon lair.

All panels must represent **one consistent magical location** with its own internal logic of how magic manifests visually.

---

## LAYOUT

### ROW 1 — Spatial Overview (4 panels)

| ESTABLISHING | SIDE ANGLE | ELEVATED | MAGICAL FOCUS |

ESTABLISHING — primary wide view showing the location's full scope, dominant impossible geometry, and magical scale
SIDE ANGLE — reveals spatial depth, how magical elements layer and interact
ELEVATED — high-angle or bird's-eye view; for floating locations: the underside or aerial approach
MAGICAL FOCUS — a closer establishing view centered on the most magical, impossible, or awe-inspiring element

---

### ROW 2 — Structural & Magical Detail (5 panels)

| STRUCTURE | ORGANIC GROWTH | MAGICAL ELEMENT | SIGNATURE | BOUNDARY |

STRUCTURE — primary architectural or geological element: ancient stone arch, crystal spire, living tree trunk, enchanted ruin wall
ORGANIC GROWTH — how nature has merged with or been transformed by magic: glowing moss, crystallized vines, floating flower petals
MAGICAL ELEMENT — a distinctly impossible visual detail: floating rocks, rune glowing in stone, portal shimmer, arcane energy tendril
SIGNATURE — the single most iconic or story-critical feature: the ancient altar, the world tree, the crystal heart, the sealed gate
BOUNDARY — the edge where this magical space meets the ordinary world

---

### ROW 3 — Surface & Light (3 panels)

| MATERIAL MACRO | MAGICAL MATERIAL | MAGICAL LIGHT |

MATERIAL MACRO — extreme close-up of the primary non-magical surface: ancient stone grain, carved wood, mossy ground, mineral crystal
MAGICAL MATERIAL — extreme close-up of a magically altered or impossible material: glowing rune carving, enchanted metal, crystallized magic
MAGICAL LIGHT — how magical or supernatural light sources illuminate this space: rune glow on stone, arcane fire color, fairy light scatter

---

### ROW 4 — Lighting Range Strip (5 panels)

| COLOR SWATCHES | DAWN | DAY | DUSK | NIGHT |

COLOR SWATCHES — 6-8 tiles: primary stone/earth, organic/plant tone, primary magical glow color, secondary magical glow, shadow, atmospheric haze
DAWN — early morning light mixing with residual magical glow from the night
DAY — full ambient natural light; magic is present but less dominant
DUSK — warm fading light where magical elements begin to wake or intensify
NIGHT — darkness with magical illumination dominant: glowing runes, floating lights, bioluminescent organism — the location at its most magical

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

---

### ROW 6 — Mood (1 wide panel, full width)

A single cinematic-quality establishing panel at the location's most magical and emotionally powerful moment.

---

## FANTASY CONSISTENCY CONSTRAINTS

* The same impossible geometry and magical rules must apply across all panels
* Magical glow colors must be consistent
* Both natural and magical elements must coexist in every panel

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, labels, or written descriptions in any panel
- Purely mundane/realistic environment with no magical elements
- People, animals, or vehicles in any panel
- Modern technology or contemporary real-world elements`,

  // ─── PROP ─────────────────────────────────────────────────────────────────

  P01: `Create a **comprehensive object production reference sheet** — a single professional reference board used by prop departments and visual development teams.

All panels must be **photographic only**. No text blocks, no spec lists, no written notes — only images, color swatches, and short single-word panel labels.

The output must look like a **real production prop reference board** on a clean white background.

---

## UNIVERSAL SCALE RULE

The object may be any real-world size — small (jewelry, coins), handheld (tools, bottles, phones), medium (luggage, furniture), large (vehicles, machinery), or oversized (industrial equipment, aircraft).

---

## ROW 1 — STRUCTURAL TURNAROUND + SURFACE DETAILS

### Left ~65% — STRUCTURAL VIEWS (4 panels side-by-side)

1. **FRONT** — object facing directly toward camera
2. **LEFT** — slightly angled left, revealing depth and side structure
3. **RIGHT** — opposite angle, showing the other side
4. **REAR** — back of the object

Labels: FRONT / LEFT / RIGHT / REAR

### Right ~35% — SURFACE DETAILS (3 panels stacked)

1. **PRIMARY SURFACE** — the most recognizable or functional face of the object, shot tight and clean
2. **MATERIAL** — extreme close-up showing grain, texture, stitching, weave, scratches, manufacturing marks, patina
3. **LIGHT** — same surface showing how light reacts: specular highlight, matte scatter, gloss sheen, metallic reflection, translucency, or roughness

Labels: SURFACE / MATERIAL / LIGHT

---

## ROW 2 — CONSTRUCTION & COMPONENT DETAILS (5 panels, full width)

1. **MECHANISM** — primary functional element: lock, clasp, hinge, trigger, dial, switch, cap, valve, buckle
2. **JOIN** — how parts connect: seam, weld, glue line, stitching, rivet, press-fit, screw head, folded edge
3. **WEAR** — natural aging and imperfection: scratches, oxidation, staining, dents, fading, patina, chips
4. **MARKING** — any stamp, label, serial number, logo, insignia, or engraving
5. **SCALE** — the object held in a human hand, or placed beside a recognizable reference to establish true real-world size

Labels: MECHANISM / JOIN / WEAR / MARKING / SCALE

---

## ROW 3 — VISUAL REFERENCE PANELS (4 panels, full width)

### Panel 1 — COLOR SWATCHES
A grid of 6 solid color chip squares extracted from the object's actual surfaces.

### Panel 2 — MATERIAL MACRO SAMPLES
Three side-by-side full-frame macro photographs, each isolating a different material used in the object.

### Panel 3 — CONDITION RANGE (NEW vs WORN)
Two photographs side-by-side showing the same section of the object: LEFT = pristine / as-new condition; RIGHT = aged / worn / used condition.
Labels: NEW · WORN

### Panel 4 — IN CONTEXT
One cinematic photograph showing the object in its natural environment or in active use.
Label: IN USE

---

## IDENTITY CONSISTENCY (CRITICAL)

The object must be visually IDENTICAL across every panel:
- Same shape, proportions, material finish, color tone, and wear marks
- Must feel like ONE physical object documented in a single photography session

---

## CRITICAL RESTRICTIONS

DO NOT produce:
- Text paragraphs, spec lists, or written descriptions in any panel
- Inconsistent object between panels (shape drift, color shift, proportion change)
- CGI, 3D render, game-asset, or concept art aesthetic
- Multiple different objects presented as the same object`,

  P02: `# Photorealistic Universal Object Identity Sheet

Create a **photorealistic object identity sheet** showing the **same real-world physical object photographed from multiple angles**.

The result must look like **real product-style photography captured during a single reference session**, not a CGI model, 3D render, stylized illustration, or concept art.

The object must remain fully consistent across all images in:

* shape and proportions
* materials and surface textures
* color and finish
* thickness and construction
* wear, scratches, manufacturing marks, and natural imperfections

---

## Universal Scale Rule

The object may be **small, handheld, medium-sized, large, or oversized**.

The photography must **adapt naturally to the object's real-world size**.

---

# Layout

Create a **clean reference contact sheet** arranged in **two horizontal rows**.

All images must depict **the exact same object photographed during the same session under identical lighting conditions**.

---

# Top Row — Structural Orientation (4 images)

1. Front view — Object facing directly toward camera
2. Left perspective view — Slightly angled to reveal depth and side structure
3. Right perspective view — Opposite angle showing the other side
4. Rear view — Back side of the object

---

# Bottom Row — Detail & Material References (3 images)

1. Functional or primary surface view
2. Material / texture close-up — grain, surface texture, wear, or construction detail
3. Light interaction view — showing how light reacts with the material surface (reflections, matte diffusion, gloss, metallic highlights)

---

# Consistency Constraints

The object must remain **identical across all images** in: geometry, scale, material behavior, color tone, surface imperfections.

---

# Critical Restrictions

The output must **not resemble**: 3D render, CGI asset, game asset, stylized illustration, concept art.

FAST EXECUTION MODE: Prioritize structural consistency and correct 2-row layout over panel density. Seven panels done right beats a complex sheet done poorly.`,

  P03: `Create a **photorealistic helicopter identity sheet** representing the exact same real-world helicopter photographed from multiple angles in a single controlled session.

The result must look like **real aviation photography**, not CGI, 3D render, or concept art.

---

## Core Identity Lock (CRITICAL)

The helicopter must behave as a **single fixed mechanical system**.

### Master Geometry Anchor (MANDATORY)

* The **side profile view is the master reference** defining: fuselage length, rotor mast position, tail boom length, landing gear placement
* ALL other views must strictly conform to this geometry

---

### Rotor Physics Lock (CRITICAL)

* Main rotor blade count must remain identical across all views
* Blade length must remain proportional to fuselage
* Tail rotor must maintain exact size, position, and orientation

---

## Layout

### Top Row — Structural Geometry (5 images)

1. Front view (symmetrical alignment)
2. Front 3/4 view
3. Side profile (**MASTER GEOMETRY REFERENCE**)
4. Rear 3/4 view
5. Rear view

### Bottom Row — Functional Detail (4 images)

1. **Top-down view (CRITICAL for rotor geometry)**
2. Rotor hub and blade close-up
3. Landing gear and underside
4. Cockpit glass and nose detail

---

## Consistency Constraints (STRICT)

* Identical geometry across all views
* Identical rotor system
* Identical materials and markings

---

## AI Lock Instruction

"Lock helicopter identity as a fixed mechanical system. Use side profile as master geometry. Enforce rotor physics consistency across all views. Do not mutate blade count, structure, or proportions."`,

  P04: `Create a **photorealistic robot identity sheet** representing the exact same mechanical unit across multiple angles.

The result must look like **real industrial or cinematic robot photography**, not CGI or concept art.

---

## Core Identity Lock (CRITICAL)

### Master Geometry Anchor

* Side profile defines: limb proportions, torso size, joint positions

### Joint System Lock (CRITICAL)

* Each joint must remain in identical position
* Joint count must remain constant

### Panel System Lock

* Armor panels must remain consistent
* Panel segmentation must not shift

### Material Zoning

Maintain fixed zones: metal frame, rubber joints, glass / LED components

---

## Layout

### Top Row — Structure (5 images)

1. Front view
2. Left 3/4
3. Right 3/4
4. Side profile (**MASTER STRUCTURE**)
5. Rear view

### Bottom Row — Detail (4 images)

1. Joint close-up
2. Panel segmentation detail
3. Head / sensor detail
4. Material reflection detail

---

## Critical Restrictions

No stylization, no redesign, no mutation.

AI Lock Instruction: "Robot is a fixed mechanical rig. Lock joint structure and panel system. Do not redesign or mutate mechanical topology."`,

  P05: `Create a **photorealistic creature identity sheet** representing the exact same biological entity across multiple views.

The result must look like **real wildlife or cinematic creature reference photography**, not fantasy illustration.

---

## Core Identity Lock (CRITICAL)

### Master Silhouette Anchor

* Side profile defines: body shape, limb count, proportions

### Silhouette DNA Lock

* Body shape must remain identical
* Limb count must not change
* Tail / fins / wings must remain consistent

### Texture DNA Lock

* Skin pattern must remain identical
* Scales, scars, markings must persist
* Color gradient must not shift

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

### Bottom Row — Detail (4 images)

1. Skin texture macro
2. Eye close-up
3. Limb/claw detail
4. Light interaction on skin

---

## Critical Restrictions

No mutation, no redesign, no stylization.

AI Lock Instruction: "Creature identity is defined by silhouette and texture DNA. Lock morphology and surface pattern across all views."`,

  P06: `Create a **photorealistic consumer product identity sheet** representing the exact same manufactured item across multiple angles.

The result must look like **real product photography**, not CGI.

---

## Core Identity Lock (CRITICAL)

### Precision Geometry Lock

* Edge curvature must remain identical
* Thickness must not change
* All dimensions fixed

### Branding Lock

* Logo position fixed
* Text and markings consistent

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

### Bottom Row — Detail (4 images)

1. Top / functional surface
2. Button / interface close-up
3. Material texture
4. Reflection behavior

---

## Consistency Constraints

* Same geometry
* Same material
* Same branding

AI Lock Instruction: "Treat as precision-manufactured object. Lock geometry, material, and branding exactly."`,

  P07: `Create a **jewelry and precious object production reference sheet** — a single professional reference board for prop department, set dressing, and jewelry design documentation.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real jewelry photography reference board** on a clean white or deep black velvet background.

---

## JEWELRY SCALE RULE

The object is **fine jewelry or a precious ceremonial piece**. Use **macro or close-up photography** appropriate to the actual size of the piece.

---

## LAYOUT

### ROW 1 — Structural Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | TOP-DOWN |

FRONT, LEFT, BACK, RIGHT — standard 4-angle turnaround at macro scale; consistent soft studio lighting
TOP-DOWN — camera directly overhead looking straight down into the setting, crown, or surface pattern

---

### ROW 2 — Craft & Construction Detail (5 panels)

| GEM DETAIL | SETTING DETAIL | CLASP | HALLMARK | METAL TEXTURE |

GEM DETAIL — extreme macro close-up of the primary gemstone: reveals facet pattern, cut geometry, color saturation, inclusions, and clarity
SETTING DETAIL — the prong, bezel, pavé, channel, or other mounting; reveals goldsmith craftsmanship
CLASP — the locking or connection mechanism; shows functional engineering and wear pattern
HALLMARK — any stamp, engraving, maker's mark, or karat mark
METAL TEXTURE — close-up of metal surface finish: polished mirror, brushed, hammered, engraved, oxidized

---

### ROW 3 — Light, Scale & Identity (4 panels)

| SCALE ON BODY | LIGHT SPARKLE | MATERIAL MACRO | COLOR SWATCHES |

SCALE ON BODY — the piece shown against a clean body outline reference (silhouette only, no real person)
LIGHT SPARKLE — the piece under a single directional point light at 45° angle: captures the gem's fire and brilliance
MATERIAL MACRO — extreme macro of the most visually distinctive zone: diamond facet magnified, gold granulation texture
COLOR SWATCHES — 4-6 color tiles: primary metal tone, gemstone body color, gemstone secondary flash color, shadow tone, highlight

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written notes in any panel
- Multiple different jewelry pieces presented as the same piece
- Hands, faces, or body parts — use clean outlines only for scale
- CGI render, 3D model, or stylized illustration`,

  P08: `Create a **photorealistic car prop identity sheet** representing the exact same real-world vehicle photographed from multiple angles.

The result must look like **real automotive reference photography captured during a single controlled studio session**, not CGI, 3D render, or stylized illustration.

---

# Core Vehicle Consistency Requirements (CRITICAL)

The vehicle must maintain absolute consistency in:

* body shape and proportions (no variation)
* silhouette and stance (locked geometry)
* paint color and finish (gloss / matte / metallic)
* reflections and highlight behavior
* wheel design, size, and position
* panel gaps and body lines
* headlights and taillights structure

---

# Layout

Two horizontal rows in a **clean automotive contact sheet format**.

---

# Top Row — Structural Orientation (Vehicle Geometry Lock) (4 images)

1. **Front view** — Car facing directly forward. Symmetry and stance clearly visible.
2. **Front 3/4 view (left angle)** — Slight angle showing depth, hood lines, and side curvature.
3. **Rear 3/4 view (right angle)** — Opposite angle showing rear form and volume.
4. **Rear view** — Straight rear shot showing taillights and structure.

---

# Bottom Row — Functional & Material Identity (4 images)

1. **Side profile (MASTER SILHOUETTE LOCK)** — Perfect side view — must define exact proportions (wheelbase, roofline, ride height).
2. **Wheel & tire close-up** — Rim design, brake system, tire texture and wear.
3. **Surface material close-up (paint)** — Body panel showing paint finish, micro-texture, and imperfections.
4. **Reflection / lighting interaction view (CRITICAL)** — Close-up showing how light reflects across the car surface.

---

# Consistency Constraints (STRICT)

The vehicle must remain identical across all images: same exact geometry, same paint and material response, same reflections and highlight behavior, same ride height and stance.

---

# Critical Restrictions

The output must NOT resemble: CGI / 3D render, concept art, game asset, stylized illustration.

AI Consistency Reinforcement: "Lock this vehicle as a persistent prop. Do not redesign, reinterpret, or mutate across views. Maintain identical silhouette, reflections, and material response."`,

  P09: `Create a **macro-scale object production reference sheet** for a small or simple object.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

---

## MACRO SCALE RULE

The object is **small, simple, or single-material**. Examples: jewelry, coins, keys, pebbles, fruit, seeds, small hardware, craft components, gemstones, shells.

All photography must use **macro or close-up framing appropriate to the object's actual size**.

---

## LAYOUT

### ROW 1 — Structural Turnaround (4 panels)

| FRONT | LEFT | BACK | RIGHT |

Clean 4-angle turnaround at macro scale. Neutral white or light grey stage background. Every view shows the exact same object at identical scale with consistent lighting.

---

### ROW 2 — Feature & Construction Detail (5 panels)

| PRIMARY FEATURE | EDGE PROFILE | INTERIOR REVEAL | WEAR | MARKING |

PRIMARY FEATURE — top or functional view showing the object's most recognizable surface (face of coin, gem setting, keyhole profile)
EDGE PROFILE — extreme close-up of the object's edge, rim, or boundary — reveals thickness, material layering, seam, casting line
INTERIOR REVEAL — cross-section or internal view if applicable (fruit flesh, hollow key shaft, stone grain, crystal interior)
WEAR — close-up of the most worn, aged, or used area: patina, scratch pattern, fruit bruise, stone chip, worn engraving
MARKING — any marking, text, embossing, hallmark, stamp, or natural pattern that identifies this specific object

---

### ROW 3 — Light, Scale & Material References (4 panels)

| SCALE | LIGHT REACTION | MATERIAL MACRO | COLOR SWATCHES |

SCALE — the object placed next to a familiar reference (coin, fingertip outline, ruler edge, matchstick) showing true real-world size
LIGHT REACTION — the object under a single directional light source showing how the material responds: metallic reflection, matte diffusion, translucency, crystal refraction
MATERIAL MACRO — extreme magnification of the primary surface: grain structure, crystal lattice, weave, pore structure
COLOR SWATCHES — 4-6 color tiles sampled from the object's actual surface

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written notes in any panel
- Multiple different objects presented as the same object
- CGI render, 3D model, or stylized illustration`,

  P10: `Create a cinematic shot featuring {description} as the hero object within an appropriate environment. The prop should be the clear focal point — sharp, well-lit, and positioned using rule-of-thirds composition — while the surrounding environment provides context and atmosphere.

The object should feel real and present in the scene:
- Correct scale relative to the environment
- Natural interaction with surfaces (casting shadows, reflecting light, resting with gravity)
- Environmental lighting affecting the object naturally (warm interior glow, cool outdoor light, dramatic side-lighting)
- Signs of use or context (a weapon on a table beside a map, a vehicle on a dusty road, a tool mid-task)

Shallow depth of field — the object razor-sharp, background softly blurred but recognizable. Cinematic color grading appropriate to the mood. The image should tell a micro-story: this object matters, it belongs here, something is about to happen with it. Photorealistic, film-quality single frame. No people visible, but their presence should be implied.`,

  P11: `Create a **weapon production reference sheet** — a single professional reference board for prop department, armory, and visual effects documentation.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real prop armory reference board** on a clean neutral background.

---

## WEAPON SCALE RULE

Weapons may be any size — a small dagger to a massive war hammer, a compact pistol to a heavy machine gun, a short staff to a spear. All photography must use **framing appropriate to the weapon's actual size**.

---

## LAYOUT

### ROW 1 — Structural Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | TOP-DOWN |

FRONT, LEFT, BACK, RIGHT — standard 4-angle turnaround at full weapon length; consistent studio lighting; weapon horizontal or at natural carry angle
TOP-DOWN — directly overhead view looking straight down the weapon's longest axis; reveals blade spine, barrel rifling, width of guard

---

### ROW 2 — Component Detail (5 panels)

| BLADE / BARREL | EDGE PROFILE | TIP / MUZZLE | GRIP | GUARD |

BLADE / BARREL — the primary striking or ranged element: fuller groove, blade surface finish, barrel rifling, forging texture
EDGE PROFILE — extreme close-up of the cutting edge or firing end: reveals grind type, sharpness, blade thickness
TIP / MUZZLE — the very end of the weapon: blade point geometry, spear tip, muzzle opening
GRIP — handle or grip close-up: wrap material (leather, wire, cord, rubber), wood grain, finger grooves
GUARD — crossguard, trigger guard, bolster, or equivalent hand protection: shape, material, engraving

---

### ROW 3 — Function & Condition (4 panels)

| MECHANISM | WEAR | MARKING | DAMAGE STATE |

MECHANISM — the primary functional element: trigger and action (firearms), bow limb and nock point (archery), hinge or locking mechanism
WEAR — the most used or worn area: grip worn smooth, blade edge micro-chipping, trigger guard rubbed
MARKING — any maker's mark, serial number, engraving, rune, clan symbol, or decorative inscription
DAMAGE STATE — the weapon showing significant battle damage: notched blade, dented guard, cracked grip, scorched barrel

---

### ROW 4 — Scale, Light & Identity (4 panels)

| SCALE IN HAND | LIGHT REACTION | MATERIAL MACRO | COLOR SWATCHES |

SCALE IN HAND — the weapon held by or resting across a hand/arm outline reference (silhouette only, no real person)
LIGHT REACTION — the weapon under a single directional light revealing how the material responds
MATERIAL MACRO — extreme close-up of the most distinctive surface: blade steel crystal structure, leather grain, carved wood detail
COLOR SWATCHES — 4-6 color tiles: blade/barrel primary, grip primary, guard/hardware, accent, patina/weathering tone

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written descriptions in any panel
- Multiple different weapons presented as the same weapon
- Hands or figures holding the weapon — use outlines only for scale
- CGI render, 3D model, or stylized illustration aesthetic`,

  P12: `Create a **costume and garment production reference sheet** — a single professional reference board for costume departments, wardrobe supervisors, and tailors.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real wardrobe reference board** on a clean white or neutral background.

---

## GARMENT IDENTITY RULE

Every panel must show the same garment with identical fabric, color, construction, stitching, hardware, and embellishment.

---

## LAYOUT

### ROW 1 — Structural Views (4 panels)

| FRONT | BACK | LEFT SIDE | RIGHT SIDE |

Full garment displayed on a dress form, invisible mannequin, or laid flat. Consistent neutral studio lighting across all 4 views. Show the complete silhouette, hemline, and all key construction elements.

---

### ROW 2 — Component Detail (5 panels)

| COLLAR / NECKLINE | CLOSURE | SLEEVE | HEM / BOTTOM | LINING |

COLLAR / NECKLINE — close-up of the neckline design: collar shape, lapel style, neckline cut, any embellishment at the neck zone
CLOSURE — the primary fastening system: button and buttonhole, zipper teeth and pull, hook and eye, lace-up grommets
SLEEVE — sleeve construction: hem, cuff design, any lining reveal at cuff, sleeve head attachment
HEM / BOTTOM — the lowest finished edge: hem depth, hem stitch, any border trim, length reference
LINING — interior of the garment where visible: lining fabric, seam finishing, pocket interior, structure layer

---

### ROW 3 — Fabric & Surface (4 panels)

| FABRIC MACRO | WEAR PATTERN | EMBELLISHMENT | LABEL |

FABRIC MACRO — extreme close-up of the primary fabric: weave structure, thread count, pile direction, sheen quality, fiber texture
WEAR PATTERN — the most worn area: collar soil line, elbow worn smooth, knee stress, button thread pull, fade at fold lines
EMBELLISHMENT — any applied decoration: hand embroidery, screen print, woven brocade, beading, patch, trim, lace, metallic thread
LABEL — care label, maker's tag, size label, or period-authentic brand mark

---

### ROW 4 — Body Reference & Condition (4 panels)

| SCALE FRONT | SCALE BACK | DRAPE | CONDITION |

SCALE FRONT — the garment shown on or against a body silhouette outline (front view); shows fit, proportion, and length relative to body. Silhouette outline only — no real person.
SCALE BACK — same body silhouette outline from the rear; shows back length, vent, back detail visibility
DRAPE — the garment in motion or partial motion: a swirling skirt, a jacket blown open, a cape catching air
CONDITION — a split comparison panel: LEFT = the garment in NEW/PRISTINE condition; RIGHT = the same garment after heavy use/aging

---

### ROW 5 — Identity Anchors (3 panels)

| COLOR SWATCHES | SILHOUETTE | MOOD |

COLOR SWATCHES — 5-8 color tiles: primary fabric, secondary fabric, lining, hardware/buttons/trim, embellishment accent, stitching thread color
SILHOUETTE — pure black filled front-view outline of the garment; the costume silhouette should be instantly recognizable even as a solid shape
MOOD — the garment shown in its intended production context: a period costume on a street set, a fantasy costume in a forest

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, care instruction lists, or written descriptions in any panel
- Multiple different garments presented as the same garment
- Real people or faces — use dress forms, flat lay, or body silhouette outlines only
- CGI render or illustrated concept art aesthetic`,
};
