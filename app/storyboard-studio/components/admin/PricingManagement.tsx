"use client";

import { useState } from "react";
import { DollarSign, Plus, Edit, Power, TrendingUp, Users, CreditCard, BarChart2 } from "lucide-react";
import { usePricingData } from "../../hooks/usePricingData";

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

export default function PricingManagement() {
  const [selectedModel, setSelectedModel] = useState<PricingModel | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<Partial<PricingModel>>({});
  
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
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Error loading pricing data</p>
          <p className="text-sm mt-2">{error}</p>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
              <nav className="flex space-x-8">
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">Models</a>
                <a href="#" className="text-sm font-medium text-emerald-600 hover:text-emerald-700">Analytics</a>
                <a href="#" className="text-sm font-medium text-gray-500 hover:text-gray-900">Settings</a>
              </nav>
            </div>
            <button 
              onClick={() => {
                setSelectedModel(null);
                setFormData({});
                setIsEditing(true);
              }}
              className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              Add New Model
            </button>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-gray-900">${analytics?.totalRevenue?.toLocaleString()}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Total Usage</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.totalUsage}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-purple-100 rounded-lg">
                <CreditCard className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Avg Cost</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.avgCost} credits</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-2 bg-orange-100 rounded-lg">
                <BarChart2 className="w-6 h-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Active Models</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.activeModels}</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Models Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {models?.map(model => (
            <ModelCard 
              key={model._id}
              model={model}
              onEdit={() => {
                setSelectedModel(model);
                setFormData(model);
                setIsEditing(true);
              }}
              onToggleActive={() => toggleModelActive(model.modelId)}
            />
          ))}
        </div>
      </div>
      
      {/* Edit Modal */}
      {isEditing && (
        <PricingEditModal
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

// Model Card Component
function ModelCard({ 
  model, 
  onEdit, 
  onToggleActive 
}: { 
  model: PricingModel; 
  onEdit: () => void; 
  onToggleActive: () => void; 
}) {
  return (
    <div className={`rounded-lg border p-4 transition-all hover:shadow-md ${
      model.isActive 
        ? 'border-emerald-200 bg-emerald-50' 
        : 'border-gray-200 bg-white'
    }`}>
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{model.modelName}</h3>
          <p className="text-sm text-gray-500">{model.modelId}</p>
        </div>
        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
          model.isActive 
            ? 'bg-emerald-100 text-emerald-800' 
            : 'bg-gray-100 text-gray-600'
        }`}>
          {model.isActive ? 'Active' : 'Inactive'}
        </span>
      </div>
      
      <div className="space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Type</span>
          <span className="font-medium text-gray-900 capitalize">{model.pricingType}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Model</span>
          <span className="font-medium text-gray-900 capitalize">{model.modelType}</span>
        </div>
        {model.pricingType === 'fixed' && (
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Cost</span>
            <span className="font-medium text-gray-900">{model.creditCost} × {model.factor}</span>
          </div>
        )}
        {model.pricingType === 'formula' && (
          <div className="text-sm text-gray-500">
            <span className="font-medium text-gray-700">Formula-based pricing</span>
          </div>
        )}
      </div>
      
      <div className="flex gap-2">
        <button 
          onClick={onEdit}
          className="flex-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
        >
          <Edit className="w-4 h-4" />
          Edit
        </button>
        <button 
          onClick={onToggleActive}
          className={`flex-1 px-3 py-2 rounded-lg transition-colors flex items-center justify-center gap-1 ${
            model.isActive 
              ? 'bg-red-100 text-red-700 hover:bg-red-200' 
              : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          <Power className="w-4 h-4" />
          {model.isActive ? 'Disable' : 'Enable'}
        </button>
      </div>
    </div>
  );
}

// Pricing Edit Modal Component
function PricingEditModal({ 
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
  const [formulaType, setFormulaType] = useState(formData.pricingType || 'fixed');
  const [formulaJson, setFormulaJson] = useState(formData.formulaJson || '{}');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.modelId?.trim()) newErrors.modelId = 'Model ID is required';
    if (!formData.modelName?.trim()) newErrors.modelName = 'Model name is required';
    if (!formData.modelType) newErrors.modelType = 'Model type is required';
    if (!formulaType) newErrors.pricingType = 'Pricing type is required';
    
    if (formulaType === 'fixed') {
      if (!formData.creditCost || formData.creditCost <= 0) {
        newErrors.creditCost = 'Credit cost must be greater than 0';
      }
      if (!formData.factor || formData.factor <= 0) {
        newErrors.factor = 'Multiplier must be greater than 0';
      }
    }
    
    if (formulaType === 'formula') {
      try {
        JSON.parse(formulaJson);
      } catch (error) {
        newErrors.formulaJson = 'Invalid JSON format';
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
      pricingType: formulaType as 'fixed' | 'formula',
      formulaJson: formulaType === 'formula' ? formulaJson : undefined,
      creditCost: formulaType === 'fixed' ? formData.creditCost : undefined,
      factor: formulaType === 'fixed' ? formData.factor : undefined,
    };
    
    onSave(updatedData);
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            {model ? 'Edit Model' : 'Add New Model'}
          </h2>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model ID</label>
              <input 
                type="text"
                value={formData.modelId || ''}
                onChange={(e) => setFormData({...formData, modelId: e.target.value})}
                className={`w-full px-3 py-2 border ${
                  errors.modelId ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="e.g., nano-banana-2"
              />
              {errors.modelId && (
                <p className="text-sm text-red-600 mt-1">{errors.modelId}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Name</label>
              <input 
                type="text"
                value={formData.modelName || ''}
                onChange={(e) => setFormData({...formData, modelName: e.target.value})}
                className={`w-full px-3 py-2 border ${
                  errors.modelName ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder="e.g., Nano Banana 2"
              />
              {errors.modelName && (
                <p className="text-sm text-red-600 mt-1">{errors.modelName}</p>
              )}
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Model Type</label>
              <select 
                value={formData.modelType || ''}
                onChange={(e) => setFormData({...formData, modelType: e.target.value as 'image' | 'video'})}
                className={`w-full px-3 py-2 border ${
                  errors.modelType ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="">Select Type</option>
                <option value="image">Image</option>
                <option value="video">Video</option>
              </select>
              {errors.modelType && (
                <p className="text-sm text-red-600 mt-1">{errors.modelType}</p>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Pricing Type</label>
              <select 
                value={formulaType}
                onChange={(e) => setFormulaType(e.target.value as 'fixed' | 'formula')}
                className={`w-full px-3 py-2 border ${
                  errors.pricingType ? 'border-red-300' : 'border-gray-300'
                } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
              >
                <option value="fixed">Fixed Price</option>
                <option value="formula">Formula Based</option>
              </select>
              {errors.pricingType && (
                <p className="text-sm text-red-600 mt-1">{errors.pricingType}</p>
              )}
            </div>
          </div>
          
          {formulaType === 'fixed' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Credit Cost</label>
                <input 
                  type="number"
                  value={formData.creditCost || ''}
                  onChange={(e) => setFormData({...formData, creditCost: Number(e.target.value)})}
                  className={`w-full px-3 py-2 border ${
                    errors.creditCost ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g., 8"
                  min="1"
                  step="0.1"
                />
                {errors.creditCost && (
                  <p className="text-sm text-red-600 mt-1">{errors.creditCost}</p>
                )}
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Multiplier</label>
                <input 
                  type="number"
                  value={formData.factor || ''}
                  onChange={(e) => setFormData({...formData, factor: Number(e.target.value)})}
                  className={`w-full px-3 py-2 border ${
                    errors.factor ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                  placeholder="e.g., 1.0"
                  min="0.1"
                  step="0.1"
                />
                {errors.factor && (
                  <p className="text-sm text-red-600 mt-1">{errors.factor}</p>
                )}
              </div>
            </div>
          )}
          
          {formulaType === 'formula' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Formula JSON</label>
              <textarea 
                value={formulaJson}
                onChange={(e) => setFormulaJson(e.target.value)}
                rows={8}
                className={`w-full px-3 py-2 border ${
                  errors.formulaJson ? 'border-red-300' : 'border-gray-300'
                } rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500`}
                placeholder='{"base_cost": 7, "qualities": [{"name": "1K", "cost": 8}]}'
              />
              {errors.formulaJson && (
                <p className="text-sm text-red-600 mt-1">{errors.formulaJson}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Enter JSON formula configuration. Example:
                {`{"base_cost": 7, "qualities": [{"name": "1K", "cost": 8}]}`}
              </p>
            </div>
          )}
          
          <div className="flex justify-end gap-3 pt-6">
            <button 
              type="button"
              onClick={onCancel}
              className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit"
              className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
            >
              {model ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
