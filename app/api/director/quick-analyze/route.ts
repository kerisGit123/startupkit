import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { getAnthropicClient } from "@/lib/support/anthropic";
import sharp from "sharp";

export const maxDuration = 30;

export async function POST(req: NextRequest) {
  const authResult = await auth();
  if (!authResult.userId) {
    return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  }

  const { imageUrl, frameNumber } = await req.json() as { imageUrl: string; frameNumber?: number };
  if (!imageUrl) {
    return NextResponse.json({ error: "imageUrl required" }, { status: 400 });
  }

  const imgRes = await fetch(imageUrl, { signal: AbortSignal.timeout(10000) });
  if (!imgRes.ok) {
    return NextResponse.json({ error: "Could not fetch image" }, { status: 400 });
  }

  let buffer = Buffer.from(await imgRes.arrayBuffer());
  let mediaType: "image/jpeg" | "image/png" | "image/gif" | "image/webp" = "image/jpeg";

  const MAX_BYTES = 4.5 * 1024 * 1024;
  if (buffer.byteLength > MAX_BYTES) {
    const metadata = await sharp(buffer).metadata();
    const scale = Math.sqrt(MAX_BYTES / buffer.byteLength);
    buffer = await sharp(buffer)
      .resize({ width: Math.round((metadata.width || 1920) * scale), withoutEnlargement: true })
      .jpeg({ quality: 80 })
      .toBuffer();
    mediaType = "image/jpeg";
  } else {
    const ct = imgRes.headers.get("content-type") || "image/jpeg";
    mediaType = (ct.startsWith("image/") ? ct : "image/jpeg") as typeof mediaType;
  }

  const anthropic = getAnthropicClient();
  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: mediaType, data: buffer.toString("base64") },
          },
          {
            type: "text",
            text: frameNumber
              ? `You are an AI Director reviewing a storyboard frame. Analyze frame ${frameNumber}.\n\nCover:\n- Composition & framing\n- Lighting & mood\n- What works well\n- What could be improved\n\nBe concise — 4–6 bullet points max.`
              : `Analyze this image as a storyboard frame. Cover composition, lighting, mood, strengths, and improvements. 4–6 bullet points max.`,
          },
        ],
      },
    ],
  });

  const analysis = response.content
    .filter((b) => b.type === "text")
    .map((b: any) => b.text)
    .join("");

  return NextResponse.json({ analysis });
}
