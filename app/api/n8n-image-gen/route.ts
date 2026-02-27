import { NextRequest, NextResponse } from 'next/server';

const KIE_API_KEY = process.env.KIE_AI_API_KEY;
const KIE_POLL_URL = "https://api.kie.ai/api/v1/jobs/recordInfo";  // GET ?taskId=...

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Missing taskId" }, { status: 400 });
    }

    if (!KIE_API_KEY) {
      return NextResponse.json({ error: "KIE_AI_API_KEY not configured" }, { status: 500 });
    }

    // Poll KIE API — GET with taskId as query param (same as working inpaint route)
    const pollRes = await fetch(`${KIE_POLL_URL}?taskId=${encodeURIComponent(taskId)}`, {
      method: "GET",
      headers: { "Authorization": `Bearer ${KIE_API_KEY}` },
    });

    if (!pollRes.ok) {
      return NextResponse.json({ error: `Polling failed: ${pollRes.status}` }, { status: pollRes.status });
    }

    const pd = await pollRes.json();
    const flag = pd?.data?.successFlag;
    const state = pd?.data?.state;

    if (flag === 1 || state === "success") {
      // Parse resultJson to extract image URL
      let parsedResult: Record<string, unknown> = {};
      if (typeof pd?.data?.resultJson === "string") {
        try { parsedResult = JSON.parse(pd.data.resultJson); } catch { /* ignore */ }
      }
      const imageUrl =
        (parsedResult?.resultUrls as string[])?.[0] ??
        (parsedResult?.resultImageUrl as string) ??
        pd?.data?.response?.resultImageUrl ??
        pd?.data?.resultImageUrl ??
        pd?.data?.response?.resultUrls?.[0] ??
        pd?.data?.resultUrls?.[0];
      return NextResponse.json({ status: "success", image: imageUrl ?? null });
    }

    if (flag === 2 || flag === 3 || state === "fail") {
      const reason = pd?.data?.failMsg ?? pd?.data?.errorMessage ?? "Generation failed";
      return NextResponse.json({ status: "fail", error: reason });
    }

    // Still running
    return NextResponse.json({ status: "pending" });

  } catch (error) {
    console.error("[API/n8n-image-gen] Error:", error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : "Unknown error" 
    }, { status: 500 });
  }
}
