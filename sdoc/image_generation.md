# Image Generation UI Controls

## Dropdown System Overview

The Image Generation UI uses a **use-case driven** dropdown system that automatically selects the appropriate model and displays a colored badge indicating the reference mode.

### Use Case Dropdown (Primary)
- **Purpose**: Select the specific task you want to perform
- **Behavior**: Automatically sets the best model and shows the reference mode badge
- **Options**:
  - 👤 Character Swap → 📸 Multi-Reference
  - 👕 Clothing Swap → 📸 Multi-Reference  
  - 🏞️ Background Swap → 📸 Single Reference
  - 🎨 Style Transfer → 📸 Single Reference
  - 🔧 Object Edit → 📸 Single Reference
  - 😊 Face & Expression → 📸 Single Reference
  - 🌈 Color & Lighting → 📸 Single Reference
  - 🎯 Texture & Material → 📸 Single Reference
  - 🤸 Pose & Position → 📸 Multi-Reference
  - 👒 Accessory Addition → 📸 Single Reference
  - 👥 Age & Gender → 📸 Single Reference
  - 📐 Scene Composition → 📸 Multi-Reference
  - 📦 Product Editing → 📸 Single Reference
  - ✍️ Text to Image → 📝 Text-Only

### Model Dropdown (Secondary)
- **Purpose**: Select a specific AI model for the chosen use case
- **Behavior**: Filtered to show only models suitable for the selected use case
- **Format**: `Model Name — Sub-description`
- **Examples**:
  - `Seedream 4.5 — Up to 10 refs`
  - `Flux Kontext — Context-aware`
  - `Nano Banana — 4K fidelity`
  - `OpenAI 4o — Budget`

### Badge System
| Badge | Color | Reference Mode | Max Images |
|-------|-------|----------------|------------|
| 📸 Multi-Reference | 🟢 Green | Multi-Reference | 3 slots |
| 📸 Single Reference | 🔵 Blue | Single Reference | 1 slot |
| 📝 Text-Only | ⚫ Gray | Text-Only | Hidden |

### Dynamic Reference Image Slots
- **Multi-Reference**: 3 upload slots (3-column grid)
- **Single Reference**: 1 upload slot (full width)
- **Text-Only**: Reference section completely hidden

### Implementation Details

```typescript
// Use case configuration
const USE_CASES = {
  "character-swap": {
    label: "Character Swap",
    emoji: "👤",
    refMode: "multi",
    bestModel: "seedream-4.5",
    models: [
      { value: "seedream-4.5", label: "Seedream 4.5", sub: "Up to 10 refs" },
      { value: "nano-banana", label: "Nano Banana", sub: "High fidelity" },
      { value: "openai-4o", label: "OpenAI 4o", sub: "Budget" }
    ]
  },
  // ... other use cases
};

// Badge colors
const refModeBadge = {
  multi:  { label: "📸 Multi-Reference",  color: "bg-green-500/20 text-green-300 border-green-500/30" },
  single: { label: "📸 Single Reference", color: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
  text:   { label: "📝 Text-Only",         color: "bg-gray-500/20 text-gray-300 border-gray-500/30" }
};
```

### Styling (pic3 style)
- **Background**: `bg-[#13131a]` (dark)
- **Border**: `border border-white/10`
- **Rounded**: `rounded-xl`
- **Padding**: `px-3 py-2.5`
- **Custom chevron**: SVG dropdown icon
- **Hover state**: `hover:border-white/20`
- **Focus state**: `focus:border-purple-500/50`

### Usage Flow
1. User selects **Use Case** → Badge appears, Model dropdown updates
2. User can optionally change **Model** from filtered options
3. **Reference Images** section shows/hides based on badge
4. User uploads reference images (if applicable)
5. User enters prompt and clicks **Generate Image**

### Backend Integration
The system is designed to work with the n8n workflow (`edit_image_n8n`) via MCP:
- Frontend sends: `{ useCase, model, prompt, referenceImages[] }`
- n8n processes via KIE API and returns `taskId`
- Frontend polls for completion