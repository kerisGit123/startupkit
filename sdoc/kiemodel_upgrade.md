# KIE Model Management Guide

## 📋 Overview

This guide explains how to add, upgrade, and manage KIE AI models in the centralized configuration system. The system uses a configuration-driven approach that eliminates hardcoded logic and makes model management simple and error-free.

## 🏗️ System Architecture

### Configuration Location
- **File**: `app/api/n8n-image-proxy/route.ts`
- **Section**: `MODEL_CONFIGS` (lines ~32-350)
- **Type**: TypeScript interface `KieModelConfig`

### Key Components
1. **Model Configurations** - Central model definitions
2. **Request Builder** - Dynamic API request generation
3. **Validation System** - Automatic model compatibility checks
4. **Fallback Logic** - Graceful error handling

## 🎯 Model Types and Usage

### 1. Text-to-Image Models
**Purpose**: Generate images from text prompts only
**Examples**: `seedream-5.0-lite-text`, `flux-2-flex-text-to-image`

**Configuration Template**:
```typescript
'model-name': {
  frontendModel: 'model-name',
  kieApiModel: 'kie-api-model-name',
  displayName: 'Display Name',
  family: 'seedream',
  capabilities: ['text-to-image', 'text-only'],
  refMode: 'text',
  supportsImages: false,
  supportsMultipleReferences: false,
  supportsTextOnly: true,
  requestTemplate: {
    required: ['prompt'],
    optional: ['aspect_ratio'],
    excluded: ['image_urls', 'image_url']
  }
}
```

**Usage**: Pure text generation, no images allowed
**Common Fields**: `prompt`, `aspect_ratio`, `quality`

---

### 2. Image-to-Image Models (Single Reference)
**Purpose**: Edit or transform single images
**Examples**: `gpt-image`, `topaz-upscale`, `ideogram-reframe`

**Configuration Template**:
```typescript
'model-name': {
  frontendModel: 'model-name',
  kieApiModel: 'kie-api-model-name',
  displayName: 'Display Name',
  family: 'model-family',
  capabilities: ['image-to-image', 'single-reference'],
  refMode: 'single',
  supportsImages: true,
  supportsMultipleReferences: false,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['image_url'],
    optional: ['aspect_ratio', 'quality'],
    excluded: ['image_urls', 'reference_image_urls']
  }
}
```

**Usage**: Single image processing
**Common Fields**: `image_url`, `prompt` (optional), model-specific fields

---

### 3. Image-to-Image Models (Multi-Reference)
**Purpose**: Process multiple reference images
**Examples**: `seedream-5.0-lite-image`, `nano-banana-2`, `flux-kontext-pro`

**Configuration Template**:
```typescript
'model-name': {
  frontendModel: 'model-name',
  kieApiModel: 'kie-api-model-name',
  displayName: 'Display Name',
  family: 'model-family',
  capabilities: ['image-to-image', 'multi-reference'],
  refMode: 'multi',
  supportsImages: true,
  supportsMultipleReferences: true,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['prompt', 'image_urls'],
    optional: ['aspect_ratio', 'quality'],
    excluded: ['image_url']
  }
}
```

**Usage**: Multiple reference image processing
**Common Fields**: `image_urls`, `prompt`, model-specific fields

---

## 🔧 How to Add New Models

### Step 1: Identify Model Type
Determine which category your model fits:
- **Text-only**: No images, just text → Text-to-Image
- **Single image**: One base image → Single Reference
- **Multiple images**: Base + references → Multi-Reference

### Step 2: Get API Requirements
From the KIE AI documentation or example code:
```python
# Example API call
response = requests.post(url, json={
    "model": "new-model-name",
    "input": {
        "prompt": "required field",
        "image_url": "required for image models",
        "optional_field": "optional value"
    }
})
```

### Step 3: Add Configuration
Insert into `MODEL_CONFIGS` object:

