# Upload Troubleshooting Guide

## 🚨 Common Upload Issues & Solutions

### 1. Environment Variables Missing
Check these are set in your `.env.local`:
```bash
CLOUDFLARE_ACCOUNT_ID=your_account_id
R2_ACCESS_KEY_ID=your_access_key
R2_SECRET_ACCESS_KEY=your_secret_key
R2_BUCKET_NAME=storyboardbucket
R2_PUBLIC_URL=https://pub-xxxx.r2.dev
```

### 2. R2 Bucket Not Created
- Create bucket in Cloudflare R2 dashboard
- Name it exactly `storyboardbucket` (or update R2_BUCKET_NAME)
- Set up public URL if you want images to be accessible

### 3. CORS Issues
Add CORS to your R2 bucket:
```json
[
  {
    "AllowedOrigins": ["http://localhost:3000", "https://your-domain.com"],
    "AllowedMethods": ["GET", "PUT", "POST"],
    "AllowedHeaders": ["*"],
    "MaxAgeSeconds": 3600
  }
]
```

### 4. Test Upload Manually
Open browser console and run:
```javascript
fetch('/api/storyboard/r2-upload', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ 
    filename: 'test.jpg', 
    contentType: 'image/jpeg',
    projectId: 'test-project-id',
    category: 'uploads'
  }),
}).then(r => r.json()).then(console.log).catch(console.error);
```

### 5. Check Network Tab
- Open DevTools → Network
- Try uploading a file
- Look for red requests to `/api/storyboard/r2-upload`
- Check response body for error messages

### 6. Common Error Messages

#### "Missing required fields"
- API isn't receiving filename or contentType
- Check the request payload in Network tab

#### "Failed to generate upload URL"
- Environment variables missing
- R2 credentials invalid
- Bucket doesn't exist

#### "Upload failed" (after getting signed URL)
- Signed URL expired (5 minutes)
- Network issues
- File too large

### 7. Debug Steps

1. **Check Environment Variables**
```bash
# In Next.js route, add this temporarily:
console.log('ENV CHECK:', {
  accountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
  accessKey: !!process.env.R2_ACCESS_KEY_ID,
  secretKey: !!process.env.R2_SECRET_ACCESS_KEY,
  bucket: process.env.R2_BUCKET_NAME,
  publicUrl: process.env.R2_PUBLIC_URL
});
```

2. **Test R2 Connection**
```bash
# Install and test AWS CLI
aws configure
aws s3 ls --endpoint-url https://your-account-id.r2.cloudflarestorage.com
```

3. **Check Bucket Permissions**
- Make sure bucket allows PUT operations
- Verify CORS is configured
- Check if bucket is public (if using public URLs)

### 8. Upload Flow Debugging

The upload process should be:
1. UI calls `/api/storyboard/r2-upload` with file info
2. API returns `uploadUrl` (signed URL) and `publicUrl`
3. UI uploads file directly to R2 using `uploadUrl`
4. UI updates Convex with file metadata
5. UI updates UI with `publicUrl`

If step 1 fails → Check API route
If step 2 fails → Check environment variables
If step 3 fails → Check signed URL and CORS
If step 4 fails → Check Convex connection
If step 5 fails → Check public URL configuration

### 9. Quick Fix Checklist

- [ ] Environment variables set
- [ ] R2 bucket created
- [ ] CORS configured
- [ ] Dependencies installed (`@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`)
- [ ] Next.js dev server restarted after env changes
- [ ] No firewall blocking R2 endpoints
