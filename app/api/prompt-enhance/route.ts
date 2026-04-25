import { NextRequest, NextResponse } from "next/server";
import { getAnthropicClient, SUPPORT_MODEL } from "@/lib/support/anthropic";

const SYSTEM_PROMPT = `You are a cinematic prompt enhancer for AI image and video generation. Your ONLY job is to take a short user prompt and expand it into a detailed, cinematic generation prompt.

Rules:
- Output ONLY the enhanced prompt text. No explanations, no labels, no quotes.
- Keep the original subject/scene intent — don't change what the user wants.
- Add: lighting, atmosphere, camera details, composition, mood, color grading, film look.
- Use natural language that AI image/video models understand well.
- Keep it under 120 words. Dense, not verbose.
- Never refuse. Always enhance, even if the input is just one word.`;

// In-memory cooldown: userId → last request timestamp
const cooldowns = new Map<string, number>();
const COOLDOWN_MS = 3000; // 3 seconds between requests

export async function POST(req: NextRequest) {
  try {
    const { prompt, userId, mode } = await req.json();

    if (!prompt?.trim()) {
      return NextResponse.json({ error: "No prompt provided" }, { status: 400 });
    }

    if (!userId) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Cooldown check
    const lastRequest = cooldowns.get(userId) || 0;
    if (Date.now() - lastRequest < COOLDOWN_MS) {
      return NextResponse.json({ error: "Please wait a few seconds before enhancing again" }, { status: 429 });
    }
    cooldowns.set(userId, Date.now());

    const client = getAnthropicClient();

    const modeHint = mode === "video"
      ? " Focus on motion, camera movement, pacing, and cinematic action."
      : " Focus on composition, lighting, framing, and visual atmosphere.";

    const response = await client.messages.create({
      model: SUPPORT_MODEL,
      max_tokens: 300,
      system: SYSTEM_PROMPT + modeHint,
      messages: [
        { role: "user", content: prompt.trim() },
      ],
    });

    const enhanced = response.content
      .filter((block): block is { type: "text"; text: string } => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return NextResponse.json({ enhanced });
  } catch (error) {
    console.error("[PromptEnhance] Error:", error);
    return NextResponse.json({ error: "Enhancement failed" }, { status: 500 });
  }
}
