# Action Scene Prompts

## When to use this category
Fast movement, athletic performance, physical conflict, stunts, chase sequences, sports moments. The energy is kinetic — the camera has to work as hard as the subject.

## Default model
🔴 **Seedance 2.0** for anything involving rapid multi-element motion, impact, or complex body dynamics.  
🟢 **Seedance 1.5 Pro** for single-subject athletic motion with no VFX (a clean sprint, a jump, a martial arts form).

---

## Image Prompt Guide for Action

Focus on:
- **Peak action frame** — capture the moment of maximum energy: the apex of a jump, the instant before impact, the full extension of a punch
- **Motion blur intention** — should it be frozen sharp (feels powerful, dramatic) or motion-blurred (feels fast, visceral)?
- **Environment texture** — grit, sweat, dust, spray all add authenticity; name them
- **Lens choice** — wide angle distorts space and makes speed feel faster; telephoto compresses and isolates

Template:
```
[Subject at peak action — specific body position, limb placement, direction of force]. [Environmental context: surface, weather, debris]. [Lighting: hard/dramatic for impact, natural/flat for sport]. [Camera framing + angle: low angle heroic, high angle vulnerability]. [Motion blur or frozen sharp]. Cinematic, photorealistic, 16:9.
```

Example:
```
A male sprinter explodes off the starting blocks — torso parallel to the track, arms driving back, face contorted in max effort. Wet track surface reflects stadium lights in smeared streaks. Hard overhead lighting, strong shadow. Extreme low angle, lens at ground level. Limbs sharp, background in motion blur. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Action (2.0)

Action video prompts need **precise directional language** — where is the subject moving relative to camera, where is the camera moving relative to the subject, and what happens at the moment of impact or apex.

Key structure:
1. **Build beat** — anticipation, preparation, tension coiling
2. **Release beat** — the action happens; peak energy
3. **Aftermath beat** — consequence, landing, debris settling, silence after the chaos

Camera rules:
- Name camera moves by direction: "Camera tracks left with the runner", "Camera whip-pans to follow the punch"
- Use extreme slow-motion at the moment of highest impact (TIME REMAP)
- Use SMASH CUT to exit action scenes — hard, no fade
- Dutch angle during chaos; locked off for the aftermath contrast

Format (Seedance 2.0):
```
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. [Colour grade]. Film grain. [Environment lighting + weather]. [Atmospheric particles: dust, sweat, rain, sparks]. Dolby Vision HDR.

0.0s–Xs: [Build or approach]. [Camera position and movement]. [Speed note]. [Subject's body and momentum direction].

X.Xs–Xs: [Peak action beat]. [TIME REMAP if relevant]. [Impact detail — what specifically collides, lands, breaks]. [Camera behaviour during impact]. [Key visual effect in CAPS if applicable].

X.Xs–Xs: [Aftermath]. [What settles, falls, lands]. [Camera holds or drifts]. → [TRANSITION TYPE].
```

---

## Signature Action Techniques

- **TIME REMAP to SMASH CUT** — extreme slow-mo at peak, then sudden hard cut to full speed. Whiplash contrast.
- **Ground-Level Tracking** — camera hugs the floor or surface, tracking with the subject at wheel height / boot height
- **The Freeze-Release** — 3-frame FREEZE at moment of impact, then TIME REMAP releases into full speed chaos
- **Wide-to-Extreme-Close** — open on wide establishing shot, cut hard to extreme close-up of hands/feet/face at peak exertion
- **Reactive Environment** — show the environment reacting before showing the subject: dust kicks up before the runner enters frame, the crowd blurs before the ball arrives
