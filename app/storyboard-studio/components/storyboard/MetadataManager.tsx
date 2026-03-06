"use client";

import { useState } from "react";
import { StoryboardItem, Character, Location, Asset } from "../../types/storyboard";
import { Users, MapPin, Package, Plus, X, Edit2, Trash2, Search } from "lucide-react";

interface MetadataManagerProps {
  items: StoryboardItem[];
  onUpdateItem: (item: StoryboardItem) => void;
}

export function MetadataManager({ items, onUpdateItem }: MetadataManagerProps) {
  const [activeTab, setActiveTab] = useState<'characters' | 'locations' | 'assets'>('characters');
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Character | Location | Asset | null>(null);

  // Extract unique metadata from items
  const extractMetadata = () => {
    const characters = new Set<string>();
    const locations = new Set<string>();
    const assets = new Set<string>();

    items.forEach(item => {
      item.metadata.characters.forEach(char => characters.add(char));
      item.metadata.locations.forEach(loc => locations.add(loc));
      item.metadata.assets.forEach(asset => assets.add(asset));
    });

    return {
      characters: Array.from(characters).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        type: 'character' as const,
        usageCount: items.filter(item => item.metadata.characters.includes(name)).length,
        items: items.filter(item => item.metadata.characters.includes(name))
      })),
      locations: Array.from(locations).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        type: 'location' as const,
        usageCount: items.filter(item => item.metadata.locations.includes(name)).length,
        items: items.filter(item => item.metadata.locations.includes(name))
      })),
      assets: Array.from(assets).map(name => ({
        id: name.toLowerCase().replace(/\s+/g, '-'),
        name,
        type: 'asset' as const,
        usageCount: items.filter(item => item.metadata.assets.includes(name)).length,
        items: items.filter(item => item.metadata.assets.includes(name))
      }))
    };
  };

  const metadata = extractMetadata();

  const getFilteredData = () => {
    const data = activeTab === 'characters' ? metadata.characters :
                  activeTab === 'locations' ? metadata.locations :
                  metadata.assets;
    
    return data.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  };

  const handleDelete = (item: any) => {
    // Remove from all items
    const updatedItems = items.map(storyboardItem => {
      const updatedMetadata = { ...storyboardItem.metadata };
      
      if (activeTab === 'characters') {
        updatedMetadata.characters = updatedMetadata.characters.filter(char => char !== item.name);
      } else if (activeTab === 'locations') {
        updatedMetadata.locations = updatedMetadata.locations.filter(loc => loc !== item.name);
      } else {
        updatedMetadata.assets = updatedMetadata.assets.filter(asset => asset !== item.name);
      }
      
      return { ...storyboardItem, metadata: updatedMetadata };
    });

    // Update each item (in real app, this would be batch updated)
    updatedItems.forEach(onUpdateItem);
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setShowAddModal(true);
  };

  const renderAddModal = () => {
    if (!showAddModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a24] rounded-2xl border border-white/10 w-full max-w-md">
          <div className="p-6 border-b border-white/10">
            <h3 className="text-lg font-bold text-white">
              {editingItem ? `Edit ${activeTab.slice(0, -1)}` : `Add ${activeTab.slice(0, -1)}`}
            </h3>
          </div>
          
          <div className="p-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Name</label>
              <input
                type="text"
                defaultValue={editingItem?.name || ""}
                placeholder={`Enter ${activeTab.slice(0, -1)} name...`}
                className="w-full px-4 py-3 bg-[#0f1117] border border-white/10 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
              />
            </div>
          </div>
          
          <div className="p-6 border-t border-white/10 flex items-center justify-end gap-3">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 bg-white/5 text-gray-300 rounded-lg font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                // Handle add/edit logic here
                setShowAddModal(false);
                setEditingItem(null);
              }}
              className="px-4 py-2 bg-purple-500 text-white rounded-lg font-medium hover:bg-purple-600 transition"
            >
              {editingItem ? 'Update' : 'Add'}
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#1a1a24] border border-white/10 rounded-xl p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-bold text-white">Metadata Manager</h3>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-3 py-1.5 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          Add {activeTab.slice(0, -1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0f1117] rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('characters')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'characters' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Users className="w-4 h-4" />
          Characters ({metadata.characters.length})
        </button>
        <button
          onClick={() => setActiveTab('locations')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'locations' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <MapPin className="w-4 h-4" />
          Locations ({metadata.locations.length})
        </button>
        <button
          onClick={() => setActiveTab('assets')}
          className={`flex-1 px-3 py-2 rounded text-sm font-medium transition flex items-center justify-center gap-2 ${
            activeTab === 'assets' ? 'bg-purple-500 text-white' : 'text-gray-500 hover:text-white'
          }`}
        >
          <Package className="w-4 h-4" />
          Assets ({metadata.assets.length})
        </button>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={`Search ${activeTab}...`}
          className="w-full pl-10 pr-4 py-2 bg-[#0f1117] border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50"
        />
      </div>

      {/* List */}
      <div className="space-y-2 max-h-96 overflow-y-auto">
        {getFilteredData().map(item => (
          <div
            key={item.id}
            className="bg-[#0f1117] border border-white/10 rounded-lg p-4 hover:border-purple-500/30 transition"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {activeTab === 'characters' && <Users className="w-4 h-4 text-orange-400" />}
                  {activeTab === 'locations' && <MapPin className="w-4 h-4 text-blue-400" />}
                  {activeTab === 'assets' && <Package className="w-4 h-4 text-purple-400" />}
                  <h4 className="font-medium text-white">{item.name}</h4>
                  <span className="px-2 py-0.5 bg-purple-500/10 text-purple-400 rounded text-xs">
                    {item.usageCount} uses
                  </span>
                </div>
                
                {/* Related Items Preview */}
                {item.items.length > 0 && (
                  <div className="text-xs text-gray-400">
                    Used in: {item.items.slice(0, 3).map(i => `Shot ${i.id}`).join(', ')}
                    {item.items.length > 3 && ` +${item.items.length - 3} more`}
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-white transition"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => handleDelete(item)}
                  className="p-1.5 hover:bg-white/10 rounded text-gray-400 hover:text-red-400 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        ))}
        
        {getFilteredData().length === 0 && (
          <div className="text-center py-8">
            <div className="w-12 h-12 bg-white/5 rounded-lg flex items-center justify-center mx-auto mb-3">
              {activeTab === 'characters' && <Users className="w-6 h-6 text-gray-600" />}
              {activeTab === 'locations' && <MapPin className="w-6 h-6 text-gray-600" />}
              {activeTab === 'assets' && <Package className="w-6 h-6 text-gray-600" />}
            </div>
            <p className="text-gray-400 text-sm">No {activeTab} found</p>
            <button
              onClick={() => setShowAddModal(true)}
              className="mt-3 px-4 py-2 bg-purple-500 text-white rounded-lg text-sm font-medium hover:bg-purple-600 transition"
            >
              Add {activeTab.slice(0, -1)}
            </button>
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {renderAddModal()}
    </div>
  );
}
