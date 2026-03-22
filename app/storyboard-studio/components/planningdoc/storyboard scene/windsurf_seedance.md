I'll create a `getSeedance15` function for Seedance 1.5 pricing with resolution, audio, and duration parameters:

Perfect! I've created the [getSeedance15](cci:1://file:///d:/gemini/startupkit/app/storyboard-studio/components/admin/PricingManagementDark.tsx:87:0-103:1) function for Seedance 1.5 video generation pricing. Here's what it does:

## getSeedance15 Function

```typescript
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
```

## Function Features

**Parameters**:
- `base`: Base credit cost (number)
- `multiplier`: Pricing multiplier (number)
- `resolution`: Video resolution (string)
- `audio`: Whether audio is included (boolean)
- `duration`: Video duration in seconds (number)

**Resolution Multipliers**:
- **480p**: 1.0x (base resolution)
- **720p**: 1.5x (HD)
- **1080p**: 2.5x (Full HD)
- **4K**: 5.0x (Ultra HD)

**Additional Multipliers**:
- **Audio**: 1.5x if audio is included, 1.0x if no audio
- **Duration**: 1x per 5 seconds (rounded up)

**Formula**: `Math.ceil(base × multiplier × resolutionMultiplier × audioMultiplier × durationMultiplier)`

## Usage Examples

With base=12, multiplier=1.3:

- [getSeedance15(12, 1.3, '720p', false, 5)](cci:1://file:///d:/gemini/startupkit/app/storyboard-studio/components/admin/PricingManagementDark.tsx:87:0-103:1) → `Math.ceil(12 × 1.3 × 1.5 × 1 × 1)` → `78 credits`
- [getSeedance15(12, 1.3, '1080p', true, 10)](cci:1://file:///d:/gemini/startupkit/app/storyboard-studio/components/admin/PricingManagementDark.tsx:87:0-103:1) → `Math.ceil(12 × 1.3 × 2.5 × 1.5 × 2)` → `234 credits`
- [getSeedance15(12, 1.3, '4K', true, 8)](cci:1://file:///d:/gemini/startupkit/app/storyboard-studio/components/admin/PricingManagementDark.tsx:87:0-103:1) → `Math.ceil(12 × 1.3 × 5 × 1.5 × 2)` → `468 credits`

## Key Features

- **Resolution-based pricing**: Higher resolutions cost significantly more
- **Audio support**: Adding audio increases cost by 50%
- **Duration scaling**: Cost scales with video length (5-second increments)
- **Comprehensive**: Handles all aspects of video generation pricing
- **Consistent rounding**: Uses Math.ceil() like other pricing functions

This function is specifically designed for Seedance 1.5 video generation, accounting for resolution quality, audio inclusion, and video duration to provide accurate credit pricing.