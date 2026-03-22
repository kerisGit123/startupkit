"use client";

import { useState } from "react";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
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
  X
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

// Modern Price Management Component
export default function PricingManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<PricingModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PricingModel>>({});
  const [showFilters, setShowFilters] = useState(false);
  const [selectedType, setSelectedType] = useState<"all" | "image" | "video">("all");
  const [selectedStatus, setSelectedStatus] = useState<"all" | "active" | "inactive">("all");
  
  const { models, analytics, loading, error, saveModel, toggleModelActive } = usePricingData();

  const handleSave = (data: Partial<PricingModel>) => {
    saveModel(data).then(success => {
      if (success) {
        setIsEditing(false);
        setSelectedModel(null);
        setFormData({});
      }
    });
  };

  const filteredModels = models?.filter(model => {
    const matchesSearch = model.modelName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         model.modelId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === "all" || model.modelType === selectedType;
    const matchesStatus = selectedStatus === "all" || 
                         (selectedStatus === "active" && model.isActive) ||
                         (selectedStatus === "inactive" && !model.isActive);
    
    return matchesSearch && matchesType && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading pricing data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-emerald-600" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">Pricing Management</h1>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button className="btn btn-secondary">
                <Filter className="w-4 h-4 mr-2" />
                Filters
              </button>
              <button 
                onClick={() => {
                  setSelectedModel(null);
                  setFormData({});
                  setIsEditing(true);
                }}
                className="btn btn-primary"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Model
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="card card-elevated">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">${analytics?.totalRevenue.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-500 mt-1">+12.5% from last month</p>
                </div>
                <div className="w-12 h-12 bg-emerald-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-emerald-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card card-elevated">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Usage</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics?.totalUsage.toLocaleString() || '0'}</p>
                  <p className="text-xs text-gray-500 mt-1">+8.2% from last month</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card card-elevated">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Average Cost</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics?.avgCost.toFixed(1) || '0'} credits</p>
                  <p className="text-xs text-gray-500 mt-1">-2.1% from last month</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          <div className="card card-elevated">
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Models</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{analytics?.activeModels || '0'}</p>
                  <p className="text-xs text-gray-500 mt-1">2 added this week</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search models..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="flex gap-3">
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Types</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
        </div>

        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredModels.map((model) => (
            <ModernModelCard
              key={model._id}
              model={model}
              onEdit={() => {
                setSelectedModel(model);
                setFormData(model);
                setIsEditing(true);
              }}
              onToggleActive={() => toggleModelActive(model._id, !model.isActive)}
            />
          ))}
        </div>

        {filteredModels.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <DollarSign className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No models found</h3>
            <p className="text-gray-600 mb-4">Get started by creating your first pricing model</p>
            <button 
              onClick={() => {
                setSelectedModel(null);
                setFormData({});
                setIsEditing(true);
              }}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Model
            </button>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {isEditing && (
        <ModernEditModal
          model={selectedModel}
          formData={formData}
          onSave={handleSave}
          onCancel={() => {
            setIsEditing(false);
            setSelectedModel(null);
            setFormData({});
          }}
          setFormData={setFormData}
        />
      )}
    </div>
  );
}

