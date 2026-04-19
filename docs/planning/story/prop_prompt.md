# Photorealistic Prop / Object Identity Sheet

### Prompt

Create a **photorealistic prop identity sheet** representing the same real-world object photographed from multiple angles.

The result must look like **real product-style photography captured during a single reference session**, not a CGI model, 3D render, or stylized illustration.

The object must maintain consistent:

* shape and proportions
* materials and surface textures
* color and finish
* scale and thickness
* wear, scratches, and natural imperfections

The images should resemble **real photographic documentation of a physical object used as a film prop reference**.

Use neutral lighting and realistic camera behavior.

---

# Layout

Two horizontal rows presented as a **clean prop reference contact sheet**.

All images must depict **the exact same object photographed under identical lighting conditions**.

---

# Top Row — Structural Orientation (4 images)

1. **Front view**
   The object facing directly toward the camera.

2. **Left perspective view**
   Slightly angled to reveal depth and side structure.

3. **Right perspective view**
   Opposite angle showing the other side.

4. **Rear view**
   Back side of the object.

Purpose:
These views establish **overall geometry, structure, and silhouette**.

---

# Bottom Row — Detail & Material References (3 images)

1. **Top or functional view**
   The most important functional or recognizable surface of the object.

2. **Material / texture close-up**
   A close-up showing surface material, texture, or wear.

3. **Lighting interaction view**
   A view showing how light interacts with the object’s material
   (reflections, matte surfaces, gloss, metal shine, etc.).

Purpose:
These images help models understand **material realism and small details**.

---

# Object Composition Rules

Preserve the **true structure and proportions** of the object.

Maintain consistency in:

* shape and geometry
* material appearance
* surface imperfections
* object scale

Avoid altering or redesigning the object between images.

The images must feel like **multiple photographs of the same physical object placed on a table and photographed from different angles**.

---

# Background

Use a **simple neutral background** similar to product photography:

* neutral studio backdrop
* simple tabletop surface
* minimal visual distractions

The background should not dominate the image.

---

# Lighting & Camera

Use realistic photography conditions:

* soft neutral studio lighting
* gentle shadows
* natural reflections
* realistic camera perspective

Avoid:

* dramatic cinematic lighting
* stylized lighting effects
* exaggerated reflections

---

# Consistency Constraints

The object must remain identical across all images.

Maintain consistent:

* size
* shape
* materials
* color tone
* surface wear

All photographs should appear as if they were taken **during the same photography session of the same physical object**.

---

# Critical Restrictions

The output must **not resemble**:

* a 3D render
* CGI model
* game asset
* stylized illustration
* concept art

The result must resemble **real photographic documentation of a physical object**.

---

# How This Fits Your Full Pipeline

Your generation pipeline becomes very stable when you anchor **three identity layers**.

**1. Character Identity Sheet**
Defines people.

**2. Environment Identity Sheet**
Defines locations.

**3. Prop / Object Identity Sheet**
Defines objects that appear repeatedly.

Scene generation then references these anchors.

Example scene prompt:

Character: little boy Jerry
Environment: Paris street café environment sheet
Prop: small red backpack prop identity sheet
Action: Jerry walking along the street holding the backpack

This structure significantly reduces **visual drift in long image → video sequences**.
