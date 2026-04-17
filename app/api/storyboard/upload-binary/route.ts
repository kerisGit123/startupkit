import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadToR2 } from '@/lib/r2';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";

// Binary upload route — bypasses FormData parsing for large files.
// Client sends raw file bytes with metadata in headers.
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    const { userId, orgId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const companyId = orgId || request.headers.get('x-company-id') || userId;
    const filename = decodeURIComponent(request.headers.get('x-filename') || `upload-${Date.now()}`);
    const contentType = request.headers.get('content-type') || 'application/octet-stream';
    const category = request.headers.get('x-category') || 'uploads';
    const projectId = request.headers.get('x-project-id') || undefined;
    const skipLog = request.headers.get('x-skip-log') === 'true';
    const customR2Key = request.headers.get('x-r2-key');

    const ext = filename.split('.').pop() || 'bin';
    const r2Key = customR2Key || `${companyId}/${category}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    // Read the raw body as a buffer
    const arrayBuffer = await request.arrayBuffer();
    const blob = new Blob([arrayBuffer], { type: contentType });
    const file = new File([blob], filename, { type: contentType });

    console.log('[upload-binary] Uploading:', { filename, size: file.size, contentType, r2Key });

    const uploadedKey = await uploadToR2(file, r2Key);

    const publicUrl = process.env.R2_PUBLIC_URL
      ? `${process.env.R2_PUBLIC_URL}/${uploadedKey}`
      : uploadedKey;

    // Determine file type
    const fileType = contentType.startsWith('audio/') ? 'audio'
      : contentType.startsWith('image/') ? 'image'
      : contentType.startsWith('video/') ? 'video'
      : 'file';

    // Log upload to storyboard_files database (unless skipLog is set)
    let fileId: any;
    if (!skipLog) {
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      const logArgs: any = {
        companyId,
        userId,
        r2Key: uploadedKey,
        filename,
        fileType,
        mimeType: contentType,
        size: arrayBuffer.byteLength,
        category,
        tags: [],
        uploadedBy: userId,
        status: 'ready',
      };
      if (projectId && projectId.length > 10) {
        logArgs.projectId = projectId;
      }

      try {
        fileId = await convex.mutation(api.storyboard.storyboardFiles.logUpload, logArgs);
        console.log('[upload-binary] File logged to database:', { fileId, r2Key: uploadedKey });
      } catch (dbError) {
        console.error('[upload-binary] Failed to log to database (file still uploaded to R2):', dbError);
      }
    } else {
      console.log('[upload-binary] Skipping database log (x-skip-log: true)');
    }

    return NextResponse.json({
      success: true,
      r2Key: uploadedKey,
      publicUrl,
      fileName: filename,
      fileSize: arrayBuffer.byteLength,
      fileId,
    });
  } catch (error) {
    console.error('[upload-binary] Error:', error);
    return NextResponse.json(
      { success: false, error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
