"use client";

import { useEffect, useMemo, useState, useReducer, useCallback, memo, type ChangeEvent } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Check, Globe, ImagePlus, Image, Loader2, Lock, Package, Pencil, Sparkles, Trash2, User, Trees, Type, Palette, Shapes, Users, X, FileText, Plus, Hash, FolderOpen, Upload } from "lucide-react";
import { useCurrentCompanyId, getCurrentCompanyId, logUserInfo } from "@/lib/auth-utils";
import { uploadToR2, deleteFromR2 } from "@/lib/uploadToR2";
import { FileBrowser } from "./FileBrowser";
import { ElementForge } from "./ElementForge";
import type { ForgeElementType } from "./elementForgeConfig";

// ─── URL Helper Functions ───────────────────────────────────────────────────────
const getFileUrl = (r2Key: string): string => {
  const base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "";
  return `${base}/${r2Key}`;
};

// Enhanced Element interface
interface Element {
  _id: Id<"storyboard_elements">;
  name: string;
  thumbnailUrl?: string;
  referenceUrls?: string[];
  type: string;
  visibility?: "private" | "public" | "shared";
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
  
  console.log(`[normalizeAssetUrl] Processing URL: "${url}" -> trimmed: "${trimmed}"`);
  
  if (trimmed.startsWith("blob:")) {
    console.log(`[normalizeAssetUrl] Blob URL, returning as-is: ${trimmed}`);
    return trimmed;
  }
  if (trimmed.startsWith("http://https://")) return trimmed.replace("http://https://", "https://");
  if (trimmed.startsWith("https://https://")) return trimmed.replace("https://https://", "https://");
  if (trimmed.startsWith("http://http://")) return trimmed.replace("http://http://", "http://");
  if (trimmed.startsWith("https://http://")) return trimmed.replace("https://http://", "http://");
  if (/^https?:\/\//i.test(trimmed)) {
    console.log(`[normalizeAssetUrl] Full URL, returning as-is: ${trimmed}`);
    return trimmed;
  }
 
  // For R2 keys (like "user_.../elements/..."), use getFileUrl logic
  if (trimmed.includes("/")) {
    console.log(`[normalizeAssetUrl] R2 key detected, using getFileUrl logic: ${trimmed}`);
    const finalUrl = getFileUrl(trimmed);
    console.log(`[normalizeAssetUrl] getFileUrl result: ${finalUrl}`);
    return finalUrl;
  }
 
  const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").trim().replace(/\/$/, "");
  console.log(`[normalizeAssetUrl] Constructing URL with base: "${publicBase}" + "${trimmed}"`);
  
  if (!publicBase) {
    console.log(`[normalizeAssetUrl] No public base found, returning trimmed: ${trimmed}`);
    return trimmed;
  }
  
  const finalUrl = `${publicBase}/${trimmed.replace(/^\/+/, "")}`;
  console.log(`[normalizeAssetUrl] Final URL: ${finalUrl}`);
  
  return finalUrl;
}

