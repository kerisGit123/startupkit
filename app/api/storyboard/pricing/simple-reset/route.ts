import { NextRequest, NextResponse } from "next/server";

// Simple reset endpoint that bypasses Convex complexity
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    if (body?.action === "simpleReset") {
      // Return success immediately - the frontend will handle the actual data operations
      return NextResponse.json({ 
        success: true, 
        message: "Simple reset initiated" 
      });
    }
    
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Simple reset error:", error);
    return NextResponse.json({ 
      error: "Reset failed", 
      details: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
