# Character Consistency & @Image Anchoring

## When to use this category
Any prompt that uses a reference image to lock a character's appearance across multiple shots or scenes. This applies whenever: the user uploads a face/character image, mentions "@image1" or "character reference", says "maintain face accuracy", "same face", "character consistency is mandatory", or wants to cast a real person into a fictional scenario.

This is not a scene type — it is a **modifier** that applies on top of any other category. Always combine with the relevant scene category reference.

## Default model
Either — character consistency applies to both 1.5 Pro and 2.0. The scene complexity determines the model; the character lock applies regardless.

---

## Language patterns observed in real prompts

This is the most formula-driven category — creators have developed specific locking language that the model responds to. The patterns are highly consistent:

**Hard character lock declarations (use at the TOP of the prompt, before any scene description):**
- "Character consistency is mandatory" — the most direct declaration
- "Strictly follow the character's face, hairstyle, outfit silhouette, and body proportions. Do not change identity or facial structure."
- "Fixed appearance: [list all fixed elements]" — enumerate every visual property
- "same face, same identity, same hairstyle, same skin tone, same body structure across all shots"
- "Use uploaded chef image (maintain face accuracy)"
- "@IMAGE1 THE ANCHOR" — positioning the character as the compositional anchor

**What to enumerate in a character lock:**
From real prompts, effective character locks name ALL of these:
1. Face / facial structure
2. Hairstyle (and hair colour)
3. Skin tone
4. Eye appearance (colour, shape, any distinctive features)
5. Outfit: top, bottom, shoes, accessories — in specific order
6. Body proportions / build
7. Any signature effects attached to the character (aura, smoke, glow)

**@image reference syntax patterns seen:**
- `@image1` / `@IMAGE1` / `@image_1` — all are equivalent; use whichever format the platform requires
- `[Character Reference: @image1]` — bracket declaration before the prompt body
- `Use the provided input image as exact reference.` — prose declaration
- `Use uploaded [role] image` — role-first declaration (e.g., "Use uploaded chef image")

**Multi-character labelling:**
From the fashion/music video prompt:
- `@image 1 THE ANCHOR — center` — position + role label
- `@image 2 THE EDGE — left` — directional stage position
- `@image 3 THE HEAT — right` — emotional/energy label
This pattern gives each character a spatial position AND a personality shorthand the model can hold.

---

## How to structure a Character Consistency prompt block

Always place the character lock BEFORE the scene description. It is the first thing the model reads and sets the constraint for everything that follows.

**Block structure:**
```
CHARACTER REFERENCE
[Reference declaration: @image1 or "Use uploaded image"]
[Hard lock statement: "Strictly follow..." or "Character consistency is mandatory"]
[Fixed appearance list — enumerate all visual properties]

CHARACTER
[Short description of who this person is in the story context]

ENVIRONMENT
[Setting description]

CAMERA
[Camera style notes]

CINEMATIC TIMELINE / SCENE DESCRIPTION
[The actual scene beats with the character now locked]
```

**Example (single character):**
```
CHARACTER REFERENCE
[Character Reference: @image1]
Character consistency is mandatory: same face, same hairstyle, same skin tone, same body structure across all shots.
Fixed appearance: short dark hair slicked back, rimless glasses, silver chain necklace, navy blue crewneck sweatshirt over white tee.

CHARACTER
East Asian man, mid-20s, calm and fearless expression throughout.

ENVIRONMENT
Rain-soaked New York street at night. Neon signs. Wet asphalt. Steam from manholes.

CINEMATIC TIMELINE
[Scene beats...]
```

**Example (multi-character with positioning):**
```
@image 1 THE ANCHOR — center. [Full outfit description: item by item].
@image 2 THE EDGE — left. [Full outfit description: item by item].
@image 3 THE HEAT — right. [Full outfit description: item by item].

[Scene description referencing each character by their label]
```

---

## Character Appearance Enumeration Guide

When writing the fixed appearance list, go in this order and be specific:

**Face:** facial structure description, eye colour/shape/distinctive detail, expression default
**Hair:** length, style, colour, any distinguishing texture
**Top:** garment type, colour, material if distinctive, fit
**Bottom:** garment type, colour, fit
**Footwear:** shoe type, colour, any distinctive detail
**Accessories:** in order from most visible to least (chains, glasses, rings, bags)
**Body:** build, height cues if useful, posture default
**Signature effects** (if fantasy/VFX): aura colour, smoke, glow — describe as "constantly present" or "activates when"

---

## Critical rules for @image prompts

1. **State the lock before the scene.** Character constraints written mid-scene description are less effective than those placed at the top.
2. **Repeat key identifiers at moments of high change.** If the character goes from a calm scene to a combat scene, re-anchor: "he — the same man, navy sweatshirt now soaked, rimless glasses still on — pivots to face the attacker."
3. **Name the character by their visual anchor, not a generic pronoun.** "The man in the navy sweatshirt" not just "he" during action beats.
4. **For multi-character scenes, use the label consistently.** If you named them @image1, @image2, @image3, use those labels throughout the prompt, not "the first woman" or "the girl on the left."
5. **Never describe a character differently in different scenes within the same prompt.** Any discrepancy gives the model permission to drift.
