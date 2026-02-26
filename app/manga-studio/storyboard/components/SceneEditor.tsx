"use client";

import {
  ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Image as ImageIcon, MessageSquare,
  Mic, List, MoreHorizontal, Check, X, Send,
  Pencil, ZoomIn, ZoomOut, Play, Plus, Upload, Tag,
  Layers, Type, Paintbrush, Eraser, Eye, EyeOff, Trash2, Square,
  RotateCcw, RotateCw, Sparkles,
} from "lucide-react";
import { useState, useRef } from "react";
import type { Shot, CommentItem, Tag as TagType } from "../types";
import { TAG_COLORS } from "../constants";
import {
  CanvasEditor, emptyCanvasState, undoMask, redoMask,
  type CanvasEditorState, type CanvasActiveTool, type CanvasSelection,
} from "../../shared/CanvasEditor";
import { makeId, bubbleEllipse, cloudPath, tailPath, rectTailPath, rectOutlinePathWithGap, burstPoints, roughEllipsePath, estimateFontSize } from "../../shared/canvas-helpers";
import type { BubbleType, TailDir, FontFamily } from "../../shared/canvas-types";
import { AIGenerationModal } from "../../components/modals/AIGenerationModal";

type CanvasTool = CanvasActiveTool;

interface SceneEditorProps {
  shots: Shot[];
  initialShotId: string;
  onClose: () => void;
  onShotsChange: (shots: Shot[]) => void;
}

