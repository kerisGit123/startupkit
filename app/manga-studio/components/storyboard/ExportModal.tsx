"use client";

import { useState } from "react";
import { Download, Share2, FileText, Image, Film, Settings, HelpCircle } from "lucide-react";
import { Project, StoryboardItem } from "../../types/storyboard";

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  selectedItems?: StoryboardItem[];
}

export function ExportModal({ isOpen, onClose, project, selectedItems = [] }: ExportModalProps) {
  const [exportFormat, setExportFormat] = useState<'pdf' | 'images' | 'script' | 'json' | 'video'>('pdf');
  const [includeOptions, setIncludeOptions] = useState({
    visuals: true,
    script: true,
    metadata: true,
    timestamps: false,
  });
  const [imageQuality, setImageQuality] = useState<'high' | 'medium' | 'low'>('high');
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);

  if (!isOpen) return null;

  const handleExport = async () => {
    setIsExporting(true);
    setExportProgress(0);

    // Simulate export process
    const progressInterval = setInterval(() => {
      setExportProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          setIsExporting(false);
          // In real app, trigger download here
          console.log(`Exporting ${project.name} as ${exportFormat}`);
          return 100;
        }
        return prev + Math.random() * 20;
      });
    }, 300);
  };

  const itemsToExport = selectedItems.length > 0 ? selectedItems : project.storyboard;

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-white mb-2">Export Project</h2>
              <p className="text-sm text-gray-400">Export "{project.name}" in various formats</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white"
            >
              ×
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Export Format</label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { id: 'pdf', label: 'PDF Document', icon: FileText, description: 'Complete storyboard with visuals and script' },
                { id: 'images', label: 'Image Files', icon: Image, description: 'Individual visual frames' },
                { id: 'script', label: 'Script Only', icon: FileText, description: 'Text-based script format' },
                { id: 'json', label: 'JSON Data', icon: Settings, description: 'Raw project data for developers' },
                { id: 'video', label: 'Video', icon: Film, description: 'Animated storyboard video' },
              ].map(format => (
                <button
                  key={format.id}
                  onClick={() => setExportFormat(format.id as any)}
                  className={`p-4 border rounded-lg text-left transition-all ${
                    exportFormat === format.id
                      ? 'border-purple-500/50 bg-purple-500/10'
                      : 'border-white/10 hover:border-purple-500/30'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-2">
                    <format.icon className="w-5 h-5 text-purple-400" />
                    <span className="font-medium text-white">{format.label}</span>
                  </div>
                  <p className="text-xs text-gray-400">{format.description}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Export Options */}
          <div>
            <label className="block text-sm font-medium text-white mb-3">Include Options</label>
            <div className="space-y-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.visuals}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, visuals: e.target.checked }))}
                  className="w-4 h-4 bg-[#0f1117] border border-white/10 rounded text-purple-500"
                />
                <div>
                  <span className="text-white">Visual Content</span>
                  <p className="text-xs text-gray-500">Include storyboard frames and visuals</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.script}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, script: e.target.checked }))}
                  className="w-4 h-4 bg-[#0f1117] border border-white/10 rounded text-purple-500"
                />
                <div>
                  <span className="text-white">Script Content</span>
                  <p className="text-xs text-gray-500">Include dialogue, action, and descriptions</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.metadata}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, metadata: e.target.checked }))}
                  className="w-4 h-4 bg-[#0f1117] border border-white/10 rounded text-purple-500"
                />
                <div>
                  <span className="text-white">Metadata</span>
                  <p className="text-xs text-gray-500">Include tags, characters, locations</p>
                </div>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeOptions.timestamps}
                  onChange={(e) => setIncludeOptions(prev => ({ ...prev, timestamps: e.target.checked }))}
                  className="w-4 h-4 bg-[#0f1117] border border-white/10 rounded text-purple-500"
                />
                <div>
                  <span className="text-white">Timestamps</span>
                  <p className="text-xs text-gray-500">Include creation and modification dates</p>
                </div>
              </label>
            </div>
          </div>

          {/* Quality Settings (for images/video) */}
          {(exportFormat === 'images' || exportFormat === 'video') && (
            <div>
              <label className="block text-sm font-medium text-white mb-3">Quality Settings</label>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { id: 'high', label: 'High (4K)', description: 'Best quality, larger file size' },
                  { id: 'medium', label: 'Medium (1080p)', description: 'Good balance' },
                  { id: 'low', label: 'Low (720p)', description: 'Smaller file size' },
                ].map(quality => (
                  <button
                    key={quality.id}
                    onClick={() => setImageQuality(quality.id as any)}
                    className={`p-3 border rounded-lg text-center transition-all ${
                      imageQuality === quality.id
                        ? 'border-purple-500/50 bg-purple-500/10'
                        : 'border-white/10 hover:border-purple-500/30'
                    }`}
                  >
                    <div className="font-medium text-white text-sm">{quality.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{quality.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Export Summary */}
          <div className="bg-[#0f1117] border border-white/10 rounded-lg p-4">
            <h4 className="font-medium text-white mb-3">Export Summary</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Project:</span>
                <span className="text-white">{project.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Format:</span>
                <span className="text-white capitalize">{exportFormat}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Items to export:</span>
                <span className="text-white">{itemsToExport.length} items</span>
              </div>
              {(exportFormat === 'images' || exportFormat === 'video') && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Quality:</span>
                  <span className="text-white capitalize">{imageQuality}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-400">Estimated size:</span>
                <span className="text-white">
                  {exportFormat === 'pdf' ? '~2-5 MB' :
                   exportFormat === 'images' ? '~10-50 MB' :
                   exportFormat === 'script' ? '~50-200 KB' :
                   exportFormat === 'json' ? '~100-500 KB' :
                   '~50-200 MB'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10">
          {isExporting ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-400">Exporting project...</span>
                <span className="text-purple-400 font-bold">{Math.round(exportProgress)}%</span>
              </div>
              <div className="w-full h-2 bg-[#0f1117] rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button className="p-2 hover:bg-white/10 rounded-lg transition text-gray-400 hover:text-white">
                  <HelpCircle className="w-4 h-4" />
                </button>
                <span className="text-xs text-gray-500">Need help with export?</span>
              </div>
              
              <div className="flex items-center gap-3">
                <button
                  onClick={onClose}
                  className="px-6 py-2.5 bg-white/5 text-gray-300 rounded-lg font-medium transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleExport}
                  className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
