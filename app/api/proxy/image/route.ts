import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const imageUrl = searchParams.get('url');

  if (!imageUrl) {
    return NextResponse.json({ error: 'Missing image URL parameter' }, { status: 400 });
  }

  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch image: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const imageBuffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/png';

    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // 24 hours
      },
    });
  } catch (error) {
    console.error('[Proxy Image] Error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
