import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { DirectorToolName } from "./agent-tools";
import { MODEL_KNOWLEDGE } from "./constants";

function stringifyResult(obj: unknown): string {
  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return String(obj);
  }
}

export interface DirectorToolContext {
  convex: ConvexHttpClient;
  projectId: string;
  companyId: string;
  userId: string;
}

export interface DirectorToolResult {
  output: string;
  isError: boolean;
  imageUrl?: string; // If set, route will fetch and include as vision content block
}

export async function dispatchDirectorTool(
  toolName: string,
  rawInput: unknown,
  ctx: DirectorToolContext
): Promise<DirectorToolResult> {
  const input = (rawInput ?? {}) as Record<string, unknown>;
  const { convex, projectId } = ctx;

  try {
    switch (toolName as DirectorToolName) {
      // ── READ tools ────────────────────────────────────────────────

      case "get_project_overview": {
        const project = await convex.query(api.storyboard.projects.get, {
          id: projectId as any,
        });
        if (!project) return { output: "Project not found.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );

        const elements = await convex.query(
          api.storyboard.storyboardElements.listByProject,
          { projectId: projectId as any }
        );

        const characters = elements.filter((e: any) => e.type === "character");
        const environments = elements.filter((e: any) => e.type === "environment");
        const props = elements.filter((e: any) => e.type === "prop");

        // Group frames by scene
        const sceneMap: Record<string, number> = {};
        for (const item of items) {
          const sid = (item as any).sceneId || "unknown";
          sceneMap[sid] = (sceneMap[sid] || 0) + 1;
        }

        return {
          output: stringifyResult({
            name: project.name,
            description: project.description || "",
            sceneCount: Object.keys(sceneMap).length,
            frameCount: items.length,
            scenes: Object.entries(sceneMap).map(([id, count]) => ({ id, frameCount: count })),
            style: project.style || "none",
            stylePrompt: project.stylePrompt || "none set",
            formatPreset: project.formatPreset || "none",
            colorPalette: (project as any).colorPalette?.colors || [],
            elements: {
              characters: characters.map((c: any) => ({
                name: c.name,
                description: c.description || "",
              })),
              environments: environments.map((e: any) => ({
                name: e.name,
                description: e.description || "",
              })),
              props: props.map((p: any) => ({
                name: p.name,
                description: p.description || "",
              })),
            },
            scriptExcerpt: project.script
              ? project.script.substring(0, 600) + (project.script.length > 600 ? "..." : "")
              : "No script",
          }),
          isError: false,
        };
      }

      case "get_scene_frames": {
        const sceneId = String(input.scene_id || "");
        if (!sceneId) return { output: "scene_id is required.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );

        const sceneFrames = (items as any[])
          .filter((item) => item.sceneId === sceneId)
          .sort((a, b) => a.order - b.order);

        if (sceneFrames.length === 0) {
          return { output: `No frames found in ${sceneId}.`, isError: false };
        }

        return {
          output: stringifyResult(
            sceneFrames.map((f, i) => ({
              frameNumber: f.order + 1,
              title: f.title,
              description: f.description || "",
              imagePrompt: f.imagePrompt || "no prompt",
              videoPrompt: f.videoPrompt || "",
              notes: f.notes || "",
              duration: f.duration || 5,
              generationStatus: f.generationStatus,
              hasImage: !!f.imageUrl,
              hasVideo: !!f.videoUrl,
              linkedElements: (f.linkedElements || []).map((e: any) => `${e.name} (${e.type})`),
            }))
          ),
          isError: false,
        };
      }

      case "get_frame_details": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1)
          return { output: "frame_number must be a positive number.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );

        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found. Project has ${sorted.length} frames.`, isError: false };

        return {
          output: stringifyResult({
            frameNumber: frameNum,
            id: frame._id,
            sceneId: frame.sceneId,
            title: frame.title,
            description: frame.description || "",
            imagePrompt: frame.imagePrompt || "no prompt set",
            videoPrompt: frame.videoPrompt || "",
            notes: frame.notes || "",
            duration: frame.duration || 5,
            frameStatus: frame.frameStatus || "draft",
            generationStatus: frame.generationStatus,
            hasImage: !!frame.imageUrl,
            hasVideo: !!frame.videoUrl,
            hasAudio: !!frame.audioUrl,
            linkedElements: (frame.linkedElements || []).map((e: any) => ({
              name: e.name,
              type: e.type,
            })),
            tags: (frame.tags || []).map((t: any) => t.name),
            imageGeneration: frame.imageGeneration
              ? { model: frame.imageGeneration.model, status: frame.imageGeneration.status, credits: frame.imageGeneration.creditsUsed }
              : null,
            videoGeneration: frame.videoGeneration
              ? { model: frame.videoGeneration.model, status: frame.videoGeneration.status, credits: frame.videoGeneration.creditsUsed }
              : null,
          }),
          isError: false,
        };
      }

      case "get_element_library": {
        const typeFilter = input.type === "all" ? undefined : (input.type as string);

        const elements = await convex.query(
          api.storyboard.storyboardElements.listByProject,
          {
            projectId: projectId as any,
            ...(typeFilter && { type: typeFilter }),
          }
        );

        if (!elements || elements.length === 0) {
          return { output: "No elements in the library yet.", isError: false };
        }

        return {
          output: stringifyResult(
            (elements as any[]).map((e) => ({
              name: e.name,
              type: e.type,
              description: e.description || "",
              usageCount: e.usageCount || 0,
              status: e.status,
              hasReferenceImages: (e.referenceUrls || []).length > 0,
            }))
          ),
          isError: false,
        };
      }

      // ── WRITE tools ───────────────────────────────────────────────

      case "update_frame_prompt": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1)
          return { output: "frame_number must be a positive number.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };

        const updateData: Record<string, any> = { id: frame._id };
        if (input.image_prompt) updateData.imagePrompt = String(input.image_prompt);
        if (input.video_prompt) updateData.videoPrompt = String(input.video_prompt);

        await convex.mutation(api.storyboard.storyboardItems.update, updateData as any);

        const changes: string[] = [];
        if (input.image_prompt) changes.push("image prompt");
        if (input.video_prompt) changes.push("video prompt");

        return {
          output: `Updated ${changes.join(" and ")} for frame ${frameNum} ("${frame.title}").`,
          isError: false,
        };
      }

      case "update_frame_notes": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1)
          return { output: "frame_number must be a positive number.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };

        await convex.mutation(api.storyboard.storyboardItems.updateFrameNotes, {
          id: frame._id,
          notes: String(input.notes || ""),
        });

        return {
          output: `Director notes updated for frame ${frameNum} ("${frame.title}").`,
          isError: false,
        };
      }

      case "update_project_style": {
        const updateData: Record<string, any> = { id: projectId as any };
        if (input.style_prompt) updateData.stylePrompt = String(input.style_prompt);
        if (input.format_preset) updateData.formatPreset = String(input.format_preset);

        if (!input.style_prompt && !input.format_preset) {
          return { output: "Provide at least style_prompt or format_preset.", isError: true };
        }

        await convex.mutation(api.storyboard.projects.update, updateData as any);

        const changes: string[] = [];
        if (input.style_prompt) changes.push("style prompt");
        if (input.format_preset) changes.push(`format preset to "${input.format_preset}"`);

        return {
          output: `Updated project ${changes.join(" and ")}. This will apply to all future generations.`,
          isError: false,
        };
      }

      case "create_frames": {
        const sceneId = String(input.scene_id || "");
        const frames = input.frames as any[];
        if (!sceneId || !frames || frames.length === 0)
          return { output: "scene_id and frames array are required.", isError: true };

        // Get current max order
        const existingItems = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );
        const maxOrder = existingItems.length > 0
          ? Math.max(...(existingItems as any[]).map((i) => i.order))
          : -1;

        const createdIds: any[] = [];
        for (let i = 0; i < frames.length; i++) {
          const f = frames[i];
          const id = await convex.mutation(api.storyboard.storyboardItems.create, {
            projectId: projectId as any,
            sceneId,
            order: maxOrder + 1 + i,
            title: f.title || `Shot ${maxOrder + 2 + i}`,
            description: f.description || "",
            duration: f.duration || 5,
            generatedBy: ctx.userId,
          });
          createdIds.push(id);

          // Set prompts and notes via update (create doesn't accept these fields)
          const updateFields: Record<string, any> = { id: id as any };
          if (f.image_prompt) updateFields.imagePrompt = f.image_prompt;
          if (f.video_prompt) updateFields.videoPrompt = f.video_prompt;
          if (Object.keys(updateFields).length > 1) {
            await convex.mutation(api.storyboard.storyboardItems.update, updateFields as any);
          }
          if (f.notes) {
            await convex.mutation(api.storyboard.storyboardItems.updateFrameNotes, {
              id: id as any,
              notes: f.notes,
            });
          }
        }

        return {
          output: `Created ${frames.length} new frame${frames.length > 1 ? "s" : ""} in ${sceneId}. Frame numbers: ${createdIds.map((_, i) => maxOrder + 2 + i).join(", ")}.`,
          isError: false,
        };
      }

      case "batch_update_prompts": {
        const updates = input.updates as any[];
        if (!updates || updates.length === 0)
          return { output: "updates array is required.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);

        let successCount = 0;
        const errors: string[] = [];

        for (const update of updates) {
          const frameNum = Number(update.frame_number);
          const frame = sorted[frameNum - 1];
          if (!frame) {
            errors.push(`Frame ${frameNum} not found`);
            continue;
          }

          const updateData: Record<string, any> = { id: frame._id };
          if (update.image_prompt) updateData.imagePrompt = String(update.image_prompt);
          if (update.video_prompt) updateData.videoPrompt = String(update.video_prompt);

          if (Object.keys(updateData).length > 1) {
            await convex.mutation(api.storyboard.storyboardItems.update, updateData as any);
          }

          if (update.notes) {
            await convex.mutation(api.storyboard.storyboardItems.updateFrameNotes, {
              id: frame._id,
              notes: String(update.notes),
            });
          }

          successCount++;
        }

        let msg = `Updated ${successCount} of ${updates.length} frames.`;
        if (errors.length > 0) msg += ` Errors: ${errors.join("; ")}.`;
        return { output: msg, isError: false };
      }

      // ── VISION tools ─────────────────────────────────────────────

      case "analyze_frame_image": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1)
          return { output: "frame_number must be a positive number.", isError: true };

        const items = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };

        if (!frame.imageUrl) {
          return { output: `Frame ${frameNum} ("${frame.title}") has no generated image yet. Generate an image first, then I can analyze it.`, isError: false };
        }

        const focus = String(input.focus || "general");
        const focusInstructions: Record<string, string> = {
          general: "Give an overall visual assessment — composition, lighting, color, mood, and how well it matches the prompt.",
          composition: "Focus on composition: framing, rule of thirds, leading lines, depth, balance, and visual flow.",
          lighting: "Focus on lighting: direction, quality, contrast, color temperature, shadows, highlights, and mood.",
          color: "Focus on color: palette, harmony, saturation, grading, and emotional impact.",
          prompt_match: "Compare the image against the prompt. What matches well? What's missing or different?",
          continuity: "Evaluate continuity: would this shot cut well with adjacent frames? Check lighting direction, color grade, and style consistency.",
        };

        return {
          output: `Analyzing frame ${frameNum} ("${frame.title}"). Prompt: "${frame.imagePrompt || "none"}". Focus: ${focus}. ${focusInstructions[focus] || focusInstructions.general}`,
          isError: false,
          imageUrl: frame.imageUrl,
        };
      }

      // ── KNOWLEDGE tools ───────────────────────────────────────────

      case "get_model_recommendations": {
        const category = String(input.category || "image") as keyof typeof MODEL_KNOWLEDGE;
        const description = String(input.description || "");

        const models = MODEL_KNOWLEDGE[category];
        if (!models) return { output: `Unknown category: ${category}`, isError: true };

        const result = models.map((m) => ({
          name: m.name,
          credits: m.credits,
          strengths: m.strengths,
          bestFor: m.bestFor,
        }));

        let header = `Available ${category} models:\n`;
        if (description) {
          header = `For "${description}" — here are the ${category} models:\n`;
        }

        return {
          output: header + stringifyResult(result),
          isError: false,
        };
      }

      case "search_knowledge_base": {
        const query = String(input.query || "").trim();
        if (!query) return { output: "A search query is required.", isError: true };

        const articles = await convex.query(api.knowledgeBase.searchArticlesUnified, {
          query,
          limit: 5,
        });

        if (!articles || articles.length === 0) {
          return { output: `No articles found for "${query}".`, isError: false };
        }

        const trimmed = articles.slice(0, 3).map((a: any) => ({
          title: a.title,
          content: a.content.length > 800 ? a.content.slice(0, 800) + "..." : a.content,
        }));

        return { output: stringifyResult(trimmed), isError: false };
      }

      default:
        return { output: `Unknown tool: ${toolName}`, isError: true };
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`[ai-director] tool "${toolName}" failed:`, err);
    return {
      output: `Tool error: ${msg}. Please try again.`,
      isError: true,
    };
  }
}
