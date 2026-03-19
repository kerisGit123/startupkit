import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

// Webhook secret for authentication
const N8N_WEBHOOK_SECRET = process.env.N8N_WEBHOOK_SECRET || 'n8n-webhook-secret-2024';

export async function POST(request: NextRequest) {
  try {
    // 1. Authenticate webhook request
    const authHeader = request.headers.get('authorization');
    const webhookSecret = request.headers.get('x-webhook-secret');
    
    // Allow either Authorization header or webhook secret header
    const providedSecret = authHeader?.replace('Bearer ', '') || webhookSecret;
    
    if (providedSecret !== N8N_WEBHOOK_SECRET) {
      console.error('❌ Webhook authentication failed');
      return NextResponse.json(
        { error: 'Unauthorized: Invalid webhook secret' },
        { status: 401 }
      );
    }

    // 2. Parse request body
    const body = await request.json();
    const { 
      project_id, 
      elements, 
      scenes, 
      status, 
      message,
      scriptType = "ANIMATED_STORIES",
      language = "en",
      buildStrategy = "replace_all"
    } = body;

    console.log('🔍 DEBUG: Webhook received:', { project_id, status, message });

    // 3. Validate required fields
    if (!project_id) {
      return NextResponse.json(
        { error: 'Missing project_id' },
        { status: 400 }
      );
    }

    // 4. Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // 5. Handle different webhook types
    if (status === 'processing' && message) {
      // Status update only (progress tracking)
      console.log('📊 Updating task status:', message);
      await convex.mutation(api.storyboard.projects.updateBuildStatus, {
        id: project_id,
        taskStatus: status,
        taskMessage: message,
        scriptType: scriptType,
        scenes: [], // Empty scenes for progress updates
        isAIGenerated: scriptType === "ANIMATED_STORIES"
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Status updated successfully' 
      });
    }

    if (elements && scenes) {
      // Full n8n callback with elements and scenes
      console.log('🎬 Processing n8n callback with elements and scenes');
      const result = await convex.mutation(api.storyboard.n8nWebhookCallback.n8nWebhookCallback, {
        storyboardId: project_id,
        scriptType,
        language,
        buildStrategy,
        elements,
        scenes
      });
      
      return NextResponse.json(result);
    }

    // 6. Handle simple status updates
    if (status) {
      console.log('📊 Simple status update:', status);
      await convex.mutation(api.storyboard.projects.updateBuildStatus, {
        id: project_id,
        taskStatus: status,
        taskMessage: message || 'Processing...',
        scriptType: scriptType,
        scenes: [], // Empty scenes for status updates
        isAIGenerated: scriptType === "ANIMATED_STORIES"
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'Status updated successfully' 
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error: any) {
    console.error('❌ n8n webhook error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error.message || 'Internal server error' 
      },
      { status: 500 }
    );
  }
}
