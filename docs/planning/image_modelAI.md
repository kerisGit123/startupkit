# Kie AI API — Complete Implementation Guide

> **Purpose**: Reference guide for Kie AI model capabilities, request patterns, and example payloads used by Storyboard Studio image workflows
> **Scope**: model catalog, provider request structure, example API patterns, and implementation notes that support image-generation surfaces
> **Status**: Active reference, but no longer the sole source of truth for pricing or generated-asset lifecycle behavior
> **Updated**: April 2026 - aligned with current Storyboard Studio planning doc boundaries

---

## ✅ Current Role in the Planning Doc Set

- **This file is now best treated as a provider/model reference**, not the primary source of truth for Storyboard Studio architecture
- **Runtime pricing logic** is documented in `plan_price_management.md`
- **Image generation surface behavior** is documented in `plan_imageAIPanel.md`
- **Edit-image / crop / mask workflows** are documented in `plan_EditImageAIPanel.md`
- **Generated-image persistence, callback completion, and GPT final-output flow** are documented in `plan_generatedImage_final02.md`
- **File persistence and R2 storage architecture** are documented in `plan_file_final.md`

### **What this file should focus on**

- which Kie AI image models are relevant to Storyboard Studio
- what request payload shapes and provider parameters look like
- how model capabilities differ at a provider-reference level
- implementation examples that help explain provider usage patterns

### **What this file should not be the source of truth for**

- final UI pricing display rules
- generated asset persistence architecture
- panel ownership boundaries
- file browser / callback-completed asset lifecycle behavior

## 🎯 **Kie AI Overview**

Kie AI provides unified access to the best AI models through a single API. For image generation, they offer premium models including Flux.1, Ideogram, Nano Banana, and more with competitive credit-based pricing.

### **🔗 Base API Information**

- **Base URL**: `https://api.kie.ai/api/v1/jobs/createTask`
- **Authentication**: Bearer token (`Authorization: Bearer YOUR_API_KEY`)
- **Method**: POST
- **Response Format**: JSON with `taskId` for async processing

### **💳 Credit System**

- **1 Credit** = $0.0025 (400 credits = $1.00)
- **Models range**: 1-45 credits per generation
- **Billing**: Per-generation, not per-request
- **Quality-Based Pricing**: Dynamic pricing based on resolution/quality
- **Free Trial**: Available in playground

---

## 🎨 **Image Generation Models**

### **📊 Updated Model Pricing (March 2026)**

| Model | Base Credits | Quality Multipliers | Max References | Best For |
| --- | --- | --- | --- | --- |
| **Text-to-Image** |  |  |  |  |
| `gpt-image/1.5-text-to-image` | 4 | 1x (fixed) | 0 | Photorealistic |
| `flux-2/flex-text-to-image` | 5 | 1K:1x, 2K:1.4x | 0 | High quality |
| **Image-to-Image** |  |  |  |  |
| `flux-2/flex-image-to-image` | 5 | 1K:1x, 2K:1.4x | 7 | General editing |
| `flux-2/pro-image-to-image` | 5 | 1K:1x, 2K:1.4x | 7 | Professional |
| `gpt-image/1.5-image-to-image` | 4 | 1x (fixed) | 15 | Character editing |
| `nano-banana-2` | 8 | 1K:1x, 2K:1.5x, 4K:2.25x | 13 | Text translation |
| `ideogram/character-remix` | 12 | 1x (fixed) | 4 | Character consistency |
| `qwen/image-edit` | 4 | 1x (fixed) | 0 | Quick edits |
| `google/nano-banana-edit` | 4 | 1x (fixed) | 0 | Style transfer |
| `seedream/5-lite-image-to-image` | 4 | 1x (fixed) | 13 | Lighting effects |
| **Video Generation** |  |  |  |  |
| `kling-3.0/motion-control` | per-second | 720p/1080p | 1 video | Motion control |
| `bytedance/seedance-2` | per-second | 480p/720p | 9 img, 3 vid, 3 aud | Video generation |
| **Upscale** |  |  |  |  |
| `recraft/crisp-upscale` | 1 | 1x (fixed) | 0 | Quality enhancement |
| `topaz/image-upscale` | 10 | 1K:1x, 2K:2x, 4K:4x | 0 | Professional upscale |

