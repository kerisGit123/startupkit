"use client";

import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Search, Plus, Edit, Trash2, Copy, Star, Grid, List, X, Zap, Clock, Save, Eye } from 'lucide-react';
import { DEFAULT_PROMPT_TEMPLATES } from '@/lib/storyboard/defaultPromptTemplates';

interface Prompt {
  _id: string;
  name: string;
  type: 'character' | 'environment' | 'prop' | 'design' | 'camera' | 'action' | 'video' | 'other' | 'notes';
  prompt: string;
  notes?: string;
  companyId: string;
  isPublic: boolean;
  isSystem?: boolean;
  tags?: string[];
  usageCount: number;
  createdAt?: number;
}

const PROMPT_CATEGORIES = [
  { key: 'all', label: 'All' },
  { key: 'character', label: 'Character' },
  { key: 'environment', label: 'Environment' },
  { key: 'prop', label: 'Prop' },
  { key: 'design', label: 'Design' },
  { key: 'camera', label: 'Camera' },
  { key: 'action', label: 'Action' },
  { key: 'video', label: 'Video' },
  { key: 'notes', label: 'Notes' },
  { key: 'other', label: 'Other' },
] as const;

const ITEMS_PER_PAGE = 12;

interface PromptLibraryProps {
  onSelectPrompt: (prompt: string) => void;
  isOpen: boolean;
  onClose: () => void;
  userCompanyId: string;
}

