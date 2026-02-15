"use client";

import { X, BookOpen, Plus } from "lucide-react";

interface StoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function StoryManagerModal({ isOpen, onClose }: StoryManagerModalProps) {
  if (!isOpen) return null;

  const stories = [
    {
      id: 1,
      name: "Basketball Dreams",
      initial: "B",
      color: "from-orange-500 to-red-500",
      genre: "Sports • Action",
      description: "A young player's journey to become the best basketball player in the nation.",
      episodes: 12,
      pages: 84,
      characters: 8,
      status: "Active",
      statusColor: "bg-green-500/20 text-green-400"
    },
    {
      id: 2,
      name: "Shadow Fighter",
      initial: "S",
      color: "from-purple-500 to-pink-500",
      genre: "Action • Fantasy",
      description: "Underground martial arts tournament with supernatural powers.",
      episodes: 8,
      pages: 52,
      characters: 6,
      status: "Draft",
      statusColor: "bg-yellow-500/20 text-yellow-400"
    }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-sm">
      <div className="bg-[#1a1a24] rounded-2xl p-8 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto border border-white/10">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <BookOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Story Manager</h2>
              <p className="text-sm text-gray-400">Manage multiple story projects</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-white/5 hover:bg-white/10 rounded-lg flex items-center justify-center text-gray-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Story Cards */}
        <div className="grid grid-cols-2 gap-6 mb-6">
          {stories.map((story) => (
            <div
              key={story.id}
              className="bg-[#25252f] rounded-xl p-6 border border-white/10 hover:border-purple-500/30 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4 mb-4">
                <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${story.color} flex items-center justify-center text-white text-2xl font-bold shadow-lg`}>
                  {story.initial}
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-bold text-white">{story.name}</h3>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${story.statusColor}`}>
                      {story.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{story.genre}</p>
                </div>
              </div>
              
              <p className="text-sm text-gray-300 mb-4">{story.description}</p>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-purple-400">{story.episodes}</p>
                  <p className="text-xs text-gray-500">Episodes</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-pink-400">{story.pages}</p>
                  <p className="text-xs text-gray-500">Pages</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-blue-400">{story.characters}</p>
                  <p className="text-xs text-gray-500">Characters</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Create New Story */}
        <button className="w-full border-2 border-dashed border-white/10 hover:border-purple-500/30 rounded-xl p-8 text-center transition-all group">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-purple-500/20 flex items-center justify-center group-hover:bg-purple-500/30 transition">
            <Plus className="w-8 h-8 text-purple-400" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">Create New Story</h3>
          <p className="text-sm text-gray-400">Start a new manga project</p>
        </button>
      </div>
    </div>
  );
}
