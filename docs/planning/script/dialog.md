# Dialog Scene Prompts

## When to use this category
Characters are speaking, reacting, or having a conversation. The emotional core is in the face, eyes, and body language — not the environment or effects.

## Default model
🟢 **Seedance 1.5 Pro** — Dialog is almost always 1.5 Pro. Only escalate to 2.0 if the conversation happens inside an active VFX environment (burning building, mid-explosion, etc.).

---

## Image Prompt Guide for Dialog

Focus on:
- **Facial expression + emotion** — name it precisely: "jaw slightly slack, eyes scanning left, a flicker of distrust"
- **Eyeline** — where are they looking? Toward camera, off-screen left, downward in shame?
- **Framing** — close-up favors intimacy; medium shot shows body language; two-shot shows relationship
- **Lighting quality** — hard directional light (interrogation), soft diffused (confession), practical source (desk lamp, window)
- **Background relationship** — in-focus background signals equal weight; heavy bokeh isolates the speaker

Template:
```
[Subject description + emotional state]. [Clothing + context clues]. [Lighting setup: source, quality, direction]. [Camera framing + lens feel]. [Background: depth, setting, level of blur]. Cinematic, photorealistic, 16:9.
```

Example:
```
A woman in her early 40s, plain white shirt, sits across from someone off-screen. Her expression is carefully neutral — eyes steady, jaw set — but her hands are clasped too tightly in her lap. Soft overcast window light from the left, catching the sharp line of her cheekbone. Medium close-up, slight low angle. Office background in deep bokeh, desk edge visible. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Dialog (1.5 Pro)

Dialog video prompts are about **micro-movement and emotional progression**, not camera action.

Key beats to capture:
1. **Listening beat** — character hears something, registers it
2. **Processing beat** — face shifts, body language changes
3. **Reaction beat** — what they do with the information

Camera rules:
- Push in gently during emotional escalation: "Camera creeps in imperceptibly, adding weight to the pause"
- Hold still on big moments: "Camera locked off, no movement. Let the silence breathe."
- Rack focus for two-shot dynamics: "Focus shifts from foreground face to background face mid-sentence"
- Avoid dramatic zooms or sweeping moves — dialog is intimate, not cinematic action

Speed rules:
- Rarely use slow-motion unless lingering on a key reaction: "60% speed on her face as his words land"
- Avoid time remaps — keep it naturalistic

Format:
```
0.0s–Xs: [Shot framing]. [What character does — be specific about face, eyes, breath, hands]. [Camera behaviour]. [Atmospheric note if relevant: ambient sound, light shift].

X.Xs–Xs: [Next beat. The shift — what changes emotionally]. [Any cut note or transition].
```

Example:
```
0.0s–1.5s: Medium close-up on her face. She listens — expression neutral, almost rehearsed. Eyes hold steady on the person off-screen. Camera locked off. A slight tightening around the jaw.

1.6s–2.8s: Her eyes drop for one beat — just a flicker. She looks back up and her expression re-locks into neutral. Camera gently creeps in ~5%. Transition: → CUT.
```

---

## Signature Dialog Techniques

- **The Long Hold** — camera locked, character doesn't speak. Silence as tension device. "Camera holds. No movement. No sound cue. Three full seconds on his face."
- **The Listener Reaction** — don't cut to the speaker, stay on the listener. Their face tells the real story.
- **The Interrupted Cut** — character begins to speak, cut before the words come out. Mid-breath.
- **The Double** — two-shot, both characters in frame. Neither speaks. Let the space between them do the work.
- **The Reveal Push** — slow imperceptible push-in that the viewer only notices when they've arrived.
