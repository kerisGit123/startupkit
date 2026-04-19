"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { toast } from "sonner";
import { useParams, useRouter } from "next/navigation";
import { useMutation, useQuery } from "convex/react";
import { useUser } from "@clerk/nextjs";
import { AppUserButton as UserButton } from "@/components/AppUserButton";
import { OrgSwitcher } from "@/components/OrganizationSwitcherWithLimits";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { getCurrentCompanyId, useCurrentCompanyId } from "@/lib/auth-utils";
import { FrameFavoriteButton } from "../../components/editor/FrameFavoriteButton";
import { FramePrimaryImageButton } from "../../components/editor/FramePrimaryImageButton";
import { WorkspaceExportModal } from "../../components/modals/WorkspaceExportModal";
import { FileBrowser } from "../../components/ai/FileBrowser";
import { VISUAL_STYLES, STYLE_PROMPTS } from "../../constants";
import { ElementLibrary } from "../../components/ai/ElementLibrary";
import { BuildStoryboardDialogSimplified } from "../../components/storyboard/BuildStoryboardDialogSimplified";
import { TaskStatusBadge, TaskStatusWithProgress } from "../../components/storyboard/TaskStatus";
import { SceneEditor } from "../../components/editor/SceneEditor";
import { TagEditor } from "../../components/storyboard/TagEditor";
import { DisplayFilters } from "../../components/storyboard/DisplayFilters";
import { TopNavSearch } from "../../components/dashboard/TopNavSearch";
import { TopNavFilters } from "../../components/dashboard/TopNavFilters";
import { CreditBadge } from "../../components/shared/CreditBadge";
import { parseScriptScenes } from "@/lib/storyboard/sceneParser";
import type { Shot } from "../../types";
import { 
  CheckCircle, 
  AlertCircle, 
  AlertTriangle,
  Play, 
  Plus, 
  Minus, 
  ZoomIn, 
  Settings, 
  Download, 
  Upload, 
  ArrowLeft, 
  Sparkles, 
  Image, 
  ImageIcon, 
  Video, 
  Palette, 
  Layers, 
  FileText, 
  Grid3x3, 
  Trash2, 
  Edit3, 
  MoreVertical, 
  Copy,
  Pencil,
  GripVertical,
  Eye, 
  EyeOff, 
  Wand2, 
  Loader2, 
  RefreshCw, 
  Save,
  FileImage, 
  FileVideo, 
  File, 
  X, 
  ChevronDown, 
  ChevronRight, 
  ChevronLeft, 
  ChevronUp, 
  Users, 
  CreditCard, 
  Activity, 
  DollarSign, 
  BarChart3, 
  PieChart, 
  ShoppingCart, 
  Package, 
  HelpCircle, 
  Mail, 
  MessageSquare, 
  Phone, 
  Calendar, 
  Clock, 
  Star, 
  Hash, 
  FolderPlus, 
  FolderOpen, 
  Search, 
  Filter, 
  Grid, 
  List, 
  Zap, 
  Target, 
  Cpu, 
  Database, 
  Cloud, 
  Shield, 
  Lock, 
  Unlock, 
  User, 
  UserPlus, 
  UserCheck, 
  UserX, 
  LogOut, 
  ArrowRight, 
  Home, 
  Building2, 
  Briefcase, 
  Menu,
  Check,
} from "lucide-react";

type Tab = "script" | "storyboard" | "table";

