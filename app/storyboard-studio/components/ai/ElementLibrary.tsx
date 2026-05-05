"use client";

import { useEffect, useMemo, useState, useReducer, useCallback, memo, type ChangeEvent } from "react";
import { useMutation, useQuery, useConvex } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Check, ChevronDown, Globe, ImagePlus, Image, Loader2, Lock, Package, Pencil, Sparkles, Trash2, User, Trees, Palette, Shapes, Users, X, FileText, Plus, Hash, FolderOpen, Upload, Star, LayoutGrid } from "lucide-react";
import { useCurrentCompanyId } from "@/lib/auth-utils";
import { uploadToR2, deleteFromR2 } from "@/lib/uploadToR2";
import { FileBrowser } from "./FileBrowser";
import { ElementForge } from "./ElementForge";
import { composePrompt, type ForgeElementType } from "./elementForgeConfig";

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
  identity?: Record<string, any>;
  referencePhotos?: {
    face?: string;
    outfit?: string;
    fullBody?: string;
    head?: string;
    body?: string;
  };
  variants?: { label: string; model: string; createdAt: number }[];
  primaryIndex?: number;
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
  // Element Forge → Send to Studio (only when opened from VideoImageAIPanel)
  onSendToStudio?: (prompt: string, referenceUrls: string[]) => void;
}

const ELEMENT_TYPES = [
  { key: "character", label: "Characters", Icon: User, color: "text-purple-400" },
  { key: "prop", label: "Props", Icon: Package, color: "text-blue-400" },
  { key: "environment", label: "Environment", Icon: Trees, color: "text-emerald-400" },
  { key: "logo", label: "Logos", Icon: Shapes, color: "text-pink-400" },
  { key: "style", label: "Styles", Icon: Palette, color: "text-orange-400" },
  { key: "other", label: "Other", Icon: Sparkles, color: "text-gray-300" },
] as const;

// Custom element types (simple upload-based, no wizard)
const CUSTOM_ELEMENT_TYPES = new Set(["logo", "style", "other"]);

// Per-type config for custom elements
const CUSTOM_TYPE_CONFIG: Record<string, {
  maxImages: number;
  descriptionRequired: boolean;
  descriptionPlaceholder: string;
  helpText: string;
  namePlaceholder: string;
}> = {
  logo: {
    maxImages: 5,
    descriptionRequired: false,
    descriptionPlaceholder: "Brand logo details, color scheme, usage context...",
    helpText: "Upload logo in different sizes and variations for consistent brand placement",
    namePlaceholder: "e.g. Tigers logo",
  },
  style: {
    maxImages: 10,
    descriptionRequired: false,
    descriptionPlaceholder: "Art style characteristics, medium, influences...",
    helpText: "Use diverse examples that share the same style. Avoid repeating attributes",
    namePlaceholder: "e.g. Oil painting",
  },
  other: {
    maxImages: 10,
    descriptionRequired: true,
    descriptionPlaceholder: "Describe this element and how it should be used...",
    helpText: "Upload reference images for anything: color palettes, textures, patterns, props",
    namePlaceholder: "e.g. Color palette",
  },
};

