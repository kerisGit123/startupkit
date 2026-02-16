"use client";

import { useState } from "react";
import { X, FileText } from "lucide-react";

interface NewPageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreatePage?: (pageName: string, template: string) => void;
}

export function NewPageModal({ isOpen, onClose, onCreatePage }: NewPageModalProps) {
  const [pageName, setPageName] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("standard");

  if (!isOpen) return null;

  const templates = [
    { id: "standard", name: "Standard Vertical", panels: 3, description: "3-panel webtoon" },
    { id: "hero", name: "Hero Panel", panels: 4, description: "Large + small panels" },
    { id: "fullscroll", name: "Full Scroll", panels: 1, description: "Single column" },
  ];

  const handleCreate = () => {
    if (pageName.trim()) {
      onCreatePage?.(pageName, selectedTemplate);
      setPageName("");
      setSelectedTemplate("standard");
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <FileText className="w-6 h-6 text-blue-400" />
              </div>
              <div>
                <h2 className="text-white font-bold text-xl">Add New Page</h2>
                <p className="text-sm text-gray-400 mt-0.5">Create a new page for your episode</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-lg hover:bg-white/10 transition flex items-center justify-center text-gray-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Page Name */}
          <div>
            <label className="block text-sm font-semibold text-white mb-2">
              Page Name
            </label>
            <input
              type="text"
              value={pageName}
              onChange={(e) => setPageName(e.target.value)}
              placeholder="e.g., Page 1, Opening Scene, etc."
              className="w-full bg-[#0f1117] border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition"
              autoFocus
            />
          </div>

          {/* Template Selection */}
          <div>
            <label className="block text-sm font-semibold text-white mb-3">
              Page Template
            </label>
            <div className="grid grid-cols-3 gap-3">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => setSelectedTemplate(template.id)}
                  className={`p-4 rounded-lg border-2 transition text-center ${
                    selectedTemplate === template.id
                      ? "border-purple-500 bg-purple-500/10"
                      : "border-white/10 bg-[#0f1117] hover:border-purple-500/30"
                  }`}
                >
                  {/* Template Preview Visual */}
                  <div className="mb-3 h-48 rounded border border-white/10 bg-[#0a0a0f] p-3 flex items-center justify-center">
                    {template.id === "standard" && (
                      <div className="w-full h-full flex flex-col gap-2">
                        <div className="flex-1 border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                        <div className="flex-1 border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                        <div className="flex-1 border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                      </div>
                    )}
                    {template.id === "hero" && (
                      <div className="w-full h-full flex flex-col gap-2">
                        <div className="flex-[2] border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                        <div className="flex-1 border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                        <div className="flex-1 border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                      </div>
                    )}
                    {template.id === "fullscroll" && (
                      <div className="w-full h-full border-2 border-purple-500/50 rounded bg-[#1a1a24]"></div>
                    )}
                  </div>
                  <div className="font-semibold text-white mb-1 text-sm">{template.name}</div>
                  <div className="text-xs text-gray-400">{template.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition"
          >
            Cancel
          </button>
          <button
            onClick={handleCreate}
            disabled={!pageName.trim()}
            className="px-6 py-2.5 bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-lg font-semibold hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Create Page
          </button>
        </div>
      </div>
    </div>
  );
}
