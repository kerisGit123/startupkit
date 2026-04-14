import { NextRequest, NextResponse } from 'next/server';
import { generateSeedance2 } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      prompt, model, mode, referenceImages, videoUrls, audioUrls,
      firstFrameUrl, lastFrameUrl, resolution, aspectRatio, duration,
      generateAudio, webSearch, callbackUrl, companyId,
    } = body;

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    const { kieAiId } = await resolveKieApiKey(companyId);

    console.log('[generate-seedance2] Request:', {
      prompt: prompt.substring(0, 80),
      model,
      mode,
      resolution,
      aspectRatio,
      duration,
      refImages: referenceImages?.length || 0,
      refVideos: videoUrls?.length || 0,
      refAudio: audioUrls?.length || 0,
      hasFirstFrame: !!firstFrameUrl,
      hasLastFrame: !!lastFrameUrl,
      kieAiId,
    });

    const result = await generateSeedance2({
      prompt,
      model: model || 'bytedance/seedance-2',
      mode: mode || 'text-to-video',
      referenceImages: referenceImages || [],
      videoUrls: videoUrls || [],
      audioUrls: audioUrls || [],
      firstFrameUrl,
      lastFrameUrl,
      resolution: resolution || '480p',
      aspectRatio: aspectRatio || '16:9',
      duration: duration || 5,
      generateAudio: generateAudio ?? false,
      webSearch: webSearch ?? false,
      callbackUrl,
      companyId,
    });

    console.log('[generate-seedance2] Success:', {
      taskId: result.taskId,
      responseCode: result.responseCode,
    });

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-seedance2] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
