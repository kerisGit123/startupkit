import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convex, api } from '@/lib/convex-server';

/**
 * POST /api/storyboard/files-by-category
 *
 * Query files by categoryId (for cleanup operations)
 * Used by ElementLibrary to find files associated with specific elements
 *
 * Body: { companyId: string, categoryId: string | null }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { companyId, categoryId } = await request.json();

    if (!companyId) {
      return NextResponse.json({ error: 'companyId is required' }, { status: 400 });
    }

    console.log('[files-by-category] Query request:', { companyId, categoryId, userId });

    let files;
    if (categoryId === null || categoryId === undefined) {
      // Orphaned files — by_companyId index + server-side filter, no full table scan
      files = await convex.query(api.storyboard.storyboardFiles.listOrphaned, { companyId });
    } else {
      files = await convex.query(api.storyboard.storyboardFiles.listByCategoryId, { categoryId });
    }

    console.log('[files-by-category] Found files:', { 
      count: files.length,
      categoryId 
    });

    return NextResponse.json({ 
      files,
      count: files.length 
    });

  } catch (error) {
    console.error('[files-by-category] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query files' },
      { status: 500 }
    );
  }
}
