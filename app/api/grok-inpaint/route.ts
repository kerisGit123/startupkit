import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const { image, mask, prompt, model } = await request.json();

    if (!image || !mask || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: image, mask, prompt' },
        { status: 400 }
      );
    }

    console.log('KIE API request:', { prompt, model });

    // Call KIE API for image generation with mask
    const kieResponse = await fetch('https://api.kie.ai/v1/generate', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.KIE_AI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model || 'kie-vision',
        prompt: prompt,
        image: image,
        mask: mask,
        mask_mode: 'inpaint', // Specify inpaint mode
        strength: 0.8, // How much to change the masked area
        num_outputs: 1
      })
    });

    if (!kieResponse.ok) {
      const errorData = await kieResponse.json().catch(() => ({}));
      throw new Error(errorData.error || `KIE API error: ${kieResponse.status}`);
    }

    const result = await kieResponse.json();
    console.log('KIE API result:', result);

    // Extract generated image from KIE response
    const generatedImage = result.images?.[0]?.url || result.image || result.output;

    if (!generatedImage) {
      throw new Error('No image returned from KIE API');
    }

    return NextResponse.json({
      success: true,
      image: generatedImage,
      message: 'Image generated successfully'
    });

  } catch (error) {
    console.error('KIE API error:', error);
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process KIE API request',
        success: false 
      },
      { status: 500 }
    );
  }
}
