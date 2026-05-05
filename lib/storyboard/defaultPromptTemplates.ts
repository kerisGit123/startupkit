export const DEFAULT_PROMPT_TEMPLATES = [
  {
    name: 'C01 - Full Production Character Reference Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'production', 'turnaround', 'color-palette'],
    isPublic: false,
    notes: 'FLAGSHIP — final identity documentation. Visual-only production reference sheet. Use @Image1 as character reference (required for best results). Generates: 5-view full-body turnaround + facial close-ups + outfit/prop detail panels + color swatches + expression states + silhouette chart + mood reference. No text blocks. GPT Image 2 optimized. Use C02 for quick exploration first, then C01 to lock identity.',
    prompt: `Create a **comprehensive character production reference sheet** — a single professional reference board used by animation studios, film productions, and visual development teams.

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
## PHOTOGRAPHY STYLE

Hyper-realistic character photography standard:
- Camera: 85mm portrait equivalent — natural facial compression, no distortion
- Lighting: motivated three-point setup — soft key from upper-left, subtle rim light separating subject from background, gentle fill; no flat even-lit setup
- Depth of field: character fully sharp in structural views; background softly separated
- Skin: visible pore texture, fine lines, natural skin tone variation, subsurface scattering — no plastic or airbrushed smoothing
- Eyes: iris texture, specular catchlight, moisture at eye edges, visible eyelash roots
- Hair: individual strand behavior, natural sheen, flyaways, volume — not CGI-clean or helmet-like
- Fabric: weave texture, stitching, natural drape, wear at stress points, material behavior
- Tonal range: motivated directional shadows, not evenly lit; honest biological and material behavior
- Hyper-realistic: every surface must show evidence of real biology and physical material — skin breathes, fabric drapes, hair moves

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
- Smooth plastic-looking skin or over-retouched appearance

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  {
    name: 'C02 - Ultra Realistic Character Sheet (Fast)',
    type: 'character' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'fast'],
    isPublic: false,
    notes: 'QUICK PASS — use this before C01 for concept exploration. Fewer panels = higher GPT Image 2 reliability. Use @Image1 as character reference. Generates: 5 full-body views (2/3 area) + detail panels — eyes, face, skin, hair, clothing, object (1/3 area). Best for: first-pass identity testing, concept validation, exploring character variations before committing to full C01 production board. Single character only, full body mandatory, no CGI.',
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

## PHOTOGRAPHY STYLE
Hyper-realistic character photography standard:
- Camera: 85mm portrait equivalent — natural facial compression, no distortion
- Lighting: motivated three-point setup — soft key from upper-left, subtle rim light separating subject from background, gentle fill; no flat even-lit setup
- Skin: visible pore texture, fine lines, natural skin tone variation, subsurface scattering — no plastic or airbrushed smoothing
- Eyes: iris texture, specular catchlight, moisture at eye edges, visible eyelash roots
- Hair: individual strand behavior, natural sheen, flyaways — not CGI-clean or helmet-like
- Fabric: weave texture, stitching, natural drape, wear at stress points
- Tonal range: motivated directional shadows, not evenly lit; honest biological and material behavior
- Hyper-realistic: every surface must show evidence of real biology and physical material

Strict Negative Constraints — Do NOT produce:
- cropped body (must be full body)
- zoomed-in views in main section
- multiple characters
- incorrect back view
- Output must NOT resemble: a 3D render or CGI asset, a game-engine texture or game asset, a stylized illustration, concept art, a cartoon or anime character
- smooth or plastic skin

Output: A single identity sheet image containing 2/3 area full-body multi-angle views, 1/3 area structured detail panels. All views must be complete, consistent, and ultra-realistic, like a professional casting sheet.

FAST EXECUTION MODE: Prioritize identity accuracy and turnaround correctness over panel density. Fewer panels done right beats many panels done poorly. If layout space is constrained, maintain all 5 full-body views and reduce detail panel count before reducing view quality.`,
  },
  {
    name: 'C09 - Ultra Realistic Character (Single Shot)',
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

## PHOTOGRAPHY STYLE
Hyper-realistic character photography standard:
- Camera: 85mm portrait equivalent — natural facial compression, no distortion
- Lighting: motivated three-point setup — soft key from upper-left, subtle rim light separating subject from background, gentle fill
- Lens: shallow depth of field, realistic bokeh, slight chromatic aberration at image edges
- Skin: visible pore texture, fine lines, natural skin tone variation, subsurface scattering — no plastic or airbrushed smoothing
- Eyes: iris texture, specular catchlight, moisture at eye edges, visible eyelash roots
- Hair: individual strand behavior, natural sheen, flyaways — not CGI-clean or helmet-like
- Fabric: weave texture, stitching, natural drape, wear at stress points
- Tonal range: global illumination with soft shadows; honest biological and material behavior
- Hyper-realistic: every surface must show evidence of real biology and physical material — skin breathes, fabric drapes, hair moves

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character`,
  },
  {
    name: 'C10 - Semi-Humanoid Creature Reference Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['creature', 'hybrid', 'reference-sheet', 'production', 'semi-humanoid'],
    isPublic: false,
    notes: 'SPECIALIZED — for hybrid human/creature characters (werewolf, demon, mermaid, alien-human, etc.). Visual-only production reference board. Use @Image1 as creature reference (required). Covers turnaround, facial hybrid zones, transition anatomy, appendage detail, expression states, scale reference, and mood. Use C01 for fully humanoid characters; use C05 for fully non-human creatures.',
    prompt: `Create a **comprehensive semi-humanoid creature production reference sheet** — a single professional reference board for creature design and visual effects departments.

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

## PHOTOGRAPHY STYLE
Hyper-realistic creature photography standard:
- Camera: 50-85mm equivalent — accurate biological scale with natural compression
- Lighting: single motivated key source (sun angle, practicals, ambient), strong directional shadows revealing surface topology and texture depth
- Skin/hide/scale: individual scale edges, hide grain, bioluminescent patch detail, visible surface tension — no CGI-smooth surfaces
- Eyes: sclera texture, iris pattern, moisture film, catchlight — biologically accurate
- Transition zones: micro-detail at human-to-creature boundary — skin pore to scale edge, smooth to textured
- Tonal range: deep shadows in creature anatomy; motivated highlights on wet surfaces, carapace, or bioluminescent elements
- Hyper-realistic: every surface must show evidence of real biology — no flat game-texture surfaces

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character

Additional restrictions:
- Text blocks, spec tables, or written descriptions in any panel
- Generic creature with no human elements present
- Pure human with only cosmetic creature additions
- Inconsistent hybrid anatomy between panels
- Multiple different creature designs presented as the same subject`,
  },
  {
    name: 'C11 - Stylized / Animated Character Reference Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['stylized', 'animated', 'anime', 'cartoon', 'reference-sheet', '2d', 'cel-shaded'],
    isPublic: false,
    notes: 'SPECIALIZED — for non-photorealistic characters: anime, cartoon, 2D illustration, cel-shaded, flat-design, painterly. Must match the art style of @Image1 exactly. Covers style-matched turnaround, facial close-ups, expression states, style-specific line/fill/shading panels, silhouette, and color palette. Use C01/C02 for photorealistic characters; use this for any stylized or animated art style.',
    prompt: `Create a **stylized character reference sheet** that exactly matches the art style of the uploaded reference image.

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
  },
  {
    name: 'C12 - Child / Youth Character Reference Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['child', 'youth', 'kid', 'reference-sheet', 'proportions', 'age'],
    isPublic: false,
    notes: 'SPECIALIZED — for child and youth characters (toddler to teen). Correct age-appropriate proportions are enforced: larger head-to-body ratio, rounder facial features, shorter limbs, less defined musculature. @Image1 as character reference (required). Note the approximate age in your description for proportion calibration. Use C01 for adult characters; use this for ages roughly 1–17.',
    prompt: `Create a **child or youth character production reference sheet** with age-accurate proportions.

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

## PHOTOGRAPHY STYLE
Hyper-realistic child character photography standard:
- Camera: 85mm portrait equivalent — natural proportions, no wide-angle distortion that would exaggerate head size
- Lighting: soft diffused key from above-front — natural, warm, age-appropriate; no dramatic high-contrast thriller lighting
- Skin: smooth child skin with natural flush, fine texture — no adult skin texture or aging markers; age-accurate color and softness
- Eyes: large iris relative to sclera (child characteristic), natural moisture, focus, and expression
- Hair: natural child hair behavior — fine, soft, flyaways, honest volume
- Fabric: age-appropriate soft materials; natural drape and play-wear behavior
- Tonal range: warm, approachable motivated shadows; not cold or dramatically underlit
- Hyper-realistic: every surface must show evidence of real child biology and clothing material

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character

Additional restrictions:
- Adult body proportions applied to a child's face
- Text blocks or written descriptions in any panel
- Inconsistent age proportions between panels
- Mature or adult-coded clothing, poses, or expressions`,
  },
  {
    name: 'C13 - Full Armor / Suit Character Reference Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['armor', 'suit', 'knight', 'astronaut', 'mech', 'reference-sheet', 'costume', 'hazmat'],
    isPublic: false,
    notes: 'SPECIALIZED — for characters where identity lives primarily in the suit or armor, not the face: knight, astronaut, hazmat worker, power armor, mech pilot suit, diving suit, plague doctor, full fantasy plate armor. @Image1 as suit reference (required). Covers full suit turnaround, helmet detail, torso/limb piece breakdown, joint articulation, material surfaces, damage states, insignia, and scale. Use C01 for face-forward characters; use this when the suit IS the character.',
    prompt: `Create a **full armor and suit character production reference sheet** — the suit is the primary identity element.

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

## PHOTOGRAPHY STYLE
Hyper-realistic armor and suit photography standard:
- Camera: 35-50mm equivalent — full suit in frame with accurate scale; no wide-angle distortion on edges
- Lighting: single motivated key light (overhead industrial or battle environment) with strong directional shadows across panel lines, joint gaps, and surface geometry
- Metal surfaces: visible grain direction, paint chipping, edge wear, micro-scratches, oxidation — no perfect mirror finish
- Composite / fabric panels: weave pattern, tension at joints, abrasion at contact zones, manufacturing seams
- Visor / lenses: internal reflection depth, anti-reflective coating behavior, surface dust or battle wear
- Joint articulation: physical gap between plates, pivot wear, hydraulic staining or lubricant traces
- Tonal range: high contrast — key light sculpting every surface feature; deep shadow in recesses
- Hyper-realistic: every surface must show evidence of real manufacturing, material wear, and operational history

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character

Additional restrictions:
- Text blocks, spec tables, or written descriptions in any panel
- Inconsistent suit geometry or panel lines between views
- Visible face or skin in panels where the suit is fully closed
- Multiple different suit designs presented as the same suit`,
  },
  {
    name: 'C14 - Animal Character Reference Sheet',
    type: 'character' as const,
    isSystem: true,
    tags: ['animal', 'creature', 'companion', 'wildlife', 'reference-sheet', 'horse', 'dog', 'cat'],
    isPublic: false,
    notes: 'SPECIALIZED — for fully non-humanoid animal protagonists or recurring companion animals: dogs, cats, horses, wolves, birds, big cats, bears, fantastical animals. @Image1 as animal reference (required). Covers multi-angle turnaround, head close-up, coat/fur/scale pattern, gait states (standing/sitting/running/alert), paw/claw/hoof detail, scale with human, and mood. Use C05/C07 for monster-scale creatures; use C10 for semi-humanoid hybrids; use this for realistic or stylized animal characters.',
    prompt: `Create a **animal character production reference sheet** — a professional reference board for a recurring animal character or companion.

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

## PHOTOGRAPHY STYLE
Hyper-realistic wildlife / animal photography standard:
- Camera: 200-400mm telephoto equivalent — natural animal compression, working distance preserved, background softly separated
- Lighting: motivated natural key (sun angle appropriate to species habitat) with soft fill from ambient sky or ground bounce
- Coat/fur: individual hair strand behavior, natural sheen direction, flyaways, clumping at wet zones — no flat CGI fur
- Eyes: iris pattern, vertical/horizontal pupil accuracy, moisture film, visible eyelash roots and surrounding fur
- Skin/paw pads: visible texture, wear calluses, natural pigmentation variation
- Scale/feather: individual unit edges, overlap pattern, iridescence or matte finish accurate to species
- Tonal range: deep naturalistic shadows in fur volume; specular highlights only on wet surfaces, eyes, and claw tips
- Hyper-realistic: every surface must show evidence of real animal biology and natural habitat wear

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character

Additional restrictions:
- Text blocks, spec tables, or written descriptions in any panel
- Inconsistent coat markings or coloring between panels
- Humanized poses or expressions (no standing on hind legs unless species-appropriate)
- Multiple different animals presented as the same animal
- Cartoon anthropomorphization unless the reference image is stylized`,
  },
  {
    name: 'C03 - UGC Character',
    type: 'character' as const,
    isSystem: true,
    tags: ['ugc', 'reference-sheet'],
    isPublic: false,
    notes: 'Character for UGC',
    prompt: `Create a professional character turnaround and reference sheet based on the reference image. Use the uploaded image as the primary visual reference for the character's identity, proportions, facial features, body shape, hairstyle, and overall design language, while translating it into a clean, neutral, reusable presentation board. The final image should be arranged like a polished concept art sheet on a pure white studio background. Show the same character in four full body views: front view, side profile, back view, and three quarter view. On the right side, include multiple clean detail panels with close ups of the eyes, upper face, lower face, lips, skin texture, hair detail, and one small clothing or material detail. Keep the styling neutral and generic so the sheet can be reused as a base template for future adaptations. Simplify anything overly specific, thematic, fantasy based, branded, culturally tied, or heavily ornamental from the source image into a more universal version while preserving the essence of the character. If a second reference image is provided (@Image2), use it as the outfit reference — the character must wear the exact outfit shown in @Image2, preserving its design, colors, materials, and silhouette faithfully. If no outfit reference is provided, the outfit should become a clean neutral base outfit with minimal detailing, soft solid tones, and a refined silhouette. No excessive accessories, no dramatic headpieces, no strong lore specific elements, no heavy decoration unless they are essential to the base identity. The character should feel balanced, elegant, realistic, and adaptable. Expression should be calm and neutral. Makeup should be subtle and natural. Lighting should be soft, even, and studio clean. The layout should feel like a premium design presentation board used for model sheets, character development, or production reference. Preserve the core identity from @lmage1, but present it in a simplified, neutral, production ready format that can serve as a universal template for future redesigns.

## PHOTOGRAPHY STYLE
Hyper-realistic character photography standard:
- Camera: 85mm portrait equivalent — natural facial compression, no distortion
- Lighting: soft even studio key — clean separation from white background, no dramatic shadows
- Skin: visible pore texture, fine lines, natural skin tone variation, subsurface scattering — no plastic or airbrushed smoothing
- Eyes: iris texture, specular catchlight, moisture at eye edges
- Hair: individual strand behavior, natural sheen, flyaways — not CGI-clean or helmet-like
- Fabric: weave texture, stitching, natural drape, wear at stress points
- Tonal range: soft motivated shadows maintaining the clean studio presentation aesthetic
- Hyper-realistic: every surface must show evidence of real biology and physical material

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character`,
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

## PHOTOGRAPHY STYLE
Hyper-realistic robot and mecha photography standard:
- Camera: 35-50mm equivalent — full suit in frame with accurate mechanical scale; no wide-angle distortion
- Lighting: single motivated industrial key light with strong directional shadows across panel lines, joint gaps, and armor geometry
- Metal surfaces: visible machining marks, paint chipping at edge wear, micro-scratches, oxidation zones, weld seam lines — no perfect mirror finish
- Cockpit / visor glass: internal reflection depth, Fresnel rim, glass imperfections, surface micro-dust
- Joint articulation: physical gap between plates, pivot wear indicators, hydraulic staining or lubricant traces
- Structural detail: bolt heads, cable routing, heat-sink fins, sensor apertures, exhaust vents — all physically accurate
- Tonal range: high contrast key sculpting every surface feature; deep shadow in mechanical recesses and under-panel gaps
- Hyper-realistic: every surface must show evidence of real manufacturing tolerances, operational use, and material wear

Strict Negative Constraints — Do NOT produce:
- cropped body (must be full body)
- zoomed-in views in main section
- multiple robots
- incorrect back view
- Output must NOT resemble: a 3D render or CGI asset, a game-engine texture or game asset, a stylized illustration, concept art, a cartoon or anime character
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
    name: 'E01 - Full Production Environment Reference Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'production', 'location', 'color-palette', 'interior', 'exterior'],
    isPublic: false,
    notes: 'FLAGSHIP — final location documentation. Visual-only production reference sheet. Use @Image1 as location reference (required for best results). Generates: 2×2 spatial overview (establishing/side/aerial/interior) + architectural detail panels (floor/wall/ceiling/signature/threshold) + surface & light details + color swatches + lighting range strip (dawn/day/dusk/night) + camera angle thumbnails + mood reference. No text blocks. GPT Image 2 optimized. Use E02 for quick exploration first, then E01 to lock location identity.',
    prompt: `Create a **comprehensive environment production reference sheet** — a single professional location reference board used by set designers, art directors, and visual development teams.

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
Full wide establishing view — complete exterior facade or full-room wide shot showing the entire space, its scale, and overall visual identity. Same perspective as @Image1.

**Top-Right — SIDE ANGLE**
Side-angle view of the same location — reveals depth, side structures, adjacent terrain, or flanking walls while keeping primary landmarks visible.

**Bottom-Left — AERIAL / ELEVATED**
A slightly elevated three-quarter aerial view — reveals the overall spatial layout: structure placement, pathways, terrain relationships, courtyard or room arrangement. Establishes scale and spatial logic of the location.

**Bottom-Right — KEY INTERIOR / FOCAL ZONE**
The most important interior space or primary focal area of the location (e.g. main hall, altar, throne room, classroom, kitchen, cockpit, market stalls). Shows scale, ceiling height, fixed furniture, and defining elements.

Labels: ESTABLISHING / SIDE / AERIAL / INTERIOR

---

## ROW 2 — ARCHITECTURAL DETAIL PANELS (5 panels, full width)

Five close-up photographic panels of key structural and material elements:

1. **FLOOR** — floor surface: stone flags, wooden planks, tile mosaic, carpet, concrete, soil — texture, wear, and pattern detail
2. **WALL** — wall treatment: plaster, brick, paneling, tapestry, carved stone, wallpaper, graffiti, glass — material and age detail
3. **CEILING** — overhead: beams, vaulted arches, pipes, chandeliers, skylights, painted fresco, exposed rafters
4. **SIGNATURE ELEMENT** — the single most distinctive design feature of this location: ornate door, stained glass window, throne, altar, control panel, fireplace, market stall, neon sign
5. **THRESHOLD** — the entry point: door, gate, archway, airlock, torii gate, school gate — shows how you enter the space

Labels: FLOOR / WALL / CEILING / SIGNATURE / THRESHOLD

## ROW 2 RIGHT — SURFACE & LIGHT DETAILS (3 panels stacked)

Three stacked close-up panels:

1. **MATERIAL** — extreme close-up of the primary surface material: stone grain, wood grain, tile glaze, plaster texture, metal finish, fabric weave
2. **WEAR** — natural aging and history: scratches, moss, water stains, paint peeling, oxidation, scorch marks, dust, patina — the location's physical memory
3. **LIGHT SOURCE** — tight close-up of the primary light source or light entry point: window with light streaming in, torch flame, fluorescent tube, skylight, candle cluster, neon tube — shows the quality of light native to this space

Labels: MATERIAL / WEAR / LIGHT SOURCE

---

## ROW 3 — VISUAL REFERENCE PANELS (4 panels, full width)

Four purely visual panels — no paragraph text:

### Panel 1 — COLOR SWATCHES
A grid of 6 solid color chip squares extracted from the location's surfaces:
- Row 1: primary wall tone · floor color · ceiling / overhead color
- Row 2: key light color · shadow / ambient tone · accent color (stained glass, banners, neon, decoration)
Clean solid squares, one short word label beneath each (e.g. WALL / FLOOR / CEILING / LIGHT / SHADOW / ACCENT)

### Panel 2 — LIGHTING RANGE STRIP
Four small panels side-by-side showing the same location angle under four lighting conditions:
- DAWN — cool blue-grey pre-light
- DAY — full natural or artificial light
- DUSK — warm golden or amber
- NIGHT — dark with practical lights only (torches, lamps, neon, moonlight)
This establishes the full atmospheric range for continuity. Labels: DAWN / DAY / DUSK / NIGHT

### Panel 3 — CAMERA ANGLE THUMBNAILS
Three small thumbnail compositions showing suggested key camera angles for filming in this location:
- Wide master shot angle
- Mid-shot character position angle
- Detail / insert shot angle
Each thumbnail is a small photographic frame showing the actual composition. Labels: WIDE / MID / INSERT

### Panel 4 — MOOD REFERENCE
One cinematic atmospheric photograph of the location — the definitive "how it feels" shot. Evocative lighting, emotionally true to the space. No people required. Label: MOOD

---

## IDENTITY CONSISTENCY (CRITICAL)

The location must be recognizably IDENTICAL across all structural panels:
- Identical architecture, materials, and spatial proportions
- Identical landmark placement — nothing moved or added
- Consistent lighting direction across Row 1 and Row 2 panels
- Must feel like ONE real place photographed from multiple camera positions during one visit

---

## PHOTOGRAPHY STYLE

**Realism:**
- Real location photography — NOT architectural CGI, NOT game engine renders
- Hyper-realistic surface detail: visible grain, physically accurate shadows, authentic wear and imperfections
- Materials must show age and history — no perfectly clean surfaces unless the location demands it
- Camera adapted to scale — wide lens for large spaces, standard for rooms, macro for close-up details

**Lighting quality (primary separator between photorealism and CGI):**
- Every panel must have a single clear motivated light source — natural sun/sky, practical fixtures, fire, neon, or torchlight
- Light must cast DIRECTIONAL shadows — avoid flat, omnidirectional, or uniformly illuminated scenes
- Ambient occlusion visible in corners, under overhangs, and in recessed areas — real spaces have dark pockets
- Specular highlights only on physically reflective surfaces (wet stone, polished metal, glass) — matte surfaces absorb light
- Lighting direction consistent across all structural panels (Row 1 + Row 2)
- Volumetric effects only where physically motivated: dust in shafts of light, haze in smoky spaces, mist in damp areas

**Colour and tone:**
- Real photographic tonal range — deep shadows with detail, bright highlights without blowout
- Not HDR-processed, not evenly brightened across the frame
- Colour temperature follows the light source: warm for fire/tungsten, cool for overcast, golden for dawn/dusk

---

## CRITICAL RESTRICTIONS

DO NOT produce:
- Text paragraphs or written descriptions in any panel
- Different architectural styles or layouts between panels
- People, vehicles, or animals in any panel
- Inconsistent lighting direction across structural panels
- Multiple different locations presented as the same location
- Evenly lit scenes with no directional shadow — this is the primary cause of CGI appearance

The output must **not resemble**:

* 3D render or architectural visualisation
* CGI asset or game environment asset
* Stylized illustration or concept art
* Evenly lit studio backdrop with no shadow direction`,
  },
  {
    name: 'E02 - General Environment (Fast)',
    type: 'environment' as const,
    isSystem: true,
    tags: ['general', 'reference-sheet', 'fast'],
    isPublic: false,
    notes: `QUICK PASS — use this before E01 for concept exploration. Simple 2×2 grid = highest GPT Image 2 reliability. Use @Image1 as location reference. Generates: 4 panels (establishing, side, aerial, detail close-up). Best for: first-pass location testing, concept validation, exploring environment variations before committing to full E01 production board. No people, vehicles, or animals. Strict spatial continuity enforced.`,
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

## PHOTOGRAPHY STANDARD

Hyper-realistic location photography:
- Camera: 24-35mm wide lens — realistic perspective, no barrel distortion
- Depth of field: focused mid-ground with natural foreground and background fall-off
- Surface detail: visible weathering, material grain, dust, moss, and physical imperfections on every surface
- Motivated light: at least one visible or implied practical source — sun angle, window, flame, or streetlight
- Atmosphere: environmental breath — dust particles, heat shimmer, natural haze, or morning mist where appropriate
- Tonal range: real photographic contrast — deep shadow with detail, not lifted or HDR-processed

---

## Style Requirements

The result must appear as **real photography of the same location captured from different camera positions**.

Maintain:

* photorealistic lighting
* natural materials and textures
* realistic scale and perspective

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

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

FAST EXECUTION MODE: Prioritize spatial consistency and correct 2×2 grid layout over panel density. Four panels done right beats a complex sheet done poorly. If the location is complex, simplify the detail panel (Panel 4) before compromising the three wide-view panels.
`,
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

## PHOTOGRAPHY STYLE
Hyper-realistic wildlife and cinematic creature photography standard:
- Camera: 200-400mm telephoto equivalent — natural creature compression, background softly separated, working distance maintained
- Lighting: motivated natural key (directional sun or environmental light source) casting shadows that reveal muscle volume, surface topology, and texture depth
- Skin/scale/hide: individual scale edges, hide grain, surface tension lines, scar tissue relief — no flat game-texture surfaces
- Eyes: sclera pattern, iris ring detail, moisture film, bioluminescent glow if applicable, catchlight
- Surface macro: extreme detail on the most distinctive texture zone — scale overlap, horn keratin layers, chitinous carapace grain
- Appendage extremities: claw keratin layers, talon curves, webbing membrane translucency, fin spine articulation
- Tonal range: deep naturalistic shadows in body volume; specular highlights only on wet surfaces, eyes, and sharp extremities
- Hyper-realistic: every surface must show evidence of real biology and material physics — no abstract creature surfaces

## CRITICAL RESTRICTIONS
Output must NOT resemble:
- a 3D render or CGI asset
- a game-engine texture or game asset
- a stylized illustration
- concept art
- a cartoon or anime character

Additional restrictions — no mutation, no redesign, no stylization between panels.

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

## PHOTOGRAPHY STYLE

Real estate and architectural photography standard:
- Camera: 16-24mm wide-angle lens, corrected verticals, natural perspective — maximum spatial context
- Lighting: available light + practical sources (window light, pendant lamps, recessed lighting) — not flat studio fill
- Depth of field: deep focus — all architectural elements sharp from wall to foreground
- Surface detail: visible fabric texture, wood grain, material imperfections, fingerprints on glass, dust on shelving
- Tonal range: bright and airy with real shadow depth under furniture, in corners, and along base walls
- Hyper-realistic: the space must feel lived-in and physically present — not showroom-sterile, not CGI-clean

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

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art
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
    name: 'E10 - Historical & Period Location Reference Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['historical', 'period', 'reference-sheet', 'production', 'medieval', 'ancient', 'victorian'],
    isPublic: false,
    notes: 'SPECIALIZED — for historical and period locations: medieval castles, ancient temples, Victorian streets, colonial mansions, feudal villages, Renaissance piazzas, ancient ruins, pre-industrial towns. @Image1 as reference (required). Visual-only multi-panel reference board covering spatial overview, period architectural detail, material/light close-ups, era-appropriate lighting range (DAWN/MIDDAY/DUSK/NIGHT), camera thumbnails, and mood. Use E01 for modern/contemporary exteriors; use this for pre-modern or period settings.',
    prompt: `Create a **comprehensive historical period location production reference sheet** — a single professional reference board for production design and set construction departments.

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

STRUCTURE — primary load-bearing element: stone arch, timber frame, clay brick, carved column, iron gate, wooden palisade — shows construction method and era
SURFACE — dominant wall or floor finish: dressed stone, exposed brick, whitewashed plaster, carved wood, mosaic, packed earth, cobblestone
ENTRANCE — main gateway, door, arch, or threshold revealing period craftsmanship, scale, and fortification or ornamentation style
SIGNATURE — the single most iconic feature: rose window, well, throne dais, bell tower, market stalls, forge, altar, battlement
DECAY — most weathered area: crumbled stonework, rotted timber, moss-covered surface, corroded iron, faded fresco — showing time passage

---

### ROW 3 — Material & Light (3 panels)

| MATERIAL MACRO | CRAFTSMANSHIP | LIGHT QUALITY |

MATERIAL MACRO — extreme close-up of the primary building material: stone grain, wood grain, fired clay texture, mortar joints, hand-hewn marks
CRAFTSMANSHIP — close-up of a handmade detail: carved relief, wrought iron work, hand-thrown pottery, woven textile, painted surface, joinery
LIGHT QUALITY — how natural or flame light falls here: window shaft through dust, torch on stone, diffused canopy light, hard midday sun on pale stone — the characteristic light of this place

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

Four tiny thumbnails at different focal lengths from the same position — guides cinematography planning for this period location.

---

### ROW 6 — Mood (1 wide panel, full width)

| ————————————————— MOOD ————————————————— |

A single cinematic-quality establishing panel presenting this historical location at its most atmospheric and emotionally resonant moment. Era-appropriate lighting, weathering at full visibility, maximum spatial depth.

---

## PERIOD CONSISTENCY CONSTRAINTS

* All structural elements must match one consistent historical era — no anachronistic mixing
* Materials must reflect pre-industrial construction: stone, timber, clay, iron, thatch, plaster
* No modern materials, fixtures, signage, or infrastructure in any panel
* Weathering and patina consistent with the location's implied age

---

## PHOTOGRAPHY STYLE

Historical location photography standard:
- Camera: 24-35mm equivalent — wide enough to establish scale, intimate enough to feel present
- Lighting: natural daylight or period-accurate practical sources only — torch, oil lamp, candle, moonlight; no modern electric fill light
- Depth of field: focused on the architectural subject with natural foreground compression
- Surface detail: visible stone grain, mortar joints, wood knots, rust streaks, moss, patina, smoke staining, hand-hewn tool marks
- Tonal range: real contrast — deep shadow in recesses and under arches, harsh highlights on exposed weathered stone
- Hyper-realistic: every surface must show evidence of time and physical use — no clean, unweathered surfaces

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, labels, or written descriptions in any panel
- Modern elements: electricity, contemporary vehicles, signage, plastic, glass curtain walls
- Multiple historical eras mixed in one location
- People, animals, or vehicles in any panel

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  {
    name: 'E11 - Pure Interior Reference Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['interior', 'reference-sheet', 'production', 'pure-interior', 'set-design'],
    isPublic: false,
    notes: 'SPECIALIZED — for fully enclosed interior spaces with no exterior aerial view (cockpit, classroom, dungeon, cell, monastery, submarine, cave, cathedral, nightclub, lab). @Image1 optional — use as style/mood reference if provided. Covers overhead floor plan view, 4-angle spatial overview, architectural detail panels, surface/light close-ups, lighting range strip (DAWN/DAY/DUSK/NIGHT), camera thumbnails, and mood. Use E01 for exterior/mixed environments; use this for pure interiors.',
    prompt: `Create a **comprehensive pure interior production reference sheet** — a single professional reference board for production design, set construction, and cinematography departments.

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

TOP-DOWN — camera at ceiling level or elevated corner looking steeply downward; reveals full floor plan, furniture placement, and room geometry
ESTABLISHING — wide-angle view from main entry showing full room depth, ceiling height, and dominant spatial composition
SIDE ANGLE — camera against the longest wall showing room width, depth layers, and spatial extent
REAR VIEW — looking back toward the entry from inside the space; reveals the "back half" of the room

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
LIGHT SOURCE — the primary lighting element in close focus: window light quality, practical lamp, torch, skylight, fluorescent tube; shows how light enters and falls through the space

---

### ROW 4 — Lighting Range Strip (5 panels)

| COLOR SWATCHES | DAWN | DAY | DUSK | NIGHT |

COLOR SWATCHES — 6-8 color tiles: primary wall, floor, ceiling, dominant fixture, accent, shadow pool, light spill
DAWN — same establishing view under early morning light (cool blue-white, low-angle entry shadows)
DAY — same establishing view under full ambient daylight or full artificial illumination (neutral, fully lit)
DUSK — late afternoon or transitional state (warm amber, long shadows, practicals beginning to activate)
NIGHT — same space after dark: only practical sources active, deep shadow pools, strong contrast

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

Four tiny thumbnails showing the interior photographed at different focal lengths — all from the same interior position. Guides cinematography planning for this space.

---

### ROW 6 — Mood (1 wide panel, full width)

| ————————————————— MOOD ————————————————— |

A single cinematic-quality wide panel presenting this interior at its most atmospheric and emotionally resonant moment. Best lighting state, best angle, maximum storytelling detail. The director's reference frame.

---

## CONSISTENCY CONSTRAINTS

The same interior must appear in every panel:

* identical architecture and spatial structure
* identical furniture and fixture placement
* identical material surfaces
* no new elements introduced between panels
* all views feel like they were taken **during one location scout visit**

---

## PHOTOGRAPHY STYLE

- Camera: 16-24mm wide-angle lens, corrected verticals — maximum spatial context without distortion
- Lighting: practical motivated sources visible or implied — pendant lamps, windows, skylights, wall sconces, candles; no flat ambient-only fill
- Depth of field: deep focus — all architectural planes sharp from foreground floor to back wall
- Surface detail: visible material grain, dust accumulation on horizontal surfaces, wear at thresholds and handles, imperfections on every finish
- Tonal range: real photographic contrast — genuine shadow depth in corners and under structural elements, not lifted or uniformly lit
- Hyper-realistic: every surface must show evidence of real material behavior and occupancy — not CGI-clean or architectural-render smooth

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec lists, or written descriptions in any panel
- Exterior aerial photography (this is pure interior only)
- Multiple different interiors presented as the same space
- People, animals, or vehicles in any panel
- Inconsistent architectural structure between panels

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  {
    name: 'P01 - Full Production Object Reference Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'production', 'turnaround', 'color-palette', 'universal'],
    isPublic: false,
    notes: 'FLAGSHIP — final object/prop documentation. Visual-only production reference sheet. Use @Image1 as object reference (required for best results). Generates: 4-angle structural turnaround + surface/material/light detail panels + construction details (mechanism/join/wear/marking/scale) + color swatches + material macros + NEW vs WORN condition range + in-context mood. No text blocks. Any scale: jewelry to aircraft. Use P02 for quick exploration first, then P01 to lock prop identity.',
    prompt: `Create a **comprehensive object production reference sheet** — a single professional reference board used by prop departments and visual development teams.

All panels must be **photographic only**. No text blocks, no spec lists, no written notes — only images, color swatches, and short single-word panel labels.

The output must look like a **real production prop reference board** on a clean white background.

---

## UNIVERSAL SCALE RULE

The object may be any real-world size — small (jewelry, coins), handheld (tools, bottles, phones), medium (luggage, furniture), large (vehicles, machinery), or oversized (industrial equipment, aircraft).

The photography must **adapt naturally to the object's real-world size**:
- Framing, camera distance, and lens behavior suit the actual scale
- The object must always feel like a believable physical object in real space
- Never artificially shrink, enlarge, or normalize the object

---

## ROW 1 — STRUCTURAL TURNAROUND + SURFACE DETAILS

### Left ~65% — STRUCTURAL VIEWS (4 panels side-by-side)

Four labeled photographic views of the SAME object on a shared baseline:

1. **FRONT** — object facing directly toward camera
2. **LEFT** — slightly angled left, revealing depth and side structure
3. **RIGHT** — opposite angle, showing the other side
4. **REAR** — back of the object

Rules:
- All four panels show the EXACT SAME object — identical shape, scale, proportions, color, wear
- Clean seamless neutral backdrop (white / light grey) appropriate to object scale
- Soft even studio lighting consistent across all four views
- Camera adapted to real-world size — never artificially resized
- Labels: FRONT / LEFT / RIGHT / REAR

### Right ~35% — SURFACE DETAILS (3 panels stacked)

Three close-up photographic panels stacked vertically:

1. **PRIMARY SURFACE** — the most recognizable or functional face of the object, shot tight and clean
2. **MATERIAL** — extreme close-up showing grain, texture, stitching, weave, scratches, manufacturing marks, patina — the object's physical DNA
3. **LIGHT** — same surface showing how light reacts: specular highlight, matte scatter, gloss sheen, metallic reflection, translucency, or roughness *(this panel is critical — it defines how the object will behave on camera)*

Labels: SURFACE / MATERIAL / LIGHT

---

## ROW 2 — CONSTRUCTION & COMPONENT DETAILS (5 panels, full width)

Five close-up photographic panels breaking the object into its physical components:

1. **MECHANISM** — primary functional element: lock, clasp, hinge, trigger, dial, switch, cap, valve, buckle
2. **JOIN** — how parts connect: seam, weld, glue line, stitching, rivet, press-fit, screw head, folded edge
3. **WEAR** — natural aging and imperfection: scratches, oxidation, staining, dents, fading, patina, chips — the object's history
4. **MARKING** — any stamp, label, serial number, logo, insignia, or engraving; if none, show the underside or hidden face
5. **SCALE** — the object held in a human hand, or placed beside a recognizable reference (coin, pen, ruler, bottle) to establish true real-world size

Labels: MECHANISM / JOIN / WEAR / MARKING / SCALE

---

## ROW 3 — VISUAL REFERENCE PANELS (4 panels, full width)

Four purely visual panels — no paragraph text:

### Panel 1 — COLOR SWATCHES
A grid of 6 solid color chip squares extracted from the object's actual surfaces:
- Row 1: primary body color · secondary / accent color · highlight / sheen tone
- Row 2: shadow / underside tone · wear / patina tone · marking / branding color
Clean solid squares, one short word label beneath each (e.g. BODY / TRIM / GLOSS / SHADOW / PATINA / MARK)

### Panel 2 — MATERIAL MACRO SAMPLES
Three side-by-side full-frame macro photographs, each isolating a different material used in the object:
- Primary material surface
- Secondary material surface
- Edge or transition zone where two materials meet
One-word label beneath each showing the material type

### Panel 3 — CONDITION RANGE (NEW vs WORN)
Two photographs side-by-side showing the same section of the object:
- LEFT: pristine / as-new condition
- RIGHT: aged / worn / used condition
Establishes the visual continuity range — how much wear is acceptable between scenes.
Labels: NEW · WORN

### Panel 4 — IN CONTEXT
One cinematic photograph showing the object in its natural environment or in active use — dramatically lit, evocative, the object is the clear subject.
Label: IN USE

---

## IDENTITY CONSISTENCY (CRITICAL)

The object must be visually IDENTICAL across every panel:
- Same shape, proportions, material finish, color tone, and wear marks
- Must feel like ONE physical object documented in a single photography session
- No redesigning, reshaping, or recolouring between panels

---

## PHOTOGRAPHY RULES

- Soft neutral studio lighting for all structural views — soft key, gentle fill, natural directional shadows
- Hyper-realistic: visible surface grain, physically accurate material behavior, authentic light response, manufacturing imperfections
- Clean seamless background — white or light grey — appropriate to object scale
- Camera adapted to scale — macro for small, standard for handheld, wide for large
- Consistent lighting direction across all structural panels
- IN CONTEXT panel: dramatically lit with a motivated practical light source — cinematic, evocative, the object is the undisputed subject

---

## CRITICAL RESTRICTIONS

DO NOT produce:
- Text paragraphs, spec lists, or written descriptions in any panel
- Inconsistent object between panels (shape drift, color shift, proportion change)
- Artificially resized object (must feel true to real-world scale)
- Multiple different objects presented as the same object

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  {
    name: 'P02 - Photorealistic Prop Identity Sheet (Fast)',
    type: 'prop' as const,
    isSystem: true,
    tags: ['photorealistic', 'reference-sheet', 'identity', 'universal', 'fast'],
    isPublic: false,
    notes: `QUICK PASS — use this before P01 for concept exploration. Simple 2-row contact sheet = highest GPT Image 2 reliability. Use @Image1 as object reference. Generates: 4 structural views (top row) + 3 detail shots — primary surface, material close-up, light interaction (bottom row) = 7 panels total. Best for: first-pass prop testing, concept validation, exploring object variations before committing to full P01 production board. Works for any scale object.

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

This structure significantly reduces **visual drift in long image → video sequences**.

---

# Universal Version

This template works for objects of **any scale** — small (jewelry, coins), handheld (tools, bottles), medium (luggage, furniture), large (vehicles, machinery), or oversized (industrial equipment, aircraft).

The photography adapts naturally to the object's real-world size.`,
    prompt: `# Photorealistic Universal Object Identity Sheet

### Prompt

Create a **photorealistic object identity sheet** showing the **same real-world physical object photographed from multiple angles**.

The result must look like **real product-style photography captured during a single reference session**, not a CGI model, 3D render, stylized illustration, or concept art.

The object must remain fully consistent across all images in:

* shape and proportions
* materials and surface textures
* color and finish
* thickness and construction
* wear, scratches, manufacturing marks, and natural imperfections

The images should feel like **real photographic documentation of one physical object used as professional reference material**.

Use **neutral lighting, realistic camera optics, and natural photographic behavior**.

---

## Universal Scale Rule

The object may be **small, handheld, medium-sized, large, or oversized**.

The photography must **adapt naturally to the object's real-world size**.

Use framing, camera distance, lens behavior, and composition appropriate to the object's scale while preserving accurate proportions.

Do **not** artificially shrink, enlarge, redesign, or normalize the object.

The object should always feel like **a believable physical object photographed in real space**.

---

# Layout

Create a **clean reference contact sheet** arranged in **two horizontal rows**.

All images must depict **the exact same object photographed during the same session under identical lighting conditions**.

---

# Top Row — Structural Orientation (4 images)

### 1. Front view

Object facing directly toward camera.

### 2. Left perspective view

Slightly angled to reveal depth and side structure.

### 3. Right perspective view

Opposite angle showing the other side.

### 4. Rear view

Back side of the object.

**Purpose:**
These views establish **overall geometry, silhouette, structure, and proportions**.

---

# Bottom Row — Detail & Material References (3 images)

### 1. Functional or primary surface view

The most recognizable, functional, or defining surface of the object.

### 2. Material / texture close-up

A closer view showing material grain, surface texture, wear, or construction detail.

### 3. Light interaction view

A view showing how light reacts with the material surface:

* reflections
* matte diffusion
* gloss
* metallic highlights
* roughness

**Purpose:**
These images communicate **material realism, finish quality, and small-scale physical details**.

---

# Object Composition Rules

Preserve the **true physical structure and proportions** of the object.

Maintain consistency in:

* geometry
* scale
* material behavior
* color tone
* surface imperfections

Do not alter, redesign, stylize, or reinterpret the object between images.

All images must feel like **multiple photographs of the same physical object captured from different angles**.

---

# Background

Use a **simple neutral photographic environment** appropriate to the object's size.

Possible environments include:

* neutral studio backdrop
* tabletop surface
* seamless background
* clean floor or neutral staging area for larger objects

The background should remain **subtle, minimal, and non-dominant**.

---

# Lighting & Camera

Use **realistic photographic conditions**:

* soft neutral studio lighting
* gentle shadows
* natural reflections
* realistic camera perspective
* physically believable depth of field

The camera framing should adapt naturally to the object's scale.

Avoid:

* dramatic cinematic lighting
* stylized lighting effects
* exaggerated reflections
* unrealistic lens distortion

---

# Consistency Constraints

The object must remain **identical across all images**.

Maintain consistent:

* shape
* proportions
* material appearance
* scale
* color tone
* wear and imperfections

All photographs must appear as though they were captured **during one real photography session of the same physical object**.

---

# Critical Restrictions

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

The result must resemble **real photographic documentation of a physical object**.

FAST EXECUTION MODE: Prioritize structural consistency and correct 2-row layout over panel density. Seven panels done right beats a complex sheet done poorly. If the object is complex, maintain all 4 structural views and simplify the detail row before compromising view accuracy.
`,
  },
  {
    name: 'P07 - Jewelry & Precious Object Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['jewelry', 'precious', 'macro', 'reference-sheet', 'gems', 'goldsmith', 'rings', 'necklace'],
    isPublic: false,
    notes: 'SPECIALIZED — for fine jewelry and precious objects: rings, necklaces, bracelets, earrings, brooches, crowns, ceremonial pieces. @Image1 required. Covers 5-angle turnaround (including top-down for setting view), gemstone detail, metal craftsmanship, clasp/closure, hallmarks, scale-on-body reference, and hero light sparkle panel. Use P09 for simple single-material small objects; use P07 when the piece has gemstone + metal craftsmanship elements.',
    prompt: `Create a **jewelry and precious object production reference sheet** — a single professional reference board for prop department, set dressing, and jewelry design documentation.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real jewelry photography reference board** on a clean white or deep black velvet background.

---

## JEWELRY SCALE RULE

The object is **fine jewelry or a precious ceremonial piece**. Use **macro or close-up photography** appropriate to the actual size of the piece. Every panel must preserve the exact same piece with identical materials, settings, gemstone clarity, metal finish, and craftsmanship details.

---

## LAYOUT

### ROW 1 — Structural Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | TOP-DOWN |

FRONT, LEFT, BACK, RIGHT — standard 4-angle turnaround at macro scale; consistent soft studio lighting
TOP-DOWN — camera directly overhead looking straight down into the setting, crown, or surface pattern; reveals gem arrangement, prong pattern, and design symmetry from above

---

### ROW 2 — Craft & Construction Detail (5 panels)

| GEM DETAIL | SETTING DETAIL | CLASP | HALLMARK | METAL TEXTURE |

GEM DETAIL — extreme macro close-up of the primary gemstone or stone cluster: reveals facet pattern, cut geometry, color saturation, inclusions, and clarity; for pearls: surface luster and orient
SETTING DETAIL — the prong, bezel, pavé, channel, or other mounting holding the stone; reveals goldsmith craftsmanship, symmetry, and structural method
CLASP — the locking or connection mechanism: lobster clasp, box clasp, toggle, ring shank joint, hinge; shows functional engineering and wear pattern
HALLMARK — any stamp, engraving, maker's mark, karat mark, or certification; if none, show the cleanest interior or back surface
METAL TEXTURE — close-up of metal surface finish: polished mirror, brushed, hammered, engraved, oxidized, granulated, or filigree; reveals goldsmith surface treatment

---

### ROW 3 — Light, Scale & Identity (4 panels)

| SCALE ON BODY | LIGHT SPARKLE | MATERIAL MACRO | COLOR SWATCHES |

SCALE ON BODY — the piece shown against a clean body outline reference: ring on finger outline, necklace on neck outline, bracelet on wrist outline, earring beside ear outline. Silhouette outline only — no real person, just the shape for scale context.
LIGHT SPARKLE — the piece under a single directional point light at 45° angle: captures the gem's fire and brilliance, metal reflections, and how the piece catches light. The hero sparkle panel.
MATERIAL MACRO — extreme macro of the most visually distinctive zone: diamond facet magnified, gold granulation texture, enamel surface, pearl nacre layers, engraving depth
COLOR SWATCHES — 4-6 color tiles: primary metal tone (gold/silver/rose gold/platinum), gemstone body color, gemstone secondary flash color, shadow tone, highlight

---

## JEWELRY PHOTOGRAPHY STYLE

* Clean white studio background or deep black velvet — whichever best contrasts the piece
* Consistent soft diffused box lighting across all structural views (Row 1)
* Single directional point light for Row 3 LIGHT SPARKLE panel only
* Ultra-sharp macro depth of field across the full piece for structural panels
* Controlled depth-of-field falloff for extreme macro detail panels
* No environmental context — clean background only

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written notes in any panel
- Multiple different jewelry pieces presented as the same piece
- Hands, faces, or body parts — use clean outlines only for scale
- CGI render, 3D model, or stylized illustration
- Fantasy redesign or reinterpretation of the piece
- Inconsistent gem color or metal tone between panels`,
  },
  {
    name: 'P08 - Photorealistic Car Prop Identity Sheet',
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
    name: 'P09 - Small & Simple Object Reference Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['macro', 'small-object', 'reference-sheet', 'production', 'jewelry', 'coins'],
    isPublic: false,
    notes: 'SPECIALIZED — for small and/or single-material objects: jewelry, coins, keys, pebbles, fruit, seeds, hardware, craft components. Macro framing throughout. Use @Image1 as object reference (required). Replaces MECHANISM/JOIN from P01 with PRIMARY FEATURE/EDGE PROFILE appropriate for simple objects. Promotes SCALE panel (critical for small objects). Use P01 for complex multi-component props; use P09 for small/simple objects.',
    prompt: `Create a **macro-scale object production reference sheet** for a small or simple object.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real macro product reference board** on a clean white background.

---

## MACRO SCALE RULE

The object is **small, simple, or single-material**. Examples: jewelry, coins, keys, pebbles, fruit, seeds, small hardware, craft components, gemstones, shells.

All photography must use **macro or close-up framing appropriate to the object's actual size**. The object must feel photographed on a lightbox or macro stage with precision lighting.

---

## LAYOUT

### ROW 1 — Structural Turnaround (4 panels)

| FRONT | LEFT | BACK | RIGHT |

Clean 4-angle turnaround at macro scale. Neutral white or light grey stage background. Every view shows the exact same object at identical scale with consistent lighting. Use appropriate macro depth of field.

---

### ROW 2 — Feature & Construction Detail (5 panels)

| PRIMARY FEATURE | EDGE PROFILE | INTERIOR REVEAL | WEAR | MARKING |

PRIMARY FEATURE — top or functional view showing the object's most recognizable surface (face of coin, gem setting, keyhole profile, fruit skin pattern, stamp face)
EDGE PROFILE — extreme close-up of the object's edge, rim, or boundary — reveals thickness, material layering, seam, casting line, or weld
INTERIOR REVEAL — cross-section or internal view if applicable (fruit flesh, hollow key shaft, stone grain, crystal interior, hollow bead). If object is fully solid, show end-grain or cut face.
WEAR — close-up of the most worn, aged, or used area: patina, scratch pattern, fruit bruise, stone chip, worn engraving
MARKING — any marking, text, embossing, hallmark, stamp, or natural pattern that identifies this specific object. If none exists, show the cleanest undamaged surface zone.

---

### ROW 3 — Light, Scale & Material References (4 panels)

| SCALE | LIGHT REACTION | MATERIAL MACRO | COLOR SWATCHES |

SCALE — the object placed next to a familiar reference (coin, fingertip outline, ruler edge, matchstick) showing true real-world size. No hands — use outline or flat reference object only.
LIGHT REACTION — the object under a single directional light source showing how the material responds: metallic reflection, matte diffusion, translucency, crystal refraction, organic absorption
MATERIAL MACRO — extreme magnification of the primary surface: grain structure, crystal lattice, weave, pore structure, casting texture, or organic cell pattern
COLOR SWATCHES — 4-6 color tiles sampled from the object's actual surface: primary, secondary, highlight, shadow, and accent colors

---

## MACRO PHOTOGRAPHY STYLE

* Lightbox or controlled macro stage with neutral white/light grey background
* Consistent soft diffused lighting across structural views (Row 1)
* Single directional light for Row 3 LIGHT REACTION panel only
* Ultra-sharp depth of field across the full object for structural panels
* Realistic macro depth-of-field falloff for extreme close-up panels
* No environmental context — clean background only

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written notes in any panel
- Multiple different objects presented as the same object
- Medium or large-scale framing for a small object
- CGI render, 3D model, or stylized illustration
- Fantasy redesign or artistic reinterpretation
- Inconsistent object scale across structural panels`,
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

- Camera: 50-85mm equivalent — natural compression, no distortion
- Lighting: soft natural overcast daylight or large-source studio fill — motivated, consistent direction with visible shadow gradient
- Depth of field: full helicopter sharp with natural background separation
- Surface detail: visible paint micro-texture, panel line shadows, rivet heads, hydraulic fluid stains, exhaust discoloration, weathering wear
- Reflections: physically accurate — sky or environment reflected in cockpit glass, fuselage panels showing light source curvature
- Tonal range: real aviation photography — not HDR-processed, not artificially brightened; honest metal and paint behavior

---

## Consistency Constraints (STRICT)

* Identical geometry across all views
* Identical rotor system
* Identical materials and markings
* Identical proportions and alignment

---

## Critical Restrictions

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

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

- Camera: 50-85mm equivalent — natural full-body framing, no distortion
- Lighting: soft directional industrial or studio light — key from upper-left or upper-right, gentle fill, shadow direction consistent across all views
- Depth of field: full robot body sharp with background separation
- Surface detail: visible metal scratches, panel gaps, joint tolerances, paint wear, dust in mechanical recesses, weld lines, hydraulic residue
- Reflections: physically accurate metal behavior — specular highlights reveal surface curvature, dark environment reflected in polished panels
- Tonal range: real industrial photography — deep shadow in mechanical recesses, not flat ambient; honest metal and joint material behavior

---

## Consistency Constraints

* Same structure across all views
* Same panel layout
* Same materials

---

## Critical Restrictions

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

No redesign, no mutation of mechanical topology.

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

## Photography Standard

- Camera: 85-135mm telephoto equivalent — natural wildlife compression, no distortion
- Lighting: soft naturalistic side-lighting — motivated by implied sun direction or ambient environment; no flat studio fill
- Depth of field: creature fully sharp, background naturally separated
- Surface detail: individual fur strands, scale edges, skin pore texture, feather barbs, moisture on skin, natural oils, scarring and markings visible
- Tonal range: real wildlife photography contrast — shadows under belly and legs, highlights on dorsal surface, subdermal color variation
- Hyper-realistic: the creature must feel physically present — weight, mass, and material reality conveyed through light interaction; not a render

---

## Critical Restrictions

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

No mutation, no redesign of morphology or texture DNA.

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

- Camera: 85-100mm macro equivalent — natural product compression, no distortion
- Lighting: soft neutral studio — large softbox key from upper-left, subtle fill, natural gradient shadow on background
- Depth of field: full product sharp in structural views; macro close-up panels with precise focus plane on material surface
- Surface detail: visible manufacturing marks, fingerprint oils, micro-scratches, material grain, plastic injection lines, metal brushing direction
- Reflections: physically accurate — environment card reflected in glossy surfaces, matte surfaces showing gentle diffuse scatter
- Tonal range: real product photography — clean bright key with genuine shadow depth; not flat white, not HDR-processed

---

## Consistency Constraints

* Same geometry
* Same material
* Same branding

---

## Critical Restrictions

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art

No variation, no redesign, no stylization.

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

  {
    name: 'E13 - Sci-Fi / Futuristic Environment Reference Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['sci-fi', 'futuristic', 'reference-sheet', 'production', 'space', 'cyberpunk', 'alien'],
    isPublic: false,
    notes: 'SPECIALIZED — for science fiction and futuristic locations: space stations, cyberpunk cities, alien planets, future megacities, spacecraft interiors/exteriors, research labs, orbital platforms. @Image1 as reference (required). Visual-only reference board covering spatial overview, technological architectural detail, surface/material panels, operational lighting states (IDLE/ACTIVE/ALERT/OFFLINE), camera thumbnails, and mood. Use E01 for real-world contemporary exteriors; use this for any sci-fi or futuristic setting.',
    prompt: `Create a **science fiction and futuristic environment production reference sheet** — a single professional reference board for production design and VFX departments.

All panels must be **photographic or rendered reference quality**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real VFX or concept production reference board** on a clean white background.

---

## SCI-FI ENVIRONMENT RULE

This template is for **science fiction and futuristic locations** — settings that do not exist in the real world today. Examples: space station corridor, cyberpunk street at night, alien planet surface, future megacity skyline, orbital research platform, spacecraft interior, underground bunker, deep space outpost.

All panels must represent **one consistent fictional location** with internally coherent technology, material palette, and lighting logic.

---

## LAYOUT

### ROW 1 — Spatial Overview (4 panels)

| ESTABLISHING | SIDE ANGLE | ELEVATED / ORBITAL | INTERIOR JUNCTION |

ESTABLISHING — primary wide view showing the location's full scope, dominant architectural forms, and sci-fi scale
SIDE ANGLE — reveals depth layers, structural complexity, and surrounding technological environment
ELEVATED / ORBITAL — high-angle or bird's-eye view showing layout; for space environments: orbital or exterior hull perspective
INTERIOR JUNCTION — the point where exterior meets interior, or one zone transitions to another (airlock, docking bay, corridor entry, plaza edge)

---

### ROW 2 — Technological Architectural Detail (5 panels)

| STRUCTURE | SURFACE | TECH DETAIL | SIGNATURE | LIGHT SOURCE |

STRUCTURE — primary load-bearing or spatial-defining element: hull plating, space frame, reactor column, transit tube, mega-structure strut
SURFACE — dominant surface finish: brushed titanium, carbon composite, alien mineral, concrete-polymer, corroded metal, bio-organic growth
TECH DETAIL — a functional technological element: panel array, vent system, conduit run, holographic emitter, sensor cluster, weapon emplacement
SIGNATURE — the single most visually distinctive or story-critical feature: reactor core, command tower, alien artifact, central nexus, ship's bridge
LIGHT SOURCE — close-up of the primary artificial or alien light source: LED grid, plasma vent, bioluminescent organism, window to space, hologram projector

---

### ROW 3 — Material & Atmosphere (3 panels)

| MATERIAL MACRO | TECH MACRO | ATMOSPHERE |

MATERIAL MACRO — extreme close-up of the dominant structural material: surface texture, weathering, corrosion, alien mineral grain, or nano-coating sheen
TECH MACRO — extreme close-up of technology at surface level: circuit trace, cooling fin array, joint seal, display pixel grid, mechanical greeble
ATMOSPHERE — a panel focused on the ambient environment: particle debris in zero-g, atmospheric haze on alien planet, steam venting, energy field shimmer, hard vacuum starfield

---

### ROW 4 — Operational State Strip (5 panels)

| COLOR SWATCHES | IDLE | ACTIVE | ALERT | OFFLINE |

COLOR SWATCHES — 6-8 tiles: primary hull, secondary surface, primary light color, secondary light, accent/indicator, shadow, alien/organic element if present
IDLE — the location in low-power or standby mode (dim ambient light, minimal activity)
ACTIVE — full operational state (all systems running, lighting at designed intensity, full atmosphere)
ALERT — emergency or combat state (red emergency lighting, alarm indicators, heightened activity)
OFFLINE — power failure or derelict state (only emergency or natural light, dark interiors, inactive technology)

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

Four tiny thumbnails at different focal lengths from the same position — guides cinematography and VFX planning.

---

### ROW 6 — Mood (1 wide panel, full width)

| ————————————————— MOOD ————————————————— |

A single cinematic-quality wide establishing panel at the location's most dramatic or atmospheric operational state. Maximum sci-fi atmosphere, full production quality.

---

## SCI-FI CONSISTENCY CONSTRAINTS

* All technology must reflect one consistent technological era — no anachronistic mixing
* Material palette must remain consistent across all panels
* Lighting color language must be consistent (warm organic vs. cold synthetic vs. alien bioluminescent)
* All panels appear as documentation of **one coherent fictional location**

---

## CRITICAL RESTRICTIONS

## PHOTOGRAPHY STYLE

Sci-fi production photography standard:
- Camera: 24-35mm cinematic lens — grounded spatial perspective, no exaggerated distortion
- Lighting: motivated artificial sources visible or implied in frame — LED panels, plasma vents, bioluminescent elements, status indicators, emergency lighting; no flat ambient fills
- Depth of field: sharp mid-ground with natural dark fall-off into background — pools of light against deep shadow
- Surface detail: manufacturing seams, corrosion patina, dust on horizontal surfaces, wear around handles and access panels, scorch marks, impact damage
- Tonal range: high-contrast cinematic — deep space darkness punctuated by hard practical light; not evenly lit, not HDR-brightened
- Hyper-realistic: the location must feel physically built — like a real practical set or location, not a rendered environment

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, labels, or written descriptions in any panel
- Real-world contemporary architecture or materials unexplained by the fiction
- Multiple different locations presented as the same location
- People, animals, or vehicles in any panel

The output must **not resemble**:

* low-quality game-engine render
* CGI asset
* game asset
* generic stylized illustration
* concept art sketch`,
  },
  {
    name: 'E14 - Fantasy / Magical Environment Reference Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['fantasy', 'magical', 'reference-sheet', 'production', 'enchanted', 'mythical', 'otherworldly'],
    isPublic: false,
    notes: 'SPECIALIZED — for fantasy and magical locations that do not follow real-world physics: enchanted forests, floating islands, magical kingdoms, mythical realms, arcane ruins, fairy tale settings, dimensional rifts, ancient magical temples. @Image1 as reference (required). Covers spatial overview, magical architectural/natural detail, magical material close-ups, lighting range with magical glow (DAWN/DAY/DUSK/NIGHT with magic active), camera thumbnails, and mood. Use E10 for historical real-world period locations; use this when magic or the impossible is present.',
    prompt: `Create a **fantasy and magical environment production reference sheet** — a single professional reference board for production design and concept art departments.

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
SIDE ANGLE — reveals spatial depth, how magical elements layer and interact, and the transition from mundane to magical
ELEVATED — high-angle or bird's-eye view showing the layout from above; for floating locations: the underside or aerial approach
MAGICAL FOCUS — a closer establishing view centered specifically on the most magical, impossible, or awe-inspiring element of this location

---

### ROW 2 — Structural & Magical Detail (5 panels)

| STRUCTURE | ORGANIC GROWTH | MAGICAL ELEMENT | SIGNATURE | BOUNDARY |

STRUCTURE — primary architectural or geological element: ancient stone arch, crystal spire, living tree trunk, enchanted ruin wall, carved mythic stone
ORGANIC GROWTH — how nature has merged with or been transformed by magic: glowing moss, crystallized vines, floating flower petals, bioluminescent fungi, enchanted bark
MAGICAL ELEMENT — a distinctly impossible visual detail: floating rocks, rune glowing in stone, portal shimmer, arcane energy tendril, enchanted flame
SIGNATURE — the single most iconic or story-critical feature: the ancient altar, the world tree, the crystal heart, the dragon's throne, the sealed gate
BOUNDARY — the edge where this magical space meets the ordinary world, or where one magical zone transitions to another

---

### ROW 3 — Surface & Light (3 panels)

| MATERIAL MACRO | MAGICAL MATERIAL | MAGICAL LIGHT |

MATERIAL MACRO — extreme close-up of the primary non-magical surface: ancient stone grain, carved wood, mossy ground, mineral crystal
MAGICAL MATERIAL — extreme close-up of a magically altered or impossible material: glowing rune carving, enchanted metal, crystallized magic, bioluminescent bark, ethereal fog
MAGICAL LIGHT — how magical or supernatural light sources illuminate this space: rune glow on stone, moonbeam that doesn't follow physics, arcane fire color, fairy light scatter

---

### ROW 4 — Lighting Range Strip (5 panels)

| COLOR SWATCHES | DAWN | DAY | DUSK | NIGHT |

COLOR SWATCHES — 6-8 tiles: primary stone/earth, organic/plant tone, primary magical glow color, secondary magical glow, shadow, atmospheric haze, accent element
DAWN — the location at early morning (cold natural light mixing with residual magical glow from the night)
DAY — full ambient natural light (magic is present but less dominant; the space looks most realistic at this state)
DUSK — warm fading light where magical elements begin to wake or intensify (the transition moment)
NIGHT — darkness with magical illumination dominant: glowing runes, floating lights, bioluminescent organism, moonlight on crystal — this is the location at its most magical

---

### ROW 5 — Camera Reference Strip (4 thumbnails)

| WIDE | MEDIUM | CLOSE | MACRO |

Four tiny thumbnails at different focal lengths — guides cinematography and concept art planning.

---

### ROW 6 — Mood (1 wide panel, full width)

| ————————————————— MOOD ————————————————— |

A single cinematic-quality establishing panel at the location's most magical and emotionally powerful moment. Maximum atmosphere, full magical illumination, the sense of wonder at maximum intensity.

---

## FANTASY CONSISTENCY CONSTRAINTS

* The same impossible geometry and magical rules must apply across all panels
* Magical glow colors must be consistent (e.g., blue arcane energy, green nature magic, golden divine light)
* Both natural and magical elements must coexist in every panel — this is not a pure nature scene
* All panels appear as documentation of **one coherent magical place**

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, labels, or written descriptions in any panel
- Purely mundane/realistic environment with no magical elements
- Multiple different fantasy settings presented as the same location
- People, animals, or vehicles in any panel
- Modern technology or contemporary real-world elements
- Low-quality game-engine or cartoon aesthetic`,
  },
  // ══════════════════════════════════════════════════════════════
  // ENVIRONMENT PROMPTS
  // ══════════════════════════════════════════════════════════════
  {
    name: 'E12 - Cinematic Establishing Shot',
    type: 'environment' as const,
    isSystem: true,
    tags: ['cinematic', 'establishing', 'wide-angle'],
    isPublic: false,
    notes: 'Wide-angle cinematic establishing shot. Best for scene backgrounds, location reveals, and storyboard environments. Use @Image1 as mood/style reference (optional).',
    prompt: `Create a cinematic wide-angle establishing shot of {description}. The image should feel like a single frame from a high-budget film — composed with clear foreground, midground, and background layers that create depth. Photorealistic rendering with atmospheric perspective — distant elements slightly hazed, close elements sharp and detailed. Cinematic lighting appropriate to the time of day and mood specified. Include environmental storytelling details: wear on surfaces, lived-in textures, ambient elements like dust particles, fog, or light rays. The composition should use leading lines to draw the eye through the scene. Shot on ARRI Alexa look — natural color science, subtle lens characteristics. No characters or people in the frame. The environment should feel real, grounded, and production-ready as a storyboard background plate.`,
  },

  {
    name: 'P11 - Weapon Identity Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['weapon', 'sword', 'gun', 'reference-sheet', 'production', 'blade', 'firearm', 'staff'],
    isPublic: false,
    notes: 'SPECIALIZED — for weapons of all types: swords, daggers, axes, spears, bows, crossbows, firearms, sci-fi blasters, staffs, warhammers, flails. @Image1 as weapon reference (required). Covers 5-angle turnaround (including top-down blade/barrel view), grip/handle close-up, blade/barrel detail, edge profile, mechanism, wear/damage, engraving/marking, scale-in-hand reference, material macro, and color swatches. Use P01 for general props; use this specifically for weapons with edge, barrel, or impact geometry.',
    prompt: `Create a **weapon production reference sheet** — a single professional reference board for prop department, armory, and visual effects documentation.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real prop armory reference board** on a clean neutral background.

---

## WEAPON SCALE RULE

Weapons may be any size — a small dagger to a massive war hammer, a compact pistol to a heavy machine gun, a short staff to a spear. All photography must use **framing appropriate to the weapon's actual size**, preserving accurate real-world proportions in every panel.

---

## LAYOUT

### ROW 1 — Structural Turnaround (5 panels)

| FRONT | LEFT | BACK | RIGHT | TOP-DOWN |

FRONT, LEFT, BACK, RIGHT — standard 4-angle turnaround at full weapon length; consistent studio lighting; weapon horizontal or at natural carry angle
TOP-DOWN — directly overhead view looking straight down the weapon's longest axis; reveals blade spine, barrel rifling, width of guard, taper profile, and overall geometry from above

---

### ROW 2 — Component Detail (5 panels)

| BLADE / BARREL | EDGE PROFILE | TIP / MUZZLE | GRIP | GUARD |

BLADE / BARREL — the primary striking or ranged element in detail: fuller groove, blade surface finish, barrel rifling, forging texture, heat treatment pattern
EDGE PROFILE — extreme close-up of the cutting edge or firing end: reveals grind type (hollow, flat, convex), sharpness, blade thickness, muzzle crown, or arrowhead taper
TIP / MUZZLE — the very end of the weapon: blade point geometry, spear tip, muzzle opening, arrowhead shape, staff cap
GRIP — handle or grip close-up: wrap material (leather, wire, cord, rubber), wood grain, finger grooves, pommel attachment, checkering
GUARD — crossguard, trigger guard, bolster, or equivalent hand protection: shape, material, engraving, wear at contact points

---

### ROW 3 — Function & Condition (4 panels)

| MECHANISM | WEAR | MARKING | DAMAGE STATE |

MECHANISM — the primary functional element: trigger and action (firearms), bow limb and nock point (archery), hinge or locking mechanism (folding weapons), pommel weight (swords), firing rune (fantasy weapons)
WEAR — the most used or worn area: grip worn smooth, blade edge micro-chipping, trigger guard rubbed, string groove wear, surface patina
MARKING — any maker's mark, serial number, engraving, rune, clan symbol, or decorative inscription. If none, show the cleanest undamaged surface section.
DAMAGE STATE — the weapon showing significant battle damage or wear: notched blade, dented guard, cracked grip, scorched barrel, bent tip

---

### ROW 4 — Scale, Light & Identity (4 panels)

| SCALE IN HAND | LIGHT REACTION | MATERIAL MACRO | COLOR SWATCHES |

SCALE IN HAND — the weapon held by or resting across a hand/arm outline reference (silhouette only, no real person); shows true grip size and weapon length in context
LIGHT REACTION — the weapon under a single directional light revealing how the material responds: metallic reflection along the blade, matte grip absorption, wood grain in raking light
MATERIAL MACRO — extreme close-up of the most distinctive surface: blade steel crystal structure, leather grain on grip, carved wood detail, gemstone in pommel, rune incision
COLOR SWATCHES — 4-6 color tiles: blade/barrel primary, grip primary, guard/hardware, accent (gem, inlay, rune glow), patina/weathering tone

---

## WEAPON PHOTOGRAPHY STYLE

- Camera: 85-100mm equivalent — natural compression, no distortion
- Lighting: soft directional studio — single motivated key source casting controlled shadow that reveals edge geometry, surface texture, and material depth
- Background: dark grey or near-black for metallic weapons (contrast), white or light grey for aged or matte finishes — whichever separates the weapon cleanest
- Depth of field: full weapon sharp in structural views; macro panels with precise focus on material surface plane
- Surface detail: blade grain, metal forging lines, hammer marks, edge micro-serration, blood grooves, engraving depth, handle wrap tension, wood grain, oxidation, patina, chips
- Reflections: physically accurate — polished blade shows subtle environment reflection, matte grip shows diffuse scatter, guard/crossguard shows curvature highlight
- Tonal range: high contrast — deep shadow lets metallic surfaces breathe; not flat grey, not uniformly lit

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec tables, or written descriptions in any panel
- Multiple different weapons presented as the same weapon
- Hands or figures holding the weapon — use outlines only for scale
- Fantasy redesign or shape alteration from the reference
- Inconsistent blade or barrel geometry between panels

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  {
    name: 'P12 - Clothing / Costume / Garment Reference Sheet',
    type: 'prop' as const,
    isSystem: true,
    tags: ['clothing', 'costume', 'garment', 'reference-sheet', 'fashion', 'period-costume', 'uniform'],
    isPublic: false,
    notes: 'SPECIALIZED — for costumes, garments, and clothing as standalone prop documentation: period costumes, fantasy outfits, modern clothing, military uniforms, ceremonial dress, character costumes. @Image1 as garment reference (required). Covers front/back/side views on form, component detail panels (collar, closure, sleeve, hem, lining), fabric macro, embellishment, scale on body silhouette, drape/movement, condition range (NEW vs WORN), and color swatches. Complements C01 (documents the character); this documents the costume itself.',
    prompt: `Create a **costume and garment production reference sheet** — a single professional reference board for costume departments, wardrobe supervisors, and tailors.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real wardrobe reference board** on a clean white or neutral background.

---

## GARMENT IDENTITY RULE

Every panel must show the same garment with identical fabric, color, construction, stitching, hardware, and embellishment. If the garment is displayed flat (without a body), it must lay consistently. If displayed on a dress form or body silhouette, proportions must be consistent.

---

## LAYOUT

### ROW 1 — Structural Views (4 panels)

| FRONT | BACK | LEFT SIDE | RIGHT SIDE |

Full garment displayed on a dress form, invisible mannequin, or laid flat depending on garment type. Consistent neutral studio lighting across all 4 views. Show the complete silhouette, hemline, and all key construction elements.

---

### ROW 2 — Component Detail (5 panels)

| COLLAR / NECKLINE | CLOSURE | SLEEVE | HEM / BOTTOM | LINING |

COLLAR / NECKLINE — close-up of the neckline design: collar shape, lapel style, neckline cut, any embellishment at the neck zone
CLOSURE — the primary fastening system: button and buttonhole, zipper teeth and pull, hook and eye, lace-up grommets, snap press studs, velcro, or tied sash
SLEEVE — sleeve construction: hem, cuff design, any lining reveal at cuff, sleeve head attachment, decorative element
HEM / BOTTOM — the lowest finished edge: hem depth, hem stitch, any border trim, length reference
LINING — interior of the garment where visible: lining fabric, seam finishing, pocket interior, structure layer

---

### ROW 3 — Fabric & Surface (4 panels)

| FABRIC MACRO | WEAR PATTERN | EMBELLISHMENT | LABEL |

FABRIC MACRO — extreme close-up of the primary fabric: weave structure, thread count, pile direction (for velvet/fur), sheen quality, fiber texture
WEAR PATTERN — the most worn area: collar soil line, elbow worn smooth, knee stress, button thread pull, fade at fold lines — shows garment history and character
EMBELLISHMENT — any applied decoration: hand embroidery, screen print, woven brocade, beading, patch, trim, lace, metallic thread, sequin placement
LABEL — care label, maker's tag, size label, or period-authentic brand mark. If absent, show the cleanest interior seam or construction detail.

---

### ROW 4 — Body Reference & Condition (4 panels)

| SCALE FRONT | SCALE BACK | DRAPE | CONDITION |

SCALE FRONT — the garment shown on or against a body silhouette outline (front view); shows fit, proportion, and length relative to body. Silhouette outline only — no real person.
SCALE BACK — same body silhouette outline from the rear; shows back length, vent, back detail visibility
DRAPE — the garment in motion or partial motion: a swirling skirt, a jacket blown open, a cape catching air, fabric falling naturally — shows how the material moves and behaves with gravity
CONDITION — a split comparison panel: LEFT = the garment in NEW/PRISTINE condition; RIGHT = the same garment after heavy use/aging (production-aged, washed, stressed)

---

### ROW 5 — Identity Anchors (3 panels)

| COLOR SWATCHES | SILHOUETTE | MOOD |

COLOR SWATCHES — 5-8 color tiles: primary fabric, secondary fabric, lining, hardware/buttons/trim, embellishment accent, stitching thread color
SILHOUETTE — pure black filled front-view outline of the garment; the costume silhouette should be instantly recognizable even as a solid shape
MOOD — the garment shown in its intended production context: a period costume on a street set, a fantasy costume in a forest, a uniform in a military setting. No person — dress form, outline, or environmental context only.

---

## GARMENT PHOTOGRAPHY STYLE

- Camera: 50-85mm equivalent — natural garment framing, no distortion
- Lighting: soft diffused studio — large source with consistent direction; shadows reveal fabric volume, drape folds, and construction depth
- Background: clean white or neutral grey — non-dominant, correct for garment tone
- Depth of field: full garment sharp in structural views; macro detail panels with precise focus on weave, stitching, or embellishment plane
- Surface detail: individual thread behavior, weave pattern, stitching tension, button shank depth, lining edge reveal, interfacing shadow, pilling and wear at stress points
- Tonal range: enough shadow to convey fabric volume and three-dimensionality — not flat even white-box lit
- Fabric behavior: drape, weight, and gravity must feel physically plausible — silk falls differently from canvas, wool hangs differently from chiffon

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, care instruction lists, or written descriptions in any panel
- Multiple different garments presented as the same garment
- Real people or faces — use dress forms, flat lay, or body silhouette outlines only
- Fabric or color inconsistency between panels

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  // ══════════════════════════════════════════════════════════════
  {
    name: 'E15 - Vehicle & Cockpit Interior Reference Sheet',
    type: 'environment' as const,
    isSystem: true,
    tags: ['interior', 'vehicle', 'cockpit', 'car', 'helicopter', 'aircraft', 'reference-sheet', 'production'],
    isPublic: false,
    notes: 'SPECIALIZED — for vehicle and cockpit interiors: car cabins, helicopter cockpits, fighter jet cockpits, spacecraft interiors, submarine control rooms, ship bridges, bus/train interiors. @Image1 as reference (required). Covers driver/pilot POV, full dashboard, instrument cluster, controls, seat/harness, material details, and lighting states (day/night/alert). Use E11 for large architectural interiors; use this when the human-to-control relationship and cramped vehicle scale are the subject.',
    prompt: `Create a **vehicle and cockpit interior production reference sheet** — a single professional reference board for production design, set construction, VFX, and cinematography departments.

All panels must be **photographic only**. No text blocks, no spec lists — only images, color swatches, and short single-word panel labels.

The output must look like a **real automotive or aviation interior reference board** on a clean white background.

---

## VEHICLE INTERIOR RULE

This template is for **the inside of any vehicle or cockpit** — the occupied space where a driver, pilot, or passenger sits and operates controls. Examples: sports car cabin, military helicopter cockpit, commercial aircraft flight deck, fighter jet cockpit, spacecraft command module, submarine control room, racing car interior, luxury SUV cabin, vintage car interior, futuristic vehicle cockpit.

All panels must represent **one consistent vehicle interior** with identical instruments, trim, seat positions, and control layout throughout.

---

## ROW 1 — SPATIAL OVERVIEW (4 panels, 2×2 grid)

Four labeled photographic views establishing the full interior space:

**Top-Left — DRIVER / PILOT POV**
First-person view from the primary operating position — exactly what the driver or pilot sees: full windscreen/canopy view, dashboard in lower frame, hands-on-controls implied. This is the master spatial anchor.

**Top-Right — PASSENGER / CO-PILOT VIEW**
View from the adjacent seat looking across to the driver/pilot side — reveals the full seat-to-seat spatial relationship, center console, and shared controls. For single-seat cockpits: a slightly elevated side view from just behind the pilot's right shoulder.

**Bottom-Left — REAR CABIN / LOOKING FORWARD**
From the rear of the cabin looking toward the front — shows full seat backs, headrests, cabin width, roof lining, and how the cockpit zone appears from behind.

**Bottom-Right — OVERHEAD / TOP-DOWN**
Looking straight down from above the cabin — reveals the full floor plan: seat positions, center console width, pedal positions, door-to-door span. Establishes the true scale of the interior space.

Labels: DRIVER POV / CO-PILOT / REAR VIEW / OVERHEAD

---

## ROW 2 — CONTROL SURFACES (5 panels, full width)

Five close-up photographic panels of the primary operational surfaces:

1. **DASHBOARD** — full dashboard panel from driver/pilot perspective: complete instrument layout, screen positions, vent positions, all controls in context. The master control reference panel.
2. **INSTRUMENTS** — extreme close-up of the instrument cluster or primary flight instruments: gauges, dials, digital displays, warning indicators — shows legibility, glass reflection, bezel construction
3. **PRIMARY CONTROL** — the steering wheel, yoke, or control stick in close-up: grip material, button layout, wear marks at hand positions, paddle shifters or trigger controls
4. **SEAT & HARNESS** — the primary seat in detail: headrest, bolster, fabric or leather surface, stitching pattern, harness or seatbelt attachment points, adjustment mechanism
5. **FLOOR & PEDALS** — the foot control zone: accelerator, brake, clutch or rudder pedals, floor material, heel rest, dead pedal — shows driver/pilot foot relationship to controls

Labels: DASHBOARD / INSTRUMENTS / CONTROL / SEAT / PEDALS

---

## ROW 3 — MATERIAL & DETAIL (4 panels, full width)

Four close-up photographic panels isolating key material surfaces:

1. **TRIM MATERIAL** — extreme macro of the dominant interior trim: leather grain and stitching, carbon fiber weave, alcantara texture, brushed aluminum grain, hard plastic panel surface — the material DNA of this interior
2. **HARDWARE** — close-up of a key mechanical or interface detail: button cluster, toggle switch array, rotary dial, latch mechanism, air vent louver, cup holder, gear selector
3. **WINDOW & FRAME** — the window edge where interior meets glass: seal rubber, frame trim finish, reflection of interior in glass, exterior environment softly visible through window
4. **WEAR ZONE** — the highest-contact surface showing real-world use: worn leather at grip points, scuffed door sill, polished steering wheel spoke from repeated hand contact, sun-faded dash top

Labels: TRIM / HARDWARE / WINDOW / WEAR

---

## ROW 4 — LIGHTING STATES (5 panels, full width)

Five panels showing the same DRIVER POV angle under different lighting conditions:

| COLOR SWATCHES | DAY | NIGHT | ALERT | COLD START |

**COLOR SWATCHES** — 6 solid color tiles extracted from the interior: primary seat color · trim panel color · carpet/floor color · dashboard color · ambient light color · accent/stitching color

**DAY** — interior under full natural daylight: sunlight through windscreen, natural shadow under dash, accurate ambient fill

**NIGHT** — interior illuminated only by instrument glow and ambient cabin lighting: dashboard instruments lit, no exterior light, deep shadows in rear cabin

**ALERT** — warning or emergency state: red or amber warning lights active on instruments, caution indicators illuminated, emergency lighting if present

**COLD / OFF** — engine off, no power: interior in natural ambient light only, instruments dark, the space in its inert state

Labels: COLOR SWATCHES / DAY / NIGHT / ALERT / COLD

---

## IDENTITY CONSISTENCY (CRITICAL)

The vehicle interior must be visually IDENTICAL across every panel:
- Same seat upholstery, stitching, and wear marks in every panel
- Same dashboard layout, instrument positions, and control arrangement
- Same trim finish, color, and material throughout
- Must feel like ONE vehicle interior documented in a single photography session — not multiple different vehicles

---

## PHOTOGRAPHY STYLE

Vehicle and cockpit interior photography standard:
- Camera: 14-24mm ultra-wide lens — essential for capturing cramped interior space without distortion; corrected verticals
- Lighting: ambient practical sources — dashboard glow, cabin overhead lights, natural window light; no artificial studio fill that would not exist in the real vehicle
- Depth of field: deep focus for spatial overview panels; shallow focus with subject plane on instruments or controls for detail panels
- Surface detail: leather grain, stitching thread, plastic surface texture, metal brushing direction, fingerprint oils on touchscreens, wear at high-contact points, dust in vents
- Window treatment: exterior visible through glass should be softly exposed — not blown out white, not artificially darkened
- Tonal range: real interior photography — deep shadow under dash and between seats, warm instrument glow at night; honest material behavior
- Hyper-realistic: every surface must show evidence of use and physical occupation — not showroom-clean, not CGI-smooth; a real vehicle that has been sat in

---

## CRITICAL RESTRICTIONS

Do NOT produce:
- Text blocks, spec lists, or written descriptions in any panel
- Multiple different vehicle interiors presented as the same vehicle
- People, faces, or hands in any panel — presence implied only
- Exterior vehicle shots — every panel must be from inside looking in or across
- Inconsistent dashboard layout or seat design between panels

The output must **not resemble**:

* 3D render
* CGI asset
* game asset
* stylized illustration
* concept art`,
  },
  // ══════════════════════════════════════════════════════════════
  // PROP PROMPTS
  // ══════════════════════════════════════════════════════════════
  {
    name: 'P10 - Object in Context',
    type: 'prop' as const,
    isSystem: true,
    tags: ['contextual', 'in-use', 'atmospheric'],
    isPublic: false,
    notes: 'The prop shown in its natural context/environment — being used or displayed in a scene. Useful for storyboard frames featuring key props.',
    prompt: `Create a cinematic shot featuring {description} as the hero object within an appropriate environment. The prop should be the clear focal point — sharp, well-lit, and positioned using rule-of-thirds composition — while the surrounding environment provides context and atmosphere.

The object should feel real and present in the scene:
- Correct scale relative to the environment
- Natural interaction with surfaces (casting shadows, reflecting light, resting with gravity)
- Environmental lighting affecting the object naturally (warm interior glow, cool outdoor light, dramatic side-lighting)
- Signs of use or context (a weapon on a table beside a map, a vehicle on a dusty road, a tool mid-task)

Shallow depth of field — the object razor-sharp, background softly blurred but recognizable. Cinematic color grading appropriate to the mood. The image should tell a micro-story: this object matters, it belongs here, something is about to happen with it. Photorealistic, film-quality single frame. No people visible, but their presence should be implied.`,
  },

  // ══════════════════════════════════════════════════════════════
  // CAMERA PROMPTS — Shot types and camera movement modifiers
  // ══════════════════════════════════════════════════════════════
  {
    name: 'CA01 - Slow Dolly Push In',
    type: 'camera' as const,
    isSystem: true,
    tags: ['dolly', 'push-in', 'cinematic', 'motion'],
    isPublic: false,
    notes: 'Append to any scene prompt. Camera slowly moves forward toward the subject. Creates intimacy and tension. Best for dramatic reveals, emotional moments, or subject isolation.',
    prompt: `Camera movement: slow cinematic dolly push-in. Camera begins on a wide establishing frame and moves steadily forward toward the subject — unhurried, deliberate, confident. Movement covers roughly 30–40% of the initial subject distance over the duration of the shot. The subject grows larger in frame as peripheral environment falls away, forcing attention onto the subject's face, expression, or key detail. No zoom — this is a physical forward move. Background bokeh increases naturally as camera closes distance. Motion is smooth and linear, no acceleration or deceleration artifacts. The effect is psychological intimacy — the viewer is drawn into the scene whether they want to be or not.`,
  },
  {
    name: 'CA02 - Arc / Orbital Shot',
    type: 'camera' as const,
    isSystem: true,
    tags: ['arc', 'orbit', 'reveal', 'motion'],
    isPublic: false,
    notes: 'Camera orbits around the subject at a fixed distance. Best for character reveals, showcasing environments, or creating a sense of grandeur around a central subject.',
    prompt: `Camera movement: smooth arc orbit. Camera maintains a fixed distance from the subject while rotating around it — moving from one angle to another, typically front-to-side or side-to-back. The subject remains centred in frame throughout the arc. Movement is fluid and continuous, as if the camera is on an invisible rail around the subject. The background rotates and reveals during the arc, providing environmental context and depth. Lighting conditions on the subject shift subtly as the camera changes angle — motivating the drama. The arc covers approximately 45–90 degrees of rotation. Speed is deliberate and cinematic — not a fast spin, but a slow confident reveal. Perfect for introducing a character, showcasing an environment from all sides, or giving the viewer a full spatial read of the subject.`,
  },
  {
    name: 'CA03 - Handheld Documentary',
    type: 'camera' as const,
    isSystem: true,
    tags: ['handheld', 'documentary', 'naturalistic', 'raw'],
    isPublic: false,
    notes: 'Subtle handheld shake for naturalistic/documentary feel. Use for grounded, human, or urgent scenes. Contrasts with polished studio shots.',
    prompt: `Camera style: handheld documentary aesthetic. Subtle, natural camera movement — a gentle, organic sway that reflects a human operator holding the camera with steady but imperfect hands. Not shaky or nauseating, but alive. The camera breathes with the scene — slight drift, minor reframes, the occasional small correction. Framing is intentional but not mathematically perfect; there is a sense of a real person watching and reacting to the scene in real time. This style communicates authenticity, urgency, and presence. The viewer feels like they are witnessing something real rather than watching a constructed composition. Use for documentary-style footage, intimate character moments, street scenes, journalistic coverage, or any scene that benefits from raw human energy rather than polished artifice.`,
  },
  {
    name: 'CA04 - Crane Rise / Pedestal Up',
    type: 'camera' as const,
    isSystem: true,
    tags: ['crane', 'pedestal', 'rise', 'reveal', 'aerial'],
    isPublic: false,
    notes: 'Camera rises vertically to reveal scale or context. Classic establishing and closing shot tool. Use to open a scene with grandeur or close with emotional lift.',
    prompt: `Camera movement: slow vertical crane rise. Camera begins at ground or eye level and rises steadily upward, revealing increasing scale and environmental context as it ascends. What begins as a focused shot on a subject, location, or detail gradually becomes an expansive view as the camera climbs — buildings gain context, landscapes reveal their full scale, the subject becomes part of a larger story. The rise is smooth, cinematic, and deliberate — not a sudden lift but a slow, majestic ascent. At its apex, the camera may settle momentarily to let the revealed scale register. The effect is one of grandeur, perspective, and emotional release — the world is larger than we thought. Use for establishing shots, scene-closing reveals, or any moment that calls for a sense of scale and significance.`,
  },
  {
    name: 'CA05 - Tracking / Follow Shot',
    type: 'camera' as const,
    isSystem: true,
    tags: ['tracking', 'follow', 'action', 'movement'],
    isPublic: false,
    notes: 'Camera follows a moving subject from behind or beside. Keeps the subject in frame while the environment moves past. Best for walks, arrivals, chases, and character journeys.',
    prompt: `Camera movement: tracking follow shot. Camera moves with the subject, maintaining a consistent distance and framing as the subject travels through the environment. The subject stays roughly centred or slightly leading in frame — the camera is always a step behind, following rather than leading. The environment streams past on either side, providing a strong sense of motion and forward progress. The follow distance and angle determine the emotional register: close behind for intimacy and urgency, wider and beside for a more observational journalistic quality. The camera may drift slightly inward or outward as the subject changes pace or direction — the follow is organic, not mechanical. Use for walks, arrivals, departures, chase scenes, or any moment where a character moving through space is the primary storytelling element.`,
  },
  {
    name: 'CA06 - Whip Pan Transition',
    type: 'camera' as const,
    isSystem: true,
    tags: ['whip-pan', 'transition', 'energy', 'cut'],
    isPublic: false,
    notes: 'Fast horizontal pan creating motion blur for an energetic transition. Use between cuts or to snap attention to something new in the scene.',
    prompt: `Camera movement: whip pan. The camera executes a rapid horizontal pan — snapping from one direction to another at high speed, creating a motion blur streak during the transition. The pan is intentionally fast enough to produce significant blur across the middle frames, obscuring the transition point before landing cleanly on the new subject or composition. The effect is immediate, energetic, and attention-demanding. It communicates speed, reaction, urgency, or the abrupt shift of focus. The frame before the whip is composed and legible; the frame after the whip is equally composed and legible; the blur is the bridge. Use for: snapping to action, reacting to a sound or event, energetic music-video style edits, scene transitions, or any moment requiring a sudden shift of visual attention with kinetic energy.`,
  },
  {
    name: 'CA07 - Static Lock-Off',
    type: 'camera' as const,
    isSystem: true,
    tags: ['static', 'locked', 'tripod', 'formal'],
    isPublic: false,
    notes: 'Completely still camera. All motion comes from subjects or environment. Creates formality, tension through stillness, or a composed painterly quality.',
    prompt: `Camera style: static locked-off shot. The camera is completely still — mounted on a tripod or equivalent, perfectly stable, zero camera movement throughout the shot. All motion in the frame comes exclusively from the subjects, environment, and lighting changes. The composition is deliberate and painterly — treated as a fixed frame that the action moves within, rather than a camera that follows action. This stillness creates a particular tension: the viewer cannot look away from what is happening because the camera refuses to react or guide them. Used for: formal or ceremonial scenes, observational documentary moments, Kubrickian symmetrical compositions, contemplative sequences, time-lapse aesthetics, or any scene where camera movement would undercut the gravity of what is unfolding.`,
  },
  {
    name: 'CA08 - Low Angle / Worm\'s Eye',
    type: 'camera' as const,
    isSystem: true,
    tags: ['low-angle', 'worms-eye', 'power', 'heroic'],
    isPublic: false,
    notes: 'Camera positioned below subject eye level looking up. Exaggerates height, power, and dominance. Classic heroic or menacing framing tool.',
    prompt: `Camera angle: low angle / worm's eye perspective. Camera is positioned significantly below the subject's eye level — anywhere from waist height down to ground level — and angled upward. The subject looms above the viewer, appearing larger, more powerful, more dominant, and more imposing than they would from eye level. The sky or ceiling becomes a major compositional element, often framing the subject against open space or architectural height. Foreground elements at ground level may enter the bottom of frame, increasing the sense of being physically below the action. The psychological effect is clear: this subject has power over the viewer, or over the world they inhabit. Use for: villain reveals, hero moments, authority figures, establishing dominance in a confrontation, or any subject that should feel towering, threatening, or awe-inspiring.`,
  },
  {
    name: 'CA09 - Dutch Angle / Canted Frame',
    type: 'camera' as const,
    isSystem: true,
    tags: ['dutch-angle', 'canted', 'tension', 'unease'],
    isPublic: false,
    notes: 'Camera tilted on its roll axis creating a diagonal horizon. Communicates psychological unease, moral ambiguity, or instability. Use sparingly for maximum impact.',
    prompt: `Camera angle: Dutch angle / canted frame. The camera is rotated on its roll axis so the horizon line is diagonal rather than horizontal — typically 10–25 degrees of tilt. The world appears physically unstable, as if the laws of order have been disrupted. This is a purely psychological framing device: nothing in the subject has changed, only the camera's relationship to gravity. The diagonal creates subliminal tension, unease, moral ambiguity, and the sense that something is wrong or about to go wrong. The degree of tilt calibrates the intensity: a slight 10-degree tilt suggests subtle unease; a sharp 25-degree tilt suggests crisis or madness. Use for: villain scenes, psychological horror, moral corruption, characters under extreme stress, surreal or dreamlike sequences, or any moment where visual stability would undercut the emotional content.`,
  },
  {
    name: 'CA10 - Drone / Aerial Establishing',
    type: 'camera' as const,
    isSystem: true,
    tags: ['drone', 'aerial', 'establishing', 'scale', 'wide'],
    isPublic: false,
    notes: 'High-altitude aerial shot establishing location, scale, and geography. Classic scene-opening tool for films, documentaries, and real estate.',
    prompt: `Camera angle: drone aerial establishing shot. Camera is positioned high above the subject — anywhere from rooftop height to hundreds of metres above — looking down at varying angles from directly overhead (bird's eye / top-down) to a shallower oblique angle that shows both the ground and the horizon. The primary purpose is to establish: where are we, how large is this place, and what is the relationship between this specific location and its surroundings. The shot communicates scale, geography, and context in a single frame. Movement is slow and cinematic — a gentle glide, slow rotation, or lateral drift — never erratic. Golden hour or blue hour light is ideal, casting long shadows that reveal terrain texture and three-dimensionality. The world looks ordered and comprehensible from this height — a god-like perspective that the film is about to trade for a human one.`,
  },

  // ══════════════════════════════════════════════════════════════
  // ACTION PROMPTS — Character movement and scene action descriptors
  // ══════════════════════════════════════════════════════════════
  {
    name: 'AC01 - Hero Entrance / Reveal',
    type: 'action' as const,
    isSystem: true,
    tags: ['entrance', 'reveal', 'hero', 'cinematic'],
    isPublic: false,
    notes: 'Classic hero reveal moment. Character enters the scene in a way that establishes presence and identity. Use for protagonist introductions, villain reveals, or any first-impression moment.',
    prompt: `The character makes their entrance. They do not hurry. Movement is deliberate, self-possessed, carrying the full weight of who they are. The camera treats this as a significant event — the world notices them, or should. Posture is upright, stride is measured, eyes scan the environment with controlled awareness. They are not performing for anyone; they are simply present, and that presence is enough to command the frame. Environmental elements respond to their arrival: heads turn, conversation drops, light finds them. The moment has a before and an after — the scene changes when they enter it. Their silhouette reads clearly against the background. This is the shot that establishes who this person is before they say a single word. Every costume detail, every micro-expression, every physical habit is visible and intentional.`,
  },
  {
    name: 'AC02 - Combat / Fight Action',
    type: 'action' as const,
    isSystem: true,
    tags: ['combat', 'fight', 'action', 'physical'],
    isPublic: false,
    notes: 'Physical confrontation or combat. Use @Image1 as the primary fighter reference. Specify the style — hand-to-hand, weapons, trained military, street fight, etc.',
    prompt: `The character is in physical combat. Movement is explosive, economical, and purposeful — no wasted motion, every action is a decision. Body mechanics are correct and grounded: weight shifts before strikes, footwork creates angles, defensive movement is as intentional as offensive. The environment is part of the fight — surfaces used for leverage, objects as obstacles or weapons, space managed instinctively. Expression reflects the cost: this is not effortless, but neither is the character losing control. There is intelligence behind the physicality. Cinematically, the action is captured at the precise moment of maximum kinetic energy — peak extension of a strike, the split-second of impact, the controlled recovery. Motion blur on fast elements (hands, weapons) while the face and core remain legible. The frame is dynamic but the primary subject is always clearly readable.`,
  },
  {
    name: 'AC03 - Emotional Reaction / Close-Up',
    type: 'action' as const,
    isSystem: true,
    tags: ['reaction', 'emotion', 'close-up', 'acting'],
    isPublic: false,
    notes: 'Tight character close-up capturing an emotional reaction. Use @Image1 as the character. Specify the emotion — grief, shock, joy, fear, resolve, etc.',
    prompt: `The character processes something significant. The action is internal — the story is being told through the face, not the body. Camera is close: eyes, mouth, the slight tension in the jaw, the way the throat moves when they swallow. The micro-expressions are the performance: the first flicker of emotion before the face commits to it, the moment of resistance before acceptance, the breath held and then released. Nothing is indicated or performed for an audience — this is private, even though we are watching. Eyes are the primary storytelling instrument: where they look, what they focus on, when they lose focus. The background is soft and peripheral, irrelevant. The light falls across the face in a way that honours every contour. This is the most vulnerable the character will be in this scene.`,
  },
  {
    name: 'AC04 - Running / Chase Sequence',
    type: 'action' as const,
    isSystem: true,
    tags: ['running', 'chase', 'urgency', 'motion'],
    isPublic: false,
    notes: 'Character in urgent motion through an environment. Use @Image1 as the character, @Scene1 as the environment. Specify whether they are pursuer or pursued.',
    prompt: `The character is running — not for exercise but for something that matters. The body is at full physical commitment: arms pumping, stride extended, weight forward over the leading foot. The environment streams past. Obstacles are navigated instinctively — vaulted, ducked under, pushed aside — without breaking rhythm. Breath is audible in the physicality: chest expanded, mouth slightly open, the visible cost of sustained speed. The face shows the stakes: urgency, fear, determination, or the focused blankness of pure survival instinct. The camera captures the kinetic energy through motion blur on the environment against a sharper subject, or through a ground-level tracking angle that emphasises speed over the terrain. This is not choreographed athleticism — it is necessity translated into movement. Every footfall matters. The ground is either the enemy or the ally.`,
  },
  {
    name: 'AC05 - Dialogue / Conversation',
    type: 'action' as const,
    isSystem: true,
    tags: ['dialogue', 'conversation', 'two-shot', 'performance'],
    isPublic: false,
    notes: 'Two or more characters in conversation. Use @Image1 and @Image2 as the characters. Specify the emotional dynamic — confrontation, intimacy, negotiation, etc.',
    prompt: `Two characters in conversation. The physical distance between them communicates what the words may not: intimacy or threat, comfort or unease, power balance or equality. Body language is active listening — one speaks while the other receives, and the receiver's micro-expressions are part of the scene. Eye contact is the primary choreography: who holds it, who breaks it, who looks away and when. The space between them is charged. Whatever this conversation is about, it matters to both of them, and their bodies know it even if they are performing otherwise. Framing captures both subjects in a way that maintains their relationship to each other — neither loses the frame to the other. The environment provides context without competing. Light separates and defines each subject while maintaining their shared reality. This is the scene where the relationship is defined.`,
  },
  {
    name: 'AC06 - Discovery / Investigation',
    type: 'action' as const,
    isSystem: true,
    tags: ['discovery', 'investigation', 'detail', 'tension'],
    isPublic: false,
    notes: 'Character examines or discovers something significant. Use @Image1 as the character, @Subject1 as the item/scene being examined. Build tension through focused attention.',
    prompt: `The character has found something. They approach it the way someone approaches a thing that changes everything — carefully, with the full attention of a person who understands that what they are looking at matters. Their movement slows. Body angled toward the subject, head tilted slightly, weight on the leading foot as they lean in for a closer read. Hands may reach toward it, hover, or pull back — the decision of whether to touch is a dramatic moment in itself. Eyes move across its surface systematically, then stop on the detail that matters. Expression shifts: recognition, confusion, alarm, or the quiet click of understanding. The environment falls away. The camera agrees — it too moves closer, tightens on both the character's face and the discovered object, cutting between them in a rhythm that builds the revelation.`,
  },
  {
    name: 'AC07 - Crowd / Group Scene',
    type: 'action' as const,
    isSystem: true,
    tags: ['crowd', 'group', 'ensemble', 'mass'],
    isPublic: false,
    notes: 'Multiple characters or a crowd in action. Specify the nature of the crowd — celebration, protest, panic, ceremony, etc. Use @Image1 as the focal character within the crowd.',
    prompt: `A crowd in collective motion. Each individual is making their own decisions — yet together they form a single organism with mass and momentum. The energy of the group is palpable: sound, movement, density, and the particular electricity that comes from many people responding to the same stimulus. @Image1 the focal character moves within this crowd — part of it yet distinct, the eye of the viewer's attention amid the surrounding mass. The camera navigates the crowd as an environment: tight angles revealing individual faces and reactions, wider frames showing the scale of the gathering. Depth layers the scene — foreground figures, the focal subject in the mid-ground, the mass of the crowd behind. Every background figure is behaving, not standing. The light fights through the crowd, catching faces, catching motion. This is a living, breathing world.`,
  },

  // ══════════════════════════════════════════════════════════════
  // NOTES PROMPTS — Production notes, scene annotations, continuity
  // ══════════════════════════════════════════════════════════════
  {
    name: 'N01 - Director\'s Intent',
    type: 'notes' as const,
    isSystem: true,
    tags: ['director', 'intent', 'tone', 'vision'],
    isPublic: false,
    notes: 'Document the director\'s vision and intent for a scene or sequence. Use as a reference note for the production team.',
    prompt: `DIRECTOR'S NOTE

Scene: [Scene number / name]
Intent: [What this scene must accomplish emotionally and narratively]

Tone: [The emotional register — tense, playful, melancholic, urgent, intimate]
Pacing: [How fast or slow the scene breathes — quick cuts vs. long takes]
Key moment: [The single most important beat in this scene]

Performance direction: [What the actors need to prioritise — restraint, physicality, subtext]
Camera philosophy: [How the camera should behave — observational, participatory, formal]
Colour/light intent: [The visual atmosphere — warm/cold, high contrast/soft, practical vs. artificial]

What this scene must NOT become: [Traps to avoid — over-explaining, melodrama, being too on-the-nose]

Reference: [Films, photographs, paintings, or moments that capture the feeling]`,
  },
  {
    name: 'N02 - Scene Mood & Atmosphere',
    type: 'notes' as const,
    isSystem: true,
    tags: ['mood', 'atmosphere', 'tone', 'scene'],
    isPublic: false,
    notes: 'Define the emotional atmosphere and visual tone for a specific scene. Use to align the production team on the intended feeling before shooting.',
    prompt: `SCENE ATMOSPHERE NOTE

Location: [Where we are]
Time of day: [Specific time — golden hour, 3am, overcast noon]
Weather/environment: [Conditions that affect light and mood]

Primary emotion: [What the audience should feel in this scene]
Secondary emotion: [The undercurrent beneath the primary feeling]
Tension level: [Low / Building / High / Release]

Visual vocabulary:
- Light quality: [Hard shadows / Soft diffused / Practical sources / Darkness]
- Colour palette: [Dominant hues, saturation level, warm vs. cool]
- Texture: [Smooth and clean / Rough and weathered / Clinical / Organic]
- Space feeling: [Expansive / Claustrophobic / Intimate / Exposed]

Sound character: [Silence / Ambient noise / Score tone — affects how visuals are read]

The scene should feel like: [A single sentence that captures the essence]`,
  },
  {
    name: 'N03 - Continuity Note',
    type: 'notes' as const,
    isSystem: true,
    tags: ['continuity', 'production', 'matching', 'technical'],
    isPublic: false,
    notes: 'Flag continuity requirements between scenes or shots. Critical for multi-day shoots and scenes that must match across different shooting days.',
    prompt: `CONTINUITY NOTE

Scene(s) affected: [Scene numbers that must match]
Shooting days: [Day numbers — e.g. Day 3 and Day 7 must match]

MUST MATCH between scenes:
- Costume: [Specific clothing items, condition, accessories worn]
- Hair: [Style, condition, any changes that must be tracked]
- Makeup: [Foundation, wounds/injuries state, ageing consistency]
- Props: [Specific props, their condition, position, quantity]
- Environment: [Set dressing details that must remain consistent]
- Lighting: [Time of day, light direction, practical sources visible]
- Character positions: [Where characters are standing/sitting at scene end/start]

Known continuity risks: [Anything that is likely to drift or cause issues]
On-set continuity photos: [Note any required reference shots]
Script supervisor flagged: [Yes / No]`,
  },
  {
    name: 'N04 - VFX / Technical Note',
    type: 'notes' as const,
    isSystem: true,
    tags: ['vfx', 'technical', 'production', 'post'],
    isPublic: false,
    notes: 'Technical note for VFX requirements or complex technical setups. Use to brief the VFX supervisor and on-set team on what must be captured for post-production.',
    prompt: `VFX / TECHNICAL NOTE

Scene: [Scene number]
VFX type: [CG environment / Creature / De-aging / Screen replacement / Practical rig removal / etc.]

On-set requirements:
- Tracking markers: [Yes/No — placement notes]
- Reference photography: [HDR capture / 360° environment / specific reference needed]
- Lighting setup notes: [Any special requirements for VFX integration]
- Camera requirements: [Specific lenses, locked-off shot, motion control]
- Green/blue screen: [Yes/No — screen area, spill management notes]

Post-production handoff:
- Deliverable format: [What post needs from on-set — clean plates, witness cameras]
- VFX supervisor sign-off: [Required on set: Yes / No]
- Priority: [Hero shot / Background element / Invisible VFX]

Notes for VFX department: [Any specific guidance on intent or technique]`,
  },
  {
    name: 'N05 - Casting & Character Note',
    type: 'notes' as const,
    isSystem: true,
    tags: ['casting', 'character', 'performance', 'notes'],
    isPublic: false,
    notes: 'Character notes for casting or performance direction. Use to define who a character is beyond what is written in the script.',
    prompt: `CHARACTER / CASTING NOTE

Character: [Character name]
Appears in: [Scene numbers]

Who they are:
- Age: [Range] / Build: [Description] / Distinguishing physical: [Any specific requirements]
- Archetype: [The core type — mentor, trickster, guardian, shadow, etc.]
- Social position: [How others perceive them before they speak]

What they want in this scene: [Conscious desire]
What they actually need: [Unconscious need — often different from want]
What they are hiding: [The secret that shapes their behaviour]

Performance direction:
- Energy level: [High / Contained / Still / Erratic]
- Physicality: [How do they occupy space? Do they take up room or shrink?]
- Voice quality: [Pace, volume, texture — not accent]
- Key habit or tell: [One specific physical behaviour that reveals character]

What NOT to play: [The obvious choice — what a lesser performance would do]
The scene is won if: [The single moment that makes the scene work]`,
  },
];
