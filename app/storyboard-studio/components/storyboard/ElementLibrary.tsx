"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Check, ImagePlus, Loader2, Package, Pencil, Sparkles, Trash2, User, Trees, Type, Palette, Shapes, X } from "lucide-react";

interface ElementLibraryProps {
  projectId: Id<"storyboard_projects">;
  userId: string;
  onClose: () => void;
  onSelectElement?: (referenceUrls: string[], name: string) => void;
  initialCreateDraft?: {
    imageUrls?: string[];
    name?: string;
    type?: string;
  } | null;
}

const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User, color: "text-purple-400" },
  { key: "object", label: "Props", Icon: Package, color: "text-blue-400" },
  { key: "environment", label: "Environment", Icon: Trees, color: "text-emerald-400" },
  { key: "logo", label: "Logos", Icon: Shapes, color: "text-pink-400" },
  { key: "font", label: "Fonts", Icon: Type, color: "text-yellow-400" },
  { key: "style", label: "Styles", Icon: Palette, color: "text-orange-400" },
  { key: "other", label: "Other", Icon: Sparkles, color: "text-gray-300" },
] as const;

function sanitizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "element";
}

export function ElementLibrary({ projectId, userId, onClose, onSelectElement, initialCreateDraft }: ElementLibraryProps) {
  const initialType = initialCreateDraft?.type ?? "character";
  const [activeType, setActiveType] = useState(initialType);
  const [showCreate, setShowCreate] = useState(Boolean(initialCreateDraft));
  const [editingId, setEditingId] = useState<Id<"storyboard_elements"> | null>(null);
  const [newName, setNewName] = useState(initialCreateDraft?.name ?? "");
  const [referenceUrls, setReferenceUrls] = useState<string[]>(initialCreateDraft?.imageUrls ?? []);
  const [referenceFiles, setReferenceFiles] = useState<File[]>([]); // Store actual files for upload later
  const [thumbnailIndex, setThumbnailIndex] = useState(0); // Track which image is thumbnail
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    type: activeType,
  });
  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const updateElement = useMutation(api.storyboard.storyboardElements.update);
  const removeElement = useMutation(api.storyboard.storyboardElements.remove);

  const editingElement = useMemo(
    () => elements?.find((element) => element._id === editingId) ?? null,
    [editingId, elements]
  );

  useEffect(() => {
    if (!initialCreateDraft) return;
    setActiveType(initialCreateDraft.type ?? "character");
    setShowCreate(true);
    setEditingId(null);
    setNewName(initialCreateDraft.name ?? "");
    setReferenceUrls(initialCreateDraft.imageUrls ?? []);
  }, [initialCreateDraft]);

  useEffect(() => {
    if (!editingElement) return;
    setNewName(editingElement.name ?? "");
    setReferenceUrls(editingElement.referenceUrls ?? []);
    setActiveType(editingElement.type ?? "character");
    setShowCreate(true);
  }, [editingElement]);

  const resetForm = () => {
    setEditingId(null);
    setNewName("");
    setReferenceUrls([]);
    setReferenceFiles([]);
    setThumbnailIndex(0);
    setShowCreate(false);
  };

  const uploadFile = async (file: File, key: string) => {
    const sigRes = await fetch("/api/storyboard/r2-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: key, contentType: file.type }),
    });
    const data = await sigRes.json();
    if (!sigRes.ok || data.error || !data.uploadUrl || !data.publicUrl) {
      throw new Error(data.error ?? "Failed to prepare upload");
    }
    await fetch(data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    return data.publicUrl as string;
  };

  const handleCreateOrUpdate = async () => {
    if (!newName.trim() || referenceUrls.length === 0 || saving) return;
    setSaving(true);
    try {
      // Upload files to R2 only when saving
      const uploadedUrls: string[] = [];
      
      // First, upload any new files that haven't been uploaded yet
      if (referenceFiles.length > 0) {
        const uploaded = await Promise.all(
          referenceFiles.map((file) => {
            const key = `project-${projectId}/elements/element-${Date.now()}-${Math.random().toString(36).slice(2)}-${file.name}`;
            return uploadFile(file, key);
          })
        );
        uploadedUrls.push(...uploaded);
      }
      
      // Combine existing R2 URLs with newly uploaded ones
      const existingR2Urls = referenceUrls.filter(url => !url.startsWith('blob:'));
      const finalUrls = uploadedUrls.length > 0 ? [...existingR2Urls, ...uploadedUrls] : referenceUrls;
      
      // Reorder URLs so thumbnail is first
      const thumbnailUrl = finalUrls[thumbnailIndex] || finalUrls[0];
      const reorderedUrls = [thumbnailUrl, ...finalUrls.filter((_, index) => index !== thumbnailIndex)];
      
      if (editingId) {
        await updateElement({
          id: editingId,
          name: newName.trim(),
          type: activeType,
          thumbnailUrl: thumbnailUrl,
          referenceUrls: reorderedUrls,
        });
      } else {
        await createElement({
          projectId,
          name: newName.trim(),
          type: activeType,
          thumbnailUrl: thumbnailUrl,
          referenceUrls: reorderedUrls,
          tags: [],
          createdBy: userId,
        });
      }
      resetForm();
    } catch (error) {
      console.error("[ElementLibrary save]", error);
    } finally {
      setSaving(false);
    }
  };

  const handleUploadDraftRefs = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    if (files.length === 0) return;
    setUploading(true);
    try {
      // Create blob URLs for local preview (not uploaded to R2 yet)
      const blobUrls = files.map((file) => URL.createObjectURL(file));
      setReferenceUrls((prev) => [...prev, ...blobUrls]);
      setReferenceFiles((prev) => [...prev, ...files]);
      // Reset thumbnail index to first image if this is the first upload
      if (referenceUrls.length === 0) {
        setThumbnailIndex(0);
      }
    } catch (error) {
      console.error("[ElementLibrary draft upload]", error);
    } finally {
      setUploading(false);
      event.target.value = "";
    }
  };

  return (
    <div className="fixed inset-0 bg-black/98 backdrop-blur-md z-50 flex items-center justify-center p-3 sm:p-6">
      <div className="w-full max-w-6xl bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800/50 max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-3 sm:py-4 border-b border-neutral-800/50">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="w-8 h-8 sm:w-12 sm:h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg sm:rounded-xl flex items-center justify-center">
              <Package className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
            </div>
            <div>
              <h2 className="text-lg sm:text-2xl font-bold text-white">Element Library</h2>
              <p className="text-xs text-neutral-400 hidden sm:block">Create and manage reusable visual elements</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
            <X className="w-3.5 h-3.5 sm:w-5 h-4 sm:h-5" />
          </button>
        </div>

        <div className="border-b border-neutral-800/50 px-3 sm:px-6 py-2 sm:py-4">
          <div className="flex gap-1 flex-wrap overflow-x-auto">
            {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveType(key)}
                className={`flex items-center gap-1 sm:gap-2 rounded-lg px-2 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium transition whitespace-nowrap ${
                  activeType === key
                    ? "bg-indigo-600 text-white"
                    : "text-neutral-400 hover:bg-neutral-800/50 hover:text-white"
                }`}
              >
                <Icon className={`h-3 w-3 sm:h-4 w-4 ${color}`} />
                <span className="hidden xs:inline sm:inline">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-3 sm:p-4">
            {!elements ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-purple-400" />
              </div>
            ) : elements.length === 0 ? (
              <div className="flex h-40 sm:h-52 flex-col items-center justify-center rounded-xl border border-dashed border-neutral-800/50 bg-neutral-950 text-center px-4">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-indigo-500/20 to-purple-600/20 rounded-2xl flex items-center justify-center mb-3 sm:mb-4">
                  <Sparkles className="h-6 w-6 sm:h-8 w-8 text-indigo-400" />
                </div>
                <p className="text-sm font-medium text-neutral-300">No {activeType} elements yet</p>
                <p className="mt-1 text-xs text-neutral-500">Create your first element to get started</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-3 sm:mt-4 px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm"
                >
                  Create Element
                </button>
              </div>
            ) : (
              <>
                <div className="mb-3 sm:mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-1">
                  <p className="text-sm text-neutral-400">{elements.length} {activeType} elements</p>
                  <button
                    onClick={() => setShowCreate(true)}
                    className="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm"
                  >
                    Create Element
                  </button>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                  {elements.map((element) => (
                    <div key={element._id} className="group overflow-hidden rounded-xl border border-neutral-800/50 bg-neutral-950 hover:border-indigo-500 transition-all hover:shadow-lg">
                      <button
                        onClick={() => onSelectElement?.(element.referenceUrls ?? [element.thumbnailUrl], element.name)}
                        className="block w-full text-left"
                      >
                        <div className="aspect-square overflow-hidden bg-neutral-900">
                          <img src={element.thumbnailUrl} alt={element.name} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                        </div>
                        <div className="p-3 sm:p-4">
                          <p className="truncate text-sm sm:text-base font-semibold text-white leading-tight">{element.name}</p>
                          <p className="mt-1 text-xs sm:text-sm capitalize text-neutral-400">{element.type}</p>
                        </div>
                      </button>
                      <div className="flex items-center justify-end border-t border-neutral-800/50 px-3 sm:px-4 py-2 sm:py-3 bg-neutral-900">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingId(element._id)}
                            className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition hover:bg-indigo-500/20 hover:text-indigo-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => removeElement({ id: element._id })}
                            className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition hover:bg-red-500/20 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {showCreate && (
            <div className="w-full max-w-md border-t sm:border-t-0 sm:border-l border-neutral-800/50 bg-neutral-950 p-3 sm:p-6">
              <div className="mb-4 sm:mb-6 flex items-center justify-between">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{editingId ? "Edit Element" : "Create Element"}</p>
                  <p className="text-xs text-neutral-400 mt-1 hidden sm:block">Reference images are saved when you confirm this form.</p>
                </div>
                <button onClick={resetForm} className="rounded-lg p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
                  <X className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Element Name</label>
                  <input
                    value={newName}
                    onChange={(event) => setNewName(event.target.value)}
                    placeholder="Enter element name..."
                    className="w-full rounded-lg border border-neutral-800/50 bg-neutral-900 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-neutral-300 mb-2">Element Type</label>
                  <select
                    value={activeType}
                    onChange={(event) => setActiveType(event.target.value)}
                    className="w-full rounded-lg border border-neutral-800/50 bg-neutral-900 px-3 sm:px-4 py-2.5 sm:py-3 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                  >
                    {ELEMENT_TYPES.map((type) => (
                      <option key={type.key} value={type.key}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex cursor-pointer items-center justify-center gap-2 sm:gap-3 rounded-xl border border-dashed border-neutral-800/50 bg-neutral-900 px-3 sm:px-4 py-3 sm:py-4 text-sm text-neutral-300 transition-all hover:bg-neutral-800 hover:border-neutral-700">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                    <span className="text-xs sm:text-sm">Add reference images</span>
                    <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadDraftRefs} />
                  </label>
                </div>

                {referenceUrls.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Reference Images</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                      {referenceUrls.map((url, index) => (
                        <div key={`ref-${index}-${Date.now()}-${Math.random()}`} className={`group relative overflow-hidden rounded-lg sm:rounded-xl border ${index === thumbnailIndex ? 'border-indigo-500 ring-2 ring-indigo-500/50' : 'border-neutral-800/50'} bg-neutral-900`}>
                          <img src={url} alt={`Reference ${index + 1}`} className="aspect-square h-full w-full object-cover" />
                          <button
                            onClick={() => {
                              // Clean up blob URL if it's a blob
                              if (url.startsWith('blob:')) {
                                URL.revokeObjectURL(url);
                              }
                              setReferenceUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                              setReferenceFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                              // Update thumbnail index if removing current thumbnail
                              if (thumbnailIndex === index && referenceUrls.length > 1) {
                                setThumbnailIndex(0);
                              } else if (thumbnailIndex > index) {
                                setThumbnailIndex(thumbnailIndex - 1);
                              }
                            }}
                            className="absolute right-1.5 top-1.5 sm:right-2 sm:top-2 rounded-lg bg-red-500/90 p-1.5 sm:p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-red-600"
                          >
                            <X className="h-2.5 w-2.5 sm:h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              setThumbnailIndex(index);
                            }}
                            className={`absolute left-1.5 top-1.5 sm:left-2 sm:top-2 rounded-lg ${index === thumbnailIndex ? 'bg-indigo-500' : 'bg-neutral-800/50'} p-1.5 sm:p-2 text-white opacity-0 transition group-hover:opacity-100 hover:bg-indigo-600`}
                          >
                            <span className="text-[10px] sm:text-xs font-medium">
                              {index === thumbnailIndex ? '★' : ''}
                            </span>
                          </button>
                          {index === thumbnailIndex && (
                            <div className="absolute bottom-1.5 left-1.5 sm:bottom-2 sm:left-2 rounded-lg bg-emerald-500/90 px-1.5 sm:px-2 py-0.5 sm:py-1 text-[8px] sm:text-[10px] font-medium text-white">
                              Thumbnail
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button
                  onClick={handleCreateOrUpdate}
                  disabled={saving || !newName.trim() || referenceUrls.length === 0}
                  className="flex w-full items-center justify-center gap-2 sm:gap-3 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 py-2.5 sm:py-3 text-sm font-semibold text-white transition-all hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? "Save Changes" : "Create Element"}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
