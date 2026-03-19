import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { api } from '@/convex/_generated/api';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { project_id, elements, scenes, status, message } = body;

    // Validate required fields
    if (!project_id) {
      return NextResponse.json(
        { error: 'Missing project_id' },
        { status: 400 }
      );
    }

    // Initialize Convex client
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

    // Update task status if provided
    if (status) {
      await convex.mutation(api.storyboard.build.updateTaskStatus, {
        projectId: project_id,
        taskStatus: status,
        taskMessage: message || undefined
      });
    }

    // Save elements if provided
    if (elements && (elements.characters || elements.environments || elements.props)) {
      await convex.mutation(api.storyboard.build.createElementsBatch, {
        projectId: project_id,
        elements: elements
      });
    }

    // Save scenes if provided
    if (scenes && scenes.length > 0) {
      await convex.mutation(api.storyboard.build.createScenesBatch, {
        projectId: project_id,
        scenes: scenes
      });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Webhook processed successfully' 
    });

  } catch (error) {
    console.error('n8n webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
