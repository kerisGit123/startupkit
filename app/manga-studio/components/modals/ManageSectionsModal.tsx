"use client";

import { X, Layers, Plus } from "lucide-react";

interface ManageSectionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageSectionsModal({ isOpen, onClose }: ManageSectionsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Layers className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Manage Sections</h2>
              <p className="text-sm text-gray-400">Organize episodes into sections</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Sections */}
        <div className="space-y-4 mb-6">
          <div className="bg-[#1a1a24] rounded-lg p-4 flex items-center justify-between border border-white/10">
            <div>
              <h4 className="text-sm font-bold text-white">Section 1: The Beginning</h4>
              <p className="text-xs text-gray-400">4 episodes</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition">
                <i className="fas fa-edit mr-1"></i>Edit
              </button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-red-400 transition">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div className="bg-[#1a1a24] rounded-lg p-4 flex items-center justify-between border border-white/10">
            <div>
              <h4 className="text-sm font-bold text-white">Section 2: Rising Action</h4>
              <p className="text-xs text-gray-400">6 episodes</p>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition">
                <i className="fas fa-edit mr-1"></i>Edit
              </button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-red-400 transition">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Add New Section */}
        <div className="bg-[#1a1a24] rounded-xl p-4 mb-4 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-3">Add New Section</h3>
          <input
            type="text"
            placeholder="Section name..."
            className="w-full px-4 py-3 bg-[#0a0a0f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 mb-3"
          />
          <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition">
            <Plus className="w-4 h-4 inline mr-2" />
            Add Section
          </button>
        </div>
      </div>
    </div>
  );
}
