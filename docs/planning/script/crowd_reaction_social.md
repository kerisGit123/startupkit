# Crowd Reaction & Social Scene Prompts

## When to use this category
Bar brawls with bystanders, street fights with crowd witnesses, public events with reaction shots, social viral moments, any scene where the **audience watching an event is as important as the event itself**. The reaction shots carry the emotional weight — they are not B-roll, they ARE the scene.

## Default model
🟢 **Seedance 1.5 Pro** — reaction shots, bystander close-ups, and crowd moments are almost always 1.5 Pro. The action beat may escalate to 2.0, but the crowd structure is 1.5 Pro.

---

## Language patterns observed in real prompts

The bar fight with crowd reactions (SHOT 01–06 format) showed a unique structural system that no other category uses. The defining feature is the **CUT TO REACTION** insert — a mandatory interrupt between every action beat.

**The CUT TO REACTION structure:**
```
[ACTION BEAT]
CUT TO REACTION (quick insert)
[REACTION BEAT: who, what expression, what they say, camera detail]
```

This pattern repeated for every action beat. The creator treated reactions as mandatory grammar, not optional.

**Reaction shot language:**
- "close-up on a guy's face (clear, in focus)" — clarity and focus are specified because reaction shots often fail when the background is too busy
- "...ahh shit..." (low, real tone)" — dialogue in reactions is always in parentheses and described by tone, not just content
- "big grin, hyped" — two-word emotion description
- "dead serious guy" — one adjective + the noun "guy" — keep reaction descriptions short
- "camera slightly shakes as if operator reacting too" — the camera PARTICIPATES in the reaction
- "she leans slightly to see better" — bystander body language: lean forward = curiosity

**Dialogue in crowd scenes — the tone markers:**
All dialogue in crowd prompts included tone descriptors in parentheses:
- `"...ahh shit..." (low, real tone)` — quiet, genuine
- `"OOOHHH — he got him!"` — capitalised = loud, communal
- `"nah this is crazy..." ` — lowercase = mumbled, phone-in-hand energy
- `"record properly bro!"` — direct, fast
- `"yeah... that's enough cardio for today"` — comedic, deadpan delivery

**The phone filming insert:**
- "guy filming on phone, face lit by screen" — the phone screen as a practical light source on the bystander's face
- This is a consistent beat in social scene prompts — there's always someone recording

**Camera behaviour in crowd scenes:**
- "camera stays close, bodies partially blocking frame" — partial obstruction reads as authenticity
- "camera naturally stops with them" — the camera has agency that mimics a real operator
- "camera slowly drifts to him" — the drift is the editorial choice, not a cut
- "SHOT [N] (X-Xs)" — timestamped shot numbers are the structural format for this category

---

## Image Prompt Guide for Crowd Reaction

Reaction shots need one face, clearly in focus, with enough environment visible to establish the social setting.

**The reaction close-up:** Face fills at least 60% of frame. One emotion. No ambiguity. The background tells you where they are, but shouldn't compete.

**Social environment tells:**
- "guy filming on phone, face lit by screen" — phone screen light = they're recording = social moment
- "holding cup" — drink in hand = bar or party setting
- "eyebrows raised" — universally readable reaction from any distance

Template:
```
[Subject: demographic descriptor + what they're doing]. [Emotional state: one clear description]. [Camera: close-up, what is in focus]. [Background: environment glimpse, out of focus]. [Practical light source if any: phone screen, neon, overhead bar light]. Handheld, naturalistic, cinematic 16:9.
```

Example:
```
Close-up on a young woman in the bar crowd, holding a red plastic cup at chest height. Eyebrows raised, head tilted slightly left — pure surprise, not yet amused. Eyes tracking something off-screen left. Her face is sharp in focus; behind her, bodies and bottle-light blur into a warm amber smear. Overhead bar pendant light catches the top of her head. Handheld, naturalistic, cinematic 16:9.
```

---

## Video Prompt Guide for Crowd Reaction (1.5 Pro)

The SHOT-numbered format is the native format for this category. Use it.

**Shot numbering format:**
```
SHOT [N] ([start]–[end]s) — [SCENE NAME IN CAPS]
[Location: back to main / back to fight / CUT TO REACTION]
[Action description]
[Camera behaviour]
CUT TO REACTION (quick insert) [or: CUT TO REACTION (IMPORTANT) / CUT TO REACTION (CLEAR FACE)]
[Reaction subject description]
[Reaction: expression + dialogue if applicable]
[Camera behaviour during reaction]
```

**Reaction classification:**
- `(quick insert)` — a flash cut, 0.5–1 second, just the face
- `(IMPORTANT)` — a held reaction, 1–2 seconds, the emotion lands
- `(CLEAR FACE)` — instruction to the model: this person must be unobstructed and fully lit

**The Walk-Off ending:**
The dataset showed a consistent ending structure for social scenes:
1. The combatants disengage — "they stare + drop it"
2. They walk past each other — "walk past each other"
3. Camera drifts to a final witness — "camera slowly drifts to him"
4. Final line — deadpan, comedic, or observation: `"yeah... that's enough cardio for today"`

This ending beat (deflation after tension) is a signature of the social scene genre.

---

## Signature Crowd Reaction Techniques

- **The Operator React** — camera shakes briefly at the moment of impact, as if the handheld camera operator physically reacted to what they witnessed. "camera slightly shakes as if operator reacting too" — the camera FEELS the hit.
- **The Phone Screen Light** — a bystander filming on their phone. Their face is lit by the phone screen from below. This creates a second light source in the crowd and signals the social/viral nature of the event.
- **The Lean-In** — bystander with a drink leans slightly forward to see better. The lean is the reaction. No dialogue needed. The body says "this just got interesting."
- **The Deadpan Ender** — the final reaction shot is someone who has processed the event and arrived at a casual, funny observation. Low tone, casual delivery. Deflates the tension completely.
- **Camera Drift to Witness** — instead of cutting to the final reaction, the camera slowly drifts across the scene to land on the last witness. The drift signals editorial selection — this is the chosen perspective on what just happened.
- **The Partial Frame Block** — during the main action, bodies partially obstruct the camera. The viewer sees the fight through the crowd. The obstruction is intentional — it creates the sensation of being in the crowd, not above it.