### **💰 Quality-Based Pricing Examples**

#### **Nano Banana 2 (Formula-Based)**

- **Base**: 8 credits with 1.3x factor
- **1K Quality**: 8 × 1.3 × 1 = **11 credits**
- **2K Quality**: 8 × 1.3 × 1.5 = **16 credits**  
- **4K Quality**: 8 × 1.3 × 2.25 = **24 credits**

#### **Topaz Upscale (Formula-Based)**

- **Base**: 10 credits with 1.3x factor
- **1K (1x upscale)**: 10 × 1.3 × 1 = **13 credits**
- **2K (2x upscale)**: 10 × 1.3 × 2 = **26 credits**
- **4K (4x upscale)**: 10 × 1.3 × 4 = **52 credits**

#### **Fixed Pricing Models**

- **GPT Image 1.5**: 4 credits × 1.3 = **5 credits**
- **Flux 2 Flex**: 5 credits × 1.3 = **7 credits** (1K), **10 credits** (2K)
- **Ideogram Character**: 12 credits × 1.3 = **16 credits**

---

## 🔧 **API Implementation Patterns**

### **📋 Base Request Structure**

```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'MODEL_NAME',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      // Model-specific parameters
    }
  })
});

const result = await response.json();
console.log(result.taskId); // Use for polling
```

### **🔄 Callback Handling**

```typescript
// Callback endpoint receives POST when task completes
export async function POST(request: Request) {
  const data = await request.json();

  if (data.status === 'completed') {
    // Success: data.result.imageUrl
    console.log('Generated image:', data.result.imageUrl);
  } else if (data.status === 'failed') {
    // Error: data.error
    console.error('Generation failed:', data.error);
  }

  return Response.json({ received: true });
}
```

---

## 🎯 **Model-Specific Implementations**

### **1. Text-to-Image Models**

#### **GPT Image 1.5 Text-to-Image (8 credits)**

```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-image/1.5-text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A photorealistic candid photograph of an elderly sailor standing on a small fishing boat. He has weathered skin with visible wrinkles, pores, and sun texture, and a few faded traditional sailor tattoos on his arms. Shot like a 35mm film photograph, medium close-up at eye level, using a 50mm lens.",
      "aspect_ratio": "3:2",
      "quality": "medium"
    }
  })
});
```

#### **Flux 2 Flex Text-to-Image (40 credits)**

```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'flux-2/flex-text-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A humanoid figure with a vintage television set for a head, featuring a green-tinted screen displaying 'Hello FLUX.2' writing in ASCII font. The figure is wearing a yellow raincoat.",
      "aspect_ratio": "1:1",
      "resolution": "1K"
    }
  })
});
```

### **2. Image-to-Image Models**

#### **Flux 2 Flex Image-to-Image (15-30 credits)**

```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'flux-2/flex-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://example.com/image1.jpg",
        "https://example.com/image2.jpg"
      ],
      "prompt": "Replace the can in image 2 with the can from image 1",
      "aspect_ratio": "1:1",
      "resolution": "1K"
    }
  })
});
```

#### **Flux 2 Pro Image-to-Image (15 credits)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'flux-2/pro-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://example.com/original.jpg",
        "https://example.com/reference.jpg"
      ],
      "prompt": "Change the man into the outfit shown in picture two, full-body photo.",
      "aspect_ratio": "4:3",
      "resolution": "1K"
    }
  })
});
```

#### **GPT Image 1.5 Image-to-Image (45 credits)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'gpt-image/1.5-image-to-image',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "input_urls": [
        "https://example.com/original.jpg"
      ],
      "prompt": "Change her clothing to an elegant blue evening gown. Preserve her face, identity, hairstyle, pose, body shape, background, lighting, and camera angle exactly as in the original image.",
      "aspect_ratio": "3:2",
      "quality": "medium"
    }
  })
});
```

