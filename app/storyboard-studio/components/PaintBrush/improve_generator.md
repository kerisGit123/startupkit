
## Element Generator Alignment

The current `Element Generator` is fundamentally a **picture generation tool** for reusable storyboard elements. Because of that, the wording in this screen should match the `Element Library` terminology exactly.

### Rename `Asset Type` to `Element Type`

The label `Asset Type` should be renamed to `Element Type` everywhere inside the generator UI.

This includes:

- generator section title
- filter/type selector label
- button text if it mentions asset
- helper copy
- empty states
- internal product documentation

### Why `Element Type` is the correct term

The generated output is not just a generic asset.
It is meant to become a reusable **element** inside storyboard workflows.

Examples:

- character element
- object / prop element
- logo element
- font element
- style element
- other element

So the generator should speak the same language as the library.

## Relationship Between Element Generator and Element Library

The `Element Generator` and `Element Library` should be treated as two parts of the same system.

### Element Generator

Purpose:

- generate picture variations for a reusable element
- define the element type before generation
- optionally use reference images
- create visual outputs that can later be saved as reusable elements

This means the generator is the **creation flow**.

### Element Library

Purpose:

- store reusable generated or uploaded elements
- organize them by element type
- browse, filter, and reuse them in frames
- act as the main repository of project elements

This means the library is the **saved collection**.

## Matching Rules Between Generator and Library

The generator should match the library in these areas.

### 1. Shared terminology

Use the same naming in both places:

- `Element Type`
- `Character`
- `Object` or `Prop`
- `Logo`
- `Font`
- `Style`
- `Other`

Avoid mixing:

- `asset`
- `asset type`
- `universe manager`
- `manage element` as a separate top-level concept

### 2. Shared type system

If the generator allows users to create:

- characters
- props
- logos
- fonts
- styles
- others

then the library should expose the same categories for filtering and storage.

The type chosen during generation should map directly to the type stored in the library.

### 3. Shared workflow

Recommended flow:

1. User chooses `Element Type` in the generator.
2. User writes prompt / description.
3. User optionally uploads reference images.
4. Generator produces picture variations.
5. User saves one variation as an element.
6. Saved result appears in `Element Library` under the matching type.

This makes the library the destination of generator output.

## Product Structure Recommendation

Use this structure consistently:

### Element Library

Main feature name.

Contains:

- saved elements
- uploaded elements
- generated elements
- reusable project references

### Element Generator

A creation tool inside the element system.

Used to:

- generate new element pictures
- create variations
- save a result into the library

## UI Copy Recommendation

### Replace

- `Asset Type` → `Element Type`
- `Generate Prop Variations` → `Generate Element Variations`

If needed, the button can be even more specific based on selected type:

- `Generate Character Variations`
- `Generate Prop Variations`
- `Generate Logo Variations`

But the controlling field should still be called `Element Type`.

## Final Direction

The correct concept is:

- `Element Generator` creates element images
- `Element Library` stores and manages saved elements

So the generator should not use `asset` language anymore.
It should fully align with the `Element Library` model.

## Summary

Rename `Asset Type` to `Element Type` in the generator.
Treat the generator as the element creation flow and the library as the reusable saved collection.
Anything generated and saved should become an item in the `Element Library` using the same type system.
