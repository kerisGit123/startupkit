"use client";

import { X, User, Upload, Plus } from "lucide-react";

interface CharacterCreatorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CharacterCreatorModal({ isOpen, onClose }: CharacterCreatorModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#1a1a24] rounded-2xl p-6 max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
              <User className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Character Creator</h2>
              <p className="text-sm text-gray-400">Describe your manga character and generate clean front and back view references</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Character Name */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Character Name *</label>
              <input
                type="text"
                placeholder="e.g., Kaito Yamamoto"
                className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Role</label>
              <select className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
                <option>Protagonist</option>
                <option>Antagonist</option>
                <option>Supporting</option>
                <option>Minor</option>
              </select>
            </div>
          </div>

          {/* Age, Height, Build */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Age</label>
              <input
                type="text"
                placeholder="e.g., 16"
                className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Height (cm)</label>
              <input
                type="text"
                placeholder="e.g., 175"
                className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Build</label>
              <select className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500">
                <option>Athletic</option>
                <option>Slim</option>
                <option>Muscular</option>
                <option>Average</option>
              </select>
            </div>
          </div>

          {/* Character Description */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Character Description *</label>
            <textarea
              placeholder="Example: A teenage ninja with spiky black hair, determined eyes, wearing an orange jacket and headband. Athletic build, confident stance, friendly smile."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              rows={4}
            />
            <p className="text-xs text-gray-500 mt-1">Describe appearance, clothing, distinctive features, and personality traits</p>
          </div>

          {/* Personality Traits */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Personality Traits</label>
            <input
              type="text"
              placeholder="e.g., Brave, Determined, Hot-headed, Loyal"
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500"
            />
          </div>

          {/* Background Story */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Background Story (Optional)</label>
            <textarea
              placeholder="Brief character background and motivation..."
              className="w-full px-4 py-3 bg-[#25252f] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-purple-500 resize-none"
              rows={3}
            />
          </div>

          {/* Reference Images */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Reference Images (Optional)</label>
            <div className="border-2 border-dashed border-white/10 rounded-xl p-8 text-center hover:border-purple-500/30 transition cursor-pointer bg-[#25252f]">
              <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-purple-500/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-purple-400" />
              </div>
              <p className="text-sm font-medium text-white mb-1">Click to upload character references</p>
              <p className="text-xs text-gray-400">PNG, JPG up to 10MB. Upload multiple images for better results.</p>
            </div>
          </div>

          {/* Tags */}
          <div>
            <label className="text-sm font-medium text-gray-300 mb-2 block">Tags</label>
            <div className="flex flex-wrap gap-2 mb-2">
              <span className="px-3 py-1.5 bg-purple-500/20 text-purple-400 rounded-full text-xs font-medium">
                Main Character
              </span>
              <span className="px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-medium">
                Hero
              </span>
              <button className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-gray-400 rounded-full text-xs font-medium transition flex items-center gap-1">
                <Plus className="w-3 h-3" />
                Add Tag
              </button>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-white/5 hover:bg-white/10 text-gray-300 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:opacity-90 transition flex items-center justify-center gap-2">
              <User className="w-4 h-4" />
              Generate Character
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