export function SceneEditor({ shots, initialShotId, onClose, onShotsChange }: SceneEditorProps) {
  const [activeShotId, setActiveShotId] = useState(initialShotId);
  const [commentText, setCommentText] = useState("");
  const [commentTab, setCommentTab] = useState<"selected" | "all" | "testing">("selected");
  const [editingField, setEditingField] = useState<"voice" | "notes" | "action" | null>(null);
  const [fieldDraft, setFieldDraft] = useState("");
  const [zoom, setZoom] = useState(53);
  const [refImages, setRefImages] = useState<string[]>([]);
  const [backgroundImage, setBackgroundImage] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [promptText, setPromptText] = useState("");
  const [isInpainting, setIsInpainting] = useState(false);
  const [inpaintError, setInpaintError] = useState<string | null>(null);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [inpaintModel, setInpaintModel] = useState<"nano-banana" | "flux-kontext-pro" | "openai-4o" | "grok" | "qwen-z-image">("openai-4o");
  const [showTagPicker, setShowTagPicker] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState(TAG_COLORS[0]);
  const [showBubbleStyleModal, setShowBubbleStyleModal] = useState(false);
  const [selectedBubbleStyle, setSelectedBubbleStyle] = useState<"realistic" | "cartoon" | "manga" | "custom">("manga");
  
  
  // Image tab independent state
  const [imageReferenceImages, setImageReferenceImages] = useState<string[]>([]);
  const [imageInpaintPrompt, setImageInpaintPrompt] = useState("");
  const [imageInpaintModel, setImageInpaintModel] = useState<"nano-banana" | "flux-kontext-pro" | "flux-fill" | "openai-4o" | "grok" | "qwen-z-image" | "seedream-5.0-lite" | "qwen" | "seedream-4.5" | "flux-2-flex-image-to-image" | "flux-2-flex-text-to-image" | "seedream-v4">("nano-banana");
  const [imageRectangle, setImageRectangle] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [imageIsRectangleVisible, setImageIsRectangleVisible] = useState(true);
  const [imageIsInpainting, setImageIsInpainting] = useState(false);
  const [imageInpaintError, setImageInpaintError] = useState<string | null>(null);
  const [imageGeneratedImages, setImageGeneratedImages] = useState<string[]>([]);
  const [imageShowGenPanel, setImageShowGenPanel] = useState(false);
  
  // Rectangle state
  const [rectangle, setRectangle] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  
  // Minimal state for removed Closer Look functionality (to prevent build errors)
  const [isAspectRatioAnimating] = useState(false);
  const setIsAspectRatioAnimating = () => {}; // No-op function
  const setCloserLookError = () => {}; // No-op function
  const setIsCloserLookGenerating = () => {}; // No-op function
  
  // KIE Modal state
  const [showKIEModal, setShowKIEModal] = useState(false);

  // ── Canvas tool panel state ────────────────────────────────────────────────
  const [canvasTool, setCanvasTool] = useState<CanvasTool>("layers");
  const [canvasState, setCanvasState] = useState<CanvasEditorState>(emptyCanvasState());
  const [hiddenIds, setHiddenIds] = useState<Set<string>>(new Set());
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [newBubbleText, setNewBubbleText] = useState("test...");
  const [newBubbleType, setNewBubbleType] = useState<BubbleType>("speech");
  const [newTextContent, setNewTextContent] = useState("test...");
  const [newTextSize, setNewTextSize] = useState(16);
  const [newTextColor, setNewTextColor] = useState("#ffffff");
  const [maskBrushSize, setMaskBrushSize] = useState(20);
  const [maskOpacity, setMaskOpacity] = useState(0.45);
  const [isEraser, setIsEraser] = useState(false);
  const [inpaintPrompt, setInpaintPrompt] = useState("");
  const [canvasSelection, setCanvasSelection] = useState<CanvasSelection>({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: null });
  const assetInputRef = useRef<HTMLInputElement | null>(null);

  const panelId = activeShotId;
  const panelBubbles = canvasState.bubbles.filter(b => b.panelId === panelId);
  const panelTexts = canvasState.textElements.filter(t => t.panelId === panelId);
  const panelAssets = canvasState.assetElements.filter(a => a.panelId === panelId);

  const toggleVisibility = (id: string) => {
    setHiddenIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const deleteLayer = (id: string) => {
    setCanvasState(prev => ({
      ...prev,
      bubbles: prev.bubbles.filter(b => b.id !== id),
      textElements: prev.textElements.filter(t => t.id !== id),
      assetElements: prev.assetElements.filter(a => a.id !== id),
    }));
    if (selectedLayerId === id) setSelectedLayerId(null);
  };

  const canvasContainerRef = useRef<HTMLDivElement>(null);

  const getCanvasCenter = () => {
    const el = canvasContainerRef.current;
    if (!el) return { cx: 200, cy: 150 };
    return { cx: el.clientWidth / 2, cy: el.clientHeight / 2 };
  };

  const addBubble = () => {
    if (!newBubbleText.trim()) return;
    // reset to default after add
    const bw = 200, bh = 100;
    const { cx, cy } = getCanvasCenter();
    const b = { id: makeId(), panelId, x: cx - bw/2, y: cy - bh/2, w: bw, h: bh, text: newBubbleText.trim(), bubbleType: newBubbleType, tailMode: "auto" as const, tailDir: "bottom-left" as const, tailX: 50, tailY: 130, autoFitFont: true, fontSize: 15, zIndex: 4 };
    setCanvasState(prev => ({ ...prev, bubbles: [...prev.bubbles, b] }));
    setNewBubbleText("test...");
    setCanvasSelection({ selectedBubbleId: b.id, selectedTextId: null, selectedAssetId: null });
  };

  const addText = () => {
    if (!newTextContent.trim()) return;
    const tw = 200, th = 60;
    const { cx, cy } = getCanvasCenter();
    const t = { id: makeId(), panelId, x: cx - tw/2, y: cy - th/2, w: tw, h: th, text: newTextContent.trim(), fontSize: newTextSize, color: newTextColor, fontWeight: "normal", fontStyle: "normal", fontFamily: "Arial" as const, zIndex: 3 };
    setCanvasState(prev => ({ ...prev, textElements: [...prev.textElements, t] }));
    setNewTextContent("test...");
    setCanvasSelection({ selectedBubbleId: null, selectedTextId: t.id, selectedAssetId: null });
  };

  const handleAssetUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const url = String(reader.result);
      const libId = makeId();
      const elemId = makeId();
      const aw = 160, ah = 160;
      const { cx, cy } = getCanvasCenter();
      setCanvasState(prev => ({
        ...prev,
        assetLibrary: [...prev.assetLibrary, { id: libId, url, name: file.name }],
        assetElements: [...prev.assetElements, { id: elemId, panelId, assetId: libId, x: cx - aw/2, y: cy - ah/2, w: aw, h: ah, zIndex: 2 }],
      }));
      setCanvasSelection({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: elemId });
    };
    reader.readAsDataURL(file);
  };

  // Layering functions
  const moveLayer = (id: string, direction: "forward" | "backward" | "front" | "back") => {
    const allObjects = [...panelBubbles, ...panelTexts, ...panelAssets];
    const obj = allObjects.find(o => o.id === id);
    if (!obj) {
      console.log("moveLayer: Object not found", id);
      return;
    }
    
    const sorted = allObjects.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0));
    const idx = sorted.findIndex(o => o.id === id);
    
    console.log("moveLayer debug:", { id, direction, currentZ: obj.zIndex, sortedZ: sorted.map(o => ({ id: o.id, z: o.zIndex })), idx });
    
    let newZ: number;
    if (direction === "front") {
      newZ = (sorted[sorted.length - 1]?.zIndex ?? 0) + 1;
    } else if (direction === "back") {
      newZ = (sorted[0]?.zIndex ?? 0) - 1;
    } else if (direction === "forward" && idx < sorted.length - 1) {
      const above = sorted[idx + 1];
      newZ = above.zIndex! + 1;
    } else if (direction === "backward" && idx > 0) {
      const below = sorted[idx - 1];
      newZ = below.zIndex! - 1;
    } else {
      console.log("moveLayer: Cannot move - at edge or invalid direction");
      return;
    }
    
    console.log("moveLayer: Setting newZ", newZ);
    
    // Update the object's zIndex
    if (panelBubbles.find(b => b.id === id)) {
      console.log("moveLayer: Updating bubble", id, "to zIndex", newZ);
      setCanvasState(s => ({ ...s, bubbles: s.bubbles.map(b => b.id === id ? { ...b, zIndex: newZ } : b) }));
    } else if (panelTexts.find(t => t.id === id)) {
      console.log("moveLayer: Updating text", id, "to zIndex", newZ);
      setCanvasState(s => ({ ...s, textElements: s.textElements.map(t => t.id === id ? { ...t, zIndex: newZ } : t) }));
    } else if (panelAssets.find(a => a.id === id)) {
      console.log("moveLayer: Updating asset", id, "to zIndex", newZ);
      setCanvasState(s => ({ ...s, assetElements: s.assetElements.map(a => a.id === id ? { ...a, zIndex: newZ } : a) }));
    } else {
      console.log("moveLayer: Object type not found", id);
    }
  };

  const toggleAllVisibility = () => {
    const allIds = [...panelBubbles, ...panelTexts, ...panelAssets].map(o => o.id);
    const allHidden = allIds.every(id => hiddenIds.has(id));
    if (allHidden) {
      setHiddenIds(new Set());
    } else {
      setHiddenIds(new Set(allIds));
    }
  };

  const allLayers = [
    ...panelBubbles.map(b => ({ id: b.id, label: `Bubble: ${b.text.slice(0, 12)}`, color: "emerald", type: "bubble" as const, zIndex: b.zIndex ?? 0 })),
    ...panelTexts.map(t => ({ id: t.id, label: `Text: ${t.text.slice(0, 12)}`, color: "purple", type: "text" as const, zIndex: t.zIndex ?? 0 })),
    ...panelAssets.map(a => { const lib = canvasState.assetLibrary.find(l => l.id === a.assetId); return { id: a.id, label: `Asset: ${lib?.name.slice(0, 12) ?? a.id}`, color: "orange", type: "asset" as const, zIndex: a.zIndex ?? 0 }; }),
  ].sort((a, b) => b.zIndex - a.zIndex); // Sort by z-index (highest at top)

  const activeIdx = shots.findIndex(s => s.id === activeShotId);
  const activeShot = shots[activeIdx];

  // ── Client-side image cropping ───────────────────────────────────────────────
  const cropImageToRectangle = async (
    base64Image: string,
    rectangle: { x: number; y: number; width: number; height: number },
    canvasDisplaySize?: { width: number; height: number }
  ): Promise<string> => {
    return new Promise((resolve, reject) => {
      try {
        console.log("Starting cropImageToRectangle with:", rectangle);
        console.log("Canvas display size provided:", canvasDisplaySize);
        
        const img = new Image();
        img.onload = () => {
          try {
            console.log("Image loaded successfully. Dimensions:", img.width, "x", img.height);
            console.log("Crop rectangle (canvas space):", rectangle);
            
            // Scale rectangle from canvas display space to actual image pixel space,
            // accounting for object-contain letterboxing offset within the container.
            let scaledRect = { ...rectangle };
            if (canvasDisplaySize && canvasDisplaySize.width > 0 && canvasDisplaySize.height > 0) {
              const containerW = canvasDisplaySize.width;
              const containerH = canvasDisplaySize.height;

              // Calculate how the image is rendered inside the container (object-contain logic)
              const imgAspect = img.width / img.height;
              const containerAspect = containerW / containerH;

              let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
              if (imgAspect > containerAspect) {
                // Image is wider relative to container → pillarbox (black bars top/bottom)
                renderedW = containerW;
                renderedH = containerW / imgAspect;
                offsetX = 0;
                offsetY = (containerH - renderedH) / 2;
              } else {
                // Image is taller relative to container → letterbox (black bars left/right)
                renderedH = containerH;
                renderedW = containerH * imgAspect;
                offsetX = (containerW - renderedW) / 2;
                offsetY = 0;
              }

              const scaleX = img.width / renderedW;
              const scaleY = img.height / renderedH;

              console.log(`Container: ${containerW}x${containerH}, Image: ${img.width}x${img.height}`);
              console.log(`Rendered image in container: ${renderedW.toFixed(1)}x${renderedH.toFixed(1)} at offset (${offsetX.toFixed(1)}, ${offsetY.toFixed(1)})`);
              console.log(`Scale factors: scaleX=${scaleX.toFixed(3)}, scaleY=${scaleY.toFixed(3)}`);

              // Subtract letterbox offset before scaling
              scaledRect = {
                x: (rectangle.x - offsetX) * scaleX,
                y: (rectangle.y - offsetY) * scaleY,
                width: rectangle.width * scaleX,
                height: rectangle.height * scaleY,
              };
              console.log("Scaled rectangle (image space):", scaledRect);

              // Apply boundary constraints (0px padding) - rectangle can touch edges but not exceed them
              const PADDING = 0;
              const constrainedRect = {
                x: Math.max(PADDING, Math.min(scaledRect.x, img.width - scaledRect.width)),
                y: Math.max(PADDING, Math.min(scaledRect.y, img.height - scaledRect.height)),
                width: Math.min(scaledRect.width, img.width),
                height: Math.min(scaledRect.height, img.height),
              };

              // Verify the constrained rectangle is valid
              if (constrainedRect.width < 10 || constrainedRect.height < 10) {
                throw new Error("Crop area too small after applying boundary constraints");
              }

              console.log("Constrained rectangle (0px padding):", constrainedRect);
              rectangle = constrainedRect;
            } else {
              console.warn("No canvas display size provided, using rectangle as-is");
            }
            
            // Validate rectangle bounds
            if (rectangle.x < 0 || rectangle.y < 0 || 
                rectangle.x + rectangle.width > img.width || 
                rectangle.y + rectangle.height > img.height) {
              console.warn("Rectangle extends beyond image bounds, adjusting...");
              // Adjust rectangle to fit within image bounds
              const adjustedRect = {
                x: Math.max(0, rectangle.x),
                y: Math.max(0, rectangle.y),
                width: Math.min(rectangle.width, img.width - Math.max(0, rectangle.x)),
                height: Math.min(rectangle.height, img.height - Math.max(0, rectangle.y))
              };
              console.log("Adjusted rectangle:", adjustedRect);
              rectangle = adjustedRect;
            }
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            if (!ctx) {
              reject(new Error('Failed to get canvas context'));
              return;
            }

            // Set canvas size to rectangle dimensions
            canvas.width = rectangle.width;
            canvas.height = rectangle.height;
            console.log("Canvas dimensions:", canvas.width, "x", canvas.height);

            // Draw the cropped portion of the image
            ctx.drawImage(
              img,
              rectangle.x, rectangle.y, rectangle.width, rectangle.height, // Source rectangle
              0, 0, rectangle.width, rectangle.height  // Destination rectangle
            );

            // Convert to base64
            const croppedBase64 = canvas.toDataURL('image/png');
            console.log("Canvas converted to base64, length:", croppedBase64.length);
            resolve(croppedBase64);
          } catch (error) {
            console.error("Error in canvas processing:", error);
            reject(error);
          }
        };

        img.onerror = (error) => {
          console.error("Image loading failed:", error);
          reject(new Error('Failed to load image for cropping'));
        };
        img.src = base64Image;
      } catch (error) {
        console.error("Error in cropImageToRectangle:", error);
        reject(error);
      }
    });
  };

  // ── Closer Look via n8n ─────────────────────────────────────────────────────
  const runCrop = async () => {
    const imageUrl = backgroundImage || activeShot?.imageUrl;
    if (!imageUrl || !rectangle) {
      setCloserLookError("No image or rectangle selected for cropping");
      return;
    }

    setIsCloserLookGenerating(true);
    setCloserLookError(null);

    try {
      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // Convert background image to base64
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        // Validate and construct proper URL
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        
        try {
          const res = await fetch(validUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
          }
          
          const blob = await res.blob();
          if (blob.size === 0) {
            throw new Error("Empty image blob received");
          }
          
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
        } catch (fetchError) {
          console.error("Image fetch error:", fetchError);
          setCloserLookError(`Unable to load image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
          return;
        }
      }

      // Get canvas display size for coordinate scaling
      const canvasEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]');
      const canvasRect = canvasEl?.getBoundingClientRect();
      const canvasDisplaySize = canvasRect
        ? { width: canvasRect.width, height: canvasRect.height }
        : undefined;

      // Crop the image to the rectangle
      console.log("Cropping image to rectangle:", rectangle);
      const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
      console.log("Image cropped successfully");

      // Set the cropped image as the new background
      setBackgroundImage(croppedImage);
      
      // Add cropped image to generated images panel
      setGeneratedImages(prev => [...prev, croppedImage]);
      setShowGenPanel(true);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setCloserLookError(msg);
      console.error("Crop error:", err);
    } finally {
      setIsCloserLookGenerating(false);
    }
  };

  // ── Crop + Generate + Combine Workflow ───────────────────────────────────────────────────────
  const runCropGenerateCombine = async () => {
    const imageUrl = backgroundImage || activeShot?.imageUrl;
    if (!imageUrl || !rectangle) {
      setCloserLookError("No image or rectangle selected for crop and generate");
      return;
    }

    setIsCloserLookGenerating(true);
    setCloserLookError(null);

    try {
      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // Convert background image to base64
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        // Validate and construct proper URL
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        
        try {
          const res = await fetch(validUrl, {
            method: 'GET',
            mode: 'cors',
            cache: 'no-cache'
          });
          
          if (!res.ok) {
            throw new Error(`Failed to fetch image: ${res.status} ${res.statusText}`);
          }
          
          const blob = await res.blob();
          if (blob.size === 0) {
            throw new Error("Empty image blob received");
          }
          
          imageBase64 = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
          });
          
        } catch (fetchError) {
          console.error("Image fetch error:", fetchError);
          setCloserLookError(`Unable to load image: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
          return;
        }
      }

      // Get canvas display size for coordinate scaling
      const canvasEl = canvasContainerRef.current?.querySelector('[data-editor="true"]') as HTMLElement;
      const canvasRect = canvasEl?.getBoundingClientRect();
      const canvasDisplaySize = canvasRect
        ? { width: canvasRect.width, height: canvasRect.height }
        : undefined;

      // Step 1: Crop the image to the rectangle
      console.log("Step 1: Cropping image to rectangle:", rectangle);
      const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
      console.log("Step 1: Image cropped successfully");

      // Step 2: Send cropped image to KIE for generation
      console.log("Step 2: Sending cropped image to KIE for generation...");
      const generatedImage = await runInpaintAPI(croppedImage, "", "Enhance the cropped area with AI", "nano-banana");
      console.log("Step 2: Generated image received:", generatedImage);

      // Step 3: Combine generated image with original image
      console.log("Step 3: Combining generated image with original image...");
      const combinedImage = await combineImages(originalImage, generatedImage, rectangle, canvasDisplaySize);
      console.log("Step 3: Images combined successfully");

      // Set the combined image as the new background
      setBackgroundImage(combinedImage);
      
      // Add combined image to generated images panel
      setGeneratedImages(prev => [...prev, croppedImage, generatedImage, combinedImage]);
      setShowGenPanel(true);

      // Clear the crop rectangle after successful generation
      setRectangle(null);

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setCloserLookError(msg);
      console.error("Crop+Generate+Combine error:", err);
    } finally {
      setIsCloserLookGenerating(false);
    }
  };

  // Helper function to call inpaint API (similar to runInpaint but more generic)
  const runInpaintAPI = async (image: string, mask: string, prompt: string, model: string): Promise<string> => {
    const response = await fetch("/api/inpaint", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        image,
        mask: mask,
        prompt: prompt,
        model: model,
      }),
    });

    if (!response.ok) {
      const err = await response.json();
      const errorMessage = err.error || err.message || err.suggestion || "Inpaint failed";
      throw new Error(errorMessage);
    }

    const result = await response.json();
    const resultImage = result.image ?? result.url ?? result.output ?? result.data;
    if (!resultImage) {
      throw new Error("No image returned from inpaint API");
    }
    
    return resultImage;
  };

  // Helper function to combine two images with a mask
  const combineImages = async (originalImage: string, generatedImage: string, rectangle: any, canvasDisplaySize?: { width: number; height: number }): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img1 = new Image();
      const img2 = new Image();
      
      img1.onload = () => {
        img2.onload = () => {
          // Create canvas for combining
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to match display size
          const width = canvasDisplaySize?.width || 800;
          const height = canvasDisplaySize?.height || 600;
          canvas.width = width;
          canvas.height = height;
          
          // Draw original image
          ctx.drawImage(img1, 0, 0, width, height);
          
          // Draw generated image in the cropped area
          if (rectangle) {
            const scaleX = width / (canvasDisplaySize?.width || 800);
            const scaleY = height / (canvasDisplaySize?.height || 600);
            
            const drawX = rectangle.x * scaleX;
            const drawY = rectangle.y * scaleY;
            const drawWidth = rectangle.width * scaleX;
            const drawHeight = rectangle.height * scaleY;
            
            ctx.drawImage(img2, drawX, drawY, drawWidth, drawHeight);
          } else {
            // If no rectangle, overlay the generated image
            ctx.globalAlpha = 0.5; // Semi-transparent overlay
            ctx.drawImage(img2, 0, 0, width, height);
            ctx.globalAlpha = 1.0;
          }
          
          // Convert to base64
          const combinedBase64 = canvas.toDataURL('image/png');
          resolve(combinedBase64);
        };
        
        img1.onerror = () => reject(new Error('Failed to load original image'));
        img2.onerror = () => reject(new Error('Failed to load generated image'));
        
        img1.src = originalImage;
        img2.src = generatedImage;
      };
      
      img1.onerror = () => reject(new Error('Failed to load original image'));
      img2.onerror = () => reject(new Error('Failed to load generated image'));
      
      img1.src = originalImage;
      img2.src = generatedImage;
    });
  };

  // ── Generate Image with Bubbles and Text ───────────────────────────────────────────────────────
  const generateImageWithElements = async () => {
    const imageUrl = backgroundImage || activeShot?.imageUrl;
    if (!imageUrl) {
      setInpaintError("No background image available");
      return;
    }

    setIsInpainting(true);
    setInpaintError(null);

    try {
      // Get the container element
      const containerEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]') as HTMLElement;
      if (!containerEl) {
        throw new Error("Canvas container not found");
      }

      // Use clientWidth/clientHeight to match CanvasEditor's ResizeObserver
      // (which uses entries[0].contentRect — same as clientWidth/Height for
      // elements without padding/border). getBoundingClientRect can differ.
      const cssW = containerEl.clientWidth;
      const cssH = containerEl.clientHeight;

      // Convert image to data URL first to avoid CORS issues
      let safeImageUrl = imageUrl;
      
      if (imageUrl.startsWith('http')) {
        try {
          const response = await fetch(imageUrl, { mode: 'cors', credentials: 'omit' });
          if (response.ok) {
            const blob = await response.blob();
            safeImageUrl = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          }
        } catch (fetchError) {
          console.warn("Failed to fetch external image, trying direct load:", fetchError);
        }
      }

      // Load background image to get its natural dimensions
      const img = new Image();
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = safeImageUrl;
      });

      // Canvas = exact CSS container size. All coords used directly — no scaling.
      const captureCanvas = document.createElement('canvas');
      const captureCtx = captureCanvas.getContext('2d');
      if (!captureCtx) {
        throw new Error("Failed to get capture canvas context");
      }
      captureCanvas.width  = cssW;
      captureCanvas.height = cssH;

      // Draw background image with object-contain behavior to prevent stretching
      const imgRatio = img.naturalWidth / img.naturalHeight;
      const containerRatio = cssW / cssH;
      let drawW, drawH, drawX, drawY;
      
      if (imgRatio > containerRatio) {
        // Image is wider than container - fit to width, center vertically
        drawW = cssW;
        drawH = cssW / imgRatio;
        drawX = 0;
        drawY = (cssH - drawH) / 2;
      } else {
        // Image is taller than container - fit to height, center horizontally
        drawH = cssH;
        drawW = cssH * imgRatio;
        drawX = (cssW - drawW) / 2;
        drawY = 0;
      }
      
      captureCtx.drawImage(img, drawX, drawY, drawW, drawH);

      // Store image offset for coordinate adjustment
      const imageOffsetX = drawX;
      const imageOffsetY = drawY;

      // Render each bubble by generating the exact same SVG used by CanvasEditor,
      // then drawing it onto the capture canvas as an image.
      const bubbles = canvasState.bubbles
        .filter(b => b.panelId === activeShotId)
        .sort((a, b) => (a.zIndex ?? 4) - (b.zIndex ?? 4));

      for (const b of bubbles) {
        const seed = b.id;
        const font = b.autoFitFont ? estimateFontSize(b.text, b.w, b.h) : b.fontSize;
        const hasTail = b.tailMode !== "none" && !["shout", "sfx"].includes(b.bubbleType);
        const e = bubbleEllipse(b.w, b.h);
        const sw = 2.5;
        const isFlipped = b.flippedColors || false;
        const fillColor = isFlipped ? "#000000" : "#ffffff";
        const strokeColor = isFlipped ? "#ffffff" : "#1a1a1a";
        const textColor = isFlipped ? "#ffffff" : "#111111";
        const dashed = b.bubbleType === "whisper";
        const wSw = 3.5, wStroke = "#333", wDash = "10 8";

        // Match CanvasEditor: pre-flip tailDir so that when ctx.scale(flipX,flipY)
        // flips the rendering, the tail ends up pointing the correct direction.
        let flippedTailDir = b.tailDir as TailDir;
        if (b.flipX) {
          if (flippedTailDir === "left") flippedTailDir = "right";
          else if (flippedTailDir === "right") flippedTailDir = "left";
          else if (flippedTailDir === "bottom-left") flippedTailDir = "bottom-right";
          else if (flippedTailDir === "bottom-right") flippedTailDir = "bottom-left";
        }
        if (b.flipY) {
          if (flippedTailDir === "bottom-left") flippedTailDir = "bottom-right";
          else if (flippedTailDir === "bottom-right") flippedTailDir = "bottom-left";
          else if (flippedTailDir === "left") flippedTailDir = "right";
          else if (flippedTailDir === "right") flippedTailDir = "left";
        }

        // Build SVG markup at CSS-pixel dimensions (b.w, b.h) so that hardcoded
        // constants in tailPath/rectTailPath (tailLen=28, spread=10, inset) produce
        // the correct proportions — exactly matching CanvasEditor.
        let shapeMarkup = "";
        if (b.bubbleType === "thought") {
          const cp = cloudPath(b.w, b.h);
          shapeMarkup = `<g transform="scale(${b.flipX ? -1 : 1},${b.flipY ? -1 : 1}) translate(${b.flipX ? -b.w : 0} ${b.flipY ? -b.h : 0})">
            <path d="${cp}" fill="${fillColor}" stroke="none"/>
            <path d="${cp}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="round"/>
          </g>`;
        } else if (b.bubbleType === "oval") {
          const tp = hasTail ? tailPath(b.w, b.h, flippedTailDir) : "";
          shapeMarkup = `
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${fillColor}" stroke="none"/>
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="round"/>`;
        } else if (b.bubbleType === "speechRough") {
          const rp = roughEllipsePath(b.w, b.h, seed);
          const tp = hasTail ? tailPath(b.w, b.h, flippedTailDir) : "";
          shapeMarkup = `
            <path d="${rp}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="round"/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <path d="${rp}" fill="${fillColor}" stroke="none"/>`;
        } else if (b.bubbleType === "shout") {
          const pts = burstPoints(b.w, b.h, 12, seed).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
          shapeMarkup = `<polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linejoin="miter"/>`;
        } else if (b.bubbleType === "sfx") {
          const pts = burstPoints(b.w, b.h, 18, seed, true).map(p => `${p.x.toFixed(2)},${p.y.toFixed(2)}`).join(" ");
          shapeMarkup = `<polygon points="${pts}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="2.8" stroke-linejoin="miter"/>`;
        } else if (b.bubbleType === "rectRound") {
          const tp = hasTail ? rectTailPath(b.w, b.h, flippedTailDir) : "";
          const outlineSide = flippedTailDir === "left" ? "left" : flippedTailDir === "right" ? "right" : "bottom";
          const outlineGapPos = (flippedTailDir === "left" || flippedTailDir === "right") ? b.h * 0.6 : b.w * (flippedTailDir === "bottom-left" ? 0.2 : 0.8);
          const outlinePath = hasTail ? rectOutlinePathWithGap(b.w, b.h, 20, outlineSide, outlineGapPos, 36) : "";
          shapeMarkup = `
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="20" ry="20" fill="${fillColor}" stroke="none"/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="none"/>` : ""}
            ${hasTail ? `<path d="${outlinePath}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : `<rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="20" ry="20" fill="none" stroke="${strokeColor}" stroke-width="${sw}"/>`}`;
        } else if (b.bubbleType === "rect") {
          const tp = hasTail ? rectTailPath(b.w, b.h, flippedTailDir) : "";
          const outlineSide = flippedTailDir === "left" ? "left" : flippedTailDir === "right" ? "right" : "bottom";
          const outlineGapPos = (flippedTailDir === "left" || flippedTailDir === "right") ? b.h * 0.6 : b.w * (flippedTailDir === "bottom-left" ? 0.2 : 0.8);
          const outlinePath = hasTail ? rectOutlinePathWithGap(b.w, b.h, 2, outlineSide, outlineGapPos, 36) : "";
          shapeMarkup = `
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : ""}
            <rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="2" ry="2" fill="${fillColor}" stroke="none"/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="none"/>` : ""}
            ${hasTail ? `<path d="${outlinePath}" fill="none" stroke="${strokeColor}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>` : `<rect x="4" y="4" width="${b.w - 8}" height="${b.h - 8}" rx="2" ry="2" fill="none" stroke="${strokeColor}" stroke-width="${sw}"/>`}`;
        } else {
          const tp = hasTail ? tailPath(b.w, b.h, flippedTailDir) : "";
          shapeMarkup = `
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="none" stroke="${dashed ? wStroke : strokeColor}" stroke-width="${dashed ? wSw : sw}"${dashed ? ` stroke-dasharray="${wDash}" stroke-linecap="round"` : ""}/>
            ${hasTail ? `<path d="${tp}" fill="${fillColor}" stroke="${dashed ? wStroke : strokeColor}" stroke-width="${dashed ? wSw : sw}" stroke-linecap="round" stroke-linejoin="round"${dashed ? ` stroke-dasharray="${wDash}"` : ""}/>` : ""}
            <ellipse cx="${e.cx}" cy="${e.cy}" rx="${e.rx}" ry="${e.ry}" fill="${fillColor}" stroke="none"/>`;
        }

        // Pad so tails don't clip (tail extends ~40px outside bubble bounds)
        const pad = 60;
        const svgW = b.w + pad * 2;
        const svgH = b.h + pad * 2;
        const bubbleSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="${svgW}" height="${svgH}" viewBox="${-pad} ${-pad} ${svgW} ${svgH}"><g>${shapeMarkup}</g></svg>`;
        const bubbleBlob = new Blob([bubbleSvg], { type: "image/svg+xml;charset=utf-8" });
        const bubbleUrl = URL.createObjectURL(bubbleBlob);

        await new Promise<void>((resolve) => {
          const bImg = new Image();
          bImg.onload = () => {
            captureCtx.save();
            captureCtx.translate(b.x + imageOffsetX + b.w / 2, b.y + imageOffsetY + b.h / 2);
            captureCtx.rotate(((b.rotation || 0) * Math.PI) / 180);
            captureCtx.scale(b.flipX ? -1 : 1, b.flipY ? -1 : 1);
            captureCtx.drawImage(bImg, -b.w / 2 - pad, -b.h / 2 - pad, svgW, svgH);
            captureCtx.restore();
            URL.revokeObjectURL(bubbleUrl);
            resolve();
          };
          bImg.onerror = () => { URL.revokeObjectURL(bubbleUrl); resolve(); };
          bImg.src = bubbleUrl;
        });

        // Thought bubble trailing circles — all in CSS pixels, no scaling
        if (b.bubbleType === "thought" && b.tailMode !== "none") {
          const te = bubbleEllipse(b.w, b.h);
          let sx = b.x + imageOffsetX + te.cx, sy = b.y + imageOffsetY + te.cy + te.ry, dx = 0, dy = 1;
          if (b.tailDir === "bottom-left")  { sx = b.x + imageOffsetX + te.cx - 20; dx = -0.6; dy = 1; }
          else if (b.tailDir === "bottom-right") { sx = b.x + imageOffsetX + te.cx + 20; dx = 0.6; dy = 1; }
          else if (b.tailDir === "left")  { sx = b.x + imageOffsetX + te.cx - te.rx; sy = b.y + imageOffsetY + te.cy + 12; dx = -1; dy = 0.4; }
          else if (b.tailDir === "right") { sx = b.x + imageOffsetX + te.cx + te.rx; sy = b.y + imageOffsetY + te.cy + 12; dx = 1; dy = 0.4; }
          const fX = b.flipX ? -1 : 1, fY = b.flipY ? -1 : 1;
          const bCX = b.x + imageOffsetX + te.cx, bCY = b.y + imageOffsetY + te.cy;
          const rot = ((b.rotation || 0) * Math.PI) / 180;
          const fxP = (sx - bCX) * fX, fyP = (sy - bCY) * fY;
          const fdx = dx * fX, fdy = dy * fY;
          const crx = fxP * Math.cos(rot) - fyP * Math.sin(rot) + bCX;
          const cry = fxP * Math.sin(rot) + fyP * Math.cos(rot) + bCY;
          const rdx = fdx * Math.cos(rot) - fdy * Math.sin(rot);
          const rdy = fdx * Math.sin(rot) + fdy * Math.cos(rot);
          const nl = Math.hypot(rdx, rdy), ux = rdx / nl, uy = rdy / nl;
          const cFill = (b.flippedColors||false) ? "#000" : "#fff";
          const cStroke = (b.flippedColors||false) ? "#fff" : "#1a1a1a";
          [[14, 10], [36, 7], [52, 4.5]].forEach(([dist, r]) => {
            captureCtx.beginPath();
            captureCtx.arc(crx + ux * dist, cry + uy * dist, r, 0, Math.PI * 2);
            captureCtx.fillStyle = cFill; captureCtx.fill();
            captureCtx.strokeStyle = cStroke; captureCtx.lineWidth = 2; captureCtx.stroke();
          });
        }

        // Bubble text — raw CSS coords
        captureCtx.save();
        captureCtx.translate(b.x + imageOffsetX + b.w / 2, b.y + imageOffsetY + b.h / 2);
        captureCtx.rotate(((b.rotation || 0) * Math.PI) / 180);
        captureCtx.scale(b.flipX ? -1 : 1, b.flipY ? -1 : 1);
        const fontWeight = ["sfx", "shout"].includes(b.bubbleType) ? 900 : 400;
        const fontStyle = b.bubbleType === "whisper" ? "italic" : "normal";
        const fontFamily = "'Comic Sans MS','Bangers','Segoe UI',sans-serif";
        captureCtx.font = `${fontStyle} ${fontWeight} ${font}px ${fontFamily}`;
        captureCtx.fillStyle = textColor;
        captureCtx.textAlign = "center";
        captureCtx.textBaseline = "middle";
        const lines = b.text.split("\n");
        const lineHeight = font * 1.3;
        const totalH = lines.length * lineHeight;
        lines.forEach((line, i) => captureCtx.fillText(line, 0, -totalH/2 + lineHeight*i + lineHeight/2));
        captureCtx.restore();
      }

      // Draw asset elements (images from assetLibrary) sorted by zIndex
      const assetElements = canvasState.assetElements
        .filter(a => a.panelId === activeShotId)
        .sort((a, b) => (a.zIndex ?? 2) - (b.zIndex ?? 2));

      for (const a of assetElements) {
        const libItem = canvasState.assetLibrary.find(lib => lib.id === a.assetId);
        if (!libItem?.url) continue;

        // Fetch and convert to data URL to avoid CORS tainting
        let assetUrl = libItem.url;
        if (assetUrl.startsWith("http")) {
          try {
            const res = await fetch(assetUrl, { mode: "cors", credentials: "omit" });
            if (res.ok) {
              const blob = await res.blob();
              assetUrl = await new Promise<string>((resolve, reject) => {
                const reader = new FileReader();
                reader.onload = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
              });
            }
          } catch { /* use original url */ }
        }

        await new Promise<void>((resolve) => {
          const aImg = new Image();
          aImg.onload = () => {
            captureCtx.save();
            captureCtx.translate(a.x + imageOffsetX + a.w / 2, a.y + imageOffsetY + a.h / 2);
            captureCtx.rotate(((a.rotation || 0) * Math.PI) / 180);
            captureCtx.scale(a.flipX ? -1 : 1, a.flipY ? -1 : 1);
            // Preserve aspect ratio like CanvasEditor's objectFit:"contain"
            const imgRatio = aImg.naturalWidth / aImg.naturalHeight;
            const boundRatio = a.w / a.h;
            let drawW, drawH, drawX, drawY;
            
            if (imgRatio > boundRatio) {
              // Image is wider than bounds - fit to width
              drawW = a.w;
              drawH = a.w / imgRatio;
              drawX = -a.w / 2;
              drawY = -(drawH / 2);
            } else {
              // Image is taller than bounds - fit to height
              drawH = a.h;
              drawW = a.h * imgRatio;
              drawX = -(drawW / 2);
              drawY = -a.h / 2;
            }
            
            captureCtx.drawImage(aImg, drawX, drawY, drawW, drawH);
            captureCtx.restore();
            resolve();
          };
          aImg.onerror = () => resolve();
          aImg.src = assetUrl;
        });
      }

      // Draw text elements — raw CSS pixel coords
      const textElements = canvasState.textElements
        .filter(t => t.panelId === activeShotId)
        .sort((a, b) => (a.zIndex ?? 3) - (b.zIndex ?? 3));

      textElements.forEach(text => {
        captureCtx.save();
        // Translate to top-left corner (like CanvasEditor div positioning)
        captureCtx.translate(text.x + imageOffsetX, text.y + imageOffsetY + 7);
        captureCtx.rotate(((text.rotation || 0) * Math.PI) / 180);
        captureCtx.scale(text.flipX ? -1 : 1, text.flipY ? -1 : 1);

        if (text.backgroundColor) {
          captureCtx.fillStyle = text.backgroundColor;
          captureCtx.fillRect(0, 0, text.w, text.h);
        }

        const textPad = 4;
        const tLineH = text.fontSize * 1.3;
        const tLines = text.text.split("\n");
        captureCtx.font = `${text.fontStyle||"normal"} ${text.fontWeight||"normal"} ${text.fontSize}px ${text.fontFamily||"Arial"}`;
        captureCtx.textAlign = "left";
        captureCtx.textBaseline = "top";

        // Check if border properties exist - handle different property names and formats
        const borderWidth = text.borderWidth || text['border-width'] || 0;
        const borderColor = text.borderColor || text['border-color'] || '#000000';
        const hasBorder = borderWidth && borderWidth > 0;
        
                
        if (hasBorder) {
          // Draw border for each line individually to avoid overlap issues
          const bw = borderWidth as number;
          captureCtx.fillStyle = borderColor as string;
          tLines.forEach((line, i) => {
            const y = textPad + i*tLineH;
            // Draw 4 offset copies for border effect
            captureCtx.fillText(line, textPad - bw, y);     // left
            captureCtx.fillText(line, textPad + bw, y);     // right
            captureCtx.fillText(line, textPad, y - bw);     // top
            captureCtx.fillText(line, textPad, y + bw);     // bottom
          });
        }
        captureCtx.fillStyle = text.color;
        tLines.forEach((line, i) => captureCtx.fillText(line, textPad, textPad+i*tLineH));
        captureCtx.restore();
      });

      // Convert to base64
      const canvasDataUrl = captureCanvas.toDataURL('image/png', 1.0);
      
      // Add the generated image to the panel
      setGeneratedImages(prev => [...prev, canvasDataUrl]);
      setShowGenPanel(true);

      console.log("Generated image with text bubbles and assets");

    } catch (err) {
      console.error("Full error details:", err);
      console.error("Error type:", typeof err);
      console.error("Error constructor:", err?.constructor?.name);
      console.error("Error message:", err?.message);
      console.error("Error stack:", err?.stack);
      
      const msg = err instanceof Error ? err.message : 
                  err && typeof err === 'object' ? JSON.stringify(err) : 
                  String(err);
      setInpaintError(msg || "Unknown error occurred during image generation");
      console.error("Generate image error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  // ── Rectangle Inpaint via n8n ───────────────────────────────────────────────
  const runRectangleInpaint = async () => {
    if (!rectangle || !inpaintPrompt.trim()) return;

    setIsInpainting(true);
    setInpaintError(null);

    try {
      // 1. Get the original image
      const imageUrl = backgroundImage || activeShot?.imageUrl;
      if (!imageUrl) throw new Error("No image available");

      // 2. Convert to base64 if needed
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        let validUrl = imageUrl;
        if (!imageUrl.startsWith("http") && !imageUrl.startsWith("/")) {
          validUrl = `${window.location.origin}/${imageUrl.startsWith("/") ? imageUrl.slice(1) : imageUrl}`;
        }
        const res = await fetch(validUrl, { method: 'GET', mode: 'cors', cache: 'no-cache' });
        if (!res.ok) throw new Error(`Failed to fetch image: ${res.status}`);
        const blob = await res.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // 3. Get canvas display size for coordinate scaling
      const canvasEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]');
      const canvasRect = canvasEl?.getBoundingClientRect();
      const canvasDisplaySize = canvasRect
        ? { width: canvasRect.width, height: canvasRect.height }
        : undefined;

      // 4. Crop the rectangle area from the original image
      console.log("[rectInpaint] Step 1: Cropping rectangle from original image...");
      const croppedImage = await cropImageToRectangle(imageBase64, rectangle, canvasDisplaySize);
      console.log("[rectInpaint] Cropped image size:", croppedImage.length);

      // 5. Send the CROPPED image to KIE for generation
      console.log("[rectInpaint] Step 2: Sending cropped image to KIE...");
      
      let requestBody: any = {
        image: croppedImage,
        prompt: inpaintPrompt,
        model: inpaintModel,
      };

      // OpenAI 4o requires a mask - create a full white mask for the cropped image
      if (inpaintModel === "openai-4o") {
        // Create a full white mask (same size as cropped image) - OpenAI 4o will inpaint the entire cropped area
        const maskCanvas = document.createElement("canvas");
        const img = new Image();
        await new Promise<void>((resolve, reject) => {
          img.onload = resolve;
          img.onerror = reject;
          img.src = croppedImage;
        });
        
        maskCanvas.width = img.naturalWidth;
        maskCanvas.height = img.naturalHeight;
        const ctx = maskCanvas.getContext("2d");
        if (ctx) {
          ctx.fillStyle = "white";
          ctx.fillRect(0, 0, img.naturalWidth, img.naturalHeight);
          requestBody.mask = maskCanvas.toDataURL("image/png");
          console.log("[rectInpaint] Added full white mask for OpenAI 4o");
        }
      }

      const response = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(300000),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || err.message || err.suggestion || "Rectangle inpaint failed");
      }

      const result = await response.json();
      const generatedImageUrl = result.image ?? result.url ?? result.output ?? result.data;
      if (!generatedImageUrl) throw new Error("No image returned from KIE");
      console.log("[rectInpaint] Step 2 done: Got generated image from KIE");

      // 6. Load the generated image and resolve to base64 if it's a URL
      let generatedBase64 = generatedImageUrl;
      if (generatedImageUrl.startsWith("http")) {
        try {
          const genRes = await fetch(generatedImageUrl, { mode: 'cors', cache: 'no-cache' });
          if (genRes.ok) {
            const genBlob = await genRes.blob();
            generatedBase64 = await new Promise<string>((resolve, reject) => {
              const reader = new FileReader();
              reader.onload = () => resolve(reader.result as string);
              reader.onerror = reject;
              reader.readAsDataURL(genBlob);
            });
          }
        } catch { /* use URL directly if fetch fails */ }
      }

      // 7. Composite: draw original image, then paste generated image into the rectangle area
      console.log("[rectInpaint] Step 3: Combining generated image back into original...");
      const combinedImage = await new Promise<string>((resolve, reject) => {
        const origImg = new Image();
        origImg.crossOrigin = "anonymous";
        origImg.onload = () => {
          const genImg = new Image();
          genImg.crossOrigin = "anonymous";
          genImg.onload = () => {
            // Canvas at original image natural dimensions
            const canvas = document.createElement("canvas");
            canvas.width = origImg.naturalWidth;
            canvas.height = origImg.naturalHeight;
            const ctx = canvas.getContext("2d");
            if (!ctx) { reject(new Error("Cannot get canvas context")); return; }

            // Draw full original image
            ctx.drawImage(origImg, 0, 0);

            // IMPORTANT: Use the same scaling logic as cropImageToRectangle to avoid distortion
            let destRect = { ...rectangle };
            if (canvasDisplaySize && canvasDisplaySize.width > 0 && canvasDisplaySize.height > 0) {
              const containerW = canvasDisplaySize.width;
              const containerH = canvasDisplaySize.height;

              // Calculate how the image is rendered inside the container (object-contain logic)
              const imgAspect = origImg.naturalWidth / origImg.naturalHeight;
              const containerAspect = containerW / containerH;

              let renderedW: number, renderedH: number, offsetX: number, offsetY: number;
              if (imgAspect > containerAspect) {
                // Image is wider relative to container → pillarbox (black bars top/bottom)
                renderedW = containerW;
                renderedH = containerW / imgAspect;
                offsetX = 0;
                offsetY = (containerH - renderedH) / 2;
              } else {
                // Image is taller relative to container → letterbox (black bars left/right)
                renderedH = containerH;
                renderedW = containerH * imgAspect;
                offsetX = (containerW - renderedW) / 2;
                offsetY = 0;
              }

              const scaleX = origImg.naturalWidth / renderedW;
              const scaleY = origImg.naturalHeight / renderedH;

              // Subtract letterbox offset before scaling (same as cropImageToRectangle)
              destRect = {
                x: (rectangle.x - offsetX) * scaleX,
                y: (rectangle.y - offsetY) * scaleY,
                width: rectangle.width * scaleX,
                height: rectangle.height * scaleY,
              };
              
              console.log("[rectInpaint] Compositing details:", {
                canvasDisplaySize,
                origImgSize: { width: origImg.naturalWidth, height: origImg.naturalHeight },
                scale: { x: scaleX, y: scaleY },
                rectangle,
                destRect,
                genImgSize: { width: genImg.naturalWidth, height: genImg.naturalHeight }
              });
            } else {
              // Fallback: simple scaling if no canvas display size
              const scaleX = origImg.naturalWidth  / (canvasDisplaySize?.width  ?? 800);
              const scaleY = origImg.naturalHeight / (canvasDisplaySize?.height ?? 450);
              destRect = {
                x: rectangle.x * scaleX,
                y: rectangle.y * scaleY,
                width: rectangle.width * scaleX,
                height: rectangle.height * scaleY,
              };
              
              console.log("[rectInpaint] Compositing details (fallback):", {
                canvasDisplaySize,
                origImgSize: { width: origImg.naturalWidth, height: origImg.naturalHeight },
                scale: { x: scaleX, y: scaleY },
                rectangle,
                destRect,
                genImgSize: { width: genImg.naturalWidth, height: genImg.naturalHeight }
              });
            }

            // CRITICAL: Use the calculated destRect to avoid stretching
            // The generated image should have the same aspect ratio as the cropped area
            ctx.drawImage(genImg, destRect.x, destRect.y, destRect.width, destRect.height);

            const combined = canvas.toDataURL("image/png");
            console.log("[rectInpaint] Step 3 done: Combined image created");
            resolve(combined);
          };
          genImg.onerror = () => reject(new Error("Failed to load generated image"));
          genImg.src = generatedBase64;
        };
        origImg.onerror = () => reject(new Error("Failed to load original image"));
        origImg.src = imageBase64;
      });

      // 8. Show all three results: cropped, generated, combined
      setGeneratedImages(prev => [...prev, croppedImage, generatedImageUrl, combinedImage]);
      setShowGenPanel(true);
      // Update background to the combined result
      setBackgroundImage(combinedImage);
      console.log("[rectInpaint] ✅ Done - combined image set as background");

    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setInpaintError(msg);
      console.error("Rectangle inpaint error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  // ── Inpaint via n8n ───────────────────────────────────────────────────────
  const runInpaint = async () => {
    const mask = canvasState.mask;
    if (mask.length === 0 || !inpaintPrompt.trim()) return;

    setIsInpainting(true);
    setInpaintError(null);

    try {
      // 1. Get the background image URL
      const imageUrl = backgroundImage || activeShot?.imageUrl;
      if (!imageUrl) throw new Error("No background image to inpaint");

      // Store original image if not already stored
      if (!originalImage) {
        setOriginalImage(imageUrl);
      }

      // 2. Convert background image to base64
      let imageBase64: string;
      if (imageUrl.startsWith("data:")) {
        imageBase64 = imageUrl;
      } else {
        const res = await fetch(imageUrl);
        const blob = await res.blob();
        imageBase64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      }

      // 3. Render mask dots to a canvas and export as base64
      const canvasEl = canvasContainerRef.current?.querySelector('[data-canvas-editor="true"]');
      const rect = canvasEl?.getBoundingClientRect();
      const w = rect?.width ?? 800;
      const h = rect?.height ?? 450;

      const maskCanvas = document.createElement("canvas");
      maskCanvas.width = w;
      maskCanvas.height = h;
      const ctx = maskCanvas.getContext("2d");
      if (!ctx) throw new Error("Cannot get canvas context");
      // OpenAI inpaint mask: opaque (white) = keep, transparent = edit/inpaint
      // Fill all white (keep everything), then cut out painted dots (make transparent)
      ctx.fillStyle = "white";
      ctx.fillRect(0, 0, w, h);
      ctx.globalCompositeOperation = "destination-out";
      for (const dot of mask) {
        ctx.beginPath();
        ctx.arc(dot.x, dot.y, dot.r, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(0,0,0,1)";
        ctx.fill();
      }
      ctx.globalCompositeOperation = "source-over";
      const maskBase64 = maskCanvas.toDataURL("image/png");

      // 4. Send to n8n via API route
      const response = await fetch("/api/inpaint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: imageBase64,
          mask: maskBase64,
          prompt: inpaintPrompt,
          model: inpaintModel,
        }),
      });

      if (!response.ok) {
        const err = await response.json();
        // Handle both error formats: direct error field or nested error
        const errorMessage = err.error || err.message || err.suggestion || "Inpaint failed";
        throw new Error(errorMessage);
      }

      const result = await response.json();

      // 5. Store result in the generated images panel (append to bottom)
      const resultImage = result.image ?? result.url ?? result.output ?? result.data;
      if (resultImage) {
        setGeneratedImages(prev => [...prev, resultImage]); // Append to end
        setShowGenPanel(true);
        setCanvasState(prev => ({ ...prev, mask: [] }));
      } else {
        throw new Error("No image returned");
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setInpaintError(msg);
      console.error("Inpaint error:", err);
    } finally {
      setIsInpainting(false);
    }
  };

  const goTo = (id: string) => setActiveShotId(id);
  const goPrev = () => { if (activeIdx > 0) setActiveShotId(shots[activeIdx - 1].id); };
  const goNext = () => { if (activeIdx < shots.length - 1) setActiveShotId(shots[activeIdx + 1].id); };

  const saveField = (field: "voiceOver" | "notes" | "action") => {
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, [field]: fieldDraft } : s));
    setEditingField(null);
  };

  const startEdit = (field: "voice" | "notes" | "action") => {
    const map = { voice: "voiceOver", notes: "notes", action: "action" } as const;
    setFieldDraft(activeShot[map[field]] || "");
    setEditingField(field);
  };

  const handleAddComment = () => {
    if (!commentText.trim()) return;
    const nc: CommentItem = { id: `cm${Date.now()}`, author: "You", avatar: "Y", text: commentText, timestamp: "Just now" };
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, comments: [...s.comments, nc] } : s));
    setCommentText("");
  };

  const handleAddTag = () => {
    if (!newTagName.trim()) return;
    const tag: TagType = { id: `t${Date.now()}`, name: newTagName.trim(), color: newTagColor };
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, tags: [...s.tags, tag] } : s));
    setNewTagName("");
    setShowTagPicker(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onShotsChange(shots.map(s => s.id === activeShotId ? { ...s, tags: s.tags.filter(t => t.id !== tagId) } : s));
  };

  const handleRefUpload = () => {
    setRefImages(prev => [...prev, `ref-${Date.now()}`]);
  };

  const allComments = shots.flatMap(s => s.comments.map(c => ({ ...c, shotNum: s.shot })));

  if (!activeShot) return null;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-[#0d0d12]">
        {/* ── Top bar ── */}
        <div className="flex items-center gap-3 px-4 py-2.5 border-b border-white/6 shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm transition">
          <ChevronLeft className="w-4 h-4" /> Back
        </button>
        <div className="w-px h-5 bg-white/10" />
        <span className="text-white font-semibold text-sm">
          {String(activeIdx + 1).padStart(2, "0")}
        </span>
        {activeShot.tags.map(t => (
          <span key={t.id} className="px-2 py-0.5 rounded text-[10px] font-semibold text-white" style={{ backgroundColor: t.color + "cc" }}>
            {t.name}
          </span>
        ))}
        <div className="flex-1" />
        <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg text-sm transition">Download</button>
        <button className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition">Save</button>
      </div>

      {/* ── Timeline filmstrip (pic2 style) ── */}
      <div className="flex items-center gap-0 border-b border-white/6 bg-[#0e0e15] shrink-0">
        <div className="flex items-center gap-1 px-3 py-2 border-r border-white/6 shrink-0">
          <List className="w-4 h-4 text-pink-400" />
          <span className="text-pink-400 text-xs font-bold uppercase tracking-wide">Timeline</span>
        </div>
        <div className="flex-1 flex items-center gap-2 px-3 py-2 overflow-x-auto">
          {shots.map((shot, idx) => {
            const isActive = shot.id === activeShotId;
            const label = shot.description ? shot.description.slice(0, 14) + (shot.description.length > 14 ? "..." : "") : `Frame ${idx + 1}`;
            return (
              <button
                key={shot.id}
                onClick={() => goTo(shot.id)}
                className={`relative shrink-0 rounded-lg overflow-hidden border-2 transition flex flex-col ${
                  isActive ? "border-violet-500 bg-[#1e1e2a]" : "border-transparent bg-[#1a1a24] hover:border-white/20"
                }`}
                style={{ width: 100 }}
              >
                <div className="aspect-video bg-[#1e1e2a] flex items-center justify-center relative">
                  {shot.imageUrl
                    ? <img src={shot.imageUrl} alt="" className="w-full h-full object-cover" />
                    : <span className="text-gray-700 text-[10px]">Empty</span>
                  }
                  {shot.tags.length > 0 && (
                    <div className="absolute top-1 right-1 w-2 h-2 rounded-full" style={{ backgroundColor: shot.tags[0].color }} />
                  )}
                </div>
                <div className="px-1.5 py-1 text-center">
                  <span className={`text-[10px] truncate block ${isActive ? "text-white" : "text-gray-500"}`}>
                    {label}
                  </span>
                </div>
              </button>
            );
          })}
          {/* + Add button */}
          <button className="shrink-0 w-[100px] rounded-lg border-2 border-dashed border-white/10 bg-transparent flex flex-col items-center justify-center gap-1 py-4 hover:border-pink-500/40 hover:bg-white/2 transition">
            <Plus className="w-4 h-4 text-pink-400" />
            <span className="text-pink-400 text-[10px] font-medium">Add</span>
          </button>
        </div>
        <div className="px-3 text-gray-600 text-xs shrink-0">{activeIdx + 1}/{shots.length}</div>
      </div>

      {/* ── Main area ── */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left info panel (pic7/pic8 style) */}
        <div className="w-48 border-r border-white/6 flex flex-col bg-[#111118] shrink-0 overflow-y-auto">
          {/* Frame number */}
          <div className="px-3 pt-3 pb-2">
            <span className="text-white font-bold text-xl font-mono">
              {String(activeIdx + 1).padStart(2, "0")}
            </span>
          </div>

          {/* Version and Aspect Ratio */}
          <div className="px-3 pb-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1">
                <span className="text-gray-400 text-[10px] font-medium">Ver.1</span>
                <span className="text-gray-500 text-[9px]">Aspect Ratio</span>
                <select
                  value={activeShot.aspectRatio || "16:9"}
                  onChange={(e) => {
                    const newAspectRatio = e.target.value;
                    onShotsChange(shots.map(s => 
                      s.id === activeShotId 
                        ? { ...s, aspectRatio: newAspectRatio }
                        : s
                    ));
                    
                    // Update rectangle to match new aspect ratio if it exists
                    if (rectangle && canvasTool === "rectInpaint") {
                      const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                      if (container) {
                        const rect = container.getBoundingClientRect();
                        const arMap: Record<string, number> = { "16:9": 16/9, "9:16": 9/16, "1:1": 1 };
                        const targetRatio = arMap[newAspectRatio] ?? 16/9;
                        
                        // Start from current top-left corner position
                        const startX = rectangle.x;
                        const startY = rectangle.y;
                        
                        // Calculate maximum possible dimensions from current position
                        const maxWidth = rect.width - startX;
                        const maxHeight = rect.height - startY;
                        
                        // Calculate target dimensions that fit the aspect ratio within boundaries
                        let targetWidth, targetHeight;
                        if (maxWidth / maxHeight > targetRatio) {
                          // Height is limiting factor
                          targetHeight = maxHeight;
                          targetWidth = targetHeight * targetRatio;
                        } else {
                          // Width is limiting factor
                          targetWidth = maxWidth;
                          targetHeight = targetWidth / targetRatio;
                        }
                        
                        // Ensure minimum size
                        targetWidth = Math.max(20, targetWidth);
                        targetHeight = Math.max(20, targetHeight);
                        
                        // Animate the rectangle size change smoothly
                        if (!isAspectRatioAnimating) {
                          setIsAspectRatioAnimating(true);
                          
                          const startWidth = rectangle.width;
                          const startHeight = rectangle.height;
                          const duration = 300; // 300ms animation
                          const startTime = performance.now();
                          
                          const animate = (currentTime: number) => {
                            const elapsed = currentTime - startTime;
                            const progress = Math.min(elapsed / duration, 1);
                            
                            // Use ease-out cubic for smooth animation
                            const easeProgress = 1 - Math.pow(1 - progress, 3);
                            
                            const currentWidth = startWidth + (targetWidth - startWidth) * easeProgress;
                            const currentHeight = startHeight + (targetHeight - startHeight) * easeProgress;
                            
                            setRectangle({
                              x: startX,
                              y: startY,
                              width: currentWidth,
                              height: currentHeight,
                            });
                            
                            if (progress < 1) {
                              requestAnimationFrame(animate);
                            } else {
                              setIsAspectRatioAnimating(false);
                            }
                          };
                          
                          requestAnimationFrame(animate);
                        }
                      }
                    }
                  }}
                  className="bg-[#1c1c26] border border-white/10 rounded px-1.5 py-0.5 text-[9px] text-white focus:outline-none"
                >
                  <option value="16:9">16:9</option>
                  <option value="9:16">9:16</option>
                  <option value="1:1">1:1</option>
                </select>
              </div>
            </div>
            {/* Download Button */}
            <button
              onClick={() => {
                try {
                  // Create a temporary canvas to capture the DOM content
                  const canvasContainer = canvasContainerRef.current;
                  if (canvasContainer) {
                    const canvasEditor = canvasContainer.querySelector('[data-canvas-editor="true"]');
                    if (canvasEditor) {
                      // Use the browser's built-in capture capabilities
                      const rect = canvasEditor.getBoundingClientRect();
                      
                      // Create a temporary canvas
                      const tempCanvas = document.createElement('canvas');
                      const ctx = tempCanvas.getContext('2d');
                      
                      if (!ctx) {
                        throw new Error('Could not get canvas context');
                      }
                      
                      // Set canvas size
                      tempCanvas.width = rect.width * 2; // 2x for quality
                      tempCanvas.height = rect.height * 2;
                      
                      // Scale for high quality
                      ctx.scale(2, 2);
                      
                      // Fill background
                      ctx.fillStyle = '#13131a';
                      ctx.fillRect(0, 0, rect.width, rect.height);
                      
                      // Use DOM-to-Image approach with drawImage if possible
                      const bgImage = canvasEditor.querySelector('img');
                      if (bgImage) {
                        const img = new Image();
                        img.onload = () => {
                          ctx.drawImage(img, 0, 0, rect.width, rect.height);
                          finishDownload();
                        };
                        img.onerror = () => {
                          finishDownload();
                        };
                        img.src = bgImage.src;
                      } else {
                        finishDownload();
                      }
                      
                      function finishDownload() {
                        // Try to capture the content
                        const link = document.createElement('a');
                        link.download = `frame-${String(activeIdx + 1).padStart(2, "0")}.png`;
                        link.href = tempCanvas.toDataURL('image/png', 1.0);
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }
                      
                      return;
                    }
                  }
                  
                  // Fallback - try to find any canvas element
                  const anyCanvas = document.querySelector('canvas');
                  if (anyCanvas) {
                    const link = document.createElement('a');
                    link.download = `frame-${String(activeIdx + 1).padStart(2, "0")}.png`;
                    link.href = anyCanvas.toDataURL('image/png', 1.0);
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    return;
                  }
                  
                  console.error('No canvas found for download');
                  alert('Download not available. The storyboard uses DOM elements instead of canvas.');
                } catch (error) {
                  console.error('Download failed:', error);
                  alert('Download failed. Please try again.');
                }
              }}
              className="w-full px-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] font-medium transition flex items-center justify-center gap-1"
            >
              <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l4-4m-4 4h4" />
              </svg>
              Download PNG
            </button>
          </div>

          {/* Tags (interactive) */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Tag className="w-3 h-3 text-gray-500 shrink-0" />
              <span className="text-gray-400 text-[11px] font-medium">Tags</span>
              <button onClick={() => setShowTagPicker(v => !v)} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {activeShot.tags.map(t => (
                <span key={t.id} className="px-1.5 py-0.5 rounded text-[9px] font-semibold text-white inline-flex items-center gap-1 group/tag" style={{ backgroundColor: t.color + "cc" }}>
                  {t.name}
                  <button onClick={() => handleRemoveTag(t.id)} className="opacity-0 group-hover/tag:opacity-100 transition"><X className="w-2 h-2" /></button>
                </span>
              ))}
              {activeShot.tags.length === 0 && <span className="text-gray-700 text-[10px] italic">No tags</span>}
            </div>
            {showTagPicker && (
              <div className="mt-2 bg-[#1c1c26] border border-white/10 rounded-lg p-2 space-y-2">
                <input value={newTagName} onChange={e => setNewTagName(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddTag()}
                  placeholder="Tag name" className="w-full bg-[#25252f] border border-white/8 rounded px-2 py-1 text-white text-[10px] focus:outline-none" autoFocus />
                <div className="flex flex-wrap gap-1">
                  {TAG_COLORS.map(c => (
                    <button key={c} onClick={() => setNewTagColor(c)} aria-label={`Color ${c}`}
                      className={`w-4 h-4 rounded-sm transition ${newTagColor === c ? "ring-2 ring-white ring-offset-1 ring-offset-[#1c1c26]" : ""}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <button onClick={handleAddTag} disabled={!newTagName.trim()}
                  className="w-full px-2 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 text-white rounded text-[10px] font-medium transition">
                  Create
                </button>
              </div>
            )}
          </div>

          {/* Reference images (multi-upload) */}
          <div className="px-4 pb-3">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Upload className="w-3 h-3 text-gray-500 shrink-0" />
              <span className="text-gray-400 text-[11px] font-medium">Reference</span>
              <button onClick={handleRefUpload} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                <Plus className="w-2.5 h-2.5" />
              </button>
            </div>
            {refImages.length > 0 ? (
              <div className="grid grid-cols-2 gap-1">
                {refImages.map((ref) => (
                  <div key={ref} className="aspect-square bg-[#1e1e2a] rounded flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-gray-700" />
                  </div>
                ))}
              </div>
            ) : (
              <button onClick={handleRefUpload} className="w-full border border-dashed border-white/10 rounded-lg py-3 flex flex-col items-center gap-1 hover:border-white/20 transition">
                <Upload className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-gray-600 text-[9px]">Upload references</span>
              </button>
            )}
          </div>

          <div className="px-4 space-y-4 pb-4">
            {/* Voice over */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Mic className="w-3 h-3 text-gray-500 shrink-0" />
                <span className="text-gray-400 text-[11px] font-medium">Voice</span>
                <button onClick={() => startEdit("voice")} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
              {editingField === "voice" ? (
                <div>
                  <textarea value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                    className="w-full bg-[#1c1c26] border border-white/10 rounded-lg p-2 text-white text-xs resize-none focus:outline-none focus:border-violet-500/50 h-20" autoFocus />
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={() => saveField("voiceOver")} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingField(null)} className="text-gray-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {activeShot.voiceOver || <span className="text-gray-700 italic">No voice over</span>}
                </p>
              )}
            </div>

            {/* Notes */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <List className="w-3 h-3 text-gray-500 shrink-0" />
                <span className="text-gray-400 text-[11px] font-medium">Notes</span>
                <button onClick={() => startEdit("notes")} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
              {editingField === "notes" ? (
                <div>
                  <textarea value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                    className="w-full bg-[#1c1c26] border border-white/10 rounded-lg p-2 text-white text-xs resize-none focus:outline-none focus:border-violet-500/50 h-20" autoFocus />
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={() => saveField("notes")} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingField(null)} className="text-gray-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {activeShot.notes || <span className="text-gray-700 italic">No notes</span>}
                </p>
              )}
            </div>

            {/* Action */}
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <Play className="w-3 h-3 text-gray-500 shrink-0" />
                <span className="text-gray-400 text-[11px] font-medium">Action</span>
                <button onClick={() => startEdit("action")} className="ml-auto text-gray-600 hover:text-gray-400 transition">
                  <Pencil className="w-2.5 h-2.5" />
                </button>
              </div>
              {editingField === "action" ? (
                <div>
                  <textarea value={fieldDraft} onChange={e => setFieldDraft(e.target.value)}
                    className="w-full bg-[#1c1c26] border border-white/10 rounded-lg p-2 text-white text-xs resize-none focus:outline-none focus:border-violet-500/50 h-20" autoFocus />
                  <div className="flex gap-1.5 mt-1">
                    <button onClick={() => saveField("action")} className="text-green-400"><Check className="w-3.5 h-3.5" /></button>
                    <button onClick={() => setEditingField(null)} className="text-gray-500"><X className="w-3.5 h-3.5" /></button>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-[11px] leading-relaxed">
                  {activeShot.action || <span className="text-gray-700 italic">No action</span>}
                </p>
              )}
            </div>

            {/* Zoom indicator */}
            <div className="pt-2 border-t border-white/6">
              <div className="flex items-center justify-between mb-1">
                <span className="text-gray-600 text-[10px]">{zoom}%</span>
                <div className="flex gap-1">
                  <button onClick={() => setZoom(z => Math.max(25, z - 10))} className="text-gray-600 hover:text-gray-400 transition"><ZoomOut className="w-3 h-3" /></button>
                  <button onClick={() => setZoom(z => Math.min(200, z + 10))} className="text-gray-600 hover:text-gray-400 transition"><ZoomIn className="w-3 h-3" /></button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Center: large image */}
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Prev / Next arrows */}
          <button
            onClick={goPrev}
            disabled={activeIdx === 0}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition disabled:opacity-20"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            onClick={goNext}
            disabled={activeIdx === shots.length - 1}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 w-8 h-8 bg-black/50 hover:bg-black/80 rounded-full flex items-center justify-center text-white transition disabled:opacity-20"
          >
            <ChevronRight className="w-4 h-4" />
          </button>

          <div ref={canvasContainerRef} className="flex-1 overflow-hidden bg-[#0d0d12]">
            <CanvasEditor
              panelId={panelId}
              imageUrl={backgroundImage || activeShot.imageUrl}
              activeTool={canvasTool}
              state={canvasState}
              onStateChange={setCanvasState}
              brushSize={maskBrushSize}
              isEraser={isEraser}
              maskOpacity={maskOpacity}
              hiddenObjectIds={hiddenIds}
              onSelectionChange={setCanvasSelection}
              selection={canvasSelection}
              aspectRatio={activeShot.aspectRatio || "16:9"}
              rectangle={rectangle}
              onRectangleChange={setRectangle}
              canvasTool={canvasTool}
              isAspectRatioAnimating={isAspectRatioAnimating}
              resetAllTransformations={() => {
                // Reset all transformations for all objects
                setCanvasState(prev => ({
                  ...prev,
                  bubbles: prev.bubbles.map(b => ({ ...b, rotation: 0, flipX: false, flipY: false })),
                  textElements: prev.textElements.map(t => ({ ...t, rotation: 0, flipX: false, flipY: false })),
                  assetElements: prev.assetElements.map(a => ({ ...a, rotation: 0, flipX: false, flipY: false })),
                }));
              }}
            />
          </div>

          {/* Bottom: AI prompt bar */}
          <div className="border-t border-white/6 bg-[#111118] shrink-0">
            <div className="flex border-b border-white/6">
              <button className="flex-1 py-2.5 text-xs text-violet-400 border-b-2 border-violet-500 font-medium">Fine-tune current image</button>
              <button className="flex-1 py-2.5 text-xs text-gray-500 hover:text-gray-300 transition">Create new image</button>
            </div>
            <div className="flex items-center gap-3 px-4 py-3">
              <input
                placeholder="Describe your edit. Mention characters with @..."
                className="flex-1 bg-transparent text-white text-sm placeholder-gray-600 focus:outline-none"
              />
              <div className="flex items-center gap-2 text-gray-500 text-xs">
                <button className="hover:text-gray-300 transition">Upload</button>
                <span>|</span>
                <button className="hover:text-gray-300 transition"><MoreHorizontal className="w-4 h-4" /></button>
              </div>
              <button className="w-8 h-8 bg-violet-600 hover:bg-violet-700 rounded-full flex items-center justify-center transition">
                <Send className="w-3.5 h-3.5 text-white" />
              </button>
            </div>
          </div>
        </div>

        {/* Generated Images Panel (shown after inpaint) */}
        {showGenPanel && (
          <div className="w-[130px] border-l border-white/6 bg-[#0d0d14] flex flex-col shrink-0">
            <div className="flex items-center justify-between px-2 py-2 border-b border-white/6">
              <span className="text-[10px] text-gray-400 font-semibold">Generated</span>
              <button onClick={() => setShowGenPanel(false)} className="text-gray-600 hover:text-gray-300 transition">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-1.5 space-y-1.5">
              {/* Original image always at top */}
              {(originalImage || activeShot?.imageUrl) && (
                <div className="space-y-0.5">
                  <span className="text-[9px] text-gray-600 px-0.5">Original</span>
                  <div className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                    backgroundImage === (originalImage || activeShot?.imageUrl)
                      ? "border-blue-500/50"
                      : "border-white/20 hover:border-blue-500/60"
                  }`}
                    onClick={() => setBackgroundImage(originalImage || activeShot?.imageUrl || null)}
                    title="Click to show original image">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={originalImage || activeShot?.imageUrl} alt="Original" className="w-full aspect-video object-cover" />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                      <span className="text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition bg-black/60 px-1.5 py-0.5 rounded">Original</span>
                    </div>
                    {backgroundImage === (originalImage || activeShot?.imageUrl) && (
                      <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 text-white" />
                      </div>
                    )}
                  </div>
                </div>
              )}
              {/* Generated results */}
              {generatedImages.length > 0 && (
                <span className="text-[9px] text-gray-600 px-0.5">Generated</span>
              )}
              {generatedImages.map((imgUrl, i) => (
                <div key={i} className={`relative group cursor-pointer rounded-lg overflow-hidden border-2 transition ${
                  backgroundImage === imgUrl
                    ? "border-blue-500/50"
                    : "border-transparent hover:border-blue-500/60"
                }`}
                  onClick={() => setBackgroundImage(imgUrl)}
                  title="Click to apply">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={imgUrl} alt={`Generated ${i + 1}`} className="w-full aspect-video object-cover" />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center">
                    <span className="text-white text-[9px] font-bold opacity-0 group-hover:opacity-100 transition bg-black/60 px-1.5 py-0.5 rounded">Apply</span>
                  </div>
                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Prevent triggering the image click
                      setGeneratedImages(prev => prev.filter((_, index) => index !== i));
                    }}
                    className="absolute top-1 left-1 w-5 h-5 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-lg z-10"
                    title="Delete image">
                    <X className="w-3 h-3 text-white" />
                  </button>
                  {backgroundImage === imgUrl && (
                    <div className="absolute top-1 right-1 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Right: vertical icon strip */}
        <div className="w-[52px] border-l border-white/6 bg-[#0a0a0f] flex flex-col items-center py-3 gap-0.5 shrink-0">
          {([
            { id: "layers"   as CanvasTool, Icon: Layers,       label: "Layers",   color: "white"   },
            { id: "bubbles"  as CanvasTool, Icon: MessageSquare, label: "Bubbles",  color: "emerald" },
            { id: "text"     as CanvasTool, Icon: Type,          label: "Text",     color: "purple"  },
            { id: "assets"   as CanvasTool, Icon: ImageIcon,     label: "Asset",    color: "orange"  },
            { id: "inpaint"  as CanvasTool, Icon: Paintbrush,    label: "Inpaint",  color: "blue"    },
            { id: "rectInpaint" as CanvasTool, Icon: Square,       label: "Rect",     color: "cyan"   },
            { id: "image"    as CanvasTool, Icon: ImageIcon,     label: "Image",    color: "purple"  },
            { id: "crop"     as CanvasTool, Icon: ImageIcon,     label: "Crop",     color: "orange"  },
            { id: "comments" as CanvasTool, Icon: MessageSquare, label: "Comments", color: "gray"    },
          ] as { id: CanvasTool; Icon: React.ElementType; label: string; color: string }[]).map(({ id, Icon, label, color }) => (
            <button key={id} onClick={() => setCanvasTool(id)}
              className={`w-[44px] py-2.5 rounded-lg flex flex-col items-center gap-1 transition-all ${
                canvasTool === id
                  ? color === "emerald" ? "bg-emerald-500/15 text-emerald-300"
                  : color === "purple"  ? "bg-purple-500/15 text-purple-300"
                  : color === "orange"  ? "bg-orange-500/15 text-orange-300"
                  : color === "blue"    ? "bg-blue-500/15 text-blue-300"
                  : color === "cyan"    ? "bg-cyan-500/15 text-cyan-300"
                  : color === "gray"    ? "bg-white/10 text-gray-300"
                  : "bg-white/10 text-white"
                  : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
              }`}>
              <Icon className="w-4 h-4" />
              <span className="text-[8px] font-medium leading-none">{label}</span>
            </button>
          ))}
        </div>

        {/* Right: tool content panel */}
        <div className="w-60 border-l border-white/6 flex flex-col bg-[#111118] shrink-0 overflow-y-auto">

          {/* ── Layers ── */}
          {canvasTool === "layers" && (
            <div className="p-3 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-white text-xs font-bold">All Objects</span>
                  <span className="text-gray-500 text-[10px] font-mono">{allLayers.length}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => {
                    // Reset all transformations for all objects
                    setCanvasState(prev => ({
                      ...prev,
                      bubbles: prev.bubbles.map(b => ({ ...b, rotation: 0, flipX: false, flipY: false })),
                      textElements: prev.textElements.map(t => ({ ...t, rotation: 0, flipX: false, flipY: false })),
                      assetElements: prev.assetElements.map(a => ({ ...a, rotation: 0, flipX: false, flipY: false })),
                    }));
                  }} className="text-[10px] text-gray-400 hover:text-blue-400 transition flex items-center gap-1" title="Reset All Transformations">
                    <RotateCcw className="w-3 h-3" />
                    Reset
                  </button>
                  <button onClick={toggleAllVisibility} className="text-[10px] text-gray-400 hover:text-gray-200 transition flex items-center gap-1">
                    {[...panelBubbles, ...panelTexts, ...panelAssets].every(o => hiddenIds.has(o.id)) ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                    {[...panelBubbles, ...panelTexts, ...panelAssets].every(o => hiddenIds.has(o.id)) ? "Show All" : "Hide All"}
                  </button>
                </div>
              </div>
              <div className="space-y-1">
                {allLayers.length === 0 && <div className="text-center py-8 text-gray-600 text-[10px]">No objects yet.<br/>Use the tools to add bubbles, text, or assets.</div>}
                {allLayers.map((layer, index) => {
                  const isSelected = canvasSelection.selectedBubbleId === layer.id || 
                                   canvasSelection.selectedTextId === layer.id || 
                                   canvasSelection.selectedAssetId === layer.id;
                  const isTopLayer = index === 0;
                  const isBottomLayer = index === allLayers.length - 1;
                  
                  return (
                    <div key={layer.id} onClick={() => {
                      setSelectedLayerId(layer.id);
                      // Select the object on canvas
                      if (layer.type === "bubble") setCanvasSelection({ selectedBubbleId: layer.id, selectedTextId: null, selectedAssetId: null });
                      else if (layer.type === "text") setCanvasSelection({ selectedBubbleId: null, selectedTextId: layer.id, selectedAssetId: null });
                      else setCanvasSelection({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: layer.id });
                    }}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition border ${
                        isSelected ? "bg-white/15 border-white/30" : 
                        selectedLayerId === layer.id ? "bg-white/10 border-white/20" : 
                        "bg-white/5 hover:bg-white/8 border-transparent"
                      }`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-2 h-2 rounded-full shrink-0 ${
                          layer.color === "emerald" ? "bg-emerald-500" : 
                          layer.color === "purple" ? "bg-purple-500" : 
                          "bg-orange-500"
                        } ${isSelected ? "ring-2 ring-white ring-offset-1 ring-offset-[#0f1117]" : ""}`} />
                        <div className="flex-1 min-w-0">
                          <span className={`text-[10px] truncate block ${
                            hiddenIds.has(layer.id) ? "text-gray-600 line-through" : 
                            isSelected ? "text-white font-medium" : "text-gray-300"
                          }`}>{layer.label}</span>
                          <span className="text-[8px] text-gray-600">z: {layer.zIndex}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5 shrink-0">
                        {/* Layering controls */}
                        <button onClick={e => { e.stopPropagation(); moveLayer(layer.id, "forward"); }} 
                          disabled={isTopLayer}
                          className={`p-0.5 transition ${
                            isTopLayer ? "text-gray-700 cursor-not-allowed" : "text-gray-600 hover:text-blue-400"
                          }`} title="Move Forward">
                          <ChevronUp className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); moveLayer(layer.id, "backward"); }} 
                          disabled={isBottomLayer}
                          className={`p-0.5 transition ${
                            isBottomLayer ? "text-gray-700 cursor-not-allowed" : "text-gray-600 hover:text-blue-400"
                          }`} title="Move Backward">
                          <ChevronDown className="w-3 h-3" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); toggleVisibility(layer.id); }} 
                          className="p-0.5 text-gray-600 hover:text-gray-300 transition" 
                          title={hiddenIds.has(layer.id) ? "Show" : "Hide"}>
                          {hiddenIds.has(layer.id) ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button onClick={e => { e.stopPropagation(); deleteLayer(layer.id); }} 
                          className="p-0.5 text-gray-600 hover:text-red-400 transition" 
                          title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="text-[9px] text-gray-600 pt-1 border-t border-white/6">
                Click to select • ↑↓ Move layers • 👁 Show/Hide • Highest z-index at top
              </div>
            </div>
          )}

          {/* ── Bubbles ── */}
          {canvasTool === "bubbles" && (() => {
            const selBubble = panelBubbles.find(b => b.id === canvasSelection.selectedBubbleId) ?? null;
            const updBubble = (patch: Record<string, unknown>) => {
              if (!selBubble) return;
              setCanvasState(s => ({ ...s, bubbles: s.bubbles.map(b => b.id === selBubble.id ? { ...b, ...patch } : b) }));
            };
            return (
            <div className="p-3 space-y-3">
              <div><h3 className="text-white font-bold text-sm">Bubble Tool</h3><p className="text-[10px] text-gray-500 mt-0.5">Place & style manga speech bubbles</p></div>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-300 font-semibold">Bubbles ({panelBubbles.length})</span>
                  <button onClick={addBubble} className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-semibold transition flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                </div>
                <textarea value={newBubbleText} onChange={e => setNewBubbleText(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), addBubble())}
                  placeholder="Type text, then Add..." rows={2}
                  className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded-lg text-[10px] text-white placeholder-gray-600 focus:outline-none resize-none" />
                <select value={newBubbleType} onChange={e => setNewBubbleType(e.target.value as BubbleType)}
                  className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded-lg text-[10px] text-white focus:outline-none">
                  <option value="speech">Speech</option><option value="speechRough">Speech (Rough)</option>
                  <option value="thought">Thought (Cloud)</option><option value="whisper">Whisper (Dashed)</option>
                  <option value="shout">Shout (Burst)</option><option value="sfx">SFX (Spiky)</option>
                  <option value="rect">Rectangle</option><option value="rectRound">Rectangle (Round)</option><option value="oval">Oval</option>
                </select>
                <div className="grid grid-cols-3 gap-1">
                  {(["speech","thought","shout","whisper","sfx","rectRound"] as BubbleType[]).map(t => (
                    <button key={t} onClick={() => {
                      const id = makeId();
                      const { cx: bcx, cy: bcy } = getCanvasCenter();
                      setCanvasState(s => ({ ...s, bubbles: [...s.bubbles, { id, panelId, x: bcx - 100, y: bcy - 50, w: 200, h: 100, text: t==="sfx"?"BOOM!":"test...", bubbleType: t, tailMode: t==="shout"||t==="sfx"?"none":"auto", tailDir: "bottom-left" as TailDir, tailX: 80, tailY: 140, autoFitFont: true, fontSize: 16 }] }));
                      setCanvasSelection({ selectedBubbleId: id, selectedTextId: null, selectedAssetId: null });
                    }} className="p-1 bg-[#1a1a24] border border-white/10 hover:border-emerald-500/40 rounded text-[9px] text-gray-300 hover:text-white transition text-center capitalize">
                      {t==="speechRough"?"Rough":t==="rectRound"?"RndRect":t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-1">
                {panelBubbles.length === 0 && <div className="text-center py-3 text-gray-600 text-[10px]">No bubbles yet</div>}
                {panelBubbles.map((b, i) => (
                  <button key={b.id} onClick={() => setCanvasSelection({ selectedBubbleId: b.id, selectedTextId: null, selectedAssetId: null })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${b.id===canvasSelection.selectedBubbleId?"bg-emerald-500/10 border-emerald-500/30 text-emerald-200":"bg-[#13131a] border-white/10 text-gray-300 hover:bg-white/5"}`}>
                    <span className="text-[10px] font-semibold">Bubble {i+1}</span>
                    <span className="text-[9px] text-gray-500">{b.bubbleType}</span>
                  </button>
                ))}
              </div>
              {selBubble ? (
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
                  <span className="text-[11px] text-emerald-400 font-semibold block">Selected Bubble</span>
                  <div><span className="text-[10px] text-gray-300 block mb-1">Text</span><textarea value={selBubble.text} onChange={e => updBubble({ text: e.target.value })} className="w-full bg-[#1a1a24] border border-white/10 rounded px-2 py-1 text-[10px] text-white resize-none focus:outline-none" rows={2} /></div>
                  <div><span className="text-[10px] text-gray-300 block mb-1">Bubble Type</span><div className="grid grid-cols-3 gap-1">{(["speech","thought","shout","whisper","rect","rectRound"] as const).map(type => (<button key={type} onClick={() => updBubble({ bubbleType: type })} className={`py-1 rounded text-[9px] font-semibold border transition ${type===selBubble.bubbleType?"bg-emerald-500/15 border-emerald-500/30 text-emerald-200":"bg-[#1a1a24] border-white/10 text-gray-400 hover:bg-white/5"}`}>{type}</button>))}</div></div>
                  {selBubble.bubbleType !== "thought" && (
                    <div><span className="text-[10px] text-gray-300 block mb-1">Tail Direction</span><div className="grid grid-cols-2 gap-1">{(["bottom-left","bottom-right","left","right"] as const).map(dir => (<button key={dir} onClick={() => updBubble({ tailDir: dir })} className={`py-1 rounded text-[9px] font-semibold border transition ${selBubble.tailDir===dir?"bg-emerald-500/15 border-emerald-500/30 text-emerald-200":"bg-[#1a1a24] border-white/10 text-gray-400 hover:bg-white/5"}`}>{dir==="bottom-left"?"↙BL":dir==="bottom-right"?"↘BR":dir==="left"?"←L":"→R"}</button>))}</div></div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-300">Auto-fit font</span>
                    <button onClick={() => updBubble({ autoFitFont: !selBubble.autoFitFont })} className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${selBubble.autoFitFont?"bg-emerald-500/15 border-emerald-500/30 text-emerald-200":"bg-white/5 border-white/10 text-gray-300"}`}>{selBubble.autoFitFont?"On":"Off"}</button>
                  </div>
                  {!selBubble.autoFitFont && (
                    <div>
                      <div className="flex justify-between mb-1"><span className="text-[10px] text-gray-300">Font Size</span><span className="text-[10px] text-emerald-300 font-mono">{selBubble.fontSize}px</span></div>
                      <input type="range" min={10} max={44} value={selBubble.fontSize} onChange={e => updBubble({ fontSize: Number(e.target.value) })} className="w-full accent-emerald-500" />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-gray-300">Flip Colors</span>
                    <button onClick={() => updBubble({ flippedColors: !selBubble.flippedColors })} className={`px-2 py-0.5 rounded text-[10px] font-semibold border transition ${selBubble.flippedColors?"bg-blue-500/15 border-blue-500/30 text-blue-200":"bg-white/5 border-white/10 text-gray-300"}`}>{selBubble.flippedColors?"Flipped":"Normal"}</button>
                  </div>
                </div>
              ) : <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3"><p className="text-[10px] text-gray-500 text-center">Click a bubble on canvas or in the list to edit its properties</p></div>}
              
              {/* Generate Image Button */}
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                <button
                  onClick={generateImageWithElements}
                  disabled={!backgroundImage || isInpainting}
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                  title="Generate image with all text bubbles and assets">
                  {isInpainting ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                  ) : (
                    <>
                      <ImageIcon className="w-3.5 h-3.5" />
                      Generate Image with Bubbles
                    </>
                  )}
                </button>
                {inpaintError && (
                  <p className="text-red-400 text-[10px] mt-1">{inpaintError}</p>
                )}
              </div>
            </div>
            );
          })()}

          {/* ── Text ── */}
          {canvasTool === "text" && (() => {
            const selText = panelTexts.find(t => t.id === canvasSelection.selectedTextId) ?? null;
            const updText = (patch: Record<string, unknown>) => { if (!selText) return; setCanvasState(s => ({ ...s, textElements: s.textElements.map(t => t.id === selText.id ? { ...t, ...patch } : t) })); };
            return (
            <div className="p-3 space-y-3">
              <div><h3 className="text-white font-bold text-sm">Text Tool</h3><p className="text-[10px] text-gray-500 mt-0.5">Add & style standalone text elements</p></div>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] text-gray-300 font-semibold">Text ({panelTexts.length})</span>
                  <button onClick={addText} className="px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[10px] font-semibold transition flex items-center gap-1"><Plus className="w-3 h-3" />Add</button>
                </div>
                <textarea value={newTextContent} onChange={e => setNewTextContent(e.target.value)} placeholder="Type text, then Add..." rows={2}
                  className="w-full px-2 py-1.5 bg-[#1a1a24] border border-white/10 rounded-lg text-[10px] text-white placeholder-gray-600 focus:outline-none resize-none" />
                <div className="flex gap-2">
                  <div className="flex-1"><label className="text-[9px] text-gray-500 block mb-0.5">Size</label><input type="number" value={newTextSize} onChange={e => setNewTextSize(Number(e.target.value))} min={8} max={72} className="w-full px-2 py-1 bg-[#1a1a24] border border-white/10 rounded text-[10px] text-white focus:outline-none" /></div>
                  <div className="flex-1"><label className="text-[9px] text-gray-500 block mb-0.5">Color</label><input type="color" value={newTextColor} onChange={e => setNewTextColor(e.target.value)} className="w-full h-[26px] bg-[#1a1a24] border border-white/10 rounded cursor-pointer" /></div>
                </div>
              </div>
              <div className="space-y-1">
                {panelTexts.length === 0 && <div className="text-center py-3 text-gray-600 text-[10px]">No text yet</div>}
                {panelTexts.map((t, i) => (
                  <button key={t.id} onClick={() => setCanvasSelection({ selectedBubbleId: null, selectedTextId: t.id, selectedAssetId: null })}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition ${t.id===canvasSelection.selectedTextId?"bg-purple-500/10 border-purple-500/30 text-purple-200":"bg-[#13131a] border-white/10 text-gray-300 hover:bg-white/5"}`}>
                    <span className="text-[10px] font-semibold truncate flex-1">Text {i+1}: {t.text.slice(0,12)}</span>
                    <span onClick={e => { e.stopPropagation(); deleteLayer(t.id); }} className="text-gray-600 hover:text-red-400 ml-1 shrink-0 cursor-pointer"><Trash2 className="w-3 h-3" /></span>
                  </button>
                ))}
              </div>
              {selText ? (
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
                  <span className="text-[11px] text-purple-400 font-semibold block">Selected Text</span>
                  <div><div className="flex justify-between mb-1"><span className="text-[10px] text-gray-300">Font Size</span><span className="text-[10px] text-purple-300 font-mono">{selText.fontSize}px</span></div><input type="range" min={12} max={72} value={selText.fontSize} onChange={e => updText({ fontSize: Number(e.target.value) })} className="w-full accent-purple-500" /></div>
                  <div><span className="text-[10px] text-gray-300 block mb-1">Weight</span><div className="grid grid-cols-2 gap-1">{(["400","700"] as const).map(w => (<button key={w} onClick={() => updText({ fontWeight: w })} className={`py-1 rounded text-[10px] border transition ${selText.fontWeight===w?"bg-purple-500/20 border-purple-500/40 text-purple-200":"bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>{w==="400"?"Normal":"Bold"}</button>))}</div></div>
                  <div><span className="text-[10px] text-gray-300 block mb-1">Style</span><div className="grid grid-cols-2 gap-1">{(["normal","italic"] as const).map(s => (<button key={s} onClick={() => updText({ fontStyle: s })} className={`py-1 rounded text-[10px] border transition capitalize ${selText.fontStyle===s?"bg-purple-500/20 border-purple-500/40 text-purple-200":"bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>{s}</button>))}</div></div>
                  <div><label className="text-[10px] text-gray-300 block mb-1">Font Family</label><select value={selText.fontFamily} onChange={e => updText({ fontFamily: e.target.value as FontFamily })} className="w-full bg-[#1a1a24] border border-white/10 rounded px-2 py-1 text-[10px] text-white focus:outline-none"><option value="Arial">Arial</option><option value="Times New Roman">Times New Roman</option><option value="Comic Sans MS">Comic Sans MS</option><option value="Impact">Impact</option><option value="Verdana">Verdana</option><option value="Georgia">Georgia</option><option value="Noto Sans JP">Noto Sans JP</option><option value="Roboto">Roboto</option><option value="Montserrat">Montserrat</option></select></div>
                  <div className="flex gap-2"><div className="flex-1"><label className="text-[10px] text-gray-300 block mb-1">Color</label><input type="color" value={selText.color} onChange={e => updText({ color: e.target.value })} className="w-full h-7 rounded cursor-pointer border border-white/10" /></div><div className="flex-1"><label className="text-[10px] text-gray-300 block mb-1">Border px</label><input type="range" min={0} max={10} value={selText.borderWidth ?? 0} onChange={e => updText({ borderWidth: Number(e.target.value) })} className="w-full accent-purple-500 mt-2" /></div></div>
                  {(selText.borderWidth ?? 0) > 0 && (<div><label className="text-[10px] text-gray-300 block mb-1">Border Color</label><input type="color" value={selText.borderColor ?? "#000000"} onChange={e => updText({ borderColor: e.target.value })} className="w-full h-7 rounded cursor-pointer border border-white/10" /></div>)}
                                  </div>
              ) : <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3"><p className="text-[10px] text-gray-500 text-center">Click a text element on canvas or in the list to edit its properties</p></div>}
            </div>
            );
          })()}

          {/* ── Asset ── */}
          {canvasTool === "assets" && (() => {
            const selAsset = panelAssets.find(a => a.id === canvasSelection.selectedAssetId) ?? null;
            const updAsset = (patch: Record<string, unknown>) => { if (!selAsset) return; setCanvasState(s => ({ ...s, assetElements: s.assetElements.map(a => a.id === selAsset.id ? { ...a, ...patch } : a) })); };
            return (
            <div className="p-3 space-y-3">
              <div><h3 className="text-white font-bold text-sm">Asset Tool</h3><p className="text-[10px] text-gray-500 mt-0.5">Upload & place images on canvas</p></div>
              <input ref={assetInputRef} type="file" accept="image/*" className="hidden" onChange={handleAssetUpload} />
              <button onClick={() => assetInputRef.current?.click()}
                className="w-full py-2.5 border border-dashed border-white/15 hover:border-orange-500/40 rounded-lg text-[11px] text-gray-500 hover:text-orange-300 transition flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" /> Upload Asset
              </button>
              <div className="space-y-1">
                {panelAssets.length === 0 && <div className="text-center py-3 text-gray-600 text-[10px]">No assets yet</div>}
                {panelAssets.map((a, i) => {
                  const lib = canvasState.assetLibrary.find(l => l.id === a.assetId);
                  return (
                    <div key={a.id} onClick={() => setCanvasSelection({ selectedBubbleId: null, selectedTextId: null, selectedAssetId: a.id })}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg border text-left transition cursor-pointer ${a.id===canvasSelection.selectedAssetId?"bg-orange-500/10 border-orange-500/30":"bg-[#13131a] border-white/10 hover:bg-white/5"}`}>
                      <div className="flex items-center gap-1.5 min-w-0">
                        {lib && <img src={lib.url} alt={lib.name} className="w-6 h-6 object-cover rounded shrink-0" />} {/* eslint-disable-line @next/next/no-img-element */}
                        <span className={`text-[10px] truncate ${a.id===canvasSelection.selectedAssetId?"text-orange-200":"text-gray-300"}`}>Asset {i+1}</span>
                      </div>
                      <button onClick={e => { e.stopPropagation(); deleteLayer(a.id); }} className="text-gray-600 hover:text-red-400 ml-1 shrink-0"><Trash2 className="w-3 h-3" /></button>
                    </div>
                  );
                })}
              </div>
                          </div>
            );
          })()}

          {/* ── Brush Inpaint ── */}
          {canvasTool === "inpaint" && (
            <div className="p-3 space-y-3">
              <div><h3 className="text-white font-bold text-sm">Brush Inpaint</h3><p className="text-[10px] text-gray-500 mt-0.5">Paint areas to inpaint with AI</p></div>
              
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => setIsEraser(false)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border ${!isEraser?"bg-blue-500/20 border-blue-500/40 text-blue-200":"bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>
                    <Paintbrush className="w-3.5 h-3.5" /> Brush
                  </button>
                  <button onClick={() => setIsEraser(true)}
                    className={`px-2 py-2 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5 border ${isEraser?"bg-red-500/20 border-red-500/40 text-red-200":"bg-white/5 border-white/10 text-gray-400 hover:bg-white/10"}`}>
                    <Eraser className="w-3.5 h-3.5" /> Eraser
                  </button>
                </div>
                <div className="flex items-center justify-center py-1">
                  <div className="rounded-full border-2" style={{ width: Math.min(maskBrushSize*1.5, 64), height: Math.min(maskBrushSize*1.5, 64), borderColor: isEraser?"rgba(239,68,68,0.5)":"rgba(59,130,246,0.5)", backgroundColor: isEraser?"rgba(239,68,68,0.15)":"rgba(59,130,246,0.15)" }} />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-[11px] text-gray-300 font-semibold">Size</span><span className="text-[11px] text-blue-300 font-mono">{maskBrushSize}px</span></div>
                  <input type="range" min={4} max={80} value={maskBrushSize} onChange={e => setMaskBrushSize(Number(e.target.value))} className="w-full accent-blue-500" />
                </div>
                <div>
                  <div className="flex justify-between mb-1"><span className="text-[11px] text-gray-300 font-semibold">Opacity</span><span className="text-[11px] text-gray-400 font-mono">{Math.round(maskOpacity*100)}%</span></div>
                  <input type="range" min={0.05} max={1} step={0.05} value={maskOpacity} onChange={e => setMaskOpacity(Number(e.target.value))} className="w-full accent-blue-500" />
                </div>
              </div>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex gap-2">
                  <button onClick={() => setCanvasState(s => undoMask(s))} disabled={canvasState.undoStack.length === 0}
                    className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1">
                    <RotateCcw className="w-3 h-3" /> Undo
                  </button>
                  <button onClick={() => setCanvasState(s => redoMask(s))} disabled={canvasState.redoStack.length === 0}
                    className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-white/10 disabled:opacity-30 text-gray-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1">
                    <RotateCw className="w-3 h-3" /> Redo
                  </button>
                </div>
                <button onClick={() => setCanvasState(s => ({ ...s, mask: [] }))} disabled={canvasState.mask.length === 0}
                  className="w-full px-2 py-1.5 bg-white/5 hover:bg-red-500/10 disabled:opacity-30 text-gray-300 hover:text-red-300 rounded-lg text-[11px] font-semibold transition">
                  Clear Mask
                </button>
              </div>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <label className="text-[11px] text-gray-300 font-semibold">Inpaint Prompt</label>
                <textarea value={inpaintPrompt} onChange={e => setInpaintPrompt(e.target.value)}
                  placeholder='e.g. "Remove logo" or "Add sweat drops"' rows={3}
                  className="w-full px-2 py-1.5 bg-[#13131a] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 resize-none" />
                <label className="text-[10px] text-gray-500 font-semibold">Model</label>
                <select
                  value={inpaintModel}
                  onChange={e => setInpaintModel(e.target.value as typeof inpaintModel)}
                  className="w-full px-2 py-1.5 bg-[#13131a] border border-white/10 rounded-lg text-[11px] text-white focus:outline-none focus:border-blue-500/50 cursor-pointer">
                  <option value="nano-banana">Nano Banana (google/nano-banana-edit)</option>
                  <option value="flux-kontext-pro">Flux Kontext Pro (flux-kontext-pro)</option>
                  <option value="openai-4o">OpenAI 4o Image (gpt-image/1.5) ✨</option>
                  <option value="grok">Grok Imagine (grok-imagine/image-to-image) ✨</option>
                  <option value="qwen-z-image">Qwen Z Image (qwen-z-image)</option>
                </select>
                <button
                  onClick={runInpaint}
                  disabled={canvasState.mask.length === 0 || !inpaintPrompt.trim() || isInpainting}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5">
                  {isInpainting ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                  ) : "Generate"}
                </button>
                {inpaintError && (
                  <p className="text-red-400 text-[10px] mt-1">{inpaintError}</p>
                )}
              </div>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${canvasState.mask.length > 0 ? "bg-blue-400 animate-pulse" : "bg-gray-600"}`} />
                  <span className={`text-[11px] font-medium ${canvasState.mask.length > 0 ? "text-blue-300" : "text-gray-500"}`}>
                    {canvasState.mask.length > 0 ? `${canvasState.mask.length} points painted` : "No mask painted"}
                  </span>
                </div>
                <button
                    onClick={() => setShowGenPanel(v => !v)}
                    className="w-full py-1.5 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/30 text-blue-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5">
                    <ImageIcon className="w-3 h-3" />
                    {showGenPanel ? "Hide Results" : generatedImages.length > 0 ? `View Results (${generatedImages.length})` : "View Panel"}
                </button>
              </div>
            </div>
          )}

          {/* ── Rectangle Inpaint ── */}
          {canvasTool === "rectInpaint" && (
            <div className="p-3 space-y-3">
              <div><h3 className="text-white font-bold text-sm">Rectangle Inpaint</h3><p className="text-[10px] text-gray-500 mt-0.5">Select rectangle areas to inpaint with AI</p></div>
              
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-gray-300 font-semibold">Rectangle Selection</label>
                    <div className="flex gap-1">
                      <button 
                        onClick={() => {
                          const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                          if (container) {
                            const rect = container.getBoundingClientRect();
                            const width = rect.width * 0.5;
                            const height = rect.height * 0.5;
                            const x = (rect.width - width) / 2;
                            const y = (rect.height - height) / 2;
                            setRectangle({ x, y, width, height });
                          }
                        }}
                        className="px-2 py-1 bg-cyan-600 hover:bg-cyan-700 text-white rounded text-[10px] font-semibold transition">
                        Add Rectangle
                      </button>
                      <button 
                        onClick={() => setRectangle(null)}
                        disabled={!rectangle}
                        className="px-2 py-1 bg-red-600 hover:bg-red-700 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded text-[10px] font-semibold transition">
                        Clear
                      </button>
                    </div>
                  </div>
                  {rectangle && (
                    <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-lg p-2">
                      <p className="text-[10px] text-cyan-300">
                        Rectangle: {Math.round(rectangle.width)}×{Math.round(rectangle.height)} at ({Math.round(rectangle.x)}, {Math.round(rectangle.y)})
                      </p>
                    </div>
                  )}
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-300 font-semibold">Inpaint Prompt</label>
                  <textarea
                    value={inpaintPrompt}
                    onChange={(e) => setInpaintPrompt(e.target.value)}
                    placeholder="Describe what to generate in the rectangle area..."
                    className="w-full px-2 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-500 resize-none h-16 focus:outline-none focus:border-cyan-500/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-300 font-semibold">Model</label>
                  <select
                    value={inpaintModel}
                    onChange={(e) => setInpaintModel(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-[11px] text-white focus:outline-none focus:border-cyan-500/50"
                  >
                    <option value="nano-banana">Nano Banana</option>
                    <option value="flux-kontext-pro">Flux Kontext Pro</option>
                    <option value="openai-4o">OpenAI 4o</option>
                    <option value="grok">Grok Imagine</option>
                    <option value="qwen-z-image">Qwen Z Image</option>
                  </select>
                  {inpaintModel !== "openai-4o" && (
                    <p className="text-yellow-500 text-[9px] mt-1">⚠️ Use OpenAI 4o for proper rectangle inpainting</p>
                  )}
                  <button
                    onClick={runRectangleInpaint}
                    disabled={!rectangle || !inpaintPrompt.trim() || isInpainting}
                    className="w-full py-2 bg-cyan-600 hover:bg-cyan-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5">
                    {isInpainting ? (
                      <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                    ) : "Generate Rectangle Inpaint"}
                  </button>
                  {inpaintError && (
                    <p className="text-red-400 text-[10px] mt-1">{inpaintError}</p>
                  )}
                </div>
                
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${rectangle ? "bg-cyan-400 animate-pulse" : "bg-gray-600"}`} />
                    <span className={`text-[11px] font-medium ${rectangle ? "text-cyan-300" : "text-gray-500"}`}>
                      {rectangle ? `Rectangle ready: ${Math.round(rectangle.width)}×${Math.round(rectangle.height)}` : "No rectangle selected"}
                    </span>
                  </div>
                  <button
                      onClick={() => setShowGenPanel(v => !v)}
                      className="w-full py-1.5 bg-cyan-500/10 hover:bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5">
                      <ImageIcon className="w-3 h-3" />
                      {showGenPanel ? "Hide Results" : generatedImages.length > 0 ? `View Results (${generatedImages.length})` : "View Panel"}
                  </button>
                </div>
              </div>
            </div>
          )}

              
          {/* ── Image Generation ── */}
          {canvasTool === "image" && (
            <>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
                <div><h3 className="text-white font-bold text-sm">Image Generation</h3><p className="text-[10px] text-gray-500 mt-0.5">Generate images with AI models</p></div>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-300 font-semibold">Prompt</label>
                  <textarea
                    value={imageInpaintPrompt}
                    onChange={(e) => setImageInpaintPrompt(e.target.value)}
                    placeholder="Describe the image you want to generate..."
                    className="w-full px-2 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-[11px] text-white placeholder-gray-500 resize-none h-16 focus:outline-none focus:border-purple-500/50"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-300 font-semibold">Model</label>
                  <select
                    value={imageInpaintModel}
                    onChange={(e) => setImageInpaintModel(e.target.value as any)}
                    className="w-full px-2 py-1.5 bg-[#1a1d29] border border-white/10 rounded-lg text-[11px] text-white focus:outline-none focus:border-purple-500/50"
                  >
                    <option value="nano-banana">Nano Banana</option>
                    <option value="flux-kontext-pro">Flux Kontext Pro</option>
                    <option value="flux-fill">Flux Fill</option>
                    <option value="openai-4o">OpenAI 4o</option>
                    <option value="grok">Grok Imagine</option>
                    <option value="qwen-z-image">Qwen Z Image</option>
                    <option value="seedream-5.0-lite">Seedream 5.0 Lite</option>
                    <option value="qwen">Qwen (Image Edit)</option>
                    <option value="seedream-4.5">Seedream 4.5 (Text-to-Image)</option>
                    <option value="flux-2-flex-image-to-image">Flux 2 Flex (Image-to-Image)</option>
                    <option value="flux-2-flex-text-to-image">Flux 2 Flex (Text-to-Image)</option>
                    <option value="seedream-v4">Seedream V4 (Text-to-Image)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[11px] text-gray-300 font-semibold">Reference Images</label>
                  <div className="grid grid-cols-3 gap-1">
                    {[0, 1, 2].map((i) => (
                      <div 
                        key={i} 
                        className="aspect-square bg-[#1a1d29] border border-dashed border-white/20 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-white/40 transition-colors relative group"
                        onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file';
                          input.accept = 'image/*';
                          input.onchange = (e) => {
                            const file = (e.target as HTMLInputElement).files?.[0];
                            if (file) {
                              const reader = new FileReader();
                              reader.onload = (event) => {
                                const dataUrl = event.target?.result as string;
                                const newRefImages = [...imageReferenceImages];
                                newRefImages[i] = dataUrl;
                                setImageReferenceImages(newRefImages);
                              };
                              reader.readAsDataURL(file);
                            }
                          };
                          input.click();
                        }}
                      >
                        {imageReferenceImages[i] ? (
                          <>
                            <img src={imageReferenceImages[i]} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <span className="text-white text-[8px] font-medium">Change</span>
                            </div>
                          </>
                        ) : (
                          <span className="text-[8px] text-gray-500">Ref {i + 1}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <button
                  className="w-full py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5"
                  disabled={!imageInpaintPrompt.trim() || imageIsInpainting}
                >
                  {imageIsInpainting ? (
                    <><span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />Generating...</>
                  ) : "Generate Image"}
                </button>
                
                {imageInpaintError && (
                  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                    <p className="text-[10px] text-red-300">{imageInpaintError}</p>
                  </div>
                )}
                
                <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-2">
                  <span className="text-[10px] text-purple-300">
                    {imageIsInpainting ? "Generating image..." : imageGeneratedImages.length > 0 ? `${imageGeneratedImages.length} images generated` : "Ready to generate"}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* ── Crop ── */}
          {canvasTool === "crop" && (
            <>
              <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-3">
                <div><h3 className="text-white font-bold text-sm">Crop Image</h3><p className="text-[10px] text-gray-500 mt-0.5">Crop the image to a specific area</p></div>
                
                <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3 space-y-2">
                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        // Create rectangle with aspect ratio for crop
                        const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                        if (container) {
                          const rect = container.getBoundingClientRect();
                          const arMap: Record<string, number> = { "16:9": 16/9, "9:16": 9/16, "1:1": 1 };
                          const targetRatio = arMap[activeShot?.aspectRatio ?? "16:9"] ?? 16/9;
                          
                          // Calculate maximum dimensions that fit within canvas bounds
                          // Start with 80% of canvas dimensions to ensure it fits
                          let width = rect.width * 0.8;
                          let height = rect.height * 0.8;
                          
                          // Adjust dimensions to fit aspect ratio
                          if (targetRatio >= 1) {
                            // Landscape or square - width is primary
                            height = width / targetRatio;
                            // If height exceeds canvas, recalculate based on height
                            if (height > rect.height * 0.8) {
                              height = rect.height * 0.8;
                              width = height * targetRatio;
                            }
                          } else {
                            // Portrait - height is primary
                            width = height * targetRatio;
                            // If width exceeds canvas, recalculate based on width
                            if (width > rect.width * 0.8) {
                              width = rect.width * 0.8;
                              height = width / targetRatio;
                            }
                          }
                          
                          // Ensure rectangle fits within canvas bounds (with small padding)
                          const padding = 10;
                          width = Math.min(width, rect.width - padding * 2);
                          height = Math.min(height, rect.height - padding * 2);
                          
                          // Recalculate to maintain aspect ratio after bounds constraint
                          if (targetRatio >= 1) {
                            height = width / targetRatio;
                          } else {
                            width = height * targetRatio;
                          }
                          
                          // Center the rectangle
                          const x = (rect.width - width) / 2;
                          const y = (rect.height - height) / 2;
                          
                          const aspectRatioRect = { x, y, width, height };
                          setRectangle(aspectRatioRect);
                        }
                      }}
                      className="flex-1 px-2 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/30 text-orange-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5">
                      <Plus className="w-3 h-3" />
                      Add Crop
                    </button>
                    <button
                      onClick={() => setRectangle(null)}
                      className="flex-1 px-2 py-1.5 bg-white/5 hover:bg-red-500/10 border border-white/10 text-gray-300 hover:text-red-300 rounded-lg text-[11px] font-semibold transition flex items-center justify-center gap-1.5">
                      <X className="w-3 h-3" />
                      Clear
                    </button>
                  </div>
                  
                  <div className="grid grid-cols-4 gap-2">
                    {["16:9", "9:16", "1:1", "4:3", "3:2", "2:3", "3:4"].map(aspect => (
                      <button
                        key={aspect}
                        onClick={() => {
                          const container = document.querySelector('[data-canvas-editor="true"]') as HTMLElement;
                          if (container) {
                            const rect = container.getBoundingClientRect();
                            const arMap: Record<string, number> = { "16:9": 16/9, "9:16": 9/16, "1:1": 1, "4:3": 4/3, "3:2": 3/2, "2:3": 2/3, "3:4": 3/4 };
                            const ar = arMap[aspect] ?? 1;
                            
                            const width = rect.width * 0.8;
                            const height = width / ar;
                            const x = (rect.width - width) / 2;
                            const y = (rect.height - height) / 2;
                            
                            setRectangle({ x, y, width, height });
                          }
                        }}
                        className={`px-2 py-1 rounded text-[10px] font-medium transition ${
                          activeShot.aspectRatio === aspect
                            ? "bg-orange-500/20 text-orange-300"
                            : "bg-white/5 text-gray-400 hover:bg-white/10"
                        }`}
                      >
                        {aspect}
                      </button>
                    ))}
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${rectangle ? "bg-orange-400 animate-pulse" : "bg-gray-600"}`} />
                    <span className={`text-[11px] font-medium ${rectangle ? "text-orange-300" : "text-gray-500"}`}>
                      {rectangle ? `Crop area: ${Math.round(rectangle.width)}×${Math.round(rectangle.height)}` : "No crop area selected"}
                    </span>
                  </div>
                  <button
                    onClick={runCrop}
                    disabled={!rectangle}
                    className="w-full py-2 bg-orange-600 hover:bg-orange-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Crop Image
                  </button>
                  <button
                    onClick={runCropGenerateCombine}
                    disabled={!rectangle}
                    className="w-full py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-30 text-white rounded-lg text-[11px] font-bold transition flex items-center justify-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" />
                    Crop + Generate + Combine
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── Comments ── */}
          {canvasTool === "comments" && (
            <>
              <div className="flex items-center gap-1 px-3 py-2.5 border-b border-white/6 shrink-0">
                {(["selected", "all", "testing"] as const).map(tab => (
                  <button key={tab} onClick={() => setCommentTab(tab)}
                    className={`px-3 py-1 rounded text-[10px] font-medium transition ${
                      commentTab === tab
                        ? "bg-white/10 text-white"
                        : "text-gray-500 hover:text-gray-300 hover:bg-white/5"
                    }`}
                  >
                    {tab === "selected" ? "Selected" : tab === "all" ? "All" : "Testing"}
                  </button>
                ))}
              </div>
              <div className="flex-1 overflow-y-auto p-3">
                {commentTab === "selected" && activeShot.comments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-700" />
                    <p className="text-gray-600 text-xs">No comments yet</p>
                    
                    {/* Background Image Upload */}
                    <div className="w-full max-w-xs">
                      <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-gray-300">Background Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  // Set as original image and background
                                  setOriginalImage(dataUrl);
                                  setBackgroundImage(dataUrl);
                                  // Clear previous generated images when new original is uploaded
                                  setGeneratedImages([]);
                                  // Show the generated panel to display the new original
                                  setShowGenPanel(true);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="bg-upload-selected"
                          />
                          <label
                            htmlFor="bg-upload-selected"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] cursor-pointer transition"
                          >
                            Upload
                          </label>
                        </div>
                        <div 
                          className="w-full h-16 bg-[#1a1a24] border border-dashed border-white/20 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/40 transition-colors"
                          onClick={() => document.getElementById('bg-upload-selected')?.click()}
                        >
                          {backgroundImage ? (
                            <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-gray-500">No background image (click to upload)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {commentTab === "selected" && activeShot.comments.map(c => (
                  <div key={c.id} className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{c.avatar}</div>
                      <span className="text-white text-[11px] font-medium">{c.author}</span>
                      <span className="text-gray-600 text-[9px] ml-auto">{c.timestamp}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] ml-7 leading-relaxed">{c.text}</p>
                  </div>
                ))}
                {commentTab === "all" && allComments.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full gap-3 text-center">
                    <MessageSquare className="w-8 h-8 text-gray-700" />
                    <p className="text-gray-600 text-xs">No comments yet</p>
                    
                    {/* Background Image Upload */}
                    <div className="w-full max-w-xs">
                      <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-semibold text-gray-300">Background Image</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (event) => {
                                  const dataUrl = event.target?.result as string;
                                  // Set as original image and background
                                  setOriginalImage(dataUrl);
                                  setBackgroundImage(dataUrl);
                                  // Clear previous generated images when new original is uploaded
                                  setGeneratedImages([]);
                                  // Show the generated panel to display the new original
                                  setShowGenPanel(true);
                                };
                                reader.readAsDataURL(file);
                              }
                            }}
                            className="hidden"
                            id="bg-upload-all"
                          />
                          <label
                            htmlFor="bg-upload-all"
                            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] cursor-pointer transition"
                          >
                            Upload
                          </label>
                        </div>
                        <div 
                          className="w-full h-16 bg-[#1a1a24] border border-dashed border-white/20 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/40 transition-colors"
                          onClick={() => document.getElementById('bg-upload-all')?.click()}
                        >
                          {backgroundImage ? (
                            <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[9px] text-gray-500">No background image (click to upload)</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
                {commentTab === "all" && allComments.map(c => (
                  <div key={c.id} className="mb-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-5 h-5 rounded-full bg-violet-500 flex items-center justify-center text-[9px] text-white font-bold shrink-0">{c.avatar}</div>
                      <div className="flex-1 min-w-0">
                        <span className="text-white text-[11px] font-medium">{c.author}</span>
                        <span className="text-gray-500 text-[9px] ml-1">Frame {c.shotNum}</span>
                      </div>
                      <span className="text-gray-600 text-[9px]">{c.timestamp}</span>
                    </div>
                    <p className="text-gray-300 text-[11px] ml-7 leading-relaxed">{c.text}</p>
                  </div>
                ))}
              {commentTab === "testing" && (
                <div className="space-y-3">
                  {/* Background Image Upload */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-gray-300">Background Image</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              // Set as original image and background
                              setOriginalImage(dataUrl);
                              setBackgroundImage(dataUrl);
                              // Clear previous generated images when new original is uploaded
                              setGeneratedImages([]);
                              // Show the generated panel to display the new original
                              setShowGenPanel(true);
                            };
                            reader.readAsDataURL(file);
                          }
                        }}
                        className="hidden"
                        id="bg-upload-testing"
                      />
                      <label
                        htmlFor="bg-upload-testing"
                        className="px-2 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded text-[9px] cursor-pointer transition"
                      >
                        Upload
                      </label>
                    </div>
                    <div 
                      className="w-full h-16 bg-[#1a1a24] border border-dashed border-white/20 rounded-lg flex items-center justify-center overflow-hidden cursor-pointer hover:border-blue-500/40 transition-colors"
                      onClick={() => document.getElementById('bg-upload-testing')?.click()}
                    >
                      {backgroundImage ? (
                        <img src={backgroundImage} alt="Background" className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[9px] text-gray-500">No background image (click to upload)</span>
                      )}
                    </div>
                  </div>

                  {/* Reference Images */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] font-semibold text-gray-300">Reference Images</span>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = Array.from(e.target.files || []);
                          const newRefImages: string[] = [];
                          files.forEach(file => {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                              const dataUrl = event.target?.result as string;
                              newRefImages.push(dataUrl);
                              if (newRefImages.length === files.length) {
                                setRefImages(prev => [...prev.slice(0, 3 - files.length), ...newRefImages].slice(0, 3));
                              }
                            };
                            reader.readAsDataURL(file);
                          });
                        }}
                        className="hidden"
                        id="ref-upload"
                      />
                      <label
                        htmlFor="ref-upload"
                        className="px-2 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded text-[9px] cursor-pointer transition"
                      >
                        Add Images
                      </label>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      {[0, 1, 2].map((i) => (
                        <div key={i} className="aspect-square bg-[#1a1a24] border border-dashed border-white/20 rounded-lg flex items-center justify-center overflow-hidden">
                          {refImages[i] ? (
                            <img src={refImages[i]} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[8px] text-gray-500">Ref {i + 1}</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Prompt Textbox */}
                  <div className="bg-[#0f1117] rounded-xl border border-white/10 p-3">
                    <div className="mb-2">
                      <span className="text-[10px] font-semibold text-gray-300">Prompt</span>
                    </div>
                    <textarea
                      value={promptText}
                      onChange={e => setPromptText(e.target.value)}
                      placeholder="Enter your prompt here..."
                      className="w-full h-16 bg-[#1a1a24] border border-white/10 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-gray-600 focus:outline-none resize-none"
                    />
                    <div className="flex justify-end mt-2">
                      <button className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-[9px] font-medium transition">
                        Generate
                      </button>
                    </div>
                  </div>
                </div>
              )}
              </div>
              {commentTab !== "testing" && (
                <div className="p-3 border-t border-white/6 shrink-0">
                  <div className="flex items-center gap-2 bg-[#1c1c26] border border-white/10 rounded-xl px-3 py-2">
                    <input value={commentText} onChange={e => setCommentText(e.target.value)}
                      onKeyDown={e => e.key === "Enter" && handleAddComment()}
                      placeholder="Leave a comment..."
                      className="flex-1 bg-transparent text-white text-xs placeholder-gray-600 focus:outline-none" />
                    <button onClick={handleAddComment} aria-label="Send comment" className="text-blue-400 hover:text-blue-300 transition">
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* KIE Modal */}
      <AIGenerationModal 
        isOpen={showKIEModal}
        onClose={() => setShowKIEModal(false)}
        onSelectOption={(option) => {
          if (option === 'rectangle-mask') {
            const maskData = sessionStorage.getItem('kieRectangleMask');
            if (maskData) {
              try {
                const data = JSON.parse(maskData);
                console.log('Processing rectangle mask for KIE:', data);
                alert(`Rectangle mask ready for KIE processing:\nImage: ${data.image.substring(0, 50)}...\nRectangle: ${data.rectangle.width}×${data.rectangle.height}\nPrompt: ${data.prompt}`);
              } catch (e) {
                console.error('Failed to process rectangle mask:', e);
              }
            }
          }
          setShowKIEModal(false);
        }}
      />

      {/* Bubble Style Modal */}
      {showBubbleStyleModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1a24] rounded-xl border border-white/20 p-6 max-w-md w-full mx-4">
            <h3 className="text-white font-bold text-lg mb-4">Choose Bubble Style</h3>
            <p className="text-gray-400 text-sm mb-6">Select how you want the text bubbles to blend with the image</p>
            
            <div className="space-y-3">
              <button
                onClick={() => {
                  setSelectedBubbleStyle("manga");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "manga"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">🎌 Manga Style</div>
                <div className="text-xs text-gray-400 mt-1">Classic manga speech bubbles with sharp edges and clean lines</div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedBubbleStyle("cartoon");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "cartoon"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">🎨 Cartoon Style</div>
                <div className="text-xs text-gray-400 mt-1">Soft, rounded bubbles with playful appearance</div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedBubbleStyle("realistic");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "realistic"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">📷 Realistic Style</div>
                <div className="text-xs text-gray-400 mt-1">Natural-looking bubbles that blend seamlessly with photos</div>
              </button>
              
              <button
                onClick={() => {
                  setSelectedBubbleStyle("custom");
                  setShowBubbleStyleModal(false);
                  generateImageWithElements();
                }}
                className={`w-full p-4 rounded-lg border transition text-left ${
                  selectedBubbleStyle === "custom"
                    ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                    : "bg-[#0f1117] border-white/10 text-gray-300 hover:bg-white/5"
                }`}
              >
                <div className="font-semibold text-sm">✨ Custom Style</div>
                <div className="text-xs text-gray-400 mt-1">Keep current bubble design and styling</div>
              </button>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowBubbleStyleModal(false)}
                className="flex-1 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm font-semibold transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
