---
name: video-prompt-builder
description: Generate detailed, scene-by-scene AI video prompts for Seedance 1.5 Pro and Seedance 2.0 from a creative brief. Use this skill whenever the user wants to create a video prompt, write a shot list, plan a video sequence, describe a video concept for AI generation, or mentions Seedance. Also trigger when the user describes a scene, ad concept, brand film, product video, or any visual sequence they want turned into structured prompts — even if they don't explicitly say "video prompt." Trigger on phrases like "write me a video prompt", "Seedance prompt", "shot list", "plan a video", "video concept", "create a sequence", "brand film prompt", "ad prompt", or any time the user describes what they want to happen in a video and needs it translated into generation-ready prompts.
---

# Video Prompt Builder for Seedance

Build cinematic, scene-by-scene video prompts from a creative brief. Output is always a **markdown file** (`.md`) — clean, copy-paste ready, delivered as a downloadable file.

---

## How this skill works

1. The user provides a **creative brief** — this can be as simple as "a runner in a stadium for a Nike-style ad" or as detailed as a full storyboard description.
2. **Identify the scene categories** present in the brief (see Scene Categories below) and load the relevant reference files before writing those scenes.
3. Generate a **scene-only output** — no extra sections like effects inventory, density maps, or energy arc unless the user explicitly asks for them.
4. For each scene, assign the correct Seedance model, write an image prompt, then write a video prompt with timestamps.
5. Deliver as a `.md` file the user can copy-paste directly into their workflow.

If the brief is too vague to build a full prompt (e.g. "make something cool"), ask one focused clarifying question before proceeding. Don't over-interrogate — work with what you're given and make creative decisions where the user hasn't specified.

---

## Scene Categories

Every scene belongs to one or more categories. **Before writing any scene, identify its category and load the matching reference file.** The reference files contain category-specific image prompt guides, video prompt formats, signature techniques, and real-world language patterns extracted from creator prompts.

### Scene type categories

| Category | When to use | Reference file |
|---|---|---|
| **Dialog** | Characters speaking, reacting, listening, emotional exchange | `references/dialog.md` |
| **Action** | Athletic performance, stunts, chase, sport, fast physical movement | `references/action.md` |
| **Explosion / VFX** | Pyrotechnics, shockwaves, particle bursts, environmental destruction | `references/explosion.md` |
| **Fighting** | Hand-to-hand combat, martial arts, brawls, weapon combat | `references/fighting.md` |
| **Pose / Showcase** | Product reveals, character introductions, fashion, hero poses | `references/pose.md` |
| **Vlog** | Handheld lifestyle, talking to camera, travel, behind-the-scenes | `references/vlog.md` |
| **Driving / Drift** | Automotive, drifting, car chases, race footage, car reveals | `references/driving_drift.md` |
| **Fantasy / Magic** | Sorcery, energy beams, supernatural powers, cursed auras, elemental VFX | `references/fantasy_magic.md` |
| **Food / Commercial** | Food preparation, ingredient reveals, product ads, chef content, macro food | `references/food_commercial.md` |
| **Sci-Fi / Mech** | Robot transformations, mechanical suits, giant mechs, vehicle-to-robot, weapon charge | `references/scifi_mech.md` |
| **Crowd Reaction / Social** | Bystander reaction shots, bar brawls with witnesses, viral social moments, CUT TO REACTION structure | `references/crowd_reaction_social.md` |
| **Music Video / Fashion** | Beat-sync choreography, multi-character staging, neon fashion, strobe sequences | `references/music_video_fashion.md` |
| **Magic Room / Object Reveal** | Floating furniture, room makeover magic, AR-style object pop-ins, 360° orbit reveals | `references/magic_room_reveal.md` |

### Modifier (applies on top of any scene category)

| Modifier | When to use | Reference file |
|---|---|---|
| **Character Consistency** | User uploads a reference image, mentions @image1, wants same face across shots | `references/character_consistency.md` |

**How to use the reference files:**
- Read the relevant reference file(s) before writing scenes of that type.
- The reference file's image prompt template and video prompt format take precedence over the general rules in this SKILL.md.
- A single video may span multiple categories — load each reference as needed.
- Character Consistency is a modifier — always combine it with the scene type category reference.
- If a scene doesn't fit any category clearly, apply general rules from this SKILL.md.

---

## Output format

Always output **scene blocks only**. No effects inventory. No density map. No energy arc. Just the scenes, top to bottom.

Start every file with:
```
# 🎬 "[TITLE]" — Scene Prompts
### [Short description of the film/video]
```

