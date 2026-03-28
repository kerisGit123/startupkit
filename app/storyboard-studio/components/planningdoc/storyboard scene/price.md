# AI Model Pricing Documentation

## Updated Pricing Structure (March 2026)

### Seedance 1.5 Pro - Video Generation

**Model Type**: Video Generation with Audio Support

**Base Cost**: 7 credits

**Pricing Formula**: `base × factor × resolutionMultiplier × audioMultiplier × durationMultiplier`

**Resolution Multipliers**:
- 480p: 1.0x
- 720p: 2.0x  
- 1080p: 4.0x
- 4K: 5.0x

**Audio Multiplier**: 2.0x (when enabled)

**Duration Multipliers** (4-second intervals):
- 0-4s: 1.0x
- 5-8s: 2.0x
- 9-12s: 4.0x
- 13s+: Additional 4-second blocks

**Pricing Examples** (with 1.3 factor):
- 480p, 4s, no audio: 7 × 1.3 × 1 × 1 = 9.1 → **10 credits**
- 720p, 8s, with audio: 7 × 1.3 × 2 × 2 × 2 = 72.8 → **73 credits**
- 1080p, 12s, with audio: 7 × 1.3 × 4 × 2 × 4 = 145.6 → **146 credits**

**Implementation**: `getSeedance15(base, multiplier, resolution, audio, duration)`

---

### Nano Banana 2 - Image Generation

**Model Type**: Image Generation

**Base Cost**: 8 credits

**Pricing Formula**: `base × factor × qualityMultiplier`

**Quality Multipliers**:
- 1K: 1.0x
- 2K: 1.5x
- 4K: 2.25x

**Pricing Examples** (with 1.3 factor):
- 1K quality: 8 × 1.3 × 1 = 10.4 → **11 credits**
- 2K quality: 8 × 1.3 × 1.5 = 15.6 → **16 credits**
- 4K quality: 8 × 1.3 × 2.25 = 23.4 → **24 credits**

**Implementation**: `getNanoBananaPrice(base, multiplier, quality)`

---

### Topaz Upscale - Image Upscaling

**Model Type**: Image Upscaling

**Base Cost**: 10 credits

**Pricing Formula**: `base × factor × upscaleMultiplier`

**Quality to Upscale Mapping**:
- 1K → 1x upscale
- 2K → 2x upscale
- 4K → 4x upscale

**Upscale Multipliers**:
- 1x: 1.0x
- 2x: 2.0x
- 3x: 3.0x
- 4x: 4.0x

**Pricing Examples** (with 1.3 factor):
- 1K (1x): 10 × 1.3 × 1 = 13 → **13 credits**
- 2K (2x): 10 × 1.3 × 2 = 26 → **26 credits**
- 4K (4x): 10 × 1.3 × 4 = 52 → **52 credits**

**Implementation**: `getTopazUpscale(base, multiplier, quality)`

---

## Legacy Models (Fixed Pricing)

### Flux 2 Pro - Image Generation

**Model Types**: Pro Text To Image, Pro Image To Image, Flex Text To Image, Flex Image To Image

**Pricing**: 
- 1K: 5 credits (~$0.025)
- 2K: 7 credits (~$0.035)
- Up to 8 reference images at no extra cost

**High-tier top-ups** (+10% bonus):
- 1K: ~$0.0225
- 2K: ~$0.0315

---

### Ideogram Character Edit

**Model Types**: Character, Character Edit, Character Remix

**Pricing**:
- Turbo: 12 credits ($0.06)
- Balanced: 18 credits ($0.09)
- Quality: 24 credits ($0.12)

**High-tier top-ups** (+10% bonus):
- Turbo: ~$0.055
- Balanced: ~$0.082
- Quality: ~$0.109

---

### GPT Image 1.5

**Model Types**: 1.5 Text To Image, 1.5 Image To Image

**Pricing**:
- Medium quality: 4 credits ($0.02)
- High quality: 22 credits ($0.11)

**High-tier top-ups** (+10% bonus):
- Medium: ~$0.018
- High: ~$0.10

---

### Nano Banana Edit

**Model Types**: Nano Banana Edit, Nano Banana, Nano Banana Pro

**Pricing**: 4 credits per image (~$0.02)

**High-tier top-ups** (+10% bonus): ~$0.018

---

### Qwen Image to Image

**Model Types**: Text To Image, Image To Image

**Pricing**: 4 credits per image (= $0.02)

**High-tier top-ups** (+10% bonus): ~$0.018

---

## Pricing Management Implementation

### Quality-Based Pricing System
- **Dynamic Quality Selection**: Real-time quality dropdown for image models
- **Formula JSON Integration**: Direct cost extraction from model configuration
- **Factor Application**: Consistent 1.3x multiplier across formula-based models
- **Real-time Updates**: Immediate credit recalculation on parameter changes

### Testing Interface
- **Tab-Based UI**: Separate Models and Testing tabs
- **Model-Aware Parameters**: Dynamic parameter display based on model type
- **Function-Based Calculations**: Uses assigned pricing functions for accuracy
- **Real-time Validation**: Instant feedback on pricing calculations

### Admin Features
- **CRUD Operations**: Complete model management interface
- **Multiple View Modes**: Table, grid, and card views
- **Dark Theme**: Consistent LTX Studio styling
- **Search and Filtering**: Advanced model discovery capabilities

---

*Last Updated: March 28, 2026*