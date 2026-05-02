import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAnthropicClient } from "@/lib/support/anthropic";
import type { Id } from "@/convex/_generated/dataModel";

export const maxDuration = 180;

interface ConfirmedElement {
  elementId: string;
  elementName: string;
  elementType: string;
  oldDescription: string;
  newDescription: string;
}

// Extract a scene's raw text from the script using its title as anchor
function extractSceneSegment(script: string, sceneId: string): { text: string; start: number; end: number } | null {
  // Match SCENE markers like "SCENE 1A", "SCENE 2B", "SCENE 4"
  const sceneNum = sceneId.replace("scene_", "").toUpperCase();
  const pattern = new RegExp(`(SCENE\\s+${sceneNum.replace(/([A-Z])$/, "\\s*$1")}[^\\n]*)`, "i");
  const match = pattern.exec(script);
  if (!match) return null;

  const start = match.index;
  // Find next SCENE marker or end of script
  const afterStart = script.substring(start + match[0].length);
  const nextScene = /\bSCENE\s+\d/i.exec(afterStart);
  const end = nextScene ? start + match[0].length + nextScene.index : script.length;

  return { text: script.substring(start, end), start, end };
}

async function rewriteSegment(
  segment: string,
  elements: ConfirmedElement[],
  anthropic: ReturnType<typeof getAnthropicClient>
): Promise<{ rewritten: string; changes: string[] }> {
  const elementContext = elements
    .map(el => `ELEMENT: "${el.elementName}" (${el.elementType})
OLD DESCRIPTION: ${el.oldDescription}
NEW DESCRIPTION (from reference image): ${el.newDescription}`)
    .join("\n\n");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 2048,
    system: `You are a professional script supervisor performing a production continuity pass.
Reference images have been finalized. Update the script segment so visual descriptions of elements match their actual designs.

RULES — MUST FOLLOW:
1. Change ONLY visual appearance of the listed elements (colors, materials, clothing, shapes)
2. Preserve EXACTLY: all timing beats (0.0s–3.0s:), camera directions, action verbs, plot events, mood
3. Preserve EXACTLY: scene headers (SCENE 1A etc), structural markers (---), emoji indicators
4. Never add or remove sentences — only update descriptive words within existing sentences
5. Return JSON only — no markdown`,
    messages: [
      {
        role: "user",
        content: `CONFIRMED ELEMENT CHANGES:\n${elementContext}\n\nSCRIPT SEGMENT TO REWRITE:\n${segment}\n\nReturn JSON:\n{"rewritten":"...","changes":["brief description of each change made"]}`,
      },
    ],
  });

  const text = response.content
    .filter((b): b is { type: "text"; text: string } => b.type === "text")
    .map(b => b.text)
    .join("");

  try {
    const clean = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
    const parsed = JSON.parse(clean);
    return { rewritten: parsed.rewritten || segment, changes: parsed.changes || [] };
  } catch {
    return { rewritten: segment, changes: [] };
  }
}

export async function POST(req: NextRequest) {
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
  try { if (!convexToken) convexToken = await authResult.getToken(); } catch {}

  const { projectId, confirmedElements, affectedSceneIds } = await req.json() as {
    projectId: string;
    confirmedElements: ConfirmedElement[];
    affectedSceneIds: string[];
  };

  if (!projectId || !confirmedElements?.length) {
    return NextResponse.json({ error: "projectId and confirmedElements required" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (convexToken) convex.setAuth(convexToken);

  const project = await convex.query(api.storyboard.projects.get, {
    id: projectId as Id<"storyboard_projects">,
  });

  if (!project?.script) {
    return NextResponse.json({ error: "Project has no script" }, { status: 400 });
  }

  const script = project.script;
  const anthropic = getAnthropicClient();

  // Determine if structured (has SCENE markers) or freeform
  const isStructured = /SCENE\s+\d/i.test(script);
  const scriptTokenEstimate = Math.ceil(script.length / 4);
  const useSonnet = !isStructured && scriptTokenEstimate > 4000;

  let newScript = script;
  const sceneChanges: { sceneId: string; changes: string[] }[] = [];

  if (isStructured && affectedSceneIds?.length > 0) {
    // Segment-based: rewrite only affected scenes in parallel
    const segments = affectedSceneIds
      .map(id => ({ id, segment: extractSceneSegment(script, id) }))
      .filter(s => s.segment !== null) as { id: string; segment: { text: string; start: number; end: number } }[];

    const rewrites = await Promise.all(
      segments.map(async ({ id, segment }) => {
        const result = await rewriteSegment(segment.text, confirmedElements, anthropic);
        return { id, original: segment.text, rewritten: result.rewritten, changes: result.changes, start: segment.start, end: segment.end };
      })
    );

    // Splice in reverse order to preserve string positions
    const sorted = [...rewrites].sort((a, b) => b.start - a.start);
    for (const rw of sorted) {
      if (rw.rewritten !== rw.original) {
        newScript = newScript.slice(0, rw.start) + rw.rewritten + newScript.slice(rw.end);
        if (rw.changes.length > 0) {
          sceneChanges.push({ sceneId: rw.id, changes: rw.changes });
        }
      }
    }
  } else {
    // Freeform or short script — single pass
    const model = useSonnet ? "claude-sonnet-4-6" : "claude-haiku-4-5";
    const elementContext = confirmedElements
      .map(el => `ELEMENT: "${el.elementName}"\nOLD: ${el.oldDescription}\nNEW: ${el.newDescription}`)
      .join("\n\n");

    const response = await anthropic.messages.create({
      model,
      max_tokens: 8000,
      system: `You are a professional script supervisor. Update the script so visual descriptions of elements match their actual reference image designs. Preserve all structure, timing, camera directions, and plot exactly. Only change visual appearance descriptions of the listed elements. Return JSON only.`,
      messages: [
        {
          role: "user",
          content: `ELEMENT CHANGES:\n${elementContext}\n\nSCRIPT:\n${script}\n\nReturn: {"rewritten":"full rewritten script","sceneChanges":[{"sceneId":"scene_1a","changes":["..."]}]}`,
        },
      ],
    });

    const text = response.content
      .filter((b): b is { type: "text"; text: string } => b.type === "text")
      .map(b => b.text)
      .join("");

    try {
      const clean = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
      const parsed = JSON.parse(clean);
      newScript = parsed.rewritten || script;
      if (parsed.sceneChanges) sceneChanges.push(...parsed.sceneChanges);
    } catch {
      // Keep original script if parse fails
    }
  }

  // Build a simple diff summary
  const totalChanges = sceneChanges.reduce((sum, s) => sum + s.changes.length, 0);

  return NextResponse.json({
    newScript,
    sceneChanges,
    totalChanges,
    modelUsed: useSonnet ? "sonnet" : "haiku",
    creditsCharged: useSonnet ? 5 : 2,
  });
}
