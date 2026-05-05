import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convex, api } from '@/lib/convex-server';

/**
 * POST /api/storyboard/files-by-element
 *
 * Query storyboard_files tagged to a specific element (categoryId = elementId).
 * Used by ElementLibrary for file cleanup during element deletion.
 *
 * Body: { elementId: string, companyId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { elementId, companyId } = await request.json();

    if (!elementId || !companyId) {
      return NextResponse.json({ error: 'elementId and companyId are required' }, { status: 400 });
    }

    // Targeted lookup — by_categoryId index, reads only files for this element
    const files = await convex.query(api.storyboard.storyboardFiles.listByCategoryId, {
      categoryId: elementId,
    });

    return NextResponse.json({
      files,
      count: files.length,
      companyId,
      elementId
    });

  } catch (error) {
    console.error('[files-by-element] Error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to query files' },
      { status: 500 }
    );
  }
}
