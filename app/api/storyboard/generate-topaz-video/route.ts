import { NextRequest, NextResponse } from 'next/server';
import { generateTopazVideoUpscale } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { videoUrl, upscaleFactor, nsfwChecker, callbackUrl, companyId } = body;

    if (!videoUrl) {
      return NextResponse.json({ error: 'videoUrl is required' }, { status: 400 });
    }

    // Resolve API key to get kieAiId for tracking
    const { kieAiId } = await resolveKieApiKey(companyId);

    console.log('[generate-topaz-video] Request:', {
      videoUrl: videoUrl.substring(0, 80),
      upscaleFactor,
      nsfwChecker,
      kieAiId,
    });

    const result = await generateTopazVideoUpscale({
      videoUrl,
      upscaleFactor: upscaleFactor || '2',
      nsfwChecker: nsfwChecker ?? true,
      callbackUrl,
      companyId,
    });

    console.log('[generate-topaz-video] Success:', result);

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-topaz-video] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
