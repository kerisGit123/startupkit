import { NextRequest, NextResponse } from "next/server";

export const maxDuration = 300;

const KIE_API_KEY = process.env.KIE_AI_API_KEY;

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

export async function POST(req: NextRequest) {
  try {
    console.log('[API/character-edit] Received request');
    
    const formData = await req.formData();
    const image = formData.get('image') as string;
    const mask = formData.get('mask') as string;
    const prompt = formData.get('prompt') as string;
    const model = formData.get('model') as string;

    console.log('[API/character-edit] Request data:', {
      hasImage: !!image,
      hasMask: !!mask,
      hasPrompt: !!prompt,
      model,
      promptLength: prompt?.length || 0
    });

    if (!image || !prompt) {
      return NextResponse.json({ error: "Missing image or prompt" }, { status: 400 });
    }

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not set" }, { status: 500 });
    }

    // Determine the correct URL based on model
    let characterEditUrl: string;
    if (model === "character-remix") {
      characterEditUrl = "https://kie.ai/ideogram/character?model=ideogram%2Fcharacter-remix";
    } else {
      characterEditUrl = "https://kie.ai/ideogram/character?model=ideogram%2Fcharacter-edit";
    }

    console.log(`[API/character-edit] Sending to: ${characterEditUrl}`);

    // Create FormData for the KIE AI API
    const kieFormData = new FormData();
    kieFormData.append("image", image);
    if (mask) {
      kieFormData.append("mask", mask);
    }
    kieFormData.append("prompt", prompt);

    const response = await fetch(characterEditUrl, {
      method: "POST",
      body: kieFormData,
      headers: {
        "Authorization": `Bearer ${KIE_API_KEY}`,
      },
    });

    console.log('[API/character-edit] KIE AI response status:', response.status);
    console.log('[API/character-edit] KIE AI response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/character-edit] KIE AI API error:', response.status, errorText);
      
      // Try to parse error as JSON
      let errorResponse;
      try {
        const errorJson = JSON.parse(errorText);
        errorResponse = { error: errorJson.error || errorJson.message || errorText };
      } catch (e) {
        errorResponse = { error: errorText };
      }
      
      return NextResponse.json(errorResponse, { status: response.status });
    }

    const responseText = await response.text();
    console.log('[API/character-edit] KIE AI response type:', response.headers.get('content-type'));
    console.log('[API/character-edit] KIE AI response preview:', responseText.substring(0, 500));

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      console.error('[API/character-edit] Failed to parse JSON response:', parseError);
      console.error('[API/character-edit] Response text:', responseText);
      
      // If it's HTML, return a more helpful error
      if (responseText.includes('<!DOCTYPE') || responseText.includes('<html>')) {
        return NextResponse.json({ 
          error: "KIE AI returned HTML instead of JSON. This might indicate an API error or maintenance." 
        }, { status: 500 });
      }
      
      return NextResponse.json({ 
        error: `Invalid response format from KIE AI: ${responseText.substring(0, 200)}...` 
      }, { status: 500 });
    }

    console.log('[API/character-edit] Successfully parsed KIE AI response');
    return NextResponse.json(result);

  } catch (error) {
    console.error('[API/character-edit] Error:', error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
