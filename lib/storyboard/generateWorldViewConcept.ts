import { getAnthropicClient } from "@/lib/support/anthropic";

const HAIKU_MODEL = "claude-haiku-4-5-20251001";

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

function trimScriptForWorldView(script: string): string {
  const lines = script.split("\n");
  const kept = lines.filter(line => {
    const trimmed = line.trim();
    if (/^\d+\.\d+s[–—\-]/.test(trimmed)) return false;
    return true;
  });
  return kept.join("\n").slice(0, 4000);
}

export async function generateWorldViewConcept(params: {
  scriptText: string;
  elements: Array<{ name: string; type: string; description?: string }>;
  projectName?: string;
  genre?: string;
}): Promise<string> {
  const { scriptText, elements, projectName, genre } = params;
  const lines: string[] = [];

  if (projectName?.trim()) {
    lines.push(`PROJECT: ${projectName.trim()}${genre ? ` — ${genre}` : ""}`);
  }

  if (elements.length > 0) {
    const chars = elements.filter(e => e.type === "character");
    const envs = elements.filter(e => e.type === "environment");
    const props = elements.filter(e => e.type === "prop");

    if (chars.length > 0) {
      const summary = chars.map(c => {
        const parts = [c.name];
        if (c.description) parts.push(c.description.slice(0, 120));
        return parts.join(": ");
      });
      lines.push(`PRINCIPAL CHARACTERS:\n${summary.map(s => `- ${s}`).join("\n")}`);
    }

    if (envs.length > 0) {
      const summary = envs.map(e => {
        const parts = [e.name];
        if (e.description) parts.push(e.description.slice(0, 120));
        return parts.join(": ");
      });
      lines.push(`WORLD / ENVIRONMENTS:\n${summary.map(s => `- ${s}`).join("\n")}`);
    }

    if (props.length > 0) {
      lines.push(`KEY PROPS: ${props.map(p => p.name).join(", ")}`);
    }
  }

  if (scriptText?.trim()) {
    lines.push(`FULL SCRIPT:\n${trimScriptForWorldView(scriptText)}`);
  }

  if (lines.length === 0) return "";

  try {
    const client = getAnthropicClient();
    const response = await client.messages.create({
      model: HAIKU_MODEL,
      max_tokens: 400,
      system: WORLDVIEW_SYSTEM_PROMPT,
      messages: [{ role: "user", content: lines.join("\n\n") }],
    });

    return response.content
      .filter((b) => b.type === "text")
      .map((b) => (b as any).text as string)
      .join("")
      .trim();
  } catch (err) {
    console.warn("[generateWorldViewConcept] Haiku call failed:", err);
    return "";
  }
}
