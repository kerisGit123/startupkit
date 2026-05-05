# Explosion & VFX Scene Prompts

## When to use this category
Pyrotechnics, shockwaves, particle bursts, digital fracture, fire, smoke columns, energy discharges, environmental destruction. The effect IS the scene — everything else serves it.

## Default model
🔴 **Seedance 2.0** — always. No exceptions. Explosion scenes require 2.0.

---

## Image Prompt Guide for Explosions & VFX

The image prompt must establish the **scale relationship** between the effect and the subject/environment, the exact **moment in the explosion lifecycle** being captured, and the **atmospheric contamination** (what's in the air, what's reacting to the blast).

Explosion lifecycle — specify which moment:
- **Pre-ignition** — the still moment just before. Smoke wisping, heat shimmer.
- **Ignition burst** — the first bloom of fire/light, before it expands.
- **Expansion peak** — the fireball at maximum size, shockwave ring visible.
- **Debris cascade** — post-explosion debris still in mid-air, fire behind it.
- **Smoke settlement** — fire dying, thick smoke column rising, rubble.

Template:
```
[Subject relationship to explosion — distance, direction, silhouette vs full detail]. [Explosion moment: choose from lifecycle above]. [Scale cue: what's in frame to convey size]. [Atmospheric: smoke density, particle types — embers, dust, sparks, glass, debris]. [Lighting from explosion: warm orange bloom, underlit or overlit]. [Camera framing]. Cinematic, photorealistic, 16:9.
```

Example:
```
A silhouetted figure mid-sprint away from a massive fireball explosion behind them. Expansion peak — the fireball is at full bloom, rolling outward in orange and black smoke. Scale cue: the figure is tiny against a collapsing warehouse structure. Debris — metal fragments, glass spray — frozen mid-air. Explosion-lit: warm orange rim light wraps the figure's back. Low wide angle, camera at ground level. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Explosions & VFX (2.0)

Explosion video prompts live and die by **timing precision**. The exact frame where the blast peaks, how fast the shockwave expands, whether there's a silence-before-the-sound delay — all of these need to be written explicitly.

Key structure:
1. **Pre-detonation beat** — the eerie still. Camera sees it coming before it happens.
2. **Ignition beat** — the first flash. Often best as a FREEZE or extreme TIME REMAP.
3. **Expansion beat** — the fireball/shockwave grows. Camera physically reacts (rack focus, shake, pull-back).
4. **Impact beat** — debris arrives, environment reacts, subject is caught in the wake.
5. **Aftermath beat** (optional) — smoke, silence, ringing ears implied by the visual stillness.

VFX language to use in prompts:
- `PRACTICAL FIRE` — physically realistic fire, not CGI-smooth
- `SHOCKWAVE RING` — circular ground-level pressure wave, often seen in desert/pavement explosions
- `VOLUMETRIC SMOKE` — thick, three-dimensional smoke that light passes through
- `LENS CONTAMINATION` — soot, ash, or heat distortion on the lens itself
- `CHROMATIC FRINGE` — RGB colour split at the edges of the blast radius

Format (Seedance 2.0):
```
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. [Colour grade — fire scenes: deep shadows, blown-out orange highlights]. Film grain. [Environment + weather: dry desert, wet urban, industrial interior]. [Atmospheric: smoke density, ember count, dust columns]. [Lens contamination note if applicable]. Dolby Vision HDR.

0.0s–Xs: [Pre-detonation beat]. [What the camera sees, what the environment sounds like implied visually]. [Camera position].

X.Xs–Xs: [IGNITION — the moment]. [TIME REMAP speed]. [What expands, in what direction, at what rate].

X.Xs–Xs: [EXPANSION]. [Fireball size and shape]. [SHOCKWAVE RING behaviour]. [Environmental reaction — what gets swept, broken, blown].

X.Xs–Xs: [DEBRIS + IMPACT]. [What arrives in frame]. [LENS CONTAMINATION if applicable]. → [TRANSITION TYPE].
```

---

## Signature Explosion Techniques

- **The Silent Flash** — cut the audio cue visually: explosion goes off but the image holds for 2 frames before the shockwave. The delay implies the physics of light vs sound.
- **The Silhouette Walk** — subject walks toward camera, explosion behind. Classic but effective when the scale contrast is committed to.
- **Shockwave POV** — camera IS the shockwave, sweeping low across the ground toward the lens position. Everything bends and flattens as it passes.
- **FREEZE at Ignition** — freeze the exact frame of initial detonation for 4–6 frames, then release into chaotic slow-mo. Disorients the viewer in the best way.
- **Lens Contamination Pull** — as debris hits the camera, rack focus outward rapidly — simulates the lens trying to compensate for contamination.
