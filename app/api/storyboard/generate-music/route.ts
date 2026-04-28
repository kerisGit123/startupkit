import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { generateMusic } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await req.json();
    const { prompt, style, title, instrumental, model, negativeTags, vocalGender, personaId, callbackUrl, companyId } = body;

    console.log('[generate-music] Received body:', { prompt: prompt?.substring(0, 50), style, instrumental, model, vocalGender, personaId, callbackUrl: callbackUrl?.substring(0, 50) });

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }

    // Resolve API key to get kieAiId for tracking
    const { kieAiId } = await resolveKieApiKey(companyId);

    const result = await generateMusic({
      prompt,
      style,
      title,
      instrumental: instrumental ?? true,
      model: model || 'V4',
      negativeTags,
      vocalGender,
      personaId,
      callbackUrl,
      companyId,
    });

    console.log('[generate-music] Result:', { taskId: result.taskId, responseCode: result.responseCode, kieAiId });

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-music] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