#### **Nano Banana 2 (36-40 credits)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'nano-banana-2',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "translation of all the text to Hindi.",
      "image_input": [
        "https://example.com/text-image.jpg"
      ],
      "aspect_ratio": "auto",
      "google_search": false,
      "resolution": "1K",
      "output_format": "jpg"
    }
  })
});
```

#### **Ideogram Character Remix (40 credits)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'ideogram/character-remix',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A fisheye lens selfie photograph taken at night on an urban street. The image is circular with a black border and shows a person wearing dark sunglasses and a black jacket.",
      "image_url": "https://example.com/character.jpg",
      "reference_image_urls": [
        "https://example.com/reference1.jpg",
        "https://example.com/reference2.jpg"
      ],
      "rendering_speed": "BALANCED",
      "style": "AUTO",
      "expand_prompt": true,
      "image_size": "square_hd",
      "num_images": "1",
      "strength": 0.8
    }
  })
});
```

#### **Qwen Image Edit (10 credits)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'qwen/image-edit',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image_url": "https://example.com/source.jpg",
      "prompt": "Change the lighting effect to warm sunset",
      "image_size": "square_hd",
      "num_inference_steps": 25,
      "guidance_scale": 4,
      "sync_mode": false,
      "enable_safety_checker": true,
      "output_format": "png",
      "negative_prompt": "blurry, ugly, distorted"
    }
  })
});
```

### **3. Video Generation Models**

#### **Kling 3.0 Motion Control**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'kling-3.0/motion-control',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A cinematic slow-motion shot of a warrior drawing a sword",
      "resolution": "1080p",        // 720p | 1080p
      "duration": 5,                // per-second pricing
      "orientation": "image",       // "image" | "video"
      "background_source": "input_image", // "input_video" | "input_image"
      "input_urls": ["https://example.com/reference.mp4"]  // max 1 reference video
    }
  })
});
```

- **Resolution**: 720p, 1080p
- **Pricing**: Per-second, uses `getKlingMotionControl(base, multiplier, resolution, duration)`
- **Orientation**: `image` or `video`
- **Background Source**: `input_video` or `input_image`
- **Max References**: 1 video

#### **Seedance 2.0 (ByteDance)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'bytedance/seedance-2',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "prompt": "A character walking through a forest at sunset",
      "resolution": "720p",          // 480p | 720p
      "duration": 10,                // 4-15 seconds
      "frame_mode": "first",         // "first" | "last" (first frame or last frame)
      "input_urls": ["https://example.com/ref1.jpg"],   // max 9 reference images
      "video_urls": ["https://example.com/clip.mp4"],   // max 3 videos (<=15s)
      "audio_urls": ["https://example.com/audio.mp3"],  // max 3 audio (<=15s)
      "web_search": false,
      "generate_audio": true
    }
  })
});
```

- **Resolution**: 480p, 720p
- **Duration**: 4-15 seconds
- **Pricing**: Uses `getSeedance20(base, multiplier, resolution, hasVideoInput, duration)`
- **Frame Mode**: First frame or last frame reference
- **Max References**: 9 images, 3 videos (<=15s each), 3 audio (<=15s each)
- **Toggles**: `web_search`, `generate_audio`

#### **Grok Imagine Image-to-Video**

```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${apiKey}`
  },
  body: JSON.stringify({
    model: 'grok-imagine/image-to-video',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      prompt: 'A penguin sliding on ice @image1',
      image_urls: ['https://example.com/penguin.png'],  // up to 7 images
      mode: 'normal',
      duration: '6',           // 6-30 seconds (string)
      resolution: '480p',      // 480p | 720p
      aspect_ratio: '16:9'
    }
  })
});
```

