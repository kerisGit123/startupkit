import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Convert file to buffer
    const buffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(buffer);
    const base64 = Buffer.from(uint8Array).toString('base64');

    // Try multiple upload services in order of preference
    
    // 1. Try litterbox.catbox.moe (temporary hosting, very reliable)
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('reqtype', 'fileupload');
      uploadFormData.append('time', '72h');
      uploadFormData.append('fileToUpload', new Blob([uint8Array]), file.name);

      const uploadResponse = await fetch('https://litterbox.catbox.moe/resources/internals/api.php', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.text();
        if (result && result.startsWith('https://')) {
          console.log('[Upload] litterbox success:', result.trim());
          return NextResponse.json({ url: result.trim() });
        }
      } else {
        console.log('[Upload] litterbox failed:', uploadResponse.status);
      }
    } catch (e) {
      console.log('[Upload] litterbox error:', e);
    }

    // 2. Try file.io (simple, reliable)
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([uint8Array]), file.name);

      const uploadResponse = await fetch('https://file.io', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        if (result && result.success && result.link) {
          console.log('[Upload] file.io success:', result.link);
          return NextResponse.json({ url: result.link });
        }
      } else {
        console.log('[Upload] file.io failed:', uploadResponse.status);
      }
    } catch (e) {
      console.log('[Upload] file.io error:', e);
    }

    // 3. Try tmpfiles.org
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', new Blob([uint8Array]), file.name);

      const uploadResponse = await fetch('https://tmpfiles.org/api/v1/upload', {
        method: 'POST',
        body: uploadFormData,
      });

      if (uploadResponse.ok) {
        const result = await uploadResponse.json();
        if (result && result.data && result.data.url) {
          console.log('[Upload] tmpfiles success:', result.data.url);
          return NextResponse.json({ url: result.data.url });
        }
      } else {
        console.log('[Upload] tmpfiles failed:', uploadResponse.status);
      }
    } catch (e) {
      console.log('[Upload] tmpfiles error:', e);
    }

    // 4. Fallback: Return base64 data URL (for testing only - won't work with KIE)
    console.log('[Upload] All external services failed, using base64 fallback (may not work with KIE)');
    const mimeType = file.type || 'image/webp';
    const dataUrl = `data:${mimeType};base64,${base64}`;
    
    console.log('[Upload] Using base64 fallback, URL length:', dataUrl.length);
    return NextResponse.json({ url: dataUrl });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
