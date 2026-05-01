import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

export async function POST(request: NextRequest) {
  console.log('[storyboard-kie-callback] Route hit!');

  // ── Webhook secret guard (Option C) ──────────────────────────────────────
  const expectedSecret = process.env.WEBHOOK_SECRET;
  if (expectedSecret) {
    const incomingSecret =
      request.headers.get('x-webhook-secret') ||
      new URL(request.url).searchParams.get('secret');
    if (incomingSecret !== expectedSecret) {
      console.warn('[storyboard-kie-callback] Rejected — invalid or missing webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  try {
    const data = await request.json();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    
    console.log('[storyboard-kie-callback] Received:', { fileId, data });
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }
    
    // Handle task creation confirmation
    if (data.code === 200 && data.msg === 'success' && data.data?.taskId) {
      const taskId = data.data.taskId;
      console.log('[storyboard-kie-callback] Storing taskId:', taskId);
      
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      
      // Update the file record with taskId
      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId: fileId as Id<"storyboard_files">,
        taskId: taskId,
        status: 'processing',
      });
      
      return NextResponse.json({ 
        success: true, 
        message: 'TaskId stored successfully',
        fileId,
        taskId: taskId
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Callback processed',
      fileId,
      data
    });
    
  } catch (error) {
    console.error('[storyboard-kie-callback] Error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
