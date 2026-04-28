import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { generateKlingMotionControl } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await req.json();
    const { prompt, inputImageUrl, videoUrl, mode, characterOrientation, backgroundSource, callbackUrl, companyId } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Resolve API key to get kieAiId for tracking
    const { kieAiId } = await resolveKieApiKey(companyId);

    console.log('[generate-kling-motion] Request:', {
      prompt: prompt.substring(0, 80),
      inputImageUrl: inputImageUrl?.substring(0, 60),
      videoUrl: videoUrl?.substring(0, 60),
      mode,
      characterOrientation,
      backgroundSource,
      kieAiId,
    });

    const result = await generateKlingMotionControl({
      prompt,
      inputImageUrl,
      videoUrl,
      mode: mode || '720p',
      characterOrientation: characterOrientation || 'image',
      backgroundSource: backgroundSource || 'input_video',
      callbackUrl,
      companyId,
    });

    console.log('[generate-kling-motion] Success:', result);

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-kling-motion] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
