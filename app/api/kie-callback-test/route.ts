import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  console.log('[kie-callback-test] Route hit!');
  return NextResponse.json({ 
    message: 'Test route working',
    timestamp: new Date().toISOString()
  });
}

export async function GET(request: NextRequest) {
  console.log('[kie-callback-test] GET Route hit!');
  return NextResponse.json({ 
    message: 'GET route working',
    timestamp: new Date().toISOString()
  });
}
