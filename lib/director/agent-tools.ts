import type Anthropic from "@anthropic-ai/sdk";

/**
 * AI Director tool definitions for Claude API tool-use.
 * These operate on storyboard project data via Convex.
 */

export const DIRECTOR_TOOLS: Anthropic.Tool[] = [
  // ── READ tools ──────────────────────────────────────────────────────
  {
    name: "get_project_overview",
    description:
      "Get an overview of the current storyboard project: scenes, frame count, style, format, color palette, element library, and script excerpt. Always call this first to understand the project before giving advice.",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_scene_frames",
    description:
      "Get all frames in a specific scene with their prompts, generation status, notes, duration, and linked elements. Scene IDs are like 'scene-1', 'scene-2', etc.",
    input_schema: {
      type: "object",
      properties: {
        scene_id: {
          type: "string",
          description: "Scene ID (e.g., 'scene-1')",
        },
      },
      required: ["scene_id"],
    },
  },
  {
    name: "get_frame_details",
    description:
      "Get full details for a specific frame by its order number (1-based). Returns image prompt, video prompt, notes, linked elements, generation status, and tags.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Frame number (1-based, e.g., 1 for the first frame)",
        },
      },
      required: ["frame_number"],
    },
  },
  {
    name: "get_element_library",
    description:
      "List all elements (characters, environments, props) in this project's element library. Shows names, types, descriptions, and usage count. Use this to know what @mentions are available for prompts.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["character", "environment", "prop", "all"],
          description: "Filter by element type, or 'all' for everything (default: 'all')",
        },
      },
      required: [],
    },
  },

  // ── WRITE tools ─────────────────────────────────────────────────────
  {
    name: "update_frame_prompt",
    description:
      "Update the image prompt and/or video prompt for a specific frame. Use this to improve, rewrite, or add detail to a frame's generation prompt. Always explain what you changed and why after calling this.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Frame number (1-based)",
        },
        image_prompt: {
          type: "string",
          description: "New image generation prompt. Include camera angle, lighting, composition, mood. Reference elements with their name.",
        },
        video_prompt: {
          type: "string",
          description: "New video generation prompt. Include camera movement, action, pacing.",
        },
      },
      required: ["frame_number"],
    },
  },
  {
    name: "update_frame_notes",
    description:
      "Add or update director notes on a frame. Notes appear in the Director's View filmstrip and help track creative decisions.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Frame number (1-based)",
        },
        notes: {
          type: "string",
          description: "Director notes (creative intent, reminders, continuity notes)",
        },
      },
      required: ["frame_number", "notes"],
    },
  },
  {
    name: "update_project_style",
    description:
      "Update the project-wide visual style. This affects ALL future generations. Set style prompt, genre preset (mood/lighting/color), and/or format preset (framing/pacing). Genre and format are independent axes — use both together for best results.",
    input_schema: {
      type: "object",
      properties: {
        style_prompt: {
          type: "string",
          description: "Visual style description appended to every generation prompt (e.g., 'cinematic lighting, 35mm film grain, shallow depth of field, warm color grading, anamorphic lens flare')",
        },
        genre_preset: {
          type: "string",
          enum: [
            "cinematic", "horror", "noir", "sci-fi", "fantasy", "drama",
            "action", "comedy", "thriller", "anime", "wuxia", "cyberpunk",
            "luxury", "epic", "corporate", "vintage-retro",
          ],
          description: "Genre preset controlling visual aesthetic — mood, lighting, color. Auto-appended to all generation prompts.",
        },
        format_preset: {
          type: "string",
          enum: [
            "film", "documentary", "youtube", "reel", "commercial",
            "music-video", "vlog", "tutorial", "presentation",
            "podcast", "product-demo", "cinematic-ad",
          ],
          description: "Content format preset controlling framing, pacing, camera behavior. Independent from genre.",
        },
      },
      required: [],
    },
  },
  {
    name: "create_frames",
    description:
      "Create new frames in a scene. Each frame gets a title, description, image prompt, and duration. Use this after breaking down a script or when the user wants to add shots to a scene.",
    input_schema: {
      type: "object",
      properties: {
        scene_id: {
          type: "string",
          description: "Scene ID to add frames to (e.g., 'scene-1')",
        },
        frames: {
          type: "array",
          description: "Array of frames to create",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Shot title (e.g., 'Wide establishing shot')" },
              description: { type: "string", description: "Scene action/content description" },
              image_prompt: { type: "string", description: "Full image generation prompt with camera, lighting, mood" },
              video_prompt: { type: "string", description: "Video generation prompt with camera movement and action" },
              duration: { type: "number", description: "Duration in seconds (default: 5)" },
              notes: { type: "string", description: "Director notes for this frame" },
            },
            required: ["title", "image_prompt"],
          },
        },
      },
      required: ["scene_id", "frames"],
    },
  },
  {
    name: "batch_update_prompts",
    description:
      "Update prompts for multiple frames at once. Use this for batch improvements like adding consistent style, fixing continuity, or enhancing all prompts in a scene. More efficient than calling update_frame_prompt repeatedly.",
    input_schema: {
      type: "object",
      properties: {
        updates: {
          type: "array",
          description: "Array of frame updates",
          items: {
            type: "object",
            properties: {
              frame_number: { type: "number", description: "Frame number (1-based)" },
              image_prompt: { type: "string", description: "New image prompt" },
              video_prompt: { type: "string", description: "New video prompt" },
              notes: { type: "string", description: "Director notes" },
            },
            required: ["frame_number"],
          },
        },
      },
      required: ["updates"],
    },
  },

  // ── VISION tools ───────────────────────────────────────────────────
  {
    name: "analyze_frame_image",
    description:
      "Look at a frame's generated image to give visual feedback. Use this to check if the image matches the prompt, evaluate composition, lighting, color, and suggest improvements. The image will be shown to you for analysis.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Frame number (1-based) to visually analyze",
        },
        focus: {
          type: "string",
          enum: ["general", "composition", "lighting", "color", "prompt_match", "continuity"],
          description: "What to focus the analysis on (default: 'general')",
        },
      },
      required: ["frame_number"],
    },
  },

  // ── SCENE PLANNING tools ─────────────────────────────────────────────
  {
    name: "suggest_shot_list",
    description:
      "Get a structured shot list recommendation for a scene before creating frames. Returns specific shot types, camera angles, movements, and purpose for each frame. Call this first to plan coverage, then use create_frames or generate_scene to build the frames.",
    input_schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "What happens in the scene (e.g., 'two detectives interrogate a suspect in a dark room')",
        },
        scene_type: {
          type: "string",
          enum: ["action", "dialogue", "reveal", "opening", "drama"],
          description: "Type of scene for appropriate shot coverage (default: 'drama')",
        },
        frame_count: {
          type: "number",
          description: "Number of shots to suggest (3-8, default: 5)",
        },
      },
      required: [],
    },
  },
  {
    name: "generate_scene",
    description:
      "Create a complete scene with multiple frames in one call. Use suggest_shot_list first to plan the shots, then compose the frames based on your filmmaking knowledge and call this tool. Automatically assigns a scene_id if none is provided. Designed for 'build me a scene about X' requests.",
    input_schema: {
      type: "object",
      properties: {
        premise: {
          type: "string",
          description: "What the scene is about (e.g., 'samurai faces his nemesis at dawn in an empty dojo')",
        },
        scene_id: {
          type: "string",
          description: "Scene ID to create frames in (e.g., 'scene-1'). Auto-generated as the next available scene if omitted.",
        },
        genre: {
          type: "string",
          description: "Genre for context — influences how you compose the prompts (e.g., 'action', 'drama', 'noir')",
        },
        format: {
          type: "string",
          description: "Content format for pacing context (e.g., 'film', 'commercial', 'reel')",
        },
        frames: {
          type: "array",
          description: "Array of frames to create — compose these yourself based on the premise, genre, and shot list plan",
          items: {
            type: "object",
            properties: {
              title: { type: "string", description: "Shot title (e.g., 'Wide establishing — empty dojo at dawn')" },
              description: { type: "string", description: "What happens in this frame" },
              image_prompt: { type: "string", description: "Full cinematic image prompt: shot type, lighting, mood, @ElementName references" },
              video_prompt: { type: "string", description: "Camera movement and action for video generation" },
              duration: { type: "number", description: "Duration in seconds (default: 5)" },
              notes: { type: "string", description: "Director notes" },
            },
            required: ["title", "image_prompt"],
          },
        },
      },
      required: ["premise", "frames"],
    },
  },

  // ── KNOWLEDGE tools ─────────────────────────────────────────────────
  {
    name: "get_model_recommendations",
    description:
      "Get AI model recommendations for a specific shot type or creative goal. Returns model name, credit cost, strengths, and best use cases.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["image", "video", "audio", "utility"],
          description: "Generation category",
        },
        description: {
          type: "string",
          description: "Brief description of what the user wants to create (e.g., 'fast action chase with dynamic camera')",
        },
      },
      required: ["category"],
    },
  },
  {
    name: "search_knowledge_base",
    description:
      "Search the knowledge base for articles about features, tips, how-to guides. Use when the user asks about platform capabilities.",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "Short keyword search query",
        },
      },
      required: ["query"],
    },
  },
];

