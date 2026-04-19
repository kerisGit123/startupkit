The **identity sheet** is not the final scene itself.
Its role is to act as a **visual reference anchor** so that every later generation (images or video) keeps the **same character design**.

In practice, the sheet becomes **Image 1** in later prompts.

Below is a clear example workflow.

---

# 1. Step 1 — Generate the Creature Identity Sheet

First create the **monster reference sheet**.

Example prompt:

```
Create a professional creature identity sheet based strictly on the uploaded reference image.

[Creature Identity Sheet v2 prompt here]
```

The output will be a **reference sheet showing multiple angles of the creature**.

This becomes your **master character reference**.

---

# 2. Step 2 — Use the Sheet as Reference for Scenes

When generating a scene, include the sheet as **Image 1**.

Example:

### Scene Prompt

```
Image 1: Creature identity sheet reference.

Use Image 1 as the canonical creature reference.

Generate a cinematic scene of the creature emerging from deep ocean water at night near a research submarine.

The creature must match the exact anatomy, proportions, silhouette, and surface textures defined in Image 1.

Maintain identical head shape, limb structure, tentacles, and scale patterns.

The scene should be photorealistic with dramatic ocean lighting and atmospheric mist.

Do not redesign the creature.
```

Result:
The model uses the sheet to **reconstruct the same monster**.

---

# 3. Step 3 — Combine Character + Environment References

If you also created an **environment sheet**, you can reference both.

Example:

```
Image 1: Creature identity sheet
Image 2: Ocean trench environment reference sheet

Use Image 1 as the canonical creature reference.
Use Image 2 as the canonical environment reference.

Generate a cinematic scene of the creature swimming through the deep ocean trench environment.

Maintain perfect consistency with both references.
```

Now both the **monster and environment stay consistent**.

---

# 4. Step 4 — Use the Same Reference for Video

For video models (like Seedance), the sheet helps stabilize the design.

Example:

```
Image 1: Creature identity sheet reference.

Use Image 1 as the fixed creature design reference.

Generate a cinematic underwater shot of the creature slowly swimming past the camera.

The creature must match the anatomy, silhouette, and surface texture defined in Image 1.

Do not alter the creature design during the shot.
```

---

# 5. Example Pipeline (Kraken Movie)

Example structure:

### Reference Creation

1. Kraken identity sheet
2. Submarine exterior environment sheet
3. Submarine interior environment sheet

---

### Scene Generation

Scene 1
Kraken far in ocean (use kraken sheet)

Scene 2
Submarine approaching trench (use submarine environment)

Scene 3
Kraken attacking submarine (use both references)

Scene 4
Crew reacting inside submarine (use interior sheet)

---

# 6. Important Rule

Always keep **one master reference sheet per character**.

Do not regenerate the sheet repeatedly.

Otherwise the character design will slowly drift.

---

# Simple Mental Model

Think of the identity sheet as:

**“The blueprint of the character.”**

Every scene simply says:

**“Build the creature according to this blueprint.”**

---

If you want, I can also show you a **very powerful trick used in cinematic AI pipelines**:

**The “Character Anchor Frame” method**, which can make monsters remain **almost perfectly consistent across long videos**.