function normalizeAssetUrl(url?: string | null) {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";
  
  
  if (trimmed.startsWith("blob:")) {
    return trimmed;
  }
  if (trimmed.startsWith("http://https://")) return trimmed.replace("http://https://", "https://");
  if (trimmed.startsWith("https://https://")) return trimmed.replace("https://https://", "https://");
  if (trimmed.startsWith("http://http://")) return trimmed.replace("http://http://", "http://");
  if (trimmed.startsWith("https://http://")) return trimmed.replace("https://http://", "http://");
  if (/^https?:\/\//i.test(trimmed)) {
    return trimmed;
  }
 
  // For R2 keys (like "user_.../elements/..."), use getFileUrl logic
  if (trimmed.includes("/")) {
    const finalUrl = getFileUrl(trimmed);
    return finalUrl;
  }
 
  const publicBase = (process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? "").trim().replace(/\/$/, "");
  
  if (!publicBase) {
    return trimmed;
  }
  
  const finalUrl = `${publicBase}/${trimmed.replace(/^\/+/, "")}`;
  
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

  const handleImageError = () => { setImageError(true); };
  const handleImageLoad = () => { setImageLoaded(true); setImageError(false); };

  return (
    <div className="group relative overflow-hidden rounded-lg border border-(--border-primary) bg-(--bg-primary)">
      {!imageLoaded && !imageError && (
        <div className="aspect-square w-full flex items-center justify-center bg-(--bg-tertiary)">
          <Loader2 className="w-4 h-4 text-(--text-tertiary) animate-spin" />
        </div>
      )}

      {imageError && (
        <div className="aspect-square w-full flex items-center justify-center bg-(--bg-tertiary)">
          <X className="w-4 h-4 text-red-400" />
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
            if (onAddAsReference) {
              onAddAsReference(url, index, elementName);
            } else if (onSelect) {
              onSelect(url, index);
            }
          }}
          className="p-2 rounded-lg bg-white/15 hover:bg-white/25 text-white transition-colors"
          title="Add this image to references"
        >
          <Plus className="w-4 h-4" strokeWidth={1.75} />
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
  onSelectImage,
  onSendToStudio,
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
  const [visibilityDropdownId, setVisibilityDropdownId] = useState<Id<"storyboard_elements"> | null>(null);
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
      <div className="absolute bottom-2 right-2 z-10">
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

  const convex = useConvex();
  const project = useQuery(api.storyboard.projects.get, { id: projectId });
  const projectCompanyId = useCurrentCompanyId(); // ✅ Use hook for active organization detection
  
  const queryCompanyId = projectCompanyId;

  // Authentication guard
  const isAuth = projectCompanyId && projectCompanyId !== 'undefined' && projectCompanyId !== 'null';
  
  // Query elements for this project (includes public/shared from other projects in same company)
  const elements = useQuery(isAuth ? api.storyboard.storyboardElements.listByProject : ("skip" as any), {
    projectId,
    type: activeType,
    companyId: queryCompanyId,
  } as any);

  const displayElements = elements;

  // Pending element image files — drives loading indicator on cards
  const elementIds = (elements ?? []).map((e: Element) => e._id);
  const pendingElementFiles = useQuery(
    api.storyboard.storyboardFiles.listPendingElementFiles,
    elementIds.length > 0 ? { elementIds } : "skip"
  );
  const pendingElementIdSet = new Set((pendingElementFiles ?? []).map((f: any) => f.categoryId));

  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const updateElement = useMutation(api.storyboard.storyboardElements.update);
  const removeElement = useMutation(api.storyboard.storyboardElements.remove);
  const setPrimaryVariant = useMutation(api.storyboard.storyboardElements.setPrimaryVariant);
  const updateVariantLabel = useMutation(api.storyboard.storyboardElements.updateVariantLabel);
  
  // Toggle element visibility
  const toggleElementVisibility = async (elementId: Id<"storyboard_elements">, currentVisibility: "private" | "public") => {
    try {
      const newVisibility = currentVisibility === "private" ? "public" : "private";
      await updateElement({
        id: elementId,
        visibility: newVisibility,
      });
    } catch (error) {
      console.error("[ElementLibrary] Failed to toggle visibility:", error);
    }
  };

  // 📁 FILE LOOKUP for deletion support — looked up on-demand (not a live subscription)
  const lookupFileIdByR2Key = async (r2Key: string): Promise<Id<"storyboard_files"> | undefined> => {
    const file = await convex.query(api.storyboard.storyboardFiles.getByR2Key, { r2Key });
    return file?._id;
  };

  // State for tracking deletion operations
  const [deletingIds, setDeletingIds] = useState<Set<Id<"storyboard_elements">>>(new Set());
  const [recentlyDeleted, setRecentlyDeleted] = useState<Set<Id<"storyboard_elements">>>(new Set());

  // State for tracking element image generation
  const [generatingIds, setGeneratingIds] = useState<Set<Id<"storyboard_elements">>>(new Set());

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

  // Reference sheet prompt templates per element type
  const REFERENCE_SHEET_TEMPLATES: Record<string, string> = {
    character: `Create a photorealistic character identity sheet. Layout: 2/3 area full-body views (front, left-profile 90°, right-profile 90°, back 180°, 3/4 ~45°), 1/3 area detail panels (eyes, face, skin, hair, clothing). Single character only, all views same scale, studio lighting, ultra-realistic. Character: {description}`,
    environment: `Cinematic establishing shot of {description}. Photorealistic, high detail, atmospheric lighting, wide-angle composition.`,
    prop: `Product photography of {description}. Clean dark studio background, studio lighting, high detail, multiple angles showing key features.`,
  };

  // Generate reference image for an element
  const handleGenerateElement = useCallback(async (element: Element, variantLabel?: string) => {
    if (generatingIds.has(element._id)) return;
    if (!projectCompanyId || !userId) return;

    const forgeTypes: ForgeElementType[] = ["character", "environment", "prop"];
    const elType = element.type as ForgeElementType;

    // Compose the description from identity or fall back to element.description
    let description = element.description || element.name;
    if (forgeTypes.includes(elType) && element.identity) {
      description = composePrompt(elType, { name: element.name, ...element.identity });
    }

    // Merge into the reference sheet template
    const template = REFERENCE_SHEET_TEMPLATES[element.type] || REFERENCE_SHEET_TEMPLATES.prop;
    const prompt = template.replace(/\{description\}/g, description);

    // Determine reference images from referencePhotos
    const rp = element.referencePhotos;
    const referenceImageUrls: string[] = [];
    if (rp) {
      if (rp.fullBody) {
        // Full body takes priority
        referenceImageUrls.push(rp.fullBody);
      } else {
        // Human: face + outfit, Non-human: head + body
        if (rp.face) referenceImageUrls.push(rp.face);
        if (rp.outfit) referenceImageUrls.push(rp.outfit);
        if (rp.head) referenceImageUrls.push(rp.head);
        if (rp.body) referenceImageUrls.push(rp.body);
      }
    }

    const hasRefs = referenceImageUrls.length > 0;
    const isNonHuman = element.identity?.isNonHuman;

    // Smart model selection: GPT Image 2 (default), Nana Banana 2 for stylized/non-human
    const model = hasRefs
      ? 'gpt-image-2-image-to-image'
      : 'gpt-image-2-text-to-image';
    const mode = hasRefs ? 'image-to-image' : 'text-to-image';

    setGeneratingIds(prev => new Set(prev).add(element._id));
    setGenRefCounts(prev => new Map(prev).set(element._id as string, element.referenceUrls?.length ?? 0));
    try {
      const res = await fetch('/api/storyboard/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sceneContent: prompt,
          model,
          style: 'realistic',
          quality: JSON.stringify({ type: 'gpt-image-2', mode }),
          aspectRatio: '16:9',
          companyId: projectCompanyId,
          userId,
          projectId: projectId as string,
          elementId: element._id,
          enhance: false,
          referenceImageUrls: hasRefs ? referenceImageUrls : undefined,
          variantLabel: variantLabel || `Variant ${(element.referenceUrls?.length ?? 0) + 1}`,
          variantModel: model,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Generation failed');
      }
      const data = await res.json();
    } catch (error: any) {
      console.error('[ElementLibrary] Generation failed:', error);
      setGeneratingIds(prev => {
        const next = new Set(prev);
        next.delete(element._id);
        return next;
      });
      alert(error.message || 'Failed to generate image');
    }
  }, [generatingIds, projectCompanyId, userId, projectId]);

  // Track reference counts at generation start to detect changes
  const [genRefCounts, setGenRefCounts] = useState<Map<string, number>>(new Map());

  // Clear generating state when element's referenceUrls change (via Convex reactivity)
  useEffect(() => {
    if (!displayElements) return;
    setGeneratingIds(prev => {
      const next = new Set(prev);
      let changed = false;
      for (const id of prev) {
        const el = displayElements.find(e => e._id === id);
        if (!el) continue;
        const currentCount = el.referenceUrls?.length ?? 0;
        const startCount = genRefCounts.get(id as string) ?? 0;
        if (currentCount > startCount) {
          next.delete(id);
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [displayElements, genRefCounts]);

  // Function to delete files associated with an element
  const deleteElementFiles = async (elementId: Id<"storyboard_elements">) => {
    const element = displayElements?.find(el => el._id === elementId);
    if (!element) {
      console.error(`[ElementLibrary] Element not found for deletion: ${elementId}`);
      return;
    }
    // Step 1: Query files by categoryId (much more efficient!)
    try {
      
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

      // Filter to only element files with correct categoryId
      const elementFiles = files.filter(file => file.category === 'elements' && file.categoryId === elementId);

      // Step 2: Delete each file from R2 and remove metadata
      const deletePromises = elementFiles.map(async (file: any) => {
        if (!file.r2Key || !file._id) return;
        try {
          await deleteFromR2({
            r2Key: file.r2Key,
            fileId: file._id,
            graceful: true
          });
          
        } catch (error) {
          console.error(`[ElementLibrary] Failed to delete file ${file.filename}:`, error);
        }
      });

      await Promise.allSettled(deletePromises);

    } catch (error) {
      console.error(`[ElementLibrary] Error in file deletion process:`, error);
    }
  };

  // Safe element deletion with error handling and debouncing
  const handleDeleteElement = async (elementId: Id<"storyboard_elements">, elementName: string) => {
    // Prevent duplicate deletions
    if (deletingIds.has(elementId) || recentlyDeleted.has(elementId)) {
      return;
    }

    // Add to deleting set
    setDeletingIds(prev => new Set(prev).add(elementId));

    try {

      // Step 1: Delete associated files from R2 and metadata
      await deleteElementFiles(elementId);

      // Step 2: Delete the element itself (also cleans up linked storyboard_files metadata)
      const result = await removeElement({ id: elementId });

      // Step 2b: Clean up R2 files from URLs stored directly on the element
      // (thumbnailUrl, referenceUrls that may not have been linked via categoryId)
      if (result?.urlsToClean?.length) {
        const r2Base = process.env.NEXT_PUBLIC_R2_PUBLIC_URL;
        if (r2Base) {
          const cleanups = result.urlsToClean
            .filter((url: string) => url.startsWith(r2Base))
            .map((url: string) => {
              const r2Key = url.slice(r2Base.length + 1);
              return fetch("/api/storyboard/delete-file", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ r2Key }),
              }).catch(() => {}); // Non-blocking
            });
          await Promise.allSettled(cleanups);
        }
      }

      
      // Step 3: Clean up UI state immediately
      setRecentlyDeleted(prev => new Set(prev).add(elementId));
      
      // Step 4: Close edit/create panel if the deleted element was being edited
      if (editingId === elementId) {
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
      // We're in Create mode, clear the form but keep activeType (user's current tab)
      setNewName("");
      setReferenceUrls([]);
      setReferenceFiles([]);
      setVisibility("private");
      setDescription("");
      setTags([]);
      setTagInput("");
      setThumbnailIndex(0);
      setActiveTab("basic");
    }
  }, [editingId, showCreate]);

  // Validate images when reference preview items change
  useEffect(() => {
    const validateImages = async () => {
      const validationPromises = referencePreviewItems.map(async ({ displayUrl, rawUrl }) => {
        // Skip validation if this element is being deleted
        if (deletingIds.has(editingElement?._id || '')) {
          return;
        }

        // Skip validation for blob URLs and already broken images
        if (!displayUrl || displayUrl.startsWith("blob:") || brokenImages.has(rawUrl)) {
          return;
        }

        // Skip validation - let the ImageCard component handle image loading
        // This prevents unnecessary network requests and CORS issues
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

    try {
      await updateElement({
        id: editingId,
        thumbnailUrl: normalizedThumbnailUrl,
      });
      
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
    try {
      const result = await uploadToR2({
        file,
        category: 'elements',
        userId,
        companyId: projectCompanyId || '',
        projectId: projectId as string,
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
      
      return normalizedUrl;
    } catch (error) {
      console.error("[ElementLibrary] Upload failed:", error);
      throw error;
    }
  };

  const handleCreateOrUpdate = async () => {
    if (!newName.trim() || saving) return;
    // Custom type validation: require description for "other"
    if (CUSTOM_TYPE_CONFIG[activeType]?.descriptionRequired && !description.trim()) {
      alert("Please add a description for this element.");
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        // EDIT FLOW: Upload files with existing element ID
        const uploadedUrls: string[] = [];

        for (const file of referenceFiles) {
          const uploadedUrl = await uploadFile(file);
          uploadedUrls.push(uploadedUrl);
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

        await updateElement({
          id: editingId,
          name: newName.trim(),
          description: description.trim(),
          referenceUrls: allReferenceUrls.length > 0 ? allReferenceUrls : [""],
          tags: tags,
          thumbnailUrl: nextThumbnailUrl,
          visibility,
        });
      } else {
        if (activeType === 'environment') {
          alert("Environment elements are generated from Build Storyboard. Use Enhanced Build with Regenerate Elements to create smart environments.");
          setSaving(false);
          return;
        }
        
        // Create element FIRST, then upload files with correct categoryId
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

        // Now upload all files with the correct categoryId
        const uploadedUrls: string[] = [];
        
        for (const file of referenceFiles) {
          try {
            const result = await uploadToR2({
              file,
              category: 'elements',
              userId,
              companyId: projectCompanyId || '',
              projectId: projectId as string,
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
    
    const duplicateFiles: string[] = [];
    const uniqueFilesToAdd: File[] = [];
    
    // Get existing file names from referenceFiles
    const existingFileNames = new Set(referenceFiles.map(f => f.name));
    
    
    for (const file of filesToAdd) {
      // Check if filename already exists
      const isDuplicate = existingFileNames.has(file.name);
      
      
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
    <div className="fixed inset-0 bg-black/70 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-(--bg-secondary)/98 backdrop-blur-xl rounded-2xl border border-(--border-primary) shadow-2xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 pt-5 pb-0">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-[15px] font-semibold text-(--text-primary)">Element Library</h2>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
              <X className="w-5 h-5 text-(--text-secondary)" strokeWidth={1.75} />
            </button>
          </div>

          {/* Category tabs — underline style */}
          <div className="flex items-center gap-1 border-b border-white/6">
            {ELEMENT_TYPES.map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => {
                  setActiveType(key);
                  // Close edit/create panel whenever switching tabs
                  if (showCreate || editingId) {
                    setShowCreate(false);
                    setEditingId(null);
                  }
                }}
                className={`flex items-center gap-1.5 px-3.5 py-2.5 text-[12px] font-medium transition-all duration-200 border-b-2 -mb-px ${
                  activeType === key
                    ? "text-(--text-primary) border-white"
                    : "text-(--text-tertiary) hover:text-(--text-secondary) border-transparent"
                }`}
              >
                <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {!elements ? (
              <div className="flex h-40 items-center justify-center">
                <Loader2 className="h-5 w-5 animate-spin text-(--accent-blue)" />
              </div>
            ) : (displayElements?.length ?? 0) === 0 ? (
              <div className="flex h-48 flex-col items-center justify-center text-center">
                <Sparkles className="h-6 w-6 text-(--text-tertiary) mb-3" strokeWidth={1.75} />
                <p className="text-[13px] font-medium text-(--text-secondary)">No {activeType} elements yet</p>
                <p className="mt-1 text-[12px] text-(--text-tertiary)">Create your first element to get started</p>
                <button
                  onClick={() => {
                    const forgeTypes = ["character", "prop", "environment"];
                    if (forgeTypes.includes(activeType)) {
                      setForgeState({ open: true, mode: "create", type: activeType as ForgeElementType });
                    } else {
                      setActiveType(activeType);
                      setShowCreate(true);
                      setEditingId(null);
                    }
                  }}
                  className="mt-4 flex items-center gap-2 px-5 py-2 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white rounded-lg text-[13px] font-medium transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                  {CUSTOM_ELEMENT_TYPES.has(activeType)
                    ? `Create ${ELEMENT_TYPES.find(t => t.key === activeType)?.label.replace(/s$/, '') || "Element"}`
                    : "Create Element"}
                </button>
              </div>
            ) : (
              <>
                {/* Action bar */}
                <div className="mb-4 flex items-center justify-between">
                  <p className="text-[12px] text-(--text-tertiary)">{displayElements?.length ?? 0} {activeType} elements</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={async () => {
                        if (confirm('Remove all private unused element references from storyboard items?')) {
                          const result = await removeUnusedElements({ projectId });
                          alert(result.message);
                        }
                      }}
                      className="px-3 py-1.5 text-[12px] font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
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
                          setActiveType(activeType);
                          setShowCreate(true);
                          setEditingId(null);
                        }
                      }}
                      className="flex items-center gap-1.5 px-4 py-1.5 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-white rounded-lg text-[12px] font-medium transition-colors"
                    >
                      <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                      {CUSTOM_ELEMENT_TYPES.has(activeType)
                        ? `Create ${ELEMENT_TYPES.find(t => t.key === activeType)?.label.replace(/s$/, '') || "Element"}`
                        : "Create Element"}
                    </button>
                  </div>
                </div>

                {/* Element grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {displayElements?.map((element) => (
                    <div key={element._id} className="group relative rounded-xl border border-(--border-primary) bg-(--bg-primary) overflow-hidden hover:border-(--border-secondary) transition-all duration-200">
                      <div
                        onClick={() => handleElementClick(element)}
                        className="block w-full text-left cursor-pointer"
                      >
                        {/* Image area */}
                        <div className="aspect-[4/3] overflow-hidden bg-(--bg-primary) relative">
                          {/* Generating overlay */}
                          {generatingIds.has(element._id) && (
                            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm">
                              <Loader2 className="h-6 w-6 text-amber-400 animate-spin mb-1.5" />
                              <p className="text-[10px] text-amber-300 font-medium">Generating...</p>
                            </div>
                          )}

                          {/* Type badge — top left */}
                          <div className="absolute top-2 left-2 z-10">
                            <span className="text-[9px] font-semibold uppercase tracking-wide bg-black/50 text-white/90 rounded-md px-1.5 py-0.5 backdrop-blur-sm">
                              {element.type}
                            </span>
                          </div>

                          {/* Visibility badge — top right */}
                          <div className="absolute top-2 right-2 z-10">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setVisibilityDropdownId(visibilityDropdownId === element._id ? null : element._id);
                              }}
                              className={`flex items-center gap-0.5 text-[9px] rounded-md px-1.5 py-0.5 transition-colors cursor-pointer backdrop-blur-sm ${
                                element.visibility === "public"
                                  ? "bg-emerald-500/70 text-white"
                                  : "bg-black/50 text-white/70"
                              }`}
                            >
                              {element.visibility === "public" ? <Globe className="w-2.5 h-2.5" /> : <Lock className="w-2.5 h-2.5" />}
                              {element.visibility === "public" ? "Public" : "Private"}
                              <ChevronDown className="w-2 h-2" />
                            </button>
                            {visibilityDropdownId === element._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={(e) => { e.stopPropagation(); setVisibilityDropdownId(null); }} />
                                <div className="absolute top-full right-0 mt-1 z-50 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl py-1 w-[120px]">
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (element.visibility !== "private") toggleElementVisibility(element._id, element.visibility || "private");
                                      setVisibilityDropdownId(null);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${
                                      element.visibility === "private" ? "text-(--text-primary) bg-white/8" : "text-(--text-secondary) hover:bg-white/5"
                                    }`}
                                  >
                                    <Lock className="w-3 h-3" strokeWidth={1.75} /> Private
                                  </button>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      if (element.visibility !== "public") toggleElementVisibility(element._id, element.visibility || "private");
                                      setVisibilityDropdownId(null);
                                    }}
                                    className={`w-full flex items-center gap-2 px-3 py-1.5 text-[11px] transition-colors ${
                                      element.visibility === "public" ? "text-(--text-primary) bg-white/8" : "text-(--text-secondary) hover:bg-white/5"
                                    }`}
                                  >
                                    <Globe className="w-3 h-3" strokeWidth={1.75} /> Public
                                  </button>
                                </div>
                              </>
                            )}
                          </div>

                          {/* Multi-image badge */}
                          {MultiImageBadge(element)}

                          {/* Identity Sheet badge */}
                          {element.variants?.some(v => v.label === "Identity Sheet") && (
                            <div className="absolute top-2 left-2 z-10">
                              <span className="flex items-center gap-1 text-[10px] bg-amber-500/80 text-white rounded-xl px-1.5 py-0.5 font-medium backdrop-blur-sm">
                                <LayoutGrid className="w-2.5 h-2.5" />
                                Sheet
                              </span>
                            </div>
                          )}

                          {(() => {
                            const thumbnailUrl = normalizeAssetUrl(element.thumbnailUrl);
                            const refs = element.referenceUrls ?? [];
                            const primaryIdx = (element as any).primaryIndex ?? 0;
                            const primaryReferenceUrl = refs.length > 0
                              ? normalizeAssetUrl(refs[primaryIdx] ?? refs[0])
                              : null;
                            const firstReferenceUrl = refs.length > 0 ? normalizeAssetUrl(refs[0]) : null;
                            const finalThumbnailUrl = thumbnailUrl || primaryReferenceUrl || firstReferenceUrl;
                            const isGenerating = pendingElementIdSet.has(String(element._id));

                            return isGenerating && !finalThumbnailUrl ? (
                              <div className="h-full w-full flex flex-col items-center justify-center gap-1.5 bg-(--bg-tertiary)">
                                <Loader2 className="h-5 w-5 text-blue-400 animate-spin" strokeWidth={1.75} />
                                <span className="text-[10px] text-blue-400/80">Generating…</span>
                              </div>
                            ) : finalThumbnailUrl ? (
                              <>
                                <img
                                  src={finalThumbnailUrl}
                                  alt={element.name}
                                  className={`h-full w-full object-cover transition-transform duration-300 group-hover:scale-105 ${isGenerating ? "opacity-50" : ""}`}
                                  onError={(e) => {
                                    const img = e.currentTarget;
                                    // Try primary reference as fallback before giving up
                                    if (primaryReferenceUrl && img.src !== primaryReferenceUrl) {
                                      img.src = primaryReferenceUrl;
                                      return;
                                    }
                                    if (firstReferenceUrl && img.src !== firstReferenceUrl) {
                                      img.src = firstReferenceUrl;
                                      return;
                                    }
                                    img.style.display = 'none';
                                    const parent = img.parentElement;
                                    if (parent) {
                                      const fallback = document.createElement('div');
                                      fallback.className = 'h-full w-full flex items-center justify-center';
                                      fallback.style.background = 'var(--bg-tertiary)';
                                      fallback.innerHTML = '<svg class="h-6 w-6" style="color:var(--text-tertiary)" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.75" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>';
                                      parent.appendChild(fallback);
                                    }
                                  }}
                                />
                                {isGenerating && (
                                  <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1.5 pointer-events-none">
                                    <Loader2 className="w-5 h-5 text-blue-400 animate-spin" strokeWidth={2} />
                                    <span className="text-[10px] font-medium text-blue-300">Generating…</span>
                                  </div>
                                )}
                              </>
                            ) : (
                              <div className="h-full w-full flex items-center justify-center bg-(--bg-tertiary)">
                                <Image className="h-6 w-6 text-(--text-tertiary)" strokeWidth={1.75} />
                              </div>
                            );
                          })()}

                          {/* Hover overlay with actions */}
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 z-10">
                            {selectedItemId && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleElementClick(element); }}
                                className="p-2 bg-emerald-500/80 rounded-lg hover:bg-emerald-500 text-white transition-colors"
                                title={`Add "${element.name}" to frame`}
                              >
                                <Plus className="w-4 h-4" strokeWidth={2} />
                              </button>
                            )}
                            {!["character", "prop", "environment"].includes(element.type) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditingId(element._id);
                                  setShowCreate(true);
                                }}
                                className="p-2 bg-white/15 rounded-lg hover:bg-white/25 text-white transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-3.5 h-3.5" strokeWidth={1.75} />
                              </button>
                            )}
                            {["character", "prop", "environment"].includes(element.type) && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setForgeState({ open: true, mode: "edit", type: element.type as ForgeElementType, element });
                                }}
                                className="p-2 bg-purple-500/30 rounded-lg hover:bg-purple-500/50 text-white transition-colors"
                                title="Open in Element Forge"
                              >
                                <Sparkles className="w-3.5 h-3.5" strokeWidth={1.75} />
                              </button>
                            )}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleDeleteElement(element._id, element.name); }}
                              className="p-2 bg-red-500/20 rounded-lg hover:bg-red-500/40 text-white transition-colors"
                              title="Delete"
                            >
                              {deletingIds.has(element._id) ? (
                                <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" strokeWidth={1.75} />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Card info */}
                        <div className="px-3 py-2.5">
                          <p className="truncate text-[13px] font-medium text-(--text-primary) leading-tight">{element.name}</p>
                          {element.description && (
                            <p className="text-[11px] text-(--text-tertiary) mt-0.5 line-clamp-1">{element.description}</p>
                          )}
                          {/* Variant badge */}
                          {(element.referenceUrls?.length ?? 0) > 1 && (
                            <span className="inline-flex items-center gap-1 mt-1.5 px-1.5 py-0.5 rounded-md bg-amber-400/10 text-[9px] font-semibold text-amber-300">
                              <Star size={8} className="fill-amber-400 text-amber-400" />
                              {element.referenceUrls!.length} variants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
             </>
           )}
         </div>

          {showCreate && (
            <div className="w-full max-w-sm border-l border-(--border-primary) bg-(--bg-secondary) overflow-y-auto">
              {/* Side panel header */}
              <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/6">
                <p className="text-[13px] font-semibold text-(--text-primary)">
                  {editingId ? "Edit" : "Create"} {CUSTOM_ELEMENT_TYPES.has(activeType)
                    ? ELEMENT_TYPES.find(t => t.key === activeType)?.label.replace(/s$/, '') || "Element"
                    : "Element"}
                </p>
                <button onClick={resetForm} className="p-1.5 hover:bg-white/5 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                </button>
              </div>

              <div className="px-5 py-4 space-y-4">
                {/* Tabs — only show for non-custom types (character/prop/env editing) */}
                {!CUSTOM_ELEMENT_TYPES.has(activeType) && (
                  <div className="flex items-center gap-1 border-b border-white/6">
                    {[
                      { id: "basic", label: "Basic" },
                      { id: "details", label: "Details" },
                      { id: "visibility", label: "Visibility" },
                    ].map(({ id, label }) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setActiveTab(id as "basic" | "visibility" | "details")}
                        className={`px-3 py-2 text-[12px] font-medium transition-all border-b-2 -mb-px ${
                          activeTab === id
                            ? "text-(--text-primary) border-white"
                            : "text-(--text-tertiary) hover:text-(--text-secondary) border-transparent"
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}

                {/* ── Custom element form (logo/style/other) — single clean form, no tabs ── */}
                {CUSTOM_ELEMENT_TYPES.has(activeType) ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Name *</label>
                      <input
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder={CUSTOM_TYPE_CONFIG[activeType]?.namePlaceholder || "Enter element name..."}
                        className="w-full rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2.5 text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors"
                      />
                    </div>

                    <p className="text-[11px] text-(--text-tertiary) leading-relaxed bg-white/3 rounded-lg px-3 py-2">
                      {CUSTOM_TYPE_CONFIG[activeType]?.helpText}
                    </p>

                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">
                        Description{CUSTOM_TYPE_CONFIG[activeType]?.descriptionRequired ? " *" : ""}
                      </label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder={CUSTOM_TYPE_CONFIG[activeType]?.descriptionPlaceholder || "Describe this element..."}
                        rows={2}
                        className="w-full rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2.5 text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors resize-none"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Source Images</label>
                      <button
                        type="button"
                        onClick={() => setShowRefFileBrowser(true)}
                        className="w-full flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-(--border-primary) bg-(--bg-primary) px-3 py-3 text-[12px] text-(--text-secondary) transition-colors hover:bg-white/3 hover:border-white/15"
                      >
                        <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Browse & Upload Images
                      </button>
                    </div>

                    {referencePreviewItems.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">References</label>
                          <span className={`text-[11px] ${referencePreviewItems.length >= (CUSTOM_TYPE_CONFIG[activeType]?.maxImages || 14) ? 'text-red-400' : 'text-(--text-tertiary)'}`}>
                            {referencePreviewItems.length}/{CUSTOM_TYPE_CONFIG[activeType]?.maxImages || 14}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-3">
                          {referencePreviewItems.map(({ rawUrl, displayUrl, originalIndex }, index) => {
                            const isBroken = brokenImages.has(rawUrl);
                            const isThumbnail = originalIndex === thumbnailIndex;

                            return (
                            <div key={`ref-${originalIndex}-${rawUrl}`} className={`group relative overflow-hidden rounded-xl border ${isThumbnail || (editingElement && normalizeAssetUrl(editingElement.thumbnailUrl) === normalizeAssetUrl(displayUrl)) ? "border-(--accent-blue) ring-2 ring-(--accent-blue)/50" : isBroken ? "border-red-500/50 bg-red-950/20" : "border-(--border-primary)"} bg-(--bg-primary) shrink-0`} style={{ width: "100px", height: "100px" }}>
                              {/* Use the same ImageCard component that works in Select Images */}
                              <ImageCard
                                url={rawUrl}
                                index={index}
                                elementName={editingElement?.name || 'Element'}
                                onSelect={() => {}} // No select action in reference images
                                onAddAsReference={(url, index, elementName) => {
                                  if (onSelectImage) {
                                    const mockElement = {
                                      _id: `image-${Date.now()}`,
                                      name: elementName,
                                      type: 'image',
                                      thumbnailUrl: url,
                                      referenceUrls: [url]
                                    };
                                    onSelectImage(url, `${elementName} - Image ${index + 1}`, mockElement as any);
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
                                    const fileId = await lookupFileIdByR2Key(r2Key);

                                    try {
                                      setDeletingRefUrls((prev) => new Set(prev).add(rawUrl));

                                      if (fileId) {
                                        // ⚡ CANONICAL DELETE using the new utility with graceful mode
                                        try {
                                          await deleteFromR2({ r2Key, fileId, graceful: true });
                                        } catch (deleteError) {
                                          console.error(`[ElementLibrary] Metadata deletion failed for ${r2Key}, but R2 file was deleted:`, deleteError);
                                          // Continue anyway - the R2 file is deleted, just log the metadata issue
                                        }
                                      } else {
                                        // Fallback if no metadata row found: just delete file from R2
                                        const r2Res = await fetch('/api/storyboard/delete-file', {
                                          method: 'POST',
                                          headers: { 'Content-Type': 'application/json' },
                                          body: JSON.stringify({ r2Key }),
                                        });
                                        if (!r2Res.ok) throw new Error('R2 deletion failed');
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
                    {/* Visibility toggle — inline for custom types */}
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">Visibility</span>
                      <button
                        type="button"
                        onClick={() => setVisibility(visibility === "private" ? "public" : "private")}
                        className="flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium bg-white/5 text-(--text-secondary) hover:bg-white/8 transition-colors"
                      >
                        {visibility === "private" ? <Lock className="w-3 h-3" strokeWidth={1.75} /> : <Globe className="w-3 h-3" strokeWidth={1.75} />}
                        {visibility === "private" ? "Private" : "Public"}
                      </button>
                    </div>
                  </div>
                ) : (
                  /* ── Standard element form (character/prop/env) — tabbed ── */
                  <>

                {activeTab === "basic" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Name</label>
                      <input
                        value={newName}
                        onChange={(event) => setNewName(event.target.value)}
                        placeholder="Enter element name..."
                        className="w-full rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2.5 text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Type</label>
                      <select
                        value={activeType}
                        onChange={(event) => setActiveType(event.target.value)}
                        className="w-full rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2.5 text-[13px] text-(--text-primary) outline-none focus:border-(--accent-blue)/40 transition-colors"
                      >
                        {ELEMENT_TYPES.map((type) => (
                          <option key={type.key} value={type.key}>{type.label}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex gap-2">
                      <label className="flex-1 flex cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-dashed border-(--border-primary) bg-(--bg-primary) px-3 py-3 text-[12px] text-(--text-secondary) transition-colors hover:bg-white/3 hover:border-white/15">
                        {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" strokeWidth={1.75} />}
                        Upload
                        <input className="hidden" type="file" accept="image/*" multiple onChange={handleUploadDraftRefs} />
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowRefFileBrowser(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-(--border-primary) bg-(--bg-primary) px-3 py-3 text-[12px] text-(--text-secondary) transition-colors hover:bg-white/3 hover:border-white/15"
                      >
                        <FolderOpen className="h-3.5 w-3.5" strokeWidth={1.75} />
                        Browse
                      </button>
                    </div>

                    {referencePreviewItems.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary)">References</label>
                          <span className={`text-[11px] ${referencePreviewItems.length >= 14 ? 'text-red-400' : 'text-(--text-tertiary)'}`}>
                            {referencePreviewItems.length}/14
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === "visibility" && (
                  <div className="space-y-3">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Visibility</label>
                      <div className="grid grid-cols-2 gap-2">
                        {[
                          { value: "private", label: "Private", Icon: Lock },
                          { value: "public", label: "Public", Icon: Globe },
                        ].map(({ value, label, Icon }) => (
                          <button
                            key={value}
                            type="button"
                            onClick={() => setVisibility(value as "private" | "public" | "shared")}
                            className={`flex items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-[12px] font-medium transition-all ${
                              visibility === value
                                ? "bg-white/10 border-white/15 text-(--text-primary)"
                                : "border-(--border-primary) text-(--text-tertiary) hover:bg-white/5 hover:text-(--text-secondary)"
                            }`}
                          >
                            <Icon className="w-3.5 h-3.5" strokeWidth={1.75} />
                            {label}
                          </button>
                        ))}
                      </div>
                      <p className="mt-1.5 text-[10px] text-(--text-tertiary)">
                        {visibility === "private" && "Only visible within this project"}
                        {visibility === "public" && "Visible to everyone (public access)"}
                      </p>
                    </div>
                  </div>
                )}

                {activeTab === "details" && (
                  <div className="space-y-4">
                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Description</label>
                      <textarea
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Describe the element..."
                        rows={4}
                        className="w-full rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2.5 text-[13px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    <div>
                      <label className="text-[11px] font-semibold uppercase tracking-wider text-(--text-tertiary) mb-2 block">Tags</label>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {tags.map((tag, index) => (
                          <span key={index} className="flex items-center gap-1 text-[10px] font-medium bg-white/6 text-(--text-secondary) rounded-md px-2 py-0.5 border border-white/4">
                            {tag}
                            <button
                              type="button"
                              onClick={() => setTags(tags.filter((_, i) => i !== index))}
                              className="text-(--text-tertiary) hover:text-(--text-primary) transition-colors"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </span>
                        ))}
                      </div>
                      <div className="flex gap-1.5">
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
                          className="flex-1 rounded-lg border border-(--border-primary) bg-(--bg-primary) px-3 py-2 text-[12px] text-(--text-primary) outline-none placeholder:text-(--text-tertiary) focus:border-(--accent-blue)/40 transition-colors"
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
                          className="px-3 py-2 rounded-lg text-[12px] font-medium text-(--text-secondary) hover:text-(--text-primary) hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                  </>
                )}
              </div>

              <div className="mt-5 pt-4 border-t border-white/6 px-5 pb-4">
                <button
                  onClick={handleCreateOrUpdate}
                  disabled={saving || !newName.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-lg bg-(--accent-blue) hover:bg-(--accent-blue-hover) py-2.5 text-[13px] font-medium text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" strokeWidth={2} />}
                  {editingId ? "Save Changes" : CUSTOM_ELEMENT_TYPES.has(activeType)
                    ? `Create ${ELEMENT_TYPES.find(t => t.key === activeType)?.label.replace(/s$/, '') || "Element"}`
                    : "Create Element"}
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
              <div className="fixed top-0 right-0 w-72 h-full bg-(--bg-secondary) border-l border-(--border-primary) z-50 overflow-y-auto">
                <div className="px-4 py-3.5 border-b border-white/6 flex items-center justify-between">
                  <p className="text-[13px] font-semibold text-(--text-primary)">Select Image</p>
                  <button
                    onClick={() => { dispatch({ type: 'END_SELECTION' }); setEditingId(null); }}
                    className="p-1.5 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4 text-(--text-secondary)" strokeWidth={1.75} />
                  </button>
                </div>
                <div className="p-4 space-y-3">
                  <div className="rounded-lg bg-(--bg-primary) border border-(--border-primary) px-3 py-2.5">
                    <p className="text-[12px] font-medium text-(--text-primary)">{selectedElement.name}</p>
                    <p className="text-[10px] text-(--text-tertiary) mt-0.5">Click an image to add as reference</p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
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
                </div>
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
          companyId={projectCompanyId || undefined}
          element={forgeState.element}
          showSendToStudio={!!onSendToStudio}
          onSave={() => {
            // Don't auto-close — user may want to generate after saving
          }}
          onClose={() => setForgeState(null)}
          onSendToStudio={onSendToStudio ? (prompt, refUrls) => {
            setForgeState(null);
            onClose();
            onSendToStudio(prompt, refUrls);
          } : undefined}
          onOpenFileBrowser={() => setShowRefFileBrowser(true)}
          onGenerating={(elementId) => {
            const el = displayElements?.find(e => e._id === elementId);
            setGeneratingIds(prev => new Set(prev).add(elementId));
            setGenRefCounts(prev => new Map(prev).set(elementId as string, el?.referenceUrls?.length ?? 0));
          }}
        />
      )}
    </div>
  );
}
