
# Image Maker Prompt Structure

## Goal

Use `Image Maker` to create **consistent reusable visual assets** before generating final storyboard scenes.

The main reusable asset types are:

- **Character**
- **Prop / Object**
- **Location / Environment**
- **Scene composition reference**

`Prop` can include objects.

Recommended meaning:

- **Character** = person, creature, mascot, hero, side character
- **Prop / Object** = handheld item, furniture, vehicle, device, weapon, accessory, product, tool
- **Location** = room, house, shop, street, forest, office, school, world area
- **Scene composition** = how characters + props + location are arranged in a shot

The best workflow is:

1. Generate **reference sheets first**
2. Lock consistency for each reusable asset
3. Use those locked assets in later scene prompts

---

## Analysis of Current n8n Prompt

Your current prompt is strong because it already does these things well:

- **Defines one exact character identity**
- **Requests multiple body angles**
- **Requests multiple facial expressions**
- **Repeats consistency constraints clearly**
- **Uses white background and clean layout**
- **Frames the result as a professional reference sheet**

This is good for **character identity locking**.

What it does **not** fully cover yet:

- **Outfit consistency details**
- **Signature accessories**
- **Color palette locking**
- **Prop consistency sheets**
- **Location consistency sheets**
- **Rules for using these references later in final storyboard prompts**

So the next step is to expand the same system beyond characters.

---

## Recommended Asset System for Image Maker

### 1. Character Sheet

Use this to lock:

- face shape
- hairstyle
- hair color
- eye shape and eye color
- skin tone
- body proportions
- clothing silhouette
- signature accessories
- shoes
- art style

This should be your **primary consistency asset**.

### 2. Prop / Object Sheet

Use this for any reusable item that appears repeatedly.

Examples:

- sword
- phone
- laptop
- bag
- chair
- gun
- magic staff
- car
- helmet
- coffee cup

Lock these details:

- shape
- material
- color palette
- wear and tear
- scale
- front / side / 3/4 / back views if needed

### 3. Location Sheet

Use this for recurring environments.

Examples:

- bedroom
- classroom
- cafe
- spaceship bridge
- office
- alley
- temple
- village square

Lock these details:

- architecture style
- key landmarks
- color mood
- lighting mood
- time of day version
- weather version if needed
- camera-friendly layout zones

### 4. Scene Structure Guide

After character / prop / location references are created, use them to build actual storyboard images.

A final scene prompt should combine:

- **who** is in the shot
- **what** they are doing
- **which prop/object** is present
- **which location** is used
- **camera framing**
- **emotion / acting**
- **lighting / mood**
- **continuity rules**

---

## Improved Character Reference Prompt

This is a cleaned-up version of your current n8n prompt:

```text
Create a professional character reference sheet based strictly on the uploaded reference image. Use a clean, neutral plain background and present the sheet as a technical model turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic). 

Arrange the composition into two horizontal rows. 

Top row: four full-body standing views placed side-by-side in this order: front view, left profile view (facing left), right profile view (facing right), back view. 

Bottom row: three highly detailed close-up portraits aligned beneath the full-body row in this order: front portrait, left profile portrait (facing left), right profile portrait (facing right). 

Maintain perfect identity consistency across every panel. Keep the subject in a relaxed A-pose and with consistent scale and alignment between views, accurate anatomy, and clear silhouette; ensure even spacing and clean panel separation, with uniform framing and consistent head height across the full-body lineup and consistent facial scale across the portraits. Lighting should be consistent across all panels (same direction, intensity, and softness), with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details.

Character: {{ $json.characterName }}
Style: {{ $json.style }}
Description: {{ $json.characterDescription }}
```

---

## Prop / Object Reference Prompt

Use this when you want a recurring object to stay consistent.

```text
Create a professional prop reference sheet based strictly on the uploaded reference image. Use a clean, neutral plain background and present the sheet as a technical model turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic).

Arrange the composition into two horizontal rows.

Top row: four orthographic views placed side-by-side in this order: front view, left profile view (facing left), right profile view (facing right), back view.

Bottom row: two detailed close-up views aligned beneath: top-down view and important feature detail view.

Maintain perfect identity consistency across every panel. Keep consistent scale and alignment between views, accurate proportions, and clear silhouette; ensure even spacing and clean panel separation, with uniform framing and consistent object scale across the lineup. Lighting should be consistent across all panels (same direction, intensity, and softness), with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details.

Prop: {{ $json.propName }}
Style: {{ $json.style }}
Description: {{ $json.propDescription }}
```

---

## Environment Reference Prompt

Use this for recurring places.

