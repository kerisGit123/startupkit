# Music Video & Fashion Scene Prompts

## When to use this category
Sync-to-beat choreography, fashion editorial sequences, multi-character performance shots, artist/model presentations, neon fashion cinematography, dance or movement sequences timed to a musical pulse. The defining feature is that **movement is choreographed to a beat** and **the body IS the product being presented**.

## Default model
🔴 **Seedance 2.0** for speed-ramp moments, strobe light sequences, and multi-character wide shots with complex staging.  
🟢 **Seedance 1.5 Pro** for single character fashion walks, simple hold poses, individual close-up reaction beats.

---

## Language patterns observed in real prompts

The fashion/music video prompt in the dataset showed a highly specific language system unlike any other category. Key patterns:

**Beat-sync language (tying action to music):**
- "@image 2 punches fists outward on first Oh oh oh" — action tied to a specific lyric/beat moment
- "@image 3 rolls shoulders on second" — sequential character actions across beats
- "Smash cut wide aerial descending — silver-lit corridor below" — cut type + camera move named together
- "strobe pulse left to right across all three faces" — direction of strobe sweep specified
- "Cut medium close-up handheld @image 2 — head back, cat-eye in overhead silver" — camera type + framing + character + lighting detail all in one line

**Movement direction language:**
- "punches fists outward" — direction of the gesture matters (outward vs upward vs downward)
- "rolls shoulders" — isolated body part movements are named precisely
- "walks forward alone, boots on wet ground, hair jaw set, eyes forward" — walk described as a series of body parts: feet, jaw, eyes
- "chins tilting" — group action, same moment, described as plural
- "head back, cat-eye in overhead silver" — body position describes both the physical state and the lighting result simultaneously

**Staging language:**
- "@image 2 left, @image 1 center, @image 3 right" — characters staged in screen positions
- "Wide stabilized low-angle" — camera type + stability + angle all specified together
- "ECU locked-off" — extreme close-up, no camera movement
- "Cut wide neon pooling at feet" — the neon isn't just in the background, it pools at their feet — a specific physical light position

**Atmosphere / environment language:**
- "Near-black stage shifts to silver-lit space mid-clip" — the environment itself changes mid-video
- "Wet concrete floor" — the surface material matters (reflections)
- "Cold blue neon gives way to silver-white overhead light" — colour temperature transition as a narrative beat
- "reflection fractures beneath" — the reflection in the wet floor fractures when a boot hits it

---

## Image Prompt Guide for Music Video / Fashion

Fashion prompts prioritise **the body in space** — the frame composition, the clothing material in specific light, and the exact body position. Every element reinforces the garment or the artist.

**Fashion lighting vocabulary:**
- Cold blue neon / silver-white overhead / warm amber fill — always name two light sources in contrast
- "Wet concrete floor. Cold blue neon gives way to silver-white overhead light" — floor reflections double the lighting complexity
- "strobe" — a pulsing light source, not constant; name the direction of the strobe sweep
- "neon pooling at feet" — neon is a floor-level light source that creates ankle/boot glow

**Body position language:**
Rather than describing emotions, describe the specific geometry of the body:
- "holds chest locked, hand grips lapel, knuckles tight" — three sequential body descriptors
- "head back, eyes forward, silver light on zipper trim" — position + eyeline + what the light hits
- "boots on wet ground, hair jaw set" — two body elements that communicate an attitude without naming the attitude

Template:
```
[Character label if @image used]. [Body position: head, torso, hands, feet — in order top to bottom]. [Eyeline: camera or off-axis]. [Clothing detail that the light hits: name the specific item and the light interaction]. [Background/staging: position on stage or in environment]. [Floor detail if relevant: wet, reflective, what pools there]. Cinematic, [film stock feel], 16:9.
```

Example:
```
@image 1 THE ANCHOR center-frame. Head level, jaw set, eyes directly into the lens — no warmth, complete composure. Left hand grips black moto jacket lapel, knuckles visible. Silver overhead light catches the jacket's silver zipper in a clean vertical line from chest to waist. Wet concrete floor below — the silver light pools and reflects beneath her boots in a fractured mirror. Black stage behind, no detail. Cinematic, 24fps, 16:9.
```

---

## Video Prompt Guide for Music Video / Fashion (2.0 + 1.5 Pro mix)

Music video prompts are built in **STATIC** (pose/hold) and **DYNAMIC** (movement/transition) blocks. Creators in the dataset used these exact labels. The rhythm alternates between them.

**STATIC DESCRIPTION block** — a held pose, a locked camera, a frozen moment on the beat:
- Camera: "locked-off" or "ECU locked-off"
- Subject: "freeze", "hold", "still"
- Beat-sync action: "strobe pulse across faces", "boot heel connects with floor"
- Atmospheric: light changes on the static body — the environment moves, not the character

**DYNAMIC DESCRIPTION block** — movement, transition, speed ramp:
- Camera: "smash cut", "wide aerial descending", "handheld"
- Subject: choreographed action tied to beat — "punches fists outward", "rolls shoulders"
- Transition: always name the cut type when moving between blocks

**Speed ramp language:**
- "speed ramp stabilized low-angle" — speed ramp is built into the camera specification
- "High contrast, 24fps, speed ramp stabilized" — 24fps is the standard; note it when it's intentional
- SMASH CUT between STATIC and DYNAMIC blocks — hard cuts sell the beat-sync

Format (multi-character music video):
```
STYLE AND MOOD
[Overall aesthetic: lighting palette, film feel, floor/stage material, colour transition if environment changes mid-clip].

DYNAMIC DESCRIPTION
[Beat 1 — character + action + camera, tied to a specific lyric or beat moment].
[Beat 2 — next character or camera move].
[Transition type: SMASH CUT, CUT TO, wide/tight shift].

STATIC DESCRIPTION
[Hold moment — ECU or locked-off on a specific character or group].
[What the light does to them while they're still: strobe direction, neon pool, reflections].
[Floor detail: reflection behaviour — fractures, pools, streaks].
```

---

## Signature Music Video / Fashion Techniques

- **The Boot Drop ECU** — extreme close-up locked on a boot sole hitting wet concrete. The reflection below fractures on contact. Cut to wide on the aftershock. Works on any beat with a bass hit.
- **The Strobe Pan** — strobe light sweeps left-to-right across multiple characters standing in a row. Each face is lit and darkened in sequence. Camera locked-off.
- **The Silver Shift** — environment transitions mid-clip from dark/neon to silver-white overhead. The characters don't move — the world changes around them. Works as a chorus marker.
- **The Lone Walk** — single character walking forward alone in the same environment previously shared with others. The isolation of the space is the emotional beat.
- **The Fractured Reflection** — camera cuts to the wet floor as a boot or heel strikes it. The reflected image shatters. Cut back to the character. The reflection moment is the accent beat.
- **The Freeze-All Strobe** — all characters freeze simultaneously on a specific beat. Strobe pulses across all of them left to right. Releases on the next beat into movement. Extreme contrast between frozen and kinetic.
- **The Three-Point Stage** — three characters positioned left-center-right. Camera starts wide (all three visible), then cuts between individual ECU shots in beat-sync order before returning to wide.
