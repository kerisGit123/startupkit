# Fighting Scene Prompts

## When to use this category
Hand-to-hand combat, martial arts, brawls, choreographed fight sequences, weapon-based combat (swords, staffs, etc.). The challenge is capturing the geometry of two bodies in conflict — force, counter-force, impact, rebound.

## Default model
🔴 **Seedance 2.0** for multi-person impact scenes and anything with VFX enhancement.  
🟢 **Seedance 1.5 Pro** for single-form martial arts (kata, shadowboxing) or slow-choreography reference shots.

---

## Image Prompt Guide for Fighting

The image prompt must lock in the **geometry of the fight** — both bodies in frame, their relative positions, and the exact moment being captured (wind-up, impact, or aftermath).

Fight moment taxonomy:
- **Wind-up** — attacker loading the strike. Defender unaware or braced.
- **Point of impact** — fist/foot/weapon makes contact. The decisive frame.
- **Rebound** — attacker's follow-through; defender's reaction/stumble/block.
- **Clinch** — bodies locked together, weight exchanging.
- **Separation** — both fighters creating distance, reading each other.

Template:
```
[Attacker position — strike type, limb position, angle of force]. [Defender position — relative to attacker, block or taking the hit]. [Specific moment: wind-up / impact / rebound]. [Environmental context: ring, street, dojo, rooftop]. [Lighting: overhead dramatic, practical neon, flat daylight]. [Camera angle: low angles empower, high angles expose vulnerability]. [Atmospheric: sweat, blood, dust]. Cinematic, photorealistic, 16:9.
```

Example:
```
A boxer throwing a left hook in the final inch before impact. His whole body rotates into the punch — shoulder driving through, weight transferred off the back foot. The opponent's head is beginning to snap right but the fist hasn't made contact yet — Point of impact, suspended. Dim gym lighting, single overhead ring light, deep shadows. Low angle from just below waist height. Sweat droplets spray off both men. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Fighting (2.0)

Fight video prompts need **clear directional geometry at all times** — the viewer must always know who's hitting who, from which direction, and what the result is. Vague fight prompts produce visual chaos.

Key structure:
1. **Setup beat** — establish positions. Who's where, what's about to happen.
2. **Attack sequence** — the strike or combination. Be anatomically specific.
3. **Impact beat** — TIME REMAP at point of contact. Even one frame of extreme slow-mo sells the hit.
4. **Reaction beat** — what happens to the defender. Where do they go?
5. **Reset beat** — fighters reposition. Build anticipation for the next exchange.

Camera rules:
- Name the axis: "Camera is 90° to the line of attack" or "Camera faces the attacker head-on"
- Lock camera for big hits — let the motion in the frame do the work, not a moving camera
- Use wide to establish geography; cut to close-up for impact
- Dutch angle on disorientation; level on power moments

Fight-specific VFX language:
- `IMPACT FLASH` — single-frame white or light flash at point of contact (stylized)
- `MOTION SMEAR` — blurred trail of the striking limb
- `SWEAT SPRAY` — practical physics: droplets fly off on impact
- `BODY SLAM SHOCKWAVE` — floor or surface reacts to the weight of a takedown

Format (Seedance 2.0):
```
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. [Colour grade]. Film grain. [Environment: ring, street, industrial, rooftop]. [Lighting: hard/dramatic recommended]. [Atmospheric: sweat, dust, breath visible in cold air, blood if appropriate]. Dolby Vision HDR.

0.0s–Xs: [Setup — camera angle, both fighters' positions, who initiates].

X.Xs–Xs: [Attack sequence — describe the strike anatomically, direction of force, camera tracks or holds].

X.Xs–Xs: [IMPACT — TIME REMAP to ~10–20% speed. Point of contact described precisely. SWEAT SPRAY / IMPACT FLASH if applicable].

X.Xs–Xs: [Reaction — where does defender go? Fall direction, stumble, block rebound]. → [TRANSITION TYPE].
```

---

## Signature Fighting Techniques

- **The Impact Freeze** — FREEZE 3 frames at point of contact, then SLOW MOTION release into the defender's reaction. Creates a visual punctuation mark on the hit.
- **Cross-Cut Impact** — cut between the attacker's face (intensity) and the defender's face (shock) at the moment of impact. Never show the hit directly — both reactions sell it.
- **Speed Contrast** — attack in real time, reaction in TIME REMAP extreme slow-mo. The asymmetry feels disorienting and powerful.
- **Camera Takes the Hit** — handheld camera physically shakes and drops slightly at the moment of impact, as if the camera operator felt it.
- **The Wide Reveal** — tight on hands and feet throughout the exchange, then cut wide to reveal both fighters' full positions. Geography reorientation.
- **Environmental Destruction Beat** — a heavy throw or slam causes the environment to react: cage dents, floor boards crack, wall cracks — show the force through the setting.
