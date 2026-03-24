"use client";

import { useState, useRef, useEffect } from "react";
import {
  DollarSign,
  Calculator,
  CreditCard,
  Plus,
  Edit3,
  Power,
  Search,
  Filter,
  MoreVertical,
  ChevronDown,
  CheckCircle,
  AlertCircle,
  X,
  Trash2,
  Star,
  LayoutGrid,
  Table2,
  List,
  RotateCcw,
  AlertTriangle,
  Image,
  Film,
  Check,
  Circle
} from "lucide-react";
import { usePricingData } from "../../hooks/usePricingData";

// Types
interface PricingModel {
  _id: string;
  modelId: string;
  modelName: string;
  modelType: "image" | "video";
  isActive: boolean;
  pricingType: "fixed" | "formula";
  creditCost?: number;
  factor?: number;
  formulaJson?: string;
  assignedFunction?: "getTopazUpscale" | "getSeedance15" | "getNanoBananaPrice";
  createdAt: number;
  updatedAt: number;
}

interface Analytics {
  totalRevenue: number;
  totalUsage: number;
  avgCost: number;
  activeModels: number;
  usageByModel: Record<string, number>;
}

// Helper function for fixed price calculation
function getFixedPrice(base: number, multiplier: number): number {
  return Math.ceil(base * multiplier);
}

// Custom Nano Banana pricing function
// getNanoBananaPrice(8, 1.3, '1K')  // → 11 credits
// getNanoBananaPrice(8, 1.3, '2K')  // → 16 credits  
// getNanoBananaPrice(8, 1.3, '4K')  // → 24 credits
function getNanoBananaPrice(base: number, multiplier: number, quality: string): number {
  const qualityMultipliers: Record<string, number> = {
    '1K': 1,
    '2K': 1.5,
    '4K': 2.25
  };
  
  const qualityMultiplier = qualityMultipliers[quality] || 1;
  return Math.ceil(base * multiplier * qualityMultiplier);
}

// Topaz AI upscaling pricing function
// getTopazUpscale(10, 1.3, '1x')  // → 13 credits
// getTopazUpscale(10, 1.3, '2x')  // → 26 credits
// getTopazUpscale(10, 1.3, '4x')  // → 52 credits

function getTopazUpscale(base: number, multiplier: number, qualities: string): number {
  const qualityMultipliers: Record<string, number> = {
    '1x': 1,
    '2x': 2,
    '3x': 3,
    '4x': 4
  };
  
  const qualityMultiplier = qualityMultipliers[qualities] || 1;
  return Math.ceil(base * multiplier * qualityMultiplier);
}

// Seedance 1.5 video generation pricing function
// getSeedance15(12, 1.3, '720p', false, 5)  // → 78 credits
// getSeedance15(12, 1.3, '1080p', true, 10)  // → 234 credits
function getSeedance15(base: number, multiplier: number, resolution: string, audio: boolean, duration: number): number {
  const resolutionMultipliers: Record<string, number> = {
    '480p': 1,
    '720p': 1.5,
    '1080p': 2.5,
    '4K': 5
  };
  
  const audioMultiplier = audio ? 1.5 : 1;
  const durationMultiplier = Math.ceil(duration / 5); // Every 5 seconds adds multiplier
  const resolutionMultiplier = resolutionMultipliers[resolution] || 1;
  
  return Math.ceil(base * multiplier * resolutionMultiplier * audioMultiplier * durationMultiplier);
}