- **Resolution**: 480p, 720p
- **Duration**: 6-30 seconds
- **Max References**: 7 images via `image_urls` (use `@image1 @image2` in prompt)
- **Formats**: JPEG, PNG, WEBP (max 10MB each)
- **No `task_id` needed**: Use `image_urls` for external URLs (don't mix with `task_id`)
- **Pricing**: Formula-based with resolution multiplier
- **API Route**: `/api/storyboard/generate-grok` → `generateGrokImagineVideo()` in videoAI.ts

### **4. Upscale Models**

#### **Recraft Crisp Upscale (1 credit)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'recraft/crisp-upscale',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image": "https://example.com/low-res-image.jpg"
    }
  })
});
```

#### **Topaz Image Upscale (20 credits)**
```typescript
const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
  },
  body: JSON.stringify({
    model: 'topaz/image-upscale',
    callBackUrl: 'https://your-domain.com/api/callback',
    input: {
      "image": "https://example.com/medium-res-image.jpg"
    }
  })
});
```

---

## 🎛️ **Parameter Reference**

### **📐 Aspect Ratios**
| Ratio | Description | Models |
|-------|-------------|---------|
| `1:1` | Square | Most models |
| `4:3` | Landscape | Flux 2 Pro, Nano Banana 2 |
| `3:4` | Portrait | Flux 2 Pro, Nano Banana 2 |
| `16:9` | Widescreen | Flux 2 Pro, Nano Banana 2 |
| `9:16` | Vertical | Flux 2 Pro, Nano Banana 2 |
| `3:2` | Classic | GPT Image, Nano Banana 2 |
| `2:3` | Classic Portrait | Flux 2 Pro, Nano Banana 2 |
| `auto` | Auto-detect | Flux 2 Flex, Nano Banana 2 |

### **🎯 Resolution Options**
| Resolution | Description | Models |
|------------|-------------|---------|
| `1K` | Standard (1024px) | Most models |
| `2K` | High (2048px) | Nano Banana 2, Flux 2 Flex |
| `4K` | Ultra (4096px) | Nano Banana 2 |

### **🖼️ Output Formats**
| Format | Description | Models |
|--------|-------------|---------|
| `jpg` | JPEG (smaller) | Nano Banana 2 |
| `png` | PNG (transparent) | Qwen Image Edit |

---

## 🔧 **Implementation Best Practices**

### **🏗️ Error Handling**
```typescript
async function generateImage(model: string, input: any) {
  try {
    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`
      },
      body: JSON.stringify({
        model,
        callBackUrl: 'https://your-domain.com/api/callback',
        input
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.taskId) {
      throw new Error('No taskId received from Kie AI');
    }

    return result.taskId;
  } catch (error) {
    console.error('Kie AI generation failed:', error);
    throw error;
  }
}
```

### **⏱️ Polling for Results**
```typescript
async function pollForResult(taskId: string, timeout: number = 300000) {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(`https://api.kie.ai/api/v1/jobs/status/${taskId}`);
      const result = await response.json();

      if (result.status === 'completed') {
        return result.result.imageUrl;
      } else if (result.status === 'failed') {
        throw new Error(result.error || 'Generation failed');
      }

      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Polling error:', error);
      throw error;
    }
  }

  throw new Error(`Polling timed out after ${timeout}ms`);
}
```

> **Note**: For credit calculations and pricing, see `plan_price_management.md`.

### **🔒 Security Best Practices**
```typescript
// Server-side only - never expose API key to client
const KIE_AI_API_KEY = process.env.KIE_AI_API_KEY;

if (!KIE_AI_API_KEY) {
  throw new Error('KIE_AI_API_KEY environment variable is required');
}
```

---

## 🚀 **Integration Examples**

### **🎨 Complete Image Generation Service**
```typescript
class KieAIService {
  private apiKey: string;
  private callbackUrl: string;

  constructor(apiKey: string, callbackUrl: string) {
    this.apiKey = apiKey;
    this.callbackUrl = callbackUrl;
  }

