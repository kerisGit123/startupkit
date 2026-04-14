"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Edit, Trash2, Copy, Star, Grid, List, X, Zap, Clock, Save, Eye, RotateCcw } from 'lucide-react';

interface Prompt {
  _id: string;
  name: string;
  type: 'character' | 'environment' | 'prop' | 'style' | 'camera' | 'action' | 'other';
  prompt: string;
  notes?: string;
  companyId: string;
  isPublic: boolean;
  usageCount: number;
}

const PROMPT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'character', label: 'Character' },
  { key: 'environment', label: 'Environment' },
  { key: 'prop', label: 'Prop' },
  { key: 'style', label: 'Style' },
  { key: 'camera', label: 'Camera' },
  { key: 'action', label: 'Action' },
  { key: 'other', label: 'Other' },
] as const;

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userCompanyId: string;
}

const DEFAULT_PROMPT_TEMPLATES = [
  {
    name: 'UGC Character',
    type: 'character' as const,
    isPublic: false,
    notes: 'Character for UGC',
    prompt: `Create a professional character turnaround and reference sheet based on the reference image. Use the uploaded image as the primary visual reference for the character's identity, proportions, facial features, body shape, hairstyle, and overall design language, while translating it into a clean, neutral, reusable presentation board. The final image should be arranged like a polished concept art sheet on a pure white studio background. Show the same character in four full body views: front view, side profile, back view, and three quarter view. On the right side, include multiple clean detail panels with close ups of the eyes, upper face, lower face, lips, skin texture, hair detail, and one small clothing or material detail. Keep the styling neutral and generic so the sheet can be reused as a base template for future adaptations. Simplify anything overly specific, thematic, fantasy based, branded, culturally tied, or heavily ornamental from the source image into a more universal version while preserving the essence of the character. The outfit should become a clean neutral base outfit with minimal detailing, soft solid tones, and a refined silhouette. No excessive accessories, no dramatic headpieces, no strong lore specific elements, no heavy decoration unless they are essential to the base identity. The character should feel balanced, elegant, realistic, and adaptable. Expression should be calm and neutral. Makeup should be subtle and natural. Lighting should be soft, even, and studio clean. The layout should feel like a premium design presentation board used for model sheets, character development, or production reference. Preserve the core identity from @lmage1, but present it in a simplified, neutral, production ready format that can serve as a universal template for future redesigns.`,
  },
  {
    name: 'Ultra Realistic Photorealistic Character',
    type: 'character' as const,
    isPublic: false,
    notes: '@Image1 = Character reference, @Image2 = Style reference (optional realism tone), @Image3 = Environment (optional). Use @Image1 as the primary identity source. Apply ultra-realistic transformation while preserving identity. Use @Image2 for realism tone (lighting, color grading). Use @Image3 for environment grounding (optional). Strong Negative Prompt: Avoid cartoon style, anime style, CGI/3D render look, plastic skin, over-smooth textures, exaggerated proportions, fantasy stylization, painterly or illustration effects.',
    prompt: `Transform the provided character into an ultra-realistic, photorealistic version as if captured by a high-end cinema camera.

Maintain 100% identity consistency:
- facial structure
- proportions
- recognizable features
- expression and personality

Convert all stylized elements into real-world equivalents:
- realistic skin with pores, fine wrinkles, natural imperfections
- physically accurate hair strands with flyaways
- detailed eyes with reflections, moisture, and depth
- natural lighting interaction with skin and materials

Apply cinematic realism:
- shot on ARRI Alexa / RED camera look
- shallow depth of field
- realistic lens imperfections (bokeh, slight chromatic aberration)
- global illumination and soft shadows

Ensure material realism:
- cloth behaves like real fabric (cotton, leather, metal, etc.)
- physically accurate reflections and roughness
- no cartoon, no stylization, no CGI look

Style direction:
- hyper-detailed
- grounded in reality
- believable as a real human photographed in real life

Output must look like: a real photograph, not illustration, not 3D render, not concept art.`,
  },
  {
    name: 'Ultra Realistic Photorealistic Character 03',
    type: 'character' as const,
    isPublic: false,
    notes: 'Use @image1 as character reference. Compact: Single character only, no duplicates. All main views must be FULL BODY (head to toe, no cropping). Back view = same subject rotated 180°. 2/3 main views: front, back, left 90°, right 90°, 3/4 (all full body). 1/3 detail panels: eyes, face, skin, hair, tunic, clothing, object (horizontal if long). Ultra-realistic (pores, eyes, lips, hair strands, fabric, metal wear). Clean layout, real photography. No CGI, no cartoon.',
    prompt: `# Ultra-Realistic Character Identity Sheet v4.3 (Full-Body Enforced)

Create a photorealistic character identity sheet based strictly on the provided reference image. The result must look like a real professional studio identity sheet, with a clean, organized layout, ultra-realistic rendering, and clear separation between full-body views and detail panels.

CRITICAL RULE — SINGLE SUBJECT ONLY:
- The identity sheet must contain ONLY ONE character
- All views must represent the SAME individual
- No duplicated characters
- Back view = same subject rotated 180°, NOT a second person
- Must match body, clothing, hair, and proportions exactly

Page Layout (STRICT):

Section A — Main Views (2/3 area):
Display FULL-BODY views of the SAME character.

Full-Body Requirement (MANDATORY):
Each view must show the entire character from head to toe:
- head fully visible (no cropping)
- feet fully visible (no cropping)
- full silhouette clearly defined
- no zoomed-in, half-body, or portrait framing
The character must fit naturally within frame with proper margins, like a fashion or casting sheet.

Required Views:
1. Front View (full body, facing camera)
2. Left Profile (full body, 90° side view)
3. Right Profile (full body, 90° side view)
4. Back View (full body, 180° rear view)
5. 3/4 View (full body, ~45° angle)

Layout Rules: All views must be same scale, aligned and evenly spaced, consistently framed. Clean grid layout, no overlap, consistent lighting across all views.

Section B — Detail Panels (1/3 area):
Top Row (2 panels): Eyes detail, Face detail.
Middle Row: Skin texture, Hair texture, Tunic detail, Sash/clothing detail.
Bottom Row (Adaptive Object Panel): Wide horizontal panel, long objects (e.g. sword) must be horizontal and simplified.

Angle Accuracy Rules:
- Left/Right = true 90° profiles
- Back = full 180° rotation
- Front = direct
- 3/4 = ~45°

Identity Consistency:
- Same face, body, proportions
- Same outfit and materials
- Same hairstyle and structure

Expression Rules:
- Front view = primary expression
- Natural, alive (not blank)
- Eyes focused, lips natural

Ultra-Realistic Detail:
- skin pores, fine lines, imperfections
- realistic eyes (reflections, moisture)
- real hair strands
- fabric texture, stitching, folds
- realistic material behavior

Photography Style:
- studio lighting (soft key + rim light)
- natural shadows
- realistic exposure
- subtle depth of field
Must look like real photography.

Strict Negative Constraints — Do NOT produce:
- cropped body (must be full body)
- zoomed-in views in main section
- multiple characters
- incorrect back view
- cartoon / anime / CGI style
- smooth or plastic skin

Output: A single identity sheet image containing 2/3 area full-body multi-angle views, 1/3 area structured detail panels. All views must be complete, consistent, and ultra-realistic, like a professional casting sheet.`,
  },
  {
    name: 'Kling 3.0 Motion Character Prompt',
    type: 'other' as const,
    isPublic: false,
    notes: 'Default prompt for Kling 3.0 Motion',
    prompt: `No distortion, the character's movements are consistent with the video.`,
  },
  {
    name: 'Prompt Edit Image',
    type: 'other' as const,
    isPublic: false,
    notes: 'Simple edit prompt for modifying a character in an existing scene while preserving the background.',
    prompt: `character holding flower , need to preserve the surrounding . maintain the background, maintain exact proportions and height.`,
  },
  {
    name: 'General Character',
    type: 'character' as const,
    isPublic: false,
    notes: 'General-purpose character reference sheet. Works with any character style.',
    prompt: `Create a professional character reference sheet based strictly on the uploaded reference image. Use a clean, neutral plain background and present the sheet as a technical model turnaround while matching the exact visual style of the reference (same realism level, rendering approach, texture, color treatment, and overall aesthetic). Arrange the composition into two horizontal rows. Top row: four full-body standing views placed side-by-side in this order: front view, left profile view (facing left), right profile view (facing right), back view. Bottom row: three highly detailed close-up portraits aligned beneath the full-body row in this order: front portrait, left profile portrait (facing left), right profile portrait (facing right). Maintain perfect identity consistency across every panel. Keep the subject in a relaxed A-pose and with consistent scale and alignment between views, accurate anatomy, and clear silhouette; ensure even spacing and clean panel separation, with uniform framing and consistent head height across the full-body lineup and consistent facial scale across the portraits. Lighting should be consistent across all panels (same direction, intensity, and softness), with natural, controlled shadows that preserve detail without dramatic mood shifts. Output a crisp, print-ready reference sheet look, sharp details.`,
  },
  {
    name: 'Monster',
    type: 'character' as const,
    isPublic: false,
    notes: 'Creature/monster identity sheet for film or game design production.',
    prompt: `Create a **professional creature identity sheet** based strictly on the uploaded reference image.

Present the result as a **technical production reference sheet used in film or game design**, matching the exact visual style of the reference (same realism level, rendering style, texture quality, color treatment, and overall aesthetic).

Use a **clean neutral studio background** so the creature silhouette and anatomical details remain clearly visible.

---

## Sheet Layout

Arrange the sheet into **two horizontal rows**.

### Top Row — Anatomical Turnaround

Four full-body views placed side-by-side in this order:

1. **Front view**
2. **Left profile view (facing left)**
3. **Right profile view (facing right)**
4. **Back view**

The creature should stand in a **neutral anatomical pose (A-pose or relaxed stance)**.

All anatomical structures must remain fully visible, including:

* horns
* claws
* wings
* dorsal spines
* tentacles
* tail
* armor plates
* skeletal protrusions
* unique biological features

Maintain **perfect anatomical consistency across every view**.

---

### Bottom Row — Surface Detail and Facial Structure

Three detailed close-up portraits aligned beneath the full-body row:

1. **Front head portrait**
2. **Left profile head portrait**
3. **Right profile head portrait**

These close-ups must clearly display:

* eye structure
* teeth or mandibles
* facial anatomy
* skin texture or scales
* scars or unique markings
* biological surface details

---

# Silhouette Lock (Important)

The creature must maintain a **strong and identical silhouette across all views**.

The outer shape formed by:

* head
* limbs
* wings
* tail
* horns
* dorsal structures

must remain **structurally identical from every angle**.

Do not redesign or alter the creature's body structure.

---

# Texture Mapping Consistency

Surface patterns must remain consistent across all views, including:

* scale arrangement
* skin texture
* scars
* color distribution
* glowing elements
* biological markings

Patterns should **align naturally across the body**, as if mapped to a real three-dimensional creature.

Avoid random texture changes between views.

---

# Proportion Lock

Maintain strict proportional consistency:

* limb length
* head size relative to body
* torso thickness
* wing span
* tail length

All proportions must remain identical across every panel.

---

# Lighting

Use **neutral studio lighting** with consistent direction and intensity across all panels.

Lighting should reveal surface details without dramatic shadows or cinematic mood lighting.

---

# Alignment

Ensure professional presentation:

* consistent scale between full-body views
* identical head height across the turnaround lineup
* consistent portrait scale for close-ups
* evenly spaced panels
* clean separation between views

The result should resemble a **professional creature model sheet used in visual effects production**.

---

# Output

Produce a **high-resolution creature identity sheet** with crisp details suitable for design reference.`,
  },
  {
    name: 'General Environment',
    type: 'environment' as const,
    isPublic: false,
    notes: `Environment identity sheet with 4-panel 2x2 grid layout. Replace the environment description at the bottom. 
    ## Output Format

Produce **one high-resolution environment reference sheet** with a **2x2 grid layout**, showing the **four views of the same environment**.

---

## Example Environment Slot (replace when needed)

You can insert the environment description here:

Environment: futuristic alpine research habitat in a grassy valley,
with spherical concrete research domes, a winding stream,
rocky terrain, and towering jagged mountains in the background.`,
    prompt: `Use **Image 1 as the base reference environment**.

Generate a **photorealistic environment identity sheet** composed of **four panels arranged in a 2x2 grid**, showing the **same real-world location** from multiple viewpoints.

All panels must depict the **exact same environment from Image 1**, preserving:

* architectural structures
* terrain layout
* ground surfaces
* materials and textures
* lighting conditions
* spatial relationships between objects

No new elements may be introduced.

---

## Panel Layout

**Panel 1 (Top-Left) — Establishing Perspective**

A wide establishing view matching the **main front perspective** of the environment seen in Image 1.

Show the full spatial composition and surrounding landscape.

---

**Panel 2 (Top-Right) — Side Perspective**

A side-angle view of the **same location**, revealing the **depth, side structures, and surrounding terrain** while keeping the primary landmarks visible.

---

**Panel 3 (Bottom-Left) — Elevated / Aerial Perspective**

A slightly elevated **three-quarter aerial view** revealing the **overall layout of the environment**, including placement of structures, paths, terrain features, and spatial relationships.

---

**Panel 4 (Bottom-Right) — Environmental Detail Perspective**

A closer environmental view highlighting **architectural details, materials, textures, surfaces, and ground elements** from the same location.

---

## Consistency Rules

Maintain **strict environmental continuity across all panels**:

* identical architecture and structures
* identical terrain layout
* identical ground elements (rocks, paths, water, vegetation)
* identical scale and spatial positioning
* identical landmark placement

All perspectives must clearly represent **the same physical location**.

---

## Lighting & Atmosphere

Preserve the **exact lighting conditions and atmospheric qualities** from Image 1, including:

* time of day
* color temperature
* shadows
* haze, fog, or environmental atmosphere

---

## Style Requirements

The result must appear as **real photography of the same location captured from different camera positions**, not concept art or stylized illustration.

Maintain:

* photorealistic lighting
* natural materials and textures
* realistic scale and perspective

---

## Restrictions

Do **not** add:

* people
* vehicles
* animals
* logos
* text
* watermarks
* new buildings or objects

Only the environment from Image 1 should exist.

---


`,
  },
  {
    name: 'Photorealistic Character Identity Sheet',
    type: 'character' as const,
    isPublic: false,
    prompt: `1. Photorealistic character identity sheet (using a reference image )
Prompt
Create a photorealistic multi-angle photographic identify sheet
based strickly on the uploaded reference image.



• Match the exact real-world appearance of the person: facial structure, proportions, skin texture, age, asymmetry, and natural imperfections.
The result must look like real photography of a real human, not a digital character or 3D asset.
Use a simple, neutral background, similar to a studio or indoor wall.
The overall feeling should be documentary and natural, not stylized or cinematic.
Layout
• Two horizontal rows, presented as a clean photo contact sheet
• Top row: four full-body photographs of the same person:
1. Facing the camera
2. Left-facing profile
3. Right-facing profile
4. Facing away from the camera
• Bottom row: three close-up photographic portraits:
1. Facing the camera
2. Left-facing profile
3. Right-facing profile
Pose & Body Language
• The subject stands naturally and casually, as a real person would when asked to stand still.
• No exaggerated stance, no rigid pose, no symmetry.
• Subtle, natural weight distribution and relaxed posture.
• Shoulders relaxed, arms resting naturally at the sides.
Consistency & Accuracy
• Maintain strong identity consistency across all images.
• Preserve natural human asymmetry.
• Proportions must remain realistic and consistent without looking mechanically aligned.
• The subject should feel like the same person photographed multiple times, not a replicated model.


Lighting & Camera
• Soft, neutral, real-world lighting (similar to window light or soft studio light).
⚫ No dramatic, cinematic, or stylized lighting.
• Natural shadows with gentle falloff.
Realistic camera perspective and lens behavior.
Critical constraints
• Not a 3D render
• Not CGI
• Not a game character
• Not stylized
Not a model turnaround`,
  },
  {
    name: 'Photorealistic Environment Identity Sheet',
    type: 'environment' as const,
    isPublic: false,
    prompt: `# Photorealistic Environment Identity Sheet

### Prompt

Create a **photorealistic environment identity sheet** representing the same real-world location photographed from multiple angles.

The result must look like **real location photography captured during a single scouting session**, not a CGI environment, concept art, or game map.

The environment must maintain consistent:

* spatial layout
* architectural structures
* terrain and ground surfaces
* materials and textures
* scale and distance relationships
* lighting direction and shadow behavior

The images should resemble **documentary-style location reference photography used in film production**.

Use natural lighting and realistic camera behavior.

---

# Layout

Two horizontal rows presented as a **clean location reference contact sheet**.

All images must depict **the same location at the same time of day with consistent lighting**.

---

# Top Row — Spatial Orientation (4 images)

1. **Primary establishing view**
   Wide-angle view showing the main structure or area.

2. **Left perspective view**
   Camera moved slightly left to reveal spatial depth and surrounding structures.

3. **Right perspective view**
   Camera moved slightly right to show additional environmental context.

4. **Reverse view**
   Looking back toward the original direction to reveal what exists behind the main viewpoint.

Purpose:
These views establish **environment geometry and layout consistency**.

---

# Bottom Row — Detail & Material References (3 images)

1. **Key focal area**
   A closer view of the most recognizable part of the environment
   (e.g., building entrance, central landmark, important area).

2. **Material and surface detail**
   Close-up view of ground texture, wall material, vegetation, or structural surface.

3. **Lighting interaction view**
   A shot emphasizing natural light interaction with the environment
   (shadows, reflections, light falloff).

Purpose:
These images help models learn **material realism and lighting behavior**.

---

# Environment Composition Rules

Preserve the **true spatial structure of the location**.

Maintain consistent:

* building positions
* object placement
* terrain shape
* scale relationships

Avoid introducing new structures or moving objects between frames.

The images must feel like **multiple photographs of the same place taken from different positions**.

---

# Lighting & Camera

Use realistic photographic conditions:

* natural daylight or natural indoor lighting
* soft shadows with gentle falloff
* realistic camera perspective
* natural depth of field

Avoid:

* cinematic lighting
* stylized color grading
* fantasy lighting effects

---

# Consistency Constraints

The environment must remain identical across all images.

Maintain consistency in:

* architecture
* materials
* environmental objects
* lighting direction
* atmosphere

The location should appear like **a real place photographed from several camera positions during one moment in time**.

---

# Critical Restrictions

The output must **not resemble**:

* a 3D render
* CGI environment
* video game level
* stylized concept art
* architectural blueprint

The final result should look like **real photographic documentation of a real environment**.
.`,
  },
  {
    name: 'Photorealistic Prop / Object Identity Sheet',
    type: 'prop' as const,
    isPublic: false,
    notes:`
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

This structure significantly reduces **visual drift in long image → video sequences**.`,
    prompt: `# Photorealistic Prop / Object Identity Sheet

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

`,
  },
];