Then add this model guide legend once, after the title:
```
> 💡 **Model Guide:**
> - 🟢 **Seedance 1.5 Pro** — Simple, grounded, low-complexity scenes. Saves credits.
> - 🔴 **Seedance 2.0** — Complex effects, VFX, action, dynamic motion. Worth the cost.
```

End the file with a one-line credit summary:
```
> 💰 **X scenes on Seedance 1.5 Pro · Y scenes on Seedance 2.0** — spend credits only where it counts.
```

---

## Scene block structure

Every scene follows this exact structure — no exceptions:

```
SCENE [N] ([start]–[end]) — [Scene Name]
> 🟢 Seedance 1.5 Pro   ← or 🔴 Seedance 2.0

Image Prompt:
[Image generation prompt — see Image Prompt rules below]

Video Prompt:
[Video prompt — see Video Prompt rules below, format depends on model]
```

Use a `---` horizontal rule between every scene.

> ⚠️ **Storyboard parser note:** The scene header MUST start with `SCENE [N]` (no `###` prefix). The labels MUST be exactly `Image Prompt:` and `Video Prompt:` (no bold markers, no emoji). This format is required for the storyboard builder to extract prompts correctly.

---

## Model assignment rules

Assign the model based on scene complexity. When in doubt, default to 1.5 Pro to save the user money.

**🟢 Use Seedance 1.5 Pro when the scene has:**
- People walking, talking, reacting, or doing simple actions
- Static or slow camera moves (tracking, push-in, close-up)
- Mild slow-motion (50–80% speed)
- Subtle practical effects (a glow, a light flicker, a gentle wind)
- No compositing, no VFX, no rapid multi-cut sequences
- No large-scale environmental destruction or impossible scale changes

**🔴 Use Seedance 2.0 when the scene has:**
- Complex VFX or compositing (explosions, shockwaves, particle bursts, digital fracture)
- Extreme slow-motion (under 30% speed) or freeze frames
- Rapid strobe intercutting (3–5 frame cuts)
- Giant-scale subjects (robots, monsters, massive environments)
- Chromatic aberration, heavy distortion, or multiple stacked visual effects
- Action sequences with multiple simultaneous moving elements
- Camera moves that require complex motion tracking (360° orbital, extreme rack focus across massive scale differences)

---

## Image Prompt rules

The image prompt sits **above** the video prompt in every scene. It serves as a reference frame for image generation tools (Midjourney, Flux, DALL-E, etc.) to establish the visual before generating the video clip.

Rules:
- Pack all visual detail and style into the image prompt: subject description, clothing, lighting, environment, colour grade, camera angle, lens feel, mood
- Keep it dense but scannable — no bullet points, written as a single descriptive paragraph
- End with technical specs: `Cinematic, photorealistic, 16:9.` or similar
- Do NOT repeat style/detail info in the video prompt — the video prompt handles motion only

---

## Video Prompt rules — Seedance 1.5 Pro

For 1.5 Pro scenes, write the video prompt as **timestamped beats**. No cinematic header block needed.

Format:
```
Video Prompt:
0.0s–Xs: [What happens visually. Camera behaviour. Speed. Key detail.]

X.Xs–Xs: [Next beat. What changes. How it transitions.]
```

Rules:
- Every beat must have a timestamp range
- Describe camera movement precisely: "Camera gently pushes in" not "zoom"
- Describe speed where relevant: "60% speed slow-motion", "normal speed"
- End the final beat with a transition note: `→ CUT`, `→ HARD CUT`, `→ END`
- Keep beats short and factual — director's notes, not prose

---

## Video Prompt rules — Seedance 2.0

For 2.0 scenes, write a **cinematic header block first**, then timestamped beats below it.

Format:
```
Video Prompt:
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. [Colour grade — e.g. teal shadows, warm amber highlights]. Film grain. [Environment description — lighting, weather, location feel]. [Atmospheric details — lens flares, motion blur, steam, rain, dust, etc.]. Dolby Vision HDR.

0.0s–Xs: [Camera angle and movement]. [Subject action in detail]. [Speed/timing note if applicable]. [Atmospheric detail]. [Key VFX or effect happening].

X.Xs–Xs: [Next beat. Effect name in CAPS if it's a named technique — e.g. TIME REMAP, SMASH CUT, STROBE CUT, FREEZE]. [What happens visually in detail]. [How it transitions.]
```

