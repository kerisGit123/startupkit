"use client";

import { useEffect, useMemo, useState, useReducer, useCallback, memo, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Check, Globe, ImagePlus, Image, Loader2, Lock, Package, Pencil, Sparkles, Trash2, User, Trees, Type, Palette, Shapes, Users, X, FileText, Plus, Hash } from "lucide-react";
import { useCurrentCompanyId, getCurrentCompanyId, logUserInfo } from "@/lib/auth-utils";

// Enhanced Element interface
interface Element {
  _id: Id<"storyboard_elements">;
  name: string;
  thumbnailUrl?: string;
  referenceUrls?: string[];
  type: string;
  visibility?: "private" | "public";
  tags?: string[];
  description?: string;
}

// Image selection state management
interface ImageSelectionState {
  mode: 'disabled' | 'enabled' | 'selecting';
  selectedElement: Element | null;
}

type ImageSelectionAction = 
  | { type: 'ENABLE_MODE' }
  | { type: 'DISABLE_MODE' }
  | { type: 'START_SELECTION'; element: Element }
  | { type: 'END_SELECTION' };

const imageSelectionReducer = (
  state: ImageSelectionState, 
  action: ImageSelectionAction
): ImageSelectionState => {
  switch (action.type) {
    case 'ENABLE_MODE':
      return { ...state, mode: 'enabled' };
    case 'DISABLE_MODE':
      return { mode: 'disabled', selectedElement: null };
    case 'START_SELECTION':
      return { mode: 'selecting', selectedElement: action.element };
    case 'END_SELECTION':
      return { mode: 'enabled', selectedElement: null };
    default:
      return state;
  }
};

interface ElementLibraryProps {
  projectId: Id<"storyboard_projects">;
  userId: string;
  user: any; // Clerk user object
  onClose: () => void;
  onSelectElement?: (referenceUrls: string[], name: string, element: Element) => void;
  initialCreateDraft?: {
    imageUrls?: string[];
    name?: string;
    type?: string;
  } | null;
  selectedItemId?: Id<"storyboard_items"> | null; // For adding elements to specific storyboard item
  // New props for image selection
  imageSelectionMode?: boolean;
  onSelectImage?: (imageUrl: string, elementName: string, element: Element) => void;
}

const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User, color: "text-purple-400" },
  { key: "prop", label: "Props", Icon: Package, color: "text-blue-400" },
  { key: "environment", label: "Environment", Icon: Trees, color: "text-emerald-400" },
  { key: "logo", label: "Logos", Icon: Shapes, color: "text-pink-400" },
  { key: "font", label: "Fonts", Icon: Type, color: "text-yellow-400" },
  { key: "style", label: "Styles", Icon: Palette, color: "text-orange-400" },
  { key: "other", label: "Other", Icon: Sparkles, color: "text-gray-300" },
] as const;

function normalizeAssetUrl(url?: string | null) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  if (trimmed.startsWith("blob:")) return trimmed;
  if (trimmed.startsWith("http://https://")) return trimmed.replace("http://https://", "https://");
  if (trimmed.startsWith("https://https://")) return trimmed.replace("https://https://", "https://");
  if (trimmed.startsWith("http://http://")) return trimmed.replace("http://http://", "http://");
  if (trimmed.startsWith("https://http://")) return trimmed.replace("https://http://", "http://");
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
 
  const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").trim().replace(/\/$/, "");
  if (!publicBase) return trimmed;
  return `${publicBase}/${trimmed.replace(/^\/+/, "")}`;
}

function sanitizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "element";
}

