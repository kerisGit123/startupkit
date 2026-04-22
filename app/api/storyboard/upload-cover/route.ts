import { NextRequest, NextResponse } from 'next/server';
import { uploadAndCoverAudio } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { uploadUrl, prompt, style, title, instrumental, model, vocalGender, personaId, callbackUrl, companyId, customMode, negativeTags, styleWeight, weirdnessConstraint, audioWeight } = body;

    console.log('[upload-cover] Received:', { uploadUrl: uploadUrl?.substring(0, 50), prompt: prompt?.substring(0, 50), style, instrumental, model, personaId, customMode, negativeTags, styleWeight, weirdnessConstraint, audioWeight });

    if (!uploadUrl || !prompt) {
      return NextResponse.json(
        { error: 'uploadUrl and prompt are required' },
        { status: 400 }
      );
    }

    const { kieAiId } = await resolveKieApiKey(companyId);

    const result = await uploadAndCoverAudio({
      uploadUrl,
      prompt,
      style,
      title,
      instrumental: instrumental ?? true,
      model: model || 'V4',
      vocalGender,
      personaId,
      customMode: customMode ?? true,
      negativeTags,
      styleWeight,
      weirdnessConstraint,
      audioWeight,
      callbackUrl,
      companyId,
    });

    console.log('[upload-cover] Result:', { taskId: result.taskId, responseCode: result.responseCode, audioUrls: result.audioUrls?.length, kieAiId });

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[upload-cover] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
