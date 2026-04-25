import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convex, api } from '@/lib/convex-server';
import { Id } from '@/convex/_generated/dataModel';

/**
 * POST /api/storyboard/update-file-category
 *
 * Update the categoryId of a file (used to link files to elements after creation)
 *
 * Body: { fileId: string, categoryId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { fileId, categoryId } = await request.json();

    if (!fileId || !categoryId) {
      return NextResponse.json({ error: 'fileId and categoryId are required' }, { status: 400 });
    }

    console.log('[update-file-category] Update request:', { fileId, categoryId, userId });

    // Update the file's categoryId
    await convex.mutation(api.storyboard.storyboardFiles.updateCategory, {
      fileId: fileId as Id<'storyboard_files'>,
      categoryId
    });

    console.log('[update-file-category] Successfully updated file categoryId');

    return NextResponse.json({ 
      success: true,
      fileId,
      categoryId
    });

  } catch (error) {
    console.error('[update-file-category] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update file category' },
      { status: 500 }
    );
  }
}
