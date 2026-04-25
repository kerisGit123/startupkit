import { NextRequest, NextResponse } from "next/server";

/** Proxy external images to bypass CORS for canvas pixel reading */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url");
  if (!url) {
    return NextResponse.json({ error: "Missing url param" }, { status: 400 });
  }

  // Only allow image URLs from known domains
  const allowed = ["r2.dev", "r2.cloudflarestorage.com", "cloudflare.com", "pub-"];
  const isAllowed = allowed.some((d) => url.includes(d));
  if (!isAllowed && !url.startsWith("/")) {
    return NextResponse.json({ error: "Domain not allowed" }, { status: 403 });
  }

  try {
    const res = await fetch(url);
    if (!res.ok) {
      return NextResponse.json({ error: "Fetch failed" }, { status: res.status });
    }

    const contentType = res.headers.get("content-type") || "image/png";
    const buffer = await res.arrayBuffer();

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.json({ error: "Proxy failed" }, { status: 500 });
  }
}
