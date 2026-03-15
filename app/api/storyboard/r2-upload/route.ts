import { NextRequest, NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { auth } from "@clerk/nextjs/server";
import { ConvexHttpClient } from "convex/browser";
import { getServerCurrentCompanyId, getServerUser } from "@/lib/auth-utils-server";
import { logUserInfo } from "@/lib/auth-utils";

const r2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.CLOUDFLARE_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

const BUCKET = process.env.R2_BUCKET_NAME ?? "storyboardbucket";
const PUBLIC_URL = process.env.R2_PUBLIC_URL ?? "";

// ✅ Add environment validation
if (!process.env.CLOUDFLARE_ACCOUNT_ID) {
  console.error("[r2-upload] MISSING: CLOUDFLARE_ACCOUNT_ID");
}
if (!process.env.R2_ACCESS_KEY_ID) {
  console.error("[r2-upload] MISSING: R2_ACCESS_KEY_ID");
}
if (!process.env.R2_SECRET_ACCESS_KEY) {
  console.error("[r2-upload] MISSING: R2_SECRET_ACCESS_KEY");
}
if (!process.env.R2_BUCKET_NAME) {
  console.error("[r2-upload] MISSING: R2_BUCKET_NAME");
}
if (!process.env.R2_PUBLIC_URL) {
  console.error("[r2-upload] MISSING: R2_PUBLIC_URL");
}

console.log("[r2-upload] Environment check:", {
  hasAccountId: !!process.env.CLOUDFLARE_ACCOUNT_ID,
  hasAccessKey: !!process.env.R2_ACCESS_KEY_ID,
  hasSecretKey: !!process.env.R2_SECRET_ACCESS_KEY,
  hasBucketName: !!process.env.R2_BUCKET_NAME,
  hasPublicUrl: !!process.env.R2_PUBLIC_URL,
  bucket: BUCKET,
  publicUrl: PUBLIC_URL
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[r2-upload] Request body:", body);
    
    const { projectId, filename, mimeType, contentType, category, companyId } = body;

    // Support both mimeType and contentType for compatibility
    const actualMimeType = mimeType || contentType;

    if (!filename || !actualMimeType) {
      console.log("[r2-upload] Missing required fields:", { filename, mimeType, contentType });
      return NextResponse.json({ error: "Missing filename or mimeType" }, { status: 400 });
    }

    // Get user and verify organization access
    const { userId } = await auth();
    if (!userId) {
      console.log("[r2-upload] No userId found in auth");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    console.log("[r2-upload] Authenticated userId:", userId);

    // Get user's organization data to validate the provided companyId
    const user = await getServerUser(userId);
    
    // ✅ Use server-side companyId function from Clerk authentication
    const userCompanyId = getServerCurrentCompanyId({ userId });
    
    // Log user info for debugging
    logUserInfo(user, "R2Upload");
    
    console.log("[r2-upload] CompanyId validation from Clerk:", {
      userId,
      userCompanyId,
      providedCompanyId: companyId,
      matches: userCompanyId === companyId,
      isPersonalAccount: userCompanyId === userId
    });

    let key: string;
    
    // If projectId is provided, verify project access and use organization-based folder structure
    if (projectId) {
      try {
        // Get project to verify organization access
        const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
        const project = await convex.query.api.storyboard.projects.get({ projectId });
        
        if (!project) {
          return NextResponse.json({ error: "Project not found" }, { status: 404 });
        }

        const ext = filename.split(".").pop() ?? "";
        // ✅ Use server-side companyId function
        const finalCompanyId = companyId || userCompanyId;
        key = `${finalCompanyId}/${category ?? "uploads"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
        
        console.log("[r2-upload] Project upload path:", { 
          projectId,
          finalCompanyId,
          category: category ?? "uploads",
          key 
        });
      } catch (error) {
        console.error("[r2-upload] Error verifying project:", error);
        return NextResponse.json({ error: "Failed to verify project" }, { status: 403 });
      }
    } else {
      // For direct uploads without projectId (like element references)
      // ✅ Use server-side companyId function
      const finalCompanyId = companyId || userCompanyId;
      const ext = filename.split(".").pop() ?? "";
      key = `${finalCompanyId}/${category ?? "uploads"}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
      
      console.log("[r2-upload] Direct upload path:", { 
        userId, 
        providedCompanyId: companyId,
        userCompanyId,
        finalCompanyId, 
        category: category ?? "uploads",
        key 
      });
    }

    const command = new PutObjectCommand({
      Bucket: BUCKET,
      Key: key,
      ContentType: actualMimeType,
    });

    console.log("[r2-upload] Creating signed URL:", { bucket: BUCKET, key, contentType: actualMimeType });

    try {
      const uploadUrl = await getSignedUrl(r2, command, { expiresIn: 300 });
      const publicUrl = PUBLIC_URL ? `${PUBLIC_URL}/${key}` : null;

      console.log("[r2-upload] Generated URLs:", { 
        key, 
        hasUploadUrl: !!uploadUrl, 
        hasPublicUrl: !!publicUrl,
        uploadUrlLength: uploadUrl?.length || 0,
        publicUrlLength: publicUrl?.length || 0,
        companyId: key.split("/")[0] // Log the companyId for debugging
      });

      if (!uploadUrl) {
        console.error("[r2-upload] Failed to generate upload URL - getSignedUrl returned null/undefined");
        return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
      }

      return NextResponse.json({ uploadUrl, key, publicUrl });
    } catch (error) {
      console.error("[r2-upload] Error generating signed URL:", error);
      console.error("[r2-upload] Error details:", {
        message: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : 'No stack available',
        name: error instanceof Error ? error.name : 'Unknown',
        bucket: BUCKET,
        key,
        contentType: actualMimeType
      });
      return NextResponse.json({ 
        error: `Failed to generate upload URL: ${error instanceof Error ? error.message : String(error)}` 
      }, { status: 500 });
    }
  } catch (err) {
    console.error("[r2-upload]", err);
    return NextResponse.json({ error: "Failed to generate upload URL" }, { status: 500 });
  }
}