const PromptLibrary = ({ onSelectPrompt, isOpen, onClose, userCompanyId }: PromptLibraryProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [sortBy, setSortBy] = useState<'name' | 'usage'>('usage');
  const [selectedCategory, setSelectedCategory] = useState<string>('character');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Prompt | null>(null);
  const [displayedCount, setDisplayedCount] = useState(ITEMS_PER_PAGE);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [sourceFilter, setSourceFilter] = useState<'all' | 'personal' | 'system'>('system');

  // Only user-created templates from Convex — system templates come from the static file
  const userTemplates = useQuery(api.promptTemplates.getByCompany, { companyId: userCompanyId });
  // Public user-shared templates (user-created ones marked isPublic)
  const publicTemplates = useQuery(api.promptTemplates.getPublicTemplates, {});

  // Mutations
  const createTemplate = useMutation(api.promptTemplates.create);
  const updateTemplate = useMutation(api.promptTemplates.update);
  const deleteTemplate = useMutation(api.promptTemplates.remove);
  const incrementUsage = useMutation(api.promptTemplates.incrementUsage);

  // Merge: static system templates (file, zero Convex bandwidth) + user DB templates
  const allTemplates = useMemo(() => {
    const staticTemplates: Prompt[] = DEFAULT_PROMPT_TEMPLATES.map((t, i) => ({
      _id: `sys:${i}:${t.name}`,
      name: t.name,
      type: t.type as Prompt['type'],
      prompt: t.prompt,
      notes: (t as any).notes,
      companyId: '',
      isPublic: t.isPublic,
      isSystem: true,
      tags: (t as any).tags,
      usageCount: 0,
      createdAt: 0,
    }));
    // DB templates — filter out any legacy isSystem records still in the DB
    const dbTemplates = (userTemplates || []).filter((t: any) => !t.isSystem);
    const pubTemplates = (publicTemplates || []).filter((t: any) => !t.isSystem);
    const mergedDb = Array.from(
      new Map([...dbTemplates, ...pubTemplates].map((t) => [t._id, t])).values()
    ) as Prompt[];
    return [...staticTemplates, ...mergedDb];
  }, [userTemplates, publicTemplates]);

  // Filter and sort templates
  const filteredTemplates = allTemplates
    .filter(template => {
      const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        template.prompt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (template as any).tags?.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'all' || template.type === selectedCategory;
      const matchesTags = selectedTags.length === 0 ||
        selectedTags.every(tag => (template as any).tags?.includes(tag));
      const matchesSource = sourceFilter === 'all' ? true :
        sourceFilter === 'system' ? template.isSystem === true :
        template.isSystem !== true;
      return matchesSearch && matchesCategory && matchesTags && matchesSource;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'name': return a.name.localeCompare(b.name);
        case 'usage': return b.usageCount - a.usageCount;
        default: return 0;
      }
    });

  // Get unique tags from current filtered set for tag filter pills
  const availableTags = [...new Set(
    filteredTemplates.flatMap(t => (t as any).tags || [])
  )].sort();

  const paginatedTemplates = filteredTemplates.slice(0, displayedCount);
  const hasMore = filteredTemplates.length > displayedCount;

  useEffect(() => {
    setDisplayedCount(ITEMS_PER_PAGE);
  }, [searchQuery, selectedCategory, selectedTags, sortBy, sourceFilter]);

  const handleSelectPrompt = async (prompt: string, templateId: string) => {
    // Static system templates have synthetic IDs (prefix "sys:") — skip DB usage tracking
    if (!templateId.startsWith('sys:')) {
      await incrementUsage({ id: templateId as any });
    }
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

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex">
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        <div className="fixed right-0 top-0 h-full w-full max-w-4xl overflow-hidden border-l border-white/10 bg-[#141414] shadow-2xl flex flex-col">
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

            {/* Source filter: My Prompts / System */}
            <div className="flex gap-1 mb-3">
              {(['personal', 'system'] as const).map(source => (
                <button
                  key={source}
                  onClick={() => setSourceFilter(source)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    sourceFilter === source
                      ? source === 'system'
                        ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-white/5 text-gray-400 border border-transparent hover:bg-white/10 hover:text-gray-300'
                  }`}
                >
                  {source === 'personal' ? 'My Prompts' : 'System'}
                </button>
              ))}
            </div>

            {/* Category filter tabs — click active tab to deselect (show all types) */}
            <div className="flex gap-1 flex-wrap mb-4">
              {PROMPT_CATEGORIES.filter(cat => cat.key !== 'all').map((cat) => {
                const sourceFiltered = allTemplates.filter(t =>
                  sourceFilter === 'all' ? true :
                  sourceFilter === 'system' ? t.isSystem === true :
                  t.isSystem !== true
                );
                const count = sourceFiltered.filter(t => t.type === cat.key).length;
                return (
                  <button
                    key={cat.key}
                    onClick={() => setSelectedCategory(prev => prev === cat.key ? 'all' : cat.key)}
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

            {/* Tag filter pills */}
            {availableTags.length > 0 && (
              <div className="flex gap-1 flex-wrap mb-3">
                {availableTags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setSelectedTags(prev =>
                      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
                    )}
                    className={`px-2 py-1 rounded-md text-[11px] font-medium transition-all ${
                      selectedTags.includes(tag)
                        ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30'
                        : 'bg-white/5 text-gray-500 border border-transparent hover:bg-white/8 hover:text-gray-400'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
                {selectedTags.length > 0 && (
                  <button
                    onClick={() => setSelectedTags([])}
                    className="px-2 py-1 rounded-md text-[11px] font-medium text-red-400 hover:bg-red-500/10 transition-all"
                  >
                    Clear
                  </button>
                )}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {paginatedTemplates.length} of {filteredTemplates.length} prompts
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
                  onClick={() => setIsCreateModalOpen(true)}
                  className="flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-600"
                >
                  <Plus className="w-4 h-4" />
                  Add Prompt
                </button>
              </div>
            </div>
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-6 pb-24">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {paginatedTemplates.map(template => (
                  <PromptCard
                    key={template._id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={template.isSystem ? undefined : () => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={template.isSystem ? undefined : () => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-2">
                {paginatedTemplates.map(template => (
                  <PromptListItem
                    key={template._id}
                    template={template}
                    onSelect={() => handleSelectPrompt(template.prompt, template._id)}
                    onEdit={template.isSystem ? undefined : () => {
                      setEditingTemplate(template);
                      setIsCreateModalOpen(true);
                    }}
                    onDelete={template.isSystem ? undefined : () => handleDeleteTemplate(template._id)}
                    onDuplicate={() => handleDuplicateTemplate(template)}
                  />
                ))}
              </div>
            )}

            {/* Load More button */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={() => setDisplayedCount(prev => prev + ITEMS_PER_PAGE)}
                  className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-sm text-gray-300 hover:bg-white/10 hover:text-white transition-all"
                >
                  Load More ({filteredTemplates.length - displayedCount} remaining)
                </button>
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
            {template.isSystem && (
              <span className="rounded-full bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-300">
                System
              </span>
            )}
            {template.isPublic && !template.isSystem && (
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

      {!template.isSystem && (
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {template.usageCount} uses
            </span>
            {template.createdAt ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
      )}

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
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            title="Edit prompt"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/10"
            title="Delete prompt"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
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
            {template.isSystem && (
              <span className="rounded-full bg-purple-500/15 px-2 py-1 text-xs font-medium text-purple-300">
                System
              </span>
            )}
            {template.isPublic && !template.isSystem && (
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

      {!template.isSystem && (
        <div className="mb-3 flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3" />
              {template.usageCount} uses
            </span>
            {template.createdAt ? (
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(template.createdAt).toLocaleDateString()}
              </span>
            ) : null}
          </div>
        </div>
      )}

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
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg border border-white/10 p-2 text-gray-300 transition-colors hover:bg-white/5 hover:text-white"
            title="Edit prompt"
          >
            <Edit className="w-4 h-4" />
          </button>
        )}
        {onDelete && (
          <button
            onClick={onDelete}
            className="rounded-lg border border-red-500/20 p-2 text-red-300 transition-colors hover:bg-red-500/10"
            title="Delete prompt"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
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
              <option value="camera">Camera</option>
              <option value="action">Action</option>
              <option value="notes">Notes</option>
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