```typescript
// Add this entry to MODEL_CONFIGS
'new-model': {
  frontendModel: 'new-model',
  kieApiModel: 'kie-api-model-name',
  displayName: 'New Model',
  family: 'new-family',  // Add to ModelFamily type if new
  capabilities: ['image-to-image', 'single-reference'],
  refMode: 'single',
  supportsImages: true,
  supportsMultipleReferences: false,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['prompt', 'image_url'],  // From API docs
    optional: ['optional_field'],      // From API docs
    excluded: ['unsupported_field']    // Fields that cause errors
  }
}
```

### Step 4: Add Field Handling (if needed)
If the model uses unique field names, add them to `buildRequestFromConfig`:

```typescript
// In buildRequestFromConfig function, add new case:
case 'unique_field':
  request.unique_field = 'default_value';
  break;
```

### Step 5: Update Type Definitions (if new family)
Add new family to `ModelFamily` type:

```typescript
type ModelFamily = 'seedream' | 'flux' | 'nano-banana' | 'gpt-image' | 'qwen' | 'grok' | 'ideogram' | 'topaz' | 'new-family';
```

## 🔄 How to Upgrade Existing Models

### Scenario 1: API Field Changes
**Problem**: Model now requires different fields

**Solution**: Update `requestTemplate`:
```typescript
// Before
requestTemplate: {
  required: ['prompt', 'old_field'],
  optional: [],
  excluded: []
}

// After
requestTemplate: {
  required: ['prompt', 'new_field'],
  optional: ['optional_new_field'],
  excluded: ['old_field']  // Exclude deprecated field
}
```

### Scenario 2: Model Name Change
**Problem**: KIE API model name changed

**Solution**: Update `kieApiModel`:
```typescript
// Before
kieApiModel: 'old-model-name',

// After
kieApiModel: 'new-model-name',
```

### Scenario 3: Capability Changes
**Problem**: Model now supports multiple references

**Solution**: Update capabilities and refMode:
```typescript
// Before
capabilities: ['image-to-image', 'single-reference'],
refMode: 'single',
supportsMultipleReferences: false,

// After
capabilities: ['image-to-image', 'multi-reference'],
refMode: 'multi',
supportsMultipleReferences: true,
```

## 📝 Model Field Reference

### Common Fields
| Field | Type | Usage | Models |
|-------|------|-------|--------|
| `prompt` | string | Text description | Most models |
| `image_url` | string | Single image URL | Single reference models |
| `image_urls` | array | Multiple image URLs | Multi-reference models |
| `aspect_ratio` | string | Image ratio (16:9, 1:1) | Most image models |
| `quality` | string | Output quality (basic, standard) | Some models |

### Special Fields by Model Family

#### Ideogram Models
- `reference_image_urls` - Reference images array
- `rendering_speed` - BALANCED/FAST
- `style` - AUTO/CUSTOM
- `expand_prompt` - boolean
- `image_size` - square_hd, landscape_16_9, etc.
- `num_images` - "1"
- `strength` - number (0.8)
- `seed` - number (0 for reproducible)

#### Topaz Models
- `upscale_factor` - "2", "4"

#### Nano Banana Models
- `image_input` - Alternative to image_urls
- `google_search` - boolean
- `resolution` - "1K"

#### Seedream Models
- `quality` - "basic"
- Different field names for different versions

## 🚀 Quick Reference Templates

### Text-to-Image Model Template
```typescript
'model-name': {
  frontendModel: 'model-name',
  kieApiModel: 'kie-api-model',
  displayName: 'Display Name',
  family: 'family',
  capabilities: ['text-to-image', 'text-only'],
  refMode: 'text',
  supportsImages: false,
  supportsMultipleReferences: false,
  supportsTextOnly: true,
  requestTemplate: {
    required: ['prompt'],
    optional: ['aspect_ratio'],
    excluded: ['image_urls', 'image_url']
  }
}
```

### Single Reference Image Model Template
```typescript
'model-name': {
  frontendModel: 'model-name',
  kieApiModel: 'kie-api-model',
  displayName: 'Display Name',
  family: 'family',
  capabilities: ['image-to-image', 'single-reference'],
  refMode: 'single',
  supportsImages: true,
  supportsMultipleReferences: false,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['image_url'],
    optional: ['prompt', 'aspect_ratio'],
    excluded: ['image_urls']
  }
}
```

