import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API/generate-veo] Veo 3.1 generation request received');
    
    const body = await request.json();
    console.log('[API/generate-veo] Request body:', body);

    const {
      prompt,
      imageUrls,
      model,
      callBackUrl,
      aspect_ratio,
      seeds,
      enableFallback,
      enableTranslation,
      generationType,
      watermark
    } = body;

    // Validate required fields
    if (!prompt || !model || !callBackUrl || !aspect_ratio || !generationType) {
      console.error('[API/generate-veo] Missing required fields:', { prompt, model, callBackUrl, aspect_ratio, generationType });
      return NextResponse.json(
        { error: 'Missing required fields: prompt, model, callBackUrl, aspect_ratio, generationType' },
        { status: 400 }
      );
    }

    // Validate imageUrls based on generationType
    if (generationType === 'TEXT_2_VIDEO' && imageUrls && imageUrls.length > 0) {
      console.error('[API/generate-veo] TEXT_2_VIDEO should not include images');
      return NextResponse.json(
        { error: 'TEXT_2_VIDEO mode does not accept images' },
        { status: 400 }
      );
    }

    if (generationType === 'FIRST_AND_LAST_FRAMES_2_VIDEO' && (!imageUrls || imageUrls.length !== 2)) {
      console.error('[API/generate-veo] FIRST_AND_LAST_FRAMES_2_VIDEO requires exactly 2 images');
      return NextResponse.json(
        { error: 'FIRST_AND_LAST_FRAMES_2_VIDEO mode requires exactly 2 images' },
        { status: 400 }
      );
    }

    if (generationType === 'REFERENCE_2_VIDEO' && (!imageUrls || imageUrls.length !== 3)) {
      console.error('[API/generate-veo] REFERENCE_2_VIDEO requires exactly 3 images');
      return NextResponse.json(
        { error: 'REFERENCE_2_VIDEO mode requires exactly 3 images' },
        { status: 400 }
      );
    }

    // Validate aspect ratio for REFERENCE_2_VIDEO
    if (generationType === 'REFERENCE_2_VIDEO' && !['9:16', '16:9'].includes(aspect_ratio)) {
      console.error('[API/generate-veo] REFERENCE_2_VIDEO only supports 9:16 and 16:9 aspect ratios');
      return NextResponse.json(
        { error: 'REFERENCE_2_VIDEO mode only supports 9:16 and 16:9 aspect ratios' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.KIE_AI_API_KEY;
    if (!apiKey) {
      console.error('[API/generate-veo] KIE_AI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    // Prepare request payload for Veo 3.1 API
    const veoPayload: any = {
      prompt,
      model,
      callBackUrl,
      aspect_ratio,
      generationType,
      enableFallback: enableFallback ?? false,
      enableTranslation: enableTranslation ?? true,
    };

    // Add optional fields
    if (seeds) veoPayload.seeds = seeds;
    if (watermark) veoPayload.watermark = watermark;
    
    // Add imageUrls only if they exist and the mode supports them
    if (imageUrls && imageUrls.length > 0 && generationType !== 'TEXT_2_VIDEO') {
      veoPayload.imageUrls = imageUrls;
    }

    console.log('[API/generate-veo] Sending to Veo 3.1 API:', veoPayload);

    // Call Veo 3.1 API
    const response = await fetch('https://api.kie.ai/api/v1/veo/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(veoPayload),
    });

    console.log('[API/generate-veo] Veo 3.1 API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/generate-veo] Veo 3.1 API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      return NextResponse.json(
        { 
          error: 'Veo 3.1 API request failed',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API/generate-veo] Veo 3.1 API response:', data);

    return NextResponse.json(data);

  } catch (error) {
    console.error('[API/generate-veo] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
