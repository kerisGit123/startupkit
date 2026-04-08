import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "URL required" }, { status: 400 });
  }

  try {
    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: "Failed to fetch image" }, { status: 502 });
    }

    const blob = await response.blob();
    const headers = new Headers();
    headers.set("Content-Type", blob.type || "image/png");
    headers.set("Content-Disposition", `attachment; filename="frame-${Date.now()}.png"`);

    return new NextResponse(blob, { headers });
  } catch (error) {
    return NextResponse.json({ error: "Download failed" }, { status: 500 });
  }
}