// ═══════════════════════════════════════════════════════════════════════
// AGENT TOOLS — extended toolset for autonomous agent mode
// ═══════════════════════════════════════════════════════════════════════

export const AGENT_TOOLS: Anthropic.Tool[] = [
  // ── ELEMENT CREATION ───────────────────────────────────────────────
  {
    name: "create_element",
    description:
      "Create a new element (character, environment, or prop) in the project's element library. Call this BEFORE generate_scene when the scene introduces new characters, locations, or important props that don't already exist. Elements created here are text-only — users add reference images later via the Element Library. Once created, use @ElementName in prompts for consistency.",
    input_schema: {
      type: "object",
      properties: {
        name: {
          type: "string",
          description: "Element name — becomes the @mention tag. Use CamelCase with no spaces (e.g., 'CaptainRivera', 'ResearchSubmarine', 'DepthCharge').",
        },
        type: {
          type: "string",
          enum: ["character", "environment", "prop"],
          description: "Element type: character (people/creatures), environment (locations/settings), prop (objects/vehicles).",
        },
        description: {
          type: "string",
          description: "Visual description used in generation prompts. Characters: appearance, clothing, age, distinguishing features. Environments: location, atmosphere, key visual elements. Props: physical description, material, size.",
        },
        keywords: {
          type: "array",
          items: { type: "string" },
          description: "Words that identify this element in scene text (e.g., ['captain', 'Rivera', 'commander'] for CaptainRivera). Used for auto-injection into prompts.",
        },
      },
      required: ["name", "type", "description"],
    },
  },

  // ── CREDIT / PRICING ───────────────────────────────────────────────
  {
    name: "get_credit_balance",
    description:
      "Retrieve the user's current credit balance. Call this before creating an execution plan so you can verify the user has enough credits to cover all planned generations. Also useful when the user asks 'how many credits do I have?'",
    input_schema: {
      type: "object",
      properties: {},
      required: [],
    },
  },
  {
    name: "get_model_pricing",
    description:
      "Get credit cost information for AI models. When called without a model_id, returns pricing for all available models grouped by category (image, video, post-processing). When called with a specific model_id, returns detailed pricing and capability info for that model. Use this to build accurate cost estimates for execution plans.",
    input_schema: {
      type: "object",
      properties: {
        model_id: {
          type: "string",
          description: "Optional model identifier (e.g., 'flux-pro', 'kling-1.6'). Omit to get pricing for all models.",
        },
      },
      required: [],
    },
  },

  // ── PLANNING ───────────────────────────────────────────────────────
  {
    name: "create_execution_plan",
    description:
      "Build a step-by-step execution plan and present it to the user for approval before running any generation. Each step specifies the action, which tool to call, the target frame, model choice, credit cost, and parameters. The plan is displayed as a summary table so the user can review total cost and order of operations. NEVER trigger generation tools without first creating and getting approval for a plan.",
    input_schema: {
      type: "object",
      properties: {
        steps: {
          type: "array",
          description: "Ordered list of execution steps",
          items: {
            type: "object",
            properties: {
              action: {
                type: "string",
                description: "Human-readable description of what this step does (e.g., 'Generate hero image for frame 1')",
              },
              tool: {
                type: "string",
                enum: ["trigger_image_generation", "trigger_video_generation", "trigger_post_processing"],
                description: "Which generation tool to call for this step",
              },
              frame_number: {
                type: "number",
                description: "Target frame number (1-based)",
              },
              model: {
                type: "string",
                description: "Model identifier to use (e.g., 'flux-pro', 'kling-1.6')",
              },
              credits: {
                type: "number",
                description: "Credit cost for this step",
              },
              params: {
                type: "object",
                description: "Additional parameters to pass to the generation tool (resolution, duration, etc.)",
              },
            },
            required: ["action", "tool", "credits"],
          },
        },
      },
      required: ["steps"],
    },
  },

  // ── GENERATION ─────────────────────────────────────────────────────
  {
    name: "trigger_image_generation",
    description:
      "Trigger AI image generation for a frame. Only call this after the user has approved an execution plan. The frame must already exist and have an image prompt set. Supports model selection, resolution control, aspect ratio override, element references for character consistency, and frame-to-frame img2img references. Returns a generation job ID that can be polled for status.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Target frame number (1-based) — the frame must already have an image prompt",
        },
        model: {
          type: "string",
          description: "Image model identifier (e.g., 'flux-pro', 'ideogram-3'). Defaults to project setting if omitted.",
        },
        resolution: {
          type: "string",
          enum: ["1K", "2K", "4K"],
          description: "Output resolution tier (default: '1K')",
        },
        aspect_ratio: {
          type: "string",
          description: "Aspect ratio override (e.g., '16:9', '9:16', '1:1'). Defaults to project setting if omitted.",
        },
        reference_element: {
          type: "string",
          description: "Element name from the library to use as a character/object consistency reference. The element must have a reference image uploaded.",
        },
        reference_frame: {
          type: "number",
          description: "Frame number (1-based) whose generated image should be used as an img2img reference for visual continuity.",
        },
        enhance_prompt: {
          type: "boolean",
          description: "Whether to run the prompt through AI enhancement before generation (default: false)",
        },
      },
      required: ["frame_number"],
    },
  },
  {
    name: "trigger_video_generation",
    description:
      "Trigger AI video generation for a frame. Only call this after the user has approved an execution plan. The frame should have both an image prompt (used as the first frame / keyframe) and a video prompt describing motion and camera movement. Returns a generation job ID.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Target frame number (1-based) — the frame should have a video prompt set",
        },
        model: {
          type: "string",
          description: "Video model identifier (e.g., 'kling-1.6', 'wan-2.1'). Defaults to project setting if omitted.",
        },
        resolution: {
          type: "string",
          enum: ["480p", "720p", "1080p"],
          description: "Output video resolution (default: '720p')",
        },
        duration: {
          type: "string",
          enum: ["5s", "8s", "10s"],
          description: "Video clip duration (default: '5s')",
        },
      },
      required: ["frame_number"],
    },
  },

  // ── POST-PROCESSING ────────────────────────────────────────────────
  {
    name: "trigger_post_processing",
    description:
      "Apply a post-processing operation to a frame's generated image. Only call after plan approval. Operations include: 'enhance' (upscale/sharpen), 'relight' (change lighting via prompt), 'remove_bg' (remove background), 'reframe' (crop/extend to new aspect ratio). Some operations accept a preset or custom_prompt for fine-tuning.",
    input_schema: {
      type: "object",
      properties: {
        frame_number: {
          type: "number",
          description: "Target frame number (1-based) — must have a generated image to post-process",
        },
        operation: {
          type: "string",
          enum: ["enhance", "relight", "remove_bg", "reframe"],
          description: "Post-processing operation to apply",
        },
        preset: {
          type: "string",
          description: "Named preset for the operation (e.g., 'golden-hour' for relight, '16:9' for reframe). Available presets depend on the operation.",
        },
        custom_prompt: {
          type: "string",
          description: "Free-text instruction for the operation (e.g., 'dramatic rim lighting from the left' for relight). Used when no preset fits.",
        },
      },
      required: ["frame_number", "operation"],
    },
  },

  // ── PROMPT HELPERS ─────────────────────────────────────────────────
  {
    name: "get_prompt_templates",
    description:
      "Browse curated prompt templates organized by type. Templates provide battle-tested prompt structures for different creative needs — character descriptions, environment setups, prop details, design specs, style references, camera directions, action choreography, and video motion prompts. Use 'all' or omit the type to browse every category.",
    input_schema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["character", "environment", "prop", "design", "style", "camera", "action", "video", "all"],
          description: "Template category to retrieve (default: 'all')",
        },
      },
      required: [],
    },
  },
  {
    name: "get_presets",
    description:
      "Browse creative presets that can be applied to prompts or post-processing. Categories include camera angles, studio lighting setups, color palettes, and art styles. Each preset includes a name, description, and the prompt snippet it injects. Use 'all' or omit the category to see everything available.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["camera-angle", "camera-studio", "color-palette", "style", "all"],
          description: "Preset category to retrieve (default: 'all')",
        },
      },
      required: [],
    },
  },
  {
    name: "enhance_prompt",
    description:
      "Run a prompt through AI-powered enhancement to add cinematic detail, improve specificity, and boost generation quality. Works for both image and video prompts. Returns the enhanced prompt text without modifying any frame — you can review it before applying via update_frame_prompt. Useful for polishing user-written prompts or adding professional-grade detail.",
    input_schema: {
      type: "object",
      properties: {
        prompt: {
          type: "string",
          description: "The raw prompt text to enhance",
        },
        mode: {
          type: "string",
          enum: ["image", "video"],
          description: "Whether to optimize for image or video generation (default: 'image')",
        },
      },
      required: ["prompt"],
    },
  },

  // ── FILE BROWSING ──────────────────────────────────────────────────
  {
    name: "browse_project_files",
    description:
      "Browse files attached to or generated by the project. Use this to discover uploaded reference images, generated outputs, element library assets, exported storyboard frames, and rendered videos. Helpful for understanding what assets already exist before planning new generations.",
    input_schema: {
      type: "object",
      properties: {
        category: {
          type: "string",
          enum: ["uploads", "generated", "elements", "storyboard", "videos", "all"],
          description: "File category to browse (default: 'all')",
        },
        file_type: {
          type: "string",
          enum: ["image", "video", "audio", "all"],
          description: "Filter by file type (default: 'all')",
        },
        limit: {
          type: "number",
          description: "Maximum number of files to return (default: 50)",
        },
      },
      required: [],
    },
  },
];

/**
 * Returns the tool set for a given director mode.
 * - "agent" mode: full toolset (read/write + autonomous generation tools)
 * - any other mode: standard director tools only (read/write, no generation)
 */
export function getToolsForMode(mode: string): Anthropic.Tool[] {
  if (mode === "agent") {
    return [...DIRECTOR_TOOLS, ...AGENT_TOOLS];
  }
  return DIRECTOR_TOOLS;
}

export type DirectorToolName =
  | "get_project_overview"
  | "get_scene_frames"
  | "get_frame_details"
  | "get_element_library"
  | "update_frame_prompt"
  | "update_frame_notes"
  | "update_project_style"
  | "create_frames"
  | "batch_update_prompts"
  | "analyze_frame_image"
  | "suggest_shot_list"
  | "generate_scene"
  | "get_model_recommendations"
  | "search_knowledge_base"
  // Agent-mode tools
  | "create_element"
  | "get_credit_balance"
  | "get_model_pricing"
  | "create_execution_plan"
  | "trigger_image_generation"
  | "trigger_video_generation"
  | "trigger_post_processing"
  | "get_prompt_templates"
  | "get_presets"
  | "enhance_prompt"
  | "browse_project_files";
