import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { generateGrokImagineVideo } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await req.json();
    const { prompt, imageUrls, aspectRatio, resolution, duration, mode, nsfwChecker, callbackUrl, companyId } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Resolve API key to get kieAiId for tracking
    const { kieAiId } = await resolveKieApiKey(companyId);

    console.log('[generate-grok] Request:', {
      prompt: prompt.substring(0, 80),
      imageUrlsCount: imageUrls?.length || 0,
      aspectRatio,
      resolution,
      duration,
      mode,
      nsfwChecker,
      kieAiId,
    });

    const result = await generateGrokImagineVideo({
      prompt,
      imageUrls: imageUrls || [],
      aspectRatio: aspectRatio || '16:9',
      resolution: resolution || '480p',
      duration: duration || 6,
      mode: mode || 'normal',
      nsfwChecker: nsfwChecker ?? true,
      callbackUrl,
      companyId,
    });

    console.log('[generate-grok] Success:', result);

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-grok] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
