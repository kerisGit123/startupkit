import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { DirectorToolName } from "./agent-tools";
import { MODEL_KNOWLEDGE } from "./constants";
import { getAnthropicClient } from "@/lib/support/anthropic";

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
            imageUrl: frame.imageUrl || null,
            videoUrl: frame.videoUrl || null,
            audioUrl: frame.audioUrl || null,
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
              thumbnailUrl: e.thumbnailUrl || null,
              referenceUrls: e.referenceUrls || [],
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
        if (input.genre_preset) updateData.genre = String(input.genre_preset);
        if (input.format_preset) updateData.formatPreset = String(input.format_preset);

        if (!input.style_prompt && !input.genre_preset && !input.format_preset) {
          return { output: "Provide at least one of: style_prompt, genre_preset, format_preset.", isError: true };
        }

        await convex.mutation(api.storyboard.projects.update, updateData as any);

        const changes: string[] = [];
        if (input.style_prompt) changes.push("style prompt");
        if (input.genre_preset) changes.push(`genre to "${input.genre_preset}"`);
        if (input.format_preset) changes.push(`format to "${input.format_preset}"`);

        return {
          output: `Updated project ${changes.join(", ")}. This will apply to all future generations.`,
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

      case "create_element": {
        const elName = String(input.name || "").trim();
        const elType = String(input.type || "character");
        const elDesc = String(input.description || "");
        if (!elName) return { output: "name is required.", isError: true };
        if (!["character", "environment", "prop"].includes(elType))
          return { output: "type must be character, environment, or prop.", isError: true };

        const existing = await convex.query(api.storyboard.storyboardElements.listByProject, { projectId: projectId as any });
        const duplicate = (existing as any[]).find((e) => e.name.toLowerCase() === elName.toLowerCase());
        if (duplicate) {
          return { output: `Element "@${elName}" already exists (${duplicate.type}). Use @${elName} in prompts.`, isError: false };
        }

        const keywords = Array.isArray(input.keywords) ? (input.keywords as unknown[]).map(String) : [];

        await convex.mutation(api.storyboard.storyboardElements.create, {
          projectId: projectId as any,
          name: elName,
          type: elType,
          description: elDesc,
          thumbnailUrl: "",
          referenceUrls: [],
          tags: keywords,
          createdBy: ctx.userId,
        });

        return {
          output: `Created ${elType} "@${elName}". Use @${elName} in prompts — the reference image slot is empty until the user uploads one via the Element Library.`,
          isError: false,
        };
      }

      case "get_credit_balance": {
        try {
          const balance = await convex.query(api.credits.getBalance, { companyId: ctx.companyId });
          return { output: `Current credit balance: ${balance} credits.`, isError: false };
        } catch {
          return { output: "Could not fetch credit balance.", isError: true };
        }
      }

      case "get_model_pricing": {
        const modelId = input.model_id ? String(input.model_id) : undefined;
        const allPricing = {
          image: [
            { id: "nano-banana-2", name: "Nano Banana 2", credits: { "1K": 5, "2K": 10, "4K": 18 }, note: "Best value. Fast, reliable." },
            { id: "nano-banana-pro", name: "Nano Banana Pro", credits: { "1K": 18, "2K": 24 }, note: "Higher detail." },
            { id: "gpt-image-2-image-to-image", name: "GPT Image 2", credits: 15, note: "Best photorealistic." },
            { id: "z-image", name: "Z-Image", credits: 1, note: "Cheapest. Quick drafts." },
          ],
          video: [
            { id: "bytedance/seedance-1.5-pro", name: "Seedance 1.5 Pro", credits: { "480p_5s": 5, "480p_10s": 10, "720p_5s": 15, "720p_10s": 30, "1080p_5s": 45, "1080p_10s": 90 }, note: "Best value video." },
            { id: "google/veo-3.1", name: "Veo 3.1", credits: { fast: 60, quality: 250 }, note: "Highest quality." },
          ],
        };
        if (modelId) {
          const all = [...allPricing.image, ...allPricing.video];
          const found = all.find((m) => m.id === modelId);
          return found ? { output: stringifyResult(found), isError: false } : { output: `Model "${modelId}" not found.`, isError: false };
        }
        return { output: stringifyResult(allPricing), isError: false };
      }

      case "create_execution_plan": {
        const steps = input.steps as any[];
        if (!steps || steps.length === 0) return { output: "Plan must have at least one step.", isError: true };
        const totalCredits = steps.reduce((sum: number, s: any) => sum + (s.credits || 0), 0);
        let balance = 0;
        try { balance = await convex.query(api.credits.getBalance, { companyId: ctx.companyId }); } catch {}
        if (balance < totalCredits) return { output: `Insufficient credits. Plan requires ${totalCredits} but you have ${balance}.`, isError: false };
        return {
          output: JSON.stringify({
            __plan_approval: true,
            steps: steps.map((s: any) => ({ action: s.action || "Unknown step", tool: s.tool, frameNumber: s.frame_number, model: s.model, credits: s.credits || 0, params: s.params || {} })),
            totalCredits, balance,
          }),
          isError: false,
        };
      }

      case "trigger_image_generation": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1) return { output: "frame_number must be a positive number.", isError: true };
        const items = await convex.query(api.storyboard.storyboardItems.listByProject, { projectId: projectId as any });
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };
        if (!frame.imagePrompt) return { output: `Frame ${frameNum} has no image prompt.`, isError: true };
        const model = String(input.model || "nano-banana-2");
        const resolution = String(input.resolution || "1K");
        const aspectRatio = String(input.aspect_ratio || "16:9");
        const creditMap: Record<string, Record<string, number>> = { "nano-banana-2": { "1K": 5, "2K": 10, "4K": 18 }, "nano-banana-pro": { "1K": 18, "2K": 24 }, "z-image": { "1K": 1 }, "gpt-image-2-image-to-image": { "1K": 15 } };
        const creditsUsed = creditMap[model]?.[resolution] ?? 5;
        let referenceImageUrls: string[] = [];
        if (input.reference_element) {
          const elements = await convex.query(api.storyboard.storyboardElements.listByProject, { projectId: projectId as any });
          const el = (elements as any[]).find((e) => e.name.toLowerCase() === String(input.reference_element).toLowerCase());
          if (el?.referenceUrls?.length > 0) referenceImageUrls = el.referenceUrls;
        }
        let referenceFrameUrl: string | undefined;
        if (input.reference_frame) {
          const refFrame = sorted[Number(input.reference_frame) - 1];
          if (refFrame?.imageUrl) referenceFrameUrl = refFrame.imageUrl;
        }
        try {
          const genRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/storyboard/generate-image`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sceneContent: frame.imagePrompt, style: "realistic", quality: resolution, aspectRatio, itemId: frame._id, enhance: !!input.enhance_prompt, companyId: ctx.companyId, userId: ctx.userId, projectId, creditsUsed, model, ...(referenceFrameUrl && { imageUrl: referenceFrameUrl }), ...(referenceImageUrls.length > 0 && { referenceImageUrls }) }),
          });
          if (!genRes.ok) return { output: `Generation failed: ${await genRes.text()}`, isError: true };
          const genResult = await genRes.json();
          return { output: `Image generation started for frame ${frameNum} ("${frame.title}") using ${model} at ${resolution}. Cost: ${creditsUsed} credits.`, isError: false };
        } catch (err) { return { output: `Failed: ${err instanceof Error ? err.message : String(err)}`, isError: true }; }
      }

      case "trigger_video_generation": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1) return { output: "frame_number must be a positive number.", isError: true };
        const items = await convex.query(api.storyboard.storyboardItems.listByProject, { projectId: projectId as any });
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };
        if (!frame.imageUrl) return { output: `Frame ${frameNum} has no generated image.`, isError: true };
        const model = String(input.model || "bytedance/seedance-1.5-pro");
        const resolution = String(input.resolution || "480p");
        const duration = String(input.duration || "5s");
        const videoCreditMap: Record<string, number> = { "480p_5s": 5, "480p_8s": 8, "480p_10s": 10, "720p_5s": 15, "720p_8s": 24, "720p_10s": 30, "1080p_5s": 45, "1080p_8s": 72, "1080p_10s": 90 };
        const durationKey = duration.replace("s", "");
        const creditsUsed = videoCreditMap[`${resolution}_${durationKey}s`] ?? 5;
        const videoPrompt = frame.videoPrompt || frame.imagePrompt || "cinematic motion";
        try {
          const genRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/storyboard/generate-image`, {
            method: "POST", headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sceneContent: videoPrompt, style: "realistic", quality: "standard", aspectRatio: "16:9", itemId: frame._id, enhance: false, companyId: ctx.companyId, userId: ctx.userId, projectId, creditsUsed, model, imageUrl: frame.imageUrl, duration }),
          });
          if (!genRes.ok) return { output: `Video generation failed: ${await genRes.text()}`, isError: true };
          const genResult = await genRes.json();
          return { output: `Video generation started for frame ${frameNum} ("${frame.title}") using ${model} at ${resolution}, ${duration}. Cost: ${creditsUsed} credits.`, isError: false };
        } catch (err) { return { output: `Failed: ${err instanceof Error ? err.message : String(err)}`, isError: true }; }
      }

      case "get_prompt_templates": {
        const typeFilter = input.type === "all" ? undefined : (input.type as string);
        try {
          const templates = await convex.query(api.promptTemplates.getByCompany, { companyId: ctx.companyId });
          let filtered = templates as any[];
          if (typeFilter) filtered = filtered.filter((t) => t.type === typeFilter);
          if (filtered.length === 0) return { output: `No prompt templates found${typeFilter ? ` for type "${typeFilter}"` : ""}.`, isError: false };
          return { output: stringifyResult(filtered.slice(0, 30).map((t: any) => ({ name: t.name, type: t.type, prompt: t.prompt, notes: t.notes || "", usageCount: t.usageCount || 0 }))), isError: false };
        } catch { return { output: "Could not load prompt templates.", isError: true }; }
      }

      case "get_presets": {
        const category = input.category === "all" ? undefined : (input.category as string);
        try {
          const presets = await convex.query(api.storyboard.presets.list, { companyId: ctx.companyId, ...(category && { category }) });
          if (!presets || presets.length === 0) return { output: `No presets found${category ? ` for category "${category}"` : ""}.`, isError: false };
          return { output: stringifyResult((presets as any[]).slice(0, 20).map((p) => ({ id: p._id, name: p.name, category: p.category, prompt: p.prompt || "", format: p.format ? (() => { try { return JSON.parse(p.format); } catch { return p.format; } })() : null, usageCount: p.usageCount || 0 }))), isError: false };
        } catch { return { output: "Could not load presets.", isError: true }; }
      }

      case "trigger_post_processing": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1) return { output: "frame_number must be a positive number.", isError: true };
        const items = await convex.query(api.storyboard.storyboardItems.listByProject, { projectId: projectId as any });
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };
        if (!frame.imageUrl) return { output: `Frame ${frameNum} has no generated image.`, isError: true };
        const operation = String(input.operation);
        const preset = String(input.preset || "");
        const customPrompt = String(input.custom_prompt || "");
        const ENHANCE_PRESETS: Record<string, string> = { "Cinematic": "Cinematic film grade enhancement, add subtle film grain, rich color depth", "Face & Skin": "Enhance facial details, natural skin retouching, restore clarity", "Sharpen": "Enhance fine details, sharpen textures and edges", "Natural": "True-to-life colors, balanced white point, neutral skin tones", "Full Enhance": "Professional photo enhancement: sharpen details, enhance colors, fix exposure" };
        const RELIGHT_PRESETS: Record<string, string> = { "Dramatic Side": "Strong directional side light from left, deep shadows", "Golden Hour": "Warm golden hour sunlight, long shadows, amber glow", "Blue Hour": "Cool blue twilight lighting, soft ambient", "Neon Night": "Neon colored lighting, cyberpunk city glow", "Moonlight": "Cold moonlight from above, blue-silver tones", "Studio Rembrandt": "Classic Rembrandt lighting, triangle of light on cheek", "Backlit / Rim": "Strong backlight creating rim light and silhouette edge glow" };
        let model = "gpt-image-2-image-to-image"; let prompt = customPrompt; let creditsUsed = 4;
        switch (operation) {
          case "enhance": prompt = prompt || ENHANCE_PRESETS[preset] || ENHANCE_PRESETS["Full Enhance"]!; break;
          case "relight": prompt = prompt || RELIGHT_PRESETS[preset] || RELIGHT_PRESETS["Dramatic Side"]!; break;
          case "remove_bg": model = "recraft/remove-background"; prompt = "remove background"; creditsUsed = 1; break;
          case "reframe": model = "ideogram/v3-reframe"; prompt = preset || "16:9"; creditsUsed = 7; break;
          default: return { output: `Unknown operation: ${operation}`, isError: true };
        }
        try {
          const ppRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/inpaint`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageUrl: frame.imageUrl, prompt, model, companyId: ctx.companyId, userId: ctx.userId, projectId, itemId: frame._id, creditsUsed }) });
          if (!ppRes.ok) return { output: `Post-processing failed: ${await ppRes.text()}`, isError: true };
          const ppResult = await ppRes.json();
          return { output: `${operation} applied to frame ${frameNum} ("${frame.title}"). ${preset ? `Preset: ${preset}. ` : ""}Cost: ${creditsUsed} credits.`, isError: false };
        } catch (err) { return { output: `Post-processing failed: ${err instanceof Error ? err.message : String(err)}`, isError: true }; }
      }

      case "enhance_prompt": {
        const rawPrompt = String(input.prompt || "").trim();
        if (!rawPrompt) return { output: "A prompt is required.", isError: true };
        try {
          const enhRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/prompt-enhance`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ prompt: rawPrompt, userId: ctx.userId, mode: String(input.mode || "image") }) });
          if (!enhRes.ok) return { output: `Prompt enhancement failed: ${await enhRes.text()}`, isError: true };
          const enhResult = await enhRes.json();
          return { output: `Enhanced prompt:\n\n${enhResult.enhanced || enhResult.prompt || enhResult.text || ""}`, isError: false };
        } catch (err) { return { output: `Failed: ${err instanceof Error ? err.message : String(err)}`, isError: true }; }
      }

      case "suggest_shot_list": {
        const description = String(input.description || "");
        const sceneType = String(input.scene_type || "drama").toLowerCase();
        const frameCount = Math.min(Math.max(Number(input.frame_count || 5), 3), 8);

        type ShotTemplate = {
          type: string;
          angle: string;
          movement: string;
          purpose: string;
          duration: number;
        };

        const SCENE_TEMPLATES: Record<string, ShotTemplate[]> = {
          action: [
            { type: "ESTABLISHING", angle: "wide aerial", movement: "slow crane down", purpose: "Show location and scale, set stakes", duration: 3 },
            { type: "WIDE", angle: "low angle", movement: "static or slow track", purpose: "Reveal all combatants in environment", duration: 4 },
            { type: "MEDIUM", angle: "eye-level", movement: "slow push-in", purpose: "Character emotion before action begins", duration: 3 },
            { type: "EXTREME CLOSE-UP", angle: "macro", movement: "static", purpose: "Tension detail — weapon, hands, or eyes", duration: 2 },
            { type: "WIDE", angle: "medium-wide", movement: "handheld", purpose: "Full choreography — see complete action", duration: 6 },
            { type: "CLOSE-UP", angle: "over-shoulder", movement: "static", purpose: "Decisive moment from one character's view", duration: 3 },
            { type: "WIDE", angle: "crane up", movement: "crane up and back", purpose: "Aftermath — scale of outcome revealed", duration: 4 },
            { type: "MEDIUM CLOSE-UP", angle: "slight low angle", movement: "slow push-in", purpose: "Emotional payoff — character's face", duration: 4 },
          ],
          dialogue: [
            { type: "ESTABLISHING", angle: "wide two-shot", movement: "slow dolly in", purpose: "Establish location and relationship between characters", duration: 5 },
            { type: "MEDIUM", angle: "eye-level two-shot", movement: "static", purpose: "Show both characters together, set dynamic", duration: 4 },
            { type: "OVER-THE-SHOULDER", angle: "OTS A→B", movement: "static", purpose: "Character A speaking — B's perspective", duration: 5 },
            { type: "OVER-THE-SHOULDER", angle: "OTS B→A", movement: "static", purpose: "Character B responding — A's perspective", duration: 5 },
            { type: "CLOSE-UP", angle: "eye-level", movement: "slow push-in", purpose: "Emotional peak — truth or conflict revealed", duration: 4 },
            { type: "WIDE", angle: "wide shot", movement: "slow dolly out", purpose: "Closing — isolation or connection", duration: 4 },
          ],
          reveal: [
            { type: "WIDE", angle: "high angle overhead", movement: "crane down", purpose: "Characters approaching the reveal location", duration: 4 },
            { type: "MEDIUM", angle: "eye-level", movement: "tracking", purpose: "Characters moving toward the reveal", duration: 5 },
            { type: "POV", angle: "first-person", movement: "handheld push-in", purpose: "What the character sees — audience shares perspective", duration: 4 },
            { type: "INSERT", angle: "macro close-up", movement: "static", purpose: "The revealed object or scene in detail", duration: 3 },
            { type: "CLOSE-UP", angle: "slight low angle", movement: "static", purpose: "Character reaction — face shows the weight", duration: 4 },
            { type: "WIDE", angle: "aerial pullback", movement: "crane up and back", purpose: "Context — reveal shown in full environment", duration: 5 },
          ],
          opening: [
            { type: "AERIAL", angle: "bird's-eye", movement: "slow drone sweep", purpose: "Establish world, location, scale", duration: 5 },
            { type: "ESTABLISHING", angle: "wide eye-level", movement: "slow pan", purpose: "Ground-level environment introduction", duration: 4 },
            { type: "MEDIUM", angle: "slight low angle", movement: "static or slow track", purpose: "First look at the protagonist", duration: 4 },
            { type: "CLOSE-UP", angle: "eye-level", movement: "slow push-in", purpose: "Character's face — their state of mind", duration: 3 },
            { type: "INSERT", angle: "macro close-up", movement: "static", purpose: "A detail that defines this world", duration: 2 },
          ],
          drama: [
            { type: "ESTABLISHING", angle: "wide", movement: "static", purpose: "Set the scene and atmosphere", duration: 4 },
            { type: "MEDIUM", angle: "eye-level", movement: "static", purpose: "Character in their environment", duration: 5 },
            { type: "MEDIUM CLOSE-UP", angle: "slight low angle", movement: "slow push-in", purpose: "Emotional moment building", duration: 4 },
            { type: "CLOSE-UP", angle: "eye-level", movement: "static", purpose: "Peak emotional expression", duration: 4 },
            { type: "WIDE", angle: "wide shot", movement: "dolly out or crane up", purpose: "Closing — isolation or resolution", duration: 5 },
          ],
        };

        const template = SCENE_TEMPLATES[sceneType] ?? SCENE_TEMPLATES.drama;
        const selected = template.slice(0, frameCount);

        const guidance: Record<string, string> = {
          action: "Vary shot sizes to build rhythm. Wide for choreography, close for impact. Handheld adds chaos, static adds control. Cut on action for momentum.",
          dialogue: "Establish → two-shot → OTS → OTS → close-up emotional peak. Keep camera still unless emotion demands movement.",
          reveal: "Build anticipation through movement, then pause on the reveal. Let the close-up reaction do the work.",
          opening: "Start macro (world), end micro (character). Give the audience somewhere to stand before introducing who to follow.",
          drama: "Let pauses breathe. Push-in on emotion, dolly out on isolation. Wide shot for context, close-up for feeling.",
        };

        return {
          output: stringifyResult({
            description: description || "Scene",
            sceneType,
            shots: selected.map((s, i) => ({
              frameNumber: i + 1,
              shotType: s.type,
              cameraAngle: s.angle,
              movement: s.movement,
              purpose: s.purpose,
              suggestedDuration: `${s.duration}s`,
            })),
            guidance: guidance[sceneType] ?? guidance.drama,
            note: `${selected.length}-shot plan for ${sceneType} scene. Use generate_scene or create_frames with these as your template.`,
          }),
          isError: false,
        };
      }

      case "generate_scene": {
        const premise = String(input.premise || "");
        const frames = input.frames as any[];

        if (!frames || frames.length === 0)
          return { output: "frames array is required. Compose the frames yourself based on the premise, then call this tool.", isError: true };

        const existingItems = await convex.query(
          api.storyboard.storyboardItems.listByProject,
          { projectId: projectId as any }
        );

        // Auto-generate scene_id as the next available one
        const existingSceneIds = [
          ...new Set((existingItems as any[]).map((i) => i.sceneId).filter(Boolean)),
        ];
        let sceneId = String(input.scene_id || "");
        if (!sceneId) {
          const nextNum = existingSceneIds.length + 1;
          sceneId = `scene-${nextNum}`;
        }

        const maxOrder =
          existingItems.length > 0
            ? Math.max(...(existingItems as any[]).map((i) => i.order))
            : -1;

        const createdFrameNumbers: number[] = [];

        for (let i = 0; i < frames.length; i++) {
          const f = frames[i];
          const order = maxOrder + 1 + i;
          const id = await convex.mutation(api.storyboard.storyboardItems.create, {
            projectId: projectId as any,
            sceneId,
            order,
            title: f.title || `Shot ${order + 1}`,
            description: f.description || premise,
            duration: f.duration || 5,
            generatedBy: ctx.userId,
          });

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

          createdFrameNumbers.push(order + 1);
        }

        const genre = input.genre ? ` (${input.genre} genre)` : "";
        const format = input.format ? `, ${input.format} format` : "";
        return {
          output: `Created ${frames.length} frames in ${sceneId} for "${premise}"${genre}${format}. Frame numbers: ${createdFrameNumbers.join(", ")}. Prompts are set — ready for image generation.`,
          isError: false,
        };
      }

      case "invoke_skill": {
        const skillName = String(input.skill_name || "").trim();
        const skillPrompt = String(input.prompt || "").trim();

        if (!skillName) return { output: "skill_name is required.", isError: true };
        if (!skillPrompt) return { output: "prompt is required.", isError: true };

        const SKILL_IDS: Record<string, string | undefined> = {
          "video-prompt-builder": process.env.SKILL_VIDEO_PROMPT_BUILDER_ID,
        };

        const skillId = SKILL_IDS[skillName];
        if (!skillId) {
          return {
            output: `Skill '${skillName}' is not configured. Ask the admin to set SKILL_VIDEO_PROMPT_BUILDER_ID in the environment.`,
            isError: true,
          };
        }

        try {
          const anthropic = getAnthropicClient();
          const response = await (anthropic as any).beta.messages.create({
            model: "claude-haiku-4-5",
            max_tokens: 8192,
            betas: ["code-execution-2025-08-25", "skills-2025-10-02"],
            container: {
              skills: [{ type: "custom", skill_id: skillId, version: "latest" }],
            },
            tools: [{ type: "code_execution_20250825", name: "code_execution" }],
            messages: [{ role: "user", content: skillPrompt }],
          });

          // The skill writes the structured script via a text_editor_code_execution "create" call.
          // Extract file_text from that block — it has the full ACT/SCENE/Prompt script.
          const createBlock = ((response.content as any[]) || []).find(
            (b: any) =>
              b.type === "server_tool_use" &&
              b.name === "text_editor_code_execution" &&
              b.input?.command === "create" &&
              typeof b.input?.file_text === "string"
          );
          if (createBlock?.input?.file_text) {
            return { output: createBlock.input.file_text, isError: false };
          }

          // Fallback: text blocks (summary only — no structured prompts)
          const text = ((response.content as any[]) || [])
            .filter((b: any) => b.type === "text")
            .map((b: any) => b.text as string)
            .join("");
          if (!text) return { output: "Skill returned no output.", isError: true };
          return { output: text, isError: false };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { output: `Skill invocation failed: ${msg}`, isError: true };
        }
      }

      case "save_script": {
        const scriptContent = String(input.script_content || "").trim();
        if (!scriptContent) return { output: "script_content is required.", isError: true };
        if (scriptContent.length < 50) return { output: "Script is too short to save.", isError: true };

        try {
          await convex.mutation(api.storyboard.projects.update, {
            id: projectId as any,
            script: scriptContent,
          });

          return {
            output: `Script saved (${scriptContent.length} characters). Tell the user: open the Script tab and click "Build Storyboard" — it automatically extracts all characters, environments, and props, then creates every frame with @ElementName references injected. Come back when it's done.`,
            isError: false,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { output: `Failed to save script: ${msg}`, isError: true };
        }
      }

      case "browse_project_files": {
        const category = input.category === "all" ? undefined : (input.category as string);
        const fileType = input.file_type === "all" ? undefined : (input.file_type as string);
        const limit = Number(input.limit || 20);
        try {
          const files = await convex.query(api.storyboard.storyboardFiles.listByProject, { projectId: projectId as any });
          let filtered = files as any[];
          if (category) filtered = filtered.filter((f) => f.category === category);
          if (fileType) filtered = filtered.filter((f) => f.fileType === fileType);
          filtered = filtered.sort((a, b) => (b.uploadedAt || 0) - (a.uploadedAt || 0)).slice(0, limit);
          if (filtered.length === 0) return { output: "No files found.", isError: false };
          return { output: stringifyResult(filtered.map((f) => ({ id: f._id, filename: f.filename, fileType: f.fileType, category: f.category, status: f.status, model: f.model || null, sourceUrl: f.sourceUrl || null, creditsUsed: f.creditsUsed || 0 }))), isError: false };
        } catch { return { output: "Could not browse project files.", isError: true }; }
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
