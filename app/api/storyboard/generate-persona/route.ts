import { NextRequest, NextResponse } from 'next/server';
import { generatePersona } from '@/lib/storyboard/videoAI';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId, audioId, name, description, vocalStart, vocalEnd, style, companyId } = body;

    console.log('[generate-persona] Received:', { taskId, audioId, name, description, style });

    if (!taskId || !audioId || !name || !description) {
      return NextResponse.json(
        { error: 'taskId, audioId, name, and description are required' },
        { status: 400 }
      );
    }

    const result = await generatePersona({
      taskId,
      audioId,
      name,
      description,
      vocalStart,
      vocalEnd,
      style,
      companyId,
    });

    console.log('[generate-persona] Result:', { personaId: result.personaId, responseCode: result.responseCode });

    return NextResponse.json(result);
  } catch (error) {
    console.error('[generate-persona] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
