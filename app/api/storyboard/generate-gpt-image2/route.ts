import { NextRequest, NextResponse } from 'next/server';
import { auth } from "@clerk/nextjs/server";
import { generateGptImage2 } from '@/lib/storyboard/videoAI';
import { resolveKieApiKey } from '@/lib/storyboard/kieAI';

export async function POST(req: NextRequest) {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) return NextResponse.json({ error: "Authentication required" }, { status: 401 });
  try {
    const body = await req.json();
    const { prompt, inputUrls, aspectRatio, nsfwChecker, callbackUrl, companyId } = body;

    console.log('[generate-gpt-image2] Received body:', { prompt: prompt?.substring(0, 50), inputUrls: inputUrls?.length, aspectRatio, callbackUrl: callbackUrl?.substring(0, 50) });

    if (!prompt) {
      return NextResponse.json({ error: 'prompt is required' }, { status: 400 });
    }
    if (!inputUrls || inputUrls.length === 0) {
      return NextResponse.json({ error: 'at least one input image URL is required' }, { status: 400 });
    }

    const { kieAiId } = await resolveKieApiKey(companyId);

    const result = await generateGptImage2({
      prompt,
      inputUrls,
      aspectRatio,
      nsfwChecker,
      callbackUrl,
      companyId,
    });

    console.log('[generate-gpt-image2] Result:', { taskId: result.taskId, responseCode: result.responseCode, kieAiId });

    return NextResponse.json({ ...result, kieAiId });
  } catch (error) {
    console.error('[generate-gpt-image2] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
