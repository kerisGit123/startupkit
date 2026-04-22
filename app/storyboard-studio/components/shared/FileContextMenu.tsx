"use client";

import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { Check, ChevronRight, Share2, ShieldOff, Copy, Mic, Pencil } from "lucide-react";
import { toast } from "sonner";

// ─── Tag Categories ─────────────────────────────────────────────────────

export const TAG_CATEGORIES = [
  {
    label: "Media",
    color: "#A855F7", // purple
    items: [
      { value: "media:thumbnail", label: "Thumbnail" },
      { value: "media:banner", label: "Banner" },
      { value: "media:poster", label: "Poster" },
      { value: "media:magazine", label: "Magazine" },
      { value: "media:social-media", label: "Social Media" },
      { value: "media:product", label: "Product" },
      { value: "media:design", label: "Design" },
      { value: "media:abstract", label: "Abstract" },
    ],
  },
  {
    label: "Character",
    color: "#3B82F6", // blue
    items: [
      { value: "character:human-female", label: "Human (Female)" },
      { value: "character:human-male", label: "Human (Male)" },
      { value: "character:group", label: "Group" },
      { value: "character:creatures", label: "Creatures" },
      { value: "character:robot", label: "Robot" },
      { value: "character:animal", label: "Animal" },
    ],
  },
  {
    label: "Vehicle",
    color: "#06B6D4", // cyan
    items: [
      { value: "vehicle:car", label: "Car" },
      { value: "vehicle:motorcycle", label: "Motorcycle" },
      { value: "vehicle:truck", label: "Truck" },
      { value: "vehicle:aircraft", label: "Aircraft" },
      { value: "vehicle:boat", label: "Boat" },
      { value: "vehicle:spacecraft", label: "Spacecraft" },
    ],
  },
  {
    label: "Prop",
    color: "#F97316", // orange
    items: [
      { value: "prop:weapon", label: "Weapon" },
      { value: "prop:furniture", label: "Furniture" },
      { value: "prop:fashion", label: "Fashion" },
      { value: "prop:food", label: "Food" },
      { value: "prop:device", label: "Device" },
      { value: "prop:object", label: "Object" },
    ],
  },
  {
    label: "Environment",
    color: "#22C55E", // green
    items: [
      { value: "environment:interior", label: "Interior" },
      { value: "environment:exterior", label: "Exterior" },
      { value: "environment:landscape", label: "Landscape" },
      { value: "environment:urban", label: "Urban" },
      { value: "environment:underwater", label: "Underwater" },
    ],
  },
  {
    label: "Architecture",
    color: "#EAB308", // amber
    items: [
      { value: "architecture:building", label: "Building" },
      { value: "architecture:structure", label: "Structure" },
      { value: "architecture:ruins", label: "Ruins" },
      { value: "architecture:property", label: "Property" },
    ],
  },
  {
    label: "Action",
    color: "#F43F5E", // rose
    items: [
      { value: "action:combat", label: "Combat" },
      { value: "action:driving", label: "Driving" },
      { value: "action:sport", label: "Sport" },
      { value: "action:performing", label: "Performing" },
      { value: "action:flying", label: "Flying" },
      { value: "action:cooking", label: "Cooking" },
      { value: "action:conversation", label: "Conversation" },
    ],
  },
];

// Get category color for a tag value
export function getTagColor(tagValue: string): string {
  const category = tagValue.split(":")[0];
  const found = TAG_CATEGORIES.find(c => c.label.toLowerCase() === category);
  return found?.color || "#6E6E6E";
}

// Get display label for a tag value
export function getTagLabel(tagValue: string): string {
  for (const cat of TAG_CATEGORIES) {
    const item = cat.items.find(i => i.value === tagValue);
    if (item) return item.label;
  }
  return tagValue;
}

// ─── Component ──────────────────────────────────────────────────────────

interface FileContextMenuProps {
  x: number;
  y: number;
  fileId?: string;
  currentTags: string[];
  onTagToggle: (tag: string) => void;
  onClose: () => void;
  isShared?: boolean;
  onShare?: () => void;
  onUnshare?: () => void;
  onCreatePersona?: () => void;
  onEditPersona?: () => void;
  onRename?: () => void;
}

