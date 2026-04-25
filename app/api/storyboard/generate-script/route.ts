import { NextRequest, NextResponse } from "next/server";
import { parseScriptScenes } from "@/lib/storyboard/sceneParser";

export async function POST(req: NextRequest) {
  try {
    const { prompt, genre, targetDuration, style } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    const kieApiKey = process.env.KIE_AI_API_KEY;
    if (!kieApiKey) {
      return NextResponse.json({ error: "Kie AI API key not configured" }, { status: 500 });
    }

    const systemPrompt = `You are a professional TikTok/YouTube short-form scriptwriter for the SEA market.
Write a storyboard script with clear scene breaks for social media content.
Each scene MUST follow this exact format:

SCENE [number]: [Scene Title] - [Location]
[Visual description of what the viewer sees]
[Character actions and dialogue]
Camera: [camera angle/movement]
Lighting: [lighting style]
Action: [key action in this scene]
Characters: [character names]
Location: [specific location]

Rules:
- Write exactly ${targetDuration ? Math.ceil(targetDuration / 5) : 6} scenes
- Each scene = approximately 5 seconds of video
- Target: TikTok/YouTube Shorts (vertical 9:16 format)
- Style: ${style || "cinematic"}
- Genre: ${genre || "drama"}
- Keep language clear and visual-focused
- Include camera directions for AI image generation`;

    const response = await fetch("https://api.kie.ai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${kieApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt },
        ],
        temperature: 0.75,
        max_tokens: 3000,
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      console.error("[generate-script] Kie AI error:", err);
      return NextResponse.json({ error: "Script generation failed" }, { status: 502 });
    }

    const data = await response.json();
    const scriptContent: string = data.choices?.[0]?.message?.content ?? "";

    if (!scriptContent) {
      return NextResponse.json({ error: "Empty response from AI" }, { status: 500 });
    }

    const scenes = parseScriptScenes(scriptContent);

    return NextResponse.json({
      script: scriptContent,
      scenes,
      model: "gpt-4o",
      sceneCount: scenes.scenes.length,
    });
  } catch (err) {
    console.error("[generate-script]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