const PromptLibrary = ({ onSelectPrompt, isOpen, onClose, userCompanyId }: PromptLibraryProps) => {
  // Show the current companyId for debugging
  console.log('🏢 PromptLibrary - Current companyId:', userCompanyId);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('usage');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isResettingDefaults, setIsResettingDefaults] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Prompt | null>(null);
  // Fetch templates from Convex
  const userTemplates = useQuery(api.promptTemplates.getByCompany, { 
    companyId: userCompanyId 
  });
  const publicTemplates = useQuery(api.promptTemplates.getPublicTemplates, {});

  // Mutations
  const createTemplate = useMutation(api.promptTemplates.create);
  const updateTemplate = useMutation(api.promptTemplates.update);
  const deleteTemplate = useMutation(api.promptTemplates.remove);
  const incrementUsage = useMutation(api.promptTemplates.incrementUsage);
  const resetDefaultTemplates = useMutation(api.promptTemplates.resetDefaults);

  // Auto-create default prompts if none exist for this company
  useEffect(() => {
    if (userCompanyId && userTemplates && userTemplates.length === 0 && publicTemplates && publicTemplates.length === 0) {
      console.log('No prompts found for company, creating default prompts...');
      resetDefaultTemplates({
        companyId: userCompanyId,
        prompts: DEFAULT_PROMPT_TEMPLATES,
      }).catch(error => {
        console.error('Failed to create default prompts:', error);
      });
    }
  }, [userCompanyId, userTemplates, publicTemplates, resetDefaultTemplates]);

  const allTemplates = useMemo(() => {
    const mergedTemplates = [...(userTemplates || []), ...(publicTemplates || [])];
    return Array.from(new Map(mergedTemplates.map((template) => [template._id, template])).values());
  }, [publicTemplates, userTemplates]);

  // Filter and sort templates
  const filteredTemplates = allTemplates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.prompt.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'usage': return b.usageCount - a.usageCount;
        default: return 0;
      }
    });

  const handleSelectPrompt = async (prompt: string, templateId: string) => {
    await incrementUsage({ id: templateId as any });
    onSelectPrompt(prompt);
    onClose();
  };

  const handleCreateTemplate = async (templateData: any) => {
    try {
      await createTemplate({
        ...templateData,
        type: templateData.type || 'other',
        companyId: userCompanyId
      });
      setIsCreateModalOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to create template:', error);
    }
  };

  const handleDuplicateTemplate = async (template: Prompt) => {
    try {
      await createTemplate({
        name: `${template.name} Copy`,
        prompt: template.prompt,
        type: template.type,
        notes: template.notes,
        companyId: userCompanyId,
        isPublic: false,
      });
    } catch (error) {
      console.error('Failed to duplicate template:', error);
    }
  };

  const handleUpdateTemplate = async (templateData: any) => {
    try {
      await updateTemplate({
        id: editingTemplate!._id as any,
        ...templateData
      });
      setIsCreateModalOpen(false);
      setEditingTemplate(null);
    } catch (error) {
      console.error('Failed to update template:', error);
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (confirm('Are you sure you want to delete this template?')) {
      try {
        await deleteTemplate({ id: templateId as any });
      } catch (error) {
        console.error('Failed to delete template:', error);
      }
    }
  };

  const handleResetDefaultPrompts = async () => {
    if (!userCompanyId) return;
    if (!confirm('Reset the default prompts? Existing prompts with the same default names will be replaced.')) {
      return;
    }

    setIsResettingDefaults(true);
    try {
      await resetDefaultTemplates({
        companyId: userCompanyId,
        prompts: DEFAULT_PROMPT_TEMPLATES,
      });
    } catch (error) {
      console.error('Failed to reset default prompts:', error);
    } finally {
      setIsResettingDefaults(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
        
        <div className="fixed right-0 top-0 h-full w-full max-w-4xl overflow-hidden border-l border-white/10 bg-[#141414] shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 p-6">
            <h2 className="text-2xl font-semibold text-white">Prompt Library</h2>
            <button
              onClick={onClose}
              className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="border-b border-white/10 p-6">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 transform text-gray-500" />
                <input
                  type="text"
                  placeholder="Search prompts..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] py-2 pl-10 pr-4 text-sm text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
                />
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="rounded-lg border border-white/10 bg-[#1A1A1A] px-4 py-2 text-sm text-gray-200 focus:border-emerald-500/40 focus:outline-none"
              >
                <option value="name">Name (A-Z)</option>
                <option value="usage">Most Used</option>
              </select>
            </div>

            {/* Category filter tabs */}
            <div className="flex gap-1 flex-wrap mb-4">
              {PROMPT_CATEGORIES.map((cat) => {
                const count = cat.key === 'all'
                  ? allTemplates.length
                  : allTemplates.filter(t => t.type === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(cat.key)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      selectedCategory === cat.key
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-300'
                    }`}
                  >
                    {cat.label} ({count})
                  </button>
                );
              })}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {filteredTemplates.length} prompts found
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg bg-white/5 p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`rounded p-2 transition-colors ${viewMode === 'grid' ? 'bg-[#1A1A1A] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`rounded p-2 transition-colors ${viewMode === 'list' ? 'bg-[#1A1A1A] text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
                <button 
                  onClick={handleResetDefaultPrompts}
                  disabled={isResettingDefaults}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-gray-200 transition-colors hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <RotateCcw className={`w-4 h-4 ${isResettingDefaults ? 'animate-spin' : ''}`} />
                  {isResettingDefaults ? 'Resetting...' : 'Reset Prompt'}
                </button>
                
                <button 
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Prompt
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredTemplates.map(template => (
                  <PromptCard
                    key={template._id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={() => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {filteredTemplates.map(template => (
                  <PromptListItem
                    key={template._id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={() => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={() => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                  />
                ))}
              </div>
            )}
            
            {filteredTemplates.length === 0 && (
              <div className="text-center py-12">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white/5">
                  <Search className="h-8 w-8 text-gray-500" />
                </div>
                <h3 className="mb-2 text-lg font-medium text-white">No prompts found</h3>
                <p className="text-gray-400">Try adjusting your search</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create/Edit Modal */}
      <PromptEditorModal
        template={editingTemplate}
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTemplate(null);
        }}
        onSave={editingTemplate ? handleUpdateTemplate : handleCreateTemplate}
      />
    </>
  );
};

// Prompt Card Component
const PromptCard = ({ template, onSelect, onEdit, onDelete, onDuplicate }: any) => {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 transition-colors hover:border-white/20 hover:bg-[#202020]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-white">{template.name}</h3>
          <div className="flex items-center gap-2">
            {template.isPublic && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                Public
              </span>
            )}
          </div>
        </div>
        <button aria-label="Favorite prompt" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white">
          <Star className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="line-clamp-3 text-sm text-gray-300">{template.prompt}</p>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {template.usageCount} uses
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm text-white transition-colors hover:bg-emerald-600"
        >
          Use Prompt
        </button>
        <button
          onClick={onDuplicate}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Duplicate prompt"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Edit prompt"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/10"
          title="Delete prompt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Prompt List Item Component
const PromptListItem = ({ template, onSelect, onEdit, onDelete, onDuplicate }: any) => {
  return (
    <div className="rounded-xl border border-white/10 bg-[#1A1A1A] p-4 transition-colors hover:border-white/20 hover:bg-[#202020]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <h3 className="mb-1 font-semibold text-white">{template.name}</h3>
          <div className="flex items-center gap-2">
            {template.isPublic && (
              <span className="rounded-full bg-emerald-500/15 px-2 py-1 text-xs font-medium text-emerald-300">
                Public
              </span>
            )}
          </div>
        </div>
        <button aria-label="Favorite prompt" className="rounded p-1 text-gray-500 hover:bg-white/5 hover:text-white">
          <Star className="w-4 h-4" />
        </button>
      </div>

      <div className="mb-3">
        <p className="line-clamp-3 text-sm text-gray-300">{template.prompt}</p>
      </div>

      <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1">
            <Zap className="w-3 h-3" />
            {template.usageCount} uses
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(template.createdAt).toLocaleDateString()}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onSelect}
          className="flex-1 rounded-lg bg-emerald-500 px-3 py-2 text-sm text-white transition-colors hover:bg-emerald-600"
        >
          Use Prompt
        </button>
        <button
          onClick={onDuplicate}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Duplicate prompt"
        >
          <Copy className="w-4 h-4" />
        </button>
        <button
          onClick={onEdit}
          className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
          title="Edit prompt"
        >
          <Edit className="w-4 h-4" />
        </button>
        <button
          onClick={onDelete}
          className="rounded-lg border border-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/10"
          title="Delete prompt"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

// Prompt Editor Modal Component
const PromptEditorModal = ({ template, isOpen, onClose, onSave }: any) => {
  const [formData, setFormData] = useState({
    name: template?.name || '',
    type: template?.type || 'other',
    prompt: template?.prompt || '',
    notes: template?.notes || '',
    isPublic: template?.isPublic || false
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: template?.name || '',
      type: template?.type || 'other',
      prompt: template?.prompt || '',
      notes: template?.notes || '',
      isPublic: template?.isPublic || false,
    });
  }, [isOpen, template]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...formData,
      id: template?._id
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-[#141414] shadow-2xl">
        <div className="flex items-center justify-between border-b border-white/10 p-6">
          <h2 className="text-xl font-semibold text-white">
            {template ? 'Edit Prompt' : 'Create New Prompt'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-white/5 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Prompt Name
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
              placeholder="Enter a descriptive name..."
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Category
            </label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white focus:border-emerald-500/40 focus:outline-none"
            >
              <option value="character">Character</option>
              <option value="environment">Environment</option>
              <option value="prop">Prop</option>
              <option value="style">Style</option>
              <option value="camera">Camera</option>
              <option value="action">Action</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Prompt Text
            </label>
            <textarea
              value={formData.prompt}
              onChange={(e) => setFormData({ ...formData, prompt: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
              rows={6}
              placeholder="Enter your prompt text..."
              required
            />
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                {formData.prompt.length} characters
              </span>
              <button
                type="button"
                className="flex items-center gap-1 text-xs text-emerald-400 hover:text-emerald-300"
              >
                <Eye className="w-3 h-3" />
                Preview
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-300">
              Notes <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full rounded-lg border border-white/10 bg-[#1A1A1A] px-3 py-2 text-white placeholder:text-gray-500 focus:border-emerald-500/40 focus:outline-none"
              rows={2}
              placeholder="Internal notes about when/how to use this prompt..."
            />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-300">
                Make Public
              </label>
              <p className="text-xs text-gray-500">
                Other users can see and use this prompt
              </p>
            </div>
            <button
              type="button"
              aria-label="Toggle public prompt visibility"
              onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                formData.isPublic ? 'bg-emerald-500' : 'bg-gray-200'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  formData.isPublic ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-white/5 px-4 py-2 text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-white transition-colors hover:bg-emerald-600"
            >
              <Save className="w-4 h-4" />
              {template ? 'Update' : 'Create'} Prompt
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PromptLibrary;
