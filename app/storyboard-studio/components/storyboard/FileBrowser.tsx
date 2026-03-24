"use client";

import { useState, useMemo, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { 
  Image as ImageIcon, 
  Video, 
  FileText, 
  X, 
  FolderOpen, 
  Star, 
  Download, 
  Trash2,
  Search,
  Filter,
  Volume2,
  Grid3x3,
  ChevronDown,
  Upload,
  Plus
} from "lucide-react";

interface FileBrowserProps {
  projectId: Id<"storyboard_projects">;
  onClose: () => void;
  onSelectFile?: (url: string, type: string) => void;
  filterTypes?: string[];
  // New props for image selection mode
  imageSelectionMode?: boolean;
  onSelectImage?: (url: string, fileName: string, fileData: any) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
  all: "All Files", // Temporary for debugging
  uploads:   "Uploaded",
  generated: "AI Generated",
  elements:  "Elements",
  storyboard:"Storyboard",
  videos:    "Videos",
};

const TYPE_ICON: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Volume2,
  file: FileText,
};

export function FileBrowser({ 
  projectId, 
  onClose, 
  onSelectFile, 
  filterTypes,
  imageSelectionMode = false,
  onSelectImage 
}: FileBrowserProps) {
  // State for refresh mechanism
  const [refreshKey, setRefreshKey] = useState(0); // Add refresh key to force refetch
  
  // Get both project files and global files with refresh key
  const projectFiles = useQuery(
    api.storyboard.storyboardFiles.listByProject, 
    projectId ? { projectId } : "skip", // Skip query if no projectId
    { 
      // Add refreshKey as a dependency to force refetch
      dependencies: { refreshKey } 
    }
  );
  const allFiles = useQuery(api.storyboard.storyboardFiles.listAll, {}, { 
    dependencies: { refreshKey } 
  });
  
  // Combine project files with global uploads (files without projectId)
  const files = projectId ? (projectFiles?.concat(
    allFiles?.filter(file => !file.projectId) || []
  ) || []) : (allFiles?.filter(file => !file.projectId) || []);
  
  const toggleFavorite = useMutation(api.storyboard.storyboardFiles.toggleFavorite);
  const deleteFile = useMutation(api.storyboard.storyboardFiles.deleteWithR2);
  const logUpload = useMutation(api.storyboard.storyboardFiles.logUpload);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all"); // Default to all files for debugging
  const [selectedType, setSelectedType] = useState("all");
  const [viewSize, setViewSize] = useState(100);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [favoriteUpdates, setFavoriteUpdates] = useState<Set<string>>(new Set()); // Track optimistic updates
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showDateRange, setShowDateRange] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debug: Log files when they load
  console.log(`[FileBrowser] Total files from database: ${files?.length || 0}`);
  if (files && files.length > 0) {
    console.log("[FileBrowser] Files loaded from database:");
    const favoritedFiles = files.filter(file => file.isFavorite === true);
    console.log(`Total files: ${files.length}, Favorited files: ${favoritedFiles.length}`);
    files.forEach(file => {
      console.log(`  - ${file.filename}: category=${file.category}, isFavorite = ${file.isFavorite} (type: ${typeof file.isFavorite})`);
    });
    if (favoritedFiles.length > 0) {
      console.log("Favorited files:", favoritedFiles.map(f => f.filename));
    }
  }

  // Filter files based on search term, selected filter, and date range
  const filteredFiles = useMemo(() => {
    if (!files) return [];
    
    return files.filter((file) => {
      // Search filter
      const matchesSearch = !searchTerm || 
        file.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
        file.fileType.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Type filter
      const matchesType = selectedType === "all" || file.fileType === selectedType;
      
      // Category filter (support both old category and new filter system)
      let matchesFilter = true;
      if (selectedFilter === "all") {
        matchesFilter = true;
      } else if (selectedFilter === "favorites") {
        matchesFilter = file.isFavorite === true;
      } else {
        // Check both category and fileType for backwards compatibility
        matchesFilter = file.category === selectedFilter || file.fileType === selectedFilter;
      }
      
      // Date range filter
      let matchesDateRange = true;
      if (showDateRange && (dateRange.start || dateRange.end)) {
        const fileDate = new Date(file.uploadedAt);
        if (dateRange.start) {
          const startDate = new Date(dateRange.start);
          matchesDateRange = fileDate >= startDate;
        }
        if (dateRange.end) {
          const endDate = new Date(dateRange.end);
          endDate.setHours(23, 59, 59, 999); // Include end date
          matchesDateRange = matchesDateRange && fileDate <= endDate;
        }
      }
      
      return matchesSearch && matchesType && matchesFilter && matchesDateRange;
    });
  }, [files, searchTerm, selectedFilter, selectedType, dateRange, showDateRange]);

  // Group files by category for display
  const grouped = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredFiles.forEach((file) => {
      // Use category as primary grouping, fallback to fileType
      const category = file.category || file.fileType || "file";
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(file);
    });
    return groups;
  }, [filteredFiles]);

  // Get available categories for tabs
  const categories = Object.keys(grouped).sort((a, b) => {
    // Sort by specific order: uploads > generated > elements > storyboard > videos > others
    const order = ["uploads", "generated", "elements", "storyboard", "videos"];
    const aIndex = order.indexOf(a);
    const bIndex = order.indexOf(b);
    if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
    if (aIndex !== -1) return -1;
    if (bIndex !== -1) return 1;
    return a.localeCompare(b);
  });

  // Handle file actions
  const handleFileAction = async (action: string, file: any) => {
    try {
      switch (action) {
        case "favorite":
          // Optimistic update
          setFavoriteUpdates(prev => new Set(prev).add(file._id));
          await toggleFavorite({ fileId: file._id });
          // Force refresh to get updated data
          setRefreshKey(prev => prev + 1);
          break;
        case "delete":
          if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
            await deleteFile({ fileId: file._id });
            setRefreshKey(prev => prev + 1);
          }
          break;
        case "download":
          const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${file.r2Key}`;
          const link = document.createElement("a");
          link.href = publicUrl;
          link.download = file.filename;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          break;
      }
    } catch (error) {
      console.error(`Error performing ${action} on file:`, error);
      // Remove optimistic update on error
      if (action === "favorite") {
        setFavoriteUpdates(prev => {
          const newSet = new Set(prev);
          newSet.delete(file._id);
          return newSet;
        });
      }
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles || uploadedFiles.length === 0) return;

    try {
      for (const file of uploadedFiles) {
        const formData = new FormData();
        formData.append("file", file);
        
        // Upload to R2 via API route
        const response = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`Upload failed: ${response.statusText}`);
        }

        const result = await response.json();
        
        // Log upload to database
        await logUpload({
          filename: file.name,
          fileType: file.type.startsWith("image/") ? "image" : 
                   file.type.startsWith("video/") ? "video" : 
                   file.type.startsWith("audio/") ? "audio" : "file",
          r2Key: result.key,
          size: file.size,
          ...(projectId && { projectId }), // Only include projectId if it exists
          category: "uploads" // Default category for uploaded files
        });
      }
      
      // Refresh file list
      setRefreshKey(prev => prev + 1);
      
      // Clear input
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (error) {
      console.error("Upload error:", error);
      alert("Failed to upload files. Please try again.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-(--bg-secondary) rounded-2xl border border-(--border-primary) w-full max-w-7xl max-h-[95vh] flex flex-col shadow-2xl">
        {/* Header - LTX Design Style */}
        <div className="bg-(--bg-secondary) p-4 rounded-t-2xl">
          <div className="flex items-center justify-between">
            {/* Left: Title and Filter */}
            <div className="flex items-center gap-4">
              <h2 className="text-xl font-semibold text-(--text-primary)">File Browser</h2>
              
              {/* Filter Button */}
              <div className="relative">
                <button
                  onClick={() => setShowFilterDropdown(!showFilterDropdown)}
                  className="flex items-center gap-2 px-4 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-xl hover:border-(--accent-blue) transition-all duration-200"
                >
                  <Filter className="w-4 h-4 text-(--text-secondary)" />
                  <span className="text-sm text-(--text-secondary)">Filter</span>
                  <ChevronDown className={`w-4 h-4 text-(--text-secondary) transition-transform duration-200 ${showFilterDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Filter Dropdown */}
                {showFilterDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-64 bg-(--bg-primary) border border-(--border-primary) rounded-xl shadow-xl z-50">
                    <div className="p-4">
                      <h3 className="text-sm font-semibold text-(--text-primary) mb-3">File Type</h3>
                      <div className="space-y-2">
                        {[
                          { value: 'all', label: 'All Files', icon: Grid3x3 },
                          { value: 'image', label: 'Images', icon: ImageIcon },
                          { value: 'video', label: 'Videos', icon: Video },
                          { value: 'audio', label: 'Audio', icon: Volume2 },
                          { value: 'file', label: 'Documents', icon: FileText }
                        ].map(({ value, label, icon: Icon }) => (
                          <button
                            key={value}
                            onClick={() => {
                              setSelectedType(value as any);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              selectedType === value 
                                ? 'bg-(--bg-tertiary) text-(--text-primary)' 
                                : 'text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)'
                            }`}
                          >
                            <Icon className="w-4 h-4" />
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                      
                      <h3 className="text-sm font-semibold text-(--text-primary) mb-3 mt-4">Source</h3>
                      <div className="space-y-2">
                        {[
                          { value: 'uploads', label: '📤 Uploads' },
                          { value: 'generated', label: '🎨 Generated' },
                          { value: 'elements', label: '🧩 Elements' },
                          { value: 'storyboard', label: '🎬 Storyboard' },
                          { value: 'videos', label: '🎥 Videos' }
                        ].map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => {
                              setSelectedFilter(value as any);
                              setShowFilterDropdown(false);
                            }}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${
                              selectedFilter === value 
                                ? 'bg-(--bg-tertiary) text-(--text-primary)' 
                                : 'text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--text-primary)'
                            }`}
                          >
                            <span className="text-sm">{label}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Right: Search, Zoom, Upload, and Close */}
            <div className="flex items-center gap-3">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-64 pl-10 pr-4 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-xl text-sm text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:border-(--accent-blue) focus:ring-2 focus:ring-(--accent-blue)/20 transition-all duration-200"
                />
              </div>
              
              {/* Zoom Slider */}
              <div className="flex items-center gap-2 px-3 py-2 bg-(--bg-primary) border border-(--border-primary) rounded-xl">
                <span className="text-xs text-(--text-secondary) font-medium">Size</span>
                <input
                  type="range"
                  min="80"
                  max="200"
                  value={viewSize}
                  onChange={(e) => setViewSize(Number(e.target.value))}
                  className="w-24 h-1.5 bg-(--bg-tertiary) rounded-lg appearance-none cursor-pointer"
                />
                <span className="text-xs text-(--text-secondary) w-8">{viewSize}</span>
              </div>
              
              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-(--accent-blue) text-white rounded-xl hover:bg-(--accent-blue)/90 transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Upload className="w-4 h-4" />
                <span className="text-sm font-medium">Upload</span>
              </button>
              
              {/* Close Button */}
              <button
                onClick={onClose}
                className="p-2.5 hover:bg-(--bg-tertiary) rounded-xl transition-all duration-200 hover:scale-105"
              >
                <X className="w-5 h-5 text-(--text-secondary)" />
              </button>
            </div>
          </div>
        </div>
        
        {/* Subtle divider */}
        <div className="h-px bg-(--border-primary)" />

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {!files ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-(--border-primary) border-t-(--text-secondary) rounded-full animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <FolderOpen className="w-16 h-16 text-(--text-tertiary) mb-4 opacity-50" />
              <p className="text-base text-(--text-secondary) font-medium mb-2">No files found</p>
              <p className="text-sm text-(--text-tertiary) opacity-75">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-8">
              {categories.map((cat) => {
                const catFiles = grouped[cat] ?? [];
                return (
                  <div key={cat}>
                    <p className="text-sm text-(--text-secondary) font-semibold uppercase tracking-wider mb-4">
                      {CATEGORY_LABELS[cat] ?? cat} ({catFiles.length})
                    </p>
                    <div 
                      className="grid gap-4"
                      style={{
                        gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))`,
                      }}
                    >
                      {catFiles.map((file) => {
                        if (!file) return null;
                        const Icon = TYPE_ICON[file.fileType] ?? FileText;
                        const isImage = file.fileType === "image";
                        // Use the r2Key to construct the public URL
                        const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${file.r2Key}`;
                        
                        return (
                          <div key={file._id} className="relative group">
                            {/* Image selection overlay - only in image selection mode for images */}
                            {isImage && imageSelectionMode && onSelectImage && (
                              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                <button
                                  onClick={(e) => {
                                    e.preventDefault();
                                    e.stopPropagation();
                                    onSelectImage(publicUrl, file.filename, file);
                                  }}
                                  className="rounded-full bg-indigo-500 p-2 text-white hover:bg-indigo-600 transition-colors shadow-lg"
                                  title="Add this image to references"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                            
                            <button
                              onClick={(e) => {
                                if (imageSelectionMode && isImage && onSelectImage) {
                                  // In image selection mode, clicking the image also adds it
                                  onSelectImage(publicUrl, file.filename, file);
                                } else {
                                  // Normal file selection
                                  onSelectFile?.(publicUrl, file.fileType);
                                }
                              }}
                              className="w-full aspect-square rounded-2xl overflow-hidden border-2 border-(--border-primary) hover:border-(--accent-blue) transition-all duration-300 bg-(--bg-primary) hover:shadow-xl hover:shadow-(--accent-blue)/20 transform hover:scale-105"
                              style={{ height: `${viewSize}px` }}
                            >
                              {isImage ? (
                                <img src={publicUrl} alt={file.filename}
                                  className="w-full h-full object-cover rounded-2xl" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-(--bg-secondary) rounded-2xl">
                                  <Icon className="w-8 h-8 text-(--text-tertiary) opacity-60" />
                                </div>
                              )}
                            </button>
                            
                            {/* Favorite Star - Always Visible */}
                            <div className="absolute top-3 right-3 z-10 pointer-events-auto">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFileAction('favorite', file);
                                }}
                                className={`p-2 rounded-full transition-all duration-200 shadow-lg ${(file.isFavorite === true) ? 'bg-yellow-500 hover:bg-yellow-400 border-2 border-yellow-300' : 'bg-(--bg-secondary) hover:bg-(--bg-tertiary) border-2 border-(--border-primary)'}`}
                                title={(file.isFavorite === true) ? "Remove from favorites" : "Add to favorites"}
                              >
                                {(file.isFavorite === true) ? (
                                  <Star className="w-5 h-5 text-yellow-200 drop-shadow-md" />
                                ) : (
                                  <Star className="w-5 h-5 text-(--text-secondary)" />
                                )}
                              </button>
                            </div>
                            
                            {/* Action Buttons - Show on hover */}
                            <div className="absolute bottom-3 left-3 right-3 z-10 flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                              {/* Download Button */}
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFileAction('download', file);
                                }}
                                className="p-2 rounded-full bg-(--bg-secondary) hover:bg-(--bg-tertiary) border-2 border-(--border-primary) transition-all duration-200 shadow-lg hover:shadow-xl"
                                title="Download file"
                              >
                                <Download className="w-4 h-4 text-(--text-secondary)" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  handleFileAction('delete', file);
                                }}
                                className="p-2 rounded-full bg-(--bg-secondary) hover:bg-red-900/50 border-2 border-(--border-primary) hover:border-red-500 transition-all duration-200 shadow-lg hover:shadow-xl"
                                title="Delete file"
                              >
                                <Trash2 className="w-4 h-4 text-(--text-secondary)" />
                              </button>
                            </div>
                            
                            {/* File Info - LTX Style */}
                            <div className="absolute bottom-0 left-0 right-0 bg-linear-to-t from-black/80 to-transparent px-3 py-2">
                              <div className="flex items-center gap-2">
                                {file.projectId ? (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-(--accent-blue)/20 text-(--accent-blue) rounded-md font-medium">Project</span>
                                ) : (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-(--accent-teal)/20 text-(--accent-teal) rounded-md font-medium">Global</span>
                                )}
                                <p className="text-xs text-white truncate flex-1 font-medium">{file.filename}</p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}
