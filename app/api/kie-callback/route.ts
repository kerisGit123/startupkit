import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { uploadToR2, getR2PublicUrl } from "@/lib/r2";

export async function POST(request: NextRequest) {
  console.log('[kie-callback] Route hit!');
  
  try {
    const data = await request.json();
    const url = new URL(request.url);
    const fileId = url.searchParams.get('fileId');
    
    console.log('[kie-callback] Received:', { fileId, data });
    
    if (!fileId) {
      return NextResponse.json({ error: 'Missing fileId' }, { status: 400 });
    }

    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Handle KIE callback payloads with a taskId
    if (data.code === 200 && data.data?.taskId) {
      const taskId = data.data.taskId;
      console.log('[kie-callback] Storing taskId:', taskId);
      
      // Update the file record with taskId
      await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
        fileId,
        taskId: taskId,
        status: 'processing',
      });

      const resultJsonRaw = data.data?.resultJson;
      let resultUrl: string | undefined;

      if (typeof resultJsonRaw === 'string') {
        try {
          const parsedResultJson = JSON.parse(resultJsonRaw);
          if (Array.isArray(parsedResultJson?.resultUrls) && parsedResultJson.resultUrls.length > 0) {
            resultUrl = parsedResultJson.resultUrls[0];
          }
        } catch (parseError) {
          console.warn('[kie-callback] Failed to parse resultJson:', parseError);
        }
      }

      console.log('[kie-callback] Parsed completion payload:', {
        state: data.data?.state,
        resultUrl,
      });

      if (data.data?.state === 'success' && resultUrl) {
        console.log('[kie-callback] Storing completed result URL:', resultUrl);

        const fileRecord = await convex.query(api.storyboard.storyboardFiles.getById, {
          id: fileId,
        });

        const companyId = fileRecord?.companyId ?? fileRecord?.orgId ?? fileRecord?.userId ?? 'unknown';
        const sourceResponse = await fetch(resultUrl);

        if (!sourceResponse.ok) {
          throw new Error(`Failed to fetch generated image: ${sourceResponse.status} ${sourceResponse.statusText}`);
        }

        const sourceBlob = await sourceResponse.blob();
        const mimeType = sourceBlob.type || 'image/png';
        const extension = mimeType.includes('webp') ? 'webp' : mimeType.includes('jpeg') ? 'jpg' : 'png';
        const r2Key = `${companyId}/generated/${taskId}.${extension}`;

        await uploadToR2(sourceBlob, r2Key);
        const permanentUrl = getR2PublicUrl(r2Key);

        await convex.mutation(api.storyboard.storyboardFiles.updateFromCallback, {
          fileId,
          taskId: taskId,
          sourceUrl: permanentUrl,
          r2Key,
          status: 'completed',
        });

        console.log('[kie-callback] Convex updateFromCallback saved completed state:', {
          fileId,
          taskId,
          sourceUrl: permanentUrl,
          r2Key,
          status: 'completed',
        });

        return NextResponse.json({
          success: true,
          message: 'Task completed and file stored to R2 successfully',
          fileId,
          taskId,
          sourceUrl: permanentUrl,
          r2Key,
        });
      }
      
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
    console.error('[kie-callback] Error:', error);
    return NextResponse.json({ 
      error: 'Processing failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