```text
Create a professional environment reference sheet based strictly on the uploaded reference image. Use a clean, neutral plain background and present the sheet as a technical architectural turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic).

Arrange the composition into two horizontal rows.

Top row: four establishing views placed side-by-side in this order: wide establishing view, 3/4 cinematic view, reverse angle view, aerial/top-down view.

Bottom row: two detailed views aligned beneath: key feature close-up and empty clean version for staging characters.

Maintain perfect identity consistency across every panel. Keep consistent scale and alignment between views, accurate architecture and proportions, and clear spatial relationships; ensure even spacing and clean panel separation, with uniform framing and consistent environmental scale across the lineup. Lighting should be consistent across all panels (same direction, intensity, and softness), with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details.

Environment: {{ $json.locationName }}
Style: {{ $json.style }}
Description: {{ $json.locationDescription }}
```

---

## Final Storyboard Scene Prompt Structure

Once references are ready, final image prompts should not re-invent the design.

They should **reuse locked assets**.

Recommended structure:

```text
Storyboard shot of {{ characterName }} in {{ locationName }} with {{ propName }}, in {{ style }} style.

Character continuity:
- use the exact same character design from the approved character reference sheet
- same face, hair, costume, proportions, and accessories

Prop continuity:
- use the exact same design from the approved prop/object reference sheet

Location continuity:
- use the exact same environment design from the approved location reference sheet

Shot description:
{{ actionDescription }}

Camera:
{{ cameraFraming }}

Emotion and acting:
{{ expressionAndBodyLanguage }}

Lighting and mood:
{{ lightingMood }}

Composition rules:
- cinematic storyboard composition
- readable silhouette
- clean focal point
- no random redesign of character, prop, or location
```

---

## Suggested n8n Variable Groups

For cleaner workflow prompts, split your variables by asset type.

### Character

- `characterName`
- `characterDescription`
- `style`
- `characterOutfit`
- `characterAccessories`

### Prop / Object

- `propName`
- `propDescription`
- `propMaterial`
- `propColorPalette`

### Location

- `locationName`
- `locationDescription`
- `locationMood`
- `timeOfDay`

### Scene

- `actionDescription`
- `cameraFraming`
- `expressionAndBodyLanguage`
- `lightingMood`

---

## Practical Structure for Image Maker

Inside `Image Maker`, it would be useful to separate creation into tabs or modes:

- **Character**
- **Prop / Object**
- **Environment**
- **Scene**

That structure is cleaner than treating everything as only “character generation”.

Recommended naming:

- **Reference Maker** for consistent people/creatures, objects, and environments
- **Prop Maker** or **Object Maker** for reusable items
- **Environment Maker** for recurring places
- **Scene Maker** for final composed images

If you want one umbrella term, use:

- **Image Maker**

Then inside it, use these asset types:

- `character`
- `prop`
- `environment`
- `scene`

If you want simpler taxonomy, you can merge `prop` and `object` into one group:

- `character`
- `prop`
- `environment`
- `scene`

That is probably the most practical option.

---

## Recommendation

For your workflow, I recommend this structure:

1. **Character sheet** for consistency
2. **Prop sheet** for recurring items
3. **Environment sheet** for recurring environments
4. **Scene prompt** that references all approved sheets

So yes:

- **Prop can include object**
- **Environment should be added as its own library/reference type**
- **Scene/property structure should come after asset locking**
- **Reference Maker** is the strongest long-term name for the page

This gives you a more scalable system for storyboard production, especially when using n8n for reusable generation workflows.

---

## Recommended Page Name

`Image Maker` is understandable, but it is still a bit generic.

This page is not mainly for random image generation.

It is for creating **consistent reusable reference sheets** that later feed the Element Library and storyboard scenes.

So I recommend these naming options:

### Best option

- **Reference Maker**

Why this is the best fit:

- it matches the real purpose of the page
- it covers character, prop, and environment creation
- it implies consistency and reusable reference design
- it avoids sounding like a generic image generator

### Good alternatives

- **Element Maker**
- **Reference Studio**
- **Asset Maker**

### Final naming choice

Use:

- **Reference Maker** as the page name

Then inside the page, use these modes:

- `character`
- `prop`
- `environment`
- `scene`

If you want to keep the current naming for now, a safe transition is:

- keep nav label as **Image Maker** temporarily
- use **Reference Maker** as the internal page heading / concept
- rename the nav later after the workflow is stable

---

## Should Environment Be Added To The Element Library

Right now your Element Library has:

- Characters
- Props
- Logos
- Fonts
- Styles
- Other

You currently do **not** have a dedicated environment category.

### Recommendation

- **Yes, add Environment**

Reason:

- recurring environments are reusable assets, just like characters and props
- environments need consistency across many storyboard shots
- without an Environment category, location references will become mixed into `Other`, which makes the system messy later

### Best taxonomy for the library

Recommended library categories:

- **Characters**
- **Props**
- **Environments**
- **Logos**
- **Fonts**
- **Styles**
- **Other**

### Should you add it now or leave it alone

My recommendation:

- **Add the Environment category in the UI now**
- it is okay if it starts empty

That is better than waiting, because:

