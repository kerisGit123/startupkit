"use client";

import { useState, useEffect } from "react";
import { CreditCard, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { usePricingData } from "../shared/usePricingData";

interface PricingCalculatorProps {
  modelId: string;
  onCostCalculated?: (credits: number) => void;
  disabled?: boolean;
}

export function PricingCalculatorComponent({ modelId, onCostCalculated, disabled = false }: PricingCalculatorProps) {
  const { models } = usePricingData();
  const [quality, setQuality] = useState<string>("2K");
  const [resolution, setResolution] = useState<string>("720P");
  const [duration, setDuration] = useState<string>("8s");
  const [hasAudio, setHasAudio] = useState<boolean>(false);
  const [cost, setCost] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get the model data
  const model = models.find(m => m.modelId === modelId);
  const isFormulaBased = model?.pricingType === 'formula';
  const requiresQuality = model?.modelId === "nano-banana-2" || model?.modelId === "topaz/image-upscale";
  const requiresVideoParams = model?.modelId === "bytedance/seedance-1.5-pro";

  // Calculate cost when parameters change
  useEffect(() => {
    if (!modelId || disabled || !model) return;

    const calculateCost = async () => {
      setLoading(true);
      setError(null);

      try {
        let calculatedCost = 0;

        if (model.pricingType === 'fixed') {
          // Fixed pricing: base cost * factor
          calculatedCost = Math.ceil((model.creditCost || 0) * (model.factor || 1));
        } else if (model.assignedFunction && model.formulaJson) {
          // Formula-based pricing: extract from formulaJson
          const formula = JSON.parse(model.formulaJson);
          
          switch (model.assignedFunction) {
            case 'getGptImagePrice':
              if (requiresQuality) {
                const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === quality);
                if (qualityData) {
                  const factor = model.factor || 1;
                  calculatedCost = Math.ceil(qualityData.cost * factor);
                }
              }
              break;
              
            case 'getNanoBananaPrice':
              if (requiresQuality) {
                const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === quality);
                if (qualityData) {
                  const factor = model.factor || 1;
                  calculatedCost = Math.ceil(qualityData.cost * factor);
                }
              }
              break;
              
            case 'getTopazUpscale':
              if (requiresQuality) {
                const qualityData = formula.pricing?.qualities?.find((q: any) => q.name === quality);
                if (qualityData) {
                  const factor = model.factor || 1;
                  calculatedCost = Math.ceil(qualityData.cost * factor);
                }
              }
              break;
              
            case 'getSeedance15':
              if (requiresVideoParams) {
                const base = model.creditCost || 0;
                const factor = model.factor || 1;
                const resolutionMultipliers = { "480p": 1, "720p": 2, "1080p": 4 };
                const resolutionMultiplier = resolutionMultipliers[resolution as keyof typeof resolutionMultipliers] || 1;
                const audioMultiplier = hasAudio ? 1.5 : 1;
                const durationValue = parseInt(duration) || 8;
                const durationMultiplier = Math.ceil(durationValue / 4); // Every 4 seconds adds multiplier
                
                calculatedCost = Math.ceil(base * factor * resolutionMultiplier * audioMultiplier * durationMultiplier);
              }
              break;
              
            case 'getInfinitalkFromAudio': {
              const itCosts: Record<string, number> = { "480p": 3, "720p": 12 };
              const itBase = model.creditCost || 0;
              const itFactor = model.factor || 1;
              const itCostPerSec = itCosts[resolution] || itBase;
              calculatedCost = Math.ceil(itCostPerSec * (parseInt(duration) || 8) * itFactor);
              break;
            }
            default:
              calculatedCost = Math.ceil((model.creditCost || 0) * (model.factor || 1));
          }
        }

        setCost(calculatedCost);
        onCostCalculated?.(calculatedCost);
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
  }, [modelId, model, quality, resolution, duration, hasAudio, disabled, onCostCalculated]);

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

      {/* Model Info */}
      <div className="mb-4 p-2 bg-white/2 rounded-lg">
        <p className="text-xs text-gray-400">Model: {model?.modelName || modelId}</p>
        <p className="text-xs text-gray-500">Type: {isFormulaBased ? 'Formula-based' : 'Fixed pricing'}</p>
      </div>

      {/* Quality Parameters (for Nano Banana 2 and Topaz Upscale) */}
      {requiresQuality && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Quality:</label>
            <select
              value={quality}
              onChange={(e) => setQuality(e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 bg-[#13131a] border border-white/8 rounded text-white text-xs focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
            >
              <option value="1K">1K Resolution</option>
              <option value="2K">2K Resolution</option>
              <option value="4K">4K Resolution</option>
            </select>
          </div>
        </div>
      )}

      {/* Video Parameters (for Seedance 1.5 Pro) */}
      {requiresVideoParams && (
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Resolution:</label>
            <select
              value={resolution}
              onChange={(e) => setResolution(e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 bg-[#13131a] border border-white/8 rounded text-white text-xs focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
            >
              <option value="480p">480p</option>
              <option value="720p">720p</option>
              <option value="1080p">1080p</option>
              <option value="4K">4K</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Duration:</label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              disabled={disabled}
              className="flex-1 px-2 py-1 bg-[#13131a] border border-white/8 rounded text-white text-xs focus:outline-none focus:border-emerald-500/40 disabled:opacity-50"
            >
              <option value="4s">4 seconds</option>
              <option value="8s">8 seconds</option>
              <option value="12s">12 seconds</option>
            </select>
          </div>
          
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-400 w-16">Audio:</label>
            <label className="flex items-center gap-1 cursor-pointer">
              <input
                type="checkbox"
                checked={hasAudio}
                onChange={(e) => setHasAudio(e.target.checked)}
                disabled={disabled}
                className="w-3 h-3 rounded border-white/8 bg-[#13131a] text-emerald-500 focus:outline-none focus:ring-emerald-500/10 disabled:opacity-50"
              />
              <span className="text-xs text-gray-400">Include audio</span>
            </label>
          </div>
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
            <span className="text-xs">Loading pricing information...</span>
          </div>
        )}
      </div>

      {/* Cost Breakdown */}
      {cost !== null && !error && isFormulaBased && (
        <div className="mt-2 text-[10px] text-gray-600">
          {requiresQuality && (
            <p>Cost calculated using formula: base cost × factor ({model?.factor || 1})</p>
          )}
          {requiresVideoParams && (
            <p>Cost calculated using video formula with resolution, duration, and audio parameters</p>
          )}
        </div>
      )}
    </div>
  );
}
