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
