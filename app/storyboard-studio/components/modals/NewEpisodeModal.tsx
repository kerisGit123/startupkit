"use client";

import { X, Plus } from "lucide-react";

interface NewEpisodeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NewEpisodeModal({ isOpen, onClose }: NewEpisodeModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#13131a] rounded-2xl p-6 max-w-2xl w-full mx-4 border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
              <Plus className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">New Episode</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <div className="space-y-4">
          {/* Episode Title */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Episode Title</label>
            <input
              type="text"
              placeholder="Enter episode title..."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Section */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Section</label>
            <select className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:border-purple-500">
              <option>Section 1: The Beginning</option>
              <option>Section 2: Rising Action</option>
            </select>
          </div>

          {/* Description */}
          <div>
            <label className="text-sm font-medium text-gray-300 block mb-2">Description</label>
            <textarea
              placeholder="Brief episode description..."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white focus:outline-none focus:border-purple-500 resize-none"
              rows={4}
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold shadow-lg hover:opacity-90 transition">
              Create Episode
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
