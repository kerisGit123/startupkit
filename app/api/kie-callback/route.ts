import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Log the callback from KIE AI
    console.log('[KIE Callback] Received:', body);
    
    // Here you can handle the callback if needed
    // For now, just return success
    return NextResponse.json({ success: true });
    
  } catch (error) {
    console.error('KIE Callback error:', error);
    return NextResponse.json(
      { error: 'Callback processing failed' },
      { status: 500 }
    );
  }
}
