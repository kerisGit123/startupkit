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
  Music,
  Check,
  Circle,
  Key,
  Eye,
  EyeOff,
  Shield,
  Mic
} from "lucide-react";
import { usePricingData } from "../shared/usePricingData";
import {
  type PricingModel,
  getFixedPrice,
  getGptImagePrice,
  getFormulaQualityPrice,
  getNanoBananaPrice,
  getTopazUpscale,
  getTopazVideoUpscale,
  getSeedance15,
  getSeedance20,
  getSeedance20Fast,
  getKlingMotionControl,
  getGrokImageToVideo,
  getInfinitalkFromAudio,
  getElevenLabsTTS,
} from "@/lib/storyboard/pricing";

interface Analytics {
  totalRevenue: number;
  totalUsage: number;
  avgCost: number;
  activeModels: number;
  usageByModel: Record<string, number>;
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
  const [activeTab, setActiveTab] = useState<'models' | 'testing' | 'kie' | 'strategy'>('models');
  const [modelCategoryTab, setModelCategoryTab] = useState<'all' | 'image' | 'video' | 'audio' | 'text'>('all');
  // KIE AI key management state
  const [kieKeys, setKieKeys] = useState<Array<{ _id: string; name: string; apiKey: string; isDefault: boolean; isActive: boolean; createdAt: number; updatedAt: number }>>([]);
  const [kieLoading, setKieLoading] = useState(false);
  const [showKieModal, setShowKieModal] = useState(false);
  const [editingKieKey, setEditingKieKey] = useState<any>(null);
  const [kieForm, setKieForm] = useState({ name: '', apiKey: '', isDefault: false });
  const [kieVisibleKeys, setKieVisibleKeys] = useState<Set<string>>(new Set());
  const [openStrategySections, setOpenStrategySections] = useState<Set<string>>(new Set(['multiplier']));
  const toggleStrategySection = (key: string) => {
    setOpenStrategySections(prev => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  };
  const [filters, setFilters] = useState({
    pricingType: 'all',
    status: 'all',
    modelType: 'all',
    favorite: false
  });
  
  const { models, getAnalytics: analytics, loading, error, saveModel, toggleModelActive, deleteModel, resetToDefaults, fetchPricingModels: fetchModels } = usePricingData();
  const [isResetting, setIsResetting] = useState(false);
  
  const [showPricingOverview, setShowPricingOverview] = useState(false);
  const [testModelTab, setTestModelTab] = useState<'image' | 'video' | 'audio'>('image');
  // Testing state - Updated to be model-focused
  const [testParams, setTestParams] = useState({
    modelId: 'nano-banana-2', // Default model
    quality: '2K',
    resolution: '720p',
    audio: false,
    duration: 5,
    upscaleFactor: '2x',
    inputVideoDuration: 0, // For Seedance 2.0: input video duration in seconds
    characterCount: 1000, // For ElevenLabs TTS: character count
  });
  const [testResult, setTestResult] = useState<number | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [showTestingPanel, setShowTestingPanel] = useState(false);

  const handleReset = async () => {
    setIsResetting(true);
    await resetToDefaults();
    setIsResetting(false);
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
    
    saveModel(apiData, { isEdit: !!selectedModel }).then(result => {
      if (result.success) {
        // Models are automatically refetched by the hook after save
        // Update local state with what we sent
        setSelectedModel({ ...selectedModel, ...apiData } as PricingModel);
        setFormData({
          modelId: data.modelId,
          modelName: data.modelName,
          modelType: data.modelType,
          isActive: data.isActive,
          pricingType: data.pricingType,
          creditCost: data.creditCost,
          factor: data.factor,
          formulaJson: data.formulaJson,
          assignedFunction: data.assignedFunction,
        });
      }
    });
  };

  // Test pricing function (Updated to use model's actual costs)
  // ─── KIE AI Key Management ──────────────────────────────────────────────────
  const fetchKieKeys = async () => {
    setKieLoading(true);
    try {
      const res = await fetch('/api/storyboard/pricing/kie');
      if (res.ok) setKieKeys(await res.json());
    } catch (e) { console.error('Failed to fetch KIE keys:', e); }
    finally { setKieLoading(false); }
  };

  const handleSaveKieKey = async () => {
    try {
      if (editingKieKey) {
        await fetch('/api/storyboard/pricing/kie', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: editingKieKey._id, ...kieForm }),
        });
      } else {
        await fetch('/api/storyboard/pricing/kie', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(kieForm),
        });
      }
      setShowKieModal(false);
      setEditingKieKey(null);
      setKieForm({ name: '', apiKey: '', isDefault: false });
      fetchKieKeys();
    } catch (e) { console.error('Failed to save KIE key:', e); }
  };

  const handleDeleteKieKey = async (id: string) => {
    if (!confirm('Delete this API key? This cannot be undone.')) return;
    try {
      await fetch('/api/storyboard/pricing/kie', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      fetchKieKeys();
    } catch (e) { console.error('Failed to delete KIE key:', e); }
  };

  const handleToggleKieDefault = async (id: string) => {
    try {
      await fetch('/api/storyboard/pricing/kie', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isDefault: true }),
      });
      fetchKieKeys();
    } catch (e) { console.error('Failed to set default:', e); }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return '••••••••';
    return '••••••••' + key.slice(-4);
  };

  const handleTestPricing = async (model: PricingModel) => {
    setIsTesting(true);
    setTestResult(null);
    
    try {
      let result = 0;
      
      // Use the model's actual base cost and factor from database
      const baseCost = model.creditCost || 0;
      const factor = model.factor || 1.3;
      const formulaPrice = getFormulaQualityPrice(model.formulaJson, factor, testParams.quality, baseCost);
      
      // Check if model has assignedFunction (from database schema)
      const assignedFunction = (model as any).assignedFunction;
      
      if (assignedFunction === 'getTopazUpscale') {
        result = formulaPrice;
      } else if (assignedFunction === 'getSeedance15') {
        result = getSeedance15(
          baseCost, 
          factor, 
          testParams.resolution, 
          testParams.audio, 
          testParams.duration
        );
      } else if (assignedFunction === 'getNanoBananaPrice') {
        result = formulaPrice;
      } else if (assignedFunction === 'getGptImagePrice') {
        result = formulaPrice;
      } else if (assignedFunction === 'getVeo31') {
        result = formulaPrice;
      } else if (assignedFunction === 'getKlingMotionControl') {
        result = getKlingMotionControl(
          baseCost,
          factor,
          testParams.resolution,
          testParams.duration
        );
      } else if (assignedFunction === 'getSeedance20' || assignedFunction === 'getSeedance20Fast') {
        // Use formulaJson from DB for flexible pricing
        const totalDur = testParams.audio ? (testParams.inputVideoDuration + testParams.duration) : testParams.duration;
        if (model.formulaJson) {
          try {
            const formula = JSON.parse(model.formulaJson);
            const resolutions = formula.pricing?.resolutions;
            const resKey = Object.keys(resolutions || {}).find(
              k => k.toLowerCase() === testParams.resolution.toLowerCase()
            ) || testParams.resolution;
            const resCost = resolutions?.[resKey];
            const costPerSec = resCost
              ? (testParams.audio ? resCost.video_input : resCost.no_video)
              : baseCost;
            result = Math.ceil(costPerSec * totalDur * factor);
          } catch (e) {
            // Fallback to hardcoded function
            if (assignedFunction === 'getSeedance20') {
              result = getSeedance20(baseCost, factor, testParams.resolution, testParams.audio, totalDur);
            } else {
              result = getSeedance20Fast(baseCost, factor, testParams.resolution, testParams.audio, totalDur);
            }
          }
        } else {
          if (assignedFunction === 'getSeedance20') {
            result = getSeedance20(baseCost, factor, testParams.resolution, testParams.audio, totalDur);
          } else {
            result = getSeedance20Fast(baseCost, factor, testParams.resolution, testParams.audio, totalDur);
          }
        }
      } else if (assignedFunction === 'getGrokImageToVideo') {
        result = getGrokImageToVideo(
          baseCost,
          factor,
          testParams.resolution,
          testParams.duration
        );
      } else if (assignedFunction === 'getTopazVideoUpscale') {
        result = getTopazVideoUpscale(
          baseCost,
          factor,
          testParams.quality,
          testParams.duration
        );
      } else if (assignedFunction === 'getInfinitalkFromAudio') {
        result = getInfinitalkFromAudio(
          baseCost,
          factor,
          testParams.resolution,
          testParams.duration
        );
      } else if (assignedFunction === 'getElevenLabsTTS') {
        result = getElevenLabsTTS(
          baseCost,
          factor,
          testParams.characterCount || 1000
        );
      } else {
        // Fallback to model type detection
        if (model.modelType === 'video') {
          result = getSeedance15(
            baseCost, 
            factor, 
            testParams.resolution, 
            testParams.audio, 
            testParams.duration
          );
        } else {
          result = formulaPrice;
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
      const success = await deleteModel(convexId ?? '');
      
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
    
    // Apply model type filter (from dropdown)
    const matchesModelType = filters.modelType === 'all' || model.modelType === filters.modelType;

    // Apply category tab filter
    const matchesCategoryTab = modelCategoryTab === 'all' ||
      (modelCategoryTab === 'audio' ? (model.modelType === 'audio' || (model.modelType as string) === 'music') : model.modelType === modelCategoryTab);
    
    // Apply favorite filter
    const matchesFavorite = !filters.favorite || favoriteModels.has(model.modelId);
    
    return matchesSearch && matchesPricingType && matchesStatus && matchesModelType && matchesCategoryTab && matchesFavorite;
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
            onClick={() => {
              if (window.confirm('Reset all pricing models to factory defaults? This will overwrite current pricing data.')) {
                handleReset();
              }
            }}
            disabled={isResetting}
            className="bg-(--bg-tertiary) hover:bg-(--bg-primary) text-(--text-secondary) font-medium py-3 px-4 rounded-xl flex items-center gap-2 transition-all duration-200 border border-(--accent-orange)/30"
            title="Reset all pricing models to factory defaults"
          >
            <RotateCcw className="w-4 h-4" />
            {isResetting ? 'Resetting...' : 'Reset to Default'}
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

      {/* Tab Navigation */}
      <div className="flex items-center bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-1 mb-6">
        <button
          onClick={() => setActiveTab('models')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            activeTab === 'models' 
              ? 'bg-(--accent-blue) text-(--text-primary)' 
              : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Models
        </button>
        <button
          onClick={() => setActiveTab('testing')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            activeTab === 'testing' 
              ? 'bg-(--accent-purple) text-(--text-primary)' 
              : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'
          }`}
        >
          <Calculator className="w-4 h-4" />
          Testing
        </button>
        <button
          onClick={() => setActiveTab('strategy')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            activeTab === 'strategy'
              ? 'bg-amber-600 text-(--text-primary)'
              : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'
          }`}
        >
          <Star className="w-4 h-4" />
          Strategy
        </button>
        <button
          onClick={() => { setActiveTab('kie'); fetchKieKeys(); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all duration-200 ${
            activeTab === 'kie'
              ? 'bg-emerald-600 text-(--text-primary)'
              : 'text-(--text-secondary) hover:text-(--text-primary) hover:bg-(--bg-tertiary)'
          }`}
        >
          <Key className="w-4 h-4" />
          KIE AI
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'models' && (
        <>
          {/* Search + Filters + Category Tabs — Single Row */}
          <div className="flex items-center gap-3 mb-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-(--text-tertiary)" />
              <input
                type="text"
                placeholder="Search models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-(--bg-secondary) border border-(--border-primary) rounded-xl pl-10 pr-4 py-2.5 text-sm text-(--text-primary) placeholder-(--text-tertiary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
              />
            </div>

            {/* Category Tabs */}
            <div className="flex gap-1 bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-1 shrink-0">
              {([
                { key: 'all' as const, label: 'All', icon: undefined },
                { key: 'image' as const, label: 'Image', icon: Image },
                { key: 'video' as const, label: 'Video', icon: Film },
                { key: 'audio' as const, label: 'Audio', icon: Mic },
              ]).map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  onClick={() => setModelCategoryTab(key)}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    modelCategoryTab === key
                      ? 'bg-(--accent-blue) text-(--text-primary)'
                      : 'text-(--text-tertiary) hover:text-(--text-secondary) hover:bg-(--bg-tertiary)'
                  }`}
                >
                  {Icon && <Icon className="w-3 h-3" />}
                  {label}
                  <span className="opacity-60 ml-0.5">
                    ({models?.filter(m => key === 'all' ? true : key === 'audio' ? (m.modelType === 'audio' || (m.modelType as string) === 'music') : m.modelType === key).length || 0})
                  </span>
                </button>
              ))}
            </div>

            {/* Filter Button */}
            <div className="relative shrink-0">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="bg-(--bg-tertiary) hover:bg-(--bg-primary) text-(--text-secondary) font-medium py-2.5 px-3 rounded-xl transition-all flex items-center text-sm"
              >
                <Filter className="w-4 h-4 mr-1.5" />
                Filters
              </button>

              {showFilters && (
                <div className="absolute top-full mt-2 right-0 w-72 bg-(--bg-secondary) border border-(--border-primary) rounded-xl shadow-lg z-50">
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-2">Pricing Type</label>
                      <select value={filters.pricingType} onChange={(e) => setFilters({...filters, pricingType: e.target.value})}
                        className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent">
                        <option value="all">All Types</option>
                        <option value="fixed">Fixed Price</option>
                        <option value="formula">Formula Based</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-2">Status</label>
                      <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})}
                        className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent">
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="inactive">Inactive</option>
                      </select>
                    </div>
                    <div>
                      <label className="flex items-center gap-2 text-sm font-medium text-(--text-secondary) cursor-pointer">
                        <input type="checkbox" checked={filters.favorite} onChange={(e) => setFilters({...filters, favorite: e.target.checked})}
                          className="w-4 h-4 bg-(--bg-tertiary) border border-(--border-primary) rounded" />
                        Show only favorites
                      </label>
                    </div>
                    <div className="pt-2 border-t border-(--border-primary)">
                      <button onClick={() => setFilters({ pricingType: 'all', status: 'all', modelType: 'all', favorite: false })}
                        className="w-full bg-(--accent-blue) hover:bg-(--accent-blue-hover) text-(--text-primary) font-medium py-2 px-4 rounded-xl transition-all">
                        Clear Filters
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
              <th className="px-4 py-4 text-center text-xs font-semibold text-amber-500 uppercase tracking-wider">Strategy</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Cost</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Price</th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-(--text-tertiary) uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-(--border-primary)">
            {filteredModels.map((model, index) => (
              <tr key={`${model.modelId}-${model._id || index}`} className="hover:bg-(--bg-tertiary) transition-all duration-200">
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
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                    (model.modelType as string) === 'music'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      : model.modelType === 'audio'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : model.modelType === 'image'
                      ? 'bg-(--accent-teal)/20 text-(--accent-teal) border-(--accent-teal)/40'
                      : 'bg-(--accent-blue)/20 text-(--accent-blue) border-(--accent-blue)/40'
                  }`}>
                    {(model.modelType as string) === 'music' ? <Music className="w-3.5 h-3.5 mr-1.5" /> : model.modelType === 'audio' ? <Mic className="w-3.5 h-3.5 mr-1.5" /> : model.modelType === 'image' ? <Image className="w-3.5 h-3.5 mr-1.5" /> : <Film className="w-3.5 h-3.5 mr-1.5" />}
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
                  {(model as any).visibility === 'temp_down' && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 ml-2">
                      <EyeOff className="w-3 h-3" />
                      Dev
                    </span>
                  )}
                </td>
                <td className="px-4 py-4 whitespace-nowrap text-center">
                  {(model as any).isHot ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30">
                      <Star className="w-3 h-3" />
                      Hot
                    </span>
                  ) : (
                    <span className="text-xs text-(--text-tertiary)">—</span>
                  )}
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
                        onClick={() => setActiveDropdown(activeDropdown === model._id ? null : model._id ?? null)}
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
          {filteredModels.map((model, index) => (
            <div key={`${model.modelId}-${model._id || index}`} className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-6 hover:border-(--accent-blue) transition-all duration-200">
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
                  onClick={() => setActiveDropdown(activeDropdown === model._id ? null : model._id ?? null)}
                  className="text-gray-400 hover:text-white p-1 rounded hover:bg-gray-400/20 transition-colors"
                >
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
              
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-(--text-secondary) text-sm">Type</span>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold border ${
                    (model.modelType as string) === 'music'
                      ? 'bg-purple-500/20 text-purple-400 border-purple-500/40'
                      : model.modelType === 'audio'
                      ? 'bg-blue-500/20 text-blue-400 border-blue-500/40'
                      : model.modelType === 'image'
                      ? 'bg-(--accent-teal)/20 text-(--accent-teal) border-(--accent-teal)/40'
                      : 'bg-(--accent-blue)/20 text-(--accent-blue) border-(--accent-blue)/40'
                  }`}>
                    {(model.modelType as string) === 'music' ? <Music className="w-3.5 h-3.5 mr-1.5" /> : model.modelType === 'audio' ? <Mic className="w-3.5 h-3.5 mr-1.5" /> : model.modelType === 'image' ? <Image className="w-3.5 h-3.5 mr-1.5" /> : <Film className="w-3.5 h-3.5 mr-1.5" />}
                    <span className="font-medium">{model.modelType}</span>
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
          {filteredModels.map((model, index) => (
            <div key={`${model.modelId}-${model._id || index}`} className="bg-(--bg-secondary) rounded-xl border border-(--border-primary) p-6 hover:border-(--accent-blue) transition-all duration-200">
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
                  <div className="text-xs text-(--text-tertiary)">
                    {model.pricingType === 'fixed' 
                      ? `${model.creditCost} credits` 
                      : 'Formula'
                    }
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
                        setActiveDropdown(activeDropdown === model._id ? null : model._id ?? null);
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
          <p className="text-gray-400 text-sm mb-4">Get started by creating your first pricing model</p>
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
        </>
      )}

      {/* Testing Tab */}
      {activeTab === 'testing' && (
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-(--text-primary)">Testing Parameters</h3>
            <div className="text-xs text-(--text-tertiary)">
              Test pricing calculations for different models and parameters
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1">Select Model</label>
              <select 
                value={testParams.modelId}
                onChange={(e) => {
                  const newModelId = e.target.value;
                  const newModel = models?.find(m => m.modelId === newModelId);
                  const fn = (newModel as any)?.assignedFunction;
                  // Reset resolution and duration to valid defaults for the selected model
                  const defaultRes = fn === 'getKlingMotionControl' ? '720p' : fn === 'getSeedance20' ? '480p' : fn === 'getGrokImageToVideo' ? '480p' : '720p';
                  const defaultDur = fn === 'getGrokImageToVideo' ? 6 : fn === 'getTopazVideoUpscale' ? 10 : fn === 'getInfinitalkFromAudio' ? 10 : 4;
                  const defaultQuality = fn === 'getTopazVideoUpscale' ? '2' : '1K';
                  setTestParams({...testParams, modelId: newModelId, resolution: defaultRes, duration: defaultDur, audio: false, quality: defaultQuality});
                }}
                className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
              >
                {models?.map((model, index) => (
                  <option key={`${model.modelId}-${index}`} value={model.modelId}>
                    {model.modelName} ({model.modelId})
                  </option>
                ))}
              </select>
            </div>
            
            {/* Show Quality/Resolution/Fixed based on model type */}
            {(() => {
              const testModel = models?.find(m => m.modelId === testParams.modelId);
              const isFixedPrice = testModel?.pricingType === 'fixed' || (!testModel?.formulaJson && testModel?.modelType === 'image');

              if (isFixedPrice) {
                return (
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-1">Price</label>
                    <div className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary)">
                      {testModel?.creditCost ?? 1} credits (fixed)
                    </div>
                  </div>
                );
              }

              if (testModel?.modelType === 'image') {
                return (
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-1">Quality</label>
                    <select
                      value={testParams.quality}
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTestParams({...testParams, quality: e.target.value})}
                      className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                    >
                      {(() => {
                        if (!testModel?.formulaJson) return null;
                        try {
                          const formula = JSON.parse(testModel.formulaJson);
                          const qualities = formula.pricing?.qualities ?? [];
                          return qualities.map((q: { name: string }) => (
                            <option key={q.name} value={q.name}>{q.name}</option>
                          ));
                        } catch { return null; }
                      })()}
                    </select>
                  </div>
                );
              }

              // Video models — handled below
              return null;
            })()}

            {/* Show Resolution for video models */}
            {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'video' && (
              <>
                {/* Check if it's Veo 3.1 model */}
                {models?.find(m => m.modelId === testParams.modelId)?.assignedFunction === 'getTopazVideoUpscale' ? (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-1">Upscale Factor</label>
                      <select
                        value={testParams.quality}
                        onChange={(e) => setTestParams({...testParams, quality: e.target.value})}
                        className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                      >
                        <option value="1">1x (8 cr/s)</option>
                        <option value="2">2x (8 cr/s)</option>
                        <option value="4">4x (14 cr/s)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-1">Video Duration (seconds)</label>
                      <select
                        value={testParams.duration}
                        onChange={(e) => setTestParams({...testParams, duration: Number(e.target.value)})}
                        className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                      >
                        {[5, 10, 15, 20, 30, 45, 60, 90, 120].map(d => (
                          <option key={d} value={d}>{d} seconds</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : models?.find(m => m.modelId === testParams.modelId)?.assignedFunction === 'getVeo31' ? (
                  <div>
                    <label className="block text-sm font-medium text-(--text-secondary) mb-1">Quality</label>
                    <select
                      value={testParams.quality}
                      onChange={(e) => setTestParams({...testParams, quality: e.target.value})}
                      className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                    >
                      <option value="fast">Fast</option>
                      <option value="quality">Quality</option>
                    </select>
                  </div>
                ) : (
                  <>
                    {/* Resolution dropdown — model-specific options */}
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-1">Resolution</label>
                      <select
                        value={testParams.resolution}
                        onChange={(e) => setTestParams({...testParams, resolution: e.target.value})}
                        className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                      >
                        {(() => {
                          const fn = models?.find(m => m.modelId === testParams.modelId)?.assignedFunction;
                          if (fn === 'getKlingMotionControl') {
                            return (<><option value="720p">720p</option><option value="1080p">1080p</option></>);
                          } else if (fn === 'getSeedance20' || fn === 'getSeedance20Fast' || fn === 'getGrokImageToVideo' || fn === 'getInfinitalkFromAudio') {
                            return (<><option value="480p">480p</option><option value="720p">720p</option></>);
                          } else {
                            return (<><option value="480p">480p</option><option value="720p">720p</option><option value="1080p">1080p</option><option value="4K">4K</option></>);
                          }
                        })()}
                      </select>
                    </div>

                    {/* Duration */}
                    <div>
                      <label className="block text-sm font-medium text-(--text-secondary) mb-1">Duration (seconds)</label>
                      <select
                        value={testParams.duration}
                        onChange={(e) => setTestParams({...testParams, duration: Number(e.target.value)})}
                        className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                      >
                        {(() => {
                          const fn = models?.find(m => m.modelId === testParams.modelId)?.assignedFunction;
                          if (fn === 'getSeedance20' || fn === 'getSeedance20Fast') {
                            return Array.from({ length: 12 }, (_, i) => (
                              <option key={i + 4} value={i + 4}>{i + 4} seconds</option>
                            ));
                          }
                          if (fn === 'getGrokImageToVideo') {
                            return Array.from({ length: 25 }, (_, i) => (
                              <option key={i + 6} value={i + 6}>{i + 6} seconds</option>
                            ));
                          }
                          return [4, 5, 8, 10, 12, 15, 20].map(d => (
                            <option key={d} value={d}>{d} seconds</option>
                          ));
                        })()}
                      </select>
                    </div>

                    {/* Audio/Video input checkbox — hide for Kling, label changes for Seedance 2.0 */}
                    {(() => {
                      const fn = models?.find(m => m.modelId === testParams.modelId)?.assignedFunction;
                      if (fn === 'getKlingMotionControl') return null; // No audio option for Kling
                      return (
                        <div>
                          <label className="flex items-center gap-2 text-sm text-(--text-secondary) mb-1">
                            <input
                              type="checkbox"
                              checked={testParams.audio}
                              onChange={(e) => setTestParams({...testParams, audio: e.target.checked})}
                              className="w-4 h-4 bg-(--bg-tertiary) border border-(--border-primary) rounded focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                            />
                            {(fn === 'getSeedance20' || fn === 'getSeedance20Fast') ? 'Include Video Input' : 'Include Audio'}
                          </label>
                        </div>
                      );
                    })()}

                    {/* Input Video Duration — only for Seedance 2.0 models when video input is enabled */}
                    {(() => {
                      const fn = models?.find(m => m.modelId === testParams.modelId)?.assignedFunction;
                      if ((fn === 'getSeedance20' || fn === 'getSeedance20Fast') && testParams.audio) {
                        return (
                          <div>
                            <label className="block text-sm font-medium text-(--text-secondary) mb-1">Input Video Duration</label>
                            <select
                              value={testParams.inputVideoDuration}
                              onChange={(e) => setTestParams({...testParams, inputVideoDuration: Number(e.target.value)})}
                              className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                            >
                              <option value="0">No video (images only)</option>
                              <option value="4">4s input video</option>
                              <option value="6">6s input video</option>
                              <option value="8">8s input video</option>
                              <option value="10">10s input video</option>
                              <option value="12">12s input video</option>
                              <option value="14">14s input video</option>
                              <option value="15">15s input video</option>
                            </select>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </>
                )}
              </>
            )}

            {/* Character count for audio/TTS models */}
            {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'audio' && (
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1">Character Count</label>
                <select
                  value={testParams.characterCount || 1000}
                  onChange={(e) => setTestParams({...testParams, characterCount: Number(e.target.value)})}
                  className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                >
                  <option value="500">500 characters (1 block = 12 cr)</option>
                  <option value="1000">1,000 characters (1 block = 12 cr)</option>
                  <option value="1200">1,200 characters (2 blocks = 24 cr)</option>
                  <option value="2000">2,000 characters (2 blocks = 24 cr)</option>
                  <option value="2200">2,200 characters (3 blocks = 36 cr)</option>
                  <option value="3000">3,000 characters (3 blocks = 36 cr)</option>
                  <option value="4000">4,000 characters (4 blocks = 48 cr)</option>
                  <option value="5000">5,000 characters (5 blocks = 60 cr)</option>
                </select>
                <p className="text-xs text-(--text-tertiary) mt-1">12 credits per 1,000-character block (rounded up)</p>
              </div>
            )}
          </div>

          {/* Model Information Display */}
          <div className="bg-(--bg-tertiary) rounded-xl p-4 mb-6 border border-(--border-primary) mt-6">
            <h4 className="text-sm font-medium text-(--text-primary) mb-2">Selected Model Information</h4>
            <div className="text-xs text-(--text-tertiary) space-y-1">
              {models?.find(m => m.modelId === testParams.modelId) && (
                <>
                  <div><strong>Model:</strong> {models.find(m => m.modelId === testParams.modelId)?.modelName}</div>
                  <div><strong>Type:</strong> {models.find(m => m.modelId === testParams.modelId)?.modelType}</div>
                  <div><strong>Pricing:</strong> {models.find(m => m.modelId === testParams.modelId)?.pricingType}</div>
                  <div><strong>Base Cost:</strong> {models.find(m => m.modelId === testParams.modelId)?.creditCost} credits</div>
                  <div><strong>Factor:</strong> {models.find(m => m.modelId === testParams.modelId)?.factor}</div>
                  {models.find(m => m.modelId === testParams.modelId)?.assignedFunction && (
                    <div><strong>Function:</strong> {models.find(m => m.modelId === testParams.modelId)?.assignedFunction}</div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Calculator Button */}
          <div className="flex items-center gap-4 mt-6">
            <button
              onClick={() => {
                const selectedModel = models?.find(m => m.modelId === testParams.modelId);
                if (selectedModel) {
                  handleTestPricing(selectedModel);
                }
              }}
              className="bg-(--accent-purple) hover:bg-(--accent-purple-hover) text-(--text-primary) font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg"
              disabled={isTesting}
            >
              {isTesting ? (
                <><div className="w-4 h-4 border-2 border-(--accent-purple) border-t-transparent rounded-full animate-spin" /> Calculating...</>
              ) : (
                <><Calculator className="w-5 h-5" /> Calculate Credits</>
              )}
            </button>
            <div className="text-xs text-(--text-tertiary)">
              Click to calculate credits for selected model with current parameters
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
              Model: {testParams.modelId}
              {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'image' && testParams.quality && ` × Quality: ${testParams.quality}`}
              {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'video' && testParams.resolution && ` × Resolution: ${testParams.resolution}`}
              {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'video' && testParams.audio && ` × Audio: ${testParams.audio ? 'Yes' : 'No'}`}
              {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'video' && testParams.duration && ` × Duration: ${testParams.duration}s`}
            </div>
            <div className="text-xs text-(--accent-purple) mt-2">
              Using model's configured base cost and factor
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
        {/* Model Type Tabs */}
        <div className="flex gap-1 mb-4 bg-(--bg-tertiary) rounded-xl p-1 w-fit">
          {([
            { key: 'image', label: 'Image', icon: Image },
            { key: 'video', label: 'Video', icon: Film },
            { key: 'audio', label: 'Audio', icon: Mic },
          ] as const).map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => {
                setTestModelTab(key);
                const firstModel = models?.find(m =>
                  key === 'audio' ? (m.modelType === 'audio' || (m.modelType as string) === 'music') : m.modelType === key
                );
                if (firstModel) setTestParams(p => ({ ...p, modelId: firstModel.modelId }));
              }}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium transition-all ${
                testModelTab === key
                  ? 'bg-(--bg-primary) text-(--text-primary) shadow-sm'
                  : 'text-(--text-tertiary) hover:text-(--text-secondary)'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-(--text-secondary) mb-1">Select Model</label>
            <select
              value={testParams.modelId}
              onChange={(e) => setTestParams({...testParams, modelId: e.target.value})}
              className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
            >
              {models?.filter(m =>
                testModelTab === 'audio' ? (m.modelType === 'audio' || (m.modelType as string) === 'music') : m.modelType === testModelTab
              ).map((model, index) => (
                <option key={`${model.modelId}-${index}`} value={model.modelId}>
                  {model.modelName} ({model.modelId})
                </option>
              ))}
            </select>
          </div>
          {/* Show Quality for formula image models, Resolution for video models, Fixed price for fixed models */}
          {(() => {
            const testModel = models?.find(m => m.modelId === testParams.modelId);
            const isFixedPrice = testModel?.pricingType === 'fixed' || (!testModel?.formulaJson && testModel?.modelType === 'image');

            if (isFixedPrice) {
              return (
                <div>
                  <label className="block text-sm font-medium text-(--text-secondary) mb-1">Price</label>
                  <div className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary)">
                {models?.find(m => m.modelId === testParams.modelId)?.creditCost ?? 1} credits (fixed)
              </div>
            </div>
              );
            }

            if (testModel?.modelType === 'video') {
              return (
                <div>
                  <label className="block text-sm font-medium text-(--text-secondary) mb-1">Resolution</label>
                  <select
                    value={testParams.resolution}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTestParams({...testParams, resolution: e.target.value})}
                    className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                  >
                    <option value="480p">480p</option>
                    <option value="720p">720p</option>
                    <option value="1080p">1080p</option>
                    <option value="4K">4K</option>
                  </select>
                </div>
              );
            }

            // Formula-based image models — show quality dropdown
            return (
              <div>
                <label className="block text-sm font-medium text-(--text-secondary) mb-1">Quality</label>
                <select
                  value={testParams.quality}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setTestParams({...testParams, quality: e.target.value})}
                  className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                >
                  {(() => {
                    if (!testModel?.formulaJson) return null;
                    try {
                      const formula = JSON.parse(testModel.formulaJson);
                      const qualities = formula.pricing?.qualities ?? [];
                      return qualities.map((q: { name: string }) => (
                        <option key={q.name} value={q.name}>{q.name}</option>
                      ));
                    } catch { return null; }
                  })()}
                </select>
              </div>
            );
          })()}
          {/* Show Duration for video models only */}
          {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'video' && (
            <div>
              <label className="block text-sm font-medium text-(--text-secondary) mb-1">Duration (seconds)</label>
              <input 
                type="number" 
                value={testParams.duration}
                onChange={(e) => setTestParams({...testParams, duration: Number(e.target.value)})}
                className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                min="1"
                step="1"
              />
            </div>
          )}
          {/* Show Audio/Video Input toggle for video models only */}
          {models?.find(m => m.modelId === testParams.modelId)?.modelType === 'video' && (
            <div>
              <label className="flex items-center gap-2 text-sm text-(--text-secondary) mb-1">
                <input
                  type="checkbox"
                  checked={testParams.audio}
                  onChange={(e) => setTestParams({...testParams, audio: e.target.checked})}
                  className="w-4 h-4 bg-(--bg-tertiary) border border-(--border-primary) rounded focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                />
                {(() => {
                  const fn = (models?.find(m => m.modelId === testParams.modelId) as any)?.assignedFunction;
                  return (fn === 'getSeedance20' || fn === 'getSeedance20Fast') ? 'Include Video Input' : 'Include Audio';
                })()}
              </label>
            </div>
          )}
          {/* Input Video Duration for Seedance models */}
          {(() => {
            const fn = (models?.find(m => m.modelId === testParams.modelId) as any)?.assignedFunction;
            if ((fn === 'getSeedance20' || fn === 'getSeedance20Fast') && testParams.audio) {
              return (
                <div>
                  <label className="block text-sm font-medium text-(--text-secondary) mb-1">Input Video Duration</label>
                  <select
                    value={testParams.inputVideoDuration}
                    onChange={(e) => setTestParams({...testParams, inputVideoDuration: Number(e.target.value)})}
                    className="w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-xl px-3 py-2 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent"
                  >
                    <option value="0">No video (images only)</option>
                    <option value="4">4s input video</option>
                    <option value="6">6s input video</option>
                    <option value="8">8s input video</option>
                    <option value="10">10s input video</option>
                    <option value="12">12s input video</option>
                    <option value="14">14s input video</option>
                    <option value="15">15s input video</option>
                  </select>
                </div>
              );
            }
            return null;
          })()}
        </div>
        
        {/* Pricing Breakdown for Selected Model */}
        {(() => {
          const sel = models?.find(m => m.modelId === testParams.modelId);
          if (!sel?.creditCost || !sel?.factor) return null;
          const baseCost = sel.creditCost;
          const factor = sel.factor;
          const userCr = Math.ceil(baseCost * factor);
          const kieCost = baseCost * 0.005;
          const userPays = userCr * 0.01;
          const margin = ((1 - kieCost / userPays) * 100);
          return (
            <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl p-4 mb-4">
              <h4 className="text-sm font-semibold text-blue-400 mb-3 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Pricing Breakdown — {sel.modelName}
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-3">
                <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                  <div className="text-xs text-(--text-tertiary)">Kie Base Cost</div>
                  <div className="text-lg font-bold text-(--text-primary)">{baseCost}</div>
                  <div className="text-xs text-red-400">${kieCost.toFixed(4)}</div>
                </div>
                <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                  <div className="text-xs text-(--text-tertiary)">Multiplier</div>
                  <div className="text-lg font-bold text-(--text-primary)">{factor}</div>
                  <div className="text-xs text-(--text-tertiary)">{factor === 0.625 ? 'Recommended' : factor === 1.2 ? 'Old (switch to 0.625)' : ''}</div>
                </div>
                <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                  <div className="text-xs text-(--text-tertiary)">User Charged</div>
                  <div className="text-lg font-bold text-amber-400">{userCr} cr</div>
                  <div className="text-xs text-emerald-400">${userPays.toFixed(2)}</div>
                </div>
                <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                  <div className="text-xs text-(--text-tertiary)">Margin</div>
                  <div className={`text-lg font-bold ${margin >= 20 ? 'text-emerald-400' : 'text-red-400'}`}>{margin.toFixed(0)}%</div>
                  <div className="text-xs text-emerald-300">+${(userPays - kieCost).toFixed(4)}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-xs text-(--text-tertiary)">
                <span>Type: {sel.modelType}</span>
                <span>Pricing: {sel.pricingType}</span>
                {sel.assignedFunction && <span>Fn: {sel.assignedFunction}</span>}
                {(sel as any).visibility === 'temp_down' && (
                  <span className="text-amber-400 flex items-center gap-1"><EyeOff className="w-3 h-3" /> Admin only</span>
                )}
              </div>
            </div>
          );
        })()}

        {/* Calculator + Pricing Overview Buttons */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              const selectedModel = models?.find(m => m.modelId === testParams.modelId);
              if (selectedModel) {
                handleTestPricing(selectedModel);
              }
            }}
            className="bg-(--accent-purple) hover:bg-(--accent-purple-hover) text-(--text-primary) font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg"
            disabled={isTesting}
          >
            {isTesting ? (
              <>
                <div className="w-4 h-4 border-2 border-(--accent-purple) border-t-transparent rounded-full animate-spin" />
                Calculating...
              </>
            ) : (
              <>
                <Calculator className="w-5 h-5" />
                Calculate Credits
              </>
            )}
          </button>
          <button
            onClick={() => setShowPricingOverview(true)}
            className="bg-amber-600 hover:bg-amber-700 text-white font-medium py-3 px-6 rounded-xl flex items-center gap-2 transition-all duration-200 shadow-lg"
          >
            <DollarSign className="w-5 h-5" />
            Pricing Overview
          </button>
          <div className="text-xs text-(--text-tertiary)">
            Click to calculate credits for selected model with current parameters
          </div>
        </div>
      </div>
      )}

      {/* ─── Strategy Pricing Tab ─── */}
      {activeTab === 'strategy' && (
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl p-6 space-y-3">
          {/* Header */}
          <div className="mb-2">
            <h3 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
              <Star className="w-5 h-5 text-amber-400" />
              Pricing Strategy — 5 Hot Models
            </h3>
            <p className="text-sm text-(--text-tertiary) mt-1">Why we price this way, how the math works, and competitive positioning.</p>
          </div>

          {/* Accordion: Why 0.625 */}
          <div className="bg-blue-950/30 border border-blue-500/30 rounded-xl overflow-hidden">
            <button onClick={() => toggleStrategySection('multiplier')} className="w-full flex items-center justify-between p-4 text-left hover:bg-blue-500/5 transition-colors">
              <h4 className="text-sm font-bold text-blue-400">Why 0.625 Multiplier?</h4>
              <ChevronDown className={`w-4 h-4 text-blue-400 transition-transform ${openStrategySections.has('multiplier') ? 'rotate-180' : ''}`} />
            </button>
            {openStrategySections.has('multiplier') && (
              <div className="px-4 pb-4 text-sm text-(--text-secondary) space-y-2">
                <p>We buy Kie credits at <span className="text-white font-semibold">$0.005/credit</span> ($5 = 1,000 Kie credits).</p>
                <p>We sell user credits at <span className="text-white font-semibold">$0.01/credit</span> ($10 = 1,000 user credits).</p>
                <p>Our credits are <span className="text-amber-400 font-semibold">2x more expensive</span> than Kie credits.</p>
                <p>To achieve ~20% profit margin on every generation:</p>
                <div className="bg-(--bg-tertiary) rounded-lg p-3 font-mono text-amber-400 text-sm mt-2">
                  user_credits = ceil(kie_credits x 0.625)
                </div>
                <p className="text-xs text-(--text-tertiary) mt-2">Old multiplier was 1.2 (user paid MORE Kie credits than actual cost = ~20% markup ON TOP of Kie cost, resulting in overcharging). 0.625 correctly converts between the two credit systems while maintaining margin.</p>
              </div>
            )}
          </div>

          {/* Accordion: Competitive Analysis */}
          <div className="bg-rose-950/20 border border-rose-500/30 rounded-xl overflow-hidden">
            <button onClick={() => toggleStrategySection('competitive')} className="w-full flex items-center justify-between p-4 text-left hover:bg-rose-500/5 transition-colors">
              <h4 className="text-sm font-bold text-rose-400">Why This Pricing? — Competitive Analysis</h4>
              <ChevronDown className={`w-4 h-4 text-rose-400 transition-transform ${openStrategySections.has('competitive') ? 'rotate-180' : ''}`} />
            </button>
            {openStrategySections.has('competitive') && (
              <div className="px-4 pb-4 text-sm text-(--text-secondary) space-y-2">
                <p><span className="text-white font-semibold">Higgsfield</span> (main competitor) charges <span className="text-red-400">$0.078/gen</span> for Nano Banana Pro at their $39/mo Plus plan (1,000 credits, 2 credits/gen = 500 gens).</p>
                <p>Our <span className="text-white font-semibold">Pro plan ($39.90/mo, 3,500 credits)</span> at 0.625 multiplier:</p>
                <div className="grid grid-cols-3 gap-3 mt-2">
                  <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                    <div className="text-xs text-(--text-tertiary)">GPT Image 2 (cheapest)</div>
                    <div className="text-xl font-bold text-emerald-400">$0.04</div>
                    <div className="text-xs text-emerald-300">48% cheaper than HF</div>
                  </div>
                  <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                    <div className="text-xs text-(--text-tertiary)">Nano Banana 2</div>
                    <div className="text-xl font-bold text-emerald-400">$0.05</div>
                    <div className="text-xs text-emerald-300">36% cheaper than HF</div>
                  </div>
                  <div className="bg-(--bg-tertiary) rounded-lg p-3 text-center">
                    <div className="text-xs text-(--text-tertiary)">Higgsfield NB Pro</div>
                    <div className="text-xl font-bold text-red-400">$0.078</div>
                    <div className="text-xs text-red-300">Their price</div>
                  </div>
                </div>
                <p className="mt-3 text-xs text-(--text-tertiary)">We also offer: free tier (HF starts at $5/mo), credits never expire (HF expires monthly + 90-day packs), model choice (HF forces NB Pro only), full studio platform.</p>
              </div>
            )}
          </div>

          {/* Two-column row: Credit Expiry + Plan Gens */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {/* Credit Expiry Policy */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl overflow-hidden">
              <button onClick={() => toggleStrategySection('expiry')} className="w-full flex items-center justify-between p-4 text-left hover:bg-emerald-500/5 transition-colors">
                <h4 className="text-sm font-bold text-emerald-400">Credit Expiry Policy</h4>
                <ChevronDown className={`w-4 h-4 text-emerald-400 transition-transform ${openStrategySections.has('expiry') ? 'rotate-180' : ''}`} />
              </button>
              {openStrategySections.has('expiry') && (
                <div className="px-4 pb-4">
                  <div className="text-sm text-(--text-secondary) space-y-1">
                    <div className="flex justify-between py-1 border-b border-(--border-primary)/30">
                      <span>Subscription credits (monthly grant)</span>
                      <span className="text-amber-400 font-medium">Expire monthly (clawback)</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-(--border-primary)/30">
                      <span>Purchased top-up credits ($10 packs)</span>
                      <span className="text-emerald-400 font-medium">Never expire</span>
                    </div>
                    <div className="flex justify-between py-1 border-b border-(--border-primary)/30">
                      <span>Transferred credits (to org)</span>
                      <span className="text-emerald-400 font-medium">Never expire</span>
                    </div>
                    <div className="flex justify-between py-1">
                      <span>Future promo credits</span>
                      <span className="text-blue-400 font-medium">1 year (planned, not built yet)</span>
                    </div>
                  </div>
                  <p className="text-xs text-(--text-tertiary) mt-3">We are the ONLY credit-based platform where purchased top-ups never expire. All competitors (Higgsfield, ImagineArt, Artlist, LTX) expire monthly.</p>
                </div>
              )}
            </div>

            {/* What Users Get Per Plan */}
            <div className="bg-(--bg-primary) border border-(--border-primary) rounded-xl overflow-hidden">
              <button onClick={() => toggleStrategySection('perplan')} className="w-full flex items-center justify-between p-4 text-left hover:bg-(--bg-tertiary)/50 transition-colors">
                <h4 className="text-sm font-bold text-(--text-primary)">What Users Get Per Plan (Image Gens)</h4>
                <ChevronDown className={`w-4 h-4 text-(--text-tertiary) transition-transform ${openStrategySections.has('perplan') ? 'rotate-180' : ''}`} />
              </button>
              {openStrategySections.has('perplan') && (
                <div className="px-4 pb-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-(--text-tertiary) border-b border-(--border-primary)">
                          <th className="text-left py-2 pr-3">Model</th>
                          <th className="text-right py-2 px-3">Free (50 cr)</th>
                          <th className="text-right py-2 px-3">Pro (3,500 cr)</th>
                          <th className="text-right py-2 px-3">Business (8,000 cr)</th>
                        </tr>
                      </thead>
                      <tbody className="text-(--text-secondary)">
                        {[
                          { model: "GPT Image 2 1K", cr: 4 },
                          { model: "Nano Banana 2 1K", cr: 5 },
                          { model: "Nano Banana Pro 1K", cr: 12 },
                          { model: "Seedance 1.5 Pro 480P 4s", cr: 5 },
                        ].map((row) => (
                          <tr key={row.model} className="border-b border-(--border-primary)/30">
                            <td className="py-1.5 pr-3 text-(--text-primary) font-medium">{row.model}</td>
                            <td className="text-right py-1.5 px-3">{Math.floor(50 / row.cr)} gens</td>
                            <td className="text-right py-1.5 px-3 text-emerald-400 font-semibold">{Math.floor(3500 / row.cr)} gens</td>
                            <td className="text-right py-1.5 px-3 text-blue-400 font-semibold">{Math.floor(8000 / row.cr)} gens</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Accordion: 5 Hot Models Breakdown */}
          <div className="bg-(--bg-primary) border border-amber-500/30 rounded-xl overflow-hidden">
            <button onClick={() => toggleStrategySection('breakdown')} className="w-full flex items-center justify-between p-4 text-left hover:bg-amber-500/5 transition-colors">
              <h4 className="text-sm font-bold text-amber-400">5 Hot Models — Pricing Breakdown</h4>
              <ChevronDown className={`w-4 h-4 text-amber-400 transition-transform ${openStrategySections.has('breakdown') ? 'rotate-180' : ''}`} />
            </button>
            {openStrategySections.has('breakdown') && (
              <div className="px-4 pb-4">
                <div className="overflow-auto max-h-[360px]">
                  <table className="w-full text-xs">
                    <thead className="sticky top-0 bg-(--bg-primary) z-10">
                      <tr className="text-(--text-tertiary) border-b border-(--border-primary)">
                        <th className="text-left py-2 pr-3">Model</th>
                        <th className="text-left py-2 px-2">Variant</th>
                        <th className="text-right py-2 px-2">Kie Cr</th>
                        <th className="text-right py-2 px-2">Our Cost</th>
                        <th className="text-right py-2 px-2">User Cr</th>
                        <th className="text-right py-2 px-2">User Pays</th>
                        <th className="text-right py-2 px-2">Profit</th>
                        <th className="text-right py-2 px-2">Margin</th>
                      </tr>
                    </thead>
                    <tbody className="text-(--text-secondary)">
                      {[
                        { model: "GPT Image 2", variant: "1K", kie: 6, note: "Cheapest image gen" },
                        { model: "GPT Image 2", variant: "2K", kie: 10, note: "" },
                        { model: "GPT Image 2", variant: "4K", kie: 16, note: "" },
                        { model: "Nano Banana 2", variant: "1K", kie: 8, note: "Fast drafts" },
                        { model: "Nano Banana 2", variant: "2K", kie: 12, note: "" },
                        { model: "Nano Banana 2", variant: "4K", kie: 18, note: "" },
                        { model: "Nano Banana Pro", variant: "1K/2K", kie: 18, note: "Quality finals" },
                        { model: "Nano Banana Pro", variant: "4K", kie: 24, note: "" },
                        { model: "Seedance 2 Fast", variant: "480P 5s img2vid", kie: 45, note: "Fast video" },
                        { model: "Seedance 2 Fast", variant: "720P 5s img2vid", kie: 100, note: "" },
                        { model: "Seedance 2.0", variant: "480P 5s img2vid", kie: 57.5, note: "Standard video" },
                        { model: "Seedance 2.0", variant: "720P 5s img2vid", kie: 125, note: "" },
                        { model: "Seedance 1.5 Pro", variant: "480P 4s", kie: 7, note: "Cheapest video" },
                        { model: "Seedance 1.5 Pro", variant: "720P 4s +audio", kie: 28, note: "Cinema + audio" },
                        { model: "Seedance 1.5 Pro", variant: "720P 8s +audio", kie: 56, note: "" },
                        { model: "Seedance 1.5 Pro", variant: "1080P 8s +audio", kie: 120, note: "" },
                      ].map((row) => {
                        const userCr = Math.ceil(row.kie * 0.625);
                        const kieCost = row.kie * 0.005;
                        const userPays = userCr * 0.01;
                        const profit = userPays - kieCost;
                        const margin = ((1 - kieCost / userPays) * 100);
                        return (
                          <tr key={`${row.model}-${row.variant}`} className="border-b border-(--border-primary)/30 hover:bg-(--bg-tertiary)/50">
                            <td className="py-1.5 pr-3 text-(--text-primary) font-medium">
                              {row.model}
                              {row.note && <span className="text-xs text-(--text-tertiary) ml-1">({row.note})</span>}
                            </td>
                            <td className="py-1.5 px-2 text-(--text-tertiary)">{row.variant}</td>
                            <td className="text-right py-1.5 px-2">{row.kie}</td>
                            <td className="text-right py-1.5 px-2 text-red-400">${kieCost.toFixed(3)}</td>
                            <td className="text-right py-1.5 px-2 text-amber-400 font-semibold">{userCr}</td>
                            <td className="text-right py-1.5 px-2 text-emerald-400">${userPays.toFixed(2)}</td>
                            <td className="text-right py-1.5 px-2 text-emerald-300">${profit.toFixed(3)}</td>
                            <td className="text-right py-1.5 px-2">
                              <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                margin >= 25 ? 'bg-emerald-500/20 text-emerald-400' : margin >= 20 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                              }`}>{margin.toFixed(0)}%</span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="mt-3 text-xs text-(--text-tertiary)">
                  Formula: user_credits = ceil(kie_credits x 0.625). Kie: $0.005/cr. User: $0.01/cr.
                </div>
              </div>
            )}
          </div>

          {/* Reminder — always visible */}
          <div className="bg-(--bg-tertiary) border border-(--border-primary) rounded-xl p-4 text-xs text-(--text-tertiary) space-y-1">
            <div><strong className="text-(--text-secondary)">Remember:</strong> Higgsfield has documented trust issues — credit theft, unlimited plan bait-and-switch, fake marketing, X account suspended. Our advantage is transparency and fairness.</div>
            <div><strong className="text-(--text-secondary)">Marketing message:</strong> <span className="text-amber-400 italic">&quot;Generate images from $0.04. Choose your model. Credits never expire. No tricks.&quot;</span></div>
            <div><strong className="text-(--text-secondary)">See full docs:</strong> plan_pricing_strategy.md, plan_document_Comparison.md</div>
          </div>
        </div>
      )}

      {/* ─── KIE AI Tab ─── */}
      {activeTab === 'kie' && (
        <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-bold text-(--text-primary) flex items-center gap-2">
                <Shield className="w-5 h-5 text-emerald-400" />
                KIE AI API Keys
              </h3>
              <p className="text-sm text-(--text-tertiary) mt-1">Manage API keys for KIE AI services. Only the default key is used for generation.</p>
            </div>
            <button
              onClick={() => {
                setEditingKieKey(null);
                setKieForm({ name: '', apiKey: '', isDefault: false });
                setShowKieModal(true);
              }}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium py-2 px-4 rounded-xl flex items-center gap-2 transition-all"
            >
              <Plus className="w-4 h-4" />
              Add New Key
            </button>
          </div>

          {kieLoading ? (
            <div className="text-center py-12 text-(--text-tertiary)">Loading...</div>
          ) : kieKeys.length === 0 ? (
            <div className="text-center py-12">
              <Key className="w-10 h-10 text-(--text-tertiary) mx-auto mb-3 opacity-50" />
              <p className="text-(--text-secondary) font-medium">No API Keys</p>
              <p className="text-sm text-(--text-tertiary) mt-1">Add a KIE AI API key to get started.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {kieKeys.map((key) => (
                <div
                  key={key._id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-all ${
                    key.isDefault
                      ? 'border-emerald-500/50 bg-emerald-500/5'
                      : 'border-(--border-primary) bg-(--bg-primary)'
                  }`}
                >
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${key.isDefault ? 'bg-emerald-600' : 'bg-(--bg-tertiary)'}`}>
                      <Key className={`w-5 h-5 ${key.isDefault ? 'text-white' : 'text-(--text-tertiary)'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-(--text-primary)">{key.name}</span>
                        {key.isDefault && (
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-600 text-white rounded-full font-medium">DEFAULT</span>
                        )}
                        {!key.isActive && (
                          <span className="text-[10px] px-2 py-0.5 bg-gray-600 text-gray-300 rounded-full font-medium">INACTIVE</span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <code className="text-xs text-(--text-tertiary) font-mono">
                          {kieVisibleKeys.has(key._id) ? key.apiKey : maskKey(key.apiKey)}
                        </code>
                        <button
                          onClick={() => {
                            const next = new Set(kieVisibleKeys);
                            if (next.has(key._id)) next.delete(key._id); else next.add(key._id);
                            setKieVisibleKeys(next);
                          }}
                          className="p-0.5 hover:bg-(--bg-tertiary) rounded transition-colors"
                          title={kieVisibleKeys.has(key._id) ? 'Hide key' : 'Show key'}
                        >
                          {kieVisibleKeys.has(key._id)
                            ? <EyeOff className="w-3.5 h-3.5 text-(--text-tertiary)" />
                            : <Eye className="w-3.5 h-3.5 text-(--text-tertiary)" />
                          }
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 ml-4">
                    {!key.isDefault && (
                      <button
                        onClick={() => handleToggleKieDefault(key._id)}
                        className="text-xs px-3 py-1.5 bg-(--bg-tertiary) hover:bg-emerald-600/20 text-(--text-secondary) hover:text-emerald-400 rounded-lg transition-colors"
                        title="Set as default"
                      >
                        Set Default
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setEditingKieKey(key);
                        setKieForm({ name: key.name, apiKey: key.apiKey, isDefault: key.isDefault });
                        setShowKieModal(true);
                      }}
                      className="p-2 hover:bg-(--bg-tertiary) rounded-lg transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4 text-(--text-secondary)" />
                    </button>
                    <button
                      onClick={() => handleDeleteKieKey(key._id)}
                      className="p-2 hover:bg-red-900/30 rounded-lg transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* KIE AI Add/Edit Modal */}
      {showKieModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-secondary) rounded-2xl border border-(--border-primary) w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-(--border-primary)">
              <h3 className="text-sm font-bold text-(--text-primary)">
                {editingKieKey ? 'Edit API Key' : 'Add New API Key'}
              </h3>
              <button onClick={() => { setShowKieModal(false); setEditingKieKey(null); }} className="p-1 hover:bg-(--bg-tertiary) rounded-xl">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">Name</label>
                <input
                  type="text"
                  value={kieForm.name}
                  onChange={(e) => setKieForm({ ...kieForm, name: e.target.value })}
                  className="w-full bg-(--bg-primary) border border-(--border-primary) rounded-xl px-4 py-3 text-(--text-primary) focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                  placeholder="e.g. Production Key"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">API Key</label>
                <div className="relative">
                  <input
                    type={kieVisibleKeys.has('modal') ? 'text' : 'password'}
                    value={kieForm.apiKey}
                    onChange={(e) => setKieForm({ ...kieForm, apiKey: e.target.value })}
                    className="w-full bg-(--bg-primary) border border-(--border-primary) rounded-xl px-4 py-3 pr-10 text-(--text-primary) font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/50"
                    placeholder="Enter KIE AI API key"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const next = new Set(kieVisibleKeys);
                      if (next.has('modal')) next.delete('modal'); else next.add('modal');
                      setKieVisibleKeys(next);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-(--bg-tertiary) rounded"
                  >
                    {kieVisibleKeys.has('modal')
                      ? <EyeOff className="w-4 h-4 text-(--text-tertiary)" />
                      : <Eye className="w-4 h-4 text-(--text-tertiary)" />
                    }
                  </button>
                </div>
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-300">
                  <input
                    type="checkbox"
                    checked={kieForm.isDefault}
                    onChange={(e) => setKieForm({ ...kieForm, isDefault: e.target.checked })}
                    className="w-4 h-4 rounded"
                  />
                  Set as Default Key
                </label>
                <p className="text-xs text-(--text-tertiary) mt-1 ml-6">The default key will be used for all AI generation requests.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleSaveKieKey}
                  disabled={!kieForm.name.trim() || !kieForm.apiKey.trim()}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium py-2.5 rounded-xl transition-colors"
                >
                  {editingKieKey ? 'Save Changes' : 'Add Key'}
                </button>
                <button
                  onClick={() => { setShowKieModal(false); setEditingKieKey(null); }}
                  className="flex-1 bg-(--bg-tertiary) hover:bg-(--bg-primary) text-(--text-secondary) font-medium py-2.5 rounded-xl transition-colors"
                >
                  Cancel
                </button>
              </div>
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

      {/* Pricing Overview Dialog */}
      {showPricingOverview && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl w-full max-w-4xl shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-(--border-primary) flex items-center justify-between sticky top-0 bg-(--bg-secondary) z-10 rounded-t-2xl">
              <div>
                <h2 className="text-xl font-semibold text-(--text-primary) flex items-center gap-2">
                  <DollarSign className="w-5 h-5 text-amber-400" />
                  Pricing Overview — Hot Models
                </h2>
                <p className="text-xs text-(--text-tertiary) mt-1">Multiplier: 0.625 | Kie: $0.005/credit | User: $0.01/credit | Target: 20%+ margin</p>
              </div>
              <button onClick={() => setShowPricingOverview(false)} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-(--bg-tertiary)">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">
              {/* Why 0.625 explainer */}
              <div className="bg-blue-950/30 border border-blue-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-blue-400 mb-2">Why 0.625 multiplier?</h4>
                <div className="text-xs text-(--text-tertiary) space-y-1">
                  <div>We buy Kie credits at <span className="text-white">$0.005/credit</span> ($5 = 1,000 Kie credits).</div>
                  <div>We sell user credits at <span className="text-white">$0.01/credit</span> ($10 = 1,000 user credits).</div>
                  <div>Our credits are <span className="text-white">2x more expensive</span> than Kie credits. To achieve ~20% margin:</div>
                  <div className="font-mono text-amber-400 mt-1">user_credits = ceil(kie_credits x 0.625)</div>
                  <div className="mt-1">This ensures we charge users ~20-30% more than our cost, giving sustainable margin while staying competitive vs Higgsfield.</div>
                </div>
              </div>

              {/* Image Models */}
              {[
                {
                  title: "Image Models",
                  icon: "image",
                  rows: [
                    { model: "GPT Image 2", variant: "1K", kie: 6 },
                    { model: "GPT Image 2", variant: "2K", kie: 10 },
                    { model: "GPT Image 2", variant: "4K", kie: 16 },
                    { model: "Nano Banana 2", variant: "1K", kie: 8 },
                    { model: "Nano Banana 2", variant: "2K", kie: 12 },
                    { model: "Nano Banana 2", variant: "4K", kie: 18 },
                    { model: "Nano Banana Pro", variant: "1K/2K", kie: 18 },
                    { model: "Nano Banana Pro", variant: "4K", kie: 24 },
                  ],
                },
                {
                  title: "Video Models — Seedance 2.0 Fast (per-second, 5s clip)",
                  icon: "video",
                  rows: [
                    { model: "Seedance 2 Fast", variant: "480P img2vid", kie: 45 },
                    { model: "Seedance 2 Fast", variant: "480P txt2vid", kie: 77.5 },
                    { model: "Seedance 2 Fast", variant: "720P img2vid", kie: 100 },
                    { model: "Seedance 2 Fast", variant: "720P txt2vid", kie: 165 },
                  ],
                },
                {
                  title: "Video Models — Seedance 2.0 (per-second, 5s clip)",
                  icon: "video",
                  rows: [
                    { model: "Seedance 2.0", variant: "480P img2vid", kie: 57.5 },
                    { model: "Seedance 2.0", variant: "480P txt2vid", kie: 95 },
                    { model: "Seedance 2.0", variant: "720P img2vid", kie: 125 },
                    { model: "Seedance 2.0", variant: "720P txt2vid", kie: 205 },
                  ],
                },
                {
                  title: "Video Models — Seedance 1.5 Pro (fixed duration)",
                  icon: "video",
                  rows: [
                    { model: "Seedance 1.5 Pro", variant: "480P 4s", kie: 7 },
                    { model: "Seedance 1.5 Pro", variant: "480P 4s +audio", kie: 14 },
                    { model: "Seedance 1.5 Pro", variant: "720P 4s", kie: 14 },
                    { model: "Seedance 1.5 Pro", variant: "720P 4s +audio", kie: 28 },
                    { model: "Seedance 1.5 Pro", variant: "720P 8s", kie: 28 },
                    { model: "Seedance 1.5 Pro", variant: "720P 8s +audio", kie: 56 },
                    { model: "Seedance 1.5 Pro", variant: "1080P 8s", kie: 60 },
                    { model: "Seedance 1.5 Pro", variant: "1080P 8s +audio", kie: 120 },
                  ],
                },
              ].map((section) => (
                <div key={section.title}>
                  <h4 className="text-sm font-semibold text-(--text-primary) mb-2 flex items-center gap-2">
                    {section.icon === "image" ? <Image className="w-4 h-4 text-blue-400" /> : <Film className="w-4 h-4 text-emerald-400" />}
                    {section.title}
                  </h4>
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="text-(--text-tertiary) border-b border-(--border-primary)">
                          <th className="text-left py-2 pr-3">Model</th>
                          <th className="text-left py-2 px-2">Variant</th>
                          <th className="text-right py-2 px-2">Kie Cr</th>
                          <th className="text-right py-2 px-2">Our Cost</th>
                          <th className="text-right py-2 px-2">x0.625</th>
                          <th className="text-right py-2 px-2">User Cr</th>
                          <th className="text-right py-2 px-2">User Pays</th>
                          <th className="text-right py-2 px-2">Profit</th>
                          <th className="text-right py-2 px-2">Margin</th>
                        </tr>
                      </thead>
                      <tbody className="text-(--text-secondary)">
                        {section.rows.map((row) => {
                          const userCr = Math.ceil(row.kie * 0.625);
                          const kieCost = row.kie * 0.005;
                          const userPays = userCr * 0.01;
                          const profit = userPays - kieCost;
                          const margin = ((1 - kieCost / userPays) * 100);
                          return (
                            <tr key={`${row.model}-${row.variant}`} className="border-b border-(--border-primary)/30 hover:bg-(--bg-tertiary)/50">
                              <td className="py-1.5 pr-3 text-(--text-primary) font-medium">{row.model}</td>
                              <td className="py-1.5 px-2 text-(--text-tertiary)">{row.variant}</td>
                              <td className="text-right py-1.5 px-2">{row.kie}</td>
                              <td className="text-right py-1.5 px-2 text-red-400">${kieCost.toFixed(3)}</td>
                              <td className="text-right py-1.5 px-2 text-(--text-tertiary)">{(row.kie * 0.625).toFixed(1)}</td>
                              <td className="text-right py-1.5 px-2 text-amber-400 font-semibold">{userCr}</td>
                              <td className="text-right py-1.5 px-2 text-emerald-400">${userPays.toFixed(2)}</td>
                              <td className="text-right py-1.5 px-2 text-emerald-300">${profit.toFixed(3)}</td>
                              <td className="text-right py-1.5 px-2">
                                <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                                  margin >= 25 ? 'bg-emerald-500/20 text-emerald-400' : margin >= 20 ? 'bg-amber-500/20 text-amber-400' : 'bg-red-500/20 text-red-400'
                                }`}>{margin.toFixed(0)}%</span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}

              {/* Competitor comparison */}
              <div className="bg-rose-950/20 border border-rose-500/30 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-rose-400 mb-2">vs Higgsfield (at $39/mo)</h4>
                <div className="grid grid-cols-3 gap-4 text-xs">
                  <div>
                    <div className="text-(--text-tertiary)">Our cheapest image</div>
                    <div className="text-emerald-400 font-semibold text-lg">$0.04</div>
                    <div className="text-(--text-tertiary)">GPT Image 2 1K (4 cr)</div>
                  </div>
                  <div>
                    <div className="text-(--text-tertiary)">Higgsfield cheapest</div>
                    <div className="text-red-400 font-semibold text-lg">$0.078</div>
                    <div className="text-(--text-tertiary)">NB Pro (2 cr, Plus plan)</div>
                  </div>
                  <div>
                    <div className="text-(--text-tertiary)">We are</div>
                    <div className="text-emerald-400 font-semibold text-lg">48% cheaper</div>
                    <div className="text-(--text-tertiary)">per generation</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DarkEditModal({ model, formData, onSave, onCancel, setFormData }) {
  const [editTab, setEditTab] = useState<'general' | 'pricing'>('general');
  const pricingType = formData.pricingType || 'fixed';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  const inputClass = "w-full bg-(--bg-tertiary) border border-(--border-primary) rounded-lg px-4 py-2.5 text-(--text-primary) placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-(--accent-blue)/50 focus:border-transparent text-sm";
  const labelClass = "block text-xs font-medium text-gray-400 mb-1.5";

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <div className="bg-(--bg-secondary) border border-(--border-primary) rounded-2xl w-full max-w-2xl shadow-2xl max-h-[85vh] flex flex-col">
        {/* Header + Tabs */}
        <div className="px-6 py-3 border-b border-(--border-primary) shrink-0">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-(--text-primary)">{model ? 'Edit Pricing Model' : 'Create Pricing Model'}</h2>
            <button onClick={onCancel} className="text-gray-400 hover:text-white p-1 rounded-lg hover:bg-(--bg-tertiary)">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="flex gap-1 bg-(--bg-tertiary) rounded-lg p-1">
            <button
              type="button"
              onClick={() => setEditTab('general')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                editTab === 'general' ? 'bg-(--bg-primary) text-(--text-primary) shadow-sm' : 'text-(--text-tertiary) hover:text-(--text-secondary)'
              }`}
            >
              General
            </button>
            <button
              type="button"
              onClick={() => setEditTab('pricing')}
              className={`flex-1 py-2 px-3 rounded-md text-xs font-medium transition-all ${
                editTab === 'pricing' ? 'bg-(--bg-primary) text-(--text-primary) shadow-sm' : 'text-(--text-tertiary) hover:text-(--text-secondary)'
              }`}
            >
              Pricing & Formula
            </button>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
          {/* ─── General Tab ─── */}
          {editTab === 'general' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Model Name</label>
                  <input type="text" value={formData.modelName || ''} onChange={(e) => setFormData({...formData, modelName: e.target.value})} className={inputClass} placeholder="e.g., Nano Banana 2" />
                </div>
                <div>
                  <label className={labelClass}>Model ID</label>
                  <input type="text" value={formData.modelId || ''} onChange={(e) => setFormData({...formData, modelId: e.target.value})} disabled={!!model} className={`${inputClass} ${model ? 'opacity-50 cursor-not-allowed' : ''}`} placeholder="e.g., nano-banana-2" />
                  {model && <p className="text-xs text-gray-500 mt-1">Cannot be changed when editing</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Model Type</label>
                  <select value={formData.modelType || ''} onChange={(e) => setFormData({...formData, modelType: e.target.value as any})} className={inputClass}>
                    <option value="">Select Type</option>
                    <option value="image">Image</option>
                    <option value="video">Video</option>
                    <option value="music">Music</option>
                    <option value="audio">Audio</option>
                  </select>
                </div>
                <div>
                  <label className={labelClass}>Pricing Type</label>
                  <select value={pricingType} onChange={(e) => setFormData({...formData, pricingType: e.target.value as any})} className={inputClass}>
                    <option value="fixed">Fixed Price</option>
                    <option value="formula">Formula Based</option>
                  </select>
                </div>
              </div>

              {/* Visibility + Strategy */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>Visibility</label>
                  <div className="flex items-center gap-2">
                    <button type="button" onClick={() => setFormData({...formData, visibility: 'public'})}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${(formData.visibility || 'public') === 'public' ? 'bg-emerald-600/20 border-emerald-500 text-emerald-400' : 'bg-(--bg-tertiary) border-(--border-primary) text-(--text-tertiary)'}`}>
                      <div className="flex items-center justify-center gap-1.5"><Eye className="w-3.5 h-3.5" /> Public</div>
                    </button>
                    <button type="button" onClick={() => setFormData({...formData, visibility: 'temp_down'})}
                      className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all border ${formData.visibility === 'temp_down' ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-(--bg-tertiary) border-(--border-primary) text-(--text-tertiary)'}`}>
                      <div className="flex items-center justify-center gap-1.5"><EyeOff className="w-3.5 h-3.5" /> Temp Down</div>
                    </button>
                  </div>
                </div>
                <div>
                  <label className={labelClass}>Strategy Pricing</label>
                  <button type="button" onClick={() => setFormData({...formData, isHot: !formData.isHot})}
                    className={`w-full py-2 px-3 rounded-lg text-xs font-medium transition-all border ${
                      formData.isHot ? 'bg-amber-600/20 border-amber-500 text-amber-400' : 'bg-(--bg-tertiary) border-(--border-primary) text-(--text-tertiary)'
                    }`}>
                    <div className="flex items-center justify-center gap-1.5">
                      <Star className="w-3.5 h-3.5" />
                      {formData.isHot ? 'Hot Model (0.625x)' : 'Normal'}
                    </div>
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ─── Pricing Tab ─── */}
          {editTab === 'pricing' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className={labelClass}>{pricingType === 'fixed' ? 'Credit Cost' : 'Base Credit Cost'}</label>
                  <input type="number" value={formData.creditCost || ''} onChange={(e) => setFormData({...formData, creditCost: Number(e.target.value)})} className={inputClass} placeholder="e.g., 8" min="0.1" step="0.1" />
                </div>
                <div>
                  <label className={labelClass}>Multiplier</label>
                  <input type="number" value={formData.factor || ''} onChange={(e) => setFormData({...formData, factor: Number(e.target.value)})} className={inputClass} placeholder="e.g., 0.625" min="0.1" step="0.001" />
                </div>
              </div>

              {pricingType === 'formula' && (
                <>
                  <div>
                    <label className={labelClass}>Assigned Function</label>
                    <select value={formData.assignedFunction || ''} onChange={(e) => setFormData({...formData, assignedFunction: e.target.value})} className={inputClass}>
                      <option value="">Select Function (Optional)</option>
                      <option value="getGptImagePrice">getGptImagePrice - Image</option>
                      <option value="getNanoBananaPrice">getNanoBananaPrice - Image</option>
                      <option value="getSeedance15">getSeedance15 - Video</option>
                      <option value="getSeedance20">getSeedance20 - Video (2.0)</option>
                      <option value="getSeedance20Fast">getSeedance20Fast - Video (2.0 Fast)</option>
                      <option value="getKlingMotionControl">getKlingMotionControl - Video (Kling)</option>
                      <option value="getVeo31">getVeo31 - Video</option>
                      <option value="getTopazUpscale">getTopazUpscale - Image Upscale</option>
                      <option value="getTopazVideoUpscale">getTopazVideoUpscale - Video Upscale</option>
                      <option value="getGrokImageToVideo">getGrokImageToVideo - Video (Grok)</option>
                      <option value="getInfinitalkFromAudio">getInfinitalkFromAudio - Lip Sync</option>
                      <option value="getElevenLabsTTS">getElevenLabsTTS - TTS</option>
                    </select>
                  </div>

                  <div>
                    <label className={labelClass}>Formula JSON</label>
                    <textarea rows={5} value={formData.formulaJson || ''} onChange={(e) => setFormData({...formData, formulaJson: e.target.value})}
                      className="w-full bg-[#1A1A1A] border border-[#3D3D3D] rounded-lg px-4 py-2.5 text-white placeholder-gray-500 font-mono text-xs focus:outline-none focus:ring-2 focus:ring-[#4A90E2] focus:border-transparent resize-none"
                      placeholder='{"base_cost": 8, "qualities": [{"name": "1K", "cost": 8}]}'
                    />
                  </div>
                </>
              )}

              {/* Quick margin preview */}
              {formData.creditCost && formData.factor ? (() => {
                const userCr = Math.ceil(formData.creditCost * formData.factor);
                const kieCost = formData.creditCost * 0.005;
                const userPays = userCr * 0.01;
                const margin = ((1 - kieCost / userPays) * 100);
                return (
                  <div className="flex items-center gap-4 bg-(--bg-tertiary) rounded-lg p-3 text-xs">
                    <span className="text-(--text-tertiary)">Kie: <span className="text-red-400 font-mono">${kieCost.toFixed(3)}</span></span>
                    <span className="text-(--text-tertiary)">User: <span className="text-amber-400 font-mono font-semibold">{userCr} cr (${userPays.toFixed(2)})</span></span>
                    <span className={`px-2 py-0.5 rounded font-medium ${margin >= 20 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                      {margin.toFixed(0)}% margin
                    </span>
                    {formData.factor === 1.2 && <span className="text-amber-400">Old multiplier</span>}
                  </div>
                );
              })() : null}
            </>
          )}
        </form>

        {/* Footer Actions — always visible */}
        <div className="flex justify-end gap-3 px-6 py-4 border-t border-(--border-primary) shrink-0">
          <button type="button" onClick={onCancel} className="px-5 py-2.5 border border-[#3D3D3D] text-gray-300 font-medium rounded-lg hover:bg-[#3D3D3D] transition-colors text-sm">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="px-5 py-2.5 bg-[#4A90E2] hover:bg-[#357ABD] text-white font-medium rounded-lg transition-colors shadow-lg text-sm">
            {model ? 'Save Changes' : 'Create Model'}
          </button>
        </div>
      </div>
    </div>
  );
}