// Optimized image card component
const ImageCard = memo(({ 
  url, 
  index, 
  elementName, 
  onSelect 
}: {
  url: string;
  index: number;
  elementName: string;
  onSelect: () => void;
}) => (
  <div className="group relative overflow-hidden rounded-lg border border-neutral-800/50 bg-neutral-900">
    <img 
      src={url} 
      alt={`${elementName} - Image ${index + 1}`} 
      className="aspect-square w-full object-cover" 
      loading="lazy"
      onError={(e) => {
        e.currentTarget.style.display = 'none';
      }}
    />
    
    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
      <button
        onClick={onSelect}
        className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600 transition-colors"
        title="Add this image to references"
        aria-label={`Add image ${index + 1} to references`}
      >
        <Plus className="w-4 h-4" />
      </button>
    </div>
    
    <div className="absolute top-2 right-2 bg-black/60 text-white text-xs rounded px-2 py-1">
      {index + 1}
    </div>
  </div>
));

export function ElementLibrary({ 
  projectId, 
  userId, 
  user, 
  onClose, 
  onSelectElement, 
  initialCreateDraft, 
  selectedItemId,
  imageSelectionMode = false,
  onSelectImage 
}: ElementLibraryProps) {
  // Image selection state management
  const [imageSelectionState, dispatch] = useReducer(imageSelectionReducer, {
    mode: imageSelectionMode ? 'enabled' : 'disabled',
    selectedElement: null
  });

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

  const currentEditingElement = useMemo<Element | null>(() => {
    if (!editingId) return null;

    return {
      _id: editingId,
      name: newName || "element",
      thumbnailUrl: referenceUrls[thumbnailIndex],
      referenceUrls,
      type: activeType,
      visibility,
      tags,
      description,
    };
  }, [editingId, newName, referenceUrls, thumbnailIndex, activeType, visibility, tags, description]);

  const normalizedReferenceUrls = useMemo(
    () => referenceUrls.map((url) => normalizeAssetUrl(url)).filter((url): url is string => url.length > 0),
    [referenceUrls]
  );

  const referencePreviewItems = useMemo(
    () => referenceUrls
      .map((rawUrl, originalIndex) => ({
        rawUrl,
        displayUrl: normalizeAssetUrl(rawUrl),
        originalIndex,
      }))
      .filter((item) => item.displayUrl.length > 0),
    [referenceUrls]
  );

  const validReferenceUrls = useMemo(
    () => normalizedReferenceUrls,
    [normalizedReferenceUrls]
  );

  // Memoized click handler for element selection
  const handleElementClick = useCallback((element: Element) => {
    const normalizedElementUrls = (element.referenceUrls ?? []).map((url) => normalizeAssetUrl(url)).filter((url) => url.length > 0);
    const normalizedThumbnailUrl = normalizeAssetUrl(element.thumbnailUrl);

    if (imageSelectionState.mode === 'enabled' && normalizedElementUrls.length > 1) {
      // Open image selection view for multi-image elements
      dispatch({ type: 'START_SELECTION', element });
      // Don't set editingId - just show image selections
    } else if (imageSelectionState.mode === 'selecting') {
      // User is switching to a different element while in selection mode
      if (normalizedElementUrls.length > 1) {
        // Switch to the new element's selection
        dispatch({ type: 'START_SELECTION', element });
      } else {
        // New element doesn't have multiple images, exit selection mode
        dispatch({ type: 'END_SELECTION' });
        setEditingId(null);
        // Handle as regular element selection
        onSelectElement?.(
          normalizedElementUrls.length > 0
            ? normalizedElementUrls
            : (normalizedThumbnailUrl ? [normalizedThumbnailUrl] : []),
          element.name,
          element
        );
      }
    } else {
      // Preserve existing behavior for all other cases
      onSelectElement?.(
        normalizedElementUrls.length > 0
          ? normalizedElementUrls
          : (normalizedThumbnailUrl ? [normalizedThumbnailUrl] : []),
        element.name,
        element
      );
    }
  }, [imageSelectionState.mode, onSelectElement]);

  // Memoized multi-image badge
  const MultiImageBadge = useCallback((element: Element) => {
    if ((imageSelectionState.mode !== 'enabled' && imageSelectionState.mode !== 'selecting') || !element.referenceUrls?.length) return null;
    
    return (
      <div className="absolute top-2 right-2 z-10">
        <span className="text-xs bg-(--accent-purple)/80 text-white rounded-xl px-2 py-1 font-medium backdrop-blur-sm">
          {element.referenceUrls.length} images
        </span>
      </div>
    );
  }, [imageSelectionState.mode]);

  // Custom hook for image selection logic
  const handleImageSelect = useCallback((url: string, index: number) => {
    const element = imageSelectionState.selectedElement;
    if (!element || !onSelectImage) return;
    
    try {
      onSelectImage(url, `${element.name} - Image ${index + 1}`, element);
      dispatch({ type: 'END_SELECTION' });
      setEditingId(null);
      // Close the library when user adds an image
      onClose();
    } catch (error) {
      console.error('Error selecting image:', error);
    }
  }, [imageSelectionState.selectedElement, onSelectImage, onClose]);

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
    setReferenceUrls((editingElement.referenceUrls ?? []).map((url) => normalizeAssetUrl(url)));
    setReferenceFiles([]);
    setActiveType(editingElement.type ?? "character");
    setVisibility(editingElement.visibility === "public" ? "public" : "private");
    setDescription(editingElement.description ?? "");
    setTags(editingElement.tags ?? []);
    const normalizedThumbnail = normalizeAssetUrl(editingElement.thumbnailUrl);
    const normalizedUrls = (editingElement.referenceUrls ?? []).map((url) => normalizeAssetUrl(url));
    const thumbnailUrlIndex = normalizedThumbnail ? normalizedUrls.findIndex((url) => url === normalizedThumbnail) : -1;
    setThumbnailIndex(thumbnailUrlIndex >= 0 ? thumbnailUrlIndex : 0);
    setShowCreate(true);
  }, [editingElement]);

  // Handle immediate thumbnail update
  const handleSetThumbnail = async (originalIndex: number) => {
    if (!editingId) return;
    
    const thumbnailUrl = referencePreviewItems[originalIndex]?.displayUrl;
    if (!thumbnailUrl) return;
    
    try {
      await updateElement({
        id: editingId,
        thumbnailUrl,
      });
      console.log(`[ElementLibrary] Updated thumbnail to: ${thumbnailUrl}`);
      
      // Update local state immediately
      setThumbnailIndex(originalIndex);
    } catch (error) {
      console.error("[ElementLibrary] Failed to update thumbnail:", error);
      // Still update local state for better UX
      setThumbnailIndex(originalIndex);
    }
  };

  const resetForm = () => {
    referenceUrls.forEach((url) => {
      if (url.startsWith("blob:")) {
        URL.revokeObjectURL(url);
      }
    });
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

  const uploadFile = async (file: File, filename?: string) => {
    const safeFilename = filename?.trim() || file.name?.trim() || `element-${Date.now()}.png`;
    const safeContentType = file.type?.trim() || "image/png";

    // ✅ Use companyId from component level, not hook call
    console.log("[ElementLibrary] Using companyId from component:", projectCompanyId);
    
    const sigRes = await fetch("/api/storyboard/r2-upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ 
        filename: safeFilename,
        contentType: safeContentType,
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
      headers: { "Content-Type": safeContentType },
    });
    
    // Return the publicUrl from API response, or construct it if not provided
    return normalizeAssetUrl(data.publicUrl || data.key);
  };

  const handleCreateOrUpdate = async () => {
    if (!newName.trim() || saving) return;

    setSaving(true);
    try {
      const uploadedUrls: string[] = [];

      for (const file of referenceFiles) {
        const url = await uploadFile(file, file.name);
        uploadedUrls.push(url);
      }

      const existingPersistedUrls = referenceUrls
        .filter((url): url is string => typeof url === "string" && url.trim().length > 0 && !url.startsWith("blob:"))
        .map((url) => normalizeAssetUrl(url))
        .filter((url): url is string => url.length > 0);

      const allReferenceUrls = Array.from(new Set([...existingPersistedUrls, ...uploadedUrls]));

      const persistedCountBeforeUpload = existingPersistedUrls.length;
      const nextThumbnailUrl = allReferenceUrls.length > 0
        ? (thumbnailIndex < persistedCountBeforeUpload
            ? allReferenceUrls[thumbnailIndex]
            : allReferenceUrls[persistedCountBeforeUpload + (thumbnailIndex - persistedCountBeforeUpload)] ?? allReferenceUrls[0])
        : "";

      if (editingId) {
        await updateElement({
          id: editingId,
          name: newName.trim(),
          description: description.trim(),
          referenceUrls: allReferenceUrls.length > 0 ? allReferenceUrls : [""],
          tags: tags,
          thumbnailUrl: nextThumbnailUrl,
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
          referenceUrls: allReferenceUrls.length > 0 ? allReferenceUrls : [""],
          tags: tags,
          thumbnailUrl: nextThumbnailUrl,
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
    
    // Enforce 14-image limit
    const currentCount = referenceUrls.length;
    const maxImages = 14;
    
    if (currentCount >= maxImages) {
      alert(`Maximum of ${maxImages} reference images allowed. Please remove some images first.`);
      event.target.value = "";
      return;
    }
    
    const remainingSlots = maxImages - currentCount;
    const filesToAdd = files.slice(0, remainingSlots);
    
    if (files.length > remainingSlots) {
      alert(`Only ${remainingSlots} more image${remainingSlots === 1 ? '' : 's'} can be added (maximum ${maxImages} total).`);
    }
    
    // Check for duplicates by comparing file names only
    console.log("[ElementLibrary] Checking for duplicates...");
    console.log("[ElementLibrary] Current referenceFiles:", referenceFiles.map(f => f.name));
    console.log("[ElementLibrary] Files to add:", filesToAdd.map(f => f.name));
    
    const duplicateFiles: string[] = [];
    const uniqueFilesToAdd: File[] = [];
    
    // Get existing file names from referenceFiles
    const existingFileNames = new Set(referenceFiles.map(f => f.name));
    
    console.log("[ElementLibrary] Existing file names:", Array.from(existingFileNames));
    
    for (const file of filesToAdd) {
      // Check if filename already exists
      const isDuplicate = existingFileNames.has(file.name);
      
      console.log(`[ElementLibrary] Checking file: ${file.name} - isDuplicate: ${isDuplicate}`);
      
      if (isDuplicate) {
        duplicateFiles.push(file.name);
      } else {
        uniqueFilesToAdd.push(file);
      }
    }
    
    // Alert about duplicates
    if (duplicateFiles.length > 0) {
      alert(`The following image${duplicateFiles.length === 1 ? '' : 's'} already exist${duplicateFiles.length === 1 ? 's' : ''} and will not be added:\n${duplicateFiles.join('\n')}`);
    }
    
    if (uniqueFilesToAdd.length === 0) {
      event.target.value = "";
      return;
    }
    
    setUploading(true);
    try {
      const blobUrls = uniqueFilesToAdd.map((file) => URL.createObjectURL(file));
      setReferenceUrls((prev) => [...prev, ...blobUrls]);
      setReferenceFiles((prev) => [...prev, ...uniqueFilesToAdd]);
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
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-(--bg-secondary) rounded-2xl border border-(--border-primary) shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header - LTX Design Style */}
        <div className="bg-(--bg-secondary) p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-br from-(--accent-blue) to-(--accent-teal) rounded-xl flex items-center justify-center">
                <Package className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-(--text-primary)">Element Library</h2>
                <p className="text-sm text-(--text-tertiary)">Create and manage reusable visual elements</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2.5 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200 hover:scale-105"
            >
              <X className="w-5 h-5 text-(--text-secondary)" />
            </button>
          </div>
        </div>
        
        {/* Subtle divider */}
        <div className="h-px bg-(--border-primary)" />

        <div className="p-4">
          <div className="flex gap-2 flex-wrap overflow-x-auto">
            {ELEMENT_TYPES.map(({ key, label, Icon, color }) => (
              <button
                key={key}
                onClick={() => setActiveType(key)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeType === key
                    ? "bg-(--accent-blue) text-white shadow-lg hover:shadow-xl"
                    : "bg-(--bg-primary) border border-(--border-primary) text-(--text-secondary) hover:border-(--accent-blue) hover:text-(--text-primary)"
                }`}
              >
                <Icon className={`w-4 h-4 ${activeType === key ? "text-white" : "text-(--text-secondary)"}`} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-6">
            {!elements ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-(--accent-blue)" />
              </div>
            ) : (displayElements?.length ?? 0) === 0 ? (
              <div className="flex h-52 flex-col items-center justify-center rounded-2xl border border-dashed border-(--border-primary) bg-(--bg-primary) text-center px-6">
                <div className="w-16 h-16 bg-linear-to-br from-(--accent-blue)/20 to-(--accent-teal)/20 rounded-2xl flex items-center justify-center mb-4">
                  <Sparkles className="h-8 w-8 text-(--accent-blue)" />
                </div>
                <p className="text-base font-medium text-(--text-secondary)">No {activeType} elements yet</p>
                <p className="mt-2 text-sm text-(--text-tertiary)">Create your first element to get started</p>
                <button
                  onClick={() => setShowCreate(true)}
                  className="mt-4 px-6 py-3 bg-linear-to-r from-(--accent-blue) to-(--accent-teal) text-white rounded-xl font-medium hover:from-(--accent-blue-hover) hover:to-(--accent-teal-hover) transition-all duration-200 shadow-lg hover:shadow-xl"
                >
                  Create Element
                </button>
              </div>
            ) : (
              <>
                <div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <p className="text-sm text-(--text-secondary)">{displayElements?.length ?? 0} {activeType} elements</p>
                  <div className="flex gap-3">
                    <button
                      onClick={async () => {
                        if (confirm('Remove all private unused element references from storyboard items?')) {
                          const result = await removeUnusedElements({ projectId });
                          alert(result.message);
                        }
                      }}
                      className="px-4 py-2 bg-(--color-error)/20 border border-(--color-error)/30 text-(--color-error) rounded-xl font-medium hover:bg-(--color-error)/30 transition-all duration-200 text-sm"
                      title="Clean up private unused element references from storyboard items"
                    >
                      Remove Unused
                    </button>
                    <button
                      onClick={() => setShowCreate(true)}
                      className="px-4 py-2 bg-linear-to-r from-(--accent-blue) to-(--accent-teal) text-white rounded-xl font-medium hover:from-(--accent-blue-hover) hover:to-(--accent-teal-hover) transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                    >
                      Create Element
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {displayElements?.map((element) => (
                    <div key={element._id} className="group overflow-hidden rounded-2xl border border-(--border-primary) bg-(--bg-secondary) hover:border-(--accent-blue) transition-all duration-300 hover:shadow-xl hover:shadow-(--accent-blue)/20">
                      <div
                        onClick={() => handleElementClick(element)}
                        className="block w-full text-left cursor-pointer"
                      >
                        <div className="aspect-square overflow-hidden bg-(--bg-primary) relative rounded-2xl">
                          {/* Multi-image badge */}
                          {MultiImageBadge(element)}
                          
                          {/* Type Badge in Top-Left Corner */}
                          <div className="absolute top-3 left-3 z-10">
                            <span className="text-xs bg-(--accent-blue)/80 text-white rounded-xl px-3 py-1.5 font-medium backdrop-blur-sm">
                              {element.type === 'IMG' ? 'Image' : element.type}
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
                                  <span key={index} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs flex items-center gap-1">
                                    <Hash className="w-3 h-3" />
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
                          
                          {normalizeAssetUrl(element.thumbnailUrl) ? (
                            <img 
                              src={normalizeAssetUrl(element.thumbnailUrl)} 
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
                              // Don't close the library - let user add more elements
                              // onClose();
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
            <div className="w-full max-w-md border-l border-(--border-primary) bg-(--bg-secondary) p-6">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-(--text-primary)">{editingId ? "Edit Element" : "Create Element"}</p>
                  <p className="text-sm text-(--text-tertiary) mt-1">Reference images are saved when you confirm this form.</p>
                </div>
                <button 
                  onClick={resetForm} 
                  className="p-2.5 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200 hover:scale-105"
                >
                  <X className="w-4 h-4 text-(--text-secondary)" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex border border-(--border-primary) rounded-xl p-1 bg-(--bg-primary)">
                  {[
                    { id: "basic", label: "Basic", Icon: Package },
                    { id: "details", label: "Details", Icon: FileText },
                    { id: "visibility", label: "Visibility", Icon: Globe },
                  ].map(({ id, label, Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setActiveTab(id as "basic" | "visibility" | "details")}
                      className={`flex-1 flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200 ${
                        activeTab === id
                          ? "bg-(--accent-blue) text-white shadow-lg"
                          : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)"
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                    </button>
                  ))}
                </div>

                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-2">Element Name</label>
                      <input
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Enter element name..."
                        className="w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3 text-sm text-(--text-primary) outline-none placeholder-(--text-tertiary) focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-2">Element Type</label>
                      <select
                        value={activeType}
                        onChange={(event) => setActiveType(event.target.value)}
                        className="w-full rounded-xl border border-(--border-primary) bg-(--bg-primary) px-4 py-3 text-sm text-(--text-primary) outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
                      >
                        {ELEMENT_TYPES.map((type) => (
                          <option key={type.key} value={type.key}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="flex cursor-pointer items-center justify-center gap-3 rounded-xl border border-dashed border-(--border-primary) bg-(--bg-primary) px-4 py-4 text-sm text-(--text-secondary) transition-all duration-200 hover:bg-(--bg-tertiary) hover:border-(--accent-blue)">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImagePlus className="h-4 w-4" />}
                        <span className="text-sm">Add reference images</span>
                        <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadDraftRefs} />
                      </label>
                    </div>

                    {referencePreviewItems.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <label className="block text-sm font-medium text-(--text-secondary)">Reference Images</label>
                          <span className={`text-sm ${referencePreviewItems.length >= 14 ? 'text-(--color-error)' : 'text-(--text-tertiary)'}`}>
                            {referencePreviewItems.length}/14 images
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {referencePreviewItems.map(({ rawUrl, displayUrl, originalIndex }, index) => (
                            <div key={`ref-${originalIndex}-${rawUrl}`} className={`group relative overflow-hidden rounded-xl border ${originalIndex === thumbnailIndex ? "border-(--accent-blue) ring-2 ring-(--accent-blue)/50" : "border-(--border-primary)"} bg-(--bg-primary) shrink-0`} style={{ width: "100px", height: "100px" }}>
                              <img
                                src={displayUrl}
                                alt={`Reference ${index + 1}`}
                                className="w-full h-full object-cover rounded-xl"
                                onError={(event) => {
                                  if (!displayUrl.startsWith("blob:")) {
                                    console.error("[ElementLibrary] Failed to render reference image:", displayUrl);
                                  }
                                  event.currentTarget.style.display = "none";
                                }}
                              />
                              {/* Plus button removed - no longer available in edit mode */}
                              {/* Set as primary thumbnail button - top-left */}
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleSetThumbnail(originalIndex);
                                }}
                                className="absolute top-1 left-1 rounded bg-blue-500/80 p-1 opacity-0 transition-opacity group-hover:opacity-100 hover:bg-blue-600/90"
                                title="Set as primary thumbnail"
                                aria-label={`Set image ${index + 1} as primary thumbnail`}
                              >
                                <ImagePlus className="w-3 h-3 text-white" />
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const removedUrl = referenceUrls[originalIndex];
                                  if (removedUrl?.startsWith("blob:")) {
                                    URL.revokeObjectURL(removedUrl);
                                  }
                                  setReferenceUrls((prev) => prev.filter((_, itemIndex) => itemIndex !== originalIndex));
                                  if (removedUrl?.startsWith("blob:")) {
                                    const draftBlobIndex = referenceUrls
                                      .slice(0, originalIndex + 1)
                                      .filter((item) => item.startsWith("blob:"))
                                      .length - 1;
                                    setReferenceFiles((prev) => prev.filter((_, itemIndex) => itemIndex !== draftBlobIndex));
                                  }
                                  setThumbnailIndex((prev) => {
                                    if (prev === originalIndex) return 0;
                                    if (prev > originalIndex) return prev - 1;
                                    return prev;
                                  });
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

              <div className="mt-6">
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={saving || !newName.trim()}
                  className="flex w-full items-center justify-center gap-3 rounded-xl bg-linear-to-r from-(--accent-blue) to-(--accent-teal) py-3 text-sm font-semibold text-white transition-all duration-200 hover:from-(--accent-blue-hover) hover:to-(--accent-teal-hover) disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
                >
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                  {editingId ? "Save Changes" : "Create Element"}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Image Selection Sidebar */}
        {imageSelectionState.mode === 'selecting' && imageSelectionState.selectedElement && (() => {
          const selectedElement = imageSelectionState.selectedElement;

          return (
            <>
              {/* Overlay sidebar - doesn't block the main content */}
              <div className="fixed top-0 right-0 w-80 h-full bg-(--bg-secondary) border-l border-(--border-primary) z-50 overflow-y-auto">
                <div className="p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-(--text-primary)">
                      Select Images
                    </h3>
                    <button 
                      onClick={() => {
                        dispatch({ type: 'END_SELECTION' });
                        setEditingId(null);
                      }} 
                      className="p-2.5 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200 hover:scale-105"
                    >
                      <X className="w-4 h-4 text-(--text-secondary)" />
                    </button>
                  </div>
                  
                  <div className="bg-(--bg-primary) rounded-xl p-4 border border-(--border-primary)">
                    <p className="text-sm font-medium text-(--text-primary) mb-1">{selectedElement.name}</p>
                    <p className="text-xs text-(--text-tertiary)">Click images below to select</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    {selectedElement.referenceUrls?.map((url, index) => (
                      <ImageCard
                        key={`${selectedElement._id}-${index}`}
                        url={url}
                        index={index}
                        elementName={selectedElement.name}
                        onSelect={() => handleImageSelect(url, index)}
                      />
                    ))}
                  </div>
                  
                  {/* Instructions */}
                  <div className="text-center text-xs text-(--text-tertiary)">
                    Click on any image to add it as a reference
                  </div>
                  
                  <div className="bg-(--bg-tertiary) rounded-xl p-4 border border-(--border-primary)">
                    <div className="text-center text-xs text-(--text-secondary)">
                      <div className="font-medium mb-1">💡 Want to switch elements?</div>
                      <div>Click any element in the main area</div>
                      <div className="text-(--text-tertiary) mt-1">Library closes when image is added</div>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Subtle hint overlay */}
              <div className="fixed top-4 left-4 bg-(--bg-tertiary)/90 rounded-xl px-3 py-2 text-xs text-(--text-secondary) z-40 pointer-events-none border border-(--border-primary)">
                👆 Click any element to switch
              </div>
            </>
          );
        })()}
      </div>
    </div>
  );
}
