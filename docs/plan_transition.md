# Video Editor — Transition System

> **Status:** Partially implemented (Session #17, 2026-04-27)
> **Next:** Fix rendering bugs, test all types, polish UX

---

## Architecture

Transitions are implemented as an **overlay layer type** (`type: "transition"`), not as a property on clips. This means:

- Transitions live in the **Layers track** alongside text, shapes, videos
- Users **position the transition layer** across the boundary between two video track clips
- The system auto-detects which clips overlap and blends between them
- Duration is controlled by the layer's `startTime`/`endTime` (drag edges in timeline)

### Why Layer-Based (vs Per-Clip)

| Approach | Pros | Cons |
|----------|------|------|
| Per-clip transition | Simpler mental model | Tight coupling, harder to adjust timing |
| **Layer-based (ours)** | Flexible positioning, visible in timeline, reusable, consistent with other layers | Slightly more setup |

Inspired by Canva's approach where transitions sit between clips as separate elements.

---

## Data Model

```typescript
// In OverlayLayer interface (types.ts)
type: "transition"  // layer type
transitionType?: "crossfade" | "fade-color" | "slide-left" | "wipe" | "cross-dissolve"
backgroundColor?: string  // color for "fade-color" type (default "#000000")

// x/y/w/h are set to full canvas (0, 0, CW, CH) but not visually used
// startTime/endTime define the transition window
```

### Helper: `getTransitionClips()`

```typescript
// types.ts — finds the two clips at a transition boundary
getTransitionClips(clips, transStartTime, transEndTime)
// Returns: { clipA, clipB } — the outgoing and incoming clips
// clipA: clip whose end falls within the transition window
// clipB: clip whose start falls within the transition window
```

---

## Transition Types

### 1. Crossfade

- Clip A opacity fades 100% to 0%
- Clip B opacity fades 0% to 100%
- Both drawn simultaneously
- **Preview:** Clip B overlaid with `opacity: progress`
- **Export:** `ctx.globalAlpha = progress` then draw clip B over A

### 2. Fade to Color

- First half (progress 0 to 0.5): Clip A fades to solid color
- Second half (progress 0.5 to 1): Color fades to reveal Clip B
- Color is configurable (default black, can be white or any color)
- **Preview:** Color overlay div with `opacity: p < 0.5 ? p*2 : (1-p)*2`
- **Export:** Fill rect with color at computed opacity; redraw clip B in second half

### 3. Slide Left

- Clip A slides out to the left
- Clip B slides in from the right
- **Preview:** `transform: translateX(-p*100%)` on A, `translateX((1-p)*100%)` on B
- **Export:** `ctx.translate()` for each clip

### 4. Wipe

- Vertical line sweeps left to right
- Clip B is revealed under Clip A progressively
- **Preview:** `clipPath: inset(0 ${(1-p)*100}% 0 0)` on clip B
- **Export:** `ctx.rect(0, 0, W*p, H)` + `ctx.clip()` then draw B

### 5. Cross Dissolve

- Same as crossfade technically
- Could add subtle blur/softness in future (canvas `filter: blur()`)
- Currently renders identically to crossfade

---

## File Changes (Session #17)

| File | Changes |
|------|---------|
| `types.ts` | Added `"transition"` to OverlayLayer type union, added `transitionType` field, added `getTransitionClips()` helper |
| `LayerPanel.tsx` | Added Blend button (creates transition layer), transition properties panel (type dropdown, color picker), layer icon |
| `TimelineTracks.tsx` | Added transition icon (Blend, rose color), label shows transition type name, rose gradient track color |
| `PreviewCanvas.tsx` | Detects active transition layers, computes progress, renders CSS-based transition effects over base content. Accepts `videoClips` prop for clip detection |
| `useExport.ts` | Detects active transitions per frame, draws both clips with canvas-based blending (opacity, translate, clip) |
| `VideoEditor.tsx` | Passes `videoClips` to PreviewCanvas |

---

## How to Use

1. Add 2+ clips to the **Video Track** (e.g., Clip A = 0-5s, Clip B = 5-10s)
2. Open **Layers** panel
3. Click the **Blend** button (transition icon)
4. A transition layer appears in the Layers timeline track
5. **Drag the transition layer** so it spans the boundary between Clip A and Clip B (e.g., 4s-6s)
6. Adjust duration by dragging the layer's left/right edges
7. Select the transition layer and choose effect type in **Properties**
8. For "Fade to Color" pick the fade color

```
Timeline Example:
Video Track:  [ Clip A (0-5s)  ][ Clip B (5-10s)  ][ Clip C (10-15s) ]
Layers Track: .........[crossfade 4-6s].........[wipe 9-11s].........
```

---

## Known Issues / TODO (Next Session)

### Rendering

- [ ] **Preview crossfade quality** — currently overlays clip B image on top with opacity; should properly blend both clips. Consider using an offscreen canvas for true alpha compositing
- [ ] **Slide-left in preview** — base content doesn't actually slide (only the overlay moves). Need to transform the base content div too
- [ ] **Video clip B in preview** — the `<video>` element for clip B in transitions doesn't sync to correct time (just shows first frame)
- [ ] **Cross-dissolve differentiation** — currently identical to crossfade. Could add subtle canvas `filter: blur()` for softness

### Export

- [ ] **Fade-to-color second half** — the `clearRect` + redraw approach may cause flicker. Test and refine
- [ ] **Clip B video seeking in export** — overlay transition needs to seek clip B's video element to the correct offset during the transition window
- [ ] **Test all 5 types end-to-end** — verify crossfade, fade-color, slide-left, wipe, cross-dissolve all export correctly

### UX

- [ ] **Auto-position transition** — when adding a transition, auto-detect the nearest clip boundary and position there instead of at playhead
- [ ] **Transition preview on hover** — show a mini-preview of the effect when hovering over transition type options
- [ ] **Snap to clip boundary** — when dragging a transition layer, snap its center to clip boundaries
- [ ] **Visual indicator in video track** — show a small diamond or gradient at the clip boundary where a transition is active
- [ ] **Duration presets** — quick buttons for 0.3s, 0.5s, 1.0s, 1.5s transition durations
- [ ] **Prevent invalid placement** — warn if transition doesn't overlap a clip boundary

### Future Transition Types (Phase 2)

- [ ] **Slide Right** — opposite of slide-left
- [ ] **Slide Up / Slide Down** — vertical slides
- [ ] **Zoom In** — clip A zooms in and fades, revealing clip B
- [ ] **Zoom Out** — clip B zooms out from center
- [ ] **Blur** — clip A blurs out, clip B blurs in
- [ ] **Iris** — circular reveal from center
- [ ] **Clock Wipe** — radial wipe like a clock hand
- [ ] **Pixelate** — clip A pixelates, resolves into clip B

---

## Technical Notes

### Progress Calculation

```typescript
const progress = (currentTime - transition.startTime) / (transition.endTime - transition.startTime);
// progress: 0.0 = start of transition (fully clip A)
// progress: 1.0 = end of transition (fully clip B)
```

### Clip Detection Logic

`getTransitionClips()` finds clips by checking:

- **Clip A (outgoing):** clip whose end time falls within the transition window
- **Clip B (incoming):** clip whose start time falls within the transition window

The video track clips are sequential (no overlap). Their boundaries are computed by summing `getVisDur()` for each clip.

### Preview vs Export Rendering

| Aspect | Preview (CSS) | Export (Canvas) |
|--------|--------------|-----------------|
| Clip A | Already rendered as base content | Drawn first with `drawImage` |
| Clip B | Overlaid as `<img>`/`<video>` element | Drawn with `ctx.globalAlpha` or `ctx.clip()` |
| Opacity | CSS `opacity` property | `ctx.globalAlpha` |
| Slide | CSS `transform: translateX()` | `ctx.translate()` |
| Wipe | CSS `clip-path: inset()` | `ctx.rect()` + `ctx.clip()` |
| Color | CSS `backgroundColor` + `opacity` | `ctx.fillStyle` + `ctx.globalAlpha` + `ctx.fillRect()` |