// Dark Theme Price Management Component (LTX Studio Style)
export default function PricingManagementDark() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<PricingModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PricingModel>>({});
  const [favoriteModels, setFavoriteModels] = useState<Set<string>>(new Set());
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'grid' | 'card'>('table');
  const [filters, setFilters] = useState({
    pricingType: 'all',
    status: 'all',
    modelType: 'all',
    favorite: false
  });
  
  const { models, analytics, loading, error, saveModel, toggleModelActive, deleteModel, resetToDefaults, refetch: fetchModels } = usePricingData();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  
  // Testing state
  const [testParams, setTestParams] = useState({
    base: 8,
    multiplier: 1.0,
    quality: '1K',
    resolution: '720p',
    audio: false,
    duration: 5,
    upscaleFactor: '1x'
  });
  const [testResult, setTestResult] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showTestingPanel, setShowTestingPanel] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetToDefaults();
    setIsResetting(false);
    setShowResetConfirm(false);
  };

  const handleSave = (data: Partial<PricingModel>) => {
    // Filter out database-specific fields that shouldn't be sent to the API
    const apiData = {
      modelId: data.modelId,
      modelName: data.modelName,
      modelType: data.modelType,
      isActive: data.isActive,
      pricingType: data.pricingType,
      creditCost: data.creditCost,
      factor: data.factor,
      formulaJson: data.formulaJson,
      assignedFunction: data.assignedFunction,
    };
    
    console.log("Sending filtered data to API:", apiData);
    saveModel(apiData).then(success => {
      if (success) {
        // Refresh the models list to get the updated data from database
        fetchModels().then(() => {
          // Find the updated model in the refreshed models list
          const updatedModel = models.find(m => m.modelId === data.modelId);
          if (updatedModel) {
            // Update selectedModel with the actual saved data from database
            setSelectedModel(updatedModel);
            // Update formData with the actual saved data to show the assigned function
            setFormData({
              modelId: updatedModel.modelId,
              modelName: updatedModel.modelName,
              modelType: updatedModel.modelType,
              isActive: updatedModel.isActive,
              pricingType: updatedModel.pricingType,
              creditCost: updatedModel.creditCost,
              factor: updatedModel.factor,
              formulaJson: updatedModel.formulaJson,
              assignedFunction: updatedModel.assignedFunction,
            });
            
            console.log("Pricing model saved and refreshed successfully!");
            console.log("Updated assignedFunction:", updatedModel.assignedFunction);
          }
        });
      }
    });
  };

  // Test pricing function
  const handleTestPricing = async (model: PricingModel) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      let result = 0;
      
      // Check if model has assignedFunction (from database schema)
      const assignedFunction = (model as any).assignedFunction;
      
      if (assignedFunction === 'getTopazUpscale') {
        result = getTopazUpscale(testParams.base, testParams.multiplier, testParams.upscaleFactor);
      } else if (assignedFunction === 'getSeedance15') {
        result = getSeedance15(
          testParams.base, 
          testParams.multiplier, 
          testParams.resolution, 
          testParams.audio, 
          testParams.duration
        );
      } else if (assignedFunction === 'getNanoBananaPrice') {
        result = getNanoBananaPrice(testParams.base, testParams.multiplier, testParams.quality);
      } else {
        // Fallback to model type detection
        if (model.modelType === 'video') {
          result = getSeedance15(
            testParams.base, 
            testParams.multiplier, 
            testParams.resolution, 
            testParams.audio, 
            testParams.duration
          );
        } else {
          result = getNanoBananaPrice(testParams.base, testParams.multiplier, testParams.quality);
        }
      }
      
      setTestResult(result);
    } catch (error) {
      console.error('Testing failed:', error);
      setTestResult(null);
    } finally {
      setIsTesting(false);
    }
  };

  const toggleFavorite = (modelId: string) => {
    // Check if model exists in current models list
    const model = models?.find(m => m.modelId === modelId);
    
    if (!model) {
      alert(`Model "${modelId}" not found in current data. Please refresh and try again.`);
      setActiveDropdown(null);
      return;
    }
    
    const modelName = model.modelName || modelId;
    const isCurrentlyFavorite = favoriteModels.has(modelId);
    
    setFavoriteModels(prev => {
      const newFavorites = new Set(prev);
      if (newFavorites.has(modelId)) {
        newFavorites.delete(modelId);
      } else {
        newFavorites.add(modelId);
      }
      return newFavorites;
    });
    
    setActiveDropdown(null);
  };

  const handleDelete = async (modelId: string) => {
    // Find the model in current models list to get the _id
    const model = models?.find(m => m.modelId === modelId);
    
    if (!model) {
      alert(`Model "${modelId}" not found in current data. Please refresh and try again.`);
      setActiveDropdown(null);
      return;
    }
    
    const modelName = model.modelName || modelId;
    const convexId = model._id; // Use the Convex _id directly
    
    if (confirm(`Are you sure you want to delete "${modelName}"? This action cannot be undone.`)) {
      // Call delete API with the _id instead of modelId
      const success = await deleteModel(convexId);
      
      if (success) {
        // Optionally show success message
        alert(`"${modelName}" has been deleted successfully.`);
      } else {
        alert(`Failed to delete "${modelName}". Please try again.`);
      }
    }
    
    setActiveDropdown(null);
  };

  // Close dropdown when clicking outside and handle fixed positioning
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside dropdown and dropdown buttons
      const isDropdownClick = (event.target as Element).closest('.dropdown-menu, .dropdown-btn');
      const isDebugButton = (event.target as Element).closest('[class*="dropdown"]');
      
      if (activeDropdown && !isDropdownClick && !isDebugButton) {
        setActiveDropdown(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeDropdown]);

  // Store dropdown position for fixed positioning
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; right: number } | null>(null);

  // Calculate dropdown position when active
  useEffect(() => {
    if (activeDropdown) {
      const button = document.querySelector(`[data-dropdown-btn="${activeDropdown}"]`) as HTMLElement;
      
      if (button) {
        const rect = button.getBoundingClientRect();
        setDropdownPosition({
          top: rect.bottom + window.scrollY + 4,
          right: window.innerWidth - rect.right
        });
      } else {
        setDropdownPosition(null);
      }
    } else {
      setDropdownPosition(null);
    }
  }, [activeDropdown]);

  const filteredModels = models?.filter(model => {
    // Apply search filter
    const matchesSearch = model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.modelId.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Apply pricing type filter
    const matchesPricingType = filters.pricingType === 'all' || model.pricingType === filters.pricingType;
    
    // Apply status filter
    const matchesStatus = filters.status === 'all' || 
                         (filters.status === 'active' && model.isActive) ||
                         (filters.status === 'inactive' && !model.isActive);
    
    // Apply model type filter
    const matchesModelType = filters.modelType === 'all' || model.modelType === filters.modelType;
    
    // Apply favorite filter
    const matchesFavorite = !filters.favorite || favoriteModels.has(model.modelId);
    
    return matchesSearch && matchesPricingType && matchesStatus && matchesModelType && matchesFavorite;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-(--bg-primary) text-(--text-primary) flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-(--accent-blue) border-t-(--accent-blue-hover) rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-(--text-tertiary)">Loading pricing models...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-(--bg-primary) p-8">

      {/* Header with Add Button and View Toggle */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-(--text-primary)">Pricing Models</h2>
          <p className="text-(--text-tertiary) text-sm">Configure pricing for different AI models</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Testing Panel Toggle */}
          <button
            onClick={() => setShowTestingPanel(!showTestingPanel)}
            className={`px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${
              showTestingPanel 
                ? 'bg-(--accent-purple)/20 text-(--accent-purple) border border-(--accent-purple)/30' 
                : 'bg-(--bg-tertiary) text-(--text-secondary) hover:text-(--text-primary) border border-(--border-primary)'
            }`}
            title="Toggle Testing Parameters Panel"
          >
            <Calculator className="w-6 h-6" />
            {showTestingPanel ? 'Hide Testing' : 'Show Testing'}
          </button>
          
          {/* View Toggle */}
          <div className="flex items-center bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-1">
            <button
              onClick={() => setViewMode('table')}
              className={`p-2 rounded-xl transition-all duration-200 ${
                viewMode === 'table' 
                  ? 'bg-(--accent-blue) text-(--text-primary)' 
                  : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'
              }`}
              title="Table View"
            >
              <Table2 className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 rounded-xl transition-all duration-200 ${
                viewMode === 'grid' 
                  ? 'bg-(--accent-blue) text-(--text-primary)' 
                  : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('card')}
              className={`p-2 rounded transition-colors ${
                viewMode === 'card' 
                  ? 'bg-[#4A90E2] text-white' 
                  : 'text-gray-400 hover:text-white hover:bg-[#2C2C2C]'
              }`}
              title="Card View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
          <button
            onClick={() => setShowResetConfirm(true)}
            className="bg-(--bg-tertiary) hover:bg-(--bg-primary) text-(--accent-orange) hover:text-(--accent-orange-hover) font-medium py-3 px-4 rounded-xl flex items-center gap-2 transition-all duration-200 border border-(--accent-orange)/30"
            title="Reset all pricing models to factory defaults"
          >
            <RotateCcw className="w-4 h-4" />
            Reset to Default
          </button>
          <button 
            onClick={() => {
              setSelectedModel(null);
              setFormData({});
              setIsEditing(true);
            }}
            className="bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-(--text-primary) font-semibold py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            Add New Model
          </button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="w-full">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
            <input
              type="text"
              placeholder="Search pricing models..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-(--bg-secondary) border border-(--border-primary) rounded-xl pl-10 pr-4 py-3 text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="bg-(--bg-tertiary) hover:bg-(--bg-primary) text-(--text-secondary) font-medium py-3 px-4 rounded-xl transition-all duration-200 flex items-center"
            >
              <Filter className="w-5 h-5 mr-2" />
              <span className="hidden sm:inline">Filters</span>
              <span className="sm:hidden">Filter</span>
            </button>
            
            {/* Filter Dropdown */}
            {showFilters && (
              <div className="absolute top-full mt-2 left-0 w-72 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-lg z-50">
                <div className="p-4 space-y-4">
                  {/* Pricing Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-2">Pricing Type</label>
                    <select 
                      value={filters.pricingType}
                      onChange={(e) => setFilters({...filters, pricingType: e.target.value})}
                      className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="fixed">Fixed Price</option>
                      <option value="formula">Formula Based</option>
                    </select>
                  </div>

                  {/* Status Filter */}
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-2">Status</label>
                    <select 
                      value={filters.status}
                      onChange={(e) => setFilters({...filters, status: e.target.value})}
                      className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                    >
                      <option value="all">All Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>

                  {/* Model Type Filter */}
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-2">Type</label>
                    <select 
                      value={filters.modelType}
                      onChange={(e) => setFilters({...filters, modelType: e.target.value})}
                      className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                    >
                      <option value="all">All Types</option>
                      <option value="image">Image</option>
                      <option value="video">Video</option>
                    </select>
                  </div>

                  {/* Favorite Filter */}
                  <div>
                    <label className="flex items-center gap-2 text-sm font-medium text-(--text-secondary) cursor-pointer">
                      <input 
                        type="checkbox"
                        checked={filters.favorite}
                        onChange={(e) => setFilters({...filters, favorite: e.target.checked})}
                        className="w-4 h-4 bg-(--bg-tertiary) border border-(--border-primary) rounded focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                      />
                      Show only favorites
                    </label>
                  </div>

                  {/* Clear Filters */}
                  <div className="pt-2 border-t border-(--border-primary)">
                    <button 
                      onClick={() => setFilters({ pricingType: 'all', status: 'all', modelType: 'all', favorite: false })}
                      className="w-full bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-(--text-primary) font-medium py-2 px-4 rounded-xl transition-all duration-200"
                    >
                      Clear Filters
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Models Display - Different Views */}
      {viewMode === 'table' && (
        <div className="bg-(--bg-secondary) rounded-xl border border-(--border-primary)">
          <div className="overflow-x-auto">
            <div className="max-h-[600px] overflow-y-auto">
              <table className="w-full min-w-[800px]">
          <thead>
            <tr className="border-b border-(--border-primary) bg-(--bg-tertiary)">
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Model Name</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Model ID</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Pricing Type</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Cost</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-primary)">
            {filteredModels.map((model) => (
              <tr key={model._id} className="hover:bg-(--bg-tertiary) transition-all duration-200">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="w-8 h-8 bg-(--accent-blue)/20 rounded-xl flex items-center justify-center mr-3">
                      <DollarSign className="w-4 h-4 text-(--accent-blue)" />
                    </div>
                    <div className="flex items-center gap-2">
                      {favoriteModels.has(model.modelId) && (
                        <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      )}
                      <div>
                        <div className="text-sm font-medium text-(--text-primary)">{model.modelName}</div>
                        <div className="text-xs text-(--text-tertiary)">{model.modelId}</div>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border bg-black/20 text-white border-black/30">
                    <code className="text-xs font-medium">{model.modelId}</code>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border ${
                    model.modelType === 'image' 
                      ? 'bg-(--accent-teal)/20 text-(--accent-teal) border-(--accent-teal)/40' 
                      : 'bg-(--accent-blue)/20 text-(--accent-blue) border-(--accent-blue)/40'
                  }`}>
                    {model.modelType === 'image' ? <Image className="w-3.5 h-3.5 mr-1.5" /> : <Film className="w-3.5 h-3.5 mr-1.5" />}
                    <span className="font-medium">{model.modelType}</span>
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    model.pricingType === 'fixed' 
                      ? 'bg-(--accent-blue)/20 text-(--accent-blue)' 
                      : 'bg-(--accent-teal)/20 text-(--accent-teal)'
                  }`}>
                    {model.pricingType === 'fixed' ? '💰' : '📊'} {model.pricingType}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => {
                      toggleModelActive(model.modelId);
                    }}
                    className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer hover:scale-105 ${
                      model.isActive 
                        ? 'bg-(--color-success)/20 text-(--color-success) border-(--color-success)/40 hover:bg-(--color-success)/30' 
                        : 'bg-(--bg-tertiary) text-(--text-tertiary) border-(--border-primary) hover:bg-(--bg-primary) hover:text-(--text-secondary)'
                    }`}
                    title={`Click to ${model.isActive ? 'deactivate' : 'activate'} model`}
                  >
                    {model.isActive ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Circle className="w-3.5 h-3.5 mr-1.5" />}
                    <span className="font-medium">{model.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-(--text-tertiary)">
                  {model.pricingType === 'fixed' 
                    ? `${model.creditCost} credits` 
                    : 'Formula'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-(--text-tertiary)">
                  {model.pricingType === 'fixed' 
                    ? `${getFixedPrice(Number(model.creditCost || 0), Number(model.factor || 1.3))} credits` 
                    : 'Variable'
                  }
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex items-center justify-end gap-2">
                    {/* Test Pricing Button */}
                    {model.pricingType === 'formula' && (
                      <button 
                        onClick={() => handleTestPricing(model)} 
                        disabled={isTesting}
                        className="text-(--accent-purple) hover:text-(--text-primary) p-1 rounded-xl hover:bg-(--accent-purple)/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Test Pricing Formula"
                      >
                        {isTesting ? (
                          <div className="w-4 h-4 border-2 border-(--accent-purple) border-t-transparent rounded-full animate-spin" />
                        ) : (
                          <Calculator className="w-6 h-6" />
                        )}
                      </button>
                    )}
                    <button 
                      onClick={() => { setSelectedModel(model); setFormData(model); setIsEditing(true); }} 
                      className="text-(--accent-blue) hover:text-(--text-primary) p-1 rounded-xl hover:bg-(--accent-blue)/20 transition-all duration-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <div className="relative dropdown-menu">
                      <button 
                        data-dropdown-btn={model._id}
                        onClick={() => setActiveDropdown(activeDropdown === model._id ? null : model._id)}
                        className="text-(--text-secondary) hover:text-(--text-primary) p-1 rounded-xl hover:bg-(--bg-tertiary) transition-all duration-200"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
            </div>
          </div>
        </div>
      )}

      {/* Grid View */}
      {viewMode === 'grid' && (
        <div className="max-h-[600px] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredModels.map((model) => (
            <div key={model._id} className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-6 hover:border-(--accent-blue) transition-all duration-200">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {favoriteModels.has(model.modelId) && (
                    <Star className="w-4 h-4 text-yellow-400 fill-current" />
                  )}
                  <div>
                    <h3 className="text-white font-medium">{model.modelName}</h3>
                    <p className="text-gray-500 text-sm">{model.modelId}</p>
                  </div>
                </div>
                <button 
                  data-dropdown-btn={model._id}
                  onClick={() => setActiveDropdown(activeDropdown === model._id ? null : model._id)}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-400/20 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-(--text-secondary) text-sm">Type</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                    model.modelType === 'image' 
                      ? 'bg-(--accent-teal)/20 text-(--accent-teal) border-(--accent-teal)/40' 
                      : 'bg-(--accent-blue)/20 text-(--accent-blue) border-(--accent-blue)/40'
                  }`}>
                    {model.modelType === 'image' ? <Image className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                    <span>{model.modelType}</span>
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Pricing</span>
                  <span className="text-white text-sm">{model.pricingType}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-(--text-secondary) text-sm">Status</span>
                  <button
                    onClick={() => {
                      toggleModelActive(model.modelId);
                    }}
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer hover:scale-105 ${
                      model.isActive 
                        ? 'bg-(--color-success)/20 text-(--color-success) border-(--color-success)/40 hover:bg-(--color-success)/30' 
                        : 'bg-(--bg-tertiary) text-(--text-tertiary) border-(--border-primary) hover:bg-(--bg-primary) hover:text-(--text-secondary)'
                    }`}
                    title={`Click to ${model.isActive ? 'deactivate' : 'activate'} model`}
                  >
                    {model.isActive ? <Check className="w-3.5 h-3.5 mr-1.5" /> : <Circle className="w-3.5 h-3.5 mr-1.5" />}
                    <span className="font-medium">{model.isActive ? 'Active' : 'Inactive'}</span>
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400 text-sm">Cost</span>
                  <span className="text-white text-sm">
                    {model.pricingType === 'fixed' 
                      ? `${model.creditCost} credits` 
                      : 'Formula'
                    }
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-2 mt-4 pt-4 border-t border-(--border-primary)">
                <button
                  onClick={() => {
                    setSelectedModel(model);
                    setFormData(model);
                    setIsEditing(true);
                    setActiveDropdown(null);
                  }}
                  className="flex-1 bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-(--text-primary) text-sm py-2 px-3 rounded-xl transition-all duration-200"
                >
                  Edit
                </button>
                <button
                  onClick={() => {
                    toggleModelActive(model.modelId);
                    fetchModels(); // Refetch data to reflect changes
                    setActiveDropdown(null);
                  }}
                  className={`p-2 rounded hover:bg-opacity-20 transition-colors ${
                    model.isActive 
                      ? 'text-red-400 hover:text-white hover:bg-red-400/20' 
                      : 'text-green-400 hover:text-white hover:bg-green-400/20'
                  }`}
                  title={model.isActive ? 'Deactivate Model' : 'Activate Model'}
                >
                  <Power className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Card View */}
      {viewMode === 'card' && (
        <div className="max-h-[600px] overflow-y-auto">
          <div className="space-y-4">
          {filteredModels.map((model) => (
            <div key={model._id} className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-6 hover:border-(--accent-blue) transition-all duration-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  {favoriteModels.has(model.modelId) && (
                    <Star className="w-5 h-5 text-yellow-400 fill-current" />
                  )}
                  <div>
                    <h3 className="text-white text-lg font-medium">{model.modelName}</h3>
                    <p className="text-gray-500">{model.modelId}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-4 text-sm">
                    <button
                      onClick={() => {
                        toggleModelActive(model.modelId);
                      }}
                      className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border transition-all duration-200 cursor-pointer hover:scale-105 ${
                        model.isActive 
                          ? 'bg-(--color-success)/20 text-(--color-success) border-(--color-success)/40 hover:bg-(--color-success)/30' 
                          : 'bg-(--bg-tertiary) text-(--text-tertiary) border-(--border-primary) hover:bg-(--bg-primary) hover:text-(--text-secondary)'
                      }`}
                      title={`Click to ${model.isActive ? 'deactivate' : 'activate'} model`}
                    >
                      {model.isActive ? <Check className="w-3 h-3 mr-1" /> : <Circle className="w-3 h-3 mr-1" />}
                      <span className="font-medium">{model.isActive ? 'Active' : 'Inactive'}</span>
                    </button>
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                      model.modelType === 'image' 
                        ? 'bg-(--accent-teal)/20 text-(--accent-teal) border-(--accent-teal)/40' 
                        : 'bg-(--accent-blue)/20 text-(--accent-blue) border-(--accent-blue)/40'
                    }`}>
                      {model.modelType === 'image' ? <Image className="w-3 h-3 mr-1" /> : <Film className="w-3 h-3 mr-1" />}
                      <span>{model.modelType}</span>
                    </span>
                    <span className="text-white">{model.pricingType}</span>
                    <span className="text-white">
                    {model.pricingType === 'fixed' 
                      ? `${model.creditCost} credits`
                      : 'Formula'
                    }
                  </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedModel(model);
                        setFormData(model);
                        setIsEditing(true);
                        setActiveDropdown(null);
                      }}
                      className="bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-(--text-primary) text-sm py-2 px-4 rounded-xl transition-all duration-200"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        toggleModelActive(model.modelId);
                        fetchModels(); // Refetch data to reflect changes
                        setActiveDropdown(null);
                      }}
                      className={`p-2 rounded hover:bg-opacity-20 transition-colors ${
                        model.isActive 
                          ? 'text-red-400 hover:text-white hover:bg-red-400/20' 
                          : 'text-green-400 hover:text-white hover:bg-green-400/20'
                      }`}
                      title={model.isActive ? 'Deactivate Model' : 'Activate Model'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button 
                      data-dropdown-btn={model._id}
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent event bubbling
                        setActiveDropdown(activeDropdown === model._id ? null : model._id);
                      }}
                      className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-400/20 transition-colors dropdown-btn"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
          </div>
        </div>
      )}

      {/* Fixed Dropdown - Outside all containers */}
      {activeDropdown && dropdownPosition && (
        <div 
          className="fixed bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-lg z-9999 dropdown-menu"
          style={{
            top: `${dropdownPosition.top}px`,
            right: `${dropdownPosition.right}px`,
            minWidth: '192px'
          }}
        >
          <button
            onClick={() => {
              const model = models?.find(m => m._id === activeDropdown);
              if (model) {
                toggleFavorite(model.modelId);
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--accent-yellow) transition-all duration-200"
          >
            <Star className={`w-4 h-4 ${models?.find(m => m._id === activeDropdown && favoriteModels.has(m.modelId)) ? 'text-yellow-400 fill-current' : ''}`} />
            {models?.find(m => m._id === activeDropdown && favoriteModels.has(m.modelId)) ? 'Remove from Favorites' : 'Add to Favorites'}
          </button>
          <button
            onClick={() => {
              const model = models?.find(m => m._id === activeDropdown);
              if (model) {
                handleDelete(model.modelId);
              }
            }}
            className="w-full flex items-center gap-2 px-4 py-2 text-left text-sm text-(--text-secondary) hover:bg-(--bg-tertiary) hover:text-(--accent-red) transition-all duration-200"
          >
            <Trash2 className="w-4 h-4" />
            Delete Model
          </button>
        </div>
      )}

      {/* Empty State */}
      {filteredModels.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-(--bg-tertiary) rounded-full flex items-center justify-center mx-auto mb-4">
            <DollarSign className="w-8 h-8 text-(--text-tertiary)" />
          </div>
          <h3 className="text-lg font-medium text-(--text-primary) mb-2">No models found</h3>
          <p className="text-gray-400 mb-4">Get started by creating your first pricing model</p>
          <button 
            onClick={() => {
              setSelectedModel(null);
              setFormData({});
              setIsEditing(true);
            }}
            className="bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-(--text-primary) font-semibold py-2 px-4 rounded-xl transition-all duration-200"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Model
          </button>
          </div>
        
      )}

      {/* Reset to Defaults Confirmation Modal */}
      {showResetConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowResetConfirm(false)} />
          <div className="relative bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-2xl p-6 w-full max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-(--accent-orange)/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-(--accent-orange)" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-lg">Reset to Factory Defaults</h3>
                <p className="text-gray-400 text-sm">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-gray-300 text-sm mb-2">
              This will <span className="text-orange-400 font-medium">delete all current pricing models</span> and restore the 10 default models:
            </p>
            <ul className="text-xs text-gray-400 space-y-1 mb-5 ml-4 list-disc">
              <li>Nano Banana 2 (formula)</li>
              <li>Seedance 1.5 Pro (formula)</li>
              <li>Flux 2 Pro, Character Edit, 1.5 Text to Image (fixed)</li>
              <li>Nano Banana Edit, Image to Image, Flex Text to Image (fixed)</li>
              <li>Crisp Upscale (fixed), Image Upscale (formula)</li>
            </ul>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowResetConfirm(false)}
                disabled={isResetting}
                className="px-4 py-2 text-(--text-secondary) border border-(--border-primary) rounded-xl hover:bg-(--bg-tertiary) transition-all duration-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleReset}
                disabled={isResetting}
                className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center gap-2 disabled:opacity-60"
              >
                {isResetting ? (
                  <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Resetting...</>
                ) : (
                  <><RotateCcw className="w-4 h-4" /> Yes, Reset</>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Testing Panel */}
      {testResult !== null && (
        <div className="fixed bottom-4 right-4 bg-(--bg-secondary) border border-(--accent-blue) rounded-xl p-4 shadow-2xl max-w-sm">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-lg font-semibold text-(--text-primary)">Test Result</h3>
            <button 
              onClick={() => setTestResult(null)}
              className="text-(--text-tertiary) hover:text-(--text-primary) p-1 rounded-xl hover:bg-(--bg-tertiary) transition-all duration-200"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="bg-(--bg-tertiary) rounded-xl p-3">
            <div className="text-2xl font-bold text-(--accent-blue) mb-1">{testResult} credits</div>
            <div className="text-xs text-(--text-tertiary)">
              Base: {testParams.base} × Multiplier: {testParams.multiplier}
              {testParams.quality && ` × Quality: ${testParams.quality}`}
              {testParams.resolution && ` × Resolution: ${testParams.resolution}`}
              {testParams.audio && ` × Audio: ${testParams.audio ? 'Yes' : 'No'}`}
              {testParams.duration && ` × Duration: ${testParams.duration}s`}
              {testParams.upscaleFactor && ` × Upscale: ${testParams.upscaleFactor}`}
            </div>
          </div>
        </div>
      )}

      {/* Testing Parameters Panel */}
      {showTestingPanel && (
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-(--text-primary)">Testing Parameters</h3>
            <button 
              onClick={() => setShowTestingPanel(false)}
              className="text-(--text-tertiary) hover:text-(--text-primary) p-1 rounded-xl hover:bg-(--bg-tertiary) transition-all duration-200"
              title="Hide Testing Panel"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">Base Cost</label>
            <input 
              type="number" 
              value={testParams.base}
              onChange={(e) => setTestParams({...testParams, base: Number(e.target.value)})}
              className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              min="1"
              step="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">Multiplier</label>
            <input 
              type="number" 
              value={testParams.multiplier}
              onChange={(e) => setTestParams({...testParams, multiplier: Number(e.target.value)})}
              className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
              min="0.1"
              step="0.1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">Quality</label>
            <select 
              value={testParams.quality}
              onChange={(e) => setTestParams({...testParams, quality: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
            >
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">Resolution</label>
            <select 
              value={testParams.resolution}
              onChange={(e) => setTestParams({...testParams, resolution: e.target.value})}
              className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2]"
            >
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4K">4K</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Duration (seconds)</label>
            <input 
              type="number" 
              value={testParams.duration}
              onChange={(e) => setTestParams({...testParams, duration: Number(e.target.value)})}
              className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
              min="1"
              step="1"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Upscale Factor</label>
            <select 
              value={testParams.upscaleFactor}
              onChange={(e) => setTestParams({...testParams, upscaleFactor: e.target.value})}
              className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
            >
              <option value="1x">1x</option>
              <option value="2x">2x</option>
              <option value="4x">4x</option>
            </select>
          </div>
        </div>
        <div className="flex items-center gap-4 mt-4">
          <label className="flex items-center text-sm text-gray-300">
            <input 
              type="checkbox" 
              checked={testParams.audio}
              onChange={(e) => setTestParams({...testParams, audio: e.target.checked})}
              className="w-4 h-4 bg-(--bg-tertiary) border border-(--border-primary) rounded focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
            />
            Include Audio
          </label>
          <div className="text-xs text-gray-500">
            Click the 📈 button on any formula model to test pricing
          </div>
        </div>
      </div>
      )}

      {isEditing && (
        <DarkEditModal
          model={selectedModel}
          formData={formData}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          setFormData={setFormData}
        />
      )}
    </div>
  );
}

function DarkEditModal({ model, formData, onSave, onCancel, setFormData }) {
  const [errors, setErrors] = useState({});
  const pricingType = formData.pricingType || 'fixed';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl w-full max-w-2xl shadow-2xl">
        {/* Header */}
        <div className="px-6 py-4 border-b border-(--border-primary)">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-(--text-primary)">{model ? 'Edit Pricing Model' : 'Create Pricing Model'}</h2>
            <button 
              onClick={onCancel}
              className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-(--bg-tertiary) transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Model Name and ID */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Name</label>
              <input 
                type="text" 
                value={formData.modelName || ''} 
                onChange={(e) => setFormData({...formData, modelName: e.target.value})} 
                className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent" 
                placeholder="e.g., Nano Banana 2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model ID</label>
              <input 
                type="text" 
                value={formData.modelId || ''} 
                onChange={(e) => setFormData({...formData, modelId: e.target.value})} 
                className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent" 
                placeholder="e.g., nano-banana-2"
              />
            </div>
          </div>

          {/* Model Type and Pricing Type */}
          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Model Type</label>
              <select 
                value={formData.modelType || ''} 
                onChange={(e) => setFormData({...formData, modelType: e.target.value as 'image' | 'video'})} 
                className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
              >
                <option value="">Select Type</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Pricing Type</label>
              <select 
                value={pricingType} 
                onChange={(e) => setFormData({...formData, pricingType: e.target.value as 'fixed' | 'formula'})} 
                className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
              >
                <option value="fixed">Fixed Price</option>
                <option value="formula">Formula Based</option>
              </select>
            </div>
          </div>

          {/* Pricing Details */}
          {pricingType === 'fixed' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-(--text-primary) mb-4">Pricing Details</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Credit Cost</label>
                  <input 
                    type="number" 
                    value={formData.creditCost || ''} 
                    onChange={(e) => setFormData({...formData, creditCost: Number(e.target.value)})} 
                    className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent" 
                    placeholder="e.g., 8"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Multiplier</label>
                  <input 
                    type="number" 
                    value={formData.factor || ''} 
                    onChange={(e) => setFormData({...formData, factor: Number(e.target.value)})} 
                    className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent" 
                    placeholder="e.g., 1.0"
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Formula Configuration */}
          {pricingType === 'formula' && (
            <div className="space-y-6">
              <h3 className="text-lg font-medium text-(--text-primary) mb-4">Base Pricing</h3>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Base Credit Cost</label>
                  <input 
                    type="number" 
                    value={formData.creditCost || ''} 
                    onChange={(e) => setFormData({...formData, creditCost: Number(e.target.value)})} 
                    className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent" 
                    placeholder="e.g., 8"
                    min="1"
                    step="0.1"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">Multiplier</label>
                  <input 
                    type="number" 
                    value={formData.factor || ''} 
                    onChange={(e) => setFormData({...formData, factor: Number(e.target.value)})} 
                    className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent" 
                    placeholder="e.g., 1.3"
                    min="0.1"
                    step="0.1"
                  />
                </div>
              </div>

              {/* Function Assignment */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Assigned Function</label>
                <select 
                  value={formData.assignedFunction || ''} 
                  onChange={(e) => setFormData({...formData, assignedFunction: e.target.value})} 
                  className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-3 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                >
                  <option value="">Select Function (Optional)</option>
                  <option value="getNanoBananaPrice">getNanoBananaPrice - Image Generation</option>
                  <option value="getSeedance15">getSeedance15 - Video Generation</option>
                  <option value="getTopazUpscale">getTopazUpscale - AI Upscaling</option>
                </select>
                <p className="text-xs text-gray-500 mt-2">Assign a specific pricing function. If not set, will auto-detect based on model type.</p>
              </div>
              
              <h3 className="text-lg font-medium text-white mb-4">Formula Configuration</h3>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Formula JSON</label>
                <textarea 
                  rows={6}
                  value={formData.formulaJson || ''} 
                  onChange={(e) => setFormData({...formData, formulaJson: e.target.value})} 
                  className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-4 py-3 text-white placeholder-gray-500 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent resize-none" 
                  placeholder='{"base_cost": 8, "qualities": [{"name": "1K", "cost": 8}]}'
                />
                <p className="text-xs text-gray-500 mt-2">Enter JSON formula configuration for quality-based pricing</p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-4 pt-6 border-t border-[#3D3D3D]">
            <button 
              type="button" 
              onClick={onCancel} 
              className="px-6 py-3 border border-[#3D3D3D] text-gray-300 font-medium rounded-lg hover:bg-[#3D3D3D] transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-6 py-3 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-medium rounded-lg transition-colors shadow-lg"
            >
              {model ? 'Save Changes' : 'Create Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
