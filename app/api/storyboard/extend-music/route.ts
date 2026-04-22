import { NextRequest, NextResponse } from 'next/server';
import { extendMusic } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audioId, prompt, style, title, model, continueAt, vocalGender, personaId, callbackUrl, companyId, defaultParamFlag } = body;

    console.log('[extend-music] Received:', { audioId, prompt: prompt?.substring(0, 50), style, model, continueAt, personaId, defaultParamFlag });

    if (!audioId) {
      return NextResponse.json(
        { error: 'audioId is required' },
        { status: 400 }
      );
    }

    const { kieAiId } = await resolveKieApiKey(companyId);

    const result = await extendMusic({
      audioId,
      prompt,
      style,
      title,
      model: model || 'V4',
      continueAt,
      vocalGender,
      personaId,
      defaultParamFlag: defaultParamFlag ?? true,
      callbackUrl,
      companyId,
    });

    console.log('[extend-music] Result:', { taskId: result.taskId, responseCode: result.responseCode, kieAiId });

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[extend-music] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
