"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Filter, Calendar, Clock, Users, Star, MoreVertical, Trash2, Edit } from "lucide-react";

interface Project {
  id: string;
  name: string;
  description: string;
  thumbnail?: string;
  itemCount: number;
  createdAt: Date;
  lastModified: Date;
  tags: string[];
  status: 'draft' | 'in-progress' | 'completed';
  collaborators: string[];
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Mock data
  const [projects, setProjects] = useState<Project[]>([
    {
      id: "proj-1",
      name: "Basketball Story",
      description: "A tale of determination and teamwork on the court",
      itemCount: 24,
      createdAt: new Date('2024-01-15'),
      lastModified: new Date('2024-01-20'),
      tags: ['sports', 'shonen', 'school'],
      status: 'in-progress',
      collaborators: ['user1', 'artist2']
    },
    {
      id: "proj-2", 
      name: "Mystery Detective",
      description: "Detective solving crimes in futuristic city",
      itemCount: 15,
      createdAt: new Date('2024-01-10'),
      lastModified: new Date('2024-01-18'),
      tags: ['mystery', 'sci-fi', 'seinen'],
      status: 'draft',
      collaborators: ['user1']
    }
  ]);

  const allTags = [...new Set(projects.flatMap(p => p.tags))];

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         project.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTags = selectedTags.length === 0 || 
                        selectedTags.some(tag => project.tags.includes(tag));
    return matchesSearch && matchesTags;
  });

  const handleCreateProject = () => {
    // Navigate to project creation or open modal
    console.log("Create new project");
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f0f14] overflow-hidden">
      {/* Header */}
      <div className="bg-[#13131a] border-b border-white/10 px-8 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white mb-2">Projects</h1>
            <p className="text-sm text-gray-400">Manage your storyboard projects</p>
          </div>
          <button
            onClick={handleCreateProject}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            New Project
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex items-center gap-4">
          <div className="flex-1 relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search projects..."
              className="w-full pl-10 pr-4 py-2 bg-[#1a1a24] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          {/* Tag Filter */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <div className="flex gap-1">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setSelectedTags(prev => 
                    prev.includes(tag) 
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                    selectedTags.includes(tag)
                      ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                      : 'bg-white/5 text-gray-500 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* View Toggle */}
          <div className="flex bg-[#1a1a24] rounded-lg p-1">
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-gray-500'
              }`}
            >
              Grid
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded text-xs font-medium transition ${
                viewMode === 'list' ? 'bg-white/10 text-white' : 'text-gray-500'
              }`}
            >
              List
            </button>
          </div>
        </div>
      </div>

      {/* Projects Grid/List */}
      <div className="flex-1 overflow-y-auto p-8">
        {filteredProjects.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 bg-[#1a1a24] rounded-xl flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-gray-600" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No projects found</h3>
            <p className="text-sm text-gray-400 mb-6">Create your first storyboard project to get started</p>
            <button
              onClick={handleCreateProject}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-semibold hover:opacity-90 transition"
            >
              Create Project
            </button>
          </div>
        ) : (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
            {filteredProjects.map(project => (
              <Link
                key={project.id}
                href={`/manga-studio/projects/${project.id}`}
                className="group"
              >
                <div className="bg-[#1a1a24] border border-white/10 rounded-xl overflow-hidden hover:border-purple-500/30 transition-all duration-200 hover:shadow-lg hover:shadow-purple-500/10">
                  {/* Thumbnail */}
                  <div className="aspect-video bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    {project.thumbnail ? (
                      <img src={project.thumbnail} alt={project.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="text-center">
                        <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center mx-auto mb-2">
                          <Star className="w-6 h-6 text-purple-400" />
                        </div>
                        <p className="text-xs text-gray-400">No thumbnail</p>
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="p-4">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-white group-hover:text-purple-400 transition">
                        {project.name}
                      </h3>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="p-1 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>

                    <p className="text-sm text-gray-400 line-clamp-2 mb-3">{project.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {project.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="px-2 py-1 bg-purple-500/10 text-purple-400 rounded text-xs">
                          {tag}
                        </span>
                      ))}
                      {project.tags.length > 3 && (
                        <span className="px-2 py-1 bg-white/5 text-gray-500 rounded text-xs">
                          +{project.tags.length - 3}
                        </span>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {project.itemCount} items
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {project.lastModified.toLocaleDateString()}
                        </span>
                      </div>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${
                        project.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400' :
                        project.status === 'in-progress' ? 'bg-blue-500/10 text-blue-400' :
                        'bg-gray-500/10 text-gray-400'
                      }`}>
                        {project.status}
                      </div>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
