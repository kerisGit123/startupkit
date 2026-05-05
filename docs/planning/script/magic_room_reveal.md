# Magic Room / Object Reveal & Transformation Scene Prompts

## When to use this category
Furniture magically populating a room, objects floating into place, AR-style product reveals, room makeover sequences with floating props, app UI reveals over real environments. The defining feature is **objects moving through air and settling into place** — gravity is optional, physics are theatrical.

## Default model
🔴 **Seedance 2.0** for scenes with multiple floating objects, complex physics, or 360° orbit camera moves.  
🟢 **Seedance 1.5 Pro** for single-object pop-in reveals or simple room shots with one magical element.

---

## Language patterns observed in real prompts

The magic room prompts in the dataset showed the most detailed, constraint-heavy language of any category. Creators were extremely explicit about what the camera must NOT do, in addition to what it must do.

**What creators specified in extraordinary detail:**

**Camera orbit language (the most critical element):**
- "exactly one continuous full 360-degree orbit around her in a single direction and a single uninterrupted move" — three reinforcing constraints: one orbit, one direction, uninterrupted
- "This is one smooth one-direction orbit only, not a pan, not a partial arc, not a stop-and-go move, not changing direction." — negation list is a real technique: eliminate the failure modes explicitly
- "Keep stable horizon, smooth constant speed, medium-wide framing throughout" — three parameters for the orbit quality

The lesson: **For orbit shots, write what it IS and then immediately write what it IS NOT.**

**Object float/settle language:**
- "float through the air and move into the room in clean staged waves" — "staged waves" means sequential groups, not all at once
- "Each item glides visibly through midair and settles into its exact final position" — "glides" for the float, "settles" for the landing — two distinct phases
- "objects from the final room on the RIGHT side of @image_1 float and glide into the scene from different directions with elegant controlled motion" — direction of arrival matters (from right, from above, from behind)
- "The objects arrive in staged waves, moving through the air and settling naturally" — "naturally" even though it's magical

**Pop-in language (tap-triggered reveals):**
- "Each tap triggers one clean pop-in transformation" — one tap = one object
- "first the wall art appears, then the TV and console, then the chair and ottoman..." — explicit sequential order
- "Each object pops into place one by one with smooth magical interior-design reveal timing, clean spatial alignment, no chaos, no object drift"

**Character reaction language:**
- "she immediately lifts her head to look at it with happy surprise" — reaction must be immediate and named
- "clear glance shifts following the moving objects, slight body turns, small weight shifts" — microreaction list
- "He turns his head to look at the new object, reacting with growing surprise and joy" — cumulative emotion across each reveal
- "He looks around proudly, smiles big, delighted and impressed, slightly laughing in amazement" — end state emotion described in full

**Final state language:**
- "Final frame ends with the fully furnished room matching the RIGHT side of @image1 exactly" — the before/after images are referenced explicitly
- "completed furnished room matching the RIGHT side of @image1" — "RIGHT side" is specific to the split reference image format these creators use

---

## Image Prompt Guide for Magic Room / Object Reveal

The image prompt for these scenes establishes the STARTING state — the empty or partially empty room — and the character who will witness the transformation.

The goal of the image prompt is to match the reference image environment exactly, so that the final transformed state lands cleanly.

Template:
```
[Room description: same key features — windows, ceiling, flooring, proportions]. [Character: position in room, expression at start — neutral or beginning to react]. [Lighting: match the reference image's light quality — daylight, warm interior, cool overhead]. [Camera position and framing: match what will be maintained through the orbit or hold]. [Initial state: what objects, if any, are already present]. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Magic Room / Object Reveal (2.0)

The structure is: **trigger → wave 1 → wave 2 → wave 3 → final reveal** — each wave brings another group of objects in, with the character reacting between each arrival.

**Object arrival choreography:**
- Define the order of object arrival (large items first, then smaller accents)
- Define the direction each item comes from (from above, from right, from offscreen)
- Define the landing: "settles", "drifts into position", "snaps cleanly into place", "pops in"

**Character reaction choreography:**
- Reaction must come immediately after each object arrival
- Name the specific reaction: "head lifts", "eyes widen", "smile grows", "turns to follow"
- Emotion escalates across waves: "happy surprise" → "growing excitement" → "delighted amazement"

**The 360° Orbit structure:**
The orbit is both the camera move AND the structural frame for the reveal — objects arrive during the orbit, so the orbit pace determines the reveal pace.

```
ORBIT START: camera at [position: front, 3-quarter angle, etc.], facing character.
ORBIT DIRECTION: [clockwise / counterclockwise] — state once, never deviate.
ORBIT SPEED: smooth constant speed, completing one full 360° in [X] seconds.
ORBIT FRAMING: medium-wide throughout, stable horizon, character always in frame.

During the orbit:
- First quarter: [what arrives — e.g. rug, sofa]
- Second quarter: [what arrives — e.g. armchairs, coffee table]
- Third quarter: [what arrives — e.g. lamp, bookshelf, wall art]
- Final quarter: [what arrives — e.g. plant, cushions, small decor — completes the room]

ORBIT END: camera returns to starting position. Room is fully furnished. Character in final reaction state.
```

Format (Seedance 2.0):
```
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. [Colour grade: warm residential, daylight interior]. Film grain. [Room environment: same features as reference — ceiling, windows, floor]. [Lighting: daylight through windows, practical lamps arrive during the sequence]. [Atmospheric: soft room tone, no VFX particles needed — the floating objects ARE the spectacle]. Dolby Vision HDR.

0.0s–Xs: [Character starting position]. [Trigger action: phone tap, tablet tap, gesture]. [Camera begins orbit from starting position in [direction]].

X.Xs–Xs: [First wave of objects arrives from [direction]]. [Character first reaction: head lifts, eyes track the first object]. [Camera has completed ~90° of orbit].

X.Xs–Xs: [Second wave arrives]. [Character reaction escalates]. [Camera at ~180° — directly behind the character now].

X.Xs–Xs: [Third wave and final objects arrive]. [Room approaching complete]. [Character in peak reaction state].

X.Xs–Xs: [Camera completes full 360° orbit, returning to starting position]. [Room fully furnished, matching reference]. [Character in final emotional state: proud, delighted, amazed]. → END.
```

---

## Signature Magic Room / Object Reveal Techniques

- **The Staged Wave** — don't float all objects simultaneously. Arrive in three to four groups, largest first. Each wave lands and settles before the next begins. Gives the viewer time to register each arrival.
- **The Reaction Cut** — after each object wave settles, cut to a close-up of the character's face for one beat. Let the reaction land, then cut back to wide as the next wave begins.
- **The Tap Trigger** — character taps a phone/tablet screen. Cut to the corresponding object popping in or beginning to float. The tap is the direct causal link — make it visible.
- **The Final Survey** — after the full transformation, character slowly turns to look at the complete room. Camera follows their eyeline as they take it all in. Ends on their face: satisfied, amazed.
- **The Pop-In Sequence** — objects don't float; they pop in from invisible to fully present in a single frame. Sequential tap triggers. Works for product ads and UI reveals. Each pop is on a beat.
- **Negation Writing** — when describing the orbit or any constrained camera move, always follow the positive description with a negation list: "one direction only — not reversing, not pausing, not changing framing." This directly reduces failure modes.