function sanitizeName(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "element";
}
// Optimized image card component
const ImageCard = memo(({ 
  url, 
  index, 
  elementName, 
  onSelect,
  onAddAsReference,
  ...props 
}: {
  url: string;
  index: number;
  elementName: string;
  onSelect?: (url: string, index: number) => void;
  onAddAsReference?: (url: string, index: number, elementName: string) => void;
}) => {
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    console.error(`[ImageCard] Failed to load image:`, {
      url,
      elementName,
      index: index + 1,
      error: e.currentTarget.naturalWidth === 0 ? 'Failed to load' : 'Loaded with error'
    });
    setImageError(true);
  };

  const handleImageLoad = () => {
    console.log(`[ImageCard] Successfully loaded image:`, {
      url,
      elementName,
      index: index + 1
    });
    setImageLoaded(true);
    setImageError(false);
  };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-neutral-800/50 bg-neutral-900">
      {!imageLoaded && !imageError && (
        <div className="aspect-square w-full flex items-center justify-center bg-neutral-800">
          <div className="text-center">
            <Loader2 className="w-6 h-6 text-neutral-400 animate-spin mx-auto mb-2" />
            <p className="text-xs text-neutral-500">Loading...</p>
          </div>
        </div>
      )}
      
      {imageError && (
        <div className="aspect-square w-full flex items-center justify-center bg-neutral-800">
          <div className="text-center">
            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
              <X className="w-6 h-6 text-red-400" />
            </div>
            <p className="text-xs text-red-400">Failed to load</p>
            <p className="text-xs text-neutral-500 mt-1">Image {index + 1}</p>
          </div>
        </div>
      )}
      
      <img 
        src={url} 
        alt={`${elementName} - Image ${index + 1}`} 
        className={`aspect-square w-full object-cover transition-opacity duration-300 ${
          imageLoaded ? 'opacity-100' : 'opacity-0 absolute inset-0'
        }`}
        loading="lazy"
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{ display: imageError ? 'none' : 'block' }}
      />
      
      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
        <button
          onClick={() => {
            console.log('🔥 PLUS BUTTON CLICKED in ElementLibrary! 🔥');
            console.log('🔥 URL:', url);
            console.log('🔥 Index:', index);
            console.log('🔥 ElementName:', elementName);
            
            // Use the onAddAsReference callback if available
            if (onAddAsReference) {
              console.log('🎯 Calling onAddAsReference with:', url, index, elementName);
              onAddAsReference(url, index, elementName);
            } else if (onSelect) {
              console.log('🎯 Using fallback onSelect');
              onSelect?.(url, index);
            } else {
              console.log('❌ No callback available');
            }
          }}
          className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600 transition-colors"
          title="Add this image to references"
          aria-label={`Add image ${index + 1} to references`}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
});

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
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const deleteFileMetadata = useMutation(api.storyboard.fileMetadataHandler.deleteFileMetadata);
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
  const [showRefFileBrowser, setShowRefFileBrowser] = useState(false);
  const [forgeState, setForgeState] = useState<{ open: boolean; mode: "create" | "edit"; type: ForgeElementType; element?: any } | null>(null);
  const [visibility, setVisibility] = useState<"private" | "public" | "shared">("private");
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

    const resolvedUrls = normalizedElementUrls.length > 0
      ? normalizedElementUrls
      : (normalizedThumbnailUrl ? [normalizedThumbnailUrl] : []);

    // When linking elements to a storyboard item, always select the whole element
    if (selectedItemId) {
      onSelectElement?.(resolvedUrls, element.name, element);
      return;
    }

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
        onSelectElement?.(resolvedUrls, element.name, element);
      }
    } else {
      // Preserve existing behavior for all other cases
      onSelectElement?.(resolvedUrls, element.name, element);
    }
  }, [imageSelectionState.mode, onSelectElement, selectedItemId]);

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
  
  // ✅ AUTHENTICATION GUARD: Only make queries if we have a valid companyId
  const isAuth = projectCompanyId && projectCompanyId !== 'undefined' && projectCompanyId !== 'null';
  console.log(`[ElementLibrary] Authentication check: isAuth=${isAuth}, projectCompanyId=${projectCompanyId}`);
  
  // Query elements for this project (includes public/shared from other projects in same company)
  const elements = useQuery(isAuth ? api.storyboard.storyboardElements.listByProject : ("skip" as any), {
    projectId,
    type: activeType,
    companyId: queryCompanyId,
  } as any);

  const displayElements = elements;
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

  // 📁 FILE LOOKUP for deletion support
  // Fetch all files for this company to build a lookup for deleteFromR2
  const allStoryFiles = useQuery(api.storyboard.storyboardFiles.listByCompany, { 
    companyId: projectCompanyId || "" 
  });
  
  console.log(`[ElementLibrary] Loaded ${allStoryFiles?.length || 0} story files for companyId: ${projectCompanyId}`);
  
  const fileIdMap = useMemo(() => {
    const map = new Map<string, Id<"storyboard_files">>();
    allStoryFiles?.forEach(f => {
      if (!f.r2Key) return;
      map.set(f.r2Key, f._id);
      console.log(`[ElementLibrary] fileIdMap mapping: ${f.r2Key} -> ${f._id}`);
    });
    console.log(`[ElementLibrary] fileIdMap created with ${map.size} entries`);
    return map;
  }, [allStoryFiles]);

  // State for tracking deletion operations
  const [deletingIds, setDeletingIds] = useState<Set<Id<"storyboard_elements">>>(new Set());
  const [recentlyDeleted, setRecentlyDeleted] = useState<Set<Id<"storyboard_elements">>>(new Set());

  // State to track which reference images are being deleted
  const [deletingRefUrls, setDeletingRefUrls] = useState<Set<string>>(new Set());

  // State to track broken images
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());

  // Function to check if image exists
  const checkImageExists = async (url: string): Promise<boolean> => {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch (error) {
      return false;
    }
  };

  // Function to delete files associated with an element
  const deleteElementFiles = async (elementId: Id<"storyboard_elements">) => {
    const element = displayElements?.find(el => el._id === elementId);
    if (!element) {
      console.error(`[ElementLibrary] Element not found for deletion: ${elementId}`);
      return;
    }

    console.log(`[ElementLibrary] Deleting files for element: ${element.name} (${elementId})`);

    // Step 1: Query files by categoryId (much more efficient!)
    try {
      console.log(`[ElementLibrary] Querying files by categoryId: ${elementId}`);
      
      const filesResponse = await fetch('/api/storyboard/files-by-category', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          companyId: projectCompanyId,
          categoryId: elementId // Get all files linked to this element
        }),
      });

      if (!filesResponse.ok) {
        console.error(`[ElementLibrary] Failed to query files by categoryId: ${elementId}`);
        return;
      }

      const { files } = await filesResponse.json();
      console.log(`[ElementLibrary] Found ${files.length} files directly linked to element: ${elementId}`);

      // Log all files found for debugging
      console.log(`[ElementLibrary] All found files:`, files.map(f => ({
        filename: f.filename,
        category: f.category,
        categoryId: f.categoryId,
        r2Key: f.r2Key
      })));

      // Filter to only element files with correct categoryId
      const elementFiles = files.filter(file => file.category === 'elements' && file.categoryId === elementId);
      console.log(`[ElementLibrary] Filtered to ${elementFiles.length} element files for deletion`);

      // Step 2: Delete each file from R2 and remove metadata
      const deletePromises = elementFiles.map(async (file: any) => {
        try {
          console.log(`[ElementLibrary] Deleting element file:`, { 
            fileId: file._id, 
            r2Key: file.r2Key,
            filename: file.filename,
            category: file.category,
            categoryId: file.categoryId
          });

          // Use deleteFromR2 to remove both R2 file and metadata
          await deleteFromR2({ 
            r2Key: file.r2Key, 
            fileId: file._id,
            graceful: true 
          });
          
          console.log(`[ElementLibrary] Successfully deleted element file: ${file.filename}`);
        } catch (error) {
          console.error(`[ElementLibrary] Failed to delete file ${file.filename}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);
      console.log(`[ElementLibrary] Completed file deletion for element: ${element.name}`);

    } catch (error) {
      console.error(`[ElementLibrary] Error in file deletion process:`, error);
    }
  };

  // Safe element deletion with error handling and debouncing
  const handleDeleteElement = async (elementId: Id<"storyboard_elements">, elementName: string) => {
    // Prevent duplicate deletions
    if (deletingIds.has(elementId) || recentlyDeleted.has(elementId)) {
      console.log(`[ElementLibrary] Deletion already in progress or recently completed for: ${elementName}`);
      return;
    }

    // Add to deleting set
    setDeletingIds(prev => new Set(prev).add(elementId));

    try {
      console.log(`[ElementLibrary] Starting deletion process for element: ${elementName}`);

      // Step 1: Delete associated files from R2 and metadata
      console.log(`[ElementLibrary] Step 1: Deleting files and metadata...`);
      await deleteElementFiles(elementId);

      // Step 2: Delete the element itself
      console.log(`[ElementLibrary] Step 2: Deleting element record...`);
      await removeElement({ id: elementId });
      
      console.log(`[ElementLibrary] Successfully deleted element: ${elementName}`);
      
      // Step 3: Clean up UI state immediately
      setRecentlyDeleted(prev => new Set(prev).add(elementId));
      
      // Step 4: Close edit/create panel if the deleted element was being edited
      if (editingId === elementId) {
        console.log(`[ElementLibrary] Closing edit panel - deleted element was being edited: ${elementName}`);
        resetForm(); // This will close the create/edit panel
      }
      
      // Remove from deleting set after a short delay to ensure UI updates
      setTimeout(() => {
        setDeletingIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(elementId);
          return newSet;
        });
      }, 1000);
      
      // Remove from recently deleted set after 2 seconds
      setTimeout(() => {
        setRecentlyDeleted(prev => {
          const newSet = new Set(prev);
          newSet.delete(elementId);
          return newSet;
        });
      }, 2000);

    } catch (error) {
      console.error("[ElementLibrary] Failed to delete element:", error);
      
      // Remove from deleting set on error
      setDeletingIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(elementId);
        return newSet;
      });
      
      alert("Failed to delete element. Please try again.");
    } finally {
      // Always remove from deleting set
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
    setVisibility(editingElement.visibility === "public" ? "public" : editingElement.visibility === "shared" ? "shared" : "private");
    setDescription(editingElement.description ?? "");
    setTags(editingElement.tags ?? []);
    const normalizedThumbnail = normalizeAssetUrl(editingElement.thumbnailUrl);
    const normalizedUrls = (editingElement.referenceUrls ?? []).map((url) => normalizeAssetUrl(url));
    const thumbnailUrlIndex = normalizedThumbnail ? normalizedUrls.findIndex((url) => url === normalizedThumbnail) : -1;
    setThumbnailIndex(thumbnailUrlIndex >= 0 ? thumbnailUrlIndex : 0);
    setShowCreate(true);
  }, [editingElement]);

  // Clear form data when switching to Create mode (editingId becomes null)
  useEffect(() => {
    if (editingId === null && showCreate) {
      // We're in Create mode, clear the form
      setNewName("");
      setReferenceUrls([]);
      setReferenceFiles([]);
      setActiveType(initialType || "character");
      setVisibility("private");
      setDescription("");
      setTags([]);
      setTagInput("");
      setThumbnailIndex(0);
      setActiveTab("basic");
      console.log("[ElementLibrary] Switched to Create mode - form cleared");
    }
  }, [editingId, showCreate, initialType]);

  // Validate images when reference preview items change
  useEffect(() => {
    const validateImages = async () => {
      const validationPromises = referencePreviewItems.map(async ({ displayUrl, rawUrl }) => {
        // Skip validation if this element is being deleted
        if (deletingIds.has(editingElement?._id || '')) {
          console.log("[ElementLibrary] Skipping image validation - element is being deleted");
          return;
        }

        // Skip validation for blob URLs and already broken images
        if (!displayUrl || displayUrl.startsWith("blob:") || brokenImages.has(rawUrl)) {
          return;
        }

        // Skip validation - let the ImageCard component handle image loading
        // This prevents unnecessary network requests and CORS issues
        console.log("[ElementLibrary] Skipping validation for URL (letting ImageCard handle it):", displayUrl);
        return;
      });
      
      await Promise.allSettled(validationPromises);
    };
    
    validateImages();
  }, [referencePreviewItems, brokenImages, editingElement?.name]);

  // Handle immediate thumbnail update
  const handleSetThumbnail = async (originalIndex: number) => {
    if (!editingId) return;
    
    const thumbnailUrl = referenceUrls[originalIndex];
    if (!thumbnailUrl) return;
    
    // Normalize the URL for consistency
    const normalizedThumbnailUrl = normalizeAssetUrl(thumbnailUrl);
    
    console.log(`[ElementLibrary] Setting thumbnail:`, {
      originalIndex,
      thumbnailUrl,
      normalizedThumbnailUrl,
      editingId
    });
    
    try {
      await updateElement({
        id: editingId,
        thumbnailUrl: normalizedThumbnailUrl,
      });
      console.log(`[ElementLibrary] Successfully updated thumbnail to: ${normalizedThumbnailUrl}`);
      
      // Update local state immediately for visual feedback
      setThumbnailIndex(originalIndex);
      
      // The displayElements should update automatically through the query
      // which will update editingElement and refresh the UI
      
    } catch (error) {
      console.error("[ElementLibrary] Failed to update thumbnail:", error);
      alert("Failed to set thumbnail. Please try again.");
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
    console.log("[ElementLibrary] uploadFile called", { 
      filename: file.name, 
      fileSize: file.size,
      fileType: file.type,
      companyId: projectCompanyId,
      userId,
      projectId 
    });
    
    try {
      console.log("[ElementLibrary] Calling uploadToR2 with category: elements");
      const result = await uploadToR2({
        file,
        category: 'elements',
        userId,
        companyId: projectCompanyId || '',
        projectId: projectId as string,
      });
      
      console.log("[ElementLibrary] Upload successful:", {
        r2Key: result.r2Key,
        publicUrl: result.publicUrl,
        category: result.category,
        filename: result.filename
      });
      
      // Log upload to Convex database (matching FileBrowser pattern)
      await logUpload({
        filename: result.filename,
        fileType: result.fileType,
        r2Key: result.r2Key,
        size: result.size,
        category: result.category,
        mimeType: result.mimeType,
        companyId: projectCompanyId || '',
        uploadedBy: userId || 'unknown',
        status: 'ready',
        tags: [],
        categoryId: editingId || null, // Link to element if editing, otherwise null
      });
      
      const normalizedUrl = normalizeAssetUrl(result.publicUrl);
      console.log("[ElementLibrary] Normalized URL:", normalizedUrl);
      
      return normalizedUrl;
    } catch (error) {
      console.error("[ElementLibrary] Upload failed:", error);
      throw error;
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!newName.trim() || saving) return;

    setSaving(true);
    console.log("[ElementLibrary] handleCreateOrUpdate started", {
      elementName: newName,
      isEditing: !!editingId,
      referenceFilesCount: referenceFiles.length,
      referenceUrlsCount: referenceUrls.length
    });
    
    try {
      if (editingId) {
        // EDIT FLOW: Upload files with existing element ID
        const uploadedUrls: string[] = [];

        console.log("[ElementLibrary] Starting upload of", referenceFiles.length, "files for editing");
        for (const file of referenceFiles) {
          console.log("[ElementLibrary] Uploading file:", file.name);
          const uploadedUrl = await uploadFile(file);
          uploadedUrls.push(uploadedUrl);
          console.log("[ElementLibrary] File uploaded, URL added to array:", uploadedUrl);
        }

        console.log("[ElementLibrary] All uploads complete. Total uploaded:", uploadedUrls.length);

        const existingPersistedUrls = referenceUrls
          .filter((url): url is string => typeof url === "string" && url.trim().length > 0 && !url.startsWith("blob:"))
          .map((url) => normalizeAssetUrl(url))
          .filter((url): url is string => url.length > 0);
        
        console.log("[ElementLibrary] Existing persisted URLs:", existingPersistedUrls.length);

        const allReferenceUrls = Array.from(new Set([...existingPersistedUrls, ...uploadedUrls]));

        const persistedCountBeforeUpload = existingPersistedUrls.length;
        const nextThumbnailUrl = allReferenceUrls.length > 0
          ? (thumbnailIndex < persistedCountBeforeUpload
            ? allReferenceUrls[thumbnailIndex]
            : allReferenceUrls[persistedCountBeforeUpload + (thumbnailIndex - persistedCountBeforeUpload)] ?? allReferenceUrls[0])
          : "";

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
        
        // Create element FIRST, then upload files with correct categoryId
        console.log(`[ElementLibrary] Creating element first: ${newName}`);
        const newElement = await createElement({
          projectId,
          name: newName.trim(),
          type: activeType,
          description: description.trim(),
          referenceUrls: [], // Empty for now, will be updated after uploads
          tags: tags,
          thumbnailUrl: "", // Empty for now, will be updated after uploads
          visibility,
          createdBy: "user", // Required field
        });
        console.log(`[ElementLibrary] Created element: ${newName} with ID: ${newElement}`);

        // Now upload all files with the correct categoryId
        console.log(`[ElementLibrary] Uploading ${referenceFiles.length} files with categoryId: ${newElement}`);
        const uploadedUrls: string[] = [];
        
        for (const file of referenceFiles) {
          try {
            console.log("[ElementLibrary] Starting upload of file:", {
              fileName: file.name,
              fileSize: file.size,
              categoryId: newElement
            });

            const result = await uploadToR2({
              file,
              category: 'elements',
              userId,
              companyId: projectCompanyId || '',
              projectId: projectId as string,
            });
            
            console.log("[ElementLibrary] Upload successful:", {
              r2Key: result.r2Key,
              publicUrl: result.publicUrl,
              category: result.category,
              filename: result.filename
            });
            
            // Log upload to Convex database WITH the correct categoryId
            await logUpload({
              filename: result.filename,
              fileType: result.fileType,
              r2Key: result.r2Key,
              size: result.size,
              category: result.category,
              mimeType: result.mimeType,
              companyId: projectCompanyId || '',
              uploadedBy: userId || 'unknown',
              status: 'ready',
              tags: [],
              categoryId: newElement, // ← Direct link to new element
            });
            
            const normalizedUrl = normalizeAssetUrl(result.publicUrl);
            console.log("[ElementLibrary] Normalized URL:", normalizedUrl);
            uploadedUrls.push(normalizedUrl);
            
          } catch (error) {
            console.error("[ElementLibrary] Upload failed:", error);
            throw error;
          }
        }

        // Combine existing URLs with newly uploaded URLs
        const existingPersistedUrls = referenceUrls
          .filter((url): url is string => typeof url === "string" && url.trim().length > 0 && !url.startsWith("blob:"))
          .map((url) => normalizeAssetUrl(url))
          .filter((url): url is string => url.length > 0);
        
        const allReferenceUrls = Array.from(new Set([...existingPersistedUrls, ...uploadedUrls]));
        
        // Update the element with the correct URLs and thumbnail
        const nextThumbnailUrl = allReferenceUrls.length > 0 ? allReferenceUrls[0] : "";
        
        await updateElement({
          id: newElement,
          name: newName.trim(),
          description: description.trim(),
          referenceUrls: allReferenceUrls.length > 0 ? allReferenceUrls : [""],
          tags: tags,
          thumbnailUrl: nextThumbnailUrl,
          visibility,
        });
        
        console.log(`[ElementLibrary] Updated element with ${uploadedUrls.length} new files: ${newName}`);
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
                  onClick={() => {
                    const forgeTypes = ["character", "prop", "environment"];
                    if (forgeTypes.includes(activeType)) {
                      setForgeState({ open: true, mode: "create", type: activeType as ForgeElementType });
                    } else {
                      setShowCreate(true);
                      setEditingId(null);
                    }
                  }}
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
                      onClick={() => {
                        const forgeTypes = ["character", "prop", "environment"];
                        if (forgeTypes.includes(activeType)) {
                          setForgeState({ open: true, mode: "create", type: activeType as ForgeElementType });
                        } else {
                          setShowCreate(true);
                          setEditingId(null);
                        }
                      }}
                      className="px-4 py-2 bg-linear-to-r from-(--accent-blue) to-(--accent-teal) text-white rounded-xl font-medium hover:from-(--accent-blue-hover) hover:to-(--accent-teal-hover) transition-all duration-200 shadow-lg hover:shadow-xl text-sm"
                    >
                      Create Element
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                  {displayElements?.map((element) => {
                    console.log(`[ElementLibrary] Rendering element card:`, {
                      name: element.name,
                      _id: element._id,
                      thumbnailUrl: element.thumbnailUrl,
                      referenceUrls: element.referenceUrls,
                      referenceUrlsLength: element.referenceUrls?.length || 0
                    });
                    return (
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
                          
                          {(() => {
                            const thumbnailUrl = normalizeAssetUrl(element.thumbnailUrl);
                            const firstReferenceUrl = element.referenceUrls && element.referenceUrls.length > 0 
                              ? normalizeAssetUrl(element.referenceUrls[0]) 
                              : null;
                            const finalThumbnailUrl = thumbnailUrl || firstReferenceUrl;
                            
                            console.log(`[ElementLibrary] Rendering element ${element.name} thumbnail:`, {
                              originalThumbnailUrl: element.thumbnailUrl,
                              normalizedThumbnailUrl: thumbnailUrl,
                              firstReferenceUrl,
                              finalThumbnailUrl,
                              hasThumbnail: !!finalThumbnailUrl,
                              referenceUrlsCount: element.referenceUrls?.length || 0
                            });
                            return finalThumbnailUrl ? (
                              <img 
                                src={finalThumbnailUrl} 
                                alt={element.name} 
                                className="h-full w-full object-cover transition-transform group-hover:scale-105" 
                                onError={(e) => {
                                  console.error(`[ElementLibrary] Failed to load thumbnail for ${element.name}:`, finalThumbnailUrl);
                                  // Hide image on error to prevent empty string issues
                                  e.currentTarget.style.display = 'none';
                                  // Show fallback
                                  const parent = e.currentTarget.parentElement;
                                  if (parent) {
                                    const fallback = document.createElement('div');
                                    fallback.className = 'h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20';
                                    fallback.innerHTML = '<svg class="h-8 w-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                    parent.appendChild(fallback);
                                  }
                                }}
                                onLoad={() => {
                                  console.log(`[ElementLibrary] Successfully loaded thumbnail for ${element.name}:`, finalThumbnailUrl);
                                }}
                              />
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-gradient-to-br from-indigo-500/20 to-purple-600/20">
                                <Image className="h-8 w-8 text-indigo-400" />
                              </div>
                            );
                          })()}
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
                        <button
                          onClick={() => handleDeleteElement(element._id, element.name)}
                          className="flex items-center gap-2 text-xs text-red-400 hover:text-red-300 transition-colors"
                          title="Delete element"
                        >
                          {deletingIds.has(element._id) ? (
                            <div className="animate-spin h-4 w-4 border-2 border-gray-500 border-t-transparent rounded-full"></div>
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                        <div className="flex items-center gap-2">
                          {/* Add to storyboard item button — only shown when linking elements */}
                          {selectedItemId && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleElementClick(element);
                              }}
                              className="flex items-center gap-1.5 text-xs bg-emerald-600/80 hover:bg-emerald-600 text-white px-2.5 py-1 rounded-lg transition-colors"
                              title={`Add "${element.name}" to frame`}
                            >
                              <Plus className="w-3 h-3" />
                              Add
                            </button>
                          )}
                          <button
                            onClick={() => {
                              const forgeTypes = ["character", "prop", "environment"];
                              if (forgeTypes.includes(element.type)) {
                                setForgeState({
                                  open: true,
                                  mode: "edit",
                                  type: element.type as ForgeElementType,
                                  element,
                                });
                              } else {
                                setEditingId(element._id);
                                setShowCreate(true);
                              }
                            }}
                            className="flex items-center gap-2 text-xs text-(--accent-blue) hover:text-(--accent-blue-hover) transition-colors"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    );
                  })}
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

                    <div className="flex gap-2">
                      <label className="flex-1 flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-(--border-primary) bg-(--bg-primary) px-4 py-4 text-sm text-(--text-secondary) transition-all duration-200 hover:bg-(--bg-tertiary) hover:border-(--accent-blue)">
                        {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                        <span className="text-sm">Upload</span>
                        <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadDraftRefs} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRefFileBrowser(true)}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-dashed border-(--border-primary) bg-(--bg-primary) px-4 py-4 text-sm text-(--text-secondary) transition-all duration-200 hover:bg-(--bg-tertiary) hover:border-blue-500"
                      >
                        <FolderOpen className="h-4 w-4 text-blue-400" />
                        <span className="text-sm">R2 Browser</span>
                      </button>
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
                          {referencePreviewItems.map(({ rawUrl, displayUrl, originalIndex }, index) => {
                            const isBroken = brokenImages.has(rawUrl);
                            const isThumbnail = originalIndex === thumbnailIndex;
                            
                            // Debug logging for thumbnail selection
                            if (editingElement) {
                              const normalizedThumbnail = normalizeAssetUrl(editingElement.thumbnailUrl);
                              const normalizedDisplayUrl = normalizeAssetUrl(displayUrl);
                              const matchesByIndex = originalIndex === thumbnailIndex;
                              const matchesByUrl = normalizedThumbnail === normalizedDisplayUrl;
                              
                              if (matchesByUrl && !matchesByIndex) {
                                console.log(`[ElementLibrary] Thumbnail mismatch detected:`, {
                                  originalIndex,
                                  thumbnailIndex,
                                  matchesByIndex,
                                  matchesByUrl,
                                  normalizedThumbnail,
                                  normalizedDisplayUrl
                                });
                              }
                            }
                            
                            return (
                            <div key={`ref-${originalIndex}-${rawUrl}`} className={`group relative overflow-hidden rounded-xl border ${isThumbnail || (editingElement && normalizeAssetUrl(editingElement.thumbnailUrl) === normalizeAssetUrl(displayUrl)) ? "border-(--accent-blue) ring-2 ring-(--accent-blue)/50" : isBroken ? "border-red-500/50 bg-red-950/20" : "border-(--border-primary)"} bg-(--bg-primary) shrink-0`} style={{ width: "100px", height: "100px" }}>
                              {/* Use the same ImageCard component that works in Select Images */}
                              <ImageCard
                                url={rawUrl}
                                index={index}
                                elementName={editingElement?.name || 'Element'}
                                onSelect={() => {}} // No select action in reference images
                                onAddAsReference={(url, index, elementName) => {
                                  console.log('🎯 Adding image as reference:', { url, index, elementName });
                                  if (onSelectImage) {
                                    const mockElement = {
                                      _id: `image-${Date.now()}`,
                                      name: elementName,
                                      type: 'image',
                                      thumbnailUrl: url,
                                      referenceUrls: [url]
                                    };
                                    onSelectImage(url, `${elementName} - Image ${index + 1}`, mockElement as any);
                                    
                                    // Show success notification to user
                                    setTimeout(() => {
                                      alert(`✅ "${elementName} - Image ${index + 1}" has been added to reference images!`);
                                    }, 100);
                                  }
                                }}
                              />
                              
                              {/* Thumbnail indicator */}
                              {isThumbnail && (
                                <div className="absolute top-1 left-1 w-6 h-6 bg-(--accent-blue) rounded-full flex items-center justify-center">
                                  <span className="text-xs text-white font-bold">T</span>
                                </div>
                              )}
                              
                              {/* Set thumbnail button */}
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
                              
                              {/* Delete button */}
                              <button
                                type="button"
                                disabled={deletingRefUrls.has(rawUrl)}
                                onClick={async () => {
                                  const removedUrl = referenceUrls[originalIndex];
                                  if (!removedUrl) return;

                                  if (removedUrl.startsWith("blob:")) {
                                    // ── Draft (not yet uploaded) — just remove locally
                                    URL.revokeObjectURL(removedUrl);
                                    const newReferenceUrls = referenceUrls.filter((_, i) => i !== originalIndex);
                                    setReferenceUrls(newReferenceUrls);
                                    
                                    // Update element in database to remove the reference URL
                                    if (editingId) {
                                      try {
                                        await updateElement({
                                          id: editingId,
                                          referenceUrls: newReferenceUrls.length > 0 ? newReferenceUrls : [""],
                                          // Also update thumbnail if it was the deleted image
                                          thumbnailUrl: originalIndex === thumbnailIndex 
                                            ? (newReferenceUrls[0] || "")
                                            : normalizeAssetUrl(editingElement?.thumbnailUrl || "")
                                        });
                                        console.log(`[ElementLibrary] Updated element referenceUrls after removing draft image`);
                                      } catch (updateError) {
                                        console.error("[ElementLibrary] Failed to update element after draft image removal:", updateError);
                                      }
                                    }
                                    
                                    const draftBlobIndex = referenceUrls
                                      .slice(0, originalIndex + 1)
                                      .filter((u) => u.startsWith("blob:"))
                                      .length - 1;
                                    setReferenceFiles((prev) => prev.filter((_, i) => i !== draftBlobIndex));
                                  } else {
                                    // ── Persisted R2 URL — find the storyboard_files row and call deleteFromR2
                                    const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").replace(/\/+$/, "");
                                    const r2Key = removedUrl.replace(`${publicBase}/`, "");
                                    const fileId = fileIdMap.get(r2Key);

                                    try {
                                      setDeletingRefUrls((prev) => new Set(prev).add(rawUrl));

                                      if (fileId) {
                                        // ⚡ CANONICAL DELETE using the new utility with graceful mode
                                        try {
                                          await deleteFromR2({ r2Key, fileId, graceful: true });
                                          console.log(`[ElementLibrary] Deleted R2 file and metadata: ${r2Key}`);
                                        } catch (deleteError) {
                                          console.error(`[ElementLibrary] Metadata deletion failed for ${r2Key}, but R2 file was deleted:`, deleteError);
                                          // Continue anyway - the R2 file is deleted, just log the metadata issue
                                          console.log(`[ElementLibrary] Continuing with reference URL removal despite metadata failure`);
                                        }
                                      } else {
                                        // Fallback if no metadata row found: just delete file from R2
                                        const r2Res = await fetch('/api/storyboard/delete-file', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ r2Key }),
                                        });
                                        if (!r2Res.ok) throw new Error('R2 deletion failed');
                                        console.log(`[ElementLibrary] Deleted R2 file (no metadata): ${r2Key}`);
                                      }

                                      // Remove from local UI state
                                      const newReferenceUrls = referenceUrls.filter((_, i) => i !== originalIndex);
                                      setReferenceUrls(newReferenceUrls);
                                      
                                      // Update element in database to remove the reference URL
                                      if (editingId) {
                                        try {
                                          await updateElement({
                                            id: editingId,
                                            referenceUrls: newReferenceUrls.length > 0 ? newReferenceUrls : [""],
                                            // Also update thumbnail if it was the deleted image
                                            thumbnailUrl: originalIndex === thumbnailIndex 
                                              ? (newReferenceUrls[0] || "")
                                              : normalizeAssetUrl(editingElement?.thumbnailUrl || "")
                                          });
                                          console.log(`[ElementLibrary] Updated element referenceUrls after deletion`);
                                        } catch (updateError) {
                                          console.error("[ElementLibrary] Failed to update element after image deletion:", updateError);
                                        }
                                      }
                                    } catch (err) {
                                      console.error(`[ElementLibrary] Failed to delete image:`, err);
                                      alert(`Failed to delete image: ${err instanceof Error ? err.message : 'Unknown error'}`);
                                    } finally {
                                      setDeletingRefUrls((prev) => { const s = new Set(prev); s.delete(rawUrl); return s; });
                                    }
                                  }

                                  setThumbnailIndex((prev) => {
                                    if (prev === originalIndex) return 0;
                                    if (prev > originalIndex) return prev - 1;
                                    return prev;
                                  });
                                }}
                                className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center rounded-full bg-red-500 text-white opacity-0 transition-opacity group-hover:opacity-100 disabled:opacity-50 shadow-md hover:bg-red-600 z-20"
                                title={deletingRefUrls.has(rawUrl) ? 'Deleting…' : 'Remove image'}
                              >
                                {deletingRefUrls.has(rawUrl)
                                  ? <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                  : <X className="w-4 h-4" />
                                }
                              </button>
                            </div>
                          );
                          })}
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
                            onClick={() => setVisibility(value as "private" | "public" | "shared")}
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
                    {selectedElement.referenceUrls?.map((url, index) => {
                      console.log(`[SelectImages] Using URL: "${url}" for image ${index + 1}`);
                      return (
                        <ImageCard
                          key={`${selectedElement._id}-${index}`}
                          url={url}
                          index={index}
                          elementName={selectedElement.name}
                          onSelect={() => handleImageSelect(url, index)}
                        />
                      );
                    })}
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

      {/* R2 FileBrowser for adding reference images to elements */}
      {showRefFileBrowser && projectId && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
          <div className="w-[90vw] max-w-4xl h-[80vh]">
            <FileBrowser
              projectId={projectId}
              onClose={() => setShowRefFileBrowser(false)}
              imageSelectionMode={true}
              onSelectFile={(url, type) => {
                if (type === "image" && url) {
                  const maxImages = 14;
                  if (referenceUrls.length >= maxImages) {
                    alert(`Maximum of ${maxImages} reference images allowed.`);
                    return;
                  }
                  setReferenceUrls(prev => [...prev, url]);
                  setShowRefFileBrowser(false);
                }
              }}
            />
          </div>
        </div>
      )}

      {/* Element Forge — structured wizard for character/environment/prop */}
      {forgeState?.open && (
        <ElementForge
          mode={forgeState.mode}
          type={forgeState.type}
          projectId={projectId}
          userId={userId}
          element={forgeState.element}
          onSave={() => {
            setForgeState(null);
          }}
          onClose={() => setForgeState(null)}
        />
      )}
    </div>
  );
}
