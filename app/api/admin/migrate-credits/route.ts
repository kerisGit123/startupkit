import { NextRequest, NextResponse } from 'next/server';
import { ConvexHttpClient } from 'convex/browser';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: NextRequest) {
  try {
    // Require admin authentication
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log('[migrate-credits] Starting credit migration...');
    
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    
    // Import the migration function
    const { api } = await import("../../../../convex/_generated/api");
    
    const result = await convex.mutation(api.storyboard.storyboardFiles.migrateCreditUsage);
    
    return NextResponse.json({ 
      success: true,
      message: `Successfully migrated ${result.migratedFiles} files out of ${result.totalFiles} total generated files`,
      ...result
    });
    
  } catch (error) {
    console.error('[migrate-credits] Migration error:', error);
    return NextResponse.json({ 
      error: 'Migration failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
