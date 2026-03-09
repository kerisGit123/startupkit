"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useOrganization, useUser } from "@clerk/nextjs";
import { 
  X, Search, Filter, ChevronDown, FolderOpen, 
  Image as ImageIcon, Video, Volume2, FileText, Download, Trash2
} from "lucide-react";

interface GlobalFileBrowserProps {
  onClose: () => void;
}

const TYPE_ICON: Record<string, React.ElementType> = {
  image: ImageIcon,
  video: Video,
  audio: Volume2,
  pdf: FileText,
  default: FileText,
};

export function GlobalFileBrowser({ onClose }: GlobalFileBrowserProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  
  // Get org files (or user files for personal accounts)
  const { organization } = useOrganization();
  const { user } = useUser();
  const orgId = organization?.id;
  const userId = !orgId ? user?.id : null;
  
  const files = useQuery(
    orgId ? api.storyboard.storyboardFiles.listByOrg : api.storyboard.storyboardFiles.listByUser, 
    orgId ? { orgId } : { userId: userId! }
  );

  // Debug: Log loaded files
  console.log('[GlobalFileBrowser] Files loaded:', files?.length, 'files');
  console.log('[GlobalFileBrowser] Sample file:', files?.[0]);

  // Download function
  const handleDownload = async (file: any) => {
    try {
      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${file.r2Key}`;
      
      // Fetch the file
      const response = await fetch(publicUrl);
      if (!response.ok) {
        throw new Error('Failed to download file');
      }
      
      // Create blob
      const blob = await response.blob();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.filename;
      document.body.appendChild(a);
      a.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log(`[Download] Downloaded: ${file.filename}`);
    } catch (error) {
      console.error(`[Download Error] Failed to download ${file.filename}:`, error);
    }
  };
  
  // Add available categories to the categories list
  const allCategories = ['all', 'uploads', 'generated', 'elements', 'videos'];

  // Filter files
  const filteredFiles = files?.filter(file => {
    const matchesSearch = file.filename.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === "all" || file.fileType === selectedType;
    return matchesSearch && matchesType;
  }) ?? [];

  const groupedFiles = filteredFiles.reduce((acc, file) => {
    const category = file.category || "uploads";
    if (!acc[category]) acc[category] = [];
    acc[category].push(file);
    return acc;
  }, {} as Record<string, typeof filteredFiles>);

  // Category display names
  const categoryLabels: Record<string, string> = {
    uploads: "Uploads",
    generated: "AI Generated", 
    elements: "Elements",
    videos: "Videos",
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a1a] rounded-xl border border-gray-800 w-full max-w-6xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <FolderOpen className="w-5 h-5 text-white" />
            <h2 className="text-lg font-medium text-white">All Files</h2>
            <span className="text-sm text-gray-400">({filteredFiles.length} files)</span>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-800 rounded-lg transition">
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 p-4 border-b border-gray-800">
          {/* Search */}
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-gray-600"
            />
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedType("all")}
              className={`p-2 rounded transition ${selectedType === "all" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              All
            </button>
            <button
              onClick={() => setSelectedType("image")}
              className={`p-2 rounded transition ${selectedType === "image" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              <ImageIcon className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedType("video")}
              className={`p-2 rounded transition ${selectedType === "video" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              <Video className="w-4 h-4" />
            </button>
            <button
              onClick={() => setSelectedType("audio")}
              className={`p-2 rounded transition ${selectedType === "audio" ? "bg-gray-700 text-white" : "bg-gray-800 text-gray-400 hover:bg-gray-700"}`}
            >
              <Volume2 className="w-4 h-4" />
            </button>
          </div>
        </div>

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
              {Object.entries(groupedFiles).map(([category, categoryFiles]) => (
                <div key={category}>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-3">
                    {categoryLabels[category] || category} ({categoryFiles.length})
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                    {categoryFiles.map((file) => {
                      const Icon = TYPE_ICON[file.fileType] || FileText;
                      const publicUrl = `${process.env.NEXT_PUBLIC_R2_PUBLIC_URL ?? ""}/${file.r2Key}`;
                      
                      return (
                        <div key={file._id} className="relative group">
                          <div className="aspect-video bg-[#1e1e2a] rounded-lg overflow-hidden relative">
                            {file.fileType === "image" ? (
                              <img 
                                src={publicUrl} 
                                alt={file.filename}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  (e.target as HTMLImageElement).style.display = 'none';
                                }}
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Icon className="w-8 h-8 text-gray-600" />
                              </div>
                            )}
                            
                            {/* Actions */}
                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleDownload(file)}
                                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                                title="Download"
                              >
                                <Download className="w-4 h-4 text-white" />
                              </button>
                            </div>
                          </div>
                          
                          {/* File info */}
                          <div className="mt-2">
                            <p className="text-xs text-gray-300 truncate">{file.filename}</p>
                            <p className="text-[10px] text-gray-600">
                              {(file.size / 1024 / 1024).toFixed(2)} MB
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
