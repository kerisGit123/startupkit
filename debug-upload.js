// Simple upload test
async function testUpload() {
  try {
    const response = await fetch('/api/storyboard/r2-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        filename: 'test.jpg', 
        contentType: 'image/jpeg',
        projectId: 'test-project-id',
        category: 'uploads'
      }),
    });
    
    const result = await response.json();
    console.log('Upload test result:', result);
  } catch (error) {
    console.error('Upload test error:', error);
  }
}

// Check if required environment variables are set
console.log('Environment check:');
console.log('CLOUDFLARE_ACCOUNT_ID:', process.env.CLOUDFLARE_ACCOUNT_ID ? 'SET' : 'MISSING');
console.log('R2_ACCESS_KEY_ID:', process.env.R2_ACCESS_KEY_ID ? 'SET' : 'MISSING');
console.log('R2_SECRET_ACCESS_KEY:', process.env.R2_SECRET_ACCESS_KEY ? 'SET' : 'MISSING');
console.log('R2_BUCKET_NAME:', process.env.R2_BUCKET_NAME ? 'SET' : 'MISSING');
console.log('R2_PUBLIC_URL:', process.env.R2_PUBLIC_URL ? 'SET' : 'MISSING');
