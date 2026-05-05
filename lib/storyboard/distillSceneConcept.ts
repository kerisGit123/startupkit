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

export interface SceneElement {
  name: string;
  type: string;
  identity?: Record<string, any>;
  description?: string;
}

export async function distillSceneConcept(params: {
  description?: string;
  imagePrompt?: string;
  videoPrompt?: string;
  elements?: SceneElement[];
  worldViewConcept?: string;
}): Promise<string> {
  const { description, imagePrompt, videoPrompt, elements = [], worldViewConcept } = params;
  const lines: string[] = [];

  if (description?.trim()) lines.push(`SCENE: ${description.trim()}`);

  const chars = elements.filter(e => e.type === "character");
  const props = elements.filter(e => e.type === "prop");
  const envs = elements.filter(e => e.type === "environment");

  if (chars.length > 0) {
    const names = chars.map(c => {
      const id = c.identity ?? {};
      const parts: string[] = [c.name];
      if (id.ageRange) parts.push(id.ageRange);
      if (id.ethnicity) parts.push(id.ethnicity);
      if (id.gender) parts.push(id.gender);
      if (id.archetype) parts.push(`${id.archetype} archetype`);
      if (id.expression) parts.push(`${id.expression} expression`);
      if (id.outfitCustom?.trim()) parts.push(id.outfitCustom.trim());
      else if (id.outfit) parts.push(`${id.outfit} outfit`);
      if (id.era) parts.push(`${id.era} era`);
      // Fall back to description if no identity fields
      if (parts.length === 1 && c.description) parts.push(c.description.slice(0, 120));
      return parts.join(", ");
    });
    lines.push(`CHARACTERS: ${names.join(" | ")}`);
  }

  if (props.length > 0) {
    const names = props.map(p => {
      const id = p.identity ?? {};
      const parts: string[] = [p.name];
      if (id.material) parts.push(id.material);
      if (id.condition) parts.push(id.condition);
      if (id.details?.trim()) parts.push(id.details.trim());
      else if (p.description) parts.push(p.description.slice(0, 80));
      return parts.join(", ");
    });
    lines.push(`KEY PROPS: ${names.join(" | ")}`);
  }

  if (envs.length > 0) {
    const envSummary = envs.map(e => {
      const id = e.identity ?? {};
      const parts: string[] = [e.name];
      if (id.setting) parts.push(id.setting);
      if (id.subSetting) parts.push(id.subSetting);
      if (id.timeOfDay) parts.push(id.timeOfDay);
      if (id.weather) parts.push(id.weather);
      if (id.mood) parts.push(id.mood);
      if (id.keyFeatures?.trim()) parts.push(id.keyFeatures.trim());
      else if (e.description) parts.push(e.description.slice(0, 80));
      return parts.join(", ");
    });
    lines.push(`ENVIRONMENT: ${envSummary.join(" | ")}`);
  }

  if (worldViewConcept?.trim()) {
    lines.push(`WORLD VIEW CONTEXT (full project universe):\n${worldViewConcept.trim()}`);
  }

  if (imagePrompt?.trim()) lines.push(`VISUAL STYLE: ${imagePrompt.trim()}`);

  if (videoPrompt?.trim()) {
    const cuts = videoPrompt.trim().split("\n").map(l => l.trim()).filter(Boolean).slice(0, 8);
    lines.push(`SHOT LIST (${cuts.length} cuts):\n${cuts.map((c, i) => `Cut ${i + 1}: ${c}`).join("\n")}`);
  }

  if (lines.length === 0) return "";

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 300,
      system: SCENE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: lines.join("\n\n") }],
    });
    return response.content
      .filter(b => b.type === "text")
      .map(b => (b as any).text as string)
      .join("")
      .trim();
  } catch (err) {
    console.warn("[distillSceneConcept] Haiku call failed:", err);
    return "";
  }
}
