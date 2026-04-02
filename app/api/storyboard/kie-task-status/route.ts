import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('[API/kie-task-status] Task status request received');
    
    const body = await request.json();
    const { taskId, model } = body;
    
    if (!taskId) {
      return NextResponse.json(
        { error: 'Missing taskId' },
        { status: 400 }
      );
    }

    // Get API key from environment variables
    const apiKey = process.env.KIE_AI_API_KEY;
    if (!apiKey) {
      console.error('[API/kie-task-status] KIE_AI_API_KEY not found in environment variables');
      return NextResponse.json(
        { error: 'API key not configured' },
        { status: 500 }
      );
    }

    let apiUrl = '';
    let requestBody = {};

    // Different models might use different endpoints
    if (model?.includes('veo')) {
      // Veo 3.1 API endpoint
      apiUrl = 'https://api.kie.ai/api/v1/veo/status';
      requestBody = {
        taskId: taskId
      };
    } else {
      // Seedance 1.5 Pro API endpoint
      apiUrl = 'https://api.kie.ai/api/v1/jobs/status';
      requestBody = {
        taskId: taskId
      };
    }

    console.log('[API/kie-task-status] Querying task status:', { taskId, model, apiUrl });

    // Call KIE AI API to get task status
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[API/kie-task-status] KIE AI API response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API/kie-task-status] KIE AI API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText
      });
      
      return NextResponse.json(
        { 
          error: 'KIE AI API request failed',
          details: errorText,
          status: response.status 
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[API/kie-task-status] KIE AI API response:', data);

    // Extract video URL from the response
    let videoUrl = null;
    
    // Check various possible locations for the video URL
    if (Array.isArray(data) && data.length > 0) {
      // Veo 3.1 pattern: top-level array
      for (const item of data) {
        if (typeof item === 'string' && item.includes('.mp4')) {
          videoUrl = item;
          break;
        }
        if (typeof item === 'object' && item !== null) {
          const possibleUrl = item.url || item.videoUrl || item.sourceUrl || item.resultUrl;
          if (possibleUrl && typeof possibleUrl === 'string' && possibleUrl.includes('.mp4')) {
            videoUrl = possibleUrl;
            break;
          }
        }
      }
    } else if (data?.data?.resultUrls && Array.isArray(data.data.resultUrls)) {
      // Seedance 1.5 Pro pattern: data.data.resultUrls array
      videoUrl = data.data.resultUrls[0];
    } else if (data?.data?.resultUrl) {
      // Direct resultUrl
      videoUrl = data.data.resultUrl;
    } else if (data?.data?.videoUrl) {
      // Direct videoUrl
      videoUrl = data.data.videoUrl;
    } else if (data?.data?.sourceUrl) {
      // Direct sourceUrl
      videoUrl = data.data.sourceUrl;
    }

    console.log('[API/kie-task-status] Extracted video URL:', videoUrl ? videoUrl.substring(0, 80) + '...' : 'Not found');

    return NextResponse.json({
      success: true,
      taskId,
      status: data?.data?.state || data?.state || 'unknown',
      videoUrl,
      fullResponse: data
    });

  } catch (error) {
    console.error('[API/kie-task-status] Unexpected error:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
