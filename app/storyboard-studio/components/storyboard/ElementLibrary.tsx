"use client";

import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Check, Globe, ImagePlus, Image, Loader2, Lock, Package, Pencil, Sparkles, Trash2, User, Trees, Type, Palette, Shapes, Users, X, FileText } from "lucide-react";
import { useCurrentCompanyId, getCurrentCompanyId, logUserInfo } from "@/lib/auth-utils";

interface ElementLibraryProps {
  projectId: Id<"storyboard_projects">;
  userId: string;
  user: any; // Clerk user object
  onClose: () => void;
  onSelectElement?: (referenceUrls: string[], name: string) => void;
  initialCreateDraft?: {
    imageUrls?: string[];
    name?: string;
    type?: string;
  } | null;
  selectedItemId?: Id<"storyboard_items"> | null; // For adding elements to specific storyboard item
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

export function ElementLibrary({ projectId, userId, user, onClose, onSelectElement, initialCreateDraft, selectedItemId }: ElementLibraryProps) {
  // Mutations at component top level (not inside onClick)
  const removeUnusedElements = useMutation(api.storyboard.storyboardItemElements.removeUnusedElements);
  const addElementToItem = useMutation(api.storyboard.storyboardItemElements.addElementToItem);
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
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]); // For filtering
  
  // New state for tabs and description
  const [activeTab, setActiveTab] = useState<"basic" | "visibility" | "details">("basic");
  const [description, setDescription] = useState("");

  const project = useQuery(api.storyboard.projects.get, { id: projectId });
  const projectCompanyId = useCurrentCompanyId(); // ✅ Use hook for active organization detection
  console.log(`[ElementLibrary] Project companyId from useCurrentCompanyId hook: ${projectCompanyId}`);
  console.log(`[ElementLibrary] Project object:`, project);
  console.log(`[ElementLibrary] Project.companyId:`, project?.companyId);
  
  // ✅ Use hook for active organization detection
  const queryCompanyId = projectCompanyId;
  console.log(`[ElementLibrary] Using queryCompanyId: ${queryCompanyId} (active organization or user ID)`);
  
  // Log user info for debugging
  logUserInfo(user, "ElementLibrary", projectCompanyId);
  
  // ✅ DEBUG: Query all elements without companyId filtering to see what's in database
  const allElements = useQuery(api.storyboard.storyboardElements.listAll, {});
  
  console.log(`[ElementLibrary] DEBUG - All elements in database:`, allElements?.length || 0);
  if (allElements && allElements.length > 0) {
    console.log(`[ElementLibrary] DEBUG - All element details:`, allElements.map(el => ({
      name: el.name,
      companyId: el.companyId,
      projectId: el.projectId,
      type: el.type,
      createdBy: el.createdBy,
      description: el.description?.substring(0, 50) || 'none'
    })));
  }
  
  // Filter elements for this project manually
  const projectElements = allElements?.filter(el => el.projectId === projectId && el.type === activeType) || [];
  console.log(`[ElementLibrary] DEBUG - Project elements (manual filter):`, projectElements.length);
  if (projectElements.length > 0) {
    console.log(`[ElementLibrary] DEBUG - Project element companyIds:`, projectElements.map(el => ({
      name: el.name,
      companyId: el.companyId,
      projectId: el.projectId
    })));
    
    // ✅ KEY DEBUG: Show what companyId we're querying vs what elements have
    console.log(`[ElementLibrary] DEBUG - Querying for companyId: ${queryCompanyId}`);
    console.log(`[ElementLibrary] DEBUG - Element companyIds found:`, projectElements.map(el => el.companyId));
    console.log(`[ElementLibrary] DEBUG - Match found:`, projectElements.some(el => el.companyId === queryCompanyId));
  }
  
  // Keep the original queries for debugging but don't use them for display
  const elements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    type: activeType,
    companyId: queryCompanyId, // ✅ Use active organization or user ID
  } as any);
  
  // ✅ FALLBACK: Explicitly use organization ID from user object
  // This handles cases where elements were created in organization mode but user is in personal mode
  const orgCompanyId = user?.organizationMemberships?.[0]?.organization?.id || user?.id;
  console.log(`[ElementLibrary] Fallback orgCompanyId: ${orgCompanyId}`);
  
  const fallbackElements = useQuery(api.storyboard.storyboardElements.listByProject, {
    projectId,
    type: activeType,
    companyId: orgCompanyId, // Try organization ID as fallback
  } as any);
  
  // ✅ TEMPORARY FIX: Use manual filtering to display elements
  // This bypasses the Convex query issue while we debug the server-side function
  const displayElements = projectElements.length > 0 ? projectElements : fallbackElements;
  
  console.log(`[ElementLibrary] Querying elements with:`, { projectId, type: activeType, companyId: queryCompanyId });
  console.log(`[ElementLibrary] Found elements (primary):`, elements?.length || 0);
  console.log(`[ElementLibrary] Found elements (fallback org):`, fallbackElements?.length || 0);
  console.log(`[ElementLibrary] Displaying elements (manual filter):`, displayElements?.length || 0);
  if (displayElements && displayElements.length > 0) {
    console.log(`[ElementLibrary] Element companyIds:`, displayElements.map(el => ({ name: el.name, companyId: el.companyId })));
  }
  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const updateElement = useMutation(api.storyboard.storyboardElements.update);
  const removeElement = useMutation(api.storyboard.storyboardElements.remove);
  
  // Toggle element visibility
  const toggleElementVisibility = async (elementId: Id<"storyboard_elements">, currentVisibility: "private" | "public") => {
    try {
      const newVisibility = currentVisibility === "private" ? "public" : "private";
      await updateElement({
        id: elementId,
        visibility: newVisibility,
      });
      console.log(`[ElementLibrary] Toggled element ${elementId} visibility to ${newVisibility}`);
    } catch (error) {
      console.error("[ElementLibrary] Failed to toggle visibility:", error);
    }
  };

  // State for tracking deletion operations
  const [deletingIds, setDeletingIds] = useState<Set<Id<"storyboard_elements">>>(new Set());
  const [recentlyDeleted, setRecentlyDeleted] = useState<Set<Id<"storyboard_elements">>>(new Set());

  // Safe element deletion with error handling and debouncing
  const handleRemoveElement = async (elementId: Id<"storyboard_elements">, elementName: string) => {
    // Reminder for developers - remove after Convex deployment
    if (process.env.NODE_ENV === 'development') {
      console.log('🚀 REMINDER: Make sure to deploy Convex backend changes with: npx convex deploy');
    }
    
    // Prevent duplicate deletions
    if (deletingIds.has(elementId) || recentlyDeleted.has(elementId)) {
      console.log(`[ElementLibrary] Deletion already in progress or recently completed for: ${elementName}`);
      return;
    }

    // Add to tracking sets
    setDeletingIds(prev => new Set(prev).add(elementId));
    
    try {
      await removeElement({ id: elementId });
      console.log(`[ElementLibrary] Successfully deleted element: ${elementName}`);
      
      // Add to recently deleted set for 2 seconds to prevent rapid re-deletion
      setRecentlyDeleted(prev => new Set(prev).add(elementId));
      setTimeout(() => {
        setRecentlyDeleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(elementId);
          return newSet;
        });
      }, 2000);
      
    } catch (error) {
      console.error("[ElementLibrary] Failed to delete element:", error);
      
      // User-friendly error message
      if (error instanceof Error && error.message.includes("Element not found")) {
        // Don't show alert for recently deleted items (user experience)
        if (!recentlyDeleted.has(elementId)) {
          alert(`This element "${elementName}" may have already been deleted or is no longer available. The element list will refresh automatically.`);
        }
      } else {
        alert(`Unable to delete element "${elementName}". Please try again or refresh the page.`);
      }
    } finally {
      // Remove from deleting set
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
    }
  };

  const editingElement = useMemo(
    () => displayElements?.find((element) => element._id === editingId) ?? null,
    [editingId, displayElements]
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
    setVisibility(editingElement.visibility === "public" ? "public" : "private");
    setDescription(editingElement.description ?? "");
    setTags(editingElement.tags ?? []);
    setShowCreate(true);
  }, [editingElement]);

  const resetForm = () => {
    setEditingId(null);
    setNewName("");
    setReferenceUrls([]);
    setReferenceFiles([]);
    setThumbnailIndex(0);
    setVisibility("private");
    setShowCreate(false);
    setActiveTab("basic");
    setDescription("");
    setTags([]);
    setTagInput("");
  };

  const uploadFile = async (file: File, filename: string) => {
    // ✅ Use companyId from component level, not hook call
    console.log("[ElementLibrary] Using companyId from component:", projectCompanyId);
    
    const sigRes = await fetch("/api/storyboard/r2-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        filename, 
        contentType: file.type,
        category: "elements", // Specify category for element uploads
        companyId: projectCompanyId, // ✅ Pass correct companyId from Clerk
      }),
    });
    const data = await sigRes.json();
    console.log("[ElementLibrary] Upload API response:", data);
    
    if (!sigRes.ok || data.error || !data.uploadUrl) {
      throw new Error(data.error ?? "Failed to prepare upload");
    }
    
    await fetch(data.uploadUrl, {
      method: "PUT",
      body: file,
      headers: { "Content-Type": file.type },
    });
    
    // Return the publicUrl from API response, or construct it if not provided
    return data.publicUrl || `https://${process.env.NEXT_PUBLIC_R2_PUBLIC_URL}/${data.key}`;
  };

  const handleCreateOrUpdate = async () => {
    if (!newName.trim() || saving) return;
    setSaving(true);
    try {
      // Upload files to R2 only when saving
      const uploadedUrls: string[] = [];
      
      // First, upload any new files that haven't been uploaded yet
      if (editingId) {
        // For editing, just upload new files and update existing element
        const newFileUploads = draftRefs.filter(ref => !ref.uploaded && ref.file);
        for (const ref of newFileUploads) {
          const url = await uploadFile(ref.file);
          uploadedUrls.push(url);
          ref.uploaded = true;
          ref.url = url;
        }
      } else {
        // For creating new elements, upload all files
        for (const ref of draftRefs) {
          const url = await uploadFile(ref.file);
          uploadedUrls.push(url);
          ref.uploaded = true;
          ref.url = url;
        }
      }
      
      // Combine existing reference URLs with newly uploaded ones
      const allReferenceUrls = [
        ...referenceUrls.filter(url => url && !draftRefs.some(ref => ref.url === url)),
        ...uploadedUrls
      ];

      if (editingId) {
        // Update existing element
        await updateElement({
          id: editingId,
          name: newName.trim(),
          description: description.trim(),
          referenceUrls: allReferenceUrls.length > 0 ? allReferenceUrls : [""], // Use empty string if no images
          tags: tags,
          thumbnailUrl: allReferenceUrls.length > 0 ? allReferenceUrls[thumbnailIndex] : "", // Use empty string if no images
          visibility,
        });
        console.log(`[ElementLibrary] Updated element: ${newName}`);
      } else {
        if (activeType === 'environment') {
          alert("Environment elements are generated from Build Storyboard. Use Enhanced Build with Regenerate Elements to create smart environments.");
          setSaving(false);
          return;
        }
        
        // Fallback to basic element creation
        await createElement({
          projectId,
          name: newName.trim(),
          type: activeType,
          description: description.trim(),
          referenceUrls: allReferenceUrls.length > 0 ? allReferenceUrls : [""], // Use empty string if no images
          tags: tags,
          thumbnailUrl: allReferenceUrls.length > 0 ? allReferenceUrls[thumbnailIndex] : "", // Use empty string if no images
          visibility,
          createdBy: "user", // Required field
        });
        console.log(`[ElementLibrary] Created element: ${newName}`);
      }
      
      resetForm();
      setShowCreate(false);
    } catch (error) {
      console.error("[ElementLibrary] Failed to save element:", error);
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
            ) : (displayElements?.length ?? 0) === 0 ? (
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
                  <p className="text-sm text-neutral-400">{displayElements?.length ?? 0} {activeType} elements</p>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        if (confirm('Remove all private unused element references from storyboard items?')) {
                          const result = await removeUnusedElements({ projectId });
                          alert(result.message);
                        }
                      }}
                      className="px-3 sm:px-4 py-2 bg-red-600/20 border border-red-500/30 text-red-300 rounded-lg font-medium hover:bg-red-600/30 transition-colors text-sm"
                      title="Clean up private unused element references from storyboard items"
                    >
                      Remove Unused
                    </button>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-3 sm:px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm"
                    >
                      Create Element
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3 sm:gap-4">
                  {displayElements?.map((element) => (
                    <div key={element._id} className="group overflow-hidden rounded-xl border border-neutral-800/50 bg-neutral-950 hover:border-indigo-500 transition-all hover:shadow-lg">
                      <div
                        onClick={() => onSelectElement?.(element.referenceUrls ?? [element.thumbnailUrl], element.name)}
                        className="block w-full text-left cursor-pointer"
                      >
                        <div className="aspect-square overflow-hidden bg-neutral-900 relative">
                          {/* Type Badge in Top-Left Corner */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="text-xs bg-indigo-500/80 text-white rounded px-2 py-1 font-medium backdrop-blur-sm">
                              {element.type}
                            </span>
                          </div>
                          
                          {/* Public/Private Badges in Top-Right Corner */}
                          <div className="absolute top-2 right-2 z-10">
                            {element.visibility === "public" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent redirect to storyboard item page
                                  toggleElementVisibility(element._id, element.visibility || "private");
                                }}
                                className="flex items-center gap-1 text-[10px] bg-green-500/80 text-white rounded px-1.5 py-0.5 hover:bg-green-500/90 transition-colors cursor-pointer backdrop-blur-sm"
                                title="Click to make private"
                              >
                                <Globe className="w-2.5 h-2.5" />Public
                              </button>
                            )}
                            {element.visibility === "private" && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation(); // Prevent redirect to storyboard item page
                                  toggleElementVisibility(element._id, element.visibility || "private");
                                }}
                                className="flex items-center gap-1 text-[10px] bg-gray-500/80 text-white rounded px-1.5 py-0.5 hover:bg-gray-500/90 transition-colors cursor-pointer backdrop-blur-sm"
                                title="Click to make public"
                              >
                                <Lock className="w-2.5 h-2.5" />Private
                              </button>
                            )}
                          </div>
                          
                          {/* Tag Area Above Black Layer */}
                          {element.tags && element.tags.length > 0 && (
                            <div className="absolute bottom-0 left-0 right-0 z-10 p-2 bg-gradient-to-t from-black/80 to-transparent">
                              <div className="flex flex-wrap gap-1">
                                {element.tags.slice(0, 3).map((tag, index) => (
                                  <span key={index} className="text-xs bg-purple-500/80 text-white rounded px-1.5 py-0.5 backdrop-blur-sm">
                                    {tag}
                                  </span>
                                ))}
                                {element.tags.length > 3 && (
                                  <span className="text-xs bg-purple-500/80 text-white rounded px-1.5 py-0.5 backdrop-blur-sm">
                                    +{element.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            </div>
                          )}
                          
                          {element.thumbnailUrl ? (
                            <img 
                              src={element.thumbnailUrl} 
                              alt={element.name} 
                              className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                              onError={(e) => {
                                // Hide image on error to prevent empty string issues
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                              <Image className="h-8 w-8 text-indigo-400" />
                            </div>
                          )}
                        </div>
                        <div className="p-3 sm:p-4">
                          <p className="truncate text-sm sm:text-base font-semibold text-white leading-tight">{element.name}</p>
                          {element.description && (
                            <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                              {element.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between border-t border-neutral-800/50 px-3 sm:px-4 py-2 sm:py-3 bg-neutral-900">
                        {selectedItemId ? (
                          <button
                            onClick={async () => {
                              await addElementToItem({ itemId: selectedItemId, elementId: element._id });
                              onClose();
                            }}
                            className="flex-1 px-3 py-1.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg font-medium hover:from-indigo-600 hover:to-purple-700 transition-colors text-sm"
                          >
                            Add to Storyboard
                          </button>
                        ) : (
                          <div className="flex-1"></div>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => setEditingId(element._id)}
                            className="rounded-lg p-1.5 sm:p-2 text-neutral-400 transition hover:bg-indigo-500/20 hover:text-indigo-400"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleRemoveElement(element._id, element.name)}
                            disabled={deletingIds.has(element._id) || recentlyDeleted.has(element._id)}
                            className={`rounded-lg p-1.5 sm:p-2 transition ${
                              deletingIds.has(element._id) || recentlyDeleted.has(element._id)
                                ? 'text-gray-500 cursor-not-allowed opacity-50'
                                : 'text-neutral-400 hover:bg-red-500/20 hover:text-red-400'
                            }`}
                            title={deletingIds.has(element._id) ? 'Deleting...' : recentlyDeleted.has(element._id) ? 'Recently deleted' : 'Delete element'}
                          >
                            {deletingIds.has(element._id) ? (
                              <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
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
            <div className="w-full max-w-xs sm:max-w-md border-t sm:border-t-0 sm:border-l border-neutral-800/50 bg-neutral-950 p-3 sm:p-6">
              <div className="mb-3 sm:mb-6 flex items-center justify-between">
                <div>
                  <p className="text-base sm:text-lg font-bold text-white">{editingId ? "Edit Element" : "Create Element"}</p>
                  <p className="text-xs text-neutral-400 mt-1 hidden sm:block">Reference images are saved when you confirm this form.</p>
                </div>
                <button onClick={resetForm} className="rounded-lg p-1.5 sm:p-2 text-neutral-400 hover:text-white hover:bg-neutral-800/50 transition-colors">
                  <X className="w-3.5 h-3.5 sm:w-4 h-4" />
                </button>
              </div>

              <div className="space-y-3 sm:space-y-4">
                <div className="flex border border-neutral-800/50 rounded-lg p-1 bg-neutral-900">
                  {[
                    { id: "basic", label: "Basic", Icon: Package },
                    { id: "details", label: "Details", Icon: FileText },
                    { id: "visibility", label: "Visibility", Icon: Globe },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id as "basic" | "visibility" | "details")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-md px-3 py-2 text-xs font-medium transition-all ${
                        activeTab === id
                          ? "bg-indigo-500 text-white"
                          : "text-neutral-400 hover:text-white hover:bg-neutral-800"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </button>
                  ))}
                </div>

                {activeTab === "basic" && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5 sm:mb-2">Element Name</label>
                      <input
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Enter element name..."
                        className="w-full rounded-lg border border-neutral-800/50 bg-neutral-900 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white outline-none placeholder:text-neutral-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5 sm:mb-2">Element Type</label>
                      <select
                        value={activeType}
                        onChange={(event) => setActiveType(event.target.value)}
                        className="w-full rounded-lg border border-neutral-800/50 bg-neutral-900 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
                      >
                        {ELEMENT_TYPES.map((type) => (
                          <option key={type.key} value={type.key}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-center justify-center gap-2 sm:gap-3 rounded-xl border border-dashed border-neutral-800/50 bg-neutral-900 px-2.5 sm:px-4 py-2.5 sm:py-4 text-xs sm:text-sm text-neutral-300 transition-all hover:bg-neutral-800 hover:border-neutral-700">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 sm:h-4 w-4 animate-spin" /> : <ImagePlus className="h-3.5 w-3.5 sm:h-4 w-4" />}
                        <span className="text-xs sm:text-sm">Add reference images</span>
                        <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadDraftRefs} />
                      </label>
                    </div>

                    {referenceUrls.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-neutral-300 mb-2 sm:mb-3">Reference Images</label>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                          {referenceUrls.map((url, index) => (
                            <div key={`ref-${index}-${Date.now()}-${Math.random()}`} className={`group relative overflow-hidden rounded-lg sm:rounded-xl border ${index === thumbnailIndex ? "border-indigo-500 ring-2 ring-indigo-500/50" : "border-neutral-800/50"} bg-neutral-900`}>
                              <img src={url} alt={`Reference ${index + 1}`} className="aspect-square h-full w-full object-cover" />
                              <button
                                type="button"
                                onClick={() => {
                                  if (url.startsWith("blob:")) {
                                    URL.revokeObjectURL(url);
                                  }
                                  setReferenceUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                                  setReferenceFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== index));
                                }}
                                className="absolute top-1 right-1 rounded bg-red-500/80 p-1 opacity-0 transition-opacity group-hover:opacity-100"
                              >
                                <X className="w-3 h-3 text-white" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "visibility" && (
                  <div className="space-y-3 sm:space-y-4">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5 sm:mb-2">Visibility</label>
                      <div className="grid grid-cols-2 gap-1.5 sm:gap-2">
                        {[
                          { value: "private", label: "Private", Icon: Lock, color: "text-neutral-400", active: "bg-neutral-700 border-neutral-600 text-white" },
                          { value: "public", label: "Public", Icon: Globe, color: "text-emerald-400", active: "bg-emerald-600/20 border-emerald-500 text-emerald-300" },
                        ].map(({ value, label, Icon, color, active }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setVisibility(value as "private" | "public")}
                            className={`flex flex-col items-center gap-1 rounded-lg border px-2 py-2 sm:py-2.5 text-xs font-medium transition-all ${
                              visibility === value
                                ? active
                                : "border-neutral-800/50 bg-neutral-900 text-neutral-500 hover:border-neutral-700 hover:text-neutral-300"
                            }`}
                          >
                            <Icon className={`w-3.5 h-3.5 ${visibility === value ? color : ""}`} />
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px] text-neutral-500">
                        {visibility === "private" && "Only visible within this project"}
                        {visibility === "public" && "Visible to everyone (public access)"}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-4 sm:space-y-6">
                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5 sm:mb-2">Description</label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Describe the element's appearance, characteristics, and usage..."
                        rows={4}
                        className="w-full rounded-lg border border-neutral-800/50 bg-neutral-900 px-2.5 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-white outline-none placeholder:text-neutral-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors resize-none"
                      />
                      <p className="mt-1.5 text-[10px] text-neutral-500">
                        Detailed descriptions help with AI generation and visual consistency
                      </p>
                    </div>

                    <div>
                      <label className="block text-xs sm:text-sm font-medium text-neutral-300 mb-1.5 sm:mb-2">Tags</label>
                      <div className="flex flex-wrap gap-1 mb-4">
                        {tags.map((tag, index) => (
                          <span key={index} className="flex items-center gap-1 text-xs bg-indigo-500/20 text-indigo-400 rounded px-2 py-1.5 h-6">
                            {tag}
                            <button
                              type="button"
                              onClick={() => setTags(tags.filter((_, i) => i !== index))}
                              className="ml-1 text-indigo-300 hover:text-indigo-200"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && tagInput.trim()) {
                              e.preventDefault();
                              if (!tags.includes(tagInput.trim())) {
                                setTags([...tags, tagInput.trim()]);
                              }
                              setTagInput("");
                            }
                          }}
                          placeholder="Add tags..."
                          className="flex-1 rounded-lg border border-neutral-800/50 bg-neutral-900 px-2.5 py-2 text-xs text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors h-8"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (tagInput.trim() && !tags.includes(tagInput.trim())) {
                              setTags([...tags, tagInput.trim()]);
                              setTagInput("");
                            }
                          }}
                          disabled={!tagInput.trim()}
                          className="rounded-lg border border-indigo-500/50 bg-indigo-500/20 px-3 py-2 text-xs text-indigo-400 transition hover:bg-indigo-500/30 disabled:opacity-50 disabled:cursor-not-allowed h-8"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-2.5">
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={saving || !newName.trim()}
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