export function FileContextMenu({ x, y, fileId, currentTags, onTagToggle, onClose, isShared, onShare, onUnshare, onCreatePersona, onEditPersona, onRename }: FileContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [menuPos, setMenuPos] = useState({ x, y });

  // Adjust position to stay within viewport
  useEffect(() => {
    if (!menuRef.current) return;
    const rect = menuRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    let adjX = x;
    let adjY = y;
    if (x + rect.width > vw - 8) adjX = vw - rect.width - 8;
    if (y + rect.height > vh - 8) adjY = vh - rect.height - 8;
    if (adjX < 8) adjX = 8;
    if (adjY < 8) adjY = 8;
    setMenuPos({ x: adjX, y: adjY });
  }, [x, y]);

  // Close on click outside or Escape
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const escHandler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", handler);
    document.addEventListener("keydown", escHandler);
    return () => {
      document.removeEventListener("mousedown", handler);
      document.removeEventListener("keydown", escHandler);
    };
  }, [onClose]);

  const structuredTags = currentTags.filter(t => t.includes(":"));

  return createPortal(
    <div
      ref={menuRef}
      className="fixed bg-[#1e1e28] border border-[#3D3D3D] rounded-xl shadow-2xl shadow-black/60 overflow-hidden py-1 min-w-[200px] max-h-[70vh] overflow-y-auto"
      style={{ left: menuPos.x, top: menuPos.y, zIndex: 99999 }}
    >
      <div className="px-3 py-1.5 text-[10px] text-[#6E6E6E] uppercase tracking-wider font-semibold">
        Tag As
      </div>

      {TAG_CATEGORIES.map((cat) => {
        const isExpanded = expandedCategory === cat.label;
        const activeTags = cat.items.filter(i => structuredTags.includes(i.value));

        return (
          <div key={cat.label}>
            <button
              onClick={() => setExpandedCategory(isExpanded ? null : cat.label)}
              className="w-full flex items-center justify-between px-3 py-1.5 text-sm hover:bg-[#2a2a35] transition-colors"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cat.color }} />
                <span className="text-[#E0E0E0] text-xs font-medium">{cat.label}</span>
                {activeTags.length > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ backgroundColor: `${cat.color}20`, color: cat.color }}>
                    {activeTags.length}
                  </span>
                )}
              </div>
              <ChevronRight className={`w-3 h-3 text-[#6E6E6E] transition-transform ${isExpanded ? "rotate-90" : ""}`} />
            </button>

            {isExpanded && (
              <div className="bg-[#16161e]">
                {cat.items.map((item) => {
                  const isActive = structuredTags.includes(item.value);
                  return (
                    <button
                      key={item.value}
                      onClick={() => onTagToggle(item.value)}
                      className="w-full flex items-center gap-2.5 pl-7 pr-3 py-1.5 text-xs hover:bg-[#2a2a35] transition-colors"
                    >
                      <div className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                        isActive ? "border-transparent" : "border-[#4A4A4A]"
                      }`} style={isActive ? { backgroundColor: cat.color } : {}}>
                        {isActive && <Check className="w-2.5 h-2.5 text-white" />}
                      </div>
                      <span className={isActive ? "text-white" : "text-[#A0A0A0]"}>{item.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}

      {/* Clear all tags */}
      {structuredTags.length > 0 && (
        <>
          <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
          <button
            onClick={() => {
              structuredTags.forEach(t => onTagToggle(t));
              onClose();
            }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#FF4D4F] hover:bg-[#2a2a35] transition-colors"
          >
            Clear all tags
          </button>
        </>
      )}

      {/* Share / Unshare */}
      {(onShare || onUnshare) && (
        <>
          <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
          {isShared ? (
            onUnshare && (
              <button
                onClick={() => { onUnshare(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-orange-400 hover:bg-[#2a2a35] transition-colors"
              >
                <ShieldOff className="w-3.5 h-3.5" />
                Unshare from Gallery
              </button>
            )
          ) : (
            onShare && (
              <button
                onClick={() => { onShare(); onClose(); }}
                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-emerald-400 hover:bg-[#2a2a35] transition-colors"
              >
                <Share2 className="w-3.5 h-3.5" />
                Share to Gallery
              </button>
            )
          )}
        </>
      )}

      {/* Create Persona (audio files with taskId + audioId) */}
      {onCreatePersona && (
        <>
          <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
          <button
            onClick={() => { onCreatePersona(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-purple-400 hover:bg-[#2a2a35] transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            Create Persona
          </button>
        </>
      )}

      {/* Edit Persona (audio files with personaCreated) */}
      {onEditPersona && (
        <>
          {!onCreatePersona && <div className="mx-2 my-1 border-t border-[#3D3D3D]" />}
          <button
            onClick={() => { onEditPersona(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-purple-400 hover:bg-[#2a2a35] transition-colors"
          >
            <Mic className="w-3.5 h-3.5" />
            Edit Persona
          </button>
        </>
      )}

      {/* Rename */}
      {onRename && (
        <>
          <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
          <button
            onClick={() => { onRename(); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#A0A0A0] hover:text-white hover:bg-[#2a2a35] transition-colors"
          >
            <Pencil className="w-3.5 h-3.5" />
            Rename
          </button>
        </>
      )}

      {/* Copy File ID */}
      {fileId && (
        <>
          <div className="mx-2 my-1 border-t border-[#3D3D3D]" />
          <button
            onClick={() => { navigator.clipboard.writeText(fileId); toast.success(`Copied: ${fileId}`); onClose(); }}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-[#6E6E6E] hover:text-[#A0A0A0] hover:bg-[#2a2a35] transition-colors"
          >
            <Copy className="w-3.5 h-3.5" />
            Copy File ID
          </button>
        </>
      )}
    </div>,
    document.body
  );
}