### Multi Reference Image Model Template
```typescript
'model-name': {
  frontendModel: 'model-name',
  kieApiModel: 'kie-api-model',
  displayName: 'Display Name',
  family: 'family',
  capabilities: ['image-to-image', 'multi-reference'],
  refMode: 'multi',
  supportsImages: true,
  supportsMultipleReferences: true,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['prompt', 'image_urls'],
    optional: ['aspect_ratio'],
    excluded: ['image_url']
  }
}
```

## ⚠️ Common Pitfalls to Avoid

### 1. Wrong Field Names
**Problem**: Using `image_urls` when model expects `image_url`
**Solution**: Check API documentation carefully

### 2. Missing Required Fields
**Problem**: Forgetting to add required fields to template
**Solution**: Always include all required fields from API docs

### 3. Including Excluded Fields
**Problem**: Sending fields that cause API errors
**Solution**: Add problematic fields to `excluded` array

### 4. Wrong Capability Flags
**Problem**: Setting `supportsMultipleReferences: false` for multi-ref model
**Solution**: Match capabilities to actual model behavior

### 5. Forgetting Field Handlers
**Problem**: New field not processed by request builder
**Solution**: Add case in `buildRequestFromConfig` function

## 🔍 Testing New Models

### 1. Configuration Validation
```typescript
// Test model configuration
const config = getModelConfig('new-model');
console.log('Model config:', config);
```

### 2. Request Building Test
```typescript
// Test request building
const request = buildRequestFromConfig(config, {
  prompt: 'test prompt',
  imageUrl: 'https://test.jpg',
  refUrls: [],
  aspectRatio: '16:9'
});
console.log('Generated request:', request);
```

### 3. API Call Test
```typescript
// Test actual API call
const response = await callMarketModel(
  'kie-api-model',
  'new-model',
  'test prompt',
  'https://test.jpg',
  [],
  '16:9'
);
```

## 📚 Examples from Recent Additions

### Topaz Upscale (Simple Model)
```typescript
'topaz-upscale': {
  frontendModel: 'topaz-upscale',
  kieApiModel: 'topaz/image-upscale',
  displayName: 'Topaz Upscale',
  family: 'topaz',
  capabilities: ['image-to-image', 'single-reference'],
  refMode: 'single',
  supportsImages: true,
  supportsMultipleReferences: false,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['image_url'],
    optional: ['upscale_factor'],
    excluded: ['prompt', 'image_urls', 'aspect_ratio', 'quality']
  }
}
```

### Ideogram Reframe (Complex Model)
```typescript
'ideogram-reframe': {
  frontendModel: 'ideogram-reframe',
  kieApiModel: 'ideogram/v3-reframe',
  displayName: 'Ideogram Reframe',
  family: 'ideogram',
  capabilities: ['image-to-image', 'single-reference'],
  refMode: 'single',
  supportsImages: true,
  supportsMultipleReferences: false,
  supportsTextOnly: false,
  requestTemplate: {
    required: ['image_url'],
    optional: ['image_size', 'rendering_speed', 'style', 'num_images', 'seed'],
    excluded: ['prompt', 'image_urls', 'aspect_ratio', 'quality', 'reference_image_urls']
  }
}
```

## 🎯 Best Practices

1. **Always test with real API calls** after adding configuration
2. **Use descriptive names** for frontendModel and displayName
3. **Document special field requirements** in comments
4. **Keep configurations consistent** with similar models
5. **Add validation** for edge cases in request builder
6. **Use excluded fields** to prevent API errors
7. **Test both success and error scenarios**

## 🔄 Model Upgrade Checklist

When upgrading a model:
- [ ] Update `kieApiModel` if changed
- [ ] Update `requestTemplate` fields
- [ ] Add new field handlers if needed
- [ ] Update `capabilities` if behavior changed
- [ ] Test with sample request
- [ ] Verify error handling
- [ ] Update documentation

## 📞 Support

For questions about model configuration:
1. Check existing similar models in `MODEL_CONFIGS`
2. Review KIE AI API documentation
3. Test with minimal configuration first
4. Use browser dev tools to inspect actual API requests
5. Check console logs for validation messages

---

*This documentation should be updated whenever new model types or field patterns are discovered.*