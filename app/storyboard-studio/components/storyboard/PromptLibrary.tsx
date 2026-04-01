"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Edit, Trash2, Copy, Star, Grid, List, X, Zap, Clock, Save, Eye, RotateCcw } from 'lucide-react';

interface Prompt {
  _id: string;
  name: string;
  type: 'character' | 'environment' | 'prop' | 'style' | 'custom';
  prompt: string;
  companyId: string;
  isPublic: boolean;
  usageCount: number;
}

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userCompanyId: string;
}

const DEFAULT_PROMPT_TEMPLATES = [
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
`,
  },
];

const PromptLibrary = ({ onSelectPrompt, isOpen, onClose, userCompanyId }: PromptLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('usage');
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

  const allTemplates = useMemo(() => {
    const mergedTemplates = [...(userTemplates || []), ...(publicTemplates || [])];
    return Array.from(new Map(mergedTemplates.map((template) => [template._id, template])).values());
  }, [publicTemplates, userTemplates]);

  // Filter and sort templates
  const filteredTemplates = allTemplates
    .filter(template => 
      template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.prompt.toLowerCase().includes(searchQuery.toLowerCase())
    )
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
        type: 'custom',
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
    prompt: template?.prompt || '',
    isPublic: template?.isPublic || false
  });

  useEffect(() => {
    if (!isOpen) return;
    setFormData({
      name: template?.name || '',
      prompt: template?.prompt || '',
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
