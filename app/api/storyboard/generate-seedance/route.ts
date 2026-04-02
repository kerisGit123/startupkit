import { NextRequest, NextResponse } from 'next/server';

const KIE_API_KEY = process.env.KIE_AI_API_KEY;
const KIE_CREATE_URL = "https://api.kie.ai/api/v1/jobs/createTask";

export async function POST(req: NextRequest) {
  try {
    console.log('[API/generate-seedance] Seedance 1.5 Pro generation request received');

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not set" }, { status: 500 });
    }

    const body = await req.json();
    console.log('[API/generate-seedance] Request body:', body);

    const { prompt, input_urls, aspect_ratio, resolution, duration, generate_audio, callBackUrl } = body;

    if (!prompt) {
      return NextResponse.json({ error: "Prompt is required" }, { status: 400 });
    }

    // Build Seedance 1.5 Pro API request
    const requestBody = {
      model: "bytedance/seedance-1.5-pro",
      callBackUrl: callBackUrl,
      input: {
        prompt: prompt,
        input_urls: input_urls || [],
        aspect_ratio: aspect_ratio || "1:1",
        resolution: resolution?.toLowerCase() || "720p", // ✅ Convert to lowercase
        duration: duration.replace('s', '') || "8", // ✅ String without 's' suffix
        fixed_lens: false,
        generate_audio: generate_audio || false,
        nsfw_checker: false
      }
    };

    console.log('[API/generate-seedance] Seedance API request:', requestBody);

    const response = await fetch(KIE_CREATE_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${KIE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/generate-seedance] Seedance API error:', response.status, errorText);
      return NextResponse.json({ 
        error: `Seedance API error: ${response.status} ${response.statusText}`,
        details: errorText
      }, { status: response.status });
    }

    const result = await response.json();
    console.log('[API/generate-seedance] Seedance API response:', result);

    return NextResponse.json(result);

  } catch (error) {
    console.error('[API/generate-seedance] Error:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    }, { status: 500 });
  }
}
