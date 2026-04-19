import { NextRequest, NextResponse } from "next/server";

export const POST = async (request: NextRequest) => {
  try {
    const body = await request.json();

    // Extract task result from callback
    const { taskId, status, result, error } = body;

    if (status === "completed" && result) {
      // Here you would typically:
      // 1. Store the result in your database
      // 2. Notify the client via WebSocket or polling
      // 3. Update the task status
      
      // For now, just log the result
      return NextResponse.json({ success: true, message: "Callback received" });
    } else if (status === "failed" || error) {
      console.error("[Flux Flex Callback] Task failed:", taskId, error);
      return NextResponse.json({ success: false, error: "Task failed" });
    }

    return NextResponse.json({ success: true, message: "Callback received" });
  } catch (error) {
    console.error("[Flux Flex Callback] Error:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
};
