import { NextRequest, NextResponse } from 'next/server';

/**
 * Proxy external images to avoid CORS tainted canvas issues.
 * Fetches the image server-side and returns it with proper headers.
 */
export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url');

  if (!url) {
    return NextResponse.json({ error: 'Missing url parameter' }, { status: 400 });
  }

  // Only allow proxying from our R2 bucket
  const allowedDomains = [
    'pub-253ddb7b6dfa40a8a026dc16b8546f84.r2.dev',
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL?.replace('https://', '').replace('http://', ''),
  ].filter(Boolean);

  try {
    const parsedUrl = new URL(url);
    const isAllowed = allowedDomains.some(domain => domain && parsedUrl.hostname.includes(domain));

    if (!isAllowed) {
      return NextResponse.json({ error: 'Domain not allowed' }, { status: 403 });
    }

    const response = await fetch(url);
    if (!response.ok) {
      return NextResponse.json({ error: `Failed to fetch: ${response.status}` }, { status: response.status });
    }

    const blob = await response.blob();
    const buffer = Buffer.from(await blob.arrayBuffer());

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': blob.type || 'image/png',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Proxy failed' },
      { status: 500 }
    );
  }
}