- it sets the correct product structure early
- it helps users understand that environments are first-class reusable elements
- it avoids later migration confusion when environment references start being created

If you want to keep the UI lighter for the first version, a fallback option is:

- keep `Other` for now
- but define `environment` in the data model already

Still, the better product decision is:

- **show Environment in the library UI**

---

## Should Fonts, Styles, And Logos Be Merged

My recommendation:

- **Do not merge Fonts into Styles**
- **Do not merge Logos into Styles**
- **Keep Fonts, Styles, and Logos as separate categories**

### Why they should stay separate

They are different kinds of reusable assets:

- **Fonts** = typography choices
- **Styles** = visual language, look, rendering treatment, art direction
- **Logos** = brand marks or graphic identity assets

If you merge them all into `Styles`, the library becomes harder to scan and harder to filter.

For example:

- a user looking for a font should not need to search inside style presets
- a logo is not the same kind of reusable asset as an art style
- styles affect generation behavior, while logos and fonts are more specific design assets

### Best taxonomy recommendation

Use these top-level categories:

- **Characters**
- **Props**
- **Environments**
- **Logos**
- **Fonts**
- **Styles**
- **Other**

### If you want a simpler future grouping

If the library grows later, you can conceptually group them like this in the data model or filters:

- **Reference Elements**
  - Characters
  - Props
  - Environments
- **Design Assets**
  - Logos
  - Fonts
  - Styles

But in the visible library tabs, it is still better to keep them separate.

---

## Recommended Product Structure

### Page purpose

The page should be positioned as:

- a place to create **reference sheets for reusable elements**
- not just a freeform image generator

### Relationship to Element Library

The flow should be:

1. Create a reference sheet in **Reference Maker**
2. Approve the result
3. Save it into the **Element Library**
4. Reuse it in storyboard scenes

### Core reference types

- **Character**
- **Prop**
- **Environment**
- **Scene**

### Notes

- `Prop` can include object
- `Environment` is better wording than `Location` for the library tab
- `Scene` should usually not be saved as a reusable element in the same way as characters and props, but it can exist as a prompt mode inside the maker

---

## Recommended UI Structure

If the page becomes `Reference Maker`, the UI can be structured like this:

### Top level modes

- **Character**
- **Prop**
- **Environment**
- **Scene**

### Shared form areas

- **Name**
- **Description**
- **Style**
- **Consistency rules**
- **Sheet layout type**
- **Prompt preview**
- **Generate button**
- **Save to Element Library**

### Mode-specific fields

#### Character fields

- character name
- character description
- outfit
- accessories
- turnaround + expression layout

#### Prop fields

- prop name
- prop description
- material
- color palette
- angle views

#### Environment fields

- environment name
- environment description
- architecture / world style
- lighting mood
- time of day
- key landmarks

#### Scene fields

- character reference
- prop reference
- environment reference
- action
- camera framing
- mood / lighting

---

## Implementation Steps

Implementation should be **UI first**, then workflow, then persistence, then generation refinement.

### Phase 1 - UI first

Build the UI before connecting real generation.

Tasks:

1. Create the page shell for the new maker page
2. Decide final page title
3. Add mode tabs:
   - Character
   - Prop
   - Environment
   - Scene
4. Add a shared form layout
5. Add mode-specific input sections
6. Add prompt preview panel
7. Add empty state / loading / generated result placeholders
8. Add `Save to Library` button in the UI, even if disabled initially

Goal of Phase 1:

- validate information architecture and user flow before backend work

### Phase 2 - Element Library structure

After the maker UI exists:

1. Add **Environment** tab to Element Library
2. Define element types in the data model:
   - character
   - prop
   - environment
   - logo
   - font
   - style
   - other
3. Ensure the library card design works for environment thumbnails
4. Add filtering by element type

Goal of Phase 2:

- make the library ready to receive generated references

### Phase 3 - Prompt system

Then connect prompt generation logic:

1. Build prompt templates for Character, Prop, Environment, and Scene
2. Convert UI inputs into structured prompt variables
3. Show generated prompt preview before submission
4. Support editing the prompt before generate

Goal of Phase 3:

- make prompt creation reliable and inspectable

### Phase 4 - n8n integration

Then connect the page to your n8n workflow.

Tasks:

1. map UI fields to n8n variables
2. submit prompts to the consistent-character / reference workflow
3. return generated images to the page
4. support retry / regenerate

Goal of Phase 4:

- enable real generation while preserving the designed UI flow

### Phase 5 - Save and reuse

Once generation is working:

1. save approved result into Element Library
2. store metadata
3. attach type tags
4. allow selecting saved references in storyboard workflows

Goal of Phase 5:

- connect reference creation to the wider storyboard system

### Phase 6 - Continuity improvements

Finally, improve consistency quality:

1. add versioning for reference sheets
2. allow replacing / updating an existing element
3. add approval status
4. support multiple variations under one element
5. support linking scene prompts to saved character / prop / environment references

---
