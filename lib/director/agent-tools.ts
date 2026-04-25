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
      "Update the project-wide visual style. This affects ALL future generations. Set the style prompt (descriptive text appended to every prompt) and/or the format preset.",
    input_schema: {
      type: "object",
      properties: {
        style_prompt: {
          type: "string",
          description: "Visual style description appended to every generation prompt (e.g., 'cinematic lighting, 35mm film grain, shallow depth of field, warm color grading, anamorphic lens flare')",
        },
        format_preset: {
          type: "string",
          enum: [
            "film", "documentary", "youtube", "reel", "commercial",
            "music-video", "vlog", "tutorial", "presentation",
            "podcast", "product-demo", "cinematic-ad",
          ],
          description: "Content format preset that adds framing/pacing context",
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
  | "get_model_recommendations"
  | "search_knowledge_base";
