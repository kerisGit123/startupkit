"use client";

import { X, Tag, Plus } from "lucide-react";

interface ManageArcTagsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ManageArcTagsModal({ isOpen, onClose }: ManageArcTagsModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
              <Tag className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Manage Arc Tags</h2>
              <p className="text-sm text-gray-400">Create and organize story arcs</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Existing Arc Tags */}
        <div className="space-y-3 mb-6">
          <h3 className="text-xs font-bold text-gray-400 uppercase mb-3">EXISTING ARC TAGS</h3>
          
          <div className="bg-[#25252f] rounded-lg p-4 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
              <div>
                <h4 className="text-sm font-bold text-white">Training Arc</h4>
                <p className="text-xs text-gray-400">4 episodes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition flex items-center gap-1">
                <i className="fas fa-edit"></i>Edit
              </button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div className="bg-[#25252f] rounded-lg p-4 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-orange-500"></div>
              <div>
                <h4 className="text-sm font-bold text-white">Tournament Arc</h4>
                <p className="text-xs text-gray-400">6 episodes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition flex items-center gap-1">
                <i className="fas fa-edit"></i>Edit
              </button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>

          <div className="bg-[#25252f] rounded-lg p-4 flex items-center justify-between border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-blue-500"></div>
              <div>
                <h4 className="text-sm font-bold text-white">Rivalry Arc</h4>
                <p className="text-xs text-gray-400">2 episodes</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-xs text-gray-300 hover:text-white transition flex items-center gap-1">
                <i className="fas fa-edit"></i>Edit
              </button>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-red-500/20 rounded-lg text-xs text-red-400 transition">
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </div>
        </div>

        {/* Add New Arc Tag */}
        <div className="bg-[#25252f] rounded-xl p-4 border border-white/10">
          <h3 className="text-sm font-bold text-white mb-3">Add New Arc Tag</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Arc Name</label>
              <input
                type="text"
                placeholder="e.g., Climax Arc"
                className="w-full px-4 py-3 bg-[#1a1a24] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 block mb-2">Arc Color</label>
              <div className="flex gap-2">
                <button className="w-10 h-10 rounded-lg bg-purple-500 hover:scale-110 transition"></button>
                <button className="w-10 h-10 rounded-lg bg-orange-500 hover:scale-110 transition"></button>
                <button className="w-10 h-10 rounded-lg bg-blue-500 hover:scale-110 transition"></button>
                <button className="w-10 h-10 rounded-lg bg-green-500 hover:scale-110 transition"></button>
                <button className="w-10 h-10 rounded-lg bg-pink-500 hover:scale-110 transition"></button>
                <button className="w-10 h-10 rounded-lg bg-red-500 hover:scale-110 transition"></button>
              </div>
            </div>
            <button className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg hover:opacity-90 transition">
              <Plus className="w-4 h-4 inline mr-2" />
              Create Arc Tag
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
