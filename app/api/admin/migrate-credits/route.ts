import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication AND super_admin role
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const user = await currentUser();
    if (user?.publicMetadata?.role !== "super_admin") {
      return NextResponse.json({ error: "Forbidden — super_admin role required" }, { status: 403 });
    }

    console.log('[migrate-credits] Starting credit migration...');
    
    // migrateCreditUsage was a one-time migration that has already been run
    // and was removed from storyboardFiles.ts. This endpoint is now a no-op.
    return NextResponse.json({
      success: true,
      message: 'Migration already completed. The migrateCreditUsage function has been retired.',
    });
    
  } catch (error) {
    console.error('[migrate-credits] Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
