import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { convex, api } from '@/lib/convex-server';

/**
 * POST /api/storyboard/files-by-element
 *
 * Query ALL storyboard_files for a company and return them for client-side filtering
 * Used by ElementLibrary for comprehensive file cleanup during element deletion
 *
 * Body: { elementId: string, companyId: string }
 */
export async function POST(request: NextRequest) {
  try {
    // Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { elementId, companyId } = await request.json();

    if (!elementId || !companyId) {
      return NextResponse.json({ error: 'elementId and companyId are required' }, { status: 400 });
    }

    console.log('[files-by-element] Query request:', { elementId, companyId, userId });

    // Query ALL files for this company (not just element files)
    const allFiles = await convex.query(api.storyboard.storyboardFiles.listByCompany, { 
      companyId 
    });

    console.log('[files-by-element] Returning all company files for client-side filtering:', { 
      totalFiles: allFiles.length,
      companyId,
      elementId 
    });

    // Return ALL files so the client can filter them comprehensively
    return NextResponse.json({ 
      files: allFiles,
      count: allFiles.length,
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
