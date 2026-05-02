import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { getAnthropicClient } from "@/lib/support/anthropic";
import type { Id } from "@/convex/_generated/dataModel";

export const maxDuration = 120;

const TYPE_INSTRUCTIONS: Record<string, string> = {
  character: `For CHARACTER elements, identify differences in:
- Gender, age, ethnicity, build, height
- Hair color, hair style, eye color, facial hair
- Outfit/clothing (be specific about colors, style, materials)
- Distinctive features (scars, tattoos, accessories, glasses)
- Overall expression and archetype
- Whether they are human or non-human (creature/robot/etc)`,

  environment: `For ENVIRONMENT elements, identify differences in:
- Setting type (underwater, space, urban, forest, etc.)
- Time of day and lighting conditions
- Weather and atmosphere
- Mood (eerie, grand, cozy, claustrophobic, etc.)
- Key visual features (architectural elements, natural features)
- Color palette and overall atmosphere`,

  prop: `For PROP elements, identify differences in:
- What the object actually is (category, function)
- Material (metal, wood, glass, fabric, etc.)
- Size (relative to surroundings if visible)
- Color and surface condition (pristine, worn, rusted, damaged)
- Distinctive design details, markings, or engravings
- Era/style (futuristic, vintage, modern, ancient)`,
};

export async function POST(req: NextRequest) {
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  let convexToken: string | null = null;
  try { convexToken = await authResult.getToken({ template: "convex" }); } catch {}
  try { if (!convexToken) convexToken = await authResult.getToken(); } catch {}

  const { projectId, elementIds } = await req.json();

  if (!projectId || !elementIds?.length) {
    return NextResponse.json({ error: "projectId and elementIds required" }, { status: 400 });
  }

  const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
  if (convexToken) convex.setAuth(convexToken);

  // Fetch all project elements
  const allElements = await convex.query(api.storyboard.storyboardElements.listByProject, {
    projectId: projectId as Id<"storyboard_projects">,
  });

  // Filter to requested elements that have a primary image
  const targets = allElements.filter((el: any) =>
    elementIds.includes(el._id) &&
    el.referenceUrls?.length > 0
  );

  if (targets.length === 0) {
    return NextResponse.json({ error: "No analyzable elements found (need primary images)" }, { status: 400 });
  }

  const anthropic = getAnthropicClient();
  const results = await Promise.all(
    targets.map(async (el: any) => {
      const primaryUrl = el.referenceUrls[el.primaryIndex ?? 0] || el.referenceUrls[0];

      const systemPrompt = `You are a production continuity supervisor comparing a reference image against a script description to find visual conflicts.

${TYPE_INSTRUCTIONS[el.type] || ""}

Return ONLY valid JSON, no markdown. If the image matches the description well, return empty changes array.`;

      const userPrompt = `ELEMENT: "${el.name}" (${el.type})

CURRENT DESCRIPTION:
${el.description || "(none)"}

CURRENT IDENTITY FIELDS:
${JSON.stringify(el.identity || {}, null, 2)}

Analyze the image. Find specific visual CONFLICTS between what the image shows vs the current description.
Return JSON:
{
  "newDescription": "updated 100+ char description based exactly on what the image shows",
  "updatedIdentity": { "only": "fields that differ from current" },
  "changes": [
    {
      "field": "fieldName or 'description'",
      "oldValue": "current value",
      "newValue": "value from image",
      "reason": "brief reason why",
      "confidence": "high|medium|low"
    }
  ]
}`;

      try {
        const response = await anthropic.messages.create({
          model: "claude-sonnet-4-6",
          max_tokens: 1024,
          system: systemPrompt,
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image",
                  source: { type: "url", url: primaryUrl },
                },
                { type: "text", text: userPrompt },
              ],
            },
          ],
        });

        const text = response.content
          .filter((b): b is { type: "text"; text: string } => b.type === "text")
          .map(b => b.text)
          .join("");

        const clean = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
        const parsed = JSON.parse(clean);

        return {
          elementId: el._id,
          elementName: el.name,
          elementType: el.type,
          primaryImageUrl: primaryUrl,
          currentDescription: el.description || "",
          currentIdentity: el.identity || {},
          newDescription: parsed.newDescription || el.description || "",
          updatedIdentity: parsed.updatedIdentity || {},
          changes: parsed.changes || [],
          success: true,
        };
      } catch (err) {
        console.error(`[visual-lock/analyze] Failed for element ${el.name}:`, err);
        return {
          elementId: el._id,
          elementName: el.name,
          elementType: el.type,
          primaryImageUrl: primaryUrl,
          currentDescription: el.description || "",
          currentIdentity: el.identity || {},
          newDescription: el.description || "",
          updatedIdentity: {},
          changes: [],
          success: false,
          error: err instanceof Error ? err.message : "Analysis failed",
        };
      }
    })
  );

  return NextResponse.json({ results });
}