export default function StoryboardWorkspacePage() {
  const { projectId } = useParams<{ projectId: string }>();
  const router = useRouter();
  const { user } = useUser();

  const pid = projectId as Id<"storyboard_projects">;

  const project = useQuery(api.storyboard.projects.get, { id: pid });
  const items = useQuery(api.storyboard.moveItems.getStoryboardItemsOrdered, { projectId: pid });
  const currentCompanyId = useCurrentCompanyId() || "personal";
  // Credit balance now handled by CreditBadge component
  const customStyles = useQuery(api.promptTemplates.getByCompany, { companyId: currentCompanyId });
  const customStyleTemplates = customStyles?.filter(t => t.type === "style") ?? [];

  const updateScript = useMutation(api.storyboard.projects.updateScript);
  const updateProject = useMutation(api.storyboard.projects.update);
  const createPromptTemplate = useMutation(api.promptTemplates.create);
  const updatePromptTemplate = useMutation(api.promptTemplates.update);
  const deletePromptTemplate = useMutation(api.promptTemplates.remove);
  const createBatch = useMutation(api.storyboard.storyboardItems.createBatch);
  const createItem = useMutation(api.storyboard.storyboardItems.create);
  const updateItem = useMutation(api.storyboard.storyboardItems.update);
  const setPrimaryImage = useMutation(api.storyboard.storyboardItems.setPrimaryImage);
  const addElementToItem = useMutation(api.storyboard.storyboardItemElements.addElementToItem);
  const removeElementFromItem = useMutation(api.storyboard.storyboardItemElements.removeElementFromItem);
  const removeItem = useMutation(api.storyboard.storyboardItems.remove);
  const updateFavorite = useMutation(api.storyboard.storyboardItems.updateFavorite);
  const moveItem = useMutation(api.storyboard.moveItems.moveStoryboardItem);
  const moveItemToPosition = useMutation(api.storyboard.moveItems.moveStoryboardItemToPosition);
  
  // State for tracking deletion operations
  const [deletingItemIds, setDeletingItemIds] = useState<Set<Id<"storyboard_items">>>(new Set());
  const [recentlyDeletedItems, setRecentlyDeletedItems] = useState<Set<Id<"storyboard_items">>>(new Set());

  // Drag and drop state
  const [draggedItem, setDraggedItem] = useState<string | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);
  const [itemsWithDialogOpen, setItemsWithDialogOpen] = useState<Set<string>>(new Set());

  // Safe item deletion with error handling and debouncing
  const handleRemoveItem = async (itemId: Id<"storyboard_items">, sceneTitle?: string) => {
    // Prevent duplicate deletions
    if (deletingItemIds.has(itemId) || recentlyDeletedItems.has(itemId)) {
      console.log(`[Workspace] Deletion already in progress or recently completed for: ${sceneTitle || itemId}`);
      return;
    }

    // Add to tracking sets
    setDeletingItemIds(prev => new Set(prev).add(itemId));
    
    try {
      await removeItem({ id: itemId });
      console.log(`[Workspace] Successfully deleted item: ${sceneTitle || itemId}`);
      
      // Add to recently deleted set for 2 seconds to prevent rapid re-deletion
      setRecentlyDeletedItems(prev => new Set(prev).add(itemId));
      setTimeout(() => {
        setRecentlyDeletedItems(prev => {
          const newSet = new Set(prev);
          newSet.delete(itemId);
          return newSet;
        });
      }, 2000);
      
    } catch (error) {
      console.error("[Workspace] Failed to delete item:", error);
      
      // User-friendly error message
      if (error instanceof Error && error.message.includes("not found")) {
        // Don't show alert for recently deleted items (user experience)
        if (!recentlyDeletedItems.has(itemId)) {
          alert(`This scene "${sceneTitle || 'Unknown'}" may have already been deleted or is no longer available. The scene list will refresh automatically.`);
        }
      } else {
        alert(`Unable to delete scene "${sceneTitle || 'Unknown'}". Please try again or refresh the page.`);
      }
    } finally {
      // Remove from deleting set
      setDeletingItemIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };
  
  // NEW: Frame status and notes mutations
  const updateFrameStatus = useMutation(api.storyboard.storyboardItems.updateFrameStatus);
  const updateFrameNotes = useMutation(api.storyboard.storyboardItems.updateFrameNotes);

  // Duplicate item function
  const duplicateItem = async (itemToDuplicate: any) => {
    try {
      // Find the position to insert the duplicate (right after the original)
      const currentItems = items || [];
      const originalIndex = currentItems.findIndex(item => item._id === itemToDuplicate._id);
      const insertPosition = originalIndex >= 0 ? originalIndex + 1 : currentItems.length;
      
      // Create duplicate with updated order for all items
      const newItemId = await createItem({
        projectId: pid,
        sceneId: itemToDuplicate.sceneId || `manual-${Date.now()}`,
        title: `${itemToDuplicate.title} (Copy)`,
        order: insertPosition,
        duration: itemToDuplicate.duration,
        description: itemToDuplicate.description,
        generatedBy: user?.id || "unknown",
      });

      // Update with additional fields that create doesn't accept
      if (newItemId) {
        await updateItem({
          id: newItemId,
          ...(itemToDuplicate.imagePrompt ? { imagePrompt: itemToDuplicate.imagePrompt } : {}),
          ...(itemToDuplicate.videoPrompt ? { videoPrompt: itemToDuplicate.videoPrompt } : {}),
          ...(itemToDuplicate.imageUrl ? { imageUrl: itemToDuplicate.imageUrl } : {}),
        });
      }
      
      console.log(`[Duplicate Item] Successfully duplicated item: ${itemToDuplicate.title}`);
    } catch (error) {
      console.error("[Duplicate Item] Failed to duplicate item:", error);
      alert("Failed to duplicate item. Please try again.");
    }
  };

  // Move item handlers
  const handleMoveUp = async (itemId: string) => {
    try {
      await moveItem({ 
        projectId: pid, 
        itemId: itemId as Id<"storyboard_items">, 
        direction: "up" 
      });
      console.log(`[Move Item] Successfully moved item up: ${itemId}`);
    } catch (error) {
      console.error("[Move Item] Failed to move item up:", error);
      alert("Failed to move item up. Please try again.");
    }
  };

  const handleMoveDown = async (itemId: string) => {
    try {
      await moveItem({ 
        projectId: pid, 
        itemId: itemId as Id<"storyboard_items">, 
        direction: "down" 
      });
      console.log(`[Move Item] Successfully moved item down: ${itemId}`);
    } catch (error) {
      console.error("[Move Item] Failed to move item down:", error);
      alert("Failed to move item down. Please try again.");
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e: React.DragEvent, itemId: string) => {
    // Prevent drag when interacting with textareas, inputs, or contentEditable elements
    const target = e.target as HTMLElement;
    if (target.tagName === 'TEXTAREA' || target.tagName === 'INPUT' || target.isContentEditable) {
      e.preventDefault();
      return;
    }
    setDraggedItem(itemId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', itemId);
  };

  const handleDragEnd = () => {
    setDraggedItem(null);
    setDragOverItem(null);
  };

  const handleDragOver = (e: React.DragEvent, itemId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (draggedItem && draggedItem !== itemId) {
      setDragOverItem(itemId);
    }
  };

  const handleDragLeave = () => {
    setDragOverItem(null);
  };

  const handleDrop = async (e: React.DragEvent, targetItemId: string) => {
    e.preventDefault();
    setDragOverItem(null);
    
    if (!draggedItem || draggedItem === targetItemId) {
      return;
    }

    try {
      // Find the items to determine target position
      const draggedStoryboardItem = items?.find(item => item._id === draggedItem);
      const targetStoryboardItem = items?.find(item => item._id === targetItemId);
      
      if (!draggedStoryboardItem || !targetStoryboardItem) {
        console.error('Could not find items for drag operation');
        return;
      }

      // Use the target item's order as the target position
      const targetOrder = targetStoryboardItem.order;
      
      console.log(`[Drag Drop] Moving item ${draggedItem} directly to position ${targetOrder}`);
      
      // Use new direct positioning mutation
      await moveItemToPosition({
        projectId: pid,
        itemId: draggedItem as Id<"storyboard_items">,
        targetOrder
      });
      
      console.log(`[Drag Drop] Successfully moved item: ${draggedItem} to position ${targetOrder}`);
    } catch (error) {
      console.error("[Drag Drop] Failed to move item:", error);
      alert("Failed to move item. Please try again.");
    }
  };

  // Function to detect and remove duplicate items
  const handleRemoveDuplicates = async () => {
    const currentItems = items || [];
    if (currentItems.length === 0) {
      alert("No items to check for duplicates.");
      return;
    }

    // Group items by name and description to find true duplicates (same project and companyId is implied)
    const itemSignatures = new Map<string, any[]>();
    
    currentItems.forEach(item => {
      // Create a signature based on name and description (case-insensitive, trimmed)
      const name = (item.title || '').trim().toLowerCase();
      const description = (item.description || '').trim().toLowerCase();
      const signature = `${name}|${description}`;
      
      if (!itemSignatures.has(signature)) {
        itemSignatures.set(signature, []);
      }
      itemSignatures.get(signature)!.push(item);
    });

    // Find duplicates (keep the first item in each group, delete the rest)
    const duplicatesToDelete: Id<"storyboard_items">[] = [];
    let totalDuplicates = 0;
    const duplicateGroups: string[] = [];

    itemSignatures.forEach((itemsInGroup, signature) => {
      if (itemsInGroup.length > 1) {
        // Sort by order to keep the first one
        itemsInGroup.sort((a, b) => (a.order || 0) - (b.order || 0));
        
        // Mark all but the first as duplicates
        for (let i = 1; i < itemsInGroup.length; i++) {
          duplicatesToDelete.push(itemsInGroup[i]._id);
          totalDuplicates++;
        }
        
        // Add to duplicate groups for reporting
        const displayName = itemsInGroup[0].title || 'Untitled';
        const displayDesc = itemsInGroup[0].description ? ` (${itemsInGroup[0].description.substring(0, 30)}...)` : '';
        duplicateGroups.push(`${displayName}${displayDesc} (${itemsInGroup.length} copies)`);
      }
    });

    if (totalDuplicates === 0) {
      alert("No duplicate items found. All storyboard items are unique.");
      return;
    }

    // Show detailed confirmation
    const duplicateList = duplicateGroups.join(', ');
    const confirmed = confirm(
      `Found ${totalDuplicates} duplicate item${totalDuplicates > 1 ? 's' : ''} with identical names and descriptions:\n\n${duplicateList}\n\nDo you want to remove the duplicates and keep only the first item of each group?`
    );
    if (!confirmed) return;

    // Delete duplicates
    try {
      console.log(`[Remove Duplicates] Removing ${totalDuplicates} duplicate items`);
      
      // Delete all duplicates with progress feedback
      let deletedCount = 0;
      for (const itemId of duplicatesToDelete) {
        await handleRemoveItem(itemId, `Duplicate Item`);
        deletedCount++;
        
        // Update progress every 10 deletions
        if (deletedCount % 10 === 0 || deletedCount === totalDuplicates) {
          console.log(`[Remove Duplicates] Progress: ${deletedCount}/${totalDuplicates} items deleted`);
        }
      }

      alert(`Successfully removed ${totalDuplicates} duplicate item${totalDuplicates > 1 ? 's' : ''}. Your storyboard now has ${currentItems.length - totalDuplicates} unique items.`);
    } catch (error) {
      console.error("[Remove Duplicates] Failed to remove duplicates:", error);
      alert("Failed to remove some duplicates. Please try again or refresh the page.");
    }
  };

  // Calculate duplicate count for display
  const duplicateCount = useMemo(() => {
    const currentItems = items || [];
    const itemSignatures = new Map<string, any[]>();
    
    currentItems.forEach(item => {
      // Create a signature based on name and description (case-insensitive, trimmed)
      const name = (item.title || '').trim().toLowerCase();
      const description = (item.description || '').trim().toLowerCase();
      const signature = `${name}|${description}`;
      
      if (!itemSignatures.has(signature)) {
        itemSignatures.set(signature, []);
      }
      itemSignatures.get(signature)!.push(item);
    });

    let duplicates = 0;
    itemSignatures.forEach(itemsInGroup => {
      if (itemsInGroup.length > 1) {
        duplicates += itemsInGroup.length - 1; // Count all but the first as duplicates
      }
    });

    return duplicates;
  }, [items]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    favorite: false,
    frameStatus: [] as ('draft' | 'in-progress' | 'completed')[], // Frame status filter
  });

  // Notification state for duplicate scenes
  const [notification, setNotification] = useState<{
    type: 'warning' | 'success' | 'error';
    title: string;
    message: string;
    visible: boolean;
  } | null>(null);

  // Show notification function
  const showNotification = (type: 'warning' | 'success' | 'error', title: string, message: string) => {
    setNotification({ type, title, message, visible: true });
    // Removed auto-hide timeout - notification stays until user closes it
  };

  // Handle filter changes from TopNavFilters
  const handleFiltersChange = useCallback((newFilters: { favorite: boolean; frameStatus?: ('draft' | 'in-progress' | 'completed')[] }) => {
    setFilters(prev => ({
      ...prev,
      favorite: newFilters.favorite,
      frameStatus: newFilters.frameStatus || prev.frameStatus,
    }));
  }, []);

  // Filter and search logic for frames - similar to ProjectsDashboard
  const filteredItems = useMemo(() => {
    let filtered = items || [];

    // Apply search filter (same as ProjectsDashboard)
    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item => 
        item.title?.toLowerCase().includes(query) ||
        item.description?.toLowerCase().includes(query) ||
        (item.tags && item.tags.some((tag: { id: string; name: string; color: string }) => tag.name.toLowerCase().includes(query)))
      );
    }

    // Apply frame status filter
    if (filters.frameStatus.length > 0) {
      filtered = filtered.filter(item => 
        item.frameStatus && filters.frameStatus.includes(item.frameStatus)
      );
    }

    // Apply favorite filter (same as ProjectsDashboard)
    if (filters.favorite) {
      filtered = filtered.filter(item => item.isFavorite);
    }

    // Apply tag filter (additional for frames) - removed for now as TopNavFilters doesn't support tags
    // if (filters.tags.length > 0) {
    //   filtered = filtered.filter(item => 
    //     item.tags && filters.tags.some((tag: string) => item.tags.includes(tag))
    //   );
    // }

    return filtered;
  }, [items, searchQuery, filters]);

  const [tab, setTab] = useState<Tab>("storyboard");
  const [scriptText, setScriptText] = useState("");
  const [scriptDirty, setScriptDirty] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showBuildDialog, setShowBuildDialog] = useState(false);
  const [showStyleDropdown, setShowStyleDropdown] = useState(false);
  const [showCustomStyleForm, setShowCustomStyleForm] = useState(false);
  const [customStyleName, setCustomStyleName] = useState("");
  const [customStylePrompt, setCustomStylePrompt] = useState("");
  const [editingStyleId, setEditingStyleId] = useState<string | null>(null);
  const [isBuilding, setIsBuilding] = useState(false);
  const [isAddingFrame, setIsAddingFrame] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [showAiInput, setShowAiInput] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([]);
  const [showExportModal, setShowExportModal] = useState(false);
  const [tableEditField, setTableEditField] = useState<{ itemId: string; field: string; value: string } | null>(null);
  const [tableTagEditorId, setTableTagEditorId] = useState<string | null>(null);
  const [showFileBrowser, setShowFileBrowser] = useState(false);
  const [showElementLibrary, setShowElementLibrary] = useState(false);
  const [selectedItemForElement, setSelectedItemForElement] = useState<Id<"storyboard_items"> | null>(null);
  const [showSceneEditor, setShowSceneEditor] = useState(false);
  const [selectedSceneItem, setSelectedSceneItem] = useState<any>(null);
  const [elementLibraryDraft, setElementLibraryDraft] = useState<{
    imageUrls?: string[];
    name?: string;
    type?: string;
  } | null>(null);
  const [characterRef, setCharacterRef] = useState<{ name: string; urls: string[] } | null>(null);
  const [genre, setGenre] = useState("drama");
  const [duration, setDuration] = useState(30);
  const [zoomLevel, setZoomLevel] = useState(100); // 100, 80, 60, 40

  // Zoom controls
  const zoomLevels = [100, 80, 60, 40];
  const currentZoomIndex = zoomLevels.indexOf(zoomLevel);
  const canZoomIn = currentZoomIndex < zoomLevels.length - 1;
  const canZoomOut = currentZoomIndex > 0;

  const handleZoomIn = () => {
    if (canZoomIn) {
      setZoomLevel(zoomLevels[currentZoomIndex + 1]);
    }
  };

  const handleZoomOut = () => {
    if (canZoomOut) {
      setZoomLevel(zoomLevels[currentZoomIndex - 1]);
    }
  };

  const handleZoomReset = () => {
    setZoomLevel(100);
  };

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === "=" || e.key === "+") {
          e.preventDefault();
          handleZoomIn();
        } else if (e.key === "-") {
          e.preventDefault();
          handleZoomOut();
        } else if (e.key === "0") {
          e.preventDefault();
          handleZoomReset();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [zoomLevel]);

  // Sync script text from DB on first load
  const scriptFromDb = project?.script ?? "";
  const displayScript = scriptDirty ? scriptText : scriptFromDb;

  const handleScriptChange = (val: string) => {
    setScriptText(val);
    setScriptDirty(true);
    
    // Check for duplicate scenes when script changes
    const parseResult = parseScriptScenes(val);
    if (parseResult.duplicates.length > 0) {
      const duplicateList = parseResult.duplicates.map(d => 
        `Scene ${d.sceneNumber} (${d.count} copies)`
      ).join(', ');
      
      showNotification(
        'warning',
        'Duplicate Scenes Detected',
        `Found duplicate scenes: ${duplicateList}. Only the first occurrence of each scene will be used.`
      );
    }
  };

  const handleSaveScript = async () => {
    const parseResult = parseScriptScenes(displayScript);
    await updateScript({
      id: pid,
      script: displayScript,
      scenes: parseResult.scenes,
      isAIGenerated: false,
    });
    setScriptDirty(false);
    
    // Show success notification with scene count
    showNotification(
      'success',
      'Script Saved',
      `Successfully saved script with ${parseResult.scenes.length} scene${parseResult.scenes.length !== 1 ? 's' : ''}${parseResult.duplicates.length > 0 ? ` (${parseResult.duplicates.length} duplicate${parseResult.duplicates.length !== 1 ? 's' : ''} removed)` : ''}`
    );
  };

  const handleOpenSceneEditor = (item: any) => {
    setSelectedSceneItem(item);
    setShowSceneEditor(true);
  };

  const handleCloseSceneEditor = () => {
    setShowSceneEditor(false);
    setSelectedSceneItem(null);
  };

  const handleGenerateScript = async () => {
    if (!aiPrompt.trim()) return;
    setIsGenerating(true);
    try {
      const res = await fetch("/api/storyboard/generate-script", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, genre, targetDuration: duration }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setScriptText(data.script);
      setScriptDirty(true);
      setShowAiInput(false);
      await updateScript({
        id: pid,
        script: data.script,
        scenes: data.scenes,
        isAIGenerated: true,
        aiModel: "gpt-4o (Kie AI)",
      });
      setScriptDirty(false);
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExecuteBuild = async (config: any) => {
    const src = scriptDirty ? scriptText : scriptFromDb;
    if (!src.trim()) return;
    setIsBuilding(true);
    try {
      const parseResult = parseScriptScenes(src);
      const scenes = parseResult.scenes;
      console.log(`[Build Storyboard Frontend] Parsed scenes:`, scenes.map(s => ({ id: s.id, title: s.title, duration: s.duration, characters: s.characters })));
      console.log(`[Build Storyboard Frontend] Build config:`, config);
      console.log(`[Build Storyboard Frontend] Total scenes found: ${scenes.length}`);
      console.log(`[Build Storyboard Frontend] Script length: ${src.length}`);
      
      // Apply rebuild strategy logic
      let filteredScenes = scenes;
      if (config.rebuildStrategy === "append_update" && config.selectedScenes && config.selectedScenes.length > 0) {
        // For Add/Update mode: filter scenes based on selection
        filteredScenes = scenes.filter(scene => 
          config.selectedScenes.includes(scene.id) // Update selected scenes (scene.id from script)
          || !items || !items.some(item => item.sceneId === scene.id) // Add new scenes (scene.id from script)
        );
        console.log(`[Build Storyboard] Filtered ${filteredScenes.length} scenes for Add/Update mode`);
        console.log(`[Build Storyboard] Selected scenes for update:`, config.selectedScenes);
        console.log(`[Build Storyboard] Available existing sceneIds:`, items?.map(item => item.sceneId));
      } else if (config.rebuildStrategy === "hard_rebuild") {
        // For Replace All mode: use all scenes
        filteredScenes = scenes;
        console.log(`[Build Storyboard] Using all ${scenes.length} scenes for Hard Rebuild mode`);
      }
      
      console.log(`[Build Storyboard] Final scenes to process: ${filteredScenes.length}`);
      console.log(`[Build Storyboard] Build type: ${config.buildType}`);
      console.log(`[Build Storyboard] Element strategy: ${config.elementStrategy}`);
      
      if (filteredScenes.length === 0) {
        console.log(`[Build Storyboard] No scenes to process after filtering`);
        return;
      }
      
      const frontendCompanyId = currentCompanyId;
      
      let result;
      if (config.buildType === "enhanced") {
        // Use enhanced extraction API
        const response = await fetch('/api/storyboard/enhanced-script-extraction', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            scriptContent: src,
            projectId: pid,
            companyId: frontendCompanyId // Pass the current companyId for consistency
          })
        });
        
        console.log(`[Enhanced Build Storyboard] API Response status: ${response.status}`);
        console.log(`[Enhanced Build Storyboard] API Response headers:`, Object.fromEntries(response.headers.entries()));
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error(`[Enhanced Build Storyboard] API Error (${response.status}):`, errorText);
          throw new Error(`Enhanced extraction failed: ${response.status} - ${errorText}`);
        }
        
        const enhancedResult = await response.json();
        console.log(`[Enhanced Build Storyboard] Extracted ${enhancedResult.extractedElements?.length || 0} elements with detailed descriptions`);
        console.log(`[Enhanced Build Storyboard] Element details:`, enhancedResult.extractedElements?.map(e => ({ name: e.name, type: e.type, locationType: e.locationType })));
        
        // Apply element strategy
        let finalElements = enhancedResult.extractedElements || [];
        let skipElementCreation = false;
        
        if (config.elementStrategy === "preserve") {
          // Preserve existing elements - skip all element creation in backend
          skipElementCreation = true;
          console.log(`[Build Storyboard] Preserving existing elements, skipping all element creation`);
        } else if (config.elementStrategy === "regenerate") {
          // Regenerate elements - use enhanced elements from AI extraction
          console.log(`[Build Storyboard] Regenerating elements with ${finalElements.length} enhanced elements from smart detection`);
        }
        
        // Build storyboard with enhanced elements and filtered scenes via Site API
        const buildResponse = await fetch('/api/n8n-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: pid,
            buildType: config.buildType || 'enhanced',
            rebuildStrategy: config.rebuildStrategy,
            scriptType: config.scriptType || 'ANIMATED_STORIES',
            language: config.language || 'en',
            script: src,
            scenes: filteredScenes.map(({ technical, ...scene }) => scene),
            enhancedElements: skipElementCreation ? undefined : finalElements,
            metadata: enhancedResult.metadata, // Pass extracted metadata (genre, visualStyle, etc.)
          })
        });
        
        if (!buildResponse.ok) {
          const errorData = await buildResponse.json();
          throw new Error(errorData.error || 'Build request failed');
        }
        
        result = await buildResponse.json();
      } else {
        // Normal build - no AI extraction
        let skipElementCreation = false;
        
        if (config.elementStrategy === "preserve") {
          // Preserve existing elements - skip all element creation
          skipElementCreation = true;
          console.log(`[Build Storyboard] Normal build preserving existing elements`);
        } else if (config.elementStrategy === "regenerate") {
          // For normal build with regenerate, allow fallback element creation from scene locations
          console.log(`[Build Storyboard] Normal build with element regeneration (fallback from scene locations)`);
        }
        
        // Build storyboard with filtered scenes via Site API
        const normalBuildResponse = await fetch('/api/n8n-webhook', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            projectId: pid,
            buildType: config.buildType || 'normal',
            rebuildStrategy: config.rebuildStrategy,
            scriptType: config.scriptType || 'ANIMATED_STORIES',
            language: config.language || 'en',
            script: src,
            scenes: filteredScenes.map(({ technical, ...scene }) => scene),
            enhancedElements: skipElementCreation ? undefined : undefined, // No enhanced elements for normal build
          })
        });
        
        if (!normalBuildResponse.ok) {
          const errorData = await normalBuildResponse.json();
          throw new Error(errorData.error || 'Build request failed');
        }
        
        result = await normalBuildResponse.json();
      }
      
      console.log(`[Build Storyboard] Created ${result?.createdItems} frames, ${result?.createdCharacters} characters, and ${result?.createdEnvironments} environments`);
      
      if (scriptDirty) {
        await updateScript({ id: pid, script: src, scenes, isAIGenerated: false });
        setScriptDirty(false);
      }
      setTab("storyboard");
    } finally {
      setIsBuilding(false);
    }
  };

  const handleTagsChange = (itemId: string, newTags: Array<{ id: string; name: string; color: string }>) => {
    updateItem({
      id: itemId as Id<"storyboard_items">,
      tags: newTags,
    });
  };

  const handleFavoriteToggle = (itemId: string) => {
    const item = items?.find(i => i._id === itemId);
    if (item) {
      updateFavorite({
        id: itemId as Id<"storyboard_items">,
        isFavorite: !item.isFavorite,
      });
    }
  };

  // NEW: Handler functions for status and notes
  const handleStatusChange = (itemId: string, status: 'draft' | 'in-progress' | 'completed') => {
    updateFrameStatus({
      id: itemId as Id<"storyboard_items">,
      frameStatus: status,
    });
  };

  const handleNotesChange = (itemId: string, notes: string) => {
    updateFrameNotes({
      id: itemId as Id<"storyboard_items">,
      notes,
    });
  };

  const handleTitleChange = (itemId: string, title: string) => {
    updateItem({
      id: itemId as Id<"storyboard_items">,
      title,
    });
  };

  const handleDescriptionChange = (itemId: string, description: string) => {
    updateItem({
      id: itemId as Id<"storyboard_items">,
      description,
    });
  };

  const handleImageUploaded = (itemId: string, imageUrl: string) => {
    updateItem({
      id: itemId as Id<"storyboard_items">,
      imageUrl,
    });
  };

  const handleSetPrimaryImage = async (itemId: string, imageUrl: string) => {
    try {
      await setPrimaryImage({
        itemId: itemId as Id<"storyboard_items">,
        primaryImageUrl: imageUrl,
      });
      console.log("Primary image set successfully");
    } catch (error) {
      console.error("Failed to set primary image:", error);
    }
  };

  const handleSetStoryboardUrl = (imageUrl: string) => {
    updateProject({
      id: pid as Id<"storyboard_projects">,
      imageUrl: imageUrl,
    });
  };

  const handleClearStoryboardUrl = () => {
    updateProject({
      id: pid as Id<"storyboard_projects">,
      imageUrl: "", // Empty string = clear the image URL
    });
  };

  const handleDoubleClick = (item: any) => {
    handleOpenSceneEditor(item);
  };

  const handleAddElement = (itemId: string) => {
    // Open the ElementLibrary to add elements to this specific storyboard item
    setSelectedItemForElement(itemId as Id<"storyboard_items">);
    setShowElementLibrary(true);
  };

  const handleRemoveElement = (itemId: string, elementId: string) => {
    // Remove element from the storyboard item
    console.log(`Removing element ${elementId} from item ${itemId}`);
    
    // Check if this is the new format (type-index) or legacy format (Convex ID)
    if (elementId.includes('-')) {
      // New format: "type-index" (from elementNames)
      const [type, indexStr] = elementId.split('-');
      const index = parseInt(indexStr);
      
      if (type === 'character' || type === 'environment' || type === 'prop') {
        // Update the item's elementNames by removing the specific element
        updateItem({
          id: itemId as Id<"storyboard_items">,
          elementNames: {
            ...items?.find(item => item._id === itemId)?.elementNames,
            [type + 's']: items?.find(item => item._id === itemId)?.elementNames?.[type + 's']?.filter((_, i) => i !== index) || []
          }
        });
      }
    } else {
      // Legacy format: Convex ID (from linkedElements)
      // Remove from linkedElements array
      const currentItem = items?.find(item => item._id === itemId);
      if (currentItem?.linkedElements) {
        const updatedLinkedElements = currentItem.linkedElements.filter(el => el.id !== elementId);
        updateItem({
          id: itemId as Id<"storyboard_items">,
          linkedElements: updatedLinkedElements
        });
      }
    }
  };

  if (!project) {
    return (
      <div className="flex h-full items-center justify-center bg-(--bg-primary)">
        <Loader2 className="w-6 h-6 text-(--accent-blue) animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-(--bg-primary) text-(--text-primary) overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-(--border-primary) shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => router.push("/storyboard-studio")}
            className="p-1.5 rounded-xl hover:bg-(--bg-tertiary) transition-all duration-200 text-(--text-secondary) hover:text-(--text-primary) hover:scale-105">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-(--text-primary)">{project.name}</h1>
            <p className="text-[11px] text-(--text-tertiary) capitalize">{project.status} · {project.settings.frameRatio}</p>
            {/* Task status badge with progress */}
            {(project.taskStatus && project.taskStatus !== "idle") && (
              <div className="mt-1">
                <TaskStatusWithProgress 
                  taskStatus={project.taskStatus}
                  taskMessage={project.taskMessage}
                  taskType={project.taskType}
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex bg-(--bg-tertiary) rounded-xl p-0.5 gap-0.5 border border-(--border-primary)">
            {(["script", "storyboard", "table"] as Tab[]).map((t) => (
              <button key={t} onClick={() => setTab(t)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200
                  ${tab === t ? "bg-teal-600 text-white shadow-lg" : "text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-primary)"}`}>
                {t === "script" ? <FileText className="w-3.5 h-3.5" /> : t === "table" ? <List className="w-3.5 h-3.5" /> : <Grid3x3 className="w-3.5 h-3.5" />}
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* Script Actions */}
          {tab === "script" && (
            <button
              onClick={handleSaveScript}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-(--accent-teal) to-(--accent-teal-hover) hover:from-(--accent-teal-hover) hover:to-(--accent-teal) text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Save className="w-3.5 h-3.5" />
              Save Script
            </button>
          )}

          {tab === "script" && !scriptDirty && parseScriptScenes(displayScript).scenes.length > 0 && (
            <button
              onClick={() => setShowBuildDialog(true)}
              disabled={isBuilding}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-(--accent-blue) to-(--accent-teal) hover:from-(--accent-blue-hover) hover:to-(--accent-teal-hover) text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
              title="Build storyboard with options for normal or enhanced mode"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Build Storyboard
            </button>
          )}

          {tab === "storyboard" && (
            <>
              {/* Search and Filters - similar to ProjectsDashboard */}
              <div className="flex items-center gap-2">
                <TopNavSearch 
                  onSearch={setSearchQuery} 
                  placeholder="Search frames, tags, status..." 
                />
                <TopNavFilters 
                  onFiltersChange={handleFiltersChange} 
                  projectCount={filteredItems.length}
                  isStoryboard={true}
                />
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-(--bg-tertiary) rounded-xl p-1 border border-(--border-primary)">
                <button
                  onClick={handleZoomOut}
                  disabled={!canZoomOut}
                  className="p-1.5 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-primary) rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom out (Ctrl+-)"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <button
                  onClick={handleZoomReset}
                  className="px-2 py-1 text-xs text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-primary) rounded-lg transition-all duration-200 min-w-12 text-center"
                  title="Reset zoom (Ctrl+0)"
                >
                  {zoomLevel}%
                </button>
                <button
                  onClick={handleZoomIn}
                  disabled={!canZoomIn}
                  className="p-1.5 text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-primary) rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  title="Zoom in (Ctrl+)"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {/* Credit Balance */}
          <CreditBadge />

          {/* Organization Switcher */}
          <OrgSwitcher
            appearance={{
              elements: {
                rootBox: "flex items-center",
                organizationSwitcherTrigger: "px-3 py-2 rounded-lg border border-(--border-primary) bg-(--bg-secondary) hover:bg-(--bg-tertiary) text-white hover:text-gray-200 flex items-center gap-2 text-sm",
                organizationSwitcherTriggerIcon: "w-4 h-4",
                organizationSwitcherTriggerText: "font-medium text-white",
                organizationPreviewText: "text-white",
                organizationPreviewMainIdentifier: "text-white",
              },
            }}
            afterSelectOrganizationUrl="/workspace"
            afterCreateOrganizationUrl="/workspace"
          />

          {/* User Account - Top Right Corner */}
          <UserButton
            appearance={{
              elements: {
                avatarBox: "w-8 h-8",
                userButtonPopoverCard: "bg-(--bg-secondary) border border-(--border-primary) shadow-xl",
                userButtonPopoverActionButton: "text-white hover:bg-white/5 hover:text-gray-200",
                userButtonPopoverActionButtonText: "text-sm",
                userButtonPopoverFooter: "border-t border-(--border-primary)",
              },
            }}
            afterSignOutUrl="/"
          />
        </div>
      </div>

      {/* AI Prompt Bar */}
      {tab === "script" && showAiInput && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#4A90E2]/20 border-b border-[#4A90E2]/30 shrink-0">
          <Sparkles className="w-4 h-4 text-[#4A90E2] shrink-0" />
          <input
            value={aiPrompt}
            onChange={(e) => setAiPrompt(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleGenerateScript()}
            placeholder="Describe your story idea… e.g. 'A thriller about a hacker who discovers government secrets'"
            className="flex-1 bg-transparent text-sm text-(--text-primary) placeholder-(--text-tertiary) outline-none"
          />
          <div className="flex items-center gap-2 shrink-0">
            <select value={genre} onChange={(e) => setGenre(e.target.value)}
              className="bg-(--bg-primary) border border-(--border-primary) rounded-xl text-xs text-(--text-secondary) px-2 py-1.5 outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200">
              {["drama", "comedy", "thriller", "horror", "romance", "action", "documentary"].map((g) => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))}
              className="bg-(--bg-primary) border border-(--border-primary) rounded-xl text-xs text-(--text-secondary) px-2 py-1.5 outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200">
              <option value={15}>15s</option>
              <option value={30}>30s</option>
              <option value={60}>60s</option>
              <option value={90}>90s</option>
            </select>
            <button onClick={handleGenerateScript} disabled={isGenerating || !aiPrompt.trim()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-linear-to-r from-[#4A90E2] to-[#4A9E8E] hover:from-[#357ABD] hover:to-[#378B7C] text-white text-xs font-medium rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed">
              {isGenerating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
              Generate
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {/* ── Script Tab ── */}
        {tab === "script" && (
          <div className="flex h-full">
            <textarea
              value={displayScript}
              onChange={(e) => handleScriptChange(e.target.value)}
              placeholder={`Write your script here...\n\nTip: Format scenes as:\nSCENE 1: Title - Location\n[Scene description]\n\nOr use AI to generate a script automatically.`}
              className="flex-1 bg-transparent text-sm text-[#A0A0A0] placeholder-[#6E6E6E] p-6 outline-none resize-none font-mono leading-relaxed"
            />
            {/* Scene preview panel */}
            {parseScriptScenes(displayScript).scenes.length > 0 && (
              <div className="w-64 border-l border-[#3D3D3D] overflow-y-auto p-3 shrink-0">
                <p className="text-[11px] text-[#6E6E6E] font-medium uppercase tracking-wider mb-3">
                  {parseScriptScenes(displayScript).scenes.length} Scenes
                </p>
                {parseScriptScenes(displayScript).scenes.map((s, i) => (
                  <div key={`${s.id}-${i}`} className="mb-2 p-2.5 rounded-lg bg-[#3D3D3D]/20 border border-[#3D3D3D]">
                    <p className="text-[11px] text-[#A0A0A0] mb-0.5">Scene {i + 1}</p>
                    <p className="text-xs text-[#FFFFFF] font-medium truncate">{s.title}</p>
                    {s.characters.length > 0 && (
                      <p className="text-[10px] text-[#6E6E6E] mt-0.5 truncate">{s.characters.slice(0, 3).join(", ")}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Storyboard Tab ── */}
        {tab === "storyboard" && (
          <div className="flex h-full overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6">
            {!items || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Grid3x3 className="w-12 h-12 text-[#6E6E6E] mb-4" />
                <p className="text-[#A0A0A0] font-medium mb-2">No frames yet</p>
                <p className="text-[#6E6E6E] text-sm mb-6">Write a script and click "Build Storyboard", or create frames manually</p>
                <div className="flex items-center gap-3">
                  <button onClick={() => setTab("script")}
                    className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white text-sm font-medium rounded-lg transition">
                    <FileText className="w-4 h-4" />
                    Go to Script
                  </button>
                  <button
                    disabled={isAddingFrame}
                    onClick={async () => {
                      if (isAddingFrame) return;
                      setIsAddingFrame(true);
                      try {
                        await createItem({
                          projectId: pid,
                          sceneId: `manual-${Date.now()}`,
                          order: 0,
                          title: "Frame 1",
                          description: "",
                          duration: 5,
                          generatedBy: user?.id || "unknown"
                        });
                      } finally { setIsAddingFrame(false); }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-[#3D3D3D] hover:border-[#4A90E2]/50 hover:bg-[#4A90E2]/10 text-[#A0A0A0] hover:text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAddingFrame ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isAddingFrame ? "Creating..." : "Create Frame"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <h2 className="text-sm font-semibold text-[#FFFFFF]">{items.length} Frames</h2>
                    {/* Style Badge */}
                    <div className="relative">
                      <button
                        onClick={() => setShowStyleDropdown(!showStyleDropdown)}
                        className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border ${
                          project?.style && project.style !== 'custom'
                            ? 'bg-purple-500/15 border-purple-500/30 text-purple-300'
                            : 'bg-white/5 border-white/10 text-gray-400 hover:text-gray-300'
                        }`}
                      >
                        <Palette className="w-3 h-3" />
                        {project?.style ? project.style.charAt(0).toUpperCase() + project.style.slice(1) : 'No Style'}
                        <ChevronDown className="w-2.5 h-2.5" />
                      </button>
                      {showStyleDropdown && (
                        <>
                          <div className="fixed inset-0 z-40 bg-black/30" onClick={() => setShowStyleDropdown(false)} />
                          <div className="absolute top-full mt-2 left-0 bg-[#1A1A1A] border border-[#3D3D3D] rounded-xl shadow-2xl z-50 w-[540px] p-4">
                            <div className="flex items-center justify-between mb-3">
                              <h3 className="text-sm font-semibold text-white">Art Style</h3>
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={() => { setEditingStyleId(null); setCustomStyleName(""); setCustomStylePrompt(""); setShowCustomStyleForm(!showCustomStyleForm); }}
                                  className="flex items-center gap-1 text-[11px] text-[#4A90E2] hover:text-white transition px-2 py-1 rounded-lg border border-[#3D3D3D] hover:border-[#4A90E2]/30"
                                >
                                  <Plus className="w-3 h-3" /> Custom
                                </button>
                                <button onClick={() => { setShowStyleDropdown(false); setShowCustomStyleForm(false); }} className="text-[#6E6E6E] hover:text-white transition">
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>

                            {/* Custom Style Create / Edit Form */}
                            {showCustomStyleForm && (
                              <div className="mb-3 p-3 bg-[#2C2C2C] border border-[#3D3D3D] rounded-lg space-y-2">
                                <p className="text-[11px] text-[#A0A0A0] font-medium">{editingStyleId ? "Edit Custom Style" : "Create Custom Style"}</p>
                                <input
                                  type="text"
                                  placeholder="Style name (e.g. My Cinematic)"
                                  value={customStyleName}
                                  onChange={(e) => setCustomStyleName(e.target.value)}
                                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50"
                                />
                                <textarea
                                  placeholder="Style prompt (describe the visual style...)"
                                  value={customStylePrompt}
                                  onChange={(e) => setCustomStylePrompt(e.target.value)}
                                  rows={4}
                                  className="w-full px-3 py-2 bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg text-xs text-white placeholder-[#6E6E6E] focus:outline-none focus:border-[#4A90E2]/50 resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                  <button
                                    onClick={() => { setShowCustomStyleForm(false); setEditingStyleId(null); setCustomStyleName(""); setCustomStylePrompt(""); }}
                                    className="px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg transition"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    disabled={!customStyleName.trim() || !customStylePrompt.trim()}
                                    onClick={async () => {
                                      try {
                                        if (editingStyleId) {
                                          // Update existing
                                          await updatePromptTemplate({
                                            id: editingStyleId as any,
                                            name: customStyleName.trim(),
                                            prompt: customStylePrompt.trim(),
                                          });
                                          // If this style is currently applied, update the project too
                                          if (project?.style === customStyleTemplates.find(s => s._id === editingStyleId)?.name || project?.stylePrompt) {
                                            updateProject({ id: project._id, style: customStyleName.trim(), stylePrompt: customStylePrompt.trim() });
                                          }
                                          toast.success(`Style "${customStyleName}" updated`);
                                        } else {
                                          // Create new
                                          await createPromptTemplate({
                                            name: customStyleName.trim(),
                                            type: "style",
                                            prompt: customStylePrompt.trim(),
                                            companyId: currentCompanyId,
                                            isPublic: false,
                                            tags: ["custom-style"],
                                          });
                                          updateProject({ id: project._id, style: customStyleName.trim(), stylePrompt: customStylePrompt.trim() });
                                          toast.success(`Custom style "${customStyleName}" created and applied`);
                                        }
                                        setCustomStyleName("");
                                        setCustomStylePrompt("");
                                        setEditingStyleId(null);
                                        setShowCustomStyleForm(false);
                                      } catch (err: any) {
                                        toast.error(err.message || "Failed to save style");
                                      }
                                    }}
                                    className="px-3 py-1.5 text-xs text-white bg-[#4A90E2] hover:bg-[#357ABD] rounded-lg transition font-medium disabled:opacity-40"
                                  >
                                    {editingStyleId ? "Update" : "Create & Apply"}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="grid grid-cols-4 gap-2 max-h-[350px] overflow-y-auto pr-1">
                              {/* Built-in styles */}
                              {VISUAL_STYLES.filter(s => s.id !== 'custom').map(style => (
                                <button
                                  key={style.id}
                                  onClick={() => {
                                    updateProject({ id: project._id, style: style.id, stylePrompt: STYLE_PROMPTS[style.id] || "" });
                                    setShowStyleDropdown(false);
                                  }}
                                  className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                                    project?.style === style.id
                                      ? 'border-purple-500 ring-2 ring-purple-500/30 scale-[1.02]'
                                      : 'border-transparent hover:border-white/20'
                                  }`}
                                >
                                  <img
                                    src={style.preview}
                                    alt={style.label}
                                    className="w-full h-full object-cover"
                                    loading="lazy"
                                  />
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-white drop-shadow-lg">
                                    {style.label}
                                  </span>
                                  {project?.style === style.id && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                </button>
                              ))}

                              {/* Custom styles from promptTemplates */}
                              {customStyleTemplates.map(style => (
                                <button
                                  key={style._id}
                                  onClick={() => {
                                    updateProject({ id: project._id, style: style.name, stylePrompt: style.prompt });
                                    setShowStyleDropdown(false);
                                  }}
                                  className={`group relative aspect-[4/3] rounded-lg overflow-hidden border-2 transition-all ${
                                    project?.style === style.name
                                      ? 'border-purple-500 ring-2 ring-purple-500/30 scale-[1.02]'
                                      : 'border-[#3D3D3D] hover:border-white/20'
                                  }`}
                                >
                                  <div className="w-full h-full bg-gradient-to-br from-purple-900/40 to-blue-900/40 flex items-center justify-center">
                                    <Palette className="w-6 h-6 text-purple-400/50" />
                                  </div>
                                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                                  <span className="absolute bottom-1 left-0 right-0 text-center text-[10px] font-medium text-white drop-shadow-lg truncate px-1">
                                    {style.name}
                                  </span>
                                  {project?.style === style.name && (
                                    <div className="absolute top-1 right-1 w-4 h-4 bg-purple-500 rounded-full flex items-center justify-center">
                                      <Check className="w-2.5 h-2.5 text-white" />
                                    </div>
                                  )}
                                  {/* Edit button */}
                                  <div
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      setEditingStyleId(style._id);
                                      setCustomStyleName(style.name);
                                      setCustomStylePrompt(style.prompt);
                                      setShowCustomStyleForm(true);
                                    }}
                                    className="absolute bottom-1 right-1 w-5 h-5 bg-[#4A90E2]/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  >
                                    <Edit3 className="w-2.5 h-2.5 text-white" />
                                  </div>
                                  {/* Delete button */}
                                  <div
                                    role="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.preventDefault();
                                      deletePromptTemplate({ id: style._id });
                                      toast.success(`Style "${style.name}" deleted`);
                                    }}
                                    className="absolute top-1 left-1 w-4 h-4 bg-red-500/80 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer"
                                  >
                                    <X className="w-2.5 h-2.5 text-white" />
                                  </div>
                                </button>
                              ))}

                              {/* + Add Custom Style card */}
                              <button
                                onClick={() => setShowCustomStyleForm(true)}
                                className="group relative aspect-[4/3] rounded-lg overflow-hidden border-2 border-dashed border-[#3D3D3D] hover:border-[#4A90E2]/50 transition-all flex items-center justify-center"
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <Plus className="w-5 h-5 text-[#6E6E6E] group-hover:text-[#4A90E2] transition" />
                                  <span className="text-[10px] text-[#6E6E6E] group-hover:text-[#4A90E2] font-medium transition">Add Custom</span>
                                </div>
                              </button>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                    {duplicateCount > 0 && (
                      <div className="flex items-center gap-1 px-2 py-1 bg-[#FAAD14]/20 border border-[#FAAD14]/30 rounded-md">
                        <AlertTriangle className="w-3 h-3 text-[#FAAD14]" />
                        <span className="text-xs text-[#FAAD14] font-medium">
                          {duplicateCount} duplicate{duplicateCount > 1 ? 's' : ''}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={handleRemoveDuplicates}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-medium rounded-lg transition"
                      title="Remove duplicate storyboard items">
                      <Trash2 className="w-3.5 h-3.5" />
                      Remove Duplicates
                    </button>
                    <button onClick={() => setShowFileBrowser(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3D3D3D] hover:bg-[#2C2C2C] text-xs text-[#A0A0A0] rounded-lg transition">
                      <FolderOpen className="w-3.5 h-3.5" />
                      Files
                    </button>
                    <button onClick={() => setShowElementLibrary(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3D3D3D] hover:bg-[#2C2C2C] text-xs text-[#A0A0A0] rounded-lg transition">
                      <Users className="w-3.5 h-3.5" />
                      Elements
                    </button>
                    <button onClick={() => setShowExportModal(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-600 hover:bg-teal-500 text-xs text-white font-medium rounded-lg transition">
                      Export
                    </button>
                  </div>
                </div>
                <div 
                  className={`grid gap-4 ${project.settings.frameRatio === "9:16"
                    ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 xl:grid-cols-6"
                    : "grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5"}`}
                  style={{ 
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top left',
                    transition: 'transform 0.2s ease-in-out'
                  }}
                >
                  {filteredItems.map((item, i) => (
                    <div
                      key={item._id}
                      draggable={!itemsWithDialogOpen.has(item._id)}
                      onDragStart={(e) => handleDragStart(e, item._id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, item._id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, item._id)}
                      className={`
                        relative
                        ${itemsWithDialogOpen.has(item._id) ? 'cursor-default' : draggedItem === item._id ? 'opacity-50 cursor-grabbing' : 'cursor-grab'}
                        ${dragOverItem === item._id ? 'ring-2 ring-[#4A90E2] ring-opacity-50 rounded-xl' : ''}
                        transition-all duration-200
                      `}
                    >
                      <FrameCard
                        item={item}
                        index={i}
                        frameRatio={project.settings.frameRatio}
                        selected={selectedItemIds.includes(item._id)}
                        projectId={pid}
                        onSelect={() => setSelectedItemIds((prev) =>
                          prev.includes(item._id)
                            ? prev.filter((id) => id !== item._id)
                            : [...prev, item._id]
                        )}
                        onDelete={() => handleRemoveItem(item._id, item.title)}
                        onImageUploaded={(id, url) => handleImageUploaded(id, url)}
                        onSetPrimaryImage={(id, url) => handleSetPrimaryImage(id, url)}
                        onDoubleClick={() => handleDoubleClick(item)}
                        onDuplicate={() => duplicateItem(item)}
                        onTagsChange={(tags) => handleTagsChange(item._id, tags)}
                        onFavoriteToggle={() => handleFavoriteToggle(item._id)}
                        onStatusChange={(status) => handleStatusChange(item._id, status)}
                        onNotesChange={(notes) => handleNotesChange(item._id, notes)}
                        onTitleChange={(title) => handleTitleChange(item._id, title)}
                        onDescriptionChange={(description) => handleDescriptionChange(item._id, description)}
                        onImagePromptChange={(imagePrompt) => updateItem({ id: item._id, imagePrompt })}
                        onVideoPromptChange={(videoPrompt) => updateItem({ id: item._id, videoPrompt })}
                        onRemoveElement={(elementId) => handleRemoveElement(item._id, elementId)}
                        onAddElement={() => handleAddElement(item._id)}
                        onMoveUp={() => handleMoveUp(item._id)}
                        onMoveDown={() => handleMoveDown(item._id)}
                        totalItems={filteredItems?.length}
                        userId={user?.id || ""}
                        user={user}
                        onBuildStoryboard={() => setShowBuildDialog(true)}
                        onSetStoryboardUrl={(imageUrl) => handleSetStoryboardUrl(imageUrl)}
                        onClearStoryboardUrl={() => handleClearStoryboardUrl()}
                        projectStoryboardUrl={project?.imageUrl}
                        onDialogChange={(isOpen) => {
                          setItemsWithDialogOpen(prev => {
                            const next = new Set(prev);
                            if (isOpen) next.add(item._id);
                            else next.delete(item._id);
                            return next;
                          });
                        }}
                      />
                    </div>
                  ))}
                  {/* Add frame button */}
                  <button
                    disabled={isAddingFrame}
                    className="flex flex-col items-center justify-center border-2 border-dashed border-[#3D3D3D]/50 rounded-xl hover:border-[#4A90E2]/50 hover:bg-[#4A90E2]/5 transition-all duration-300 text-[#6E6E6E] hover:text-[#4A90E2] disabled:opacity-50 disabled:cursor-not-allowed group"
                    style={{ aspectRatio: project.settings.frameRatio === "9:16" ? "9/16" : project.settings.frameRatio === "1:1" ? "1/1" : "16/9" }}
                    onClick={async () => {
                      if (isAddingFrame) return;
                      setIsAddingFrame(true);
                      try {
                        await createItem({
                          projectId: pid,
                          // ✅ Remove companyId - calculated on server from auth context
                          sceneId: `manual-${Date.now()}`,
                          order: (items?.length ?? 0),
                          title: `Frame ${(items?.length ?? 0) + 1}`,
                          description: "",
                          duration: 5,
                          generatedBy: user?.id || "unknown"
                        });
                      } finally { setIsAddingFrame(false); }
                    }}>
                    {isAddingFrame
                      ? <Loader2 className="w-6 h-6 mb-1 animate-spin" />
                      : <Plus className="w-6 h-6 mb-1 group-hover:scale-110 transition-transform" />}
                    <span className="text-xs font-medium">{isAddingFrame ? "Adding…" : "Add Frame"}</span>
                    <span className="text-xs text-[#A0A0A0] mt-1">Create manually</span>
                  </button>
                </div>
              </>
            )}
            </div>
          </div>
        )}

        {/* ═══ TABLE VIEW ═══ */}
        {tab === "table" && (
          <div className="flex-1 overflow-auto p-6">
            {!items || items.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <List className="w-12 h-12 text-[#6E6E6E] mb-4" />
                <p className="text-[#A0A0A0] font-medium mb-2">No frames yet</p>
                <div className="flex items-center gap-3 mt-4">
                  <button onClick={() => setTab("script")} className="flex items-center gap-2 px-4 py-2 bg-[#4A90E2] hover:bg-[#357ABD] text-white text-sm font-medium rounded-lg transition">
                    <FileText className="w-4 h-4" /> Go to Script
                  </button>
                  <button
                    disabled={isAddingFrame}
                    onClick={async () => {
                      if (isAddingFrame) return;
                      setIsAddingFrame(true);
                      try {
                        await createItem({
                          projectId: pid,
                          sceneId: `manual-${Date.now()}`,
                          order: 0,
                          title: "Frame 1",
                          description: "",
                          duration: 5,
                          generatedBy: user?.id || "unknown"
                        });
                      } finally { setIsAddingFrame(false); }
                    }}
                    className="flex items-center gap-2 px-4 py-2 border border-[#3D3D3D] hover:border-[#4A90E2]/50 hover:bg-[#4A90E2]/10 text-[#A0A0A0] hover:text-white text-sm font-medium rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed">
                    {isAddingFrame ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                    {isAddingFrame ? "Creating..." : "Create Frame"}
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-[#3D3D3D] text-left">
                      {["#", "Image", "Title", "Description", "Tags", "Elements", "Image Prompt", "Video Prompt", "Status", "Fav", "Actions"].map(h => (
                        <th key={h} className="px-3 py-3 text-[11px] font-semibold text-[#6E6E6E] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredItems.map((item, i) => (
                      <tr
                        key={item._id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, item._id)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => handleDragOver(e, item._id)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, item._id)}
                        className={`border-b border-[#2C2C2C] hover:bg-[#2C2C2C]/50 transition group cursor-move ${
                          draggedItem === item._id ? "opacity-40" : ""
                        } ${dragOverItem === item._id ? "border-t-2 border-t-teal-500" : ""}`}
                      >
                        {/* Order + drag handle */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-1">
                            <GripVertical className="w-3 h-3 text-[#4A4A4A] group-hover:text-[#6E6E6E] transition" />
                            <span className="text-xs font-mono text-[#6E6E6E] w-6">{String(item.order + 1).padStart(2, "0")}</span>
                            <div className="flex flex-col opacity-0 group-hover:opacity-100 transition">
                              <button onClick={(e) => { e.stopPropagation(); handleMoveUp(item._id); }} disabled={i === 0} className="text-[#6E6E6E] hover:text-white disabled:opacity-20 p-0.5"><ChevronUp className="w-3 h-3" /></button>
                              <button onClick={(e) => { e.stopPropagation(); handleMoveDown(item._id); }} disabled={i === filteredItems.length - 1} className="text-[#6E6E6E] hover:text-white disabled:opacity-20 p-0.5"><ChevronDown className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </td>
                        {/* Image */}
                        <td className="px-3 py-3">
                          <div className="w-16 h-10 rounded-lg overflow-hidden bg-[#2C2C2C] border border-[#3D3D3D] cursor-pointer" onClick={() => handleDoubleClick(item)}>
                            {item.imageUrl ? (
                              <img src={item.imageUrl} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center"><ImageIcon className="w-4 h-4 text-[#6E6E6E]" /></div>
                            )}
                          </div>
                        </td>
                        {/* Title */}
                        <td className="px-3 py-3 max-w-[160px]">
                          <input
                            type="text"
                            defaultValue={item.title}
                            onBlur={(e) => handleTitleChange(item._id, e.target.value)}
                            onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                            className="w-full bg-transparent text-sm text-white border-b border-transparent hover:border-[#3D3D3D] focus:border-[#4A90E2] outline-none py-0.5 transition"
                          />
                        </td>
                        {/* Description */}
                        <td className="px-3 py-3 max-w-[220px]">
                          <button
                            onClick={() => { setTableEditField({ itemId: item._id, field: "description", value: item.description || "" }); }}
                            className="w-full text-left text-xs text-[#A0A0A0] hover:text-white transition truncate py-0.5 cursor-text"
                            title={item.description || "Click to edit"}
                          >
                            {item.description ? item.description.slice(0, 60) + (item.description.length > 60 ? "..." : "") : <span className="text-[#4A4A4A] italic">Add description...</span>}
                          </button>
                        </td>
                        {/* Tags — uses same system as FrameCard */}
                        <td className="px-3 py-3">
                          <div className="relative">
                            <div
                              className="flex flex-wrap gap-1 max-w-[160px] cursor-pointer hover:opacity-80 transition"
                              onClick={(e) => { e.stopPropagation(); setTableTagEditorId(tableTagEditorId === item._id ? null : item._id); }}
                            >
                              {item.tags && item.tags.length > 0 ? (
                                <>
                                  {item.tags.slice(0, 3).map((tag: any) => (
                                    <span
                                      key={tag.id}
                                      className="text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                      style={{
                                        backgroundColor: tag.color + "25",
                                        color: tag.color,
                                        border: `1px solid ${tag.color}30`,
                                      }}
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                  {item.tags.length > 3 && (
                                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-gray-700/50 text-gray-400 border border-gray-600/30">
                                      +{item.tags.length - 3}
                                    </span>
                                  )}
                                </>
                              ) : (
                                <span className="text-[10px] text-[#6E6E6E] hover:text-[#A0A0A0]">+ Tags</span>
                              )}
                            </div>
                            {tableTagEditorId === item._id && (
                              <>
                                <div className="fixed inset-0 z-40" onClick={() => setTableTagEditorId(null)} />
                                <div className="absolute top-full left-0 mt-1 bg-(--bg-secondary) border border-(--border-primary) rounded-xl z-50 shadow-xl w-64">
                                  <TagEditorInline
                                    selectedTags={item.tags || []}
                                    onTagsChange={(tags) => handleTagsChange(item._id, tags)}
                                    onClose={() => setTableTagEditorId(null)}
                                  />
                                </div>
                              </>
                            )}
                          </div>
                        </td>
                        {/* Elements — supports both elementNames (new) and linkedElements (legacy) */}
                        <td className="px-3 py-3">
                          <div className="flex flex-wrap gap-1 max-w-[170px] items-center">
                            {/* New format: elementNames */}
                            {item.elementNames?.characters?.map((name: string, idx: number) => (
                              <span key={`c-${idx}`} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-purple-600/30 text-purple-300 border border-purple-500/30">{name}</span>
                            ))}
                            {item.elementNames?.environments?.map((name: string, idx: number) => (
                              <span key={`e-${idx}`} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-600/30 text-emerald-300 border border-emerald-500/30">{name}</span>
                            ))}
                            {item.elementNames?.props?.map((name: string, idx: number) => (
                              <span key={`p-${idx}`} className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-blue-600/30 text-blue-300 border border-blue-500/30">{name}</span>
                            ))}
                            {/* Legacy format: linkedElements */}
                            {(item.linkedElements || []).map((el: any) => (
                              <span key={el.id} className={`px-1.5 py-0.5 rounded-full text-[9px] font-medium border ${
                                el.type === "character" ? "bg-purple-600/30 text-purple-300 border-purple-500/30" :
                                el.type === "environment" ? "bg-emerald-600/30 text-emerald-300 border-emerald-500/30" :
                                "bg-blue-600/30 text-blue-300 border-blue-500/30"
                              }`}>{el.name}</span>
                            ))}
                            <button
                              onClick={(e) => { e.stopPropagation(); handleAddElement(item._id); }}
                              className="text-[10px] text-[#6E6E6E] hover:text-purple-400 transition px-1"
                              title="Add element"
                            >
                              + Add
                            </button>
                          </div>
                        </td>
                        {/* Image Prompt */}
                        <td className="px-3 py-3 max-w-[180px]">
                          <button
                            onClick={() => { setTableEditField({ itemId: item._id, field: "imagePrompt", value: item.imagePrompt || "" }); }}
                            className="w-full text-left text-[11px] text-[#A0A0A0] hover:text-white transition truncate py-0.5 font-mono cursor-text"
                            title={item.imagePrompt || "Click to edit"}
                          >
                            {item.imagePrompt ? item.imagePrompt.slice(0, 40) + (item.imagePrompt.length > 40 ? "..." : "") : <span className="text-[#4A4A4A] italic">Image prompt...</span>}
                          </button>
                        </td>
                        {/* Video Prompt */}
                        <td className="px-3 py-3 max-w-[180px]">
                          <button
                            onClick={() => { setTableEditField({ itemId: item._id, field: "videoPrompt", value: item.videoPrompt || "" }); }}
                            className="w-full text-left text-[11px] text-[#A0A0A0] hover:text-white transition truncate py-0.5 font-mono cursor-text"
                            title={item.videoPrompt || "Click to edit"}
                          >
                            {item.videoPrompt ? item.videoPrompt.slice(0, 40) + (item.videoPrompt.length > 40 ? "..." : "") : <span className="text-[#4A4A4A] italic">Video prompt...</span>}
                          </button>
                        </td>
                        {/* Status */}
                        <td className="px-3 py-3">
                          <select
                            value={item.frameStatus || "draft"}
                            onChange={(e) => handleStatusChange(item._id, e.target.value)}
                            className="bg-[#2C2C2C] border border-[#3D3D3D] rounded px-2 py-1 text-[10px] text-[#A0A0A0] outline-none focus:border-[#4A90E2] transition cursor-pointer"
                          >
                            <option value="draft">Draft</option>
                            <option value="in-progress">In Progress</option>
                            <option value="completed">Completed</option>
                          </select>
                        </td>
                        {/* Favorite */}
                        <td className="px-3 py-3">
                          <button onClick={() => handleFavoriteToggle(item._id)} className="p-1 transition">
                            <Star className={`w-3.5 h-3.5 ${item.isFavorite ? "fill-yellow-400 text-yellow-400" : "text-[#6E6E6E] hover:text-yellow-400"}`} />
                          </button>
                        </td>
                        {/* Actions */}
                        <td className="px-3 py-3">
                          <div className="flex items-center gap-2">
                            <button onClick={() => duplicateItem(item)} className="p-1.5 text-[#6E6E6E] hover:text-white hover:bg-[#2C2C2C] rounded transition" title="Duplicate"><Copy className="w-3.5 h-3.5" /></button>
                            <button onClick={() => handleRemoveItem(item._id, item.title)} className="p-1.5 text-[#6E6E6E] hover:text-red-400 hover:bg-red-500/10 rounded transition" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
      {showElementLibrary && (
        <ElementLibrary
          projectId={pid}
          userId={user?.id ?? "unknown"}
          user={user}
          initialCreateDraft={elementLibraryDraft}
          selectedItemId={selectedItemForElement}
          imageSelectionMode={true}
          onSelectImage={(imageUrl, elementName, element) => {
            // Handle image selection from element
            console.log('Element image selected:', { imageUrl, elementName, element });
            // Don't close the library - let user select more elements
            // You can add logic here to handle the selected image
          }}
          onClose={() => {
            setShowElementLibrary(false);
            setElementLibraryDraft(null);
            setSelectedItemForElement(null);
          }}
          onSelectElement={(urls, name, element) => {
            if (selectedItemForElement) {
              // Add element name to the appropriate category in the storyboard item
              const currentItem = items?.find(item => item._id === selectedItemForElement);
              const currentElementNames = currentItem?.elementNames || {
                characters: [],
                environments: [],
                props: []
              };
              
              let updatedElementNames = { ...currentElementNames };
              
              // Add element name to the correct category based on element type
              switch (element.type) {
                case 'character':
                  if (!updatedElementNames.characters.includes(name)) {
                    updatedElementNames.characters = [...updatedElementNames.characters, name];
                  }
                  break;
                case 'environment':
                  if (!updatedElementNames.environments.includes(name)) {
                    updatedElementNames.environments = [...updatedElementNames.environments, name];
                  }
                  break;
                case 'prop':
                  if (!updatedElementNames.props.includes(name)) {
                    updatedElementNames.props = [...updatedElementNames.props, name];
                  }
                  break;
                default:
                  // For other types, add to props as fallback
                  if (!updatedElementNames.props.includes(name)) {
                    updatedElementNames.props = [...updatedElementNames.props, name];
                  }
              }
              
              // Update the storyboard item with the new element names
              updateItem({
                id: selectedItemForElement as Id<"storyboard_items">,
                elementNames: updatedElementNames
              });
              
              console.log(`[Workspace] Added element "${name}" (${element.type}) to item ${selectedItemForElement}`, {
                elementNames: updatedElementNames
              });
            }
            
            // Keep the existing characterRef behavior for compatibility
            setCharacterRef({ name, urls });
            // Don't close the library - let user select more elements
          }}
        />
      )}
      {showFileBrowser && (
        <FileBrowser
          projectId={pid}
          onClose={() => setShowFileBrowser(false)}
        />
      )}
      {/* Table Edit Dialog */}
      {tableEditField && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setTableEditField(null)}>
          <div className="bg-[#1A1A1A] border border-[#3D3D3D] rounded-2xl w-full max-w-lg mx-4 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between p-5 border-b border-[#2C2C2C]">
              <h3 className="text-sm font-semibold text-white">Edit {tableEditField.field === "imagePrompt" ? "Image Prompt" : tableEditField.field === "videoPrompt" ? "Video Prompt" : "Description"}</h3>
              <button onClick={() => setTableEditField(null)} className="text-[#6E6E6E] hover:text-white transition"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={(e) => {
              e.preventDefault();
              const form = e.target as HTMLFormElement;
              const val = (form.elements.namedItem("editValue") as HTMLTextAreaElement).value;
              const id = tableEditField.itemId as any;
              if (tableEditField.field === "description") handleDescriptionChange(id, val);
              else if (tableEditField.field === "imagePrompt") updateItem({ id, imagePrompt: val });
              else if (tableEditField.field === "videoPrompt") updateItem({ id, videoPrompt: val });
              setTableEditField(null);
            }}>
              <div className="p-5">
                <textarea
                  name="editValue"
                  autoFocus
                  rows={6}
                  defaultValue={tableEditField.value}
                  className="w-full bg-[#2C2C2C] border border-[#3D3D3D] rounded-xl px-4 py-3 text-sm text-white placeholder-[#6E6E6E] outline-none focus:border-[#4A90E2] transition resize-none"
                  placeholder={`Enter ${tableEditField.field}...`}
                  onKeyDown={(e) => { if (e.key === "Escape") setTableEditField(null); }}
                />
              </div>
              <div className="flex justify-end gap-3 p-5 border-t border-[#2C2C2C]">
                <button type="button" onClick={() => setTableEditField(null)} className="px-4 py-2 text-sm text-[#A0A0A0] hover:text-white transition">Cancel</button>
                <button type="submit" className="px-4 py-2 text-sm font-semibold bg-[#4A90E2] hover:bg-[#357ABD] text-white rounded-lg transition">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showExportModal && items && project && (
        <WorkspaceExportModal
          projectName={project.name}
          script={project.script ?? ""}
          items={items}
          frameRatio={project.settings.frameRatio}
          onClose={() => setShowExportModal(false)}
        />
      )}
      {showSceneEditor && selectedSceneItem && (
        <SceneEditor
          key={selectedSceneItem._id}
          shots={(items || []).map((item) => ({
              id: item._id,
              scene: 1,
              shot: Number(item.order ?? 1),
              title: item.title,
              description: item.description || "",
              ert: "",
              shotSize: "",
              perspective: "",
              movement: "",
              equipment: "",
              focalLength: "",
              imageUrl: item.imageUrl,
              videoUrl: item.videoUrl,
              imagePrompt: item.imagePrompt,
              videoPrompt: item.videoPrompt,
              duration: item.duration,
              aspectRatio: project.settings.frameRatio,
              order: item.order,
              dialogue: [],
              cast: [],
              voiceOver: "",
              action: "",
              bgDescription: item.description || "",
              characters: [],
              location: "",
              notes: "",
              mood: "",
              lighting: "",
              camera: [],
              sound: [],
              props: [],
              wardrobe: [],
              makeup: [],
              editing: "",
              vfx: "",
              colorGrade: "",
              music: "",
              sfx: [],
              transition: "",
              specialInstructions: "",
              comments: [],
              tags: [],
            } as Shot))}
          initialShotId={selectedSceneItem._id}
          onClose={handleCloseSceneEditor}
          onSaveImageAsElement={({ imageUrl, name, type }) => {
            setElementLibraryDraft({
              imageUrls: [imageUrl],
              name,
              type,
            });
            setShowElementLibrary(true);
          }}
          onSaveSelectedImageToItem={async (imageUrl, itemId) => {
            await updateItem({
              id: itemId as Id<"storyboard_items">,
              imageUrl,
            });
            setSelectedSceneItem((prev: any) => prev ? { ...prev, imageUrl } : prev);
          }}
          onShotsChange={(shots) => {
            // Update the item if needed
            console.log("Scene updated:", shots);
          }}
          // R2 and Element Library props
          projectId={pid}
          userId={user?.id}
          user={user}
          userCompanyId={currentCompanyId}
          onNavigateToShot={(shotId) => {
            const targetItem = (items || []).find(item => item._id === shotId);
            if (targetItem) {
              setSelectedSceneItem(targetItem);
            }
          }}
        />
      )}
      
      {/* Notification Component */}
      {notification && notification.visible && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border transition-all transform ${
          notification.type === 'warning' 
            ? 'bg-yellow-50 border-yellow-200 text-yellow-800' 
            : notification.type === 'error'
            ? 'bg-red-50 border-red-200 text-red-800'
            : 'bg-green-50 border-green-200 text-green-800'
        }`}>
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              {notification.type === 'warning' && <AlertTriangle className="w-5 h-5" />}
              {notification.type === 'error' && <AlertTriangle className="w-5 h-5" />}
              {notification.type === 'success' && <CheckCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-sm">{notification.title}</h4>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
            <button
              onClick={() => setNotification(null)}
              className="flex-shrink-0 p-1 hover:bg-black/10 rounded-md transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
      <BuildStoryboardDialogSimplified
        open={showBuildDialog}
        onOpenChange={setShowBuildDialog}
        projectId={pid}
        onSuccess={() => {
          console.log("Build started successfully!");
        }}
      />
    </div>
  );
}

// ── Inline Tag Editor Component ──────────────────────────────────────────────
interface TagEditorInlineProps {
  selectedTags: Array<{ id: string; name: string; color: string }>;
  onTagsChange: (tags: Array<{ id: string; name: string; color: string }>) => void;
  onClose: () => void;
}

function TagEditorInline({ selectedTags, onTagsChange, onClose }: TagEditorInlineProps) {
  const [customTagName, setCustomTagName] = useState("");
  
  // Import SIMPLE_TAGS and TAG_COLORS from constants
  const SIMPLE_TAGS = [
    { id: "action", name: "Action", color: "#ef4444" },
    { id: "dialogue", name: "Dialogue", color: "#f97316" },
    { id: "dramatic", name: "Dramatic", color: "#eab308" },
    { id: "close-up", name: "Close Up", color: "#22c55e" },
    { id: "wide", name: "Wide", color: "#3b82f6" },
    { id: "interior", name: "Interior", color: "#8b5cf6" },
    { id: "exterior", name: "Exterior", color: "#ec4899" },
    { id: "day", name: "Day", color: "#06b6d4" },
    { id: "night", name: "Night", color: "#6366f1" },
    { id: "montage", name: "Montage", color: "#a855f7" }
  ];
  
  const TAG_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#3b82f6", "#8b5cf6", "#ec4899", "#06b6d4"];
  
  const availableTags = SIMPLE_TAGS.filter(tag =>
    !selectedTags.some(selected => selected.id === tag.id)
  );

  const addTag = (tag: { id: string; name: string; color: string }) => {
    onTagsChange([...selectedTags, tag]);
  };

  const removeTag = (tagId: string) => {
    onTagsChange(selectedTags.filter(tag => tag.id !== tagId));
  };

  const addCustomTag = () => {
    if (customTagName.trim()) {
      const newTag = {
        id: `custom-${Date.now()}`,
        name: customTagName.trim(),
        color: TAG_COLORS[selectedTags.length % TAG_COLORS.length]
      };
      addTag(newTag);
      setCustomTagName("");
    }
  };

  return (
    <div className="max-h-[400px] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-(--border-primary) sticky top-0 bg-(--bg-secondary) z-10">
        <h3 className="text-(--text-primary) text-sm font-bold">Edit Tags</h3>
        <button onClick={onClose} className="text-(--text-secondary) hover:text-(--text-primary) transition-all duration-200">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Custom Tag Input */}
      <div className="p-3 border-b border-white/10">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add custom tag..."
            value={customTagName}
            onChange={(e) => setCustomTagName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCustomTag()}
            className="flex-1 bg-(--bg-primary) border border-(--border-primary) rounded-xl px-2 py-1.5 text-(--text-primary) text-xs focus:outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
          />
          <button
            onClick={addCustomTag}
            disabled={!customTagName.trim()}
            className="px-2 py-1.5 bg-violet-600 hover:bg-violet-500 disabled:bg-white/10 disabled:text-gray-500 rounded-lg text-white text-xs font-medium transition"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Selected Tags */}
      {selectedTags.length > 0 && (
        <div className="p-3 border-b border-white/10">
          <h4 className="text-gray-400 text-xs font-medium mb-2">Selected</h4>
          <div className="flex flex-wrap gap-1.5">
            {selectedTags.map((tag) => (
              <span
                key={tag.id}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium"
                style={{ 
                  backgroundColor: tag.color + '25', 
                  color: tag.color,
                  border: `1px solid ${tag.color}30`
                }}
              >
                {tag.name}
                <button onClick={() => removeTag(tag.id)} className="ml-0.5 hover:opacity-70 transition">
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Available Tags */}
      <div className="p-3">
        <h4 className="text-gray-400 text-xs font-medium mb-2">Available Tags</h4>
        <div className="flex flex-wrap gap-1.5">
          {availableTags.length > 0 ? (
            availableTags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => addTag(tag)}
                className="px-2 py-1 rounded-full text-xs font-medium transition-all duration-200 hover:scale-105 border border-white/20 hover:border-white/40"
                style={{ 
                  backgroundColor: tag.color + '25', 
                  color: tag.color
                }}
              >
                {tag.name}
              </button>
            ))
          ) : (
            <p className="text-gray-500 text-xs">All tags selected</p>
          )}
        </div>
      </div>
    </div>
  );
}

interface FrameCardProps {
  item: { _id: string; title: string; description?: string; imageUrl?: string; videoUrl?: string; duration: number; generationStatus: string; order: number; tags?: Array<{ id: string; name: string; color: string }>; isFavorite?: boolean; frameStatus?: string; notes?: string; imagePrompt?: string; videoPrompt?: string; linkedElements?: Array<{ id: string; name: string; type: string }> };
  index: number;
  frameRatio: string;
  selected: boolean;
  projectId: string;
  onSelect: () => void;
  onDelete: () => void;
  onImageUploaded: (id: string, url: string) => void;
  onSetPrimaryImage: (id: string, url: string) => void;
  onDoubleClick: (item: any) => void;
  onDuplicate: (item: any) => void;
  onTagsChange: (tags: any) => void;
  onFavoriteToggle: (id: string) => void;
  onStatusChange: (status: string) => void;
  onNotesChange: (notes: string) => void;
  onTitleChange: (title: string) => void;
  onDescriptionChange: (description: string) => void;
  onImagePromptChange: (imagePrompt: string) => void;
  onVideoPromptChange: (videoPrompt: string) => void;
  onRemoveElement: (elementId: string) => void;
  onAddElement: () => void;
  onMoveUp?: (itemId: string) => void;
  onMoveDown?: (itemId: string) => void;
  totalItems?: number;
  userId: string;
  user?: any; // Full user object for upload functionality
  // Build dialog props
  onBuildStoryboard?: () => void;
  // NEW: Storyboard URL functionality
  onSetStoryboardUrl?: (imageUrl: string) => void;
  onClearStoryboardUrl?: () => void;
  projectStoryboardUrl?: string; // To show if this frame's image is the storyboard URL
  onDialogChange?: (isOpen: boolean) => void; // Notify parent when a dialog opens/closes (disables drag)
}

function FrameCard({ item, index, frameRatio, selected, projectId, onSelect, onDelete, onImageUploaded, onSetPrimaryImage, onDoubleClick, onDuplicate, onTagsChange, onFavoriteToggle, onStatusChange, onNotesChange, onTitleChange, onDescriptionChange, onImagePromptChange, onVideoPromptChange, onRemoveElement, onAddElement, onMoveUp, onMoveDown, totalItems, userId, user, onBuildStoryboard, onSetStoryboardUrl, onClearStoryboardUrl, projectStoryboardUrl, onDialogChange }: FrameCardProps) {
  const [uploading, setUploading] = useState(false);
  const [showTagEditor, setShowTagEditor] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showPromptDialog, setShowPromptDialog] = useState(false);
  const [newTitle, setNewTitle] = useState(item.title);
  const [newDescription, setNewDescription] = useState(item.description || "");
  const [newImagePrompt, setNewImagePrompt] = useState(item.imagePrompt || "");
  const [newVideoPrompt, setNewVideoPrompt] = useState(item.videoPrompt || "");
  const [promptTab, setPromptTab] = useState<'image' | 'video'>('image');

  // Notify parent when any dialog is open (to disable drag)
  const hasDialogOpen = showEditDialog || showPromptDialog || showNotesModal || showTagEditor;
  const onDialogChangeRef = useRef(onDialogChange);
  onDialogChangeRef.current = onDialogChange;
  useEffect(() => {
    onDialogChangeRef.current?.(hasDialogOpen);
  }, [hasDialogOpen]);
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const companyId = useCurrentCompanyId();
  const [showFrameFileBrowser, setShowFrameFileBrowser] = useState(false);

  // Frame status configuration
  const FRAME_STATUS_CONFIG = {
    'draft': { label: 'Draft', color: 'bg-gray-500' },
    'in-progress': { label: 'In Progress', color: 'bg-blue-500' },
    'completed': { label: 'Completed', color: 'bg-green-500' }
  };

  const statusConfig = item.frameStatus ? FRAME_STATUS_CONFIG[item.frameStatus as keyof typeof FRAME_STATUS_CONFIG] : null;

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const effectiveCompanyId = companyId || userId;
      const r2Key = `${effectiveCompanyId}/uploads/${item._id}-${Date.now()}-${file.name}`;
      const sigRes = await fetch("/api/storyboard/r2-upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: r2Key, contentType: file.type, companyId: effectiveCompanyId }),
      });
      const { uploadUrl, publicUrl } = await sigRes.json();
      // Debug: Log the upload URL for manual testing
      console.log("[Upload Debug] Upload URL:", uploadUrl);
      console.log("[Upload Debug] File type:", file.type);
      console.log("[Upload Debug] File size:", file.size);

      const uploadResponse = await fetch(uploadUrl, { 
        method: "PUT", 
        body: file, 
        headers: { "Content-Type": file.type },
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });
      
      if (!uploadResponse.ok) {
        const errorText = await uploadResponse.text();
        console.error("[R2 Upload Error]", uploadResponse.status, errorText);
        throw new Error(`Upload failed: ${uploadResponse.status} ${errorText}`);
      }
      
      console.log("[R2 Upload Success]", uploadUrl);
      onImageUploaded(item._id, publicUrl);
      await logUpload({
        projectId: projectId as Id<"storyboard_projects">,
        // ✅ Remove companyId - calculated on server from auth context
        r2Key,
        filename: file.name,
        fileType: file.type.startsWith("video") ? "video" : "image",
        mimeType: file.type,
        size: file.size,
        category: "uploads",
        tags: [],
        uploadedBy: userId,
        status: "ready",
      });
    } catch (err) {
      console.error("[FrameCard upload]", err);
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };
  const ratio = frameRatio === "9:16" ? "9/16" : frameRatio === "1:1" ? "1/1" : "16/9";
  
  // Format duration display
  const formatDuration = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  return (
    <div onClick={onSelect} onDoubleClick={onDoubleClick}
      className={`relative group cursor-pointer overflow-hidden rounded-2xl border transition-all duration-300 shadow-sm
        ${selected 
          ? "border-[#4A90E2]/50 ring-2 ring-[#4A90E2]/20 shadow-[#4A90E2]/10" 
          : "border-(--border-primary) hover:border-(--accent-blue) hover:shadow-md"}`}>
      {/* Media area */}
      <div className="bg-(--bg-primary)" style={{ aspectRatio: ratio }}>
        {item.videoUrl ? (
          <>
            <video src={item.videoUrl} className="w-full h-full object-cover" />
            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/30 via-transparent to-black/20" />
          </>
        ) : item.imageUrl ? (
          <>
            <img src={item.imageUrl} alt={item.title} className="w-full h-full object-cover" />
            {/* Subtle vignette effect */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/20 via-transparent to-transparent" />
            
            {/* Action Buttons - Show on hover */}
            {item.imageUrl && (
              <div className="absolute bottom-2 right-2 z-10 opacity-0 group-hover:opacity-100 transition-all duration-300 flex gap-2">
                {/* Remove Image Button - Show if this frame IS the storyboard URL */}
                {projectStoryboardUrl === item.imageUrl && onClearStoryboardUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onClearStoryboardUrl();
                    }}
                    className="bg-(--color-error)/90 backdrop-blur-sm rounded-full p-1.5 border border-white/20 hover:bg-(--color-error) transition-all duration-200 shadow-lg"
                    title="Remove Image"
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                )}
                
                {/* Set as Storyboard URL Button - Show if this frame is NOT the storyboard URL */}
                {projectStoryboardUrl !== item.imageUrl && onSetStoryboardUrl && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSetStoryboardUrl(item.imageUrl!);
                    }}
                    className="bg-(--bg-secondary)/90 backdrop-blur-sm rounded-full p-1.5 border border-(--border-primary) hover:bg-(--bg-primary) transition-all duration-200 shadow-lg"
                    title="Set as Storyboard URL"
                  >
                    <Image className="w-3 h-3 text-(--text-secondary)" />
                  </button>
                )}
              </div>
            )}
          </>
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
              <ImageIcon className="w-6 h-6 text-gray-600" />
            </div>
            <span className="text-xs text-gray-500">No media</span>
            <button
              onClick={() => setShowFrameFileBrowser(true)}
              className="flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/8 rounded-lg cursor-pointer transition-all duration-200"
            >
              <FolderOpen className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400">Browse Files</span>
            </button>
          </div>
        )}
        
        {/* Move controls - Top left corner, only show on hover */}
        <div className="absolute top-2 left-2 flex gap-1 z-20 opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105">
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onMoveUp?.(item._id); 
            }}
            className="p-1.5 bg-(--bg-secondary)/90 backdrop-blur-sm border border-(--border-primary) rounded-xl hover:bg-(--bg-primary) disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            disabled={item.order === 0}
            title="Move up"
          >
            <ChevronUp className="w-4 h-4 text-(--text-secondary)" />
          </button>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              onMoveDown?.(item._id); 
            }}
            className="p-1.5 bg-(--bg-secondary)/90 backdrop-blur-sm border border-(--border-primary) rounded-xl hover:bg-(--bg-primary) disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg"
            disabled={item.order === (totalItems ?? 1) - 1}
            title="Move down"
          >
            <ChevronDown className="w-4 h-4 text-(--text-secondary)" />
          </button>
        </div>

        {/* Top overlay with refined badges */}
        <div className="absolute top-0 left-0 right-0 bg-gradient-to-b from-black/70 via-black/30 to-transparent p-3">
          <div className="flex items-start justify-between">
            {/* Left side - Frame number, status, and tags */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <div className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10">
                  <span className="text-xs text-white font-medium tracking-wide">
                    {String(item.order + 1).padStart(2, "0")}
                  </span>
                </div>
                
                {/* NEW: Status Badge - Always visible with relative container */}
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowStatusMenu(!showStatusMenu); }}
                    className={`px-2 py-1 rounded-full text-xs font-medium text-white transition ${
                      statusConfig 
                        ? `${statusConfig.color} hover:opacity-80` 
                        : 'bg-gray-600/60 hover:bg-gray-600/80 border border-gray-500/30'
                    }`}
                  >
                    {statusConfig ? statusConfig.label : 'Set Status'}
                  </button>
                  
                  {/* Status Dropdown - Positioned directly below button */}
                  {showStatusMenu && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setShowStatusMenu(false)} />
                      <div 
                        className="absolute top-full left-0 mt-1 bg-(--bg-secondary) rounded-xl border border-(--border-primary) shadow-lg z-50 min-w-[140px]"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="p-1">
                          {Object.entries(FRAME_STATUS_CONFIG).map(([key, config]) => (
                            <button
                              key={key}
                              onClick={() => {
                                onStatusChange?.(key as 'draft' | 'in-progress' | 'completed');
                                setShowStatusMenu(false);
                              }}
                              className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-all duration-200 hover:bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary) text-left ${
                                item.frameStatus === key ? 'bg-(--bg-tertiary) text-(--text-primary)' : ''
                              }`}
                            >
                              <div className={`w-2 h-2 rounded-full ${config.color}`} />
                              {config.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Tags section - Below frame number and status */}
              <div className="relative z-30">
                <div 
                  className="flex flex-wrap gap-1 items-center cursor-pointer group"
                  onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowTagEditor(!showTagEditor);
                  }}
                >
                  {item.tags && item.tags.length > 0 ? (
                    <>
                      {item.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag.id}
                          className="text-xs px-1.5 py-0.5 rounded-full font-medium transition-all duration-200 hover:scale-105"
                          style={{ 
                            backgroundColor: tag.color + '25', 
                            color: tag.color,
                            border: `1px solid ${tag.color}30`
                          }}
                        >
                          {tag.name}
                        </span>
                      ))}
                      {item.tags.length > 3 && (
                        <span className="text-xs px-1.5 py-0.5 rounded-full bg-gray-700/50 text-gray-400 font-medium border border-gray-600/30">
                          +{item.tags.length - 3}
                        </span>
                      )}
                    </>
                  ) : (
                    <span className="text-xs text-gray-400 hover:text-gray-300 transition-colors">
                      + Tags
                    </span>
                  )}
                </div>
                
                {/* Tag Editor - Dropdown positioned below tags */}
                {showTagEditor && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowTagEditor(false)} />
                    <div className="absolute top-full left-0 mt-1 bg-(--bg-secondary) border border-(--border-primary) rounded-xl z-50 shadow-xl w-64">
                      <TagEditorInline
                        selectedTags={item.tags || []}
                        onTagsChange={onTagsChange}
                        onClose={() => setShowTagEditor(false)}
                      />
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Right side - Duration, primary indicator, and favorite in top corner */}
            <div className="absolute top-2 right-2 flex items-center gap-2">
              {/* Duration badge */}
              <div className="bg-black/40 backdrop-blur-md rounded-full px-2.5 py-1 border border-white/10 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-gray-300" />
                <span className="text-xs text-gray-200 font-medium">{formatDuration(item.duration)}</span>
              </div>

              {/* Primary image indicator - Only show if this frame IS the storyboard URL AND there IS a primary URL */}
              {projectStoryboardUrl && projectStoryboardUrl === item.imageUrl && (
                <div className="bg-blue-500/90 backdrop-blur-sm rounded-lg border border-white/20 shadow-lg flex items-center justify-center w-6 h-6">
                  <ImageIcon className="w-3.5 h-3.5 text-white" />
                </div>
              )}

              {/* Favorite button */}
              {onFavoriteToggle && (
                <FrameFavoriteButton
                  frameId={item._id}
                  isFavorite={item.isFavorite || false}
                  size="sm"
                />
              )}
            </div>
          </div>
        </div>
        
        {/* Generation status overlays */}
        {item.generationStatus === "generating" && (
          <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center gap-3 backdrop-blur-sm">
            <div className="w-12 h-12 rounded-full bg-purple-600/20 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
            </div>
            <span className="text-sm text-purple-300 font-medium">Generating…</span>
          </div>
        )}
        {item.generationStatus === "failed" && (
          <div className="absolute bottom-8 left-0 right-0 flex justify-center">
            <div className="bg-red-600/90 backdrop-blur-sm px-3 py-1.5 rounded-full">
              <span className="text-xs text-white font-medium">Failed</span>
            </div>
          </div>
        )}
        
        {/* Element badges - Overlay with z-index */}
        <div className="absolute bottom-36 left-2 right-2 flex flex-wrap gap-1.5 pointer-events-none z-10">
          <div className="flex flex-wrap gap-1.5">
            {/* Display elements from elementNames */}
            {item.elementNames && (
              <>
                {/* Characters */}
                {item.elementNames.characters?.map((elementName, index) => (
                  <div
                    key={`character-${index}`}
                    className="group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border bg-purple-600/80 border-purple-500/30 text-white hover:bg-purple-600 transition-colors pointer-events-auto"
                    title={`Character: ${elementName}`}
                  >
                    <span className="pr-1">{elementName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveElement(`character-${index}`);
                      }}
                      className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {/* Environments */}
                {item.elementNames.environments?.map((elementName, index) => (
                  <div
                    key={`environment-${index}`}
                    className="group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border bg-emerald-600/80 border-emerald-500/30 text-white hover:bg-emerald-600 transition-colors pointer-events-auto"
                    title={`Environment: ${elementName}`}
                  >
                    <span className="pr-1">{elementName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveElement(`environment-${index}`);
                      }}
                      className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
                {/* Props */}
                {item.elementNames.props?.map((elementName, index) => (
                  <div
                    key={`prop-${index}`}
                    className="group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border bg-blue-600/80 border-blue-500/30 text-white hover:bg-blue-600 transition-colors pointer-events-auto"
                    title={`Prop: ${elementName}`}
                  >
                    <span className="pr-1">{elementName}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onRemoveElement(`prop-${index}`);
                      }}
                      className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
                    >
                      <X className="w-2.5 h-2.5 text-white" />
                    </button>
                  </div>
                ))}
              </>
            )}
            
            {/* Legacy support for linkedElements */}
            {item.linkedElements && item.linkedElements.map((element) => (
              <div
                key={element.id}
                className={`group/badge relative px-2 py-0.5 rounded-full text-[10px] font-medium backdrop-blur-sm border ${
                  element.type === 'character' 
                    ? 'bg-purple-600/80 border-purple-500/30 text-white hover:bg-purple-600'
                    : element.type === 'environment'
                    ? 'bg-blue-600/80 border-blue-500/30 text-white hover:bg-blue-600'
                    : 'bg-green-600/80 border-green-500/30 text-white hover:bg-green-600'
                } transition-colors pointer-events-auto`}
                title={`${element.type}: ${element.name}`}
              >
                <span className="pr-1">{element.name}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveElement(element.id);
                  }}
                  className="opacity-0 group-hover/badge:opacity-100 absolute -top-1 -right-1 w-4 h-4 bg-red-600 rounded-full flex items-center justify-center hover:bg-red-700 transition-all"
                >
                  <X className="w-2.5 h-2.5 text-white" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
        
        {/* Video indicator */}
        {item.videoUrl && item.generationStatus !== "generating" && (
          <div className="absolute bottom-3 right-3 bg-blue-600/80 backdrop-blur-sm rounded-full px-2.5 py-1 border border-blue-500/30">
            <span className="text-xs text-white font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-white rounded-full"></span>
              Video
            </span>
          </div>
        )}
        
        {/* NEW: Notes indicator */}
        {item.notes && (
          <button
            onClick={(e) => { e.stopPropagation(); setShowNotesModal(true); }}
            className="absolute top-3 right-3 bg-gray-600/80 backdrop-blur-sm rounded-full p-2 border border-gray-500/30 hover:bg-gray-600 transition-colors"
            title="View notes"
          >
            <MessageSquare className="w-3.5 h-3.5 text-white" />
          </button>
        )}
        
        {/* Action buttons */}
        <div className="absolute bottom-12 right-3 flex gap-2 z-20">
          {/* Edit button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowEditDialog(true); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
            title="Edit title and description"
          >
            <div className="w-8 h-8 bg-blue-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-blue-600 transition-colors">
              <Edit3 className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          
          {/* Edit Prompts button */}
          <button
            onClick={(e) => { e.stopPropagation(); setShowPromptDialog(true); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
            title="Edit image & video prompts"
          >
            <div className={`w-8 h-8 backdrop-blur-sm rounded-full flex items-center justify-center transition-colors ${item.imagePrompt || item.videoPrompt ? 'bg-emerald-600/90 hover:bg-emerald-600' : 'bg-teal-600/90 hover:bg-teal-600'}`}>
              <Sparkles className="w-3.5 h-3.5 text-white" />
            </div>
          </button>

          {/* Add Element button */}
          <button
            onClick={(e) => { e.stopPropagation(); onAddElement?.(); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
            title="Add element to this scene"
          >
            <div className="w-8 h-8 bg-purple-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-purple-600 transition-colors">
              <Plus className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          
          {/* Duplicate button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDuplicate(); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
          >
            <div className="w-8 h-8 bg-gray-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-gray-600 transition-colors">
              <Copy className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
          
          {/* Delete button */}
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(); }}
            className="opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:scale-105"
          >
            <div className="w-8 h-8 bg-red-600/90 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-red-600 transition-colors">
              <Trash2 className="w-3.5 h-3.5 text-white" />
            </div>
          </button>
        </div>
      
      {/* Enhanced info section */}
      <div className="p-4 bg-(--bg-secondary) border-t border-(--border-primary)">
        <div className="flex items-start justify-between mb-2">
          <p className="text-sm text-(--text-primary) font-medium flex-1">
            {item.title}
          </p>
          {/* Subtle user attribution */}
          <div className="flex items-center gap-1 text-[10px] text-gray-600">
            <div className="w-4 h-4 bg-gray-700 rounded-full flex items-center justify-center">
              <span className="text-gray-500 font-medium">
                {(item.generatedBy || userId || "U").charAt(0).toUpperCase()}
              </span>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-500 mb-2 line-clamp-2">
          {item.description || <span className="text-gray-600">No description</span>}
        </p>
        {/* Prompt indicators */}
        {(item.imagePrompt || item.videoPrompt) && (
          <div className="flex items-center gap-2 mb-1">
            {item.imagePrompt && (
              <div className="flex items-center gap-1 text-[10px] text-blue-400 bg-blue-500/10 px-1.5 py-0.5 rounded" title={item.imagePrompt}>
                <ImageIcon className="w-3 h-3" />
                <span className="truncate max-w-[100px]">Image</span>
              </div>
            )}
            {item.videoPrompt && (
              <div className="flex items-center gap-1 text-[10px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded" title={item.videoPrompt}>
                <Video className="w-3 h-3" />
                <span className="truncate max-w-[100px]">Video</span>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* NEW: Inline Edit Dialog */}
      {showEditDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4">
          <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-3 border-b border-(--border-primary)">
              <h3 className="text-sm font-bold text-(--text-primary)">Edit Frame</h3>
              <button onClick={() => setShowEditDialog(false)} className="p-1 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>
            
            <div className="p-3 space-y-3">
              {/* Title Input */}
              <div>
                <label className="text-xs text-(--text-tertiary) font-medium mb-1 block">Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="flex-1 bg-(--bg-primary) border border-(--border-primary) rounded-xl px-2 py-1.5 text-(--text-primary) text-xs focus:outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
                  placeholder="Enter frame title..."
                />
              </div>
              
              {/* Description Input */}
              <div>
                <label className="text-xs text-(--text-tertiary) font-medium mb-1 block">Description</label>
                <textarea
                  value={newDescription}
                  onChange={(e) => setNewDescription(e.target.value)}
                  className="w-full text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-purple-500 resize-none transition-colors"
                  rows={3}
                  placeholder="Enter frame description..."
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    if (newTitle.trim() && newTitle !== item.title) {
                      onTitleChange?.(newTitle.trim());
                    }
                    if (newDescription.trim() !== (item.description || "")) {
                      onDescriptionChange?.(newDescription.trim());
                    }
                    setShowEditDialog(false);
                  }}
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Save Changes
                </button>
                <button
                  onClick={() => {
                    setShowEditDialog(false);
                    setNewTitle(item.title);
                    setNewDescription(item.description || "");
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Prompt Edit Dialog */}
      {showPromptDialog && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-30 p-4"
          draggable={false}
          onDragStart={(e) => { e.preventDefault(); e.stopPropagation(); }}
          onMouseDown={(e) => e.stopPropagation()}
          onPointerDown={(e) => e.stopPropagation()}
        >
          <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) w-full max-w-sm"
            draggable={false}
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between p-3 border-b border-(--border-primary)">
              <h3 className="text-sm font-bold text-(--text-primary) flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Edit Prompts
              </h3>
              <button onClick={() => setShowPromptDialog(false)} className="p-1 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200">
                <X className="w-3.5 h-3.5 text-gray-400" />
              </button>
            </div>

            <div className="p-3 space-y-3">
              {/* Tab switcher */}
              <div className="flex gap-1 bg-white/5 rounded-lg p-0.5">
                <button
                  onClick={() => setPromptTab?.('image')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    (promptTab || 'image') === 'image'
                      ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <ImageIcon className="w-3 h-3" />
                  Image Prompt
                </button>
                <button
                  onClick={() => setPromptTab?.('video')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    (promptTab || 'image') === 'video'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                >
                  <Video className="w-3 h-3" />
                  Video Prompt
                </button>
              </div>

              {/* Active prompt textarea */}
              {(promptTab || 'image') === 'image' ? (
                <textarea
                  value={newImagePrompt}
                  onChange={(e) => setNewImagePrompt(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none transition-colors"
                  rows={6}
                  placeholder="Describe the image to generate..."
                />
              ) : (
                <textarea
                  value={newVideoPrompt}
                  onChange={(e) => setNewVideoPrompt(e.target.value)}
                  onMouseDown={(e) => e.stopPropagation()}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="w-full text-sm text-gray-300 bg-white/10 border border-white/20 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 resize-none transition-colors"
                  rows={6}
                  placeholder="Describe the video to generate..."
                />
              )}

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => {
                    if (newImagePrompt.trim() !== (item.imagePrompt || "")) {
                      onImagePromptChange?.(newImagePrompt.trim());
                    }
                    if (newVideoPrompt.trim() !== (item.videoPrompt || "")) {
                      onVideoPromptChange?.(newVideoPrompt.trim());
                    }
                    setShowPromptDialog(false);
                  }}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Save Prompts
                </button>
                <button
                  onClick={() => {
                    setShowPromptDialog(false);
                    setNewImagePrompt(item.imagePrompt || "");
                    setNewVideoPrompt(item.videoPrompt || "");
                  }}
                  className="flex-1 bg-gray-700 hover:bg-gray-600 text-gray-300 text-sm font-medium py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Notes Modal */}
      {showNotesModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-secondary) rounded-2xl border border-(--border-primary) w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-(--border-primary)">
              <h3 className="text-sm font-bold text-(--text-primary)">Frame Notes</h3>
              <button onClick={() => setShowNotesModal(false)} className="p-1 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4">
              <textarea
                value={item.notes || ''}
                onChange={(e) => onNotesChange?.(e.target.value)}
                placeholder="Add notes about this frame..."
                className="w-full h-32 bg-(--bg-primary) border border-(--border-primary) rounded-xl px-3 py-2 text-sm text-(--text-primary) placeholder-(--text-tertiary) outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 resize-none transition-all duration-200"
              />
            </div>
            <div className="flex items-center justify-end p-4 border-t border-white/8">
              <button
                onClick={() => setShowNotesModal(false)}
                className="px-4 py-1.5 bg-purple-600 hover:bg-purple-700 text-xs text-white rounded-lg transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FileBrowser modal for selecting existing files */}
      {showFrameFileBrowser && (
        <FileBrowser
          projectId={projectId as any}
          onClose={() => setShowFrameFileBrowser(false)}
          onSelectFile={(url, type) => {
            if (type === "image" || type === "video") {
              onImageUploaded(item._id, url);
            }
            setShowFrameFileBrowser(false);
          }}
          imageSelectionMode
          onSelectImage={(imageUrl) => {
            onImageUploaded(item._id, imageUrl);
            setShowFrameFileBrowser(false);
          }}
        />
      )}
    </div>
  );
}
