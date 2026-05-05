import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import type { DirectorToolName } from "./agent-tools";
import { MODEL_KNOWLEDGE } from "./constants";
import { getAnthropicClient } from "@/lib/support/anthropic";
import { analyzeScript } from "@/lib/storyboard/scriptAnalyzer";
import { cleanupItemFiles } from "@/lib/storyboard/cleanupFiles";
import { triggerImageGeneration } from "@/lib/storyboard/kieAI";
import { composePrompt, composeProductionSheetPrompt, composeWorldViewPrompt } from "@/app/storyboard-studio/components/ai/elementForgeConfig";
import { DEFAULT_PROMPT_TEMPLATES } from "@/lib/storyboard/defaultPromptTemplates";
import { findBestTemplates } from "@/lib/storyboard/templateMatcher";

// @mention injection — mirrors the logic in build-storyboard/route.ts
const _STOP_WORDS = new Set(["the", "a", "an", "of", "in", "at", "to", "for", "and", "or", "its", "with"]);

function _envKeywordMatch(prompt: string, elementName: string): boolean {
  const fullEsc = elementName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`\\b${fullEsc}\\b`, "i").test(prompt)) return true;
  const keywords = elementName.split(/\s+/).filter(w => w.length >= 5 && !_STOP_WORDS.has(w.toLowerCase()));
  return keywords.some(kw => new RegExp(`\\b${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i").test(prompt));
}

function _injectInline(prompt: string, elementName: string): string {
  const mention = `@${elementName.replace(/\s+/g, "")}`;
  if (prompt.includes(mention)) return prompt;
  const fullEsc = elementName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const fullMatch = new RegExp(`\\b(${fullEsc})\\b`, "i").exec(prompt);
  if (fullMatch) return prompt.slice(0, fullMatch.index) + mention + " " + prompt.slice(fullMatch.index);
  const keywords = elementName.split(/\s+/).filter(w => w.length >= 5 && !_STOP_WORDS.has(w.toLowerCase())).sort((a, b) => b.length - a.length);
  for (const kw of keywords) {
    const kwMatch = new RegExp(`\\b(${kw.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})\\b`, "i").exec(prompt);
    if (kwMatch) return prompt.slice(0, kwMatch.index) + mention + " " + prompt.slice(kwMatch.index);
  }
  return mention + " " + prompt;
}

function _injectElementMentions(prompt: string, elements: Array<{ name: string; type: string }>): string {
  if (!prompt || elements.length === 0) return prompt;
  let result = prompt;
  const inlineEls = elements.filter(el => el.type !== "environment").sort((a, b) => b.name.length - a.name.length);
  for (const el of inlineEls) result = _injectInline(result, el.name);
  const envEls = elements.filter(el => el.type === "environment");
  const envPrefix = envEls
    .filter(el => { const mention = `@${el.name.replace(/\s+/g, "")}`; return !result.includes(mention) && _envKeywordMatch(result, el.name); })
    .map(el => `@${el.name.replace(/\s+/g, "")}`).join(", ");
  if (envPrefix) result = `In the environment of ${envPrefix}, ` + result;
  return result;
}

// ── invoke_skill helpers ──────────────────────────────────────────────────────

function parseDurationMinutes(brief: string): number {
  const minMatch = brief.match(/(\d+(?:\.\d+)?)\s*[-\s]?min(?:ute)?s?/i);
  if (minMatch) return parseFloat(minMatch[1]);
  const secMatch = brief.match(/(\d+)\s*sec(?:ond)?s?/i);
  if (secMatch) return parseFloat(secMatch[1]) / 60;
  return 1; // default 1 min if not specified
}

function isComplexStory(brief: string): boolean {
  return /dragon|fight|battle|explos|magic|warrior|vfx|action|war|sci.?fi|superhero|combat|sword|monster|alien|robot|attack|chase|destroy|epic\s+battle/i.test(brief);
}

function buildActPrompt(originalBrief: string, actNum: number, totalActs: number, prevSummary?: string): string {
  if (totalActs === 1) return originalBrief;
  const startMin = (actNum - 1) * 2;
  const endMin = actNum * 2;
  const startScene = (actNum - 1) * 8 + 1;
  const endScene = actNum * 8;
  let prompt = `${originalBrief}\n\nGenerate Act ${actNum} of ${totalActs} only — scenes ${startScene}–${endScene} (${startMin}:00–${endMin}:00).`;
  if (prevSummary) prompt += ` Story so far: ${prevSummary}`;
  return prompt;
}

function extractActSummary(scriptText: string): string {
  const matches = [...scriptText.matchAll(/###\s*SCENE\s+\d+[^—\n]*—\s*([^\n]+)/g)];
  if (matches.length === 0) return "";
  return (matches[matches.length - 1][1] || "").substring(0, 150);
}

function mergeActScripts(acts: string[]): string {
  if (acts.length === 1) return acts[0];
  let merged = acts[0].replace(/\n>\s*💰[^\n]+\n?$/, "");
  for (let i = 1; i < acts.length; i++) {
    const act = acts[i];
    const firstScene = act.indexOf("### SCENE");
    const scenePart = firstScene >= 0 ? act.substring(firstScene) : act;
    merged += "\n\n" + scenePart.replace(/\n>\s*💰[^\n]+\n?$/, "");
  }
  return merged;
}

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
  convexToken?: string;
  onProgress?: (message: string) => void;
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

        // Single query to get all pending files for all elements at once
        const elementIds = (elements as any[]).map((e) => e._id);
        let pendingFiles: { categoryId: string; status: string }[] = [];
        try {
          pendingFiles = await convex.query(api.storyboard.storyboardFiles.listPendingElementFiles, { elementIds }) as any;
        } catch {}
        const pendingIdSet = new Set(pendingFiles.map((f) => f.categoryId));

        const mapped = (elements as any[]).map((e) => {
          const hasImage = !!(e.thumbnailUrl || (e.referenceUrls && e.referenceUrls.length > 0));
          const generating = pendingIdSet.has(String(e._id));
          return {
            name: e.name,
            type: e.type,
            description: e.description || "",
            usageCount: e.usageCount || 0,
            imageStatus: generating ? "generating" : hasImage ? "ready" : "no-image",
            imageCount: (e.referenceUrls || []).length,
          };
        });

        const noImage = mapped.filter((e) => e.imageStatus === "no-image");
        const generating = mapped.filter((e) => e.imageStatus === "generating");
        const ready = mapped.filter((e) => e.imageStatus === "ready");
        return {
          output: stringifyResult({
            elements: mapped,
            summary: [
              `${mapped.length} elements total.`,
              ready.length ? `${ready.length} ready: ${ready.map(e => e.name).join(", ")}.` : "",
              generating.length ? `${generating.length} currently generating (do NOT trigger again): ${generating.map(e => e.name).join(", ")}.` : "",
              noImage.length ? `${noImage.length} have no reference image yet: ${noImage.map(e => e.name).join(", ")}.` : "",
            ].filter(Boolean).join(" "),
          }),
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
        const identity = input.identity && typeof input.identity === "object" ? input.identity as Record<string, any> : undefined;

        // Reference photos for img2img — strip undefined entries before saving
        const rpRaw = input.reference_photos as Record<string, string> | undefined;
        const referencePhotos = rpRaw && typeof rpRaw === "object"
          ? (Object.fromEntries(Object.entries({
              face: rpRaw.face, outfit: rpRaw.outfit, fullBody: rpRaw.fullBody, head: rpRaw.head, body: rpRaw.body,
            }).filter(([, v]) => !!v)) as { face?: string; outfit?: string; fullBody?: string; head?: string; body?: string })
          : undefined;
        const hasRefPhotos = referencePhotos && Object.keys(referencePhotos).length > 0;

        await convex.mutation(api.storyboard.storyboardElements.create, {
          projectId: projectId as any,
          name: elName,
          type: elType,
          description: elDesc,
          thumbnailUrl: "",
          referenceUrls: [],
          tags: keywords,
          createdBy: ctx.userId,
          identity,
          ...(hasRefPhotos && { referencePhotos }),
        });

        const identityKeys = identity ? Object.keys(identity).filter(k => identity[k]) : [];
        const extras = [
          identityKeys.length > 0 && `identity (${identityKeys.join(", ")})`,
          hasRefPhotos && `${Object.keys(referencePhotos!).join("+")} photo(s)`,
        ].filter(Boolean).join(", ");

        return {
          output: `Created ${elType} "@${elName}".${extras ? ` Saved: ${extras}.` : ""} Call trigger_element_image_generation to generate a reference image — identity and reference photos will be used automatically.`,
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

      case "trigger_element_image_generation": {
        const elName = String(input.element_name || "").trim();
        if (!elName) return { output: "element_name is required.", isError: true };
        const elements = await convex.query(api.storyboard.storyboardElements.listByProject, { projectId: projectId as any });
        const el = (elements as any[]).find((e) => e.name.toLowerCase() === elName.toLowerCase());
        if (!el) return { output: `Element "${elName}" not found in the library.`, isError: true };

        // Guard: skip if there's already an active generation in flight for this element.
        // Stuck files (>90s with no callback) are marked failed so they don't permanently block retries.
        const ACTIVE_THRESHOLD_MS = 90 * 1000;
        const pendingCheck = await convex.query(api.storyboard.storyboardFiles.listPendingElementFiles, { elementIds: [el._id] }) as any[];
        const now = Date.now();
        const stuckFiles = pendingCheck.filter((f: any) => (now - (f.createdAt ?? 0)) >= ACTIVE_THRESHOLD_MS);
        const activeFiles = pendingCheck.filter((f: any) => (now - (f.createdAt ?? 0)) < ACTIVE_THRESHOLD_MS);
        // Clean up stuck files so they don't permanently block future generation.
        for (const stuck of stuckFiles) {
          try {
            await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
              fileId: stuck._id,
              status: "failed",
            });
          } catch {}
        }
        if (activeFiles.length > 0) {
          return { output: `A reference image for "${el.name}" is already generating — it should appear in the Elements panel within 30–60 seconds.`, isError: false };
        }

        // ── Reference photos (user-uploaded for img2img) ──────────────────────
        const refPhotos: Record<string, string> = el.referencePhotos || {};
        const refImageUrls: string[] = [];
        if (refPhotos.fullBody) {
          refImageUrls.push(refPhotos.fullBody);
        } else {
          if (refPhotos.face) refImageUrls.push(refPhotos.face);
          if (refPhotos.outfit) refImageUrls.push(refPhotos.outfit);
          if (refPhotos.head) refImageUrls.push(refPhotos.head);
          if (refPhotos.body) refImageUrls.push(refPhotos.body);
        }
        const hasRefs = refImageUrls.length > 0;

        // ── Model selection ───────────────────────────────────────────────────
        const requestedModel = String(input.model || "");
        const isBadModel = requestedModel === "nano-banana-2" || requestedModel === "nano-banana-pro";
        const baseModel = (isBadModel || !requestedModel) ? "gpt-image-2" : requestedModel;
        const model = hasRefs
          ? (baseModel === "gpt-image-2" || baseModel === "gpt-image-2-text-to-image" ? "gpt-image-2-image-to-image" : baseModel)
          : (baseModel === "gpt-image-2" || baseModel === "gpt-image-2-image-to-image" ? "gpt-image-2-text-to-image" : baseModel);

        const resolution = String(input.resolution || "1K");
        const creditsUsed = model.startsWith("gpt-image-2")
          ? (resolution === "4K" ? 10 : resolution === "2K" ? 7 : 4)
          : model === "z-image" ? 1 : 5;

        // ── Compose element description — identity fields → composePrompt ─────
        const hasIdentity = el.identity && Object.keys(el.identity as object).length > 0;
        const elementDescription = hasIdentity
          ? composePrompt(el.type as "character" | "environment" | "prop", el.identity as Record<string, any>)
          : (el.description || `${el.type} named ${el.name}`);

        // ── Select prompt template ────────────────────────────────────────────
        // Priority chain:
        //   1. el.preferredTemplate (user-starred in ElementForge) — skipped if it's a reference-sheet
        //   2. Keyword-scored best match via findBestTemplates (werewolf→C05, cockpit→E15, etc.)
        //      only applied when score ≥ 10 (at least one keyword match)
        //   3. composePrompt/description only (no template wrapper)
        //
        // Reference-sheet/production-sheet templates (E01, C01, P01…) are always excluded —
        // they produce multi-panel boards, not single concept images.
        const isRefSheetTemplate = (tpl: any) =>
          (tpl?.tags || []).includes("reference-sheet") ||
          /production\s+reference\s+sheet/i.test(tpl?.name || "");

        let templatePrompt: string | null = null;
        let templateName: string | null = null;

        // Step 1 — explicit preferredTemplate (user-starred, not auto-saved default)
        if (el.preferredTemplate) {
          try {
            const systemTpls = DEFAULT_PROMPT_TEMPLATES.filter(t => t.type === el.type);
            const dbTemplateRecords = await convex.query(api.promptTemplates.getByCompany, { companyId: ctx.companyId });
            const userTpls = (dbTemplateRecords as any[]).filter((t: any) => t.type === el.type && !t.isSystem);
            const allTpls = [...userTpls, ...systemTpls];
            const preferred = allTpls.find((t: any) => t.name === el.preferredTemplate || t.rawName === el.preferredTemplate);
            if (preferred && !isRefSheetTemplate(preferred)) {
              templatePrompt = String(preferred.prompt);
              templateName = String(preferred.name);
            }
          } catch {}
        }

        // Step 2 — keyword-scored matcher (same logic as ElementForge "Suggested" badge)
        // Include element name + raw description so "Tabletop Arena" or "werewolf" in the
        // name also drive template selection, not just the composed identity description.
        if (!templatePrompt && (el.type === "character" || el.type === "environment" || el.type === "prop")) {
          const matchInput = [el.name, el.description || "", (el.tags || []).join(" "), elementDescription].join(" ");
          const candidates = findBestTemplates(matchInput, el.type, 5);
          const best = candidates.find(c => {
            if (c.score < 10) return false; // require at least one keyword match
            const tpl = DEFAULT_PROMPT_TEMPLATES.find(t => t.name === c.name);
            return !isRefSheetTemplate(tpl);
          });
          if (best) {
            templatePrompt = best.prompt;
            templateName = `${best.name} (score ${best.score}, ${best.matchReason})`;
          }
        }

        let composedPrompt: string;
        if (input.custom_prompt) {
          composedPrompt = String(input.custom_prompt);
        } else if (templatePrompt) {
          composedPrompt = templatePrompt.includes("{description}")
            ? templatePrompt.replace(/\{description\}/g, elementDescription)
            : `${templatePrompt}\n\nCharacter Identity: ${elementDescription}`;
        } else {
          composedPrompt = elementDescription;
        }

        // ── Mode modifier (refStrength) ───────────────────────────────────────
        const requestedMode = String(input.mode || "");
        const refStrength: "prompt" | "balanced" | "image" =
          requestedMode === "image" ? "image" : requestedMode === "prompt" ? "prompt" : "balanced";

        let finalPrompt = composedPrompt;
        if (hasRefs && !input.custom_prompt) {
          if (refStrength === "prompt") {
            finalPrompt += `\n\nCRITICAL: The reference image(s) are for loose inspiration only. You MUST follow the TEXT description above for ALL visual details.`;
          } else if (refStrength === "balanced") {
            finalPrompt += `\n\nUse the reference image(s) as a guide for general shape and composition, but follow the text description for specific details.`;
          }
        }

        const project = await convex.query(api.storyboard.projects.get, { id: projectId as any });
        const aspectRatio = (project as any)?.aspectRatio || "16:9";
        const modelMode = hasRefs ? "image-to-image" : "text-to-image";
        const modelType = model.startsWith("gpt-image-2") ? "gpt-image-2" : model.startsWith("z-image") ? "z-image" : "gpt-image-2";
        const qualityParam = JSON.stringify({ type: modelType, mode: modelMode, nsfwChecker: false });
        const modeLabel = hasRefs ? refStrength : "text-to-image";

        ctx.onProgress?.(`Generating reference for "${el.name}" (${resolution}, ${creditsUsed}cr, ${modeLabel})…`);
        try {
          const webhookSecret = process.env.WEBHOOK_SECRET;
          if (!webhookSecret) throw new Error("WEBHOOK_SECRET not set — cannot call generate-image route internally");
          // Use localhost directly for internal server-to-server calls — NEVER the cloudflare
          // tunnel URL (NEXT_PUBLIC_APP_URL). The tunnel is for external KIE AI callbacks only.
          // Routing internally through the tunnel causes circular external requests that can
          // drop custom headers or stall. INTERNAL_BASE_URL can override port in production.
          const internalBase = process.env.INTERNAL_BASE_URL || "http://localhost:3000";
          const genRes = await fetch(`${internalBase}/api/storyboard/generate-image`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-Internal-Director": webhookSecret,
            },
            body: JSON.stringify({
              sceneContent: finalPrompt,
              style: "realistic",
              quality: qualityParam,
              aspectRatio,
              elementId: el._id,
              variantLabel: `${el.type} reference`,
              variantModel: model,
              companyId: ctx.companyId,
              userId: ctx.userId,
              projectId,
              creditsUsed,
              model,
              resolution,
              enhance: false,
              ...(hasRefs && { referenceImageUrls: refImageUrls }),
            }),
          });
          if (!genRes.ok) {
            const errText = await genRes.text();
            return { output: `Generation failed (${genRes.status}): ${errText}`, isError: true };
          }
          const genResult = await genRes.json();
          ctx.onProgress?.(`"${el.name}" queued (taskId: ${genResult.taskId})`);
          return {
            output: `Reference image queued for "${el.name}" (${el.type}) — ${model}, ${resolution}, ${creditsUsed}cr. Template: ${templateName ? `"${templateName}"` : "none"}. taskId: ${genResult.taskId}. Check the Elements panel for the result.`,
            isError: false,
          };
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

        const quality = (input.quality as string | undefined) ?? "quick";
        const isCinematic = quality === "cinematic";
        const durationMin = parseDurationMinutes(skillPrompt);
        const numActs = Math.ceil(durationMin / 2); // 2 min (8 scenes) per call

        // Cinematic (Sonnet): flat 18cr/min — covers $0.27/act worst case at 25% margin
        // Quick (Haiku): 6cr/min simple, 8cr/min complex — covers $0.098/act worst case at 18% margin
        const ratePerMin = isCinematic ? 18 : (isComplexStory(skillPrompt) ? 8 : 6);
        const totalCredits = Math.max(ratePerMin, Math.ceil(durationMin) * ratePerMin);

        let currentBalance = 0;
        try {
          currentBalance = await convex.query(api.credits.getBalance, { companyId: ctx.companyId });
        } catch { /* non-fatal */ }
        if (currentBalance < totalCredits) {
          return {
            output: `Insufficient credits. This script (${Math.ceil(durationMin)} min, ${isCinematic ? "cinematic" : isComplexStory(skillPrompt) ? "complex/action" : "simple"}) costs ${totalCredits} credits, but your balance is ${currentBalance}. Please top up to continue.`,
            isError: true,
          };
        }

        async function callSkillAct(actPrompt: string): Promise<string | null> {
          const MAX_RETRIES = 2;
          for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
            try {
              if (attempt > 0) await new Promise((r) => setTimeout(r, 2000 * attempt));
              const anthropic = getAnthropicClient();
              const response = await (anthropic as any).beta.messages.create({
                model: isCinematic ? "claude-sonnet-4-6" : "claude-haiku-4-5-20251001",
                max_tokens: 8192,
                betas: ["code-execution-2025-08-25", "skills-2025-10-02"],
                container: { skills: [{ type: "custom", skill_id: skillId, version: "latest" }] },
                tools: [{ type: "code_execution_20250825", name: "code_execution" }],
                messages: [{ role: "user", content: actPrompt }],
              });
              const createBlock = ((response.content as any[]) || []).find(
                (b: any) =>
                  b.type === "server_tool_use" &&
                  b.name === "text_editor_code_execution" &&
                  b.input?.command === "create" &&
                  typeof b.input?.file_text === "string"
              );
              if (createBlock?.input?.file_text) return createBlock.input.file_text as string;
              const text = ((response.content as any[]) || [])
                .filter((b: any) => b.type === "text").map((b: any) => b.text as string).join("");
              if (text) return text;
            } catch { /* retry */ }
          }
          return null;
        }

        const actOutputs: string[] = [];
        let prevSummary: string | undefined;

        for (let act = 1; act <= numActs; act++) {
          ctx.onProgress?.(numActs > 1
            ? `Writing Act ${act} of ${numActs}...`
            : "Writing script..."
          );
          const actPrompt = buildActPrompt(skillPrompt, act, numActs, prevSummary);
          const result = await callSkillAct(actPrompt);
          if (!result) {
            return {
              output: `Script generation failed at Act ${act} of ${numActs}. Please try again.`,
              isError: true,
            };
          }
          actOutputs.push(result);
          prevSummary = extractActSummary(result);
          const sceneCount = (result.match(/### SCENE/g) || []).length;
          ctx.onProgress?.(numActs > 1
            ? `Act ${act} of ${numActs} done — ${sceneCount} scene${sceneCount !== 1 ? "s" : ""}`
            : `Script complete — ${sceneCount} scene${sceneCount !== 1 ? "s" : ""}`
          );
        }

        if (numActs > 1) ctx.onProgress?.("Merging acts...");
        const scriptText = mergeActScripts(actOutputs);

        // Persist immediately so the script survives if the SSE connection drops
        try {
          await convex.mutation(api.storyboard.projects.update, {
            id: projectId as any,
            script: scriptText,
          });
        } catch (saveErr) {
          console.warn("[invoke_skill] Auto-save failed:", saveErr);
        }

        try {
          await convex.mutation(api.credits.deductCredits, {
            companyId: ctx.companyId,
            tokens: totalCredits,
            reason: `AI script generation (${Math.ceil(durationMin)}min, ${isCinematic ? "cinematic/Sonnet" : "quick/Haiku"}, ${numActs} act${numActs > 1 ? "s" : ""})`,
            type: "usage",
            model: "video-prompt-builder",
            action: "script_generation",
            projectId: projectId as any,
          });
        } catch (deductErr) {
          console.warn("[invoke_skill] Credit deduction failed:", deductErr);
        }

        return { output: scriptText, isError: false };
      }

      case "save_script": {
        const scriptContent = String(input.script_content || "").trim();
        if (!scriptContent) return { output: "script_content is required.", isError: true };
        if (scriptContent.length < 50) return { output: "Script is too short to save.", isError: true };

        try {
          // Check if invoke_skill already auto-saved this exact script to avoid
          // a redundant write (idempotent — safe to write again if different).
          const currentProject = await convex.query(api.storyboard.projects.get, {
            id: projectId as any,
          });
          const alreadySaved = (currentProject as any)?.script === scriptContent;

          if (!alreadySaved) {
            await convex.mutation(api.storyboard.projects.update, {
              id: projectId as any,
              script: scriptContent,
            });
          }

          return {
            output: `Script ${alreadySaved ? "confirmed" : "saved"} (${scriptContent.length} characters). Now call build_storyboard to create all frames automatically.`,
            isError: false,
          };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { output: `Failed to save script: ${msg}`, isError: true };
        }
      }

      case "build_storyboard": {
        const rebuildStrategy = String(input.rebuild_strategy || "replace_all");

        // Load saved script from project
        const proj = await convex.query(api.storyboard.projects.get, { id: projectId as any });
        if (!proj) return { output: "Project not found.", isError: true };

        const script = (proj as any).script;
        if (!script || script.trim().length < 20) {
          return { output: "No script saved yet. Call save_script first.", isError: true };
        }

        // Clean up and clear existing data if replacing all
        if (rebuildStrategy === "replace_all") {
          const existingItems = await convex.query(api.storyboard.build.listItemsForBuild, { projectId: projectId as any });
          const existingElements = await convex.query(api.storyboard.build.listElementsForBuild, { projectId: projectId as any });
          if (existingItems.length > 0 || existingElements.length > 0) {
            try {
              await cleanupItemFiles(convex, existingItems.map((i: any) => i._id), existingElements.map((e: any) => e._id));
            } catch { /* non-fatal */ }
          }
          await convex.mutation(api.storyboard.build.clearExistingData, { projectId: projectId as any });
        }

        // Load existing data for smart_merge dedup
        const existingElementMap = new Map<string, any>();
        if (rebuildStrategy === "smart_merge") {
          const existing = await convex.query(api.storyboard.build.listElementsForBuild, { projectId: projectId as any });
          for (const el of existing as any[]) {
            existingElementMap.set(`${el.name.toLowerCase().trim()}::${el.type}`, el);
          }
        }

        // Run the full script analysis pipeline
        ctx.onProgress?.("Parsing script...");
        const analysis = await analyzeScript(script);

        if (analysis.scenes.length === 0) {
          return { output: "Could not parse any scenes from the script. Check the script format.", isError: true };
        }

        ctx.onProgress?.(`${analysis.scenes.length} frames, ${analysis.elements.length} elements — saving...`);

        // Save elements
        const savedElementMap = new Map<string, any>();
        let elementsCreated = 0;
        let elementsReused = 0;

        for (const element of analysis.elements) {
          const key = `${element.name.toLowerCase().trim()}::${element.type}`;
          if (rebuildStrategy === "smart_merge" && existingElementMap.has(key)) {
            savedElementMap.set(element.name, existingElementMap.get(key)._id);
            elementsReused++;
            continue;
          }
          try {
            const id = await convex.mutation(api.storyboard.storyboardElements.create, {
              projectId: projectId as any,
              name: element.name,
              type: element.type,
              description: element.description,
              thumbnailUrl: "",
              referenceUrls: [],
              tags: element.tags,
              createdBy: ctx.userId,
              visibility: "private",
              identity: element.identity,
            });
            if (id) { savedElementMap.set(element.name, id); elementsCreated++; }
          } catch { /* skip failed elements */ }
        }

        // Save scenes (frames)
        ctx.onProgress?.("Creating frames...");
        let scenesCreated = 0;
        let scenesUpdated = 0;

        for (const scene of analysis.scenes) {
          const linkedElements = analysis.elements
            .filter(el => el.sceneIds.includes(scene.sceneId))
            .map(el => {
              const id = savedElementMap.get(el.name);
              return id ? { id, name: el.name, type: el.type } : null;
            })
            .filter(Boolean) as { id: any; name: string; type: string }[];

          const imagePrompt = _injectElementMentions(scene.imagePrompt || "", linkedElements);
          const videoPrompt = _injectElementMentions(scene.videoPrompt || "", linkedElements);

          try {
            await convex.mutation(api.storyboard.storyboardItems.create, {
              projectId: projectId as any,
              sceneId: scene.sceneId,
              order: scene.order,
              title: scene.title,
              description: scene.description,
              duration: scene.duration,
              generatedBy: ctx.userId,
              imagePrompt: imagePrompt || undefined,
              videoPrompt: videoPrompt || undefined,
              defaultImageModel: scene.defaultImageModel,
              defaultVideoModel: scene.defaultVideoModel,
              linkedElements: linkedElements.length > 0 ? linkedElements : undefined,
            });
            scenesCreated++;
          } catch { /* skip failed scenes */ }
        }

        if (analysis.preamble) {
          try {
            await convex.mutation(api.storyboard.build.updateProjectDescription, {
              projectId: projectId as any,
              description: analysis.preamble,
            });
          } catch { /* non-fatal */ }
        }

        const characters = analysis.elements.filter(e => e.type === "character").map(e => e.name);
        const environments = analysis.elements.filter(e => e.type === "environment").map(e => e.name);
        const props = analysis.elements.filter(e => e.type === "prop").map(e => e.name);

        return {
          output: stringifyResult({
            success: true,
            title: analysis.title || proj.name,
            genre: analysis.genre,
            parseMethod: analysis.parseMethod,
            framesCreated: scenesCreated,
            scenesUpdated,
            elementsCreated,
            elementsReused,
            elements: { characters, environments, props },
            totalDuration: `${analysis.totalDuration}s`,
            note: `Storyboard built. All frames are live in the Storyboard tab. ${characters.length > 0 ? `Characters extracted: ${characters.join(", ")}. ` : ""}Now offer to generate hero reference images for each character using z-image (1 credit each) to lock their look for consistency.`,
          }),
          isError: false,
        };
      }

      case "generate_world_view_concept": {
        const project = await convex.query(api.storyboard.projects.get, { id: projectId as any });
        if (!project) return { output: "Project not found.", isError: true };
        const elements = await convex.query(api.storyboard.storyboardElements.listByProject, { projectId: projectId as any });

        const projectName = (project as any).name || "Untitled";
        const genre = (project as any).settings?.genre;
        const lines: string[] = [];
        lines.push(`PROJECT: ${projectName}${genre ? ` — ${genre}` : ""}`);

        const chars = (elements as any[]).filter(e => e.type === "character");
        const envs = (elements as any[]).filter(e => e.type === "environment");
        const props = (elements as any[]).filter(e => e.type === "prop");

        if (chars.length > 0) {
          const charSummary = chars.map((c: any) => {
            const id = c.identity ?? {};
            const parts: string[] = [c.name];
            if (id.ageRange) parts.push(id.ageRange);
            if (id.ethnicity) parts.push(id.ethnicity);
            if (id.gender) parts.push(id.gender);
            if (id.archetype) parts.push(`${id.archetype} archetype`);
            if (id.outfitCustom?.trim()) parts.push(id.outfitCustom.trim());
            else if (id.outfit) parts.push(`${id.outfit} outfit`);
            return parts.join(", ");
          });
          lines.push(`PRINCIPAL CHARACTERS:\n${charSummary.map(s => `- ${s}`).join("\n")}`);
        }
        if (envs.length > 0) {
          const envSummary = envs.map((e: any) => {
            const id = e.identity ?? {};
            const parts: string[] = [e.name];
            if (id.setting) parts.push(id.setting);
            if (id.subSetting) parts.push(id.subSetting);
            if (id.timeOfDay) parts.push(id.timeOfDay);
            if (id.weather) parts.push(id.weather);
            if (id.mood) parts.push(id.mood);
            if (id.keyFeatures?.trim()) parts.push(id.keyFeatures.trim());
            return parts.join(", ");
          });
          lines.push(`WORLD / ENVIRONMENTS:\n${envSummary.map(s => `- ${s}`).join("\n")}`);
        }
        if (props.length > 0) lines.push(`KEY PROPS: ${props.map((p: any) => p.name).join(", ")}`);

        const projectScript = (project as any).script?.trim();
        if (projectScript) {
          const trimmed = projectScript.split("\n")
            .filter((line: string) => !/^\d+\.\d+s[–—\-]/.test(line.trim()))
            .join("\n").slice(0, 4000);
          lines.push(`FULL SCRIPT:\n${trimmed}`);
        }

        if (lines.length <= 1) return { output: "Not enough project data to generate concept.", isError: true };

        ctx.onProgress?.("Generating World View concept…");
        try {
          const anthropic = getAnthropicClient();
          const response = await anthropic.messages.create({
            model: "claude-haiku-4-5-20251001",
            max_tokens: 400,
            system: `You are a film pre-production designer writing a World View brief for a project bible.\n\nRead the full project script and element data provided. Write ONE focused paragraph of 150–200 words that synthesizes:\n- The principal characters and their visual identities\n- The story's world — its setting, scale, texture, dominant light quality and atmosphere\n- The emotional arc of the full story\n- The project's visual language — color palette, contrast, cinematographic tone\n\nRules:\n- Write in cinematic prose only. No lists, no headers, no bullet points.\n- Be specific and visual. Use language an AI image generator can render.\n- Do not start with "In this story" or "This project" — open with the world and its characters.`,
            messages: [{ role: "user", content: lines.join("\n\n") }],
          });
          const concept = response.content.filter((b) => b.type === "text").map((b) => (b as any).text).join("").trim();
          if (!concept) return { output: "Haiku returned an empty concept. Try again.", isError: true };
          await convex.mutation(api.storyboard.projects.updateWorldView, { id: projectId as any, worldViewConcept: concept });
          return { output: `World View concept generated and saved. Visible in World View Sheet → Concept tab.\n\n"${concept.slice(0, 300)}${concept.length > 300 ? "…" : ""}"`, isError: false };
        } catch (err) { return { output: `Failed: ${err instanceof Error ? err.message : String(err)}`, isError: true }; }
      }

      case "generate_world_view_image": {
        const project = await convex.query(api.storyboard.projects.get, { id: projectId as any });
        if (!project) return { output: "Project not found.", isError: true };
        const concept = (project as any).worldViewConcept?.trim();
        if (!concept) return { output: "No World View concept saved. Run generate_world_view_concept first.", isError: true };

        const elements = await convex.query(api.storyboard.storyboardElements.listByProject, { projectId: projectId as any });
        const elData = (elements as any[]).map(el => {
          const refs = el.referenceUrls ?? [];
          const url = el.thumbnailUrl || refs[el.primaryIndex ?? 0] || refs[0] || undefined;
          return { name: el.name, type: el.type, identity: el.identity, primaryImageUrl: url };
        });
        const refUrls = elData.map(e => e.primaryImageUrl).filter(Boolean) as string[];
        const hasRefs = refUrls.length > 0;

        const resolution = String(input.resolution || "1K");
        const creditMap: Record<string, number> = { "1K": 4, "2K": 7, "4K": 10 };
        const creditsUsed = creditMap[resolution] ?? 4;
        const model = hasRefs ? "gpt-image-2-image-to-image" : "gpt-image-2-text-to-image";
        const qualityParam = JSON.stringify({ type: "gpt-image-2", mode: hasRefs ? "image-to-image" : "text-to-image", nsfwChecker: false });

        const prompt = composeWorldViewPrompt({ concept, elements: elData, projectName: (project as any).name });
        ctx.onProgress?.(`Generating World View Sheet (${resolution}, ${creditsUsed}cr, ${refUrls.length} element refs)…`);
        try {
          await triggerImageGeneration({
            prompt, model, resolution, quality: qualityParam as any, aspectRatio: "16:9",
            categoryId: projectId as any, category: "worldview",
            variantLabel: "World View Sheet", variantModel: model,
            companyId: ctx.companyId, userId: ctx.userId, projectId, creditsUsed,
            convexToken: ctx.convexToken,
            ...(hasRefs && { referenceImageUrls: refUrls }),
          });
          return { output: `World View Sheet queued — ${resolution}, ${creditsUsed}cr, ${refUrls.length} element references. Check World View Sheet → Generate tab for the result.`, isError: false };
        } catch (err) { return { output: `Failed: ${err instanceof Error ? err.message : String(err)}`, isError: true }; }
      }

      case "generate_scene_production_sheet": {
        const frameNum = Number(input.frame_number);
        if (!frameNum || frameNum < 1) return { output: "frame_number must be a positive number.", isError: true };
        const items = await convex.query(api.storyboard.storyboardItems.listByProject, { projectId: projectId as any });
        const sorted = (items as any[]).sort((a, b) => a.order - b.order);
        const frame = sorted[frameNum - 1];
        if (!frame) return { output: `Frame ${frameNum} not found.`, isError: true };

        const elements = await convex.query(api.storyboard.storyboardElements.listByProject, { projectId: projectId as any });
        const project = await convex.query(api.storyboard.projects.get, { id: projectId as any });
        const worldViewConcept = (project as any)?.worldViewConcept;

        const linkedIds = new Set((frame.linkedElements ?? []).map((le: any) => String(le.id)));
        const frameEls = linkedIds.size > 0
          ? (elements as any[]).filter(el => linkedIds.has(String(el._id)))
          : (elements as any[]);

        const elData = frameEls.map((el: any) => ({
          name: el.name, type: el.type, identity: el.identity,
          primaryImageUrl: el.thumbnailUrl || (el.referenceUrls ?? [])[el.primaryIndex ?? 0] || (el.referenceUrls ?? [])[0] || undefined,
        }));

        const refUrls: string[] = [];
        if (frame.imageUrl) refUrls.push(frame.imageUrl);
        for (const el of elData) { if (el.primaryImageUrl && !refUrls.includes(el.primaryImageUrl)) refUrls.push(el.primaryImageUrl); }
        const hasRefs = refUrls.length > 0;

        const resolution = String(input.resolution || "1K");
        const creditMap: Record<string, number> = { "1K": 4, "2K": 7, "4K": 10 };
        const creditsUsed = creditMap[resolution] ?? 4;
        const model = hasRefs ? "gpt-image-2-image-to-image" : "gpt-image-2-text-to-image";
        const qualityParam = JSON.stringify({ type: "gpt-image-2", mode: hasRefs ? "image-to-image" : "text-to-image", nsfwChecker: false });
        const aspectRatio = (project as any)?.aspectRatio || "16:9";

        const prompt = composeProductionSheetPrompt({
          elements: elData, imagePrompt: frame.imagePrompt, videoPrompt: frame.videoPrompt,
          description: frame.description || frame.title,
          cutCount: frame.videoPrompt ? frame.videoPrompt.split("\n").filter(Boolean).length : undefined,
          concept: worldViewConcept,
        });

        ctx.onProgress?.(`Generating production sheet for frame ${frameNum} "${frame.title || ""}" (${resolution}, ${creditsUsed}cr)…`);
        try {
          await triggerImageGeneration({
            prompt, model, resolution, quality: qualityParam as any, aspectRatio,
            categoryId: frame._id, category: "production-sheet",
            variantLabel: `Frame ${frameNum} Production Sheet`, variantModel: model,
            companyId: ctx.companyId, userId: ctx.userId, projectId, creditsUsed,
            convexToken: ctx.convexToken,
            ...(hasRefs && { referenceImageUrls: refUrls }),
          });
          return { output: `Production sheet queued for frame ${frameNum} "${frame.title || ""}" — ${resolution}, ${creditsUsed}cr, ${refUrls.length} reference images. Check the frame gallery for the result.`, isError: false };
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
