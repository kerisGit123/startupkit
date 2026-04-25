"use client";

import { useState, useEffect, useMemo } from "react";
import { Search, Plus, Package, Check, AlertCircle, Loader2 } from "lucide-react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
// Simple debounce utility (avoids lodash dependency)
function debounce<T extends (...args: any[]) => any>(fn: T, ms: number) {
  let timer: ReturnType<typeof setTimeout>;
  const debounced = (...args: Parameters<T>) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
  debounced.cancel = () => clearTimeout(timer);
  return debounced;
}

interface CreateElementProps {
  projectId: string;
  onElementCreated: () => void;
  onClose: () => void;
}

const ELEMENT_TYPES = [
  { key: "character", label: "Character", color: "text-purple-400" },
  { key: "object", label: "Prop", color: "text-blue-400" },
  { key: "environment", label: "Environment", color: "text-emerald-400" },
  { key: "logo", label: "Logo", color: "text-pink-400" },
  { key: "font", label: "Font", color: "text-yellow-400" },
  { key: "style", label: "Style", color: "text-orange-400" },
  { key: "other", label: "Other", color: "text-gray-300" },
] as const;

export function CreateElement({ projectId, onElementCreated, onClose }: CreateElementProps) {
  const [elementName, setElementName] = useState("");
  const [elementType, setElementType] = useState("character");
  const [existingElement, setExistingElement] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  
  const createElement = useMutation(api.storyboard.storyboardElements.create);
  const incrementUsage = useMutation(api.storyboard.storyboardElements.incrementUsage);
  const findReusableElement = useQuery(api.storyboard.storyboardElements.findReusableElement, {
    elementName: elementName.trim(),
    elementType,
    projectId: projectId as Id<"storyboard_projects">
  });

  // Debounced search for existing elements
  const debouncedSearch = useMemo(
    () => debounce(async (name: string, type: string) => {
      if (name.trim().length < 2) {
        setExistingElement(null);
        return;
      }
      
      setSearching(true);
      try {
        // The query will automatically run when findReusableElement args change
        // We'll handle the result in the useEffect below
      } finally {
        setSearching(false);
      }
    }, 500),
    [projectId]
  );

  useEffect(() => {
    debouncedSearch(elementName, elementType);
    return () => debouncedSearch.cancel();
  }, [elementName, elementType, debouncedSearch]);

  useEffect(() => {
    if (findReusableElement) {
      setExistingElement(findReusableElement);
    } else {
      setExistingElement(null);
    }
  }, [findReusableElement]);

  const handleCreateNew = async () => {
    if (!elementName.trim() || loading) return;
    
    setLoading(true);
    try {
      await createElement({
        projectId: projectId as Id<"storyboard_projects">,
        name: elementName.trim(),
        type: elementType,
        thumbnailUrl: "/api/placeholder/element-thumbnail",
        referenceUrls: [],
        tags: [],
        createdBy: "current-user" // This should come from auth context
      });
      
      onElementCreated();
      onClose();
    } catch (error) {
      console.error("Failed to create element:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleUseExisting = async () => {
    if (!existingElement || loading) return;
    
    setLoading(true);
    try {
      await incrementUsage({
        id: existingElement.element._id,
        projectId
      });
      
      onElementCreated();
      onClose();
    } catch (error) {
      console.error("Failed to use existing element:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectedType = ELEMENT_TYPES.find(type => type.key === elementType);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-neutral-900 rounded-xl border border-neutral-800 p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-semibold text-white">Create Element</h2>
            <p className="text-sm text-neutral-400">Add a new reusable element to your library</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-neutral-800 rounded-lg transition"
          >
            ×
          </button>
        </div>

        <div className="space-y-6">
          {/* Element Name */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Element Name
            </label>
            <div className="relative">
              <input
                value={elementName}
                onChange={(e) => setElementName(e.target.value)}
                placeholder="Enter element name..."
                className="w-full rounded-lg border border-neutral-700 bg-neutral-800 pl-10 pr-3 py-2 text-sm text-white outline-none placeholder:text-neutral-500 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
              />
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-neutral-500" />
              {searching && (
                <div className="absolute right-3 top-2.5">
                  <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                </div>
              )}
            </div>
          </div>

          {/* Element Type */}
          <div>
            <label className="block text-sm font-medium text-neutral-300 mb-2">
              Element Type
            </label>
            <select
              value={elementType}
              onChange={(e) => setElementType(e.target.value)}
              className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-sm text-white outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-colors"
            >
              {ELEMENT_TYPES.map((type) => (
                <option key={type.key} value={type.key}>
                  {type.label}
                </option>
              ))}
            </select>
          </div>

          {/* Existing Element Found */}
          {existingElement && (
            <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-lg p-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-12 h-12 bg-indigo-600 rounded-lg overflow-hidden flex-shrink-0">
                  {existingElement.element.thumbnailUrl ? (
                    <img 
                      src={existingElement.element.thumbnailUrl} 
                      alt={existingElement.element.name} 
                      className="w-full h-full object-cover" 
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-indigo-300" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-sm font-medium text-white truncate">
                      {existingElement.element.name}
                    </p>
                    <span className={`text-xs px-2 py-1 rounded bg-indigo-500/20 text-indigo-300 capitalize`}>
                      {existingElement.element.type}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-indigo-200">
                    <span className="capitalize">{existingElement.source}</span>
                    <span>Used {existingElement.element.usageCount || 0} times</span>
                  </div>
                  {existingElement.element.description && (
                    <p className="text-xs text-indigo-200 mt-1 line-clamp-2">
                      {existingElement.element.description}
                    </p>
                  )}
                </div>
              </div>
              
              <div className="bg-indigo-500/5 rounded p-2 mb-3">
                <div className="flex items-center gap-2 text-xs text-indigo-300">
                  <AlertCircle className="w-3 h-3" />
                  <span>Existing element found with the same name and type</span>
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleUseExisting}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Check className="w-3 h-3" />
                  {loading ? "Using..." : "Use This Element"}
                </button>
                <button
                  onClick={handleCreateNew}
                  disabled={loading}
                  className="flex-1 px-3 py-2 bg-neutral-700 hover:bg-neutral-600 text-white rounded-lg text-xs font-medium transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create New Anyway
                </button>
              </div>
            </div>
          )}

          {/* No Existing Element Found */}
          {!existingElement && elementName.trim().length >= 2 && !searching && (
            <div className="text-center py-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="w-6 h-6 text-emerald-400" />
              </div>
              <p className="text-sm text-emerald-300 mb-1">
                Ready to create new element
              </p>
              <p className="text-xs text-neutral-400 mb-4">
                "{elementName.trim()}" • {selectedType?.label}
              </p>
              <button
                onClick={handleCreateNew}
                disabled={loading}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                {loading ? "Creating..." : "Create Element"}
              </button>
            </div>
          )}

          {/* Empty State */}
          {!elementName.trim() && (
            <div className="text-center py-8">
              <div className="w-12 h-12 bg-neutral-800 rounded-full flex items-center justify-center mx-auto mb-3">
                <Package className="w-6 h-6 text-neutral-600" />
              </div>
              <p className="text-sm text-neutral-400">
                Enter an element name to get started
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
