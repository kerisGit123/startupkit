# Driving & Drift Scene Prompts

## When to use this category
Automotive content: high-speed driving, drifting, car chases, race footage, cinematic car reveals, mountain pass drives, night city driving. The vehicle is the subject. Everything else serves the car and its motion.

## Default model
🔴 **Seedance 2.0** for drift sequences, tyre smoke, multi-car shots, and anything requiring complex motion tracking.  
🟢 **Seedance 1.5 Pro** for static car reveals, simple tracking shots on a straight road, or slow rolling shots.

---

## Image Prompt Guide for Driving & Drift

Automotive image prompts require **three locked variables**: the car's exact position relative to camera, the camera's position relative to the road, and what the environment is doing (smoke, spray, dust, light).

Car position vocabulary:
- **Three-quarter front** — camera at 45° to front, sees hood and one side. Classic reveal angle.
- **Three-quarter rear** — camera at 45° to rear, sees boot and one side. Classic departure shot.
- **Low broadside** — camera dead-side, very low angle. Full silhouette, emphasises length and stance.
- **Chase angle** — camera behind and above, following. Road visible ahead.
- **Oncoming** — car approaching camera head-on. Headlights facing the lens.

Drift-specific frame elements:
- **Tyre smoke** — volume, colour (white = cold tyre, blue-grey = hot), direction of trail
- **Drift angle** — how much oversteer? A gentle 10° drift vs a full 45° sideways slide are very different shots
- **Road surface** — wet (reflections), dry track (tyre marks visible), gravel (rooster tails)

Template:
```
[Car description: make, model, colour, condition]. [Car position relative to camera: see vocabulary above]. [Drift angle if applicable]. [Environmental atmosphere: smoke volume/colour, road surface, weather]. [Background: empty mountain pass, industrial port, race track, night city]. [Lighting: golden hour, halogen streetlights, track lighting, overcast]. [Camera position: low angle, helicopter, chase mount]. Cinematic, photorealistic, 16:9.
```

Example:
```
A matte black Nissan Silvia S15, wide-body kit, deep-dish wheels, caught mid-drift at approximately 40° oversteer. Three-quarter rear angle, camera very low near tyre height. Dense white tyre smoke billows from the rear arches, trailing diagonally to the right. Wet industrial port at night — orange sodium lamp reflections streak across the puddle-covered concrete. Camera at road surface level. Cinematic, photorealistic, 16:9.
```

---

## Video Prompt Guide for Driving & Drift (2.0)

Automotive video prompts need **kinetic energy cues** — tell the model what the car sounds like visually (wheel spin, body roll), how the smoke behaves over time (builds, drifts, disperses), and how the camera relates to the vehicle's momentum.

Camera mount vocabulary:
- **Static camera, car passes** — camera is fixed, car enters and exits frame
- **Chase camera** — camera follows at consistent distance and speed
- **Helicopter/drone** — camera above, tracking from altitude
- **Bonnet/hood mount** — camera on the car, sees the road and driver ahead
- **Low road-level static** — camera on the deck as car passes overhead or adjacent

Drift sequence structure:
1. **Entry beat** — car approaching the corner or initiation point at speed
2. **Initiation beat** — the flick or handbrake pull that breaks traction. Rear steps out.
3. **Drift hold beat** — car is fully sideways, maintaining the angle. Smoke peak.
4. **Exit beat** — car straightens, accelerates out. Smoke trails behind.

Format (Seedance 2.0):
```
Shot on ALEXA 65mm anamorphic lens. Photorealistic cinematic quality. Aspect ratio 16:9 widescreen. [Colour grade — night port: teal-green shadows, orange sodium highlights / mountain pass: cool blue-grey, golden late light]. Film grain. [Road surface, weather, location atmosphere]. [Tyre smoke density and behaviour]. [Any lens contamination: rubber particles, dust on lens]. Dolby Vision HDR.

0.0s–Xs: [Camera position and mount type]. [Car approaching or entering at speed]. [Environment establishing detail]. [Speed note if time-remapped].

X.Xs–Xs: [Initiation or drift entry]. [Car angle, direction of slide]. [TIME REMAP if applicable — peak smoke moment]. [Camera response to the car's movement].

X.Xs–Xs: [Drift hold or peak moment]. [Smoke volume at maximum]. [What the camera sees: the angle, the trails, the environment passing].

X.Xs–Xs: [Exit or transition]. [Car straightens or disappears from frame]. [Camera holds on smoke trail or follows exit]. → [TRANSITION TYPE].
```

---

## Signature Driving & Drift Techniques

- **The Low Pass** — camera at road level, car passes left-to-right or right-to-left just above lens height. Tyre noise implied by the proximity. The undercarriage fills the top of frame briefly.
- **The Smoke Hold** — after the car exits frame, camera HOLDS on the drifting tyre smoke for 2–3 seconds. The absence of the car is the shot.
- **TIME REMAP on Initiation** — the flick that breaks traction is the hero moment. Extreme slow-mo at initiation, then real-time through the hold.
- **Helicopter Reveal** — drone starts on empty road or track, car enters corner at speed from above. The geometry of the drift is visible from altitude — shows the full arc.
- **Wet Road Reflection** — wet surface reflections of headlights or streetlamps distort and streak as the car passes through. Doubles the visual information in the frame.
- **Chase Camera Perspective Shift** — chase camera starts close behind the car, gradually distances during the drift until the full angle of oversteer is visible.
- **Night Light Trails** — long-exposure-feel where headlights and brake lights leave visible light smears through the turn. Stylised but effective for night drift sequences.