// Modern Model Card Component
function ModernModelCard({ 
  model, 
  onEdit, 
  onToggleActive 
}: { 
  model: PricingModel; 
  onEdit: () => void; 
  onToggleActive: () => void; 
}) {
  return (
    <div className={`card card-elevated hover-lift ${model.isActive ? 'border-l-4 border-l-emerald-500' : 'border-l-4 border-l-gray-300'}`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{model.modelName}</h3>
            <p className="text-sm text-gray-500">{model.modelId}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              model.isActive 
                ? 'bg-emerald-100 text-emerald-800' 
                : 'bg-gray-100 text-gray-800'
            }`}>
              {model.isActive ? 'Active' : 'Inactive'}
            </span>
            <button className="text-gray-400 hover:text-gray-600">
              <MoreVertical className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="space-y-3 mb-4">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Type</span>
            <span className="font-medium text-gray-900 capitalize">{model.modelType}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Pricing</span>
            <span className="font-medium text-gray-900 capitalize">{model.pricingType}</span>
          </div>
          {model.pricingType === 'fixed' && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-600">Cost</span>
              <span className="font-medium text-gray-900">{model.creditCost} × {model.factor}</span>
            </div>
          )}
        </div>

        <div className="flex space-x-2">
          <button 
            onClick={onEdit}
            className="flex-1 btn btn-outline btn-sm"
          >
            <Edit3 className="w-3 h-3 mr-1" />
            Edit
          </button>
          <button 
            onClick={onToggleActive}
            className={`flex-1 btn btn-sm ${
              model.isActive 
                ? 'btn-secondary' 
                : 'btn-primary'
            }`}
          >
            <Power className="w-3 h-3 mr-1" />
            {model.isActive ? 'Disable' : 'Enable'}
          </button>
        </div>
      </div>
    </div>
  );
}

// Modern Edit Modal Component
function ModernEditModal({ 
  model, 
  formData, 
  onSave, 
  onCancel,
  setFormData 
}: { 
  model: PricingModel | null; 
  formData: Partial<PricingModel>; 
  onSave: (data: Partial<PricingModel>) => void; 
  onCancel: () => void;
  setFormData: (data: Partial<PricingModel>) => void;
}) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pricingType, setPricingType] = useState(formData.pricingType || 'fixed');

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.modelId?.trim()) newErrors.modelId = 'Model ID is required';
    if (!formData.modelName?.trim()) newErrors.modelName = 'Model name is required';
    if (!formData.modelType) newErrors.modelType = 'Model type is required';
    
    if (pricingType === 'fixed') {
      if (!formData.creditCost || formData.creditCost <= 0) {
        newErrors.creditCost = 'Credit cost must be greater than 0';
      }
      if (!formData.factor || formData.factor <= 0) {
        newErrors.factor = 'Multiplier must be greater than 0';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    const updatedData = {
      ...formData,
      pricingType: pricingType as 'fixed' | 'formula',
      creditCost: pricingType === 'fixed' ? formData.creditCost : undefined,
      factor: pricingType === 'fixed' ? formData.factor : undefined,
    };
    
    onSave(updatedData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="border-b border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              {model ? 'Edit Model' : 'Add New Model'}
            </h2>
            <button 
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model ID</label>
              <input 
                type="text"
                value={formData.modelId || ''}
                onChange={(e) => setFormData({...formData, modelId: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.modelId ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., nano-banana-2"
              />
              {errors.modelId && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.modelId}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
              <input 
                type="text"
                value={formData.modelName || ''}
                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.modelName ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="e.g., Nano Banana 2"
              />
              {errors.modelName && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.modelName}
                </p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
              <select 
                value={formData.modelType || ''}
                onChange={(e) => setFormData({...formData, modelType: e.target.value as 'image' | 'video'})}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                  errors.modelType ? 'border-red-300' : 'border-gray-300'
                }`}
              >
                <option value="">Select Type</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              {errors.modelType && (
                <p className="text-sm text-red-600 mt-1 flex items-center">
                  <AlertCircle className="w-3 h-3 mr-1" />
                  {errors.modelType}
                </p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
              <select 
                value={pricingType}
                onChange={(e) => setPricingType(e.target.value as 'fixed' | 'formula')}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              >
                <option value="fixed">Fixed Price</option>
                <option value="formula">Formula Based</option>
              </select>
            </div>
          </div>
          
          {pricingType === 'fixed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Cost</label>
                <input 
                  type="number"
                  value={formData.creditCost || ''}
                  onChange={(e) => setFormData({...formData, creditCost: Number(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.creditCost ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 8"
                  min="1"
                  step="0.1"
                />
                {errors.creditCost && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.creditCost}
                  </p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Multiplier</label>
                <input 
                  type="number"
                  value={formData.factor || ''}
                  onChange={(e) => setFormData({...formData, factor: Number(e.target.value)})}
                  className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent ${
                    errors.factor ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 1.0"
                  min="0.1"
                  step="0.1"
                />
                {errors.factor && (
                  <p className="text-sm text-red-600 mt-1 flex items-center">
                    <AlertCircle className="w-3 h-3 mr-1" />
                    {errors.factor}
                  </p>
                )}
              </div>
            </div>
          )}
          
          <div className="flex justify-end space-x-3 pt-6">
            <button 
              type="button"
              onClick={onCancel}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="btn btn-primary"
            >
              {model ? 'Update Model' : 'Create Model'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// Modern Button Styles (to be added to global CSS)
const buttonStyles = `
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 0.5rem;
  font-weight: 500;
  font-size: 0.875rem;
  padding: 0.5rem 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: 1px solid transparent;
  text-decoration: none;
}

.btn-primary {
  background-color: #10B981;
  color: white;
  border-color: #10B981;
}

.btn-primary:hover {
  background-color: #059669;
  border-color: #059669;
}

.btn-secondary {
  background-color: #F3F4F6;
  color: #374151;
  border-color: #D1D5DB;
}

.btn-secondary:hover {
  background-color: #E5E7EB;
  color: #111827;
  border-color: #9CA3AF;
}

.btn-outline {
  background-color: transparent;
  color: #10B981;
  border-color: #10B981;
}

.btn-outline:hover {
  background-color: #10B981;
  color: white;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
`;

// Modern Card Styles (to be added to global CSS)
const cardStyles = `
.card {
  background: white;
  border-radius: 0.75rem;
  border: 1px solid #E5E7EB;
  box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  transition: all 0.2s ease;
}

.card:hover {
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
}

.card-elevated {
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.hover-lift {
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.hover-lift:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}
`;
