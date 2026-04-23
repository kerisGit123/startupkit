import { NextRequest, NextResponse } from 'next/server';
import { generateElevenLabsTTS } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      text, voice, stability, similarityBoost, style, speed,
      timestamps, previousText, nextText, languageCode,
      callbackUrl, companyId,
    } = body;

    console.log('[generate-tts] Received body:', { text: text?.substring(0, 50), voice, stability, speed, callbackUrl: callbackUrl?.substring(0, 50) });

    if (!text) {
      return NextResponse.json({ error: 'text is required' }, { status: 400 });
    }

    // Resolve API key to get kieAiId for tracking
    const { kieAiId } = await resolveKieApiKey(companyId);

    const result = await generateElevenLabsTTS({
      text,
      voice,
      stability,
      similarityBoost,
      style,
      speed,
      timestamps,
      previousText,
      nextText,
      languageCode,
      callbackUrl,
      companyId,
    });

    console.log('[generate-tts] Result:', { taskId: result.taskId, responseCode: result.responseCode, kieAiId });

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-tts] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
