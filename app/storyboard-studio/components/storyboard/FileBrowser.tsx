"use client";

import { useState } from "react";
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
  Star as StarFilled,
  Upload
} from "lucide-react";

interface FileBrowserProps {
  projectId: Id<"storyboard_projects">;
  onClose: () => void;
  onSelectFile?: (url: string, type: string) => void;
}

const CATEGORY_LABELS: Record<string, string> = {
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

export function FileBrowser({ projectId, onClose, onSelectFile }: FileBrowserProps) {
  // Get both project files and global files
  const projectFiles = useQuery(api.storyboard.storyboardFiles.listByProject, { projectId });
  const allFiles = useQuery(api.storyboard.storyboardFiles.listAll, {});
  
  // Combine project files with global uploads (files without projectId)
  const files = projectFiles?.concat(
    allFiles?.filter(file => !file.projectId) || []
  ) || [];
  
  const toggleFavorite = useMutation(api.storyboard.storyboardFiles.toggleFavorite);
  const deleteFile = useMutation(api.storyboard.storyboardFiles.deleteWithR2);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedType, setSelectedType] = useState("all");
  const [viewSize, setViewSize] = useState(100);
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [favoriteUpdates, setFavoriteUpdates] = useState<Set<string>>(new Set()); // Track optimistic updates
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({ start: "", end: "" });
  const [showDateRange, setShowDateRange] = useState(false);

  // Debug: Log files when they load
  if (files && files.length > 0) {
    console.log("[FileBrowser] Files loaded from database:");
    const favoritedFiles = files.filter(file => file.isFavorite === true);
    console.log(`Total files: ${files.length}, Favorited files: ${favoritedFiles.length}`);
    files.forEach(file => {
      console.log(`  - ${file.filename}: isFavorite = ${file.isFavorite} (type: ${typeof file.isFavorite})`);
    });
    if (favoritedFiles.length > 0) {
      console.log("Favorited files:", favoritedFiles.map(f => f.filename));
    }
  }

  // Debug: Log when filter changes
  console.log(`[FileBrowser] Current filter: ${selectedFilter}`);

  // Fix: Reset selectedType if it's incorrectly set to "favorites"
  if (selectedType === "favorites") {
    console.log("[FileBrowser] Resetting selectedType from 'favorites' to 'all'");
    setSelectedType("all");
  }

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  // Filter files based on search and filters
  const filteredFiles = (files ?? []).filter(file => {
    if (!file) return false;
    
    // Search filter
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    console.log(`[Filter] ${file.filename}: matchesSearch = ${matchesSearch} (searchTerm: "${searchTerm}")`);
    
    // Type filter
    const matchesType = selectedType === "all" || file.fileType === selectedType;
    console.log(`[Filter] ${file.filename}: matchesType = ${matchesType} (selectedType: "${selectedType}", fileType: "${file.fileType}")`);
    
    // Category/Date filter
    let matchesFilter = false;
    
    if (selectedFilter === "all") {
      matchesFilter = true;
    } else if (selectedFilter === "project") {
      // Only show project files (files with projectId)
      matchesFilter = !!file.projectId;
      console.log(`[Filter] ${file.filename}: projectId = ${file.projectId}, matchesFilter = ${matchesFilter}`);
    } else if (selectedFilter === "global") {
      // Only show global files (files without projectId)
      matchesFilter = !file.projectId;
      console.log(`[Filter] ${file.filename}: projectId = ${file.projectId}, matchesFilter = ${matchesFilter}`);
    } else if (selectedFilter === "favorites") {
      // Check if file is favorited
      matchesFilter = file.isFavorite === true;
      console.log(`[Filter] ${file.filename}: isFavorite = ${file.isFavorite}, matchesFilter = ${matchesFilter}`);
    } else if (selectedFilter === "date-range") {
      // Date range filter
      if (file._creationTime && dateRange.start && dateRange.end) {
        const fileDate = new Date(file._creationTime);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Include end date fully
        matchesFilter = fileDate >= startDate && fileDate <= endDate;
        console.log(`[Filter] ${file.filename}: fileDate=${fileDate.toDateString()}, start=${startDate.toDateString()}, end=${endDate.toDateString()}, matches=${matchesFilter}`);
      } else {
        matchesFilter = false;
      }
    } else {
      // Category filter
      matchesFilter = file.category === selectedFilter;
    }
    
    const finalResult = matchesSearch && matchesType && matchesFilter;
    console.log(`[Filter] ${file.filename}: final = ${finalResult} (search: ${matchesSearch}, type: ${matchesType}, filter: ${matchesFilter})`);
    return finalResult;
  });

  // Debug: Log filtering results
  console.log(`[FileBrowser] Filtered files: ${filteredFiles.length} (from ${files?.length || 0} total)`);
  if (selectedFilter === "favorites") {
    console.log("[FileBrowser] Favorites filter results:", filteredFiles.map(f => f.filename));
  }

  const grouped = filteredFiles.reduce<Record<string, typeof files>>((acc, f) => {
    if (!f) return acc;
    const cat = f.category ?? "other";
    if (!acc[cat]) acc[cat] = [];
    acc[cat]!.push(f);
    return acc;
  }, {});

  const categories = Object.keys(grouped);

  const handleFileAction = async (action: string, file: any) => {
    console.log('File action triggered:', action, file.filename);
    
    switch (action) {
      case 'favorite':
        try {
          console.log('Toggle favorite:', file.filename, 'ID:', file._id);
          console.log('Current isFavorite:', file.isFavorite);
          
          // Call the mutation first
          const result = await toggleFavorite({ id: file._id });
          console.log(`Favorite status changed to: ${result} for ${file.filename}`);
          
          // Force a re-render by updating a dummy state
          setFavoriteUpdates(prev => new Set(prev));
          
          alert(`${file.filename} ${result ? 'added to' : 'removed from'} favorites`);
        } catch (error) {
          console.error('Failed to toggle favorite:', error);
          alert('Failed to update favorite status');
        }
        break;
      case 'download':
        try {
          console.log('Generating download URL for:', file.filename);
          
          // Generate signed download URL
          const response = await fetch('/api/storyboard/download-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              r2Key: file.r2Key, 
              filename: file.filename 
            })
          });
          
          if (!response.ok) {
            throw new Error('Failed to generate download URL');
          }
          
          const { downloadUrl } = await response.json();
          console.log('Download URL generated:', downloadUrl);
          
          // Create download link
          const link = document.createElement('a');
          link.href = downloadUrl;
          link.download = file.filename;
          link.style.display = 'none';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          
          console.log('Download initiated for:', file.filename);
        } catch (error) {
          console.error('Download failed:', error);
          alert('Download failed');
        }
        break;
      case 'delete':
        if (confirm(`Are you sure you want to delete "${file.filename}"?`)) {
          try {
            console.log('Delete file:', file.filename);
            
            // Delete from R2 first
            const r2Response = await fetch('/api/storyboard/delete-file', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ r2Key: file.r2Key })
            });
            
            if (!r2Response.ok) {
              throw new Error('Failed to delete from R2 storage');
            }
            
            // Delete from database
            await deleteFile({ id: file._id });
            
            console.log(`Successfully deleted ${file.filename} from R2 and database`);
            alert(`Successfully deleted ${file.filename}`);
          } catch (error) {
            console.error('Failed to delete file:', error);
            alert('Failed to delete file');
          }
        }
        break;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-white" />
            <h2 className="text-lg font-medium text-white">File Browser</h2>
            <span className="text-sm text-gray-400">({filteredFiles.length} files)</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Toolbar - Redesigned to match reference */}
        <div className="flex flex-col gap-3 p-4 border-b border-gray-800">
          {/* Top Row: Source tabs left, Search right */}
          <div className="flex items-center justify-between">
            {/* Source Tabs - Left side */}
            <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg">
              <button
                onClick={() => setSelectedFilter("all")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                  selectedFilter === "all" 
                    ? "bg-gray-700 text-white shadow-sm" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                📁 All
              </button>
              <button
                onClick={() => setSelectedFilter("project")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                  selectedFilter === "project" 
                    ? "bg-blue-600/20 text-blue-400 shadow-sm border border-blue-500/30" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                🎯 Project
              </button>
              <button
                onClick={() => setSelectedFilter("global")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                  selectedFilter === "global" 
                    ? "bg-emerald-600/20 text-emerald-400 shadow-sm border border-emerald-500/30" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                🌐 Global
              </button>
              <div className="w-px h-5 bg-gray-700 mx-1"></div>
              <button
                onClick={() => setSelectedFilter("favorites")}
                className={`px-3 py-1.5 rounded-md text-sm font-medium transition flex items-center gap-2 ${
                  selectedFilter === "favorites" 
                    ? "bg-yellow-600/20 text-yellow-400 shadow-sm border border-yellow-500/30" 
                    : "text-gray-400 hover:text-gray-200"
                }`}
              >
                ⭐
              </button>
            </div>

            {/* Right side: Search + Type Filters */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search files..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-48 pl-9 pr-3 py-1.5 bg-gray-800 border border-gray-700 rounded-lg text-sm text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
                />
              </div>

              {/* Type Filter Buttons */}
              <div className="flex items-center gap-1 bg-gray-800/50 p-1 rounded-lg">
                <button
                  onClick={() => setSelectedType("all")}
                  className={`p-1.5 rounded-md transition ${selectedType === "all" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  title="All files"
                >
                  <Grid3x3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedType("image")}
                  className={`p-1.5 rounded-md transition ${selectedType === "image" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  title="Images only"
                >
                  <ImageIcon className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedType("video")}
                  className={`p-1.5 rounded-md transition ${selectedType === "video" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  title="Videos only"
                >
                  <Video className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedType("audio")}
                  className={`p-1.5 rounded-md transition ${selectedType === "audio" ? "bg-gray-700 text-white" : "text-gray-500 hover:text-gray-300"}`}
                  title="Audio only"
                >
                  <Volume2 className="w-4 h-4" />
                </button>
              </div>

              {/* Size Slider */}
              <div className="flex items-center gap-2 bg-gray-800/50 px-3 py-1.5 rounded-lg">
                <span className="text-xs text-gray-400">Size</span>
                <input
                  type="range"
                  min="80"
                  max="200"
                  value={viewSize}
                  onChange={(e) => setViewSize(Number(e.target.value))}
                  className="w-20 accent-emerald-500"
                />
              </div>
            </div>
          </div>
        </div>

          {/* Date Range Picker */}
          {showDateRange && (
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-white font-medium">📅 Date Range Filter</h3>
                <button
                  onClick={() => setShowDateRange(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-gray-400 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={dateRange.start}
                    onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-400 mb-1">End Date</label>
                  <input
                    type="date"
                    value={dateRange.end}
                    onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => {
                    setDateRange({ start: "", end: "" });
                    setSelectedFilter("all");
                    setShowDateRange(false);
                  }}
                  className="px-3 py-1 bg-gray-700 text-gray-300 rounded hover:bg-gray-600 text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={() => {
                    if (dateRange.start && dateRange.end) {
                      console.log(`[DateRange] Applied: ${dateRange.start} to ${dateRange.end}`);
                    }
                  }}
                  className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
                >
                  Apply
                </button>
              </div>
            </div>
          )}


        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {!files ? (
            <div className="flex items-center justify-center h-32">
              <div className="w-5 h-5 border-2 border-gray-600 border-t-gray-400 rounded-full animate-spin" />
            </div>
          ) : filteredFiles.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-center">
              <FolderOpen className="w-12 h-12 text-gray-600 mb-3" />
              <p className="text-sm text-gray-400">No files found</p>
              <p className="text-xs text-gray-500 mt-1">Try adjusting your search or filters</p>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((cat) => {
                const catFiles = grouped[cat] ?? [];
                return (
                  <div key={cat}>
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
                      {CATEGORY_LABELS[cat] ?? cat} ({catFiles.length})
                    </p>
                    <div 
                      className="grid gap-3"
                      style={{
                        gridTemplateColumns: `repeat(auto-fill, minmax(${viewSize}px, 1fr))`,
                      }}
                    >
                      {catFiles.map((file) => {
                        if (!file) return null;
                        const Icon = TYPE_ICON[file.fileType] ?? FileText;
                        const isImage = file.fileType === "image";
                        const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${file.r2Key}`;
                        
                        return (
                          <div key={file._id} className="relative group">
                            <button
                              onClick={(e) => {
                                console.log('File selection clicked for:', file.filename);
                                onSelectFile?.(publicUrl, file.fileType);
                              }}
                              className="w-full aspect-square rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition bg-gray-800"
                              style={{ height: `${viewSize}px` }}
                            >
                              {isImage ? (
                                <img src={publicUrl} alt={file.filename}
                                  className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Icon className="w-6 h-6 text-gray-600" />
                                </div>
                              )}
                            </button>
                            
                            {/* Favorite Star - Always Visible */}
                            <div className="absolute top-2 right-2 z-10 pointer-events-auto">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Favorite button clicked for:', file.filename);
                                  console.log('Current file.isFavorite:', file.isFavorite, 'Type:', typeof file.isFavorite);
                                  console.log('Current optimistic state:', favoriteUpdates.has(file._id));
                                  handleFileAction('favorite', file);
                                }}
                                className={`p-1.5 rounded-full transition shadow-lg ${
                                  (file.isFavorite === true) 
                                    ? 'bg-yellow-500 hover:bg-yellow-400 border-2 border-yellow-300' 
                                    : 'bg-gray-900/90 hover:bg-gray-800 border-2 border-gray-600'
                                }`}
                                title={(file.isFavorite === true) ? "Remove from favorites" : "Add to favorites"}
                              >
                                {(file.isFavorite === true) ? (
                                  <>
                                    <StarFilled className="w-4 h-4 text-yellow-200 drop-shadow-md" />
                                    {console.log(`Rendering filled star for: ${file.filename}`)}
                                  </>
                                ) : (
                                  <>
                                    <Star className="w-4 h-4 text-gray-400 drop-shadow-md" />
                                    {console.log(`Rendering outline star for: ${file.filename}`)}
                                  </>
                                )}
                              </button>
                            </div>
                            
                            {/* Other Actions - Only on Hover */}
                            <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition flex gap-1 z-10 pointer-events-auto">
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Download button clicked for:', file.filename);
                                  handleFileAction('download', file);
                                }}
                                className="p-1.5 bg-gray-800/90 rounded hover:bg-gray-700 transition"
                                title="Download"
                              >
                                <Download className="w-3 h-3 text-gray-300" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  console.log('Delete button clicked for:', file.filename);
                                  handleFileAction('delete', file);
                                }}
                                className="p-1.5 bg-gray-800/90 rounded hover:bg-red-600 transition"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3 text-gray-300" />
                              </button>
                            </div>
                            
                            {/* Filename */}
                            <div className="absolute bottom-0 left-0 right-0 bg-black/80 px-2 py-1">
                              <div className="flex items-center gap-1">
                                {file.projectId ? (
                                  <span className="text-[10px] px-1 py-0.5 bg-blue-500/20 text-blue-400 rounded">Project</span>
                                ) : (
                                  <span className="text-[10px] px-1 py-0.5 bg-emerald-500/20 text-emerald-400 rounded">Global</span>
                                )}
                                <p className="text-xs text-gray-300 truncate flex-1">{file.filename}</p>
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
      </div>
    </div>
  );
}
