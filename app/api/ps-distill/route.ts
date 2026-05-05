import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAnthropicClient } from "@/lib/support/anthropic";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

const SCENE_SYSTEM_PROMPT = `You are a film pre-production designer writing a visual concept brief for a production sheet.

Read the scene data provided and write ONE focused paragraph of 120–150 words that captures:
- Who the principal characters are and how they look and feel visually
- The world or environment they inhabit — its scale, texture, light quality, atmosphere
- The key dramatic moment or emotional arc of this scene
- The visual tone: color temperature, contrast, mood

Rules:
- Write in cinematic prose only. No lists, no headers, no bullet points.
- Be specific and sensory — describe what the camera would see.
- Use language an AI image generator can translate directly into visuals.
- Do not mention technical specs (lens mm, shot types) — those come from the shot list.
- Do not start with "In this scene" or "This story" — open with the world itself.`;

const WORLDVIEW_SYSTEM_PROMPT = `You are a film pre-production designer writing a World View brief for a project bible.

Read the full project script and element data provided. Write ONE focused paragraph of 150–200 words that synthesizes:
- The principal characters and their visual identities — who they are, how they look, what they wear
- The story's world — its setting, scale, texture, dominant light quality and atmosphere
- The emotional arc of the full story — where it begins, what it builds toward, how it resolves
- The project's visual language — color palette, contrast, cinematographic tone

Rules:
- Write in cinematic prose only. No lists, no headers, no bullet points.
- Synthesize the WHOLE story, not just one scene.
- Be specific and visual — describe what defines this universe visually.
- Use language an AI image generator can use to render a complete production bible page.
- Do not start with "In this story" or "This project" — open with the world and its characters.`;

// Strip timestamped beats from SKILL-format scripts — keep scene names + image prompts + video headers
function trimScriptForWorldView(script: string): string {
  const lines = script.split("\n");
  const kept = lines.filter(line => {
    const trimmed = line.trim();
    // Drop timestamp beat lines: "0.0s–1.2s: ..." or "1.2s–2.5s: ..."
    if (/^\d+\.\d+s[–—\-]/.test(trimmed)) return false;
    return true;
  });
  // Cap at ~4000 chars to stay well within Haiku's context and keep cost low
  return kept.join("\n").slice(0, 4000);
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { mode = "scene", elements = [], videoPrompt, imagePrompt, description, cutCount, projectScript, projectName, genre, worldViewConcept } = body;

  const isWorldView = mode === "worldview";
  const lines: string[] = [];

  if (isWorldView) {
    // ── World View mode: full project synthesis ──────────────────────────────
    if (projectName?.trim()) lines.push(`PROJECT: ${projectName.trim()}${genre ? ` — ${genre}` : ""}`);

    if (elements.length > 0) {
      const chars = elements.filter((e: any) => e.type === "character");
      const envs = elements.filter((e: any) => e.type === "environment");
      const props = elements.filter((e: any) => e.type === "prop");

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

      if (props.length > 0) {
        lines.push(`KEY PROPS: ${props.map((p: any) => p.name).join(", ")}`);
      }
    }

    if (projectScript?.trim()) {
      const trimmed = trimScriptForWorldView(projectScript);
      lines.push(`FULL SCRIPT (scene names, image prompts, visual style):\n${trimmed}`);
    }

  } else {
    // ── Scene mode: single scene distillation ────────────────────────────────
    if (description?.trim()) lines.push(`SCENE: ${description.trim()}`);

    const characters = elements.filter((e: any) => e.type === "character");
    const props = elements.filter((e: any) => e.type === "prop");
    const environments = elements.filter((e: any) => e.type === "environment");

    if (characters.length > 0) {
      const names = characters.map((c: any) => {
        const identity = c.identity ?? {};
        const parts: string[] = [c.name];
        if (identity.ageRange) parts.push(identity.ageRange);
        if (identity.ethnicity) parts.push(identity.ethnicity);
        if (identity.gender) parts.push(identity.gender);
        if (identity.archetype) parts.push(`${identity.archetype} archetype`);
        if (identity.expression) parts.push(`${identity.expression} expression`);
        if (identity.outfitCustom?.trim()) parts.push(identity.outfitCustom.trim());
        else if (identity.outfit) parts.push(`${identity.outfit} outfit`);
        if (identity.era) parts.push(`${identity.era} era`);
        // Fallback: use description when identity fields are sparse (auto-extracted elements)
        if (parts.length === 1 && c.description?.trim()) parts.push(c.description.trim().slice(0, 150));
        return parts.join(", ");
      });
      lines.push(`CHARACTERS: ${names.join(" | ")}`);
    }

    if (props.length > 0) {
      const names = props.map((p: any) => {
        const identity = p.identity ?? {};
        const parts: string[] = [p.name];
        // Use description first (richest for auto-extracted elements), fall back to identity fields
        if (identity.details?.trim()) parts.push(identity.details.trim());
        else if (p.description?.trim()) parts.push(p.description.trim().slice(0, 150));
        if (identity.material) parts.push(identity.material);
        if (identity.condition) parts.push(identity.condition);
        return parts.join(", ");
      });
      lines.push(`KEY PROPS: ${names.join(" | ")}`);
    }

    if (environments.length > 0) {
      const envs = environments.map((e: any) => {
        const identity = e.identity ?? {};
        const parts: string[] = [e.name];
        if (identity.setting) parts.push(identity.setting);
        if (identity.subSetting) parts.push(identity.subSetting);
        if (identity.timeOfDay) parts.push(identity.timeOfDay);
        if (identity.weather) parts.push(identity.weather);
        if (identity.mood) parts.push(identity.mood);
        if (identity.keyFeatures?.trim()) parts.push(identity.keyFeatures.trim());
        return parts.join(", ");
      });
      lines.push(`ENVIRONMENT: ${envs.join(" | ")}`);
    }

    if (worldViewConcept?.trim()) lines.push(`WORLD VIEW CONTEXT (full project universe):\n${worldViewConcept.trim()}`);

    if (imagePrompt?.trim()) lines.push(`VISUAL STYLE: ${imagePrompt.trim()}`);

    if (videoPrompt?.trim()) {
      const cuts = videoPrompt.trim().split("\n").map((l: string) => l.trim()).filter(Boolean).slice(0, 8);
      lines.push(`SHOT LIST (${cutCount ?? cuts.length} cuts):\n${cuts.map((c: string, i: number) => `Cut ${i + 1}: ${c}`).join("\n")}`);
    }
  }

  if (lines.length === 0) {
    return NextResponse.json({ concept: "" });
  }

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: isWorldView ? 400 : 300,
      system: isWorldView ? WORLDVIEW_SYSTEM_PROMPT : SCENE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: lines.join("\n\n") }],
    });

    const concept = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text)
      .join("")
      .trim();

    return NextResponse.json({ concept });
  } catch (err) {
    console.error("[ps-distill] Haiku call failed:", err);
    return NextResponse.json({ concept: description?.trim() ?? "" });
  }
}
