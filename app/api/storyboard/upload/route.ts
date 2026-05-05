import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { uploadToR2, getR2PublicUrl } from '@/lib/r2';
import { ConvexHttpClient } from "convex/browser";
import { api } from "@/convex/_generated/api";
import { validateUpload } from '@/lib/upload-validation';

// Allow large file uploads (videos up to 100MB)
export const maxDuration = 120;

export async function POST(request: NextRequest) {
  try {
    // Get authenticated user
    const authResult = await auth();
    console.log('[Storyboard Upload] Full auth result:', {
      hasUserId: !!authResult.userId,
      hasOrgId: !!authResult.orgId,
      userId: authResult.userId?.substring(0, 10) + '...',
      orgId: authResult.orgId?.substring(0, 10) + '...',
      hasToken: !!(authResult as Record<string, unknown>).token,
      tokenLength: ((authResult as Record<string, unknown>).token as string | undefined)?.length || 0,
      tokenStart: ((authResult as Record<string, unknown>).token as string | undefined)?.substring(0, 20) + '...'
    });

    const { userId, orgId } = authResult;

    // Initialize Convex client without auth (API route is already authenticated)
    const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
    console.log('[Storyboard Upload] Convex client initialized without auth token (API route handles auth)');
    if (!userId) {
      console.log('[Storyboard Upload] No userId found in auth');
      return NextResponse.json({ error: 'Unauthorized - no user ID' }, { status: 401 });
    }

    // Get company ID - use orgId if available (organization mode), otherwise use userId (personal mode)
    let companyId: string;
    if (orgId) {
      // User is in organization mode
      companyId = orgId;
      console.log('[Storyboard Upload] Using organization ID:', companyId);
    } else {
      // User is in personal mode - use userId as companyId
      companyId = userId;
      console.log('[Storyboard Upload] Using personal account ID:', companyId);
    }

    if (!companyId) {
      console.log('[Storyboard Upload] No companyId could be determined');
      return NextResponse.json({ error: 'Unauthorized - no company ID' }, { status: 401 });
    }

    console.log('[Storyboard Upload] Authentication successful, companyId:', companyId);

    let formData: FormData;
    try {
      formData = await request.formData();
    } catch (parseError) {
      console.error('[Storyboard Upload] Failed to parse FormData:', parseError);
      return NextResponse.json(
        { success: false, error: 'Failed to parse body as FormData. The file may be too large (max ~50MB via this route).' },
        { status: 413 }
      );
    }
    let file = formData.get('file') as File | null;
    const useTemp = formData.get('useTemp') as string;
    const noLog = formData.get('noLog') === '1';
    const projectId = formData.get('projectId') as string;
    const categoryParam = formData.get('category') as string;
    const explicitPath = formData.get('path') as string;
    const providedCompanyId = formData.get('companyId') as string;
    const sourceUrl = formData.get('sourceUrl') as string;
    const sourceFilename = formData.get('sourceFilename') as string;
    const sourceMimeType = formData.get('sourceMimeType') as string;

    if (providedCompanyId && providedCompanyId !== 'undefined' && providedCompanyId !== 'null') {
      companyId = providedCompanyId;
      console.log('[Storyboard Upload] Using client-provided company ID:', companyId);
    }
    
    if (!file && sourceUrl) {
      console.log('[Storyboard Upload] Fetching source URL on server:', sourceUrl);
      const sourceResponse = await fetch(sourceUrl);
      if (!sourceResponse.ok) {
        return NextResponse.json({ error: `Failed to fetch sourceUrl: ${sourceResponse.status} ${sourceResponse.statusText}` }, { status: 400 });
      }

      const sourceBlob = await sourceResponse.blob();
      const derivedFilename = sourceFilename || sourceUrl.split('/').pop() || 'upload.png';
      const derivedMimeType = sourceMimeType || sourceBlob.type || 'image/png';
      file = new File([sourceBlob], derivedFilename, { type: derivedMimeType });
    }

    if (!file) {
      return NextResponse.json({ error: 'No file or sourceUrl provided' }, { status: 400 });
    }

    // Validate file type and size
    const validation = validateUpload(file.type, file.name, file.size);
    if (!validation.valid) {
      return NextResponse.json({ error: validation.error }, { status: 400 });
    }

    console.log('[Storyboard Upload] Uploading file:', {
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      useTemp: useTemp === 'true',
      category: categoryParam,
      companyId: companyId
    });

    // Determine upload path based on category or useTemp flag
    let uploadPath: string;
    let category: string;
    let isTemporary: boolean;
    let expiresAt: Date | undefined;

    if (explicitPath && explicitPath !== 'undefined' && explicitPath !== 'null') {
      uploadPath = explicitPath.includes('/')
        ? `${explicitPath}/${file.name}`
        : `${explicitPath}/${Date.now()}-${file.name}`;
      category = explicitPath.startsWith('temps') ? 'temps' : explicitPath.split('/').pop() || 'uploads';
      isTemporary = explicitPath.startsWith('temps');
      expiresAt = isTemporary
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : undefined;
      console.log('[Storyboard Upload] Using explicit path override:', uploadPath);
    } else if (useTemp === 'true') {
      // Upload to temps folder with 30-day TTL as per plan_file.md
      const timestamp = Date.now();
      uploadPath = `temps/${timestamp}-${file.name}`;
      category = 'temps';
      isTemporary = true;
      expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
      console.log('[Storyboard Upload] Using temps folder with 30-day TTL:', uploadPath);
    } else if (categoryParam && ['elements', 'storyboard', 'videos'].includes(categoryParam)) {
      // Category-specific upload to {companyId}/{category}/
      const timestamp = Date.now();
      uploadPath = `${companyId}/${categoryParam}/${timestamp}-${file.name}`;
      category = categoryParam;
      isTemporary = false;
      console.log('[Storyboard Upload] Using category-specific path:', uploadPath);
    } else if (categoryParam === 'generated') {
      // For AI-generated files, don't create R2 keys until actual file is generated
      // We'll create the R2 key when the callback returns the actual file
      // Still log to Convex database but without R2 key
      // The R2 key will be created later when the actual file is available
      const logData: any = {
        companyId, // Pass the calculated companyId
        orgId: orgId || undefined, // Add orgId from auth
        uploadedAt: Date.now(),
        createdAt: Date.now(),
        filename: file.name,
        fileType: file.type,
        mimeType: file.type,
        category: 'generated',
        isFavorite: false,
        // r2Key omitted for generated files until actual file is available
        sourceUrl: null,
        creditsUsed: 0, // Will be set when credits are deducted
        taskId: null, // Will be set when taskId is available
      };
      
      // Log to Convex database without R2 key
      const { ConvexHttpClient } = await import("convex/browser");
      const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
      const { api } = await import("@/convex/_generated/api");
      
      const result = await convex.mutation(api.storyboard.storyboardFiles.logUpload, logData);
      console.log('[Storyboard Upload] Generated file record (no R2 key):', { fileId: result });
      
      return NextResponse.json({ 
        fileId: result, 
        url: null, // No URL until file is generated
        category: 'generated',
        isTemporary: false
      });
    } else {
      // Default to uploads folder for permanent storage
      const timestamp = Date.now();
      uploadPath = `${companyId}/uploads/${timestamp}-${file.name}`;
      category = 'uploads';
      isTemporary = false;
      console.log('[Storyboard Upload] Using default uploads folder:', uploadPath);
    }

    // Upload to R2
    const r2Key = await uploadToR2(file, uploadPath);
    const publicUrl = getR2PublicUrl(r2Key);

    console.log('[Storyboard Upload] Upload successful:', {
      r2Key,
      publicUrl,
      category,
      isTemporary,
      expiresAt: expiresAt?.toISOString()
    });

    // Log file to Convex database (skipped for noLog uploads like crop thumbnails)
    if (noLog) {
      return NextResponse.json({
        success: true,
        r2Key,
        publicUrl,
        category,
        isTemporary,
        expiresAt: expiresAt?.toISOString(),
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
        companyId,
      });
    }

    try {
      // Parse tags from FormData if provided
      let tags = [];
      const tagsString = formData.get('tags');
      if (tagsString) {
        try {
          tags = JSON.parse(tagsString as string);
          console.log('[Storyboard Upload] Parsed tags successfully:', tags);
        } catch (e) {
          console.warn('[Storyboard Upload] Failed to parse tags:', tagsString);
        }
      }

      const logData: any = {
        companyId, // Pass the calculated companyId
        orgId: orgId || undefined, // Add orgId from auth
        userId: userId, // Add userId from auth
        r2Key,
        filename: file.name,
        fileType: (() => {
          const mime = file.type.toLowerCase();
          const ext = file.name.toLowerCase().split('.').pop() || '';
          const audioExtensions = ['mp3', 'wav', 'ogg', 'aac', 'm4a', 'flac', 'wma'];
          if (mime.startsWith('audio/') || audioExtensions.includes(ext)) return 'audio';
          if (mime.startsWith('image/')) return 'image';
          if (mime.startsWith('video/') || ext === 'mp4' || ext === 'webm' || ext === 'mov') return 'video';
          // MPEG can be audio or video — check extension
          if (ext === 'mpeg' || ext === 'mpg') return mime.includes('audio') ? 'audio' : 'audio';
          return 'file';
        })(),
        mimeType: file.type,
        size: file.size,
        category,
        tags: tags, // Use parsed tags
        uploadedBy: userId,
        status: isTemporary ? 'temporary' : 'active'
      };
      
      // Add projectId if provided
      if (projectId) {
        logData.projectId = projectId;
      }
      
      console.log('[Storyboard Upload] About to log to database with data:', logData);
      
      try {
        const result = await convex.mutation(api.storyboard.storyboardFiles.logUpload, logData);
        console.log('[Storyboard Upload] File logged to database successfully. Result:', result);
        console.log('[Storyboard Upload] File ID:', result);
      } catch (convexError) {
        console.error('[Storyboard Upload] Convex mutation failed:', convexError);
        console.error('[Storyboard Upload] Convex error details:', {
          message: convexError instanceof Error ? convexError.message : String(convexError),
          stack: convexError instanceof Error ? convexError.stack : undefined,
          name: convexError instanceof Error ? convexError.name : undefined
        });
        throw convexError;
      }
    } catch (dbError) {
      console.error('[Storyboard Upload] Failed to log file to database:', dbError);
      // Continue with response even if database logging fails
    }

    return NextResponse.json({
      success: true,
      r2Key,
      publicUrl,
      category,
      isTemporary,
      expiresAt: expiresAt?.toISOString(),
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      companyId // Include companyId for reference
    });

  } catch (error) {
    console.error('[Storyboard Upload] Error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed' 
      },
      { status: 500 }
    );
  }
}
