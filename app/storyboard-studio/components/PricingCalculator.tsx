"use client";

import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { PricingCalculator, PricingParams } from "../lib/pricing/calculator";

interface PricingCalculatorProps {
  modelId: string;
  onCostCalculated?: (credits: number) => void;
  disabled?: boolean;
}

export function PricingCalculatorComponent({ modelId, onCostCalculated, disabled = false }: PricingCalculatorProps) {
  const [params, setParams] = useState<PricingParams>({ modelId });
  const [cost, setCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [requiredParams, setRequiredParams] = useState<string[]>([]);

  // Get required parameters for the model
  useEffect(() => {
    const getRequiredParams = async () => {
      try {
        const required = await PricingCalculator.getModelRequiredParams(modelId);
        setRequiredParams(required);
      } catch (err) {
        console.error("Failed to get required params:", err);
      }
    };

    if (modelId) {
      getRequiredParams();
    }
  }, [modelId]);

  // Calculate cost when parameters change
  useEffect(() => {
    if (!modelId || disabled) return;

    const calculateCost = async () => {
      setLoading(true);
      setError(null);

      try {
        const result = await PricingCalculator.calculateCost(params);
        setCost(result.credits);
        onCostCalculated?.(result.credits);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to calculate cost');
        setCost(null);
        onCostCalculated?.(0);
      } finally {
        setLoading(false);
      }
    };

    // Debounce calculation
    const timeoutId = setTimeout(calculateCost, 300);
    return () => clearTimeout(timeoutId);
  }, [params, modelId, disabled, onCostCalculated]);

  const handleParamChange = (key: string, value: any) => {
    setParams(prev => ({ ...prev, [key]: value }));
  };

  const renderParamInput = (paramName: string) => {
    switch (paramName) {
      case 'quality':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Quality:</label>
            <select
              value={params.quality || ''}
              onChange={(e) => handleParamChange('quality', e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 bg-[#13131a] border border-white/8 rounded text-white text-xs focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
            >
              <option value="">Select</option>
              <option value="1K">1K</option>
              <option value="2K">2K</option>
              <option value="4K">4K</option>
            </select>
          </div>
        );

      case 'resolution':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Resolution:</label>
            <select
              value={params.resolution || ''}
              onChange={(e) => handleParamChange('resolution', e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 bg-[#13131a] border border-white/8 rounded text-white text-xs focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
            >
              <option value="">Select</option>
              <option value="480P">480P</option>
              <option value="720P">720P</option>
              <option value="1080P">1080P</option>
            </select>
          </div>
        );

      case 'duration':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Duration:</label>
            <select
              value={params.duration || ''}
              onChange={(e) => handleParamChange('duration', e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 bg-[#13131a] border border-white/8 rounded text-white text-xs focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
            >
              <option value="">Select</option>
              <option value="4s">4 seconds</option>
              <option value="8s">8 seconds</option>
              <option value="12s">12 seconds</option>
            </select>
          </div>
        );

      case 'hasAudio':
        return (
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Audio:</label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={params.hasAudio || false}
                onChange={(e) => handleParamChange('hasAudio', e.target.checked)}
                disabled={disabled}
                className="w-3 h-3 rounded border-white/8 bg-[#13131a] text-emerald-500 focus:outline-none focus:ring-emerald-500/10 disabled:opacity-50"
              />
              <span className="text-xs text-gray-400">Include audio</span>
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  if (disabled) {
    return (
      <div className="rounded-3xl border border-white/6 bg-[#101018] p-4 opacity-50">
        <div className="flex items-center gap-2 text-gray-500">
          <CreditCard className="w-4 h-4" />
          <span className="text-sm">Pricing calculator disabled</span>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-white/6 bg-[#101018] p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <CreditCard className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-[0.24em]">Cost Calculator</span>
        </div>
        {loading && (
          <div className="w-3 h-3 border border-emerald-500/30 border-t-emerald-500 animate-spin rounded-full" />
        )}
      </div>

      {/* Required Parameters */}
      {requiredParams.length > 0 && (
        <div className="space-y-2 mb-4">
          {requiredParams.map(param => (
            <div key={param}>
              {renderParamInput(param)}
            </div>
          ))}
        </div>
      )}

      {/* Cost Display */}
      <div className="mt-4 pt-4 border-t border-white/6">
        {error ? (
          <div className="flex items-start gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-red-400 font-medium">Calculation Error</p>
              <p className="text-xs text-red-500 mt-1">{error}</p>
            </div>
          </div>
        ) : cost !== null ? (
          <div className="flex items-center justify-between p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              <div>
                <p className="text-xs text-emerald-400 font-medium">Estimated Cost</p>
                <p className="text-lg font-bold text-emerald-300">{cost} credits</p>
              </div>
            </div>
            <TrendingUp className="w-4 h-4 text-emerald-400/50" />
          </div>
        ) : (
          <div className="flex items-center gap-2 text-gray-500 p-3">
            <CreditCard className="w-4 h-4" />
            <span className="text-xs">Configure parameters to see cost</span>
          </div>
        )}
      </div>

      {/* Cost Breakdown Tooltip */}
      {cost !== null && !error && (
        <div className="mt-2 text-[10px] text-gray-600">
          <p>Cost calculated based on model configuration and selected parameters</p>
        </div>
      )}
    </div>
  );
}
