# Model Map Documentation

## Overview

The **Model Map** is a configuration system that maps frontend model identifiers to their corresponding KIE AI backend model IDs. This allows the application to use user-friendly model names while correctly routing requests to the appropriate KIE AI endpoints.

## How It Works

1. **Frontend Model Key**: The user-facing name (e.g., `character-edit`)
2. **KIE API Model ID**: The actual model ID used by KIE AI (e.g., `ideogram/character-edit`)

The model map is defined in `app/api/n8n-image-proxy/route.ts` and is automatically generated from the `MODEL_CONFIGS` object.

## Adding or Updating Models

### Step 1: Add Model Configuration

Open `app/api/n8n-image-proxy/route.ts` and find the `MODEL_CONFIGS` object. Add or update your model:

```typescript
'my-model-name': {
  frontendModel: 'my-model-name',      // User-facing name
  kieApiModel: 'provider/model-id',    // Actual KIE API model ID
  displayName: 'My Model',             // Display name in UI
  family: 'provider-name',             // Model family
  capabilities: ['image-to-image'],    // Supported features
  refMode: 'single',                   // Reference image mode
  supportsImages: true,                // Supports image input
  supportsMultipleReferences: false,   // Supports multiple reference images
  supportsTextOnly: false,             // Supports text-only generation
  requestTemplate: {
    required: ['prompt'],              // Required fields
    optional: ['image_url'],           // Optional fields
    excluded: []                       // Excluded fields
  }
}
```

### Step 2: Update Brush Inpaint (if needed)

If you're adding a new model for brush inpainting, update `SceneEditor.tsx`:

1. Update the `inpaintModel` state default if needed
2. Update the API call to use the correct model name in the request body

### Step 3: Test

Restart your development server and test the new model.

---

## Available Models

### Image-to-Image Models

| Frontend Key | KIE API Model | Description |
|--------------|---------------|-------------|
| `nano-banana-2` | `nano-banana-2` | Nano Banana 2 - Fast image generation |
| `nano-banana-edit` | `nano-banana/image-to-image` | Nano Banana for image editing |
| `gpt-image` | `gpt-image` | GPT Image - OpenAI's image model |
| `gpt-image-1-1` | `gpt-image` | GPT Image 1:1 aspect ratio |
| `qwen` | `qwen/image-to-image` | Qwen image-to-image |
| `qwen-z-image` | `qwen/image-edit` | Qwen image editing |
| `grok` | `grok-imagine/image-to-image` | Grok Imagine |
| `flux-2-flex-image-to-image` | `flux-2/flex-image-to-image` | Flux 2 Flex image-to-image |
| `flux-kontext-pro` | `flux-kontext-pro` | Flux Kontext Pro |
| `flux-fill` | `black-forest-labs/flux-1.1-fill` | Flux Fill - Inpainting/Outpainting |

### Text-to-Image Models

| Frontend Key | KIE API Model | Description |
|--------------|---------------|-------------|
| `seedream-5.0-lite-text` | `seedream/5-lite-text-to-image` | Seedream 5.0 Lite text-to-image |
| `seedream-4.5` | `seedream/4.5-text-to-image` | Seedream 4.5 text-to-image |
| `seedream-v4` | `bytedance/seedream-v4` | ByteDance Seedream V4 |
| `qwen-text` | `qwen/text-to-image` | Qwen text-to-image |
| `flux-2-flex-text-to-image` | `flux-2/flex-text-to-image` | Flux 2 Flex text-to-image |

### Image-to-Image (Specialized)

| Frontend Key | KIE API Model | Description |
|--------------|---------------|-------------|
| `character-edit` | `ideogram/character-edit` | Character Edit - Edit character in image |
| `character-remix` | `ideogram/character-remix` | Character Remix - Remix character style |
| `ideogram-reframe` | `ideogram/v3-reframe` | Ideogram reframe |

### Utility Models

| Frontend Key | KIE API Model | Description |
|--------------|---------------|-------------|
| `seedream-5.0-lite-image` | `seedream/5-lite-image-to-image` | Seedream 5.0 Lite image-to-image |
| `topaz-upscale` | `topaz/image-upscale` | Topaz image upscaling |

---

## Model Capabilities

### Capability Flags

- **image-to-image**: Can transform existing images
- **single-reference**: Supports single reference image
- **multi-reference**: Supports multiple reference images
- **text-to-image**: Supports text-only generation

### Reference Image Modes

- **single**: Use one reference image
- **multiple**: Use multiple reference images
- **none**: No reference images needed

---

## Quick Reference

### For Brush Inpaint (Character Edit)

Use `ideogram/character-edit` for character editing with brush mask.

```typescript
const requestBody = {
  model: 'ideogram/character-edit',
  input: {
    prompt: 'your prompt',
    image_url: 'https://...',
    mask_url: 'https://...',
    reference_image_urls: ['https://...'],
    rendering_speed: 'BALANCED',
    style: 'AUTO',
    expand_prompt: true,
    num_images: '1'
  }
};
```

### For Rectangle Inpaint

Use `flux-fill` for inpainting with rectangle selection.

---

## Troubleshooting

### "Model not found" Error

1. Check if the model is in `MODEL_CONFIGS`
2. Verify the `kieApiModel` is correct
3. Ensure the model is in the `MODEL_MAP`

### API Key Issues

If you get 401/403 errors:
1. Verify `KIE_AI_API_KEY` is set in `.env.local`
2. Ensure the key is a valid JWT token (starts with `eyJ...`)
3. Check the key has permissions for the model

### Image Upload Issues

If images fail to upload:
1. Check the upload endpoint (`/api/upload`)
2. Verify external services are accessible
3. Fallback to base64 if needed (won't work with KIE)