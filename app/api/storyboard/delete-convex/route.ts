import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convex, api } from '@/lib/convex-server';
import { Id } from '@/convex/_generated/dataModel';

/**
 * POST /api/storyboard/delete-convex
 *
 * Remove a file's metadata record from storyboard_files in Convex.
 * Called by lib/uploadToR2.ts deleteFromR2() after the R2 object is deleted.
 *
 * Body: { fileId: string }  — the Convex document _id
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      console.error('[delete-convex] Unauthorized - no userId found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId } = await request.json();
    console.log('[delete-convex] Request received:', { userId, fileId });

    if (!fileId) {
      console.error('[delete-convex] Bad request: fileId is missing');
      return NextResponse.json({ error: 'fileId is required' }, { status: 400 });
    }

    // Validate fileId format - accept Convex ID format
    if (typeof fileId !== 'string' || !fileId.match(/^[a-z0-9]{24,}$/)) {
      console.error('[delete-convex] Invalid fileId format:', fileId);
      return NextResponse.json({ error: 'Invalid fileId format' }, { status: 400 });
    }

    console.log('[delete-convex] Attempting to remove storyboard_files record:', fileId);
    
    try {
      await convex.mutation(api.storyboard.storyboardFiles.remove, {
        id: fileId as Id<'storyboard_files'>,
      });

      console.log('[delete-convex] Successfully removed storyboard_files record:', fileId);
      return NextResponse.json({ success: true, fileId });
    } catch (convexError) {
      console.error('[delete-convex] Convex mutation error:', {
        error: convexError,
        fileId,
        userId,
        errorType: convexError.constructor.name,
        errorMessage: convexError instanceof Error ? convexError.message : 'Unknown error'
      });
      
      // Check if it's a "not found" error
      if (convexError instanceof Error && convexError.message.includes('not found')) {
        console.log('[delete-convex] File not found in database - likely already deleted or missing metadata');
        return NextResponse.json({ 
          success: true, 
          fileId,
          warning: 'File not found in database - may have been already deleted'
        });
      }
      
      throw convexError;
    }

  } catch (error) {
    console.error('[delete-convex] Error:', {
      error,
      errorType: error.constructor.name,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to remove metadata' },
      { status: 500 }
    );
  }
}
