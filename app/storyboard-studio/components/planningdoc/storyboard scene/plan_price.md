# Pricing Plan Documentation

## Overview

This document outlines the pricing structure and calculation methods for the Storyboard Studio platform.

## Pricing Types

### 1. Fixed Pricing
- **Description**: Simple, straightforward pricing with a fixed cost
- **Cost Display**: Shows base credit cost (e.g., "5 credits")
- **Price Calculation**: Uses `getFixedPrice(base, multiplier)` function
- **Formula**: `Math.ceil(base × multiplier)`
- **Examples**:
  - Base: 5, Multiplier: 1.3 → Price: $7
  - Base: 4, Multiplier: 1.3 → Price: $6
  - Base: 0.5, Multiplier: 1.3 → Price: $1

### 2. Formula-Based Pricing
- **Description**: Complex pricing based on quality levels and configurations
- **Cost Display**: Shows "Formula"
- **Price Display**: Shows "Variable"
- **Configuration**: JSON-based formula with quality tiers
- **Example Structure**:
```json
{
  "base_cost": 8,
  "qualities": [
    { "name": "1K", "cost": 8 },
    { "name": "2K", "cost": 12 },
    { "name": "4K", "cost": 18 }
  ]
}
```

## Price Calculation Function

### getFixedPrice(base, multiplier)
```typescript
function getFixedPrice(base: number, multiplier: number): number {
  return Math.ceil(base * multiplier);
}
```

**Purpose**: Calculates fixed pricing with rounding up to nearest whole number.

**Parameters**:
- `base`: Base credit cost (number)
- `multiplier`: Pricing multiplier (number)

**Returns**: Rounded up whole number price

**Examples**:
- `getFixedPrice(5, 1.3)` → `Math.ceil(6.5)` → `7`
- `getFixedPrice(4, 1.3)` → `Math.ceil(5.2)` → `6`
- `getFixedPrice(0.1, 1.3)` → `Math.ceil(0.13)` → `1`

## Display Logic

### Table View Columns
1. **Model Name**: Display name and ID
2. **Model ID**: Technical identifier
3. **Type**: Image/Video
4. **Pricing Type**: Fixed/Formula
5. **Status**: Active/Inactive
6. **Cost**: Base cost information
   - Fixed: "X credits"
   - Formula: "Formula"
7. **Price**: Calculated price
   - Fixed: "$X" (using getFixedPrice)
   - Formula: "Variable"
8. **Actions**: Edit/Power/More options

### Grid View
- Shows condensed card format with cost and pricing type

### Card View
- Shows detailed card with all model information

## Model Types

### Image Models
- Used for static image generation
- Can have fixed or formula pricing

### Video Models
- Used for video generation
- Can have fixed or formula pricing

## Filter Options

Users can filter by:
- **Search**: Model name or ID
- **Pricing Type**: Fixed/Formula
- **Model Type**: Image/Video
- **Status**: Active/Inactive
- **Favorites**: Show only starred models

## Admin Features

### Edit Modal
- **Fixed Pricing**: Configure base cost and multiplier
- **Formula Pricing**: Configure base cost, multiplier, and JSON formula

### Multiplier Configuration
- Available for both fixed and formula pricing types
- Applied to base cost for final price calculation
- Default multiplier: 1.3 (but configurable)

## Examples

### Fixed Pricing Example
- **Model**: Flux 2 Pro
- **Type**: Video
- **Base Cost**: 5 credits
- **Multiplier**: 1.3
- **Calculated Price**: $7
- **Display**: "5 credits" in Cost, "$7" in Price

### Formula Pricing Example
- **Model**: Nano Banana 2
- **Type**: Image
- **Base Cost**: 8 credits
- **Multiplier**: 1.3
- **Formula**: JSON with quality tiers
- **Display**: "Formula" in Cost, "Variable" in Price

## Notes

- All prices are rounded up using Math.ceil() for fixed pricing
- Formula pricing shows as "Variable" since cost depends on quality selection
- Multiplier is configurable per model
- Base cost represents the fundamental credit cost before multiplier application