  async generateImage(model: string, prompt: string, options: any = {}) {
    const input = {
      prompt,
      ...options
    };

    const response = await fetch('https://api.kie.ai/api/v1/jobs/createTask', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model,
        callBackUrl: this.callbackUrl,
        input
      })
    });

    const result = await response.json();
    return result.taskId;
  }

  async generateWithImages(model: string, prompt: string, imageUrls: string[], options: any = {}) {
    const input = {
      prompt,
      input_urls: imageUrls,
      ...options
    };

    return this.generateImage(model, prompt, input);
  }

  async upscaleImage(imageUrl: string, model: string = 'recraft/crisp-upscale') {
    return this.generateImage(model, '', { image: imageUrl });
  }
}
```

### **📱 React Hook Integration**
```typescript
import { useState, useCallback } from 'react';

export function useKieAI() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateImage = useCallback(async (model: string, input: any) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ model, input })
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Generation failed');
      }

      return result.taskId;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      setIsGenerating(false);
    }
  }, []);

  return { generateImage, isGenerating, error };
}
```

---

## 📊 **Performance & Optimization**

### **⚡ Request Optimization**
- **Batch Requests**: Process multiple images in parallel
- **Callback URLs**: Use webhooks instead of polling when possible
- **Timeout Handling**: Set reasonable timeouts (5 minutes max)
- **Retry Logic**: Implement exponential backoff for failures

### **💾 Cost Optimization**
- **Model Selection**: Choose appropriate model for task complexity
- **Resolution Settings**: Use 1K for drafts, 2K/4K for finals
- **Reference Limits**: Don't exceed model's max reference images
- **Batch Processing**: Group similar requests to optimize costs

### **🔍 Monitoring & Logging**
```typescript
// Log all API calls for monitoring
const logApiCall = (model: string, credits: number, success: boolean) => {
  console.log(`Kie AI Call: ${model} (${credits} credits) - ${success ? 'SUCCESS' : 'FAILED'}`);
  
  // Send to monitoring service
  if (process.env.MONITORING_WEBHOOK) {
    fetch(process.env.MONITORING_WEBHOOK, {
      method: 'POST',
      body: JSON.stringify({
        service: 'kie-ai',
        model,
        credits,
        success,
        timestamp: new Date().toISOString()
      })
    });
  }
};
```

---

## 🎯 **Quick Reference Cheat Sheet**

### **🔥 Most Popular Models**
```typescript
// Quick copy-paste examples

// Text to Image (8 credits)
gpt-image/1.5-text-to-image
{ prompt: "...", aspect_ratio: "3:2", quality: "medium" }

// Image to Image (15 credits)  
flux-2/flex-image-to-image
{ input_urls: [...], prompt: "...", aspect_ratio: "1:1", resolution: "1K" }

// Character Remix (40 credits)
ideogram/character-remix
{ image_url: "...", reference_image_urls: [...], prompt: "...", image_size: "square_hd" }

// Upscale (1 credit)
recraft/crisp-upscale
{ image: "..." }
```

### **📱 Environment Setup**
```bash
# .env.local
KIE_AI_API_KEY=your_api_key_here
KIE_AI_CALLBACK_URL=https://your-domain.com/api/callback
```

### **🔗 API Endpoints**
```typescript
// Create task
POST https://api.kie.ai/api/v1/jobs/createTask

// Check status  
GET https://api.kie.ai/api/v1/jobs/status/{taskId}

// Webhook callback
POST https://your-domain.com/api/callback
```

---

## 🎉 **Success Metrics**

### **📈 Performance Targets**
- **API Response Time**: < 2 seconds
- **Generation Success Rate**: > 95%
- **Callback Delivery**: > 99%
- **Credit Accuracy**: 100%

### **🎯 Implementation Checklist**
- ✅ API key configured securely
- ✅ Callback endpoint implemented
- ✅ Error handling in place
- ✅ Credit tracking implemented
- ✅ Model validation added
- ✅ Timeout handling configured
- ✅ Monitoring/logging set up

---

*This guide provides everything you need to successfully integrate Kie AI image generation models into your application. Start with the basic patterns and gradually implement advanced features as needed! 🚀*