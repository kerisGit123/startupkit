# Pose & Showcase Scene Prompts

## When to use this category
Product reveals, character introductions, fashion moments, hero poses, brand/logo reveals, object showcases. The subject is being *presented* to the viewer. Motion is deliberate, composed, controlled.

## Default model
🟢 **Seedance 1.5 Pro** — pose scenes are low-complexity by nature. Only use 2.0 if the reveal involves a VFX moment (e.g., the product materialises from light, particle assembly, etc.).

---

## Image Prompt Guide for Poses & Showcases

Pose prompts are about **perfection of presentation** — lighting is key, framing is deliberate, every element in the image serves the subject.

Focus on:
- **Subject placement** — centre vs rule-of-thirds; relationship to the camera
- **Lighting rig** — describe the quality, source, and direction. Product/pose shots live or die by the light.
- **Background relationship** — clean studio, environmental context, or abstract bokeh; state explicitly
- **Material quality** — describe what the subject is made of and how the light interacts with it

Template for product/object:
```
[Object name + specific model/variant if known]. [Material surface: matte, gloss, brushed metal, leather]. [Orientation: three-quarter angle, face-on, top-down]. [Lighting: key light position + quality, fill, rim/back]. [Background: clean white, gradient, natural environment]. [Camera: macro lens, standard product shot angle]. Cinematic, photorealistic, 16:9.
```

Template for character/person pose:
```
[Subject description + clothing]. [Specific body position — not 'standing confidently' but 'weight shifted to right hip, arms crossed low, chin tilted slightly up']. [Eyeline: camera or off-screen]. [Lighting setup]. [Background and depth]. Cinematic, photorealistic, 16:9.
```

Example (product):
```
A luxury mechanical watch, brushed titanium case, sapphire crystal face, black dial with orange second hand. Three-quarter angle, slightly above. Three-point lighting: main from upper-left (hard, creates sharp edge highlight on case), soft fill from right, cool-blue rim light from behind separating it from the background. Dark gradient background, navy-to-black. Macro lens, watch fills 70% of frame. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Poses & Showcases (1.5 Pro)

Pose video prompts are about **choreographed, graceful motion** — the subject moves into the pose, or the camera moves around the subject. The movement should feel intentional and considered, never rushed.

Camera movement options (pick one per scene):
- **Slow orbit** — camera circles the subject at a consistent distance. Reveals all angles.
- **Pull-back reveal** — subject is static, camera slowly pulls back to reveal the full context.
- **Push-in close** — camera slowly approaches a detail — logo, face, material texture.
- **Rise shot** — camera starts at ground level and slowly rises to reveal subject top-down or face-level.
- **Turntable** — subject rotates (or camera circles) in one direction. Clean, classic product/fashion move.

Subject motion options:
- **Hold** — subject holds the pose. Only camera moves.
- **Slow settle** — subject arrives into pose during the shot. The end state is the hero frame.
- **Look to camera** — subject begins off-axis, slowly turns to make eye contact with the lens.
- **Item reveal** — hand lifts object into frame from below, or fabric unfolds, or lid opens.

Format:
```
0.0s–Xs: [Starting frame]. [Subject in position or arriving]. [Camera starting position and beginning movement]. [Speed: very slow recommended — 30–50% speed for smooth motion].

X.Xs–Xs: [Mid-movement]. [What is being revealed]. [Any light change or catch-light appearing on subject].

X.Xs–Xs: [Arrival at hero frame]. [Camera settles or holds]. [Subject fully composed in pose]. → [TRANSITION TYPE — usually → HOLD or → SLOW FADE].
```

---

## Signature Pose & Showcase Techniques

- **The Catch-Light Moment** — camera move is timed so a specular highlight (catch-light) sweeps across the subject's eye or the product's surface at the midpoint of the shot. Instant elegance.
- **The Negative Space Hold** — subject enters from edge of frame and holds in a composition with significant intentional negative space. Let the emptiness breathe.
- **The Texture Push** — extreme close-up push-in to a material surface: leather grain, watch dial texture, fabric weave. Ends on a detail too small to see from a normal shot.
- **The Reveal Pull-Back** — begin on a tight close-up detail, pull back slowly to reveal the full product or person. Audience doesn't know what they're looking at until the pull completes.
- **The 360° Slow Orbit** — camera circles the subject at consistent speed and framing. Works for both character introductions and product reveals.