Rules:
- Always open with `Shot on ALEXA 65mm anamorphic lens.`
- Always end with `Dolby Vision HDR.`
- Colour grade must match the scene mood — don't use the same grade for every scene
- Named techniques go in ALL CAPS inline: `TIME REMAP`, `SMASH CUT`, `STROBE CUT`, `FREEZE`, `SLOW MOTION`, `HARD CUT`
- Every beat must have a timestamp range
- Be specific about speed: `~15% speed`, `~60% speed`, not just "slow motion"
- End the final beat with `→ CUT`, `→ HARD CUT`, `→ SMASH CUT`, or `→ END`
- Mark the signature/hero visual effect with ⭐ in the scene title

---

## Creative principles

1. **Contrast drives impact.** Alternate simple 1.5 Pro scenes with intense 2.0 scenes. The quiet moments make the VFX hits land harder.
2. **Signature moments matter.** Every video should have at least one hero effect. Mark it with ⭐ in the scene title and call it out in the prompt.
3. **Transitions are part of the scene.** Always describe how a scene exits and how the next one enters.
4. **Specificity over vagueness.** "The frame rotates clockwise ~15°" beats "camera tilts." "~15% speed" beats "slow motion."
5. **Save money deliberately.** Actively look for scenes that can be 1.5 Pro. Only escalate to 2.0 when the complexity genuinely requires it.
6. **Image prompt does the heavy lifting on style.** Don't repeat style details in the video prompt. Video prompt = motion only.

---

## Duration calibration

Adjust scene count and density to match the target duration:
- **5–10 seconds**: 3–5 scenes, lean and punchy, 1 signature effect, mostly 1.5 Pro
- **10–20 seconds**: 6–10 scenes, contrast and build, 1–2 signature effects, mix of models
- **20–30 seconds**: 10–16 scenes, full arc, 2–3 signature effects, strategic 2.0 placement
- **30+ seconds**: Scale accordingly — maintain density contrast, never fill every scene with VFX

If the user doesn't specify a duration, default to 15–20 seconds.

---

## File delivery

Always create and deliver the output as a `.md` file using the `create_file` tool, saved to `/mnt/user-data/outputs/`, then present it with `present_files`. Never output the full prompt as inline chat text — it must be a downloadable file.

Filename format: `[project_slug]_scene_prompts.md`

---

## Example scene block — Seedance 1.5 Pro

```markdown
SCENE 3 (0:05–0:07) — Man Notices the Watch
> 🟢 Seedance 1.5 Pro

Image Prompt:
Close-up of a young man's face looking downward with a curious and slightly confused expression. Shallow depth of field, soft urban background bokeh. Natural overcast daylight. Cinematic, photorealistic, 16:9.

Video Prompt:
0.0s–1.0s: Medium close-up on his face as he stops walking. Slow-motion at 60% speed. Subtle vignette darkens the frame edges. Camera gently pushes in. His expression shifts from blank to curious.

1.1s–2.0s: He crouches slowly toward the ground. The background blurs further as he leans in. Eyes widen slightly. Transition: hard cut to his hand reaching downward → CUT.
```

---

## Example scene block — Seedance 2.0

```markdown
SCENE 6 (0:12–0:14) — The Button Press ⭐ SIGNATURE
> 🔴 Seedance 2.0

Image Prompt:
A man's thumb pressing a glowing red button on a futuristic wristwatch. A massive circular shockwave ring explodes outward across the street pavement in all directions, cracking the ground, sending sparks and dust flying. RGB chromatic aberration fringing distorts the edges of the frame. Wide cinematic shot, dramatic, photorealistic, 16:9.

Video Prompt:
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. Steel-blue shadows, electric white highlights. Film grain. Daytime city street. Dust and debris particles suspended in air. Lens flares on the watch button. Motion blur. Dolby Vision HDR.

0.0s–0.8s: Extreme close-up on the man's left wrist — the glowing watch strapped tight, red button catching the light. His thumb hovers millimetres above it. TIME REMAP: extreme slow-motion (~15% speed). Shallow depth of field, foreground knuckles sharp, city street blurred behind.

0.9s–1.2s: Thumb presses the red button. Frame FREEZES for 3 frames. Then a blinding pulse of white light bursts from the watch face outward. SMASH: a massive circular shockwave ring EXPLODES across the pavement in all directions, cracking asphalt, sending sparks skipping along the ground.

1.3s–2.0s: Wide shot — camera PULLS BACK fast as the shockwave expands across the full street. Chromatic aberration splits the frame edges into RGB fringing. The air warps and distorts like a heat haze radiating outward.

2.1s–2.5s: The light overwhelms the frame — full white flash overexposure bleaches everything → HARD CUT.
```
